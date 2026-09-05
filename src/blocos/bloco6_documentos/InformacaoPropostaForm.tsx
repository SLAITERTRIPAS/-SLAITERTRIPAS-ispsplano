import { printElementById } from "../../lib/printUtils";
import React, { useState, useEffect } from "react";
import {
  Save,
  Printer,
  Plus,
  Trash2,
  FileText,
  Upload,
  Feather,
  CheckCircle2,
  XCircle,
  Check,
  X,
  PenTool,
  Building2,
  Paperclip,
  ExternalLink,
  Search,
  UserCheck,
  Send,
  Clock,
  ArrowRight,
  CornerDownRight,
  Layers,
} from "lucide-react";
import { firestoreService } from "../../lib/firestoreService";
import SignatureUpload from "../bloco5_sistema/SignatureUpload";
import { FormLayout } from "../../components/shared/FormLayout";
import { DocumentFooter } from "../../components/shared/DocumentFooter";
import { motion } from "motion/react";
import { SignerPicker } from "../../components/shared/SignerPicker";
import {
  useEfetivoGeral,
  buscarDiretorGeral,
  buscarDirectorDicosafa,
  buscarChefePorAfetacao,
  buscarChefeMaximoDepartamento,
  buscarChefeDAF,
  buscarChefeTransporte,
  buscarChefeSecretariaGeral,
  buscarChefeDPEP,
  buscarColaboradoresEfetivo,
  buscarChefePatrimonio,
  buscarChefeSecretariaExecutiva,
} from "../../lib/responsaveisService";
import { Colaborador } from "../../types";
import { AnimatePresence } from "motion/react";

// Tipos e Templates Inteligentes por Categoria de Assunto
type CategoriaAssunto =
  | "CAPACITACAO"
  | "TROCA_EXPERIENCIA"
  | "COMISSAO_SERVICO"
  | "CONVITE"
  | "SEMINARIO"
  | "REUNIAO"
  | "VISITA_ESTUDO"
  | "VISITA_SUPERVISOR"
  | "OUTRO";

interface AssuntoTemplate {
  key: CategoriaAssunto;
  label: string;
  icon: string;
  assunto: string;
  textoCorpo1: string;
  textoCorpo2: string;
  justificacao: string;
  anexos: string[];
  isConvite: boolean;
}

const TEMPLATES_ASSUNTO: Record<CategoriaAssunto, AssuntoTemplate> = {
  CAPACITACAO: {
    key: "CAPACITACAO",
    label: "Capacitação / Formação",
    icon: "🎓",
    assunto:
      "Pedido de Autorização para Deslocação, Participação em Ação de Capacitação e Pagamento de Ajudas de Custos.",
    textoCorpo1:
      "No âmbito da acção de capacitação e formação contínua no tema [nome da actividade], a realizar-se em [local], entre os dias [datas], venho por este meio solicitar a devida autorização para a deslocação do(s) colaborador(es) [participantes], bem como o pagamento dos respetivos abonos de ajudas de custos, conforme previsto nos regulamentos internos e legislação aplicável.",
    textoCorpo2:
      "A participação nesta capacitação visa o aprimoramento das competências técnicas do quadro de pessoal, promovendo a inovação dos processos de trabalho e a elevação da qualidade dos serviços prestados por esta instituição.",
    justificacao:
      "A capacitação técnica do(s) colaborador(es) é determinante para a melhoria dos procedimentos internos e a sustentabilidade das actividades institucionais do Songo.",
    anexos: [
      "Programa / Termos da Capacitação",
      "Proposta de Inscrição",
      "Ficha de Enquadramento",
    ],
    isConvite: false,
  },
  TROCA_EXPERIENCIA: {
    key: "TROCA_EXPERIENCIA",
    label: "Troca de Experiência",
    icon: "🔄",
    assunto:
      "Pedido de Autorização para Deslocação para Ação de Troca de Experiência Interinstitucional e Pagamento de Ajudas de Custos.",
    textoCorpo1:
      "No âmbito do programa de intercâmbio e troca de experiência referente a [nome da actividade], a realizar-se em [local], entre os dias [datas], venho por este meio solicitar a devida autorização para a deslocação do(s) colaborador(es) [participantes], bem como o pagamento dos respetivos abonos de ajudas de custos.",
    textoCorpo2:
      "Esta acção de troca de experiência permitirá a partilha de conhecimentos operacionais, assimilação de boas práticas, avaliação de modelos organizacionais e o estreitamento das relações institucionais com a entidade anfitriã.",
    justificacao:
      "O intercâmbio de experiências é fundamental para a adoção de soluções eficientes e modernização do trabalho técnico e administrativo do setor.",
    anexos: [
      "Plano de Visita / Troca de Experiência",
      "Programa da Actividade",
      "Documento de Suporte",
    ],
    isConvite: false,
  },
  COMISSAO_SERVICO: {
    key: "COMISSAO_SERVICO",
    label: "Comissão de Serviço",
    icon: "💼",
    assunto:
      "Pedido de Autorização para Deslocação em Comissão de Serviço Oficial e Pagamento dos Respetivos Abonos.",
    textoCorpo1:
      "Por necessidade imperiosa de serviço no âmbito da comissão de serviço referente a [nome da actividade], a realizar-se em [local], entre os dias [datas], venho por este meio solicitar a devida autorização para a deslocação de [participantes], bem como o pagamento dos respetivos abonos de ajudas de custos para o cumprimento integral da missão designada.",
    textoCorpo2:
      "A realização desta comissão de serviço é de importância estratégica e urgente para assegurar o acompanhamento presencial, verificação técnica e resolução de matérias inerentes aos objetivos operacionais do Songo.",
    justificacao:
      "A presença física em comissão de serviço é estritamente necessária para a execução e fiscalização atenta dos trabalhos programados.",
    anexos: [
      "Termos de Referência da Comissão de Serviço",
      "Credencial de Deslocação",
      "Ordem de Serviço",
    ],
    isConvite: false,
  },
  CONVITE: {
    key: "CONVITE",
    label: "Um Convite",
    icon: "📩",
    assunto:
      "Pedido de Autorização para Deslocação em Atendimento a Convite Institucional e Pagamento dos Respetivos Abonos de Ajudas de Custos.",
    textoCorpo1:
      "Tendo sido endereçado ao Instituto Superior Politécnico de Songo o convite formal pela instituição [nome da instituição que faz o convite] para participação na actividade [nome da actividade], a realizar-se em [local], entre os dias [datas], venho, por este meio, solicitar a devida autorização para a representação institucional por parte de [participantes], bem como o processamento dos respetivos abonos de ajudas de custo, em conformidade com os regulamentos internos e a legislação aplicável.",
    textoCorpo2:
      "A presença no evento em resposta ao convite recebido assegura a devida representactividade institucional do Songo, promovendo a visibilidade académica e científica e o fortalecimento de redes de cooperação interinstitucional.",
    justificacao:
      "O atendimento ao convite formal reforça os laços de parceria e a imagem institucional junto de órgãos governamentais, parceiros e comunidade académica.",
    anexos: [
      "Convite Formal / Carta Convocatória da Instituição",
      "Programa da Actividade",
      "Credencial de Representação",
    ],
    isConvite: true,
  },
  SEMINARIO: {
    key: "SEMINARIO",
    label: "Um Seminário",
    icon: "🗣️",
    assunto:
      "Pedido de Autorização para Deslocação, Participação em Seminário e Pagamento de Ajudas de Custos.",
    textoCorpo1:
      "No âmbito do seminário e fórum técnico referente a [nome da actividade], a realizar-se em [local], entre os dias [datas], venho por este meio solicitar a devida autorização para a deslocação e participação de [participantes], bem como o pagamento dos respetivos abonos de ajudas de custos.",
    textoCorpo2:
      "A participação no referido seminário proporcionará o acesso às mais recentes discussões técnicas e académicas da área, favorecendo a atualização de conhecimentos e a disseminação de boas práticas na comunidade do Songo.",
    justificacao:
      "A participação ativa em seminários científicos e técnicos enriquece o corpo docente e técnico do Songo, impulsionando a produção e partilha do saber.",
    anexos: [
      "Programa / Brochura do Seminário",
      "Ficha de Inscrição / Confirmação",
      "Resumo das Comunicações",
    ],
    isConvite: false,
  },
  REUNIAO: {
    key: "REUNIAO",
    label: "Uma Reunião",
    icon: "🤝",
    assunto:
      "Pedido de Autorização para Deslocação para Participação em Reunião de Trabalho Oficial e Pagamento dos Respetivos Abonos.",
    textoCorpo1:
      "Com o objetivo de participar na reunião de trabalho convocada para [nome da actividade], a realizar-se em [local], entre os dias [datas], venho por este meio solicitar a devida autorização para a deslocação de [participantes], bem como o pagamento dos respetivos abonos de ajudas de custos.",
    textoCorpo2:
      "A presença nesta reunião de trabalho é indispensável para alinhamento de estratégias, tomada de decisões conjuntas e acompanhamento dos compromissos e convénios assumidos pelo Songo.",
    justificacao:
      "A representação na reunião presencial garante a defesa dos interesses do Songo e a harmonização dos procedimentos interinstitucionais.",
    anexos: [
      "Convocatória / Agenda da Reunião",
      "Minuta de Trabalhos",
      "Documentação de Apoio",
    ],
    isConvite: false,
  },
  VISITA_ESTUDO: {
    key: "VISITA_ESTUDO",
    label: "Visita de Estudo",
    icon: "🚌",
    assunto:
      "Pedido de Autorização para Deslocação em Visita de Estudo Académica e Pagamento de Ajudas de Custos.",
    textoCorpo1:
      "No âmbito do plano curricular e pedagógico referente à visita de estudo sobre [nome da actividade], a realizar-se em [local], entre os dias [datas], venho por este meio solicitar a devida autorização para a deslocação do grupo composto por [participantes], bem como o pagamento dos respetivos abonos de ajudas de custos, nos termos da regulamentação em vigor.",
    textoCorpo2:
      "A realização desta visita de estudo reveste-se de grande relevância académica e prática, permitindo a consolidação dos conhecimentos teóricos no terreno, a observação direta de processos operacionais e a articulação entre o ensino e a realidade profissional.",
    justificacao:
      "A visita de estudo é uma componente prática indispensável para o enriquecimento da formação académica e o estreitamento de relações com o meio produtivo.",
    anexos: [
      "Plano da Visita de Estudo",
      "Guia de Acompanhamento / Lista de Estudantes",
      "Autorização de Deslocação",
    ],
    isConvite: false,
  },
  VISITA_SUPERVISOR: {
    key: "VISITA_SUPERVISOR",
    label: "Visita a Supervisor",
    icon: "👨‍🏫",
    assunto:
      "Pedido de Autorização para Deslocação para Acompanhamento e Visita de Supervisão Pedagógica/Técnica e Pagamento dos Respetivos Abonos.",
    textoCorpo1:
      "Com o objetivo de realizar a visita de acompanhamento e supervisão referente a [nome da actividade], a realizar-se em [local], entre os dias [datas], venho por este meio solicitar a devida autorização para a deslocação de [participantes], bem como o pagamento dos respetivos abonos de ajudas de custos.",
    textoCorpo2:
      "A visita do supervisor é fundamental para garantir a monitorização no local, a avaliação do desempenho dos formandos/estudantes em estágio, o apoio metodológico e a garantia dos padrões de qualidade definidos pelo Songo.",
    justificacao:
      "A supervisão presencial assegura a orientação direta, a verificação do cumprimento das metas programáticas e o apoio técnico contínuo.",
    anexos: [
      "Plano de Supervisão",
      "Ficha de Acompanhamento no Terreno",
      "Credencial de Supervisor",
    ],
    isConvite: false,
  },
  OUTRO: {
    key: "OUTRO",
    label: "Geral / Personalizado",
    icon: "📝",
    assunto:
      "Pedido de Autorização para Deslocação e Pagamento de Abonos de Ajudas de Custos.",
    textoCorpo1:
      "No âmbito da actividade [nome da actividade], a realizar-se em [local], entre os dias [datas], venho por este meio solicitar a devida autorização para a deslocação de [participantes], bem como o pagamento dos respetivos abonos de ajudas de custos, conforme previsto nos regulamentos internos e legislação aplicável.",
    textoCorpo2:
      "A participação nesta actividade é de caráter essencial para assegurar representação oficial, execução de tarefas técnicas e acompanhamento institucional.",
    justificacao:
      "A presença do(s) colaborador(es) é indispensável para garantir a execução das responsabilidades atribuídas e assegurar os resultados esperados da actividade.",
    anexos: ["Documentos de suporte", "Regulamento aplicável"],
    isConvite: false,
  },
};

interface CustosLinha {
  id: string;
  nome: string;
  descricao: string;
  dias: string;
  valorDiario: string;
  valorTotal: string;
}

export const isParecerNegativo = (texto: string) => {
  if (!texto) return false;
  const t = texto.toLowerCase();
  return (
    t.includes("não") ||
    t.includes("sem") ||
    t.includes("desfavorá") ||
    t.includes("indeferid") ||
    t.includes("recusad") ||
    t.includes("cancelad") ||
    t.includes("devolvid")
  );
};

export const getParecerTextClass = (texto: string) => {
  if (isParecerNegativo(texto)) {
    return "text-red-700 font-extrabold";
  }
  return "text-blue-900 font-extrabold";
};

interface InformacaoPropostaProps {
  user: any;
  onCancel: () => void;
  initialData?: any;
}

type RoleAssinatura =
  | "diretorGeral"
  | "dicosafa"
  | "dpep"
  | "daf"
  | "transporte"
  | "secretaria"
  | "requerente"
  | null;

interface ModalDespachoAssinaturaProps {
  role: RoleAssinatura;
  onClose: () => void;
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  user: any;
}

function ModalDespachoAssinatura({
  role,
  onClose,
  formData,
  setFormData,
  user,
}: ModalDespachoAssinaturaProps) {
  if (!role) return null;

  const getRoleConfig = () => {
    switch (role) {
      case "diretorGeral":
        return {
          title: "Gabinete do Diretor-Geral",
          subtitle: "Despacho Final e Homologação de Despesas & Deslocações",
          nomeDefault: formData.nomeDiretorGeral || "Prof. António Cristo Pinto Madeira",
          cargoDefault: formData.cargoDiretorGeral || "Diretor-Geral",
          dataDefault: formData.dataDespachoDiretorGeral || formData.dataDocumento,
          textoCurrent: formData.despachoDiretorGeral,
          assinaturaCurrent: formData.assinaturaDiretorGeral,
          positivoLabel: "Homologar / Autorizar (Despacho Positivo)",
          positivoTexto: "Homologado e Autorizado nos termos propostos. Proceda-se em conformidade legal e orçamental.",
          negativoLabel: "Recusar / Indeferir (Despacho Negativo)",
          negativoTexto: "Não autorizado / Indeferido por razões de ordem orçamental e conveniência de serviço.",
        };
      case "dicosafa":
        return {
          title: "Gabinete do Diretor da DICOSAFA",
          subtitle: "Parecer Técnico e Homologação Sectorial",
          nomeDefault: formData.nomeDiretorDicosafa || "Dr. Jaime Langa",
          cargoDefault: formData.cargoDiretorDicosafa || "Director da DICOSAFA",
          dataDefault: formData.dataDespachoDicosafa || formData.dataDocumento,
          textoCurrent: formData.despachoDicosafa,
          assinaturaCurrent: formData.assinaturaDiretorDicosafa,
          positivoLabel: "Parecer Favorável / Homologar",
          positivoTexto: "Favorável. Submeto à consideração de Sua Excia o Senhor Diretor-Geral para a devida autorização dos abonos e deslocação correspondentes.",
          negativoLabel: "Parecer Desfavorável / Recusado",
          negativoTexto: "Não favorável face à indisponibilidade de quota orçamental no presente trimestre.",
        };
      case "dpep":
        return {
          title: "Departamento de Planificação, Estudos e Projectos (DPEP)",
          subtitle: "Parecer Técnico e Alinhamento com o Plano de Actividades",
          nomeDefault: formData.nomeChefeDpep || "Chefe do DPEP",
          cargoDefault: formData.cargoChefeDpep || "Chefe do DPEP",
          dataDefault: formData.dataParecerDpep || formData.dataDocumento,
          textoCurrent: formData.parecerDpep,
          assinaturaCurrent: formData.assinaturaChefeDpep,
          positivoLabel: "Planificada",
          positivoTexto: `Favorável. Trata-se de uma actividade planificada, ref. ${formData.codigoActividade || "[código da actividade]"}, programada para o mês de [mês de realização].`,
          negativoLabel: "Não Planificada",
          negativoTexto: "Atenção: A execução desta actividade não está planificada no exercício corrente.",
        };
      case "daf":
        return {
          title: "Departamento de Apoio Financeiro (DAF)",
          subtitle: "Verificação de Cabimento Orçamental e Cobertura Financeira",
          nomeDefault: formData.nomeChefeDaf || "Dr. Benjamim Macuácua",
          cargoDefault: formData.cargoChefeDaf || "Chefe do DAF",
          dataDefault: formData.dataParecerDaf || formData.dataDocumento,
          textoCurrent: formData.parecerDaf,
          assinaturaCurrent: formData.assinaturaChefeDaf,
          positivoLabel: "Com Cabimento Orçamental",
          positivoTexto: "Favorável. Existe cabimento orçamental na rubrica correspondente para a cobertura das despesas da deslocação.",
          negativoLabel: "Sem Cabimento Orçamental",
          negativoTexto: "Sem disponibilidade financeira / cabimento orçamental na rubrica correspondente.",
        };
      case "transporte":
        return {
          title: "Repartição de Transporte",
          subtitle: "Alocação e Confirmação de Meios de Transporte",
          nomeDefault: formData.nomeChefeTransporte || "Eng. Mário Mabunda",
          cargoDefault: formData.cargoChefeTransporte || "Chefe de Transporte",
          dataDefault: formData.dataParecerTransporte || formData.dataDocumento,
          textoCurrent: formData.parecerTransporte,
          assinaturaCurrent: formData.assinaturaChefeTransporte,
          positivoLabel: "Meio de Transporte Disponível",
          positivoTexto: "Confirmada a disponibilidade de meio de transporte colectivo / viatura para o cumprimento do plano de viagem.",
          negativoLabel: "Meio Indisponível",
          negativoTexto: "Sem viatura institucional ou meio de transporte disponível no período solicitado.",
        };
      case "secretaria":
        return {
          title: "Secretaria Geral",
          subtitle: "Registo de Entrada e Tramitação no Expediente",
          nomeDefault: formData.nomeSecretariaGeral || "Secretaria Geral",
          cargoDefault: formData.cargoSecretariaGeral || "Secretaria Geral",
          dataDefault: formData.dataParecerSecretariaGeral || formData.dataDocumento,
          textoCurrent: formData.parecerSecretariaGeral || "Visto / Registo de entrada no expediente.",
          assinaturaCurrent: formData.assinaturaSecretariaGeral,
          positivoLabel: "Visto & Registado no Expediente",
          positivoTexto: `Visto / Registo de entrada no expediente sob o Nº ${formData.numeroProposta || ""}.`,
          negativoLabel: "Devolvido à Proveniência",
          negativoTexto: "Devolvido para correções por falta de elementos de instrução obrigatórios.",
        };
      case "requerente":
        return {
          title: "Chefe Máximo do Departamento Requerente",
          subtitle: "Submissão e Assinatura da Proposta de Deslocação",
          nomeDefault: formData.nomeRequerente || "NOME DO CHEFE MÁXIMO DO DEPARTAMENTO",
          cargoDefault: formData.cargoRequerente || "Chefe do Departamento",
          dataDefault: formData.dataDocumento,
          textoCurrent: "Proposta submetida para apreciação.",
          assinaturaCurrent: formData.assinaturaRequerente,
          positivoLabel: "Submeter / Assinar Proposta",
          positivoTexto: "Proposta de deslocação em missão de serviço devidamente fundamentada e submetida.",
          negativoLabel: "Proposta Cancelada",
          negativoTexto: "Proposta de deslocação cancelada pelo departamento requerente.",
        };
    }
  };

  const config = getRoleConfig();

  const [tipoDespacho, setTipoDespacho] = useState<"positivo" | "negativo" | "custom">("positivo");
  const [texto, setTexto] = useState(config.textoCurrent || config.positivoTexto);
  const [nome, setNome] = useState(config.nomeDefault);
  const [cargo, setCargo] = useState(config.cargoDefault);
  const [data, setData] = useState(config.dataDefault);
  const [assinatura, setAssinatura] = useState(config.assinaturaCurrent);

  const handleSelectTipo = (tipo: "positivo" | "negativo" | "custom") => {
    setTipoDespacho(tipo);
    if (tipo === "positivo") {
      setTexto(config.positivoTexto);
    } else if (tipo === "negativo") {
      setTexto(config.negativoTexto);
    }
  };

  const handleConfirm = () => {
    switch (role) {
      case "diretorGeral":
        setFormData((prev: any) => ({
          ...prev,
          despachoDiretorGeral: texto,
          nomeDiretorGeral: nome,
          cargoDiretorGeral: cargo,
          dataDespachoDiretorGeral: data,
          assinaturaDiretorGeral: assinatura,
        }));
        break;
      case "dicosafa":
        setFormData((prev: any) => ({
          ...prev,
          despachoDicosafa: texto,
          nomeDiretorDicosafa: nome,
          cargoDiretorDicosafa: cargo,
          dataDespachoDicosafa: data,
          assinaturaDiretorDicosafa: assinatura,
        }));
        break;
      case "dpep":
        setFormData((prev: any) => ({
          ...prev,
          parecerDpep: texto,
          nomeChefeDpep: nome,
          cargoChefeDpep: cargo,
          dataParecerDpep: data,
          assinaturaChefeDpep: assinatura,
        }));
        break;
      case "daf":
        setFormData((prev: any) => ({
          ...prev,
          parecerDaf: texto,
          nomeChefeDaf: nome,
          cargoChefeDaf: cargo,
          dataParecerDaf: data,
          assinaturaChefeDaf: assinatura,
        }));
        break;
      case "transporte":
        setFormData((prev: any) => ({
          ...prev,
          parecerTransporte: texto,
          nomeChefeTransporte: nome,
          cargoChefeTransporte: cargo,
          dataParecerTransporte: data,
          assinaturaChefeTransporte: assinatura,
        }));
        break;
      case "secretaria":
        setFormData((prev: any) => ({
          ...prev,
          parecerSecretariaGeral: texto,
          nomeSecretariaGeral: nome,
          cargoSecretariaGeral: cargo,
          dataParecerSecretariaGeral: data,
          assinaturaSecretariaGeral: assinatura,
        }));
        break;
      case "requerente":
        setFormData((prev: any) => ({
          ...prev,
          nomeRequerente: nome,
          cargoRequerente: cargo,
          dataDocumento: data,
          assinaturaRequerente: assinatura,
        }));
        break;
    }
    onClose();
  };

  return (
      <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md flex items-center justify-center z-50 p-4 print:hidden animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full border-2 border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 bg-slate-900 text-white flex justify-between items-center border-b border-slate-800">
          <div>
            <span className="text-[10px] font-black  tracking-widest text-blue-400 block">
              Módulo de Assinatura & Despacho Oficial
            </span>
            <h3 className="text-lg font-black">{config.title}</h3>
            <p className="text-xs text-slate-300 font-medium">{config.subtitle}</p>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Seletor de Tipo de Despacho (Positivo vs Negativo vs Personalizado) */}
          {role !== "requerente" && (
            <div>
              <label className="block text-[10px] font-black text-slate-700  tracking-wider mb-2">
                1. Escolha o Tipo de Despacho / Parecer:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => handleSelectTipo("positivo")}
                  className={`p-3 rounded-2xl border-2 text-left flex items-start gap-2.5 transition-all ${
                    tipoDespacho === "positivo"
                      ? "border-emerald-600 bg-emerald-50/80 text-emerald-950 ring-2 ring-emerald-500/20"
                      : "border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-slate-700"
                  }`}
                >
                  <CheckCircle2 className={`w-5 h-5 mt-0.5 shrink-0 ${tipoDespacho === "positivo" ? "text-emerald-600" : "text-slate-400"}`} />
                  <div>
                    <p className="text-xs font-black">Despacho Positivo</p>
                    <p className="text-[10px] opacity-80 leading-tight mt-0.5">Favorável / Autorizado / Homologado</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectTipo("negativo")}
                  className={`p-3 rounded-2xl border-2 text-left flex items-start gap-2.5 transition-all ${
                    tipoDespacho === "negativo"
                      ? "border-red-600 bg-red-50/80 text-red-950 ring-2 ring-red-500/20"
                      : "border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-slate-700"
                  }`}
                >
                  <XCircle className={`w-5 h-5 mt-0.5 shrink-0 ${tipoDespacho === "negativo" ? "text-red-600" : "text-slate-400"}`} />
                  <div>
                    <p className="text-xs font-black">Despacho Negativo</p>
                    <p className="text-[10px] opacity-80 leading-tight mt-0.5">Indeferido / Recusado / Indisponível</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectTipo("custom")}
                  className={`p-3 rounded-2xl border-2 text-left flex items-start gap-2.5 transition-all ${
                    tipoDespacho === "custom"
                      ? "border-blue-600 bg-blue-50/80 text-blue-950 ring-2 ring-blue-500/20"
                      : "border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-slate-700"
                  }`}
                >
                  <FileText className={`w-5 h-5 mt-0.5 shrink-0 ${tipoDespacho === "custom" ? "text-blue-600" : "text-slate-400"}`} />
                  <div>
                    <p className="text-xs font-black">Personalizado</p>
                    <p className="text-[10px] opacity-80 leading-tight mt-0.5">Redigir texto livre do parecer</p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Campo de Texto do Despacho */}
          {role !== "requerente" && (
            <div>
              <label className="block text-[10px] font-black text-slate-700  tracking-wider mb-1">
                2. Texto do Despacho / Parecer Oficial:
              </label>
              <textarea
                rows={3}
                value={texto}
                onChange={(e) => {
                  setTexto(e.target.value);
                  setTipoDespacho("custom");
                }}
                className={`w-full p-3 bg-white border-2 border-slate-300 rounded-xl text-xs outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 shadow-sm ${getParecerTextClass(texto)}`}
              />
            </div>
          )}

          {/* Dados do Signatário */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-black text-slate-700  mb-1">
                Nome do Responsável:
              </label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full p-2.5 bg-white border-2 border-slate-300 rounded-xl text-xs text-slate-900 font-black outline-none focus:border-blue-600 shadow-sm"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-700  mb-1">
                Cargo / Função:
              </label>
              <input
                type="text"
                value={cargo}
                onChange={(e) => setCargo(e.target.value)}
                className="w-full p-2.5 bg-white border-2 border-slate-300 rounded-xl text-xs text-slate-900 font-bold outline-none focus:border-blue-600 shadow-sm"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-700  mb-1">
                Data do Despacho:
              </label>
              <input
                type="text"
                value={data}
                onChange={(e) => setData(e.target.value)}
                className="w-full p-2.5 bg-white border-2 border-slate-300 rounded-xl text-xs text-slate-900 font-bold outline-none focus:border-blue-600 shadow-sm"
              />
            </div>
          </div>

          {/* Assinatura Digital */}
          <div>
            <label className="block text-[10px] font-black text-slate-700  mb-2 text-center">
              Assinatura Digital (Ficheiro / Carregada):
            </label>
            <div className="max-w-md mx-auto">
              <SignatureUpload
                label=""
                value={assinatura}
                onChange={(val) => setAssinatura(val)}
                user={user}
              />
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex justify-between items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 bg-white hover:bg-slate-200 border border-slate-300 text-slate-700 font-bold text-xs rounded-xl transition-all"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            <span>Confirmar Assinatura & Despacho</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function InformacaoPropostaForm({
  user,
  onCancel,
  initialData,
}: InformacaoPropostaProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Obter data atual para preenchimento automático
  const hoje = new Date();
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

  const formattedDate = `${hoje.getDate()} de ${meses[hoje.getMonth()]} de ${hoje.getFullYear()}`;
  const anoAtual = hoje.getFullYear().toString();

  // Estado do formulário
  const [modalRole, setModalRole] = useState<RoleAssinatura>(null);
  const [isConvite, setIsConvite] = useState<boolean>(false);
  const [anexoFile, setAnexoFile] = useState<{ name: string; url: string } | null>(null);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<CategoriaAssunto>("CAPACITACAO");
  
  const [showSignerModal, setShowSignerModal] = useState(false);
  const [availableSigners, setAvailableSigners] = useState<Colaborador[]>([]);
  const [selectedSigner, setSelectedSigner] = useState<Colaborador | null>(null);
  const [isSearchingSigners, setIsSearchingSigners] = useState(false);
  const [submittedInfo, setSubmittedInfo] = useState<{
    codigo: string;
    origem: string;
    origemSetor: string;
    destinoNome: string;
    destinoCargo: string;
    destinoSetor: string;
    etapaAtualNome: string;
    etapaIndex: number;
    assunto: string;
    workflowSteps: string[];
  } | null>(null);

  // Determinar dinamicamente a sigla e o departamento a partir do utilizador logado
  const userDeptoRaw =
    user?.departamento ||
    user?.direcao ||
    user?.setor ||
    user?.sector ||
    user?.reparticao ||
    user?.unidade ||
    user?.siglaUnidade ||
    user?.userArea?.departamento ||
    user?.userArea?.direcao ||
    "";

  const getSiglaAndDeptoFromUser = () => {
    const raw = String(userDeptoRaw || "").trim();
    const low = raw.toLowerCase();

    if (low.includes("daf") || low.includes("financeir") || low.includes("administração e finanças") || low.includes("administracao e financas")) {
      return {
        sigla: "DAF",
        departamento: "DEPARTAMENTO DE ADMINISTRAÇÃO E FINANÇAS (DAF)"
      };
    }
    if (low.includes("dicosafa") || low.includes("corpos sociais")) {
      return {
        sigla: "DICOSAFA",
        departamento: "DIREÇÃO DOS CORPOS SOCIAIS E APOIO FACULTATIVO (DICOSAFA)"
      };
    }
    if (low.includes("recursos humanos") || low.includes("drh") || low.includes("pessoal")) {
      return {
        sigla: "DRH",
        departamento: "DEPARTAMENTO DE RECURSOS HUMANOS (DRH)"
      };
    }
    if (low.includes("registo acad") || low.includes("dra") || low.includes("académico") || low.includes("academico")) {
      return {
        sigla: "DRA",
        departamento: "DEPARTAMENTO DE REGISTO ACADÉMICO (DRA)"
      };
    }
    if (low.includes("engenharia") || low.includes("estg") || low.includes("tecnologia e gestão")) {
      return {
        sigla: "ESTG",
        departamento: "ESCOLA SUPERIOR DE TECNOLOGIA E GESTÃO (ESTG)"
      };
    }
    if (low.includes("produção aliment") || low.includes("producao aliment")) {
      return {
        sigla: "DPA",
        departamento: "DEPARTAMENTO DE PRODUÇÃO ALIMENTAR (DPA)"
      };
    }
    if (low.includes("secretaria geral") || low === "sg") {
      return {
        sigla: "SG",
        departamento: "SECRETARIA GERAL (SG)"
      };
    }
    if (low.includes("secretaria executiva") || low.includes("gabinete") || low === "gdg") {
      return {
        sigla: "GDG",
        departamento: "GABINETE DO DIRETOR-GERAL / SECRETARIA EXECUTIVA (GDG)"
      };
    }
    if (low.includes("dpep") || low.includes("planifica")) {
      return {
        sigla: "DPEP",
        departamento: "DEPARTAMENTO DE PLANIFICAÇÃO, ESTUDOS E PROJETOS (DPEP)"
      };
    }

    if (user?.siglaUnidade) {
      return {
        sigla: String(user.siglaUnidade).toUpperCase(),
        departamento: raw ? `${raw.toUpperCase()} (${String(user.siglaUnidade).toUpperCase()})` : "DEPARTAMENTO DE PLANIFICAÇÃO, ESTUDOS E PROJETOS (DPEP)"
      };
    }

    if (raw) {
      const siglaCalc = raw.split(" ").filter((w: string) => w.length > 2 && !["dos","das","de","do","da","e"].includes(w.toLowerCase())).map((w: string) => w[0]).join("").toUpperCase() || "DEP";
      return {
        sigla: siglaCalc.slice(0, 8),
        departamento: `${raw.toUpperCase()} (${siglaCalc.slice(0, 8)})`
      };
    }

    return {
      sigla: "DPEP",
      departamento: "DEPARTAMENTO DE PLANIFICAÇÃO, ESTUDOS E PROJETOS (DPEP)"
    };
  };

  const deptoInicial = getSiglaAndDeptoFromUser();

  const [formData, setFormData] = useState({
    numeroProposta: "01",
    siglaUnidade: deptoInicial.sigla,
    codigoNumero: "25.5",
    ano: anoAtual,
    departamento: deptoInicial.departamento,
    dataDocumento: formattedDate,
    autoridadeDestino: "Exmo. Senhor Diretor-Geral",
    assunto: TEMPLATES_ASSUNTO.CAPACITACAO.assunto,
    nomeAutoridade: "Prof. António Cristo Pinto Madeira",
    tituloAutoridade: "Diretor-Geral",

    // Detalhes da deslocação
    codigoActividade: "",
    nomeActividade: "[nome da actividade]",
    nomeInstituicaoConvidante: "",
    convocatoria: "",
    localActividade: "[local]",
    datasActividade: "[datas]",
    dataPartida: "[data de partida]",
    dataRegresso: "[data de regresso]",
    participantes: "[nome(s)]",

    // Corpo do Texto
    textoCorpo1: TEMPLATES_ASSUNTO.CAPACITACAO.textoCorpo1,
    textoCorpo2: TEMPLATES_ASSUNTO.CAPACITACAO.textoCorpo2,

    // Página 2
    justificacao: TEMPLATES_ASSUNTO.CAPACITACAO.justificacao,
    anexos: TEMPLATES_ASSUNTO.CAPACITACAO.anexos,
    LocalDataRequerente: `Songo, ${formattedDate}`,
    nomeRequerente: "NOME DO CHEFE MÁXIMO DO DEPARTAMENTO",
    cargoRequerente: "Chefe do Departamento",
    setorRequerente: deptoInicial.sigla,
    assinaturaRequerente: "",
    notaViagem:
      "Nesta viagem o funcionário irá viajar de transporte colectivo.",

    // Despachos e Pareceres Oficiais (Inicialmente em branco para preenchimento durante a tramitação)
    despachoDicosafa: "",
    nomeDiretorDicosafa: "Dr. Jaime Langa",
    cargoDiretorDicosafa: "Director da DICOSAFA",
    assinaturaDiretorDicosafa: "",
    dataDespachoDicosafa: formattedDate,

    despachoDiretorGeral: "",
    nomeDiretorGeral: "Prof. António Cristo Pinto Madeira",
    cargoDiretorGeral: "Diretor-Geral",
    assinaturaDiretorGeral: "",
    dataDespachoDiretorGeral: formattedDate,

    // Parecer & Assinatura DAF (Departamento de Apoio Financeiro)
    parecerDaf: "",
    nomeChefeDaf: "Dr. Benjamim Macuácua",
    cargoChefeDaf: "Chefe do DAF",
    dataParecerDaf: formattedDate,
    assinaturaChefeDaf: "",

    // Parecer & Assinatura Transporte (Repartição de Transporte)
    parecerTransporte: "",
    nomeChefeTransporte: "Eng. Mário Mabunda",
    cargoChefeTransporte: "Chefe de Transporte",
    dataParecerTransporte: formattedDate,
    assinaturaChefeTransporte: "",

    // Visto & Secretaria Geral
    parecerSecretariaGeral: "",
    nomeSecretariaGeral: "Secretaria Geral",
    cargoSecretariaGeral: "Secretaria Geral",
    dataParecerSecretariaGeral: formattedDate,
    assinaturaSecretariaGeral: "",

    // Parecer & Assinatura DPEP (Planificação, Estudos e Projectos)
    parecerDpep: "",
    nomeChefeDpep: "Chefe do DPEP",
    cargoChefeDpep: "Chefe do DPEP",
    dataParecerDpep: formattedDate,
    assinaturaChefeDpep: "",
  });

  // Função inteligente para trocar a categoria e recarregar textos
  const aplicarCategoriaAssunto = (catKey: CategoriaAssunto) => {
    setCategoriaSelecionada(catKey);
    const tmpl = TEMPLATES_ASSUNTO[catKey];
    if (!tmpl) return;

    setFormData((prev) => ({
      ...prev,
      assunto: tmpl.assunto,
      textoCorpo1: tmpl.textoCorpo1,
      textoCorpo2: tmpl.textoCorpo2,
      justificacao: tmpl.justificacao,
      anexos: tmpl.anexos,
    }));
    setIsConvite(tmpl.isConvite);
  };

  // Verificar se o usuário atual tem permissão para assinar por um determinado papel
  const isUserAuthorizedForRole = (targetRole: RoleAssinatura): boolean => {
    if (!user) return false;
    const userCargo = String(user?.cargo || user?.role || user?.funcao || "").toLowerCase();
    const userDepto = String(userDeptoRaw || "").toLowerCase();

    // Requerente: Quem está criando ou é o dono do processo
    if (targetRole === "requerente") return true;

    // Se estiver apenas elaborando (novo documento), ninguém tem acesso aos pareceres
    if (!initialData) return false;

    // Regras de negócio para cada papel
    switch (targetRole) {
      case "diretorGeral":
        return userCargo.includes("diretor-geral") || userCargo.includes("diretor geral");
      case "dicosafa":
        return userCargo.includes("dicosafa");
      case "daf":
        return userCargo.includes("daf") || userDepto.includes("daf") || userCargo.includes("financeiro");
      case "transporte":
        return userCargo.includes("transporte") || userDepto.includes("transporte");
      case "dpep":
        return userCargo.includes("dpep") || userDepto.includes("planificação") || userDepto.includes("planificacao");
      case "secretaria":
        return userCargo.includes("secretaria") || userDepto.includes("secretaria");
      default:
        return false;
    }
  };

  // Linhas da tabela de custos (critérios predefinidos de acordo com o anexo)
  const [custos, setCustos] = useState<CustosLinha[]>([
    {
      id: "1",
      nome: "",
      descricao: "",
      dias: "0",
      valorDiario: "0",
      valorTotal: "0.00",
    },
    {
      id: "2",
      nome: "",
      descricao: "",
      dias: "0",
      valorDiario: "0",
      valorTotal: "0.00",
    },
  ]);

  // Carregar Efetivo Geral / Repartição de Pessoal
  const { colaboradores } = useEfetivoGeral();

  // Atualizar automaticamente os responsáveis com base no Efetivo Geral (Afetações / Cargos / Nomeações)
  useEffect(() => {
    if (!colaboradores || colaboradores.length === 0) return;

    const dg = buscarDiretorGeral(colaboradores);
    const dicosafa = buscarDirectorDicosafa(colaboradores);
    const chefeMaximo = buscarChefeMaximoDepartamento(colaboradores, formData.siglaUnidade, user);
    const chefeDpep = buscarChefeDPEP(colaboradores);
    const chefeDaf = buscarChefeDAF(colaboradores);
    const chefeTransp = buscarChefeTransporte(colaboradores);
    const chefeSecGeral = buscarChefeSecretariaGeral(colaboradores);

    setFormData((prev) => {
      // Preencher automaticamente quando vazio ou quando estiver com o placeholder default
      const precisaPreencherChefe =
        !prev.nomeRequerente ||
        prev.nomeRequerente.includes("NOME DO CHEFE") ||
        prev.nomeRequerente.includes("MAXIOMO") ||
        prev.nomeRequerente.includes("SETOR") ||
        prev.nomeRequerente.trim() === "";

      const novoNomeRequerente = chefeMaximo?.nome || (precisaPreencherChefe ? "NOME DO CHEFE MÁXIMO DO DEPARTAMENTO" : prev.nomeRequerente);
      const novoCargoRequerente = chefeMaximo?.cargoChefia || chefeMaximo?.cargo || prev.cargoRequerente || "Chefe do Departamento";

      return {
        ...prev,
        nomeAutoridade: dg?.nome || prev.nomeAutoridade,
        tituloAutoridade: dg?.cargo || prev.tituloAutoridade,
        nomeDiretorGeral: dg?.nome || prev.nomeDiretorGeral,
        cargoDiretorGeral: dg?.cargo || prev.cargoDiretorGeral,
        nomeDiretorDicosafa: dicosafa?.nome || prev.nomeDiretorDicosafa,
        cargoDiretorDicosafa: dicosafa?.cargo || prev.cargoDiretorDicosafa,
        nomeRequerente: novoNomeRequerente,
        cargoRequerente: novoCargoRequerente,
        nomeChefeDpep: chefeDpep?.nome || prev.nomeChefeDpep,
        nomeChefeDaf: chefeDaf?.nome || prev.nomeChefeDaf,
        nomeChefeTransporte: chefeTransp?.nome || prev.nomeChefeTransporte,
        nomeSecretariaGeral: chefeSecGeral?.nome || prev.nomeSecretariaGeral,
      };
    });
  }, [colaboradores, formData.siglaUnidade, user]);

  // Carregar número sequencial automático por setor/unidade (apenas se for novo documento)
  useEffect(() => {
    if (initialData) return;
    if (!formData.siglaUnidade) return;
    const fetchNextNumber = async () => {
      try {
        const key = `INFORMACAO-PROPOSTA-${formData.siglaUnidade.trim().toUpperCase()}`;
        const nextNum = await firestoreService.counters.getNextNumber(key);
        const formattedNum = nextNum.toString().padStart(2, "0");
        setFormData((prev) => ({
          ...prev,
          numeroProposta: formattedNum,
          codigoNumero: "25.5",
        }));
      } catch (err) {
        console.error("Erro ao buscar contador por setor:", err);
      }
    };
    fetchNextNumber();
  }, [formData.siglaUnidade, initialData]);

  // Zerar / Reiniciar o Numerador do Setor Ativo
  const handleZerarNumeradorSetor = async () => {
    if (!formData.siglaUnidade) return;
    const sigla = formData.siglaUnidade.trim().toUpperCase();
    const key = `INFORMACAO-PROPOSTA-${sigla}`;
    try {
      await firestoreService.counters.resetCounter(key, 1);
      setFormData((prev) => ({
        ...prev,
        numeroProposta: "01",
        codigoNumero: "25.5",
      }));
      alert(`O numerador do setor (${sigla}) foi zerado com sucesso! A nova Informação Proposta deste setor começará em "01".`);
    } catch (err) {
      console.error("Erro ao zerar numerador do setor:", err);
    }
  };

  // Forçar sincronização do Chefe Máximo do Departamento
  const handleSincronizarChefe = () => {
    if (!colaboradores || colaboradores.length === 0) return;
    const chefe = buscarChefeMaximoDepartamento(colaboradores, formData.siglaUnidade, user);
    if (chefe) {
      setFormData((prev) => ({
        ...prev,
        nomeRequerente: chefe.nome,
        cargoRequerente: chefe.cargoChefia || chefe.cargo || "Chefe do Departamento",
      }));
    }
  };

  // Carregar dados iniciais de documento já existente (ao abrir pelo workflow ou consulta)
  useEffect(() => {
    if (!initialData) return;
    const rawForm = initialData.formData || initialData;
    if (rawForm) {
      setFormData((prev) => ({
        ...prev,
        ...rawForm,
      }));
      if (rawForm.custos && Array.isArray(rawForm.custos)) {
        setCustos(rawForm.custos);
      }
      if (rawForm.anexoFile) {
        setAnexoFile(rawForm.anexoFile);
      }
      if (typeof rawForm.isConvite === "boolean") {
        setIsConvite(rawForm.isConvite);
      }
    }
  }, [initialData]);

  const handleAddCusto = () => {
    const nextId = (custos.length + 1).toString();
    setCustos((prev) => [
      ...prev,
      {
        id: nextId,
        nome: "",
        descricao: "",
        dias: "0",
        valorDiario: "0",
        valorTotal: "0.00",
      },
    ]);
  };

  const handleRemoveCusto = (id: string) => {
    if (custos.length <= 1) return;
    setCustos((prev) => prev.filter((c) => c.id !== id));
  };

  const handleCustoChange = (
    id: string,
    field: keyof CustosLinha,
    value: string,
  ) => {
    setCustos((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          // Lógica de valores padrão solicitada: 9000 para DG, 6000 para outros
          let novoValorDiario = c.valorDiario;
          if (field === "nome" && value.length > 3) {
            const valUpper = value.toUpperCase();
            if (valUpper.includes("DIRETOR GERAL") || valUpper.includes("DIRETOR-GERAL") || valUpper.includes("PROF. ANTONIO")) {
              novoValorDiario = "9000";
            } else {
              novoValorDiario = "6000";
            }
          }

          const updated = { 
            ...c, 
            [field]: value,
            valorDiario: field === "valorDiario" ? value : novoValorDiario 
          };
          
          if (field === "dias" || field === "valorDiario" || field === "nome") {
            const valorNum = parseFloat(updated.valorDiario) || 0;
            const cleanDias = (updated.dias || "").trim().replace(",", ".");

            if (valorNum <= 0) {
              updated.valorTotal = "0.00";
            } else if (
              cleanDias === "1/2" ||
              cleanDias === "1 / 2" ||
              cleanDias === "0.5"
            ) {
              // Viagem de ida e volta no mesmo dia (1/2) = 30% do valor diário
              updated.valorTotal = (valorNum * 0.3).toFixed(2);
            } else {
              const diasNum = parseFloat(cleanDias) || 0;
              if (diasNum <= 0) {
                updated.valorTotal = "0.00";
              } else {
                // Fórmula normal: (dias de trabalho * valor diário) + 30% do valor diário
                const base = diasNum * valorNum;
                const adicional30 = 0.3 * valorNum;
                updated.valorTotal = (base + adicional30).toFixed(2);
              }
            }
          }
          return updated;
        }
        return c;
      }),
    );
  };

  // Calcular o total geral real
  const totalGeral = custos.reduce(
    (acc, c) => acc + (parseFloat(c.valorTotal) || 0),
    0,
  );

  const handleSendClick = async () => {
    const userCargo = (user?.cargo || user?.role || user?.funcao || "").toLowerCase();
    const isUserChefe = 
      userCargo.includes("chefe") || 
      userCargo.includes("diretor") || 
      userCargo.includes("director") || 
      userCargo.includes("responsável") || 
      userCargo.includes("adjunto");

    if (isUserChefe && !formData.assinaturaRequerente) {
      alert("Sendo o próprio Chefe do Setor a produzir o documento, é obrigatório assiná-lo digitalmente antes de enviar. O documento não pode sair do setor sem a assinatura do Chefe.");
      return;
    }

    setIsSearchingSigners(true);
    setShowSignerModal(true);
    
    try {
      const allColaboradores = await buscarColaboradoresEfetivo();
      let filtered: Colaborador[] = [];
      
      if (isUserChefe) {
        // Se o usuário logado é chefe, o documento vai direto para a Secretaria Geral
        const chefeSG = buscarChefeSecretariaGeral(allColaboradores);
        if (chefeSG) {
          filtered = [chefeSG];
        } else {
          filtered = allColaboradores.filter(c => 
            (c.departamento || "").toLowerCase().includes("secretaria geral") &&
            ((c.cargo || "").toLowerCase().includes("chefe") || (c.cargo || "").toLowerCase().includes("director"))
          );
        }
      } else {
        // No início (primeiro envio), procuramos o Chefe Máximo do Departamento/Unidade do requerente
        const sigla = formData.siglaUnidade || "DPEP";
        const chefeSetor = buscarChefeMaximoDepartamento(allColaboradores, sigla, user);
        
        if (chefeSetor) {
          filtered = [chefeSetor];
        } else {
          // Se não encontrar por sigla específica, mostra todos os que têm cargo de chefia como fallback
          filtered = allColaboradores.filter(c => 
            (c.cargo || "").toLowerCase().includes("chefe") || 
            (c.cargo || "").toLowerCase().includes("director") ||
            (c.cargo || "").toLowerCase().includes("diretor")
          ).slice(0, 10);
        }
      }
      
      setAvailableSigners(filtered);
      if (filtered.length === 1) {
        setSelectedSigner(filtered[0]);
      }
    } catch (err) {
      console.error("Erro ao buscar assinantes:", err);
    } finally {
      setIsSearchingSigners(false);
    }
  };

  const handleFinalSubmit = async (signerOverride?: Colaborador) => {
    const activeSigner = signerOverride || selectedSigner;
    if (!activeSigner) {
      alert("Por favor, selecione o responsável para quem deseja enviar o documento.");
      return;
    }
    
    await handleSave(undefined, activeSigner);
    setShowSignerModal(false);
  };

  const handleSave = async (e?: React.FormEvent, targetSignerOverride?: Colaborador) => {
    if (e) e.preventDefault();
    if (isConvite && !anexoFile) {
      alert("Trata-se de um convite. É obrigatório anexar o convite/documento correspondente!");
      return;
    }
    setIsSubmitting(true);
    try {
      const activeSigner = targetSignerOverride || selectedSigner;
      const docCode = `Informação Proposta Nº ${formData.numeroProposta}/Songo/GDG/${formData.siglaUnidade}/${formData.codigoNumero}/${formData.ano}`;
      
      const payload = {
        codigo: docCode,
        tipo: "Informação Proposta",
        formData: {
          ...formData,
          custos: custos,
          totalGeral: totalGeral,
          anexoFile: anexoFile,
          isConvite: isConvite,
        },
        dataEmissao: formData.dataDocumento,
      };

      const userCargo = (user?.cargo || user?.role || user?.funcao || "").toLowerCase();
      const isUserChefe = 
        userCargo.includes("chefe") || 
        userCargo.includes("diretor") || 
        userCargo.includes("director") || 
        userCargo.includes("responsável") || 
        userCargo.includes("adjunto");

      const statusInicial = isUserChefe ? "Aguardando Secretaria Geral" : "Aguardando Assinatura (Chefe do Departamento)";
      const currentStep = isUserChefe ? "Secretaria Geral" : "Chefe do Departamento";
      const etapaAtual = isUserChefe ? 1 : 0;

      const proximasEtapas = [
        "Elaboração do Documento",
        "Chefe do Departamento",
        "Secretaria Geral",
        "DPEP",
        "DAF",
        "Repartição de Transporte",
        "DICOSAFA",
        "Direção Geral",
      ];

      if (initialData?.id) {
        await firestoreService.requisicoes_internas.update(initialData.id, payload);
      } else {
        await firestoreService.requisicoes_internas.add({
          ...payload,
          emitidoPor: user?.displayName || user?.name || "Administrador",
          status: statusInicial,
          currentStep: currentStep,
          nextStepRecipient: activeSigner?.nome || "",
          nextStepRecipientId: activeSigner?.id || "",
          nextStepRecipientCargo: activeSigner?.cargo || "",
          workflowSteps: proximasEtapas,
          assinaturaChefe: isUserChefe ? formData.assinaturaRequerente : "",
          assinaturaRequerente: formData.assinaturaRequerente,
          createdAt: new Date().toISOString(),
          etapaAtual: etapaAtual,
        });

        // Também registrar no banco de Expedientes para visibilidade no Fluxo de Tramitação Geral
        await firestoreService.expedientes.add({
          numero: docCode,
          tipo: "Informação Proposta",
          assunto: formData.assunto || `Informação Proposta - ${formData.nomeActividade}`,
          origem: formData.siglaUnidade || user?.departamento || "DPEP",
          origemNome: user?.displayName || user?.name || formData.nomeRequerente,
          destino: activeSigner?.nome 
            ? `${activeSigner.nome} (${isUserChefe ? "Secretaria Geral - Protocolo Central" : "Chefia do Departamento " + formData.siglaUnidade})`
            : (isUserChefe ? "Secretaria Geral (Protocolo Central)" : `Chefia do Departamento (${formData.siglaUnidade})`),
          destinatario: activeSigner?.nome || (isUserChefe ? "Secretaria Geral" : "Chefe do Departamento"),
          dataEntrada: formData.dataDocumento || new Date().toISOString().split("T")[0],
          status: "Em Tramitação",
          etapaAtual: etapaAtual,
          currentStep: currentStep,
          nextStepRecipient: activeSigner?.nome || "",
          nextStepRecipientId: activeSigner?.id || "",
          nextStepRecipientCargo: activeSigner?.cargo || "",
          workflowSteps: proximasEtapas,
          criadoPor: user?.id || user?.uid || "admin",
          criadoPorNome: user?.displayName || user?.name || formData.nomeRequerente,
          criadoEm: new Date().toISOString(),
          formData: {
            ...formData,
            custos: custos,
            totalGeral: totalGeral,
            anexoFile: anexoFile,
            isConvite: isConvite,
          },
          historico: [
            {
              data: new Date().toISOString(),
              autor: user?.displayName || user?.name || formData.nomeRequerente,
              cargo: user?.cargo || formData.cargoRequerente,
              acao: isUserChefe ? "Elaboração e Assinatura pelo Chefe do Setor" : "Submissão de Informação Proposta pelo Técnico",
              detalhes: `Documento submetido para tramitação institucional e encaminhado para: ${activeSigner?.nome || currentStep}`,
              destino: activeSigner?.nome || currentStep,
            },
          ],
        });
      }

      setSubmittedInfo({
        codigo: docCode,
        origem: `${formData.siglaUnidade || "DPEP"} — ${user?.displayName || user?.name || formData.nomeRequerente}`,
        origemSetor: formData.siglaUnidade || "DPEP",
        destinoNome: activeSigner?.nome || (isUserChefe ? "Secretaria Geral (Protocolo Central)" : "Chefe do Departamento"),
        destinoCargo: activeSigner?.cargo || (isUserChefe ? "Chefe da Secretaria Geral" : `Chefe do Departamento ${formData.siglaUnidade}`),
        destinoSetor: activeSigner?.departamento || (isUserChefe ? "Secretaria Geral" : formData.siglaUnidade || "DPEP"),
        etapaAtualNome: isUserChefe ? "Secretaria Geral (Protocolo & Registo de Entrada)" : `Chefia do Departamento (${formData.siglaUnidade}) - Parecer & Assinatura`,
        etapaIndex: isUserChefe ? 2 : 1,
        assunto: formData.assunto,
        workflowSteps: proximasEtapas,
      });

      setIsSubmitted(true);
    } catch (err) {
      console.error(err);
      alert("Erro ao registar o documento no sistema.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Construir textos dinâmicos reais baseados nos inputs do utilizador
  const obterTextoCorpo1Real = () => {
    let texto = formData.textoCorpo1 || "";

    const nomeAct = formData.nomeActividade.trim() || "[nome da actividade]";
    const localAct = formData.localActividade.trim() || "[local]";
    const datasAct = formData.datasActividade.trim() || "[datas]";
    const partAct = formData.participantes.trim() || "[nome(s)]";
    const instConvidante = formData.nomeInstituicaoConvidante.trim() || "[nome da instituição que faz o convite]";

    texto = texto
      .replace(/\[nome da actividade\]/gi, nomeAct)
      .replace(/\[local\]/gi, localAct)
      .replace(/\[datas\]/gi, datasAct)
      .replace(/\[nome do colaborador\/equipa\]/gi, partAct)
      .replace(/\[participantes\]/gi, partAct)
      .replace(/\[nome\(s\)\]/gi, partAct)
      .replace(/\[nome da instituição que faz o convite\]/gi, instConvidante);

    return texto;
  };

  return (
    <FormLayout
      hidePrintHeader={true}
      title="Informação Proposta"
      subtitle="Gabinete do Diretor-Geral - MIP-04/IP"
      icon={FileText}
      bannerColor="bg-blue-900"
      iconColor="text-white"
      trackingCode={`Nº ${formData.numeroProposta}/${formData.siglaUnidade}`}
      onCancel={onCancel}
      onSubmit={(e) => {
        e.preventDefault();
        handleSendClick();
      }}
      isSubmitting={isSubmitting}
      isSubmitted={isSubmitted}
      successTitle="Documento Registado e Enviado para Tramitação!"
      successMessage={
        <div className="space-y-6 pt-2 text-left">
          {/* Card Principal de Destino */}
          <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
                  <Send size={18} />
                </div>
                <div>
                  <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest block">
                    Documento em Tramitação
                  </span>
                  <span className="text-xs font-bold text-slate-300">
                    {submittedInfo?.codigo || `Nº ${formData.numeroProposta}/${formData.siglaUnidade}`}
                  </span>
                </div>
              </div>
              <span className="px-2.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-[9px] font-black uppercase tracking-wider">
                Aguardando Trâmite
              </span>
            </div>

            {/* Origem e Destino com Destaque */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/60">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1 flex items-center gap-1">
                  <Building2 size={12} className="text-blue-400" />
                  Origem do Documento
                </span>
                <p className="text-xs font-black text-white">{submittedInfo?.origem || formData.siglaUnidade}</p>
                <p className="text-[10px] text-slate-300 mt-0.5">{formData.departamento}</p>
              </div>

              <div className="bg-emerald-950/40 p-3.5 rounded-xl border border-emerald-500/30">
                <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider block mb-1 flex items-center gap-1">
                  <UserCheck size={12} className="text-emerald-400" />
                  Destino do Documento (Para onde vai)
                </span>
                <p className="text-xs font-black text-emerald-200">{submittedInfo?.destinoNome || "Chefia / Secretaria Geral"}</p>
                <p className="text-[10px] text-emerald-300/80 mt-0.5">{submittedInfo?.destinoCargo}</p>
                <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded text-[9px] font-bold">
                  <ArrowRight size={10} />
                  <span>{submittedInfo?.etapaAtualNome}</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/40 text-[11px] text-slate-300">
              <span className="font-bold text-slate-200">Assunto: </span>
              {formData.assunto}
            </div>
          </div>

          {/* Fluxograma Sequencial Visual da Tramitação */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Layers size={14} className="text-blue-800" />
                Fluxo Sequencial de Tramitação do Documento
              </h4>
              <span className="text-[10px] font-bold text-slate-500">8 Etapas Oficiais</span>
            </div>

            <div className="space-y-2">
              {[
                {
                  id: 1,
                  titulo: "1. Elaboração do Documento",
                  responsavel: `${formData.nomeRequerente || user?.name || "Técnico do Setor"} (${formData.siglaUnidade})`,
                  status: "concluido",
                  desc: "Documento elaborado com áreas de pareceres e despachos em branco.",
                },
                {
                  id: 2,
                  titulo: "2. Validação & Assinatura da Chefia",
                  responsavel: `${submittedInfo?.destinoNome || "Chefe do Departamento"} (${formData.siglaUnidade})`,
                  status: submittedInfo?.etapaIndex === 1 ? "atual" : "concluido",
                  desc: "Apreciação, visto e assinatura pelo Chefe Máximo do Departamento.",
                },
                {
                  id: 3,
                  titulo: "3. Secretaria Geral (Protocolo Central)",
                  responsavel: "Chefe da Secretaria Geral / Protocolo",
                  status: submittedInfo?.etapaIndex === 2 ? "atual" : (submittedInfo?.etapaIndex ?? 0) > 2 ? "concluido" : "proximo",
                  desc: "Registo de entrada no expediente geral e encaminhamento aos setores.",
                },
                {
                  id: 4,
                  titulo: "4. Parecer do DPEP",
                  responsavel: "Chefe do Departamento de Planificação (DPEP)",
                  status: submittedInfo?.etapaIndex === 3 ? "atual" : (submittedInfo?.etapaIndex ?? 0) > 3 ? "concluido" : "proximo",
                  desc: "Parecer sobre o alinhamento com o Plano de Actividades anual.",
                },
                {
                  id: 5,
                  titulo: "5. Parecer do DAF (Apoio Financeiro)",
                  responsavel: "Chefe do DAF",
                  status: submittedInfo?.etapaIndex === 4 ? "atual" : (submittedInfo?.etapaIndex ?? 0) > 4 ? "concluido" : "proximo",
                  desc: "Verificação de cabimento orçamental e cobertura de custos.",
                },
                {
                  id: 6,
                  titulo: "6. Repartição de Transporte",
                  responsavel: "Chefe de Transporte",
                  status: submittedInfo?.etapaIndex === 5 ? "atual" : (submittedInfo?.etapaIndex ?? 0) > 5 ? "concluido" : "proximo",
                  desc: "Confirmação e disponibilização de viatura ou meio de viagem.",
                },
                {
                  id: 7,
                  titulo: "7. Parecer Técnico & Homologação DICOSAFA",
                  responsavel: "Director da DICOSAFA",
                  status: submittedInfo?.etapaIndex === 6 ? "atual" : (submittedInfo?.etapaIndex ?? 0) > 6 ? "concluido" : "proximo",
                  desc: "Parecer técnico setorial e submissão à Direção Geral.",
                },
                {
                  id: 8,
                  titulo: "8. Despacho Final & Homologação",
                  responsavel: "Gabinete do Diretor-Geral",
                  status: submittedInfo?.etapaIndex === 7 ? "atual" : "proximo",
                  desc: "Autorização final e despacho executivo do Senhor Diretor-Geral.",
                },
              ].map((etapa) => {
                const isConcluido = etapa.status === "concluido";
                const isAtual = etapa.status === "atual";

                return (
                  <div
                    key={etapa.id}
                    className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${
                      isAtual
                        ? "bg-emerald-50/80 border-emerald-400 shadow-sm"
                        : isConcluido
                        ? "bg-slate-100/70 border-slate-300 opacity-90"
                        : "bg-white border-slate-200 opacity-60"
                    }`}
                  >
                    <div className="mt-0.5 flex-shrink-0">
                      {isConcluido ? (
                        <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                          <Check size={14} />
                        </div>
                      ) : isAtual ? (
                        <div className="w-6 h-6 rounded-full bg-amber-500 text-slate-900 flex items-center justify-center font-black text-xs animate-pulse">
                          <Clock size={14} />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-xs">
                          {etapa.id}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between flex-wrap gap-1">
                        <span className={`text-xs font-black ${isAtual ? "text-emerald-950" : isConcluido ? "text-slate-800" : "text-slate-600"}`}>
                          {etapa.titulo}
                        </span>
                        {isAtual && (
                          <span className="px-2 py-0.5 bg-emerald-600 text-white text-[8px] font-black uppercase rounded tracking-wider animate-bounce">
                            Destino Atual
                          </span>
                        )}
                        {isConcluido && (
                          <span className="px-1.5 py-0.5 bg-slate-200 text-slate-700 text-[8px] font-bold uppercase rounded">
                            Concluído
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] font-bold text-slate-700 mt-0.5">{etapa.responsavel}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{etapa.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl text-[11px] text-blue-900 leading-relaxed font-medium">
            💡 <strong>Nota de Conformidade:</strong> As áreas de pareceres e despachos encontram-se em branco no formulário e serão fundamentadas e assinadas digitalmente por cada responsável conforme o documento avance neste fluxo.
          </div>
        </div>
      }
      maxWidth="max-w-5xl"
    >
      <div className="space-y-12">
        {/* Editor do Formulário Interativo */}
        <div className="bg-white rounded-2xl space-y-6 print:hidden">

            {/* Seleção Inteligente de Assunto / Categoria de Documento (DROPDOWN) */}
            <div className="bg-slate-100 p-6 rounded-2xl space-y-4 shadow-sm border-2 border-slate-200">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <h3 className="text-xs font-black  tracking-widest text-blue-900 flex items-center gap-2">
                    ✨ Seleção Inteligente de Assunto & Conteúdo Automático
                  </h3>
                  <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                    Escolha a categoria da actividade para adaptar instantaneamente o assunto, corpo do texto, justificativa e anexos sugeridos.
                  </p>
                </div>
              </div>

              {/* Dropdown de seleção inteligente */}
              <div className="max-w-md pt-1">
                <div className="relative group">
                  <select
                    value={categoriaSelecionada}
                    onChange={(e) => aplicarCategoriaAssunto(e.target.value as CategoriaAssunto)}
                    className="w-full p-3.5 bg-white border-2 border-slate-300 rounded-2xl text-xs text-slate-900 font-black outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 shadow-sm appearance-none cursor-pointer pr-10"
                  >
                    {(Object.keys(TEMPLATES_ASSUNTO) as CategoriaAssunto[]).map((catKey) => (
                      <option key={catKey} value={catKey}>
                        {TEMPLATES_ASSUNTO[catKey].icon} {TEMPLATES_ASSUNTO[catKey].label}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover:text-blue-600 transition-colors">
                    <Plus size={16} />
                  </div>
                </div>
              </div>

              {/* Editor do Assunto e do Corpo Gerado */}
            <div className="space-y-4 pt-3 border-t border-slate-200">
              <div>
                <label className="block text-[11px] font-black  tracking-wider text-slate-800 mb-1">
                  Assunto Oficial Gerado (Editável)
                </label>
                <input
                  type="text"
                  value={formData.assunto}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, assunto: e.target.value }))
                  }
                  className="w-full p-3 bg-white border-2 border-slate-300 rounded-xl text-xs text-slate-900 font-bold outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 shadow-sm"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-black  tracking-wider text-slate-800 mb-1">
                    Parágrafo Inicial / Enquadramento
                  </label>
                  <textarea
                    rows={4}
                    value={formData.textoCorpo1}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, textoCorpo1: e.target.value }))
                    }
                    className="w-full p-3 bg-white border-2 border-slate-300 rounded-xl text-xs text-slate-900 font-semibold outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 font-sans shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black  tracking-wider text-slate-800 mb-1">
                    Parágrafo de Impacto & Relevância
                  </label>
                  <textarea
                    rows={4}
                    value={formData.textoCorpo2}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, textoCorpo2: e.target.value }))
                    }
                    className="w-full p-3 bg-white border-2 border-slate-300 rounded-xl text-xs text-slate-900 font-semibold outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 font-sans shadow-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black  tracking-wider text-slate-800 mb-1">
                  Justificação e Fundamentação
                </label>
                <textarea
                  rows={2}
                  value={formData.justificacao}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, justificacao: e.target.value }))
                  }
                  className="w-full p-3 bg-white border-2 border-slate-300 rounded-xl text-xs text-slate-900 font-semibold outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 font-sans shadow-sm"
                />
              </div>
            </div>
          </div>
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 mb-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
              <span className="text-lg">🔢</span>
              <div>
                <strong className="block text-slate-900 font-black  text-[10px]">Numerador Exclusivo do Setor ({formData.siglaUnidade || "GERAL"})</strong>
                <span className="text-slate-600 text-[11px] font-medium">Cada setor possui a sua própria numeração sequencial independente (ex: 01, 02...).</span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleZerarNumeradorSetor}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-[10px]  tracking-wider shadow-sm transition-all whitespace-nowrap flex items-center gap-1.5"
            >
              <span>🔄 Zerar Numerador ({formData.siglaUnidade || "Setor"})</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-700  tracking-wider mb-1">
                Nº Proposta (Setor)
              </label>
              <input
                type="text"
                value={formData.numeroProposta}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, numeroProposta: e.target.value }))
                }
                className="w-full p-3 bg-white border-2 border-slate-300 rounded-xl text-sm text-slate-900 font-bold outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 shadow-sm"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-700  tracking-wider mb-1">
                Unidade (Sigla)
              </label>
              <input
                type="text"
                value={formData.siglaUnidade}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, siglaUnidade: e.target.value }))
                }
                className="w-full p-3 bg-white border-2 border-slate-300 rounded-xl text-sm text-slate-900 font-bold outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 shadow-sm"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-700  tracking-wider mb-1">
                Código Referência
              </label>
              <input
                type="text"
                value={formData.codigoNumero}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, codigoNumero: e.target.value }))
                }
                className="w-full p-3 bg-white border-2 border-slate-300 rounded-xl text-sm text-slate-900 font-bold outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 shadow-sm"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-700  tracking-wider mb-1">
                Ano
              </label>
              <input
                type="text"
                value={formData.ano}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, ano: e.target.value }))
                }
                className="w-full p-3 bg-white border-2 border-slate-300 rounded-xl text-sm text-slate-900 font-bold outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 shadow-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-700  tracking-wider mb-1">
                Departamento Emissor
              </label>
              <input
                type="text"
                value={formData.departamento}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, departamento: e.target.value }))
                }
                className="w-full p-3 bg-white border-2 border-slate-300 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 shadow-sm"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-700  tracking-wider mb-1">
                Data do Documento
              </label>
              <input
                type="text"
                value={formData.dataDocumento}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, dataDocumento: e.target.value }))
                }
                className="w-full p-3 bg-white border-2 border-slate-300 rounded-xl text-sm text-slate-900 font-bold outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 shadow-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 border-t border-slate-200 pt-6">
            <div className="space-y-4">
              <h4 className="text-xs font-black text-slate-900  tracking-widest border-l-4 border-blue-900 pl-2">
                Detalhes da Deslocação
              </h4>
              <div className="space-y-3">
                <div className="flex gap-4">
                  <div className="w-1/3">
                    <label className="block text-[10px] font-bold text-slate-700  mb-1">
                      Cód. da Actividade
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: 01.DPEP"
                      value={formData.codigoActividade}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          codigoActividade: e.target.value,
                        }))
                      }
                      className="w-full p-3 bg-white border-2 border-slate-300 rounded-xl text-xs text-slate-900 font-bold outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 shadow-sm"
                    />
                  </div>
                  <div className="w-2/3">
                    <label className="block text-[10px] font-bold text-slate-700  mb-1">
                      Nome da Actividade
                    </label>
                    <input
                      type="text"
                      value={formData.nomeActividade}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          nomeActividade: e.target.value,
                        }))
                      }
                      className="w-full p-3 bg-white border-2 border-slate-300 rounded-xl text-xs text-slate-900 font-bold outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 shadow-sm"
                    />
                  </div>
                </div>

                {isConvite && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="space-y-3 pt-2 bg-blue-50/50 p-3 rounded-2xl border border-blue-100"
                  >
                    <div>
                      <label className="block text-[10px] font-black text-blue-900  mb-1">
                        Instituição que faz o Convite
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Banco de Moçambique, Songo, etc"
                        value={formData.nomeInstituicaoConvidante}
                        onChange={(e) =>
                          setFormData((p) => ({
                            ...p,
                            nomeInstituicaoConvidante: e.target.value,
                          }))
                        }
                        className="w-full p-3 bg-white border-2 border-blue-200 rounded-xl text-xs text-slate-900 font-bold outline-none focus:border-blue-600 shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-blue-900  mb-1">
                        Ref. da Convocatória / Ofício
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Ofício nº 123/2024"
                        value={formData.convocatoria}
                        onChange={(e) =>
                          setFormData((p) => ({
                            ...p,
                            convocatoria: e.target.value,
                          }))
                        }
                        className="w-full p-3 bg-white border-2 border-blue-200 rounded-xl text-xs text-slate-900 font-bold outline-none focus:border-blue-600 shadow-sm"
                      />
                    </div>
                  </motion.div>
                )}
                <div>
                  <label className="block text-[10px] font-bold text-slate-700  mb-1">
                    Local
                  </label>
                  <input
                    type="text"
                    value={formData.localActividade}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        localActividade: e.target.value,
                      }))
                    }
                    className="w-full p-3 bg-white border-2 border-slate-300 rounded-xl text-xs text-slate-900 font-bold outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-700  mb-1">
                    Datas descritas
                  </label>
                  <input
                    type="text"
                    value={formData.datasActividade}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        datasActividade: e.target.value,
                      }))
                    }
                    className="w-full p-3 bg-white border-2 border-slate-300 rounded-xl text-xs text-slate-900 font-bold outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 shadow-sm"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-black text-slate-900  tracking-widest border-l-4 border-blue-900 pl-2">
                Datas e Participantes
              </h4>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700  mb-1">
                      Partida
                    </label>
                    <input
                      type="text"
                      value={formData.dataPartida}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          dataPartida: e.target.value,
                        }))
                      }
                      className="w-full p-3 bg-white border-2 border-slate-300 rounded-xl text-xs text-slate-900 font-bold outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700  mb-1">
                      Regresso
                    </label>
                    <input
                      type="text"
                      value={formData.dataRegresso}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          dataRegresso: e.target.value,
                        }))
                      }
                      className="w-full p-3 bg-white border-2 border-slate-300 rounded-xl text-xs text-slate-900 font-bold outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 shadow-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-700  mb-1">
                    Participantes
                  </label>
                  <input
                    type="text"
                    value={formData.participantes}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        participantes: e.target.value,
                      }))
                    }
                    className="w-full p-3 bg-white border-2 border-slate-300 rounded-xl text-xs text-slate-900 font-bold outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 shadow-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 border-t pt-6">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-black text-slate-900  tracking-widest border-l-4 border-blue-900 pl-2">
                Abonos e Custos
              </h4>
              <button
                type="button"
                onClick={handleAddCusto}
                className="flex items-center gap-1.5 bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-black tracking-widest hover:bg-slate-800 transition-all shadow-md"
              >
                <Plus size={14} /> Adicionar Beneficiário
              </button>
            </div>

            <div className="overflow-x-auto border border-slate-100 rounded-2xl shadow-sm">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-black  tracking-wider border-b">
                    <th className="p-4 w-12 text-center">Ord.</th>
                    <th className="p-4">Nome do Beneficiário</th>
                    <th className="p-4">Descrição</th>
                    <th className="p-4 w-20 text-center">Dias</th>
                    <th className="p-4 w-32">Valor Diário</th>
                    <th className="p-4 w-32">Total</th>
                    <th className="p-4 w-12 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {custos.map((c, idx) => (
                    <tr
                      key={c.id}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="p-4 text-center font-bold text-slate-400">
                        {idx + 1}
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={c.nome}
                          onChange={(e) =>
                            handleCustoChange(c.id, "nome", e.target.value)
                          }
                          className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 font-bold outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={c.descricao}
                          onChange={(e) =>
                            handleCustoChange(c.id, "descricao", e.target.value)
                          }
                          className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 font-bold outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={c.dias}
                          placeholder="1, 2 ou 1/2"
                          onChange={(e) =>
                            handleCustoChange(c.id, "dias", e.target.value)
                          }
                          className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 font-bold text-center outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          value={c.valorDiario}
                          onChange={(e) =>
                            handleCustoChange(
                              c.id,
                              "valorDiario",
                              e.target.value,
                            )
                          }
                          className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 font-bold outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </td>
                      <td className="p-4 font-black text-slate-900 bg-slate-50/30">
                        {parseFloat(c.valorTotal || "0").toLocaleString(
                          "pt-PT",
                          {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          },
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveCusto(c.id)}
                          disabled={custos.length <= 1}
                          className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all disabled:opacity-40"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-slate-900 text-white">
                    <td
                      colSpan={5}
                      className="p-4 text-right font-black  tracking-widest text-[10px]"
                    >
                      Total Geral Estimado:
                    </td>
                    <td
                      colSpan={2}
                      className="p-4 font-black text-sm text-[#FFB800]"
                    >
                      {totalGeral.toLocaleString("pt-PT", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      MZN
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-4 border-t border-slate-200 pt-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-blue-50/70 border border-blue-200/80 rounded-2xl p-3.5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-600 text-white shadow-sm">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900  tracking-wider">
                    Chefe Máximo do Departamento ({formData.siglaUnidade || "Setor"})
                  </h4>
                  <p className="text-[11px] text-slate-600 font-medium">
                    Preenchido automaticamente seguindo a nomeação do colaborador no Efetivo Geral ou o cargo de chefia do utilizador logado.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleSincronizarChefe}
                className="px-3 py-1.5 bg-white hover:bg-blue-50 text-blue-800 border border-blue-300 font-bold text-[10px]  tracking-wider rounded-xl transition-all flex items-center gap-1.5 shadow-sm whitespace-nowrap self-start sm:self-auto"
                title="Recarregar o Chefe Máximo com base nas nomeações dos colaboradores ou utilizador logado"
              >
                <span>🔄 Sincronizar Chefe</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-700  tracking-wider mb-1 text-center">
                  Nome do Chefe Máximo do Departamento
                </label>
                <input
                  type="text"
                  value={formData.nomeRequerente}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, nomeRequerente: e.target.value }))
                  }
                  className="w-full p-3 bg-white border-2 border-slate-300 rounded-xl text-sm font-black text-slate-900 text-center outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 shadow-sm"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-700  tracking-wider mb-1 text-center">
                  Cargo do Chefe Máximo do Departamento
                </label>
                <input
                  type="text"
                  value={formData.cargoRequerente}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      cargoRequerente: e.target.value,
                    }))
                  }
                  className="w-full p-3 bg-white border-2 border-slate-300 rounded-xl text-sm font-bold text-slate-900 text-center outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 shadow-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500  mb-2 text-center">
                Assinatura Digital do Chefe Máximo do Departamento
              </label>
              <div className="max-w-md mx-auto">
                <SignatureUpload
                  label=""
                  value={formData.assinaturaRequerente}
                  onChange={(val) =>
                    setFormData((prev) => ({
                      ...prev,
                      assinaturaRequerente: val,
                    }))
                  }
                  user={user}
                />
              </div>
            </div>
          </div>

          {/* Pareceres e Vistos Setoriais (Secretaria, DPEP, DAF, Transporte) - ACESSO RESTRITO */}
          {initialData && (isUserAuthorizedForRole("secretaria") || isUserAuthorizedForRole("dpep") || isUserAuthorizedForRole("daf") || isUserAuthorizedForRole("transporte")) && (
            <div className="border-t border-slate-200 pt-6 space-y-6">
              <h4 className="text-xs font-black text-slate-900  tracking-widest border-l-4 border-emerald-800 pl-2">
                Pareceres & Vistos Setoriais (Secretaria Geral, DPEP, DAF & Transporte)
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Bloco Secretaria Geral */}
                {isUserAuthorizedForRole("secretaria") && (
                  <div className="bg-slate-50/70 p-6 rounded-2xl border-2 border-slate-200 space-y-4 shadow-sm">
                    <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                      <span className="text-[10px] font-black text-blue-900  tracking-widest">
                        1. Secretaria Geral
                      </span>
                      <div className="flex gap-1.5 flex-wrap justify-end">
                        <button
                          type="button"
                          onClick={() => setModalRole("secretaria")}
                          className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-amber-300 text-[9px] font-black rounded-lg shadow-sm transition-all flex items-center gap-1"
                        >
                          <PenTool size={10} />
                          <span>Assinar</span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setFormData((p) => ({
                              ...p,
                              parecerSecretariaGeral: `Visto / Registo de entrada no expediente sob o Nº ${p.numeroProposta || ""}.`,
                            }))
                          }
                          className="px-2.5 py-1 bg-blue-800 hover:bg-blue-900 text-white text-[9px] font-extrabold rounded-lg shadow-sm transition-all"
                        >
                          Visto & Registado
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setFormData((p) => ({
                              ...p,
                              parecerSecretariaGeral:
                                "Devolvido para correções por falta de elementos de instrução obrigatórios.",
                            }))
                          }
                          className="px-2.5 py-1 bg-white hover:bg-red-50 border border-red-200 text-[9px] font-extrabold text-red-600 rounded-lg shadow-sm transition-all"
                        >
                          Devolvido
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-700  mb-1">
                        Visto / Registo no Expediente
                      </label>
                      <textarea
                        rows={2}
                        value={formData.parecerSecretariaGeral}
                        onChange={(e) =>
                          setFormData((p) => ({
                            ...p,
                            parecerSecretariaGeral: e.target.value,
                          }))
                        }
                        className={`w-full p-3 bg-white border-2 border-slate-300 rounded-xl text-xs outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 shadow-sm ${getParecerTextClass(formData.parecerSecretariaGeral)}`}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-black text-slate-700  mb-1 text-center">
                          Secretaria / Responsável
                        </label>
                        <input
                          type="text"
                          value={formData.nomeSecretariaGeral}
                          onChange={(e) =>
                            setFormData((p) => ({
                              ...p,
                              nomeSecretariaGeral: e.target.value,
                            }))
                          }
                          className="w-full p-2.5 bg-white border-2 border-slate-300 rounded-xl text-xs text-slate-900 font-black text-center outline-none focus:border-blue-600 shadow-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-700  mb-1 text-center">
                          Data
                        </label>
                        <input
                          type="text"
                          value={formData.dataParecerSecretariaGeral}
                          onChange={(e) =>
                            setFormData((p) => ({
                              ...p,
                              dataParecerSecretariaGeral: e.target.value,
                            }))
                          }
                          className="w-full p-2.5 bg-white border-2 border-slate-300 rounded-xl text-xs text-slate-900 font-bold text-center outline-none focus:border-blue-600 shadow-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500  mb-2 text-center">
                        Assinatura / Carimbo da Secretaria Geral
                      </label>
                      <SignatureUpload
                        label=""
                        value={formData.assinaturaSecretariaGeral}
                        onChange={(val) =>
                          setFormData((prev) => ({
                            ...prev,
                            assinaturaSecretariaGeral: val,
                          }))
                        }
                        user={user}
                      />
                    </div>
                  </div>
                )}

                {/* Bloco DPEP */}
                {isUserAuthorizedForRole("dpep") && (
                  <div className="bg-slate-50/70 p-6 rounded-2xl border-2 border-slate-200 space-y-4 shadow-sm">
                    <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                      <span className="text-[10px] font-black text-indigo-900  tracking-widest">
                        2. Parecer do DPEP
                      </span>
                      <div className="flex gap-1.5 flex-wrap justify-end">
                        <button
                          type="button"
                          onClick={() => setModalRole("dpep")}
                          className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-amber-300 text-[9px] font-black rounded-lg shadow-sm transition-all flex items-center gap-1"
                        >
                          <PenTool size={10} />
                          <span>Assinar</span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setFormData((p) => ({
                              ...p,
                              parecerDpep:
                                `Favorável. Trata-se de uma actividade planificada, ref. ${formData.codigoActividade || "[código da actividade]"}, programada para o mês de [mês de realização].`,
                            }))
                          }
                          className="px-2.5 py-1 bg-indigo-700 hover:bg-indigo-800 text-white text-[9px] font-extrabold rounded-lg shadow-sm transition-all"
                        >
                          Planificada
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setFormData((p) => ({
                              ...p,
                              parecerDpep:
                                "Atenção: A execução desta actividade não está planificada no exercício corrente.",
                            }))
                          }
                          className="px-2.5 py-1 bg-white hover:bg-red-50 border border-red-200 text-[9px] font-extrabold text-red-600 rounded-lg shadow-sm transition-all"
                        >
                          Não Planificada
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-700  mb-1">
                        Parecer do DPEP (Planificação & Projectos)
                      </label>
                      <textarea
                        rows={2}
                        value={formData.parecerDpep}
                        onChange={(e) =>
                          setFormData((p) => ({
                            ...p,
                            parecerDpep: e.target.value,
                          }))
                        }
                        className={`w-full p-3 bg-white border-2 border-slate-300 rounded-xl text-xs outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 shadow-sm ${getParecerTextClass(formData.parecerDpep)}`}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-black text-slate-700  mb-1 text-center">
                          Nome do Chefe do DPEP
                        </label>
                        <input
                          type="text"
                          value={formData.nomeChefeDpep}
                          onChange={(e) =>
                            setFormData((p) => ({
                              ...p,
                              nomeChefeDpep: e.target.value,
                            }))
                          }
                          className="w-full p-2.5 bg-white border-2 border-slate-300 rounded-xl text-xs text-slate-900 font-black text-center outline-none focus:border-blue-600 shadow-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-700  mb-1 text-center">
                          Data
                        </label>
                        <input
                          type="text"
                          value={formData.dataParecerDpep}
                          onChange={(e) =>
                            setFormData((p) => ({
                              ...p,
                              dataParecerDpep: e.target.value,
                            }))
                          }
                          className="w-full p-2.5 bg-white border-2 border-slate-300 rounded-xl text-xs text-slate-900 font-bold text-center outline-none focus:border-blue-600 shadow-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500  mb-2 text-center">
                        Assinatura Digital do DPEP
                      </label>
                      <SignatureUpload
                        label=""
                        value={formData.assinaturaChefeDpep}
                        onChange={(val) =>
                          setFormData((prev) => ({
                            ...prev,
                            assinaturaChefeDpep: val,
                          }))
                        }
                        user={user}
                      />
                    </div>
                  </div>
                )}

                {/* Bloco DAF */}
                {isUserAuthorizedForRole("daf") && (
                  <div className="bg-slate-50/70 p-6 rounded-2xl border-2 border-slate-200 space-y-4 shadow-sm">
                    <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                      <span className="text-[10px] font-black text-emerald-900  tracking-widest">
                        3. Dep. Apoio Financeiro (DAF)
                      </span>
                      <div className="flex gap-1.5 flex-wrap justify-end">
                        <button
                          type="button"
                          onClick={() => setModalRole("daf")}
                          className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-amber-300 text-[9px] font-black rounded-lg shadow-sm transition-all flex items-center gap-1"
                        >
                          <PenTool size={10} />
                          <span>Assinar</span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setFormData((p) => ({
                              ...p,
                              parecerDaf:
                                "Favorável. Existe cabimento orçamental na rubrica correspondente para a cobertura das despesas da deslocação.",
                            }))
                          }
                          className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white text-[9px] font-extrabold rounded-lg shadow-sm transition-all"
                        >
                          Com Cabimento
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setFormData((p) => ({
                              ...p,
                              parecerDaf:
                                "Sem disponibilidade financeira imediata na rubrica orçamental.",
                            }))
                          }
                          className="px-2.5 py-1 bg-white hover:bg-red-50 border border-red-200 text-[9px] font-extrabold text-red-600 rounded-lg shadow-sm transition-all"
                        >
                          Sem Cabimento
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-700  mb-1">
                        Parecer do DAF
                      </label>
                      <textarea
                        rows={2}
                        value={formData.parecerDaf}
                        onChange={(e) =>
                          setFormData((p) => ({
                            ...p,
                            parecerDaf: e.target.value,
                          }))
                        }
                        className={`w-full p-3 bg-white border-2 border-slate-300 rounded-xl text-xs outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 shadow-sm ${getParecerTextClass(formData.parecerDaf)}`}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-black text-slate-700  mb-1 text-center">
                          Nome do Chefe do DAF
                        </label>
                        <input
                          type="text"
                          value={formData.nomeChefeDaf}
                          onChange={(e) =>
                            setFormData((p) => ({
                              ...p,
                              nomeChefeDaf: e.target.value,
                            }))
                          }
                          className="w-full p-2.5 bg-white border-2 border-slate-300 rounded-xl text-xs text-slate-900 font-black text-center outline-none focus:border-blue-600 shadow-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-700  mb-1 text-center">
                          Data
                        </label>
                        <input
                          type="text"
                          value={formData.dataParecerDaf}
                          onChange={(e) =>
                            setFormData((p) => ({
                              ...p,
                              dataParecerDaf: e.target.value,
                            }))
                          }
                          className="w-full p-2.5 bg-white border-2 border-slate-300 rounded-xl text-xs text-slate-900 font-bold text-center outline-none focus:border-blue-600 shadow-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500  mb-2 text-center">
                        Assinatura Digital do DAF
                      </label>
                      <SignatureUpload
                        label=""
                        value={formData.assinaturaChefeDaf}
                        onChange={(val) =>
                          setFormData((prev) => ({
                            ...prev,
                            assinaturaChefeDaf: val,
                          }))
                        }
                        user={user}
                      />
                    </div>
                  </div>
                )}

                {/* Bloco Transporte */}
                {isUserAuthorizedForRole("transporte") && (
                  <div className="bg-slate-50/70 p-6 rounded-2xl border-2 border-slate-200 space-y-4 shadow-sm">
                    <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                      <span className="text-[10px] font-black text-sky-900  tracking-widest">
                        4. Repartição de Transporte
                      </span>
                      <div className="flex gap-1.5 flex-wrap justify-end">
                        <button
                          type="button"
                          onClick={() => setModalRole("transporte")}
                          className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-amber-300 text-[9px] font-black rounded-lg shadow-sm transition-all flex items-center gap-1"
                        >
                          <PenTool size={10} />
                          <span>Assinar</span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setFormData((p) => ({
                              ...p,
                              parecerTransporte:
                                "Confirmada a disponibilidade de transporte colectivo / viatura para o cumprimento da deslocação.",
                            }))
                          }
                          className="px-2.5 py-1 bg-sky-700 hover:bg-sky-800 text-white text-[9px] font-extrabold rounded-lg shadow-sm transition-all"
                        >
                          Disponível
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setFormData((p) => ({
                              ...p,
                              parecerTransporte:
                                "Sem viatura institucional disponível no período solicitado.",
                            }))
                          }
                          className="px-2.5 py-1 bg-white hover:bg-red-50 border border-red-200 text-[9px] font-extrabold text-red-600 rounded-lg shadow-sm transition-all"
                        >
                          Indisponível
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-700  mb-1">
                        Parecer da Repartição de Transporte
                      </label>
                      <textarea
                        rows={2}
                        value={formData.parecerTransporte}
                        onChange={(e) =>
                          setFormData((p) => ({
                            ...p,
                            parecerTransporte: e.target.value,
                          }))
                        }
                        className={`w-full p-3 bg-white border-2 border-slate-300 rounded-xl text-xs outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 shadow-sm ${getParecerTextClass(formData.parecerTransporte)}`}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-black text-slate-700  mb-1 text-center">
                          Nome do Chefe de Transporte
                        </label>
                        <input
                          type="text"
                          value={formData.nomeChefeTransporte}
                          onChange={(e) =>
                            setFormData((p) => ({
                              ...p,
                              nomeChefeTransporte: e.target.value,
                            }))
                          }
                          className="w-full p-2.5 bg-white border-2 border-slate-300 rounded-xl text-xs text-slate-900 font-black text-center outline-none focus:border-blue-600 shadow-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-700  mb-1 text-center">
                          Data
                        </label>
                        <input
                          type="text"
                          value={formData.dataParecerTransporte}
                          onChange={(e) =>
                            setFormData((p) => ({
                              ...p,
                              dataParecerTransporte: e.target.value,
                            }))
                          }
                          className="w-full p-2.5 bg-white border-2 border-slate-300 rounded-xl text-xs text-slate-900 font-bold text-center outline-none focus:border-blue-600 shadow-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500  mb-2 text-center">
                        Assinatura Digital de Transporte
                      </label>
                      <SignatureUpload
                        label=""
                        value={formData.assinaturaChefeTransporte}
                        onChange={(val) =>
                          setFormData((prev) => ({
                            ...prev,
                            assinaturaChefeTransporte: val,
                          }))
                        }
                        user={user}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Configuração de Anexos e Convite */}
          <div className="border-t pt-6 space-y-4">
            <h4 className="text-xs font-black text-slate-900  tracking-widest border-l-4 border-blue-900 pl-2">
              Gestão de Anexos & Convite (Obrigatório se Convite)
            </h4>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isConvite}
                  onChange={(e) => setIsConvite(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <span className="text-xs font-bold text-slate-800">
                  Trata-se de Convite? <span className="text-red-600 font-black">(Torna obrigatório anexar o convite)</span>
                </span>
              </label>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <label className={`px-4 py-2 rounded-xl text-xs font-black tracking-wider flex items-center gap-2 cursor-pointer shadow transition-all ${isConvite && !anexoFile ? 'bg-red-600 text-white animate-pulse' : 'bg-slate-900 text-white hover:bg-slate-800'}`}>
                  <Upload size={14} className="text-amber-400" />
                  <span>{anexoFile ? "Alterar Anexo / Convite" : isConvite ? "Anexar Convite (Obrigatório)" : "Anexar Documento (Opcional)"}</span>
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (uploadEvt) => {
                          setAnexoFile({
                            name: file.name,
                            url: uploadEvt.target?.result as string,
                          });
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>
                
                {anexoFile && (
                  <div className="flex items-center gap-2">
                    <a
                      href={anexoFile.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black hover:bg-blue-700 transition-all shadow-sm"
                    >
                      <ExternalLink size={12} />
                      Visualizar Anexo
                    </a>
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 truncate max-w-[150px]">
                      ✓ {anexoFile.name}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Ação de Envio (Submeter) */}
          <div className="border-t-2 border-slate-100 pt-8 pb-4 flex justify-center print:hidden">
            <button
              type="button"
              onClick={handleSendClick}
              className="group relative flex items-center gap-3 px-10 py-5 bg-blue-900 text-white rounded-2xl font-black text-xs  tracking-[0.2em] hover:bg-blue-800 transition-all shadow-2xl shadow-blue-200 active:scale-95"
            >
              <div className="absolute -top-3 -right-3 bg-amber-400 text-blue-950 p-2 rounded-xl shadow-lg group-hover:rotate-12 transition-transform">
                <Send size={16} />
              </div>
              <span>Enviar Documento</span>
            </button>
          </div>

          {/* Configuração de Despachos e Homologação Oficiais - ACESSO RESTRITO */}
          {initialData && (isUserAuthorizedForRole("dicosafa") || isUserAuthorizedForRole("diretorGeral")) && (
            <div className="border-t border-slate-200 pt-6 space-y-6">
              <h4 className="text-xs font-black text-slate-900  tracking-widest border-l-4 border-blue-900 pl-2">
                Homologação & Despachos Oficiais
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Bloco Gabinete do Diretor da DICOSAFA */}
                {isUserAuthorizedForRole("dicosafa") && (
                  <div className="bg-slate-50/70 p-6 rounded-2xl border-2 border-slate-200 space-y-4 shadow-sm">
                    {/* ... conteúdo dicosafa ... */}
                    <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                      <span className="text-[10px] font-black text-blue-900  tracking-widest">
                        1. Gabinete do Diretor da DICOSAFA
                      </span>
                      <div className="flex gap-1.5 flex-wrap justify-end">
                        <button
                          type="button"
                          onClick={() => setModalRole("dicosafa")}
                          className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-amber-300 text-[9px] font-black rounded-lg shadow-sm transition-all flex items-center gap-1"
                        >
                          <PenTool size={10} />
                          <span>Assinar</span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setFormData((p) => ({
                              ...p,
                              despachoDicosafa:
                                "Favorável. Submeto à consideração de Sua Excia o Senhor Diretor-Geral para a devida homologação e autorização dos abonos correspondentes.",
                            }))
                          }
                          className="px-2.5 py-1 bg-white hover:bg-blue-50 border border-blue-200 text-[9px] font-extrabold text-blue-900 rounded-lg shadow-sm transition-all"
                        >
                          Favorável
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setFormData((p) => ({
                              ...p,
                              despachoDicosafa:
                                "Homologado e favorável. Encaminhe-se ao Gabinete do Diretor-Geral.",
                            }))
                          }
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-extrabold rounded-lg shadow-sm transition-all"
                        >
                          Homologar
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setFormData((p) => ({
                              ...p,
                              despachoDicosafa:
                                "Não favorável face à indisponibilidade orçamental nesta rubrica do trimestre.",
                            }))
                          }
                          className="px-2.5 py-1 bg-white hover:bg-red-50 border border-red-200 text-[9px] font-extrabold text-red-600 rounded-lg shadow-sm transition-all"
                        >
                          Indisponível
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-700  mb-1">
                        Parecer Técnico / Homologação DICOSAFA
                      </label>
                      <textarea
                        rows={2}
                        value={formData.despachoDicosafa}
                        onChange={(e) =>
                          setFormData((p) => ({
                            ...p,
                            despachoDicosafa: e.target.value,
                          }))
                        }
                        className="w-full p-3 bg-white border-2 border-slate-300 rounded-xl text-xs text-slate-900 font-bold outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 shadow-sm"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-black text-slate-700  mb-1 text-center">
                          Nome do Diretor
                        </label>
                        <input
                          type="text"
                          value={formData.nomeDiretorDicosafa}
                          onChange={(e) =>
                            setFormData((p) => ({
                              ...p,
                              nomeDiretorDicosafa: e.target.value,
                            }))
                          }
                          className="w-full p-2.5 bg-white border-2 border-slate-300 rounded-xl text-xs text-slate-900 font-black text-center outline-none focus:border-blue-600 shadow-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-700  mb-1 text-center">
                          Data
                        </label>
                        <input
                          type="text"
                          value={formData.dataDespachoDicosafa}
                          onChange={(e) =>
                            setFormData((p) => ({
                              ...p,
                              dataDespachoDicosafa: e.target.value,
                            }))
                          }
                          className="w-full p-2.5 bg-white border-2 border-slate-300 rounded-xl text-xs text-slate-900 font-bold text-center outline-none focus:border-blue-600 shadow-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500  mb-2 text-center">
                        Assinatura Digital
                      </label>
                      <SignatureUpload
                        label=""
                        value={formData.assinaturaDiretorDicosafa}
                        onChange={(val) =>
                          setFormData((prev) => ({
                            ...prev,
                            assinaturaDiretorDicosafa: val,
                          }))
                        }
                        user={user}
                      />
                    </div>
                  </div>
                )}

                {/* Bloco Gabinete do Diretor-Geral */}
                {isUserAuthorizedForRole("diretorGeral") && (
                  <div className="bg-slate-50/70 p-6 rounded-2xl border-2 border-slate-200 space-y-4 shadow-sm">
                    <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                      <span className="text-[10px] font-black text-emerald-900  tracking-widest">
                        2. Gabinete do Diretor-Geral
                      </span>
                      <div className="flex gap-1.5 flex-wrap justify-end">
                        <button
                          type="button"
                          onClick={() => setModalRole("diretorGeral")}
                          className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-amber-300 text-[9px] font-black rounded-lg shadow-sm transition-all flex items-center gap-1"
                        >
                          <PenTool size={10} />
                          <span>Assinar</span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setFormData((p) => ({
                              ...p,
                              despachoDiretorGeral:
                                "Homologado e Autorizado nos termos propostos. Proceda-se em conformidade legal e orçamental.",
                            }))
                          }
                          className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white text-[9px] font-extrabold rounded-lg shadow-sm transition-all"
                        >
                          Homologar / Autorizar
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setFormData((p) => ({
                              ...p,
                              despachoDiretorGeral:
                                "Não autorizado. Devolva-se para as devidas retificações do plano de viagem.",
                            }))
                          }
                          className="px-2.5 py-1 bg-white hover:bg-red-50 border border-red-200 text-[9px] font-extrabold text-red-600 rounded-lg shadow-sm transition-all"
                        >
                          Recusar
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-700  mb-1">
                        Despacho / Homologação Diretor-Geral
                      </label>
                      <textarea
                        rows={2}
                        value={formData.despachoDiretorGeral}
                        onChange={(e) =>
                          setFormData((p) => ({
                            ...p,
                            despachoDiretorGeral: e.target.value,
                          }))
                        }
                        className="w-full p-3 bg-white border-2 border-slate-300 rounded-xl text-xs text-slate-900 font-bold outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 shadow-sm"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-black text-slate-700  mb-1 text-center">
                          Nome do Diretor
                        </label>
                        <input
                          type="text"
                          value={formData.nomeDiretorGeral}
                          onChange={(e) =>
                            setFormData((p) => ({
                              ...p,
                              nomeDiretorGeral: e.target.value,
                            }))
                          }
                          className="w-full p-2.5 bg-white border-2 border-slate-300 rounded-xl text-xs text-slate-900 font-black text-center outline-none focus:border-blue-600 shadow-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-700  mb-1 text-center">
                          Data
                        </label>
                        <input
                          type="text"
                          value={formData.dataDespachoDiretorGeral}
                          onChange={(e) =>
                            setFormData((p) => ({
                              ...p,
                              dataDespachoDiretorGeral: e.target.value,
                            }))
                          }
                          className="w-full p-2.5 bg-white border-2 border-slate-300 rounded-xl text-xs text-slate-900 font-bold text-center outline-none focus:border-blue-600 shadow-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500  mb-2 text-center">
                        Assinatura Digital
                      </label>
                      <SignatureUpload
                        label=""
                        value={formData.assinaturaDiretorGeral}
                        onChange={(val) =>
                          setFormData((prev) => ({
                            ...prev,
                            assinaturaDiretorGeral: val,
                          }))
                        }
                        user={user}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-4 pt-8 border-t border-slate-100">
            <button
              type="button"
              onClick={onCancel}
              className="px-8 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all text-xs tracking-widest "
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => printElementById("print-area")}
              className="px-8 py-3 bg-slate-900 text-white font-black rounded-xl hover:bg-slate-800 transition-all flex items-center gap-2 text-xs  tracking-widest shadow-md"
            >
              <Printer size={18} /> Imprimir A4
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isSubmitted}
              className="px-10 py-3 bg-blue-900 text-white rounded-xl font-black text-xs tracking-[0.2em] hover:bg-blue-800 transition-all shadow-xl shadow-blue-100 disabled:opacity-50 flex items-center gap-2 "
            >
              <Save size={18} />{" "}
              {isSubmitting
                ? "A Gravar..."
                : isSubmitted
                  ? "Documento Gravado"
                  : "Gravar Digital"}
            </button>
          </div>
        </div>

        {/* DOCUMENTO OFICIAL FORMATADO EM A4 PARA IMPRESSÃO (Folha 1) */}
        <div className="max-w-[210mm] mx-auto bg-white p-[15mm] shadow-2xl border border-slate-200 font-serif text-slate-950 relative min-h-[297mm] flex flex-col justify-between print:shadow-none print:border-none print:p-0 print:m-0 print:w-full print:h-[297mm] print:break-after-page mt-12 mb-8 hidden sm:flex">
          <div className="space-y-6 flex-1">
            {/* Cabeçalho oficial com Logo - Estilo Imagem 2 */}
            <div className="flex flex-col items-center text-center space-y-1 relative pb-4 border-b-2 border-slate-900">
              <img
                src="https://lh3.googleusercontent.com/d/11zvvpOpZARM1yk_irEDpjJ-qBKlTlhad"
                alt="Logo Songo"
                className="h-20 w-auto object-contain mb-2"
                referrerPolicy="no-referrer"
              />
              <div className="space-y-0.5">
                <h1 className="text-[11px] font-black tracking-tight text-slate-900 font-serif">
                  INSTITUTO SUPERIOR POLITÉCNICO DE SONGO
                </h1>
                <p className="text-[10px] font-bold tracking-wide text-slate-800 font-serif">PROVÍNCIA DE TETE</p>
                <p className="text-[10px] font-bold tracking-wide text-slate-800 font-serif">DISTRITO DE CAHORA-BASSA</p>
              </div>

              {/* Caixa Identificadora MIP no Canto Superior Direito */}
              <div className="absolute top-0 right-0">
                <div className="border-2 border-slate-900 px-3 py-1 text-center bg-white shadow-sm">
                   <p className="text-[9px] font-black text-slate-900 leading-none">MIP-04/IP</p>
                </div>
              </div>
            </div>

            <div className="text-center space-y-1 pt-4">
              <h2 className="text-sm font-black text-slate-950 tracking-wider font-serif uppercase">
                Gabinete do Diretor-Geral
              </h2>
              <h3 className="text-xs font-bold text-slate-800 font-serif tracking-tight uppercase">
                {formData.departamento}
              </h3>
            </div>

            {/* Código do Documento / Título - Estilo Imagem 2 */}
            <div className="flex justify-between items-center py-2 border-b-2 border-slate-900 my-4 font-serif font-bold text-[11px]">
              <div className="flex items-center gap-1">
                <span>Informação Proposta Nº</span>
                <span className="min-w-[30px] border-b border-slate-400 text-center">{formData.numeroProposta}</span>
              </div>
              <div className="flex items-center gap-0.5">
                <span>/Songo/GDG/</span>
                <span>{formData.siglaUnidade}</span>
                <span>/</span>
                <span>{formData.codigoNumero}</span>
                <span>/</span>
                <span>{formData.ano}</span>
              </div>
            </div>

            {/* Retângulo de Despachos Oficial e Dinâmico */}
            <div className="grid grid-cols-2 border border-slate-950 min-h-[140px] my-4 font-serif text-[10px] text-slate-900">
              {/* Parecer / Despacho da DICOSAFA */}
              <div
                onClick={() => setModalRole("dicosafa")}
                className="border-r border-slate-950 p-3 flex flex-col justify-between relative bg-slate-50/40 cursor-pointer hover:bg-blue-50/50 transition-all group"
                title="Clique para assinar ou alterar despacho da DICOSAFA"
              >
                <div>
                  <div className="flex items-center justify-center gap-1 border-b pb-1 mb-1">
                    <span className="block text-[8px]  tracking-wider font-extrabold text-blue-900 text-center">
                      1. Parecer Técnico & Homologação (DICOSAFA)
                    </span>
                    <PenTool className="w-2.5 h-2.5 text-blue-700 opacity-0 group-hover:opacity-100 transition-opacity print:hidden" />
                  </div>
                  {formData.despachoDicosafa ? (
                    <p className={`italic text-xs leading-tight whitespace-pre-wrap font-serif ${getParecerTextClass(formData.despachoDicosafa)}`}>
                      "{formData.despachoDicosafa}"
                    </p>
                  ) : (
                    <div className="min-h-[36px] flex items-center justify-center">
                      <span className="text-[8px] text-slate-400 italic print:hidden font-sans">Área em branco (aguarda parecer)</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-center justify-center text-center mt-2 pt-2 border-t border-slate-200">
                  {formData.assinaturaDiretorDicosafa ? (
                    <img
                      src={formData.assinaturaDiretorDicosafa}
                      alt="Assinatura DICOSAFA"
                      className="h-9 w-auto object-contain mix-blend-multiply mb-1"
                    />
                  ) : (
                    <div className="my-1 px-2 py-1 bg-blue-100/80 border border-blue-300 rounded text-[8px] text-blue-900 font-bold flex items-center gap-1 print:hidden">
                      <Feather className="w-2.5 h-2.5" />
                      <span>Clique para assinar</span>
                    </div>
                  )}
                  <div className="text-[8px] font-bold text-slate-700 leading-tight text-center">
                    <p className=" font-black text-slate-900 text-center">
                      {formData.nomeDiretorDicosafa || "Diretor DICOSAFA"}
                    </p>
                    <p className="text-[7px] text-slate-600 font-bold text-center mt-0.5">
                      {formData.cargoDiretorDicosafa || "Director da DICOSAFA"}
                    </p>
                    <p className="text-[7px] text-slate-500 font-medium text-center mt-0.5">
                      Data: {formData.dataDespachoDicosafa}
                    </p>
                  </div>
                </div>
                <div className="absolute bottom-1 right-2 text-[7px] text-slate-300 font-bold">
                  DICOSAFA
                </div>
              </div>

              {/* Despacho do Diretor-Geral */}
              <div
                onClick={() => setModalRole("diretorGeral")}
                className="p-3 flex flex-col justify-between relative bg-slate-50/40 cursor-pointer hover:bg-emerald-50/50 transition-all group"
                title="Clique para assinar ou alterar despacho do Diretor-Geral"
              >
                <div>
                  <div className="flex items-center justify-center gap-1 border-b pb-1 mb-1">
                    <span className="block text-[8px]  tracking-wider font-extrabold text-emerald-900 text-center">
                      2. Despacho & Homologação (Diretor-Geral)
                    </span>
                    <PenTool className="w-2.5 h-2.5 text-emerald-700 opacity-0 group-hover:opacity-100 transition-opacity print:hidden" />
                  </div>
                  {formData.despachoDiretorGeral ? (
                    <p className={`italic text-xs leading-tight whitespace-pre-wrap font-serif ${getParecerTextClass(formData.despachoDiretorGeral)}`}>
                      "{formData.despachoDiretorGeral}"
                    </p>
                  ) : (
                    <div className="min-h-[36px] flex items-center justify-center">
                      <span className="text-[8px] text-slate-400 italic print:hidden font-sans">Área em branco (aguarda despacho)</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-center justify-center text-center mt-2 pt-2 border-t border-slate-200">
                  {formData.assinaturaDiretorGeral ? (
                    <img
                      src={formData.assinaturaDiretorGeral}
                      alt="Assinatura Diretor-Geral"
                      className="h-9 w-auto object-contain mix-blend-multiply mb-1"
                    />
                  ) : (
                    <div className="my-1 px-2 py-1 bg-emerald-100/80 border border-emerald-300 rounded text-[8px] text-emerald-900 font-bold flex items-center gap-1 print:hidden">
                      <Feather className="w-2.5 h-2.5" />
                      <span>Clique para assinar</span>
                    </div>
                  )}
                  <div className="text-[8px] font-bold text-slate-700 leading-tight text-center">
                    <p className=" font-black text-slate-900 text-center">
                      {formData.nomeDiretorGeral || "Diretor-Geral"}
                    </p>
                    <p className="text-[7px] text-slate-600 font-bold text-center mt-0.5">
                      {formData.cargoDiretorGeral || "Diretor-Geral"}
                    </p>
                    <p className="text-[7px] text-slate-500 font-medium text-center mt-0.5">
                      Data: {formData.dataDespachoDiretorGeral}
                    </p>
                  </div>
                </div>
                <div className="absolute bottom-1 right-2 text-[7px] text-slate-300 font-bold">
                  GDG
                </div>
              </div>
            </div>

            {/* Data e Destinatário */}
            <div className="flex justify-between items-start font-serif text-xs pt-2">
              <div>
                <span className="font-bold">Data:</span>{" "}
                {formData.dataDocumento}
              </div>
              <div className="text-right font-bold text-slate-900">
                {formData.autoridadeDestino}
              </div>
            </div>

            {/* Assunto */}
            <div className="font-serif text-xs font-bold text-slate-900 border-b border-dashed pb-2">
              Assunto: {formData.assunto}
            </div>

            {/* Saudação e Abertura */}
            <div className="space-y-4 text-xs leading-relaxed text-justify">
              <p className="font-bold">
                Exmo(a). Senhor(a) {formData.nomeAutoridade},{" "}
                {formData.tituloAutoridade}
              </p>
              <p>{obterTextoCorpo1Real()}</p>
              <p>{formData.textoCorpo2}</p>
            </div>

            {/* Detalhes da Deslocação */}
            <div className="bg-slate-50 border p-4 rounded-xl font-serif text-xs space-y-1 my-4">
              <h4 className="font-black text-slate-900 mb-2  text-[10px] tracking-wider">
                Detalhes da Deslocação:
              </h4>
              <div>
                <span className="font-bold text-slate-600">Actividade:</span>{" "}
                {formData.nomeActividade}
              </div>
              <div>
                <span className="font-bold text-slate-600">Local:</span>{" "}
                {formData.localActividade}
              </div>
              <div>
                <span className="font-bold text-slate-600">Datas:</span>{" "}
                {formData.dataPartida} a {formData.dataRegresso}
              </div>
              <div>
                <span className="font-bold text-slate-600">
                  Participante(s):
                </span>{" "}
                {formData.participantes}
              </div>
            </div>

          </div>

          {/* Rodapé Oficial da Primeira Página */}
          <DocumentFooter className="mt-12" />
        </div>

        {/* DOCUMENTO OFICIAL FORMATADO EM A4 PARA IMPRESSÃO (Folha 2) */}
        <div className="max-w-[210mm] mx-auto bg-white p-[15mm] shadow-2xl border border-slate-200 font-serif text-slate-950 relative min-h-[297mm] flex flex-col justify-between print:shadow-none print:border-none print:p-0 print:m-0 print:w-full print:h-[297mm] mb-12 hidden sm:flex">
          <div className="space-y-6 flex-1">
            {/* Cabeçalho oficial com Logo reduzido */}
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <span className="text-[10px] text-slate-400 font-serif font-bold">
                Informação Proposta Nº {formData.numeroProposta}
              </span>
              <span className="text-[10px] text-slate-400 font-serif font-bold">
                Pág. 2
              </span>
            </div>

            {/* Tabela de Custos */}
            <div className="space-y-2">
              <h4 className="font-serif font-black text-slate-900  text-[10px] tracking-wider">
                Tabela de Custos / Abonos:
              </h4>
              <table className="w-full font-serif text-[10px] border-collapse border border-slate-400">
                <thead>
                  <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-400">
                    <th className="border-r border-slate-400 p-1.5 text-center w-10">
                      Ord.
                    </th>
                    <th className="border-r border-slate-400 p-1.5 text-left">
                      Nome do Beneficiário
                    </th>
                    <th className="border-r border-slate-400 p-1.5 text-left">
                      Descrição
                    </th>
                    <th className="border-r border-slate-400 p-1.5 text-center w-12">
                      Dias
                    </th>
                    <th className="border-r border-slate-400 p-1.5 text-right w-24">
                      Valor Diário
                    </th>
                    <th className="p-1.5 text-right w-28">Valor Total (MZN)</th>
                  </tr>
                </thead>
                <tbody>
                  {custos.map((c, idx) => (
                    <tr key={c.id} className="border-b border-slate-400">
                      <td className="border-r border-slate-400 p-1.5 text-center">
                        {idx + 1}
                      </td>
                      <td className="border-r border-slate-400 p-1.5">
                        {c.nome || ""}
                      </td>
                      <td className="border-r border-slate-400 p-1.5">
                        {c.descricao || ""}
                      </td>
                      <td className="border-r border-slate-400 p-1.5 text-center">
                        {c.dias || ""}
                      </td>
                      <td className="border-r border-slate-400 p-1.5 text-right">
                        {c.valorDiario === "------"
                          ? "------"
                          : !c.valorDiario
                            ? ""
                            : isNaN(parseFloat(c.valorDiario))
                              ? c.valorDiario
                              : parseFloat(c.valorDiario).toLocaleString(
                                  "pt-PT",
                                  {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  },
                                )}
                      </td>
                      <td className="p-1.5 text-right font-bold">
                        {!c.valorTotal
                          ? ""
                          : isNaN(parseFloat(c.valorTotal))
                            ? c.valorTotal
                            : parseFloat(c.valorTotal).toLocaleString("pt-PT", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-slate-50 font-bold border-b border-slate-400">
                    <td
                      colSpan={5}
                      className="border-r border-slate-400 p-1.5 text-right"
                    >
                      Total:
                    </td>
                    <td className="p-1.5 text-right text-slate-950 text-xs font-black">
                      {totalGeral.toLocaleString("pt-PT", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Justificação */}
            <div className="space-y-2 text-xs">
              <h4 className="font-serif font-black text-slate-900  text-[10px] tracking-wider">
                Justificação:
              </h4>
              <p className="text-justify leading-relaxed">
                {formData.justificacao}
              </p>
            </div>

            {/* Anexos */}
            <div className="space-y-2">
              <h4 className="font-serif font-black text-slate-900  text-[10px] tracking-wider">
                Anexos:
              </h4>
              <ul className="list-disc list-inside font-serif text-xs space-y-1 text-slate-800">
                {formData.anexos.map((anexo, idx) => (
                  <li key={idx} className="font-medium">
                    {anexo}
                  </li>
                ))}
              </ul>
              {(anexoFile || (formData as any).anexoFile) && (
                <div className="mt-2 pt-1 border-t border-dashed border-slate-300 print:hidden">
                  <a
                    href={(anexoFile || (formData as any).anexoFile).url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-900 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-100 transition-all shadow-sm"
                    title="Clique para abrir e ver o anexo/convite oficial"
                  >
                    <Paperclip size={14} className="text-blue-700" />
                    <span>Ver / Abrir Anexo Oficial: <strong>{(anexoFile || (formData as any).anexoFile).name}</strong></span>
                    <ExternalLink size={12} className="text-blue-600" />
                  </a>
                </div>
              )}
            </div>

            {/* Fecho de cortesia */}
            <div className="text-xs pt-2">
              Na expectativa da vossa aprovação, apresento os meus melhores
              cumprimentos.
            </div>

            <div className="text-xs pt-4 font-serif text-slate-600">
              {formData.LocalDataRequerente}
            </div>

            {/* Bloco de Assinatura do Requerente */}
            <div
              onClick={() => setModalRole("requerente")}
              className="text-center pt-6 max-w-sm mx-auto flex flex-col items-center cursor-pointer hover:bg-amber-50/50 p-3 rounded-2xl transition-all group border border-transparent hover:border-amber-200"
              title="Clique para assinar como Chefe Máximo do Departamento Requerente"
            >
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <p className="font-serif font-black  tracking-widest text-[11px] text-slate-800">
                  O CHEFE DO DEPARTAMENTO
                </p>
                <PenTool className="w-3 h-3 text-amber-700 opacity-0 group-hover:opacity-100 transition-opacity print:hidden" />
              </div>

              <div className="w-64 my-1">
                <SignatureUpload
                  label=""
                  value={formData.assinaturaRequerente}
                  onChange={(val) =>
                    setFormData((prev) => ({
                      ...prev,
                      assinaturaRequerente: val,
                    }))
                  }
                  user={user}
                />
              </div>

              <div className="w-64 border-b border-dashed border-slate-400 my-1"></div>

              <div className="text-center mt-1 font-serif">
                <p className="font-black text-slate-900 text-xs  tracking-wide">
                  ({formData.nomeRequerente ? formData.nomeRequerente.toUpperCase() : "NOME DO CHEFE MÁXIMO DO DEPARTAMENTO"})
                </p>
                <p className="text-[10px] text-slate-600 italic font-bold mt-0.5">
                  ({formData.cargoRequerente || "Chefe do Departamento"})
                </p>
              </div>
            </div>

            {/* Secção de Vistos / Assinaturas Adicionais em Tabela de 4 Colunas */}
            <div className="grid grid-cols-4 border border-slate-900 min-h-[160px] mt-8 mb-6 font-serif text-[10px] text-slate-900 bg-white">
              {/* 1. Secretaria Geral */}
              <div
                onClick={() => setModalRole("secretaria")}
                className="border-r border-slate-900 p-2.5 flex flex-col justify-between cursor-pointer hover:bg-blue-50/50 transition-all group"
              >
                <div>
                  <div className="flex items-center justify-center gap-1 border-b border-blue-900 pb-1">
                    <span className="font-bold text-blue-900 block text-center  text-[8.5px] tracking-wider">
                      1. SECRETARIA GERAL
                    </span>
                    <PenTool className="w-2.5 h-2.5 text-blue-700 opacity-0 group-hover:opacity-100 transition-opacity print:hidden" />
                  </div>
                  {formData.parecerSecretariaGeral ? (
                    <p className={`italic text-[9px] leading-tight mt-1.5 ${getParecerTextClass(formData.parecerSecretariaGeral)}`}>
                      "{formData.parecerSecretariaGeral}"
                    </p>
                  ) : (
                    <div className="min-h-[24px] flex items-center justify-center">
                      <span className="text-[7.5px] text-slate-300 italic print:hidden font-sans">Em branco</span>
                    </div>
                  )}
                </div>
                <div className="mt-2 pt-1">
                  {formData.assinaturaSecretariaGeral ? (
                    <div className="flex flex-col items-center justify-center text-center">
                      <img src={formData.assinaturaSecretariaGeral} className="h-8 w-auto object-contain mix-blend-multiply mb-0.5" />
                      <p className=" font-black text-slate-900 text-[8px]">{formData.nomeSecretariaGeral || "Secretaria Geral"}</p>
                      <p className="text-[7px] text-slate-500">Data: {formData.dataParecerSecretariaGeral}</p>
                    </div>
                  ) : (
                    <div className="bg-slate-100/80 p-1.5 rounded text-center border border-slate-200 group-hover:bg-blue-100 transition-colors print:hidden">
                      <span className="text-slate-600 font-bold text-[8.5px]">Assinar</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 2. DPEP */}
              <div
                onClick={() => setModalRole("dpep")}
                className="border-r border-slate-900 p-2.5 flex flex-col justify-between cursor-pointer hover:bg-indigo-50/50 transition-all group"
              >
                <div>
                  <div className="flex items-center justify-center gap-1 border-b border-indigo-800 pb-1">
                    <span className="font-bold text-indigo-900 block text-center  text-[8.5px] tracking-wider">
                      2. PARECER DO DPEP
                    </span>
                    <PenTool className="w-2.5 h-2.5 text-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity print:hidden" />
                  </div>
                  {formData.parecerDpep ? (
                    <p className={`italic text-[9px] leading-tight mt-1.5 ${getParecerTextClass(formData.parecerDpep)}`}>
                      "{formData.parecerDpep}"
                    </p>
                  ) : (
                    <div className="min-h-[24px] flex items-center justify-center">
                      <span className="text-[7.5px] text-slate-300 italic print:hidden font-sans">Em branco</span>
                    </div>
                  )}
                </div>
                <div className="mt-2 pt-1">
                  {formData.assinaturaChefeDpep ? (
                    <div className="flex flex-col items-center justify-center text-center">
                      <img src={formData.assinaturaChefeDpep} className="h-8 w-auto object-contain mix-blend-multiply mb-0.5" />
                      <p className=" font-black text-slate-900 text-[8px]">{formData.nomeChefeDpep || "Chefe do DPEP"}</p>
                      <p className="text-[7px] text-slate-500">Data: {formData.dataParecerDpep}</p>
                    </div>
                  ) : (
                    <div className="bg-slate-100/80 p-1.5 rounded text-center border border-slate-200 group-hover:bg-indigo-100 transition-colors print:hidden">
                      <span className="text-slate-600 font-bold text-[8.5px]">Assinar</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 3. DAF */}
              <div
                onClick={() => setModalRole("daf")}
                className="border-r border-slate-900 p-2.5 flex flex-col justify-between cursor-pointer hover:bg-emerald-50/50 transition-all group"
              >
                <div>
                  <div className="flex items-center justify-center gap-1 border-b border-emerald-800 pb-1">
                    <span className="font-bold text-emerald-900 block text-center  text-[8.5px] tracking-wider">
                      3. PARECER DO DAF
                    </span>
                    <PenTool className="w-2.5 h-2.5 text-emerald-700 opacity-0 group-hover:opacity-100 transition-opacity print:hidden" />
                  </div>
                  {formData.parecerDaf ? (
                    <p className={`italic text-[9px] leading-tight mt-1.5 ${getParecerTextClass(formData.parecerDaf)}`}>
                      "{formData.parecerDaf}"
                    </p>
                  ) : (
                    <div className="min-h-[24px] flex items-center justify-center">
                      <span className="text-[7.5px] text-slate-300 italic print:hidden font-sans">Em branco</span>
                    </div>
                  )}
                </div>
                <div className="mt-2 pt-1">
                  {formData.assinaturaChefeDaf ? (
                    <div className="flex flex-col items-center justify-center text-center">
                      <img src={formData.assinaturaChefeDaf} className="h-8 w-auto object-contain mix-blend-multiply mb-0.5" />
                      <p className=" font-black text-slate-900 text-[8px]">{formData.nomeChefeDaf || "Chefe do DAF"}</p>
                      <p className="text-[7px] text-slate-500">Data: {formData.dataParecerDaf}</p>
                    </div>
                  ) : (
                    <div className="bg-slate-100/80 p-1.5 rounded text-center border border-slate-200 group-hover:bg-emerald-100 transition-colors print:hidden">
                      <span className="text-slate-600 font-bold text-[8.5px]">Assinar</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 4. Repartição de Transporte */}
              <div
                onClick={() => setModalRole("transporte")}
                className="p-2.5 flex flex-col justify-between cursor-pointer hover:bg-sky-50/50 transition-all group"
              >
                <div>
                  <div className="flex items-center justify-center gap-1 border-b border-sky-800 pb-1">
                    <span className="font-bold text-sky-900 block text-center  text-[8.5px] tracking-wider">
                      4. REP. TRANSPORTE
                    </span>
                    <PenTool className="w-2.5 h-2.5 text-sky-700 opacity-0 group-hover:opacity-100 transition-opacity print:hidden" />
                  </div>
                  {formData.parecerTransporte ? (
                    <p className={`italic text-[9px] leading-tight mt-1.5 ${getParecerTextClass(formData.parecerTransporte)}`}>
                      "{formData.parecerTransporte}"
                    </p>
                  ) : (
                    <div className="min-h-[24px] flex items-center justify-center">
                      <span className="text-[7.5px] text-slate-300 italic print:hidden font-sans">Em branco</span>
                    </div>
                  )}
                </div>
                <div className="mt-2 pt-1">
                  {formData.assinaturaChefeTransporte ? (
                    <div className="flex flex-col items-center justify-center text-center">
                      <img src={formData.assinaturaChefeTransporte} className="h-8 w-auto object-contain mix-blend-multiply mb-0.5" />
                      <p className=" font-black text-slate-900 text-[8px]">{formData.nomeChefeTransporte || "Chefe de Transporte"}</p>
                      <p className="text-[7px] text-slate-500">Data: {formData.dataParecerTransporte}</p>
                    </div>
                  ) : (
                    <div className="bg-slate-100/80 p-1.5 rounded text-center border border-slate-200 group-hover:bg-sky-100 transition-colors print:hidden">
                      <span className="text-slate-600 font-bold text-[8.5px]">Assinar</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Rodapé Oficial da Segunda Página */}
          <DocumentFooter className="mt-8" />
        </div>
      </div>

      {/* Modal Interativo de Assinatura e Escolha de Despacho */}
      <ModalDespachoAssinatura
        role={modalRole}
        onClose={() => setModalRole(null)}
        formData={formData}
        setFormData={setFormData}
        user={user}
      />

      {/* Modal de Seleção de Assinante para Envio */}
      <SignerPicker
        isOpen={showSignerModal}
        onClose={() => setShowSignerModal(false)}
        onConfirm={(signer) => {
          setSelectedSigner(signer);
          handleFinalSubmit(signer);
        }}
        nextStep={
          (() => {
            const userCargo = (user?.cargo || user?.role || user?.funcao || "").toLowerCase();
            const isUserChefe = 
              userCargo.includes("chefe") || 
              userCargo.includes("diretor") || 
              userCargo.includes("director") || 
              userCargo.includes("responsável") || 
              userCargo.includes("adjunto");
            return isUserChefe ? "Secretaria Geral" : "Chefe do Departamento";
          })()
        }
        siglaUnidade={formData.siglaUnidade}
        isSubmitting={isSubmitting}
      />
    </FormLayout>
  );
}
