import React, { useState } from "react";
import { Users, Clock, BookOpen, Building, FlaskConical, Wrench, GraduationCap, ClipboardList, BookMarked } from "lucide-react";
import GestaoAcademicaView from "./GestaoAcademicaView";
import HorarioView from "./HorarioView";
import GestaoEstudantilView from "./GestaoEstudantilView";
import GraduadosView from "./GraduadosView";
import DisciplinasEspacosFisicosView from "./DisciplinasEspacosFisicosView";
import ExamesView from "./ExamesView";

export default function GestaoAcademicaMainView({ title, user, onBack, onShowAlert }: { title: string; user: any; onBack: () => void; onShowAlert: (msg: string) => void }) {
  const [activeSubMenu, setActiveSubMenu] = useState("Docentes");

  const subMenuItems = [
    { title: "Docentes", icon: Users },
    { title: "Alocação", icon: ClipboardList },
    { title: "Horário", icon: Clock },
    { title: "Calendário de Exame", icon: BookMarked },
    { title: "Graduados", icon: GraduationCap },
    { title: "Disciplina", icon: BookOpen },
    { title: "Blocos e Sala de Aula", icon: Building },
    { title: "Laboratório", icon: FlaskConical },
    { title: "Oficinas", icon: Wrench },
  ];

  const renderSubView = () => {
    switch (activeSubMenu) {
      case "Docentes":
        return <GestaoAcademicaView title={title} user={user} onBack={onBack} initialShowList={true} />;
      case "Alocação":
        return <GestaoAcademicaView title={title} user={user} onBack={onBack} />;
      case "Horário":
        return <HorarioView title={title} user={user} />;
      case "Calendário de Exame":
        return <ExamesView user={user} onShowAlert={onShowAlert} />;
      case "Graduados":
        return <GraduadosView />;
      case "Disciplina":
        return <DisciplinasEspacosFisicosView user={user} onShowAlert={onShowAlert} categoria="Disciplinas" />;
      case "Blocos e Sala de Aula":
        return <DisciplinasEspacosFisicosView user={user} onShowAlert={onShowAlert} categoria="Blocos e Sala de Aula" />;
      case "Laboratório":
        return <DisciplinasEspacosFisicosView user={user} onShowAlert={onShowAlert} categoria="Laboratórios" />;
      case "Oficinas":
        return <DisciplinasEspacosFisicosView user={user} onShowAlert={onShowAlert} categoria="Oficinas" />;
      default:
        return <div>Selecione uma opção</div>;
    }
  };

  return (
    <div className="flex h-full w-full gap-6">
      <div className="w-64 bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col gap-2">
        {subMenuItems.map((item) => (
          <button
            key={item.title}
            onClick={() => setActiveSubMenu(item.title)}
            className={`flex items-center gap-3 p-4 rounded-xl font-bold text-sm transition-all ${activeSubMenu === item.title ? "bg-blue-600 text-white" : "hover:bg-gray-50 text-gray-700"}`}
          >
            <item.icon size={20} />
            {item.title}
          </button>
        ))}
      </div>
      <div className="flex-grow bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
        {renderSubView()}
      </div>
    </div>
  );
}
