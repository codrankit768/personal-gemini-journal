import React from 'react';
import type { MoodType } from '../types';
import { Smile, Sun, Cloud, CloudRain, Flame, Activity, Sparkles } from 'lucide-react';

interface MoodConfig {
  label: MoodType;
  emoji: string;
  icon: React.ElementType;
  bgClass: string;
  textClass: string;
  borderClass: string;
  dotColor: string;
  description: string;
}

export const MOODS: Record<MoodType, MoodConfig> = {
  Happy: {
    label: 'Happy',
    emoji: '😊',
    icon: Sun,
    bgClass: 'bg-amber-50 hover:bg-amber-100/80',
    textClass: 'text-amber-800',
    borderClass: 'border-amber-200',
    dotColor: 'bg-amber-500',
    description: 'Joyful, content, or fulfilled'
  },
  Calm: {
    label: 'Calm',
    emoji: '🌿',
    icon: Smile,
    bgClass: 'bg-emerald-50 hover:bg-emerald-100/80',
    textClass: 'text-emerald-800',
    borderClass: 'border-emerald-200',
    dotColor: 'bg-emerald-500',
    description: 'Peaceful, centered, relaxed'
  },
  Neutral: {
    label: 'Neutral',
    emoji: '⚖️',
    icon: Cloud,
    bgClass: 'bg-stone-100 hover:bg-stone-200/80',
    textClass: 'text-stone-700',
    borderClass: 'border-stone-200',
    dotColor: 'bg-stone-400',
    description: 'Balanced, steady, observant'
  },
  Sad: {
    label: 'Sad',
    emoji: '🌧️',
    icon: CloudRain,
    bgClass: 'bg-blue-50 hover:bg-blue-100/80',
    textClass: 'text-blue-800',
    borderClass: 'border-blue-200',
    dotColor: 'bg-blue-500',
    description: 'Grieving, melancholic, low energy'
  },
  Frustrated: {
    label: 'Frustrated',
    emoji: '🔥',
    icon: Flame,
    bgClass: 'bg-rose-50 hover:bg-rose-100/80',
    textClass: 'text-rose-800',
    borderClass: 'border-rose-200',
    dotColor: 'bg-rose-500',
    description: 'Stuck, exasperated, irritated'
  },
  Anxious: {
    label: 'Anxious',
    emoji: '⚡',
    icon: Activity,
    bgClass: 'bg-purple-50 hover:bg-purple-100/80',
    textClass: 'text-purple-800',
    borderClass: 'border-purple-200',
    dotColor: 'bg-purple-500',
    description: 'Uneasy, overthinking, restless'
  },
  Motivated: {
    label: 'Motivated',
    emoji: '✨',
    icon: Sparkles,
    bgClass: 'bg-orange-50 hover:bg-orange-100/80',
    textClass: 'text-orange-800',
    borderClass: 'border-orange-200',
    dotColor: 'bg-orange-500',
    description: 'Energized, inspired, determined'
  }
};

export const ALL_MOOD_KEYS: MoodType[] = [
  'Happy',
  'Calm',
  'Neutral',
  'Sad',
  'Frustrated',
  'Anxious',
  'Motivated'
];

interface MoodBadgeProps {
  mood?: MoodType;
  selected?: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
  showDescription?: boolean;
}

export const MoodBadge: React.FC<MoodBadgeProps> = ({
  mood,
  selected = false,
  onClick,
  size = 'md',
  showDescription = false
}) => {
  if (!mood || !MOODS[mood]) {
    return null;
  }

  const config = MOODS[mood];
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-2.5 py-1 text-xs sm:text-sm gap-1.5',
    lg: 'px-3.5 py-1.5 text-sm sm:text-base gap-2'
  }[size];

  return (
    <button
      type="button"
      id={`mood-badge-${mood.toLowerCase()}`}
      onClick={onClick}
      disabled={!onClick}
      className={`inline-flex items-center rounded-full font-medium transition-all duration-150 border ${
        config.bgClass
      } ${config.textClass} ${config.borderClass} ${sizeClasses} ${
        selected ? 'ring-2 ring-stone-900 ring-offset-1 shadow-sm font-semibold' : ''
      } ${onClick ? 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]' : 'cursor-default'}`}
    >
      <span className="text-sm select-none">{config.emoji}</span>
      <span className="whitespace-nowrap">{config.label}</span>
      {showDescription && (
        <span className="hidden sm:inline text-xs opacity-75 font-normal ml-1">
          • {config.description}
        </span>
      )}
    </button>
  );
};
