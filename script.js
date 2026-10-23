/* Shared navigation, inquiry forms, and the Sulveda shopping bag. */
'use strict';

const menuButton = document.querySelector('[data-menu-button]');
const mobileNav = document.querySelector('[data-mobile-nav]');
const closeMenu = () => {
  if (!menuButton || !mobileNav) return;
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.querySelector('.sr-only').textContent = 'Open navigation';
  mobileNav.classList.remove('open');
};

if (menuButton && mobileNav) {
  menuButton.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') !== 'true';
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.querySelector('.sr-only').textContent = open ? 'Close navigation' : 'Open navigation';
    mobileNav.classList.toggle('open', open);
  });
  mobileNav.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
      closeMenu();
      menuButton.focus({ preventScroll: true });
    }
  });
  document.addEventListener('click', (event) => {
    if (menuButton.getAttribute('aria-expanded') === 'true' && !event.target.closest('.store-header')) closeMenu();
  });
  window.matchMedia('(min-width: 821px)').addEventListener('change', (event) => {
    if (event.matches) closeMenu();
  });
}
document.querySelectorAll('nav a[href]').forEach((link) => {
  const destination = new URL(link.href);
  const currentPath = window.location.pathname.replace(/\/$/, '/index.html');
  if (!destination.hash && destination.pathname === currentPath) link.setAttribute('aria-current', 'page');
});
document.querySelectorAll('[data-year]').forEach((year) => { year.textContent = new Date().getFullYear(); });

/* Existing partner and practitioner forms prepare email; they do not send it. */
document.querySelectorAll('[data-mail-form]').forEach((form) => {
  const requiredText = form.querySelectorAll('input:not([type])[required], input[type="text"][required], textarea[required]');
  requiredText.forEach((field) => field.addEventListener('input', () => field.setCustomValidity('')));
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    requiredText.forEach((field) => field.setCustomValidity(field.value.trim() ? '' : 'Please complete this field.'));
    if (!form.reportValidity()) return;
    const lines = [];
    new FormData(form).forEach((value, key) => {
      if (String(value).trim()) lines.push(key + ': ' + String(value).trim());
    });
    lines.push('', 'Prepared from the Sulveda website.');
    const mailto = 'mailto:' + form.dataset.recipient + '?subject=' + encodeURIComponent(form.dataset.subject || 'Sulveda inquiry') + '&body=' + encodeURIComponent(lines.join('\n'));
    const status = form.querySelector('[data-form-status]');
    if (status) {
      status.textContent = 'Your email draft is ready. Complete sending in your email app; nothing has been sent by this website.';
      status.classList.add('ready');
      const fallback = document.createElement('a');
      fallback.href = mailto;
      fallback.textContent = ' Open email again';
      status.append(fallback);
    }
    window.location.href = mailto;
  });
});

(function () {
  const commerce = window.SulvedaCommerce;
  if (!commerce) return;
  const { plans, hasPlan, quantity, money } = commerce;
  const storageKey = 'sulveda-bag-v1';
  const orderEmail = 'williamcolton@paldara.com';
  let storage;
  let cart = [];
  let readyText = '';
  let enquiryReference = '';

  for (const name of ['localStorage', 'sessionStorage']) {
    try {
      const candidate = window[name];
      candidate.setItem('sulveda-storage-check', '1');
      candidate.removeItem('sulveda-storage-check');
      storage = candidate;
      break;
    } catch (_) { /* Fall back to session storage when local storage is unavailable. */ }
  }

  function readCart() {
    if (!storage) return cart;
    try {
      const saved = JSON.parse(storage.getItem(storageKey) || '{"items":[]}');
      return commerce.normalize(saved.items);
    } catch (_) { return []; }
  }

  function writeCart(items) {
    const nextCart = commerce.normalize(items);
    if (!storage) {
      notice('Your browser is blocking shopping-bag storage. Allow site storage to carry your selection into checkout.');
      return false;
    }
    try {
      storage.setItem(storageKey, JSON.stringify({ version: 1, items: nextCart }));
      cart = nextCart;
      return true;
    } catch (_) {
      notice('Your bag could not be saved. Please allow site storage and try again.');
      return false;
    }
  }

  function notice(message) {
    document.querySelectorAll('[data-cart-notice]').forEach((item) => { item.textContent = message; });
  }

  function updateTotals() {
    const totals = commerce.summary(cart);
    document.querySelectorAll('[data-cart-count]').forEach((item) => { item.textContent = totals.packages; });
    document.querySelectorAll('.bag-link').forEach((link) => { link.setAttribute('aria-label', 'Shopping bag, ' + totals.packages + (totals.packages === 1 ? ' selection' : ' selections')); });
    document.querySelectorAll('[data-cart-subtotal], [data-cart-total]').forEach((item) => { item.textContent = money(totals.subtotalCents); });
    document.querySelectorAll('[data-cart-renewal]').forEach((item) => {
      item.hidden = totals.recurringCents === 0;
      item.textContent = 'Monthly portion: ' + money(totals.recurringCents) + ' every 30 days, plus confirmed tax and shipping. No subscription starts today.';
    });
    const supply = document.querySelector('[data-cart-supply]');
    if (supply) supply.textContent = totals.dispensers + (totals.dispensers === 1 ? ' dispenser' : ' dispensers') + ' · ' + totals.mints + ' mints in this selection.';
    const saving = document.querySelector('[data-cart-saving]');
    if (saving) {
      saving.hidden = totals.savingsCents === 0;
      saving.textContent = 'You save ' + money(totals.savingsCents) + ' compared with individual one-time dispensers.';
    }
  }

  function renderBag() {
    const container = document.querySelector('[data-cart-items]');
    if (!container) return;
    const filled = document.querySelector('[data-filled-cart]');
    const empty = document.querySelector('[data-empty-cart]');
    filled.hidden = cart.length === 0;
    empty.hidden = cart.length !== 0;
    container.replaceChildren();
    cart.forEach((item) => {
      const plan = plans[item.plan];
      const fragment = document.querySelector('#cart-item-template').content.cloneNode(true);
      const article = fragment.querySelector('article');
      article.dataset.plan = item.plan;
      article.querySelector('[data-item-name]').textContent = plan.name;
      article.querySelector('[data-item-description]').textContent = plan.description;
      article.querySelector('[data-item-price]').textContent = money(plan.priceCents) + (plan.recurring ? ' / delivery' : ' / selection');
      article.querySelector('[data-item-total]').textContent = money(plan.priceCents * item.quantity);
      const input = article.querySelector('[data-item-quantity]');
      input.value = item.quantity;
      input.setAttribute('aria-label', plan.name + ' quantity');
      article.querySelector('[data-step="-1"]').disabled = item.quantity <= 1;
      article.querySelector('[data-step="1"]').disabled = item.quantity >= 10;
      article.querySelectorAll('[data-step]').forEach((button) => {
        button.setAttribute('aria-label', (button.dataset.step === '1' ? 'Increase ' : 'Decrease ') + plan.name + ' quantity');
      });
      article.querySelector('[data-remove-item]').setAttribute('aria-label', 'Remove ' + plan.name);
      container.append(fragment);
    });
  }

  function renderCheckout() {
    const content = document.querySelector('[data-checkout-content]');
    if (!content) return;
    content.hidden = cart.length === 0;
    document.querySelector('[data-checkout-empty]').hidden = cart.length > 0;
    const lines = document.querySelector('[data-checkout-lines]');
    lines.replaceChildren();
    cart.forEach((item) => {
      const line = document.createElement('div');
      line.className = 'enquiry-line';
      const text = document.createElement('span');
      const name = document.createElement('strong');
      name.textContent = item.quantity + ' × ' + plans[item.plan].name;
      const description = document.createElement('small');
      description.textContent = plans[item.plan].description;
      text.append(name, description);
      const price = document.createElement('b');
      price.textContent = money(plans[item.plan].priceCents * item.quantity);
      line.append(text, price);
      lines.append(line);
    });
  }

  function resetPreparedEnquiry() {
    readyText = '';
    const form = document.querySelector('[data-order-enquiry]');
    const ready = document.querySelector('[data-enquiry-ready]');
    if (form) form.hidden = false;
    if (ready) ready.hidden = true;
    const status = document.querySelector('[data-enquiry-status]');
    if (status) status.textContent = 'Nothing has been sent yet. Complete sending in your email app.';
  }

  function render() {
    updateTotals();
    renderBag();
    renderCheckout();
  }

  cart = readCart();
  const requestedPlan = window.location.hash.slice(1) || new URLSearchParams(window.location.search).get('plan');
  if (hasPlan(requestedPlan) && (document.body.dataset.page === 'cart' || document.body.dataset.page === 'checkout')) {
    writeCart(commerce.add(cart, requestedPlan));
    history.replaceState(null, '', window.location.pathname);
  }
  render();

  const productForm = document.querySelector('[data-product-form]');
  if (productForm) {
    const productQuantity = productForm.querySelector('[name="quantity"]');
    function updateProduct() {
      const selected = productForm.querySelector('[name="plan"]:checked').value;
      const plan = plans[selected];
      const amount = quantity(productQuantity.value);
      const dispensers = amount * plan.dispensers;
      productQuantity.value = amount;
      document.querySelector('[data-product-quantity-note]').textContent = dispensers + (dispensers === 1 ? ' dispenser' : ' dispensers') + (plan.recurring ? ' per delivery' : ' total');
      document.querySelector('[data-selection-description]').textContent = (dispensers * 30) + ' daily servings' + (plan.recurring ? ' per delivery' : ' total');
      document.querySelector('[data-selection-price]').textContent = money(amount * plan.priceCents);
      document.querySelectorAll('[data-sticky-price]').forEach((item) => { item.textContent = money(amount * plan.priceCents); });
      document.querySelectorAll('[data-sticky-choice]').forEach((item) => { item.textContent = (amount > 1 ? amount + ' × ' : '') + (selected === 'quarterly' ? '90-day supply' : selected === 'monthly' ? 'Monthly delivery' : 'One dispenser'); });
      document.querySelectorAll('[data-sticky-period]').forEach((item) => { item.textContent = plan.recurring ? 'every 30 days' : 'one purchase'; });
      document.querySelector('[data-plan-renewal]').textContent = plan.recurring
        ? 'Monthly plan: ' + money(amount * plan.priceCents) + ' every 30 days. No subscription starts today.'
        : 'One purchase. No automatic renewal.';
      productForm.querySelector('[data-product-step="-1"]').disabled = amount <= 1;
      productForm.querySelector('[data-product-step="1"]').disabled = amount >= 10;
    }
    productForm.querySelectorAll('[name="plan"]').forEach((input) => input.addEventListener('change', updateProduct));
    productQuantity.addEventListener('change', updateProduct);
    productForm.querySelectorAll('[data-product-step]').forEach((button) => {
      button.addEventListener('click', () => {
        productQuantity.value = quantity(Number(productQuantity.value) + Number(button.dataset.productStep));
        updateProduct();
      });
    });
    productForm.addEventListener('submit', (event) => {
      event.preventDefault();
      if (!productForm.reportValidity()) return;
      const selected = productForm.querySelector('[name="plan"]:checked').value;
      cart = readCart();
      const existing = cart.find((item) => item.plan === selected);
      if ((existing ? existing.quantity : 0) + quantity(productQuantity.value) > 10) {
        notice('Your bag can hold up to 10 of each supply option. Reduce the quantity, edit your bag, or contact us for a bulk order.');
        document.querySelector('[data-cart-notice]').scrollIntoView({ block: 'center', behavior: 'auto' });
        return;
      }
      if (writeCart(commerce.add(cart, selected, productQuantity.value))) window.location.assign('cart.html');
      else document.querySelector('[data-cart-notice]').scrollIntoView({ block: 'center', behavior: 'auto' });
    });
    updateProduct();
  }

  const cartItems = document.querySelector('[data-cart-items]');
  if (cartItems) {
    cartItems.addEventListener('click', (event) => {
      const button = event.target.closest('button');
      if (!button) return;
      const itemElement = button.closest('[data-plan]');
      const id = itemElement.dataset.plan;
      const current = cart.find((item) => item.plan === id);
      if (!current) return;
      if (button.hasAttribute('data-remove-item')) {
        const saved = writeCart(cart.filter((item) => item.plan !== id));
        render();
        if (saved) notice(plans[id].name + ' removed from your bag.');
        const next = document.querySelector('[data-remove-item]') || document.querySelector('[data-empty-cart] a');
        if (next) next.focus();
      } else if (button.hasAttribute('data-step')) {
        const step = button.dataset.step;
        const saved = writeCart(commerce.setQuantity(cart, id, current.quantity + Number(step)));
        render();
        const replacement = cartItems.querySelector('[data-plan="' + id + '"] [data-step="' + step + '"]');
        if (replacement && !replacement.disabled) replacement.focus();
        else cartItems.querySelector('[data-plan="' + id + '"] [data-item-quantity]').focus();
        if (saved) notice('Bag updated. Proposed subtotal ' + money(commerce.summary(cart).subtotalCents) + '.');
      }
    });
    cartItems.addEventListener('change', (event) => {
      if (!event.target.matches('[data-item-quantity]')) return;
      const id = event.target.closest('[data-plan]').dataset.plan;
      const saved = writeCart(commerce.setQuantity(cart, id, event.target.value));
      render();
      const input = cartItems.querySelector('[data-plan="' + id + '"] [data-item-quantity]');
      if (input) input.focus();
      if (saved) notice('Bag updated. Proposed subtotal ' + money(commerce.summary(cart).subtotalCents) + '.');
    });
  }

  document.querySelectorAll('[data-clear-cart]').forEach((button) => {
    button.addEventListener('click', () => {
      const saved = writeCart([]);
      render();
      if (saved) notice('Your saved bag has been cleared.');
    });
  });

  const enquiryForm = document.querySelector('[data-order-enquiry]');
  if (enquiryForm) {
    enquiryForm.addEventListener('submit', (event) => {
      event.preventDefault();
      if (!enquiryForm.reportValidity() || !cart.length) return;
      const fields = new FormData(enquiryForm);
      const customer = {};
      ['name', 'email', 'phone', 'postal', 'notes'].forEach((key) => { customer[key] = String(fields.get(key) || '').trim(); });
      for (const key of ['name', 'postal']) {
        const field = enquiryForm.elements.namedItem(key);
        field.setCustomValidity(customer[key] ? '' : 'Please enter ' + (key === 'name' ? 'your name.' : 'a delivery postal code.'));
        if (!customer[key]) { field.reportValidity(); return; }
      }
      if (!enquiryReference) enquiryReference = 'SV-' + (window.crypto.randomUUID ? window.crypto.randomUUID().slice(0, 8).toUpperCase() : Math.random().toString(36).slice(2, 10).toUpperCase());
      readyText = commerce.enquiryText(cart, customer, enquiryReference);
      document.querySelector('[data-enquiry-preview]').textContent = readyText;
      const link = document.querySelector('[data-enquiry-mailto]');
      link.href = 'mailto:' + orderEmail + '?subject=' + encodeURIComponent('Sulveda order inquiry ' + enquiryReference) + '&body=' + encodeURIComponent(readyText);
      enquiryForm.hidden = true;
      document.querySelector('[data-enquiry-ready]').hidden = false;
      document.querySelector('[data-enquiry-ready]').scrollIntoView({ block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      link.focus({ preventScroll: true });
    });
    document.querySelector('[data-edit-enquiry]').addEventListener('click', () => {
      resetPreparedEnquiry();
      document.querySelector('#customer-name').focus();
    });
    enquiryForm.querySelectorAll('input').forEach((field) => {
      field.addEventListener('input', () => field.setCustomValidity(''));
    });
    document.querySelector('[data-copy-enquiry]').addEventListener('click', async () => {
      const status = document.querySelector('[data-enquiry-status]');
      try {
        await navigator.clipboard.writeText('To: ' + orderEmail + '\nSubject: Sulveda order inquiry ' + enquiryReference + '\n\n' + readyText);
        status.textContent = 'Copied. Paste into an email to ' + orderEmail + ' and send when ready.';
      } catch (_) {
        const range = document.createRange();
        range.selectNodeContents(document.querySelector('[data-enquiry-preview]'));
        window.getSelection().removeAllRanges();
        window.getSelection().addRange(range);
        status.textContent = 'Your browser blocked clipboard access. The inquiry text is selected so you can copy it manually.';
      }
    });
    document.querySelector('[data-download-enquiry]').addEventListener('click', () => {
      const blob = new Blob(['To: ' + orderEmail + '\nSubject: Sulveda order inquiry ' + enquiryReference + '\n\n' + readyText], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'Sulveda-' + enquiryReference + '.txt';
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      document.querySelector('[data-enquiry-status]').textContent = 'Download prepared. The file includes your inquiry and contact details; nothing has been sent.';
    });
  }

  window.addEventListener('storage', (event) => {
    if (event.key !== storageKey && event.key !== null) return;
    cart = readCart();
    resetPreparedEnquiry();
    render();
  });
  window.addEventListener('pageshow', () => {
    const latest = readCart();
    if (JSON.stringify(latest) !== JSON.stringify(cart)) resetPreparedEnquiry();
    cart = latest;
    render();
  });
}());
