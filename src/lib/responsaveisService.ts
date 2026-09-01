import { useEffect, useState } from "react";
import { Colaborador } from "../types";
import { EFETIVO_GERAL_DATA } from "../constants/colaboradoresList";
import { firestoreService } from "./firestoreService";

/**
 * Serviço para buscar e filtrar responsáveis e assinantes dos documentos
 * com base na Repartição de Pessoal, Efetivo Geral e Afetações de Setor.
 */

export function buscarColaboradoresEfetivo(): Promise<Colaborador[]> {
  return new Promise((resolve) => {
    try {
      const unsub = firestoreService.colaboradores.subscribe((data) => {
        unsub();
        if (data && data.length > 0) {
          resolve(data as Colaborador[]);
        } else {
          resolve(EFETIVO_GERAL_DATA);
        }
      });
      // Fallback timeout em caso de demora no Firestore
      setTimeout(() => {
        resolve(EFETIVO_GERAL_DATA);
      }, 1500);
    } catch {
      resolve(EFETIVO_GERAL_DATA);
    }
  });
}

/**
 * Localizar Diretor-Geral
 */
export function buscarDiretorGeral(lista: Colaborador[] = EFETIVO_GERAL_DATA): Colaborador | undefined {
  return lista.find((col) => {
    const cargo = (col.cargo || "").toLowerCase();
    const funcao = (col.funcao || "").toLowerCase();
    return cargo.includes("diretor-geral") || cargo.includes("diretor geral") || funcao.includes("diretor-geral");
  }) || {
    id: "DG_DEFAULT",
    ord: 1,
    nome: "Prof. António Cristo Pinto Madeira",
    cargo: "Diretor-Geral",
    direcao: "Órgão de Direção e Gestão",
    email: "direcao.geral@songo.ac.mz",
    tipo: "Docente",
    efetivo: true,
    unidade: "Songo",
    genero: "M",
    dataNascimento: "",
    localNascimento: { pais: "Moçambique", provincia: "Tete", distrito: "Cahora-Bassa" },
    nuit: "",
    numeroBI: "",
    nivelAcademico: "Doutor",
    areaFormacao: "Geral",
    tipoContrato: "Quadro"
  };
}

/**
 * Localizar Director da DICOSAFA
 */
export function buscarDirectorDicosafa(lista: Colaborador[] = EFETIVO_GERAL_DATA): Colaborador | undefined {
  return lista.find((col) => {
    const cargo = (col.cargo || "").toLowerCase();
    const direcao = (col.direcao || "").toLowerCase();
    const depto = (col.departamento || "").toLowerCase();
    return cargo.includes("dicosafa") || direcao.includes("dicosafa") || depto.includes("dicosafa");
  }) || {
    id: "DICOSAFA_DEFAULT",
    ord: 2,
    nome: "Dr. Jaime Langa",
    cargo: "Director da DICOSAFA",
    direcao: "DICOSAFA",
    email: "dicosafa@songo.ac.mz",
    tipo: "CTA",
    efetivo: true,
    unidade: "Songo",
    genero: "M",
    dataNascimento: "",
    localNascimento: { pais: "Moçambique", provincia: "Tete", distrito: "Cahora-Bassa" },
    nuit: "",
    numeroBI: "",
    nivelAcademico: "Licenciado",
    areaFormacao: "Gestão",
    tipoContrato: "Quadro"
  };
}

/**
 * Localizar Responsável / Chefe por Unidade ou Departamento de Afetação
 */
export function buscarChefePorAfetacao(
  lista: Colaborador[] = EFETIVO_GERAL_DATA,
  siglaOuNomeSetor: string
): Colaborador | undefined {
  return buscarChefeMaximoDepartamento(lista, siglaOuNomeSetor);
}

/**
 * Localizar Chefe Máximo do Departamento.
 * Prioridade:
 * 1. Utilizador logado se ocupar cargo de chefia no departamento logado.
 * 2. Colaborador nomeado oficialmente como Chefe do Departamento / Director daquele setor.
 * 3. Colaborador com isChefia=true ou cargoChefia ativo no setor.
 * 4. Qualquer cargo de chefia do setor.
 */
export function buscarChefeMaximoDepartamento(
  lista: Colaborador[] = EFETIVO_GERAL_DATA,
  siglaOuNomeSetor: string,
  userLogado?: any
): Colaborador | undefined {
  const termo = (siglaOuNomeSetor || "").trim().toLowerCase();

  // 1. Verificar se o próprio utilizador logado ocupa o cargo de chefia do departamento
  if (userLogado) {
    const userCargo = String(
      userLogado.cargo ||
      userLogado.cargoChefia ||
      userLogado.funcao ||
      userLogado.role ||
      ""
    ).toLowerCase();

    const isUserChefe =
      userLogado.isChefia === true ||
      Boolean(userLogado.cargoChefia && String(userLogado.cargoChefia).trim()) ||
      userCargo.includes("chefe") ||
      userCargo.includes("director") ||
      userCargo.includes("diretor") ||
      userCargo.includes("responsável") ||
      userCargo.includes("coordenador");

    const userDepto = String(
      userLogado.departamento ||
      userLogado.direcao ||
      userLogado.setor ||
      userLogado.sector ||
      userLogado.reparticao ||
      userLogado.unidade ||
      userLogado.siglaUnidade ||
      userLogado.userArea?.departamento ||
      ""
    ).toLowerCase();

    const deptoMatch =
      !termo ||
      userDepto.includes(termo) ||
      termo.includes(userDepto) ||
      (termo === "dpep" && (userDepto.includes("dpep") || userDepto.includes("planifica"))) ||
      (termo === "daf" && (userDepto.includes("daf") || userDepto.includes("financeir") || userDepto.includes("apoio financeiro"))) ||
      (termo === "dicosafa" && userDepto.includes("dicosafa")) ||
      (termo === "estg" && (userDepto.includes("estg") || userDepto.includes("engenharia")));

    if (isUserChefe && deptoMatch) {
      const nomeChefeLogado = userLogado.nome || userLogado.name || userLogado.displayName || "Chefe do Departamento";
      const cargoChefeLogado = userLogado.cargoChefia || userLogado.cargo || "Chefe do Departamento";
      return {
        id: userLogado.id || userLogado.uid || "CHEFE_LOGADO",
        ord: 0,
        nome: nomeChefeLogado,
        cargo: cargoChefeLogado,
        cargoChefia: cargoChefeLogado,
        departamento: userLogado.departamento || siglaOuNomeSetor,
        direcao: userLogado.direcao,
        email: userLogado.email || "",
        tipo: "CTA",
        efetivo: true,
        unidade: "Songo",
        genero: "M",
        dataNascimento: "",
        localNascimento: { pais: "Moçambique", provincia: "Tete", distrito: "Cahora-Bassa" },
        nuit: userLogado.nuit || "",
        numeroBI: "",
        nivelAcademico: "Licenciado",
        areaFormacao: "Geral",
        tipoContrato: "Quadro",
        isChefia: true,
      };
    }
  }

  if (!termo) return undefined;

  // Termos equivalentes para siglas institucionais
  const termosEquivalentes: string[] = [termo];
  if (termo === "dpep" || termo.includes("planifica")) {
    termosEquivalentes.push("dpep", "planificação", "planificacao", "projetos", "projectos");
  }
  if (termo === "daf" || termo.includes("financ")) {
    termosEquivalentes.push("daf", "apoio financeiro", "administração e finanças", "administracao e financas", "finanças", "financ");
  }
  if (termo === "dicosafa") {
    termosEquivalentes.push("dicosafa", "corpos sociais", "social");
  }
  if (termo === "estg" || termo.includes("engenh")) {
    termosEquivalentes.push("estg", "engenharia", "tecnologia e gestão", "tecnologia e gestao");
  }
  if (termo === "sg" || termo.includes("secretaria geral")) {
    termosEquivalentes.push("secretaria geral");
  }
  if (termo === "gdg" || termo.includes("secretaria executiva") || termo.includes("gabinete")) {
    termosEquivalentes.push("secretaria executiva", "gabinete", "diretor-geral");
  }
  if (termo === "drh" || termo.includes("recursos humanos")) {
    termosEquivalentes.push("recursos humanos", "pessoal");
  }
  if (termo === "dra" || termo.includes("registo acad")) {
    termosEquivalentes.push("registo académico", "registo academico");
  }
  if (termo === "dpa" || termo.includes("produção aliment")) {
    termosEquivalentes.push("produção alimentar", "producao alimentar");
  }

  const pertenceAoDepto = (col: Colaborador) => {
    const depto = (col.departamento || "").toLowerCase();
    const dir = (col.direcao || "").toLowerCase();
    const rep = (col.reparticao || "").toLowerCase();
    const sec = (col.sector || "").toLowerCase();
    const area = (col.areaDeAfetacao || "").toLowerCase();

    return termosEquivalentes.some(
      (t) =>
        depto.includes(t) ||
        dir.includes(t) ||
        rep.includes(t) ||
        sec.includes(t) ||
        area.includes(t)
    );
  };

  const doSetor = lista.filter(pertenceAoDepto);

  // 1º Nível: Colaborador nomeado expressamente como "Chefe do Departamento", "Director" ou com cargoChefia
  const chefeDepto = doSetor.find((col) => {
    const cargo = (col.cargo || "").toLowerCase();
    const cargoChefia = (col.cargoChefia || "").toLowerCase();
    return (
      cargo.includes("chefe do departamento") ||
      cargo.includes("chefe de departamento") ||
      cargoChefia.includes("chefe do departamento") ||
      cargoChefia.includes("chefe de departamento") ||
      cargo.includes("director") ||
      cargo.includes("diretor") ||
      cargo.includes("chefe máximo") ||
      cargo.includes("chefe maximo")
    );
  });
  if (chefeDepto) return chefeDepto;

  // 2º Nível: Colaborador com isChefia=true ou cargoChefia preenchido
  const chefeNomeado = doSetor.find((col) => {
    return col.isChefia === true || Boolean(col.cargoChefia && String(col.cargoChefia).trim());
  });
  if (chefeNomeado) return chefeNomeado;

  // 3º Nível: Qualquer cargo com "chefe" no departamento (priorizando quem não é adjunto)
  const chefeGeral = doSetor.find((col) => {
    const cargo = (col.cargo || "").toLowerCase();
    return cargo.includes("chefe") && !cargo.includes("adjunto");
  }) || doSetor.find((col) => {
    const cargo = (col.cargo || "").toLowerCase();
    return (
      cargo.includes("chefe") ||
      cargo.includes("responsável") ||
      cargo.includes("coordenador")
    );
  });
  if (chefeGeral) return chefeGeral;

  // 4º Nível: Fallbacks diretos para serviços centrais conhecidos
  if (termo.includes("daf") || termo.includes("financ")) {
    return buscarChefeDAF(lista);
  }
  if (termo.includes("dpep") || termo.includes("planifica")) {
    return buscarChefeDPEP(lista);
  }
  if (termo.includes("dicosafa")) {
    return buscarDirectorDicosafa(lista);
  }
  if (termo.includes("secretaria geral") || termo === "sg") {
    return buscarChefeSecretariaGeral(lista);
  }
  if (termo.includes("secretaria executiva") || termo === "gdg") {
    return buscarChefeSecretariaExecutiva(lista);
  }

  // 5º Nível: Qualquer colaborador associado ao departamento
  return doSetor[0] || undefined;
}

/**
 * Localizar Chefe do Apoio Financeiro (DAF)
 */
export function buscarChefeDAF(lista: Colaborador[] = EFETIVO_GERAL_DATA): Colaborador | undefined {
  return lista.find((col) => {
    const cargo = (col.cargo || "").toLowerCase();
    const depto = (col.departamento || "").toLowerCase();
    const rep = (col.reparticao || "").toLowerCase();
    const ehChefe = cargo.includes("chefe") || cargo.includes("director") || cargo.includes("diretor");
    
    return (
      ehChefe && (
        cargo.includes("daf") ||
        cargo.includes("apoio financeiro") ||
        depto.includes("apoio financeiro") ||
        depto.includes("daf") ||
        rep.includes("financeiro")
      )
    );
  });
}

/**
 * Localizar Chefe da Repartição de Transporte
 */
export function buscarChefeTransporte(lista: Colaborador[] = EFETIVO_GERAL_DATA): Colaborador | undefined {
  return lista.find((col) => {
    const cargo = (col.cargo || "").toLowerCase();
    const depto = (col.departamento || "").toLowerCase();
    const rep = (col.reparticao || "").toLowerCase();
    const ehChefe = cargo.includes("chefe") || cargo.includes("director") || cargo.includes("diretor");

    return (
      ehChefe && (
        cargo.includes("transporte") ||
        depto.includes("transporte") ||
        rep.includes("transporte")
      )
    );
  });
}

/**
 * Localizar Chefe da Secretaria Geral
 */
export function buscarChefeSecretariaGeral(lista: Colaborador[] = EFETIVO_GERAL_DATA): Colaborador | undefined {
  return lista.find((col) => {
    const cargo = (col.cargo || "").toLowerCase();
    const depto = (col.departamento || "").toLowerCase();
    const rep = (col.reparticao || "").toLowerCase();
    const ehChefe = cargo.includes("chefe") || cargo.includes("director") || cargo.includes("diretor");

    return (
      ehChefe && (
        cargo.includes("secretaria geral") ||
        cargo.includes("secretária geral") ||
        depto.includes("secretaria geral") ||
        rep.includes("secretaria geral")
      )
    );
  });
}

/**
 * Localizar Chefe do DPEP
 */
export function buscarChefeDPEP(lista: Colaborador[] = EFETIVO_GERAL_DATA): Colaborador | undefined {
  return lista.find((col) => {
    const cargo = (col.cargo || "").toLowerCase();
    const depto = (col.departamento || "").toLowerCase();
    const rep = (col.reparticao || "").toLowerCase();
    const ehChefe = cargo.includes("chefe") || cargo.includes("director") || cargo.includes("diretor");

    return (
      ehChefe && (
        cargo.includes("dpep") ||
        depto.includes("dpep") ||
        depto.includes("planificação") ||
        rep.includes("dpep")
      )
    );
  });
}

/**
 * Localizar Chefe do Património
 */
export function buscarChefePatrimonio(lista: Colaborador[] = EFETIVO_GERAL_DATA): Colaborador | undefined {
  return lista.find((col) => {
    const cargo = (col.cargo || "").toLowerCase();
    const depto = (col.departamento || "").toLowerCase();
    const rep = (col.reparticao || "").toLowerCase();
    const ehChefe = cargo.includes("chefe") || cargo.includes("director") || cargo.includes("diretor");

    return (
      ehChefe && (
        cargo.includes("património") ||
        cargo.includes("patrimonio") ||
        depto.includes("património") ||
        depto.includes("patrimonio") ||
        rep.includes("património") ||
        rep.includes("patrimonio")
      )
    );
  });
}

/**
 * Localizar Chefe da Secretaria Executiva
 */
export function buscarChefeSecretariaExecutiva(lista: Colaborador[] = EFETIVO_GERAL_DATA): Colaborador | undefined {
  return lista.find((col) => {
    const cargo = (col.cargo || "").toLowerCase();
    const depto = (col.departamento || "").toLowerCase();
    const rep = (col.reparticao || "").toLowerCase();
    const ehChefe = cargo.includes("chefe") || cargo.includes("director") || cargo.includes("diretor") || cargo.includes("secretário") || cargo.includes("secretaria");

    return (
      ehChefe && (
        cargo.includes("secretaria executiva") ||
        cargo.includes("secretária executiva") ||
        depto.includes("secretaria executiva") ||
        rep.includes("secretaria executiva")
      )
    );
  });
}

/**
 * Hook customizado para carregar o efetivo geral de colaboradores em qualquer componente de documento
 */
export function useEfetivoGeral() {
  const [colaboradores, setColaboradores] = useState<Colaborador[]>(EFETIVO_GERAL_DATA);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let unsub: () => void;
    try {
      unsub = firestoreService.colaboradores.subscribe((data) => {
        if (data && data.length > 0) {
          setColaboradores(data as Colaborador[]);
        } else {
          setColaboradores(EFETIVO_GERAL_DATA);
        }
        setLoading(false);
      });
    } catch {
      setColaboradores(EFETIVO_GERAL_DATA);
      setLoading(false);
    }
    return () => {
      if (unsub) unsub();
    };
  }, []);

  return { colaboradores, loading };
}
