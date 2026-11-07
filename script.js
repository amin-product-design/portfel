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

const heroPhoto = document.querySelector('.hero-photo');
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
