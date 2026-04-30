(function loadTabulaSidepanel() {
  const currentScript = document.currentScript;
  const baseUrl = currentScript ? new URL(".", currentScript.src).href : window.location.href;

  function appendScript(src, onload) {
    const script = document.createElement("script");
    script.src = new URL(src, baseUrl).href;
    script.onload = onload || null;
    document.body.appendChild(script);
  }

  if (!globalThis.chrome?.tabs || !globalThis.chrome?.storage || !globalThis.chrome?.runtime) {
    appendScript("mock-chrome.js", () => appendScript("sidepanel.js?v=20260430e"));
    return;
  }

  appendScript("sidepanel.js?v=20260430e");
})();
