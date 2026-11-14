import React, { useState, useEffect } from 'react';
import {
  ArrowUp,
  Cookie,
  MessageCircle,
  X,
  Search,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Send,
  CheckCircle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const EnhancedSiteFeatures: React.FC = () => {
  const navigate = useNavigate();

  // Scroll Progress & Back to Top
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showBackToTop, setShowBackToTop] = useState(false);

  // Cookie Banner
  const [cookieConsent, setCookieConsent] = useState(() => {
    return localStorage.getItem('nex_cookie_consent') === 'true';
  });

  // Global Site Search Modal
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Floating Contact / Feedback Modal
  const [contactOpen, setContactOpen] = useState(false);
  const [contactMsg, setContactMsg] = useState('');
  const [contactSuccess, setContactSuccess] = useState(false);

  // FAQ Modal
  const [faqOpen, setFaqOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollTop;
      const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      if (windowHeight > 0) {
        setScrollProgress((totalScroll / windowHeight) * 100);
      }
      setShowBackToTop(totalScroll > 320);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Keyboard shortcut Ctrl+K / Cmd+K for Site Search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setContactOpen(false);
        setFaqOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // UTM Tracking capture
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const utmSource = params.get('utm_source');
      const utmCampaign = params.get('utm_campaign');
      const utmMedium = params.get('utm_medium');
      if (utmSource || utmCampaign) {
        sessionStorage.setItem('nex_utm', JSON.stringify({
          source: utmSource,
          campaign: utmCampaign,
          medium: utmMedium,
          captured_at: new Date().toISOString(),
        }));
      }
    } catch {}
  }, []);

  const handleAcceptCookies = () => {
    localStorage.setItem('nex_cookie_consent', 'true');
    setCookieConsent(true);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const searchableRoutes = [
    { title: 'Dashboard', desc: '180-day master trajectory & daily goals', path: '/dashboard' },
    { title: 'Syllabus & Analysis', desc: 'Syllabus mastery breakdown & radar charts', path: '/analysis' },
    { title: 'Previous Year Papers (PYQ)', desc: 'Official solved papers and shift tests', path: '/pyq' },
    { title: 'Current Affairs & Monthly Drill', desc: 'High-yield exam bulletin and MCQs', path: '/current-affairs' },
    { title: 'Completed Lessons Archive', desc: 'Re-attend and review past lessons', path: '/completed-lessons' },
    { title: 'Full-Length Mock Arena', desc: '100-Question simulated exam test', path: '/mock-arena' },
    { title: 'Admin Control Hub', desc: 'Lessons architect & examination parameters', path: '/admin' },
  ];

  const filteredRoutes = searchableRoutes.filter((r) =>
    r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const faqs = [
    {
      q: 'How does the NEX 180-Day Spaced Repetition work?',
      a: 'After completing any Stage 1 video and Stage 3 simulator, NEX automatically schedules active recall tests at +3, +7, +20, and +30 days. This shifts concepts from working memory into permanent exam-hall memory.',
    },
    {
      q: 'What happens if I miss my scheduled revision by 2 days?',
      a: 'To guarantee exam-readiness, upcoming daily lessons are locked until you clear pending overdue reviews. This ensures no knowledge decay.',
    },
    {
      q: 'How are the 3-Set Stage 3 Quizzes structured?',
      a: 'Set 1 is Medium (initial speed), Set 2 is Medium-Hard (trap defense), Set 3 is Tier 2 Advanced. If you retake the test, questions are intelligently shuffled across all 3 tiers.',
    },
    {
      q: 'Can I re-watch past completed lessons?',
      a: 'Yes! Navigate to Completed Lessons from the bottom navigation or menu to re-watch videos and retake active recall tests anytime.',
    },
  ];

  return (
    <>
      {/* 1. Skip to Content Accessibility Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 z-[99999] px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-2xl outline-none"
      >
        Skip to main content
      </a>

      {/* 2. Top Scroll Progress Bar */}
      <div
        className="fixed top-0 left-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-amber-500 z-[9998] transition-all duration-150 ease-out pointer-events-none"
        style={{ width: `${scrollProgress}%` }}
        aria-hidden="true"
      />

      {/* 3. Global Floating Action Pill (Bottom Right) */}
      <div className="fixed bottom-20 md:bottom-6 right-5 z-40 flex flex-col items-end gap-2.5">
        {/* Back to Top Button */}
        {showBackToTop && (
          <button
            onClick={scrollToTop}
            aria-label="Back to top"
            className="p-3 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 shadow-xl transition active:scale-95 group"
          >
            <ArrowUp className="w-4 h-4 transition-transform group-hover:-translate-y-0.5" />
          </button>
        )}

        {/* Site Search Trigger */}
        <button
          onClick={() => setSearchOpen(true)}
          aria-label="Site Search (Ctrl+K)"
          className="p-3 rounded-2xl bg-white hover:bg-slate-50 text-blue-600 border border-slate-200 shadow-xl transition active:scale-95"
          title="Search Platform (Ctrl+K)"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Floating Help & Contact Button */}
        <button
          onClick={() => setContactOpen(true)}
          aria-label="Contact / Ask Educator"
          className="px-3.5 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-xl shadow-blue-600/25 border border-blue-500/20 flex items-center gap-2 transition active:scale-95"
        >
          <MessageCircle className="w-4 h-4" />
          <span className="hidden sm:inline">Ask NEX</span>
        </button>
      </div>

      {/* 4. Global Search Modal (Ctrl+K) */}
      {searchOpen && (
        <div className="fixed inset-0 z-[10000] bg-slate-900/50 backdrop-blur-sm flex items-start justify-center p-4 pt-20 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 max-w-xl w-full rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center gap-3">
              <Search className="w-5 h-5 text-slate-400" />
              <input
                autoFocus
                type="text"
                placeholder="Search modules, lessons, or quick links... (Esc to close)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 outline-none"
              />
              <button
                onClick={() => setSearchOpen(false)}
                className="text-xs px-2 py-1 rounded-lg bg-slate-100 text-slate-500 font-mono"
              >
                ESC
              </button>
            </div>

            <div className="p-2 max-h-80 overflow-y-auto divide-y divide-slate-100">
              {filteredRoutes.map((item) => (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    setSearchOpen(false);
                  }}
                  className="w-full p-3.5 rounded-2xl text-left hover:bg-slate-50 transition flex items-center justify-between group"
                >
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition">
                      {item.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {item.desc}
                    </p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition" />
                </button>
              ))}

              {filteredRoutes.length === 0 && (
                <div className="p-8 text-center text-xs text-slate-400">
                  No direct routes matching "{searchQuery}".
                </div>
              )}
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span>Platform Navigator</span>
              <button
                onClick={() => {
                  setSearchOpen(false);
                  setFaqOpen(true);
                }}
                className="text-blue-600 hover:underline font-bold"
              >
                View Spaced-Repetition FAQ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Contact / Ask Educator Floating Dialog */}
      {contactOpen && (
        <div className="fixed inset-0 z-[10000] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 max-w-md w-full rounded-3xl p-6 shadow-2xl relative">
            <button
              onClick={() => setContactOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1 mb-4">
              <span className="text-[10px] font-bold tracking-wider uppercase text-blue-600">
                Aspirant Support
              </span>
              <h3 className="text-lg font-black text-slate-900">Ask NEX Academic Desk</h3>
              <p className="text-xs text-slate-500">
                Have a doubt on Vedic shortcuts, syllabus pacing, or platform features? Drop your note below.
              </p>
            </div>

            {contactSuccess ? (
              <div className="p-6 text-center space-y-2 bg-emerald-50 rounded-2xl border border-emerald-200">
                <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto" />
                <h4 className="text-xs font-bold text-emerald-900">Message Dispatched</h4>
                <p className="text-[11px] text-emerald-700">
                  Our academic educator team will review your query within 24 hours.
                </p>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!contactMsg.trim()) return;
                  setContactSuccess(true);
                  setTimeout(() => {
                    setContactSuccess(false);
                    setContactOpen(false);
                    setContactMsg('');
                  }, 2200);
                }}
                className="space-y-3"
              >
                <textarea
                  required
                  rows={4}
                  placeholder="Describe your query or topic challenge in detail..."
                  value={contactMsg}
                  onChange={(e) => setContactMsg(e.target.value)}
                  className="w-full text-xs p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                />

                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Priority Queue: Active</span>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-600/20 active:scale-95 transition"
                  >
                    <span>Send Query</span>
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* 6. Expandable FAQ Modal */}
      {faqOpen && (
        <div className="fixed inset-0 z-[10000] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 max-w-lg w-full rounded-3xl p-6 shadow-2xl relative max-h-[85vh] overflow-y-auto">
            <button
              onClick={() => setFaqOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black text-slate-900 mb-1">
              Frequently Asked Questions
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Everything you need to know about the 180-Day Guided Mastery methodology.
            </p>

            <div className="space-y-3">
              {faqs.map((faq, idx) => {
                const isOpen = activeFaq === idx;
                return (
                  <div
                    key={idx}
                    className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/50"
                  >
                    <button
                      onClick={() => setActiveFaq(isOpen ? null : idx)}
                      className="w-full p-4 text-left flex items-center justify-between gap-3 text-xs font-bold text-slate-900"
                    >
                      <span>{faq.q}</span>
                      {isOpen ? <ChevronUp className="w-4 h-4 shrink-0" /> : <ChevronDown className="w-4 h-4 shrink-0" />}
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-2">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 7. Simple GDPR / Cookie Banner */}
      {!cookieConsent && (
        <div className="fixed bottom-4 left-4 right-4 md:left-6 md:right-auto md:max-w-md z-[9990] p-4 rounded-3xl bg-slate-900 text-white backdrop-blur-2xl border border-slate-800 shadow-2xl animate-in slide-in-from-bottom duration-300">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
              <Cookie className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-bold">Session & Spaced-Repetition Cookies</h4>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                NEX uses local storage and cookies strictly to preserve your active test timers and 180-day streak progress.
              </p>
              <div className="pt-2 flex items-center gap-2">
                <button
                  onClick={handleAcceptCookies}
                  className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/30 transition active:scale-95"
                >
                  Accept & Continue
                </button>
                <button
                  onClick={() => setCookieConsent(true)}
                  className="px-3 py-1.5 rounded-xl text-slate-400 hover:text-white text-xs"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
