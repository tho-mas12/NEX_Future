import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  ArrowRight,
  ArrowLeft,
  Trophy,
  Loader2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { apiRequest } from '@/lib/api';
import confetti from 'canvas-confetti';

interface CurrentAffairsModule {
  id: string;
  title: string;
  published_date: string;
  summary_notes: string;
  question_count: number;
}

interface TestQuestion {
  id: number;
  question_text: string;
  opt_a: string;
  opt_b: string;
  opt_c: string;
  opt_d: string;
  correct_opt: string;
  explanation: string;
}

interface TestData {
  id: string;
  title: string;
  questions: TestQuestion[];
  total_questions: number;
  duration_mins: number;
}

export const UserCurrentAffairsPage: React.FC = () => {
  const navigate = useNavigate();
  const [modules, setModules] = useState<CurrentAffairsModule[]>([]);
  const [loading, setLoading] = useState(true);

  // Active study / test state
  const [activeModule, setActiveModule] = useState<CurrentAffairsModule | null>(null);
  const [mode, setMode] = useState<'study' | 'test'>('study');
  const [testData, setTestData] = useState<TestData | null>(null);
  const [loadingTest, setLoadingTest] = useState(false);

  // Test answers & result
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [testSubmitted, setTestSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    fetchModules();
  }, []);

  const fetchModules = async () => {
    setLoading(true);
    try {
      const data = await apiRequest<CurrentAffairsModule[]>('/current-affairs');
      setModules(data);
    } catch (err: any) {
      console.error('Failed to load current affairs modules:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartStudy = (module: CurrentAffairsModule) => {
    setActiveModule(module);
    setMode('study');
    setTestSubmitted(false);
    setUserAnswers({});
  };

  const handleStartShuffledTest = async () => {
    if (!activeModule) return;
    setLoadingTest(true);
    try {
      const data = await apiRequest<TestData>(`/current-affairs/${activeModule.id}/test`);
      setTestData(data);
      setMode('test');
      setUserAnswers({});
      setTestSubmitted(false);
    } catch (err: any) {
      alert(err.message || 'No questions ready for this module yet.');
    } finally {
      setLoadingTest(false);
    }
  };

  const handleSelectOption = (qIdx: number, optKey: string) => {
    if (testSubmitted) return;
    setUserAnswers((prev) => ({ ...prev, [qIdx]: optKey }));
  };

  const handleSubmitTest = () => {
    if (!testData) return;
    let correctCount = 0;
    testData.questions.forEach((q, idx) => {
      if (userAnswers[idx] === q.correct_opt) {
        correctCount += 1;
      }
    });
    setScore(correctCount);
    setTestSubmitted(true);
    confetti({ particleCount: 90, spread: 60, origin: { y: 0.6 } });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                if (activeModule) {
                  setActiveModule(null);
                } else {
                  navigate('/dashboard');
                }
              }}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt="NEX"
                className="h-10 w-10 object-contain rounded-xl shadow-sm border border-slate-200/80 shrink-0"
              />
              <div>
                <h1 className="text-base font-black text-slate-900">
                  Current Affairs & General Awareness
                </h1>
                <p className="text-[11px] text-slate-500 font-medium">
                  High-Yield News Study Cards + Shuffled MCQ Retention Drill
                </p>
              </div>
            </div>
          </div>

          <Link to="/dashboard">
            <Button variant="outline" className="text-xs border-slate-200 rounded-xl h-9">
              Back to Daily Rail
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* VIEW 1: MODULES DIRECTORY */}
        {!activeModule && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider bg-emerald-100/70 px-3 py-0.5 rounded-full border border-emerald-200">
                  Daily & Monthly Affairs
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Study the News, Then Beat the Shuffled Trap Test
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
                  Every card below is a curated current affairs lesson. Read the news summary notes, and immediately attend the active test with mingled options.
                </p>
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm text-center shrink-0">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Active Modules</span>
                <strong className="text-xl font-black text-emerald-700">{modules.length} Lessons</strong>
              </div>
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {loading ? (
                <div className="col-span-full p-12 text-center text-slate-500 flex items-center justify-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
                  <span>Loading current affairs modules...</span>
                </div>
              ) : modules.length === 0 ? (
                <div className="col-span-full p-12 text-center text-slate-500 text-xs bg-white rounded-3xl border border-slate-200">
                  No current affairs modules uploaded yet. Check back soon.
                </div>
              ) : (
                modules.map((m) => (
                  <Card
                    key={m.id}
                    className="border-2 border-slate-200 hover:border-emerald-500 bg-white shadow-sm rounded-3xl p-6 flex flex-col justify-between transition-all"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 font-bold text-xs">
                          {m.published_date}
                        </Badge>
                        <Badge variant="outline" className="border-slate-300 text-slate-700 text-[11px] font-bold">
                          {m.question_count} MCQs
                        </Badge>
                      </div>

                      <h3 className="text-base font-black text-slate-900 leading-snug line-clamp-2">
                        {m.title}
                      </h3>

                      <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                        {m.summary_notes}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-slate-100 mt-4">
                      <Button
                        onClick={() => handleStartStudy(m)}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl h-10 gap-2 shadow-sm"
                      >
                        <BookOpen className="h-4 w-4" />
                        <span>Study Module & Take Test</span>
                      </Button>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}

        {/* VIEW 2: ACTIVE STUDY MODE */}
        {activeModule && mode === 'study' && (
          <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-200">
            <Card className="border-slate-200 bg-white shadow-sm rounded-3xl overflow-hidden">
              <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <div>
                  <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 font-bold text-xs mb-1">
                    Lesson Study Mode • {activeModule.published_date}
                  </Badge>
                  <h2 className="text-xl font-black text-slate-900">{activeModule.title}</h2>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveModule(null)}
                  className="border-slate-300 text-xs rounded-xl"
                >
                  Exit Lesson
                </Button>
              </div>

              <CardContent className="p-6 space-y-6">
                <div className="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-200 text-emerald-950 text-sm leading-relaxed whitespace-pre-line font-medium">
                  {activeModule.summary_notes}
                </div>

                <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-blue-900">Ready to test your retention?</h4>
                    <p className="text-[11px] text-blue-700">
                      Questions and options will be mingled to verify your genuine recall.
                    </p>
                  </div>

                  <Button
                    onClick={handleStartShuffledTest}
                    disabled={loadingTest}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl h-10 px-5 gap-2 shadow-sm"
                  >
                    {loadingTest ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Shuffling Questions...
                      </>
                    ) : (
                      <>
                        <span>Attend Shuffled MCQ Test</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* VIEW 3: ACTIVE TEST MODE (MINGLED QUESTIONS & OPTIONS) */}
        {activeModule && mode === 'test' && testData && (
          <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-200">
            {/* Top Score Banner if Submitted */}
            {testSubmitted && (
              <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-6 w-6 text-amber-300" />
                    <h3 className="text-lg font-black">Retention Test Completed!</h3>
                  </div>
                  <Badge className="bg-white text-emerald-800 font-black text-sm px-3 py-1">
                    Score: {score} / {testData.questions.length}
                  </Badge>
                </div>
                <p className="text-xs text-emerald-100">
                  {score === testData.questions.length
                    ? 'Flawless recall! You have completely mastered this news bulletin.'
                    : 'Great practice session! Review the explanations below to seal your weak spots.'}
                </p>
              </div>
            )}

            <div className="flex items-center justify-between bg-white px-6 py-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-bold text-slate-700">
                {testData.title} • {testData.questions.length} Shuffled Questions
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMode('study')}
                className="text-xs border-slate-300 rounded-xl"
              >
                Review News Notes
              </Button>
            </div>

            {/* Questions List */}
            <div className="space-y-4">
              {testData.questions.map((q, idx) => (
                <Card key={idx} className="border-slate-200 bg-white shadow-sm rounded-2xl overflow-hidden">
                  <div className="p-5 space-y-3">
                    <div className="flex items-start gap-3">
                      <span className="h-7 w-7 rounded-lg bg-emerald-50 text-emerald-700 font-bold text-xs flex items-center justify-center shrink-0 border border-emerald-200">
                        {idx + 1}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 leading-snug">
                        {q.question_text}
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                      {[
                        { key: 'A', text: q.opt_a },
                        { key: 'B', text: q.opt_b },
                        { key: 'C', text: q.opt_c },
                        { key: 'D', text: q.opt_d },
                      ].map((opt) => {
                        const isSelected = userAnswers[idx] === opt.key;
                        const isCorrect = testSubmitted && q.correct_opt === opt.key;
                        const isWrongSelection = testSubmitted && isSelected && q.correct_opt !== opt.key;

                        let style = 'border-slate-200 bg-slate-50/70 hover:bg-slate-100 text-slate-800';
                        if (isSelected && !testSubmitted) {
                          style = 'border-emerald-600 bg-emerald-50 font-bold text-emerald-950 shadow-sm';
                        } else if (isCorrect) {
                          style = 'border-emerald-600 bg-emerald-100 font-bold text-emerald-950 ring-2 ring-emerald-500/20';
                        } else if (isWrongSelection) {
                          style = 'border-rose-400 bg-rose-50 text-rose-950 font-bold';
                        }

                        return (
                          <div
                            key={opt.key}
                            onClick={() => handleSelectOption(idx, opt.key)}
                            className={`p-3 rounded-xl border flex items-center gap-2 cursor-pointer transition ${style}`}
                          >
                            <span className="h-6 w-6 rounded-lg bg-white font-bold text-xs flex items-center justify-center border border-slate-200 shrink-0">
                              {opt.key}
                            </span>
                            <span className="flex-1">{opt.text}</span>
                          </div>
                        );
                      })}
                    </div>

                    {testSubmitted && q.explanation && (
                      <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200 text-xs text-blue-900 mt-2">
                        <strong className="font-bold">Fact Breakdown: </strong>
                        {q.explanation}
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>

            {/* Submit Action */}
            {!testSubmitted && (
              <div className="flex justify-end pt-2">
                <Button
                  onClick={handleSubmitTest}
                  disabled={Object.keys(userAnswers).length === 0}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-8 h-12 rounded-xl shadow-lg shadow-emerald-600/20"
                >
                  Submit Current Affairs Test
                </Button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};
