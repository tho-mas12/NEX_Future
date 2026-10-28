import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlmodel import SQLModel, Field

class MistakeNotebookBase(SQLModel):
    user_id: uuid.UUID = Field(foreign_key="users.id", index=True)
    question_id: uuid.UUID = Field(foreign_key="questions.id", index=True)
    user_wrong_choice: str
    review_count: int = Field(default=1)
    mastered: bool = Field(default=False)

class MistakeNotebook(MistakeNotebookBase, table=True):
    __tablename__ = "mistake_notebooks"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
