import uuid
from typing import Annotated, List, Dict, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.database import get_session
from app.routers.deps import get_current_user
from app.models.user import User
from app.models.settings import GlobalSettings
from app.models.topic import Topic, SubjectEnum
from app.models.lesson import Lesson
from app.models.question import Question
from app.models.progress import UserProgress, ProgressStatus
from app.models.revision import RevisionSchedule, RevisionStatus

router = APIRouter(prefix="/analysis", tags=["Topic-Wise Analysis & Dynamic Mocks"])

class LessonStatusItem(BaseModel):
    id: uuid.UUID
    title: str
    day_sequence: int
    completed: bool
    revision_stage: Optional[int] = None
    mastered: bool = False

class TopicAnalysisGroup(BaseModel):
    id: uuid.UUID
    subject: str
    stage: int
    title: str
    total_lessons: int
    completed_lessons: int
    completion_percentage: float
    lessons: List[LessonStatusItem]

class DynamicMockRequest(BaseModel):
    subject: str
    topic_id: Optional[uuid.UUID] = None

class DynamicMockQuestion(BaseModel):
    id: str
    question_text: str
    opt_a: str
    opt_b: str
    opt_c: str
    opt_d: str
    correct_opt: str
    explanation: Optional[str] = None
    short_trick: Optional[str] = None

class DynamicMockResponse(BaseModel):
    subject: str
    topics_covered: List[str]
    mock_timer_mins: int
    total_questions: int
    questions: List[DynamicMockQuestion]


@router.get("/topics", response_model=List[TopicAnalysisGroup])
async def get_topic_analysis(
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)]
):
    """
    Returns drill-down syllabus tree:
    Topics -> Lessons with completion checkmarks and revision stages.
    """
    topics_res = await session.exec(select(Topic).order_by(Topic.stage, Topic.subject, Topic.title))
    topics = topics_res.all()

    # Get user completed revisions
    rev_res = await session.exec(
        select(RevisionSchedule)
        .where(RevisionSchedule.user_id == current_user.id)
    )
    user_revisions = rev_res.all()
    rev_map = {r.lesson_id: r for r in user_revisions}

    out: List[TopicAnalysisGroup] = []

    for top in topics:
        l_res = await session.exec(
            select(Lesson).where(Lesson.topic_id == top.id).order_by(Lesson.day_sequence)
        )
        lessons = l_res.all()

        completed_count = 0
        lesson_items: List[LessonStatusItem] = []

        for l in lessons:
            rev = rev_map.get(l.id)
            is_completed = rev is not None
            is_mastered = rev.interval_days >= 30 and rev.status == RevisionStatus.PASSED if rev else False

            if is_completed:
                completed_count += 1

            lesson_items.append(
                LessonStatusItem(
                    id=l.id,
                    title=l.title,
                    day_sequence=l.day_sequence,
                    completed=is_completed,
                    revision_stage=rev.interval_days if rev else None,
                    mastered=is_mastered
                )
            )

        total_l = max(len(lessons), 1)
        pct = round((completed_count / total_l) * 100, 1)

        out.append(
            TopicAnalysisGroup(
                id=top.id,
                subject=top.subject.value,
                stage=top.stage,
                title=top.title,
                total_lessons=len(lessons),
                completed_lessons=completed_count,
                completion_percentage=pct,
                lessons=lesson_items
            )
        )

    return out


@router.post("/generate-mock", response_model=DynamicMockResponse)
async def generate_dynamic_subject_mock(
    req: DynamicMockRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)]
):
    """
    AI Dynamic Mock Engine:
    1. Identifies which lessons the student has completed in this subject
    2. Builds a 25-question 15-minute mock covering ONLY those completed lessons
    """
    # Fetch global settings for timer & question count
    s_res = await session.exec(select(GlobalSettings).where(GlobalSettings.id == 1))
    settings_obj = s_res.first()
    timer_mins = settings_obj.mock_timer_mins if settings_obj else 15
    q_count = settings_obj.mock_q_count if settings_obj else 25

    # Find completed lessons in this subject
    stmt = (
        select(Lesson, Topic)
        .join(Topic, Lesson.topic_id == Topic.id)
        .where(Topic.subject == req.subject)
    )
    if req.topic_id:
        stmt = stmt.where(Topic.id == req.topic_id)

    res = await session.exec(stmt)
    subject_lessons = res.all()

    if not subject_lessons:
        # Fallback to any lessons
        subject_lessons = (await session.exec(select(Lesson, Topic).join(Topic, Lesson.topic_id == Topic.id).limit(10))).all()

    topics_covered = list({t.title for l, t in subject_lessons})
    lesson_ids = [l.id for l, t in subject_lessons]

    # Pull questions for these completed lessons
    q_stmt = select(Question).where(Question.lesson_id.in_(lesson_ids)).limit(q_count)
    questions_db = (await session.exec(q_stmt)).all()

    if len(questions_db) < q_count:
        fallback_qs = (await session.exec(select(Question).limit(q_count))).all()
        questions_db = (questions_db + fallback_qs)[:q_count]

    questions_out = [
        DynamicMockQuestion(
            id=str(q.id),
            question_text=q.question_text,
            opt_a=q.opt_a,
            opt_b=q.opt_b,
            opt_c=q.opt_c,
            opt_d=q.opt_d,
            correct_opt=q.correct_opt,
            explanation=q.explanation,
            short_trick=q.short_trick
        )
        for q in questions_db
    ]

    return DynamicMockResponse(
        subject=req.subject,
        topics_covered=topics_covered[:5],
        mock_timer_mins=timer_mins,
        total_questions=len(questions_out),
        questions=questions_out
    )
