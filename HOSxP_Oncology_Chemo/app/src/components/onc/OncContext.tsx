import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

/* ══════════════════════════════════════════════
   OncContext — Role, Auth, PIN, Global State
   Ref: RBAC matrix from spec (6 roles)
   ══════════════════════════════════════════════ */

export type OncRole =
  | "ONC_DOCTOR"
  | "ONC_PHARMACIST"

  | "CHEMO_NURSE"
  | "BILLING_OFFICER"
  | "ADMIN";

export const roleLabels: Record<OncRole, string> = {
  ONC_DOCTOR: "นพ.สมชาย รักษาดี",
  ONC_PHARMACIST: "ภก.วิไล ใจดี",
  CHEMO_NURSE: "พว.อรุณ แสงทอง",
  BILLING_OFFICER: "คุณสมศรี บัญชี",
  ADMIN: "Admin ระบบ",
};

export const roleEnglish: Record<OncRole, string> = {
  ONC_DOCTOR: "Oncologist",
  ONC_PHARMACIST: "Pharmacist",
  CHEMO_NURSE: "Chemo Nurse",
  BILLING_OFFICER: "Billing Officer",
  ADMIN: "System Admin",
};

export const roleInitials: Record<OncRole, string> = {
  ONC_DOCTOR: "SC",
  ONC_PHARMACIST: "WL",
  CHEMO_NURSE: "AN",
  BILLING_OFFICER: "SS",
  ADMIN: "AD",
};

export const roleColor: Record<OncRole, string> = {
  ONC_DOCTOR: "#4A7BF7",
  ONC_PHARMACIST: "#7C6EBF",
  CHEMO_NURSE: "#10B981",
  BILLING_OFFICER: "#6366F1",
  ADMIN: "#64748B",
};

/* ── Notifications ── */
export interface OncNotification {
  id: string;
  type: "rejection" | "approval" | "prepared" | "info" | "billing";
  title: string;
  message: string;
  targetRole: OncRole;
  from: string;
  timestamp: string;
  read: boolean;
  hn?: string;
  orderId?: string;
}

/* ── Billing ── */
export type BillingStatus = "PENDING" | "CONFIRMED" | "INVOICED";

export interface BillingItem {
  code: string;
  description: string;
  category: "drug" | "diluent" | "service" | "room";
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface BillingRecord {
  id: string;
  orderId: string;
  hn: string;
  patientName: string;
  protocol: string;
  cycle: number;
  day: number;
  ward: string;
  status: BillingStatus;
  items: BillingItem[];
  totalAmount: number;
  generatedAt: string;
  generatedBy: string;
  confirmedBy?: string;
  confirmedAt?: string;
  coverageType?: string;
  notes?: string;
}

export const DRUG_PRICES: Record<string, number> = {
  "Cyclophosphamide": 850, "Doxorubicin": 4200, "5-FU": 320, "5-FU (bolus)": 320,
  "Oxaliplatin": 12500, "Leucovorin": 1800, "Ondansetron": 180, "Dexamethasone": 45,
  "Gemcitabine": 3500, "Carboplatin": 5200, "Paclitaxel": 8900, "Rituximab": 28000,
  "Vincristine": 1200,
};

export const SERVICE_ITEMS: BillingItem[] = [
  { code: "SVC-001", description: "ค่าผสมยาเคมีบำบัด", category: "service", quantity: 1, unitPrice: 1500, totalPrice: 1500 },
  { code: "SVC-002", description: "ค่าบริการให้ยาเคมี (เก้าอี้/เตียง)", category: "room", quantity: 1, unitPrice: 800, totalPrice: 800 },
  { code: "SVC-003", description: "ค่าพยาบาลให้ยาเคมีบำบัด", category: "service", quantity: 1, unitPrice: 1200, totalPrice: 1200 },
];

/* ── Order history entry ── */
export interface OrderHistoryEntry {
  orderNo: string;
  hn: string;
  patientName: string;
  date: string;
  cycle: string;
  regimen: string;
  doctor: string;
  drugs: { name: string; dose: string; route: string; duration: string }[];
  doseReduction: number;
}

/* ── Context type ── */
interface OncContextType {
  role: OncRole;
  setRole: (r: OncRole) => void;
  searchOpen: boolean;
  setSearchOpen: (v: boolean) => void;
  verifyPin: (pin: string) => boolean;
  orderHistory: OrderHistoryEntry[];
  addOrderHistory: (entry: OrderHistoryEntry) => void;
  notifications: OncNotification[];
  addNotification: (n: Omit<OncNotification, "id" | "timestamp" | "read">) => void;
  markNotificationRead: (id: string) => void;
  unreadCount: number;
  billingRecords: BillingRecord[];
  addBillingRecord: (r: BillingRecord) => void;
  updateBillingStatus: (id: string, status: BillingStatus, confirmedBy?: string) => void;
}

const OncContext = createContext<OncContextType>({
  role: "ONC_DOCTOR",
  setRole: () => {},
  searchOpen: false,
  setSearchOpen: () => {},
  verifyPin: () => false,
  orderHistory: [],
  addOrderHistory: () => {},
  notifications: [],
  addNotification: () => {},
  markNotificationRead: () => {},
  unreadCount: 0,
  billingRecords: [],
  addBillingRecord: () => {},
  updateBillingStatus: () => {},
});

export function OncProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<OncRole>("ONC_DOCTOR");
  const [searchOpen, setSearchOpen] = useState(false);
  const [orderHistory, setOrderHistory] = useState<OrderHistoryEntry[]>([]);

  const addOrderHistory = useCallback((entry: OrderHistoryEntry) => {
    setOrderHistory(prev => [entry, ...prev]);
  }, []);

  const [notifications, setNotifications] = useState<OncNotification[]>([
    {
      id: "demo-1", type: "rejection", title: "ปฏิเสธ: นางสาวมาลี สุขใจ (HN 519087)",
      message: "AC-T C2D1 — ANC 1.3 (ต่ำกว่า 1.5), PLT 98 (ต่ำกว่า 100) ไม่ผ่านเกณฑ์ Lab Safety",
      targetRole: "ONC_DOCTOR", from: "ภก.วิไล ใจดี", timestamp: "09:45", read: false, hn: "519087", orderId: "ORD-002",
    },
    {
      id: "demo-2", type: "prepared", title: "ยาพร้อม: นายบุญมี ดีใจ (HN 205471)",
      message: "FOLFOX6 C5D1 — Oxaliplatin 144mg, Leucovorin 340mg, 5-FU 680mg ผสมเสร็จแล้ว",
      targetRole: "CHEMO_NURSE", from: "ภก.วิไล ใจดี", timestamp: "10:30", read: false, hn: "205471", orderId: "ORD-003",
    },
    {
      id: "demo-3", type: "approval", title: "อนุมัติ: นาง คำปุ่น เสนาหอย (HN 104558)",
      message: "CAF C3D1 — Cyclophosphamide 700mg, Doxorubicin 70mg, 5-FU 700mg ผ่านการตรวจสอบ",
      targetRole: "ONC_DOCTOR", from: "ภก.วิไล ใจดี", timestamp: "09:30", read: true, hn: "104558", orderId: "ORD-001",
    },
  ]);
  const addNotification = useCallback((n: Omit<OncNotification, "id" | "timestamp" | "read">) => {
    setNotifications(prev => [{
      ...n,
      id: `noti-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }),
      read: false,
    }, ...prev]);
  }, []);
  const markNotificationRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);
  const unreadCount = notifications.filter(n => !n.read && n.targetRole === role).length;

  /* ── Billing ── */
  const [billingRecords, setBillingRecords] = useState<BillingRecord[]>([
    {
      id: "BIL-001", orderId: "ORD-003", hn: "205471", patientName: "นายบุญมี ดีใจ",
      protocol: "FOLFOX6", cycle: 5, day: 1, ward: "หอผู้ป่วย 4A", status: "PENDING",
      items: [
        { code: "DRG-001", description: "Oxaliplatin 144mg", category: "drug", quantity: 1, unitPrice: 12500, totalPrice: 12500 },
        { code: "DRG-002", description: "Leucovorin 340mg", category: "drug", quantity: 1, unitPrice: 1800, totalPrice: 1800 },
        { code: "DRG-003", description: "5-FU (bolus) 680mg", category: "drug", quantity: 1, unitPrice: 320, totalPrice: 320 },
        { code: "DRG-004", description: "Ondansetron 8mg", category: "drug", quantity: 1, unitPrice: 180, totalPrice: 180 },
        { code: "DIL-001", description: "D-5-W 500ml", category: "diluent", quantity: 1, unitPrice: 45, totalPrice: 45 },
        { code: "DIL-002", description: "D-5-W 100ml", category: "diluent", quantity: 1, unitPrice: 35, totalPrice: 35 },
        { code: "DIL-003", description: "NSS 50ml", category: "diluent", quantity: 1, unitPrice: 25, totalPrice: 25 },
        ...SERVICE_ITEMS,
      ],
      totalAmount: 18405,
      generatedAt: "10:32",
      generatedBy: "ภก.วิไล ใจดี",
      coverageType: "UC",
    },
  ]);
  const addBillingRecord = useCallback((r: BillingRecord) => {
    setBillingRecords(prev => [r, ...prev]);
  }, []);
  const updateBillingStatus = useCallback((id: string, status: BillingStatus, confirmedBy?: string) => {
    setBillingRecords(prev => prev.map(r => r.id === id ? {
      ...r, status, confirmedBy: confirmedBy ?? r.confirmedBy,
      confirmedAt: status === "CONFIRMED" || status === "INVOICED" ? new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }) : r.confirmedAt,
    } : r));
  }, []);

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
    <OncContext.Provider value={{ role, setRole, searchOpen, setSearchOpen, verifyPin, orderHistory, addOrderHistory, notifications, addNotification, markNotificationRead, unreadCount, billingRecords, addBillingRecord, updateBillingStatus }}>
      {children}
    </OncContext.Provider>
  );
}

export const useOnc = () => useContext(OncContext);
