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

const planCatalog = {
  'one-time': {
    name: 'One-time dispenser',
    description: 'One 30-day dispenser',
    price: '$29.99',
    due: '$29.99',
    formValue: 'One-time dispenser — $29.99'
  },
  monthly: {
    name: 'Monthly subscription',
    description: 'One dispenser every 30 days',
    price: '$24.99/mo',
    due: '$24.99',
    formValue: 'Monthly subscription — $24.99/month'
  },
  quarterly: {
    name: '90-day supply',
    description: 'Three 30-day dispensers',
    price: '$69.99',
    due: '$69.99',
    formValue: '90-day supply — $69.99'
  }
};

const shopCheckout = document.querySelector('[data-shop-checkout]');
const shopPlans = document.querySelectorAll('input[name="shop-plan"]');

if (shopCheckout && shopPlans.length) {
  shopPlans.forEach((input) => {
    input.addEventListener('change', () => {
      if (input.checked) shopCheckout.href = `checkout.html#${input.value}`;
    });
  });
}

const orderPlanInput = document.querySelector('[data-order-plan-input]');

if (orderPlanInput) {
  const requestedPlan = window.location.hash.replace('#', '') || new URLSearchParams(window.location.search).get('plan');
  const selectedPlan = planCatalog[requestedPlan] || planCatalog.monthly;
  orderPlanInput.value = selectedPlan.formValue;

  const orderName = document.querySelector('[data-order-name]');
  const orderDescription = document.querySelector('[data-order-description]');
  const orderPrice = document.querySelector('[data-order-price]');
  const orderDue = document.querySelector('[data-order-due]');

  if (orderName) orderName.textContent = selectedPlan.name;
  if (orderDescription) orderDescription.textContent = selectedPlan.description;
  if (orderPrice) orderPrice.textContent = selectedPlan.price;
  if (orderDue) orderDue.textContent = selectedPlan.due;
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
