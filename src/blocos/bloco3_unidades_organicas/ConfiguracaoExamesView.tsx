import React, { useState, useEffect } from "react";
import { Save, Clock } from "lucide-react";
import { firestoreService } from "../../lib/firestoreService";

export default function ConfiguracaoExamesView({ onShowAlert }: { onShowAlert: (msg: string) => void }) {
  const [periods, setPeriods] = useState({
    p1: { inicio: "07:00", fim: "12:30", duracao: 50 },
    p2: { inicio: "13:00", fim: "17:50", duracao: 50 },
    p3: { inicio: "18:50", fim: "23:00", duracao: 50 },
  });

  useEffect(() => {
    // Load existing config
    const unsub = firestoreService.configuracoes.subscribe((data: any) => {
        const exameConfig = data.find((d: any) => d.id === "exame_periods");
        if (exameConfig) {
            setPeriods(exameConfig.data);
        }
    });
    return () => unsub();
  }, []);

  const handleSave = async () => {
    try {
      await firestoreService.configuracoes.set("exame_periods", { data: periods });
      onShowAlert("Configurações de exames atualizadas com sucesso!");
    } catch (error) {
      onShowAlert("Erro ao atualizar configurações.");
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2">
        <Clock size={20} />
        Configuração dos Períodos de Exames
      </h3>
      <div className="space-y-4">
        {Object.entries(periods).map(([key, p]: [string, any]) => (
          <div key={key} className="grid grid-cols-4 gap-4 items-center">
            <span className="font-semibold text-sm capitalize">{key.replace("p", "Período ")}</span>
            <input type="time" value={p.inicio} onChange={(e) => setPeriods({...periods, [key]: {...p, inicio: e.target.value}})} className="p-2 border rounded" />
            <input type="time" value={p.fim} onChange={(e) => setPeriods({...periods, [key]: {...p, fim: e.target.value}})} className="p-2 border rounded" />
            <input type="number" value={p.duracao} onChange={(e) => setPeriods({...periods, [key]: {...p, duracao: parseInt(e.target.value)}})} className="p-2 border rounded" placeholder="Minutos" />
          </div>
        ))}
        <button onClick={handleSave} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700">
          <Save size={16} />
          Guardar Configurações
        </button>
      </div>
    </div>
  );
}
