import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import Optional
from sqlmodel import SQLModel, Field

class SubjectEnum(str, Enum):
    QUANT = "Quant"
    ENGLISH = "English"
    REASONING = "Reasoning"
    GS = "General Studies"
    GA = "General Studies"

class TopicBase(SQLModel):
    subject: SubjectEnum
    stage: int = Field(default=1, description="1=Foundations, 2=Core, 3=Strengthening, 4=Grand Finale")
    title: str
    weightage_score: float = Field(default=1.0)
    youtube_embed_id: Optional[str] = Field(default="dQw4w9WgXcQ", nullable=True)
    pdf_url: Optional[str] = Field(default=None, nullable=True)

class Topic(TopicBase, table=True):
    __tablename__ = "topics"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
