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
  Fuel,
  Gauge,
  Calendar,
  DollarSign,
  FileText,
  MapPin,
  Building2,
  Eye,
  Route,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  DialogClose,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
  SheetClose,
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
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// ── Config ────────────────────────────────────────────────────────────────────
const API_URL = "https://blue-pearls-server.vercel.app";
const SKY_BLUE = "#06a3d8";

// ── Types ─────────────────────────────────────────────────────────────────────
export type JobStatus =
  | "Scheduled"
  | "Ongoing"
  | "Completed"
  | "Missed"
  | "Cancelled";
export type ApprovalStatus = "Requested" | "Approved" | "Rejected";

export interface Cost {
  id: string;
  description: string;
  amount: number;
  category?: string;
}

export interface Route {
  id: number;
  routeCode: string;
  routeName: string;
  laneName?: string;
  origin: string;
  destination: string;
  distanceKm?: number | null;
  duration?: string | null;
  truckSizeRequired?: string | null;
  routeType: "UP_COUNTRY" | "LOCAL" | "CROSS_BORDER";
  category?: string | null;
  subCategory?: string | null;
  typicalTransitTime?: number | null;
  allowedCargoTypes?: string[] | null;
  baseRate?: number | null;
  ratePerKm?: number | null;
  fuelSurcharge?: number | null;
  rates?: RouteRate[];
}

export interface RouteRate {
  id: number;
  routeId: number;
  vehicleType: string;
  truckSize?: string | null;
  ratePerTrip: number;
  ratePerKm?: number | null;
  fuelSurcharge: number;
  minimumCharge?: number | null;
  maximumCharge?: number | null;
}

export interface Job {
  id: number;
  status: JobStatus;
  approval: ApprovalStatus;
  clientId: number;
  routeId?: number | null;
  vehicleId?: number | null;
  driverId?: number | null;
  requestedById?: number | null;
  scheduledAt: string;
  dueAt?: string | null;
  completedAt?: string | null;
  tonnage: string;
  cargoType?: string | null;
  pickupLocation?: string | null;
  deliveryLocation?: string | null;
  description?: string | null;
  gateOdometer?: number | null;
  gateFuelGauge?: string | null;
  stationOdometer?: number | null;
  stationOdometerImageUrl?: string | null;
  stationFuelGauge?: string | null;
  stationFuelGaugeImageUrl?: string | null;
  receiptUrl?: string | null;
  income?: number | null;
  costs?: Cost[];
  createdAt: string;
  // joined
  clientName?: string;
  routeName?: string;
  vehiclePlate?: string;
  driverName?: string;
  requestedByName?: string;
}

export interface ClientOption {
  id: number;
  name: string;
  phone?: string;
  email?: string;
}
export interface VehicleOption {
  id: number;
  numberPlate: string;
  vehicleType: string;
  truckCapacity?: string | null;
  defaultDriverId?: number | null;
  fuelType?: string;
}
export interface StaffOption {
  id: number;
  name: string;
  avatarUrl?: string | null;
  department?: string | null;
  role?: string;
}

type SortKey =
  | "scheduledAt"
  | "status"
  | "approval"
  | "clientName"
  | "id"
  | "routeName";
type SortDir = "asc" | "desc";

// ── Style maps ─────────────────────────────────────────────────────────────────
const STATUS_STYLES: Record<
  JobStatus,
  { color: string; bg: string; icon: React.ElementType; dot: string }
> = {
  Scheduled: {
    color: SKY_BLUE,
    bg: `${SKY_BLUE}18`,
    icon: Clock,
    dot: SKY_BLUE,
  },
  Ongoing: {
    color: "#b8922a",
    bg: "#E1BA5820",
    icon: AlertCircle,
    dot: "#b8922a",
  },
  Completed: {
    color: "#16a34a",
    bg: "#16a34a18",
    icon: CheckCircle2,
    dot: "#16a34a",
  },
  Missed: { color: "#ef4444", bg: "#ef444418", icon: XCircle, dot: "#ef4444" },
  Cancelled: {
    color: "#6b7280",
    bg: "#6b728018",
    icon: XCircle,
    dot: "#6b7280",
  },
};

const APPROVAL_STYLES: Record<ApprovalStatus, { color: string; bg: string }> = {
  Requested: { color: "#b8922a", bg: "#E1BA5820" },
  Approved: { color: "#16a34a", bg: "#16a34a18" },
  Rejected: { color: "#ef4444", bg: "#ef444418" },
};

const ALL_STATUSES: JobStatus[] = [
  "Scheduled",
  "Ongoing",
  "Completed",
  "Missed",
  "Cancelled",
];
const ALL_APPROVALS: ApprovalStatus[] = ["Requested", "Approved", "Rejected"];
const FUEL_GAUGES = ["Empty", "1/4", "1/2", "3/4", "Full"];
const CARGO_TYPES = [
  "General",
  "Perishable",
  "Fragile",
  "Hazardous",
  "Livestock",
  "Heavy Equipment",
  "Spirits",
  "Fuel",
  "Construction Materials",
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
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

function formatCurrency(amount: number | null | undefined) {
  if (!amount) return "—";
  return new Intl.NumberFormat("en-UG", {
    style: "currency",
    currency: "UGX",
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatDistance(km: number | null | undefined) {
  if (!km) return "—";
  return `${km.toLocaleString()} km`;
}

// ── Schema ────────────────────────────────────────────────────────────────────
const costSchema = z.object({
  id: z.string(),
  description: z.string().min(1, "Description required"),
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
  category: z.string().optional(),
});

const jobSchema = z.object({
  clientId: z.coerce.number().min(1, "Client is required"),
  routeId: z.coerce.number().nullable().optional(),
  vehicleId: z.coerce.number().nullable().optional(),
  driverId: z.coerce.number().nullable().optional(),
  requestedById: z.coerce.number().nullable().optional(),
  scheduledAt: z.string().min(1, "Start date is required"),
  dueAt: z.string().min(1, "End date is required"),
  completedAt: z.string().optional().nullable(),
  tonnage: z.string().min(1, "Tonnage is required"),
  cargoType: z.string().optional().nullable(),
  pickupLocation: z.string().optional().nullable(),
  deliveryLocation: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  gateOdometer: z.coerce.number().nullable().optional(),
  gateFuelGauge: z.string().optional().nullable(),
  stationOdometer: z.coerce.number().nullable().optional(),
  stationFuelGauge: z.string().optional().nullable(),
  income: z.coerce.number().nullable().optional(),
  costs: z.array(costSchema).optional().default([]),
  status: z.enum(["Scheduled", "Ongoing", "Completed", "Missed", "Cancelled"]),
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

// ── Route Selector Component ──────────────────────────────────────────────────
function RouteSelector({
  value,
  onChange,
  routes,
  clientId,
  label,
  placeholder = "Select route",
  required = false,
  disabled = false,
  onLoadRoutes,
}: {
  value: number | null;
  onChange: (routeId: number | null, route?: Route) => void;
  routes: Route[];
  clientId: number | null;
  label: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  onLoadRoutes?: (clientId: number) => Promise<void>;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedRoute = useMemo(
    () => routes.find((r) => r.id === value) ?? null,
    [value, routes],
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

  const filteredRoutes = useMemo(() => {
    if (!search) return routes;
    const q = search.toLowerCase();
    return routes.filter(
      (r) =>
        r.routeName.toLowerCase().includes(q) ||
        r.routeCode.toLowerCase().includes(q) ||
        r.origin.toLowerCase().includes(q) ||
        r.destination.toLowerCase().includes(q) ||
        (r.category?.toLowerCase() || "").includes(q),
    );
  }, [routes, search]);

  const handleRefresh = async () => {
    if (clientId && onLoadRoutes) {
      setLoading(true);
      await onLoadRoutes(clientId);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-1.5 relative" ref={containerRef}>
      <Label className="text-xs font-medium text-slate-700">
        {label}
        {required && " *"}
      </Label>

      {selectedRoute ? (
        <div
          className="flex items-center justify-between p-2 rounded-xl cursor-pointer hover:bg-[#F5F4EF] transition-colors border border-slate-200"
          onClick={() => !disabled && setIsOpen(true)}>
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-[#E1BA5820] flex items-center justify-center flex-shrink-0">
              <Route size={14} style={{ color: "#b8922a" }} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">
                {selectedRoute.routeName}
              </p>
              <p className="text-[10px] text-slate-500">
                {selectedRoute.origin} → {selectedRoute.destination}
                {selectedRoute.distanceKm &&
                  ` · ${selectedRoute.distanceKm} km`}
              </p>
            </div>
          </div>
          {!disabled && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange(null);
              }}
              className="text-red-500 hover:bg-red-50 p-1 rounded-lg transition-colors">
              <X size={14} />
            </button>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          disabled={disabled || !clientId}
          className="w-full flex items-center gap-2 justify-center h-10 rounded-xl text-sm font-medium border-dashed border-2 transition-colors hover:bg-[#F5F4EF] disabled:opacity-50 disabled:cursor-not-allowed border-slate-300 text-slate-500">
          <Route size={14} />{" "}
          {!clientId ? "Select a client first" : placeholder}
        </button>
      )}

      {isOpen && clientId && (
        <div className="absolute z-50 mt-1 w-full bg-white rounded-xl shadow-lg border border-slate-200">
          <div className="p-2">
            <div className="flex items-center gap-1 mb-2">
              <div className="relative flex-1">
                <Search
                  size={14}
                  className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <Input
                  placeholder="Search routes..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-7 h-8 text-sm bg-[#F5F4EF] border-0"
                  autoFocus
                />
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={handleRefresh}
                      disabled={loading}
                      className="p-1.5 rounded-lg hover:bg-[#F5F4EF] transition-colors">
                      <RefreshCw
                        size={14}
                        className={loading ? "animate-spin" : ""}
                      />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Refresh routes</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <ScrollArea className="max-h-60">
              {filteredRoutes.length > 0 ? (
                filteredRoutes.map((route) => (
                  <button
                    key={route.id}
                    type="button"
                    onClick={() => {
                      onChange(route.id, route);
                      setIsOpen(false);
                      setSearch("");
                    }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-[#F5F4EF] rounded-lg transition-colors">
                    <div className="flex items-start gap-2">
                      <div className="w-6 h-6 rounded-lg bg-[#E1BA5820] flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Route size={12} style={{ color: "#b8922a" }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900">
                          {route.routeName}
                          {route.routeCode && (
                            <span className="ml-1 text-[10px] text-slate-500">
                              ({route.routeCode})
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-slate-600">
                          {route.origin} → {route.destination}
                        </p>
                        {(route.distanceKm || route.truckSizeRequired) && (
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            {route.distanceKm && `${route.distanceKm} km`}
                            {route.distanceKm &&
                              route.truckSizeRequired &&
                              " · "}
                            {route.truckSizeRequired &&
                              `Req: ${route.truckSizeRequired}`}
                          </p>
                        )}
                        {route.baseRate && (
                          <p className="text-[10px] font-semibold text-green-600 mt-1">
                            Base rate: {formatCurrency(route.baseRate)}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-center py-6">
                  <Route size={24} className="mx-auto mb-2 text-slate-300" />
                  <p className="text-xs text-slate-500">No routes found</p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Import routes for this client first
                  </p>
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      )}
    </div>
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
    let filtered = staff;
    if (filterByDepartment) {
      filtered = filtered.filter((s) => s.department === filterByDepartment);
    }
    return filtered;
  }, [staff, filterByDepartment]);

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
      <Label className="text-xs font-medium text-slate-700">
        {label}
        {required && " *"}
      </Label>

      {selectedStaff ? (
        <div
          className="flex items-center justify-between p-2 rounded-xl cursor-pointer hover:bg-[#F5F4EF] transition-colors border border-slate-200"
          onClick={() => setIsOpen(true)}>
          <div className="flex items-center gap-2">
            <Avatar className="w-7 h-7">
              <AvatarImage src={selectedStaff.avatarUrl || ""} />
              <AvatarFallback
                className="text-xs font-bold text-white"
                style={{ background: SKY_BLUE }}>
                {getInitials(selectedStaff.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-semibold text-slate-900">
                {selectedStaff.name}
              </p>
              {selectedStaff.department && (
                <p className="text-[10px] text-slate-500">
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
          className="w-full flex items-center gap-2 justify-center h-10 rounded-xl text-sm font-medium border-dashed border-2 transition-colors hover:bg-[#F5F4EF] border-slate-300 text-slate-500">
          <User size={14} /> {placeholder}
        </button>
      )}

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white rounded-xl shadow-lg border border-slate-200">
          <div className="p-2">
            <div className="relative mb-2">
              <Search
                size={14}
                className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <Input
                placeholder="Search staff..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-7 h-8 text-sm bg-[#F5F4EF] border-0"
                autoFocus
              />
            </div>
            <ScrollArea className="max-h-48">
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
                      <AvatarImage src={s.avatarUrl || ""} />
                      <AvatarFallback
                        className="text-xs font-bold text-white"
                        style={{ background: SKY_BLUE }}>
                        {getInitials(s.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm text-slate-900">{s.name}</p>
                      {s.department && (
                        <p className="text-[10px] text-slate-500">
                          {s.department}
                        </p>
                      )}
                    </div>
                  </button>
                ))
              ) : (
                <p className="text-xs text-center py-2 text-slate-500">
                  No staff found
                </p>
              )}
            </ScrollArea>
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
        <Label className="text-xs font-medium text-slate-700">
          Costs (Optional)
        </Label>
        <button
          type="button"
          onClick={addCost}
          className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg hover:bg-[#F5F4EF] transition-colors"
          style={{ color: SKY_BLUE }}>
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
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] font-semibold pointer-events-none select-none text-slate-500">
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
        <p className="text-xs italic text-slate-500">
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
    <Label className="text-xs font-medium text-slate-700">
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

// ── Job Detail Modal ──────────────────────────────────────────────────────────
function JobDetailModal({
  open,
  onClose,
  job,
  routes = [],
}: {
  open: boolean;
  onClose: () => void;
  job: Job | null;
  routes?: Route[];
}) {
  if (!job) return null;

  const statusStyle = STATUS_STYLES[job.status];
  const approvalStyle = APPROVAL_STYLES[job.approval];
  const StatusIcon = statusStyle.icon;

  const route = routes.find((r) => r.id === job.routeId);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0">
        <div className="sticky top-0 bg-white z-10 px-6 py-4 border-b flex items-center justify-between">
          <DialogTitle className="text-xl font-bold flex items-center gap-2 text-slate-900">
            <span>Job #{String(job.id).padStart(4, "0")}</span>
            <Badge variant="outline" className="text-xs">
              {job.clientName}
            </Badge>
          </DialogTitle>
          <DialogClose className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100">
            <X className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </div>

        <div className="p-6">
          {/* Status Cards */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="p-4 rounded-xl border border-slate-200 bg-white">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Status
              </p>
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded flex items-center justify-center"
                  style={{ background: statusStyle.bg }}>
                  <StatusIcon size={14} style={{ color: statusStyle.color }} />
                </div>
                <span
                  className="text-sm font-semibold"
                  style={{ color: statusStyle.color }}>
                  {job.status}
                </span>
              </div>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 bg-white">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Approval
              </p>
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded flex items-center justify-center"
                  style={{ background: approvalStyle.bg }}>
                  <CheckCircle2
                    size={14}
                    style={{ color: approvalStyle.color }}
                  />
                </div>
                <span
                  className="text-sm font-semibold"
                  style={{ color: approvalStyle.color }}>
                  {job.approval}
                </span>
              </div>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 bg-white">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Tonnage
              </p>
              <div className="flex items-center gap-2">
                <Weight size={14} className="text-slate-500" />
                <span className="text-sm font-semibold text-slate-900">
                  {job.tonnage} tons
                </span>
              </div>
            </div>
          </div>

          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid grid-cols-4 w-full mb-6">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="route">Route</TabsTrigger>
              <TabsTrigger value="cargo">Cargo</TabsTrigger>
              <TabsTrigger value="costs">Costs</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-semibold mb-3 text-slate-900">
                    Schedule
                  </h3>
                  <div className="space-y-3">
                    <InfoItem
                      icon={Calendar}
                      label="Scheduled"
                      value={formatDateTime(job.scheduledAt)}
                    />
                    {job.dueAt && (
                      <InfoItem
                        icon={Calendar}
                        label="Due"
                        value={formatDateTime(job.dueAt)}
                      />
                    )}
                    {job.completedAt && (
                      <InfoItem
                        icon={CheckCircle2}
                        label="Completed"
                        value={formatDateTime(job.completedAt)}
                      />
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold mb-3 text-slate-900">
                    Assignment
                  </h3>
                  <div className="space-y-3">
                    <InfoItem
                      icon={Building2}
                      label="Client"
                      value={job.clientName}
                    />
                    {route && (
                      <InfoItem
                        icon={Route}
                        label="Route"
                        value={route.routeName}
                      />
                    )}
                    <InfoItem
                      icon={Truck}
                      label="Vehicle"
                      value={job.vehiclePlate}
                    />
                    <InfoItem
                      icon={User}
                      label="Driver"
                      value={job.driverName}
                    />
                    {job.requestedByName && (
                      <InfoItem
                        icon={User}
                        label="Requested By"
                        value={job.requestedByName}
                      />
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="route" className="space-y-6">
              {route ? (
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-semibold mb-3 text-slate-900">
                      Route Details
                    </h3>
                    <div className="space-y-3">
                      <InfoItem
                        icon={Route}
                        label="Route Name"
                        value={route.routeName}
                      />
                      <InfoItem
                        icon={MapPin}
                        label="Origin"
                        value={route.origin}
                      />
                      <InfoItem
                        icon={MapPin}
                        label="Destination"
                        value={route.destination}
                      />
                      <InfoItem
                        icon={Gauge}
                        label="Distance"
                        value={formatDistance(route.distanceKm)}
                      />
                      {route.truckSizeRequired && (
                        <InfoItem
                          icon={Truck}
                          label="Truck Size Required"
                          value={route.truckSizeRequired}
                        />
                      )}
                      {route.typicalTransitTime && (
                        <InfoItem
                          icon={Clock}
                          label="Typical Transit"
                          value={`${route.typicalTransitTime} hours`}
                        />
                      )}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold mb-3 text-slate-900">
                      Route Specifications
                    </h3>
                    <div className="space-y-3">
                      <InfoItem
                        icon={Briefcase}
                        label="Route Type"
                        value={route.routeType}
                      />
                      {route.category && (
                        <InfoItem
                          icon={Briefcase}
                          label="Category"
                          value={route.category}
                        />
                      )}
                      {route.allowedCargoTypes &&
                        route.allowedCargoTypes.length > 0 && (
                          <InfoItem
                            icon={Package}
                            label="Allowed Cargo"
                            value={route.allowedCargoTypes.join(", ")}
                          />
                        )}
                      {route.baseRate && (
                        <InfoItem
                          icon={DollarSign}
                          label="Base Rate"
                          value={formatCurrency(route.baseRate)}
                        />
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <Route size={32} className="mx-auto mb-3 text-slate-300" />
                  <p>No route assigned to this job.</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="cargo" className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-semibold mb-3 text-slate-900">
                    Cargo Details
                  </h3>
                  <div className="space-y-3">
                    <InfoItem
                      icon={Weight}
                      label="Tonnage"
                      value={`${job.tonnage} tons`}
                    />
                    <InfoItem
                      icon={Package}
                      label="Cargo Type"
                      value={job.cargoType}
                    />
                    <InfoItem
                      icon={MapPin}
                      label="Pickup"
                      value={job.pickupLocation}
                    />
                    <InfoItem
                      icon={MapPin}
                      label="Delivery"
                      value={job.deliveryLocation}
                    />
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold mb-3 text-slate-900">
                    Financials
                  </h3>
                  <div className="space-y-3">
                    <InfoItem
                      icon={DollarSign}
                      label="Income"
                      value={formatCurrency(job.income)}
                    />
                  </div>
                </div>
              </div>
              {job.description && (
                <div>
                  <h3 className="text-sm font-semibold mb-2 text-slate-900">
                    Description
                  </h3>
                  <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-xl">
                    {job.description}
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="costs">
              {job.costs && job.costs.length > 0 ? (
                <div className="space-y-3">
                  {job.costs.map((cost, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                      <span className="text-sm text-slate-900">
                        {cost.description}
                      </span>
                      <span className="text-sm font-semibold text-slate-900">
                        {formatCurrency(cost.amount)}
                      </span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between p-3 bg-slate-100 rounded-xl font-semibold">
                    <span className="text-sm text-slate-900">Total Costs</span>
                    <span className="text-sm font-bold text-slate-900">
                      {formatCurrency(
                        job.costs.reduce((sum, c) => sum + (c.amount || 0), 0),
                      )}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <FileText size={32} className="mx-auto mb-3 text-slate-300" />
                  <p>No costs recorded for this job.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function InfoItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value?: string | null;
}) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2">
      <Icon size={14} className="text-slate-400 mt-0.5" />
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          {label}
        </p>
        <p className="text-sm text-slate-900">{value}</p>
      </div>
    </div>
  );
}

function Package(props: any) {
  return (
    <svg
      {...props}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2">
      <path d="M16.5 9.4L7.5 4.21" />
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <path d="M3.29 7L12 12l8.71-5" />
      <path d="M12 22V12" />
    </svg>
  );
}

// ── Job Sheet ─────────────────────────────────────────────────────────────────
function JobSheet({
  open,
  onClose,
  editing,
  onSave,
  clients,
  vehicles,
  staff,
  routes,
  onLoadRoutes,
  currentUserId,
}: {
  open: boolean;
  onClose: () => void;
  editing: Job | null;
  onSave: (data: any, id?: number) => Promise<void>;
  clients: ClientOption[];
  vehicles: VehicleOption[];
  staff: StaffOption[];
  routes: Route[];
  onLoadRoutes: (clientId: number) => Promise<void>;
  currentUserId?: number | null;
}) {
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("assignment");
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);

  // Filter staff for drivers (Logistics department)
  const logisticsStaff = useMemo(
    () =>
      staff.filter((s) => s.department === "Logistics" || s.role === "DRIVER"),
    [staff],
  );

  const buildDefaultValues = useCallback(
    (job: Job | null): JobFormData => {
      if (job) {
        return {
          clientId: job.clientId,
          routeId: job.routeId || null,
          vehicleId: job.vehicleId || null,
          driverId: job.driverId || null,
          requestedById: job.requestedById ?? currentUserId ?? null,
          scheduledAt: toDatetimeLocal(job.scheduledAt),
          dueAt: job.dueAt ? toDatetimeLocal(job.dueAt) : "",
          completedAt: job.completedAt || "",
          tonnage: job.tonnage,
          cargoType: job.cargoType || "",
          pickupLocation: job.pickupLocation || "",
          deliveryLocation: job.deliveryLocation || "",
          description: job.description || "",
          gateOdometer: job.gateOdometer || null,
          gateFuelGauge: job.gateFuelGauge || "",
          stationOdometer: job.stationOdometer || null,
          stationFuelGauge: job.stationFuelGauge || "",
          income: job.income || null,
          costs: job.costs || [],
          status: job.status,
          approval: job.approval,
        };
      }
      return {
        clientId: 0,
        routeId: null,
        vehicleId: null,
        driverId: null,
        requestedById: currentUserId ?? null,
        scheduledAt: "",
        dueAt: "",
        completedAt: "",
        tonnage: "",
        cargoType: "",
        pickupLocation: "",
        deliveryLocation: "",
        description: "",
        gateOdometer: null,
        gateFuelGauge: "",
        stationOdometer: null,
        stationFuelGauge: "",
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
    resolver: zodResolver(jobSchema) as any,
    defaultValues: buildDefaultValues(editing),
  });

  // Reset form whenever the sheet opens or the editing job changes
  useEffect(() => {
    if (open) {
      const defaultValues = buildDefaultValues(editing);
      reset(defaultValues);

      if (editing?.routeId) {
        const route = routes.find((r) => r.id === editing.routeId);
        setSelectedRoute(route || null);
      } else {
        setSelectedRoute(null);
      }
    }
  }, [open, editing, buildDefaultValues, reset, routes]);

  const watchClientId = watch("clientId");
  const watchRouteId = watch("routeId");
  const watchVehicleId = watch("vehicleId");
  const watchDueAt = watch("dueAt");
  const watchDriverId = watch("driverId");
  const watchIncome = watch("income");
  const watchApproval = watch("approval");

  // Load routes when client changes
  useEffect(() => {
    if (watchClientId && watchClientId > 0) {
      onLoadRoutes(watchClientId);
    }
  }, [watchClientId, onLoadRoutes]);

  // Update selected route when routeId changes
  useEffect(() => {
    if (watchRouteId) {
      const route = routes.find((r) => r.id === watchRouteId);
      setSelectedRoute(route || null);

      // Auto-fill fields from route
      if (route) {
        // Auto-fill origin/destination if empty
        if (!getValues("pickupLocation") && route.origin) {
          setValue("pickupLocation", route.origin);
        }
        if (!getValues("deliveryLocation") && route.destination) {
          setValue("deliveryLocation", route.destination);
        }

        // Auto-fill cargo type if route has allowed cargo types
        if (
          !getValues("cargoType") &&
          route.allowedCargoTypes &&
          route.allowedCargoTypes.length > 0
        ) {
          setValue("cargoType", route.allowedCargoTypes[0]);
        }

        // Auto-fill income from base rate if not set
        if (!getValues("income") && route.baseRate) {
          const tonnage = parseFloat(getValues("tonnage")) || 0;
          if (route.ratePerKm && route.distanceKm) {
            // Calculate based on distance
            setValue("income", route.ratePerKm * route.distanceKm);
          } else if (route.baseRate) {
            // Use base rate
            setValue("income", route.baseRate);
          }
        }
      }
    } else {
      setSelectedRoute(null);
    }
  }, [watchRouteId, routes, setValue, getValues]);

  // Fetch vehicle details when vehicle changes
  useEffect(() => {
    if (!watchVehicleId) return;

    const fetchVehicle = async () => {
      try {
        const res = await fetch(`${API_URL}/vehicles/${watchVehicleId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("bp_token")}`,
          },
        });
        if (res.ok) {
          const vehicle = await res.json();
          // Auto-fill default driver only when no driver is currently selected
          if (vehicle.defaultDriverId && !getValues("driverId")) {
            setValue("driverId", vehicle.defaultDriverId);
          }

          // Check if vehicle capacity matches route requirement
          if (selectedRoute?.truckSizeRequired && vehicle.truckCapacity) {
            const routeSize = parseInt(selectedRoute.truckSizeRequired);
            const vehicleSize = parseInt(vehicle.truckCapacity);
            if (routeSize && vehicleSize && vehicleSize < routeSize) {
              toast.warning(
                `Vehicle capacity (${vehicle.truckCapacity}) may be insufficient for this route (requires ${selectedRoute.truckSizeRequired})`,
              );
            }
          }
        }
      } catch (error) {
        console.error("Failed to fetch vehicle:", error);
      }
    };
    fetchVehicle();
  }, [watchVehicleId, selectedRoute, setValue, getValues]);

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
    setSelectedRoute(null);
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

  // Filter vehicles by truck size requirement if route selected
  const filteredVehicles = useMemo(() => {
    if (!selectedRoute?.truckSizeRequired) return vehicles;

    const requiredSize = selectedRoute.truckSizeRequired.replace("T", "");
    return vehicles.filter((v) => {
      if (!v.truckCapacity) return true; // Show all if no capacity specified
      const vehicleSize = v.truckCapacity.replace("T", "");
      return parseInt(vehicleSize) >= parseInt(requiredSize);
    });
  }, [vehicles, selectedRoute]);

  return (
    <Sheet open={open} onOpenChange={(o) => !o && !isSaving && handleClose()}>
      <SheetContent className="w-[700px] sm:max-w-[700px] overflow-y-auto !p-0">
        <div className="sticky top-0 bg-white z-20 px-7 py-5 border-b flex items-center justify-between">
          <div>
            <SheetTitle className="text-xl font-bold text-slate-900">
              {editing ? "Edit Job" : "Create New Job"}
            </SheetTitle>
            <SheetDescription className="mt-1 text-sm text-slate-500">
              {editing
                ? `Editing job #${String(editing.id).padStart(4, "0")}`
                : "Schedule a new transport job"}
            </SheetDescription>
          </div>
          <SheetClose className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100">
            <X className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </SheetClose>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="p-7">
          <TabsList className="grid grid-cols-4 w-full mb-6">
            <TabsTrigger value="assignment">Assignment</TabsTrigger>
            <TabsTrigger value="route">Route</TabsTrigger>
            <TabsTrigger value="cargo">Cargo</TabsTrigger>
            <TabsTrigger value="readings">Readings</TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <TabsContent value="assignment" className="space-y-6">
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

              {/* Route - Only show if client selected */}
              {watchClientId > 0 && (
                <Controller
                  name="routeId"
                  control={control}
                  render={({ field }) => (
                    <RouteSelector
                      value={field.value}
                      onChange={(id, route) => {
                        field.onChange(id);
                        if (route) setSelectedRoute(route);
                      }}
                      routes={routes}
                      clientId={watchClientId}
                      label="Route"
                      placeholder="Select route"
                      onLoadRoutes={onLoadRoutes}
                    />
                  )}
                />
              )}

              {/* Vehicle */}
              <SelectField
                name="vehicleId"
                label="Vehicle"
                required
                options={filteredVehicles.map((v) => ({
                  value: String(v.id),
                  label: `${v.numberPlate} (${v.vehicleType}${v.truckCapacity ? ` · ${v.truckCapacity}` : ""})`,
                }))}
                control={control}
                errors={errors}
              />

              {/* Driver */}
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
                <div className="p-4 rounded-xl text-center bg-slate-50">
                  <p className="text-xs text-slate-500">
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
            </TabsContent>

            <TabsContent value="route" className="space-y-6">
              {selectedRoute ? (
                <div className="space-y-4">
                  <div className="rounded-xl bg-[#F5F4EF] p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900">
                          {selectedRoute.routeName}
                        </h3>
                        <p className="text-xs text-slate-600 mt-0.5">
                          {selectedRoute.routeCode}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-[10px]">
                        {selectedRoute.routeType}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <div>
                        <p className="text-[10px] font-semibold uppercase text-slate-500 mb-1">
                          Origin
                        </p>
                        <p className="text-sm font-medium text-slate-900">
                          {selectedRoute.origin}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase text-slate-500 mb-1">
                          Destination
                        </p>
                        <p className="text-sm font-medium text-slate-900">
                          {selectedRoute.destination}
                        </p>
                      </div>
                    </div>

                    {(selectedRoute.distanceKm ||
                      selectedRoute.truckSizeRequired) && (
                      <div className="flex gap-3 mt-3 pt-3 border-t border-slate-200">
                        {selectedRoute.distanceKm && (
                          <div>
                            <p className="text-[10px] font-semibold uppercase text-slate-500">
                              Distance
                            </p>
                            <p className="text-xs font-medium text-slate-900">
                              {selectedRoute.distanceKm} km
                            </p>
                          </div>
                        )}
                        {selectedRoute.truckSizeRequired && (
                          <div>
                            <p className="text-[10px] font-semibold uppercase text-slate-500">
                              Truck Required
                            </p>
                            <p className="text-xs font-medium text-slate-900">
                              {selectedRoute.truckSizeRequired}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {selectedRoute.baseRate && (
                      <div className="mt-3 pt-3 border-t border-slate-200">
                        <p className="text-[10px] font-semibold uppercase text-slate-500 mb-1">
                          Base Rate
                        </p>
                        <p className="text-base font-bold text-green-600">
                          {formatCurrency(selectedRoute.baseRate)}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label className="text-xs font-medium text-slate-700">
                        Pickup Location
                      </Label>
                      <Controller
                        name="pickupLocation"
                        control={control}
                        render={({ field }) => (
                          <Input
                            {...field}
                            value={field.value ?? ""}
                            placeholder="Enter pickup location"
                            className="mt-1.5 h-10 rounded-xl text-sm"
                          />
                        )}
                      />
                      <p className="text-[10px] text-slate-500 mt-1">
                        Defaults to route origin if not specified
                      </p>
                    </div>

                    <div>
                      <Label className="text-xs font-medium text-slate-700">
                        Delivery Location
                      </Label>
                      <Controller
                        name="deliveryLocation"
                        control={control}
                        render={({ field }) => (
                          <Input
                            {...field}
                            value={field.value ?? ""}
                            placeholder="Enter delivery location"
                            className="mt-1.5 h-10 rounded-xl text-sm"
                          />
                        )}
                      />
                      <p className="text-[10px] text-slate-500 mt-1">
                        Defaults to route destination if not specified
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 bg-slate-50 rounded-xl">
                  <Route size={32} className="mx-auto mb-3 text-slate-300" />
                  <p className="text-sm text-slate-600 mb-2">
                    No route selected
                  </p>
                  <p className="text-xs text-slate-500">
                    Select a route in the Assignment tab to see details
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="cargo" className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700">
                    Tonnage *
                  </Label>
                  <div className="relative">
                    <Weight
                      size={14}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
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

                <SelectField
                  name="cargoType"
                  label="Cargo Type"
                  options={CARGO_TYPES.map((t) => ({ value: t, label: t }))}
                  control={control}
                  errors={errors}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-700">
                  Income * (Required for approval)
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-slate-500">
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
                            e.target.value ? parseFloat(e.target.value) : null,
                          )
                        }
                      />
                    )}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-700">
                  Description
                </Label>
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <Textarea
                      {...field}
                      value={field.value ?? ""}
                      placeholder="Route details, cargo notes…"
                      className="rounded-xl text-sm min-h-[80px]"
                    />
                  )}
                />
              </div>
            </TabsContent>

            <TabsContent value="readings" className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700">
                    Gate Odometer (km)
                  </Label>
                  <Controller
                    name="gateOdometer"
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
                  name="gateFuelGauge"
                  label="Gate Fuel Gauge"
                  options={FUEL_GAUGES.map((f) => ({ value: f, label: f }))}
                  control={control}
                  errors={errors}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700">
                    Station Odometer (km)
                  </Label>
                  <Controller
                    name="stationOdometer"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        value={field.value ?? ""}
                        type="number"
                        placeholder="e.g. 45200"
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
                  name="stationFuelGauge"
                  label="Station Fuel Gauge"
                  options={FUEL_GAUGES.map((f) => ({ value: f, label: f }))}
                  control={control}
                  errors={errors}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700">
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
                  <Label className="text-xs font-medium text-slate-700">
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

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <SelectField
                  name="status"
                  label="Job Status"
                  required
                  options={ALL_STATUSES.map((s) => ({ value: s, label: s }))}
                  control={control}
                  errors={errors}
                />

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700">
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
            </TabsContent>

            <div className="sticky bottom-0 bg-white pt-6 mt-6 border-t flex gap-3">
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
                style={{ background: SKY_BLUE }}
                onMouseOver={(e) =>
                  (e.currentTarget.style.background = "#0591c0")
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.background = SKY_BLUE)
                }>
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
        </Tabs>
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
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-slate-900">
            Delete Job
          </DialogTitle>
          <DialogDescription className="text-slate-500">
            Delete job{" "}
            <strong className="text-slate-900">
              #{String(job?.id ?? 0).padStart(4, "0")}
            </strong>{" "}
            for <strong className="text-slate-900">{job?.clientName}</strong>?
            This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 mt-4">
          <Button
            variant="outline"
            disabled={isDeleting}
            onClick={onClose}
            className="rounded-xl flex-1">
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isDeleting}
            className="rounded-xl flex-1 text-white"
            style={{ background: "#ef4444" }}>
            {isDeleting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Delete"
            )}
          </Button>
        </DialogFooter>
        <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogClose>
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
  const [routes, setRoutes] = useState<Route[]>([]);
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
  const [viewingJob, setViewingJob] = useState<Job | null>(null);

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
      const [jRes, cRes, vRes, sRes, rRes] = await Promise.all([
        fetch(`${API_URL}/jobs`, { headers: authHeader }),
        fetch(`${API_URL}/clients`, { headers: authHeader }),
        fetch(`${API_URL}/vehicles`, { headers: authHeader }),
        fetch(`${API_URL}/staff`, { headers: authHeader }),
        fetch(`${API_URL}/routes`, { headers: authHeader }),
      ]);

      const [jData, cData, vData, sData, rData] = await Promise.all([
        jRes.json(),
        cRes.json(),
        vRes.json(),
        sRes.json(),
        rRes.json(),
      ]);

      if (jRes.ok) setJobs(jData);
      else toast.error(jData.error || "Failed to load jobs");
      if (cRes.ok) setClients(cData);
      if (vRes.ok) setVehicles(vData);
      if (sRes.ok) setStaff(sData);
      if (rRes.ok) setRoutes(rData);
    } catch {
      toast.error("Network error");
    } finally {
      setIsLoading(false);
    }
  }, [authHeader]);

  const loadRoutesForClient = useCallback(
    async (clientId: number) => {
      try {
        const res = await fetch(`${API_URL}/clients/${clientId}/routes`, {
          headers: authHeader,
        });
        if (res.ok) {
          const data = await res.json();
          setRoutes(data);
        }
      } catch (error) {
        console.error("Failed to load routes:", error);
      }
    },
    [authHeader],
  );

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
        (j.routeName ?? "").toLowerCase().includes(q) ||
        (j.vehiclePlate ?? "").toLowerCase().includes(q) ||
        (j.driverName ?? "").toLowerCase().includes(q) ||
        String(j.id).includes(q) ||
        (j.pickupLocation ?? "").toLowerCase().includes(q) ||
        (j.deliveryLocation ?? "").toLowerCase().includes(q);
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
      } else if (sortKey === "routeName") {
        va = a.routeName ?? "";
        vb = b.routeName ?? "";
      } else if (sortKey === "id") {
        va = String(a.id);
        vb = String(b.id);
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
    cancelled: jobs.filter((j) => j.status === "Cancelled").length,
    pending: jobs.filter((j) => j.approval === "Requested").length,
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
            Jobs
          </h2>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setSheetOpen(true);
          }}
          className="flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-semibold text-white"
          style={{ background: SKY_BLUE }}
          onMouseOver={(e) => (e.currentTarget.style.background = "#0591c0")}
          onMouseOut={(e) => (e.currentTarget.style.background = SKY_BLUE)}>
          <Plus size={15} /> Create Job
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-6 gap-3 mb-5">
        <StatCard
          label="Total"
          value={counts.total}
          icon={Briefcase}
          color={SKY_BLUE}
          bg={`${SKY_BLUE}18`}
          onClick={() => setStatusFilter("ALL")}
          active={statusFilter === "ALL"}
        />
        <StatCard
          label="Scheduled"
          value={counts.scheduled}
          icon={Clock}
          color={SKY_BLUE}
          bg={`${SKY_BLUE}18`}
          onClick={() => setStatusFilter("Scheduled")}
          active={statusFilter === "Scheduled"}
        />
        <StatCard
          label="Ongoing"
          value={counts.ongoing}
          icon={AlertCircle}
          color="#b8922a"
          bg="#E1BA5820"
          onClick={() => setStatusFilter("Ongoing")}
          active={statusFilter === "Ongoing"}
        />
        <StatCard
          label="Completed"
          value={counts.completed}
          icon={CheckCircle2}
          color="#16a34a"
          bg="#16a34a18"
          onClick={() => setStatusFilter("Completed")}
          active={statusFilter === "Completed"}
        />
        <StatCard
          label="Missed"
          value={counts.missed}
          icon={XCircle}
          color="#ef4444"
          bg="#ef444418"
          onClick={() => setStatusFilter("Missed")}
          active={statusFilter === "Missed"}
        />
        <StatCard
          label="Cancelled"
          value={counts.cancelled}
          icon={XCircle}
          color="#6b7280"
          bg="#6b728018"
          onClick={() => setStatusFilter("Cancelled")}
          active={statusFilter === "Cancelled"}
        />
      </div>

      {/* Pending approval alert */}
      {counts.pending > 0 && (
        <div
          className="rounded-2xl px-4 py-3 mb-4 flex items-center gap-3 cursor-pointer"
          onClick={() => setApprovalFilter("Requested")}
          style={{
            background: "#E1BA5820",
            border: `1px solid #b8922a50`,
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
      <div className="rounded-2xl p-4 mb-4 flex items-center gap-3 flex-wrap bg-white border border-slate-200">
        <div className="relative flex-1 min-w-[180px]">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search client, route, plate, driver, location…"
            className="pl-9 h-9 rounded-xl text-sm border-0 bg-[#F5F4EF]"
          />
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <Filter size={13} className="text-slate-500" />
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
      <div className="rounded-2xl overflow-hidden min-h-[400px] bg-white border border-slate-200">
        <div
          className="grid px-5 py-3 bg-[#FAFAF8] border-b border-slate-200"
          style={{
            gridTemplateColumns: "56px 2fr 1.8fr 1.2fr 1fr 1fr 1fr 52px",
          }}>
          <SortHeader
            label="#"
            sortKey="id"
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
            label="Route"
            sortKey="routeName"
            current={sortKey}
            dir={sortDir}
            onSort={handleSort}
          />
          <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
            Vehicle
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
              style={{ color: SKY_BLUE }}
            />
            <p className="text-sm font-medium text-slate-500">Loading jobs…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
            <div className="w-16 h-16 rounded-full bg-[#F5F4EF] flex items-center justify-center mb-4">
              <Briefcase size={28} className="text-slate-400" />
            </div>
            <h3 className="text-base font-bold mb-1 text-slate-900">
              No Jobs Found
            </h3>
            <p className="text-sm max-w-[280px] leading-relaxed mb-6 text-slate-500">
              {search || statusFilter !== "ALL" || approvalFilter !== "ALL"
                ? "No results match your current filters."
                : "No jobs scheduled yet. Create the first one."}
            </p>
            {!search && statusFilter === "ALL" && approvalFilter === "ALL" && (
              <Button
                onClick={() => setSheetOpen(true)}
                variant="outline"
                className="rounded-xl h-9 px-5"
                style={{ borderColor: SKY_BLUE, color: SKY_BLUE }}>
                <Plus size={14} className="mr-2" /> Create Job
              </Button>
            )}
          </div>
        ) : (
          filtered.map((j, i) => {
            // Add safety checks
            if (!j.status || !STATUS_STYLES[j.status]) {
              console.warn("Job has invalid status:", j);
              j.status = "Scheduled"; // Default to Scheduled
            }
            if (!j.approval || !APPROVAL_STYLES[j.approval]) {
              console.warn("Job has invalid approval:", j);
              j.approval = "Requested"; // Default to Requested
            }

            const ss = STATUS_STYLES[j.status];
            const as = APPROVAL_STYLES[j.approval];
            const StatusIcon = ss.icon;
            return (
              <div
                key={j.id}
                onClick={() => setViewingJob(j)}
                className="grid items-center px-5 py-3.5 transition-colors hover:bg-[#F5F4EF] cursor-pointer"
                style={{
                  gridTemplateColumns: "56px 2fr 1.8fr 1.2fr 1fr 1fr 1fr 52px",
                  borderBottom:
                    i < filtered.length - 1 ? "1px solid #e2e8f0" : "none",
                }}>
                {/* Job ID */}
                <p className="text-xs font-bold text-slate-500">
                  #{String(j.id).padStart(4, "0")}
                </p>

                {/* Client */}
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate text-slate-900">
                    {j.clientName ?? "—"}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {j.tonnage} t {j.pickupLocation && `· ${j.pickupLocation}`}
                  </p>
                </div>

                {/* Route */}
                <div className="flex items-center gap-1.5 min-w-0">
                  <Route size={12} className="text-slate-400 flex-shrink-0" />
                  <p className="text-xs truncate text-slate-900">
                    {j.routeName ?? "—"}
                  </p>
                </div>

                {/* Vehicle */}
                <div className="flex items-center gap-1.5 min-w-0">
                  <Truck size={12} className="text-slate-400 flex-shrink-0" />
                  <p className="text-xs truncate text-slate-900">
                    {j.vehiclePlate ?? "—"}
                  </p>
                </div>

                {/* Scheduled */}
                <p className="text-xs text-slate-500">
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
                <div onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-[#F0EFE9] text-slate-500">
                        <MoreHorizontal size={15} />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-48 rounded-xl">
                      <DropdownMenuItem
                        onClick={() => setViewingJob(j)}
                        className="text-xs cursor-pointer">
                        <Eye size={13} className="mr-2" /> View Details
                      </DropdownMenuItem>
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
                      <DropdownMenuLabel className="text-[10px] font-semibold uppercase tracking-widest px-2 py-1 text-slate-500">
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
                      <DropdownMenuLabel className="text-[10px] font-semibold uppercase tracking-widest px-2 py-1 text-slate-500">
                        Set Approval
                      </DropdownMenuLabel>
                      {ALL_APPROVALS.filter((a) => a !== j.approval).map(
                        (a) => {
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
                        },
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setDeleteTarget(j)}
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
        routes={routes}
        onLoadRoutes={loadRoutesForClient}
        currentUserId={currentUserId}
      />

      <JobDetailModal
        open={!!viewingJob}
        onClose={() => setViewingJob(null)}
        job={viewingJob}
        routes={routes}
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

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  bg,
  onClick,
  active,
}: any) {
  return (
    <div
      className="rounded-2xl p-4 cursor-pointer transition-all bg-white border"
      onClick={onClick}
      style={{
        borderColor: active ? color : "#e2e8f0",
        boxShadow: active ? `0 0 0 2px ${color}30` : "none",
      }}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: bg }}>
          <Icon size={13} style={{ color }} />
        </div>
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}
