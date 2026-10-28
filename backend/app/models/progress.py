import uuid
from datetime import datetime
from enum import Enum
from typing import Optional
from sqlmodel import SQLModel, Field

class ProgressStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in-progress"
    COMPLETED = "completed"

class UserProgressBase(SQLModel):
    user_id: uuid.UUID = Field(foreign_key="users.id", index=True)
    day_number: int = Field(index=True)
    topic_id: uuid.UUID = Field(foreign_key="topics.id")
    video_done: bool = Field(default=False)
    pdf_done: bool = Field(default=False)
    quiz_score: int = Field(default=0)
    status: ProgressStatus = Field(default=ProgressStatus.PENDING)
    completed_at: Optional[datetime] = Field(default=None)

class UserProgress(UserProgressBase, table=True):
    __tablename__ = "user_progress"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
