import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Search,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Filter,
  Loader2,
  Briefcase,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Truck,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Weight,
  User,
  PlusCircle,
  MinusCircle,
  X,
} from "lucide-react";
import { C } from "../layouts/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// ── Config ────────────────────────────────────────────────────────────────────
const API_URL = "https://blue-pearls-server.vercel.app";

// ── Types ─────────────────────────────────────────────────────────────────────
export type JobStatus = "Scheduled" | "Ongoing" | "Completed" | "Missed";
export type ApprovalStatus = "Requested" | "Approved" | "Rejected";

export interface Cost {
  id: string;
  description: string;
  amount: number;
}

export interface Job {
  id: number;
  status: JobStatus;
  approval: ApprovalStatus;
  clientId: number;
  vehicleId: number;
  driverId: number;
  requestedById?: number | null;
  scheduledAt: string;
  dueAt?: string | null;
  tonnage: string;
  description?: string | null;
  odometerReading?: number | null;
  fuelGauge?: string | null;
  income?: number | null;
  costs?: Cost[];
  createdAt: string;
  // joined
  clientName?: string;
  vehiclePlate?: string;
  driverName?: string;
  requestedByName?: string;
}

export interface ClientOption {
  id: number;
  name: string;
}
export interface VehicleOption {
  id: number;
  numberPlate: string;
  type: string;
  defaultDriverId?: number | null;
}
export interface StaffOption {
  id: number;
  name: string;
  avatarUrl?: string;
  department?: string;
}

type SortKey = "scheduledAt" | "status" | "approval" | "clientName";
type SortDir = "asc" | "desc";

// ── Style maps ─────────────────────────────────────────────────────────────────
const STATUS_STYLES: Record<
  JobStatus,
  { color: string; bg: string; icon: React.ElementType; dot: string }
> = {
  Scheduled: { color: C.blue, bg: `${C.blue}18`, icon: Clock, dot: C.blue },
  Ongoing: {
    color: "#b8922a",
    bg: "#E1BA5820",
    icon: AlertCircle,
    dot: C.yellow,
  },
  Completed: {
    color: C.green,
    bg: `${C.green}18`,
    icon: CheckCircle2,
    dot: C.green,
  },
  Missed: { color: C.red, bg: `${C.red}18`, icon: XCircle, dot: C.red },
};

const APPROVAL_STYLES: Record<ApprovalStatus, { color: string; bg: string }> = {
  Requested: { color: "#b8922a", bg: "#E1BA5820" },
  Approved: { color: C.green, bg: `${C.green}18` },
  Rejected: { color: C.red, bg: `${C.red}18` },
};

const ALL_STATUSES: JobStatus[] = [
  "Scheduled",
  "Ongoing",
  "Completed",
  "Missed",
];
const ALL_APPROVALS: ApprovalStatus[] = ["Requested", "Approved", "Rejected"];
const FUEL_GAUGES = ["Empty", "1/4", "1/2", "3/4", "Full"];

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function toDatetimeLocal(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// ── Schema ────────────────────────────────────────────────────────────────────
const costSchema = z.object({
  id: z.string(),
  description: z.string().min(1, "Description required"),
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
});

const jobSchema = z.object({
  clientId: z.coerce.number().min(1, "Client is required"),
  vehicleId: z.coerce.number().min(1, "Vehicle is required"),
  driverId: z.coerce.number().min(1, "Driver is required"),
  requestedById: z.coerce.number().nullable().optional(),
  scheduledAt: z.string().min(1, "Start date is required"),
  dueAt: z.string().min(1, "End date is required"),
  tonnage: z.string().min(1, "Tonnage is required"),
  description: z.string().optional().or(z.literal("")),
  odometerReading: z.coerce.number().nullable().optional(),
  fuelGauge: z.string().optional().or(z.literal("")),
  income: z.coerce.number().nullable().optional(),
  costs: z.array(costSchema).optional().default([]),
  status: z.enum(["Scheduled", "Ongoing", "Completed", "Missed"]),
  approval: z.enum(["Requested", "Approved", "Rejected"]),
});

type JobFormData = z.infer<typeof jobSchema>;

// ── Sort Header ───────────────────────────────────────────────────────────────
function SortHeader({
  label,
  sortKey,
  current,
  dir,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  current: SortKey;
  dir: SortDir;
  onSort: (k: SortKey) => void;
}) {
  const active = current === sortKey;
  return (
    <button
      onClick={() => onSort(sortKey)}
      className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest"
      style={{ color: active ? C.dark : C.muted }}>
      {label}
      <span className="opacity-60">
        {active ? (
          dir === "asc" ? (
            <ChevronUp size={11} />
          ) : (
            <ChevronDown size={11} />
          )
        ) : (
          <ChevronsUpDown size={11} />
        )}
      </span>
    </button>
  );
}

// ── Staff Selector Component ──────────────────────────────────────────────────
function StaffSelector({
  value,
  onChange,
  staff,
  label,
  placeholder = "Select staff member",
  required = false,
  filterByDepartment,
}: {
  value: number | null;
  onChange: (id: number | null) => void;
  staff: StaffOption[];
  label: string;
  placeholder?: string;
  required?: boolean;
  filterByDepartment?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredStaff = useMemo(() => {
    if (filterByDepartment) {
      return staff.filter((s) => s.department === filterByDepartment);
    }
    return staff;
  }, [staff, filterByDepartment]);

  // Derive selectedStaff directly from value — always reactive, no stale state
  const selectedStaff = useMemo(
    () => filteredStaff.find((s) => s.id === value) ?? null,
    [value, filteredStaff],
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = filteredStaff.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-1.5 relative" ref={containerRef}>
      <Label
        className="text-xs font-semibold uppercase tracking-wider"
        style={{ color: C.muted }}>
        {label}
        {required && " *"}
      </Label>

      {selectedStaff ? (
        <div
          className="flex items-center justify-between p-2 rounded-xl cursor-pointer hover:bg-[#F5F4EF] transition-colors"
          style={{ border: `1px solid ${C.border}` }}
          onClick={() => setIsOpen(true)}>
          <div className="flex items-center gap-2">
            <Avatar className="w-7 h-7">
              <AvatarImage src={selectedStaff.avatarUrl} />
              <AvatarFallback
                className="text-xs font-bold text-white"
                style={{ background: "#1a3a5c" }}>
                {getInitials(selectedStaff.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-semibold" style={{ color: C.dark }}>
                {selectedStaff.name}
              </p>
              {selectedStaff.department && (
                <p className="text-[10px]" style={{ color: C.muted }}>
                  {selectedStaff.department}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange(null);
            }}
            className="text-red-500 hover:bg-red-50 p-1 rounded-lg transition-colors">
            <X size={14} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="w-full flex items-center gap-2 justify-center h-10 rounded-xl text-sm font-medium border-dashed border-2 transition-colors hover:bg-[#F5F4EF]"
          style={{ color: C.muted, borderColor: C.border }}>
          <User size={14} /> {placeholder}
        </button>
      )}

      {isOpen && (
        <div
          className="absolute z-50 mt-1 w-full bg-white rounded-xl shadow-lg border"
          style={{ borderColor: C.border }}>
          <div className="p-2">
            <div className="relative mb-2">
              <Search
                size={14}
                className="absolute left-2 top-1/2 -translate-y-1/2"
                style={{ color: C.muted }}
              />
              <Input
                placeholder="Search staff..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-7 h-8 text-sm bg-[#F5F4EF] border-0"
                autoFocus
              />
            </div>
            <div className="max-h-48 overflow-y-auto">
              {filtered.length > 0 ? (
                filtered.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      onChange(s.id);
                      setIsOpen(false);
                      setSearch("");
                    }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-[#F5F4EF] rounded-lg transition-colors flex items-center gap-2">
                    <Avatar className="w-6 h-6">
                      <AvatarImage src={s.avatarUrl} />
                      <AvatarFallback
                        className="text-xs font-bold text-white"
                        style={{ background: "#1a3a5c" }}>
                        {getInitials(s.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm">{s.name}</p>
                      {s.department && (
                        <p className="text-[10px]" style={{ color: C.muted }}>
                          {s.department}
                        </p>
                      )}
                    </div>
                  </button>
                ))
              ) : (
                <p
                  className="text-xs text-center py-2"
                  style={{ color: C.muted }}>
                  No staff found
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Costs Section Component ───────────────────────────────────────────────────
function CostsSection({
  value = [],
  onChange,
}: {
  value?: Cost[];
  onChange: (costs: Cost[]) => void;
}) {
  const addCost = () => {
    const newCost: Cost = {
      id: Date.now().toString(),
      description: "",
      amount: 0,
    };
    onChange([...value, newCost]);
  };

  const updateCost = (
    id: string,
    field: keyof Cost,
    newValue: string | number,
  ) => {
    onChange(
      value.map((cost) =>
        cost.id === id ? { ...cost, [field]: newValue } : cost,
      ),
    );
  };

  const removeCost = (id: string) => {
    onChange(value.filter((cost) => cost.id !== id));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: C.muted }}>
          Costs (Optional)
        </Label>
        <button
          type="button"
          onClick={addCost}
          className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg hover:bg-[#F5F4EF] transition-colors"
          style={{ color: C.blue }}>
          <PlusCircle size={14} /> Add Cost
        </button>
      </div>

      {value.map((cost) => (
        <div
          key={cost.id}
          className="grid grid-cols-[1fr,130px,auto] gap-2 items-start animate-in slide-in-from-top-2 duration-200">
          <div>
            <Input
              value={cost.description}
              onChange={(e) =>
                updateCost(cost.id, "description", e.target.value)
              }
              placeholder="Description"
              className="h-9 text-sm rounded-lg"
            />
          </div>
          <div className="relative">
            <span
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] font-semibold pointer-events-none select-none"
              style={{ color: C.muted }}>
              UGX
            </span>
            <Input
              type="number"
              step="1"
              value={cost.amount || ""}
              onChange={(e) =>
                updateCost(cost.id, "amount", parseFloat(e.target.value) || 0)
              }
              placeholder="0"
              className="h-9 text-sm pl-10 rounded-lg"
            />
          </div>
          <button
            type="button"
            onClick={() => removeCost(cost.id)}
            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
            <MinusCircle size={16} />
          </button>
        </div>
      ))}

      {value.length === 0 && (
        <p className="text-xs italic" style={{ color: C.muted }}>
          No costs added. Click "Add Cost" to include expenses.
        </p>
      )}
    </div>
  );
}

// ── Select Field Component ────────────────────────────────────────────────────
const SelectField = ({
  name,
  label,
  placeholder,
  options,
  required,
  control,
  errors,
  disabled,
}: {
  name: keyof JobFormData;
  label: string;
  placeholder?: string;
  options: { value: string; label: string }[];
  required?: boolean;
  control: any;
  errors: any;
  disabled?: boolean;
}) => (
  <div className="space-y-1.5">
    <Label
      className="text-xs font-semibold uppercase tracking-wider"
      style={{ color: C.muted }}>
      {label}
      {required && " *"}
    </Label>
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <Select
          value={field.value ? String(field.value) : ""}
          onValueChange={(v) => field.onChange(v === "none" ? null : v)}
          disabled={disabled}>
          <SelectTrigger className="h-10 rounded-xl text-sm">
            <SelectValue
              placeholder={placeholder ?? `Select ${label.toLowerCase()}`}
            />
          </SelectTrigger>
          <SelectContent>
            {!required && <SelectItem value="none">None</SelectItem>}
            {options.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    />
    {errors[name] && (
      <p className="text-xs text-red-500">{errors[name]?.message as string}</p>
    )}
  </div>
);

// ── Job Sheet ─────────────────────────────────────────────────────────────────
function JobSheet({
  open,
  onClose,
  editing,
  onSave,
  clients,
  vehicles,
  staff,
  currentUserId,
}: {
  open: boolean;
  onClose: () => void;
  editing: Job | null;
  onSave: (data: any, id?: number) => Promise<void>;
  clients: ClientOption[];
  vehicles: VehicleOption[];
  staff: StaffOption[];
  currentUserId?: number | null;
}) {
  const [isSaving, setIsSaving] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleOption | null>(
    null,
  );

  // Filter staff for drivers (Logistics department)
  const logisticsStaff = useMemo(
    () => staff.filter((s) => s.department === "Logistics"),
    [staff],
  );

  const buildDefaultValues = useCallback(
    (job: Job | null): JobFormData => {
      if (job) {
        return {
          clientId: job.clientId,
          vehicleId: job.vehicleId,
          driverId: job.driverId,
          requestedById: job.requestedById ?? currentUserId ?? null,
          scheduledAt: toDatetimeLocal(job.scheduledAt),
          dueAt: job.dueAt ? toDatetimeLocal(job.dueAt) : "",
          tonnage: job.tonnage,
          description: job.description ?? "",
          odometerReading: job.odometerReading ?? null,
          fuelGauge: job.fuelGauge ?? "",
          income: job.income ?? null,
          costs: job.costs || [],
          status: job.status,
          approval: job.approval,
        };
      }
      return {
        clientId: 0,
        vehicleId: 0,
        driverId: 0,
        requestedById: currentUserId ?? null,
        scheduledAt: "",
        dueAt: "",
        tonnage: "",
        description: "",
        odometerReading: null,
        fuelGauge: "",
        income: null,
        costs: [],
        status: "Scheduled",
        approval: "Requested",
      };
    },
    [currentUserId],
  );

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<JobFormData>({
    resolver: zodResolver(jobSchema),
    defaultValues: buildDefaultValues(editing),
  });

  // Reset form whenever the sheet opens or the editing job changes
  useEffect(() => {
    if (open) {
      reset(buildDefaultValues(editing));
      setSelectedVehicle(null);
    }
  }, [open, editing?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const watchVehicleId = watch("vehicleId");
  const watchDueAt = watch("dueAt");
  const watchDriverId = watch("driverId");
  const watchIncome = watch("income");
  const watchApproval = watch("approval");

  // Fetch vehicle details when vehicle changes; auto-fill default driver if no driver set yet
  useEffect(() => {
    if (!watchVehicleId) {
      setSelectedVehicle(null);
      return;
    }
    const fetchVehicle = async () => {
      try {
        const res = await fetch(`${API_URL}/vehicles/${watchVehicleId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("bp_token")}`,
          },
        });
        if (res.ok) {
          const vehicle = await res.json();
          setSelectedVehicle(vehicle);
          // Auto-fill default driver only when no driver is currently selected
          if (vehicle.defaultDriverId && !getValues("driverId")) {
            setValue("driverId", vehicle.defaultDriverId);
          }
        }
      } catch (error) {
        console.error("Failed to fetch vehicle:", error);
      }
    };
    fetchVehicle();
  }, [watchVehicleId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Whether the approval dropdown can be changed to Approved
  const canApprove = useMemo(() => {
    if (watchApproval !== "Requested") return true;
    return !!(
      watchDueAt &&
      watchVehicleId &&
      watchDriverId &&
      watchIncome &&
      watchIncome > 0
    );
  }, [watchApproval, watchDueAt, watchVehicleId, watchDriverId, watchIncome]);

  function handleClose() {
    reset(buildDefaultValues(null));
    setSelectedVehicle(null);
    onClose();
  }

  async function onSubmit(data: JobFormData) {
    setIsSaving(true);
    try {
      await onSave(data, editing?.id);
      handleClose();
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={(o) => !o && !isSaving && handleClose()}>
      <SheetContent
        className="w-[520px] sm:w-[580px] overflow-y-auto !p-0"
        style={{ fontFamily: "'Inter', sans-serif" }}>
        <div
          className="px-7 py-6"
          style={{ borderBottom: `1px solid ${C.border}` }}>
          <SheetTitle className="text-lg font-bold" style={{ color: C.dark }}>
            {editing ? "Edit Job" : "Create Job"}
          </SheetTitle>
          <SheetDescription className="mt-1 text-sm" style={{ color: C.muted }}>
            {editing
              ? `Editing job #${String(editing.id).padStart(4, "0")}.`
              : "Schedule a new transport job."}
          </SheetDescription>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="px-7 py-6 space-y-6">
            {/* ── Assignment ── */}
            <div>
              <p
                className="text-[10px] font-semibold uppercase tracking-widest mb-3"
                style={{ color: C.muted }}>
                Assignment
              </p>
              <div className="space-y-4">
                {/* Client */}
                <SelectField
                  name="clientId"
                  label="Client"
                  required
                  options={clients.map((c) => ({
                    value: String(c.id),
                    label: c.name,
                  }))}
                  control={control}
                  errors={errors}
                  disabled={!!editing}
                />

                {/* Vehicle */}
                <SelectField
                  name="vehicleId"
                  label="Vehicle"
                  required
                  options={vehicles.map((v) => ({
                    value: String(v.id),
                    label: `${v.numberPlate} (${v.type})`,
                  }))}
                  control={control}
                  errors={errors}
                />

                {/* Driver — shown after vehicle selected, pre-filled with vehicle's default driver */}
                {watchVehicleId ? (
                  <Controller
                    name="driverId"
                    control={control}
                    render={({ field }) => (
                      <StaffSelector
                        value={field.value || null}
                        onChange={(id) => field.onChange(id ?? 0)}
                        staff={logisticsStaff}
                        label="Driver"
                        placeholder="Select driver"
                        required
                        filterByDepartment="Logistics"
                      />
                    )}
                  />
                ) : (
                  <div
                    className="p-4 rounded-xl text-center"
                    style={{ background: "#F5F4EF" }}>
                    <p className="text-xs" style={{ color: C.muted }}>
                      Select a vehicle first to assign a driver
                    </p>
                  </div>
                )}

                {/* Requested By */}
                <Controller
                  name="requestedById"
                  control={control}
                  render={({ field }) => (
                    <StaffSelector
                      value={field.value ?? null}
                      onChange={field.onChange}
                      staff={staff}
                      label="Requested By"
                      placeholder="Select requester"
                    />
                  )}
                />
              </div>
            </div>

            {/* ── Schedule ── */}
            <div>
              <p
                className="text-[10px] font-semibold uppercase tracking-widest mb-3"
                style={{ color: C.muted }}>
                Schedule
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label
                    className="text-xs font-semibold uppercase tracking-wider"
                    style={{ color: C.muted }}>
                    Start Date *
                  </Label>
                  <Controller
                    name="scheduledAt"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        type="datetime-local"
                        className="h-10 rounded-xl text-sm"
                      />
                    )}
                  />
                  {errors.scheduledAt && (
                    <p className="text-xs text-red-500">
                      {errors.scheduledAt.message as string}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label
                    className="text-xs font-semibold uppercase tracking-wider"
                    style={{ color: C.muted }}>
                    End Date *
                  </Label>
                  <Controller
                    name="dueAt"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        type="datetime-local"
                        className="h-10 rounded-xl text-sm"
                      />
                    )}
                  />
                  {errors.dueAt && (
                    <p className="text-xs text-red-500">
                      {errors.dueAt.message as string}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* ── Cargo & Financials ── */}
            <div>
              <p
                className="text-[10px] font-semibold uppercase tracking-widest mb-3"
                style={{ color: C.muted }}>
                Cargo & Financials
              </p>
              <div className="space-y-4">
                {/* Tonnage */}
                <div className="space-y-1.5">
                  <Label
                    className="text-xs font-semibold uppercase tracking-wider"
                    style={{ color: C.muted }}>
                    Tonnage *
                  </Label>
                  <div className="relative">
                    <Weight
                      size={14}
                      className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                      style={{ color: C.muted }}
                    />
                    <Controller
                      name="tonnage"
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          placeholder="e.g. 12.5"
                          className="h-10 rounded-xl text-sm pl-9"
                        />
                      )}
                    />
                  </div>
                  {errors.tonnage && (
                    <p className="text-xs text-red-500">
                      {errors.tonnage.message}
                    </p>
                  )}
                </div>

                {/* Income in UGX */}
                <div className="space-y-1.5">
                  <Label
                    className="text-xs font-semibold uppercase tracking-wider"
                    style={{ color: C.muted }}>
                    Income * (Required for approval)
                  </Label>
                  <div className="relative">
                    <span
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold pointer-events-none select-none"
                      style={{ color: C.muted }}>
                      UGX
                    </span>
                    <Controller
                      name="income"
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          type="number"
                          step="1"
                          placeholder="0"
                          className="h-10 rounded-xl text-sm pl-11"
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value
                                ? parseFloat(e.target.value)
                                : null,
                            )
                          }
                        />
                      )}
                    />
                  </div>
                </div>

                {/* Costs */}
                <Controller
                  name="costs"
                  control={control}
                  render={({ field }) => (
                    <CostsSection
                      value={field.value || []}
                      onChange={field.onChange}
                    />
                  )}
                />

                {/* Odometer & Fuel */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label
                      className="text-xs font-semibold uppercase tracking-wider"
                      style={{ color: C.muted }}>
                      Odometer (km)
                    </Label>
                    <Controller
                      name="odometerReading"
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          value={field.value ?? ""}
                          type="number"
                          placeholder="e.g. 45000"
                          className="h-10 rounded-xl text-sm"
                          onChange={(e) =>
                            field.onChange(
                              e.target.value === ""
                                ? null
                                : parseInt(e.target.value),
                            )
                          }
                        />
                      )}
                    />
                  </div>
                  <SelectField
                    name="fuelGauge"
                    label="Fuel Gauge"
                    options={FUEL_GAUGES.map((f) => ({ value: f, label: f }))}
                    control={control}
                    errors={errors}
                  />
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <Label
                    className="text-xs font-semibold uppercase tracking-wider"
                    style={{ color: C.muted }}>
                    Description
                  </Label>
                  <Controller
                    name="description"
                    control={control}
                    render={({ field }) => (
                      <textarea
                        {...field}
                        value={field.value ?? ""}
                        rows={2}
                        placeholder="Route details, cargo notes…"
                        className="w-full rounded-xl text-sm px-3 py-2.5 resize-none focus:outline-none focus:ring-2"
                        style={{
                          border: `1px solid ${C.border}`,
                          fontFamily: "'Inter', sans-serif",
                          color: C.dark,
                          background: "#fff",
                        }}
                      />
                    )}
                  />
                </div>
              </div>
            </div>

            {/* ── Status ── */}
            <div>
              <p
                className="text-[10px] font-semibold uppercase tracking-widest mb-3"
                style={{ color: C.muted }}>
                Status
              </p>
              <div className="grid grid-cols-2 gap-3">
                <SelectField
                  name="status"
                  label="Job Status"
                  required
                  options={ALL_STATUSES.map((s) => ({ value: s, label: s }))}
                  control={control}
                  errors={errors}
                />

                <div className="space-y-1.5">
                  <Label
                    className="text-xs font-semibold uppercase tracking-wider"
                    style={{ color: C.muted }}>
                    Approval *
                  </Label>
                  <Controller
                    name="approval"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={field.value === "Requested" && !canApprove}>
                        <SelectTrigger className="h-10 rounded-xl text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ALL_APPROVALS.map((a) => (
                            <SelectItem key={a} value={a}>
                              {a}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {watchApproval === "Requested" && !canApprove && (
                    <p className="text-xs text-amber-600 mt-1">
                      End date, vehicle, driver, and income required to approve
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="px-7 pb-7 flex gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={isSaving}
              onClick={handleClose}
              className="flex-1 rounded-xl">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="flex-1 rounded-xl text-white font-semibold"
              style={{
                background: "linear-gradient(135deg, #1a3a5c 0%, #1e6ea6 100%)",
              }}>
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : editing ? (
                "Save Changes"
              ) : (
                "Create Job"
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}

// ── Delete Dialog ─────────────────────────────────────────────────────────────
function DeleteDialog({
  open,
  onClose,
  job,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  job: Job | null;
  onConfirm: () => Promise<void>;
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  async function handleConfirm() {
    setIsDeleting(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setIsDeleting(false);
    }
  }
  return (
    <Dialog open={open} onOpenChange={(o) => !o && !isDeleting && onClose()}>
      <DialogContent
        className="max-w-sm rounded-2xl"
        style={{ fontFamily: "'Inter', sans-serif" }}>
        <DialogHeader>
          <DialogTitle
            className="text-base font-bold"
            style={{ color: C.dark }}>
            Delete Job
          </DialogTitle>
          <DialogDescription style={{ color: C.muted }}>
            Delete job{" "}
            <strong style={{ color: C.dark }}>
              #{String(job?.id ?? 0).padStart(4, "0")}
            </strong>{" "}
            for <strong style={{ color: C.dark }}>{job?.clientName}</strong>?
            This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 mt-2">
          <Button
            variant="outline"
            disabled={isDeleting}
            onClick={onClose}
            className="rounded-xl">
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isDeleting}
            className="rounded-xl text-white"
            style={{ background: C.red }}>
            {isDeleting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Delete"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Jobs Page ─────────────────────────────────────────────────────────────────
export default function Jobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [staff, setStaff] = useState<StaffOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<JobStatus | "ALL">("ALL");
  const [approvalFilter, setApprovalFilter] = useState<ApprovalStatus | "ALL">(
    "ALL",
  );
  const [sortKey, setSortKey] = useState<SortKey>("scheduledAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Job | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Job | null>(null);

  const currentUserId = useMemo(() => {
    try {
      const user = JSON.parse(localStorage.getItem("bp_user") || "{}");
      return user.staffId || null;
    } catch {
      return null;
    }
  }, []);

  const authHeader = useMemo(
    () => ({
      Authorization: `Bearer ${localStorage.getItem("bp_token")}`,
      "Content-Type": "application/json",
    }),
    [],
  );

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [jRes, cRes, vRes, sRes] = await Promise.all([
        fetch(`${API_URL}/jobs`, { headers: authHeader }),
        fetch(`${API_URL}/clients`, { headers: authHeader }),
        fetch(`${API_URL}/vehicles`, { headers: authHeader }),
        fetch(`${API_URL}/staff`, { headers: authHeader }),
      ]);

      const [jData, cData, vData, sData] = await Promise.all([
        jRes.json(),
        cRes.json(),
        vRes.json(),
        sRes.json(),
      ]);

      if (jRes.ok) setJobs(jData);
      else toast.error(jData.error || "Failed to load jobs");
      if (cRes.ok) setClients(cData);
      if (vRes.ok) setVehicles(vData);
      if (sRes.ok) setStaff(sData);
    } catch {
      toast.error("Network error");
    } finally {
      setIsLoading(false);
    }
  }, [authHeader]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function handleSort(key: SortKey) {
    if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    let list = jobs.filter((j) => {
      const matchSearch =
        !q ||
        (j.clientName ?? "").toLowerCase().includes(q) ||
        (j.vehiclePlate ?? "").toLowerCase().includes(q) ||
        (j.driverName ?? "").toLowerCase().includes(q) ||
        String(j.id).includes(q);
      const matchStatus = statusFilter === "ALL" || j.status === statusFilter;
      const matchApproval =
        approvalFilter === "ALL" || j.approval === approvalFilter;
      return matchSearch && matchStatus && matchApproval;
    });
    list.sort((a, b) => {
      let va: string = "",
        vb: string = "";
      if (sortKey === "scheduledAt") {
        va = a.scheduledAt;
        vb = b.scheduledAt;
      } else if (sortKey === "status") {
        va = a.status;
        vb = b.status;
      } else if (sortKey === "approval") {
        va = a.approval;
        vb = b.approval;
      } else if (sortKey === "clientName") {
        va = a.clientName ?? "";
        vb = b.clientName ?? "";
      }
      return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
    });
    return list;
  }, [jobs, search, statusFilter, approvalFilter, sortKey, sortDir]);

  async function quickPatch(
    job: Job,
    patch: Partial<Pick<Job, "status" | "approval">>,
  ) {
    try {
      const res = await fetch(`${API_URL}/jobs/${job.id}`, {
        method: "PATCH",
        headers: authHeader,
        body: JSON.stringify(patch),
      });
      if (res.ok) {
        toast.success("Job updated");
        fetchData();
      } else toast.error("Update failed");
    } catch {
      toast.error("Network error");
    }
  }

  async function handleSave(data: JobFormData, id?: number) {
    const method = id !== undefined ? "PATCH" : "POST";
    const url = id !== undefined ? `${API_URL}/jobs/${id}` : `${API_URL}/jobs`;
    try {
      const res = await fetch(url, {
        method,
        headers: authHeader,
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (res.ok) {
        toast.success(id ? "Job updated" : "Job created");
        fetchData();
      } else {
        toast.error(result.error || "Operation failed");
        throw new Error();
      }
    } catch {
      throw new Error();
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`${API_URL}/jobs/${deleteTarget.id}`, {
        method: "DELETE",
        headers: authHeader,
      });
      if (res.ok) {
        toast.success("Job deleted");
        fetchData();
      } else toast.error("Failed to delete job");
    } catch {
      toast.error("Network error");
    }
  }

  const handleApprovalClick = (job: Job, targetApproval: ApprovalStatus) => {
    if (targetApproval === "Approved" && job.approval === "Requested") {
      if (!job.dueAt || !job.vehicleId || !job.driverId || !job.income) {
        toast.info("Please fill in all required fields first");
        setEditing(job);
        setSheetOpen(true);
        return;
      }
    }
    quickPatch(job, { approval: targetApproval });
  };

  const counts = {
    total: jobs.length,
    scheduled: jobs.filter((j) => j.status === "Scheduled").length,
    ongoing: jobs.filter((j) => j.status === "Ongoing").length,
    completed: jobs.filter((j) => j.status === "Completed").length,
    missed: jobs.filter((j) => j.status === "Missed").length,
    pending: jobs.filter((j) => j.approval === "Requested").length,
  };

  return (
    <div
      className="h-full overflow-auto px-6 pt-5 pb-6"
      style={{ scrollbarGutter: "stable" }}>
      {/* Header */}
      <div
        className="flex items-start justify-between mb-5"
        style={{ animation: "fadeSlideUp 0.3s ease both" }}>
        <div>
          <p className="text-xs font-medium mb-1" style={{ color: C.muted }}>
            {new Date().toLocaleDateString("en-GB", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
          <h2
            className="text-3xl font-bold tracking-tight"
            style={{ color: C.dark }}>
            Jobs
          </h2>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setSheetOpen(true);
          }}
          className="flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-semibold text-white"
          style={{
            background: "linear-gradient(135deg, #1a3a5c 0%, #1e6ea6 100%)",
            boxShadow: "0 2px 10px rgba(26,58,92,0.25)",
          }}>
          <Plus size={15} /> Create Job
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-5 gap-3 mb-5">
        {[
          {
            label: "Total",
            value: counts.total,
            icon: Briefcase,
            color: "#1e6ea6",
            bg: "#1e6ea618",
          },
          {
            label: "Scheduled",
            value: counts.scheduled,
            icon: Clock,
            color: C.blue,
            bg: `${C.blue}18`,
          },
          {
            label: "Ongoing",
            value: counts.ongoing,
            icon: AlertCircle,
            color: "#b8922a",
            bg: "#E1BA5820",
          },
          {
            label: "Completed",
            value: counts.completed,
            icon: CheckCircle2,
            color: C.green,
            bg: `${C.green}18`,
          },
          {
            label: "Missed",
            value: counts.missed,
            icon: XCircle,
            color: C.red,
            bg: `${C.red}18`,
          },
        ].map((card, i) => (
          <div
            key={card.label}
            className="rounded-2xl p-4 cursor-pointer transition-all"
            onClick={() =>
              setStatusFilter(
                card.label === "Total" ? "ALL" : (card.label as JobStatus),
              )
            }
            style={{
              background: "#fff",
              border: `1px solid ${
                statusFilter === (card.label === "Total" ? "ALL" : card.label)
                  ? card.color
                  : C.border
              }`,
              animation: `fadeSlideUp 0.4s ease ${i * 0.06}s both`,
              boxShadow:
                statusFilter === (card.label === "Total" ? "ALL" : card.label)
                  ? `0 0 0 2px ${card.color}30`
                  : "none",
            }}>
            <div className="flex items-start justify-between mb-3">
              <p className="text-xs font-medium" style={{ color: C.muted }}>
                {card.label}
              </p>
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: card.bg }}>
                <card.icon size={13} style={{ color: card.color }} />
              </div>
            </div>
            <p className="text-2xl font-bold" style={{ color: C.dark }}>
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {/* Pending approval alert */}
      {counts.pending > 0 && (
        <div
          className="rounded-2xl px-4 py-3 mb-4 flex items-center gap-3 cursor-pointer"
          onClick={() => setApprovalFilter("Requested")}
          style={{
            background: "#E1BA5820",
            border: `1px solid ${C.yellow}50`,
            animation: "fadeSlideUp 0.4s ease 0.28s both",
          }}>
          <AlertCircle size={16} style={{ color: "#b8922a", flexShrink: 0 }} />
          <p className="text-sm font-medium" style={{ color: "#7a5a10" }}>
            <strong>{counts.pending}</strong> job{counts.pending > 1 ? "s" : ""}{" "}
            pending approval — click to filter
          </p>
          {approvalFilter === "Requested" && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setApprovalFilter("ALL");
              }}
              className="ml-auto text-xs font-medium px-2.5 py-1 rounded-lg transition-colors hover:bg-white/60"
              style={{ color: "#b8922a" }}>
              Clear
            </button>
          )}
        </div>
      )}

      {/* Filters */}
      <div
        className="rounded-2xl p-4 mb-4 flex items-center gap-3 flex-wrap"
        style={{
          background: "#fff",
          border: `1px solid ${C.border}`,
          animation: "fadeSlideUp 0.4s ease 0.22s both",
        }}>
        <div className="relative flex-1 min-w-[180px]">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: C.muted }}
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search client, plate, driver…"
            className="pl-9 h-9 rounded-xl text-sm border-0 bg-[#F5F4EF]"
          />
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <Filter size={13} style={{ color: C.muted }} />
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as JobStatus | "ALL")}>
            <SelectTrigger className="h-9 rounded-xl text-xs w-36 border-0 bg-[#F5F4EF]">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              {ALL_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={approvalFilter}
            onValueChange={(v) =>
              setApprovalFilter(v as ApprovalStatus | "ALL")
            }>
            <SelectTrigger className="h-9 rounded-xl text-xs w-36 border-0 bg-[#F5F4EF]">
              <SelectValue placeholder="All Approvals" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Approvals</SelectItem>
              {ALL_APPROVALS.map((a) => (
                <SelectItem key={a} value={a}>
                  {a}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div
        className="rounded-2xl overflow-hidden min-h-[400px]"
        style={{
          background: "#fff",
          border: `1px solid ${C.border}`,
          animation: "fadeSlideUp 0.4s ease 0.3s both",
        }}>
        <div
          className="grid px-5 py-3"
          style={{
            gridTemplateColumns: "56px 2fr 1.4fr 1.4fr 1fr 1fr 1fr 52px",
            borderBottom: `1px solid ${C.border}`,
            background: "#FAFAF8",
          }}>
          <span
            className="text-[10px] font-semibold uppercase tracking-widest"
            style={{ color: C.muted }}>
            #
          </span>
          <SortHeader
            label="Client"
            sortKey="clientName"
            current={sortKey}
            dir={sortDir}
            onSort={handleSort}
          />
          <span
            className="text-[10px] font-semibold uppercase tracking-widest"
            style={{ color: C.muted }}>
            Vehicle
          </span>
          <span
            className="text-[10px] font-semibold uppercase tracking-widest"
            style={{ color: C.muted }}>
            Driver
          </span>
          <SortHeader
            label="Scheduled"
            sortKey="scheduledAt"
            current={sortKey}
            dir={sortDir}
            onSort={handleSort}
          />
          <SortHeader
            label="Status"
            sortKey="status"
            current={sortKey}
            dir={sortDir}
            onSort={handleSort}
          />
          <SortHeader
            label="Approval"
            sortKey="approval"
            current={sortKey}
            dir={sortDir}
            onSort={handleSort}
          />
          <span />
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-3">
            <Loader2
              className="w-8 h-8 animate-spin"
              style={{ color: C.blue }}
            />
            <p className="text-sm font-medium" style={{ color: C.muted }}>
              Loading jobs…
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
            <div className="w-16 h-16 rounded-full bg-[#F5F4EF] flex items-center justify-center mb-4">
              <Briefcase size={28} style={{ color: C.border }} />
            </div>
            <h3 className="text-base font-bold mb-1" style={{ color: C.dark }}>
              No Jobs Found
            </h3>
            <p
              className="text-sm max-w-[280px] leading-relaxed mb-6"
              style={{ color: C.muted }}>
              {search || statusFilter !== "ALL" || approvalFilter !== "ALL"
                ? "No results match your current filters."
                : "No jobs scheduled yet. Create the first one."}
            </p>
            {!search && statusFilter === "ALL" && approvalFilter === "ALL" && (
              <Button
                onClick={() => setSheetOpen(true)}
                variant="outline"
                className="rounded-xl h-9 px-5 border-[#c4dff0] text-[#1a3a5c] hover:bg-[#ddf0fb] transition-colors">
                <Plus size={14} className="mr-2" /> Create Job
              </Button>
            )}
          </div>
        ) : (
          filtered.map((j, i) => {
            const ss = STATUS_STYLES[j.status];
            const as = APPROVAL_STYLES[j.approval];
            return (
              <div
                key={j.id}
                className="grid items-center px-5 py-3.5 transition-colors hover:bg-[#F5F4EF]"
                style={{
                  gridTemplateColumns: "56px 2fr 1.4fr 1.4fr 1fr 1fr 1fr 52px",
                  borderBottom:
                    i < filtered.length - 1 ? `1px solid ${C.border}` : "none",
                  animation: `fadeSlideUp 0.3s ease ${0.3 + i * 0.04}s both`,
                }}>
                {/* Job ID */}
                <p className="text-xs font-bold" style={{ color: C.muted }}>
                  #{String(j.id).padStart(4, "0")}
                </p>

                {/* Client */}
                <div className="min-w-0">
                  <p
                    className="text-sm font-semibold truncate"
                    style={{ color: C.dark }}>
                    {j.clientName ?? "—"}
                  </p>
                  <p className="text-[11px]" style={{ color: C.muted }}>
                    {j.tonnage} t
                  </p>
                </div>

                {/* Vehicle */}
                <div className="flex items-center gap-1.5 min-w-0">
                  <Truck size={12} style={{ color: C.muted, flexShrink: 0 }} />
                  <p
                    className="text-xs font-medium truncate"
                    style={{ color: C.dark }}>
                    {j.vehiclePlate ?? "—"}
                  </p>
                </div>

                {/* Driver */}
                <div className="flex items-center gap-1.5 min-w-0">
                  <User size={12} style={{ color: C.muted, flexShrink: 0 }} />
                  <p className="text-xs truncate" style={{ color: C.dark }}>
                    {j.driverName ?? "—"}
                  </p>
                </div>

                {/* Scheduled */}
                <p className="text-xs" style={{ color: C.muted }}>
                  {formatDate(j.scheduledAt)}
                </p>

                {/* Status badge */}
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold w-fit"
                  style={{ background: ss.bg, color: ss.color }}>
                  <span
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ background: ss.dot }}
                  />
                  {j.status}
                </span>

                {/* Approval badge */}
                <span
                  className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-semibold w-fit"
                  style={{ background: as.bg, color: as.color }}>
                  {j.approval}
                </span>

                {/* Actions */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-[#F0EFE9]"
                      style={{ color: C.muted }}>
                      <MoreHorizontal size={15} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 rounded-xl">
                    <DropdownMenuItem
                      onClick={() => {
                        setEditing(j);
                        setSheetOpen(true);
                      }}
                      className="text-xs cursor-pointer">
                      <Pencil size={13} className="mr-2" /> Edit Job
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />

                    {/* Quick status */}
                    <DropdownMenuLabel
                      className="text-[10px] font-semibold uppercase tracking-widest px-2 py-1"
                      style={{ color: C.muted }}>
                      Set Status
                    </DropdownMenuLabel>
                    {ALL_STATUSES.filter((s) => s !== j.status).map((s) => {
                      const st = STATUS_STYLES[s];
                      return (
                        <DropdownMenuItem
                          key={s}
                          onClick={() => quickPatch(j, { status: s })}
                          className="text-xs cursor-pointer">
                          <span
                            className="w-1.5 h-1.5 rounded-full mr-2 flex-shrink-0"
                            style={{ background: st.dot }}
                          />
                          {s}
                        </DropdownMenuItem>
                      );
                    })}
                    <DropdownMenuSeparator />

                    {/* Quick approval */}
                    <DropdownMenuLabel
                      className="text-[10px] font-semibold uppercase tracking-widest px-2 py-1"
                      style={{ color: C.muted }}>
                      Set Approval
                    </DropdownMenuLabel>
                    {ALL_APPROVALS.filter((a) => a !== j.approval).map((a) => {
                      const ap = APPROVAL_STYLES[a];
                      return (
                        <DropdownMenuItem
                          key={a}
                          onClick={() => handleApprovalClick(j, a)}
                          className="text-xs cursor-pointer"
                          style={{ color: ap.color }}>
                          {a}
                        </DropdownMenuItem>
                      );
                    })}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setDeleteTarget(j)}
                      className="text-xs cursor-pointer text-red-500 focus:text-red-500">
                      <Trash2 size={13} className="mr-2" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            );
          })
        )}
      </div>

      <JobSheet
        open={sheetOpen}
        onClose={() => {
          setSheetOpen(false);
          setEditing(null);
        }}
        editing={editing}
        onSave={handleSave}
        clients={clients}
        vehicles={vehicles}
        staff={staff}
        currentUserId={currentUserId}
      />
      <DeleteDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        job={deleteTarget}
        onConfirm={handleDelete}
      />
    </div>
  );
}
