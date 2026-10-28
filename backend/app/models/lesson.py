import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlmodel import SQLModel, Field

class LessonBase(SQLModel):
    topic_id: uuid.UUID = Field(foreign_key="topics.id", index=True)
    title: str
    day_sequence: int = Field(default=1)
    youtube_embed_id: str = Field(default="dQw4w9WgXcQ")
    pdf_url: Optional[str] = None
    short_trick_notes: Optional[str] = None

class Lesson(LessonBase, table=True):
    __tablename__ = "lessons"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
