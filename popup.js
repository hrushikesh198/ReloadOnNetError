const statusEl = document.getElementById('reload-status');
const btn = document.getElementById('activate-reload');

let autoReloadEnabled = false;

async function updateStatus() {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab && tab.id) {
    chrome.runtime.sendMessage({ type: 'getAutoReloadStatus', tabId: tab.id }, (response) => {
      if (response && response.enabled) {
        statusEl.textContent = 'Auto Reload: ON';
        statusEl.style.color = 'green';
        btn.textContent = 'Deactivate Auto Reload for this Tab';
        autoReloadEnabled = true;
      } else {
        statusEl.textContent = 'Auto Reload: OFF';
        statusEl.style.color = 'red';
        btn.textContent = 'Activate Auto Reload for this Tab';
        autoReloadEnabled = false;
      }
    });
  }
}

btn.addEventListener('click', async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab && tab.id) {
    if (autoReloadEnabled) {
      chrome.runtime.sendMessage({ type: 'deactivateAutoReload', tabId: tab.id });
    } else {
      chrome.runtime.sendMessage({ type: 'activateAutoReload', tabId: tab.id });
    }
    window.close();
  }
});

updateStatus();
