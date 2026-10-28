import os
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import SQLModel, select
from app.core.config import settings

# Engine configuration
engine_args = {"echo": False, "future": True}
if "sqlite" in settings.DATABASE_URL:
    engine_args["connect_args"] = {"check_same_thread": False}
elif "postgresql+asyncpg" in settings.DATABASE_URL:
    # If connecting to cloud postgres (e.g. Supabase, Neon, Render)
    # enable SSL if not localhost
    if "localhost" not in settings.DATABASE_URL and "127.0.0.1" not in settings.DATABASE_URL:
        import ssl
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        engine_args["connect_args"] = {"ssl": ctx}

engine = create_async_engine(settings.DATABASE_URL, **engine_args)
async_session_maker = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
    
    # Auto-seed if GlobalSettings or Topics are empty
    from app.models.settings import GlobalSettings
    from app.models.topic import Topic
    from app.models.user import User, UserRole
    from app.core.security import get_password_hash

    async with async_session_maker() as session:
        s_res = await session.exec(select(GlobalSettings).where(GlobalSettings.id == 1))
        if not s_res.first():
            default_settings = GlobalSettings(
                id=1,
                mock_timer_mins=15,
                mock_q_count=25,
                revision_pass_percent=80,
                revision_deadline_days=2,
                daily_main_topics_count=2
            )
            session.add(default_settings)
            await session.commit()

        # Check default admin user
        admin_res = await session.exec(select(User).where(User.email == "admin@examrail.in"))
        if not admin_res.first():
            admin = User(
                email="admin@examrail.in",
                name="NEX Lead Admin",
                hashed_password=get_password_hash("admin123"),
                role=UserRole.ADMIN,
                onboarding_completed=True,
                streak_count=45
            )
            session.add(admin)
            await session.commit()

        # Check default student user
        student_res = await session.exec(select(User).where(User.email == "student@examrail.in"))
        if not student_res.first():
            student = User(
                email="student@examrail.in",
                name="Aspirant Arjun",
                hashed_password=get_password_hash("student123"),
                role=UserRole.STUDENT,
                onboarding_completed=True,
                streak_count=12
            )
            session.add(student)
            await session.commit()

        # Check if topics exist; if not, auto-seed 4 stages
        top_res = await session.exec(select(Topic))
        if not top_res.first():
            try:
                from seed_stages import seed_stages
                await seed_stages()
            except Exception as e:
                print("Auto-seed notice:", e)

        # Seed initial PYQs if empty
        from app.models.pyq import PYQDocument
        pyq_check = (await session.exec(select(PYQDocument))).first()
        if not pyq_check:
            sample_pyqs = [
                PYQDocument(year=2024, title="SSC CGL 2024 Tier 1 Official Question Bank (All 39 Shifts)", exam_type="CGL", tier="Tier 1", shift_info="September 2024 Shifts 1-39", pdf_url="https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"),
                PYQDocument(year=2023, title="SSC CGL 2023 Tier 1 & Tier 2 Solved Papers with Short Tricks", exam_type="CGL", tier="Tier 1 + 2", shift_info="July 2023 & Oct 2023", pdf_url="https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"),
                PYQDocument(year=2022, title="SSC CGL 2022 40-Shift TCS Pattern Consolidation", exam_type="CGL", tier="Tier 1", shift_info="December 2022 All Shifts", pdf_url="https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"),
                PYQDocument(year=2021, title="SSC CGL 2021 High-Frequency Repeated Questions", exam_type="CGL", tier="Tier 1", shift_info="August 2021 Shifts", pdf_url="https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf")
            ]
            for p in sample_pyqs:
                session.add(p)
            await session.commit()

        # Seed initial Current Affairs if empty
        from app.models.current_affairs import CurrentAffairsItem
        ca_check = (await session.exec(select(CurrentAffairsItem))).first()
        if not ca_check:
            import json
            ca_q = [
                {"question_text": "Which state recently launched the Mukhyamantri Vriksh Sampada Yojana?", "opt_a": "Chhattisgarh", "opt_b": "Madhya Pradesh", "opt_c": "Odisha", "opt_d": "Jharkhand", "correct_opt": "A", "explanation": "Chhattisgarh launched this initiative to promote commercial tree plantation on private land."},
                {"question_text": "Who was appointed as the Chief of Defence Staff (CDS) of India in recent announcements?", "opt_a": "Gen. Bipin Rawat", "opt_b": "Lt. Gen. Anil Chauhan", "opt_c": "Gen. Manoj Pande", "opt_d": "Adm. R. Hari Kumar", "correct_opt": "B", "explanation": "Lt. Gen. Anil Chauhan (Retd) is the CDS."},
                {"question_text": "India's first 3D-printed post office was inaugurated in which city?", "opt_a": "Hyderabad", "opt_b": "Bengaluru", "opt_c": "Chennai", "opt_d": "Pune", "correct_opt": "B", "explanation": "Inaugurated in Cambridge Layout, Bengaluru by L&T and IIT Madras."},
                {"question_text": "What is the theme of World Environment Day celebrated globally?", "opt_a": "Beat Plastic Pollution", "opt_b": "Only One Earth", "opt_c": "Ecosystem Restoration", "opt_d": "Time for Nature", "correct_opt": "A", "explanation": "Focusing on solutions to plastic pollution under the campaign #BeatPlasticPollution."},
                {"question_text": "Which Indian city achieved the Cleanest City award in Swachh Survekshan for the 7th consecutive year?", "opt_a": "Surat", "opt_b": "Indore", "opt_c": "Navi Mumbai", "opt_d": "Bhopal", "correct_opt": "B", "explanation": "Indore bagged cleanest city for 7th consecutive year."}
            ]
            sample_ca = CurrentAffairsItem(
                title="National & Global Current Affairs Weekly Bulletin (High-Yield SSC Exam Edition)",
                published_date="October 2026",
                summary_notes="Key highlights: 3D-Printed Infrastructure milestones, Environmental summits, Clean City Swachh rankings, and Defense appointments. Read these 5 crucial news items and test your immediate recall with shuffled MCQs.",
                question_count=5,
                questions_json=json.dumps(ca_q)
            )
            session.add(sample_ca)
            await session.commit()

        # Seed initial MockTestCard if empty
        from app.models.mock_test import MockTestCard
        mock_check = (await session.exec(select(MockTestCard))).first()
        if not mock_check:
            import json
            sample_mock = MockTestCard(
                title="Weekly Sunday Mock Arena #1 (Tier 1 Diagnostic Checkpoint)",
                day_number=7,
                duration_mins=15,
                total_questions=25,
                pos_marks=2.0,
                neg_marks=0.5,
                is_active=True,
                is_gated=True,
                questions_json=json.dumps([
                    {"question_text": "If 15 men can complete a work in 20 days, in how many days can 25 men complete the same work?", "opt_a": "10 days", "opt_b": "12 days", "opt_c": "15 days", "opt_d": "14 days", "correct_opt": "B", "explanation": "M1*D1 = M2*D2 => 15*20 = 25*D2 => 300/25 = 12 days."},
                    {"question_text": "Find the odd one out from the given alternatives: 121, 144, 169, 196, 220", "opt_a": "121", "opt_b": "144", "opt_c": "196", "opt_d": "220", "correct_opt": "D", "explanation": "All numbers except 220 are perfect squares (11^2, 12^2, 13^2, 14^2)."}
                ])
            )
            session.add(sample_mock)
            await session.commit()

async def get_session() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_maker() as session:
        yield session
