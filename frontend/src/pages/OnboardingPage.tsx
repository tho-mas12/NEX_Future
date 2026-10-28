import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Target, CheckCircle2, ArrowRight, Award, Calendar, Sparkles, Compass } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { apiRequest } from '@/lib/api';
import { useAuthStore, type TargetExam } from '@/store/useAuthStore';

interface DiagnosticQuestion {
  id: string;
  subject: string;
  question_text: string;
  opt_a: string;
  opt_b: string;
  opt_c: string;
  opt_d: string;
  correct_opt: string;
  explanation?: string;
}

const FALLBACK_QUESTIONS: DiagnosticQuestion[] = [
  {
    id: "fb-1",
    subject: "Quant",
    question_text: "If A's income is 25% more than B's income, then by what percentage is B's income less than A's income?",
    opt_a: "20%",
    opt_b: "25%",
    opt_c: "16.66%",
    opt_d: "33.33%",
    correct_opt: "A",
    explanation: "Let B = 100. Then A = 125. Difference = 25. Percentage less = (25 / 125) * 100 = 20%."
  },
  {
    id: "fb-2",
    subject: "Reasoning",
    question_text: "In a certain code language, TEACHER is written as VGCEJGT. How is CHILDREN written in that code?",
    opt_a: "EJKNFTGP",
    opt_b: "EJKNFGTO",
    opt_c: "EJKNFTGO",
    opt_d: "EJKNFUTP",
    correct_opt: "A",
    explanation: "Each letter is shifted forward by +2."
  },
  {
    id: "fb-3",
    subject: "English",
    question_text: "Choose the correct preposition: 'The candidate was accused ____ malpractice by the invigilator.'",
    opt_a: "with",
    opt_b: "of",
    opt_c: "for",
    opt_d: "in",
    correct_opt: "B",
    explanation: "'Accused' takes the fixed preposition 'of'."
  },
  {
    id: "fb-4",
    subject: "General Studies",
    question_text: "Under which Article of the Constitution of India is the Right to Equality guaranteed?",
    opt_a: "Articles 14 - 18",
    opt_b: "Articles 19 - 22",
    opt_c: "Articles 23 - 24",
    opt_d: "Articles 25 - 28",
    correct_opt: "A",
    explanation: "Articles 14 to 18 guarantee the Right to Equality."
  },
  {
    id: "fb-5",
    subject: "Quant",
    question_text: "A train 180 meters long is running at 72 km/h. How much time will it take to pass a telegraph post?",
    opt_a: "9 seconds",
    opt_b: "10 seconds",
    opt_c: "12 seconds",
    opt_d: "15 seconds",
    correct_opt: "A",
    explanation: "Speed in m/s = 72 * (5/18) = 20 m/s. Time = Distance / Speed = 180 / 20 = 9 seconds."
  }
];

export const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const { updateUser } = useAuthStore();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedExam, setSelectedExam] = useState<TargetExam>('CGL');
  const [examMonth, setExamMonth] = useState('October 2026');

  // Diagnostic state initialized with reliable fallback questions
  const [questions, setQuestions] = useState<DiagnosticQuestion[]>(FALLBACK_QUESTIONS);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [error, setError] = useState<string | null>(null);

  // Generation state
  const [generationPhase, setGenerationPhase] = useState(0);

  // Fetch diagnostic questions on mount
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const data = await apiRequest<DiagnosticQuestion[]>('/onboarding/diagnostic');
        if (data && data.length > 0) {
          setQuestions(data);
        }
      } catch (err: any) {
        console.warn('Using baseline diagnostic questions:', err.message);
        setError(null);
      }
    };
    fetchQuestions();
  }, []);

  const handleSelectOption = (option: string) => {
    setUserAnswers((prev) => ({
      ...prev,
      [currentQIndex]: option,
    }));
  };

  const handleNextQuestion = () => {
    if (currentQIndex < questions.length - 1) {
      setCurrentQIndex((prev) => prev + 1);
    } else {
      triggerRoadmapGeneration();
    }
  };

  const triggerRoadmapGeneration = async () => {
    setStep(3);

    let score = 0;
    questions.forEach((q, idx) => {
      if (userAnswers[idx] === q.correct_opt) {
        score += 1;
      }
    });

    setTimeout(() => setGenerationPhase(1), 700);
    setTimeout(() => setGenerationPhase(2), 1400);
    setTimeout(() => setGenerationPhase(3), 2100);

    try {
      await apiRequest('/onboarding/complete', {
        method: 'POST',
        body: JSON.stringify({
          target_exam: selectedExam,
          exam_date: examMonth,
          diagnostic_score: score,
        }),
      });

      updateUser({
        target_exam: selectedExam,
        exam_date: examMonth,
        onboarding_completed: true,
      });

      setTimeout(() => {
        navigate('/dashboard');
      }, 2600);
    } catch {
      updateUser({
        target_exam: selectedExam,
        exam_date: examMonth,
        onboarding_completed: true,
      });
      setTimeout(() => {
        navigate('/dashboard');
      }, 2600);
    }
  };

  const progressPercentage = step === 1 ? 33 : step === 2 ? 33 + ((currentQIndex + 1) / (questions.length || 1)) * 34 : 100;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between p-4 sm:p-8 font-sans">
      {/* Top Header & Step Indicator */}
      <div className="max-w-3xl mx-auto w-full pt-4">
        <div className="flex items-center justify-between mb-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="NEX"
              className="h-11 w-11 object-contain rounded-xl shadow-sm border border-slate-200/80 shrink-0"
            />
            <div>
              <span className="font-black text-slate-900 text-base tracking-tight">NEX Setup Wizard</span>
              <p className="text-[11px] text-slate-500 font-medium">Personalized 180-Day Rail Configuration</p>
            </div>
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full">
            Step {step} of 3
          </span>
        </div>
        <Progress value={progressPercentage} className="h-2 bg-slate-200 [&>div]:bg-blue-600 rounded-full" />
      </div>

      {/* Main Content Area */}
      <div className="max-w-3xl mx-auto w-full my-auto py-8">
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
            {error}
          </div>
        )}

        {/* STEP 1: TARGET EXAM SELECTION */}
        {step === 1 && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div className="text-center space-y-2">
              <Badge variant="outline" className="px-3 py-1 text-xs border-blue-300 text-blue-700 bg-blue-50 font-bold">
                Target Selection
              </Badge>
              <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight font-display">
                Which exam are you targeting?
              </h1>
              <p className="text-sm text-slate-600 max-w-md mx-auto">
                NEX configures your 180-day rail and topic weightage specifically for your exam standard.
              </p>
            </div>

            {/* Target Exam Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* SSC CGL Option */}
              <div
                onClick={() => setSelectedExam('CGL')}
                className={`cursor-pointer rounded-2xl p-6 border-2 transition-all duration-200 relative bg-white shadow-sm ${
                  selectedExam === 'CGL'
                    ? 'border-blue-600 bg-blue-50/40 ring-4 ring-blue-600/10'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                }`}
              >
                {selectedExam === 'CGL' && (
                  <div className="absolute top-4 right-4 h-6 w-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                    ✓
                  </div>
                )}
                <div className="h-12 w-12 rounded-xl bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700 mb-4 font-bold">
                  <Target className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-black text-slate-900">SSC CGL</h3>
                <p className="text-xs text-blue-700 font-bold mt-0.5">Combined Graduate Level</p>
                <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                  Inspector, ASO, Tax Assistant, Auditor. Higher weightage on advanced Quant, Arithmetic, and comprehensive English.
                </p>
              </div>

              {/* SSC CHSL Option */}
              <div
                onClick={() => setSelectedExam('CHSL')}
                className={`cursor-pointer rounded-2xl p-6 border-2 transition-all duration-200 relative bg-white shadow-sm ${
                  selectedExam === 'CHSL'
                    ? 'border-orange-500 bg-orange-50/40 ring-4 ring-orange-500/10'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                }`}
              >
                {selectedExam === 'CHSL' && (
                  <div className="absolute top-4 right-4 h-6 w-6 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                    ✓
                  </div>
                )}
                <div className="h-12 w-12 rounded-xl bg-orange-100 border border-orange-200 flex items-center justify-center text-orange-700 mb-4 font-bold">
                  <Award className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-black text-slate-900">SSC CHSL</h3>
                <p className="text-xs text-orange-700 font-bold mt-0.5">Combined Higher Secondary Level</p>
                <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                  LDC, JSA, Data Entry Operator. Focused on speed arithmetic, grammar precision, and reasoning agility.
                </p>
              </div>
            </div>

            {/* Expected Exam Date Dropdown */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Target Exam Window</h4>
                  <p className="text-xs text-slate-500">Estimated exam session for 180-day countdown</p>
                </div>
              </div>
              <select
                value={examMonth}
                onChange={(e) => setExamMonth(e.target.value)}
                className="bg-slate-50 border border-slate-300 text-slate-900 text-xs font-semibold rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="October 2026">October 2026</option>
                <option value="December 2026">December 2026</option>
                <option value="March 2027">March 2027</option>
                <option value="July 2027">July 2027</option>
              </select>
            </div>

            <div className="space-y-2 pt-2">
              <Button
                size="lg"
                onClick={() => setStep(2)}
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-600/20 gap-2 rounded-xl"
              >
                Continue to Diagnostic Assessment
                <ArrowRight className="h-4 w-4" />
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={triggerRoadmapGeneration}
                className="w-full h-11 border-slate-300 text-slate-700 hover:text-slate-900 font-bold text-xs rounded-xl hover:bg-slate-50 transition"
              >
                Skip Assessment & Enter 180-Day Rail Directly →
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: DIAGNOSTIC TEST */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white px-5 py-3 rounded-2xl border border-slate-200 shadow-sm gap-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700 font-bold text-xs">
                  {questions[currentQIndex]?.subject || 'Assessment'}
                </Badge>
                <span className="text-xs font-bold text-slate-600">
                  Question {currentQIndex + 1} of {questions.length}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={triggerRoadmapGeneration}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 transition underline underline-offset-2"
                >
                  Skip All Questions & Register Directly →
                </button>
                <span className="text-xs font-semibold text-slate-500 hidden sm:flex items-center gap-1.5 border-l border-slate-200 pl-3">
                  <Compass className="h-3.5 w-3.5 text-blue-600" />
                  Baseline Test
                </span>
              </div>
            </div>

            <Card className="border-slate-200 bg-white shadow-sm rounded-2xl overflow-hidden">
              <CardHeader className="pb-4 bg-slate-50/50 border-b border-slate-100">
                <CardTitle className="text-base sm:text-lg font-bold text-slate-900 leading-relaxed font-sans">
                  {questions[currentQIndex]?.question_text}
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-3 pt-5">
                {[
                  { key: 'A', text: questions[currentQIndex]?.opt_a },
                  { key: 'B', text: questions[currentQIndex]?.opt_b },
                  { key: 'C', text: questions[currentQIndex]?.opt_c },
                  { key: 'D', text: questions[currentQIndex]?.opt_d },
                ].map((opt) => {
                  const isSelected = userAnswers[currentQIndex] === opt.key;
                  return (
                    <div
                      key={opt.key}
                      onClick={() => handleSelectOption(opt.key)}
                      className={`cursor-pointer flex items-center gap-3 p-4 rounded-xl border text-sm transition-all ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50 text-blue-950 font-bold shadow-sm'
                          : 'border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-800'
                      }`}
                    >
                      <div
                        className={`h-7 w-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                          isSelected
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {opt.key}
                      </div>
                      <span className="flex-1">{opt.text}</span>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <div className="flex items-center justify-between pt-2">
              <Button
                variant="outline"
                disabled={currentQIndex === 0}
                onClick={() => setCurrentQIndex((prev) => prev - 1)}
                className="border-slate-200 text-slate-700 rounded-xl"
              >
                Previous
              </Button>

              <Button
                type="button"
                variant="ghost"
                onClick={triggerRoadmapGeneration}
                className="text-xs font-bold text-slate-500 hover:text-slate-900"
              >
                Skip Assessment
              </Button>

              <Button
                onClick={handleNextQuestion}
                disabled={!userAnswers[currentQIndex]}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 gap-2 rounded-xl shadow-sm"
              >
                {currentQIndex === questions.length - 1 ? (
                  <>
                    Finish & Build Roadmap
                    <Sparkles className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    Next Question
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: ROADMAP GENERATION ANIMATION */}
        {step === 3 && (
          <div className="flex flex-col items-center justify-center text-center py-12 space-y-6 animate-in zoom-in-95 duration-500 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <div className="relative">
              <div className="h-20 w-20 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center text-blue-600 font-bold text-xl">
                ⚡
              </div>
            </div>

            <div className="space-y-2 max-w-md">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                Generating your personalized 180-day roadmap...
              </h2>
              <p className="text-xs text-slate-600">
                Synthesizing syllabus milestones and populating your daily rail for SSC {selectedExam}.
              </p>
            </div>

            {/* Checklist items ticking off */}
            <div className="w-full max-w-sm space-y-3 text-left text-xs bg-slate-50 border border-slate-200 p-5 rounded-2xl">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className={`h-4 w-4 ${generationPhase >= 1 ? 'text-emerald-600' : 'text-slate-300'}`} />
                <span className={generationPhase >= 1 ? 'text-slate-900 font-bold' : 'text-slate-500'}>
                  Mapping 180 syllabus modules for {selectedExam}...
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className={`h-4 w-4 ${generationPhase >= 2 ? 'text-emerald-600' : 'text-slate-300'}`} />
                <span className={generationPhase >= 2 ? 'text-slate-900 font-bold' : 'text-slate-500'}>
                  Balancing Quant, English, Reasoning & GA weightage...
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className={`h-4 w-4 ${generationPhase >= 3 ? 'text-emerald-600' : 'text-slate-300'}`} />
                <span className={generationPhase >= 3 ? 'text-slate-900 font-bold' : 'text-slate-500'}>
                  Injecting Day-7 weekend mock arena checkpoints...
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer minimal info */}
      <div className="text-center text-xs text-slate-500">
        NEX Guided Rail Architecture • Step {step} of 3
      </div>
    </div>
  );
};
