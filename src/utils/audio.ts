/**
 * Audio utility for playing royalty-free chimes.
 */

// Confirmed snappy chime
const START_SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3'; 
// Confirmed magical shimmer
const END_SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3';   
// Confirmed alert ping
const GOAL_SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3'; 

export const playStartSound = () => {
  console.log('🔊 Playing start chime');
  const audio = new Audio(START_SOUND_URL);
  audio.volume = 0.7;
  audio.play().catch(err => console.error('Audio start failed:', err));
};

export const playEndSound = () => {
  console.log('🔊 Playing completion shimmer');
  const audio = new Audio(END_SOUND_URL);
  audio.volume = 0.8;
  audio.play().catch(err => console.error('Audio end failed:', err));
};

export const playGoalSound = () => {
  console.log('🔔 Playing target hit alert');
  const audio = new Audio(GOAL_SOUND_URL);
  audio.volume = 0.9;
  audio.play().catch(err => console.error('Audio goal failed:', err));
};