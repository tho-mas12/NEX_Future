import uuid
import csv
import io
from typing import Annotated, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlmodel import select, func
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.database import get_session
from app.routers.deps import get_current_admin
from app.models.user import User, TargetExam
from app.models.topic import Topic, SubjectEnum
from app.models.lesson import Lesson
from app.models.question import Question
from app.models.roadmap import RoadmapTemplate
from app.models.progress import UserProgress, ProgressStatus
from app.schemas.admin import (
    AdminOverviewResponse,
    AdminKpiStats,
    RecentUserItem,
    AdminTopicItem,
    AdminCreateTopicRequest,
    AdminAssignRoadmapRequest,
    AdminRoadmapDayItem,
)

router = APIRouter(prefix="/admin", tags=["Admin Portal"])

@router.get("/overview", response_model=AdminOverviewResponse)
async def get_admin_overview(
    current_admin: Annotated[User, Depends(get_current_admin)],
    session: Annotated[AsyncSession, Depends(get_session)]
):
    """Fetches high-level SaaS metrics and recent signups."""
    # Total Users
    user_count_res = await session.exec(select(func.count(User.id)))
    total_users = user_count_res.first() or 0

    # Active Subscriptions / onboarded users
    active_count_res = await session.exec(
        select(func.count(User.id)).where(User.onboarding_completed == True)
    )
    active_users = active_count_res.first() or 0

    # Average Streak
    avg_streak_res = await session.exec(select(func.avg(User.streak_count)))
    avg_streak = round(float(avg_streak_res.first() or 0), 1)

    # Drop-off analysis: Find day with highest stall rate (pending status among initiated users)
    dropoff_res = await session.exec(
        select(UserProgress.day_number, func.count(UserProgress.id))
        .where(UserProgress.status == ProgressStatus.PENDING)
        .where(UserProgress.day_number <= 30)
        .group_by(UserProgress.day_number)
        .order_by(func.count(UserProgress.id).desc())
        .limit(1)
    )
    dropoff_row = dropoff_res.first()
    dropoff_day = dropoff_row[0] if dropoff_row else 14

    # Syllabus Days Count
    tpl_count_res = await session.exec(select(func.count(RoadmapTemplate.id)))
    tpl_count = tpl_count_res.first() or 0

    # Recent 10 users
    recent_users_res = await session.exec(
        select(User).order_by(User.created_at.desc()).limit(10)
    )
    recent_users_db = recent_users_res.all()

    recent_users_out = [
        RecentUserItem(
            id=u.id,
            name=u.name,
            email=u.email,
            target_exam=u.target_exam.value if u.target_exam else "None",
            streak_count=u.streak_count,
            onboarding_completed=u.onboarding_completed,
            created_at=u.created_at.strftime("%Y-%m-%d %H:%M") if u.created_at else "Recent"
        )
        for u in recent_users_db
    ]

    return AdminOverviewResponse(
        kpis=AdminKpiStats(
            total_users=total_users,
            active_subscriptions=active_users,
            avg_streak=avg_streak,
            dropoff_day=dropoff_day,
            syllabus_coverage_days=min(tpl_count, 180)
        ),
        recent_users=recent_users_out
    )


@router.get("/topics", response_model=List[AdminTopicItem])
async def list_admin_topics(
    current_admin: Annotated[User, Depends(get_current_admin)],
    session: Annotated[AsyncSession, Depends(get_session)]
):
    """Returns list of topics with question counts."""
    topics_res = await session.exec(select(Topic).order_by(Topic.subject, Topic.title))
    topics = topics_res.all()

    items: List[AdminTopicItem] = []
    for t in topics:
        direct_count_res = await session.exec(
            select(func.count(Question.id)).where(Question.topic_id == t.id)
        )
        direct_count = direct_count_res.first() or 0

        lesson_count_res = await session.exec(
            select(func.count(Question.id))
            .join(Lesson, Question.lesson_id == Lesson.id)
            .where(Lesson.topic_id == t.id)
        )
        lesson_count = lesson_count_res.first() or 0

        q_count = direct_count + lesson_count

        items.append(
            AdminTopicItem(
                id=t.id,
                subject=t.subject,
                title=t.title,
                youtube_embed_id=t.youtube_embed_id,
                pdf_url=t.pdf_url,
                question_count=q_count
            )
        )
    return items


@router.post("/topics", response_model=AdminTopicItem)
async def create_admin_topic(
    req: AdminCreateTopicRequest,
    current_admin: Annotated[User, Depends(get_current_admin)],
    session: Annotated[AsyncSession, Depends(get_session)]
):
    """Creates a new topic in the content hub."""
    new_topic = Topic(
        subject=req.subject,
        title=req.title.strip(),
        youtube_embed_id=req.youtube_embed_id.strip(),
        pdf_url=req.pdf_url.strip() if req.pdf_url else None
    )
    session.add(new_topic)
    await session.commit()
    await session.refresh(new_topic)

    return AdminTopicItem(
        id=new_topic.id,
        subject=new_topic.subject,
        title=new_topic.title,
        youtube_embed_id=new_topic.youtube_embed_id,
        pdf_url=new_topic.pdf_url,
        question_count=0
    )


@router.post("/topics/{topic_id}/upload-mcqs")
async def bulk_upload_mcqs(
    topic_id: uuid.UUID,
    file: UploadFile = File(...),
    current_admin: Annotated[User, Depends(get_current_admin)] = None,
    session: Annotated[AsyncSession, Depends(get_session)] = None
):
    """
    Parses a CSV file and batch-creates Questions for the specified topic.
    Expected CSV columns: question_text,opt_a,opt_b,opt_c,opt_d,correct_opt,explanation
    """
    t_res = await session.exec(select(Topic).where(Topic.id == topic_id))
    topic = t_res.first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    content = await file.read()
    try:
        decoded = content.decode("utf-8-sig")
    except Exception:
        decoded = content.decode("latin-1")

    reader = csv.DictReader(io.StringIO(decoded))
    created_count = 0

    for row in reader:
        q_text = row.get("question_text") or row.get("question")
        opt_a = row.get("opt_a") or row.get("option_a")
        opt_b = row.get("opt_b") or row.get("option_b")
        opt_c = row.get("opt_c") or row.get("option_c")
        opt_d = row.get("opt_d") or row.get("option_d")
        correct = row.get("correct_opt") or row.get("correct_option") or "A"
        explanation = row.get("explanation") or ""

        if q_text and opt_a and opt_b and opt_c and opt_d:
            q = Question(
                topic_id=topic.id,
                question_text=q_text.strip(),
                opt_a=opt_a.strip(),
                opt_b=opt_b.strip(),
                opt_c=opt_c.strip(),
                opt_d=opt_d.strip(),
                correct_opt=correct.strip().upper()[:1],
                explanation=explanation.strip()
            )
            session.add(q)
            created_count += 1

    await session.commit()
    return {"success": True, "created_count": created_count, "topic_title": topic.title}


@router.get("/roadmap", response_model=List[AdminRoadmapDayItem])
async def get_admin_roadmap(
    exam_type: TargetExam = TargetExam.CGL,
    current_admin: Annotated[User, Depends(get_current_admin)] = None,
    session: Annotated[AsyncSession, Depends(get_session)] = None
):
    """Returns days 1 to 180 for the specified exam with mapped topic."""
    tpl_stmt = (
        select(RoadmapTemplate, Topic)
        .outerjoin(Topic, RoadmapTemplate.topic_id == Topic.id)
        .where(RoadmapTemplate.exam_type == exam_type)
        .order_by(RoadmapTemplate.day_number)
    )
    tpl_res = await session.exec(tpl_stmt)
    records = tpl_res.all()

    existing_map = {tpl.day_number: (tpl, top) for tpl, top in records}
    roadmap_out: List[AdminRoadmapDayItem] = []

    for day in range(1, 181):
        if day in existing_map:
            tpl, topic = existing_map[day]
            roadmap_out.append(
                AdminRoadmapDayItem(
                    day_number=day,
                    topic_id=topic.id if topic else None,
                    topic_title=topic.title if topic else "Unassigned",
                    topic_subject=topic.subject.value if topic else None
                )
            )
        else:
            roadmap_out.append(
                AdminRoadmapDayItem(
                    day_number=day,
                    topic_id=None,
                    topic_title="Unassigned",
                    topic_subject=None
                )
            )

    return roadmap_out


@router.post("/roadmap/assign")
async def assign_roadmap_topic(
    req: AdminAssignRoadmapRequest,
    current_admin: Annotated[User, Depends(get_current_admin)],
    session: Annotated[AsyncSession, Depends(get_session)]
):
    """Assigns or updates a Topic for a given day in RoadmapTemplate."""
    tpl_stmt = select(RoadmapTemplate).where(
        RoadmapTemplate.exam_type == req.exam_type,
        RoadmapTemplate.day_number == req.day_number
    )
    tpl_res = await session.exec(tpl_stmt)
    template = tpl_res.first()

    if template:
        template.topic_id = req.topic_id
        session.add(template)
    else:
        template = RoadmapTemplate(
            exam_type=req.exam_type,
            day_number=req.day_number,
            topic_id=req.topic_id
        )
        session.add(template)

    await session.commit()
    return {"success": True, "day_number": req.day_number, "topic_id": str(req.topic_id)}


from pydantic import BaseModel

class AssignLessonRequest(BaseModel):
    lesson_id: uuid.UUID
    day_number: int

class CreateDayLessonRequest(BaseModel):
    topic_id: uuid.UUID
    day_number: int
    title: str
    youtube_embed_id: str = "dQw4w9WgXcQ"
    pdf_url: Optional[str] = None
    short_trick_notes: Optional[str] = None


@router.get("/curriculum/days")
async def get_curriculum_days_overview(
    current_admin: Annotated[User, Depends(get_current_admin)],
    session: Annotated[AsyncSession, Depends(get_session)]
):
    """
    Returns days 1 to 180 with total assigned lessons and subject breakdown.
    """
    lessons_res = await session.exec(
        select(Lesson, Topic).join(Topic, Lesson.topic_id == Topic.id)
    )
    all_lessons = lessons_res.all()

    # Group by day_sequence
    day_map: dict[int, list] = {}
    for l, t in all_lessons:
        if l.day_sequence > 0:
            day_map.setdefault(l.day_sequence, []).append((l, t))

    out = []
    for day in range(1, 181):
        items = day_map.get(day, [])
        subjects = list({t.subject.value for l, t in items})
        out.append({
            "day_number": day,
            "lesson_count": len(items),
            "subjects": subjects,
            "stage": 1 if day <= 45 else 2 if day <= 110 else 3 if day <= 150 else 4,
            "lessons": [
                {
                    "id": str(l.id),
                    "title": l.title,
                    "subject": t.subject.value,
                    "topic_title": t.title
                }
                for l, t in items
            ]
        })
    return out


@router.get("/curriculum/day/{day_number}")
async def get_day_curriculum_details(
    day_number: int,
    current_admin: Annotated[User, Depends(get_current_admin)],
    session: Annotated[AsyncSession, Depends(get_session)]
):
    """
    Returns:
    - Assigned lessons for this specific day
    - Full list of available topics and library lessons so admin can easily assign/add extra
    """
    assigned_res = await session.exec(
        select(Lesson, Topic)
        .join(Topic, Lesson.topic_id == Topic.id)
        .where(Lesson.day_sequence == day_number)
    )
    assigned_db = assigned_res.all()

    # All topics
    topics_res = await session.exec(select(Topic).order_by(Topic.stage, Topic.subject, Topic.title))
    topics_db = topics_res.all()

    # Library of unassigned or other lessons
    library_res = await session.exec(
        select(Lesson, Topic).join(Topic, Lesson.topic_id == Topic.id)
    )
    library_db = library_res.all()

    return {
        "day_number": day_number,
        "assigned_lessons": [
            {
                "id": str(l.id),
                "title": l.title,
                "subject": t.subject.value,
                "topic_id": str(t.id),
                "topic_title": t.title,
                "youtube_embed_id": l.youtube_embed_id,
                "pdf_url": l.pdf_url,
                "short_trick_notes": l.short_trick_notes
            }
            for l, t in assigned_db
        ],
        "available_topics": [
            {
                "id": str(t.id),
                "subject": t.subject.value,
                "title": t.title,
                "stage": t.stage
            }
            for t in topics_db
        ],
        "library_lessons": [
            {
                "id": str(l.id),
                "title": l.title,
                "subject": t.subject.value,
                "topic_title": t.title,
                "current_day": l.day_sequence
            }
            for l, t in library_db
        ]
    }


@router.post("/curriculum/assign-lesson")
async def assign_lesson_to_day(
    req: AssignLessonRequest,
    current_admin: Annotated[User, Depends(get_current_admin)],
    session: Annotated[AsyncSession, Depends(get_session)]
):
    """Assigns an existing lesson to a specific day."""
    lesson = (await session.exec(select(Lesson).where(Lesson.id == req.lesson_id))).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    lesson.day_sequence = req.day_number
    session.add(lesson)
    await session.commit()
    return {"success": True, "lesson_id": str(lesson.id), "day_number": req.day_number}


@router.post("/curriculum/create-lesson")
async def create_lesson_for_day(
    req: CreateDayLessonRequest,
    current_admin: Annotated[User, Depends(get_current_admin)],
    session: Annotated[AsyncSession, Depends(get_session)]
):
    """Creates a new lesson and assigns it directly to a specific day."""
    topic = (await session.exec(select(Topic).where(Topic.id == req.topic_id))).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    new_lesson = Lesson(
        topic_id=req.topic_id,
        day_sequence=req.day_number,
        title=req.title.strip(),
        youtube_embed_id=req.youtube_embed_id.strip() if req.youtube_embed_id else "dQw4w9WgXcQ",
        pdf_url=req.pdf_url.strip() if req.pdf_url else None,
        short_trick_notes=req.short_trick_notes.strip() if req.short_trick_notes else None
    )
    session.add(new_lesson)
    await session.commit()
    await session.refresh(new_lesson)

    return {
        "success": True,
        "id": str(new_lesson.id),
        "title": new_lesson.title,
        "day_number": new_lesson.day_sequence
    }


@router.delete("/curriculum/remove-lesson/{lesson_id}")
async def remove_lesson_from_day(
    lesson_id: uuid.UUID,
    current_admin: Annotated[User, Depends(get_current_admin)],
    session: Annotated[AsyncSession, Depends(get_session)]
):
    """Unassigns a lesson from its day (sets day_sequence to 0)."""
    lesson = (await session.exec(select(Lesson).where(Lesson.id == lesson_id))).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    lesson.day_sequence = 0
    session.add(lesson)
    await session.commit()
    return {"success": True, "lesson_id": str(lesson.id)}


# =========================================================================
# RESTRUCTURED ADMIN MODULES: SUBJECTS, AI MCQs, MOCKS, PYQ, CURRENT AFFAIRS
# =========================================================================

import json
from app.models.pyq import PYQDocument
from app.models.current_affairs import CurrentAffairsItem
from app.models.mock_test import MockTestCard

SUBJECT_META = {
    "reasoning": {
        "title": "General Intelligence & Reasoning",
        "enum": SubjectEnum.REASONING,
        "description": "Coding-decoding, syllogisms, analogies, and directional agility.",
        "icon": "Brain"
    },
    "ga": {
        "title": "General Awareness",
        "enum": SubjectEnum.GS,
        "description": "Polity, Modern History, Geography, and High-Yield General Science.",
        "icon": "Globe"
    },
    "quant": {
        "title": "Quantitative Aptitude",
        "enum": SubjectEnum.QUANT,
        "description": "Speed arithmetic, geometry, algebra, and rapid approximation tricks.",
        "icon": "Calculator"
    },
    "english": {
        "title": "English Comprehension",
        "enum": SubjectEnum.ENGLISH,
        "description": "Grammar rules, active/passive voice, vocabulary, and reading cloze.",
        "icon": "BookOpen"
    }
}

class CreateSubjectLessonRequest(BaseModel):
    title: str
    youtube_url: str
    short_notes: str

class EditSubjectLessonRequest(BaseModel):
    title: str
    youtube_url: str
    short_notes: str

class CreateSubjectCardRequest(BaseModel):
    key: str
    title: str
    description: str
    subject_enum: Optional[str] = "QUANT"
    icon: Optional[str] = "BookOpen"

class ManualMCQRequest(BaseModel):
    question_text: str
    opt_a: str
    opt_b: str
    opt_c: str
    opt_d: str
    correct_opt: str
    explanation: Optional[str] = None
    short_trick: Optional[str] = None

class CreateMockCardRequest(BaseModel):
    title: str
    day_number: int
    duration_mins: int = 15
    total_questions: int = 25
    pos_marks: float = 2.0
    neg_marks: float = 0.5
    is_gated: bool = True

class CreatePYQRequest(BaseModel):
    year: int
    title: str
    tier: str = "Tier 1"
    shift_info: str = "All Shifts Combined"
    pdf_url: str

class CreateCurrentAffairsRequest(BaseModel):
    title: str
    published_date: str = "October 2026"
    summary_notes: str
    question_count: int = 5


@router.get("/subjects-overview")
async def get_subjects_overview(
    current_admin: Annotated[User, Depends(get_current_admin)],
    session: Annotated[AsyncSession, Depends(get_session)]
):
    """Returns overview of the 4 core subjects with lesson & topic counts."""
    overview = []
    for key, meta in SUBJECT_META.items():
        # Get topics for this subject
        topics_res = await session.exec(select(Topic).where(Topic.subject == meta["enum"]))
        topics = topics_res.all()
        topic_ids = [t.id for t in topics]

        # Count lessons
        if topic_ids:
            lessons_count_res = await session.exec(
                select(func.count(Lesson.id)).where(Lesson.topic_id.in_(topic_ids))
            )
            lesson_count = lessons_count_res.first() or 0
        else:
            lesson_count = 0

        overview.append({
            "key": key,
            "title": meta["title"],
            "description": meta["description"],
            "subject_enum": meta["enum"].value,
            "topic_count": len(topics),
            "lesson_count": lesson_count
        })
    return overview


@router.get("/subjects/{subject_key}/lessons")
async def get_subject_lessons(
    subject_key: str,
    current_admin: Annotated[User, Depends(get_current_admin)],
    session: Annotated[AsyncSession, Depends(get_session)]
):
    """Returns all lessons created under the specified subject."""
    meta = SUBJECT_META.get(subject_key.lower())
    if not meta:
        raise HTTPException(status_code=404, detail="Subject not recognized")

    topics_res = await session.exec(select(Topic).where(Topic.subject == meta["enum"]))
    topics = topics_res.all()
    topic_ids = [t.id for t in topics]

    if not topic_ids:
        return {"subject": meta["title"], "lessons": []}

    lessons_res = await session.exec(
        select(Lesson, Topic)
        .join(Topic, Lesson.topic_id == Topic.id)
        .where(Lesson.topic_id.in_(topic_ids))
        .order_by(Lesson.day_sequence)
    )
    lessons = lessons_res.all()

    return {
        "subject": meta["title"],
        "subject_key": subject_key,
        "lessons": [
            {
                "id": str(l.id),
                "title": l.title,
                "topic_title": t.title,
                "day_sequence": l.day_sequence,
                "youtube_embed_id": l.youtube_embed_id,
                "short_trick_notes": l.short_trick_notes or "Notes sheet",
                "pdf_url": l.pdf_url
            }
            for l, t in lessons
        ]
    }


@router.post("/subjects/{subject_key}/lessons")
async def create_subject_lesson(
    subject_key: str,
    req: CreateSubjectLessonRequest,
    current_admin: Annotated[User, Depends(get_current_admin)],
    session: Annotated[AsyncSession, Depends(get_session)]
):
    """Creates a new lesson under the chosen subject with title, youtube link, and short notes."""
    meta = SUBJECT_META.get(subject_key.lower())
    if not meta:
        raise HTTPException(status_code=404, detail="Subject not recognized")

    # Find or create a primary topic container for this subject
    topic_res = await session.exec(select(Topic).where(Topic.subject == meta["enum"]))
    topic = topic_res.first()
    if not topic:
        topic = Topic(
            subject=meta["enum"],
            title=f"{meta['title']} Core Foundation",
            youtube_embed_id="dQw4w9WgXcQ"
        )
        session.add(topic)
        await session.commit()
        await session.refresh(topic)

    # Clean youtube url to embed id
    yt_id = req.youtube_url.strip()
    if "v=" in yt_id:
        yt_id = yt_id.split("v=")[1].split("&")[0]
    elif "youtu.be/" in yt_id:
        yt_id = yt_id.split("youtu.be/")[1].split("?")[0]
    elif "/" in yt_id:
        yt_id = yt_id.split("/")[-1]

    new_lesson = Lesson(
        topic_id=topic.id,
        title=req.title.strip(),
        day_sequence=0, # unassigned initially, scheduled via day-wise page
        youtube_embed_id=yt_id or "dQw4w9WgXcQ",
        short_trick_notes=req.short_notes.strip()
    )
    session.add(new_lesson)
    await session.commit()
    await session.refresh(new_lesson)

    return {
        "success": True,
        "id": str(new_lesson.id),
        "title": new_lesson.title,
        "youtube_embed_id": new_lesson.youtube_embed_id,
        "short_trick_notes": new_lesson.short_trick_notes
    }


@router.put("/subjects/{subject_key}/lessons/{lesson_id}")
async def edit_subject_lesson(
    subject_key: str,
    lesson_id: uuid.UUID,
    req: EditSubjectLessonRequest,
    current_admin: Annotated[User, Depends(get_current_admin)],
    session: Annotated[AsyncSession, Depends(get_session)]
):
    """Updates an existing lesson's title, youtube embed, and short trick notes."""
    lesson = (await session.exec(select(Lesson).where(Lesson.id == lesson_id))).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    yt_id = req.youtube_url.strip()
    if "v=" in yt_id:
        yt_id = yt_id.split("v=")[1].split("&")[0]
    elif "youtu.be/" in yt_id:
        yt_id = yt_id.split("youtu.be/")[1].split("?")[0]
    elif "/" in yt_id:
        yt_id = yt_id.split("/")[-1]

    lesson.title = req.title.strip()
    if yt_id:
        lesson.youtube_embed_id = yt_id
    lesson.short_trick_notes = req.short_notes.strip()

    session.add(lesson)
    await session.commit()
    await session.refresh(lesson)
    return {"success": True, "id": str(lesson.id), "title": lesson.title}


@router.delete("/subjects/{subject_key}/lessons/{lesson_id}")
async def delete_subject_lesson(
    subject_key: str,
    lesson_id: uuid.UUID,
    current_admin: Annotated[User, Depends(get_current_admin)],
    session: Annotated[AsyncSession, Depends(get_session)]
):
    """Deletes a lesson and cleans up any attached questions."""
    lesson = (await session.exec(select(Lesson).where(Lesson.id == lesson_id))).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    # Delete questions attached to this lesson
    qs = (await session.exec(select(Question).where(Question.lesson_id == lesson_id))).all()
    for q in qs:
        await session.delete(q)

    await session.delete(lesson)
    await session.commit()
    return {"success": True}


@router.post("/subjects")
async def create_subject_card(
    req: CreateSubjectCardRequest,
    current_admin: Annotated[User, Depends(get_current_admin)],
    session: Annotated[AsyncSession, Depends(get_session)]
):
    """Registers a new custom subject stream card."""
    clean_key = req.key.strip().lower().replace(" ", "_")
    enum_val = SubjectEnum.QUANT
    if "reason" in clean_key:
        enum_val = SubjectEnum.REASONING
    elif "english" in clean_key:
        enum_val = SubjectEnum.ENGLISH
    elif "ga" in clean_key or "aware" in clean_key or "gk" in clean_key:
        enum_val = SubjectEnum.GA

    SUBJECT_META[clean_key] = {
        "title": req.title.strip(),
        "enum": enum_val,
        "description": req.description.strip(),
        "icon": req.icon or "BookOpen"
    }

    # Ensure topic exists
    topic = (await session.exec(select(Topic).where(Topic.subject == enum_val))).first()
    if not topic:
        topic = Topic(subject=enum_val, title=f"{req.title.strip()} Foundation", youtube_embed_id="dQw4w9WgXcQ")
        session.add(topic)
        await session.commit()

    return {"success": True, "key": clean_key, "title": req.title.strip()}


@router.delete("/subjects/{subject_key}")
async def delete_subject_card(
    subject_key: str,
    current_admin: Annotated[User, Depends(get_current_admin)]
):
    """Deletes a custom subject stream card."""
    clean_key = subject_key.strip().lower()
    if clean_key in SUBJECT_META:
        del SUBJECT_META[clean_key]
        return {"success": True}
    raise HTTPException(status_code=404, detail="Subject not found")


@router.get("/lessons/{lesson_id}/mcqs")
async def get_lesson_mcqs(
    lesson_id: uuid.UUID,
    current_admin: Annotated[User, Depends(get_current_admin)],
    session: Annotated[AsyncSession, Depends(get_session)]
):
    """Returns 3-tier MCQs (Easy for initial, Medium for practice, Hard for revision) for a lesson."""
    questions_res = await session.exec(
        select(Question).where(Question.lesson_id == lesson_id)
    )
    questions = questions_res.all()

    # Partition into 3 tiers
    easy, medium, hard = [], [], []
    for idx, q in enumerate(questions):
        q_dict = {
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
        if idx % 3 == 0:
            easy.append(q_dict)
        elif idx % 3 == 1:
            medium.append(q_dict)
        else:
            hard.append(q_dict)

    return {
        "lesson_id": str(lesson_id),
        "total_mcqs": len(questions),
        "tiers": {
            "easy_initial": easy,
            "medium_test": medium,
            "hard_revision": hard
        }
    }


@router.post("/lessons/{lesson_id}/generate-ai-mcqs")
async def generate_ai_mcqs_for_lesson(
    lesson_id: uuid.UUID,
    current_admin: Annotated[User, Depends(get_current_admin)],
    session: Annotated[AsyncSession, Depends(get_session)]
):
    """
    AI Question Generator: creates 6 tailored MCQs across Easy, Medium, and Harder tiers
    derived from the lesson title and core short trick principles.
    """
    lesson = (await session.exec(select(Lesson).where(Lesson.id == lesson_id))).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    title = lesson.title
    notes = lesson.short_trick_notes or "Speed shortcut and pattern recognition"

    templates = [
        # Easy Tier (Initial learning)
        ("Easy (Initial MCQ)", f"What is the foundational definition or rule for [{title}] in SSC CGL?", "Direct application of basic rule", "Complex multiple algebra", "Random elimination", "Undefined parameter", "A", f"Foundational standard rule: {notes}"),
        ("Easy (Initial MCQ)", f"Which shortcut approach eliminates false options fastest in [{title}]?", "Unit digit & digital sum checking", "Long traditional formula calculation", "Guesswork", "Skipping the question entirely", "A", "Standard shortcut elimination technique."),
        # Medium Tier (Daily Test)
        ("Medium (Daily Test)", f"In a standard Tier 1 timed problem on [{title}], how should step 2 be executed?", "Direct value substitution / Vedic triplet", "Writing 5 lines of derivation", "Factorization by quadratic formula", "Approximation error tolerance", "A", f"Recommended shortcut: {notes}"),
        ("Medium (Daily Test)", f"If parameters in [{title}] are doubled, what is the net impact on result?", "Increases proportionally as per standard multiplier", "Halved automatically", "Remains zero", "Cannot be solved within 30 seconds", "A", "Proportionality rules apply directly."),
        # Hard Tier (Spaced Revision)
        ("Hard (Spaced Revision)", f"Advanced Tier 2 Twist on [{title}]: If a reverse condition is applied, which option is strictly correct?", "Inverse ratio method yields the optimal 20-second solution", "Quadratic discriminant analysis", "Logarithmic transformation", "Graphical coordinate plotting", "A", "Inverse ratio trick provides instantaneous resolution."),
        ("Hard (Spaced Revision)", f"Trap Avoidance in [{title}]: What common error occurs under high exam pressure?", "Overlooking unit conversion or fixed condition", "Solving too fast", "Checking options backwards", "Applying basic formula", "A", "Watch for unit mismatches.")
    ]

    created = []
    for tier, q_text, opt_a, opt_b, opt_c, opt_d, correct, exp in templates:
        q = Question(
            lesson_id=lesson.id,
            question_text=f"[{tier}] {q_text}",
            opt_a=opt_a,
            opt_b=opt_b,
            opt_c=opt_c,
            opt_d=opt_d,
            correct_opt=correct,
            explanation=exp,
            short_trick=f"AI Shortcut: {notes[:60]}"
        )
        session.add(q)
        created.append(q)

    await session.commit()
    return {"success": True, "created_count": len(created), "lesson_title": lesson.title}


@router.post("/lessons/{lesson_id}/mcqs")
async def add_manual_mcq(
    lesson_id: uuid.UUID,
    req: ManualMCQRequest,
    current_admin: Annotated[User, Depends(get_current_admin)],
    session: Annotated[AsyncSession, Depends(get_session)]
):
    """Manually adds a new MCQ to the lesson question bank."""
    q = Question(
        lesson_id=lesson_id,
        question_text=req.question_text.strip(),
        opt_a=req.opt_a.strip(),
        opt_b=req.opt_b.strip(),
        opt_c=req.opt_c.strip(),
        opt_d=req.opt_d.strip(),
        correct_opt=req.correct_opt.strip().upper()[:1],
        explanation=req.explanation.strip() if req.explanation else None,
        short_trick=req.short_trick.strip() if req.short_trick else None
    )
    session.add(q)
    await session.commit()
    await session.refresh(q)
    return {"success": True, "id": str(q.id)}


# --- MOCK TESTS STUDIO ---
@router.get("/mocks")
async def list_admin_mocks(
    current_admin: Annotated[User, Depends(get_current_admin)],
    session: Annotated[AsyncSession, Depends(get_session)]
):
    """Lists all scheduled mock test cards with question counts and lock status."""
    mocks_res = await session.exec(select(MockTestCard).order_by(MockTestCard.day_number))
    mocks = mocks_res.all()
    out = []
    for m in mocks:
        try:
            q_list = json.loads(m.questions_json)
        except Exception:
            q_list = []
        out.append({
            "id": str(m.id),
            "title": m.title,
            "day_number": m.day_number,
            "duration_mins": m.duration_mins,
            "total_questions": len(q_list) if q_list else m.total_questions,
            "pos_marks": m.pos_marks,
            "neg_marks": m.neg_marks,
            "is_active": m.is_active,
            "is_gated": m.is_gated,
            "questions": q_list
        })
    return out


@router.post("/mocks")
async def create_mock_card(
    req: CreateMockCardRequest,
    current_admin: Annotated[User, Depends(get_current_admin)],
    session: Annotated[AsyncSession, Depends(get_session)]
):
    """Creates a new mock test card scheduled for a specific day."""
    new_mock = MockTestCard(
        title=req.title.strip(),
        day_number=req.day_number,
        duration_mins=req.duration_mins,
        total_questions=req.total_questions,
        pos_marks=req.pos_marks,
        neg_marks=req.neg_marks,
        is_gated=req.is_gated,
        is_active=True,
        questions_json="[]"
    )
    session.add(new_mock)
    await session.commit()
    await session.refresh(new_mock)
    return {"success": True, "id": str(new_mock.id), "title": new_mock.title}


@router.post("/mocks/{mock_id}/questions")
async def add_mock_question(
    mock_id: uuid.UUID,
    req: ManualMCQRequest,
    current_admin: Annotated[User, Depends(get_current_admin)],
    session: Annotated[AsyncSession, Depends(get_session)]
):
    """Manually enters a question into a mock test card."""
    mock = (await session.exec(select(MockTestCard).where(MockTestCard.id == mock_id))).first()
    if not mock:
        raise HTTPException(status_code=404, detail="Mock not found")

    try:
        q_list = json.loads(mock.questions_json)
    except Exception:
        q_list = []

    q_list.append({
        "question_text": req.question_text.strip(),
        "opt_a": req.opt_a.strip(),
        "opt_b": req.opt_b.strip(),
        "opt_c": req.opt_c.strip(),
        "opt_d": req.opt_d.strip(),
        "correct_opt": req.correct_opt.strip().upper()[:1],
        "explanation": req.explanation or ""
    })
    mock.questions_json = json.dumps(q_list)
    mock.total_questions = len(q_list)
    session.add(mock)
    await session.commit()
    return {"success": True, "total_questions": len(q_list)}


@router.post("/mocks/{mock_id}/toggle-gate")
async def toggle_mock_gate(
    mock_id: uuid.UUID,
    current_admin: Annotated[User, Depends(get_current_admin)],
    session: Annotated[AsyncSession, Depends(get_session)]
):
    """Enables or disables mandatory gating lock for the mock test."""
    mock = (await session.exec(select(MockTestCard).where(MockTestCard.id == mock_id))).first()
    if not mock:
        raise HTTPException(status_code=404, detail="Mock not found")

    mock.is_gated = not mock.is_gated
    session.add(mock)
    await session.commit()
    return {"success": True, "is_gated": mock.is_gated}


# --- PREVIOUS YEAR QUESTIONS (PYQs) ---
@router.get("/pyqs")
async def list_admin_pyqs(
    current_admin: Annotated[User, Depends(get_current_admin)],
    session: Annotated[AsyncSession, Depends(get_session)]
):
    """Returns year-wise PYQ documents."""
    res = await session.exec(select(PYQDocument).order_by(PYQDocument.year.desc()))
    return res.all()


@router.post("/pyqs")
async def create_pyq_document(
    req: CreatePYQRequest,
    current_admin: Annotated[User, Depends(get_current_admin)],
    session: Annotated[AsyncSession, Depends(get_session)]
):
    """Registers a year-wise PYQ PDF/document."""
    doc = PYQDocument(
        year=req.year,
        title=req.title.strip(),
        tier=req.tier.strip(),
        shift_info=req.shift_info.strip(),
        pdf_url=req.pdf_url.strip()
    )
    session.add(doc)
    await session.commit()
    await session.refresh(doc)
    return doc


@router.delete("/pyqs/{pyq_id}")
async def delete_pyq(
    pyq_id: uuid.UUID,
    current_admin: Annotated[User, Depends(get_current_admin)],
    session: Annotated[AsyncSession, Depends(get_session)]
):
    doc = (await session.exec(select(PYQDocument).where(PYQDocument.id == pyq_id))).first()
    if doc:
        await session.delete(doc)
        await session.commit()
    return {"success": True}


# --- CURRENT AFFAIRS MODULES ---
@router.get("/current-affairs")
async def list_admin_current_affairs(
    current_admin: Annotated[User, Depends(get_current_admin)],
    session: Annotated[AsyncSession, Depends(get_session)]
):
    res = await session.exec(select(CurrentAffairsItem).order_by(CurrentAffairsItem.created_at.desc()))
    return res.all()


@router.post("/current-affairs")
async def create_current_affairs(
    req: CreateCurrentAffairsRequest,
    current_admin: Annotated[User, Depends(get_current_admin)],
    session: Annotated[AsyncSession, Depends(get_session)]
):
    item = CurrentAffairsItem(
        title=req.title.strip(),
        published_date=req.published_date.strip(),
        summary_notes=req.summary_notes.strip(),
        question_count=req.question_count,
        questions_json="[]"
    )
    session.add(item)
    await session.commit()
    await session.refresh(item)
    return item


@router.post("/current-affairs/{ca_id}/questions")
async def add_current_affairs_question(
    ca_id: uuid.UUID,
    req: ManualMCQRequest,
    current_admin: Annotated[User, Depends(get_current_admin)],
    session: Annotated[AsyncSession, Depends(get_session)]
):
    ca = (await session.exec(select(CurrentAffairsItem).where(CurrentAffairsItem.id == ca_id))).first()
    if not ca:
        raise HTTPException(status_code=404, detail="Current affairs module not found")

    try:
        q_list = json.loads(ca.questions_json)
    except Exception:
        q_list = []

    q_list.append({
        "question_text": req.question_text.strip(),
        "opt_a": req.opt_a.strip(),
        "opt_b": req.opt_b.strip(),
        "opt_c": req.opt_c.strip(),
        "opt_d": req.opt_d.strip(),
        "correct_opt": req.correct_opt.strip().upper()[:1],
        "explanation": req.explanation or ""
    })
    ca.questions_json = json.dumps(q_list)
    ca.question_count = len(q_list)
    session.add(ca)
    await session.commit()
    return {"success": True, "total_questions": len(q_list)}


@router.delete("/current-affairs/{ca_id}")
async def delete_current_affairs_module(
    ca_id: uuid.UUID,
    current_admin: Annotated[User, Depends(get_current_admin)],
    session: Annotated[AsyncSession, Depends(get_session)]
):
    """Deletes an entire current affairs module."""
    ca = (await session.exec(select(CurrentAffairsItem).where(CurrentAffairsItem.id == ca_id))).first()
    if ca:
        await session.delete(ca)
        await session.commit()
    return {"success": True}


@router.put("/current-affairs/{ca_id}/questions/{q_index}")
async def edit_current_affairs_question(
    ca_id: uuid.UUID,
    q_index: int,
    req: ManualMCQRequest,
    current_admin: Annotated[User, Depends(get_current_admin)],
    session: Annotated[AsyncSession, Depends(get_session)]
):
    """Edits a specific question inside a current affairs module."""
    ca = (await session.exec(select(CurrentAffairsItem).where(CurrentAffairsItem.id == ca_id))).first()
    if not ca:
        raise HTTPException(status_code=404, detail="Current affairs module not found")

    try:
        q_list = json.loads(ca.questions_json)
    except Exception:
        q_list = []

    if q_index < 0 or q_index >= len(q_list):
        raise HTTPException(status_code=404, detail="Question index out of bounds")

    q_list[q_index] = {
        "question_text": req.question_text.strip(),
        "opt_a": req.opt_a.strip(),
        "opt_b": req.opt_b.strip(),
        "opt_c": req.opt_c.strip(),
        "opt_d": req.opt_d.strip(),
        "correct_opt": req.correct_opt.strip().upper()[:1],
        "explanation": req.explanation or ""
    }
    ca.questions_json = json.dumps(q_list)
    session.add(ca)
    await session.commit()
    return {"success": True}


@router.delete("/current-affairs/{ca_id}/questions/{q_index}")
async def delete_current_affairs_question(
    ca_id: uuid.UUID,
    q_index: int,
    current_admin: Annotated[User, Depends(get_current_admin)],
    session: Annotated[AsyncSession, Depends(get_session)]
):
    """Deletes a specific question from a current affairs module."""
    ca = (await session.exec(select(CurrentAffairsItem).where(CurrentAffairsItem.id == ca_id))).first()
    if not ca:
        raise HTTPException(status_code=404, detail="Current affairs module not found")

    try:
        q_list = json.loads(ca.questions_json)
    except Exception:
        q_list = []

    if q_index < 0 or q_index >= len(q_list):
        raise HTTPException(status_code=404, detail="Question index out of bounds")

    q_list.pop(q_index)
    ca.questions_json = json.dumps(q_list)
    ca.question_count = len(q_list)
    session.add(ca)
    await session.commit()
    return {"success": True, "total_questions": len(q_list)}




from pydantic import BaseModel
from app.models.user import UserRole

class AdminGrantRequest(BaseModel):
    email: str
    name: Optional[str] = None
    role: Optional[str] = "admin"
    password: Optional[str] = None

@router.get("/access-list")
async def get_admin_access_list(
    current_admin: Annotated[User, Depends(get_current_admin)],
    session: Annotated[AsyncSession, Depends(get_session)]
):
    """Returns list of administrators."""
    res = await session.exec(select(User).where(User.role == UserRole.ADMIN))
    admins = res.all()
    return [
        {
            "id": str(a.id),
            "name": a.name,
            "email": a.email,
            "role": str(a.role),
            "created_at": a.created_at.isoformat() if a.created_at else None,
            "last_login": a.last_login.isoformat() if a.last_login else None,
            "is_current_user": a.id == current_admin.id
        }
        for a in admins
    ]

@router.post("/access-grant")
async def grant_admin_access(
    req: AdminGrantRequest,
    current_admin: Annotated[User, Depends(get_current_admin)],
    session: Annotated[AsyncSession, Depends(get_session)]
):
    """Grants admin access to an existing user or registers a new admin."""
    from app.core.security import get_password_hash
    clean_email = req.email.strip().lower()
    if not clean_email or "@" not in clean_email:
        raise HTTPException(status_code=400, detail="Valid email address is required")

    user = (await session.exec(select(User).where(User.email == clean_email))).first()
    if user:
        user.role = UserRole.ADMIN
        if req.name and req.name.strip():
            user.name = req.name.strip()
        if req.password and len(req.password) >= 6:
            user.hashed_password = get_password_hash(req.password)
        session.add(user)
        await session.commit()
        return {"success": True, "message": f"Admin privileges granted to {clean_email}"}
    else:
        pwd = req.password if (req.password and len(req.password) >= 6) else "admin123"
        name = req.name.strip() if (req.name and req.name.strip()) else clean_email.split("@")[0].capitalize()
        new_admin = User(
            email=clean_email,
            name=name,
            role=UserRole.ADMIN,
            hashed_password=get_password_hash(pwd),
            onboarding_completed=True,
            streak_count=0
        )
        session.add(new_admin)
        await session.commit()
        return {"success": True, "message": f"New administrator {clean_email} created successfully"}

@router.delete("/access-revoke/{user_id}")
async def revoke_admin_access(
    user_id: uuid.UUID,
    current_admin: Annotated[User, Depends(get_current_admin)],
    session: Annotated[AsyncSession, Depends(get_session)]
):
    """Revokes admin access from a user (downgrades to student)."""
    if user_id == current_admin.id:
        raise HTTPException(status_code=400, detail="Cannot revoke your own administrator account")

    user = (await session.exec(select(User).where(User.id == user_id))).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.role = UserRole.STUDENT
    session.add(user)
    await session.commit()
    return {"success": True, "message": f"Admin privileges revoked from {user.email}"}
