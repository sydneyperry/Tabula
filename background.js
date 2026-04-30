const KEEPALIVE_ALARM = "tabula-keepalive";
const IMPORT_WINDOW_MENU_ID = "tabula-import-window-tabs";
const SESSION_KEY_PENDING_COMMAND = "tabulaPendingPanelCommand";

async function safeSendMessage(message) {
  try {
    await chrome.runtime.sendMessage(message);
    return true;
  } catch (error) {
    return false;
  }
}

async function queuePendingCommand(command) {
  try {
    await chrome.storage.session.set({ [SESSION_KEY_PENDING_COMMAND]: command });
  } catch (error) {
    console.error("Unable to queue pending Tabula command", error);
  }
}

async function publishPanelEvent(type, payload = {}) {
  await safeSendMessage({
    type: "background-event",
    eventType: type,
    payload,
    sentAt: Date.now()
  });
}

async function openPanel(tab) {
  try {
    await chrome.sidePanel.open({
      windowId: tab?.windowId ?? chrome.windows.WINDOW_ID_CURRENT
    });
  } catch (error) {
    console.error("Unable to open Tabula side panel", error);
  }
}

async function applyPanelBehavior() {
  try {
    await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  } catch (error) {
    console.error("Unable to apply side panel behavior", error);
  }
}

async function ensureSetup() {
  await applyPanelBehavior();

  try {
    await chrome.alarms.create(KEEPALIVE_ALARM, { periodInMinutes: 25 / 60 });
  } catch (error) {
    console.error("Unable to create keepalive alarm", error);
  }

  try {
    await chrome.contextMenus.removeAll();
    chrome.contextMenus.create({
      id: IMPORT_WINDOW_MENU_ID,
      title: "Import current window tabs to folder",
      contexts: ["action"]
    });
  } catch (error) {
    console.error("Unable to build Tabula context menu", error);
  }
}

chrome.runtime.onInstalled.addListener(() => {
  ensureSetup().catch((error) => console.error(error));
});

chrome.runtime.onStartup.addListener(() => {
  ensureSetup().catch((error) => console.error(error));
});

chrome.action.onClicked.addListener((tab) => {
  openPanel(tab);
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name !== KEEPALIVE_ALARM) {
    return;
  }
  chrome.runtime.getPlatformInfo(() => {
    void chrome.runtime.lastError;
  });
});

chrome.tabs.onCreated.addListener((tab) => {
  publishPanelEvent("tabs-created", { tab });
});

chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  publishPanelEvent("tabs-removed", { tabId, removeInfo });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  publishPanelEvent("tabs-updated", { tabId, changeInfo, tab });
});

chrome.tabs.onActivated.addListener((activeInfo) => {
  publishPanelEvent("tabs-activated", { activeInfo });
});

chrome.windows.onFocusChanged.addListener((windowId) => {
  publishPanelEvent("window-focus-changed", { windowId });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== IMPORT_WINDOW_MENU_ID || !tab?.windowId) {
    return;
  }

  const command = {
    type: "import-window-tabs",
    windowId: tab.windowId,
    createdAt: Date.now()
  };

  const delivered = await safeSendMessage({
    type: "background-command",
    command
  });

  if (!delivered) {
    await queuePendingCommand(command);
  }

  await openPanel(tab);
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "open-sidepanel") {
    openPanel(message.payload?.tab);
    sendResponse({ ok: true });
    return;
  }

  if (message?.type === "apply-startup-panel-setting") {
    applyPanelBehavior()
      .then(() => sendResponse({ ok: true }))
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (message?.type === "consume-pending-command") {
    chrome.storage.session
      .get(SESSION_KEY_PENDING_COMMAND)
      .then(async (result) => {
        const command = result?.[SESSION_KEY_PENDING_COMMAND] || null;
        if (command) {
          await chrome.storage.session.remove(SESSION_KEY_PENDING_COMMAND);
        }
        sendResponse({ ok: true, command });
      })
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }
});
