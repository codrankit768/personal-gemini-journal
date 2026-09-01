export type MoodType = 
  | 'Happy' 
  | 'Calm' 
  | 'Neutral' 
  | 'Sad' 
  | 'Frustrated' 
  | 'Anxious' 
  | 'Motivated';

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface AiInsights {
  summary: string;
  themes: string[];
  reflectionQuestions: string[];
  nextSteps: string[];
  generatedAt: number;
}

export interface JournalEntry {
  id: string;
  userId: string;
  userEmail?: string;
  title: string;
  content: string;
  mood?: MoodType;
  chatHistory: ChatMessage[];
  insights?: AiInsights;
  createdAt: number;
  updatedAt: number;
  tags?: string[];
}

export interface WeeklyReflection {
  id: string;
  userId: string;
  periodStart: number;
  periodEnd: number;
  reflection: string;
  moodDistribution: Record<string, number>;
  keyThemes: string[];
  suggestedFocus: string[];
  entryCount: number;
  createdAt: number;
}

export interface ThreatSummaryItem {
  category: string;
  threat: string;
  mitigation: string;
  status: 'active' | 'enforced';
}
