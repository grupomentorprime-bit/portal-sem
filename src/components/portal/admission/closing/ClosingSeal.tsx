import Image from "next/image";
import type { AdmissionClosingSealData } from "@/types/admission-closing";
import { cn } from "@/lib/utils";

interface ClosingSealProps {
  data: AdmissionClosingSealData;
}

const SEAL_SIZES = {
  sm: 120,
  md: 180,
  lg: 260,
} as const;

export function ClosingSeal({ data }: ClosingSealProps) {
  const size = SEAL_SIZES[data.size] ?? SEAL_SIZES.lg;

  return (
    <div
      className={cn(
        "admission-closing__seal-watermark",
        `admission-closing__seal-watermark--${data.position}`,
        `admission-closing__seal-watermark--${data.tone}`,
        `admission-closing__seal-watermark--${data.size}`
      )}
      style={{ opacity: (data.opacity ?? 100) / 100 }}
      aria-hidden
    >
      <Image
        src="/images/logo-sem-icon.svg"
        alt=""
        width={size}
        height={size}
        className="admission-closing__seal-watermark-img"
      />
    </div>
  );
}

export function ClosingSealPills({ lines }: { lines: string[] }) {
  const visible = lines.filter((line) => line.trim());
  if (visible.length === 0) return null;

  return (
    <div className="admission-closing__seal-pills" aria-label="Sellos institucionales">
      {visible.map((line) => (
        <span key={line} className="admission-closing__seal-pill">
          {line}
        </span>
      ))}
    </div>
  );
}
