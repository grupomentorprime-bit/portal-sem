import { AdminModuleLayout, type AdminModuleLayoutProps } from "@/components/admin/AdminModuleLayout";

interface AdminPageFrameProps {
  title: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
  breadcrumbs?: AdminModuleLayoutProps["breadcrumbs"];
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function AdminPageFrame({
  title,
  description,
  backHref = "/admin",
  backLabel = "Volver al inicio",
  breadcrumbs,
  actions,
  children,
  className,
}: AdminPageFrameProps) {
  const items = breadcrumbs ?? [
    { label: "Inicio", href: "/admin" },
    { label: title },
  ];

  return (
    <AdminModuleLayout
      breadcrumbs={items}
      title={title}
      description={description}
      actions={
        actions ?? (
          <a href={backHref} className="text-sm text-muted underline hover:text-foreground">
            {backLabel}
          </a>
        )
      }
      maxWidth="6xl"
      className={className}
    >
      {children}
    </AdminModuleLayout>
  );
}
