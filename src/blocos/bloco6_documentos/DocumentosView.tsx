import React, { useState } from "react";
import { FileText, Folder, Trash2, Upload, FileSignature } from "lucide-react";
import FormularioRequisicaoInterna from "../bloco6_documentos/FormularioRequisicaoInterna";
import GuiaTransferenciaBens from "../bloco6_documentos/GuiaTransferenciaBens";
import FichaInventarioMovel from "../bloco6_documentos/FichaInventarioMovel";
import OrdemServicoTransferencia from "../bloco6_documentos/OrdemServicoTransferencia";
import GuiaApresentacaoInterna from "../bloco6_documentos/GuiaApresentacaoInterna";
import InformacaoPropostaForm from "../bloco6_documentos/InformacaoPropostaForm";
import JustificacaoFaltaDispensaForm from "../bloco6_documentos/JustificacaoFaltaDispensaForm";
import { firestoreService } from "../../lib/firestoreService";
import { isSuperBossUser, isPersonnelBoss } from "../../lib/auth";
import { SectionHeader } from "../../components/shared/SectionHeader";
import { ActiveFormWrapper } from "../../components/shared/ActiveFormWrapper";
import { InstitutionalHeader } from "../../components/InstitutionalHeader";

export default function DocumentosView({ title = "Documentos Normativos", user }: { title?: string; user: any }) {
  const isAdmin = isSuperBossUser(user);
  const isRHBoss =
    isPersonnelBoss(user) ||
    user?.cargoChefia?.toLowerCase().includes("recursos humanos") ||
    isAdmin;
  const isPatrimonio =
    user?.departamento?.toUpperCase().includes("PATRIM") ||
    user?.reparticao?.toUpperCase().includes("PATRIM") ||
    user?.setor?.toUpperCase().includes("PATRIM") ||
    isAdmin;

  const [documentos] = useState<any[]>([]);
  const [activeDigitalForm, setActiveDigitalForm] = useState<string | null>(
    null,
  );

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    console.log("File selected:", file);
    alert(
      "Funcionalidade de conversão de PDF para dados digitais ainda não implementada.",
    );
  };

  const handleSelectDoc = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (!val) return;

    const normalized = val
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();

    if (normalized.includes("requisicao interna")) {
      setActiveDigitalForm("m1");
    } else if (
      normalized.includes("pedido de transferencia") ||
      normalized.includes("guia de transferencia")
    ) {
      setActiveDigitalForm("m2");
    } else if (
      normalized.includes("ficha de cadastro de inventario") ||
      normalized.includes("inventario movel") ||
      normalized.includes("cadastro de inventario")
    ) {
      setActiveDigitalForm("m3");
    } else if (
      normalized.includes("ordem de servico: transferencia") ||
      normalized.includes("ordem de servico (transferencia") ||
      normalized.includes("ordem de servico: transferencia interna")
    ) {
      setActiveDigitalForm("m4");
    } else if (
      normalized.includes("guia de apresentacao") ||
      normalized.includes("apresentacao")
    ) {
      setActiveDigitalForm("m5");
    } else if (
      normalized.includes("informacao proposta") ||
      normalized.includes("informacao posta") ||
      normalized.includes("proposta") ||
      normalized === "informacao"
    ) {
      setActiveDigitalForm("m6");
    } else if (
      normalized.includes("justificacao") ||
      normalized.includes("justificativa") ||
      normalized.includes("falta") ||
      normalized.includes("faltas") ||
      normalized.includes("efectividade")
    ) {
      if (normalized.includes("dispensa")) {
        setActiveDigitalForm("m7_ambos");
      } else {
        setActiveDigitalForm("m7_justificacao");
      }
    } else if (normalized.includes("dispensa")) {
      setActiveDigitalForm("m7_dispensa");
    } else {
      alert(`O modelo para "${val}" ainda não está implementado.`);
      e.target.value = ""; // reset
    }
  };

  const handleInventorySubmit = async (data: any) => {
    try {
      await firestoreService.inventarios_patrimoniais.add({
        ...data,
        userId: user?.id,
        tipo_patrimonio: "Móvel",
        unidade: user?.departamento,
        data_inventario: new Date().toISOString(),
      });
      alert("Inventário salvo com sucesso!");
      setActiveDigitalForm(null);
    } catch (error) {
      console.error("Erro ao salvar inventário:", error);
      throw error;
    }
  };

  if (activeDigitalForm) {
    return (
      <ActiveFormWrapper onBack={() => setActiveDigitalForm(null)}>
        {activeDigitalForm === "m1" && (
          <FormularioRequisicaoInterna
            user={user}
            onCancel={() => setActiveDigitalForm(null)}
          />
        )}
        {activeDigitalForm === "m2" && (
          <GuiaTransferenciaBens
            user={user}
            onCancel={() => setActiveDigitalForm(null)}
          />
        )}
        {activeDigitalForm === "m3" && (
          <FichaInventarioMovel
            user={user}
            onSubmit={handleInventorySubmit}
            onCancel={() => setActiveDigitalForm(null)}
          />
        )}
        {activeDigitalForm === "m4" && (
          <OrdemServicoTransferencia
            user={user}
            onCancel={() => setActiveDigitalForm(null)}
          />
        )}
        {activeDigitalForm === "m5" && (
          <GuiaApresentacaoInterna
            user={user}
            onCancel={() => setActiveDigitalForm(null)}
          />
        )}
        {activeDigitalForm === "m6" && (
          <InformacaoPropostaForm
            user={user}
            onCancel={() => setActiveDigitalForm(null)}
          />
        )}
        {activeDigitalForm?.startsWith("m7") && (
          <JustificacaoFaltaDispensaForm
            user={user}
            onCancel={() => setActiveDigitalForm(null)}
            tipoInicial={
              activeDigitalForm === "m7_dispensa"
                ? "dispensa"
                : activeDigitalForm === "m7_justificacao"
                ? "justificacao"
                : "ambos"
            }
          />
        )}
      </ActiveFormWrapper>
    );
  }

  return (
    <div className="space-y-10 pb-20">
      {/* Cabeçalho Institucional Oficial (Idêntico ao Plano de Actividade) */}
      <InstitutionalHeader
        unidadeName={user?.unidadeOrganica || user?.unidade}
        direcaoName={user?.direcao}
        departamentoName={user?.departamento}
        reparticaoName={user?.reparticao}
        sectorName={user?.setor}
        year={new Date().getFullYear()}
        title={title || "Documentos Normativos"}
      />

      {/* Secção de Modelos e Formulários */}
      <section className="space-y-6">
        <SectionHeader
          title="Modelos e Formulários Oficiais"
          description="Selecione o documento normativo desejado na lista abaixo"
          icon={FileSignature}
          iconBgColor="bg-amber-100"
          iconColor="text-amber-700"
        />

        <div className="w-full max-w-xl">
          <label className="block text-sm font-bold text-slate-700 mb-2">
            Selecione o Documento
          </label>
          <select
            className="w-full p-4 rounded-xl border border-slate-300 bg-slate-50/50 shadow-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium text-slate-700"
            onChange={handleSelectDoc}
            defaultValue=""
          >
            <option value="" disabled>
              Selecione um documento...
            </option>

            <optgroup label="Geral">
              <option value="Minuta de pedido de férias">
                Minuta de pedido de férias
              </option>
              <option value="Informação proposta">Informação proposta</option>
              <option value="Requisição Interna">Requisição Interna</option>
              <option value="Pedido de Transferência Interna">
                Pedido de Transferência Interna
              </option>
              <option value="Pedido de dispensa">Pedido de dispensa</option>
              <option value="Justificação de faltas">
                Justificação de faltas (Efectividade)
              </option>
              <option value="Pedido de dispensa ou justificativa de faltas">
                Pedido de dispensa / Justificativa de faltas
              </option>
              <option value="Ordem de Serviço: Transferência Interna">
                Ordem de Serviço (Transferência Interna)
              </option>
            </optgroup>

            {isRHBoss && (
              <optgroup label="Para Chefe de Recursos Humanos">
                <option value="Guia de Marcha">Guia de Marcha</option>
                <option value="Guia de Apresentação">
                  Guia de Apresentação
                </option>
                <option value="Justificação de faltas">
                  Justificação de Faltas / Efectividade
                </option>
                <option value="Ordem de serviços">Ordem de serviços</option>
                <option value="Ordem de Serviço: Transferência Interna">
                  Ordem de Serviço (Transferência Interna)
                </option>
                <option value="Informação">Informação</option>
                <option value="Comunicado">Comunicado</option>
              </optgroup>
            )}

            {isPatrimonio && (
              <optgroup label="Exclusivo Repartição de Património">
                <option value="Ficha de Cadastro de Inventário">
                  Ficha de Cadastro de Inventário
                </option>
              </optgroup>
            )}
          </select>
        </div>

        {/* CARTÕES DE ACESSO RÁPIDO AOS FORMULÁRIOS DIGITAIS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          <div
            onClick={() => setActiveDigitalForm("m7_justificacao")}
            className="p-4 rounded-xl border border-blue-200 bg-blue-50/60 hover:bg-blue-100/80 cursor-pointer transition-all shadow-sm group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-blue-600 text-white font-bold group-hover:scale-105 transition-transform">
                📋
              </div>
              <div>
                <h4 className="font-bold text-xs text-blue-950 uppercase tracking-tight">
                  Justificação de Faltas
                </h4>
                <p className="text-[11px] text-blue-700">Registo de Efectividade</p>
              </div>
            </div>
          </div>

          <div
            onClick={() => setActiveDigitalForm("m7_dispensa")}
            className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100/80 cursor-pointer transition-all shadow-sm group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-emerald-600 text-white font-bold group-hover:scale-105 transition-transform">
                📅
              </div>
              <div>
                <h4 className="font-bold text-xs text-emerald-950 uppercase tracking-tight">
                  Pedido de Dispensa
                </h4>
                <p className="text-[11px] text-emerald-700">Art. 101 do EGFAE</p>
              </div>
            </div>
          </div>

          <div
            onClick={() => setActiveDigitalForm("m6")}
            className="p-4 rounded-xl border border-amber-200 bg-amber-50/60 hover:bg-amber-100/80 cursor-pointer transition-all shadow-sm group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-amber-600 text-white font-bold group-hover:scale-105 transition-transform">
                📝
              </div>
              <div>
                <h4 className="font-bold text-xs text-amber-950 uppercase tracking-tight">
                  Informação Proposta
                </h4>
                <p className="text-[11px] text-amber-700">Deslocações & Actividades</p>
              </div>
            </div>
          </div>

          <div
            onClick={() => setActiveDigitalForm("m1")}
            className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100/80 cursor-pointer transition-all shadow-sm group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-slate-800 text-white font-bold group-hover:scale-105 transition-transform">
                📦
              </div>
              <div>
                <h4 className="font-bold text-xs text-slate-900 uppercase tracking-tight">
                  Requisição Interna
                </h4>
                <p className="text-[11px] text-slate-600">Material & Economato</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Secção de Documentos Normativos Carregados */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 text-blue-700 p-2 rounded-lg">
              <FileText size={20} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">
                Regulamentos e Normativas
              </h3>
              <p className="text-sm text-slate-500">
                Repositório de documentos legais e orientações técnicas
              </p>
            </div>
          </div>
          <label className="w-full sm:w-auto bg-slate-900 text-white px-6 py-3 rounded-xl font-black text-xs tracking-widest flex items-center justify-center gap-3 hover:bg-slate-800 transition-all cursor-pointer shadow-xl shadow-slate-100">
            <Upload size={16} className="text-amber-400" />
            Upload Normativo
            <input
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={handleFileChange}
            />
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {documentos.length === 0 ? (
            <div className="col-span-full py-20 text-center space-y-4 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl">
              <div className="w-16 h-16 bg-slate-50/50 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <Folder className="text-slate-300" size={32} />
              </div>
              <p className="text-slate-400 font-bold">
                Nenhum documento normativo carregado nesta unidade.
              </p>
            </div>
          ) : (
            documentos.map((doc) => (
              <div
                key={doc.id}
                className={`p-6 rounded-2xl shadow-sm border ${doc.isRascunho ? "bg-gray-100 border-gray-200" : "bg-slate-50/50 border-blue-100"}`}
              >
                <div className="flex items-center gap-4 mb-4">
                  <div
                    className={`p-3 rounded-xl ${doc.isRascunho ? "bg-gray-200 text-gray-600" : "bg-blue-50 text-blue-600"}`}
                  >
                    {doc.isRascunho ? (
                      <Folder size={24} />
                    ) : (
                      <FileText size={24} />
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{doc.nome}</p>
                    <p className="text-xs text-gray-500">
                      {doc.tipo} • {doc.formato}
                    </p>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  {!doc.isRascunho && isAdmin && (
                    <button
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      title="Excluir Documento"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                  <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                    <Upload size={18} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
