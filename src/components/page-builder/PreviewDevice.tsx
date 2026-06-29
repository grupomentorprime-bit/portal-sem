"use client";

import { cn } from "@/lib/utils";

export type PreviewDevice = "desktop" | "tablet" | "mobile";

interface PreviewDeviceFrameProps {
  device: PreviewDevice;
  onChange: (device: PreviewDevice) => void;
}

const devices: Array<{ id: PreviewDevice; label: string; width: string }> = [
  { id: "desktop", label: "Desktop", width: "100%" },
  { id: "tablet", label: "Tablet", width: "768px" },
  { id: "mobile", label: "Mobile", width: "375px" },
];

export function PreviewDeviceSwitcher({ device, onChange }: PreviewDeviceFrameProps) {
  return (
    <div className="flex gap-2">
      {devices.map((d) => (
        <button
          key={d.id}
          type="button"
          onClick={() => onChange(d.id)}
          className={cn(
            "rounded-[var(--radius-md)] px-3 py-1.5 text-caption font-medium transition",
            device === d.id
              ? "bg-primary text-text-inverse"
              : "bg-background-muted text-muted hover:text-foreground"
          )}
        >
          {d.label}
        </button>
      ))}
    </div>
  );
}

export function PreviewDeviceFrame({
  device,
  children,
}: {
  device: PreviewDevice;
  children: React.ReactNode;
}) {
  const width = devices.find((d) => d.id === device)?.width ?? "100%";

  return (
    <div className="mx-auto w-full overflow-hidden rounded-[var(--radius-lg)] border border-border bg-background shadow-[var(--shadow-md)] transition-all duration-[var(--transition-normal)]" style={{ maxWidth: width }}>
      {children}
    </div>
  );
}
