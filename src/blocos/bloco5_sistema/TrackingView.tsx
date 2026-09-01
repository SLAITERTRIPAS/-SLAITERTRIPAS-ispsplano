import React, { useState } from "react";
import {
  ArrowLeft,
  Search,
  Clock,
  CheckCircle2,
  AlertCircle,
  User,
  FileText,
  Send,
} from "lucide-react";
import { motion } from "motion/react";
import { ServiceRequest } from "../../types";

export default function TrackingView({
  onBack,
  serviceRequests,
}: {
  onBack: () => void;
  serviceRequests: ServiceRequest[];
}) {
  const [trackingCode, setTrackingCode] = useState("");
  const [result, setResult] = useState<ServiceRequest | null>(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const found = serviceRequests.find((r) => r.trackingCode === trackingCode);
    setResult(found || null);
    setSearched(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Submetido":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Concluído":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-orange-100 text-orange-800 border-orange-200";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col overflow-hidden">
      <header className="flex-none bg-blue-900 text-white p-4 md:p-6 flex items-center gap-4 shadow-md z-10">
        <button
          onClick={onBack}
          className="p-2 hover:bg-white/20 rounded-full transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-lg md:text-xl font-bold tracking-wider truncate">
          Rastreio de Pedidos
        </h1>
      </header>

      <main className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8">
        <div className="max-w-3xl mx-auto space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden p-8"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Consultar Estado do Pedido
            </h2>
            <p className="text-gray-600 mb-8">
              Insira o código de rastreio fornecido no momento da submissão.
            </p>

            <form onSubmit={handleSearch} className="flex gap-4">
              <div className="relative flex-1">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  required
                  type="text"
                  placeholder="Ex: JD-EC-08042026-3ANO/CERTIFICADO"
                  autoComplete="off"
                  autoCorrect="off"
                  className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-mono text-lg"
                  value={trackingCode}
                  onChange={(e) =>
                    setTrackingCode(e.target.value.toUpperCase())
                  }
                />
              </div>
              <button
                type="submit"
                className="px-8 py-4 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-100"
              >
                Consultar
              </button>
            </form>
          </motion.div>

          {searched && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {result ? (
                <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                  <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        {result.service}
                      </h3>
                      <p className="text-gray-500 font-mono mt-1">
                        {result.trackingCode}
                      </p>
                    </div>
                    <span
                      className={`px-4 py-2 rounded-full text-sm font-bold border ${getStatusColor(result.status)}`}
                    >
                      {result.status}
                    </span>
                  </div>

                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 border-b border-gray-100">
                    <div>
                      <p className="text-sm font-bold text-gray-500 mb-1">
                        Requerente
                      </p>
                      <p className="text-gray-900 font-medium flex items-center gap-2">
                        <User size={16} className="text-gray-400" />{" "}
                        {result.nome}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-500 mb-1">
                        Curso / Departamento
                      </p>
                      <p className="text-gray-900 font-medium">
                        {result.curso} {result.nivel && `(${result.nivel})`}
                      </p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-sm font-bold text-gray-500 mb-1">
                        Descrição do Pedido
                      </p>
                      <p className="text-gray-900 bg-white p-4 rounded-xl border border-gray-200">
                        {result.descricao}
                      </p>
                    </div>
                  </div>

                  <div className="p-6">
                    <h4 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                      <Clock className="text-blue-500" size={20} />
                      Histórico de Tramitação
                    </h4>

                    <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
                      {result.history.map((item, idx) => (
                        <div
                          key={idx}
                          className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active"
                        >
                          <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-blue-100 text-blue-600 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                            <CheckCircle2 size={20} />
                          </div>

                          <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-gray-100 bg-white shadow-sm">
                            <div className="flex items-center justify-between mb-1">
                              <h5 className="font-bold text-gray-900">
                                {item.stage}
                              </h5>
                              <time className="text-xs font-medium text-gray-500">
                                {new Date(item.date).toLocaleDateString(
                                  "pt-PT",
                                )}
                              </time>
                            </div>
                            <p className="text-sm text-gray-600 mt-2">
                              {item.parecer}
                            </p>
                            <p className="text-xs text-gray-400 mt-2 font-medium">
                              Por: {item.author}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {result.status === "Concluído" && (
                    <div className="p-6 bg-green-50 border-t border-green-100 text-center">
                      <button className="px-6 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors shadow-lg shadow-green-100 flex items-center gap-2 mx-auto">
                        <FileText size={20} />
                        Descarregar Resposta / Documento
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-12 text-center">
                  <AlertCircle className="w-16 h-16 text-orange-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Pedido não encontrado
                  </h3>
                  <p className="text-gray-600">
                    Verifique se o código de rastreio está correto e tente
                    novamente.
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}
