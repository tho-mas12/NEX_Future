from typing import Optional
from pydantic import BaseModel, Field

class GlobalSettingsRead(BaseModel):
    id: int
    mock_timer_mins: int
    mock_q_count: int
    revision_pass_percent: int
    revision_deadline_days: int
    daily_main_topics_count: int
    gemini_api_key_masked: Optional[str] = None
    gemini_api_key_configured: bool = False
    youtube_api_key_masked: Optional[str] = None
    youtube_api_key_configured: bool = False
    maintenance_mode: bool = False
    allow_registrations: bool = True

class GlobalSettingsUpdate(BaseModel):
    mock_timer_mins: Optional[int] = Field(default=15, ge=5, le=60)
    mock_q_count: Optional[int] = Field(default=25, ge=5, le=100)
    revision_pass_percent: Optional[int] = Field(default=80, ge=50, le=100)
    revision_deadline_days: Optional[int] = Field(default=2, ge=1, le=7)
    daily_main_topics_count: Optional[int] = Field(default=2, ge=1, le=4)
    gemini_api_key: Optional[str] = None
    youtube_api_key: Optional[str] = None
    maintenance_mode: Optional[bool] = None
    allow_registrations: Optional[bool] = None
