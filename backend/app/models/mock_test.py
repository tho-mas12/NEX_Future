import uuid
from datetime import datetime, timezone
from sqlmodel import SQLModel, Field

class MockTestCard(SQLModel, table=True):
    __tablename__ = "mock_test_cards"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    title: str
    day_number: int = Field(default=7, index=True)
    duration_mins: int = Field(default=15)
    total_questions: int = Field(default=25)
    pos_marks: float = Field(default=2.0)
    neg_marks: float = Field(default=0.5)
    is_active: bool = Field(default=True)
    is_gated: bool = Field(default=True, description="Locks next day until completed")
    questions_json: str = Field(default="[]")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
