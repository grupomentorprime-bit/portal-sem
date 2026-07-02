import { SEM_FOOTER_INSTITUTION } from "@/lib/portal/footer-content";
import { cn } from "@/lib/utils";

interface FooterSealProps {
  className?: string;
  line1?: string;
  line2?: string;
  line3?: string;
}

export function FooterSeal({
  className,
  line1 = SEM_FOOTER_INSTITUTION.sealLine1,
  line2 = SEM_FOOTER_INSTITUTION.sealLine2,
  line3 = SEM_FOOTER_INSTITUTION.sealLine3,
}: FooterSealProps) {
  return (
    <figure
      className={cn("footer-premium__seal", className)}
      aria-label={`${line1} ${line2} — ${line3}`}
    >
      <svg
        className="footer-premium__seal-svg"
        viewBox="0 0 160 160"
        role="img"
        aria-hidden
      >
        <defs>
          <linearGradient id="footer-seal-ring" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--footer-seal-highlight)" />
            <stop offset="50%" stopColor="var(--footer-seal-mid)" />
            <stop offset="100%" stopColor="var(--footer-seal-shadow)" />
          </linearGradient>
          <linearGradient id="footer-seal-fill" x1="20%" y1="10%" x2="80%" y2="90%">
            <stop offset="0%" stopColor="var(--footer-seal-fill-top)" />
            <stop offset="100%" stopColor="var(--footer-seal-fill-bottom)" />
          </linearGradient>
        </defs>
        <circle
          cx="80"
          cy="80"
          r="74"
          fill="none"
          stroke="url(#footer-seal-ring)"
          strokeWidth="2.5"
        />
        <circle
          cx="80"
          cy="80"
          r="66"
          fill="url(#footer-seal-fill)"
          stroke="url(#footer-seal-ring)"
          strokeWidth="1.25"
        />
        <circle
          cx="80"
          cy="80"
          r="58"
          fill="none"
          stroke="url(#footer-seal-ring)"
          strokeWidth="0.75"
          opacity="0.65"
        />
      </svg>
      <figcaption className="footer-premium__seal-text">
        <span className="footer-premium__seal-line footer-premium__seal-line--1">{line1}</span>
        <span className="footer-premium__seal-line footer-premium__seal-line--2">{line2}</span>
        <span className="footer-premium__seal-line footer-premium__seal-line--3">{line3}</span>
      </figcaption>
    </figure>
  );
}
