let _toastContainer = null;

function getToastContainer() {
  if (!_toastContainer) {
    _toastContainer = document.createElement("div");
    _toastContainer.id = "toast-container";
    document.body.appendChild(_toastContainer);
  }
  return _toastContainer;
}

const TOAST_ICONS = {
  success: "✅",
  error:   "❌",
  warning: "⚠️",
  info:    "ℹ️",
};

export function showToast(message, type = "info", duration = 3200) {
  const container = getToastContainer();
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${TOAST_ICONS[type] ?? "💬"}</span>
    <span class="toast-msg">${message}</span>
    <button class="toast-close" aria-label="關閉">✕</button>
  `;

  const close = () => {
    toast.classList.add("hide");
    toast.addEventListener("transitionend", () => toast.remove(), { once: true });
  };

  toast.querySelector(".toast-close").addEventListener("click", close);
  container.appendChild(toast);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => toast.classList.add("show"));
  });

  const timer = setTimeout(close, duration);
  toast.addEventListener("mouseenter", () => clearTimeout(timer));

  return toast;
}

export function overrideAlert() {
  const _origAlert = window.alert.bind(window);
  window.alert = (msg) => {
    const lower = String(msg).toLowerCase();
    if (lower.includes("失敗") || lower.includes("錯誤") || lower.includes("error") || lower.includes("找不到")) {
      showToast(msg, "error", 4500);
    } else if (lower.includes("成功") || lower.includes("複製") || lower.includes("已")) {
      showToast(msg, "success");
    } else if (lower.includes("請") || lower.includes("警告")) {
      showToast(msg, "warning");
    } else {
      showToast(msg, "info");
    }
  };
}

export function initRipple(selector = "button, .btn, .tab-btn, .shop-card", dark = false) {
  document.addEventListener("click", (e) => {
    const target = e.target.closest(selector);
    if (!target) return;

    target.classList.add("ripple-host");

    const rect = target.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 2;
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    const ripple = document.createElement("span");
    ripple.className = "ripple" + (dark ? " ripple-dark" : "");
    ripple.style.cssText = `width:${size}px;height:${size}px;left:${x}px;top:${y}px`;
    target.appendChild(ripple);

    ripple.addEventListener("animationend", () => ripple.remove(), { once: true });
  });
}

export function animateIn(selector, animClass = "anim-fade-up", staggerMs = 60) {
  const els = document.querySelectorAll(selector);
  els.forEach((el, i) => {
    el.style.animationDelay = `${i * staggerMs}ms`;
    el.classList.add(animClass);
  });
}

export function countUp(el, target, durationMs = 600) {
  const start = performance.now();
  const update = (now) => {
    const elapsed = now - start;
    const progress = Math.min(elapsed / durationMs, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(eased * target);
    if (progress < 1) requestAnimationFrame(update);
  };
  requestAnimationFrame(update);
}

let _lightboxOverlay = null;
let _lightboxImg = null;

function getLightbox() {
  if (_lightboxOverlay) return { overlay: _lightboxOverlay, img: _lightboxImg };

  _lightboxOverlay = document.createElement("div");
  _lightboxOverlay.id = "lightbox-overlay";
  _lightboxOverlay.innerHTML = `
    <div id="lightbox-inner">
      <button id="lightbox-close" aria-label="關閉">✕</button>
      <img id="lightbox-img" alt="菜單放大圖" />
    </div>
  `;
  document.body.appendChild(_lightboxOverlay);

  _lightboxImg = document.getElementById("lightbox-img");

  const close = () => {
    _lightboxOverlay.classList.remove("open");
    document.body.style.overflow = "";
  };

  document.getElementById("lightbox-close").addEventListener("click", close);
  _lightboxOverlay.addEventListener("click", (e) => {
    if (e.target === _lightboxOverlay) close();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });

  return { overlay: _lightboxOverlay, img: _lightboxImg };
}

export function openLightbox(src, alt = "") {
  const { overlay, img } = getLightbox();
  img.src = src;
  img.alt = alt;
  document.body.style.overflow = "hidden";

  requestAnimationFrame(() => {
    requestAnimationFrame(() => overlay.classList.add("open"));
  });
}

export function initLightbox(containerSelector = ".menu-img-wrap") {
  document.addEventListener("click", (e) => {
    const img = e.target.closest(`${containerSelector} img`);
    if (!img) return;
    openLightbox(img.src, img.alt);
  });
}

export function skeletonCards(count = 3) {
  return Array.from({ length: count }, () => `
    <div class="skeleton-card">
      <div class="skeleton skeleton-line medium"></div>
      <div class="skeleton skeleton-line full"></div>
      <div class="skeleton skeleton-line short"></div>
    </div>
  `).join("");
}