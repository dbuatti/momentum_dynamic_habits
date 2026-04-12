/**
 * Audio utility for playing royalty-free chimes.
 * Optimized for reliability and preventing browser autoplay blocks.
 */

const START_SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3'; 
const END_SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3';   
const GOAL_SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/1110/1110-preview.mp3'; 

/**
 * Helper to play audio with error handling and reset
 */
const playAudio = (url: string, volume: number = 0.8) => {
  try {
    const audio = new Audio(url);
    audio.volume = volume;
    
    // Ensure the audio plays from the start even if reused
    audio.currentTime = 0;
    
    const playPromise = audio.play();
    
    if (playPromise !== undefined) {
      playPromise.catch(error => {
        // Auto-play was prevented or audio failed
        console.warn('[Audio] Playback prevented or failed:', error.message);
      });
    }
  } catch (err) {
    console.error('[Audio] Error initializing audio:', err);
  }
};

export const playStartSound = () => {
  playAudio(START_SOUND_URL, 0.6);
};

export const playEndSound = () => {
  playAudio(END_SOUND_URL, 0.7);
};

export const playGoalSound = () => {
  playAudio(GOAL_SOUND_URL, 0.8);
};