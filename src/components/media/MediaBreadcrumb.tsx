"use client";

interface MediaBreadcrumbProps {
  folder?: string;
  tenant: string;
}

export function MediaBreadcrumb({ folder, tenant }: MediaBreadcrumbProps) {
  return (
    <p className="text-xs text-muted">
      Media Library / {tenant}
      {folder ? ` / ${folder}` : ""}
    </p>
  );
}
