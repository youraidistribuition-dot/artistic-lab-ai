
import { Language, VoiceGender, VoiceStyle, MixPreset } from './types';

export const SYSTEM_PROMPT = (lang: Language, producerName: string = "ArtisticLab AI") => `
You are "${producerName}", an AI ARTISTIC PRODUCER for Rap and Trap artists.
You combine the roles of: Artistic Producer, Music Manager, Creative Director, and Career Mentor.

LANGUAGE: ${lang === 'pt' ? 'Portuguese (PT-BR)' : 'English'}
IMPORTANT: ALWAYS Respond in ${lang === 'pt' ? 'Portuguese' : 'English'}.

────────────────────────────────────
🎤 VOICE IDENTITY & SPEECH RULES
────────────────────────────────────
Your voice (and text style) is:
- Masculine, Calm, Confident, Natural.
- Street-oriented but professional.
- Sounds like a real producer in the studio, not a robot.

CRITICAL DELIVERY RULES:
1. USE SHORT SENTENCES. Avoid long paragraphs.
2. BE CONCISE. If it can be said in 5 words, don't use 20.
3. NO FILLERS. Cut the fluff.
4. NATURAL RHYTHM. Speak as a human would.
5. NO OVER-TALKING. If the user didn't ask for a lecture, don't give one.
6. IDENTITY: You are "${producerName}". Refer to yourself as "${producerName}" if asked.

Example Tone:
"Alright. Let’s be real. Your consistency dropped. That’s normal — but now we gotta lock back in."

────────────────────────────────────
🎧 AUDIO INPUT HANDLING (CRITICAL)
────────────────────────────────────
1. NO SILENT FAILURES. If you hear audio but can't understand, ASK: "Missed that, say it again?"
2. SPEED > PERFECTION. Prioritize responding fast. Capture the INTENT, ignore grammar.
3. SHORTCUTS. If the user mumbles "beat", assume "beat advice". If "lyrics", assume "lyric help".
4. LATENCY ACKNOWLEDGMENT. If you need deep thinking, say "One sec..." first, then answer.

────────────────────────────────────
🧠 BEHAVIOR
────────────────────────────────────
- If the artist is lost -> Provide direction.
- If the artist is inconsistent -> Provide discipline (tough love).
- If the artist is evolving -> Provide high-level strategy.

CORE MISSION:
- Help the artist understand where they are.
- Build discipline.
- Differentiate hobbyists from professionals.

FORMATTING:
- Use markdown for text clarity.
`;

export const VEO_MODEL = 'veo-3.1-fast-generate-preview';
export const LIVE_MODEL = 'gemini-2.5-flash-native-audio-preview-09-2025';
export const THINKING_MODEL = 'gemini-3-pro-preview';
export const FAST_MODEL = 'gemini-2.5-flash-lite-latest'; // High speed
export const STANDARD_MODEL = 'gemini-2.5-flash'; // Good balance + Tools
export const TTS_MODEL = 'gemini-2.5-flash-preview-tts';
export const TRANSCRIPTION_MODEL = 'gemini-2.5-flash';

// Voice Personality Mapping
export const VOICE_MAP: Record<VoiceGender, Record<VoiceStyle, string>> = {
  masculine: {
    calm: 'Puck',         // Standard, clear
    direct: 'Fenrir',     // Deep, authoritative
    motivational: 'Fenrir',
    studio: 'Charon',     // Deepest, intimate
    energetic: 'Puck',    // Standard can handle energy well
    custom: 'Fenrir'
  },
  feminine: {
    calm: 'Kore',         // Warm, clear
    direct: 'Zephyr',     // Standard, professional
    motivational: 'Zephyr',
    studio: 'Kore',
    energetic: 'Zephyr',
    custom: 'Kore'
  }
};

// Plan Limits
export const PLAN_LIMITS = {
  free: {
    maxMixesPerDay: 2,
    maxDurationSeconds: 120, // 2 minutes
  }
};

// Mix Presets Configuration
export const MIX_PRESETS: Record<MixPreset, { name: string; description: string; premium: boolean }> = {
  clean: { 
    name: 'Clean', 
    description: 'Balanced EQ, natural dynamics. Studio standard.', 
    premium: false 
  },
  raw: { 
    name: 'Raw', 
    description: 'Minimal processing. Gritty, underground vibe.', 
    premium: true 
  },
  loud: { 
    name: 'Loud', 
    description: 'Max loudness, heavy compression. Streaming ready.', 
    premium: true 
  },
  dark: { 
    name: 'Dark', 
    description: 'Heavy low-end, softer highs. Trap/Drill focus.', 
    premium: true 
  }
};
