import React, { useState, useEffect } from 'react';
import {
  Plus,
  Upload,
  Search,
  CheckCircle2,
  X,
  FileSpreadsheet,
  Loader2,
  BookOpen,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiRequest } from '@/lib/api';

interface TopicItem {
  id: string;
  subject: string;
  title: string;
  youtube_embed_id: string;
  pdf_url?: string;
  question_count: number;
}

export const AdminTopicsPage: React.FC = () => {
  const [topics, setTopics] = useState<TopicItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  // Add Topic Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newSubject, setNewSubject] = useState('Quant');
  const [newTitle, setNewTitle] = useState('');
  const [newYoutubeId, setNewYoutubeId] = useState('');
  const [newPdfUrl, setNewPdfUrl] = useState('');
  const [creating, setCreating] = useState(false);

  // Bulk Upload MCQ Modal State
  const [selectedTopic, setSelectedTopic] = useState<TopicItem | null>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState<string | null>(null);

  const fetchTopics = async () => {
    setLoading(true);
    try {
      const data = await apiRequest<TopicItem[]>('/admin/topics');
      setTopics(data);
    } catch (err: any) {
      alert(err.message || 'Failed to fetch topics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopics();
  }, []);

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setCreating(true);

    try {
      let embedId = newYoutubeId.trim();
      if (embedId.includes('v=')) {
        embedId = embedId.split('v=')[1]?.split('&')[0] || embedId;
      } else if (embedId.includes('youtu.be/')) {
        embedId = embedId.split('youtu.be/')[1]?.split('?')[0] || embedId;
      }

      const res = await apiRequest<TopicItem>('/admin/topics', {
        method: 'POST',
        body: JSON.stringify({
          subject: newSubject,
          title: newTitle,
          youtube_embed_id: embedId || 'dQw4w9WgXcQ',
          pdf_url: newPdfUrl || undefined,
        }),
      });

      setTopics([res, ...topics]);
      setIsAddModalOpen(false);
      setNewTitle('');
      setNewYoutubeId('');
      setNewPdfUrl('');
    } catch (err: any) {
      alert(err.message || 'Error creating topic');
    } finally {
      setCreating(false);
    }
  };

  const handleUploadCsv = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTopic || !csvFile) return;
    setUploading(true);
    setUploadSuccessMsg(null);

    const formData = new FormData();
    formData.append('file', csvFile);

    try {
      const token = localStorage.getItem('examrail_token');
      const response = await fetch(`/api/admin/topics/${selectedTopic.id}/upload-mcqs`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to parse and upload questions');
      }

      const result = await response.json();
      setUploadSuccessMsg(`Successfully imported ${result.created_count} MCQs!`);
      fetchTopics();
      setTimeout(() => {
        setSelectedTopic(null);
        setCsvFile(null);
        setUploadSuccessMsg(null);
      }, 1500);
    } catch (err: any) {
      alert(err.message || 'Error during CSV import');
    } finally {
      setUploading(false);
    }
  };

  const filteredTopics = topics.filter((t) => {
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = subjectFilter === 'ALL' || t.subject === subjectFilter;
    return matchesSearch && matchesSubject;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold mb-2">
            <BookOpen className="h-3.5 w-3.5" />
            Curriculum Content & Question Hub
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Curriculum Content Hub</h1>
          <p className="text-xs text-slate-600 mt-1">
            Manage subject modules, linked video lectures, notes sheets, and batch-upload MCQ pools.
          </p>
        </div>

        <Button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs gap-1.5 shadow-sm h-10 px-5 rounded-xl"
        >
          <Plus className="h-4 w-4" />
          Add New Topic
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search topics by title or formula concept..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 text-xs bg-white border-slate-200 shadow-sm focus:border-blue-500 rounded-xl"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto p-1 bg-white border border-slate-200 rounded-xl shadow-sm">
          {['ALL', 'Quant', 'Reasoning', 'English', 'General Studies'].map((subj) => (
            <button
              key={subj}
              onClick={() => setSubjectFilter(subj)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                subjectFilter === subj
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {subj}
            </button>
          ))}
        </div>
      </div>

      {/* Topics Data Table */}
      <Card className="border-slate-200 bg-white shadow-sm rounded-2xl overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase tracking-wider font-bold text-[11px]">
                <tr>
                  <th className="p-4">Subject</th>
                  <th className="p-4">Topic Title</th>
                  <th className="p-4">Lecture Embed ID</th>
                  <th className="p-4">MCQs Active</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                        <span>Loading topics from database...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredTopics.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500 font-medium">
                      No topics found matching your criteria. Click "Add New Topic" to create one.
                    </td>
                  </tr>
                ) : (
                  filteredTopics.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-bold border border-blue-200/60 text-[11px]">
                          {t.subject}
                        </span>
                      </td>
                      <td className="p-4 font-bold text-slate-900 max-w-sm">
                        {t.title}
                      </td>
                      <td className="p-4 text-slate-500 font-mono text-[11px]">
                        {t.youtube_embed_id || '—'}
                      </td>
                      <td className="p-4">
                        <span className="font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full text-[11px]">
                          {t.question_count} Questions
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedTopic(t)}
                          className="text-xs border-slate-200 hover:border-blue-400 hover:text-blue-600 gap-1.5 h-8 bg-white shadow-sm"
                        >
                          <FileSpreadsheet className="h-3.5 w-3.5 text-blue-600" />
                          <span>Upload MCQs</span>
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* MODAL 1: ADD TOPIC */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 max-w-md w-full rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Create Curriculum Topic</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTopic} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Subject Stream</label>
                <select
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Quant">Quantitative Aptitude</option>
                  <option value="Reasoning">General Intelligence & Reasoning</option>
                  <option value="English">English Language & Comprehension</option>
                  <option value="General Studies">General Studies & Awareness</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Topic Title</label>
                <Input
                  placeholder="e.g., Simple Interest: Installment & Net Rate Shortcuts"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="bg-slate-50 border-slate-300 text-slate-900 rounded-xl"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  YouTube Video Link or Embed ID
                </label>
                <Input
                  placeholder="e.g., dQw4w9WgXcQ or https://youtube.com/watch?v=..."
                  value={newYoutubeId}
                  onChange={(e) => setNewYoutubeId(e.target.value)}
                  className="bg-slate-50 border-slate-300 text-slate-900 rounded-xl"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Summary Notes PDF Link (Optional)
                </label>
                <Input
                  placeholder="https://.../notes.pdf"
                  value={newPdfUrl}
                  onChange={(e) => setNewPdfUrl(e.target.value)}
                  className="bg-slate-50 border-slate-300 text-slate-900 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddModalOpen(false)}
                  className="border-slate-200 text-slate-700 text-xs rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={creating}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl"
                >
                  {creating ? 'Saving Topic...' : 'Save & Publish'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: BULK CSV UPLOAD MCQs */}
      {selectedTopic && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 max-w-md w-full rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Batch Upload MCQs</h3>
                <p className="text-xs text-slate-500 truncate max-w-xs">
                  {selectedTopic.title}
                </p>
              </div>
              <button
                onClick={() => setSelectedTopic(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {uploadSuccessMsg ? (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                <span className="font-bold">{uploadSuccessMsg}</span>
              </div>
            ) : (
              <form onSubmit={handleUploadCsv} className="space-y-4">
                <div className="p-6 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 text-center space-y-2">
                  <FileSpreadsheet className="h-8 w-8 text-blue-600 mx-auto" />
                  <p className="text-xs text-slate-900 font-bold">
                    Upload CSV File with Questions
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Columns: question_text, opt_a, opt_b, opt_c, opt_d, correct_opt, explanation
                  </p>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                    className="text-xs text-slate-600 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-blue-600 file:text-white file:font-semibold file:cursor-pointer"
                    required
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setSelectedTopic(null)}
                    className="border-slate-200 text-slate-700 text-xs rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={uploading || !csvFile}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold gap-1.5 rounded-xl"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Injecting MCQs...
                      </>
                    ) : (
                      <>
                        <Upload className="h-3.5 w-3.5" />
                        Inject into Pool
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};