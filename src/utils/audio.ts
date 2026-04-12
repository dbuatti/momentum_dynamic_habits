/**
 * Audio utility to handle sound alerts.
 * Includes a 'prime' function to unlock audio on iOS/mobile devices.
 */

const TIMER_END_SOUND = "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3"; // Bubbly chime
const SUCCESS_SOUND = "https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3"; // Sparkle sound
const START_SOUND = "https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3"; // Soft pop

class AudioManager {
  private timerAudio: HTMLAudioElement | null = null;
  private successAudio: HTMLAudioElement | null = null;
  private startAudio: HTMLAudioElement | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      this.timerAudio = new Audio(TIMER_END_SOUND);
      this.successAudio = new Audio(SUCCESS_SOUND);
      this.startAudio = new Audio(START_SOUND);
    }
  }

  public prime() {
    [this.timerAudio, this.successAudio, this.startAudio].forEach(audio => {
      if (audio) {
        audio.play().then(() => {
          audio.pause();
          audio.currentTime = 0;
        }).catch(() => {});
      }
    });
  }

  public playStart() {
    if (this.startAudio) {
      this.startAudio.currentTime = 0;
      this.startAudio.play().catch(() => {});
    }
  }

  public playTimerEnd() {
    if (this.timerAudio) {
      this.timerAudio.currentTime = 0;
      this.timerAudio.play().catch(() => {});
    }
  }

  public playSuccess() {
    if (this.successAudio) {
      this.successAudio.currentTime = 0;
      this.successAudio.play().catch(() => {});
    }
  }
}

export const audioManager = new AudioManager();

// Exporting specific functions to fix TypeScript errors in useFeedback.ts
export const playStartSound = () => audioManager.playStart();
export const playEndSound = () => audioManager.playTimerEnd();
export const playGoalSound = () => audioManager.playSuccess();