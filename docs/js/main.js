"use strict";

const menuToggle = document.querySelector(".menu-toggle");
const navigation = document.querySelector(".primary-navigation");

function setMenuOpen(open) {
  menuToggle.setAttribute("aria-expanded", String(open));
  navigation.classList.toggle("is-open", open);
}

menuToggle.addEventListener("click", () => {
  setMenuOpen(menuToggle.getAttribute("aria-expanded") !== "true");
});

navigation.addEventListener("click", (event) => {
  if (event.target.closest("a")) setMenuOpen(false);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && menuToggle.getAttribute("aria-expanded") === "true") {
    setMenuOpen(false);
    menuToggle.focus();
  }
});

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const revealTargets = document.querySelectorAll(
  ".hero__content, #benefits, .benefits__panel, .tools__heading, .tools__scene, .our-work__heading, .work-carousel, .booking__details, .booking__offer, .about__feature, .team__heading, .team-card",
);

if ("IntersectionObserver" in window) {
  if (!prefersReducedMotion.matches) {
    document.documentElement.classList.add("has-scroll-animations");
    revealTargets.forEach((target) => target.classList.add("scroll-reveal"));

    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });

    revealTargets.forEach((target) => revealObserver.observe(target));
  }

  const navLinks = [...document.querySelectorAll('.primary-navigation a[href^="#"]:not(.booking-link)')];
  const navSections = [...document.querySelectorAll("main > section")];
  const navObserver = new IntersectionObserver((entries) => {
    const visibleSections = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

    if (visibleSections.length === 0) return;

    const currentSection = visibleSections[0].target;
    const activeLink = currentSection.id === "team"
      ? navLinks.find((link) => link.getAttribute("href") === "#about")
      : navLinks.find((link) => link.getAttribute("href") === `#${currentSection.id}`);

    navLinks.forEach((link) => {
      if (link === activeLink) {
        link.setAttribute("aria-current", "location");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }, { threshold: [0.15, 0.35, 0.55], rootMargin: "-18% 0px -45% 0px" });

  navSections.forEach((section) => navObserver.observe(section));
}

const benefitPoints = [...document.querySelectorAll(".benefits__point")];
const benefitTitle = document.querySelector("#benefits-point-title");
const benefitPrompt = document.querySelector("#benefits-point-prompt");
const benefitList = document.querySelector("#benefits-point-list");
const benefitPanel = document.querySelector(".benefits__panel");
const benefitsSection = document.querySelector("#benefits");
let selectedBenefitPoint = null;
let hoveredBenefitPoint = null;
let focusedBenefitPoint = null;
let benefitPanelTimer;

function positionBenefitPanel(point) {
  const sectionBounds = benefitsSection.getBoundingClientRect();
  const pointBounds = point.getBoundingClientRect();
  const panelBounds = benefitPanel.getBoundingClientRect();
  const edge = 16;
  const left = Math.max(edge, Math.min(
    pointBounds.left + pointBounds.width / 2 - sectionBounds.left - panelBounds.width / 2,
    sectionBounds.width - panelBounds.width - edge,
  ));
  let top = pointBounds.top - sectionBounds.top - panelBounds.height - 14;

  if (top < edge) top = pointBounds.bottom - sectionBounds.top + 14;
  top = Math.max(edge, Math.min(top, sectionBounds.height - panelBounds.height - edge));

  benefitPanel.style.left = `${left}px`;
  benefitPanel.style.top = `${top}px`;
}

function showBenefitPoint(point) {
  benefitPoints.forEach((button) => {
    button.classList.toggle("is-active", button === point);
    button.setAttribute("aria-pressed", String(button === selectedBenefitPoint));
  });

  if (!point) {
    benefitPanel.classList.remove("is-open");
    benefitPanel.setAttribute("aria-hidden", "true");
    return;
  }

  benefitTitle.textContent = point.dataset.title;
  benefitPrompt.hidden = true;
  benefitList.replaceChildren(...point.dataset.benefits.split("|").map((benefit) => {
    const item = document.createElement("li");
    item.textContent = benefit;
    return item;
  }));
  benefitList.hidden = false;
  positionBenefitPanel(point);
  benefitPanel.classList.add("is-open");
  benefitPanel.setAttribute("aria-hidden", "false");
}

benefitPoints.forEach((point) => {
  point.addEventListener("pointerenter", (event) => {
    if (event.pointerType !== "touch") {
      clearTimeout(benefitPanelTimer);
      hoveredBenefitPoint = point;
      showBenefitPoint(point);
    }
  });
  point.addEventListener("pointerleave", () => {
    hoveredBenefitPoint = null;
    benefitPanelTimer = setTimeout(() => {
      showBenefitPoint(focusedBenefitPoint ?? selectedBenefitPoint);
    }, 180);
  });
  point.addEventListener("focus", () => {
    focusedBenefitPoint = point;
    showBenefitPoint(point);
  });
  point.addEventListener("blur", () => {
    focusedBenefitPoint = null;
    showBenefitPoint(hoveredBenefitPoint ?? selectedBenefitPoint);
  });
  point.addEventListener("click", () => {
    selectedBenefitPoint = selectedBenefitPoint === point ? null : point;
    showBenefitPoint(focusedBenefitPoint ?? hoveredBenefitPoint ?? selectedBenefitPoint);
  });
});

benefitPanel.addEventListener("pointerenter", () => clearTimeout(benefitPanelTimer));
benefitPanel.addEventListener("pointerleave", () => {
  showBenefitPoint(focusedBenefitPoint ?? selectedBenefitPoint);
});

window.addEventListener("resize", () => {
  const activePoint = focusedBenefitPoint ?? hoveredBenefitPoint ?? selectedBenefitPoint;
  if (activePoint) positionBenefitPanel(activePoint);
});

const toolHotspots = [...document.querySelectorAll(".tools__hotspot")];
const toolPanel = document.querySelector("#tools-detail");
const toolPanelTitle = toolPanel.querySelector(".tools__panel-title");
const toolPanelDescription = toolPanel.querySelector(".tools__panel-description");
const toolScene = document.querySelector(".tools__scene");
let selectedTool = null;
let hoveredTool = null;
let focusedTool = null;
let toolPanelTimer;

function positionToolPanel(tool) {
  const sceneBounds = toolScene.getBoundingClientRect();
  const toolBounds = tool.getBoundingClientRect();
  const panelBounds = toolPanel.getBoundingClientRect();
  const edge = 12;
  const left = Math.max(edge, Math.min(
    toolBounds.left + toolBounds.width / 2 - sceneBounds.left - panelBounds.width / 2,
    sceneBounds.width - panelBounds.width - edge,
  ));
  let top = toolBounds.top - sceneBounds.top - panelBounds.height - 12;

  if (top < edge) top = toolBounds.bottom - sceneBounds.top + 12;
  top = Math.max(edge, Math.min(top, sceneBounds.height - panelBounds.height - edge));

  toolPanel.style.left = `${left}px`;
  toolPanel.style.top = `${top}px`;
}

function showTool(tool) {
  toolHotspots.forEach((button) => {
    const isActive = button === tool;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-expanded", String(isActive));
  });

  if (!tool) {
    toolPanel.classList.remove("is-open");
    toolPanel.setAttribute("aria-hidden", "true");
    return;
  }

  toolPanelTitle.textContent = tool?.dataset.toolTitle ?? "Explore the tools";
  toolPanelDescription.textContent = tool?.dataset.toolDescription
    ?? "Explore a marker to learn how each tool is used.";
  positionToolPanel(tool);
  toolPanel.classList.add("is-open");
  toolPanel.setAttribute("aria-hidden", "false");
}

toolHotspots.forEach((tool) => {
  tool.addEventListener("pointerenter", (event) => {
    if (event.pointerType !== "touch") {
      clearTimeout(toolPanelTimer);
      hoveredTool = tool;
      showTool(tool);
    }
  });
  tool.addEventListener("pointerleave", () => {
    hoveredTool = null;
    toolPanelTimer = setTimeout(() => {
      showTool(focusedTool ?? selectedTool);
    }, 180);
  });
  tool.addEventListener("focus", () => {
    focusedTool = tool;
    showTool(tool);
  });
  tool.addEventListener("blur", () => {
    focusedTool = null;
    showTool(hoveredTool ?? selectedTool);
  });
  tool.addEventListener("click", () => {
    selectedTool = selectedTool === tool ? null : tool;
    showTool(focusedTool ?? hoveredTool ?? selectedTool);
  });
});

toolPanel.addEventListener("pointerenter", () => clearTimeout(toolPanelTimer));
toolPanel.addEventListener("pointerleave", () => {
  showTool(focusedTool ?? selectedTool);
});

window.addEventListener("resize", () => {
  const activeTool = focusedTool ?? hoveredTool ?? selectedTool;
  if (activeTool) positionToolPanel(activeTool);
});

const bookingServices = [...document.querySelectorAll(".booking__service")];
const bookingPriceRing = document.querySelector("#booking-price-ring");
const bookingPrice = document.querySelector("#booking-price");
const bookingPriceCaption = document.querySelector("#booking-price-caption");
const maximumBookingPrice = Math.max(...bookingServices.map((service) => Number(service.dataset.price)));
let selectedBookingService = bookingServices.find((service) => service.classList.contains("is-selected"));

function showBookingPrice(service) {
  const price = Number(service.dataset.price);

  bookingServices.forEach((button) => {
    const isSelected = button === selectedBookingService;
    button.classList.toggle("is-selected", isSelected);
    button.classList.toggle("is-preview", button === service && !isSelected);
    button.setAttribute("aria-pressed", String(isSelected));
  });

  bookingPrice.textContent = price.toLocaleString("en-BW");
  bookingPriceCaption.textContent = `Estimated · ${service.dataset.duration}`;
  bookingPriceRing.style.setProperty("--price-progress", `${(price / maximumBookingPrice) * 360}deg`);
}

bookingServices.forEach((service) => {
  service.addEventListener("pointerenter", (event) => {
    if (event.pointerType !== "touch") showBookingPrice(service);
  });
  service.addEventListener("pointerleave", () => showBookingPrice(selectedBookingService));
  service.addEventListener("focus", () => showBookingPrice(service));
  service.addEventListener("blur", () => showBookingPrice(selectedBookingService));
  service.addEventListener("click", () => {
    selectedBookingService = service;
    showBookingPrice(service);
  });
});

showBookingPrice(selectedBookingService);

const workVideos = [...document.querySelectorAll(".work-carousel__video")];
const workTitles = ["A moment to unwind", "Make room to breathe", "Care that reaches deeper"];
const workCaptions = ["Calf and foot massage", "Neck and shoulder massage", "Back massage"];
const workProgress = document.querySelector("#work-progress");
const workSlideTitle = document.querySelector("#work-slide-title");
const workSlideCaption = document.querySelector("#work-slide-caption");
const workPlaybackStatus = document.querySelector("#work-playback-status");
let activeWorkVideo = 0;
let progressFrame;

function stopWorkProgress() {
  if (progressFrame) cancelAnimationFrame(progressFrame);
  progressFrame = undefined;
}

function updateWorkProgress() {
  const video = workVideos[activeWorkVideo];
  workProgress.value = Number.isFinite(video.duration) && video.duration > 0
    ? (video.currentTime / video.duration) * 100
    : 0;

  if (!video.paused && !video.ended) {
    progressFrame = requestAnimationFrame(updateWorkProgress);
  }
}

function playWorkVideo(index) {
  stopWorkProgress();
  activeWorkVideo = (index + workVideos.length) % workVideos.length;

  workVideos.forEach((video, videoIndex) => {
    const isActive = videoIndex === activeWorkVideo;
    video.pause();
    video.hidden = !isActive;
    video.muted = true;
    video.currentTime = 0;
  });

  const video = workVideos[activeWorkVideo];
  workProgress.value = 0;
  workSlideTitle.textContent = workTitles[activeWorkVideo];
  workSlideCaption.textContent = workCaptions[activeWorkVideo];
  workPlaybackStatus.textContent = "";

  video.play().then(() => {
    updateWorkProgress();
  }).catch(() => {
    workPlaybackStatus.textContent = "Video playback could not start. Use the next or previous buttons to continue.";
  });
}

document.querySelectorAll("[data-work-direction]").forEach((button) => {
  button.addEventListener("click", () => {
    playWorkVideo(activeWorkVideo + Number(button.dataset.workDirection));
  });
});

workVideos.forEach((video) => {
  video.addEventListener("ended", () => {
    if (video === workVideos[activeWorkVideo]) playWorkVideo(activeWorkVideo + 1);
  });
});

const workFrame = document.querySelector("#work-carousel-frame");
let workSwipeStartX = 0;

workFrame.addEventListener("pointerdown", (event) => {
  workSwipeStartX = event.clientX;
});

workFrame.addEventListener("pointerup", (event) => {
  const swipeDistance = event.clientX - workSwipeStartX;
  if (Math.abs(swipeDistance) < 45) return;
  playWorkVideo(activeWorkVideo + (swipeDistance < 0 ? 1 : -1));
});

playWorkVideo(0);
