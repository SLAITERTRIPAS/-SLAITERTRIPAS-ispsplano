import React, { useState, useEffect, useMemo } from "react";
import {
  LayoutGrid,
  Home,
  Monitor,
  Car,
  FolderClosed,
  History as HistoryIcon,
  FileText,
  ArrowLeft,
  User,
} from "lucide-react";
import { motion } from "motion/react";
import { firestoreService } from "../../lib/firestoreService";
import { FichaInventarioImovel } from "../bloco6_documentos/FichaInventarioImovel";
import { FichaInventarioVeiculo } from "../bloco6_documentos/FichaInventarioVeiculo";
import { FichaInventarioEquipamento } from "../bloco6_documentos/FichaInventarioEquipamento";
import FichaInventarioMovel from "../bloco6_documentos/FichaInventarioMovel";

export default function BalancoInventarioView({
  user,
  onBack,
}: {
  user?: any;
  onBack?: () => void;
}) {
  const [bens, setBens] = useState<any[]>([]);
  const [inventarios, setInventarios] = useState<any[]>([]);

  const [inventoryType, setInventoryType] = useState<string | null>(null);
  const [showArquivo, setShowArquivo] = useState(false);
  const [selectedArquivoFIM, setSelectedArquivoFIM] = useState<any | null>(
    null,
  );

  useEffect(() => {
    const unsubBens = firestoreService.materiais_bens.subscribe(setBens);
    const unsubInv =
      firestoreService.inventarios_patrimoniais.subscribe(setInventarios);
    return () => {
      unsubBens();
      unsubInv();
    };
  }, []);

  if (selectedArquivoFIM) {
    const commonProps = {
      onCancel: () => setSelectedArquivoFIM(null),
      onSubmit: () => {},
      initialData: selectedArquivoFIM,
      user: user,
      isReadOnly: true,
    };

    switch (selectedArquivoFIM.tipoFicha) {
      case "Imóvel":
        return <FichaInventarioImovel {...commonProps} />;
      case "Veículo":
        return <FichaInventarioVeiculo {...commonProps} />;
      case "Equipamento":
        return <FichaInventarioEquipamento {...commonProps} />;
      default:
        return <FichaInventarioMovel {...commonProps} />;
    }
  }

  if (inventoryType) {
    const props = {
      onCancel: () => setInventoryType(null),
      onSubmit: async () => {
        setInventoryType(null);
      },
      user: user,
    };

    switch (inventoryType) {
      case "Imóvel":
        return <FichaInventarioImovel {...props} />;
      case "Veículo":
        return <FichaInventarioVeiculo {...props} />;
      case "Equipamento":
        return <FichaInventarioEquipamento {...props} />;
      default:
        return <FichaInventarioMovel {...props} />;
    }
  }

  if (showArquivo) {
    const groupedByUser = inventarios.reduce<Record<string, any[]>>(
      (acc, inv) => {
        const userName = inv.utilizadorNome || "Sistema";
        if (!acc[userName]) acc[userName] = [];
        acc[userName].push(inv);
        return acc;
      },
      {},
    );

    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
        <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowArquivo(false)}
              className="p-2 hover:bg-slate-100 rounded-lg"
            >
              <ArrowLeft size={20} className="text-slate-500" />
            </button>
            <div>
              <h3 className="font-bold text-slate-900">
                Arquivo de Fichas Inventariadas
              </h3>
              <p className="text-xs text-slate-500">
                Histórico de registos MIP 01 (FIM) por utilizador
              </p>
            </div>
          </div>
          <FolderClosed size={32} className="text-slate-300" />
        </div>

        {Object.keys(groupedByUser).length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-dashed border-slate-300">
            <FolderClosed size={48} className="mx-auto text-slate-200 mb-4" />
            <p className="text-slate-400 font-medium italic">
              Nenhuma ficha de inventário arquivada no sistema.
            </p>
          </div>
        ) : (
          (Object.entries(groupedByUser) as [string, any[]][]).map(
            ([userName, userInvs]) => (
              <div key={userName} className="space-y-4">
                <div className="flex items-center gap-2 text-slate-500 font-bold px-2">
                  <User size={16} />
                  <span className="tracking-widest text-xs">
                    Utilizador: {userName}
                  </span>
                  <span className="ml-auto bg-slate-100 px-2 py-0.5 rounded text-[10px]">
                    {userInvs.length} FICHAS
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {userInvs.map((inv, idx) => (
                    <motion.div
                      key={idx}
                      whileHover={{ scale: 1.02 }}
                      onClick={() => setSelectedArquivoFIM(inv)}
                      className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md cursor-pointer transition-all flex items-start gap-4"
                    >
                      <div className="bg-blue-50 p-3 rounded-xl text-blue-600">
                        <FileText size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-slate-900 text-sm truncate">
                          {inv.designacaoBem || "Bem sem nome"}
                        </h4>
                        <div className="text-[10px] text-slate-500 mt-1 font-bold tracking-tighter">
                          Nº Ordem: {inv.numeroOrdem || "---"}
                        </div>
                        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-50">
                          <HistoryIcon size={12} className="text-slate-400" />
                          <span className="text-[10px] text-slate-400">
                            {inv.data
                              ? new Date(inv.data).toLocaleDateString()
                              : "Sem data"}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ),
          )
        )}
      </div>
    );
  }

  const filteredBens = bens;

  const handleUpdateEstado = async (id: string, novoEstado: string) => {
    try {
      await firestoreService.materiais_bens.update(id, { estado: novoEstado });
    } catch (error) {
      console.error("Erro ao atualizar estado:", error);
    }
  };

  const groupedBens = filteredBens.reduce<Record<string, any[]>>((acc, bem) => {
    const group = bem.setor || "Sem Setor";
    if (!acc[group]) acc[group] = [];
    acc[group].push(bem);
    return acc;
  }, {});

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
      {onBack && (
        <div className="flex justify-start">
          <button
            onClick={onBack}
            className="p-2 hover:bg-slate-100 rounded-lg flex items-center gap-2 text-sm font-bold text-slate-600"
          >
            <ArrowLeft size={16} /> Voltar aos Balanços
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            id: "Imóvel",
            title: "Imóvel Residencial",
            icon: Home,
            color: "bg-indigo-600",
            description: "MIP 02 - Prédios e Terrenos",
          },
          {
            id: "Móvel",
            title: "Móvel / Mobiliário",
            icon: LayoutGrid,
            color: "bg-blue-600",
            description: "MIP 01 - Mesas, cadeiras, etc",
          },
          {
            id: "Equipamento",
            title: "Equipamento",
            icon: Monitor,
            color: "bg-emerald-600",
            description: "MIP 04 - TI e Maquinaria",
          },
          {
            id: "Veículo",
            title: "Veículo / Frota",
            icon: Car,
            color: "bg-slate-900",
            description: "MIP 03 - Automóveis e Motos",
          },
        ].map((tipo) => (
          <motion.div
            key={tipo.id}
            whileHover={{ y: -4 }}
            onClick={() => setInventoryType(tipo.id)}
            className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 cursor-pointer hover:shadow-md transition-all group"
          >
            <div
              className={`${tipo.color} w-12 h-12 rounded-xl flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform`}
            >
              <tipo.icon size={24} />
            </div>
            <h4 className="font-bold text-slate-900 text-sm">{tipo.title}</h4>
            <p className="text-[10px] text-slate-400 mt-1">
              {tipo.description}
            </p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div
          onClick={() => setShowArquivo(true)}
          className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200 cursor-pointer hover:bg-slate-50 transition-all group lg:col-span-2"
        >
          <div className="flex items-center gap-4">
            <div className="bg-slate-900 p-3 rounded-xl text-white">
              <FolderClosed size={24} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Arquivo Inventariado</h3>
              <p className="text-xs text-slate-500">
                Histórico de todas as fichas MIP já registadas
              </p>
            </div>
          </div>
          <HistoryIcon
            size={24}
            className="text-slate-300 group-hover:text-slate-900 transition-colors"
          />
        </div>
      </div>

      {Object.keys(groupedBens).length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400 text-sm">
          <FolderClosed className="mx-auto text-slate-200 mb-2" size={32} />
          Nenhum bem registado.
        </div>
      ) : (
        Object.entries<any[]>(groupedBens).map(([group, groupBens]) => (
          <div key={group} className="bg-white p-6 rounded-xl shadow-sm border">
            <h3 className="font-bold text-lg text-slate-800 mb-4 tracking-tighter border-b pb-2">
              {group}
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b text-slate-400 text-[10px] font-bold">
                    <th className="pb-3">Nome do Bem</th>
                    <th className="pb-3">Localização Completa</th>
                    <th className="pb-3">Alocado a</th>
                    <th className="pb-3">Estado</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {groupBens.map((bem, idx) => (
                    <tr key={idx} className="border-b hover:bg-slate-50">
                      <td className="py-3 font-medium">{bem.nome}</td>
                      <td className="py-3 text-slate-500">
                        {bem.localizacao}{" "}
                        {bem.espacoFisico && `- ${bem.espacoFisico}`}
                      </td>
                      <td className="py-3 text-slate-500">
                        {bem.utilizador || "Não alocado"}
                      </td>
                      <td className="py-3">
                        <select
                          value={bem.estado || "Bom"}
                          onChange={(e) =>
                            handleUpdateEstado(bem.id, e.target.value)
                          }
                          className={`px-2 py-1 rounded text-xs font-medium border-none focus:ring-2 focus:ring-blue-500 cursor-pointer ${
                            bem.estado === "Excelente" || bem.estado === "Bom"
                              ? "bg-emerald-100 text-emerald-800"
                              : bem.estado === "Razoável"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          <option value="Excelente">Excelente</option>
                          <option value="Bom">Bom</option>
                          <option value="Razoável">Razoável</option>
                          <option value="Mau">Mau</option>
                          <option value="Abatido">Abatido</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
