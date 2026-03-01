import { useState, useMemo, useEffect, useCallback, memo } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
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
  Fuel,
  Wrench,
  CreditCard,
  Building2,
  AlertCircle,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// ── Configuration ─────────────────────────────────────────────────────────────
const API_URL = "https://blue-pearls-server.vercel.app";
const SKY_BLUE = "#06a3d8";
const MAX_IMAGE_SIZE = 4 * 1024 * 1024; // 4MB

// ── Types ──────────────────────────────────────────────────────────────────

export type Role =
  | "IMPLANT"
  | "MANAGER"
  | "SUPER_ADMIN"
  | "PSV_COORDINATOR"
  | "TRUCK_COORDINATOR"
  | "DRIVER"
  | "SECURITY_GUARD"
  | "FUEL_AGENT"
  | "FUEL_MANAGER"
  | "ALLOWANCE_MANAGER"
  | "WORKSHOP_MANAGER"
  | "FINANCE_MANAGER";

export interface StaffMember {
  id: number;
  name: string;
  phone1: string;
  phone2?: string | null;
  officialEmail?: string | null;
  role: Role;
  avatarUrl?: string | null;
  createdAt: string;
  status: "Active" | "Inactive" | "On Leave";
  dateOfBirth?: string | null;
  nationalId?: string | null;
  address?: string | null;
  emergencyContact?: string | null;
  licenseNumber?: string | null;
  licenseExpiry?: string | null;
  licenseClass?: string | null;
  placementId?: number | null;
  placementName?: string | null;
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
  FUEL_MANAGER: "Fuel Manager",
  ALLOWANCE_MANAGER: "Allowance Manager",
  WORKSHOP_MANAGER: "Workshop Manager",
  FINANCE_MANAGER: "Finance Manager",
};

export const ROLE_CATEGORIES = {
  MANAGEMENT: [
    "MANAGER",
    "SUPER_ADMIN",
    "PSV_COORDINATOR",
    "TRUCK_COORDINATOR",
  ],
  FUEL: ["FUEL_MANAGER", "FUEL_AGENT"],
  FINANCE: ["FINANCE_MANAGER", "ALLOWANCE_MANAGER"],
  WORKSHOP: ["WORKSHOP_MANAGER"],
  OPERATIONS: ["IMPLANT", "DRIVER", "SECURITY_GUARD"],
};

export const ALL_STATUSES: StaffMember["status"][] = [
  "Active",
  "Inactive",
  "On Leave",
];

export const LICENSE_CLASSES = ["A", "B", "C", "D", "E", "CM", "CH", "DL"];

const VALID_STATUSES = ["Active", "Inactive", "On Leave"];
function normalizeStatus(status: string): StaffMember["status"] {
  if (VALID_STATUSES.includes(status)) {
    return status as StaffMember["status"];
  }
  return "Active";
}

// ── Image Compression Helper ─────────────────────────────────────────────────
async function compressImage(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        // Max dimensions
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Failed to compress image"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Start with high quality, reduce until under 4MB
        let quality = 0.9;

        const tryCompress = () => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error("Failed to compress image"));
                return;
              }

              if (blob.size <= MAX_IMAGE_SIZE || quality <= 0.1) {
                const compressedFile = new File([blob], file.name, {
                  type: "image/jpeg",
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } else {
                quality -= 0.1;
                tryCompress();
              }
            },
            "image/jpeg",
            quality,
          );
        };

        tryCompress();
      };
      img.onerror = () => reject(new Error("Failed to load image"));
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
  });
}

// ── Helpers ────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<
  StaffMember["status"],
  { color: string; bg: string; dot: string }
> = {
  Active: { color: "#16a34a", bg: "#16a34a18", dot: "#16a34a" },
  Inactive: { color: "#6b7280", bg: "#6b728018", dot: "#6b7280" },
  "On Leave": { color: "#b8922a", bg: "#E1BA5820", dot: "#b8922a" },
};

const ROLE_STYLES: Record<string, { color: string; bg: string; icon: any }> = {
  DRIVER: { color: "#b8922a", bg: "#E1BA5820", icon: Truck },
  FUEL_AGENT: { color: SKY_BLUE, bg: `${SKY_BLUE}18`, icon: Fuel },
  FUEL_MANAGER: { color: SKY_BLUE, bg: `${SKY_BLUE}18`, icon: Fuel },
  WORKSHOP_MANAGER: { color: "#f97316", bg: "#f9731618", icon: Wrench },
  FINANCE_MANAGER: { color: "#16a34a", bg: "#16a34a18", icon: CreditCard },
  ALLOWANCE_MANAGER: { color: "#8b5cf6", bg: "#8b5cf618", icon: CreditCard },
  MANAGER: { color: "#1e6ea6", bg: "#1e6ea618", icon: Shield },
  SUPER_ADMIN: { color: "#1a3a5c", bg: "#1a3a5c18", icon: Shield },
  IMPLANT: { color: "#6b7280", bg: "#6b728018", icon: Building2 },
  SECURITY_GUARD: { color: "#ef4444", bg: "#ef444418", icon: Shield },
  PSV_COORDINATOR: { color: "#16a34a", bg: "#16a34a18", icon: Truck },
  TRUCK_COORDINATOR: { color: "#16a34a", bg: "#16a34a18", icon: Truck },
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
  SKY_BLUE,
  "#16a34a",
  "#8B5CF6",
  "#0891b2",
  "#059669",
];

function avatarColor(id: number) {
  return AVATAR_COLORS[id % AVATAR_COLORS.length];
}

// ── Zod Schema ─────────────────────────────────────────────────────────────
const staffSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    phone1: z.string().min(7, "Primary phone is required"),
    phone2: z.string().optional().nullable(),
    officialEmail: z
      .string()
      .optional()
      .nullable()
      .transform((v) => (v === "" ? null : v))
      .refine(
        (v) =>
          v === null || v === undefined || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
        { message: "Enter a valid email" },
      ),
    status: z.enum(["Active", "Inactive", "On Leave"]),
    dateOfBirth: z.string().optional().nullable(),
    nationalId: z.string().optional().nullable(),
    address: z.string().optional().nullable(),
    emergencyContact: z.string().optional().nullable(),
    licenseNumber: z
      .string()
      .optional()
      .nullable()
      .refine(
        (val) => {
          if (!val) return true;
          return val.length >= 5;
        },
        { message: "License number must be at least 5 characters" },
      ),
    licenseExpiry: z.string().optional().nullable(),
    licenseClass: z.string().optional().nullable(),
    placementId: z.coerce.number().optional().nullable(),
  })
  .refine(
    (data) => {
      // If any driver field is filled, validate all required driver fields
      const hasAnyDriverField =
        data.licenseNumber || data.licenseExpiry || data.licenseClass;

      if (hasAnyDriverField) {
        return !!(
          data.licenseNumber &&
          data.licenseExpiry &&
          data.licenseClass
        );
      }
      return true;
    },
    {
      message: "All driver fields are required when any driver field is filled",
      path: ["licenseNumber"],
    },
  );

type StaffFormData = z.infer<typeof staffSchema>;

// ── FI & SelectField components ────────────────────────────────────────────

interface FieldProps {
  name: keyof StaffFormData;
  label: string;
  placeholder?: string;
  type?: string;
  required?: boolean;
  control: any;
  errors: any;
  disabled?: boolean;
}

const FI = memo(
  ({
    name,
    label,
    placeholder,
    type = "text",
    required,
    control,
    errors,
    disabled,
  }: FieldProps) => {
    const error = errors[name];
    const errorMessage = error?.message;

    return (
      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-slate-700">
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
        <Controller
          name={name}
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              value={field.value?.toString() ?? ""}
              type={type}
              placeholder={placeholder}
              disabled={disabled}
              onChange={(e) => {
                field.onChange(e);
              }}
              className={`h-10 rounded-xl text-sm transition-colors ${
                error ? "border-red-500 focus-visible:ring-red-500" : ""
              } ${disabled ? "bg-slate-50" : ""}`}
            />
          )}
        />
        {errorMessage && (
          <p className="text-[10px] text-red-500 mt-0.5 flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
            <AlertCircle size={10} />
            {errorMessage}
          </p>
        )}
      </div>
    );
  },
);

interface SelectFieldProps extends FieldProps {
  options: string[];
}

const SelectField = memo(
  ({
    name,
    label,
    options,
    required,
    control,
    errors,
    disabled,
  }: SelectFieldProps) => {
    const error = errors[name];
    const errorMessage = error?.message;

    return (
      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-slate-700">
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
        <Controller
          name={name}
          control={control}
          render={({ field }) => (
            <Select
              value={field.value?.toString() ?? "none"}
              onValueChange={(val) => {
                field.onChange(val === "none" ? "" : val);
              }}
              disabled={disabled}>
              <SelectTrigger
                className={`h-10 rounded-xl text-sm transition-colors ${
                  error ? "border-red-500 focus-visible:ring-red-500" : ""
                } ${disabled ? "bg-slate-50" : ""}`}>
                <SelectValue placeholder={`Select ${label}`} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {options.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errorMessage && (
          <p className="text-[10px] text-red-500 mt-0.5 flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
            <AlertCircle size={10} />
            {errorMessage}
          </p>
        )}
      </div>
    );
  },
);

// ── Staff Sheet ────────────────────────────────────────────────────────────

interface StaffSheetProps {
  open: boolean;
  onClose: () => void;
  editing: StaffMember | null;
  onSave: (fd: FormData, id?: number) => Promise<void>;
  clients?: Array<{ id: number; name: string }>;
}

function StaffSheet({
  open,
  onClose,
  editing,
  onSave,
  clients = [],
}: StaffSheetProps) {
  const [avatarPreview, setAvatarPreview] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("personal");
  const [selectedRole, setSelectedRole] = useState<Role>(
    editing?.role || "DRIVER",
  );
  const [imageError, setImageError] = useState<string>("");
  const [isCompressing, setIsCompressing] = useState(false);

  const defaultValues: StaffFormData = {
    name: "",
    phone1: "",
    phone2: "",
    officialEmail: "",
    status: "Active",
    dateOfBirth: "",
    nationalId: "",
    address: "",
    emergencyContact: "",
    licenseNumber: "",
    licenseExpiry: "",
    licenseClass: "",
    placementId: null,
  };

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isValid },
  } = useForm<StaffFormData>({
    resolver: zodResolver(staffSchema),
    mode: "onChange",
    defaultValues: editing
      ? {
          name: editing.name,
          phone1: editing.phone1,
          phone2: editing.phone2 || "",
          officialEmail: editing.officialEmail || "",
          status: editing.status,
          dateOfBirth: editing.dateOfBirth || "",
          nationalId: editing.nationalId || "",
          address: editing.address || "",
          emergencyContact: editing.emergencyContact || "",
          licenseNumber: editing.licenseNumber || "",
          licenseExpiry: editing.licenseExpiry || "",
          licenseClass: editing.licenseClass || "",
          placementId: editing.placementId || null,
        }
      : defaultValues,
  });

  const watchLicenseNumber = watch("licenseNumber");
  const watchLicenseExpiry = watch("licenseExpiry");
  const watchLicenseClass = watch("licenseClass");

  useEffect(() => {
    if (open) {
      if (editing) {
        setAvatarPreview(editing.avatarUrl ?? "");
        setSelectedRole(editing.role);
        reset({
          name: editing.name,
          phone1: editing.phone1,
          phone2: editing.phone2 || "",
          officialEmail: editing.officialEmail || "",
          status: editing.status,
          dateOfBirth: editing.dateOfBirth || "",
          nationalId: editing.nationalId || "",
          address: editing.address || "",
          emergencyContact: editing.emergencyContact || "",
          licenseNumber: editing.licenseNumber || "",
          licenseExpiry: editing.licenseExpiry || "",
          licenseClass: editing.licenseClass || "",
          placementId: editing.placementId || null,
        });
      } else {
        setAvatarPreview("");
        setSelectedFile(null);
        setSelectedRole("DRIVER");
        reset(defaultValues);
      }
      setImageError("");
      setActiveTab("personal");
    }
  }, [editing, open, reset]);

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageError("");
    setIsCompressing(true);

    try {
      // Check file size first
      if (file.size > MAX_IMAGE_SIZE) {
        // Try to compress
        const compressed = await compressImage(file);
        setSelectedFile(compressed);

        const reader = new FileReader();
        reader.onload = () => setAvatarPreview(reader.result as string);
        reader.readAsDataURL(compressed);

        toast.success(
          `Image compressed from ${(file.size / 1024 / 1024).toFixed(1)}MB to ${(compressed.size / 1024 / 1024).toFixed(1)}MB`,
        );
      } else {
        setSelectedFile(file);
        const reader = new FileReader();
        reader.onload = () => setAvatarPreview(reader.result as string);
        reader.readAsDataURL(file);
      }
    } catch (error) {
      setImageError("Failed to compress image. Please try another image.");
      toast.error("Image compression failed");
    } finally {
      setIsCompressing(false);
    }
  }

  async function onSubmit(data: StaffFormData) {
    // Check for errors in current tab
    const personalFields = [
      "name",
      "dateOfBirth",
      "nationalId",
      "address",
      "emergencyContact",
    ];
    const workFields = [
      "phone1",
      "phone2",
      "officialEmail",
      "status",
      "placementId",
    ];
    const driverFields = ["licenseNumber", "licenseExpiry", "licenseClass"];

    const hasPersonalError = personalFields.some(
      (field) => errors[field as keyof typeof errors],
    );
    const hasWorkError = workFields.some(
      (field) => errors[field as keyof typeof errors],
    );
    const hasDriverError = driverFields.some(
      (field) => errors[field as keyof typeof errors],
    );

    if (hasPersonalError) {
      setActiveTab("personal");
      toast.error("Please fix the errors in the Personal tab");
      return;
    }
    if (hasWorkError) {
      setActiveTab("work");
      toast.error("Please fix the errors in the Work & Contact tab");
      return;
    }
    if (hasDriverError && selectedRole === "DRIVER") {
      setActiveTab("driver");
      toast.error("Please fix the errors in the Driver Details tab");
      return;
    }

    setIsSaving(true);
    try {
      const fd = new FormData();

      Object.entries(data).forEach(([k, v]) => {
        if (v !== null && v !== undefined && v !== "") {
          fd.append(k, String(v));
        }
      });

      fd.append("role", selectedRole);
      fd.append("_updated", "1");

      if (selectedFile) fd.append("avatar", selectedFile);

      await onSave(fd, editing?.id);
      handleClose();
    } catch (error) {
      toast.error("Failed to save staff member");
    } finally {
      setIsSaving(false);
    }
  }

  function handleClose() {
    if (isSaving) return;
    reset(defaultValues);
    setSelectedRole("DRIVER");
    setSelectedFile(null);
    setAvatarPreview("");
    setImageError("");
    onClose();
  }

  // Real-time tab error indicators
  const tabErrors = useMemo(() => {
    const personalFields = [
      "name",
      "dateOfBirth",
      "nationalId",
      "address",
      "emergencyContact",
    ];
    const workFields = [
      "phone1",
      "phone2",
      "officialEmail",
      "status",
      "placementId",
    ];
    const driverFields = ["licenseNumber", "licenseExpiry", "licenseClass"];

    return {
      personal: personalFields.some((f) => errors[f as keyof typeof errors]),
      work: workFields.some((f) => errors[f as keyof typeof errors]),
      driver: driverFields.some((f) => errors[f as keyof typeof errors]),
    };
  }, [errors]);

  // Determine if driver fields should be shown
  const showDriverFields = selectedRole === "DRIVER";

  return (
    <Sheet open={open} onOpenChange={(o) => !o && handleClose()}>
      <SheetContent className="w-[600px] sm:max-w-[600px] overflow-y-auto !p-0">
        <div className="sticky top-0 bg-white z-10 px-6 py-4 border-b flex items-center justify-between">
          <div>
            <SheetTitle className="text-lg font-bold text-slate-900">
              {editing ? "Edit Staff Member" : "Add New Staff Member"}
            </SheetTitle>
            <SheetDescription className="mt-1 text-sm text-slate-500">
              {editing
                ? `Editing ${editing.name}`
                : "Fill in the details to add a new team member."}
            </SheetDescription>
          </div>
          <SheetClose
            onClick={handleClose}
            className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100">
            <X className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </SheetClose>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="p-6">
          <TabsList className="grid grid-cols-3 w-full mb-6">
            <TabsTrigger value="personal" className="relative">
              Personal
              {tabErrors.personal && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500 animate-in fade-in" />
              )}
            </TabsTrigger>
            <TabsTrigger value="work" className="relative">
              Work & Contact
              {tabErrors.work && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500 animate-in fade-in" />
              )}
            </TabsTrigger>
            <TabsTrigger value="driver" className="relative">
              Driver Details
              {tabErrors.driver && showDriverFields && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500 animate-in fade-in" />
              )}
            </TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <TabsContent value="personal" className="space-y-6">
              {/* Photo Section */}
              <div className="flex items-center gap-4 pb-2">
                <div className="relative flex-shrink-0">
                  <Avatar
                    className="w-20 h-20 ring-2 ring-offset-2"
                    style={{ ringColor: "#e2e8f0" }}>
                    <AvatarImage src={avatarPreview} className="object-cover" />
                    <AvatarFallback
                      className="text-lg font-bold text-white"
                      style={{ background: avatarColor(editing?.id ?? 0) }}>
                      {editing ? getInitials(editing.name) : "?"}
                    </AvatarFallback>
                  </Avatar>
                  <label
                    htmlFor="staff-avatar-upload"
                    className={`absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center cursor-pointer transition-opacity hover:opacity-80 text-white ${
                      isCompressing ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                    style={{ background: SKY_BLUE }}>
                    {isCompressing ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Camera size={12} />
                    )}
                  </label>
                  <input
                    id="staff-avatar-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoChange}
                    disabled={isCompressing}
                  />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Profile Photo
                  </p>
                  <p className="text-xs mt-0.5 text-slate-500">
                    Max 4MB. Images larger than 4MB will be compressed.
                  </p>
                  {imageError && (
                    <p className="text-[10px] text-red-500 mt-1 flex items-center gap-1">
                      <AlertCircle size={10} />
                      {imageError}
                    </p>
                  )}
                </div>
              </div>

              <FI
                name="name"
                label="Full Name"
                required
                placeholder="e.g. Andrew Musoke"
                control={control}
                errors={errors}
              />

              <div className="grid grid-cols-2 gap-4">
                <FI
                  name="dateOfBirth"
                  label="Date of Birth"
                  type="date"
                  control={control}
                  errors={errors}
                />
                <FI
                  name="nationalId"
                  label="National ID"
                  placeholder="ID Number"
                  control={control}
                  errors={errors}
                />
              </div>

              <FI
                name="address"
                label="Home Address"
                placeholder="Street, City, Country"
                control={control}
                errors={errors}
              />
              <FI
                name="emergencyContact"
                label="Emergency Contact"
                placeholder="Name & Phone"
                control={control}
                errors={errors}
              />
            </TabsContent>

            <TabsContent value="work" className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <FI
                  name="phone1"
                  label="Phone 1"
                  required
                  placeholder="+256..."
                  control={control}
                  errors={errors}
                />
                <FI
                  name="phone2"
                  label="Phone 2"
                  placeholder="+256..."
                  control={control}
                  errors={errors}
                />
              </div>

              <FI
                name="officialEmail"
                label="Official Email"
                type="email"
                placeholder="name@bluepearls.co.ug"
                control={control}
                errors={errors}
              />

              <div className="grid grid-cols-2 gap-4">
                <SelectField
                  name="status"
                  label="Status"
                  options={ALL_STATUSES}
                  control={control}
                  errors={errors}
                />
              </div>

              {/* Role Selection */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-700">
                  Role <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={selectedRole}
                  onValueChange={(val) => setSelectedRole(val as Role)}>
                  <SelectTrigger className="h-10 rounded-xl text-sm">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ROLE_LABELS).map(([role, label]) => (
                      <SelectItem key={role} value={role}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Placement field - Only visible for IMPLANT role */}
              {selectedRole === "IMPLANT" && (
                <div className="space-y-1.5 p-4 rounded-xl bg-blue-50/50 border border-blue-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 size={16} className="text-blue-600" />
                    <Label className="text-xs font-medium text-blue-700">
                      Client Placement (Required for Implants)
                    </Label>
                  </div>
                  <Controller
                    name="placementId"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value?.toString() ?? "none"}
                        onValueChange={(val) =>
                          field.onChange(val === "none" ? null : parseInt(val))
                        }>
                        <SelectTrigger
                          className={`h-10 rounded-xl text-sm bg-white ${
                            errors.placementId
                              ? "border-red-500 focus-visible:ring-red-500"
                              : ""
                          }`}>
                          <SelectValue placeholder="Select client placement" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No Placement</SelectItem>
                          {clients.map((client) => (
                            <SelectItem
                              key={client.id}
                              value={client.id.toString()}>
                              {client.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.placementId && (
                    <p className="text-[10px] text-red-500 mt-0.5 flex items-center gap-1">
                      <AlertCircle size={10} />
                      {errors.placementId.message}
                    </p>
                  )}
                  <p className="text-xs text-blue-600/70 mt-1">
                    Assign this implant staff to a specific client
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="driver" className="space-y-6">
              {showDriverFields ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <FI
                      name="licenseNumber"
                      label="License Number"
                      placeholder="e.g. DL1234567"
                      control={control}
                      errors={errors}
                    />
                    <SelectField
                      name="licenseClass"
                      label="License Class"
                      options={LICENSE_CLASSES}
                      control={control}
                      errors={errors}
                    />
                  </div>
                  <FI
                    name="licenseExpiry"
                    label="License Expiry"
                    type="date"
                    control={control}
                    errors={errors}
                  />

                  <div className="p-4 rounded-xl bg-slate-50 border">
                    <p className="text-xs text-slate-600">
                      <strong>Note:</strong> Driver details are required for all
                      drivers.
                    </p>
                  </div>
                </>
              ) : (
                <div className="p-8 text-center text-slate-500">
                  <Truck size={32} className="mx-auto mb-3 text-slate-300" />
                  <p>
                    Driver details are only shown for staff with Driver role.
                  </p>
                </div>
              )}
            </TabsContent>

            <div className="sticky bottom-0 bg-white pt-6 mt-6 border-t flex gap-3">
              <Button
                type="button"
                variant="outline"
                disabled={isSaving || isCompressing}
                onClick={handleClose}
                className="flex-1 rounded-xl h-11">
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSaving || isCompressing || !isValid}
                className="flex-1 rounded-xl h-11 text-white font-semibold disabled:opacity-50"
                style={{ background: SKY_BLUE }}
                onMouseOver={(e) =>
                  (e.currentTarget.style.background = "#0591c0")
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.background = SKY_BLUE)
                }>
                {isSaving || isCompressing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : editing ? (
                  "Save Changes"
                ) : (
                  "Add Staff Member"
                )}
              </Button>
            </div>

            {/* Real-time error summary */}
            {(tabErrors.personal ||
              tabErrors.work ||
              (tabErrors.driver && showDriverFields)) && (
              <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 animate-in fade-in slide-in-from-bottom-2">
                <p className="text-xs font-medium text-red-800 flex items-center gap-1.5">
                  <AlertCircle size={12} />
                  Please fix the following errors:
                </p>
                <ul className="mt-2 text-xs text-red-700 list-disc list-inside space-y-1">
                  {tabErrors.personal && (
                    <li className="animate-in fade-in slide-in-from-left-1">
                      Personal tab has errors
                    </li>
                  )}
                  {tabErrors.work && (
                    <li className="animate-in fade-in slide-in-from-left-1">
                      Work & Contact tab has errors
                    </li>
                  )}
                  {tabErrors.driver && showDriverFields && (
                    <li className="animate-in fade-in slide-in-from-left-1">
                      Driver Details tab has errors
                    </li>
                  )}
                </ul>
              </div>
            )}
          </form>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

// ── Delete Dialog ──────────────────────────────────────────────────────────

interface DeleteDialogProps {
  open: boolean;
  onClose: () => void;
  staff: StaffMember | null;
  onConfirm: () => Promise<void>;
}

function DeleteDialog({ open, onClose, staff, onConfirm }: DeleteDialogProps) {
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
            Remove Staff Member
          </DialogTitle>
          <DialogDescription className="text-slate-500">
            Are you sure you want to remove{" "}
            <strong className="text-slate-900">{staff?.name}</strong>? This
            action cannot be undone.
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
              "Remove"
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

// ── Main Page ──────────────────────────────────────────────────────────────

export default function Staff() {
  const navigate = useNavigate();
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [clients, setClients] = useState<Array<{ id: number; name: string }>>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<
    StaffMember["status"] | "ALL"
  >("ALL");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<StaffMember | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StaffMember | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [staffRes, clientsRes] = await Promise.all([
        fetch(`${API_URL}/staff`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("bp_token")}`,
          },
        }),
        fetch(`${API_URL}/clients`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("bp_token")}`,
          },
        }),
      ]);

      if (staffRes.ok) {
        const data = await staffRes.json();
        const normalizedData = data.map((member: any) => ({
          ...member,
          status: normalizeStatus(member.status),
        }));
        setStaffList(normalizedData);
      }

      if (clientsRes.ok) {
        const data = await clientsRes.json();
        setClients(data);
      }
    } catch (error) {
      toast.error("Failed to fetch data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return staffList.filter((s) => {
      const matchesSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.officialEmail?.toLowerCase().includes(q) ||
        s.phone1.includes(q);

      const matchesStatus = statusFilter === "ALL" || s.status === statusFilter;
      const matchesRole = roleFilter === "ALL" || s.role === roleFilter;

      return matchesSearch && matchesStatus && matchesRole;
    });
  }, [staffList, search, statusFilter, roleFilter]);

  async function handleSave(formData: FormData, id?: number) {
    const method = id ? "PATCH" : "POST";
    const url = id ? `${API_URL}/staff/${id}` : `${API_URL}/staff`;

    const res = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${localStorage.getItem("bp_token")}`,
      },
      body: formData,
    });

    if (res.ok) {
      toast.success(id ? "Staff updated" : "Staff added");
      fetchData();
    } else {
      const err = await res.json();
      throw new Error(err.error || "Operation failed");
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
        fetchData();
      }
    } catch {
      toast.error("Network error");
    }
  }

  const stats = useMemo(
    () => ({
      total: staffList.length,
      active: staffList.filter((s) => s.status === "Active").length,
      drivers: staffList.filter((s) => s.role === "DRIVER").length,
      fuel: staffList.filter(
        (s) => s.role === "FUEL_AGENT" || s.role === "FUEL_MANAGER",
      ).length,
      management: staffList.filter((s) =>
        ROLE_CATEGORIES.MANAGEMENT.includes(s.role),
      ).length,
      finance: staffList.filter((s) => ROLE_CATEGORIES.FINANCE.includes(s.role))
        .length,
    }),
    [staffList],
  );

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
            Staff Directory
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
          <Plus size={15} /> Add Staff
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-6 gap-3 mb-5">
        <StatCard
          label="Total Staff"
          value={stats.total}
          icon={Users}
          color={SKY_BLUE}
          bg={`${SKY_BLUE}18`}
        />
        <StatCard
          label="Active"
          value={stats.active}
          icon={UserCheck}
          color="#16a34a"
          bg="#16a34a18"
        />
        <StatCard
          label="Drivers"
          value={stats.drivers}
          icon={Truck}
          color="#b8922a"
          bg="#E1BA5820"
        />
        <StatCard
          label="Fuel Team"
          value={stats.fuel}
          icon={Fuel}
          color={SKY_BLUE}
          bg={`${SKY_BLUE}18`}
        />
        <StatCard
          label="Management"
          value={stats.management}
          icon={Shield}
          color="#1e6ea6"
          bg="#1e6ea618"
        />
        <StatCard
          label="Finance"
          value={stats.finance}
          icon={CreditCard}
          color="#16a34a"
          bg="#16a34a18"
        />
      </div>

      {/* Filters */}
      <div className="rounded-2xl p-4 mb-4 flex items-center gap-3 bg-white border border-slate-200">
        <div className="relative flex-1 max-w-sm">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, phone..."
            className="pl-9 h-9 rounded-xl text-sm border-0 bg-[#F5F4EF]"
          />
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <Filter size={13} className="text-slate-500" />

          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="h-9 rounded-xl text-xs w-32 border-0 bg-[#F5F4EF]">
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Roles</SelectItem>
              {Object.entries(ROLE_LABELS).map(([role, label]) => (
                <SelectItem key={role} value={role}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as any)}>
            <SelectTrigger className="h-9 rounded-xl text-xs w-32 border-0 bg-[#F5F4EF]">
              <SelectValue placeholder="Status" />
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

      {/* Table */}
      <div className="rounded-2xl overflow-hidden min-h-[400px] bg-white border border-slate-200">
        <div
          className="grid px-5 py-3 bg-[#FAFAF8] border-b border-slate-200 text-[10px] font-semibold uppercase tracking-widest text-slate-500"
          style={{ gridTemplateColumns: "2fr 1.8fr 1fr 1fr 52px" }}>
          <span>Staff Member</span>
          <span>Contact</span>
          <span>Role</span>
          <span>Status</span>
          <span />
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-3">
            <Loader2
              className="w-8 h-8 animate-spin"
              style={{ color: SKY_BLUE }}
            />
            <p className="text-sm font-medium text-slate-500">
              Loading directory…
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
            <Users size={28} className="text-slate-300 mb-4" />
            <h3 className="text-base font-bold mb-1 text-slate-900">
              No Staff Found
            </h3>
            <p className="text-sm max-w-[280px] mb-6 text-slate-500">
              Try adjusting your filters or add a new team member.
            </p>
            <Button
              onClick={() => setSheetOpen(true)}
              variant="outline"
              className="rounded-xl h-9 px-5"
              style={{ borderColor: SKY_BLUE, color: SKY_BLUE }}>
              <Plus size={14} className="mr-2" /> Add Staff Member
            </Button>
          </div>
        ) : (
          filtered.map((s, i) => {
            const statusStyle = STATUS_STYLES[s.status];
            const roleStyle = ROLE_STYLES[s.role] || {
              color: "#6b7280",
              bg: "#6b728018",
              icon: Users,
            };
            const RoleIcon = roleStyle.icon;

            return (
              <div
                key={s.id}
                onClick={() => navigate(`/staff/${s.id}`)}
                className="grid items-center px-5 py-3.5 cursor-pointer transition-colors hover:bg-[#F5F4EF]"
                style={{
                  gridTemplateColumns: "2fr 1.8fr 1fr 1fr 52px",
                  borderBottom:
                    i < filtered.length - 1 ? "1px solid #e2e8f0" : "none",
                }}>
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarImage src={s.avatarUrl || ""} />
                    <AvatarFallback
                      className="text-xs font-bold text-white"
                      style={{ background: avatarColor(s.id) }}>
                      {getInitials(s.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate text-slate-900">
                      {s.name}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      ID: #{String(s.id).padStart(4, "0")}
                    </p>
                  </div>
                </div>

                <div className="min-w-0">
                  <p className="text-xs truncate text-slate-900">
                    {s.officialEmail || "—"}
                  </p>
                  <p className="text-[10px] mt-0.5 text-slate-500">
                    {s.phone1}
                  </p>
                </div>

                <div className="flex items-center gap-1.5">
                  <div
                    className="w-5 h-5 rounded flex items-center justify-center"
                    style={{ background: roleStyle.bg }}>
                    <RoleIcon size={10} style={{ color: roleStyle.color }} />
                  </div>
                  <span className="text-xs" style={{ color: roleStyle.color }}>
                    {ROLE_LABELS[s.role]}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: statusStyle.dot }}
                  />
                  <span
                    className="text-xs"
                    style={{ color: statusStyle.color }}>
                    {s.status}
                  </span>
                </div>

                <div onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#F0EFE9] text-slate-500">
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
        clients={clients}
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

// ── Stat Card Component ────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: number;
  icon: any;
  color: string;
  bg: string;
}

function StatCard({ label, value, icon: Icon, color, bg }: StatCardProps) {
  return (
    <div className="rounded-2xl p-4 bg-white border border-slate-200">
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
