import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter, Routes, Route, Navigate, Outlet } from "react-router";
import { HeroUIProvider } from "@heroui/react";
import { OncProvider } from "./components/onc/OncContext";
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
import Timeline from "./pages/onc/Timeline";
import OrderList from "./pages/onc/OrderList";
import Overview from "./pages/onc/Overview";
import "./index.css";

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
        <Route element={<HeroUIProvider><OncProvider><ToastProvider><Outlet /></ToastProvider></OncProvider></HeroUIProvider>}>
          <Route path="/onc/login" element={<Login />} />

          <Route path="/onc" element={<OncLayout />}>
            <Route index element={<Overview />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="patients" element={<PatientSummary />} />
            <Route path="patients/:hn" element={<PatientSummary />} />
            <Route path="orders" element={<OrderList />} />
            <Route path="order-entry" element={<OrderEntry />} />
            <Route path="pharm-verify" element={<PharmVerify />} />
            <Route path="compounding" element={<Compounding />} />
            <Route path="administration" element={<Administration />} />
            <Route path="regimen" element={<RegimenMaster />} />
            <Route path="plan" element={<PlanCreator />} />
            <Route path="timeline" element={<Timeline />} />
            <Route path="reports" element={<Placeholder title="Reports & Analytics" />} />
            <Route path="billing" element={<Placeholder title="Billing & Charges" />} />
            <Route path="settings" element={<Placeholder title="System Settings" />} />
          </Route>
        </Route>
      </Routes>
    </HashRouter>
  </StrictMode>
);
