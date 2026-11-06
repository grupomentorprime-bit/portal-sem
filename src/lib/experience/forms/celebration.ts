import confetti from "canvas-confetti";

const SEM_CONFETTI_COLORS = ["#003366", "#c9a227", "#2d6a4f", "#4a90c4", "#ffffff"];

/** Saludo breve al confirmar asistencia. Un solo estallido, sin cañones laterales. */
export function launchAttendanceConfetti(): void {
  confetti({
    particleCount: 28,
    spread: 50,
    startVelocity: 22,
    gravity: 1.15,
    decay: 0.92,
    ticks: 90,
    scalar: 0.75,
    origin: { y: 0.7 },
    colors: SEM_CONFETTI_COLORS,
    disableForReducedMotion: true,
  });
}
