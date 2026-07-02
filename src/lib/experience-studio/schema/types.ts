/**
 * OT-CMSV2-BUILD-001A — Schema Engine del Experience Studio.
 * El Inspector se construye leyendo estos schemas; no formularios manuales por bloque.
 */

import type { InspectorCanonicalSection } from "@/components/visual-builder/inspector/types";
import type { BlockType } from "@/types/page";

export type SchemaFieldType =
  | "text"
  | "textarea"
  | "number"
  | "boolean"
  | "select"
  | "image"
  | "video"
  | "color"
  | "spacing"
  | "alignment"
  | "link"
  | "slug"
  | "typography"
  | "width"
  | "visibility";

export interface SchemaFieldBase {
  key: string;
  label: string;
  hint?: string;
  section?: InspectorCanonicalSection;
  required?: boolean;
}

export interface SchemaTextField extends SchemaFieldBase {
  type: "text" | "textarea" | "number" | "slug";
  placeholder?: string;
}

export interface SchemaBooleanField extends SchemaFieldBase {
  type: "boolean";
}

export interface SchemaSelectField extends SchemaFieldBase {
  type: "select";
  options: Array<{ value: string; label: string }>;
}

export interface SchemaMediaField extends SchemaFieldBase {
  type: "image" | "video";
  folder?: string;
  category?: string;
}

export interface SchemaLayoutField extends SchemaFieldBase {
  type: "color" | "spacing" | "alignment" | "typography" | "width" | "visibility";
}

export interface SchemaLinkField extends SchemaFieldBase {
  type: "link";
}

export type SchemaField =
  | SchemaTextField
  | SchemaBooleanField
  | SchemaSelectField
  | SchemaMediaField
  | SchemaLayoutField
  | SchemaLinkField;

export interface BlockSchema {
  type: BlockType;
  label: string;
  description: string;
  icon: string;
  category: string;
  /** Si true, usa BlockEditor legacy para campos complejos (sin JSON en UI principal) */
  useLegacyEditor?: boolean;
  fields: SchemaField[];
}

export interface PageExportDocument {
  version: 1;
  exportedAt: string;
  tenant: string;
  page: {
    title: string;
    slug: string;
    description: string;
    template: string;
    seo: Record<string, unknown>;
    blocks: Array<{
      id: string;
      type: BlockType;
      visible: boolean;
      order: number;
      settings: Record<string, unknown>;
    }>;
  };
}
