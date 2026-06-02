(() => {
  if (window.__zaiResetTimerLoaded) return;
  window.__zaiResetTimerLoaded = true;

  const STYLE_ID = "zai-reset-timer-style";
  let countdownInterval = null;

  function clickUsageTab() {
    const tab = document.querySelector('[data-node-key="usage"] .ant-tabs-tab-btn');
    if (!tab || tab.getAttribute("aria-selected") === "true") return true;
    tab.click();
    return false;
  }

  function waitForTab() {
    if (clickUsageTab()) return;
    const obs = new MutationObserver(() => {
      if (clickUsageTab()) obs.disconnect();
    });
    obs.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => obs.disconnect(), 5000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", waitForTab);
  } else {
    waitForTab();
  }

  function formatLocalTime(timestampMs) {
    return new Date(timestampMs).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }

  function formatCountdown(timestampMs) {
    const diff = timestampMs - Date.now();
    if (diff <= 0) return "now";
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    if (d > 0) return `${d}d ${h}h ${m}m`;
    return `${h}h ${m}m ${s}s`;
  }

  function barColor(pct) {
    if (pct > 80) return "#4caf50";
    if (pct > 50) return "#ff9800";
    return "#f44336";
  }

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      .zai-reset-bar {
        position: relative;
        margin-top: auto;
        height: 28px;
        border-radius: 6px;
        overflow: hidden;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      }
      .zai-reset-track {
        position: absolute;
        inset: 0;
        background: rgba(10, 10, 25, 0.7);
        border-radius: 6px;
      }
      .zai-reset-fill {
        height: 100%;
        opacity: 0.45;
        transition: width 1s linear, background-color 5s linear;
      }
      .zai-reset-overlay {
        position: absolute;
        inset: 0;
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        font-weight: 600;
        color: #fff;
        text-shadow: 0 1px 4px rgba(0,0,0,0.9), 0 0 8px rgba(0,0,0,0.6);
        pointer-events: none;
      }
      .zai-reset-overlay .zai-reset-label {
        font-weight: 400;
        opacity: 0.85;
      }
    `;
    (document.head || document.documentElement).appendChild(style);
  }

  function findCardByText(searchText) {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      if (!walker.currentNode.textContent.includes(searchText)) continue;
      let el = walker.currentNode.parentElement;
      for (let i = 0; i < 10 && el; i++) {
        const style = window.getComputedStyle(el);
        const hasBorder = style.borderWidth && style.borderWidth !== "0px";
        const hasBg = style.backgroundColor && style.backgroundColor !== "rgba(0, 0, 0, 0)" && style.backgroundColor !== "transparent";
        const rect = el.getBoundingClientRect();
        if ((hasBorder || hasBg) && rect.width > 200 && rect.height > 60 && rect.height < 400) {
          return el;
        }
        el = el.parentElement;
      }
    }
    return null;
  }

  const MAPPING = [
    { type: "TOKENS_LIMIT", search: "5 Hours Quota", barId: "zai-reset-5h", cycleDuration: 5 * 3600000 },
    { type: "TIME_LIMIT", search: "Monthly Web Search", barId: "zai-reset-monthly", cycleDuration: 30 * 86400000 },
  ];

  // Cached DOM refs per bar — avoids querying every second
  const barRefs = {};

  function createResetBar(id) {
    const bar = document.createElement("div");
    bar.className = "zai-reset-bar";
    bar.id = id;
    bar.innerHTML = `
      <div class="zai-reset-track"><div class="zai-reset-fill"></div></div>
      <div class="zai-reset-overlay">
        <span class="zai-reset-label"></span>
        <span class="zai-countdown"></span>
      </div>
    `;
    barRefs[id] = {
      fill: bar.querySelector(".zai-reset-fill"),
      countdown: bar.querySelector(".zai-countdown"),
      label: bar.querySelector(".zai-reset-label"),
    };
    return bar;
  }

  function updateBar(barId, resetMs, cycleDurationMs) {
    const refs = barRefs[barId];
    if (!refs) return;
    const remaining = Math.max(0, resetMs - Date.now());
    const elapsed = cycleDurationMs - remaining;
    const pct = Math.min(100, Math.max(0, (elapsed / cycleDurationMs) * 100));
    refs.fill.style.width = `${pct}%`;
    refs.fill.style.backgroundColor = barColor(pct);
    refs.countdown.textContent = formatCountdown(resetMs);
    refs.label.textContent = `Resets ${formatLocalTime(resetMs)}`;
  }

  function injectBars(limits) {
    injectStyles();
    let allInjected = true;
    for (const { type, search, barId, cycleDuration } of MAPPING) {
      const limit = limits.find((l) => l.type === type && l.nextResetTime);
      if (!limit) continue;
      if (document.getElementById(barId)) {
        updateBar(barId, limit.nextResetTime, cycleDuration);
        continue;
      }
      const card = findCardByText(search);
      if (!card) { allInjected = false; continue; }
      card.style.display = "flex";
      card.style.flexDirection = "column";
      card.appendChild(createResetBar(barId));
      updateBar(barId, limit.nextResetTime, cycleDuration);
    }

    if (countdownInterval) clearInterval(countdownInterval);
    countdownInterval = setInterval(() => {
      for (const { type, barId, cycleDuration } of MAPPING) {
        const limit = limits.find((l) => l.type === type && l.nextResetTime);
        if (limit) updateBar(barId, limit.nextResetTime, cycleDuration);
      }
    }, 1000);

    return allInjected;
  }

  function handleResponse(data) {
    if (!data?.success || !data?.data?.limits) return;
    const limits = data.data.limits;
    if (injectBars(limits)) return;
    const retries = [500, 1500, 3000];
    let i = 0;
    function retry() {
      if (i >= retries.length || injectBars(limits)) return;
      setTimeout(retry, retries[i++]);
    }
    setTimeout(retry, retries[i++]);
  }

  const originalFetch = window.fetch;
  window.fetch = async function (...args) {
    const response = await originalFetch.apply(this, args);
    const url = typeof args[0] === "string" ? args[0] : args[0]?.url;
    if (url && url.includes("/api/monitor/usage/quota/limit")) {
      response.clone().json().then(handleResponse).catch(() => {});
    }
    return response;
  };

  const originalOpen = XMLHttpRequest.prototype.open;
  const originalSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    this._zaiUrl = url;
    return originalOpen.call(this, method, url, ...rest);
  };
  XMLHttpRequest.prototype.send = function (...args) {
    if (this._zaiUrl && this._zaiUrl.includes("/api/monitor/usage/quota/limit")) {
      this.addEventListener("load", function () {
        try { handleResponse(JSON.parse(this.responseText)); } catch {}
      });
    }
    return originalSend.apply(this, args);
  };
})();
