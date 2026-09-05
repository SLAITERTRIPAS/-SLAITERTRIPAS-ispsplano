import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  User,
  Calendar,
  X,
  Save,
  ChevronDown,
  Upload,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { firestoreService } from "../../lib/firestoreService";
import {
  PROVINCIAS_LIST,
  UNIDADES_ORGANICAS_SISTEMA,
  DEPARTAMENTOS,
  REPARTICOES,
  CURSOS,
  NIVEIS_ACADEMICOS,
  CATEGORIAS_FUNCIONARIOS,
  CATEGORIAS_DOCENTES,
  LISTA_CARGOS_CHEFIA,
  ESTADOS_CIVIS,
  getSetoresByDepartamento,
} from "../../constants/formOptions";
import { generateCollaboratorId } from "../../lib/utils";

interface FormularioAlocacaoDocenteProps {
  docente?: any;
  initialData?: any;
  cursoContexto?: string;
  onCancel: () => void;
  onSubmitSuccess?: (data: any) => void;
}

export default function FormularioAlocacaoDocente({
  docente,
  initialData,
  cursoContexto,
  onCancel,
  onSubmitSuccess,
}: FormularioAlocacaoDocenteProps) {
  const targetData = docente || initialData || {};

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(
    targetData.fotoUrl || targetData.foto || null
  );

  // Form State
  const [formData, setFormData] = useState({
    id: targetData.id || "",
    numeroProcesso:
      targetData.numeroProcesso ||
      targetData.id ||
      `AAFM${Math.floor(100000000 + Math.random() * 900000000)}`,
    nome: targetData.nome || "",
    genero: targetData.genero || "Masculino",
    nuit: targetData.nuit || "",
    email: targetData.email || "",
    telefone: targetData.telefone || "",
    estadoCivil: targetData.estadoCivil || "Selecione...",
    filiacaoPai: targetData.filiacaoPai || targetData.pai || "",
    filiacaoMae: targetData.filiacaoMae || targetData.mae || "",
    biNo: targetData.biNo || targetData.numeroBI || "",
    biEmitidoLocal: targetData.biEmitidoLocal || "",
    biEmitidoData: targetData.biEmitidoData || "",
    passaporteNo: targetData.passaporteNo || "",
    passaporteEmitidoLocal: targetData.passaporteEmitidoLocal || "",

    // Local de Nascimento
    nacionalidade: targetData.nacionalidade || "Moçambique",
    provinciaNascimento: targetData.provinciaNascimento || "Zambézia",
    distritoNascimento: targetData.distritoNascimento || "Selecione...",
    dataNascimento: targetData.dataNascimento || "",
    morada: targetData.morada || "",
    bairro: targetData.bairro || "",
    distritoResidencia: targetData.distritoResidencia || "",
    celula: targetData.celula || "",
    quarteiraoNo: targetData.quarteiraoNo || "",
    casaNo: targetData.casaNo || "",
    numFilhos: targetData.numFilhos || targetData.totalFilhos || "0",

    // Alocação Institucional
    orgao: targetData.orgao || "Selecione...",
    direcao: targetData.direcao || "Divisão de Engenharia",
    departamento: targetData.departamento || "Selecione...",
    reparticao: targetData.reparticao || "Selecione...",
    seccao: targetData.seccao || "Selecione...",
    curso: targetData.curso || cursoContexto || "Selecione...",

    // Dados Profissionais & Formação
    funcao: targetData.funcao || "Selecione...",
    efetivo: targetData.efetivo || "Sim",
    estado: targetData.estado || "Ativo",
    categoria: targetData.categoria || "Selecione...",
    carreira: targetData.carreira || "Docente",
    tipoContrato: targetData.tipoContrato || "Tempo inteiro",
    vinculoContractual: targetData.vinculoContractual || "Pertence ao quadro",
    dataAdmissao: targetData.dataAdmissao || "",
    nivelAcademico: targetData.nivelAcademico || "Selecione...",
    areaFormacao: targetData.areaFormacao || "Geral",

    // Disciplinas (Até 4)
    disciplina1: targetData.disciplinas?.[0] || targetData.disciplina1 || "",
    disciplina2: targetData.disciplinas?.[1] || targetData.disciplina2 || "",
    disciplina3: targetData.disciplinas?.[2] || targetData.disciplina3 || "",
    disciplina4: targetData.disciplinas?.[3] || targetData.disciplina4 || "",

    // Cargo de Chefia e Confiança
    cargoChefia: targetData.cargoChefia || "Selecione...",
    dataNomeacao: targetData.dataNomeacao || "",
    dataDesnomeacao: targetData.dataDesnomeacao || "",
    estadoMandato: targetData.estadoMandato || "Em Actividade",
    estadoColaborador: targetData.estadoColaborador || "Ativo",
  });

  useEffect(() => {
    if (!targetData.id && (formData.nome || formData.nuit)) {
      const generatedId = generateCollaboratorId(formData.nome, formData.nuit);
      if (generatedId && generatedId !== formData.numeroProcesso) {
        setFormData((prev) => ({ ...prev, numeroProcesso: generatedId, id: generatedId }));
      }
    }
  }, [formData.nome, formData.nuit, targetData.id]);

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const disciplinasArray = [
        formData.disciplina1,
        formData.disciplina2,
        formData.disciplina3,
        formData.disciplina4,
      ].filter((d) => d && d.trim().length > 0);

      const payload = {
        ...targetData,
        ...formData,
        tipo: "Docente",
        carreira: formData.carreira || "Docente",
        disciplinas: disciplinasArray,
        fotoUrl: photoPreview || targetData.fotoUrl || "",
        lastUpdate: new Date().toISOString(),
      };

      // Create or Update in Firestore
      if (formData.id) {
        await firestoreService.colaboradores.update(formData.id, payload);
      } else {
        const newDoc = await firestoreService.colaboradores.add(payload);
        const createdId =
          typeof newDoc === "string"
            ? newDoc
            : (newDoc as any)?.id || `COLAB-${Date.now()}`;
        payload.id = createdId;
      }

      // If there is a course context, create course allocation
      if (cursoContexto || (formData.curso && formData.curso !== "Selecione...")) {
        const targetCurso = cursoContexto || formData.curso;
        const docenteId = formData.id || payload.id;
        if (docenteId) {
          try {
            await firestoreService.alocacoes_docentes.add({
              docenteId,
              curso: targetCurso,
              disciplinas: disciplinasArray,
              dataAlocacao: new Date().toISOString(),
            });
          } catch (e) {
            console.error("Erro ao registrar alocação no curso:", e);
          }
        }
      }

      if (onSubmitSuccess) {
        onSubmitSuccess(payload);
      } else {
        alert("Processo e alocação salvos com sucesso!");
        onCancel();
      }
    } catch (error) {
      console.error("Erro ao guardar dados:", error);
      alert("Erro ao guardar alterações. Por favor tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto bg-white p-4 sm:p-8 rounded-3xl shadow-xl border border-slate-100 font-sans text-slate-800 my-4">
      {/* Photo & Header Title */}
      <div className="flex flex-col items-center justify-center mb-8">
        <label className="relative group cursor-pointer">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-slate-100 border-2 border-slate-200 flex flex-col items-center justify-center text-slate-400 overflow-hidden shadow-inner group-hover:border-blue-500 transition-all">
            {photoPreview ? (
              <img
                src={photoPreview}
                alt="Foto Docente"
                className="w-full h-full object-cover"
              />
            ) : (
              <>
                <User size={36} strokeWidth={1.5} />
                <span className="text-[9px] font-black  tracking-wider mt-1 text-slate-400">
                  Adicionar Foto
                </span>
              </>
            )}
          </div>
          <input
            type="file"
            accept="image/*"
            onChange={handlePhotoUpload}
            className="hidden"
          />
        </label>

        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight  text-center mt-4">
          {formData.nome || "ALOCAÇÃO DE DOCENTE"}
        </h1>

        <div className="flex items-center gap-3 mt-2">
          <div className="h-px w-8 sm:w-16 bg-slate-200"></div>
          <span className="text-[9px] font-black text-slate-400 tracking-[0.25em] ">
            ATUALIZAÇÃO DE PROCESSO INDIVIDUAL
          </span>
          <div className="h-px w-8 sm:w-16 bg-slate-200"></div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* SECTION 1: Dados Pessoais */}
        <div className="relative rounded-[2rem] border-2 border-slate-900 p-6 pt-8 bg-white shadow-sm">
          <div className="absolute -top-3.5 left-6 bg-white px-3 flex items-center gap-2 font-black text-xs text-blue-900 tracking-tight">
            <span className="w-1 h-4 bg-blue-600 rounded-full inline-block"></span>
            Dados Pessoais
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs font-semibold">
            {/* Nº Processo / ID Único */}
            <div className="space-y-1 sm:col-span-1">
              <label className="text-[10px] font-black text-red-600  tracking-wider">
                Nº Processo / ID Único *
              </label>
              <input
                type="text"
                value={formData.numeroProcesso}
                onChange={(e) => handleChange("numeroProcesso", e.target.value)}
                className="w-full px-3 py-2.5 bg-red-50/50 border border-red-200 rounded-xl text-red-600 font-bold focus:outline-none focus:ring-2 focus:ring-red-400"
              />
            </div>

            {/* Nome Completo */}
            <div className="space-y-1 sm:col-span-1 md:col-span-3">
              <label className="text-[10px] font-bold text-slate-700">
                Nome Completo
              </label>
              <input
                type="text"
                value={formData.nome}
                onChange={(e) => handleChange("nome", e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Digite o nome completo"
              />
            </div>

            {/* Género */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-700">
                Género
              </label>
              <div className="relative">
                <select
                  value={formData.genero}
                  onChange={(e) => handleChange("genero", e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium appearance-none pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Masculino">Masculino</option>
                  <option value="Feminino">Feminino</option>
                </select>
                <ChevronDown
                  size={16}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
                />
              </div>
            </div>

            {/* NUIT */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-700">
                NUIT
              </label>
              <input
                type="text"
                value={formData.nuit}
                onChange={(e) => handleChange("nuit", e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Email Pessoal */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-700">
                Email Pessoal
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Telefone */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-700">
                Telefone
              </label>
              <input
                type="text"
                value={formData.telefone}
                onChange={(e) => handleChange("telefone", e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Estado Civil */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-700">
                Estado Civil
              </label>
              <div className="relative">
                <select
                  value={formData.estadoCivil}
                  onChange={(e) => handleChange("estadoCivil", e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium appearance-none pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Selecione...">Selecione...</option>
                  <option value="Solteiro(a)">Solteiro(a)</option>
                  <option value="Casado(a)">Casado(a)</option>
                  <option value="Divorciado(a)">Divorciado(a)</option>
                  <option value="Viúvo(a)">Viúvo(a)</option>
                </select>
                <ChevronDown
                  size={16}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
                />
              </div>
            </div>

            {/* Nome do Pai */}
            <div className="space-y-1 sm:col-span-2">
              <label className="text-[10px] font-bold text-slate-700">
                Nome do Pai
              </label>
              <input
                type="text"
                value={formData.filiacaoPai}
                onChange={(e) => handleChange("filiacaoPai", e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Nome da Mãe */}
            <div className="space-y-1 sm:col-span-2">
              <label className="text-[10px] font-bold text-slate-700">
                Nome da Mãe
              </label>
              <input
                type="text"
                value={formData.filiacaoMae}
                onChange={(e) => handleChange("filiacaoMae", e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* BI / ... */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-700">
                BI / ...
              </label>
              <input
                type="text"
                value={formData.biNo}
                onChange={(e) => handleChange("biNo", e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Emitido em */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-700">
                Emitido em
              </label>
              <input
                type="text"
                placeholder="Ex: Maputo"
                value={formData.biEmitidoLocal}
                onChange={(e) => handleChange("biEmitidoLocal", e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Data de Emissão (BI) */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-700">
                Data de Emissão (BI)
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="dd/mm/aaaa"
                  value={formData.biEmitidoData}
                  onChange={(e) => handleChange("biEmitidoData", e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Calendar
                  size={16}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
              </div>
            </div>

            {/* Passaporte Nº */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-700">
                Passaporte Nº
              </label>
              <input
                type="text"
                value={formData.passaporteNo}
                onChange={(e) => handleChange("passaporteNo", e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Emitido em (Passaporte) */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-700">
                Emitido em
              </label>
              <input
                type="text"
                value={formData.passaporteEmitidoLocal}
                onChange={(e) =>
                  handleChange("passaporteEmitidoLocal", e.target.value)
                }
                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: Local de Nascimento */}
        <div className="relative rounded-[2rem] border-2 border-slate-900 p-6 pt-8 bg-white shadow-sm">
          <div className="absolute -top-3.5 left-6 bg-white px-3 flex items-center gap-2 font-black text-xs text-blue-900 tracking-tight">
            <span className="w-1 h-4 bg-blue-600 rounded-full inline-block"></span>
            Local de Nascimento
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs font-semibold">
            {/* Nacionalidade */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-700">
                Nacionalidade
              </label>
              <input
                type="text"
                value={formData.nacionalidade}
                onChange={(e) => handleChange("nacionalidade", e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Província de Nascimento */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-700">
                Província de Nascimento
              </label>
              <div className="relative">
                <select
                  value={formData.provinciaNascimento}
                  onChange={(e) =>
                    handleChange("provinciaNascimento", e.target.value)
                  }
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium appearance-none pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {PROVINCIAS_LIST.map((prov) => (
                    <option key={prov} value={prov}>
                      {prov}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={16}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
                />
              </div>
            </div>

            {/* Distrito */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-700">
                Distrito
              </label>
              <div className="relative">
                <select
                  value={formData.distritoNascimento}
                  onChange={(e) =>
                    handleChange("distritoNascimento", e.target.value)
                  }
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium appearance-none pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Selecione...">Selecione...</option>
                  <option value="Quelimane">Quelimane</option>
                  <option value="Gúruè">Gúruè</option>
                  <option value="Mocuba">Mocuba</option>
                  <option value="Outro">Outro</option>
                </select>
                <ChevronDown
                  size={16}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
                />
              </div>
            </div>

            {/* Data de Nascimento */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-700">
                Data de Nascimento
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="06/09/1984"
                  value={formData.dataNascimento}
                  onChange={(e) => handleChange("dataNascimento", e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Calendar
                  size={16}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
              </div>
            </div>

            {/* Morada */}
            <div className="space-y-1 sm:col-span-2 md:col-span-2">
              <label className="text-[10px] font-bold text-slate-700">
                Morada (Província, Distrito, Bairro)
              </label>
              <input
                type="text"
                value={formData.morada}
                onChange={(e) => handleChange("morada", e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Bairro */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-700">
                Bairro
              </label>
              <input
                type="text"
                value={formData.bairro}
                onChange={(e) => handleChange("bairro", e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Distrito (Residência) */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-700">
                Distrito (Residência)
              </label>
              <input
                type="text"
                value={formData.distritoResidencia}
                onChange={(e) =>
                  handleChange("distritoResidencia", e.target.value)
                }
                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Célula */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-700">
                Célula
              </label>
              <input
                type="text"
                value={formData.celula}
                onChange={(e) => handleChange("celula", e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Quarteirão Nº */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-700">
                Quarteirão Nº
              </label>
              <input
                type="text"
                value={formData.quarteiraoNo}
                onChange={(e) => handleChange("quarteiraoNo", e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Casa Nº */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-700">
                Casa Nº
              </label>
              <input
                type="text"
                value={formData.casaNo}
                onChange={(e) => handleChange("casaNo", e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Nº de Filhos */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-700">
                Nº de Filhos
              </label>
              <input
                type="text"
                value={formData.numFilhos}
                onChange={(e) => handleChange("numFilhos", e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: Alocação Institucional */}
        <div className="relative rounded-[2rem] border-2 border-slate-900 p-6 pt-8 bg-white shadow-sm">
          <div className="absolute -top-3.5 left-6 bg-white px-3 flex items-center gap-2 font-black text-xs text-blue-900 tracking-tight">
            <span className="w-1 h-4 bg-blue-600 rounded-full inline-block"></span>
            Alocação Institucional
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-3 gap-4 text-xs font-semibold">
            {/* Órgão */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-700">
                Órgão
              </label>
              <div className="relative">
                <select
                  value={formData.orgao}
                  onChange={(e) => handleChange("orgao", e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium appearance-none pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Selecione...">Selecione...</option>
                  <option value="Conselho de Direção">Conselho de Direção</option>
                  <option value="Direção Geral">Direção Geral</option>
                  <option value="Conselho Académico">Conselho Académico</option>
                </select>
                <ChevronDown
                  size={16}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
                />
              </div>
            </div>

            {/* Direção */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-700">
                Direção
              </label>
              <div className="relative">
                <select
                  value={formData.direcao}
                  onChange={(e) => handleChange("direcao", e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium appearance-none pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Divisão de Engenharia">Divisão de Engenharia</option>
                  <option value="Divisão de Agricultura">Divisão de Agricultura</option>
                  <option value="Divisão de Economia e Gestão">
                    Divisão de Economia e Gestão
                  </option>
                  <option value="Unidade Orgânica">Unidade Orgânica</option>
                </select>
                <ChevronDown
                  size={16}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
                />
              </div>
            </div>

            {/* Departamento */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-700">
                Departamento
              </label>
              <div className="relative">
                <select
                  value={formData.departamento}
                  onChange={(e) => handleChange("departamento", e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium appearance-none pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Selecione...">Selecione...</option>
                  <option value="Departamento de Engenharia Informática">
                    Departamento de Engenharia Informática
                  </option>
                  <option value="Departamento de Engenharia Agronómica">
                    Departamento de Engenharia Agronómica
                  </option>
                  <option value="Departamento de Gestão">
                    Departamento de Gestão
                  </option>
                </select>
                <ChevronDown
                  size={16}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
                />
              </div>
            </div>

            {/* Repartição / Secção */}
            <div className="space-y-1 sm:col-span-2">
              <label className="text-[10px] font-bold text-slate-700">
                Repartição / Secção
              </label>
              <div className="relative">
                <select
                  value={formData.reparticao}
                  onChange={(e) => handleChange("reparticao", e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium appearance-none pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Selecione...">Selecione...</option>
                  <option value="Repartição de Pessoal">Repartição de Pessoal</option>
                  <option value="Repartição Académica">Repartição Académica</option>
                  <option value="Repartição de Finanças">
                    Repartição de Finanças
                  </option>
                </select>
                <ChevronDown
                  size={16}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
                />
              </div>
            </div>

            {/* Secção */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-700">
                Secção
              </label>
              <div className="relative">
                <select
                  value={formData.seccao}
                  onChange={(e) => handleChange("seccao", e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium appearance-none pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Selecione...">Selecione...</option>
                  <option value="Secção Docente">Secção Docente</option>
                  <option value="Secção Administrativa">Secção Administrativa</option>
                </select>
                <ChevronDown
                  size={16}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 4: Dados Profissionais & Formação Académica */}
        <div className="relative rounded-[2rem] border-2 border-slate-900 p-6 pt-8 bg-white shadow-sm">
          <div className="absolute -top-3.5 left-6 bg-white px-3 flex items-center gap-2 font-black text-xs text-blue-900 tracking-tight">
            <span className="w-1 h-4 bg-blue-600 rounded-full inline-block"></span>
            Dados Profissionais & Formação Académica
          </div>

          <div className="space-y-4">
            {/* Linha 1: Função, Categoria, Efetivo */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-semibold">
              {/* Função */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-700">
                  Função
                </label>
                <div className="relative">
                  <select
                    value={formData.funcao}
                    onChange={(e) => handleChange("funcao", e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium appearance-none pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Selecione...">Selecione...</option>
                    <option value="Docente">Docente</option>
                    <option value="Chefe de Departamento">
                      Chefe de Departamento
                    </option>
                    <option value="Diretor de Curso">Diretor de Curso</option>
                    <option value="Técnico">Técnico</option>
                  </select>
                  <ChevronDown
                    size={16}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
                  />
                </div>
              </div>

              {/* Categoria */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-700">
                  Categoria
                </label>
                <div className="relative">
                  <select
                    value={formData.categoria}
                    onChange={(e) => handleChange("categoria", e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium appearance-none pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Selecione...</option>
                    {CATEGORIAS_DOCENTES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                    {formData.categoria &&
                      !CATEGORIAS_DOCENTES.includes(formData.categoria) && (
                        <option value={formData.categoria}>
                          {formData.categoria}
                        </option>
                      )}
                  </select>
                  <ChevronDown
                    size={16}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
                  />
                </div>
              </div>

              {/* Efetivo */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-700">
                  Efetivo
                </label>
                <div className="relative">
                  <select
                    value={formData.efetivo}
                    onChange={(e) => handleChange("efetivo", e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium appearance-none pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Sim">Sim</option>
                    <option value="Não">Não</option>
                  </select>
                  <ChevronDown
                    size={16}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
                  />
                </div>
              </div>
            </div>

            {/* Linha 2: Carreira, Tipo de Contrato, Vínculo Contratual, Data de Admissão */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs font-semibold">
              {/* Carreira */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-700">
                  Carreira
                </label>
                <div className="relative">
                  <select
                    value={formData.carreira}
                    onChange={(e) => handleChange("carreira", e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium appearance-none pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Docente">Docente</option>
                    <option value="CTA">CTA</option>
                    <option value="Investigador">Investigador</option>
                  </select>
                  <ChevronDown
                    size={16}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
                  />
                </div>
              </div>

              {/* Tipo de Contrato */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-700">
                  Tipo de Contrato
                </label>
                <div className="relative">
                  <select
                    value={formData.tipoContrato}
                    onChange={(e) =>
                      handleChange("tipoContrato", e.target.value)
                    }
                    className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium appearance-none pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Tempo inteiro">Tempo inteiro</option>
                    <option value="Tempo parcial">Tempo parcial</option>
                    <option value="Avença">Avença</option>
                  </select>
                  <ChevronDown
                    size={16}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
                  />
                </div>
              </div>

              {/* Vínculo Contratual */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-700">
                  Vínculo Contratual
                </label>
                <div className="relative">
                  <select
                    value={formData.vinculoContractual}
                    onChange={(e) =>
                      handleChange("vinculoContractual", e.target.value)
                    }
                    className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium appearance-none pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Pertence ao quadro">Pertence ao quadro</option>
                    <option value="Não pertence ao quadro">Não pertence ao quadro</option>
                  </select>
                  <ChevronDown
                    size={16}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
                  />
                </div>
              </div>

              {/* Data de Admissão */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-700">
                  Data de Admissão
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="dd/mm/aaaa"
                    value={formData.dataAdmissao}
                    onChange={(e) =>
                      handleChange("dataAdmissao", e.target.value)
                    }
                    className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <Calendar
                    size={16}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  />
                </div>
              </div>
            </div>

            {/* Linha 3: Nível Académico, Área de Formação */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
              {/* Nível Académico */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-700">
                  Nível Académico
                </label>
                <div className="relative">
                  <select
                    value={formData.nivelAcademico}
                    onChange={(e) =>
                      handleChange("nivelAcademico", e.target.value)
                    }
                    className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium appearance-none pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Selecione...</option>
                    {NIVEIS_ACADEMICOS.map((nivel) => (
                      <option key={nivel} value={nivel}>
                        {nivel}
                      </option>
                    ))}
                    {formData.nivelAcademico &&
                      !NIVEIS_ACADEMICOS.includes(formData.nivelAcademico) &&
                      formData.nivelAcademico !== "Selecione..." && (
                        <option value={formData.nivelAcademico}>
                          {formData.nivelAcademico}
                        </option>
                      )}
                  </select>
                  <ChevronDown
                    size={16}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
                  />
                </div>
              </div>

              {/* Área de Formação */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-700">
                  Área de Formação
                </label>
                <input
                  type="text"
                  value={formData.areaFormacao || "Geral"}
                  onChange={(e) => handleChange("areaFormacao", e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION FOR DISCIPLINAS LECCIONADAS (ATÉ 4) AS A SEPARATE CONTAINER - Apenas para Docentes */}
        {formData.carreira !== "CTA" && (
          <div className="relative rounded-[2rem] border-2 border-slate-900 p-6 pt-8 bg-white shadow-sm">
            <div className="absolute -top-3.5 left-6 bg-white px-3 flex items-center gap-2 font-black text-xs text-blue-900 tracking-tight ">
              <span className="w-1 h-4 bg-blue-600 rounded-full inline-block"></span>
              DISCIPLINAS LECCIONADAS (ATÉ 4)
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400  tracking-wider">
                  DISCIPLINA 1
                </label>
                <input
                  type="text"
                  placeholder="Disciplina 1"
                  value={formData.disciplina1}
                  onChange={(e) => handleChange("disciplina1", e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400  tracking-wider">
                  DISCIPLINA 2
                </label>
                <input
                  type="text"
                  placeholder="Disciplina 2"
                  value={formData.disciplina2}
                  onChange={(e) => handleChange("disciplina2", e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400  tracking-wider">
                  DISCIPLINA 3
                </label>
                <input
                  type="text"
                  placeholder="Disciplina 3"
                  value={formData.disciplina3}
                  onChange={(e) => handleChange("disciplina3", e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400  tracking-wider">
                  DISCIPLINA 4
                </label>
                <input
                  type="text"
                  placeholder="Disciplina 4"
                  value={formData.disciplina4}
                  onChange={(e) => handleChange("disciplina4", e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* SECTION 5: Cargo de Chefia e Confiança */}
        <div className="relative rounded-[2rem] border-2 border-slate-900 p-6 pt-8 bg-white shadow-sm">
          <div className="absolute -top-3.5 left-6 bg-white px-3 flex items-center gap-2 font-black text-xs text-blue-900 tracking-tight">
            <span className="w-1 h-4 bg-blue-600 rounded-full inline-block"></span>
            Cargo de Chefia e Confiança
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-3 gap-4 text-xs font-semibold">
            {/* Cargo */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-700">
                Cargo
              </label>
              <div className="relative">
                <select
                  value={formData.cargoChefia}
                  onChange={(e) => handleChange("cargoChefia", e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium appearance-none pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Selecione...">Selecione...</option>
                  <option value="Diretor de Divisão">Diretor de Divisão</option>
                  <option value="Chefe de Departamento">
                    Chefe de Departamento
                  </option>
                  <option value="Chefe de Repartição">Chefe de Repartição</option>
                  <option value="Coordenador de Curso">Coordenador de Curso</option>
                </select>
                <ChevronDown
                  size={16}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
                />
              </div>
            </div>

            {/* Data de Nomeação */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-700">
                Data de Nomeação
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="dd/mm/aaaa"
                  value={formData.dataNomeacao}
                  onChange={(e) => handleChange("dataNomeacao", e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Calendar
                  size={16}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
              </div>
            </div>

            {/* Data de Desnomeação */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-700">
                Data de Desnomeação
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="dd/mm/aaaa"
                  value={formData.dataDesnomeacao}
                  onChange={(e) =>
                    handleChange("dataDesnomeacao", e.target.value)
                  }
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Calendar
                  size={16}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
              </div>
            </div>

            {/* Estado de Mandato */}
            <div className="space-y-1 sm:col-span-2">
              <label className="text-[10px] font-bold text-slate-700">
                Estado de Mandato
              </label>
              <div className="relative">
                <select
                  value={formData.estadoMandato}
                  onChange={(e) => handleChange("estadoMandato", e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-red-600 font-bold appearance-none pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Em Actividade">Em Actividade</option>
                  <option value="Concluído">Concluído</option>
                  <option value="Suspenso">Suspenso</option>
                </select>
                <ChevronDown
                  size={16}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500 pointer-events-none"
                />
              </div>
            </div>

            {/* Estado do Colaborador */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-700">
                Estado do Colaborador
              </label>
              <div className="relative">
                <select
                  value={formData.estadoColaborador}
                  onChange={(e) =>
                    handleChange("estadoColaborador", e.target.value)
                  }
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-emerald-600 font-bold appearance-none pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Ativo">Ativo</option>
                  <option value="Inativo">Inativo</option>
                  <option value="Reformado">Reformado</option>
                </select>
                <ChevronDown
                  size={16}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600 pointer-events-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Buttons at Bottom Right */}
        <div className="flex justify-end items-center gap-4 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 rounded-2xl border border-slate-200 bg-white text-slate-700 font-bold text-xs hover:bg-slate-50 transition-all active:scale-95 shadow-sm"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-8 py-3.5 rounded-2xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-500/20 disabled:opacity-50"
          >
            {isSubmitting ? "A guardar..." : "Guardar Alterações"}
          </button>
        </div>
      </form>
    </div>
  );
}
