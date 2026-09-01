import React, { useState } from "react";
import {
  Search,
  Plus,
  ArrowLeft,
  Heart,
  Printer,
  FileText,
  Users,
  FilePlus,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import AssistenciaMedicaView from "../bloco4_servicos_centrais/AssistenciaMedicaView";

export default function GestaoSocialView({ onBack }: { onBack: () => void }) {
  const [activeModule, setActiveModule] = useState<string | null>(null);

  if (activeModule === "assistencia_medica") {
    return <AssistenciaMedicaView onBack={() => setActiveModule(null)} />;
  }

  return (
    <div className="w-full h-full flex flex-col bg-gray-50 border-2 border-slate-100 rounded-3xl overflow-hidden shadow-sm">
      <header className="bg-white border-b border-gray-100 p-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-xl transition-all"
          >
            <ArrowLeft className="text-gray-500" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Heart className="text-red-500" /> Gestão de Social
            </h2>
            <p className="text-sm text-gray-500">
              Gerencie os pedidos de assistência e apoio aos colaboradores
            </p>
          </div>
        </div>
      </header>

      <div className="flex-1 p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <button
            onClick={() => setActiveModule("assistencia_medica")}
            className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-lg hover:border-blue-300 transition-all group text-left flex flex-col h-full"
          >
            <div className="bg-red-50 p-4 rounded-2xl w-fit group-hover:scale-110 group-hover:bg-red-100 transition-all mb-6">
              <Heart className="text-red-600" size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              Assistência Médica e Medicamentosa
            </h3>
            <p className="text-gray-500 text-sm">
              Gerir cartões de assistência médica aos funcionários e empregados
              do Estado.
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}
