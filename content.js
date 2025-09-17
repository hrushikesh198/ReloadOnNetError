chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "showLoadedAlert") {
    try {
      // Delegate audio to offscreen document so it keeps playing during blocking alerts
      chrome.runtime.sendMessage({ type: 'offscreenAudio', action: 'start' });
      setTimeout(() => {
        alert("Page loaded. Click OK to stop the notification sound.");
        chrome.runtime.sendMessage({ type: 'offscreenAudio', action: 'stop' });
      }, 0);
      sendResponse({ ok: true });
    } catch (e) {
      console.log("Audio setup error", e);
      sendResponse({ ok: false, error: e && e.message ? e.message : String(e) });
    }
  return false;
  }
});

console.log('Content script loaded');