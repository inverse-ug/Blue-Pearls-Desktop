import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  CalendarDays,
  Weight,
  ClipboardList,
  MapPin,
  Loader2,
  Search,
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
interface ClientOption {
  id: number;
  name: string;
  contactPerson?: string;
}
interface StaffOption {
  id: number;
  name: string;
  role?: string;
}

type FormState = {
  clientId: string;
  clientName: string;
  scheduledAt: string;
  tonnage: string;
  description: string;
};

// ── Greetings ──────────────────────────────────────────────────────────────────
const G: Record<string, string[]> = {
  morning: [
    "Rise and shine",
    "Good morning",
    "Morning hustle",
    "Early bird wins",
    "Dawn's calling",
    "Sun's up, let's go",
    "Start strong today",
    "A new day awaits",
    "Bright morning",
    "Fresh start today",
  ],
  afternoon: [
    "Good afternoon",
    "Keep it rolling",
    "Midday momentum",
    "Afternoon check-in",
    "Half day, full speed",
    "Still going strong",
    "Afternoon grind",
    "Powering through",
    "Midday check",
    "Keeping the pace",
  ],
  evening: [
    "Good evening",
    "Evening dispatch",
    "Last runs of the day",
    "Winding it down",
    "Evening check-in",
    "Dusk dispatch",
    "Almost there",
    "Evening grind",
    "Sunset shift",
    "End-of-day push",
  ],
  night: [
    "Burning the midnight oil",
    "Night shift hustle",
    "Late night dispatch",
    "Night owl on duty",
    "Working through the night",
    "Still at it",
    "Night operations",
    "The night crew",
    "Midnight run",
    "Late hours, strong work",
  ],
};

function pickGreeting(name: string): { line1: string; line2: string } {
  const h = new Date().getHours();
  const slot =
    h >= 5 && h < 12
      ? "morning"
      : h < 17
        ? "afternoon"
        : h < 21
          ? "evening"
          : "night";
  const pool = G[slot];
  const g = pool[Math.floor(Math.random() * pool.length)];
  return { line1: `${g},`, line2: `${name || "there"}.` };
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function toDatetimeLocal(offset = 0): string {
  const d = new Date(Date.now() + offset);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}
function getHeaders() {
  return {
    Authorization: "Bearer " + localStorage.getItem("bp_token"),
    "Content-Type": "application/json",
  };
}

const STEPS = [
  { id: 1, label: "Client", icon: ClipboardList },
  { id: 2, label: "Schedule", icon: CalendarDays },
  { id: 3, label: "Cargo", icon: Weight },
  { id: 4, label: "Confirm", icon: CheckCircle2 },
];

// ── Client Typeahead ───────────────────────────────────────────────────────────
function ClientTypeahead({
  clients,
  value,
  displayValue,
  onSelect,
  error,
}: {
  clients: ClientOption[];
  value: string;
  displayValue: string;
  onSelect: (id: string, name: string) => void;
  error?: string;
}) {
  const [query, setQuery] = useState(displayValue);
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep query in sync when parent resets or prefills
  useEffect(() => {
    setQuery(displayValue);
  }, [displayValue]);

  // Only show suggestions when there is actual input
  const suggestions =
    query.trim().length === 0
      ? []
      : clients
          .filter((c) => c.name.toLowerCase().includes(query.toLowerCase()))
          .slice(0, 8);

  function handleSelect(c: ClientOption) {
    setQuery(c.name);
    setOpen(false);
    setActiveIdx(-1);
    onSelect(String(c.id), c.name);
    inputRef.current?.blur();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, suggestions.length - 1));
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    }
    if (e.key === "Enter" && activeIdx >= 0) {
      e.preventDefault();
      handleSelect(suggestions[activeIdx]);
    }
    if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    }
  }

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const showDropdown = open && suggestions.length > 0;

  return (
    <div ref={containerRef} className="relative w-full">
      <div
        className="w-full py-2"
        style={{
          borderBottom: `2px solid ${focused ? DARK : error ? "#EA7957" : BORDER}`,
          transition: "border-color 0.18s",
        }}>
        <label
          className="block text-xs font-semibold uppercase tracking-widest mb-3"
          style={{ color: error ? "#EA7957" : focused ? DARK : MUTED }}>
          Client
        </label>
        <div className="flex items-center gap-3">
          <Search size={18} style={{ color: MUTED, flexShrink: 0 }} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
              setActiveIdx(-1);
              if (value) onSelect("", e.target.value);
            }}
            onFocus={() => {
              setFocused(true);
              setOpen(true);
            }}
            onBlur={() => setFocused(false)}
            onKeyDown={handleKeyDown}
            placeholder="Type to search clients…"
            autoComplete="off"
            className="flex-1 bg-transparent outline-none font-medium"
            style={{
              fontSize: "1.35rem",
              color: DARK,
              caretColor: ACCENT,
              letterSpacing: "-0.01em",
            }}
          />
          {value && (
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                setQuery("");
                onSelect("", "");
                setOpen(true);
                inputRef.current?.focus();
              }}
              className="text-xs font-semibold uppercase tracking-wider transition-opacity"
              style={{ color: MUTED, opacity: 0.7 }}>
              Clear
            </button>
          )}
        </div>
        {error && (
          <p className="text-xs mt-2" style={{ color: "#EA7957" }}>
            {error}
          </p>
        )}
      </div>

      {showDropdown && (
        <div
          className="absolute left-0 right-0 z-50 overflow-hidden"
          style={{
            top: "100%",
            marginTop: "4px",
            background: BG,
            border: `1.5px solid ${BORDER}`,
            borderRadius: "16px",
            boxShadow:
              "0 12px 40px rgba(44,44,44,0.14), 0 2px 8px rgba(44,44,44,0.08)",
          }}>
          {suggestions.map((c, i) => {
            const isActive = i === activeIdx;
            const isSelected = String(c.id) === value;
            const nameLC = c.name.toLowerCase();
            const queryLC = query.toLowerCase().trim();
            const matchIdx = nameLC.indexOf(queryLC);

            return (
              <button
                key={c.id}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(c);
                }}
                onMouseEnter={() => setActiveIdx(i)}
                className="w-full text-left flex items-center gap-4 px-5 transition-colors duration-75"
                style={{
                  paddingTop: "14px",
                  paddingBottom: "14px",
                  background: isActive ? CARD : "transparent",
                  borderBottom:
                    i < suggestions.length - 1 ? `1px solid ${BORDER}` : "none",
                }}>
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-sm"
                  style={{
                    background: isSelected ? DARK : CARD,
                    color: isSelected ? BG : MUTED,
                  }}>
                  {c.name.charAt(0).toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <p
                    className="font-semibold truncate"
                    style={{
                      fontSize: "1rem",
                      color: DARK,
                      letterSpacing: "-0.01em",
                    }}>
                    {queryLC && matchIdx >= 0 ? (
                      <>
                        {c.name.slice(0, matchIdx)}
                        <span style={{ color: ACCENT, fontWeight: 700 }}>
                          {c.name.slice(matchIdx, matchIdx + queryLC.length)}
                        </span>
                        {c.name.slice(matchIdx + queryLC.length)}
                      </>
                    ) : (
                      c.name
                    )}
                  </p>
                  {c.contactPerson && (
                    <p
                      className="text-xs truncate mt-0.5"
                      style={{ color: MUTED }}>
                      {c.contactPerson}
                    </p>
                  )}
                </div>

                {isSelected && (
                  <CheckCircle2
                    size={16}
                    style={{ color: ACCENT, flexShrink: 0 }}
                    strokeWidth={2}
                  />
                )}
              </button>
            );
          })}
        </div>
      )}
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
  error,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  error?: string;
  hint?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div
      className="w-full py-2"
      style={{
        borderBottom: `2px solid ${focused ? DARK : error ? "#EA7957" : BORDER}`,
        transition: "border-color 0.18s",
      }}>
      <label
        className="block text-xs font-semibold uppercase tracking-widest mb-3"
        style={{ color: error ? "#EA7957" : focused ? DARK : MUTED }}>
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
      {hint && !error && (
        <p className="text-xs mt-2" style={{ color: MUTED }}>
          {hint}
        </p>
      )}
      {error && (
        <p className="text-xs mt-2" style={{ color: "#EA7957" }}>
          {error}
        </p>
      )}
    </div>
  );
}

// ── LineDatetime ───────────────────────────────────────────────────────────────
function LineDatetime({
  label,
  value,
  onChange,
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div
      className="w-full py-2"
      style={{
        borderBottom: `2px solid ${focused ? DARK : error ? "#EA7957" : BORDER}`,
        transition: "border-color 0.18s",
      }}>
      <label
        className="block text-xs font-semibold uppercase tracking-widest mb-3"
        style={{ color: error ? "#EA7957" : focused ? DARK : MUTED }}>
        {label}
      </label>
      <input
        type="datetime-local"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="w-full bg-transparent outline-none font-medium"
        style={{
          fontSize: "1.35rem",
          color: DARK,
          caretColor: ACCENT,
          letterSpacing: "-0.01em",
        }}
      />
      {error && (
        <p className="text-xs mt-2" style={{ color: "#EA7957" }}>
          {error}
        </p>
      )}
    </div>
  );
}

// ── LineTextarea ───────────────────────────────────────────────────────────────
function LineTextarea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
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
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        rows={3}
        className="w-full bg-transparent outline-none resize-none font-medium"
        style={{
          fontSize: "1.2rem",
          color: DARK,
          caretColor: ACCENT,
          fontFamily: "'Inter',sans-serif",
        }}
      />
    </div>
  );
}

// ── StepShell ──────────────────────────────────────────────────────────────────
function StepShell({
  stepNum,
  total,
  title,
  sub,
  dir,
  children,
}: {
  stepNum: number;
  total: number;
  title: string;
  sub: string;
  dir: "fwd" | "back";
  children: React.ReactNode;
}) {
  const anim = dir === "fwd" ? "implantStepIn" : "implantStepBack";
  return (
    <div
      className="flex-1"
      style={{ animation: `${anim} 0.32s cubic-bezier(0.22,1,0.36,1) both` }}>
      <p
        className="text-xs font-semibold uppercase tracking-widest mb-6"
        style={{ color: MUTED }}>
        Step {stepNum} of {total}
      </p>
      <h2
        style={{
          fontSize: "2.8rem",
          fontWeight: 800,
          color: DARK,
          letterSpacing: "-0.03em",
          lineHeight: 1.1,
          marginBottom: "0.6rem",
        }}>
        {title}
      </h2>
      <p className="mb-12" style={{ fontSize: "1.05rem", color: MUTED }}>
        {sub}
      </p>
      {children}
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────
export default function CreateJob() {
  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("bp_user") || "{}");
    } catch {
      return {};
    }
  })();
  const { line1, line2 } = useRef(
    pickGreeting(user.name?.split(" ")[0]),
  ).current;

  const [clients, setClients] = useState<ClientOption[]>([]);
  const [staff, setStaff] = useState<StaffOption[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  // Track placement name separately for the location pill
  const [placementName, setPlacementName] = useState<string>("");

  // step 0 = home, 1-4 = form, 5 = done
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState<"fwd" | "back">("fwd");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState<FormState>({
    clientId: "",
    clientName: "",
    scheduledAt: toDatetimeLocal(3600_000),
    tonnage: "",
    description: "",
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof FormState, string>>
  >({});

  useEffect(() => {
    async function load() {
      try {
        const h = getHeaders();

        // Fetch clients, staff list, and — if the user has a staffId —
        // fetch that staff member's record to get their placementId.
        const fetchStaffRecord = user.staffId
          ? fetch(`${API_URL}/staff/${user.staffId}`, { headers: h })
          : Promise.resolve(null);

        const [cR, sR, staffRecordRes] = await Promise.all([
          fetch(`${API_URL}/clients`, { headers: h }),
          fetch(`${API_URL}/staff`, { headers: h }),
          fetchStaffRecord,
        ]);

        const [cD, sD] = await Promise.all([cR.json(), sR.json()]);

        if (cR.ok) setClients(cD);
        if (sR.ok) setStaff(sD);

        // Resolve placement from the staff record
        if (staffRecordRes && staffRecordRes.ok && cR.ok) {
          const staffRecord = await staffRecordRes.json();
          const placementId = staffRecord?.placementId;

          if (placementId) {
            // placementName comes joined on the GET /staff/:id response
            const pName: string = staffRecord.placementName || "";
            setPlacementName(pName);

            // Find matching client in the clients list
            const placedClient = cD.find(
              (c: ClientOption) => c.id === placementId,
            );
            if (placedClient) {
              setForm((f) => ({
                ...f,
                clientId: String(placedClient.id),
                clientName: placedClient.name,
              }));
            }
          }
        }
      } catch {
        toast.error("Failed to load data. Please refresh.");
      } finally {
        setIsLoadingData(false);
      }
    }
    load();
  }, []);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function validateStep(s: number): boolean {
    const errs: Partial<Record<keyof FormState, string>> = {};
    if (s === 1 && !form.clientId)
      errs.clientId = "Please select a client from the list";
    if (s === 2 && !form.scheduledAt)
      errs.scheduledAt = "Departure date is required";
    setErrors(errs);
    return !Object.keys(errs).length;
  }

  function go(n: number) {
    setDir(n > step ? "fwd" : "back");
    setStep(n);
  }
  function next() {
    if (step === 0) {
      go(1);
      return;
    }
    if (validateStep(step)) go(step + 1);
  }
  function back() {
    go(step - 1);
  }

  function reset() {
    setForm({
      clientId: "",
      clientName: "",
      scheduledAt: toDatetimeLocal(3600_000),
      tonnage: "",
      description: "",
    });
    setErrors({});
    go(0);
  }

  async function handleSubmit() {
    if (!validateStep(step)) return;
    setIsSubmitting(true);
    try {
      // Build payload with only provided fields
      const payload: any = {
        clientId: Number(form.clientId),
        scheduledAt: new Date(form.scheduledAt).toISOString(),
        approval: "Requested",
        status: "Scheduled",
      };

      // Only add optional fields if they have values
      if (form.tonnage?.trim()) {
        payload.tonnage = form.tonnage.trim();
      }

      if (form.description?.trim()) {
        payload.description = form.description.trim();
      }

      if (user.staffId) {
        payload.requestedById = user.staffId;
      }

      // Only include vehicleId and driverId if you have them
      // For now, you might want to omit them until you add vehicle selection
      // const drivers = staff.filter((s) => s.role === "DRIVER");
      // if (drivers[0]?.id) payload.driverId = drivers[0].id;

      const res = await fetch(`${API_URL}/jobs`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        go(5);
      } else {
        const d = await res.json();
        toast.error(d.error || "Submission failed.");
      }
    } catch {
      toast.error("Network error.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const selectedClient = clients.find((c) => String(c.id) === form.clientId);
  const totalSteps = STEPS.length;
  const pct =
    step >= 1 && step <= totalSteps
      ? (step / totalSteps) * 100
      : step > totalSteps
        ? 100
        : 0;
  const animKey = `step-${step}`;

  // Use placementName from staff record, or fall back to selected client name
  const displayPlacement = placementName || selectedClient?.name || "";

  return (
    <div
      className="w-full h-full flex flex-col"
      style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Progress bar */}
      <div
        className="w-full flex-shrink-0"
        style={{ height: "3px", background: "rgba(0,0,0,0.07)" }}>
        <div
          className="h-full transition-all duration-500 ease-out"
          style={{
            width: `${pct}%`,
            background: "linear-gradient(90deg, #1a3a5c, #1e6ea6)",
          }}
        />
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-12 pt-14 pb-4">
        {/* ── STEP 0: Home ── */}
        {step === 0 && (
          <div
            key={animKey}
            style={{
              animation: "implantFadeUp 0.45s cubic-bezier(0.22,1,0.36,1) both",
            }}>
            <p className="text-sm font-medium mb-10" style={{ color: MUTED }}>
              {new Date().toLocaleDateString("en-GB", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
            {/* Greeting with shimmer on line1, plain on line2 */}
            <h1
              style={{
                fontSize: "4rem",
                fontWeight: 800,
                letterSpacing: "-0.04em",
                lineHeight: 1.1,
                marginBottom: "0.2em",
              }}>
              <span className="shimmer-greeting">{line1}</span>
            </h1>
            <h1
              style={{
                fontSize: "4rem",
                fontWeight: 800,
                color: DARK,
                letterSpacing: "-0.04em",
                lineHeight: 1.1,
                marginBottom: "3.5rem",
              }}>
              {line2}
            </h1>
            {displayPlacement && (
              <div
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full mb-2"
                style={{
                  background: "rgba(0,0,0,0.06)",
                  border: `1px solid ${BORDER}`,
                }}>
                <MapPin size={11} style={{ color: MUTED }} />
                <span
                  className="text-xs font-semibold"
                  style={{ color: MUTED }}>
                  {displayPlacement}
                </span>
              </div>
            )}
          </div>
        )}

        {/* ── STEP 1: Client ── */}
        {step === 1 && (
          <StepShell
            key={animKey}
            dir={dir}
            stepNum={1}
            total={totalSteps}
            title="Who is this for?"
            sub="Search and select the client.">
            <ClientTypeahead
              clients={clients}
              value={form.clientId}
              displayValue={form.clientName}
              onSelect={(id, name) => {
                setField("clientId", id);
                setField("clientName", name);
              }}
              error={errors.clientId}
            />
          </StepShell>
        )}

        {/* ── STEP 2: Schedule ── */}
        {step === 2 && (
          <StepShell
            key={animKey}
            dir={dir}
            stepNum={2}
            total={totalSteps}
            title="When is the trip?"
            sub="Set the departure time.">
            <div className="space-y-10">
              <LineDatetime
                label="Scheduled Departure *"
                value={form.scheduledAt}
                onChange={(v) => setField("scheduledAt", v)}
                error={errors.scheduledAt}
              />
              {displayPlacement && (
                <div className="flex items-center gap-2.5 pt-2">
                  <MapPin size={14} style={{ color: MUTED, flexShrink: 0 }} />
                  <p className="text-sm" style={{ color: MUTED }}>
                    From{" "}
                    <strong style={{ color: DARK }}>{displayPlacement}</strong>
                  </p>
                </div>
              )}
            </div>
          </StepShell>
        )}

        {/* ── STEP 3: Cargo ── */}
        {step === 3 && (
          <StepShell
            key={animKey}
            dir={dir}
            stepNum={3}
            total={totalSteps}
            title="What's the cargo?"
            sub="Tell us what's being transported.">
            <div className="space-y-10">
              <LineInput
                label="Tonnage or Load Description (optional)"
                value={form.tonnage}
                onChange={(v) => setField("tonnage", v)}
                placeholder="e.g. 12 tonnes, 3 pallets of cement…"
                hint="Describe the load however you like"
              />
              <LineTextarea
                label="Additional Notes (optional)"
                value={form.description}
                onChange={(v) => setField("description", v)}
                placeholder="Route info, special requirements, contacts…"
              />
            </div>
          </StepShell>
        )}

        {/* ── STEP 4: Confirm ── */}
        {step === 4 && (
          <StepShell
            key={animKey}
            dir={dir}
            stepNum={4}
            total={totalSteps}
            title="Review & submit"
            sub="Everything look right?">
            <div>
              {[
                { label: "Client", value: selectedClient?.name ?? "—" },
                {
                  label: "Departure",
                  value: form.scheduledAt
                    ? new Date(form.scheduledAt).toLocaleString("en-GB", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "—",
                },
                { label: "Load", value: form.tonnage || "Not specified" },
                { label: "Notes", value: form.description || "—" },
              ].map((row, i, arr) => (
                <div
                  key={row.label}
                  className="py-6"
                  style={{
                    borderBottom:
                      i < arr.length - 1 ? `1px solid ${BORDER}` : "none",
                  }}>
                  <p
                    className="text-xs font-semibold uppercase tracking-widest mb-2"
                    style={{ color: MUTED }}>
                    {row.label}
                  </p>
                  <p
                    className="font-semibold leading-snug"
                    style={{
                      fontSize: "1.25rem",
                      color: DARK,
                      letterSpacing: "-0.01em",
                    }}>
                    {row.value}
                  </p>
                </div>
              ))}
            </div>
          </StepShell>
        )}

        {/* ── STEP 5: Done ── */}
        {step === 5 && (
          <div
            key={animKey}
            style={{
              animation: "implantFadeUp 0.45s cubic-bezier(0.22,1,0.36,1) both",
            }}>
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-10"
              style={{ background: "rgba(140,165,115,0.2)" }}>
              <CheckCircle2
                size={34}
                strokeWidth={1.75}
                style={{ color: "#5a8a4a" }}
              />
            </div>
            <h1
              style={{
                fontSize: "4rem",
                fontWeight: 800,
                color: DARK,
                letterSpacing: "-0.04em",
                lineHeight: 1.1,
                marginBottom: "0.5rem",
              }}>
              Request sent.
            </h1>
            <p style={{ fontSize: "1.15rem", color: MUTED, lineHeight: 1.55 }}>
              Your request for{" "}
              <strong style={{ color: DARK }}>{selectedClient?.name}</strong> is
              with management.
            </p>
          </div>
        )}
      </div>

      {/* ── Pinned bottom nav ── */}
      <div
        className="flex-shrink-0 px-12 py-5"
        style={{
          borderTop: step > 0 && step < 5 ? `1px solid ${BORDER}` : "none",
          background: "transparent",
        }}>
        {step === 0 && (
          <button
            onClick={next}
            disabled={isLoadingData}
            className="w-full h-16 rounded-2xl flex items-center justify-center font-semibold text-white transition-all duration-150 active:scale-[0.99]"
            style={{
              fontSize: "1.05rem",
              background: isLoadingData
                ? "rgba(0,0,0,0.12)"
                : "linear-gradient(135deg, #1a3a5c 0%, #1e6ea6 100%)",
              boxShadow: isLoadingData
                ? "none"
                : "0 6px 28px rgba(26,58,92,0.22)",
            }}>
            {isLoadingData ? (
              <>
                <Loader2 size={18} className="animate-spin mr-2" />
                Loading…
              </>
            ) : (
              "Submit a Fleet Request"
            )}
          </button>
        )}

        {step >= 1 && step <= 4 && (
          <div className="flex gap-3">
            <button
              type="button"
              onClick={back}
              className="h-14 px-7 rounded-2xl flex items-center justify-center gap-2 font-semibold transition-all duration-100 active:scale-[0.98]"
              style={{
                background: "rgba(0,0,0,0.07)",
                color: DARK,
                fontSize: "0.95rem",
                flexShrink: 0,
              }}>
              <ArrowLeft size={16} /> Back
            </button>

            {step < totalSteps ? (
              <button
                type="button"
                onClick={next}
                className="flex-1 h-14 rounded-2xl flex items-center justify-center gap-2 font-semibold text-white transition-all duration-100 active:scale-[0.98]"
                style={{
                  fontSize: "0.95rem",
                  background:
                    "linear-gradient(135deg, #1a3a5c 0%, #1e6ea6 100%)",
                  boxShadow: "0 4px 20px rgba(26,58,92,0.22)",
                }}>
                Continue <ArrowRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 h-14 rounded-2xl flex items-center justify-center gap-2 font-semibold text-white transition-all duration-100 active:scale-[0.98]"
                style={{
                  fontSize: "0.95rem",
                  background:
                    "linear-gradient(135deg, #1a3a5c 0%, #1e6ea6 100%)",
                  boxShadow: "0 4px 20px rgba(26,58,92,0.22)",
                  opacity: isSubmitting ? 0.7 : 1,
                }}>
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Submitting…
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    Submit Request
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {step === 5 && (
          <button
            onClick={reset}
            className="w-full h-16 rounded-2xl flex items-center justify-center gap-2 font-semibold text-white transition-all duration-150 active:scale-[0.99]"
            style={{
              fontSize: "1.05rem",
              background: "linear-gradient(135deg, #1a3a5c 0%, #1e6ea6 100%)",
              boxShadow: "0 6px 28px rgba(26,58,92,0.22)",
            }}>
            Submit Another Request
          </button>
        )}
      </div>
    </div>
  );
}
