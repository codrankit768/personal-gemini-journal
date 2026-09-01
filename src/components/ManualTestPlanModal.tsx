import React, { useState } from 'react';
import { CheckSquare, Square, X, ExternalLink, ShieldCheck } from 'lucide-react';

interface TestCase {
  id: string;
  title: string;
  category: string;
  description: string;
  steps: string[];
  expectedResult: string;
}

const TEST_CASES: TestCase[] = [
  {
    id: 'test-1',
    title: 'Google Sign-In Authentication',
    category: 'Auth',
    description: 'Verify unauthenticated user can log in with Google OAuth popup.',
    steps: ['Click "Sign In with Google" on the landing page', 'Select an authorized Google account in the popup', 'Verify redirection to authenticated Dashboard'],
    expectedResult: 'User profile avatar, email, and private dashboard load immediately.'
  },
  {
    id: 'test-2',
    title: 'Sign-Out & Session Clearance',
    category: 'Auth',
    description: 'Verify sign-out completely clears private journal access.',
    steps: ['Click "Sign Out" in the top navigation bar', 'Verify redirection back to the Landing/Sign-in page', 'Verify no cached private entries remain accessible'],
    expectedResult: 'Session terminates cleanly; landing page is shown with no private data.'
  },
  {
    id: 'test-3',
    title: 'Journal Entry Creation',
    category: 'Journal',
    description: 'Create a new journal entry with title, mood, and reflection content.',
    steps: ['Navigate to "New Entry"', 'Select a mood (e.g. Calm or Motivated)', 'Type a journal draft title and reflection text', 'Check that word count updates dynamically'],
    expectedResult: 'Draft is held safely in transactional local state with responsive live feedback.'
  },
  {
    id: 'test-4',
    title: 'Multi-Turn Gemini Conversation',
    category: 'Gemini AI',
    description: 'Conduct multi-turn reflection chat with Gemini while drafting.',
    steps: ['Click a quick reflection pill or enter a question in the Gemini chat box', 'Submit prompt to Gemini', 'Receive thoughtful reflection response', 'Send a second follow-up question referencing the first response'],
    expectedResult: 'Conversation history is preserved across turns; context is maintained.'
  },
  {
    id: 'test-5',
    title: 'Gemini Model Fallback Ladder & Resilience',
    category: 'Resilience',
    description: 'Verify automated model fallback ladder (gemini-3.6-flash -> gemini-3.1-flash-lite -> gemini-flash-latest -> gemini-3.7-flash) on recoverable errors (404, 429, 500, 503).',
    steps: ['Send prompt or generate insights', 'Server attempts primary model (gemini-3.6-flash)', 'If 404/429/500/503 is returned, auto-falls back to next ladder model', 'User draft is retained without data loss'],
    expectedResult: 'Requests succeed seamlessly using the fallback ladder, preserving user draft and conversation history.'
  },
  {
    id: 'test-6',
    title: 'Cloud Firestore Persistence',
    category: 'Firestore',
    description: 'Save entry, chat turns, and metadata to Firestore database.',
    steps: ['Click "Save to Cloud Journal"', 'Verify saving indicator and success confirmation', 'Navigate to History and verify new entry exists'],
    expectedResult: 'Entry is permanently stored under /users/{userId}/entries/{entryId}.'
  },
  {
    id: 'test-7',
    title: 'Failed Firestore Save & Error State',
    category: 'Resilience',
    description: 'Ensure failed write shows accessible error message without clearing text.',
    steps: ['Simulate network disconnect before clicking Save', 'Verify user text in textarea remains 100% intact', 'Verify accessible alert banner appears'],
    expectedResult: 'No silent failures; unsaved input remains completely preserved.'
  },
  {
    id: 'test-8',
    title: 'Retry Save Action',
    category: 'Resilience',
    description: 'Verify "Retry Save" button successfully writes upon reconnection.',
    steps: ['Click "Retry Save" button after network recovery', 'Observe progress state transition to success'],
    expectedResult: 'Firestore write succeeds on retry and confirms persistence.'
  },
  {
    id: 'test-9',
    title: 'Journal History & Filtering',
    category: 'Journal',
    description: 'Browse, search, and filter previous entries in History view.',
    steps: ['Go to "Journal History"', 'Search by keyword in the search bar', 'Filter by Mood pill (e.g. "Happy", "Sad")', 'Inspect entry metadata and word counts'],
    expectedResult: 'History list updates dynamically and displays matching entries accurately.'
  },
  {
    id: 'test-10',
    title: 'Mood Selection (7 Core Moods)',
    category: 'Original Feature',
    description: 'Verify all 7 required moods can be selected and recorded.',
    steps: ['Test selecting: Happy, Calm, Neutral, Sad, Frustrated, Anxious, Motivated', 'Check visual styling, emoji, and badge rendering'],
    expectedResult: 'All 7 moods render with unique visual badges and store correctly in Firestore.'
  },
  {
    id: 'test-11',
    title: 'AI Mood & Reflection Insights',
    category: 'Original Feature',
    description: 'Generate 4-part AI insights (Summary, Themes, Questions, Next Steps).',
    steps: ['Save an entry or click "Generate AI Insights"', 'Verify summary (1-3 sentences), themes (2-4), questions (2-3), next steps (2-3)', 'Verify no medical/mental-health diagnoses are made'],
    expectedResult: 'Structured AI insights appear cleanly formatted with copy/reflection actions.'
  },
  {
    id: 'test-12',
    title: 'Refresh & Re-login Persistence',
    category: 'Persistence',
    description: 'Reload browser and ensure data persists across sessions.',
    steps: ['Hard-refresh the browser tab (F5 / Cmd+R)', 'Observe persistent auth state and journal entries loading from Firestore'],
    expectedResult: 'All user entries and reflections reload flawlessly from Cloud Firestore.'
  },
  {
    id: 'test-13',
    title: 'Unauthorized Access Prevention',
    category: 'Security',
    description: 'Verify unauthenticated requests to private collections are blocked.',
    steps: ['Attempt direct access or Firestore read without active session', 'Verify security rules block the operation with code "permission-denied"'],
    expectedResult: 'Firestore Security Rules deny unauthenticated reads and writes.'
  },
  {
    id: 'test-14',
    title: 'Cross-User Data Isolation',
    category: 'Security',
    description: 'Verify User A cannot see or modify User B\'s journal records.',
    steps: ['Check document path structure /users/{userId}/entries/{entryId}', 'Review Firestore ABAC rules enforcement: `request.auth.uid == userId`'],
    expectedResult: 'Strict user isolation guaranteed at the database security level.'
  },
  {
    id: 'test-15',
    title: 'Responsive & Mobile Behavior',
    category: 'UI/UX',
    description: 'Test layout on mobile viewports (<640px) and tablet/desktop screens.',
    steps: ['Resize viewport to mobile dimensions', 'Verify touch targets (>=44px), drawer/stacking layout, readable typography'],
    expectedResult: 'Interface transitions smoothly with no overflow or truncated labels.'
  }
];

interface ManualTestPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ManualTestPlanModal: React.FC<ManualTestPlanModalProps> = ({ isOpen, onClose }) => {
  const [checkedTests, setCheckedTests] = useState<Record<string, boolean>>({});

  if (!isOpen) return null;

  const toggleTest = (id: string) => {
    setCheckedTests(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const completedCount = Object.values(checkedTests).filter(Boolean).length;
  const totalCount = TEST_CASES.length;

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 bg-stone-50/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold font-serif text-stone-900">
                Manual QA & Security Test Plan (15 Scenarios)
              </h3>
              <p className="text-xs text-stone-600">
                Completed: {completedCount} / {totalCount} test scenarios verified
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-stone-500 hover:text-stone-800 hover:bg-stone-200/60 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-stone-100 h-1.5 shrink-0">
          <div
            className="bg-amber-600 h-1.5 transition-all duration-300"
            style={{ width: `${(completedCount / totalCount) * 100}%` }}
          />
        </div>

        {/* List of Test Cases */}
        <div className="p-6 overflow-y-auto space-y-4 divide-y divide-stone-100">
          {TEST_CASES.map((tc, idx) => {
            const isChecked = Boolean(checkedTests[tc.id]);
            return (
              <div
                key={tc.id}
                className={`pt-4 first:pt-0 transition-colors p-3 rounded-xl ${
                  isChecked ? 'bg-emerald-50/40' : 'hover:bg-stone-50/60'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <button
                    type="button"
                    onClick={() => toggleTest(tc.id)}
                    className="mt-0.5 text-stone-600 hover:text-amber-700 cursor-pointer shrink-0"
                  >
                    {isChecked ? (
                      <CheckSquare className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <Square className="w-5 h-5 text-stone-400" />
                    )}
                  </button>
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-stone-900 text-sm">
                        {idx + 1}. {tc.title}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-stone-100 text-stone-700 border border-stone-200">
                        {tc.category}
                      </span>
                    </div>
                    <p className="text-xs text-stone-600 leading-relaxed">
                      {tc.description}
                    </p>
                    
                    <div className="bg-stone-50/80 rounded-lg p-2.5 border border-stone-100 text-xs space-y-1 text-stone-700 font-mono">
                      <div className="font-sans font-semibold text-[11px] text-stone-500 uppercase tracking-wider">
                        Execution Steps:
                      </div>
                      <ol className="list-decimal list-inside space-y-0.5 font-sans text-xs">
                        {tc.steps.map((step, sIdx) => (
                          <li key={sIdx} className="text-stone-600">{step}</li>
                        ))}
                      </ol>
                    </div>

                    <div className="text-xs text-stone-800">
                      <span className="font-semibold text-emerald-700">Expected Result: </span>
                      {tc.expectedResult}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-stone-200 bg-stone-50 flex items-center justify-between shrink-0">
          <button
            onClick={() => {
              const all: Record<string, boolean> = {};
              TEST_CASES.forEach(tc => { all[tc.id] = true; });
              setCheckedTests(all);
            }}
            className="text-xs font-semibold text-amber-700 hover:text-amber-800 cursor-pointer"
          >
            Mark All Completed
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-lg shadow-xs cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
