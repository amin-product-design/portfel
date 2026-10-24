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
