import React, { useState, useEffect } from "react";
import { firestoreService } from "../../lib/firestoreService";
import { Users, BookOpen, Clock, Save } from "lucide-react";
import { loadAllDocentes } from "../../lib/allocationUtils";

export default function GeradorExamesView({ user, onShowAlert }: { user: any; onShowAlert: (msg: string) => void }) {
  const [docentes, setDocentes] = useState<any[]>([]);
  const [disciplinas, setDisciplinas] = useState<any[]>([]);
  const [salas, setSalas] = useState<any[]>([]);
  const [config, setConfig] = useState({ tipo: "Normal", disciplina: "", data: "", sala: "", vigilante: "" });

  useEffect(() => {
    const unsubDocentes = firestoreService.colaboradores.subscribe((data: any) => {
        setDocentes(loadAllDocentes(data || []));
    });
    const unsubSalas = firestoreService.espacos_fisicos.subscribe((data: any) => {
        setSalas(data || []);
    });
    const unsubDisc = firestoreService.disciplinas_academicas.subscribe((data: any[]) => {
        const comExame = (data || []).filter((d) => d.classificacaoExame !== "sem_exame");
        setDisciplinas(comExame);
    });
    return () => {
      unsubDocentes();
      unsubSalas();
      unsubDisc();
    };
  }, []);

  const handleGenerate = async () => {
    if (!config.disciplina || !config.sala || !config.vigilante || !config.data) {
        onShowAlert("Preencha todos os dados obrigatórios.");
        return;
    }
    const disciplina = disciplinas.find(d => d.id === config.disciplina);
    if (disciplina?.docenteId === config.vigilante) {
        onShowAlert("O vigilante não pode ser o docente da disciplina!");
        return;
    }
    
    try {
      await firestoreService.exames.add({
        ...config,
        disciplinaNome: disciplina?.nome || "",
        createdAt: new Date().toISOString(),
      });
      onShowAlert("Exame gerado e agendado com sucesso!");
      setConfig({ tipo: "Normal", disciplina: "", data: "", sala: "", vigilante: "" });
    } catch (err) {
      onShowAlert("Erro ao agendar exame.");
    }
  };

  return (
    <div className="space-y-6">
        <h3 className="text-lg font-bold text-blue-900">Gerador e Agendamento de Exames</h3>
        
        <div className="flex flex-wrap gap-4">
            <button className={`px-4 py-2 rounded-xl text-xs font-bold transition ${config.tipo === "Normal" ? "bg-blue-600 text-white shadow-sm" : "bg-gray-100 text-slate-700"}`} onClick={() => setConfig({...config, tipo: "Normal"})}>Exame Normal</button>
            <button className={`px-4 py-2 rounded-xl text-xs font-bold transition ${config.tipo === "Recorrência" ? "bg-blue-600 text-white shadow-sm" : "bg-gray-100 text-slate-700"}`} onClick={() => setConfig({...config, tipo: "Recorrência"})}>Exame de Recorrência</button>
            <button className={`px-4 py-2 rounded-xl text-xs font-bold transition ${config.tipo === "Especial" ? "bg-amber-600 text-white shadow-sm" : "bg-amber-50 text-amber-800 border border-amber-200"}`} onClick={() => setConfig({...config, tipo: "Especial"})}>⭐ Exame Especial (Criado pelo Diretor de Curso)</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Disciplina com Exame *</label>
              <select className="w-full p-2.5 border rounded-xl text-sm" value={config.disciplina} onChange={e => setConfig({...config, disciplina: e.target.value})}>
                  <option value="">Selecione Disciplina com Exame</option>
                  {disciplinas.map(d => <option key={d.id} value={d.id}>{d.codigo} - {d.nome} ({d.curso})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Data do Exame *</label>
              <input type="date" className="w-full p-2.5 border rounded-xl text-sm" value={config.data} onChange={e => setConfig({...config, data: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Sala / Anfiteatro *</label>
              <select className="w-full p-2.5 border rounded-xl text-sm" value={config.sala} onChange={e => setConfig({...config, sala: e.target.value})}>
                  <option value="">Selecione Sala</option>
                  {salas.map(s => <option key={s.id} value={s.id}>{s.sala || s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Docente Vigilante *</label>
              <select className="w-full p-2.5 border rounded-xl text-sm" value={config.vigilante} onChange={e => setConfig({...config, vigilante: e.target.value})}>
                  <option value="">Selecione Vigilante</option>
                  {docentes.filter(d => d.id !== disciplinas.find(disc => disc.id === config.disciplina)?.docenteId).map(d => <option key={d.id} value={d.id}>{d.nome}</option>)}
              </select>
            </div>
        </div>
        <button onClick={handleGenerate} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm transition">
            <Save size={16} /> Registar Agendamento de Exame
        </button>
    </div>
  );
}
