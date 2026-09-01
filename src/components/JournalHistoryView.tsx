import React, { useState, useEffect } from 'react';
import type { User } from 'firebase/auth';
import type { JournalEntry, MoodType } from '../types';
import { MoodBadge, ALL_MOOD_KEYS } from './MoodBadge';
import { 
  Search, 
  Trash2, 
  Eye, 
  Calendar, 
  Sparkles, 
  MessageSquare, 
  FileText, 
  RotateCw, 
  X, 
  Bot, 
  HelpCircle, 
  ListChecks, 
  CheckCircle2,
  PenLine,
  ChevronRight
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface JournalHistoryViewProps {
  user: User;
  onSelectEntryToEdit: (entry: JournalEntry) => void;
  onNavigateToNewEntry: () => void;
}

export const JournalHistoryView: React.FC<JournalHistoryViewProps> = ({
  user,
  onSelectEntryToEdit,
  onNavigateToNewEntry
}) => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMoodFilter, setSelectedMoodFilter] = useState<MoodType | 'ALL'>('ALL');

  // Selected Entry for Detail Modal
  const [activeModalEntry, setActiveModalEntry] = useState<JournalEntry | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadEntries = async () => {
    try {
      setLoading(true);
      setError(null);
      const { fetchUserJournalEntries } = await import('../lib/firebase');
      const data = await fetchUserJournalEntries(user.uid);
      setEntries(data);
    } catch (err: any) {
      console.error('Failed to load journal entries:', err);
      setError(err?.message || 'Failed to load journal history from Firestore.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEntries();
  }, [user.uid]);

  const handleDelete = async (entryId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this journal entry? This cannot be undone.')) {
      return;
    }

    try {
      setDeletingId(entryId);
      const { deleteJournalEntry } = await import('../lib/firebase');
      await deleteJournalEntry(user.uid, entryId);
      setEntries(prev => prev.filter(item => item.id !== entryId));
      if (activeModalEntry?.id === entryId) {
        setActiveModalEntry(null);
      }
    } catch (err: any) {
      alert(err?.message || 'Failed to delete entry.');
    } finally {
      setDeletingId(null);
    }
  };

  // Filter entries
  const filteredEntries = entries.filter((entry) => {
    // Mood Filter
    if (selectedMoodFilter !== 'ALL' && entry.mood !== selectedMoodFilter) {
      return false;
    }

    // Search Query Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (entry.title || '').toLowerCase().includes(q);
      const matchContent = (entry.content || '').toLowerCase().includes(q);
      const matchSummary = (entry.insights?.summary || '').toLowerCase().includes(q);
      const matchThemes = (entry.insights?.themes || []).some(t => t.toLowerCase().includes(q));
      return matchTitle || matchContent || matchSummary || matchThemes;
    }

    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header & Controls */}
      <div className="bg-white rounded-2xl p-5 sm:p-7 border border-stone-200 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-900">
              Journal History & Archives
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
              Securely stored in your personal isolated Firestore collection ({entries.length} entries recorded)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadEntries}
              className="p-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl transition-colors cursor-pointer"
              title="Refresh journal entries"
            >
              <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              type="button"
              onClick={onNavigateToNewEntry}
              className="px-4 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs sm:text-sm font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <PenLine className="w-4 h-4" />
              <span>Write Entry</span>
            </button>
          </div>
        </div>

        {/* Search & Mood Filter Pills */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 pt-1">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search entries by title, text, summary, or #themes..."
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-stone-50 border border-stone-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-all placeholder:text-stone-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 text-xs"
              >
                Clear
              </button>
            )}
          </div>

          {/* Mood Filter Pill Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            <button
              type="button"
              onClick={() => setSelectedMoodFilter('ALL')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors border ${
                selectedMoodFilter === 'ALL'
                  ? 'bg-stone-900 text-white border-stone-900'
                  : 'bg-stone-100 text-stone-600 border-stone-200 hover:bg-stone-200'
              }`}
            >
              All Moods
            </button>
            {ALL_MOOD_KEYS.map((m) => (
              <MoodBadge
                key={m}
                mood={m}
                selected={selectedMoodFilter === m}
                onClick={() => setSelectedMoodFilter(selectedMoodFilter === m ? 'ALL' : m)}
                size="sm"
              />
            ))}
          </div>
        </div>
      </div>

      {/* Error Notice */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={loadEntries}
            className="text-xs font-bold underline hover:text-rose-950 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Entries List / Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl p-5 border border-stone-200/80 shadow-xs space-y-3 animate-pulse"
            >
              <div className="h-5 bg-stone-200 rounded-md w-3/4" />
              <div className="h-4 bg-stone-100 rounded-md w-1/2" />
              <div className="space-y-1.5 pt-2">
                <div className="h-3 bg-stone-100 rounded-md w-full" />
                <div className="h-3 bg-stone-100 rounded-md w-5/6" />
                <div className="h-3 bg-stone-100 rounded-md w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredEntries.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-stone-200 shadow-xs space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 mx-auto">
            <FileText className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-serif font-bold text-lg text-stone-900">
              {entries.length === 0 ? 'No journal entries yet' : 'No matching entries found'}
            </h3>
            <p className="text-xs sm:text-sm text-stone-500 max-w-sm mx-auto">
              {entries.length === 0
                ? 'Begin your personal journaling journey by writing your first reflective entry.'
                : 'Try adjusting your search terms or mood filter.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onNavigateToNewEntry}
            className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <PenLine className="w-4 h-4" />
            <span>Create New Entry</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredEntries.map((entry) => {
            const dateStr = new Date(entry.createdAt).toLocaleDateString(undefined, {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            });

            return (
              <div
                key={entry.id}
                onClick={() => setActiveModalEntry(entry)}
                className="bg-white rounded-2xl p-5 sm:p-6 border border-stone-200/90 hover:border-amber-400/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between cursor-pointer group space-y-4"
              >
                <div className="space-y-3">
                  {/* Top Bar: Date & Mood */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-medium text-stone-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {dateStr}
                    </span>
                    {entry.mood && <MoodBadge mood={entry.mood} size="sm" />}
                  </div>

                  {/* Title */}
                  <h3 className="font-serif font-bold text-base sm:text-lg text-stone-900 group-hover:text-amber-900 transition-colors line-clamp-1">
                    {entry.title || 'Untitled Reflection'}
                  </h3>

                  {/* Content Preview */}
                  <p className="text-xs sm:text-sm text-stone-600 line-clamp-3 leading-relaxed">
                    {entry.content}
                  </p>

                  {/* AI Summary Highlight if available */}
                  {entry.insights?.summary && (
                    <div className="bg-amber-50/60 rounded-xl p-2.5 border border-amber-100/70 text-xs text-amber-900 space-y-1">
                      <span className="font-semibold text-[10px] uppercase tracking-wider text-amber-700 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> AI Summary
                      </span>
                      <p className="italic text-[11px] line-clamp-2">
                        "{entry.insights.summary}"
                      </p>
                    </div>
                  )}

                  {/* Themes */}
                  {entry.insights?.themes && entry.insights.themes.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {entry.insights.themes.slice(0, 3).map((theme, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-stone-100 text-stone-600"
                        >
                          #{theme}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer Controls */}
                <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
                  <div className="flex items-center gap-3">
                    {entry.chatHistory && entry.chatHistory.length > 0 && (
                      <span className="flex items-center gap-1 text-[11px]">
                        <MessageSquare className="w-3 h-3 text-stone-400" />
                        {entry.chatHistory.length} turns
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectEntryToEdit(entry);
                      }}
                      className="p-1.5 text-stone-400 hover:text-stone-800 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
                      title="Edit Entry"
                    >
                      <PenLine className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDelete(entry.id, e)}
                      disabled={deletingId === entry.id}
                      className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer disabled:opacity-40"
                      title="Delete Entry"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <ChevronRight className="w-4 h-4 text-stone-300 group-hover:text-stone-700 group-hover:translate-x-0.5 transition-all ml-1" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal View */}
      {activeModalEntry && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden animate-fadeIn">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-stone-200 bg-stone-50/80 flex items-center justify-between shrink-0">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-stone-500">
                    {new Date(activeModalEntry.createdAt).toLocaleString(undefined, {
                      dateStyle: 'medium',
                      timeStyle: 'short'
                    })}
                  </span>
                  {activeModalEntry.mood && <MoodBadge mood={activeModalEntry.mood} size="sm" />}
                </div>
                <h3 className="text-lg sm:text-xl font-bold font-serif text-stone-900">
                  {activeModalEntry.title || 'Untitled Entry'}
                </h3>
              </div>
              <button
                onClick={() => setActiveModalEntry(null)}
                className="p-2 text-stone-400 hover:text-stone-800 hover:bg-stone-200/60 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Journal Body */}
              <div className="bg-stone-50/60 rounded-xl p-5 border border-stone-200/80">
                <div className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">
                  Journal Reflection
                </div>
                <p className="text-sm text-stone-800 leading-relaxed whitespace-pre-wrap">
                  {activeModalEntry.content}
                </p>
              </div>

              {/* AI Insights Section */}
              {activeModalEntry.insights && (
                <div className="bg-amber-50/40 rounded-xl p-5 border border-amber-200/70 space-y-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-900 uppercase tracking-wider">
                    <Sparkles className="w-4 h-4 text-amber-700" />
                    <span>AI Mood & Reflection Insights</span>
                  </div>

                  {/* Summary */}
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-stone-600 uppercase tracking-wider block">
                      Summary
                    </span>
                    <p className="text-xs sm:text-sm text-stone-900 italic bg-white p-3 rounded-lg border border-amber-100 leading-relaxed font-serif">
                      "{activeModalEntry.insights.summary}"
                    </p>
                  </div>

                  {/* Themes */}
                  {activeModalEntry.insights.themes.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-stone-600 uppercase tracking-wider block">
                        Key Themes
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {activeModalEntry.insights.themes.map((t, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-900"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Reflection Questions */}
                  {activeModalEntry.insights.reflectionQuestions.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-xs font-semibold text-stone-600 uppercase tracking-wider flex items-center gap-1">
                        <HelpCircle className="w-3.5 h-3.5 text-amber-700" />
                        Reflection Questions
                      </span>
                      <div className="space-y-1.5">
                        {activeModalEntry.insights.reflectionQuestions.map((q, idx) => (
                          <div key={idx} className="bg-white p-2.5 rounded-lg border border-amber-100 text-xs text-stone-800 font-medium">
                            {q}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Next Steps */}
                  {activeModalEntry.insights.nextSteps.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-xs font-semibold text-stone-600 uppercase tracking-wider flex items-center gap-1">
                        <ListChecks className="w-3.5 h-3.5 text-emerald-700" />
                        Practical Next Steps
                      </span>
                      <ul className="space-y-1.5">
                        {activeModalEntry.insights.nextSteps.map((step, idx) => (
                          <li key={idx} className="bg-white p-2.5 rounded-lg border border-emerald-100 text-xs text-stone-800 flex items-start gap-2">
                            <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                              {idx + 1}
                            </span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Multi-turn Chat Transcript */}
              {activeModalEntry.chatHistory && activeModalEntry.chatHistory.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-stone-500 uppercase tracking-wider">
                    <MessageSquare className="w-4 h-4 text-stone-400" />
                    <span>Gemini Conversation Transcript ({activeModalEntry.chatHistory.length} turns)</span>
                  </div>

                  <div className="space-y-2.5 max-h-60 overflow-y-auto p-1">
                    {activeModalEntry.chatHistory.map((turn, i) => (
                      <div
                        key={i}
                        className={`p-3 rounded-xl text-xs leading-relaxed ${
                          turn.role === 'user'
                            ? 'bg-stone-100 text-stone-900 font-medium'
                            : 'bg-amber-50/70 border border-amber-200/50 text-stone-800'
                        }`}
                      >
                        <div className="font-semibold text-[10px] text-stone-500 uppercase tracking-wider mb-1">
                          {turn.role === 'user' ? 'You' : 'Gemini Assistant'}
                        </div>
                        <p className="whitespace-pre-wrap">{turn.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 border-t border-stone-200 bg-stone-50 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => handleDelete(activeModalEntry.id)}
                className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
              >
                Delete Entry
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const entry = activeModalEntry;
                    setActiveModalEntry(null);
                    onSelectEntryToEdit(entry);
                  }}
                  className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <PenLine className="w-3.5 h-3.5" />
                  <span>Edit in Studio</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
