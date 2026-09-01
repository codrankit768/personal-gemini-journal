import React, { useState } from 'react';
import { 
  BookOpen, 
  ShieldCheck, 
  Sparkles, 
  Lock, 
  HeartHandshake, 
  BrainCircuit, 
  ArrowRight,
  AlertCircle,
  Database,
  CheckCircle2
} from 'lucide-react';
import { MOODS, ALL_MOOD_KEYS } from './MoodBadge';

interface LandingPageProps {
  onSignIn: () => Promise<void>;
  onViewThreatModel: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onSignIn,
  onViewThreatModel
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      await onSignIn();
    } catch (err: any) {
      console.error('Sign-in failed:', err);
      setError(err?.message || 'Failed to authenticate with Google. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-between py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Hero Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center my-auto">
        {/* Left Column: Value Prop & Actions */}
        <div className="lg:col-span-7 space-y-6 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100/80 text-amber-900 border border-amber-200 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-amber-700" />
            <span>AI-Assisted Personal Reflection & Mood Tracking</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-stone-900 tracking-tight leading-[1.15]">
            A private sanctuary for your <span className="italic text-amber-800">deepest thoughts</span> and reflections.
          </h1>

          <p className="text-base sm:text-lg text-stone-600 max-w-2xl leading-relaxed">
            Write uninhibitedly, engage in multi-turn introspective dialogues with Gemini, and unlock weekly mood reflections—all protected by strict cloud database authorization.
          </p>

          {/* Error Banner if Sign-In Fails */}
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-800 text-sm animate-fadeIn">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1 flex-1">
                <p className="font-semibold">Authentication Notice</p>
                <p className="text-xs text-rose-700">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-xs font-semibold text-rose-600 hover:text-rose-900 cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
            <button
              type="button"
              id="btn-google-signin"
              onClick={handleSignIn}
              disabled={loading}
              className="px-6 py-3.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed group"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              <span>{loading ? 'Authenticating with Google...' : 'Continue with Google'}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              type="button"
              onClick={onViewThreatModel}
              className="px-5 py-3.5 rounded-xl bg-white hover:bg-stone-100 text-stone-800 font-semibold text-sm border border-stone-200 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
            >
              <ShieldCheck className="w-4 h-4 text-amber-700" />
              <span>Inspect Security Model</span>
            </button>
          </div>

          {/* Privacy & Zero-Knowledge Guarantee Badges */}
          <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-stone-600">
            <div className="flex items-center gap-2 bg-white p-2.5 rounded-lg border border-stone-200/70 shadow-xs">
              <Lock className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Zero client API key exposure (server-side proxy)</span>
            </div>
            <div className="flex items-center gap-2 bg-white p-2.5 rounded-lg border border-stone-200/70 shadow-xs">
              <Database className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Firestore user-isolated document hierarchy</span>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Mood & Preview Showcase */}
        <div className="lg:col-span-5">
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-full blur-2xl pointer-events-none -z-0" />

            <div className="space-y-2 relative z-10">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                  Supported Mood States
                </span>
                <span className="text-[11px] font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full">
                  7 Core Dimensions
                </span>
              </div>
              
              {/* Mood Badges Grid */}
              <div className="flex flex-wrap gap-2 pt-2">
                {ALL_MOOD_KEYS.map((mood) => {
                  const cfg = MOODS[mood];
                  return (
                    <div
                      key={mood}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${cfg.bgClass} ${cfg.textClass} ${cfg.borderClass}`}
                    >
                      <span>{cfg.emoji}</span>
                      <span>{cfg.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-stone-100 pt-5 space-y-3 relative z-10">
              <div className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                Automated Post-Save Intelligence
              </div>
              <div className="space-y-2 text-xs text-stone-700">
                <div className="flex items-start gap-2 bg-stone-50 p-2.5 rounded-lg border border-stone-100">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <div>
                    <strong className="text-stone-900">Concise 1-3 Sentence Summary:</strong> Crystalizes your entry essence.
                  </div>
                </div>
                <div className="flex items-start gap-2 bg-stone-50 p-2.5 rounded-lg border border-stone-100">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <div>
                    <strong className="text-stone-900">Key Themes:</strong> Identifies underlying patterns and emotional anchors.
                  </div>
                </div>
                <div className="flex items-start gap-2 bg-stone-50 p-2.5 rounded-lg border border-stone-100">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <div>
                    <strong className="text-stone-900">Reflection Questions:</strong> Deep questions prompting next-level introspection.
                  </div>
                </div>
                <div className="flex items-start gap-2 bg-stone-50 p-2.5 rounded-lg border border-stone-100">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <div>
                    <strong className="text-stone-900">Practical Next Steps:</strong> Actionable suggestions for peace of mind and progress.
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-amber-50/70 rounded-xl p-3.5 border border-amber-100/80 text-xs text-amber-900 flex items-start gap-2.5">
              <HeartHandshake className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <span>
                <strong>Ethical AI Guardrails:</strong> Non-diagnostic, confidential, and empathetic. Personal Gemini Journal never provides medical or psychiatric diagnoses.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer info */}
      <div className="text-center pt-8 text-xs text-stone-500 border-t border-stone-200/80 mt-12 flex flex-col sm:flex-row items-center justify-between gap-4">
        <span>Personal Gemini Journal • Cloud Firestore & Firebase Auth Secured</span>
        <button
          onClick={onViewThreatModel}
          className="text-stone-600 hover:text-amber-800 underline font-medium cursor-pointer"
        >
          View Threat Summary & Mitigations Table
        </button>
      </div>
    </div>
  );
};
