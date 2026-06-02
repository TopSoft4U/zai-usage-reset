(() => {
  if (window.__zaiResetTimerLoaded) return;
  window.__zaiResetTimerLoaded = true;

  const STYLE_ID = "zai-reset-timer-style";
  let countdownInterval = null;

  function clickUsageTab() {
    const tab = document.querySelector('[data-node-key="usage"] .ant-tabs-tab-btn');
    if (!tab) return false;
    if (tab.getAttribute("aria-selected") === "true") return true;
    tab.click();
    return true;
  }

  let tabAttempts = 0;
  const tabPoll = setInterval(() => {
    if (clickUsageTab() || ++tabAttempts > 50) clearInterval(tabPoll);
  }, 300);

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

  // Peak hours: 14:00–18:00 UTC+8 daily
  // Peak: 3x, Off-peak: 2x (promo: 1x through June 2026)
  const PROMO_END = new Date("2026-07-01T00:00:00+08:00").getTime();

  function utc8ToLocal(hour) {
    const d = new Date();
    d.setUTCHours(hour - 8, 0, 0, 0);
    return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", hour12: false });
  }
  const PEAK_LOCAL = `${utc8ToLocal(14)}–${utc8ToLocal(18)}`;

  function getMultiplier() {
    const now = new Date();
    const utc8Hour = (now.getUTCHours() + 8) % 24;
    const isPeak = utc8Hour >= 14 && utc8Hour < 18;
    const isPromo = Date.now() < PROMO_END;
    return {
      isPeak,
      rate: isPeak ? 3 : (isPromo ? 1 : 2),
      label: isPeak ? "Peak 3x" : (isPromo ? "Off-peak 1x (promo)" : "Off-peak 2x"),
    };
  }

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      .zai-reset-bar {
        position: relative;
        margin-top: auto;
        padding-top: 4px;
        height: 28px;
        border-radius: 6px;
        overflow: hidden;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      }
      .zai-reset-track {
        position: absolute;
        inset: 4px 0 0 0;
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
        inset: 4px 0 0 0;
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
      #zai-multiplier-badge {
        position: absolute;
        top: 24px;
        right: 24px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-size: 14px;
        font-weight: 600;
        padding: 4px 10px;
        border-radius: 6px;
        z-index: 10;
        cursor: default;
      }
      #zai-multiplier-badge.peak {
        background: #d32f2f;
        color: #fff;
      }
      #zai-multiplier-badge.offpeak {
        background: #388e3c;
        color: #fff;
      }
      #zai-multiplier-tooltip {
        display: none;
        position: absolute;
        top: calc(100% + 8px);
        right: 0;
        background: #f5f5f5;
        border-radius: 8px;
        padding: 14px 18px;
        font-size: 13px;
        font-weight: 400;
        color: #333;
        white-space: nowrap;
        z-index: 20;
        line-height: 2;
        box-shadow: 0 2px 8px rgba(0,0,0,0.25);
      }
      #zai-multiplier-tooltip::before {
        content: "";
        position: absolute;
        top: -6px;
        right: 16px;
        width: 12px;
        height: 12px;
        background: #f5f5f5;
        transform: rotate(45deg);
        box-shadow: -1px -1px 2px rgba(0,0,0,0.05);
      }
      #zai-multiplier-badge:hover #zai-multiplier-tooltip {
        display: block;
      }
      .zai-tt-row {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .zai-tt-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        flex-shrink: 0;
      }
      .zai-tt-dot.peak { background: #d32f2f; }
      .zai-tt-dot.offpeak { background: #388e3c; }
      .zai-tt-rate {
        margin-left: auto;
        font-weight: 700;
        color: #111;
        padding-left: 20px;
      }
      .zai-tt-note {
        color: #888;
        font-size: 11px;
        margin-top: 4px;
        border-top: 1px solid #ddd;
        padding-top: 6px;
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
    if (!resetMs) {
      refs.fill.style.width = "0%";
      refs.fill.style.backgroundColor = "transparent";
      refs.countdown.textContent = "";
      refs.label.textContent = "Quota not started — send an API request to begin countdown";
      refs.label.style.opacity = "0.6";
      refs.label.style.fontStyle = "italic";
      return;
    }
    refs.label.style.opacity = "";
    refs.label.style.fontStyle = "";
    const remaining = Math.max(0, resetMs - Date.now());
    const elapsed = cycleDurationMs - remaining;
    const pct = Math.min(100, Math.max(0, (elapsed / cycleDurationMs) * 100));
    refs.fill.style.width = `${pct}%`;
    refs.fill.style.backgroundColor = barColor(pct);
    refs.countdown.textContent = formatCountdown(resetMs);
    refs.label.textContent = `Resets ${formatLocalTime(resetMs)}`;
  }

  let lastMultiplierState = null;
  function updateMultiplierBadge() {
    const badge = document.getElementById("zai-multiplier-badge");
    if (!badge) return;
    const m = getMultiplier();
    if (m.isPeak === lastMultiplierState) return;
    lastMultiplierState = m.isPeak;
    const text = badge.querySelector(".zai-badge-text");
    if (text) text.textContent = m.label;
    badge.className = m.isPeak ? "peak" : "offpeak";
    badge.id = "zai-multiplier-badge";
    const offpeakRate = badge.querySelector(".zai-tt-offpeak-rate");
    if (offpeakRate) {
      const isPromo = Date.now() < PROMO_END;
      offpeakRate.textContent = isPromo ? "1x (promo thru June)" : "2x";
    }
  }

  function injectBars(limits) {
    injectStyles();
    let allInjected = true;
    for (const { type, search, barId, cycleDuration } of MAPPING) {
      const limit = limits.find((l) => l.type === type);
      if (!limit) continue;
      const resetMs = limit.nextResetTime || null;
      if (document.getElementById(barId)) {
        updateBar(barId, resetMs, cycleDuration);
        continue;
      }
      const card = findCardByText(search);
      if (!card) { allInjected = false; continue; }
      card.style.display = "flex";
      card.style.flexDirection = "column";
      card.appendChild(createResetBar(barId));
      updateBar(barId, resetMs, cycleDuration);
    }

    // Multiplier badge on 5h quota card
    if (!document.getElementById("zai-multiplier-badge")) {
      const quotaCard = findCardByText("5 Hours Quota");
      if (quotaCard) {
        const pos = window.getComputedStyle(quotaCard).position;
        if (pos === "static") quotaCard.style.position = "relative";
        const badge = document.createElement("span");
        badge.id = "zai-multiplier-badge";
        badge.innerHTML = `<span class="zai-badge-text"></span>
          <div id="zai-multiplier-tooltip">
            <div class="zai-tt-row"><span class="zai-tt-dot peak"></span>Peak ${PEAK_LOCAL} (local)<span class="zai-tt-rate">3x</span></div>
            <div class="zai-tt-row"><span class="zai-tt-dot offpeak"></span>Off-peak<span class="zai-tt-rate zai-tt-offpeak-rate"></span></div>
            <div class="zai-tt-note">GLM-5.1 / GLM-5-Turbo only</div>
          </div>`;
        quotaCard.appendChild(badge);
      }
    }
    updateMultiplierBadge();

    if (countdownInterval) clearInterval(countdownInterval);
    countdownInterval = setInterval(() => {
      for (const { type, barId, cycleDuration } of MAPPING) {
        const limit = limits.find((l) => l.type === type);
        if (limit) updateBar(barId, limit.nextResetTime || null, cycleDuration);
      }
      updateMultiplierBadge();
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
