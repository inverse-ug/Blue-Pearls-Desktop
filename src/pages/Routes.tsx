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
  Upload,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Route,
  ArrowRight,
  Check,
  AlertCircle,
  FileSpreadsheet,
  Columns,
  CheckCircle2,
  Truck,
  RefreshCw,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";

// ── Config ────────────────────────────────────────────────────────────────────
const API_URL = "https://blue-pearls-server.vercel.app";
const SKY = "#06a3d8";

// ── Types ─────────────────────────────────────────────────────────────────────
export interface AppRoute {
  id: number;
  laneName?: string | null;
  laneCode?: string | null;
  sfrCode?: string | null;
  destination: string;
  truckSize: string;
  distanceKm?: number | null;
  origin?: string | null;
  category?: string | null;
  routeType: "UP_COUNTRY" | "LOCAL" | "CROSS_BORDER";
  notes?: string | null;
  clientId: number;
  clientName?: string;
  importSource?: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface ClientOption {
  id: number;
  name: string;
  address?: string | null;
}

type SortKey =
  | "laneName"
  | "laneCode"
  | "clientName"
  | "createdAt"
  | "destination";
type SortDir = "asc" | "desc";

const ROUTE_TYPES = [
  { value: "UP_COUNTRY", label: "Up Country" },
  { value: "LOCAL", label: "Local" },
  { value: "CROSS_BORDER", label: "Cross Border" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

const authHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem("bp_token")}`,
  "Content-Type": "application/json",
});

const authHeaderOnly = () => ({
  Authorization: `Bearer ${localStorage.getItem("bp_token")}`,
});

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
      style={{ color: active ? "#0f172a" : "#64748b" }}>
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

// ── Truck Size Badge ──────────────────────────────────────────────────────────
function TruckSizeBadge({ size }: { size?: string | null }) {
  if (!size) return <span className="text-slate-400 text-xs">—</span>;
  return (
    <span
      className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold"
      style={{ background: `${SKY}18`, color: SKY }}>
      <Truck size={9} />
      {size}
    </span>
  );
}

// ── Route Form Schema ─────────────────────────────────────────────────────────
const routeSchema = z.object({
  clientId: z.coerce.number().min(1, "Client is required"),
  laneName: z.string().optional().nullable(),
  laneCode: z.string().optional().nullable(),
  sfrCode: z.string().optional().nullable(),
  destination: z.string().min(1, "Destination is required"),
  truckSize: z.string().min(1, "Truck size is required"),
  distanceKm: z.coerce.number().positive().optional().nullable(),
  origin: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  routeType: z
    .enum(["UP_COUNTRY", "LOCAL", "CROSS_BORDER"])
    .default("UP_COUNTRY"),
  notes: z.string().optional().nullable(),
});

type RouteFormData = z.infer<typeof routeSchema>;

// ── Route Sheet (Add / Edit) ──────────────────────────────────────────────────
function RouteSheet({
  open,
  onClose,
  editing,
  onSave,
  clients,
}: {
  open: boolean;
  onClose: () => void;
  editing: AppRoute | null;
  onSave: (data: RouteFormData, id?: number) => Promise<void>;
  clients: ClientOption[];
}) {
  const [isSaving, setIsSaving] = useState(false);

  const blank = (): RouteFormData => ({
    clientId: 0,
    laneName: null,
    laneCode: null,
    sfrCode: null,
    destination: "",
    truckSize: "",
    distanceKm: null,
    origin: "",
    category: null,
    routeType: "UP_COUNTRY",
    notes: null,
  });

  const {
    control,
    handleSubmit,
    reset,
    register,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RouteFormData>({
    //@ts-ignore - Zod schema has some conditional logic that RHF's type inference can't handle perfectly
    resolver: zodResolver(routeSchema) as any,
    defaultValues: blank(),
  });

  useEffect(() => {
    if (open) {
      if (editing) {
        reset({
          clientId: editing.clientId,
          laneName: editing.laneName ?? null,
          laneCode: editing.laneCode ?? null,
          sfrCode: editing.sfrCode ?? null,
          destination: editing.destination,
          truckSize: editing.truckSize,
          distanceKm: editing.distanceKm ?? null,
          origin: editing.origin ?? "",
          category: editing.category ?? null,
          routeType: editing.routeType,
          notes: editing.notes ?? null,
        });
      } else {
        reset(blank());
      }
    }
  }, [open, editing]);

  // Auto-fill origin from the selected client's address when adding a new lane
  const watchedClientId = watch("clientId");
  useEffect(() => {
    if (!editing && watchedClientId) {
      const client = clients.find((c) => c.id === watchedClientId);
      if (client?.address) {
        setValue("origin", client.address, { shouldDirty: false });
      }
    }
  }, [watchedClientId, editing, clients]);

  async function onSubmit(data: RouteFormData) {
    setIsSaving(true);
    try {
      await onSave(data, editing?.id);
      onClose();
    } finally {
      setIsSaving(false);
    }
  }

  function handleClose() {
    if (isSaving) return;
    reset(blank());
    onClose();
  }

  return (
    <Sheet open={open} onOpenChange={(o) => !o && handleClose()}>
      <SheetContent className="w-[560px] sm:max-w-[560px] overflow-y-auto !p-0">
        <div className="sticky top-0 bg-white z-20 px-7 py-5 border-b">
          <SheetTitle className="text-xl font-bold text-slate-900">
            {editing ? "Edit Lane" : "Add New Lane"}
          </SheetTitle>
          <SheetDescription className="text-sm text-slate-500 mt-0.5">
            {editing
              ? `Editing ${editing.laneName}`
              : "Define a transport lane"}
          </SheetDescription>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="p-7 space-y-5">
          {/* Client */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-slate-700">
              Client <span className="text-red-500">*</span>
            </Label>
            <Controller
              name="clientId"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value ? String(field.value) : ""}
                  onValueChange={(v) => field.onChange(parseInt(v))}>
                  <SelectTrigger
                    className={`h-10 rounded-xl text-sm ${errors.clientId ? "border-red-500" : ""}`}>
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.clientId && (
              <p className="text-xs text-red-500">{errors.clientId.message}</p>
            )}
          </div>

          {/* Lane Name */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-slate-700">
              Lane Name
            </Label>
            <Input
              {...register("laneName")}
              placeholder="e.g. F26 - ROAD FREIGHT-KAMPALA TO - MBARARA"
              className="h-10 rounded-xl text-sm"
            />
          </div>

          {/* Lane Code + SFR Code + Route Type */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700">
                Lane Code
              </Label>
              <Input
                {...register("laneCode")}
                placeholder="e.g. F26"
                className="h-10 rounded-xl text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700">
                SFR Code
              </Label>
              <Input
                {...register("sfrCode")}
                placeholder="e.g. SFR4"
                className="h-10 rounded-xl text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700">
                Route Type
              </Label>
              <Controller
                name="routeType"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="h-10 rounded-xl text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROUTE_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          {/* Origin + Destination */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <div className="flex items-baseline gap-1.5">
                <Label className="text-xs font-medium text-slate-700">
                  Origin
                </Label>
                {!editing &&
                  watchedClientId &&
                  clients.find((c) => c.id === watchedClientId)?.address && (
                    <span className="text-[10px] text-slate-400">
                      auto-filled from client
                    </span>
                  )}
              </div>
              <Input
                {...register("origin")}
                placeholder="e.g. Kampala"
                className="h-10 rounded-xl text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700">
                Destination <span className="text-red-500">*</span>
              </Label>
              <Input
                {...register("destination")}
                placeholder="e.g. Mbarara"
                className={`h-10 rounded-xl text-sm ${errors.destination ? "border-red-500" : ""}`}
              />
              {errors.destination && (
                <p className="text-xs text-red-500">
                  {errors.destination.message}
                </p>
              )}
            </div>
          </div>

          {/* Truck Size + Distance */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700">
                Truck Size <span className="text-red-500">*</span>
              </Label>
              <Input
                {...register("truckSize")}
                placeholder="e.g. 30T"
                className={`h-10 rounded-xl text-sm ${errors.truckSize ? "border-red-500" : ""}`}
              />
              {errors.truckSize && (
                <p className="text-xs text-red-500">
                  {errors.truckSize.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700">
                Distance (km)
              </Label>
              <Controller
                name="distanceKm"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    type="number"
                    placeholder="e.g. 270"
                    className="h-10 rounded-xl text-sm"
                    onChange={(e) =>
                      field.onChange(
                        e.target.value ? parseFloat(e.target.value) : null,
                      )
                    }
                  />
                )}
              />
            </div>
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-slate-700">
              Category
            </Label>
            <Input
              {...register("category")}
              placeholder="e.g. Spirits, General Freight"
              className="h-10 rounded-xl text-sm"
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-slate-700">Notes</Label>
            <textarea
              {...register("notes")}
              placeholder="Any special instructions or notes…"
              rows={3}
              className="w-full rounded-xl text-sm border border-input bg-background px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-white pt-5 border-t flex gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={isSaving}
              onClick={handleClose}
              className="flex-1 rounded-xl h-11">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="flex-1 rounded-xl h-11 text-white font-semibold"
              style={{ background: SKY }}>
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : editing ? (
                "Save Changes"
              ) : (
                "Add Lane"
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}

// ── Import Wizard ─────────────────────────────────────────────────────────────
type ImportStep = "upload" | "map" | "importing" | "done";

interface PreviewData {
  columns: string[];
  preview: Record<string, any>[];
  totalRows: number;
}

interface ImportResult {
  total: number;
  successful: number;
  failed: number;
  errors: any[];
  hasMoreErrors?: boolean;
}

// System fields with all optional fields included
const SYSTEM_FIELDS = [
  { key: "destination", label: "Destination", required: true },
  { key: "truckSize", label: "Truck Size", required: true },
  { key: "laneName", label: "Lane Name", required: false },
  { key: "distanceKm", label: "Distance (km)", required: false },
  { key: "laneCode", label: "Lane Code", required: false },
  { key: "sfrCode", label: "SFR Code", required: false },
  { key: "origin", label: "Origin", required: false },
  { key: "category", label: "Category", required: false },
  { key: "routeType", label: "Route Type", required: false },
  { key: "notes", label: "Notes", required: false },
];

function ImportWizard({
  open,
  onClose,
  clients,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  clients: ClientOption[];
  onDone: () => void;
}) {
  const [step, setStep] = useState<ImportStep>("upload");
  const [selectedClient, setSelectedClient] = useState<number | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [dragging, setDragging] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  // Derive the selected client's address to use as the default origin
  const selectedClientData =
    clients.find((c) => c.id === selectedClient) ?? null;
  const clientDefaultOrigin = selectedClientData?.address ?? null;

  useEffect(() => {
    if (!open) {
      setStep("upload");
      setFile(null);
      setPreview(null);
      setMapping({});
      setResult(null);
      setSelectedClient(null);
    }
  }, [open]);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) setFile(f);
  }

  // Auto-map columns by fuzzy matching field keys against column names
  function autoMap(columns: string[]): Record<string, string> {
    const result: Record<string, string> = {};
    const aliases: Record<string, string[]> = {
      laneName: [
        "lane name",
        "lane",
        "route name",
        "name",
        "description",
        "lane_name",
      ],
      destination: ["destination", "dest", "to", "delivery location"],
      truckSize: [
        "truck size",
        "truck",
        "size",
        "tonnage",
        "capacity",
        "trucksize",
        "truck_size",
        "vehicle size",
      ],
      distanceKm: [
        "distance",
        "km",
        "dist",
        "distancekm",
        "distance_km",
        "kms",
        "kilometers",
      ],
      laneCode: ["lane code", "code", "lanecode", "lane_code", "route code"],
      sfrCode: ["sfr code", "sfr", "sfrcode", "sfr_code"],
      origin: ["origin", "from", "source", "pickup", "pick up"],
      category: ["category", "cat", "type", "freight type", "cargo type"],
      routeType: ["route type", "routetype", "route_type", "type of route"],
      notes: ["notes", "note", "remarks", "instructions", "comments"],
    };

    SYSTEM_FIELDS.forEach(({ key }) => {
      const keyAliases = aliases[key] || [];
      const match = columns.find((col) => {
        const normalized = col
          .toLowerCase()
          .replace(/[\s_-]/g, " ")
          .trim();
        return keyAliases.some(
          (alias) => normalized === alias || normalized.includes(alias),
        );
      });
      if (match) result[key] = match;
    });

    return result;
  }

  async function handlePreview() {
    if (!file || !selectedClient) {
      toast.error("Select a client and upload a file first");
      return;
    }
    setIsLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`${API_URL}/routes/preview`, {
        method: "POST",
        headers: authHeaderOnly(),
        body: fd,
      });
      if (!res.ok) throw new Error("Preview failed");
      const data: PreviewData = await res.json();
      setPreview(data);
      setMapping(autoMap(data.columns));
      setStep("map");
    } catch {
      toast.error("Failed to read file. Make sure it's a valid Excel or CSV.");
    } finally {
      setIsLoading(false);
    }
  }

  // Check required fields are mapped before allowing import
  const requiredMapped = SYSTEM_FIELDS.filter((f) => f.required).every(
    (f) => !!mapping[f.key],
  );

  async function handleImport() {
    if (!selectedClient || !file) return;
    setStep("importing");
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("clientId", String(selectedClient));
      fd.append("mapping", JSON.stringify(mapping));
      // Send the client's address as the fallback origin for rows where no origin column is mapped
      if (clientDefaultOrigin && !mapping["origin"]) {
        fd.append("defaultOrigin", clientDefaultOrigin);
      }
      const res = await fetch(`${API_URL}/routes/import`, {
        method: "POST",
        headers: authHeaderOnly(),
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Import failed");
      setResult(data);
      setStep("done");
    } catch (e: any) {
      toast.error(e.message || "Import failed");
      setStep("map");
    }
  }

  const stepIndex: Record<ImportStep, number> = {
    upload: 0,
    map: 1,
    importing: 2,
    done: 2,
  };
  const steps = ["Upload File", "Map Columns", "Import"];

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-[700px] sm:max-w-[700px] overflow-hidden flex flex-col !p-0">
        {/* Header */}
        <div className="flex-shrink-0 px-7 py-5 border-b">
          <SheetTitle className="text-xl font-bold text-slate-900">
            Bulk Import Lanes
          </SheetTitle>
          <SheetDescription className="text-sm text-slate-500 mt-0.5">
            Upload an Excel or CSV file to import multiple lanes at once
          </SheetDescription>
        </div>

        {/* Step indicator */}
        <div className="flex-shrink-0 px-7 py-4 border-b bg-slate-50">
          <div className="flex items-center">
            {steps.map((label, i) => {
              const current = stepIndex[step];
              const done = i < current;
              const active = i === current;
              return (
                <div
                  key={label}
                  className="flex items-center flex-1 last:flex-none">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all"
                      style={{
                        background: done ? "#16a34a" : active ? SKY : "#e2e8f0",
                        color: done || active ? "white" : "#94a3b8",
                      }}>
                      {done ? <Check size={13} /> : i + 1}
                    </div>
                    <span
                      className="text-xs font-semibold"
                      style={{
                        color: active
                          ? "#0f172a"
                          : done
                            ? "#16a34a"
                            : "#94a3b8",
                      }}>
                      {label}
                    </span>
                  </div>
                  {i < steps.length - 1 && (
                    <div
                      className="flex-1 h-px mx-3"
                      style={{ background: done ? "#16a34a" : "#e2e8f0" }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-7">
            {/* ── STEP 1: Upload ── */}
            {step === "upload" && (
              <div className="space-y-6">
                {/* Client selector */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700">
                    Client <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={selectedClient ? String(selectedClient) : ""}
                    onValueChange={(v) => setSelectedClient(parseInt(v))}>
                    <SelectTrigger className="h-10 rounded-xl text-sm">
                      <SelectValue placeholder="Select client for these routes" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Drop zone */}
                <div
                  ref={dropRef}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragging(true);
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={handleDrop}
                  onClick={() =>
                    document.getElementById("route-import-file")?.click()
                  }
                  className="relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all"
                  style={{
                    borderColor: dragging ? SKY : file ? "#16a34a" : "#e2e8f0",
                    background: dragging
                      ? `${SKY}08`
                      : file
                        ? "#16a34a08"
                        : "#fafaf8",
                  }}>
                  <input
                    id="route-import-file"
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    className="hidden"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                  {file ? (
                    <div className="flex flex-col items-center gap-3">
                      <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center"
                        style={{ background: "#16a34a18" }}>
                        <FileSpreadsheet
                          size={28}
                          style={{ color: "#16a34a" }}
                        />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">
                          {file.name}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {(file.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFile(null);
                        }}
                        className="text-xs text-red-500 hover:underline">
                        Remove file
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center"
                        style={{ background: `${SKY}18` }}>
                        <Upload size={26} style={{ color: SKY }} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          Drop your file here
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          or click to browse · Excel or CSV
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Tips - Updated to show correct required fields */}
                <div className="rounded-xl p-4 bg-slate-50 border border-slate-200 space-y-2">
                  <p className="text-xs font-semibold text-slate-700">
                    File requirements
                  </p>
                  <ul className="text-xs text-slate-500 space-y-1">
                    <li>• First row must be column headers</li>
                    <li>
                      • <strong>Required columns:</strong> Destination, Truck
                      Size
                    </li>
                    <li>
                      • Optional: Lane Name, Lane Code, SFR Code, Origin,
                      Distance (km), Category, Route Type, Notes
                    </li>
                    <li>• Supported formats: .xlsx, .xls, .csv</li>
                  </ul>
                </div>

                <Button
                  onClick={handlePreview}
                  disabled={!file || !selectedClient || isLoading}
                  className="w-full h-11 rounded-xl text-white font-semibold"
                  style={{ background: SKY }}>
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" /> Reading
                      file…
                    </>
                  ) : (
                    <>
                      Continue <ArrowRight size={15} className="ml-2" />
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* ── STEP 2: Map ── */}
            {step === "map" && preview && (
              <div className="space-y-6">
                {/* Summary */}
                <div className="rounded-xl p-4 bg-slate-50 border border-slate-200">
                  <p className="text-xs font-semibold text-slate-700 mb-1">
                    File summary
                  </p>
                  <p className="text-xs text-slate-500">
                    <strong>{preview.totalRows}</strong> rows detected ·{" "}
                    <strong>{preview.columns.length}</strong> columns found
                  </p>
                </div>

                {/* Required fields warning if not all mapped */}
                {!requiredMapped && (
                  <div className="rounded-xl p-3 bg-amber-50 border border-amber-200 flex items-start gap-2">
                    <AlertCircle
                      size={14}
                      className="text-amber-500 flex-shrink-0 mt-0.5"
                    />
                    <p className="text-xs text-amber-700">
                      Map both required fields (marked with{" "}
                      <span className="text-red-500 font-bold">*</span>) before
                      importing.
                    </p>
                  </div>
                )}

                {/* Column mapping */}
                <div>
                  <p className="text-xs font-semibold text-slate-700 mb-3 flex items-center gap-1.5">
                    <Columns size={13} /> Map your columns to system fields
                  </p>
                  <div className="space-y-3">
                    {SYSTEM_FIELDS.map(({ key, label, required }) => (
                      <div key={key}>
                        <div className="grid grid-cols-[1fr,auto,1fr] items-center gap-3">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-medium text-slate-700">
                              {label}
                            </span>
                            {required && (
                              <span className="text-red-500 text-[10px] font-bold">
                                *
                              </span>
                            )}
                          </div>
                          <ArrowRight size={13} className="text-slate-400" />
                          <Select
                            value={mapping[key] || "none"}
                            onValueChange={(v) =>
                              setMapping((prev) => ({
                                ...prev,
                                [key]: v === "none" ? "" : v,
                              }))
                            }>
                            <SelectTrigger
                              className={`h-9 rounded-xl text-sm ${
                                mapping[key]
                                  ? "border-green-400 bg-green-50"
                                  : required
                                    ? "border-amber-300"
                                    : ""
                              }`}>
                              <SelectValue placeholder="Select column…" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">
                                — Not mapped —
                              </SelectItem>
                              {preview.columns.map((col) => (
                                <SelectItem key={col} value={col}>
                                  {col}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        {/* For the origin field, show the client address as the fallback */}
                        {key === "origin" &&
                          clientDefaultOrigin &&
                          !mapping["origin"] && (
                            <p className="text-[11px] text-slate-500 mt-1.5 ml-1 flex items-center gap-1">
                              <span className="inline-block w-1.5 h-1.5 rounded-full bg-sky-400" />
                              Defaults to client address:{" "}
                              <span className="font-medium text-slate-700 ml-0.5">
                                {clientDefaultOrigin}
                              </span>
                            </p>
                          )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Preview table */}
                <div>
                  <p className="text-xs font-semibold text-slate-700 mb-2">
                    Preview (first 5 rows)
                  </p>
                  <div className="rounded-xl border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200">
                          <tr>
                            {preview.columns.slice(0, 6).map((col) => (
                              <th
                                key={col}
                                className="px-3 py-2 text-left font-semibold text-slate-600 whitespace-nowrap">
                                {col}
                              </th>
                            ))}
                            {preview.columns.length > 6 && (
                              <th className="px-3 py-2 text-left text-slate-400">
                                +{preview.columns.length - 6} more
                              </th>
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {preview.preview.map((row, i) => (
                            <tr
                              key={i}
                              className="border-b border-slate-100 last:border-0">
                              {preview.columns.slice(0, 6).map((col) => (
                                <td
                                  key={col}
                                  className="px-3 py-2 text-slate-700 whitespace-nowrap max-w-[140px] truncate">
                                  {String(row[col] ?? "—")}
                                </td>
                              ))}
                              {preview.columns.length > 6 && (
                                <td className="px-3 py-2 text-slate-400">…</td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setStep("upload")}
                    className="flex-1 h-11 rounded-xl">
                    Back
                  </Button>
                  <Button
                    onClick={handleImport}
                    disabled={!requiredMapped}
                    className="flex-[2] h-11 rounded-xl text-white font-semibold"
                    style={{ background: SKY }}>
                    Import {preview.totalRows} Rows{" "}
                    <ArrowRight size={15} className="ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {/* ── STEP 3a: Importing ── */}
            {step === "importing" && (
              <div className="flex flex-col items-center justify-center h-72 gap-6">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{ background: `${SKY}18` }}>
                  <Loader2
                    size={32}
                    className="animate-spin"
                    style={{ color: SKY }}
                  />
                </div>
                <div className="text-center">
                  <p className="text-base font-bold text-slate-900">
                    Importing lanes…
                  </p>
                  <p className="text-sm text-slate-500 mt-1">
                    This may take a moment for large files
                  </p>
                </div>
              </div>
            )}

            {/* ── STEP 3b: Done ── */}
            {step === "done" && result && (
              <div className="flex flex-col items-center gap-6">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{ background: "#16a34a18" }}>
                  <CheckCircle2 size={32} style={{ color: "#16a34a" }} />
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-slate-900">
                    Import Complete
                  </p>
                  <p className="text-sm text-slate-500 mt-1">
                    Your lanes have been imported
                  </p>
                </div>

                <div className="w-full grid grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl border border-slate-200 text-center">
                    <p className="text-2xl font-black text-slate-900">
                      {result.total}
                    </p>
                    <p className="text-xs font-medium text-slate-500 mt-1">
                      Total Rows
                    </p>
                  </div>
                  <div
                    className="p-4 rounded-xl border text-center"
                    style={{
                      borderColor: "#16a34a40",
                      background: "#16a34a08",
                    }}>
                    <p
                      className="text-2xl font-black"
                      style={{ color: "#16a34a" }}>
                      {result.successful}
                    </p>
                    <p className="text-xs font-medium text-slate-500 mt-1">
                      Imported
                    </p>
                  </div>
                  <div
                    className="p-4 rounded-xl border text-center"
                    style={{
                      borderColor: result.failed > 0 ? "#ef444440" : "#e2e8f0",
                      background:
                        result.failed > 0 ? "#ef444408" : "transparent",
                    }}>
                    <p
                      className="text-2xl font-black"
                      style={{
                        color: result.failed > 0 ? "#ef4444" : "#94a3b8",
                      }}>
                      {result.failed}
                    </p>
                    <p className="text-xs font-medium text-slate-500 mt-1">
                      Failed
                    </p>
                  </div>
                </div>

                {result.errors && result.errors.length > 0 && (
                  <div className="w-full rounded-xl border border-red-200 bg-red-50 p-4 space-y-2">
                    <p className="text-xs font-semibold text-red-700 flex items-center gap-1.5">
                      <AlertCircle size={12} /> Errors (first{" "}
                      {result.errors.length}
                      {result.hasMoreErrors ? "+" : ""})
                    </p>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {result.errors.map((e: any, i: number) => (
                        <p key={i} className="text-xs text-red-600">
                          Row {e.row}: {e.error}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                <Button
                  onClick={() => {
                    onDone();
                    onClose();
                  }}
                  className="w-full h-11 rounded-xl text-white font-semibold"
                  style={{ background: SKY }}>
                  Done — View Lanes
                </Button>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ── Delete Dialog ─────────────────────────────────────────────────────────────
function DeleteDialog({
  open,
  onClose,
  route,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  route: AppRoute | null;
  onConfirm: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  async function confirm() {
    setBusy(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setBusy(false);
    }
  }
  return (
    <Dialog open={open} onOpenChange={(o) => !o && !busy && onClose()}>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-slate-900">
            Delete Lane
          </DialogTitle>
          <DialogDescription className="text-slate-500">
            Delete <strong className="text-slate-900">{route?.laneName}</strong>
            ? This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 mt-4">
          <Button
            variant="outline"
            disabled={busy}
            onClick={onClose}
            className="rounded-xl flex-1">
            Cancel
          </Button>
          <Button
            onClick={confirm}
            disabled={busy}
            className="rounded-xl flex-1 text-white"
            style={{ background: "#ef4444" }}>
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete"}
          </Button>
        </DialogFooter>
        <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100">
          <X className="h-4 w-4" />
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}

// ── Routes Page ───────────────────────────────────────────────────────────────
export default function Routes() {
  const [routeList, setRouteList] = useState<AppRoute[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [clientFilter, setClientFilter] = useState<string>("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [sortKey, setSortKey] = useState<SortKey>("laneName");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editing, setEditing] = useState<AppRoute | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AppRoute | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [rRes, cRes] = await Promise.all([
        fetch(`${API_URL}/routes`, { headers: authHeader() }),
        fetch(`${API_URL}/clients`, { headers: authHeader() }),
      ]);
      if (rRes.ok) setRouteList(await rRes.json());
      if (cRes.ok) setClients(await cRes.json());
    } catch {
      toast.error("Failed to load data");
    } finally {
      setIsLoading(false);
    }
  }, []);

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
    let list = routeList.filter((r) => {
      const matchSearch =
        !q ||
        (r.laneName?.toLowerCase() || "").includes(q) ||
        (r.laneCode?.toLowerCase() || "").includes(q) ||
        r.destination.toLowerCase().includes(q) ||
        (r.origin?.toLowerCase() || "").includes(q) ||
        (r.clientName?.toLowerCase() || "").includes(q) ||
        r.truckSize.toLowerCase().includes(q);
      const matchClient =
        clientFilter === "ALL" || String(r.clientId) === clientFilter;
      const matchType = typeFilter === "ALL" || r.routeType === typeFilter;
      return matchSearch && matchClient && matchType;
    });

    list.sort((a, b) => {
      let va = "";
      let vb = "";
      switch (sortKey) {
        case "laneName":
          va = a.laneName || "";
          vb = b.laneName || "";
          break;
        case "laneCode":
          va = a.laneCode ?? "";
          vb = b.laneCode ?? "";
          break;
        case "clientName":
          va = a.clientName ?? "";
          vb = b.clientName ?? "";
          break;
        case "destination":
          va = a.destination;
          vb = b.destination;
          break;
        case "createdAt":
          va = a.createdAt;
          vb = b.createdAt;
          break;
      }
      return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
    });

    return list;
  }, [routeList, search, clientFilter, typeFilter, sortKey, sortDir]);

  async function handleSave(data: RouteFormData, id?: number) {
    const method = id ? "PATCH" : "POST";
    const url = id ? `${API_URL}/routes/${id}` : `${API_URL}/routes`;
    const res = await fetch(url, {
      method,
      headers: authHeader(),
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (res.ok) {
      toast.success(id ? "Lane updated" : "Lane added");
      fetchData();
    } else {
      toast.error(result.error || "Failed to save");
      throw new Error(result.error);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const res = await fetch(`${API_URL}/routes/${deleteTarget.id}`, {
      method: "DELETE",
      headers: authHeaderOnly(),
    });
    if (res.ok) {
      toast.success("Lane deleted");
      fetchData();
    } else {
      toast.error("Failed to delete");
    }
  }

  const typeStyleMap = {
    UP_COUNTRY: { color: "#b8922a", bg: "#E1BA5820", label: "Up Country" },
    LOCAL: { color: "#16a34a", bg: "#16a34a18", label: "Local" },
    CROSS_BORDER: { color: "#8b5cf6", bg: "#8b5cf618", label: "Cross Border" },
  };

  return (
    <div className="h-full overflow-auto px-6 pt-5 pb-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <p className="text-xs font-medium mb-1 text-slate-500">
            {new Date().toLocaleDateString("en-GB", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">
            Lanes
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setImportOpen(true)}
            variant="outline"
            className="flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-semibold border-slate-200">
            <Upload size={14} /> Bulk Import
          </Button>
          <Button
            onClick={() => {
              setEditing(null);
              setSheetOpen(true);
            }}
            className="flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-semibold text-white"
            style={{ background: SKY }}>
            <Plus size={15} /> Add Lane
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          {
            label: "Total Lanes",
            value: routeList.length,
            color: SKY,
            bg: `${SKY}18`,
          },
          {
            label: "Up Country",
            value: routeList.filter((r) => r.routeType === "UP_COUNTRY").length,
            color: "#b8922a",
            bg: "#E1BA5820",
          },
          {
            label: "Local",
            value: routeList.filter((r) => r.routeType === "LOCAL").length,
            color: "#16a34a",
            bg: "#16a34a18",
          },
          {
            label: "Cross Border",
            value: routeList.filter((r) => r.routeType === "CROSS_BORDER")
              .length,
            color: "#8b5cf6",
            bg: "#8b5cf618",
          },
        ].map(({ label, value, color, bg }) => (
          <div
            key={label}
            className="rounded-2xl p-4 bg-white border border-slate-200">
            <div className="flex items-start justify-between mb-3">
              <p className="text-xs font-medium text-slate-500">{label}</p>
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: bg }}>
                <Route size={13} style={{ color }} />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900">{value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="rounded-2xl p-4 mb-4 flex items-center gap-3 flex-wrap bg-white border border-slate-200">
        <div className="relative flex-1 min-w-[200px]">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search lane, code, destination…"
            className="pl-9 h-9 rounded-xl text-sm border-0 bg-[#F5F4EF]"
          />
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <Filter size={13} className="text-slate-500" />
          <Select value={clientFilter} onValueChange={setClientFilter}>
            <SelectTrigger className="h-9 rounded-xl text-xs w-40 border-0 bg-[#F5F4EF]">
              <SelectValue placeholder="All Clients" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Clients</SelectItem>
              {clients.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="h-9 rounded-xl text-xs w-36 border-0 bg-[#F5F4EF]">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Types</SelectItem>
              {ROUTE_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <button
            onClick={fetchData}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-[#F5F4EF] text-slate-500 hover:text-slate-800 transition-colors">
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden min-h-[400px] bg-white border border-slate-200">
        {/* Table Header */}
        <div
          className="grid px-5 py-3 bg-[#FAFAF8] border-b border-slate-200"
          style={{
            gridTemplateColumns: "90px 2.5fr 1.2fr 1.4fr 90px 100px 52px",
          }}>
          <SortHeader
            label="Code"
            sortKey="laneCode"
            current={sortKey}
            dir={sortDir}
            onSort={handleSort}
          />
          <SortHeader
            label="Lane Name"
            sortKey="laneName"
            current={sortKey}
            dir={sortDir}
            onSort={handleSort}
          />
          <SortHeader
            label="Client"
            sortKey="clientName"
            current={sortKey}
            dir={sortDir}
            onSort={handleSort}
          />
          <SortHeader
            label="Destination"
            sortKey="destination"
            current={sortKey}
            dir={sortDir}
            onSort={handleSort}
          />
          <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
            Truck
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
            Type
          </span>
          <span />
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-3">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: SKY }} />
            <p className="text-sm font-medium text-slate-500">Loading lanes…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
            <div className="w-16 h-16 rounded-full bg-[#F5F4EF] flex items-center justify-center mb-4">
              <Route size={28} className="text-slate-400" />
            </div>
            <h3 className="text-base font-bold mb-1 text-slate-900">
              No Lanes Found
            </h3>
            <p className="text-sm max-w-[280px] leading-relaxed mb-6 text-slate-500">
              {search || clientFilter !== "ALL" || typeFilter !== "ALL"
                ? "No results match your filters."
                : "No lanes yet. Add one or bulk import from a spreadsheet."}
            </p>
            {!search && clientFilter === "ALL" && typeFilter === "ALL" && (
              <div className="flex gap-2">
                <Button
                  onClick={() => setImportOpen(true)}
                  variant="outline"
                  className="rounded-xl h-9 px-4">
                  <Upload size={13} className="mr-1.5" /> Import
                </Button>
                <Button
                  onClick={() => {
                    setEditing(null);
                    setSheetOpen(true);
                  }}
                  className="rounded-xl h-9 px-4 text-white"
                  style={{ background: SKY }}>
                  <Plus size={13} className="mr-1.5" /> Add Lane
                </Button>
              </div>
            )}
          </div>
        ) : (
          filtered.map((r, i) => {
            const ts = typeStyleMap[r.routeType];
            return (
              <div
                key={r.id}
                className="grid items-center px-5 py-3.5 transition-colors hover:bg-[#F5F4EF]"
                style={{
                  gridTemplateColumns: "90px 2.5fr 1.2fr 1.4fr 90px 100px 52px",
                  borderBottom:
                    i < filtered.length - 1 ? "1px solid #e2e8f0" : "none",
                }}>
                {/* Code */}
                <p className="text-[11px] font-mono font-bold text-slate-500 truncate">
                  {r.laneCode ?? "—"}
                </p>

                {/* Lane name */}
                <div className="min-w-0 pr-3">
                  <p className="text-sm font-semibold truncate text-slate-900">
                    {r.laneName || r.destination}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {r.distanceKm && (
                      <p className="text-[10px] text-slate-400">
                        {r.distanceKm} km
                      </p>
                    )}
                    {r.origin && (
                      <p className="text-[10px] text-slate-400">
                        from {r.origin}
                      </p>
                    )}
                    {r.sfrCode && (
                      <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-md bg-purple-50 text-purple-500">
                        SFR: {r.sfrCode}
                      </span>
                    )}
                    {r.category && (
                      <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500">
                        {r.category}
                      </span>
                    )}
                  </div>
                </div>

                {/* Client */}
                <p className="text-xs truncate text-slate-700">
                  {r.clientName ?? "—"}
                </p>

                {/* Destination */}
                <div className="flex items-center gap-1 min-w-0">
                  <ArrowRight
                    size={10}
                    className="text-slate-300 flex-shrink-0"
                  />
                  <span className="text-xs text-slate-700 truncate">
                    {r.destination}
                  </span>
                </div>

                {/* Truck size */}
                <TruckSizeBadge size={r.truckSize} />

                {/* Type */}
                <span
                  className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold w-fit"
                  style={{ background: ts.bg, color: ts.color }}>
                  {ts.label}
                </span>

                {/* Actions */}
                <div onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#F0EFE9] text-slate-500">
                        <MoreHorizontal size={15} />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-36 rounded-xl">
                      <DropdownMenuItem
                        onClick={() => {
                          setEditing(r);
                          setSheetOpen(true);
                        }}
                        className="text-xs cursor-pointer">
                        <Pencil size={13} className="mr-2" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setDeleteTarget(r)}
                        className="text-xs cursor-pointer text-red-500 focus:text-red-500">
                        <Trash2 size={13} className="mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modals */}
      <RouteSheet
        open={sheetOpen}
        onClose={() => {
          setSheetOpen(false);
          setEditing(null);
        }}
        editing={editing}
        onSave={handleSave}
        clients={clients}
      />

      <ImportWizard
        open={importOpen}
        onClose={() => setImportOpen(false)}
        clients={clients}
        onDone={fetchData}
      />

      <DeleteDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        route={deleteTarget}
        onConfirm={handleDelete}
      />
    </div>
  );
}
