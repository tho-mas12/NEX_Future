import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import Optional
from sqlmodel import SQLModel, Field

class UserRole(str, Enum):
    USER = "user"
    STUDENT = "user"
    ADMIN = "admin"

class TargetExam(str, Enum):
    CGL = "CGL"
    CHSL = "CHSL"

class UserBase(SQLModel):
    name: str
    email: str = Field(unique=True, index=True)
    role: UserRole = Field(default=UserRole.USER)
    target_exam: Optional[TargetExam] = Field(default=TargetExam.CGL)
    exam_date: Optional[str] = Field(default=None)
    current_stage: int = Field(default=1, description="1=Foundations, 2=Core, 3=Strengthening, 4=Grand Finale")
    streak_count: int = Field(default=0)
    onboarding_completed: bool = Field(default=False)

class User(UserBase, table=True):
    __tablename__ = "users"
    
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    hashed_password: str
    last_login: Optional[datetime] = Field(default=None)
    last_activity_date: Optional[datetime] = Field(default=None)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
