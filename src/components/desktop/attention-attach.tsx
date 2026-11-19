"use client";

import { useEffect, useRef, useState, type DragEvent } from "react";

const ATTACH_MAX_BYTES = 4_000_000;
const WORD_DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const WORD_DOC = "application/msword";

function attachmentKind(file: { name: string; type: string }): "image" | "pdf" | "word" | null {
  const type = file.type.toLowerCase();
  if (type === "application/pdf") return "pdf";
  if (type === WORD_DOC || type === WORD_DOCX) return "word";
  if (type.startsWith("image/")) return "image";
  const name = file.name.toLowerCase();
  if (name.endsWith(".pdf")) return "pdf";
  if (name.endsWith(".doc") || name.endsWith(".docx")) return "word";
  if (/\.(png|jpe?g|webp|gif|bmp)$/.test(name)) return "image";
  return null;
}

function allowedImageType(type: string): "image/png" | "image/jpeg" | "image/webp" | null {
  if (type === "image/jpg") return "image/jpeg";
  if (type === "image/png" || type === "image/jpeg" || type === "image/webp") return type;
  return null;
}

function attachmentMediaType(file: File, kind: "image" | "pdf" | "word"): string {
  if (
    file.type === "image/png" ||
    file.type === "image/jpeg" ||
    file.type === "image/webp" ||
    file.type === "application/pdf" ||
    file.type === WORD_DOC ||
    file.type === WORD_DOCX
  ) {
    return file.type;
  }
  if (kind === "pdf") return "application/pdf";
  if (kind === "word") return file.name.toLowerCase().endsWith(".doc") ? WORD_DOC : WORD_DOCX;
  const name = file.name.toLowerCase();
  if (name.endsWith(".webp")) return "image/webp";
  if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return "image/jpeg";
  return "image/png";
}

function attachmentName(file: File, kind: "image" | "pdf" | "word"): string {
  const fallback = kind === "pdf" ? "documento.pdf" : kind === "word" ? "documento.docx" : "captura.png";
  const raw = file.name.replace(/[\\/]/g, " ").trim();
  const clean = !raw || raw === "image.png" || raw === "blob" ? fallback : raw;
  if (clean.length <= 80) return clean;
  const dot = clean.lastIndexOf(".");
  const ext = dot > 0 ? clean.slice(dot, dot + 8) : "";
  return `${clean.slice(0, 80 - ext.length)}${ext}`;
}

function clipboardFileName(type: string): string {
  if (type === "application/pdf") return "documento.pdf";
  if (type === "image/jpeg" || type === "image/jpg") return "captura.jpg";
  if (type === "image/webp") return "captura.webp";
  return "captura.png";
}

function withClipboardType(file: File, type: string): File {
  if (file.type || !type) return file;
  const name = !file.name || file.name === "blob" ? clipboardFileName(type) : file.name;
  return new File([file], name, { type });
}

function fileFromClipboard(data: DataTransfer | null): File | null {
  if (!data) return null;
  for (const item of data.items) {
    if (item.kind !== "file") continue;
    const raw = item.getAsFile();
    if (!raw || raw.size <= 0) continue;
    const file = withClipboardType(raw, item.type);
    if (attachmentKind(file) || item.type.startsWith("image/") || item.type === "application/pdf") return file;
  }
  for (const file of data.files) {
    if (file.size <= 0) continue;
    if (attachmentKind(file) || file.type.startsWith("image/")) return file;
  }
  return null;
}

function readDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("read"));
    };
    reader.onerror = () => reject(reader.error ?? new Error("read"));
    reader.readAsDataURL(file);
  });
}

function forceDataUrl(mediaType: string, dataUrl: string): string {
  const comma = dataUrl.indexOf(",");
  const payload = comma >= 0 ? dataUrl.slice(comma + 1) : "";
  return `data:${mediaType};base64,${payload}`;
}

async function imageFileToPng(file: Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  try {
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas");
    ctx.drawImage(bitmap, 0, 0);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob((value) => resolve(value), "image/png"));
    if (!blob) throw new Error("png");
    return blob;
  } finally {
    bitmap.close();
  }
}

export function useTicketAttachment(enabled: boolean) {
  const [attachment, setAttachment] = useState<Record<string, string> | null>(null);
  const [note, setNote] = useState("");
  const [dropping, setDropping] = useState(false);
  const takeFileRef = useRef<(file: File | undefined) => void>(() => {});
  const attachSeq = useRef(0);

  async function takeFile(file: File | undefined) {
    if (!file) return;
    const seq = ++attachSeq.current;
    const kind = attachmentKind(file);
    if (!kind) {
      setNote("Solo imagen, PDF o Word.");
      return;
    }
    if (file.size > ATTACH_MAX_BYTES) {
      setNote("El archivo pasa de 4 MB.");
      return;
    }
    try {
      let next: Record<string, string>;
      if (kind === "pdf" || kind === "word") {
        const mediaType = attachmentMediaType(file, kind);
        next = { name: attachmentName(file, kind), mediaType, dataUrl: forceDataUrl(mediaType, await readDataUrl(file)) };
      } else {
        const direct = allowedImageType(file.type) ?? (file.type ? null : allowedImageType(attachmentMediaType(file, "image")));
        if (direct) {
          next = { name: attachmentName(file, "image"), mediaType: direct, dataUrl: forceDataUrl(direct, await readDataUrl(file)) };
        } else {
          const png = await imageFileToPng(file);
          if (png.size > ATTACH_MAX_BYTES) {
            if (seq === attachSeq.current) setNote("El archivo pasa de 4 MB.");
            return;
          }
          next = { name: "captura.png", mediaType: "image/png", dataUrl: await readDataUrl(png) };
        }
      }
      if (seq !== attachSeq.current) return;
      setAttachment(next);
      setNote("");
    } catch {
      if (seq === attachSeq.current) setNote("No pude leer ese archivo.");
    }
  }

  takeFileRef.current = (file) => {
    void takeFile(file);
  };

  useEffect(() => {
    if (!enabled) return;
    function onWindowPaste(event: ClipboardEvent) {
      const file = fileFromClipboard(event.clipboardData);
      if (file) {
        event.preventDefault();
        takeFileRef.current(file);
        return;
      }
      const hinted = [...(event.clipboardData?.items ?? [])].some((item) => item.type.startsWith("image/") || item.type === "application/pdf");
      if (!hinted || !navigator.clipboard?.read) return;
      event.preventDefault();
      void navigator.clipboard
        .read()
        .then(async (items) => {
          for (const item of items) {
            const type = item.types.find((entry) => entry.startsWith("image/") || entry === "application/pdf");
            if (!type) continue;
            const blob = await item.getType(type);
            takeFileRef.current(new File([blob], clipboardFileName(type), { type }));
            return;
          }
        })
        .catch(() => setNote("No pude pegar. Arrastra el archivo o elige uno."));
    }
    window.addEventListener("paste", onWindowPaste);
    return () => window.removeEventListener("paste", onWindowPaste);
  }, [enabled]);

  function onDragOver(event: DragEvent<HTMLFormElement>) {
    if (![...event.dataTransfer.types].includes("Files")) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    setDropping(true);
  }

  function onDragLeave(event: DragEvent<HTMLFormElement>) {
    if (event.currentTarget.contains(event.relatedTarget as Node)) return;
    setDropping(false);
  }

  function onDrop(event: DragEvent<HTMLFormElement>) {
    event.preventDefault();
    setDropping(false);
    const file = [...event.dataTransfer.files].find((item) => attachmentKind(item));
    if (!file) {
      setNote("Solo imagen, PDF o Word.");
      return;
    }
    void takeFile(file);
  }

  function clear() {
    attachSeq.current += 1;
    setAttachment(null);
    setNote("");
  }

  return {
    attachment,
    note,
    dropping,
    takeFile,
    clear,
    dropProps: { onDragOver, onDragLeave, onDrop },
  };
}

export function AttachControl({
  attachment,
  note,
  dropping,
  onPick,
  onClear,
}: {
  attachment: Record<string, string> | null;
  note: string;
  dropping: boolean;
  onPick: (file: File | undefined) => void;
  onClear: () => void;
}) {
  const preview = attachment?.dataUrl.startsWith("data:image/") ? attachment.dataUrl : "";
  const hint = note || (dropping ? "Suelta para adjuntar" : "Arrastra aquí, pega (Ctrl+V) o elige. Imagen, PDF o Word.");
  return (
    <div className={`attn-dropzone${attachment ? " is-on" : ""}${dropping ? " is-dropping" : ""}${note ? " is-warn" : ""}`}>
      <label className="attn-dropzone-hit">
        <input
          type="file"
          accept="image/*,application/pdf,.pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.doc,.docx"
          aria-label="Adjuntar imagen, PDF o Word"
          onChange={(event) => {
            onPick(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
        {preview ? <img src={preview} alt="" /> : <span className="attn-dropzone-mark" aria-hidden="true" />}
        <span className="attn-dropzone-copy">
          <strong>{attachment?.name || (dropping ? "Suelta aquí" : "Adjuntar captura, PDF o Word")}</strong>
          <small className={note ? "is-warn" : undefined}>{hint}</small>
        </span>
        <span className="attn-dropzone-pick">{attachment ? "Cambiar" : "Elegir"}</span>
      </label>
      {attachment ? (
        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onClear();
          }}
          aria-label="Quitar adjunto"
        >
          Quitar
        </button>
      ) : null}
    </div>
  );
}
