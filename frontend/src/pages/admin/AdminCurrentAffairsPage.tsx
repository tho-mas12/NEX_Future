import React, { useState, useEffect } from 'react';
import {
  Globe,
  Plus,
  Loader2,
  Calendar,
  Pencil,
  Trash2,
  X,
  BookOpen,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { apiRequest } from '@/lib/api';

interface CurrentAffairsQuestion {
  question_text: string;
  opt_a: string;
  opt_b: string;
  opt_c: string;
  opt_d: string;
  correct_opt: string;
  explanation?: string;
}

interface CurrentAffairsItem {
  id: string;
  title: string;
  published_date: string;
  summary_notes: string;
  question_count: number;
  questions_json: string;
}

export const AdminCurrentAffairsPage: React.FC = () => {
  const [items, setItems] = useState<CurrentAffairsItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Create Module Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [newSummary, setNewSummary] = useState('');
  const [newQCount, setNewQCount] = useState(5);
  const [saving, setSaving] = useState(false);

  // Manage Questions Modal for Selected Module
  const [selectedItem, setSelectedItem] = useState<CurrentAffairsItem | null>(null);
  const [moduleQuestions, setModuleQuestions] = useState<CurrentAffairsQuestion[]>([]);

  // Add Question form
  const [qText, setQText] = useState('');
  const [optA, setOptA] = useState('');
  const [optB, setOptB] = useState('');
  const [optC, setOptC] = useState('');
  const [optD, setOptD] = useState('');
  const [correctOpt, setCorrectOpt] = useState('A');
  const [explanation, setExplanation] = useState('');
  const [savingQ, setSavingQ] = useState(false);

  // Edit Question state
  const [editingQIndex, setEditingQIndex] = useState<number | null>(null);
  const [editQText, setEditQText] = useState('');
  const [editOptA, setEditOptA] = useState('');
  const [editOptB, setEditOptB] = useState('');
  const [editOptC, setEditOptC] = useState('');
  const [editOptD, setEditOptD] = useState('');
  const [editCorrectOpt, setEditCorrectOpt] = useState('A');
  const [editExplanation, setEditExplanation] = useState('');
  const [savingEditQ, setSavingEditQ] = useState(false);

  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const data = await apiRequest<CurrentAffairsItem[]>('/admin/current-affairs');
      setItems(data);
    } catch (err: any) {
      console.error('Failed to load current affairs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenQuestionsModal = (item: CurrentAffairsItem) => {
    setSelectedItem(item);
    try {
      const parsed = JSON.parse(item.questions_json);
      setModuleQuestions(Array.isArray(parsed) ? parsed : []);
    } catch {
      setModuleQuestions([]);
    }
    setEditingQIndex(null);
  };

  const handleCreateModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newSummary.trim()) return;
    setSaving(true);
    try {
      await apiRequest('/admin/current-affairs', {
        method: 'POST',
        body: JSON.stringify({
          title: newTitle.trim(),
          published_date: newDate.trim(),
          summary_notes: newSummary.trim(),
          question_count: Number(newQCount),
        }),
      });

      setSuccessBanner('Current Affairs Module created successfully!');
      setShowCreateModal(false);
      setNewTitle('');
      setNewSummary('');
      fetchItems();
      setTimeout(() => setSuccessBanner(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Error creating module');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteModule = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this Current Affairs module?')) return;
    try {
      await apiRequest(`/admin/current-affairs/${id}`, { method: 'DELETE' });
      setSuccessBanner('Module deleted successfully.');
      fetchItems();
      setTimeout(() => setSuccessBanner(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Error deleting module');
    }
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || !qText.trim()) return;
    setSavingQ(true);
    try {
      await apiRequest(`/admin/current-affairs/${selectedItem.id}/questions`, {
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

      setSuccessBanner('Question added! Options will be mingled automatically in tests.');
      setQText('');
      setOptA('');
      setOptB('');
      setOptC('');
      setOptD('');
      setExplanation('');

      // Refresh item
      const freshItems = await apiRequest<CurrentAffairsItem[]>('/admin/current-affairs');
      setItems(freshItems);
      const updated = freshItems.find((i) => i.id === selectedItem.id);
      if (updated) {
        setSelectedItem(updated);
        try {
          setModuleQuestions(JSON.parse(updated.questions_json));
        } catch {
          setModuleQuestions([]);
        }
      }
      setTimeout(() => setSuccessBanner(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Error adding question');
    } finally {
      setSavingQ(false);
    }
  };

  const handleStartEditQuestion = (index: number, q: CurrentAffairsQuestion) => {
    setEditingQIndex(index);
    setEditQText(q.question_text);
    setEditOptA(q.opt_a);
    setEditOptB(q.opt_b);
    setEditOptC(q.opt_c);
    setEditOptD(q.opt_d);
    setEditCorrectOpt(q.correct_opt || 'A');
    setEditExplanation(q.explanation || '');
  };

  const handleSaveEditQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || editingQIndex === null || !editQText.trim()) return;
    setSavingEditQ(true);
    try {
      await apiRequest(`/admin/current-affairs/${selectedItem.id}/questions/${editingQIndex}`, {
        method: 'PUT',
        body: JSON.stringify({
          question_text: editQText.trim(),
          opt_a: editOptA.trim(),
          opt_b: editOptB.trim(),
          opt_c: editOptC.trim(),
          opt_d: editOptD.trim(),
          correct_opt: editCorrectOpt,
          explanation: editExplanation.trim(),
        }),
      });

      setSuccessBanner('Question updated successfully!');
      setEditingQIndex(null);

      // Refresh
      const freshItems = await apiRequest<CurrentAffairsItem[]>('/admin/current-affairs');
      setItems(freshItems);
      const updated = freshItems.find((i) => i.id === selectedItem.id);
      if (updated) {
        setSelectedItem(updated);
        try {
          setModuleQuestions(JSON.parse(updated.questions_json));
        } catch {
          setModuleQuestions([]);
        }
      }
      setTimeout(() => setSuccessBanner(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Error editing question');
    } finally {
      setSavingEditQ(false);
    }
  };

  const handleDeleteQuestion = async (index: number) => {
    if (!selectedItem) return;
    if (!confirm('Are you sure you want to delete this question?')) return;
    try {
      await apiRequest(`/admin/current-affairs/${selectedItem.id}/questions/${index}`, {
        method: 'DELETE',
      });
      setSuccessBanner('Question deleted.');

      // Refresh
      const freshItems = await apiRequest<CurrentAffairsItem[]>('/admin/current-affairs');
      setItems(freshItems);
      const updated = freshItems.find((i) => i.id === selectedItem.id);
      if (updated) {
        setSelectedItem(updated);
        try {
          setModuleQuestions(JSON.parse(updated.questions_json));
        } catch {
          setModuleQuestions([]);
        }
      }
      setTimeout(() => setSuccessBanner(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Error deleting question');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 font-sans">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold mb-2">
            <Globe className="h-3.5 w-3.5" />
            General Awareness & News Bulletin Hub
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Current Affairs Manager</h1>
          <p className="text-xs text-slate-600 mt-1">
            Create news bulletin cards, manage study summaries, and configure mingled-option verification tests.
          </p>
        </div>

        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl h-10 px-4 gap-1.5 shadow-sm shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Create Current Affairs Module</span>
        </Button>
      </div>

      {successBanner && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold animate-in fade-in">
          ✓ {successBanner}
        </div>
      )}

      {/* Grid of Current Affairs Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full p-12 text-center text-xs text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-600 mx-auto mb-2" />
            Loading Current Affairs modules...
          </div>
        ) : items.length === 0 ? (
          <div className="col-span-full p-12 text-center bg-white rounded-3xl border border-slate-200 text-xs text-slate-500">
            No Current Affairs modules created yet. Click "Create Current Affairs Module" above.
          </div>
        ) : (
          items.map((item) => {
            let qCount = 0;
            try {
              const parsed = JSON.parse(item.questions_json);
              qCount = Array.isArray(parsed) ? parsed.length : 0;
            } catch {
              qCount = 0;
            }

            return (
              <Card
                key={item.id}
                className="bg-white border-2 border-emerald-100 hover:border-emerald-400 rounded-3xl p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 text-xs font-bold flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {item.published_date}
                    </Badge>
                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline" className="text-xs font-bold text-slate-600">
                        {qCount} MCQs Created
                      </Badge>
                      <button
                        onClick={(e) => handleDeleteModule(item.id, e)}
                        title="Delete Module"
                        className="p-1 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 leading-snug">
                    {item.title}
                  </h3>

                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                    {item.summary_notes}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-semibold">
                    Study Card & Mingled Test
                  </span>
                  <Button
                    size="sm"
                    onClick={() => handleOpenQuestionsModal(item)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl h-8 px-3.5 shadow-sm gap-1"
                  >
                    <BookOpen className="h-3.5 w-3.5" />
                    <span>View & Manage Questions</span>
                  </Button>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* MODAL 1: CREATE CURRENT AFFAIRS CARD WITH CALENDAR DATE PICKER */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Globe className="h-4 w-4 text-emerald-600" />
                <span>Create Current Affairs Module</span>
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateModule} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Module Title *</label>
                <Input
                  placeholder="e.g. National Summits, G20 & Defense News Bulletin"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                  className="bg-slate-50 text-xs rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Publication Date *</span>
                  </label>
                  {/* Calendar Input */}
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Target Question Count</label>
                  <Input
                    type="number"
                    min={1}
                    max={30}
                    value={newQCount}
                    onChange={(e) => setNewQCount(Number(e.target.value))}
                    required
                    className="bg-slate-50 text-xs font-bold rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Study Text / News Summary Notes *</label>
                <textarea
                  rows={4}
                  placeholder="Enter the factual news points, appointments, awards, and summits that aspirants must study before taking the test..."
                  value={newSummary}
                  onChange={(e) => setNewSummary(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateModal(false)}
                  className="border-slate-300 text-xs rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl px-4"
                >
                  {saving ? 'Creating...' : 'Create Module'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: VIEW, MANAGE, EDIT & DELETE QUESTIONS FOR MODULE */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {selectedItem.title}
                </h3>
                <p className="text-xs text-slate-500">
                  View, edit, or delete existing questions. All options are shuffled automatically in student test mode.
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedItem(null)}
                className="text-xs border-slate-300 rounded-xl"
              >
                Close
              </Button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              {/* List of Existing Questions */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Existing Questions ({moduleQuestions.length})
                  </h4>
                </div>

                {moduleQuestions.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 text-center">
                    No questions added yet. Use the form below to enter the first question.
                  </div>
                ) : (
                  moduleQuestions.map((q, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-2 relative"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-800">
                          Q{idx + 1}. Correct: Option {q.correct_opt}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleStartEditQuestion(idx, q)}
                            title="Edit Question"
                            className="p-1 rounded-lg hover:bg-blue-50 text-slate-500 hover:text-blue-600 transition"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteQuestion(idx)}
                            title="Delete Question"
                            className="p-1 rounded-lg hover:bg-rose-50 text-slate-500 hover:text-rose-600 transition"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      <p className="text-xs font-bold text-slate-900">{q.question_text}</p>

                      <div className="grid grid-cols-2 gap-1.5 text-[11px] text-slate-700">
                        <div className={`p-1.5 rounded-lg border ${q.correct_opt === 'A' ? 'bg-emerald-50 border-emerald-300 font-bold' : 'bg-white border-slate-200'}`}>
                          A: {q.opt_a}
                        </div>
                        <div className={`p-1.5 rounded-lg border ${q.correct_opt === 'B' ? 'bg-emerald-50 border-emerald-300 font-bold' : 'bg-white border-slate-200'}`}>
                          B: {q.opt_b}
                        </div>
                        <div className={`p-1.5 rounded-lg border ${q.correct_opt === 'C' ? 'bg-emerald-50 border-emerald-300 font-bold' : 'bg-white border-slate-200'}`}>
                          C: {q.opt_c}
                        </div>
                        <div className={`p-1.5 rounded-lg border ${q.correct_opt === 'D' ? 'bg-emerald-50 border-emerald-300 font-bold' : 'bg-white border-slate-200'}`}>
                          D: {q.opt_d}
                        </div>
                      </div>

                      {q.explanation && (
                        <p className="text-[10px] text-slate-500 pt-1">
                          Explanation: {q.explanation}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Form 1: Edit Question (if active) */}
              {editingQIndex !== null ? (
                <form onSubmit={handleSaveEditQuestion} className="space-y-3 bg-blue-50/60 p-4 rounded-2xl border border-blue-200">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-blue-900">Editing Question #{editingQIndex + 1}</h4>
                    <button
                      type="button"
                      onClick={() => setEditingQIndex(null)}
                      className="text-xs text-slate-500 hover:text-slate-800 font-bold"
                    >
                      Cancel Edit
                    </button>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Question Statement *</label>
                    <textarea
                      rows={2}
                      value={editQText}
                      onChange={(e) => setEditQText(e.target.value)}
                      required
                      className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Input placeholder="Option A" value={editOptA} onChange={(e) => setEditOptA(e.target.value)} required className="bg-white text-xs" />
                    <Input placeholder="Option B" value={editOptB} onChange={(e) => setEditOptB(e.target.value)} required className="bg-white text-xs" />
                    <Input placeholder="Option C" value={editOptC} onChange={(e) => setEditOptC(e.target.value)} required className="bg-white text-xs" />
                    <Input placeholder="Option D" value={editOptD} onChange={(e) => setEditOptD(e.target.value)} required className="bg-white text-xs" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Correct Option</label>
                      <select
                        value={editCorrectOpt}
                        onChange={(e) => setEditCorrectOpt(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs font-bold text-slate-900"
                      >
                        <option value="A">Option A</option>
                        <option value="B">Option B</option>
                        <option value="C">Option C</option>
                        <option value="D">Option D</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Explanation</label>
                      <Input
                        placeholder="Context or explanation"
                        value={editExplanation}
                        onChange={(e) => setEditExplanation(e.target.value)}
                        className="bg-white text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setEditingQIndex(null)}
                      className="text-xs rounded-xl"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={savingEditQ}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl"
                    >
                      {savingEditQ ? 'Saving...' : 'Save Question'}
                    </Button>
                  </div>
                </form>
              ) : (
                /* Form 2: Add New Question */
                <form onSubmit={handleAddQuestion} className="space-y-3 bg-slate-50/80 p-4 rounded-2xl border border-slate-200">
                  <h4 className="text-xs font-bold text-slate-900">+ Add New Question to this Module</h4>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Question Statement *</label>
                    <textarea
                      rows={2}
                      placeholder="Enter factual question based on the news summary..."
                      value={qText}
                      onChange={(e) => setQText(e.target.value)}
                      required
                      className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Input placeholder="Option A" value={optA} onChange={(e) => setOptA(e.target.value)} required className="bg-white text-xs" />
                    <Input placeholder="Option B" value={optB} onChange={(e) => setOptB(e.target.value)} required className="bg-white text-xs" />
                    <Input placeholder="Option C" value={optC} onChange={(e) => setOptC(e.target.value)} required className="bg-white text-xs" />
                    <Input placeholder="Option D" value={optD} onChange={(e) => setOptD(e.target.value)} required className="bg-white text-xs" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Correct Option</label>
                      <select
                        value={correctOpt}
                        onChange={(e) => setCorrectOpt(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs font-bold text-slate-900"
                      >
                        <option value="A">Option A</option>
                        <option value="B">Option B</option>
                        <option value="C">Option C</option>
                        <option value="D">Option D</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Explanation</label>
                      <Input
                        placeholder="Context or explanation"
                        value={explanation}
                        onChange={(e) => setExplanation(e.target.value)}
                        className="bg-white text-xs"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={savingQ}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl h-9"
                  >
                    {savingQ ? 'Saving Question...' : '+ Add Question to Module'}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
