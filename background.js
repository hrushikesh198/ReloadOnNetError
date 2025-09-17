const RELOAD_DELAY_MS = 1000;
const autoReloadTabs = new Set();

async function markTabWithTabGroup(tabId, enabled) {
  try {
    if (enabled) {
      chrome.tabs.group({ tabIds: [tabId] }, (groupId) => {
        chrome.tabGroups.update(groupId, { title: "AR", color: "orange" });
      });
      chrome.action.setBadgeText({ text: "[AR]", tabId: tabId });
      chrome.action.setBadgeBackgroundColor({ color: "#FFA500", tabId: tabId });
      // chrome.tabs.update(tabId, { title: TITLE_PREFIX + without });
    } else {
      chrome.action.setBadgeText({ text: "", tabId: tabId });
      chrome.tabs.ungroup(tabId);
      // chrome.tabs.update(tabId, { title: without });
    }
  } catch (e) {
    console.error('Error setting title prefix:', e);
  }
}
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'activateAutoReload' && typeof message.tabId === 'number') {
    autoReloadTabs.add(message.tabId);
    console.log(`Auto-reload activated for tab ${message.tabId}`);
    markTabWithTabGroup(message.tabId, true);
  }
  if (message.type === 'deactivateAutoReload' && typeof message.tabId === 'number') {
    autoReloadTabs.delete(message.tabId);
    console.log(`Auto-reload deactivated for tab ${message.tabId}`);
    markTabWithTabGroup(message.tabId, false);
  }
  if (message.type === 'pageErrorDetected' && sender.tab && autoReloadTabs.has(sender.tab.id)) {
    console.log(`Page error detected. Reloading tab ${sender.tab.id}`);
    setTimeout(() => {
      chrome.tabs.reload(sender.tab.id);
    }, RELOAD_DELAY_MS);
  }
  if (message.type === 'getAutoReloadStatus' && typeof message.tabId === 'number') {
    sendResponse({ enabled: autoReloadTabs.has(message.tabId) });
    // Synchronous response; do not return true
  }
});

// Listen for network errors on enabled tabs
chrome.webNavigation.onErrorOccurred.addListener((details) => {
  // Ignore ERR_ABORTED errors
  if (details.error === 'net::ERR_ABORTED') {
    console.log(`Ignored net::ERR_ABORTED`, details)
    return;
  }
  if (autoReloadTabs.has(details.tabId)) {
    console.log('Navigation error detected, reloading', details);
    setTimeout(() => {
      chrome.tabs.reload(details.tabId);
    }, RELOAD_DELAY_MS);
  }
});

// Remove from set if tab is closed
chrome.tabs.onRemoved.addListener((tabId) => {
  if (autoReloadTabs.has(tabId)) {
    console.log(`Disabling auto-reload, tab ${tabId} closed.`);
    autoReloadTabs.delete(tabId);
  }
});

// Remove from set (and prefix) if tab loads successfully
chrome.webNavigation.onCompleted.addListener((details) => {
  if (autoReloadTabs.has(details.tabId)) {
    console.log(`Disabling auto-reload, tab ${details.tabId} loaded successfully.`);
    markTabWithTabGroup(details.tabId, false);
    autoReloadTabs.delete(details.tabId);
    // Tell the content script in this tab to play sound
      ensureOffscreenDocument().then(() => {
        chrome.tabs.sendMessage(details.tabId, { action: 'showLoadedAlert' }, () => {
          const lastError = chrome.runtime.lastError;
          if (lastError) {
            // Content script might not exist on some chrome:// pages or restricted URLs
            console.warn('playSound message not delivered:', lastError.message);
          }
        });
      }).catch((err)=>{
        console.warn('Failed to load Offscreen Doc', details.tabId, err);
      })    
  }
});

// ---- Offscreen audio control ----
const OFFSCREEN_URL = 'offscreen.html';
const OFFSCREEN_REASON = 'AUDIO_PLAYBACK';
let offscreenCreated = false;

async function ensureOffscreenDocument() {
  if (offscreenCreated) return;
  const existing = await chrome.offscreen.hasDocument?.();
  if (existing) {
    offscreenCreated = true;
    return;
  }
  await chrome.offscreen.createDocument({
    url: OFFSCREEN_URL,
    reasons: [OFFSCREEN_REASON],
    justification: 'Play looping notification sound until user acknowledges alert.'
  });
  offscreenCreated = true;
}

console.log('Background service worker initialized');