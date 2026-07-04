"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  FormSection,
  InlineActions,
  ValidationSummary,
} from "@/components/admin/kit";
import { AdminModulePage } from "@/components/admin/kit/layout/AdminModulePage";
import { useConfirmDialog } from "@/components/admin/kit/hooks/useConfirmDialog";
import { MediaField } from "@/components/media/MediaPicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  TEAM_GROUP_SELECT_OPTIONS,
  getTeamGroup,
  getTeamGroupBySlug,
} from "@/lib/content/team-groups";
import { slugify } from "@/lib/slugify";
import { PERSON_ROLES, PERSON_STATUSES } from "@/types/people-grid";
import type { ContentDocument, ContentStatus } from "@/types/content";

const STATUS_OPTIONS: Array<{ value: ContentStatus; label: string }> = [
  { value: "draft", label: "Borrador" },
  { value: "published", label: "Publicado" },
  { value: "archived", label: "Archivado" },
];

interface PersonEditorClientProps {
  tenant: string;
  sectionHref: string;
  item?: ContentDocument;
}

export function PersonEditorClient({ tenant, sectionHref, item }: PersonEditorClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { confirm, dialog: confirmDialog } = useConfirmDialog();
  const isNew = !item;
  const defaultGroup =
    getTeamGroup(item?.category)?.slug ??
    searchParams.get("group") ??
    "leadership";
  const defaultGroupId = getTeamGroupBySlug(defaultGroup)?.id ?? "team_leadership";

  const [name, setName] = useState(item?.name ?? item?.title ?? "");
  const slug = slugify(name);
  const [role, setRole] = useState(item?.role ?? "");
  const [specialty, setSpecialty] = useState(item?.specialty ?? "");
  const [summary, setSummary] = useState(item?.summary ?? "");
  const [category, setCategory] = useState(item?.category ?? defaultGroupId);
  const [personRole, setPersonRole] = useState(item?.personRole ?? "authority");
  const [personStatus, setPersonStatus] = useState<string>(item?.personStatus ?? "active");
  const [order, setOrder] = useState(String(item?.order ?? 0));
  const [status, setStatus] = useState<ContentStatus>(item?.status ?? "draft");
  const [featured, setFeatured] = useState(item?.featured ?? false);
  const [visible, setVisible] = useState(item?.visible !== false);
  const [email, setEmail] = useState(item?.email ?? "");
  const [phone, setPhone] = useState(item?.phone ?? "");
  const [linkedin, setLinkedin] = useState(item?.linkedin ?? "");
  const [imageMediaId, setImageMediaId] = useState(item?.imageMediaId ?? item?.photoMediaId ?? "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const payload = {
        tenant,
        collection: "content_people",
        title: name,
        name,
        slug: slug || undefined,
        role,
        specialty,
        summary,
        category,
        personRole,
        personStatus,
        order: Number(order) || 0,
        status,
        featured,
        visible,
        email: email || undefined,
        phone: phone || undefined,
        linkedin: linkedin || undefined,
        imageMediaId: imageMediaId || undefined,
      };

      const url = isNew ? "/api/cms/content-items" : `/api/cms/content-items/${item!._id}`;
      const res = await fetch(url, {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.errors?.[0]?.message ?? data.error ?? "Error al guardar.");
        return;
      }
      const group = getTeamGroup(category);
      router.push(group ? `${sectionHref}?group=${group.slug}` : sectionHref);
      router.refresh();
    } catch {
      setError("Error de red.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!item) return;
    const ok = await confirm({
      title: "Eliminar persona",
      description: `¿Eliminar a «${name}»? Esta acción no se puede deshacer.`,
      confirmLabel: "Eliminar",
      destructive: true,
    });
    if (!ok) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/cms/content-items/${item._id}?tenant=${encodeURIComponent(tenant)}&collection=content_people`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "No se pudo eliminar.");
        return;
      }
      router.push(sectionHref);
      router.refresh();
    } catch {
      setError("Error de red.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AdminModulePage
      breadcrumbs={[
        { label: "Inicio", href: "/admin" },
        { label: "Comunicaciones", href: "/admin/content" },
        { label: "Personas", href: sectionHref },
        { label: isNew ? "Nueva persona" : "Editar persona" },
      ]}
      title={isNew ? "Nueva persona" : "Editar persona"}
      description="Perfil del equipo directivo, docente o técnico"
      maxWidth="6xl"
      actions={
        <>
          {!isNew ? (
            <Button type="button" variant="outline" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Eliminando…" : "Eliminar"}
            </Button>
          ) : null}
          <Button type="button" onClick={handleSave} disabled={saving}>
            {saving ? "Guardando…" : "Guardar"}
          </Button>
        </>
      }
    >
      {error ? <ValidationSummary errors={[error]} /> : null}

      <FormSection title="Identidad" description="Equipo, nombre y cargo visible en el portal.">
        <Select
          label="Tipo de equipo"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          options={TEAM_GROUP_SELECT_OPTIONS}
          required
        />
        <Input label="Nombre completo" value={name} onChange={(e) => setName(e.target.value)} required />
        <Input
          label="Cargo"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          helper="Ej. Director Nacional, Docente titular, Coordinador de admisiones"
          required
        />
        <Input
          label="Especialidad"
          value={specialty}
          onChange={(e) => setSpecialty(e.target.value)}
          helper="Opcional — área académica o ministerial"
        />
        <Textarea
          label="Biografía breve"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          rows={4}
        />
      </FormSection>

      <FormSection title="Medios" description="Foto de perfil para listados y fichas.">
        <MediaField
          label="Foto de perfil"
          tenant={tenant}
          value={imageMediaId}
          onChange={setImageMediaId}
        />
      </FormSection>

      <FormSection title="Clasificación interna" description="Rol editorial y estado operativo.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Rol interno"
            value={personRole}
            onChange={(e) => setPersonRole(e.target.value)}
            options={PERSON_ROLES.map((value) => ({ value, label: value }))}
          />
          <Select
            label="Estado editorial"
            value={personStatus}
            onChange={(e) => setPersonStatus(e.target.value)}
            options={PERSON_STATUSES.map((value) => ({ value, label: value }))}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Orden"
            type="number"
            value={order}
            onChange={(e) => setOrder(e.target.value)}
            helper="Menor número = aparece primero"
          />
          <Input
            label="Slug"
            value={slug}
            readOnly
            tabIndex={-1}
            className="cursor-default bg-background-soft text-muted"
            helper="Se genera automáticamente del nombre"
          />
        </div>
      </FormSection>

      <FormSection title="Contacto" description="Datos opcionales de contacto público.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input label="Teléfono" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <Input label="LinkedIn" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} />
      </FormSection>

      <FormSection title="Publicación" description="Visibilidad en el portal institucional.">
        <Select
          label="Estado de publicación"
          value={status}
          onChange={(e) => setStatus(e.target.value as ContentStatus)}
          options={STATUS_OPTIONS}
        />
        <Switch label="Destacado en home" checked={featured} onChange={setFeatured} />
        <Switch label="Visible en el portal" checked={visible} onChange={setVisible} />
      </FormSection>

      <InlineActions>
        <Button type="button" variant="outline" href={sectionHref}>
          Cancelar
        </Button>
        {!isNew ? (
          <Button type="button" variant="outline" onClick={handleDelete} disabled={deleting}>
            {deleting ? "Eliminando…" : "Eliminar"}
          </Button>
        ) : null}
        <Button type="button" onClick={handleSave} disabled={saving}>
          {saving ? "Guardando…" : "Guardar"}
        </Button>
      </InlineActions>

      {confirmDialog}
    </AdminModulePage>
  );
}
