import uuid
from datetime import datetime, timezone
from sqlmodel import SQLModel, Field

class CurrentAffairsItem(SQLModel, table=True):
    __tablename__ = "current_affairs_items"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    title: str
    published_date: str = Field(default="Today")
    summary_notes: str
    question_count: int = Field(default=5)
    questions_json: str = Field(default="[]")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
