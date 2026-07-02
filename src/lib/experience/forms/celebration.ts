import confetti from "canvas-confetti";

const SEM_CONFETTI_COLORS = ["#003366", "#c9a227", "#2d6a4f", "#4a90c4", "#ffffff"];

/** Challa institucional al confirmar asistencia positiva. */
export function launchAttendanceConfetti(): void {
  const duration = 2800;
  const end = Date.now() + duration;

  confetti({
    particleCount: 90,
    spread: 72,
    origin: { y: 0.62 },
    colors: SEM_CONFETTI_COLORS,
    ticks: 200,
  });

  const burst = () => {
    confetti({
      particleCount: 4,
      angle: 60,
      spread: 58,
      origin: { x: 0, y: 0.65 },
      colors: SEM_CONFETTI_COLORS,
    });
    confetti({
      particleCount: 4,
      angle: 120,
      spread: 58,
      origin: { x: 1, y: 0.65 },
      colors: SEM_CONFETTI_COLORS,
    });

    if (Date.now() < end) {
      requestAnimationFrame(burst);
    }
  };

  burst();
}
