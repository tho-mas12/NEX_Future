import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Play,
  RotateCcw,
  ArrowLeft,
  Search,
  BookOpen,
  Loader2,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { apiRequest } from '@/lib/api';

interface CompletedLesson {
  lesson_id: string;
  title: string;
  subject: string;
  topic_title: string;
  youtube_embed_id: string;
  day_sequence: number;
  completed_at?: string | null;
  status: string;
  score: number;
}

interface DayGroup {
  day_number: number;
  lessons: CompletedLesson[];
}

interface CompletedResponse {
  total_days: number;
  days: DayGroup[];
}

export const UserCompletedLessonsPage: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<CompletedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('ALL');

  useEffect(() => {
    fetchCompleted();
  }, []);

  const fetchCompleted = async () => {
    setLoading(true);
    try {
      const res = await apiRequest<CompletedResponse>('/completed-lessons');
      setData(res);
    } catch (err: any) {
      console.error('Error fetching completed lessons:', err);
    } finally {
      setLoading(false);
    }
  };

  const subjects = ['ALL', 'Quantitative Aptitude', 'General Intelligence & Reasoning', 'English Comprehension', 'General Awareness'];

  const filteredDays = (data?.days || [])
    .map((d) => {
      const filteredLessons = d.lessons.filter((l) => {
        const matchesSearch =
          l.title.toLowerCase().includes(search.toLowerCase()) ||
          l.subject.toLowerCase().includes(search.toLowerCase());
        const matchesSubject =
          selectedSubject === 'ALL' ||
          l.subject.toLowerCase().includes(selectedSubject.toLowerCase().split(' ')[0]);
        return matchesSearch && matchesSubject;
      });
      return {
        ...d,
        lessons: filteredLessons,
      };
    })
    .filter((d) => d.lessons.length > 0);

  const totalLessons = (data?.days || []).reduce((acc, d) => acc + d.lessons.length, 0);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt="NEX Logo"
                className="h-11 w-11 object-contain rounded-xl shadow-sm border border-slate-200/80 shrink-0"
              />
              <div>
                <span className="font-black text-xl tracking-tight text-slate-900 inline">
                  NEX
                </span>
                <span className="hidden sm:inline-block ml-2 text-[10px] bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold px-2 py-0.5 rounded-full uppercase">
                  Completed Lessons Archive
                </span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <Link to="/dashboard">
              <Button variant="outline" className="text-xs font-bold border-slate-200 rounded-xl h-9 gap-1.5 shadow-sm">
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Daily Rail</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Banner */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Day-Wise Revision & Re-attendance Library
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Completed Lessons Archive
            </h1>
            <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
              Every lesson you complete on the 180-Day Rail is permanently archived here. You can re-open any lesson to re-watch the video lecture on big screen, review short tricks, and re-attempt practice tests anytime.
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center shrink-0">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Archived Modules</span>
            <strong className="text-2xl font-black text-emerald-700">{totalLessons} Lessons</strong>
          </div>
        </div>

        {/* Search & Subject Filter Tabs */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search completed lessons by title or subject..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 h-10 text-xs bg-white border border-slate-200 shadow-sm rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto p-1 bg-white border border-slate-200 rounded-xl shadow-sm">
            {subjects.map((s) => (
              <button
                key={s}
                onClick={() => setSelectedSubject(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                  selectedSubject === s
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {s === 'ALL' ? 'All Subjects' : s.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Day-Wise Lessons Display */}
        {loading ? (
          <div className="p-16 text-center text-xs text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
            Loading completed day-wise rail modules...
          </div>
        ) : filteredDays.length === 0 ? (
          <div className="p-16 text-center bg-white rounded-3xl border border-slate-200 text-xs text-slate-500 space-y-2">
            <BookOpen className="w-8 h-8 text-slate-400 mx-auto mb-1" />
            <p className="font-bold text-slate-800 text-sm">No completed lessons found</p>
            <p className="text-slate-500">
              {search ? 'Try clearing your search query.' : 'Complete daily lessons on your study rail to build your revision archive!'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredDays.map((dayGroup) => (
              <div key={dayGroup.day_number} className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-7 px-3 rounded-xl bg-blue-600 text-white font-black text-xs flex items-center justify-center shadow-sm">
                    Day {dayGroup.day_number}
                  </div>
                  <span className="text-xs font-bold text-slate-700">
                    {dayGroup.lessons.length} {dayGroup.lessons.length === 1 ? 'Lesson' : 'Lessons'} Assigned
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {dayGroup.lessons.map((lesson) => {
                    const isGS = lesson.subject.toLowerCase().includes('general') || lesson.subject.toLowerCase().includes('awareness') || lesson.subject.toLowerCase().includes('gk');
                    const isReasoning = lesson.subject.toLowerCase().includes('reasoning');
                    const isQuant = lesson.subject.toLowerCase().includes('quant') || lesson.subject.toLowerCase().includes('math');

                    let badgeColor = 'bg-blue-50 text-blue-700 border-blue-200';
                    if (isGS) badgeColor = 'bg-emerald-50 text-emerald-800 border-emerald-200';
                    else if (isQuant) badgeColor = 'bg-orange-50 text-orange-700 border-orange-200';
                    else if (isReasoning) badgeColor = 'bg-purple-50 text-purple-700 border-purple-200';

                    return (
                      <Card
                        key={lesson.lesson_id}
                        className="bg-white border border-slate-200 hover:border-blue-400 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Badge className={`text-[10px] font-bold ${badgeColor}`}>
                              {lesson.subject}
                            </Badge>
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                              <CheckCircle2 className="h-3.5 w-3.5" /> Completed
                            </span>
                          </div>

                          <h3 className="text-base font-bold text-slate-900 leading-snug">
                            {lesson.title}
                          </h3>

                          <p className="text-xs text-slate-500">
                            Topic: {lesson.topic_title}
                          </p>
                        </div>

                        <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-[11px] text-slate-400 flex items-center gap-1 font-semibold">
                            <Play className="h-3 w-3 text-blue-600" /> Big Screen Ready
                          </span>

                          <Button
                            onClick={() => navigate(`/study/${lesson.lesson_id}`)}
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl h-8 px-3.5 shadow-sm gap-1"
                          >
                            <RotateCcw className="h-3 w-3" />
                            <span>Re-attend Lesson</span>
                          </Button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
