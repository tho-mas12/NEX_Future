import uuid
from datetime import datetime, timezone, timedelta
from typing import Annotated, List, Dict
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
from app.models.revision import RevisionSchedule, RevisionStatus
from app.schemas.revision import (
    RevisionDetailResponse,
    RevisionLessonDetail,
    RevisionQuestionItem,
    RevisionSubmitRequest,
    RevisionSubmitResponse,
    TriggerTestRevisionRequest,
)

router = APIRouter(prefix="/revision", tags=["Spaced-Repetition Revision Gateway"])

NEXT_INTERVAL_MAP = {
    3: 7,
    7: 20,
    20: 30,
    30: None  # Fully Mastered
}

async def get_settings_obj(session: AsyncSession) -> GlobalSettings:
    res = await session.exec(select(GlobalSettings).where(GlobalSettings.id == 1))
    settings_obj = res.first()
    if not settings_obj:
        settings_obj = GlobalSettings(
            id=1,
            mock_timer_mins=15,
            mock_q_count=25,
            revision_pass_percent=80,
            revision_deadline_days=2,
            daily_main_topics_count=2
        )
        session.add(settings_obj)
        await session.commit()
        await session.refresh(settings_obj)
    return settings_obj


@router.get("/{revision_id}", response_model=RevisionDetailResponse)
async def get_revision_session(
    revision_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)]
):
    """Fetches the 3-stage Revision Gateway state for a scheduled lesson review."""
    rev_stmt = (
        select(RevisionSchedule, Lesson, Topic)
        .join(Lesson, RevisionSchedule.lesson_id == Lesson.id)
        .join(Topic, Lesson.topic_id == Topic.id)
        .where(RevisionSchedule.id == revision_id)
        .where(RevisionSchedule.user_id == current_user.id)
    )
    res = await session.exec(rev_stmt)
    row = res.first()

    if not row:
        raise HTTPException(status_code=404, detail="Revision session not found")

    rev, lesson, topic = row
    settings_obj = await get_settings_obj(session)

    now = datetime.now(timezone.utc)
    rev_deadline = rev.deadline if rev.deadline.tzinfo else rev.deadline.replace(tzinfo=timezone.utc)
    rev_scheduled = rev.scheduled_for if rev.scheduled_for.tzinfo else rev.scheduled_for.replace(tzinfo=timezone.utc)

    is_overdue = now > rev_deadline
    days_overdue = (now - rev_deadline).days + 1 if is_overdue else 0

    # Fetch practice/test questions for this lesson
    q_stmt = select(Question).where(Question.lesson_id == lesson.id).limit(15)
    questions_db = (await session.exec(q_stmt)).all()

    # If lesson has no questions, pull from general questions
    if not questions_db:
        q_stmt_all = select(Question).limit(15)
        questions_db = (await session.exec(q_stmt_all)).all()

    questions_out = [
        RevisionQuestionItem(
            id=q.id,
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

    return RevisionDetailResponse(
        id=rev.id,
        lesson=RevisionLessonDetail(
            id=lesson.id,
            title=lesson.title,
            subject=topic.subject.value,
            topic_title=topic.title,
            youtube_embed_id=lesson.youtube_embed_id,
            pdf_url=lesson.pdf_url,
            short_trick_notes=lesson.short_trick_notes
        ),
        interval_days=rev.interval_days,
        scheduled_for=rev_scheduled.strftime("%b %d, %Y"),
        deadline=rev_deadline.strftime("%b %d, %Y"),
        is_overdue=is_overdue,
        days_overdue=days_overdue,
        status=rev.status,
        current_stage=rev.current_stage,
        pass_percent_required=settings_obj.revision_pass_percent,
        test_timer_seconds=min(settings_obj.mock_timer_mins * 60, 900),
        questions=questions_out
    )


@router.post("/{revision_id}/submit", response_model=RevisionSubmitResponse)
async def submit_revision_test(
    revision_id: uuid.UUID,
    req: RevisionSubmitRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)]
):
    """
    Evaluates Stage 2 MCQ revision test:
    - If score >= revision_pass_percent: sets status = passed, creates next interval (+7, +20, +30)
    - If score < revision_pass_percent: locks user into Stage 3 (Mandatory video re-watch & Retest)
    """
    rev_stmt = select(RevisionSchedule).where(
        RevisionSchedule.id == revision_id,
        RevisionSchedule.user_id == current_user.id
    )
    res = await session.exec(rev_stmt)
    rev = res.first()

    if not rev:
        raise HTTPException(status_code=404, detail="Revision schedule not found")

    settings_obj = await get_settings_obj(session)
    pass_cutoff = settings_obj.revision_pass_percent

    # Fetch questions for this lesson
    q_stmt = select(Question).where(Question.lesson_id == rev.lesson_id).limit(15)
    questions = (await session.exec(q_stmt)).all()
    if not questions:
        questions = (await session.exec(select(Question).limit(15))).all()

    correct_count = 0
    total_q = len(questions)

    for q in questions:
        q_id_str = str(q.id)
        user_choice = req.answers.get(q_id_str)
        if user_choice and user_choice.strip().upper() == q.correct_opt.strip().upper():
            correct_count += 1

    score_pct = round((correct_count / max(total_q, 1)) * 100, 1)
    passed = score_pct >= pass_cutoff
    next_interval = None

    now = datetime.now(timezone.utc)

    if passed:
        rev.status = RevisionStatus.PASSED
        rev.score_achieved = score_pct
        session.add(rev)

        next_interval = NEXT_INTERVAL_MAP.get(rev.interval_days)
        if next_interval:
            # Schedule next spaced revision
            sched_date = now + timedelta(days=next_interval)
            deadl_date = sched_date + timedelta(days=settings_obj.revision_deadline_days)

            next_rev = RevisionSchedule(
                user_id=current_user.id,
                lesson_id=rev.lesson_id,
                interval_days=next_interval,
                scheduled_for=sched_date,
                deadline=deadl_date,
                status=RevisionStatus.PENDING,
                current_stage=1
            )
            session.add(next_rev)

        await session.commit()
        msg = f"Passed! Scored {score_pct}% (Required: {pass_cutoff}%). Spaced revision verified!"
        if next_interval:
            msg += f" Next review scheduled at Day +{next_interval}."
        else:
            msg += " Topic is now permanently mastered!"

        return RevisionSubmitResponse(
            passed=True,
            score_achieved=score_pct,
            pass_percent_required=pass_cutoff,
            total_questions=total_q,
            correct_count=correct_count,
            message=msg,
            next_interval=next_interval,
            current_stage=1
        )
    else:
        # FAILED: FORCE TO STAGE 3 (PENALTY VIDEO RE-WATCH & RETEST LOOP)
        rev.status = RevisionStatus.FAILED
        rev.current_stage = 3
        rev.score_achieved = score_pct
        session.add(rev)
        await session.commit()

        msg = f"Score: {score_pct}% (Required: {pass_cutoff}%). You did not meet the retention criteria. Penalty activated: you must re-watch the core lesson video and pass a fresh retest."

        return RevisionSubmitResponse(
            passed=False,
            score_achieved=score_pct,
            pass_percent_required=pass_cutoff,
            total_questions=total_q,
            correct_count=correct_count,
            message=msg,
            next_interval=None,
            current_stage=3
        )


@router.post("/{revision_id}/retry")
async def acknowledge_penalty_and_retry(
    revision_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)]
):
    """Called after student completes mandatory video re-watch in Stage 3 to re-enter Stage 2 Retest."""
    rev_stmt = select(RevisionSchedule).where(
        RevisionSchedule.id == revision_id,
        RevisionSchedule.user_id == current_user.id
    )
    res = await session.exec(rev_stmt)
    rev = res.first()

    if not rev:
        raise HTTPException(status_code=404, detail="Revision schedule not found")

    rev.current_stage = 2
    session.add(rev)
    await session.commit()

    return {"success": True, "message": "Stage 2 Retest unlocked. Aim for 80%+ to clear revision."}


@router.post("/seed-overdue-test")
async def seed_test_overdue_revision(
    req: TriggerTestRevisionRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)]
):
    """
    Simulation Helper:
    Creates an overdue revision record (+3 days, deadline in the past) for current user
    so you can immediately test the Blocker Banner and Gateway!
    """
    first_lesson_res = await session.exec(select(Lesson).limit(1))
    lesson = first_lesson_res.first()
    if not lesson:
        raise HTTPException(status_code=400, detail="No lessons found in DB")

    now = datetime.now(timezone.utc)
    if req.make_overdue:
        scheduled_for = now - timedelta(days=5)
        deadline = now - timedelta(days=1)  # Overdue by 1 day!
    else:
        scheduled_for = now
        deadline = now + timedelta(days=2)

    test_rev = RevisionSchedule(
        user_id=current_user.id,
        lesson_id=lesson.id,
        interval_days=req.interval_days,
        scheduled_for=scheduled_for,
        deadline=deadline,
        status=RevisionStatus.PENDING,
        current_stage=1
    )
    session.add(test_rev)
    await session.commit()
    await session.refresh(test_rev)

    return {
        "success": True,
        "revision_id": str(test_rev.id),
        "lesson_title": lesson.title,
        "is_overdue": req.make_overdue,
        "message": "Overdue revision injected! Go to /dashboard to see the active Blocker, or click the revision link to test the Gateway."
    }
