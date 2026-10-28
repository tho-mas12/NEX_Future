import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import Optional
from sqlmodel import SQLModel, Field

class RevisionStatus(str, Enum):
    PENDING = "pending"
    PASSED = "passed"
    FAILED = "failed"

class RevisionScheduleBase(SQLModel):
    user_id: uuid.UUID = Field(foreign_key="users.id", index=True)
    lesson_id: uuid.UUID = Field(foreign_key="lessons.id", index=True)
    interval_days: int = Field(default=3, description="3, 7, 20, or 30 days")
    scheduled_for: datetime = Field(index=True)
    deadline: datetime = Field(index=True, description="scheduled_for + revision_deadline_days")
    status: RevisionStatus = Field(default=RevisionStatus.PENDING)
    current_stage: int = Field(default=1, description="1=Notes Review, 2=MCQ Test, 3=Penalty Retest Loop")
    score_achieved: Optional[float] = Field(default=None)

class RevisionSchedule(RevisionScheduleBase, table=True):
    __tablename__ = "revision_schedules"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
