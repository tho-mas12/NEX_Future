import uuid
from datetime import datetime, timezone
from typing import Annotated, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.database import get_session
from app.routers.deps import get_current_user, get_current_user_optional
from app.models.user import User, TargetExam
from app.models.topic import Topic, SubjectEnum
from app.models.lesson import Lesson
from app.models.question import Question
from app.models.roadmap import RoadmapTemplate
from app.models.progress import UserProgress, ProgressStatus
from app.schemas.dashboard import (
    DiagnosticQuestionResponse,
    OnboardingCompleteRequest,
    OnboardingCompleteResponse,
)
from app.core.curriculum import DIAGNOSTIC_QUESTIONS, SYLLABUS_MODULES

router = APIRouter(prefix="/onboarding", tags=["Onboarding"])

@router.get("/diagnostic", response_model=List[DiagnosticQuestionResponse])
async def get_diagnostic_questions(
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: Annotated[Optional[User], Depends(get_current_user_optional)] = None
):
    """
    Returns the 10 diagnostic baseline questions across Quant, Reasoning, English, and GA.
    """
    questions_out: List[DiagnosticQuestionResponse] = []
    
    # Check if diagnostic topic exists
    stmt = select(Topic).where(Topic.title == "Diagnostic Baseline Assessment")
    res = await session.exec(stmt)
    diag_topic = res.first()

    if not diag_topic:
        diag_topic = Topic(
            subject=SubjectEnum.QUANT,
            title="Diagnostic Baseline Assessment",
            youtube_embed_id="dQw4w9WgXcQ",
            pdf_url="https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
        )
        session.add(diag_topic)
        await session.commit()
        await session.refresh(diag_topic)

    # Ensure baseline lesson exists under diagnostic topic
    l_stmt = select(Lesson).where(Lesson.topic_id == diag_topic.id)
    l_res = await session.exec(l_stmt)
    diag_lesson = l_res.first()
    if not diag_lesson:
        diag_lesson = Lesson(
            topic_id=diag_topic.id,
            title="Diagnostic Baseline Assessment",
            day_sequence=0,
            youtube_embed_id="dQw4w9WgXcQ"
        )
        session.add(diag_lesson)
        await session.commit()
        await session.refresh(diag_lesson)

    q_stmt = select(Question).where(
        (Question.topic_id == diag_topic.id) | (Question.lesson_id == diag_lesson.id)
    ).limit(10)
    q_res = await session.exec(q_stmt)
    questions = q_res.all()

    if len(questions) == 0:
        for q_data in DIAGNOSTIC_QUESTIONS:
            q = Question(
                lesson_id=diag_lesson.id,
                topic_id=diag_topic.id,
                question_text=q_data["question_text"],
                opt_a=q_data["opt_a"],
                opt_b=q_data["opt_b"],
                opt_c=q_data["opt_c"],
                opt_d=q_data["opt_d"],
                correct_opt=q_data["correct_opt"],
                explanation=q_data["explanation"]
            )
            session.add(q)
            await session.commit()
            await session.refresh(q)
            questions_out.append(
                DiagnosticQuestionResponse(
                    id=q.id,
                    subject=q_data["subject"],
                    question_text=q.question_text,
                    opt_a=q.opt_a,
                    opt_b=q.opt_b,
                    opt_c=q.opt_c,
                    opt_d=q.opt_d,
                    correct_opt=q.correct_opt,
                    explanation=q.explanation
                )
            )
    else:
        for idx, q in enumerate(questions):
            subj = DIAGNOSTIC_QUESTIONS[idx % len(DIAGNOSTIC_QUESTIONS)]["subject"]
            questions_out.append(
                DiagnosticQuestionResponse(
                    id=q.id,
                    subject=subj,
                    question_text=q.question_text,
                    opt_a=q.opt_a,
                    opt_b=q.opt_b,
                    opt_c=q.opt_c,
                    opt_d=q.opt_d,
                    correct_opt=q.correct_opt,
                    explanation=q.explanation
                )
            )

    return questions_out


@router.post("/complete", response_model=OnboardingCompleteResponse)
async def complete_onboarding(
    req: OnboardingCompleteRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)]
):
    """
    Finalizes user onboarding:
    1. Updates target_exam, exam_date, and marks onboarding_completed = True
    2. Builds/ensures 180-day RoadmapTemplate for that exam
    3. Clones the 180-day RoadmapTemplate into UserProgress for this user
    """
    current_user.target_exam = req.target_exam
    current_user.exam_date = req.exam_date
    current_user.onboarding_completed = True
    current_user.last_login = datetime.now(timezone.utc)
    session.add(current_user)

    # 1. Ensure RoadmapTemplate has 180 days for this target exam
    tpl_stmt = select(RoadmapTemplate).where(RoadmapTemplate.exam_type == req.target_exam)
    tpl_res = await session.exec(tpl_stmt)
    existing_templates = tpl_res.all()

    if len(existing_templates) < 180:
        # Cache or create topics for syllabus modules
        module_topics: List[Topic] = []
        for subj, title, yt_id in SYLLABUS_MODULES:
            t_stmt = select(Topic).where(Topic.title == title)
            t_res = await session.exec(t_stmt)
            topic = t_res.first()
            if not topic:
                topic = Topic(
                    subject=subj,
                    title=title,
                    youtube_embed_id=yt_id,
                    pdf_url="/static/notes/notes.pdf",
                    weightage_score=1.5
                )
                session.add(topic)
                await session.commit()
                await session.refresh(topic)
            module_topics.append(topic)

        # Build missing days up to 180
        existing_days = {t.day_number for t in existing_templates}
        for day in range(1, 181):
            if day not in existing_days:
                topic = module_topics[(day - 1) % len(module_topics)]
                tpl = RoadmapTemplate(
                    exam_type=req.target_exam,
                    day_number=day,
                    topic_id=topic.id
                )
                session.add(tpl)
        await session.commit()

        # Re-fetch templates
        tpl_res = await session.exec(
            select(RoadmapTemplate)
            .where(RoadmapTemplate.exam_type == req.target_exam)
            .order_by(RoadmapTemplate.day_number)
        )
        existing_templates = tpl_res.all()

    # 2. Clear any prior progress and copy 180 days into UserProgress
    del_stmt = select(UserProgress).where(UserProgress.user_id == current_user.id)
    del_res = await session.exec(del_stmt)
    for p in del_res.all():
        await session.delete(p)

    user_progress_items = []
    for tpl in existing_templates:
        item = UserProgress(
            user_id=current_user.id,
            day_number=tpl.day_number,
            topic_id=tpl.topic_id,
            video_done=False,
            pdf_done=False,
            quiz_score=0,
            status=ProgressStatus.PENDING
        )
        user_progress_items.append(item)
        session.add(item)

    await session.commit()

    return OnboardingCompleteResponse(
        success=True,
        message="Onboarding successfully completed and 180-day roadmap generated.",
        total_days_generated=len(user_progress_items)
    )
