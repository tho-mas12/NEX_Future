import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Flame, ArrowRight, Loader2, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/useAuthStore';
import { LogoRevealOverlay } from '@/components/LogoRevealOverlay';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showLoginReveal, setShowLoginReveal] = useState(false);

  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      await login(email, password);
      setSuccessMsg('Authentication successful! Initializing daily mastery trajectory...');
      
      // Trigger full screen logo revealing transition into the application
      setShowLoginReveal(true);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify your credentials.');
      setLoading(false);
    }
  };

  const handleRevealComplete = () => {
    const user = useAuthStore.getState().user;
    if (user?.role === 'admin') {
      navigate('/admin');
    } else if (!user?.onboarding_completed) {
      navigate('/onboard');
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 font-sans relative">
      {/* Seamless Full-Screen Logo Reveal Overlay on Login Transition */}
      {showLoginReveal && (
        <LogoRevealOverlay forceShow onComplete={handleRevealComplete} />
      )}

      {/* Left Column: Motivation & Blueprint */}
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

        {/* Center Quote & Visual Concept */}
        <div className="space-y-8 max-w-lg z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/15 border border-indigo-400/30 text-xs font-bold text-indigo-300">
            <Flame className="h-3.5 w-3.5 fill-indigo-400 text-indigo-400" />
            180 Days to Central Government Officer
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl font-black text-white leading-tight tracking-tight">
              Predict the 2026 Shift Questions Before Walking Into The Hall.
            </h1>
            <p className="text-slate-300 text-sm leading-relaxed">
              Log in to access your customized Stage 1-4 syllabus blueprint, automated spaced repetition gates, and live percentile mocks.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10 text-xs">
            <div className="space-y-1">
              <span className="text-amber-400 font-bold block text-lg">15 Min Mocks</span>
              <span className="text-slate-400">TCS sectional condition simulation</span>
            </div>
            <div className="space-y-1">
              <span className="text-indigo-400 font-bold block text-lg">+3/+7/+20 Days</span>
              <span className="text-slate-400">Strict spaced memory blocker gates</span>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="text-xs text-slate-400 z-10 flex items-center justify-between">
          <span>SSC CGL • SSC CHSL • 2026 Examination Track</span>
          <span className="text-slate-500">v4.0 Cosmic Ash</span>
        </div>
      </div>

      {/* Right Column: Login Form */}
      <div className="flex flex-col justify-center items-center p-6 sm:p-12 relative z-10">
        <div className="w-full max-w-md space-y-6">
          <div className="lg:hidden flex items-center justify-center gap-3 mb-4">
            <Link to="/" className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt="NEX"
                className="h-11 w-11 object-contain rounded-xl shadow-lg border border-white/15 shrink-0"
              />
              <span className="font-black text-2xl text-white">NEX</span>
            </Link>
          </div>

          <Card className="border border-white/10 bg-slate-900/80 backdrop-blur-2xl shadow-2xl rounded-3xl overflow-hidden">
            <CardHeader className="space-y-1 pb-4 border-b border-white/5">
              <CardTitle className="text-2xl font-black tracking-tight text-white">
                Welcome back
              </CardTitle>
              <CardDescription className="text-slate-400 text-xs">
                Enter your registered credentials to resume today's mission.
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-6">
              {error && (
                <div className="mb-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 p-3.5 text-xs text-rose-300 font-bold animate-in fade-in">
                  {error}
                </div>
              )}

              {successMsg && (
                <div className="mb-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-3.5 text-xs text-emerald-300 font-bold flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300" htmlFor="email">
                    Email Address
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="student@examrail.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    className="border-white/15 bg-white/5 text-white placeholder:text-slate-500 rounded-xl h-11"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-300" htmlFor="password">
                      Password
                    </label>
                    <span className="text-xs text-indigo-400 hover:text-indigo-300 cursor-pointer font-medium">
                      Forgot password?
                    </span>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
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
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm mt-3 shadow-lg shadow-indigo-600/30 rounded-xl h-11 active:scale-95 transition"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Authenticating...
                    </>
                  ) : (
                    <>
                      Resume Daily Mission
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            </CardContent>

            <CardFooter className="flex flex-col space-y-3 border-t border-white/5 pt-4 text-center">
              <p className="text-xs text-slate-400">
                New candidate?{' '}
                <Link to="/register" className="text-amber-400 hover:text-amber-300 font-bold hover:underline">
                  Start 180-Day Guided Rail
                </Link>
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};
