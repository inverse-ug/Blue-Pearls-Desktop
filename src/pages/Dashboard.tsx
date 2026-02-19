import { useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Calendar,
  ChevronDown,
  Package,
  MapPin,
  Wallet,
  Briefcase,
  Truck,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  CartesianGrid,
} from "recharts";
import { C } from "../layouts/Layout";

// ── Greetings ───────────────────────────────────────────────────────────────
const GREETINGS = {
  morning: [
    "Rise and shine, {name}!",
    "Good morning, {name}!",
    "Morning, {name}!",
    "Early bird, {name}!",
    "Up and at it, {name}!",
    "Morning, {name}! Ready to roll.",
    "Good morning, {name}! Fleet's live.",
    "Morning, {name}! Roads are clear.",
    "Let's go, {name}! Good morning.",
    "Good morning, {name}! Dispatch is up.",
    "Morning, {name}! Convoy's moving.",
    "Bright and early, {name}!",
  ],
  afternoon: [
    "Good afternoon, {name}!",
    "Afternoon, {name}!",
    "Halfway there, {name}!",
    "Good afternoon, {name}! On track.",
    "Afternoon, {name}! Fleet's rolling.",
    "Midday check-in, {name}!",
    "Good afternoon, {name}! Looking good.",
    "Afternoon, {name}! Keep it moving.",
    "Good afternoon, {name}! Solid day.",
    "Afternoon, {name}! Numbers are up.",
    "Good afternoon, {name}! Routes clear.",
    "Afternoon, {name}! On schedule.",
  ],
  evening: [
    "Good evening, {name}!",
    "Evening, {name}!",
    "Winding down, {name}!",
    "Good evening, {name}! Strong day.",
    "Evening, {name}! Fleet's heading in.",
    "Good evening, {name}! Day's logged.",
    "Evening, {name}! Numbers look solid.",
    "Good evening, {name}! Great work.",
    "Evening, {name}! Closing out well.",
    "Good evening, {name}! Well done.",
    "Evening, {name}! Day's in the books.",
    "Good evening, {name}! Day complete.",
  ],
  night: [
    "Night shift, {name}!",
    "Still at it, {name}?",
    "Good night, {name}!",
    "Late night, {name}!",
    "Burning bright, {name}!",
    "Midnight ops, {name}!",
    "Night check-in, {name}!",
    "Quiet hours, {name}.",
    "Night mode, {name}!",
    "Working late, {name}?",
    "Night owl, {name}!",
    "Dark hours, {name}. Stay sharp.",
  ],
};

function buildGreeting(name = "Andrew"): string {
  const h = new Date().getHours();
  const pool =
    h >= 5 && h < 12
      ? GREETINGS.morning
      : h >= 12 && h < 17
        ? GREETINGS.afternoon
        : h >= 17 && h < 21
          ? GREETINGS.evening
          : GREETINGS.night;
  // Use a fresh random each time this function is called (i.e. on every mount/refresh)
  const template = pool[Math.floor(Math.random() * pool.length)];
  return template.replace("{name}", name);
}

// ── Data ───────────────────────────────────────────────────────────────────
const deliveryTrendData = [
  { month: "Jan", delivered: 312, inTransit: 48, failed: 12 },
  { month: "Feb", delivered: 289, inTransit: 55, failed: 9 },
  { month: "Mar", delivered: 378, inTransit: 61, failed: 14 },
  { month: "Apr", delivered: 401, inTransit: 72, failed: 8 },
  { month: "May", delivered: 445, inTransit: 65, failed: 11 },
  { month: "Jun", delivered: 419, inTransit: 58, failed: 7 },
  { month: "Jul", delivered: 487, inTransit: 80, failed: 10 },
];

const revenueData = [
  { month: "Jan", revenue: 124000, expenses: 78000 },
  { month: "Feb", revenue: 108000, expenses: 72000 },
  { month: "Mar", revenue: 145000, expenses: 88000 },
  { month: "Apr", revenue: 162000, expenses: 91000 },
  { month: "May", revenue: 178000, expenses: 95000 },
  { month: "Jun", revenue: 155000, expenses: 86000 },
  { month: "Jul", revenue: 193000, expenses: 102000 },
];

const kpiData = [
  { month: "Jan", jobs: 82, revenue: 124, fuel: 38, maint: 14 },
  { month: "Feb", jobs: 76, revenue: 108, fuel: 34, maint: 18 },
  { month: "Mar", jobs: 94, revenue: 145, fuel: 42, maint: 12 },
  { month: "Apr", jobs: 101, revenue: 162, fuel: 45, maint: 16 },
  { month: "May", jobs: 112, revenue: 178, fuel: 48, maint: 11 },
  { month: "Jun", jobs: 98, revenue: 155, fuel: 43, maint: 9 },
  { month: "Jul", jobs: 121, revenue: 193, fuel: 52, maint: 13 },
];

const recentJobs = [
  {
    client: "Aga Khan Distributors",
    route: "Kampala → Nairobi",
    driver: "Moses Okello",
    amount: "+$4,800",
    status: "Delivered",
    type: "in",
  },
  {
    client: "MTN Uganda",
    route: "Kampala → Mombasa",
    driver: "David Ssemakula",
    amount: "+$7,200",
    status: "In Transit",
    type: "in",
  },
  {
    client: "Fuel & Lubricants Ltd",
    route: "Jinja → Kampala",
    driver: "Peter Mugisha",
    amount: "-$1,340",
    status: "Paid",
    type: "out",
  },
  {
    client: "Stanbic Logistics",
    route: "Kampala → Dar es Salaam",
    driver: "Joseph Katende",
    amount: "+$9,500",
    status: "Delivered",
    type: "in",
  },
  {
    client: "Vehicle Maintenance",
    route: "Fleet Service — Unit 07",
    driver: "Workshop",
    amount: "-$2,100",
    status: "Paid",
    type: "out",
  },
];

const statusColors: Record<string, string> = {
  Delivered: C.green,
  "In Transit": C.blue,
  Paid: C.muted,
  Pending: C.yellow,
  Failed: C.red,
};

// ── Donut Chart ────────────────────────────────────────────────────────────
function DonutChart({
  percent,
  color,
  size = 56,
}: {
  percent: number;
  color: string;
  size?: number;
}) {
  const sw = 7;
  const r = (size - sw * 2) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (percent / 100) * circ;
  return (
    <svg width={size} height={size} style={{ flexShrink: 0 }}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={C.border}
        strokeWidth={sw}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={sw}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dasharray 0.9s ease" }}
      />
    </svg>
  );
}

// ── Dashboard page ─────────────────────────────────────────────────────────
export default function Dashboard() {
  // useState initializer runs exactly once per mount.
  // Layout's refreshKey prop forces a full remount, so this re-randomises on refresh.
  const [greeting] = useState(() => buildGreeting());

  return (
    <div
      className="h-full overflow-auto px-6 pt-5 pb-6"
      style={{ scrollbarGutter: "stable" }}>
      <div className="flex gap-5 min-h-full">
        {/* ── Left column ── */}
        <div className="flex flex-col gap-4 flex-1 min-w-0">
          {/* Welcome */}
          <div style={{ animation: "fadeSlideUp 0.3s ease both" }}>
            <p
              className="text-xs font-medium mb-1.5"
              style={{ color: C.muted }}>
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
              {greeting}
            </h2>
          </div>

          {/* KPI cards */}
          <div className="grid grid-cols-4 gap-3">
            {[
              {
                label: "Total Revenue",
                value: "$193,000",
                change: "+8.4%",
                up: true,
                icon: Wallet,
                color: C.blue,
              },
              {
                label: "Active Jobs",
                value: "121",
                change: "+12.3%",
                up: true,
                icon: Briefcase,
                color: C.green,
              },
              {
                label: "Fleet Size",
                value: "34 Trucks",
                change: "2 in service",
                up: null,
                icon: Truck,
                color: C.yellow,
              },
              {
                label: "Deliveries",
                value: "487",
                change: "+9.7%",
                up: true,
                icon: Package,
                color: C.red,
              },
            ].map((kpi, i) => (
              <div
                key={i}
                className="rounded-2xl p-4"
                style={{
                  background: C.card,
                  border: `1px solid ${C.border}`,
                  animation: `fadeSlideUp 0.4s ease ${i * 0.07}s both`,
                }}>
                <div className="flex items-start justify-between mb-3">
                  <p className="text-xs font-medium" style={{ color: C.muted }}>
                    {kpi.label}
                  </p>
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ background: `${kpi.color}18` }}>
                    <kpi.icon size={13} style={{ color: kpi.color }} />
                  </div>
                </div>
                <p
                  className="text-xl font-bold mb-1.5"
                  style={{ color: C.dark }}>
                  {kpi.value}
                </p>
                <div className="flex items-center gap-1">
                  {kpi.up === true && (
                    <TrendingUp size={11} style={{ color: C.green }} />
                  )}
                  {kpi.up === false && (
                    <TrendingDown size={11} style={{ color: C.red }} />
                  )}
                  <span
                    className="text-xs font-medium"
                    style={{
                      color:
                        kpi.up === true
                          ? C.green
                          : kpi.up === false
                            ? C.red
                            : C.muted,
                    }}>
                    {kpi.change}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-2 gap-4">
            <div
              className="rounded-2xl p-4"
              style={{
                background: C.card,
                border: `1px solid ${C.border}`,
                animation: "fadeSlideUp 0.4s ease 0.22s both",
              }}>
              <p
                className="text-sm font-semibold mb-4"
                style={{ color: C.dark }}>
                Delivery Performance
              </p>
              <ResponsiveContainer width="100%" height={148}>
                <BarChart data={deliveryTrendData} barSize={8} barGap={2}>
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 10, fill: C.muted }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis hide />
                  <RechartsTooltip
                    contentStyle={{
                      background: C.dark,
                      border: "none",
                      borderRadius: 8,
                      color: "#fff",
                      fontSize: 11,
                    }}
                    cursor={{ fill: `${C.border}80` }}
                  />
                  <Bar
                    dataKey="delivered"
                    fill={C.green}
                    radius={[3, 3, 0, 0]}
                  />
                  <Bar
                    dataKey="inTransit"
                    fill={C.blue}
                    radius={[3, 3, 0, 0]}
                  />
                  <Bar dataKey="failed" fill={C.red} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className="flex items-center gap-4 mt-2">
                {[
                  { l: "Delivered", c: C.green },
                  { l: "In Transit", c: C.blue },
                  { l: "Failed", c: C.red },
                ].map(({ l, c }) => (
                  <div key={l} className="flex items-center gap-1.5">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ background: c }}
                    />
                    <span className="text-[10px]" style={{ color: C.muted }}>
                      {l}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div
              className="rounded-2xl p-4"
              style={{
                background: C.card,
                border: `1px solid ${C.border}`,
                animation: "fadeSlideUp 0.4s ease 0.27s both",
              }}>
              <p
                className="text-sm font-semibold mb-4"
                style={{ color: C.dark }}>
                Revenue vs Expenses
              </p>
              <ResponsiveContainer width="100%" height={148}>
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="revG" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={C.blue} stopOpacity={0.15} />
                      <stop offset="95%" stopColor={C.blue} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="expG" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={C.red} stopOpacity={0.12} />
                      <stop offset="95%" stopColor={C.red} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={C.border}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 10, fill: C.muted }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis hide />
                  <RechartsTooltip
                    contentStyle={{
                      background: C.dark,
                      border: "none",
                      borderRadius: 8,
                      color: "#fff",
                      fontSize: 11,
                    }}
                    formatter={(v: number | undefined) => [
                      `$${((v ?? 0) / 1000).toFixed(0)}k`,
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke={C.blue}
                    strokeWidth={2}
                    fill="url(#revG)"
                    dot={false}
                  />
                  <Area
                    type="monotone"
                    dataKey="expenses"
                    stroke={C.red}
                    strokeWidth={2}
                    fill="url(#expG)"
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
              <div className="flex items-center gap-4 mt-2">
                {[
                  { l: "Revenue", c: C.blue },
                  { l: "Expenses", c: C.red },
                ].map(({ l, c }) => (
                  <div key={l} className="flex items-center gap-1.5">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ background: c }}
                    />
                    <span className="text-[10px]" style={{ color: C.muted }}>
                      {l}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Jobs */}
          <div
            className="rounded-2xl p-4"
            style={{
              background: C.card,
              border: `1px solid ${C.border}`,
              animation: "fadeSlideUp 0.4s ease 0.32s both",
            }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold" style={{ color: C.dark }}>
                Recent Jobs
              </p>
              <button
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all duration-200"
                style={{
                  color: "#ffffff",
                  background:
                    "linear-gradient(135deg, #1a3a5c 0%, #1e6ea6 100%)",
                  boxShadow: "0 2px 8px rgba(26,58,92,0.25)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow =
                    "0 4px 14px rgba(26,58,92,0.4)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow =
                    "0 2px 8px rgba(26,58,92,0.25)";
                }}>
                Sort By: Date <ChevronDown size={11} />
              </button>
            </div>
            <div className="space-y-0.5">
              {recentJobs.map((job, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors hover:bg-[#F5F4EF]"
                  style={{
                    animation: `fadeSlideUp 0.35s ease ${0.36 + i * 0.05}s both`,
                  }}>
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{
                      background: `${statusColors[job.status] ?? C.muted}18`,
                    }}>
                    <MapPin
                      size={13}
                      style={{ color: statusColors[job.status] ?? C.muted }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-medium truncate"
                      style={{ color: C.dark }}>
                      {job.client}
                    </p>
                    <p className="text-xs truncate" style={{ color: C.muted }}>
                      {job.route}
                    </p>
                  </div>
                  <p
                    className="text-xs flex-shrink-0 hidden lg:block"
                    style={{ color: C.muted }}>
                    {job.driver}
                  </p>
                  <p
                    className="text-sm font-semibold w-20 text-right flex-shrink-0"
                    style={{ color: job.type === "in" ? C.green : C.red }}>
                    {job.amount}
                  </p>
                  <span
                    className="text-xs font-medium px-2.5 py-1 rounded-lg flex-shrink-0 w-20 text-center"
                    style={{
                      background: `${statusColors[job.status] ?? C.muted}18`,
                      color: statusColors[job.status] ?? C.muted,
                    }}>
                    {job.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* end left column */}

        {/* ── Right column ── */}
        <div
          className="flex flex-col gap-4 w-[268px] flex-shrink-0 rounded-2xl p-4"
          style={{
            background: C.card,
            border: `1px solid ${C.border}`,
            animation: "fadeSlideUp 0.4s ease 0.1s both",
            alignSelf: "flex-start",
          }}>
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold" style={{ color: C.dark }}>
              KPIs
            </p>
            <button
              className="flex items-center gap-1 text-[11px] font-medium px-2 py-1.5 rounded-lg border"
              style={{ color: C.muted, borderColor: C.border }}>
              <Calendar size={10} /> Jan – Jul 2024 <ChevronDown size={10} />
            </button>
          </div>

          <div>
            <p className="text-xs font-semibold mb-3" style={{ color: C.dark }}>
              Performance Overview
            </p>
            <ResponsiveContainer width="100%" height={128}>
              <BarChart data={kpiData} barSize={5} barGap={1}>
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 9, fill: C.muted }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis hide />
                <RechartsTooltip
                  contentStyle={{
                    background: C.dark,
                    border: "none",
                    borderRadius: 8,
                    color: "#fff",
                    fontSize: 10,
                  }}
                  cursor={{ fill: `${C.border}80` }}
                />
                <Bar dataKey="jobs" fill={C.green} radius={[2, 2, 0, 0]} />
                <Bar dataKey="revenue" fill={C.blue} radius={[2, 2, 0, 0]} />
                <Bar dataKey="fuel" fill={C.yellow} radius={[2, 2, 0, 0]} />
                <Bar dataKey="maint" fill={C.red} radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-x-2 gap-y-1 mt-2">
              {[
                { label: "Jobs", color: C.green },
                { label: "Revenue (k)", color: C.blue },
                { label: "Fuel", color: C.yellow },
                { label: "Maintenance", color: C.red },
              ].map((l) => (
                <div key={l.label} className="flex items-center gap-1.5">
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: l.color }}
                  />
                  <span className="text-[10px]" style={{ color: C.muted }}>
                    {l.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="h-px" style={{ background: C.border }} />

          {[
            {
              label: "On-Time Delivery",
              percent: 89,
              color: C.green,
              value: "432 / 487 jobs",
              bg: `${C.green}12`,
            },
            {
              label: "Fleet Utilisation",
              percent: 76,
              color: C.yellow,
              value: "26 / 34 trucks",
              bg: `${C.yellow}12`,
            },
            {
              label: "Client Satisfaction",
              percent: 94,
              color: C.blue,
              value: "4.7 / 5.0 rating",
              bg: `${C.blue}12`,
            },
            {
              label: "Invoice Collection",
              percent: 68,
              color: C.red,
              value: "$131k / $193k",
              bg: `${C.red}12`,
            },
          ].map((kpi, i) => (
            <div
              key={i}
              className="rounded-xl p-3 flex items-center gap-3"
              style={{
                background: kpi.bg,
                animation: `fadeSlideUp 0.35s ease ${0.42 + i * 0.07}s both`,
              }}>
              <div className="relative flex-shrink-0">
                <DonutChart percent={kpi.percent} color={kpi.color} size={56} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span
                    className="text-[11px] font-bold"
                    style={{ color: kpi.color }}>
                    {kpi.percent}%
                  </span>
                </div>
              </div>
              <div className="min-w-0">
                <p
                  className="text-xs font-semibold leading-tight mb-1"
                  style={{ color: C.dark }}>
                  {kpi.label}
                </p>
                <p
                  className="text-[11px] font-medium truncate"
                  style={{ color: C.muted }}>
                  {kpi.value}
                </p>
              </div>
            </div>
          ))}

          <button
            className="flex items-center justify-center gap-1.5 w-full py-2 rounded-xl text-xs font-semibold transition-all duration-200"
            style={{
              color: "#ffffff",
              background: "linear-gradient(135deg, #1a3a5c 0%, #1e6ea6 100%)",
              boxShadow: "0 2px 10px rgba(26,58,92,0.25)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = "0 4px 16px rgba(26,58,92,0.4)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow =
                "0 2px 10px rgba(26,58,92,0.25)";
            }}>
            View full report <ArrowUpRight size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}
