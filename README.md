# Tabula

Tabula is a Chrome side-panel extension that turns your browser into a paper desk. Tabs behave like papers, folders behave like physical file folders, and the built-in AI assistant helps surface, sort, and remember what you were working on.

## Install

1. Open Chrome and go to `chrome://extensions`.
2. Turn on **Developer mode**.
3. Click **Load unpacked**.
4. Select the `tabula` folder.
5. Pin Tabula if you want one-click access from the toolbar.
6. Click the Tabula icon to open the side panel.

## How To Use It

### Folders

- Create, rename, recolor, collapse, delete, and reorder folders.
- Drag tabs between folders.
- Hover a folder header to:
  - open the folder in a new window
  - save the folder as a session snapshot
  - delete the folder with inline confirmation

### Unassigned

- Tabs that are not in any folder appear in **Unassigned Tabs**.
- Use **Group by domain** to turn loose tabs into folders automatically.

### AI Assistant

- Use the **Ask Tabula** bar to type natural requests such as:
  - `show me what I had open on Tuesday`
  - `organize everything open into a folder called Tokyo`
  - `add tabs from yesterday into a folder called Research`
  - `what was that article about AI I had open last month`
- The assistant reads tab state and remembered history, then previews what it found or organized.
- The assistant never closes, opens, or moves tabs unless you explicitly ask.

### Suggestions

- New tabs can show a lightweight suggestion chip such as `Add to Research?`
- Tabula also watches repeated browsing patterns and can suggest creating a folder when certain sites keep appearing together.
- Suggestions are optional and can be ignored.

### Notes And Summaries

- Notes are still manual-first.
- If a tab stays open long enough without a note, Tabula can generate a one-sentence summary and use it as a default note.
- Manual notes always take precedence over auto notes.

### Saved Sessions

- Saved sessions persist in storage until deleted.
- Clicking one reopens its URLs and creates a fresh folder with the same name.

### Search And Keyboard

- Search filters by title, domain, note text, and folder name.
- `Cmd/Ctrl + F` focuses search.
- Arrow keys move between visible cards.
- `Enter` switches to the focused tab.
- `Delete` or `Backspace` closes the focused tab with undo.

## Architecture Overview

### State Model

Tabula keeps live folder membership by `tab.id`:

- `folders[].tabIds` stores live membership for the current Chrome session
- `folders[].tabUrlSnapshots` stores URL snapshots so tabs can be re-linked after Chrome restarts
- `notes` are keyed by URL so sticky notes survive tab closure and reopening
- `savedSessions` store durable URL snapshots for later restore
- `tabHistory` stores remembered tab activity with `openedAt`, `lastTouchedAt`, `closedAt`, and folder context for AI time queries
- `folderLearning` stores lightweight local assignment patterns used for future folder suggestions

### Tab ID vs URL

- Live organization uses `tab.id` because each open tab is distinct, even if two tabs share the same URL.
- Persistence uses URLs for notes, saved sessions, and restart reconciliation because `tab.id` is reset when Chrome restarts.

### Message Passing

`background.js`

- Opens the side panel from the toolbar action
- Emits safe tab lifecycle messages on create, remove, update, activate, and window focus changes
- Keeps the MV3 service worker warm with a 25-second repeating alarm

`content.js`

- Watches dragged page links so Tabula can accept dropped URLs
- Extracts page title, meta description, and body text when Tabula asks for summary input

`sidepanel.js`

- Owns local in-memory state
- Reconciles Chrome’s live tab truth with stored folder state
- Persists changes through a 300ms debounced storage write path
- Runs the assistant, folder suggestion logic, summaries, and history queries

### Reconciliation Logic

On initial load, tab events, focus return, and visibility return, Tabula:

1. Queries `chrome.tabs.query({})`
2. Removes dead `tabIds` from folders
3. Rebuilds missing folder membership from `tabUrlSnapshots`
4. Refreshes duplicate detection
5. Updates only the affected cards and folder sections when possible

## Known Limitations

- Chrome does not expose native tab-bar drag payloads to extensions in a fully reliable way. Tabula works around this with link-drag detection and URL drop handling.
- `tab.id` changes after browser restart. Tabula handles this by reconciling from saved URL snapshots, but it still means live IDs are session-specific.
- The assistant and suggestion layer are local-first heuristics. They are fast and private, but not as accurate as a dedicated on-device model pipeline.
- Time-based assistant results are only as good as the history Tabula has already observed.
