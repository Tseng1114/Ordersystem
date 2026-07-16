import "../css/pwa.css";

const isStandalone =
  window.matchMedia("(display-mode: standalone)").matches ||
  window.navigator.standalone === true;

const supportsServiceWorker =
  location.protocol === "https:" ||
  ["localhost", "127.0.0.1"].includes(location.hostname);

if ("serviceWorker" in navigator && supportsServiceWorker) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch((error) => {
      console.warn("Service Worker registration failed:", error);
    });
  });
}

const isIos =
  /iphone|ipad|ipod/i.test(navigator.userAgent) ||
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

const dismissedAt = Number(localStorage.getItem("pwa-install-dismissed-at") || 0);
const dismissDuration = 7 * 24 * 60 * 60 * 1000;

if (isIos && !isStandalone && Date.now() - dismissedAt > dismissDuration) {
  window.addEventListener("DOMContentLoaded", () => {
    const prompt = document.createElement("aside");
    prompt.className = "pwa-install-prompt";
    prompt.setAttribute("role", "dialog");
    prompt.setAttribute("aria-label", "安裝到 iPhone 主畫面");
    prompt.innerHTML = `
      <img src="./icons/app-icon-192.png" alt="" width="48" height="48" />
      <div class="pwa-install-prompt__content">
        <strong>安裝「家族點餐」</strong>
        <span>點 Safari 的分享按鈕 <b aria-label="分享">□↑</b>，再選「加入主畫面」。</span>
      </div>
      <button type="button" aria-label="關閉安裝提示">知道了</button>
    `;

    prompt.querySelector("button").addEventListener("click", () => {
      localStorage.setItem("pwa-install-dismissed-at", String(Date.now()));
      prompt.remove();
    });

    document.body.append(prompt);
  });
}
