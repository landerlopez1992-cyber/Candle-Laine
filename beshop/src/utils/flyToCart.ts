/**
 * Miniatura del producto que “salta” en arco hacia el icono del carrito (header).
 */
export function runFlyToCartAnimation(
  sourceImageEl: HTMLElement,
  imageUrl: string,
): void {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
  } catch {
    /* ignore */
  }

  const cart = document.querySelector(
    '[data-fly-cart-target]',
  ) as HTMLElement | null;
  if (!cart || !sourceImageEl?.getBoundingClientRect) {
    return;
  }

  const from = sourceImageEl.getBoundingClientRect();
  const to = cart.getBoundingClientRect();

  const fx = from.left + from.width / 2;
  const fy = from.top + from.height / 2;
  const tx = to.left + to.width / 2;
  const ty = to.top + to.height / 2;
  const dx = tx - fx;
  const dy = ty - fy;

  const base = Math.min(from.width, from.height, 64);
  const flyer = document.createElement('div');
  flyer.setAttribute('aria-hidden', 'true');
  flyer.style.cssText = [
    'position:fixed',
    `left:${fx - base / 2}px`,
    `top:${fy - base / 2}px`,
    `width:${base}px`,
    `height:${base}px`,
    'z-index:10050',
    'pointer-events:none',
    'border-radius:10px',
    'overflow:hidden',
    'box-shadow:0 8px 28px rgba(0,0,0,0.35)',
    'will-change:transform,opacity',
  ].join(';');

  const img = document.createElement('img');
  img.src = imageUrl;
  img.alt = '';
  img.draggable = false;
  img.style.cssText =
    'width:100%;height:100%;object-fit:contain;background:#ffffff;display:block';
  flyer.appendChild(img);
  document.body.appendChild(flyer);

  const midX = dx * 0.42;
  const midY = dy * 0.28 - Math.min(56, Math.abs(dx) * 0.12);

  const keyframes: Keyframe[] = [
    {transform: 'translate(0px, 0px) scale(1)', opacity: 1},
    {
      transform: `translate(${midX}px, ${midY}px) scale(0.92)`,
      opacity: 1,
    },
    {
      transform: `translate(${dx}px, ${dy}px) scale(0.14)`,
      opacity: 0.45,
    },
  ];

  const anim = flyer.animate(keyframes, {
    duration: 820,
    easing: 'cubic-bezier(0.25, 0.82, 0.35, 1)',
    fill: 'forwards',
  });

  anim.onfinish = () => {
    flyer.remove();
  };
}
