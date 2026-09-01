import React from 'react';
import type { User } from 'firebase/auth';
import { 
  BookOpen, 
  PenLine, 
  History, 
  ShieldCheck, 
  LogOut, 
  Sparkles, 
  ClipboardList, 
  User as UserIcon, 
  Flame,
  Lock
} from 'lucide-react';

interface NavbarProps {
  user: User | null;
  activeTab: 'dashboard' | 'editor' | 'history' | 'threat-model';
  onSelectTab: (tab: 'dashboard' | 'editor' | 'history' | 'threat-model') => void;
  onSignOut: () => void;
  onOpenTestPlan: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  activeTab,
  onSelectTab,
  onSignOut,
  onOpenTestPlan
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div 
            onClick={() => onSelectTab('dashboard')} 
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform duration-200">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif font-bold text-lg sm:text-xl text-stone-900 tracking-tight">
                  Personal Gemini Journal
                </span>
                <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <ShieldCheck className="w-3 h-3 mr-1 text-emerald-600" />
                  ABAC Secured
                </span>
              </div>
              <p className="text-[11px] text-stone-500 hidden sm:block">
                Private Mindful Journaling & Multi-Turn AI Reflection
              </p>
            </div>
          </div>

          {/* Navigation Links for Authenticated Users */}
          {user ? (
            <div className="flex items-center gap-1 sm:gap-2">
              <nav className="flex items-center space-x-1">
                <button
                  type="button"
                  id="nav-tab-dashboard"
                  onClick={() => onSelectTab('dashboard')}
                  className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    activeTab === 'dashboard'
                      ? 'bg-amber-100/70 text-amber-900 font-semibold'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span className="hidden sm:inline">Dashboard</span>
                </button>

                <button
                  type="button"
                  id="nav-tab-editor"
                  onClick={() => onSelectTab('editor')}
                  className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    activeTab === 'editor'
                      ? 'bg-amber-100/70 text-amber-900 font-semibold'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                  }`}
                >
                  <PenLine className="w-4 h-4 text-amber-600" />
                  <span>New Entry</span>
                </button>

                <button
                  type="button"
                  id="nav-tab-history"
                  onClick={() => onSelectTab('history')}
                  className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    activeTab === 'history'
                      ? 'bg-amber-100/70 text-amber-900 font-semibold'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                  }`}
                >
                  <History className="w-4 h-4 text-amber-600" />
                  <span>History</span>
                </button>

                <button
                  type="button"
                  id="nav-tab-threat-model"
                  onClick={() => onSelectTab('threat-model')}
                  className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    activeTab === 'threat-model'
                      ? 'bg-amber-100/70 text-amber-900 font-semibold'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  <span className="hidden md:inline">Threat Model</span>
                </button>
              </nav>

              <div className="h-6 w-px bg-stone-200 mx-1 hidden sm:block" />

              {/* Test Plan Trigger */}
              <button
                type="button"
                onClick={onOpenTestPlan}
                title="Open Manual Test Plan"
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <ClipboardList className="w-3.5 h-3.5 text-stone-600" />
                <span className="hidden lg:inline">Test Plan</span>
              </button>

              {/* User Avatar & Logout */}
              <div className="flex items-center gap-2 ml-1">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-8 h-8 rounded-full border border-stone-300 object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-stone-200 text-stone-700 flex items-center justify-center font-bold text-xs">
                    {user.displayName ? user.displayName.charAt(0).toUpperCase() : <UserIcon className="w-4 h-4" />}
                  </div>
                )}

                <button
                  type="button"
                  id="btn-sign-out"
                  onClick={onSignOut}
                  title="Sign Out"
                  className="p-1.5 text-stone-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onOpenTestPlan}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <ClipboardList className="w-3.5 h-3.5" />
                <span>Test Plan</span>
              </button>
              <div className="flex items-center gap-1.5 text-xs text-stone-500 bg-stone-100/70 px-2.5 py-1 rounded-full border border-stone-200">
                <Lock className="w-3 h-3 text-amber-600" />
                <span>Protected with Firebase Auth</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
