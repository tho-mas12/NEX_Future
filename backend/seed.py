import asyncio
import os

from app.core.database import init_db, async_session_maker
from app.core.security import hash_password
from app.models.user import User, UserRole, TargetExam
from app.models.topic import Topic, SubjectEnum
from app.models.question import Question
from app.models.roadmap import RoadmapTemplate
from sqlmodel import select

async def seed_data():
    await init_db()
    async with async_session_maker() as session:
        # Check if admin already exists
        result = await session.exec(select(User).where(User.email == "admin@examrail.in"))
        admin = result.first()
        if not admin:
            admin = User(
                name="ExamRail Admin",
                email="admin@examrail.in",
                hashed_password=hash_password("admin123"),
                role=UserRole.ADMIN,
                onboarding_completed=True
            )
            session.add(admin)

        # Check sample demo user
        result = await session.exec(select(User).where(User.email == "student@examrail.in"))
        student = result.first()
        if not student:
            student = User(
                name="Siddharth Rao",
                email="student@examrail.in",
                hashed_password=hash_password("student123"),
                role=UserRole.USER,
                target_exam=TargetExam.CGL,
                streak_count=14,
                onboarding_completed=True
            )
            session.add(student)

        # Add initial sample topic
        result = await session.exec(select(Topic).limit(1))
        topic = result.first()
        if not topic:
            topic = Topic(
                subject=SubjectEnum.QUANT,
                title="Percentages: Foundations & Shortcut Techniques (Day 1)",
                youtube_embed_id="dQw4w9WgXcQ",
                pdf_url="https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
                weightage_score=3.0
            )
            session.add(topic)
            await session.commit()
            await session.refresh(topic)

            # Sample MCQ
            mcq1 = Question(
                topic_id=topic.id,
                question_text="A student multiplied a number by 3/5 instead of 5/3. What is the percentage error in the calculation?",
                opt_a="54%",
                opt_b="64%",
                opt_c="36%",
                opt_d="48%",
                correct_opt="B",
                explanation="Let number = 15. Correct value = 15 * (5/3) = 25. Erroneous value = 15 * (3/5) = 9. Error = 25 - 9 = 16. Error % = (16 / 25) * 100 = 64%."
            )
            mcq2 = Question(
                topic_id=topic.id,
                question_text="If the price of petrol increases by 25%, by what percent must a motorist reduce consumption to keep expenditure constant?",
                opt_a="20%",
                opt_b="25%",
                opt_c="16.66%",
                opt_d="30%",
                correct_opt="A",
                explanation="Reduction % = [r / (100 + r)] * 100 = [25 / 125] * 100 = 20%."
            )
            session.add(mcq1)
            session.add(mcq2)

            roadmap_item = RoadmapTemplate(
                exam_type=TargetExam.CGL,
                day_number=1,
                topic_id=topic.id
            )
            session.add(roadmap_item)

        await session.commit()
        print("Database initialized and demo accounts seeded successfully!")
        print("Admin: admin@examrail.in / admin123")
        print("Student: student@examrail.in / student123")

if __name__ == "__main__":
    asyncio.run(seed_data())
