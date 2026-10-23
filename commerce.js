(function (root) {
  'use strict';

  const plans = Object.freeze({
    'one-time': Object.freeze({ id: 'one-time', name: 'One-time dispenser', description: '1 dispenser · 60 mints · 30 daily servings', priceCents: 999, compareCents: 999, dispensers: 1, recurring: false }),
    monthly: Object.freeze({ id: 'monthly', name: '12-month subscription', description: '1 dispenser monthly · 60 mints · 12-month commitment', priceCents: 699, compareCents: 999, dispensers: 1, recurring: true, termMonths: 12 }),
    quarterly: Object.freeze({ id: 'quarterly', name: '90-day supply', description: '3 dispensers · 180 mints · one purchase', priceCents: 2997, compareCents: 2997, dispensers: 3, recurring: false })
  });

  const hasPlan = (id) => Object.prototype.hasOwnProperty.call(plans, id);
  const quantity = (value) => {
    const number = Number(value);
    return Number.isFinite(number) ? Math.max(1, Math.min(10, Math.floor(number))) : 1;
  };
  const money = (cents) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);

  function subscriptionTerms(amount = 1) {
    const plan = plans.monthly;
    const monthlyCents = plan.priceCents * quantity(amount);
    return money(monthlyCents) + ' per month for ' + plan.termMonths + ' months (' + money(monthlyCents * plan.termMonths) + ' total), plus tax and shipping.';
  }

  function normalize(items) {
    if (!Array.isArray(items)) return [];
    const merged = new Map();
    items.forEach((item) => {
      if (!item || !hasPlan(item.plan) || !Number.isFinite(Number(item.quantity)) || Number(item.quantity) < 1) return;
      merged.set(item.plan, quantity((merged.get(item.plan) || 0) + Number(item.quantity)));
    });
    return Array.from(merged, ([plan, itemQuantity]) => ({ plan, quantity: itemQuantity }));
  }

  function add(items, plan, amount = 1) {
    const cart = normalize(items);
    if (!hasPlan(plan)) return cart;
    const existing = cart.find((item) => item.plan === plan);
    if (existing) existing.quantity = quantity(existing.quantity + quantity(amount));
    else cart.push({ plan, quantity: quantity(amount) });
    return cart;
  }

  function setQuantity(items, plan, amount) {
    return normalize(items).map((item) => item.plan === plan ? { ...item, quantity: quantity(amount) } : item);
  }

  function summary(items) {
    return normalize(items).reduce((total, item) => {
      const plan = plans[item.plan];
      total.subtotalCents += plan.priceCents * item.quantity;
      total.savingsCents += (plan.compareCents - plan.priceCents) * item.quantity;
      total.dispensers += plan.dispensers * item.quantity;
      total.packages += item.quantity;
      total.mints += plan.dispensers * item.quantity * 60;
      if (plan.recurring) {
        total.recurringCents += plan.priceCents * item.quantity;
        total.commitmentCents += plan.priceCents * item.quantity * plan.termMonths;
      }
      return total;
    }, { subtotalCents: 0, savingsCents: 0, recurringCents: 0, commitmentCents: 0, dispensers: 0, packages: 0, mints: 0 });
  }

  function enquiryText(items, customer, reference) {
    const cart = normalize(items);
    const totals = summary(cart);
    const lines = [
      'SULVEDA ORDER INQUIRY',
      `Reference: ${reference}`,
      '',
      ...cart.map((item) => `${item.quantity} × ${plans[item.plan].name} — ${money(plans[item.plan].priceCents * item.quantity)}${plans[item.plan].recurring ? ' per month' : ''}`),
      '',
      `Proposed first-shipment subtotal: ${money(totals.subtotalCents)}`,
      'Shipping and tax: please confirm',
      `Total dispensers: ${totals.dispensers} (${totals.mints} mints)`
    ];
    if (totals.recurringCents) {
      lines.push(`Subscription commitment: ${subscriptionTerms(cart.find((item) => plans[item.plan].recurring).quantity)}`);
      lines.push('12 monthly payments, not an upfront annual charge. Final cancellation and renewal terms must be confirmed before enrollment.');
    }
    lines.push('', `Name: ${customer.name}`, `Email: ${customer.email}`, `Phone: ${customer.phone || 'Not provided'}`, `Delivery ZIP / postal code: ${customer.postal}`);
    if (customer.notes) lines.push('', `Notes: ${customer.notes}`);
    lines.push('', 'Please confirm availability, delivery, final pricing, and purchase terms. This is an inquiry, not a completed purchase or subscription.');
    return lines.join('\n');
  }

  const api = Object.freeze({ plans, hasPlan, quantity, money, subscriptionTerms, normalize, add, setQuantity, summary, enquiryText });
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.SulvedaCommerce = api;
}(typeof globalThis === 'undefined' ? this : globalThis));
