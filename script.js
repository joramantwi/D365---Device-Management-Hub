const progressBar = document.querySelector("#progressBar");
const navLinks = [...document.querySelectorAll(".section-nav a")];
const sections = [...document.querySelectorAll(".section[id]")];
const slideCounter = document.querySelector("#slideCounter");
const presentButtons = [...document.querySelectorAll("[data-present]")];
const imageLightbox = document.querySelector("[data-lightbox]");
const lightboxImage = imageLightbox?.querySelector("img");
const lightboxCaption = imageLightbox?.querySelector("figcaption");
let currentSlideIndex = 0;

function updateProgress() {
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  const progress = maxScroll > 0 ? (window.scrollY / maxScroll) * 100 : 0;
  progressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
}

const observer = new IntersectionObserver(
  (entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

    if (!visible) return;

    currentSlideIndex = sections.indexOf(visible.target);
    updateSlideCounter();

    navLinks.forEach((link) => {
      link.classList.toggle("active", link.getAttribute("href") === `#${visible.target.id}`);
    });
  },
  { rootMargin: "-20% 0px -55% 0px", threshold: [0.1, 0.3, 0.6] }
);

sections.forEach((section) => observer.observe(section));

function updateSlideCounter() {
  if (!slideCounter) return;
  slideCounter.textContent = `${currentSlideIndex + 1} / ${sections.length}`;
}

function updatePresentationButtons() {
  const isPresenting = document.body.classList.contains("presenting");

  presentButtons.forEach((button) => {
    button.textContent = isPresenting ? button.dataset.exitLabel || "Exit" : button.dataset.presentLabel || "Present";
    button.setAttribute("aria-pressed", String(isPresenting));
  });
}

function getSlideIndexFromHash() {
  return sections.findIndex((section) => `#${section.id}` === window.location.hash);
}

function setCurrentSlide(index, shouldScroll = true) {
  currentSlideIndex = Math.min(sections.length - 1, Math.max(0, index));

  sections.forEach((section, sectionIndex) => {
    section.classList.toggle("is-current", sectionIndex === currentSlideIndex);
  });

  updateSlideCounter();

  if (shouldScroll && !document.body.classList.contains("presenting")) {
    sections[currentSlideIndex].scrollIntoView({ block: "start", behavior: "smooth" });
  }
}

async function enterPresentation() {
  currentSlideIndex = 0;
  setCurrentSlide(currentSlideIndex, false);
  document.body.classList.add("presenting");
  updatePresentationButtons();

  if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
    try {
      await document.documentElement.requestFullscreen();
    } catch {
      document.body.classList.add("presenting");
    }
  }
}

async function exitPresentation() {
  document.body.classList.remove("presenting");
  updatePresentationButtons();
  sections[currentSlideIndex].scrollIntoView({ block: "start" });

  if (document.fullscreenElement && document.exitFullscreen) {
    try {
      await document.exitFullscreen();
    } catch {
      document.body.classList.remove("presenting");
    }
  }
}

function goToSlide(delta) {
  setCurrentSlide(currentSlideIndex + delta, !document.body.classList.contains("presenting"));
}

presentButtons.forEach((button) => {
  button.addEventListener("click", () => {
    if (document.body.classList.contains("presenting")) {
      exitPresentation();
    } else {
      enterPresentation();
    }
  });
});

document.querySelector("[data-prev]")?.addEventListener("click", () => goToSlide(-1));
document.querySelector("[data-next]")?.addEventListener("click", () => goToSlide(1));

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && imageLightbox && !imageLightbox.hidden) {
    event.preventDefault();
    closeImageLightbox();
    return;
  }

  const activeTag = document.activeElement?.tagName?.toLowerCase();
  if (activeTag === "input" || activeTag === "textarea" || activeTag === "select") return;

  if (event.key === "ArrowRight" || event.key === "PageDown") {
    event.preventDefault();
    goToSlide(1);
  }

  if (event.key === "ArrowLeft" || event.key === "PageUp") {
    event.preventDefault();
    goToSlide(-1);
  }

  if (event.key === "Home") {
    event.preventDefault();
    setCurrentSlide(0, !document.body.classList.contains("presenting"));
  }

  if (event.key === "End") {
    event.preventDefault();
    setCurrentSlide(sections.length - 1, !document.body.classList.contains("presenting"));
  }

  if (event.key.toLowerCase() === "f") {
    event.preventDefault();
    if (document.body.classList.contains("presenting")) {
      exitPresentation();
    } else {
      enterPresentation();
    }
  }

  if (event.key === "Escape" && document.body.classList.contains("presenting")) {
    exitPresentation();
  }
});

// Ensure the demo videos play automatically and loop like a GIF.
const heroVideos = [...document.querySelectorAll(".hero-video")];
if (heroVideos.length) {
  const playHeroVideos = () => {
    heroVideos.forEach((video) => {
      video.muted = true;
      video.removeAttribute("controls");
      const attempt = video.play();
      if (attempt && typeof attempt.catch === "function") {
        attempt.catch(() => {});
      }
    });
  };
  playHeroVideos();
  heroVideos.forEach((video) => video.addEventListener("canplay", playHeroVideos, { once: true }));
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) playHeroVideos();
  });
}

document.addEventListener("fullscreenchange", () => {
  if (!document.fullscreenElement) {
    document.body.classList.remove("presenting");
    updatePresentationButtons();
  }
});

document.querySelectorAll(".evidence-card, .journey-shot").forEach((card) => {
  const media = card.querySelector(".evidence-media, .journey-media");
  const src = card.dataset.src;
  if (!media || !src) return;

  const image = new Image();
  image.alt = card.querySelector("h3")?.textContent || "Demo screenshot";
  image.loading = "eager";
  image.onload = () => {
    media.classList.add("has-image");
    media.append(image);
  };
  image.src = src;
});

function openImageLightbox(card) {
  if (!imageLightbox || !lightboxImage || !lightboxCaption) return;

  const src = card.dataset.src;
  if (!src) return;

  const title = card.querySelector("h3")?.textContent?.trim() || "Expanded screenshot";
  lightboxImage.src = src;
  lightboxImage.alt = title;
  lightboxCaption.textContent = title;
  imageLightbox.hidden = false;
  document.body.classList.add("lightbox-open");
  imageLightbox.querySelector("[data-lightbox-close]")?.focus();
}

function closeImageLightbox() {
  if (!imageLightbox || imageLightbox.hidden) return;

  imageLightbox.hidden = true;
  document.body.classList.remove("lightbox-open");
  lightboxImage?.removeAttribute("src");
}

document.querySelectorAll(".journey-shot").forEach((card) => {
  card.addEventListener("click", () => openImageLightbox(card));
  card.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    openImageLightbox(card);
  });
});

document.querySelectorAll("[data-lightbox-close]").forEach((button) => {
  button.addEventListener("click", closeImageLightbox);
});

window.addEventListener("scroll", updateProgress, { passive: true });
window.addEventListener("resize", updateProgress);

const initialSlideIndex = Math.max(
  0,
  getSlideIndexFromHash()
);
setCurrentSlide(initialSlideIndex, initialSlideIndex > 0);
updatePresentationButtons();
updateProgress();
