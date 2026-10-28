import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Flame, ArrowRight, ShieldAlert, Clock,
  Sparkles, Brain, Lock, RotateCcw, Award, Check,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const mockTicker = [
  { name: "Rahul S.", score: "168.5 / 200", exam: "SSC CGL", rank: "Top 0.8%" },
  { name: "Pooja V.", score: "174.0 / 200", exam: "SSC CGL", rank: "Top 0.4%" },
  { name: "Ankit M.", score: "159.0 / 200", exam: "SSC CHSL", rank: "Top 1.2%" },
  { name: "Sneha D.", score: "182.5 / 200", exam: "SSC CGL", rank: "Top 0.1%" },
  { name: "Karan B.", score: "163.0 / 200", exam: "SSC CHSL", rank: "Top 0.9%" },
  { name: "Divya N.", score: "171.5 / 200", exam: "SSC CGL", rank: "Top 0.5%" },
];

export const LandingPage: React.FC = () => {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const toggleFaq = (idx: number) => {
    setActiveFaq(prev => prev === idx ? null : idx);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Top Banner Notice */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white text-xs py-2 px-4 text-center font-medium shadow-sm">
        <span className="inline-flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-bold uppercase tracking-wider">
            SSC CGL & CHSL 2026/2027
          </span>
          Strict 15-Minute Sectional Timers & Hardcore Spaced-Repetition Blocker Active.
          <Link to="/register" className="underline font-bold hover:text-blue-100 ml-1">
            Begin Day 1 Free →
          </Link>
        </span>
      </div>

      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="NEX Logo"
              className="h-11 w-11 object-contain rounded-xl shadow-sm border border-slate-200/80 shrink-0"
            />
            <div>
              <span className="font-black text-2xl tracking-tight text-slate-900">
                NEX
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] bg-blue-50 border border-blue-200 text-blue-700 font-bold px-2 py-0.5 rounded-full uppercase">
                SSC Mastery Platform
              </span>
            </div>
          </Link>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <a href="#method" className="hover:text-blue-600 transition">Method of Study</a>
            <a href="#features" className="hover:text-blue-600 transition">Features</a>
            <a href="#roadmap" className="hover:text-blue-600 transition">180-Day Stages</a>
            <a href="#comparison" className="hover:text-blue-600 transition">Why NEX</a>
            <a href="#faq" className="hover:text-blue-600 transition">FAQ</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" className="text-sm font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100">
                Log In
              </Button>
            </Link>
            <Link to="/register">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-600/20 px-5 rounded-xl transition">
                Start Day 1 Rail
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Live Mock Scores Ticker */}
      <div className="border-b border-slate-200 bg-white overflow-hidden py-2.5">
        <div className="flex items-center gap-8 whitespace-nowrap px-6 text-xs text-slate-600 max-w-7xl mx-auto overflow-x-auto scrollbar-none">
          <span className="inline-flex items-center gap-1.5 text-blue-700 font-bold uppercase tracking-wider text-[11px] shrink-0">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping inline-block" />
            Live Arena Scores:
          </span>
          {mockTicker.map((item, idx) => (
            <span key={idx} className="inline-flex items-center gap-2 shrink-0">
              <span className="text-slate-800 font-semibold">{item.name}</span>
              <span className="text-emerald-700 font-mono font-bold">{item.score}</span>
              <span className="text-slate-500 font-medium">({item.exam} • {item.rank})</span>
              <span className="text-slate-300">|</span>
            </span>
          ))}
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 border-b border-slate-200 bg-gradient-to-b from-white via-blue-50/30 to-slate-50">
        <div className="max-w-6xl mx-auto px-6 flex flex-col items-center text-center">
          <Badge className="mb-6 px-4 py-1.5 text-xs font-bold border-amber-300 bg-amber-50 text-amber-800 gap-1.5 rounded-full shadow-sm">
            <Flame className="h-4 w-4 fill-amber-500 text-amber-500" />
            The 180-Day SSC CGL & CHSL Guided Rail System
          </Badge>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-slate-900 max-w-4xl leading-[1.12]">
            Crack SSC CGL in 180 Days.
            <span className="block mt-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 bg-clip-text text-transparent">
              No endless playlists. Just a daily rail.
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl leading-relaxed">
            NEX eliminates decision fatigue. You are locked into a structured daily rail:
            <strong className="text-slate-900 font-semibold"> 2 curated core lessons</strong>,
            <strong className="text-slate-900 font-semibold"> 1 daily reasoning drill</strong>, and
            <strong className="text-slate-900 font-semibold"> automated spaced-repetition testing</strong> that blocks new lessons if you don't revise.
          </p>

          {/* Action CTAs */}
          <div className="mt-9 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <Link to="/register" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto h-13 px-8 text-base bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/25 gap-2 transition transform hover:-translate-y-0.5">
                Start Day 1 Free
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <a href="#method" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto h-13 px-7 text-base border-slate-300 hover:bg-white text-slate-700 font-semibold rounded-xl shadow-sm">
                How The Method Works ↓
              </Button>
            </a>
          </div>

          {/* Platform Trust Telemetry Grid */}
          <div className="mt-14 grid grid-cols-2 sm:grid-cols-4 gap-4 w-full max-w-4xl text-left">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 font-bold shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Sectional Engine</p>
                <p className="text-sm font-bold text-slate-900">15-Min Sectionals</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 font-bold shrink-0">
                <Brain className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Spaced Retention</p>
                <p className="text-sm font-bold text-slate-900">Days +3, +7, +20, +30</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 font-bold shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">The Blocker</p>
                <p className="text-sm font-bold text-slate-900">2-Day Grace Buffer</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600 font-bold shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">AI Custom Tests</p>
                <p className="text-sm font-bold text-slate-900">Targeted Mocks</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION: THE EXACT METHOD OF STUDY */}
      <section id="method" className="py-20 bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
              The Study Architecture
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-3 tracking-tight">
              The NEX Daily Study Method
            </h2>
            <p className="text-slate-600 mt-3 text-base">
              NEX is built around cognitive retention principles. Here is the exact linear routine every student executes every single day:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-7 relative hover:shadow-md transition">
              <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white font-black text-lg flex items-center justify-center mb-5 shadow-md shadow-blue-600/20">
                1
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Multi-Subject Daily Rail</h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                You study structured sets of topics (e.g. 2 English topics + 2 GS topics) plus <strong>1 daily reasoning sectional drill</strong>.
              </p>
              <ul className="text-xs text-slate-600 space-y-2 border-t border-slate-200/80 pt-4">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" /> Prevents decision fatigue and syllabus anxiety
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" /> Daily reasoning drill builds automatic pattern recognition
                </li>
              </ul>
            </div>

            {/* Step 2 */}
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-7 relative hover:shadow-md transition">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white font-black text-lg flex items-center justify-center mb-5 shadow-md shadow-indigo-600/20">
                2
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">3-Stage Linear Player</h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                Every lesson forces you through a strict 3-stage linear progression:
              </p>
              <div className="space-y-2.5 text-xs">
                <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                  <strong className="text-blue-700 block">Stage 1: Theory & Concept Sheet</strong>
                  Split-screen video lecture and downloadable formula sheet.
                </div>
                <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                  <strong className="text-indigo-700 block">Stage 2: Active Recall Drill</strong>
                  20 MCQs with instant slide-in Vedic short-trick solutions.
                </div>
                <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                  <strong className="text-amber-700 block">Stage 3: Sectional Simulator</strong>
                  15-minute 25-question test with +2.0/-0.5 negative marking.
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-7 relative hover:shadow-md transition">
              <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white font-black text-lg flex items-center justify-center mb-5 shadow-md shadow-rose-600/20">
                3
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Hardcore Spaced Blocker</h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                Finishing Stage 3 automatically registers the lesson and schedules spaced revisions at <strong>Day +3, +7, +20, and +30</strong>.
              </p>
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-1.5 mb-3">
                <p className="font-bold flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-rose-600" /> The Blocker Constraint:
                </p>
                <p>If a revision is pending past its 2-day deadline, all new daily lessons are completely locked until you clear the revision.</p>
              </div>
              <p className="text-xs text-slate-600">
                <strong>80% Pass Cutoff:</strong> Scoring &lt; 80% forces you to re-watch the lecture and retake the test. No skipping allowed.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION: 4-STAGE SEQUENTIAL ROADMAP */}
      <section id="roadmap" className="py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
              The 180-Day Blueprint
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-3 tracking-tight">
              Sequential 4-Stage Study Plan
            </h2>
            <p className="text-slate-600 mt-3 text-base">
              A scientifically phased progression ensuring you master foundations before tackling advanced concepts.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Stage 1 */}
            <div className="bg-white border-2 border-blue-500/30 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded bg-blue-100 text-blue-800">
                  Stage 1: Days 1 - 45
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-3 mb-1">Foundations</h3>
                <p className="text-xs text-slate-500 mb-4">English & Modern History</p>
                <ul className="text-xs text-slate-600 space-y-2">
                  <li className="flex items-start gap-1.5">
                    <span className="text-blue-600 font-bold">•</span>
                    <span>English grammar rules & high-frequency vocabulary.</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-blue-600 font-bold">•</span>
                    <span>Modern Indian History timeline & PYQs.</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-blue-600 font-bold">•</span>
                    <span>Daily reasoning sectional drills.</span>
                  </li>
                </ul>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] font-semibold text-blue-700">
                Target: 80% new topics, 20% revision
              </div>
            </div>

            {/* Stage 2 */}
            <div className="bg-white border-2 border-indigo-500/30 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded bg-indigo-100 text-indigo-800">
                  Stage 2: Days 46 - 110
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-3 mb-1">Core Concepts</h3>
                <p className="text-xs text-slate-500 mb-4">Advanced Maths & Polity</p>
                <ul className="text-xs text-slate-600 space-y-2">
                  <li className="flex items-start gap-1.5">
                    <span className="text-indigo-600 font-bold">•</span>
                    <span>Algebra, Geometry, Trigonometry, and Mensuration.</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-indigo-600 font-bold">•</span>
                    <span>Indian Constitution, Articles, Amendments.</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-indigo-600 font-bold">•</span>
                    <span>Spaced reviews of Stage 1 English & History.</span>
                  </li>
                </ul>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] font-semibold text-indigo-700">
                Target: Reach 100-110+ out of 200
              </div>
            </div>

            {/* Stage 3 */}
            <div className="bg-white border-2 border-emerald-500/30 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded bg-emerald-100 text-emerald-800">
                  Stage 3: Days 111 - 150
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-3 mb-1">Strengthening</h3>
                <p className="text-xs text-slate-500 mb-4">Arithmetic & Geography</p>
                <ul className="text-xs text-slate-600 space-y-2">
                  <li className="flex items-start gap-1.5">
                    <span className="text-emerald-600 font-bold">•</span>
                    <span>Percentages, Ratio, SI-CI, Time & Work.</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-emerald-600 font-bold">•</span>
                    <span>Indian & Physical Geography concepts.</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-emerald-600 font-bold">•</span>
                    <span>50% new topics and 50% spaced revision.</span>
                  </li>
                </ul>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] font-semibold text-emerald-700">
                Target: Reach 140+ out of 200
              </div>
            </div>

            {/* Stage 4 */}
            <div className="bg-white border-2 border-amber-500/30 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded bg-amber-100 text-amber-800">
                  Stage 4: Days 151 - 180
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-3 mb-1">Grand Finale</h3>
                <p className="text-xs text-slate-500 mb-4">Exam Ready & Full Mocks</p>
                <ul className="text-xs text-slate-600 space-y-2">
                  <li className="flex items-start gap-1.5">
                    <span className="text-amber-600 font-bold">•</span>
                    <span>Ancient & Medieval History, Economy, Static GK.</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-amber-600 font-bold">•</span>
                    <span>2-3 full-length Previous Year Mocks per week.</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-amber-600 font-bold">•</span>
                    <span>Aggressive Mistake Notebook elimination.</span>
                  </li>
                </ul>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] font-semibold text-amber-700">
                Target: 165+ Peak Exam Day Readiness
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION: PLATFORM FEATURES GRID */}
      <section id="features" className="py-20 bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
              Platform Features
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-3 tracking-tight">
              Engineered for SSC CGL Tier 1 & Tier 2
            </h2>
            <p className="text-slate-600 mt-3 text-base">
              Every feature on NEX exists to simulate the actual exam stress and maximize active recall speed.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-blue-300 transition">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-4">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">15-Minute Sectional Timer</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Practice 25 questions in exactly 15 minutes, training you to eliminate hesitation and manage time effectively.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-blue-300 transition">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-4">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Slide-in Vedic Short Tricks</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Selecting an option immediately slides open the 10-second Vedic shortcut, digital sum technique, or option elimination rule.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-blue-300 transition">
              <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center mb-4">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Emergency Revision Blocker</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                If a revision is missed past its 2-day grace period, all new lectures are locked with a red banner until you clear your backlog.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-blue-300 transition">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Adaptive AI Dynamic Mocks</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Generate 25-question sectional mocks focused strictly on the subtopics you have completed so far. No irrelevant questions.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-blue-300 transition">
              <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mb-4">
                <RotateCcw className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">80% Penalty Retest Gateway</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Failed a revision test with &lt; 80%? You are forced into Stage 3: re-watch the video lecture and re-attempt until you pass.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-blue-300 transition">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Integrated Mistake Notebook</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Every wrong answer is automatically cataloged with your erroneous option, correct answer, and explanation for focused review.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION: COMPARISON TABLE */}
      <section id="comparison" className="py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Why We Are Different
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 mt-3 tracking-tight">
              NEX vs. Generic Preparation
            </h2>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-100/70 text-slate-700">
                    <th className="p-4 font-bold">Preparation Feature</th>
                    <th className="p-4 font-bold text-blue-700 bg-blue-50/60">NEX Platform</th>
                    <th className="p-4 font-semibold text-slate-500">YouTube / Free Playlists</th>
                    <th className="p-4 font-semibold text-slate-500">Traditional Test Series</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600">
                  <tr>
                    <td className="p-4 font-semibold text-slate-900">Study Structure</td>
                    <td className="p-4 font-bold text-blue-700 bg-blue-50/30">Single Guided Daily Rail (English + GS + Reasoning)</td>
                    <td className="p-4 text-slate-500">Endless, unorganized playlists</td>
                    <td className="p-4 text-slate-500">Only test series, no guided study</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-semibold text-slate-900">Revision Enforcement</td>
                    <td className="p-4 font-bold text-blue-700 bg-blue-50/30">Hardcore Blocker (+3, +7, +20, +30)</td>
                    <td className="p-4 text-slate-500">None (Student forgets after 2 weeks)</td>
                    <td className="p-4 text-slate-500">Optional re-attempts</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-semibold text-slate-900">Sectional Timers</td>
                    <td className="p-4 font-bold text-blue-700 bg-blue-50/30">Strict 15-Minute Sectional Timers</td>
                    <td className="p-4 text-slate-500">No timers or practice interface</td>
                    <td className="p-4 text-slate-500">60-minute combined blocks</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-semibold text-slate-900">Short Tricks & Solutions</td>
                    <td className="p-4 font-bold text-blue-700 bg-blue-50/30">Slide-in 10-Second Vedic Shortcuts</td>
                    <td className="p-4 text-slate-500">Lengths of 30-min long video methods</td>
                    <td className="p-4 text-slate-500">Textbook lengthy solutions</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-semibold text-slate-900">Adaptive Mocks</td>
                    <td className="p-4 font-bold text-blue-700 bg-blue-50/30">AI generated based on completed lessons</td>
                    <td className="p-4 text-slate-500">None</td>
                    <td className="p-4 text-slate-500">Static question sets</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION: FREQUENTLY ASKED QUESTIONS */}
      <section id="faq" className="py-20 bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
              Clear Answers
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 mt-3 tracking-tight">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4">
            {[
              {
                q: "What is the Hardcore Blocker and how does it work?",
                a: "When you finish a lesson, NEX schedules automated spaced-repetition checks at Days +3, +7, +20, and +30. Each revision has a 2-day buffer deadline. If you do not pass the revision before the deadline, all new daily lessons become locked until you clear your pending revision test with at least 80% marks."
              },
              {
                q: "Why does NEX enforce 15-minute timers for sectional mocks?",
                a: "In the updated exam pattern for SSC CGL Tier 1, students must solve 25 questions per section in exactly 15 minutes. Training under the exact 15-minute countdown eliminates hesitation and guarantees you finish the paper with buffer time."
              },
              {
                q: "Can I choose which subjects to study each day?",
                a: "NEX follows a 4-Stage sequential curriculum: Stage 1 focuses on English and Modern History, Stage 2 on Advanced Maths and Polity, Stage 3 on Arithmetic and Geography, and Stage 4 on full mocks and remaining GS topics. You study structured core topics a day plus a daily reasoning drill, ensuring deep mastery without burnout."
              },
              {
                q: "What happens if I score below 80% on a revision test?",
                a: "NEX engages the Stage 3 Penalty Retest loop. You are forced to re-watch the video lecture and re-attempt the test until you achieve the 80% passing threshold, ensuring you never carry weak concepts forward."
              },
              {
                q: "What are Dynamic AI Mocks?",
                a: "Inside the Syllabus Analysis section, you can click 'Generate Dynamic Mock' for any subject. The system inspects your completed lessons and generates a 25-question 15-minute test testing strictly the topics you have completed."
              }
            ].map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div key={idx} className="border border-slate-200 rounded-2xl bg-slate-50/60 overflow-hidden">
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full p-5 text-left font-bold text-slate-900 flex items-center justify-between gap-4 hover:bg-slate-100/70 transition"
                  >
                    <span className="text-sm sm:text-base">{faq.q}</span>
                    <span className={`text-slate-400 font-mono text-lg transition-transform ${isOpen ? 'rotate-90' : ''}`}>
                      ›
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-200/60">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* BOTTOM CTA BANNER */}
      <section className="py-20 bg-gradient-to-b from-blue-50 to-white text-center">
        <div className="max-w-4xl mx-auto px-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 border border-blue-200 text-blue-800 text-xs font-bold mb-4">
            <Zap className="w-3.5 h-3.5" /> Stop Guessing What to Study Today
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
            Mount Your SSC Study Rail on NEX.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 max-w-xl mx-auto leading-relaxed">
            Join thousands of serious SSC aspirants mastering the syllabus through strict spaced repetition.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto h-13 px-9 text-base bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/25 transition transform hover:-translate-y-0.5">
                Start Day 1 Free
              </Button>
            </Link>
            <Link to="/login" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto h-13 px-8 text-base border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl">
                Existing Student Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-10 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="NEX" className="h-9 w-9 object-contain rounded-xl shadow-sm border border-slate-200/80" />
            <span className="font-bold text-slate-900 text-sm">NEX</span>
            <span>• Built for SSC CGL 2026/2027 Aspirants</span>
          </div>

          <div className="flex items-center gap-6">
            <a href="#method" className="hover:text-blue-600 transition">Study Method</a>
            <a href="#features" className="hover:text-blue-600 transition">Features</a>
            <a href="#roadmap" className="hover:text-blue-600 transition">Roadmap</a>
            <Link to="/login" className="hover:text-blue-600 transition">Login</Link>
            <Link to="/register" className="hover:text-blue-600 transition">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
