from datetime import datetime, timezone
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from app.core.database import get_session
from app.core.security import hash_password, verify_password, create_access_token
from app.models.user import User
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse, UserResponse
from app.routers.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(
    req: RegisterRequest,
    session: Annotated[AsyncSession, Depends(get_session)]
):
    # Check if user already exists
    stmt = select(User).where(User.email == req.email.lower().strip())
    result = await session.exec(stmt)
    existing_user = result.first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists"
        )
    
    new_user = User(
        name=req.name.strip(),
        email=req.email.lower().strip(),
        hashed_password=hash_password(req.password),
        last_login=datetime.now(timezone.utc),
    )
    session.add(new_user)
    await session.commit()
    await session.refresh(new_user)

    token = create_access_token(subject=str(new_user.id))
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse(
            id=new_user.id,
            name=new_user.name,
            email=new_user.email,
            role=new_user.role,
            target_exam=new_user.target_exam,
            exam_date=new_user.exam_date,
            streak_count=new_user.streak_count,
            onboarding_completed=new_user.onboarding_completed,
        )
    )

@router.post("/login", response_model=TokenResponse)
async def login(
    req: LoginRequest,
    session: Annotated[AsyncSession, Depends(get_session)]
):
    stmt = select(User).where(User.email == req.email.lower().strip())
    result = await session.exec(stmt)
    user = result.first()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user.last_login = datetime.now(timezone.utc)
    session.add(user)
    await session.commit()
    await session.refresh(user)

    token = create_access_token(subject=str(user.id))
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse(
            id=user.id,
            name=user.name,
            email=user.email,
            role=user.role,
            target_exam=user.target_exam,
            exam_date=user.exam_date,
            streak_count=user.streak_count,
            onboarding_completed=user.onboarding_completed,
        )
    )

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: Annotated[User, Depends(get_current_user)]):
    return UserResponse(
        id=current_user.id,
        name=current_user.name,
        email=current_user.email,
        role=current_user.role,
        target_exam=current_user.target_exam,
        exam_date=current_user.exam_date,
        streak_count=current_user.streak_count,
        onboarding_completed=current_user.onboarding_completed,
    )
