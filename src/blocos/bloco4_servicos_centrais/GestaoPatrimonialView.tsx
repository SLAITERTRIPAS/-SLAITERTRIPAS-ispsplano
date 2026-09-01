import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft,
  Package,
  ClipboardList,
  BarChart3,
  LayoutGrid,
  ShieldCheck,
  FileText,
  Monitor,
  TrendingUp,
  PlusCircle,
  X,
  Search,
  FolderClosed,
  History as HistoryIcon,
  User,
  Home,
  Car,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Bem } from "../../types";
import { firestoreService } from "../../lib/firestoreService";
import FormularioAlocacao from "../bloco4_servicos_centrais/FormularioAlocacao";
import FormularioEntradaEstoque from "../bloco6_documentos/FormularioEntradaEstoque";
import FormularioRequisicaoInterna from "../bloco6_documentos/FormularioRequisicaoInterna";
import RegistarMateriaisBensForm from "../bloco8_gerais/RegistarMateriaisBensForm";
import DocumentosView from "../bloco6_documentos/DocumentosView";
import WorkflowRequisicaoView from "../bloco5_sistema/WorkflowRequisicaoView";
import FichaInventarioMovel from "../bloco6_documentos/FichaInventarioMovel";
import { FichaInventarioImovel } from "../bloco6_documentos/FichaInventarioImovel";
import { FichaInventarioVeiculo } from "../bloco6_documentos/FichaInventarioVeiculo";
import { FichaInventarioEquipamento } from "../bloco6_documentos/FichaInventarioEquipamento";
import { FichaLocacaoVeiculo } from "../bloco6_documentos/FichaLocacaoVeiculo";
import { FichaLocacaoImovel } from "../bloco6_documentos/FichaLocacaoImovel";
import { FichaLocacaoMovel } from "../bloco6_documentos/FichaLocacaoMovel";
import { FichaLocacaoEquipamento } from "../bloco6_documentos/FichaLocacaoEquipamento";
import VisaoGeralLayout from "../bloco8_gerais/VisaoGeralLayout";
import MatrixView from "../bloco5_sistema/MatrixView";
import CalendarView from "../bloco5_sistema/CalendarView";
import AssinaturaDigitalView from "../bloco5_sistema/AssinaturaDigitalView";
import GestaoDocumentosView from "../bloco4_servicos_centrais/GestaoDocumentosView";
import ReportsView from "../bloco7_relatorios/ReportsView";
import { Pen, Calendar as CalendarIcon, FolderOpen } from "lucide-react";
import BalancoMensalView from "../bloco4_servicos_centrais/BalancoMensalView";
import BalancoCombustivelView from "../bloco4_servicos_centrais/BalancoCombustivelView";
import BalancoInventarioView from "../bloco4_servicos_centrais/BalancoInventarioView";
import BalancoActividadesView from "../bloco4_servicos_centrais/BalancoActividadesView";
import { isSuperBossUser, isPatrimonioBossOrAdmin } from "../../lib/auth";

export default function GestaoPatrimonialView({
  user,
  onBack,
}: {
  user: any;
  onBack: () => void;
}) {
  const [bens, setBens] = React.useState<Bem[]>([]);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [stockEntries, setStockEntries] = React.useState<any[]>([]);
  const [movements, setMovements] = React.useState<any[]>([]);
  const [inventarios, setInventarios] = React.useState<any[]>([]);
  const [matrixActivities, setMatrixActivities] = React.useState<any[]>([]);
  const [activeSubView, setActiveSubView] = useState("plano");
  const [reportData, setReportData] = React.useState<Bem[] | null>(null);
  const [categoryFilter, setCategoryFilter] = useState("Todos");
  const [selectedBemForFIM, setSelectedBemForFIM] = useState<Bem | null>(null);
  const [inventoryType, setInventoryType] = useState<string | null>(null);
  const [showBlankFIM, setShowBlankFIM] = useState(false);
  const [showArquivo, setShowArquivo] = useState(false);
  const [showRequisicaoForm, setShowRequisicaoForm] = useState(false);
  const [selectedArquivoFIM, setSelectedArquivoFIM] = useState<any | null>(
    null,
  );

  const filteredBens = bens.filter(
    (b) => categoryFilter === "Todos" || b.categoria === categoryFilter,
  );

  React.useEffect(() => {
    const unsub1 = firestoreService.materiais_bens.subscribe(setBens);
    const unsub2 = firestoreService.movimentos_economato.subscribe(
      (data: any[]) => {
        setMovements(data);
        setStockEntries(
          data.filter((m) => m.tipo === "ENTRADA_PATRIMONIO").slice(0, 10),
        );
      },
    );
    const unsub3 =
      firestoreService.inventarios_patrimoniais.subscribe(setInventarios);
    const unsub4 =
      firestoreService.matrixActivities.subscribe(setMatrixActivities);
    return () => {
      unsub1();
      unsub2();
      unsub3();
      unsub4();
    };
  }, []);

  const sideItems = [
    { id: "plano", title: "Plano", icon: ClipboardList },
    { id: "calendario", title: "Calendário", icon: CalendarIcon },
    { id: "assinatura_digital", title: "Assinatura Digital", icon: Pen },
    {
      id: "documentos_normativos",
      title: "Documentos Normativos",
      icon: FileText,
    },
    {
      id: "gestao_expediente",
      title: "Gestão de Expediente",
      icon: FolderOpen,
    },
    { id: "relatorios", title: "Relatórios", icon: BarChart3 },
    { id: "balanco", title: "Balanço", icon: TrendingUp },
    { id: "alocacao", title: "Alocação", icon: ClipboardList },
    { id: "inventario", title: "Inventário Geral", icon: LayoutGrid },
    { id: "rrm", title: "Entrada (RRM)", icon: Package },
    {
      id: "requisicao_workflow",
      title: "Requisição Interna",
      icon: ClipboardList,
    },
  ];

  const [showStockEntry, setShowStockEntry] = useState(false);

  const handleInventorySubmit = async (data: any) => {
    try {
      await firestoreService.inventarios_patrimoniais.add(data);
      // Não fechamos mais o modal aqui, deixamos o overlay de sucesso atuar
    } catch (error) {
      console.error("Erro ao guardar inventário:", error);
      alert("Erro ao guardar inventário no servidor.");
      throw error;
    }
  };

  const handleStockSubmit = async (data: any) => {
    try {
      // 1. Registar entrada no sistema de movimentos
      await firestoreService.movimentos_economato.add({
        ...data,
        tipo: "ENTRADA_PATRIMONIO",
        operador: user?.name || "Sistema",
        timestamp: new Date().toISOString(),
      });

      // 2. Registar/Atualizar o bem no Património
      const existingItem = bens.find(
        (b) => b.nome.toLowerCase() === (data.descricao || "").toLowerCase(),
      );

      if (existingItem) {
        const newQty =
          Number(existingItem.quantidadeDisponivel || 0) +
          Number(data.quantidade || 0);
        await firestoreService.materiais_bens.update(existingItem.id, {
          quantidadeDisponivel: newQty,
          updatedBy: user?.email,
        });
      } else {
        await firestoreService.materiais_bens.add({
          nome: data.descricao || "Bem s/ descrição",
          quantidadeDisponivel: Number(data.quantidade || 1),
          localizacaoAtual: data.localizacao || "Depósito E-Património",
          grupo: data.grupo || "Geral",
          estado: data.estado || "Novo",
          setor: "Património",
          updatedBy: user?.email,
        });
      }

      setShowStockEntry(false);
    } catch (error) {
      console.error("Erro ao guardar entrada de património:", error);
      alert("Erro ao sincronizar com servidor E-Património.");
    }
  };

  const handleRegistoSubmit = async (data: any) => {
    try {
      await firestoreService.materiais_bens.add({
        ...data,
        nome: data.nome,
        categoria: data.tipo,
        quantidadeDisponivel: Number(data.quantidadeInicial || 1),
        quantidadeTotal: Number(data.quantidadeInicial || 1),
        localizacaoAtual: data.local || "Património",
        estado: data.estadoAtual || "Novo",
        updatedBy: user?.email,
      });
      alert("Bem registado com sucesso no Património!");
      setActiveSubView("inventario");
    } catch (error) {
      console.error("Erro ao registar bem:", error);
    }
  };

  const [alocacaoType, setAlocacaoType] = useState<string | null>(null);
  const [balancoType, setBalancoType] = useState<string | null>(null);

  const renderContent = () => {
    switch (activeSubView) {
      case "visao_geral":
        return <VisaoGeralLayout title="Gestão Patrimonial" />;
      case "plano":
        const patrimonioActivities = matrixActivities.filter(a => 
          (a.setor || a.departamento || a.unidadeOrganica || "").toLowerCase().includes("patrimonial") ||
          (a.setor || a.departamento || a.unidadeOrganica || "").toLowerCase().includes("património") ||
          (a.setor || a.departamento || a.unidadeOrganica || "").toLowerCase().includes("patrimonio")
        );
        return (
          <MatrixView
            title="Plano da Gestão Patrimonial"
            isDepartment={true}
            externalActivities={patrimonioActivities}
            onDeleteActivity={async (id) => {
              try {
                await firestoreService.matrixActivities.delete(id);
              } catch (error) {
                console.error("Erro ao apagar atividade:", error);
              }
            }}
            onUpdateActivity={async (id, data) => {
              try {
                await firestoreService.matrixActivities.update(id, data);
              } catch (error) {
                console.error("Erro ao atualizar atividade:", error);
              }
            }}
            onActivityAdded={async (act) => {
              try {
                await firestoreService.matrixActivities.add({
                  ...act,
                  setor: "Gestão Patrimonial",
                  departamento: "Gestão Patrimonial",
                  direcao: "Gestão Patrimonial",
                });
              } catch (error) {
                console.error("Erro ao adicionar atividade:", error);
              }
            }}
            user={user}
          />
        );
      case "calendario":
        return (
          <CalendarView
            events={[]}
            notes={[]}
            title="Gestão Patrimonial"
            onAddEvent={async () => {}}
            onUpdateEvent={async () => {}}
            onDeleteEvent={async () => {}}
            onAgendar={() => {}}
            onNota={() => {}}
          />
        );
      case "documentos_normativos":
        return <DocumentosView title="Gestão Patrimonial" user={user} />;
      case "gestao_expediente":
        return (
          <GestaoDocumentosView
            title="Gestão Patrimonial"
            expedientes={[]}
            onUpdateExpediente={() => {}}
            onBack={() => {}}
            onTrackingClick={() => {}}
            hideHeader={true}
          />
        );
      case "assinatura_digital":
        return <AssinaturaDigitalView user={user} onBack={() => {}} />;
      case "relatorios":
        return (
          <ReportsView
            user={user}
            onShowAlert={() => alert("Em desenvolvimento")}
            initialDirection="Gestão Patrimonial"
            onBack={() => {}}
          />
        );
      case "balanco":
        return (
          <BalancoActividadesView
            activities={matrixActivities}
            user={user}
            onBack={() => setActiveSubView("plano")}
            sectorTitle="Gestão Patrimonial"
          />
        );
      case "alocacao":
        if (alocacaoType) {
          const commonProps = {
            user: user,
            onCancel: () => setAlocacaoType(null),
            onSubmit: (data: any) => {
              console.log("Alocação Submetida:", data);
              alert("Ficha de Locação registada com sucesso!");
              setAlocacaoType(null);
            },
          };

          switch (alocacaoType) {
            case "Imóvel":
              return <FichaLocacaoImovel {...commonProps} />;
            case "Móvel":
              return <FichaLocacaoMovel {...commonProps} />;
            case "Equipamento":
              return <FichaLocacaoEquipamento {...commonProps} />;
            case "Veículo":
              return <FichaLocacaoVeiculo {...commonProps} />;
            default:
              return (
                <FormularioAlocacao
                  type={alocacaoType}
                  onCancel={() => setAlocacaoType(null)}
                />
              );
          }
        }
        return (
          <div className="space-y-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900">
                  Ficha Cadastral de Locação de Bem
                </h3>
                <p className="text-xs text-slate-500">
                  Selecione o tipo de bem para iniciar o processo de
                  locação/alocação
                </p>
              </div>
              <ClipboardList className="text-blue-500" size={32} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  id: "Imóvel",
                  title: "Imóvel Residencial",
                  icon: Home,
                  color: "bg-indigo-600",
                  description: "Locação de Prédios e Residências",
                },
                {
                  id: "Móvel",
                  title: "Móvel / Mobiliário",
                  icon: LayoutGrid,
                  color: "bg-blue-600",
                  description: "Alocação de mobiliário de escritório",
                },
                {
                  id: "Equipamento",
                  title: "Equipamento",
                  icon: Monitor,
                  color: "bg-emerald-600",
                  description: "Cessão de TI e Máquinas",
                },
                {
                  id: "Veículo",
                  title: "Veículo / Frota",
                  icon: Car,
                  color: "bg-slate-900",
                  description: "Contratos de locação de viaturas",
                },
              ].map((tipo) => (
                <motion.div
                  key={tipo.id}
                  whileHover={{
                    y: -5,
                    shadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)",
                  }}
                  onClick={() => setAlocacaoType(tipo.id)}
                  className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 cursor-pointer hover:border-blue-500 transition-all group"
                >
                  <div
                    className={`${tipo.color} w-14 h-14 rounded-2xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform shadow-lg`}
                  >
                    <tipo.icon size={28} />
                  </div>
                  <h4 className="font-black text-slate-900 text-sm tracking-tight">
                    {tipo.title}
                  </h4>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    {tipo.description}
                  </p>
                  <div className="mt-6 flex items-center gap-2 text-blue-600 font-bold text-[10px] tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                    Iniciar Ficha <ArrowLeft size={14} className="rotate-180" />
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="bg-slate-900 p-8 rounded-3xl text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <ClipboardList size={120} />
              </div>
              <h4 className="font-bold mb-2">Instruções de Preenchimento</h4>
              <p className="text-sm text-slate-400 max-w-2xl">
                A Ficha Cadastral de Locação é um documento obrigatório para a
                formalização do uso de bens institucionais. Certifique-se de
                anexar a documentação do locatário quando solicitado.
              </p>
            </div>
          </div>
        );
      case "rrm":
        return (
          <div className="space-y-6">
            <FormularioEntradaEstoque
              user={user}
              onCancel={() => setActiveSubView("inventario")}
              onSubmit={handleStockSubmit}
            />

            {/* Histórico Recente de RRM */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-black text-slate-900 text-xs">
                  Últimos Recebimentos Processados
                </h3>
                <div className="text-xs font-bold text-slate-400">
                  {stockEntries.length} Registos Recentes
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-50">
                      <th className="pb-3 text-[10px] font-black text-slate-400">
                        Item
                      </th>
                      <th className="pb-3 text-[10px] font-black text-slate-400">
                        Fornecedor
                      </th>
                      <th className="pb-3 text-[10px] font-black text-slate-400 text-center">
                        Qtd
                      </th>
                      <th className="pb-3 text-[10px] font-black text-slate-400 text-right">
                        Data/Hora
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {stockEntries.map((entry, idx) => (
                      <tr
                        key={idx}
                        className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="py-4">
                          <div className="font-bold text-slate-800 text-sm">
                            {entry.descricao ||
                              (entry.itens && entry.itens[0]?.descricao)}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            RRM: {entry.numeroRRM || entry.id?.slice(0, 8)}
                          </div>
                        </td>
                        <td className="py-4 text-xs font-medium text-slate-600 italic">
                          {entry.fornecedor || "N/A"}
                        </td>
                        <td className="py-4 text-center font-black text-slate-900">
                          {entry.quantidade ||
                            (entry.itens &&
                              entry.itens.reduce(
                                (acc: any, i: any) => acc + i.qtdRecebida,
                                0,
                              ))}
                        </td>
                        <td className="py-4 text-right">
                          <div className="text-xs font-bold text-slate-600">
                            {entry.dataRecebimento ||
                              (entry.timestamp &&
                                new Date(entry.timestamp).toLocaleDateString())}
                          </div>
                          <div className="text-[10px] text-slate-400 italic font-medium">
                            {entry.hora || ""}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {stockEntries.length === 0 && (
                      <tr>
                        <td
                          colSpan={4}
                          className="py-12 text-center text-slate-400 italic text-sm"
                        >
                          Nenhum relatório RRM processado recentemente.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      case "requisicao_workflow":
        if (showRequisicaoForm) {
          return (
            <FormularioRequisicaoInterna
              user={user}
              onCancel={() => setShowRequisicaoForm(false)}
            />
          );
        }
        return (
          <WorkflowRequisicaoView
            user={user}
            onNew={() => setShowRequisicaoForm(true)}
          />
        );
      case "inventario":
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

        if (selectedBemForFIM || showBlankFIM || inventoryType) {
          const type =
            inventoryType ||
            (selectedBemForFIM?.categoria === "Imóveis" ? "Imóvel" : "Móvel");

          const props = {
            onCancel: () => {
              setSelectedBemForFIM(null);
              setShowBlankFIM(false);
              setInventoryType(null);
            },
            onSubmit: handleInventorySubmit,
            initialData: selectedBemForFIM,
            user: user,
          };

          switch (type) {
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
          // Group inventarios by user
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
            <div className="space-y-8">
              <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border">
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
                  <FolderClosed
                    size={48}
                    className="mx-auto text-slate-200 mb-4"
                  />
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
                                <HistoryIcon
                                  size={12}
                                  className="text-slate-400"
                                />
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

        const groupedBens = bens.reduce<Record<string, Bem[]>>((acc, bem) => {
          const group = bem.setor || "Sem Setor";
          if (!acc[group]) acc[group] = [];
          acc[group].push(bem);
          return acc;
        }, {});

        return (
          <div className="space-y-8">
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
                  <h4 className="font-bold text-slate-900 text-sm">
                    {tipo.title}
                  </h4>
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
                    <h3 className="font-bold text-slate-900">
                      Arquivo Inventariado
                    </h3>
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

            {Object.entries<Bem[]>(groupedBens).map(([group, groupBens]) => (
              <div
                key={group}
                className="bg-white p-6 rounded-xl shadow-sm border"
              >
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
                        <th className="pb-3 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupBens.map((bem) => (
                        <tr
                          key={bem.id}
                          className="border-b hover:bg-slate-50 transition-colors"
                        >
                          <td className="py-4 text-sm font-bold text-slate-700">
                            {bem.nome}
                          </td>
                          <td className="py-4 text-xs text-slate-500">
                            {`${bem.unidade || ""} / ${bem.direcao || ""} / ${bem.departamento || ""} / ${bem.reparticao || ""} / ${bem.setor || ""}`
                              .replace(/^\/|\/$/g, " ")
                              .replace(/\s+\//g, "/")
                              .trim() || "Não especificada"}
                          </td>
                          <td className="py-4 text-xs font-medium text-slate-600">
                            {bem.alocadoA || "Não atribuído"}
                          </td>
                          <td className="py-4">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${bem.estado === "Novo" ? "bg-emerald-50 text-emerald-600" : "bg-orange-50 text-orange-600"}`}
                            >
                              {bem.estado || "Indefinido"}
                            </span>
                          </td>
                          <td className="py-4 text-right">
                            <button
                              onClick={() => {
                                setSelectedBemForFIM(bem);
                                setInventoryType(
                                  bem.categoria === "Imóveis"
                                    ? "Imóvel"
                                    : "Móvel",
                                );
                              }}
                              className="bg-blue-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg hover:bg-blue-700 shadow-sm transition-all"
                            >
                              INVENTARIAR
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex h-full bg-gray-50 relative">
      <div
        className={`bg-slate-900 text-white flex flex-col p-4 shadow-xl relative transition-all duration-300 ${
          isSidebarCollapsed ? "w-16 px-2" : "w-64"
        }`}
      >
        {/* Botão de minimização/maximização centrado no limite do submenu lateral */}
        <button
          type="button"
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          title={isSidebarCollapsed ? "Maximizar Menu Lateral" : "Minimizar Menu Lateral"}
          className="hidden md:flex absolute top-1/2 -translate-y-1/2 -right-3.5 z-40 w-7 h-7 bg-white text-slate-900 hover:bg-blue-600 hover:text-white rounded-full border-2 border-slate-300 hover:border-blue-600 shadow-xl items-center justify-center transition-all duration-300 transform hover:scale-110 focus:outline-none cursor-pointer"
        >
          {isSidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>

        {/* Voltar Button */}
        {isPatrimonioBossOrAdmin(user) && (
          <button
            onClick={onBack}
            title="Voltar ao Menu"
            className={`w-full flex items-center gap-3 p-3 mb-4 rounded-xl transition-all duration-200 bg-slate-800/50 hover:bg-slate-800 text-amber-500 hover:text-amber-400 font-bold border border-slate-700/50 hover:border-slate-600 shadow-sm ${
              isSidebarCollapsed ? "justify-center px-0" : ""
            }`}
          >
            <ArrowLeft size={18} className="shrink-0" />
            {!isSidebarCollapsed && <span>Voltar ao Menu</span>}
          </button>
        )}

        <div className="flex-1 space-y-2">
          {sideItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSubView(item.id)}
              title={item.title}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${
                isSidebarCollapsed ? "justify-center px-0" : ""
              } ${activeSubView === item.id ? "bg-slate-800 text-white font-bold" : "hover:bg-slate-800 text-slate-300"}`}
            >
              <item.icon size={20} className="shrink-0" />
              {!isSidebarCollapsed && <span>{item.title}</span>}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 p-8 overflow-y-auto">
        <h2 className="text-2xl font-bold text-slate-800 mb-6">
          Gestão Patrimonial -{" "}
          {sideItems.find((i) => i.id === activeSubView)?.title}
        </h2>
        {renderContent()}
      </div>
    </div>
  );
}
