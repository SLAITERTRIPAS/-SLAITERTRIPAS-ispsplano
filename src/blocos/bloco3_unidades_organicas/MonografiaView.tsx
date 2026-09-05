import { printElementById } from "../../lib/printUtils";
import React, { useState, useEffect } from "react";
import {
  FileText,
  Download,
  ArrowLeft,
  BookOpen,
  RefreshCw,
  Edit3,
  X,
  Save,
  Cloud,
} from "lucide-react";
import { ProcessingCircle } from "../../components/ui/ProcessingCircle";
import { ABBREVIATIONS } from "../../constants/abbreviations";
import { firestoreService } from "../../lib/firestoreService";
// @ts-ignore
import html2pdf from "html2pdf.js";

interface MonografiaViewProps {
  onBack: () => void;
  title: string;
  systemData?: {
    eventsCount: number;
    expedientesCount: number;
    libraryCount: number;
    booksCount: number;
    colaboradoresCount: number;
    alocacoesCount: number;
    version: string;
  };
}

export default function MonografiaView({
  onBack,
  title,
  systemData,
}: MonografiaViewProps) {
  const currentDate = new Date();
  const year = currentDate.getFullYear();

  const [isUpdating, setIsUpdating] = useState(false);
  const [isUpdated, setIsUpdated] = useState(false);
  const [showSystemInfo, setShowSystemInfo] = useState(false);
  const [showEditPanel, setShowEditPanel] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>(
    new Date().toLocaleString("pt-PT"),
  );
  const [isSaving, setIsSaving] = useState(false);

  const [authorName, setAuthorName] = useState("SLAITER TRIPAS");
  const [monoTitle, setMonoTitle] = useState(
    "SIGEP: Sistema integrado de gestão de processos do Instituto Superior Politécnico de Songo",
  );
  const [orientador, setOrientador] = useState("Eng. Robone");
  const [dedicatoriaText, setDedicatoriaText] = useState(
    "Dedicado à minha família no geral, pilares da minha formação, cujo amor, paciência e sacrifício pavimentaram o caminho para que este sonho se tornasse realidade.\n\nÀ minha amada esposa e filhos, pelo amparo constante, pelas palavras de incentivo nos momentos mais desafiadores e pela presença reconfortante ao longo de toda esta jornada académica.\n\nAos meus colegas e amigos de curso, pela partilha de conhecimentos, pelas longas noites de estudo e por tornarem esta caminhada inesquecível.\nAos meus amigos Luís Domingos Franque e Gerson Bernardo Chaibande, pelo incentivo e muito esforço de me instruir a começar a trabalhar muito cedo no projeto de final de curso.\n\nAo meu tutor Robone Carvalho, pela paciência e motivação que tem me dado até agora.",
  );
  const [agradecimentosText, setAgradecimentosText] = useState(
    "Agradeço primeiramente a Deus pela sabedoria e força concedidas durante este percurso. Ao meu orientador, pelas orientações valiosas e paciência dedicada. À Universidade Púnguè – Extensão de Tete, pela oportunidade de formação académica. Ao Instituto Superior Politécnico de Songo, pela disponibilidade em ceder informações institucionais. Aos colegas de curso, pela partilha de conhecimentos e experiências. Por fim, à minha família, pelo incentivo constante e compreensão nos momentos de ausência.",
  );
  const [resumoText, setResumoText] = useState(
    'A presente monografia aborda o desenvolvimento do SIGEP (Sistema integrado de gestão de processos) para o Instituto Superior Politécnico de Songo, instituição pública de ensino superior situada na Vila de Songo, Distrito de Cahora Bassa. O estudo analisa a estrutura organizacional do Songo, composta por órgãos de direcção e gestão, unidades orgânicas e unidade orgânica, bem como os sete cursos de engenharia oferecidos. O trabalho propõe uma solução informática integrada que automatiza processos completos de gestão académicos e administrativos, completando as limitações que o sistema atual SIGPro-Songo não permite, o SIGPro-Songo está voltado para a gestão estudantil financeira e aproveitamento pedagógico. A pesquisa fundamenta-se na análise documental, entrevistas com dirigentes e observação participante, resultando num modelo de sistema que integra gestão de estudantes, novos ingressos, matrículas e graduados, gestão documental, comunicação interna, gestão de correspondências e recursos humanos. O SIGEP visa melhorar a eficiência operacional, transparência institucional e experiência dos utilizadores, alinhando-se com o lema do Songo: "Uma escola superior de engenharia para o sector de energia".',
  );
  const [abstractText, setAbstractText] = useState(
    'This monograph addresses the development of SIGEP (Integrated Process Management System) for the Instituto Superior Politécnico de Songo, a public higher education institution located in Songo Village, Cahora Bassa District. The study analyzes the organizational structure of Songo, composed of management bodies, organic units, and central services, as well as the seven engineering courses offered. The work proposes an integrated IT solution that automates academic, administrative, and financial processes, overcoming the limitations of the current SIGPro-Songo system. The research is based on document analysis, interviews with managers, and participant observation, resulting in a system model that integrates student management, enrollments, tuition fees, assessments, and human resources. SIGEP aims to improve operational efficiency, institutional transparency, and user experience, aligning with Songo\'s motto: "A higher engineering school for the energy sector".',
  );

  useEffect(() => {
    // Subscribe to monografia in real-time
    const unsubscribe = firestoreService.monografia.subscribe((data) => {
      const doc = data.find((d) => d.id === "main_mono");
      if (doc) {
        if (doc.authorName) setAuthorName(doc.authorName);
        if (doc.monoTitle) setMonoTitle(doc.monoTitle);
        if (doc.orientador) setOrientador(doc.orientador);
        if (doc.dedicatoriaText) setDedicatoriaText(doc.dedicatoriaText);
        if (doc.agradecimentosText)
          setAgradecimentosText(doc.agradecimentosText);
        if (doc.resumoText) setResumoText(doc.resumoText);
        if (doc.abstractText) setAbstractText(doc.abstractText);
      } else {
        // Fallback to localStorage for migration
        const savedAuthor = localStorage.getItem("mono_authorName");
        if (savedAuthor) setAuthorName(savedAuthor);
        const savedTitle = localStorage.getItem("mono_title");
        if (savedTitle) setMonoTitle(savedTitle);
        // ... other fallbacks if needed, but the defaults are already in state
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSaveMono = async () => {
    setIsSaving(true);
    try {
      await firestoreService.monografia.set("main_mono", {
        authorName,
        monoTitle,
        orientador,
        dedicatoriaText,
        agradecimentosText,
        resumoText,
        abstractText,
        updatedAt: new Date().toISOString(),
      });

      // Update local storage too for redundancy
      localStorage.setItem("mono_authorName", authorName);
      localStorage.setItem("mono_title", monoTitle);
      localStorage.setItem("mono_orientador", orientador);
      localStorage.setItem("mono_dedicatoria_v3", dedicatoriaText);
      localStorage.setItem("mono_agradecimentos", agradecimentosText);
      localStorage.setItem("mono_resumo_v3", resumoText);
      localStorage.setItem("mono_abstract", abstractText);

      setIsUpdated(true);
      setTimeout(() => setIsUpdated(false), 3000);
    } catch (err) {
      console.error("Erro ao salvar monografia:", err);
      alert("Erro ao salvar dados na base de dados central.");
    } finally {
      setIsSaving(false);
    }
  };

  const systemSpecs = {
    nome: "SIGEP Pro (Sistema Integrado de Gestão de Planificação)",
    edicao: "Songo Educational Enterprise",
    versao: "2026.05.01-stable",
    tipo: "Arquitetura 64-bit Core (Web-Based)",
    compilacao: "10.0.22621.1702 (Songo_REL)",
    experiencia: "SIGEP Feature Experience Pack 1000.22641.1000.0",
  };

  useEffect(() => {
    setLastUpdated(new Date().toLocaleTimeString());
  }, [systemData]);

  const handleUpdate = () => {
    setIsUpdating(true);
    setTimeout(() => {
      setIsUpdating(false);
      setIsUpdated(true);
      setLastUpdated(new Date().toLocaleString("pt-PT"));
      setTimeout(() => setIsUpdated(false), 3000);
    }, 1500);
  };

  const createBlankPages = (
    startId: string,
    titlePrefix: string,
    pageCount: number,
  ) => {
    return Array(pageCount)
      .fill(0)
      .map((_, i) => ({
        id: `${startId}-${i}`,
        title: i === 0 ? titlePrefix : `${titlePrefix} (Cont. ${i + 1})`,
        content: (
          <div className="space-y-6 font-serif text-justify h-full flex flex-col justify-center items-center opacity-50">
            <p className="text-xl">Conteúdo da página em desenvolvimento...</p>
            <p className="text-sm">
              (Preenchimento estrutural para garantir a formatação completa)
            </p>
          </div>
        ),
      }));
  };

  const generatedSections = [
    // Page 1
    {
      id: "capa",
      title: "Capa",
      content: (
        <div className="flex flex-col items-center justify-between h-full min-h-[800px] border-2 border-gray-200 p-16 text-center font-serif">
          <div className="space-y-4">
            <h1 className="text-2xl font-bold">
              Universidade Púnguè
              <br />
              Extensão de Tete
            </h1>
            <h2 className="text-xl">
              Curso de Licenciatura em Informática Aplicada
            </h2>
          </div>
          <div className="space-y-8 mt-16">
            <p className="text-xl font-bold">{authorName}</p>
          </div>
          <div className="space-y-8 mt-16">
            <h3 className="text-2xl font-black">{monoTitle}</h3>
          </div>
          <div className="space-y-2 mt-auto">
            <p className="text-lg">Tete – Moçambique</p>
            <p className="text-4xl font-bookman-bordado">{year}</p>
          </div>
        </div>
      ),
    },
    // Page 2
    {
      id: "folha-rosto",
      title: "Folha de rosto",
      content: (
        <div className="flex flex-col items-center justify-between h-full min-h-[800px] border-2 border-gray-200 p-16 font-serif text-center">
          <p className="text-xl font-bold">{authorName}</p>
          <div className="space-y-6 w-full mt-16">
            <h3 className="text-2xl font-black">{monoTitle}</h3>
            <div className="ml-auto w-1/2 text-left text-sm font-sans p-4 border-l-2 border-gray-300">
              Trabalho de fim de curso apresentado ao curso de Licenciatura em
              Informática Aplicada da Universidade Púnguè – Extensão de Tete,
              como requisito parcial para obtenção do grau de Licenciado em
              Informática Aplicada.
              <br />
              <br />
              <strong>Orientador:</strong> {orientador}
            </div>
          </div>
          <div className="text-center space-y-2 mt-auto">
            <p className="text-lg">Tete – Moçambique</p>
            <p className="text-4xl font-bookman-bordado">{year}</p>
          </div>
        </div>
      ),
    },
    // Page 3
    {
      id: "dedicatoria",
      title: "Dedicatória",
      content: (
        <div className="space-y-6 font-serif text-justify h-full min-h-[600px] flex items-end justify-end pb-12 pr-6">
          <div className="w-2/3 text-right space-y-3">
            {dedicatoriaText
              .split("\n")
              .filter((p) => p.trim() !== "")
              .map((paragraph, idx) => (
                <p
                  key={idx}
                  className="italic text-base leading-relaxed text-slate-800"
                >
                  {paragraph}
                </p>
              ))}
          </div>
        </div>
      ),
    },
    // Page 4
    {
      id: "agradecimentos",
      title: "Agradecimentos",
      content: (
        <div className="space-y-6 font-serif text-justify">
          <h3 className="text-xl font-bold text-center mb-8">Agradecimentos</h3>
          {agradecimentosText
            .split("\n")
            .filter((p) => p.trim() !== "")
            .map((paragraph, idx) => (
              <p key={idx} className="text-base leading-relaxed indent-8 mb-4">
                {paragraph}
              </p>
            ))}
        </div>
      ),
    },
    // Page 5
    {
      id: "resumo",
      title: "Resumo",
      content: (
        <div className="space-y-6 font-serif text-justify">
          <h3 className="text-xl font-bold text-center mb-8">Resumo</h3>
          {resumoText
            .split("\n")
            .filter((p) => p.trim() !== "")
            .map((paragraph, idx) => (
              <p key={idx} className="text-base leading-relaxed indent-8 mb-4">
                {paragraph}
              </p>
            ))}
          <p className="mt-8">
            <strong>Palavras-chave:</strong> SIGEP, Songo, Gestão académica,
            Sistemas de informação, Engenharia, Moçambique.
          </p>
        </div>
      ),
    },
    // Page 6
    {
      id: "abstract",
      title: "Abstract",
      content: (
        <div className="space-y-6 font-serif text-justify">
          <h3 className="text-xl font-bold text-center mb-8">Abstract</h3>
          {abstractText
            .split("\n")
            .filter((p) => p.trim() !== "")
            .map((paragraph, idx) => (
              <p
                key={idx}
                className="italic text-base leading-relaxed indent-8 mb-4"
              >
                {paragraph}
              </p>
            ))}
          <p className="mt-8">
            <strong>Keywords:</strong> SIGEP, Songo, Academic Management,
            Information Systems, Engineering, Mozambique.
          </p>
        </div>
      ),
    },
    // Page 7
    {
      id: "listas",
      title: "Lista de Abreviaturas e Siglas",
      content: (
        <div className="space-y-6 font-serif text-justify">
          <h3 className="text-xl font-bold text-center mb-8">
            Lista de Abreviaturas e Siglas
          </h3>
          <div className="grid grid-cols-[100px_1fr] gap-x-4 gap-y-2 text-base leading-relaxed">
            <div className="font-bold">ABNT</div>
            <div>Associação Brasileira de Normas Técnicas</div>
            <div className="font-bold">BPM</div>
            <div>
              Business Process Management (Gestão de Processos de Negócio)
            </div>
            <div className="font-bold">BPMN</div>
            <div>
              Business Process Model and Notation (Notação e Modelo de Processos
              de Negócio)
            </div>
            <div className="font-bold">CAG</div>
            <div>Conselho Administrativo e de Gestão</div>
            <div className="font-bold">CTA</div>
            <div>Corpo Técnico e Administrativo</div>
            <div className="font-bold">CTQ</div>
            <div>Conselho Técnico e de Qualidade</div>
            <div className="font-bold">ERP</div>
            <div>
              Enterprise Resource Planning (Planeamento de Recursos
              Empresariais)
            </div>
            <div className="font-bold">HCB</div>
            <div>Hidroeléctrica de Cahora Bassa</div>
            <div className="font-bold">IES</div>
            <div>Instituição de Ensino Superior</div>
            <div className="font-bold">IHC</div>
            <div>Interação Humano-Computador</div>
            <div className="font-bold">Songo</div>
            <div>Instituto Superior Politécnico de Songo</div>
            <div className="font-bold">KPI</div>
            <div>Key Performance Indicator (Indicador-Chave de Desempenho)</div>
            <div className="font-bold">MCTES</div>
            <div>Ministério da Ciência, Tecnologia e Ensino Superior</div>
            <div className="font-bold">NBR</div>
            <div>Norma Brasileira</div>
            <div className="font-bold">PDF</div>
            <div>Portable Document Format</div>
            <div className="font-bold">RBAC</div>
            <div>
              Role-Based Access Control (Controlo de Acesso Baseado em Papéis)
            </div>
            <div className="font-bold">SIGEP</div>
            <div>Sistema Integrado de Gestão de Planificação</div>
            <div className="font-bold">SIGPro</div>
            <div>Sistema de Gestão de Planificação</div>
            <div className="font-bold">SO</div>
            <div>Sistema Operativo</div>
            <div className="font-bold">SSL</div>
            <div>Secure Sockets Layer</div>
            <div className="font-bold">TIC</div>
            <div>Tecnologias de Informação e Comunicação</div>
            <div className="font-bold">UGEA</div>
            <div>Unidade Gestora e Executora de Aquisições</div>
            <div className="font-bold">UI</div>
            <div>User Interface (Interface do Utilizador)</div>
            <div className="font-bold">UX</div>
            <div>User Experience (Experiência do Utilizador)</div>
          </div>
        </div>
      ),
    },
    // Page 8
    {
      id: "sumario",
      title: "Sumário",
      content: (
        <div className="space-y-2 font-serif text-justify">
          <h3 className="text-xl font-bold text-center mb-8">Sumário</h3>

          <div className="flex justify-between items-end border-b border-dotted border-gray-400 mb-2">
            <span className="font-medium bg-white pr-2">Agradecimentos</span>
            <span className="bg-white pl-2">iii</span>
          </div>
          <div className="flex justify-between items-end border-b border-dotted border-gray-400 mb-2">
            <span className="font-medium bg-white pr-2">Resumo</span>
            <span className="bg-white pl-2">iv</span>
          </div>
          <div className="flex justify-between items-end border-b border-dotted border-gray-400 mb-2">
            <span className="font-medium bg-white pr-2">Abstract</span>
            <span className="bg-white pl-2">v</span>
          </div>
          <div className="flex justify-between items-end border-b border-dotted border-gray-400 mb-4">
            <span className="font-medium bg-white pr-2">
              Lista de Abreviaturas e Siglas
            </span>
            <span className="bg-white pl-2">vi</span>
          </div>

          <div className="flex justify-between items-end border-b border-dotted border-gray-400 mb-2 mt-4">
            <span className="font-bold bg-white pr-2">1 INTRODUÇÃO</span>
            <span className="bg-white pl-2">1</span>
          </div>
          <div className="flex justify-between items-end border-b border-dotted border-gray-400 mb-1 ml-4">
            <span className="bg-white pr-2">1.1 Contextualização do Tema</span>
            <span className="bg-white pl-2">1</span>
          </div>
          <div className="flex justify-between items-end border-b border-dotted border-gray-400 mb-1 ml-4">
            <span className="bg-white pr-2">1.2 Justificativa da Escolha</span>
            <span className="bg-white pl-2">1</span>
          </div>
          <div className="flex justify-between items-end border-b border-dotted border-gray-400 mb-1 ml-4">
            <span className="bg-white pr-2">1.3 Objetivos</span>
            <span className="bg-white pl-2">2</span>
          </div>
          <div className="flex justify-between items-end border-b border-dotted border-gray-400 mb-2 ml-4">
            <span className="bg-white pr-2">1.4 Estrutura do Trabalho</span>
            <span className="bg-white pl-2">2</span>
          </div>

          <div className="flex justify-between items-end border-b border-dotted border-gray-400 mb-2 mt-4">
            <span className="font-bold bg-white pr-2">
              2 REVISÃO DA LITERATURA / FUNDAMENTAÇÃO TEÓRICA
            </span>
            <span className="bg-white pl-2">3</span>
          </div>
          <div className="flex justify-between items-end border-b border-dotted border-gray-400 mb-1 ml-4">
            <span className="bg-white pr-2">2.1 Estado da arte</span>
            <span className="bg-white pl-2">3</span>
          </div>
          <div className="flex justify-between items-end border-b border-dotted border-gray-400 mb-2 ml-4">
            <span className="bg-white pr-2">
              2.2 Principais autores e teorias
            </span>
            <span className="bg-white pl-2">4</span>
          </div>

          <div className="flex justify-between items-end border-b border-dotted border-gray-400 mb-2 mt-4">
            <span className="font-bold bg-white pr-2">
              4 DESENVOLVIMENTO DO SISTEMA (SIGEP)
            </span>
            <span className="bg-white pl-2">6</span>
          </div>
          <div className="flex justify-between items-end border-b border-dotted border-gray-400 mb-1 ml-4">
            <span className="bg-white pr-2">
              4.1 Descrição Exaustiva da Capa (Portal de Entrada)
            </span>
            <span className="bg-white pl-2">6</span>
          </div>
          <div className="flex justify-between items-end border-b border-dotted border-gray-400 mb-1 ml-4">
            <span className="bg-white pr-2">
              4.2 Descrição Exaustiva do Menu Principal
            </span>
            <span className="bg-white pl-2">7</span>
          </div>
          <div className="flex justify-between items-end border-b border-dotted border-gray-400 mb-1 ml-4">
            <span className="bg-white pr-2">4.3 Órgão de Direção e Gestão</span>
            <span className="bg-white pl-2">9</span>
          </div>
          <div className="flex justify-between items-end border-b border-dotted border-gray-400 mb-1 ml-4">
            <span className="bg-white pr-2">
              4.4 Órgãos (Estrutura e Gestão)
            </span>
            <span className="bg-white pl-2">12</span>
          </div>
          <div className="flex justify-between items-end border-b border-dotted border-gray-400 mb-1 ml-4">
            <span className="bg-white pr-2">
              4.5 Unidade Orgânica (Governação Administrativa)
            </span>
            <span className="bg-white pl-2">14</span>
          </div>
          <div className="flex justify-between items-end border-b border-dotted border-gray-400 mb-2 ml-4">
            <span className="bg-white pr-2">
              4.6 Infraestrutura do Sistema SIGEP
            </span>
            <span className="bg-white pl-2">17</span>
          </div>

          <div className="flex justify-between items-end border-b border-dotted border-gray-400 mb-2 mt-4">
            <span className="font-bold bg-white pr-2">
              REFERÊNCIAS BIBLIOGRÁFICAS
            </span>
            <span className="bg-white pl-2">18</span>
          </div>
          <div className="flex justify-between items-end border-b border-dotted border-gray-400 mb-2 mt-2">
            <span className="font-bold bg-white pr-2">Apêndices</span>
            <span className="bg-white pl-2">19</span>
          </div>
          <div className="flex justify-between items-end border-b border-dotted border-gray-400 mb-2 mt-2">
            <span className="font-bold bg-white pr-2">Anexos</span>
            <span className="bg-white pl-2">20</span>
          </div>
        </div>
      ),
    },
    // Page 9
    {
      id: "introducao",
      title: "1. Introdução",
      content: (
        <div className="space-y-6 font-serif text-justify">
          <h3 className="text-xl font-bold mb-4">1 INTRODUÇÃO</h3>
          <h4 className="font-bold">1.1 Contextualização do Tema</h4>
          <p>
            O Instituto Superior Politécnico de Songo é uma instituição
            pública de ensino superior criada pelo Conselho de Ministros através
            do Decreto n.º 22/2008 de 27 de Julho, situada na Vila de Songo,
            Distrito de Cahora Bassa. Iniciou as suas actividades lectivas em
            2009 e actualmente leciona sete cursos de graduação nas áreas de
            engenharia eléctrica, hidráulica, termotécnica, energias renováveis,
            construção mecânica, construção civil e electrónica e
            telecomunicações.
          </p>
          <p>
            A instituição possui como lema "Uma escola superior de engenharia
            para o sector de energia", reflectindo a sua ligação estratégica com
            a Hidroeléctrica de Cahora Bassa (HCB), uma das maiores
            infraestruturas energéticas de África. Esta simbiose com o sector
            energético confere ao Songo um papel singular no panorama do ensino
            superior moçambicano, formando engenheiros de elite para o sector.
          </p>
          <p>
            No entanto, a gestão dos processos académicos, administrativos e
            financeiros do Songo enfrenta desafios significativos. O sistema
            actual, denominado SIGPro-Songo (Sistema de Gestão Académica),
            apresenta limitações que comprometem a eficiência operacional, por
            estar voltado essencialmente para a gestão estudantil financeira e
            aproveitamento pedagógico. A necessidade de um sistema mais robusto,
            integrado e que abranja outras áreas vitais — como gestão de novos
            ingressos, graduados, gestão documental, comunicação interna e
            recursos humanos — torna-se imperativa para sustentar o crescimento
            institucional e manter o padrão de excelência académica.
          </p>
          <p>
            Neste contexto, o presente trabalho propõe o desenvolvimento do
            SIGEP (Sistema Integrado de Gestão de Planificação), uma solução
            informática abrangente que visa automatizar e integrar os processos
            completos de gestão académicos e administrativos do Songo, superando
            as lacunas identificadas no sistema actual.
          </p>

          <h4 className="font-bold mt-6">1.2 Justificativa da Escolha</h4>
          <p>
            A escolha do Songo como caso de estudo fundamenta-se em vários
            factores: relevância institucional para o desenvolvimento do país,
            complexidade organizacional da sua estrutura, contexto geográfico
            específico decorrente do seu relativo isolamento, ligação intrínseca
            com o sector energético e a oportunidade inegável de aplicar
            inovações tecnológicas para otimizar os seus fluxos de trabalho e de
            correspondências.
          </p>

          <h4 className="font-bold mt-6">1.3 Objetivos</h4>
          <p>
            <strong>1.3.1 Objetivo Geral:</strong> Desenvolver o SIGEP (Sistema
            Integrado de Gestão de Planificação) para o Instituto Superior
            Politécnico de Songo (Songo), integrando de forma abrangente
            processos académicos, administrativos, de recursos humanos e gestão
            documental numa plataforma unificada.
          </p>
          <p>
            <strong>1.3.2 Objetivos Específicos:</strong> Analisar a estrutura
            organizacional do Songo; Avaliar as limitações do sistema actual
            SIGPro-Songo; Levantar requisitos e propor uma arquitetura
            tecnológica escalável; Modelar processos organizacionais, fluxos de
            dados e interfaces; Desenvolver o protótipo e avaliar a sua
            viabilidade no ecossistema da instituição.
          </p>

          <h4 className="font-bold mt-6">1.4 Estrutura do Trabalho</h4>
          <p>
            O presente trabalho está estruturado em seis capítulos. O primeiro
            capítulo apresenta a introdução. O segundo capítulo aborda a revisão
            da literatura e fundamentação teórica. O terceiro capítulo descreve
            a metodologia aplicada. O quarto e o quinto capítulos apresentam o
            desenvolvimento do sistema, resultados e discussões. E por fim, o
            sexto capítulo expõe as conclusões e recomendações.
          </p>
        </div>
      ),
    },
    {
      id: "revisao",
      title: "2. Revisão da Literatura / Fundamentação Teórica",
      content: (
        <div className="space-y-6 font-serif text-justify">
          <h3 className="text-xl font-bold mb-4">
            2 REVISÃO DA LITERATURA / FUNDAMENTAÇÃO TEÓRICA
          </h3>

          <h4 className="font-bold">2.1 Estado da arte</h4>
          <p>
            O desenvolvimento de Sistemas Integrados de Gestão, também
            conhecidos como Enterprise Resource Planning (ERP), no contexto de
            instituições de ensino superior (IES), tem sido um campo de intensa
            pesquisa e inovação. A adoção destas plataformas visa unificar dados
            e processos, historicamente dispersos em silos departamentais,
            promovendo uma visão holística e em tempo real da vida académica e
            administrativa.
          </p>
          <p>
            Estudos de autores como Laudon e Laudon (2021) evidenciam que,
            embora os ERPs tenham origem no sector industrial, a sua adaptação
            para o ambiente educativo requer módulos específicos, tais como
            gestão de currículos, histórico académico, controlo de propinas e
            bibliotecas. Trabalhos empíricos recentes demonstram que as IES que
            implementam soluções integradas robustas reduzem falhas de
            comunicação, melhoram os tempos de resposta aos estudantes e
            aumentam a transparência financeira.
          </p>
          <p>
            No contexto moçambicano, a transição para sistemas digitais de
            gestão tem sido gradual. Enquanto algumas universidades já dispõem
            de sistemas maduros, outras ainda enfrentam desafios estruturais. O
            caso do SIGPro, atual sistema do Songo, ilustra um esforço inicial de
            digitalização que, perante o crescimento da instituição, tornou-se
            insuficiente, justificando a conceptualização do SIGEP como uma
            evolução necessária para o estado da arte e alinhada às melhores
            práticas internacionais.
          </p>

          <h4 className="font-bold mt-6">2.2 Principais autores e teorias</h4>
          <p>
            A fundamentação deste trabalho assenta em teorias de Sistemas de
            Informação, Engenharia de Software e Gestão de Processos de Negócio.
            Os princípios de Engenharia de Software preconizados por Sommerville
            (2018) guiam o ciclo de desenvolvimento do SIGEP, desde a engenharia
            de requisitos através do modelo iterativo e incremental.
          </p>
          <p>
            No que respeita à Gestão de Processos de Negócio (BPM), a notação
            BPMN (Business Process Model and Notation) é adotada para analisar e
            otimizar os fluxos de trabalho antes da sua informatização,
            baseando-se nos estudos de Dumas et al. (2018), que enfatizam que a
            automação sem a prévia otimização de processos resulta apenas na
            aceleração da ineficiência.
          </p>
          <p>
            Em complemento, aplicam-se teorias da Interação Humano-Computador
            (IHC) para garantir que as interfaces sejam consistentes, intuitivas
            e adequadas ao contexto diversificado dos utilizadores (estudantes,
            docentes e CTA), e teorias de segurança da informação fundamentais
            na atual legislação de proteção de dados.
          </p>
        </div>
      ),
    },
    // CAPÍTULO 4 - DESENVOLVIMENTO (Páginas 24 em diante)
    {
      id: "desenvolvimento-capa",
      title: "4.1 Capa e Portal de Acesso",
      content: (
        <div className="space-y-6 font-serif text-justify">
          <h3 className="text-xl font-bold mb-4">
            4 DESENVOLVIMENTO DO SISTEMA (SIGEP)
          </h3>
          <h4 className="font-bold">
            4.1 Descrição Exaustiva da Capa (Portal de Entrada)
          </h4>
          <p>
            O Portal de Entrada do SIGEP foi projetado como a face institucional
            e segura do sistema. Seus elementos exaustivos incluem:
          </p>
          <ul className="list-disc ml-8 space-y-2">
            <li>
              <strong>Cabeçalho Institucional:</strong> Contém o logótipo em
              alta definição do Songo, centrado para transmitir solenidade e
              autoridade institucional.
            </li>
            <li>
              <strong>Módulo de Autenticação Segura:</strong> Interface com
              campos para Email Institucional e Password. Inclui funcionalidade
              de "Olhar" para visibilidade da senha e link para Recuperação de
              Senha via email.
            </li>
            <li>
              <strong>Painel Informativo Dinâmico (Sidebar):</strong> Área
              lateral que exibe estatísticas em tempo real, como o número de{" "}
              <strong>{systemData?.colaboradoresCount || 178}</strong>{" "}
              colaboradores ativos e{" "}
              <strong>{systemData?.alocacoesCount || 0}</strong> alocações
              docentes vigentes, garantindo que o gestor tenha dados imediatos
              antes do acesso profundo.
            </li>
            <li>
              <strong>Identidade e Branding:</strong> Imagens de fundo em alta
              resolução (4K) que alternam via sistema 'Carousel', mostrando a
              infraestrutura do Songo, reforçando o pertencimento geográfico e
              sectorial.
            </li>
            <li>
              <strong>Segurança e Compliance:</strong> Rodapé técnico
              apresentando o selo de conexão encriptada (SSL), versão do sistema
              (v2.5.0) e link para a Política de Privacidade e Termos de Uso.
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: "desenvolvimento-menu",
      title: "4.2 Menu Principal e Navegação",
      content: (
        <div className="space-y-6 font-serif text-justify">
          <h4 className="font-bold">
            4.2 Descrição Exaustiva do Menu Principal
          </h4>
          <p>
            O Menu Principal é a central de inteligência do utilizador. Sua
            estrutura exaustiva abrange:
          </p>
          <ul className="list-disc ml-8 space-y-2">
            <li>
              <strong>Mosaico de Micro-Serviços (Cards):</strong> Sistema de
              grelha (Grid) responsivo com ícones vetoriais. Cada card (ex:
              Pessoal, Orçamento, Académico) exibe o total de registos ou
              pendências, permitindo uma triagem visual rápida da saúde
              institucional.
            </li>
            <li>
              <strong>Menu Lateral de Contexto:</strong> Uma barra flutuante que
              permite saltar rapidamente entre o Dashboard e as Repartições, com
              suporte a estados 'Ativo' e 'Hover' para facilitar a orientação do
              utilizador.
            </li>
            <li>
              <strong>Perfil e Ações de Utilizador:</strong> Localizado no canto
              superior direito, mostra o avatar dinâmico puxado do Processo
              Individual e botão de Logout seguro.
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: "desenvolvimento-direcao-exaustiva",
      title: "4.3 Órgão de Direção e Gestão",
      content: (
        <div className="space-y-6 font-serif text-justify">
          <h4 className="font-bold text-lg">4.3 Órgão de Direção e Gestão</h4>
          <p>
            A estrutura de governação do Songo, conforme os seus estatutos, é
            composta por órgãos colegiais e executivos que asseguram a direção
            estratégica, académica e administrativa da instituição. A integração
            destas funções no SIGEP permite uma gestão unificada e eficiente.
          </p>

          <h5 className="font-bold border-b border-blue-900 pb-1 mt-4">
            4.3.1 Conselho de Representantes
          </h5>
          <p>
            <strong>Composição:</strong> Integrado por representantes do
            Ministério da Ciência, Tecnologia e Ensino Superior (MCTES),
            Gabinete do Diretor-Geral do Songo, representantes docentes,
            funcionários (CTA) e estudantes.
            <br />
            <strong>Funcionalidade:</strong> É o órgão de cúpula responsável
            pela definição das grandes políticas, aprovação dos planos
            estratégicos de longo prazo e fiscalização da gestão financeira. No
            SIGEP, tem acesso ao "Relatório de Gestão Consolidado", permitindo a
            fiscalização em tempo real das metas orçamentais.
          </p>

          <h5 className="font-bold border-b border-blue-900 pb-1 mt-6">
            4.3.2 Gabinete do Diretor-Geral e Departamentos Subordinados
          </h5>
          <p>
            <strong>Composição:</strong> O Gabinete é composto pelo
            Diretor-Geral, Chefe do GDG, Secretaria Executiva, Departamento de
            Planificação, Estudos e Projetos, Unidade Gestora e Executora de
            Aquisições e o Departamento de Cooperação e Relações Exteriores.
            <br />
            <strong>Funcionalidade:</strong> É o órgão executivo de topo da
            instituição, responsável pela condução superior, coordenação geral e
            representação externa do Songo. Compete-lhe assegurar o cumprimento
            das deliberações dos órgãos superiores, dirigir as unidades
            orgânicas e assegurar o funcionamento administrativo corrente. No
            contexto do SIGEP, a Gabinete do Diretor-Geral atua como o centro de
            comando digital: centraliza a assinatura eletrónica de despachos,
            automatizando o fluxo documental, monitoriza em tempo real os
            principais indicadores de desempenho (KPIs) e articula as políticas
            institucionais com a execução orçamental e académica.
          </p>
          <p className="mt-4">
            Sob a alçada e supervisão direta do Diretor-Geral, operam os
            seguintes departamentos, que estão diretamente integrados nos fluxos
            do SIGEP:
          </p>
          <ul className="list-disc ml-8 space-y-2 mt-2">
            <li>
              <strong>Chefe do GDG:</strong> Coordena as actividades
              técnico-administrativas do gabinete e assessora diretamente o
              Diretor-Geral. No SIGEP, faz a triagem documental, elabora e
              tramita propostas de despacho e faz a gestão de expedientes
              prioritários.
            </li>
            <li>
              <strong>Secretaria Executiva:</strong> Assegura o secretariado,
              gestão de agenda e apoio logístico à Gabinete do Diretor-Geral. No
              SIGEP, centraliza a gestão de correspondências, regista a entrada
              e saída de ofícios, e gere a agenda institucional digital.
            </li>
            <li>
              <strong>Departamento de Planificação Estudos e Projetos:</strong>{" "}
              Ocupa-se da planificação estratégica e avaliação do desempenho
              institucional. No SIGEP, divide-se em:
              <ul className="list-[square] ml-6 mt-1 space-y-1 text-sm text-gray-800">
                <li>
                  <em>Repartição de Planificação e Estatística:</em> Compila e
                  analisa métricas em tempo real para a elaboração de relatórios
                  consubstanciados sobre o cumprimento de metas.
                </li>
                <li>
                  <em>Repartição de Estudos e Projetos Institucionais:</em>{" "}
                  Coordena a elaboração técnica do plano de actividades anual e
                  acompanha a execução de projetos de modernização
                  institucional.
                </li>
              </ul>
            </li>
            <li>
              <strong>Unidade Gestora e Executora de Aquisições (UGEA):</strong>{" "}
              Responsável pela gestão dos processos de contratação pública,
              aquisição de bens e serviços. No SIGEP, este módulo automatiza o
              registo de fornecedores, gere processos de requisição de compras,
              tramita contratos e acompanha a execução do orçamento destinado a
              aquisições institucionais.
            </li>
            <li>
              <strong>Departamento de Cooperação e Relações Exteriores:</strong>{" "}
              Gere a imagem institucional, parcerias e memorandos. No sistema
              SIGEP, subdivide-se em:
              <ul className="list-[square] ml-6 mt-1 space-y-1 text-sm text-gray-800">
                <li>
                  <em>Repartição de Cooperação Internacional e Mobilidade:</em>{" "}
                  Gere a base de dados de protocolos estrangeiros e monitoriza
                  os intercâmbios de estudantes e docentes.
                </li>
                <li>
                  <em>Repartição de Relações Públicas e Protocolo:</em> Facilita
                  a partilha de actividades institucionais, gere a comunicação
                  externa e a organização logística de eventos solenes.
                </li>
              </ul>
            </li>
          </ul>

          <h5 className="font-bold border-b border-blue-900 pb-1 mt-6">
            4.3.3 Conselho Administrativo e de Gestão (CAG)
          </h5>
          <p>
            <strong>Composição:</strong> Diretor-Geral, Diretores Adjuntos e
            Chefe da Secretaria.
            <br />
            <strong>Funcionalidade:</strong> Assegura a gestão eficiente dos
            recursos financeiros e humanos. No SIGEP, integra os módulos de
            pessoal (gestão de colaboradores) e orçamento (UGEA e execução
            financeira), garantindo transparência na execução das rubricas
            orçamentais.
          </p>

          <h5 className="font-bold border-b border-blue-900 pb-1 mt-6">
            4.3.4 Conselho Técnico e de Qualidade (CTQ)
          </h5>
          <p>
            <strong>Composição:</strong> Diretor Adjunto Pedagógico, Diretores
            de Escolas, Representantes de Docentes e Estudantes.
            <br />
            <strong>Funcionalidade:</strong> Zela pelo rigor científico e pela
            qualidade pedagógica. Monitoriza o desempenho académico, aprova
            planos curriculares e gere a qualidade das actividades de
            ensino-aprendizagem. No SIGEP, utiliza quadros estatísticos para
            monitorar o aproveitamento escolar e a conformidade dos planos de
            aula.
          </p>
        </div>
      ),
    },
    {
      id: "desenvolvimento-unidades",
      title: "4.4 Órgãos",
      content: (
        <div className="space-y-6 font-serif text-justify">
          <h4 className="font-bold">4.4 Órgãos (Estrutura e Gestão)</h4>
          <p>
            No Instituto Superior Politécnico de Songo, a Órgão é
            composta por:
          </p>
          <ul className="list-disc ml-8 space-y-4">
            <li>
              <strong>Divisão de Engenharia:</strong> Unidade académica
              principal responsável pela lecionação e coordenação de todos os
              cursos de engenharia. A divisão é estruturada e interage com os
              menus de navegação do SIGEP da seguinte forma:
              <ul className="list-[circle] ml-6 space-y-2 mt-2">
                <li>
                  <strong>Diretor da Divisão de Engenharia:</strong> Responsável
                  pela coordenação geral e supervisão académica. No SIGEP, acede
                  ao menu "Direção Académica", que fornece dashboards globais
                  sobre aproveitamento pedagógico, alocação de docentes e
                  eficácia institucional.
                </li>
                <li>
                  <strong>Diretor Adjunto Pedagógico:</strong> Assiste o Diretor
                  focando-se na qualidade do ensino-aprendizagem. O seu menu no
                  SIGEP é o "Gestão Pedagógica", permitindo aprovar planos
                  analíticos, validar pautas globais e monitorizar o cumprimento
                  dos calendários académicos e turmas.
                </li>
                <li>
                  <strong>Departamento de Pesquisa e Extensão:</strong> Fomenta
                  a investigação. No SIGEP, é composto por:
                  <ul className="list-[square] ml-6 mt-1 space-y-1 text-sm text-gray-800">
                    <li>
                      <em>Repartição de Pesquisa:</em> Gere publicações
                      académicas, projetos e teses de graduação.
                    </li>
                    <li>
                      <em>Repartição de Extensão:</em> Monitoriza actividades de
                      campo, estágios e prestação de serviços à comunidade.
                    </li>
                  </ul>
                </li>
                <li>
                  <strong>Departamento de Engenharia Eletrotécnica:</strong>{" "}
                  Coordena a área elétrica. No SIGEP, atua através da:
                  <ul className="list-[square] ml-6 mt-1 space-y-1 text-sm text-gray-800">
                    <li>
                      <em>Repartição Pedagógica (Eletrotécnica e Energias):</em>{" "}
                      Centraliza a alocação de turmas e validação de pautas.
                    </li>
                    <li>
                      <em>Repartição de Laboratórios de Eletricidade:</em> Gere
                      equipamentos, inventários de redes elétricas e energias
                      renováveis.
                    </li>
                  </ul>
                </li>
                <li>
                  <strong>
                    Departamento de Engenharia de Construção Civil:
                  </strong>{" "}
                  Supervisiona civil e hidráulica. No SIGEP, divide-se em:
                  <ul className="list-[square] ml-6 mt-1 space-y-1 text-sm text-gray-800">
                    <li>
                      <em>Repartição de Coordenação de Civil:</em> Avalia fluxos
                      de aproveitamento específicos e horários das disciplinas.
                    </li>
                    <li>
                      <em>Repartição de Laboratórios de Solos e Hidráulica:</em>{" "}
                      Gere espaços físicos, calibração de máquinas e requisições
                      de material.
                    </li>
                  </ul>
                </li>
                <li>
                  <strong>
                    Departamento de Engenharia de Construção Mecânica:
                  </strong>{" "}
                  Responsável pela mecânica. No SIGEP, compreende:
                  <ul className="list-[square] ml-6 mt-1 space-y-1 text-sm text-gray-800">
                    <li>
                      <em>Repartição de Ensino de Mecânica:</em> Controla
                      relatórios de estágio e pautas das disciplinas térmicas e
                      de produção.
                    </li>
                    <li>
                      <em>Repartição de Oficinas:</em> Viabiliza o controlo das
                      actividades práticas, manutenção de equipamentos pesados e
                      EPIs.
                    </li>
                  </ul>
                </li>
                <li>
                  <strong>Departamento de Disciplinas Gerais:</strong> Leciona
                  unidades transversais. No SIGEP, gere a:
                  <ul className="list-[square] ml-6 mt-1 space-y-1 text-sm text-gray-800">
                    <li>
                      <em>Repartição de Ciências Exatas:</em> Coordena os
                      docentes de Matemática, Física e Química alocados aos
                      vários cursos.
                    </li>
                    <li>
                      <em>Repartição de Humanidades e Línguas:</em> Gere as
                      turmas de Inglês Técnico, Metodologia e competências
                      transversais.
                    </li>
                  </ul>
                </li>
                <li>
                  <strong>Departamento Técnico e de Apoio:</strong> Assegura o
                  suporte logístico. No SIGEP, funciona com a:
                  <ul className="list-[square] ml-6 mt-1 space-y-1 text-sm text-gray-800">
                    <li>
                      <em>Repartição de Logística Laboratorial:</em> Gere
                      inventários de reagentes, consumíveis e EPIs.
                    </li>
                    <li>
                      <em>Repartição de Manutenção:</em> Registo eletrónico de
                      avarias, ordens de serviço e calibração de instrumentos
                      analíticos.
                    </li>
                  </ul>
                </li>
              </ul>
            </li>
            <li>
              <strong>Centro de Incubação de Empresas (CIE):</strong> Estrutura
              vocacionada para promover o empreendedorismo e a inovação
              tecnológica entre os estudantes e a comunidade. O CIE está
              organizado nos seguintes departamentos e integrado no SIGEP da
              seguinte forma:
              <ul className="list-[circle] ml-6 space-y-2 mt-2">
                <li>
                  <strong>Diretor do CIE:</strong> Responsável pela direção
                  executiva e estratégica da incubadora. No SIGEP, acede ao
                  dashboard "Gestão de Incubação", onde monitoriza o funil de
                  projetos, métricas de startups ativas e viabilidade
                  financeira.
                </li>
                <li>
                  <strong>
                    Departamento de Práticas de Geração de Negócio e
                    Desenvolvimento Empresarial (DPGNDE):
                  </strong>{" "}
                  Focado na ideação, mentoria e aceleração de ideias. No
                  sistema, é um departamento plano focado em práticas de geração
                  de negócio e desenvolvimento empresarial.
                </li>
                <li>
                  <strong>
                    Departamento de Consultoria, Estudos, Projetos e Angariação
                    de Fundos (DCPAF):
                  </strong>{" "}
                  Atua na viabilização financeira, estudos, projetos,
                  consultoria e angariação de fundos.
                </li>
                <li>
                  <strong>
                    Departamento de Prospecção de Oportunidade de Negócio
                    (DPONE):
                  </strong>{" "}
                  Responsável por analisar o mercado, identificar nichos de
                  oportunidades de negócio e estabelecer parcerias estratégicas.
                </li>
              </ul>
            </li>
            <li>
              <strong>Centros:</strong> Outros centros de investigação e
              serviços especializados de apoio à academia e extensão. No SIGEP,
              a gestão destes centros inclui a requisição de recursos,
              agendamento de espaços laboratoriais e arquivo de relatórios de
              extensão e pesquisa.
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: "desenvolvimento-servicos",
      title: "4.5 Unidade Orgânica",
      content: (
        <div className="space-y-6 font-serif text-justify">
          <h4 className="font-bold">
            4.5 Unidade Orgânica (Governação Administrativa)
          </h4>
          <p>
            Os Unidade Orgânica garantem o suporte necessário à actividade fim
            do Instituto. Abordagem exaustiva:
          </p>
          <ul className="list-disc ml-8 space-y-2">
            <li>
              <strong>Repartição de Pessoal:</strong> Responsável pela gestão
              estratégica do capital humano do Songo. O sistema permite o
              controlo exaustivo de{" "}
              <strong>{systemData?.colaboradoresCount || 178}</strong>{" "}
              colaboradores ativos.
              <div className="mt-2 p-4 bg-gray-50 border-l-4 border-blue-900 italic text-[10px] space-y-1">
                <p>
                  <strong>Composição:</strong> Inclui dados biográficos
                  completos, níveis académicos (desde o básico ao Doutorado),
                  área de formação e situação contratual (Quadro Efetivo,
                  Contratado, etc.).
                </p>
                <p>
                  <strong>Funcionalidades:</strong> Puxa automaticamente
                  indicadores para a Visão Geral, gera Mapas de Férias,
                  Processação de Vencimentos e monitoria de progressão na
                  carreira.
                </p>
              </div>
            </li>
            <li>
              <strong>Repartição de Planificação:</strong> Central operacional
              para o Plano de Actividades Anual, gerindo actividades
              planificadas e intervenções extraordinárias (não planificadas).
            </li>
            <li>
              <strong>Repartição de Execução Orçamental:</strong> Controla
              rigorosamente as rubricas e dotações, permitindo uma visão real do
              saldo institucional.
            </li>
            <li>
              <strong>Secretaria Geral:</strong> Ponto focal do Módulo de
              Expediente, gerindo a entrada e saída de correspondência oficial.
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: "desenvolvimento-sistema",
      title: "4.6 Infraestrutura do Sistema SIGEP",
      content: (
        <div className="space-y-6 font-serif text-justify">
          <h4 className="font-bold">
            4.6 Descrição Detalhada da Infraestrutura Tecnológica
          </h4>
          <p>
            O SIGEP assenta numa arquitetura moderna e escalável. Detalhes
            exaustivos:
          </p>
          <ul className="list-disc ml-8 space-y-2">
            <li>
              <strong>Base de Dados Não-Relacional (Document-Oriented):</strong>{" "}
              Uso do Firestore para garantir sincronização em milissegundos
              entre todos os órgãos de direção.
            </li>
            <li>
              <strong>Segurança RBAC (Role-Based Access Control):</strong>{" "}
              Matriz de permissões que garante que cada repartição (Pessoal,
              Planificação, Registo Académico) aceda apenas aos dados que lhe
              competem.
            </li>
            <li>
              <strong>Módulo de Reportagem Dinâmica:</strong> Capacidade de
              gerar PDFs formatados (como esta Monografia) extraindo dados vivos
              da execução orçamental e estatística discente.
            </li>
            <li>
              <strong>Logs de Auditoria:</strong> Registo exaustivo de cada
              alteração feita por qualquer utilizador, garantindo a
              não-repudiação das ações.
            </li>
          </ul>
        </div>
      ),
    },
    ...createBlankPages("resultados", "5. Resultados e Discussão", 8), // Pages 31-38
    ...createBlankPages("conclusao", "6. Conclusão e Recomendações", 7), // Pages 39-45

    // Page 55-58 (Referencias + extra)
    {
      id: "referencias",
      title: "Referências Bibliográficas",
      content: (
        <div className="space-y-6 font-serif text-justify">
          <h3 className="text-xl font-bold mb-4">REFERÊNCIAS BIBLIOGRÁFICAS</h3>
          <p className="text-sm italic mb-4">
            Normas ABNT NBR 6023 (autor, título, edição, local, editora, ano)
          </p>
          <div className="space-y-4 pl-8 -indent-8">
            <p>
              CONSELHO DE MINISTROS. Decreto n.º 22/2008, de 27 de Julho.
              Criação do Instituto Superior Politécnico de Songo. Maputo, 2008.
            </p>
            <p>
              INSTITUTO SUPERIOR POLITÉCNICO DE SONGO. Estatutos do Songo. Songo:
              Songo, 2019.
            </p>
            <p>
              INSTITUTO SUPERIOR POLITÉCNICO DE SONGO. Plano Estratégico
              2020-2025. Songo: Songo, 2020.
            </p>
            <p>
              LAUDON, K. C.; LAUDON, J. P. Sistemas de Informação Gerenciais.
              15. ed. São Paulo: Pearson, 2021.
            </p>
            <p>
              SOMMERVILLE, I. Engenharia de Software. 10. ed. São Paulo:
              Pearson, 2018.
            </p>
            <p>
              Lei n.º 27/2019, de 1 de Agosto. Lei do Ensino Superior. Maputo:
              Boletim da República, 2019.
            </p>
          </div>
        </div>
      ),
    },
    ...createBlankPages("referencias-cont", "Referências Bibliográficas", 3), // Pages 56-58

    // Page 59
    {
      id: "apendices",
      title: "Apêndices",
      content: (
        <div className="space-y-6 font-serif text-justify h-full flex flex-col justify-center items-center">
          <h3 className="text-3xl font-bold mb-4">Apêndices</h3>
          <p className="text-xl text-gray-500">
            Materiais elaborados pelo autor (questionários, roteiros).
          </p>
        </div>
      ),
    },
    // Page 60
    {
      id: "anexos",
      title: "Anexos",
      content: (
        <div className="space-y-6 font-serif text-justify h-full flex flex-col justify-center items-center">
          <h3 className="text-3xl font-bold mb-4">Anexos</h3>
          <p className="text-xl text-gray-500">
            Documentos externos (leis, relatórios, imagens).
          </p>
        </div>
      ),
    },
  ];

  const sections = generatedSections;

  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = () => {
    setIsDownloading(true);
    try {
      const element = document.getElementById("monografia-root");
      if (!element) {
        setIsDownloading(false);
        return;
      }

      const clone = element.cloneNode(true) as HTMLElement;
      clone.classList.remove("space-y-8");

      const opt = {
        margin: [10, 10, 10, 10] as [number, number, number, number],
        filename: "Monografia_SIGEP_Songo.pdf",
        image: { type: "jpeg" as const, quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          letterRendering: true,
          backgroundColor: "#ffffff",
        },
        jsPDF: {
          unit: "mm" as const,
          format: "a4",
          orientation: "portrait" as const,
        },
      };

      html2pdf()
        .set(opt)
        .from(clone)
        .save()
        .then(() => {
          setIsDownloading(false);
        });
    } catch (e) {
      console.error("Erro ao gerar PDF:", e);
      setIsDownloading(false);
      printElementById("print-area");
    }
  };

  return (
      <div className="flex flex-col h-screen bg-gray-100 print:bg-white print:h-auto print:overflow-visible overflow-hidden">
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,500;1,600;1,700;1,800&display=swap');
          
          @media print {
            @page {
              size: A4;
              margin: 2.5cm 2cm 2cm 3cm;
            }
            body {
              background-color: white !important;
              -webkit-print-color-adjust: exact;
              overflow: visible !important;
            }
            html, body, #root, .flex-col, .flex-1, main {
              height: auto !important;
              overflow: visible !important;
              display: block !important;
              position: static !important;
            }
            header, aside, footer, .print-hidden, button {
              display: none !important;
            }
            #monografia-root {
              display: block !important;
              width: 100% !important;
              max-width: none !important;
              margin: 0 !important;
              padding: 0 !important;
              box-shadow: none !important;
              border: none !important;
              position: static !important;
            }
            section {
              page-break-after: always !important;
              break-after: page !important;
            }
          }

          .latex-font {
            font-family: 'EB Garamond', serif;
            font-variant-ligatures: common-ligatures;
          }
        `}
      </style>

      {/* Header Fixo */}
      <header className="bg-blue-900 text-white p-4 flex items-center justify-between shadow-lg z-20 print:hidden flex-none">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-blue-800 rounded-full transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h2 className="text-lg font-bold tracking-widest">
              Monografia - Songo
            </h2>
            <p className="text-blue-200 text-[10px] font-medium tracking-tighter">
              SIGEP (Sistema Integrado de Gestão de Planificação)
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 relative">
          <div
            className="hidden lg:flex flex-col items-end mr-2 cursor-help group"
            onClick={() => setShowSystemInfo(!showSystemInfo)}
          >
            <p className="text-[8px] font-black text-blue-300 tracking-widest">
              Estado do Sistema
            </p>
            <p className="text-[10px] font-bold text-white flex items-center gap-1">
              Sincronizado: {lastUpdated}
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
            </p>

            {/* System Info Tooltip/Panel */}
            <div
              className={`absolute top-full right-0 mt-2 w-72 bg-white text-gray-900 rounded-xl shadow-2xl border border-gray-200 p-4 z-50 transition-all duration-300 transform origin-top-right ${showSystemInfo ? "scale-100 opacity-100" : "scale-95 opacity-0 pointer-events-none"}`}
            >
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
                <h4 className="text-[10px] font-black tracking-widest text-blue-900">
                  Especificações do SIGEP
                </h4>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowSystemInfo(false);
                  }}
                  className="text-gray-400 hover:text-red-500"
                >
                  <ArrowLeft size={12} className="rotate-90" />
                </button>
              </div>
              <div className="space-y-3">
                <div className="flex flex-col">
                  <span className="text-[8px] font-black text-gray-400 tracking-tighter">
                    Nome do Sistema
                  </span>
                  <span className="text-[10px] font-bold text-blue-900">
                    {systemSpecs.nome}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col">
                    <span className="text-[8px] font-black text-gray-400 tracking-tighter">
                      Edição
                    </span>
                    <span className="text-[10px] font-bold">
                      {systemSpecs.edicao}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[8px] font-black text-gray-400 tracking-tighter">
                      Versão
                    </span>
                    <span className="text-[10px] font-bold">
                      {systemSpecs.versao}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-[8px] font-black text-gray-400 tracking-tighter">
                    Tipo de Sistema
                  </span>
                  <span className="text-[10px] font-bold">
                    {systemSpecs.tipo}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[8px] font-black text-gray-400 tracking-tighter">
                    Compilação do SO
                  </span>
                  <span className="text-[10px] font-bold font-mono">
                    {systemSpecs.compilacao}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[8px] font-black text-gray-400 tracking-tighter">
                    Experiência
                  </span>
                  <span className="text-[10px] font-bold leading-tight">
                    {systemSpecs.experiencia}
                  </span>
                </div>
              </div>
              <div className="mt-4 pt-2 border-t border-gray-50 flex items-center justify-between">
                <span className="text-[8px] font-black text-gray-300 italic">
                  Dev: SLAITER TRIPAS
                </span>
                <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded text-[8px] font-bold">
                  v{systemData?.version || "2.0"}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowEditPanel(!showEditPanel)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs transition-all duration-300 ${
              showEditPanel
                ? "bg-amber-600 text-white"
                : "bg-blue-700 text-white hover:bg-blue-600"
            } shadow-sm active:scale-95`}
          >
            <Edit3 size={16} />
            {showEditPanel ? "FECHAR EDITOR" : "EDITAR TEXTOS"}
          </button>

          <button
            onClick={handleSaveMono}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold text-xs hover:bg-emerald-500 transition-all shadow-sm active:scale-95 disabled:opacity-50"
          >
            {isSaving ? <ProcessingCircle size={16} /> : <Cloud size={16} />}
            {isSaving ? "SALVANDO..." : "Sincronizar com Servidor"}
          </button>

          <button
            onClick={handleUpdate}
            disabled={isUpdating}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs transition-all duration-300 ${
              isUpdated
                ? "bg-green-600 text-white"
                : "bg-blue-700 text-white hover:bg-blue-600"
            } disabled:opacity-50 shadow-sm`}
          >
            {isUpdating ? (
              <ProcessingCircle size={16} />
            ) : (
              <RefreshCw size={16} />
            )}
            {isUpdating
              ? "SINCRONIZANDO..."
              : isUpdated
                ? "SISTEMA ATUALIZADO!"
                : "Atualizar Sistema"}
          </button>

          <div className="flex flex-col md:flex-row gap-2">
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="flex items-center gap-2 bg-white text-blue-900 px-4 py-2 rounded-lg font-bold text-xs hover:bg-blue-50 transition-colors shadow-sm active:scale-95 disabled:opacity-50"
            >
              {isDownloading ? (
                <>
                  <ProcessingCircle size={16} /> GERANDO PDF...
                </>
              ) : (
                <>
                  <Download size={16} /> BAIXAR PDF
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden print:block print:overflow-visible">
        {/* Sumário Lateral */}
        <aside className="w-72 bg-white border-r border-gray-200 p-6 overflow-y-auto hidden md:block print:hidden shadow-sm z-10">
          <h3 className="text-[10px] font-black text-gray-400 tracking-widest mb-6 flex items-center gap-2">
            <BookOpen size={14} /> Navegação ({sections.length} Páginas)
          </h3>
          <nav className="space-y-1">
            {sections.map((section, index) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="block p-2 text-xs font-bold text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-all border-l-2 border-transparent hover:border-blue-600 whitespace-nowrap overflow-hidden text-ellipsis"
              >
                {index + 1}. {section.title}
              </a>
            ))}
          </nav>
        </aside>

        {/* Área de Visualização */}
        <main className="flex-1 overflow-y-auto bg-gray-300 p-4 md:p-8 print:p-0 print:bg-white print:overflow-visible monografia-container">
          <div
            id="monografia-root"
            className="mx-auto space-y-8 print:space-y-0 print:block"
          >
            {sections.map((section, index) => (
              <div
                key={section.id}
                id={section.id}
                className="mx-auto bg-white shadow-xl w-full max-w-[210mm] min-h-[297mm] p-16 md:p-24 relative flex flex-col print:shadow-none print:max-w-none print:p-0 print:m-0 print:min-h-0 print:h-auto print:break-after-page border border-gray-200 print:border-none latex-font monografia-page"
              >
                <div className="flex-grow">{section.content}</div>

                {/* Rodapé da Página (Apenas na UI e no PDF se configurado) */}
                <div className="mt-12 pt-6 border-t border-gray-100 flex justify-between items-center text-[10px] font-black text-gray-400 tracking-[0.2em]">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-900 rounded-full print:hidden"></span>
                    <span className="print:hidden">Seção: {section.title}</span>
                  </div>
                  <span>{index + 1}</span>
                </div>
              </div>
            ))}
          </div>

          <footer className="mt-12 pb-12 text-center text-[10px] text-gray-400 tracking-widest font-bold print:hidden">
            © {year} Songo | Documento Gerado pelo SIGEP
          </footer>
        </main>

        {showEditPanel && (
          <aside className="w-96 bg-white border-l border-gray-200 p-6 overflow-y-auto print:hidden shadow-lg z-10 flex flex-col h-full animate-in slide-in-from-right duration-200 shrink-0">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-6">
              <h3 className="text-sm font-black text-blue-950  tracking-wider flex items-center gap-2">
                <Edit3 size={18} className="text-blue-600" /> Personalizar
                Monografia
              </h3>
              <button
                onClick={() => setShowEditPanel(false)}
                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-6 flex-1 overflow-y-auto pr-1">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400  tracking-widest block">
                  Nome do Autor
                </label>
                <input
                  type="text"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all text-slate-800"
                  placeholder="Ex: SLAITER TRIPAS"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400  tracking-widest block">
                  Título do Trabalho
                </label>
                <textarea
                  rows={3}
                  value={monoTitle}
                  onChange={(e) => setMonoTitle(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all text-slate-800 resize-none"
                  placeholder="Insira o título completo da monografia..."
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400  tracking-widest block">
                  Orientador
                </label>
                <input
                  type="text"
                  value={orientador}
                  onChange={(e) => setOrientador(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all text-slate-800"
                  placeholder="Ex: Eng. Robone"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black text-gray-400  tracking-widest block">
                    Dedicatória
                  </label>
                  <span className="text-[9px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded font-bold">
                    Opcional
                  </span>
                </div>
                <textarea
                  rows={5}
                  value={dedicatoriaText}
                  onChange={(e) => setDedicatoriaText(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all text-slate-800"
                  placeholder="Escreva a sua dedicatória..."
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400  tracking-widest block">
                  Agradecimentos
                </label>
                <textarea
                  rows={5}
                  value={agradecimentosText}
                  onChange={(e) => setAgradecimentosText(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all text-slate-800"
                  placeholder="Escreva os agradecimentos..."
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400  tracking-widest block">
                  Resumo (Em Português)
                </label>
                <textarea
                  rows={6}
                  value={resumoText}
                  onChange={(e) => setResumoText(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all text-slate-800 text-justify"
                  placeholder="Insira o texto do resumo..."
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400  tracking-widest block">
                  Abstract (Em Inglês)
                </label>
                <textarea
                  rows={6}
                  value={abstractText}
                  onChange={(e) => setAbstractText(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all text-slate-800 text-justify"
                  placeholder="Insira o texto do abstract..."
                />
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4 mt-6">
              <button
                onClick={() => {
                  setShowEditPanel(false);
                }}
                className="w-full py-3 bg-blue-900 text-white rounded-xl text-xs font-black  tracking-wider hover:bg-blue-800 transition-colors shadow-md flex items-center justify-center gap-2"
              >
                <Save size={14} /> Salvar e Fechar
              </button>
              <p className="text-[9px] text-gray-400 text-center mt-2 font-medium">
                As alterações são salvas automaticamente no seu navegador.
              </p>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
