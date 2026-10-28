import uuid
from datetime import datetime, timezone, timedelta
from typing import Annotated, List, Dict, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.database import get_session
from app.routers.deps import get_current_user
from app.models.user import User
from app.models.settings import GlobalSettings
from app.models.topic import Topic
from app.models.lesson import Lesson
from app.models.question import Question
from app.models.progress import UserProgress, ProgressStatus
from app.models.revision import RevisionSchedule, RevisionStatus
from app.models.mistake import MistakeNotebook
from app.schemas.study import (
    StudyDayResponse,
    StudyTopicDetail,
    StudyQuestion,
    StudyProgressUpdateRequest,
    MarkDayCompleteRequest,
    MarkDayCompleteResponse,
    MockArenaStartResponse,
    MockQuestion,
    MockSubmitRequest,
    MockSubmitResponse,
    SubjectScore,
)
from app.core.mock_pool import SAMPLE_TOPIC_MCQS, generate_mock_questions

router = APIRouter(tags=["Study & Mock Arena"])

async def get_settings_obj(session: AsyncSession) -> GlobalSettings:
    res = await session.exec(select(GlobalSettings).where(GlobalSettings.id == 1))
    s = res.first()
    if not s:
        s = GlobalSettings(id=1, mock_timer_mins=15, mock_q_count=25, revision_pass_percent=80, revision_deadline_days=2, daily_main_topics_count=2)
        session.add(s)
        await session.commit()
        await session.refresh(s)
    return s

# ----------------------------------------------------
# 3-STAGE STUDY PLAYER API (BY LESSON ID OR DAY NUMBER)
# ----------------------------------------------------

@router.get("/study/lesson/{lesson_id}")
async def get_study_lesson_detail(
    lesson_id: str,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)]
):
    """
    Fetches the 3-stage study payload:
    Stage 1: Video & Notes
    Stage 2: 20 Active Recall Questions with Short Tricks
    Stage 3: 25 TCS 2026 Simulator Questions with timer
    """
    settings_obj = await get_settings_obj(session)
    lesson = None

    # Try parsing as UUID first
    try:
        lid_uuid = uuid.UUID(lesson_id)
        stmt = (
            select(Lesson, Topic)
            .join(Topic, Lesson.topic_id == Topic.id)
            .where(Lesson.id == lid_uuid)
        )
        res = await session.exec(stmt)
        row = res.first()
        if row:
            lesson, topic = row
    except ValueError:
        pass

    # Fallback to day_sequence or first lesson
    if not lesson:
        try:
            day_num = int(lesson_id)
            stmt = (
                select(Lesson, Topic)
                .join(Topic, Lesson.topic_id == Topic.id)
                .where(Lesson.day_sequence == day_num)
            )
            row = (await session.exec(stmt)).first()
            if row:
                lesson, topic = row
        except ValueError:
            pass

    if not lesson:
        row = (await session.exec(select(Lesson, Topic).join(Topic, Lesson.topic_id == Topic.id).limit(1))).first()
        if row:
            lesson, topic = row
        else:
            raise HTTPException(status_code=404, detail="No lesson available")

    # Fetch 20 Practice Questions with short tricks
    q_stmt = select(Question).where(Question.lesson_id == lesson.id).limit(20)
    practice_qs = (await session.exec(q_stmt)).all()

    if len(practice_qs) < 20:
        practice_qs = (await session.exec(select(Question).limit(20))).all()

    practice_out = [
        {
            "id": str(q.id),
            "question_text": q.question_text,
            "opt_a": q.opt_a,
            "opt_b": q.opt_b,
            "opt_c": q.opt_c,
            "opt_d": q.opt_d,
            "correct_opt": q.correct_opt,
            "explanation": q.explanation,
            "short_trick": q.short_trick or lesson.short_trick_notes or "Apply Vedic shortcut / value-putting"
        }
        for q in practice_qs[:20]
    ]

    # Simulator Questions (mock_q_count, default 25)
    sim_count = settings_obj.mock_q_count
    sim_qs = (await session.exec(select(Question).limit(sim_count))).all()
    sim_out = [
        {
            "id": str(q.id),
            "question_text": q.question_text,
            "opt_a": q.opt_a,
            "opt_b": q.opt_b,
            "opt_c": q.opt_c,
            "opt_d": q.opt_d,
            "correct_opt": q.correct_opt,
            "explanation": q.explanation,
            "short_trick": q.short_trick
        }
        for q in sim_qs[:sim_count]
    ]

    return {
        "lesson": {
            "id": str(lesson.id),
            "title": lesson.title,
            "subject": topic.subject.value,
            "topic_title": topic.title,
            "stage": topic.stage,
            "youtube_embed_id": lesson.youtube_embed_id,
            "pdf_url": lesson.pdf_url,
            "short_trick_notes": lesson.short_trick_notes,
        },
        "settings": {
            "mock_timer_mins": settings_obj.mock_timer_mins,
            "mock_q_count": settings_obj.mock_q_count,
            "revision_deadline_days": settings_obj.revision_deadline_days,
        },
        "practice_questions": practice_out,
        "simulator_questions": sim_out
    }


@router.post("/study/lesson/{lesson_id}/submit-simulator")
async def submit_tcs_simulator(
    lesson_id: str,
    payload: Dict,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)]
):
    """
    Submits Stage 3 TCS 2026 15-minute simulator:
    1. Evaluates 25 questions (+2.0 correct, -0.5 wrong)
    2. Logs mistakes into MistakeNotebook
    3. Marks lesson complete and increments streak
    4. Automatically initializes the +3 Day RevisionSchedule!
    """
    raw_answers = payload.get("answers", {})
    answers: Dict[str, str] = {}
    if isinstance(raw_answers, dict):
        answers = {str(k): str(v) for k, v in raw_answers.items()}
    elif isinstance(raw_answers, list):
        for item in raw_answers:
            if isinstance(item, dict):
                qid = str(item.get("question_id") or item.get("id"))
                opt = str(item.get("selected_opt") or item.get("choice") or "")
                answers[qid] = opt

    settings_obj = await get_settings_obj(session)

    # Resolve lesson
    lesson = None
    try:
        lid_uuid = uuid.UUID(lesson_id)
        lesson = (await session.exec(select(Lesson).where(Lesson.id == lid_uuid))).first()
    except ValueError:
        pass

    if not lesson:
        lesson = (await session.exec(select(Lesson).limit(1))).first()

    # Grade questions
    sim_count = settings_obj.mock_q_count
    if lesson:
        questions = (await session.exec(select(Question).where(Question.lesson_id == lesson.id).limit(sim_count))).all()
        if len(questions) < sim_count:
            fallback = (await session.exec(select(Question).limit(sim_count))).all()
            questions = (questions + fallback)[:sim_count]
    else:
        questions = (await session.exec(select(Question).limit(sim_count))).all()

    correct_count = 0
    wrong_count = 0
    unanswered_count = 0
    mistakes = []

    for q in questions:
        qid_str = str(q.id)
        user_choice = answers.get(qid_str)

        if not user_choice:
            unanswered_count += 1
        elif user_choice.strip().upper() == q.correct_opt.strip().upper():
            correct_count += 1
        else:
            wrong_count += 1
            mistakes.append({
                "question_id": qid_str,
                "question_text": q.question_text,
                "user_choice": user_choice,
                "correct_opt": q.correct_opt,
                "explanation": q.explanation,
                "short_trick": q.short_trick
            })

            # Record into MistakeNotebook
            mistake_entry = MistakeNotebook(
                user_id=current_user.id,
                question_id=q.id,
                user_wrong_choice=user_choice,
                review_count=1,
                mastered=False
            )
            session.add(mistake_entry)

    total_score = max((correct_count * 2.0) - (wrong_count * 0.5), 0.0)
    max_score = len(questions) * 2.0

    # Increment streak
    current_user.streak_count += 1
    current_user.last_activity_date = datetime.now(timezone.utc)
    session.add(current_user)

    # AUTOMATICALLY INITIALIZE +3 DAY REVISION SCHEDULE
    now = datetime.now(timezone.utc)
    sched_date = now + timedelta(days=3)
    deadline_date = sched_date + timedelta(days=settings_obj.revision_deadline_days)

    if lesson:
        rev_entry = RevisionSchedule(
            user_id=current_user.id,
            lesson_id=lesson.id,
            interval_days=3,
            scheduled_for=sched_date,
            deadline=deadline_date,
            status=RevisionStatus.PENDING,
            current_stage=1
        )
        session.add(rev_entry)

    # Also update UserProgress if existing
    first_prog = (await session.exec(
        select(UserProgress)
        .where(UserProgress.user_id == current_user.id)
        .where(UserProgress.status == ProgressStatus.PENDING)
        .limit(1)
    )).first()

    if first_prog:
        first_prog.status = ProgressStatus.COMPLETED
        first_prog.video_done = True
        first_prog.pdf_done = True
        first_prog.quiz_score = int(total_score)
        first_prog.completed_at = now
        session.add(first_prog)

    await session.commit()

    percentage = round((correct_count / max(len(questions), 1)) * 100, 1)
    attempted = correct_count + wrong_count
    accuracy = round((correct_count / max(attempted, 1)) * 100, 1)

    return {
        "success": True,
        "score": total_score,
        "total_score": total_score,
        "max_score": max_score,
        "percentage": percentage,
        "accuracy": accuracy,
        "correct_count": correct_count,
        "wrong_count": wrong_count,
        "incorrect_count": wrong_count,
        "unanswered_count": unanswered_count,
        "new_streak": current_user.streak_count,
        "passed_cutoff": percentage >= settings_obj.revision_pass_percent,
        "revision_scheduled": {
            "interval_days": 3,
            "scheduled_for": sched_date.strftime("%b %d, %Y"),
            "deadline": deadline_date.strftime("%b %d, %Y"),
        },
        "mistakes": mistakes
    }


# Backwards compatible /study/{day_number}
@router.get("/study/{day_number}", response_model=StudyDayResponse)
async def get_study_day(
    day_number: int,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)]
):
    stmt = (
        select(UserProgress, Topic)
        .join(Topic, UserProgress.topic_id == Topic.id)
        .where(UserProgress.user_id == current_user.id)
        .where(UserProgress.day_number == day_number)
    )
    res = await session.exec(stmt)
    row = res.first()

    if not row:
        from app.models.roadmap import RoadmapTemplate
        from app.models.user import TargetExam
        exam_type = current_user.target_exam or TargetExam.CGL

        tpl_stmt = select(RoadmapTemplate).where(
            RoadmapTemplate.exam_type == exam_type,
            RoadmapTemplate.day_number == day_number
        )
        tpl_res = await session.exec(tpl_stmt)
        tpl = tpl_res.first()

        if tpl:
            topic_id = tpl.topic_id
        else:
            first_topic = (await session.exec(select(Topic).limit(1))).first()
            if not first_topic:
                first_topic = Topic(subject="Quant", title=f"Syllabus Topic - Day {day_number}", weightage_score=2.0)
                session.add(first_topic)
                await session.commit()
                await session.refresh(first_topic)
            topic_id = first_topic.id

        progress = UserProgress(
            user_id=current_user.id,
            day_number=day_number,
            topic_id=topic_id,
            video_done=False,
            pdf_done=False,
            quiz_score=0,
            status=ProgressStatus.PENDING
        )
        session.add(progress)
        await session.commit()
        await session.refresh(progress)

        t_res = await session.exec(select(Topic).where(Topic.id == topic_id))
        topic = t_res.first()
    else:
        progress, topic = row

    # Fetch questions for this topic or lessons
    questions_db = (await session.exec(select(Question).limit(15))).all()

    questions_out = [
        StudyQuestion(
            id=q.id,
            question_text=q.question_text,
            opt_a=q.opt_a,
            opt_b=q.opt_b,
            opt_c=q.opt_c,
            opt_d=q.opt_d,
            correct_opt=q.correct_opt,
            explanation=q.explanation
        )
        for q in questions_db[:15]
    ]

    return StudyDayResponse(
        day_number=progress.day_number,
        topic=StudyTopicDetail(
            id=topic.id,
            subject=topic.subject.value,
            title=topic.title,
            youtube_embed_id="dQw4w9WgXcQ",
            pdf_url="/static/notes/notes.pdf"
        ),
        video_done=progress.video_done,
        pdf_done=progress.pdf_done,
        quiz_score=progress.quiz_score,
        status=progress.status,
        questions=questions_out
    )


# ----------------------------------------------------
# WEEKEND MOCK ARENA ENDPOINTS (TCS 2026 PATTERN)
# ----------------------------------------------------

MOCK_STORE = generate_mock_questions()

@router.get("/mock-arena/paper", response_model=MockArenaStartResponse)
async def get_mock_paper(
    current_user: Annotated[User, Depends(get_current_user)]
):
    questions_out = [
        MockQuestion(
            id=q["id"],
            subject=q["subject"],
            question_text=q["question_text"],
            opt_a=q["opt_a"],
            opt_b=q["opt_b"],
            opt_c=q["opt_c"],
            opt_d=q["opt_d"]
        )
        for q in MOCK_STORE
    ]

    return MockArenaStartResponse(
        test_id="ssc-tier1-fullmock-01",
        title=f"All-India Weekend Mock Arena - SSC {current_user.target_exam.value if current_user.target_exam else 'CGL'}",
        duration_seconds=3600,
        total_questions=100,
        questions=questions_out
    )


@router.post("/mock-arena/submit", response_model=MockSubmitResponse)
async def submit_mock_paper(
    req: MockSubmitRequest,
    current_user: Annotated[User, Depends(get_current_user)]
):
    subject_map: Dict[str, Dict[str, int]] = {
        "Quantitative Aptitude": {"correct": 0, "incorrect": 0, "unanswered": 0},
        "General Intelligence & Reasoning": {"correct": 0, "incorrect": 0, "unanswered": 0},
        "English Comprehension": {"correct": 0, "incorrect": 0, "unanswered": 0},
        "General Awareness": {"correct": 0, "incorrect": 0, "unanswered": 0},
    }

    total_correct = 0
    total_incorrect = 0

    for q in MOCK_STORE:
        q_id = q["id"]
        subj = q["subject"]
        user_choice = req.answers.get(q_id)

        if not user_choice:
            subject_map[subj]["unanswered"] += 1
        elif user_choice.upper() == q["correct_opt"].upper():
            subject_map[subj]["correct"] += 1
            total_correct += 1
        else:
            subject_map[subj]["incorrect"] += 1
            total_incorrect += 1

    total_score = max((total_correct * 2.0) - (total_incorrect * 0.5), 0.0)

    breakdown: List[SubjectScore] = []
    for subj, data in subject_map.items():
        marks = round((data["correct"] * 2.0) - (data["incorrect"] * 0.5), 2)
        breakdown.append(
            SubjectScore(
                subject=subj,
                correct=data["correct"],
                incorrect=data["incorrect"],
                unanswered=data["unanswered"],
                marks=max(marks, 0.0)
            )
        )

    percentile = round(min(80.0 + (total_score / 200.0) * 19.9, 99.9), 1)
    total_attempted = total_correct + total_incorrect
    accuracy = round((total_correct / max(total_attempted, 1)) * 100, 1)

    return MockSubmitResponse(
        total_score=total_score,
        max_score=200.0,
        accuracy=accuracy,
        percentile=percentile,
        subject_breakdown=breakdown,
        summary_message=f"Scored {total_score}/200 with {accuracy}% accuracy. Standing at {percentile}th percentile."
    )
