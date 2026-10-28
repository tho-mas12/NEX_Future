from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.database import get_session
from app.routers.deps import get_current_user, get_current_admin
from app.models.user import User
from app.models.settings import GlobalSettings
from app.schemas.settings import GlobalSettingsRead, GlobalSettingsUpdate

router = APIRouter(prefix="/settings", tags=["Global Settings"])

async def get_or_create_settings(session: AsyncSession) -> GlobalSettings:
    res = await session.exec(select(GlobalSettings).where(GlobalSettings.id == 1))
    settings_obj = res.first()
    if not settings_obj:
        settings_obj = GlobalSettings(
            id=1,
            mock_timer_mins=15,
            mock_q_count=25,
            revision_pass_percent=80,
            revision_deadline_days=2,
            daily_main_topics_count=2
        )
        session.add(settings_obj)
        await session.commit()
        await session.refresh(settings_obj)
    return settings_obj

@router.get("", response_model=GlobalSettingsRead)
async def get_settings(
    session: Annotated[AsyncSession, Depends(get_session)]
):
    """Returns platform global settings (TCS timer, MCQ count, pass %, deadline)."""
    settings_obj = await get_or_create_settings(session)
    return settings_obj

@router.put("", response_model=GlobalSettingsRead)
async def update_settings(
    req: GlobalSettingsUpdate,
    current_admin: Annotated[User, Depends(get_current_admin)],
    session: Annotated[AsyncSession, Depends(get_session)]
):
    """Admin-only update to platform global settings."""
    settings_obj = await get_or_create_settings(session)
    
    settings_obj.mock_timer_mins = req.mock_timer_mins
    settings_obj.mock_q_count = req.mock_q_count
    settings_obj.revision_pass_percent = req.revision_pass_percent
    settings_obj.revision_deadline_days = req.revision_deadline_days
    settings_obj.daily_main_topics_count = req.daily_main_topics_count

    session.add(settings_obj)
    await session.commit()
    await session.refresh(settings_obj)
    return settings_obj
