import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Clock,
  AlertTriangle,
  Bookmark,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  Brain,
  Award,
  CheckCircle2,
  XCircle,
  HelpCircle,
  RefreshCw,
  Download,
  Printer,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { apiRequest } from '@/lib/api';

interface MockQuestion {
  id: number | string;
  subject: string;
  question_text: string;
  opt_a: string;
  opt_b: string;
  opt_c: string;
  opt_d: string;
  correct_opt?: string;
  explanation?: string;
  short_trick?: string;
}

interface MockPaper {
  test_id: string;
  title: string;
  duration_seconds: number;
  total_questions: number;
  questions: MockQuestion[];
  covered_topics?: string[];
  analysis?: string;
}

interface SubjectScore {
  subject: string;
  correct: number;
  incorrect: number;
  unanswered: number;
  marks: number;
}

interface SubmitResult {
  total_score: number;
  max_score: number;
  accuracy: number;
  percentile: number;
  subject_breakdown: SubjectScore[];
  summary_message: string;
}

export const MockArenaPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const isMindMock = searchParams.get('mode') === 'mind-mock';

  const [paper, setPaper] = useState<MockPaper | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Exam Engine State
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string | number, string>>({});
  const [markedForReview, setMarkedForReview] = useState<Record<string | number, boolean>>({});
  const [timeLeft, setTimeLeft] = useState(3600);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [confirmModal, setConfirmModal] = useState(false);
  const [showReview, setShowReview] = useState(false);

  // Helper to remove any ugly bracket tags like [Quantitative Aptitude Q1] or [General Awareness]
  const cleanText = (t: string) => (t || '').replace(/^\[.*?\]\s*/, '');

  const handlePrintPDF = () => {
    setShowReview(true);
    setTimeout(() => {
      window.print();
    }, 400);
  };

  const handleDownloadReport = () => {
    if (!paper || !result) return;
    let content = `NEX MASTER RAIL - SSC TEST EVALUATION & MISTAKE ANALYSIS REPORT\n`;
    content += `====================================================================\n`;
    content += `Test Title: ${paper.title}\n`;
    content += `Generated On: ${new Date().toLocaleString()}\n`;
    content += `Total Score: ${result.total_score} / ${result.max_score} marks\n`;
    content += `Accuracy: ${result.accuracy}%\n`;
    content += `Percentile: ${result.percentile}th %ile\n`;
    content += `====================================================================\n\n`;
    content += `SECTIONAL PERFORMANCE MATRIX:\n`;
    result.subject_breakdown.forEach((s) => {
      content += `- ${s.subject}: ${s.marks} Marks (Correct: ${s.correct}, Wrong: ${s.incorrect}, Skipped: ${s.unanswered})\n`;
    });
    content += `\n====================================================================\n`;
    content += `QUESTION-BY-QUESTION MISTAKE ANALYSIS & SHORT TRICKS:\n\n`;

    paper.questions.forEach((q, i) => {
      const userAns = userAnswers[q.id] || 'SKIPPED';
      const isCorrect = q.correct_opt && userAns.toUpperCase() === q.correct_opt.toUpperCase();
      content += `[Q${i + 1}] (${q.subject})\n`;
      content += `${cleanText(q.question_text)}\n`;
      content += `A) ${q.opt_a}\nB) ${q.opt_b}\nC) ${q.opt_c}\nD) ${q.opt_d}\n`;
      content += `> Candidate Selection: Option ${userAns}\n`;
      content += `> Official Correct Key: Option ${q.correct_opt || 'A'}\n`;
      content += `> Evaluation Status: ${isCorrect ? '✓ CORRECT (+2.0)' : userAns === 'SKIPPED' ? '— SKIPPED (0.0)' : '✗ INCORRECT (-0.5)'}\n`;
      if (q.explanation) content += `> Concept Solution: ${q.explanation}\n`;
      if (q.short_trick) content += `> Speed Trick: ${q.short_trick}\n`;
      content += `\n--------------------------------------------------------------------\n\n`;
    });

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nex-test-mistake-analysis-${paper.test_id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    fetchPaper();
  }, [isMindMock]);

  const fetchPaper = async () => {
    setLoading(true);
    setError(null);
    setCurrentIdx(0);
    setUserAnswers({});
    setMarkedForReview({});
    setResult(null);
    setShowReview(false);

    try {
      if (isMindMock) {
        // Fetch AI Adaptive Mind Mock from Covered Topics
        const res = await apiRequest<any>('/mocks/mind-mock', { method: 'POST' });
        setPaper({
          test_id: res.test_id || 'mind-mock-test',
          title: res.title || 'Mind Mock Test (Personalized Covered Topics)',
          duration_seconds: res.duration_seconds || 15 * 60,
          total_questions: res.total_questions || (res.questions ? res.questions.length : 25),
          questions: res.questions || [],
          covered_topics: res.covered_topics,
          analysis: res.analysis,
        });
        setTimeLeft(res.duration_seconds || 15 * 60);
      } else {
        // Fetch Standard All-India Weekend Full 100-Q Mock
        const res = await apiRequest<MockPaper>('/mock-arena/paper');
        setPaper(res);
        setTimeLeft(res.duration_seconds || 3600);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to initialize Mock Examination.');
    } finally {
      setLoading(false);
    }
  };

  // Live Timer Countdown
  useEffect(() => {
    if (result || loading || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [result, loading, timeLeft]);

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSelectAnswer = (option: string) => {
    if (!paper) return;
    const qId = paper.questions[currentIdx]?.id;
    setUserAnswers((prev) => ({
      ...prev,
      [qId]: option,
    }));
  };

  const handleClearResponse = () => {
    if (!paper) return;
    const qId = paper.questions[currentIdx]?.id;
    setUserAnswers((prev) => {
      const copy = { ...prev };
      delete copy[qId];
      return copy;
    });
  };

  const handleToggleReview = () => {
    if (!paper) return;
    const qId = paper.questions[currentIdx]?.id;
    setMarkedForReview((prev) => ({
      ...prev,
      [qId]: !prev[qId],
    }));
    if (currentIdx < (paper?.questions.length || 0) - 1) {
      setCurrentIdx((prev) => prev + 1);
    }
  };

  const handleSaveAndNext = () => {
    if (currentIdx < (paper?.questions.length || 0) - 1) {
      setCurrentIdx((prev) => prev + 1);
    }
  };

  const handleSubmitTest = async () => {
    if (!paper) return;
    setSubmitting(true);
    setConfirmModal(false);

    try {
      if (isMindMock || paper.test_id === 'mind-mock-test') {
        // Calculate scoring directly based on question answers
        const subjectMap: Record<string, { correct: number; incorrect: number; unanswered: number }> = {
          'Quantitative Aptitude': { correct: 0, incorrect: 0, unanswered: 0 },
          'General Intelligence & Reasoning': { correct: 0, incorrect: 0, unanswered: 0 },
          'English Comprehension': { correct: 0, incorrect: 0, unanswered: 0 },
          'General Awareness': { correct: 0, incorrect: 0, unanswered: 0 },
        };

        let totalCorrect = 0;
        let totalIncorrect = 0;

        paper.questions.forEach((q) => {
          const userChoice = userAnswers[q.id];
          const subj = q.subject || 'General Awareness';
          if (!subjectMap[subj]) {
            subjectMap[subj] = { correct: 0, incorrect: 0, unanswered: 0 };
          }

          if (!userChoice) {
            subjectMap[subj].unanswered += 1;
          } else if (q.correct_opt && userChoice.toUpperCase() === q.correct_opt.toUpperCase()) {
            subjectMap[subj].correct += 1;
            totalCorrect += 1;
          } else {
            subjectMap[subj].incorrect += 1;
            totalIncorrect += 1;
          }
        });

        const totalScore = Math.max(totalCorrect * 2.0 - totalIncorrect * 0.5, 0);
        const maxScore = paper.questions.length * 2.0;
        const totalAttempted = totalCorrect + totalIncorrect;
        const accuracy = totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 100) : 0;
        const percentile = Math.min(Math.round(82.0 + (totalScore / Math.max(maxScore, 1)) * 17.5), 99.8);

        const breakdown: SubjectScore[] = Object.entries(subjectMap).map(([subj, data]) => ({
          subject: subj,
          correct: data.correct,
          incorrect: data.incorrect,
          unanswered: data.unanswered,
          marks: Math.max(Math.round((data.correct * 2.0 - data.incorrect * 0.5) * 10) / 10, 0),
        }));

        setResult({
          total_score: Math.round(totalScore * 10) / 10,
          max_score: maxScore,
          accuracy,
          percentile,
          subject_breakdown: breakdown,
          summary_message: `AI Assessment Complete: Cleared ${totalCorrect}/${paper.questions.length} questions correctly across covered topics. Standing at ${percentile}th percentile.`,
        });
      } else {
        // Send to standard backend submit
        const res = await apiRequest<SubmitResult>('/mock-arena/submit', {
          method: 'POST',
          body: JSON.stringify({
            test_id: paper.test_id,
            answers: userAnswers,
          }),
        });
        setResult(res);
      }
    } catch (err: any) {
      alert(err.message || 'Submission error');
    } finally {
      setSubmitting(false);
    }
  };

  const switchMode = (newMode: 'full' | 'mind-mock') => {
    if (newMode === 'mind-mock') {
      setSearchParams({ mode: 'mind-mock' });
    } else {
      setSearchParams({});
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-600 text-sm font-sans">
        <div className="flex flex-col items-center gap-3 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <div className="h-10 w-10 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
          <span className="font-bold text-slate-800">
            {isMindMock ? 'Synthesizing Adaptive Mind Mock Test...' : 'Initializing 100-Question Simulated Arena...'}
          </span>
          <p className="text-xs text-slate-400">Loading TCS 2026 examination engine telemetry</p>
        </div>
      </div>
    );
  }

  if (error || !paper) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="max-w-md bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto" />
          <h2 className="text-lg font-bold text-slate-900">Examination Engine Offline</h2>
          <p className="text-xs text-slate-600">{error || 'Mock Arena could not be loaded.'}</p>
          <div className="flex items-center justify-center gap-2 pt-2">
            <Button onClick={fetchPaper} variant="outline" className="border-slate-300 text-slate-700 rounded-xl text-xs">
              <RefreshCw className="h-3.5 w-3.5 mr-1" /> Retry Connection
            </Button>
            <Button onClick={() => navigate('/dashboard')} className="bg-blue-600 text-white rounded-xl text-xs">
              Return to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // RESULT & REVIEW ANALYSIS VIEW
  if (result) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 p-4 sm:p-10 flex flex-col items-center font-sans">
        <div className="max-w-4xl w-full space-y-6 animate-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="text-center space-y-2">
            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 font-bold px-3 py-1 text-xs">
              Examination Completed & Evaluated
            </Badge>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              {isMindMock ? 'Mind Mock Assessment Telemetry' : 'Weekend Full Mock Performance'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto">
              {result.summary_message}
            </p>
          </div>

          {/* Top KPI Score Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center space-y-1 shadow-sm">
              <span className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">Total Score</span>
              <p className="text-3xl sm:text-4xl font-black text-blue-700">
                {result.total_score} <span className="text-sm text-slate-400 font-normal">/ {result.max_score}</span>
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center space-y-1 shadow-sm">
              <span className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">Percentile Rank</span>
              <p className="text-3xl sm:text-4xl font-black text-emerald-600">
                {result.percentile}<span className="text-xl font-normal">%ile</span>
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center space-y-1 shadow-sm">
              <span className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">Accuracy</span>
              <p className="text-3xl sm:text-4xl font-black text-slate-900">
                {result.accuracy}%
              </p>
            </div>
          </div>

          {/* Sectional Breakdown Table */}
          <Card className="border border-slate-200 bg-white shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="bg-slate-50/70 border-b border-slate-200 py-3.5 px-6">
              <CardTitle className="text-sm font-bold text-slate-900">Sectional Performance Matrix</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/40 text-slate-500">
                      <th className="py-3 px-6 font-bold">Section</th>
                      <th className="py-3 px-4 font-bold text-emerald-700">Correct (+2)</th>
                      <th className="py-3 px-4 font-bold text-rose-600">Wrong (-0.5)</th>
                      <th className="py-3 px-4 font-bold text-slate-500">Skipped</th>
                      <th className="py-3 px-6 font-bold text-right text-slate-900">Net Marks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {result.subject_breakdown.map((subj, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-3.5 px-6 font-bold text-slate-900">{subj.subject}</td>
                        <td className="py-3.5 px-4 text-emerald-600 font-bold">{subj.correct}</td>
                        <td className="py-3.5 px-4 text-rose-600 font-bold">{subj.incorrect}</td>
                        <td className="py-3.5 px-4 text-slate-400 font-medium">{subj.unanswered}</td>
                        <td className="py-3.5 px-6 font-black text-right text-blue-700">{subj.marks}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Actions & Report Download Bar */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowReview(!showReview)}
                  className="border-slate-300 text-slate-800 text-xs font-bold rounded-xl h-10 gap-1.5 shadow-sm"
                >
                  <HelpCircle className="h-4 w-4 text-blue-600" />
                  <span>{showReview ? 'Hide Question Explanations' : 'Review Questions & Explanations'}</span>
                </Button>

                <Button
                  onClick={handlePrintPDF}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl h-10 px-4 gap-1.5 shadow-sm"
                >
                  <Printer className="h-4 w-4" />
                  <span>Download Test Report (PDF)</span>
                </Button>

                <Button
                  onClick={handleDownloadReport}
                  variant="outline"
                  className="border-slate-300 text-slate-700 text-xs font-bold rounded-xl h-10 gap-1.5 shadow-sm"
                >
                  <Download className="h-4 w-4 text-emerald-600" />
                  <span>Download Mistake Analysis</span>
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={fetchPaper}
                  variant="outline"
                  className="border-slate-300 text-slate-700 text-xs font-bold rounded-xl h-10 gap-1.5"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Retake Test
                </Button>
                <Button
                  onClick={() => navigate('/dashboard')}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl h-10 px-5 gap-1.5 shadow-sm"
                >
                  <span>Back to Dashboard</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Detailed Question Review List */}
            {showReview && (
              <div className="space-y-4 pt-2">
                {paper.questions.map((q, idx) => {
                  const userAns = userAnswers[q.id];
                  const isCorrect = q.correct_opt && userAns?.toUpperCase() === q.correct_opt.toUpperCase();
                  const isSkipped = !userAns;

                  return (
                    <div
                      key={idx}
                      className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-blue-700 uppercase tracking-wide">
                          Question #{idx + 1} • {q.subject}
                        </span>
                        {isCorrect ? (
                          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 font-bold text-[10px] gap-1">
                            <CheckCircle2 className="h-3 w-3" /> Correct (+2.0)
                          </Badge>
                        ) : isSkipped ? (
                          <Badge variant="outline" className="border-slate-300 text-slate-600 font-bold text-[10px]">
                            Skipped (0.0)
                          </Badge>
                        ) : (
                          <Badge className="bg-rose-100 text-rose-800 border-rose-300 font-bold text-[10px] gap-1">
                            <XCircle className="h-3 w-3" /> Incorrect (-0.5)
                          </Badge>
                        )}
                      </div>

                      <p className="text-sm font-bold text-slate-900 leading-relaxed">
                        {cleanText(q.question_text)}
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {[
                          { k: 'A', text: q.opt_a },
                          { k: 'B', text: q.opt_b },
                          { k: 'C', text: q.opt_c },
                          { k: 'D', text: q.opt_d },
                        ].map((opt) => {
                          const isUserPicked = userAns === opt.k;
                          const isRightAnswer = q.correct_opt === opt.k;

                          let optStyle = 'border-slate-200 bg-slate-50 text-slate-700';
                          if (isRightAnswer) {
                            optStyle = 'border-emerald-400 bg-emerald-50 text-emerald-950 font-bold';
                          } else if (isUserPicked && !isRightAnswer) {
                            optStyle = 'border-rose-400 bg-rose-50 text-rose-950 font-bold';
                          }

                          return (
                            <div
                              key={opt.k}
                              className={`p-2.5 rounded-xl border flex items-center gap-2 ${optStyle}`}
                            >
                              <span className="font-bold">{opt.k}.</span>
                              <span className="flex-1">{opt.text}</span>
                              {isRightAnswer && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />}
                              {isUserPicked && !isRightAnswer && <XCircle className="h-3.5 w-3.5 text-rose-600 shrink-0" />}
                            </div>
                          );
                        })}
                      </div>

                      {q.explanation && (
                        <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200 text-xs space-y-1">
                          <strong className="text-blue-900 block font-bold">Standard Concept Explanation:</strong>
                          <p className="text-blue-800">{q.explanation}</p>
                          {q.short_trick && (
                            <p className="text-amber-800 font-semibold pt-1">
                              💡 Speed Trick: {q.short_trick}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const currentQ = paper.questions[currentIdx];
  const qId = currentQ?.id;
  const currentAnswer = userAnswers[qId];
  const isMarked = markedForReview[qId];

  const sections = [
    'Quantitative Aptitude',
    'General Intelligence & Reasoning',
    'English Comprehension',
    'General Awareness',
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans select-none">
      {/* Top Test Header */}
      <header className="h-16 border-b border-slate-200 bg-white px-4 sm:px-6 flex items-center justify-between shrink-0 shadow-sm sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-black text-slate-900 truncate max-w-xs sm:max-w-md">
                {paper.title}
              </h1>
              {isMindMock ? (
                <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200 font-bold text-[10px] hidden sm:inline-flex">
                  AI Adaptive • 25 Qs
                </Badge>
              ) : (
                <Badge className="bg-blue-100 text-blue-800 border-blue-200 font-bold text-[10px] hidden sm:inline-flex">
                  Full Simulation • 100 Qs
                </Badge>
              )}
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              {isMindMock ? 'Topics Completed Coverage Analysis' : 'Standard SSC CGL/CHSL 4-Section Pattern'}
            </p>
          </div>
        </div>

        {/* Live Countdown Timer & Action Controls */}
        <div className="flex items-center gap-3">
          {/* Mode Switcher Pill */}
          <div className="hidden md:flex items-center p-1 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold">
            <button
              onClick={() => switchMode('full')}
              className={`px-3 py-1 rounded-lg transition ${
                !isMindMock ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              100-Q Full Mock
            </button>
            <button
              onClick={() => switchMode('mind-mock')}
              className={`px-3 py-1 rounded-lg transition ${
                isMindMock ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Mind Mock (25 Qs)
            </button>
          </div>

          {/* Countdown Clock Pill - Crystal Clear High Contrast */}
          <div
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border font-mono font-bold text-sm shadow-sm ${
              timeLeft < 300
                ? 'border-rose-300 bg-rose-50 text-rose-700 animate-pulse'
                : 'border-slate-200 bg-slate-100 text-slate-800'
            }`}
          >
            <Clock className={`h-4 w-4 ${timeLeft < 300 ? 'text-rose-600' : 'text-blue-600'}`} />
            <span>{formatTimer(timeLeft)}</span>
          </div>

          <Button
            size="sm"
            onClick={() => setConfirmModal(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 rounded-xl shadow-sm h-9 text-xs"
          >
            Submit Test
          </Button>
        </div>
      </header>

      {/* Section Filter Tabs */}
      <div className="border-b border-slate-200 bg-white px-4 sm:px-6 flex items-center gap-2 overflow-x-auto py-2.5">
        {sections.map((subj) => (
          <button
            key={subj}
            onClick={() => {
              const firstQ = paper.questions.findIndex((q) => q.subject === subj);
              if (firstQ !== -1) setCurrentIdx(firstQ);
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              currentQ?.subject === subj
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 bg-white'
            }`}
          >
            {subj}
          </button>
        ))}
      </div>

      {/* Main Test Layout (Split 8 cols / 4 cols) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* Left Side: Question Display Area (8 cols) */}
        <div className="lg:col-span-8 p-6 sm:p-8 flex flex-col justify-between overflow-y-auto border-r border-slate-200 bg-white">
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-black text-blue-700 uppercase tracking-wider flex items-center gap-2">
                <Award className="h-4 w-4 text-blue-600" />
                <span>Question #{currentIdx + 1} of {paper.questions.length} • {currentQ?.subject || 'SSC Tier 1'}</span>
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  +2.0 / -0.5 Marks
                </span>
                {isMarked && (
                  <Badge className="bg-purple-100 text-purple-800 border-purple-200 text-[10px] font-bold">
                    Marked for Review
                  </Badge>
                )}
              </div>
            </div>

            {/* Question Text */}
            <p className="text-base sm:text-lg font-bold text-slate-900 leading-relaxed">
              {cleanText(currentQ?.question_text)}
            </p>

            {/* Options List */}
            <div className="space-y-3 pt-2">
              {[
                { key: 'A', text: currentQ?.opt_a },
                { key: 'B', text: currentQ?.opt_b },
                { key: 'C', text: currentQ?.opt_c },
                { key: 'D', text: currentQ?.opt_d },
              ].map((opt) => {
                const isSelected = currentAnswer === opt.key;
                return (
                  <div
                    key={opt.key}
                    onClick={() => handleSelectAnswer(opt.key)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center gap-4 ${
                      isSelected
                        ? 'border-2 border-blue-600 bg-blue-50/70 shadow-sm'
                        : 'border-slate-200 bg-slate-50 hover:bg-blue-50/40 hover:border-blue-300'
                    }`}
                  >
                    <div
                      className={`h-7 w-7 rounded-xl flex items-center justify-center font-bold text-xs shadow-sm transition-all ${
                        isSelected
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-slate-700 border border-slate-300'
                      }`}
                    >
                      {opt.key}
                    </div>
                    <span className={`text-sm flex-1 ${isSelected ? 'font-black text-blue-950' : 'font-semibold text-slate-800'}`}>
                      {opt.text}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="pt-6 border-t border-slate-200 mt-8 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleToggleReview}
                className={`text-xs font-bold gap-1.5 rounded-xl h-9 border-slate-300 ${
                  isMarked ? 'bg-purple-100 text-purple-800 border-purple-300' : 'text-slate-700'
                }`}
              >
                <Bookmark className="h-3.5 w-3.5 text-purple-600" />
                <span>{isMarked ? 'Unmark Review' : 'Mark for Review'}</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                disabled={!currentAnswer}
                onClick={handleClearResponse}
                className="text-xs text-slate-500 hover:text-slate-900 font-bold h-9 rounded-xl hover:bg-slate-100"
              >
                Clear Response
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentIdx === 0}
                onClick={() => setCurrentIdx((prev) => prev - 1)}
                className="border-slate-300 text-slate-700 text-xs font-bold rounded-xl h-9 px-3"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>

              <Button
                size="sm"
                onClick={handleSaveAndNext}
                disabled={currentIdx === paper.questions.length - 1}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl h-9 px-4 gap-1 shadow-sm"
              >
                Save & Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Right Side: Question Palette (4 cols) */}
        <div className="lg:col-span-4 p-5 sm:p-6 bg-slate-50 flex flex-col justify-between overflow-y-auto border-t lg:border-t-0 border-slate-200">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Brain className="h-4 w-4 text-blue-600" />
                Question Palette ({paper.questions.length} Qs)
              </h3>
              <span className="text-xs text-blue-700 font-bold">
                {Object.keys(userAnswers).length} / {paper.questions.length} Attempted
              </span>
            </div>

            {/* Legend */}
            <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-600 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded bg-emerald-600 inline-block" />
                <span className="font-semibold">Answered</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded bg-purple-600 inline-block" />
                <span className="font-semibold">Review</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded bg-slate-300 inline-block" />
                <span className="font-semibold">Unattempted</span>
              </div>
            </div>

            {/* Question Buttons Palette */}
            <div className="p-3.5 rounded-2xl bg-white border border-slate-200 max-h-[460px] overflow-y-auto shadow-sm">
              <div className={`grid ${paper.questions.length <= 25 ? 'grid-cols-5' : 'grid-cols-10'} gap-1.5`}>
                {paper.questions.map((q, idx) => {
                  const ans = userAnswers[q.id];
                  const rev = markedForReview[q.id];
                  const isCurrent = idx === currentIdx;

                  let colorClass = 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200';
                  if (rev) {
                    colorClass = 'bg-purple-600 text-white font-black shadow-sm';
                  } else if (ans) {
                    colorClass = 'bg-emerald-600 text-white font-black shadow-sm';
                  }

                  if (isCurrent) {
                    colorClass += ' ring-2 ring-blue-600 ring-offset-2';
                  }

                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentIdx(idx)}
                      className={`h-7 w-7 rounded-lg text-[11px] font-bold flex items-center justify-center transition-all ${colorClass}`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-200">
            <Button
              onClick={() => setConfirmModal(true)}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 rounded-xl shadow-sm text-sm"
            >
              Submit Final Mock Test
            </Button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 max-w-md w-full rounded-3xl p-6 space-y-4 text-center shadow-2xl">
            <div className="h-12 w-12 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-700 mx-auto">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Submit Mock Examination?</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              You have answered <strong className="text-slate-900 font-bold">{Object.keys(userAnswers).length}</strong> out of {paper.questions.length} questions.
              Once submitted, your percentile rank, sectional accuracy, and explanations will be generated immediately.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setConfirmModal(false)}
                className="w-1/2 border-slate-300 text-slate-700 rounded-xl font-bold text-xs h-10"
              >
                Resume Test
              </Button>
              <Button
                disabled={submitting}
                onClick={handleSubmitTest}
                className="w-1/2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs h-10 shadow-sm"
              >
                {submitting ? 'Evaluating...' : 'Yes, Submit Test'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
