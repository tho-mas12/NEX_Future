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

const ICONS_MAP: Record<string, React.ElementType> = {
  reasoning: Brain,
  ga: Globe,
  quant: Calculator,
  english: BookOpen,
};

const COLOR_MAP: Record<string, { border: string; bg: string; text: string; badge: string; btn: string }> = {
  reasoning: {
    border: 'border-purple-200 hover:border-purple-500',
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    badge: 'bg-purple-100 text-purple-800 border-purple-200',
    btn: 'bg-purple-600 hover:bg-purple-700',
  },
  ga: {
    border: 'border-emerald-200 hover:border-emerald-500',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    btn: 'bg-emerald-600 hover:bg-emerald-700',
  },
  quant: {
    border: 'border-blue-200 hover:border-blue-500',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    badge: 'bg-blue-100 text-blue-800 border-blue-200',
    btn: 'bg-blue-600 hover:bg-blue-700',
  },
  english: {
    border: 'border-amber-200 hover:border-amber-500',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    badge: 'bg-amber-100 text-amber-800 border-amber-200',
    btn: 'bg-amber-600 hover:bg-amber-700',
  },
};

export const AdminSubjectsPage: React.FC = () => {
  const [subjects, setSubjects] = useState<SubjectOverview[]>([]);
  const [selectedSubjectKey, setSelectedSubjectKey] = useState<string | null>(null);
  const [subjectLessons, setSubjectLessons] = useState<LessonItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingLessons, setLoadingLessons] = useState(false);

  // New Lesson form state
  const [newTitle, setNewTitle] = useState('');
  const [newYoutubeUrl, setNewYoutubeUrl] = useState('');
  const [newShortNotes, setNewShortNotes] = useState('');
  const [creating, setCreating] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Edit Lesson state
  const [editingLesson, setEditingLesson] = useState<LessonItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editYoutubeUrl, setEditYoutubeUrl] = useState('');
  const [editShortNotes, setEditShortNotes] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Create Subject Card Modal State
  const [showCreateCardModal, setShowCreateCardModal] = useState(false);
  const [cardKey, setCardKey] = useState('');
  const [cardTitle, setCardTitle] = useState('');
  const [cardDesc, setCardDesc] = useState('');
  const [creatingCard, setCreatingCard] = useState(false);

  const fetchOverview = async () => {
    setLoading(true);
    try {
      const data = await apiRequest<SubjectOverview[]>('/admin/subjects-overview');
      setSubjects(data);
    } catch (err: any) {
      console.error('Error fetching subjects overview:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const handleSelectSubject = async (key: string) => {
    setSelectedSubjectKey(key);
    setLoadingLessons(true);
    try {
      const res = await apiRequest<{ subject: string; lessons: LessonItem[] }>(`/admin/subjects/${key}/lessons`);
      setSubjectLessons(res.lessons);
    } catch (err: any) {
      alert(err.message || 'Error loading lessons for subject');
    } finally {
      setLoadingLessons(false);
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

      setSuccessMsg('Lesson registered successfully under subject!');
      setNewTitle('');
      setNewYoutubeUrl('');
      setNewShortNotes('');

      // Refresh lessons
      const res = await apiRequest<{ subject: string; lessons: LessonItem[] }>(`/admin/subjects/${selectedSubjectKey}/lessons`);
      setSubjectLessons(res.lessons);
      fetchOverview();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to create lesson');
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

      // Refresh lessons
      const res = await apiRequest<{ subject: string; lessons: LessonItem[] }>(`/admin/subjects/${selectedSubjectKey}/lessons`);
      setSubjectLessons(res.lessons);
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
      const res = await apiRequest<{ subject: string; lessons: LessonItem[] }>(`/admin/subjects/${selectedSubjectKey}/lessons`);
      setSubjectLessons(res.lessons);
      fetchOverview();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to delete lesson');
    }
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
    <div className="space-y-6 animate-in fade-in duration-200 font-sans">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold mb-2">
            <BookOpen className="h-3.5 w-3.5" />
            Subject-Wise Content Architect
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Subject Lessons Hub</h1>
          <p className="text-xs text-slate-600 mt-1">
            Create, edit, and organize lecture modules for each SSC subject stream.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {!selectedSubjectKey && (
            <Button
              onClick={() => setShowCreateCardModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl h-10 gap-1.5 shadow-sm"
            >
              <Plus className="h-4 w-4" />
              <span>Create New Subject Card</span>
            </Button>
          )}

          {selectedSubjectKey && (
            <Button
              variant="outline"
              onClick={() => setSelectedSubjectKey(null)}
              className="border-slate-200 text-slate-700 text-xs font-bold gap-1.5 rounded-xl h-10"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to All Subjects</span>
            </Button>
          )}
        </div>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold animate-in fade-in">
          ✓ {successMsg}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      )}

      {/* VIEW 1: THE SUBJECT CARDS GRID */}
      {!selectedSubjectKey && !loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {subjects.map((subj) => {
            const Icon = ICONS_MAP[subj.key] || Layers;
            const c = COLOR_MAP[subj.key] || COLOR_MAP.quant;

            return (
              <Card
                key={subj.key}
                onClick={() => handleSelectSubject(subj.key)}
                className={`cursor-pointer border-2 ${c.border} transition-all duration-200 bg-white rounded-3xl p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 flex flex-col justify-between group relative`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`h-12 w-12 rounded-2xl ${c.bg} flex items-center justify-center ${c.text}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`text-xs font-bold ${c.badge}`}>
                        {subj.lesson_count} Lessons Active
                      </Badge>
                      {!['quant', 'reasoning', 'english', 'ga'].includes(subj.key) && (
                        <button
                          onClick={(e) => handleDeleteSubjectCard(subj.key, e)}
                          title="Delete Subject Card"
                          className="p-1 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <h3 className="text-xl font-black text-slate-900 tracking-tight mb-1">
                    {subj.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed mb-4">
                    {subj.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-semibold">
                    {subj.topic_count} Foundational Topics
                  </span>
                  <div className={`flex items-center gap-1 font-bold ${c.text}`}>
                    <span>Manage Lessons & Content</span>
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
          {/* Create Lesson Form inside this Subject */}
          <Card className="border-slate-200 bg-white shadow-sm rounded-3xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Plus className="h-4 w-4 text-blue-600" />
                  <span>Register New Lesson under {currentSubjectObj.title}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Enter Lesson Title, YouTube video link, and short high-yield concept notes.
                </p>
              </div>
              <Badge className={`text-xs font-bold ${colors.badge}`}>
                {currentSubjectObj.title}
              </Badge>
            </div>

            <CardContent className="p-6">
              <form onSubmit={handleCreateLesson} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Lesson Title *</label>
                    <Input
                      required
                      placeholder="e.g. Ratio & Proportion - Foundation Shortcuts"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="text-xs bg-slate-50 border-slate-200 rounded-xl"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">YouTube Video URL / Embed ID</label>
                    <Input
                      placeholder="e.g. https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                      value={newYoutubeUrl}
                      onChange={(e) => setNewYoutubeUrl(e.target.value)}
                      className="text-xs bg-slate-50 border-slate-200 rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Short Concept Notes / Speed Tricks</label>
                  <textarea
                    rows={3}
                    placeholder="Short summary notes and key formulas for this lesson..."
                    value={newShortNotes}
                    onChange={(e) => setNewShortNotes(e.target.value)}
                    className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    disabled={creating}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl h-10 px-5 gap-1.5 shadow-sm"
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

          {/* Lessons List with Edit and Delete actions */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>Active Lessons in {currentSubjectObj.title}</span>
                <Badge variant="outline" className="text-xs">
                  {subjectLessons.length} Total
                </Badge>
              </h3>
              <span className="text-xs text-slate-500">
                You can edit title/video or delete lessons anytime
              </span>
            </div>

            {loadingLessons ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-xs text-slate-500">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto mb-2" />
                Loading lessons...
              </div>
            ) : subjectLessons.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-xs text-slate-500">
                No lessons registered yet in this subject stream. Use the form above to add your first lesson.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {subjectLessons.map((l) => (
                  <Card
                    key={l.id}
                    className="border border-slate-200 bg-white rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:border-blue-400 transition"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge className="bg-slate-100 text-slate-700 border-slate-200 text-[10px] font-bold">
                          Day {l.day_sequence > 0 ? l.day_sequence : 'Unassigned'}
                        </Badge>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleOpenEditLesson(l)}
                            title="Edit Lesson"
                            className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-500 hover:text-blue-600 transition"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteLesson(l.id)}
                            title="Delete Lesson"
                            className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-500 hover:text-rose-600 transition"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      <h4 className="text-sm font-bold text-slate-900 leading-snug">{l.title}</h4>
                      <p className="text-xs text-slate-500 line-clamp-2">{l.short_trick_notes}</p>
                    </div>

                    <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <span className="flex items-center gap-1 text-[11px] text-blue-700 font-semibold">
                        <Play className="h-3 w-3" />
                        Embed ID: {l.youtube_embed_id}
                      </span>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Lesson Modal */}
      {editingLesson && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 max-w-lg w-full rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Pencil className="h-4 w-4 text-blue-600" />
                <span>Edit Lesson Module</span>
              </h3>
              <button
                onClick={() => setEditingLesson(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditLesson} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Lesson Title *</label>
                <Input
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="text-xs bg-slate-50 border-slate-200 rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">YouTube URL / Video ID</label>
                <Input
                  value={editYoutubeUrl}
                  onChange={(e) => setEditYoutubeUrl(e.target.value)}
                  className="text-xs bg-slate-50 border-slate-200 rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Short Concept Notes</label>
                <textarea
                  rows={3}
                  value={editShortNotes}
                  onChange={(e) => setEditShortNotes(e.target.value)}
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingLesson(null)}
                  className="border-slate-300 text-slate-700 rounded-xl text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={savingEdit}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold"
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
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 max-w-md w-full rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Layers className="h-4 w-4 text-blue-600" />
                <span>Create New Subject Stream Card</span>
              </h3>
              <button
                onClick={() => setShowCreateCardModal(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Add a brand new card for an additional SSC subject stream (e.g. Computer Knowledge, Static GK).
            </p>

            <form onSubmit={handleCreateSubjectCard} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Subject Title *</label>
                <Input
                  required
                  placeholder="e.g. Computer Knowledge & Typing"
                  value={cardTitle}
                  onChange={(e) => setCardTitle(e.target.value)}
                  className="text-xs bg-slate-50 border-slate-200 rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Card Identifier / Key (Optional)</label>
                <Input
                  placeholder="e.g. computer"
                  value={cardKey}
                  onChange={(e) => setCardKey(e.target.value)}
                  className="text-xs bg-slate-50 border-slate-200 rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Description</label>
                <textarea
                  rows={2}
                  placeholder="Short description of this subject stream..."
                  value={cardDesc}
                  onChange={(e) => setCardDesc(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateCardModal(false)}
                  className="border-slate-300 text-slate-700 rounded-xl text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={creatingCard}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold"
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
