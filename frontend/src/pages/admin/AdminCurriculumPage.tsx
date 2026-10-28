import React, { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  BookOpen,
  ArrowRight,
  ArrowLeft,
  X,
  Layers
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { apiRequest } from '@/lib/api';

interface DayLesson {
  id: string;
  title: string;
  subject: string;
  topic_id: string;
  topic_title: string;
  youtube_embed_id: string;
  pdf_url?: string;
  short_trick_notes?: string;
}

interface AvailableTopic {
  id: string;
  subject: string;
  title: string;
  stage: number;
}

interface LibraryLesson {
  id: string;
  title: string;
  subject: string;
  topic_title: string;
  current_day: number;
}

interface DayDetails {
  day_number: number;
  assigned_lessons: DayLesson[];
  available_topics: AvailableTopic[];
  library_lessons: LibraryLesson[];
}

export const AdminCurriculumPage: React.FC = () => {
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [data, setData] = useState<DayDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [showAddLibraryModal, setShowAddLibraryModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // New Lesson Form State
  const [newTopicId, setNewTopicId] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newYoutubeId, setNewYoutubeId] = useState('dQw4w9WgXcQ');
  const [newPdfUrl, setNewPdfUrl] = useState('');
  const [newShortTrick, setNewShortTrick] = useState('');

  // Library search filter
  const [librarySearch, setLibrarySearch] = useState('');
  const [librarySubjectFilter, setLibrarySubjectFilter] = useState('ALL');

  useEffect(() => {
    fetchDayDetails(selectedDay);
  }, [selectedDay]);

  const fetchDayDetails = async (day: number) => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiRequest<DayDetails>(`/admin/curriculum/day/${day}`);
      setData(res);
      if (res.available_topics.length > 0 && !newTopicId) {
        setNewTopicId(res.available_topics[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load day curriculum');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignExistingLesson = async (lessonId: string) => {
    try {
      setActionLoading(true);
      await apiRequest('/admin/curriculum/assign-lesson', {
        method: 'POST',
        body: JSON.stringify({
          lesson_id: lessonId,
          day_number: selectedDay,
        }),
      });
      setShowAddLibraryModal(false);
      await fetchDayDetails(selectedDay);
    } catch (err: any) {
      alert(err.message || 'Error assigning lesson');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateNewLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newTopicId) return;

    try {
      setActionLoading(true);
      await apiRequest('/admin/curriculum/create-lesson', {
        method: 'POST',
        body: JSON.stringify({
          topic_id: newTopicId,
          day_number: selectedDay,
          title: newTitle.trim(),
          youtube_embed_id: newYoutubeId.trim() || 'dQw4w9WgXcQ',
          pdf_url: newPdfUrl.trim() || null,
          short_trick_notes: newShortTrick.trim() || null,
        }),
      });
      setNewTitle('');
      setNewPdfUrl('');
      setNewShortTrick('');
      setShowCreateModal(false);
      await fetchDayDetails(selectedDay);
    } catch (err: any) {
      alert(err.message || 'Error creating lesson');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveLesson = async (lessonId: string) => {
    if (!confirm('Remove this lesson from Day ' + selectedDay + '?')) return;
    try {
      await apiRequest(`/admin/curriculum/remove-lesson/${lessonId}`, {
        method: 'DELETE',
      });
      await fetchDayDetails(selectedDay);
    } catch (err: any) {
      alert(err.message || 'Error removing lesson');
    }
  };

  const subjects = ['ALL', 'English', 'General Studies', 'Quantitative Aptitude', 'Reasoning'];

  const filteredLibrary = data?.library_lessons.filter((l) => {
    const matchSubject = librarySubjectFilter === 'ALL' || l.subject.toLowerCase() === librarySubjectFilter.toLowerCase();
    const matchSearch = !librarySearch || l.title.toLowerCase().includes(librarySearch.toLowerCase()) || l.topic_title.toLowerCase().includes(librarySearch.toLowerCase());
    return matchSubject && matchSearch;
  }) || [];

  return (
    <div className="space-y-6 max-w-6xl font-sans animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              Curriculum Control Hub
            </span>
            <span className="text-xs text-slate-500 font-medium">Stage Progression & Workload Editor</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Daily Lesson & Multi-Subject Scheduler
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manually schedule 2 English + 2 GS + 1 Reasoning (or any custom topics) for any specific day in the 180-day rail.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setShowAddLibraryModal(true)}
            variant="outline"
            className="border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold rounded-xl gap-1.5 h-10"
          >
            <BookOpen className="w-4 h-4 text-blue-600" />
            Pick from Topic Library
          </Button>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-600/20 gap-1.5 h-10"
          >
            <Plus className="w-4 h-4" />
            Add Custom Lesson to Day {selectedDay}
          </Button>
        </div>
      </div>

      {/* Day Selector Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={selectedDay <= 1}
            onClick={() => setSelectedDay((prev) => Math.max(1, prev - 1))}
            className="border-slate-300 h-9 w-9 p-0 rounded-xl"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">Jump to Day:</span>
            <Input
              type="number"
              min={1}
              max={180}
              value={selectedDay}
              onChange={(e) => setSelectedDay(Math.min(180, Math.max(1, Number(e.target.value) || 1)))}
              className="w-20 text-center font-bold text-blue-700 border-slate-300 rounded-xl h-9"
            />
            <span className="text-xs text-slate-400">of 180</span>
          </div>

          <Button
            size="sm"
            variant="outline"
            disabled={selectedDay >= 180}
            onClick={() => setSelectedDay((prev) => Math.min(180, prev + 1))}
            className="border-slate-300 h-9 w-9 p-0 rounded-xl"
          >
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Quick Jump Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
          {[1, 2, 3, 5, 10, 15, 30, 46, 111, 151].map((d) => (
            <button
              key={d}
              onClick={() => setSelectedDay(d)}
              className={`px-2.5 py-1 rounded-lg font-bold transition ${
                selectedDay === d
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Day {d}
            </button>
          ))}
        </div>
      </div>

      {/* Main Day Content */}
      {loading ? (
        <div className="p-16 text-center text-slate-400">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-semibold">Loading Day {selectedDay} Curriculum...</p>
        </div>
      ) : error ? (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
          {error}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Assigned Daily Lessons for Day {selectedDay}</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  {data?.assigned_lessons.length || 0} Topics Assigned
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Students will study these topics linearly on Day {selectedDay}.
              </p>
            </div>
          </div>

          {data?.assigned_lessons && data.assigned_lessons.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.assigned_lessons.map((lesson, idx) => (
                <Card
                  key={lesson.id}
                  className="border-slate-200 bg-white shadow-sm rounded-2xl hover:border-blue-400 transition flex flex-col justify-between"
                >
                  <CardHeader className="pb-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-700 border-blue-200 font-bold">
                        {lesson.subject} #{idx + 1}
                      </Badge>
                      <button
                        onClick={() => handleRemoveLesson(lesson.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition"
                        title="Remove from Day"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <CardTitle className="text-sm font-bold text-slate-900 line-clamp-2">
                      {lesson.title}
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500 line-clamp-1">
                      Topic: {lesson.topic_title}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="pt-0 space-y-2 text-xs">
                    {lesson.short_trick_notes && (
                      <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 font-mono text-[11px] line-clamp-2">
                        ⚡ {lesson.short_trick_notes}
                      </div>
                    )}
                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
                      <span>YouTube ID: {lesson.youtube_embed_id}</span>
                      {lesson.pdf_url && <span className="text-blue-600 font-semibold">PDF Linked ✓</span>}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="bg-white border-2 border-dashed border-slate-300 rounded-3xl p-12 text-center">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">No custom lessons assigned to Day {selectedDay}</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mb-5">
                The platform currently falls back to stage curriculum topics for Day {selectedDay}. You can assign custom English, GS, or Quant topics below.
              </p>
              <div className="flex items-center justify-center gap-3">
                <Button
                  onClick={() => setShowAddLibraryModal(true)}
                  size="sm"
                  variant="outline"
                  className="border-slate-300 text-xs font-bold rounded-xl"
                >
                  Pick from Library
                </Button>
                <Button
                  onClick={() => setShowCreateModal(true)}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm"
                >
                  Create Custom Lesson
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: PICK LESSON FROM LIBRARY */}
      {showAddLibraryModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Assign Existing Lesson to Day {selectedDay}
                </h3>
                <p className="text-xs text-slate-500">Pick any lesson from the library to add to this day's rail.</p>
              </div>
              <button
                onClick={() => setShowAddLibraryModal(false)}
                className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 border-b border-slate-200 space-y-3 bg-white">
              <Input
                placeholder="Search by lesson title or topic..."
                value={librarySearch}
                onChange={(e) => setLibrarySearch(e.target.value)}
                className="border-slate-300 rounded-xl text-xs h-9"
              />
              <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
                {subjects.map((s) => (
                  <button
                    key={s}
                    onClick={() => setLibrarySubjectFilter(s)}
                    className={`px-3 py-1 rounded-lg font-bold transition whitespace-nowrap ${
                      librarySubjectFilter === s
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-2 divide-y divide-slate-100">
              {filteredLibrary.map((item) => (
                <div key={item.id} className="pt-2 pb-2 flex items-center justify-between hover:bg-slate-50 p-2 rounded-xl transition">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                        {item.subject}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">Topic: {item.topic_title}</span>
                      {item.current_day > 0 && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-500">
                          Assigned Day {item.current_day}
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-bold text-slate-900 mt-1">{item.title}</p>
                  </div>
                  <Button
                    size="sm"
                    disabled={actionLoading || item.current_day > 0}
                    onClick={() => handleAssignExistingLesson(item.id)}
                    className={`text-xs font-bold h-8 px-3 rounded-lg shrink-0 ${
                      item.current_day === selectedDay
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200 cursor-not-allowed'
                        : item.current_day > 0
                        ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                    }`}
                  >
                    {item.current_day === selectedDay
                      ? 'In Day ' + selectedDay
                      : item.current_day > 0
                      ? `Assigned to Day ${item.current_day} (Disabled)`
                      : `Assign to Day ${selectedDay}`}
                  </Button>
                </div>
              ))}
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddLibraryModal(false)}
                className="border-slate-300 text-xs font-bold rounded-xl"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: CREATE NEW LESSON FOR DAY */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-xl flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Create & Schedule New Lesson for Day {selectedDay}
                </h3>
                <p className="text-xs text-slate-500">Fill in the core lesson details to persist it directly into Day {selectedDay}.</p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateNewLesson} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Topic Category</label>
                <select
                  value={newTopicId}
                  onChange={(e) => setNewTopicId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-semibold bg-white text-slate-800"
                  required
                >
                  {data?.available_topics.map((t) => (
                    <option key={t.id} value={t.id}>
                      [{t.subject}] {t.title} (Stage {t.stage})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Lesson Title</label>
                <Input
                  placeholder="e.g. Percentage Shortcuts: Successive Percentage Tricks Part 2"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                  className="border-slate-300 rounded-xl text-xs h-10"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">YouTube Embed ID</label>
                  <Input
                    placeholder="e.g. dQw4w9WgXcQ"
                    value={newYoutubeId}
                    onChange={(e) => setNewYoutubeId(e.target.value)}
                    required
                    className="border-slate-300 rounded-xl text-xs h-10 font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">PDF Formula Sheet URL (Optional)</label>
                  <Input
                    placeholder="https://..."
                    value={newPdfUrl}
                    onChange={(e) => setNewPdfUrl(e.target.value)}
                    className="border-slate-300 rounded-xl text-xs h-10"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Exam Shortcut / Vedic Trick (Slide-in Note)</label>
                <textarea
                  rows={2}
                  placeholder="e.g. For successive discounts: Formula is a + b - (a*b)/100. Never do manual calculation."
                  value={newShortTrick}
                  onChange={(e) => setNewShortTrick(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 font-mono"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateModal(false)}
                  className="border-slate-300 text-xs font-bold rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={actionLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-600/20"
                >
                  {actionLoading ? 'Creating...' : `Save & Schedule for Day ${selectedDay}`}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
