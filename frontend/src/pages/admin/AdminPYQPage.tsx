import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Plus,
  Trash2,
  Download,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { apiRequest } from '@/lib/api';

interface PYQItem {
  id: string;
  year: number;
  title: string;
  exam_type: string;
  tier: string;
  shift_info: string;
  pdf_url: string;
  created_at: string;
}

export const AdminPYQPage: React.FC = () => {
  const [pyqs, setPyqs] = useState<PYQItem[]>([]);
  const [loading, setLoading] = useState(true);

  // New PYQ modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newYear, setNewYear] = useState(2024);
  const [newTitle, setNewTitle] = useState('');
  const [newTier, setNewTier] = useState('Tier 1');
  const [newShift, setNewShift] = useState('All 39 Shifts Solved Paper');
  const [newPdfUrl, setNewPdfUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  const [selectedYearFilter, setSelectedYearFilter] = useState<number | 'ALL'>('ALL');

  useEffect(() => {
    fetchPYQs();
  }, []);

  const fetchPYQs = async () => {
    setLoading(true);
    try {
      const data = await apiRequest<PYQItem[]>('/admin/pyqs');
      setPyqs(data);
    } catch (err: any) {
      console.error('Failed to load PYQs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePYQ = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setSaving(true);
    try {
      await apiRequest('/admin/pyqs', {
        method: 'POST',
        body: JSON.stringify({
          year: Number(newYear),
          title: newTitle.trim(),
          tier: newTier,
          shift_info: newShift.trim(),
          pdf_url: newPdfUrl.trim() || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        }),
      });

      setSuccessBanner(`PYQ Paper for Year ${newYear} published successfully!`);
      setShowAddModal(false);
      setNewTitle('');
      setNewPdfUrl('');
      fetchPYQs();
      setTimeout(() => setSuccessBanner(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Error publishing PYQ document');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePYQ = async (id: string) => {
    if (!confirm('Are you sure you want to remove this PYQ paper?')) return;
    try {
      await apiRequest(`/admin/pyqs/${id}`, { method: 'DELETE' });
      setPyqs((prev) => prev.filter((p) => p.id !== id));
    } catch (err: any) {
      alert(err.message || 'Error deleting PYQ');
    }
  };

  const filtered = pyqs.filter(
    (p) => selectedYearFilter === 'ALL' || p.year === selectedYearFilter
  );

  const availableYears = Array.from(new Set(pyqs.map((p) => p.year))).sort((a, b) => b - a);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold mb-2">
            <FileSpreadsheet className="h-3.5 w-3.5" />
            Official Paper Repository
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Previous Year Question Bank</h1>
          <p className="text-xs text-slate-600 mt-1">
            Attach official SSC CGL & CHSL question papers, shift solutions, and formula keys year-wise.
          </p>
        </div>

        <Button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl h-10 gap-1.5 shadow-sm"
        >
          <Plus className="h-4 w-4" />
          <span>Upload / Attach PYQ Paper</span>
        </Button>
      </div>

      {successBanner && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 shadow-sm">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{successBanner}</span>
        </div>
      )}

      {/* Year Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
        <button
          onClick={() => setSelectedYearFilter('ALL')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            selectedYearFilter === 'ALL'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          All Years ({pyqs.length})
        </button>
        {availableYears.map((yr) => (
          <button
            key={yr}
            onClick={() => setSelectedYearFilter(yr)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              selectedYearFilter === yr
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            Year {yr} ({pyqs.filter((p) => p.year === yr).length})
          </button>
        ))}
      </div>

      {/* Papers Table */}
      <Card className="border-slate-200 bg-white shadow-sm rounded-3xl overflow-hidden">
        <div className="divide-y divide-slate-100">
          {loading ? (
            <div className="p-12 text-center text-slate-500 flex items-center justify-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              <span>Loading previous year papers...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs">
              No papers found for this selection. Click "Upload / Attach PYQ Paper" to add one.
            </div>
          ) : (
            filtered.map((item) => (
              <div key={item.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/70 transition">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-blue-600 text-white font-bold text-xs">
                      {item.year}
                    </Badge>
                    <Badge variant="outline" className="border-slate-300 text-slate-700 text-[11px] font-bold">
                      {item.tier}
                    </Badge>
                    <span className="text-xs text-slate-500 font-medium">
                      {item.shift_info}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 leading-snug">
                    {item.title}
                  </h3>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <a
                    href={item.pdf_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-blue-700 font-bold text-xs shadow-sm transition"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download PDF</span>
                  </a>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeletePYQ(item.id)}
                    className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 h-8 w-8 p-0 rounded-xl"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* MODAL: ADD PYQ DOCUMENT */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900">
              Attach Previous Year Paper Document
            </h3>

            <form onSubmit={handleCreatePYQ} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Exam Year *</label>
                  <Input
                    type="number"
                    min={2018}
                    max={2026}
                    value={newYear}
                    onChange={(e) => setNewYear(Number(e.target.value))}
                    required
                    className="bg-slate-50 text-xs font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Tier</label>
                  <select
                    value={newTier}
                    onChange={(e) => setNewTier(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-bold"
                  >
                    <option value="Tier 1">Tier 1 (Prelims)</option>
                    <option value="Tier 2">Tier 2 (Mains)</option>
                    <option value="Tier 1 + 2">Tier 1 + 2 Combined</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Paper Title *</label>
                <Input
                  placeholder="e.g., SSC CGL 2024 Tier 1 Official Solved Papers"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                  className="bg-slate-50 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Shift Coverage Details</label>
                <Input
                  placeholder="e.g., Shifts 1 to 39 with Official Answer Keys"
                  value={newShift}
                  onChange={(e) => setNewShift(e.target.value)}
                  className="bg-slate-50 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">PDF / Document Download URL *</label>
                <Input
                  placeholder="https://.../cgl2024_tier1.pdf"
                  value={newPdfUrl}
                  onChange={(e) => setNewPdfUrl(e.target.value)}
                  className="bg-slate-50 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddModal(false)}
                  className="border-slate-300 text-xs rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl"
                >
                  {saving ? 'Publishing...' : 'Publish Paper'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
