import uuid
from datetime import datetime
from enum import Enum
from typing import Optional
from sqlmodel import SQLModel, Field

class DailyLogStatus(str, Enum):
    LOCKED = "locked"
    PENDING = "pending"
    COMPLETED = "completed"

class UserDailyLogBase(SQLModel):
    user_id: uuid.UUID = Field(foreign_key="users.id", index=True)
    day_number: int = Field(index=True)
    lesson_1_id: Optional[uuid.UUID] = Field(default=None, foreign_key="lessons.id")
    lesson_2_id: Optional[uuid.UUID] = Field(default=None, foreign_key="lessons.id")
    reasoning_lesson_id: Optional[uuid.UUID] = Field(default=None, foreign_key="lessons.id")
    status: DailyLogStatus = Field(default=DailyLogStatus.PENDING)
    completed_at: Optional[datetime] = Field(default=None)

class UserDailyLog(UserDailyLogBase, table=True):
    __tablename__ = "user_daily_logs"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
