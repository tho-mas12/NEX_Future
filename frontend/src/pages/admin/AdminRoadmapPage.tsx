import React, { useState, useEffect } from 'react';
import { CheckCircle2, Calendar, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { apiRequest } from '@/lib/api';

interface RoadmapDay {
  day_number: number;
  topic_id?: string;
  topic_title?: string;
  topic_subject?: string;
}

interface TopicOption {
  id: string;
  title: string;
  subject: string;
}

export const AdminRoadmapPage: React.FC = () => {
  const [examType, setExamType] = useState<'CGL' | 'CHSL'>('CGL');
  const [days, setDays] = useState<RoadmapDay[]>([]);
  const [allTopics, setAllTopics] = useState<TopicOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingDay, setSavingDay] = useState<number | null>(null);
  const [successDay, setSuccessDay] = useState<number | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [roadmapRes, topicsRes] = await Promise.all([
        apiRequest<RoadmapDay[]>(`/admin/roadmap?exam_type=${examType}`),
        apiRequest<TopicOption[]>('/admin/topics'),
      ]);
      setDays(roadmapRes);
      setAllTopics(topicsRes);
    } catch (err: any) {
      alert(err.message || 'Failed to fetch roadmap data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [examType]);

  const handleAssignTopic = async (dayNumber: number, topicId: string) => {
    if (!topicId) return;
    setSavingDay(dayNumber);
    try {
      await apiRequest('/admin/roadmap/assign', {
        method: 'POST',
        body: JSON.stringify({
          exam_type: examType,
          day_number: dayNumber,
          topic_id: topicId,
        }),
      });

      const matchedTopic = allTopics.find((t) => t.id === topicId);
      setDays((prev) =>
        prev.map((d) =>
          d.day_number === dayNumber
            ? {
                ...d,
                topic_id: topicId,
                topic_title: matchedTopic?.title || d.topic_title,
                topic_subject: matchedTopic?.subject || d.topic_subject,
              }
            : d
        )
      );

      setSuccessDay(dayNumber);
      setTimeout(() => setSuccessDay(null), 1800);
    } catch (err: any) {
      alert(err.message || 'Error assigning topic');
    } finally {
      setSavingDay(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header & Target Exam Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold mb-2">
            <Calendar className="h-3.5 w-3.5" />
            180-Day Stage Blueprint Matrix
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">180-Day Blueprint Architect</h1>
          <p className="text-xs text-slate-600 mt-1">
            Configure the exact daily sequence for SSC CGL & CHSL guided curriculum tracks.
          </p>
        </div>

        {/* CGL vs CHSL Tab Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
          <button
            onClick={() => setExamType('CGL')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              examType === 'CGL'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            SSC CGL (180 Days)
          </button>
          <button
            onClick={() => setExamType('CHSL')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              examType === 'CHSL'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            SSC CHSL (180 Days)
          </button>
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center gap-3 text-slate-500 text-xs bg-white rounded-2xl border border-slate-200 shadow-sm">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          <span>Loading 180-Day Roadmap Matrix...</span>
        </div>
      ) : (
        <Card className="border-slate-200 bg-white shadow-sm rounded-2xl overflow-hidden">
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100 max-h-[75vh] overflow-y-auto">
              {days.map((day) => {
                const isMockDay = day.day_number % 7 === 0;

                return (
                  <div
                    key={day.day_number}
                    className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                      isMockDay ? 'bg-blue-50/40' : 'hover:bg-slate-50/80'
                    }`}
                  >
                    {/* Day Pill & Subject */}
                    <div className="flex items-center gap-4">
                      <div
                        className={`h-10 w-10 rounded-xl flex items-center justify-center font-black text-xs shrink-0 shadow-sm ${
                          isMockDay
                            ? 'bg-blue-600 text-white shadow-blue-500/20'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {day.day_number}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                            Day {day.day_number}
                          </span>
                          {isMockDay && (
                            <Badge variant="outline" className="text-[10px] py-0 border-blue-300 text-blue-700 bg-blue-50 font-bold">
                              Weekly Mock Checkpoint
                            </Badge>
                          )}
                          {day.topic_subject && (
                            <Badge variant="default" className="text-[10px] py-0 bg-blue-600 text-white font-semibold">
                              {day.topic_subject}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm font-bold text-slate-900 truncate max-w-sm sm:max-w-md">
                          {day.topic_title || 'No Topic Assigned'}
                        </p>
                      </div>
                    </div>

                    {/* Topic Assignment Dropdown */}
                    <div className="flex items-center gap-3">
                      <select
                        value={day.topic_id || ''}
                        onChange={(e) => handleAssignTopic(day.day_number, e.target.value)}
                        className="bg-slate-50 border border-slate-300 text-slate-900 text-xs font-medium rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 max-w-xs truncate shadow-sm"
                      >
                        <option value="">-- Assign a Topic --</option>
                        {allTopics.map((top) => (
                          <option key={top.id} value={top.id}>
                            [{top.subject}] {top.title}
                          </option>
                        ))}
                      </select>

                      {savingDay === day.day_number ? (
                        <span className="text-[11px] text-blue-600 font-bold">Saving...</span>
                      ) : successDay === day.day_number ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};