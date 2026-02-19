import { Outlet, useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { C, Tooltip } from "./Layout";

export default function SecurityLayout() {
  const navigate = useNavigate();

  function handleLogout() {
    localStorage.removeItem("bp_token");
    localStorage.removeItem("bp_user");
    navigate("/login", { replace: true });
  }

  return (
    <div
      className="flex h-screen w-full p-3"
      style={{ fontFamily: "'Inter', sans-serif", background: C.sidebar }}>
      <div
        className="flex flex-col flex-1 overflow-hidden"
        style={{ background: C.bg, borderRadius: "20px" }}>
        {/* Top nav — logo + logout only */}
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
          <Tooltip label="Sign Out" position="bottom">
            <button
              onClick={handleLogout}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-100"
              style={{ color: "#EA7957" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(0,0,0,0.06)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}>
              <LogOut size={15} strokeWidth={1.8} />
            </button>
          </Tooltip>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <Outlet />
        </div>
      </div>

      <style>{`
        @keyframes secFadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        * { scrollbar-width: thin; scrollbar-color: rgba(0,0,0,0.08) transparent; }
        *::-webkit-scrollbar { width: 4px; }
        *::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.09); border-radius: 99px; }
      `}</style>
    </div>
  );
}
