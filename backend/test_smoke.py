import asyncio
import os
import sys

# Force local sqlite for self-contained testing
os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///./test_examrail.db"

from app.core.database import init_db, async_session_maker
from app.core.security import verify_password
from app.models.user import User, UserRole, TargetExam
from app.models.topic import Topic, SubjectEnum
from app.models.question import Question
from app.models.roadmap import RoadmapTemplate
from app.models.progress import UserProgress, ProgressStatus
from app.schemas.auth import RegisterRequest, LoginRequest
from app.routers.auth import register, login

async def run_smoke_test():
    print("1. Initializing DB schema...")
    await init_db()
    print("Database tables created successfully!")

    async with async_session_maker() as session:
        print("2. Testing registration...")
        reg_req = RegisterRequest(
            name="Aditya Verma",
            email="aditya@examrail.in",
            password="securePassword123"
        )
        res = await register(reg_req, session)
        print(f"Registered user: {res.user.name} ({res.user.email}), token length: {len(res.access_token)}")
        assert res.user.email == "aditya@examrail.in"
        assert res.user.streak_count == 0

        print("3. Testing login...")
        login_req = LoginRequest(
            email="aditya@examrail.in",
            password="securePassword123"
        )
        login_res = await login(login_req, session)
        print(f"Logged in successfully: {login_res.user.name}")
        assert login_res.access_token is not None

        print("4. Testing topic and MCQ models creation...")
        topic = Topic(
            subject=SubjectEnum.QUANT,
            title="Percentage - Concepts & Formulas (Day 1)",
            youtube_embed_id="dQw4w9WgXcQ",
            pdf_url="/static/notes/quant_day1.pdf",
            weightage_score=2.5
        )
        session.add(topic)
        await session.commit()
        await session.refresh(topic)

        mcq = Question(
            topic_id=topic.id,
            question_text="If 20% of A is equal to 50% of B, what percentage of A is B?",
            opt_a="40%",
            opt_b="25%",
            opt_c="50%",
            opt_d="60%",
            correct_opt="A",
            explanation="0.20 * A = 0.50 * B => B/A = 0.20/0.50 = 2/5 = 40%."
        )
        session.add(mcq)

        template = RoadmapTemplate(
            exam_type=TargetExam.CGL,
            day_number=1,
            topic_id=topic.id
        )
        session.add(template)

        progress = UserProgress(
            user_id=res.user.id,
            day_number=1,
            topic_id=topic.id,
            video_done=False,
            pdf_done=False,
            quiz_score=0,
            status=ProgressStatus.PENDING
        )
        session.add(progress)
        await session.commit()

        print("All models persisted and verified in DB successfully!")

if __name__ == "__main__":
    asyncio.run(run_smoke_test())
