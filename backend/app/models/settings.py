from typing import Optional
from sqlmodel import SQLModel, Field

class GlobalSettingsBase(SQLModel):
    mock_timer_mins: int = Field(default=15, description="TCS 2026 sectional mock duration in minutes")
    mock_q_count: int = Field(default=25, description="Number of questions in mock")
    revision_pass_percent: int = Field(default=80, description="Minimum percentage required to pass revision")
    revision_deadline_days: int = Field(default=2, description="Days after scheduled_for before lessons lock")
    daily_main_topics_count: int = Field(default=2, description="Main daily subjects count")

class GlobalSettings(GlobalSettingsBase, table=True):
    __tablename__ = "global_settings"
    id: Optional[int] = Field(default=1, primary_key=True)
