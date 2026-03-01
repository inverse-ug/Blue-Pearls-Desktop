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
  Loader2,
  Contact,
  Building2,
  Phone,
  Mail,
  MapPin,
  FileText,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  User,
  Calendar,
  Briefcase,
  Eye,
  X,
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
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

// ── Config ────────────────────────────────────────────────────────────────────
const API_URL = "https://blue-pearls-server.vercel.app";
const SKY_BLUE = "#06a3d8";

// ── Types ─────────────────────────────────────────────────────────────────────
export interface Client {
  id: number;
  name: string;
  contactPerson?: string | null;
  email?: string | null;
  phone: string;
  address?: string | null;
  tinNumber?: string | null;
  creditLimit?: number | null;
  isActive: boolean;
  createdAt: string;
  totalJobs?: number;
  totalRevenue?: number;
}

export interface JobSummary {
  id: number;
  status: string;
  income?: number | null;
  createdAt: string;
}

type SortKey = "name" | "phone" | "createdAt" | "totalJobs";
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

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatCurrency(amount: number | null | undefined) {
  if (!amount) return "UGX 0";
  return new Intl.NumberFormat("en-UG", {
    style: "currency",
    currency: "UGX",
    minimumFractionDigits: 0,
  }).format(amount);
}

// ── Schema ────────────────────────────────────────────────────────────────────
const clientSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  contactPerson: z.string().optional().nullable(),
  email: z.string().email("Enter a valid email").optional().nullable(),
  phone: z.string().min(7, "Phone number is required"),
  address: z.string().optional().nullable(),
  tinNumber: z.string().optional().nullable(),
  creditLimit: z.coerce.number().positive().optional().nullable(),
  isActive: z.boolean().default(true),
});

type ClientFormData = z.infer<typeof clientSchema>;

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

// ── Field Row ─────────────────────────────────────────────────────────────────
function FieldRow({
  label,
  icon: Icon,
  children,
  error,
  required,
  hint,
}: {
  label: string;
  icon?: React.ElementType;
  children: React.ReactNode;
  error?: string;
  required?: boolean;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline gap-1.5">
        <Label className="text-xs font-medium text-slate-700">
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
        {hint && <span className="text-[10px] text-slate-400">{hint}</span>}
      </div>
      <div className="relative">
        {Icon && (
          <Icon
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-10 pointer-events-none text-slate-500"
          />
        )}
        {children}
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

// ── Client Detail Modal ───────────────────────────────────────────────────────
function ClientDetailModal({
  open,
  onClose,
  client,
  jobs,
}: {
  open: boolean;
  onClose: () => void;
  client: Client | null;
  jobs?: JobSummary[];
}) {
  if (!client) return null;

  const clientJobs = jobs?.filter(() => true) || [];
  const totalRevenue = clientJobs.reduce((sum, j) => sum + (j.income || 0), 0);
  const activeJobs = clientJobs.filter(
    (j) => j.status === "Ongoing" || j.status === "Scheduled",
  ).length;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        <div className="sticky top-0 bg-white z-10 px-6 py-4 border-b flex items-center justify-between">
          <DialogTitle className="text-xl font-bold flex items-center gap-2 text-slate-900">
            <span>{client.name}</span>
            {!client.isActive && (
              <Badge variant="destructive" className="text-xs">
                Inactive
              </Badge>
            )}
          </DialogTitle>
          <DialogClose className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100">
            <X className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </div>

        <div className="p-6">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { label: "Total Jobs", value: clientJobs.length },
              { label: "Active Jobs", value: activeJobs },
              { label: "Total Revenue", value: formatCurrency(totalRevenue) },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="p-4 rounded-xl border border-slate-200 bg-white">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  {label}
                </p>
                <p className="text-2xl font-bold text-slate-900">{value}</p>
              </div>
            ))}
          </div>

          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid grid-cols-2 w-full mb-6">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="jobs">Recent Jobs</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                {/* Company info */}
                <div>
                  <h3 className="text-sm font-semibold mb-3 text-slate-900">
                    Company Information
                  </h3>
                  <div className="space-y-3">
                    <InfoItem
                      icon={Building2}
                      label="Company Name"
                      value={client.name}
                    />
                    <InfoItem
                      icon={FileText}
                      label="TIN Number"
                      value={client.tinNumber}
                    />
                    <InfoItem
                      icon={Calendar}
                      label="Client Since"
                      value={formatDate(client.createdAt)}
                    />
                    <InfoItem
                      icon={Briefcase}
                      label="Status"
                      badge={
                        <Badge
                          className="text-xs"
                          style={{
                            background: client.isActive
                              ? "#16a34a18"
                              : "#ef444418",
                            color: client.isActive ? "#16a34a" : "#ef4444",
                          }}>
                          {client.isActive ? "Active" : "Inactive"}
                        </Badge>
                      }
                    />
                  </div>
                </div>

                {/* Contact info */}
                <div>
                  <h3 className="text-sm font-semibold mb-3 text-slate-900">
                    Contact Information
                  </h3>
                  <div className="space-y-3">
                    <InfoItem
                      icon={User}
                      label="Contact Person"
                      value={client.contactPerson}
                    />
                    <InfoItem icon={Phone} label="Phone" value={client.phone} />
                    <InfoItem icon={Mail} label="Email" value={client.email} />
                    {/* Address is the company/business address, not the contact person's */}
                    <InfoItem
                      icon={MapPin}
                      label="Company Address"
                      value={client.address}
                    />
                  </div>
                </div>
              </div>

              {client.creditLimit && (
                <>
                  <Separator className="my-4" />
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">
                      Credit Limit
                    </span>
                    <span className="text-lg font-bold text-slate-900">
                      {formatCurrency(client.creditLimit)}
                    </span>
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="jobs">
              {clientJobs.length > 0 ? (
                <ScrollArea className="h-[300px]">
                  <div className="space-y-2">
                    {clientJobs.slice(0, 10).map((job) => (
                      <div
                        key={job.id}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            Job #{String(job.id).padStart(4, "0")}
                          </p>
                          <p className="text-xs text-slate-500">
                            {formatDate(job.createdAt)}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="text-xs">
                            {job.status}
                          </Badge>
                          <span className="text-sm font-semibold text-slate-900">
                            {formatCurrency(job.income)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <Briefcase
                    size={32}
                    className="mx-auto mb-3 text-slate-300"
                  />
                  <p>No jobs found for this client.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function InfoItem({ icon: Icon, label, value, badge }: any) {
  if (!value && !badge) return null;
  return (
    <div className="flex items-start gap-2">
      <Icon size={14} className="text-slate-400 mt-0.5" />
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          {label}
        </p>
        {badge ? badge : <p className="text-sm text-slate-900">{value}</p>}
      </div>
    </div>
  );
}

// ── Client Sheet ──────────────────────────────────────────────────────────────
function ClientSheet({
  open,
  onClose,
  editing,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  editing: Client | null;
  onSave: (data: ClientFormData, id?: number) => Promise<void>;
}) {
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");

  const blankValues: ClientFormData = {
    name: "",
    contactPerson: "",
    email: "",
    phone: "",
    address: "",
    tinNumber: "",
    creditLimit: null,
    isActive: true,
  };

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ClientFormData>({
    //@ts-ignore - Zod schema has some conditional logic that RHF's type inference can't handle perfectly
    resolver: zodResolver(clientSchema) as any,
    defaultValues: blankValues,
  });

  // ── KEY FIX: reset whenever the sheet opens or the editing target changes
  useEffect(() => {
    if (open) {
      setActiveTab("basic");
      if (editing) {
        reset({
          name: editing.name,
          contactPerson: editing.contactPerson ?? "",
          email: editing.email ?? "",
          phone: editing.phone,
          address: editing.address ?? "",
          tinNumber: editing.tinNumber ?? "",
          creditLimit: editing.creditLimit ?? null,
          isActive: editing.isActive ?? true,
        });
      } else {
        reset(blankValues);
      }
    }
  }, [open, editing?.id]);

  function handleClose() {
    if (isSaving) return;
    reset(blankValues);
    onClose();
  }

  async function onSubmit(data: ClientFormData) {
    setIsSaving(true);
    try {
      await onSave(data, editing?.id);
      handleClose();
    } catch {
      // Error handled in parent
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={(o) => !o && !isSaving && handleClose()}>
      <SheetContent className="w-[500px] sm:max-w-[500px] overflow-y-auto !p-0">
        {/* Header — shadcn renders its own X, no custom one needed */}
        <div className="sticky top-0 bg-white z-10 px-7 py-5 border-b">
          <SheetTitle className="text-xl font-bold text-slate-900">
            {editing ? "Edit Client" : "Add New Client"}
          </SheetTitle>
          <SheetDescription className="mt-1 text-sm text-slate-500">
            {editing
              ? `Editing ${editing.name}`
              : "Fill in the details to add a new client."}
          </SheetDescription>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="p-7">
          <TabsList className="grid grid-cols-2 w-full mb-6">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="details">Additional Details</TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <TabsContent value="basic" className="space-y-4">
              <FieldRow
                label="Company / Client Name"
                icon={Building2}
                error={errors.name?.message}
                required>
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      placeholder="e.g. Acacia Logistics Ltd"
                      className="h-10 rounded-xl text-sm pl-9"
                    />
                  )}
                />
              </FieldRow>

              <FieldRow
                label="Contact Person"
                icon={User}
                error={errors.contactPerson?.message}>
                <Controller
                  name="contactPerson"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      placeholder="e.g. John Ssemwanga"
                      className="h-10 rounded-xl text-sm pl-9"
                    />
                  )}
                />
              </FieldRow>

              <div className="grid grid-cols-2 gap-3">
                <FieldRow
                  label="Phone"
                  icon={Phone}
                  error={errors.phone?.message}
                  required>
                  <Controller
                    name="phone"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        value={field.value ?? ""}
                        placeholder="+256 7xx xxx xxx"
                        className="h-10 rounded-xl text-sm pl-9"
                      />
                    )}
                  />
                </FieldRow>
                <FieldRow
                  label="Email"
                  icon={Mail}
                  error={errors.email?.message}>
                  <Controller
                    name="email"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        value={field.value ?? ""}
                        type="email"
                        placeholder="billing@client.com"
                        className="h-10 rounded-xl text-sm pl-9"
                      />
                    )}
                  />
                </FieldRow>
              </div>

              {/* Company address — explicitly labelled to avoid confusion with contact person's address */}
              <FieldRow
                label="Company Address"
                icon={MapPin}
                error={errors.address?.message}
                hint="(business premises, not the contact person's address)">
                <Controller
                  name="address"
                  control={control}
                  render={({ field }) => (
                    <Textarea
                      {...field}
                      value={field.value ?? ""}
                      placeholder="e.g. Plot 14, Kampala Road"
                      className="rounded-xl text-sm min-h-[80px] pl-9 pt-2"
                    />
                  )}
                />
              </FieldRow>
            </TabsContent>

            <TabsContent value="details" className="space-y-4">
              <FieldRow
                label="TIN Number"
                icon={FileText}
                error={errors.tinNumber?.message}>
                <Controller
                  name="tinNumber"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      placeholder="e.g. 1234567890"
                      className="h-10 rounded-xl text-sm pl-9"
                    />
                  )}
                />
              </FieldRow>

              <FieldRow
                label="Credit Limit (UGX)"
                icon={Briefcase}
                error={errors.creditLimit?.message}>
                <Controller
                  name="creditLimit"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      type="number"
                      step="1"
                      placeholder="e.g. 10000000"
                      className="h-10 rounded-xl text-sm pl-9"
                      onChange={(e) =>
                        field.onChange(
                          e.target.value ? parseFloat(e.target.value) : null,
                        )
                      }
                    />
                  )}
                />
              </FieldRow>

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
                        Client is active
                      </span>
                    </label>
                  )}
                />
              </div>
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
                  "Add Client"
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
  client,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  client: Client | null;
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
            Remove Client
          </DialogTitle>
          <DialogDescription className="text-slate-500">
            Are you sure you want to remove{" "}
            <strong className="text-slate-900">{client?.name}</strong>? This
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

// ── Clients Page ──────────────────────────────────────────────────────────────
export default function Clients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [jobs, setJobs] = useState<JobSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null);
  const [viewingClient, setViewingClient] = useState<Client | null>(null);

  const authHeader = {
    Authorization: `Bearer ${localStorage.getItem("bp_token")}`,
    "Content-Type": "application/json",
  };

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [clientsRes, jobsRes] = await Promise.all([
        fetch(`${API_URL}/clients`, { headers: authHeader }),
        fetch(`${API_URL}/jobs`, { headers: authHeader }),
      ]);
      if (clientsRes.ok) setClients(await clientsRes.json());
      else toast.error("Failed to load clients");
      if (jobsRes.ok) {
        const jobsData = await jobsRes.json();
        setJobs(
          jobsData.map((j: any) => ({
            id: j.id,
            status: j.status,
            income: j.income,
            createdAt: j.createdAt,
          })),
        );
      }
    } catch {
      toast.error("Network error while fetching data");
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
    const list = clients
      .filter(
        (c) =>
          !q ||
          c.name.toLowerCase().includes(q) ||
          (c.contactPerson ?? "").toLowerCase().includes(q) ||
          (c.email ?? "").toLowerCase().includes(q) ||
          c.phone.includes(q) ||
          (c.tinNumber ?? "").includes(q),
      )
      .map((client) => ({
        ...client,
        totalJobs: jobs.filter((j) => (j as any).clientId === client.id).length,
        totalRevenue: jobs
          .filter((j) => (j as any).clientId === client.id)
          .reduce((sum, j) => sum + (j.income || 0), 0),
      }));

    list.sort((a, b) => {
      if (sortKey === "totalJobs") {
        return sortDir === "asc"
          ? (a.totalJobs || 0) - (b.totalJobs || 0)
          : (b.totalJobs || 0) - (a.totalJobs || 0);
      }
      const va =
        sortKey === "createdAt"
          ? a.createdAt
          : sortKey === "phone"
            ? a.phone
            : a.name;
      const vb =
        sortKey === "createdAt"
          ? b.createdAt
          : sortKey === "phone"
            ? b.phone
            : b.name;
      return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
    });

    return list;
  }, [clients, jobs, search, sortKey, sortDir]);

  async function handleSave(data: ClientFormData, id?: number) {
    const method = id !== undefined ? "PATCH" : "POST";
    const url =
      id !== undefined ? `${API_URL}/clients/${id}` : `${API_URL}/clients`;
    try {
      const res = await fetch(url, {
        method,
        headers: authHeader,
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (res.ok) {
        toast.success(id ? "Client updated" : "Client added");
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
    const res = await fetch(`${API_URL}/clients/${deleteTarget.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${localStorage.getItem("bp_token")}` },
    });
    if (res.ok) {
      toast.success("Client removed");
      fetchData();
    } else toast.error("Failed to remove client");
  }

  const stats = {
    total: clients.length,
    active: clients.filter((c) => c.isActive).length,
    withTin: clients.filter((c) => !!c.tinNumber).length,
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
            Clients
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
          <Plus size={15} /> Add Client
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <StatCard
          label="Total Clients"
          value={stats.total}
          icon={Contact}
          color={SKY_BLUE}
          bg={`${SKY_BLUE}18`}
        />
        <StatCard
          label="Active"
          value={stats.active}
          icon={Briefcase}
          color="#16a34a"
          bg="#16a34a18"
        />
        <StatCard
          label="With TIN"
          value={stats.withTin}
          icon={FileText}
          color="#8b5cf6"
          bg="#8b5cf618"
        />
      </div>

      {/* Filter bar */}
      <div className="rounded-2xl p-4 mb-4 flex items-center gap-3 bg-white border border-slate-200">
        <div className="relative flex-1 max-w-sm">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, contact, email, TIN…"
            className="pl-9 h-9 rounded-xl text-sm border-0 bg-[#F5F4EF]"
          />
        </div>
        <p className="text-xs ml-auto text-slate-500">
          {filtered.length} {filtered.length === 1 ? "client" : "clients"}
        </p>
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden min-h-[400px] bg-white border border-slate-200">
        <div
          className="grid px-5 py-3 bg-[#FAFAF8] border-b border-slate-200"
          style={{ gridTemplateColumns: "2fr 1.6fr 1.6fr 1fr 1fr 52px" }}>
          <SortHeader
            label="Client"
            sortKey="name"
            current={sortKey}
            dir={sortDir}
            onSort={handleSort}
          />
          <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
            Contact
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
            Email
          </span>
          <SortHeader
            label="Jobs"
            sortKey="totalJobs"
            current={sortKey}
            dir={sortDir}
            onSort={handleSort}
          />
          <SortHeader
            label="Since"
            sortKey="createdAt"
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
            <p className="text-sm font-medium text-slate-500">
              Loading clients…
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
            <div className="w-16 h-16 rounded-full bg-[#F5F4EF] flex items-center justify-center mb-4">
              <Contact size={28} className="text-slate-400" />
            </div>
            <h3 className="text-base font-bold mb-1 text-slate-900">
              No Clients Found
            </h3>
            <p className="text-sm max-w-[280px] leading-relaxed mb-6 text-slate-500">
              {search
                ? "No results match your search."
                : "No clients yet. Add your first client to get started."}
            </p>
            {!search && (
              <Button
                onClick={() => setSheetOpen(true)}
                variant="outline"
                className="rounded-xl h-9 px-5"
                style={{ borderColor: SKY_BLUE, color: SKY_BLUE }}>
                <Plus size={14} className="mr-2" /> Add Client
              </Button>
            )}
          </div>
        ) : (
          filtered.map((c, i) => (
            <div
              key={c.id}
              onClick={() => setViewingClient(c)}
              className="grid items-center px-5 py-3.5 transition-colors hover:bg-[#F5F4EF] cursor-pointer"
              style={{
                gridTemplateColumns: "2fr 1.6fr 1.6fr 1fr 1fr 52px",
                borderBottom:
                  i < filtered.length - 1 ? "1px solid #e2e8f0" : "none",
              }}>
              {/* Name + TIN */}
              <div className="flex items-center gap-3 min-w-0">
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarFallback
                    className="text-xs font-bold text-white"
                    style={{ background: avatarColor(c.id) }}>
                    {getInitials(c.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate text-slate-900">
                    {c.name}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {c.tinNumber
                      ? `TIN: ${c.tinNumber}`
                      : `#${String(c.id).padStart(4, "0")}`}
                  </p>
                </div>
              </div>

              {/* Contact */}
              <div className="min-w-0">
                <p className="text-xs font-medium truncate text-slate-900">
                  {c.contactPerson || "—"}
                </p>
                <p className="text-[11px] mt-0.5 text-slate-500">{c.phone}</p>
              </div>

              {/* Email */}
              <p
                className="text-xs truncate"
                style={{ color: c.email ? "#0f172a" : "#94a3b8" }}>
                {c.email || "—"}
              </p>

              {/* Jobs */}
              <p className="text-sm font-semibold text-slate-900">
                {c.totalJobs || 0}
              </p>

              {/* Since */}
              <p className="text-xs text-slate-500">
                {formatDate(c.createdAt)}
              </p>

              {/* Actions */}
              <div onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-[#F0EFE9] text-slate-500">
                      <MoreHorizontal size={15} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-36 rounded-xl">
                    <DropdownMenuItem
                      onClick={() => setViewingClient(c)}
                      className="text-xs cursor-pointer">
                      <Eye size={13} className="mr-2" /> View
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        setEditing(c);
                        setSheetOpen(true);
                      }}
                      className="text-xs cursor-pointer">
                      <Pencil size={13} className="mr-2" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setDeleteTarget(c)}
                      className="text-xs cursor-pointer text-red-500 focus:text-red-500">
                      <Trash2 size={13} className="mr-2" /> Remove
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))
        )}
      </div>

      <ClientSheet
        open={sheetOpen}
        onClose={() => {
          setSheetOpen(false);
          setEditing(null);
        }}
        editing={editing}
        onSave={handleSave}
      />

      <ClientDetailModal
        open={!!viewingClient}
        onClose={() => setViewingClient(null)}
        client={viewingClient}
        jobs={jobs}
      />

      <DeleteDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        client={deleteTarget}
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
