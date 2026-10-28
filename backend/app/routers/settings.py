from typing import Annotated, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.database import get_session
from app.routers.deps import get_current_user, get_current_admin
from app.models.user import User
from app.models.settings import GlobalSettings
from app.schemas.settings import GlobalSettingsRead, GlobalSettingsUpdate

router = APIRouter(prefix="/settings", tags=["Global Settings"])

def mask_key(key: Optional[str]) -> Optional[str]:
    if not key or len(key) < 8:
        return None
    return f"{key[:6]}...{key[-4:]}"

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
            daily_main_topics_count=2,
            maintenance_mode=False,
            allow_registrations=True
        )
        session.add(settings_obj)
        await session.commit()
        await session.refresh(settings_obj)
    return settings_obj

@router.get("", response_model=GlobalSettingsRead)
async def get_settings(
    session: Annotated[AsyncSession, Depends(get_session)]
):
    """Returns platform global settings (TCS timer, MCQ count, pass %, deadline, API key status)."""
    settings_obj = await get_or_create_settings(session)
    return GlobalSettingsRead(
        id=settings_obj.id,
        mock_timer_mins=settings_obj.mock_timer_mins,
        mock_q_count=settings_obj.mock_q_count,
        revision_pass_percent=settings_obj.revision_pass_percent,
        revision_deadline_days=settings_obj.revision_deadline_days,
        daily_main_topics_count=settings_obj.daily_main_topics_count,
        gemini_api_key_masked=mask_key(settings_obj.gemini_api_key),
        gemini_api_key_configured=bool(settings_obj.gemini_api_key and len(settings_obj.gemini_api_key) > 5),
        youtube_api_key_masked=mask_key(settings_obj.youtube_api_key),
        youtube_api_key_configured=bool(settings_obj.youtube_api_key and len(settings_obj.youtube_api_key) > 5),
        maintenance_mode=bool(settings_obj.maintenance_mode),
        allow_registrations=bool(settings_obj.allow_registrations)
    )

@router.put("", response_model=GlobalSettingsRead)
async def update_settings(
    req: GlobalSettingsUpdate,
    current_admin: Annotated[User, Depends(get_current_admin)],
    session: Annotated[AsyncSession, Depends(get_session)]
):
    """Admin-only update to platform global settings, API keys, and maintenance controls."""
    settings_obj = await get_or_create_settings(session)
    
    if req.mock_timer_mins is not None:
        settings_obj.mock_timer_mins = req.mock_timer_mins
    if req.mock_q_count is not None:
        settings_obj.mock_q_count = req.mock_q_count
    if req.revision_pass_percent is not None:
        settings_obj.revision_pass_percent = req.revision_pass_percent
    if req.revision_deadline_days is not None:
        settings_obj.revision_deadline_days = req.revision_deadline_days
    if req.daily_main_topics_count is not None:
        settings_obj.daily_main_topics_count = req.daily_main_topics_count
    if req.maintenance_mode is not None:
        settings_obj.maintenance_mode = req.maintenance_mode
    if req.allow_registrations is not None:
        settings_obj.allow_registrations = req.allow_registrations

    # Update API keys if non-empty string provided
    if req.gemini_api_key is not None:
        clean_gemini = req.gemini_api_key.strip()
        if clean_gemini:
            settings_obj.gemini_api_key = clean_gemini
    if req.youtube_api_key is not None:
        clean_yt = req.youtube_api_key.strip()
        if clean_yt:
            settings_obj.youtube_api_key = clean_yt

    session.add(settings_obj)
    await session.commit()
    await session.refresh(settings_obj)

    return GlobalSettingsRead(
        id=settings_obj.id,
        mock_timer_mins=settings_obj.mock_timer_mins,
        mock_q_count=settings_obj.mock_q_count,
        revision_pass_percent=settings_obj.revision_pass_percent,
        revision_deadline_days=settings_obj.revision_deadline_days,
        daily_main_topics_count=settings_obj.daily_main_topics_count,
        gemini_api_key_masked=mask_key(settings_obj.gemini_api_key),
        gemini_api_key_configured=bool(settings_obj.gemini_api_key and len(settings_obj.gemini_api_key) > 5),
        youtube_api_key_masked=mask_key(settings_obj.youtube_api_key),
        youtube_api_key_configured=bool(settings_obj.youtube_api_key and len(settings_obj.youtube_api_key) > 5),
        maintenance_mode=bool(settings_obj.maintenance_mode),
        allow_registrations=bool(settings_obj.allow_registrations)
    )
