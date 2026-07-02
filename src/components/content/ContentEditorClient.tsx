"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { colorDefaults } from "@/design/tokens/colors";
import { MediaField } from "@/components/media/MediaPicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  ACADEMIC_AGENDA_CATEGORIES,
  INSTITUTIONAL_NOTICE_CATEGORIES,
} from "@/types/academic-portal";
import { slugify } from "@/lib/slugify";
import { BlockIcon } from "@/components/portal/BlockIcon";
import {
  programAudienceOptions,
  programIconOptions,
  programModalityOptions,
  type ContentDocument,
  type ContentStatus,
  type ProgramStatus,
} from "@/types/content";

const STATUS_OPTIONS: Array<{ value: ContentStatus; label: string }> = [
  { value: "draft", label: "Borrador" },
  { value: "published", label: "Publicado" },
  { value: "archived", label: "Archivado" },
];

const PROGRAM_STATUS_OPTIONS: Array<{ value: ProgramStatus; label: string }> = [
  { value: "active", label: "Activo" },
  { value: "admission_open", label: "Admisión abierta" },
  { value: "coming_soon", label: "Próximamente" },
];

interface ContentEditorClientProps {
  tenant: string;
  collection: string;
  sectionHref: string;
  sectionTitle: string;
  item?: ContentDocument;
}

export function ContentEditorClient({
  tenant,
  collection,
  sectionHref,
  sectionTitle,
  item,
}: ContentEditorClientProps) {
  const router = useRouter();
  const isNew = !item;

  const isProgram = collection === "academy_programs";
  const isNews = collection === "content_news";
  const isEvent = collection === "content_events";
  const isLibrary = collection === "content_library";
  const isAgenda = collection === "content_academic_agenda";
  const isNotice = collection === "content_institutional_notices";
  const isTestimonial = collection === "academy_testimonials";
  const isGallery = collection === "academy_gallery";

  const defaultTitle = isTestimonial ? (item?.author ?? "") : (item?.title ?? "");

  const [title, setTitle] = useState(defaultTitle);
  const slug = slugify(title);
  const [summary, setSummary] = useState(item?.summary ?? "");
  const [content, setContent] = useState(item?.content ?? "");
  const [excerpt, setExcerpt] = useState(item?.excerpt ?? item?.summary ?? "");
  const [category, setCategory] = useState(item?.category ?? "");
  const [status, setStatus] = useState<ContentStatus>(item?.status ?? "draft");
  const [featured, setFeatured] = useState(item?.featured ?? false);
  const [startDate, setStartDate] = useState(item?.startDate?.slice(0, 10) ?? "");
  const [endDate, setEndDate] = useState(item?.endDate?.slice(0, 10) ?? "");
  const [color, setColor] = useState(item?.color ?? colorDefaults.secondary);
  const [visibleFrom, setVisibleFrom] = useState(item?.visibleFrom?.slice(0, 10) ?? "");
  const [visibleUntil, setVisibleUntil] = useState(item?.visibleUntil?.slice(0, 10) ?? "");
  const [href, setHref] = useState(item?.href ?? "");
  const [ctaPrimaryLabel, setCtaPrimaryLabel] = useState(item?.ctaPrimaryLabel ?? "");
  const [ctaSecondaryLabel, setCtaSecondaryLabel] = useState(item?.ctaSecondaryLabel ?? "");
  const [ctaSecondaryHref, setCtaSecondaryHref] = useState(item?.ctaSecondaryHref ?? "");
  const [priority, setPriority] = useState(String(item?.priority ?? 0));
  const [publishedAt, setPublishedAt] = useState(item?.publishedAt?.slice(0, 10) ?? "");
  const [expiresAt, setExpiresAt] = useState(item?.expiresAt?.slice(0, 10) ?? "");
  const [imageMediaId, setImageMediaId] = useState(item?.imageMediaId ?? "");
  const [attachmentMediaId, setAttachmentMediaId] = useState(item?.attachmentMediaId ?? "");
  const [duration, setDuration] = useState(item?.duration ?? "");
  const [modality, setModality] = useState(item?.modality ?? "Online 100%");
  const [programStatus, setProgramStatus] = useState<ProgramStatus>(
    item?.programStatus ?? "active"
  );
  const [certification, setCertification] = useState(item?.certification ?? "");
  const [icon, setIcon] = useState(item?.icon ?? "BookOpen");
  const [fees, setFees] = useState(item?.fees ?? "");
  const [showPrice, setShowPrice] = useState(item?.showPrice ?? false);
  const [badge, setBadge] = useState(item?.badge ?? "");
  const [author, setAuthor] = useState(item?.author ?? "");
  const [date, setDate] = useState(item?.date ?? "");
  const [location, setLocation] = useState(item?.location ?? "");
  const [time, setTime] = useState(item?.time ?? "");
  const [resourceType, setResourceType] = useState(item?.resourceType ?? "");
  const [quote, setQuote] = useState(item?.quote ?? item?.summary ?? "");
  const [role, setRole] = useState(item?.role ?? "");
  const [program, setProgram] = useState(item?.program ?? "");
  const [rating, setRating] = useState(String(item?.rating ?? 5));
  const [alt, setAlt] = useState(item?.alt ?? item?.title ?? "");
  const [order, setOrder] = useState(String(item?.order ?? 0));
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = {
        tenant,
        collection,
        title: isTestimonial ? author : title,
        slug: slug || undefined,
        summary: isTestimonial ? quote : isNews ? excerpt : summary,
        content,
        excerpt,
        category,
        status,
        featured,
        href: href || undefined,
        ctaPrimaryLabel: ctaPrimaryLabel || undefined,
        ctaSecondaryLabel: ctaSecondaryLabel || undefined,
        ctaSecondaryHref: ctaSecondaryHref || undefined,
        imageMediaId: imageMediaId || undefined,
        order: Number(order) || 0,
      };

      if (isProgram) {
        Object.assign(payload, {
          duration,
          modality,
          programStatus,
          certification,
          icon,
          fees,
          showPrice,
          badge,
          startDate: startDate || undefined,
        });
      }

      if (isNews) {
        Object.assign(payload, {
          author: author || undefined,
          date: date || undefined,
          publishedAt: publishedAt ? `${publishedAt}T12:00:00.000Z` : undefined,
        });
      }

      if (isEvent) {
        Object.assign(payload, {
          date: date || undefined,
          time: time || undefined,
          location,
          publishedAt: publishedAt ? `${publishedAt}T12:00:00.000Z` : undefined,
        });
      }

      if (isLibrary) {
        Object.assign(payload, {
          author: author || undefined,
          resourceType: resourceType || undefined,
        });
      }

      if (isAgenda) {
        Object.assign(payload, {
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          color,
          visibleFrom: visibleFrom || undefined,
          visibleUntil: visibleUntil || undefined,
        });
      }

      if (isNotice) {
        Object.assign(payload, {
          priority: Number(priority) || 0,
          publishedAt: publishedAt ? `${publishedAt}T12:00:00.000Z` : undefined,
          expiresAt: expiresAt ? `${expiresAt}T23:59:59.000Z` : undefined,
          attachmentMediaId: attachmentMediaId || undefined,
        });
      }

      if (isTestimonial) {
        Object.assign(payload, {
          quote,
          author,
          role,
          program: program || undefined,
          rating: Number(rating) || undefined,
        });
      }

      if (isGallery) {
        Object.assign(payload, {
          alt,
          srcMediaId: imageMediaId || undefined,
        });
      }

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
      router.push(sectionHref);
      router.refresh();
    } catch {
      setError("Error de red.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const label = isTestimonial ? author : title;
    if (!item || !confirm(`¿Eliminar «${label}»?`)) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/cms/content-items/${item._id}?tenant=${encodeURIComponent(tenant)}&collection=${collection}`,
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

  const categoryOptions = isAgenda
    ? ACADEMIC_AGENDA_CATEGORIES
    : isNotice
      ? INSTITUTIONAL_NOTICE_CATEGORIES
      : [];

  const newLabel = isProgram
    ? "Nuevo programa"
    : isNews
      ? "Nueva noticia"
      : isEvent
        ? "Nuevo evento"
        : isLibrary
          ? "Nuevo recurso"
          : isTestimonial
            ? "Nuevo testimonio"
            : isGallery
              ? "Nueva imagen"
              : "Nuevo";

  return (
    <div className="min-h-screen bg-background-soft">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div>
            <Link href={sectionHref} className="text-sm text-muted hover:text-foreground">
              ← {sectionTitle}
            </Link>
            <h1 className="text-xl font-semibold">{isNew ? newLabel : "Editar"}</h1>
          </div>
          <div className="flex gap-2">
            {!isNew ? (
              <Button type="button" variant="outline" onClick={handleDelete} disabled={deleting}>
                {deleting ? "Eliminando…" : "Eliminar"}
              </Button>
            ) : null}
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Guardando…" : "Guardar"}
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-6 px-4 py-6 sm:px-6">
        {error ? (
          <div className="rounded-lg border border-[var(--state-danger-border)] bg-[var(--state-danger-bg)] px-4 py-3 text-sm text-[var(--color-danger)]">
            {error}
          </div>
        ) : null}

        {isTestimonial ? (
          <>
            <Textarea
              label="Testimonio"
              value={quote}
              onChange={(e) => setQuote(e.target.value)}
              rows={5}
              required
            />
            <Input label="Autor" value={author} onChange={(e) => setAuthor(e.target.value)} required />
            <Input label="Cargo / generación" value={role} onChange={(e) => setRole(e.target.value)} />
            <Input
              label="Programa / iglesia"
              value={program}
              onChange={(e) => setProgram(e.target.value)}
            />
            <Input
              label="Calificación (1-5)"
              type="number"
              min={1}
              max={5}
              value={rating}
              onChange={(e) => setRating(e.target.value)}
            />
          </>
        ) : isGallery ? (
          <>
            <Input label="Título" value={title} onChange={(e) => setTitle(e.target.value)} required />
            <Input label="Texto alternativo" value={alt} onChange={(e) => setAlt(e.target.value)} />
          </>
        ) : (
          <>
            <Input label="Título" value={title} onChange={(e) => setTitle(e.target.value)} required />
            <Input
              label="Slug"
              value={slug}
              readOnly
              tabIndex={-1}
              className="cursor-default bg-background-soft text-muted"
              helper="Se genera automáticamente del título"
            />
          </>
        )}

        {isProgram ? (
          <>
            <Textarea
              label="Descripción"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={4}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Duración" value={duration} onChange={(e) => setDuration(e.target.value)} />
              <Select
                label="Modalidad"
                value={modality}
                onChange={(e) => setModality(e.target.value)}
                options={programModalityOptions(modality)}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                label="Estado del programa"
                value={programStatus}
                onChange={(e) => setProgramStatus(e.target.value as ProgramStatus)}
                options={PROGRAM_STATUS_OPTIONS}
              />
              <Select
                label="Dirigido a"
                value={certification}
                onChange={(e) => setCertification(e.target.value)}
                placeholder="Seleccionar…"
                options={programAudienceOptions(certification)}
                helper="Público objetivo que verá el visitante en la tarjeta del programa"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Categoría"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                helper="Ej. Generación 2026"
              />
              <div className="space-y-1.5">
                <Select
                  label="Icono"
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  options={programIconOptions(icon)}
                  helper="Respaldo visual si no hay imagen de portada"
                />
                <p className="flex items-center gap-2 text-xs text-muted">
                  <span className="flex h-7 w-7 items-center justify-center rounded-md bg-background-soft">
                    <BlockIcon name={icon} className="h-4 w-4 text-secondary" aria-hidden />
                  </span>
                  Vista previa del icono
                </p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Arancel / precio" value={fees} onChange={(e) => setFees(e.target.value)} />
              <Input label="Etiqueta (badge)" value={badge} onChange={(e) => setBadge(e.target.value)} />
            </div>
            <Switch label="Mostrar precio" checked={showPrice} onChange={setShowPrice} />
            <Input
              label="Fecha de inicio"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </>
        ) : null}

        {isNews ? (
          <>
            <Textarea label="Extracto" value={excerpt} onChange={(e) => setExcerpt(e.target.value)} rows={3} />
            <Textarea label="Contenido" value={content} onChange={(e) => setContent(e.target.value)} rows={8} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Autor" value={author} onChange={(e) => setAuthor(e.target.value)} />
              <Input label="Categoría" value={category} onChange={(e) => setCategory(e.target.value)} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Fecha" value={date} onChange={(e) => setDate(e.target.value)} />
              <Input
                label="Fecha publicación"
                type="date"
                value={publishedAt}
                onChange={(e) => setPublishedAt(e.target.value)}
              />
            </div>
          </>
        ) : null}

        {isEvent ? (
          <>
            <Textarea label="Descripción" value={summary} onChange={(e) => setSummary(e.target.value)} rows={3} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Fecha" value={date} onChange={(e) => setDate(e.target.value)} />
              <Input label="Hora" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
            <Input label="Lugar" value={location} onChange={(e) => setLocation(e.target.value)} />
          </>
        ) : null}

        {isLibrary ? (
          <>
            <Textarea label="Descripción" value={summary} onChange={(e) => setSummary(e.target.value)} rows={3} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Autor" value={author} onChange={(e) => setAuthor(e.target.value)} />
              <Input
                label="Tipo de recurso"
                value={resourceType}
                onChange={(e) => setResourceType(e.target.value)}
              />
            </div>
            <Input label="Categoría" value={category} onChange={(e) => setCategory(e.target.value)} />
          </>
        ) : null}

        {categoryOptions.length > 0 ? (
          <Select
            label="Categoría"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            options={[{ value: "", label: "Seleccionar…" }, ...categoryOptions]}
          />
        ) : null}

        {!isProgram && !isNews && !isEvent && !isLibrary && !isTestimonial && !isGallery ? (
          <Textarea
            label={isNotice ? "Resumen" : "Descripción"}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={3}
          />
        ) : null}

        {isNotice ? (
          <Textarea label="Contenido" value={content} onChange={(e) => setContent(e.target.value)} rows={8} />
        ) : null}

        {isAgenda ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Fecha inicio"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
              <Input
                label="Fecha término"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <Input label="Color" type="color" value={color} onChange={(e) => setColor(e.target.value)} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Visible desde"
                type="date"
                value={visibleFrom}
                onChange={(e) => setVisibleFrom(e.target.value)}
              />
              <Input
                label="Visible hasta"
                type="date"
                value={visibleUntil}
                onChange={(e) => setVisibleUntil(e.target.value)}
              />
            </div>
          </>
        ) : null}

        {isNotice ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Fecha publicación"
                type="date"
                value={publishedAt}
                onChange={(e) => setPublishedAt(e.target.value)}
              />
              <Input
                label="Fecha expiración"
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
            </div>
            <Input
              label="Prioridad"
              type="number"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              helper="Mayor número = más visible"
            />
          </>
        ) : null}

        {!isGallery ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Enlace (URL)" value={href} onChange={(e) => setHref(e.target.value)} />
            <Input
              label="Texto del botón"
              value={ctaPrimaryLabel}
              onChange={(e) => setCtaPrimaryLabel(e.target.value)}
            />
          </div>
        ) : null}

        {isProgram ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Botón secundario"
              value={ctaSecondaryLabel}
              onChange={(e) => setCtaSecondaryLabel(e.target.value)}
            />
            <Input
              label="Enlace secundario"
              value={ctaSecondaryHref}
              onChange={(e) => setCtaSecondaryHref(e.target.value)}
            />
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Orden"
            type="number"
            value={order}
            onChange={(e) => setOrder(e.target.value)}
            helper="Menor número = aparece primero"
          />
          {!isGallery && !isTestimonial ? (
            <Select
              label="Estado"
              value={status}
              onChange={(e) => setStatus(e.target.value as ContentStatus)}
              options={STATUS_OPTIONS}
            />
          ) : null}
        </div>

        {!isGallery && !isTestimonial ? (
          <Switch label="Destacado" checked={featured} onChange={setFeatured} />
        ) : null}

        <MediaField
          label={isGallery ? "Imagen" : "Imagen de portada"}
          tenant={tenant}
          value={imageMediaId}
          onChange={setImageMediaId}
        />

        {isNotice ? (
          <MediaField
            label="Archivo adjunto"
            tenant={tenant}
            value={attachmentMediaId}
            onChange={setAttachmentMediaId}
          />
        ) : null}
      </main>
    </div>
  );
}
