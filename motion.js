/* Progressive enhancement: content is readable with JS or motion disabled. */
(function () {
  'use strict';
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const root = document.documentElement;
  let observer;
  let manualOff = false;
  try { manualOff = window.sessionStorage.getItem('sulveda-motion-v1') === 'off'; } catch (_) { /* Optional preference only. */ }
  let stopped = preference.matches || manualOff;
  root.classList.toggle('motion-paused', stopped);
  const selectors = '.benefit-section-heading, .benefit-goals article, .comparison-heading, .comparison-table-wrap, .gut-science-layout > div, .science-purpose, .benefit-product > div, .purpose-spec, .home-difference-copy, .home-mint-contrast, .quick-answers > div, .section-title, .choice-grid article, .doctor-grid article, .retail-proof-grid article, .principles-grid > div, .form-intro';

  function revealAll() {
    root.classList.remove('motion-ready');
    root.style.removeProperty('--page-progress');
    if (observer) observer.disconnect();
    document.querySelectorAll('.motion-item').forEach((item) => item.classList.add('in-view'));
    document.querySelectorAll('[data-product-stage]').forEach((stage) => {
      stage.style.removeProperty('--tilt-x');
      stage.style.removeProperty('--tilt-y');
    });
  }

  function start() {
    if (stopped || !('IntersectionObserver' in window)) return;
    root.classList.add('motion-ready');
    const items = document.querySelectorAll(selectors);
    observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px 28px 0px' });
    items.forEach((item) => {
      item.classList.add('motion-item');
      const siblings = Array.from(item.parentElement.children);
      item.style.setProperty('--reveal-delay', (Math.min(siblings.indexOf(item), 3) * 75) + 'ms');
      observer.observe(item);
    });
  }

  // Scrolling remains native. Only a decorative progress line is updated.
  let scheduled = false;
  function updateProgress() {
    scheduled = false;
    if (stopped) return;
    const distance = root.scrollHeight - window.innerHeight;
    root.style.setProperty('--page-progress', distance > 0 ? Math.min(1, Math.max(0, window.scrollY / distance)) : 0);
  }
  window.addEventListener('scroll', () => {
    if (!stopped && !scheduled) {
      scheduled = true;
      window.requestAnimationFrame(updateProgress);
    }
  }, { passive: true });

  // Pointer-driven depth is deliberately slight and never runs on touch screens.
  document.querySelectorAll('[data-product-stage]').forEach((stage) => {
    stage.addEventListener('pointermove', (event) => {
      if (stopped || event.pointerType !== 'mouse') return;
      const bounds = stage.getBoundingClientRect();
      stage.style.setProperty('--tilt-x', ((0.5 - (event.clientY - bounds.top) / bounds.height) * 2.5) + 'deg');
      stage.style.setProperty('--tilt-y', (((event.clientX - bounds.left) / bounds.width - 0.5) * 3) + 'deg');
    });
    stage.addEventListener('pointerleave', () => {
      stage.style.setProperty('--tilt-x', '0deg');
      stage.style.setProperty('--tilt-y', '0deg');
    });
  });

  document.querySelectorAll('[data-motion-toggle]').forEach((button) => {
    button.hidden = false;
    button.addEventListener('click', () => {
      if (preference.matches) return;
      stopped = !stopped;
      manualOff = stopped;
      try { window.sessionStorage.setItem('sulveda-motion-v1', stopped ? 'off' : 'on'); } catch (_) { /* The switch still works without storage. */ }
      root.classList.toggle('motion-paused', stopped);
      button.setAttribute('aria-pressed', String(stopped));
      button.textContent = stopped ? 'Motion is off' : 'Reduce motion';
      if (stopped) revealAll();
      else { start(); updateProgress(); }
    });
    button.setAttribute('aria-pressed', String(stopped));
    button.disabled = preference.matches;
    button.textContent = preference.matches ? 'Motion off (system setting)' : stopped ? 'Motion is off' : 'Reduce motion';
  });

  preference.addEventListener('change', (event) => {
    stopped = event.matches || manualOff;
    root.classList.toggle('motion-paused', stopped);
    document.querySelectorAll('[data-motion-toggle]').forEach((button) => {
      button.setAttribute('aria-pressed', String(stopped));
      button.disabled = event.matches;
      button.textContent = event.matches ? 'Motion off (system setting)' : stopped ? 'Motion is off' : 'Reduce motion';
    });
    if (stopped) revealAll();
    else start();
  });
  start();
  updateProgress();
}());
