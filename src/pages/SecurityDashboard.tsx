import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Loader2,
  Truck,
  CheckCircle2,
  ArrowLeft,
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
  gateOdometer?: number;
  gateFuelGauge?: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function getHeaders() {
  return {
    Authorization: "Bearer " + localStorage.getItem("bp_token"),
    "Content-Type": "application/json",
  };
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

// ── Fuel gauge options ─────────────────────────────────────────────────────────
const FUEL_OPTIONS = ["Empty", "1/4", "1/2", "3/4", "Full"];

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
        Fuel Gauge
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
function JobCard({
  job,
  onClick,
  isReturn,
}: {
  job: Job;
  onClick: () => void;
  isReturn: boolean;
}) {
  const alreadyLogged = isReturn
    ? !!job.gateOdometer || !!job.gateFuelGauge
    : !!job.gateOdometer || !!job.gateFuelGauge;

  return (
    <button
      onClick={onClick}
      className="w-full text-left transition-all duration-100 active:scale-[0.99]"
      style={{
        background: alreadyLogged ? "rgba(90,138,74,0.07)" : "transparent",
        border: `1.5px solid ${alreadyLogged ? "rgba(90,138,74,0.25)" : BORDER}`,
        borderRadius: "16px",
        padding: "18px 20px",
      }}>
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: alreadyLogged ? "rgba(90,138,74,0.12)" : CARD }}>
          {alreadyLogged ? (
            <CheckCircle2
              size={18}
              style={{ color: "#5a8a4a" }}
              strokeWidth={2}
            />
          ) : (
            <Truck size={18} style={{ color: MUTED }} strokeWidth={1.7} />
          )}
        </div>

        {/* Info */}
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
            {alreadyLogged && (
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
            {job.driverName} ·{" "}
            {isReturn
              ? `Due ${job.dueAt ? fmtTime(job.dueAt) : "today"}`
              : `Departs ${fmtTime(job.scheduledAt)}`}
          </p>
        </div>
      </div>
    </button>
  );
}

// ── Entry Sheet ────────────────────────────────────────────────────────────────
function EntrySheet({
  job,
  isReturn,
  onClose,
  onSaved,
}: {
  job: Job;
  isReturn: boolean;
  onClose: () => void;
  onSaved: (jobId: number, odometer: number, fuel: string) => void;
}) {
  const [odometer, setOdometer] = useState(
    job.gateOdometer ? String(job.gateOdometer) : "",
  );
  const [fuel, setFuel] = useState(job.gateFuelGauge ?? "");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!odometer && !fuel) {
      toast.error("Please enter at least one reading.");
      return;
    }
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {};
      if (odometer) body.gateOdometer = parseInt(odometer);
      if (fuel) body.gateFuelGauge = fuel;

      const res = await fetch(`${API_URL}/jobs/${job.id}`, {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify(body),
      });
      if (res.ok) {
        toast.success("Reading saved.");
        onSaved(job.id, parseInt(odometer) || 0, fuel);
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
      style={{
        animation: "secFadeUp 0.3s cubic-bezier(0.22,1,0.36,1) both",
      }}>
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
            {isReturn ? "Return" : "Departure"} · {job.clientName}
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
                {isReturn
                  ? `Return · Due ${job.dueAt ? fmtTime(job.dueAt) : "today"}`
                  : `Departure · ${fmtTime(job.scheduledAt)}`}
              </p>
            </div>
          </div>

          <LineInput
            label="Gate Odometer (km)"
            value={odometer}
            onChange={setOdometer}
            placeholder="e.g. 123456"
            type="number"
          />

          <FuelPicker value={fuel} onChange={setFuel} />
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
              Save Reading
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────
export default function SecurityDashboard() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"fleet" | "return">("fleet");
  const [selected, setSelected] = useState<Job | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API_URL}/jobs`, { headers: getHeaders() });
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

  // Daily fleet = jobs scheduled today (approved or scheduled)
  const dailyFleet = jobs.filter(
    (j) =>
      isToday(j.scheduledAt) &&
      (j.status === "Scheduled" || j.status === "Ongoing") &&
      j.approval === "Approved",
  );

  // Return fleet = jobs with dueAt today, or ongoing jobs scheduled today
  // Since dueAt may not always be set, fall back to scheduledAt day for Ongoing
  const returnFleet = jobs.filter(
    (j) => j.status === "Ongoing" || (j.dueAt && isToday(j.dueAt)),
  );

  function handleSaved(jobId: number, odometer: number, fuel: string) {
    setJobs((prev) =>
      prev.map((j) =>
        j.id === jobId
          ? { ...j, gateOdometer: odometer, gateFuelGauge: fuel }
          : j,
      ),
    );
  }

  const todayStr = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  // ── Entry view ──────────────────────────────────────────────────────────────
  if (selected) {
    return (
      <EntrySheet
        job={selected}
        isReturn={tab === "return"}
        onClose={() => setSelected(null)}
        onSaved={handleSaved}
      />
    );
  }

  // ── List view ───────────────────────────────────────────────────────────────
  const activeList = tab === "fleet" ? dailyFleet : returnFleet;

  return (
    <div
      className="flex flex-col h-full"
      style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Date + tabs */}
      <div className="flex-shrink-0 px-8 pt-8 pb-0">
        <p className="text-sm font-medium mb-6" style={{ color: MUTED }}>
          {todayStr}
        </p>

        {/* Tab bar */}
        <div
          className="flex p-1 rounded-2xl mb-6"
          style={{ background: CARD, width: "fit-content" }}>
          {(["fleet", "return"] as const).map((t) => {
            const active = tab === t;
            const label = t === "fleet" ? "Daily Fleet" : "Return Fleet";
            const count =
              t === "fleet" ? dailyFleet.length : returnFleet.length;
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="flex items-center gap-2 px-5 py-2 rounded-xl font-semibold text-sm transition-all duration-150"
                style={{
                  background: active ? BG : "transparent",
                  color: active ? DARK : MUTED,
                  boxShadow: active ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                }}>
                {label}
                <span
                  className="text-xs font-bold px-1.5 py-0.5 rounded-full"
                  style={{
                    background: active ? ACCENT : "rgba(0,0,0,0.08)",
                    color: active ? "#fff" : MUTED,
                    minWidth: "20px",
                    textAlign: "center",
                  }}>
                  {count}
                </span>
              </button>
            );
          })}
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
        ) : activeList.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center h-40 rounded-2xl"
            style={{ border: `1.5px dashed ${BORDER}` }}>
            <Gauge
              size={28}
              style={{ color: MUTED, opacity: 0.4 }}
              strokeWidth={1.5}
            />
            <p className="text-sm mt-3 font-medium" style={{ color: MUTED }}>
              {tab === "fleet"
                ? "No vehicles scheduled today"
                : "No returns expected today"}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {activeList.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                isReturn={tab === "return"}
                onClick={() => setSelected(job)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
