import { useState, useMemo, useEffect, useCallback } from "react";
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
  UserCircle2,
  ShieldCheck,
  Eye,
  EyeOff,
  RefreshCw,
  Link2,
  Unlink,
  Send,
  Lock,
  Mail,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Key,
  MapPin,
  Building2,
  Calendar,
  CheckCircle2,
  Fuel,
  Wrench,
  CreditCard,
  Truck,
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
import { ScrollArea } from "@/components/ui/scroll-area";

// ── Configuration ─────────────────────────────────────────────────────────────
const API_URL = "https://blue-pearls-server.vercel.app";
const SKY_BLUE = "#06a3d8";

// ── Types ─────────────────────────────────────────────────────────────────────

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

export interface Account {
  id: number;
  name: string;
  email: string;
  role: Role;
  staffId?: number | null;
  staffName?: string | null;
  staffPlacementId?: number | null;
  placementName?: string | null;
  placementAddress?: string | null;
  avatarUrl?: string | null;
  isActive: boolean;
  lastLogin?: string | null;
  createdAt: string;
}

export interface StaffOption {
  id: number;
  name: string;
  officialEmail?: string | null;
  avatarUrl?: string | null;
  placementId?: number | null;
  placementName?: string | null;
  role?: Role | null; // ✅ Added role field
}

export interface Client {
  id: number;
  name: string;
  contactPerson?: string | null;
  email?: string | null;
  phone: string;
  address?: string | null;
  tinNumber?: string | null;
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

export const ROLE_COLORS: Record<
  Role,
  { color: string; bg: string; icon: any }
> = {
  SUPER_ADMIN: { color: "#7A80F0", bg: "#7A80F018", icon: ShieldCheck },
  MANAGER: { color: SKY_BLUE, bg: `${SKY_BLUE}18`, icon: ShieldCheck },
  IMPLANT: { color: "#8CA573", bg: "#8CA57318", icon: Building2 },
  PSV_COORDINATOR: { color: "#059669", bg: "#05966918", icon: Truck },
  TRUCK_COORDINATOR: { color: "#b8922a", bg: "#E1BA5822", icon: Truck },
  DRIVER: { color: "#9E9E9E", bg: "#9E9E9E18", icon: Truck },
  SECURITY_GUARD: { color: "#EA7957", bg: "#EA795718", icon: ShieldCheck },
  FUEL_AGENT: { color: SKY_BLUE, bg: `${SKY_BLUE}18`, icon: Fuel },
  FUEL_MANAGER: { color: SKY_BLUE, bg: `${SKY_BLUE}18`, icon: Fuel },
  ALLOWANCE_MANAGER: { color: "#8b5cf6", bg: "#8b5cf618", icon: CreditCard },
  WORKSHOP_MANAGER: { color: "#f97316", bg: "#f9731618", icon: Wrench },
  FINANCE_MANAGER: { color: "#16a34a", bg: "#16a34a18", icon: CreditCard },
};

export const ALL_ROLES: Role[] = [
  "IMPLANT",
  "MANAGER",
  "SUPER_ADMIN",
  "PSV_COORDINATOR",
  "TRUCK_COORDINATOR",
  "DRIVER",
  "SECURITY_GUARD",
  "FUEL_AGENT",
  "FUEL_MANAGER",
  "ALLOWANCE_MANAGER",
  "WORKSHOP_MANAGER",
  "FINANCE_MANAGER",
];

type SortKey =
  | "name"
  | "email"
  | "role"
  | "placement"
  | "createdAt"
  | "lastLogin";
type SortDir = "asc" | "desc";

// ── Helpers ───────────────────────────────────────────────────────────────────

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

function generatePassword(length = 12): string {
  const chars =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*";
  return Array.from({ length }, () =>
    chars.charAt(Math.floor(Math.random() * chars.length)),
  ).join("");
}

function formatDate(date?: string | null) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(date?: string | null) {
  if (!date) return "—";
  return new Date(date).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ── Zod Schema ────────────────────────────────────────────────────────────────

const accountSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
  role: z.enum(ALL_ROLES as [Role, ...Role[]]),
  password: z.string().min(6, "Password must be at least 6 characters"),
  staffId: z.number().nullable().optional(),
  placementId: z.number().nullable().optional(),
  sendCredentials: z.boolean().default(false),
});

const editAccountSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
  role: z.enum(ALL_ROLES as [Role, ...Role[]]),
  staffId: z.number().nullable().optional(),
  placementId: z.number().nullable().optional(),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .optional()
    .or(z.literal("")),
  sendCredentials: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

type AccountFormData = z.infer<typeof accountSchema>;
type EditAccountFormData = z.infer<typeof editAccountSchema>;

// ── Sort Header Component ──────────────────────────────────────────────────────

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
      className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest transition-colors"
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

// ── Account Detail Modal ──────────────────────────────────────────────────────

function AccountDetailModal({
  open,
  onClose,
  account,
}: {
  open: boolean;
  onClose: () => void;
  account: Account | null;
}) {
  if (!account) return null;

  const roleStyle = ROLE_COLORS[account.role];
  const RoleIcon = roleStyle.icon;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        <div className="sticky top-0 bg-white z-10 px-6 py-4 border-b flex items-center justify-between">
          <DialogTitle className="text-xl font-bold flex items-center gap-2 text-slate-900">
            <span>Account Details</span>
            <Badge variant="outline" className="text-xs">
              #{String(account.id).padStart(4, "0")}
            </Badge>
          </DialogTitle>
          <DialogClose className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100">
            <X className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </div>

        <div className="p-6">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Avatar className="w-16 h-16">
              <AvatarImage src={account.avatarUrl || ""} />
              <AvatarFallback
                className="text-lg font-bold text-white"
                style={{ background: avatarColor(account.id) }}>
                {getInitials(account.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-xl font-bold text-slate-900">
                {account.name}
              </h3>
              <p className="text-sm text-slate-500">{account.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <div
                  className="flex items-center gap-1 px-2 py-1 rounded-md"
                  style={{ background: roleStyle.bg }}>
                  <RoleIcon size={12} style={{ color: roleStyle.color }} />
                  <span className="text-xs" style={{ color: roleStyle.color }}>
                    {ROLE_LABELS[account.role]}
                  </span>
                </div>
                <Badge
                  className="text-xs"
                  style={{
                    background: account.isActive ? "#16a34a18" : "#ef444418",
                    color: account.isActive ? "#16a34a" : "#ef4444",
                  }}>
                  {account.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>
          </div>

          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid grid-cols-3 w-full mb-6">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="staff">Linked Staff</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <InfoItem icon={Mail} label="Email" value={account.email} />
                <InfoItem
                  icon={Calendar}
                  label="Created"
                  value={formatDate(account.createdAt)}
                />
                <InfoItem
                  icon={Clock}
                  label="Last Login"
                  value={formatDateTime(account.lastLogin)}
                />
                <InfoItem
                  icon={ShieldCheck}
                  label="Role"
                  value={ROLE_LABELS[account.role]}
                />
              </div>
            </TabsContent>

            <TabsContent value="staff">
              {account.staffId ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback
                        style={{ background: avatarColor(account.staffId) }}>
                        {getInitials(account.staffName || "")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {account.staffName}
                      </p>
                      <p className="text-xs text-slate-500">
                        Staff ID: #{String(account.staffId).padStart(4, "0")}
                      </p>
                    </div>
                  </div>
                  {account.staffPlacementId && (
                    <div className="p-4 bg-slate-50 rounded-xl">
                      <p className="text-xs font-semibold text-slate-500 mb-2">
                        Placement
                      </p>
                      <div className="flex items-start gap-2">
                        <Building2
                          size={14}
                          className="text-slate-400 mt-0.5"
                        />
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            {account.placementName}
                          </p>
                          {account.placementAddress && (
                            <p className="text-xs text-slate-500">
                              {account.placementAddress}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <Link2 size={32} className="mx-auto mb-3 text-slate-300" />
                  <p>No staff member linked to this account.</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="activity">
              <div className="text-center py-8 text-slate-500">
                <Clock size={32} className="mx-auto mb-3 text-slate-300" />
                <p>Activity log coming soon.</p>
              </div>
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
  icon: any;
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

function Clock(props: any) {
  return (
    <svg
      {...props}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

// ── Account Sheet (Create) ────────────────────────────────────────────────────

function CreateAccountSheet({
  open,
  onClose,
  onSave,
  staffOptions,
  clients,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: AccountFormData) => Promise<void>;
  staffOptions: StaffOption[];
  clients: Client[];
}) {
  const [isSaving, setIsSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [linkedStaff, setLinkedStaff] = useState<StaffOption | null>(null);
  const [staffSearch, setStaffSearch] = useState("");
  const [showStaffPicker, setShowStaffPicker] = useState(false);
  const [selectedPlacement, setSelectedPlacement] = useState<Client | null>(
    null,
  );
  const [showPlacementPicker, setShowPlacementPicker] = useState(false);
  const [clientSearch, setClientSearch] = useState("");

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AccountFormData>({
    //@ts-ignore - Zod schema has some conditional logic that RHF's type inference can't handle perfectly
    resolver: zodResolver(accountSchema) as any,
    defaultValues: {
      name: "",
      email: "",
      role: "DRIVER",
      password: "",
      staffId: null,
      placementId: null,
      sendCredentials: false,
    },
  });

  const selectedRole = watch("role");

  useEffect(() => {
    // Reset placement when role changes from IMPLANT to something else
    if (selectedRole !== "IMPLANT") {
      setValue("placementId", null);
      setSelectedPlacement(null);
    }
  }, [selectedRole, setValue]);

  function handleClose() {
    reset();
    setLinkedStaff(null);
    setStaffSearch("");
    setShowStaffPicker(false);
    setSelectedPlacement(null);
    setShowPlacementPicker(false);
    setClientSearch("");
    onClose();
  }

  function handleLinkStaff(s: StaffOption) {
    setLinkedStaff(s);
    setValue("staffId", s.id);
    setValue("name", s.name);
    if (s.officialEmail) setValue("email", s.officialEmail);

    // ✅ Prefill the role from the staff member
    if (s.role) {
      setValue("role", s.role);
    }

    // ✅ Prefill placement if the staff has one
    if (s.placementId) {
      const client = clients.find((c) => c.id === s.placementId);
      if (client) {
        setSelectedPlacement(client);
        setValue("placementId", client.id);
      }
    }
    setShowStaffPicker(false);
    setStaffSearch("");
  }

  function handleUnlink() {
    setLinkedStaff(null);
    setValue("staffId", null);
    setValue("name", "");
    setValue("email", "");
    setValue("role", "DRIVER"); // Reset to default
    setValue("placementId", null);
    setSelectedPlacement(null);
  }

  function handleSelectPlacement(client: Client) {
    setSelectedPlacement(client);
    setValue("placementId", client.id);
    setShowPlacementPicker(false);
    setClientSearch("");
  }

  function handleRemovePlacement() {
    setSelectedPlacement(null);
    setValue("placementId", null);
  }

  function handleAutoGenerate() {
    const pwd = generatePassword();
    setValue("password", pwd);
    setShowPassword(true);
  }

  async function onSubmit(data: AccountFormData) {
    setIsSaving(true);
    try {
      // If role is IMPLANT, ensure placement is included
      if (data.role === "IMPLANT" && !data.placementId) {
        toast.error("Placement is required for Implant role");
        setIsSaving(false);
        return;
      }
      await onSave(data);
      handleClose();
    } finally {
      setIsSaving(false);
    }
  }

  const filteredStaff = staffOptions.filter((s) =>
    s.name.toLowerCase().includes(staffSearch.toLowerCase()),
  );

  const filteredClients = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
      c.address?.toLowerCase().includes(clientSearch.toLowerCase()) ||
      false ||
      c.contactPerson?.toLowerCase().includes(clientSearch.toLowerCase()) ||
      false,
  );

  return (
    <Sheet open={open} onOpenChange={(o) => !o && !isSaving && handleClose()}>
      <SheetContent className="w-[600px] sm:max-w-[600px] overflow-y-auto !p-0">
        <div className="sticky top-0 bg-white z-10 px-7 py-5 border-b flex items-center justify-between">
          <div>
            <SheetTitle className="text-xl font-bold text-slate-900">
              Create Account
            </SheetTitle>
            <SheetDescription className="mt-1 text-sm text-slate-500">
              Set up a new user account with login credentials.
            </SheetDescription>
          </div>
          <SheetClose className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100">
            <X className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </SheetClose>
        </div>

        <ScrollArea className="h-[calc(100vh-120px)] px-7 py-6">
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="space-y-6">
              {/* Link Staff Section */}
              <div
                className="rounded-2xl p-5"
                style={{
                  background: "#F5F4EF",
                  border: `1px solid #e2e8f0`,
                }}>
                <p className="text-xs font-semibold mb-3 text-slate-700">
                  Step 1 — Link a Staff Member (optional)
                </p>

                {linkedStaff ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback
                          className="text-white text-sm font-bold"
                          style={{ background: avatarColor(linkedStaff.id) }}>
                          {getInitials(linkedStaff.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {linkedStaff.name}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Staff ID #{String(linkedStaff.id).padStart(4, "0")}
                        </p>
                        {linkedStaff.role && (
                          <p className="text-[10px] flex items-center gap-1 mt-0.5 text-slate-500">
                            <ShieldCheck size={8} /> Role:{" "}
                            {ROLE_LABELS[linkedStaff.role]}
                          </p>
                        )}
                        {linkedStaff.placementName && (
                          <p className="text-[10px] flex items-center gap-1 mt-0.5 text-slate-500">
                            <MapPin size={8} /> Current:{" "}
                            {linkedStaff.placementName}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleUnlink}
                      className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors hover:bg-red-50 text-red-500">
                      <Unlink size={12} /> Unlink
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    {showStaffPicker ? (
                      <div>
                        <div className="relative mb-2">
                          <Search
                            size={13}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                          />
                          <Input
                            autoFocus
                            value={staffSearch}
                            onChange={(e) => setStaffSearch(e.target.value)}
                            placeholder="Search staff by name…"
                            className="pl-9 h-9 rounded-xl text-sm bg-white"
                          />
                        </div>
                        <div
                          className="rounded-xl overflow-hidden max-h-44 overflow-y-auto border"
                          style={{
                            background: "#fff",
                            borderColor: "#e2e8f0",
                          }}>
                          {filteredStaff.length === 0 ? (
                            <p className="text-xs text-center py-6 text-slate-500">
                              No staff found
                            </p>
                          ) : (
                            filteredStaff.map((s) => (
                              <button
                                key={s.id}
                                type="button"
                                onClick={() => handleLinkStaff(s)}
                                className="w-full flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-[#F5F4EF] text-left border-b last:border-0"
                                style={{ borderColor: "#e2e8f0" }}>
                                <Avatar className="w-7 h-7">
                                  <AvatarFallback
                                    className="text-white text-[10px] font-bold"
                                    style={{ background: avatarColor(s.id) }}>
                                    {getInitials(s.name)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-medium truncate text-slate-900">
                                    {s.name}
                                  </p>
                                  <div className="flex items-center gap-2 text-[10px] text-slate-500">
                                    {s.role && (
                                      <span className="flex items-center gap-0.5">
                                        <ShieldCheck size={8} />
                                        {ROLE_LABELS[s.role]}
                                      </span>
                                    )}
                                    {s.placementName && (
                                      <span className="flex items-center gap-0.5">
                                        <MapPin size={8} />
                                        {s.placementName}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </button>
                            ))
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowStaffPicker(false)}
                          className="mt-2 text-xs font-medium text-slate-500">
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowStaffPicker(true)}
                        className="w-full flex items-center gap-2 justify-center h-10 rounded-xl text-sm font-medium transition-colors hover:bg-white border-dashed border-2"
                        style={{
                          color: "#64748b",
                          borderColor: "#e2e8f0",
                        }}>
                        <Link2 size={14} /> Link a Staff Member
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Account Details Section */}
              <div>
                <p className="text-xs font-semibold mb-3 text-slate-700">
                  Step 2 — Account Details
                </p>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-700">
                      Full Name *
                    </Label>
                    <Controller
                      name="name"
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          placeholder="e.g. Moses Okello"
                          className="h-10 rounded-xl text-sm"
                          readOnly={!!linkedStaff}
                          style={
                            linkedStaff
                              ? { background: "#F5F4EF", color: "#64748b" }
                              : {}
                          }
                        />
                      )}
                    />
                    {errors.name && (
                      <p className="text-xs text-red-500">
                        {errors.name.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-700">
                      Email Address *
                    </Label>
                    <div className="relative">
                      <Mail
                        size={14}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <Controller
                        name="email"
                        control={control}
                        render={({ field }) => (
                          <Input
                            {...field}
                            type="email"
                            placeholder="user@bluepearls.co.ug"
                            className="h-10 rounded-xl text-sm pl-9"
                            readOnly={
                              !!linkedStaff && !!linkedStaff.officialEmail
                            }
                            style={
                              linkedStaff && linkedStaff.officialEmail
                                ? { background: "#F5F4EF", color: "#64748b" }
                                : {}
                            }
                          />
                        )}
                      />
                    </div>
                    {errors.email && (
                      <p className="text-xs text-red-500">
                        {errors.email.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-700">
                      Role *
                    </Label>
                    <Controller
                      name="role"
                      control={control}
                      render={({ field }) => (
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}>
                          <SelectTrigger className="h-10 rounded-xl text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ALL_ROLES.map((r) => {
                              const roleColor = ROLE_COLORS[r];
                              return (
                                <SelectItem key={r} value={r}>
                                  <div className="flex items-center gap-2">
                                    <div
                                      className="w-4 h-4 rounded flex items-center justify-center"
                                      style={{ background: roleColor.bg }}>
                                      <roleColor.icon
                                        size={10}
                                        style={{ color: roleColor.color }}
                                      />
                                    </div>
                                    <span>{ROLE_LABELS[r]}</span>
                                  </div>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>

                  {/* Placement Section - Only shown for IMPLANT role */}
                  {selectedRole === "IMPLANT" && (
                    <div
                      className="rounded-2xl p-5 mt-2"
                      style={{
                        background: "#F5F4EF",
                        border: `1px solid #e2e8f0`,
                      }}>
                      <p className="text-xs font-semibold mb-3 flex items-center gap-1 text-slate-700">
                        <MapPin size={12} /> Step 2b — Placement Location *
                      </p>

                      {selectedPlacement ? (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                              style={{ background: `${SKY_BLUE}18` }}>
                              <Building2
                                size={16}
                                style={{ color: SKY_BLUE }}
                              />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-900">
                                {selectedPlacement.name}
                              </p>
                              {selectedPlacement.address && (
                                <p className="text-[10px] text-slate-500">
                                  {selectedPlacement.address}
                                </p>
                              )}
                              {selectedPlacement.contactPerson && (
                                <p className="text-[10px] flex items-center gap-1 mt-0.5 text-slate-500">
                                  <UserCircle2 size={8} />{" "}
                                  {selectedPlacement.contactPerson}
                                </p>
                              )}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={handleRemovePlacement}
                            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors hover:bg-red-50 text-red-500">
                            <Trash2 size={12} /> Remove
                          </button>
                        </div>
                      ) : (
                        <div className="relative">
                          {showPlacementPicker ? (
                            <div>
                              <div className="relative mb-2">
                                <Search
                                  size={13}
                                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                />
                                <Input
                                  autoFocus
                                  value={clientSearch}
                                  onChange={(e) =>
                                    setClientSearch(e.target.value)
                                  }
                                  placeholder="Search clients…"
                                  className="pl-9 h-9 rounded-xl text-sm bg-white"
                                />
                              </div>
                              <div
                                className="rounded-xl overflow-hidden max-h-60 overflow-y-auto border"
                                style={{
                                  background: "#fff",
                                  borderColor: "#e2e8f0",
                                }}>
                                {filteredClients.length === 0 ? (
                                  <p className="text-xs text-center py-6 text-slate-500">
                                    No clients found
                                  </p>
                                ) : (
                                  filteredClients.map((client) => (
                                    <button
                                      key={client.id}
                                      type="button"
                                      onClick={() =>
                                        handleSelectPlacement(client)
                                      }
                                      className="w-full flex items-center gap-3 px-4 py-3 transition-colors hover:bg-[#F5F4EF] text-left border-b last:border-0"
                                      style={{ borderColor: "#e2e8f0" }}>
                                      <div
                                        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                                        style={{ background: "#16a34a18" }}>
                                        <Building2
                                          size={12}
                                          style={{ color: "#16a34a" }}
                                        />
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium truncate text-slate-900">
                                          {client.name}
                                        </p>
                                        {client.address && (
                                          <p className="text-[10px] truncate text-slate-500">
                                            {client.address}
                                          </p>
                                        )}
                                        {client.contactPerson && (
                                          <p className="text-[10px] truncate text-slate-500">
                                            Contact: {client.contactPerson}
                                          </p>
                                        )}
                                      </div>
                                    </button>
                                  ))
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => setShowPlacementPicker(false)}
                                className="mt-2 text-xs font-medium text-slate-500">
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setShowPlacementPicker(true)}
                              className="w-full flex items-center gap-2 justify-center h-10 rounded-xl text-sm font-medium transition-colors hover:bg-white border-dashed border-2"
                              style={{
                                color: "#64748b",
                                borderColor: "#e2e8f0",
                              }}>
                              <MapPin size={14} /> Select Client Location
                            </button>
                          )}
                        </div>
                      )}

                      {errors.placementId && (
                        <p className="text-xs text-red-500 mt-2">
                          {errors.placementId.message}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Password Section */}
              <div>
                <p className="text-xs font-semibold mb-3 text-slate-700">
                  Step 3 — Set Password
                </p>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-medium text-slate-700">
                        Password *
                      </Label>
                      <button
                        type="button"
                        onClick={handleAutoGenerate}
                        className="flex items-center gap-1 text-xs font-medium transition-colors"
                        style={{ color: SKY_BLUE }}>
                        <RefreshCw size={11} /> Auto-generate
                      </button>
                    </div>
                    <div className="relative">
                      <Lock
                        size={14}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <Controller
                        name="password"
                        control={control}
                        render={({ field }) => (
                          <Input
                            {...field}
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••••••"
                            className="h-10 rounded-xl text-sm pl-9 pr-10 font-mono"
                          />
                        )}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors text-slate-400"
                        tabIndex={-1}>
                        {showPassword ? (
                          <EyeOff size={14} />
                        ) : (
                          <Eye size={14} />
                        )}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-xs text-red-500">
                        {errors.password.message}
                      </p>
                    )}
                  </div>

                  {/* Send Credentials Toggle */}
                  <Controller
                    name="sendCredentials"
                    control={control}
                    render={({ field }) => (
                      <button
                        type="button"
                        onClick={() => field.onChange(!field.value)}
                        className="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-colors"
                        style={{
                          background: field.value ? "#16a34a12" : "#F5F4EF",
                          border: `1px solid ${field.value ? "#16a34a" : "#e2e8f0"}`,
                        }}>
                        <div className="flex items-center gap-2.5">
                          <Send
                            size={14}
                            style={{
                              color: field.value ? "#16a34a" : "#64748b",
                            }}
                          />
                          <div className="text-left">
                            <p
                              className="text-sm font-medium"
                              style={{
                                color: field.value ? "#2d5a1b" : "#0f172a",
                              }}>
                              Email credentials to user
                            </p>
                            <p className="text-[11px] text-slate-500">
                              {field.value
                                ? "User will receive login details immediately"
                                : "Toggle to send login details via email"}
                            </p>
                          </div>
                        </div>
                        <div
                          className="w-10 h-5 rounded-full relative"
                          style={{
                            background: field.value ? "#16a34a" : "#cbd5e1",
                          }}>
                          <div
                            className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
                            style={{
                              left: field.value ? "calc(100% - 18px)" : "2px",
                            }}
                          />
                        </div>
                      </button>
                    )}
                  />
                </div>
              </div>
            </div>

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
                ) : (
                  "Create Account"
                )}
              </Button>
            </div>
          </form>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

// ── Edit Account Sheet ────────────────────────────────────────────────────────

function EditAccountSheet({
  open,
  onClose,
  account,
  onSave,
  staffOptions,
  clients,
}: {
  open: boolean;
  onClose: () => void;
  account: Account | null;
  onSave: (data: EditAccountFormData, id: number) => Promise<void>;
  staffOptions: StaffOption[];
  clients: Client[];
}) {
  const [isSaving, setIsSaving] = useState(false);
  const [linkedStaff, setLinkedStaff] = useState<StaffOption | null>(null);
  const [staffSearch, setStaffSearch] = useState("");
  const [showStaffPicker, setShowStaffPicker] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [changePassword, setChangePassword] = useState(false);
  const [selectedPlacement, setSelectedPlacement] = useState<Client | null>(
    null,
  );
  const [showPlacementPicker, setShowPlacementPicker] = useState(false);
  const [clientSearch, setClientSearch] = useState("");

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EditAccountFormData>({
    //@ts-ignore - Zod schema has some conditional logic that RHF's type inference can't handle perfectly
    resolver: zodResolver(editAccountSchema) as any,
    defaultValues: {
      name: "",
      email: "",
      role: "DRIVER",
      staffId: null,
      placementId: null,
      password: "",
      sendCredentials: false,
      isActive: true,
    },
  });

  const selectedRole = watch("role");

  // ✅ Fix: Reset form when account changes and properly set all values
  useEffect(() => {
    if (account) {
      // Reset the form with account data
      reset({
        name: account.name,
        email: account.email,
        role: account.role,
        staffId: account.staffId ?? null,
        placementId: account.staffPlacementId ?? null,
        password: "",
        sendCredentials: false,
        isActive: account.isActive ?? true,
      });

      // Find and set linked staff
      if (account.staffId) {
        const found = staffOptions.find((s) => s.id === account.staffId);
        setLinkedStaff(found ?? null);
      } else {
        setLinkedStaff(null);
      }

      // Find and set placement
      if (account.staffPlacementId) {
        const client = clients.find((c) => c.id === account.staffPlacementId);
        setSelectedPlacement(client ?? null);
      } else {
        setSelectedPlacement(null);
      }
    }
  }, [account, staffOptions, clients, reset]); // ✅ Add reset to dependencies

  useEffect(() => {
    // Reset placement when role changes from IMPLANT to something else
    if (selectedRole !== "IMPLANT") {
      setValue("placementId", null);
      setSelectedPlacement(null);
    }
  }, [selectedRole, setValue]);

  function handleClose() {
    reset();
    setChangePassword(false);
    setLinkedStaff(null);
    setSelectedPlacement(null);
    setShowPlacementPicker(false);
    setClientSearch("");
    onClose();
  }

  function handleLinkStaff(s: StaffOption) {
    setLinkedStaff(s);
    setValue("staffId", s.id);

    // ✅ Prefill the role from the staff member
    if (s.role) {
      setValue("role", s.role);
    }

    // ✅ Prefill placement if the staff has one
    if (s.placementId) {
      const client = clients.find((c) => c.id === s.placementId);
      if (client) {
        setSelectedPlacement(client);
        setValue("placementId", client.id);
      }
    } else {
      // If staff has no placement, clear it
      setSelectedPlacement(null);
      setValue("placementId", null);
    }
    setShowStaffPicker(false);
    setStaffSearch("");
  }

  function handleUnlink() {
    setLinkedStaff(null);
    setValue("staffId", null);
    setValue("role", "DRIVER"); // Reset to default
    setValue("placementId", null);
    setSelectedPlacement(null);
  }

  function handleSelectPlacement(client: Client) {
    setSelectedPlacement(client);
    setValue("placementId", client.id);
    setShowPlacementPicker(false);
    setClientSearch("");
  }

  function handleRemovePlacement() {
    setSelectedPlacement(null);
    setValue("placementId", null);
  }

  function handleAutoGenerate() {
    const pwd = generatePassword();
    setValue("password", pwd);
    setShowPassword(true);
    setChangePassword(true);
  }

  async function onSubmit(data: EditAccountFormData) {
    if (!account) return;

    // If role is IMPLANT, ensure placement is included
    if (data.role === "IMPLANT" && !data.placementId) {
      toast.error("Placement is required for Implant role");
      return;
    }

    setIsSaving(true);
    try {
      await onSave(data, account.id);
      handleClose();
    } finally {
      setIsSaving(false);
    }
  }

  const filteredClients = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
      c.address?.toLowerCase().includes(clientSearch.toLowerCase()) ||
      false ||
      c.contactPerson?.toLowerCase().includes(clientSearch.toLowerCase()) ||
      false,
  );

  const filteredStaff = staffOptions.filter((s) =>
    s.name.toLowerCase().includes(staffSearch.toLowerCase()),
  );

  return (
    <Sheet open={open} onOpenChange={(o) => !o && !isSaving && handleClose()}>
      <SheetContent className="w-[600px] sm:max-w-[600px] overflow-y-auto !p-0">
        <div className="sticky top-0 bg-white z-10 px-7 py-5 border-b flex items-center justify-between">
          <div>
            <SheetTitle className="text-xl font-bold text-slate-900">
              Edit Account
            </SheetTitle>
            <SheetDescription className="mt-1 text-sm text-slate-500">
              {account ? `Editing account for ${account.name}.` : ""}
            </SheetDescription>
          </div>
          <SheetClose className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100">
            <X className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </SheetClose>
        </div>

        <ScrollArea className="h-[calc(100vh-120px)] px-7 py-6">
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="space-y-6">
              {/* Link Staff Section */}
              <div
                className="rounded-2xl p-5"
                style={{
                  background: "#F5F4EF",
                  border: `1px solid #e2e8f0`,
                }}>
                <p className="text-xs font-semibold mb-3 text-slate-700">
                  Linked Staff Member
                </p>

                {linkedStaff ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback
                          className="text-white text-sm font-bold"
                          style={{ background: avatarColor(linkedStaff.id) }}>
                          {getInitials(linkedStaff.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {linkedStaff.name}
                        </p>
                        {linkedStaff.role && (
                          <p className="text-[10px] flex items-center gap-1 mt-0.5 text-slate-500">
                            <ShieldCheck size={8} /> Role:{" "}
                            {ROLE_LABELS[linkedStaff.role]}
                          </p>
                        )}
                        {linkedStaff.placementName && (
                          <p className="text-[10px] flex items-center gap-1 text-slate-500">
                            <MapPin size={8} /> Current:{" "}
                            {linkedStaff.placementName}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleUnlink}
                      className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors hover:bg-red-50 text-red-500">
                      <Unlink size={12} /> Unlink
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    {showStaffPicker ? (
                      <div>
                        <div className="relative mb-2">
                          <Search
                            size={13}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                          />
                          <Input
                            autoFocus
                            value={staffSearch}
                            onChange={(e) => setStaffSearch(e.target.value)}
                            placeholder="Search staff by name…"
                            className="pl-9 h-9 rounded-xl text-sm bg-white"
                          />
                        </div>
                        <div
                          className="rounded-xl overflow-hidden max-h-44 overflow-y-auto border"
                          style={{
                            background: "#fff",
                            borderColor: "#e2e8f0",
                          }}>
                          {filteredStaff.length === 0 ? (
                            <p className="text-xs text-center py-6 text-slate-500">
                              No staff found
                            </p>
                          ) : (
                            filteredStaff.map((s) => (
                              <button
                                key={s.id}
                                type="button"
                                onClick={() => handleLinkStaff(s)}
                                className="w-full flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-[#F5F4EF] text-left border-b last:border-0"
                                style={{ borderColor: "#e2e8f0" }}>
                                <Avatar className="w-7 h-7">
                                  <AvatarFallback
                                    className="text-white text-[10px] font-bold"
                                    style={{ background: avatarColor(s.id) }}>
                                    {getInitials(s.name)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-medium truncate text-slate-900">
                                    {s.name}
                                  </p>
                                  <div className="flex items-center gap-2 text-[10px] text-slate-500">
                                    {s.role && (
                                      <span className="flex items-center gap-0.5">
                                        <ShieldCheck size={8} />
                                        {ROLE_LABELS[s.role]}
                                      </span>
                                    )}
                                    {s.placementName && (
                                      <span className="flex items-center gap-0.5">
                                        <MapPin size={8} />
                                        {s.placementName}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </button>
                            ))
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowStaffPicker(false)}
                          className="mt-2 text-xs font-medium text-slate-500">
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowStaffPicker(true)}
                        className="w-full flex items-center gap-2 justify-center h-10 rounded-xl text-sm font-medium transition-colors hover:bg-white border-dashed border-2"
                        style={{
                          color: "#64748b",
                          borderColor: "#e2e8f0",
                        }}>
                        <Link2 size={14} /> Link a Staff Member
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Account Details */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700">
                    Full Name *
                  </Label>
                  <Controller
                    name="name"
                    control={control}
                    render={({ field }) => (
                      <Input {...field} className="h-10 rounded-xl text-sm" />
                    )}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700">
                    Email Address *
                  </Label>
                  <Controller
                    name="email"
                    control={control}
                    render={({ field }) => (
                      <Input {...field} className="h-10 rounded-xl text-sm" />
                    )}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700">
                    Role *
                  </Label>
                  <Controller
                    name="role"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}>
                        <SelectTrigger className="h-10 rounded-xl text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ALL_ROLES.map((r) => (
                            <SelectItem key={r} value={r}>
                              {ROLE_LABELS[r]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                {/* Placement Section - Only shown for IMPLANT role */}
                {selectedRole === "IMPLANT" && (
                  <div
                    className="rounded-2xl p-5 mt-2"
                    style={{
                      background: "#F5F4EF",
                      border: `1px solid #e2e8f0`,
                    }}>
                    <p className="text-xs font-semibold mb-3 flex items-center gap-1 text-slate-700">
                      <MapPin size={12} /> Placement Location *
                    </p>

                    {selectedPlacement ? (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background: `${SKY_BLUE}18` }}>
                            <Building2 size={16} style={{ color: SKY_BLUE }} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-900">
                              {selectedPlacement.name}
                            </p>
                            {selectedPlacement.address && (
                              <p className="text-[10px] text-slate-500">
                                {selectedPlacement.address}
                              </p>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemovePlacement}
                          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors hover:bg-red-50 text-red-500">
                          <Trash2 size={12} /> Remove
                        </button>
                      </div>
                    ) : (
                      <div className="relative">
                        {showPlacementPicker ? (
                          <div>
                            <div className="relative mb-2">
                              <Search
                                size={13}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                              />
                              <Input
                                autoFocus
                                value={clientSearch}
                                onChange={(e) =>
                                  setClientSearch(e.target.value)
                                }
                                placeholder="Search clients…"
                                className="pl-9 h-9 rounded-xl text-sm bg-white"
                              />
                            </div>
                            <div
                              className="rounded-xl overflow-hidden max-h-60 overflow-y-auto border"
                              style={{
                                background: "#fff",
                                borderColor: "#e2e8f0",
                              }}>
                              {filteredClients.length === 0 ? (
                                <p className="text-xs text-center py-6 text-slate-500">
                                  No clients found
                                </p>
                              ) : (
                                filteredClients.map((client) => (
                                  <button
                                    key={client.id}
                                    type="button"
                                    onClick={() =>
                                      handleSelectPlacement(client)
                                    }
                                    className="w-full flex items-center gap-3 px-4 py-3 transition-colors hover:bg-[#F5F4EF] text-left border-b last:border-0"
                                    style={{ borderColor: "#e2e8f0" }}>
                                    <div
                                      className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                                      style={{ background: "#16a34a18" }}>
                                      <Building2
                                        size={12}
                                        style={{ color: "#16a34a" }}
                                      />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <p className="text-sm font-medium truncate text-slate-900">
                                        {client.name}
                                      </p>
                                      {client.address && (
                                        <p className="text-[10px] truncate text-slate-500">
                                          {client.address}
                                        </p>
                                      )}
                                    </div>
                                  </button>
                                ))
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => setShowPlacementPicker(false)}
                              className="mt-2 text-xs font-medium text-slate-500">
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setShowPlacementPicker(true)}
                            className="w-full flex items-center gap-2 justify-center h-10 rounded-xl text-sm font-medium transition-colors hover:bg-white border-dashed border-2"
                            style={{
                              color: "#64748b",
                              borderColor: "#e2e8f0",
                            }}>
                            <MapPin size={14} /> Select Client Location
                          </button>
                        )}
                      </div>
                    )}

                    {errors.placementId && (
                      <p className="text-xs text-red-500 mt-2">
                        {errors.placementId.message}
                      </p>
                    )}
                  </div>
                )}

                {/* Active Status Toggle */}
                <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50">
                  <Controller
                    name="isActive"
                    control={control}
                    render={({ field }) => (
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={(e) => field.onChange(e.target.checked)}
                          className="w-4 h-4 rounded border-slate-300"
                          style={{ accentColor: SKY_BLUE }}
                        />
                        <span className="text-sm font-medium text-slate-700">
                          Account is active
                        </span>
                      </label>
                    )}
                  />
                </div>
              </div>

              {/* Password Change */}
              <div className="pt-2 space-y-3">
                <button
                  type="button"
                  onClick={() => setChangePassword(!changePassword)}
                  className="flex items-center gap-2 text-sm font-medium"
                  style={{ color: SKY_BLUE }}>
                  <Key size={14} />{" "}
                  {changePassword
                    ? "Cancel Password Change"
                    : "Change Password"}
                </button>

                {changePassword && (
                  <>
                    <div className="relative animate-in fade-in slide-in-from-top-2">
                      <div className="flex items-center justify-between mb-1">
                        <Label className="text-xs font-medium text-slate-700">
                          New Password
                        </Label>
                        <button
                          type="button"
                          onClick={handleAutoGenerate}
                          className="flex items-center gap-1 text-xs font-medium transition-colors"
                          style={{ color: SKY_BLUE }}>
                          <RefreshCw size={11} /> Auto-generate
                        </button>
                      </div>
                      <Controller
                        name="password"
                        control={control}
                        render={({ field }) => (
                          <Input
                            {...field}
                            type={showPassword ? "text" : "password"}
                            className="h-10 rounded-xl pr-10 text-sm"
                            placeholder="Enter new password"
                          />
                        )}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 bottom-3 text-slate-400">
                        {showPassword ? (
                          <EyeOff size={14} />
                        ) : (
                          <Eye size={14} />
                        )}
                      </button>
                    </div>

                    {/* Send Credentials Toggle for password change */}
                    <Controller
                      name="sendCredentials"
                      control={control}
                      render={({ field }) => (
                        <button
                          type="button"
                          onClick={() => field.onChange(!field.value)}
                          className="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-colors"
                          style={{
                            background: field.value ? "#16a34a12" : "#F5F4EF",
                            border: `1px solid ${field.value ? "#16a34a" : "#e2e8f0"}`,
                          }}>
                          <div className="flex items-center gap-2.5">
                            <Send
                              size={14}
                              style={{
                                color: field.value ? "#16a34a" : "#64748b",
                              }}
                            />
                            <div className="text-left">
                              <p
                                className="text-sm font-medium"
                                style={{
                                  color: field.value ? "#2d5a1b" : "#0f172a",
                                }}>
                                Email new password to user
                              </p>
                              <p className="text-[11px] text-slate-500">
                                {field.value
                                  ? "User will receive the new password via email"
                                  : "Toggle to send new password via email"}
                              </p>
                            </div>
                          </div>
                          <div
                            className="w-10 h-5 rounded-full relative"
                            style={{
                              background: field.value ? "#16a34a" : "#cbd5e1",
                            }}>
                            <div
                              className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
                              style={{
                                left: field.value ? "calc(100% - 18px)" : "2px",
                              }}
                            />
                          </div>
                        </button>
                      )}
                    />
                  </>
                )}
              </div>
            </div>

            <div className="sticky bottom-0 bg-white pt-6 mt-6 border-t flex gap-3">
              <Button
                type="button"
                variant="outline"
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
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </form>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
// ── Delete Dialog ─────────────────────────────────────────────────────────────

function DeleteDialog({
  open,
  onClose,
  account,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  account: Account | null;
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
            Delete Account
          </DialogTitle>
          <DialogDescription className="text-slate-500">
            Are you sure you want to delete the account for{" "}
            <strong className="text-slate-900">{account?.name}</strong>? This
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
              "Delete Account"
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

// ── Accounts Page ─────────────────────────────────────────────────────────────

export default function Accounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [staffOptions, setStaffOptions] = useState<StaffOption[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<Role | "ALL">("ALL");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [createOpen, setCreateOpen] = useState(false);
  const [editAccount, setEditAccount] = useState<Account | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Account | null>(null);
  const [viewingAccount, setViewingAccount] = useState<Account | null>(null);

  const fetchAccounts = useCallback(async () => {
    setIsLoading(true);
    const headers = {
      Authorization: `Bearer ${localStorage.getItem("bp_token")}`,
    };
    try {
      const [uRes, sRes, cRes] = await Promise.all([
        fetch(`${API_URL}/users`, { headers }),
        fetch(`${API_URL}/staff`, { headers }),
        fetch(`${API_URL}/clients`, { headers }),
      ]);

      if (sRes.ok) {
        const staff = await sRes.json();
        setStaffOptions(staff);
      }

      if (cRes.ok) {
        const clientsData = await cRes.json();
        setClients(clientsData);
      }

      if (uRes.ok) {
        const users = await uRes.json();
        setAccounts(users);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const handleSort = (key: SortKey) => {
    if (key === sortKey) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  async function handleCreate(data: AccountFormData) {
    try {
      // First create the user account
      const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("bp_token")}`,
        },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
          role: data.role,
          staffId: data.staffId,
          sendEmail: data.sendCredentials,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create account");
      }

      // If this is an IMPLANT with placement, update the staff record using the dedicated endpoint
      if (data.role === "IMPLANT" && data.placementId && data.staffId) {
        const placementRes = await fetch(
          `${API_URL}/staff/${data.staffId}/placement`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("bp_token")}`,
            },
            body: JSON.stringify({ placementId: data.placementId }),
          },
        );

        if (!placementRes.ok) {
          const errText = await placementRes.text();
          console.warn(
            "Account created but placement not saved to staff:",
            errText,
          );
          toast.warning("Account created but placement could not be saved");
        }
      }

      toast.success(
        data.sendCredentials
          ? "Account created and credentials emailed successfully"
          : "Account created successfully",
      );

      fetchAccounts();
    } catch (error: any) {
      toast.error(error.message || "Failed to create account");
    }
  }

  async function handleEdit(data: EditAccountFormData, id: number) {
    try {
      // Update user account
      const res = await fetch(`${API_URL}/users/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("bp_token")}`,
        },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          role: data.role,
          staffId: data.staffId,
          ...(data.password ? { password: data.password } : {}),
          sendEmail: data.sendCredentials,
          isActive: data.isActive,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update account");
      }

      // If this is an IMPLANT with staffId, update the placement
      if (data.role === "IMPLANT" && data.staffId) {
        const placementRes = await fetch(
          `${API_URL}/staff/${data.staffId}/placement`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("bp_token")}`,
            },
            body: JSON.stringify({ placementId: data.placementId || null }),
          },
        );

        if (!placementRes.ok) {
          const errText = await placementRes.text();
          console.warn(
            "Account updated but placement not saved to staff:",
            errText,
          );
          toast.warning("Account updated but placement could not be saved");
        }
      } else if (data.staffId) {
        // If role changed from IMPLANT, clear placement from staff
        await fetch(`${API_URL}/staff/${data.staffId}/placement`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("bp_token")}`,
          },
          body: JSON.stringify({ placementId: null }),
        });
      }

      // Show appropriate success message
      if (data.sendCredentials && data.password) {
        toast.success("Account updated and new password emailed successfully");
      } else {
        toast.success("Account updated successfully");
      }

      fetchAccounts();
    } catch (error: any) {
      toast.error(error.message || "Failed to update account");
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;

    try {
      const res = await fetch(`${API_URL}/users/${deleteTarget.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("bp_token")}`,
        },
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete account");
      }

      toast.success("Account deleted successfully");
      fetchAccounts();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete account");
    }
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    let list = accounts.filter(
      (a) =>
        (a.name.toLowerCase().includes(q) ||
          a.email.toLowerCase().includes(q) ||
          a.placementName?.toLowerCase().includes(q) ||
          false) &&
        (roleFilter === "ALL" || a.role === roleFilter),
    );

    return list.sort((a, b) => {
      let va: any;
      let vb: any;

      if (sortKey === "placement") {
        va = a.placementName || "";
        vb = b.placementName || "";
      } else if (sortKey === "lastLogin") {
        va = a.lastLogin || "";
        vb = b.lastLogin || "";
      } else {
        va = (a as any)[sortKey];
        vb = (b as any)[sortKey];
      }

      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [accounts, search, roleFilter, sortKey, sortDir]);

  const stats = {
    total: accounts.length,
    admins: accounts.filter((a) => ["SUPER_ADMIN", "MANAGER"].includes(a.role))
      .length,
    linked: accounts.filter((a) => !!a.staffId).length,
    active: accounts.filter((a) => a.isActive).length,
  };

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
            Accounts
          </h2>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-semibold text-white"
          style={{ background: SKY_BLUE }}
          onMouseOver={(e) => (e.currentTarget.style.background = "#0591c0")}
          onMouseOut={(e) => (e.currentTarget.style.background = SKY_BLUE)}>
          <Plus size={15} /> New Account
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-5">
        <StatCard
          label="Total Accounts"
          value={stats.total}
          icon={UserCircle2}
          color={SKY_BLUE}
          bg={`${SKY_BLUE}18`}
        />
        <StatCard
          label="Admins & Managers"
          value={stats.admins}
          icon={ShieldCheck}
          color="#7A80F0"
          bg="#7A80F018"
        />
        <StatCard
          label="Linked to Staff"
          value={stats.linked}
          icon={Link2}
          color="#16a34a"
          bg="#16a34a18"
        />
        <StatCard
          label="Active"
          value={stats.active}
          icon={CheckCircle2}
          color="#16a34a"
          bg="#16a34a18"
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
            placeholder="Search by name, email, placement…"
            className="pl-9 h-9 rounded-xl text-sm border-0 bg-[#F5F4EF]"
          />
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <Filter size={13} className="text-slate-500" />
          <Select
            value={roleFilter}
            onValueChange={(v) => setRoleFilter(v as any)}>
            <SelectTrigger className="h-9 rounded-xl text-xs w-44 border-0 bg-[#F5F4EF]">
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Roles</SelectItem>
              {ALL_ROLES.map((r) => (
                <SelectItem key={r} value={r}>
                  {ROLE_LABELS[r]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-2xl overflow-hidden min-h-[400px] bg-white border border-slate-200">
        <div
          className="grid px-5 py-3 bg-[#FAFAF8] border-b border-slate-200"
          style={{
            gridTemplateColumns: "2fr 1.8fr 1.2fr 1.5fr 1fr 1fr 52px",
          }}>
          <SortHeader
            label="Account"
            sortKey="name"
            current={sortKey}
            dir={sortDir}
            onSort={handleSort}
          />
          <SortHeader
            label="Email"
            sortKey="email"
            current={sortKey}
            dir={sortDir}
            onSort={handleSort}
          />
          <SortHeader
            label="Role"
            sortKey="role"
            current={sortKey}
            dir={sortDir}
            onSort={handleSort}
          />
          <SortHeader
            label="Placement"
            sortKey="placement"
            current={sortKey}
            dir={sortDir}
            onSort={handleSort}
          />
          <SortHeader
            label="Last Login"
            sortKey="lastLogin"
            current={sortKey}
            dir={sortDir}
            onSort={handleSort}
          />
          <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
            Status
          </span>
          <span />
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-3">
            <Loader2
              className="w-8 h-8 animate-spin"
              style={{ color: SKY_BLUE }}
            />
            <p className="text-sm font-medium text-slate-500">
              Loading accounts…
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
            <UserCircle2 size={28} className="text-slate-300 mb-4" />
            <h3 className="text-base font-bold mb-1 text-slate-900">
              No Accounts Found
            </h3>
            <p className="text-sm max-w-[280px] mb-6 text-slate-500">
              No user accounts found. Adjust filters or create a new one.
            </p>
            <Button
              onClick={() => setCreateOpen(true)}
              variant="outline"
              className="rounded-xl h-9 px-5"
              style={{ borderColor: SKY_BLUE, color: SKY_BLUE }}>
              <Plus size={14} className="mr-2" /> New Account
            </Button>
          </div>
        ) : (
          filtered.map((a, i) => {
            const roleStyle = ROLE_COLORS[a.role];
            const RoleIcon = roleStyle.icon;
            return (
              <div
                key={a.id}
                onClick={() => setViewingAccount(a)}
                className="grid items-center px-5 py-3.5 transition-colors hover:bg-[#F5F4EF] cursor-pointer"
                style={{
                  gridTemplateColumns: "2fr 1.8fr 1.2fr 1.5fr 1fr 1fr 52px",
                  borderBottom:
                    i < filtered.length - 1 ? "1px solid #e2e8f0" : "none",
                }}>
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarImage src={a.avatarUrl || ""} />
                    <AvatarFallback
                      className="text-xs font-bold text-white"
                      style={{ background: avatarColor(a.id) }}>
                      {getInitials(a.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate text-slate-900">
                      {a.name}
                    </p>
                    {a.staffName && (
                      <p className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Link2 size={9} />
                        {a.staffName}
                      </p>
                    )}
                  </div>
                </div>
                <p className="text-xs truncate text-slate-900">{a.email}</p>
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-5 h-5 rounded flex items-center justify-center"
                    style={{ background: roleStyle.bg }}>
                    <RoleIcon size={10} style={{ color: roleStyle.color }} />
                  </div>
                  <span className="text-xs" style={{ color: roleStyle.color }}>
                    {ROLE_LABELS[a.role]}
                  </span>
                </div>
                <div className="min-w-0">
                  {a.staffPlacementId ? (
                    <div className="flex items-start gap-1.5">
                      <MapPin
                        size={12}
                        className="flex-shrink-0 mt-0.5 text-slate-400"
                      />
                      <div>
                        <p className="text-xs font-medium text-slate-900">
                          {a.placementName}
                        </p>
                        {a.placementAddress && (
                          <p className="text-[10px] text-slate-500">
                            {a.placementAddress}
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">—</p>
                  )}
                </div>
                <p className="text-xs text-slate-500">
                  {a.lastLogin ? formatDate(a.lastLogin) : "Never"}
                </p>
                <div>
                  <Badge
                    className="text-[10px]"
                    style={{
                      background: a.isActive ? "#16a34a18" : "#ef444418",
                      color: a.isActive ? "#16a34a" : "#ef4444",
                    }}>
                    {a.isActive ? "Active" : "Inactive"}
                  </Badge>
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
                        onClick={() => setViewingAccount(a)}
                        className="text-xs cursor-pointer">
                        <Eye size={13} className="mr-2" /> View
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setEditAccount(a)}
                        className="text-xs cursor-pointer">
                        <Pencil size={13} className="mr-2" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setDeleteTarget(a)}
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

      <CreateAccountSheet
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSave={handleCreate}
        staffOptions={staffOptions}
        clients={clients}
      />
      <EditAccountSheet
        open={!!editAccount}
        onClose={() => setEditAccount(null)}
        account={editAccount}
        onSave={handleEdit}
        staffOptions={staffOptions}
        clients={clients}
      />
      <AccountDetailModal
        open={!!viewingAccount}
        onClose={() => setViewingAccount(null)}
        account={viewingAccount}
      />
      <DeleteDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        account={deleteTarget}
        onConfirm={handleDelete}
      />
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color, bg }: any) {
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
