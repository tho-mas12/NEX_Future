import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Flame, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/useAuthStore';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const user = await login(email, password);
      if (user.role === 'admin') {
        navigate('/admin');
      } else if (!user.onboarding_completed) {
        navigate('/onboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-slate-50 font-sans">
      {/* Left Column: Motivation & Blueprint */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-blue-50 via-indigo-50/50 to-slate-50 border-r border-slate-200 relative overflow-hidden">
        {/* Top Logo */}
        <Link to="/" className="flex items-center gap-3 z-10">
          <img
            src="/logo.png"
            alt="NEX Logo"
            className="h-11 w-11 object-contain rounded-xl shadow-sm border border-slate-200/80 shrink-0"
          />
          <span className="font-black text-2xl tracking-tight text-slate-900">
            NEX
          </span>
        </Link>

        {/* Center Quote & Visual Concept */}
        <div className="space-y-8 max-w-lg z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 border border-blue-200 text-xs font-bold text-blue-800">
            <Flame className="h-3.5 w-3.5 fill-blue-600 text-blue-600" />
            180 Days to Central Government Officer
          </div>

          <blockquote className="text-3xl font-black tracking-tight text-slate-900 leading-snug">
            "You do not rise to the level of your goals. You fall to the level of your systems."
          </blockquote>

          <p className="text-slate-600 text-sm leading-relaxed">
            NEX eliminates the paralysis of endless YouTube playlists. One day, two focused subjects, sharp notes, and active spaced-repetition quizzes.
          </p>

          <div className="space-y-3 pt-4 border-t border-slate-200">
            <div className="flex items-center gap-3 text-sm text-slate-700 font-medium">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>Full Tier 1 & Tier 2 syllabus in 180 guided daily missions</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-700 font-medium">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>Strict 15-minute 25-question sectional simulators (Tier 1 Pattern)</span>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="text-xs text-slate-400 z-10">
          SSC CGL • SSC CHSL • 2026 Examination Track
        </div>
      </div>

      {/* Right Column: Login Form */}
      <div className="flex flex-col justify-center items-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-6">
          <div className="lg:hidden flex items-center justify-center gap-3 mb-4">
            <Link to="/" className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt="NEX"
                className="h-11 w-11 object-contain rounded-xl shadow-sm border border-slate-200/80 shrink-0"
              />
              <span className="font-black text-2xl text-slate-900">NEX</span>
            </Link>
          </div>

          <Card className="border-slate-200 bg-white shadow-xl rounded-3xl">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-black tracking-tight text-slate-900">
                Welcome back
              </CardTitle>
              <CardDescription className="text-slate-500 text-xs">
                Enter your registered email and password to resume today's mission.
              </CardDescription>
            </CardHeader>

            <CardContent>
              {error && (
                <div className="mb-4 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 font-bold">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700" htmlFor="email">
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
                    className="border-slate-300 rounded-xl"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700" htmlFor="password">
                      Password
                    </label>
                    <span className="text-xs text-blue-600 hover:underline cursor-pointer font-medium">
                      Forgot password?
                    </span>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="border-slate-300 rounded-xl"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm mt-2 shadow-md shadow-blue-600/20 rounded-xl h-11"
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

            <CardFooter className="flex flex-col space-y-4 border-t border-slate-100 pt-4 text-center">
              <p className="text-xs text-slate-500">
                Don't have an account yet?{' '}
                <Link to="/register" className="text-blue-600 hover:underline font-bold">
                  Start 15-Day Free Trial
                </Link>
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};
