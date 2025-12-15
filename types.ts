
export enum AppTab {
  PRODUCER = 'producer',
  DIARY = 'diary',
  GROWTH = 'growth', // Maps to Intelligent Agenda
  STUDIO = 'studio',
  MIX = 'mix',
  LIVE = 'live',
  VEO = 'veo'
}

export type Language = 'pt' | 'en';

export type UserPlan = 'free' | 'premium';
export type MixPreset = 'clean' | 'raw' | 'loud' | 'dark';

export interface UserUsage {
  mixesToday: number;
  lastMixDate: string; // YYYY-MM-DD
}

export type VoiceGender = 'masculine' | 'feminine';
export type VoiceStyle = 'calm' | 'direct' | 'motivational' | 'studio' | 'energetic' | 'custom';

export interface VoiceSettings {
  gender: VoiceGender;
  style: VoiceStyle;
  customVoiceId?: string; // ID for the trained voice
  customVoiceName?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  type?: 'text' | 'audio' | 'video' | 'map_result' | 'search_result';
  metadata?: any;
}

// --- INTELLIGENT AGENDA TYPES ---

export interface AgendaTask {
  id: string;
  text: string;
  completed: boolean;
}

export interface AgendaDay {
  dayName: string; // e.g., "Monday"
  dateDisplay: string; // e.g., "Oct 12"
  tasks: AgendaTask[];
}

export interface AgendaWeek {
  weekNumber: number;
  focus: string;
  days: AgendaDay[];
}

export interface MonthlyAgenda {
  month: string;
  year: number;
  goals: string;
  overview: string;
  weeks: AgendaWeek[];
  lastUpdated: number;
}

// --- STUDIO SESSION TYPES ---

export type StudioSessionType = 'studio' | 'focus' | 'meeting' | 'writing';

export interface StudioSessionRecord {
  id: string;
  startTime: number;
  endTime: number;
  durationMinutes: number;
  type: StudioSessionType;
  notes: string;
  aiSummary?: string;
  actionItems?: string[];
}
