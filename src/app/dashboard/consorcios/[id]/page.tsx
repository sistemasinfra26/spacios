import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { syncUserWithPrisma } from "@/app/actions/users";
import { getUnitsByBuilding } from "@/app/actions/units";
import { BuildingUnitsView } from "./components/BuildingUnitsView";

export const metadata = {
  title: "Unidades Funcionales | Spacio SaaS",
  description: "Gestión de departamentos, cocheras y coeficientes de copropiedad.",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

async function BuildingUnitsContent({ params }: PageProps) {
  const { id } = await params;

  const user = await syncUserWithPrisma();
  if (!user || !user.tenantId) {
    redirect("/dashboard");
  }

  const result = await getUnitsByBuilding(id);

  if (!result.success || !result.data) {
    notFound();
  }

  return (
    <BuildingUnitsView
      building={result.data.building}
      units={result.data.units}
      stats={result.data.stats}
    />
  );
}

function BuildingUnitsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-5 w-48 bg-card rounded" />
      <div className="h-24 bg-card rounded-2xl border border-border" />
      <div className="h-32 bg-card rounded-2xl border border-border" />
      <div className="h-80 bg-card rounded-2xl border border-border" />
    </div>
  );
}

export default function BuildingUnitsPage({ params }: PageProps) {
  return (
    <Suspense fallback={<BuildingUnitsSkeleton />}>
      <BuildingUnitsContent params={params} />
    </Suspense>
  );
}
