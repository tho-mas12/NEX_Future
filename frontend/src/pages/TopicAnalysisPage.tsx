import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2, ChevronDown, ChevronRight,
  Clock, Sparkles, Trophy, Play, ArrowLeft, Check, X,
  ShieldAlert, Layers
} from 'lucide-react';
import { apiRequest } from '@/lib/api';
import confetti from 'canvas-confetti';

interface LessonStatusItem {
  id: string;
  title: string;
  day_sequence: number;
  completed: boolean;
  revision_stage?: number;
  mastered: boolean;
}

interface TopicGroup {
  id: string;
  subject: string;
  stage: number;
  title: string;
  total_lessons: number;
  completed_lessons: number;
  completion_percentage: number;
  lessons: LessonStatusItem[];
}

interface DynamicQuestion {
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

interface DynamicMockData {
  subject: string;
  topics_covered: string[];
  mock_timer_mins: number;
  total_questions: number;
  questions: DynamicQuestion[];
}

export const TopicAnalysisPage: React.FC = () => {
  const navigate = useNavigate();
  const [topics, setTopics] = useState<TopicGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState<string>('ALL');
  const [expandedTopics, setExpandedTopics] = useState<Record<string, boolean>>({});

  // Dynamic Mock State
  const [generatingMock, setGeneratingMock] = useState(false);
  const [mockData, setMockData] = useState<DynamicMockData | null>(null);
  const [mockActive, setMockActive] = useState(false);
  const [mockTimer, setMockTimer] = useState(15 * 60);
  const [mockAnswers, setMockAnswers] = useState<Record<string, string>>({});
  const [mockSubmitted, setMockSubmitted] = useState(false);
  const [mockScore, setMockScore] = useState<any>(null);

  useEffect(() => {
    fetchTopics();
  }, []);

  const fetchTopics = async () => {
    try {
      setLoading(true);
      const res = await apiRequest<TopicGroup[]>('/analysis/topics');
      setTopics(res);
      // Expand first 2 topics by default
      if (res.length > 0) {
        setExpandedTopics({
          [res[0].id]: true,
          [res[1]?.id]: true
        });
      }
    } catch (err) {
      console.error('Failed to load topic analysis', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (topicId: string) => {
    setExpandedTopics(prev => ({
      ...prev,
      [topicId]: !prev[topicId]
    }));
  };

  const handleGenerateMock = async (subject: string, topicId?: string) => {
    try {
      setGeneratingMock(true);
      const res = await apiRequest<DynamicMockData>('/analysis/generate-mock', {
        method: 'POST',
        body: JSON.stringify({
          subject,
          topic_id: topicId || null,
        }),
      });
      setMockData(res);
      setMockTimer((res.mock_timer_mins || 15) * 60);
      setMockAnswers({});
      setMockSubmitted(false);
      setMockScore(null);
      setMockActive(true);
    } catch (err) {
      console.error('Failed to generate dynamic mock', err);
    } finally {
      setGeneratingMock(false);
    }
  };

  // Timer countdown for Dynamic Mock
  useEffect(() => {
    if (!mockActive || mockSubmitted) return;
    if (mockTimer <= 0) {
      handleSubmitMock();
      return;
    }
    const interval = setInterval(() => {
      setMockTimer(prev => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [mockActive, mockSubmitted, mockTimer]);

  const handleSubmitMock = () => {
    if (!mockData || mockSubmitted) return;
    let correct = 0;
    let incorrect = 0;
    let unattempted = 0;

    mockData.questions.forEach(q => {
      const selected = mockAnswers[q.id];
      if (!selected) {
        unattempted++;
      } else if (selected.toLowerCase() === q.correct_opt.toLowerCase()) {
        correct++;
      } else {
        incorrect++;
      }
    });

    const totalQ = mockData.questions.length;
    const netMarks = Number((correct * 2.0 - incorrect * 0.5).toFixed(2));
    const maxMarks = totalQ * 2;
    const pct = Math.round((correct / totalQ) * 100);

    setMockScore({
      totalQ,
      correct,
      incorrect,
      unattempted,
      netMarks,
      maxMarks,
      pct
    });
    setMockSubmitted(true);
    confetti({ particleCount: 90, spread: 60 });
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const subjects = ['ALL', 'Quantitative Aptitude', 'English', 'Reasoning', 'General Studies'];

  const filteredTopics = selectedSubject === 'ALL'
    ? topics
    : topics.filter(t => t.subject.toLowerCase() === selectedSubject.toLowerCase());

  const totalLessons = topics.reduce((acc, t) => acc + t.total_lessons, 0);
  const totalCompleted = topics.reduce((acc, t) => acc + t.completed_lessons, 0);
  const overallCoverage = totalLessons > 0 ? Math.round((totalCompleted / totalLessons) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="border-b border-slate-200 bg-white/95 backdrop-blur sticky top-0 z-40 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-600" />
              Syllabus
            </h1>
            <p className="text-xs text-slate-500">
              Comprehensive breakdown of all stages, subjects, and mastered lessons across the 180-day trajectory.
            </p>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        {/* Coverage Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Syllabus Covered</p>
              <h3 className="text-2xl font-black text-slate-900">{overallCoverage}%</h3>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Mastered Lessons</p>
              <h3 className="text-2xl font-black text-slate-900">{totalCompleted} / {totalLessons}</h3>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Sectional Format</p>
              <h3 className="text-xl font-black text-amber-700">25 Qs / 15 Mins</h3>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Spaced Retention Gate</p>
              <h3 className="text-xl font-black text-rose-700">80% Pass Cutoff</h3>
            </div>
          </div>
        </div>

        {/* Subject Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {subjects.map(s => (
            <button
              key={s}
              onClick={() => setSelectedSubject(s)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                selectedSubject === s
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Topic Grid */}
        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm">Analyzing syllabus telemetry...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTopics.map(topic => {
              const isExpanded = !!expandedTopics[topic.id];
              return (
                <div
                  key={topic.id}
                  className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm transition"
                >
                  {/* Topic Card Header */}
                  <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div
                      onClick={() => toggleExpand(topic.id)}
                      className="flex items-start md:items-center gap-3 cursor-pointer flex-1"
                    >
                      <button className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:text-slate-900 transition">
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                            {topic.subject}
                          </span>
                          <span className="text-xs text-slate-500 font-medium">Stage {topic.stage}</span>
                        </div>
                        <h3 className="text-base font-bold text-slate-900 mt-1">{topic.title}</h3>
                      </div>
                    </div>

                    {/* Progress Bar & Actions */}
                    <div className="flex items-center gap-4 shrink-0">
                      <div className="w-36 flex flex-col gap-1">
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span className="font-semibold">Progress</span>
                          <span className="font-bold text-slate-900">{topic.completion_percentage}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2">
                          <div
                            className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${topic.completion_percentage}%` }}
                          />
                        </div>
                      </div>

                      <button
                        onClick={() => handleGenerateMock(topic.subject, topic.id)}
                        disabled={generatingMock}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-600 border border-blue-200 text-blue-700 hover:text-white text-xs font-bold transition shadow-sm"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span>Dynamic AI Mock</span>
                      </button>
                    </div>
                  </div>

                  {/* Expanded Lessons Drill-Down */}
                  {isExpanded && (
                    <div className="border-t border-slate-100 bg-slate-50/50 p-4 divide-y divide-slate-100">
                      {topic.lessons.map(lesson => (
                        <div
                          key={lesson.id}
                          className="py-3 px-2 flex items-center justify-between hover:bg-white rounded-xl transition"
                        >
                          <div className="flex items-center gap-3">
                            {lesson.completed ? (
                              <div className="w-6 h-6 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-700">
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                              </div>
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center text-slate-600 text-xs font-bold">
                                {lesson.day_sequence}
                              </div>
                            )}
                            <div>
                              <p className={`text-xs md:text-sm font-semibold ${lesson.completed ? 'text-slate-900' : 'text-slate-700'}`}>
                                {lesson.title}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] text-slate-400">Day Sequence #{lesson.day_sequence}</span>
                                {lesson.revision_stage && (
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
                                    Rev Day +{lesson.revision_stage}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => navigate(`/study/${lesson.id}`)}
                              className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 text-xs font-bold transition flex items-center gap-1.5"
                            >
                              <Play className="w-3 h-3 text-blue-600 fill-blue-600" />
                              <span>{lesson.completed ? 'Revise' : 'Study'}</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* DYNAMIC AI MOCK TEST MODAL */}
      {mockActive && mockData && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    Dynamic AI Mock: {mockData.subject}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Topics covered: {mockData.topics_covered.join(', ')}
                  </p>
                </div>
              </div>

              {!mockSubmitted && (
                <div className="flex items-center gap-4">
                  <div className={`flex items-center gap-2 px-3 py-1 rounded-xl font-mono text-sm font-bold border ${
                    mockTimer <= 180 ? 'bg-rose-50 border-rose-300 text-rose-700 animate-pulse' : 'bg-amber-50 border-amber-300 text-amber-800'
                  }`}>
                    <Clock className="w-4 h-4" />
                    <span>{formatTimer(mockTimer)}</span>
                  </div>

                  <button
                    onClick={handleSubmitMock}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow transition"
                  >
                    Finish Test
                  </button>
                </div>
              )}

              <button
                onClick={() => setMockActive(false)}
                className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Questions Body or Results */}
            <div className="flex-1 p-6 overflow-y-auto space-y-6">
              {!mockSubmitted ? (
                mockData.questions.map((q, idx) => (
                  <div key={q.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-500 font-mono">Q{idx + 1} of {mockData.questions.length}</span>
                      {mockAnswers[q.id] && (
                        <span className="text-xs text-emerald-700 font-bold">Option {mockAnswers[q.id].toUpperCase()} chosen</span>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-slate-900 mb-3">{q.question_text}</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {(['a', 'b', 'c', 'd'] as const).map(optKey => {
                        const isSelected = mockAnswers[q.id] === optKey;
                        return (
                          <button
                            key={optKey}
                            onClick={() => setMockAnswers(prev => ({ ...prev, [q.id]: optKey }))}
                            className={`p-3 rounded-xl border text-left text-xs flex items-center gap-3 transition ${
                              isSelected
                                ? 'border-blue-500 bg-blue-50 text-blue-950 font-bold'
                                : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                            }`}
                          >
                            <span className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold uppercase ${
                              isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {optKey}
                            </span>
                            <span>{q[`opt_${optKey}` as keyof DynamicQuestion]}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))
              ) : (
                /* Dynamic Mock Scorecard */
                <div className="space-y-6 animate-in zoom-in-95 duration-200">
                  <div className="text-center py-4">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto mb-3 text-emerald-600">
                      <Trophy className="w-7 h-7" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 mb-1">Dynamic Mock Scorecard</h2>
                    <p className="text-xs text-slate-500">Tier 1 Sectional Performance</p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center">
                      <span className="text-[10px] text-slate-500 uppercase font-bold">Net Score</span>
                      <p className="text-xl font-black text-emerald-700">{mockScore.netMarks} / {mockScore.maxMarks}</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center">
                      <span className="text-[10px] text-slate-500 uppercase font-bold">Accuracy</span>
                      <p className="text-xl font-black text-slate-900">{mockScore.pct}%</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center">
                      <span className="text-[10px] text-slate-500 uppercase font-bold">Correct / Wrong</span>
                      <p className="text-xl font-black text-blue-700">{mockScore.correct} / {mockScore.incorrect}</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center">
                      <span className="text-[10px] text-slate-500 uppercase font-bold">Unattempted</span>
                      <p className="text-xl font-black text-slate-400">{mockScore.unattempted}</p>
                    </div>
                  </div>

                  {/* Solutions Breakdown */}
                  <div className="space-y-3 pt-4 border-t border-slate-200">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">Question Solutions & Shortcuts</h4>
                    {mockData.questions.map((q, idx) => {
                      const userChoice = mockAnswers[q.id];
                      const isCorrect = userChoice?.toLowerCase() === q.correct_opt.toLowerCase();

                      return (
                        <div key={q.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-mono font-bold text-slate-500">Q{idx + 1}</span>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                              isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}>
                              {isCorrect ? 'Correct (+2.0)' : userChoice ? 'Incorrect (-0.5)' : 'Unattempted (0.0)'}
                            </span>
                          </div>
                          <p className="text-xs font-medium text-slate-800 mb-2">{q.question_text}</p>
                          <p className="text-xs text-emerald-700 font-bold mb-2">
                            Correct Answer: ({q.correct_opt.toUpperCase()}) {q[`opt_${q.correct_opt.toLowerCase()}` as keyof DynamicQuestion]}
                          </p>
                          {q.short_trick && (
                            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-xs font-mono font-semibold">
                              ⚡ Shortcut: {q.short_trick}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setMockActive(false)}
                className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
