import { useMemo } from "react";

/* ══════════════════════════════════════════════
   useOrderVerification — Clinical Safety Gates
   Ref: Pharmacist Safety Gates & Logistics Traceability

   Validates:
   1. BSA freshness (weight updated within 24h)
   2. Lab gate hard-stops (ANC, PLT, Cr)
   3. Cumulative dose guard (Doxorubicin lifetime max)
   ══════════════════════════════════════════════ */

/* ── Types ── */
export interface LabValue {
  name: string;
  value: number;
  unit: string;
  updatedAt?: string; // ISO date
}

export interface PatientClinical {
  weight: number;
  height: number;
  bsa: number;
  weightUpdatedAt?: string; // ISO date — when weight was last measured
  creatinine: number;
  crcl: number;
  labs: LabValue[];
}

export interface DrugOrder {
  name: string;
  calcDose: number;
  finalDose: number;
  unit: string;
  method: "FIXED" | "BSA" | "AUC" | "WEIGHT";
}

export interface CumulativeDoseRecord {
  drugName: string;
  totalGivenMg: number;    // total mg given to date (prior cycles)
  maxLifetimeMgPerM2: number; // e.g. 550 mg/m² for Doxorubicin
}

export type GateSeverity = "info" | "warning" | "hard-stop";

export interface GateResult {
  id: string;
  severity: GateSeverity;
  title: string;
  message: string;
  field?: string;           // which field triggered this
  value?: number;
  threshold?: number;
  requiresOverride: boolean; // needs PIN + reason to proceed
}

export interface VerificationResult {
  canVerify: boolean;        // true if no hard-stops (or all overridden)
  gates: GateResult[];
  hardStops: GateResult[];
  warnings: GateResult[];
  bsaStatus: "current" | "historical" | "missing";
  overrides: Map<string, string>; // gateId → override reason
}

/* ── Constants ── */
const BSA_FRESHNESS_HOURS = 24;

const LAB_HARD_STOPS: { name: string; field: string; operator: "<" | ">"; threshold: number; unit: string }[] = [
  { name: "ANC", field: "ANC", operator: "<", threshold: 1.0, unit: "K/µL" },
  { name: "Platelets", field: "PLT", operator: "<", threshold: 50, unit: "K/µL" },
];

const LAB_WARNINGS: typeof LAB_HARD_STOPS = [
  { name: "ANC", field: "ANC", operator: "<", threshold: 1.5, unit: "K/µL" },
  { name: "Platelets", field: "PLT", operator: "<", threshold: 100, unit: "K/µL" },
  { name: "Creatinine", field: "Cr", operator: ">", threshold: 1.5, unit: "mg/dL" },
];

const CUMULATIVE_LIMITS: Record<string, number> = {
  "Doxorubicin": 550,      // mg/m² lifetime max
  "Epirubicin": 900,       // mg/m² lifetime max
};

/* ── Precision math ── */
function round(n: number, decimals = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round((n + Number.EPSILON) * factor) / factor;
}

function calcBSA(weightKg: number, heightCm: number): number {
  // DuBois formula: BSA = 0.007184 × W^0.425 × H^0.725
  return round(0.007184 * Math.pow(weightKg, 0.425) * Math.pow(heightCm, 0.725));
}

/* ── Hook ── */
export function useOrderVerification(
  patient: PatientClinical | null,
  drugs: DrugOrder[],
  cumulativeDoses: CumulativeDoseRecord[],
  overrides?: Map<string, string>,
): VerificationResult {
  return useMemo(() => {
    const gates: GateResult[] = [];
    const overrideMap = overrides ?? new Map<string, string>();

    if (!patient) {
      return { canVerify: false, gates: [], hardStops: [], warnings: [], bsaStatus: "missing" as const, overrides: overrideMap };
    }

    /* ── 1. BSA Freshness ── */
    let bsaStatus: "current" | "historical" | "missing" = "current";

    if (!patient.weight || !patient.height) {
      bsaStatus = "missing";
      gates.push({
        id: "bsa-missing",
        severity: "hard-stop",
        title: "ไม่มีข้อมูลน้ำหนัก/ส่วนสูง",
        message: "ไม่สามารถคำนวณ BSA ได้ กรุณาชั่งน้ำหนักและวัดส่วนสูงผู้ป่วยก่อนสั่งยา",
        requiresOverride: true,
      });
    } else {
      const recalcBSA = calcBSA(patient.weight, patient.height);
      const bsaDiff = Math.abs(recalcBSA - patient.bsa);

      if (patient.weightUpdatedAt) {
        const hoursSince = (Date.now() - new Date(patient.weightUpdatedAt).getTime()) / (1000 * 60 * 60);
        if (hoursSince > BSA_FRESHNESS_HOURS) {
          bsaStatus = "historical";
          gates.push({
            id: "bsa-stale",
            severity: "warning",
            title: "BSA จากข้อมูลเก่า",
            message: `น้ำหนักล่าสุดถูกบันทึกเมื่อ ${round(hoursSince, 0)} ชม. ที่แล้ว (BSA ${patient.bsa} m²) กรุณาชั่งน้ำหนักใหม่เพื่อความแม่นยำ`,
            field: "weight",
            value: patient.weight,
            requiresOverride: false,
          });
        }
      } else {
        bsaStatus = "historical";
        gates.push({
          id: "bsa-no-timestamp",
          severity: "warning",
          title: "ไม่มีข้อมูลวันที่ชั่งน้ำหนัก",
          message: `BSA ${patient.bsa} m² อาจไม่เป็นปัจจุบัน กรุณาตรวจสอบน้ำหนักผู้ป่วย`,
          field: "weight",
          value: patient.weight,
          requiresOverride: false,
        });
      }

      // Check BSA discrepancy
      if (bsaDiff > 0.05) {
        gates.push({
          id: "bsa-mismatch",
          severity: "warning",
          title: "BSA ไม่ตรงกับการคำนวณ",
          message: `BSA ในระบบ ${patient.bsa} m² ≠ คำนวณใหม่ ${recalcBSA} m² (ต่างกัน ${round(bsaDiff)} m²)`,
          field: "bsa",
          value: patient.bsa,
          threshold: recalcBSA,
          requiresOverride: false,
        });
      }
    }

    /* ── 2. Lab Gate Hard-Stops ── */
    for (const rule of LAB_HARD_STOPS) {
      const lab = patient.labs.find(l => l.name === rule.field);
      if (!lab) {
        gates.push({
          id: `lab-missing-${rule.field}`,
          severity: "hard-stop",
          title: `ไม่พบผล ${rule.name}`,
          message: `ไม่มีผล Lab ${rule.name} กรุณาส่งตรวจก่อนอนุมัติ`,
          field: rule.field,
          requiresOverride: true,
        });
        continue;
      }
      const fail = rule.operator === "<" ? lab.value < rule.threshold : lab.value > rule.threshold;
      if (fail) {
        gates.push({
          id: `lab-hardstop-${rule.field}`,
          severity: "hard-stop",
          title: `${rule.name} ผิดปกติรุนแรง`,
          message: `${rule.name} = ${lab.value} ${rule.unit} (เกณฑ์: ${rule.operator === "<" ? "≥" : "≤"} ${rule.threshold} ${rule.unit}) — ต้อง Override + PIN เพื่อดำเนินการ`,
          field: rule.field,
          value: lab.value,
          threshold: rule.threshold,
          requiresOverride: true,
        });
      }
    }

    // Lab warnings (softer thresholds)
    for (const rule of LAB_WARNINGS) {
      const lab = patient.labs.find(l => l.name === rule.field);
      if (!lab) continue;
      const alreadyHardStopped = gates.some(g => g.id === `lab-hardstop-${rule.field}`);
      if (alreadyHardStopped) continue;
      const fail = rule.operator === "<" ? lab.value < rule.threshold : lab.value > rule.threshold;
      if (fail) {
        gates.push({
          id: `lab-warn-${rule.field}`,
          severity: "warning",
          title: `${rule.name} ผิดปกติ`,
          message: `${rule.name} = ${lab.value} ${rule.unit} (เกณฑ์: ${rule.operator === "<" ? "≥" : "≤"} ${rule.threshold} ${rule.unit}) — กรุณาพิจารณาปรับขนาดยา`,
          field: rule.field,
          value: lab.value,
          threshold: rule.threshold,
          requiresOverride: false,
        });
      }
    }

    /* ── 3. Cumulative Dose Guard ── */
    for (const drug of drugs) {
      const maxPerM2 = CUMULATIVE_LIMITS[drug.name];
      if (!maxPerM2) continue;

      const record = cumulativeDoses.find(r => r.drugName === drug.name);
      const priorMg = record?.totalGivenMg ?? 0;
      const newTotalMg = priorMg + drug.finalDose;
      const bsa = patient.bsa || 1;
      const newTotalPerM2 = round(newTotalMg / bsa);
      const maxMg = round(maxPerM2 * bsa);
      const pctUsed = round((newTotalPerM2 / maxPerM2) * 100);

      if (newTotalPerM2 > maxPerM2) {
        gates.push({
          id: `cumulative-hardstop-${drug.name}`,
          severity: "hard-stop",
          title: `${drug.name} เกิน Cumulative Dose`,
          message: `รวมสะสม ${round(newTotalMg)} mg (${newTotalPerM2} mg/m²) เกินขีดจำกัด ${maxPerM2} mg/m² (${maxMg} mg) — คิดเป็น ${pctUsed}% ของ Lifetime Max`,
          field: drug.name,
          value: newTotalPerM2,
          threshold: maxPerM2,
          requiresOverride: true,
        });
      } else if (pctUsed > 80) {
        gates.push({
          id: `cumulative-warn-${drug.name}`,
          severity: "warning",
          title: `${drug.name} ใกล้ถึง Cumulative Dose`,
          message: `รวมสะสม ${round(newTotalMg)} mg (${newTotalPerM2} mg/m²) — ${pctUsed}% ของ Lifetime Max (${maxPerM2} mg/m²)`,
          field: drug.name,
          value: newTotalPerM2,
          threshold: maxPerM2,
          requiresOverride: false,
        });
      }
    }

    /* ── Evaluate ── */
    const hardStops = gates.filter(g => g.severity === "hard-stop");
    const warnings = gates.filter(g => g.severity === "warning");

    // Can verify if no hard-stops, or all hard-stops have been overridden
    const unOverriddenHardStops = hardStops.filter(g => !overrideMap.has(g.id));
    const canVerify = unOverriddenHardStops.length === 0;

    return { canVerify, gates, hardStops, warnings, bsaStatus, overrides: overrideMap };
  }, [patient, drugs, cumulativeDoses, overrides]);
}
