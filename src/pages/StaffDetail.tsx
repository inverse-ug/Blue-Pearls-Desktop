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
  Shield,
  Fuel,
  Wrench,
  Truck,
  MapPin,
  FileText,
  Award,
  Clock,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

import {
  type StaffMember,
  type Role,
  ROLE_LABELS,
  ALL_STATUSES,
  LICENSE_CLASSES,
} from "./Staff";

// ── Configuration ─────────────────────────────────────────────────────────────
const API_URL = "https://blue-pearls-server.vercel.app";
const SKY_BLUE = "#06a3d8";
const MAX_IMAGE_SIZE = 4 * 1024 * 1024; // 4MB

// ── Types ─────────────────────────────────────────────────────────────────────
interface Activity {
  id: number;
  type: "job" | "fuel" | "maintenance" | "allowance" | "profile";
  description: string;
  date: string;
  status?: string;
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
  { bg: string; color: string; dot: string }
> = {
  Active: { bg: "#16a34a18", color: "#16a34a", dot: "#16a34a" },
  Inactive: { bg: "#6b728018", color: "#6b7280", dot: "#6b7280" },
  "On Leave": { bg: "#E1BA5820", color: "#b8922a", dot: "#b8922a" },
};

const ROLE_STYLES: Record<Role, { bg: string; color: string; icon: any }> = {
  SUPER_ADMIN: { bg: "#1a3a5c18", color: "#1a3a5c", icon: Shield },
  MANAGER: { bg: `${SKY_BLUE}18`, color: SKY_BLUE, icon: Shield },
  TRUCK_COORDINATOR: { bg: "#16a34a18", color: "#16a34a", icon: Truck },
  PSV_COORDINATOR: { bg: "#16a34a18", color: "#16a34a", icon: Truck },
  DRIVER: { bg: "#E1BA5820", color: "#b8922a", icon: Truck },
  SECURITY_GUARD: { bg: "#ef444418", color: "#ef4444", icon: Shield },
  FUEL_AGENT: { bg: `${SKY_BLUE}18`, color: SKY_BLUE, icon: Fuel },
  FUEL_MANAGER: { bg: `${SKY_BLUE}18`, color: SKY_BLUE, icon: Fuel },
  ALLOWANCE_MANAGER: { bg: "#8b5cf618", color: "#8b5cf6", icon: CreditCard },
  WORKSHOP_MANAGER: { bg: "#f9731618", color: "#f97316", icon: Wrench },
  FINANCE_MANAGER: { bg: "#16a34a18", color: "#16a34a", icon: CreditCard },
  IMPLANT: { bg: "#6b728018", color: "#6b7280", icon: Building2 },
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

function formatDate(d?: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatRelativeTime(date: string) {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins} minutes ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return formatDate(date);
}

// ── Info Row ───────────────────────────────────────────────────────────────

function InfoRow({
  icon: Icon,
  label,
  value,
  badge,
}: {
  icon: React.ElementType;
  label: string;
  value?: string | null;
  badge?: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-200 last:border-0">
      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 bg-[#F5F4EF]">
        <Icon size={13} className="text-slate-500" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-wider mb-0.5 text-slate-500">
          {label}
        </p>
        {badge ? (
          <div className="mt-1">{badge}</div>
        ) : (
          <p
            className={`text-sm font-medium break-words ${value ? "text-slate-900" : "text-slate-400"}`}>
            {value || "—"}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Activity Card ──────────────────────────────────────────────────────────

function ActivityCard({ activity }: { activity: Activity }) {
  const getIcon = () => {
    switch (activity.type) {
      case "job":
        return Truck;
      case "fuel":
        return Fuel;
      case "maintenance":
        return Wrench;
      case "allowance":
        return CreditCard;
      default:
        return Clock;
    }
  };

  const getColor = () => {
    switch (activity.type) {
      case "job":
        return "#b8922a";
      case "fuel":
        return SKY_BLUE;
      case "maintenance":
        return "#f97316";
      case "allowance":
        return "#8b5cf6";
      default:
        return "#6b7280";
    }
  };

  const Icon = getIcon();
  const color = getColor();

  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0">
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: `${color}18` }}>
        <Icon size={14} style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900">
          {activity.description}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[10px] text-slate-500">
            {formatRelativeTime(activity.date)}
          </span>
          {activity.status && (
            <>
              <span className="text-[10px] text-slate-300">•</span>
              <Badge variant="outline" className="text-[8px] h-4 px-1">
                {activity.status}
              </Badge>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Zod Schema ─────────────────────────────────────────────────────────────

const editSchema = z
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

type EditFormData = z.infer<typeof editSchema>;

// ── Edit Sheet ─────────────────────────────────────────────────────────────

interface EditSheetProps {
  open: boolean;
  onClose: () => void;
  staff: StaffMember;
  onSave: (formData: FormData) => Promise<void>;
  clients?: Array<{ id: number; name: string }>;
}

function EditSheet({
  open,
  onClose,
  staff,
  onSave,
  clients = [],
}: EditSheetProps) {
  const [avatarPreview, setAvatarPreview] = useState<string>(
    staff.avatarUrl ?? "",
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [imageError, setImageError] = useState("");
  const [activeTab, setActiveTab] = useState("personal");

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<EditFormData>({
    //@ts-ignore - Zod schema has some conditional logic that RHF's type inference can't handle perfectly
    resolver: zodResolver(editSchema),
    mode: "onChange",
    defaultValues: {
      name: staff.name,
      phone1: staff.phone1,
      phone2: staff.phone2 || "",
      officialEmail: staff.officialEmail || "",
      status: staff.status,
      dateOfBirth: staff.dateOfBirth || "",
      nationalId: staff.nationalId || "",
      address: staff.address || "",
      emergencyContact: staff.emergencyContact || "",
      licenseNumber: staff.licenseNumber || "",
      licenseExpiry: staff.licenseExpiry || "",
      licenseClass: staff.licenseClass || "",
      placementId: staff.placementId || null,
    },
  });

  const showDriverFields = staff.role === "DRIVER";

  useEffect(() => {
    setAvatarPreview(staff.avatarUrl ?? "");
  }, [staff, open]);

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageError("");
    setIsCompressing(true);

    try {
      if (file.size > MAX_IMAGE_SIZE) {
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

  async function onSubmit(data: EditFormData) {
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
    if (hasDriverError && showDriverFields) {
      setActiveTab("driver");
      toast.error("Please fix the errors in the Driver Details tab");
      return;
    }

    setIsSaving(true);
    try {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== "") {
          formData.append(key, String(value));
        }
      });
      formData.append("_updated", "1");
      if (selectedFile) formData.append("avatar", selectedFile);

      await onSave(formData);
      onClose();
    } catch (error) {
      toast.error("Failed to save changes");
    } finally {
      setIsSaving(false);
    }
  }

  // Real-time tab error indicators
  const tabErrors = {
    personal: [
      "name",
      "dateOfBirth",
      "nationalId",
      "address",
      "emergencyContact",
    ].some((f) => errors[f as keyof typeof errors]),
    work: ["phone1", "phone2", "officialEmail", "status", "placementId"].some(
      (f) => errors[f as keyof typeof errors],
    ),
    driver:
      showDriverFields &&
      ["licenseNumber", "licenseExpiry", "licenseClass"].some(
        (f) => errors[f as keyof typeof errors],
      ),
  };

  interface FieldProps {
    name: keyof EditFormData;
    label: string;
    placeholder?: string;
    type?: string;
    required?: boolean;
  }

  const FI = ({
    name,
    label,
    placeholder,
    type = "text",
    required,
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
              onChange={(e) => {
                field.onChange(e);
              }}
              className={`h-10 rounded-xl text-sm transition-colors ${
                error ? "border-red-500 focus-visible:ring-red-500" : ""
              }`}
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
  };

  const SelectField = ({
    name,
    label,
    options,
    required,
  }: FieldProps & { options: string[] }) => {
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
              value={field.value?.toString() ?? ""}
              onValueChange={field.onChange}>
              <SelectTrigger
                className={`h-10 rounded-xl text-sm transition-colors ${
                  error ? "border-red-500 focus-visible:ring-red-500" : ""
                }`}>
                <SelectValue placeholder={`Select ${label}`} />
              </SelectTrigger>
              <SelectContent>
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
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && !isSaving && onClose()}>
      <SheetContent className="w-[600px] sm:max-w-[600px] overflow-y-auto !p-0">
        <div className="sticky top-0 bg-white z-10 px-6 py-4 border-b flex items-center justify-between">
          <div>
            <SheetTitle className="text-lg font-bold text-slate-900">
              Edit Staff Member
            </SheetTitle>
            <SheetDescription className="mt-1 text-sm text-slate-500">
              Editing details for {staff.name}
            </SheetDescription>
          </div>
          <SheetClose className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100">
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
              {tabErrors.driver && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500 animate-in fade-in" />
              )}
            </TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <TabsContent value="personal" className="space-y-6">
              <div className="flex items-center gap-4 pb-2">
                <div className="relative flex-shrink-0">
                  <Avatar className="w-20 h-20 ring-2 ring-offset-2">
                    <AvatarImage src={avatarPreview} className="object-cover" />
                    <AvatarFallback
                      className="text-lg font-bold text-white"
                      style={{ background: avatarColor(staff.id) }}>
                      {getInitials(staff.name)}
                    </AvatarFallback>
                  </Avatar>
                  <label
                    htmlFor="avatar-upload"
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
                    id="avatar-upload"
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

              <FI name="name" label="Full Name" required />

              <div className="grid grid-cols-2 gap-4">
                <FI name="dateOfBirth" label="Date of Birth" type="date" />
                <FI name="nationalId" label="National ID" />
              </div>

              <FI name="address" label="Address" />
              <FI name="emergencyContact" label="Emergency Contact" />
            </TabsContent>

            <TabsContent value="work" className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <FI name="phone1" label="Phone 1" required />
                <FI name="phone2" label="Phone 2" />
              </div>

              <FI name="officialEmail" label="Official Email" type="email" />

              <div className="grid grid-cols-2 gap-4">
                <SelectField
                  name="status"
                  label="Status"
                  options={ALL_STATUSES}
                />
              </div>

              {/* Placement field - Only visible for IMPLANT role */}
              {staff.role === "IMPLANT" && clients.length > 0 && (
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
                </div>
              )}

              {staff.role !== "IMPLANT" && clients.length > 0 && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <p className="text-xs text-slate-600 flex items-center gap-2">
                    <Building2 size={14} className="text-slate-400" />
                    Client placement is only available for staff with the
                    Implant role.
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
                    />
                    <SelectField
                      name="licenseClass"
                      label="License Class"
                      options={LICENSE_CLASSES}
                    />
                  </div>
                  <FI name="licenseExpiry" label="License Expiry" type="date" />

                  <div className="p-4 rounded-xl bg-slate-50 border">
                    <p className="text-xs text-slate-600">
                      <strong>Note:</strong> Driver details are required for all
                      drivers.
                    </p>
                  </div>
                </>
              ) : (
                <div className="p-8 text-center">
                  <Truck size={32} className="mx-auto mb-3 text-slate-300" />
                  <p className="text-sm text-slate-500">
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
                onClick={onClose}
                className="flex-1 rounded-xl h-11">
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSaving || isCompressing}
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
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>

            {/* Real-time error summary */}
            {(tabErrors.personal || tabErrors.work || tabErrors.driver) && (
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
  name: string;
  onConfirm: () => Promise<void>;
}

function DeleteDialog({ open, onClose, name, onConfirm }: DeleteDialogProps) {
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
            <strong className="text-slate-900">{name}</strong>? This action
            cannot be undone.
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

// ── StaffDetail Page ───────────────────────────────────────────────────────

export default function StaffDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [staff, setStaff] = useState<StaffMember | null>(null);
  const [clients, setClients] = useState<Array<{ id: number; name: string }>>(
    [],
  );
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [rightTab, setRightTab] = useState("details");
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const fetchDetail = async () => {
    setIsLoading(true);
    try {
      const [staffRes, clientsRes] = await Promise.all([
        fetch(`${API_URL}/staff/${id}`, {
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
        setStaff(data);

        // Mock activities for now - replace with real API call
        setActivities([]);
      } else {
        toast.error("Staff member not found");
      }

      if (clientsRes.ok) {
        const data = await clientsRes.json();
        setClients(data);
      }
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
        const err = await response.json();
        toast.error(err.error || "Update failed");
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
        const err = await response.json();
        toast.error(err.error || "Failed to remove staff member");
      }
    } catch (err) {
      toast.error("Network error");
    }
  }

  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: SKY_BLUE }} />
        <p className="text-sm font-medium text-slate-500">Loading profile…</p>
      </div>
    );
  }

  if (!staff) return null;

  const roleStyle = ROLE_STYLES[staff.role] || ROLE_STYLES.IMPLANT;
  const statusStyle = STATUS_STYLES[staff.status];
  const RoleIcon = roleStyle.icon;

  return (
    <div className="h-full overflow-auto flex flex-col">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 px-6 pt-5 pb-3 flex-shrink-0">
        <button
          onClick={() => navigate("/staff")}
          className="flex items-center gap-1.5 text-xs font-medium transition-opacity hover:opacity-60 text-slate-500">
          <ArrowLeft size={13} /> Staff Directory
        </button>
        <span className="text-slate-300">›</span>
        <span className="text-xs font-semibold text-slate-900">
          {staff.name}
        </span>
      </div>

      <div className="flex gap-4 px-6 pb-6">
        {/* Left Sidebar */}
        <div className="w-[280px] flex-shrink-0 flex flex-col gap-0 rounded-2xl overflow-hidden bg-white border border-slate-200">
          <div className="relative">
            <div
              className="h-[72px]"
              style={{
                background: `linear-gradient(135deg, #1a3a5c 0%, ${SKY_BLUE} 100%)`,
              }}
            />
            <div
              className="absolute left-1/2 -translate-x-1/2"
              style={{ top: 36 }}>
              <Avatar className="w-16 h-16 ring-[3px] ring-white">
                <AvatarImage
                  src={staff.avatarUrl || ""}
                  className="object-cover"
                />
                <AvatarFallback
                  className="text-base font-bold text-white"
                  style={{ background: avatarColor(staff.id) }}>
                  {getInitials(staff.name)}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>

          <div className="pt-10 pb-4 px-4 text-center border-b border-slate-200">
            <h3 className="text-sm font-bold mb-0.5 text-slate-900">
              {staff.name}
            </h3>
            <p className="text-[11px] mb-3 text-slate-500">
              #{String(staff.id).padStart(4, "0")}
            </p>
            <div className="flex items-center justify-center gap-1.5 flex-wrap mb-4">
              <span
                className="text-[10px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1"
                style={{ background: roleStyle.bg, color: roleStyle.color }}>
                <RoleIcon size={10} />
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
                style={{ background: SKY_BLUE }}
                onMouseOver={(e) =>
                  (e.currentTarget.style.background = "#0591c0")
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.background = SKY_BLUE)
                }>
                <Pencil size={12} /> Edit
              </button>
              <button
                onClick={() => setDeleteOpen(true)}
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors hover:bg-red-50 border border-slate-200 text-red-500">
                <Trash2 size={13} />
              </button>
            </div>
          </div>

          <div className="border-b border-slate-200">
            <div
              className="flex-1 py-2.5 text-xs font-semibold text-center"
              style={{
                color: SKY_BLUE,
                borderBottom: `2px solid ${SKY_BLUE}`,
              }}>
              Staff Info
            </div>
          </div>

          <ScrollArea className="flex-1 max-h-[400px]">
            <div className="px-4 pb-4">
              {staff.officialEmail && (
                <div className="flex items-center gap-2.5 py-3 text-xs border-b border-slate-200">
                  <Mail size={13} className="text-slate-500" />
                  <span className="truncate text-slate-900">
                    {staff.officialEmail}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2.5 py-3 text-xs border-b border-slate-200">
                <Phone size={13} className="text-slate-500" />
                <span className="text-slate-900">{staff.phone1}</span>
              </div>
              {staff.phone2 && (
                <div className="flex items-center gap-2.5 py-3 text-xs border-b border-slate-200">
                  <PhoneCall size={13} className="text-slate-500" />
                  <span className="text-slate-900">{staff.phone2}</span>
                </div>
              )}
              {staff.placementId &&
                clients.find((c) => c.id === staff.placementId) && (
                  <div className="flex items-center gap-2.5 py-3 text-xs">
                    <Building2 size={13} className="text-slate-500" />
                    <span className="text-slate-900">
                      {clients.find((c) => c.id === staff.placementId)?.name}
                    </span>
                  </div>
                )}
            </div>
          </ScrollArea>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="mb-4">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              {staff.name}
            </h2>
            <p className="text-sm mt-0.5 text-slate-500">
              Joined {formatDate(staff.createdAt)}
            </p>
          </div>

          <div className="flex items-center mb-4 gap-1 border-b-2 border-slate-200">
            {[
              { value: "details", label: "Details" },
              { value: "work", label: "Work Info" },
              { value: "driver", label: "Driver Details" },
            ].map((t) => (
              <button
                key={t.value}
                onClick={() => setRightTab(t.value)}
                className="px-4 py-2.5 text-xs font-semibold transition-colors"
                style={{
                  color: rightTab === t.value ? SKY_BLUE : "#64748b",
                  borderBottom:
                    rightTab === t.value
                      ? `2px solid ${SKY_BLUE}`
                      : "2px solid transparent",
                  marginBottom: -2,
                }}>
                {t.label}
              </button>
            ))}
          </div>

          <ScrollArea className="flex-1">
            {rightTab === "details" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl p-4 bg-white border border-slate-200">
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-1 text-slate-500">
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
                <div className="rounded-2xl p-4 bg-white border border-slate-200">
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-1 text-slate-500">
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
                  {staff.placementId && (
                    <InfoRow
                      icon={Building2}
                      label="Placement"
                      value={
                        clients.find((c) => c.id === staff.placementId)?.name
                      }
                    />
                  )}
                </div>
              </div>
            )}

            {rightTab === "work" && (
              <div className="rounded-2xl p-4 bg-white border border-slate-200">
                <p className="text-[10px] font-bold uppercase tracking-widest mb-1 text-slate-500">
                  Work Information
                </p>
                <InfoRow
                  icon={UserCog}
                  label="Role"
                  badge={
                    <div
                      className="flex items-center gap-1 px-2 py-1 rounded-md w-fit"
                      style={{ background: roleStyle.bg }}>
                      <RoleIcon size={12} style={{ color: roleStyle.color }} />
                      <span
                        className="text-xs"
                        style={{ color: roleStyle.color }}>
                        {ROLE_LABELS[staff.role]}
                      </span>
                    </div>
                  }
                />
                <InfoRow
                  icon={Calendar}
                  label="Date Joined"
                  value={formatDate(staff.createdAt)}
                />
                <InfoRow
                  icon={AlertCircle}
                  label="Status"
                  badge={
                    <div
                      className="flex items-center gap-1 px-2 py-1 rounded-md w-fit"
                      style={{ background: statusStyle.bg }}>
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ background: statusStyle.dot }}
                      />
                      <span
                        className="text-xs"
                        style={{ color: statusStyle.color }}>
                        {staff.status}
                      </span>
                    </div>
                  }
                />
              </div>
            )}

            {rightTab === "driver" && (
              <div className="rounded-2xl p-4 bg-white border border-slate-200">
                <p className="text-[10px] font-bold uppercase tracking-widest mb-1 text-slate-500">
                  Driver Details
                </p>
                {staff.role === "DRIVER" ? (
                  <>
                    <InfoRow
                      icon={Award}
                      label="License Number"
                      value={staff.licenseNumber}
                    />
                    <InfoRow
                      icon={FileText}
                      label="License Class"
                      value={staff.licenseClass}
                    />
                    <InfoRow
                      icon={Calendar}
                      label="License Expiry"
                      value={formatDate(staff.licenseExpiry)}
                    />
                  </>
                ) : (
                  <div className="py-8 text-center">
                    <Truck size={32} className="mx-auto mb-3 text-slate-300" />
                    <p className="text-sm text-slate-500">
                      Driver details only available for staff with Driver role.
                    </p>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </div>
      </div>

      {/* Activity Log */}
      <div className="px-6 pb-6">
        <div className="rounded-2xl p-5 bg-white border border-slate-200">
          <p className="text-sm font-bold mb-4 text-slate-900">Activity Log</p>
          {activities.length > 0 ? (
            <div className="space-y-1">
              {activities.map((activity) => (
                <ActivityCard key={activity.id} activity={activity} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-12 h-12 rounded-full bg-[#F5F4EF] flex items-center justify-center mb-3">
                <Inbox size={20} className="text-slate-400" />
              </div>
              <p className="text-xs font-semibold mb-0.5 text-slate-900">
                No Activity Recorded
              </p>
              <p className="text-[11px] text-slate-500">
                Logs will appear here once assignments or changes occur.
              </p>
            </div>
          )}
        </div>
      </div>

      <EditSheet
        open={editOpen}
        onClose={() => setEditOpen(false)}
        staff={staff}
        onSave={handleSave}
        clients={clients}
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
