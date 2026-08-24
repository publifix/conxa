import "./style.css";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger);

const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;

/* ---------------------------------------------------------------
   Smooth scroll (Lenis) — skipped entirely under reduced motion
---------------------------------------------------------------- */
let lenis = null;
if (!prefersReducedMotion) {
  lenis = new Lenis({ duration: 1.1, smoothWheel: true });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

/* ---------------------------------------------------------------
   Mobile navigation drawer
   - overlay stays fully solid at every point of the animation
   - closes on: close button, backdrop tap, link click, Escape
---------------------------------------------------------------- */
const menuToggle = document.getElementById("menu-toggle");
const menuClose = document.getElementById("menu-close");
const drawer = document.getElementById("mobile-drawer");
const drawerPanel = document.getElementById("mobile-drawer-panel");
const drawerLinks = drawer ? drawer.querySelectorAll("a") : [];
const header = document.getElementById("site-header");

// The drawer background is ALWAYS fully opaque Negro Conxa the instant it is
// shown (a plain class toggle, never an opacity tween) so there is no frame,
// no easing curve and no blend-mode that could ever let the page underneath
// show through. Only the inner content animates.
function openDrawer() {
  drawer.classList.remove("hidden");
  drawer.setAttribute("data-open", "true");
  menuToggle.setAttribute("aria-expanded", "true");
  document.body.classList.add("overflow-hidden");
  gsap.fromTo(
    drawerPanel,
    { opacity: 0, y: prefersReducedMotion ? 0 : 18 },
    { opacity: 1, y: 0, duration: prefersReducedMotion ? 0 : 0.4, ease: "power2.out" }
  );
  const items = drawer.querySelectorAll("[data-drawer-item]");
  if (!prefersReducedMotion) {
    gsap.fromTo(
      items,
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: 0.45, ease: "power2.out", stagger: 0.05, delay: 0.08 }
    );
  }
  menuClose.focus({ preventScroll: true });
}

function closeDrawer() {
  menuToggle.setAttribute("aria-expanded", "false");
  drawer.setAttribute("data-open", "false");
  document.body.classList.remove("overflow-hidden");
  drawer.classList.add("hidden");
  menuToggle.focus({ preventScroll: true });
}

if (menuToggle && drawer) {
  menuToggle.addEventListener("click", openDrawer);
  menuClose.addEventListener("click", closeDrawer);
  // Tap anywhere on the solid overlay itself (not on a link/button) closes it.
  drawer.addEventListener("click", (e) => {
    if (e.target === drawer) closeDrawer();
  });
  drawerLinks.forEach((link) => link.addEventListener("click", closeDrawer));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && drawer.getAttribute("data-open") === "true") {
      closeDrawer();
    }
  });
}

/* ---------------------------------------------------------------
   Header: transparent -> solid, hide on scroll down / show on up
---------------------------------------------------------------- */
if (header) {
  let lastY = window.scrollY;
  const solidAt = 80;

  const applyState = () => {
    const y = window.scrollY;
    header.classList.toggle("is-solid", y > solidAt);

    if (y > lastY && y > 160) {
      header.classList.add("is-hidden");
    } else {
      header.classList.remove("is-hidden");
    }
    lastY = y;
  };

  applyState();
  window.addEventListener("scroll", applyState, { passive: true });
}

/* ---------------------------------------------------------------
   Scroll progress bar
---------------------------------------------------------------- */
const progressBar = document.getElementById("scroll-progress");
if (progressBar) {
  const updateProgress = () => {
    const h = document.documentElement;
    const scrolled = h.scrollTop;
    const max = h.scrollHeight - h.clientHeight;
    const pct = max > 0 ? (scrolled / max) * 100 : 0;
    progressBar.style.width = pct + "%";
  };
  updateProgress();
  window.addEventListener("scroll", updateProgress, { passive: true });
}

/* ---------------------------------------------------------------
   Menu: tabs by category
---------------------------------------------------------------- */
const tabs = Array.from(document.querySelectorAll("[data-menu-tab]"));
const panels = Array.from(document.querySelectorAll("[data-menu-panel]"));

function activateTab(targetId, { focusPanel = false } = {}) {
  tabs.forEach((tab) => {
    const isActive = tab.dataset.menuTab === targetId;
    tab.setAttribute("aria-selected", String(isActive));
    tab.setAttribute("tabindex", isActive ? "0" : "-1");
  });
  panels.forEach((panel) => {
    const isActive = panel.dataset.menuPanel === targetId;
    panel.toggleAttribute("hidden", !isActive);
    if (isActive) {
      const items = panel.querySelectorAll(".menu-item, .menu-subgroup-title");
      if (!prefersReducedMotion) {
        gsap.fromTo(
          items,
          { opacity: 0, y: 16 },
          { opacity: 1, y: 0, duration: 0.5, ease: "power2.out", stagger: 0.05 }
        );
      }
      if (focusPanel) panel.focus({ preventScroll: true });
    }
  });
}

tabs.forEach((tab, index) => {
  tab.addEventListener("click", () => activateTab(tab.dataset.menuTab));
  tab.addEventListener("keydown", (e) => {
    if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(e.key)) return;
    e.preventDefault();
    let nextIndex = index;
    if (e.key === "ArrowRight") nextIndex = (index + 1) % tabs.length;
    if (e.key === "ArrowLeft") nextIndex = (index - 1 + tabs.length) % tabs.length;
    if (e.key === "Home") nextIndex = 0;
    if (e.key === "End") nextIndex = tabs.length - 1;
    tabs[nextIndex].focus();
    activateTab(tabs[nextIndex].dataset.menuTab);
    tabs[nextIndex].scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  });
});

if (tabs[0]) activateTab(tabs[0].dataset.menuTab);

/* ---------------------------------------------------------------
   Scroll reveal (fade + translateY) with stagger groups
---------------------------------------------------------------- */
if (prefersReducedMotion) {
  document.querySelectorAll(".reveal").forEach((el) => el.classList.add("reveal-visible"));
} else {
  const groups = new Map();
  document.querySelectorAll(".reveal").forEach((el) => {
    const groupId = el.dataset.revealGroup || el.id || Math.random().toString(36);
    if (!groups.has(groupId)) groups.set(groupId, []);
    groups.get(groupId).push(el);
  });

  groups.forEach((els) => {
    ScrollTrigger.batch(els, {
      start: "top 88%",
      once: true,
      onEnter: (batch) => {
        gsap.to(batch, {
          opacity: 1,
          y: 0,
          duration: 0.9,
          ease: "expo.out",
          stagger: 0.06,
        });
        batch.forEach((el) => el.classList.add("reveal-visible"));
      },
    });
  });
}

/* ---------------------------------------------------------------
   Hero parallax (subtle, transform-only)
---------------------------------------------------------------- */
const heroImage = document.getElementById("hero-image");
if (heroImage && !prefersReducedMotion) {
  gsap.to(heroImage, {
    yPercent: 16,
    ease: "none",
    scrollTrigger: {
      trigger: "#hero",
      start: "top top",
      end: "bottom top",
      scrub: true,
    },
  });
}

/* ---------------------------------------------------------------
   Footer year
---------------------------------------------------------------- */
const yearEl = document.getElementById("current-year");
if (yearEl) yearEl.textContent = new Date().getFullYear();
