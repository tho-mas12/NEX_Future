import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Download,
  ArrowLeft,
  Search,
  Loader2,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { apiRequest } from '@/lib/api';
import { MobileBottomNav } from '@/components/MobileBottomNav';

interface PYQItem {
  id: string;
  year: number;
  title: string;
  exam_type: string;
  tier: string;
  shift_info: string;
  pdf_url: string;
}

export const UserPYQPage: React.FC = () => {
  const navigate = useNavigate();
  const [pyqs, setPyqs] = useState<PYQItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<number | 'ALL'>('ALL');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchPYQs();
  }, []);

  const fetchPYQs = async () => {
    setLoading(true);
    try {
      const data = await apiRequest<PYQItem[]>('/pyqs');
      setPyqs(data);
    } catch (err: any) {
      console.error('Error fetching PYQs:', err);
    } finally {
      setLoading(false);
    }
  };

  const years = Array.from(new Set(pyqs.map((p) => p.year))).sort((a, b) => b - a);

  const filtered = pyqs.filter((p) => {
    const matchesYear = selectedYear === 'ALL' || p.year === selectedYear;
    const matchesSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.shift_info.toLowerCase().includes(search.toLowerCase());
    return matchesYear && matchesSearch;
  });

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
                  Previous Year Questions (PYQ)
                </h1>
                <p className="text-[11px] text-slate-500 font-medium">
                  Official SSC CGL & CHSL Shift Papers with Solutions
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
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 pb-24 md:pb-8 space-y-6">
        {/* Banner */}
        <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-bold text-blue-700 uppercase tracking-wider bg-blue-100/60 px-3 py-0.5 rounded-full border border-blue-200">
              Exam Hall Conditioning
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Master the Exact TCS Exam Questions
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
              Practicing official shift papers is mandatory to predict the 2026 question traps. Download official solved PDF papers organized year-wise.
            </p>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm text-center shrink-0">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Available Papers</span>
            <strong className="text-xl font-black text-blue-700">{pyqs.length} Sets</strong>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by exam year, shift details, or paper title..."
              value={search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 h-10 text-xs bg-white border border-slate-200 shadow-sm rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto p-1 bg-white border border-slate-200 rounded-xl shadow-sm">
            <button
              onClick={() => setSelectedYear('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition ${
                selectedYear === 'ALL'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              All Years ({pyqs.length})
            </button>
            {years.map((yr) => (
              <button
                key={yr}
                onClick={() => setSelectedYear(yr)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition ${
                  selectedYear === yr
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                Year {yr}
              </button>
            ))}
          </div>
        </div>

        {/* Papers List */}
        <Card className="border-slate-200 bg-white shadow-sm rounded-3xl overflow-hidden">
          <div className="divide-y divide-slate-100">
            {loading ? (
              <div className="p-12 text-center text-slate-500 flex items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                <span>Loading official previous year papers...</span>
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-xs">
                No papers found matching your query.
              </div>
            ) : (
              filtered.map((item) => (
                <div key={item.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/70 transition">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-blue-600 text-white font-bold text-xs">
                        Year {item.year}
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

                  <a
                    href={item.pdf_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition shrink-0"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download Solved Paper</span>
                  </a>
                </div>
              ))
            )}
          </div>
        </Card>
      </main>

      <MobileBottomNav />
    </div>
  );
};
