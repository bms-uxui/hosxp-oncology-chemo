import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router";
import {
  FlaskConical, Pill, Home,
  Settings, Receipt, LogOut,
  Bell, ChevronDown, X,
  Stethoscope,
} from "lucide-react";
import { useOnc, roleLabels, roleInitials, roleEnglish, roleColor, type OncRole } from "./OncContext";
import { Badge } from "@heroui/react";

/* ══════════════════════════════════════════════
   OncLayout — Sidebar + Notification panel
   ══════════════════════════════════════════════ */

type NavItem = {
  label: string;
  icon: React.ElementType;
  to: string;
  end?: boolean;
  roles?: OncRole[];
};

const navItems: NavItem[] = [
  { label: "หน้าหลัก", icon: Home, to: "/onc", end: true },
  { label: "บันทึกการให้ยา", icon: Stethoscope, to: "/onc/administration", roles: ["CHEMO_NURSE", "ONC_DOCTOR"] },
  { label: "สูตรยาเคมีบำบัด", icon: FlaskConical, to: "/onc/regimen", roles: ["ONC_PHARMACIST"] },
  { label: "ค่าใช้จ่าย", icon: Receipt, to: "/onc/billing", roles: ["BILLING_OFFICER", "ADMIN"] },
  { label: "ตั้งค่าระบบ", icon: Settings, to: "/onc/settings", roles: ["ADMIN"] },
];

export default function OncLayout() {
  const { role, setRole, notifications, unreadCount, markNotificationRead } = useOnc();
  const [roleOpen, setRoleOpen] = useState(false);
  const [notiOpen, setNotiOpen] = useState(false);
  const navigate = useNavigate();
  const myNotifications = notifications.filter(n => n.targetRole === role);
  const visibleNav = navItems.filter(item => !item.roles || item.roles.includes(role));

  return (
    <div className="flex h-screen overflow-hidden gap-4 p-4">

      {/* ══════════ Sidebar ══════════ */}
      <aside className="hidden lg:flex w-56 xl:w-60 shrink-0 rounded-3xl flex-col overflow-hidden"
        style={{ background: "#674BB3" }}>

        {/* Logo at top */}
        <div className="flex items-center gap-3 px-5 pt-6 pb-4">
          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0">
            <Pill size={18} className="text-[#674BB3]" />
          </div>
          <div>
            <p className="text-[10px] font-medium text-white/60 leading-tight">HOSxP</p>
            <p className="text-sm font-bold text-white leading-tight">Oncology Chemo</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
          {visibleNav.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
                  isActive
                    ? "bg-[#FF8654] text-white shadow-sm"
                    : "text-white/80 hover:bg-white/10"
                }`
              }>
              <item.icon size={18} strokeWidth={1.8} />
              <span>{item.label}</span>
            </NavLink>
          ))}

          {/* Notification nav item */}
          <button onClick={() => setNotiOpen(!notiOpen)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all text-left ${
              notiOpen ? "bg-[#FF8654] text-white shadow-sm" : "text-white/80 hover:bg-white/10"
            }`}>
            <Bell size={18} strokeWidth={1.8} />
            <span className="flex-1">การแจ้งเตือน</span>
            {unreadCount > 0 && (
              <span className="text-[10px] font-bold bg-red-500 text-white min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1">{unreadCount}</span>
            )}
          </button>
        </nav>

        {/* User / Role at bottom */}
        <div className="px-3 pb-4 pt-2">
          <div className="relative">
            <button onClick={() => setRoleOpen(!roleOpen)}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-white/10 transition-all text-left"
              style={{ background: "#563AA4" }}>
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                style={{ background: roleColor[role] }}>
                {roleInitials[role]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white truncate leading-tight">{roleLabels[role]}</p>
                <p className="text-[10px] text-white/50 leading-tight">{roleEnglish[role]}</p>
              </div>
              <ChevronDown size={14} className="text-white/50 shrink-0" />
            </button>

            {roleOpen && (
              <div className="absolute left-0 bottom-full mb-2 bg-white rounded-2xl shadow-xl z-50 py-2 w-full">
                <p className="px-4 py-1.5 text-[10px] text-text-secondary uppercase tracking-widest font-bold">เปลี่ยน Role</p>
                {(Object.keys(roleLabels) as OncRole[]).map((r) => (
                  <button key={r}
                    onClick={() => { setRole(r); setRoleOpen(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-all text-left ${
                      role === r ? "bg-onc/5" : ""
                    }`}>
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0"
                      style={{ background: role === r ? roleColor[r] : "#94A3B8" }}>
                      {roleInitials[r]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-text leading-tight truncate">{roleLabels[r]}</p>
                      <p className="text-[10px] text-text-secondary">{roleEnglish[r]}</p>
                    </div>
                  </button>
                ))}
                <div className="border-t border-gray-100 mt-1 pt-1">
                  <button
                    onClick={() => { setRoleOpen(false); navigate("/onc/login"); }}
                    className="w-full flex items-center gap-3 px-4 py-2 hover:bg-red-50 transition-all text-left">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center bg-red-100 shrink-0">
                      <LogOut size={14} className="text-red-500" />
                    </div>
                    <p className="text-xs text-red-500 font-bold">ออกจากระบบ</p>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ══════════ Main ══════════ */}
      <div className="flex-1 overflow-hidden min-w-0 relative">
        <main className="h-full overflow-y-auto">
          <Outlet />
        </main>

        {/* ══════════ Notification Panel (overlay from left of content) ══════════ */}
        {notiOpen && (
          <>
            <div className="absolute inset-0 z-30" onClick={() => setNotiOpen(false)} />
            <div className="absolute top-0 left-0 bottom-0 w-[480px] max-w-full bg-white z-40 flex flex-col border border-gray-200 rounded-2xl overflow-hidden animate-[fadeSlideIn_0.2s_ease-out]"
              style={{ boxShadow: "4px 0 24px rgba(0,0,0,0.08)" }}>
              {/* Header */}
              <div className="px-6 py-5 border-b border-gray-100 shrink-0">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-text">Notifications</h2>
                  <button onClick={() => setNotiOpen(false)} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors">
                    <X size={18} className="text-text-secondary" />
                  </button>
                </div>
                <p className="text-sm text-text-secondary mt-1">การแจ้งเตือนล่าสุดของคุณ</p>
              </div>

              {/* List */}
              <div className="flex-1 overflow-y-auto">
                {myNotifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-text-secondary">
                    <Bell size={32} className="opacity-20 mb-3" />
                    <p className="text-sm">ไม่มีการแจ้งเตือน</p>
                  </div>
                ) : (
                  myNotifications.map(n => (
                    <button key={n.id}
                      onClick={() => { markNotificationRead(n.id); setNotiOpen(false); if (n.hn) navigate(`/onc/patients/${n.hn}`); }}
                      className={`w-full text-left px-6 py-4 hover:bg-gray-50 transition-colors flex items-start gap-4 border-b border-gray-100 ${!n.read ? "bg-onc/5" : ""}`}>
                      {/* Icon */}
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        n.type === "rejection" ? "bg-red-100" : n.type === "prepared" ? "bg-emerald-100" : "bg-onc/10"
                      }`}>
                        {n.type === "rejection" ? <X size={18} className="text-red-500" />
                          : n.type === "prepared" ? <Stethoscope size={18} className="text-emerald-600" />
                          : <Bell size={18} className="text-onc" />}
                      </div>
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-text">{n.title}</p>
                        <p className="text-sm text-text mt-0.5">{n.message}</p>
                        <p className="text-xs text-text-secondary mt-1.5">{n.from} · {n.timestamp}</p>
                      </div>
                      {/* Unread dot */}
                      {!n.read && <div className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0 mt-2" />}
                    </button>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Backdrop for role picker */}
      {roleOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setRoleOpen(false)} />
      )}
    </div>
  );
}
