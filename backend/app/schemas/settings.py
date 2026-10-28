from pydantic import BaseModel, Field

class GlobalSettingsRead(BaseModel):
    id: int
    mock_timer_mins: int
    mock_q_count: int
    revision_pass_percent: int
    revision_deadline_days: int
    daily_main_topics_count: int

class GlobalSettingsUpdate(BaseModel):
    mock_timer_mins: int = Field(ge=5, le=60)
    mock_q_count: int = Field(ge=5, le=100)
    revision_pass_percent: int = Field(ge=50, le=100)
    revision_deadline_days: int = Field(ge=1, le=7)
    daily_main_topics_count: int = Field(ge=1, le=4)
