(function initTabulaMockChrome() {
  if (globalThis.chrome?.tabs && globalThis.chrome?.storage && globalThis.chrome?.runtime) {
    return;
  }

  const STORAGE_KEY = "tabula-web-mock-storage";
  const TABS_KEY = "tabula-web-mock-tabs";
  const HISTORY_KEY = "tabula-web-mock-history";
  const COUNTER_KEY = "tabula-web-mock-counter";

  function readJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
      return fallback;
    }
  }

  function writeJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function safeHostname(url) {
    try {
      return new URL(url).hostname.replace(/^www\./, "");
    } catch (error) {
      return url || "Untitled";
    }
  }

  function buildTitle(url) {
    const host = safeHostname(url);
    return host.charAt(0).toUpperCase() + host.slice(1);
  }

  function getTabs() {
    return readJson(TABS_KEY, []);
  }

  function setTabs(tabs) {
    writeJson(TABS_KEY, tabs);
  }

  function getHistory() {
    return readJson(HISTORY_KEY, []);
  }

  function setHistory(history) {
    writeJson(HISTORY_KEY, history);
  }

  function getStorage() {
    return readJson(STORAGE_KEY, {});
  }

  function setStorage(storage) {
    writeJson(STORAGE_KEY, storage);
  }

  function nextId() {
    const current = Number(localStorage.getItem(COUNTER_KEY) || "1000");
    const next = current + 1;
    localStorage.setItem(COUNTER_KEY, String(next));
    return next;
  }

  function ensureSeedTabs() {
    const tabs = getTabs();
    if (tabs.length) {
      return;
    }
    const now = Date.now();
    const seed = [
      { id: nextId(), url: "https://www.wikipedia.org/wiki/Italy", title: "Italy", active: true, favIconUrl: "" },
      { id: nextId(), url: "https://stackoverflow.com/questions/tagged/javascript", title: "JavaScript Questions", active: false, favIconUrl: "" },
      { id: nextId(), url: "https://github.com/trending", title: "GitHub Trending", active: false, favIconUrl: "" }
    ];
    setTabs(seed);
    setHistory(
      seed.map((tab, index) => ({
        id: String(tab.id),
        url: tab.url,
        title: tab.title,
        domain: safeHostname(tab.url),
        openedAt: now - index * 15 * 60 * 1000,
        lastTouchedAt: now - index * 10 * 60 * 1000,
        closedAt: null,
        folderId: null,
        folderName: "",
        touchCount: 1
      }))
    );
  }

  function recordHistory(tab) {
    const history = getHistory();
    history.push({
      id: String(tab.id),
      url: tab.url,
      title: tab.title,
      domain: safeHostname(tab.url),
      openedAt: Date.now(),
      lastTouchedAt: Date.now(),
      closedAt: null,
      folderId: null,
      folderName: "",
      touchCount: 1
    });
    setHistory(history);
  }

  ensureSeedTabs();

  const runtimeListeners = [];

  const chromeMock = {
    storage: {
      local: {
        async get(keys) {
          const storage = getStorage();
          if (keys == null) {
            return storage;
          }
          if (Array.isArray(keys)) {
            return Object.fromEntries(keys.map((key) => [key, storage[key]]));
          }
          if (typeof keys === "string") {
            return { [keys]: storage[keys] };
          }
          if (typeof keys === "object") {
            return Object.fromEntries(
              Object.entries(keys).map(([key, value]) => [key, storage[key] === undefined ? value : storage[key]])
            );
          }
          return storage;
        },
        async set(payload) {
          const storage = getStorage();
          setStorage({ ...storage, ...payload });
        },
        async remove(keys) {
          const storage = getStorage();
          const next = { ...storage };
          const list = Array.isArray(keys) ? keys : [keys];
          list.forEach((key) => delete next[key]);
          setStorage(next);
        }
      }
    },
    tabs: {
      async query() {
        return getTabs();
      },
      async create({ url, active = false }) {
        const tabs = getTabs();
        const tab = {
          id: nextId(),
          url,
          title: buildTitle(url),
          active,
          favIconUrl: ""
        };
        const nextTabs = tabs.map((item) => ({ ...item, active: active ? false : item.active }));
        nextTabs.push(tab);
        setTabs(nextTabs);
        recordHistory(tab);
        return tab;
      },
      async update(tabId, updateProps) {
        const tabs = getTabs().map((tab) => {
          if (updateProps.active) {
            tab.active = false;
          }
          if (tab.id === tabId) {
            return { ...tab, ...updateProps };
          }
          return tab;
        });
        setTabs(tabs);
        return tabs.find((tab) => tab.id === tabId) || null;
      },
      async remove(tabIds) {
        const ids = Array.isArray(tabIds) ? tabIds : [tabIds];
        setTabs(getTabs().filter((tab) => !ids.includes(tab.id)));
      }
    },
    windows: {
      async create({ url }) {
        const urls = Array.isArray(url) ? url : [url];
        urls.filter(Boolean).forEach((item) => {
          try {
            window.open(item, "_blank", "noopener,noreferrer");
          } catch (error) {
            void error;
          }
        });
        return { id: nextId() };
      }
    },
    history: {
      async search({ startTime = 0, endTime = Date.now() }) {
        return getHistory()
          .filter((entry) => entry.lastTouchedAt >= startTime && entry.lastTouchedAt <= endTime)
          .map((entry) => ({
            url: entry.url,
            title: entry.title,
            lastVisitTime: entry.lastTouchedAt
          }));
      }
    },
    runtime: {
      onMessage: {
        addListener(listener) {
          runtimeListeners.push(listener);
        }
      },
      async sendMessage(message) {
        if (message?.type === "consume-pending-command") {
          return null;
        }
        if (message?.type === "apply-startup-panel-setting") {
          return { ok: true };
        }
        for (const listener of runtimeListeners) {
          const response = listener(message);
          if (response !== undefined) {
            return response;
          }
        }
        return null;
      }
    }
  };

  globalThis.chrome = chromeMock;
})();
