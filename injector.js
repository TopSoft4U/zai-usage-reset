// Fallback injector: if "world": "MAIN" isn't supported, inject content.js via script tag
(() => {
  if (typeof window.__zaiResetTimerLoaded !== "undefined") return;
  const s = document.createElement("script");
  s.src = typeof browser !== "undefined"
    ? browser.runtime.getURL("content.js")
    : chrome.runtime.getURL("content.js");
  s.onload = () => s.remove();
  (document.head || document.documentElement).appendChild(s);
})();
