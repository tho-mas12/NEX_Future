import React, { useState, useEffect } from 'react';
import {
  Clock,
  Save,
  CheckCircle2,
  Shield,
  Loader2,
  Key,
  Users,
  UserPlus,
  Trash2,
  Eye,
  EyeOff,
  AlertTriangle,
  Cpu,
  Lock,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useSettingsStore } from '@/store/useSettingsStore';
import { apiRequest } from '@/lib/api';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at: string | null;
  last_login: string | null;
  is_current_user: boolean;
}

export const AdminSettingsPage: React.FC = () => {
  const { settings, fetchSettings, updateSettings } = useSettingsStore();

  const [activeTab, setActiveTab] = useState<'access' | 'api' | 'engine' | 'security'>('access');

  // Engine state
  const [timerMins, setTimerMins] = useState(15);
  const [qCount, setQCount] = useState(25);
  const [passPercent, setPassPercent] = useState(80);
  const [deadlineDays, setDeadlineDays] = useState(2);
  const [dailyTopics, setDailyTopics] = useState(2);

  // API Keys state
  const [geminiKey, setGeminiKey] = useState('');
  const [youtubeKey, setYoutubeKey] = useState('');
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [showYoutubeKey, setShowYoutubeKey] = useState(false);

  // Platform state
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [allowRegistrations, setAllowRegistrations] = useState(true);

  // Admin access list state
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [granting, setGranting] = useState(false);

  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
    loadAdmins();
  }, []);

  const loadSettings = async () => {
    try {
      const s = await fetchSettings();
      setTimerMins(s.mock_timer_mins);
      setQCount(s.mock_q_count);
      setPassPercent(s.revision_pass_percent);
      setDeadlineDays(s.revision_deadline_days);
      setDailyTopics(s.daily_main_topics_count);
      setMaintenanceMode(Boolean(s.maintenance_mode));
      setAllowRegistrations(s.allow_registrations !== false);
    } catch (e) {
      console.error(e);
    }
  };

  const loadAdmins = async () => {
    setLoadingAdmins(true);
    try {
      const data = await apiRequest<AdminUser[]>('/admin/access-list');
      setAdmins(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAdmins(false);
    }
  };

  const triggerSuccess = (msg: string) => {
    setSavedSuccess(msg);
    setTimeout(() => setSavedSuccess(null), 3000);
  };

  const handleSaveEngine = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateSettings({
        mock_timer_mins: Number(timerMins),
        mock_q_count: Number(qCount),
        revision_pass_percent: Number(passPercent),
        revision_deadline_days: Number(deadlineDays),
        daily_main_topics_count: Number(dailyTopics),
      });
      triggerSuccess('Examination parameters updated and applied to all mock engines!');
    } catch (err: any) {
      alert(err.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveApiKeys = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: any = {};
      if (geminiKey.trim()) payload.gemini_api_key = geminiKey.trim();
      if (youtubeKey.trim()) payload.youtube_api_key = youtubeKey.trim();

      await updateSettings(payload);
      setGeminiKey('');
      setYoutubeKey('');
      await fetchSettings();
      triggerSuccess('External API credentials updated and encrypted in database!');
    } catch (err: any) {
      alert(err.message || 'Failed to save API keys');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleMaintenance = async () => {
    const nextVal = !maintenanceMode;
    setMaintenanceMode(nextVal);
    try {
      await updateSettings({ maintenance_mode: nextVal });
      triggerSuccess(nextVal ? 'Maintenance Mode ENABLED' : 'Maintenance Mode DISABLED');
    } catch (err: any) {
      setMaintenanceMode(!nextVal);
      alert(err.message || 'Failed to toggle maintenance mode');
    }
  };

  const handleToggleRegistrations = async () => {
    const nextVal = !allowRegistrations;
    setAllowRegistrations(nextVal);
    try {
      await updateSettings({ allow_registrations: nextVal });
      triggerSuccess(nextVal ? 'New Student Registrations OPEN' : 'Registrations PAUSED');
    } catch (err: any) {
      setAllowRegistrations(!nextVal);
      alert(err.message || 'Failed to toggle registrations');
    }
  };

  const handleGrantAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail.trim()) return;
    setGranting(true);
    try {
      const res = await apiRequest<{ success: boolean; message: string }>('/admin/access-grant', {
        method: 'POST',
        body: JSON.stringify({
          email: newAdminEmail.trim(),
          name: newAdminName.trim() || undefined,
          password: newAdminPassword.trim() || undefined,
        }),
      });
      triggerSuccess(res.message);
      setNewAdminEmail('');
      setNewAdminName('');
      setNewAdminPassword('');
      setShowAddAdminModal(false);
      await loadAdmins();
    } catch (err: any) {
      alert(err.message || 'Failed to grant admin access');
    } finally {
      setGranting(false);
    }
  };

  const handleRevokeAdmin = async (admin: AdminUser) => {
    if (admin.is_current_user) {
      alert('You cannot revoke your own administrator access.');
      return;
    }
    if (!confirm(`Are you sure you want to revoke admin privileges from ${admin.email}?`)) {
      return;
    }
    try {
      await apiRequest(`/admin/access-revoke/${admin.id}`, { method: 'DELETE' });
      triggerSuccess(`Admin privileges removed from ${admin.email}`);
      await loadAdmins();
    } catch (err: any) {
      alert(err.message || 'Failed to revoke admin privileges');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl animate-in fade-in duration-200 font-sans pb-16">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-600">
              <Shield className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Platform Administration & System Controls
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage admin role delegates, configure Gemini and YouTube API credentials, and calibrate examination parameters.
          </p>
        </div>

        <Button
          onClick={() => {
            loadSettings();
            loadAdmins();
          }}
          variant="outline"
          size="sm"
          className="border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl gap-2 font-bold shrink-0 self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Status
        </Button>
      </div>

      {/* Global Success Notification */}
      {savedSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 shadow-sm animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{savedSuccess}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('access')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'access'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Users className="w-4 h-4" />
          Admin Access Control
          <span className="ml-1 px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-800 text-[10px]">
            {admins.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('api')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'api'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Key className="w-4 h-4" />
          API Keys & AI Credentials
          {(settings.gemini_api_key_configured || settings.youtube_api_key_configured) && (
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('engine')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'engine'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Cpu className="w-4 h-4" />
          Mock & Spaced-Repetition Engine
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'security'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Lock className="w-4 h-4" />
          Platform Security & Gates
        </button>
      </div>

      {/* TAB 1: ADMIN ACCESS CONTROL */}
      {activeTab === 'access' && (
        <div className="space-y-6">
          <Card className="border-slate-200 bg-white shadow-sm rounded-3xl overflow-hidden">
            <CardHeader className="pb-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-base text-slate-900 font-bold flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <span>Authorized Platform Administrators</span>
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 mt-0.5">
                  Users listed here possess elevated permissions to manage lessons, mock tests, and system parameters.
                </CardDescription>
              </div>

              <Button
                onClick={() => setShowAddAdminModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-10 px-4 rounded-xl shadow-md shadow-blue-600/20 gap-2 shrink-0 active:scale-95 transition"
              >
                <UserPlus className="w-4 h-4" />
                Grant New Admin Access
              </Button>
            </CardHeader>

            <CardContent className="p-0">
              {loadingAdmins ? (
                <div className="p-12 text-center text-slate-400 flex items-center justify-center gap-2 text-xs">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  Loading administrators...
                </div>
              ) : admins.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">No admins found.</div>
              ) : (
                <div className="divide-y divide-slate-100 overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        <th className="py-3 px-6">Administrator</th>
                        <th className="py-3 px-6">Email Address</th>
                        <th className="py-3 px-6">Role & Status</th>
                        <th className="py-3 px-6">Joined / Active</th>
                        <th className="py-3 px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {admins.map((admin) => (
                        <tr key={admin.id} className="hover:bg-slate-50/60 transition">
                          <td className="py-4 px-6 font-bold text-slate-900 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-black text-xs flex items-center justify-center shrink-0">
                              {admin.name.slice(0, 1).toUpperCase()}
                            </div>
                            <div>
                              <span>{admin.name}</span>
                              {admin.is_current_user && (
                                <span className="ml-2 px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                                  You
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-6 text-slate-600 font-mono text-[11px]">
                            {admin.email}
                          </td>
                          <td className="py-4 px-6">
                            <Badge className="bg-blue-600/10 text-blue-700 border-blue-200 font-bold text-[10px]">
                              System Admin
                            </Badge>
                          </td>
                          <td className="py-4 px-6 text-slate-500 text-[11px]">
                            {admin.created_at ? new Date(admin.created_at).toLocaleDateString() : 'Initial'}
                          </td>
                          <td className="py-4 px-6 text-right">
                            {admin.is_current_user ? (
                              <span className="text-[11px] text-slate-400 italic">Protected</span>
                            ) : (
                              <button
                                onClick={() => handleRevokeAdmin(admin)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 font-bold text-[11px] transition active:scale-95"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                Revoke Access
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 2: API KEYS & AI CREDENTIALS */}
      {activeTab === 'api' && (
        <form onSubmit={handleSaveApiKeys} className="space-y-6">
          <Card className="border-slate-200 bg-white shadow-sm rounded-3xl">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-base text-slate-900 flex items-center gap-2 font-bold">
                <Sparkles className="h-5 w-5 text-amber-500" />
                <span>Google Gemini AI API Key</span>
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Powers automated MCQ extraction from YouTube lesson transcripts, difficulty grading (Medium $\rightarrow$ Hard), and AI topic explanations.
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-4 space-y-4">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="text-xs">
                  <span className="font-bold text-slate-700 block">Current Configuration Status</span>
                  {settings.gemini_api_key_configured ? (
                    <span className="text-emerald-700 font-bold flex items-center gap-1.5 mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Active Key: <code className="bg-emerald-100 px-1.5 py-0.5 rounded text-[11px]">{settings.gemini_api_key_masked}</code>
                    </span>
                  ) : (
                    <span className="text-amber-700 font-bold flex items-center gap-1.5 mt-0.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      No API key configured (using local offline question bank)
                    </span>
                  )}
                </div>

                <Badge variant={settings.gemini_api_key_configured ? 'default' : 'outline'} className={settings.gemini_api_key_configured ? 'bg-emerald-600' : 'border-amber-300 text-amber-700'}>
                  {settings.gemini_api_key_configured ? 'Connected' : 'Missing'}
                </Badge>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Update Gemini API Key
                </label>
                <div className="relative">
                  <Input
                    type={showGeminiKey ? 'text' : 'password'}
                    placeholder="Enter your Gemini API key (starts with AIzaSy...)"
                    value={geminiKey}
                    onChange={(e) => setGeminiKey(e.target.value)}
                    className="border-slate-300 rounded-xl pr-10 font-mono text-xs h-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowGeminiKey(!showGeminiKey)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                  >
                    {showGeminiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400">
                  Get a free key from <a href="https://aistudio.google.com/" target="_blank" rel="noreferrer" className="text-blue-600 underline font-semibold">Google AI Studio</a>.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white shadow-sm rounded-3xl">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-base text-slate-900 flex items-center gap-2 font-bold">
                <Key className="h-5 w-5 text-red-600" />
                <span>YouTube Data v3 API Key</span>
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Used to fetch video durations, verify valid embed links, and pull video subtitles automatically.
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-4 space-y-4">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="text-xs">
                  <span className="font-bold text-slate-700 block">Current Status</span>
                  {settings.youtube_api_key_configured ? (
                    <span className="text-emerald-700 font-bold flex items-center gap-1.5 mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Active Key: <code className="bg-emerald-100 px-1.5 py-0.5 rounded text-[11px]">{settings.youtube_api_key_masked}</code>
                    </span>
                  ) : (
                    <span className="text-slate-500 font-bold flex items-center gap-1.5 mt-0.5">
                      Optional — YouTube direct embed is operating normally.
                    </span>
                  )}
                </div>

                <Badge variant="outline" className="border-slate-300 text-slate-700">
                  {settings.youtube_api_key_configured ? 'Configured' : 'Optional'}
                </Badge>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Update YouTube Data API Key
                </label>
                <div className="relative">
                  <Input
                    type={showYoutubeKey ? 'text' : 'password'}
                    placeholder="Enter YouTube Data API v3 key"
                    value={youtubeKey}
                    onChange={(e) => setYoutubeKey(e.target.value)}
                    className="border-slate-300 rounded-xl pr-10 font-mono text-xs h-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowYoutubeKey(!showYoutubeKey)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                  >
                    {showYoutubeKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              disabled={saving || (!geminiKey.trim() && !youtubeKey.trim())}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-11 px-6 rounded-xl shadow-md shadow-blue-600/20 gap-2 active:scale-95 transition"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Encrypting & Saving Credentials...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save API Credentials
                </>
              )}
            </Button>
          </div>
        </form>
      )}

      {/* TAB 3: MOCK & ENGINE CONTROLS */}
      {activeTab === 'engine' && (
        <form onSubmit={handleSaveEngine} className="space-y-6">
          <Card className="border-slate-200 bg-white shadow-sm rounded-3xl">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-base text-slate-900 flex items-center gap-2 font-bold">
                <Clock className="h-4 w-4 text-blue-600" />
                <span>Sectional Simulator & Daily Mock Parameters</span>
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Controls the countdown timer and question volume for TCS sectional tests and weekend mocks.
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Mock Duration (Minutes)
                </label>
                <Input
                  type="number"
                  min={5}
                  max={60}
                  value={timerMins}
                  onChange={(e) => setTimerMins(Number(e.target.value))}
                  required
                  className="border-slate-300 rounded-xl"
                />
                <p className="text-[10px] text-slate-400">Default: 15 mins (TCS Tier 1 sectional speed limit)</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Number of Questions per Test
                </label>
                <Input
                  type="number"
                  min={5}
                  max={50}
                  value={qCount}
                  onChange={(e) => setQCount(Number(e.target.value))}
                  required
                  className="border-slate-300 rounded-xl"
                />
                <p className="text-[10px] text-slate-400">Default: 25 questions (+2.0 / -0.5 marking)</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white shadow-sm rounded-3xl">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-base text-slate-900 flex items-center gap-2 font-bold">
                <Shield className="h-4 w-4 text-amber-600" />
                <span>Spaced Repetition & Revision Blocker Policy</span>
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Strict gates governing the +3, +7, +20, and +30 day revision engine.
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Passing Score Required (%)
                </label>
                <Input
                  type="number"
                  min={50}
                  max={100}
                  value={passPercent}
                  onChange={(e) => setPassPercent(Number(e.target.value))}
                  required
                  className="border-slate-300 rounded-xl"
                />
                <p className="text-[10px] text-slate-400">Default: 80% (triggers re-test if below)</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Revision Grace Deadline (Days)
                </label>
                <Input
                  type="number"
                  min={1}
                  max={7}
                  value={deadlineDays}
                  onChange={(e) => setDeadlineDays(Number(e.target.value))}
                  required
                  className="border-slate-300 rounded-xl"
                />
                <p className="text-[10px] text-slate-400">Locks new lessons if missed by &gt; 2 days</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Daily Core Topics per Rail
                </label>
                <Input
                  type="number"
                  min={1}
                  max={4}
                  value={dailyTopics}
                  onChange={(e) => setDailyTopics(Number(e.target.value))}
                  required
                  className="border-slate-300 rounded-xl"
                />
                <p className="text-[10px] text-slate-400">Default: 2 subjects/day</p>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-11 px-6 rounded-xl shadow-md shadow-blue-600/20 gap-2 active:scale-95 transition"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Updating Parameters...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Deploy Engine Changes
                </>
              )}
            </Button>
          </div>
        </form>
      )}

      {/* TAB 4: PLATFORM SECURITY & GATES */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          <Card className="border-slate-200 bg-white shadow-sm rounded-3xl">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-base text-slate-900 flex items-center gap-2 font-bold">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                <span>System Gate & Maintenance Controls</span>
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Direct levers to pause public access or control new student registration volume.
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-4 space-y-4">
              {/* Maintenance Toggle */}
              <div className="p-4 rounded-2xl border border-slate-200 flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <h4 className="text-sm font-bold text-slate-900">Platform Maintenance Mode</h4>
                  <p className="text-xs text-slate-500">
                    When active, standard students see a maintenance banner while admins retain full access.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleToggleMaintenance}
                  className="p-1 text-slate-700 transition"
                >
                  {maintenanceMode ? (
                    <ToggleRight className="w-9 h-9 text-red-600" />
                  ) : (
                    <ToggleLeft className="w-9 h-9 text-slate-300" />
                  )}
                </button>
              </div>

              {/* Registration Toggle */}
              <div className="p-4 rounded-2xl border border-slate-200 flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <h4 className="text-sm font-bold text-slate-900">Student Signups & Registrations</h4>
                  <p className="text-xs text-slate-500">
                    Allow new candidates to register for the 180-day master curriculum.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleToggleRegistrations}
                  className="p-1 text-slate-700 transition"
                >
                  {allowRegistrations ? (
                    <ToggleRight className="w-9 h-9 text-emerald-600" />
                  ) : (
                    <ToggleLeft className="w-9 h-9 text-slate-300" />
                  )}
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* MODAL: GRANT NEW ADMIN ACCESS */}
      {showAddAdminModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Grant Administrator Access</h3>
                  <p className="text-[11px] text-slate-500">Upgrade user or register new admin staff</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddAdminModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleGrantAdmin} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Staff Email Address *</label>
                <Input
                  type="email"
                  placeholder="e.g. educator@examrail.in"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  required
                  className="border-slate-300 rounded-xl text-xs h-10"
                />
                <p className="text-[10px] text-slate-400">
                  If the account exists, their role is promoted to Admin immediately.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Full Name (Optional)</label>
                <Input
                  type="text"
                  placeholder="e.g. Prof. R. Sharma"
                  value={newAdminName}
                  onChange={(e) => setNewAdminName(e.target.value)}
                  className="border-slate-300 rounded-xl text-xs h-10"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Initial Password</label>
                <Input
                  type="text"
                  placeholder="Default: admin123"
                  value={newAdminPassword}
                  onChange={(e) => setNewAdminPassword(e.target.value)}
                  className="border-slate-300 rounded-xl text-xs h-10 font-mono"
                />
                <p className="text-[10px] text-slate-400">
                  Used if creating a new administrator account (min 6 chars).
                </p>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddAdminModal(false)}
                  className="rounded-xl border-slate-200 text-xs font-bold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={granting || !newAdminEmail.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold gap-2 shadow-md shadow-blue-600/20 active:scale-95 transition"
                >
                  {granting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Granting...
                    </>
                  ) : (
                    'Confirm Admin Access'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
