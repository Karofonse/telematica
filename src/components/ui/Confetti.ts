import confetti from 'canvas-confetti';

export function fireConfetti() {
  const colors = ['#6366f1', '#818cf8', '#f59e0b', '#22c55e', '#ec4899'];
  confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 }, colors });
  setTimeout(() => confetti({ particleCount: 50, angle: 60, spread: 55, origin: { x: 0, y: 0.7 }, colors }), 200);
  setTimeout(() => confetti({ particleCount: 50, angle: 120, spread: 55, origin: { x: 1, y: 0.7 }, colors }), 400);
}

export function fireBigConfetti() {
  const colors = ['#6366f1', '#818cf8', '#f59e0b', '#22c55e', '#ec4899', '#06b6d4'];
  const end = Date.now() + 1500;
  (function frame() {
    confetti({ particleCount: 5, angle: 40, spread: 40, origin: { x: 0 }, colors });
    confetti({ particleCount: 5, angle: 140, spread: 40, origin: { x: 1 }, colors });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
  confetti({ particleCount: 120, spread: 100, origin: { y: 0.5 }, colors });
}
