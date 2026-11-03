"use client";

import { useActionState, useState } from "react";
import { createBuilding, type BuildingFormState } from "@/app/actions/buildings";

const initialState: BuildingFormState = { success: false };

export function AddBuildingForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(createBuilding, initialState);

  return (
    <div>
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
        className="bg-brand px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-hover"
      >
        {isOpen ? "Cancelar" : "+ Agregar edificio"}
      </button>

      {isOpen && (
        <form action={formAction} className="mt-5 grid gap-4 border-y border-border py-5 sm:grid-cols-2">
          <label className="grid gap-1.5 text-sm font-medium">
            Nombre del edificio
            <input
              name="name"
              required
              maxLength={120}
              placeholder="Ej. Edificio Central"
              className="rounded-md border border-border bg-background px-3 py-2 font-normal"
            />
          </label>
          <label className="grid gap-1.5 text-sm font-medium">
            Dirección
            <input
              name="address"
              required
              maxLength={200}
              placeholder="Calle y altura"
              className="rounded-md border border-border bg-background px-3 py-2 font-normal"
            />
          </label>
          <label className="grid gap-1.5 text-sm font-medium">
            Ciudad
            <input
              name="city"
              maxLength={100}
              placeholder="Santiago del Estero"
              className="rounded-md border border-border bg-background px-3 py-2 font-normal"
            />
          </label>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={isPending}
              className="bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-hover disabled:cursor-wait disabled:opacity-60"
            >
              {isPending ? "Guardando..." : "Guardar edificio"}
            </button>
          </div>
          {state.error && <p role="alert" className="text-sm text-red-600 sm:col-span-2">{state.error}</p>}
          {state.message && <p role="status" className="text-sm text-emerald-700 sm:col-span-2">{state.message}</p>}
        </form>
      )}
    </div>
  );
}