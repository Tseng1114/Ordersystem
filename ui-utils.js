let toastContainer = null;
let lightboxOverlay = null;
let lightboxImg = null;

function getToastContainer() {
  if (!toastContainer) {
    toastContainer = document.createElement("div");
    toastContainer.id = "toast-container";
    document.body.appendChild(toastContainer);
  }
  return toastContainer;
}

const TOAST_ICONS = {
  success: "OK",
  error: "!",
  warning: "i",
  info: "...",
};

export function showToast(message, type = "info", duration = 3200) {
  const container = getToastContainer();
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${TOAST_ICONS[type] ?? "*"}</span>
    <span class="toast-msg">${message}</span>
    <button class="toast-close" aria-label="Close">x</button>
  `;

  const close = () => {
    if (!toast.isConnected) return;
    toast.classList.add("hide");
    toast.addEventListener("transitionend", () => toast.remove(), {
      once: true,
    });
  };

  toast.querySelector(".toast-close").addEventListener("click", close);
  container.appendChild(toast);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => toast.classList.add("show"));
  });

  let timer = setTimeout(close, duration);
  toast.addEventListener("mouseenter", () => clearTimeout(timer));
  toast.addEventListener("mouseleave", () => {
    timer = setTimeout(close, 1200);
  });

  return toast;
}

export function overrideAlert() {
  window.alert = (message) => {
    const text = String(message ?? "");
    const lower = text.toLowerCase();

    if (
      lower.includes("error") ||
      text.includes("失敗") ||
      text.includes("找不到")
    ) {
      showToast(text, "error", 4500);
      return;
    }

    if (
      text.includes("成功") ||
      text.includes("已複製") ||
      text.includes("已建立")
    ) {
      showToast(text, "success");
      return;
    }

    if (
      text.includes("請") ||
      text.includes("提醒") ||
      text.includes("注意")
    ) {
      showToast(text, "warning");
      return;
    }

    showToast(text, "info");
  };
}

export function initRipple(
  selector = "button, .btn, .tab-btn, .shop-card",
  dark = false,
) {
  document.addEventListener("click", (event) => {
    const target = event.target.closest(selector);
    if (!target) return;

    target.classList.add("ripple-host");

    const rect = target.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 2;
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    const ripple = document.createElement("span");
    ripple.className = "ripple" + (dark ? " ripple-dark" : "");
    ripple.style.width = `${size}px`;
    ripple.style.height = `${size}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;

    target.appendChild(ripple);
    ripple.addEventListener("animationend", () => ripple.remove(), {
      once: true,
    });
  });
}

export function animateIn(selector, animClass = "anim-fade-up", staggerMs = 60) {
  const elements = document.querySelectorAll(selector);
  elements.forEach((element, index) => {
    element.style.animationDelay = `${index * staggerMs}ms`;
    element.classList.add(animClass);
  });
}

export function countUp(element, target, durationMs = 600) {
  const start = performance.now();

  const update = (now) => {
    const elapsed = now - start;
    const progress = Math.min(elapsed / durationMs, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    element.textContent = Math.round(eased * target);
    if (progress < 1) requestAnimationFrame(update);
  };

  requestAnimationFrame(update);
}

function getLightbox() {
  if (lightboxOverlay) {
    return { overlay: lightboxOverlay, img: lightboxImg };
  }

  lightboxOverlay = document.createElement("div");
  lightboxOverlay.id = "lightbox-overlay";
  lightboxOverlay.innerHTML = `
    <div id="lightbox-inner">
      <button id="lightbox-close" aria-label="Close">x</button>
      <img id="lightbox-img" alt="Preview" />
    </div>
  `;

  document.body.appendChild(lightboxOverlay);
  lightboxImg = document.getElementById("lightbox-img");

  const close = () => {
    lightboxOverlay.classList.remove("open");
    document.body.style.overflow = "";
  };

  document.getElementById("lightbox-close").addEventListener("click", close);
  lightboxOverlay.addEventListener("click", (event) => {
    if (event.target === lightboxOverlay) close();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") close();
  });

  return { overlay: lightboxOverlay, img: lightboxImg };
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
  document.addEventListener("click", (event) => {
    const img = event.target.closest(`${containerSelector} img`);
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
