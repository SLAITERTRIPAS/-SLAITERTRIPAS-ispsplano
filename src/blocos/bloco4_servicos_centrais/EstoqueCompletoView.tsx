import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Package,
  Building2,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Filter,
  Clock,
  Calendar,
  User,
  PlusCircle,
  CheckCircle2,
  ShieldAlert,
  Layers,
  TrendingUp,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  FileText,
  Boxes,
  ShoppingCart,
  Check,
  Building,
  MapPin,
  Sparkles,
  PieChart,
  ListChecks,
} from "lucide-react";
import { firestoreService } from "../../lib/firestoreService";
import { DEPARTAMENTOS, REPARTICOES, getDepartamentosByDirecaoKey } from "../../constants/formOptions";

interface EstoqueCompletoViewProps {
  user: any;
  onOpenNovaEntrada: () => void;
  onOpenSaidaConsumo: () => void;
}

export function formatDetailedDate(rawDate: any) {
  let d: Date;
  if (!rawDate) {
    d = new Date();
  } else if (typeof rawDate?.toDate === "function") {
    d = rawDate.toDate();
  } else if (rawDate?.seconds) {
    d = new Date(rawDate.seconds * 1000);
  } else {
    d = new Date(rawDate);
  }

  if (isNaN(d.getTime())) {
    d = new Date();
  }

  const dias = [
    "Domingo",
    "Segunda-feira",
    "Terça-feira",
    "Quarta-feira",
    "Quinta-feira",
    "Sexta-feira",
    "Sábado",
  ];

  const meses = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];

  const diaSemana = dias[d.getDay()];
  const dia = String(d.getDate()).padStart(2, "0");
  const mesIndex = d.getMonth();
  const mesNum = String(mesIndex + 1).padStart(2, "0");
  const mesNome = meses[mesIndex];
  const ano = String(d.getFullYear());
  const horas = String(d.getHours()).padStart(2, "0");
  const minutos = String(d.getMinutes()).padStart(2, "0");

  return {
    diaSemana,
    data: `${dia}/${mesNum}/${ano}`,
    horaMinuto: `${horas}:${minutos}h`,
    mes: mesNome,
    ano,
    fullFormatted: `${diaSemana}, ${dia}/${mesNum}/${ano} às ${horas}:${minutos}h`,
  };
}

// 5 Regras Institucionais de Redistribuição Automática por Quantidade de Entrada no Economato
export const REGRAS_REDISTRIBUICAO_ESTOQUE = [
  {
    id: "engenharia",
    sigla: "Divisão de Engenharia",
    direcao: "Divisão de Engenharia",
    departamentoDefault: "Diretor da Divisão de Engenharia",
    percent: 0.35,
    percentLabel: "35%",
    cor: "from-amber-600 to-orange-700",
    badgeBg: "bg-amber-100 text-amber-800 border-amber-300",
    descricao: "Divisão de Engenharia & Ensino Técnico",
  },
  {
    id: "gabinete_dg",
    sigla: "Gabinete do Diretor-Geral",
    direcao: "Gabinete do Diretor-Geral",
    departamentoDefault: "Gabinete do Diretor-Geral",
    percent: 0.15,
    percentLabel: "15%",
    cor: "from-blue-700 to-indigo-900",
    badgeBg: "bg-blue-100 text-blue-800 border-blue-300",
    descricao: "Gabinete do Diretor-Geral & Assessoria",
  },
  {
    id: "dicosafa",
    sigla: "DICOSAFA",
    direcao: "Direção de Coordenação de Serviços de Administração, Finanças e de Apoio (DICOSAFA)",
    departamentoDefault: "Diretor da DICOSAFA",
    percent: 0.20,
    percentLabel: "20%",
    cor: "from-emerald-700 to-teal-900",
    badgeBg: "bg-emerald-100 text-emerald-800 border-emerald-300",
    descricao: "Serviços de Administração, Finanças e Apoio (DICOSAFA)",
  },
  {
    id: "dicosser",
    sigla: "DICOSSER",
    direcao: "Direção de Coordenação de Serviços Académicos, Sociais, Extensão e Relações Públicas (DICOSSER)",
    departamentoDefault: "Diretor da DICOSSER",
    percent: 0.20,
    percentLabel: "20%",
    cor: "from-purple-700 to-indigo-900",
    badgeBg: "bg-purple-100 text-purple-800 border-purple-300",
    descricao: "Serviços Académicos, Sociais e Extensão (DICOSSER)",
  },
  {
    id: "cie",
    sigla: "CIE",
    direcao: "Centro de Incubação de Empresas",
    departamentoDefault: "Diretor do CIE",
    percent: 0.10,
    percentLabel: "10%",
    cor: "from-slate-800 to-slate-950",
    badgeBg: "bg-slate-200 text-slate-800 border-slate-300",
    descricao: "Centro de Incubação de Empresas (CIE)",
  },
];

const HIERARQUIA_ORGANICA = [
  {
    direcao: "Todas as Direções",
    quota: "",
    departamentos: [
      {
        nome: "Todos os Departamentos",
        reparticoes: ["Todas as Repartições / Setores"],
      },
    ],
  },
  {
    direcao: "Gabinete do Diretor-Geral",
    quota: "15%",
    departamentos: (DEPARTAMENTOS["Gabinete do Diretor-Geral"] || []).map((dep) => ({
      nome: dep,
      reparticoes: ["Todas as Repartições / Setores", ...(REPARTICOES[dep] || [])],
    })),
  },
  {
    direcao: "Divisão de Engenharia",
    quota: "35%",
    departamentos: (DEPARTAMENTOS["Divisão de Engenharia"] || []).map((dep) => ({
      nome: dep,
      reparticoes: ["Todas as Repartições / Setores", ...(REPARTICOES[dep] || [])],
    })),
  },
  {
    direcao: "Direção de Coordenação de Serviços de Administração, Finanças e de Apoio (DICOSAFA)",
    quota: "20%",
    departamentos: (
      DEPARTAMENTOS[
        "Direção de Coordenação de Serviços de Administração, Finanças e de Apoio (DICOSAFA)"
      ] || []
    ).map((dep) => ({
      nome: dep,
      reparticoes: ["Todas as Repartições / Setores", ...(REPARTICOES[dep] || [])],
    })),
  },
  {
    direcao: "Direção de Coordenação de Serviços Académicos, Sociais, Extensão e Relações Públicas (DICOSSER)",
    quota: "20%",
    departamentos: (
      DEPARTAMENTOS[
        "Direção de Coordenação de Serviços Académicos, Sociais, Extensão e Relações Públicas (DICOSSER)"
      ] || []
    ).map((dep) => ({
      nome: dep,
      reparticoes: ["Todas as Repartições / Setores", ...(REPARTICOES[dep] || [])],
    })),
  },
  {
    direcao: "Centro de Incubação de Empresas",
    quota: "10%",
    departamentos: (DEPARTAMENTOS["Centro de Incubação de Empresas"] || []).map((dep) => ({
      nome: dep,
      reparticoes: ["Todas as Repartições / Setores", ...(REPARTICOES[dep] || [])],
    })),
  },
];

export default function EstoqueCompletoView({
  user,
  onOpenNovaEntrada,
  onOpenSaidaConsumo,
}: EstoqueCompletoViewProps) {
  // Main view mode: "setor_hierarquia" | "estoque_geral"
  const [activeTab, setActiveTab] = useState<"setor_hierarquia" | "estoque_geral">("setor_hierarquia");
  
  // Subtab for Setor Hierarquia: "direcoes_necessidades" | "tabela_consolidada"
  const [hierarquiaSubtab, setHierarquiaSubtab] = useState<"direcoes_necessidades" | "tabela_consolidada">("direcoes_necessidades");

  // Subtab for Estoque Geral: "entradas" | "saidas"
  const [geralSubtab, setGeralSubtab] = useState<"entradas" | "saidas">("saidas");

  // State for sector hierarchy filters
  const userDirecao = user?.direcao || user?.unidadeOrganica || "Divisão de Engenharia";
  const userDepto = user?.departamento || "Diretor da Divisão de Engenharia";
  const userReparticao = user?.reparticao || user?.setor || "Todas as Repartições / Setores";

  const [selectedDirecao, setSelectedDirecao] = useState<string>(
    userDirecao === "Direção de Engenharia e Tecnologias" || userDirecao === "Direção de Serviços Centrais" || userDirecao === ""
      ? "Divisão de Engenharia"
      : userDirecao
  );
  const [selectedDepto, setSelectedDepto] = useState<string>(
    userDepto === "Economato e Almoxarifado Central" || userDepto === "Divisão de Engenharia" || userDepto === ""
      ? "Diretor da Divisão de Engenharia"
      : userDepto
  );
  const [selectedReparticao, setSelectedReparticao] = useState<string>(userReparticao);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"todos" | "disponivel" | "esgotado">("todos");

  // Filters for Saídas / Consumo Interno
  const [filterSaidaSetor, setFilterSaidaSetor] = useState("Todos os Departamentos");
  const [filterSaidaRequisitante, setFilterSaidaRequisitante] = useState("");
  const [filterSaidaMes, setFilterSaidaMes] = useState("Todos os Meses");
  const [filterSaidaAno, setFilterSaidaAno] = useState("2026");

  // Data from Firestore
  const [bens, setBens] = useState<any[]>([]);
  const [movements, setMovements] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [requisicoes, setRequisicoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRedistributing, setIsRedistributing] = useState(false);

  useEffect(() => {
    setLoading(true);
    const unsubBens = firestoreService.materiais_bens.subscribe((data) => {
      setBens(data || []);
      setLoading(false);
    });

    const unsubMov = firestoreService.movimentos_economato.subscribe((data) => {
      setMovements(data || []);
    });

    const unsubAct = firestoreService.matrixActivities.subscribe((data) => {
      setActivities(data || []);
    });

    const unsubReq = firestoreService.requisicoes_internas.subscribe((data) => {
      setRequisicoes(data || []);
    });

    return () => {
      unsubBens();
      unsubMov();
      unsubAct();
      unsubReq();
    };
  }, []);

  // Recalcular e redistribuir todo o estoque existente no Firestore pelas 5 regras
  const handleRedistribuirEstoqueExistente = async () => {
    if (
      !window.confirm(
        "Deseja recalcular e redistribuir o estoque das entradas do Economato pelas 5 quotas institucionais?\n\n- 35% Divisão de Engenharia\n- 15% Gabinete do Diretor Geral\n- 20% DICOSAFA\n- 20% CIE\n- 10% DICOSSER"
      )
    ) {
      return;
    }

    try {
      setIsRedistributing(true);
      const entradasCentral = movements.filter(
        (m) => m.tipo === "Entrada" || m.tipo === "ENTRADA_FORNECEDOR" || m.origem === "Fornecedor"
      );

      let totalProcessados = 0;

      for (const ent of entradasCentral) {
        const qEntrada = Number(ent.quantidade || ent.quantidadeEntrada || 0);
        const descItem = ent.descricao || ent.descricaoMaterial || "Material de Consumo";
        if (qEntrada <= 0 || !descItem) continue;

        let acumulado = 0;
        const planoRedist = REGRAS_REDISTRIBUICAO_ESTOQUE.map((regra, idx) => {
          let qAlocada = 0;
          if (idx === REGRAS_REDISTRIBUICAO_ESTOQUE.length - 1) {
            qAlocada = Math.max(0, qEntrada - acumulado);
          } else {
            qAlocada = Math.floor(qEntrada * regra.percent);
            acumulado += qAlocada;
          }
          return { ...regra, qAlocada };
        });

        for (const aloc of planoRedist) {
          if (aloc.qAlocada <= 0) continue;

          const existingDeptItem = bens.find(
            (b) =>
              (b.nome || "").toLowerCase() === descItem.toLowerCase() &&
              (b.setor || b.departamento || "").toLowerCase() === aloc.departamentoDefault.toLowerCase()
          );

          if (existingDeptItem) {
            await firestoreService.materiais_bens.update(existingDeptItem.id, {
              quantidadeDisponivel: aloc.qAlocada,
              quantidadePlanificada: aloc.qAlocada,
              percentualQuota: aloc.percentLabel,
              distribuicaoAutomatica: true,
              updatedBy: user?.email,
            });
          } else {
            await firestoreService.materiais_bens.add({
              nome: descItem,
              quantidadeDisponivel: aloc.qAlocada,
              quantidadePlanificada: aloc.qAlocada,
              localizacaoAtual: `Armazém do Setor - ${aloc.sigla}`,
              grupo: ent.grupo || "Consumíveis",
              estado: "Novo",
              setor: aloc.departamentoDefault,
              departamento: aloc.departamentoDefault,
              direcao: aloc.direcao,
              updatedBy: user?.email,
              distribuicaoAutomatica: true,
              percentualQuota: aloc.percentLabel,
            });
          }
        }
        totalProcessados++;
      }

      alert(
        `Redistribuição Automática Concluída!\n\n${totalProcessados} lotes de entrada redistribuídos entre:\n- 35% Divisão de Engenharia\n- 15% Gabinete DG\n- 20% DICOSAFA\n- 20% CIE\n- 10% DICOSSER`
      );
    } catch (err) {
      console.error("Erro ao redistribuir estoque:", err);
      alert("Falha ao efetuar redistribuição automática do estoque.");
    } finally {
      setIsRedistributing(false);
    }
  };

  // Lista de Direções registadas no sistema
  const direcoesRegistadas = useMemo(() => {
    const list = HIERARQUIA_ORGANICA.filter((h) => h.direcao !== "Todas as Direções");
    return list;
  }, []);

  // Helper para obter TODOS os Departamentos pertencentes a uma Direção (organograma 100% real)
  const getDepartamentosPorDirecao = (direcaoNome: string): string[] => {
    if (!direcaoNome || direcaoNome === "Todas as Direções") return [];
    
    // Obter departamentos oficiais via getDepartamentosByDirecaoKey
    const officialDeps = getDepartamentosByDirecaoKey(direcaoNome);
    if (officialDeps && officialDeps.length > 0) return officialDeps;

    // Direct lookup in DEPARTAMENTOS
    if (DEPARTAMENTOS[direcaoNome]) return DEPARTAMENTOS[direcaoNome];

    // Fallback: buscar na HIERARQUIA_ORGANICA
    const dirObj = HIERARQUIA_ORGANICA.find(
      (h) =>
        h.direcao === direcaoNome ||
        h.direcao.toLowerCase().includes(direcaoNome.toLowerCase()) ||
        direcaoNome.toLowerCase().includes(h.direcao.toLowerCase())
    );
    if (dirObj) {
      return dirObj.departamentos
        .map((d) => d.nome)
        .filter((n) => n && n !== "Todos os Departamentos");
    }

    return [];
  };

  // Update Available Deptos based on Selected Direção
  const deptosDisponiveis = useMemo(() => {
    if (!selectedDirecao || selectedDirecao === "Todas as Direções") {
      return ["Todos os Departamentos"];
    }
    const deps = getDepartamentosPorDirecao(selectedDirecao);
    if (deps.length === 0) return ["Todos os Departamentos"];
    return deps;
  }, [selectedDirecao]);

  // Handle Direcao change
  const handleDirecaoChange = (val: string) => {
    setSelectedDirecao(val);
    const deps = getDepartamentosPorDirecao(val);
    if (deps.length > 0) {
      setSelectedDepto(deps[0]);
    } else {
      setSelectedDepto("Todos os Departamentos");
    }
    // Rolar suavemente até à lista de departamentos da Direção
    setTimeout(() => {
      const elem = document.getElementById("secao-departamentos-direcao");
      if (elem) {
        elem.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 120);
  };

  // Movimentos de Entrada (Vindo do Fornecedor / Compras)
  const entradasFornecedor = useMemo(() => {
    return movements
      .filter((m) => m.tipo === "Entrada" || m.tipo === "ENTRADA_FORNECEDOR" || m.origem === "Fornecedor")
      .map((m) => ({
        ...m,
        dateInfo: formatDetailedDate(m.timestamp || m.createdAt),
      }));
  }, [movements]);

  // Movimentos de Saída (Consumo Interno / Requisições) organizados por Departamento, Requisitante, Dia da Semana, Data, Horas/Minutos, Mês e Ano
  const saidasConsumoInterno = useMemo(() => {
    const list: any[] = [];

    movements
      .filter((m) => m.tipo === "Saida" || m.tipo === "SAIDA_CONSUMO" || m.tipo === "Saída")
      .forEach((m) => {
        const dateInfo = formatDetailedDate(m.timestamp || m.createdAt);
        list.push({
          id: m.id || Math.random().toString(),
          departamento: m.setorDestino || m.departamento || m.unidadeOrganica || "Serviços Centrais",
          reparticao: m.reparticao || "Secção de Consumo",
          requisitante: m.requisitante || m.operador || m.solicitante || "Utilizador Interno",
          produto: m.descricao || m.nome || "Material Consumível",
          quantidade: Number(m.quantidade || 1),
          finalidade: m.finalidade || m.observacao || "Consumo Interno do Setor",
          dateInfo,
        });
      });

    requisicoes
      .filter((r) => r.status === "Aprovada" || r.status === "Concluída" || r.status === "Entregue")
      .forEach((r) => {
        const dateInfo = formatDetailedDate(r.dataRequisicao || r.createdAt);
        const prodName = r.descricaoMaterial || (r.itens && r.itens[0]?.descricao) || "Material de Consumo";
        const qtd = Number(r.quantidade || (r.itens && r.itens[0]?.qtd) || 1);

        list.push({
          id: r.id || Math.random().toString(),
          departamento: r.departamentoRequisitante || r.unidadeOrganica || "Departamento Requisitante",
          reparticao: r.reparticao || "Secção de Consumo",
          requisitante: r.nomeRequisitante || r.nomeSolicitante || r.requisitante || "Requisitante do Setor",
          produto: prodName,
          quantidade: qtd,
          finalidade: r.finalidade || r.justificativa || "Actividades do Setor",
          dateInfo,
        });
      });

    return list;
  }, [movements, requisicoes]);

  // Necessidades Planificadas do Departamento Selecionado com seus produtos e quantidades
  const necessidadesDoDepartamento = useMemo(() => {
    if (!selectedDepto || selectedDepto === "Todos os Departamentos") return [];

    const deptoLower = selectedDepto.toLowerCase();

    // Helper para cota padrão do departamento
    const defaultQuota = selectedDepto.includes("Engenharia")
      ? "35%"
      : selectedDepto.includes("Gabinete")
      ? "15%"
      : selectedDepto.includes("DICOSAFA")
      ? "20%"
      : selectedDepto.includes("DICOSSER")
      ? "20%"
      : selectedDepto.includes("Incubação") || selectedDepto.includes("CIE")
      ? "10%"
      : "20%";

    const numQuotaDefault = (parseFloat(defaultQuota) || 20) / 100;

    // Map to group by Rubrica Name ("BENS 121" or "SERVIÇOS 122")
    const rubricaGroups = new Map<string, any>();

    // Helper to get or create a Rubrica group
    const getOrCreateGroup = (rubricaName: string) => {
      const stdName = (rubricaName || "").toUpperCase();
      let key = "";
      let codigo = "";
      let titulo = "";

      if (stdName.includes("121") || stdName.includes("BENS") || stdName.includes("12.1")) {
        key = "BENS_121";
        codigo = "121";
        titulo = "BENS 121 - Bens de Consumo Corrente";
      } else if (stdName.includes("122") || stdName.includes("SERVI") || stdName.includes("12.2")) {
        key = "SERVICOS_122";
        codigo = "122";
        titulo = "SERVIÇOS 122 - Serviços de Consumo Corrente";
      } else {
        // Ignorar outras rubricas não independentes no Economato
        return null;
      }

      if (!rubricaGroups.has(key)) {
        rubricaGroups.set(key, {
          id: `rubrica-${codigo}`,
          codigo: codigo,
          titulo: titulo,
          rubrica: titulo,
          departamento: selectedDepto,
          direcao: selectedDirecao,
          produtos: [],
        });
      }

      return rubricaGroups.get(key);
    };

    // 1. Processar Actividades da Matriz
    activities.forEach((act) => {
      const actDepto = (act.unidade || act.departamento || act.setor || "").toLowerCase();
      const actDirecao = (act.direcao || "").toLowerCase();

      const matchesDepto =
        actDepto.includes(deptoLower) ||
        deptoLower.includes(actDepto) ||
        (selectedDirecao && actDirecao.includes(selectedDirecao.toLowerCase()));

      if (matchesDepto) {
        const actTitle = act.actividade || act.descricao || "Plano de Suprimentos do Setor";

        // Extrair rubricas internas da actividade
        const subRubricas = act.rubricas && act.rubricas.length > 0
          ? act.rubricas
          : [{
              rubrica: act.rubrica || "Bens - 121",
              necessidade: act.necessidade || act.objeto || "Material Consumível Planificado",
              quantidade: Number(act.quantidade || act.qtd || 10),
              unidade: "UN"
            }];

        subRubricas.forEach((sub: any) => {
          const subRubName = sub.rubrica || "Bens - 121";
          const group = getOrCreateGroup(subRubName);
          if (!group) return; // Ignora se não for Bens 121 ou Serviços 122

          const prodNome = sub.necessidade || "Material Consumível";
          const qtdPlan = Number(sub.quantidade || 10);

          // Verificar estoque alocado para este produto
          const itemEstoque = bens.find(
            (b) =>
              (b.nome || "").toLowerCase() === prodNome.toLowerCase() &&
              (b.setor || b.departamento || "").toLowerCase().includes(deptoLower)
          );

          const qtdAlocada = Number(itemEstoque?.quantidadeDisponivel || 0);
          const quotaPercent = itemEstoque?.percentualQuota || defaultQuota;
          const numQuota = (parseFloat(quotaPercent) || 20) / 100;

          // Total de saídas do consumo interno registradas para este produto e setor
          const totalSaidas = saidasConsumoInterno
            .filter(
              (s) =>
                (s.produto || "").toLowerCase() === prodNome.toLowerCase() &&
                (s.departamento || "").toLowerCase().includes(deptoLower)
            )
            .reduce((acc, s) => acc + Number(s.quantidade || 0), 0);

          const qtdExistEstoque = qtdAlocada > 0 ? qtdAlocada : Math.round(qtdPlan * numQuota) || Math.round(qtdPlan * 0.35);
          const saldo = Math.max(0, qtdExistEstoque - totalSaidas);

          // Acumular produtos na mesma rubrica com a mesma necessidade de origem
          const jaExiste = group.produtos.find(
            (p: any) =>
              (p.nome || "").toLowerCase() === prodNome.toLowerCase() &&
              (p.necessidade || "").toLowerCase() === actTitle.toLowerCase()
          );

          if (jaExiste) {
            jaExiste.quantidadePlanificada += qtdPlan;
            jaExiste.qtdExistEstoque += qtdExistEstoque;
            jaExiste.saida = totalSaidas;
            jaExiste.saldoDisponivel = Math.max(0, jaExiste.qtdExistEstoque - totalSaidas);
          } else {
            group.produtos.push({
              id: act.id + "-" + Math.random().toString(36).substr(2, 5),
              rubrica: subRubName,
              necessidade: actTitle,
              nome: prodNome,
              quantidadePlanificada: qtdPlan,
              quotaPercentual: quotaPercent,
              qtdExistEstoque: qtdExistEstoque,
              saida: totalSaidas,
              saldoDisponivel: saldo,
              unidade: sub.unidade || "UN",
            });
          }
        });
      }
    });

    // Se não houver itens cadastrados na Matriz, gerar o Plano Sintetizado de Suprimentos
    if (rubricaGroups.size === 0) {
      const bensDoDepto = bens.filter((b) =>
        (b.setor || b.departamento || "").toLowerCase().includes(deptoLower)
      );

      const syntheticBensGroup = getOrCreateGroup("Bens - 121");
      const syntheticServicosGroup = getOrCreateGroup("Serviços - 122");

      if (bensDoDepto.length > 0) {
        bensDoDepto.forEach((b) => {
          const bCat = (b.categoria || b.grupo || "Bens").toLowerCase();
          const isServ = bCat.includes("servi") || bCat.includes("122") || bCat.includes("12.2");
          const group = isServ ? syntheticServicosGroup : syntheticBensGroup;
          if (!group) return;

          const totalSaidas = saidasConsumoInterno
            .filter(
              (s) =>
                (s.produto || "").toLowerCase() === (b.nome || "").toLowerCase() &&
                (s.departamento || "").toLowerCase().includes(deptoLower)
            )
            .reduce((acc, s) => acc + Number(s.quantidade || 0), 0);

          const qPlan = Number(b.quantidadePlanificada || b.quantidadeInicial || 50);
          const qPercentStr = b.percentualQuota || defaultQuota;
          const qNumQuota = (parseFloat(qPercentStr) || 20) / 100;
          const qExistEstoque = Number(
            b.quantidadeAlocada || Math.round(qPlan * qNumQuota) || 18
          );
          const qSaldo = Math.max(0, qExistEstoque - totalSaidas);

          group.produtos.push({
            id: b.id,
            rubrica: isServ ? "Serviços - 122" : "Bens - 121",
            necessidade: "MATERIAIS DE CONSUMO PARA ESCRITORIOS",
            nome: b.nome || "Material de Consumo",
            quantidadePlanificada: qPlan,
            quotaPercentual: qPercentStr,
            qtdExistEstoque: qExistEstoque,
            saida: totalSaidas,
            saldoDisponivel: qSaldo,
            unidade: b.unidadeMedida || "UN",
          });
        });
      } else {
        // Preencher itens fictícios inteligentes se o estoque estiver vazio
        if (syntheticBensGroup) {
          syntheticBensGroup.produtos.push(
            {
              id: "p1",
              rubrica: "Bens - 121",
              necessidade: "MATERIAIS DE CONSUMO PARA ESCRITORIOS",
              nome: "RESMA A4",
              quantidadePlanificada: 5,
              quotaPercentual: defaultQuota,
              qtdExistEstoque: 5,
              saida: 0,
              saldoDisponivel: 5,
              unidade: "UN",
            },
            {
              id: "p2",
              rubrica: "Bens - 121",
              necessidade: "MATERIAIS DE CONSUMO PARA ESCRITORIOS",
              nome: "Toner HP Laser Black",
              quantidadePlanificada: 10,
              quotaPercentual: defaultQuota,
              qtdExistEstoque: Math.round(10 * numQuotaDefault) || 3,
              saida: 1,
              saldoDisponivel: Math.max(0, (Math.round(10 * numQuotaDefault) || 3) - 1),
              unidade: "UN",
            },
            {
              id: "p3",
              rubrica: "Bens - 121",
              necessidade: "MATERIAIS DE CONSUMO PARA ESCRITORIOS",
              nome: "Caixas de Canetas Esferográficas",
              quantidadePlanificada: 20,
              quotaPercentual: defaultQuota,
              qtdExistEstoque: Math.round(20 * numQuotaDefault) || 5,
              saida: 2,
              saldoDisponivel: Math.max(0, (Math.round(20 * numQuotaDefault) || 5) - 2),
              unidade: "UN",
            }
          );
        }

        if (syntheticServicosGroup) {
          syntheticServicosGroup.produtos.push({
            id: "ps1",
            rubrica: "Serviços - 122",
            necessidade: "PRESTAÇÃO DE SERVIÇOS DE SUPORTE",
            nome: "Serviço de Impressão e Encadernação Externa",
            quantidadePlanificada: 5,
            quotaPercentual: defaultQuota,
            qtdExistEstoque: Math.round(5 * numQuotaDefault) || 1,
            saida: 0,
            saldoDisponivel: Math.round(5 * numQuotaDefault) || 1,
            unidade: "UN",
          });
        }
      }
    }

    return Array.from(rubricaGroups.values()).filter(g => g.produtos.length > 0);
  }, [selectedDepto, selectedDirecao, activities, bens, saidasConsumoInterno]);

  // Consolidação do Estoque Tabela Completa por Setor
  const estoqueConsolidadoSetor = useMemo(() => {
    const itemsMap = new Map<string, any>();

    bens.forEach((b) => {
      const bSetor = (b.setor || b.unidadeOrganica || b.departamento || "Economato").trim();
      const bDirecao = (b.direcao || "Direção de Serviços Centrais").trim();
      const bReparticao = (b.reparticao || "Secção de Estoque").trim();
      const bNome = (b.nome || b.descricao || "Material de Consumo").trim();
      const key = `${bSetor.toLowerCase()}:::${bNome.toLowerCase()}`;

      const qtdPlanificada = Number(b.quantidadePlanificada || b.quantidadeInicial || b.quantidadeDisponivel || 0);
      const qtdRequisitada = Number(b.quantidadeRequisitada || 0);
      const saldo = Number(b.quantidadeDisponivel !== undefined ? b.quantidadeDisponivel : Math.max(0, qtdPlanificada - qtdRequisitada));

      itemsMap.set(key, {
        id: b.id || key,
        direcao: bDirecao,
        departamento: bSetor,
        reparticao: bReparticao,
        nome: bNome,
        categoria: b.categoria || "Consumíveis",
        quantidadePlanificada: Math.max(qtdPlanificada, saldo + qtdRequisitada),
        quantidadeRequisitada: qtdRequisitada,
        saldoDisponivel: saldo,
        unidadeMedida: b.unidadeMedida || "UN",
        localizacao: b.localizacaoAtual || "Almoxarifado Central",
        quotaPercentual: b.percentualQuota || "Quota",
      });
    });

    return Array.from(itemsMap.values());
  }, [bens]);

  // Filtro das Saídas
  const saidasFiltradas = useMemo(() => {
    return saidasConsumoInterno.filter((s) => {
      const matchSetor =
        filterSaidaSetor === "Todos os Departamentos" ||
        s.departamento.toLowerCase().includes(filterSaidaSetor.toLowerCase());

      const matchReq =
        !filterSaidaRequisitante.trim() ||
        s.requisitante.toLowerCase().includes(filterSaidaRequisitante.toLowerCase()) ||
        s.produto.toLowerCase().includes(filterSaidaRequisitante.toLowerCase());

      const matchMes =
        filterSaidaMes === "Todos os Meses" ||
        s.dateInfo.mes.toLowerCase() === filterSaidaMes.toLowerCase();

      const matchAno =
        filterSaidaAno === "Todos os Anos" || s.dateInfo.ano === filterSaidaAno;

      return matchSetor && matchReq && matchMes && matchAno;
    });
  }, [saidasConsumoInterno, filterSaidaSetor, filterSaidaRequisitante, filterSaidaMes, filterSaidaAno]);

  return (
    <div className="space-y-6 pb-12">
      {/* Banner de Boas-Vindas e Atalhos */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 p-6 rounded-3xl text-white shadow-xl border border-blue-900/40 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-black  tracking-widest border border-blue-400/20 mb-2">
              <Boxes size={14} /> Economato & Gestão de Suprimentos por Setor
            </span>
            <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              Direções, Departamentos e Necessidades Planificadas
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-3xl">
              Navegue pelas Direções registradas, consulte todos os Departamentos pertencentes a cada Direção, verifique as Necessidades Planificadas com seus produtos e quantidades, e acompanhe a <strong>redistribuição automática de 35% Engenharia, 15% Gabinete DG, 20% DICOSAFA, 20% CIE e 10% DICOSSER</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleRedistribuirEstoqueExistente}
              disabled={isRedistributing}
              className="bg-amber-600 hover:bg-amber-500 text-white px-4 py-2.5 rounded-2xl text-xs font-black transition-all shadow-md flex items-center gap-2 border border-amber-400/30"
              title="Recalcular e redistribuir todas as entradas do Economato pelas 5 quotas institucionais"
            >
              <Sparkles size={16} className={isRedistributing ? "animate-spin" : ""} />
              {isRedistributing ? "Redistribuindo..." : "⚡ Recalcular Redistribuição Automática"}
            </button>
            <button
              onClick={onOpenNovaEntrada}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-2xl text-xs font-black transition-all shadow-md flex items-center gap-2 border border-emerald-400/30"
            >
              <PlusCircle size={16} /> Nova Entrada (Fornecedor)
            </button>
            <button
              onClick={onOpenSaidaConsumo}
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-2xl text-xs font-black transition-all shadow-md flex items-center gap-2 border border-blue-400/30"
            >
              <ArrowUpRight size={16} /> Ficha de Saída (Consumo)
            </button>
          </div>
        </div>
      </div>

      {/* ABAS PRINCIPAIS: ESTOQUE POR SETOR vs ESTOQUE GERAL */}
      <div className="flex bg-slate-200/80 p-1.5 rounded-2xl border border-slate-300/80 shadow-inner">
        <button
          onClick={() => setActiveTab("setor_hierarquia")}
          className={`flex-1 py-3 px-4 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2.5 ${
            activeTab === "setor_hierarquia"
              ? "bg-slate-900 text-white shadow-lg scale-[1.01]"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-300/50"
          }`}
        >
          <Building2 size={16} className={activeTab === "setor_hierarquia" ? "text-blue-400" : ""} />
          Estoque por Setor, Direções & Necessidades Planificadas
        </button>

        <button
          onClick={() => setActiveTab("estoque_geral")}
          className={`flex-1 py-3 px-4 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2.5 ${
            activeTab === "estoque_geral"
              ? "bg-slate-900 text-white shadow-lg scale-[1.01]"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-300/50"
          }`}
        >
          <Package size={16} className={activeTab === "estoque_geral" ? "text-emerald-400" : ""} />
          Estoque Geral (Entradas vs Saídas)
        </button>
      </div>

      {/* REGUA DAS 5 REGRAS INSTITUCIONAIS DE REDISTRIBUIÇÃO AUTOMÁTICA */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-black text-slate-800  tracking-wider flex items-center gap-2">
            <PieChart size={16} className="text-blue-600" /> Quotas Institucionais de Redistribuição Automática por Entrada
          </h4>
          <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
            Total das Quotas: 100% da Entrada
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {REGRAS_REDISTRIBUICAO_ESTOQUE.map((r) => (
            <div
              key={r.id}
              className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-400 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-black text-slate-900">{r.sigla}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${r.badgeBg}`}>
                    {r.percentLabel}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 font-medium leading-tight">
                  {r.descricao}
                </p>
              </div>
              <div className="mt-3 text-[10px] font-bold text-slate-400 flex items-center justify-between pt-2 border-t border-slate-200/60">
                <span>Alocação Automática</span>
                <span className="text-blue-600 font-black">{r.percentLabel} do Lote</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CONTEÚDO DA ABA 1: ESTOQUE POR SETOR / HIERARQUIA / NECESSIDADES */}
      {activeTab === "setor_hierarquia" && (
        <div className="space-y-6">
          {/* Subtítulo de Navegação */}
          <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-xs gap-2">
            <button
              onClick={() => setHierarquiaSubtab("direcoes_necessidades")}
              className={`flex-1 py-2.5 px-4 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 ${
                hierarquiaSubtab === "direcoes_necessidades"
                  ? "bg-blue-900 text-white shadow-md"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Building size={16} /> 1. Direções ➔ 2. Departamentos ➔ 3. Necessidades Planificadas
            </button>
            <button
              onClick={() => setHierarquiaSubtab("tabela_consolidada")}
              className={`flex-1 py-2.5 px-4 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 ${
                hierarquiaSubtab === "tabela_consolidada"
                  ? "bg-blue-900 text-white shadow-md"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <ListChecks size={16} /> Visão em Tabela Consolidada por Setor
            </button>
          </div>

          {/* MODO 1: DRILL-DOWN VISUAL (DIREÇÕES ➔ DEPARTAMENTOS ➔ NECESSIDADES) */}
          {hierarquiaSubtab === "direcoes_necessidades" && (
            <div className="space-y-6">
              {/* PASSO 1: SELEÇÃO DA DIREÇÃO */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                  <div>
                    <h3 className="text-sm font-black text-slate-900  tracking-wider flex items-center gap-2">
                      <Building size={18} className="text-blue-600" /> Direções Registradas no Sistema
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Clique em qualquer Direção para visualizar imediatamente a lista de todos os seus Departamentos pertencentes.
                    </p>
                  </div>
                  <span className="text-[11px] font-black text-blue-800 bg-blue-50 px-3 py-1 rounded-xl border border-blue-200 shrink-0">
                    {direcoesRegistadas.length} Direções no Sistema
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {direcoesRegistadas.map((dirObj) => {
                    const isSelected = selectedDirecao === dirObj.direcao;
                    const deptos = getDepartamentosPorDirecao(dirObj.direcao);
                    const quotaTag = dirObj.quota || "Quota ERP";

                    return (
                      <div
                        key={dirObj.direcao}
                        onClick={() => handleDirecaoChange(dirObj.direcao)}
                        className={`p-5 rounded-3xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                          isSelected
                            ? "bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 text-white border-blue-600 shadow-lg scale-[1.02] ring-2 ring-blue-400"
                            : "bg-slate-50 hover:bg-white text-slate-800 border-slate-200 hover:border-blue-400 shadow-xs"
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span
                              className={`text-[10px] font-black  px-2.5 py-1 rounded-full border ${
                                isSelected
                                  ? "bg-blue-500/20 text-blue-200 border-blue-400/30"
                                  : "bg-blue-100 text-blue-800 border-blue-200"
                              }`}
                            >
                              Quota: {quotaTag}
                            </span>
                            <Building2 size={18} className={isSelected ? "text-blue-300" : "text-slate-400"} />
                          </div>

                          <h4 className="font-black text-sm leading-snug mb-1">{dirObj.direcao}</h4>

                          <div className={`text-xs font-bold mb-3 ${isSelected ? "text-blue-200" : "text-slate-600"}`}>
                            {deptos.length} {deptos.length === 1 ? "Departamento Pertencente" : "Departamentos Pertencentes"}
                          </div>

                          {/* Chips dos Departamentos Pertencentes */}
                          <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pr-1">
                            {deptos.map((d) => (
                              <span
                                key={d}
                                className={`text-[9px] font-bold px-2 py-0.5 rounded-md border ${
                                  isSelected
                                    ? "bg-blue-800/80 text-blue-100 border-blue-600/60"
                                    : "bg-white text-slate-700 border-slate-200"
                                }`}
                              >
                                • {d}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-current/10 flex items-center justify-between text-[11px] font-black">
                          <span>{isSelected ? "✓ Direção Selecionada (Ver Departamentos)" : "Exibir Departamentos ➔"}</span>
                          <ChevronRight size={14} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* PASSO 2: DEPARTAMENTOS PERTENCENTES À DIREÇÃO SELECIONADA */}
              <div id="secao-departamentos-direcao" className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div>
                    <span className="text-[10px] font-mono font-black text-blue-600  tracking-widest block">
                      Direção Selecionada: {selectedDirecao}
                    </span>
                    <h3 className="text-base font-black text-slate-900  tracking-wider flex items-center gap-2">
                      <Building2 size={20} className="text-blue-600" /> Departamentos Pertencentes à Direção ({deptosDisponiveis.length})
                    </h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Abaixo consta a lista de todos os departamentos pertencentes à direção <strong>{selectedDirecao}</strong>. Clique em um departamento para consultar e gerir o seu estoque e necessidades planificadas.
                    </p>
                  </div>

                  <span className="text-xs text-blue-800 font-black bg-blue-50 px-3.5 py-1.5 rounded-xl border border-blue-200 shrink-0">
                    {deptosDisponiveis.length} {deptosDisponiveis.length === 1 ? "Departamento Listado" : "Departamentos Listados"}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {deptosDisponiveis.map((depNome) => {
                    const isSelected = selectedDepto === depNome;
                    const deptoLower = depNome.toLowerCase();
                    const numPlanificados = bens.filter((b) =>
                      (b.setor || b.departamento || "").toLowerCase().includes(deptoLower)
                    ).length;

                    return (
                      <button
                        key={depNome}
                        onClick={() => {
                          setSelectedDepto(depNome);
                          setTimeout(() => {
                            const elem = document.getElementById("secao-necessidades-departamento");
                            if (elem) {
                              elem.scrollIntoView({ behavior: "smooth", block: "start" });
                            }
                          }, 100);
                        }}
                        className={`p-4 rounded-2xl border text-left transition-all flex items-center justify-between gap-3 ${
                          isSelected
                            ? "bg-gradient-to-r from-blue-900 to-indigo-900 text-white border-blue-700 shadow-md font-black ring-2 ring-blue-400"
                            : "bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200 font-bold hover:border-blue-300"
                        }`}
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className={`p-2 rounded-xl shrink-0 ${isSelected ? "bg-blue-600 text-white" : "bg-blue-100 text-blue-700"}`}>
                            <Building2 size={18} />
                          </div>
                          <div className="truncate">
                            <span className="text-xs font-black block truncate">{depNome}</span>
                            <span className={`text-[10px] font-normal block ${isSelected ? "text-blue-200" : "text-slate-500"}`}>
                              {numPlanificados > 0 ? `${numPlanificados} itens registados` : "Departamento Pertencente"}
                            </span>
                          </div>
                        </div>
                        <ChevronRight size={16} className={`shrink-0 ${isSelected ? "text-amber-400" : "text-slate-400"}`} />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* PASSO 3: NECESSIDADES PLANIFICADAS E PRODUTOS DO DEPARTAMENTO SELECIONADO */}
              <div id="secao-necessidades-departamento" className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <span className="text-[10px] font-mono font-black text-blue-600  tracking-widest block">
                      {selectedDirecao} ➔ {selectedDepto}
                    </span>
                    <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                      <ListChecks size={20} className="text-emerald-600" /> Necessidades Planificadas & Produtos
                    </h3>
                    <p className="text-xs text-slate-500">
                      Produtos planificados, quantidades requeridas e estoque alocado via redistribuição automática do Economato
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-xs font-black border border-emerald-300">
                      {necessidadesDoDepartamento.length} Necessidades Registradas
                    </span>
                  </div>
                </div>

                {/* Lista de Necessidades Planificadas */}
                <div className="space-y-6">
                  {necessidadesDoDepartamento.map((nec) => (
                    <div
                      key={nec.id}
                      className="bg-slate-50/80 rounded-3xl border border-slate-200 overflow-hidden shadow-xs"
                    >
                      {/* Cabeçalho da Necessidade */}
                      <div className="bg-[#0B132B] text-white p-4 px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-t-3xl border-b border-blue-900/50">
                        <div>
                          <span className="text-[10px] font-mono text-blue-300 font-bold block">
                            {nec.codigo} | {nec.rubrica}
                          </span>
                          <h4 className="font-serif font-bold text-base text-white tracking-wide">{nec.titulo}</h4>
                        </div>
                        <div className="text-xs text-blue-200 font-bold bg-[#12224A] px-4 py-1.5 rounded-full border border-blue-800/60 shadow-xs">
                          {nec.produtos.length} {nec.produtos.length === 1 ? "Produto" : "Produtos"} na Necessidade
                        </div>
                      </div>

                      {/* Tabela de Produtos da Necessidade (Plano de Suprimentos do Setor) */}
                      <div className="overflow-x-auto p-2">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-[#0B132B] text-white text-[10px] font-serif font-bold  tracking-wider border-b border-slate-800">
                              <th className="p-3.5 pl-5 text-left whitespace-nowrap">RUBRICA</th>
                              <th className="p-3.5 text-left whitespace-nowrap">NECESSIDADE</th>
                              <th className="p-3.5 text-left whitespace-nowrap">NOME DO PRODUTO</th>
                              <th className="p-3.5 text-center whitespace-nowrap">QUOTA DE REDISTRIBUIÇÃO</th>
                              <th className="p-3.5 text-center whitespace-nowrap">QTD PLANIFI</th>
                              <th className="p-3.5 text-center whitespace-nowrap">QTD/PROD EXIST/ESTOQUE</th>
                              <th className="p-3.5 text-center whitespace-nowrap">SAÍDA</th>
                              <th className="p-3.5 text-center whitespace-nowrap">SALDO</th>
                              <th className="p-3.5 text-right pr-5 whitespace-nowrap">AÇÃO</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-800 bg-white">
                            {nec.produtos.map((prod: any) => {
                              const temEstoque = prod.saldoDisponivel > 0;
                              return (
                                <tr key={prod.id} className="hover:bg-blue-50/20 transition-colors border-b border-slate-100">
                                  {/* 1. RUBRICA */}
                                  <td className="p-3.5 pl-5 font-mono text-xs text-slate-600 font-extrabold whitespace-nowrap">
                                    {prod.rubrica || nec.rubrica || "Cap. 12.1"}
                                  </td>

                                  {/* 2. NECESSIDADE */}
                                  <td className="p-3.5 font-bold text-slate-800 text-xs">
                                    {prod.necessidade || nec.titulo || "Plano de Suprimentos do Setor"}
                                  </td>

                                  {/* 3. NOME DO PRODUTO */}
                                  <td className="p-3.5 font-black text-slate-900 text-sm">
                                    {prod.nome}
                                  </td>

                                  {/* 4. QUOTA DE REDISTRIBUIÇÃO */}
                                  <td className="p-3.5 text-center whitespace-nowrap">
                                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-blue-100 text-blue-800 border border-blue-300">
                                      {prod.quotaPercentual}
                                    </span>
                                  </td>

                                  {/* 5. QTD PLANIFI */}
                                  <td className="p-3.5 text-center font-extrabold text-slate-700 whitespace-nowrap">
                                    {prod.quantidadePlanificada} {prod.unidade}
                                  </td>

                                  {/* 6. QTD/PROD EXIST/ESTOQUE */}
                                  <td className="p-3.5 text-center font-extrabold text-indigo-900 whitespace-nowrap">
                                    {prod.qtdExistEstoque !== undefined ? prod.qtdExistEstoque : prod.quantidadePlanificada} {prod.unidade}
                                  </td>

                                  {/* 7. SAÍDA */}
                                  <td className="p-3.5 text-center font-extrabold text-amber-700 whitespace-nowrap">
                                    {prod.saida !== undefined ? prod.saida : 0} {prod.unidade}
                                  </td>

                                  {/* 8. SALDO */}
                                  <td className="p-3.5 text-center whitespace-nowrap">
                                    <span
                                      className={`inline-block px-3 py-1 rounded-xl font-black text-xs ${
                                        temEstoque
                                          ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                          : "bg-red-100 text-red-700 border border-red-300"
                                      }`}
                                    >
                                      {prod.saldoDisponivel} {prod.unidade}
                                    </span>
                                  </td>

                                  {/* 9. AÇÃO */}
                                  <td className="p-3.5 text-right pr-5 whitespace-nowrap">
                                    <button
                                      onClick={onOpenSaidaConsumo}
                                      disabled={!temEstoque}
                                      className={`px-3.5 py-1.5 rounded-xl font-black text-xs transition-all inline-flex items-center gap-1 ${
                                        temEstoque
                                          ? "bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
                                          : "bg-slate-200 text-slate-400 cursor-not-allowed opacity-60"
                                      }`}
                                    >
                                      <ArrowUpRight size={13} /> Requisitar
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* MODO 2: VISÃO EM TABELA CONSOLIDADA POR SETOR */}
          {hierarquiaSubtab === "tabela_consolidada" && (
            <div className="space-y-6">
              {/* Cartão de Destaque do Setor Logado */}
              <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-5 rounded-3xl text-white shadow-lg border border-blue-800/40">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-600/30 p-3 rounded-2xl border border-blue-400/20 text-blue-300">
                      <User size={22} />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono font-black text-blue-300  tracking-widest block">
                        Utilizador Conectado
                      </span>
                      <div className="text-sm font-black text-white">
                        {user?.name || "Funcionário / Operador"}
                      </div>
                      <div className="text-xs text-blue-200 mt-0.5 font-bold flex flex-wrap items-center gap-2">
                        <span className="bg-blue-800/60 px-2 py-0.5 rounded-lg border border-blue-600/30">
                          🏛️ Direção: {userDirecao}
                        </span>
                        <span className="bg-blue-800/60 px-2 py-0.5 rounded-lg border border-blue-600/30">
                          🏢 Depto: {userDepto}
                        </span>
                        <span className="bg-blue-800/60 px-2 py-0.5 rounded-lg border border-blue-600/30">
                          📂 Repartição: {userReparticao}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedDirecao(userDirecao);
                      setSelectedDepto(userDepto);
                      setSelectedReparticao(userReparticao);
                    }}
                    className="bg-white/10 hover:bg-white/20 text-blue-200 hover:text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all border border-white/10 self-start sm:self-center"
                  >
                    🎯 Focar Meu Setor Logado
                  </button>
                </div>
              </div>

              {/* Tabela de Produtos do Setor Selecionado */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-blue-300  tracking-widest block">
                      Estoque Consolidado por Setor
                    </span>
                    <h3 className="text-base font-black text-white flex items-center gap-2">
                      <Building2 size={18} className="text-blue-400" /> Todos os Departamentos
                    </h3>
                  </div>
                  <span className="bg-blue-600/30 text-blue-200 px-3 py-1 rounded-full text-xs font-bold border border-blue-400/20">
                    {estoqueConsolidadoSetor.length} Registros Alocados
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-900 text-white text-[10px] font-black  tracking-wider">
                        <th className="p-4 pl-6">DIREÇÃO / DEPARTAMENTO</th>
                        <th className="p-4">NOME DO PRODUTO</th>
                        <th className="p-4 text-center">QTD PLANIFI</th>
                        <th className="p-4 text-center">QUOTA DE REDISTRIBUIÇÃO</th>
                        <th className="p-4 text-center">SAÍDA</th>
                        <th className="p-4 text-center">SALDO</th>
                        <th className="p-4 text-right pr-6">AÇÃO</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                      {estoqueConsolidadoSetor.map((item) => {
                        const temEstoque = item.saldoDisponivel > 0;
                        return (
                          <tr key={item.id} className="hover:bg-blue-50/30 transition-colors">
                            <td className="p-4 pl-6">
                              <div className="font-extrabold text-slate-900">{item.departamento}</div>
                              <div className="text-[10px] text-slate-400">{item.direcao}</div>
                            </td>

                            <td className="p-4">
                              <div className="font-extrabold text-slate-900 text-sm">{item.nome}</div>
                              <div className="text-[10px] text-slate-400 font-bold">{item.categoria}</div>
                            </td>

                            {/* 3. QTD PLANIFI */}
                            <td className="p-4 text-center font-bold text-slate-700">
                              {item.quantidadePlanificada} {item.unidadeMedida}
                            </td>

                            {/* 4. QUOTA DE REDISTRIBUIÇÃO */}
                            <td className="p-4 text-center">
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-blue-100 text-blue-800 border border-blue-300">
                                {item.quotaPercentual}
                              </span>
                            </td>

                            {/* 5. SAÍDA */}
                            <td className="p-4 text-center font-bold text-amber-700">
                              {item.quantidadeRequisitada || 0} {item.unidadeMedida}
                            </td>

                            <td className="p-4 text-center">
                              <span
                                className={`inline-block px-3 py-1 rounded-xl font-black text-sm ${
                                  temEstoque
                                    ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                    : "bg-red-100 text-red-700 border border-red-300"
                                }`}
                              >
                                {item.saldoDisponivel} {item.unidadeMedida}
                              </span>
                            </td>

                            <td className="p-4 text-right pr-6">
                              <button
                                onClick={onOpenSaidaConsumo}
                                disabled={!temEstoque}
                                className={`px-3 py-1.5 rounded-xl font-black text-xs transition-all inline-flex items-center gap-1 ${
                                  temEstoque
                                    ? "bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
                                    : "bg-slate-200 text-slate-400 cursor-not-allowed opacity-60"
                                }`}
                              >
                                <ArrowUpRight size={13} /> Requisitar
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* CONTEÚDO DA ABA 2: ESTOQUE GERAL (ENTRADAS vs SAÍDAS) */}
      {activeTab === "estoque_geral" && (
        <div className="space-y-6">
          {/* Sub-abas de Geral: ENTRADA (Vindo do Fornecedor) vs SAÍDA (Consumo Interno) */}
          <div className="flex bg-white p-2 rounded-2xl border border-slate-200 shadow-sm gap-2">
            <button
              onClick={() => setGeralSubtab("saidas")}
              className={`flex-1 py-2.5 px-4 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 ${
                geralSubtab === "saidas"
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <ArrowUpRight size={16} /> Saída (Consumo Interno por Departamento & Requisitante)
            </button>

            <button
              onClick={() => setGeralSubtab("entradas")}
              className={`flex-1 py-2.5 px-4 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 ${
                geralSubtab === "entradas"
                  ? "bg-emerald-600 text-white shadow-md"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <ArrowDownRight size={16} /> Entrada (Vindo de Fornecedores / Compras)
            </button>
          </div>

          {/* SUB-ABA: SAÍDA (CONSUMO INTERNO) COM DETALHAMENTO DE DATA/HORA/REQUISITANTE */}
          {geralSubtab === "saidas" && (
            <div className="space-y-6">
              {/* Filtros de Saídas */}
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
                <h4 className="text-xs font-black text-slate-800  tracking-wider flex items-center gap-2">
                  <Filter size={15} className="text-blue-600" /> Filtros de Saídas de Consumo Interno
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  {/* Filtro Setor */}
                  <div>
                    <label className="block text-[10px] font-black text-slate-500  tracking-wider mb-1">
                      Departamento / Setor:
                    </label>
                    <select
                      value={filterSaidaSetor}
                      onChange={(e) => setFilterSaidaSetor(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                    >
                      <option value="Todos os Departamentos">Todos os Departamentos</option>
                      {deptosDisponiveis.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Filtro Requisitante / Produto */}
                  <div>
                    <label className="block text-[10px] font-black text-slate-500  tracking-wider mb-1">
                      Requisitante ou Material:
                    </label>
                    <input
                      type="text"
                      value={filterSaidaRequisitante}
                      onChange={(e) => setFilterSaidaRequisitante(e.target.value)}
                      placeholder="Nome do requisitante..."
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                    />
                  </div>

                  {/* Filtro Mês */}
                  <div>
                    <label className="block text-[10px] font-black text-slate-500  tracking-wider mb-1">
                      Mês:
                    </label>
                    <select
                      value={filterSaidaMes}
                      onChange={(e) => setFilterSaidaMes(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                    >
                      <option value="Todos os Meses">Todos os Meses</option>
                      {[
                        "Janeiro",
                        "Fevereiro",
                        "Março",
                        "Abril",
                        "Maio",
                        "Junho",
                        "Julho",
                        "Agosto",
                        "Setembro",
                        "Outubro",
                        "Novembro",
                        "Dezembro",
                      ].map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Filtro Ano */}
                  <div>
                    <label className="block text-[10px] font-black text-slate-500  tracking-wider mb-1">
                      Ano:
                    </label>
                    <select
                      value={filterSaidaAno}
                      onChange={(e) => setFilterSaidaAno(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                    >
                      <option value="Todos os Anos">Todos os Anos</option>
                      <option value="2026">2026</option>
                      <option value="2025">2025</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Tabela das Saídas Detalhadas */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
                  <h3 className="font-black text-sm text-white flex items-center gap-2">
                    <ArrowUpRight size={18} className="text-red-400" /> Histórico de Saídas de Consumo Interno
                  </h3>
                  <span className="bg-red-500/20 text-red-300 px-3 py-0.5 rounded-full text-xs font-bold border border-red-500/30">
                    {saidasFiltradas.length} Saídas Registadas
                  </span>
                </div>

                <div className="overflow-x-auto">
                  {saidasFiltradas.length > 0 ? (
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-600  tracking-wider">
                          <th className="p-4 pl-6">Dia da Semana & Data</th>
                          <th className="p-4">Hora & Minutos</th>
                          <th className="p-4">Mês / Ano</th>
                          <th className="p-4">Departamento / Setor</th>
                          <th className="p-4">Requisitante</th>
                          <th className="p-4">Material Requisitado</th>
                          <th className="p-4 text-center">Quantidade</th>
                          <th className="p-4">Finalidade</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                        {saidasFiltradas.map((saida) => (
                          <tr key={saida.id} className="hover:bg-slate-50 transition-colors">
                            <td className="p-4 pl-6 font-bold text-slate-900">
                              <span className="inline-block px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 text-[11px] font-extrabold border border-slate-200">
                                📅 {saida.dateInfo.diaSemana}, {saida.dateInfo.data}
                              </span>
                            </td>

                            <td className="p-4 font-mono font-bold text-blue-900">
                              <span className="inline-flex items-center gap-1 bg-blue-50 px-2 py-0.5 rounded text-blue-700 font-black">
                                <Clock size={12} /> {saida.dateInfo.horaMinuto}
                              </span>
                            </td>

                            <td className="p-4 font-bold text-slate-600">
                              {saida.dateInfo.mes} / {saida.dateInfo.ano}
                            </td>

                            <td className="p-4 font-extrabold text-slate-900">
                              {saida.departamento}
                            </td>

                            <td className="p-4 font-bold text-slate-800">
                              <span className="inline-flex items-center gap-1 text-slate-700">
                                <User size={13} className="text-blue-600" /> {saida.requisitante}
                              </span>
                            </td>

                            <td className="p-4 font-black text-slate-900">
                              {saida.produto}
                            </td>

                            <td className="p-4 text-center">
                              <span className="px-2.5 py-1 rounded-xl bg-red-100 text-red-700 font-black text-xs border border-red-200">
                                -{saida.quantidade} UN
                              </span>
                            </td>

                            <td className="p-4 text-slate-500 italic text-[11px]">
                              {saida.finalidade}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="py-12 text-center text-slate-400">
                      <Package size={36} className="mx-auto text-slate-300 mb-2" />
                      <p className="text-xs font-bold text-slate-600">Nenhum registo de saída encontrado para os filtros selecionados.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* SUB-ABA: ENTRADA (VINDO DO FORNECEDOR / COMPRAS) */}
          {geralSubtab === "entradas" && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                    <ArrowDownRight size={20} className="text-emerald-600" /> Histórico de Entradas de Fornecedores
                  </h3>
                  <p className="text-xs text-slate-500">
                    Lotes de mercadorias entregues por fornecedores externos e integradas ao Almoxarifado Central
                  </p>
                </div>

                <button
                  onClick={onOpenNovaEntrada}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-black transition-all shadow-sm flex items-center gap-2"
                >
                  <PlusCircle size={15} /> Lançar Nova Entrada
                </button>
              </div>

              <div className="overflow-x-auto">
                {entradasFornecedor.length > 0 ? (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-600  tracking-wider">
                        <th className="p-4 pl-6">Produto / Especificação</th>
                        <th className="p-4">Fornecedor / Origem</th>
                        <th className="p-4 text-center">Quantidade Recebida</th>
                        <th className="p-4">Data e Hora de Entrada</th>
                        <th className="p-4">Registado por</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                      {entradasFornecedor.map((ent, idx) => (
                        <tr key={ent.id || idx} className="hover:bg-emerald-50/20 transition-colors">
                          <td className="p-4 pl-6 font-extrabold text-slate-900">
                            {ent.descricao || ent.nome || "Material Adquirido"}
                          </td>

                          <td className="p-4 font-bold text-emerald-800">
                            🏢 {ent.fornecedor || ent.origem || "Fornecedor Autorizado"}
                          </td>

                          <td className="p-4 text-center">
                            <span className="px-3 py-1 rounded-xl bg-emerald-100 text-emerald-800 font-black text-xs border border-emerald-300">
                              +{ent.quantidade} UN
                            </span>
                          </td>

                          <td className="p-4 font-mono font-bold text-slate-600">
                            {ent.dateInfo.fullFormatted}
                          </td>

                          <td className="p-4 text-slate-700 font-bold">
                            {ent.operador || "Gestor de Estoque"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="py-12 text-center text-slate-400">
                    <Boxes size={36} className="mx-auto text-slate-300 mb-2" />
                    <p className="text-xs font-bold text-slate-600">Nenhuma entrada de fornecedor registada recentemente.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
