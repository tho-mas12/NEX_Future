import uuid
from typing import List, Optional, Dict
from pydantic import BaseModel
from app.models.revision import RevisionStatus

class RevisionQuestionItem(BaseModel):
    id: uuid.UUID
    question_text: str
    opt_a: str
    opt_b: str
    opt_c: str
    opt_d: str
    correct_opt: str
    explanation: Optional[str] = None
    short_trick: Optional[str] = None

class RevisionLessonDetail(BaseModel):
    id: uuid.UUID
    title: str
    subject: str
    topic_title: str
    youtube_embed_id: str
    pdf_url: Optional[str] = None
    short_trick_notes: Optional[str] = None

class RevisionDetailResponse(BaseModel):
    id: uuid.UUID
    lesson: RevisionLessonDetail
    interval_days: int
    scheduled_for: str
    deadline: str
    is_overdue: bool
    days_overdue: int
    status: RevisionStatus
    current_stage: int  # 1=Review Notes, 2=MCQ Test, 3=Penalty Retest Loop
    pass_percent_required: int
    test_timer_seconds: int
    questions: List[RevisionQuestionItem]

class RevisionSubmitRequest(BaseModel):
    answers: Dict[str, str]  # question_id -> option chosen

class RevisionSubmitResponse(BaseModel):
    passed: bool
    score_achieved: float
    pass_percent_required: int
    total_questions: int
    correct_count: int
    message: str
    next_interval: Optional[int] = None
    current_stage: int

class TriggerTestRevisionRequest(BaseModel):
    interval_days: int = 3
    make_overdue: bool = True
