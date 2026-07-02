"use client";

import { MediaField } from "@/components/media/MediaPicker";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import type {
  AdmissionClosingActionItem,
  AdmissionClosingBlock,
  AdmissionClosingFooterColumn,
  AdmissionClosingFooterItem,
  AdmissionClosingIndicator,
  AdmissionClosingQuoteItem,
} from "@/types/admission-closing";
import { ADMISSION_CLOSING_BLOCK_LABELS } from "@/types/admission-closing";
import { sortClosingBlocks } from "@/lib/portal/admission-closing-utils";
import { AdmissionSortableList } from "./AdmissionSortableList";

interface AdmissionClosingBlockEditorProps {
  block: AdmissionClosingBlock;
  tenant: string;
  onChange: (block: AdmissionClosingBlock) => void;
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-foreground">{label}</span>
      {children}
    </label>
  );
}

function updateListItem<T extends { id: string }>(
  items: T[],
  id: string,
  patch: Partial<T>
): T[] {
  return items.map((item) => (item.id === id ? { ...item, ...patch } : item));
}

export function AdmissionClosingBlockEditor({
  block,
  tenant,
  onChange,
}: AdmissionClosingBlockEditorProps) {
  switch (block.type) {
    case "message":
      return (
        <div className="space-y-4">
          <Field label="Eyebrow">
            <Input
              value={block.data.eyebrow}
              onChange={(e) =>
                onChange({ ...block, data: { ...block.data, eyebrow: e.target.value } })
              }
            />
          </Field>
          <Field label="Título">
            <Input
              value={block.data.title}
              onChange={(e) =>
                onChange({ ...block, data: { ...block.data, title: e.target.value } })
              }
            />
          </Field>
          <Field label="Subtítulo">
            <Input
              value={block.data.subtitle}
              onChange={(e) =>
                onChange({ ...block, data: { ...block.data, subtitle: e.target.value } })
              }
            />
          </Field>
          <Field label="Descripción">
            <Textarea
              rows={4}
              value={block.data.description}
              onChange={(e) =>
                onChange({ ...block, data: { ...block.data, description: e.target.value } })
              }
            />
          </Field>
          <MediaField
            label="Imagen de fondo"
            description="Elija desde la Biblioteca de Medios institucional."
            tenant={tenant}
            folder="Hero"
            value={block.data.mediaId ?? ""}
            onChange={(mediaId) =>
              onChange({ ...block, data: { ...block.data, mediaId } })
            }
          />
          <Field label="Overlay (%)">
            <Input
              type="number"
              min={0}
              max={100}
              value={block.data.overlay}
              onChange={(e) =>
                onChange({
                  ...block,
                  data: { ...block.data, overlay: Number(e.target.value) || 0 },
                })
              }
            />
          </Field>
          <Field label="Alineación">
            <select
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              value={block.data.alignment}
              onChange={(e) =>
                onChange({
                  ...block,
                  data: {
                    ...block.data,
                    alignment: e.target.value as typeof block.data.alignment,
                  },
                })
              }
            >
              <option value="left">Izquierda</option>
              <option value="center">Centro</option>
              <option value="right">Derecha</option>
            </select>
          </Field>
        </div>
      );

    case "actions": {
      const items = sortClosingBlocks(block.data.items);
      return (
        <div className="space-y-4">
          {items.map((item, index) => (
            <div key={item.id} className="space-y-3 rounded-xl border border-border p-4">
              <p className="text-sm font-medium text-foreground">Botón {index + 1}</p>
              <Field label="Texto">
                <Input
                  value={item.label}
                  onChange={(e) =>
                    onChange({
                      ...block,
                      data: {
                        items: updateListItem(block.data.items, item.id, {
                          label: e.target.value,
                        }),
                      },
                    })
                  }
                />
              </Field>
              <Field label="Icono">
                <Input
                  value={item.icon ?? ""}
                  onChange={(e) =>
                    onChange({
                      ...block,
                      data: {
                        items: updateListItem(block.data.items, item.id, {
                          icon: e.target.value,
                        }),
                      },
                    })
                  }
                />
              </Field>
              <Field label="Enlace">
                <Input
                  value={item.href}
                  onChange={(e) =>
                    onChange({
                      ...block,
                      data: {
                        items: updateListItem(block.data.items, item.id, {
                          href: e.target.value,
                        }),
                      },
                    })
                  }
                />
              </Field>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={item.openInNewTab ?? false}
                  onChange={(e) =>
                    onChange({
                      ...block,
                      data: {
                        items: updateListItem(block.data.items, item.id, {
                          openInNewTab: e.target.checked,
                        }),
                      },
                    })
                  }
                />
                Abrir en nueva pestaña
              </label>
              <Switch
                checked={item.visible}
                onChange={(visible: boolean) =>
                  onChange({
                    ...block,
                    data: {
                      items: updateListItem(block.data.items, item.id, { visible }),
                    },
                  })
                }
                label="Visible"
              />
            </div>
          ))}
          <button
            type="button"
            className="text-sm font-medium text-primary"
            onClick={() => {
              const next: AdmissionClosingActionItem = {
                id: `act-${Date.now()}`,
                label: "Nuevo botón",
                href: "#",
                variant: "outline",
                order: block.data.items.length,
                visible: true,
              };
              onChange({ ...block, data: { items: [...block.data.items, next] } });
            }}
          >
            + Agregar botón
          </button>
        </div>
      );
    }

    case "indicators": {
      const items = sortClosingBlocks(block.data.items);
      return (
        <div className="space-y-4">
          {items.map((item, index) => (
            <div key={item.id} className="space-y-3 rounded-xl border border-border p-4">
              <p className="text-sm font-medium text-foreground">Indicador {index + 1}</p>
              <Field label="Valor">
                <Input
                  value={item.value}
                  onChange={(e) =>
                    onChange({
                      ...block,
                      data: {
                        items: updateListItem(block.data.items, item.id, {
                          value: e.target.value,
                        }),
                      },
                    })
                  }
                />
              </Field>
              <Field label="Título">
                <Input
                  value={item.title}
                  onChange={(e) =>
                    onChange({
                      ...block,
                      data: {
                        items: updateListItem(block.data.items, item.id, {
                          title: e.target.value,
                        }),
                      },
                    })
                  }
                />
              </Field>
              <Field label="Descripción">
                <Input
                  value={item.description ?? ""}
                  onChange={(e) =>
                    onChange({
                      ...block,
                      data: {
                        items: updateListItem(block.data.items, item.id, {
                          description: e.target.value,
                        }),
                      },
                    })
                  }
                />
              </Field>
              <Field label="Icono">
                <Input
                  value={item.icon ?? ""}
                  onChange={(e) =>
                    onChange({
                      ...block,
                      data: {
                        items: updateListItem(block.data.items, item.id, {
                          icon: e.target.value,
                        }),
                      },
                    })
                  }
                />
              </Field>
              <Switch
                checked={item.visible}
                onChange={(visible: boolean) =>
                  onChange({
                    ...block,
                    data: {
                      items: updateListItem(block.data.items, item.id, { visible }),
                    },
                  })
                }
                label="Visible"
              />
            </div>
          ))}
          <button
            type="button"
            className="text-sm font-medium text-primary"
            onClick={() => {
              const next: AdmissionClosingIndicator = {
                id: `ind-${Date.now()}`,
                title: "",
                value: "",
                order: block.data.items.length,
                visible: true,
              };
              onChange({ ...block, data: { items: [...block.data.items, next] } });
            }}
          >
            + Agregar indicador
          </button>
        </div>
      );
    }

    case "quote": {
      const items = sortClosingBlocks(block.data.items);
      return (
        <div className="space-y-4">
          {items.map((item, index) => (
            <div key={item.id} className="space-y-3 rounded-xl border border-border p-4">
              <p className="text-sm font-medium text-foreground">Frase {index + 1}</p>
              <Field label="Texto">
                <Textarea
                  rows={3}
                  value={item.text}
                  onChange={(e) =>
                    onChange({
                      ...block,
                      data: {
                        items: updateListItem(block.data.items, item.id, {
                          text: e.target.value,
                        }),
                      },
                    })
                  }
                />
              </Field>
              <Field label="Autor">
                <Input
                  value={item.author ?? ""}
                  onChange={(e) =>
                    onChange({
                      ...block,
                      data: {
                        items: updateListItem(block.data.items, item.id, {
                          author: e.target.value,
                        }),
                      },
                    })
                  }
                />
              </Field>
              <Field label="Referencia bíblica">
                <Input
                  value={item.reference ?? ""}
                  onChange={(e) =>
                    onChange({
                      ...block,
                      data: {
                        items: updateListItem(block.data.items, item.id, {
                          reference: e.target.value,
                        }),
                      },
                    })
                  }
                />
              </Field>
              <Switch
                checked={item.showQuotes}
                onChange={(showQuotes: boolean) =>
                  onChange({
                    ...block,
                    data: {
                      items: updateListItem(block.data.items, item.id, { showQuotes }),
                    },
                  })
                }
                label="Mostrar comillas"
              />
              <Switch
                checked={item.showSignature}
                onChange={(showSignature: boolean) =>
                  onChange({
                    ...block,
                    data: {
                      items: updateListItem(block.data.items, item.id, { showSignature }),
                    },
                  })
                }
                label="Mostrar firma"
              />
              <Switch
                checked={item.visible}
                onChange={(visible: boolean) =>
                  onChange({
                    ...block,
                    data: {
                      items: updateListItem(block.data.items, item.id, { visible }),
                    },
                  })
                }
                label="Visible"
              />
            </div>
          ))}
          <button
            type="button"
            className="text-sm font-medium text-primary"
            onClick={() => {
              const next: AdmissionClosingQuoteItem = {
                id: `quote-${Date.now()}`,
                text: "",
                showQuotes: true,
                showSignature: true,
                visible: true,
                order: block.data.items.length,
              };
              onChange({ ...block, data: { items: [...block.data.items, next] } });
            }}
          >
            + Agregar frase
          </button>
        </div>
      );
    }

    case "contact":
      return (
        <div className="space-y-4">
          <Field label="Título">
            <Input
              value={block.data.title}
              onChange={(e) =>
                onChange({ ...block, data: { ...block.data, title: e.target.value } })
              }
            />
          </Field>
          <Field label="Descripción">
            <Textarea
              rows={3}
              value={block.data.description}
              onChange={(e) =>
                onChange({ ...block, data: { ...block.data, description: e.target.value } })
              }
            />
          </Field>
          <Field label="Correo">
            <Input
              value={block.data.email}
              onChange={(e) =>
                onChange({ ...block, data: { ...block.data, email: e.target.value } })
              }
            />
          </Field>
          <Field label="Teléfono">
            <Input
              value={block.data.phone}
              onChange={(e) =>
                onChange({ ...block, data: { ...block.data, phone: e.target.value } })
              }
            />
          </Field>
          <Field label="WhatsApp">
            <Input
              value={block.data.whatsapp ?? ""}
              onChange={(e) =>
                onChange({ ...block, data: { ...block.data, whatsapp: e.target.value } })
              }
            />
          </Field>
          <Field label="Horario">
            <Input
              value={block.data.schedule ?? ""}
              onChange={(e) =>
                onChange({ ...block, data: { ...block.data, schedule: e.target.value } })
              }
            />
          </Field>
          <Field label="Dirección">
            <Input
              value={block.data.address ?? ""}
              onChange={(e) =>
                onChange({ ...block, data: { ...block.data, address: e.target.value } })
              }
            />
          </Field>
          <Field label="Mapa (URL embed)">
            <Input
              value={block.data.mapEmbedUrl ?? ""}
              onChange={(e) =>
                onChange({ ...block, data: { ...block.data, mapEmbedUrl: e.target.value } })
              }
            />
          </Field>
        </div>
      );

    case "footer": {
      const columns = sortClosingBlocks(block.data.columns);
      return (
        <div className="space-y-4">
          {columns.map((column, columnIndex) => (
            <div key={column.id} className="space-y-3 rounded-xl border border-border p-4">
              <p className="text-sm font-medium text-foreground">Columna {columnIndex + 1}</p>
              <Field label="Título">
                <Input
                  value={column.title}
                  onChange={(e) =>
                    onChange({
                      ...block,
                      data: {
                        columns: updateListItem(block.data.columns, column.id, {
                          title: e.target.value,
                        }),
                      },
                    })
                  }
                />
              </Field>
              <Switch
                checked={column.visible}
                onChange={(visible: boolean) =>
                  onChange({
                    ...block,
                    data: {
                      columns: updateListItem(block.data.columns, column.id, { visible }),
                    },
                  })
                }
                label="Visible"
              />
              {sortClosingBlocks(column.items).map((item, itemIndex) => (
                <div key={item.id} className="space-y-2 rounded-lg bg-background-soft p-3">
                  <p className="text-xs font-medium text-muted">Enlace {itemIndex + 1}</p>
                  <Input
                    placeholder="Texto"
                    value={item.text}
                    onChange={(e) =>
                      onChange({
                        ...block,
                        data: {
                          columns: block.data.columns.map((col) =>
                            col.id === column.id
                              ? {
                                  ...col,
                                  items: updateListItem(col.items, item.id, {
                                    text: e.target.value,
                                  }),
                                }
                              : col
                          ),
                        },
                      })
                    }
                  />
                  <Input
                    placeholder="URL"
                    value={item.url ?? ""}
                    onChange={(e) =>
                      onChange({
                        ...block,
                        data: {
                          columns: block.data.columns.map((col) =>
                            col.id === column.id
                              ? {
                                  ...col,
                                  items: updateListItem(col.items, item.id, {
                                    url: e.target.value,
                                  }),
                                }
                              : col
                          ),
                        },
                      })
                    }
                  />
                </div>
              ))}
              <button
                type="button"
                className="text-xs font-medium text-primary"
                onClick={() => {
                  const next: AdmissionClosingFooterItem = {
                    id: `link-${Date.now()}`,
                    text: "Nuevo enlace",
                    type: "url",
                    url: "/",
                    order: column.items.length,
                  };
                  onChange({
                    ...block,
                    data: {
                      columns: block.data.columns.map((col) =>
                        col.id === column.id
                          ? { ...col, items: [...col.items, next] }
                          : col
                      ),
                    },
                  });
                }}
              >
                + Agregar enlace
              </button>
            </div>
          ))}
          <button
            type="button"
            className="text-sm font-medium text-primary"
            onClick={() => {
              const next: AdmissionClosingFooterColumn = {
                id: `col-${Date.now()}`,
                title: "Nueva columna",
                items: [],
                order: block.data.columns.length,
                visible: true,
              };
              onChange({ ...block, data: { columns: [...block.data.columns, next] } });
            }}
          >
            + Agregar columna
          </button>
        </div>
      );
    }

    case "backdrop":
      return (
        <div className="space-y-4">
          <Field label="Modo">
            <select
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              value={block.data.mode}
              onChange={(e) =>
                onChange({
                  ...block,
                  data: {
                    ...block.data,
                    mode: e.target.value as typeof block.data.mode,
                  },
                })
              }
            >
              <option value="gradient">Gradiente</option>
              <option value="image">Imagen</option>
              <option value="video">Video</option>
              <option value="pattern">Patrón</option>
              <option value="texture">Textura</option>
            </select>
          </Field>
          {block.data.mode === "image" ? (
            <MediaField
              label="Imagen de fondo"
              description="Biblioteca de Medios institucional."
              tenant={tenant}
              folder="Hero"
              value={block.data.imageMediaId ?? ""}
              onChange={(imageMediaId) =>
                onChange({ ...block, data: { ...block.data, imageMediaId } })
              }
            />
          ) : null}
          {block.data.mode === "video" ? (
            <MediaField
              label="Video de fondo"
              description="Biblioteca de Medios — categoría Video."
              tenant={tenant}
              folder="Videos"
              category="Video"
              value={block.data.videoMediaId ?? ""}
              onChange={(videoMediaId) =>
                onChange({ ...block, data: { ...block.data, videoMediaId } })
              }
            />
          ) : null}
          <Field label="Overlay (%)">
            <Input
              type="number"
              min={0}
              max={100}
              value={block.data.overlay}
              onChange={(e) =>
                onChange({
                  ...block,
                  data: { ...block.data, overlay: Number(e.target.value) || 0 },
                })
              }
            />
          </Field>
          <Switch
            checked={block.data.parallax}
            onChange={(parallax: boolean) => onChange({ ...block, data: { ...block.data, parallax } })}
            label="Parallax"
          />
          <Switch
            checked={block.data.blur}
            onChange={(blur: boolean) => onChange({ ...block, data: { ...block.data, blur } })}
            label="Desenfoque"
          />
        </div>
      );

    case "seal":
      return (
        <div className="space-y-4">
          {block.data.lines.map((line, index) => (
            <Field key={`${block.id}-line-${index}`} label={`Línea ${index + 1}`}>
              <Input
                value={line}
                onChange={(e) => {
                  const lines = [...block.data.lines];
                  lines[index] = e.target.value;
                  onChange({ ...block, data: { ...block.data, lines } });
                }}
              />
            </Field>
          ))}
          <button
            type="button"
            className="text-sm font-medium text-primary"
            onClick={() =>
              onChange({
                ...block,
                data: { ...block.data, lines: [...block.data.lines, ""] },
              })
            }
          >
            + Agregar línea
          </button>
        </div>
      );

    case "copyright":
      return (
        <div className="space-y-4">
          <Field label="Texto principal">
            <Input
              value={block.data.primaryText}
              onChange={(e) =>
                onChange({ ...block, data: { ...block.data, primaryText: e.target.value } })
              }
            />
          </Field>
          <Field label="Texto secundario">
            <Input
              value={block.data.secondaryText ?? ""}
              onChange={(e) =>
                onChange({ ...block, data: { ...block.data, secondaryText: e.target.value } })
              }
            />
          </Field>
          <Field label="Línea desarrollador">
            <Input
              value={block.data.developerText ?? ""}
              onChange={(e) =>
                onChange({ ...block, data: { ...block.data, developerText: e.target.value } })
              }
            />
          </Field>
        </div>
      );

    case "benefits": {
      const items = sortClosingBlocks(block.data.items);
      return (
        <div className="space-y-4">
          {items.map((item, index) => (
            <div key={item.id} className="space-y-3 rounded-xl border border-border p-4">
              <p className="text-sm font-medium text-foreground">Beneficio {index + 1}</p>
              <Field label="Etiqueta">
                <Input
                  value={item.label}
                  onChange={(e) =>
                    onChange({
                      ...block,
                      data: {
                        items: updateListItem(block.data.items, item.id, {
                          label: e.target.value,
                        }),
                      },
                    })
                  }
                />
              </Field>
              <Field label="Icono">
                <Input
                  value={item.icon ?? ""}
                  onChange={(e) =>
                    onChange({
                      ...block,
                      data: {
                        items: updateListItem(block.data.items, item.id, {
                          icon: e.target.value,
                        }),
                      },
                    })
                  }
                />
              </Field>
              <Switch
                checked={item.visible}
                onChange={(visible: boolean) =>
                  onChange({
                    ...block,
                    data: {
                      items: updateListItem(block.data.items, item.id, { visible }),
                    },
                  })
                }
                label="Visible"
              />
            </div>
          ))}
          <button
            type="button"
            className="text-sm font-medium text-primary"
            onClick={() =>
              onChange({
                ...block,
                data: {
                  items: [
                    ...block.data.items,
                    {
                      id: `ben-${Date.now()}`,
                      label: "Nuevo beneficio",
                      order: block.data.items.length,
                      visible: true,
                    },
                  ],
                },
              })
            }
          >
            + Agregar beneficio
          </button>
        </div>
      );
    }

    case "final_cta":
      return (
        <div className="space-y-4">
          <Field label="Icono">
            <Input
              value={block.data.icon ?? ""}
              onChange={(e) =>
                onChange({ ...block, data: { ...block.data, icon: e.target.value } })
              }
            />
          </Field>
          <Field label="Título">
            <Input
              value={block.data.title}
              onChange={(e) =>
                onChange({ ...block, data: { ...block.data, title: e.target.value } })
              }
            />
          </Field>
          <Field label="Descripción">
            <Textarea
              rows={3}
              value={block.data.description}
              onChange={(e) =>
                onChange({ ...block, data: { ...block.data, description: e.target.value } })
              }
            />
          </Field>
          <Field label="Texto del botón">
            <Input
              value={block.data.buttonLabel}
              onChange={(e) =>
                onChange({ ...block, data: { ...block.data, buttonLabel: e.target.value } })
              }
            />
          </Field>
          <Field label="Enlace del botón">
            <Input
              value={block.data.buttonHref}
              onChange={(e) =>
                onChange({ ...block, data: { ...block.data, buttonHref: e.target.value } })
              }
            />
          </Field>
        </div>
      );

    default: {
      const _exhaustive: never = block;
      return (
        <p className="text-sm text-muted">
          Editor no disponible para este bloque.
        </p>
      );
    }
  }
}

interface AdmissionClosingEditorProps {
  blocks: AdmissionClosingBlock[];
  selectedBlockId: string | null;
  tenant: string;
  onBlocksChange: (blocks: AdmissionClosingBlock[]) => void;
  onSelectBlock: (id: string) => void;
  onReorderBlocks: (draggedId: string, targetId: string) => void;
  onToggleBlock: (id: string) => void;
}

export function AdmissionClosingEditor({
  blocks,
  selectedBlockId,
  tenant,
  onBlocksChange,
  onSelectBlock,
  onReorderBlocks,
  onToggleBlock,
}: AdmissionClosingEditorProps) {
  const sorted = sortClosingBlocks(blocks);
  const selected = sorted.find((block) => block.id === selectedBlockId) ?? sorted[0];

  const listItems = sorted.map((block) => ({
    id: block.id,
    label: ADMISSION_CLOSING_BLOCK_LABELS[block.type],
    enabled: block.enabled,
  }));

  return (
    <div className="grid gap-6 lg:grid-cols-[16rem_1fr]">
      <AdmissionSortableList
        items={listItems}
        selectedId={selected?.id ?? null}
        onSelect={onSelectBlock}
        onReorder={onReorderBlocks}
        onToggleEnabled={onToggleBlock}
      />
      {selected ? (
        <div className="rounded-xl border border-border bg-background p-5">
          <h3 className="mb-4 text-base font-semibold text-foreground">
            {ADMISSION_CLOSING_BLOCK_LABELS[selected.type]}
          </h3>
          <AdmissionClosingBlockEditor
            block={selected}
            tenant={tenant}
            onChange={(updated) =>
              onBlocksChange(blocks.map((block) => (block.id === updated.id ? updated : block)))
            }
          />
        </div>
      ) : null}
    </div>
  );
}
