import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
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
  Truck,
  Car,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  User,
  Building,
  Link2,
  Unlink,
  X,
  Mail,
  Phone,
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
  SheetHeader,
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
export type Ownership = "Hired" | "Owned";
export type VehicleType = "Truck" | "SUV";

export interface Vehicle {
  id: number;
  numberPlate: string;
  ownership: Ownership;
  type: VehicleType;
  make?: string;
  model?: string;
  year?: number;
  hiredFrom?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  defaultDriverId?: number | null;
  defaultDriverName?: string | null;
  defaultDriverAvatar?: string | null;
  createdAt: string;
}

export interface StaffOption {
  id: number;
  name: string;
  department?: string;
  avatarUrl?: string;
}

type SortKey = "numberPlate" | "type" | "ownership" | "year";
type SortDir = "asc" | "desc";

const TYPE_STYLES: Record<
  VehicleType,
  { color: string; bg: string; icon: any }
> = {
  Truck: { color: "#b8922a", bg: "#E1BA5820", icon: Truck },
  SUV: { color: C.blue, bg: `${C.blue}18`, icon: Car },
};

const OWNERSHIP_STYLES: Record<Ownership, { color: string; bg: string }> = {
  Owned: { color: C.green, bg: `${C.green}18` },
  Hired: { color: C.muted, bg: "#9E9E9E18" },
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// ── Schema ────────────────────────────────────────────────────────────────────
const vehicleSchema = z
  .object({
    numberPlate: z
      .string()
      .min(2, "Required")
      .transform((v) => v.toUpperCase()),
    ownership: z.enum(["Hired", "Owned"]),
    type: z.enum(["Truck", "SUV"]),
    make: z.string().optional().or(z.literal("")),
    model: z.string().optional().or(z.literal("")),
    hiredFrom: z.string().optional(),
    contactName: z.string().optional(),
    contactPhone: z.string().optional(),
    contactEmail: z.string().email().optional().or(z.literal("")),
    year: z.coerce.number().optional().or(z.literal("")),
    defaultDriverId: z.coerce.number().nullable().optional(),
  })
  .refine(
    (data) => {
      if (data.ownership === "Hired" && !data.hiredFrom) return false;
      return true;
    },
    {
      message: "Hired From is required for hired vehicles",
      path: ["hiredFrom"],
    },
  );

type VehicleFormData = z.infer<typeof vehicleSchema>;

// ── Sort Header ───────────────────────────────────────────────────────────────
function SortHeader({ label, sortKey, current, dir, onSort }: any) {
  const active = current === sortKey;
  return (
    <button
      onClick={() => onSort(sortKey)}
      className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest transition-colors"
      style={{ color: active ? C.dark : C.muted }}>
      {label}{" "}
      {active ? (
        dir === "asc" ? (
          <ChevronUp size={11} />
        ) : (
          <ChevronDown size={11} />
        )
      ) : (
        <ChevronsUpDown size={11} />
      )}
    </button>
  );
}

// ── Vehicle Sheet ─────────────────────────────────────────────────────────────
function VehicleSheet({ open, onClose, editing, onSave, drivers }: any) {
  const [isSaving, setIsSaving] = useState(false);
  const [linkedDriver, setLinkedDriver] = useState<StaffOption | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [driverSearch, setDriverSearch] = useState("");

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleSchema),
    values: editing
      ? {
          ...editing,
          make: editing.make ?? "",
          model: editing.model ?? "",
          hiredFrom: editing.hiredFrom ?? "",
          contactName: editing.contactName ?? "",
          contactPhone: editing.contactPhone ?? "",
          contactEmail: editing.contactEmail ?? "",
          year: editing.year ?? "",
        }
      : ({ ownership: "Owned", type: "Truck", numberPlate: "" } as any),
  });

  const ownership = watch("ownership");

  useEffect(() => {
    if (editing && editing.defaultDriverId) {
      setLinkedDriver(
        drivers.find((d: any) => d.id === editing.defaultDriverId) || null,
      );
    } else {
      setLinkedDriver(null);
    }
  }, [editing, drivers, open]);

  const handleClose = () => {
    reset();
    setLinkedDriver(null);
    setShowPicker(false);
    onClose();
  };

  async function onSubmit(data: VehicleFormData) {
    setIsSaving(true);
    try {
      await onSave(data, editing?.id);
      handleClose();
    } finally {
      setIsSaving(false);
    }
  }

  const FI = ({ name, label, placeholder, type = "text" }: any) => (
    <div className="space-y-1.5">
      <Label className="text-[10px] font-bold uppercase tracking-widest text-[#6b8fa8]">
        {label}
      </Label>
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <Input
            {...field}
            value={field.value ?? ""}
            type={type}
            placeholder={placeholder}
            className="h-10 rounded-xl text-sm"
          />
        )}
      />
      {errors[name] && (
        <p className="text-[10px] text-red-500 mt-0.5">
          {errors[name]?.message as string}
        </p>
      )}
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={(o) => !o && !isSaving && handleClose()}>
      <SheetContent
        className="w-[460px] sm:w-[520px] overflow-y-auto !p-0"
        style={{ fontFamily: "'Inter', sans-serif" }}>
        <div
          className="px-7 py-6"
          style={{ borderBottom: `1px solid ${C.border}` }}>
          <SheetTitle className="text-lg font-bold" style={{ color: C.dark }}>
            {editing ? "Edit Vehicle" : "Add Vehicle"}
          </SheetTitle>
          <SheetDescription className="mt-1 text-sm" style={{ color: C.muted }}>
            Enter vehicle specifications and ownership details.
          </SheetDescription>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="px-7 py-6 space-y-5">
            <FI
              name="numberPlate"
              label="Number Plate *"
              placeholder="e.g. UAL 123A"
            />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-[#6b8fa8]">
                  Ownership *
                </Label>
                <Controller
                  name="ownership"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="h-10 rounded-xl text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Owned">Owned</SelectItem>
                        <SelectItem value="Hired">Hired</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-[#6b8fa8]">
                  Type *
                </Label>
                <Controller
                  name="type"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="h-10 rounded-xl text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Truck">Truck</SelectItem>
                        <SelectItem value="SUV">SUV</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            {/* Hired Fields Section */}
            {ownership === "Hired" && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#94a3b8]">
                  Hiring Source Details
                </p>
                <FI
                  name="hiredFrom"
                  label="Hired From *"
                  placeholder="Company or Owner Name"
                />
                <FI
                  name="contactName"
                  label="Contact Person"
                  placeholder="Name"
                />
                <div className="grid grid-cols-2 gap-3">
                  <FI
                    name="contactPhone"
                    label="Contact Phone"
                    placeholder="+256..."
                  />
                  <FI
                    name="contactEmail"
                    label="Contact Email"
                    type="email"
                    placeholder="email@source.com"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <FI name="make" label="Make" />
              <FI name="model" label="Model" />
            </div>
            <FI name="year" label="Year" type="number" />

            {/* Linking Driver UI */}
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-[#6b8fa8]">
                Default Driver (Logistics)
              </Label>
              <div
                className="rounded-2xl p-4"
                style={{
                  background: "#F5F4EF",
                  border: `1px solid ${C.border}`,
                }}>
                {linkedDriver ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold"
                        style={{ background: "#1a3a5c" }}>
                        <AvatarImage src={linkedDriver.avatarUrl} />
                        <AvatarFallback>
                          {getInitials(linkedDriver.name)}
                        </AvatarFallback>
                      </Avatar>
                      <p
                        className="text-sm font-semibold"
                        style={{ color: C.dark }}>
                        {linkedDriver.name}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setLinkedDriver(null);
                        setValue("defaultDriverId", null);
                      }}
                      className="text-red-500 hover:bg-red-50 p-1 rounded-lg transition-colors">
                      <Unlink size={14} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowPicker(true)}
                    className="w-full flex items-center gap-2 justify-center h-10 rounded-xl text-sm font-medium border-dashed border-2"
                    style={{ color: C.muted, borderColor: C.border }}>
                    <Link2 size={14} /> Link Default Driver
                  </button>
                )}
                {showPicker && (
                  <div className="mt-3 bg-white p-2 rounded-xl border animate-in fade-in zoom-in duration-200">
                    <div className="relative mb-2">
                      <Search
                        size={12}
                        className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <Input
                        placeholder="Search logistics..."
                        value={driverSearch}
                        onChange={(e) => setDriverSearch(e.target.value)}
                        className="h-8 text-xs pl-7 bg-slate-50 border-0 shadow-none"
                      />
                    </div>
                    <div className="max-h-32 overflow-y-auto">
                      {drivers
                        .filter((d: any) =>
                          d.name
                            .toLowerCase()
                            .includes(driverSearch.toLowerCase()),
                        )
                        .map((d: any) => (
                          <button
                            key={d.id}
                            type="button"
                            onClick={() => {
                              setLinkedDriver(d);
                              setValue("defaultDriverId", d.id);
                              setShowPicker(false);
                            }}
                            className="w-full text-left px-3 py-2 text-xs hover:bg-[#F5F4EF] border-b last:border-0 rounded-md transition-colors">
                            {d.name}
                          </button>
                        ))}
                    </div>
                  </div>
                )}
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
                "Add Vehicle"
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}

// ── Delete Dialog ─────────────────────────────────────────────────────────────
function DeleteDialog({ open, onClose, vehicle, onConfirm }: any) {
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
          <DialogTitle className="text-base font-bold">
            Remove Vehicle
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to remove{" "}
            <strong>{vehicle?.numberPlate}</strong>?
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
            className="rounded-xl text-white"
            style={{ background: C.red }}>
            {isDeleting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Remove"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function Vehicles() {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<StaffOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("ALL");
  const [ownershipFilter, setOwnershipFilter] =
    useState<OwnershipFilter>("ALL");
  const [sortKey, setSortKey] = useState<SortKey>("numberPlate");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Vehicle | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    const authHeader = {
      Authorization: `Bearer ${localStorage.getItem("bp_token")}`,
      "Content-Type": "application/json",
    };
    try {
      const [vRes, sRes] = await Promise.all([
        fetch(`${API_URL}/vehicles`, { headers: authHeader }),
        fetch(`${API_URL}/staff`, { headers: authHeader }),
      ]);
      if (vRes.ok) setVehicles(await vRes.json());
      if (sRes.ok) {
        const allStaff = await sRes.json();
        setDrivers(allStaff.filter((s: any) => s.department === "Logistics"));
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return vehicles
      .filter(
        (v) =>
          (v.numberPlate.toLowerCase().includes(q) ||
            (v.make ?? "").toLowerCase().includes(q)) &&
          (typeFilter === "ALL" || v.type === typeFilter) &&
          (ownershipFilter === "ALL" || v.ownership === ownershipFilter),
      )
      .sort((a, b) => {
        const va = (a as any)[sortKey];
        const vb = (b as any)[sortKey];
        return sortDir === "asc" ? (va > vb ? 1 : -1) : va < vb ? 1 : -1;
      });
  }, [vehicles, search, typeFilter, ownershipFilter, sortKey, sortDir]);

  async function handleSave(data: VehicleFormData, id?: number) {
    const res = await fetch(
      id ? `${API_URL}/vehicles/${id}` : `${API_URL}/vehicles`,
      {
        method: id ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("bp_token")}`,
        },
        body: JSON.stringify(data),
      },
    );
    if (res.ok) {
      toast.success("Success");
      fetchData();
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const res = await fetch(`${API_URL}/vehicles/${deleteTarget.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${localStorage.getItem("bp_token")}` },
    });
    if (res.ok) {
      toast.success("Removed");
      fetchData();
    }
  }

  return (
    <div
      className="h-full overflow-auto px-6 pt-5 pb-6"
      style={{ scrollbarGutter: "stable" }}>
      <div
        className="flex items-start justify-between mb-5"
        style={{ animation: "fadeSlideUp 0.3s ease both" }}>
        <div>
          <p className="text-xs font-medium mb-1" style={{ color: C.muted }}>
            {new Date().toDateString()}
          </p>
          <h2
            className="text-3xl font-bold tracking-tight"
            style={{ color: C.dark }}>
            Vehicles
          </h2>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setSheetOpen(true);
          }}
          className="flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-semibold text-white shadow-lg"
          style={{
            background: "linear-gradient(135deg, #1a3a5c 0%, #1e6ea6 100%)",
          }}>
          <Plus size={15} /> Add Vehicle
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          {
            label: "Total Fleet",
            value: vehicles.length,
            icon: Truck,
            color: "#1e6ea6",
            bg: "#1e6ea618",
          },
          {
            label: "Trucks",
            value: vehicles.filter((v) => v.type === "Truck").length,
            icon: Truck,
            color: "#b8922a",
            bg: "#E1BA5820",
          },
          {
            label: "SUVs",
            value: vehicles.filter((v) => v.type === "SUV").length,
            icon: Car,
            color: C.blue,
            bg: `${C.blue}18`,
          },
          {
            label: "Owned",
            value: vehicles.filter((v) => v.ownership === "Owned").length,
            icon: Building,
            color: C.green,
            bg: `${C.green}18`,
          },
        ].map((card, i) => (
          <div
            key={card.label}
            className="rounded-2xl p-4 bg-white"
            style={{
              border: `1px solid ${C.border}`,
              animation: `fadeSlideUp 0.4s ease ${i * 0.07}s both`,
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

      <div
        className="rounded-2xl p-4 mb-4 flex items-center gap-3 bg-white shadow-sm"
        style={{
          border: `1px solid ${C.border}`,
          animation: "fadeSlideUp 0.4s ease 0.2s both",
        }}>
        <div className="relative flex-1 max-w-sm">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: C.muted }}
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search plate, make..."
            className="pl-9 h-9 rounded-xl text-sm border-0 bg-[#F5F4EF]"
          />
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <Filter size={13} style={{ color: C.muted }} />
          <Select value={typeFilter} onValueChange={setTypeFilter as any}>
            <SelectTrigger className="h-9 rounded-xl text-xs w-32 border-0 bg-[#F5F4EF]">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Types</SelectItem>
              <SelectItem value="Truck">Truck</SelectItem>
              <SelectItem value="SUV">SUV</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={ownershipFilter}
            onValueChange={setOwnershipFilter as any}>
            <SelectTrigger className="h-9 rounded-xl text-xs w-32 border-0 bg-[#F5F4EF]">
              <SelectValue placeholder="Ownership" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Ownership</SelectItem>
              <SelectItem value="Owned">Owned</SelectItem>
              <SelectItem value="Hired">Hired</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div
        className="rounded-2xl overflow-hidden min-h-[400px] bg-white shadow-sm"
        style={{
          border: `1px solid ${C.border}`,
          animation: "fadeSlideUp 0.4s ease 0.28s both",
        }}>
        <div
          className="grid px-5 py-3 bg-[#FAFAF8]"
          style={{
            gridTemplateColumns: "1.6fr 1fr 1fr 1.4fr 1fr 52px",
            borderBottom: `1px solid ${C.border}`,
          }}>
          <SortHeader
            label="Plate"
            sortKey="numberPlate"
            current={sortKey}
            dir={sortDir}
            onSort={setSortKey}
          />
          <SortHeader
            label="Type"
            sortKey="type"
            current={sortKey}
            dir={sortDir}
            onSort={setSortKey}
          />
          <SortHeader
            label="Ownership"
            sortKey="ownership"
            current={sortKey}
            dir={sortDir}
            onSort={setSortKey}
          />
          <span
            className="text-[10px] font-semibold uppercase tracking-widest"
            style={{ color: C.muted }}>
            Make / Model
          </span>
          <SortHeader
            label="Year"
            sortKey="year"
            current={sortKey}
            dir={sortDir}
            onSort={setSortKey}
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
              Loading fleet…
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
            <Truck size={28} style={{ color: C.border }} className="mb-4" />
            <h3 className="text-base font-bold mb-1" style={{ color: C.dark }}>
              No Vehicles Found
            </h3>
            <p
              className="text-sm max-w-[280px] mb-6"
              style={{ color: C.muted }}>
              No vehicles in the fleet yet. Add the first one.
            </p>
            <Button
              onClick={() => setSheetOpen(true)}
              variant="outline"
              className="rounded-xl h-9 px-5 border-[#c4dff0] text-[#1a3a5c]">
              <Plus size={14} className="mr-2" /> Add Vehicle
            </Button>
          </div>
        ) : (
          filtered.map((v, i) => {
            const ts = TYPE_STYLES[v.type];
            const os = OWNERSHIP_STYLES[v.ownership];
            return (
              <div
                key={v.id}
                className="grid items-center px-5 py-3.5 hover:bg-[#F5F4EF] transition-colors"
                style={{
                  gridTemplateColumns: "1.6fr 1fr 1fr 1.4fr 1fr 52px",
                  borderBottom:
                    i < filtered.length - 1 ? `1px solid ${C.border}` : "none",
                  animation: `fadeSlideUp 0.3s ease ${0.3 + i * 0.04}s both`,
                }}>
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: ts.bg }}>
                    {v.type === "Truck" ? (
                      <Truck size={16} style={{ color: ts.color }} />
                    ) : (
                      <Car size={16} style={{ color: ts.color }} />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p
                      className="text-sm font-bold tracking-wider truncate"
                      style={{ color: C.dark }}>
                      {v.numberPlate}
                    </p>
                    {v.defaultDriverName && (
                      <p
                        className="text-[10px] flex items-center gap-1"
                        style={{ color: C.muted }}>
                        <User size={9} /> {v.defaultDriverName}
                      </p>
                    )}
                  </div>
                </div>
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold w-fit"
                  style={{ background: ts.bg, color: ts.color }}>
                  {v.type}
                </span>
                <span
                  className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-semibold w-fit"
                  style={{ background: os.bg, color: os.color }}>
                  {v.ownership}
                </span>
                <div className="min-w-0">
                  <p
                    className="text-xs font-medium truncate"
                    style={{ color: C.dark }}>
                    {v.make && v.model
                      ? `${v.make} ${v.model}`
                      : v.make || v.model || "—"}
                  </p>
                </div>
                <p
                  className="text-sm font-semibold"
                  style={{ color: v.year ? C.dark : C.muted }}>
                  {v.year || "—"}
                </p>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#F0EFE9] transition-colors"
                      style={{ color: C.muted }}>
                      <MoreHorizontal size={15} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-36 rounded-xl">
                    <DropdownMenuItem
                      onClick={() => {
                        setEditing(v);
                        setSheetOpen(true);
                      }}
                      className="text-xs cursor-pointer">
                      <Pencil size={13} className="mr-2" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setDeleteTarget(v)}
                      className="text-xs cursor-pointer text-red-500 focus:text-red-500">
                      <Trash2 size={13} className="mr-2" /> Remove
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            );
          })
        )}
      </div>

      <VehicleSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        editing={editing}
        onSave={handleSave}
        drivers={drivers}
      />
      <DeleteDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        vehicle={deleteTarget}
        onConfirm={handleDelete}
      />
    </div>
  );
}
