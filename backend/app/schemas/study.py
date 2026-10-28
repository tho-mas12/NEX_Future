import uuid
from typing import List, Optional, Dict
from pydantic import BaseModel
from app.models.progress import ProgressStatus

class StudyQuestion(BaseModel):
    id: uuid.UUID
    question_text: str
    opt_a: str
    opt_b: str
    opt_c: str
    opt_d: str
    correct_opt: str
    explanation: Optional[str] = None

class StudyTopicDetail(BaseModel):
    id: uuid.UUID
    subject: str
    title: str
    youtube_embed_id: str
    pdf_url: Optional[str] = None

class StudyDayResponse(BaseModel):
    day_number: int
    topic: StudyTopicDetail
    video_done: bool
    pdf_done: bool
    quiz_score: int
    status: ProgressStatus
    questions: List[StudyQuestion]

class StudyProgressUpdateRequest(BaseModel):
    video_done: Optional[bool] = None
    pdf_done: Optional[bool] = None

class MarkDayCompleteRequest(BaseModel):
    quiz_score: int

class MarkDayCompleteResponse(BaseModel):
    success: bool
    message: str
    new_streak: int
    day_number: int

# Mock Arena Schemas
class MockQuestion(BaseModel):
    id: int
    subject: str
    question_text: str
    opt_a: str
    opt_b: str
    opt_c: str
    opt_d: str

class MockArenaStartResponse(BaseModel):
    test_id: str
    title: str
    duration_seconds: int
    total_questions: int
    questions: List[MockQuestion]

class MockSubmitRequest(BaseModel):
    test_id: str
    answers: Dict[int, str]  # question_id -> option chosen

class SubjectScore(BaseModel):
    subject: str
    correct: int
    incorrect: int
    unanswered: int
    marks: float

class MockSubmitResponse(BaseModel):
    total_score: float
    max_score: float
    accuracy: float
    percentile: float
    subject_breakdown: List[SubjectScore]
    summary_message: str
