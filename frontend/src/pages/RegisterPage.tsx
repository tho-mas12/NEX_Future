import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Loader2, ShieldCheck, Check } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/useAuthStore';

export const RegisterPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
      // Fresh user goes to onboarding wizard
      navigate('/onboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-slate-50 font-sans">
      {/* Left Column: Graphic & Value Proposition */}
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

        {/* Center Benefits */}
        <div className="space-y-8 max-w-lg z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800">
            <ShieldCheck className="h-3.5 w-3.5" />
            15-Day Free Trial • Instant Roadmap Generation
          </div>

          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 leading-tight">
            Stop guessing your syllabus. Follow the rail.
          </h2>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Personalized Diagnostic</p>
                <p className="text-xs text-slate-500">Test your baseline skill across Quant, English, Reasoning, and GS before Day 1 starts.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Strict 15-Minute Sectional Timers</p>
                <p className="text-xs text-slate-500">Simulate exact exam pressure with 25 questions in 15 minutes and negative marking.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Hardcore Spaced-Repetition Blocker</p>
                <p className="text-xs text-slate-500">Day +3, +7, +20, +30 automated reviews force you to retain every single concept.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="text-xs text-slate-400 z-10">
          SSC CGL • SSC CHSL • 2026/2027 Mastery Track
        </div>
      </div>

      {/* Right Column: Register Form */}
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
                Begin Your 180-Day Rail
              </CardTitle>
              <CardDescription className="text-slate-500 text-xs">
                Create your student account to build your personalized diagnostic syllabus.
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
                  <label className="text-xs font-bold text-slate-700" htmlFor="name">
                    Full Name
                  </label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Candidate Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="border-slate-300 rounded-xl"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700" htmlFor="email">
                    Email Address
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="candidate@examrail.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    className="border-slate-300 rounded-xl"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700" htmlFor="password">
                    Password (min 6 characters)
                  </label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="new-password"
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
                      Creating Account...
                    </>
                  ) : (
                    <>
                      Generate My 180-Day Rail
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4 border-t border-slate-100 pt-4 text-center">
              <p className="text-xs text-slate-500">
                Already have an account?{' '}
                <Link to="/login" className="text-blue-600 hover:underline font-bold">
                  Sign In
                </Link>
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};
