"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCrmDialogs } from "@/components/crm/useCrmDialogs";

type OpportunityRow = {
  id: string;
  title: string;
  stage_id?: string | null;
  stage_name?: string | null;
  client_name?: string | null;
  responsible_name?: string | null;
  contacts_count?: number;
};

type StageOption = { id: string; name: string };

export default function OpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<OpportunityRow[]>([]);
  const [stages, setStages] = useState<StageOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);
  const { openOpportunity, createOpportunity, dialogs } = useCrmDialogs({
    onRefresh: () => setRefreshToken((prev) => prev + 1),
  });

  useEffect(() => {
    const loadConfig = async () => {
      const res = await fetch("/api/crm/config?kind=opportunity-stages", {
        cache: "no-store",
        credentials: "include",
      });
      if (!res.ok) return;
      const data = await res.json();
      setStages(data?.items || []);
    };
    loadConfig();
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/crm/opportunities", { cache: "no-store", credentials: "include" });
        if (!res.ok) return;
        const data = await res.json();
        setOpportunities(data?.opportunities || []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [refreshToken]);

  const stageOrder = useMemo(() => stages.map((stage) => stage.id), [stages]);

  const grouped = useMemo(() => {
    const map = new Map<string, OpportunityRow[]>();
    stages.forEach((stage) => map.set(stage.id, []));
    map.set("sin_etapa", []);
    opportunities.forEach((row) => {
      const stageId = row.stage_id || "sin_etapa";
      if (!map.has(stageId)) map.set(stageId, []);
      map.get(stageId)!.push(row);
    });
    return map;
  }, [opportunities, stages]);

  const stageList = useMemo(() => {
    const list = stageOrder.map((id) => ({ id, name: stages.find((stage) => stage.id === id)?.name || "" }));
    list.push({ id: "sin_etapa", name: "Sin etapa" });
    return list;
  }, [stageOrder, stages]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Oportunidades</h1>
          <p className="text-sm text-slate-500">Pipeline comercial por etapa.</p>
        </div>
        <Button onClick={createOpportunity}>Nueva oportunidad</Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {stageList.map((stage) => {
          const rows = grouped.get(stage.id) || [];
          return (
            <Card key={stage.id} className="p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-700">{stage.name}</h2>
                <span className="text-xs text-slate-400">{rows.length}</span>
              </div>
              <div className="mt-4 space-y-3">
                {rows.map((row) => (
                  <button
                    key={row.id}
                    type="button"
                    className="w-full rounded-2xl border border-line p-3 text-left transition hover:bg-mist"
                    onClick={() => openOpportunity(row.id)}
                  >
                    <p className="text-sm font-semibold text-slate-800">{row.title}</p>
                    <p className="text-xs text-slate-500">{row.client_name || "-"}</p>
                    <p className="text-xs text-slate-400">{row.responsible_name || "-"}</p>
                  </button>
                ))}
                {!rows.length && !loading && (
                  <p className="text-xs text-slate-400">Sin oportunidades.</p>
                )}
              </div>
            </Card>
          );
        })}
      </div>
      {dialogs}
    </div>
  );
}
