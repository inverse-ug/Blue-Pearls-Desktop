import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, Controller, FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Search,
  Plus,
  MoreHorizontal,
  Truck,
  Users,
  Pencil,
  Trash2,
  UserCheck,
  Filter,
  Shield,
  Loader2,
  Camera,
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

// ── Configuration ─────────────────────────────────────────────────────────────
const API_URL = "https://blue-pearls-server.vercel.app";

// ── Types ──────────────────────────────────────────────────────────────────

export type Role =
  | "IMPLANT"
  | "MANAGER"
  | "SUPER_ADMIN"
  | "PSV_COORDINATOR"
  | "TRUCK_COORDINATOR"
  | "DRIVER"
  | "SECURITY_GUARD"
  | "FUEL_AGENT";

export interface StaffMember {
  id: number;
  name: string;
  phone1: string;
  phone2?: string;
  officialEmail?: string;
  department?: string;
  role: Role;
  avatarUrl?: string;
  createdAt: string;
  status: "Active" | "Inactive" | "On Leave";
  dateOfBirth?: string;
  nationalId?: string;
  address?: string;
  emergencyContact?: string;
  licenseNumber?: string;
  licenseExpiry?: string;
}

export const ROLE_LABELS: Record<Role, string> = {
  IMPLANT: "Implant",
  MANAGER: "Manager",
  SUPER_ADMIN: "Super Admin",
  PSV_COORDINATOR: "PSV Coordinator",
  TRUCK_COORDINATOR: "Truck Coordinator",
  DRIVER: "Driver",
  SECURITY_GUARD: "Security Guard",
  FUEL_AGENT: "Fuel Agent",
};

export const ALL_DEPARTMENTS = [
  "Management",
  "Logistics",
  "Operations",
  "Security",
  "Finance",
  "IT",
];
export const ALL_STATUSES: StaffMember["status"][] = [
  "Active",
  "Inactive",
  "On Leave",
];

// Helper to normalize status from API (Option 4)
const VALID_STATUSES = ["Active", "Inactive", "On Leave"];
function normalizeStatus(status: string): StaffMember["status"] {
  if (VALID_STATUSES.includes(status)) {
    return status as StaffMember["status"];
  }
  return "Active"; // Default fallback
}

// ── Helpers ────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<
  StaffMember["status"],
  { color: string; dot: string }
> = {
  Active: { color: C.green, dot: C.green },
  Inactive: { color: C.muted, dot: C.muted },
  "On Leave": { color: "#b8922a", dot: C.yellow },
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}
const AVATAR_COLORS = [
  "#1a3a5c",
  C.blue,
  C.green,
  "#8B5CF6",
  "#0891b2",
  "#059669",
];
function avatarColor(id: number) {
  return AVATAR_COLORS[id % AVATAR_COLORS.length];
}

// ── Zod Schema ─────────────────────────────────────────────────────────────

const staffSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone1: z.string().min(7, "Primary phone is required"),
  phone2: z.string().optional().or(z.literal("")),
  officialEmail: z
    .string()
    .email("Enter a valid email")
    .optional()
    .or(z.literal("")),
  department: z.string().optional().or(z.literal("")),
  status: z.enum(["Active", "Inactive", "On Leave"]),
  dateOfBirth: z.string().optional().or(z.literal("")),
  nationalId: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  emergencyContact: z.string().optional().or(z.literal("")),
  licenseNumber: z.string().optional().or(z.literal("")),
  licenseExpiry: z.string().optional().or(z.literal("")),
});

type StaffFormData = z.infer<typeof staffSchema>;

// ── Staff Sheet ────────────────────────────────────────────────────────────

function StaffSheet({
  open,
  onClose,
  editing,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  editing: StaffMember | null;
  onSave: (fd: FormData, id?: number) => Promise<void>;
}) {
  const [avatarPreview, setAvatarPreview] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isCustomDept, setIsCustomDept] = useState(false);

  const defaultValues: StaffFormData = {
    name: "",
    phone1: "",
    phone2: "",
    officialEmail: "",
    department: "",
    status: "Active",
    dateOfBirth: "",
    nationalId: "",
    address: "",
    emergencyContact: "",
    licenseNumber: "",
    licenseExpiry: "",
  };

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<StaffFormData>({
    resolver: zodResolver(staffSchema),
    values: editing
      ? {
          name: editing.name,
          phone1: editing.phone1,
          phone2: editing.phone2 ?? "",
          officialEmail: editing.officialEmail ?? "",
          department: editing.department ?? "",
          status: editing.status,
          dateOfBirth: editing.dateOfBirth ?? "",
          nationalId: editing.nationalId ?? "",
          address: editing.address ?? "",
          emergencyContact: editing.emergencyContact ?? "",
          licenseNumber: editing.licenseNumber ?? "",
          licenseExpiry: editing.licenseExpiry ?? "",
        }
      : defaultValues,
  });

  useEffect(() => {
    if (editing) {
      setAvatarPreview(editing.avatarUrl ?? "");
      setIsCustomDept(!ALL_DEPARTMENTS.includes(editing.department || ""));
    } else {
      setAvatarPreview("");
      setSelectedFile(null);
      setIsCustomDept(false);
    }
  }, [editing, open]);

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function onSubmit(data: StaffFormData) {
    setIsSaving(true);
    try {
      const fd = new FormData();
      Object.entries(data).forEach(([k, v]) => fd.append(k, v || ""));
      if (selectedFile) fd.append("avatar", selectedFile);

      await onSave(fd, editing?.id);
      handleClose();
    } finally {
      setIsSaving(false);
    }
  }

  function handleClose() {
    reset(defaultValues);
    onClose();
  }

  // Fixed FI component with proper typing
  const FI = ({
    name,
    label,
    placeholder,
    type = "text",
  }: {
    name: FieldPath<StaffFormData>;
    label: string;
    placeholder?: string;
    type?: string;
  }) => (
    <div className="space-y-1.5">
      <Label
        className="text-xs font-semibold uppercase tracking-wider"
        style={{ color: C.muted }}>
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
        <p className="text-xs text-red-500 mt-0.5">
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
            {editing ? "Edit Staff Member" : "Add New Staff Member"}
          </SheetTitle>
          <SheetDescription className="mt-1 text-sm" style={{ color: C.muted }}>
            {editing
              ? `Editing details for ${editing.name}.`
              : "Fill in the details to add a new team member."}
          </SheetDescription>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="px-7 py-6 space-y-4">
            {/* Photo Section */}
            <div className="flex items-center gap-4 pb-2">
              <div className="relative flex-shrink-0">
                <Avatar
                  className="w-16 h-16 ring-2 ring-offset-2"
                  style={{ "--tw-ring-color": C.border } as any}>
                  <AvatarImage src={avatarPreview} className="object-cover" />
                  <AvatarFallback
                    className="text-base font-bold text-white"
                    style={{ background: avatarColor(editing?.id ?? 0) }}>
                    {editing ? getInitials(editing.name) : "?"}
                  </AvatarFallback>
                </Avatar>
                <label
                  htmlFor="staff-avatar-upload"
                  className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center cursor-pointer transition-opacity hover:opacity-80"
                  style={{
                    background:
                      "linear-gradient(135deg, #1a3a5c 0%, #1e6ea6 100%)",
                  }}>
                  <Camera size={11} className="text-white" />
                </label>
                <input
                  id="staff-avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: C.dark }}>
                  Profile Photo
                </p>
                <p className="text-xs mt-0.5" style={{ color: C.muted }}>
                  JPG or PNG. Maximum 5MB.
                </p>
              </div>
            </div>

            <div className="h-px" style={{ background: C.border }} />
            <p
              className="text-[10px] font-bold uppercase tracking-widest"
              style={{ color: C.muted }}>
              Personal Information
            </p>

            <FI
              name="name"
              label="Full Name *"
              placeholder="e.g. Andrew Musoke"
            />
            <div className="grid grid-cols-2 gap-3">
              <FI name="dateOfBirth" label="Date of Birth" type="date" />
              <FI
                name="nationalId"
                label="National ID"
                placeholder="ID Number"
              />
            </div>
            <FI
              name="address"
              label="Home Address"
              placeholder="Street, City, Country"
            />
            <FI
              name="emergencyContact"
              label="Emergency Contact"
              placeholder="Name & Phone"
            />

            <div className="h-px" style={{ background: C.border }} />
            <p
              className="text-[10px] font-bold uppercase tracking-widest"
              style={{ color: C.muted }}>
              Work & Contact
            </p>

            <div className="grid grid-cols-2 gap-3">
              <FI name="phone1" label="Phone 1 *" placeholder="+256..." />
              <FI name="phone2" label="Phone 2" placeholder="+256..." />
            </div>
            <FI
              name="officialEmail"
              label="Official Email"
              type="email"
              placeholder="name@bluepearls.co.ug"
            />

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label
                  className="text-xs font-semibold uppercase tracking-wider"
                  style={{ color: C.muted }}>
                  Department
                </Label>
                {!isCustomDept ? (
                  <Controller
                    name="department"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value ?? ""}
                        onValueChange={(val) => {
                          if (val === "CUSTOM") setIsCustomDept(true);
                          else field.onChange(val);
                        }}>
                        <SelectTrigger className="h-10 rounded-xl text-sm">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {ALL_DEPARTMENTS.map((d) => (
                            <SelectItem key={d} value={d}>
                              {d}
                            </SelectItem>
                          ))}
                          <SelectItem
                            value="CUSTOM"
                            className="text-blue-600 font-semibold">
                            + Add Custom
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                ) : (
                  <div className="relative">
                    <Controller
                      name="department"
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          autoFocus
                          placeholder="Type department..."
                          className="h-10 rounded-xl text-sm pr-8"
                        />
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomDept(false);
                        setValue("department", "");
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500">
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>
              <div className="space-y-1.5">
                <Label
                  className="text-xs font-semibold uppercase tracking-wider"
                  style={{ color: C.muted }}>
                  Status
                </Label>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="h-10 rounded-xl text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ALL_STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            {editing?.role === "DRIVER" && (
              <>
                <div className="h-px" style={{ background: C.border }} />
                <p
                  className="text-[10px] font-bold uppercase tracking-widest"
                  style={{ color: C.muted }}>
                  Driver Details
                </p>
                <FI name="licenseNumber" label="License Number" />
                <FI name="licenseExpiry" label="License Expiry" type="date" />
              </>
            )}
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
                "Add Staff Member"
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}

// ── Delete Dialog ──────────────────────────────────────────────────────────

function DeleteDialog({ open, onClose, staff, onConfirm }: any) {
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
            Remove Staff Member
          </DialogTitle>
          <DialogDescription style={{ color: C.muted }}>
            Are you sure you want to remove{" "}
            <strong style={{ color: C.dark }}>{staff?.name}</strong>?
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
              "Remove"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function Staff() {
  const navigate = useNavigate();
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    StaffMember["status"] | "ALL"
  >("ALL");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<StaffMember | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StaffMember | null>(null);

  const fetchStaff = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/staff`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("bp_token")}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        // Normalize status values from API (Option 4)
        const normalizedData = data.map((member: any) => ({
          ...member,
          status: normalizeStatus(member.status),
        }));
        setStaffList(normalizedData);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const filtered = useMemo(
    () =>
      staffList.filter((s) => {
        const q = search.toLowerCase();
        const matchSearch =
          !q ||
          s.name.toLowerCase().includes(q) ||
          s.officialEmail?.toLowerCase().includes(q);
        const matchStatus = statusFilter === "ALL" || s.status === statusFilter;
        return matchSearch && matchStatus;
      }),
    [staffList, search, statusFilter],
  );

  async function handleSave(formData: FormData, id?: number) {
    const method = id ? "PATCH" : "POST";
    const url = id ? `${API_URL}/staff/${id}` : `${API_URL}/staff/create`;
    try {
      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${localStorage.getItem("bp_token")}`,
        },
        body: formData,
      });
      if (res.ok) {
        toast.success(id ? "Staff updated" : "Staff added");
        fetchStaff();
      } else {
        const err = await res.json();
        toast.error(err.error || "Operation failed");
      }
    } catch {
      toast.error("Network error");
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`${API_URL}/staff/${deleteTarget.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("bp_token")}`,
        },
      });
      if (res.ok) {
        toast.success("Staff removed");
        fetchStaff();
      }
    } catch {
      toast.error("Network error");
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
            Staff Directory
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
          <Plus size={15} /> Add Staff
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          {
            label: "Total Staff",
            value: staffList.length,
            icon: Users,
            color: "#1e6ea6",
            bg: "#1e6ea618",
          },
          {
            label: "Active",
            value: staffList.filter((s) => s.status === "Active").length,
            icon: UserCheck,
            color: C.green,
            bg: `${C.green}18`,
          },
          {
            label: "Drivers",
            value: staffList.filter((s) => s.role === "DRIVER").length,
            icon: Truck,
            color: "#b8922a",
            bg: `${C.yellow}22`,
          },
          {
            label: "Management",
            value: staffList.filter((s) =>
              ["MANAGER", "SUPER_ADMIN"].includes(s.role),
            ).length,
            icon: Shield,
            color: C.blue,
            bg: `${C.blue}18`,
          },
        ].map((card, i) => (
          <div
            key={card.label}
            className="rounded-2xl p-4"
            style={{
              background: "#fff",
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
        className="rounded-2xl p-4 mb-4 flex items-center gap-3"
        style={{
          background: "#fff",
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
            placeholder="Search by name, email..."
            className="pl-9 h-9 rounded-xl text-sm border-0 bg-[#F5F4EF]"
          />
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <Filter size={13} style={{ color: C.muted }} />
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as any)}>
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
        </div>
      </div>

      <div
        className="rounded-2xl overflow-hidden min-h-[400px]"
        style={{
          background: "#fff",
          border: `1px solid ${C.border}`,
          animation: "fadeSlideUp 0.4s ease 0.28s both",
        }}>
        <div
          className="grid px-5 py-3 text-[10px] font-semibold uppercase tracking-widest"
          style={{
            gridTemplateColumns: "2fr 1.8fr 1fr 1fr 52px",
            color: C.muted,
            borderBottom: `1px solid ${C.border}`,
            background: "#FAFAF8",
          }}>
          <span>Staff Member</span>
          <span>Contact</span>
          <span>Department</span>
          <span>Status</span>
          <span />
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-3">
            <Loader2
              className="w-8 h-8 animate-spin"
              style={{ color: C.blue }}
            />
            <p className="text-sm font-medium" style={{ color: C.muted }}>
              Loading directory…
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
            <Users size={28} style={{ color: C.border }} className="mb-4" />
            <h3 className="text-base font-bold mb-1" style={{ color: C.dark }}>
              No Staff Found
            </h3>
            <p
              className="text-sm max-w-[280px] mb-6"
              style={{ color: C.muted }}>
              Try adjusting your filters or add a new team member.
            </p>
            <Button
              onClick={() => setSheetOpen(true)}
              variant="outline"
              className="rounded-xl h-9 px-5 border-[#c4dff0] text-[#1a3a5c]">
              <Plus size={14} className="mr-2" /> Add Staff Member
            </Button>
          </div>
        ) : (
          filtered.map((s, i) => {
            // Safe access to status styles
            const statusStyle = STATUS_STYLES[s.status] || {
              color: C.muted,
              dot: C.muted,
            };

            return (
              <div
                key={s.id}
                onClick={() => navigate(`/staff/${s.id}`)}
                className="grid items-center px-5 py-3.5 cursor-pointer transition-colors hover:bg-[#F5F4EF]"
                style={{
                  gridTemplateColumns: "2fr 1.8fr 1fr 1fr 52px",
                  borderBottom:
                    i < filtered.length - 1 ? `1px solid ${C.border}` : "none",
                  animation: `fadeSlideUp 0.3s ease ${0.3 + i * 0.04}s both`,
                }}>
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarImage src={s.avatarUrl} />
                    <AvatarFallback
                      className="text-xs font-bold text-white"
                      style={{ background: avatarColor(s.id) }}>
                      {getInitials(s.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p
                      className="text-sm font-semibold truncate"
                      style={{ color: C.dark }}>
                      {s.name}
                    </p>
                    <p className="text-[11px]" style={{ color: C.muted }}>
                      #{String(s.id).padStart(4, "0")} · {ROLE_LABELS[s.role]}
                    </p>
                  </div>
                </div>
                <div className="min-w-0">
                  <p className="text-xs truncate" style={{ color: C.dark }}>
                    {s.officialEmail ?? "—"}
                  </p>
                  <p className="text-[11px] mt-0.5" style={{ color: C.muted }}>
                    {s.phone1}
                  </p>
                </div>
                <p className="text-xs truncate" style={{ color: C.dark }}>
                  {s.department ?? "—"}
                </p>
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ background: statusStyle.dot }}
                  />
                  <span
                    className="text-xs font-medium"
                    style={{ color: statusStyle.color }}>
                    {s.status}
                  </span>
                </div>
                <div onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#F0EFE9]"
                        style={{ color: C.muted }}>
                        <MoreHorizontal size={15} />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-40 rounded-xl">
                      <DropdownMenuItem
                        onClick={() => navigate(`/staff/${s.id}`)}
                        className="text-xs cursor-pointer">
                        <UserCheck size={13} className="mr-2" /> View Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setEditing(s);
                          setSheetOpen(true);
                        }}
                        className="text-xs cursor-pointer">
                        <Pencil size={13} className="mr-2" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setDeleteTarget(s)}
                        className="text-xs cursor-pointer text-red-500 focus:text-red-500">
                        <Trash2 size={13} className="mr-2" /> Remove
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            );
          })
        )}
      </div>

      <StaffSheet
        open={sheetOpen}
        onClose={() => {
          setSheetOpen(false);
          setEditing(null);
        }}
        editing={editing}
        onSave={handleSave}
      />
      <DeleteDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        staff={deleteTarget}
        onConfirm={handleDelete}
      />
    </div>
  );
}
