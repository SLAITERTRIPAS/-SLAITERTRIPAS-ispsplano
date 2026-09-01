import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

interface SectorSelectionViewProps {
  user: any;
  sectors?: string[];
  onSelectSector: (sector: string) => void;
  onBack?: () => void;
}

export const SectorSelectionView: React.FC<SectorSelectionViewProps> = ({
  user,
  sectors = [],
  onSelectSector,
  onBack,
}) => {
  // Lista de setores garantida a partir dos setores atribuídos pelo RH ou dados do usuário
  const availableSectors =
    sectors.length > 0
      ? sectors
      : user?.setoresAtribuidos && user.setoresAtribuidos.length > 0
        ? user.setoresAtribuidos
        : [
            user?.departamento ||
              user?.setor ||
              user?.reparticao ||
              user?.areaDeAfetacao ||
              "Área de Trabalho",
          ];

  const [selectedSector, setSelectedSector] = useState<string>(
    user?.setor && availableSectors.includes(user.setor)
      ? user.setor
      : availableSectors[0] || "",
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSector) {
      onSelectSector(selectedSector);
    }
  };

  return (
    <div className="w-full h-full min-h-[550px] flex-grow flex items-center justify-center p-4 sm:p-8 bg-[#f8fafc]">
      <div className="relative bg-white rounded-[28px] shadow-2xl border border-slate-100/90 max-w-md w-full p-8 pt-10 text-center animate-fade-in">
        {/* Pill Superior - MENU SETORIAL */}
        <div className="absolute -top-4.5 left-1/2 -translate-x-1/2 bg-[#222a3d] text-[#FFB800] text-[11px] sm:text-xs font-black tracking-widest  px-7 py-2 rounded-full shadow-md border border-[#3b4760] whitespace-nowrap">
          MENU SETORIAL
        </div>

        {/* Título */}
        <h2 className="text-slate-700 font-bold text-xs  tracking-wider mb-6 mt-1">
          SELECIONE A SUA ÁREA DE TRABALHO
        </h2>

        {/* Formulário de Seleção */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative w-full text-left">
            <select
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value)}
              className="w-full bg-white border-2 border-[#f97316] text-slate-800 font-semibold text-sm rounded-2xl py-3.5 px-4 pr-10 focus:outline-none focus:ring-4 focus:ring-[#f97316]/20 appearance-none cursor-pointer shadow-sm transition-all"
            >
              {availableSectors.map((sec: string, index: number) => (
                <option key={index} value={sec} className="py-2 text-slate-800">
                  {sec}
                </option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#f97316] flex items-center">
              <ChevronDown size={18} strokeWidth={2.5} />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-[#f97316] hover:bg-[#ea580c] text-white font-bold text-sm py-3.5 px-6 rounded-2xl shadow-lg shadow-orange-500/20 active:scale-[0.98] transition-all cursor-pointer"
          >
            Acessar Área
          </button>
        </form>
      </div>
    </div>
  );
};
