import type { PortalCursorConfig } from "@/types/cms";

export type CursorVisualState =
  | "default"
  | "link"
  | "button"
  | "card"
  | "hero"
  | "video"
  | "carousel-left"
  | "carousel-right";

interface CursorElements {
  root: HTMLDivElement;
  ring: HTMLDivElement;
  dot: HTMLDivElement;
  icon: HTMLDivElement;
  spinner: HTMLDivElement;
  ripples: HTMLDivElement;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function isTouchDevice(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(pointer: coarse)").matches || "ontouchstart" in window;
}

export class CursorEngine {
  private config: PortalCursorConfig;
  private els: CursorElements | null = null;
  private rafId = 0;
  private ringX = 0;
  private ringY = 0;
  private dotX = 0;
  private dotY = 0;
  private targetX = 0;
  private targetY = 0;
  private visible = true;
  private state: CursorVisualState = "default";
  private scrolling = false;
  private loading = false;
  private keyboardMode = false;
  private scrollTimer: ReturnType<typeof setTimeout> | null = null;
  private magnetEl: HTMLElement | null = null;
  private boundMove: (event: MouseEvent) => void;
  private boundDown: (event: MouseEvent) => void;
  private boundOver: (event: MouseEvent) => void;
  private boundLeave: () => void;
  private boundScroll: () => void;
  private boundKeyDown: (event: KeyboardEvent) => void;
  private boundMouseMoveShow: () => void;

  constructor(config: PortalCursorConfig) {
    this.config = config;
    this.boundMove = (event) => this.onMouseMove(event);
    this.boundDown = (event) => this.onMouseDown(event);
    this.boundOver = (event) => this.onMouseOver(event);
    this.boundLeave = () => this.hide();
    this.boundScroll = () => this.onScroll();
    this.boundKeyDown = (event) => this.onKeyDown(event);
    this.boundMouseMoveShow = () => {
      if (!this.keyboardMode) this.show();
    };
  }

  start(): void {
    if (this.shouldDisable()) return;

    this.mount();
    this.applyConfigVars();
    document.body.classList.add("has-premium-cursor");

    window.addEventListener("mousemove", this.boundMove, { passive: true });
    window.addEventListener("mousedown", this.boundDown, { passive: true });
    document.addEventListener("mouseover", this.boundOver, { passive: true });
    document.documentElement.addEventListener("mouseleave", this.boundLeave);
    window.addEventListener("scroll", this.boundScroll, { passive: true });
    window.addEventListener("keydown", this.boundKeyDown);
    window.addEventListener("mousemove", this.boundMouseMoveShow, { passive: true });

    this.loop();
  }

  updateConfig(config: PortalCursorConfig): void {
    this.config = config;
    if (this.shouldDisable()) {
      this.destroy();
      return;
    }
    this.applyConfigVars();
  }

  setLoading(value: boolean): void {
    this.loading = value;
    this.syncClasses();
  }

  destroy(): void {
    cancelAnimationFrame(this.rafId);
    window.removeEventListener("mousemove", this.boundMove);
    window.removeEventListener("mousedown", this.boundDown);
    document.removeEventListener("mouseover", this.boundOver);
    document.documentElement.removeEventListener("mouseleave", this.boundLeave);
    window.removeEventListener("scroll", this.boundScroll);
    window.removeEventListener("keydown", this.boundKeyDown);
    window.removeEventListener("mousemove", this.boundMouseMoveShow);
    this.resetMagnet();
    document.body.classList.remove("has-premium-cursor");
    this.els?.root.remove();
    this.els = null;
  }

  private shouldDisable(): boolean {
    if (!this.config.enabled || this.config.mode === "classic") return true;
    if (typeof window === "undefined") return true;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return true;
    if (isTouchDevice() && !this.config.showOnMobile) return true;
    if (window.innerWidth < 768 && !this.config.showOnMobile) return true;
    return false;
  }

  private mount(): void {
    const root = document.createElement("div");
    root.className = "premium-cursor";
    root.setAttribute("aria-hidden", "true");

    const ring = document.createElement("div");
    ring.className = "premium-cursor__ring";

    const dot = document.createElement("div");
    dot.className = "premium-cursor__dot";

    const icon = document.createElement("div");
    icon.className = "premium-cursor__icon";

    const spinner = document.createElement("div");
    spinner.className = "premium-cursor__spinner";

    const ripples = document.createElement("div");
    ripples.className = "premium-cursor__ripples";

    root.append(ring, dot, icon, spinner, ripples);
    document.body.appendChild(root);

    this.els = { root, ring, dot, icon, spinner, ripples };
  }

  private applyConfigVars(): void {
    const root = document.documentElement;
    root.style.setProperty("--cursor-primary", this.config.primaryColor);
    root.style.setProperty("--cursor-secondary", this.config.secondaryColor);
    root.style.setProperty("--cursor-size", `${this.config.size}px`);
    root.style.setProperty("--cursor-opacity", String(clamp(this.config.opacity, 0.2, 1)));
    root.style.setProperty("--cursor-speed", String(clamp(this.config.speed, 0.08, 0.45)));
    root.style.setProperty("--cursor-magnet", String(clamp(this.config.magnetStrength, 0, 1)));
    root.classList.toggle("premium-cursor-glow", this.config.glow);
    root.classList.toggle("premium-cursor-ripple", this.config.ripple);
    root.classList.toggle("premium-cursor-animate", this.config.animations);
  }

  private loop = (): void => {
    const speed = clamp(this.config.speed, 0.08, 0.45);
    this.ringX += (this.targetX - this.ringX) * speed;
    this.ringY += (this.targetY - this.ringY) * speed;
    this.dotX += (this.targetX - this.dotX) * Math.min(speed * 1.65, 0.65);
    this.dotY += (this.targetY - this.dotY) * Math.min(speed * 1.65, 0.65);

    if (this.els) {
      const clickScale = this.els.root.classList.contains("premium-cursor--click") ? 0.88 : 1;
      const ringScale = this.getRingScale() * clickScale;
      this.els.ring.style.transform = `translate3d(${this.ringX}px, ${this.ringY}px, 0) scale(${ringScale})`;
      this.els.dot.style.transform = `translate3d(${this.dotX}px, ${this.dotY}px, 0)`;
      this.els.icon.style.transform = `translate3d(${this.ringX}px, ${this.ringY}px, 0) scale(${ringScale})`;
      this.els.spinner.style.transform = `translate3d(${this.ringX}px, ${this.ringY}px, 0)`;
    }

    this.rafId = requestAnimationFrame(this.loop);
  };

  private onMouseMove(event: MouseEvent): void {
    if (this.keyboardMode) this.keyboardMode = false;
    this.targetX = event.clientX;
    this.targetY = event.clientY;
    this.show();
    this.detectState(event.clientX, event.clientY);
    this.applyMagnet(event);
  }

  private onMouseOver(event: MouseEvent): void {
    if (this.keyboardMode) return;
    this.detectState(event.clientX, event.clientY);
  }

  private onMouseDown(event: MouseEvent): void {
    if (!this.config.ripple || !this.els) return;
    const ripple = document.createElement("span");
    ripple.className = "premium-cursor__ripple";
    ripple.style.left = `${event.clientX}px`;
    ripple.style.top = `${event.clientY}px`;
    this.els.ripples.appendChild(ripple);
    window.setTimeout(() => ripple.remove(), 220);
    this.els.root.classList.add("premium-cursor--click");
    window.setTimeout(() => this.els?.root.classList.remove("premium-cursor--click"), 180);
  }

  private onScroll(): void {
    this.scrolling = true;
    this.syncClasses();
    if (this.scrollTimer) clearTimeout(this.scrollTimer);
    this.scrollTimer = setTimeout(() => {
      this.scrolling = false;
      this.syncClasses();
    }, 140);
  }

  private onKeyDown(event: KeyboardEvent): void {
    if (event.key === "Tab") {
      this.keyboardMode = true;
      this.hide();
      this.resetMagnet();
    }
  }

  private detectState(x: number, y: number): void {
    const target = document.elementFromPoint(x, y);
    if (!target || target.closest(".premium-cursor")) return;

    const explicit = target.closest("[data-cursor]") as HTMLElement | null;
    if (explicit?.dataset.cursor) {
      this.setState(explicit.dataset.cursor as CursorVisualState);
      return;
    }

    const carousel = target.closest(".hero-carousel") as HTMLElement | null;
    if (carousel) {
      const rect = carousel.getBoundingClientRect();
      this.setState(x < rect.left + rect.width / 2 ? "carousel-left" : "carousel-right");
      return;
    }

    if (target.closest("video, [data-cursor='video']")) {
      this.setState("video");
      return;
    }

    if (target.closest(".hero-photo, .hero-premium, .hero-carousel__image")) {
      this.setState("hero");
      return;
    }

    if (
      target.closest(
        "button, .portal-btn-apply, .portal-btn-login, .hero-premium__btn-primary, .hero-premium__btn-secondary, [data-cursor-magnet]"
      )
    ) {
      this.setState("button");
      return;
    }

    if (target.closest(".portal-program-card, .portal-card, [data-cursor='card']")) {
      this.setState("card");
      return;
    }

    if (target.closest("a")) {
      this.setState("link");
      return;
    }

    this.setState("default");
  }

  private setState(state: CursorVisualState): void {
    if (this.state === state) return;
    this.state = state;
    this.syncClasses();
    this.updateIcon();
  }

  private updateIcon(): void {
    if (!this.els) return;
    const icons: Partial<Record<CursorVisualState, string>> = {
      video: "▶",
      "carousel-left": "←",
      "carousel-right": "→",
    };
    this.els.icon.textContent = icons[this.state] ?? "";
  }

  private syncClasses(): void {
    if (!this.els) return;
    const root = this.els.root;
    root.classList.toggle("premium-cursor--hidden", !this.visible || this.keyboardMode);
    root.classList.toggle("premium-cursor--loading", this.loading);

    const stateClasses = [
      "premium-cursor--default",
      "premium-cursor--link",
      "premium-cursor--button",
      "premium-cursor--card",
      "premium-cursor--hero",
      "premium-cursor--video",
      "premium-cursor--carousel-left",
      "premium-cursor--carousel-right",
      "premium-cursor--scrolling",
      "premium-cursor--click",
    ];
    stateClasses.forEach((cls) => root.classList.remove(cls));
    root.classList.add(`premium-cursor--${this.state}`);
    if (this.scrolling) root.classList.add("premium-cursor--scrolling");
  }

  private getRingScale(): number {
    if (this.scrolling) return 0.72;
    switch (this.state) {
      case "link":
        return 0.86;
      case "button":
        return 1.28;
      case "card":
        return 1.12;
      case "hero":
        return 1.42;
      case "video":
      case "carousel-left":
      case "carousel-right":
        return 1.15;
      default:
        return 1;
    }
  }

  private applyMagnet(event: MouseEvent): void {
    if (!this.config.magnetism) {
      this.resetMagnet();
      return;
    }

    const target = document.elementFromPoint(event.clientX, event.clientY);
    const magnet = target?.closest("[data-cursor-magnet]") as HTMLElement | null;

    if (magnet !== this.magnetEl) {
      this.resetMagnet();
      this.magnetEl = magnet;
    }

    if (!magnet) return;

    const rect = magnet.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const strength = clamp(this.config.magnetStrength, 0, 1) * 0.22;
    const dx = (event.clientX - cx) * strength;
    const dy = (event.clientY - cy) * strength;
    magnet.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
  }

  private resetMagnet(): void {
    if (this.magnetEl) {
      this.magnetEl.style.transform = "";
      this.magnetEl = null;
    }
  }

  private show(): void {
    this.visible = true;
    this.syncClasses();
  }

  private hide(): void {
    this.visible = false;
    this.syncClasses();
    this.resetMagnet();
  }
}
