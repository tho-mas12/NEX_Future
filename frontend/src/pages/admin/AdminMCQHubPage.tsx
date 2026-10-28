import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  CheckCircle2,
  Plus,
  Loader2,
  HelpCircle,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { apiRequest } from '@/lib/api';

interface LessonOption {
  id: string;
  title: string;
  topic_title: string;
  day_sequence: number;
}

interface QuestionTier {
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

interface LessonMCQResponse {
  lesson_id: string;
  total_mcqs: number;
  tiers: {
    easy_initial: QuestionTier[];
    medium_test: QuestionTier[];
    hard_revision: QuestionTier[];
  };
}

export const AdminMCQHubPage: React.FC = () => {
  const [selectedSubjectKey, setSelectedSubjectKey] = useState<string>('quant');
  const [lessons, setLessons] = useState<LessonOption[]>([]);
  const [selectedLessonId, setSelectedLessonId] = useState<string>('');
  const [loadingLessons, setLoadingLessons] = useState(false);

  // MCQs state
  const [mcqData, setMcqData] = useState<LessonMCQResponse | null>(null);
  const [loadingMcqs, setLoadingMcqs] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');

  // Manual MCQ form state
  const [showManualModal, setShowManualModal] = useState(false);
  const [qText, setQText] = useState('');
  const [optA, setOptA] = useState('');
  const [optB, setOptB] = useState('');
  const [optC, setOptC] = useState('');
  const [optD, setOptD] = useState('');
  const [correctOpt, setCorrectOpt] = useState('A');
  const [explanation, setExplanation] = useState('');
  const [savingManual, setSavingManual] = useState(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Fetch lessons when subject dropdown changes
  useEffect(() => {
    fetchLessonsForSubject(selectedSubjectKey);
  }, [selectedSubjectKey]);

  // Fetch MCQs when selected lesson changes
  useEffect(() => {
    if (selectedLessonId) {
      fetchLessonMCQs(selectedLessonId);
    }
  }, [selectedLessonId]);

  const fetchLessonsForSubject = async (subjectKey: string) => {
    setLoadingLessons(true);
    try {
      const res = await apiRequest<{ subject: string; lessons: LessonOption[] }>(`/admin/subjects/${subjectKey}/lessons`);
      setLessons(res.lessons);
      if (res.lessons.length > 0) {
        setSelectedLessonId(res.lessons[0].id);
      } else {
        setSelectedLessonId('');
        setMcqData(null);
      }
    } catch (err: any) {
      console.error('Error fetching lessons:', err);
    } finally {
      setLoadingLessons(false);
    }
  };

  const fetchLessonMCQs = async (lessonId: string) => {
    setLoadingMcqs(true);
    try {
      const res = await apiRequest<LessonMCQResponse>(`/admin/lessons/${lessonId}/mcqs`);
      setMcqData(res);
    } catch (err: any) {
      console.error('Error fetching lesson MCQs:', err);
    } finally {
      setLoadingMcqs(false);
    }
  };

  const handleGenerateAIMCQs = async () => {
    if (!selectedLessonId) return;
    setGeneratingAI(true);
    setSuccessBanner(null);
    try {
      const res = await apiRequest<{ success: boolean; created_count: number }>(
        `/admin/lessons/${selectedLessonId}/generate-ai-mcqs`,
        { method: 'POST' }
      );
      setSuccessBanner(`AI Successfully generated ${res.created_count} MCQs across Easy, Medium, and Hard tiers!`);
      fetchLessonMCQs(selectedLessonId);
      setTimeout(() => setSuccessBanner(null), 3500);
    } catch (err: any) {
      alert(err.message || 'Error generating AI questions');
    } finally {
      setGeneratingAI(false);
    }
  };

  const handleAddManualMCQ = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLessonId || !qText.trim()) return;
    setSavingManual(true);
    try {
      await apiRequest(`/admin/lessons/${selectedLessonId}/mcqs`, {
        method: 'POST',
        body: JSON.stringify({
          question_text: qText.trim(),
          opt_a: optA.trim(),
          opt_b: optB.trim(),
          opt_c: optC.trim(),
          opt_d: optD.trim(),
          correct_opt: correctOpt,
          explanation: explanation.trim(),
        }),
      });

      setSuccessBanner('Manual MCQ registered successfully!');
      setShowManualModal(false);
      setQText('');
      setOptA('');
      setOptB('');
      setOptC('');
      setOptD('');
      setExplanation('');
      fetchLessonMCQs(selectedLessonId);
      setTimeout(() => setSuccessBanner(null), 3500);
    } catch (err: any) {
      alert(err.message || 'Error adding MCQ');
    } finally {
      setSavingManual(false);
    }
  };

  const selectedLessonObj = lessons.find((l) => l.id === selectedLessonId);

  const easyList = mcqData?.tiers.easy_initial || [];
  const mediumList = mcqData?.tiers.medium_test || [];
  const hardList = mcqData?.tiers.hard_revision || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold mb-2">
            <Sparkles className="h-3.5 w-3.5" />
            Adaptive 3-Tier Question Hub
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">MCQ Setup & AI Generator</h1>
          <p className="text-xs text-slate-600 mt-1">
            Generate and inspect MCQs calibrated for Initial Learning (Easy), Daily Test (Medium), and Spaced Revision (Hard).
          </p>
        </div>

        {selectedLessonId && (
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setShowManualModal(true)}
              variant="outline"
              className="border-slate-300 text-slate-700 font-bold text-xs rounded-xl h-10 gap-1.5"
            >
              <Plus className="h-4 w-4" />
              <span>Add Manual MCQ</span>
            </Button>

            <Button
              onClick={handleGenerateAIMCQs}
              disabled={generatingAI}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl h-10 gap-1.5 shadow-md shadow-blue-600/20"
            >
              {generatingAI ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating AI MCQs...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 text-amber-300" />
                  <span>AI Generate 3-Tier MCQs</span>
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {successBanner && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 shadow-sm">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{successBanner}</span>
        </div>
      )}

      {/* FILTER & SELECTOR CONTROLS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Subject Dropdown */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
            1. Select Subject Stream
          </label>
          <select
            value={selectedSubjectKey}
            onChange={(e) => setSelectedSubjectKey(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs font-semibold rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
          >
            <option value="quant">Quantitative Aptitude</option>
            <option value="reasoning">General Intelligence & Reasoning</option>
            <option value="english">English Comprehension</option>
            <option value="ga">General Awareness</option>
          </select>
          <span className="text-[11px] text-slate-500 block">
            {lessons.length} lessons registered in this subject
          </span>
        </div>

        {/* Lesson Dropdown */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
            2. Select Lesson to Manage MCQs
          </label>
          <select
            value={selectedLessonId}
            onChange={(e) => setSelectedLessonId(e.target.value)}
            disabled={loadingLessons || lessons.length === 0}
            className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs font-semibold rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
          >
            {lessons.length === 0 ? (
              <option value="">No lessons registered under this subject</option>
            ) : (
              lessons.map((l, i) => (
                <option key={l.id} value={l.id}>
                  #{i + 1} - {l.title} {l.day_sequence > 0 ? `(Day ${l.day_sequence})` : '(Unassigned Day)'}
                </option>
              ))
            )}
          </select>
          <span className="text-[11px] text-slate-500 block">
            {mcqData ? `${mcqData.total_mcqs} Total Questions Active` : 'Select a lesson'}
          </span>
        </div>
      </div>

      {/* 3-TIER DIFFICULTY TABS */}
      {selectedLessonObj && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 overflow-x-auto bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
            {[
              { key: 'all', label: `All MCQs (${mcqData?.total_mcqs || 0})` },
              { key: 'easy', label: `Easy - Initial Learning (${easyList.length})` },
              { key: 'medium', label: `Medium - Daily Test (${mediumList.length})` },
              { key: 'hard', label: `Hard - Spaced Revision (${hardList.length})` },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  activeTab === tab.key
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* QUESTIONS LIST */}
          <div className="space-y-3">
            {loadingMcqs ? (
              <div className="p-12 text-center text-slate-500 flex items-center justify-center gap-2 bg-white rounded-3xl border border-slate-200">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                <span>Loading lesson question bank...</span>
              </div>
            ) : mcqData?.total_mcqs === 0 ? (
              <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
                <HelpCircle className="h-10 w-10 text-slate-300 mx-auto" />
                <h3 className="text-base font-bold text-slate-900">No Questions Configured Yet</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Click <strong>"AI Generate 3-Tier MCQs"</strong> above to auto-generate questions from the lesson notes or add manual MCQs.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {(activeTab === 'all'
                  ? [...easyList, ...mediumList, ...hardList]
                  : activeTab === 'easy'
                  ? easyList
                  : activeTab === 'medium'
                  ? mediumList
                  : hardList
                ).map((q, idx) => (
                  <Card key={q.id || idx} className="border-slate-200 bg-white shadow-sm rounded-2xl overflow-hidden">
                    <div className="p-5 space-y-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <span className="h-7 w-7 rounded-lg bg-blue-50 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0 border border-blue-200">
                            Q{idx + 1}
                          </span>
                          <h4 className="text-sm font-bold text-slate-900 leading-snug">
                            {q.question_text}
                          </h4>
                        </div>
                        <Badge className="text-[10px] bg-emerald-50 text-emerald-800 border-emerald-200 font-bold shrink-0">
                          Correct: Option {q.correct_opt}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                        {[
                          { key: 'A', text: q.opt_a },
                          { key: 'B', text: q.opt_b },
                          { key: 'C', text: q.opt_c },
                          { key: 'D', text: q.opt_d },
                        ].map((opt) => (
                          <div
                            key={opt.key}
                            className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                              q.correct_opt === opt.key
                                ? 'border-emerald-500 bg-emerald-50 font-bold text-emerald-950'
                                : 'border-slate-200 bg-slate-50/60 text-slate-700'
                            }`}
                          >
                            <span className="h-5 w-5 rounded bg-white font-bold text-[10px] flex items-center justify-center border border-slate-200 shrink-0">
                              {opt.key}
                            </span>
                            <span>{opt.text}</span>
                          </div>
                        ))}
                      </div>

                      {q.explanation && (
                        <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100 text-[11px] text-blue-900">
                          <strong className="font-bold">Shortcut Explanation: </strong>
                          {q.explanation}
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: ADD MANUAL MCQ */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-xl p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900">
              Add Manual MCQ to Lesson
            </h3>

            <form onSubmit={handleAddManualMCQ} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Question Text *</label>
                <textarea
                  rows={2}
                  value={qText}
                  onChange={(e) => setQText(e.target.value)}
                  required
                  placeholder="Enter SSC question problem statement..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  placeholder="Option A"
                  value={optA}
                  onChange={(e) => setOptA(e.target.value)}
                  required
                  className="bg-slate-50 text-xs"
                />
                <Input
                  placeholder="Option B"
                  value={optB}
                  onChange={(e) => setOptB(e.target.value)}
                  required
                  className="bg-slate-50 text-xs"
                />
                <Input
                  placeholder="Option C"
                  value={optC}
                  onChange={(e) => setOptC(e.target.value)}
                  required
                  className="bg-slate-50 text-xs"
                />
                <Input
                  placeholder="Option D"
                  value={optD}
                  onChange={(e) => setOptD(e.target.value)}
                  required
                  className="bg-slate-50 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Correct Option *</label>
                  <select
                    value={correctOpt}
                    onChange={(e) => setCorrectOpt(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-xs text-slate-900 font-bold"
                  >
                    <option value="A">Option A</option>
                    <option value="B">Option B</option>
                    <option value="C">Option C</option>
                    <option value="D">Option D</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Shortcut Explanation</label>
                  <Input
                    placeholder="Short trick or elimination explanation"
                    value={explanation}
                    onChange={(e) => setExplanation(e.target.value)}
                    className="bg-slate-50 text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowManualModal(false)}
                  className="border-slate-300 text-xs rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={savingManual}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl"
                >
                  {savingManual ? 'Saving...' : 'Add Question'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
