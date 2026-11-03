import { Suspense } from "react";
import Link from "next/link";
import { getBuildings } from "@/lib/buildings";
import { AddBuildingForm } from "./AddBuildingForm";

interface Building {
  id: string;
  name: string;
  address: string;
  city: string;
  units?: { id: string }[];
}

async function BuildingsList() {
  const result = await getBuildings();
  const buildings: Building[] = result.success ? result.data ?? [] : [];

  if (!buildings.length) {
    return (
      <p className="border-t border-border py-10 text-center text-sm text-muted">
        {result.success
          ? "Todavía no hay edificios. Agrega el primero para comenzar a cargar datos."
          : result.error}
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {buildings.map((b) => (
        <div
          key={b.id}
          className="p-6 bg-card rounded-2xl border border-border shadow-xs hover:border-brand/40 transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex justify-between items-start">
              <span className="w-10 h-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center font-bold text-lg mb-3">
                🏢
              </span>
              <span className="text-xs bg-muted-bg text-muted font-medium px-2.5 py-1 rounded-md border border-border">
                {b.units ? b.units.length : 0} Unidades
              </span>
            </div>
            <h3 className="font-bold text-lg text-foreground">{b.name}</h3>
            <p className="text-xs text-muted mt-1">
              {b.address}, {b.city}
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-border flex justify-between items-center text-xs">
            <span className="text-muted">Administración activa</span>
            <Link
              href={`/dashboard/consorcios/${b.id}`}
              className="text-brand font-bold hover:underline cursor-pointer flex items-center gap-1"
            >
              <span>Gestionar unidades</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}

function BuildingsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="p-6 bg-card rounded-2xl border border-border h-48" />
      ))}
    </div>
  );
}

export default function ConsorciosPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Consorcios & Edificios</h1>
          <p className="text-sm text-muted">Gestión de inmuebles registrados en la plataforma.</p>
        </div>
        <AddBuildingForm />
      </div>

      <Suspense fallback={<BuildingsSkeleton />}>
        <BuildingsList />
      </Suspense>
    </div>
  );
}