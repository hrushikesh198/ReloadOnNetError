let audioInstance = null;

function getAudio() {
  if (!audioInstance) {
    audioInstance = new Audio(chrome.runtime.getURL('tunes/escape-from-hell-looping-tune-228492.mp3'));
    audioInstance.loop = true;
  }
  return audioInstance;
}

async function start() {
  const audio = getAudio();
  try {
    await audio.play();
  } catch (e) {
    console.warn('Offscreen audio play failed', e);
  }
}

function stop() {
  const audio = getAudio();
  try {
    audio.pause();
    audio.currentTime = 0;
  } catch (e) {
    console.warn('Offscreen audio stop failed', e);
  }
}

chrome.runtime.onMessage.addListener((msg) => {
  if (msg && msg.type === 'offscreenAudio') {
    if (msg.action === 'start') start();
    if (msg.action === 'stop') stop();
  }
});


