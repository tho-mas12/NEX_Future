import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlmodel import SQLModel, Field

class PYQDocument(SQLModel, table=True):
    __tablename__ = "pyq_documents"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    year: int = Field(index=True)
    title: str
    exam_type: str = Field(default="CGL")
    tier: str = Field(default="Tier 1")
    shift_info: Optional[str] = Field(default="All Shifts Combined")
    pdf_url: str = Field(default="https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
