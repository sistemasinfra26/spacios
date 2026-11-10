import { Suspense } from "react";
import { getBuildings } from "@/lib/buildings";
import { getLiquidations } from "@/app/actions/expenses";
import { LiquidationsTable, type LiquidationListItem } from "./components/LiquidationsTable";

export const metadata = {
  title: "Liquidación de Expensas | Spacio SaaS",
  description: "Módulo integral de liquidación, gastos ordinarios, prorrateo y cobranzas.",
};

async function ExpensasContent() {
  const [buildingsRes, liquidationsRes] = await Promise.all([
    getBuildings(),
    getLiquidations(),
  ]);

  const rawBuildings = buildingsRes.success ? buildingsRes.data ?? [] : [];
  const buildings = rawBuildings.map((b) => ({
    id: b.id,
    name: b.name,
    address: b.address,
    unitsCount: b.units?.length || 0,
    units: (b.units || []).map((u) => ({
      id: u.id,
      number: u.number,
      name: u.name,
      type: u.type,
      floor: u.floor,
      door: u.door,
      coefficient: u.coefficient,
    })),
  }));

  const rawLiquidations = liquidationsRes.success ? liquidationsRes.data ?? [] : [];
  const liquidations: LiquidationListItem[] = rawLiquidations.map((l) => ({
    id: l.id,
    buildingId: l.buildingId,
    buildingName: l.buildingName,
    buildingAddress: l.buildingAddress,
    month: l.month,
    year: l.year,
    status: l.status,
    dueDateFirst: l.dueDateFirst,
    dueDateSecond: l.dueDateSecond,
    interestRate: l.interestRate,
    notes: l.notes,
    totalAmount: l.totalAmount,
    totalCollected: l.totalCollected,
    totalPending: l.totalPending,
    itemsCount: l.itemsCount,
    receiptsCount: l.receiptsCount,
    createdAt: l.createdAt,
  }));

  return (
    <LiquidationsTable
      initialLiquidations={liquidations}
      buildings={buildings}
    />
  );
}

function ExpensasLoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <div className="h-7 w-64 bg-card rounded-lg" />
          <div className="h-4 w-96 bg-card rounded-lg" />
        </div>
        <div className="h-10 w-40 bg-card rounded-xl" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 bg-card rounded-2xl border border-border" />
        ))}
      </div>

      <div className="h-80 bg-card rounded-2xl border border-border" />
    </div>
  );
}

export default function ExpensasPage() {
  return (
    <Suspense fallback={<ExpensasLoadingSkeleton />}>
      <ExpensasContent />
    </Suspense>
  );
}