import { printElementById } from "../../lib/printUtils";
import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Folder,
  FileText,
  Calendar,
  ChevronRight,
  Search,
  Archive,
  Plus,
  X,
  Trash2,
  Share2,
  Printer,
  Download,
  ChevronDown,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { InstitutionalHeader } from "../../components/InstitutionalHeader";
import * as XLSX from "xlsx";
import { firestoreService } from "../../lib/firestoreService";
import { isSuperBossUser, getRoles, isBossUser } from "../../lib/auth";

interface ArchiveDocument {
  id: string;
  title: string;
  type: string;
  year: number;
  date: string;
  accessLevel?: "geral" | "chefia";
  author?: string;
  fileSize?: string;
  isDigitalized?: boolean;
  actividades?: any[];
  content?: string;
  sections?: any[];
  fileUrl?: string; // Base64 or Blob URL
}

const OFFICIAL_CATEGORIES = [
  "Relatórios Anuais",
  "Planos de Atividades e Orçamentos",
  "Legislação, Estatutos e Regulamentos",
  "Deliberações e Atas do Conselho",
  "Planos de Aquisições e Contratações",
  "Informações Propostas",
  "Guias de marchas e de apresentação",
  "Processos Individuais do Pessoal",
  "Protocolos, Acordos e Cooperação",
  "Correspondência Recebida e Expedida",
  "Inquéritos, Estatísticas e Censos",
  "Fichas de Inventário e Património",
  "Processos de Avaliação e Desempenho",
  "Pedidos de ferias e dispensas",
  "Planos de ferias",
  "Requisicao internas",
];

const SEED_DOCUMENTS: ArchiveDocument[] = [];

const ExcelPreview = ({ dataUrl }: { dataUrl: string }) => {
  const [data, setData] = useState<any[][]>([]);

  useEffect(() => {
    try {
      const base64 = dataUrl.split(",")[1];
      const workbook = XLSX.read(base64, { type: "base64" });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
      }) as any[][];
      setData(jsonData);
    } catch (err) {
      console.error("Erro ao processar Excel:", err);
    }
  }, [dataUrl]);

  if (data.length === 0)
    return (
      <div className="p-10 text-center text-slate-400">
        Processando folha de cálculo...
      </div>
    );

  return (
    <div className="overflow-auto border border-slate-200 rounded-xl shadow-sm bg-white max-h-[600px]">
      <table className="w-full text-xs text-left border-collapse">
        <thead className="sticky top-0 z-10">
          <tr className="bg-slate-900 text-white font-black  tracking-widest">
            {data[0]?.map((cell, j) => (
              <th
                key={j}
                className="p-3 border-r border-slate-700 min-w-[150px]"
              >
                {String(cell || `Coluna ${j + 1}`)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.slice(1).map((row, i) => (
            <tr
              key={i}
              className="hover:bg-blue-50 border-b border-slate-100 transition-colors"
            >
              {row.map((cell, j) => (
                <td
                  key={j}
                  className="p-3 border-r border-slate-50 min-w-[150px] text-slate-700"
                >
                  {String(cell || "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default function ArchiveView({
  user,
  onBack,
  onShowAlert,
}: {
  user?: any;
  onBack: () => void;
  onShowAlert: (msg: string) => void;
}) {
  const isAdmin = isSuperBossUser(user);
  const getActiveCycleYear = () => {
    const now = new Date();
    const cY = now.getFullYear();
    const dec20 = new Date(cY, 11, 20); // 20 de Dezembro
    if (now >= dec20) {
      return cY + 1; // Ciclo N+1 abre a partir de 20 de Dezembro
    }
    return cY;
  };

  const activeCycleYear = getActiveCycleYear();
  const [selectedYear, setSelectedYear] = useState<number | null>(activeCycleYear);
  const [showConsultationYears, setShowConsultationYears] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [documents, setDocuments] = useState<ArchiveDocument[]>(SEED_DOCUMENTS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeViewMode, setActiveViewMode] = useState<"hierarchy" | "categories">("hierarchy");
  const [expandedHierarchy, setExpandedHierarchy] = useState<Record<string, boolean>>({
    root: true,
  });

  const toggleHierarchyNode = (key: string) => {
    setExpandedHierarchy((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Form fields
  const [newTitle, setNewTitle] = useState("");
  const [newYear, setNewYear] = useState<number>(activeCycleYear);
  const [newCategory, setNewCategory] = useState(OFFICIAL_CATEGORIES[0]);
  const [newDate, setNewDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [viewingDoc, setViewingDoc] = useState<ArchiveDocument | null>(null);
  const [newAccessLevel, setNewAccessLevel] = useState<"geral" | "chefia">(
    "geral",
  );

  // Identificação de chefias ou cargos de direção
  const userTitle = user?.title || user?.cargo || user?.cargoChefia || "";
  const roles = getRoles(userTitle);
  const isChefia =
    roles.isBoss ||
    isSuperBossUser(user) ||
    isBossUser(user?.name || "") ||
    isBossUser(user?.nome || "");

  // Dynamic years from 2021 up to the current year, plus any year from the documents
  const currentYear = new Date().getFullYear();
  const documentYears = Array.from(new Set(documents.map((d) => d.year)));
  const baseYears = [];
  for (let y = currentYear; y >= 2021; y--) {
    baseYears.push(y);
  }
  const years = Array.from(new Set([...baseYears, ...documentYears])).sort(
    (a, b) => b - a,
  );

  const categories = OFFICIAL_CATEGORIES;

  // Subscribe to real-time additions/modifications in Firebase Firestore
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    try {
      unsubscribe = firestoreService.archive_documents.subscribe(
        (fireDocs: any[]) => {
          const merged = [...SEED_DOCUMENTS];
          if (fireDocs && fireDocs.length > 0) {
            fireDocs.forEach((fDoc) => {
              const idx = merged.findIndex((m) => m.id === fDoc.id);
              if (idx !== -1) {
                merged[idx] = { ...merged[idx], ...fDoc };
              } else {
                merged.push(fDoc);
              }
            });
          }
          setDocuments(merged);
        },
      );
    } catch (err) {
      console.warn(
        "Could not subscribe to archive_documents collection, falling back to local storage:",
        err,
      );
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const filteredDocuments = documents.filter((doc) => {
    const matchesYear = selectedYear ? doc.year === selectedYear : true;
    const matchesCategory = selectedCategory
      ? doc.type === selectedCategory
      : true;
    const matchesSearch = doc.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    // Controle de acesso: se for nível 'chefia', precisa ser utilizador de chefia
    const matchesAccess = doc.accessLevel === "chefia" ? isChefia : true;

    return matchesYear && matchesCategory && matchesSearch && matchesAccess;
  });

  const handleOpenModal = () => {
    if (selectedYear) {
      setNewYear(selectedYear);
    }
    if (selectedCategory) {
      setNewCategory(selectedCategory);
    }
    setNewTitle("");
    setNewDate(new Date().toISOString().split("T")[0]);
    setNewAccessLevel("geral");
    setIsModalOpen(true);
  };

  const handleCreateDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() && !selectedFile) return;

    setIsSubmitting(true);
    setUploadProgress(10);

    const fileName = selectedFile ? selectedFile.name : newTitle.trim();
    // Preservar a extensão original, se houver. Senão, assume .pdf
    let finalTitle = fileName;
    if (!selectedFile && !finalTitle.includes(".")) {
      finalTitle += ".pdf";
    }

    let fileDataUrl = "";
    if (selectedFile) {
      try {
        // Para ficheiros pequenos (< 1MB), guardamos no Firestore como base64
        // Para maiores, avisamos ou guardamos apenas em sessão
        if (selectedFile.size > 800000) {
          onShowAlert(
            "Aviso: Ficheiro superior a 800KB. A visualização permanente pode ser limitada, mas o ficheiro será processado.",
          );
        }

        fileDataUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(selectedFile);
        });
      } catch (err) {
        console.error("Erro ao ler ficheiro:", err);
      }
    }

    const newDocObj = {
      title: finalTitle,
      type: newCategory,
      year: Number(newYear),
      date: newDate,
      isDigitalized: true,
      author: user?.nome || user?.email || "Sistema",
      fileSize: selectedFile
        ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB`
        : "N/A",
      accessLevel: newAccessLevel,
      fileUrl: fileDataUrl,
    };

    try {
      setUploadProgress(40);
      // Simular delay de digitalização
      await new Promise((resolve) => setTimeout(resolve, 800));
      setUploadProgress(80);

      await firestoreService.archive_documents.add(newDocObj);
      setUploadProgress(100);

      setTimeout(() => {
        setIsModalOpen(false);
        setNewTitle("");
        setSelectedFile(null);
        setUploadProgress(0);
        onShowAlert(
          "Documento digitalizado e arquivado definitivamente com sucesso.",
        );
      }, 300);
    } catch (err) {
      console.error("Error inserting document in Firestore:", err);
      onShowAlert(
        "Erro ao arquivar documento. Certifique-se que o ficheiro não excede o limite de tamanho do sistema.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFileIcon = (title: string) => {
    const ext = title.toLowerCase().split(".").pop();
    if (ext === "pdf") return <FileText className="text-red-500" size={24} />;
    if (["doc", "docx"].includes(ext || ""))
      return <FileText className="text-blue-500" size={24} />;
    if (["xls", "xlsx", "csv"].includes(ext || ""))
      return <FileText className="text-emerald-500" size={24} />;
    if (["ppt", "pptx"].includes(ext || ""))
      return <FileText className="text-orange-500" size={24} />;
    if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext || ""))
      return <FileText className="text-purple-500" size={24} />;
    return <FileText className="text-slate-500" size={24} />;
  };

  const getDocTypeLabel = (title: string) => {
    const ext = title.toLowerCase().split(".").pop();
    if (ext === "pdf") return "Documento PDF";
    if (["doc", "docx"].includes(ext || "")) return "Documento Word";
    if (["xls", "xlsx", "csv"].includes(ext || ""))
      return "Folha de Cálculo Excel";
    if (["ppt", "pptx"].includes(ext || "")) return "Apresentação PowerPoint";
    if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext || ""))
      return "Ficheiro de Imagem";
    return "Documento Digital";
  };

  const handleDownloadFile = (doc: ArchiveDocument) => {
    if (doc.fileUrl) {
      const link = document.createElement("a");
      link.href = doc.fileUrl;
      link.download = doc.title;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      onShowAlert(`Download do ficheiro original "${doc.title}" iniciado.`);
      return;
    }

    let fileContent = `INSTITUTO SUPERIOR POLITÉCNICO DE SONGO\n\n`;
    fileContent += `DOCUMENTO: ${doc.title}\n`;
    fileContent += `CATEGORIA: ${doc.type}\n`;
    fileContent += `ANO: ${doc.year}\n`;
    fileContent += `DATA DE REGISTO: ${new Date(doc.date).toLocaleDateString("pt-PT")}\n`;
    fileContent += `AUTOR: ${doc.author || "Sistema"}\n`;
    fileContent += `NÍVEL DE ACESSO: ${doc.accessLevel === "chefia" ? "APENAS CHEFIA" : "CONSULTA GERAL"}\n`;
    fileContent += `--------------------------------------------------\n\n`;

    if (doc.content) {
      fileContent += doc.content;
    } else if (doc.sections) {
      doc.sections.forEach((s: any) => {
        fileContent += `\n=== ${s.title.toUpperCase()} ===\n${s.content}\n`;
      });
    } else if (doc.actividades) {
      fileContent += `ATIVIDADES REGISTADAS:\n`;
      doc.actividades.forEach((act: any) => {
        fileContent += `- ${act.actividade || act.activity} (${act.mes || act.month}): ${Number(act.valor || 0).toLocaleString()} MZN\n`;
      });
    } else {
      fileContent += `Este é um documento oficial do arquivo permanente do Songo Songo. O arquivo original encontra-se guardado em formato seguro na base de dados do sistema para consulta imediata de todos os utilizadores autorizados.`;
    }

    const blob = new Blob([fileContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    // Se o título não tiver extensão, adiciona .docx por padrão para manter a originalidade
    const downloadName = doc.title.includes(".")
      ? doc.title
      : `${doc.title}.docx`;
    link.download = downloadName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    onShowAlert(`Download do ficheiro "${downloadName}" iniciado com sucesso!`);
  };

  const handleExportPDF = (doc: ArchiveDocument) => {
    const element = document.getElementById("document-preview-content");
    if (!element) return;

    const opt = {
      margin: [15, 15, 15, 15],
      filename: `${doc.title.replace(/\.[^/.]+$/, "")}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    };

    // @ts-ignore - html2pdf is globally available or imported in package.json
    import("html2pdf.js").then((html2pdfModule) => {
      const exporter = (html2pdfModule.default || html2pdfModule) as any;
      exporter().set(opt).from(element).save();
      onShowAlert(`Documento "${doc.title}" exportado para PDF com sucesso.`);
    });
  };

  const handlePrintFile = () => {
    printElementById("print-area");
  };

  const handleShareFile = (doc: ArchiveDocument) => {
    const docUrl = `${window.location.origin}?docId=${doc.id}`;
    navigator.clipboard
      .writeText(docUrl)
      .then(() => {
        onShowAlert(
          `Ligação direta para "${doc.title}" copiada para a área de transferência!`,
        );
      })
      .catch((err) => {
        console.error("Error copying link:", err);
        onShowAlert(`Erro ao copiar ligação. Utilize este link: ${docUrl}`);
      });
  };

  const handleDeleteDocument = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // Apenas Administradores podem excluir documentos institucionais permanentes
    if (id.startsWith("seed-") && !isAdmin) {
      onShowAlert(
        "Documentos institucionais permanentes apenas podem ser excluídos por um Administrador.",
      );
      return;
    }
    if (
      !window.confirm(
        "Tem a certeza que deseja excluir este documento histórico do arquivo?",
      )
    )
      return;

    try {
      await firestoreService.archive_documents.delete(id);
      onShowAlert("dados excluido com sucesso");
    } catch (err) {
      console.error("Error deleting document, falling back locally:", err);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
    }
  };

  const renderYears = () => (
    <div className="space-y-6 w-full max-w-6xl mx-auto py-8">
      <div className="bg-amber-50 border border-amber-200 p-6 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4 text-amber-900 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-amber-100 rounded-2xl text-amber-800">
            <Calendar size={24} />
          </div>
          <div>
            <h4 className="font-black text-base  tracking-wider">Modo de Consulta de Ciclos Anteriores</h4>
            <p className="text-xs font-medium text-amber-800">
              Os dados de ciclos anteriores servem estritamente para consulta histórica. O ciclo ativo atual é o ano {activeCycleYear}.
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            setShowConsultationYears(false);
            setSelectedYear(activeCycleYear);
            setSelectedCategory(null);
          }}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black  tracking-widest rounded-2xl shadow-md transition-all shrink-0"
        >
          Voltar ao Ciclo Ativo ({activeCycleYear})
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 w-full">
        {years.map((year) => {
          const count = documents.filter((d) => d.year === year).length;
          return (
            <button
              key={year}
              onClick={() => {
                setSelectedYear(year);
                setShowConsultationYears(false);
              }}
              className="bg-white border-2 border-slate-100 p-8 rounded-3xl shadow-sm hover:border-blue-500 hover:shadow-xl transition-all flex flex-col items-center text-center gap-4 group"
            >
              <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl group-hover:bg-blue-650 group-hover:text-white transition-colors">
                <Calendar size={32} />
              </div>
              <span className="text-2xl font-black text-gray-950">{year}</span>
              <span className="text-xs text-blue-500 font-bold bg-blue-50 group-hover:bg-blue-100 px-3 py-1 rounded-full  tracking-wider">
                {count} {count === 1 ? "Documento" : "Documentos"}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderHierarchicalView = () => {
    const yearDocs = documents.filter((d) => {
      const matchesYear = selectedYear ? d.year === selectedYear : true;
      const matchesSearch = searchTerm ? d.title.toLowerCase().includes(searchTerm.toLowerCase()) : true;
      const matchesAccess = d.accessLevel === "chefia" ? isChefia : true;
      return matchesYear && matchesSearch && matchesAccess;
    });

    const hierarchy: Record<string, Record<string, Record<string, Record<string, Record<string, ArchiveDocument[]>>>>> = {};

    yearDocs.forEach((item) => {
      const doc = item as any;
      const orgao = doc.orgao || "Instituto Superior Politécnico de Songo";
      const direcao = doc.direcao || "DICOSSER (Direção de Serviços)";
      const isUgea = 
        String(doc.departamento || "").toLowerCase().includes("ugea") ||
        String(doc.departamento || "").toLowerCase().includes("aquisi") ||
        String(doc.direcao || "").toLowerCase().includes("ugea") ||
        String(doc.direcao || "").toLowerCase().includes("aquisi") ||
        String(doc.title || "").toLowerCase().includes("ugea");
      const departamento = doc.departamento || (isUgea ? "Unidade Gestora e Executora de Aquisições" : "Departamento Geral");
      const reparticao = doc.reparticao || "Repartição de Arquivo e Expediente";
      const setor = doc.setor || doc.unidade || "Setor de Atendimento Geral";

      if (!hierarchy[orgao]) hierarchy[orgao] = {};
      if (!hierarchy[orgao][direcao]) hierarchy[orgao][direcao] = {};
      if (!hierarchy[orgao][direcao][departamento]) hierarchy[orgao][direcao][departamento] = {};
      if (!hierarchy[orgao][direcao][departamento][reparticao]) hierarchy[orgao][direcao][departamento][reparticao] = {};
      if (!hierarchy[orgao][direcao][departamento][reparticao][setor]) hierarchy[orgao][direcao][departamento][reparticao][setor] = [];

      hierarchy[orgao][direcao][departamento][reparticao][setor].push(doc);
    });

    return (
      <div className="w-full max-w-6xl mx-auto py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSelectedYear(null)}
              className="p-2 bg-gray-100 rounded-full hover:bg-gray-255 transition-colors text-blue-900"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <span className="text-[10px] font-black tracking-widest text-slate-400 ">
                REPOSITÓRIO GERAL &bull; ANO {selectedYear}
              </span>
              <h3 className="text-2xl font-black text-blue-900 leading-tight">
                Estrutura Orgânica e Documental ({selectedYear})
              </h3>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Pesquisar na hierarquia..."
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border-2 border-slate-100 focus:border-blue-500 focus:ring-0 outline-none text-sm font-semibold transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex bg-slate-100 p-1 rounded-2xl">
              <button
                onClick={() => setActiveViewMode("hierarchy")}
                className={`px-4 py-2 rounded-xl text-xs font-black  tracking-wider transition-all ${activeViewMode === "hierarchy" ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
              >
                Hierarquia
              </button>
              <button
                onClick={() => setActiveViewMode("categories")}
                className={`px-4 py-2 rounded-xl text-xs font-black  tracking-wider transition-all ${activeViewMode === "categories" ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
              >
                Pastas
              </button>
            </div>

            {isAdmin && (
              <button
                onClick={handleOpenModal}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs  tracking-widest px-5 py-3 rounded-2xl flex items-center gap-2 shadow-md transition-all active:scale-95"
              >
                <Plus size={16} /> Adicionar Documento
              </button>
            )}
          </div>
        </div>

        {activeViewMode === "categories" ? (
          renderCategoriesGrid()
        ) : (
          <div className="space-y-6">
            {Object.keys(hierarchy).length === 0 ? (
              <div className="bg-white p-16 rounded-3xl text-center text-slate-400 font-medium border border-slate-100 shadow-sm">
                <FileText size={40} className="mx-auto mb-3 opacity-30" />
                <p>Nenhum documento encontrado para o ano {selectedYear} com os filtros atuais.</p>
              </div>
            ) : (
              Object.entries(hierarchy).map(([orgaoName, direcoes]) => {
                const orgaoKey = `orgao-${orgaoName}`;
                const isOrgaoOpen = expandedHierarchy[orgaoKey] !== false;
                return (
                  <div key={orgaoName} className="bg-white rounded-3xl border-2 border-blue-900/10 shadow-sm overflow-hidden">
                    <div
                      onClick={() => toggleHierarchyNode(orgaoKey)}
                      className="bg-blue-900 text-white p-5 px-6 flex items-center justify-between cursor-pointer hover:bg-blue-950 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-white/10 rounded-xl">
                          <Archive size={20} className="text-blue-200" />
                        </div>
                        <div>
                          <span className="text-[10px] font-black  tracking-widest text-blue-200">Órgão (Unidade Orgânica)</span>
                          <h4 className="text-base font-extrabold tracking-wide">{orgaoName}</h4>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold bg-white/10 px-3 py-1 rounded-full">
                          {Object.values(direcoes).reduce((acc, dirs) => acc + Object.values(dirs).reduce((a2, depts) => a2 + Object.values(depts).reduce((a3, reps) => a3 + Object.values(reps).reduce((a4, sets) => a4 + sets.length, 0), 0), 0), 0)} Documentos
                        </span>
                        {isOrgaoOpen ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                      </div>
                    </div>

                    {isOrgaoOpen && (
                      <div className="p-6 space-y-6 bg-slate-50/50">
                        {Object.entries(direcoes).map(([direcaoName, departamentos]) => {
                          const dirKey = `${orgaoKey}-dir-${direcaoName}`;
                          const isDirOpen = expandedHierarchy[dirKey] !== false;
                          return (
                            <div key={direcaoName} className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                              <div
                                onClick={() => toggleHierarchyNode(dirKey)}
                                className="bg-slate-100 p-4 px-5 flex items-center justify-between cursor-pointer hover:bg-slate-200/60 transition-colors border-b border-slate-200"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                                    <Folder size={18} />
                                  </div>
                                  <div>
                                    <span className="text-[9px] font-black  tracking-widest text-slate-500">Direção</span>
                                    <h5 className="text-sm font-extrabold text-slate-800">{direcaoName}</h5>
                                  </div>
                                </div>
                                {isDirOpen ? <ChevronDown size={18} className="text-slate-500" /> : <ChevronRight size={18} className="text-slate-500" />}
                              </div>

                              {isDirOpen && (
                                <div className="p-5 space-y-5 bg-white">
                                  {Object.entries(departamentos).map(([departamentoName, reparticoes]) => {
                                    const deptKey = `${dirKey}-dept-${departamentoName}`;
                                    const isDeptOpen = expandedHierarchy[deptKey] !== false;
                                    return (
                                      <div key={departamentoName} className="border border-slate-100 rounded-2xl p-4 bg-slate-50/30">
                                        <div
                                          onClick={() => toggleHierarchyNode(deptKey)}
                                          className="flex items-center justify-between cursor-pointer pb-3 border-b border-slate-100"
                                        >
                                          <div className="flex items-center gap-2.5">
                                            <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                                            <div>
                                              <span className="text-[9px] font-black  tracking-widest text-slate-400">Departamento</span>
                                              <h6 className="text-xs font-bold text-slate-900">{departamentoName}</h6>
                                            </div>
                                          </div>
                                          {isDeptOpen ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />}
                                        </div>

                                        {isDeptOpen && (
                                          <div className="mt-4 space-y-4 pl-4 border-l-2 border-blue-200">
                                            {Object.entries(reparticoes).map(([reparticaoName, setores]) => {
                                              const repKey = `${deptKey}-rep-${reparticaoName}`;
                                              const isRepOpen = expandedHierarchy[repKey] !== false;
                                              return (
                                                <div key={reparticaoName} className="space-y-3">
                                                  <div
                                                    onClick={() => toggleHierarchyNode(repKey)}
                                                    className="flex items-center justify-between cursor-pointer bg-white p-3 rounded-xl border border-slate-200 shadow-2xs hover:border-blue-300 transition-all"
                                                  >
                                                    <span className="text-xs font-black text-blue-900  tracking-wide">
                                                      Repartição: {reparticaoName}
                                                    </span>
                                                    {isRepOpen ? <ChevronDown size={15} className="text-slate-500" /> : <ChevronRight size={15} className="text-slate-500" />}
                                                  </div>

                                                  {isRepOpen && (
                                                    <div className="space-y-3 pl-4">
                                                      {Object.entries(setores).map(([setorName, docs]) => {
                                                        const setorKey = `${repKey}-setor-${setorName}`;
                                                        const isSetorOpen = expandedHierarchy[setorKey] !== false;
                                                        return (
                                                          <div key={setorName} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                                                            <div
                                                              onClick={() => toggleHierarchyNode(setorKey)}
                                                              className="bg-blue-50/50 p-3 px-4 flex items-center justify-between cursor-pointer border-b border-blue-100"
                                                            >
                                                              <div className="flex items-center gap-2">
                                                                <span className="text-[10px] font-black  tracking-wider text-blue-800 bg-blue-100 px-2 py-0.5 rounded">
                                                                  Setor: {setorName}
                                                                </span>
                                                                <span className="text-[10px] font-bold text-slate-500">
                                                                  ({docs.length} {docs.length === 1 ? "documento" : "documentos"})
                                                                </span>
                                                              </div>
                                                              {isSetorOpen ? <ChevronDown size={14} className="text-blue-700" /> : <ChevronRight size={14} className="text-blue-700" />}
                                                            </div>

                                                            {isSetorOpen && (
                                                              <div className="divide-y divide-slate-100">
                                                                {docs.map((doc) => {
                                                                  const docDateObj = new Date(doc.date || Date.now());
                                                                  const horaStr = docDateObj.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });
                                                                  const dataStr = docDateObj.toLocaleDateString("pt-PT");
                                                                  const mesStr = docDateObj.toLocaleString("pt-PT", { month: "long" });

                                                                  return (
                                                                    <div key={doc.id} className="p-4 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                                      <div className="flex items-start gap-3">
                                                                        <div className="p-2 bg-slate-100 rounded-xl text-slate-700 shrink-0 mt-0.5">
                                                                          {getFileIcon(doc.title)}
                                                                        </div>
                                                                        <div className="flex flex-col">
                                                                          <div className="flex items-center gap-2 flex-wrap">
                                                                            <span className="font-extrabold text-slate-900 text-sm">
                                                                              {doc.title}
                                                                            </span>
                                                                            <span className="text-[9px] font-black  tracking-widest bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                                                                              {doc.type}
                                                                            </span>
                                                                            <span className={`text-[9px] font-black  tracking-widest px-1.5 py-0.5 rounded ${doc.accessLevel === "chefia" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                                                                              {doc.accessLevel === "chefia" ? "🔒 Chefia" : "🌍 Geral"}
                                                                            </span>
                                                                          </div>

                                                                          <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 font-medium flex-wrap">
                                                                            <span>📅 <strong>Data:</strong> {dataStr} ({mesStr} de {doc.year})</span>
                                                                            <span>⏰ <strong>Hora:</strong> {horaStr}</span>
                                                                            <span>✍️ <strong>Autor:</strong> {doc.author || "Serviço Institucional"}</span>
                                                                          </div>
                                                                        </div>
                                                                      </div>

                                                                      <div className="flex items-center gap-2 shrink-0">
                                                                        <button
                                                                          onClick={() => setViewingDoc(doc)}
                                                                          className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white rounded-xl text-xs font-black  tracking-wider transition-all"
                                                                        >
                                                                          Visualizar
                                                                        </button>
                                                                        <button
                                                                          onClick={() => handleDownloadFile(doc)}
                                                                          className="p-2 bg-slate-100 text-slate-700 hover:bg-slate-800 hover:text-white rounded-xl transition-all"
                                                                          title="Descarregar Ficheiro"
                                                                        >
                                                                          <Download size={15} />
                                                                        </button>
                                                                        <button
                                                                          onClick={() => {
                                                                            setViewingDoc(doc);
                                                                            setTimeout(() => printElementById("print-area"), 300);
                                                                          }}
                                                                          className="p-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white rounded-xl transition-all"
                                                                          title="Imprimir para Autoria Física"
                                                                        >
                                                                          <Printer size={15} />
                                                                        </button>
                                                                        {isAdmin && (
                                                                          <button
                                                                            onClick={(e) => handleDeleteDocument(doc.id, e)}
                                                                            className="p-2 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-xl transition-all"
                                                                            title="Excluir"
                                                                          >
                                                                            <Trash2 size={15} />
                                                                          </button>
                                                                        )}
                                                                      </div>
                                                                    </div>
                                                                  );
                                                                })}
                                                              </div>
                                                            )}
                                                          </div>
                                                        );
                                                      })}
                                                    </div>
                                                  )}
                                                </div>
                                               );
                                            })}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    );
  };

  const renderCategoriesGrid = () => (
    <div className="w-full max-w-6xl mx-auto py-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat) => {
          const count = documents.filter(
            (d) => d.year === selectedYear && d.type === cat,
          ).length;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className="bg-white p-6 rounded-3xl border-2 border-slate-50 shadow-sm hover:border-blue-500 hover:shadow-md transition-all flex items-center justify-between group text-left"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors shrink-0">
                  <Folder size={20} />
                </div>
                <div>
                  <span className="font-extrabold text-gray-800 block text-sm leading-snug">
                    {cat}
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold  tracking-wider">
                    {count} {count === 1 ? "ficheiro" : "ficheiros"}
                  </span>
                </div>
              </div>
              <ChevronRight
                size={20}
                className="text-gray-300 group-hover:text-blue-605 transition-colors shrink-0"
              />
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderCategories = () => renderHierarchicalView();

  const renderDocuments = () => (
    <div className="w-full max-w-6xl mx-auto py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSelectedCategory(null)}
            className="p-2 bg-gray-100 rounded-full hover:bg-gray-250 transition-colors text-blue-900"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <span className="text-[10px] font-black text-slate-400  tracking-widest block mb-0.5">
              Ano {selectedYear} &bull; {selectedCategory}
            </span>
            <h3 className="text-2xl font-black text-blue-900 tracking-tight leading-tight">
              {selectedCategory}
            </h3>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-64">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Pesquisar documentos..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border-2 border-slate-100 focus:border-blue-500 focus:ring-0 outline-none text-sm font-semibold transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {isAdmin && (
            <button
              onClick={handleOpenModal}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs  tracking-widest px-5 py-3 rounded-2xl flex items-center gap-2 shadow-sm transition-all active:scale-95"
            >
              <Plus size={16} /> Carregar Ficheiro
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f8fafc] border-b border-slate-100 text-[11px] font-extrabold  tracking-widest text-[#64748b]">
                <th className="p-4 pl-6 text-left">Título do Documento</th>
                <th className="p-4 text-center">Data de Submissão</th>
                <th className="p-4 text-right pr-6">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredDocuments.length > 0 ? (
                filteredDocuments.map((doc) => (
                  <tr
                    key={doc.id}
                    className="border-b border-gray-50 hover:bg-blue-50/20 last:border-none transition-colors"
                  >
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-3">
                        <div className="bg-slate-50 p-2 rounded-xl shrink-0 border border-slate-100 shadow-sm">
                          {getFileIcon(doc.title)}
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-extrabold text-[#334155] text-sm leading-normal">
                              {doc.title}
                            </span>
                            <span
                              className={`inline-flex items-center gap-0.5 text-[8px] font-black  tracking-widest px-1.5 py-0.5 rounded ${doc.accessLevel === "chefia" ? "bg-amber-100 text-amber-700 border border-amber-200" : "bg-emerald-100 text-emerald-700 border border-emerald-200"}`}
                            >
                              {doc.accessLevel === "chefia"
                                ? "🔒 Chefia"
                                : "🌍 Geral"}
                            </span>
                          </div>
                          <span
                            className={`text-[9px] font-black  tracking-widest mt-0.5 ${doc.title.toLowerCase().endsWith(".pdf") ? "text-red-500" : doc.title.toLowerCase().endsWith(".xls") || doc.title.toLowerCase().endsWith(".xlsx") ? "text-emerald-500" : "text-blue-500"}`}
                          >
                            {getDocTypeLabel(doc.title)}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-center text-sm font-semibold text-slate-500">
                      {new Date(doc.date).toLocaleDateString("pt-PT")}
                    </td>
                    <td className="p-4 text-right pr-6">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => setViewingDoc(doc)}
                          className="text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white px-3.5 py-1.5 rounded-xl text-xs font-black  tracking-wider transition-all"
                        >
                          Visualizar
                        </button>
                        {isAdmin && (
                          <button
                            onClick={(e) => handleDeleteDocument(doc.id, e)}
                            title="Excluir documento"
                            className="text-red-500 bg-red-50 hover:bg-red-600 hover:text-white p-2 rounded-xl transition-all"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={3}
                    className="p-16 text-center text-gray-400 font-medium italic"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <FileText size={32} className="opacity-30" />
                      <span>
                        Nenhum documento encontrado nesta categoria de arquivo.
                      </span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const deptName = user?.departamento || "Departamento de Biblioteca";
  const dirName = user?.direcao || "DICOSSER";
  const userName = user?.name || "";
  const userCargo = user?.cargo || user?.role || "Chefe da Repartição";

  return (
    <div className="h-full w-full bg-[#f8f9fa] flex flex-col overflow-hidden">
      <header className="flex-none flex justify-between items-center p-6 border-b border-gray-100 bg-white">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 bg-gray-100 rounded-full hover:bg-gray-250 transition-colors text-blue-900 active:scale-90"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Archive size={20} />
            </div>
            <div>
              <span className="text-[10px] font-black text-slate-400  tracking-widest block mb-0.5">
                {dirName} &bull; {deptName}
              </span>
              <h1 className="text-sm font-black tracking-widest text-[#1e3a8a] ">
                Acervo Geral e Repartição de Arquivo
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow p-4 md:p-8 overflow-auto">
        <div className="w-full max-w-6xl mx-auto mb-6 bg-gradient-to-r from-blue-900 to-[#1e40af] p-8 md:p-10 rounded-3xl text-white shadow-md relative overflow-hidden">
          <div className="absolute right-0 bottom-0 translate-y-1/4 translate-x-1/12 opacity-10">
            <Archive size={300} />
          </div>
          <div className="relative z-10 max-w-2xl">
            {userName ? (
              <span className="text-[10px] font-black  tracking-widest bg-[#10b981]/30 text-emerald-250 px-3 py-1 rounded-full inline-block mb-3 border border-[#10b981]/25">
                Sessão Iniciada &bull; {userName} ({userCargo})
              </span>
            ) : (
              <span className="text-[10px] font-black  tracking-widest bg-blue-500/30 text-blue-200 px-3 py-1 rounded-full inline-block mb-3 border border-blue-400/20">
                Arquivo Morto & Ativo Geral
              </span>
            )}
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2 leading-snug">
              Repositório Geral de Documentos
            </h2>
            <p className="text-blue-105/90 text-sm font-medium leading-relaxed">
              Consulte e organize o histórico oficial de relatórios
              institucionais, orçamentos, planos de atividades setorizados e
              contratos de formação técnica do {deptName}. Todos os arquivos são
              mantidos sob estrito rigor académico e regulamentar.
            </p>
          </div>
        </div>

        <div className="w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
              <div>
                <span className="text-[10px] font-black  tracking-widest text-emerald-600 block">
                  Ciclo Ativo de Produção (Ano Corrente: {activeCycleYear})
                </span>
                <p className="text-xs font-bold text-slate-700">
                  Organização por Setor &bull; Fecho a 20 de Dezembro &bull; Novo ciclo na 1ª Segunda-feira de N+1
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setShowConsultationYears(false);
                  setSelectedYear(activeCycleYear);
                  setSelectedCategory(null);
                }}
                className={`px-4 py-2.5 rounded-2xl text-xs font-black  tracking-wider transition-all ${!showConsultationYears && selectedYear === activeCycleYear ? "bg-blue-600 text-white shadow-md" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
              >
                📁 Ciclo Atual ({activeCycleYear})
              </button>
              <button
                onClick={() => {
                  setShowConsultationYears(true);
                  setSelectedYear(null);
                  setSelectedCategory(null);
                }}
                className={`px-4 py-2.5 rounded-2xl text-xs font-black  tracking-wider transition-all ${showConsultationYears || selectedYear !== activeCycleYear ? "bg-amber-600 text-white shadow-md" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
              >
                🔍 Consultar Ciclos Anteriores
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={
                showConsultationYears ? "consultation" : (selectedYear ? (selectedCategory ? "docs" : "cats") : "years")
              }
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.15 }}
            >
              {showConsultationYears && renderYears()}
              {!showConsultationYears && selectedYear && !selectedCategory && renderCategories()}
              {!showConsultationYears && selectedYear && selectedCategory && renderDocuments()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Modal de Visualização de Documento */}
      {viewingDoc && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[120] flex flex-col p-4 md:p-8 animate-fade-in">
          <div className="flex justify-between items-center mb-4 text-white">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-600 rounded-xl">
                {getFileIcon(viewingDoc.title)}
              </div>
              <div>
                <h3 className="text-xl font-black tracking-tight">
                  {viewingDoc.title}
                </h3>
                <p className="text-white/60 text-[10px] font-bold  tracking-widest">
                  {viewingDoc.fileUrl
                    ? "Original Carregado"
                    : "Documento Institucional"}{" "}
                  &bull; Digitalizado em{" "}
                  {new Date(viewingDoc.date).toLocaleDateString("pt-PT")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => handleExportPDF(viewingDoc)}
                className="hidden md:flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl text-xs font-black  tracking-wider transition-all shadow-lg"
              >
                Abrir em PDF
              </button>
              <button
                onClick={() => handleDownloadFile(viewingDoc)}
                className="hidden md:flex items-center gap-2 bg-white/10 hover:bg-blue-600 px-4 py-2 rounded-xl text-xs font-black  tracking-wider transition-all"
              >
                Transferir Original
              </button>
              <button
                onClick={() => setViewingDoc(null)}
                className="p-3 bg-white/10 hover:bg-red-600 rounded-full transition-all text-white"
              >
                <X size={24} />
              </button>
            </div>
          </div>

          <div
            className="flex-1 bg-white rounded-[32px] overflow-hidden shadow-2xl relative flex items-center justify-center border-4 border-white/20"
            id="document-preview-content"
          >
            {viewingDoc.fileUrl ? (
              <div className="w-full h-full bg-slate-800 flex flex-col">
                {/* Real File Viewer */}
                {viewingDoc.title.toLowerCase().endsWith(".pdf") ? (
                  <iframe
                    src={viewingDoc.fileUrl}
                    className="w-full h-full border-none"
                    title={viewingDoc.title}
                  />
                ) : viewingDoc.title
                    .toLowerCase()
                    .match(/\.(jpg|jpeg|png|gif|webp)$/) ? (
                  <div className="w-full h-full overflow-auto flex items-center justify-center p-8 bg-slate-900">
                    <img
                      src={viewingDoc.fileUrl}
                      alt={viewingDoc.title}
                      className="max-w-full max-h-full object-contain shadow-2xl rounded-sm"
                    />
                  </div>
                ) : viewingDoc.title.toLowerCase().endsWith(".xlsx") ||
                  viewingDoc.title.toLowerCase().endsWith(".xls") ||
                  viewingDoc.title.toLowerCase().endsWith(".csv") ? (
                  <div className="w-full h-full bg-slate-50 overflow-auto p-8">
                    <div className="max-w-7xl mx-auto space-y-8">
                      <div className="flex items-center justify-between border-b-2 border-emerald-500 pb-4">
                        <div>
                          <h4 className="text-2xl font-black text-slate-900  tracking-tighter">
                            Visualizador de Dados
                          </h4>
                          <p className="text-xs font-bold text-slate-400  tracking-widest mt-1">
                            Exibindo conteúdo original da folha de cálculo
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleDownloadFile(viewingDoc)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-5 py-2 rounded-xl  tracking-widest text-[10px] transition-all shadow-lg"
                          >
                            Descarregar Original
                          </button>
                          <span className="bg-emerald-100 text-emerald-700 px-4 py-2 rounded-xl text-[10px] font-black  tracking-widest border border-emerald-200">
                            Integridade Verificada
                          </span>
                        </div>
                      </div>

                      <ExcelPreview dataUrl={viewingDoc.fileUrl} />

                      <div className="p-6 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-4">
                        <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
                          <Archive size={20} />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-black text-amber-900  tracking-tight">
                            Nota de Visualização
                          </p>
                          <p className="text-xs font-medium text-amber-800 leading-relaxed">
                            Este visualizador processa os dados brutos do
                            ficheiro para consulta rápida. Para visualizar
                            gráficos, tabelas dinâmicas ou macros originais,
                            utilize a aplicação nativa descarregando o ficheiro.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full bg-white flex flex-col items-center justify-center p-20 text-center">
                    <FileText
                      size={120}
                      className="text-blue-900 opacity-10 mb-8"
                    />
                    <h4 className="text-3xl font-black text-slate-900 mb-4 tracking-tighter">
                      DOCUMENTO CARREGADO
                    </h4>
                    <p className="text-slate-500 font-bold max-w-lg mb-8 text-lg">
                      Este ficheiro ({viewingDoc.title}) foi arquivado com
                      sucesso no sistema. Devido à natureza do formato,
                      recomenda-se a abertura na aplicação nativa correspondente
                      (Word, PowerPoint, etc).
                    </p>
                    <button
                      onClick={() => handleDownloadFile(viewingDoc)}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-black px-12 py-4 rounded-2xl  tracking-widest text-sm transition-all shadow-xl hover:scale-105 active:scale-95"
                    >
                      Descarregar e Ver Completo
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Simulated Document Viewer for seed data */
              <div className="absolute inset-0 bg-slate-100 flex flex-col">
                <div className="h-14 bg-slate-900 flex items-center px-6 justify-between text-white border-b border-slate-800 shadow-lg z-20">
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-black text-xs">
                        U
                      </div>
                      <span className="text-[10px] font-black  tracking-widest text-slate-400 hidden md:inline">
                        Universal Viewer SIGEP
                      </span>
                    </div>
                    <div className="h-6 w-px bg-slate-700 hidden md:block"></div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-slate-300">
                        {viewingDoc.title}
                      </span>
                      <span className="px-2 py-0.5 bg-slate-800 rounded text-[9px] font-black  text-slate-500 border border-slate-700">
                        Digitalizado
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleExportPDF(viewingDoc)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-[10px] font-black  tracking-wider transition-all shadow-lg"
                    >
                      Exportar PDF
                    </button>
                    <button
                      onClick={handlePrintFile}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-[10px] font-black  tracking-wider transition-all border border-slate-700"
                    >
                      Imprimir
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-auto p-4 md:p-12 flex justify-center bg-slate-800/20">
                  <div id="print-area" className="w-full max-w-4xl bg-white shadow-2xl p-8 md:p-20 min-h-[1400px] relative rounded-sm">
                    <div className="relative z-10 space-y-12">
                      {/* Cabeçalho Oficial Padronizado */}
                      <div className="w-full">
                        <InstitutionalHeader 
                          unidadeName={user?.unidadeOrganica || "UNIDADE ORGÂNICA"}
                          direcaoName={user?.direcao || "Songo"}
                          departamentoName={user?.departamento}
                          reparticaoName={user?.reparticao}
                          sectorName={user?.setor}
                          year={viewingDoc.year}
                          title={viewingDoc.title}
                        />
                      </div>

                      <div className="text-center py-10 space-y-3">
                        <div className="inline-block px-4 py-1 bg-slate-900 text-white text-[10px] font-black  tracking-widest rounded-full mb-2">
                          {getDocTypeLabel(viewingDoc.title)}
                        </div>
                        <h4 className="text-3xl font-black  tracking-tighter text-slate-900 max-w-2xl mx-auto leading-none">
                          {viewingDoc.title}
                        </h4>
                        <p className="text-base font-bold text-slate-500  tracking-[0.2em] border-t border-b border-slate-100 py-2 inline-block">
                          CICLO DE GESTÃO {viewingDoc.year}
                        </p>
                      </div>

                      <div className="space-y-10 py-8">
                        {viewingDoc.content ||
                        viewingDoc.sections ||
                        viewingDoc.actividades ? (
                          <div className="prose prose-slate max-w-none">
                            <div className="bg-slate-50 p-10 rounded-2xl border border-slate-100 min-h-[400px] text-slate-700 text-base leading-relaxed text-justify">
                              {viewingDoc.content ? (
                                <div className="whitespace-pre-wrap">
                                  {viewingDoc.content}
                                </div>
                              ) : viewingDoc.sections ? (
                                <div className="space-y-10">
                                  {viewingDoc.sections.map(
                                    (s: any, idx: number) => (
                                      <div key={idx} className="space-y-4">
                                        <h6 className="text-lg font-black text-slate-900  tracking-tight border-b-2 border-slate-200 pb-2">
                                          {s.title}
                                        </h6>
                                        <p className="whitespace-pre-wrap text-slate-700">
                                          {s.content}
                                        </p>
                                      </div>
                                    ),
                                  )}
                                </div>
                              ) : viewingDoc.actividades ? (
                                <div className="space-y-6">
                                  <h6 className="text-lg font-black text-slate-900  tracking-tight border-b-2 border-slate-200 pb-2">
                                    Plano de Atividades Resumido
                                  </h6>
                                  <div className="grid grid-cols-1 gap-4">
                                    {viewingDoc.actividades
                                      .slice(0, 10)
                                      .map((act, i) => (
                                        <div
                                          key={i}
                                          className="flex justify-between items-center p-4 bg-white rounded-xl border border-slate-100 shadow-sm"
                                        >
                                          <span className="font-bold text-slate-800">
                                            {act.actividade || act.activity}
                                          </span>
                                          <span className="font-mono text-blue-600 font-bold">
                                            {(act.valor || 0).toLocaleString()}{" "}
                                            MZN
                                          </span>
                                        </div>
                                      ))}
                                  </div>
                                </div>
                              ) : null}
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-12 opacity-20">
                            {[1, 2, 3].map((i) => (
                              <div key={i} className="space-y-4">
                                <div className="h-6 bg-slate-900 rounded w-1/3"></div>
                                <div className="space-y-2">
                                  <div className="h-4 bg-slate-400 rounded w-full"></div>
                                  <div className="h-4 bg-slate-400 rounded w-11/12"></div>
                                  <div className="h-4 bg-slate-400 rounded w-full"></div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="pt-20 flex justify-between items-center border-t border-slate-100 opacity-60">
                        <p className="text-[9px] font-bold text-slate-400 leading-tight">
                          Documento gerado institucionalmente pelo sistema
                          SIGEP em{" "}
                          {new Date(viewingDoc.date).toLocaleDateString(
                            "pt-PT",
                          )}
                        </p>
                        <p className="text-[9px] font-bold text-slate-300 tracking-widest font-mono">
                          ID: {viewingDoc.id.toUpperCase()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Upload/Creation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] animate-scale-up">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <span className="text-[10px] font-black text-blue-600  tracking-widest block mb-0.5">
                  Submeter Novo Documento
                </span>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">
                  Registo no Arquivo Morto
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-605 hover:bg-slate-200/50 rounded-xl transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleCreateDocument}
              className="p-6 overflow-y-auto space-y-4"
            >
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-black text-slate-500  tracking-wider">
                  Selecionar Ficheiro
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setSelectedFile(file);
                        if (!newTitle) {
                          const nameWithoutExt = file.name.replace(
                            /\.[^/.]+$/,
                            "",
                          );
                          setNewTitle(nameWithoutExt);
                        }
                      }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div
                    className={`p-4 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 transition-all ${selectedFile ? "border-emerald-500 bg-emerald-50" : "border-slate-200 hover:border-blue-400 bg-slate-50"}`}
                  >
                    {selectedFile ? (
                      <>
                        {getFileIcon(selectedFile.name)}
                        <span className="text-xs font-bold text-emerald-700 truncate max-w-full px-4">
                          {selectedFile.name}
                        </span>
                        <span className="text-[9px] font-black text-emerald-500 ">
                          Ficheiro Pronto para Guardar
                        </span>
                      </>
                    ) : (
                      <>
                        <Plus className="text-slate-400" size={24} />
                        <span className="text-xs font-bold text-slate-500">
                          Clique para carregar ou arraste o ficheiro
                        </span>
                        <span className="text-[9px] font-black text-slate-400  tracking-widest text-center">
                          Formatos aceites: Word, Excel, PowerPoint, PDF,
                          Imagens (Máx 25MB)
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-black text-slate-500  tracking-wider">
                  Título do Documento Digital
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Relatório Consolidado de Infraestruturas"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="px-4 py-2.5 rounded-xl border-2 border-slate-100 focus:border-blue-500 focus:ring-0 outline-none text-sm font-semibold transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-black text-slate-500  tracking-wider">
                  Nível de Acesso (Consulta Interna)
                </label>
                <select
                  value={newAccessLevel}
                  onChange={(e) =>
                    setNewAccessLevel(e.target.value as "geral" | "chefia")
                  }
                  className="px-4 py-2.5 rounded-xl border-2 border-slate-100 focus:border-blue-500 focus:ring-0 outline-none text-sm font-semibold transition-all bg-white"
                >
                  <option value="geral">
                    🌍 Consulta Geral (Disponível para todos os utilizadores)
                  </option>
                  <option value="chefia">
                    🔒 Apenas Chefia (Restrito para cargos de chefia e direção)
                  </option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-black text-slate-500  tracking-wider">
                    Ano do Arquivo
                  </label>
                  <select
                    value={newYear}
                    onChange={(e) => setNewYear(Number(e.target.value))}
                    className="px-4 py-2.5 rounded-xl border-2 border-slate-100 focus:border-blue-500 focus:ring-0 outline-none text-sm font-semibold transition-all bg-white"
                  >
                    {years.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-black text-slate-500  tracking-wider">
                    Data de Registo
                  </label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="px-4 py-2.5 rounded-xl border-2 border-slate-100 focus:border-blue-500 focus:ring-0 outline-none text-sm font-semibold transition-all"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-black text-slate-500  tracking-wider">
                  Categoria / Pasta
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="px-4 py-2.5 rounded-xl border-2 border-slate-100 focus:border-blue-500 focus:ring-0 outline-none text-sm font-semibold transition-all bg-white"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {isSubmitting && (
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-black text-blue-600  tracking-widest">
                    <span>A digitalizar documento...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-blue-600"
                      initial={{ width: 0 }}
                      animate={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-205 text-slate-600 font-bold text-xs  tracking-widest rounded-xl transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || (!selectedFile && !newTitle)}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs  tracking-widest rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-2"
                >
                  {isSubmitting ? "A digitalizar..." : "Carregar e Arquivar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <footer
        className="flex-none bg-blue-900 text-white text-center py-2.5 text-[11px] font-bold tracking-wider shadow-[0_-5px_15px_rgba(0,0,0,0.3)] z-50 relative border-t border-white/10"
        style={{
          textShadow:
            "1px 1px 0 #000, 2px 2px 0 #000, 3px 3px 0 #000, 4px 4px 4px rgba(0,0,0,0.5)",
        }}
      >
        Desenvolvido por fttripas - 2025-2026 | @todos os direitos reservados
      </footer>
    </div>
  );
}
