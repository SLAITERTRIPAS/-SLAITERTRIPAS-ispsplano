import React, { useState, useMemo, useEffect } from "react";
import {
  Building,
  Users,
  ArrowLeft,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  Circle,
  UserX,
  PenBox,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Colaborador } from "../../types";
import { safeJSONStringify } from "../../lib/utils";
import MainHeader from "../bloco1_apresentacao/MainHeader";
import RegistarFuncionarioForm from "../bloco8_gerais/RegistarFuncionarioForm";
import { isSuperBossUser, getRoles } from "../../lib/auth";

interface AfetacaoViewProps {
  onClose: () => void;
  colaboradores: Colaborador[];
  user?: any;
  onLogout?: () => void;
  onUpdateColaborador?: (c: Colaborador) => Promise<void>;
  initialViewState?: {
    level: "root" | "direction" | "department" | "sector";
    directionName?: string;
  };
  canUpdate?: boolean;
}

const direcoes = [
  {
    nome: "Gabinete do Diretor-Geral",
    sigla: "GDG",
    deps: [
      {
        nome: "Gabinete do Diretor-Geral",
        sectors: ["Gabinete do DG", "Apoio Direto"],
      },
      {
        nome: "Chefe do GDG",
        sectors: ["Coordenação de Gabinete", "Expediente do Chefe"],
      },
      {
        nome: "Secretaria Executiva",
        sectors: ["Arquivo e Documentação", "Protocolo e Relações Públicas"],
      },
      {
        nome: "Departamento de Planificação Estudos e Projetos",
        sectors: [
          "Chefe do Departamento de Planificação Estudos e Projetos",
          "Repartição de Planificação",
          "Repartição de Estatística",
          "Setor de Relatório",
          "Setor de Monitoria",
        ],
      },
      {
        nome: "Unidade Gestora e Executora de Aquisições",
        sectors: [
          "Repartição de Aquisições",
          "Repartição de Gestão de Contratos",
        ],
      },
      {
        nome: "Departamento de Cooperação e Relações Exteriores",
        sectors: ["Cooperação Institucional", "Relações Externas"],
      },
      {
        nome: "Departamento de Controlo Técnico e de Qualidade",
        sectors: ["Auditoria Técnica", "Padrões de Qualidade"],
      },
      {
        nome: "Departamento Jurídico",
        sectors: ["Consultoria e Pareceres", "Contencioso"],
      },
    ],
  },
  {
    nome: "Divisão de Engenharia",
    sigla: "DE",
    deps: [
      {
        nome: "Diretor da Divisão de Engenharia",
        sectors: ["Direção de Engenharia", "Apoio Administrativo"],
      },
      {
        nome: "Diretor Adjunto Pedagógico",
        sectors: ["Gestão Pedagógica", "Registo de Notas"],
      },
      {
        nome: "Departamento de Pesquisa e Extensão",
        sectors: ["Investigação", "Projetos Comunitários"],
      },
      {
        nome: "Departamento de Engenharia Eletrotécnica",
        sectors: [
          "Diretor do Curso de Engenharia Elétrica",
          "Diretor do Curso de Engenharia Eletrónica e de Telecomunicações",
          "Diretor do Curso de Engenharia de Energias Renováveis",
        ],
      },
      {
        nome: "Departamento de Engenharia de Construção Civil",
        sectors: [
          "Diretor do Curso de Engenharia de Construção Civil",
          "Diretor do Curso de Engenharia Hidráulica",
        ],
      },
      {
        nome: "Departamento de Engenharia de Construção Mecânica",
        sectors: [
          "Diretor do Curso de Engenharia de Construção Mecânica",
          "Diretor do Curso de Engenharia Termotécnica",
        ],
      },
      {
        nome: "Departamento de Disciplinas Gerais",
        sectors: ["Matemática e Física", "Línguas e Comunicação"],
      },
      {
        nome: "Departamento Técnico e de Apoio",
        sectors: ["Manutenção de Infraestrutura", "Logística Técnica"],
      },
    ],
  },
  {
    nome: "Centro de Incubação de Empresas",
    sigla: "CIE",
    deps: [
      { nome: "Diretor do CIE", sectors: [] },
      {
        nome: "Departamento de práticas de geração de negócio e desenvolvimento empresarial (DPGNDE)",
        sectors: [],
      },
      {
        nome: "Departamento de consultoria, estudos, projetos e angariação de fundos (DCPAF)",
        sectors: [],
      },
      {
        nome: "Departamento de prospecção de oportunidade de negócio (DPONE)",
        sectors: [],
      },
    ],
  },
  {
    nome: "DICOSSER",
    sigla: "DICOSSER",
    deps: [
      {
        nome: "Diretor da DICOSSER",
        sectors: ["Gabinete de Direção", "Apoio Administrativo"],
      },
      {
        nome: "Departamento de Registo Académico",
        sectors: ["Certificados", "Matrículas", "Exames"],
      },
      {
        nome: "Departamento de Assuntos Estudantis",
        sectors: ["Apoio ao Aluno", "Bolsas", "Cultura e Desporto"],
      },
      {
        nome: "Departamento de Biblioteca",
        sectors: ["Arquivo Digital", "Leitura", "Catalogação"],
      },
    ],
  },
  {
    nome: "DICOSAFA",
    sigla: "DICOSAFA",
    deps: [
      {
        nome: "Diretor da DICOSAFA",
        sectors: ["Gabinete de Direção", "Apoio Administrativo"],
      },
      {
        nome: "Departamento de Recursos Humanos",
        sectors: ["Processamento de Salários", "Formação", "Recrutamento"],
      },
      {
        nome: "Departamento de Finanças",
        sectors: ["Contabilidade", "Tesouraria", "Controle Interno"],
      },
      {
        nome: "Departamento de Património",
        sectors: [
          "Chefe de DP",
          "Repartição de E-Património",
          "Repartição de Infraestrutura e Manutenção",
          "Repartição de Transporte",
        ],
      },
      {
        nome: "Secretaria Geral",
        sectors: ["Protocolo", "Expediente Geral", "Arquivo"],
      },
      {
        nome: "Departamento TIC",
        sectors: ["Infraestrutura", "Sistemas", "Redes"],
      },
      {
        nome: "Departamento Lar de Estudantes",
        sectors: ["Alojamento", "Gestão de Moradia"],
      },
      {
        nome: "Departamento de Produção Alimentar",
        sectors: ["Cozinha e Refeitório", "Suprimentos Alimentares"],
      },
    ],
  },
];

export default function AfetacaoView({
  onClose,
  colaboradores,
  user,
  onLogout,
  onUpdateColaborador,
  initialViewState,
  canUpdate = true,
}: AfetacaoViewProps) {
  const [viewState, setViewState] = useState<{
    level: "root" | "direction" | "department" | "sector";
    direction?: (typeof direcoes)[0];
    department?: (typeof direcoes)[0]["deps"][0];
    sector?: string;
  }>(() => {
    if (initialViewState?.directionName === "Não Afetados") {
      return {
        level: "direction",
        direction: {
          nome: "Não Afetados",
          sigla: "N/A",
          deps: [{ nome: "Sem Departamento", sectors: ["Sem Sector"] }],
        },
      };
    }
    return { level: "root" };
  });

  const [editingColaborador, setEditingColaborador] =
    useState<Colaborador | null>(null);

  const visibleDirecoes = useMemo(() => {
    if (!user) return direcoes;

    const uRoles = getRoles(user.title || user.cargo || user.cargoChefia || "");
    const isBossGlobally =
      user.cargoChefia &&
      user.cargoChefia !== "Nenhum" &&
      user.estadoMandato !== "Cessado";
    const isHRBossGlobally =
      isBossGlobally &&
      ((user.reparticao || "").toLowerCase().includes("pessoal") ||
        (user.reparticao || "").toLowerCase().includes("recursos humanos") ||
        (user.departamento || "").toLowerCase().includes("recursos humanos") ||
        (user.direcao || "").toLowerCase().includes("recursos humanos") ||
        (user.cargoChefia || "").toLowerCase().includes("rh") ||
        (user.title || "").toLowerCase().includes("rh") ||
        (user.title || "").toLowerCase().includes("repartição de pessoal") ||
        (user.reparticao || "")
          .toLowerCase()
          .includes("repartição de pessoal") ||
        (user.cargoChefia || "")
          .toLowerCase()
          .includes("chefe de repartição de pessoal"));
    const hasGeneralEfetivoAccess =
      isSuperBossUser(user) || uRoles.isDG || isHRBossGlobally;

    if (hasGeneralEfetivoAccess) {
      return direcoes;
    }

    const userDir = (user.direcao || "").trim().toLowerCase();

    return direcoes.filter((dir) => {
      const dirNome = dir.nome.toLowerCase();
      const dirSigla = dir.sigla.toLowerCase();
      return (
        dirNome.includes(userDir) ||
        userDir.includes(dirNome) ||
        dirSigla.includes(userDir) ||
        userDir.includes(dirSigla)
      );
    });
  }, [user]);

  const getVisibleDeps = (direction: (typeof direcoes)[0]) => {
    if (!user || !direction) return [];

    const uRoles = getRoles(user.title || user.cargo || user.cargoChefia || "");
    const isBossGlobally =
      user.cargoChefia &&
      user.cargoChefia !== "Nenhum" &&
      user.estadoMandato !== "Cessado";
    const isHRBossGlobally =
      isBossGlobally &&
      ((user.reparticao || "").toLowerCase().includes("pessoal") ||
        (user.reparticao || "").toLowerCase().includes("recursos humanos") ||
        (user.departamento || "").toLowerCase().includes("recursos humanos") ||
        (user.direcao || "").toLowerCase().includes("recursos humanos") ||
        (user.cargoChefia || "").toLowerCase().includes("rh") ||
        (user.title || "").toLowerCase().includes("rh") ||
        (user.title || "").toLowerCase().includes("repartição de pessoal") ||
        (user.reparticao || "")
          .toLowerCase()
          .includes("repartição de pessoal") ||
        (user.cargoChefia || "")
          .toLowerCase()
          .includes("chefe de repartição de pessoal"));
    const hasGeneralEfetivoAccess =
      isSuperBossUser(user) || uRoles.isDG || isHRBossGlobally;

    if (hasGeneralEfetivoAccess || uRoles.isDC) {
      return direction.deps;
    }

    const userDept = (user.departamento || "").trim().toLowerCase();

    return direction.deps.filter((dep) => {
      const depNome = dep.nome.toLowerCase();
      return depNome.includes(userDept) || userDept.includes(depNome);
    });
  };

  const getVisibleSectors = (department: (typeof direcoes)[0]["deps"][0]) => {
    if (!user || !department) return [];

    const uRoles = getRoles(user.title || user.cargo || user.cargoChefia || "");
    const isBossGlobally =
      user.cargoChefia &&
      user.cargoChefia !== "Nenhum" &&
      user.estadoMandato !== "Cessado";
    const isHRBossGlobally =
      isBossGlobally &&
      ((user.reparticao || "").toLowerCase().includes("pessoal") ||
        (user.reparticao || "").toLowerCase().includes("recursos humanos") ||
        (user.departamento || "").toLowerCase().includes("recursos humanos") ||
        (user.direcao || "").toLowerCase().includes("recursos humanos") ||
        (user.cargoChefia || "").toLowerCase().includes("rh") ||
        (user.title || "").toLowerCase().includes("rh") ||
        (user.title || "").toLowerCase().includes("repartição de pessoal") ||
        (user.reparticao || "")
          .toLowerCase()
          .includes("repartição de pessoal") ||
        (user.cargoChefia || "")
          .toLowerCase()
          .includes("chefe de repartição de pessoal"));
    const hasGeneralEfetivoAccess =
      isSuperBossUser(user) || uRoles.isDG || isHRBossGlobally;

    if (hasGeneralEfetivoAccess || uRoles.isDC || uRoles.isCD) {
      return department.sectors;
    }

    const userSector = (user.reparticao || user.setor || user.sector || "")
      .trim()
      .toLowerCase();

    return department.sectors.filter((sec) => {
      const secNome = sec.toLowerCase();
      return secNome.includes(userSector) || userSector.includes(secNome);
    });
  };

  const [checkedIds, setCheckedIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem("afetacaoChecklist");
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  const toggleCheck = (id: string) => {
    const newChecked = new Set(checkedIds);
    if (newChecked.has(id)) newChecked.delete(id);
    else newChecked.add(id);
    setCheckedIds(newChecked);
    localStorage.setItem(
      "afetacaoChecklist",
      safeJSONStringify(Array.from(newChecked)),
    );
  };

  const { stats, mappedColaboradores } = useMemo(() => {
    const result: Record<
      string,
      {
        total: number;
        deps: Record<
          string,
          { total: number; sectors: Record<string, number> }
        >;
      }
    > = {};

    direcoes.forEach((dir) => {
      result[dir.nome] = { total: 0, deps: {} };
      dir.deps.forEach((dep) => {
        result[dir.nome].deps[dep.nome] = { total: 0, sectors: {} };
        dep.sectors.forEach((sec) => {
          result[dir.nome].deps[dep.nome].sectors[sec] = 0;
        });
      });
    });

    result["Não Afetados"] = {
      total: 0,
      deps: { "Sem Departamento": { total: 0, sectors: { "Sem Sector": 0 } } },
    };

    const mapped: any[] = [];

    colaboradores.forEach((c) => {
      let assignedDir = "";
      let assignedDep = "";
      let assignedSec = "";

      // Prioridade 1: Campos explícitos
      if (c.direcao) {
        assignedDir = c.direcao;
      }
      if (c.departamento) {
        assignedDep = c.departamento;
      }
      if (c.sector) {
        assignedSec = c.sector;
      } else if (c.reparticao) {
        assignedSec = c.reparticao;
      }

      // Prioridade 2: Fallback matching logic using unidade if explicit fields aren't set
      if (!assignedDir && c.unidade) {
        const unidade = String(c.unidade).toLowerCase();
        for (const dir of direcoes) {
          const depMatch = dir.deps.find(
            (d) =>
              unidade.includes(String(d.nome).toLowerCase()) ||
              String(d.nome).toLowerCase().includes(unidade),
          );
          if (depMatch) {
            assignedDir = dir.nome;
            assignedDep = depMatch.nome;
            assignedSec = depMatch.sectors[0];
            break;
          } else if (
            unidade.includes(String(dir.nome).toLowerCase()) ||
            String(dir.nome).toLowerCase().includes(unidade)
          ) {
            assignedDir = dir.nome;
            assignedDep = dir.deps[0].nome;
            assignedSec = dir.deps[0].sectors[0] || "Geral";
            break;
          }
        }
      }

      // Normalização e validação final contra a estrutura
      if (!assignedDir || !result[assignedDir]) {
        // Tentativa de correspondência case-insensitive
        const normDir = Object.keys(result).find(
          (k) => k.toLowerCase() === (assignedDir || "").toLowerCase(),
        );
        if (normDir) {
          assignedDir = normDir;
        } else {
          assignedDir = "Não Afetados";
          assignedDep = "Sem Departamento";
          assignedSec = "Sem Sector";
        }
      }

      if (assignedDir !== "Não Afetados") {
        if (!assignedDep || !result[assignedDir].deps[assignedDep]) {
          const normDep = Object.keys(result[assignedDir].deps).find(
            (k) => k.toLowerCase() === (assignedDep || "").toLowerCase(),
          );
          if (normDep) {
            assignedDep = normDep;
          } else {
            assignedDep = Object.keys(result[assignedDir].deps)[0];
          }
        }
        if (
          !assignedSec ||
          !result[assignedDir]?.deps[assignedDep]?.sectors?.[assignedSec]
        ) {
          const depObj = result[assignedDir]?.deps[assignedDep];
          const sectors = depObj?.sectors;
          const normSec = sectors ? Object.keys(sectors).find((k) => k.toLowerCase() === (assignedSec || "").toLowerCase()) : null;
          
          if (normSec) {
            assignedSec = normSec;
          } else {
            assignedSec = sectors ? (Object.keys(sectors)[0] || "Geral") : "Geral";
          }
        }
      }

      // Incrementar estatísticas (Contar o colaborador uma vez para total de dir/dep)
      if (result[assignedDir] && result[assignedDir].deps?.[assignedDep]) {
        result[assignedDir].total += 1;
        result[assignedDir].deps[assignedDep].total += 1;
      }

      // Se for docente e tiver múltiplos cursos, vamos adicionar uma entrada para cada curso
      const cursosValidos = (c.cursos || []).filter((curso) => {
        if (!assignedDir || assignedDir === "Não Afetados" || !result[assignedDir]) return false;
        // Verificar se o curso pertence a este departamento com segurança
        const depObj = result[assignedDir].deps?.[assignedDep];
        return depObj?.sectors?.[curso] !== undefined;
      });

      if (cursosValidos.length > 0) {
        cursosValidos.forEach((curso) => {
          const depObj = result[assignedDir]?.deps?.[assignedDep];
          if (depObj?.sectors?.[curso] !== undefined) {
            depObj.sectors[curso] += 1;
          }
          mapped.push({
            ...c,
            _assignedDir: assignedDir,
            _assignedDep: assignedDep,
            _assignedSec: curso,
          });
        });
      } else {
        // Fallback para o comportamento original
        const depObj = result[assignedDir]?.deps?.[assignedDep];
        if (depObj) {
          if (depObj.sectors?.[assignedSec] !== undefined) {
            depObj.sectors[assignedSec] += 1;
          } else {
            if (!depObj.sectors) depObj.sectors = {};
            depObj.sectors[assignedSec] = 1;
          }
        }
        mapped.push({
          ...c,
          _assignedDir: assignedDir,
          _assignedDep: assignedDep,
          _assignedSec: assignedSec,
        });
      }
    });

    return { stats: result, mappedColaboradores: mapped };
  }, [colaboradores]);

  // Auto-navegação para a afetação do utilizador logado no início
  useEffect(() => {
    if (user && viewState.level === "root") {
      const myColab = mappedColaboradores.find(
        (c) =>
          (c.email &&
            user.email &&
            c.email.toLowerCase() === user.email.toLowerCase()) ||
          (c.nuit && user.nuit && c.nuit === user.nuit),
      );

      if (myColab && myColab._assignedDir !== "Não Afetados") {
        const dir = direcoes.find((d) => d.nome === myColab._assignedDir);
        const dep = dir?.deps.find((d) => d.nome === myColab._assignedDep);

        if (dir && dep) {
          setViewState({
            level: "sector",
            direction: dir,
            department: dep,
            sector: myColab._assignedSec,
          });
        }
      }
    }
  }, [user, mappedColaboradores]);

  const handleBack = () => {
    if (viewState.level === "sector") {
      setViewState({
        level: "department",
        direction: viewState.direction,
        department: viewState.department,
      });
    } else if (viewState.level === "department") {
      setViewState({ level: "direction", direction: viewState.direction });
    } else if (viewState.level === "direction") {
      setViewState({ level: "root" });
    } else {
      onClose();
    }
  };

  return (
    <div className="bg-white min-h-screen flex flex-col overflow-hidden">
      <div className="p-4 bg-white border-b border-gray-100 flex items-center gap-4">
        <button
          onClick={handleBack}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">
          Afetação de Pessoal
        </h1>
      </div>

      {/* Header with Breadcrumbs */}
      <div className="p-4 md:p-8 border-b border-gray-100 bg-gray-50/50">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 text-xs font-black text-blue-600 tracking-widest mb-1">
              <span
                className="cursor-pointer hover:underline"
                onClick={() => setViewState({ level: "root" })}
              >
                Início
              </span>
              {viewState.direction && (
                <>
                  <ChevronRight size={12} className="text-gray-300" />
                  <span
                    className={`cursor-pointer hover:underline ${viewState.level === "direction" ? "text-blue-900" : ""}`}
                    onClick={() =>
                      setViewState({
                        level: "direction",
                        direction: viewState.direction,
                      })
                    }
                  >
                    {viewState.direction.sigla}
                  </span>
                </>
              )}
              {viewState.department && (
                <>
                  <ChevronRight size={12} className="text-gray-300" />
                  <span
                    className={`cursor-pointer hover:underline ${viewState.level === "department" ? "text-blue-900" : ""}`}
                    onClick={() =>
                      setViewState({
                        level: "department",
                        direction: viewState.direction,
                        department: viewState.department,
                      })
                    }
                  >
                    {viewState.department.nome}
                  </span>
                </>
              )}
              {viewState.sector && (
                <>
                  <ChevronRight size={12} className="text-gray-300" />
                  <span className="text-blue-900">{viewState.sector}</span>
                </>
              )}
            </div>
            <h2 className="text-2xl font-black text-blue-950 tracking-tighter leading-none">
              {viewState.level === "root" && "Gestão de Efetivos"}
              {viewState.level === "direction" && viewState.direction?.nome}
              {viewState.level === "department" && viewState.department?.nome}
              {viewState.level === "sector" && viewState.sector}
            </h2>
          </div>

          <div className="px-6 py-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-200 text-center">
            <span className="text-[10px] font-bold tracking-widest block opacity-70">
              {viewState.level === "root"
                ? "Total Institucional"
                : viewState.level === "direction"
                  ? "Total da Direção"
                  : viewState.level === "department"
                    ? "Total do Departamento"
                    : "Total do Sector"}
            </span>
            <span className="text-xl font-black">
              {viewState.level === "root" &&
                `${colaboradores.length} COLABORADORES`}
              {viewState.level === "direction" &&
                viewState.direction &&
                `${stats[viewState.direction.nome].total} COLABORADORES`}
              {viewState.level === "department" &&
                viewState.direction &&
                viewState.department &&
                `${stats[viewState.direction.nome].deps[viewState.department.nome].total} COLABORADORES`}
              {viewState.level === "sector" &&
                viewState.direction &&
                viewState.department &&
                viewState.sector &&
                `${stats[viewState.direction.nome].deps[viewState.department.nome].sectors[viewState.sector] || 0} COLABORADORES`}
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 p-8 overflow-y-auto">
        <AnimatePresence mode="wait">
          {viewState.level === "root" && (
            <motion.div
              key="root"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
            >
              {visibleDirecoes.map((dir) => (
                <button
                  key={dir.sigla}
                  onClick={() =>
                    setViewState({ level: "direction", direction: dir })
                  }
                  className="flex flex-col p-6 bg-white border-2 border-gray-100 rounded-3xl text-center hover:border-blue-500 hover:shadow-xl transition-all duration-300 group"
                >
                  <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300 w-fit mx-auto">
                    <Building size={32} />
                  </div>
                  <h3 className="text-xl font-black text-blue-950 leading-snug grow items-center justify-center flex">
                    {dir.nome}
                  </h3>
                  <div className="mt-6 pt-6 border-t border-gray-50 flex items-center justify-between">
                    <span className="font-bold text-gray-400 tracking-widest">
                      {dir.sigla}
                    </span>
                    <span className="bg-blue-50 text-blue-600 px-4 py-2 rounded-xl text-sm font-black italic">
                      {stats[dir.nome].total} COLAB.
                    </span>
                  </div>
                </button>
              ))}

              {/* Botão para Não Afetados */}
              <button
                key="nao-afetados"
                onClick={() =>
                  setViewState({
                    level: "direction",
                    direction: {
                      nome: "Não Afetados",
                      sigla: "N/A",
                      deps: [
                        { nome: "Sem Departamento", sectors: ["Sem Sector"] },
                      ],
                    },
                  })
                }
                className="flex flex-col p-6 bg-red-50/50 border-2 border-dashed border-red-200 rounded-3xl text-center hover:border-red-500 hover:bg-white transition-all duration-300 group"
              >
                <div className="p-4 bg-red-100 text-red-600 rounded-2xl mb-4 group-hover:bg-red-600 group-hover:text-white transition-colors duration-300 w-fit mx-auto">
                  <UserX size={32} />
                </div>
                <h3 className="text-xl font-black text-red-950 leading-snug grow items-center justify-center flex">
                  Colaboradores Não Afetados
                </h3>
                <p className="text-xs text-red-700 font-bold mt-2">
                  Clique para ver quem ainda não foi alocado a um setor de
                  trabalho.
                </p>
                <div className="mt-6 pt-6 border-t border-red-100 flex items-center justify-between">
                  <span className="font-bold text-red-400 tracking-widest">
                    N/A
                  </span>
                  <span className="bg-red-100 text-red-600 px-4 py-2 rounded-xl text-sm font-black italic">
                    {stats["Não Afetados"].total} COLAB.
                  </span>
                </div>
              </button>
            </motion.div>
          )}

          {viewState.level === "direction" && viewState.direction && (
            <motion.div
              key="direction"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8"
            >
              {getVisibleDeps(viewState.direction).map((dep) => (
                <button
                  key={dep.nome}
                  onClick={() =>
                    setViewState({
                      ...viewState,
                      level: "department",
                      department: dep,
                    })
                  }
                  className="p-8 bg-blue-50/30 border-2 border-transparent hover:border-blue-500 hover:bg-white rounded-[2.5rem] text-center transition-all duration-300 shadow-sm"
                >
                  <div className="flex items-center justify-center mb-8">
                    <div className="p-3 bg-white text-blue-600 rounded-2xl shadow-sm border border-blue-50">
                      <Users size={24} />
                    </div>
                  </div>
                  <h4 className="text-2xl font-black text-gray-900 tracking-tight mb-2 leading-none">
                    {dep.nome}
                  </h4>
                  <p className="text-sm text-gray-500 font-bold tracking-wider">
                    {dep.sectors.length} Repartições / Sectores
                  </p>

                  <div className="mt-8 flex flex-wrap justify-center gap-2">
                    {dep.sectors.slice(0, 3).map((s) => (
                      <span
                        key={s + "-" + Math.random()}
                        className="bg-white px-3 py-1 rounded-lg text-[10px] font-black text-blue-400 border border-blue-100 italic"
                      >
                        {s}
                      </span>
                    ))}
                    {dep.sectors.length > 3 && (
                      <span className="text-[10px] font-black text-gray-400 mt-1">
                        +{dep.sectors.length - 3} mais
                      </span>
                    )}
                  </div>
                  <div className="mt-4">
                    <span className="bg-blue-600 text-white px-4 py-1.5 rounded-full text-xs font-black">
                      {stats[viewState.direction!.nome].deps[dep.nome].total}{" "}
                      EFETIVOS
                    </span>
                  </div>
                </button>
              ))}
            </motion.div>
          )}

          {viewState.level === "department" &&
            viewState.direction &&
            viewState.department && (
              <motion.div
                key="department"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="max-w-4xl mx-auto space-y-4"
              >
                <div className="bg-blue-900 rounded-[3rem] p-12 text-white shadow-2xl relative overflow-hidden mb-12">
                  <div className="relative z-10">
                    <h3 className="text-5xl font-black tracking-tighter leading-none mb-4">
                      {viewState.department.nome}
                    </h3>
                    <div className="flex items-center gap-4 opacity-80">
                      <span className="px-4 py-2 bg-white/10 rounded-full text-xs font-black tracking-widest border border-white/20">
                        {viewState.direction.sigla}
                      </span>
                      <span className="text-lg font-black italic">
                        {
                          stats[viewState.direction.nome].deps[
                            viewState.department.nome
                          ].total
                        }{" "}
                        Colaboradores Alocados
                      </span>
                    </div>
                  </div>
                  <Building className="absolute -right-12 -bottom-12 w-64 h-64 opacity-5 rotate-12" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {getVisibleSectors(viewState.department).map((sector) => (
                    <button
                      key={sector}
                      onClick={() =>
                        setViewState({ ...viewState, level: "sector", sector })
                      }
                      className="flex items-center justify-between p-6 bg-white border-2 border-gray-100 rounded-3xl hover:border-blue-500 hover:shadow-lg transition-all text-left"
                    >
                      <div>
                        <h5 className="font-black text-gray-800 text-sm tracking-tight mb-1">
                          {sector}
                        </h5>
                        <span className="text-[10px] font-black text-gray-400 tracking-widest flex items-center gap-2">
                          Checklist do Sector <ChevronRight size={10} />
                        </span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-2xl font-black text-blue-600 italic leading-none">
                          {stats[viewState.direction!.nome].deps[
                            viewState.department!.nome
                          ].sectors[sector] || 0}
                        </span>
                        <span className="text-[8px] font-black text-gray-400">
                          Colab.
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

          {viewState.level === "sector" &&
            viewState.direction &&
            viewState.department &&
            viewState.sector && (
              <motion.div
                key="sector"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-4xl mx-auto space-y-6"
              >
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-3xl font-black text-blue-950 tracking-tighter">
                      {viewState.sector}
                    </h3>
                    <p className="text-gray-500 font-bold text-xs tracking-widest mt-1">
                      Checklist de Efetivo / Quadro de Pessoal
                    </p>
                  </div>
                  <div className="bg-blue-50 px-6 py-3 rounded-2xl border border-blue-100 text-right">
                    <p className="text-[10px] font-black text-blue-400">
                      Verificados
                    </p>
                    <p className="text-2xl font-black text-blue-600">
                      {
                        mappedColaboradores.filter(
                          (c) =>
                            c._assignedDir === viewState.direction?.nome &&
                            c._assignedDep === viewState.department?.nome &&
                            c._assignedSec === viewState.sector &&
                            checkedIds.has(c.id),
                        ).length
                      }
                      <span className="text-gray-300 mx-2">/</span>
                      {stats[viewState.direction.nome].deps[
                        viewState.department.nome
                      ].sectors[viewState.sector] || 0}
                    </p>
                  </div>
                </div>

                <div className="bg-white border-2 border-gray-100 rounded-[2.5rem] overflow-auto max-h-[600px] shadow-sm">
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 z-10 bg-gray-50">
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 tracking-widest">
                          Estado
                        </th>
                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 tracking-widest">
                          Colaborador
                        </th>
                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 tracking-widest text-right">
                          Acção
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {mappedColaboradores.map((c) => {
                        const isMatch =
                          c._assignedDir === viewState.direction?.nome &&
                          c._assignedDep === viewState.department?.nome &&
                          c._assignedSec === viewState.sector;

                        if (!isMatch) return null;

                        const isChecked = checkedIds.has(c.id);

                        return (
                          <tr
                            key={c.id}
                            className="border-b border-gray-50 hover:bg-blue-50/30 transition-colors group"
                          >
                            <td className="px-8 py-5">
                              {isChecked ? (
                                <CheckCircle2
                                  size={24}
                                  className="text-green-500"
                                />
                              ) : (
                                <Circle
                                  size={24}
                                  className="text-gray-200 group-hover:text-blue-300 transition-colors"
                                />
                              )}
                            </td>
                            <td className="px-8 py-5">
                              <div>
                                <p className="font-black text-gray-900 text-sm tracking-tight">
                                  {c.nome}
                                </p>
                                <p className="text-[10px] text-gray-400 font-bold tracking-wider">
                                  {c._assignedDir === "Não Afetados"
                                    ? "Pendente De Afetação"
                                    : c.cargo || c.categoria || "Sem Cargo"}
                                </p>
                                {c._assignedDir !== "Não Afetados" && (
                                  <p className="text-[9px] text-blue-500 font-black mt-0.5">
                                    {c._assignedDir} • {c._assignedDep} •{" "}
                                    {c._assignedSec}
                                  </p>
                                )}
                              </div>
                            </td>
                            <td className="px-8 py-5 text-right flex items-center justify-end gap-2">
                              <button
                                onClick={() => setEditingColaborador(c)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Afetar / Editar Local de Trabalho"
                                disabled={!canUpdate}
                              >
                                <PenBox size={18} />
                              </button>
                              <button
                                onClick={() => {
                                  if (
                                    c._assignedDir === "Não Afetados" &&
                                    !isChecked
                                  ) {
                                    setEditingColaborador(c);
                                  } else {
                                    toggleCheck(c.id);
                                  }
                                }}
                                disabled={
                                  !canUpdate &&
                                  c._assignedDir === "Não Afetados"
                                }
                                className={`px-6 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all ${
                                  isChecked
                                    ? "bg-green-100 text-green-700 hover:bg-green-200"
                                    : c._assignedDir === "Não Afetados"
                                      ? "bg-amber-500 text-white hover:bg-amber-600 shadow-md shadow-amber-200"
                                      : "bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-200"
                                }`}
                              >
                                {isChecked
                                  ? "Verificado"
                                  : c._assignedDir === "Não Afetados"
                                    ? "Afetar Agora"
                                    : "Verificar"}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
        </AnimatePresence>

        <AnimatePresence>
          {editingColaborador && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4 overflow-y-auto">
              <div className="min-h-full w-full py-8">
                <RegistarFuncionarioForm
                  initialData={editingColaborador}
                  onCancel={() => setEditingColaborador(null)}
                  onSubmit={async (data) => {
                    if (onUpdateColaborador) {
                      await onUpdateColaborador(data);
                    }
                    setEditingColaborador(null);
                  }}
                />
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
