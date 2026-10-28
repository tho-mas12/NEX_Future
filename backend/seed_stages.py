import asyncio
import uuid
from sqlmodel import select
from app.core.database import init_db, async_session_maker
from app.models.settings import GlobalSettings
from app.models.topic import Topic, SubjectEnum
from app.models.lesson import Lesson
from app.models.question import Question

# 4-Stage Curriculum Data Definitions
CURRICULUM_DATA = [
    # STAGE 1: FOUNDATIONS (Days 1 to 45) -> English + Modern History + Daily Reasoning
    {
        "stage": 1,
        "subject": SubjectEnum.ENGLISH,
        "topic": "English Language & Grammar Mastery",
        "lessons": [
            ("Subject-Verb Agreement: The 15 Golden SSC Rules", "Golden rules: Neither/Nor, As well as, Collective nouns, Each/Every.", "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"),
            ("Tenses & Conditionals: Zero, First & Second Conditionals", "If + Past Perfect -> Would have + V3. Spotting tense mismatches in 3 seconds.", "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"),
            ("Prepositions: Fixed Prepositions & Phrasal Verbs", "Abide by, Accused of, Prevent from + V-ing. Eliminating wrong prepositions.", "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"),
            ("Active & Passive Voice: Fast Transformation Matrix", "Past indefinite -> was/were + V3. Never change the tense.", "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"),
            ("Direct & Indirect Speech: Inversion & Pronoun Shifts", "Says to -> tells, Said to -> told. Had + V3 rules.", "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"),
            ("Vocabulary: High-Frequency One Word Substitutions (Set 1)", "Roots: -cide, -cracy, -phobia, -phil. 40 roots that solve 300 words.", "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"),
            ("Idioms & Phrases: Repeated SSC Questions", "Bite the bullet, Once in a blue moon, Turn a blind eye.", "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"),
            ("Cloze Test & Sentence Rearrangement (PQRS)", "First sentence identification: noun before pronoun, linking conjunctions.", "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"),
        ]
    },
    {
        "stage": 1,
        "subject": SubjectEnum.GS,
        "topic": "Modern Indian History (1757 - 1947)",
        "lessons": [
            ("Battle of Plassey & Buxar: British Dominance", "1757 Plassey (Siraj-ud-Daula vs Clive), 1764 Buxar (Mir Qasim). Treaty of Allahabad 1765.", "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"),
            ("Revolt of 1857: Key Centers & Leaders", "Delhi: Bahadur Shah, Kanpur: Nana Saheb, Jhansi: Rani Lakshmi Bai. Immediate cause: Enfeild cartridges.", "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"),
            ("Socio-Religious Reform Movements", "Brahmo Samaj (Raja Ram Mohan Roy), Arya Samaj (Dayanand Saraswati), Satya Shodhak (Jyotirao Phule).", "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"),
            ("Indian National Congress & Partition of Bengal (1905)", "Founded 1885 by A.O. Hume. Lord Curzon 1905 partition. Swadeshi movement & Boycott.", "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"),
            ("Gandhian Era Part 1: Champaran to Non-Cooperation", "1917 Champaran (Indigo), 1918 Kheda, 1919 Rowlatt Act & Jallianwala Bagh. 1920 NCM.", "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"),
            ("Civil Disobedience & Round Table Conferences", "1930 Dandi Salt March. Gandhi-Irwin Pact 1931. Poona Pact 1932 (Ambedkar & Gandhi).", "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"),
            ("Quit India Movement & Independence (1942 - 1947)", "Do or Die slogan. Cabinet Mission 1946. Mountbatten Plan June 3 1947.", "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"),
        ]
    },
    {
        "stage": 1,
        "subject": SubjectEnum.REASONING,
        "topic": "Daily Reasoning Sectional Foundation",
        "lessons": [
            ("Coding-Decoding & Letter Shifting Shortcuts", "EJOTY (5, 10, 15, 20, 25), Opposite pairs: AZ, BY, CX, DW, EV, FU, GT, HS, IR, JQ, KP, LO, MN.", "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"),
            ("Number Series & Missing Term Patterns", "Square + 1, Cube - 1, Alternating differences, Fibonacci variations.", "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"),
            ("Syllogisms: Venn Diagrams & 100/50 Concept", "All A are B + All B are C -> All A are C. Some + No -> Some Not.", "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"),
            ("Direction & Distance with Pythagoras Trick", "Shadow rules: Morning shadow falls west; Evening shadow falls east. Triplets 3-4-5, 5-12-13, 8-15-17.", "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"),
            ("Blood Relations: Family Tree Symbols", "+ Male, - Female, = Spouse, | Generation gap. Avoid guessing gender from name.", "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"),
        ]
    },

    # STAGE 2: CORE CONCEPTS (Days 46 to 115) -> Advanced Maths + Indian Polity
    {
        "stage": 2,
        "subject": SubjectEnum.QUANT,
        "topic": "Advanced Mathematics",
        "lessons": [
            ("Algebra: Algebraic Identities & Value-Putting", "If x + 1/x = k, then x^2 + 1/x^2 = k^2 - 2, x^3 + 1/x^3 = k^3 - 3k.", "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"),
            ("Algebra: Symmetric Equations & Degree Balancing", "Symmetric value trick: put a = b = c = 1 to eliminate complex polynomial expansions.", "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"),
            ("Geometry: Triangle Similarity & Congruence", "Area ratio = square of side ratio. Angle bisector theorem: AB/AC = BD/DC.", "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"),
            ("Geometry: Circle Theorems, Tangents & Chords", "Tangent-Secant: PT^2 = PA * PB. Intersecting chords: AP * PB = CP * PD.", "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"),
            ("Trigonometry: Basic Ratios & Standard Angle Values", "Value substitution: Put theta = 45 deg or 0/90 deg when options contain numbers.", "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"),
            ("Trigonometry: Maxima & Minima, Height & Distances", "a*sin^2 + b*cos^2: min is min(a,b), max is max(a,b). 30-60-90 triangle ratio: 1 : sqrt(3) : 2.", "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"),
            ("Mensuration 3D: Cylinders, Cones & Spheres", "Multiplier rule: Check for divisibility by 11 and 7 whenever pi (22/7) is in formula.", "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"),
        ]
    },
    {
        "stage": 2,
        "subject": SubjectEnum.GS,
        "topic": "Indian Polity & Constitution",
        "lessons": [
            ("Preamble, Sources of Constitution & Schedules", "Tiered sources: UK (Parliamentary), USA (Fundamental Rights), Ireland (DPSP), Australia (Concurrent).", "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"),
            ("Fundamental Rights (Articles 12 to 35)", "Equality (14-18), Freedom (19-22), Exploitation (23-24), Religion (25-28), Remedies (Article 32).", "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"),
            ("DPSP & Fundamental Duties (Articles 36 to 51A)", "Swaran Singh Committee 1976 (42nd Amendment). 11 Fundamental Duties. Article 44 UCC.", "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"),
            ("Union Executive: President & Vice President", "Article 52-62. Impeachment Article 61. Pardoning Power Article 72. Ordinance Power Article 123.", "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"),
            ("Parliament: Lok Sabha & Rajya Sabha Procedures", "Money Bill Article 110 (Lok Sabha speaker decides). Joint Sitting Article 108.", "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"),
            ("Judiciary: Supreme Court & High Court Writs", "Article 32 (SC) and Article 226 (HC). Habeas Corpus, Mandamus, Prohibition, Certiorari, Quo Warranto.", "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"),
        ]
    },

    # STAGE 3: STRENGTHENING (Days 116 to 160) -> Arithmetic + Geography
    {
        "stage": 3,
        "subject": SubjectEnum.QUANT,
        "topic": "Arithmetic Mathematics",
        "lessons": [
            ("Percentages: Fraction-to-Percentage Conversions", "1/7 = 14.28%, 1/8 = 12.5%, 1/9 = 11.11%, 1/11 = 9.09%, 1/12 = 8.33%.", "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"),
            ("Profit, Loss & Successive Discount Formulas", "Net discount: a + b - (a*b)/100. CP = MP * (100 - D) / (100 + P).", "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"),
            ("Simple & Compound Interest: 2-Year & 3-Year Diff", "Diff for 2 yrs = P*(R/100)^2. Diff for 3 yrs = P*(R/100)^2 * (3 + R/100).", "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"),
            ("Ratio, Proportion & Mixture Allegation", "Allegation rule: (Cheaper - Mean) / (Mean - Dearer) gives ratio of quantities.", "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"),
            ("Time & Work: Efficiency and Alternate Day Logic", "Work = Efficiency * Time. If A is twice as fast as B, A takes half the time.", "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"),
            ("Pipes & Cisterns: Inflow & Emptying Leakage", "Negative efficiency for emptying pipes. Tank capacity = LCM of individual times.", "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"),
            ("Time, Speed & Distance: Train & Platform Crossing", "Converting km/h to m/s: multiply by 5/18. When passing platform, distance = Train L + Platform L.", "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"),
            ("Boats & Streams: Upstream & Downstream Velocity", "Downstream = u + v, Upstream = u - v. Boat speed u = (D + U)/2, Stream speed v = (D - U)/2.", "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"),
        ]
    },
    {
        "stage": 3,
        "subject": SubjectEnum.GS,
        "topic": "Indian & World Geography",
        "lessons": [
            ("Solar System, Earth Motions & Longitudes/Latitudes", "IST is 82.5 deg East (+5 hrs 30 mins GMT). International Date Line 180 deg.", "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"),
            ("Physiography of India: Himalayas & Northern Plains", "Greater Himalayas (Himadri), Lesser (Himachal), Outer (Shiwalik). Passes: Shipki La, Nathu La, Zoji La.", "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"),
            ("Drainage Systems: Himalayan vs Peninsular Rivers", "West-flowing: Narmada, Tapi (Rift valley, estuaries). East-flowing: Godavari, Krishna, Cauvery (Deltas).", "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"),
            ("Climate, Monsoons & Soil Types in India", "South-West Monsoon (Arabian Sea + Bay of Bengal). Black soil (Regur, cotton), Laterite soil (Tea/Coffee).", "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"),
            ("National Parks, Biosphere Reserves & Ramsar Sites", "Jim Corbett (First), Kaziranga (One-horned rhino), Gir (Asiatic Lion), Sunderbans (Mangrove).", "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"),
        ]
    },

    # STAGE 4: GRAND FINALE & REVISION (Days 161 to 180) -> Ancient/Medieval, Economy, Science & Mocks
    {
        "stage": 4,
        "subject": SubjectEnum.GS,
        "topic": "General Studies Final Frontier",
        "lessons": [
            ("Ancient India: Indus Valley & Mauryan Empire", "Harappa (Daya Ram Sahni), Mohenjodaro (Great Bath). Ashoka Edicts (Brahmi script).", "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"),
            ("Medieval India: Delhi Sultanate & Mughal Dynasty", "Slave Dynasty (Qutb-ud-din Aibak), Alauddin Khilji (Market reforms). Akbar (Din-i-Ilahi).", "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"),
            ("Economics: Inflation, Monetary Policy & Fiscal Deficit", "RBI tools: Repo rate, Reverse repo, CRR, SLR. Types of inflation: Cost-push, Demand-pull.", "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"),
            ("General Science: Physics, Chemistry & Biology Highlights", "Ohm's Law, Human blood groups (AB+ universal receiver, O- universal donor), Vitamins.", "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"),
        ]
    }
]

async def seed_curriculum():
    print("1. Initializing DB schema...")
    await init_db()

    async with async_session_maker() as session:
        # 1. Global Settings
        settings_res = await session.exec(select(GlobalSettings).where(GlobalSettings.id == 1))
        settings_obj = settings_res.first()
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
            print("Initialized GlobalSettings: 15 min timer, 25 Qs, 80% pass criteria, 2-day revision deadline.")

        day_counter = 1
        total_lessons = 0
        total_questions = 0

        # 2. Iterate and seed curriculum
        for cat in CURRICULUM_DATA:
            t_stmt = select(Topic).where(Topic.title == cat["topic"])
            t_res = await session.exec(t_stmt)
            topic = t_res.first()
            if not topic:
                topic = Topic(
                    subject=cat["subject"],
                    stage=cat["stage"],
                    title=cat["topic"],
                    weightage_score=2.0
                )
                session.add(topic)
                await session.commit()
                await session.refresh(topic)

            for l_title, trick_notes, yt_url in cat["lessons"]:
                l_stmt = select(Lesson).where(Lesson.title == l_title)
                l_res = await session.exec(l_stmt)
                lesson = l_res.first()
                if not lesson:
                    lesson = Lesson(
                        topic_id=topic.id,
                        title=l_title,
                        day_sequence=day_counter,
                        youtube_embed_id=yt_url.split('/')[-1],
                        pdf_url="/static/notes/formula_card.pdf",
                        short_trick_notes=trick_notes
                    )
                    session.add(lesson)
                    await session.commit()
                    await session.refresh(lesson)
                    total_lessons += 1
                    day_counter += 1

                    # Seed 20 Practice/Test Questions per Lesson
                    for q_idx in range(1, 21):
                        q = Question(
                            lesson_id=lesson.id,
                            question_text=f"[{cat['subject']} - {lesson.title}] Practice Problem #{q_idx}: Which method gives the most rapid solution in SSC CGL Tier 1?",
                            opt_a="Option A (Formula derivation)",
                            opt_b="Option B (Vedic shortcut / Value substitution)",
                            opt_c="Option C (Long division)",
                            opt_d="Option D (Approximation error)",
                            correct_opt="B",
                            explanation=f"Option B is the correct SSC standard answer. {trick_notes}",
                            short_trick=f"Shortcut: {trick_notes}"
                        )
                        session.add(q)
                        total_questions += 1

        await session.commit()
        print(f"Curriculum seeding completed! Added {total_lessons} Lessons and {total_questions} MCQs across 4 Stages.")

seed_stages = seed_curriculum

if __name__ == "__main__":
    asyncio.run(seed_curriculum())
