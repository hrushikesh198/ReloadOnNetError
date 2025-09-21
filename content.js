chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "showLoadedAlert") {
    try {
      chrome.storage.sync.get('disableAudio', (data) => {
        let msg = "Page loaded successfully."
        if (!data.disableAudio) {
          // Delegate audio to offscreen document so it keeps playing during blocking alerts
          msg = msg + ' Click OK to stop the notification sound.'
          chrome.runtime.sendMessage({ type: 'offscreenAudio', action: 'start' });
        }
        setTimeout(() => {
          alert(msg);
          if (!data.disableAudio) {
            chrome.runtime.sendMessage({ type: 'offscreenAudio', action: 'stop' });
          }
        }, 0);
      });
      sendResponse({ ok: true });
    } catch (e) {
      console.log("Audio setup error", e);
      sendResponse({ ok: false, error: e && e.message ? e.message : String(e) });
    }
    return true;
  }
});

console.log('Content script loaded');