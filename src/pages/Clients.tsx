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
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

// ── Config ────────────────────────────────────────────────────────────────────
const API_URL = "https://blue-pearls-server.vercel.app";

// ── Types ─────────────────────────────────────────────────────────────────────
export interface Client {
  id: number;
  name: string;
  contactPerson?: string;
  email?: string;
  phone: string;
  address?: string;
  tinNumber?: string;
  createdAt: string;
}

type SortKey = "name" | "phone" | "createdAt";
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
  C.blue,
  C.green,
  "#8B5CF6",
  "#0891b2",
  "#059669",
];
function avatarColor(id: number) {
  return AVATAR_COLORS[id % AVATAR_COLORS.length];
}

// ── Schema ────────────────────────────────────────────────────────────────────
const clientSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  contactPerson: z.string().optional().or(z.literal("")),
  email: z.string().email("Enter a valid email").optional().or(z.literal("")),
  phone: z.string().min(7, "Phone number is required"),
  address: z.string().optional().or(z.literal("")),
  tinNumber: z.string().optional().or(z.literal("")),
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
      style={{ color: active ? C.dark : C.muted }}>
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

// ── Field Input helper ────────────────────────────────────────────────────────
function FieldRow({
  label,
  icon: Icon,
  children,
  error,
}: {
  label: string;
  icon?: React.ElementType;
  children: React.ReactNode;
  error?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label
        className="text-xs font-semibold uppercase tracking-wider"
        style={{ color: C.muted }}>
        {label}
      </Label>
      <div className="relative">
        {Icon && (
          <Icon
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-10 pointer-events-none"
            style={{ color: C.muted }}
          />
        )}
        {children}
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
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

  const defaultValues: ClientFormData = {
    name: "",
    contactPerson: "",
    email: "",
    phone: "",
    address: "",
    tinNumber: "",
  };

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    values: editing
      ? {
          name: editing.name,
          contactPerson: editing.contactPerson ?? "",
          email: editing.email ?? "",
          phone: editing.phone,
          address: editing.address ?? "",
          tinNumber: editing.tinNumber ?? "",
        }
      : defaultValues,
  });

  function handleClose() {
    reset(defaultValues);
    onClose();
  }

  async function onSubmit(data: ClientFormData) {
    setIsSaving(true);
    try {
      await onSave(data, editing?.id);
      handleClose();
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={(o) => !o && !isSaving && handleClose()}>
      <SheetContent
        className="w-[440px] sm:w-[500px] overflow-y-auto !p-0"
        style={{ fontFamily: "'Inter', sans-serif" }}>
        <div
          className="px-7 py-6"
          style={{ borderBottom: `1px solid ${C.border}` }}>
          <SheetTitle className="text-lg font-bold" style={{ color: C.dark }}>
            {editing ? "Edit Client" : "Add Client"}
          </SheetTitle>
          <SheetDescription className="mt-1 text-sm" style={{ color: C.muted }}>
            {editing
              ? `Editing details for ${editing.name}.`
              : "Fill in the details to add a new client."}
          </SheetDescription>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="px-7 py-6 space-y-4">
            <FieldRow
              label="Company / Client Name *"
              icon={Building2}
              error={errors.name?.message}>
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
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
                    placeholder="e.g. John Ssemwanga"
                    className="h-10 rounded-xl text-sm pl-9"
                  />
                )}
              />
            </FieldRow>

            <div className="grid grid-cols-2 gap-3">
              <FieldRow
                label="Phone *"
                icon={Phone}
                error={errors.phone?.message}>
                <Controller
                  name="phone"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      placeholder="+256 7xx xxx xxx"
                      className="h-10 rounded-xl text-sm pl-9"
                    />
                  )}
                />
              </FieldRow>
              <FieldRow label="Email" icon={Mail} error={errors.email?.message}>
                <Controller
                  name="email"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      type="email"
                      placeholder="billing@client.com"
                      className="h-10 rounded-xl text-sm pl-9"
                    />
                  )}
                />
              </FieldRow>
            </div>

            <FieldRow
              label="Address"
              icon={MapPin}
              error={errors.address?.message}>
              <Controller
                name="address"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    placeholder="e.g. Plot 14, Kampala Road"
                    className="h-10 rounded-xl text-sm pl-9"
                  />
                )}
              />
            </FieldRow>

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
                    placeholder="e.g. 1234567890"
                    className="h-10 rounded-xl text-sm pl-9"
                  />
                )}
              />
            </FieldRow>
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
                "Add Client"
              )}
            </Button>
          </div>
        </form>
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
      <DialogContent
        className="max-w-sm rounded-2xl"
        style={{ fontFamily: "'Inter', sans-serif" }}>
        <DialogHeader>
          <DialogTitle
            className="text-base font-bold"
            style={{ color: C.dark }}>
            Remove Client
          </DialogTitle>
          <DialogDescription style={{ color: C.muted }}>
            Are you sure you want to remove{" "}
            <strong style={{ color: C.dark }}>{client?.name}</strong>? This
            cannot be undone.
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

// ── Clients Page ──────────────────────────────────────────────────────────────
export default function Clients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null);

  const authHeader = {
    Authorization: `Bearer ${localStorage.getItem("bp_token")}`,
    "Content-Type": "application/json",
  };

  const fetchClients = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/clients`, { headers: authHeader });
      const data = await res.json();
      if (res.ok) setClients(data);
      else toast.error(data.error || "Failed to load clients");
    } catch {
      toast.error("Network error while fetching clients");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  function handleSort(key: SortKey) {
    if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    let list = clients.filter(
      (c) =>
        !q ||
        c.name.toLowerCase().includes(q) ||
        (c.contactPerson ?? "").toLowerCase().includes(q) ||
        (c.email ?? "").toLowerCase().includes(q) ||
        c.phone.includes(q),
    );
    list.sort((a, b) => {
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
  }, [clients, search, sortKey, sortDir]);

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
        fetchClients();
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
      const res = await fetch(`${API_URL}/clients/${deleteTarget.id}`, {
        method: "DELETE",
        headers: authHeader,
      });
      if (res.ok) {
        toast.success("Client removed");
        fetchClients();
      } else toast.error("Failed to remove client");
    } catch {
      toast.error("Network error");
    }
  }

  return (
    <div
      className="h-full overflow-auto px-6 pt-5 pb-6"
      style={{ scrollbarGutter: "stable" }}>
      {/* Header */}
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
            Clients
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
          <Plus size={15} /> Add Client
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          {
            label: "Total Clients",
            value: clients.length,
            icon: Contact,
            color: "#1e6ea6",
            bg: "#1e6ea618",
          },
          {
            label: "With Email",
            value: clients.filter((c) => !!c.email).length,
            icon: Mail,
            color: C.green,
            bg: `${C.green}18`,
          },
          {
            label: "With TIN",
            value: clients.filter((c) => !!c.tinNumber).length,
            icon: FileText,
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

      {/* Filter bar */}
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
            placeholder="Search by name, contact, email…"
            className="pl-9 h-9 rounded-xl text-sm border-0 bg-[#F5F4EF]"
          />
        </div>
        <p className="text-xs ml-auto" style={{ color: C.muted }}>
          {filtered.length} {filtered.length === 1 ? "client" : "clients"}
        </p>
      </div>

      {/* Table */}
      <div
        className="rounded-2xl overflow-hidden min-h-[400px]"
        style={{
          background: "#fff",
          border: `1px solid ${C.border}`,
          animation: "fadeSlideUp 0.4s ease 0.28s both",
        }}>
        <div
          className="grid px-5 py-3"
          style={{
            gridTemplateColumns: "2fr 1.6fr 1.6fr 1fr 52px",
            borderBottom: `1px solid ${C.border}`,
            background: "#FAFAF8",
          }}>
          <SortHeader
            label="Client"
            sortKey="name"
            current={sortKey}
            dir={sortDir}
            onSort={handleSort}
          />
          <span
            className="text-[10px] font-semibold uppercase tracking-widest"
            style={{ color: C.muted }}>
            Contact
          </span>
          <span
            className="text-[10px] font-semibold uppercase tracking-widest"
            style={{ color: C.muted }}>
            Email
          </span>
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
              style={{ color: C.blue }}
            />
            <p className="text-sm font-medium" style={{ color: C.muted }}>
              Loading clients…
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
            <div className="w-16 h-16 rounded-full bg-[#F5F4EF] flex items-center justify-center mb-4">
              <Contact size={28} style={{ color: C.border }} />
            </div>
            <h3 className="text-base font-bold mb-1" style={{ color: C.dark }}>
              No Clients Found
            </h3>
            <p
              className="text-sm max-w-[280px] leading-relaxed mb-6"
              style={{ color: C.muted }}>
              {search
                ? "No results match your search."
                : "No clients yet. Add your first client to get started."}
            </p>
            {!search && (
              <Button
                onClick={() => setSheetOpen(true)}
                variant="outline"
                className="rounded-xl h-9 px-5 border-[#c4dff0] text-[#1a3a5c] hover:bg-[#ddf0fb] transition-colors">
                <Plus size={14} className="mr-2" /> Add Client
              </Button>
            )}
          </div>
        ) : (
          filtered.map((c, i) => (
            <div
              key={c.id}
              className="grid items-center px-5 py-3.5 transition-colors hover:bg-[#F5F4EF]"
              style={{
                gridTemplateColumns: "2fr 1.6fr 1.6fr 1fr 52px",
                borderBottom:
                  i < filtered.length - 1 ? `1px solid ${C.border}` : "none",
                animation: `fadeSlideUp 0.3s ease ${0.3 + i * 0.04}s both`,
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
                  <p
                    className="text-sm font-semibold truncate"
                    style={{ color: C.dark }}>
                    {c.name}
                  </p>
                  <p className="text-[11px]" style={{ color: C.muted }}>
                    {c.tinNumber
                      ? `TIN: ${c.tinNumber}`
                      : `#${String(c.id).padStart(4, "0")}`}
                  </p>
                </div>
              </div>

              {/* Contact Person + Phone */}
              <div className="min-w-0">
                <p
                  className="text-xs font-medium truncate"
                  style={{ color: C.dark }}>
                  {c.contactPerson || "—"}
                </p>
                <p className="text-[11px] mt-0.5" style={{ color: C.muted }}>
                  {c.phone}
                </p>
              </div>

              {/* Email */}
              <p
                className="text-xs truncate"
                style={{ color: c.email ? C.dark : C.muted }}>
                {c.email || "—"}
              </p>

              {/* Since */}
              <p className="text-xs" style={{ color: C.muted }}>
                {new Date(c.createdAt).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "2-digit",
                })}
              </p>

              {/* Actions */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-[#F0EFE9]"
                    style={{ color: C.muted }}>
                    <MoreHorizontal size={15} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-36 rounded-xl">
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
      <DeleteDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        client={deleteTarget}
        onConfirm={handleDelete}
      />
    </div>
  );
}
