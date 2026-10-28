import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Play, BookOpen, Clock, CheckCircle2, AlertCircle,
  ArrowRight, ArrowLeft, Lightbulb, Trophy,
  Sparkles, FileText, Check, ShieldAlert, Award
} from 'lucide-react';
import { apiRequest } from '@/lib/api';
import confetti from 'canvas-confetti';

interface Question {
  id: number;
  question_text: string;
  opt_a: string;
  opt_b: string;
  opt_c: string;
  opt_d: string;
  correct_opt: string;
  explanation: string;
  short_trick: string;
}

interface LessonData {
  lesson: {
    id: number;
    title: string;
    youtube_embed_id: string;
    pdf_url: string;
    subject: string;
    stage: number;
    is_completed: boolean;
  };
  practice_questions: Question[];
  simulator_questions: Question[];
  settings: {
    mock_timer_mins: number;
    mock_q_count: number;
    revision_pass_percent: number;
  };
}

export const StudyPlayerPage: React.FC = () => {
  const { lesson_id } = useParams<{ lesson_id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<LessonData | null>(null);
  const [currentStage, setCurrentStage] = useState<1 | 2 | 3>(1);
  const [isBigScreen, setIsBigScreen] = useState(false);

  // Stage 2: Active Recall Practice
  const [practiceIndex, setPracticeIndex] = useState(0);
  const [practiceAnswers, setPracticeAnswers] = useState<Record<number, string>>({});
  const [practiceRevealed, setPracticeRevealed] = useState<Record<number, boolean>>({});

  // Stage 3: TCS 2026 Timed Simulator
  const [simStarted, setSimStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15 * 60);
  const [simAnswers, setSimAnswers] = useState<Record<number, string>>({});
  const [simSubmitted, setSimSubmitted] = useState(false);
  const [simResult, setSimResult] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchLessonData();
  }, [lesson_id]);

  const fetchLessonData = async () => {
    try {
      setLoading(true);
      const res = await apiRequest<LessonData>(`/study/lesson/${lesson_id}`);
      setData(res);
      if (res.settings?.mock_timer_mins) {
        setTimeLeft(res.settings.mock_timer_mins * 60);
      }
    } catch (err: any) {
      console.error('Failed to load lesson', err);
    } finally {
      setLoading(false);
    }
  };

  // Timer countdown for TCS Simulator
  useEffect(() => {
    if (!simStarted || simSubmitted) return;
    if (timeLeft <= 0) {
      handleSubmitSimulator();
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [simStarted, simSubmitted, timeLeft]);

  const handleSelectPracticeOption = (questionId: number, optionKey: string) => {
    setPracticeAnswers(prev => ({ ...prev, [questionId]: optionKey }));
    setPracticeRevealed(prev => ({ ...prev, [questionId]: true }));
  };

  const handleSelectSimOption = (questionId: number, optionKey: string) => {
    if (simSubmitted) return;
    setSimAnswers(prev => ({ ...prev, [questionId]: optionKey }));
  };

  const handleSubmitSimulator = async () => {
    if (submitting || simSubmitted) return;
    setSubmitting(true);
    try {
      const payload = {
        answers: Object.entries(simAnswers).map(([qid, opt]) => ({
          question_id: parseInt(qid),
          selected_opt: opt
        }))
      };
      const res = await apiRequest(`/study/lesson/${lesson_id}/submit-simulator`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setSimResult(res);
      setSimSubmitted(true);
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    } catch (err) {
      console.error('Failed to submit simulator', err);
    } finally {
      setSubmitting(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold">Mounting Study Rail Module...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-800">
        <div className="text-center p-8 bg-white border border-slate-200 rounded-3xl max-w-md shadow-lg">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Lesson Not Found</h2>
          <p className="text-slate-500 text-sm mb-6">The requested lesson could not be loaded or is currently locked.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-sm transition"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const { lesson, practice_questions, simulator_questions, settings } = data;
  const currentPracticeQ = practice_questions[practiceIndex];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Header Rail Navigation */}
      <header className="border-b border-slate-200 bg-white/95 backdrop-blur sticky top-0 z-40 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition"
            title="Return to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-200 uppercase">
                {lesson.subject}
              </span>
              <span className="text-xs text-slate-500 font-medium">Stage {lesson.stage}</span>
            </div>
            <h1 className="text-base font-bold text-slate-900 line-clamp-1">{lesson.title}</h1>
          </div>
        </div>

        {/* Linear Stage Indicators */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentStage(1)}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
              currentStage === 1
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Play className="w-3.5 h-3.5" /> Stage 1: Theory
          </button>

          <span className="text-slate-400 font-mono">→</span>

          <button
            onClick={() => setCurrentStage(2)}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
              currentStage === 2
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" /> Stage 2: Active Recall ({practice_questions.length})
          </button>

          <span className="text-slate-400 font-mono">→</span>

          <button
            onClick={() => setCurrentStage(3)}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
              currentStage === 3
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" /> Stage 3: Sectional Simulator
          </button>
        </div>
      </header>

      {/* STAGE 1: THEORY (BIG SCREEN OR SPLIT SCREEN: VIDEO + NOTES/PDF) */}
      {currentStage === 1 && (
        <div className="flex-1 p-6 max-w-7xl mx-auto w-full flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Stage 1 of 3: Comprehensive Theory & Video Immersion
            </span>
            <button
              onClick={() => setIsBigScreen(!isBigScreen)}
              className="flex items-center text-xs font-bold border border-slate-300 bg-white px-3 py-1.5 hover:bg-slate-50 text-slate-700 rounded-xl gap-1.5 shadow-sm transition"
            >
              <Play className="w-3.5 h-3.5 text-blue-600" />
              <span>{isBigScreen ? 'Switch to Split Screen' : 'Toggle Big Screen Player'}</span>
            </button>
          </div>

          <div className={`grid gap-6 flex-1 ${isBigScreen ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2 min-h-[550px]'}`}>
            {/* YouTube Video Embed - Big Theater Screen inside site */}
            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden flex flex-col shadow-sm">
              <div className="px-5 py-3.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
                <span className="text-xs font-bold text-blue-700 flex items-center gap-2">
                  <Play className="w-3.5 h-3.5 text-blue-600 fill-blue-600" />
                  Curated Video Lecture (In-App Player)
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  {isBigScreen ? 'Theater Cinema Mode Active' : `ID: ${lesson.youtube_embed_id}`}
                </span>
              </div>
              <div className={`w-full bg-slate-950 flex items-center justify-center ${isBigScreen ? 'h-[520px] sm:h-[600px]' : 'flex-1 min-h-[380px]'}`}>
                <iframe
                  className="w-full h-full"
                  src={`https://www.youtube.com/embed/${lesson.youtube_embed_id}?autoplay=0&rel=0&modestbranding=1`}
                  title={lesson.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            </div>

            {/* Right/Bottom: PDF Viewer & Key Study Notes */}
            <div className="bg-white border border-slate-200 rounded-3xl flex flex-col shadow-sm overflow-hidden">
              <div className="px-5 py-3.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-800 flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-emerald-600" />
                  High-Yield Formula & Concept Sheet
                </span>
                <a
                  href={lesson.pdf_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-blue-600 font-semibold hover:underline"
                >
                  Open Full PDF ↗
                </a>
              </div>
              <div className="p-6 flex-1 overflow-y-auto space-y-4">
                <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200">
                  <h3 className="text-sm font-bold text-blue-900 flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    Essential Principles for {lesson.title}
                  </h3>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    Review every formula and shortcut in this section before jumping into active practice.
                    SSC CGL Tier 1 penalizes slow calculation with its strict 15-minute section cutoff.
                  </p>
                </div>

                <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">Key Highlights</h4>
                  <ul className="text-xs space-y-2 text-slate-700 list-disc list-inside">
                    <li>Memorize standard fractions (1/6 = 16.66%, 1/7 = 14.28%, 1/8 = 12.5%, 1/9 = 11.11%).</li>
                    <li>Apply digital sum technique to verify multi-digit arithmetic options instantly.</li>
                    <li>Always cross-check the units digit before performing long multiplications.</li>
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
                  <h4 className="text-xs font-bold text-amber-900 mb-1">Target Exam Speed</h4>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    Aim to solve each Tier 1 question in under 36 seconds. Use Stage 2 to practice the shortcuts.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar: Linear Progression Button */}
          <div className="flex justify-end pt-2">
            <button
              onClick={() => setCurrentStage(2)}
              className="flex items-center gap-3 px-7 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-lg shadow-blue-600/20 transition transform hover:-translate-y-0.5 text-sm"
            >
              <span>Mark Notes Completed → Proceed to Active Practice</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* STAGE 2: ACTIVE RECALL PRACTICE (SPLIT SCREEN SLIDE-IN SHORT TRICK) */}
      {currentStage === 2 && (
        <div className="flex-1 p-6 max-w-7xl mx-auto w-full flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Stage 2: Active Recall & Shortcut Drill</h2>
              <p className="text-xs text-slate-500">
                Attempt the question. Selecting an option will immediately reveal the Vedic short trick and step-by-step breakdown.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-slate-600">
                Question {practiceIndex + 1} of {practice_questions.length}
              </span>
              <div className="w-32 bg-slate-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((practiceIndex + 1) / practice_questions.length) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {currentPracticeQ ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-[480px]">
              {/* Left Side: Question and Options */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 flex flex-col justify-between shadow-sm">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      Practice Q#{practiceIndex + 1}
                    </span>
                    {practiceRevealed[currentPracticeQ.id] && (
                      <span className="text-xs text-emerald-700 flex items-center gap-1 font-bold">
                        <Check className="w-3.5 h-3.5 stroke-[3]" /> Solution Unlocked
                      </span>
                    )}
                  </div>
                  <p className="text-base font-semibold text-slate-900 leading-relaxed mb-6">
                    {currentPracticeQ.question_text}
                  </p>

                  <div className="space-y-3">
                    {(['a', 'b', 'c', 'd'] as const).map(optKey => {
                      const isSelected = practiceAnswers[currentPracticeQ.id] === optKey;
                      const isCorrect = currentPracticeQ.correct_opt.toLowerCase() === optKey;
                      const isRevealed = practiceRevealed[currentPracticeQ.id];

                      let btnStyle = 'border-slate-200 bg-white hover:border-blue-400 text-slate-800';
                      if (isRevealed) {
                        if (isCorrect) {
                          btnStyle = 'border-emerald-400 bg-emerald-50 text-emerald-950 font-semibold';
                        } else if (isSelected && !isCorrect) {
                          btnStyle = 'border-rose-400 bg-rose-50 text-rose-950';
                        }
                      } else if (isSelected) {
                        btnStyle = 'border-blue-500 bg-blue-50 text-blue-950 font-semibold';
                      }

                      return (
                        <button
                          key={optKey}
                          onClick={() => handleSelectPracticeOption(currentPracticeQ.id, optKey)}
                          className={`w-full p-4 rounded-2xl border text-left flex items-start gap-3 transition-all ${btnStyle}`}
                        >
                          <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold uppercase shrink-0 ${
                            isRevealed && isCorrect
                              ? 'bg-emerald-600 text-white'
                              : isRevealed && isSelected && !isCorrect
                              ? 'bg-rose-600 text-white'
                              : isSelected
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {optKey}
                          </span>
                          <span className="text-xs md:text-sm pt-0.5">
                            {currentPracticeQ[`opt_${optKey}` as keyof Question]}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-slate-200 mt-6">
                  <button
                    disabled={practiceIndex === 0}
                    onClick={() => setPracticeIndex(prev => prev - 1)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-200 transition"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Previous
                  </button>

                  {practiceIndex < practice_questions.length - 1 ? (
                    <button
                      onClick={() => setPracticeIndex(prev => prev + 1)}
                      className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition shadow-sm"
                    >
                      Next Practice Q <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      onClick={() => setCurrentStage(3)}
                      className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white transition shadow-md shadow-amber-600/20"
                    >
                      Proceed to Sectional Simulator <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Right Side: Hidden Initially, Slides In On Selection */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 flex flex-col shadow-sm overflow-hidden relative">
                {practiceRevealed[currentPracticeQ.id] ? (
                  <div className="flex-1 flex flex-col space-y-4 animate-in fade-in slide-in-from-right duration-300">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        <span className="text-xs font-black text-emerald-800 uppercase tracking-wide">
                          Correct Option: {currentPracticeQ.correct_opt.toUpperCase()}
                        </span>
                      </div>
                      <span className="text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        Detailed Solution
                      </span>
                    </div>

                    {/* Vedic / Exam Short Trick Box */}
                    <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 shadow-sm">
                      <div className="flex items-center gap-2 mb-2 text-amber-900">
                        <Lightbulb className="w-4 h-4 fill-amber-500 text-amber-600" />
                        <h4 className="text-xs font-black uppercase tracking-wide">Exam Short Trick (10-Second Method)</h4>
                      </div>
                      <p className="text-xs text-amber-950 leading-relaxed font-mono font-medium">
                        {currentPracticeQ.short_trick || 'Solve via option elimination or digital sum shortcut.'}
                      </p>
                    </div>

                    {/* Standard Detailed Explanation */}
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex-1">
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Step-by-Step Explanation</h4>
                      <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                        {currentPracticeQ.explanation}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-400">
                    <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4 text-slate-500">
                      <Lightbulb className="w-8 h-8" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-700 mb-1">Shortcut & Explanation Hidden</h3>
                    <p className="text-xs max-w-xs text-slate-500">
                      Select any option on the left to immediately slide in the full breakdown and high-speed solving trick.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 bg-white rounded-3xl border border-slate-200">
              No practice questions assigned to this lesson yet.
            </div>
          )}
        </div>
      )}

      {/* STAGE 3: TIMED SECTIONAL SIMULATOR */}
      {currentStage === 3 && (
        <div className="flex-1 p-6 max-w-5xl mx-auto w-full flex flex-col justify-center">
          {!simStarted && !simSubmitted && (
            <div className="bg-white border border-slate-200 rounded-3xl p-8 max-w-2xl mx-auto shadow-xl text-center">
              <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-4 text-amber-600">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 mb-2">Sectional Simulator Engine</h2>
              <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                Simulate the exact Tier 1 sectional environment. Strict countdown timer, no pauses allowed.
              </p>

              <div className="grid grid-cols-3 gap-3 mb-8 text-left">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Questions</span>
                  <p className="text-lg font-black text-slate-900">{settings.mock_q_count || 25} MCQs</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Time Limit</span>
                  <p className="text-lg font-black text-amber-700">{settings.mock_timer_mins || 15} Minutes</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Marking</span>
                  <p className="text-lg font-black text-emerald-700">+2.0 / -0.5</p>
                </div>
              </div>

              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => setCurrentStage(2)}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-semibold transition"
                >
                  Review Practice First
                </button>
                <button
                  onClick={() => setSimStarted(true)}
                  className="px-8 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm font-bold shadow-md shadow-amber-600/20 transition transform hover:-translate-y-0.5"
                >
                  Start Timed Test Now
                </button>
              </div>
            </div>
          )}

          {/* ACTIVE TEST VIEW */}
          {simStarted && !simSubmitted && (
            <div className="bg-white border border-slate-200 rounded-3xl flex flex-col shadow-xl overflow-hidden min-h-[600px]">
              {/* Sectional Simulator Header */}
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-mono font-bold text-slate-500">Tier 1 Sectional Engine</span>
                  <h3 className="text-sm font-bold text-slate-900">{lesson.title}</h3>
                </div>

                {/* Countdown Timer */}
                <div className={`flex items-center gap-2 px-4 py-1.5 rounded-xl font-mono text-base font-bold border ${
                  timeLeft <= 180
                    ? 'bg-rose-50 border-rose-300 text-rose-700 animate-pulse'
                    : 'bg-amber-50 border-amber-300 text-amber-800'
                }`}>
                  <Clock className="w-4 h-4" />
                  <span>{formatTimer(timeLeft)}</span>
                </div>

                <button
                  onClick={handleSubmitSimulator}
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition"
                >
                  {submitting ? 'Submitting...' : 'Finish & Submit'}
                </button>
              </div>

              {/* Questions List */}
              <div className="flex-1 p-6 overflow-y-auto space-y-6">
                {simulator_questions.map((q, idx) => (
                  <div key={q.id} className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-slate-500 font-mono">Question {idx + 1} of {simulator_questions.length}</span>
                      {simAnswers[q.id] && (
                        <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                          <Check className="w-3.5 h-3.5 stroke-[3]" /> Answered ({simAnswers[q.id].toUpperCase()})
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-slate-900 mb-4">{q.question_text}</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {(['a', 'b', 'c', 'd'] as const).map(optKey => {
                        const isSelected = simAnswers[q.id] === optKey;
                        return (
                          <button
                            key={optKey}
                            onClick={() => handleSelectSimOption(q.id, optKey)}
                            className={`p-3 rounded-xl border text-left text-xs flex items-center gap-3 transition ${
                              isSelected
                                ? 'border-amber-500 bg-amber-50 text-amber-950 font-bold'
                                : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                            }`}
                          >
                            <span className={`w-5 h-5 rounded flex items-center justify-center text-[11px] font-bold uppercase ${
                              isSelected ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {optKey}
                            </span>
                            <span>{q[`opt_${optKey}` as keyof Question]}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SIMULATOR RESULT VIEW */}
          {simSubmitted && simResult && (
            <div className="bg-white border border-slate-200 rounded-3xl p-8 max-w-2xl mx-auto shadow-xl text-center animate-in zoom-in-95 duration-300">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto mb-4 text-emerald-600">
                <Trophy className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 mb-1">Simulator Test Complete!</h2>
              <p className="text-xs text-slate-500 mb-6">
                Your performance has been evaluated against SSC Tier 1 marking standards.
              </p>

              <div className="grid grid-cols-4 gap-3 mb-6">
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Net Score</span>
                  <p className="text-lg font-black text-emerald-700">{simResult.score} / {simResult.max_score}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Percentage</span>
                  <p className="text-lg font-black text-slate-900">{simResult.percentage}%</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Accuracy</span>
                  <p className="text-lg font-black text-blue-700">{simResult.accuracy}%</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Mistakes</span>
                  <p className="text-lg font-black text-rose-700">{simResult.incorrect_count}</p>
                </div>
              </div>

              {/* Spaced Repetition Notification Pill */}
              <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 mb-6 text-left flex items-start gap-3">
                <Award className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-bold text-blue-900">Day +3 Spaced Repetition Scheduled!</p>
                  <p className="text-slate-600 mt-0.5">
                    This lesson is now stamped as completed. Your initial revision is scheduled for{' '}
                    <strong className="text-slate-900">Day +3</strong>. You will have a 2-day buffer to clear it before the blocker engages.
                  </p>
                </div>
              </div>

              <button
                onClick={() => navigate('/dashboard')}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-600/20 transition"
              >
                Return to Mission Dashboard
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
