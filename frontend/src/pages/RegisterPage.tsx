import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Loader2, ShieldCheck, Check, Eye, EyeOff } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/useAuthStore';
import { LogoRevealOverlay } from '@/components/LogoRevealOverlay';

export const RegisterPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showRegisterReveal, setShowRegisterReveal] = useState(false);

  const { register } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      await register(name, email, password);
      // Trigger full screen logo revealing transition into onboarding
      setShowRegisterReveal(true);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
      setLoading(false);
    }
  };

  const handleRevealComplete = () => {
    navigate('/onboard');
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 font-sans relative">
      {/* Full-Screen Logo Reveal Overlay on Signup Transition */}
      {showRegisterReveal && (
        <LogoRevealOverlay forceShow onComplete={handleRevealComplete} />
      )}

      {/* Left Column: Graphic & Value Proposition */}
      <div className="hidden lg:flex flex-col justify-between p-12 border-r border-white/10 relative overflow-hidden backdrop-blur-md">
        {/* Top Logo */}
        <Link to="/" className="flex items-center gap-3 z-10">
          <img
            src="/logo.png"
            alt="NEX Logo"
            className="h-11 w-11 object-contain rounded-xl shadow-lg border border-white/15 shrink-0"
          />
          <span className="font-black text-2xl tracking-tight text-white">
            NEX
          </span>
        </Link>

        {/* Center Benefits List */}
        <div className="space-y-6 max-w-lg z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-400/30 text-xs font-bold text-amber-300">
            <ShieldCheck className="h-4 w-4 text-amber-400" />
            180-Day Guaranteed Blueprint
          </div>

          <h1 className="text-4xl font-black text-white leading-tight tracking-tight">
            Stop Studying Aimlessly. Start Your 180-Day Guided Rail.
          </h1>

          <div className="space-y-3.5 pt-2">
            {[
              'Stage 1: Verified high-yield video lectures with zero fluff',
              'Stage 2: Active Recall drill with hidden step-by-step Vedic tricks',
              'Stage 3: 15-Minute TCS sectional exam arena with automated mistake notebook',
              'Stage 4: Mandatory spaced repetition lock gates (+3, +7, +20, +30 days)',
            ].map((text, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <div className="h-5 w-5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="h-3 w-3 stroke-[3]" />
                </div>
                <span className="text-xs text-slate-300 font-medium leading-relaxed">
                  {text}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="text-xs text-slate-400 z-10">
          Structured for SSC CGL 2026, CHSL 2026 & Central Examinations
        </div>
      </div>

      {/* Right Column: Register Form */}
      <div className="flex flex-col justify-center items-center p-6 sm:p-12 relative z-10">
        <div className="w-full max-w-md space-y-6">
          <div className="lg:hidden flex items-center justify-center gap-3 mb-4">
            <Link to="/" className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt="NEX Logo"
                className="h-11 w-11 object-contain rounded-xl shadow-lg border border-white/15 shrink-0"
              />
              <span className="font-black text-2xl text-white">NEX</span>
            </Link>
          </div>

          <Card className="border border-white/10 bg-slate-900/80 backdrop-blur-2xl shadow-2xl rounded-3xl overflow-hidden">
            <CardHeader className="space-y-1 pb-4 border-b border-white/5">
              <CardTitle className="text-2xl font-black tracking-tight text-white">
                Initialize Candidate Profile
              </CardTitle>
              <CardDescription className="text-slate-400 text-xs">
                Set up your 180-day trajectory. Zero payment details needed.
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-6">
              {error && (
                <div className="mb-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 p-3.5 text-xs text-rose-300 font-bold animate-in fade-in">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300" htmlFor="name">
                    Full Name
                  </label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="e.g. Arjun Sharma"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="border-white/15 bg-white/5 text-white placeholder:text-slate-500 rounded-xl h-11"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300" htmlFor="email">
                    Email Address
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="arjun@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    className="border-white/15 bg-white/5 text-white placeholder:text-slate-500 rounded-xl h-11"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300" htmlFor="password">
                    Create Password
                  </label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Minimum 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="new-password"
                      className="border-white/15 bg-white/5 text-white placeholder:text-slate-500 rounded-xl pr-10 h-11"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-white"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-slate-950 font-black text-sm mt-3 shadow-lg shadow-amber-500/25 rounded-xl h-11 active:scale-95 transition"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Building Custom Syllabus...
                    </>
                  ) : (
                    <>
                      Enter Day 1 Arena
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            </CardContent>

            <CardFooter className="flex flex-col space-y-3 border-t border-white/5 pt-4 text-center">
              <p className="text-xs text-slate-400">
                Already have an account?{' '}
                <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-bold hover:underline">
                  Log in here
                </Link>
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};
