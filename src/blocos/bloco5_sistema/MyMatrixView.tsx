import React from "react";
import {
  Archive,
  Share2,
  Eye,
  FileCheck,
  Download,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { motion } from "motion/react";
import { PublishedMatrix } from "../../types";

export default function MyMatrixView({
  onShowAlert,
  externalMatrices,
}: {
  onShowAlert: (msg: string) => void;
  externalMatrices?: any[];
}) {
  // Use external matrices if provided, otherwise use mock data
  const publishedMatrices = externalMatrices || [
    {
      id: "MAT-2027-001",
      year: 2027,
      publishedAt: "2026-04-02 11:15",
      activityCount: 8,
      status: "published",
    },
    {
      id: "MAT-2026-005",
      year: 2026,
      publishedAt: "2025-03-15 09:30",
      activityCount: 12,
      status: "shared",
    },
  ];

  const handleDownloadMatrix = (matrix: PublishedMatrix) => {
    let content = `Instituto Superior Politécnico de Songo\n\n`;
    content += `==================================================\n`;
    content += `MATRIZ ESTRATÉGICA CONSOLIDADA - ANO ${matrix.year}\n`;
    content += `==================================================\n\n`;
    content += `ID da Matriz: ${matrix.id}\n`;
    content += `Ano de Vigência: ${matrix.year}\n`;
    content += `Publicada em: ${matrix.publishedAt}\n`;
    content += `Quantidade de Actividades: ${matrix.activityCount}\n`;
    content += `Estado: ${matrix.status === "shared" ? "Partilhada com Direções" : "Consolidada e Aguardando Partilha"}\n\n`;
    content += `--------------------------------------------------\n`;
    content += `Este documento oficial foi gerado e assinado digitalmente pelo Sistema Integrado de Gestão do Songo.\n`;
    content += `Data de Emissão: ${new Date().toLocaleString("pt-PT")}\n`;

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Matriz_Estrategica_${matrix.year}_${matrix.id}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    onShowAlert(
      `Download da Matriz Estratégica ${matrix.year} iniciado com sucesso!`,
    );
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 pb-20">
      <div>
        <h2 className="text-2xl font-bold text-blue-900">Minha Matriz</h2>
        <p className="text-gray-500">
          Repositório de matrizes estratégicas consolidadas e prontas para
          partilha.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {publishedMatrices.map((matrix) => (
          <motion.div
            key={matrix.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all"
          >
            <div className="p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
              <div className="flex items-center gap-6">
                <div
                  className={`p-5 rounded-2xl ${matrix.status === "shared" ? "bg-green-50 text-green-600" : "bg-blue-50 text-blue-600"}`}
                >
                  <Archive size={32} />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-xl font-bold text-gray-900">
                      Matriz Estratégica {matrix.year}
                    </h3>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wider ${
                        matrix.status === "shared"
                          ? "bg-green-100 text-green-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {matrix.status === "shared"
                        ? "Partilhada"
                        : "Consolidada"}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <Clock size={14} />
                      <span>Publicada em: {matrix.publishedAt}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <FileCheck size={14} />
                      <span>{matrix.activityCount} Actividades Definidas</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                <button
                  onClick={() =>
                    onShowAlert("Visualizando detalhes da matriz...")
                  }
                  className="flex-grow md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all"
                >
                  <Eye size={18} /> Detalhes
                </button>

                {matrix.status === "published" ? (
                  <button
                    onClick={() =>
                      onShowAlert(
                        "Matriz partilhada com todas as direções com sucesso!",
                      )
                    }
                    className="flex-grow md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                  >
                    <Share2 size={18} /> Partilhar Com Direções
                  </button>
                ) : (
                  <div className="flex items-center gap-2 px-6 py-3 bg-green-50 text-green-700 rounded-xl font-bold border border-green-100">
                    <CheckCircle2 size={18} /> Já Partilhada
                  </div>
                )}

                <button
                  onClick={() => handleDownloadMatrix(matrix)}
                  title="Descarregar Matriz"
                  className="p-3 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                >
                  <Download size={20} />
                </button>
              </div>
            </div>

            {matrix.status === "published" && (
              <div className="bg-amber-50 border-t border-amber-100 px-8 py-3 flex items-center gap-2">
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                <p className="text-amber-800 text-[10px] font-bold tracking-widest">
                  Ação Necessária: Esta matriz ainda não foi enviada para as
                  direções setoriais.
                </p>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl p-12 text-center">
        <Archive size={40} className="mx-auto text-gray-300 mb-4" />
        <h4 className="text-gray-900 font-bold">Histórico de Matrizes</h4>
        <p className="text-gray-500 text-sm max-w-md mx-auto mt-2">
          Aqui você encontrará todas as matrizes de anos anteriores para
          consulta e comparação de indicadores.
        </p>
      </div>
    </div>
  );
}
