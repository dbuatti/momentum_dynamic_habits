/**
 * Audio utility for playing royalty-free chimes.
 * Using verified short audio snippets.
 */

// Short uplifting ping
const START_SOUND_URL = 'https://cdn.pixabay.com/audio/2022/03/15/audio_c8c8a73467.mp3'; 
// Magical celebratory shimmer (short)
const END_SOUND_URL = 'https://cdn.pixabay.com/audio/2021/08/04/audio_062564fa7e.mp3';   
// Soft notification ping
const GOAL_SOUND_URL = 'https://cdn.pixabay.com/audio/2021/08/04/audio_331326c507.mp3'; 

export const playStartSound = () => {
  const audio = new Audio(START_SOUND_URL);
  audio.volume = 0.3;
  audio.play().catch(err => console.log('Audio start blocked:', err));
};

export const playEndSound = () => {
  const audio = new Audio(END_SOUND_URL);
  audio.volume = 0.4;
  audio.play().catch(err => console.log('Audio end blocked:', err));
};

export const playGoalSound = () => {
  const audio = new Audio(GOAL_SOUND_URL);
  audio.volume = 0.2;
  audio.play().catch(err => console.log('Audio goal blocked:', err));
};