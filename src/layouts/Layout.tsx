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
} from "lucide-react";

// ── Design tokens ──────────────────────────────────────────────────────────
export const C = {
  dark: "#2C2C2C",
  green: "#8CA573",
  yellow: "#E1BA58",
  blue: "#7A80F0",
  red: "#EA7957",
  bg: "#F0EFE9",
  card: "#FFFFFF",
  sidebar: "#2C2C2C",
  muted: "#9E9E9E",
  border: "#E8E8E8",
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
  { id: "jobs", label: "Jobs", path: "/jobs", icon: Briefcase },
  { id: "accounts", label: "Accounts", path: "/accounts", icon: UserCircle2 },
  { id: "clients", label: "Clients", path: "/clients", icon: Contact },
  { id: "finances", label: "Finances", path: "/finances", icon: Wallet },
];

const MORE_ITEMS = [
  { id: "reports", label: "Reports", path: "/reports", icon: FileBarChart2 },
  { id: "calendar", label: "Calendar", path: "/calendar", icon: Calendar },
];

// ── Tooltip ────────────────────────────────────────────────────────────────
export function Tooltip({
  label,
  children,
  position = "right",
}: {
  label: string;
  children: React.ReactNode;
  position?: "right" | "bottom";
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div
      className="relative flex items-center justify-center"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}>
      {children}
      {visible && (
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
function MorePopover({ activePath }: { activePath: string }) {
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
    <div ref={ref} className="relative">
      <Tooltip label="More" position="right">
        <button
          onClick={() => setOpen(!open)}
          className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-150"
          style={{
            background:
              isActive || open ? "rgba(255,255,255,0.12)" : "transparent",
            color: isActive || open ? "#fff" : "rgba(255,255,255,0.42)",
          }}>
          <MoreHorizontal size={19} />
        </button>
      </Tooltip>
      {open && (
        <div
          className="absolute left-full ml-3 bottom-0 z-50 w-44 rounded-xl overflow-hidden py-1.5"
          style={{
            background: C.card,
            boxShadow: "0 8px 32px rgba(0,0,0,0.14)",
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
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-[#F5F4EF]"
              style={{ color: C.dark }}>
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
          background: "rgba(255,255,255,0.07)",
          color: "rgba(255,255,255,0.55)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(255,255,255,0.14)";
          e.currentTarget.style.color = "#ffffff";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "rgba(255,255,255,0.07)";
          e.currentTarget.style.color = "rgba(255,255,255,0.55)";
        }}>
        <Icon size={16} strokeWidth={1.75} />
      </button>
    </Tooltip>
  );
}

// ── Layout ─────────────────────────────────────────────────────────────────
export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [navigating, setNavigating] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const activePath = location.pathname;

  // Page title derived from current path
  const activeItem = [...NAV_ITEMS, ...MORE_ITEMS].find(
    (i) => i.path === activePath,
  );
  const pageTitle = activeItem?.label ?? "Dashboard";

  function handleNav(path: string) {
    if (path === activePath) return;
    setNavigating(true);
    // Small delay so the loader is visible, then navigate (React Router — no reload)
    setTimeout(() => {
      navigate(path);
      setNavigating(false);
    }, 400);
  }

  function handleRefresh() {
    // Incrementing the key unmounts and remounts <Outlet />,
    // giving each page a brand new mount — so useMemo re-runs,
    // greeting re-randomises, data re-fetches, etc.
    setRefreshKey((k) => k + 1);
  }

  return (
    <div
      className="flex flex-col h-screen w-full overflow-hidden"
      style={{ fontFamily: "'Inter', sans-serif", background: C.sidebar }}>
      <NavLoader active={navigating} />

      {/* ── Top bar ── */}
      <header className="flex items-center h-[60px] flex-shrink-0 px-5">
        {/* Logo */}
        <div className="w-[58px] flex items-center justify-center flex-shrink-0">
          <img
            src="/logo.png"
            alt="Blue Pearls"
            className="w-9 h-9 rounded-xl object-contain"
          />
        </div>

        {/* Page title */}
        <h1 className="flex-1 text-white text-base font-bold tracking-tight pl-3">
          {pageTitle}
        </h1>

        {/* Refresh */}
        <div className="mr-2">
          <Tooltip label="Refresh" position="bottom">
            <button
              onClick={handleRefresh}
              className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-150"
              style={{
                background: "rgba(255,255,255,0.07)",
                color: "rgba(255,255,255,0.45)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.14)";
                e.currentTarget.style.color = "#ffffff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.07)";
                e.currentTarget.style.color = "rgba(255,255,255,0.45)";
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

        {/* Action icons */}
        <div className="flex items-center gap-2 mr-1">
          <IconBtn icon={Search} tip="Search" />
          <IconBtn icon={Bell} tip="Notifications" />
          <IconBtn icon={MessageSquare} tip="Messages" />
          <IconBtn icon={Settings} tip="Settings" />
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden px-3 pb-3">
        {/* Sidebar */}
        <aside className="flex flex-col items-center py-4 w-[58px] flex-shrink-0">
          <nav className="flex flex-col items-center gap-2.5 flex-1">
            {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
              const isActive = activePath === path;
              return (
                <Tooltip key={path} label={label} position="right">
                  <button
                    onClick={() => handleNav(path)}
                    className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-150"
                    style={{
                      background: isActive
                        ? "rgba(255,255,255,0.13)"
                        : "transparent",
                      color: isActive ? "#ffffff" : "rgba(255,255,255,0.42)",
                    }}>
                    <Icon size={19} />
                  </button>
                </Tooltip>
              );
            })}
            <MorePopover activePath={activePath} />
          </nav>

          {/* Logout */}
          <Tooltip label="Log Out" position="right">
            <button
              onClick={() => navigate("/login")}
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
              style={{ color: "rgba(255,255,255,0.32)" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = "rgba(255,255,255,0.75)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = "rgba(255,255,255,0.32)")
              }>
              <LogOut size={18} />
            </button>
          </Tooltip>
        </aside>

        {/* Rounded content area — Outlet renders the page here */}
        {/* refreshKey forces a true unmount+remount of the page on refresh */}
        <div
          key={refreshKey}
          className="flex-1 overflow-hidden"
          style={{ background: C.bg, borderRadius: "20px" }}>
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
          scrollbar-color: rgba(44,44,44,0.12) transparent;
        }
        *::-webkit-scrollbar { width: 5px; height: 5px; }
        *::-webkit-scrollbar-track { background: transparent; }
        *::-webkit-scrollbar-thumb {
          background: rgba(44,44,44,0.13);
          border-radius: 99px;
        }
        *::-webkit-scrollbar-thumb:hover { background: rgba(44,44,44,0.28); }
        *::-webkit-scrollbar-corner { background: transparent; }
      `}</style>
    </div>
  );
}
