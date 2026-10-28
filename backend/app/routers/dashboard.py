from datetime import datetime, timezone, timedelta
from typing import Annotated, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.database import get_session
from app.routers.deps import get_current_user
from app.models.user import User
from app.models.topic import Topic
from app.models.lesson import Lesson
from app.models.progress import UserProgress, ProgressStatus
from app.models.revision import RevisionSchedule, RevisionStatus
from app.models.daily_log import UserDailyLog, DailyLogStatus
from app.schemas.dashboard import (
    DashboardDataResponse,
    TodayMission,
    DayGridItem,
    UpcomingDayItem,
    OverdueRevisionItem,
    AssignedDailyLesson,
    TodayRailWorkload,
)

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

STAGE_TITLES = {
    1: "Stage 1: Foundations (English + Modern History + Daily Reasoning)",
    2: "Stage 2: Core Concepts (Advanced Maths + Indian Polity)",
    3: "Stage 3: Strengthening (Arithmetic Maths + Geography)",
    4: "Stage 4: Grand Finale (Remaining GS & 100-Q PYQ Mocks)",
}

@router.get("/today", response_model=DashboardDataResponse)
async def get_dashboard_data(
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)]
):
    """
    Returns complete dashboard dataset including:
    - Hardcore Spaced-Repetition Blocker status (locks new lessons if deadline missed)
    - Overdue and upcoming revisions (+3, +7, +20, +30 days)
    - Stage progress (Stage 1 to 4)
    - Today's Workload: exactly 2 main lessons + 1 reasoning lesson
    - 180-day consistency grid with catch-up logic
    """
    now = datetime.now(timezone.utc)

    # 1. HARDCORE SPACED-REPETITION BLOCKER CHECK
    rev_stmt = (
        select(RevisionSchedule, Lesson, Topic)
        .join(Lesson, RevisionSchedule.lesson_id == Lesson.id)
        .join(Topic, Lesson.topic_id == Topic.id)
        .where(RevisionSchedule.user_id == current_user.id)
        .where(RevisionSchedule.status == RevisionStatus.PENDING)
    )
    rev_res = await session.exec(rev_stmt)
    pending_revisions = rev_res.all()

    is_locked = False
    lock_reason = None
    overdue_list: List[OverdueRevisionItem] = []
    upcoming_list: List[OverdueRevisionItem] = []

    for rev, lesson, topic in pending_revisions:
        rev_deadline = rev.deadline if rev.deadline.tzinfo else rev.deadline.replace(tzinfo=timezone.utc)
        rev_scheduled = rev.scheduled_for if rev.scheduled_for.tzinfo else rev.scheduled_for.replace(tzinfo=timezone.utc)

        if now > rev_deadline:
            is_locked = True
            days_over = (now - rev_deadline).days + 1
            overdue_list.append(
                OverdueRevisionItem(
                    id=rev.id,
                    lesson_id=lesson.id,
                    lesson_title=lesson.title,
                    subject=topic.subject.value,
                    interval_days=rev.interval_days,
                    deadline=rev_deadline.strftime("%b %d, %Y"),
                    days_overdue=days_over
                )
            )
        elif now >= (rev_scheduled - timedelta(days=1)):
            upcoming_list.append(
                OverdueRevisionItem(
                    id=rev.id,
                    lesson_id=lesson.id,
                    lesson_title=lesson.title,
                    subject=topic.subject.value,
                    interval_days=rev.interval_days,
                    deadline=rev_deadline.strftime("%b %d, %Y"),
                    days_overdue=0
                )
            )

    if is_locked:
        lock_reason = f"Access Locked: You have {len(overdue_list)} overdue revision(s) past the 2-day deadline. Clear revisions to resume your daily rail."

    # 2. FETCH OR AUTO-GENERATE USER PROGRESS
    prog_stmt = (
        select(UserProgress, Topic)
        .join(Topic, UserProgress.topic_id == Topic.id)
        .where(UserProgress.user_id == current_user.id)
        .order_by(UserProgress.day_number)
    )
    res = await session.exec(prog_stmt)
    records = res.all()

    if not records:
        # Auto-heal / populate 180 days from curriculum topics
        all_topics_res = await session.exec(select(Topic).order_by(Topic.stage, Topic.title))
        curriculum_topics = all_topics_res.all()
        if not curriculum_topics:
            curriculum_topics = [
                Topic(subject="English", stage=1, title="English Grammar & Vocab", weightage_score=2.0)
            ]
            session.add(curriculum_topics[0])
            await session.commit()
            await session.refresh(curriculum_topics[0])

        for day in range(1, 181):
            topic = curriculum_topics[(day - 1) % len(curriculum_topics)]
            item = UserProgress(
                user_id=current_user.id,
                day_number=day,
                topic_id=topic.id,
                video_done=False,
                pdf_done=False,
                quiz_score=0,
                status=ProgressStatus.PENDING
            )
            session.add(item)
        await session.commit()
        records = (await session.exec(prog_stmt)).all()

    # 3. DETERMINE CURRENT ACTIVE DAY & CATCH-UP LOGIC
    today_record = None
    today_topic = None
    completed_count = 0

    for prog, topic in records:
        if prog.status == ProgressStatus.COMPLETED:
            completed_count += 1
        elif today_record is None:
            today_record = prog
            today_topic = topic

    if today_record is None and records:
        today_record, today_topic = records[-1]

    current_day = today_record.day_number if today_record else 1

    # Stage determination (Days 1-45: Stage 1, 46-115: Stage 2, 116-160: Stage 3, 161-180: Stage 4)
    if current_day <= 45:
        stage_num = 1
    elif current_day <= 115:
        stage_num = 2
    elif current_day <= 160:
        stage_num = 3
    else:
        stage_num = 4

    current_user.current_stage = stage_num
    session.add(current_user)
    await session.commit()

    # 4. FETCH TODAY'S RAIL WORKLOAD (Configurable by admin via day_sequence or stage subjects)
    # First, check if lessons are explicitly assigned to this day_sequence:
    day_specific_res = await session.exec(
        select(Lesson, Topic)
        .join(Topic, Lesson.topic_id == Topic.id)
        .where(Lesson.day_sequence == current_day)
    )
    day_lessons = list(day_specific_res.all())

    # If the admin hasn't customized this specific day, build the multi-subject daily rail:
    # 2 Primary Topics (e.g. English in Stage 1, Quant in Stage 2/3) + 2 GS Topics + 1 Reasoning
    if len(day_lessons) < 2:
        stage_lessons = (await session.exec(
            select(Lesson, Topic)
            .join(Topic, Lesson.topic_id == Topic.id)
            .where(Topic.stage == stage_num)
            .order_by(Topic.subject, Lesson.day_sequence, Lesson.title)
        )).all()

        # Group by subject
        subject_buckets: dict[str, list] = {}
        for l, t in stage_lessons:
            s_val = t.subject.value
            subject_buckets.setdefault(s_val, []).append((l, t))

        picked_lessons = []
        # Primary subject (e.g., English or Quant) -> pick up to 2
        prim_subj = "English" if stage_num == 1 else "Quantitative Aptitude"
        prim_list = subject_buckets.get(prim_subj) or []
        offset = ((current_day - 1) * 2)
        if prim_list:
            picked_lessons.append(prim_list[offset % len(prim_list)])
            if len(prim_list) > 1:
                picked_lessons.append(prim_list[(offset + 1) % len(prim_list)])

        # GS subject -> pick up to 2
        gs_list = subject_buckets.get("General Studies") or []
        if gs_list:
            picked_lessons.append(gs_list[offset % len(gs_list)])
            if len(gs_list) > 1:
                picked_lessons.append(gs_list[(offset + 1) % len(gs_list)])

        # Reasoning drill -> pick 1
        reasoning_list = (await session.exec(
            select(Lesson, Topic)
            .join(Topic, Lesson.topic_id == Topic.id)
            .where(Topic.subject == "Reasoning")
        )).all()
        if reasoning_list:
            picked_lessons.append(reasoning_list[(current_day - 1) % len(reasoning_list)])

        day_lessons = picked_lessons

    # User completed lessons
    rev_res_user = await session.exec(
        select(RevisionSchedule.lesson_id)
        .where(RevisionSchedule.user_id == current_user.id)
    )
    user_completed_set = set(rev_res_user.all())

    # Build AssignedDailyLesson list
    all_assigned_lessons: List[AssignedDailyLesson] = []
    subject_counts: dict[str, int] = {}

    assigned_l1 = None
    assigned_l2 = None
    assigned_reasoning = None

    for idx, (l, t) in enumerate(day_lessons):
        s_name = t.subject.value
        subject_counts[s_name] = subject_counts.get(s_name, 0) + 1
        tag_num = subject_counts[s_name]

        if s_name == "Reasoning":
            category_tag = "Daily Reasoning Drill"
        elif s_name == "General Studies":
            category_tag = f"GS Topic #{tag_num}"
        else:
            category_tag = f"{s_name} #{tag_num}"

        is_done = l.id in user_completed_set
        item = AssignedDailyLesson(
            lesson_id=l.id,
            subject=s_name,
            topic_title=t.title,
            title=l.title,
            youtube_embed_id=l.youtube_embed_id,
            pdf_url=l.pdf_url,
            short_trick_notes=l.short_trick_notes,
            completed=is_done,
            category_tag=category_tag
        )
        all_assigned_lessons.append(item)

        if assigned_l1 is None and s_name != "Reasoning":
            assigned_l1 = item
        elif assigned_l2 is None and s_name != "Reasoning":
            assigned_l2 = item
        elif assigned_reasoning is None and s_name == "Reasoning":
            assigned_reasoning = item

    if not assigned_reasoning and all_assigned_lessons:
        # Fallback reasoning assignment if none was marked
        assigned_reasoning = all_assigned_lessons[-1]

    all_done = len(all_assigned_lessons) > 0 and all(a.completed for a in all_assigned_lessons)

    today_workload = TodayRailWorkload(
        day_number=current_day,
        lessons=all_assigned_lessons,
        lesson_1=assigned_l1 or (all_assigned_lessons[0] if all_assigned_lessons else None),
        lesson_2=assigned_l2 or (all_assigned_lessons[1] if len(all_assigned_lessons) > 1 else None),
        reasoning_lesson=assigned_reasoning,
        all_completed=all_done
    )

    # 5. BUILD 180-DAY GRID
    grid_items: List[DayGridItem] = []
    for prog, topic in records:
        if prog.status == ProgressStatus.COMPLETED:
            g_status = "completed"
        elif is_locked and prog.day_number >= current_day:
            g_status = "locked"
        elif prog.day_number == current_day:
            g_status = "today"
        elif prog.day_number < current_day:
            g_status = "missed"
        else:
            g_status = "pending"

        grid_items.append(
            DayGridItem(
                day_number=prog.day_number,
                status=g_status,
                quiz_score=prog.quiz_score,
                subject=topic.subject.value
            )
        )

    # 6. UPCOMING NEXT 3 DAYS PREVIEW
    upcoming_items: List[UpcomingDayItem] = []
    for prog, topic in records:
        if prog.day_number > current_day and len(upcoming_items) < 3:
            upcoming_items.append(
                UpcomingDayItem(
                    day_number=prog.day_number,
                    subject=topic.subject.value,
                    title=topic.title
                )
            )

    # 7. FORMAT TODAY MISSION
    mission = None
    if today_record and today_topic:
        mission = TodayMission(
            day_number=today_record.day_number,
            topic_id=today_topic.id,
            subject=today_topic.subject.value,
            title=today_topic.title,
            youtube_embed_id=today_topic.youtube_embed_id if hasattr(today_topic, "youtube_embed_id") else "dQw4w9WgXcQ",
            pdf_url=today_topic.pdf_url if hasattr(today_topic, "pdf_url") else None,
            video_done=today_record.video_done,
            pdf_done=today_record.pdf_done,
            quiz_score=today_record.quiz_score,
            status=today_record.status
        )

    completion_pct = round((completed_count / max(len(records), 1)) * 100, 1)

    return DashboardDataResponse(
        user_name=current_user.name,
        target_exam=current_user.target_exam.value if current_user.target_exam else "CGL",
        exam_date=current_user.exam_date,
        streak_count=current_user.streak_count,
        current_day=current_day,
        current_stage=stage_num,
        stage_title=STAGE_TITLES.get(stage_num, "Stage 1: Foundations"),
        total_completed=completed_count,
        completion_percentage=completion_pct,
        is_locked=is_locked,
        lock_reason=lock_reason,
        overdue_revisions=overdue_list,
        upcoming_revisions=upcoming_list,
        today_workload=today_workload,
        today_mission=mission,
        grid_progress=grid_items,
        upcoming_days=upcoming_items
    )
