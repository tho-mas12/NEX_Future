"""
Pre-built question pools for Daily Study MCQs and Full 100-Question Weekend Mock Arena.
"""
from typing import List, Dict

SAMPLE_TOPIC_MCQS = [
    {
        "question_text": "If 20% of (A + B) = 50% of (A - B), then find the ratio of A to B.",
        "opt_a": "7 : 3",
        "opt_b": "3 : 7",
        "opt_c": "5 : 2",
        "opt_d": "2 : 5",
        "correct_opt": "A",
        "explanation": "20(A + B) = 50(A - B) => 2A + 2B = 5A - 5B => 3A = 7B => A/B = 7/3."
    },
    {
        "question_text": "A number is increased by 20% and then decreased by 20%. What is the net change in the number?",
        "opt_a": "No change",
        "opt_b": "4% decrease",
        "opt_c": "4% increase",
        "opt_d": "2% decrease",
        "correct_opt": "B",
        "explanation": "Net effect = +20 - 20 - (20*20)/100 = -4% (a 4% decrease)."
    },
    {
        "question_text": "In an examination, 35% of total students failed in Hindi, 45% failed in English, and 20% failed in both. The percentage of students who passed in both subjects is:",
        "opt_a": "40%",
        "opt_b": "50%",
        "opt_c": "60%",
        "opt_d": "30%",
        "correct_opt": "A",
        "explanation": "Total failed = 35 + 45 - 20 = 60%. Passed in both = 100 - 60 = 40%."
    },
    {
        "question_text": "Two numbers are respectively 20% and 50% more than a third number. The ratio of the two numbers is:",
        "opt_a": "2 : 5",
        "opt_b": "3 : 5",
        "opt_c": "4 : 5",
        "opt_d": "6 : 7",
        "correct_opt": "C",
        "explanation": "Let 3rd number = 100. 1st = 120, 2nd = 150. Ratio = 120/150 = 4/5."
    },
    {
        "question_text": "If the price of sugar increases by 30%, by how much percent should a family decrease consumption so that expenditure increases by only 10%?",
        "opt_a": "15.38%",
        "opt_b": "18.25%",
        "opt_c": "12.50%",
        "opt_d": "20.00%",
        "correct_opt": "A",
        "explanation": "Consumption ratio = 110 / 130 = 11 / 13. Reduction = 2 / 13 = 15.38%."
    },
    {
        "question_text": "A man spends 75% of his income. His income increases by 20% and his expenditure increases by 10%. His savings increase by:",
        "opt_a": "37.5%",
        "opt_b": "50%",
        "opt_c": "25%",
        "opt_d": "10%",
        "correct_opt": "B",
        "explanation": "Income = 100, Exp = 75, Save = 25. New Income = 120, New Exp = 82.5, New Save = 37.5. Increase = (12.5 / 25) * 100 = 50%."
    },
    {
        "question_text": "Fresh fruit contains 68% water and dry fruit contains 20% water. How much dry fruit can be obtained from 100 kg of fresh fruits?",
        "opt_a": "32 kg",
        "opt_b": "40 kg",
        "opt_c": "52 kg",
        "opt_d": "80 kg",
        "correct_opt": "B",
        "explanation": "Pulp in 100 kg fresh fruit = 32 kg. In dry fruit, pulp is 80%. Weight of dry fruit = 32 / 0.80 = 40 kg."
    },
    {
        "question_text": "A candidate scores 25% and fails by 30 marks, while another candidate scores 50% and gets 20 marks more than pass marks. The passing percentage is:",
        "opt_a": "33%",
        "opt_b": "40%",
        "opt_c": "35%",
        "opt_d": "30%",
        "correct_opt": "B",
        "explanation": "Difference in % = 25% corresponds to 50 marks. Total marks = 200. Pass marks = 25% of 200 + 30 = 80 marks = 40%."
    },
    {
        "question_text": "When 60 is subtracted from 60% of a number, the result is 60. The number is:",
        "opt_a": "120",
        "opt_b": "150",
        "opt_c": "180",
        "opt_d": "200",
        "correct_opt": "D",
        "explanation": "0.60 * x - 60 = 60 => 0.60 * x = 120 => x = 200."
    },
    {
        "question_text": "If x is 80% of y, what percent of 2x is y?",
        "opt_a": "40%",
        "opt_b": "62.5%",
        "opt_c": "75%",
        "opt_d": "80%",
        "correct_opt": "B",
        "explanation": "x = 0.8y => 2x = 1.6y. Required percentage = (y / 1.6y) * 100 = 100 / 1.6 = 62.5%."
    },
    {
        "question_text": "The population of a town increases by 5% annually. If its present population is 84,000, what will it be after 2 years?",
        "opt_a": "92,610",
        "opt_b": "90,500",
        "opt_c": "92,400",
        "opt_d": "93,000",
        "correct_opt": "A",
        "explanation": "84,000 * (21/20) * (21/20) = 84,000 * 441 / 400 = 210 * 441 = 92,610."
    },
    {
        "question_text": "A reduction of 20% in the price of wheat enables a purchaser to obtain 5 kg more for Rs. 320. The original rate per kg was:",
        "opt_a": "Rs. 16",
        "opt_b": "Rs. 18",
        "opt_c": "Rs. 20",
        "opt_d": "Rs. 12",
        "correct_opt": "A",
        "explanation": "Money saved = 20% of 320 = Rs. 64. Price of 5 kg reduced wheat = Rs. 64 => Reduced rate = 12.80. Original rate = 12.80 / 0.80 = Rs. 16."
    },
    {
        "question_text": "In an election between two candidates, the winner got 54% of valid votes and won by a majority of 640 votes. What was the total number of valid votes?",
        "opt_a": "8,000",
        "opt_b": "7,500",
        "opt_c": "8,500",
        "opt_d": "6,400",
        "correct_opt": "A",
        "explanation": "Margin = 54% - 46% = 8%. 8% of votes = 640 => Total valid votes = 640 / 0.08 = 8,000."
    },
    {
        "question_text": "If radius of a cylinder is increased by 20% and its height is decreased by 10%, the percentage change in its volume will be:",
        "opt_a": "29.6% increase",
        "opt_b": "28% increase",
        "opt_c": "32% increase",
        "opt_d": "26.4% increase",
        "correct_opt": "A",
        "explanation": "Volume proportional to r^2 * h. New volume = (1.2)^2 * 0.9 = 1.44 * 0.9 = 1.296 => 29.6% increase."
    },
    {
        "question_text": "Due to a 25% increase in price of apples, a customer can buy 4 apples less for Rs. 240. The original price of 1 apple was:",
        "opt_a": "Rs. 12",
        "opt_b": "Rs. 15",
        "opt_c": "Rs. 10",
        "opt_d": "Rs. 16",
        "correct_opt": "A",
        "explanation": "25% of 240 = 60. Cost of 4 extra apples at new price = 60 => New price = 15. Original price = 15 / 1.25 = Rs. 12."
    }
]

def generate_mock_questions() -> List[Dict]:
    """Generates 100 questions (25 per section) for the Weekend Mock Arena."""
    questions = []
    subjects = [
        ("Quantitative Aptitude", 25),
        ("General Intelligence & Reasoning", 25),
        ("English Comprehension", 25),
        ("General Awareness", 25)
    ]
    
    q_id = 1
    for subj_name, count in subjects:
        for i in range(1, count + 1):
            if subj_name == "Quantitative Aptitude":
                q_text = f"A trader sells an article at a profit of {10 + (i % 15)}%. If cost price is Rs. {1000 + i * 20}, what is the selling price?"
                a = f"Rs. {int((1000 + i * 20) * (1 + (10 + (i % 15)) / 100))}"
                b = f"Rs. {int((1000 + i * 20) * 1.05)}"
                c = f"Rs. {int((1000 + i * 20) * 1.35)}"
                d = f"Rs. {int((1000 + i * 20) * 1.40)}"
            elif subj_name == "General Intelligence & Reasoning":
                q_text = f"Complete the letter/number series: {i * 2}, {i * 4}, {i * 8}, {i * 16}, ?"
                a = f"{i * 32}"
                b = f"{i * 24}"
                c = f"{i * 30}"
                d = f"{i * 36}"
            elif subj_name == "English Comprehension":
                words = ["Benevolent", "Pragmatic", "Ephemeral", "Meticulous", "Loquacious", "Voracious", "Sycophant", "Tenacious"]
                word = words[i % len(words)]
                q_text = f"Select the correct synonym for the underlined word in context: '{word}'"
                a = "Relevant context synonym"
                b = "Opposite meaning antonym"
                c = "Irrelevant distractor"
                d = "Spelling error variation"
            else:
                topics = ["Constitution Article", "National Park location", "Monetary Policy tool", "Indus Valley artifact", "Periodic Table element", "Mughal Empire ruler"]
                topic = topics[i % len(topics)]
                q_text = f"In Indian Central Administration / SSC General Awareness, which of the following is associated with {topic} #{i}?"
                a = "Verified constitutional / historical fact"
                b = "Common misconception"
                c = "Incorrect year / article"
                d = "Secondary option"

            questions.append({
                "id": q_id,
                "subject": subj_name,
                "question_text": q_text,
                "opt_a": a,
                "opt_b": b,
                "opt_c": c,
                "opt_d": d,
                "correct_opt": "A"
            })
            q_id += 1
            
    return questions
