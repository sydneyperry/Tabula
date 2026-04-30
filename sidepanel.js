const COLOR_OPTIONS = [
  { id: "terracotta", label: "Terracotta", value: "#c96f57" },
  { id: "sage", label: "Sage", value: "#88a28c" },
  { id: "dusty-blue", label: "Dusty Blue", value: "#6f89a3" },
  { id: "mauve", label: "Mauve", value: "#997d8f" },
  { id: "amber", label: "Amber", value: "#d4a24f" },
  { id: "slate", label: "Slate", value: "#6c7886" }
];

const THEME_PRESETS = [
  {
    id: "paper-desk",
    name: "Paper Desk",
    custom: { background: "#f5f0e8", cardSurface: "#fffdf8", accent: "#c0694a" },
    darkMode: "auto"
  },
  {
    id: "night-shift",
    name: "Night Shift",
    custom: { background: "#1c1a17", cardSurface: "#2a2720", accent: "#b28759" },
    darkMode: "dark"
  },
  {
    id: "moss",
    name: "Moss",
    custom: { background: "#213126", cardSurface: "#f1ecdf", accent: "#7d9c74" },
    darkMode: "light"
  },
  {
    id: "blueprint",
    name: "Blueprint",
    custom: { background: "#13253a", cardSurface: "#edf5ff", accent: "#51b7df" },
    darkMode: "light"
  },
  {
    id: "bare",
    name: "Bare",
    custom: { background: "#ffffff", cardSurface: "#ffffff", accent: "#1a1a1a" },
    darkMode: "light"
  }
];

const FONT_PAIRINGS = [
  { id: "classic", name: "Classic", heading: "Lora", body: "DM Sans", headingVar: '"Lora", serif', bodyVar: '"DM Sans", sans-serif' },
  { id: "editorial", name: "Editorial", heading: '"Playfair Display"', body: '"Source Sans 3"', headingVar: '"Playfair Display", serif', bodyVar: '"Source Sans 3", sans-serif' },
  { id: "modern", name: "Modern", heading: '"DM Serif Display"', body: "Jost", headingVar: '"DM Serif Display", serif', bodyVar: '"Jost", sans-serif' },
  { id: "minimal", name: "Minimal", heading: '"Libre Baskerville"', body: '"IBM Plex Sans"', headingVar: '"Libre Baskerville", serif', bodyVar: '"IBM Plex Sans", sans-serif' }
];

const TUTORIAL_STEPS = [
  {
    title: "This is your desk",
    body: "Tabula keeps your open tabs visible as cards so you can switch context without losing track of what matters.",
    target: ".brand h1",
    button: "Next"
  },
  {
    title: "Create folders",
    body: "Group tabs into folders that stay visible at the top of your desk.",
    target: "#show-workspace-form",
    button: "Next"
  },
  {
    title: "Add sticky notes",
    body: "Every note follows its URL so you can pick your work back up later.",
    target: ".note-toggle",
    button: "Next"
  },
  {
    title: "Search and ask naturally",
    body: "After onboarding, use the top search and assistant bars to rank relevant tabs and answer questions like what you were reading 20 minutes ago.",
    target: "#search-region",
    button: "Next"
  },
  {
    title: "Use connections and suggestions",
    body: "Suggest connections draws related-tab links and now proposes folders you can create with one click.",
    target: "#toggle-connections",
    button: "Next"
  },
  {
    title: "Save full mental snapshots",
    body: "Saved sessions preserve a whole browser state so you can reopen a project exactly where you left it.",
    target: "#saved-sessions-section",
    button: "Get Started"
  }
];

const DEFAULT_SETTINGS = {
  theme: {
    preset: "paper-desk",
    custom: {
      background: "#f5f0e8",
      cardSurface: "#fffdf8",
      accent: "#c0694a"
    },
    darkMode: "auto"
  },
  fontPairing: "classic",
  hasOnboarded: false,
  skippedCustomization: false,
  compactMode: false,
  showFavicons: true,
  showDomain: true,
  openOnStartup: false,
  ai: {
    suggestionsEnabled: true,
    summariesEnabled: true,
    relatedEnabled: true,
    commandBarEnabled: true
  }
};

const DEFAULT_STORAGE = {
  folders: [],
  notes: {},
  autoSummaries: {},
  urlInsights: {},
  folderLearning: {},
  tabHistory: [],
  savedSessions: [],
  tagColors: {},
  ...DEFAULT_SETTINGS
};

const STORAGE_KEYS = [...Object.keys(DEFAULT_STORAGE), "workspaces", "workspaceLearning"];

const runtimeFns = {
  maybeStartSummaryWatcher() {},
  renderConnections() {},
  runCommand() {}
};

function maybeStartSummaryWatcher(...args) {
  return runtimeFns.maybeStartSummaryWatcher(...args);
}

function renderConnections(...args) {
  return runtimeFns.renderConnections(...args);
}

function runCommand(...args) {
  return runtimeFns.runCommand(...args);
}

globalThis.maybeStartSummaryWatcher = maybeStartSummaryWatcher;
globalThis.renderConnections = renderConnections;
globalThis.runCommand = runCommand;

const extensionApisAvailable = Boolean(globalThis.chrome?.tabs && globalThis.chrome?.storage && globalThis.chrome?.runtime);

const state = {
  tabsById: new Map(),
  orderedTabIds: [],
  workspaces: [],
  notes: {},
  savedSessions: [],
  autoSummaries: {},
  urlInsights: {},
  workspaceLearning: {},
  tabHistory: [],
  tagColors: {},
  theme: structuredClone(DEFAULT_SETTINGS.theme),
  fontPairing: DEFAULT_SETTINGS.fontPairing,
  hasOnboarded: DEFAULT_SETTINGS.hasOnboarded,
  skippedCustomization: DEFAULT_SETTINGS.skippedCustomization,
  compactMode: DEFAULT_SETTINGS.compactMode,
  showFavicons: DEFAULT_SETTINGS.showFavicons,
  showDomain: DEFAULT_SETTINGS.showDomain,
  openOnStartup: DEFAULT_SETTINGS.openOnStartup,
  ai: structuredClone(DEFAULT_SETTINGS.ai),
  searchQuery: "",
  activeFilterLabel: "",
  commandQuery: "",
  commandPreview: null,
  assistantFollowUp: null,
  relatedLinesEnabled: false,
  duplicateUrls: new Set(),
  duplicateCount: 0,
  dismissedDuplicateBanner: false,
  tutorialActive: false,
  selectedTabIds: new Set(),
  lastSelectedTabId: null,
  focusedTabId: null,
  openNoteTabs: new Set(),
  openTagChooserTabId: null,
  editingWorkspaceId: null,
  pendingDeleteWorkspaceId: null,
  tutorialStepIndex: 0,
  welcomePhase: "splash",
  wizardStepIndex: 0,
  onboardingDraft: {
    theme: structuredClone(DEFAULT_SETTINGS.theme),
    fontPairing: DEFAULT_SETTINGS.fontPairing,
    workspaces: []
  },
  layoutMode: "standard",
  contextMenuState: null,
  contextSubmenu: null,
  headerMenuOpen: false,
  bulkMoveMenuOpen: false,
  settingsOpen: false,
  settingsTab: "appearance",
  openAssignFolderTabId: null,
  openPasteFolderId: null,
  dragState: null,
  externalDragInfo: null,
  liveTabMeta: {},
  suggestionDismissals: {},
  proactiveSuggestionDismissals: {},
  hasShownSessionSuggestion: false,
  autoSummaryQueue: new Set(),
  summaryIntervalId: null,
  saveTimer: null,
  pendingSavePayload: null,
  cardElements: new Map(),
  drawerElements: new Map(),
  resizeObserver: null,
  pendingDeleteToast: null,
  internalDragActive: false,
  manualAssignmentByTab: {}
};

const dom = {
  html: document.documentElement,
  body: document.body,
  app: document.querySelector("#app"),
  workspaceList: document.querySelector("#workspace-list"),
  unassignedSection: document.querySelector("#unassigned-section"),
  savedSessionsSection: document.querySelector("#saved-sessions-section"),
  deskScroll: document.querySelector("#desk-scroll"),
  emptyState: document.querySelector("#empty-state"),
  duplicateBanner: document.querySelector("#duplicate-banner"),
  duplicateBannerText: document.querySelector("#duplicate-banner-text"),
  duplicateReview: document.querySelector("#duplicate-review"),
  duplicateDismiss: document.querySelector("#duplicate-dismiss"),
  searchRegion: document.querySelector("#search-region"),
  duplicateBannerRegion: document.querySelector("#duplicate-banner-region"),
  searchInput: document.querySelector("#search-input"),
  searchClear: document.querySelector("#search-clear"),
  commandInput: document.querySelector("#command-input"),
  commandRun: document.querySelector("#command-run"),
  commandPreview: document.querySelector("#command-preview"),
  showWorkspaceForm: document.querySelector("#show-workspace-form"),
  workspaceForm: document.querySelector("#workspace-form"),
  workspaceNameInput: document.querySelector("#workspace-name-input"),
  workspaceColorSwatches: document.querySelector("#workspace-color-swatches"),
  workspaceCustomColor: document.querySelector("#workspace-custom-color"),
  workspaceCustomColorText: document.querySelector("#workspace-custom-color-text"),
  cancelWorkspaceForm: document.querySelector("#cancel-workspace-form"),
  themeToggle: document.querySelector("#theme-toggle"),
  headerMenuButton: document.querySelector("#header-menu-button"),
  menuPortalRoot: document.querySelector("#menu-portal-root"),
  bulkBar: document.querySelector("#bulk-bar"),
  bulkCount: document.querySelector("#bulk-count"),
  bulkMoveButton: document.querySelector("#bulk-move-button"),
  bulkMoveMenu: document.querySelector("#bulk-move-menu"),
  bulkCloseButton: document.querySelector("#bulk-close-button"),
  bulkClearButton: document.querySelector("#bulk-clear-button"),
  importFileInput: document.querySelector("#import-file-input"),
  toastStack: document.querySelector("#toast-stack"),
  externalDropZone: document.querySelector("#external-drop-zone"),
  externalDropWorkspaceSelect: document.querySelector("#external-drop-workspace-select"),
  toggleConnections: document.querySelector("#toggle-connections"),
  connectionsStatus: document.querySelector("#connections-status"),
  connectionsOverlay: document.querySelector("#connections-overlay"),
  welcomeOverlay: document.querySelector("#welcome-overlay"),
  welcomeSplash: document.querySelector("#welcome-splash"),
  customizationWizard: document.querySelector("#customization-wizard"),
  startCustomization: document.querySelector("#start-customization"),
  skipCustomization: document.querySelector("#skip-customization"),
  wizardProgress: document.querySelector("#wizard-progress"),
  wizardBack: document.querySelector("#wizard-back"),
  wizardNext: document.querySelector("#wizard-next"),
  wizardSummaryCard: document.querySelector("#wizard-summary-card"),
  onboardingWorkspaceContainer: document.querySelector("#onboarding-workspaces"),
  addOnboardingWorkspace: document.querySelector("#add-onboarding-workspace"),
  tutorialOverlay: document.querySelector("#tutorial-overlay"),
  tutorialHighlight: document.querySelector("#tutorial-highlight"),
  tutorialTooltip: document.querySelector("#tutorial-tooltip"),
  tutorialStepIndex: document.querySelector("#tutorial-step-index"),
  tutorialTitle: document.querySelector("#tutorial-title"),
  tutorialBody: document.querySelector("#tutorial-body"),
  tutorialNext: document.querySelector("#tutorial-next"),
  settingsOverlay: document.querySelector("#settings-overlay"),
  settingsClose: document.querySelector("#settings-close"),
  settingsTabAppearance: document.querySelector("#settings-tab-appearance"),
  settingsTabWorkspaces: document.querySelector("#settings-tab-workspaces"),
  settingsTabAi: document.querySelector("#settings-tab-ai"),
  settingsTabBehavior: document.querySelector("#settings-tab-behavior"),
  settingsSectionAppearance: document.querySelector("#settings-section-appearance"),
  settingsSectionWorkspaces: document.querySelector("#settings-section-workspaces"),
  settingsSectionAi: document.querySelector("#settings-section-ai"),
  settingsSectionBehavior: document.querySelector("#settings-section-behavior"),
  settingsThemePresets: document.querySelector("#settings-theme-presets"),
  settingsFontPairings: document.querySelector("#settings-font-pairings"),
  settingsWorkspaces: document.querySelector("#settings-workspaces"),
  settingsBackgroundColor: document.querySelector("#settings-background-color"),
  settingsBackgroundText: document.querySelector("#settings-background-text"),
  settingsSurfaceColor: document.querySelector("#settings-surface-color"),
  settingsSurfaceText: document.querySelector("#settings-surface-text"),
  settingsAccentColor: document.querySelector("#settings-accent-color"),
  settingsAccentText: document.querySelector("#settings-accent-text"),
  settingsDarkMode: document.querySelector("#settings-dark-mode"),
  behaviorOpenOnStartup: document.querySelector("#behavior-open-on-startup"),
  behaviorShowFavicons: document.querySelector("#behavior-show-favicons"),
  behaviorShowDomain: document.querySelector("#behavior-show-domain"),
  behaviorCompactMode: document.querySelector("#behavior-compact-mode"),
  aiSuggestionsEnabled: document.querySelector("#ai-suggestions-enabled"),
  aiSummariesEnabled: document.querySelector("#ai-summaries-enabled"),
  aiRelatedEnabled: document.querySelector("#ai-related-enabled"),
  aiCommandBarEnabled: document.querySelector("#ai-command-bar-enabled"),
  settingsResetDefaults: document.querySelector("#settings-reset-defaults"),
  replayTutorial: document.querySelector("#replay-tutorial"),
  themePresetGrid: document.querySelector("#theme-preset-grid"),
  fontPairingGrid: document.querySelector("#font-pairing-grid"),
  customBackgroundColor: document.querySelector("#custom-background-color"),
  customBackgroundText: document.querySelector("#custom-background-text"),
  customSurfaceColor: document.querySelector("#custom-surface-color"),
  customSurfaceText: document.querySelector("#custom-surface-text"),
  customAccentColor: document.querySelector("#custom-accent-color"),
  customAccentText: document.querySelector("#custom-accent-text"),
  cardTemplate: document.querySelector("#card-template")
};

function syncTutorialDomReferences() {
  dom.tutorialOverlay = document.querySelector("#tutorial-overlay");
  dom.tutorialHighlight = document.querySelector("#tutorial-highlight");
  dom.tutorialTooltip = document.querySelector("#tutorial-tooltip");
  dom.tutorialStepIndex = document.querySelector("#tutorial-step-index");
  dom.tutorialTitle = document.querySelector("#tutorial-title");
  dom.tutorialBody = document.querySelector("#tutorial-body");
  dom.tutorialNext = document.querySelector("#tutorial-next");
}

function ensureTutorialOverlay() {
  if (dom.tutorialOverlay && document.body.contains(dom.tutorialOverlay)) {
    dom.tutorialOverlay.classList.remove("hidden");
    dom.tutorialOverlay.classList.add("tutorial-overlay-active");
    if (dom.tutorialNext) {
      dom.tutorialNext.onclick = advanceTutorial;
    }
    return dom.tutorialOverlay;
  }
  const overlay = document.createElement("div");
  overlay.id = "tutorial-overlay";
  overlay.className = "screen-overlay tutorial-overlay-active";
  overlay.innerHTML = `
    <div id="tutorial-highlight" class="tutorial-highlight"></div>
    <div id="tutorial-tooltip" class="tutorial-tooltip">
      <div id="tutorial-step-index" class="tutorial-step-index"></div>
      <h2 id="tutorial-title"></h2>
      <p id="tutorial-body"></p>
      <button id="tutorial-next" class="primary-button" type="button">Next</button>
    </div>
  `;
  document.body.appendChild(overlay);
  syncTutorialDomReferences();
  dom.tutorialOverlay.classList.remove("hidden");
  if (dom.tutorialNext) {
    dom.tutorialNext.onclick = advanceTutorial;
  }
  return overlay;
}

function destroyTutorialOverlay() {
  dom.tutorialOverlay?.remove();
  dom.tutorialOverlay = null;
  dom.tutorialHighlight = null;
  dom.tutorialTooltip = null;
  dom.tutorialStepIndex = null;
  dom.tutorialTitle = null;
  dom.tutorialBody = null;
  dom.tutorialNext = null;
  document.body.classList.remove("tutorial-mode");
  document.body.classList.remove("tutorial-search-step");
}

async function init() {
  if (!extensionApisAvailable) {
    applyAppearance();
    renderThemePresetCards();
    renderFontPairingCards();
    renderSettingsState();
    renderWelcomeOrTutorial();
    showToast("Open Tabula from Chrome's extension side panel to use live tab features.");
    return;
  }
  renderWorkspaceSwatches();
  renderThemePresetCards();
  renderFontPairingCards();
  bindBaseEvents();
  await loadStoredState();
  applyAppearance();
  renderSettingsState();
  await reconcileWithBrowser({ fullRender: true });
  await consumePendingCommand();
  initResizeObserver();
  syncExternalDropWorkspaceSelect();
  runtimeFns.maybeStartSummaryWatcher();
  dom.commandInput.closest(".command-row")?.classList.toggle("hidden", !state.ai.commandBarEnabled);
  renderWelcomeOrTutorial();
}

function bindBaseEvents() {
  dom.searchInput.addEventListener("input", handleSearchInput);
  dom.searchClear.addEventListener("click", clearSearch);
  dom.commandInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      void runtimeFns.runCommand(dom.commandInput.value);
    }
  });
  dom.commandRun.addEventListener("click", () => {
    void runtimeFns.runCommand(dom.commandInput.value);
  });
  dom.showWorkspaceForm.addEventListener("click", () => toggleWorkspaceForm(true));
  dom.cancelWorkspaceForm.addEventListener("click", () => toggleWorkspaceForm(false));
  dom.workspaceForm.addEventListener("submit", handleCreateWorkspace);

  bindColorPair(dom.workspaceCustomColor, dom.workspaceCustomColorText);
  bindColorPair(dom.customBackgroundColor, dom.customBackgroundText);
  bindColorPair(dom.customSurfaceColor, dom.customSurfaceText);
  bindColorPair(dom.customAccentColor, dom.customAccentText);
  bindColorPair(dom.settingsBackgroundColor, dom.settingsBackgroundText);
  bindColorPair(dom.settingsSurfaceColor, dom.settingsSurfaceText);
  bindColorPair(dom.settingsAccentColor, dom.settingsAccentText);

  dom.themeToggle.addEventListener("click", cycleThemeMode);
  dom.headerMenuButton.addEventListener("click", (event) => {
    event.stopPropagation();
    state.headerMenuOpen ? closeHeaderMenu() : openHeaderMenu();
  });
  dom.importFileInput.addEventListener("change", handleImportFile);

  dom.bulkMoveButton.addEventListener("click", (event) => {
    event.stopPropagation();
    state.bulkMoveMenuOpen = !state.bulkMoveMenuOpen;
    renderBulkBar();
  });
  dom.bulkCloseButton.addEventListener("click", () => closeTabs(Array.from(state.selectedTabIds)));
  dom.bulkClearButton.addEventListener("click", () => clearSelection(true));

  dom.duplicateDismiss.addEventListener("click", () => {
    state.dismissedDuplicateBanner = true;
    renderDuplicateBanner();
  });
  dom.duplicateReview.addEventListener("click", reviewDuplicates);

  dom.startCustomization.addEventListener("click", () => {
    state.welcomePhase = "wizard";
    renderWelcomeOrTutorial();
  });

  dom.skipCustomization.addEventListener("click", () => {
    state.hasOnboarded = true;
    state.tutorialActive = true;
    state.tutorialStepIndex = 0;
    state.skippedCustomization = false;
    scheduleSave();
    renderWelcomeOrTutorial();
  });

  dom.wizardBack.addEventListener("click", () => {
    state.wizardStepIndex = Math.max(0, state.wizardStepIndex - 1);
    renderWizardStep();
  });

  dom.wizardNext.addEventListener("click", () => {
    if (state.wizardStepIndex < 3) {
      state.wizardStepIndex += 1;
      renderWizardStep();
      return;
    }
    finishCustomizationWizard();
  });

  dom.addOnboardingWorkspace.addEventListener("click", () => {
    if (state.onboardingDraft.workspaces.length >= 3) {
      return;
    }
    state.onboardingDraft.workspaces.push(createDraftWorkspace(`Folder ${state.onboardingDraft.workspaces.length + 1}`));
    renderOnboardingWorkspaceForms();
  });

  dom.settingsClose.addEventListener("click", () => {
    state.settingsOpen = false;
    renderSettingsOverlay();
  });
  [
    dom.settingsTabAppearance,
    dom.settingsTabWorkspaces,
    dom.settingsTabAi,
    dom.settingsTabBehavior
  ].forEach((button) => {
    button?.addEventListener("click", () => {
      state.settingsTab = button.dataset.settingsTab;
      renderSettingsOverlay();
    });
  });
  dom.settingsResetDefaults.addEventListener("click", resetSettingsToDefaults);
  dom.replayTutorial?.addEventListener("click", () => {
    state.tutorialStepIndex = 0;
    state.tutorialActive = true;
    state.settingsOpen = false;
    renderSettingsOverlay();
    renderTutorial();
  });

  dom.settingsDarkMode.addEventListener("change", () => {
    state.theme.darkMode = dom.settingsDarkMode.value;
    applyAppearance();
    scheduleSave();
  });

  dom.behaviorOpenOnStartup.addEventListener("change", async () => {
    state.openOnStartup = dom.behaviorOpenOnStartup.checked;
    scheduleSave();
    await chrome.runtime.sendMessage({ type: "apply-startup-panel-setting" }).catch(() => {});
  });
  dom.behaviorShowFavicons.addEventListener("change", () => {
    state.showFavicons = dom.behaviorShowFavicons.checked;
    applyAppearance();
    renderVisibleCards();
    scheduleSave();
  });
  dom.behaviorShowDomain.addEventListener("change", () => {
    state.showDomain = dom.behaviorShowDomain.checked;
    applyAppearance();
    renderVisibleCards();
    scheduleSave();
  });
  dom.behaviorCompactMode.addEventListener("change", () => {
    state.compactMode = dom.behaviorCompactMode.checked;
    updateLayoutMode(dom.app.clientWidth);
    renderVisibleCards();
    scheduleSave();
  });

  dom.aiSuggestionsEnabled.addEventListener("change", () => {
    state.ai.suggestionsEnabled = dom.aiSuggestionsEnabled.checked;
    renderVisibleCards();
    scheduleSave();
  });
  dom.aiSummariesEnabled.addEventListener("change", () => {
    state.ai.summariesEnabled = dom.aiSummariesEnabled.checked;
    if (state.ai.summariesEnabled) {
      runtimeFns.maybeStartSummaryWatcher();
      checkAutoSummaryCandidates().catch(console.error);
    }
    scheduleSave();
  });
  dom.aiRelatedEnabled.addEventListener("change", () => {
    state.ai.relatedEnabled = dom.aiRelatedEnabled.checked;
    state.relatedLinesEnabled = state.ai.relatedEnabled && state.relatedLinesEnabled;
    runtimeFns.renderConnections();
    scheduleSave();
  });
  dom.aiCommandBarEnabled.addEventListener("change", () => {
    state.ai.commandBarEnabled = dom.aiCommandBarEnabled.checked;
    dom.commandInput.closest(".command-row")?.classList.toggle("hidden", !state.ai.commandBarEnabled);
    dom.commandPreview.classList.toggle("hidden", true);
    scheduleSave();
  });
  dom.toggleConnections.addEventListener("click", () => {
    state.relatedLinesEnabled = !state.relatedLinesEnabled;
    runtimeFns.renderConnections();
    const suggestions = computeSuggestedFoldersFromConnections();
    state.commandPreview = {
      type: "folder-ideas",
      title: suggestions.length ? "Suggested folders" : "No folder suggestions yet",
      body: suggestions.length
        ? "These tabs look related enough to group together."
        : "Open a few more related tabs and Tabula will suggest folders here.",
      suggestions
    };
    renderCommandPreview();
  });

  dom.externalDropZone.addEventListener("dragover", (event) => {
    event.preventDefault();
  });
  dom.externalDropZone.addEventListener("drop", handleExternalDropZoneDrop);

  dom.deskScroll.addEventListener("scroll", () => {
    closeContextMenu();
    closeHeaderMenu();
    positionTutorial();
    runtimeFns.renderConnections();
  });

  document.addEventListener("keydown", handleGlobalKeydown);
  document.addEventListener("click", handleDocumentClick);

  document.addEventListener("dragstart", () => {
    state.internalDragActive = true;
    enableGlobalDropAffordances(true);
  });
  document.addEventListener("dragend", () => {
    state.internalDragActive = false;
    enableGlobalDropAffordances(false);
  });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      reconcileWithBrowser({ fullRender: false }).catch(console.error);
      consumePendingCommand().catch(console.error);
    }
  });

  window.addEventListener("focus", () => {
    reconcileWithBrowser({ fullRender: false }).catch(console.error);
  });

  chrome.runtime.onMessage.addListener((message) => {
    if (message?.type === "background-event") {
      reconcileWithBrowser({ fullRender: false }).catch(console.error);
      return;
    }

    if (message?.type === "background-command" && message.command?.type === "import-window-tabs") {
      importWindowTabsToWorkspace(message.command.windowId).catch(console.error);
      return;
    }

    if (message?.type === "content-drag-start") {
      state.externalDragInfo = message.payload;
      renderExternalDropZone(true);
      enableGlobalDropAffordances(true);
      return;
    }

    if (message?.type === "content-drag-end") {
      state.externalDragInfo = null;
      renderExternalDropZone(false);
      enableGlobalDropAffordances(state.internalDragActive);
    }
  });
}

async function loadStoredState() {
  const stored = await safeStorageGet(STORAGE_KEYS);
  const sanitized = sanitizeStorage(stored);
  Object.assign(state, sanitized);

  if (sanitized.hadReset) {
    showToast("Folder data was reset due to a storage error.");
    scheduleSave();
  }

  if (!state.onboardingDraft.workspaces.length) {
    state.onboardingDraft.workspaces = [createDraftWorkspace("Research")];
  }
}

async function safeStorageGet(keys) {
  try {
    return await chrome.storage.local.get(keys);
  } catch (error) {
    console.error("storage.get failed", error);
    return structuredClone(DEFAULT_STORAGE);
  }
}

async function safeStorageSet(payload) {
  try {
    await chrome.storage.local.set(payload);
    return true;
  } catch (error) {
    console.error("storage.set failed", error);
    showToast("Changes couldn't be saved. Storage may be full.");
    return false;
  }
}

function sanitizeStorage(data) {
  const result = structuredClone(DEFAULT_STORAGE);
  result.hadReset = false;

  try {
    const storedFolders = Array.isArray(data.folders) ? data.folders : Array.isArray(data.workspaces) ? data.workspaces : null;
    if (storedFolders) {
      result.workspaces = storedFolders.map(sanitizeWorkspace).filter(Boolean);
    } else if (data.folders || data.workspaces) {
      result.hadReset = true;
    }

    if (data.notes && typeof data.notes === "object" && !Array.isArray(data.notes)) {
      result.notes = Object.fromEntries(
        Object.entries(data.notes).filter(([key, value]) => typeof key === "string" && typeof value === "string")
      );
    } else if (data.notes) {
      result.hadReset = true;
    }

    if (data.autoSummaries && typeof data.autoSummaries === "object" && !Array.isArray(data.autoSummaries)) {
      result.autoSummaries = Object.fromEntries(
        Object.entries(data.autoSummaries).filter(
          ([key, value]) => typeof key === "string" && value && typeof value === "object" && typeof value.text === "string"
        )
      );
    }

    if (data.urlInsights && typeof data.urlInsights === "object" && !Array.isArray(data.urlInsights)) {
      result.urlInsights = data.urlInsights;
    }

    const storedFolderLearning = data.folderLearning || data.workspaceLearning;
    if (storedFolderLearning && typeof storedFolderLearning === "object" && !Array.isArray(storedFolderLearning)) {
      result.workspaceLearning = storedFolderLearning;
    }

    if (Array.isArray(data.tabHistory)) {
      result.tabHistory = data.tabHistory.map(sanitizeTabHistoryEntry).filter(Boolean);
    }

    if (Array.isArray(data.savedSessions)) {
      result.savedSessions = data.savedSessions.map(sanitizeSavedSession).filter(Boolean);
    } else if (data.savedSessions) {
      result.hadReset = true;
    }

    if (data.tagColors && typeof data.tagColors === "object" && !Array.isArray(data.tagColors)) {
      result.tagColors = Object.fromEntries(
        Object.entries(data.tagColors).filter(([key, value]) => typeof key === "string" && isColorToken(value))
      );
    }

    if (data.theme && typeof data.theme === "object") {
      result.theme = sanitizeTheme(data.theme);
    }

    if (FONT_PAIRINGS.some((pairing) => pairing.id === data.fontPairing)) {
      result.fontPairing = data.fontPairing;
    }

    result.hasOnboarded = Boolean(data.hasOnboarded);
    result.skippedCustomization = Boolean(data.skippedCustomization);
    result.compactMode = Boolean(data.compactMode);
    result.showFavicons = data.showFavicons !== false;
    result.showDomain = data.showDomain !== false;
    result.openOnStartup = Boolean(data.openOnStartup);
    result.ai = {
      ...structuredClone(DEFAULT_SETTINGS.ai),
      ...(data.ai && typeof data.ai === "object" ? data.ai : {})
    };
    Object.keys(result.ai).forEach((key) => {
      if (key === "provider" || /api.?key/i.test(key)) {
        delete result.ai[key];
      }
    });
  } catch (error) {
    console.error("Unable to sanitize Tabula storage", error);
    result.hadReset = true;
  }

  return result;
}

function sanitizeWorkspace(workspace) {
  if (!workspace || typeof workspace !== "object" || typeof workspace.id !== "string" || typeof workspace.name !== "string") {
    return null;
  }
  return {
    id: workspace.id,
    name: workspace.name.slice(0, 32),
    color: normalizeWorkspaceColor(workspace.color),
    tabIds: Array.isArray(workspace.tabIds) ? workspace.tabIds.filter((tabId) => Number.isInteger(tabId)) : [],
    tabUrlSnapshots: Array.isArray(workspace.tabUrlSnapshots)
      ? workspace.tabUrlSnapshots.filter((url) => typeof url === "string")
      : [],
    collapsed: Boolean(workspace.collapsed)
  };
}

function sanitizeSavedSession(session) {
  if (!session || typeof session !== "object" || typeof session.id !== "string" || typeof session.name !== "string") {
    return null;
  }
  return {
    id: session.id,
    name: session.name.slice(0, 48),
    savedAt: Number.isFinite(session.savedAt) ? session.savedAt : Date.now(),
    urls: Array.isArray(session.urls) ? session.urls.filter((url) => typeof url === "string") : []
  };
}

function sanitizeTabHistoryEntry(entry) {
  if (!entry || typeof entry !== "object") {
    return null;
  }
  const url = typeof entry.url === "string" ? entry.url : "";
  if (!url) {
    return null;
  }
  return {
    id: typeof entry.id === "string" ? entry.id : crypto.randomUUID(),
    url,
    title: typeof entry.title === "string" ? entry.title.slice(0, 200) : url,
    domain: typeof entry.domain === "string" ? entry.domain.slice(0, 120) : safeHostname(url),
    openedAt: Number.isFinite(entry.openedAt) ? entry.openedAt : Date.now(),
    lastTouchedAt: Number.isFinite(entry.lastTouchedAt) ? entry.lastTouchedAt : 0,
    closedAt: Number.isFinite(entry.closedAt) ? entry.closedAt : null,
    folderId: typeof entry.folderId === "string" ? entry.folderId : null,
    folderName: typeof entry.folderName === "string" ? entry.folderName.slice(0, 64) : "",
    touchCount: Number.isFinite(entry.touchCount) ? entry.touchCount : 0
  };
}

function sanitizeTheme(theme) {
  return {
    preset: THEME_PRESETS.some((preset) => preset.id === theme.preset) ? theme.preset : "paper-desk",
    custom: {
      background: sanitizeHex(theme.custom?.background, "#f5f0e8"),
      cardSurface: sanitizeHex(theme.custom?.cardSurface, "#fffdf8"),
      accent: sanitizeHex(theme.custom?.accent, "#c0694a")
    },
    darkMode: ["auto", "light", "dark"].includes(theme.darkMode) ? theme.darkMode : "auto"
  };
}

function scheduleSave() {
  state.pendingSavePayload = {
    folders: state.workspaces.map((workspace) => ({
      ...workspace,
      tabIds: [...workspace.tabIds],
      tabUrlSnapshots: [...workspace.tabUrlSnapshots]
    })),
    notes: { ...state.notes },
    autoSummaries: structuredClone(state.autoSummaries),
    urlInsights: structuredClone(state.urlInsights),
    folderLearning: structuredClone(state.workspaceLearning),
    tabHistory: state.tabHistory.map((entry) => ({ ...entry })),
    savedSessions: state.savedSessions.map((session) => ({ ...session, urls: [...session.urls] })),
    tagColors: { ...state.tagColors },
    theme: structuredClone(state.theme),
    fontPairing: state.fontPairing,
    hasOnboarded: state.hasOnboarded,
    skippedCustomization: state.skippedCustomization,
    compactMode: state.compactMode,
    showFavicons: state.showFavicons,
    showDomain: state.showDomain,
    openOnStartup: state.openOnStartup,
    ai: structuredClone(state.ai)
  };

  if (state.saveTimer) {
    clearTimeout(state.saveTimer);
  }

  state.saveTimer = setTimeout(async () => {
    state.saveTimer = null;
    const payload = state.pendingSavePayload;
    state.pendingSavePayload = null;
    if (!payload) {
      return;
    }
    await safeStorageSet(payload);
    try {
      await chrome.storage.local.remove(["workspaces", "workspaceLearning"]);
    } catch (error) {
      console.error("Unable to remove legacy Tabula storage keys", error);
    }
  }, 300);
}

function renderWorkspaceSwatches() {
  dom.workspaceColorSwatches.replaceChildren();
  COLOR_OPTIONS.forEach((color, index) => {
    const label = document.createElement("label");
    label.className = `swatch-option${index === 0 ? " selected" : ""}`;
    label.innerHTML = `
      <input type="radio" name="workspaceColor" value="${color.id}" ${index === 0 ? "checked" : ""} hidden />
      <span class="swatch-dot" style="background:${color.value};"></span>
      <span>${color.label}</span>
    `;
    label.addEventListener("click", () => {
      dom.workspaceColorSwatches.querySelectorAll(".swatch-option").forEach((node) => node.classList.remove("selected"));
      label.classList.add("selected");
      dom.workspaceCustomColor.value = color.value;
      dom.workspaceCustomColorText.value = color.value;
    });
    dom.workspaceColorSwatches.appendChild(label);
  });
}

function renderThemePresetCards() {
  renderPresetList(dom.themePresetGrid, state.onboardingDraft.theme.preset, (presetId) => {
    const preset = getThemePreset(presetId);
    state.onboardingDraft.theme = {
      preset: preset.id,
      custom: structuredClone(preset.custom),
      darkMode: preset.darkMode
    };
    renderWizardStep();
    applyPreviewAppearance();
  });

  renderPresetList(dom.settingsThemePresets, state.theme.preset, (presetId) => {
    const preset = getThemePreset(presetId);
    state.theme = {
      preset: preset.id,
      custom: structuredClone(preset.custom),
      darkMode: preset.darkMode
    };
    applyAppearance();
    renderSettingsState();
    scheduleSave();
  });
}

function renderPresetList(container, selectedId, onSelect) {
  container.replaceChildren();
  THEME_PRESETS.forEach((preset) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = `theme-preset-card${selectedId === preset.id ? " selected" : ""}`;
    card.innerHTML = `
      <strong>${preset.name}</strong>
      <span class="font-sample-body">${preset.custom.background} · ${preset.custom.accent}</span>
    `;
    card.style.background = `linear-gradient(135deg, ${preset.custom.background}, ${preset.custom.cardSurface})`;
    card.style.color = contrastText(preset.custom.background);
    card.addEventListener("click", () => onSelect(preset.id));
    container.appendChild(card);
  });
}

function renderFontPairingCards() {
  renderFontList(dom.fontPairingGrid, state.onboardingDraft.fontPairing, (pairingId) => {
    state.onboardingDraft.fontPairing = pairingId;
    renderWizardStep();
    applyPreviewAppearance();
  });

  renderFontList(dom.settingsFontPairings, state.fontPairing, (pairingId) => {
    state.fontPairing = pairingId;
    applyAppearance();
    renderSettingsState();
    scheduleSave();
  });
}

function renderFontList(container, selectedId, onSelect) {
  container.replaceChildren();
  FONT_PAIRINGS.forEach((pairing) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = `font-pairing-card font-${pairing.id}${selectedId === pairing.id ? " selected" : ""}`;
    card.innerHTML = `
      <span class="font-sample-heading">Research</span>
      <span class="font-sample-body">My favorite article</span>
    `;
    card.addEventListener("click", () => onSelect(pairing.id));
    container.appendChild(card);
  });
}

function bindColorPair(colorInput, textInput) {
  if (!colorInput || !textInput) {
    return;
  }

  colorInput.addEventListener("input", () => {
    textInput.value = colorInput.value;
    handleColorPairChange(colorInput, textInput);
  });

  textInput.addEventListener("input", () => {
    const normalized = sanitizeHex(textInput.value, colorInput.value);
    colorInput.value = normalized;
    handleColorPairChange(colorInput, textInput);
  });
}

function handleColorPairChange(colorInput, textInput) {
  const value = sanitizeHex(textInput.value, colorInput.value);
  colorInput.value = value;
  textInput.value = value;

  if (colorInput === dom.customBackgroundColor || colorInput === dom.customSurfaceColor || colorInput === dom.customAccentColor) {
    state.onboardingDraft.theme = {
      ...state.onboardingDraft.theme,
      preset: "custom",
      custom: {
        background: dom.customBackgroundColor.value,
        cardSurface: dom.customSurfaceColor.value,
        accent: dom.customAccentColor.value
      }
    };
    renderWizardStep();
    applyPreviewAppearance();
    return;
  }

  if (colorInput === dom.settingsBackgroundColor || colorInput === dom.settingsSurfaceColor || colorInput === dom.settingsAccentColor) {
    state.theme = {
      ...state.theme,
      preset: "custom",
      custom: {
        background: dom.settingsBackgroundColor.value,
        cardSurface: dom.settingsSurfaceColor.value,
        accent: dom.settingsAccentColor.value
      }
    };
    applyAppearance();
    renderSettingsState();
    scheduleSave();
  }
}

function toggleWorkspaceForm(show) {
  dom.workspaceForm.classList.toggle("hidden", !show);
  dom.showWorkspaceForm.classList.toggle("hidden", show);
  if (show) {
    dom.workspaceNameInput.focus();
  }
}

async function handleCreateWorkspace(event) {
  event.preventDefault();
  const formData = new FormData(dom.workspaceForm);
  const name = String(formData.get("workspaceName") || "").trim();
  if (!name) {
    return;
  }

  const selectedColor = formData.get("workspaceColor") || null;
  const color = normalizeWorkspaceColor(selectedColor || dom.workspaceCustomColor.value);
  createFolder(name, color);
  toggleWorkspaceForm(false);
}

function applyAppearance() {
  const theme = state.theme;
  dom.html.style.setProperty("--bg", theme.custom.background);
  dom.html.style.setProperty("--surface", theme.custom.cardSurface);
  dom.html.style.setProperty("--accent", theme.custom.accent);

  const pairing = FONT_PAIRINGS.find((item) => item.id === state.fontPairing) || FONT_PAIRINGS[0];
  dom.html.style.setProperty("--heading-font", pairing.headingVar);
  dom.html.style.setProperty("--body-font", pairing.bodyVar);

  if (theme.darkMode === "auto") {
    dom.html.removeAttribute("data-theme-mode");
    dom.themeToggle.textContent = window.matchMedia("(prefers-color-scheme: dark)").matches ? "☀" : "☾";
  } else {
    dom.html.setAttribute("data-theme-mode", theme.darkMode);
    dom.themeToggle.textContent = theme.darkMode === "dark" ? "☀" : "☾";
  }

  dom.body.classList.toggle("hide-favicons", !state.showFavicons);
  dom.body.classList.toggle("hide-domain", !state.showDomain);
  dom.commandInput.closest(".command-row")?.classList.toggle("hidden", !state.ai.commandBarEnabled);
  dom.connectionsStatus.textContent = state.relatedLinesEnabled && state.ai.relatedEnabled ? "On" : "Off";
  updateLayoutMode(dom.app.clientWidth);
}

function applyPreviewAppearance() {
  const previewNodes = document.querySelectorAll(".preview-shell");
  const draftTheme = state.onboardingDraft.theme;
  const pairing = FONT_PAIRINGS.find((item) => item.id === state.onboardingDraft.fontPairing) || FONT_PAIRINGS[0];
  previewNodes.forEach((node) => {
    node.style.setProperty("--bg", draftTheme.custom.background);
    node.style.setProperty("--surface", draftTheme.custom.cardSurface);
    node.style.setProperty("--accent", draftTheme.custom.accent);
    node.style.setProperty("--heading-font", pairing.headingVar);
    node.style.setProperty("--body-font", pairing.bodyVar);
  });
}

function cycleThemeMode() {
  const order = ["auto", "dark", "light"];
  const currentIndex = order.indexOf(state.theme.darkMode);
  state.theme.darkMode = order[(currentIndex + 1) % order.length];
  applyAppearance();
  renderSettingsState();
  scheduleSave();
}

async function consumePendingCommand() {
  try {
    const response = await chrome.runtime.sendMessage({ type: "consume-pending-command" });
    if (response?.command?.type === "import-window-tabs") {
      await importWindowTabsToWorkspace(response.command.windowId);
    }
  } catch (error) {
    console.error("Unable to consume pending command", error);
  }
}

function initResizeObserver() {
  state.resizeObserver = new ResizeObserver((entries) => {
    const width = entries[0]?.contentRect?.width || dom.app.clientWidth;
    updateLayoutMode(width);
  });
  state.resizeObserver.observe(dom.app);
  updateLayoutMode(dom.app.clientWidth);
}

function updateLayoutMode(width) {
  if (state.compactMode || width < 320) {
    state.layoutMode = "compact";
  } else if (width > 480) {
    state.layoutMode = "expanded";
  } else {
    state.layoutMode = "standard";
  }
  dom.html.setAttribute("data-layout", state.layoutMode);
}

async function reconcileWithBrowser({ fullRender = false } = {}) {
  let tabs = [];
  try {
    tabs = await chrome.tabs.query({});
  } catch (error) {
    console.error("Unable to query tabs", error);
    return;
  }

  const previousTabs = new Map(state.tabsById);
  const previousTabIds = new Set(previousTabs.keys());
  state.tabsById = new Map();
  state.orderedTabIds = [];

  const now = Date.now();
  tabs
    .filter((tab) => Number.isInteger(tab.id))
    .sort((left, right) => {
      if (left.windowId !== right.windowId) {
        return left.windowId - right.windowId;
      }
      return left.index - right.index;
    })
    .forEach((tab) => {
      state.tabsById.set(tab.id, tab);
      state.orderedTabIds.push(tab.id);
      if (!state.liveTabMeta[tab.id]) {
        state.liveTabMeta[tab.id] = {
          openedAt: now,
          lastTouchedAt: tab.active ? now : now,
          lastSummaryAttemptAt: 0,
          summaryRequested: false
        };
      } else if (tab.active) {
        state.liveTabMeta[tab.id].lastTouchedAt = now;
      }
      ensureTabHistoryEntry(tab, state.liveTabMeta[tab.id].openedAt || now);
      syncOpenTabHistory(tab, { touchedAt: tab.active ? now : null });
      updateUrlInsight(tab, tab.active ? now : null);
    });

  previousTabIds.forEach((tabId) => {
    if (!state.tabsById.has(tabId)) {
      closeTabHistory(tabId, now);
      delete state.liveTabMeta[tabId];
    }
  });

  const changedWorkspaces = reconcileWorkspaceMembership();
  updateHistoryFolderAssignments();
  updateDuplicateState();
  cleanupSelection();

  if (fullRender) {
    renderFullPanel();
    scheduleSave();
    return;
  }

  const changedIds = computeChangedTabs(previousTabs, state.tabsById);
  changedWorkspaces.forEach((workspaceId) => {
    if (workspaceId === "unassigned") {
      renderUnassignedSection();
      return;
    }
    const workspace = getWorkspace(workspaceId);
    if (workspace) {
      renderWorkspaceSection(workspace);
    }
  });

  changedIds.forEach((tabId) => updateCardDom(tabId));
  renderSavedSessions();
  renderDuplicateBanner();
  renderBulkBar();
  renderSettingsWorkspaces();
  updateEmptyState();
  renderTutorial();
  runtimeFns.renderConnections();
  maybeSuggestFolderCluster();
  scheduleSave();
  void checkAutoSummaryCandidates();
}

function reconcileWorkspaceMembership() {
  const liveIds = new Set(state.tabsById.keys());
  const assignedIds = new Set();
  const changed = new Set(["unassigned"]);

  state.workspaces.forEach((workspace) => {
    const before = workspace.tabIds.join(",");
    const nextIds = [];

    workspace.tabIds.forEach((tabId) => {
      if (liveIds.has(tabId) && !assignedIds.has(tabId)) {
        nextIds.push(tabId);
        assignedIds.add(tabId);
      }
    });

    if (nextIds.length < workspace.tabUrlSnapshots.length) {
      workspace.tabUrlSnapshots.forEach((url) => {
        const match = state.orderedTabIds
          .map((tabId) => state.tabsById.get(tabId))
          .find((tab) => tab?.url === url && !assignedIds.has(tab.id));
        if (match && !nextIds.includes(match.id)) {
          nextIds.push(match.id);
          assignedIds.add(match.id);
        }
      });
    }

    workspace.tabIds = dedupe(nextIds);
    workspace.tabUrlSnapshots = workspace.tabIds.map((tabId) => state.tabsById.get(tabId)?.url).filter(Boolean);
    if (workspace.tabIds.join(",") !== before) {
      changed.add(workspace.id);
    }
  });

  return changed;
}

function computeChangedTabs(previousTabs, nextTabs) {
  const changed = new Set();
  previousTabs.forEach((tab, tabId) => {
    const next = nextTabs.get(tabId);
    if (!next) {
      changed.add(tabId);
      return;
    }
    if (
      next.title !== tab.title ||
      next.url !== tab.url ||
      next.favIconUrl !== tab.favIconUrl ||
      next.active !== tab.active
    ) {
      changed.add(tabId);
    }
  });
  nextTabs.forEach((tab, tabId) => {
    if (!previousTabs.has(tabId)) {
      changed.add(tabId);
    }
  });
  return [...changed];
}

function updateDuplicateState() {
  const counts = new Map();
  state.tabsById.forEach((tab) => {
    if (!tab.url) {
      return;
    }
    counts.set(tab.url, (counts.get(tab.url) || 0) + 1);
  });
  state.duplicateUrls = new Set([...counts.entries()].filter(([, count]) => count > 1).map(([url]) => url));
  state.duplicateCount = [...counts.values()].filter((count) => count > 1).reduce((sum, count) => sum + count, 0);
}

function renderFullPanel() {
  state.cardElements.clear();
  state.drawerElements.clear();
  dom.workspaceList.replaceChildren();
  dom.unassignedSection.replaceChildren();
  dom.savedSessionsSection.replaceChildren();
  state.workspaces.forEach((workspace) => renderWorkspaceSection(workspace));
  renderUnassignedSection();
  renderSavedSessions();
  renderDuplicateBanner();
  renderBulkBar();
  renderSettingsWorkspaces();
  syncExternalDropWorkspaceSelect();
  updateEmptyState();
  renderTutorial();
  renderCommandPreview();
  applySearch();
  maybeSuggestFolderCluster();
  dom.deskScroll.scrollTop = 0;
}

function renderWorkspaceSection(workspace) {
  clearCardMappingsForWorkspace(workspace.id);
  const section = buildDrawer({
    id: workspace.id,
    name: workspace.name,
    color: workspace.color,
    caption: `${workspace.tabIds.length} tab${workspace.tabIds.length === 1 ? "" : "s"}`,
    tabIds: workspace.tabIds,
    collapsed: workspace.collapsed,
    resultsCount: getVisibleTabIds(workspace.tabIds).length
  });
  const previous = state.drawerElements.get(workspace.id);
  if (previous) {
    previous.replaceWith(section);
  } else {
    dom.workspaceList.appendChild(section);
  }
  state.drawerElements.set(workspace.id, section);
}

function renderUnassignedSection() {
  clearCardMappingsForWorkspace("unassigned");
  const tabIds = getUnassignedTabIds();
  const section = buildDrawer({
    id: "unassigned",
    name: "Unassigned",
    color: "slate",
    caption: `${tabIds.length} loose tab${tabIds.length === 1 ? "" : "s"}`,
    tabIds,
    collapsed: false,
    isUnassigned: true
  });
  dom.unassignedSection.replaceChildren(section);
  state.drawerElements.set("unassigned", section);
}

function renderSavedSessions() {
  const drawer = document.createElement("section");
  drawer.className = "drawer";
  drawer.style.setProperty("--workspace-color", "var(--slate)");
  drawer.innerHTML = `
    <div class="drawer-header">
      <div class="drawer-meta">
        <div class="drawer-title-row">
          <h2 class="drawer-title">Saved Sessions</h2>
          <span class="drawer-badge">${state.savedSessions.length}</span>
        </div>
        <div class="drawer-caption">Snapshots you can reopen anytime.</div>
      </div>
    </div>
    <div class="drawer-body">
      <div class="drawer-section saved-session-list"></div>
    </div>
  `;

  const list = drawer.querySelector(".saved-session-list");
  if (!state.savedSessions.length) {
    list.appendChild(createDropzoneEmpty("Saved folders appear here."));
  } else {
    state.savedSessions
      .slice()
      .sort((left, right) => right.savedAt - left.savedAt)
      .forEach((session) => {
        const row = document.createElement("article");
        row.className = "saved-session";
        row.innerHTML = `
          <button class="saved-session-open" type="button">
            <div class="saved-session-name">${escapeHtml(session.name)}</div>
            <div class="saved-session-meta">${formatDate(session.savedAt)} · ${session.urls.length} tab${session.urls.length === 1 ? "" : "s"}</div>
          </button>
          <button class="session-delete" type="button" aria-label="Delete saved session">×</button>
        `;
        row.querySelector(".saved-session-open").addEventListener("click", () => restoreSavedSession(session.id));
        row.querySelector(".session-delete").addEventListener("click", () => {
          state.savedSessions = state.savedSessions.filter((item) => item.id !== session.id);
          scheduleSave();
          renderSavedSessions();
        });
        list.appendChild(row);
      });
  }

  dom.savedSessionsSection.replaceChildren(drawer);
}

function buildDrawer({ id, name, color, caption, tabIds, collapsed, isUnassigned = false, resultsCount = null }) {
  const drawer = document.createElement("section");
  drawer.className = `drawer${collapsed ? " collapsed" : ""}`;
  drawer.dataset.workspaceId = id;
  drawer.style.setProperty("--workspace-color", getWorkspaceColorValue(color));

  const header = document.createElement("div");
  header.className = "drawer-header";

  const meta = document.createElement("div");
  meta.className = "drawer-meta";
  const titleRow = document.createElement("div");
  titleRow.className = "drawer-title-row";

  if (state.editingWorkspaceId === id) {
    const input = document.createElement("input");
    input.className = "workspace-name-input";
    input.value = name;
    input.maxLength = 32;
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        commitWorkspaceRename(id, input.value);
      }
      if (event.key === "Escape") {
        state.editingWorkspaceId = null;
        renderWorkspaceSection(getWorkspace(id));
      }
    });
    input.addEventListener("blur", () => commitWorkspaceRename(id, input.value));
    titleRow.appendChild(input);
    queueMicrotask(() => {
      input.focus();
      input.select();
    });
  } else {
    const title = document.createElement("h2");
    title.className = "drawer-title";
    title.textContent = name;
    title.title = name;
    titleRow.appendChild(title);
    if (!isUnassigned) {
      title.addEventListener("dblclick", () => {
        state.editingWorkspaceId = id;
        renderWorkspaceSection(getWorkspace(id));
      });
    }
  }

  const badge = document.createElement("span");
  badge.className = "drawer-badge";
  badge.textContent = String(tabIds.length);
  titleRow.appendChild(badge);

  if (state.searchQuery && resultsCount !== null) {
    const results = document.createElement("span");
    results.className = `drawer-results-badge${resultsCount === 0 ? " zero-results" : ""}`;
    results.textContent = `${resultsCount} results`;
    titleRow.appendChild(results);
  }

  const captionNode = document.createElement("div");
  captionNode.className = "drawer-caption";
  captionNode.textContent = caption;
  const dropLabel = document.createElement("div");
  dropLabel.className = "drawer-drop-label";
  dropLabel.textContent = "Drop here";

  const preview = document.createElement("div");
  preview.className = "drawer-preview";
  tabIds.slice(0, 5).forEach((tabId) => {
    const tab = state.tabsById.get(tabId);
    if (!tab) {
      return;
    }
    const img = document.createElement("img");
    img.src = getFaviconUrl(tab);
    img.alt = "";
    preview.appendChild(img);
  });

  meta.append(titleRow, captionNode, preview, dropLabel);

  const actions = document.createElement("div");
  actions.className = "drawer-actions";

  if (isUnassigned) {
    actions.appendChild(createIconAction("↳", "Group by domain", () => groupUnassignedByDomain()));
  } else {
    actions.appendChild(createHeaderAction("Paste URL", "Paste a URL into this folder", () => togglePasteUrlForm(id)));
    actions.appendChild(createIconAction("↕", "Reorder folder", () => {}));
    actions.appendChild(createIconAction("↗", "Open in window", () => sendWorkspaceToWindow(id)));
    actions.appendChild(createIconAction("💾", "Save session", () => saveWorkspaceSession(id)));
    actions.appendChild(createIconAction("🗑", "Delete folder", () => toggleDeleteBar(id)));
    actions.appendChild(createIconAction(collapsed ? "▸" : "▾", collapsed ? "Expand folder" : "Collapse folder", () => toggleWorkspaceCollapsed(id, false)));
  }

  header.append(meta, actions);
  drawer.appendChild(header);

  const deleteBar = document.createElement("div");
  deleteBar.className = `drawer-delete-bar${state.pendingDeleteWorkspaceId === id ? "" : " hidden"}`;
  deleteBar.innerHTML = `
    <span>Delete this folder? Tabs will move to Unassigned.</span>
    <div class="form-actions">
      <button type="button" class="delete-cancel">Cancel</button>
      <button type="button" class="delete-confirm primary-button">Delete</button>
    </div>
  `;
  if (!isUnassigned) {
    deleteBar.querySelector(".delete-cancel").addEventListener("click", () => {
      state.pendingDeleteWorkspaceId = null;
      renderWorkspaceSection(getWorkspace(id));
    });
    deleteBar.querySelector(".delete-confirm").addEventListener("click", () => deleteWorkspace(id));
  }
  drawer.appendChild(deleteBar);

  const body = document.createElement("div");
  body.className = "drawer-body";
  if (!isUnassigned && state.openPasteFolderId === id) {
    body.appendChild(buildPasteUrlForm(id));
  }
  const cards = document.createElement("div");
  cards.className = "drawer-cards";
  cards.dataset.workspaceId = id;
  bindDropTargets(drawer, header, cards, id, collapsed);

  if (!tabIds.length) {
    cards.appendChild(createDropzoneEmpty(isUnassigned ? "Drop tabs here to keep them loose." : "Drop tabs here."));
  } else {
    tabIds.forEach((tabId) => {
      const card = createTabCard(tabId, id, color);
      cards.appendChild(card);
    });
  }

  body.appendChild(cards);
  drawer.appendChild(body);
  return drawer;
}

function createIconAction(label, title, onClick) {
  const button = document.createElement("button");
  button.className = "workspace-icon-button";
  button.type = "button";
  button.textContent = label;
  button.title = title;
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    onClick();
  });
  return button;
}

function createHeaderAction(label, title, onClick) {
  const button = document.createElement("button");
  button.className = "drawer-paste-button";
  button.type = "button";
  button.textContent = label;
  button.title = title;
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    onClick();
  });
  return button;
}

function buildPasteUrlForm(folderId) {
  const form = document.createElement("form");
  form.className = "drawer-paste-form";
  form.innerHTML = `
    <input type="text" name="folderUrl" placeholder="Paste a URL into this folder" autocomplete="off" spellcheck="false" />
    <button type="submit" class="primary-button">Add Tab</button>
    <button type="button" class="drawer-paste-button">Cancel</button>
  `;
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const input = form.elements.folderUrl;
    await addUrlToFolder(input.value, folderId);
  });
  form.querySelector('[type="button"]').addEventListener("click", () => {
    state.openPasteFolderId = null;
    renderWorkspaceSection(getWorkspace(folderId));
  });
  queueMicrotask(() => form.elements.folderUrl?.focus());
  return form;
}

function createDropzoneEmpty(message) {
  const node = document.createElement("div");
  node.className = "drawer-dropzone";
  node.textContent = message;
  return node;
}

function togglePasteUrlForm(folderId) {
  state.openPasteFolderId = state.openPasteFolderId === folderId ? null : folderId;
  renderWorkspaceSection(getWorkspace(folderId));
}

function normalizePastedUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) {
    return "";
  }
  try {
    return new URL(raw).toString();
  } catch (error) {
    try {
      return new URL(`https://${raw}`).toString();
    } catch (nestedError) {
      return "";
    }
  }
}

async function addUrlToFolder(rawUrl, folderId) {
  const folder = getWorkspace(folderId);
  if (!folder) {
    return;
  }
  const normalizedUrl = normalizePastedUrl(rawUrl);
  if (!normalizedUrl) {
    showToast("That doesn't look like a valid URL.");
    return;
  }
  if (!extensionApisAvailable || !chrome.tabs?.create) {
    showToast("Open Tabula in Chrome to add tabs from pasted URLs.");
    return;
  }

  try {
    const created = await chrome.tabs.create({ url: normalizedUrl, active: false });
    if (Number.isInteger(created?.id)) {
      state.tabsById.set(created.id, created);
      state.orderedTabIds = dedupe([...state.orderedTabIds, created.id]);
      state.liveTabMeta[created.id] = {
        openedAt: Date.now(),
        lastTouchedAt: created.active ? Date.now() : 0
      };
      syncOpenTabHistory(created, { touchedAt: created.active ? Date.now() : null });
      updateDuplicateState();
      renderFullPanel();
      moveTabIdsToWorkspace([created.id], folderId);
    }
    state.openPasteFolderId = null;
    renderWorkspaceSection(folder);
    showToast(`Added URL to ${folder.name}`, { color: folder.color, duration: 1400 });
  } catch (error) {
    console.error("Unable to add pasted URL to folder", error);
    showToast("That URL couldn't be added right now.");
  }
}

function createTabCard(tabId, workspaceId, workspaceColor) {
  const tab = state.tabsById.get(tabId);
  const info = getTabDisplayInfo(tab);
  const note = getDisplayNoteForTab(tab);
  const card = dom.cardTemplate.content.firstElementChild.cloneNode(true);
  card.dataset.tabId = String(tabId);
  card.dataset.workspaceId = workspaceId;
  card.style.setProperty("--workspace-color", getWorkspaceColorValue(workspaceColor || "slate"));
  card.classList.toggle("active-tab", Boolean(tab?.active));
  card.classList.toggle("selected", state.selectedTabIds.has(tabId));

  const favicon = card.querySelector(".card-favicon");
  const title = card.querySelector(".card-title");
  const domain = card.querySelector(".card-domain");
  const assignFolderButton = card.querySelector(".assign-folder-button");
  const assignFolderPopover = card.querySelector(".assign-folder-popover");
  const tagButton = card.querySelector(".tag-button");
  const noteToggle = card.querySelector(".note-toggle");
  const notePanel = card.querySelector(".note-panel");
  const noteInput = card.querySelector(".note-input");
  const noteCount = card.querySelector(".note-count");
  const inlineNotePreview = card.querySelector(".card-inline-note-preview");
  const duplicateBadge = card.querySelector(".duplicate-badge");
  const suggestionRow = card.querySelector(".suggestion-row");
  const suggestionChip = card.querySelector(".suggestion-chip");
  const suggestionDismiss = card.querySelector(".suggestion-dismiss");
  const summaryAction = card.querySelector(".summary-action");
  const noteSourceLabel = card.querySelector(".note-source-label");
  const relatedTabs = card.querySelector(".related-tabs");
  const relatedTabsList = card.querySelector(".related-tabs-list");

  favicon.src = getFaviconUrl(tab);
  favicon.classList.toggle("hidden", !state.showFavicons);
  favicon.addEventListener("error", () => {
    favicon.src = createFallbackFavicon(info.title.charAt(0) || "T");
  });

  title.textContent = state.layoutMode === "expanded" ? info.title : truncate(info.title, 50);
  title.title = info.title;
  domain.textContent = info.domain;
  domain.title = info.domain;
  domain.classList.toggle("hidden", !state.showDomain || state.layoutMode === "compact");
  inlineNotePreview.textContent = state.layoutMode === "expanded" && note ? truncate(note, 90) : "";

  assignFolderButton.classList.toggle("hidden", workspaceId !== "unassigned");
  if (workspaceId === "unassigned") {
    assignFolderButton.addEventListener("click", (event) => {
      event.stopPropagation();
      state.openAssignFolderTabId = state.openAssignFolderTabId === tabId ? null : tabId;
      refreshCardAccessory(tabId);
    });
  }

  tagButton.style.setProperty("--tag-color", getWorkspaceColorValue(state.tagColors[String(tabId)]));
  tagButton.addEventListener("click", (event) => {
    event.stopPropagation();
    state.openTagChooserTabId = state.openTagChooserTabId === tabId ? null : tabId;
    refreshCardAccessory(tabId);
  });

  noteToggle.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleNotePanel(tabId, true);
  });

  noteInput.value = note;
  noteCount.textContent = `${note.length} / 280`;
  const hasAutoSummary = Boolean(tab?.url && state.autoSummaries[tab.url]?.text && !state.notes[tab.url]);
  card.classList.toggle("has-auto-note", hasAutoSummary);
  noteSourceLabel.classList.toggle("hidden", !hasAutoSummary);
  noteSourceLabel.classList.toggle("visible", hasAutoSummary);
  summaryAction.addEventListener("click", async (event) => {
    event.stopPropagation();
    await fillNoteWithGeneratedSummary(tabId);
  });
  noteInput.addEventListener("input", () => {
    if (!tab?.url) {
      return;
    }
    state.notes[tab.url] = noteInput.value.slice(0, 280);
    updateUrlInsight(tab, Date.now());
    noteCount.textContent = `${state.notes[tab.url].length} / 280`;
    inlineNotePreview.textContent = state.layoutMode === "expanded" ? truncate(state.notes[tab.url], 90) : "";
    scheduleSave();
    applySearch();
  });
  noteInput.addEventListener("click", (event) => event.stopPropagation());

  if (state.openNoteTabs.has(tabId) || state.layoutMode === "expanded") {
    notePanel.classList.toggle("hidden", state.layoutMode !== "expanded" && !state.openNoteTabs.has(tabId));
  }

  renderSuggestionChip(tabId, suggestionRow, suggestionChip, suggestionDismiss);
  renderRelatedTabs(tabId, relatedTabs, relatedTabsList);

  if (state.openTagChooserTabId === tabId) {
    const popover = card.querySelector(".tag-popover");
    popover.classList.remove("hidden");
    renderTagPopover(popover, tabId);
  }
  if (workspaceId === "unassigned" && state.openAssignFolderTabId === tabId) {
    assignFolderPopover.classList.remove("hidden");
    renderAssignFolderPopover(assignFolderPopover, tabId);
  }

  const duplicateCount = getDuplicateCount(tab);
  if (duplicateCount > 1) {
    duplicateBadge.classList.remove("hidden");
    duplicateBadge.textContent = `${duplicateCount} open`;
  }

  card.addEventListener("click", (event) => handleCardClick(event, tabId));
  card.addEventListener("focus", () => {
    state.focusedTabId = tabId;
  });
  card.addEventListener("contextmenu", (event) => {
    event.preventDefault();
    openContextMenu(tabId, event.currentTarget.getBoundingClientRect(), event.clientX, event.clientY);
  });
  card.addEventListener("dragstart", (event) => {
    state.dragState = {
      tabIds: getDraggedTabIds(tabId),
      sourceWorkspaceId: workspaceId
    };
    card.classList.add("dragging");
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(tabId));
  });
  card.addEventListener("dragend", () => {
    state.dragState = null;
    card.classList.remove("dragging");
    enableGlobalDropAffordances(false);
    clearDropState();
  });
  card.addEventListener("dragover", (event) => {
    event.preventDefault();
    card.classList.add("drop-target");
  });
  card.addEventListener("dragleave", () => {
    card.classList.remove("drop-target");
  });
  card.addEventListener("drop", async (event) => {
    event.preventDefault();
    card.classList.remove("drop-target");
    await handleDropOnWorkspace(event, workspaceId === "unassigned" ? null : workspaceId, tabId);
  });

  state.cardElements.set(tabId, card);
  return card;
}

function refreshCardAccessory(tabId) {
  const card = state.cardElements.get(tabId);
  if (!card) {
    return;
  }
  const notePanel = card.querySelector(".note-panel");
  notePanel.classList.toggle("hidden", state.layoutMode !== "expanded" && !state.openNoteTabs.has(tabId));
  const assignPopover = card.querySelector(".assign-folder-popover");
  if (state.openAssignFolderTabId === tabId) {
    assignPopover.classList.remove("hidden");
    renderAssignFolderPopover(assignPopover, tabId);
  } else {
    assignPopover.classList.add("hidden");
    assignPopover.replaceChildren();
  }
  const popover = card.querySelector(".tag-popover");
  if (state.openTagChooserTabId === tabId) {
    popover.classList.remove("hidden");
    renderTagPopover(popover, tabId);
  } else {
    popover.classList.add("hidden");
    popover.replaceChildren();
  }
}

function renderAssignFolderPopover(container, tabId) {
  container.replaceChildren();
  if (!state.workspaces.length) {
    const empty = document.createElement("div");
    empty.className = "assign-folder-empty";
    empty.textContent = "Create a folder first.";
    container.appendChild(empty);
    return;
  }
  state.workspaces.forEach((workspace) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = workspace.name;
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      state.openAssignFolderTabId = null;
      moveTabIdsToWorkspace([tabId], workspace.id);
      showToast(`Added to ${workspace.name}`, { color: workspace.color, duration: 1200 });
    });
    container.appendChild(button);
  });
}

function renderTagPopover(container, tabId) {
  container.replaceChildren();
  const none = document.createElement("button");
  none.className = "tag-swatch none";
  none.type = "button";
  none.title = "Clear tag";
  none.addEventListener("click", (event) => {
    event.stopPropagation();
    delete state.tagColors[String(tabId)];
    state.openTagChooserTabId = null;
    updateCardDom(tabId);
    refreshCardAccessory(tabId);
    scheduleSave();
  });
  container.appendChild(none);

  COLOR_OPTIONS.forEach((color) => {
    const button = document.createElement("button");
    button.className = "tag-swatch";
    button.type = "button";
    button.style.background = color.value;
    button.title = color.label;
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      state.tagColors[String(tabId)] = color.id;
      state.openTagChooserTabId = null;
      updateCardDom(tabId);
      refreshCardAccessory(tabId);
      scheduleSave();
    });
    container.appendChild(button);
  });
}

function updateCardDom(tabId) {
  const card = state.cardElements.get(tabId);
  if (!card) {
    return;
  }

  const tab = state.tabsById.get(tabId);
  if (!tab) {
    card.remove();
    state.cardElements.delete(tabId);
    return;
  }

  const info = getTabDisplayInfo(tab);
  const note = getDisplayNoteForTab(tab);
  card.classList.toggle("active-tab", Boolean(tab.active));
  card.classList.toggle("selected", state.selectedTabIds.has(tabId));
  card.querySelector(".card-title").textContent = state.layoutMode === "expanded" ? info.title : truncate(info.title, 50);
  card.querySelector(".card-title").title = info.title;
  card.querySelector(".card-domain").textContent = info.domain;
  card.querySelector(".card-domain").classList.toggle("hidden", !state.showDomain || state.layoutMode === "compact");
  const favicon = card.querySelector(".card-favicon");
  favicon.src = getFaviconUrl(tab);
  favicon.classList.toggle("hidden", !state.showFavicons);
  card.querySelector(".tag-button").style.setProperty("--tag-color", getWorkspaceColorValue(state.tagColors[String(tabId)]));
  card.querySelector(".note-input").value = note;
  card.querySelector(".note-count").textContent = `${note.length} / 280`;
  card.querySelector(".card-inline-note-preview").textContent = state.layoutMode === "expanded" && note ? truncate(note, 90) : "";
  const hasAutoSummary = Boolean(tab.url && state.autoSummaries[tab.url]?.text && !state.notes[tab.url]);
  card.classList.toggle("has-auto-note", hasAutoSummary);
  card.querySelector(".note-source-label").classList.toggle("hidden", !hasAutoSummary);
  card.querySelector(".note-source-label").classList.toggle("visible", hasAutoSummary);
  renderSuggestionChip(
    tabId,
    card.querySelector(".suggestion-row"),
    card.querySelector(".suggestion-chip"),
    card.querySelector(".suggestion-dismiss")
  );
  renderRelatedTabs(tabId, card.querySelector(".related-tabs"), card.querySelector(".related-tabs-list"));

  const duplicateBadge = card.querySelector(".duplicate-badge");
  const duplicateCount = getDuplicateCount(tab);
  duplicateBadge.classList.toggle("hidden", duplicateCount <= 1);
  duplicateBadge.textContent = duplicateCount > 1 ? `${duplicateCount} open` : "";
}

function handleSearchInput(event) {
  state.searchQuery = event.target.value.trim().toLowerCase();
  dom.searchClear.classList.toggle("hidden", !state.searchQuery);
  applySearch();
}

function clearSearch() {
  state.searchQuery = "";
  dom.searchInput.value = "";
  dom.searchClear.classList.add("hidden");
  state.activeFilterLabel = "";
  applySearch();
}

function getSearchScore(tabId) {
  if (!state.searchQuery) {
    return 0;
  }
  const tab = state.tabsById.get(tabId);
  if (!tab) {
    return 0;
  }
  const info = getTabDisplayInfo(tab);
  const folder = getWorkspaceForTab(tabId);
  const note = getDisplayNoteForTab(tab).toLowerCase();
  const title = info.title.toLowerCase();
  const domain = info.domain.toLowerCase();
  const folderName = (folder?.name || "unassigned").toLowerCase();
  const query = state.searchQuery;
  const tokens = query.split(/\s+/g).filter(Boolean);
  const queryTokens = tokenize(query);
  const semanticTokens = tokenize(`${info.title} ${info.domain} ${folderName} ${note}`);
  let score = 0;

  score += similarityScore(queryTokens, semanticTokens) * 18;

  if (title.includes(query)) {
    score += 10;
  }
  if (domain.includes(query)) {
    score += 8;
  }
  if (note.includes(query)) {
    score += 7;
  }
  if (folderName.includes(query)) {
    score += 5;
  }

  tokens.forEach((token) => {
    if (title.includes(token)) {
      score += 3;
    }
    if (domain.includes(token)) {
      score += 2;
    }
    if (note.includes(token)) {
      score += 2;
    }
    if (folderName.includes(token)) {
      score += 1;
    }
  });

  return Number(score.toFixed(3));
}

function sortTabIdsForDisplay(tabIds) {
  if (!state.searchQuery) {
    return [...tabIds];
  }
  return [...tabIds].sort((left, right) => {
    const scoreDiff = getSearchScore(right) - getSearchScore(left);
    if (scoreDiff !== 0) {
      return scoreDiff;
    }
    return state.orderedTabIds.indexOf(left) - state.orderedTabIds.indexOf(right);
  });
}

function reorderDrawerCards(workspaceId, tabIds) {
  const drawer = state.drawerElements.get(workspaceId);
  const cardsContainer = drawer?.querySelector(".drawer-cards");
  if (!cardsContainer) {
    return;
  }
  const ordered = sortTabIdsForDisplay(tabIds);
  ordered.forEach((tabId) => {
    const card = state.cardElements.get(tabId);
    if (card) {
      cardsContainer.appendChild(card);
    }
  });
}

function applySearch() {
  state.cardElements.forEach((card, tabId) => {
    const matches = matchesSearch(tabId);
    card.classList.toggle("hidden", !matches);
  });

  state.workspaces.forEach((workspace) => {
    const drawer = state.drawerElements.get(workspace.id);
    if (!drawer) {
      return;
    }
    const visibleCount = workspace.tabIds.filter((tabId) => {
      const card = state.cardElements.get(tabId);
      return card && !card.classList.contains("hidden");
    }).length;
    drawer.classList.toggle("collapsed", state.searchQuery ? visibleCount === 0 : workspace.collapsed);
    const resultsBadge = drawer.querySelector(".drawer-results-badge");
    if (resultsBadge) {
      resultsBadge.textContent = `${visibleCount} results`;
      resultsBadge.classList.toggle("zero-results", visibleCount === 0);
    }
    reorderDrawerCards(workspace.id, workspace.tabIds);
  });

  if (state.searchQuery) {
    const rankedSections = state.workspaces
      .map((workspace) => ({
        workspace,
        score: Math.max(0, ...workspace.tabIds.map((tabId) => getSearchScore(tabId))),
        visibleCount: workspace.tabIds.filter(matchesSearch).length
      }))
      .sort((left, right) => {
        if (right.score !== left.score) {
          return right.score - left.score;
        }
        if (right.visibleCount !== left.visibleCount) {
          return right.visibleCount - left.visibleCount;
        }
        return 0;
      });

    rankedSections.forEach(({ workspace }) => {
      const section = state.drawerElements.get(workspace.id);
      if (section) {
        dom.workspaceList.appendChild(section);
      }
    });
  } else {
    state.workspaces.forEach((workspace) => {
      const section = state.drawerElements.get(workspace.id);
      if (section) {
        dom.workspaceList.appendChild(section);
      }
    });
  }

  const unassignedDrawer = state.drawerElements.get("unassigned");
  if (unassignedDrawer) {
    const count = getUnassignedTabIds().filter(matchesSearch).length;
    const badge = unassignedDrawer.querySelector(".drawer-results-badge");
    if (badge) {
      badge.textContent = `${count} results`;
      badge.classList.toggle("zero-results", count === 0);
    }
    reorderDrawerCards("unassigned", getUnassignedTabIds());
  }

  renderDuplicateBanner();
  renderBulkBar();
  updateEmptyState();
  renderCommandPreview();
  runtimeFns.renderConnections();
}

function matchesSearch(tabId) {
  const tab = state.tabsById.get(tabId);
  const info = getTabDisplayInfo(tab);
  const workspace = getWorkspaceForTab(tabId);
  const note = getDisplayNoteForTab(tab);
  const haystack = [info.title, info.domain, workspace?.name || "Unassigned", note].join(" ").toLowerCase();

  const matchesText = !state.searchQuery || getSearchScore(tabId) > 0;
  if (!matchesText) {
    return false;
  }

  if (state.commandPreview?.filter?.type === "stale") {
    const touchedAt = getLastTouchedForTab(tabId);
    return touchedAt ? touchedAt <= Date.now() - state.commandPreview.filter.ms : false;
  }

  if (state.commandPreview?.filter?.type === "semantic" || state.commandPreview?.filter?.type === "tab-ids") {
    return state.commandPreview.filter.tabIds.includes(tabId);
  }

  if (state.commandPreview?.filter?.type === "history-urls") {
    return state.commandPreview.filter.urls.includes(state.tabsById.get(tabId)?.url);
  }

  return true;
}

function renderDuplicateBanner() {
  const show = state.duplicateCount > 1 && !state.dismissedDuplicateBanner;
  dom.duplicateBanner.classList.toggle("hidden", !show);
  dom.duplicateBannerText.textContent = `You have ${state.duplicateCount} duplicate tabs.`;
}

function reviewDuplicates() {
  const cards = [...state.cardElements.entries()]
    .filter(([tabId]) => {
      const tab = state.tabsById.get(tabId);
      return tab?.url && state.duplicateUrls.has(tab.url);
    })
    .map(([, card]) => card);

  cards.forEach((card) => {
    card.classList.add("review-highlight");
    setTimeout(() => card.classList.remove("review-highlight"), 1000);
  });
  cards[0]?.scrollIntoView({ behavior: "smooth", block: "center" });
}

function handleCardClick(event, tabId) {
  if (event.target.closest(".note-panel") || event.target.closest(".tag-popover") || event.target.closest(".tag-button") || event.target.closest(".note-toggle")) {
    return;
  }

  if (event.metaKey || event.ctrlKey) {
    toggleSelectedTab(tabId);
    return;
  }

  if (event.shiftKey) {
    rangeSelect(tabId);
    return;
  }

  clearSelection(false);
  state.focusedTabId = tabId;
  switchToTab(tabId);
}

function toggleSelectedTab(tabId) {
  if (state.selectedTabIds.has(tabId)) {
    state.selectedTabIds.delete(tabId);
  } else {
    state.selectedTabIds.add(tabId);
  }
  state.lastSelectedTabId = tabId;
  updateCardDom(tabId);
  renderBulkBar();
}

function rangeSelect(tabId) {
  const visible = getVisibleTabOrder();
  const anchor = state.lastSelectedTabId ?? visible[0];
  const start = visible.indexOf(anchor);
  const end = visible.indexOf(tabId);
  if (start === -1 || end === -1) {
    toggleSelectedTab(tabId);
    return;
  }
  const [from, to] = start < end ? [start, end] : [end, start];
  for (let index = from; index <= to; index += 1) {
    state.selectedTabIds.add(visible[index]);
    updateCardDom(visible[index]);
  }
  renderBulkBar();
}

function clearSelection(update) {
  const selected = [...state.selectedTabIds];
  state.selectedTabIds.clear();
  if (update) {
    selected.forEach(updateCardDom);
    renderBulkBar();
  }
}

function cleanupSelection() {
  [...state.selectedTabIds].forEach((tabId) => {
    if (!state.tabsById.has(tabId)) {
      state.selectedTabIds.delete(tabId);
    }
  });
}

function renderBulkBar() {
  const count = state.selectedTabIds.size;
  dom.bulkBar.classList.toggle("hidden", count < 2);
  dom.bulkCount.textContent = `${count} tabs selected`;
  dom.bulkMoveMenu.classList.toggle("hidden", !state.bulkMoveMenuOpen);
  dom.bulkMoveMenu.replaceChildren();
  state.workspaces.forEach((workspace) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = workspace.name;
    button.addEventListener("click", () => {
      moveTabIdsToWorkspace([...state.selectedTabIds], workspace.id);
      state.bulkMoveMenuOpen = false;
      renderBulkBar();
    });
    dom.bulkMoveMenu.appendChild(button);
  });
}

function openHeaderMenu() {
  state.headerMenuOpen = true;
  const menu = document.createElement("div");
  menu.className = "menu-panel";
  menu.id = "header-menu-portal";

  const items = [
    { label: "Settings", action: () => openSettings() },
    { label: "Export Folders", action: () => exportState() },
    { label: "Import Folders", action: () => dom.importFileInput.click() },
    { label: "Reset All Data", action: () => confirmResetFromMenu(menu) }
  ];

  items.forEach((item) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = item.label;
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      item.action();
    });
    menu.appendChild(button);
  });

  dom.menuPortalRoot.replaceChildren(menu);
  positionPortalMenu(menu, dom.headerMenuButton.getBoundingClientRect());
  dom.searchRegion.classList.add("pointer-blocked");
  dom.duplicateBannerRegion.classList.add("pointer-blocked");
}

function confirmResetFromMenu(menu) {
  menu.replaceChildren();
  const body = document.createElement("div");
  body.className = "dropdown-panel";
  body.innerHTML = `
    <div style="padding:0.5rem 0.75rem;color:var(--muted);font-size:0.85rem;">Reset all Tabula data?</div>
    <button type="button" data-role="cancel">Cancel</button>
    <button type="button" data-role="reset">Reset</button>
  `;
  body.querySelector('[data-role="cancel"]').addEventListener("click", closeHeaderMenu);
  body.querySelector('[data-role="reset"]').addEventListener("click", async () => {
    await resetAllData();
    closeHeaderMenu();
  });
  menu.appendChild(body);
}

function closeHeaderMenu() {
  state.headerMenuOpen = false;
  dom.menuPortalRoot.replaceChildren();
  dom.searchRegion.classList.remove("pointer-blocked");
  dom.duplicateBannerRegion.classList.remove("pointer-blocked");
}

function positionPortalMenu(menu, buttonRect) {
  const bodyRect = document.body.getBoundingClientRect();
  const menuRect = menu.getBoundingClientRect();
  let left = buttonRect.right - bodyRect.left - Math.max(menuRect.width, 208);
  left = Math.max(12, Math.min(left, bodyRect.width - menuRect.width - 12));

  let top = buttonRect.bottom - bodyRect.top + 8;
  if (top + menuRect.height > bodyRect.height - 12) {
    top = buttonRect.top - bodyRect.top - menuRect.height - 8;
  }
  top = Math.max(12, top);

  menu.style.left = `${left}px`;
  menu.style.top = `${top}px`;
}

function openContextMenu(tabId, rect, x, y) {
  closeContextMenu();
  state.contextMenuState = { tabId, rect, x, y };

  const menu = document.createElement("div");
  menu.className = "menu-panel";
  menu.id = "context-menu-portal";
  const items = [
    { label: "Switch to Tab", action: () => switchToTab(tabId) },
    { label: "Move to Folder", action: () => toggleContextSubmenu(menu, tabId) },
    { label: state.notes[state.tabsById.get(tabId)?.url] ? "Edit Note" : "Add Note", action: () => toggleNotePanel(tabId, true) },
    { label: "Copy URL", action: () => copyTabUrl(tabId) },
    { label: "Close Tab", action: () => closeTabs([tabId]) }
  ];
  items.forEach((item) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = item.label;
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      item.action();
      if (item.label !== "Move to Folder") {
        closeContextMenu();
      }
    });
    menu.appendChild(button);
  });
  dom.menuPortalRoot.replaceChildren(menu);
  positionContextMenu(menu, x, y);
}

function positionContextMenu(menu, x, y) {
  const bodyRect = document.body.getBoundingClientRect();
  const menuRect = menu.getBoundingClientRect();
  const left = Math.max(12, Math.min(x - bodyRect.left, bodyRect.width - menuRect.width - 12));
  let top = y - bodyRect.top;
  if (top + menuRect.height > bodyRect.height - 12) {
    top = bodyRect.height - menuRect.height - 12;
  }
  menu.style.left = `${left}px`;
  menu.style.top = `${Math.max(12, top)}px`;
}

function toggleContextSubmenu(menu, tabId) {
  const existing = menu.querySelector(".menu-subpanel");
  if (existing) {
    existing.remove();
    return;
  }
  const submenu = document.createElement("div");
  submenu.className = "menu-subpanel";
  state.workspaces.forEach((workspace) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = workspace.name;
    button.addEventListener("click", () => {
      moveTabIdsToWorkspace([tabId], workspace.id);
      closeContextMenu();
    });
    submenu.appendChild(button);
  });
  const looseButton = document.createElement("button");
  looseButton.type = "button";
  looseButton.textContent = "Unassigned";
  looseButton.addEventListener("click", () => {
    moveTabIdsToWorkspace([tabId], null);
    closeContextMenu();
  });
  submenu.appendChild(looseButton);
  menu.appendChild(submenu);
}

function closeContextMenu() {
  const menu = document.querySelector("#context-menu-portal");
  if (menu) {
    menu.remove();
  }
  state.contextMenuState = null;
}

function handleDocumentClick(event) {
  if (state.headerMenuOpen && !event.target.closest("#header-menu-portal") && !event.target.closest("#header-menu-button")) {
    closeHeaderMenu();
  }
  if (state.contextMenuState && !event.target.closest("#context-menu-portal")) {
    closeContextMenu();
  }
  if (state.bulkMoveMenuOpen && !event.target.closest(".bulk-menu-wrap")) {
    state.bulkMoveMenuOpen = false;
    renderBulkBar();
  }
  if (state.openTagChooserTabId && !event.target.closest(".tag-popover") && !event.target.closest(".tag-button")) {
    const tabId = state.openTagChooserTabId;
    state.openTagChooserTabId = null;
    refreshCardAccessory(tabId);
  }
  if (state.openAssignFolderTabId && !event.target.closest(".assign-folder-popover") && !event.target.closest(".assign-folder-button")) {
    const tabId = state.openAssignFolderTabId;
    state.openAssignFolderTabId = null;
    refreshCardAccessory(tabId);
  }
}

function handleGlobalKeydown(event) {
  const isFindShortcut = (event.metaKey || event.ctrlKey) && !event.shiftKey && event.key.toLowerCase() === "f";
  if (isFindShortcut) {
    event.preventDefault();
    dom.searchInput.focus();
    dom.searchInput.select();
    return;
  }

  if (event.key === "Escape") {
    if (state.contextMenuState) {
      closeContextMenu();
      return;
    }
    if (state.openAssignFolderTabId) {
      const tabId = state.openAssignFolderTabId;
      state.openAssignFolderTabId = null;
      refreshCardAccessory(tabId);
      return;
    }
    if (state.searchQuery) {
      clearSearch();
      return;
    }
    document.activeElement?.blur?.();
    return;
  }

  if (event.key === "ArrowDown" || event.key === "ArrowUp") {
    event.preventDefault();
    moveFocus(event.key === "ArrowDown" ? 1 : -1);
    return;
  }

  if (event.key === "Enter" && state.focusedTabId) {
    switchToTab(state.focusedTabId);
    return;
  }

  if ((event.key === "Delete" || event.key === "Backspace") && state.focusedTabId) {
    event.preventDefault();
    closeTabs([state.focusedTabId]);
  }
}

function moveFocus(direction) {
  const visible = getVisibleTabOrder();
  if (!visible.length) {
    return;
  }
  const currentIndex = visible.indexOf(state.focusedTabId);
  const nextIndex = currentIndex === -1 ? 0 : Math.max(0, Math.min(visible.length - 1, currentIndex + direction));
  const next = visible[nextIndex];
  state.focusedTabId = next;
  state.cardElements.get(next)?.focus();
}

function getVisibleTabOrder() {
  return state.orderedTabIds.filter((tabId) => {
    const card = state.cardElements.get(tabId);
    return card && !card.classList.contains("hidden");
  });
}

function toggleNotePanel(tabId, focusInput) {
  if (state.layoutMode === "expanded") {
    if (focusInput) {
      state.cardElements.get(tabId)?.querySelector(".note-input")?.focus();
    }
    return;
  }

  if (state.openNoteTabs.has(tabId)) {
    state.openNoteTabs.delete(tabId);
  } else {
    state.openNoteTabs.add(tabId);
  }
  refreshCardAccessory(tabId);
  if (focusInput) {
    state.cardElements.get(tabId)?.querySelector(".note-input")?.focus();
  }
}

async function switchToTab(tabId) {
  const tab = state.tabsById.get(tabId);
  if (!tab) {
    return;
  }
  const touchedAt = Date.now();
  state.liveTabMeta[tabId] = {
    ...(state.liveTabMeta[tabId] || { openedAt: Date.now(), lastSummaryAttemptAt: 0, summaryRequested: false }),
    lastTouchedAt: touchedAt
  };
  syncOpenTabHistory(tab, { touchedAt });
  updateUrlInsight(tab, touchedAt);
  try {
    await chrome.windows.update(tab.windowId, { focused: true });
    await chrome.tabs.update(tab.id, { active: true });
  } catch (error) {
    console.error("Unable to switch to tab", error);
  }
}

async function copyTabUrl(tabId) {
  const tab = state.tabsById.get(tabId);
  if (!tab?.url) {
    return;
  }
  try {
    await navigator.clipboard.writeText(tab.url);
  } catch (error) {
    showToast("Tab URL couldn't be copied.");
  }
}

function bindDropTargets(drawer, header, cards, workspaceId, collapsed) {
  let expandTimer = null;

  const activate = () => {
    drawer.classList.add("drag-mode");
    header.classList.add("drag-active");
    cards.classList.add("drag-active");
    if (collapsed && workspaceId !== "unassigned" && !expandTimer) {
      expandTimer = setTimeout(() => {
        const workspace = getWorkspace(workspaceId);
        if (workspace) {
          workspace.collapsed = false;
          renderWorkspaceSection(workspace);
        }
      }, 600);
    }
  };

  const deactivate = () => {
    drawer.classList.remove("drag-mode");
    header.classList.remove("drag-active");
    cards.classList.remove("drag-active");
    if (expandTimer) {
      clearTimeout(expandTimer);
      expandTimer = null;
    }
  };

  [header, cards].forEach((node) => {
    node.addEventListener("dragenter", (event) => {
      event.preventDefault();
      activate();
    });
    node.addEventListener("dragover", (event) => {
      event.preventDefault();
      activate();
    });
    node.addEventListener("dragleave", () => deactivate());
    node.addEventListener("drop", async (event) => {
      event.preventDefault();
      deactivate();
      await handleDropOnWorkspace(event, workspaceId === "unassigned" ? null : workspaceId, null);
    });
  });
}

function enableGlobalDropAffordances(show) {
  dom.workspaceList.querySelectorAll(".drawer").forEach((drawer) => {
    drawer.classList.toggle("drag-mode", show);
  });
  dom.unassignedSection.querySelectorAll(".drawer").forEach((drawer) => {
    drawer.classList.toggle("drag-mode", show);
  });
}

function clearDropState() {
  document.querySelectorAll(".drag-active,.drop-target").forEach((node) => node.classList.remove("drag-active", "drop-target"));
}

async function handleDropOnWorkspace(event, targetWorkspaceId, beforeTabId) {
  if (state.dragState?.tabIds?.length) {
    moveTabIdsToWorkspace(state.dragState.tabIds, targetWorkspaceId, beforeTabId);
    state.dragState = null;
    return;
  }

  const droppedUrl = extractDroppedUrl(event);
  if (!droppedUrl) {
    showToast("That doesn't look like a URL");
    return;
  }

  try {
    const created = await chrome.tabs.create({ url: droppedUrl, active: false });
    if (Number.isInteger(created.id)) {
      moveTabIdsToWorkspace([created.id], targetWorkspaceId, beforeTabId);
      flashDrawer(targetWorkspaceId || "unassigned");
    }
  } catch (error) {
    console.error("Unable to open dropped URL", error);
    showToast("That URL couldn't be opened.");
  }
}

function extractDroppedUrl(event) {
  const types = Array.from(event.dataTransfer?.types || []);
  if (types.includes("text/uri-list")) {
    const value = event.dataTransfer.getData("text/uri-list").split("\n").find(Boolean);
    if (isValidUrl(value)) {
      return value;
    }
  }
  if (types.includes("text/plain")) {
    const value = event.dataTransfer.getData("text/plain").trim();
    if (isValidUrl(value)) {
      return value;
    }
  }
  return state.externalDragInfo?.url && isValidUrl(state.externalDragInfo.url) ? state.externalDragInfo.url : null;
}

function renderExternalDropZone(show) {
  dom.externalDropZone.classList.toggle("hidden", !show);
}

async function handleExternalDropZoneDrop(event) {
  event.preventDefault();
  const targetWorkspaceId = dom.externalDropWorkspaceSelect.value || null;
  await handleDropOnWorkspace(event, targetWorkspaceId, null);
  renderExternalDropZone(false);
  state.externalDragInfo = null;
  enableGlobalDropAffordances(false);
}

function moveTabIdsToWorkspace(tabIds, targetWorkspaceId, beforeTabId = null) {
  const ids = dedupe(tabIds.filter((tabId) => state.tabsById.has(tabId)));
  if (!ids.length) {
    return;
  }

  const affected = new Set(["unassigned"]);
  ids.forEach((tabId) => {
    const current = getWorkspaceForTab(tabId);
    if (current) {
      affected.add(current.id);
    }
  });

  state.workspaces.forEach((workspace) => {
    workspace.tabIds = workspace.tabIds.filter((tabId) => !ids.includes(tabId));
  });

  if (targetWorkspaceId) {
    const workspace = getWorkspace(targetWorkspaceId);
    if (workspace) {
      affected.add(workspace.id);
      const next = workspace.tabIds.filter((tabId) => !ids.includes(tabId));
      if (beforeTabId && next.includes(beforeTabId)) {
        next.splice(next.indexOf(beforeTabId), 0, ...ids);
      } else {
        next.push(...ids);
      }
      workspace.tabIds = dedupe(next);
      workspace.tabUrlSnapshots = workspace.tabIds.map((tabId) => state.tabsById.get(tabId)?.url).filter(Boolean);
      workspace.collapsed = false;
      ids.forEach((tabId) => {
        trainWorkspaceLearning(tabId, workspace.id);
        delete state.suggestionDismissals[getSuggestionKey(tabId, workspace.id)];
      });
    }
  }

  state.workspaces.forEach((workspace) => {
    workspace.tabUrlSnapshots = workspace.tabIds.map((tabId) => state.tabsById.get(tabId)?.url).filter(Boolean);
  });
  updateHistoryFolderAssignments(targetWorkspaceId);

  affected.forEach((workspaceId) => {
    if (workspaceId === "unassigned") {
      renderUnassignedSection();
      return;
    }
    const workspace = getWorkspace(workspaceId);
    if (workspace) {
      renderWorkspaceSection(workspace);
      flashDrawer(workspace.id);
    }
  });
  syncExternalDropWorkspaceSelect();
  renderSettingsWorkspaces();
  scheduleSave();
  applySearch();
}

function flashDrawer(workspaceId) {
  const drawer = state.drawerElements.get(workspaceId) || dom.unassignedSection.querySelector(".drawer");
  if (!drawer) {
    return;
  }
  drawer.classList.add("flash");
  setTimeout(() => drawer.classList.remove("flash"), 220);
}

async function groupUnassignedByDomain() {
  const groups = new Map();
  getUnassignedTabIds().forEach((tabId) => {
    const tab = state.tabsById.get(tabId);
    const domain = getTabDisplayInfo(tab).domain || "Loose";
    if (!groups.has(domain)) {
      groups.set(domain, []);
    }
    groups.get(domain).push(tabId);
  });

  groups.forEach((tabIds, domain) => {
    state.workspaces.push({
      id: crypto.randomUUID(),
      name: uniqueWorkspaceName(capitalize(domain)),
      color: COLOR_OPTIONS[state.workspaces.length % COLOR_OPTIONS.length].id,
      tabIds,
      tabUrlSnapshots: tabIds.map((tabId) => state.tabsById.get(tabId)?.url).filter(Boolean),
      collapsed: false
    });
  });

  renderFullPanel();
  scheduleSave();
  if (groups.size) {
    showToast(`${groups.size} folders created from domains`, { color: state.theme.custom.accent });
  }
}

function toggleDeleteBar(workspaceId) {
  state.pendingDeleteWorkspaceId = state.pendingDeleteWorkspaceId === workspaceId ? null : workspaceId;
  const workspace = getWorkspace(workspaceId);
  if (workspace) {
    renderWorkspaceSection(workspace);
  }
}

function deleteWorkspace(workspaceId) {
  state.workspaces = state.workspaces.filter((workspace) => workspace.id !== workspaceId);
  state.pendingDeleteWorkspaceId = null;
  updateHistoryFolderAssignments();
  renderFullPanel();
  scheduleSave();
}

function toggleWorkspaceCollapsed(workspaceId, expandOnly) {
  const workspace = getWorkspace(workspaceId);
  if (!workspace) {
    return;
  }
  workspace.collapsed = expandOnly ? false : !workspace.collapsed;
  renderWorkspaceSection(workspace);
  scheduleSave();
}

function commitWorkspaceRename(workspaceId, value) {
  const workspace = getWorkspace(workspaceId);
  if (!workspace) {
    return;
  }
  workspace.name = value.trim() || workspace.name;
  state.tabHistory.forEach((entry) => {
    if (entry.folderId === workspace.id) {
      entry.folderName = workspace.name;
    }
  });
  state.editingWorkspaceId = null;
  renderWorkspaceSection(workspace);
  renderSettingsWorkspaces();
  syncExternalDropWorkspaceSelect();
  scheduleSave();
}

async function sendWorkspaceToWindow(workspaceId) {
  const workspace = getWorkspace(workspaceId);
  if (!workspace) {
    return;
  }
  const urls = workspace.tabIds.map((tabId) => state.tabsById.get(tabId)?.url).filter(isValidUrl);
  if (!urls.length) {
    showToast("This folder has no openable URLs.");
    return;
  }
  try {
    await chrome.windows.create({ url: urls });
  } catch (error) {
    console.error("Unable to open folder window", error);
    showToast("That folder couldn't open in a new window.");
  }
}

async function importWindowTabsToWorkspace(windowId) {
  try {
    const tabs = await chrome.tabs.query({ windowId });
    const tabIds = tabs.filter((tab) => Number.isInteger(tab.id)).map((tab) => tab.id);
    if (!tabIds.length) {
      return;
    }
    const workspace = {
      id: crypto.randomUUID(),
      name: uniqueWorkspaceName(`Imported ${formatShortDate(Date.now())}`),
      color: COLOR_OPTIONS[state.workspaces.length % COLOR_OPTIONS.length].id,
      tabIds,
      tabUrlSnapshots: tabs.map((tab) => tab.url).filter(Boolean),
      collapsed: false
    };
    state.workspaces.push(workspace);
    renderWorkspaceSection(workspace);
    renderUnassignedSection();
    syncExternalDropWorkspaceSelect();
    renderSettingsWorkspaces();
    scheduleSave();
    showWorkspaceCreatedToast(workspace.name, workspace.color);
  } catch (error) {
    console.error("Unable to import window tabs", error);
    showToast("Window tabs couldn't be imported.");
  }
}

function saveWorkspaceSession(workspaceId) {
  const workspace = getWorkspace(workspaceId);
  if (!workspace) {
    return;
  }
  const urls = workspace.tabIds.map((tabId) => state.tabsById.get(tabId)?.url).filter(Boolean);
  state.savedSessions.push({
    id: crypto.randomUUID(),
    name: workspace.name,
    savedAt: Date.now(),
    urls
  });
  renderSavedSessions();
  scheduleSave();
  showToast(`${workspace.name} saved`, { color: workspace.color });
}

async function restoreSavedSession(sessionId) {
  const session = state.savedSessions.find((item) => item.id === sessionId);
  if (!session) {
    return;
  }

  const createdIds = [];
  for (const url of session.urls) {
    try {
      const tab = await chrome.tabs.create({ url, active: false });
      if (Number.isInteger(tab.id)) {
        createdIds.push(tab.id);
      }
    } catch (error) {
      console.error("Unable to restore tab from saved session", error);
    }
  }

  state.workspaces.push({
    id: crypto.randomUUID(),
    name: uniqueWorkspaceName(session.name),
    color: COLOR_OPTIONS[state.workspaces.length % COLOR_OPTIONS.length].id,
    tabIds: createdIds,
    tabUrlSnapshots: [...session.urls],
    collapsed: false
  });
  renderFullPanel();
  scheduleSave();
}

async function closeTabs(tabIds) {
  const tabs = tabIds.map((tabId) => state.tabsById.get(tabId)).filter(Boolean);
  if (!tabs.length) {
    return;
  }

  state.pendingDeleteToast = tabs.map((tab) => ({
    url: tab.url,
    windowId: tab.windowId,
    index: tab.index,
    workspaceId: getWorkspaceForTab(tab.id)?.id || null
  }));

  try {
    await chrome.tabs.remove(tabs.map((tab) => tab.id));
    showToast("Tab closed.", {
      actionLabel: "Undo",
      duration: 4000,
      onAction: undoClosedTabs
    });
  } catch (error) {
    console.error("Unable to close tabs", error);
    showToast("That tab couldn't be closed.");
  }
}

async function undoClosedTabs() {
  const entries = state.pendingDeleteToast;
  if (!entries?.length) {
    return;
  }

  for (const entry of entries) {
    try {
      const tab = await chrome.tabs.create({
        url: entry.url,
        active: false,
        windowId: entry.windowId,
        index: entry.index
      });
      if (entry.workspaceId && Number.isInteger(tab.id)) {
        const workspace = getWorkspace(entry.workspaceId);
        if (workspace) {
          workspace.tabIds.push(tab.id);
          workspace.tabUrlSnapshots.push(entry.url);
        }
      }
    } catch (error) {
      console.error("Unable to restore closed tab", error);
    }
  }

  state.pendingDeleteToast = null;
  scheduleSave();
  await reconcileWithBrowser({ fullRender: false });
}

function exportState() {
  const blob = new Blob(
    [
      JSON.stringify(
        {
          folders: state.workspaces,
          notes: state.notes,
          autoSummaries: state.autoSummaries,
          urlInsights: state.urlInsights,
          folderLearning: state.workspaceLearning,
          tabHistory: state.tabHistory,
          savedSessions: state.savedSessions,
          tagColors: state.tagColors,
          theme: state.theme,
          fontPairing: state.fontPairing,
          hasOnboarded: state.hasOnboarded,
          skippedCustomization: state.skippedCustomization,
          compactMode: state.compactMode,
          showFavicons: state.showFavicons,
          showDomain: state.showDomain,
          openOnStartup: state.openOnStartup,
          ai: state.ai
        },
        null,
        2
      )
    ],
    { type: "application/json" }
  );
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `tabula-export-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  closeHeaderMenu();
}

async function handleImportFile(event) {
  const file = event.target.files?.[0];
  if (!file) {
    return;
  }
  try {
    const parsed = JSON.parse(await file.text());
    const imported = sanitizeStorage(parsed);
    mergeImportedData(imported);
    renderFullPanel();
    renderSettingsState();
    scheduleSave();
    showToast("Import complete.");
  } catch (error) {
    console.error("Unable to import file", error);
    showToast("That file couldn't be imported.");
  } finally {
    dom.importFileInput.value = "";
    closeHeaderMenu();
  }
}

function mergeImportedData(imported) {
  imported.workspaces.forEach((workspace) => {
    state.workspaces.push({
      ...workspace,
      id: crypto.randomUUID(),
      name: uniqueWorkspaceName(workspace.name)
    });
  });

  imported.savedSessions.forEach((session) => {
    state.savedSessions.push({
      ...session,
      id: crypto.randomUUID()
    });
  });

  state.notes = { ...state.notes, ...imported.notes };
  state.autoSummaries = { ...state.autoSummaries, ...imported.autoSummaries };
  state.urlInsights = { ...state.urlInsights, ...imported.urlInsights };
  state.workspaceLearning = { ...state.workspaceLearning, ...imported.workspaceLearning };
  state.tabHistory = dedupeByKey([...state.tabHistory, ...imported.tabHistory], "id");
  state.tagColors = { ...state.tagColors, ...imported.tagColors };
  state.theme = imported.theme;
  state.fontPairing = imported.fontPairing;
  state.hasOnboarded = state.hasOnboarded || imported.hasOnboarded;
  state.skippedCustomization = state.skippedCustomization || imported.skippedCustomization;
  state.compactMode = state.compactMode || imported.compactMode;
  state.showFavicons = imported.showFavicons;
  state.showDomain = imported.showDomain;
  state.openOnStartup = imported.openOnStartup;
  state.ai = imported.ai || state.ai;
  applyAppearance();
}

async function resetAllData() {
  Object.assign(state, {
    workspaces: [],
    notes: {},
    autoSummaries: {},
    urlInsights: {},
    workspaceLearning: {},
    tabHistory: [],
    savedSessions: [],
    tagColors: {},
    theme: structuredClone(DEFAULT_SETTINGS.theme),
    fontPairing: DEFAULT_SETTINGS.fontPairing,
    hasOnboarded: DEFAULT_SETTINGS.hasOnboarded,
    skippedCustomization: DEFAULT_SETTINGS.skippedCustomization,
    compactMode: DEFAULT_SETTINGS.compactMode,
    showFavicons: DEFAULT_SETTINGS.showFavicons,
    showDomain: DEFAULT_SETTINGS.showDomain,
    openOnStartup: DEFAULT_SETTINGS.openOnStartup,
    ai: structuredClone(DEFAULT_SETTINGS.ai)
  });
  state.tabsById = new Map(state.tabsById);
  state.liveTabMeta = {};
  state.suggestionDismissals = {};
  state.proactiveSuggestionDismissals = {};
  state.hasShownSessionSuggestion = false;
  state.commandPreview = null;
  state.relatedLinesEnabled = false;
  applyAppearance();
  renderSettingsState();
  renderFullPanel();
  scheduleSave();
}

function openSettings() {
  state.settingsOpen = true;
  state.settingsTab = state.settingsTab || "appearance";
  renderSettingsOverlay();
  closeHeaderMenu();
}

function renderSettingsOverlay() {
  dom.settingsOverlay.classList.toggle("hidden", !state.settingsOpen);
  document.body.classList.toggle("settings-mode", state.settingsOpen);
  renderSettingsState();
}

function renderSettingsState() {
  dom.settingsBackgroundColor.value = state.theme.custom.background;
  dom.settingsBackgroundText.value = state.theme.custom.background;
  dom.settingsSurfaceColor.value = state.theme.custom.cardSurface;
  dom.settingsSurfaceText.value = state.theme.custom.cardSurface;
  dom.settingsAccentColor.value = state.theme.custom.accent;
  dom.settingsAccentText.value = state.theme.custom.accent;
  dom.settingsDarkMode.value = state.theme.darkMode;
  dom.behaviorOpenOnStartup.checked = state.openOnStartup;
  dom.behaviorShowFavicons.checked = state.showFavicons;
  dom.behaviorShowDomain.checked = state.showDomain;
  dom.behaviorCompactMode.checked = state.compactMode;
  dom.aiSuggestionsEnabled.checked = state.ai.suggestionsEnabled;
  dom.aiSummariesEnabled.checked = state.ai.summariesEnabled;
  dom.aiRelatedEnabled.checked = state.ai.relatedEnabled;
  dom.aiCommandBarEnabled.checked = state.ai.commandBarEnabled;
  const sections = {
    appearance: dom.settingsSectionAppearance,
    workspaces: dom.settingsSectionWorkspaces,
    ai: dom.settingsSectionAi,
    behavior: dom.settingsSectionBehavior
  };
  Object.entries(sections).forEach(([key, section]) => {
    section?.classList.toggle("hidden", state.settingsTab !== key);
  });
  [
    dom.settingsTabAppearance,
    dom.settingsTabWorkspaces,
    dom.settingsTabAi,
    dom.settingsTabBehavior
  ].forEach((button) => {
    button?.classList.toggle("is-active", button.dataset.settingsTab === state.settingsTab);
  });
  renderThemePresetCards();
  renderFontPairingCards();
  renderSettingsWorkspaces();
}

function renderSettingsWorkspaces() {
  dom.settingsWorkspaces.replaceChildren();
  state.workspaces.forEach((workspace) => {
    const row = document.createElement("div");
    row.className = "settings-workspace-row";
    row.draggable = true;
    row.dataset.workspaceId = workspace.id;
    row.innerHTML = `
      <div class="settings-workspace-main">
        <input class="workspace-settings-name" value="${escapeHtml(workspace.name)}" />
      </div>
      <div class="settings-workspace-controls">
        <input class="workspace-settings-color" type="color" value="${resolveWorkspaceHex(workspace.color)}" />
        <input class="workspace-settings-color-text" type="text" value="${resolveWorkspaceHex(workspace.color)}" />
        <button class="session-delete" type="button" aria-label="Delete folder">×</button>
      </div>
    `;

    const nameInput = row.querySelector(".workspace-settings-name");
    const colorInput = row.querySelector(".workspace-settings-color");
    const colorText = row.querySelector(".workspace-settings-color-text");
    bindColorPair(colorInput, colorText);

    nameInput.addEventListener("input", () => {
      workspace.name = nameInput.value.slice(0, 32);
      renderWorkspaceSection(workspace);
      syncExternalDropWorkspaceSelect();
      scheduleSave();
    });

    colorInput.addEventListener("input", () => {
      workspace.color = colorInput.value;
      renderWorkspaceSection(workspace);
      scheduleSave();
    });

    colorText.addEventListener("input", () => {
      workspace.color = colorText.value;
      renderWorkspaceSection(workspace);
      scheduleSave();
    });

    row.querySelector(".session-delete").addEventListener("click", () => {
      deleteWorkspace(workspace.id);
      renderSettingsWorkspaces();
    });

    row.addEventListener("dragstart", () => row.classList.add("dragging"));
    row.addEventListener("dragend", () => row.classList.remove("dragging"));
    row.addEventListener("dragover", (event) => event.preventDefault());
    row.addEventListener("drop", (event) => {
      event.preventDefault();
      const draggedId = dom.settingsWorkspaces.querySelector(".dragging")?.dataset.workspaceId;
      if (!draggedId || draggedId === workspace.id) {
        return;
      }
      reorderWorkspaces(draggedId, workspace.id);
    });

    dom.settingsWorkspaces.appendChild(row);
  });
}

function reorderWorkspaces(draggedId, beforeId) {
  const draggedIndex = state.workspaces.findIndex((workspace) => workspace.id === draggedId);
  const beforeIndex = state.workspaces.findIndex((workspace) => workspace.id === beforeId);
  if (draggedIndex === -1 || beforeIndex === -1) {
    return;
  }
  const [workspace] = state.workspaces.splice(draggedIndex, 1);
  state.workspaces.splice(beforeIndex, 0, workspace);
  renderFullPanel();
  renderSettingsWorkspaces();
  scheduleSave();
}

function resetSettingsToDefaults() {
  state.theme = structuredClone(DEFAULT_SETTINGS.theme);
  state.fontPairing = DEFAULT_SETTINGS.fontPairing;
  state.compactMode = DEFAULT_SETTINGS.compactMode;
  state.showFavicons = DEFAULT_SETTINGS.showFavicons;
  state.showDomain = DEFAULT_SETTINGS.showDomain;
  state.ai = structuredClone(DEFAULT_SETTINGS.ai);
  state.relatedLinesEnabled = false;
  applyAppearance();
  renderSettingsState();
  renderVisibleCards();
  scheduleSave();
}

function renderVisibleCards() {
  state.cardElements.forEach((_, tabId) => updateCardDom(tabId));
  runtimeFns.renderConnections();
}

function syncExternalDropWorkspaceSelect() {
  dom.externalDropWorkspaceSelect.replaceChildren();
  const loose = document.createElement("option");
  loose.value = "";
  loose.textContent = "Unassigned";
  dom.externalDropWorkspaceSelect.appendChild(loose);
  state.workspaces.forEach((workspace) => {
    const option = document.createElement("option");
    option.value = workspace.id;
    option.textContent = workspace.name;
    dom.externalDropWorkspaceSelect.appendChild(option);
  });
}

function renderWelcomeOrTutorial() {
  const showWelcome = !state.hasOnboarded;
  dom.welcomeOverlay.classList.toggle("hidden", !showWelcome);
  if (showWelcome) {
    dom.welcomeSplash.classList.toggle("hidden", state.welcomePhase !== "splash");
    dom.customizationWizard.classList.toggle("hidden", state.welcomePhase !== "wizard");
    renderWizardStep();
    applyPreviewAppearance();
  }
  renderTutorial();
}

function renderWizardStep() {
  if (state.welcomePhase !== "wizard") {
    return;
  }
  dom.wizardProgress.textContent = `Step ${state.wizardStepIndex + 1} of 4`;
  document.querySelectorAll(".wizard-step").forEach((node, index) => {
    node.classList.toggle("hidden", index !== state.wizardStepIndex);
  });
  dom.wizardBack.classList.toggle("hidden", state.wizardStepIndex === 0);
  dom.wizardNext.textContent = state.wizardStepIndex === 3 ? "Open Tabula" : "Next";

  if (state.wizardStepIndex === 2) {
    renderOnboardingWorkspaceForms();
  }
  if (state.wizardStepIndex === 3) {
    dom.wizardSummaryCard.innerHTML = `
      <div><strong>Theme</strong>: ${state.onboardingDraft.theme.preset === "custom" ? "Custom" : getThemePreset(state.onboardingDraft.theme.preset)?.name || "Paper Desk"}</div>
      <div><strong>Fonts</strong>: ${(FONT_PAIRINGS.find((pairing) => pairing.id === state.onboardingDraft.fontPairing) || FONT_PAIRINGS[0]).name}</div>
      <div><strong>Folders</strong>: ${state.onboardingDraft.workspaces.length ? state.onboardingDraft.workspaces.map((workspace) => escapeHtml(workspace.name)).join(", ") : "None yet"}</div>
    `;
  }
}

function renderOnboardingWorkspaceForms() {
  dom.onboardingWorkspaceContainer.replaceChildren();
  state.onboardingDraft.workspaces.forEach((workspace, index) => {
    const row = document.createElement("div");
    row.className = "settings-workspace-row";
    row.innerHTML = `
      <div class="settings-workspace-main">
        <input class="workspace-settings-name" value="${escapeHtml(workspace.name)}" placeholder="Research" />
      </div>
      <div class="settings-workspace-controls">
        <input class="workspace-settings-color" type="color" value="${resolveWorkspaceHex(workspace.color)}" />
        <input class="workspace-settings-color-text" type="text" value="${resolveWorkspaceHex(workspace.color)}" />
        ${index > 0 ? '<button class="session-delete" type="button" aria-label="Remove folder">×</button>' : ""}
      </div>
    `;
    const nameInput = row.querySelector(".workspace-settings-name");
    const colorInput = row.querySelector(".workspace-settings-color");
    const colorText = row.querySelector(".workspace-settings-color-text");
    bindColorPair(colorInput, colorText);
    nameInput.addEventListener("input", () => {
      workspace.name = nameInput.value.slice(0, 32);
    });
    colorInput.addEventListener("input", () => {
      workspace.color = colorInput.value;
    });
    colorText.addEventListener("input", () => {
      workspace.color = colorText.value;
    });
    row.querySelector(".session-delete")?.addEventListener("click", () => {
      state.onboardingDraft.workspaces.splice(index, 1);
      renderOnboardingWorkspaceForms();
    });
    dom.onboardingWorkspaceContainer.appendChild(row);
  });
}

function finishCustomizationWizard() {
  state.theme = structuredClone(state.onboardingDraft.theme);
  state.fontPairing = state.onboardingDraft.fontPairing;
  state.hasOnboarded = true;
  state.skippedCustomization = false;
  state.tutorialActive = true;
  state.tutorialStepIndex = 0;
  state.workspaces.unshift(
    ...state.onboardingDraft.workspaces
      .filter((workspace) => workspace.name.trim())
      .map((workspace) => ({
        id: crypto.randomUUID(),
        name: uniqueWorkspaceName(workspace.name.trim()),
        color: normalizeWorkspaceColor(workspace.color),
        tabIds: [],
        tabUrlSnapshots: [],
        collapsed: false
      }))
      .reverse()
  );
  applyAppearance();
  scheduleSave();
  renderFullPanel();
  renderWelcomeOrTutorial();
}

function renderTutorial() {
  const show = state.hasOnboarded && state.tutorialActive;
  if (!show) {
    destroyTutorialOverlay();
    return;
  }
  ensureTutorialOverlay();
  let step = TUTORIAL_STEPS[state.tutorialStepIndex];
  document.body.classList.add("tutorial-mode");
  document.body.classList.toggle("tutorial-search-step", step?.target === "#search-region");
  let target = step ? document.querySelector(step.target) : null;
  while (step && (!target || !target.getClientRects().length)) {
    state.tutorialStepIndex += 1;
    step = TUTORIAL_STEPS[state.tutorialStepIndex];
    document.body.classList.toggle("tutorial-search-step", step?.target === "#search-region");
    target = step ? document.querySelector(step.target) : null;
  }
  if (!step || !target) {
    finishTutorial();
    return;
  }
  dom.tutorialStepIndex.textContent = `Step ${state.tutorialStepIndex + 1} of ${TUTORIAL_STEPS.length}`;
  dom.tutorialTitle.textContent = step.title;
  dom.tutorialBody.textContent = step.body;
  dom.tutorialNext.textContent = step.button;
  positionTutorial(target);
}

function positionTutorial(target = null) {
  if (!dom.tutorialOverlay) {
    return;
  }
  if (!target) {
    return;
  }
  target.scrollIntoView({ block: "center", behavior: "auto" });
  const targetRect = target.getBoundingClientRect();
  const bodyRect = document.body.getBoundingClientRect();
  dom.tutorialHighlight.style.left = `${targetRect.left - bodyRect.left - 6}px`;
  dom.tutorialHighlight.style.top = `${targetRect.top - bodyRect.top - 6}px`;
  dom.tutorialHighlight.style.width = `${targetRect.width + 12}px`;
  dom.tutorialHighlight.style.height = `${targetRect.height + 12}px`;

  const tooltipRect = dom.tutorialTooltip.getBoundingClientRect();
  let top = targetRect.bottom - bodyRect.top + 12;
  if (top + tooltipRect.height > bodyRect.height - 12) {
    top = targetRect.top - bodyRect.top - tooltipRect.height - 12;
  }
  dom.tutorialTooltip.style.left = `${Math.max(12, Math.min(targetRect.left - bodyRect.left, bodyRect.width - tooltipRect.width - 12))}px`;
  dom.tutorialTooltip.style.top = `${Math.max(12, top)}px`;
}

function finishTutorial() {
  state.tutorialActive = false;
  state.tutorialStepIndex = 0;
  destroyTutorialOverlay();
}

function advanceTutorial() {
  state.tutorialStepIndex += 1;
  if (state.tutorialStepIndex >= TUTORIAL_STEPS.length) {
    finishTutorial();
    return;
  }
  renderTutorial();
}

runtimeFns.maybeStartSummaryWatcher = function maybeStartSummaryWatcher() {
  if (state.summaryIntervalId) {
    clearInterval(state.summaryIntervalId);
  }
  state.summaryIntervalId = setInterval(() => {
    void checkAutoSummaryCandidates();
  }, 60000);
};

async function checkAutoSummaryCandidates() {
  if (!state.ai.summariesEnabled) {
    return;
  }
  const now = Date.now();
  for (const [tabId, tab] of state.tabsById.entries()) {
    if (!tab?.url || state.notes[tab.url] || state.autoSummaries[tab.url]?.text) {
      continue;
    }
    if (!isValidUrl(tab.url) || tab.url.startsWith("chrome:") || tab.url.startsWith("about:")) {
      continue;
    }
    const meta = state.liveTabMeta[tabId];
    if (!meta || meta.summaryRequested || now - meta.openedAt < 180000) {
      continue;
    }
    meta.summaryRequested = true;
    meta.lastSummaryAttemptAt = now;
    try {
      await generateAndStoreSummary(tabId);
    } finally {
      meta.summaryRequested = false;
    }
  }
}

async function generateAndStoreSummary(tabId) {
  const tab = state.tabsById.get(tabId);
  if (!tab?.id || !tab.url) {
    return "";
  }
  const summaryInput = await extractTabSummaryInput(tab.id);
  const summaryText = await summarizeTabInput(summaryInput);
  if (!summaryText) {
    return "";
  }
  state.autoSummaries[tab.url] = {
    text: summaryText,
    createdAt: Date.now()
  };
  updateUrlInsight(tab, null, summaryText);
  updateCardDom(tabId);
  scheduleSave();
  return summaryText;
}

async function extractTabSummaryInput(tabId) {
  try {
    const response = await chrome.tabs.sendMessage(tabId, { type: "extract-page-summary-input" });
    if (response?.ok) {
      return response.payload;
    }
  } catch (error) {
    // Some pages won't allow content extraction. We'll fall back to tab metadata.
  }
  const tab = state.tabsById.get(tabId);
  const info = getTabDisplayInfo(tab);
  return {
    title: info.title,
    metaDescription: "",
    bodyText: "",
    pageUrl: tab?.url || ""
  };
}

async function summarizeTabInput(input) {
  if (!input) {
    return "";
  }
  return summarizeLocally(input);
}

function summarizeLocally(input) {
  const title = input.title?.trim() || "This page";
  const host = safeHostname(input.pageUrl);
  const body = String(input.bodyText || "").replace(/\s+/g, " ").trim();
  const meta = String(input.metaDescription || "").replace(/\s+/g, " ").trim();
  const source = meta.length >= 24 ? meta : body;
  const firstSentence = source.split(/(?<=[.!?])\s+/).find((sentence) => sentence.trim().length >= 24) || "";
  const cleaned = firstSentence
    .replace(/\s+/g, " ")
    .replace(new RegExp(`^${title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[:\\-\\s]*`, "i"), "")
    .trim();

  if (cleaned) {
    return truncate(`${title}. ${cleaned}`, 140);
  }

  const bodySnippet = body ? truncate(body, 90) : "";
  if (bodySnippet) {
    return truncate(`${title}. ${bodySnippet}`, 140);
  }

  return truncate(`${title}. ${host}.`, 110);
}

function getDisplayNoteForTab(tab) {
  if (!tab?.url) {
    return "";
  }
  return state.notes[tab.url] || state.autoSummaries[tab.url]?.text || "";
}

async function fillNoteWithGeneratedSummary(tabId) {
  const tab = state.tabsById.get(tabId);
  if (!tab?.url) {
    return;
  }
  let summary = state.autoSummaries[tab.url]?.text || "";
  if (!summary) {
    summary = await generateAndStoreSummary(tabId);
  }
  if (!summary) {
    showToast("A summary couldn't be generated for that tab.");
    return;
  }
  state.notes[tab.url] = summary;
  updateCardDom(tabId);
  refreshCardAccessory(tabId);
  scheduleSave();
}

function updateUrlInsight(tab, touchedAt = null, summaryText = null) {
  if (!tab?.url) {
    return;
  }
  const key = tab.url;
  const existing = state.urlInsights[key] || {
    title: "",
    domain: "",
    openedAt: Date.now(),
    lastTouchedAt: 0,
    visitCount: 0,
    noteText: "",
    summaryText: ""
  };
  state.urlInsights[key] = {
    ...existing,
    title: getTabDisplayInfo(tab).title,
    domain: getTabDisplayInfo(tab).domain,
    lastTouchedAt: touchedAt || existing.lastTouchedAt || Date.now(),
    visitCount: existing.visitCount + (existing.title === "" ? 1 : 0),
    noteText: state.notes[key] || existing.noteText || "",
    summaryText: summaryText || state.autoSummaries[key]?.text || existing.summaryText || "",
    openedAt: existing.openedAt || Date.now()
  };
}

function getLastTouchedForTab(tabId) {
  const tab = state.tabsById.get(tabId);
  if (!tab?.url) {
    return state.liveTabMeta[tabId]?.lastTouchedAt || null;
  }
  return state.liveTabMeta[tabId]?.lastTouchedAt || state.urlInsights[tab.url]?.lastTouchedAt || null;
}

function ensureTabHistoryEntry(tab, openedAt) {
  if (!tab?.url || !Number.isInteger(tab.id)) {
    return null;
  }
  const meta = state.liveTabMeta[tab.id] || (state.liveTabMeta[tab.id] = {});
  if (meta.historyId) {
    return state.tabHistory.find((entry) => entry.id === meta.historyId) || null;
  }

  const info = getTabDisplayInfo(tab);
  const folder = getWorkspaceForTab(tab.id);
  const entry = {
    id: crypto.randomUUID(),
    url: tab.url,
    title: info.title,
    domain: info.domain,
    openedAt,
    lastTouchedAt: tab.active ? openedAt : 0,
    closedAt: null,
    folderId: folder?.id || null,
    folderName: folder?.name || "",
    touchCount: tab.active ? 1 : 0
  };
  state.tabHistory.push(entry);
  meta.historyId = entry.id;
  return entry;
}

function syncOpenTabHistory(tab, { touchedAt = null } = {}) {
  if (!tab?.url || !Number.isInteger(tab.id)) {
    return;
  }
  const meta = state.liveTabMeta[tab.id] || {};
  const openedAt = meta.openedAt || Date.now();
  const historyEntry = ensureTabHistoryEntry(tab, openedAt);
  if (!historyEntry) {
    return;
  }
  const info = getTabDisplayInfo(tab);
  historyEntry.url = tab.url;
  historyEntry.title = info.title;
  historyEntry.domain = info.domain;
  historyEntry.closedAt = null;
  if (touchedAt) {
    historyEntry.lastTouchedAt = touchedAt;
    historyEntry.touchCount += 1;
  }
}

function closeTabHistory(tabId, closedAt) {
  const meta = state.liveTabMeta[tabId];
  const historyId = meta?.historyId;
  if (!historyId) {
    return;
  }
  const entry = state.tabHistory.find((item) => item.id === historyId);
  if (entry) {
    entry.closedAt = closedAt;
  }
}

function updateHistoryFolderAssignments(folderId = null) {
  state.orderedTabIds.forEach((tabId) => {
    const meta = state.liveTabMeta[tabId];
    if (!meta?.historyId) {
      return;
    }
    const entry = state.tabHistory.find((item) => item.id === meta.historyId);
    if (!entry) {
      return;
    }
    const folder = getWorkspaceForTab(tabId);
    if (folderId && folder?.id !== folderId && entry.folderId !== folderId) {
      return;
    }
    entry.folderId = folder?.id || null;
    entry.folderName = folder?.name || "";
  });
}

function findFolderByName(name) {
  const target = name.trim().toLowerCase();
  return state.workspaces.find((workspace) => workspace.name.trim().toLowerCase() === target) || null;
}

function createFolder(name, color = null) {
  const folder = {
    id: crypto.randomUUID(),
    name: uniqueWorkspaceName(name.trim()),
    color: normalizeWorkspaceColor(color || COLOR_OPTIONS[state.workspaces.length % COLOR_OPTIONS.length].id),
    tabIds: [],
    tabUrlSnapshots: [],
    collapsed: false
  };
  state.workspaces.unshift(folder);
  renderFullPanel();
  requestAnimationFrame(() => {
    const section = state.drawerElements.get(folder.id);
    section?.scrollIntoView({ block: "start", behavior: "smooth" });
  });
  syncExternalDropWorkspaceSelect();
  renderBulkBar();
  renderSettingsWorkspaces();
  scheduleSave();
  showWorkspaceCreatedToast(folder.name, folder.color);
  return folder;
}

function addTabsToFolder(tabIds, folderName, color = null) {
  if (!folderName.trim()) {
    return null;
  }
  const folder = findFolderByName(folderName) || createFolder(folderName, color);
  moveTabIdsToWorkspace(tabIds, folder.id);
  return folder;
}

function renderSuggestionChip(tabId, row, chip, dismissButton) {
  if (!row || !chip || !dismissButton) {
    return;
  }
  const suggestion = computeWorkspaceSuggestion(tabId);
  row.classList.toggle("hidden", !suggestion);
  if (!suggestion) {
    return;
  }
  chip.textContent = `Add to ${suggestion.workspace.name}?`;
  chip.title = suggestion.reason;
  chip.className = `suggestion-chip ${suggestion.confidence >= 0.75 ? "high-confidence" : "medium-confidence"}`;
  chip.onclick = () => {
    globalThis.clearTimeout(state.manualAssignmentByTab[tabId]);
    delete state.manualAssignmentByTab[tabId];
    moveTabIdsToWorkspace([tabId], suggestion.workspace.id);
    showToast(`Added to ${suggestion.workspace.name}`, { color: suggestion.workspace.color, duration: 1200 });
  };
  dismissButton.onclick = () => {
    globalThis.clearTimeout(state.manualAssignmentByTab[tabId]);
    delete state.manualAssignmentByTab[tabId];
    state.suggestionDismissals[getSuggestionKey(tabId, suggestion.workspace.id)] = true;
    updateCardDom(tabId);
  };
  globalThis.clearTimeout(state.manualAssignmentByTab[tabId]);
  state.manualAssignmentByTab[tabId] = globalThis.setTimeout(() => {
    state.suggestionDismissals[getSuggestionKey(tabId, suggestion.workspace.id)] = true;
    delete state.manualAssignmentByTab[tabId];
    updateCardDom(tabId);
  }, 12000);
}

function computeWorkspaceSuggestion(tabId) {
  if (!state.ai.suggestionsEnabled || getWorkspaceForTab(tabId)) {
    return null;
  }
  const tab = state.tabsById.get(tabId);
  if (!tab) {
    return null;
  }
  let best = null;
  state.workspaces.forEach((workspace) => {
    const score = scoreTabForWorkspace(tab, workspace);
    if (!best || score > best.score) {
      best = { workspace, score };
    }
  });
  if (!best || best.score < 0.22) {
    return null;
  }
  if (state.suggestionDismissals[getSuggestionKey(tabId, best.workspace.id)]) {
    return null;
  }
  return {
    workspace: best.workspace,
    score: best.score,
    confidence: Math.min(0.95, best.score),
    reason: `This tab looks similar to what you usually keep in ${best.workspace.name}.`
  };
}

function scoreTabForWorkspace(tab, workspace) {
  const model = state.workspaceLearning[workspace.id] || { hosts: {}, keywords: {} };
  const tokens = tokenize(getSemanticText(tab));
  let score = 0;
  tokens.forEach((token) => {
    score += Math.min(0.04, (model.keywords?.[token] || 0) * 0.015);
  });
  if (workspace.name && tokens.includes(workspace.name.toLowerCase())) {
    score += 0.12;
  }
  return score;
}

function trainWorkspaceLearning(tabId, workspaceId) {
  const tab = state.tabsById.get(tabId);
  const workspace = getWorkspace(workspaceId);
  if (!tab || !workspace) {
    return;
  }
  const key = workspace.id;
  const tokens = tokenize(getSemanticText(tab));
  const model = state.workspaceLearning[key] || { hosts: {}, keywords: {} };
  tokens.forEach((token) => {
    model.keywords[token] = (model.keywords[token] || 0) + 1;
  });
  state.workspaceLearning[key] = model;
}

function getSuggestionKey(tabId, workspaceId) {
  const tab = state.tabsById.get(tabId);
  return `${tab?.url || tabId}:${workspaceId}`;
}

function getSemanticText(tab) {
  if (!tab) {
    return "";
  }
  const info = getTabDisplayInfo(tab);
  const note = getDisplayNoteForTab(tab);
  const summary = tab.url ? state.autoSummaries[tab.url]?.text || state.urlInsights[tab.url]?.summaryText || "" : "";
  return `${info.title} ${note} ${summary}`.trim();
}

function renderRelatedTabs(tabId, container, list) {
  if (!container || !list) {
    return;
  }
  const related = state.ai.relatedEnabled ? computeRelatedTabs(tabId).slice(0, 2) : [];
  container.classList.toggle("hidden", related.length === 0);
  list.replaceChildren();
  related.forEach((item) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = `${item.title} · ${item.workspaceName}`;
    button.addEventListener("click", () => {
      const card = state.cardElements.get(item.tabId);
      card?.scrollIntoView({ behavior: "smooth", block: "center" });
      card?.focus();
    });
    list.appendChild(button);
  });
}

function computeRelatedTabs(tabId) {
  const current = state.tabsById.get(tabId);
  if (!current) {
    return [];
  }
  const currentWorkspace = getWorkspaceForTab(tabId);
  const currentVector = tokenizeForSimilarity(current);
  return state.orderedTabIds
    .filter((candidateId) => candidateId !== tabId)
    .filter((candidateId) => getWorkspaceForTab(candidateId)?.id !== currentWorkspace?.id)
    .map((candidateId) => {
      const candidate = state.tabsById.get(candidateId);
      return {
        tabId: candidateId,
        score: similarityScore(currentVector, tokenizeForSimilarity(candidate)),
        title: getTabDisplayInfo(candidate).title,
        workspaceName: getWorkspaceForTab(candidateId)?.name || "Unassigned"
      };
    })
    .filter((item) => item.score >= 0.28)
    .sort((left, right) => right.score - left.score);
}

function getTopicMatchResults(topic, { openOnly = true } = {}) {
  const queryTokens = tokenize(topic);
  const tabIds = openOnly ? state.orderedTabIds : [];
  return tabIds
    .map((tabId) => {
      const tab = state.tabsById.get(tabId);
      return {
        tabId,
        url: tab?.url || "",
        title: getTabDisplayInfo(tab).title,
        context: getWorkspaceForTab(tabId)?.name || "Unassigned",
        isOpen: true,
        score: similarityScore(queryTokens, tokenizeForSimilarity(tab))
      };
    })
    .filter((item) => item.score >= 0.14)
    .sort((left, right) => right.score - left.score);
}

function normalizeTypePhrase(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\btabs?\b/g, "")
    .replace(/\bpages?\b/g, "")
    .replace(/\bmy\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function findTabsByType(typePhrase) {
  const phrase = normalizeTypePhrase(typePhrase);
  if (!phrase) {
    return [];
  }

  const synonymMap = {
    handshake: ["joinhandshake", "handshake", "app.joinhandshake.com"],
    linkedin: ["linkedin"],
    github: ["github"],
    job: ["handshake", "linkedin", "indeed", "greenhouse", "lever", "wellfound"],
    jobs: ["handshake", "linkedin", "indeed", "greenhouse", "lever", "wellfound"],
    travel: ["airbnb", "booking", "delta", "united", "tripadvisor", "maps", "flight"],
    research: ["scholar", "arxiv", "pubmed", "paper", "research"],
    shopping: ["amazon", "etsy", "shop", "ebay"]
  };

  const phraseTokens = tokenize(phrase);
  const dictionaryTokens = dedupe(
    phraseTokens.flatMap((token) => synonymMap[token] || [token])
  );

  return state.orderedTabIds.filter((tabId) => {
    const tab = state.tabsById.get(tabId);
    if (!tab) {
      return false;
    }
    const info = getTabDisplayInfo(tab);
    const haystack = `${tab.url || ""} ${info.title} ${info.domain} ${getDisplayNoteForTab(tab)}`.toLowerCase();
    return dictionaryTokens.some((token) => haystack.includes(token));
  });
}

function computeSuggestedFoldersFromConnections() {
  const groups = [];
  const seen = new Set();

  state.orderedTabIds.forEach((tabId) => {
    if (seen.has(tabId)) {
      return;
    }
    const related = computeRelatedTabs(tabId)
      .filter((item) => item.score >= 0.32)
      .slice(0, 3);
    const cluster = dedupe([tabId, ...related.map((item) => item.tabId)]);
    if (cluster.length < 2) {
      return;
    }

    const tabs = cluster.map((id) => state.tabsById.get(id)).filter(Boolean);
    const topicTokens = dedupe(
      tabs.flatMap((tab) => tokenize(getSemanticText(tab)))
    ).filter((token) => !["page", "home", "article", "untitled", "tab", "open"].includes(token));
    const name = capitalize(topicTokens[0] || topicTokens[1] || "Research");
    if (findFolderByName(name)) {
      cluster.forEach((id) => seen.add(id));
      return;
    }

    groups.push({
      id: `${name}:${cluster.join(",")}`,
      name,
      tabIds: cluster,
      reason: topicTokens.slice(0, 3).join(", "),
      tabCount: cluster.length
    });
    cluster.forEach((id) => seen.add(id));
  });

  return groups
    .sort((left, right) => right.tabCount - left.tabCount)
    .slice(0, 5);
}

runtimeFns.renderConnections = function renderConnections() {
  const svg = dom.connectionsOverlay;
  if (!svg) {
    return;
  }
  svg.replaceChildren();
  if (!state.ai.relatedEnabled || !state.relatedLinesEnabled) {
    dom.connectionsStatus.textContent = "Off";
    return;
  }
  dom.connectionsStatus.textContent = "On";
  const pairs = [];
  state.orderedTabIds.forEach((tabId) => {
    computeRelatedTabs(tabId)
      .slice(0, 1)
      .forEach((related) => {
        if (tabId < related.tabId) {
          pairs.push({ from: tabId, to: related.tabId, score: related.score });
        }
      });
  });
  const rootRect = dom.deskScroll.getBoundingClientRect();
  svg.setAttribute("width", String(rootRect.width));
  svg.setAttribute("height", String(Math.max(dom.deskScroll.scrollHeight, rootRect.height)));
  pairs
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .forEach((pair) => {
      const fromCard = state.cardElements.get(pair.from);
      const toCard = state.cardElements.get(pair.to);
      if (!fromCard || !toCard || fromCard.classList.contains("hidden") || toCard.classList.contains("hidden")) {
        return;
      }
      const fromRect = fromCard.getBoundingClientRect();
      const toRect = toCard.getBoundingClientRect();
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", String(fromRect.left - rootRect.left + fromRect.width / 2));
      line.setAttribute("y1", String(fromRect.top - rootRect.top + dom.deskScroll.scrollTop + fromRect.height / 2));
      line.setAttribute("x2", String(toRect.left - rootRect.left + toRect.width / 2));
      line.setAttribute("y2", String(toRect.top - rootRect.top + dom.deskScroll.scrollTop + toRect.height / 2));
      svg.appendChild(line);
    });
};

function parseTimeWindow(query) {
  const lower = query.toLowerCase();
  const now = new Date();

  function buildSegmentRange(baseDate, labelBase, segment) {
    const segments = {
      morning: { startHour: 6, endHour: 12, label: `${labelBase} morning` },
      afternoon: { startHour: 12, endHour: 17, label: `${labelBase} afternoon` },
      evening: { startHour: 17, endHour: 21, label: `${labelBase} evening` },
      night: { startHour: 20, endHour: 24, label: `${labelBase} night` },
      lunchtime: { startHour: 11, endHour: 14, label: `${labelBase} lunchtime` }
    };
    const selected = segments[segment];
    if (!selected) {
      return null;
    }
    const start = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), selected.startHour).getTime();
    const end = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), selected.endHour, 0, 0, 0).getTime() - 1;
    return {
      label: selected.label,
      start,
      end
    };
  }

  function resolveDayReference() {
    if (lower.includes("yesterday")) {
      const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      return { date, label: "yesterday" };
    }
    if (lower.includes("today") || lower.includes("this morning") || lower.includes("this afternoon") || lower.includes("this evening")) {
      const date = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return { date, label: "today" };
    }
    const weekdayIndex = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"].findIndex((day) =>
      lower.includes(day)
    );
    if (weekdayIndex !== -1) {
      const target = new Date(now);
      while (target.getDay() !== weekdayIndex) {
        target.setDate(target.getDate() - 1);
      }
      return {
        date: new Date(target.getFullYear(), target.getMonth(), target.getDate()),
        label: target.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" })
      };
    }
    return null;
  }

  const minutesAgoMatch = lower.match(/(\d+)\s+minutes?\s+ago/);
  if (minutesAgoMatch) {
    const minutes = Number(minutesAgoMatch[1]);
    const target = Date.now() - minutes * 60 * 1000;
    const spread = Math.max(5 * 60 * 1000, Math.min(20 * 60 * 1000, minutes * 60 * 1000 * 0.35));
    return {
      label: `around ${minutes} minute${minutes === 1 ? "" : "s"} ago`,
      start: target - spread,
      end: target + spread
    };
  }

  const hoursAgoMatch = lower.match(/(\d+)\s+hours?\s+ago/);
  if (hoursAgoMatch) {
    const hours = Number(hoursAgoMatch[1]);
    const target = Date.now() - hours * 60 * 60 * 1000;
    const spread = Math.max(20 * 60 * 1000, Math.min(90 * 60 * 1000, hours * 60 * 60 * 1000 * 0.35));
    return {
      label: `around ${hours} hour${hours === 1 ? "" : "s"} ago`,
      start: target - spread,
      end: target + spread
    };
  }

  if (lower.includes("last hour")) {
    return {
      label: "the last hour",
      start: Date.now() - 60 * 60 * 1000,
      end: Date.now()
    };
  }

  if (lower.includes("the other day")) {
    return {
      label: "the other day",
      start: Date.now() - 3 * 24 * 60 * 60 * 1000,
      end: Date.now() - 24 * 60 * 60 * 1000
    };
  }

  if (lower.includes("earlier today")) {
    return {
      label: "earlier today",
      start: new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime(),
      end: Date.now() - 45 * 60 * 1000
    };
  }

  const dayReference = resolveDayReference();
  if (dayReference) {
    if (/\blunch|lunchtime|noon\b/.test(lower)) {
      return buildSegmentRange(dayReference.date, dayReference.label, "lunchtime");
    }
    if (/\bmorning\b/.test(lower)) {
      return buildSegmentRange(dayReference.date, dayReference.label, "morning");
    }
    if (/\bafternoon\b/.test(lower)) {
      return buildSegmentRange(dayReference.date, dayReference.label, "afternoon");
    }
    if (/\bevening\b/.test(lower)) {
      return buildSegmentRange(dayReference.date, dayReference.label, "evening");
    }
    if (/\bnight\b/.test(lower)) {
      return buildSegmentRange(dayReference.date, dayReference.label, "night");
    }
  }

  if (lower.includes("today")) {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    return { label: "today", start, end: Date.now() };
  }

  if (lower.includes("yesterday")) {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).getTime();
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() - 1;
    return { label: "yesterday", start, end };
  }

  if (lower.includes("last week") || lower.includes("past week")) {
    return {
      label: "the last week",
      start: Date.now() - 7 * 24 * 60 * 60 * 1000,
      end: Date.now()
    };
  }

  if (dayReference) {
    const start = new Date(dayReference.date.getFullYear(), dayReference.date.getMonth(), dayReference.date.getDate()).getTime();
    const end = start + 24 * 60 * 60 * 1000 - 1;
    return {
      label: dayReference.label,
      start,
      end
    };
  }

  return null;
}

function getTimeScopedMatches(range) {
  const openTabIds = state.orderedTabIds.filter((tabId) => {
    const meta = state.liveTabMeta[tabId];
    const timestamps = [meta?.openedAt, meta?.lastTouchedAt].filter(Number.isFinite);
    return timestamps.some((value) => value >= range.start && value <= range.end);
  });

  const historyMatches = state.tabHistory
    .filter((entry) => {
      const timestamps = [entry.openedAt, entry.lastTouchedAt, entry.closedAt].filter(Number.isFinite);
      return timestamps.some((value) => value >= range.start && value <= range.end);
    })
    .sort((left, right) => (right.lastTouchedAt || right.openedAt) - (left.lastTouchedAt || left.openedAt));

  return { openTabIds, historyMatches };
}

async function getBrowserHistoryMatches(range) {
  if (!extensionApisAvailable || !chrome.history?.search) {
    return [];
  }

  try {
    const items = await chrome.history.search({
      text: "",
      startTime: range.start,
      endTime: range.end,
      maxResults: 100
    });

    return dedupeByKey(
      items
        .filter((item) => item?.url)
        .map((item) => ({
          url: item.url,
          title: item.title || item.url,
          domain: safeHostname(item.url),
          lastVisitTime: Number.isFinite(item.lastVisitTime) ? item.lastVisitTime : range.end
        }))
        .sort((left, right) => right.lastVisitTime - left.lastVisitTime),
      "url"
    );
  } catch (error) {
    console.error("Unable to read Chrome history", error);
    return [];
  }
}

function buildTimeRangeResults(range, rememberedMatches, browserHistoryMatches) {
  const openTabsByUrl = new Map(
    state.orderedTabIds
      .map((tabId) => [state.tabsById.get(tabId)?.url, tabId])
      .filter(([url, tabId]) => url && Number.isInteger(tabId))
  );

  const rememberedResults = buildHistoryPreviewResults(rememberedMatches).map((item) => ({
    ...item,
    source: "memory",
    visitedAt: null
  }));

  const historyResults = browserHistoryMatches.map((item) => ({
    tabId: openTabsByUrl.get(item.url) || null,
    url: item.url,
    title: item.title,
    context: item.domain,
    isOpen: openTabsByUrl.has(item.url),
    source: "history",
    visitedAt: item.lastVisitTime
  }));

  return dedupeByKey(
    [...rememberedResults, ...historyResults].sort((left, right) => (right.visitedAt || 0) - (left.visitedAt || 0)),
    "url"
  ).slice(0, 12);
}

function findTabOpenedAfterReference(referenceText) {
  const needle = referenceText.toLowerCase().trim();
  if (!needle) {
    return null;
  }

  const entries = state.tabHistory
    .slice()
    .sort((left, right) => left.openedAt - right.openedAt);

  const referenceIndex = [...entries]
    .reverse()
    .findIndex((entry) => {
      const haystack = `${entry.title} ${entry.domain} ${entry.url}`.toLowerCase();
      return haystack.includes(needle);
    });

  if (referenceIndex === -1) {
    return null;
  }

  const actualIndex = entries.length - 1 - referenceIndex;
  const next = entries[actualIndex + 1];
  if (!next) {
    return null;
  }

  const openTabId = state.orderedTabIds.find((tabId) => state.tabsById.get(tabId)?.url === next.url) || null;
  return {
    tabId: openTabId,
    url: next.url,
    title: next.title,
    context: next.folderName || next.domain || "Remembered tab",
    isOpen: Boolean(openTabId),
    openedAt: next.openedAt
  };
}

function getOpenTabIdsForHistoryResults(results) {
  const resultUrls = new Set(results.map((item) => item.url).filter(Boolean));
  return state.orderedTabIds.filter((tabId) => resultUrls.has(state.tabsById.get(tabId)?.url));
}

function buildHistoryPreviewResults(historyMatches) {
  const openUrls = new Set([...state.tabsById.values()].map((tab) => tab.url).filter(Boolean));
  return historyMatches.slice(0, 8).map((entry) => ({
    tabId: state.orderedTabIds.find((candidateId) => state.tabsById.get(candidateId)?.url === entry.url) || null,
    url: entry.url,
    title: entry.title,
    context: entry.folderName || entry.domain || "Remembered tab",
    isOpen: openUrls.has(entry.url)
  }));
}

function inferFolderNameFromDomains(domains) {
  const joined = domains.join(" ").toLowerCase();
  if (/github|gitlab|linear|jira|vercel|localhost/.test(joined)) {
    return "Code Review";
  }
  if (/linkedin|indeed|greenhouse|lever|wellfound/.test(joined)) {
    return "Career";
  }
  if (/airbnb|delta|united|google flights|booking|tripadvisor/.test(joined)) {
    return "Travel";
  }
  if (/docs|notion|drive|figma|slack/.test(joined)) {
    return "Planning";
  }
  return capitalize(domains[0] || "Research");
}

const ASSISTANT_STOP_WORDS = new Set([
  "all",
  "and",
  "around",
  "can",
  "called",
  "did",
  "everything",
  "find",
  "folder",
  "from",
  "had",
  "have",
  "help",
  "here",
  "into",
  "keep",
  "looking",
  "look",
  "make",
  "me",
  "my",
  "named",
  "open",
  "organize",
  "put",
  "save",
  "show",
  "sites",
  "some",
  "something",
  "stuff",
  "tabs",
  "that",
  "the",
  "them",
  "these",
  "those",
  "to",
  "up",
  "was",
  "what"
]);

function setAssistantQuestion(title, body, followUp) {
  state.assistantFollowUp = followUp;
  state.commandPreview = {
    type: "info",
    title,
    body
  };
  applySearch();
}

function clearAssistantFollowUp() {
  state.assistantFollowUp = null;
}

function extractFolderNameFromQuery(query) {
  const patterns = [
    /(?:folder|drawer)\s+(?:called|named)\s+["“]?([^"”]+?)["”]?\s*$/i,
    /(?:called|named)\s+["“]?([^"”]+?)["”]?\s*$/i,
    /(?:into|in|to)\s+(?:a\s+new\s+|a\s+|an\s+)?(?:folder|drawer)\s+["“]?([^"”]+?)["”]?\s*$/i,
    /(?:into|in|to)\s+["“]?([^"”]+?)["”]?\s*$/i
  ];

  for (const pattern of patterns) {
    const match = query.match(pattern);
    const value = match?.[1]?.trim();
    if (value) {
      return value.replace(/[.?!]+$/g, "").trim();
    }
  }
  return "";
}

function stripQuotedText(value) {
  return value.replace(/["“][^"”]+["”]/g, " ");
}

function extractTopicFromQuery(query) {
  const normalized = stripQuotedText(query)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ");

  const targetedPatterns = [
    /related\s+to\s+(.+)$/i,
    /about\s+(.+)$/i,
    /those\s+(.+?)\s+(?:sites|tabs|pages)/i,
    /these\s+(.+?)\s+(?:sites|tabs|pages)/i,
    /for\s+(?:those\s+|these\s+)?(.+?)\s+(?:sites|tabs|pages)$/i,
    /all\s+(?:my\s+)?(.+?)\s+tabs?$/i,
    /all\s+(?:my\s+)?(.+?)\s+into/i
  ];

  for (const pattern of targetedPatterns) {
    const match = query.match(pattern);
    const topic = match?.[1]?.trim();
    if (topic) {
      return topic.replace(/[.?!]+$/g, "").trim();
    }
  }

  const tokens = tokenize(normalized).filter((token) => !ASSISTANT_STOP_WORDS.has(token));
  return tokens.slice(0, 4).join(" ");
}

function inferLikelyFolderName(topic) {
  const cleaned = String(topic || "")
    .replace(/\b(?:sites|tabs|pages)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  return capitalize(cleaned || "Research");
}

function likelyRequestsCurrentTabs(lower) {
  return /(?:everything|all)\s+(?:i\s+have\s+)?open|all\s+open\s+tabs|current\s+tabs|what'?s\s+open\s+right\s+now/.test(lower);
}

function likelyRequestsOrganization(lower) {
  return /\b(organize|sort|group|dump|put|move|gather|save)\b/.test(lower) || /make a folder/.test(lower);
}

function likelyRequestsHistory(lower) {
  return /\b(show|find|surface|remember|what was i|what did i|what had i|what were my)\b/.test(lower) || Boolean(parseTimeWindow(lower));
}

function likelyRequestsSequence(lower) {
  return /\bafter\b/.test(lower) && /\b(open|opened|tab)\b/.test(lower);
}

function buildTopicTabIds(topic) {
  const semanticMatches = getTopicMatchResults(topic).map((item) => item.tabId);
  return dedupe([...findTabsByType(topic), ...semanticMatches]).filter((tabId) => Number.isInteger(tabId));
}

function maybeInferFolderSuggestionFromTopic(topic, tabIds) {
  if (!tabIds.length) {
    return inferLikelyFolderName(topic);
  }
  const domains = dedupe(
    tabIds
      .map((tabId) => state.tabsById.get(tabId))
      .filter(Boolean)
      .map((tab) => safeHostname(tab.url))
      .filter(Boolean)
  );
  return inferFolderNameFromDomains(domains) || inferLikelyFolderName(topic);
}

function resolveTimeOnlyFollowUp(answer, baseIntent) {
  const range = parseTimeWindow(answer);
  if (!range) {
    return {
      ask: {
        title: "Quick check",
        body: "I still need a clearer time, like yesterday, Tuesday afternoon, or last hour.",
        followUp: baseIntent
      }
    };
  }
  return {
    intent: {
      ...baseIntent,
      timeRange: range
    }
  };
}

function resolveAssistantFollowUp(answer) {
  const followUp = state.assistantFollowUp;
  if (!followUp) {
    return null;
  }

  if (followUp.type === "need-time-range") {
    return resolveTimeOnlyFollowUp(answer, followUp.baseIntent);
  }

  if (followUp.type === "need-folder-name") {
    const folderName = extractFolderNameFromQuery(answer) || answer.trim();
    if (!folderName) {
      return {
        ask: {
          title: "Quick check",
          body: "What should I call the folder?",
          followUp
        }
      };
    }
    return {
      intent: {
        ...followUp.baseIntent,
        folderName
      }
    };
  }

  return null;
}

function resolveAssistantIntent(query) {
  const lower = query.toLowerCase().trim();
  const timeRange = parseTimeWindow(lower);
  const folderName = extractFolderNameFromQuery(query);
  const topic = extractTopicFromQuery(query);

  if (lower.includes("close all the tabs i haven't touched in a week")) {
    return { type: "stale-preview" };
  }

  if (likelyRequestsSequence(lower)) {
    const match =
      query.match(/after\s+(.+)$/i) ||
      query.match(/what\s+came\s+after\s+(.+)$/i) ||
      query.match(/what\s+did\s+i\s+open\s+after\s+(.+)$/i);
    const reference = match?.[1]?.trim();
    if (reference) {
      return { type: "sequence", reference };
    }
  }

  if (likelyRequestsOrganization(lower) && likelyRequestsCurrentTabs(lower)) {
    if (!folderName) {
      return {
        ask: {
          title: "Quick check",
          body: "What should I call that folder?",
          followUp: {
            type: "need-folder-name",
            baseIntent: { type: "organize-current" }
          }
        }
      };
    }
    return { type: "organize-current", folderName };
  }

  if (likelyRequestsOrganization(lower) && timeRange) {
    if (!folderName) {
      return {
        ask: {
          title: "Quick check",
          body: "What should I call the folder for those tabs?",
          followUp: {
            type: "need-folder-name",
            baseIntent: { type: "organize-time", timeRange }
          }
        }
      };
    }
    return { type: "organize-time", timeRange, folderName };
  }

  if (likelyRequestsOrganization(lower) && /\b(before|earlier|from before)\b/.test(lower) && !timeRange) {
    return {
      ask: {
        title: "Quick check",
        body: "Before today, or from a specific day?",
        followUp: {
          type: "need-time-range",
          baseIntent: folderName ? { type: "organize-time", folderName } : { type: "history-search" }
        }
      }
    };
  }

  if (likelyRequestsHistory(lower) && timeRange) {
    return { type: "history-search", timeRange };
  }

  if (likelyRequestsHistory(lower) && /\b(before|earlier|from before)\b/.test(lower) && !timeRange) {
    return {
      ask: {
        title: "Quick check",
        body: "Before today, or from a specific day?",
        followUp: {
          type: "need-time-range",
          baseIntent: { type: "history-search" }
        }
      }
    };
  }

  if (likelyRequestsOrganization(lower) && topic) {
    return {
      type: "organize-topic",
      topic,
      folderName: folderName || ""
    };
  }

  if ((/\brelated\b/.test(lower) || /\babout\b/.test(lower) || /\bcooking\b/.test(lower) || /\bdance\b/.test(lower)) && topic) {
    return { type: "related-topic", topic };
  }

  if (/make a folder/.test(lower) && topic) {
    return {
      type: "organize-topic",
      topic,
      folderName: folderName || inferLikelyFolderName(topic)
    };
  }

  if (/^make\s+(?:a\s+)?folder(?:\s+called|\s+named)?\s+/i.test(query) && folderName) {
    return { type: "create-empty-folder", folderName };
  }

  if (topic) {
    return { type: "related-topic", topic };
  }

  return { type: "unknown" };
}

async function executeAssistantIntent(intent, query) {
  if (intent.type === "history-search") {
    const rememberedMatches = getTimeScopedMatches(intent.timeRange);
    const browserHistoryMatches = await getBrowserHistoryMatches(intent.timeRange);
    const results = buildTimeRangeResults(intent.timeRange, rememberedMatches.historyMatches, browserHistoryMatches);
    const openTabIds = dedupe([
      ...rememberedMatches.openTabIds,
      ...getOpenTabIdsForHistoryResults(results)
    ]);
    state.commandPreview = {
      type: "history-results",
      title: `Here’s what I found from ${intent.timeRange.label}`,
      body: results.length
        ? "Open matches are filtered in the desk below, and the other matching pages are listed here."
        : "I couldn't find matching pages for that time window yet. Try a different time or a broader range.",
      results,
      filter: openTabIds.length
        ? { type: "tab-ids", tabIds: openTabIds }
        : { type: "history-urls", urls: results.map((item) => item.url).filter(Boolean) }
    };
    applySearch();
    return;
  }

  if (intent.type === "stale-preview") {
    const staleTabIds = state.orderedTabIds.filter((tabId) => {
      const touched = getLastTouchedForTab(tabId);
      return touched && touched <= Date.now() - 7 * 24 * 60 * 60 * 1000;
    });
    state.commandPreview = {
      type: "confirm-close",
      title: `Close ${staleTabIds.length} stale tabs?`,
      body: staleTabIds.length
        ? "Preview these tabs below, then confirm if you want to close them."
        : "Nothing open looks stale enough to close right now.",
      tabIds: staleTabIds
    };
    applySearch();
    return;
  }

  if (intent.type === "organize-current") {
    const folder = addTabsToFolder([...state.orderedTabIds], intent.folderName, /trip|travel|tokyo/i.test(intent.folderName) ? "amber" : null);
    if (folder) {
      state.commandPreview = {
        type: "info",
        title: `${state.orderedTabIds.length} tabs organized into ${folder.name}`,
        body: "I gathered everything you have open into that folder."
      };
      applySearch();
    }
    return;
  }

  if (intent.type === "organize-time") {
    const matches = getTimeScopedMatches(intent.timeRange);
    if (!matches.openTabIds.length) {
      state.commandPreview = {
        type: "info",
        title: `No open tabs match ${intent.timeRange.label}`,
        body: "I found remembered activity there, but none of those tabs are open right now to move."
      };
      applySearch();
      return;
    }
    const folder = addTabsToFolder(matches.openTabIds, intent.folderName);
    if (folder) {
      state.commandPreview = {
        type: "info",
        title: `${matches.openTabIds.length} tabs added to ${folder.name}`,
        body: `I used the tabs that match ${intent.timeRange.label}.`
      };
      applySearch();
    }
    return;
  }

  if (intent.type === "organize-topic") {
    const tabIds = buildTopicTabIds(intent.topic);
    if (!tabIds.length) {
      state.commandPreview = {
        type: "info",
        title: `I couldn't find open tabs for ${intent.topic}`,
        body: "Try a broader topic or open a few more tabs on that subject first."
      };
      applySearch();
      return;
    }
    const resolvedFolderName = intent.folderName || maybeInferFolderSuggestionFromTopic(intent.topic, tabIds);
    const folder = addTabsToFolder(tabIds, resolvedFolderName);
    if (folder) {
      const inferred = !intent.folderName;
      state.commandPreview = {
        type: "info",
        title: `${tabIds.length} tabs organized into ${folder.name}`,
        body: inferred
          ? `I grouped the tabs that looked related to ${intent.topic} there. If you want a different name, I can change it.`
          : `I grouped the tabs that looked related to ${intent.topic} there.`
      };
      applySearch();
    }
    return;
  }

  if (intent.type === "related-topic") {
    const related = getTopicMatchResults(intent.topic);
    state.commandPreview = {
      type: "semantic-results",
      title: related.length ? `Tabs related to ${intent.topic}` : `I couldn't find open tabs related to ${intent.topic}`,
      body: related.length
        ? "These look like the closest open matches."
        : "Try a broader topic, or ask me about a time window instead.",
      results: related
    };
    if (related.length) {
      state.commandPreview.filter = { type: "semantic", tabIds: related.map((item) => item.tabId) };
      applySearch();
    } else {
      applySearch();
    }
    return;
  }

  if (intent.type === "sequence") {
    const result = findTabOpenedAfterReference(intent.reference);
    state.commandPreview = {
      type: result ? "history-results" : "info",
      title: result ? `Here’s what came after ${intent.reference}` : `I couldn't trace what came after ${intent.reference}`,
      body: result
        ? "This is the next tab I saw in your browsing sequence."
        : "Try a site or tab name I’ve seen before, like GitHub or Handshake.",
      results: result ? [result] : undefined,
      filter: result?.tabId ? { type: "tab-ids", tabIds: [result.tabId] } : undefined
    };
    if (result?.tabId) {
      applySearch();
    } else {
      applySearch();
    }
    return;
  }

  if (intent.type === "create-empty-folder") {
    const folder = createFolder(intent.folderName, /trip|travel|tokyo/i.test(intent.folderName) ? "amber" : null);
    state.commandPreview = {
      type: "info",
      title: `${folder.name} is ready`,
      body: "Your new folder is ready for tabs."
    };
    applySearch();
    return;
  }

  const semanticPrompt = /what was that|article about|last month|that tab/i.test(query);
  if (semanticPrompt) {
    const candidates = searchSemanticMemories(query);
    state.commandPreview = {
      type: "semantic-results",
      title: candidates.length ? "Closest matches" : "No strong matches yet",
      body: candidates.length
        ? "These are the tabs and remembered pages that seem closest to what you meant."
        : "Try a more specific topic or a time reference like yesterday afternoon.",
      results: candidates
    };
    if (candidates.length) {
      state.commandPreview.filter = { type: "semantic", tabIds: candidates.filter((item) => item.isOpen).map((item) => item.tabId) };
      applySearch();
    } else {
      applySearch();
    }
    return;
  }

  state.commandPreview = {
    type: "info",
    title: "I’m not fully sure what you meant",
    body: "I can help find tabs by time, group open tabs into a folder, gather tabs around a topic, or trace what came after a tab you remember."
  };
  applySearch();
}

function maybeSuggestFolderCluster() {
  return;
}

runtimeFns.runCommand = async function runCommand(rawQuery) {
  const query = rawQuery.trim();
  state.commandQuery = query;
  if (!query) {
    clearAssistantFollowUp();
    state.commandPreview = null;
    renderCommandPreview();
    applySearch();
    return;
  }
  const followUpResolution = resolveAssistantFollowUp(query);
  if (followUpResolution?.ask) {
    setAssistantQuestion(
      followUpResolution.ask.title,
      followUpResolution.ask.body,
      followUpResolution.ask.followUp
    );
    return;
  }
  if (followUpResolution?.intent) {
    clearAssistantFollowUp();
    await executeAssistantIntent(followUpResolution.intent, query);
    return;
  }

  clearAssistantFollowUp();
  const intent = resolveAssistantIntent(query);
  if (intent.ask) {
    setAssistantQuestion(intent.ask.title, intent.ask.body, intent.ask.followUp);
    return;
  }
  await executeAssistantIntent(intent, query);
};

function renderCommandPreview() {
  const preview = state.commandPreview;
  dom.commandPreview.classList.toggle("hidden", !preview);
  if (!preview) {
    dom.commandPreview.replaceChildren();
    return;
  }
  dom.commandPreview.replaceChildren();
  const header = document.createElement("div");
  header.className = "command-preview-header";
  header.innerHTML = `<strong>${escapeHtml(preview.title)}</strong>`;
  const clear = document.createElement("button");
  clear.type = "button";
  clear.textContent = "Clear";
  clear.addEventListener("click", () => {
    state.commandPreview = null;
    state.activeFilterLabel = "";
    applySearch();
  });
  header.appendChild(clear);
  dom.commandPreview.appendChild(header);

  const body = document.createElement("div");
  body.className = "command-preview-body";
  body.textContent = preview.body;
  dom.commandPreview.appendChild(body);

  if (preview.type === "confirm-close" && preview.tabIds?.length) {
    const list = buildTabListPreview(preview.tabIds);
    const actions = document.createElement("div");
    actions.className = "command-preview-actions";
    const confirm = document.createElement("button");
    confirm.type = "button";
    confirm.textContent = "Close these tabs";
    confirm.addEventListener("click", () => {
      closeTabs(preview.tabIds);
      state.commandPreview = null;
      renderCommandPreview();
    });
    actions.appendChild(confirm);
    dom.commandPreview.append(list, actions);
  }

  if (preview.type === "semantic-results" && preview.results?.length) {
    const list = document.createElement("div");
    list.className = "command-preview-list";
    preview.results.forEach((result) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = `${result.title} · ${result.context}`;
      button.addEventListener("click", async () => {
        if (result.isOpen) {
          await switchToTab(result.tabId);
        } else if (result.url) {
          await chrome.tabs.create({ url: result.url, active: true });
        }
      });
      list.appendChild(button);
    });
    dom.commandPreview.appendChild(list);
  }

  if (preview.type === "history-results" && preview.results?.length) {
    const list = document.createElement("div");
    list.className = "command-preview-list";
    preview.results.forEach((result) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = `${result.title} · ${result.context}`;
      button.addEventListener("click", async () => {
        if (result.isOpen && result.tabId) {
          await switchToTab(result.tabId);
        } else if (result.url) {
          await chrome.tabs.create({ url: result.url, active: true });
        }
      });
      list.appendChild(button);
    });
    dom.commandPreview.appendChild(list);
  }

  if (preview.type === "folder-suggestion" && preview.suggestion) {
    const actions = document.createElement("div");
    actions.className = "command-preview-actions";

    const accept = document.createElement("button");
    accept.type = "button";
    accept.textContent = `Create ${preview.suggestion.name}`;
    accept.addEventListener("click", () => {
      const folder = addTabsToFolder(preview.suggestion.tabIds, preview.suggestion.name);
      if (folder) {
        state.commandPreview = {
          type: "info",
          title: `${folder.name} created`,
          body: "I grouped the suggested tabs there. You can rename it anytime."
        };
        renderCommandPreview();
      }
    });

    const dismiss = document.createElement("button");
    dismiss.type = "button";
    dismiss.textContent = "Ignore";
    dismiss.addEventListener("click", () => {
      state.proactiveSuggestionDismissals[preview.suggestion.signature] = true;
      state.commandPreview = null;
      renderCommandPreview();
    });

    actions.append(accept, dismiss);
    dom.commandPreview.appendChild(actions);
  }

  if (preview.type === "folder-ideas" && preview.suggestions?.length) {
    const list = document.createElement("div");
    list.className = "command-preview-list";
    preview.suggestions.forEach((suggestion) => {
      const row = document.createElement("div");
      row.className = "command-preview-actions";
      const label = document.createElement("button");
      label.type = "button";
      label.textContent = `${suggestion.name} · ${suggestion.tabCount} tabs · ${suggestion.reason}`;
      label.addEventListener("click", () => {
        suggestion.tabIds[0] && state.cardElements.get(suggestion.tabIds[0])?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
      const create = document.createElement("button");
      create.type = "button";
      create.textContent = "Create Folder";
      create.addEventListener("click", () => {
        const folder = addTabsToFolder(suggestion.tabIds, suggestion.name);
        if (folder) {
          state.commandPreview = {
            type: "info",
            title: `${folder.name} created`,
            body: `Grouped ${suggestion.tabCount} related tabs into that folder.`
          };
          renderCommandPreview();
        }
      });
      row.append(label, create);
      list.appendChild(row);
    });
    dom.commandPreview.appendChild(list);
  }
}

function buildTabListPreview(tabIds) {
  const list = document.createElement("div");
  list.className = "command-preview-list";
  tabIds.forEach((tabId) => {
    const tab = state.tabsById.get(tabId);
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = `${getTabDisplayInfo(tab).title} · ${getTabDisplayInfo(tab).domain}`;
    button.addEventListener("click", () => switchToTab(tabId));
    list.appendChild(button);
  });
  return list;
}

function searchSemanticMemories(query) {
  const queryTokens = tokenize(query);
  const openResults = state.orderedTabIds.map((tabId) => {
    const tab = state.tabsById.get(tabId);
    return {
      tabId,
      url: tab?.url || "",
      title: getTabDisplayInfo(tab).title,
      context: getWorkspaceForTab(tabId)?.name || "Unassigned",
      isOpen: true,
      score: similarityScore(queryTokens, tokenizeForSimilarity(tab))
    };
  });

  const memoryResults = Object.entries(state.urlInsights).map(([url, insight]) => ({
    tabId: null,
    url,
    title: insight.title || url,
    context: insight.domain || "Remembered page",
    isOpen: false,
    score: similarityScore(queryTokens, tokenize(`${insight.title} ${insight.noteText || ""} ${insight.summaryText || ""} ${insight.domain || ""}`))
  }));

  const historyResults = state.tabHistory.map((entry) => ({
    tabId: null,
    url: entry.url,
    title: entry.title,
    context: entry.folderName || entry.domain || "Remembered tab",
    isOpen: false,
    score: similarityScore(queryTokens, tokenize(`${entry.title} ${entry.folderName || ""} ${entry.domain || ""}`))
  }));

  return [...openResults, ...memoryResults, ...historyResults]
    .filter((item) => item.score > 0.14)
    .sort((left, right) => right.score - left.score)
    .slice(0, 6);
}

function showToast(message, options = {}) {
  const toast = document.createElement("div");
  toast.className = "toast";
  if (options.color) {
    toast.style.borderColor = getWorkspaceColorValue(options.color);
  }
  if (options.color || options.dotColor) {
    const dot = document.createElement("span");
    dot.className = "toast-dot";
    dot.style.background = options.dotColor || getWorkspaceColorValue(options.color);
    toast.appendChild(dot);
  }
  const text = document.createElement("span");
  text.textContent = message;
  toast.appendChild(text);
  if (options.actionLabel && options.onAction) {
    const action = document.createElement("button");
    action.type = "button";
    action.textContent = options.actionLabel;
    action.addEventListener("click", () => {
      options.onAction();
      toast.remove();
    });
    toast.appendChild(action);
  }
  dom.toastStack.prepend(toast);
  setTimeout(() => toast.classList.add("fade-out"), options.duration || 2500);
  setTimeout(() => toast.remove(), (options.duration || 2500) + 320);
}

function showWorkspaceCreatedToast(name, color) {
  showToast(`${name} created`, { color, dotColor: getWorkspaceColorValue(color), duration: 2500 });
}

function updateEmptyState() {
  const hasVisible = [...state.cardElements.values()].some((card) => !card.classList.contains("hidden"));
  const shouldShow = state.tabsById.size === 0 || !hasVisible;
  dom.emptyState.classList.toggle("hidden", !shouldShow);
}

function getWorkspace(workspaceId) {
  return state.workspaces.find((workspace) => workspace.id === workspaceId) || null;
}

function getWorkspaceForTab(tabId) {
  return state.workspaces.find((workspace) => workspace.tabIds.includes(tabId)) || null;
}

function getUnassignedTabIds() {
  const assigned = new Set(state.workspaces.flatMap((workspace) => workspace.tabIds));
  return state.orderedTabIds.filter((tabId) => !assigned.has(tabId));
}

function getVisibleTabIds(tabIds) {
  return tabIds.filter(matchesSearch);
}

function getDraggedTabIds(tabId) {
  if (state.selectedTabIds.has(tabId) && state.selectedTabIds.size > 1) {
    return [...state.selectedTabIds];
  }
  return [tabId];
}

function removeCardMappingsForWorkspace(workspaceId) {
  state.cardElements.forEach((card, tabId) => {
    if (card.dataset.workspaceId === workspaceId) {
      state.cardElements.delete(tabId);
    }
  });
}

function clearCardMappingsForWorkspace(workspaceId) {
  removeCardMappingsForWorkspace(workspaceId);
}

function getTabDisplayInfo(tab) {
  if (!tab) {
    return { title: "Missing Tab", domain: "Unavailable" };
  }
  const url = tab.url || "";
  if (url === "chrome://newtab/" || url === "about:newtab") {
    return { title: "New Tab", domain: "chrome://newtab" };
  }
  if (url.startsWith("file://")) {
    const filename = decodeURIComponent(url.split("/").pop() || "Local File");
    return {
      title: tab.title || filename,
      domain: filename
    };
  }
  try {
    const parsed = new URL(url);
    return {
      title: tab.title || parsed.hostname.replace(/^www\./, ""),
      domain: parsed.hostname.replace(/^www\./, "")
    };
  } catch (error) {
    return { title: tab.title || "Untitled Tab", domain: url || "Unknown" };
  }
}

function safeHostname(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch (error) {
    return url || "this page";
  }
}

function tokenize(value) {
  return String(value || "")
    .toLowerCase()
    .split(/[^a-z0-9]+/g)
    .filter((token) => token.length >= 3)
    .slice(0, 60);
}

function tokenizeForSimilarity(tab) {
  if (!tab) {
    return [];
  }
  return tokenize(getSemanticText(tab));
}

function similarityScore(leftTokens, rightTokens) {
  const leftSet = new Set(leftTokens);
  const rightSet = new Set(rightTokens);
  const intersection = [...leftSet].filter((token) => rightSet.has(token)).length;
  if (!leftSet.size || !rightSet.size || !intersection) {
    return 0;
  }
  return intersection / Math.sqrt(leftSet.size * rightSet.size);
}

function getFaviconUrl(tab) {
  if (tab?.favIconUrl) {
    return tab.favIconUrl;
  }
  return createFallbackFavicon(getTabDisplayInfo(tab).title.charAt(0).toUpperCase() || "T");
}

function createFallbackFavicon(letter) {
  const safe = escapeHtml(letter);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48"><rect width="48" height="48" rx="10" fill="#1a1a2e"/><text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" fill="#f5f0e8" font-size="24" font-family="DM Sans">${safe}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function getDuplicateCount(tab) {
  if (!tab?.url || !state.duplicateUrls.has(tab.url)) {
    return 1;
  }
  let count = 0;
  state.tabsById.forEach((candidate) => {
    if (candidate.url === tab.url) {
      count += 1;
    }
  });
  return count;
}

function normalizeWorkspaceColor(value) {
  if (isColorToken(value)) {
    return value;
  }
  return COLOR_OPTIONS.some((option) => option.id === value) ? value : "terracotta";
}

function isColorToken(value) {
  return typeof value === "string" && (/^#[0-9a-fA-F]{6}$/.test(value) || COLOR_OPTIONS.some((option) => option.id === value));
}

function resolveWorkspaceHex(value) {
  if (/^#[0-9a-fA-F]{6}$/.test(value || "")) {
    return value;
  }
  return COLOR_OPTIONS.find((option) => option.id === value)?.value || "#c96f57";
}

function getWorkspaceColorValue(value) {
  if (/^#[0-9a-fA-F]{6}$/.test(value || "")) {
    return value;
  }
  return `var(--${value || "terracotta"})`;
}

function sanitizeHex(value, fallback) {
  return /^#[0-9a-fA-F]{6}$/.test(value || "") ? value : fallback;
}

function getThemePreset(id) {
  return THEME_PRESETS.find((preset) => preset.id === id) || THEME_PRESETS[0];
}

function createDraftWorkspace(name) {
  return {
    id: crypto.randomUUID(),
    name,
    color: "terracotta"
  };
}

function uniqueWorkspaceName(name) {
  if (!state.workspaces.some((workspace) => workspace.name === name)) {
    return name;
  }
  let index = 2;
  while (state.workspaces.some((workspace) => workspace.name === `${name} (${index})`)) {
    index += 1;
  }
  return `${name} (${index})`;
}

function dedupe(values) {
  return [...new Set(values)];
}

function dedupeByKey(values, key) {
  const seen = new Set();
  return values.filter((item) => {
    const value = item?.[key];
    if (!value || seen.has(value)) {
      return false;
    }
    seen.add(value);
    return true;
  });
}

function truncate(value, maxLength) {
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value;
}

function formatDate(value) {
  return new Date(value).toLocaleString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

function formatShortDate(value) {
  return new Date(value).toLocaleDateString([], {
    month: "short",
    day: "numeric"
  });
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function contrastText(hex) {
  const value = hex.replace("#", "");
  const red = parseInt(value.slice(0, 2), 16);
  const green = parseInt(value.slice(2, 4), 16);
  const blue = parseInt(value.slice(4, 6), 16);
  const luma = (0.299 * red + 0.587 * green + 0.114 * blue) / 255;
  return luma > 0.6 ? "#1a1a2e" : "#fffdf8";
}

function isValidUrl(value) {
  try {
    const url = new URL(value);
    return /^(https?:|file:|chrome:|about:)/.test(url.protocol);
  } catch (error) {
    return false;
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

queueMicrotask(() => {
  init().catch((error) => {
    console.error("Tabula failed to initialize", error);
    showToast("Tabula couldn't finish loading.");
  });
});
