import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import {
  ArrowLeft,
  RotateCcw,
  Clock,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  PlayCircle,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { apiRequest } from '@/lib/api';

interface RevisionQuestion {
  id: string;
  question_text: string;
  opt_a: string;
  opt_b: string;
  opt_c: string;
  opt_d: string;
  correct_opt: string;
  explanation?: string;
  short_trick?: string;
}

interface RevisionLesson {
  id: string;
  title: string;
  subject: string;
  topic_title: string;
  youtube_embed_id: string;
  pdf_url?: string;
  short_trick_notes?: string;
}

interface RevisionData {
  id: string;
  lesson: RevisionLesson;
  interval_days: number;
  scheduled_for: string;
  deadline: string;
  is_overdue: boolean;
  days_overdue: number;
  status: string;
  current_stage: number; // 1=Notes, 2=MCQ Test, 3=Penalty Retest Loop
  pass_percent_required: number;
  test_timer_seconds: number;
  questions: RevisionQuestion[];
}

interface SubmitResult {
  passed: boolean;
  score_achieved: number;
  pass_percent_required: number;
  total_questions: number;
  correct_count: number;
  message: string;
  next_interval?: number;
  current_stage: number;
}

export const RevisionGatewayPage: React.FC = () => {
  const { revision_id } = useParams<{ revision_id: string }>();
  const navigate = useNavigate();

  const [data, setData] = useState<RevisionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active Stage within Gateway (1=Notes, 2=Test, 3=Penalty)
  const [stage, setStage] = useState<number>(1);
  const [timeLeft, setTimeLeft] = useState<number>(900); // 15 mins default
  const [currentQIndex, setCurrentQIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [result, setResult] = useState<SubmitResult | null>(null);

  useEffect(() => {
    const fetchRevisionSession = async () => {
      try {
        setLoading(true);
        const res = await apiRequest<RevisionData>(`/revision/${revision_id}`);
        setData(res);
        setStage(res.current_stage || 1);
        setTimeLeft(res.test_timer_seconds || 900);
      } catch (err: any) {
        setError(err.message || 'Failed to load revision gateway');
      } finally {
        setLoading(false);
      }
    };

    fetchRevisionSession();
  }, [revision_id]);

  // Sectional Timer countdown
  useEffect(() => {
    if (stage !== 2 || result?.passed) return;

    if (timeLeft <= 0) {
      handleSubmitTest();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [stage, timeLeft, result]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSelectOption = (questionId: string, optionKey: string) => {
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: optionKey,
    }));
  };

  const handleSubmitTest = async () => {
    if (!data) return;
    setSubmitting(true);

    try {
      const res = await apiRequest<SubmitResult>(`/revision/${revision_id}/submit`, {
        method: 'POST',
        body: JSON.stringify({ answers: userAnswers }),
      });

      setResult(res);

      if (res.passed) {
        confetti({
          particleCount: 140,
          spread: 90,
          origin: { y: 0.6 },
        });
      } else {
        // Automatically switch to penalty stage
        setStage(3);
      }
    } catch (err: any) {
      alert(err.message || 'Error evaluating test');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAcknowledgePenalty = async () => {
    if (!data) return;
    setRetrying(true);

    try {
      await apiRequest(`/revision/${revision_id}/retry`, {
        method: 'POST',
      });
      // Reset test state for a fresh attempt
      setResult(null);
      setUserAnswers({});
      setCurrentQIndex(0);
      setTimeLeft(data.test_timer_seconds || 900);
      setStage(2);
    } catch (err: any) {
      alert(err.message || 'Error unlocking retest');
    } finally {
      setRetrying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500 text-sm">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
          <span className="font-semibold">Entering Spaced-Repetition Gateway...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <p className="text-rose-600 mb-4 font-bold">{error || 'Session not found'}</p>
        <Button onClick={() => navigate('/dashboard')} variant="outline" className="border-slate-300">
          Return to Dashboard
        </Button>
      </div>
    );
  }

  const { lesson, interval_days, pass_percent_required, is_overdue, days_overdue, questions } = data;
  const currentQ = questions[currentQIndex];
  const answeredCount = Object.keys(userAnswers).length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Gateway Header */}
      <header className="h-16 border-b border-slate-200 bg-white px-4 sm:px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard')}
            className="text-slate-600 hover:text-slate-900 gap-1.5 px-2 hover:bg-slate-100"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline font-semibold">Back to Dashboard</span>
          </Button>

          <div className="h-4 w-px bg-slate-200 hidden sm:block" />

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">
                Spaced Revision • Day +{interval_days}
              </span>
              {is_overdue && (
                <Badge variant="destructive" className="text-[10px] py-0 px-2 font-bold bg-rose-600">
                  Overdue by {days_overdue}d (Blocking Rail)
                </Badge>
              )}
            </div>
            <h1 className="text-sm font-bold text-slate-900 truncate max-w-xs sm:max-w-md">
              {lesson.title}
            </h1>
          </div>
        </div>

        {/* Status / Criteria Pill */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs text-blue-700 font-bold">
            <span>Pass Criteria:</span>
            <strong className="text-blue-900">{pass_percent_required}%</strong>
          </div>

          {stage === 2 && (
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-xl border font-mono font-bold text-xs ${
              timeLeft < 180 ? 'border-rose-300 bg-rose-50 text-rose-700 animate-pulse' : 'border-amber-300 bg-amber-50 text-amber-900'
            }`}>
              <Clock className="h-3.5 w-3.5 text-amber-600" />
              <span>{formatTimer(timeLeft)}</span>
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-8 flex flex-col justify-center">
        {/* RESULT SUCCESS VIEW */}
        {result?.passed && (
          <div className="text-center space-y-6 animate-in zoom-in-95 duration-300 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <div className="h-16 w-16 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <div className="space-y-2">
              <Badge className="bg-emerald-100 border-emerald-200 text-emerald-800 text-xs px-3 py-1 font-bold">
                Retention Verified
              </Badge>
              <h2 className="text-3xl font-black text-slate-900">
                Spaced Revision Cleared!
              </h2>
              <p className="text-sm text-slate-600 max-w-md mx-auto">
                {result.message}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-xs text-slate-500 uppercase font-bold">Score Achieved</span>
                <p className="text-2xl font-black text-emerald-700">{result.score_achieved}%</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-xs text-slate-500 uppercase font-bold">Required Cutoff</span>
                <p className="text-2xl font-black text-slate-900">{result.pass_percent_required}%</p>
              </div>
            </div>

            <Button
              size="lg"
              onClick={() => navigate('/dashboard')}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm h-12 px-8 gap-2 shadow-md shadow-blue-600/20 rounded-xl"
            >
              <span>Return to Dashboard (Blocker Lifted)</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* STAGE 1: NOTES & TRICKS REVIEW */}
        {!result?.passed && stage === 1 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge className="text-xs bg-blue-100 text-blue-800 border-blue-200 font-bold">
                  Stage 1: High-Yield Recall
                </Badge>
                <span className="text-xs text-slate-500 font-medium">
                  Review before the mandatory MCQ test
                </span>
              </div>
              <h2 className="text-2xl font-black text-slate-900">
                {lesson.title}
              </h2>
              <p className="text-xs text-slate-500">
                Subject: {lesson.subject} • Topic: {lesson.topic_title}
              </p>
            </div>

            {/* Shortcut Card */}
            <Card className="border-slate-200 bg-white shadow-sm rounded-3xl">
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-base text-slate-900 flex items-center gap-2 font-bold">
                  <BookOpen className="h-4 w-4 text-amber-600" />
                  <span>Exam Shortcuts & Formula Revision Sheet</span>
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Re-read these short tricks carefully. The upcoming revision test requires {pass_percent_required}% to pass.
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-4 space-y-4">
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs sm:text-sm text-amber-950 leading-relaxed font-mono font-medium">
                  {lesson.short_trick_notes || 'Always apply fraction conversions and eliminate extreme options first.'}
                </div>

                <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-blue-900 font-semibold">
                    <Sparkles className="h-4 w-4 text-blue-600" />
                    <span>Reference notes PDF available for deep review</span>
                  </div>
                  {lesson.pdf_url && (
                    <a
                      href={lesson.pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-700 hover:underline font-bold"
                    >
                      Open PDF Notes ↗
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>

            <Button
              size="lg"
              onClick={() => setStage(2)}
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm gap-2 shadow-md shadow-blue-600/20 rounded-xl"
            >
              <span>I've Reviewed Formula Tricks &rarr; Enter Timed Revision Test</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* STAGE 2: TIMED MCQ RETENTION TEST */}
        {!result?.passed && stage === 2 && currentQ && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge className="text-xs bg-blue-50 border-blue-200 text-blue-700 font-bold">
                  Stage 2: Retention Test
                </Badge>
                <span className="text-xs text-slate-500 font-medium">
                  Question {currentQIndex + 1} of {questions.length}
                </span>
              </div>
              <span className="text-xs font-bold text-slate-600">
                {answeredCount} / {questions.length} Answered
              </span>
            </div>

            <Progress value={((currentQIndex + 1) / questions.length) * 100} className="h-2 bg-slate-200" />

            <Card className="border-slate-200 bg-white shadow-sm rounded-3xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-base sm:text-lg font-bold text-slate-900 leading-relaxed">
                  {currentQ.question_text}
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-3">
                {[
                  { key: 'A', text: currentQ.opt_a },
                  { key: 'B', text: currentQ.opt_b },
                  { key: 'C', text: currentQ.opt_c },
                  { key: 'D', text: currentQ.opt_d },
                ].map((opt) => {
                  const isSelected = userAnswers[currentQ.id] === opt.key;
                  return (
                    <div
                      key={opt.key}
                      onClick={() => handleSelectOption(currentQ.id, opt.key)}
                      className={`p-4 rounded-2xl border text-sm flex items-center gap-3 transition-all cursor-pointer ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50 text-blue-950 font-bold shadow-sm'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-800'
                      }`}
                    >
                      <div className={`h-6 w-6 rounded-lg flex items-center justify-center font-bold text-xs ${
                        isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {opt.key}
                      </div>
                      <span className="flex-1 text-xs sm:text-sm">{opt.text}</span>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Navigation and Submit Toolbar */}
            <div className="flex items-center justify-between pt-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentQIndex === 0}
                onClick={() => setCurrentQIndex((prev) => prev - 1)}
                className="border-slate-300 text-xs gap-1 rounded-xl"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>

              <div className="flex items-center gap-2">
                {currentQIndex < questions.length - 1 ? (
                  <Button
                    size="sm"
                    onClick={() => setCurrentQIndex((prev) => prev + 1)}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1 rounded-xl font-bold"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    disabled={submitting}
                    onClick={handleSubmitTest}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 rounded-xl shadow-sm"
                  >
                    {submitting ? 'Evaluating Score...' : 'Submit Revision Test'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* STAGE 3: PENALTY RETEST LOOP (FAILED CUTOFF) */}
        {!result?.passed && stage === 3 && (
          <div className="space-y-6 animate-in zoom-in-95 duration-300">
            <div className="rounded-3xl border-2 border-rose-300 bg-rose-50 p-6 space-y-2">
              <div className="flex items-center gap-2 text-rose-800 font-black text-sm">
                <AlertTriangle className="h-5 w-5 text-rose-600" />
                <span>Mandatory Penalty Loop Activated</span>
              </div>
              <p className="text-xs sm:text-sm text-rose-900 leading-relaxed">
                {result?.message || `You scored below the required ${pass_percent_required}% pass cutoff. In NEX, you cannot bypass revisions. You must re-watch the core lesson lecture and pass the retest to unblock your rail.`}
              </p>
            </div>

            {/* Video Player Mandatory Re-watch */}
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <PlayCircle className="h-4 w-4 text-blue-600" />
                <span>Re-watch Lecture: {lesson.title}</span>
              </h3>
              <div className="relative aspect-video w-full rounded-3xl overflow-hidden bg-black border border-slate-300 shadow-xl">
                <iframe
                  className="w-full h-full"
                  src={`https://www.youtube.com/embed/${lesson.youtube_embed_id || 'dQw4w9WgXcQ'}?autoplay=0&rel=0`}
                  title={lesson.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>

            {/* Retake Button */}
            <Button
              size="lg"
              disabled={retrying}
              onClick={handleAcknowledgePenalty}
              className="w-full h-12 bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm gap-2 shadow-md shadow-rose-600/20 rounded-xl"
            >
              {retrying ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Preparing Fresh Retest...
                </>
              ) : (
                <>
                  <RotateCcw className="h-4 w-4" />
                  I Have Re-watched the Lecture &rarr; Retake Revision Test
                </>
              )}
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};
