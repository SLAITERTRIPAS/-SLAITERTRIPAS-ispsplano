import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft } from "lucide-react";
import { ProcessingCircle } from "../../components/ui/ProcessingCircle";
import SearchableSelect from "../../components/ui/SearchableSelect";
import {
  PROVINCIAS_DISTRITOS,
  UNIDADES_ORGANICAS_SISTEMA,
  DEPARTAMENTOS,
  REPARTICOES,
  LISTA_CARGOS_CHEFIA,
  LISTA_FUNCOES,
  ESTADOS_CIVIS,
  NIVEIS_ACADEMICOS,
  FUNCIONARIOS,
} from "../../constants/formOptions";
import { EFETIVO_GERAL_DATA } from "../../constants/colaboradoresList";
import { collection, getDocs, limit, query, where } from "firebase/firestore";
import { db, auth } from "../../lib/firebase";
import { firestoreService } from "../../lib/firestoreService";
import { onAuthStateChanged } from "firebase/auth";

import { isSuperBossUser } from "../../lib/auth";
import { formatProcessNumber } from "../../lib/utils";

import { withTimeout, generateCollaboratorId } from "../../lib/utils";

export default function SystemRegistrationForm({
  onCancel,
  onSubmit,
  currentUser,
}: {
  onCancel: () => void;
  onSubmit: () => void;
  currentUser?: any;
}) {
  const [registerStep, setRegisterStep] = useState(1);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isFirstUserAccount, setIsFirstUserAccount] = useState(false);

  const isOwner = isSuperBossUser(currentUser);

  // Check if first user on mount
  React.useEffect(() => {
    const checkFirstUser = async () => {
      try {
        const usersQuery = query(collection(db, "users"), limit(1));
        const usersSnapshot = await withTimeout(getDocs(usersQuery), 30000);
        const first = usersSnapshot.empty;
        setIsFirstUserAccount(first);
        if (first) {
          setCargo("Administrador do Sistema");
        }
      } catch (err) {
        console.error("Error checking first user:", err);
      }
    };
    checkFirstUser();
  }, []);

  // Form State
  const [nome, setNome] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [genero, setGenero] = useState("");
  const [estadoCivil, setEstadoCivil] = useState("");
  const [nacionalidade, setNacionalidade] = useState("Moçambicano");
  const [provincia, setProvincia] = useState("");
  const [distrito, setDistrito] = useState("");
  const [bi, setBi] = useState("");
  const [nuit, setNuit] = useState("");
  const [emailInstitucional, setEmailInstitucional] = useState("");
  const [emailPessoal, setEmailPessoal] = useState("");
  const [endereco, setEndereco] = useState("");
  const [telefone, setTelefone] = useState("");

  // Selection States
  const [categoria, setCategoria] = useState("");
  const [unidadeOrgId, setUnidadeOrgId] = useState("");
  const [direcao, setDirecao] = useState("");
  const [departamento, setDepartamento] = useState("");
  const [reparticao, setReparticao] = useState("");
  const [cargo, setCargo] = useState("");
  const [funcao, setFuncao] = useState("");
  const [anoInicio, setAnoInicio] = useState("");
  const [nivelAcademico, setNivelAcademico] = useState("");

  // Mandato Fields
  const [mandatoStatus, setMandatoStatus] = useState("Ativo");
  const [mandatoInicio, setMandatoInicio] = useState("");
  const [mandatoFim, setMandatoFim] = useState("");
  const [isChefiaDefinitiva, setIsChefiaDefinitiva] = useState(true);

  // Preenchimento automático ao selecionar nome
  React.useEffect(() => {
    if (!nome) return;

    const fillData = async () => {
      try {
        setLoading(true);
        // 1. Tentar buscar no Firestore (dados mais recentes)
        const colRef = collection(db, "colaboradores");
        const q = query(colRef, where("nome", "==", nome), limit(1));
        const snap = await getDocs(q);

        let data: any = null;

        if (!snap.empty) {
          data = snap.docs[0].data();
          console.log("Dados carregados do Firestore:", data);
        } else {
          // 2. Fallback para Efetivo Geral (dados estáticos)
          const fStatic = EFETIVO_GERAL_DATA.find((f) => f.nome === nome);
          if (fStatic) {
            data = fStatic;
            console.log("Dados carregados do Efetivo Geral (Estático):", data);
          }
        }

        if (data) {
          // Preencher campos
          if (data.dataNascimento) setDataNascimento(data.dataNascimento);
          if (data.genero)
            setGenero(
              data.genero === "M" || data.genero === "Masculino"
                ? "Masculino"
                : "Feminino",
            );
          if (data.nuit) setNuit(data.nuit);
          if (data.numeroBI || data.bi) setBi(data.numeroBI || data.bi);
          if (data.email) setEmailInstitucional(data.email);
          else if (data.usuario) setEmailInstitucional(data.usuario);
          if (data.telefone) setTelefone(data.telefone);
          if (data.endereco) setEndereco(data.endereco);
          if (data.nacionalidade) setNacionalidade(data.nacionalidade);
          if (data.provincia) setProvincia(data.provincia);
          if (data.distrito) setDistrito(data.distrito);

          // Dados profissionais
          if (data.tipo || data.categoria_vinculo)
            setCategoria(data.tipo || data.categoria_vinculo);
          if (data.unidade) {
            const uOrg = UNIDADES_ORGANICAS_SISTEMA.find(
              (u) => u.nome.toLowerCase() === data.unidade.toLowerCase(),
            );
            if (uOrg) setUnidadeOrgId(uOrg.id);
          }
          if (data.direcao) setDirecao(data.direcao);
          if (data.departamento) setDepartamento(data.departamento);
          if (data.reparticao) setReparticao(data.reparticao);
          if (data.cargo) setCargo(data.cargo);
          if (data.funcao) setFuncao(data.funcao);
          if (data.nivelAcademico) setNivelAcademico(data.nivelAcademico);

          // Mandato
          if (data.mandatoStatus) setMandatoStatus(data.mandatoStatus);
          if (data.mandatoInicio) setMandatoInicio(data.mandatoInicio);
          if (data.mandatoFim) setMandatoFim(data.mandatoFim);
          if (data.isChefiaDefinitiva !== undefined)
            setIsChefiaDefinitiva(data.isChefiaDefinitiva);
        }
      } catch (err) {
        console.error("Erro ao carregar dados do colaborador:", err);
      } finally {
        setLoading(false);
      }
    };

    fillData();
  }, [nome]);

  // Password States
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Derived options
  const direcoesDisponiveis =
    UNIDADES_ORGANICAS_SISTEMA.find((u) => u.id === unidadeOrgId)?.direcoes ||
    [];
  const departamentosDisponiveis =
    DEPARTAMENTOS[direcao] || DEPARTAMENTOS[direcao] || [];
  const reparticoesDisponiveis = REPARTICOES[departamento] || [];

  return (
    <div className="max-w-5xl mx-auto h-full flex flex-col pt-8">
      <button
        onClick={onCancel}
        className="mb-4 flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors w-fit"
      >
        <ArrowLeft size={16} />
        <span className="text-sm font-bold tracking-widest">
          Voltar / cancelar
        </span>
      </button>

      <div className="flex-grow flex flex-col bg-slate-50/50 rounded-xl shadow-lg border border-gray-200 overflow-y-auto">
        {/* Form Header */}
        <div className="bg-[#000066] py-4 px-8 text-center">
          <h2 className="text-white text-xl font-black tracking-widest font-serif">
            {registerStep === 1 && "Dados pessoais"}
            {registerStep === 2 && "Dados profissionais e académicos"}
            {registerStep === 3 && "Credenciais de acesso"}
          </h2>
        </div>

        {/* Form Body */}
        <div className="flex-grow bg-[#e5e7eb] p-8 relative min-h-[500px]">
          <AnimatePresence mode="wait">
            {registerError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-[#fee2e2] border border-[#f87171] rounded flex flex-col gap-2"
              >
                <p className="text-[#b91c1c] text-xs font-black tracking-widest">
                  {registerError}
                </p>
                {registerError.includes("Já Registado") && (
                  <button
                    onClick={onCancel}
                    className="text-[10px] text-blue-900 underline font-black tracking-widest w-fit hover:text-blue-700"
                  >
                    Ir para recuperação de senha
                  </button>
                )}
              </motion.div>
            )}

            {registerStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-[#000066] tracking-widest">
                      Nome completo
                    </label>
                    <SearchableSelect
                      options={FUNCIONARIOS.map((f) => f.nome)}
                      value={nome}
                      onChange={(val) => setNome(val)}
                      placeholder="Selecionar funcionário..."
                      className="bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-[#000066] tracking-widest">
                      Data de nascimento
                    </label>
                    <input
                      type="date"
                      className="w-full px-4 py-3 bg-white border-none rounded shadow-sm text-sm font-medium outline-none focus:ring-2 focus:ring-blue-900"
                      value={dataNascimento}
                      onChange={(e) => setDataNascimento(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-[#000066] tracking-widest">
                      Género
                    </label>
                    <select
                      className="w-full px-4 py-3 bg-white border-none rounded shadow-sm text-sm font-medium outline-none focus:ring-2 focus:ring-blue-900 appearance-none"
                      value={genero}
                      onChange={(e) => setGenero(e.target.value)}
                    >
                      <option value="">Selecione...</option>
                      <option value="Masculino">Masculino</option>
                      <option value="Feminino">Feminino</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-[#000066] tracking-widest">
                      Estado Civil
                    </label>
                    <select
                      className="w-full px-4 py-3 bg-white border-none rounded shadow-sm text-sm font-medium outline-none focus:ring-2 focus:ring-blue-900 appearance-none"
                      value={estadoCivil}
                      onChange={(e) => setEstadoCivil(e.target.value)}
                    >
                      <option value="">Selecione...</option>
                      {ESTADOS_CIVIS.map((e) => (
                        <option key={e} value={e}>
                          {e}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-6">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-[#000066] tracking-widest">
                      Nacionalidade
                    </label>
                    <input
                      type="text"
                      list="nacionalidade-list"
                      className="w-full px-4 py-3 bg-white border-none rounded shadow-sm text-sm font-medium outline-none focus:ring-2 focus:ring-blue-900"
                      value={nacionalidade}
                      onChange={(e) => setNacionalidade(e.target.value)}
                    />
                    <datalist id="nacionalidade-list">
                      <option value="Moçambicana" />
                      <option value="Estrangeira" />
                    </datalist>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-[#000066] tracking-widest">
                      Naturalidade (Província)
                    </label>
                    <select
                      className="w-full px-4 py-3 bg-white border-none rounded shadow-sm text-sm font-medium outline-none focus:ring-2 focus:ring-blue-900 appearance-none"
                      value={provincia}
                      onChange={(e) => {
                        setProvincia(e.target.value);
                        setDistrito("");
                      }}
                    >
                      <option value="">Selecione...</option>
                      {Object.keys(PROVINCIAS_DISTRITOS).map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-[#000066] tracking-widest">
                      Distrito
                    </label>
                    <select
                      className="w-full px-4 py-3 bg-white border-none rounded shadow-sm text-sm font-medium outline-none focus:ring-2 focus:ring-blue-900 appearance-none"
                      value={distrito}
                      onChange={(e) => setDistrito(e.target.value)}
                      disabled={!provincia}
                    >
                      <option value="">Selecione...</option>
                      {provincia &&
                        PROVINCIAS_DISTRITOS[provincia]?.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-[#000066] tracking-widest">
                      Número de BI / Passaporte
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-white border-none rounded shadow-sm text-sm font-medium outline-none focus:ring-2 focus:ring-blue-900"
                      placeholder="Documento de Identificação"
                      value={bi}
                      onChange={(e) => setBi(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-[#000066] tracking-widest">
                      NUIT
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-white border-none rounded shadow-sm text-sm font-medium outline-none focus:ring-2 focus:ring-blue-900"
                      placeholder="Número Único de Identificação Tributária"
                      value={nuit}
                      onChange={(e) => setNuit(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-[#000066] tracking-widest">
                      Email Institucional (Acesso) *
                    </label>
                    <input
                      type="email"
                      id="email-registo"
                      className="w-full px-4 py-3 bg-white border-none rounded shadow-sm text-sm font-medium outline-none focus:ring-2 focus:ring-blue-900"
                      placeholder="exemplo@instituicao.ac.mz"
                      value={emailInstitucional}
                      onChange={(e) => setEmailInstitucional(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-[#000066] tracking-widest">
                      Email Pessoal
                    </label>
                    <input
                      type="email"
                      className="w-full px-4 py-3 bg-white border-none rounded shadow-sm text-sm font-medium outline-none focus:ring-2 focus:ring-blue-900"
                      placeholder="exemplo@gmail.com"
                      value={emailPessoal}
                      onChange={(e) => setEmailPessoal(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-[#000066] tracking-widest">
                    Endereço Físico
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-white border-none rounded shadow-sm text-sm font-medium outline-none focus:ring-2 focus:ring-blue-900"
                    placeholder="Av. / Rua / Bairro / Nº Casa"
                    value={endereco}
                    onChange={(e) => setEndereco(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-[#000066] tracking-widest">
                    Contacto Telefónico
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-white border-none rounded shadow-sm text-sm font-medium outline-none focus:ring-2 focus:ring-blue-900"
                    placeholder="+258 8x xxx xxxx"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                  />
                </div>
              </motion.div>
            )}

            {registerStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-[#000066] tracking-widest">
                    Categoria de funcionário
                  </label>
                  <select
                    className="w-full px-4 py-3 bg-white border-none rounded shadow-sm text-sm font-medium outline-none focus:ring-2 focus:ring-blue-900 appearance-none"
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                  >
                    <option value="">Selecione...</option>
                    <option value="Docente">Docente</option>
                    <option value="CTA">CTA</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-[#000066] tracking-widest">
                      Unidade orgânica
                    </label>
                    <select
                      className="w-full px-4 py-3 bg-white border-none rounded shadow-sm text-sm font-medium outline-none focus:ring-2 focus:ring-blue-900 appearance-none"
                      value={unidadeOrgId}
                      onChange={(e) => {
                        setUnidadeOrgId(e.target.value);
                        setDirecao("");
                        setDepartamento("");
                        setReparticao("");
                      }}
                    >
                      <option value="">Selecione...</option>
                      {UNIDADES_ORGANICAS_SISTEMA.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.nome}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-[#000066] tracking-widest">
                      Direção
                    </label>
                    <select
                      className="w-full px-4 py-3 bg-white border-none rounded shadow-sm text-sm font-medium outline-none focus:ring-2 focus:ring-blue-900 appearance-none"
                      value={direcao}
                      onChange={(e) => {
                        setDirecao(e.target.value);
                        setDepartamento("");
                        setReparticao("");
                      }}
                      disabled={!unidadeOrgId}
                    >
                      <option value="">Selecione...</option>
                      {direcoesDisponiveis.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-[#000066] tracking-widest">
                      Departamento
                    </label>
                    <select
                      className="w-full px-4 py-3 bg-white border-none rounded shadow-sm text-sm font-medium outline-none focus:ring-2 focus:ring-blue-900 appearance-none"
                      value={departamento}
                      onChange={(e) => {
                        setDepartamento(e.target.value);
                        setReparticao("");
                      }}
                      disabled={!direcao}
                    >
                      <option value="">Selecione...</option>
                      {departamentosDisponiveis.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-[#000066] tracking-widest">
                      Repartição
                    </label>
                    <select
                      className="w-full px-4 py-3 bg-white border-none rounded shadow-sm text-sm font-medium outline-none focus:ring-2 focus:ring-blue-900 appearance-none"
                      value={reparticao}
                      onChange={(e) => setReparticao(e.target.value)}
                      disabled={
                        !departamento || reparticoesDisponiveis.length === 0
                      }
                    >
                      <option value="">Selecione...</option>
                      {reparticoesDisponiveis.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-[#000066] tracking-widest">
                      Cargo
                    </label>
                    <select
                      className="w-full px-4 py-3 bg-white border-none rounded shadow-sm text-sm font-medium outline-none focus:ring-2 focus:ring-blue-900 appearance-none"
                      value={cargo}
                      onChange={(e) => setCargo(e.target.value)}
                    >
                      <option value="">Selecione...</option>
                      {(isFirstUserAccount || isOwner) && (
                        <option value="Administrador do Sistema">
                          Administrador do Sistema
                        </option>
                      )}
                      {LISTA_CARGOS_CHEFIA.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-[#000066] tracking-widest">
                      Função
                    </label>
                    <select
                      className="w-full px-4 py-3 bg-white border-none rounded shadow-sm text-sm font-medium outline-none focus:ring-2 focus:ring-blue-900 appearance-none"
                      value={funcao}
                      onChange={(e) => setFuncao(e.target.value)}
                    >
                      <option value="">Selecione...</option>
                      {LISTA_FUNCOES.map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {(cargo.toLowerCase().includes("chefe") ||
                  cargo.toLowerCase().includes("diretor") ||
                  cargo.toLowerCase().includes("responsável")) && (
                  <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 space-y-4">
                    <h4 className="text-[10px] font-black text-blue-900 tracking-widest">
                      Gestão de Mandato (Chefia)
                    </h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-blue-800">
                          Estado do Mandato
                        </label>
                        <select
                          value={mandatoStatus}
                          onChange={(e) => setMandatoStatus(e.target.value)}
                          className="w-full px-3 py-2 bg-white border-none rounded shadow-sm text-xs font-bold outline-none"
                        >
                          <option value="Ativo">Ativo</option>
                          <option value="Terminado">
                            Terminado (Ex-Chefe)
                          </option>
                          <option value="Suspenso">Suspenso</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-blue-800">
                          Data Início
                        </label>
                        <input
                          type="date"
                          value={mandatoInicio}
                          onChange={(e) => setMandatoInicio(e.target.value)}
                          className="w-full px-3 py-2 bg-white border-none rounded shadow-sm text-xs font-bold outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-blue-800">
                          Data Fim Prevista
                        </label>
                        <input
                          type="date"
                          value={mandatoFim}
                          onChange={(e) => setMandatoFim(e.target.value)}
                          className="w-full px-3 py-2 bg-white border-none rounded shadow-sm text-xs font-bold outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-[#000066] tracking-widest">
                      Ano de início de funções
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-white border-none rounded shadow-sm text-sm font-medium outline-none focus:ring-2 focus:ring-blue-900"
                      placeholder="Ex: 2020"
                      value={anoInicio}
                      onChange={(e) => setAnoInicio(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-[#000066] tracking-widest">
                      Nível académico
                    </label>
                    <select
                      className="w-full px-4 py-3 bg-white border-none rounded shadow-sm text-sm font-medium outline-none focus:ring-2 focus:ring-blue-900 appearance-none"
                      value={nivelAcademico}
                      onChange={(e) => setNivelAcademico(e.target.value)}
                    >
                      <option value="">Selecione...</option>
                      {NIVEIS_ACADEMICOS.map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </motion.div>
            )}

            {registerStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="p-6 bg-[#d1d5db] border border-gray-300 rounded">
                  <p className="text-[#000066] text-sm italic font-medium">
                    Defina a sua palavra-passe de acesso.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-[#000066] tracking-widest">
                      Palavra-passe *
                    </label>
                    <input
                      type="password"
                      title="Mínimo 6 caracteres"
                      className="w-full px-4 py-3 bg-white border-none rounded shadow-sm text-sm font-medium outline-none focus:ring-2 focus:ring-blue-900"
                      placeholder="Mínimo 6 caracteres"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-[#000066] tracking-widest">
                      Confirmar Palavra-passe *
                    </label>
                    <input
                      type="password"
                      title="Confirmar Palavra-passe"
                      className="w-full px-4 py-3 bg-white border-none rounded shadow-sm text-sm font-medium outline-none focus:ring-2 focus:ring-blue-900"
                      placeholder="********"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Form Footer Navigation */}
        <div className="bg-[#9ca3af] py-4 px-8 flex justify-between items-center">
          {registerStep > 1 ? (
            <button
              onClick={() => setRegisterStep((prev) => prev - 1)}
              className="px-6 py-2 bg-[#000066] text-white rounded-lg hover:bg-blue-800 transition-colors font-bold tracking-widest text-xs flex items-center gap-2"
            >
              <ArrowLeft size={16} /> Anterior
            </button>
          ) : (
            <div />
          )}

          <button
            onClick={async () => {
              if (registerStep === 1) {
                if (!emailInstitucional) {
                  setRegisterError(
                    "Por favor, preencha o Email Institucional.",
                  );
                  return;
                }
              }

              if (registerStep < 3) {
                setRegisterError(null);
                setRegisterStep((prev) => prev + 1);
              } else {
                // Final submission
                if (password !== confirmPassword) {
                  setRegisterError("As palavras-passe não coincidem.");
                  return;
                }
                if (password.length < 6) {
                  setRegisterError(
                    "A palavra-passe deve ter pelo menos 6 caracteres.",
                  );
                  return;
                }

                setLoading(true);
                setRegisterError(null);

                try {
                  const usersRef = collection(db, "users");
                  const colRef = collection(db, "colaboradores");

                  // Procurar utilizador existente por NUIT ou Email
                  const [snapNuit, snapEmail] = await Promise.all([
                    withTimeout(
                      getDocs(query(usersRef, where("nuit", "==", nuit || ""))),
                      30000,
                    ),
                    withTimeout(
                      getDocs(
                        query(
                          usersRef,
                          where(
                            "email",
                            "==",
                            emailInstitucional.toLowerCase().trim(),
                          ),
                        ),
                      ),
                      30000,
                    ),
                  ]);

                  const existingUserDoc = !snapNuit.empty
                    ? snapNuit.docs[0]
                    : !snapEmail.empty
                      ? snapEmail.docs[0]
                      : null;
                  const isUpdate = !!existingUserDoc;

                  if (
                    isUpdate &&
                    !confirm(
                      "Este utilizador já possui um registo. Deseja atualizar os dados existentes com as novas informações?",
                    )
                  ) {
                    setLoading(false);
                    return;
                  }

                  const isFirstUser = isFirstUserAccount && !isUpdate;
                  const isAdministrador = cargo === "Administrador do Sistema";

                  const unidadeNome =
                    UNIDADES_ORGANICAS_SISTEMA.find(
                      (u) => u.id === unidadeOrgId,
                    )?.nome || "";
                  const collabId = generateCollaboratorId(nome, nuit);

                  const userData: any = {
                    name: nome,
                    email: emailInstitucional.toLowerCase().trim(),
                    role: isAdministrador ? "Administrador" : "User",
                    isOwner: isUpdate
                      ? existingUserDoc?.data()?.isOwner || false
                      : isFirstUser && isAdministrador,
                    nuit: nuit,
                    bi: bi,
                    updatedAt: new Date().toISOString(),
                  };

                  // Se for novo ou se o proprietário estiver a definir senha
                  if (!isUpdate || password) {
                    userData.password = password;
                    userData.mustChangePassword = false;
                  }

                  const colaboradorData = {
                    id: collabId,
                    numeroProcesso: collabId,
                    nome: nome,
                    genero: genero === "Masculino" ? "M" : "F",
                    dataNascimento: dataNascimento,
                    nuit: nuit,
                    numeroBI: bi,
                    nivelAcademico: nivelAcademico,
                    funcao: funcao,
                    email: emailInstitucional,
                    tipo: categoria,
                    unidade: unidadeNome,
                    direcao: direcao,
                    departamento: departamento,
                    reparticao: reparticao,
                    cargo: cargo || "",
                    status: "Ativo",
                    mandatoStatus: mandatoStatus,
                    mandatoInicio: mandatoInicio,
                    mandatoFim: mandatoFim,
                    isChefiaDefinitiva: isChefiaDefinitiva,
                    updatedAt: new Date().toISOString(),
                    validadoPorRH: true, // Ao ser registado pelo Admin/Sistema, assumimos validado
                  };

                  const processoData = {
                    colaboradorId: collabId,
                    colaboradorNome: nome,
                    nuit: nuit,
                    status: isUpdate ? "Atualizado" : "Concluído",
                    tipo: isUpdate ? "Atualização de Dados" : "Registo Inicial",
                    dataSubmissao: new Date().toISOString().split("T")[0],
                    processoNo: formatProcessNumber(
                      Math.floor(Math.random() * 899) + 100,
                      new Date().getFullYear().toString(),
                    ),
                  };

                  console.log(
                    isUpdate
                      ? "Atualizando dados..."
                      : "Gravando novos dados...",
                  );

                  const promises = [
                    firestoreService.colaboradores.update(
                      collabId,
                      colaboradorData,
                    ),
                    firestoreService.processos.add(processoData),
                  ];

                  // Se o mandato terminou, salvar no histórico de chefias
                  const cargoLower = (cargo || funcao || "").toLowerCase();
                  const isChef =
                    cargoLower.includes("chefe") ||
                    cargoLower.includes("diretor");

                  if (isChef && mandatoStatus === "Terminado") {
                    promises.push(
                      firestoreService.historico_chefias.add({
                        colaboradorId: collabId,
                        nome: nome,
                        cargo: cargo,
                        unidade: unidadeNome,
                        inicio: mandatoInicio,
                        fim:
                          mandatoFim || new Date().toISOString().split("T")[0],
                        motivo: "Fim de Mandato",
                        registadoEm: new Date().toISOString(),
                      }),
                    );
                  }

                  if (isUpdate) {
                    promises.push(
                      firestoreService.users.update(
                        existingUserDoc!.id,
                        userData,
                      ),
                    );
                  } else {
                    userData.id = collabId;
                    promises.push(
                      firestoreService.users.set(collabId, {
                        ...userData,
                        createdAt: new Date().toISOString(),
                      }),
                    );
                  }

                  await Promise.all(promises);

                  console.log("Operação concluída com sucesso!");
                  setLoading(false);
                  onSubmit();
                } catch (err: any) {
                  console.error("Erro detalhado no registo:", err);
                  const errorMessage =
                    err?.message ||
                    (typeof err === "string" ? err : "Erro desconhecido");
                  setRegisterError(
                    "Erro ao processar registo: " + errorMessage,
                  );
                  setLoading(false);
                }
              }
            }}
            disabled={loading}
            className="px-6 py-2 bg-[#000066] text-white rounded-lg hover:bg-blue-800 disabled:opacity-50 transition-colors font-bold tracking-widest text-xs flex items-center gap-2"
          >
            {loading ? (
              <ProcessingCircle size={16} />
            ) : (
              <>
                {registerStep < 3 ? "Próximo" : "Concluir registo"}{" "}
                <ArrowLeft size={16} className="rotate-180" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
