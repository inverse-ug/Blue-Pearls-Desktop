import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  ArrowLeft,
  Mail,
  Phone,
  Building2,
  Calendar,
  Pencil,
  Trash2,
  PhoneCall,
  UserCog,
  Hash,
  Cake,
  CreditCard,
  Home,
  Camera,
  Loader2,
  Inbox,
  X,
} from "lucide-react";
import { C } from "../layouts/Layout";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  type StaffMember,
  type Role,
  ROLE_LABELS,
  ALL_DEPARTMENTS,
  ALL_STATUSES,
} from "./Staff";

// ── Configuration ─────────────────────────────────────────────────────────────
const API_URL = "https://blue-pearls-server.vercel.app";

// ── Helpers ────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<
  StaffMember["status"],
  { bg: string; color: string; dot: string }
> = {
  Active: { bg: `${C.green}18`, color: C.green, dot: C.green },
  Inactive: { bg: `${C.muted}15`, color: C.muted, dot: C.muted },
  "On Leave": { bg: `${C.yellow}22`, color: "#b8922a", dot: C.yellow },
};

const ROLE_COLORS: Record<Role, { bg: string; color: string }> = {
  SUPER_ADMIN: { bg: "#1a3a5c18", color: "#1a3a5c" },
  MANAGER: { bg: `${C.blue}18`, color: C.blue },
  TRUCK_COORDINATOR: { bg: `${C.green}18`, color: C.green },
  PSV_COORDINATOR: { bg: `${C.green}18`, color: C.green },
  DRIVER: { bg: `${C.yellow}22`, color: "#b8922a" },
  SECURITY_GUARD: { bg: `${C.red}18`, color: C.red },
  FUEL_AGENT: { bg: "#8B5CF618", color: "#8B5CF6" },
  IMPLANT: { bg: `${C.muted}18`, color: C.muted },
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

function formatDate(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// ── Activity Log Logic ─────────────────────────────────────────────────────

// ── Info Row ───────────────────────────────────────────────────────────────

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value?: string;
}) {
  return (
    <div
      className="flex items-start gap-3 py-3"
      style={{ borderBottom: `1px solid ${C.border}` }}>
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{ background: "#F5F4EF" }}>
        <Icon size={13} style={{ color: C.muted }} />
      </div>
      <div className="min-w-0 flex-1">
        <p
          className="text-[10px] font-semibold uppercase tracking-wider mb-0.5"
          style={{ color: C.muted }}>
          {label}
        </p>
        <p
          className="text-sm font-medium break-words"
          style={{ color: value ? C.dark : C.muted }}>
          {value || "—"}
        </p>
      </div>
    </div>
  );
}

// ── Zod Schema ─────────────────────────────────────────────────────────────

const editSchema = z.object({
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

type EditFormData = z.infer<typeof editSchema>;

// ── Edit Sheet ─────────────────────────────────────────────────────────────

function EditSheet({
  open,
  onClose,
  staff,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  staff: StaffMember;
  onSave: (formData: FormData) => Promise<void>;
}) {
  const [avatarPreview, setAvatarPreview] = useState<string>(
    staff.avatarUrl ?? "",
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isCustomDept, setIsCustomDept] = useState(false);

  const { control, handleSubmit, setValue } = useForm<EditFormData>({
    //@ts-ignore - zod version mismatch workaround
    resolver: zodResolver(editSchema),
    values: {
      name: staff.name,
      phone1: staff.phone1,
      phone2: staff.phone2 ?? "",
      officialEmail: staff.officialEmail ?? "",
      department: staff.department ?? "",
      status: staff.status,
      dateOfBirth: staff.dateOfBirth ?? "",
      nationalId: staff.nationalId ?? "",
      address: staff.address ?? "",
      emergencyContact: staff.emergencyContact ?? "",
      licenseNumber: staff.licenseNumber ?? "",
      licenseExpiry: staff.licenseExpiry ?? "",
    },
  });

  useEffect(() => {
    setAvatarPreview(staff.avatarUrl ?? "");
    setIsCustomDept(!ALL_DEPARTMENTS.includes(staff.department || ""));
  }, [staff, open]);

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function onSubmit(data: EditFormData) {
    setIsSaving(true);
    try {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        formData.append(key, value || "");
      });
      if (selectedFile) formData.append("avatar", selectedFile);

      await onSave(formData);
      onClose();
    } finally {
      setIsSaving(false);
    }
  }

  const FI = ({ name, label, placeholder, type = "text" }: any) => (
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
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={(o) => !o && !isSaving && onClose()}>
      <SheetContent
        className="w-[460px] sm:w-[520px] overflow-y-auto !p-0"
        style={{ fontFamily: "'Inter', sans-serif" }}>
        <div
          className="px-7 py-6"
          style={{ borderBottom: `1px solid ${C.border}` }}>
          <SheetTitle className="text-lg font-bold" style={{ color: C.dark }}>
            Edit Staff Member
          </SheetTitle>
          <SheetDescription className="mt-1 text-sm" style={{ color: C.muted }}>
            Editing details for {staff.name}.
          </SheetDescription>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="px-7 py-6 space-y-4">
            <div className="flex items-center gap-4 pb-2">
              <div className="relative flex-shrink-0">
                <Avatar
                  className="w-16 h-16 ring-2 ring-offset-2"
                  style={{ "--tw-ring-color": C.border } as any}>
                  <AvatarImage src={avatarPreview} className="object-cover" />
                  <AvatarFallback
                    className="text-base font-bold text-white"
                    style={{ background: avatarColor(staff.id) }}>
                    {getInitials(staff.name)}
                  </AvatarFallback>
                </Avatar>
                <label
                  htmlFor="avatar-upload"
                  className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center cursor-pointer transition-opacity hover:opacity-80"
                  style={{
                    background:
                      "linear-gradient(135deg, #1a3a5c 0%, #1e6ea6 100%)",
                  }}>
                  <Camera size={11} className="text-white" />
                </label>
                <input
                  id="avatar-upload"
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

            <FI name="name" label="Full Name *" />
            <div className="grid grid-cols-2 gap-3">
              <FI name="dateOfBirth" label="Date of Birth" type="date" />
              <FI name="nationalId" label="National ID" />
            </div>
            <FI name="address" label="Address" />
            <FI name="emergencyContact" label="Emergency Contact" />

            <div className="h-px" style={{ background: C.border }} />
            <p
              className="text-[10px] font-bold uppercase tracking-widest"
              style={{ color: C.muted }}>
              Work & Contact
            </p>

            <div className="grid grid-cols-2 gap-3">
              <FI name="phone1" label="Phone 1 *" />
              <FI name="phone2" label="Phone 2" />
            </div>

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
          </div>

          <div className="px-7 pb-7 flex gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={isSaving}
              onClick={onClose}
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
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}

// ── Delete Dialog ──────────────────────────────────────────────────────────

function DeleteDialog({
  open,
  onClose,
  name,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  name: string;
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
            Remove Staff Member
          </DialogTitle>
          <DialogDescription style={{ color: C.muted }}>
            Are you sure you want to remove{" "}
            <strong style={{ color: C.dark }}>{name}</strong>?
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

// ── StaffDetail Page ───────────────────────────────────────────────────────

export default function StaffDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [staff, setStaff] = useState<StaffMember | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [rightTab, setRightTab] = useState("details");
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const fetchDetail = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/staff/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("bp_token")}`,
        },
      });
      const data = await response.json();
      if (response.ok) setStaff(data);
      else toast.error("Staff member not found");
    } catch (err) {
      toast.error("Network error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  async function handleSave(formData: FormData) {
    try {
      const response = await fetch(`${API_URL}/staff/${id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("bp_token")}`,
        },
        body: formData,
      });

      if (response.ok) {
        toast.success("Profile updated");
        fetchDetail();
      } else {
        toast.error("Update failed");
      }
    } catch (err) {
      toast.error("Network error");
    }
  }

  async function handleDelete() {
    try {
      const response = await fetch(`${API_URL}/staff/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("bp_token")}`,
        },
      });
      if (response.ok) {
        toast.success("Staff removed");
        navigate("/staff");
      } else {
        toast.error("Failed to remove staff member");
      }
    } catch (err) {
      toast.error("Network error");
    }
  }

  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: C.blue }} />
        <p className="text-sm font-medium" style={{ color: C.muted }}>
          Loading profile…
        </p>
      </div>
    );
  }

  if (!staff) return null;

  const roleStyle = ROLE_COLORS[staff.role] || {
    bg: `${C.muted}18`,
    color: C.muted,
  };
  const statusStyle = STATUS_STYLES[staff.status] || {
    bg: `${C.muted}15`,
    color: C.muted,
    dot: C.muted,
  };

  return (
    <div
      className="h-full overflow-auto flex flex-col"
      style={{ fontFamily: "'Inter', sans-serif" }}>
      <div
        className="flex items-center gap-2 px-6 pt-5 pb-3 flex-shrink-0"
        style={{ animation: "fadeSlideUp 0.3s ease both" }}>
        <button
          onClick={() => navigate("/staff")}
          className="flex items-center gap-1.5 text-xs font-medium transition-opacity hover:opacity-60"
          style={{ color: C.muted }}>
          <ArrowLeft size={13} /> Staff Directory
        </button>
        <span style={{ color: C.border }}>›</span>
        <span className="text-xs font-semibold" style={{ color: C.dark }}>
          {staff.name}
        </span>
      </div>

      <div className="flex gap-4 px-6 pb-6">
        <div
          className="w-[260px] flex-shrink-0 flex flex-col gap-0 rounded-2xl overflow-hidden"
          style={{
            background: "#fff",
            border: `1px solid ${C.border}`,
            animation: "fadeSlideUp 0.4s ease 0.05s both",
          }}>
          <div className="relative">
            <div
              className="h-[72px]"
              style={{
                background: "linear-gradient(135deg, #1a3a5c 0%, #1e6ea6 100%)",
              }}
            />
            <div
              className="absolute left-1/2 -translate-x-1/2"
              style={{ top: 36 }}>
              <Avatar className="w-14 h-14 ring-[3px] ring-white">
                <AvatarImage src={staff.avatarUrl} className="object-cover" />
                <AvatarFallback
                  className="text-base font-bold text-white"
                  style={{ background: avatarColor(staff.id) }}>
                  {getInitials(staff.name)}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>

          <div
            className="pt-10 pb-4 px-4 text-center"
            style={{ borderBottom: `1px solid ${C.border}` }}>
            <h3 className="text-sm font-bold mb-0.5" style={{ color: C.dark }}>
              {staff.name}
            </h3>
            <p className="text-[11px] mb-3" style={{ color: C.muted }}>
              #{String(staff.id).padStart(4, "0")} &nbsp;·&nbsp;{" "}
              {staff.department ?? "General"}
            </p>
            <div className="flex items-center justify-center gap-1.5 flex-wrap mb-4">
              <span
                className="text-[10px] font-semibold px-2 py-0.5 rounded-md"
                style={{ background: roleStyle.bg, color: roleStyle.color }}>
                {ROLE_LABELS[staff.role]}
              </span>
              <span
                className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md"
                style={{
                  background: statusStyle.bg,
                  color: statusStyle.color,
                }}>
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: statusStyle.dot }}
                />
                {staff.status}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setEditOpen(true)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold text-white transition-all duration-200"
                style={{
                  background:
                    "linear-gradient(135deg, #1a3a5c 0%, #1e6ea6 100%)",
                  boxShadow: "0 2px 8px rgba(26,58,92,0.25)",
                }}>
                <Pencil size={12} /> Edit
              </button>
              <button
                onClick={() => setDeleteOpen(true)}
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors hover:bg-red-50"
                style={{ border: `1px solid ${C.border}`, color: C.red }}>
                <Trash2 size={13} />
              </button>
            </div>
          </div>

          <div
            className="flex flex-shrink-0"
            style={{ borderBottom: `1px solid ${C.border}` }}>
            <div
              className="flex-1 py-2.5 text-xs font-semibold text-center"
              style={{ color: "#1e6ea6", borderBottom: "2px solid #1e6ea6" }}>
              Staff Info
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="px-4 pb-4">
              {staff.officialEmail && (
                <div
                  className="flex items-center gap-2.5 py-3 text-xs"
                  style={{
                    color: C.dark,
                    borderBottom: `1px solid ${C.border}`,
                  }}>
                  <Mail size={13} style={{ color: C.muted }} />
                  <span className="truncate">{staff.officialEmail}</span>
                </div>
              )}
              <div
                className="flex items-center gap-2.5 py-3 text-xs"
                style={{
                  color: C.dark,
                  borderBottom: `1px solid ${C.border}`,
                }}>
                <Phone size={13} style={{ color: C.muted }} />
                <span>{staff.phone1}</span>
              </div>
            </div>
          </div>
        </div>

        <div
          className="flex-1 min-w-0 flex flex-col"
          style={{ animation: "fadeSlideUp 0.4s ease 0.1s both" }}>
          <div className="mb-4">
            <h2
              className="text-2xl font-bold tracking-tight"
              style={{ color: C.dark }}>
              {staff.name}
            </h2>
            <p className="text-sm mt-0.5" style={{ color: C.muted }}>
              Joined {formatDate(staff.createdAt)}&nbsp;&nbsp;·&nbsp;&nbsp;
              {staff.department ?? "General"}
            </p>
          </div>

          <div
            className="flex items-center mb-4 gap-1"
            style={{ borderBottom: `2px solid ${C.border}` }}>
            {[
              { value: "details", label: "Details" },
              { value: "work", label: "Work Info" },
            ].map((t) => (
              <button
                key={t.value}
                onClick={() => setRightTab(t.value)}
                className="px-4 py-2.5 text-xs font-semibold transition-colors"
                style={{
                  color: rightTab === t.value ? "#1e6ea6" : C.muted,
                  borderBottom:
                    rightTab === t.value
                      ? "2px solid #1e6ea6"
                      : "2px solid transparent",
                  marginBottom: -2,
                }}>
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto">
            {rightTab === "details" && (
              <div className="grid grid-cols-2 gap-4">
                <div
                  className="rounded-2xl p-4"
                  style={{
                    background: "#fff",
                    border: `1px solid ${C.border}`,
                  }}>
                  <p
                    className="text-[10px] font-bold uppercase tracking-widest mb-1"
                    style={{ color: C.muted }}>
                    Personal Information
                  </p>
                  <InfoRow
                    icon={Hash}
                    label="Staff ID"
                    value={`#${String(staff.id).padStart(4, "0")}`}
                  />
                  <InfoRow
                    icon={Cake}
                    label="Date of Birth"
                    value={formatDate(staff.dateOfBirth)}
                  />
                  <InfoRow
                    icon={CreditCard}
                    label="National ID"
                    value={staff.nationalId}
                  />
                  <InfoRow icon={Home} label="Address" value={staff.address} />
                  <InfoRow
                    icon={PhoneCall}
                    label="Emergency Contact"
                    value={staff.emergencyContact}
                  />
                </div>
                <div
                  className="rounded-2xl p-4"
                  style={{
                    background: "#fff",
                    border: `1px solid ${C.border}`,
                  }}>
                  <p
                    className="text-[10px] font-bold uppercase tracking-widest mb-1"
                    style={{ color: C.muted }}>
                    Contact Details
                  </p>
                  <InfoRow
                    icon={Mail}
                    label="Official Email"
                    value={staff.officialEmail}
                  />
                  <InfoRow
                    icon={Phone}
                    label="Primary Phone"
                    value={staff.phone1}
                  />
                  <InfoRow
                    icon={PhoneCall}
                    label="Secondary Phone"
                    value={staff.phone2}
                  />
                </div>
              </div>
            )}
            {rightTab === "work" && (
              <div
                className="rounded-2xl p-4"
                style={{ background: "#fff", border: `1px solid ${C.border}` }}>
                <p
                  className="text-[10px] font-bold uppercase tracking-widest mb-1"
                  style={{ color: C.muted }}>
                  Work Information
                </p>
                <InfoRow
                  icon={Building2}
                  label="Department"
                  value={staff.department}
                />
                <InfoRow
                  icon={UserCog}
                  label="Role"
                  value={ROLE_LABELS[staff.role]}
                />
                <InfoRow
                  icon={Calendar}
                  label="Date Joined"
                  value={formatDate(staff.createdAt)}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <div
        className="px-6 pb-6 mt-4"
        style={{ animation: "fadeSlideUp 0.4s ease 0.2s both" }}>
        <div
          className="rounded-2xl p-5"
          style={{ background: "#fff", border: `1px solid ${C.border}` }}>
          <p className="text-sm font-bold mb-4" style={{ color: C.dark }}>
            Activity Log
          </p>
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="w-12 h-12 rounded-full bg-[#F5F4EF] flex items-center justify-center mb-3">
              <Inbox size={20} style={{ color: C.border }} />
            </div>
            <p
              className="text-xs font-semibold mb-0.5"
              style={{ color: C.dark }}>
              No Activity Recorded
            </p>
            <p className="text-[11px]" style={{ color: C.muted }}>
              Logs will appear here once assignments or changes occur.
            </p>
          </div>
        </div>
      </div>

      <EditSheet
        open={editOpen}
        onClose={() => setEditOpen(false)}
        staff={staff}
        onSave={handleSave}
      />
      <DeleteDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        name={staff.name}
        onConfirm={handleDelete}
      />
    </div>
  );
}
