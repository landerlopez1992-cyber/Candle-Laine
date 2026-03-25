import confetti from 'canvas-confetti';

/**
 * Short confetti burst when a coupon is applied successfully (respects prefers-reduced-motion).
 */
export function runCouponSuccessConfetti(): void {
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

  const colors = ['#F1B97F', '#D6C0A5', '#4C775C', '#EFE8DC', '#ffffff'];
  const base = {
    origin: {y: 0.66},
    zIndex: 12000,
    colors,
  };

  void confetti({
    ...base,
    particleCount: 130,
    spread: 78,
    ticks: 240,
    scalar: 1,
    startVelocity: 38,
  });
  window.setTimeout(() => {
    void confetti({
      ...base,
      particleCount: 75,
      angle: 58,
      spread: 52,
      startVelocity: 32,
    });
  }, 200);
}
