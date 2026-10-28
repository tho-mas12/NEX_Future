import React, { useState, useEffect } from 'react';
import {
  Clock,
  Save,
  CheckCircle2,
  Shield,
  Loader2,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSettingsStore } from '@/store/useSettingsStore';

export const AdminSettingsPage: React.FC = () => {
  const { fetchSettings, updateSettings } = useSettingsStore();

  const [timerMins, setTimerMins] = useState(15);
  const [qCount, setQCount] = useState(25);
  const [passPercent, setPassPercent] = useState(80);
  const [deadlineDays, setDeadlineDays] = useState(2);
  const [dailyTopics, setDailyTopics] = useState(2);

  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    fetchSettings().then((s) => {
      setTimerMins(s.mock_timer_mins);
      setQCount(s.mock_q_count);
      setPassPercent(s.revision_pass_percent);
      setDeadlineDays(s.revision_deadline_days);
      setDailyTopics(s.daily_main_topics_count);
    }).catch(() => {});
  }, [fetchSettings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    try {
      await updateSettings({
        mock_timer_mins: Number(timerMins),
        mock_q_count: Number(qCount),
        revision_pass_percent: Number(passPercent),
        revision_deadline_days: Number(deadlineDays),
        daily_main_topics_count: Number(dailyTopics),
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err: any) {
      alert(err.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl animate-in fade-in duration-200 font-sans">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Global Examination & Revision Controls</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Live platform parameters controlling sectional timers, passing thresholds, and spaced-repetition deadlines.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>Global platform settings successfully updated and broadcast to all student sessions!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Card 1: Sectional Mock Parameters */}
        <Card className="border-slate-200 bg-white shadow-sm rounded-2xl">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-base text-slate-900 flex items-center gap-2 font-bold">
              <Clock className="h-4 w-4 text-blue-600" />
              <span>Sectional Simulator Parameters</span>
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Controls the timer and question volume for Stage 3 daily testing and weekend sectional mocks.
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
              <p className="text-[10px] text-slate-400">Default: 15 mins (Tier 1 exam rule)</p>
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

        {/* Card 2: Hardcore Spaced-Repetition Blocker Parameters */}
        <Card className="border-slate-200 bg-white shadow-sm rounded-2xl">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-base text-slate-900 flex items-center gap-2 font-bold">
              <Shield className="h-4 w-4 text-amber-600" />
              <span>Spaced Repetition & Blocker Policy</span>
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
              <p className="text-[10px] text-slate-400">Default: 80% (triggers penalty video if below)</p>
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
              <p className="text-[10px] text-slate-400">Default: 2 subjects/day + daily reasoning</p>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-11 px-6 rounded-xl shadow-md shadow-blue-600/20 gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Updating Engine Parameters...
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
    </div>
  );
};
