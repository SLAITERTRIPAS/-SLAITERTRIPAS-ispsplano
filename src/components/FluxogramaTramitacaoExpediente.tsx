import { printElementById } from "../lib/printUtils";
import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  FileText,
  UserCheck,
  Building,
  DollarSign,
  Truck,
  Briefcase,
  Layers,
  Award,
  CheckCircle2,
  Clock,
  Send,
  Printer,
  ChevronRight,
  Info,
  ShieldCheck,
  Users,
  ArrowRight,
  Share2,
  FileCheck,
  Megaphone,
  Bus,
  Sparkles,
  HelpCircle,
} from "lucide-react";
import { Expediente } from "../types";

export interface FluxoEtapa {
  id: number;
  codigo: string;
  ator: string;
  acaoTopo: string;
  acaoDescricao: string;
  subtitulo: string;
  corBadge: string;
  corGradiente: string;
  corBorda: string;
  corTexto: string;
  icone: any;
  departamento: string;
  descricaoDetalhada: string;
  prazosMedios: string;
  documentosGerados: string[];
  responsaveis: string;
}

export const ETAPAS_FLUXOGRAMA: FluxoEtapa[] = [
  {
    id: 1,
    codigo: "ELAB",
    ator: "Técnico",
    acaoTopo: "Elabora Documento",
    acaoDescricao: "Elaboração da proposta, requisição ou expediente inicial",
    subtitulo: "Elaboração",
    corBadge: "bg-amber-600 text-white",
    corGradiente: "from-amber-600 to-orange-700",
    corBorda: "border-amber-500",
    corTexto: "text-amber-500",
    icone: FileText,
    departamento: "Setor de Origem / Técnico Requisitante",
    descricaoDetalhada:
      "O técnico responsável redige a proposta, informação, relatório ou pedido de viagem com a fundamentação técnica necessária e submete para validação do seu chefe de setor.",
    prazosMedios: "1 a 2 dias",
    documentosGerados: ["Informação-Proposta", "Requisição Interna", "Minuta de Ofício"],
    responsaveis: "Técnicos e Especialistas dos Setores",
  },
  {
    id: 2,
    codigo: "CHEF",
    ator: "Chefe do Setor",
    acaoTopo: "Assina e Envia",
    acaoDescricao: "Parecer inicial e encaminhamento hierárquico",
    subtitulo: "Parecer Inicial",
    corBadge: "bg-blue-600 text-white",
    corGradiente: "from-blue-600 to-indigo-700",
    corBorda: "border-blue-500",
    corTexto: "text-blue-500",
    icone: UserCheck,
    departamento: "Chefia do Setor / Repartição",
    descricaoDetalhada:
      "A chefia direta analisa a conformidade do pedido, anexa o parecer preliminar de oportunidade/mérito, assina digitalmente e despacha para protocolo da Secretaria Geral.",
    prazosMedios: "24 horas",
    documentosGerados: ["Parecer do Chefe de Setor", "Despacho Inicial"],
    responsaveis: "Chefes de Repartição / Setores",
  },
  {
    id: 3,
    codigo: "SEC_GERAL",
    ator: "Secretaria Geral",
    acaoTopo: "Recepção & Protocolo",
    acaoDescricao: "Registro no livro de protocolo e distribuição institucional",
    subtitulo: "Recepção",
    corBadge: "bg-slate-700 text-white",
    corGradiente: "from-slate-700 to-slate-900",
    corBorda: "border-slate-500",
    corTexto: "text-slate-300",
    icone: Building,
    departamento: "Secretaria Geral (Protocolo Central)",
    descricaoDetalhada:
      "Gera o número de registro de entrada/saída no sistema de rastreio, protocola o documento e faz o direcionamento aos órgãos setoriais competentes (DAF / Transporte).",
    prazosMedios: "Imediato a 12 horas",
    documentosGerados: ["Protocolo de Entrada", "Número de Rastreio SIGEP"],
    responsaveis: "Oficiais de Protocolo da Secretaria Geral",
  },
  {
    id: 4,
    codigo: "DAF",
    ator: "DAF",
    acaoTopo: "Parecer Financeiro",
    acaoDescricao: "Verificação de cabimento orçamental e sustentabilidade",
    subtitulo: "Análise Orçamental",
    corBadge: "bg-emerald-700 text-white",
    corGradiente: "from-emerald-700 to-teal-800",
    corBorda: "border-emerald-500",
    corTexto: "text-emerald-500",
    icone: DollarSign,
    departamento: "Departamento de Administração e Finanças (DAF)",
    descricaoDetalhada:
      "Examina a dotação orçamental disponível, cálculo de ajudas de custo, combustível e emite o parecer de disponibilidade financeira para execução.",
    prazosMedios: "24 a 48 horas",
    documentosGerados: ["Parecer Financeiro", "Cálculo de Ajudas de Custo", "Reserva de Cabimento"],
    responsaveis: "Chefe do DAF / Contabilidade / Finanças",
  },
  {
    id: 5,
    codigo: "TRANSP",
    ator: "Transporte",
    acaoTopo: "Parecer Logístico",
    acaoDescricao: "Disponibilidade de viatura, motorista e itinerário",
    subtitulo: "Verificação de Meios",
    corBadge: "bg-green-600 text-white",
    corGradiente: "from-green-600 to-emerald-700",
    corBorda: "border-green-500",
    corTexto: "text-green-500",
    icone: Truck,
    departamento: "Setor de Transportes e Logística",
    descricaoDetalhada:
      "Valida a alocação de viatura institucional, escala de motoristas e disponibilidade de combustível para deslocações e apoios logísticos.",
    prazosMedios: "12 a 24 horas",
    documentosGerados: ["Ficha de Alocação de Viatura", "Parecer Logístico"],
    responsaveis: "Responsável do Setor de Transportes",
  },
  {
    id: 6,
    codigo: "DICOSAFA",
    ator: "Dir. DICOSAFA",
    acaoTopo: "Parecer Administrativo",
    acaoDescricao: "Homologação operacional e conformidade de serviços",
    subtitulo: "Análise Técnica",
    corBadge: "bg-teal-700 text-white",
    corGradiente: "from-teal-700 to-cyan-900",
    corBorda: "border-teal-500",
    corTexto: "text-teal-400",
    icone: Briefcase,
    departamento: "Direção de Coordenação de Serv. de Administração, Finanças e Apoio",
    descricaoDetalhada:
      "Emite o parecer técnico integrado e validação final da gestão de apoio administrativo antes de submeter à apreciação do Diretor-Geral.",
    prazosMedios: "24 a 48 horas",
    documentosGerados: ["Parecer Técnico DICOSAFA", "Homologação Prévia"],
    responsaveis: "Diretor da DICOSAFA",
  },
  {
    id: 7,
    codigo: "SEC_EXEC",
    ator: "Secretaria Executiva",
    acaoTopo: "Registro & Preparo",
    acaoDescricao: "Organização da pasta de despacho para a Direção-Geral",
    subtitulo: "Registro",
    corBadge: "bg-indigo-700 text-white",
    corGradiente: "from-indigo-700 to-blue-900",
    corBorda: "border-indigo-500",
    corTexto: "text-indigo-400",
    icone: Layers,
    departamento: "Gabinete do Diretor-Geral / Secretaria Executiva",
    descricaoDetalhada:
      "Confere a instrução completa do processo, organiza pareceres anexados e apresenta ao Diretor-Geral para decisão final e vinculativa.",
    prazosMedios: "12 horas",
    documentosGerados: ["Pasta de Despacho", "Ficha de Sumário Executivo"],
    responsaveis: "Secretária Executiva do Gabinete do Diretor-Geral",
  },
  {
    id: 8,
    codigo: "DIR_GERAL",
    ator: "Diretor Geral",
    acaoTopo: "Despacho Final",
    acaoDescricao: "Aprovação soberana, homologação ou indeferimento",
    subtitulo: "Despacho Final",
    corBadge: "bg-blue-900 text-white",
    corGradiente: "from-blue-900 to-slate-950",
    corBorda: "border-blue-400",
    corTexto: "text-blue-300",
    icone: Award,
    departamento: "Direção Geral do ISPSFI - Songo",
    descricaoDetalhada:
      "Exerce a competência máxima decisória, emitindo o despacho de deferimento, condicionamento ou rejeição com assinatura digital homologada.",
    prazosMedios: "24 a 48 horas",
    documentosGerados: ["Despacho Oficial Soberano", "Homologação Final"],
    responsaveis: "Diretor-Geral do ISPSFI",
  },
];

export const RAMIFICACOES_FINAIS = [
  {
    id: "rh",
    sigla: "RH",
    titulo: "Recursos Humanos",
    sub: "Emissão de Guia de Viagem / Apresentação",
    icone: FileCheck,
    cor: "border-rose-500 bg-rose-950/40 text-rose-300",
    badge: "RH",
    descricao: "Lavra a Guia de Marcha / Apresentação Interna e anota no cadastro.",
  },
  {
    id: "daf",
    sigla: "DAF",
    titulo: "DAF (Pagamento)",
    sub: "Execução Financeira & Pagamento",
    icone: DollarSign,
    cor: "border-emerald-500 bg-emerald-950/40 text-emerald-300",
    badge: "DAF",
    descricao: "Emite a ordem de pagamento, adiantamento ou liquidação de despesa.",
  },
  {
    id: "transporte",
    sigla: "DAE / Logística",
    titulo: "Transporte / DAE",
    sub: "Liberação de Meios & Apoio Estudantil",
    icone: Bus,
    cor: "border-amber-500 bg-amber-950/40 text-amber-300",
    badge: "DAE",
    descricao: "Emite a ordem de saída de viatura e coordena deslocamentos.",
  },
  {
    id: "comunicado",
    sigla: "Comunicado",
    titulo: "Conselho / Comunicado",
    sub: "Ponderado & Comunicação aos Setores",
    icone: Megaphone,
    cor: "border-cyan-500 bg-cyan-950/40 text-cyan-300",
    badge: "Conselho",
    descricao: "Notifica o requerente e arquiva cópia autenticada no repositório geral.",
  },
];

interface FluxogramaTramitacaoExpedienteProps {
  expediente?: Expediente | null;
  onSelectEtapa?: (etapa: FluxoEtapa) => void;
  showSimulador?: boolean;
  className?: string;
}

export default function FluxogramaTramitacaoExpediente({
  expediente,
  onSelectEtapa,
  showSimulador = true,
  className = "",
}: FluxogramaTramitacaoExpedienteProps) {
  const [etapaSelecionada, setEtapaSelecionada] = useState<FluxoEtapa | null>(null);
  const [etapaSimulada, setEtapaSimulada] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<"horizontal" | "detalhada">("horizontal");

  // Identificar qual etapa o documento real está
  const etapaAtualDocumento = useMemo(() => {
    if (!expediente) return null;
    const st = String(expediente.status || "").toLowerCase();
    const dest = String(expediente.encaminhadoPara || expediente.destino || "").toUpperCase();

    if (st.includes("finalizado") || st.includes("conclu") || st.includes("arquivado")) return 8;
    if (st.includes("aprovado") || dest.includes("DIRETOR GERAL") || dest.includes("DIR. GERAL")) return 8;
    if (dest.includes("SECRETARIA EXECUTIVA") || dest.includes("SEC. EXEC")) return 7;
    if (dest.includes("DICOSAFA")) return 6;
    if (dest.includes("TRANSPORTE") || dest.includes("LOGISTICA")) return 5;
    if (dest.includes("DAF") || dest.includes("FINANC")) return 4;
    if (dest.includes("SECRETARIA GERAL") || dest.includes("PROTOCOLO")) return 3;
    if (dest.includes("CHEFE") || dest.includes("REPARTIÇÃO")) return 2;
    return 1;
  }, [expediente]);

  // Simulação automática
  React.useEffect(() => {
    let interval: any = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setEtapaSimulada((prev) => (prev >= 8 ? 1 : prev + 1));
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const handlePrint = () => {
    printElementById("print-area");
  };

  return (
      <div id="print-area"
      className={`w-full bg-slate-950 text-slate-100 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col ${className}`}
    >
      {/* 1. TOPO / BANNER INSTITUCIONAL OFICIAL (COMO NA IMAGEM) */}
      <div className="bg-gradient-to-r from-[#c2410c] via-[#ea580c] to-[#f97316] px-6 py-4 md:py-5 flex flex-col md:flex-row items-center justify-between shadow-lg relative border-b border-orange-600/40">
        <div className="flex items-center gap-4 text-center md:text-left">
          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-inner">
            <Share2 className="text-white w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-black text-white tracking-wider uppercase font-serif drop-shadow-md">
              Fluxo de Tramitação de Expediente
            </h2>
            <p className="text-xs text-orange-100 font-medium tracking-wide">
              Instituto Superior Politécnico de Songo • Sistema Integrado de Gestão (SIGEP)
            </p>
          </div>
        </div>

        {/* CONTROLES E BADGE */}
        <div className="flex items-center gap-2.5 mt-3 md:mt-0">
          <button
            onClick={() => setViewMode(viewMode === "horizontal" ? "detalhada" : "horizontal")}
            className="px-3.5 py-1.5 rounded-xl bg-black/20 hover:bg-black/40 text-white text-xs font-bold border border-white/20 transition-all cursor-pointer backdrop-blur-sm"
          >
            {viewMode === "horizontal" ? "Modo Detalhado" : "Modo Fluxo"}
          </button>
          <button
            onClick={handlePrint}
            title="Imprimir Fluxograma"
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all cursor-pointer backdrop-blur-sm"
          >
            <Printer size={16} />
          </button>
          <span className="bg-white text-orange-700 px-3.5 py-1 rounded-full text-xs font-black tracking-wider uppercase shadow-md flex items-center gap-1.5">
            <Sparkles size={12} className="text-orange-500" />
            Oficial ISPSFI
          </span>
        </div>
      </div>

      {/* 2. BARRA DE RASTREIO EM TEMPO REAL (COMO NA IMAGEM) */}
      <div className="bg-slate-900/90 border-b border-slate-800/80 px-6 py-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
            <span className="text-xs font-black tracking-widest uppercase text-amber-400">
              Rastreio em Tempo Real:
            </span>
            {expediente && (
              <span className="text-xs font-mono text-slate-300 bg-slate-800 px-2.5 py-0.5 rounded-md border border-slate-700">
                Nº {expediente.numeroRastreio || expediente.numeroReferencia || "EXP-2026"}
              </span>
            )}
          </div>

          {/* CHIPS DE STATUS EM TEMPO REAL (COMO NA BASE DA IMAGEM) */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-emerald-950/70 border border-emerald-500/40 text-emerald-400 px-3 py-1 rounded-full text-[11px] font-bold shadow-sm">
              <CheckCircle2 size={13} className="text-emerald-400" />
              <span>Documento Criado</span>
            </div>
            <div className="flex items-center gap-1.5 bg-amber-950/70 border border-amber-500/40 text-amber-400 px-3 py-1 rounded-full text-[11px] font-bold shadow-sm">
              <Clock size={13} className="text-amber-400" />
              <span>Em Análise</span>
            </div>
            <div className="flex items-center gap-1.5 bg-emerald-950/70 border border-emerald-500/40 text-emerald-400 px-3 py-1 rounded-full text-[11px] font-bold shadow-sm">
              <CheckCircle2 size={13} className="text-emerald-400" />
              <span>Aprovado</span>
            </div>
            <div className="flex items-center gap-1.5 bg-teal-950/70 border border-teal-500/40 text-teal-400 px-3 py-1 rounded-full text-[11px] font-bold shadow-sm">
              <ShieldCheck size={13} className="text-teal-400" />
              <span>Executado</span>
            </div>
            <div className="flex items-center gap-1.5 bg-blue-950/70 border border-blue-500/40 text-blue-400 px-3 py-1 rounded-full text-[11px] font-bold shadow-sm">
              <CheckCircle2 size={13} className="text-blue-400" />
              <span>Concluído / Arquivado</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. FLUXOGRAMA SEQUENCIAL (PIPELINE ESTILO CHEVRON INTERATIVO) */}
      <div className="p-6 overflow-x-auto no-scrollbar">
        <div className="min-w-[1100px] flex flex-col gap-8">
          {/* A. CABEÇALHO DA SEQUÊNCIA (CHEVRON BANNER REPRODUZINDO A IMAGEM) */}
          <div className="grid grid-cols-8 gap-1 rounded-xl overflow-hidden border border-slate-700/60 shadow-xl bg-slate-900/60">
            {ETAPAS_FLUXOGRAMA.map((etapa, idx) => {
              const isAtivo =
                (etapaAtualDocumento && etapaAtualDocumento === etapa.id) ||
                etapaSimulada === etapa.id ||
                etapaSelecionada?.id === etapa.id;

              return (
                <button
                  key={etapa.id}
                  onClick={() => {
                    setEtapaSelecionada(etapa);
                    if (onSelectEtapa) onSelectEtapa(etapa);
                  }}
                  className={`relative p-3 text-center transition-all cursor-pointer flex flex-col items-center justify-center min-h-[70px] ${
                    isAtivo
                      ? `${etapa.corBadge} shadow-lg scale-[1.02] z-10 font-bold ring-2 ring-amber-400`
                      : "bg-slate-900/80 hover:bg-slate-850 text-slate-300"
                  }`}
                >
                  <span className="text-[11px] font-black uppercase tracking-wider block truncate w-full">
                    {etapa.ator}
                  </span>
                  <span className="text-[9px] opacity-90 block truncate w-full font-medium mt-0.5">
                    {etapa.acaoTopo}
                  </span>
                  {isAtivo && (
                    <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-amber-400 rotate-45" />
                  )}
                </button>
              );
            })}
          </div>

          {/* B. CORPO DAS FIGURAS E AÇÕES SEQUENCIAIS COM SETAS */}
          <div className="grid grid-cols-8 gap-3 items-center relative">
            {ETAPAS_FLUXOGRAMA.map((etapa, index) => {
              const isCurrent =
                (etapaAtualDocumento && etapaAtualDocumento === etapa.id) ||
                etapaSimulada === etapa.id;
              const isSelected = etapaSelecionada?.id === etapa.id;
              const IconComp = etapa.icone;

              return (
                <React.Fragment key={etapa.id}>
                  <motion.div
                    whileHover={{ scale: 1.04 }}
                    onClick={() => {
                      setEtapaSelecionada(etapa);
                      if (onSelectEtapa) onSelectEtapa(etapa);
                    }}
                    className={`flex flex-col items-center text-center p-4 rounded-2xl border transition-all cursor-pointer relative ${
                      isSelected
                        ? "bg-slate-900 border-amber-400 shadow-2xl ring-2 ring-amber-500/50"
                        : isCurrent
                        ? "bg-slate-900/90 border-emerald-400/80 shadow-xl"
                        : "bg-slate-900/40 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60"
                    }`}
                  >
                    {/* Marcador de Passo */}
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-slate-950 border border-slate-700 text-[10px] font-black flex items-center justify-center text-slate-300">
                      {etapa.id}
                    </div>

                    {/* Ilustração / Ícone do Agente do Fluxo */}
                    <div
                      className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-3 mt-1 shadow-inner border transition-all ${
                        isCurrent
                          ? `bg-gradient-to-br ${etapa.corGradiente} border-white/30 text-white animate-bounce`
                          : "bg-slate-800/80 border-slate-700 text-slate-300"
                      }`}
                    >
                      <IconComp size={28} />
                    </div>

                    {/* Subtítulo da Ação (como no diagrama: Elaboração, Parecer Inicial, Recepção, etc) */}
                    <span className="text-xs font-black text-white tracking-wide block">
                      {etapa.subtitulo}
                    </span>

                    {/* Resumo da Ação */}
                    <p className="text-[10px] text-slate-400 font-medium line-clamp-2 mt-1 leading-tight">
                      {etapa.acaoDescricao}
                    </p>

                    {/* Indicador de Status Ativo no Documento */}
                    {isCurrent && (
                      <span className="mt-2 text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 shadow-md">
                        ● Posição Atual
                      </span>
                    )}
                  </motion.div>
                </React.Fragment>
              );
            })}
          </div>

          {/* C. LINHA DE DESTINATÁRIOS / EXECUÇÃO PÓS-DESPACHO DO DIRETOR-GERAL (RAMIFICAÇÃO DIREITA) */}
          <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <ArrowRight className="text-amber-400" size={18} />
                <h4 className="text-xs font-black uppercase tracking-widest text-amber-400">
                  Desdobramento Pós-Despacho Final do Diretor-Geral (Execução Operacional)
                </h4>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                Articulação Multisetorial Automatizada
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {RAMIFICACOES_FINAIS.map((ram) => {
                const IconeRam = ram.icone;
                return (
                  <div
                    key={ram.id}
                    className={`p-3.5 rounded-xl border flex items-start gap-3 transition-all hover:scale-[1.02] ${ram.cor}`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center shrink-0">
                      <IconeRam size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black uppercase tracking-wider">{ram.titulo}</span>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-black/50">
                          {ram.badge}
                        </span>
                      </div>
                      <span className="text-[10px] font-semibold opacity-90 block mt-0.5">
                        {ram.sub}
                      </span>
                      <p className="text-[9px] opacity-75 mt-1 leading-snug">{ram.descricao}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 4. PAINEL INFORMATIVO / SIMULADOR DA ETAPA SELECIONADA */}
      <AnimatePresence>
        {etapaSelecionada && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-slate-800 bg-slate-900/95 p-6"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center ${etapaSelecionada.corBadge}`}
                >
                  <etapaSelecionada.icone size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase px-2 py-0.5 rounded bg-slate-800 text-amber-400 border border-slate-700">
                      Etapa {etapaSelecionada.id} de 8
                    </span>
                    <h3 className="text-base font-black text-white">
                      {etapaSelecionada.ator} — {etapaSelecionada.subtitulo}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    Unidade: {etapaSelecionada.departamento}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setEtapaSelecionada(null)}
                className="text-slate-400 hover:text-white text-xs font-bold px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 transition-all cursor-pointer"
              >
                Fechar Detalhes
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
              <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800">
                <span className="text-[10px] font-black tracking-wider uppercase text-slate-400 block mb-1.5">
                  Descrição dos Procedimentos
                </span>
                <p className="text-xs text-slate-200 leading-relaxed font-medium">
                  {etapaSelecionada.descricaoDetalhada}
                </p>
              </div>

              <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800">
                <span className="text-[10px] font-black tracking-wider uppercase text-slate-400 block mb-1.5">
                  Documentos & Pareceres Emitidos
                </span>
                <ul className="space-y-1">
                  {etapaSelecionada.documentosGerados.map((doc, idx) => (
                    <li key={idx} className="text-xs text-slate-300 flex items-center gap-2 font-medium">
                      <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                      <span>{doc}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800">
                <span className="text-[10px] font-black tracking-wider uppercase text-slate-400 block mb-1.5">
                  SLA & Responsáveis
                </span>
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px] block">Prazo Médio de Resposta:</span>
                    <span className="font-bold text-amber-400">{etapaSelecionada.prazosMedios}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Responsáveis Autorizados:</span>
                    <span className="text-slate-200 font-medium">{etapaSelecionada.responsaveis}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 5. RODAPÉ DE SIMULAÇÃO INTERATIVA */}
      {showSimulador && (
        <div className="bg-slate-950 px-6 py-3.5 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Info size={14} className="text-amber-400" />
            <span>
              Clique em qualquer etapa para inspecionar competências, prazos e documentos normativos.
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Simulador:</span>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                isPlaying
                  ? "bg-rose-600 hover:bg-rose-500 text-white"
                  : "bg-emerald-600 hover:bg-emerald-500 text-white"
              }`}
            >
              {isPlaying ? "Pausar Fluxo" : "Animar Sequência"}
            </button>
            <button
              onClick={() => setEtapaSimulada((prev) => (prev >= 8 ? 1 : prev + 1))}
              className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-all cursor-pointer flex items-center gap-1"
            >
              <span>Avançar</span>
              <ChevronRight size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
