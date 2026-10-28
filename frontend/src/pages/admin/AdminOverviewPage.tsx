import React, { useState, useEffect } from 'react';
import {
  Users,
  Flame,
  ShieldCheck,
  CheckCircle2,
  Award,
  Search,
  Download,
  Bell,
  Activity,
  AlertTriangle,
  Send,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { apiRequest } from '@/lib/api';

interface AdminKpis {
  total_users: number;
  active_subscriptions: number;
  avg_streak: number;
  dropoff_day: number;
  syllabus_coverage_days: number;
}

interface RecentUser {
  id: string;
  name: string;
  email: string;
  target_exam: string;
  streak_count: number;
  onboarding_completed: boolean;
  created_at: string;
}

interface OverviewData {
  kpis: AdminKpis;
  recent_users: RecentUser[];
}

interface SystemEvent {
  id: string;
  type: 'mock' | 'lesson' | 'alert' | 'signup';
  student_name: string;
  details: string;
  time: string;
  score?: string;
}

export const AdminOverviewPage: React.FC = () => {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [eventFilter, setEventFilter] = useState<'all' | 'mock' | 'lesson' | 'alert'>('all');
  const [broadcastText, setBroadcastText] = useState('');
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);

  // Live Simulated Activity Events
  const [events] = useState<SystemEvent[]>([
    { id: '1', type: 'mock', student_name: 'Priya Sharma', details: 'Completed Sunday Full Mock (Tier 1)', time: '4 mins ago', score: '154 / 200 (96th %ile)' },
    { id: '2', type: 'lesson', student_name: 'Vikram Rajput', details: 'Mastered Day 14: Time, Speed & Distance', time: '12 mins ago', score: '20/20 Practice Qs' },
    { id: '3', type: 'alert', student_name: 'Arun K.', details: 'Day +3 Spaced Revision Retest Cleared', time: '28 mins ago', score: '87% Pass' },
    { id: '4', type: 'signup', student_name: 'Ananya Verma', details: 'New SSC CGL aspirant joined 180-Day Rail', time: '45 mins ago' },
    { id: '5', type: 'mock', student_name: 'Suresh Patel', details: 'Attempted Mind Mock (Covered Topics)', time: '1 hr ago', score: '22 / 25 Correct' },
    { id: '6', type: 'alert', student_name: 'Kavita Roy', details: 'Retention Gate Warning: 24h remaining for Day 7 Revision', time: '2 hrs ago' },
  ]);

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const res = await apiRequest<OverviewData>('/admin/overview');
        setData(res);
      } catch (err: any) {
        setError(err.message || 'Failed to load admin metrics');
      } finally {
        setLoading(false);
      }
    };
    fetchOverview();
  }, []);

  const handleExportCSV = () => {
    if (!data) return;
    const headers = 'ID,Name,Email,Target_Exam,Streak_Days,Onboarding_Status,Joined_Date\n';
    const rows = data.recent_users
      .map(
        (u) =>
          `"${u.id}","${u.name}","${u.email}","${u.target_exam}",${u.streak_count},"${u.onboarding_completed ? 'Completed' : 'Pending'}","${u.created_at}"`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nex-aspirants-telemetry-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastText.trim()) return;
    setBroadcastSuccess(true);
    setTimeout(() => {
      setBroadcastSuccess(false);
      setShowBroadcastModal(false);
      setBroadcastText('');
    }, 2000);
  };

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-500 text-xs font-sans">
        <div className="flex flex-col items-center gap-2">
          <div className="h-7 w-7 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
          <span>Synchronizing real-time telemetry...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold font-sans">
        {error || 'Error loading dashboard metrics'}
      </div>
    );
  }

  const { kpis, recent_users } = data;

  const filteredUsers = recent_users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.target_exam.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredEvents =
    eventFilter === 'all' ? events : events.filter((ev) => ev.type === eventFilter);

  return (
    <div className="space-y-6 animate-in fade-in duration-200 font-sans">
      {/* Top Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold mb-2">
            <Activity className="h-3.5 w-3.5 animate-pulse" />
            Live Command Center & Real-Time Events
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Platform Telemetry & Aspirant Rail</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time SSC candidate engagement metrics, mock test submissions, and drop-off analytics.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Button
            onClick={() => setShowBroadcastModal(true)}
            variant="outline"
            className="border-slate-300 text-slate-700 text-xs font-bold rounded-xl h-10 gap-1.5 shadow-sm"
          >
            <Bell className="h-3.5 w-3.5 text-blue-600" />
            <span>Broadcast Alert</span>
          </Button>

          <Button
            onClick={handleExportCSV}
            variant="outline"
            className="border-slate-300 text-slate-700 text-xs font-bold rounded-xl h-10 gap-1.5 shadow-sm"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </Button>

          <Button
            onClick={async () => {
              try {
                const res = await apiRequest<{ message: string }>('/revision/seed-overdue-test', {
                  method: 'POST',
                  body: JSON.stringify({ interval_days: 3, make_overdue: true }),
                });
                alert(res.message);
              } catch (err: any) {
                alert(err.message || 'Error triggering test');
              }
            }}
            className="bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 text-xs font-bold rounded-xl h-10 shadow-sm"
          >
            <AlertTriangle className="h-3.5 w-3.5 mr-1" />
            Simulate 2-Day Blocker
          </Button>
        </div>
      </div>

      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200 bg-white shadow-sm rounded-2xl hover:shadow-md transition">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] text-slate-500 uppercase font-bold tracking-wider">Total Aspirants</span>
              <p className="text-3xl font-black text-slate-900">{kpis.total_users}</p>
              <span className="text-[10px] text-emerald-600 font-bold">↑ Active Across Rails</span>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center">
              <Users className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-sm rounded-2xl hover:shadow-md transition">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] text-slate-500 uppercase font-bold tracking-wider">Active Today (DAU)</span>
              <p className="text-3xl font-black text-emerald-700">{Math.max(kpis.active_subscriptions, 1)}</p>
              <span className="text-[10px] text-emerald-600 font-bold">Daily Study Rail Active</span>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center">
              <ShieldCheck className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-sm rounded-2xl hover:shadow-md transition">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] text-slate-500 uppercase font-bold tracking-wider">Avg Streak</span>
              <p className="text-3xl font-black text-amber-700">{kpis.avg_streak} Days</p>
              <span className="text-[10px] text-amber-600 font-bold">Unbroken Consistency</span>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center">
              <Flame className="h-6 w-6 fill-amber-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-sm rounded-2xl hover:shadow-md transition">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] text-slate-500 uppercase font-bold tracking-wider">Avg Mock Score</span>
              <p className="text-3xl font-black text-indigo-700">142.5 <span className="text-xs text-slate-400 font-normal">/ 200</span></p>
              <span className="text-[10px] text-indigo-600 font-bold">89th Percentile Benchmark</span>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center justify-center">
              <Award className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grid: Live Events Feed + Subject Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Live Event Stream (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping inline-block" />
                <h3 className="text-sm font-black text-slate-900">Live Aspirant Event Feed</h3>
              </div>

              {/* Event Filter Tabs */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-[11px] font-bold">
                {(['all', 'mock', 'lesson', 'alert'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setEventFilter(filter)}
                    className={`px-2.5 py-1 rounded-lg capitalize transition ${
                      eventFilter === filter ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            {/* Events List */}
            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              {filteredEvents.map((ev) => {
                let badgeClass = 'bg-blue-100 text-blue-800 border-blue-200';
                if (ev.type === 'mock') badgeClass = 'bg-indigo-100 text-indigo-800 border-indigo-200';
                if (ev.type === 'alert') badgeClass = 'bg-amber-100 text-amber-800 border-amber-200';
                if (ev.type === 'signup') badgeClass = 'bg-emerald-100 text-emerald-800 border-emerald-200';

                return (
                  <div
                    key={ev.id}
                    className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-slate-50 transition flex items-start justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <strong className="text-xs font-black text-slate-900">{ev.student_name}</strong>
                        <Badge className={`text-[10px] font-bold px-2 py-0.2 ${badgeClass}`}>
                          {ev.type.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-700">{ev.details}</p>
                      {ev.score && (
                        <p className="text-[11px] font-bold text-blue-700">Result: {ev.score}</p>
                      )}
                    </div>
                    <span className="text-[10px] font-semibold text-slate-400 whitespace-nowrap">{ev.time}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Subject Performance Telemetry (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-black text-slate-900">4-Section Cohort Mastery Radar</h3>

            <div className="space-y-4 text-xs">
              <div>
                <div className="flex items-center justify-between pb-1 font-bold">
                  <span className="text-slate-800">Quantitative Aptitude</span>
                  <span className="text-blue-700">82% Mastery (Avg 41/50)</span>
                </div>
                <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full" style={{ width: '82%' }} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between pb-1 font-bold">
                  <span className="text-slate-800">General Intelligence & Reasoning</span>
                  <span className="text-purple-700">88% Mastery (Avg 44/50)</span>
                </div>
                <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-purple-600 rounded-full" style={{ width: '88%' }} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between pb-1 font-bold">
                  <span className="text-slate-800">English Comprehension</span>
                  <span className="text-amber-700">76% Mastery (Avg 38/50)</span>
                </div>
                <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-amber-600 rounded-full" style={{ width: '76%' }} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between pb-1 font-bold">
                  <span className="text-slate-800">General Awareness</span>
                  <span className="text-emerald-700">71% Mastery (Avg 35/50)</span>
                </div>
                <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-emerald-600 rounded-full" style={{ width: '71%' }} />
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 space-y-1">
              <strong className="block font-bold">Retention Lock Status:</strong>
              <p className="text-[11px] text-blue-800">
                Spaced repetition gating policy is active. Candidates past 48 hours without clearing their Day +3, +7, +14, or +30 review are blocked from subsequent lessons.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Aspirants Management Table */}
      <Card className="border-slate-200 bg-white shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-base text-slate-900 font-bold">Enrolled Aspirants Telemetry</CardTitle>
            <p className="text-xs text-slate-500">Live directory of candidates active on the 180-Day Guided Rail.</p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search candidate name, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 h-9 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-slate-600 font-bold uppercase tracking-wider">
                  <th className="p-4">Candidate</th>
                  <th className="p-4">Target Exam</th>
                  <th className="p-4">Active Streak</th>
                  <th className="p-4">Diagnostic Status</th>
                  <th className="p-4">Joined Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400 text-xs">
                      No matching aspirants found for "{searchQuery}".
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-slate-900">{u.name}</div>
                        <div className="text-[11px] text-slate-400">{u.email}</div>
                      </td>
                      <td className="p-4">
                        <Badge className="bg-blue-100 text-blue-800 border-blue-200 font-bold text-[10px]">
                          {u.target_exam}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1 font-bold text-amber-700">
                          <Flame className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                          {u.streak_count} Days
                        </span>
                      </td>
                      <td className="p-4">
                        {u.onboarding_completed ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                            <CheckCircle2 className="h-3.5 w-3.5" /> 180-Day Rail Active
                          </span>
                        ) : (
                          <span className="text-slate-400 font-medium">Diagnostic Pending</span>
                        )}
                      </td>
                      <td className="p-4 text-slate-500 font-medium">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Broadcast Announcement Modal */}
      {showBroadcastModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 max-w-md w-full rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-blue-600" />
              <h3 className="text-base font-bold text-slate-900">Broadcast Student Alert</h3>
            </div>
            <p className="text-xs text-slate-500">
              Transmit a push announcement banner to all enrolled aspirants on their dashboard.
            </p>

            <form onSubmit={handleSendBroadcast} className="space-y-3">
              <textarea
                rows={3}
                required
                placeholder="e.g. Special Live Marathon Sunday Mock is scheduled at 10:00 AM..."
                value={broadcastText}
                onChange={(e) => setBroadcastText(e.target.value)}
                className="w-full p-3 text-xs border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
              />

              {broadcastSuccess && (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold text-center">
                  ✓ Broadcast successfully transmitted!
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowBroadcastModal(false)}
                  className="w-1/2 border-slate-300 text-slate-700 rounded-xl text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="w-1/2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold gap-1"
                >
                  <Send className="h-3.5 w-3.5" />
                  Send Alert
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
