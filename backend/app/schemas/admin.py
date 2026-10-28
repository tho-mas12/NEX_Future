import uuid
from typing import List, Optional
from pydantic import BaseModel
from app.models.user import UserRole, TargetExam
from app.models.topic import SubjectEnum

class AdminKpiStats(BaseModel):
    total_users: int
    active_subscriptions: int
    avg_streak: float
    dropoff_day: int
    syllabus_coverage_days: int

class RecentUserItem(BaseModel):
    id: uuid.UUID
    name: str
    email: str
    target_exam: Optional[str]
    streak_count: int
    onboarding_completed: bool
    created_at: str

class AdminOverviewResponse(BaseModel):
    kpis: AdminKpiStats
    recent_users: List[RecentUserItem]

class AdminTopicItem(BaseModel):
    id: uuid.UUID
    subject: SubjectEnum
    title: str
    youtube_embed_id: str
    pdf_url: Optional[str] = None
    question_count: int

class AdminCreateTopicRequest(BaseModel):
    subject: SubjectEnum
    title: str
    youtube_embed_id: str
    pdf_url: Optional[str] = None

class AdminAssignRoadmapRequest(BaseModel):
    exam_type: TargetExam
    day_number: int
    topic_id: uuid.UUID

class AdminRoadmapDayItem(BaseModel):
    day_number: int
    topic_id: Optional[uuid.UUID] = None
    topic_title: Optional[str] = None
    topic_subject: Optional[str] = None
