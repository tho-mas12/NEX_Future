import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Flame,
  PlayCircle,
  Lock,
  CheckCircle2,
  LogOut,
  Target,
  RotateCcw,
  ArrowRight,
  ShieldAlert,
  Clock,
  Zap,
  Award,
  Sparkles,
  AlertTriangle,
  Brain,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { apiRequest } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { useSettingsStore } from '@/store/useSettingsStore';

interface DayGridItem {
  day_number: number;
  status: 'completed' | 'today' | 'missed' | 'pending' | 'locked';
  quiz_score: number;
  subject?: string;
}

interface UpcomingDay {
  day_number: number;
  subject: string;
  title: string;
}

interface OverdueRevision {
  id: string;
  lesson_id: string;
  lesson_title: string;
  subject: string;
  interval_days: number;
  deadline: string;
  days_overdue: number;
}

interface AssignedDailyLesson {
  lesson_id: string;
  subject: string;
  topic_title: string;
  title: string;
  youtube_embed_id: string;
  pdf_url?: string;
  short_trick_notes?: string;
  completed: boolean;
  category_tag?: string;
}

interface TodayWorkload {
  day_number: number;
  lessons?: AssignedDailyLesson[];
  lesson_1?: AssignedDailyLesson;
  lesson_2?: AssignedDailyLesson;
  reasoning_lesson?: AssignedDailyLesson;
  all_completed: boolean;
}

interface DashboardData {
  user_name: string;
  target_exam: string;
  exam_date?: string;
  streak_count: number;
  current_day: number;
  current_stage: number;
  stage_title: string;
  total_completed: number;
  completion_percentage: number;
  is_locked: boolean;
  lock_reason?: string;
  overdue_revisions: OverdueRevision[];
  upcoming_revisions: OverdueRevision[];
  today_workload?: TodayWorkload;
  grid_progress: DayGridItem[];
  upcoming_days: UpcomingDay[];
}

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const { fetchSettings } = useSettingsStore();

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredDay, setHoveredDay] = useState<DayGridItem | null>(null);

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const [res] = await Promise.all([
        apiRequest<DashboardData>('/dashboard/today'),
        fetchSettings().catch(() => null),
      ]);
      setData(res);
    } catch (err: any) {
      if (err.message && err.message.includes('onboarding')) {
        navigate('/onboard');
      } else {
        setError(err.message || 'Failed to load daily mission.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleStudyAction = (lessonId?: string, fallbackDay?: number) => {
    if (data?.is_locked) {
      return;
    }
    if (lessonId) {
      navigate(`/study/${lessonId}`);
    } else if (fallbackDay) {
      navigate(`/study/day-${fallbackDay}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500 font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
          <p className="text-xs font-bold text-slate-600 tracking-wide uppercase">Mounting Guided Master Rail...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
        <div className="text-center p-8 bg-white border border-slate-200 rounded-3xl max-w-md shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-2">Notice</h2>
          <p className="text-xs text-slate-600 mb-4">{error || 'Session sync error.'}</p>
          <Button onClick={() => fetchDashboard()} className="bg-blue-600 text-white font-bold text-xs rounded-xl">
            Retry Connection
          </Button>
        </div>
      </div>
    );
  }

  const {
    user_name,
    target_exam,
    streak_count,
    current_day,
    current_stage,
    stage_title,
    total_completed,
    completion_percentage,
    is_locked,
    lock_reason,
    overdue_revisions,
    upcoming_revisions,
    today_workload,
    grid_progress,
    upcoming_days,
  } = data;

  const allDailyLessons: AssignedDailyLesson[] =
    today_workload?.lessons && today_workload.lessons.length > 0
      ? today_workload.lessons
      : ([
          today_workload?.lesson_1,
          today_workload?.lesson_2,
          today_workload?.reasoning_lesson,
        ].filter(Boolean) as AssignedDailyLesson[]);

  const nextMockDay = Math.ceil(current_day / 7) * 7;
  const hasActiveRevisionsDue = overdue_revisions.length > 0 || upcoming_revisions.some((r) => r.deadline === 'Today');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/dashboard" className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt="NEX Logo"
                className="h-11 w-11 object-contain rounded-xl shadow-sm border border-slate-200/80 shrink-0"
              />
              <div>
                <span className="font-black text-xl tracking-tight text-slate-900 inline">
                  NEX
                </span>
                <span className="hidden sm:inline-block ml-2 text-[10px] bg-blue-50 border border-blue-200 text-blue-700 font-bold px-2 py-0.5 rounded-full uppercase">
                  SSC Master Rail
                </span>
              </div>
            </Link>

            {/* Navigation restructured per user specifications */}
            <nav className="hidden md:flex items-center gap-1 pl-4 border-l border-slate-200">
              <Link
                to="/dashboard"
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 shadow-sm"
              >
                Today's Rail
              </Link>
              <Link
                to="/completed-lessons"
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
              >
                Completed Lessons
              </Link>
              <Link
                to="/analysis"
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
              >
                Syllabus
              </Link>
              <Link
                to="/pyq"
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
              >
                Previous Year Questions
              </Link>
              <Link
                to="/current-affairs"
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
              >
                Current Affairs
              </Link>
              <Link
                to="/revision-schedule"
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
              >
                Revision Schedule
              </Link>
            </nav>
          </div>

          {/* User Status / Streak Pill */}
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs text-blue-700 font-bold">
              <Target className="h-3.5 w-3.5" />
              <span>SSC {target_exam}</span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-xs font-bold text-amber-700">
              <Flame className="h-4 w-4 fill-amber-500 text-amber-500" />
              <span>{streak_count}d Streak</span>
            </div>

            <div className="flex items-center gap-2 border-l border-slate-200 pl-3 sm:pl-4">
              <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shadow-sm">
                {user_name.slice(0, 1).toUpperCase()}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={logout}
                title="Logout"
                className="text-slate-500 hover:text-slate-900 h-8 w-8 hover:bg-slate-100"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Dashboard Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* HARDCORE SPACED-REPETITION BLOCKER BANNER */}
        {is_locked && (
          <div className="rounded-2xl border-2 border-rose-300 bg-rose-50 p-5 shadow-md animate-in fade-in duration-300">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="h-11 w-11 rounded-xl bg-rose-100 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
                  <ShieldAlert className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base sm:text-lg font-black text-rose-950 flex items-center gap-2">
                    <span>ACCESS BLOCKED: Mandatory Revisions Overdue</span>
                    <Badge variant="destructive" className="text-[10px] py-0 px-2 font-bold uppercase bg-rose-600">
                      Lock Active
                    </Badge>
                  </h3>
                  <p className="text-xs sm:text-sm text-rose-800 leading-relaxed max-w-2xl">
                    {lock_reason || 'You have pending revisions past the 2-day deadline. All new daily lessons are completely locked until you clear your pending reviews.'}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {overdue_revisions.map((rev) => (
                  <Link key={rev.id} to={`/revision/${rev.id}`}>
                    <Button className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs gap-1.5 shadow-md shadow-rose-600/20 rounded-xl">
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Clear Day +{rev.interval_days} ({rev.subject})</span>
                    </Button>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 1. WEEKLY SUNDAY MOCK TEST (ONLY ACTIVE ON SUNDAYS PER USER REQUEST) */}
        {new Date().getDay() === 0 && (
          <div className="bg-white border-2 border-blue-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between hover:border-blue-400 transition animate-in fade-in">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 font-bold text-xs border border-blue-200">
                  <Award className="h-3.5 w-3.5 text-blue-600" />
                  Weekly Sunday Mock Arena (Active Today)
                </span>
                <span className="text-xs font-bold text-blue-700">Day {nextMockDay} Checkpoint</span>
              </div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">
                Full-Length 100-Question Simulated Mock
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Take the scheduled weekly checkpoint test to benchmark your Tier 1 percentile ranking, sectional timing, and accuracy.
              </p>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">60 Mins • 100 Questions • +2 / -0.5</span>
              <Link to="/mock-arena">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl h-9 px-4 gap-1.5 shadow-sm">
                  <span>Enter Sunday Arena</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* 2. REVISION ON-DATE NOTIFICATION WITH 2-DAY DEADLINE WARNING */}
        {hasActiveRevisionsDue && (
          <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-5 shadow-sm animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="h-10 w-10 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-700 shrink-0">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-amber-950 flex items-center gap-2">
                    <span>Active Spaced Revisions Due Today</span>
                    <Badge className="bg-amber-600 text-white text-[10px] font-bold">2-Day Window</Badge>
                  </h4>
                  <p className="text-xs text-amber-900 mt-0.5 leading-relaxed">
                    Finish your active revision retest on schedule. <strong>Warning: If not finished within 2 days, upcoming daily lessons will be blocked</strong> until completed!
                  </p>
                </div>
              </div>

              <Link to="/revision-schedule" className="shrink-0">
                <Button className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl h-9 px-4 gap-1.5 shadow-sm">
                  <span>View Revision Schedule</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* WELCOME BANNER & STAGE TELEMETRY */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-1">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge className="text-[11px] font-bold px-2.5 py-0.5 bg-blue-100 text-blue-800 border-blue-200">
                Stage {current_stage} of 4
              </Badge>
              <span className="text-xs text-slate-500 font-medium">
                {stage_title}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Welcome back, {user_name}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Day {current_day} of 180 • Multi-Topic Daily Rail Active ({allDailyLessons.length} lessons assigned today)
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex items-center gap-5 bg-white border border-slate-200 px-5 py-3 rounded-2xl shadow-sm shrink-0">
            <div>
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Lessons Mastered</p>
              <p className="text-lg font-black text-slate-900">{total_completed} <span className="text-xs text-slate-400 font-normal">/ 180</span></p>
            </div>
            <div className="h-7 w-px bg-slate-200" />
            <div>
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Curriculum Done</p>
              <p className="text-lg font-black text-emerald-600">{completion_percentage}%</p>
            </div>
            <div className="h-7 w-px bg-slate-200" />
            <div>
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Spaced Retest Cutoff</p>
              <p className="text-lg font-black text-amber-600">80% Pass</p>
            </div>
          </div>
        </div>

        {/* 3. TODAY'S MULTI-TOPIC RAIL LIST */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xs font-black uppercase tracking-wider text-blue-700 flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-blue-600 animate-ping inline-block" />
                <span>Today's Multi-Subject Study Rail (Day {current_day})</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Complete each curated lesson and its 20 practice questions to unlock the Day +3 revision gate.
              </p>
            </div>

            {is_locked && (
              <span className="text-xs text-rose-600 font-bold flex items-center gap-1">
                <Lock className="h-3.5 w-3.5" />
                Rail Locked by Overdue Revisions
              </span>
            )}
          </div>

          {/* DYNAMIC LESSON CARDS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allDailyLessons.map((lesson, idx) => {
              const isGS = lesson.subject.toLowerCase().includes('general') || lesson.subject.toLowerCase().includes('history') || lesson.subject.toLowerCase().includes('polity');
              const isReasoning = lesson.subject.toLowerCase().includes('reasoning');
              const isQuant = lesson.subject.toLowerCase().includes('quant') || lesson.subject.toLowerCase().includes('math');

              let badgeStyle = 'bg-blue-50 text-blue-700 border-blue-200';
              let borderStyle = 'border-blue-200 hover:border-blue-500';
              let btnStyle = 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20';

              if (isGS) {
                badgeStyle = 'bg-emerald-50 text-emerald-800 border-emerald-200';
                borderStyle = 'border-emerald-200 hover:border-emerald-500';
                btnStyle = 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20';
              } else if (isQuant) {
                badgeStyle = 'bg-orange-50 text-orange-700 border-orange-200';
                borderStyle = 'border-orange-200 hover:border-orange-500';
                btnStyle = 'bg-orange-600 hover:bg-orange-700 text-white shadow-orange-600/20';
              } else if (isReasoning) {
                badgeStyle = 'bg-purple-50 text-purple-700 border-purple-200';
                borderStyle = 'border-purple-200 hover:border-purple-500';
                btnStyle = 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-600/20';
              }

              return (
                <Card
                  key={lesson.lesson_id}
                  className={`border-2 transition-all relative overflow-hidden bg-white shadow-sm rounded-2xl flex flex-col justify-between ${
                    lesson.completed
                      ? 'border-emerald-300 bg-emerald-50/30'
                      : is_locked
                      ? 'border-slate-200 opacity-60'
                      : borderStyle
                  }`}
                >
                  <div className="p-5 flex flex-col justify-between h-full space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge className={`text-[10px] px-2.5 py-0.5 font-bold uppercase tracking-wider ${badgeStyle}`}>
                          {lesson.category_tag || `${lesson.subject} #${idx + 1}`}
                        </Badge>
                        <span className="text-[11px] text-slate-400 font-semibold truncate max-w-[140px]">
                          {lesson.topic_title}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-slate-900 line-clamp-2 leading-snug">
                        {lesson.title}
                      </h3>

                      <p className="text-xs text-slate-600 line-clamp-2">
                        {lesson.short_trick_notes || 'Core concepts, formula summary, and 20 active recall practice MCQs.'}
                      </p>
                    </div>

                    <Button
                      disabled={is_locked}
                      onClick={() => handleStudyAction(lesson.lesson_id, current_day)}
                      className={`w-full font-bold text-xs gap-2 rounded-xl transition h-11 ${
                        lesson.completed
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                          : is_locked
                          ? 'bg-slate-200 text-slate-400'
                          : `${btnStyle} shadow-md`
                      }`}
                    >
                      {is_locked ? (
                        <>
                          <Lock className="h-3.5 w-3.5" />
                          Locked (Clear Revisions)
                        </>
                      ) : lesson.completed ? (
                        <>
                          <CheckCircle2 className="h-4 w-4" />
                          Completed (Review Lesson)
                        </>
                      ) : (
                        <>
                          <PlayCircle className="h-4 w-4" />
                          Start Lesson & Practice
                        </>
                      )}
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* 4. THE 180-DAY CONSISTENCY GRID */}
        <Card className="border-slate-200 bg-white shadow-sm rounded-2xl">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base sm:text-lg flex items-center gap-2 text-slate-900 font-bold">
                <span>The 180-Day Guided Rail</span>
                <span className="text-xs font-normal text-slate-500 hidden sm:inline">
                  (Stage 1: 1-45 | Stage 2: 46-110 | Stage 3: 111-150 | Stage 4: 151-180)
                </span>
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Hover to inspect status or click completed days to review.
              </CardDescription>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-600 font-medium">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500 inline-block" />
                <span>Done</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-blue-600 ring-2 ring-blue-300 inline-block" />
                <span>Today</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-rose-500 inline-block" />
                <span>Locked</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-slate-200 inline-block" />
                <span>Pending</span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid grid-cols-10 sm:grid-cols-15 md:grid-cols-20 lg:grid-cols-30 gap-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200 overflow-x-auto">
              {grid_progress.map((item) => {
                let cellClass = 'bg-slate-200 text-slate-500 border border-transparent';
                if (item.status === 'completed') {
                  cellClass = 'bg-emerald-500 text-white shadow-sm';
                } else if (item.status === 'today') {
                  cellClass = 'bg-blue-600 text-white ring-2 ring-blue-400 ring-offset-1 animate-pulse';
                } else if (item.status === 'locked') {
                  cellClass = 'bg-rose-100 border border-rose-300 text-rose-700';
                } else if (item.status === 'missed') {
                  cellClass = 'bg-rose-500 text-white';
                }

                return (
                  <div
                    key={item.day_number}
                    onMouseEnter={() => setHoveredDay(item)}
                    onMouseLeave={() => setHoveredDay(null)}
                    onClick={() => {
                      if (!is_locked && item.day_number <= current_day) {
                        handleStudyAction(undefined, item.day_number);
                      }
                    }}
                    className={`h-5 w-5 sm:h-6 sm:w-6 rounded-md flex items-center justify-center text-[9px] font-bold cursor-pointer transition-all hover:scale-110 ${cellClass}`}
                  >
                    {item.day_number}
                  </div>
                );
              })}
            </div>

            <div className="h-6 flex items-center justify-between text-xs text-slate-600 px-1">
              {hoveredDay ? (
                <span>
                  <strong className="text-slate-900">Day {hoveredDay.day_number}:</strong> {hoveredDay.subject || 'Syllabus Topic'} •{' '}
                  <span className="capitalize font-bold text-blue-600">{hoveredDay.status}</span>
                  {hoveredDay.quiz_score > 0 && ` (Score: ${hoveredDay.quiz_score} pts)`}
                </span>
              ) : (
                <span>Active Rail: Day {current_day} awaiting completion</span>
              )}
              <span className="text-[11px] text-slate-400">
                180 Days Total • Hardcore Spaced Repetition Active
              </span>
            </div>
          </CardContent>
        </Card>

        {/* 5. UPCOMING MILESTONES */}
        <div className="space-y-4 pt-2 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
              <Lock className="h-3.5 w-3.5 text-slate-400" />
              <span>Upcoming Milestones</span>
              <span className="text-xs font-normal text-slate-500">(Locked until current day is cleared)</span>
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {upcoming_days.map((item) => (
              <div
                key={item.day_number}
                className="rounded-2xl border border-slate-200 bg-white p-4 opacity-70 select-none flex flex-col justify-between h-24 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500">
                    Day {item.day_number} • {item.subject}
                  </span>
                  <Lock className="h-3.5 w-3.5 text-slate-400" />
                </div>
                <p className="text-xs font-semibold text-slate-800 line-clamp-2">
                  {item.title}
                </p>
                <span className="text-[10px] text-slate-400">
                  Unlocks automatically on next day
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 6. MIND MOCK TEST (MOVED BELOW UPCOMING MILESTONES PER USER REQUEST) */}
        <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-white border-2 border-indigo-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between hover:border-indigo-400 transition animate-in fade-in">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-100 text-indigo-800 font-bold text-xs border border-indigo-200 animate-pulse">
                  <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                  AI Adaptive Topics Assessment
                </span>
                <span className="text-xs font-bold text-indigo-700">Mind Mock Engine</span>
              </div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">
                Mind Mock Test (Personalized Covered Topics)
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
                AI analyzes all topics and concepts you have completed so far on your 180-day rail and dynamically synthesizes a targeted <strong>25-question, 15-minute diagnostic test</strong> to solidify your conceptual retention.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
              <span className="text-xs font-bold text-indigo-800 bg-white/80 px-3.5 py-2 rounded-xl border border-indigo-200 text-center">
                15 Mins • 25 MCQs
              </span>
              <Link to="/mock-arena?mode=mind-mock">
                <Button className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl h-10 px-5 gap-1.5 shadow-md shadow-indigo-600/20">
                  <Brain className="h-4 w-4 text-amber-300" />
                  <span>Launch Mind Mock Test</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* 7. LIVE SECTIONAL MOCK SIMULATOR CARD */}
        <div className="relative overflow-hidden rounded-3xl border-2 border-indigo-200 bg-gradient-to-r from-blue-50/80 via-indigo-50/70 to-white p-6 shadow-md transition-all hover:border-indigo-400 mt-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-indigo-600/30">
                <Clock className="w-7 h-7" />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-black text-[11px] uppercase tracking-wider border border-indigo-200 animate-pulse">
                    <span className="h-2 w-2 rounded-full bg-indigo-600 animate-ping inline-block" />
                    Live Sectional Mock Simulator
                  </span>
                  <span className="text-xs font-bold text-slate-500 hidden sm:inline">
                    Strict Section Countdown
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  15-Minute Sectional Mock Engine
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 max-w-xl leading-relaxed">
                  Train under real Tier 1 exam constraints: <strong>25 questions in 15 minutes</strong> with instant negative marking (+2.0 / -0.5) and mistake review.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
              <div className="grid grid-cols-2 gap-2 text-center text-xs">
                <div className="bg-white/80 border border-slate-200 px-3 py-2 rounded-xl">
                  <span className="text-[10px] text-slate-400 font-bold block">DURATION</span>
                  <strong className="text-slate-900 font-black text-sm">15 Mins</strong>
                </div>
                <div className="bg-white/80 border border-slate-200 px-3 py-2 rounded-xl">
                  <span className="text-[10px] text-slate-400 font-bold block">QUESTIONS</span>
                  <strong className="text-slate-900 font-black text-sm">25 MCQs</strong>
                </div>
              </div>

              <Link to="/mock-arena">
                <Button className="w-full sm:w-auto h-12 px-6 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-black text-xs rounded-xl shadow-lg shadow-indigo-600/25 gap-2 transition transform hover:-translate-y-0.5">
                  <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                  <span>Launch Sectional Simulator</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
