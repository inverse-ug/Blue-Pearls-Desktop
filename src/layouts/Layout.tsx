import { useState, useEffect, useRef } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Truck,
  Briefcase,
  MoreHorizontal,
  Search,
  Bell,
  MessageSquare,
  Settings,
  LogOut,
  Calendar,
  FileBarChart2,
  UserCircle2,
  Contact,
  Wallet,
  Route,
} from "lucide-react";

// ── Design tokens ──────────────────────────────────────────────────────────
export const C = {
  dark: "#2C2C2C",
  green: "#8CA573",
  yellow: "#E1BA58",
  blue: "#7A80F0",
  red: "#EA7957",
  bg: "#F8F9FA",
  card: "#FFFFFF",
  sidebar: "#FFFFFF",
  muted: "#6B7280",
  border: "#E5E7EB",
  text: "#1F2937",
  textLight: "#6B7280",
  hover: "#F3F4F6",
};

// ── Nav items ──────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  {
    id: "dashboard",
    label: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
  },
  { id: "staff", label: "Staff", path: "/staff", icon: Users },
  { id: "vehicles", label: "Vehicles", path: "/vehicles", icon: Truck },
  { id: "clients", label: "Clients", path: "/clients", icon: Contact },
  { id: "routes", label: "Lanes", path: "/routes", icon: Route },
  { id: "jobs", label: "Jobs", path: "/jobs", icon: Briefcase },
  { id: "accounts", label: "Accounts", path: "/accounts", icon: UserCircle2 },
];

const MORE_ITEMS = [
  { id: "finances", label: "Finances", path: "/finances", icon: Wallet },
  { id: "reports", label: "Reports", path: "/reports", icon: FileBarChart2 },
  { id: "calendar", label: "Calendar", path: "/calendar", icon: Calendar },
];

// ── Tooltip ────────────────────────────────────────────────────────────────
export function Tooltip({
  label,
  children,
  position = "right",
  disabled = false,
}: {
  label: string;
  children: React.ReactNode;
  position?: "right" | "bottom";
  disabled?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div
      className="relative flex items-center justify-center"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}>
      {children}
      {visible && !disabled && (
        <div
          className="absolute z-50 whitespace-nowrap px-2.5 py-1.5 rounded-lg text-xs font-medium text-white pointer-events-none"
          style={{
            background: C.dark,
            boxShadow: "0 4px 14px rgba(0,0,0,0.22)",
            animation: "fadeIn 0.1s ease",
            ...(position === "right"
              ? {
                  left: "calc(100% + 10px)",
                  top: "50%",
                  transform: "translateY(-50%)",
                }
              : {
                  top: "calc(100% + 8px)",
                  left: "50%",
                  transform: "translateX(-50%)",
                }),
          }}>
          {label}
          {position === "right" && (
            <div
              className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent"
              style={{ borderRightColor: C.dark }}
            />
          )}
          {position === "bottom" && (
            <div
              className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent"
              style={{ borderBottomColor: C.dark }}
            />
          )}
        </div>
      )}
    </div>
  );
}

// ── Nav Loading Bar ────────────────────────────────────────────────────────
function NavLoader({ active }: { active: boolean }) {
  const [width, setWidth] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (active) {
      setVisible(true);
      setWidth(0);
      const t1 = setTimeout(() => setWidth(70), 50);
      const t2 = setTimeout(() => setWidth(90), 400);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    } else if (visible) {
      setWidth(100);
      const t = setTimeout(() => setVisible(false), 350);
      return () => clearTimeout(t);
    }
  }, [active]);

  if (!visible) return null;
  return (
    <div className="fixed top-0 left-0 right-0 z-[100] h-[3px]">
      <div
        className="h-full rounded-full"
        style={{
          width: `${width}%`,
          background: `linear-gradient(90deg, ${C.blue}, ${C.green})`,
          transition: width === 100 ? "width 0.2s ease" : "width 0.5s ease",
          boxShadow: `0 0 10px ${C.blue}90`,
        }}
      />
    </div>
  );
}

// ── More Popover ───────────────────────────────────────────────────────────
function MorePopover({
  activePath,
  expanded,
}: {
  activePath: string;
  expanded: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const isActive = MORE_ITEMS.some((i) => i.path === activePath);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative flex justify-center">
      <Tooltip label="More" position="right" disabled={expanded}>
        <button
          onClick={() => setOpen(!open)}
          className="h-10 rounded-xl flex items-center gap-3"
          style={{
            padding: "0 10px",
            width: expanded ? "160px" : "40px",
            overflow: "hidden",
            background: isActive || open ? C.hover : "transparent",
            color: isActive || open ? C.blue : C.textLight,
            transition:
              "background 0.15s ease, color 0.15s ease, width 0.25s cubic-bezier(0.4,0,0.2,1)",
          }}>
          <MoreHorizontal size={19} className="flex-shrink-0" />
          <span
            className="text-sm font-medium whitespace-nowrap"
            style={{
              opacity: expanded ? 1 : 0,
              transition: "opacity 0.15s ease",
              pointerEvents: "none",
            }}>
            More
          </span>
        </button>
      </Tooltip>
      {open && (
        <div
          className="absolute left-full ml-3 bottom-0 z-50 w-44 rounded-xl overflow-hidden py-1.5"
          style={{
            background: C.card,
            boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
            border: `1px solid ${C.border}`,
            animation: "fadeIn 0.12s ease",
          }}>
          {MORE_ITEMS.map(({ path, icon: Icon, label }) => (
            <button
              key={path}
              onClick={() => {
                navigate(path);
                setOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors"
              style={{ color: C.text, background: "transparent" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = C.hover)}
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }>
              <Icon size={14} style={{ color: C.muted }} />
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Top bar icon button ────────────────────────────────────────────────────
function IconBtn({
  icon: Icon,
  tip,
}: {
  icon: React.ElementType;
  tip: string;
}) {
  return (
    <Tooltip label={tip} position="bottom">
      <button
        className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-150"
        style={{
          background: C.hover,
          color: C.textLight,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = C.border;
          e.currentTarget.style.color = C.blue;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = C.hover;
          e.currentTarget.style.color = C.textLight;
        }}>
        <Icon size={16} strokeWidth={1.75} />
      </button>
    </Tooltip>
  );
}

// ── Expand Toggle ──────────────────────────────────────────────────────────
function ExpandToggle({
  expanded,
  onToggle,
}: {
  expanded: boolean;
  onToggle: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onToggle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="flex items-center justify-center"
      style={{
        width: "20px",
        height: "44px",
        borderRadius: "6px",
        background: hovered ? C.hover : C.card,
        border: `1px solid ${hovered ? C.blue : C.border}`,
        boxShadow: hovered ? "0 0 0 3px rgba(122,128,240,0.1)" : "none",
        transition: "all 0.18s ease",
        cursor: "pointer",
        color: hovered ? C.blue : C.textLight,
      }}
      title={expanded ? "Collapse sidebar" : "Expand sidebar"}>
      <svg
        width="9"
        height="9"
        viewBox="0 0 8 8"
        fill="none"
        style={{
          transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
          transition: "transform 0.25s ease",
        }}>
        <path
          d="M2 1.5L5.5 4L2 6.5"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

// ── Nav Button ─────────────────────────────────────────────────────────────
function NavButton({
  isActive,
  onClick,
  expanded,
  label,
  icon: Icon,
}: {
  isActive: boolean;
  onClick: () => void;
  expanded: boolean;
  label: string;
  icon: React.ElementType;
}) {
  const [hovered, setHovered] = useState(false);
  const bg = isActive ? C.hover : hovered ? C.hover : "transparent";
  const color = isActive ? C.blue : hovered ? C.text : C.textLight;

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="h-10 rounded-xl flex items-center gap-3"
      style={{
        padding: "0 10px",
        width: expanded ? "160px" : "40px",
        background: bg,
        color,
        transition:
          "background 0.15s ease, color 0.15s ease, width 0.25s cubic-bezier(0.4,0,0.2,1)",
        overflow: "hidden",
      }}>
      <Icon
        size={19}
        className="flex-shrink-0"
        style={{
          transition: "transform 0.15s ease",
          transform: hovered && !isActive ? "scale(1.1)" : "scale(1)",
        }}
      />
      <span
        className="text-sm font-medium whitespace-nowrap"
        style={{
          opacity: expanded ? 1 : 0,
          transition: "opacity 0.15s ease",
          pointerEvents: "none",
        }}>
        {label}
      </span>
    </button>
  );
}

// ── Layout ─────────────────────────────────────────────────────────────────
export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [navigating, setNavigating] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);

  const activePath = location.pathname;
  const activeItem = [...NAV_ITEMS, ...MORE_ITEMS].find(
    (i) => i.path === activePath,
  );
  const pageTitle = activeItem?.label ?? "Dashboard";

  const SIDEBAR_W_COLLAPSED = 58;
  const SIDEBAR_W_EXPANDED = 180;
  const sidebarW = sidebarExpanded ? SIDEBAR_W_EXPANDED : SIDEBAR_W_COLLAPSED;

  function handleNav(path: string) {
    if (path === activePath) return;
    setNavigating(true);
    setTimeout(() => {
      navigate(path);
      setNavigating(false);
    }, 400);
  }

  function handleRefresh() {
    setRefreshKey((k) => k + 1);
  }

  function handleLogout() {
    localStorage.removeItem("bp_token");
    localStorage.removeItem("bp_user");
    navigate("/login");
  }

  return (
    <div
      className="flex flex-col h-screen w-full overflow-hidden"
      style={{ fontFamily: "'Inter', sans-serif", background: C.bg }}>
      <NavLoader active={navigating} />

      {/* ── Top bar ── */}
      <header
        className="flex items-center h-[60px] flex-shrink-0 px-5"
        style={{ background: C.card, borderBottom: `1px solid ${C.border}` }}>
        <div
          className="flex items-center justify-center flex-shrink-0 transition-all duration-300"
          style={{ width: `${SIDEBAR_W_COLLAPSED}px` }}>
          <img
            src="/logo.png"
            alt="Blue Pearls"
            className="w-9 h-9 rounded-xl object-contain"
          />
        </div>

        <h1
          className="flex-1 text-base font-bold tracking-tight pl-3"
          style={{ color: C.text }}>
          {pageTitle}
        </h1>

        <div className="mr-2">
          <Tooltip label="Refresh" position="bottom">
            <button
              onClick={handleRefresh}
              className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-150"
              style={{ background: C.hover, color: C.textLight }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = C.border;
                e.currentTarget.style.color = C.blue;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = C.hover;
                e.currentTarget.style.color = C.textLight;
              }}>
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round">
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                <path d="M21 3v5h-5" />
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                <path d="M8 16H3v5" />
              </svg>
            </button>
          </Tooltip>
        </div>

        <div className="flex items-center gap-2 mr-1">
          <IconBtn icon={Search} tip="Search" />
          <IconBtn icon={Bell} tip="Notifications" />
          <IconBtn icon={MessageSquare} tip="Messages" />
          <IconBtn icon={Settings} tip="Settings" />
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden p-3">
        {/* Sidebar + toggle wrapper */}
        <div
          className="relative flex-shrink-0 flex"
          style={{
            width: `${sidebarW}px`,
            transition: "width 0.25s cubic-bezier(0.4,0,0.2,1)",
          }}>
          <aside
            className="flex flex-col items-center py-4 w-full"
            style={{
              background: C.card,
              borderRadius: "20px",
              border: `1px solid ${C.border}`,
            }}>
            <nav className="flex flex-col items-center gap-2.5 flex-1 w-full py-0">
              {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
                const isActive = activePath === path;
                return (
                  <Tooltip
                    key={path}
                    label={label}
                    position="right"
                    disabled={sidebarExpanded}>
                    <NavButton
                      isActive={isActive}
                      onClick={() => handleNav(path)}
                      expanded={sidebarExpanded}
                      label={label}
                      icon={Icon}
                    />
                  </Tooltip>
                );
              })}
              <MorePopover activePath={activePath} expanded={sidebarExpanded} />
            </nav>

            {/* Logout */}
            <div className="flex justify-center w-full">
              <Tooltip
                label="Log Out"
                position="right"
                disabled={sidebarExpanded}>
                <NavButton
                  isActive={false}
                  onClick={handleLogout}
                  expanded={sidebarExpanded}
                  label="Log Out"
                  icon={LogOut}
                />
              </Tooltip>
            </div>
          </aside>

          {/* Expand toggle — pinned to right edge of the sidebar wrapper, overflows into content gap */}
          <div
            className="absolute top-1/2 -translate-y-1/2 z-30"
            style={{ right: "-8px" }}>
            <ExpandToggle
              expanded={sidebarExpanded}
              onToggle={() => setSidebarExpanded((v) => !v)}
            />
          </div>
        </div>

        {/* Content area */}
        <div
          key={refreshKey}
          className="flex-1 overflow-hidden ml-3"
          style={{
            background: C.card,
            borderRadius: "20px",
            border: `1px solid ${C.border}`,
          }}>
          <Outlet />
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.96); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        * {
          scrollbar-width: thin;
          scrollbar-color: ${C.muted} transparent;
        }
        *::-webkit-scrollbar { width: 5px; height: 5px; }
        *::-webkit-scrollbar-track { background: transparent; }
        *::-webkit-scrollbar-thumb {
          background: ${C.muted}20;
          border-radius: 99px;
        }
        *::-webkit-scrollbar-thumb:hover { background: ${C.muted}40; }
        *::-webkit-scrollbar-corner { background: transparent; }
      `}</style>
    </div>
  );
}
