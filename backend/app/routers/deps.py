import uuid
from typing import Annotated, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from app.core.config import settings
from app.core.database import get_session
from app.models.user import User, UserRole

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login", auto_error=False)

async def resolve_user_from_token(token: str, session: AsyncSession) -> Optional[User]:
    user = None
    # 1. Try local HS256 JWT
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id_str: str = payload.get("sub")
        if user_id_str:
            try:
                user_id = uuid.UUID(user_id_str)
                stmt = select(User).where(User.id == user_id)
                res = await session.exec(stmt)
                user = res.first()
            except ValueError:
                pass
    except Exception:
        pass

    # 2. Try Firebase ID Token claims
    if user is None:
        try:
            claims = jwt.get_unverified_claims(token)
            email = claims.get("email")
            fb_uid = claims.get("sub") or claims.get("user_id")
            if email:
                stmt = select(User).where(User.email == email)
                res = await session.exec(stmt)
                user = res.first()

                if not user and fb_uid:
                    user_uuid = uuid.uuid5(uuid.NAMESPACE_DNS, f"firebase:{fb_uid}")
                    is_admin = email == "admin@examrail.in"
                    user = User(
                        id=user_uuid,
                        email=email,
                        name=claims.get("name") or email.split("@")[0],
                        hashed_password="firebase_auth_managed",
                        role=UserRole.ADMIN if is_admin else UserRole.STUDENT,
                        onboarding_completed=False,
                        streak_count=0
                    )
                    session.add(user)
                    await session.commit()
                    await session.refresh(user)
        except Exception:
            pass

    return user

async def get_current_user_optional(
    token: Annotated[str | None, Depends(oauth2_scheme)],
    session: Annotated[AsyncSession, Depends(get_session)]
) -> Optional[User]:
    if not token:
        return None
    return await resolve_user_from_token(token, session)

async def get_current_user(
    token: Annotated[str | None, Depends(oauth2_scheme)],
    session: Annotated[AsyncSession, Depends(get_session)]
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise credentials_exception

    user = await resolve_user_from_token(token, session)
    if user is None:
        raise credentials_exception
    return user

async def get_current_admin(
    current_user: Annotated[User, Depends(get_current_user)]
) -> User:
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user does not have sufficient privileges"
        )
    return current_user
