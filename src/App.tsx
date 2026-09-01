import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth, signInWithGoogle, logOut } from './lib/firebase';
import type { JournalEntry } from './types';

// Components
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { DashboardView } from './components/DashboardView';
import { JournalEditor } from './components/JournalEditor';
import { JournalHistoryView } from './components/JournalHistoryView';
import { ThreatSummaryView } from './components/ThreatSummaryView';
import { ManualTestPlanModal } from './components/ManualTestPlanModal';
import { Sparkles, BookOpen } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'editor' | 'history' | 'threat-model'>('dashboard');
  const [currentEditingEntry, setCurrentEditingEntry] = useState<JournalEntry | null>(null);
  const [isTestPlanOpen, setIsTestPlanOpen] = useState(false);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    await signInWithGoogle();
    setActiveTab('dashboard');
  };

  const handleSignOut = async () => {
    await logOut();
    setUser(null);
    setCurrentEditingEntry(null);
    setActiveTab('dashboard');
  };

  const handleSelectEntryToEdit = (entry: JournalEntry) => {
    setCurrentEditingEntry(entry);
    setActiveTab('editor');
  };

  const handleNavigateToNewEntry = () => {
    setCurrentEditingEntry(null);
    setActiveTab('editor');
  };

  // Initial Auth Loading Screen
  if (authLoading) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center text-white shadow-md animate-bounce">
          <BookOpen className="w-6 h-6" />
        </div>
        <div className="text-center space-y-1">
          <h2 className="font-serif font-bold text-stone-900 text-lg">Personal Gemini Journal</h2>
          <p className="text-xs text-stone-500">Verifying secure authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col font-sans selection:bg-amber-200">
      {/* Top Navigation */}
      <Navbar
        user={user}
        activeTab={activeTab}
        onSelectTab={(tab) => {
          if (tab === 'editor') {
            setCurrentEditingEntry(null);
          }
          setActiveTab(tab);
        }}
        onSignOut={handleSignOut}
        onOpenTestPlan={() => setIsTestPlanOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {!user ? (
          activeTab === 'threat-model' ? (
            <div className="space-y-6">
              <div className="max-w-6xl mx-auto px-4 pt-6">
                <button
                  type="button"
                  onClick={() => setActiveTab('dashboard')}
                  className="text-xs font-semibold text-amber-800 hover:text-amber-950 flex items-center gap-1.5 cursor-pointer"
                >
                  ← Return to Landing Page
                </button>
              </div>
              <ThreatSummaryView />
            </div>
          ) : (
            <LandingPage
              onSignIn={handleSignIn}
              onViewThreatModel={() => setActiveTab('threat-model')}
            />
          )
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <DashboardView
                user={user}
                onNavigateToNewEntry={handleNavigateToNewEntry}
                onNavigateToHistory={() => setActiveTab('history')}
                onSelectEntry={handleSelectEntryToEdit}
              />
            )}

            {activeTab === 'editor' && (
              <JournalEditor
                user={user}
                initialEntry={currentEditingEntry}
                onSaveSuccess={(savedEntry) => {
                  setCurrentEditingEntry(savedEntry);
                }}
              />
            )}

            {activeTab === 'history' && (
              <JournalHistoryView
                user={user}
                onSelectEntryToEdit={handleSelectEntryToEdit}
                onNavigateToNewEntry={handleNavigateToNewEntry}
              />
            )}

            {activeTab === 'threat-model' && (
              <ThreatSummaryView />
            )}
          </>
        )}
      </main>

      {/* Manual QA & Security Test Plan Modal */}
      <ManualTestPlanModal
        isOpen={isTestPlanOpen}
        onClose={() => setIsTestPlanOpen(false)}
      />
    </div>
  );
}
