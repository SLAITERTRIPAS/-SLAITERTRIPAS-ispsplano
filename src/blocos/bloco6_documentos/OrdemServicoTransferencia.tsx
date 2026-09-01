import { printElementById } from "../../lib/printUtils";
import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  Save,
  Printer,
  ArrowLeft,
  CheckCircle,
  Plus,
  Trash2,
} from "lucide-react";
import { firestoreService } from "../../lib/firestoreService";
import SignatureUpload from "../bloco5_sistema/SignatureUpload";
import { DocumentFooter } from "../../components/shared/DocumentFooter";

interface Transferencia {
  nomeColaborador: string;
  departamentoOrigem: string;
  departamentoDestino: string;
  funcao: string;
}

interface OrdemServicoTransferenciaProps {
  user: any;
  onCancel: () => void;
}

export default function OrdemServicoTransferencia({
  user,
  onCancel,
}: OrdemServicoTransferenciaProps) {
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

  const [formData, setFormData] = useState({
    numeroSequencia: "",
    dia: hoje.getDate().toString(),
    mes: meses[hoje.getMonth()],
    ano: hoje.getFullYear().toString(),
    nomeDiretor: "Prof. António Cristo Pinto Madeira",
    tituloDiretor: "Docente Universitário",
    assinaturaDiretor: "",
  });

  const [transferencias, setTransferencias] = useState<Transferencia[]>([
    {
      nomeColaborador: "",
      departamentoOrigem: "",
      departamentoDestino: "",
      funcao: "Técnico",
    },
  ]);

  useEffect(() => {
    const fetchNextNumber = async () => {
      try {
        const nextNum =
          await firestoreService.counters.getNextNumber("ORDEM-SERVICO-GDG");
        const formattedNum = nextNum.toString().padStart(3, "0");
        setFormData((prev) => ({
          ...prev,
          numeroSequencia: formattedNum,
        }));
      } catch (err) {
        console.error("Erro ao buscar contador:", err);
        setFormData((prev) => ({
          ...prev,
          numeroSequencia: "001",
        }));
      }
    };
    fetchNextNumber();
  }, []);

  const handlePrint = () => {
    printElementById("print-area");
  };

  const handleAddTransferencia = () => {
    setTransferencias((prev) => [
      ...prev,
      {
        nomeColaborador: "",
        departamentoOrigem: "",
        departamentoDestino: "",
        funcao: "Técnico",
      },
    ]);
  };

  const handleRemoveTransferencia = (index: number) => {
    if (transferencias.length <= 1) return;
    setTransferencias((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleTransferenciaChange = (
    index: number,
    field: keyof Transferencia,
    value: string,
  ) => {
    setTransferencias((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleSave = async () => {
    // Validar todas as transferências
    for (let i = 0; i < transferencias.length; i++) {
      const t = transferencias[i];
      if (!t.nomeColaborador.trim()) {
        alert(
          `Por favor, preencha o Nome do Colaborador na transferência #${i + 1}.`,
        );
        return;
      }
      if (!t.departamentoOrigem.trim()) {
        alert(
          `Por favor, preencha o Departamento de Origem na transferência #${i + 1}.`,
        );
        return;
      }
      if (!t.departamentoDestino.trim()) {
        alert(
          `Por favor, preencha o Departamento de Destino na transferência #${i + 1}.`,
        );
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const docCode = `OS-${formData.numeroSequencia}/Songo/GDG/023.5/${formData.ano}`;
      await firestoreService.requisicoes_internas.add({
        codigo: docCode,
        tipo: "Ordem de Serviço: Transferência Interna",
        transferencias: transferencias,
        dataEmissao: `${formData.dia} de ${formData.mes} de ${formData.ano}`,
        emitidoPor: user?.displayName || user?.name || "Administrador",
        status: "Emitido",
        assinaturaDiretor: formData.assinaturaDiretor,
        createdAt: new Date().toISOString(),
      });
      setIsSubmitted(true);
      setTimeout(() => setIsSubmitted(false), 4000);
    } catch (err) {
      console.error(err);
      alert("Erro ao registar o documento no sistema.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
      <div className="min-h-screen bg-slate-100 py-8 px-4 print:bg-white print:p-0 print:m-0">
      {/* Barra de Ações - Oculta na Impressão */}
      <div className="max-w-[210mm] mx-auto mb-6 bg-white p-4 rounded-2xl shadow-md border border-slate-200 flex flex-wrap justify-between items-center gap-4 print:hidden">
        <button
          onClick={onCancel}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-bold text-sm transition-colors"
        >
          <ArrowLeft size={18} /> Voltar
        </button>

        <div className="flex items-center gap-3">
          {isSubmitted && (
            <span className="flex items-center gap-1 text-emerald-600 font-bold text-xs bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
              <CheckCircle size={14} /> Registado com Sucesso!
            </span>
          )}

          <button
            onClick={handleSave}
            disabled={isSubmitting}
            className="px-5 py-2.5 bg-blue-900 hover:bg-blue-800 disabled:bg-blue-300 text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center gap-2"
          >
            <Save size={16} />{" "}
            {isSubmitting ? "A guardar..." : "Guardar no Sistema"}
          </button>

          <button
            onClick={handlePrint}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center gap-2"
          >
            <Printer size={16} /> Imprimir / PDF
          </button>
        </div>
      </div>

      {/* DOCUMENTO INTERATIVO (FOLHA DE PAPEL A4 VERTICAL) */}
      <div className="max-w-[210mm] mx-auto bg-white shadow-2xl p-[20mm] print:shadow-none print:p-0 min-h-[297mm] flex flex-col justify-between relative font-serif text-slate-900 border border-slate-200 print:border-none">
        {/* Cabeçalho do Documento */}
        <div>
          <div className="flex items-center justify-center gap-4 border-b border-slate-300 pb-4 mb-8">
            <img
              src="https://lh3.googleusercontent.com/d/11zvvpOpZARM1yk_irEDpjJ-qBKlTlhad"
              alt="Logo Songo"
              className="w-16 h-16 object-contain"
              referrerPolicy="no-referrer"
            />
            <div className="text-left font-sans">
              <h1 className="text-sm font-black tracking-tight text-slate-800  leading-tight">
                INSTITUTO SUPERIOR POLITÉCNICO DE SONGO
              </h1>
              <p className="text-[10px] font-bold  tracking-wide text-slate-600 mt-0.5">PROVÍNCIA DE TETE</p>
              <p className="text-[10px] font-bold  tracking-wide text-slate-600">DISTRITO DE CAHORA-BASSA</p>
            </div>
          </div>

          <div className="text-center space-y-6 mt-8">
            <h2 className="text-sm font-black tracking-widest  font-sans text-slate-700">
              Gabinete do Diretor-Geral
            </h2>

            <div className="py-2 text-md font-bold  tracking-tight flex justify-center items-center gap-1 font-sans">
              <span>ORDEM DE SERVIÇO Nº</span>
              <input
                type="text"
                placeholder="000"
                value={formData.numeroSequencia}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    numeroSequencia: e.target.value,
                  }))
                }
                className="w-16 text-center font-black text-slate-900 border-b border-dashed border-slate-400 focus:border-blue-500 bg-amber-50/30 print:bg-transparent print:border-none outline-none"
              />
              <span>/Songo/GDG/023.5/{formData.ano}</span>
            </div>
          </div>

          {/* Corpo do Texto */}
          <div className="mt-12 text-[13pt] leading-loose text-justify space-y-8 px-4 text-slate-800">
            <p>
              Pelas competências definidas no nº 1 do artigo 23 do Decreto nº
              22/2008, de 27 de Julho, que aprova o Estatuto Orgânico do Songo,
              conjugado com alínea a) do nº 1 do artigo 62 da Lei nº 4/2022, de
              11 de Fevereiro determino:
            </p>

            {/* Listagem de Transferências */}
            <div className="space-y-6">
              {transferencias.map((trans, index) => (
                <div
                  key={index}
                  className="pl-4 border-l-2 border-slate-200 relative group py-2"
                >
                  <span className="font-bold">{index + 1}.</span> A
                  transferência do funcionário:{" "}
                  <input
                    type="text"
                    placeholder="(Nome do colaborador)"
                    value={trans.nomeColaborador}
                    onChange={(e) =>
                      handleTransferenciaChange(
                        index,
                        "nomeColaborador",
                        e.target.value,
                      )
                    }
                    className="font-bold px-2 py-0.5 border-b border-dashed border-slate-400 focus:border-blue-500 bg-amber-50/40 print:bg-transparent print:border-none focus:bg-white text-slate-900 outline-none w-72 transition-colors inline-block"
                  />
                  ; do Departamento de{" "}
                  <input
                    type="text"
                    placeholder="(nome do departamento origem)"
                    value={trans.departamentoOrigem}
                    onChange={(e) =>
                      handleTransferenciaChange(
                        index,
                        "departamentoOrigem",
                        e.target.value,
                      )
                    }
                    className="px-2 py-0.5 border-b border-dashed border-slate-400 focus:border-blue-500 bg-amber-50/40 print:bg-transparent print:border-none focus:bg-white text-slate-900 outline-none w-64 transition-colors inline-block"
                  />{" "}
                  para{" "}
                  <input
                    type="text"
                    placeholder="(nome do departamento destino)"
                    value={trans.departamentoDestino}
                    onChange={(e) =>
                      handleTransferenciaChange(
                        index,
                        "departamentoDestino",
                        e.target.value,
                      )
                    }
                    className="px-2 py-0.5 border-b border-dashed border-slate-400 focus:border-blue-500 bg-amber-50/40 print:bg-transparent print:border-none focus:bg-white text-slate-900 outline-none w-64 transition-colors inline-block"
                  />{" "}
                  afim de exercer a função de{" "}
                  <input
                    type="text"
                    placeholder="Técnico"
                    value={trans.funcao}
                    onChange={(e) =>
                      handleTransferenciaChange(index, "funcao", e.target.value)
                    }
                    className="px-2 py-0.5 border-b border-dashed border-slate-400 focus:border-blue-500 bg-amber-50/40 print:bg-transparent print:border-none focus:bg-white text-slate-900 outline-none w-44 transition-colors inline-block"
                  />
                  .{/* Botão de remoção de item na ordem coletiva */}
                  {transferencias.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveTransferencia(index)}
                      className="ml-4 p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors inline-flex items-center justify-center align-middle print:hidden"
                      title="Remover esta transferência"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Botão para adicionar mais uma transferência (Disponível apenas na visualização do sistema) */}
            <div className="flex justify-start print:hidden pt-2">
              <button
                type="button"
                onClick={handleAddTransferencia}
                className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-900 font-sans font-bold text-xs rounded-xl transition-all border border-blue-100 flex items-center gap-1.5 shadow-sm"
              >
                <Plus size={16} /> Adicionar +1 transferência
              </button>
            </div>

            <div className="py-6 text-center text-slate-400 tracking-wider text-xs font-sans border-y border-dashed border-slate-200 ">
              ------------------- A presente Ordem de Serviço produz efeitos
              imediatos -------------------
            </div>

            <p className="font-bold mt-4 font-sans">Cumpra-se.</p>
          </div>
        </div>

        {/* Rodapé e Assinatura */}
        <div className="mt-16 space-y-12">
          {/* Songo, __ de Mês de Ano */}
          <div className="text-right text-[12pt] font-medium pr-8">
            <span>Songo, </span>
            <input
              type="text"
              placeholder="____"
              value={formData.dia}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, dia: e.target.value }))
              }
              className="w-10 text-center border-b border-dashed border-slate-400 focus:border-blue-500 bg-amber-50/30 print:bg-transparent print:border-none outline-none"
            />
            <span> de </span>
            <input
              type="text"
              placeholder="Mês"
              value={formData.mes}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, mes: e.target.value }))
              }
              className="w-24 text-center border-b border-dashed border-slate-400 focus:border-blue-500 bg-amber-50/30 print:bg-transparent print:border-none outline-none"
            />
            <span> de </span>
            <input
              type="text"
              placeholder="Ano"
              value={formData.ano}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, ano: e.target.value }))
              }
              className="w-16 text-center border-b border-dashed border-slate-400 focus:border-blue-500 bg-amber-50/30 print:bg-transparent print:border-none outline-none"
            />
          </div>

          {/* Bloco de Assinatura do Diretor */}
          <div className="text-center pt-8 max-w-sm mx-auto flex flex-col items-center">
            <p className="font-bold  tracking-wide text-[10px] font-sans text-slate-500 mb-2">
              O Diretor-Geral
            </p>
            <div className="w-64">
              <SignatureUpload
                label=""
                value={formData.assinaturaDiretor}
                onChange={(val) =>
                  setFormData((prev) => ({ ...prev, assinaturaDiretor: val }))
                }
                user={user}
              />
            </div>

            <input
              type="text"
              value={formData.nomeDiretor}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  nomeDiretor: e.target.value,
                }))
              }
              className="w-80 text-center font-bold text-slate-900 border-b border-dashed border-transparent hover:border-slate-300 focus:border-blue-500 bg-transparent outline-none py-0.5 mt-1"
            />
            <input
              type="text"
              value={formData.tituloDiretor}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  tituloDiretor: e.target.value,
                }))
              }
              className="w-80 text-center text-xs text-slate-500 font-bold  tracking-wider border-b border-dashed border-transparent hover:border-slate-300 focus:border-blue-500 bg-transparent outline-none py-0.5 mt-1"
            />
          </div>

          {/* Rodapé Oficial */}
          <DocumentFooter className="mt-12" />
        </div>
      </div>
    </div>
  );
}
