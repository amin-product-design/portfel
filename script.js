const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const revealItems = document.querySelectorAll('.reveal');
if (!reduceMotion.matches && 'IntersectionObserver' in window) {
  document.documentElement.classList.add('js-reveal');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    rootMargin: '0px 0px -10% 0px',
    threshold: 0.08
  });
  revealItems.forEach(item => observer.observe(item));
}
// Просмотр исходных изображений: кнопки на компьютере, pinch-to-zoom на телефоне.
const zoomableImages = document.querySelectorAll('main img:not(.download-icon)');
if (zoomableImages.length) {
  const imageViewer = document.createElement('div');
  imageViewer.className = 'image-viewer';
  imageViewer.hidden = true;
  imageViewer.setAttribute('role', 'dialog');
  imageViewer.setAttribute('aria-modal', 'true');
  imageViewer.setAttribute('aria-label', 'Просмотр изображения');
  imageViewer.innerHTML =
    '<div class="image-viewer__backdrop"></div>' +
    '<div class="image-viewer__panel">' +
      '<div class="image-viewer__stage"><img class="image-viewer__image" alt=""></div>' +
      '<button class="image-viewer__close" type="button" aria-label="Закрыть изображение">×</button>' +
      '<div class="image-viewer__zoom" aria-label="Масштаб изображения">' +
        '<button type="button" data-zoom="out" aria-label="Уменьшить">−</button>' +
        '<output aria-live="polite">100%</output>' +
        '<button type="button" data-zoom="in" aria-label="Увеличить">+</button>' +
      '</div>' +
    '</div>';
  document.body.append(imageViewer);

  const stage = imageViewer.querySelector('.image-viewer__stage');
  const enlargedImage = imageViewer.querySelector('.image-viewer__image');
  const closeButton = imageViewer.querySelector('.image-viewer__close');
  const zoomOutput = imageViewer.querySelector('output');
  const zoomButtons = [...imageViewer.querySelectorAll('[data-zoom]')];
  const activePointers = new Map();
  let viewerScale = 1;
  let viewerX = 0;
  let viewerY = 0;
  let viewerTrigger = null;
  let pinchStartDistance = 0;
  let pinchStartScale = 1;

  function clampViewerPosition() {
    if (viewerScale <= 1 || !enlargedImage.naturalWidth) {
      viewerX = 0;
      viewerY = 0;
      return;
    }
    const fit = Math.min(1, stage.clientWidth / enlargedImage.naturalWidth,
      stage.clientHeight / enlargedImage.naturalHeight);
    const imageWidth = enlargedImage.naturalWidth * fit * viewerScale;
    const imageHeight = enlargedImage.naturalHeight * fit * viewerScale;
    const maxX = Math.max(0, (imageWidth - stage.clientWidth) / 2);
    const maxY = Math.max(0, (imageHeight - stage.clientHeight) / 2);
    viewerX = Math.max(-maxX, Math.min(maxX, viewerX));
    viewerY = Math.max(-maxY, Math.min(maxY, viewerY));
  }

  function renderViewer() {
    clampViewerPosition();
    enlargedImage.style.setProperty('--viewer-scale', viewerScale);
    enlargedImage.style.setProperty('--viewer-x', viewerX + 'px');
    enlargedImage.style.setProperty('--viewer-y', viewerY + 'px');
    zoomOutput.value = Math.round(viewerScale * 100) + '%';
    zoomButtons[0].disabled = viewerScale <= 1;
    zoomButtons[1].disabled = viewerScale >= 5;
  }

  function setViewerScale(nextScale, clientX, clientY) {
    const next = Math.max(1, Math.min(5, nextScale));
    if (next === viewerScale) return;
    if (clientX !== undefined && clientY !== undefined) {
      const bounds = stage.getBoundingClientRect();
      const focusX = clientX - bounds.left - bounds.width / 2;
      const focusY = clientY - bounds.top - bounds.height / 2;
      viewerX = focusX - (focusX - viewerX) * next / viewerScale;
      viewerY = focusY - (focusY - viewerY) * next / viewerScale;
    }
    viewerScale = next;
    renderViewer();
  }

  function openViewer(sourceImage, event) {
    if (event) event.preventDefault();
    const imageLink = sourceImage.closest('a[href]');
    const fullSource = imageLink && /\.(png|jpe?g|webp|gif|avif)(?:[?#]|$)/i.test(imageLink.href)
      ? imageLink.href : sourceImage.currentSrc || sourceImage.src;
    viewerTrigger = sourceImage.closest('a[href]') || sourceImage;
    viewerScale = 1;
    viewerX = 0;
    viewerY = 0;
    activePointers.clear();
    enlargedImage.alt = sourceImage.alt || 'Изображение проекта';
    enlargedImage.src = fullSource;
    imageViewer.hidden = false;
    document.documentElement.classList.add('image-viewer-open');
    document.body.classList.add('image-viewer-open');
    renderViewer();
    closeButton.focus();
  }

  function closeViewer() {
    if (imageViewer.hidden) return;
    imageViewer.hidden = true;
    enlargedImage.removeAttribute('src');
    activePointers.clear();
    document.documentElement.classList.remove('image-viewer-open');
    document.body.classList.remove('image-viewer-open');
    viewerTrigger?.focus();
  }

  zoomableImages.forEach(sourceImage => {
    const link = sourceImage.closest('a[href]');
    if (!link) {
      sourceImage.tabIndex = 0;
      sourceImage.setAttribute('role', 'button');
      sourceImage.setAttribute('aria-label', 'Увеличить: ' + (sourceImage.alt || 'изображение'));
      sourceImage.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') openViewer(sourceImage, event);
      });
    }
    sourceImage.addEventListener('click', event => openViewer(sourceImage, event));
  });

  closeButton.addEventListener('click', closeViewer);
  imageViewer.querySelector('.image-viewer__backdrop').addEventListener('click', closeViewer);
  zoomButtons[0].addEventListener('click', () => setViewerScale(viewerScale / 1.5));
  zoomButtons[1].addEventListener('click', () => setViewerScale(viewerScale * 1.5));
  enlargedImage.addEventListener('load', renderViewer);
  window.addEventListener('resize', () => { if (!imageViewer.hidden) renderViewer(); });

  imageViewer.addEventListener('keydown', event => {
    if (event.key === 'Escape') { event.preventDefault(); closeViewer(); }
    if (event.key === '+' || event.key === '=') setViewerScale(viewerScale * 1.5);
    if (event.key === '-') setViewerScale(viewerScale / 1.5);
    if (event.key === 'Tab') {
      const controls = [closeButton, ...zoomButtons.filter(button => getComputedStyle(button.parentElement).display !== 'none')];
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });

  stage.addEventListener('wheel', event => {
    event.preventDefault();
    setViewerScale(viewerScale * (event.deltaY < 0 ? 1.15 : 1 / 1.15), event.clientX, event.clientY);
  }, { passive: false });

  function pointerDistance() {
    const points = [...activePointers.values()];
    return Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
  }

  stage.addEventListener('pointerdown', event => {
    stage.setPointerCapture(event.pointerId);
    activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (activePointers.size === 2) {
      pinchStartDistance = pointerDistance();
      pinchStartScale = viewerScale;
    }
  });

  stage.addEventListener('pointermove', event => {
    const previous = activePointers.get(event.pointerId);
    if (!previous) return;
    activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (activePointers.size === 2) {
      const points = [...activePointers.values()];
      const centerX = (points[0].x + points[1].x) / 2;
      const centerY = (points[0].y + points[1].y) / 2;
      if (pinchStartDistance) setViewerScale(pinchStartScale * pointerDistance() / pinchStartDistance, centerX, centerY);
    } else if (activePointers.size === 1 && viewerScale > 1) {
      viewerX += event.clientX - previous.x;
      viewerY += event.clientY - previous.y;
      renderViewer();
    }
  });

  function endPointer(event) {
    activePointers.delete(event.pointerId);
    if (activePointers.size < 2) pinchStartDistance = 0;
  }
  stage.addEventListener('pointerup', endPointer);
  stage.addEventListener('pointercancel', endPointer);
  stage.addEventListener('dblclick', event => {
    setViewerScale(viewerScale > 1 ? 1 : 2, event.clientX, event.clientY);
  });
}


const heroPhoto = document.querySelector('.hero-photo-wrap');
let scrollQueued = false;

function updateParallax() {
  scrollQueued = false;
  if (!heroPhoto) return;
  if (reduceMotion.matches || window.innerWidth <= 760) {
    heroPhoto.style.setProperty('--hero-parallax', '0px');
    return;
  }
  heroPhoto.style.setProperty('--hero-parallax', `${Math.min(window.scrollY * 0.08, 28)}px`);
}
window.addEventListener('scroll', () => {
  if (!scrollQueued) {
    scrollQueued = true;
    requestAnimationFrame(updateParallax);
  }
}, {
  passive: true
});
window.addEventListener('resize', updateParallax);
reduceMotion.addEventListener?.('change', updateParallax);
updateParallax();


// Появление содержимого кейса и лёгкий параллакс изображений.
const caseContent = document.querySelector('.case-content');
if (caseContent && !reduceMotion.matches && 'IntersectionObserver' in window) {
  const caseRevealItems = caseContent.querySelectorAll(
    '.research-label, .research-copy, .research-reviews, .review-mobile, .research-pair figure, .case-image-scroll, .metric-card, .case-conclusion > h2, .conclusion-grid > div'
  );
  caseRevealItems.forEach(item => item.classList.add('case-appear'));
  document.documentElement.classList.add('js-case-motion');

  const caseObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        caseObserver.unobserve(entry.target);
      }
    });
  }, { rootMargin: '0px 0px -6% 0px', threshold: 0.04 });
  caseRevealItems.forEach(item => caseObserver.observe(item));
}

const caseImages = [...document.querySelectorAll('.case-wide-images .case-image-scroll')];
if (caseImages.length) {
  let caseScrollQueued = false;
  function updateCaseParallax() {
    caseScrollQueued = false;
    if (reduceMotion.matches || window.innerWidth <= 760) {
      caseImages.forEach(frame => frame.style.setProperty('--case-shift', '0px'));
      return;
    }
    const viewportHeight = window.innerHeight;
    caseImages.forEach(frame => {
      const rect = frame.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > viewportHeight) return;
      const progress = (viewportHeight / 2 - (rect.top + rect.height / 2)) / ((viewportHeight + rect.height) / 2);
      frame.style.setProperty('--case-shift', Math.max(-12, Math.min(12, progress * 12)).toFixed(1) + 'px');
    });
  }
  function queueCaseParallax() {
    if (caseScrollQueued) return;
    caseScrollQueued = true;
    requestAnimationFrame(updateCaseParallax);
  }
  window.addEventListener('scroll', queueCaseParallax, { passive: true });
  window.addEventListener('resize', queueCaseParallax);
  reduceMotion.addEventListener?.('change', queueCaseParallax);
  queueCaseParallax();
}


// The nine equal tiles correspond to cursor directions around the portrait.
const heroPose = document.querySelector('.hero-photo-poses');
const precisePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
if (heroPhoto && heroPose) {
  const atlas = new Image();
  atlas.onload = () => heroPhoto.classList.add('is-ready');
  atlas.src = 'Медиа/фото ава-повороты.png';
  let poseFrame = 0;
  window.addEventListener('pointermove', event => {
    if (!precisePointer.matches || reduceMotion.matches || !heroPhoto.classList.contains('is-ready')) return;
    if (poseFrame) return;
    poseFrame = requestAnimationFrame(() => {
      poseFrame = 0;
      const bounds = heroPhoto.getBoundingClientRect();
      const dx = event.clientX - (bounds.left + bounds.width / 2);
      const dy = event.clientY - (bounds.top + bounds.height / 2);
      const column = dx < -90 ? 0 : dx > 90 ? 100 : 50;
      const row = dy < -90 ? 0 : dy > 90 ? 100 : 50;
      heroPose.style.backgroundPosition = `${column}% ${row}%`;
    });
  }, { passive: true });
  document.addEventListener('mouseleave', () => {
    heroPose.style.backgroundPosition = '50% 50%';
  });
}
