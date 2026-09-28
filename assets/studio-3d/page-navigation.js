// This transparent lane scrolls the document; the canvas keeps its own gestures.
function initPageNavigation() {
  const hero = document.getElementById('hero');
  const lane = hero?.querySelector('[data-page-scroll-lane]');
  if (!lane) return;

  let updateFrame = 0;
  let drag = null;

  function measurements() {
    const viewportHeight = document.documentElement.clientHeight || window.innerHeight;
    const documentHeight = Math.max(viewportHeight, document.scrollingElement.scrollHeight);
    return {
      viewportHeight,
      maxScroll: Math.max(0, documentHeight - viewportHeight)
    };
  }

  function scrollPosition(maxScroll) {
    return Math.max(0, Math.min(maxScroll, window.scrollY));
  }

  function update() {
    updateFrame = 0;
    const { maxScroll } = measurements();
    const position = scrollPosition(maxScroll);
    lane.setAttribute('aria-valuemax', String(Math.round(maxScroll)));
    lane.setAttribute('aria-valuenow', String(Math.round(position)));
  }

  function scheduleUpdate() {
    if (!updateFrame) updateFrame = window.requestAnimationFrame(update);
  }

  function scrollToPosition(position) {
    const { maxScroll } = measurements();
    window.scrollTo({ top: Math.max(0, Math.min(maxScroll, position)), behavior: 'instant' });
    scheduleUpdate();
  }

  // Wheel and touch stay native. Dragging down with a mouse scrolls down 1:1.
  lane.addEventListener('pointerdown', event => {
    if (!['mouse', 'pen'].includes(event.pointerType) || !event.isPrimary || event.button !== 0 || drag) return;
    const { maxScroll } = measurements();
    if (!maxScroll) return;

    event.preventDefault();
    lane.focus({ preventScroll: true });
    // Keep a fixed drag origin: the hero itself moves as the document scrolls.
    drag = { id: event.pointerId, startY: event.clientY, startScroll: scrollPosition(maxScroll) };
    lane.dataset.dragging = 'true';
    lane.setPointerCapture(event.pointerId);
    scrollToPosition(drag.startScroll);
  });

  lane.addEventListener('pointermove', event => {
    if (!drag || event.pointerId !== drag.id) return;
    scrollToPosition(drag.startScroll + event.clientY - drag.startY);
  });

  function endDrag(event) {
    if (!drag || (event?.pointerId !== undefined && event.pointerId !== drag.id)) return;
    const pointerId = drag.id;
    drag = null;
    delete lane.dataset.dragging;
    if (lane.hasPointerCapture(pointerId)) lane.releasePointerCapture(pointerId);
  }
  lane.addEventListener('pointerup', endDrag);
  lane.addEventListener('pointercancel', endDrag);
  lane.addEventListener('lostpointercapture', endDrag);
  window.addEventListener('blur', () => endDrag());

  lane.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const { viewportHeight, maxScroll } = measurements();
    const position = scrollPosition(maxScroll);
    const destinations = {
      ArrowUp: position - 48,
      ArrowDown: position + 48,
      PageUp: position - viewportHeight * .85,
      PageDown: position + viewportHeight * .85,
      Home: 0,
      End: maxScroll
    };
    if (!(event.key in destinations)) return;
    event.preventDefault();
    scrollToPosition(destinations[event.key]);
  });

  window.addEventListener('scroll', scheduleUpdate, { passive: true });
  window.addEventListener('resize', scheduleUpdate, { passive: true });
  window.addEventListener('load', scheduleUpdate, { once: true });
  if (typeof ResizeObserver !== 'undefined') {
    const observer = new ResizeObserver(scheduleUpdate);
    observer.observe(document.documentElement);
    observer.observe(document.body);
  }
  update();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPageNavigation, { once: true });
} else {
  initPageNavigation();
}
