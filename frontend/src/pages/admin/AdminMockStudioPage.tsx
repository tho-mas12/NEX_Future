import React, { useState, useEffect } from 'react';
import {
  Award,
  Plus,
  Lock,
  Unlock,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { apiRequest } from '@/lib/api';

interface MockCardItem {
  id: string;
  title: string;
  day_number: number;
  duration_mins: number;
  total_questions: number;
  pos_marks: number;
  neg_marks: number;
  is_active: boolean;
  is_gated: boolean;
  questions: Array<{
    question_text: string;
    opt_a: string;
    opt_b: string;
    opt_c: string;
    opt_d: string;
    correct_opt: string;
    explanation?: string;
  }>;
}

export const AdminMockStudioPage: React.FC = () => {
  const [mocks, setMocks] = useState<MockCardItem[]>([]);
  const [loading, setLoading] = useState(true);

  // New Mock Card Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDay, setNewDay] = useState(7);
  const [newDuration, setNewDuration] = useState(15);
  const [newTotalQ, setNewTotalQ] = useState(25);
  const [newPosMarks, setNewPosMarks] = useState(2.0);
  const [newNegMarks, setNewNegMarks] = useState(0.5);
  const [newIsGated, setNewIsGated] = useState(true);
  const [creating, setCreating] = useState(false);

  // Manual Question Entry Modal
  const [selectedMock, setSelectedMock] = useState<MockCardItem | null>(null);
  const [qText, setQText] = useState('');
  const [optA, setOptA] = useState('');
  const [optB, setOptB] = useState('');
  const [optC, setOptC] = useState('');
  const [optD, setOptD] = useState('');
  const [correctOpt, setCorrectOpt] = useState('A');
  const [explanation, setExplanation] = useState('');
  const [savingQuestion, setSavingQuestion] = useState(false);

  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchMocks();
  }, []);

  const fetchMocks = async () => {
    setLoading(true);
    try {
      const data = await apiRequest<MockCardItem[]>('/admin/mocks');
      setMocks(data);
    } catch (err: any) {
      console.error('Failed to load mocks:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      await apiRequest('/admin/mocks', {
        method: 'POST',
        body: JSON.stringify({
          title: newTitle.trim(),
          day_number: Number(newDay),
          duration_mins: Number(newDuration),
          total_questions: Number(newTotalQ),
          pos_marks: Number(newPosMarks),
          neg_marks: Number(newNegMarks),
          is_gated: newIsGated,
        }),
      });

      setSuccessMsg(`Mock Test Card for Day ${newDay} created successfully!`);
      setShowCreateModal(false);
      setNewTitle('');
      fetchMocks();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Error creating mock card');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleGate = async (mockId: string) => {
    try {
      const res = await apiRequest<{ success: boolean; is_gated: boolean }>(`/admin/mocks/${mockId}/toggle-gate`, {
        method: 'POST',
      });
      setMocks((prev) =>
        prev.map((m) => (m.id === mockId ? { ...m, is_gated: res.is_gated } : m))
      );
    } catch (err: any) {
      alert(err.message || 'Failed to toggle gating');
    }
  };

  const handleAddQuestionToMock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMock || !qText.trim()) return;
    setSavingQuestion(true);
    try {
      await apiRequest(`/admin/mocks/${selectedMock.id}/questions`, {
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

      setSuccessMsg('Question injected into mock test!');
      setQText('');
      setOptA('');
      setOptB('');
      setOptC('');
      setOptD('');
      setExplanation('');
      fetchMocks();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Error adding question');
    } finally {
      setSavingQuestion(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold mb-2">
            <Award className="h-3.5 w-3.5" />
            Full Exam Conditioning
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Mock Tests Studio</h1>
          <p className="text-xs text-slate-600 mt-1">
            Configure scheduled Day Checkpoint Mocks, enable gating locks, and author manual questions.
          </p>
        </div>

        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl h-10 gap-1.5 shadow-sm"
        >
          <Plus className="h-4 w-4" />
          <span>Create Day Mock Card</span>
        </Button>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 shadow-sm">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* MOCK CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full p-12 text-center text-slate-500 flex items-center justify-center gap-2 bg-white rounded-3xl border border-slate-200">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            <span>Loading scheduled mock tests...</span>
          </div>
        ) : mocks.length === 0 ? (
          <div className="col-span-full p-12 text-center bg-white rounded-3xl border border-slate-200 text-xs text-slate-500">
            No mock test cards created yet. Click "Create Day Mock Card" to publish your first mock.
          </div>
        ) : (
          mocks.map((mock) => (
            <Card
              key={mock.id}
              className="border-2 border-slate-200 hover:border-blue-500 bg-white shadow-sm rounded-3xl p-6 flex flex-col justify-between transition-all"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge className="bg-blue-50 text-blue-700 border-blue-200 font-bold text-xs">
                    Publishes on Day {mock.day_number}
                  </Badge>
                  <button
                    onClick={() => handleToggleGate(mock.id)}
                    className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border transition ${
                      mock.is_gated
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                    title="Click to toggle mandatory completion lock"
                  >
                    {mock.is_gated ? (
                      <>
                        <Lock className="h-3 w-3" />
                        <span>Gating Lock: ON</span>
                      </>
                    ) : (
                      <>
                        <Unlock className="h-3 w-3" />
                        <span>Gating Lock: OFF</span>
                      </>
                    )}
                  </button>
                </div>

                <div>
                  <h3 className="text-base font-black text-slate-900 leading-snug line-clamp-2">
                    {mock.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {mock.is_gated
                      ? 'Students must complete this mock test to unlock Day ' + (mock.day_number + 1)
                      : 'Optional practice checkpoint (Next days stay accessible)'}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200 text-center text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Duration</span>
                    <strong className="text-slate-900 font-bold">{mock.duration_mins} Mins</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Questions</span>
                    <strong className="text-slate-900 font-bold">{mock.total_questions} Qs</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Marking</span>
                    <strong className="text-emerald-700 font-bold">+{mock.pos_marks} / -{mock.neg_marks}</strong>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-semibold">
                  {mock.questions.length} questions entered
                </span>
                <Button
                  size="sm"
                  onClick={() => setSelectedMock(mock)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl h-8 px-3 shadow-sm"
                >
                  Enter Questions
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* MODAL 1: CREATE MOCK CARD */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900">Create Mock Test Card</h3>
            <form onSubmit={handleCreateMock} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Mock Test Title *</label>
                <Input
                  placeholder="e.g., Weekly Sectional Mock Arena #1"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                  className="bg-slate-50 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Publish On Day *</label>
                  <Input
                    type="number"
                    min={1}
                    max={180}
                    value={newDay}
                    onChange={(e) => setNewDay(Number(e.target.value))}
                    required
                    className="bg-slate-50 text-xs font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Duration (Minutes)</label>
                  <Input
                    type="number"
                    value={newDuration}
                    onChange={(e) => setNewDuration(Number(e.target.value))}
                    required
                    className="bg-slate-50 text-xs font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Questions Count</label>
                  <Input
                    type="number"
                    value={newTotalQ}
                    onChange={(e) => setNewTotalQ(Number(e.target.value))}
                    className="bg-slate-50 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Positive Mark</label>
                  <Input
                    type="number"
                    step="0.5"
                    value={newPosMarks}
                    onChange={(e) => setNewPosMarks(Number(e.target.value))}
                    className="bg-slate-50 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Negative Mark</label>
                  <Input
                    type="number"
                    step="0.25"
                    value={newNegMarks}
                    onChange={(e) => setNewNegMarks(Number(e.target.value))}
                    className="bg-slate-50 text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <input
                  type="checkbox"
                  id="gatedCheck"
                  checked={newIsGated}
                  onChange={(e) => setNewIsGated(e.target.checked)}
                  className="rounded text-blue-600"
                />
                <label htmlFor="gatedCheck" className="text-xs font-bold text-slate-800 cursor-pointer">
                  Enable Gating Lock (Student must clear this test to unlock next days)
                </label>
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
                  disabled={creating}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl"
                >
                  {creating ? 'Publishing...' : 'Create Mock'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: MANUAL QUESTION ENTRY FOR SELECTED MOCK */}
      {selectedMock && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Author Questions for: {selectedMock.title}
                </h3>
                <p className="text-xs text-slate-500">
                  Scheduled for Day {selectedMock.day_number} • Currently {selectedMock.questions.length} questions entered
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedMock(null)}
                className="text-xs border-slate-300 rounded-xl"
              >
                Close
              </Button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <form onSubmit={handleAddQuestionToMock} className="space-y-3 bg-slate-50/70 p-4 rounded-2xl border border-slate-200">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Question Problem Statement *</label>
                  <textarea
                    rows={2}
                    placeholder="Enter question text..."
                    value={qText}
                    onChange={(e) => setQText(e.target.value)}
                    required
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
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
                      placeholder="Step-by-step resolution explanation"
                      value={explanation}
                      onChange={(e) => setExplanation(e.target.value)}
                      className="bg-white text-xs"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={savingQuestion}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl h-9"
                >
                  {savingQuestion ? 'Injecting Question...' : '+ Add Question to Test'}
                </Button>
              </form>

              {/* Existing questions preview */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Test Question Pool ({selectedMock.questions.length})
                </h4>
                {selectedMock.questions.map((q, i) => (
                  <div key={i} className="p-3 bg-white border border-slate-200 rounded-xl text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-blue-700">Q{i + 1}</span>
                      <span className="font-bold text-emerald-700">Correct: {q.correct_opt}</span>
                    </div>
                    <p className="text-slate-800">{q.question_text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
