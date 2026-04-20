import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter, Routes, Route, Navigate, Outlet, useNavigate } from "react-router";
import { HeroUIProvider } from "@heroui/react";
import { OncProvider, useOnc, type OncRole } from "./components/onc/OncContext";
import OncLayout from "./components/onc/OncLayout";
import Login from "./pages/onc/Login";
import Placeholder from "./pages/onc/Placeholder";
import PatientSummary from "./pages/onc/PatientSummary";
import RegimenMaster from "./pages/onc/RegimenMaster";
import PlanCreator from "./pages/onc/PlanCreator";
import OrderEntry from "./pages/onc/OrderEntry";
import PharmVerify from "./pages/onc/PharmVerify";
import Compounding from "./pages/onc/Compounding";
import Administration from "./pages/onc/Administration";
import Dashboard from "./pages/onc/Dashboard";
import { ToastProvider } from "./components/onc/Toast";
import OrderList from "./pages/onc/OrderList";
import Overview from "./pages/onc/Overview";
import Billing from "./pages/onc/Billing";
import PatientRegister from "./pages/onc/PatientRegister";
import { ShieldAlert } from "lucide-react";
import "./index.css";

/* ── Role-Based Access Guard ── */
function RoleGuard({ roles, children }: { roles: OncRole[]; children: React.ReactNode }) {
  const { role } = useOnc();
  const navigate = useNavigate();
  if (roles.includes(role)) return <>{children}</>;
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-8">
      <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center">
        <ShieldAlert size={32} className="text-red-400" />
      </div>
      <h2 className="text-lg font-bold text-[#404040]">ไม่มีสิทธิ์เข้าถึงหน้านี้</h2>
      <p className="text-sm text-[#898989] max-w-xs">บทบาทปัจจุบันของคุณไม่มีสิทธิ์เข้าถึงหน้านี้ กรุณาเปลี่ยนบทบาทหรือติดต่อผู้ดูแลระบบ</p>
      <button onClick={() => navigate("/onc")} className="text-sm font-semibold text-white bg-[#674BB3] rounded-lg px-5 py-2 hover:bg-[#563AA4] transition-colors">
        กลับหน้าหลัก
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════════
   Route Structure — HOSxP Oncology Chemo CPOE
   All pages start as placeholders, replaced as built
   ══════════════════════════════════════════════ */

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HashRouter>
      <Routes>
        {/* Redirect root to oncology login */}
        <Route path="/" element={<Navigate to="/onc/login" replace />} />

        {/* Oncology module — shared context */}
        <Route element={<HeroUIProvider locale="th-TH"><OncProvider><ToastProvider><Outlet /></ToastProvider></OncProvider></HeroUIProvider>}>
          <Route path="/onc/login" element={<Login />} />
          <Route path="/onc/administration" element={<RoleGuard roles={["CHEMO_NURSE", "ONC_DOCTOR"]}><Administration /></RoleGuard>} />

          <Route path="/onc" element={<OncLayout />}>
            <Route index element={<Overview />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="register" element={<RoleGuard roles={["ONC_DOCTOR"]}><PatientRegister /></RoleGuard>} />
            <Route path="patients" element={<PatientSummary />} />
            <Route path="patients/:hn" element={<PatientSummary />} />
            <Route path="orders" element={<OrderList />} />
            <Route path="order-entry" element={<RoleGuard roles={["ONC_DOCTOR"]}><OrderEntry /></RoleGuard>} />
            <Route path="pharm-verify" element={<RoleGuard roles={["ONC_PHARMACIST"]}><PharmVerify /></RoleGuard>} />
            <Route path="compounding" element={<Navigate to="/onc/pharm-verify" replace />} />
            <Route path="regimen" element={<RoleGuard roles={["ONC_PHARMACIST"]}><RegimenMaster /></RoleGuard>} />
            <Route path="plan" element={<RoleGuard roles={["ONC_DOCTOR"]}><PlanCreator /></RoleGuard>} />
            <Route path="reports" element={<Placeholder title="Reports & Analytics" />} />
            <Route path="billing" element={<RoleGuard roles={["BILLING_OFFICER", "ADMIN"]}><Billing /></RoleGuard>} />
            <Route path="settings" element={<RoleGuard roles={["ADMIN"]}><Placeholder title="System Settings" /></RoleGuard>} />
          </Route>
        </Route>
      </Routes>
    </HashRouter>
  </StrictMode>
);
