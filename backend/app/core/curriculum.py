"""
Curriculum definitions for SSC CGL & CHSL 180-Day Guided Roadmap and Diagnostic Tests.
"""
from typing import List, Dict
from app.models.topic import SubjectEnum

DIAGNOSTIC_QUESTIONS = [
    {
        "subject": SubjectEnum.QUANT,
        "question_text": "If A's income is 25% more than B's income, then by what percentage is B's income less than A's income?",
        "opt_a": "20%",
        "opt_b": "25%",
        "opt_c": "16.66%",
        "opt_d": "33.33%",
        "correct_opt": "A",
        "explanation": "Let B = 100. Then A = 125. Difference = 25. Percentage less = (25 / 125) * 100 = 20%."
    },
    {
        "subject": SubjectEnum.QUANT,
        "question_text": "A shopkeeper marks an article at 40% above the cost price and allows a discount of 20% on the marked price. What is his net profit percentage?",
        "opt_a": "10%",
        "opt_b": "12%",
        "opt_c": "15%",
        "opt_d": "20%",
        "correct_opt": "B",
        "explanation": "Let CP = 100. MP = 140. SP = 140 * 0.80 = 112. Profit = 112 - 100 = 12%."
    },
    {
        "subject": SubjectEnum.QUANT,
        "question_text": "Two pipes A and B can fill a tank in 12 hours and 15 hours respectively. If both are opened together, how long will they take to fill the tank?",
        "opt_a": "6 hrs 40 mins",
        "opt_b": "7 hrs",
        "opt_c": "5 hrs 30 mins",
        "opt_d": "8 hrs",
        "correct_opt": "A",
        "explanation": "Combined rate = 1/12 + 1/15 = (5 + 4)/60 = 9/60 = 3/20 tank/hr. Time = 20/3 hrs = 6 hrs 40 mins."
    },
    {
        "subject": SubjectEnum.REASONING,
        "question_text": "Select the related word from the given alternatives: Coal : Mine :: Wax : ?",
        "opt_a": "Candle",
        "opt_b": "Beehive",
        "opt_c": "Honey",
        "opt_d": "Lamp",
        "correct_opt": "B",
        "explanation": "Coal is extracted from a Mine; natural wax is obtained from a Beehive."
    },
    {
        "subject": SubjectEnum.REASONING,
        "question_text": "In a code language, if 'PAPER' is written as 'QZODS', how will 'PENCIL' be written?",
        "opt_a": "QDMDFK",
        "opt_b": "QDOBJK",
        "opt_c": "QFMCHK",
        "opt_d": "QDMBHK",
        "correct_opt": "A",
        "explanation": "Pattern: +1, -1, +1, -1, +1. P+1=Q, E-1=D, N-1=M... PENCIL becomes QDMDFK."
    },
    {
        "subject": SubjectEnum.ENGLISH,
        "question_text": "Identify the word most similar in meaning to: 'CANDID'",
        "opt_a": "Deceitful",
        "opt_b": "Frank",
        "opt_c": "Shy",
        "opt_d": "Arrogant",
        "correct_opt": "B",
        "explanation": "'Candid' means truthful, straightforward, and frank."
    },
    {
        "subject": SubjectEnum.ENGLISH,
        "question_text": "Select the correct active/passive form: 'The police caught the thief.'",
        "opt_a": "The thief has been caught by the police.",
        "opt_b": "The thief was caught by the police.",
        "opt_c": "The thief is caught by police.",
        "opt_d": "The thief had caught by police.",
        "correct_opt": "B",
        "explanation": "Simple past active ('caught') converts to 'was caught' in passive voice."
    },
    {
        "subject": SubjectEnum.ENGLISH,
        "question_text": "Find the correctly spelled word:",
        "opt_a": "Accommodate",
        "opt_b": "Acommodate",
        "opt_c": "Accomodate",
        "opt_d": "Accomadate",
        "correct_opt": "A",
        "explanation": "'Accommodate' has double 'c' and double 'm'."
    },
    {
        "subject": SubjectEnum.GA,
        "question_text": "Which Article of the Indian Constitution is known as the 'Heart and Soul of the Constitution' according to Dr. B.R. Ambedkar?",
        "opt_a": "Article 14",
        "opt_b": "Article 21",
        "opt_c": "Article 32",
        "opt_d": "Article 370",
        "correct_opt": "C",
        "explanation": "Article 32 gives the Right to Constitutional Remedies, conferring power to move the Supreme Court."
    },
    {
        "subject": SubjectEnum.GA,
        "question_text": "The Indus Valley Civilization site 'Lothal' is famous for which ancient structure?",
        "opt_a": "Great Bath",
        "opt_b": "Dockyard",
        "opt_c": "Plowed Field",
        "opt_d": "Bronze Dancing Girl",
        "correct_opt": "B",
        "explanation": "Lothal in Gujarat is renowned for having the world's earliest known tidal dockyard."
    }
]

# Standard 180-Day Curriculum Blueprint Topics
SYLLABUS_MODULES = [
    # Quant
    (SubjectEnum.QUANT, "Percentages: Fractional Values & Base Calculation", "dQw4w9WgXcQ"),
    (SubjectEnum.QUANT, "Profit, Loss & Successive Discounts", "dQw4w9WgXcQ"),
    (SubjectEnum.QUANT, "Ratio, Proportion & Mixture Allegation Part 1", "dQw4w9WgXcQ"),
    (SubjectEnum.QUANT, "Ratio, Proportion & Age Problems Part 2", "dQw4w9WgXcQ"),
    (SubjectEnum.QUANT, "Simple & Compound Interest: Formula-free Net Rate", "dQw4w9WgXcQ"),
    (SubjectEnum.QUANT, "Time & Work: Efficiency and Alternate Day Concepts", "dQw4w9WgXcQ"),
    (SubjectEnum.QUANT, "Pipes & Cisterns: Leakage and Emptying Rates", "dQw4w9WgXcQ"),
    (SubjectEnum.QUANT, "Time, Speed & Distance: Relative Speed & Train Crossing", "dQw4w9WgXcQ"),
    (SubjectEnum.QUANT, "Boats & Streams: Upstream & Downstream Velocity", "dQw4w9WgXcQ"),
    (SubjectEnum.QUANT, "Number System: Unit Digit, Remainder Theorem & Divisibility", "dQw4w9WgXcQ"),
    (SubjectEnum.QUANT, "LCM & HCF: Division Method & Co-Prime Applications", "dQw4w9WgXcQ"),
    (SubjectEnum.QUANT, "Algebra: Identities, Value-Putting & Symmetric Equations", "dQw4w9WgXcQ"),
    (SubjectEnum.QUANT, "Geometry: Triangle Congruence, Similarity & Incenter/Circumcenter", "dQw4w9WgXcQ"),
    (SubjectEnum.QUANT, "Geometry: Circles, Tangents & Chord Theorems", "dQw4w9WgXcQ"),
    (SubjectEnum.QUANT, "Mensuration 2D & 3D: Cylinders, Cones & Spheres Volume", "dQw4w9WgXcQ"),
    (SubjectEnum.QUANT, "Trigonometry: Basic Ratios, Identities & Height & Distances", "dQw4w9WgXcQ"),
    (SubjectEnum.QUANT, "Data Interpretation: Bar Graphs, Pie Charts & Tabulation Mastery", "dQw4w9WgXcQ"),

    # Reasoning
    (SubjectEnum.REASONING, "Analogy: Verbal, Number & Letter Relationships", "dQw4w9WgXcQ"),
    (SubjectEnum.REASONING, "Classification & Odd One Out Techniques", "dQw4w9WgXcQ"),
    (SubjectEnum.REASONING, "Coding-Decoding: Pattern Shift, Opposite Letters & Matrix", "dQw4w9WgXcQ"),
    (SubjectEnum.REASONING, "Blood Relations: Family Tree & Coded Relations", "dQw4w9WgXcQ"),
    (SubjectEnum.REASONING, "Direction & Distance: Shadow Concepts & Pythagoras Theorem", "dQw4w9WgXcQ"),
    (SubjectEnum.REASONING, "Syllogism: Venn Diagram & 100/50 Rule Mastery", "dQw4w9WgXcQ"),
    (SubjectEnum.REASONING, "Order & Ranking: Position Swapping & Overlapping Cases", "dQw4w9WgXcQ"),
    (SubjectEnum.REASONING, "Seating Arrangement: Linear & Circular Formations", "dQw4w9WgXcQ"),
    (SubjectEnum.REASONING, "Non-Verbal: Paper Folding, Cutting & Mirror Images", "dQw4w9WgXcQ"),
    (SubjectEnum.REASONING, "Clock & Calendar: Angle Calculation & Leap Year Tricks", "dQw4w9WgXcQ"),

    # English
    (SubjectEnum.ENGLISH, "Subject-Verb Agreement: High-Frequency SSC Rules", "dQw4w9WgXcQ"),
    (SubjectEnum.ENGLISH, "Tenses & Conditional Sentences (Rules 1 to 20)", "dQw4w9WgXcQ"),
    (SubjectEnum.ENGLISH, "Prepositions & Fixed Preposition Pairings", "dQw4w9WgXcQ"),
    (SubjectEnum.ENGLISH, "Active & Passive Voice: Step-by-Step Conversion Rules", "dQw4w9WgXcQ"),
    (SubjectEnum.ENGLISH, "Direct & Indirect Speech: Interrogative & Imperative Sentences", "dQw4w9WgXcQ"),
    (SubjectEnum.ENGLISH, "Vocabulary: 100 Most Repeated SSC One-Word Substitutions", "dQw4w9WgXcQ"),
    (SubjectEnum.ENGLISH, "Vocabulary: Idioms & Phrases with Mnemonics", "dQw4w9WgXcQ"),
    (SubjectEnum.ENGLISH, "Cloze Test & Sentence Rearrangement (PQRS) Strategies", "dQw4w9WgXcQ"),
    (SubjectEnum.ENGLISH, "Reading Comprehension: Tone, Main Idea & Inference", "dQw4w9WgXcQ"),

    # GA
    (SubjectEnum.GA, "Ancient History: Indus Valley, Vedic Era & Buddhism/Jainism", "dQw4w9WgXcQ"),
    (SubjectEnum.GA, "Medieval History: Delhi Sultanate & Mughal Empire Key Battles", "dQw4w9WgXcQ"),
    (SubjectEnum.GA, "Modern History: Revolt of 1857 & Freedom Movement Chronology", "dQw4w9WgXcQ"),
    (SubjectEnum.GA, "Indian Polity: Preamble, Fundamental Rights & DPSP", "dQw4w9WgXcQ"),
    (SubjectEnum.GA, "Indian Polity: President, Prime Minister & Supreme Court", "dQw4w9WgXcQ"),
    (SubjectEnum.GA, "Physical Geography: Solar System, Earth Layers & Volcanoes", "dQw4w9WgXcQ"),
    (SubjectEnum.GA, "Indian Geography: Rivers, National Parks & Climate Zones", "dQw4w9WgXcQ"),
    (SubjectEnum.GA, "Economics: Inflation, GDP, Monetary Policy & Five-Year Plans", "dQw4w9WgXcQ"),
    (SubjectEnum.GA, "General Science: Physics Laws, Optics & Electricity Essentials", "dQw4w9WgXcQ"),
    (SubjectEnum.GA, "General Science: Biology - Human Physiology, Diseases & Vitamins", "dQw4w9WgXcQ"),
]
