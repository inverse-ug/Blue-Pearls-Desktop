import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import {
  Loader2,
  Truck,
  CheckCircle2,
  ArrowLeft,
  Camera,
  X,
  Receipt,
  Gauge,
  Activity,
} from "lucide-react";

// ── Config ─────────────────────────────────────────────────────────────────────
const API_URL = "https://blue-pearls-server.vercel.app";

// ── Theme ──────────────────────────────────────────────────────────────────────
const DARK = "#2C2C2C";
const MUTED = "#9E9E9E";
const ACCENT = "#1e6ea6";
const BORDER = "rgba(44,44,44,0.15)";
const BG = "#F0EFE9";
const CARD = "#E8E7E1";

// ── Types ──────────────────────────────────────────────────────────────────────
interface Job {
  id: number;
  status: string;
  approval: string;
  scheduledAt: string;
  dueAt?: string;
  clientName: string;
  vehiclePlate: string;
  driverName: string;
  tonnage: string;
  stationOdometer?: number;
  stationFuelGauge?: string;
  receiptUrl?: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function getToken() {
  return localStorage.getItem("bp_token") ?? "";
}

function isToday(dateStr: string): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function fmtTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

const FUEL_OPTIONS = ["Empty", "1/4", "1/2", "3/4", "Full"];

// ── Image Uploader ─────────────────────────────────────────────────────────────
function ImageUploader({
  label,
  value,
  onChange,
}: {
  label: string;
  value: File | null;
  onChange: (f: File | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const preview = value ? URL.createObjectURL(value) : null;

  return (
    <div className="w-full">
      <label
        className="block text-xs font-semibold uppercase tracking-widest mb-3"
        style={{ color: MUTED }}>
        {label}
      </label>

      {preview ? (
        <div
          className="relative w-full rounded-2xl overflow-hidden"
          style={{ aspectRatio: "16/9" }}>
          <img
            src={preview}
            alt={label}
            className="w-full h-full object-cover"
          />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.5)" }}>
            <X size={14} color="#fff" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full flex flex-col items-center justify-center gap-3 rounded-2xl transition-all duration-150"
          style={{
            border: `2px dashed ${BORDER}`,
            padding: "28px 20px",
            background: CARD,
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.borderColor = "rgba(44,44,44,0.35)")
          }
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = BORDER)}>
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: BG }}>
            <Camera size={18} style={{ color: MUTED }} strokeWidth={1.7} />
          </div>
          <p className="text-sm font-semibold" style={{ color: MUTED }}>
            Tap to capture or upload
          </p>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onChange(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}

// ── LineInput ──────────────────────────────────────────────────────────────────
function LineInput({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div
      className="w-full py-2"
      style={{
        borderBottom: `2px solid ${focused ? DARK : BORDER}`,
        transition: "border-color 0.18s",
      }}>
      <label
        className="block text-xs font-semibold uppercase tracking-widest mb-3"
        style={{ color: focused ? DARK : MUTED }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        className="w-full bg-transparent outline-none font-medium"
        style={{
          fontSize: "1.35rem",
          color: DARK,
          caretColor: ACCENT,
          letterSpacing: "-0.01em",
        }}
      />
    </div>
  );
}

// ── Fuel Picker ────────────────────────────────────────────────────────────────
function FuelPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="w-full py-2">
      <label
        className="block text-xs font-semibold uppercase tracking-widest mb-4"
        style={{ color: MUTED }}>
        Fuel Gauge Reading
      </label>
      <div className="flex gap-2 flex-wrap">
        {FUEL_OPTIONS.map((opt) => {
          const selected = value === opt;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(opt)}
              className="px-4 py-2 rounded-xl font-semibold text-sm transition-all duration-100"
              style={{
                background: selected ? DARK : CARD,
                color: selected ? BG : MUTED,
                border: selected ? "none" : `1.5px solid ${BORDER}`,
              }}>
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Job Card ───────────────────────────────────────────────────────────────────
function JobCard({ job, onClick }: { job: Job; onClick: () => void }) {
  const logged =
    !!job.stationOdometer || !!job.stationFuelGauge || !!job.receiptUrl;

  return (
    <button
      onClick={onClick}
      className="w-full text-left transition-all duration-100 active:scale-[0.99]"
      style={{
        background: logged ? "rgba(90,138,74,0.07)" : "transparent",
        border: `1.5px solid ${logged ? "rgba(90,138,74,0.25)" : BORDER}`,
        borderRadius: "16px",
        padding: "18px 20px",
      }}>
      <div className="flex items-start gap-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: logged ? "rgba(90,138,74,0.12)" : CARD }}>
          {logged ? (
            <CheckCircle2
              size={18}
              style={{ color: "#5a8a4a" }}
              strokeWidth={2}
            />
          ) : (
            <Truck size={18} style={{ color: MUTED }} strokeWidth={1.7} />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p
              className="font-bold truncate"
              style={{
                fontSize: "1.05rem",
                color: DARK,
                letterSpacing: "-0.01em",
              }}>
              {job.vehiclePlate}
            </p>
            {logged && (
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{
                  background: "rgba(90,138,74,0.15)",
                  color: "#5a8a4a",
                }}>
                Logged
              </span>
            )}
          </div>
          <p className="text-sm truncate" style={{ color: MUTED }}>
            {job.clientName}
          </p>
          <p className="text-xs mt-1.5" style={{ color: MUTED }}>
            {job.driverName} · Departs {fmtTime(job.scheduledAt)}
          </p>
        </div>
      </div>
    </button>
  );
}

// ── Entry Sheet ────────────────────────────────────────────────────────────────
function EntrySheet({
  job,
  onClose,
  onSaved,
}: {
  job: Job;
  onClose: () => void;
  onSaved: (jobId: number, updates: Partial<Job>) => void;
}) {
  const [odometer, setOdometer] = useState(
    job.stationOdometer ? String(job.stationOdometer) : "",
  );
  const [fuelGauge, setFuelGauge] = useState(job.stationFuelGauge ?? "");
  const [odometerImage, setOdometerImage] = useState<File | null>(null);
  const [fuelImage, setFuelImage] = useState<File | null>(null);
  const [receiptImage, setReceiptImage] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (
      !odometer &&
      !fuelGauge &&
      !receiptImage &&
      !odometerImage &&
      !fuelImage
    ) {
      toast.error("Please fill in at least one field.");
      return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();

      if (odometer) fd.append("stationOdometer", odometer);
      if (fuelGauge) fd.append("stationFuelGauge", fuelGauge);
      if (odometerImage) fd.append("odometerImage", odometerImage);
      if (fuelImage) fd.append("fuelImage", fuelImage);
      if (receiptImage) fd.append("receiptImage", receiptImage);

      const res = await fetch(`${API_URL}/jobs/${job.id}`, {
        method: "PATCH",
        headers: { Authorization: "Bearer " + getToken() },
        // No Content-Type — browser sets it with boundary for multipart
        body: fd,
      });

      if (res.ok) {
        const updated = await res.json();
        toast.success("Fuel record saved.");
        onSaved(job.id, {
          stationOdometer: updated.stationOdometer,
          stationFuelGauge: updated.stationFuelGauge,
          receiptUrl: updated.receiptUrl,
        });
        onClose();
      } else {
        const d = await res.json();
        toast.error(d.error || "Failed to save.");
      }
    } catch {
      toast.error("Network error.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="flex flex-col h-full"
      style={{ animation: "fuelFadeUp 0.3s cubic-bezier(0.22,1,0.36,1) both" }}>
      {/* Header */}
      <div
        className="flex items-center gap-3 flex-shrink-0 px-8 py-5"
        style={{ borderBottom: `1px solid ${BORDER}` }}>
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-100"
          style={{ background: CARD, color: DARK }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "rgba(0,0,0,0.1)")
          }
          onMouseLeave={(e) => (e.currentTarget.style.background = CARD)}>
          <ArrowLeft size={16} strokeWidth={2} />
        </button>
        <div>
          <p
            className="font-bold"
            style={{ color: DARK, letterSpacing: "-0.01em" }}>
            {job.vehiclePlate}
          </p>
          <p className="text-xs" style={{ color: MUTED }}>
            Fuel Station Entry · {job.clientName}
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto px-8 pt-8 pb-4">
        <div className="space-y-8">
          {/* Summary strip */}
          <div
            className="rounded-2xl px-5 py-4 flex items-center gap-4"
            style={{ background: CARD }}>
            <Activity size={16} style={{ color: MUTED }} />
            <div>
              <p className="text-xs font-semibold" style={{ color: MUTED }}>
                {job.driverName}
              </p>
              <p className="text-sm font-semibold" style={{ color: DARK }}>
                Departure · {fmtTime(job.scheduledAt)}
              </p>
            </div>
          </div>

          {/* ── Odometer ── */}
          <div
            className="rounded-2xl p-5 space-y-5"
            style={{ background: CARD }}>
            <div className="flex items-center gap-2">
              <Gauge size={15} style={{ color: MUTED }} />
              <p
                className="text-xs font-bold uppercase tracking-widest"
                style={{ color: MUTED }}>
                Odometer
              </p>
            </div>
            <LineInput
              label="Reading (km)"
              value={odometer}
              onChange={setOdometer}
              placeholder="e.g. 123456"
              type="number"
            />
            <ImageUploader
              label="Photo of Odometer"
              value={odometerImage}
              onChange={setOdometerImage}
            />
          </div>

          {/* ── Fuel Gauge ── */}
          <div
            className="rounded-2xl p-5 space-y-5"
            style={{ background: CARD }}>
            <div className="flex items-center gap-2">
              <Gauge size={15} style={{ color: MUTED }} />
              <p
                className="text-xs font-bold uppercase tracking-widest"
                style={{ color: MUTED }}>
                Fuel Gauge
              </p>
            </div>
            <FuelPicker value={fuelGauge} onChange={setFuelGauge} />
            <ImageUploader
              label="Photo of Fuel Gauge"
              value={fuelImage}
              onChange={setFuelImage}
            />
          </div>

          {/* ── Receipt ── */}
          <div className="rounded-2xl p-5" style={{ background: CARD }}>
            <div className="flex items-center gap-2 mb-5">
              <Receipt size={15} style={{ color: MUTED }} />
              <p
                className="text-xs font-bold uppercase tracking-widest"
                style={{ color: MUTED }}>
                Fuel Receipt
              </p>
            </div>
            <ImageUploader
              label="Photo of Receipt"
              value={receiptImage}
              onChange={setReceiptImage}
            />
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="flex-shrink-0 px-8 py-5">
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full h-14 rounded-2xl flex items-center justify-center gap-2 font-semibold text-white transition-all duration-100 active:scale-[0.99]"
          style={{
            fontSize: "0.95rem",
            background: "linear-gradient(135deg, #1a3a5c 0%, #1e6ea6 100%)",
            boxShadow: "0 4px 20px rgba(26,58,92,0.22)",
            opacity: submitting ? 0.7 : 1,
          }}>
          {submitting ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Saving…
            </>
          ) : (
            <>
              <CheckCircle2 size={16} />
              Save Fuel Record
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────
export default function FuelDashboard() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Job | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API_URL}/jobs`, {
          headers: {
            Authorization: "Bearer " + getToken(),
            "Content-Type": "application/json",
          },
        });
        if (res.ok) {
          const data = await res.json();
          setJobs(data);
        } else {
          toast.error("Failed to load jobs.");
        }
      } catch {
        toast.error("Network error.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Today's approved/scheduled jobs that need fuelling
  const todayJobs = jobs.filter(
    (j) =>
      isToday(j.scheduledAt) &&
      (j.status === "Scheduled" || j.status === "Ongoing") &&
      j.approval === "Approved",
  );

  function handleSaved(jobId: number, updates: Partial<Job>) {
    setJobs((prev) =>
      prev.map((j) => (j.id === jobId ? { ...j, ...updates } : j)),
    );
  }

  const todayStr = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  // ── Entry view ──
  if (selected) {
    return (
      <EntrySheet
        job={selected}
        onClose={() => setSelected(null)}
        onSaved={handleSaved}
      />
    );
  }

  // ── List view ──
  return (
    <div
      className="flex flex-col h-full"
      style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="flex-shrink-0 px-8 pt-8 pb-4">
        <p className="text-sm font-medium mb-2" style={{ color: MUTED }}>
          {todayStr}
        </p>
        <h1
          style={{
            fontSize: "2rem",
            fontWeight: 800,
            color: DARK,
            letterSpacing: "-0.03em",
            marginBottom: "1.5rem",
          }}>
          Fuel Station
        </h1>

        {/* Count pill */}
        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full"
          style={{ background: CARD, border: `1.5px solid ${BORDER}` }}>
          <Truck size={13} style={{ color: MUTED }} />
          <span className="text-sm font-semibold" style={{ color: DARK }}>
            {todayJobs.length} vehicle{todayJobs.length !== 1 ? "s" : ""} today
          </span>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-8 pb-8">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2
              size={22}
              className="animate-spin"
              style={{ color: MUTED }}
            />
          </div>
        ) : todayJobs.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center h-40 rounded-2xl"
            style={{ border: `1.5px dashed ${BORDER}` }}>
            <Truck
              size={28}
              style={{ color: MUTED, opacity: 0.4 }}
              strokeWidth={1.5}
            />
            <p className="text-sm mt-3 font-medium" style={{ color: MUTED }}>
              No vehicles scheduled for today
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {todayJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onClick={() => setSelected(job)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
