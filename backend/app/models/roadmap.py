import uuid
from sqlmodel import SQLModel, Field
from app.models.user import TargetExam

class RoadmapTemplateBase(SQLModel):
    exam_type: TargetExam = Field(index=True)
    day_number: int = Field(index=True)
    topic_id: uuid.UUID = Field(foreign_key="topics.id")

class RoadmapTemplate(RoadmapTemplateBase, table=True):
    __tablename__ = "roadmap_templates"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
