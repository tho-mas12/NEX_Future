import uuid
from typing import Optional
from sqlmodel import SQLModel, Field

class QuestionBase(SQLModel):
    lesson_id: Optional[uuid.UUID] = Field(default=None, foreign_key="lessons.id", index=True, nullable=True)
    topic_id: Optional[uuid.UUID] = Field(default=None, foreign_key="topics.id", index=True, nullable=True)
    question_text: str
    opt_a: str
    opt_b: str
    opt_c: str
    opt_d: str
    correct_opt: str = Field(description="One of: A, B, C, D")
    explanation: Optional[str] = None
    short_trick: Optional[str] = Field(default=None, description="Shortcut or elimination trick for the slide-in solution")

class Question(QuestionBase, table=True):
    __tablename__ = "questions"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
