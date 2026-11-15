const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
const revealItems = document.querySelectorAll('.reveal');
if (!motionPreference.matches && 'IntersectionObserver' in window) {
  document.documentElement.classList.add('js-motion');
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    }
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.04 });
  revealItems.forEach(item => observer.observe(item));
}

const viewer = document.querySelector('.image-viewer');
const stage = viewer.querySelector('.image-viewer__stage');
const image = viewer.querySelector('.image-viewer__image');
const closeButton = viewer.querySelector('.image-viewer__close');
const zoomButtons = [...viewer.querySelectorAll('[data-zoom]')];
const zoomOutput = viewer.querySelector('output');
const pointers = new Map();
let scale = 1;
let offsetX = 0;
let offsetY = 0;
let lastTrigger = null;
let initialPinchDistance = 0;
let initialPinchScale = 1;

function keepImageInView() {
  if (scale <= 1 || !image.naturalWidth) {
    offsetX = 0;
    offsetY = 0;
    return;
  }
  const fit = Math.min(1, stage.clientWidth / image.naturalWidth,
    stage.clientHeight / image.naturalHeight);
  const width = image.naturalWidth * fit * scale;
  const height = image.naturalHeight * fit * scale;
  const maxX = Math.max(0, (width - stage.clientWidth) / 2);
  const maxY = Math.max(0, (height - stage.clientHeight) / 2);
  offsetX = Math.max(-maxX, Math.min(maxX, offsetX));
  offsetY = Math.max(-maxY, Math.min(maxY, offsetY));
}

function drawImage() {
  keepImageInView();
  image.style.setProperty('--viewer-scale', scale);
  image.style.setProperty('--viewer-x', offsetX + 'px');
  image.style.setProperty('--viewer-y', offsetY + 'px');
  zoomOutput.value = Math.round(scale * 100) + '%';
  zoomButtons[0].disabled = scale <= 1;
  zoomButtons[1].disabled = scale >= 5;
}

function changeScale(amount, clientX, clientY) {
  const next = Math.max(1, Math.min(5, amount));
  if (next === scale) return;
  if (clientX !== undefined && clientY !== undefined) {
    const rect = stage.getBoundingClientRect();
    const focusX = clientX - rect.left - rect.width / 2;
    const focusY = clientY - rect.top - rect.height / 2;
    offsetX = focusX - (focusX - offsetX) * next / scale;
    offsetY = focusY - (focusY - offsetY) * next / scale;
  }
  scale = next;
  drawImage();
}

function openViewer(trigger) {
  lastTrigger = trigger;
  scale = 1;
  offsetX = 0;
  offsetY = 0;
  pointers.clear();
  image.alt = trigger.dataset.alt || trigger.querySelector('img')?.alt || 'Макет сайта';
  image.src = trigger.dataset.image;
  viewer.hidden = false;
  document.body.classList.add('viewer-open');
  drawImage();
  closeButton.focus();
}

function closeViewer() {
  if (viewer.hidden) return;
  viewer.hidden = true;
  image.removeAttribute('src');
  document.body.classList.remove('viewer-open');
  pointers.clear();
  lastTrigger?.focus();
}

document.querySelectorAll('[data-image]').forEach(trigger => {
  trigger.addEventListener('click', () => openViewer(trigger));
});
viewer.querySelectorAll('[data-close]').forEach(control => control.addEventListener('click', closeViewer));
zoomButtons[0].addEventListener('click', () => changeScale(scale / 1.5));
zoomButtons[1].addEventListener('click', () => changeScale(scale * 1.5));
image.addEventListener('load', drawImage);
window.addEventListener('resize', () => { if (!viewer.hidden) drawImage(); });

viewer.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    event.preventDefault();
    closeViewer();
  }
  if (event.key === '+' || event.key === '=') changeScale(scale * 1.5);
  if (event.key === '-') changeScale(scale / 1.5);
  if (event.key === 'Tab') {
    const controls = [closeButton, ...zoomButtons.filter(button => getComputedStyle(button.parentElement).display !== 'none')];
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
});

stage.addEventListener('wheel', event => {
  event.preventDefault();
  changeScale(scale * (event.deltaY < 0 ? 1.15 : 1 / 1.15), event.clientX, event.clientY);
}, { passive: false });

function pointerDistance() {
  const points = [...pointers.values()];
  return Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
}

stage.addEventListener('pointerdown', event => {
  stage.setPointerCapture(event.pointerId);
  pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
  if (pointers.size === 2) {
    initialPinchDistance = pointerDistance();
    initialPinchScale = scale;
  }
});
stage.addEventListener('pointermove', event => {
  const previous = pointers.get(event.pointerId);
  if (!previous) return;
  pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
  if (pointers.size === 2) {
    const points = [...pointers.values()];
    const centerX = (points[0].x + points[1].x) / 2;
    const centerY = (points[0].y + points[1].y) / 2;
    if (initialPinchDistance) {
      changeScale(initialPinchScale * pointerDistance() / initialPinchDistance, centerX, centerY);
    }
  } else if (pointers.size === 1 && scale > 1) {
    offsetX += event.clientX - previous.x;
    offsetY += event.clientY - previous.y;
    drawImage();
  }
});
function releasePointer(event) {
  pointers.delete(event.pointerId);
  if (pointers.size < 2) initialPinchDistance = 0;
}
stage.addEventListener('pointerup', releasePointer);
stage.addEventListener('pointercancel', releasePointer);
stage.addEventListener('dblclick', event => {
  changeScale(scale > 1 ? 1 : 2, event.clientX, event.clientY);
});
