import React, { useState, useEffect } from 'react';
import type { User } from 'firebase/auth';
import type { JournalEntry, WeeklyReflection, MoodType } from '../types';
import { MoodBadge, ALL_MOOD_KEYS, MOODS } from './MoodBadge';
import { 
  Sparkles, 
  PenLine, 
  History, 
  TrendingUp, 
  Calendar, 
  Bot, 
  ArrowRight, 
  RotateCw, 
  HelpCircle, 
  ListChecks, 
  ShieldCheck, 
  Heart,
  FileText,
  AlertCircle
} from 'lucide-react';

interface DashboardViewProps {
  user: User;
  onNavigateToNewEntry: () => void;
  onNavigateToHistory: () => void;
  onSelectEntry: (entry: JournalEntry) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  user,
  onNavigateToNewEntry,
  onNavigateToHistory,
  onSelectEntry
}) => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [reflections, setReflections] = useState<WeeklyReflection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Weekly Reflection Generation State
  const [isGeneratingWeekly, setIsGeneratingWeekly] = useState(false);
  const [weeklyError, setWeeklyError] = useState<string | null>(null);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const { fetchUserJournalEntries, fetchUserWeeklyReflections } = await import('../lib/firebase');
      const [entriesData, reflectionsData] = await Promise.all([
        fetchUserJournalEntries(user.uid),
        fetchUserWeeklyReflections(user.uid)
      ]);
      setEntries(entriesData);
      setReflections(reflectionsData);
    } catch (err: any) {
      console.error('Failed to load dashboard data:', err);
      setError(err?.message || 'Failed to load data from Cloud Firestore.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [user.uid]);

  // Calculate mood counts
  const moodCounts: Record<MoodType, number> = {
    Happy: 0,
    Calm: 0,
    Neutral: 0,
    Sad: 0,
    Frustrated: 0,
    Anxious: 0,
    Motivated: 0
  };

  entries.forEach((e) => {
    if (e.mood && moodCounts[e.mood] !== undefined) {
      moodCounts[e.mood]++;
    }
  });

  const totalMoodsTagged = Object.values(moodCounts).reduce((a, b) => a + b, 0);

  // Generate Weekly AI Reflection
  const handleGenerateWeeklyReflection = async () => {
    if (entries.length === 0) {
      setWeeklyError('Write at least one journal entry to generate a weekly reflection.');
      return;
    }

    if (isGeneratingWeekly) return;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 28000);

    try {
      setIsGeneratingWeekly(true);
      setWeeklyError(null);

      const response = await fetch('/api/gemini/weekly-reflection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries: entries.slice(0, 15) }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to generate weekly reflection.');
      }

      const data = await response.json();
      const newReflection: WeeklyReflection = {
        id: `reflection_${Date.now()}`,
        userId: user.uid,
        periodStart: Date.now() - 7 * 24 * 60 * 60 * 1000,
        periodEnd: Date.now(),
        reflection: data.reflection,
        moodDistribution: data.moodDistribution || moodCounts,
        keyThemes: data.keyThemes || [],
        suggestedFocus: data.suggestedFocus || [],
        entryCount: entries.length,
        createdAt: Date.now()
      };

      const { saveWeeklyReflection } = await import('../lib/firebase');
      await saveWeeklyReflection(newReflection);
      setReflections([newReflection, ...reflections]);
    } catch (err: any) {
      console.error('Weekly reflection generation failed:', err);
      setWeeklyError(err?.message || 'Could not generate weekly reflection. Please check Gemini connection.');
    } finally {
      setIsGeneratingWeekly(false);
    }
  };

  const latestReflection = reflections[0];
  const recentEntries = entries.slice(0, 3);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Welcome Hero & Quick Action */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-xs relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-amber-50 rounded-full blur-3xl pointer-events-none -z-0" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100/70 text-amber-900 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-amber-700" />
              <span>Personal Reflection Space</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 tracking-tight">
              Welcome back, {user.displayName ? user.displayName.split(' ')[0] : 'Mindful Explorer'}
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 max-w-xl leading-relaxed">
              Take a mindful breath. What thoughts, feelings, or breakthroughs would you like to explore today?
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              id="btn-dashboard-new-entry"
              onClick={onNavigateToNewEntry}
              className="px-5 py-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs sm:text-sm shadow-xs transition-all flex items-center gap-2 cursor-pointer"
            >
              <PenLine className="w-4 h-4" />
              <span>Write Today's Entry</span>
            </button>
            <button
              type="button"
              onClick={onNavigateToHistory}
              className="px-4 py-3 rounded-xl bg-white hover:bg-stone-50 text-stone-800 font-semibold text-xs sm:text-sm border border-stone-200 transition-colors flex items-center gap-2 cursor-pointer shadow-2xs"
            >
              <History className="w-4 h-4 text-stone-500" />
              <span>Browse History</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats & Mood Distribution Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Mood Analytics & History Breakdown (7 Core Moods) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-stone-200 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div>
              <h3 className="font-serif font-bold text-base text-stone-900">
                Mood History & Distribution
              </h3>
              <p className="text-xs text-stone-500">
                Emotional landscape recorded across {totalMoodsTagged} entries
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-stone-100 rounded-full text-stone-700">
              7 Core Dimensions
            </span>
          </div>

          {/* Mood Bars */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {ALL_MOOD_KEYS.map((m) => {
              const cfg = MOODS[m];
              const count = moodCounts[m] || 0;
              const percentage = totalMoodsTagged > 0 ? Math.round((count / totalMoodsTagged) * 100) : 0;

              return (
                <div
                  key={m}
                  className="p-3 rounded-xl bg-stone-50/70 border border-stone-100 space-y-2 hover:bg-stone-50 transition-colors"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 font-medium text-stone-800">
                      <span>{cfg.emoji}</span>
                      <span>{cfg.label}</span>
                    </div>
                    <span className="font-mono text-[11px] text-stone-500">
                      {count} ({percentage}%)
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-stone-200/70 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${cfg.dotColor} transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Quick Insights Overview */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-stone-200 shadow-xs flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-serif font-bold text-base text-stone-900">
                Journaling Continuity
              </h3>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-100/80 space-y-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-800">
                  Total Entries
                </span>
                <p className="text-2xl font-bold font-serif text-stone-900">
                  {entries.length}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-100/80 space-y-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-800">
                  Firestore ABAC
                </span>
                <p className="text-xs font-semibold text-emerald-900 flex items-center gap-1 pt-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  Active
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-100 text-xs text-stone-600 leading-relaxed">
              <strong className="text-stone-900 block mb-1">Privacy Guarantee:</strong>
              Your journal entries and Gemini conversations are isolated under your private authenticated UID. Never shared or aggregated across accounts.
            </div>
          </div>

          <button
            type="button"
            onClick={onNavigateToNewEntry}
            className="w-full py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <PenLine className="w-3.5 h-3.5" />
            <span>Create New Reflection</span>
          </button>
        </div>
      </div>

      {/* AI-Generated Weekly Reflection Section */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-serif font-bold text-stone-900">
                AI-Generated Weekly Reflection & Synthesis
              </h2>
              <p className="text-xs text-stone-500">
                Synthesized by Gemini across your recent journal entries and mood patterns
              </p>
            </div>
          </div>

          <button
            type="button"
            id="btn-generate-weekly-reflection"
            onClick={handleGenerateWeeklyReflection}
            disabled={isGeneratingWeekly || entries.length === 0}
            className="px-4 py-2.5 bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs sm:text-sm font-semibold rounded-xl transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed self-start sm:self-auto shadow-2xs"
          >
            {isGeneratingWeekly ? (
              <div className="w-4 h-4 border-2 border-amber-900/30 border-t-amber-900 rounded-full animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 text-amber-700" />
            )}
            <span>
              {latestReflection ? 'Refresh Weekly Reflection' : 'Generate Weekly Reflection'}
            </span>
          </button>
        </div>

        {weeklyError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{weeklyError}</span>
          </div>
        )}

        {isGeneratingWeekly && (
          <div className="p-8 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-amber-200 border-t-amber-600 rounded-full animate-spin mx-auto" />
            <p className="text-xs font-medium text-stone-600">
              Gemini is synthesizing your weekly journal reflections and themes...
            </p>
          </div>
        )}

        {latestReflection && !isGeneratingWeekly && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-7 bg-stone-50/80 rounded-2xl p-5 sm:p-6 border border-stone-200/80 space-y-4">
              <div className="text-xs font-semibold text-stone-500 uppercase tracking-wider flex items-center justify-between">
                <span>Weekly Retrospective</span>
                <span className="text-stone-400 font-normal">
                  {new Date(latestReflection.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm text-stone-800 leading-relaxed whitespace-pre-wrap font-serif">
                {latestReflection.reflection}
              </p>
            </div>

            <div className="lg:col-span-5 space-y-4">
              {/* Overarching Themes */}
              {latestReflection.keyThemes && latestReflection.keyThemes.length > 0 && (
                <div className="bg-white rounded-2xl p-5 border border-stone-200/80 space-y-2 shadow-2xs">
                  <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider block">
                    Weekly Themes
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {latestReflection.keyThemes.map((t, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-900 border border-amber-200"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggested Focus */}
              {latestReflection.suggestedFocus && latestReflection.suggestedFocus.length > 0 && (
                <div className="bg-white rounded-2xl p-5 border border-stone-200/80 space-y-2.5 shadow-2xs">
                  <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
                    <ListChecks className="w-3.5 h-3.5 text-emerald-600" />
                    Mindful Intentions For Next Week
                  </span>
                  <ul className="space-y-2">
                    {latestReflection.suggestedFocus.map((focus, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2 text-xs text-stone-700 bg-emerald-50/40 p-2.5 rounded-lg border border-emerald-100"
                      >
                        <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span>{focus}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {!latestReflection && !isGeneratingWeekly && (
          <div className="p-8 text-center border border-dashed border-stone-200 rounded-2xl space-y-2">
            <Sparkles className="w-8 h-8 text-amber-500 mx-auto opacity-60" />
            <h4 className="text-sm font-semibold text-stone-800">
              No Weekly Reflection Generated Yet
            </h4>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              Click the button above to synthesize your entries into an empowering AI weekly overview.
            </p>
          </div>
        )}
      </div>

      {/* Recent Entries Strip */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div>
            <h2 className="text-lg font-serif font-bold text-stone-900">
              Recent Journal Entries
            </h2>
            <p className="text-xs text-stone-500">
              Quick access to your latest reflections
            </p>
          </div>
          <button
            type="button"
            onClick={onNavigateToHistory}
            className="text-xs font-semibold text-amber-800 hover:text-amber-950 flex items-center gap-1 cursor-pointer"
          >
            <span>View All ({entries.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentEntries.length === 0 ? (
          <div className="p-6 text-center text-xs text-stone-500">
            No entries written yet. Start by writing your first journal entry!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recentEntries.map((e) => (
              <div
                key={e.id}
                onClick={() => onSelectEntry(e)}
                className="p-4 rounded-xl bg-stone-50 hover:bg-amber-50/50 border border-stone-200/80 hover:border-amber-300 transition-all cursor-pointer space-y-2 group"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="text-stone-400 text-[11px]">
                    {new Date(e.createdAt).toLocaleDateString()}
                  </span>
                  {e.mood && <MoodBadge mood={e.mood} size="sm" />}
                </div>
                <h4 className="font-serif font-bold text-sm text-stone-900 group-hover:text-amber-900 line-clamp-1">
                  {e.title}
                </h4>
                <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                  {e.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
