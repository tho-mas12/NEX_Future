from app.models.user import User, UserRole, TargetExam
from app.models.settings import GlobalSettings
from app.models.topic import Topic, SubjectEnum
from app.models.lesson import Lesson
from app.models.question import Question
from app.models.daily_log import UserDailyLog, DailyLogStatus
from app.models.revision import RevisionSchedule, RevisionStatus
from app.models.mistake import MistakeNotebook
from app.models.pyq import PYQDocument
from app.models.current_affairs import CurrentAffairsItem
from app.models.mock_test import MockTestCard

# Keep backward compatibility for roadmap/progress if needed
from app.models.roadmap import RoadmapTemplate
from app.models.progress import UserProgress, ProgressStatus

__all__ = [
    "User",
    "UserRole",
    "TargetExam",
    "GlobalSettings",
    "Topic",
    "SubjectEnum",
    "Lesson",
    "Question",
    "UserDailyLog",
    "DailyLogStatus",
    "RevisionSchedule",
    "RevisionStatus",
    "MistakeNotebook",
    "PYQDocument",
    "CurrentAffairsItem",
    "MockTestCard",
    "RoadmapTemplate",
    "UserProgress",
    "ProgressStatus",
]
