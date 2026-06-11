(() => {
  if (window.__zaiResetTimerLoaded) return;
  window.__zaiResetTimerLoaded = true;

  const STYLE_ID = "zai-reset-timer-style";
  let countdownInterval = null;

  function formatLocalTime(timestampMs) {
    const d = new Date(timestampMs);
    const pad = (value) => String(value).padStart(2, "0");
    return [
      d.getFullYear(),
      pad(d.getMonth() + 1),
      pad(d.getDate()),
    ].join("-") + ` ${pad(d.getHours())}:${pad(d.getMinutes())}`;
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

  // Peak hours: 14:00-18:00 UTC+8 daily
  // Peak: 3x, Off-peak: 2x (promo: 1x through June 2026)
  const PROMO_END = new Date("2026-07-01T00:00:00+08:00").getTime();

  function utc8ToLocal(hour) {
    const d = new Date();
    d.setUTCHours(hour - 8, 0, 0, 0);
    return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", hour12: false });
  }
  const PEAK_LOCAL = `${utc8ToLocal(14)}-${utc8ToLocal(18)}`;

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
        margin-top: 18px;
        min-height: 24px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      }
      .zai-reset-meta {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 16px;
        min-width: 0;
        font-size: 14px;
        line-height: 22px;
        color: #c3c4cc;
        pointer-events: none;
      }
      .zai-reset-meta .zai-reset-label {
        font-weight: 400;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .zai-reset-meta .zai-countdown {
        flex: 0 0 auto;
        color: #ffffff;
        font-size: 16px;
        line-height: 24px;
        font-weight: 500;
      }
      #zai-multiplier-badge {
        position: absolute;
        top: 18px;
        right: 22px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-size: 12px;
        font-weight: 600;
        padding: 3px 8px;
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
    const searchTexts = Array.isArray(searchText) ? searchText : [searchText];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      if (!searchTexts.some((text) => walker.currentNode.textContent.includes(text))) continue;
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
    { type: "TOKENS_LIMIT", search: ["5 Hours Quota"], barId: "zai-reset-5h", cycleDuration: 5 * 3600000 },
    {
      type: "TIME_LIMIT",
      search: ["Total Monthly Web Search / Reader / Zread Quota", "Monthly Web Search"],
      barId: "zai-reset-monthly",
      cycleDuration: 30 * 86400000,
    },
  ];

  // Cached DOM refs per bar to avoid querying every second.
  const barRefs = {};

  function createResetBar(id) {
    const bar = document.createElement("div");
    bar.className = "zai-reset-bar";
    bar.id = id;
    bar.innerHTML = `
      <div class="zai-reset-meta">
        <span class="zai-reset-label"></span>
        <span class="zai-countdown"></span>
      </div>
    `;
    barRefs[id] = {
      countdown: bar.querySelector(".zai-countdown"),
      label: bar.querySelector(".zai-reset-label"),
    };
    return bar;
  }

  function hideNativeResetTime(card) {
    const walker = document.createTreeWalker(card, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      if (!walker.currentNode.textContent.includes("Reset Time:")) continue;
      let el = walker.currentNode.parentElement;
      while (el && el.parentElement !== card) {
        el = el.parentElement;
      }
      if (!el || el.classList.contains("zai-reset-bar") || el.id === "zai-reset-monthly") continue;
      el.style.display = "none";
      return true;
    }
    return false;
  }

  function updateBar(barId, resetMs) {
    const refs = barRefs[barId];
    if (!refs) return;
    if (!resetMs) {
      refs.countdown.textContent = "";
      refs.label.textContent = "Quota not started - send an API request to begin countdown";
      refs.label.style.opacity = "0.6";
      refs.label.style.fontStyle = "italic";
      return;
    }
    refs.label.style.opacity = "";
    refs.label.style.fontStyle = "";
    refs.countdown.textContent = formatCountdown(resetMs);
    refs.label.textContent = `Reset Time: ${formatLocalTime(resetMs)} local`;
  }

  let lastMultiplierState = "";
  function updateMultiplierBadge() {
    const badge = document.getElementById("zai-multiplier-badge");
    if (!badge) return;
    const m = getMultiplier();
    const nextState = `${m.isPeak}:${m.label}`;
    if (nextState === lastMultiplierState) return;
    lastMultiplierState = nextState;
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
    for (const { type, search, barId } of MAPPING) {
      const limit = limits.find((l) => l.type === type);
      if (!limit) continue;
      const resetMs = limit.nextResetTime || null;
      const card = findCardByText(search);
      if (type === "TIME_LIMIT" && card) {
        hideNativeResetTime(card);
      }
      if (document.getElementById(barId)) {
        updateBar(barId, resetMs);
        continue;
      }
      if (!card) { allInjected = false; continue; }
      card.appendChild(createResetBar(barId));
      updateBar(barId, resetMs);
    }

    // Multiplier badge on 5h quota card.
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
      for (const { type, barId } of MAPPING) {
        const limit = limits.find((l) => l.type === type);
        if (limit) updateBar(barId, limit.nextResetTime || null);
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
