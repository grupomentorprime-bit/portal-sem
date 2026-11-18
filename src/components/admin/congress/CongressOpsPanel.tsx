"use client";

import { useCallback, useMemo, useState } from "react";
import { CreditCard, RefreshCw } from "lucide-react";
import { useDeferredEffect } from "@/hooks/use-deferred-effect";
import {
  AlertBanner,
  EmptyState,
  LoadingState,
  Section,
  Timeline,
} from "@/components/admin/kit";
import { SummaryView } from "@/components/admin/congress/summary/SummaryView";
import { LodgingOpsView } from "@/components/admin/congress/lodging/LodgingOpsView";
import { AdminModulePage } from "@/components/admin/kit/layout/AdminModulePage";
import { useToast } from "@/components/admin/kit/states/Toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { CongressAttendanceDay } from "@/core/congress/constants";
import { CONGRESS_CONTRIBUTION_CLP, CONGRESS_NIGHTS } from "@/core/congress/constants";
import type {
  CongressAuditEntry,
  CongressLodgingAssignment,
  CongressLodgingHome,
  CongressLodgingNeed,
  CongressRegistration,
} from "@/core/congress/types";
import { formatClp, formatZoneLabel } from "@/components/admin/congress/labels";
import {
  ReceptionView,
  type ReceptionQuickFilter,
} from "@/components/admin/congress/reception/ReceptionView";
import { NewParticipantDialog } from "@/components/admin/congress/participant/NewParticipantDialog";
import { ParticipantSheet } from "@/components/admin/congress/participant/ParticipantSheet";

type TabId =
  | "recepcion"
  | "resumen"
  | "aportes"
  | "alojamiento"
  | "reportes"
  | "historial"
  | "importacion";

interface CongressSummary {
  registrationsTotal: number;
  registrationsBySource: Record<string, number>;
  attendanceSaturday: { present: number; absent: number; unmarked: number };
  attendanceSunday: { present: number; absent: number; unmarked: number };
  receptionSaturday?: { expected: number; present: number; pendingArrival: number };
  receptionSunday?: { expected: number; present: number; pendingArrival: number };
  balances: {
    totalChargeClp: number;
    totalPaidClp: number;
    totalOutstandingClp: number;
    needsReviewCount: number;
  };
  lodging: {
    requestedBeds: number;
    assignedBeds: number;
    homesCount: number;
  };
  lodgingHomes?: CongressLodgingHome[];
  lodgingAssignments?: CongressLodgingAssignment[];
}

export function CongressOpsPanel() {
  const { push } = useToast();
  const [activeTab, setActiveTab] = useState<TabId>("recepcion");
  const [summary, setSummary] = useState<CongressSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [zoneFilter, setZoneFilter] = useState("");
  const [churchFilter, setChurchFilter] = useState("");
  const [quickFilter, setQuickFilter] = useState<ReceptionQuickFilter>("all");
  const [journeyDay, setJourneyDay] = useState<CongressAttendanceDay>("saturday");

  const [registrations, setRegistrations] = useState<CongressRegistration[]>([]);
  const [zoneOptions, setZoneOptions] = useState<{ id: string; label: string }[]>([]);
  const [churchOptions, setChurchOptions] = useState<string[]>([]);
  const [churchesByZone, setChurchesByZone] = useState<Record<string, string[]>>({});
  const [registrationsLoading, setRegistrationsLoading] = useState(false);
  const [registrationsError, setRegistrationsError] = useState<string | null>(null);

  const [capabilities, setCapabilities] = useState({
    view: true,
    operate: false,
    payments: false,
    financeCorrect: false,
    import: false,
  });

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [doorSaving, setDoorSaving] = useState(false);
  const [arrivalSavingId, setArrivalSavingId] = useState<string | null>(null);
  const [sheetBusy, setSheetBusy] = useState(false);

  const [payments, setPayments] = useState<
    Array<{
      _id: string;
      payerName: string;
      amountClp: number;
      unallocatedClp: number;
      status: string;
      voidReason?: string | null;
    }>
  >([]);
  const [groupChurch, setGroupChurch] = useState("");
  const [groupSelected, setGroupSelected] = useState<string[]>([]);
  const [groupAmount, setGroupAmount] = useState("");
  const [groupPayer, setGroupPayer] = useState("");
  const [paymentSaving, setPaymentSaving] = useState(false);
  const [voidReason, setVoidReason] = useState("");
  const [voidingId, setVoidingId] = useState<string | null>(null);

  const [homeSaving, setHomeSaving] = useState(false);

  const [auditEntries, setAuditEntries] = useState<CongressAuditEntry[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);

  const [importFile, setImportFile] = useState<File | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importNote, setImportNote] = useState<string | null>(null);

  const assignments = summary?.lodgingAssignments ?? [];
  const homes = summary?.lodgingHomes ?? [];

  const loadSummary = useCallback(async () => {
    setSummaryLoading(true);
    setSummaryError(null);
    try {
      const res = await fetch("/api/congress/summary");
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setSummaryError(data.error ?? "No se pudo cargar el resumen.");
        setSummary(null);
        return;
      }
      setSummary(data.summary ?? null);
    } catch {
      setSummaryError("Error de red al cargar el resumen.");
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  const loadRegistrations = useCallback(async () => {
    setRegistrationsLoading(true);
    setRegistrationsError(null);
    try {
      const res = await fetch("/api/congress/registrations");
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setRegistrationsError(data.error ?? "No se pudieron cargar los inscritos.");
        setRegistrations([]);
        return;
      }
      setRegistrations(data.registrations ?? data.items ?? []);
      setZoneOptions(
        (data.filterOptions?.zones ?? []).map(
          (z: { id: string; label?: string } | string) =>
            typeof z === "string"
              ? { id: z, label: formatZoneLabel(z) }
              : { id: z.id, label: z.label || formatZoneLabel(z.id) }
        )
      );
      setChurchOptions(data.filterOptions?.churches ?? []);
      setChurchesByZone(
        (data.filterOptions?.churchesByZone as Record<string, string[]> | undefined) ?? {}
      );
    } catch {
      setRegistrationsError("Error de red al cargar inscritos.");
    } finally {
      setRegistrationsLoading(false);
    }
  }, []);

  const loadCapabilities = useCallback(async () => {
    try {
      const res = await fetch("/api/congress/capabilities");
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok && data.capabilities) setCapabilities(data.capabilities);
    } catch {
      /* ignore */
    }
  }, []);

  const loadPayments = useCallback(async () => {
    try {
      const res = await fetch("/api/congress/payments");
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) setPayments(data.items ?? []);
    } catch {
      /* ignore */
    }
  }, []);

  const loadAudit = useCallback(async () => {
    setAuditLoading(true);
    try {
      const res = await fetch("/api/congress/audit");
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) setAuditEntries(data.entries ?? data.items ?? []);
    } finally {
      setAuditLoading(false);
    }
  }, []);

  useDeferredEffect(() => {
    void loadSummary();
    void loadCapabilities();
    void loadRegistrations();
  }, [loadSummary, loadCapabilities, loadRegistrations]);

  useDeferredEffect(() => {
    if (activeTab === "aportes") void loadPayments();
    if (activeTab === "historial") void loadAudit();
  }, [activeTab, loadPayments, loadAudit]);

  const dayKpis = useMemo(() => {
    const empty = { expected: 0, present: 0, pendingArrival: 0 };
    if (!summary) return empty;
    return journeyDay === "saturday"
      ? summary.receptionSaturday ?? empty
      : summary.receptionSunday ?? empty;
  }, [journeyDay, summary]);

  const selected = useMemo(
    () => registrations.find((r) => r._id === selectedId) ?? null,
    [registrations, selectedId]
  );

  const upsertRegistration = (reg: CongressRegistration) => {
    setRegistrations((prev) => {
      const idx = prev.findIndex((r) => r._id === reg._id);
      if (idx < 0) return [reg, ...prev];
      const next = [...prev];
      next[idx] = reg;
      return next;
    });
  };

  const patchAttendance = async (
    registrationId: string,
    day: CongressAttendanceDay,
    present: boolean | null,
    reason?: string
  ) => {
    const key = `${registrationId}:${day}`;
    setArrivalSavingId(key);
    setSheetBusy(true);
    try {
      const res = await fetch(
        `/api/congress/registrations/${encodeURIComponent(registrationId)}/attendance`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ day, present, reason }),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        push({
          title: "Asistencia no guardada",
          description: data.error ?? "No se pudo actualizar.",
          tone: "warning",
        });
        return;
      }
      if (data.registration) upsertRegistration(data.registration);
      void loadSummary();
      if (!data.idempotent) {
        push({ title: present === true ? "Llegada registrada" : "Asistencia actualizada", tone: "success" });
      }
    } catch {
      push({ title: "Error de red", tone: "error" });
    } finally {
      setArrivalSavingId(null);
      setSheetBusy(false);
    }
  };

  const submitDoor = async (payload: {
    fullName: string;
    rut?: string;
    zoneId: string;
    churchName: string;
    phone?: string;
    email?: string;
    expectedDays: { saturday: boolean | null; sunday: boolean | null };
    lodgingNeed: "unknown" | "none" | "requested";
  }) => {
    setDoorSaving(true);
    try {
      const res = await fetch("/api/congress/registrations/door", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        push({
          title: "No se pudo registrar",
          description:
            data.error === "duplicate"
              ? "Ya existe una ficha coincidente."
              : data.error ?? "Error del servidor.",
          tone: "warning",
        });
        return;
      }
      const reg = data.registration as CongressRegistration;
      upsertRegistration(reg);
      setNewOpen(false);
      setSelectedId(reg._id);
      void loadSummary();
      void loadRegistrations();
      push({ title: "Participante creado", tone: "success" });
    } catch {
      push({ title: "Error de red", tone: "error" });
    } finally {
      setDoorSaving(false);
    }
  };

  const patchRegistration = async (
    id: string,
    patch: {
      expectedDays?: { saturday: boolean | null; sunday: boolean | null };
      lodgingNeed?: CongressLodgingNeed;
    }
  ) => {
    setSheetBusy(true);
    try {
      const res = await fetch(`/api/congress/registrations/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        push({
          title: "No se pudo actualizar",
          description: data.error ?? "Error del servidor.",
          tone: "warning",
        });
        return;
      }
      if (data.registration) upsertRegistration(data.registration);
      void loadSummary();
    } finally {
      setSheetBusy(false);
    }
  };

  const individualPayment = async (input: {
    registrationId: string;
    amountClp: number;
    payerName: string;
    receiptRef?: string;
  }) => {
    setSheetBusy(true);
    try {
      const res = await fetch("/api/congress/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payerType: "individual",
          payerName: input.payerName,
          amountClp: input.amountClp,
          receiptRef: input.receiptRef,
          allocations: [
            { registrationId: input.registrationId, amountClp: input.amountClp },
          ],
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        push({
          title: "Pago no registrado",
          description: data.error ?? "Error del servidor.",
          tone: "warning",
        });
        return;
      }
      push({ title: "Pago registrado", tone: "success" });
      void loadRegistrations();
      void loadSummary();
      void loadPayments();
    } finally {
      setSheetBusy(false);
    }
  };

  const assignBed = async (input: {
    registrationId: string;
    homeId: string;
    night: string;
  }) => {
    setSheetBusy(true);
    try {
      const res = await fetch("/api/congress/lodging/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        push({
          title: "Asignación no creada",
          description: data.error ?? "Error del servidor.",
          tone: "warning",
        });
        return;
      }
      push({ title: "Cama asignada", tone: "success" });
      void loadSummary();
      void loadRegistrations();
    } finally {
      setSheetBusy(false);
    }
  };

  const assignmentAction = async (
    assignmentId: string,
    action: "confirm" | "cancel"
  ) => {
    setSheetBusy(true);
    try {
      const res = await fetch(
        `/api/congress/lodging/assignments/${encodeURIComponent(assignmentId)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        push({
          title: "Operación no aplicada",
          description: data.error ?? "Error del servidor.",
          tone: "warning",
        });
        return;
      }
      push({
        title: action === "confirm" ? "Alojamiento confirmado" : "Asignación cancelada",
        tone: "success",
      });
      void loadSummary();
    } finally {
      setSheetBusy(false);
    }
  };

  const groupCandidates = useMemo(
    () =>
      groupChurch
        ? registrations.filter((r) => r.churchName === groupChurch)
        : [],
    [groupChurch, registrations]
  );

  const groupPreview = useMemo(() => {
    const amount = Number(groupAmount.replace(/\D/g, ""));
    if (!amount || groupSelected.length === 0) return [];
    const base = Math.floor(amount / groupSelected.length);
    let rest = amount - base * groupSelected.length;
    return groupSelected.map((id) => {
      const extra = rest > 0 ? 1 : 0;
      if (rest > 0) rest -= 1;
      return { registrationId: id, amountClp: base + extra };
    });
  }, [groupAmount, groupSelected]);

  const submitGroupPayment = async (event: React.FormEvent) => {
    event.preventDefault();
    const amount = Number(groupAmount.replace(/\D/g, ""));
    if (!groupPayer.trim() || !amount || groupPreview.length === 0) {
      push({ title: "Complete pagador, monto y participantes", tone: "warning" });
      return;
    }
    setPaymentSaving(true);
    try {
      const res = await fetch("/api/congress/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payerType: "church",
          payerName: groupPayer.trim(),
          churchName: groupChurch || undefined,
          amountClp: amount,
          allocations: groupPreview,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        push({
          title: "Pago grupal no registrado",
          description: data.error ?? "Error del servidor.",
          tone: "warning",
        });
        return;
      }
      push({ title: "Pago grupal registrado", tone: "success" });
      setGroupSelected([]);
      setGroupAmount("");
      void loadPayments();
      void loadRegistrations();
      void loadSummary();
    } finally {
      setPaymentSaving(false);
    }
  };

  const createHome = async (input: {
    name: string;
    contactName?: string;
    address?: string;
    notes?: string;
    capFri: number;
    capSat: number;
  }) => {
    setHomeSaving(true);
    try {
      const res = await fetch("/api/congress/lodging/homes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: input.name,
          contactName: input.contactName,
          address: input.address,
          notes: input.notes,
          capacityByNight: {
            [CONGRESS_NIGHTS[0]]: input.capFri,
            [CONGRESS_NIGHTS[1]]: input.capSat,
          },
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        push({ title: data.error ?? "No se pudo crear el hogar", tone: "warning" });
        return;
      }
      void loadSummary();
      push({ title: "Hogar registrado con cupos", tone: "success" });
    } finally {
      setHomeSaving(false);
    }
  };

  const runImportPreview = async () => {
    if (!importFile) {
      push({ title: "Seleccione un Excel", tone: "warning" });
      return;
    }
    setImportLoading(true);
    setImportNote(null);
    try {
      const form = new FormData();
      form.set("file", importFile);
      const res = await fetch("/api/congress/import/preview", {
        method: "POST",
        body: form,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setImportNote(data.error ?? "No se pudo previsualizar.");
        return;
      }
      const named = data.preview?.namedPeople?.length ?? 0;
      setImportNote(
        `Vista previa: ${named} personas nombradas. La importación definitiva permanece deshabilitada.`
      );
    } finally {
      setImportLoading(false);
    }
  };

  const exportCsv = () => {
    const rows = [
      ["Nombre", "Zona", "Iglesia", "RUT", "Teléfono", "Sábado", "Domingo", "Cargo", "Pagado"].join(
        ","
      ),
      ...registrations.map((r) =>
        [
          r.identity.fullName,
          formatZoneLabel(r.zoneId),
          r.churchName,
          r.identity.rut ?? "",
          r.identity.phone ?? "",
          String(r.attendance.saturday),
          String(r.attendance.sunday),
          r.chargeAmountClp ?? "",
          r.allocatedPaidClp,
        ]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(",")
      ),
    ].join("\n");
    const blob = new Blob([rows], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "congreso-varones-inscritos.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminModulePage
      breadcrumbs={[
        { label: "Inicio", href: "/admin" },
        { label: "Congreso de Varones" },
      ]}
      title="Congreso de Varones 2026"
      description="Quilicura · 21 y 22 de noviembre"
      actions={
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            void loadSummary();
            void loadRegistrations();
            void loadCapabilities();
          }}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Actualizar
        </Button>
      }
    >
      <Tabs
        defaultValue="recepcion"
        onChange={(value) => setActiveTab(value as TabId)}
        className="w-full"
      >
        <TabsList className="mb-3 flex h-auto w-full flex-wrap justify-start gap-1">
          <TabsTrigger value="recepcion">Recepción</TabsTrigger>
          <TabsTrigger value="resumen">Resumen</TabsTrigger>
          <TabsTrigger value="aportes">Aportes y pagos</TabsTrigger>
          <TabsTrigger value="alojamiento">Alojamiento</TabsTrigger>
          <TabsTrigger value="reportes">Reportes</TabsTrigger>
          <TabsTrigger value="historial">Historial</TabsTrigger>
          <TabsTrigger value="importacion">Importación</TabsTrigger>
        </TabsList>

        <TabsContent value="recepcion">
          <ReceptionView
            journeyDay={journeyDay}
            onJourneyDayChange={setJourneyDay}
            dayKpis={dayKpis}
            registrations={registrations}
            assignments={assignments}
            zoneOptions={zoneOptions}
            churchOptions={churchOptions}
            loading={registrationsLoading}
            error={registrationsError}
            operate={capabilities.operate}
            search={search}
            onSearchChange={setSearch}
            zoneFilter={zoneFilter}
            onZoneFilterChange={setZoneFilter}
            churchFilter={churchFilter}
            onChurchFilterChange={setChurchFilter}
            quickFilter={quickFilter}
            onQuickFilterChange={setQuickFilter}
            onClearFilters={() => {
              setSearch("");
              setZoneFilter("");
              setChurchFilter("");
              setQuickFilter("all");
            }}
            onOpenNew={() => setNewOpen(true)}
            onOpenParticipant={setSelectedId}
            onRegisterArrival={(id, day) => void patchAttendance(id, day, true)}
            onRevertArrival={(id, day) => void patchAttendance(id, day, null)}
            arrivalSavingId={arrivalSavingId}
          />
        </TabsContent>

        <TabsContent value="resumen">
          <SummaryView
            loading={summaryLoading}
            error={summaryError}
            registrationsTotal={summary?.registrationsTotal ?? 0}
            registrationsBySource={summary?.registrationsBySource ?? {}}
            receptionSaturday={
              summary?.receptionSaturday ?? {
                expected: 0,
                present: 0,
                pendingArrival: 0,
              }
            }
            receptionSunday={
              summary?.receptionSunday ?? {
                expected: 0,
                present: 0,
                pendingArrival: 0,
              }
            }
            attendanceSaturday={
              summary?.attendanceSaturday ?? {
                present: 0,
                absent: 0,
                unmarked: 0,
              }
            }
            attendanceSunday={
              summary?.attendanceSunday ?? {
                present: 0,
                absent: 0,
                unmarked: 0,
              }
            }
            balances={
              summary?.balances ?? {
                totalChargeClp: 0,
                totalPaidClp: 0,
                totalOutstandingClp: 0,
                needsReviewCount: 0,
              }
            }
            registrations={registrations}
            assignments={assignments}
            homesCount={summary?.lodging.homesCount ?? homes.length}
            churchRequestedBeds={summary?.lodging.requestedBeds ?? 0}
          />
        </TabsContent>

        <TabsContent value="aportes">
          <Section
            title="Pago grupal"
            description={`Aporte ${formatClp(CONGRESS_CONTRIBUTION_CLP)} por persona, válido para ambos días (da igual si llega sábado o domingo). El pagador no se confunde con los cubiertos.`}
          >
            <form onSubmit={submitGroupPayment} className="grid max-w-3xl gap-3">
              <Select
                label="Iglesia"
                value={groupChurch}
                onChange={(e) => {
                  setGroupChurch(e.target.value);
                  setGroupSelected([]);
                }}
                options={[
                  { value: "", label: "Seleccionar iglesia…" },
                  ...Array.from(new Set(registrations.map((r) => r.churchName)))
                    .sort()
                    .map((c) => ({ value: c, label: c })),
                ]}
              />
              <Input
                label="Nombre del pagador"
                value={groupPayer}
                onChange={(e) => setGroupPayer(e.target.value)}
                required
              />
              <Input
                label="Monto total (CLP)"
                inputMode="numeric"
                value={groupAmount}
                onChange={(e) => setGroupAmount(e.target.value)}
                required
              />
              <div className="max-h-48 space-y-1 overflow-y-auto rounded-md border border-border p-2">
                {groupCandidates.map((r) => {
                  const checked = groupSelected.includes(r._id);
                  return (
                    <label key={r._id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          setGroupSelected((prev) =>
                            checked ? prev.filter((id) => id !== r._id) : [...prev, r._id]
                          )
                        }
                      />
                      {r.identity.fullName}
                    </label>
                  );
                })}
                {groupChurch && groupCandidates.length === 0 ? (
                  <p className="text-xs text-muted">Sin participantes en esa iglesia.</p>
                ) : null}
              </div>
              {groupPreview.length > 0 ? (
                <div className="rounded-md border border-border bg-white p-3 text-sm">
                  <p className="mb-2 font-medium">Distribución prevista</p>
                  <ul className="space-y-1">
                    {groupPreview.map((row) => {
                      const reg = registrations.find((r) => r._id === row.registrationId);
                      return (
                        <li key={row.registrationId}>
                          {reg?.identity.fullName ?? row.registrationId}:{" "}
                          {formatClp(row.amountClp)}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : null}
              <Button type="submit" size="sm" loading={paymentSaving}>
                <CreditCard className="mr-2 h-4 w-4" />
                Guardar pago grupal
              </Button>
            </form>
          </Section>

          <Section title="Pagos registrados" className="mt-6">
            {capabilities.financeCorrect ? (
              <Input
                className="mb-3 max-w-md"
                label="Motivo de anulación"
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
              />
            ) : null}
            {payments.length === 0 ? (
              <EmptyState title="Sin pagos" />
            ) : (
              <ul className="divide-y divide-border rounded-lg border border-border bg-white">
                {payments.map((p) => (
                  <li
                    key={p._id}
                    className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm"
                  >
                    <span>
                      {p.payerName} · {formatClp(p.amountClp)} · {p.status}
                    </span>
                    {p.status === "posted" && capabilities.financeCorrect ? (
                      <Button
                        size="sm"
                        variant="outline"
                        loading={voidingId === p._id}
                        onClick={async () => {
                          if (voidReason.trim().length < 5) {
                            push({ title: "Motivo mínimo 5 caracteres", tone: "warning" });
                            return;
                          }
                          setVoidingId(p._id);
                          try {
                            const res = await fetch(`/api/congress/payments/${p._id}/void`, {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ reason: voidReason.trim() }),
                            });
                            const data = await res.json().catch(() => ({}));
                            if (!res.ok || !data.ok) {
                              push({ title: data.error ?? "No se pudo anular", tone: "warning" });
                              return;
                            }
                            void loadPayments();
                            void loadRegistrations();
                            void loadSummary();
                          } finally {
                            setVoidingId(null);
                          }
                        }}
                      >
                        Anular
                      </Button>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </TabsContent>

        <TabsContent value="alojamiento">
          <LodgingOpsView
            homes={homes}
            assignments={assignments}
            registrations={registrations}
            churchRequestedBeds={summary?.lodging.requestedBeds ?? 0}
            operate={capabilities.operate}
            homeSaving={homeSaving}
            onCreateHome={createHome}
            onOpenParticipant={setSelectedId}
          />
        </TabsContent>

        <TabsContent value="reportes">
          <Section title="Exportar">
            <Button size="sm" variant="outline" onClick={exportCsv}>
              Descargar CSV de inscritos
            </Button>
          </Section>
        </TabsContent>

        <TabsContent value="historial">
          {auditLoading ? <LoadingState /> : null}
          <Timeline
            items={auditEntries.map((e) => ({
              id: e._id,
              title: e.action,
              description: `${e.entity}${e.entityId ? ` · ${e.entityId}` : ""}`,
              time: e.createdAt,
            }))}
          />
        </TabsContent>

        <TabsContent value="importacion">
          <Section
            title="Revisión Excel"
            description="Solo vista previa. La importación definitiva está fuera de alcance."
          >
            <Input
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => setImportFile(e.target.files?.[0] ?? null)}
            />
            <Button
              className="mt-3"
              size="sm"
              loading={importLoading}
              onClick={() => void runImportPreview()}
            >
              Previsualizar
            </Button>
            {importNote ? <p className="mt-3 text-sm text-muted">{importNote}</p> : null}
            <Button className="mt-3" size="sm" variant="outline" disabled>
              Confirmar importación (deshabilitado)
            </Button>
          </Section>
        </TabsContent>
      </Tabs>

      <NewParticipantDialog
        open={newOpen}
        onClose={() => setNewOpen(false)}
        zoneOptions={zoneOptions}
        churchesByZone={churchesByZone}
        registrations={registrations}
        saving={doorSaving}
        onSubmit={submitDoor}
        onOpenExisting={(id) => {
          setNewOpen(false);
          setSelectedId(id);
        }}
      />

      <ParticipantSheet
        open={Boolean(selectedId)}
        registration={selected}
        assignments={assignments}
        homes={homes}
        operate={capabilities.operate}
        canPay={capabilities.payments}
        onClose={() => setSelectedId(null)}
        onPatchAttendance={patchAttendance}
        onPatchRegistration={patchRegistration}
        onIndividualPayment={individualPayment}
        onAssignBed={assignBed}
        onAssignmentAction={assignmentAction}
        busy={sheetBusy}
      />
    </AdminModulePage>
  );
}
