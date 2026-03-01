import { useState, useMemo, useEffect, useCallback, memo } from "react";
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
  Building,
  Link2,
  Unlink,
  Camera,
  X,
  Fuel,
  Package,
  Wrench,
  Clock,
  CheckCircle2,
  XCircle,
  Star,
  Eye,
  Gauge,
  Hash,
  Zap,
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
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Card, CardContent } from "@/components/ui/card";

// ─── Config ───────────────────────────────────────────────────────────────────
const API_URL = "https://blue-pearls-server.vercel.app";
const SKY = "#06a3d8";
const MAX_IMAGE_SIZE = 4 * 1024 * 1024; // 4MB

// ─── Types ────────────────────────────────────────────────────────────────────
export type Ownership = "Hired" | "Owned";
export type VehicleType =
  | "Truck"
  | "SUV"
  | "Pickup"
  | "Van"
  | "Saloon"
  | "Tractor_Head"
  | "Trailer";
export type FuelType = "Diesel" | "Petrol";
export type TruckCapacity =
  | "0-5MT"
  | "5-10MT"
  | "10-15MT"
  | "15-20MT"
  | "20-25MT"
  | "25-30MT"
  | "30MT+";
export type ImagePosition =
  | "Front"
  | "Rear"
  | "Left_Side"
  | "Right_Side"
  | "Front_Left_Angle"
  | "Front_Right_Angle"
  | "Rear_Left_Angle"
  | "Rear_Right_Angle"
  | "Dashboard"
  | "Interior"
  | "Engine"
  | "Trailer"
  | "Number_Plate"
  | "Other";
export type VehicleStatus = "available" | "on_job" | "maintenance" | "inactive";

export interface VehicleImage {
  id?: number;
  vehicleId?: number;
  imageUrl: string;
  position: ImagePosition;
  displayOrder: number;
  isPrimary: boolean;
  caption?: string;
  preview?: string;
  file?: File;
}

export interface Vehicle {
  id: number;
  numberPlate: string;
  ownership: Ownership;
  vehicleType: VehicleType;
  make: string;
  model: string;
  year?: number | null;
  fuelType?: FuelType | null;
  fuelConsumptionKmPerL?: number | null;
  tankCapacity?: number | null;
  bodyDescription?: string | null;
  seatingCapacity?: number | null;
  color?: string | null;
  vin?: string | null;
  truckCapacity?: TruckCapacity | null;
  numberOfAxles?: number | null;
  hasTrailer: boolean;
  trailerId?: number | null;
  hiredFrom?: string | null;
  contactName?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  purchaseDate?: string | null;
  purchasePrice?: number | null;
  defaultDriverId?: number | null;
  defaultDriverName?: string | null;
  defaultDriverAvatar?: string | null;
  isActive: boolean;
  lastMaintenanceDate?: string | null;
  nextMaintenanceDue?: string | null;
  currentOdometer?: number | null;
  images?: VehicleImage[];
  createdAt: string;
  attachedTrailer?: Vehicle | null;
}

export interface StaffOption {
  id: number;
  name: string;
  department?: string | null;
  avatarUrl?: string | null;
}

export interface Job {
  id: number;
  vehicleId: number;
  status: string;
  scheduledAt: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const VEHICLE_TYPES: VehicleType[] = [
  "Truck",
  "SUV",
  "Pickup",
  "Van",
  "Saloon",
  "Tractor_Head",
  "Trailer",
];

const TRUCK_TYPES: VehicleType[] = ["Truck", "Tractor_Head"];
const TRAILER_TYPE: VehicleType = "Trailer";

const FUEL_TYPES: FuelType[] = ["Diesel", "Petrol"];
const TRUCK_CAPS: TruckCapacity[] = [
  "0-5MT",
  "5-10MT",
  "10-15MT",
  "15-20MT",
  "20-25MT",
  "25-30MT",
  "30MT+",
];
const IMG_POSITIONS: ImagePosition[] = [
  "Front",
  "Rear",
  "Left_Side",
  "Right_Side",
  "Front_Left_Angle",
  "Front_Right_Angle",
  "Rear_Left_Angle",
  "Rear_Right_Angle",
  "Dashboard",
  "Interior",
  "Engine",
  "Trailer",
  "Number_Plate",
  "Other",
];

const TYPE_STYLES: Record<
  VehicleType,
  { color: string; bg: string; icon: any }
> = {
  Truck: { color: "#b8922a", bg: "#E1BA5820", icon: Truck },
  SUV: { color: SKY, bg: `${SKY}18`, icon: Car },
  Pickup: { color: "#16a34a", bg: "#16a34a18", icon: Truck },
  Van: { color: "#8b5cf6", bg: "#8b5cf618", icon: Car },
  Saloon: { color: "#ec4899", bg: "#ec489918", icon: Car },
  Tractor_Head: { color: "#f97316", bg: "#f9731618", icon: Truck },
  Trailer: { color: "#6b7280", bg: "#6b728018", icon: Package },
};

const OWN_STYLES: Record<Ownership, { color: string; bg: string }> = {
  Owned: { color: "#16a34a", bg: "#16a34a18" },
  Hired: { color: "#6b7280", bg: "#6b728018" },
};

const ST_STYLES: Record<
  VehicleStatus,
  { label: string; color: string; bg: string; icon: any }
> = {
  available: {
    label: "Available",
    color: "#16a34a",
    bg: "#16a34a18",
    icon: CheckCircle2,
  },
  on_job: { label: "On Job", color: SKY, bg: `${SKY}18`, icon: Clock },
  maintenance: {
    label: "Maintenance",
    color: "#f97316",
    bg: "#f9731618",
    icon: Wrench,
  },
  inactive: {
    label: "Inactive",
    color: "#ef4444",
    bg: "#ef444418",
    icon: XCircle,
  },
};

const initials = (n: string) =>
  n
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

const fmtDate = (d: string | null | undefined) =>
  d
    ? new Date(d).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

const fmtNum = (n: number | null | undefined, suffix = "") =>
  n != null ? `${n.toLocaleString()}${suffix}` : null;

// ─── Image Compression Helper ─────────────────────────────────────────────────
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

        let quality = 0.9;
        let compressedFile: File | null = null;

        const tryCompress = () => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error("Failed to compress image"));
                return;
              }

              if (blob.size <= MAX_IMAGE_SIZE || quality <= 0.1) {
                compressedFile = new File([blob], file.name, {
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

// ─── Zod schema ───────────────────────────────────────────────────────────────
const imgSchema = z.object({
  id: z.number().optional(),
  imageUrl: z.string().optional(),
  position: z.enum(IMG_POSITIONS as [ImagePosition, ...ImagePosition[]]),
  displayOrder: z.number().default(99),
  isPrimary: z.boolean().default(false),
  caption: z.string().optional(),
  preview: z.string().optional(),
});

const currentYear = new Date().getFullYear();

// Base schema with conditional validation based on vehicle type
const baseVehicleSchema = z.object({
  numberPlate: z
    .string()
    .min(2, "Number plate must be at least 2 characters")
    .max(20, "Number plate is too long")
    .transform((v) => v.toUpperCase()),
  ownership: z.enum(["Hired", "Owned"], {
    required_error: "Please select ownership type",
  }),
  vehicleType: z.enum(VEHICLE_TYPES as [VehicleType, ...VehicleType[]], {
    required_error: "Please select a vehicle type",
  }),
  make: z.string().min(1, "Vehicle make is required"),
  model: z.string().min(1, "Vehicle model is required"),
  year: z.coerce
    .number({ invalid_type_error: "Year must be a number" })
    .min(1900, "Year must be 1900 or later")
    .max(currentYear + 1, `Year cannot be beyond ${currentYear + 1}`)
    .optional()
    .nullable(),
  fuelType: z
    .enum(FUEL_TYPES as [FuelType, ...FuelType[]])
    .optional()
    .nullable(),
  fuelConsumptionKmPerL: z.coerce
    .number({ invalid_type_error: "Enter a valid number" })
    .positive("Fuel consumption must be greater than 0")
    .optional()
    .nullable(),
  tankCapacity: z.coerce
    .number({ invalid_type_error: "Enter a valid number" })
    .positive("Tank capacity must be greater than 0")
    .optional()
    .nullable(),
  bodyDescription: z.string().optional().nullable(),
  seatingCapacity: z.coerce
    .number({ invalid_type_error: "Enter a valid number" })
    .min(1, "Seating capacity must be at least 1")
    .optional()
    .nullable(),
  color: z.string().optional().nullable(),
  vin: z.string().optional().nullable(),
  truckCapacity: z
    .enum(TRUCK_CAPS as [TruckCapacity, ...TruckCapacity[]])
    .optional()
    .nullable(),
  numberOfAxles: z.coerce
    .number({ invalid_type_error: "Enter a valid number" })
    .min(2, "A vehicle must have at least 2 axles")
    .max(5, "Maximum 5 axles supported")
    .optional()
    .nullable(),
  hasTrailer: z.boolean().default(false),
  trailerId: z.coerce.number().nullable().optional(),
  hiredFrom: z.string().optional().nullable(),
  contactName: z.string().optional().nullable(),
  contactPhone: z.string().optional().nullable(),
  contactEmail: z
    .string()
    .email("Enter a valid email address")
    .optional()
    .nullable()
    .or(z.literal("")),
  purchaseDate: z.string().optional().nullable(),
  purchasePrice: z.coerce
    .number({ invalid_type_error: "Enter a valid amount" })
    .positive("Purchase price must be greater than 0")
    .optional()
    .nullable(),
  defaultDriverId: z.coerce.number().nullable().optional(),
  isActive: z.boolean().default(true),
  currentOdometer: z.coerce
    .number({ invalid_type_error: "Enter a valid number" })
    .min(0, "Odometer reading cannot be negative")
    .optional()
    .nullable(),
  lastMaintenanceDate: z.string().optional().nullable(),
  nextMaintenanceDue: z.string().optional().nullable(),
  images: z.array(imgSchema).default([]),
});

// Conditional validation based on vehicle type
const vehicleSchema = baseVehicleSchema
  .refine(
    (d) => {
      // Trailers don't need fuel fields
      if (d.vehicleType === "Trailer") return true;
      // Trucks and other vehicles need fuel type
      return !!d.fuelType;
    },
    {
      message: "Fuel type is required for this vehicle type",
      path: ["fuelType"],
    },
  )
  .refine(
    (d) => {
      // Trailers don't need consumption
      if (d.vehicleType === "Trailer") return true;
      return !!d.fuelConsumptionKmPerL;
    },
    {
      message: "Fuel consumption is required",
      path: ["fuelConsumptionKmPerL"],
    },
  )
  .refine(
    (d) => {
      // Trailers don't need tank capacity
      if (d.vehicleType === "Trailer") return true;
      return !!d.tankCapacity;
    },
    {
      message: "Tank capacity is required",
      path: ["tankCapacity"],
    },
  )
  .refine(
    (d) => {
      // Trailers don't need odometer
      if (d.vehicleType === "Trailer") return true;
      // Other vehicles need odometer
      return d.currentOdometer != null && d.currentOdometer >= 0;
    },
    {
      message: "Current odometer reading is required",
      path: ["currentOdometer"],
    },
  )
  .refine((d) => !(d.ownership === "Hired" && !d.hiredFrom), {
    message: "Please specify who this vehicle is hired from",
    path: ["hiredFrom"],
  })
  .refine(
    (d) => {
      // Only trucks/tractor heads can have trailers
      if (d.hasTrailer && !TRUCK_TYPES.includes(d.vehicleType)) {
        return false;
      }
      return true;
    },
    {
      message: "Only trucks and tractor heads can have trailers",
      path: ["hasTrailer"],
    },
  );

type VehicleFormData = z.infer<typeof baseVehicleSchema>;

// ─── Field helpers ───────────────────────────────────────────────────────────
const VFI = memo(
  ({
    name,
    label,
    placeholder,
    type = "text",
    step,
    required,
    control,
    errors,
    disabled = false,
  }: {
    name: keyof VehicleFormData;
    label: string;
    placeholder?: string;
    type?: string;
    step?: string;
    required?: boolean;
    control: any;
    errors: any;
    disabled?: boolean;
  }) => {
    const err = errors[name];
    return (
      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-slate-700">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </Label>
        <Controller
          name={name}
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              value={field.value?.toString() ?? ""}
              type={type}
              step={step}
              placeholder={placeholder}
              disabled={disabled}
              className={`h-10 rounded-xl text-sm ${err ? "border-red-400 focus-visible:ring-red-300" : ""} ${disabled ? "bg-slate-50 text-slate-500" : ""}`}
            />
          )}
        />
        {err && (
          <p className="text-[11px] text-red-500 flex items-center gap-1">
            <AlertCircle size={10} />
            {err.message as string}
          </p>
        )}
      </div>
    );
  },
);

const VSF = memo(
  ({
    name,
    label,
    options,
    required,
    control,
    errors,
    disabled = false,
  }: {
    name: keyof VehicleFormData;
    label: string;
    options: string[];
    required?: boolean;
    control: any;
    errors: any;
    disabled?: boolean;
  }) => {
    const err = errors[name];
    return (
      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-slate-700">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </Label>
        <Controller
          name={name}
          control={control}
          render={({ field }) => (
            <Select
              value={field.value as string}
              onValueChange={field.onChange}
              disabled={disabled}>
              <SelectTrigger
                className={`h-10 rounded-xl text-sm ${err ? "border-red-400" : ""} ${disabled ? "bg-slate-50" : ""}`}>
                <SelectValue placeholder={`Select ${label}`} />
              </SelectTrigger>
              <SelectContent>
                {options.map((o) => (
                  <SelectItem key={o} value={o}>
                    {o.replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {err && (
          <p className="text-[11px] text-red-500 flex items-center gap-1">
            <AlertCircle size={10} />
            {err.message as string}
          </p>
        )}
      </div>
    );
  },
);

// ─── Image Uploader with Compression ──────────────────────────────────────────
function ImageUploader({
  images,
  onChange,
  onRemove,
  onSetPrimary,
}: {
  images: VehicleImage[];
  onChange: (img: Partial<VehicleImage>) => void;
  onRemove: (originalIdx: number) => void;
  onSetPrimary: (originalIdx: number) => void;
}) {
  const [preview, setPreview] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [position, setPosition] = useState<ImagePosition>("Front");
  const [caption, setCaption] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);

  const usedPositions = images.map((i) => i.position);

  const sorted = images
    .map((img, originalIdx) => ({ img, originalIdx }))
    .sort((a, b) => {
      if (a.img.isPrimary) return -1;
      if (b.img.isPrimary) return 1;
      return a.img.displayOrder - b.img.displayOrder;
    });

  const pickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    setIsCompressing(true);
    setAddError(null);

    try {
      let processedFile = file;

      // Compress if larger than 4MB
      if (file.size > MAX_IMAGE_SIZE) {
        const compressed = await compressImage(file);
        processedFile = compressed;
        toast.success(
          `Image compressed from ${(file.size / 1024 / 1024).toFixed(1)}MB to ${(compressed.size / 1024 / 1024).toFixed(1)}MB`,
        );
      }

      setPendingFile(processedFile);
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result as string);
      reader.readAsDataURL(processedFile);
    } catch (error) {
      setAddError("Failed to process image. Please try another.");
      toast.error("Image processing failed");
    } finally {
      setIsCompressing(false);
    }
  };

  const confirmAdd = () => {
    if (!preview || !pendingFile) return;
    if (usedPositions.includes(position)) {
      setAddError(
        `A "${position.replace(/_/g, " ")}" photo already exists. Choose a different position.`,
      );
      return;
    }
    onChange({
      preview,
      file: pendingFile,
      imageUrl: "",
      position,
      caption,
      isPrimary: images.length === 0,
      displayOrder: images.length,
    });
    setPreview(null);
    setPendingFile(null);
    setCaption("");
    setPosition("Front");
    setAddError(null);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3">
        {sorted.map(({ img, originalIdx }) => (
          <div
            key={originalIdx}
            className="relative group rounded-xl overflow-hidden border-2 aspect-square transition-all"
            style={{ borderColor: img.isPrimary ? SKY : "#e2e8f0" }}>
            <img
              src={img.imageUrl || img.preview}
              alt={img.position}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => onSetPrimary(originalIdx)}
                      className="p-1.5 bg-white/90 rounded-lg hover:bg-blue-50 transition-colors">
                      <Star
                        size={14}
                        fill={img.isPrimary ? SKY : "none"}
                        color={img.isPrimary ? SKY : "#64748b"}
                      />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{img.isPrimary ? "Front image" : "Set as front"}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => onRemove(originalIdx)}
                      className="p-1.5 bg-white/90 rounded-lg hover:bg-red-50 transition-colors">
                      <Trash2 size={14} className="text-red-500" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Remove</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            {img.isPrimary && (
              <div
                className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-full text-white text-[8px] font-bold z-10"
                style={{ background: SKY }}>
                FRONT
              </div>
            )}
            <div className="absolute bottom-1 left-1 right-1">
              <Badge
                variant="secondary"
                className="text-[8px] py-0 px-1 truncate max-w-full">
                {img.position.replace(/_/g, " ")}
              </Badge>
            </div>
          </div>
        ))}

        <label
          className="border-2 border-dashed rounded-xl aspect-square flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors relative"
          style={{ borderColor: "#cbd5e1" }}>
          {isCompressing ? (
            <div className="flex flex-col items-center">
              <Loader2 size={22} className="text-slate-400 animate-spin mb-1" />
              <span className="text-[8px] text-slate-500">Compressing...</span>
            </div>
          ) : (
            <>
              <Camera size={22} className="text-slate-400 mb-1" />
              <span className="text-[10px] text-slate-500">Add Photo</span>
            </>
          )}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={pickFile}
            disabled={isCompressing}
          />
        </label>
      </div>

      {preview && (
        <div className="p-4 rounded-xl bg-slate-50 border">
          <div className="flex gap-4">
            <img
              src={preview}
              alt="preview"
              className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
            />
            <div className="flex-1 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Position</Label>
                  <Select
                    value={position}
                    onValueChange={(v: any) => {
                      setPosition(v);
                      setAddError(null);
                    }}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {IMG_POSITIONS.map((p) => (
                        <SelectItem
                          key={p}
                          value={p}
                          className="text-xs"
                          disabled={usedPositions.includes(p)}>
                          {p.replace(/_/g, " ")}
                          {usedPositions.includes(p) ? " (taken)" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Caption</Label>
                  <Input
                    placeholder="Optional"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
              </div>
              {addError && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle size={11} /> {addError}
                </p>
              )}
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => {
                    setPreview(null);
                    setPendingFile(null);
                    setAddError(null);
                  }}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="h-8 text-xs text-white"
                  style={{ background: SKY }}
                  disabled={usedPositions.includes(position)}
                  onClick={confirmAdd}>
                  Add Image
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {images.length > 0 && (
        <p className="text-[10px] text-slate-400">
          ★ = front image. Click the star on any photo to make it the primary
          display image.
        </p>
      )}
    </div>
  );
}

// ─── Vehicle Detail Sheet ─────────────────────────────────────────────────────
function VehicleDetailSheet({
  open,
  onClose,
  vehicle,
  jobs,
  onEdit,
  onStatusChange,
}: {
  open: boolean;
  onClose: () => void;
  vehicle: Vehicle | null;
  jobs: Job[];
  onEdit: (v: Vehicle) => void;
  onStatusChange: (id: number, isActive: boolean) => Promise<void>;
}) {
  const [heroIdx, setHeroIdx] = useState(0);
  const [togglingStatus, setTogglingStatus] = useState(false);

  useEffect(() => {
    if (open && vehicle?.images?.length) {
      const pi = vehicle.images.findIndex((i) => i.isPrimary);
      setHeroIdx(pi >= 0 ? pi : 0);
    } else {
      setHeroIdx(0);
    }
  }, [open, vehicle]);

  if (!vehicle) return null;
  const imgs = vehicle.images || [];
  const hero = imgs[heroIdx] ?? null;
  const ts = TYPE_STYLES[vehicle.vehicleType];
  const TIcon = ts.icon;

  const isOnJob = jobs.some(
    (j) =>
      j.vehicleId === vehicle.id &&
      (j.status === "Ongoing" || j.status === "Scheduled"),
  );

  const getStatus = (): VehicleStatus => {
    if (!vehicle.isActive) return "inactive";
    if (isOnJob) return "on_job";
    if (
      vehicle.nextMaintenanceDue &&
      new Date(vehicle.nextMaintenanceDue) <= new Date()
    )
      return "maintenance";
    return "available";
  };

  const status = getStatus();
  const ss = ST_STYLES[status];
  const SIcon = ss.icon;

  async function toggleActive() {
    setTogglingStatus(true);
    try {
      await onStatusChange(vehicle.id, !vehicle.isActive);
    } finally {
      setTogglingStatus(false);
    }
  }

  const Pill = ({
    icon: Icon,
    label,
    value,
  }: {
    icon: any;
    label: string;
    value: any;
  }) => {
    if (!value && value !== 0) return null;
    return (
      <div className="flex items-center gap-2.5 py-2.5 border-b last:border-0 border-slate-100">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-slate-100">
          <Icon size={13} className="text-slate-500" />
        </div>
        <div>
          <p className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">
            {label}
          </p>
          <p className="text-sm text-slate-800 font-medium">{value}</p>
        </div>
      </div>
    );
  };

  const DRow = ({
    label,
    value,
    mono,
    warn,
  }: {
    label: string;
    value?: any;
    mono?: boolean;
    warn?: boolean;
  }) => {
    if (!value && value !== 0) return null;
    return (
      <div className="flex items-center justify-between py-2.5 border-b last:border-0 border-slate-100">
        <span className="text-xs text-slate-500">{label}</span>
        <span
          className={`text-xs font-medium ${mono ? "font-mono" : ""} ${warn ? "text-orange-500" : "text-slate-800"}`}>
          {value}
        </span>
      </div>
    );
  };

  const Section = ({
    title,
    children,
  }: {
    title: string;
    children: React.ReactNode;
  }) => (
    <div className="mb-5">
      <p className="text-[9px] uppercase tracking-[0.14em] font-bold text-slate-400 mb-2">
        {title}
      </p>
      <div className="rounded-xl px-4 py-1 bg-slate-50 border border-slate-200">
        {children}
      </div>
    </div>
  );

  const isTrailer = vehicle.vehicleType === "Trailer";

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        className="!w-[920px] !max-w-[920px] !p-0 overflow-hidden flex flex-col bg-white"
        style={{ borderLeft: "1px solid #e2e8f0" }}>
        <div className="flex-shrink-0 px-8 pt-6 pb-5 flex items-center justify-between gap-4 border-b border-slate-200">
          <div className="flex items-center gap-4 min-w-0">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: ts.bg }}>
              <TIcon size={20} style={{ color: ts.color }} />
            </div>
            <div className="min-w-0">
              <SheetTitle className="text-[22px] font-black tracking-tight text-slate-900 leading-none">
                {vehicle.numberPlate}
              </SheetTitle>
              <p className="text-sm text-slate-500 mt-0.5 truncate">
                {isTrailer
                  ? `${vehicle.make} ${vehicle.model} Trailer`
                  : [vehicle.year, vehicle.make, vehicle.model, vehicle.color]
                      .filter(Boolean)
                      .join(" · ")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => {
                      if (!isOnJob) toggleActive();
                    }}
                    disabled={togglingStatus || isOnJob}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-opacity hover:opacity-75 disabled:opacity-50 disabled:cursor-default"
                    style={{ background: ss.bg, color: ss.color }}>
                    {togglingStatus ? (
                      <Loader2 size={11} className="animate-spin" />
                    ) : (
                      <SIcon size={11} />
                    )}
                    {ss.label}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  {isOnJob
                    ? "On an active job — cannot change"
                    : vehicle.isActive
                      ? "Click to deactivate"
                      : "Click to activate"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <Button
              size="sm"
              onClick={() => {
                onClose();
                onEdit(vehicle);
              }}
              className="h-8 px-3 text-xs font-semibold text-white rounded-xl"
              style={{ background: SKY }}>
              <Pencil size={11} className="mr-1" /> Edit
            </Button>
          </div>
        </div>
        <SheetDescription className="sr-only">
          Vehicle detail view for {vehicle.numberPlate}
        </SheetDescription>

        <div className="flex flex-1 overflow-hidden">
          <div
            className="w-[340px] flex-shrink-0 flex flex-col overflow-y-auto bg-white"
            style={{ borderRight: "1px solid #e2e8f0" }}>
            <div
              className="relative bg-slate-100 flex-shrink-0"
              style={{ height: 220 }}>
              {hero ? (
                <img
                  src={hero.imageUrl || hero.preview}
                  alt={hero.position}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center">
                  <TIcon size={44} style={{ color: ts.color, opacity: 0.2 }} />
                  <p className="text-xs text-slate-400 mt-2">
                    No images uploaded
                  </p>
                </div>
              )}
              <div
                className="absolute bottom-0 left-0 right-0 h-16"
                style={{
                  background:
                    "linear-gradient(to top, rgba(255,255,255,0.9) 0%, transparent 100%)",
                }}
              />
              {hero && (
                <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between">
                  <span className="text-[9px] text-slate-500 font-semibold uppercase tracking-widest">
                    {hero.position.replace(/_/g, " ")}
                  </span>
                  {hero.isPrimary && (
                    <span
                      className="text-[9px] font-bold px-2 py-0.5 rounded-full text-white"
                      style={{ background: SKY }}>
                      FRONT
                    </span>
                  )}
                </div>
              )}
            </div>

            {imgs.length > 1 && (
              <div className="px-3 py-3 flex-shrink-0 border-b border-slate-200">
                <p className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold mb-2">
                  {imgs.length} photos
                </p>
                <div className="flex gap-1.5 flex-wrap">
                  {imgs.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setHeroIdx(idx)}
                      className="relative rounded-lg overflow-hidden flex-shrink-0 transition-all"
                      style={{
                        width: 52,
                        height: 52,
                        outline:
                          idx === heroIdx
                            ? `2px solid ${SKY}`
                            : "2px solid transparent",
                        outlineOffset: 1,
                      }}>
                      <img
                        src={img.imageUrl || img.preview}
                        alt={img.position}
                        className="w-full h-full object-cover"
                        style={{ opacity: idx === heroIdx ? 1 : 0.55 }}
                      />
                      {img.isPrimary && (
                        <div className="absolute top-0.5 right-0.5">
                          <Star size={8} fill={SKY} color={SKY} />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="px-4 py-3 flex-1">
              <p className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold mb-1">
                Specs
              </p>
              {!isTrailer && (
                <>
                  <Pill
                    icon={Fuel}
                    label="Fuel Type"
                    value={vehicle.fuelType}
                  />
                  <Pill
                    icon={Zap}
                    label="Consumption"
                    value={fmtNum(vehicle.fuelConsumptionKmPerL, " km/L")}
                  />
                  <Pill
                    icon={Package}
                    label="Tank"
                    value={fmtNum(vehicle.tankCapacity, " L")}
                  />
                  <Pill
                    icon={Gauge}
                    label="Odometer"
                    value={fmtNum(vehicle.currentOdometer, " km")}
                  />
                </>
              )}
              {TRUCK_TYPES.includes(vehicle.vehicleType) && (
                <>
                  <Pill
                    icon={Truck}
                    label="Capacity"
                    value={vehicle.truckCapacity}
                  />
                  <Pill
                    icon={Hash}
                    label="Axles"
                    value={vehicle.numberOfAxles}
                  />
                </>
              )}
              {vehicle.seatingCapacity && !isTrailer && (
                <Pill
                  icon={CheckCircle2}
                  label="Seating"
                  value={`${vehicle.seatingCapacity} seats`}
                />
              )}

              {/* Show attached trailer if exists */}
              {vehicle.hasTrailer && vehicle.attachedTrailer && (
                <Pill
                  icon={Link2}
                  label="Attached Trailer"
                  value={vehicle.attachedTrailer.numberPlate}
                />
              )}
            </div>
          </div>

          <div className="flex-1 flex flex-col overflow-hidden bg-white">
            <Tabs defaultValue="overview" className="flex flex-col h-full">
              <TabsList className="flex-shrink-0 mx-6 mt-5 grid grid-cols-3 h-9 rounded-xl bg-slate-100">
                {(["overview", "ownership", "maintenance"] as const).map(
                  (t) => (
                    <TabsTrigger
                      key={t}
                      value={t}
                      className="text-xs capitalize data-[state=active]:text-slate-900 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg text-slate-500">
                      {t}
                    </TabsTrigger>
                  ),
                )}
              </TabsList>

              <TabsContent
                value="overview"
                className="flex-1 overflow-y-auto px-6 pt-5 pb-8 mt-0">
                <Section title="Identity">
                  <DRow label="Number Plate" value={vehicle.numberPlate} mono />
                  <DRow
                    label="Type"
                    value={vehicle.vehicleType.replace(/_/g, " ")}
                  />
                  <DRow label="Make" value={vehicle.make} />
                  <DRow label="Model" value={vehicle.model} />
                  <DRow label="Year" value={vehicle.year} />
                  <DRow label="Color" value={vehicle.color} />
                  <DRow label="VIN" value={vehicle.vin} mono />
                </Section>

                {vehicle.bodyDescription && (
                  <Section title="Body Description">
                    <p className="py-3 text-sm text-slate-700 leading-relaxed">
                      {vehicle.bodyDescription}
                    </p>
                  </Section>
                )}

                {vehicle.attachedTrailer && (
                  <Section title="Attached Trailer">
                    <div className="py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-200 flex items-center justify-center">
                          <Package size={18} className="text-slate-600" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {vehicle.attachedTrailer.numberPlate}
                          </p>
                          <p className="text-xs text-slate-500">
                            {vehicle.attachedTrailer.make}{" "}
                            {vehicle.attachedTrailer.model} •{" "}
                            {vehicle.attachedTrailer.year || "—"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Section>
                )}

                {vehicle.defaultDriverName && !isTrailer && (
                  <Section title="Default Driver">
                    <div className="flex items-center gap-3 py-3">
                      <Avatar className="w-9 h-9">
                        <AvatarImage src={vehicle.defaultDriverAvatar || ""} />
                        <AvatarFallback
                          className="text-xs text-white"
                          style={{ background: "#1a4a6b" }}>
                          {initials(vehicle.defaultDriverName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {vehicle.defaultDriverName}
                        </p>
                        <p className="text-xs text-slate-500">Default Driver</p>
                      </div>
                    </div>
                  </Section>
                )}
              </TabsContent>

              <TabsContent
                value="ownership"
                className="flex-1 overflow-y-auto px-6 pt-5 pb-8 mt-0">
                <div className="mb-5">
                  <span
                    className="inline-flex items-center px-3 py-1 rounded-xl text-xs font-bold"
                    style={{
                      background: OWN_STYLES[vehicle.ownership].bg,
                      color: OWN_STYLES[vehicle.ownership].color,
                    }}>
                    {vehicle.ownership}
                  </span>
                </div>
                {vehicle.ownership === "Hired" ? (
                  <Section title="Hiring Details">
                    <DRow label="Hired From" value={vehicle.hiredFrom} />
                    <DRow label="Contact Person" value={vehicle.contactName} />
                    <DRow label="Phone" value={vehicle.contactPhone} />
                    <DRow label="Email" value={vehicle.contactEmail} />
                  </Section>
                ) : (
                  <Section title="Purchase Details">
                    <DRow
                      label="Purchase Date"
                      value={fmtDate(vehicle.purchaseDate)}
                    />
                    <DRow
                      label="Purchase Price"
                      value={
                        vehicle.purchasePrice
                          ? `UGX ${vehicle.purchasePrice.toLocaleString()}`
                          : null
                      }
                    />
                  </Section>
                )}
              </TabsContent>

              <TabsContent
                value="maintenance"
                className="flex-1 overflow-y-auto px-6 pt-5 pb-8 mt-0">
                <Section title="Schedule">
                  {!isTrailer && (
                    <>
                      <DRow
                        label="Last Service"
                        value={fmtDate(vehicle.lastMaintenanceDate)}
                      />
                      <DRow
                        label="Next Due"
                        value={fmtDate(vehicle.nextMaintenanceDue)}
                        warn={
                          !!(
                            vehicle.nextMaintenanceDue &&
                            new Date(vehicle.nextMaintenanceDue) <= new Date()
                          )
                        }
                      />
                      <DRow
                        label="Current Odometer"
                        value={fmtNum(vehicle.currentOdometer, " km")}
                      />
                    </>
                  )}
                </Section>
                <Section title="Operational Status">
                  <div className="py-3 flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: ss.bg }}>
                      <SIcon size={16} style={{ color: ss.color }} />
                    </div>
                    <div>
                      <p
                        className="text-sm font-bold"
                        style={{ color: ss.color }}>
                        {ss.label}
                      </p>
                      <p className="text-xs text-slate-500">
                        {status === "on_job"
                          ? "Assigned to an active job"
                          : status === "maintenance"
                            ? "Scheduled maintenance overdue"
                            : status === "inactive"
                              ? "Vehicle decommissioned"
                              : "Ready for dispatch"}
                      </p>
                    </div>
                  </div>
                </Section>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Inline Status Changer ────────────────────────────────────────────────────
function InlineStatus({
  vehicle,
  status,
  onStatusChange,
}: {
  vehicle: Vehicle;
  status: VehicleStatus;
  onStatusChange: (id: number, active: boolean) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const ss = ST_STYLES[status];
  const SIcon = ss.icon;
  const isComputed = status === "on_job" || status === "maintenance";

  async function set(active: boolean) {
    setBusy(true);
    try {
      await onStatusChange(vehicle.id, active);
    } finally {
      setBusy(false);
    }
  }

  if (isComputed) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1 cursor-default">
              <SIcon size={12} style={{ color: ss.color }} />
              <span className="text-xs" style={{ color: ss.color }}>
                {ss.label}
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent className="text-xs">
            {status === "on_job"
              ? "Assigned to active job"
              : "Maintenance overdue"}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-1 -ml-1.5 px-1.5 py-1 rounded-lg hover:bg-slate-100 transition-colors group"
          onClick={(e) => e.stopPropagation()}>
          {busy ? (
            <Loader2 size={11} className="animate-spin text-slate-400" />
          ) : (
            <SIcon size={11} style={{ color: ss.color }} />
          )}
          <span className="text-xs" style={{ color: ss.color }}>
            {ss.label}
          </span>
          <ChevronDown
            size={9}
            className="text-slate-400 group-hover:text-slate-600 ml-0.5"
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-38 rounded-xl text-xs"
        onClick={(e) => e.stopPropagation()}>
        <DropdownMenuItem
          disabled={vehicle.isActive || busy}
          onClick={() => set(true)}
          className="cursor-pointer gap-2"
          style={{ color: "#16a34a" }}>
          <CheckCircle2 size={12} /> Set Active
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={!vehicle.isActive || busy}
          onClick={() => set(false)}
          className="cursor-pointer gap-2"
          style={{ color: "#ef4444" }}>
          <XCircle size={12} /> Set Inactive
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─── Vehicle Sheet (Add / Edit) ───────────────────────────────────────────────
function VehicleSheet({
  open,
  onClose,
  editing,
  onSave,
  drivers,
  trailers,
}: {
  open: boolean;
  onClose: () => void;
  editing: Vehicle | null;
  onSave: (fd: FormData, id?: number) => Promise<void>;
  drivers: StaffOption[];
  trailers: Vehicle[];
}) {
  const [isSaving, setIsSaving] = useState(false);
  const [linkedDriver, setLinkedDriver] = useState<StaffOption | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [drvSearch, setDrvSearch] = useState("");
  const [activeTab, setActiveTab] = useState("basic");
  const [images, setImages] = useState<VehicleImage[]>([]);
  const [imageError, setImageError] = useState<string>("");
  const [isCompressing, setIsCompressing] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleSchema),
    mode: "onChange",
    defaultValues: editing ? mkDefaults(editing) : mkBlank(),
  });

  const vehicleType = watch("vehicleType");
  const hasTrailer = watch("hasTrailer");
  const isTrailer = vehicleType === "Trailer";

  // Compute which tabs have errors
  const tabsWithErrors = useMemo(() => {
    const errKeys = Object.keys(errors) as (keyof VehicleFormData)[];
    return Object.entries(TAB_FIELDS).reduce((acc, [tab, fields]) => {
      if (fields.some((f) => errKeys.includes(f))) acc.add(tab);
      return acc;
    }, new Set<string>());
  }, [errors]);

  function mkDefaults(v: Vehicle): Partial<VehicleFormData> {
    return {
      numberPlate: v.numberPlate,
      ownership: v.ownership,
      vehicleType: v.vehicleType,
      make: v.make,
      model: v.model,
      year: v.year ?? undefined,
      fuelType: v.fuelType ?? undefined,
      fuelConsumptionKmPerL: v.fuelConsumptionKmPerL ?? undefined,
      tankCapacity: v.tankCapacity ?? undefined,
      bodyDescription: v.bodyDescription ?? undefined,
      seatingCapacity: v.seatingCapacity ?? undefined,
      color: v.color ?? undefined,
      vin: v.vin ?? undefined,
      truckCapacity: v.truckCapacity ?? undefined,
      numberOfAxles: v.numberOfAxles ?? undefined,
      hasTrailer: v.hasTrailer || false,
      trailerId: v.trailerId ?? undefined,
      hiredFrom: v.hiredFrom ?? undefined,
      contactName: v.contactName ?? undefined,
      contactPhone: v.contactPhone ?? undefined,
      contactEmail: v.contactEmail ?? undefined,
      purchaseDate: v.purchaseDate ?? undefined,
      purchasePrice: v.purchasePrice ?? undefined,
      defaultDriverId: v.defaultDriverId ?? undefined,
      isActive: v.isActive ?? true,
      currentOdometer: v.currentOdometer ?? undefined,
      lastMaintenanceDate: v.lastMaintenanceDate ?? undefined,
      nextMaintenanceDue: v.nextMaintenanceDue ?? undefined,
    };
  }

  function mkBlank(): Partial<VehicleFormData> {
    return {
      ownership: "Owned",
      vehicleType: "Truck",
      fuelType: "Diesel",
      hasTrailer: false,
      isActive: true,
    };
  }

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setImages(editing.images || []);
      setLinkedDriver(
        drivers.find((d) => d.id === editing.defaultDriverId) || null,
      );
      reset(mkDefaults(editing));
    } else {
      setImages([]);
      setLinkedDriver(null);
      reset(mkBlank());
    }
    setActiveTab("basic");
    setShowPicker(false);
    setDrvSearch("");
    setImageError("");
  }, [editing, open, drivers, reset]);

  const close = () => {
    if (isSaving) return;
    reset();
    setLinkedDriver(null);
    setShowPicker(false);
    setImages([]);
    onClose();
  };

  const handleSetPrimary = (idx: number) => {
    setImages((prev) =>
      prev.map((img, i) => ({ ...img, isPrimary: i === idx })),
    );
  };

  const handleRemove = (idx: number) => {
    setImages((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      if (next.length > 0 && !next.some((i) => i.isPrimary))
        next[0] = { ...next[0], isPrimary: true };
      return next;
    });
  };

  const handleAdd = (img: Partial<VehicleImage>) =>
    setImages((prev) => [...prev, img as VehicleImage]);

  async function onSubmit(data: VehicleFormData) {
    setIsSaving(true);
    try {
      const token = localStorage.getItem("bp_token") ?? "";

      // Filter out irrelevant fields for trailers
      const submissionData = { ...data };
      if (submissionData.vehicleType === "Trailer") {
        // Remove all fuel-related fields and odometer for trailers
        submissionData.fuelType = null;
        submissionData.fuelConsumptionKmPerL = null;
        submissionData.tankCapacity = null;
        submissionData.hasTrailer = false;
        submissionData.trailerId = null;
        submissionData.currentOdometer = null;
        submissionData.defaultDriverId = null; // Trailers don't have drivers
      }

      const existingImages = images.filter((img) => img.imageUrl && !img.file);
      const newImages = images.filter((img) => !!img.file);

      let resolvedImages: Array<{
        imageUrl: string;
        position: ImagePosition;
        isPrimary: boolean;
        displayOrder: number;
        caption: string | null;
      }> = existingImages.map((img) => ({
        imageUrl: img.imageUrl,
        position: img.position,
        isPrimary: img.isPrimary,
        displayOrder: img.displayOrder,
        caption: img.caption ?? null,
      }));

      // Handle image uploads for edit mode
      if (editing?.id && newImages.length > 0) {
        for (const img of newImages) {
          if (!img.file) continue;
          const imgFd = new FormData();
          imgFd.append(img.position, img.file);
          try {
            const uploadRes = await fetch(
              `${API_URL}/vehicles/${editing.id}/images`,
              {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: imgFd,
              },
            );
            if (uploadRes.ok) {
              const uploaded = await uploadRes.json();
              resolvedImages.push({
                imageUrl: uploaded[0]?.imageUrl ?? "",
                position: img.position,
                isPrimary: img.isPrimary,
                displayOrder: img.displayOrder,
                caption: img.caption ?? null,
              });
            } else {
              toast.error(`Failed to upload ${img.position} image`);
            }
          } catch (e) {
            console.warn("Image upload error:", e);
            toast.error(`Failed to upload ${img.position} image`);
          }
        }
      }

      // Build FormData for vehicle save
      const fd = new FormData();
      Object.entries(submissionData).forEach(([k, v]) => {
        if (k === "images") return;
        if (v !== undefined && v !== null && v !== "") fd.append(k, String(v));
      });
      fd.append("_updated", "1");

      if (resolvedImages.length > 0) {
        fd.append("images", JSON.stringify(resolvedImages));
      }

      await onSave(fd, editing?.id);

      // Handle image uploads for new vehicles
      if (!editing?.id && newImages.length > 0) {
        const listRes = await fetch(`${API_URL}/vehicles`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (listRes.ok) {
          const all: Vehicle[] = await listRes.json();
          const plate = (data.numberPlate as string).toUpperCase();
          const newVehicleId = all.find((v) => v.numberPlate === plate)?.id;

          if (newVehicleId) {
            const uploadedForNew: typeof resolvedImages = [];

            for (const img of newImages) {
              if (!img.file) continue;
              const imgFd = new FormData();
              imgFd.append(img.position, img.file);
              try {
                const uploadRes = await fetch(
                  `${API_URL}/vehicles/${newVehicleId}/images`,
                  {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}` },
                    body: imgFd,
                  },
                );
                if (uploadRes.ok) {
                  const uploaded = await uploadRes.json();
                  uploadedForNew.push({
                    imageUrl: uploaded[0]?.imageUrl ?? "",
                    position: img.position,
                    isPrimary: img.isPrimary,
                    displayOrder: img.displayOrder,
                    caption: img.caption ?? null,
                  });
                } else {
                  toast.error(`Failed to upload ${img.position} image`);
                }
              } catch (e) {
                console.warn("Image upload error:", e);
              }
            }

            if (uploadedForNew.length > 0) {
              const patchFd = new FormData();
              patchFd.append("_updated", "1");
              patchFd.append(
                "numberPlate",
                (data.numberPlate as string).toUpperCase(),
              );
              patchFd.append("images", JSON.stringify(uploadedForNew));
              await fetch(`${API_URL}/vehicles/${newVehicleId}`, {
                method: "PATCH",
                headers: { Authorization: `Bearer ${token}` },
                body: patchFd,
              });
            }
          }
        }
      }

      close();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save vehicle");
    } finally {
      setIsSaving(false);
    }
  }

  const onInvalid = () => {
    const tabOrder = ["basic", "specs", "ownership", "maintenance", "images"];
    for (const tab of tabOrder) {
      if (tabsWithErrors.has(tab)) {
        setActiveTab(tab);
        break;
      }
    }
  };

  const TabLabel = ({ tab, label }: { tab: string; label: string }) => (
    <span className="flex items-center gap-1.5">
      {label}
      {tabsWithErrors.has(tab) && (
        <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
      )}
    </span>
  );

  // Check if any driver fields are dirty to enforce validation
  const shouldShowDriverFields = !isTrailer;

  // Filter available trailers (trailers that are not already attached to other trucks)
  const availableTrailers = useMemo(() => {
    if (!trailers) return [];

    // If editing, exclude the current vehicle's own trailer from the "in use" check
    return trailers.filter((trailer) => {
      // Check if this trailer is already attached to another truck
      const isAttachedToOtherTruck = trailers.some(
        (truck) =>
          truck.trailerId === trailer.id &&
          truck.id !== editing?.id && // Exclude current truck being edited
          truck.isActive,
      );
      return !isAttachedToOtherTruck;
    });
  }, [trailers, editing?.id]);

  return (
    <Sheet open={open} onOpenChange={(o) => !o && close()}>
      <SheetContent className="w-[1200px] sm:max-w-[1200px] overflow-y-auto !p-0">
        <div className="sticky top-0 bg-white z-20 px-8 py-5 border-b flex items-center justify-between">
          <div>
            <SheetTitle className="text-xl font-bold text-slate-900">
              {editing ? "Edit Vehicle" : "Add New Vehicle"}
            </SheetTitle>
            <SheetDescription className="text-sm text-slate-500 mt-0.5">
              {editing
                ? `Editing ${editing.numberPlate}`
                : "Enter complete vehicle specifications"}
            </SheetDescription>
          </div>
          <SheetClose
            onClick={close}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
            <X size={16} />
          </SheetClose>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="p-8">
          <TabsList className="grid grid-cols-5 w-full mb-8 h-12">
            <TabsTrigger value="basic" className="text-sm">
              <TabLabel tab="basic" label="Basic Info" />
            </TabsTrigger>
            <TabsTrigger value="specs" className="text-sm">
              <TabLabel tab="specs" label="Specifications" />
            </TabsTrigger>
            <TabsTrigger value="ownership" className="text-sm">
              <TabLabel tab="ownership" label="Ownership" />
            </TabsTrigger>
            <TabsTrigger value="maintenance" className="text-sm">
              <TabLabel tab="maintenance" label="Maintenance" />
            </TabsTrigger>
            <TabsTrigger value="images" className="text-sm">
              <TabLabel tab="images" label="Images" />
            </TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit(onSubmit, onInvalid)} noValidate>
            <TabsContent value="basic" className="space-y-8">
              <div className="grid grid-cols-3 gap-6">
                <VFI
                  name="numberPlate"
                  label="Number Plate"
                  required
                  placeholder="e.g. UAL 123A"
                  control={control}
                  errors={errors}
                />
                <VSF
                  name="vehicleType"
                  label="Vehicle Type"
                  options={VEHICLE_TYPES}
                  required
                  control={control}
                  errors={errors}
                />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <VFI
                  name="make"
                  label="Make"
                  required
                  placeholder="e.g. Toyota, Isuzu, Hino"
                  control={control}
                  errors={errors}
                />
                <VFI
                  name="model"
                  label="Model"
                  required
                  placeholder="e.g. Landcruiser, FVR"
                  control={control}
                  errors={errors}
                />
              </div>
              <div className="grid grid-cols-3 gap-6">
                <VFI
                  name="year"
                  label="Year"
                  type="number"
                  placeholder={`e.g. ${currentYear}`}
                  control={control}
                  errors={errors}
                />
                <VFI
                  name="color"
                  label="Color"
                  placeholder="e.g. White, Red"
                  control={control}
                  errors={errors}
                />
                <VFI
                  name="vin"
                  label="VIN / Chassis No."
                  placeholder="Vehicle identification number"
                  control={control}
                  errors={errors}
                />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <VFI
                  name="bodyDescription"
                  label="Body Description"
                  placeholder="e.g. Flatbed, Box body"
                  control={control}
                  errors={errors}
                />
                <VFI
                  name="seatingCapacity"
                  label="Seating Capacity"
                  type="number"
                  placeholder="e.g. 5"
                  control={control}
                  errors={errors}
                  disabled={isTrailer}
                />
              </div>
            </TabsContent>

            <TabsContent value="specs" className="space-y-8">
              {!isTrailer ? (
                <>
                  <div className="grid grid-cols-3 gap-6">
                    <VSF
                      name="fuelType"
                      label="Fuel Type"
                      options={FUEL_TYPES}
                      required
                      control={control}
                      errors={errors}
                    />
                    <VFI
                      name="fuelConsumptionKmPerL"
                      label="Consumption (km/L)"
                      type="number"
                      step="0.1"
                      placeholder="e.g. 8.5"
                      required
                      control={control}
                      errors={errors}
                    />
                    <VFI
                      name="tankCapacity"
                      label="Tank Capacity (L)"
                      type="number"
                      placeholder="e.g. 400"
                      required
                      control={control}
                      errors={errors}
                    />
                  </div>
                  <Separator />
                </>
              ) : (
                <Card className="bg-slate-50">
                  <CardContent className="pt-6">
                    <p className="text-sm text-slate-600">
                      Trailers do not have fuel specifications or odometer
                      readings. These fields are automatically disabled.
                    </p>
                  </CardContent>
                </Card>
              )}

              {TRUCK_TYPES.includes(vehicleType) && (
                <>
                  <div className="grid grid-cols-2 gap-6">
                    <VSF
                      name="truckCapacity"
                      label="Truck Capacity"
                      options={TRUCK_CAPS}
                      control={control}
                      errors={errors}
                    />
                    <VFI
                      name="numberOfAxles"
                      label="Number of Axles"
                      type="number"
                      placeholder="e.g. 2, 3, 4"
                      control={control}
                      errors={errors}
                    />
                  </div>

                  <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50">
                    <Controller
                      name="hasTrailer"
                      control={control}
                      render={({ field }) => (
                        <>
                          <Checkbox
                            id="ht"
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                          <Label
                            htmlFor="ht"
                            className="text-sm font-medium cursor-pointer">
                            This vehicle has a trailer attached
                          </Label>
                        </>
                      )}
                    />
                  </div>

                  {hasTrailer && (
                    <div className="p-6 rounded-xl border bg-white space-y-6">
                      <h3 className="text-sm font-semibold text-slate-900">
                        Trailer Attachment
                      </h3>

                      {/* Trailer selection dropdown */}
                      <div className="space-y-3">
                        <Label className="text-sm font-medium text-slate-700">
                          Select Trailer
                        </Label>
                        <Controller
                          name="trailerId"
                          control={control}
                          render={({ field }) => (
                            <Select
                              value={field.value?.toString() || "none"}
                              onValueChange={(val) => {
                                field.onChange(
                                  val === "none" ? null : parseInt(val),
                                );
                              }}>
                              <SelectTrigger className="h-10 rounded-xl text-sm">
                                <SelectValue placeholder="Choose a trailer" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">No Trailer</SelectItem>
                                {availableTrailers.map((t) => (
                                  <SelectItem
                                    key={t.id}
                                    value={t.id.toString()}>
                                    {t.numberPlate} - {t.make} {t.model} (
                                    {t.year || "N/A"})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />

                        {availableTrailers.length === 0 &&
                          trailers.length > 0 && (
                            <p className="text-xs text-amber-600 bg-amber-50 p-3 rounded-lg">
                              All trailers are currently attached to other
                              trucks.
                            </p>
                          )}

                        {trailers.length === 0 && (
                          <p className="text-xs text-amber-600 bg-amber-50 p-3 rounded-lg">
                            No trailers available. Add a trailer first in the
                            fleet.
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}

              {!isTrailer && (
                <VFI
                  name="currentOdometer"
                  label="Current Odometer (km)"
                  type="number"
                  placeholder="e.g. 125000"
                  required
                  control={control}
                  errors={errors}
                />
              )}
            </TabsContent>

            <TabsContent value="ownership" className="space-y-8">
              <div className="grid grid-cols-2 gap-6">
                <VSF
                  name="ownership"
                  label="Ownership"
                  options={["Owned", "Hired"]}
                  required
                  control={control}
                  errors={errors}
                />
              </div>
              {watch("ownership") === "Hired" && (
                <div className="p-6 rounded-xl bg-slate-50 border space-y-6">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Hiring Source
                  </h3>
                  <div className="grid grid-cols-2 gap-6">
                    <VFI
                      name="hiredFrom"
                      label="Hired From"
                      required
                      placeholder="Company or individual name"
                      control={control}
                      errors={errors}
                    />
                    <VFI
                      name="contactName"
                      label="Contact Person"
                      placeholder="Full name"
                      control={control}
                      errors={errors}
                    />
                    <VFI
                      name="contactPhone"
                      label="Contact Phone"
                      placeholder="+256 700 000000"
                      control={control}
                      errors={errors}
                    />
                    <VFI
                      name="contactEmail"
                      label="Contact Email"
                      type="email"
                      placeholder="contact@example.com"
                      control={control}
                      errors={errors}
                    />
                  </div>
                </div>
              )}
              {watch("ownership") === "Owned" && (
                <div className="grid grid-cols-2 gap-6">
                  <VFI
                    name="purchaseDate"
                    label="Purchase Date"
                    type="date"
                    control={control}
                    errors={errors}
                  />
                  <VFI
                    name="purchasePrice"
                    label="Purchase Price (UGX)"
                    type="number"
                    placeholder="e.g. 150000000"
                    control={control}
                    errors={errors}
                  />
                </div>
              )}
              <Separator />

              {/* Driver picker - Only show for non-trailer vehicles */}
              {!isTrailer && (
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-slate-700">
                    Default Driver
                  </Label>
                  <div className="p-4 rounded-xl bg-slate-50 border">
                    {linkedDriver ? (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={linkedDriver.avatarUrl || ""} />
                            <AvatarFallback>
                              {initials(linkedDriver.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-semibold text-slate-900">
                              {linkedDriver.name}
                            </p>
                            <p className="text-xs text-slate-500">
                              {linkedDriver.department || "Driver"}
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setLinkedDriver(null);
                            setValue("defaultDriverId", null);
                          }}>
                          <Unlink size={14} />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowPicker(true)}
                        className="w-full">
                        <Link2 size={14} className="mr-2" /> Link Default Driver
                      </Button>
                    )}
                    {showPicker && (
                      <div className="mt-3 bg-white p-3 rounded-xl border">
                        <div className="relative mb-2">
                          <Search
                            size={12}
                            className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400"
                          />
                          <Input
                            placeholder="Search drivers…"
                            value={drvSearch}
                            onChange={(e) => setDrvSearch(e.target.value)}
                            className="h-8 text-xs pl-7"
                          />
                        </div>
                        <ScrollArea className="h-48">
                          {drivers
                            .filter((d) =>
                              d.name
                                .toLowerCase()
                                .includes(drvSearch.toLowerCase()),
                            )
                            .map((d) => (
                              <button
                                key={d.id}
                                type="button"
                                onClick={() => {
                                  setLinkedDriver(d);
                                  setValue("defaultDriverId", d.id);
                                  setShowPicker(false);
                                }}
                                className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 rounded-lg">
                                {d.name}
                              </button>
                            ))}
                          {drivers.filter((d) =>
                            d.name
                              .toLowerCase()
                              .includes(drvSearch.toLowerCase()),
                          ).length === 0 && (
                            <p className="text-xs text-slate-400 px-3 py-4 text-center">
                              No drivers found
                            </p>
                          )}
                        </ScrollArea>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="maintenance" className="space-y-8">
              {!isTrailer && (
                <>
                  <div className="grid grid-cols-2 gap-6">
                    <VFI
                      name="lastMaintenanceDate"
                      label="Last Maintenance Date"
                      type="date"
                      control={control}
                      errors={errors}
                    />
                    <VFI
                      name="nextMaintenanceDue"
                      label="Next Service Due"
                      type="date"
                      control={control}
                      errors={errors}
                    />
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50">
                    <Controller
                      name="isActive"
                      control={control}
                      render={({ field }) => (
                        <>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                          <Label className="text-sm font-medium text-slate-700">
                            Vehicle is active and operational
                          </Label>
                        </>
                      )}
                    />
                  </div>
                </>
              )}
              {isTrailer && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50">
                  <Controller
                    name="isActive"
                    control={control}
                    render={({ field }) => (
                      <>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                        <Label className="text-sm font-medium text-slate-700">
                          Trailer is active and available
                        </Label>
                      </>
                    )}
                  />
                </div>
              )}
            </TabsContent>

            <TabsContent value="images">
              <ImageUploader
                images={images}
                onChange={handleAdd}
                onRemove={handleRemove}
                onSetPrimary={handleSetPrimary}
              />
            </TabsContent>

            <div className="sticky bottom-0 bg-white pt-6 mt-8 border-t flex gap-4">
              <Button
                type="button"
                variant="outline"
                disabled={isSaving}
                onClick={close}
                className="flex-1 rounded-xl h-12 text-base">
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSaving || !isValid}
                className="flex-1 rounded-xl h-12 text-base text-white font-semibold"
                style={{ background: SKY }}
                onMouseOver={(e) =>
                  (e.currentTarget.style.background = "#0591c0")
                }
                onMouseOut={(e) => (e.currentTarget.style.background = SKY)}>
                {isSaving ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {images.some((i) => i.file)
                      ? "Uploading images…"
                      : "Saving…"}
                  </span>
                ) : editing ? (
                  "Save Changes"
                ) : (
                  "Add Vehicle"
                )}
              </Button>
            </div>
          </form>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

// ─── Delete Dialog ────────────────────────────────────────────────────────────
function DeleteDialog({
  open,
  onClose,
  vehicle,
  onConfirm,
  isTrailerInUse,
}: {
  open: boolean;
  onClose: () => void;
  vehicle: Vehicle | null;
  onConfirm: () => Promise<void>;
  isTrailerInUse?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  async function go() {
    setBusy(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setBusy(false);
    }
  }
  return (
    <AlertDialog open={open} onOpenChange={(o) => !o && !busy && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {vehicle?.vehicleType === "Trailer"
              ? "Remove Trailer"
              : "Remove Vehicle"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isTrailerInUse ? (
              <span className="text-amber-600">
                This trailer is currently attached to one or more trucks. Please
                remove all attachments before deleting.
              </span>
            ) : (
              <>
                Remove <strong>{vehicle?.numberPlate}</strong>? This cannot be
                undone.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={go}
            disabled={busy || isTrailerInUse}
            className={
              isTrailerInUse ? "bg-slate-400" : "bg-red-600 hover:bg-red-700"
            }>
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Remove"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  icon: Icon,
  color,
  bg,
}: {
  label: string;
  value: number;
  icon: any;
  color: string;
  bg: string;
}) {
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

// ─── Sort Header ──────────────────────────────────────────────────────────────
function SortHeader({
  label,
  sortKey,
  current,
  dir,
  onSort,
}: {
  label: string;
  sortKey: keyof Vehicle;
  current: keyof Vehicle;
  dir: "asc" | "desc";
  onSort: (k: keyof Vehicle) => void;
}) {
  const active = current === sortKey;
  return (
    <button
      onClick={() => onSort(sortKey)}
      className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest transition-colors"
      style={{ color: active ? "#0f172a" : "#64748b" }}>
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

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Vehicles() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<StaffOption[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [ownFilter, setOwnFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortKey, setSortKey] = useState<keyof Vehicle>("numberPlate");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Vehicle | null>(null);
  const [viewingVehicle, setViewingVehicle] = useState<Vehicle | null>(null);

  const handleSort = (k: keyof Vehicle) => {
    if (sortKey === k) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(k);
      setSortDir("asc");
    }
  };

  const authH = useCallback(
    () => ({ Authorization: `Bearer ${localStorage.getItem("bp_token")}` }),
    [],
  );

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [vR, sR, jR] = await Promise.all([
        fetch(`${API_URL}/vehicles`, { headers: authH() }),
        fetch(`${API_URL}/staff`, { headers: authH() }),
        fetch(`${API_URL}/jobs`, { headers: authH() }),
      ]);

      if (vR.ok) {
        const vehiclesData: Vehicle[] = await vR.json();

        // Enrich vehicles with attached trailer data
        const enrichedVehicles = vehiclesData.map((v) => ({
          ...v,
          attachedTrailer: v.trailerId
            ? vehiclesData.find((t) => t.id === v.trailerId)
            : null,
        }));

        setVehicles(enrichedVehicles);
      }

      if (sR.ok) {
        const all = await sR.json();
        setDrivers(
          all.filter(
            (s: any) =>
              s.department === "Logistics" ||
              s.department === "Driver" ||
              s.role === "DRIVER",
          ),
        );
      }
      if (jR.ok) setJobs(await jR.json());
    } catch {
      toast.error("Failed to fetch data");
    } finally {
      setIsLoading(false);
    }
  }, [authH]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getStatus = useCallback(
    (v: Vehicle): VehicleStatus => {
      if (!v.isActive) return "inactive";
      if (
        jobs.some(
          (j) =>
            j.vehicleId === v.id &&
            (j.status === "Ongoing" || j.status === "Scheduled"),
        )
      )
        return "on_job";
      if (v.nextMaintenanceDue && new Date(v.nextMaintenanceDue) <= new Date())
        return "maintenance";
      return "available";
    },
    [jobs],
  );

  const handleStatusChange = useCallback(
    async (vehicleId: number, isActive: boolean) => {
      const update = (prev: Vehicle[]) =>
        prev.map((v) => (v.id === vehicleId ? { ...v, isActive } : v));
      setVehicles(update);
      setViewingVehicle((prev) =>
        prev?.id === vehicleId ? { ...prev, isActive } : prev,
      );
      try {
        const fd = new FormData();
        fd.append("isActive", String(isActive));
        fd.append("_updated", "1");
        const res = await fetch(`${API_URL}/vehicles/${vehicleId}`, {
          method: "PATCH",
          headers: authH(),
          body: fd,
        });
        if (res.ok) {
          toast.success(isActive ? "Vehicle activated" : "Vehicle deactivated");
        } else {
          setVehicles((prev) =>
            prev.map((v) =>
              v.id === vehicleId ? { ...v, isActive: !isActive } : v,
            ),
          );
          setViewingVehicle((prev) =>
            prev?.id === vehicleId ? { ...prev, isActive: !isActive } : prev,
          );
          toast.error("Failed to update status");
        }
      } catch {
        setVehicles((prev) =>
          prev.map((v) =>
            v.id === vehicleId ? { ...v, isActive: !isActive } : v,
          ),
        );
        toast.error("Network error");
      }
    },
    [authH],
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return vehicles
      .filter((v) => {
        const st = getStatus(v);
        return (
          (v.numberPlate.toLowerCase().includes(q) ||
            v.make?.toLowerCase().includes(q) ||
            v.model?.toLowerCase().includes(q)) &&
          (typeFilter === "ALL" || v.vehicleType === typeFilter) &&
          (ownFilter === "ALL" || v.ownership === ownFilter) &&
          (statusFilter === "ALL" || st === statusFilter)
        );
      })
      .sort((a, b) => {
        const va = a[sortKey],
          vb = b[sortKey];
        if (va == null) return 1;
        if (vb == null) return -1;
        if (typeof va === "string" && typeof vb === "string")
          return sortDir === "asc"
            ? va.localeCompare(vb)
            : vb.localeCompare(va);
        return sortDir === "asc"
          ? va < vb
            ? -1
            : va > vb
              ? 1
              : 0
          : va > vb
            ? -1
            : va < vb
              ? 1
              : 0;
      });
  }, [
    vehicles,
    search,
    typeFilter,
    ownFilter,
    statusFilter,
    sortKey,
    sortDir,
    getStatus,
  ]);

  async function handleSave(fd: FormData, id?: number) {
    const res = await fetch(
      id ? `${API_URL}/vehicles/${id}` : `${API_URL}/vehicles`,
      { method: id ? "PATCH" : "POST", headers: authH(), body: fd },
    );
    if (res.ok) {
      toast.success(id ? "Vehicle updated" : "Vehicle added");
      fetchData();
    } else {
      const e = await res.json();
      throw new Error(e.error || "Operation failed");
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;

    // Check if trailer is in use before deleting
    if (deleteTarget.vehicleType === "Trailer") {
      const isInUse = vehicles.some(
        (v) => v.trailerId === deleteTarget.id && v.isActive,
      );
      if (isInUse) {
        toast.error("Cannot delete trailer that is attached to active trucks");
        setDeleteTarget(null);
        return;
      }
    }

    const res = await fetch(`${API_URL}/vehicles/${deleteTarget.id}`, {
      method: "DELETE",
      headers: authH(),
    });
    if (res.ok) {
      toast.success(
        deleteTarget.vehicleType === "Trailer"
          ? "Trailer removed"
          : "Vehicle removed",
      );
      fetchData();
    } else toast.error("Delete failed");
  }

  const statusCounts = useMemo(
    () =>
      vehicles.reduce(
        (acc, v) => {
          const s = getStatus(v);
          acc[s] = (acc[s] || 0) + 1;
          return acc;
        },
        {} as Record<VehicleStatus, number>,
      ),
    [vehicles, getStatus],
  );

  const trailers = useMemo(
    () => vehicles.filter((v) => v.vehicleType === "Trailer"),
    [vehicles],
  );

  const trucks = useMemo(
    () => vehicles.filter((v) => TRUCK_TYPES.includes(v.vehicleType)),
    [vehicles],
  );

  return (
    <div className="h-full overflow-auto px-6 pt-5 pb-6">
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
            Fleet Management
          </h2>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => {
              setEditing(null);
              setSheetOpen(true);
            }}
            className="flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-semibold text-white"
            style={{ background: SKY }}
            onMouseOver={(e) => (e.currentTarget.style.background = "#0591c0")}
            onMouseOut={(e) => (e.currentTarget.style.background = SKY)}>
            <Plus size={15} /> Add Vehicle
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-3 mb-5">
        <StatCard
          label="Total Fleet"
          value={vehicles.length}
          icon={Truck}
          color={SKY}
          bg={`${SKY}18`}
        />
        <StatCard
          label="Trucks"
          value={trucks.length}
          icon={Truck}
          color="#b8922a"
          bg="#E1BA5820"
        />
        <StatCard
          label="Trailers"
          value={trailers.length}
          icon={Package}
          color="#6b7280"
          bg="#6b728018"
        />
        <StatCard
          label="Available"
          value={statusCounts.available || 0}
          icon={CheckCircle2}
          color="#16a34a"
          bg="#16a34a18"
        />
        <StatCard
          label="On Job"
          value={statusCounts.on_job || 0}
          icon={Clock}
          color={SKY}
          bg={`${SKY}18`}
        />
        <StatCard
          label="Maintenance"
          value={statusCounts.maintenance || 0}
          icon={Wrench}
          color="#f97316"
          bg="#f9731618"
        />
        <StatCard
          label="Inactive"
          value={statusCounts.inactive || 0}
          icon={XCircle}
          color="#ef4444"
          bg="#ef444418"
        />
      </div>

      <div className="rounded-2xl p-4 mb-4 flex items-center gap-3 bg-white border border-slate-200">
        <div className="relative flex-1 max-w-sm">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by plate, make, model…"
            className="pl-9 h-9 rounded-xl text-sm border-0 bg-[#F5F4EF]"
          />
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <Filter size={13} className="text-slate-500" />
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="h-9 rounded-xl text-xs w-32 border-0 bg-[#F5F4EF]">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Types</SelectItem>
              {VEHICLE_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t.replace(/_/g, " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={ownFilter} onValueChange={setOwnFilter}>
            <SelectTrigger className="h-9 rounded-xl text-xs w-28 border-0 bg-[#F5F4EF]">
              <SelectValue placeholder="Ownership" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All</SelectItem>
              <SelectItem value="Owned">Owned</SelectItem>
              <SelectItem value="Hired">Hired</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 rounded-xl text-xs w-28 border-0 bg-[#F5F4EF]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All</SelectItem>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="on_job">On Job</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-2xl overflow-hidden min-h-[400px] bg-white border border-slate-200">
        <div
          className="grid px-5 py-3 bg-[#FAFAF8] border-b border-slate-200"
          style={{
            gridTemplateColumns:
              "2fr 1fr 1fr 1.5fr 1fr 1fr 1.2fr 1.2fr 1fr 52px",
          }}>
          <SortHeader
            label="Plate"
            sortKey="numberPlate"
            current={sortKey}
            dir={sortDir}
            onSort={handleSort}
          />
          <SortHeader
            label="Type"
            sortKey="vehicleType"
            current={sortKey}
            dir={sortDir}
            onSort={handleSort}
          />
          <SortHeader
            label="Ownership"
            sortKey="ownership"
            current={sortKey}
            dir={sortDir}
            onSort={handleSort}
          />
          <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
            Make / Model
          </span>
          <SortHeader
            label="Year"
            sortKey="year"
            current={sortKey}
            dir={sortDir}
            onSort={handleSort}
          />
          <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
            Fuel
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
            Trailer
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
            Driver
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
            Status
          </span>
          <span />
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-3">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: SKY }} />
            <p className="text-sm font-medium text-slate-500">Loading fleet…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
            <Truck size={28} className="text-slate-300 mb-4" />
            <h3 className="text-base font-bold mb-1 text-slate-900">
              No Vehicles Found
            </h3>
            <p className="text-sm max-w-[280px] mb-6 text-slate-500">
              No vehicles match the current filters.
            </p>
            <Button
              onClick={() => setSheetOpen(true)}
              variant="outline"
              className="rounded-xl h-9 px-5">
              <Plus size={14} className="mr-2" /> Add Vehicle
            </Button>
          </div>
        ) : (
          filtered.map((v, i) => {
            const ts = TYPE_STYLES[v.vehicleType];
            const os = OWN_STYLES[v.ownership];
            const st = getStatus(v);
            const isTrailer = v.vehicleType === "Trailer";

            return (
              <div
                key={v.id}
                onClick={() => setViewingVehicle(v)}
                className="grid items-center px-5 py-3.5 hover:bg-[#F5F4EF] transition-colors cursor-pointer"
                style={{
                  gridTemplateColumns:
                    "2fr 1fr 1fr 1.5fr 1fr 1fr 1.2fr 1.2fr 1fr 52px",
                  borderBottom:
                    i < filtered.length - 1 ? "1px solid #e2e8f0" : "none",
                }}>
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: ts.bg }}>
                    <ts.icon size={16} style={{ color: ts.color }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold tracking-wider truncate text-slate-900">
                      {v.numberPlate}
                    </p>
                    {v.vin && (
                      <p className="text-[8px] text-slate-400">
                        VIN: {v.vin.slice(-6)}
                      </p>
                    )}
                  </div>
                </div>

                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold w-fit"
                  style={{ background: ts.bg, color: ts.color }}>
                  {v.vehicleType.replace(/_/g, " ")}
                </span>

                <span
                  className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-semibold w-fit"
                  style={{ background: os.bg, color: os.color }}>
                  {v.ownership}
                </span>

                <div className="min-w-0">
                  <p className="text-xs font-medium truncate text-slate-900">
                    {v.make} {v.model}
                  </p>
                  {v.truckCapacity && (
                    <p className="text-[9px] text-slate-500">
                      {v.truckCapacity}
                    </p>
                  )}
                </div>

                <p
                  className="text-sm font-semibold"
                  style={{ color: v.year ? "#0f172a" : "#94a3b8" }}>
                  {v.year || "—"}
                </p>

                <div className="flex items-center gap-1">
                  {isTrailer ? (
                    <>
                      <Package size={12} className="text-slate-400" />
                      <span className="text-xs text-slate-400">N/A</span>
                    </>
                  ) : (
                    <>
                      <Fuel size={12} className="text-slate-400" />
                      <span className="text-xs">{v.fuelType || "—"}</span>
                    </>
                  )}
                </div>

                {/* Trailer cell */}
                <div className="min-w-0">
                  {v.hasTrailer && v.trailerId ? (
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded flex items-center justify-center bg-purple-50">
                        <Link2 size={10} className="text-purple-500" />
                      </div>
                      <span className="text-xs text-purple-600 font-medium">
                        {v.attachedTrailer?.numberPlate || `ID: ${v.trailerId}`}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400">—</span>
                  )}
                </div>

                <div className="min-w-0">
                  {!isTrailer && v.defaultDriverName ? (
                    <div className="flex items-center gap-1.5">
                      <Avatar className="w-5 h-5">
                        <AvatarFallback className="text-[8px]">
                          {initials(v.defaultDriverName)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs truncate">
                        {v.defaultDriverName}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400">—</span>
                  )}
                </div>

                <div onClick={(e) => e.stopPropagation()}>
                  <InlineStatus
                    vehicle={v}
                    status={st}
                    onStatusChange={handleStatusChange}
                  />
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
                      className="w-36 rounded-xl">
                      <DropdownMenuItem
                        onClick={() => setViewingVehicle(v)}
                        className="text-xs cursor-pointer">
                        <Eye size={13} className="mr-2" /> View
                      </DropdownMenuItem>
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
              </div>
            );
          })
        )}
      </div>

      <VehicleSheet
        open={sheetOpen}
        onClose={() => {
          setSheetOpen(false);
          setEditing(null);
        }}
        editing={editing}
        onSave={handleSave}
        drivers={drivers}
        trailers={trailers}
      />

      <VehicleDetailSheet
        open={!!viewingVehicle}
        onClose={() => setViewingVehicle(null)}
        vehicle={viewingVehicle}
        jobs={jobs}
        onEdit={(v) => {
          setEditing(v);
          setSheetOpen(true);
        }}
        onStatusChange={handleStatusChange}
      />

      <DeleteDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        vehicle={deleteTarget}
        onConfirm={handleDelete}
        isTrailerInUse={
          deleteTarget?.vehicleType === "Trailer"
            ? vehicles.some(
                (v) => v.trailerId === deleteTarget.id && v.isActive,
              )
            : false
        }
      />
    </div>
  );
}

// Tab fields definition (moved outside to avoid rerenders)
const TAB_FIELDS: Record<string, (keyof VehicleFormData)[]> = {
  basic: [
    "numberPlate",
    "vehicleType",
    "make",
    "model",
    "year",
    "color",
    "vin",
    "bodyDescription",
    "seatingCapacity",
  ],
  specs: [
    "fuelType",
    "fuelConsumptionKmPerL",
    "tankCapacity",
    "truckCapacity",
    "numberOfAxles",
    "hasTrailer",
    "trailerId",
    "currentOdometer",
  ],
  ownership: [
    "ownership",
    "hiredFrom",
    "contactName",
    "contactPhone",
    "contactEmail",
    "purchaseDate",
    "purchasePrice",
    "defaultDriverId",
  ],
  maintenance: ["isActive", "lastMaintenanceDate", "nextMaintenanceDue"],
  images: [],
};
