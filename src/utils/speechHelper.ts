/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

let lastSpeechTime = 0;
let lastSpokenText = '';
const SPEECH_THROTTLE_MS = 3500; // Throttled to prevent constant overlapping speech

/**
 * Speaks the provided Hindi text using the browser's TTS system.
 */
export function speakHindiFeedback(text: string, force = false): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;

  const now = Date.now();
  // Throttle speech unless forced or the core feedback text changed
  if (!force && text === lastSpokenText && now - lastSpeechTime < SPEECH_THROTTLE_MS) {
    return;
  }

  // Cancel any ongoing speech to keep feedback responsive and current
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  
  // Set speech parameters
  utterance.lang = 'hi-IN';
  utterance.rate = 1.0;
  utterance.pitch = 1.05;

  // Retrieve available voices and attempt to bind to a Hindi voice
  const voices = window.speechSynthesis.getVoices();
  const hindiVoice = voices.find(
    (voice) => voice.lang.includes('hi') || voice.lang.includes('HI')
  );
  if (hindiVoice) {
    utterance.voice = hindiVoice;
  }

  utterance.onend = () => {
    lastSpeechTime = Date.now();
  };

  window.speechSynthesis.speak(utterance);
  
  lastSpeechTime = now;
  lastSpokenText = text;
}

/**
 * Monitors the current right/left elbow angle and triggers rate-limited Hindi coaching feedback.
 */
export function processElbowCoaching(elbowAngle: number): { text: string; category: 'good' | 'straight' | 'bend' | 'idle' } {
  if (elbowAngle <= 0 || elbowAngle > 180) {
    return { text: '', category: 'idle' };
  }

  if (elbowAngle >= 120 && elbowAngle <= 160) {
    const text = 'बहुत अच्छा!';
    speakHindiFeedback(text);
    return { text, category: 'good' };
  } else if (elbowAngle > 160) {
    const text = 'हाथ सीधा है';
    speakHindiFeedback(text);
    return { text, category: 'straight' };
  } else {
    const text = 'हाथ मोड़ो';
    speakHindiFeedback(text);
    return { text, category: 'bend' };
  }
}
