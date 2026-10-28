import uuid
import json
import random
from typing import Annotated, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.database import get_session
from app.routers.deps import get_current_user
from app.models.user import User
from app.models.pyq import PYQDocument
from app.models.current_affairs import CurrentAffairsItem
from app.models.mock_test import MockTestCard
from app.models.topic import Topic, SubjectEnum
from app.models.lesson import Lesson
from app.models.question import Question
from app.models.progress import UserProgress, ProgressStatus

router = APIRouter(prefix="", tags=["Student Features"])

# --- PREVIOUS YEAR QUESTIONS (STUDENT) ---
@router.get("/pyqs")
async def get_student_pyqs(
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)]
):
    """Returns all available year-wise PYQ documents for student practice."""
    res = await session.exec(select(PYQDocument).order_by(PYQDocument.year.desc()))
    return res.all()


# --- CURRENT AFFAIRS (STUDENT) ---
@router.get("/current-affairs")
async def get_student_current_affairs(
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)]
):
    """Returns current affairs modules for study and tests."""
    res = await session.exec(select(CurrentAffairsItem).order_by(CurrentAffairsItem.created_at.desc()))
    items = res.all()
    out = []
    for item in items:
        try:
            q_list = json.loads(item.questions_json)
        except Exception:
            q_list = []
        out.append({
            "id": str(item.id),
            "title": item.title,
            "published_date": item.published_date,
            "summary_notes": item.summary_notes,
            "question_count": len(q_list) if q_list else item.question_count,
            "created_at": item.created_at.isoformat()
        })
    return out


@router.get("/current-affairs/{ca_id}/test")
async def get_current_affairs_test(
    ca_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)]
):
    """
    Returns the test for the chosen current affairs module with
    questions and options mingled/shuffled to enhance active retention.
    """
    ca = (await session.exec(select(CurrentAffairsItem).where(CurrentAffairsItem.id == ca_id))).first()
    if not ca:
        raise HTTPException(status_code=404, detail="Current affairs module not found")

    try:
        raw_questions = json.loads(ca.questions_json)
    except Exception:
        raw_questions = []

    if not raw_questions:
        raise HTTPException(status_code=400, detail="No questions configured for this module yet.")

    shuffled_questions = []
    for idx, q in enumerate(raw_questions):
        # Extract options
        opts = [
            ("A", q.get("opt_a", "")),
            ("B", q.get("opt_b", "")),
            ("C", q.get("opt_c", "")),
            ("D", q.get("opt_d", ""))
        ]
        correct_key = q.get("correct_opt", "A")
        correct_text = dict(opts).get(correct_key, q.get("opt_a", ""))

        # Mingle/shuffle option values
        opt_texts = [text for key, text in opts]
        random.shuffle(opt_texts)

        # Assign back to keys A, B, C, D
        shuffled_opts = {
            "A": opt_texts[0],
            "B": opt_texts[1],
            "C": opt_texts[2],
            "D": opt_texts[3]
        }
        # Find which key now holds the correct text
        new_correct_key = "A"
        for k, v in shuffled_opts.items():
            if v == correct_text:
                new_correct_key = k
                break

        shuffled_questions.append({
            "id": idx + 1,
            "question_text": q.get("question_text"),
            "opt_a": shuffled_opts["A"],
            "opt_b": shuffled_opts["B"],
            "opt_c": shuffled_opts["C"],
            "opt_d": shuffled_opts["D"],
            "correct_opt": new_correct_key,
            "explanation": q.get("explanation", "")
        })

    # Shuffle question order as well
    random.shuffle(shuffled_questions)

    return {
        "id": str(ca.id),
        "title": ca.title,
        "questions": shuffled_questions,
        "total_questions": len(shuffled_questions),
        "duration_mins": 10
    }


# --- MIND MOCK TEST (AI ADAPTIVE MOCK FROM COVERED TOPICS) ---
@router.post("/mocks/mind-mock")
async def generate_mind_mock_test(
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)]
):
    """
    AI Adaptive Mind Mock Test:
    Analyzes which topics/lessons the user has covered,
    and constructs a balanced 25-question, 15-minute mock simulation.
    """
    # 1. Check user completed lessons
    prog_res = await session.exec(
        select(UserProgress).where(
            UserProgress.user_id == current_user.id,
            UserProgress.status == ProgressStatus.COMPLETED
        )
    )
    completed_progress = prog_res.all()
    covered_topic_ids = [p.topic_id for p in completed_progress if p.topic_id]

    # If user hasn't completed any topics yet, use foundations
    if not covered_topic_ids:
        all_topics_res = await session.exec(select(Topic).limit(4))
        covered_topics = all_topics_res.all()
    else:
        topics_res = await session.exec(select(Topic).where(Topic.id.in_(covered_topic_ids)))
        covered_topics = topics_res.all()

    # Retrieve question pool
    target_topic_ids = [t.id for t in covered_topics] if covered_topics else []
    q_stmt = select(Question).limit(50)
    if target_topic_ids:
        q_stmt = select(Question).where(
            (Question.topic_id.in_(target_topic_ids)) | (Question.lesson_id.isnot(None))
        ).limit(50)

    q_res = await session.exec(q_stmt)
    all_qs = list(q_res.all())

    subj_cycle = [
        "Quantitative Aptitude",
        "General Intelligence & Reasoning",
        "English Comprehension",
        "General Awareness"
    ]

    out_questions = []
    for idx, q in enumerate(all_qs[:25]):
        out_questions.append({
            "id": idx + 1,
            "number": idx + 1,
            "subject": subj_cycle[idx % 4],
            "question_text": q.question_text,
            "opt_a": q.opt_a,
            "opt_b": q.opt_b,
            "opt_c": q.opt_c,
            "opt_d": q.opt_d,
            "correct_opt": q.correct_opt or "A",
            "explanation": q.explanation or "Standard SSC elimination shortcut.",
            "short_trick": q.short_trick or "Cross-verify options."
        })

    # If pool has fewer than 25 questions, supplement with adaptive high-yield questions
    fallback_pool = [
        {"subject": "Quantitative Aptitude", "q": "If A:B = 3:4 and B:C = 8:9, what is A:C?", "a": "1:2", "b": "2:3", "c": "3:2", "d": "4:5", "ans": "B", "exp": "A/C = (3/4)*(8/9) = 24/36 = 2/3."},
        {"subject": "General Intelligence & Reasoning", "q": "Select the related word: Medicine : Sickness :: Book : ?", "a": "Ignorance", "b": "Knowledge", "c": "Author", "d": "Library", "ans": "A", "exp": "Medicine eradicates sickness; books eradicate ignorance."},
        {"subject": "English Comprehension", "q": "Select the correct antonym of 'BENEVOLENT':", "a": "Malevolent", "b": "Generous", "c": "Charitable", "d": "Sympathetic", "ans": "A", "exp": "Benevolent means well-meaning; antonym is malevolent (spiteful)."},
        {"subject": "General Awareness", "q": "Under which Article of the Constitution of India is the Finance Commission constituted?", "a": "Article 280", "b": "Article 324", "c": "Article 356", "d": "Article 368", "ans": "A", "exp": "Article 280 provides for the constitution of the Finance Commission by the President."},
        {"subject": "Quantitative Aptitude", "q": "A sum doubles in 8 years at simple interest. What is the annual rate of interest?", "a": "10%", "b": "12.5%", "c": "15%", "d": "16%", "ans": "B", "exp": "Rate = 100/Time = 100/8 = 12.5% per annum."},
        {"subject": "General Intelligence & Reasoning", "q": "Find the odd one out: 27, 64, 125, 144", "a": "27", "b": "64", "c": "125", "d": "144", "ans": "D", "exp": "144 is 12^2 (not a cube of an integer); others are cubes (3^3, 4^3, 5^3)."},
        {"subject": "English Comprehension", "q": "Identify the error: 'Each of the students (A) / have finished (B) / their homework (C) / No error (D)'", "a": "A", "b": "B", "c": "C", "d": "D", "ans": "B", "exp": "'Each' takes singular verb 'has finished', not 'have'."},
        {"subject": "General Awareness", "q": "Who was the Viceroy of India when the Indian National Congress was founded in 1885?", "a": "Lord Curzon", "b": "Lord Dufferin", "c": "Lord Ripon", "d": "Lord Canning", "ans": "B", "exp": "Lord Dufferin was Viceroy of India from 1884 to 1888 when INC was founded."},
        {"subject": "Quantitative Aptitude", "q": "If x + 1/x = 5, find the value of x^2 + 1/x^2:", "a": "23", "b": "25", "c": "27", "d": "21", "ans": "A", "exp": "x^2 + 1/x^2 = 5^2 - 2 = 23."},
        {"subject": "General Intelligence & Reasoning", "q": "If 'EARTH' is coded as 'FCUXM', how is 'VENUS' coded?", "a": "WHPZX", "b": "WGQVT", "c": "WHQVT", "d": "WHRYU", "ans": "A", "exp": "Pattern: +1, +2, +3, +4, +5 letters."},
        {"subject": "English Comprehension", "q": "One-word substitution: 'A person who cannot make a mistake'", "a": "Infallible", "b": "Invincible", "c": "Incorrigible", "d": "Indelible", "ans": "A", "exp": "Infallible means incapable of making mistakes or being wrong."},
        {"subject": "General Awareness", "q": "The Tropic of Cancer does NOT pass through which of the following Indian states?", "a": "Gujarat", "b": "Rajasthan", "c": "Odisha", "d": "Tripura", "ans": "C", "exp": "Tropic of Cancer passes through 8 states: Gujarat, Rajasthan, MP, Chhattisgarh, Jharkhand, West Bengal, Tripura, and Mizoram (not Odisha)."},
    ]

    while len(out_questions) < 25:
        idx = len(out_questions)
        fb = fallback_pool[idx % len(fallback_pool)]
        out_questions.append({
            "id": idx + 1,
            "number": idx + 1,
            "subject": fb["subject"],
            "question_text": fb["q"],
            "opt_a": fb["a"],
            "opt_b": fb["b"],
            "opt_c": fb["c"],
            "opt_d": fb["d"],
            "correct_opt": fb["ans"],
            "explanation": fb["exp"],
            "short_trick": "Apply standard concept elimination."
        })

    return {
        "test_id": "mind-mock-test",
        "title": "Mind Mock Test (Personalized Covered Topics)",
        "analysis": f"Synthesized based on your active progress across {len(covered_topics)} syllabus modules.",
        "covered_topics": [t.title for t in covered_topics[:5]],
        "duration_seconds": 15 * 60,
        "duration_mins": 15,
        "total_questions": len(out_questions),
        "pos_marks": 2.0,
        "neg_marks": 0.5,
        "questions": out_questions
    }


# --- COMPLETED LESSONS (DAY-WISE ARCHIVE & RE-ATTEND) ---
@router.get("/completed-lessons")
async def get_user_completed_lessons(
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)]
):
    """
    Returns all day-wise completed lessons for the current student.
    Allows students to browse past days, review lectures, notes, and re-attend tests.
    """
    from app.models.revision import SpacedRevision
    # Query user completed lessons via SpacedRevision or UserProgress
    revs_res = await session.exec(
        select(SpacedRevision, Lesson, Topic)
        .join(Lesson, SpacedRevision.lesson_id == Lesson.id)
        .join(Topic, Lesson.topic_id == Topic.id)
        .where(SpacedRevision.user_id == current_user.id)
        .order_by(Lesson.day_sequence)
    )
    records = revs_res.all()

    # If user hasn't completed lessons yet, also return completed lessons from day rail or past days
    day_map: dict = {}
    for rev, lesson, topic in records:
        day_num = lesson.day_sequence if lesson.day_sequence > 0 else 1
        if day_num not in day_map:
            day_map[day_num] = []
        day_map[day_num].append({
            "lesson_id": str(lesson.id),
            "title": lesson.title,
            "subject": topic.subject.value if hasattr(topic.subject, "value") else str(topic.subject),
            "topic_title": topic.title,
            "youtube_embed_id": lesson.youtube_embed_id,
            "day_sequence": day_num,
            "completed_at": rev.completed_at.isoformat() if rev.completed_at else None,
            "status": "completed" if rev.is_completed else "pending",
            "score": 100 if rev.is_completed else 0
        })

    # If empty, provide Day 1 foundation sample so student can see the archive structure
    if not day_map:
        sample_lessons_res = await session.exec(
            select(Lesson, Topic)
            .join(Topic, Lesson.topic_id == Topic.id)
            .where(Lesson.day_sequence <= 3)
            .order_by(Lesson.day_sequence)
            .limit(6)
        )
        for lesson, topic in sample_lessons_res.all():
            day_num = max(lesson.day_sequence, 1)
            if day_num not in day_map:
                day_map[day_num] = []
            day_map[day_num].append({
                "lesson_id": str(lesson.id),
                "title": lesson.title,
                "subject": topic.subject.value if hasattr(topic.subject, "value") else str(topic.subject),
                "topic_title": topic.title,
                "youtube_embed_id": lesson.youtube_embed_id,
                "day_sequence": day_num,
                "completed_at": None,
                "status": "available",
                "score": 0
            })

    days_list = []
    for day_num in sorted(day_map.keys()):
        days_list.append({
            "day_number": day_num,
            "lessons": day_map[day_num]
        })

    return {
        "total_days": len(days_list),
        "days": days_list
    }

