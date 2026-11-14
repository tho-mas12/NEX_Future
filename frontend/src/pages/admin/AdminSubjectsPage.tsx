import React, { useState, useEffect } from 'react';
import {
  Brain,
  Globe,
  Calculator,
  BookOpen,
  Plus,
  Play,
  ArrowRight,
  Loader2,
  ArrowLeft,
  Pencil,
  Trash2,
  X,
  Layers,
  Sparkles,
  Zap,
  Eye,
  EyeOff,
  Shuffle,
  CheckCircle2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { apiRequest } from '@/lib/api';

interface SubjectOverview {
  key: string;
  title: string;
  description: string;
  subject_enum: string;
  topic_count: number;
  lesson_count: number;
}

interface LessonItem {
  id: string;
  title: string;
  topic_title: string;
  day_sequence: number;
  youtube_embed_id: string;
  short_trick_notes: string;
  pdf_url?: string;
}

interface QuestionItem {
  id?: string;
  question_text: string;
  opt_a: string;
  opt_b: string;
  opt_c: string;
  opt_d: string;
  correct_opt: string;
  explanation?: string;
  short_trick?: string;
  quiz_set?: number;
  difficulty_level?: string;
}

interface QuizzesOverview {
  stage2_active_recall: QuestionItem[];
  set1_attempt1: QuestionItem[];
  set2_attempt2: QuestionItem[];
  set3_attempt3: QuestionItem[];
  revision_set: QuestionItem[];
  total_questions: number;
}

const ICONS_MAP: Record<string, React.ElementType> = {
  reasoning: Brain,
  ga: Globe,
  quant: Calculator,
  english: BookOpen,
};

const COLOR_MAP: Record<string, { border: string; bg: string; text: string; badge: string; btn: string }> = {
  reasoning: {
    border: 'border-purple-500/30 hover:border-purple-500',
    bg: 'bg-purple-950/20',
    text: 'text-purple-400',
    badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    btn: 'bg-purple-600 hover:bg-purple-500',
  },
  ga: {
    border: 'border-emerald-500/30 hover:border-emerald-500',
    bg: 'bg-emerald-950/20',
    text: 'text-emerald-400',
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    btn: 'bg-emerald-600 hover:bg-emerald-500',
  },
  quant: {
    border: 'border-blue-500/30 hover:border-blue-500',
    bg: 'bg-blue-950/20',
    text: 'text-blue-400',
    badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    btn: 'bg-blue-600 hover:bg-blue-500',
  },
  english: {
    border: 'border-amber-500/30 hover:border-amber-500',
    bg: 'bg-amber-950/20',
    text: 'text-amber-400',
    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    btn: 'bg-amber-600 hover:bg-amber-500',
  },
};

export const AdminSubjectsPage: React.FC = () => {
  const [subjects, setSubjects] = useState<SubjectOverview[]>([]);
  const [selectedSubjectKey, setSelectedSubjectKey] = useState<string | null>(null);
  const [subjectLessons, setSubjectLessons] = useState<LessonItem[]>([]);
  const [loadingLessons, setLoadingLessons] = useState(false);

  // New Lesson form state
  const [newTitle, setNewTitle] = useState('');
  const [newYoutubeUrl, setNewYoutubeUrl] = useState('');
  const [newShortNotes, setNewShortNotes] = useState('');
  const [generatingNotes, setGeneratingNotes] = useState(false);
  const [creating, setCreating] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Edit Lesson state
  const [editingLesson, setEditingLesson] = useState<LessonItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editYoutubeUrl, setEditYoutubeUrl] = useState('');
  const [editShortNotes, setEditShortNotes] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Create Subject Card state
  const [showCreateCardModal, setShowCreateCardModal] = useState(false);
  const [cardTitle, setCardTitle] = useState('');
  const [cardKey, setCardKey] = useState('');
  const [cardDesc, setCardDesc] = useState('');
  const [creatingCard, setCreatingCard] = useState(false);

  // AI Quiz Studio & Stage 2 Manager Modal
  const [activeQuizLesson, setActiveQuizLesson] = useState<LessonItem | null>(null);
  const [quizzesOverview, setQuizzesOverview] = useState<QuizzesOverview | null>(null);
  const [generatingStage2, setGeneratingStage2] = useState(false);
  const [generatingSetNum, setGeneratingSetNum] = useState<number | null>(null);
  const [revealedShortcuts, setRevealedShortcuts] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchOverview();
  }, []);

  useEffect(() => {
    if (selectedSubjectKey) {
      fetchSubjectLessons(selectedSubjectKey);
    }
  }, [selectedSubjectKey]);

  const fetchOverview = async () => {
    try {
      const data = await apiRequest<SubjectOverview[]>('/admin/subjects-overview');
      setSubjects(data);
    } catch (err: any) {
      console.error(err);
    }
  };

  const fetchSubjectLessons = async (key: string) => {
    setLoadingLessons(true);
    try {
      const data = await apiRequest<{ subject: string; lessons: LessonItem[] }>(`/admin/subjects/${key}/lessons`);
      setSubjectLessons(data.lessons);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoadingLessons(false);
    }
  };

  // AI Summary & Speed Tricks Generator
  const handleGenerateSummaryAndTricks = async () => {
    if (!newTitle.trim()) {
      alert('Please enter a Lesson Title first so AI can analyze the topic concepts.');
      return;
    }
    setGeneratingNotes(true);
    try {
      const res = await apiRequest<{ success: boolean; summary: string; speed_tricks: string }>(
        '/admin/generate-lesson-summary',
        {
          method: 'POST',
          body: JSON.stringify({
            title: newTitle.trim(),
            youtube_url: newYoutubeUrl.trim(),
            subject: selectedSubjectKey || 'General Aptitude',
          }),
        }
      );
      setNewShortNotes(res.summary);
      setSuccessMsg('AI successfully synthesized lesson concepts and high-yield speed tricks!');
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      alert(err.message || 'Failed to generate AI concept summary');
    } finally {
      setGeneratingNotes(false);
    }
  };

  const handleCreateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubjectKey || !newTitle.trim()) return;
    setCreating(true);
    try {
      await apiRequest(`/admin/subjects/${selectedSubjectKey}/lessons`, {
        method: 'POST',
        body: JSON.stringify({
          title: newTitle.trim(),
          youtube_url: newYoutubeUrl.trim(),
          short_notes: newShortNotes.trim(),
        }),
      });

      setSuccessMsg('Lesson registered successfully!');
      setNewTitle('');
      setNewYoutubeUrl('');
      setNewShortNotes('');
      fetchSubjectLessons(selectedSubjectKey);
      fetchOverview();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Error creating lesson');
    } finally {
      setCreating(false);
    }
  };

  const handleOpenEditLesson = (lesson: LessonItem) => {
    setEditingLesson(lesson);
    setEditTitle(lesson.title);
    setEditYoutubeUrl(lesson.youtube_embed_id ? `https://www.youtube.com/watch?v=${lesson.youtube_embed_id}` : '');
    setEditShortNotes(lesson.short_trick_notes || '');
  };

  const handleSaveEditLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLesson || !selectedSubjectKey || !editTitle.trim()) return;
    setSavingEdit(true);
    try {
      await apiRequest(`/admin/subjects/${selectedSubjectKey}/lessons/${editingLesson.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          title: editTitle.trim(),
          youtube_url: editYoutubeUrl.trim(),
          short_notes: editShortNotes.trim(),
        }),
      });

      setSuccessMsg('Lesson updated successfully!');
      setEditingLesson(null);
      fetchSubjectLessons(selectedSubjectKey);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to update lesson');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm('Are you sure you want to delete this lesson and its questions?')) return;
    if (!selectedSubjectKey) return;
    try {
      await apiRequest(`/admin/subjects/${selectedSubjectKey}/lessons/${lessonId}`, {
        method: 'DELETE',
      });
      setSuccessMsg('Lesson deleted successfully.');
      fetchSubjectLessons(selectedSubjectKey);
      fetchOverview();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to delete lesson');
    }
  };

  // Open Quiz Studio Modal
  const handleOpenQuizStudio = async (lesson: LessonItem) => {
    setActiveQuizLesson(lesson);
    loadQuizzesOverview(lesson.id);
  };

  const loadQuizzesOverview = async (lessonId: string) => {
    try {
      const data = await apiRequest<QuizzesOverview>(`/admin/lessons/${lessonId}/quizzes-overview`);
      setQuizzesOverview(data);
    } catch (e) {
      console.error(e);
    }
  };

  // Generate Stage 2 Active Recall
  const handleGenerateStage2 = async () => {
    if (!activeQuizLesson) return;
    setGeneratingStage2(true);
    try {
      await apiRequest(`/admin/lessons/${activeQuizLesson.id}/generate-stage2`, {
        method: 'POST',
        body: JSON.stringify({
          title: activeQuizLesson.title,
          short_notes: activeQuizLesson.short_trick_notes,
          subject: selectedSubjectKey || 'General Aptitude',
        }),
      });
      setSuccessMsg('Stage 2 Active Recall Drill with hidden shortcuts generated successfully!');
      loadQuizzesOverview(activeQuizLesson.id);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (e: any) {
      alert(e.message || 'Failed to generate Stage 2');
    } finally {
      setGeneratingStage2(false);
    }
  };

  // Generate Stage 3 Quiz Set (1, 2, 3, or 4 for Revision)
  const handleGenerateQuizSet = async (setNum: number) => {
    if (!activeQuizLesson) return;
    setGeneratingSetNum(setNum);
    const difficultyMap: Record<number, string> = {
      1: 'medium',
      2: 'medium-hard',
      3: 'hard',
      4: 'revision',
    };
    try {
      await apiRequest(`/admin/lessons/${activeQuizLesson.id}/generate-quiz-set`, {
        method: 'POST',
        body: JSON.stringify({
          set_num: setNum,
          difficulty: difficultyMap[setNum] || 'medium',
        }),
      });
      const labels: Record<number, string> = {
        1: 'Set 1 (Attempt 1 - Medium)',
        2: 'Set 2 (Attempt 2 - Medium-Hard)',
        3: 'Set 3 (Attempt 3 - Tier 2 Hard)',
        4: 'Revision Quiz (Spaced Drill)',
      };
      setSuccessMsg(`${labels[setNum]} generated and saved to lesson!`);
      loadQuizzesOverview(activeQuizLesson.id);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (e: any) {
      alert(e.message || 'Failed to generate Quiz Set');
    } finally {
      setGeneratingSetNum(null);
    }
  };

  const toggleShortcutReveal = (id: string) => {
    setRevealedShortcuts((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCreateSubjectCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardTitle.trim()) return;
    setCreatingCard(true);
    try {
      const generatedKey = cardKey.trim() || cardTitle.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
      await apiRequest('/admin/subjects', {
        method: 'POST',
        body: JSON.stringify({
          key: generatedKey,
          title: cardTitle.trim(),
          description: cardDesc.trim() || 'Comprehensive mastery modules for SSC exam stream.',
        }),
      });

      setSuccessMsg('New Subject Card created successfully!');
      setShowCreateCardModal(false);
      setCardTitle('');
      setCardKey('');
      setCardDesc('');
      fetchOverview();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Error creating subject card');
    } finally {
      setCreatingCard(false);
    }
  };

  const handleDeleteSubjectCard = async (key: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete the "${key}" subject stream card?`)) return;
    try {
      await apiRequest(`/admin/subjects/${key}`, { method: 'DELETE' });
      setSuccessMsg('Subject card deleted.');
      fetchOverview();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to delete subject card');
    }
  };

  const currentSubjectObj = subjects.find((s) => s.key === selectedSubjectKey);
  const colors = selectedSubjectKey ? (COLOR_MAP[selectedSubjectKey] || COLOR_MAP.quant) : COLOR_MAP.quant;

  return (
    <div className="space-y-6 animate-in fade-in duration-200 font-sans pb-16">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl border border-white/10 bg-slate-900/60 backdrop-blur-xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/15 border border-indigo-400/30 text-indigo-300 text-xs font-bold mb-2">
            <BookOpen className="h-3.5 w-3.5 text-indigo-400" />
            Subject-Wise Content Architect
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Subject Lessons Hub</h1>
          <p className="text-xs text-slate-400 mt-1">
            Create, edit, and organize lecture modules, Stage 2 active recall drills, and Stage 3 3-set progressive quizzes.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {!selectedSubjectKey && (
            <Button
              onClick={() => setShowCreateCardModal(true)}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl h-10 gap-1.5 shadow-lg shadow-blue-600/30 active:scale-95 transition"
            >
              <Plus className="h-4 w-4" />
              <span>Create New Subject Card</span>
            </Button>
          )}

          {selectedSubjectKey && (
            <Button
              variant="outline"
              onClick={() => setSelectedSubjectKey(null)}
              className="border-white/15 bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-bold gap-1.5 rounded-xl h-10 active:scale-95 transition"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to All Subjects</span>
            </Button>
          )}
        </div>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* VIEW 1: 4 SUBJECT CARDS */}
      {!selectedSubjectKey && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {subjects.map((subj) => {
            const Icon = ICONS_MAP[subj.key] || BookOpen;
            const c = COLOR_MAP[subj.key] || COLOR_MAP.quant;

            return (
              <Card
                key={subj.key}
                onClick={() => setSelectedSubjectKey(subj.key)}
                className={`border bg-slate-900/60 backdrop-blur-xl ${c.border} rounded-3xl p-6 cursor-pointer shadow-lg hover:shadow-2xl transition duration-200 flex flex-col justify-between group relative overflow-hidden`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-2xl ${c.bg} border ${c.border} flex items-center justify-center ${c.text}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={`text-[10px] font-bold ${c.badge}`}>
                        {subj.lesson_count} Lessons
                      </Badge>
                      {['reasoning', 'ga', 'quant', 'english'].indexOf(subj.key) === -1 && (
                        <button
                          onClick={(e) => handleDeleteSubjectCard(subj.key, e)}
                          title="Delete Card"
                          className="p-1 rounded-lg hover:bg-rose-500/20 text-rose-400 transition"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <h3 className="text-lg font-black text-white tracking-tight mb-1 group-hover:text-indigo-400 transition">
                    {subj.title}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4">
                    {subj.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-semibold">
                    {subj.topic_count} Core Topics
                  </span>
                  <div className={`flex items-center gap-1 font-bold ${c.text} group-hover:translate-x-1 transition-transform`}>
                    <span>Manage Lessons</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* VIEW 2: INSIDE A SELECTED SUBJECT CARD */}
      {selectedSubjectKey && currentSubjectObj && (
        <div className="space-y-6">
          {/* Register New Lesson Form with AI Auto-Generator */}
          <Card className="border border-white/10 bg-slate-900/70 backdrop-blur-2xl shadow-2xl rounded-3xl overflow-hidden">
            <div className="p-6 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Plus className="h-4 w-4 text-indigo-400" />
                  <span>Register New Lesson under {currentSubjectObj.title}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Enter Title & YouTube URL, click <strong>"AI Generate Summary & Speed Tricks"</strong> to auto-fill notes.
                </p>
              </div>
              <Badge className={`text-xs font-bold ${colors.badge} self-start sm:self-auto`}>
                {currentSubjectObj.title}
              </Badge>
            </div>

            <CardContent className="p-6">
              <form onSubmit={handleCreateLesson} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Lesson Title *</label>
                    <Input
                      required
                      placeholder="e.g. Ratio & Proportion - Foundation Shortcuts"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="text-xs bg-white/5 border-white/15 text-white rounded-xl h-11"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">YouTube Video URL / Embed ID</label>
                    <Input
                      placeholder="e.g. https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                      value={newYoutubeUrl}
                      onChange={(e) => setNewYoutubeUrl(e.target.value)}
                      className="text-xs bg-white/5 border-white/15 text-white rounded-xl h-11"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-300">
                      Short Concept Notes / Speed Tricks
                    </label>

                    {/* AI Generate Summary and Speed Tricks Button */}
                    <button
                      type="button"
                      disabled={generatingNotes}
                      onClick={handleGenerateSummaryAndTricks}
                      className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/30 active:scale-95 transition"
                    >
                      {generatingNotes ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Analyzing & Generating...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                          <span>AI Generate Summary & Speed Tricks</span>
                        </>
                      )}
                    </button>
                  </div>

                  <textarea
                    rows={4}
                    placeholder="Click the AI Generate button above or enter short summary notes and key Vedic speed formulas..."
                    value={newShortNotes}
                    onChange={(e) => setNewShortNotes(e.target.value)}
                    className="w-full text-xs p-3.5 bg-white/5 border border-white/15 text-white rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    disabled={creating}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl h-11 px-6 gap-2 shadow-lg shadow-blue-600/30 active:scale-95 transition"
                  >
                    {creating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Registering Lesson...</span>
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4" />
                        <span>Save Lesson to {currentSubjectObj.title}</span>
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Active Lessons List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Active Lessons in {currentSubjectObj.title}</span>
                <Badge variant="outline" className="text-xs border-white/15 text-slate-300">
                  {subjectLessons.length} Total
                </Badge>
              </h3>
              <span className="text-xs text-slate-400">
                Manage lesson content, Stage 2 Active Recall, and Stage 3 3-Set Quizzes
              </span>
            </div>

            {loadingLessons ? (
              <div className="p-12 text-center bg-slate-900/50 backdrop-blur-xl rounded-3xl border border-white/10 text-xs text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-400 mx-auto mb-2" />
                Loading lessons...
              </div>
            ) : subjectLessons.length === 0 ? (
              <div className="p-8 text-center bg-slate-900/50 backdrop-blur-xl rounded-3xl border border-white/10 text-xs text-slate-400">
                No lessons registered yet in this stream. Use the form above to add your first lesson.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {subjectLessons.map((l) => (
                  <Card
                    key={l.id}
                    className="border border-white/10 bg-slate-900/60 backdrop-blur-xl rounded-3xl p-5 shadow-lg flex flex-col justify-between hover:border-indigo-500/40 transition"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge className="bg-white/10 text-slate-200 border-white/10 text-[10px] font-bold">
                          Day {l.day_sequence > 0 ? l.day_sequence : 'Unassigned'}
                        </Badge>
                        <div className="flex items-center gap-1.5">
                          {/* AI Quiz Studio Button */}
                          <button
                            onClick={() => handleOpenQuizStudio(l)}
                            title="Manage Stage 2 & Stage 3 Quizzes"
                            className="px-2.5 py-1 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-400/30 text-[11px] font-bold flex items-center gap-1 transition"
                          >
                            <Zap className="h-3 w-3 text-amber-400" />
                            <span>AI Quizzes</span>
                          </button>

                          <button
                            onClick={() => handleOpenEditLesson(l)}
                            title="Edit Lesson"
                            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteLesson(l.id)}
                            title="Delete Lesson"
                            className="p-1.5 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      <h4 className="text-sm font-bold text-white leading-snug">{l.title}</h4>
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {l.short_trick_notes}
                      </p>
                    </div>

                    <div className="pt-3 mt-3 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
                      <span className="flex items-center gap-1 text-[11px] text-indigo-400 font-semibold">
                        <Play className="h-3 w-3" />
                        Embed: {l.youtube_embed_id}
                      </span>
                      <button
                        onClick={() => handleOpenQuizStudio(l)}
                        className="text-[11px] text-amber-400 hover:underline font-bold"
                      >
                        Configure 3-Set Mocks &rarr;
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* AI QUIZ STUDIO MODAL: STAGE 2 ACTIVE RECALL & STAGE 3 3-SET MCQ QUIZZES */}
      {activeQuizLesson && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/15 max-w-4xl w-full rounded-3xl p-6 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                    <Zap className="w-5 h-5" />
                  </span>
                  <h3 className="text-lg font-black text-white">AI Quiz & Stage Architecture Studio</h3>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Lesson: <strong className="text-white">{activeQuizLesson.title}</strong>
                </p>
              </div>
              <button
                onClick={() => setActiveQuizLesson(null)}
                className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stage 2 Active Recall Generator Section */}
            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-emerald-400" />
                    <span>Stage 2: Active Recall & Shortcut Drill</span>
                    <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px]">
                      {quizzesOverview?.stage2_active_recall?.length || 0} Questions
                    </Badge>
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Common practice drill with hidden shortcuts and step-by-step explanations revealed upon answering.
                  </p>
                </div>

                <Button
                  onClick={handleGenerateStage2}
                  disabled={generatingStage2}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl h-9 px-4 gap-1.5 shrink-0 active:scale-95 transition"
                >
                  {generatingStage2 ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Generating Stage 2 Drill...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Generate Stage 2 Drill</span>
                    </>
                  )}
                </Button>
              </div>

              {/* Stage 2 Question List */}
              {quizzesOverview?.stage2_active_recall && quizzesOverview.stage2_active_recall.length > 0 && (
                <div className="space-y-2 pt-2">
                  {quizzesOverview.stage2_active_recall.map((q, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-slate-950/60 border border-white/5 text-xs space-y-2">
                      <div className="flex items-center justify-between font-bold text-slate-200">
                        <span>Q{idx + 1}. {q.question_text}</span>
                        <span className="text-emerald-400 font-mono">Correct: ({q.correct_opt})</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400">
                        <div>A) {q.opt_a}</div>
                        <div>B) {q.opt_b}</div>
                        <div>C) {q.opt_c}</div>
                        <div>D) {q.opt_d}</div>
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-white/5">
                        <button
                          onClick={() => toggleShortcutReveal(`s2_${idx}`)}
                          className="text-[10px] text-amber-400 hover:underline flex items-center gap-1 font-bold"
                        >
                          {revealedShortcuts[`s2_${idx}`] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          <span>{revealedShortcuts[`s2_${idx}`] ? 'Hide Shortcut & Solution' : 'View Hidden Shortcut & Explanation'}</span>
                        </button>
                        <span className="text-[10px] text-slate-500">Stage 2 Active Recall</span>
                      </div>
                      {revealedShortcuts[`s2_${idx}`] && (
                        <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-200 text-[11px] space-y-1">
                          <p><strong>⚡ Shortcut:</strong> {q.short_trick || 'Value-putting elimination technique'}</p>
                          <p className="text-slate-300"><strong>Explanation:</strong> {q.explanation}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Stage 3 Sectional Simulator 3-Set Generator Section */}
            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-4">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-blue-400" />
                  <span>Stage 3: Sectional Simulator 3-Set Quiz Engine</span>
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  1st attempt serves Set 1 (Medium), 2nd attempt serves Set 2 (Medium-Hard), 3rd attempt serves Set 3 (Hard / Advanced).
                  Further attempts automatically shuffle Sets 1, 2, and 3.
                </p>
              </div>

              {/* 3 MCQ QUIZ Generation Action Buttons + Revision Quiz */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Button 1: Set 1 */}
                <button
                  disabled={generatingSetNum !== null}
                  onClick={() => handleGenerateQuizSet(1)}
                  className="p-4 rounded-2xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-left transition active:scale-95 group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-blue-300">MCQ Quiz 1</span>
                    <Badge className="bg-blue-500/20 text-blue-300 text-[10px]">
                      {quizzesOverview?.set1_attempt1?.length || 0} Qs
                    </Badge>
                  </div>
                  <h5 className="text-xs font-black text-white">Generate Set 1 (1st Attempt)</h5>
                  <p className="text-[11px] text-slate-400 mt-1">Medium Level • Tier 1 Speed</p>
                  {generatingSetNum === 1 && <Loader2 className="w-3.5 h-3.5 animate-spin mt-2 text-blue-400" />}
                </button>

                {/* Button 2: Set 2 */}
                <button
                  disabled={generatingSetNum !== null}
                  onClick={() => handleGenerateQuizSet(2)}
                  className="p-4 rounded-2xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-left transition active:scale-95 group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-indigo-300">MCQ Quiz 2</span>
                    <Badge className="bg-indigo-500/20 text-indigo-300 text-[10px]">
                      {quizzesOverview?.set2_attempt2?.length || 0} Qs
                    </Badge>
                  </div>
                  <h5 className="text-xs font-black text-white">Generate Set 2 (2nd Attempt)</h5>
                  <p className="text-[11px] text-slate-400 mt-1">Medium-Hard • Trap Defense</p>
                  {generatingSetNum === 2 && <Loader2 className="w-3.5 h-3.5 animate-spin mt-2 text-indigo-400" />}
                </button>

                {/* Button 3: Set 3 */}
                <button
                  disabled={generatingSetNum !== null}
                  onClick={() => handleGenerateQuizSet(3)}
                  className="p-4 rounded-2xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-left transition active:scale-95 group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-purple-300">MCQ Quiz 3</span>
                    <Badge className="bg-purple-500/20 text-purple-300 text-[10px]">
                      {quizzesOverview?.set3_attempt3?.length || 0} Qs
                    </Badge>
                  </div>
                  <h5 className="text-xs font-black text-white">Generate Set 3 (3rd Attempt)</h5>
                  <p className="text-[11px] text-slate-400 mt-1">Hard / Advanced • Tier 2 Twists</p>
                  {generatingSetNum === 3 && <Loader2 className="w-3.5 h-3.5 animate-spin mt-2 text-purple-400" />}
                </button>

                {/* Button 4: Revision Quiz */}
                <button
                  disabled={generatingSetNum !== null}
                  onClick={() => handleGenerateQuizSet(4)}
                  className="p-4 rounded-2xl bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/30 text-left transition active:scale-95 group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-amber-300">Revision Drill</span>
                    <Badge className="bg-amber-500/20 text-amber-300 text-[10px]">
                      {quizzesOverview?.revision_set?.length || 0} Qs
                    </Badge>
                  </div>
                  <h5 className="text-xs font-black text-white">Generate Revision Quiz</h5>
                  <p className="text-[11px] text-slate-400 mt-1">Challenging Spaced Retention</p>
                  {generatingSetNum === 4 && <Loader2 className="w-3.5 h-3.5 animate-spin mt-2 text-amber-400" />}
                </button>
              </div>

              {/* Shuffling Info Banner */}
              <div className="p-3 rounded-xl bg-slate-950/40 border border-white/5 flex items-center gap-2.5 text-xs text-slate-400">
                <Shuffle className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>
                  <strong>Dynamic Exam Logic:</strong> If candidate retakes a lesson beyond attempt 3, the engine automatically shuffles Sets 1, 2, and 3 to ensure fresh evaluation without rote memorization.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Lesson Modal */}
      {editingLesson && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/15 max-w-lg w-full rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Pencil className="h-4 w-4 text-indigo-400" />
                <span>Edit Lesson Module</span>
              </h3>
              <button
                onClick={() => setEditingLesson(null)}
                className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditLesson} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Lesson Title *</label>
                <Input
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="text-xs bg-white/5 border-white/15 text-white rounded-xl h-11"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">YouTube URL / Video ID</label>
                <Input
                  value={editYoutubeUrl}
                  onChange={(e) => setEditYoutubeUrl(e.target.value)}
                  className="text-xs bg-white/5 border-white/15 text-white rounded-xl h-11"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Short Concept Notes</label>
                <textarea
                  rows={3}
                  value={editShortNotes}
                  onChange={(e) => setEditShortNotes(e.target.value)}
                  className="w-full text-xs p-3 bg-white/5 border border-white/15 text-white rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingLesson(null)}
                  className="border-white/15 text-slate-300 rounded-xl text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={savingEdit}
                  className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold"
                >
                  {savingEdit ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Subject Card Modal */}
      {showCreateCardModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/15 max-w-md w-full rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="h-4 w-4 text-indigo-400" />
                <span>Create New Subject Stream Card</span>
              </h3>
              <button
                onClick={() => setShowCreateCardModal(false)}
                className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Add a brand new card for an additional SSC subject stream (e.g. Computer Knowledge, Static GK).
            </p>

            <form onSubmit={handleCreateSubjectCard} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Subject Title *</label>
                <Input
                  required
                  placeholder="e.g. Computer Knowledge & Typing"
                  value={cardTitle}
                  onChange={(e) => setCardTitle(e.target.value)}
                  className="text-xs bg-white/5 border-white/15 text-white rounded-xl h-11"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Card Identifier / Key (Optional)</label>
                <Input
                  placeholder="e.g. computer"
                  value={cardKey}
                  onChange={(e) => setCardKey(e.target.value)}
                  className="text-xs bg-white/5 border-white/15 text-white rounded-xl h-11"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Description</label>
                <textarea
                  rows={2}
                  placeholder="Short description of this subject stream..."
                  value={cardDesc}
                  onChange={(e) => setCardDesc(e.target.value)}
                  className="w-full text-xs p-2.5 bg-white/5 border border-white/15 text-white rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateCardModal(false)}
                  className="border-white/15 text-slate-300 rounded-xl text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={creatingCard}
                  className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold"
                >
                  {creatingCard ? 'Creating...' : 'Create Subject Card'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
