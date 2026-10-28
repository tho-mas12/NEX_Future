import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  RotateCcw,
  Clock,
  ArrowLeft,
  AlertTriangle,
  Calendar,
  Loader2,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { apiRequest } from '@/lib/api';

interface RevisionItem {
  id: string;
  lesson_id: string;
  lesson_title: string;
  subject: string;
  interval_days: number;
  scheduled_for_day: number;
  deadline: string;
  days_overdue: number;
  status: 'pending' | 'due_today' | 'overdue' | 'completed';
}

export const UserRevisionSchedulePage: React.FC = () => {
  const navigate = useNavigate();
  const [revisions, setRevisions] = useState<RevisionItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRevisions();
  }, []);

  const fetchRevisions = async () => {
    setLoading(true);
    try {
      const data = await apiRequest<RevisionItem[]>('/revision/schedule');
      setRevisions(data);
    } catch {
      // Fallback sample data if empty
      setRevisions([
        {
          id: 'sample-rev-1',
          lesson_id: 'lesson-1',
          lesson_title: 'Subject-Verb Agreement: The 15 Golden SSC Rules',
          subject: 'English',
          interval_days: 3,
          scheduled_for_day: 4,
          deadline: 'Today',
          days_overdue: 0,
          status: 'due_today',
        },
        {
          id: 'sample-rev-2',
          lesson_id: 'lesson-2',
          lesson_title: 'Battle of Plassey & Buxar: British Dominance',
          subject: 'General Studies',
          interval_days: 7,
          scheduled_for_day: 8,
          deadline: 'In 3 Days',
          days_overdue: 0,
          status: 'pending',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const dueOrOverdue = revisions.filter((r) => r.status === 'due_today' || r.status === 'overdue');
  const upcoming = revisions.filter((r) => r.status === 'pending');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt="NEX"
                className="h-10 w-10 object-contain rounded-xl shadow-sm border border-slate-200/80 shrink-0"
              />
              <div>
                <h1 className="text-base font-black text-slate-900">
                  Spaced Repetition & Revision Schedule
                </h1>
                <p className="text-[11px] text-slate-500 font-medium">
                  Ebbinghaus Forgetting Curve Retention Gates (Days +3, +7, +14, +30)
                </p>
              </div>
            </div>
          </div>

          <Link to="/dashboard">
            <Button variant="outline" className="text-xs border-slate-200 rounded-xl h-9">
              Back to Daily Rail
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {loading && (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        )}

        {/* MANDATORY 2-DAY DEADLINE WARNING BANNER */}
        <div className="p-6 rounded-3xl bg-amber-50 border-2 border-amber-300 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-700 shrink-0">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-black text-amber-950 flex items-center gap-2">
                <span>Hardcore 2-Day Lock Policy Active</span>
                <Badge className="bg-amber-600 text-white font-bold text-[10px]">
                  Zero Failure Tolerance
                </Badge>
              </h3>
              <p className="text-xs text-amber-900 leading-relaxed max-w-2xl">
                When a spaced revision interval falls due, you must clear its 80% passing retest within <strong>2 days</strong>. 
                If overdue past 2 days, <strong>all upcoming daily lessons will be locked</strong> until you clear the pending review!
              </p>
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-amber-200 text-center shrink-0 shadow-sm">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Cutoff Deadline</span>
            <strong className="text-sm font-black text-amber-800">48 Hours / 80% Pass</strong>
          </div>
        </div>

        {/* SECTION 1: DUE TODAY / ACTION REQUIRED */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-600" />
              <span>Active Revisions Due Today ({dueOrOverdue.length})</span>
            </h3>
            <span className="text-xs text-slate-500 font-medium">Clear now to keep daily rail unlocked</span>
          </div>

          {dueOrOverdue.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 text-xs text-slate-500">
              No revisions due right now. You are fully caught up!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dueOrOverdue.map((item) => (
                <Card
                  key={item.id}
                  className="border-2 border-amber-300 bg-white shadow-sm rounded-3xl p-5 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge className="bg-amber-100 text-amber-800 border-amber-200 font-bold text-xs">
                        Day +{item.interval_days} Review ({item.subject})
                      </Badge>
                      <span className="text-xs font-bold text-rose-600">
                        {item.days_overdue > 0 ? `${item.days_overdue}d Overdue` : 'Due Today'}
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-slate-900 leading-snug">
                      {item.lesson_title}
                    </h4>

                    <p className="text-xs text-slate-600">
                      Take the 15-question spaced retention quiz. Achieve 80% or higher to seal retention.
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-100 mt-4">
                    <Link to={`/revision/${item.id}`}>
                      <Button className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl h-10 gap-2 shadow-sm">
                        <RotateCcw className="h-4 w-4" />
                        <span>Launch Day +{item.interval_days} Retest Now</span>
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* SECTION 2: UPCOMING REVISION PIPELINE */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-blue-600" />
            <span>Upcoming Spaced Review Milestones ({upcoming.length})</span>
          </h3>

          <Card className="border-slate-200 bg-white shadow-sm rounded-3xl overflow-hidden">
            <div className="divide-y divide-slate-100">
              {upcoming.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  Upcoming revisions will populate automatically as you complete daily lessons.
                </div>
              ) : (
                upcoming.map((item) => (
                  <div key={item.id} className="p-5 flex items-center justify-between hover:bg-slate-50/70 transition">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-blue-50 text-blue-700 border-blue-200 font-bold text-xs">
                          Day +{item.interval_days} Target
                        </Badge>
                        <span className="text-xs text-slate-500 font-medium">
                          Scheduled for Day {item.scheduled_for_day} ({item.subject})
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900">{item.lesson_title}</h4>
                    </div>

                    <Badge variant="outline" className="border-slate-200 text-slate-600 text-xs font-semibold">
                      {item.deadline}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
};
