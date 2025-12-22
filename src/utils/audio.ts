/**
 * Audio utility for playing royalty-free chimes.
 * Using CDN URLs for reliable playback.
 */

const START_SOUND_URL = 'https://cdn.pixabay.com/audio/2022/03/10/audio_c35272734a.mp3'; // Positive Chime
const END_SOUND_URL = 'https://cdn.pixabay.com/audio/2022/01/18/audio_d0a13f69d2.mp3';   // Magical Chime
const GOAL_SOUND_URL = 'https://cdn.pixabay.com/audio/2021/08/04/audio_331326c507.mp3'; // Soft Notification

export const playStartSound = () => {
  const audio = new Audio(START_SOUND_URL);
  audio.volume = 0.4;
  audio.play().catch(err => console.log('Audio start blocked:', err));
};

export const playEndSound = () => {
  const audio = new Audio(END_SOUND_URL);
  audio.volume = 0.5;
  audio.play().catch(err => console.log('Audio end blocked:', err));
};

export const playGoalSound = () => {
  const audio = new Audio(GOAL_SOUND_URL);
  audio.volume = 0.3;
  audio.play().catch(err => console.log('Audio goal blocked:', err));
};