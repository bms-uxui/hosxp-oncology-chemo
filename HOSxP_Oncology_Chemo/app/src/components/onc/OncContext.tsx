import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

/* ══════════════════════════════════════════════
   OncContext — Role, Auth, PIN, Global State
   Ref: RBAC matrix from spec (6 roles)
   ══════════════════════════════════════════════ */

export type OncRole =
  | "ONC_DOCTOR"
  | "ONC_PHARMACIST"
  | "COMPOUND_TECH"
  | "CHEMO_NURSE"
  | "BILLING_OFFICER"
  | "ADMIN";

export const roleLabels: Record<OncRole, string> = {
  ONC_DOCTOR: "นพ.สมชาย รักษาดี",
  ONC_PHARMACIST: "ภก.วิไล ใจดี",
  COMPOUND_TECH: "ชนม์ วงษ์ดี",
  CHEMO_NURSE: "พว.อรุณ แสงทอง",
  BILLING_OFFICER: "คุณสมศรี บัญชี",
  ADMIN: "Admin ระบบ",
};

export const roleEnglish: Record<OncRole, string> = {
  ONC_DOCTOR: "Oncologist",
  ONC_PHARMACIST: "Pharmacist",
  COMPOUND_TECH: "Compounding Tech",
  CHEMO_NURSE: "Chemo Nurse",
  BILLING_OFFICER: "Billing Officer",
  ADMIN: "System Admin",
};

export const roleInitials: Record<OncRole, string> = {
  ONC_DOCTOR: "SC",
  ONC_PHARMACIST: "WL",
  COMPOUND_TECH: "CH",
  CHEMO_NURSE: "AN",
  BILLING_OFFICER: "SS",
  ADMIN: "AD",
};

export const roleColor: Record<OncRole, string> = {
  ONC_DOCTOR: "#4A7BF7",
  ONC_PHARMACIST: "#7C6EBF",
  COMPOUND_TECH: "#F59E0B",
  CHEMO_NURSE: "#10B981",
  BILLING_OFFICER: "#6366F1",
  ADMIN: "#64748B",
};

/* ── Context type ── */
interface OncContextType {
  role: OncRole;
  setRole: (r: OncRole) => void;
  searchOpen: boolean;
  setSearchOpen: (v: boolean) => void;
  verifyPin: (pin: string) => boolean;
}

const OncContext = createContext<OncContextType>({
  role: "ONC_DOCTOR",
  setRole: () => {},
  searchOpen: false,
  setSearchOpen: () => {},
  verifyPin: () => false,
});

export function OncProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<OncRole>("ONC_DOCTOR");
  const [searchOpen, setSearchOpen] = useState(false);

  /* ⌘K / Ctrl+K global shortcut */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === "Escape") setSearchOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  /* PIN verification (prototype — accepts "1234" or "123456") */
  const verifyPin = useCallback((pin: string) => {
    return pin === "1234" || pin === "123456";
  }, []);

  return (
    <OncContext.Provider value={{ role, setRole, searchOpen, setSearchOpen, verifyPin }}>
      {children}
    </OncContext.Provider>
  );
}

export const useOnc = () => useContext(OncContext);
