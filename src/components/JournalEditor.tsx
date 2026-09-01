import React, { useState, useEffect, useRef } from 'react';
import type { User } from 'firebase/auth';
import type { JournalEntry, MoodType, ChatMessage, AiInsights } from '../types';
import { MoodBadge, ALL_MOOD_KEYS, MOODS } from './MoodBadge';
import { 
  Save, 
  Sparkles, 
  Send, 
  RotateCcw, 
  AlertCircle, 
  CheckCircle2, 
  MessageSquare, 
  HelpCircle, 
  ListChecks, 
  Lightbulb, 
  ArrowRight,
  Bot,
  User as UserIcon,
  Copy,
  Check
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface JournalEditorProps {
  user: User;
  initialEntry?: JournalEntry | null;
  onSaveSuccess: (entry: JournalEntry) => void;
}

const QUICK_PROMPTS = [
  'Help me reflect deeper on what I wrote',
  'Brainstorm 3 practical next steps',
  'Help me reframe this feeling constructively',
  'Summarize the core insight from my words'
];

export const JournalEditor: React.FC<JournalEditorProps> = ({
  user,
  initialEntry,
  onSaveSuccess
}) => {
  // Entry Core State
  const [id, setId] = useState<string>(initialEntry?.id || `entry_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`);
  const [title, setTitle] = useState<string>(initialEntry?.title || '');
  const [content, setContent] = useState<string>(initialEntry?.content || '');
  const [mood, setMood] = useState<MoodType | undefined>(initialEntry?.mood || 'Calm');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>(initialEntry?.chatHistory || []);
  const [insights, setInsights] = useState<AiInsights | undefined>(initialEntry?.insights);

  // Persistence & Interaction States
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);
  
  // Gemini Chat States
  const [promptInput, setPromptInput] = useState('');
  const [isGeneratingChat, setIsGeneratingChat] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [lastFailedPrompt, setLastFailedPrompt] = useState<string | null>(null);

  // AI Insights State
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  const [insightsError, setInsightsError] = useState<string | null>(null);
  const [copiedInsightField, setCopiedInsightField] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isGeneratingChat]);

  // Handle entry prop changes (e.g. editing an existing entry)
  useEffect(() => {
    if (initialEntry) {
      setId(initialEntry.id);
      setTitle(initialEntry.title || '');
      setContent(initialEntry.content || '');
      setMood(initialEntry.mood || 'Calm');
      setChatHistory(initialEntry.chatHistory || []);
      setInsights(initialEntry.insights);
    }
  }, [initialEntry]);

  // Word count & Character count calculation
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;

  /**
   * Save Journal Entry to Cloud Firestore
   */
  const handleSave = async () => {
    if (!content.trim()) {
      setSaveError('Please write some content in your journal entry before saving.');
      return;
    }

    try {
      setIsSaving(true);
      setSaveError(null);

      const entryToSave: JournalEntry = {
        id,
        userId: user.uid,
        userEmail: user.email || undefined,
        title: title.trim() || `Journal Entry — ${new Date().toLocaleDateString()}`,
        content: content.trim(),
        mood,
        chatHistory,
        insights,
        createdAt: initialEntry?.createdAt || Date.now(),
        updatedAt: Date.now()
      };

      // Import dynamic save helper from firebase lib
      const { saveJournalEntry } = await import('../lib/firebase');
      await saveJournalEntry(entryToSave);

      setSaveSuccessNotice(true);
      setTimeout(() => setSaveSuccessNotice(false), 4000);
      onSaveSuccess(entryToSave);

      // Auto-trigger insights if not yet generated
      if (!insights) {
        generateInsights(entryToSave);
      }
    } catch (err: any) {
      console.error('Firestore save failed:', err);
      setSaveError(err?.message || 'Failed to save entry to Cloud Firestore. Your draft is preserved. Please click Retry.');
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Send a Multi-turn message to Gemini Assistant
   */
  const handleSendPrompt = async (overridePrompt?: string) => {
    if (isGeneratingChat) return;

    const messageText = (overridePrompt || lastFailedPrompt || promptInput).trim();
    if (!messageText) return;

    const userMessage: ChatMessage = {
      role: 'user',
      text: messageText,
      timestamp: Date.now()
    };

    // If retrying, remove duplicate trailing user message if it exists
    let baseHistory = chatHistory;
    if (
      chatHistory.length > 0 &&
      chatHistory[chatHistory.length - 1].role === 'user' &&
      chatHistory[chatHistory.length - 1].text === messageText
    ) {
      baseHistory = chatHistory.slice(0, -1);
    }

    const updatedHistory = [...baseHistory, userMessage];
    setChatHistory(updatedHistory);
    setPromptInput('');
    setChatError(null);
    setLastFailedPrompt(null);
    setIsGeneratingChat(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 28000);

    try {
      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: baseHistory,
          journalDraft: content,
          mood,
          userPrompt: messageText
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server returned status ${response.status}`);
      }

      const data = await response.json();
      const modelMessage: ChatMessage = {
        role: 'model',
        text: data.text || 'I am listening and here to support your reflection.',
        timestamp: data.timestamp || Date.now()
      };

      setChatHistory([...updatedHistory, modelMessage]);
      setLastFailedPrompt(null);
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.error('Gemini Chat error:', err);
      let errorMsg = err?.message || 'Gemini response failed. Please try again.';
      if (err?.name === 'AbortError') {
        errorMsg = 'Reflection request timed out. Please check your connection and click Retry.';
      }
      setChatError(errorMsg);
      setLastFailedPrompt(messageText);
    } finally {
      setIsGeneratingChat(false);
    }
  };

  /**
   * Generate Structured AI Insights for the Entry
   */
  const generateInsights = async (targetEntry?: JournalEntry) => {
    if (isGeneratingInsights) return;

    const entryContent = targetEntry ? targetEntry.content : content;
    const entryTitle = targetEntry ? targetEntry.title : title;
    const entryMood = targetEntry ? targetEntry.mood : mood;

    if (!entryContent.trim()) {
      setInsightsError('Write some journal content first to generate insights.');
      return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 28000);

    try {
      setIsGeneratingInsights(true);
      setInsightsError(null);

      const response = await fetch('/api/gemini/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: entryTitle,
          content: entryContent,
          mood: entryMood || 'Neutral',
          chatSummary: chatHistory.length > 0 ? chatHistory.map(m => `${m.role}: ${m.text}`).join('\n') : ''
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to generate insights from Gemini.');
      }

      const data: AiInsights = await response.json();
      setInsights(data);

      // Persist the newly generated insights back to Firestore if entry exists
      if (id) {
        const { saveJournalEntry } = await import('../lib/firebase');
        const updatedEntry: JournalEntry = {
          id,
          userId: user.uid,
          userEmail: user.email || undefined,
          title: title.trim() || `Journal Entry — ${new Date().toLocaleDateString()}`,
          content: content.trim(),
          mood,
          chatHistory,
          insights: data,
          createdAt: initialEntry?.createdAt || Date.now(),
          updatedAt: Date.now()
        };
        await saveJournalEntry(updatedEntry);
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.error('Failed to generate insights:', err);
      let errorMsg = err?.message || 'Could not generate insights. Please try again.';
      if (err?.name === 'AbortError') {
        errorMsg = 'Insights request timed out. Please click Generate Insights to retry.';
      }
      setInsightsError(errorMsg);
    } finally {
      setIsGeneratingInsights(false);
    }
  };

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedInsightField(fieldName);
    setTimeout(() => setCopiedInsightField(null), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Action Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-900">
            {initialEntry ? 'Edit Journal Entry' : 'New Journal Reflection'}
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Your draft is safely held in memory. Changes are isolated to your account.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {saveSuccessNotice && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg font-semibold animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Saved to Firestore</span>
            </div>
          )}

          <button
            type="button"
            id="btn-save-entry"
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs sm:text-sm shadow-xs hover:shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{isSaving ? 'Saving to Firestore...' : 'Save to Cloud Journal'}</span>
          </button>
        </div>
      </div>

      {/* Save Error Alert Banner with Retry Option */}
      {saveError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-rose-900 animate-fadeIn">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">Persistence Alert</p>
              <p className="text-xs text-rose-700 mt-0.5">{saveError}</p>
            </div>
          </div>
          <button
            type="button"
            id="btn-retry-save"
            onClick={handleSave}
            disabled={isSaving}
            className="px-3.5 py-1.5 bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold rounded-lg shrink-0 flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Retry Save</span>
          </button>
        </div>
      )}

      {/* Main Grid: Journal Composer (Left) & Gemini Assistant (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Journal Composer */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-2xl p-5 sm:p-7 border border-stone-200 shadow-xs space-y-5">
            {/* Title Input */}
            <div>
              <label htmlFor="journal-title" className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1.5">
                Entry Title
              </label>
              <input
                id="journal-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Give this reflection a title (e.g. Finding Calm in the Storm)"
                className="w-full px-4 py-2.5 text-base sm:text-lg font-medium text-stone-900 bg-stone-50/50 border border-stone-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-all placeholder:text-stone-400 font-serif"
              />
            </div>

            {/* Mood Selector (7 Core Dimensions) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                  How are you feeling? (Mood Selection)
                </label>
                {mood && (
                  <span className="text-xs font-medium text-stone-600">
                    Selected: <strong className="text-stone-900">{mood}</strong>
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {ALL_MOOD_KEYS.map((m) => (
                  <MoodBadge
                    key={m}
                    mood={m}
                    selected={mood === m}
                    onClick={() => setMood(m)}
                    size="md"
                  />
                ))}
              </div>
            </div>

            {/* Journal Content Textarea */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="journal-content" className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                  Your Reflection
                </label>
                <div className="text-xs text-stone-400 font-mono">
                  {wordCount} {wordCount === 1 ? 'word' : 'words'} • {charCount} chars
                </div>
              </div>
              <textarea
                id="journal-content"
                rows={12}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What is on your mind today? Write freely about your thoughts, breakthroughs, challenges, or aspirations..."
                className="w-full p-4 text-stone-800 bg-stone-50/30 border border-stone-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-all placeholder:text-stone-400 font-sans leading-relaxed resize-y min-h-[260px]"
              />
            </div>
          </div>

          {/* AI-Powered Mood & Reflection Insights Box */}
          <div className="bg-white rounded-2xl p-5 sm:p-7 border border-stone-200 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base text-stone-900">
                    AI Mood & Reflection Insights
                  </h3>
                  <p className="text-xs text-stone-500">
                    Concise summary, key themes, reflection questions & next steps
                  </p>
                </div>
              </div>

              <button
                type="button"
                id="btn-generate-insights"
                onClick={() => generateInsights()}
                disabled={isGeneratingInsights || !content.trim()}
                className="px-3.5 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed self-start sm:self-auto"
              >
                {isGeneratingInsights ? (
                  <div className="w-3.5 h-3.5 border-2 border-amber-900/30 border-t-amber-900 rounded-full animate-spin" />
                ) : (
                  <Lightbulb className="w-3.5 h-3.5 text-amber-700" />
                )}
                <span>{insights ? 'Regenerate Insights' : 'Generate Insights'}</span>
              </button>
            </div>

            {insightsError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{insightsError}</span>
              </div>
            )}

            {isGeneratingInsights && (
              <div className="p-8 text-center space-y-3">
                <div className="w-8 h-8 border-3 border-amber-200 border-t-amber-600 rounded-full animate-spin mx-auto" />
                <p className="text-xs font-medium text-stone-600">
                  Gemini is analyzing themes and distilling reflective insights...
                </p>
              </div>
            )}

            {insights && !isGeneratingInsights && (
              <div className="space-y-4 text-xs sm:text-sm animate-fadeIn">
                {/* Summary */}
                <div className="bg-stone-50/80 rounded-xl p-4 border border-stone-200/70 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold text-stone-500 uppercase tracking-wider">
                    <span>Summary</span>
                    <button
                      onClick={() => copyToClipboard(insights.summary, 'summary')}
                      className="text-stone-400 hover:text-stone-700 cursor-pointer"
                      title="Copy summary"
                    >
                      {copiedInsightField === 'summary' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <p className="text-stone-800 leading-relaxed font-serif italic text-sm">
                    "{insights.summary}"
                  </p>
                </div>

                {/* Themes */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider block">
                    Identified Themes
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {insights.themes.map((theme, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200"
                      >
                        #{theme}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Reflection Questions */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-500 uppercase tracking-wider">
                    <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
                    <span>Reflection Questions</span>
                  </div>
                  <div className="space-y-2">
                    {insights.reflectionQuestions.map((q, i) => (
                      <div
                        key={i}
                        className="p-3 bg-stone-50 rounded-xl border border-stone-200/70 text-xs sm:text-sm text-stone-800 leading-relaxed font-medium"
                      >
                        {q}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Practical Next Steps */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-500 uppercase tracking-wider">
                    <ListChecks className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Practical Next Steps</span>
                  </div>
                  <ul className="space-y-2">
                    {insights.nextSteps.map((step, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2.5 text-xs sm:text-sm text-stone-700 bg-emerald-50/40 p-2.5 rounded-lg border border-emerald-100"
                      >
                        <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {!insights && !isGeneratingInsights && (
              <div className="p-6 text-center border border-dashed border-stone-200 rounded-xl space-y-1.5">
                <Sparkles className="w-6 h-6 text-amber-500 mx-auto opacity-70" />
                <p className="text-xs font-medium text-stone-600">
                  Insights generate automatically after saving or via the button above.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Multi-Turn Gemini Chat Assistant */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-stone-200 shadow-xs flex flex-col h-[750px] overflow-hidden sticky top-24">
          {/* Assistant Header */}
          <div className="px-5 py-4 border-b border-stone-200 bg-stone-50/80 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-2xs">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-stone-900">
                  Gemini Reflection Companion
                </h3>
                <p className="text-[11px] text-stone-500">
                  Multi-turn brainstorming & reflection
                </p>
              </div>
            </div>

            {chatHistory.length > 0 && (
              <button
                type="button"
                onClick={() => setChatHistory([])}
                className="text-[11px] text-stone-500 hover:text-stone-800 font-medium cursor-pointer"
                title="Clear conversation context"
              >
                Clear
              </button>
            )}
          </div>

          {/* Quick Prompt Pills */}
          <div className="p-3 bg-stone-50/40 border-b border-stone-100 flex flex-wrap gap-1.5 shrink-0">
            {QUICK_PROMPTS.map((qp, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendPrompt(qp)}
                disabled={isGeneratingChat}
                className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-white hover:bg-amber-50 text-stone-700 hover:text-amber-900 border border-stone-200 hover:border-amber-300 transition-colors cursor-pointer text-left disabled:opacity-50"
              >
                {qp}
              </button>
            ))}
          </div>

          {/* Chat Messages List */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {chatHistory.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-stone-400 space-y-3">
                <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center text-stone-500">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <p className="font-semibold text-stone-700 text-sm">
                    Begin an introspective conversation
                  </p>
                  <p className="text-xs text-stone-500 max-w-xs leading-relaxed">
                    Ask Gemini to brainstorm perspectives, deepen your reflection, or clarify your thoughts.
                  </p>
                </div>
              </div>
            ) : (
              chatHistory.map((msg, index) => {
                const isUser = msg.role === 'user';
                return (
                  <div
                    key={index}
                    className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0 ${
                        isUser
                          ? 'bg-stone-900 text-white'
                          : 'bg-amber-100 text-amber-900 border border-amber-200'
                      }`}
                    >
                      {isUser ? <UserIcon className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                    </div>

                    <div
                      className={`rounded-2xl p-3.5 max-w-[85%] text-xs sm:text-sm leading-relaxed shadow-2xs ${
                        isUser
                          ? 'bg-stone-900 text-white rounded-tr-xs'
                          : 'bg-stone-50 border border-stone-200/80 text-stone-800 rounded-tl-xs'
                      }`}
                    >
                      {isUser ? (
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                      ) : (
                        <div className="prose-xs space-y-2">
                          <ReactMarkdown>{msg.text}</ReactMarkdown>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}

            {isGeneratingChat && (
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-900 border border-amber-200 flex items-center justify-center text-xs shrink-0">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="bg-stone-50 border border-stone-200 rounded-2xl rounded-tl-xs p-3.5 text-xs text-stone-500 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-600 animate-pulse" />
                  <div className="w-2 h-2 rounded-full bg-amber-600 animate-pulse delay-100" />
                  <div className="w-2 h-2 rounded-full bg-amber-600 animate-pulse delay-200" />
                  <span className="ml-1 text-stone-600">Gemini is reflecting...</span>
                </div>
              </div>
            )}

            {chatError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-1 flex-1">
                  <p className="font-semibold">Assistant Error</p>
                  <p className="text-[11px] text-rose-700">{chatError}</p>
                  {lastFailedPrompt && (
                    <p className="text-[10px] text-stone-500 italic truncate max-w-xs">
                      Prompt: "{lastFailedPrompt}"
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {lastFailedPrompt && (
                    <button
                      type="button"
                      onClick={() => {
                        setPromptInput(lastFailedPrompt);
                        setChatError(null);
                        setLastFailedPrompt(null);
                      }}
                      className="text-xs text-stone-600 hover:text-stone-900 underline cursor-pointer"
                    >
                      Edit
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={isGeneratingChat}
                    onClick={() => handleSendPrompt(lastFailedPrompt || undefined)}
                    className="text-xs text-rose-800 font-bold underline hover:text-rose-950 cursor-pointer disabled:opacity-50"
                  >
                    Retry
                  </button>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Chat Input Bar */}
          <div className="p-3 border-t border-stone-200 bg-white shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendPrompt();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                id="gemini-chat-input"
                value={promptInput}
                onChange={(e) => setPromptInput(e.target.value)}
                placeholder="Ask Gemini to explore, reframe, or brainstorm..."
                disabled={isGeneratingChat}
                className="flex-1 px-3.5 py-2.5 text-xs sm:text-sm bg-stone-50 border border-stone-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-all placeholder:text-stone-400"
              />
              <button
                type="submit"
                id="btn-send-chat"
                disabled={!promptInput.trim() || isGeneratingChat}
                className="p-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
