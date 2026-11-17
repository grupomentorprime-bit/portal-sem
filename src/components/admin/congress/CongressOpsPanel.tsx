"use client";

import { useCallback, useMemo, useState } from "react";
import { useDeferredEffect } from "@/hooks/use-deferred-effect";
import {
  BedDouble,
  ClipboardList,
  CreditCard,
  Download,
  FileSpreadsheet,
  History,
  RefreshCw,
  UserPlus,
  Users,
} from "lucide-react";
import {
  AdminDataTable,
  AlertBanner,
  ContentGrid,
  EmptyState,
  KpiCard,
  LoadingState,
  SearchBar,
  Section,
  Timeline,
  type AdminDataTableColumn,
} from "@/components/admin/kit";
import { AdminModulePage } from "@/components/admin/kit/layout/AdminModulePage";
import { useToast } from "@/components/admin/kit/states/Toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CONGRESS_CONTRIBUTION_CLP } from "@/core/congress/constants";
import type { CongressAttendanceDay } from "@/core/congress/constants";
import type {
  CongressAuditEntry,
  CongressChurchLodgingRequest,
  CongressLodgingAssignment,
  CongressLodgingHome,
  CongressRegistration,
} from "@/core/congress/types";
import type { CongressImportPreview } from "@/core/congress/import-preview";
import { remainingBalanceClp } from "@/core/congress/charges";
import { cn } from "@/lib/utils";

const NIGHT_LABELS: Record<string, string> = {
  "2026-11-20": "Viernes 20",
  "2026-11-21": "Sábado 21",
};

function lodgingErrorMessage(error: string | undefined): string {
  switch (error) {
    case "capacity_full":
      return "Sin cupo disponible para esa noche en el hogar.";
    case "concurrent_capacity":
      return "Sin cupo (otra asignación tomó el último lugar).";
    case "already_assigned":
      return "El participante ya tiene cama activa esa noche.";
    case "home_not_found":
      return "Hogar no encontrado.";
    case "invalid_night":
      return "Noche inválida.";
    default:
      return error ?? "No se pudo completar la operación de alojamiento.";
  }
}

type TabId =
  | "resumen"
  | "inscritos"
  | "asistencia"
  | "aportes"
  | "alojamiento"
  | "reportes"
  | "historial"
  | "importacion";

interface AttendanceBucket {
  present: number;
  absent: number;
  unmarked: number;
}

interface CongressSummary {
  registrationsTotal: number;
  registrationsBySource: Record<string, number>;
  attendanceSaturday: AttendanceBucket;
  attendanceSunday: AttendanceBucket;
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
    unmetRequestBeds?: number;
  };
  churchLodgingRequests?: CongressChurchLodgingRequest[];
  lodgingHomes?: CongressLodgingHome[];
  lodgingAssignments?: CongressLodgingAssignment[];
}

interface AllocationDraft {
  registrationId: string;
  amountClp: string;
}

function formatClp(value: number): string {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("es-CL", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function attendanceLabel(value: boolean | null): string {
  if (value === true) return "Presente";
  if (value === false) return "Ausente";
  return "Sin marcar";
}

function sourceLabel(source: CongressRegistration["source"]): string {
  if (source === "form") return "Formulario";
  if (source === "import") return "Importación";
  return "Puerta";
}

interface AttendanceDayToggleProps {
  day: CongressAttendanceDay;
  value: boolean | null;
  disabled?: boolean;
  saving?: boolean;
  onChange: (day: CongressAttendanceDay, next: boolean | null) => void;
}

function AttendanceDayToggle({
  day,
  value,
  disabled,
  saving,
  onChange,
}: AttendanceDayToggleProps) {
  const options: { id: "yes" | "no" | "clear"; label: string; next: boolean | null }[] = [
    { id: "yes", label: "Sí", next: true },
    { id: "no", label: "No", next: false },
    { id: "clear", label: "—", next: null },
  ];

  return (
    <div className="inline-flex gap-0.5 rounded-md border border-border bg-background-soft p-0.5">
      {options.map((opt) => {
        const active =
          (opt.next === true && value === true) ||
          (opt.next === false && value === false) ||
          (opt.next === null && value === null);
        return (
          <button
            key={opt.id}
            type="button"
            disabled={disabled || saving}
            aria-label={`${day === "saturday" ? "Sábado" : "Domingo"}: ${opt.label}`}
            className={cn(
              "min-w-[2rem] rounded px-2 py-0.5 text-xs font-semibold transition",
              active
                ? "bg-primary text-text-inverse"
                : "text-muted hover:bg-background hover:text-foreground"
            )}
            onClick={() => onChange(day, opt.next)}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export function CongressOpsPanel() {
  const { push } = useToast();
  const [activeTab, setActiveTab] = useState<TabId>("resumen");
  const [summary, setSummary] = useState<CongressSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [apiStub, setApiStub] = useState(false);

  const [search, setSearch] = useState("");
  const [zoneFilter, setZoneFilter] = useState("");
  const [churchFilter, setChurchFilter] = useState("");
  const [registrations, setRegistrations] = useState<CongressRegistration[]>([]);
  const [zoneOptions, setZoneOptions] = useState<{ id: string; label: string }[]>([]);
  const [churchOptions, setChurchOptions] = useState<string[]>([]);
  const [registrationsLoading, setRegistrationsLoading] = useState(false);
  const [registrationsError, setRegistrationsError] = useState<string | null>(null);

  const [attendanceSaving, setAttendanceSaving] = useState<string | null>(null);

  const [auditEntries, setAuditEntries] = useState<CongressAuditEntry[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);

  const [doorSaving, setDoorSaving] = useState(false);
  const [doorForm, setDoorForm] = useState({
    fullName: "",
    rut: "",
    zoneId: "",
    churchName: "",
    phone: "",
    email: "",
  });

  const [paymentSaving, setPaymentSaving] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    payerType: "individual" as "individual" | "church" | "other",
    payerName: "",
    churchName: "",
    amountClp: "",
    receiptRef: "",
    note: "",
  });
  const [allocations, setAllocations] = useState<AllocationDraft[]>([
    { registrationId: "", amountClp: "" },
  ]);

  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<CongressImportPreview | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importStubNote, setImportStubNote] = useState<string | null>(null);
  const [importPlan, setImportPlan] = useState<{
    summary: {
      namedCount: number;
      createCount: number;
      linkCount: number;
      skipCount: number;
      gapCount: number;
    };
  } | null>(null);
  const [importConfirmChecked, setImportConfirmChecked] = useState(false);
  const [capabilities, setCapabilities] = useState({
    view: true,
    operate: false,
    payments: false,
    financeCorrect: false,
    import: false,
  });
  const [payments, setPayments] = useState<
    Array<{
      _id: string;
      payerName: string;
      amountClp: number;
      unallocatedClp: number;
      status: string;
      voidReason?: string | null;
      createdAt: string;
    }>
  >([]);
  const [voidReason, setVoidReason] = useState("");
  const [voidingId, setVoidingId] = useState<string | null>(null);
  const [homeForm, setHomeForm] = useState({
    name: "",
    contactName: "",
    contactPhone: "",
    address: "",
    capFri: "0",
    capSat: "0",
  });
  const [homeSaving, setHomeSaving] = useState(false);
  const [assignForm, setAssignForm] = useState({
    homeId: "",
    registrationId: "",
    night: "2026-11-20",
  });
  const [assignSaving, setAssignSaving] = useState(false);
  const [assignmentBusyId, setAssignmentBusyId] = useState<string | null>(null);
  const [reassignDrafts, setReassignDrafts] = useState<
    Record<string, { homeId: string; night: string }>
  >({});
  const [rutDrafts, setRutDrafts] = useState<Record<string, string>>({});

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
      setApiStub(Boolean(data.stub));
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
      const params = new URLSearchParams();
      if (search.trim()) params.set("q", search.trim());
      if (zoneFilter) params.set("zone", zoneFilter);
      if (churchFilter) params.set("church", churchFilter);
      const qs = params.toString();
      const res = await fetch(`/api/congress/registrations${qs ? `?${qs}` : ""}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setRegistrationsError(data.error ?? "No se pudieron cargar los inscritos.");
        setRegistrations([]);
        return;
      }
      setRegistrations(data.registrations ?? data.items ?? []);
      setZoneOptions(data.filterOptions?.zones ?? []);
      setChurchOptions(data.filterOptions?.churches ?? []);
      if (data.stub) setApiStub(true);
    } catch {
      setRegistrationsError("Error de red al cargar inscritos.");
    } finally {
      setRegistrationsLoading(false);
    }
  }, [churchFilter, search, zoneFilter]);

  const loadAudit = useCallback(async () => {
    setAuditLoading(true);
    setAuditError(null);
    try {
      const res = await fetch("/api/congress/audit");
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setAuditError(data.error ?? "No se pudo cargar el historial.");
        setAuditEntries([]);
        return;
      }
      setAuditEntries(data.entries ?? data.items ?? []);
      if (data.stub) setApiStub(true);
    } catch {
      setAuditError("Error de red al cargar el historial.");
    } finally {
      setAuditLoading(false);
    }
  }, []);

  const loadCapabilities = useCallback(async () => {
    try {
      const res = await fetch("/api/congress/capabilities");
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok && data.capabilities) {
        setCapabilities(data.capabilities);
      }
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

  useDeferredEffect(() => {
    void loadSummary();
    void loadCapabilities();
  }, [loadSummary, loadCapabilities]);

  useDeferredEffect(() => {
    if (
      activeTab === "inscritos" ||
      activeTab === "asistencia" ||
      activeTab === "aportes" ||
      activeTab === "alojamiento"
    ) {
      void loadRegistrations();
    }
  }, [activeTab, loadRegistrations]);

  useDeferredEffect(() => {
    if (activeTab === "historial") {
      void loadAudit();
    }
    if (activeTab === "aportes") {
      void loadPayments();
    }
  }, [activeTab, loadAudit, loadPayments]);

  const handleRefresh = () => {
    void loadSummary();
    void loadCapabilities();
    if (activeTab === "historial") void loadAudit();
    if (activeTab === "aportes") void loadPayments();
    if (
      activeTab === "inscritos" ||
      activeTab === "asistencia" ||
      activeTab === "aportes" ||
      activeTab === "alojamiento"
    ) {
      void loadRegistrations();
    }
  };

  const patchAttendance = async (
    registrationId: string,
    day: CongressAttendanceDay,
    present: boolean | null
  ) => {
    setAttendanceSaving(`${registrationId}:${day}`);
    try {
      const res = await fetch(
        `/api/congress/registrations/${encodeURIComponent(registrationId)}/attendance`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ day, present }),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        push({
          title: "Asistencia no guardada",
          description: data.error ?? "El servidor aún no implementa esta operación.",
          tone: "warning",
        });
        return;
      }
      setRegistrations((prev) =>
        prev.map((row) =>
          row._id === registrationId
            ? { ...row, attendance: { ...row.attendance, [day]: present } }
            : row
        )
      );
      push({ title: "Asistencia actualizada", tone: "success" });
    } catch {
      push({ title: "Error de red", tone: "error" });
    } finally {
      setAttendanceSaving(null);
    }
  };

  const submitDoorEnrollment = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!doorForm.fullName.trim() || !doorForm.zoneId.trim() || !doorForm.churchName.trim()) {
      push({
        title: "Datos incompletos",
        description: "Nombre, zona e iglesia son obligatorios.",
        tone: "warning",
      });
      return;
    }
    setDoorSaving(true);
    try {
      const body = {
        fullName: doorForm.fullName.trim(),
        rut: doorForm.rut.trim() || undefined,
        zoneId: doorForm.zoneId.trim(),
        churchName: doorForm.churchName.trim(),
        phone: doorForm.phone.trim() || undefined,
        email: doorForm.email.trim() || undefined,
      };
      const res = await fetch("/api/congress/registrations/door", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        push({
          title: "Inscripción en puerta no registrada",
          description: data.error ?? "Operación pendiente en el servidor.",
          tone: "warning",
        });
        return;
      }
      push({ title: "Inscrito en puerta", tone: "success" });
      setDoorForm({
        fullName: "",
        rut: "",
        zoneId: "",
        churchName: "",
        phone: "",
        email: "",
      });
      void loadRegistrations();
      void loadSummary();
    } catch {
      push({ title: "Error de red", tone: "error" });
    } finally {
      setDoorSaving(false);
    }
  };

  const submitPayment = async (event: React.FormEvent) => {
    event.preventDefault();
    const amount = Number(paymentForm.amountClp.replace(/\D/g, ""));
    if (!paymentForm.payerName.trim() || !amount) {
      push({
        title: "Pago incompleto",
        description: "Indique pagador y monto.",
        tone: "warning",
      });
      return;
    }
    const allocationRows = allocations
      .filter((row) => row.registrationId && row.amountClp)
      .map((row) => ({
        registrationId: row.registrationId,
        amountClp: Number(row.amountClp.replace(/\D/g, "")),
      }))
      .filter((row) => row.amountClp > 0);

    setPaymentSaving(true);
    try {
      const res = await fetch("/api/congress/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payerType: paymentForm.payerType,
          payerName: paymentForm.payerName.trim(),
          churchName:
            paymentForm.payerType === "church"
              ? paymentForm.churchName.trim() || undefined
              : undefined,
          amountClp: amount,
          receiptRef: paymentForm.receiptRef.trim() || undefined,
          note: paymentForm.note.trim() || undefined,
          allocations: allocationRows,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        push({
          title: "Pago no registrado",
          description: data.error ?? "Operación pendiente en el servidor.",
          tone: "warning",
        });
        return;
      }
      push({ title: "Pago registrado", tone: "success" });
      setPaymentForm({
        payerType: "individual",
        payerName: "",
        churchName: "",
        amountClp: "",
        receiptRef: "",
        note: "",
      });
      setAllocations([{ registrationId: "", amountClp: "" }]);
      void loadSummary();
    } catch {
      push({ title: "Error de red", tone: "error" });
    } finally {
      setPaymentSaving(false);
    }
  };

  const runImportPreview = async () => {
    if (!importFile) {
      push({ title: "Seleccione un archivo Excel", tone: "warning" });
      return;
    }
    setImportLoading(true);
    setImportError(null);
    setImportStubNote(null);
    setImportPreview(null);
    try {
      const form = new FormData();
      form.set("file", importFile);
      const res = await fetch("/api/congress/import/preview", {
        method: "POST",
        body: form,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setImportError(data.error ?? "No se pudo generar la vista previa.");
        return;
      }
      setImportPreview(data.preview ?? null);
      setImportPlan(null);
      setImportConfirmChecked(false);
      if (data.message) setImportStubNote(data.message);
      if (data.stub) setApiStub(true);
    } catch {
      setImportError("Error de red al previsualizar.");
    } finally {
      setImportLoading(false);
    }
  };

  const runImportPrepare = async () => {
    if (!importFile) {
      push({ title: "Seleccione el mismo Excel", tone: "warning" });
      return;
    }
    setImportLoading(true);
    setImportError(null);
    try {
      const form = new FormData();
      form.set("file", importFile);
      const res = await fetch("/api/congress/import/prepare-commit", {
        method: "POST",
        body: form,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setImportError(data.error ?? "No se pudo preparar el plan.");
        return;
      }
      setImportPlan(data.plan ?? null);
      if (data.preview?.summary) {
        setImportPreview((prev) => prev ?? data.preview);
      }
      push({ title: "Plan de importación listo (sin escribir)", tone: "success" });
      void loadAudit();
    } catch {
      setImportError("Error de red al preparar el plan.");
    } finally {
      setImportLoading(false);
    }
  };

  const voidPaymentRow = async (paymentId: string) => {
    if (!capabilities.financeCorrect) {
      push({ title: "Sin permiso de corrección financiera", tone: "warning" });
      return;
    }
    if (voidReason.trim().length < 5) {
      push({ title: "Indique un motivo (mín. 5 caracteres)", tone: "warning" });
      return;
    }
    setVoidingId(paymentId);
    try {
      const res = await fetch(`/api/congress/payments/${paymentId}/void`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: voidReason.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        push({ title: data.error ?? "No se pudo anular", tone: "danger" });
        return;
      }
      push({
        title:
          "Pago anulado: pagado vuelve a $0 y pendiente al cargo; movimiento y historial conservados",
        tone: "success",
      });
      setVoidReason("");
      void loadPayments();
      void loadRegistrations();
      void loadAudit();
      void loadSummary();
    } finally {
      setVoidingId(null);
    }
  };

  const submitHome = async (event: React.FormEvent) => {
    event.preventDefault();
    setHomeSaving(true);
    try {
      const res = await fetch("/api/congress/lodging/homes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: homeForm.name,
          contactName: homeForm.contactName,
          contactPhone: homeForm.contactPhone,
          address: homeForm.address,
          capacityByNight: {
            "2026-11-20": Number(homeForm.capFri) || 0,
            "2026-11-21": Number(homeForm.capSat) || 0,
          },
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        push({ title: data.error ?? "No se pudo crear el hogar", tone: "danger" });
        return;
      }
      push({ title: "Hogar registrado", tone: "success" });
      setHomeForm({
        name: "",
        contactName: "",
        contactPhone: "",
        address: "",
        capFri: "0",
        capSat: "0",
      });
      void loadSummary();
    } finally {
      setHomeSaving(false);
    }
  };

  const submitAssign = async (event: React.FormEvent) => {
    event.preventDefault();
    setAssignSaving(true);
    try {
      const res = await fetch("/api/congress/lodging/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(assignForm),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        push({ title: lodgingErrorMessage(data.error), tone: "danger" });
        return;
      }
      push({ title: "Cama asignada", tone: "success" });
      void loadSummary();
      void loadAudit();
    } finally {
      setAssignSaving(false);
    }
  };

  const patchAssignmentStatus = async (
    assignmentId: string,
    action: "confirm" | "cancel"
  ) => {
    setAssignmentBusyId(assignmentId);
    try {
      const res = await fetch(`/api/congress/lodging/assignments/${assignmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        push({ title: data.error ?? "No se pudo actualizar la asignación", tone: "danger" });
        return;
      }
      push({
        title: action === "confirm" ? "Asignación confirmada" : "Asignación cancelada",
        tone: "success",
      });
      void loadSummary();
      void loadAudit();
    } finally {
      setAssignmentBusyId(null);
    }
  };

  const reassignAssignment = async (assignmentId: string) => {
    const draft = reassignDrafts[assignmentId];
    if (!draft?.homeId) {
      push({ title: "Elija el hogar destino para reasignar", tone: "warning" });
      return;
    }
    setAssignmentBusyId(assignmentId);
    try {
      const res = await fetch(
        `/api/congress/lodging/assignments/${assignmentId}/reassign`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            homeId: draft.homeId,
            night: draft.night || undefined,
          }),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        push({ title: lodgingErrorMessage(data.error), tone: "danger" });
        return;
      }
      push({ title: "Cama reasignada", tone: "success" });
      setReassignDrafts((prev) => {
        const next = { ...prev };
        delete next[assignmentId];
        return next;
      });
      void loadSummary();
      void loadAudit();
    } finally {
      setAssignmentBusyId(null);
    }
  };

  const attachRut = async (registrationId: string) => {
    const rut = rutDrafts[registrationId]?.trim() ?? "";
    if (!rut) {
      push({ title: "Ingrese RUT", tone: "warning" });
      return;
    }
    const res = await fetch(`/api/congress/registrations/${registrationId}/identity`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rut }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) {
      push({ title: data.error ?? "No se pudo incorporar el RUT", tone: "danger" });
      return;
    }
    push({ title: "RUT incorporado sin duplicar ficha", tone: "success" });
    setRutDrafts((prev) => ({ ...prev, [registrationId]: "" }));
    void loadRegistrations();
    void loadAudit();
  };

  const registrationColumns: AdminDataTableColumn<CongressRegistration>[] = useMemo(
    () => [
      {
        id: "name",
        header: "Participante",
        cell: (row) => (
          <div>
            <p className="font-medium text-foreground">{row.identity.fullName}</p>
            <p className="text-xs text-muted">
              {[row.identity.rut, row.identity.phone, row.identity.email]
                .filter(Boolean)
                .join(" · ") || "—"}
            </p>
          </div>
        ),
      },
      {
        id: "church",
        header: "Zona / Iglesia",
        cell: (row) => (
          <div className="text-sm">
            <p>{row.zoneId}</p>
            <p className="text-muted">{row.churchName}</p>
          </div>
        ),
      },
      {
        id: "source",
        header: "Origen",
        cell: (row) => sourceLabel(row.source),
      },
      {
        id: "balance",
        header: "Cargo / Pagado / Pendiente",
        cell: (row) => {
          if (row.chargeAmountClp == null) return "—";
          const pending = remainingBalanceClp(row);
          return (
            <div className="text-sm">
              <p>Cargo {formatClp(row.chargeAmountClp)}</p>
              <p className="text-muted">Pagado {formatClp(row.allocatedPaidClp)}</p>
              <p className={pending > 0 ? "text-amber-700" : "text-muted"}>
                Pendiente {formatClp(pending)}
              </p>
            </div>
          );
        },
      },
      {
        id: "rut",
        header: "RUT",
        cell: (row) =>
          row.identity.rut ? (
            row.identity.rut
          ) : (
            <div className="flex min-w-[10rem] gap-1">
              <Input
                className="h-8"
                value={rutDrafts[row._id] ?? ""}
                onChange={(e) =>
                  setRutDrafts((prev) => ({ ...prev, [row._id]: e.target.value }))
                }
                placeholder="Incorporar RUT"
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={!capabilities.operate}
                onClick={() => void attachRut(row._id)}
              >
                OK
              </Button>
            </div>
          ),
      },
    ],
    [capabilities.operate, rutDrafts]
  );

  const attendanceColumns: AdminDataTableColumn<CongressRegistration>[] = useMemo(
    () => [
      ...registrationColumns.slice(0, 2),
      {
        id: "saturday",
        header: "Sábado",
        cell: (row) => (
          <AttendanceDayToggle
            day="saturday"
            value={row.attendance.saturday}
            saving={attendanceSaving === `${row._id}:saturday`}
            onChange={(_, next) => void patchAttendance(row._id, "saturday", next)}
          />
        ),
      },
      {
        id: "sunday",
        header: "Domingo",
        cell: (row) => (
          <AttendanceDayToggle
            day="sunday"
            value={row.attendance.sunday}
            saving={attendanceSaving === `${row._id}:sunday`}
            onChange={(_, next) => void patchAttendance(row._id, "sunday", next)}
          />
        ),
      },
      {
        id: "status",
        header: "Estado",
        cell: (row) => (
          <span className="text-xs text-muted">
            Sáb: {attendanceLabel(row.attendance.saturday)} · Dom:{" "}
            {attendanceLabel(row.attendance.sunday)}
          </span>
        ),
      },
    ],
    [attendanceSaving, registrationColumns]
  );

  type LodgingRequestRow = {
    key: string;
    zoneId: string;
    churchName: string;
    requestedBeds: number;
    note: string | null;
  };

  const churchRequests: LodgingRequestRow[] = useMemo(() => {
    const fromSummary = summary?.churchLodgingRequests ?? [];
    if (fromSummary.length > 0) {
      return fromSummary.map((row) => ({
        key: row._id,
        zoneId: row.zoneId,
        churchName: row.churchName,
        requestedBeds: row.requestedBeds,
        note: row.note ?? null,
      }));
    }
    const fromPreview = importPreview?.churchLodgingRequests ?? [];
    return fromPreview.map((row) => ({
      key: `${row.zoneId}:${row.churchName}`,
      zoneId: row.zoneId,
      churchName: row.churchName,
      requestedBeds: row.requestedBeds,
      note: row.note,
    }));
  }, [importPreview?.churchLodgingRequests, summary?.churchLodgingRequests]);

  const filterBar = (
    <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end">
      <SearchBar
        className="w-full max-w-none flex-1"
        placeholder="Buscar por nombre, RUT, teléfono o correo…"
        value={search}
        onChange={setSearch}
      />
      <Select
        className="min-w-[10rem]"
        label="Zona"
        value={zoneFilter}
        onChange={(event) => setZoneFilter(event.target.value)}
        options={[
          { value: "", label: "Todas las zonas" },
          ...zoneOptions.map((zone) => ({
            value: zone.id,
            label: zone.label || zone.id,
          })),
        ]}
      />
      <Select
        className="min-w-[10rem]"
        label="Iglesia"
        value={churchFilter}
        onChange={(event) => setChurchFilter(event.target.value)}
        options={[
          { value: "", label: "Todas las iglesias" },
          ...churchOptions.map((church) => ({ value: church, label: church })),
        ]}
      />
      <Button variant="outline" size="sm" onClick={() => void loadRegistrations()}>
        Aplicar filtros
      </Button>
    </div>
  );

  return (
    <AdminModulePage
      breadcrumbs={[
        { label: "Inicio", href: "/admin" },
        { label: "Sitio web", href: "/admin/site/pages" },
        { label: "Formularios", href: "/admin/portal/forms" },
        { label: "Operación", href: "/admin/portal/forms/panel" },
        { label: "Congreso de Varones" },
      ]}
      title="3.° Congreso Nacional de Varones 2026"
      description="Administración operativa desde Formularios → Operación: inscripciones, asistencia, aportes, alojamiento e importación (solo revisión)."
      actions={
        <Button variant="outline" size="sm" onClick={handleRefresh}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Actualizar
        </Button>
      }
    >
      {apiStub ? (
        <AlertBanner variant="info" className="mb-4">
          Algunas respuestas provienen de APIs provisionales. Las acciones de escritura pueden
          mostrar avisos hasta que el backend esté completo.
        </AlertBanner>
      ) : null}

      <Tabs
        defaultValue="resumen"
        onChange={(value) => setActiveTab(value as TabId)}
        className="w-full"
      >
        <TabsList className="mb-2 flex h-auto w-full flex-wrap justify-start gap-1">
          <TabsTrigger value="resumen">Resumen</TabsTrigger>
          <TabsTrigger value="inscritos">Inscritos</TabsTrigger>
          <TabsTrigger value="asistencia">Asistencia</TabsTrigger>
          <TabsTrigger value="aportes">Aportes y pagos</TabsTrigger>
          <TabsTrigger value="alojamiento">Alojamiento</TabsTrigger>
          <TabsTrigger value="reportes">Reportes</TabsTrigger>
          <TabsTrigger value="historial">Historial</TabsTrigger>
          <TabsTrigger value="importacion">Importación</TabsTrigger>
        </TabsList>

        <TabsContent value="resumen">
          {summaryLoading ? <LoadingState variant="cards" /> : null}
          {summaryError ? (
            <AlertBanner variant="warning">{summaryError}</AlertBanner>
          ) : null}
          {!summaryLoading && !summaryError && summary ? (
            <>
              <ContentGrid cols={4} className="mb-6">
                <KpiCard
                  label="Inscritos"
                  value={summary.registrationsTotal}
                  icon={<Users className="h-4 w-4" />}
                />
                <KpiCard
                  label="Asistencia sábado"
                  value={summary.attendanceSaturday.present}
                  accent="info"
                  icon={<ClipboardList className="h-4 w-4" />}
                />
                <KpiCard
                  label="Asistencia domingo"
                  value={summary.attendanceSunday.present}
                  accent="info"
                />
                <KpiCard
                  label="Saldo pendiente"
                  value={formatClp(summary.balances.totalOutstandingClp)}
                  accent={
                    summary.balances.totalOutstandingClp > 0 ? "warning" : "success"
                  }
                />
              </ContentGrid>
              <ContentGrid cols={3} className="mb-6">
                <KpiCard
                  label="Aporte por persona"
                  value={formatClp(CONGRESS_CONTRIBUTION_CLP)}
                />
                <KpiCard
                  label="Alojamiento solicitado"
                  value={summary.lodging.requestedBeds}
                  icon={<BedDouble className="h-4 w-4" />}
                />
                <KpiCard
                  label="Camas asignadas"
                  value={summary.lodging.assignedBeds}
                  accent={
                    summary.lodging.assignedBeds < summary.lodging.requestedBeds
                      ? "warning"
                      : "success"
                  }
                />
              </ContentGrid>
              <Section title="Origen de inscripciones">
                <div className="flex flex-wrap gap-3 text-sm">
                  <span>Formulario: {summary.registrationsBySource.form ?? 0}</span>
                  <span>Importación: {summary.registrationsBySource.import ?? 0}</span>
                  <span>Puerta: {summary.registrationsBySource.door ?? 0}</span>
                  <span className="text-muted">
                    Por revisar: {summary.balances.needsReviewCount}
                  </span>
                </div>
              </Section>
            </>
          ) : null}
        </TabsContent>

        <TabsContent value="inscritos">
          {filterBar}
          {registrationsError ? (
            <AlertBanner variant="warning">{registrationsError}</AlertBanner>
          ) : null}
          <AdminDataTable
            columns={registrationColumns}
            data={registrations}
            rowKey={(row) => row._id}
            loading={registrationsLoading}
            emptyTitle="Sin inscritos"
            emptyDescription="Ajuste los filtros o registre participantes en puerta."
            tableMinWidth="min-w-[52rem]"
          />

          <Section
            title="Inscripción en puerta"
            description="Alta rápida el día del evento. No reemplaza el formulario público."
            className="mt-8"
          >
            <form
              onSubmit={submitDoorEnrollment}
              className="grid gap-3 md:grid-cols-2 lg:grid-cols-3"
            >
              <Input
                label="Nombre completo"
                value={doorForm.fullName}
                onChange={(e) => setDoorForm((f) => ({ ...f, fullName: e.target.value }))}
                required
              />
              <Input
                label="RUT (opcional)"
                value={doorForm.rut}
                onChange={(e) => setDoorForm((f) => ({ ...f, rut: e.target.value }))}
              />
              <Input
                label="Zona (ID)"
                value={doorForm.zoneId}
                onChange={(e) => setDoorForm((f) => ({ ...f, zoneId: e.target.value }))}
                required
              />
              <Input
                label="Iglesia"
                value={doorForm.churchName}
                onChange={(e) => setDoorForm((f) => ({ ...f, churchName: e.target.value }))}
                required
              />
              <Input
                label="Teléfono"
                value={doorForm.phone}
                onChange={(e) => setDoorForm((f) => ({ ...f, phone: e.target.value }))}
              />
              <Input
                label="Correo"
                type="email"
                value={doorForm.email}
                onChange={(e) => setDoorForm((f) => ({ ...f, email: e.target.value }))}
              />
              <div className="md:col-span-2 lg:col-span-3">
                <Button type="submit" size="sm" loading={doorSaving}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Registrar en puerta
                </Button>
              </div>
            </form>
          </Section>
        </TabsContent>

        <TabsContent value="asistencia">
          {filterBar}
          {registrationsError ? (
            <AlertBanner variant="warning">{registrationsError}</AlertBanner>
          ) : null}
          <AdminDataTable
            columns={attendanceColumns}
            data={registrations}
            rowKey={(row) => row._id}
            loading={registrationsLoading}
            emptyTitle="Sin participantes para marcar"
            emptyDescription="Los cambios se guardan sin salir de esta vista."
            tableMinWidth="min-w-[56rem]"
          />
        </TabsContent>

        <TabsContent value="aportes">
          <Section
            title="Registrar pago"
            description={`Aporte referencial por persona identificada: ${formatClp(CONGRESS_CONTRIBUTION_CLP)}.`}
          >
            <form onSubmit={submitPayment} className="grid max-w-3xl gap-3">
              <Select
                label="Tipo de pagador"
                value={paymentForm.payerType}
                onChange={(e) =>
                  setPaymentForm((f) => ({
                    ...f,
                    payerType: e.target.value as typeof f.payerType,
                  }))
                }
                options={[
                  { value: "individual", label: "Persona" },
                  { value: "church", label: "Iglesia / grupo" },
                  { value: "other", label: "Otro" },
                ]}
              />
              <Input
                label="Nombre del pagador"
                value={paymentForm.payerName}
                onChange={(e) => setPaymentForm((f) => ({ ...f, payerName: e.target.value }))}
                required
              />
              {paymentForm.payerType === "church" ? (
                <Input
                  label="Iglesia asociada"
                  value={paymentForm.churchName}
                  onChange={(e) =>
                    setPaymentForm((f) => ({ ...f, churchName: e.target.value }))
                  }
                />
              ) : null}
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  label="Monto (CLP)"
                  inputMode="numeric"
                  value={paymentForm.amountClp}
                  onChange={(e) =>
                    setPaymentForm((f) => ({ ...f, amountClp: e.target.value }))
                  }
                  required
                />
                <Input
                  label="Referencia comprobante"
                  value={paymentForm.receiptRef}
                  onChange={(e) =>
                    setPaymentForm((f) => ({ ...f, receiptRef: e.target.value }))
                  }
                />
              </div>
              <Input
                label="Nota interna"
                value={paymentForm.note}
                onChange={(e) => setPaymentForm((f) => ({ ...f, note: e.target.value }))}
              />

              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Imputaciones a participantes</p>
                {allocations.map((row, index) => (
                  <div key={`alloc-${index}`} className="flex flex-wrap gap-2">
                    <Select
                      className="min-w-[12rem] flex-1"
                      value={row.registrationId}
                      onChange={(e) =>
                        setAllocations((prev) =>
                          prev.map((item, i) =>
                            i === index
                              ? { ...item, registrationId: e.target.value }
                              : item
                          )
                        )
                      }
                      options={[
                        { value: "", label: "Seleccionar inscrito…" },
                        ...registrations.map((reg) => ({
                          value: reg._id,
                          label: `${reg.identity.fullName} · ${reg.churchName}`,
                        })),
                      ]}
                    />
                    <Input
                      className="w-32"
                      placeholder="Monto"
                      inputMode="numeric"
                      value={row.amountClp}
                      onChange={(e) =>
                        setAllocations((prev) =>
                          prev.map((item, i) =>
                            i === index ? { ...item, amountClp: e.target.value } : item
                          )
                        )
                      }
                    />
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setAllocations((prev) => [...prev, { registrationId: "", amountClp: "" }])
                  }
                >
                  Agregar imputación
                </Button>
              </div>

              <div>
                <Button type="submit" size="sm" loading={paymentSaving}>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Guardar pago
                </Button>
              </div>
            </form>
          </Section>

          <Section title="Pagos registrados" className="mt-8">
            {capabilities.financeCorrect ? (
              <Input
                className="mb-3 max-w-md"
                label="Motivo de anulación (obligatorio)"
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
                placeholder="Ej. comprobante duplicado"
              />
            ) : (
              <p className="mb-3 text-sm text-muted">
                Las anulaciones requieren permiso congress.finance.correct.
              </p>
            )}
            <AdminDataTable
              columns={[
                {
                  id: "payer",
                  header: "Pagador",
                  cell: (row) => row.payerName,
                },
                {
                  id: "amount",
                  header: "Monto",
                  cell: (row) => formatClp(row.amountClp),
                },
                {
                  id: "unalloc",
                  header: "Sin imputar",
                  cell: (row) => formatClp(row.unallocatedClp),
                },
                {
                  id: "status",
                  header: "Estado",
                  cell: (row) =>
                    row.status === "voided"
                      ? `Anulado${row.voidReason ? `: ${row.voidReason}` : ""}`
                      : "Vigente",
                },
                {
                  id: "actions",
                  header: "",
                  cell: (row) =>
                    row.status === "posted" && capabilities.financeCorrect ? (
                      <Button
                        size="sm"
                        variant="outline"
                        loading={voidingId === row._id}
                        onClick={() => void voidPaymentRow(row._id)}
                      >
                        Anular
                      </Button>
                    ) : (
                      "—"
                    ),
                },
              ]}
              data={payments}
              rowKey={(row) => row._id}
              emptyTitle="Sin pagos"
            />
          </Section>

          <Section title="Saldos por participante" className="mt-8">
            {filterBar}
            <AdminDataTable
              columns={registrationColumns}
              data={registrations}
              rowKey={(row) => row._id}
              loading={registrationsLoading}
              emptyTitle="Sin datos de saldo"
            />
          </Section>
        </TabsContent>

        <TabsContent value="alojamiento">
          <AlertBanner variant="info" className="mb-4">
            Las cantidades del Excel representan <strong>solicitudes de alojamiento por iglesia</strong>,
            no camas confirmadas. La asignación individual no suma esas solicitudes como ocupadas.
          </AlertBanner>
          <ContentGrid cols={4} className="mb-6">
            <KpiCard
              label="Camas solicitadas"
              value={summary?.lodging.requestedBeds ?? 0}
              icon={<BedDouble className="h-4 w-4" />}
            />
            <KpiCard label="Camas asignadas" value={summary?.lodging.assignedBeds ?? 0} />
            <KpiCard
              label="Demanda sin cubrir"
              value={(summary?.lodging as { unmetRequestBeds?: number } | undefined)?.unmetRequestBeds ?? 0}
            />
            <KpiCard label="Hogares" value={summary?.lodging.homesCount ?? 0} />
          </ContentGrid>

          <Section title="Solicitudes por iglesia">
            {churchRequests.length === 0 ? (
              <EmptyState
                title="Sin solicitudes cargadas"
                description="Importe el Excel en la pestaña Importación (solo vista previa) o espere datos del servidor."
              />
            ) : (
              <AdminDataTable
                columns={[
                  {
                    id: "zone",
                    header: "Zona",
                    cell: (row: LodgingRequestRow) => row.zoneId,
                  },
                  {
                    id: "church",
                    header: "Iglesia",
                    cell: (row) => row.churchName,
                  },
                  {
                    id: "beds",
                    header: "Solicitadas",
                    cell: (row) => row.requestedBeds,
                  },
                  {
                    id: "note",
                    header: "Nota",
                    cell: (row) => row.note ?? "—",
                  },
                ]}
                data={churchRequests}
                rowKey={(row) => row.key}
                emptyTitle="Sin solicitudes"
              />
            )}
          </Section>

          <Section
            title="Registrar hogar anfitrión"
            description="Cupos por noche: viernes 20 y sábado 21."
            className="mt-8"
          >
            <form onSubmit={submitHome} className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              <Input
                label="Nombre del hogar"
                value={homeForm.name}
                onChange={(e) => setHomeForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
              <Input
                label="Contacto"
                value={homeForm.contactName}
                onChange={(e) => setHomeForm((f) => ({ ...f, contactName: e.target.value }))}
              />
              <Input
                label="Teléfono"
                value={homeForm.contactPhone}
                onChange={(e) => setHomeForm((f) => ({ ...f, contactPhone: e.target.value }))}
              />
              <Input
                label="Dirección"
                value={homeForm.address}
                onChange={(e) => setHomeForm((f) => ({ ...f, address: e.target.value }))}
              />
              <Input
                label="Cupos vie 20"
                inputMode="numeric"
                value={homeForm.capFri}
                onChange={(e) => setHomeForm((f) => ({ ...f, capFri: e.target.value }))}
              />
              <Input
                label="Cupos sáb 21"
                inputMode="numeric"
                value={homeForm.capSat}
                onChange={(e) => setHomeForm((f) => ({ ...f, capSat: e.target.value }))}
              />
              <div className="md:col-span-2 lg:col-span-3">
                <Button type="submit" size="sm" loading={homeSaving} disabled={!capabilities.operate}>
                  Guardar hogar
                </Button>
              </div>
            </form>
          </Section>

          <Section
            title="Hogares y disponibilidad por noche"
            description="Disponible = cupo − camas activas (asignadas o confirmadas)."
            className="mt-8"
          >
            <AdminDataTable
              columns={[
                { id: "name", header: "Hogar", cell: (row: CongressLodgingHome) => row.name },
                {
                  id: "contact",
                  header: "Contacto",
                  cell: (row) =>
                    [row.contactName, row.contactPhone].filter(Boolean).join(" · ") || "—",
                },
                {
                  id: "address",
                  header: "Dirección",
                  cell: (row) => row.address ?? "—",
                },
                {
                  id: "availFri",
                  header: "Vie 20 (disp/cupo)",
                  cell: (row) => {
                    const night = "2026-11-20";
                    const cap = row.capacityByNight[night] ?? 0;
                    const occupied = (summary?.lodgingAssignments ?? []).filter(
                      (a) => a.homeId === row._id && a.night === night
                    ).length;
                    const free = Math.max(0, cap - occupied);
                    return (
                      <span className={free === 0 && cap > 0 ? "text-amber-700" : undefined}>
                        {free}/{cap}
                      </span>
                    );
                  },
                },
                {
                  id: "availSat",
                  header: "Sáb 21 (disp/cupo)",
                  cell: (row) => {
                    const night = "2026-11-21";
                    const cap = row.capacityByNight[night] ?? 0;
                    const occupied = (summary?.lodgingAssignments ?? []).filter(
                      (a) => a.homeId === row._id && a.night === night
                    ).length;
                    const free = Math.max(0, cap - occupied);
                    return (
                      <span className={free === 0 && cap > 0 ? "text-amber-700" : undefined}>
                        {free}/{cap}
                      </span>
                    );
                  },
                },
              ]}
              data={summary?.lodgingHomes ?? []}
              rowKey={(row) => row._id}
              emptyTitle="Sin hogares"
            />
          </Section>

          <Section title="Asignar cama" className="mt-8">
            <form onSubmit={submitAssign} className="grid gap-3 md:grid-cols-3">
              <Select
                label="Hogar"
                value={assignForm.homeId}
                onChange={(e) => setAssignForm((f) => ({ ...f, homeId: e.target.value }))}
                options={[
                  { value: "", label: "Seleccionar…" },
                  ...(summary?.lodgingHomes ?? []).map((h) => {
                    const night = assignForm.night;
                    const cap = h.capacityByNight[night as "2026-11-20" | "2026-11-21"] ?? 0;
                    const occupied = (summary?.lodgingAssignments ?? []).filter(
                      (a) => a.homeId === h._id && a.night === night
                    ).length;
                    const free = Math.max(0, cap - occupied);
                    return {
                      value: h._id,
                      label: `${h.name} · ${NIGHT_LABELS[night] ?? night}: ${free}/${cap} disp.`,
                    };
                  }),
                ]}
              />
              <Select
                label="Participante"
                value={assignForm.registrationId}
                onChange={(e) =>
                  setAssignForm((f) => ({ ...f, registrationId: e.target.value }))
                }
                options={[
                  { value: "", label: "Seleccionar…" },
                  ...registrations.map((r) => ({
                    value: r._id,
                    label: r.identity.fullName,
                  })),
                ]}
              />
              <Select
                label="Noche"
                value={assignForm.night}
                onChange={(e) => setAssignForm((f) => ({ ...f, night: e.target.value }))}
                options={[
                  { value: "2026-11-20", label: "Viernes 20" },
                  { value: "2026-11-21", label: "Sábado 21" },
                ]}
              />
              <div className="md:col-span-3">
                <Button type="submit" size="sm" loading={assignSaving} disabled={!capabilities.operate}>
                  Asignar
                </Button>
              </div>
            </form>
          </Section>

          <Section
            title="Asignaciones activas"
            description="Confirmar, cancelar o reasignar desde cada fila. Reasignar exige cupo libre en el destino."
            className="mt-8"
          >
            <AdminDataTable
              columns={[
                {
                  id: "participant",
                  header: "Participante",
                  cell: (row: CongressLodgingAssignment) => {
                    const reg = registrations.find((r) => r._id === row.registrationId);
                    return reg?.identity.fullName ?? row.registrationId;
                  },
                },
                {
                  id: "home",
                  header: "Hogar",
                  cell: (row) =>
                    summary?.lodgingHomes?.find((h) => h._id === row.homeId)?.name ??
                    row.homeId,
                },
                {
                  id: "night",
                  header: "Noche",
                  cell: (row) => NIGHT_LABELS[row.night] ?? row.night,
                },
                {
                  id: "status",
                  header: "Estado",
                  cell: (row) =>
                    row.status === "confirmed"
                      ? "Confirmada"
                      : row.status === "assigned"
                        ? "Asignada"
                        : row.status,
                },
                {
                  id: "actions",
                  header: "Acciones",
                  cell: (row) => {
                    const draft = reassignDrafts[row._id] ?? {
                      homeId: "",
                      night: row.night,
                    };
                    const busy = assignmentBusyId === row._id;
                    return (
                      <div className="flex min-w-[18rem] flex-col gap-2">
                        <div className="flex flex-wrap gap-1">
                          {row.status !== "confirmed" ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              loading={busy}
                              disabled={!capabilities.operate || busy}
                              onClick={() => void patchAssignmentStatus(row._id, "confirm")}
                            >
                              Confirmar
                            </Button>
                          ) : null}
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            loading={busy}
                            disabled={!capabilities.operate || busy}
                            onClick={() => void patchAssignmentStatus(row._id, "cancel")}
                          >
                            Cancelar
                          </Button>
                        </div>
                        <div className="flex flex-wrap items-end gap-1">
                          <Select
                            label="Reasignar a"
                            value={draft.homeId}
                            onChange={(e) =>
                              setReassignDrafts((prev) => ({
                                ...prev,
                                [row._id]: { ...draft, homeId: e.target.value },
                              }))
                            }
                            options={[
                              { value: "", label: "Hogar destino…" },
                              ...(summary?.lodgingHomes ?? [])
                                .filter((h) => h._id !== row.homeId)
                                .map((h) => {
                                  const night = draft.night || row.night;
                                  const cap =
                                    h.capacityByNight[
                                      night as "2026-11-20" | "2026-11-21"
                                    ] ?? 0;
                                  const occupied = (
                                    summary?.lodgingAssignments ?? []
                                  ).filter(
                                    (a) => a.homeId === h._id && a.night === night
                                  ).length;
                                  const free = Math.max(0, cap - occupied);
                                  return {
                                    value: h._id,
                                    label: `${h.name} · ${free}/${cap} disp.`,
                                  };
                                }),
                            ]}
                          />
                          <Select
                            label="Noche"
                            value={draft.night}
                            onChange={(e) =>
                              setReassignDrafts((prev) => ({
                                ...prev,
                                [row._id]: { ...draft, night: e.target.value },
                              }))
                            }
                            options={[
                              { value: "2026-11-20", label: "Vie 20" },
                              { value: "2026-11-21", label: "Sáb 21" },
                            ]}
                          />
                          <Button
                            type="button"
                            size="sm"
                            loading={busy}
                            disabled={!capabilities.operate || busy || !draft.homeId}
                            onClick={() => void reassignAssignment(row._id)}
                          >
                            Reasignar
                          </Button>
                        </div>
                      </div>
                    );
                  },
                },
              ]}
              data={summary?.lodgingAssignments ?? []}
              rowKey={(row) => row._id}
              emptyTitle="Sin asignaciones activas"
            />
          </Section>
        </TabsContent>

        <TabsContent value="reportes">
          <Section title="Exportaciones operativas">
            <p className="mb-4 text-sm text-muted">
              Los reportes definitivos dependerán de las APIs de congreso. Mientras tanto puede
              usar los listados filtrados en Inscritos y Asistencia.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" disabled>
                <Download className="mr-2 h-4 w-4" />
                Inscritos (CSV)
              </Button>
              <Button variant="outline" size="sm" disabled>
                <Download className="mr-2 h-4 w-4" />
                Asistencia (CSV)
              </Button>
              <Button variant="outline" size="sm" disabled>
                <Download className="mr-2 h-4 w-4" />
                Saldos (CSV)
              </Button>
            </div>
          </Section>
        </TabsContent>

        <TabsContent value="historial">
          {auditLoading ? <LoadingState variant="table" /> : null}
          {auditError ? <AlertBanner variant="warning">{auditError}</AlertBanner> : null}
          {!auditLoading && !auditError && auditEntries.length === 0 ? (
            <EmptyState
              icon={<History className="h-8 w-8" />}
              title="Sin movimientos registrados"
              description="Las acciones de operadores aparecerán aquí cuando el backend de auditoría esté activo."
            />
          ) : null}
          {!auditLoading && auditEntries.length > 0 ? (
            <Timeline
              items={auditEntries.map((entry) => ({
                id: entry._id,
                time: formatDateTime(entry.createdAt),
                title: entry.action,
                description: [entry.entity, entry.entityId].filter(Boolean).join(" · "),
              }))}
            />
          ) : null}
        </TabsContent>

        <TabsContent value="importacion">
          <AlertBanner variant="warning" className="mb-4">
            <strong>Importación definitiva bloqueada.</strong> Solo puede ejecutar vista previa del
            Excel. No se escribirá en Mongo hasta completar la revisión operativa.
          </AlertBanner>

          <Section title="Vista previa de Excel">
            <div className="flex flex-wrap items-end gap-3">
              <Input
                type="file"
                accept=".xlsx,.xls"
                label="Archivo Excel"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  setImportFile(file);
                  setImportPreview(null);
                  setImportError(null);
                }}
              />
              <Button
                type="button"
                size="sm"
                loading={importLoading}
                onClick={() => void runImportPreview()}
              >
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Generar vista previa
              </Button>
            </div>
            {importError ? (
              <AlertBanner variant="warning" className="mt-4">
                {importError}
              </AlertBanner>
            ) : null}
            {importStubNote ? (
              <p className="mt-3 text-sm text-muted">{importStubNote}</p>
            ) : null}
          </Section>

          {importPreview ? (
            <Section title="Resultado de la revisión" className="mt-6">
              <ContentGrid cols={3} className="mb-4">
                <KpiCard label="Con nombre" value={importPreview.summary.namedCount} />
                <KpiCard label="Huecos de cantidad" value={importPreview.summary.gapCount} />
                <KpiCard label="Total declarado" value={importPreview.summary.declaredTotal} />
              </ContentGrid>
              <p className="mb-4 text-sm text-muted">
                Personas nombradas: {importPreview.namedPeople.length} · Solicitudes de alojamiento:{" "}
                {importPreview.churchLodgingRequests.length}. Los huecos no se convierten en fichas.
              </p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                loading={importLoading}
                onClick={() => void runImportPrepare()}
                disabled={!capabilities.import}
              >
                Preparar plan de importación
              </Button>
            </Section>
          ) : null}

          {importPlan ? (
            <Section title="Confirmación explícita (sin escribir aún)" className="mt-6">
              <ContentGrid cols={4} className="mb-4">
                <KpiCard label="Altas propuestas" value={importPlan.summary.createCount} />
                <KpiCard label="Vinculaciones" value={importPlan.summary.linkCount} />
                <KpiCard label="Omitidos (reimport)" value={importPlan.summary.skipCount} />
                <KpiCard label="Pendientes sin nombre" value={importPlan.summary.gapCount} />
              </ContentGrid>
              <label className="mb-3 flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={importConfirmChecked}
                  onChange={(e) => setImportConfirmChecked(e.target.checked)}
                />
                He revisado altas, vinculaciones y pendientes
              </label>
              <Button
                className="mt-2"
                variant="outline"
                size="sm"
                disabled
                title="Importación definitiva bloqueada a propósito"
              >
                Confirmar importación (bloqueado)
              </Button>
              <p className="mt-2 text-xs text-muted">
                Aunque marque la casilla, la API /import/commit responde 403 hasta habilitarla.
              </p>
            </Section>
          ) : null}
        </TabsContent>
      </Tabs>
    </AdminModulePage>
  );
}