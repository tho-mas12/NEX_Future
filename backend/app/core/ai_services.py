import os
import json
import urllib.request
import urllib.error
from typing import Optional, Dict, List, Any
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from app.models.settings import GlobalSettings

async def get_gemini_key(session: AsyncSession) -> Optional[str]:
    # Check database GlobalSettings first, then environment variable
    try:
        s_res = await session.exec(select(GlobalSettings).where(GlobalSettings.id == 1))
        settings_obj = s_res.first()
        if settings_obj and settings_obj.gemini_api_key and len(settings_obj.gemini_api_key.strip()) > 5:
            return settings_obj.gemini_api_key.strip()
    except Exception:
        pass
    return os.getenv("GEMINI_API_KEY")

def call_gemini_rest(prompt: str, api_key: str) -> Optional[str]:
    """Invokes Gemini 1.5 Flash via REST API."""
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
    headers = {"Content-Type": "application/json"}
    body = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.4, "maxOutputTokens": 2048}
    }
    req = urllib.request.Request(url, data=json.dumps(body).encode("utf-8"), headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            candidates = data.get("candidates", [])
            if candidates:
                text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                return text.strip()
    except Exception as e:
        print(f"Gemini API call failed: {e}")
        return None

async def generate_lesson_summary_and_tricks(
    title: str,
    youtube_url: str,
    subject: str,
    session: AsyncSession
) -> Dict[str, str]:
    """Generates short concept notes and speed tricks via AI or structured fallback."""
    api_key = await get_gemini_key(session)
    if api_key:
        prompt = f"""
You are an expert SSC CGL & CHSL educator and exam topper.
For the lesson:
Title: {title}
Subject: {subject}
Reference URL: {youtube_url}

Produce high-yield, concise exam-hall study notes.
Include:
1. Core Definitions & Must-know Formulas.
2. 3 High-speed Vedic / Elimination Tricks to solve questions in under 25 seconds.
3. Common examiner trap and how to avoid it.

Keep the total text under 250 words, structured with clean bullet points and emojis.
Do not use markdown headers, just clean formatted text.
"""
        result = call_gemini_rest(prompt, api_key)
        if result:
            return {
                "summary": result,
                "speed_tricks": f"⚡ Speed Drill: For {title}, test options with unit digits or digital sum first before running algebraic calculations."
            }

    # High quality structured domain fallback
    subj_name = subject.capitalize()
    fallback_notes = (
        f"🎯 {title} - High-Yield Core Concept Sheet ({subj_name})\n\n"
        f"• Core Principle: Master the canonical Tier 1 definition and standard identity patterns for {title}.\n"
        f"• ⚡ Vedic Speed Trick 1: Value-putting method. Test extreme options (0, 1, or multiples) to eliminate 2 incorrect choices within 10 seconds.\n"
        f"• ⚡ Vedic Speed Trick 2: Digital sum / Last two digits verification to bypass manual multiplication.\n"
        f"• ⚡ Speed Trick 3: Inverse proportionality / Ratio multiplier technique for step-2 instantaneous calculation.\n"
        f"• ⚠️ Exam Trap: Beware of mismatched unit conversions (e.g. km/h vs m/s or annual vs semi-annual compounding)."
    )
    return {
        "summary": fallback_notes,
        "speed_tricks": f"⚡ Pro Shortcut for {title}: Verify unit digit or inverse ratio to complete in 20 seconds."
    }

async def generate_stage2_active_recall(
    title: str,
    notes: str,
    subject: str,
    session: AsyncSession
) -> List[Dict[str, Any]]:
    """Generates 5-10 Stage 2 Active Recall flashcard questions with hidden shortcuts."""
    api_key = await get_gemini_key(session)
    if api_key:
        prompt = f"""
Create 5 active-recall drill questions for SSC CGL Tier 1/2 on topic: "{title}" ({subject}).
Notes: {notes}

Return strictly a valid JSON array of 5 objects with keys:
- "question_text": clean question without brackets
- "opt_a": option A
- "opt_b": option B
- "opt_c": option C
- "opt_d": option D
- "correct_opt": "A", "B", "C", or "D"
- "explanation": step-by-step reasoning
- "short_trick": the fast 15-second shortcut (Vedic/elimination)
Strictly output JSON only, no markdown ticks, no preamble.
"""
        raw = call_gemini_rest(prompt, api_key)
        if raw:
            try:
                clean = raw.strip()
                if clean.startswith("```json"):
                    clean = clean[7:]
                if clean.endswith("```"):
                    clean = clean[:-3]
                parsed = json.loads(clean.strip())
                if isinstance(parsed, list) and len(parsed) >= 3:
                    return parsed
            except Exception as e:
                print("Failed to parse Gemini JSON:", e)

    # Deterministic high-yield fallback
    return [
        {
            "question_text": f"In {title}, what is the quickest way to verify if an option is mathematically valid?",
            "opt_a": "Apply unit digit and digital root check",
            "opt_b": "Complete long algebraic expansion",
            "opt_c": "Random guess",
            "opt_d": "Plot coordinates on a graph",
            "correct_opt": "A",
            "explanation": "Digital root and last-digit checking reduces verification time from 60s to 8s.",
            "short_trick": "⚡ Shortcut: Digital root (sum of digits mod 9) stays invariant under valid arithmetic."
        },
        {
            "question_text": f"If the primary variable in {title} changes by +25%, what is the net compensatory change required?",
            "opt_a": "-20%",
            "opt_b": "-25%",
            "opt_c": "+20%",
            "opt_d": "-15%",
            "correct_opt": "A",
            "explanation": "If x increases by 1/4 (25%), it must decrease by 1/(4+1) = 1/5 = 20% to stay constant.",
            "short_trick": "⚡ Reciprocal Rule: +a/b change is balanced by -a/(a+b)."
        },
        {
            "question_text": f"What is the most frequent TCS exam trap in {title} problems?",
            "opt_a": "Unit mismatch or overlooked boundary conditions",
            "opt_b": "Misreading option signs",
            "opt_c": "Overly simple questions",
            "opt_d": "None of the above",
            "correct_opt": "A",
            "explanation": "TCS shifts regularly set traps using mixed metric units (hours vs minutes, cm vs m).",
            "short_trick": "⚡ Trap Alert: Always underline given units in the question stem first."
        },
        {
            "question_text": f"Which ratio approach resolves standard problems on {title} without using 'x'?",
            "opt_a": "Direct component/inverse ratio scaling",
            "opt_b": "Quadratic discriminant",
            "opt_c": "Matrix determinant",
            "opt_d": "Logarithmic conversion",
            "correct_opt": "A",
            "explanation": "Ratio scaling sets initial:final units directly, eliminating the need for variables.",
            "short_trick": "⚡ Pro Rule: Assume standard total units = LCM of denominators."
        },
        {
            "question_text": f"For {title}, what Tier 2 mastery shortcut avoids quadratic equation setup?",
            "opt_a": "Value-substitution from options (back-solving)",
            "opt_b": "Full quadratic formula factorization",
            "opt_c": "Derivation from first principles",
            "opt_d": "Skipping and guessing",
            "correct_opt": "A",
            "explanation": "In multiple-choice testing, testing option (B) and (C) first locates roots 3x faster.",
            "short_trick": "⚡ Back-solve: Test middle options first to determine direction of error."
        }
    ]

async def generate_stage3_quiz_set(
    title: str,
    notes: str,
    subject: str,
    set_num: int,
    difficulty: str,
    session: AsyncSession
) -> List[Dict[str, Any]]:
    """Generates 5 questions for a specific quiz set (Set 1, Set 2, Set 3, or Revision)."""
    api_key = await get_gemini_key(session)
    difficulty_label = "Medium (Tier 1 Speed)" if set_num == 1 else "Medium-Hard (Tier 1 Trap)" if set_num == 2 else "Hard / Advanced (Tier 2)" if set_num == 3 else "Challenging Spaced Revision"

    if api_key:
        prompt = f"""
Create 5 {difficulty_label} multiple choice questions for SSC exam on topic: "{title}" ({subject}).
Quiz Set: Set {set_num}. Difficulty: {difficulty}.
Notes: {notes}

Return strictly a valid JSON array of 5 objects with keys:
- "question_text": question without brackets or topic tags
- "opt_a": string
- "opt_b": string
- "opt_c": string
- "opt_d": string
- "correct_opt": "A", "B", "C", or "D"
- "explanation": step-by-step solution
- "short_trick": 15-second shortcut
Strictly JSON array only.
"""
        raw = call_gemini_rest(prompt, api_key)
        if raw:
            try:
                clean = raw.strip()
                if clean.startswith("```json"):
                    clean = clean[7:]
                if clean.endswith("```"):
                    clean = clean[:-3]
                parsed = json.loads(clean.strip())
                if isinstance(parsed, list) and len(parsed) >= 3:
                    return parsed
            except Exception as e:
                print("Failed to parse Gemini quiz JSON:", e)

    # Deterministic varied sets
    set_descriptions = {
        1: ("Foundational Speed Drill", "Direct shortcut application"),
        2: ("Twist & Trap Section", "Boundary conditions & multi-step elimination"),
        3: ("Tier 2 Advanced Scenario", "Inverse ratio and algebraic simplification"),
        4: ("High-Yield Spaced Revision", "Comprehensive recall and trap defense")
    }
    desc, technique = set_descriptions.get(set_num, ("Mastery Checkpoint", "Elimination"))

    return [
        {
            "question_text": f"[{desc}] What is the direct outcome in {title} when the input ratio is inverted under standard conditions?",
            "opt_a": "The solution scales inversely according to standard Vedic multiplier",
            "opt_b": "The solution remains static",
            "opt_c": "The value drops to zero",
            "opt_d": "Cannot be determined without a 3rd parameter",
            "correct_opt": "A",
            "explanation": f"Under {title}, reciprocal relation governs inverted parameters ({technique}).",
            "short_trick": f"⚡ Set {set_num} Rule: Swap ratio components directly (A:B becomes B:A)."
        },
        {
            "question_text": f"[{desc}] In a 2026 TCS Tier 1 question on {title}, how is the 2nd step calculated in under 15 seconds?",
            "opt_a": "By using option back-substitution and digital root",
            "opt_b": "By writing 6 lines of algebraic derivation",
            "opt_c": "By solving standard polynomial roots",
            "opt_d": "By approximate guesswork",
            "correct_opt": "A",
            "explanation": "Digital root and option elimination bypasses manual steps completely.",
            "short_trick": "⚡ Shortcut: Check options ending with the matching unit digit."
        },
        {
            "question_text": f"[{desc}] If {title} parameters are increased by a factor of 3, how does the final result respond?",
            "opt_a": "Increases proportionally as per multiplier",
            "opt_b": "Decreases by 33%",
            "opt_c": "Stays unchanged",
            "opt_d": "Quadruples automatically",
            "correct_opt": "A",
            "explanation": "Linear proportionality applies directly.",
            "short_trick": "⚡ Factor Trick: Output factor = Input factor^degree."
        },
        {
            "question_text": f"[{desc}] To avoid the common time-trap in {title}, which calculation should you do FIRST?",
            "opt_a": "Scan the four options to check variance in unit digits",
            "opt_b": "Multiply all large figures together",
            "opt_c": "Convert to fractions and cross-multiply",
            "opt_d": "Write down standard textbook proofs",
            "correct_opt": "A",
            "explanation": "If all 4 options have distinct unit digits, solving only the unit digit solves the question in 5s.",
            "short_trick": "⚡ Golden Rule: Look at options before looking at scratchpad."
        },
        {
            "question_text": f"[{desc}] In advanced Tier 2 shifts on {title}, which identity provides instantaneous resolution?",
            "opt_a": "Vedic triplet shortcut / direct proportionality identity",
            "opt_b": "Cramer's rule with 3x3 matrices",
            "opt_c": "Lagrange interpolation formula",
            "opt_d": "Taylor polynomial expansion",
            "correct_opt": "A",
            "explanation": "Vedic identities collapse 3-variable equations into single linear comparisons.",
            "short_trick": "⚡ Speed Shortcut: Use Pythagorean/algebraic standard identities."
        }
    ]
