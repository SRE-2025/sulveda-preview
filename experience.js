/* Small, progressive shopping enhancements. The original forms remain the source of truth. */
(function (root) {
  'use strict';

  function stickyVisible(state) {
    if (!state.mobile || state.blocked || state.footerTop < state.height) return false;
    const primaryVisible = state.primaryBottom > state.headerBottom && state.primaryTop < state.height;
    if (state.kind === 'home') return state.primaryBottom <= state.headerBottom;
    return state.titleTop < state.height * 0.65 && !primaryVisible;
  }

  const api = Object.freeze({ stickyVisible });
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (!root.document) return;
  const document = root.document;
  const mobile = root.matchMedia('(max-width: 600px)');

  // Derive the phone comparison from the desktop table, avoiding duplicated product claims.
  document.querySelectorAll('[data-responsive-comparison]').forEach((table) => {
    const headers = Array.from(table.querySelectorAll('thead th')).slice(1).map((cell) => cell.firstChild.textContent.trim());
    const comparison = document.createElement('div');
    comparison.className = 'comparison-mobile';
    table.querySelectorAll('tbody tr').forEach((row, index) => {
      const section = document.createElement('section');
      section.className = 'comparison-mobile-row';
      const heading = document.createElement('h3');
      heading.id = 'mint-comparison-' + index;
      heading.textContent = row.querySelector('th').textContent;
      section.setAttribute('aria-labelledby', heading.id);
      const list = document.createElement('dl');
      row.querySelectorAll('td').forEach((cell, column) => {
        const group = document.createElement('div');
        const term = document.createElement('dt');
        term.textContent = headers[column];
        const definition = document.createElement('dd');
        definition.textContent = cell.textContent;
        group.append(term, definition);
        list.append(group);
      });
      section.append(heading, list);
      comparison.append(section);
    });
    table.parentElement.append(comparison);
    table.parentElement.classList.add('has-mobile-comparison');
  });

  const dialog = document.querySelector('[data-product-dialog]');
  const zoom = document.querySelector('[data-product-zoom]');
  if (dialog && zoom && typeof dialog.showModal === 'function') {
    zoom.hidden = false;
    zoom.addEventListener('click', () => {
      if (dialog.open) return;
      dialog.showModal();
      document.documentElement.classList.add('product-dialog-open');
      updateSticky();
    });
    dialog.querySelector('[data-close-product]').addEventListener('click', () => dialog.close());
    dialog.addEventListener('keydown', (event) => {
      if (event.key !== 'Tab') return;
      const controls = Array.from(dialog.querySelectorAll('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')).filter((item) => item.getClientRects().length > 0);
      if (!controls.length) return;
      const first = controls[0];
      const last = controls[controls.length - 1];
      if ((event.shiftKey && document.activeElement === first) || (!event.shiftKey && document.activeElement === last)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus({ preventScroll: true });
      }
    });
    dialog.addEventListener('click', (event) => {
      const bounds = dialog.getBoundingClientRect();
      if (event.target === dialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) dialog.close();
    });
    dialog.addEventListener('close', () => {
      document.documentElement.classList.remove('product-dialog-open');
      zoom.focus({ preventScroll: true });
      updateSticky();
    });
  }

  const bar = document.querySelector('[data-context-buy-bar]');
  const primary = document.querySelector(document.body.dataset.page === 'home' ? '.benefit-hero-actions .button' : '.add-to-bag');
  const title = document.querySelector('.product-purchase h1');
  const footer = document.querySelector('.store-footer');
  const header = document.querySelector('.store-header');
  const menu = document.querySelector('[data-menu-button]');
  let scheduled = false;

  function updateSticky() {
    scheduled = false;
    if (!bar || !primary || !footer || !header) return;
    const bounds = primary.getBoundingClientRect();
    const visible = stickyVisible({
      mobile: mobile.matches,
      blocked: (menu && menu.getAttribute('aria-expanded') === 'true') || Boolean(dialog && dialog.open),
      footerTop: footer.getBoundingClientRect().top,
      height: root.innerHeight,
      headerBottom: header.getBoundingClientRect().bottom,
      primaryTop: bounds.top,
      primaryBottom: bounds.bottom,
      titleTop: title ? title.getBoundingClientRect().top : 0,
      kind: document.body.dataset.page
    });
    const focused = bar.contains(document.activeElement);
    if (focused && !visible) {
      // Defer hiding a focused control until the visitor moves focus elsewhere.
      return;
    }
    bar.hidden = !visible;
    document.body.classList.toggle('context-buy-visible', visible);
  }

  function scheduleSticky() {
    if (!scheduled) {
      scheduled = true;
      root.requestAnimationFrame(updateSticky);
    }
  }
  if (bar) {
    root.addEventListener('scroll', scheduleSticky, { passive: true });
    root.addEventListener('resize', scheduleSticky);
    root.addEventListener('pageshow', scheduleSticky);
    document.addEventListener('focusout', scheduleSticky);
    if (menu) menu.addEventListener('click', scheduleSticky);
    document.addEventListener('keydown', scheduleSticky);
    document.addEventListener('click', scheduleSticky);
    updateSticky();
  }
}(typeof globalThis === 'undefined' ? this : globalThis));
