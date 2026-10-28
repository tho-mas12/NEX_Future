from typing import List, Optional
from pydantic import BaseModel
import uuid
from app.models.user import TargetExam
from app.models.topic import SubjectEnum
from app.models.progress import ProgressStatus

class DiagnosticQuestionResponse(BaseModel):
    id: uuid.UUID
    subject: SubjectEnum
    question_text: str
    opt_a: str
    opt_b: str
    opt_c: str
    opt_d: str
    correct_opt: str
    explanation: Optional[str] = None

class OnboardingCompleteRequest(BaseModel):
    target_exam: TargetExam
    exam_date: str
    diagnostic_score: int

class OnboardingCompleteResponse(BaseModel):
    success: bool
    message: str
    total_days_generated: int

class DayGridItem(BaseModel):
    day_number: int
    status: str  # 'completed', 'today', 'pending', 'locked', 'missed'
    quiz_score: int
    subject: Optional[str] = None

class UpcomingDayItem(BaseModel):
    day_number: int
    subject: str
    title: str

class TodayMission(BaseModel):
    day_number: int
    topic_id: uuid.UUID
    subject: str
    title: str
    youtube_embed_id: str
    pdf_url: Optional[str] = None
    video_done: bool
    pdf_done: bool
    quiz_score: int
    status: ProgressStatus

class OverdueRevisionItem(BaseModel):
    id: uuid.UUID
    lesson_id: uuid.UUID
    lesson_title: str
    subject: str
    interval_days: int
    deadline: str
    days_overdue: int

class AssignedDailyLesson(BaseModel):
    lesson_id: uuid.UUID
    subject: str
    topic_title: str
    title: str
    youtube_embed_id: str
    pdf_url: Optional[str] = None
    short_trick_notes: Optional[str] = None
    completed: bool
    category_tag: Optional[str] = None

class TodayRailWorkload(BaseModel):
    day_number: int
    lessons: List[AssignedDailyLesson] = []
    lesson_1: Optional[AssignedDailyLesson] = None
    lesson_2: Optional[AssignedDailyLesson] = None
    reasoning_lesson: Optional[AssignedDailyLesson] = None
    all_completed: bool

class DashboardDataResponse(BaseModel):
    user_name: str
    target_exam: str
    exam_date: Optional[str] = None
    streak_count: int
    current_day: int
    current_stage: int
    stage_title: str
    total_completed: int
    completion_percentage: float
    is_locked: bool
    lock_reason: Optional[str] = None
    overdue_revisions: List[OverdueRevisionItem]
    upcoming_revisions: List[OverdueRevisionItem]
    today_workload: Optional[TodayRailWorkload] = None
    today_mission: Optional[TodayMission] = None
    grid_progress: List[DayGridItem]
    upcoming_days: List[UpcomingDayItem]
