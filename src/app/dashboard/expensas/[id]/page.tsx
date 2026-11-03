import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { syncUserWithPrisma } from "@/app/actions/users";
import { calculateProrationData } from "@/app/actions/expenses";
import { LiquidationDetailView } from "../components/LiquidationDetailView";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function LiquidationDetailContent({ params }: PageProps) {
  const { id } = await params;

  const user = await syncUserWithPrisma();
  if (!user || !user.tenantId) {
    redirect("/dashboard");
  }

  try {
    const data = await calculateProrationData(id, user.tenantId);

    const formattedLiquidation = {
      id: data.liquidation.id,
      buildingId: data.liquidation.buildingId,
      buildingName: data.liquidation.building.name,
      buildingAddress: data.liquidation.building.address,
      buildingCuit: (data.liquidation.building as any).tenant?.taxId || null,
      city: data.liquidation.building.city,
      month: data.liquidation.month,
      year: data.liquidation.year,
      status: data.liquidation.status,
      dueDateFirst: data.liquidation.dueDateFirst,
      dueDateSecond: data.liquidation.dueDateSecond,
      interestRate: data.liquidation.interestRate,
      notes: data.liquidation.notes,
      totalAmount: Number(data.liquidation.totalAmount),
      items: data.liquidation.items.map((i) => ({
        id: i.id,
        category: i.category,
        description: i.description,
        supplierName: i.supplierName,
        invoiceNumber: i.invoiceNumber,
        amount: Number(i.amount),
        date: i.date,
      })),
    };

    return (
      <LiquidationDetailView
        liquidation={formattedLiquidation}
        prorationList={data.prorationList}
        summary={data.summary}
      />
    );
  } catch (error) {
    console.error("Error loading liquidation detail:", error);
    notFound();
  }
}

function LiquidationDetailSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-5 w-48 bg-card rounded" />
      <div className="h-24 bg-card rounded-2xl border border-border" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 bg-card rounded-2xl border border-border" />
        ))}
      </div>
      <div className="h-96 bg-card rounded-2xl border border-border" />
    </div>
  );
}

export default function LiquidationDetailPage({ params }: PageProps) {
  return (
    <Suspense fallback={<LiquidationDetailSkeleton />}>
      <LiquidationDetailContent params={params} />
    </Suspense>
  );
}
