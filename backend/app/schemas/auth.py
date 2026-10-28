import uuid
from typing import Optional
from pydantic import BaseModel, EmailStr
from app.models.user import UserRole, TargetExam

class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: uuid.UUID
    name: str
    email: str
    role: UserRole
    target_exam: Optional[TargetExam] = None
    exam_date: Optional[str] = None
    streak_count: int
    onboarding_completed: bool

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
