// Pointer-based dragging keeps a full-size image under the cursor and previews
// the actual three-column layout. A completed gesture creates one undo step.
export function attachLiveDrag(gallery, { getOrder, isBusy, commit, reset, tap }) {
  let drag = null;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const bounds = element => {
    const rect = element.getBoundingClientRect();
    return { left: rect.left + scrollX, right: rect.right + scrollX, top: rect.top + scrollY, bottom: rect.bottom + scrollY };
  };
  const contains = (rect, x, y) => x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;

  function arrange() {
    const previous = new Map([...drag.cards].map(([id, card]) => [id, card.getBoundingClientRect()]));
    for (const card of drag.cards.values()) card.getAnimations().forEach(animation => animation.cancel());
    drag.order.forEach((id, index) => drag.columns[index % 3].append(drag.cards.get(id)));
    drag.boxes = new Map([...drag.cards].map(([id, card]) => [id, bounds(card)]));
    if (reducedMotion.matches) return;
    for (const [id, card] of drag.cards) {
      if (id === drag.id) continue;
      const before = previous.get(id), after = card.getBoundingClientRect();
      const dx = before.left - after.left, dy = before.top - after.top;
      if (Math.abs(dx) + Math.abs(dy) < 1) continue;
      card.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'translate(0, 0)' }], { duration: 170, easing: 'ease-out' });
    }
  }

  function preview() {
    const x = drag.x + scrollX, y = drag.y + scrollY;
    const galleryBounds = bounds(gallery);
    if (x < galleryBounds.left - 24 || x > galleryBounds.right + 24) return;
    if (contains(drag.boxes.get(drag.id), x, y)) return;
    const column = drag.columns.reduce((nearest, candidate) => {
      const rect = bounds(candidate), current = bounds(nearest);
      return Math.abs(x - (rect.left + rect.right) / 2) < Math.abs(x - (current.left + current.right) / 2) ? candidate : nearest;
    });
    const candidates = [...column.children].filter(card => card.dataset.id !== drag.id);
    const next = drag.order.filter(id => id !== drag.id);
    let insertion;
    if (candidates.length) {
      const target = candidates.find(card => {
        const rect = drag.boxes.get(card.dataset.id);
        return y < (rect.top + rect.bottom) / 2;
      });
      insertion = target ? next.indexOf(target.dataset.id) : next.indexOf(candidates.at(-1).dataset.id) + 1;
    } else {
      insertion = Math.min(drag.columns.indexOf(column), next.length);
    }
    next.splice(insertion, 0, drag.id);
    if (next.every((id, index) => id === drag.order[index])) return;
    drag.order = next;
    arrange();
  }

  function frame() {
    if (!drag?.image) return;
    drag.image.style.transform = `translate3d(${drag.x - drag.offsetX}px, ${drag.y - drag.offsetY}px, 0)`;
    const top = document.querySelector('header').getBoundingClientRect().bottom + 48;
    const bottom = innerHeight - 72;
    let speed = 0;
    if (drag.y < top) speed = -Math.min(18, (top - drag.y) / 5);
    else if (drag.y > bottom) speed = Math.min(18, (drag.y - bottom) / 5);
    if (speed) {
      const previousScroll = scrollY;
      window.scrollBy(0, speed);
      if (scrollY !== previousScroll) preview();
    }
    drag.frame = requestAnimationFrame(frame);
  }

  function finish(accept) {
    if (!drag) return;
    const gesture = drag;
    drag = null;
    cancelAnimationFrame(gesture.frame);
    gesture.image?.remove();
    gesture.card.classList.remove('drag-placeholder');
    document.body.classList.remove('is-dragging');
    for (const card of gesture.cards.values()) card.getAnimations().forEach(animation => animation.cancel());
    if (gallery.hasPointerCapture(gesture.pointerId)) gallery.releasePointerCapture(gesture.pointerId);
    if (!gesture.image) { if (accept) tap?.(gesture.id); return; }
    const changed = gesture.order.some((id, index) => id !== gesture.original[index]);
    if (accept && changed) commit(gesture.order);
    else reset();
  }

  gallery.addEventListener('pointerdown', event => {
    if (drag || isBusy() || !event.isPrimary || event.button !== 0) return;
    const card = event.target.closest('article');
    if (!card || !gallery.contains(card)) return;
    event.preventDefault();
    const rect = card.getBoundingClientRect();
    drag = {
      id: card.dataset.id, card, pointerId: event.pointerId,
      x: event.clientX, y: event.clientY, startX: event.clientX, startY: event.clientY,
      offsetX: event.clientX - rect.left, offsetY: event.clientY - rect.top, width: rect.width,
      original: [...getOrder()], order: [...getOrder()],
      columns: [...gallery.children], cards: new Map([...gallery.querySelectorAll('article')].map(card => [card.dataset.id, card])),
    };
    gallery.setPointerCapture(event.pointerId);
  });

  gallery.addEventListener('pointermove', event => {
    if (!drag || event.pointerId !== drag.pointerId) return;
    drag.x = event.clientX; drag.y = event.clientY;
    if (!drag.image) {
      if (Math.hypot(drag.x - drag.startX, drag.y - drag.startY) < 6) return;
      drag.image = drag.card.querySelector('img').cloneNode();
      drag.image.className = 'drag-preview'; drag.image.alt = ''; drag.image.setAttribute('aria-hidden', 'true');
      drag.image.style.width = `${drag.width}px`;
      document.body.append(drag.image);
      drag.card.classList.add('drag-placeholder');
      document.body.classList.add('is-dragging');
      drag.boxes = new Map([...drag.cards].map(([id, card]) => [id, bounds(card)]));
      frame();
    }
    preview();
  });
  gallery.addEventListener('pointerup', event => {
    if (!drag || event.pointerId !== drag.pointerId) return;
    const headerBottom = document.querySelector('header').getBoundingClientRect().bottom;
    finish(event.clientY >= headerBottom && contains(bounds(gallery), event.clientX + scrollX, event.clientY + scrollY));
  });
  gallery.addEventListener('pointercancel', () => finish(false));
  gallery.addEventListener('lostpointercapture', () => finish(false));
  window.addEventListener('blur', () => finish(false));
  window.addEventListener('resize', () => finish(false));
  window.addEventListener('keydown', event => {
    if (event.key === 'Escape' && drag) { event.preventDefault(); finish(false); }
  });
}
