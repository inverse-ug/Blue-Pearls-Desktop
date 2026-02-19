import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { RefreshCw, MessageSquare, Settings, LogOut } from "lucide-react";
import { C, Tooltip } from "./Layout";

export default function ImplantLayout() {
  const navigate = useNavigate();
  const [refreshKey, setRefreshKey] = useState(0);

  function handleLogout() {
    localStorage.removeItem("bp_token");
    localStorage.removeItem("bp_user");
    navigate("/login", { replace: true });
  }

  return (
    <div
      className="flex h-screen w-full p-3"
      style={{ fontFamily: "'Inter', sans-serif", background: C.sidebar }}>
      {/* Everything inside the warm card */}
      <div
        key={refreshKey}
        className="flex flex-col flex-1 overflow-hidden"
        style={{ background: C.bg, borderRadius: "20px" }}>
        {/* Top nav */}
        <header
          className="flex items-center flex-shrink-0 px-10 h-[60px]"
          style={{ borderBottom: `1px solid rgba(0,0,0,0.07)` }}>
          <div className="flex items-center gap-2.5">
            <img
              src="/logo.png"
              alt="Blue Pearls"
              className="w-7 h-7 rounded-lg object-contain"
            />
            <span className="text-sm font-semibold" style={{ color: C.dark }}>
              Blue Pearls
            </span>
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-0.5">
            <NavBtn
              icon={RefreshCw}
              tip="Refresh"
              onClick={() => setRefreshKey((k) => k + 1)}
            />
            <NavBtn icon={MessageSquare} tip="Messages" onClick={() => {}} />
            <NavBtn icon={Settings} tip="Settings" onClick={() => {}} />
            <NavBtn
              icon={LogOut}
              tip="Sign Out"
              onClick={handleLogout}
              danger
            />
          </div>
        </header>

        {/* Scrollable content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <Outlet />
        </div>
      </div>

      <style>{`
        @keyframes implantFadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes implantStepIn {
          from { opacity: 0; transform: translateX(32px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes implantStepBack {
          from { opacity: 0; transform: translateX(-32px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        * { scrollbar-width: thin; scrollbar-color: rgba(0,0,0,0.08) transparent; }
        *::-webkit-scrollbar { width: 4px; }
        *::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.09); border-radius: 99px; }
      `}</style>
    </div>
  );
}

function NavBtn({
  icon: Icon,
  tip,
  onClick,
  danger = false,
}: {
  icon: React.ElementType;
  tip: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <Tooltip label={tip} position="bottom">
      <button
        onClick={onClick}
        className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-100"
        style={{ color: danger ? "#EA7957" : "#bbb" }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(0,0,0,0.06)";
          e.currentTarget.style.color = danger ? "#EA7957" : "#333";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.color = danger ? "#EA7957" : "#bbb";
        }}>
        <Icon size={15} strokeWidth={1.8} />
      </button>
    </Tooltip>
  );
}
