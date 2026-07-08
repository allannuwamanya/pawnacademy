// Audio assets from Lichess CDN
const SOUND_URLS = {
  move: 'https://lichess1.org/assets/sound/standard/Move.mp3',
  capture: 'https://lichess1.org/assets/sound/standard/Capture.mp3',
  check: 'https://lichess1.org/assets/sound/standard/Check.mp3',
  notify: 'https://lichess1.org/assets/sound/standard/GenericNotify.mp3',
}

// Preloaded Audio objects
const audioCache = {}

function getAudio(type) {
  if (!audioCache[type]) {
    audioCache[type] = new Audio(SOUND_URLS[type])
  }
  return audioCache[type]
}

/**
 * Play a chess sound effect by type
 * @param {'move' | 'capture' | 'check' | 'notify'} type
 */
export function playSound(type) {
  try {
    const audio = getAudio(type)
    // Reset playback position so sound can be played in quick succession
    audio.currentTime = 0
    audio.play().catch(() => {
      // Browser might block audio play before user interaction; ignore this safely.
    })
  } catch (err) {
    console.warn('Audio play failed:', err)
  }
}
