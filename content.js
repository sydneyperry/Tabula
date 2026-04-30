let lastDraggedUrl = null;
let lastDragTimestamp = 0;

function extractUrlFromTarget(target) {
  if (!(target instanceof Element)) {
    return null;
  }

  const anchor = target.closest("a[href]");
  if (!anchor) {
    return null;
  }

  const href = anchor.href;
  try {
    const parsed = new URL(href);
    return parsed.href;
  } catch (error) {
    return null;
  }
}

document.addEventListener(
  "dragstart",
  (event) => {
    const url = extractUrlFromTarget(event.target);
    if (!url) {
      return;
    }

    lastDraggedUrl = url;
    lastDragTimestamp = Date.now();
    chrome.runtime.sendMessage({
      type: "content-drag-start",
      payload: {
        url,
        title: document.title,
        pageUrl: window.location.href,
        timestamp: lastDragTimestamp
      }
    }).catch(() => {});
  },
  true
);

document.addEventListener(
  "dragend",
  () => {
    chrome.runtime.sendMessage({
      type: "content-drag-end",
      payload: {
        url: lastDraggedUrl,
        timestamp: lastDragTimestamp
      }
    }).catch(() => {});
    lastDraggedUrl = null;
  },
  true
);

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type !== "extract-page-summary-input") {
    return;
  }

  const metaDescription =
    document.querySelector('meta[name="description"]')?.getAttribute("content") ||
    document.querySelector('meta[property="og:description"]')?.getAttribute("content") ||
    "";

  const bodyText = (document.body?.innerText || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 700);

  sendResponse({
    ok: true,
    payload: {
      title: document.title,
      metaDescription,
      bodyText,
      pageUrl: window.location.href
    }
  });
  return true;
});
