import React, { useState } from "react";
import {
  ArrowLeft,
  Book,
  FileText,
  GraduationCap,
  Building,
  HelpCircle,
  MessageSquare,
  AlertTriangle,
  Search,
} from "lucide-react";
import { motion } from "motion/react";

export default function VisitorServicesView({
  visitorType,
  onBack,
  onSelectService,
}: {
  visitorType: string;
  onBack: () => void;
  onSelectService: (service: string) => void;
}) {
  const [selectedService, setSelectedService] = useState("");

  const allServices = [
    { name: "Biblioteca", icon: Book },
    { name: "Pedido de certificado", icon: FileText },
    { name: "Pedido de declaração de cadeiras feitas", icon: FileText },
    { name: "Pedido de estagio", icon: GraduationCap },
    { name: "Pedido de anulação de matricula", icon: AlertTriangle },
    { name: "Pedido de espaco para acomodação", icon: Building },
    { name: "Pedido de realização de reposição de teste", icon: FileText },
    { name: "Pedido de esclarecimento", icon: HelpCircle },
    { name: "Caixa de reclamação", icon: MessageSquare },
    { name: "Rastrear Pedido", icon: Search },
  ];

  const services =
    visitorType === "Estudante"
      ? allServices
      : allServices.filter(
          (s) => s.name === "Biblioteca" || s.name === "Rastrear Pedido",
        );

  const isBiblioteca = visitorType === "Biblioteca";

  const handleContinue = () => {
    if (selectedService) {
      onSelectService(selectedService);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`min-h-screen relative flex flex-col ${isBiblioteca ? "text-white" : "bg-white text-gray-900"} p-8 md:p-16 overflow-hidden`}
    >
      {isBiblioteca && (
        <div className="absolute inset-0 z-0 overflow-hidden">
          <img
            src="https://lh3.googleusercontent.com/d/1CDBqWNkpDe29yT2s79HHRBLlrClIJLBe"
            alt="Library Background"
            className="absolute inset-0 w-full h-full object-cover object-center"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-black/40"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80"></div>
        </div>
      )}

      <div className="relative z-10 w-full max-w-4xl mx-auto flex flex-col">
        <button
          onClick={onBack}
          className={`self-start flex items-center gap-2 mb-8 transition-colors ${isBiblioteca ? "text-white/80 hover:text-white" : "text-gray-500 hover:text-gray-900"}`}
        >
          <ArrowLeft size={20} /> Voltar
        </button>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            Serviços Disponíveis para {visitorType}
          </h1>
          <p
            className={`text-lg ${isBiblioteca ? "text-white/70" : "text-gray-600"}`}
          >
            Selecione o serviço que deseja solicitar num campo abaixo.
          </p>
        </div>

        <div className="max-w-md mx-auto w-full space-y-6">
          <div className="flex flex-col text-left">
            <label
              className={`block text-sm font-bold mb-2 ${isBiblioteca ? "text-white/90" : "text-gray-700"}`}
            >
              Selecione o serviço
            </label>
            <div className="relative">
              <select
                value={selectedService}
                onChange={(e) => setSelectedService(e.target.value)}
                className={`w-full p-4 pl-4 pr-10 rounded-2xl border-2 appearance-none cursor-pointer focus:outline-none transition-all duration-200 ${
                  isBiblioteca
                    ? "bg-white/10 backdrop-blur-md border-white/30 text-white focus:border-white/70 [&>option]:text-black"
                    : "bg-white border-gray-200 text-gray-900 focus:border-orange-500 shadow-sm"
                }`}
              >
                <option value="" disabled>
                  Selecione uma opção...
                </option>
                {services.map((service) => (
                  <option key={service.name} value={service.name}>
                    {service.name}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none">
                <svg
                  className={`w-5 h-5 ${isBiblioteca ? "text-white" : "text-gray-400"}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 9l-7 7-7-7"
                  ></path>
                </svg>
              </div>
            </div>
          </div>

          <button
            onClick={handleContinue}
            disabled={!selectedService}
            className={`w-full py-4 rounded-2xl font-bold text-lg transition-all duration-200 ${
              !selectedService
                ? "opacity-50 cursor-not-allowed bg-gray-200 text-gray-400 border-2 border-transparent"
                : isBiblioteca
                  ? "bg-white text-black hover:bg-gray-100 shadow-lg"
                  : "bg-orange-600 text-white hover:bg-orange-700 shadow-lg hover:shadow-xl"
            }`}
          >
            Continuar para Solicitação
          </button>
        </div>
      </div>
    </motion.div>
  );
}
