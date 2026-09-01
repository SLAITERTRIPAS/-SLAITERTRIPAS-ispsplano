import { EFETIVO_GERAL_DATA } from "../constants/colaboradoresList";
import {
  UNIDADES_ORGANICAS_SISTEMA,
  DEPARTAMENTOS,
  REPARTICOES,
  SECTORES,
  CATEGORIAS_DOCENTES,
} from "../constants/formOptions";
import { classifyTipo, hasChefiaPosition } from "./utils";

export function isDocenteColaborador(c: any): boolean {
  if (!c) return false;
  const tipo = (c.tipo || "").toString().toLowerCase().trim();
  const categoria = (c.categoria || "").toString().trim();
  const categoriaLower = categoria.toLowerCase();
  const carreira = (c.carreira || "").toString().toLowerCase().trim();
  const cargo = (c.cargo || "").toString().toLowerCase().trim();
  const funcao = (c.funcao || "").toString().toLowerCase().trim();

  if (
    tipo === "docente" ||
    tipo.includes("docente") ||
    tipo.includes("profess") ||
    carreira.includes("docente")
  ) {
    return true;
  }

  if (CATEGORIAS_DOCENTES.some((cat) => cat.toLowerCase() === categoriaLower)) {
    return true;
  }

  if (
    categoriaLower.includes("professor") ||
    categoriaLower.includes("docente") ||
    categoriaLower.includes("assistente universit") ||
    cargo.includes("docente") ||
    cargo.includes("professor") ||
    funcao.includes("docente") ||
    funcao.includes("professor")
  ) {
    return true;
  }

  return false;
}

export function loadAllDocentes(dbColabs: any[] = []): any[] {
  const map = new Map<string, any>();

  if (Array.isArray(EFETIVO_GERAL_DATA)) {
    EFETIVO_GERAL_DATA.forEach((colab) => {
      if (isDocenteColaborador(colab)) {
        const key = (colab.id || colab.nuit || colab.nome || "")
          .toString()
          .toLowerCase()
          .trim();
        if (key) map.set(key, colab);
      }
    });
  }

  if (Array.isArray(dbColabs)) {
    dbColabs.forEach((colab) => {
      if (isDocenteColaborador(colab)) {
        const key = (colab.id || colab.nuit || colab.nome || "")
          .toString()
          .toLowerCase()
          .trim();
        if (key) map.set(key, colab);
      }
    });
  }

  return Array.from(map.values()).sort((a, b) =>
    (a.nome || "").localeCompare(b.nome || "")
  );
}

export interface UserAllocatedDetails {
  cat: string;
  dir: string;
  dep: string;
  rep: string;
  setor: string;
  source?: string;
  responsavel?: string;
  responsavelEmail?: string;
}

const looseMatch = (s1: string, s2: string): boolean => {
  if (!s1 || !s2) return false;
  const n1 = s1
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
  const n2 = s2
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
  return n1 === n2 || n1.includes(n2) || n2.includes(n1);
};

const findGroupForDepartment = (deptName: string) => {
  let matchedDir = "";
  let matchedCat = "";
  if (!deptName) return { matchedDir, matchedCat };

  for (const [dir, deps] of Object.entries(DEPARTAMENTOS)) {
    if (
      deps.some(
        (d) =>
          d.toLowerCase() === deptName.toLowerCase() ||
          looseMatch(d, deptName)
      )
    ) {
      matchedDir = dir;
      break;
    }
  }

  if (matchedDir) {
    for (const cat of UNIDADES_ORGANICAS_SISTEMA) {
      if (
        cat.direcoes.some(
          (d) =>
            d.toLowerCase() === matchedDir.toLowerCase() ||
            looseMatch(d, matchedDir)
        )
      ) {
        matchedCat = cat.nome;
        break;
      }
    }
  }

  return { matchedDir, matchedCat };
};

const findGroupForReparticao = (repName: string) => {
  let matchedRep = "";
  let matchedDep = "";
  let matchedDir = "";
  let matchedCat = "";

  if (!repName) return { matchedRep, matchedDep, matchedDir, matchedCat };

  for (const [dep, reps] of Object.entries(REPARTICOES)) {
    const foundRep = reps.find(
      (r) =>
        r.toLowerCase() === repName.toLowerCase() || looseMatch(r, repName)
    );
    if (foundRep) {
      matchedRep = foundRep;
      matchedDep = dep;

      const group = findGroupForDepartment(dep);
      matchedDir = group.matchedDir;
      matchedCat = group.matchedCat;
      break;
    }
  }

  return { matchedRep, matchedDep, matchedDir, matchedCat };
};

export function getUserAllocatedDetails(
  user: any,
  colaboradoresList?: any[]
): UserAllocatedDetails {
  if (!user) {
    return {
      cat: "Unidade Orgânica",
      dir: "",
      dep: "",
      rep: "",
      setor: "",
      source: "Indefinido",
      responsavel: "",
      responsavelEmail: "",
    };
  }

  let matchedColab: any = null;
  const uEmail = (user.email || "").trim().toLowerCase();
  const uNuit = (user.nuit || "").trim();
  const uName = (user.name || user.nome || user.fullName || "").trim().toLowerCase();

  const dynamicColabs = colaboradoresList || [];

  // 1. Procurar na lista dinâmica de colaboradores (Firestore)
  if (dynamicColabs && dynamicColabs.length > 0) {
    matchedColab = dynamicColabs.find((c) => {
      const cEmail = (c.email || c.emailInstitucional || "")
        .trim()
        .toLowerCase();
      const cNuit = (c.nuit || "").trim();
      const cNome = (c.nome || c.name || "").trim().toLowerCase();

      return (
        (uEmail && cEmail && uEmail === cEmail) ||
        (uNuit && cNuit && uNuit === cNuit) ||
        (uName && cNome && uName === cNome)
      );
    });
  }

  // 2. Se não encontrar, procurar no Efetivo Geral estático (EFETIVO_GERAL_DATA)
  if (!matchedColab && EFETIVO_GERAL_DATA && EFETIVO_GERAL_DATA.length > 0) {
    matchedColab = EFETIVO_GERAL_DATA.find((c) => {
      const cEmail = (c.email || "").trim().toLowerCase();
      const cNuit = (c.nuit || "").trim();
      const cNome = (c.nome || "").trim().toLowerCase();

      return (
        (uEmail && cEmail && uEmail === cEmail) ||
        (uNuit && cNuit && uNuit === cNuit) ||
        (uName && cNome && uName === cNome)
      );
    });
  }

  // Se encontramos no Efetivo Geral ou Colaboradores:
  if (matchedColab) {
    const isDocente =
      classifyTipo(matchedColab) === "Docente" ||
      classifyTipo(user) === "Docente";

    const statusMandato = (
      matchedColab.estadoMandato ||
      matchedColab.mandatoStatus ||
      matchedColab.status ||
      matchedColab.situacao ||
      user?.estadoMandato ||
      user?.mandatoStatus ||
      ""
    )
      .toString()
      .toLowerCase()
      .trim();

    const isCessadoExplicitamente =
      statusMandato === "cessado" ||
      statusMandato === "despromovido" ||
      statusMandato === "inativo" ||
      matchedColab.cessado === true ||
      matchedColab.cargoChefiaCessado === true ||
      user?.cessado === true ||
      user?.cargoChefiaCessado === true;

    // Verificar se tem cargo de chefia ativo em comissão de serviço
    const hasChefiaActive =
      !isCessadoExplicitamente &&
      (hasChefiaPosition(matchedColab) || hasChefiaPosition(user));

    // REGRA DE NEGÓCIO:
    // Se for Docente e NÃO tiver comissão de serviço de chefia ativa (ou tiver cessado o cargo):
    // Volta ao seu órgão de origem: Órgão = Unidade Orgânica, Direção = Divisão de Engenharia.
    if (isDocente && (!hasChefiaActive || isCessadoExplicitamente)) {
      let origDep = matchedColab.departamento || user?.departamento || "";
      let depNormalized = origDep;
      const depLower = (origDep || "").toLowerCase();

      if (
        depLower.includes("eletrotécnica") ||
        depLower.includes("eletrotecnica") ||
        depLower.includes("dee")
      ) {
        depNormalized = "Departamento de Engenharia Eletrotécnica";
      } else if (
        depLower.includes("construção civil") ||
        depLower.includes("construcao civil") ||
        depLower.includes("decc")
      ) {
        depNormalized = "Departamento de Engenharia de Construção Civil";
      } else if (
        depLower.includes("construção mecânica") ||
        depLower.includes("construcao mecanica") ||
        depLower.includes("decm")
      ) {
        depNormalized = "Departamento de Engenharia de Construção Mecânica";
      } else if (depLower.includes("disciplinas gerais")) {
        depNormalized = "Departamento de Disciplinas Gerais";
      } else if (depLower.includes("pesquisa e extensão")) {
        depNormalized = "Departamento de Pesquisa e Extensão";
      } else if (!depNormalized || !depLower.includes("engenharia")) {
        depNormalized = "Departamento de Engenharia Eletrotécnica";
      }

      return {
        cat: "Unidade orgânica",
        dir: "Divisão de Engenharia",
        dep: depNormalized,
        rep: "",
        setor: "",
        source: isCessadoExplicitamente
          ? "Retorno ao Órgão de Origem após Cessação do Cargo (Divisão de Engenharia)"
          : "Órgão de Origem Docente (Divisão de Engenharia)",
        responsavel:
          matchedColab.nome || matchedColab.name || user?.nome || user?.name || "",
        responsavelEmail:
          matchedColab.email ||
          matchedColab.emailInstitucional ||
          user?.email ||
          "",
      };
    }

    let cat = matchedColab.unidade || matchedColab.unidadeOrganica || "";
    let dir = matchedColab.direcao || "";
    let dep = matchedColab.departamento || "";
    let rep = matchedColab.reparticao || "";
    let setor =
      matchedColab.sector || matchedColab.setor || matchedColab.seccao || "";

    const dirLower = dir.toLowerCase();
    const catLower = cat.toLowerCase();

    let catNormalized = "Unidade Orgânica";

    if (catLower.includes("orgânica") || catLower.includes("organica")) {
      catNormalized = "Unidade Orgânica";
    } else if (
      catLower.includes("direção") ||
      catLower.includes("direcao") ||
      catLower.includes("gestão") ||
      catLower.includes("gestao") ||
      catLower.includes("gabinete") ||
      dirLower.includes("gabinete")
    ) {
      catNormalized = "Órgão de Direção e Gestão";
    } else if (
      catLower.includes("serviço") ||
      catLower.includes("servico") ||
      catLower.includes("central") ||
      catLower.includes("isps") ||
      dirLower.includes("dicosafa") ||
      dirLower.includes("dicosser")
    ) {
      catNormalized = "Serviços Centrais";
    } else {
      if (
        dirLower.includes("engenharia") ||
        dirLower.includes("incubação") ||
        dirLower.includes("incubacao") ||
        dirLower.includes("cie") ||
        dirLower.includes("centro")
      ) {
        catNormalized = "Unidade Orgânica";
      } else if (
        dirLower.includes("gabinete") ||
        dirLower.includes("diretor") ||
        dirLower.includes("conselho")
      ) {
        catNormalized = "Órgão de Direção e Gestão";
      } else {
        catNormalized = "Unidade Orgânica";
      }
    }

    let dirNormalized = dir;
    if (catNormalized === "Unidade Orgânica") {
      if (dirLower.includes("engenharia")) {
        dirNormalized = "Divisão de Engenharia";
      } else if (
        dirLower.includes("incubação") ||
        dirLower.includes("incubacao") ||
        dirLower.includes("cie")
      ) {
        dirNormalized = "Centro de Incubação de Empresas";
      } else {
        dirNormalized = "Centros";
      }
    } else if (catNormalized === "Órgão de Direção e Gestão") {
      if (
        dirLower.includes("gabinete") ||
        dirLower.includes("diretor") ||
        dirLower.includes("dg")
      ) {
        dirNormalized = "Gabinete do Diretor-Geral";
      } else if (dirLower.includes("representantes")) {
        dirNormalized = "Conselho de Representantes";
      } else if (
        dirLower.includes("administrativo") ||
        dirLower.includes("gestão") ||
        dirLower.includes("gestao")
      ) {
        dirNormalized = "Conselho Administrativo e de Gestão";
      } else {
        dirNormalized = "Conselho Técnico e de Qualidade";
      }
    } else {
      if (
        dirLower.includes("dicosser") ||
        dirLower.includes("sociais") ||
        dirLower.includes("estudantis") ||
        dirLower.includes("registo")
      ) {
        dirNormalized = "DICOSSER";
      } else {
        dirNormalized = "DICOSAFA";
      }
    }

    // Normalizar departamento
    let depNormalized = dep;
    if (depNormalized) {
      const allDepsSet = new Set<string>();
      Object.values(DEPARTAMENTOS).forEach((arr) =>
        arr.forEach((d) => allDepsSet.add(d))
      );
      const allDeps = Array.from(allDepsSet);

      const matchedDepObj = allDeps.find(
        (d) =>
          d.toLowerCase().trim() === depNormalized.toLowerCase().trim() ||
          d
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "")
            .includes(depNormalized.toLowerCase().replace(/[^a-z0-9]/g, "")) ||
          depNormalized
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "")
            .includes(d.toLowerCase().replace(/[^a-z0-9]/g, ""))
      );
      if (matchedDepObj) {
        depNormalized = matchedDepObj;
      }
    }

    // Normalizar reparticao
    let repNormalized = rep;
    if (repNormalized && depNormalized && REPARTICOES[depNormalized]) {
      const reps = REPARTICOES[depNormalized];
      const matchedRepObj = reps.find(
        (r) =>
          r.toLowerCase().trim() === repNormalized.toLowerCase().trim() ||
          r
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "")
            .includes(repNormalized.toLowerCase().replace(/[^a-z0-9]/g, "")) ||
          repNormalized
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "")
            .includes(r.toLowerCase().replace(/[^a-z0-9]/g, ""))
      );
      if (matchedRepObj) {
        repNormalized = matchedRepObj;
      }
    }

    // Normalizar setor
    let setorNormalized = setor;
    if (setorNormalized && repNormalized && SECTORES[repNormalized]) {
      const secs = SECTORES[repNormalized];
      const matchedSecObj = secs.find(
        (s) =>
          s.toLowerCase().trim() === setorNormalized.toLowerCase().trim() ||
          s
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "")
            .includes(setorNormalized.toLowerCase().replace(/[^a-z0-9]/g, "")) ||
          setorNormalized
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "")
            .includes(s.toLowerCase().replace(/[^a-z0-9]/g, ""))
      );
      if (matchedSecObj) {
        setorNormalized = matchedSecObj;
      }
    }

    const isChefia =
      (matchedColab.cargoChefia &&
        matchedColab.cargoChefia !== "Nenhum" &&
        matchedColab.cargoChefia !== "-") ||
      (matchedColab.cargo &&
        (matchedColab.cargo.toLowerCase().includes("chefe") ||
          matchedColab.cargo.toLowerCase().includes("diretor") ||
          matchedColab.cargo.toLowerCase().includes("coordenador") ||
          matchedColab.cargo.toLowerCase().includes("reitor")));
    const source = isChefia
      ? "Repartição de Pessoal (Cargos de Chefia)"
      : "Repartição de Pessoal (Efetivo Geral)";

    return {
      cat: catNormalized,
      dir: dirNormalized,
      dep: depNormalized,
      rep: repNormalized,
      setor: setorNormalized,
      source: source,
      responsavel: matchedColab.nome || matchedColab.name || "",
      responsavelEmail:
        matchedColab.email || matchedColab.emailInstitucional || "",
    };
  }

  // Se o usuário é docente sem comissão de serviço de chefia ativa ou cessado:
  const isUserDocente = classifyTipo(user) === "Docente";
  const userStatusMandato = (user.estadoMandato || user.mandatoStatus || user.status || "").toLowerCase().trim();
  const isUserCessado = userStatusMandato === "cessado" || user.cessado === true || user.cargoChefiaCessado === true;
  const userHasChefia = hasChefiaPosition(user) && !isUserCessado;

  if (isUserDocente && (!userHasChefia || isUserCessado)) {
    let origDep = user.departamento || "";
    let depNormalized = origDep;
    const depLower = origDep.toLowerCase();

    if (depLower.includes("eletrotécnica") || depLower.includes("eletrotecnica") || depLower.includes("dee")) {
      depNormalized = "Departamento de Engenharia Eletrotécnica";
    } else if (depLower.includes("construção civil") || depLower.includes("construcao civil") || depLower.includes("decc")) {
      depNormalized = "Departamento de Engenharia de Construção Civil";
    } else if (depLower.includes("construção mecânica") || depLower.includes("construcao mecanica") || depLower.includes("decm")) {
      depNormalized = "Departamento de Engenharia de Construção Mecânica";
    } else if (depLower.includes("disciplinas gerais")) {
      depNormalized = "Departamento de Disciplinas Gerais";
    } else if (depLower.includes("pesquisa e extensão")) {
      depNormalized = "Departamento de Pesquisa e Extensão";
    } else if (!depNormalized || !depLower.includes("engenharia")) {
      depNormalized = "Departamento de Engenharia Eletrotécnica";
    }

    return {
      cat: "Unidade orgânica",
      dir: "Divisão de Engenharia",
      dep: depNormalized,
      rep: "",
      setor: "",
      source: "Órgão de Origem Docente (Divisão de Engenharia)",
      responsavel: user.nome || user.name || "",
      responsavelEmail: user.email || "",
    };
  }

  // Se o usuário tem alocação explícita salva no perfil
  if (
    user.unidade ||
    user.unidadeOrganica ||
    user.direcao ||
    user.departamento ||
    user.reparticao
  ) {
    return {
      cat: user.unidade || user.unidadeOrganica || "Unidade Orgânica",
      dir: user.direcao || "",
      dep: user.departamento || "",
      rep: user.reparticao || "",
      setor: user.sector || user.setor || user.seccao || "",
      source: "Perfil de Utilizador",
      responsavel: user.nome || user.name || "",
      responsavelEmail: user.email || "",
    };
  }

  // Análise Semântica
  let matchedCat = "";
  let matchedDir = "";
  let matchedDep = "";
  let matchedRep = "";
  let matchedSetor = "";

  const isUserChefia =
    user.cargoChefia &&
    user.cargoChefia !== "Nenhum" &&
    user.cargoChefia !== "";
  let uUnidade = user.unidade || user.unidadeOrganica || "";
  let uDirecao = user.direcao || user.servicoCentral || "";
  let uDepartamento = user.departamento || "";
  let uReparticao = user.reparticao || "";
  let uSetor = user.sector || user.seccao || "";

  const userSearchText =
    `${user.cargo || ""} ${user.cargoChefia || ""} ${user.departamento || ""} ${user.direcao || ""} ${user.unidade || ""} ${user.unidadeOrganica || ""} ${user.reparticao || ""} ${user.setor || ""} ${user.sector || ""}`.toLowerCase();

  if (
    userSearchText.includes("práticas de geração") ||
    userSearchText.includes("praticas de geracao") ||
    userSearchText.includes("dpgnde") ||
    userSearchText.includes("rpgn") ||
    userSearchText.includes("rdec")
  ) {
    matchedCat = "Unidade Orgânica";
    matchedDir = "Centro de Incubação de Empresas";
    matchedDep =
      "Departamento de Práticas de Geração de Negócio e Desenvolvimento Empresarial (DPGNDE)";
    matchedRep = "";
  } else if (
    userSearchText.includes("consultoria") ||
    userSearchText.includes("angariação") ||
    userSearchText.includes("angariacao") ||
    userSearchText.includes("dcpaf") ||
    userSearchText.includes("rcep") ||
    userSearchText.includes("raf")
  ) {
    matchedCat = "Unidade Orgânica";
    matchedDir = "Centro de Incubação de Empresas";
    matchedDep =
      "Departamento de Consultoria, Estudos, Projetos e Angariação de Fundos (DCPAF)";
    matchedRep = "";
  } else if (
    userSearchText.includes("prospecção") ||
    userSearchText.includes("prospeccao") ||
    userSearchText.includes("oportunidade de negócio") ||
    userSearchText.includes("oportunidade de negocio") ||
    userSearchText.includes("dpone") ||
    userSearchText.includes("rpon") ||
    userSearchText.includes("rpoe")
  ) {
    matchedCat = "Unidade Orgânica";
    matchedDir = "Centro de Incubação de Empresas";
    matchedDep =
      "Departamento de Prospecção de Oportunidade de Negócio (DPONE)";
    matchedRep = "";
  } else if (
    userSearchText.includes("diretor do cie") ||
    userSearchText.includes("diretor de cie") ||
    userSearchText.includes("cie") ||
    userSearchText.includes("incubação") ||
    userSearchText.includes("incubacao")
  ) {
    matchedCat = "Unidade Orgânica";
    matchedDir = "Centro de Incubação de Empresas";
    matchedDep = "Diretor do CIE";
    matchedRep = "Diretor do CIE";
  } else if (
    userSearchText.includes("eletrotécnica") ||
    userSearchText.includes("eletrotecnica") ||
    userSearchText.includes("dee") ||
    userSearchText.includes("elétrica") ||
    userSearchText.includes("eletrica") ||
    userSearchText.includes("eletrónica") ||
    userSearchText.includes("eletronica") ||
    userSearchText.includes("telecomunicações") ||
    userSearchText.includes("telecomunicacoes") ||
    userSearchText.includes("energias renováveis") ||
    userSearchText.includes("energias renovaveis")
  ) {
    matchedCat = "Unidade Orgânica";
    matchedDir = "Divisão de Engenharia";
    matchedDep = "Departamento de Engenharia Eletrotécnica";
    if (
      userSearchText.includes("chefe") ||
      userSearchText.includes("chefe do dee")
    ) {
      matchedRep = "Chefe do DEE";
    } else if (
      userSearchText.includes("elétrica") ||
      userSearchText.includes("eletrica")
    ) {
      matchedRep = "Diretor do Curso de Engenharia Elétrica";
    } else if (
      userSearchText.includes("eletrónica") ||
      userSearchText.includes("eletronica") ||
      userSearchText.includes("telecomun")
    ) {
      matchedRep =
        "Diretor do Curso de Engenharia Eletrónica e de Telecomunicações";
    } else if (
      userSearchText.includes("renováveis") ||
      userSearchText.includes("renovaveis")
    ) {
      matchedRep = "Diretor do Curso de Engenharia de Energias Renováveis";
    } else {
      matchedRep = "Chefe do DEE";
    }
  } else if (
    userSearchText.includes("construção civil") ||
    userSearchText.includes("construcao civil") ||
    userSearchText.includes("decc") ||
    userSearchText.includes("hidráulica") ||
    userSearchText.includes("hidraulica")
  ) {
    matchedCat = "Unidade Orgânica";
    matchedDir = "Divisão de Engenharia";
    matchedDep = "Departamento de Engenharia de Construção Civil";
    if (
      userSearchText.includes("chefe") ||
      userSearchText.includes("chefe do decc")
    ) {
      matchedRep = "Chefe do DECC";
    } else if (
      userSearchText.includes("hidráulica") ||
      userSearchText.includes("hidraulica")
    ) {
      matchedRep = "Diretor do Curso de Engenharia Hidráulica";
    } else {
      matchedRep = "Diretor do Curso de Engenharia de Construção Civil";
    }
  } else if (
    userSearchText.includes("construção mecânica") ||
    userSearchText.includes("construcao mecanica") ||
    userSearchText.includes("decm") ||
    userSearchText.includes("termotécnica") ||
    userSearchText.includes("termotecnica")
  ) {
    matchedCat = "Unidade Orgânica";
    matchedDir = "Divisão de Engenharia";
    matchedDep = "Departamento de Engenharia de Construção Mecânica";
    if (
      userSearchText.includes("chefe") ||
      userSearchText.includes("chefe do decm")
    ) {
      matchedRep = "Chefe do DECM";
    } else if (
      userSearchText.includes("termotécnica") ||
      userSearchText.includes("termotecnica")
    ) {
      matchedRep = "Diretor do Curso de Engenharia Termotécnica";
    } else {
      matchedRep = "Diretor do Curso de Engenharia de Construção Mecânica";
    }
  } else if (
    userSearchText.includes("planificação") ||
    userSearchText.includes("planificacao") ||
    userSearchText.includes("DPEP") ||
    userSearchText.includes("estudos e projetos")
  ) {
    matchedCat = "Órgão de Direção e Gestão";
    matchedDir = "Gabinete do Diretor-Geral";
    matchedDep = "Departamento de Planificação Estudos e Projetos";
    if (
      userSearchText.includes("chefe") ||
      userSearchText.includes("diretor") ||
      userSearchText.includes("responsável")
    ) {
      matchedRep = "Chefe do Departamento de Planificação Estudos e Projetos";
    } else if (
      userSearchText.includes("estatística") ||
      userSearchText.includes("estatistica")
    ) {
      matchedRep = "Repartição de Estatística";
    } else if (
      userSearchText.includes("relatório") ||
      userSearchText.includes("relatorio")
    ) {
      matchedRep = "Setor de Relatório";
    } else if (
      userSearchText.includes("monitoria") ||
      userSearchText.includes("monitorizacao")
    ) {
      matchedRep = "Setor de Monitoria";
    } else {
      matchedRep = "Repartição de Planificação";
    }
  } else if (
    userSearchText.includes("ugea") ||
    userSearchText.includes("aquisições") ||
    userSearchText.includes("aquisicoes") ||
    userSearchText.includes("gestora e executora")
  ) {
    matchedCat = "Órgão de Direção e Gestão";
    matchedDir = "Gabinete do Diretor-Geral";
    matchedDep = "Unidade Gestora e Executora de Aquisições";
    if (
      userSearchText.includes("chefe da ugea") ||
      userSearchText.includes("chefe de ugea")
    ) {
      matchedRep = "Chefe da UGEA";
    } else if (userSearchText.includes("painel")) {
      matchedRep = "Painel da UGEA";
    } else if (userSearchText.includes("fornecedores")) {
      matchedRep = "Gestão de Fornecedores";
    } else {
      matchedRep = "Plano de Aquisição";
    }
  } else if (
    userSearchText.includes("cooperação") ||
    userSearchText.includes("cooperacao") ||
    userSearchText.includes("relações exteriores") ||
    userSearchText.includes("relacoes exteriores") ||
    userSearchText.includes("dcre")
  ) {
    matchedCat = "Órgão de Direção e Gestão";
    matchedDir = "Gabinete do Diretor-Geral";
    matchedDep = "Departamento de Cooperação e Relações Exteriores";
    if (
      userSearchText.includes("imagem") ||
      userSearchText.includes("institucional")
    ) {
      matchedRep = "Setor de imagem institucional";
    } else {
      matchedRep = "Chefe da DCRE";
    }
  } else if (
    userSearchText.includes("controlo técnico") ||
    userSearchText.includes("controlo tecnico") ||
    userSearchText.includes("qualidade") ||
    userSearchText.includes("dctq")
  ) {
    matchedCat = "Órgão de Direção e Gestão";
    matchedDir = "Gabinete do Diretor-Geral";
    matchedDep = "Departamento de Controlo Técnico e de Qualidade";
    if (
      userSearchText.includes("setor 1") ||
      userSearchText.includes("sector 1")
    ) {
      matchedRep = "SETOR 1";
    } else if (
      userSearchText.includes("setor 2") ||
      userSearchText.includes("sector 2")
    ) {
      matchedRep = "SETOR 2";
    } else {
      matchedRep = "Chefe da DCTQ";
    }
  } else if (
    userSearchText.includes("jurídico") ||
    userSearchText.includes("juridico") ||
    userSearchText.includes("dj") ||
    userSearchText.includes("advogado")
  ) {
    matchedCat = "Órgão de Direção e Gestão";
    matchedDir = "Gabinete do Diretor-Geral";
    matchedDep = "Departamento Jurídico";
    if (
      userSearchText.includes("setor 1") ||
      userSearchText.includes("sector 1")
    ) {
      matchedRep = "SETOR 1";
    } else if (
      userSearchText.includes("setor 2") ||
      userSearchText.includes("sector 2")
    ) {
      matchedRep = "SETOR 2";
    } else {
      matchedRep = "Chefe da DJ";
    }
  } else if (
    userSearchText.includes("chefe do GDG") ||
    userSearchText.includes("chefe de GDG") ||
    userSearchText.includes("GDG")
  ) {
    matchedCat = "Órgão de Direção e Gestão";
    matchedDir = "Gabinete do Diretor-Geral";
    matchedDep = "Chefe do GDG";
  } else if (userSearchText.includes("secretaria executiva")) {
    matchedCat = "Órgão de Direção e Gestão";
    matchedDir = "Gabinete do Diretor-Geral";
    matchedDep = "Secretaria Executiva";
  } else if (
    userSearchText.includes("diretor geral") ||
    userSearchText.includes("diretor-geral") ||
    userSearchText.includes("Gabinete do Diretor-Geral")
  ) {
    matchedCat = "Órgão de Direção e Gestão";
    matchedDir = "Gabinete do Diretor-Geral";
    matchedDep = "Gabinete do Diretor-Geral";
  }

  if (!matchedDep) {
    if (isUserChefia && user.cargoChefia) {
      const chefiaText = user.cargoChefia.toLowerCase();
      if (!uReparticao) {
        for (const reps of Object.values(REPARTICOES)) {
          const foundRep = reps.find(
            (r) =>
              chefiaText.includes(r.toLowerCase()) ||
              looseMatch(r, user.cargoChefia)
          );
          if (foundRep) {
            uReparticao = foundRep;
            break;
          }
        }
      }
      if (!uDepartamento) {
        const allDeps = Object.values(DEPARTAMENTOS).flat();
        const foundDep = allDeps.find(
          (d) =>
            chefiaText.includes(d.toLowerCase()) ||
            looseMatch(d, user.cargoChefia)
        );
        if (foundDep) {
          uDepartamento = foundDep;
        }
      }
    }
  }

  if (uDepartamento) {
    const group = findGroupForDepartment(uDepartamento);
    if (group.matchedDir) {
      matchedDep = uDepartamento;
      matchedDir = group.matchedDir;
      matchedCat = group.matchedCat;
    }
  }

  if (!matchedDep && uReparticao) {
    const repGroup = findGroupForReparticao(uReparticao);
    if (repGroup.matchedRep) {
      matchedRep = repGroup.matchedRep;
      matchedDep = repGroup.matchedDep;
      matchedDir = repGroup.matchedDir;
      matchedCat = repGroup.matchedCat;
    }
  }

  if (!matchedDir && uDirecao) {
    for (const cat of UNIDADES_ORGANICAS_SISTEMA) {
      const foundDir = cat.direcoes.find((d) => looseMatch(d, uDirecao));
      if (foundDir) {
        matchedDir = foundDir;
        matchedCat = cat.nome;
        break;
      }
    }
  }

  if (!matchedCat && uUnidade) {
    const foundCat = UNIDADES_ORGANICAS_SISTEMA.find((c) =>
      looseMatch(c.nome, uUnidade)
    );
    if (foundCat) {
      matchedCat = foundCat.nome;
    }
  }

  if (uSetor) {
    for (const [rep, sectors] of Object.entries(SECTORES)) {
      const foundSector = sectors.find((s) => looseMatch(s, uSetor));
      if (foundSector) {
        matchedSetor = foundSector;
        if (!matchedRep) {
          matchedRep = rep;
        }
        break;
      }
    }
  }

  if (uUnidade && !matchedCat) {
    if (
      looseMatch(uUnidade, "direção") ||
      looseMatch(uUnidade, "gestão") ||
      looseMatch(uUnidade, "órgãos")
    ) {
      matchedCat = "Órgão de Direção e Gestão";
    } else if (
      looseMatch(uUnidade, "serviços") ||
      looseMatch(uUnidade, "centrais")
    ) {
      matchedCat = "Serviços Centrais";
    } else {
      matchedCat = "Unidade Orgânica";
    }
  }

  if (uDirecao && !matchedDir) {
    if (matchedCat) {
      const possibleDirs =
        UNIDADES_ORGANICAS_SISTEMA.find((c) => c.nome === matchedCat)
          ?.direcoes || [];
      if (possibleDirs.length > 0) {
        matchedDir = possibleDirs[0];
      }
    }
  }

  if (uDepartamento && !matchedDep) {
    const allDeps = Object.values(DEPARTAMENTOS).flat();
    const found = allDeps.find((d) => looseMatch(d, uDepartamento));
    if (found) {
      matchedDep = found;
    }
  }

  return {
    cat: matchedCat || "Unidade Orgânica",
    dir: matchedDir || uDirecao || "",
    dep: matchedDep || uDepartamento || "",
    rep: matchedRep || uReparticao || "",
    setor: matchedSetor || uSetor || "",
    source: "Análise Semântica de Cargo",
    responsavel: user.nome || user.name || "",
    responsavelEmail: user.email || "",
  };
}

export const determineSectorAllocation = getUserAllocatedDetails;

