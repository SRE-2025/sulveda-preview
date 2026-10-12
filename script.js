const menuButton = document.querySelector('[data-menu-button]');
const mobileNav = document.querySelector('[data-mobile-nav]');
const years = document.querySelectorAll('[data-year]');

if (menuButton && mobileNav) {
  menuButton.addEventListener('click', () => {
    const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
    menuButton.setAttribute('aria-expanded', String(!isOpen));
    mobileNav.classList.toggle('open', !isOpen);
  });

  mobileNav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      menuButton.setAttribute('aria-expanded', 'false');
      mobileNav.classList.remove('open');
    });
  });
}

years.forEach((year) => { year.textContent = new Date().getFullYear(); });

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const revealItems = document.querySelectorAll('.reveal');

if ('IntersectionObserver' in window && !reducedMotion) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  revealItems.forEach((item) => observer.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add('visible'));
}

document.querySelectorAll('[data-mail-form]').forEach((form) => {
  form.addEventListener('submit', (event) => {
    event.preventDefault();

    if (!form.reportValidity()) return;

    const recipient = form.dataset.recipient;
    const subject = form.dataset.subject || 'Sulveda Website Inquiry';
    const status = form.querySelector('[data-form-status]');
    const lines = [];

    new FormData(form).forEach((value, key) => {
      const cleanValue = String(value).trim();
      if (cleanValue) lines.push(`${key}: ${cleanValue}`);
    });

    lines.push('', 'Submitted from the Sulveda website concept.');
    const mailto = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\n'))}`;

    if (status) {
      status.textContent = 'Your request is ready. Your email app should open now.';
      status.classList.add('ready');
    }

    window.location.href = mailto;
  });
});
