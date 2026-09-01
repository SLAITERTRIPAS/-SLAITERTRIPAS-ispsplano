import React, { useState } from "react";
import { Plus } from "lucide-react";
import { PROVINCIAS } from "../../constants/formOptions";
import FormContainer from "../../components/ui/FormContainer";

const cursosData = [
  {
    nome: "Engenharia Eletrica",
    duracao: "5 anos",
    areas: ["Energia", "Sistemas"],
    subareas: ["Potência", "Automação"],
  },
  {
    nome: "Engenharia Eletrónica e de Telecomunicações",
    duracao: "5 anos",
    areas: ["Telecom", "Eletrónica"],
    subareas: ["Redes", "Sinais"],
  },
  {
    nome: "Engenharia de Energia Renováveis",
    duracao: "4 anos",
    areas: ["Energia", "Ambiente"],
    subareas: ["Solar", "Eólica"],
  },
  {
    nome: "Engenharia de Construção Civil",
    duracao: "5 anos",
    areas: ["Estruturas", "Geotecnia"],
    subareas: ["Betão", "Solos"],
  },
  {
    nome: "Engenharia Hidráulica",
    duracao: "5 anos",
    areas: ["Hidráulica", "Recursos Hídricos"],
    subareas: ["Barragens", "Saneamento"],
  },
  {
    nome: "Engenharia de construção Mecânicas",
    duracao: "5 anos",
    areas: ["Mecânica", "Materiais"],
    subareas: ["Fabrico", "Manutenção"],
  },
  {
    nome: "Engenharia Termotecnica",
    duracao: "4 anos",
    areas: ["Termodinâmica", "Energia"],
    subareas: ["Refrigeração", "Combustão"],
  },
];

const provinciaMap: Record<string, string> = {
  "Maputo Província": "Maputo Província",
  "Maputo Cidade": "Maputo Cidade",
  Gaza: "Gaza",
  Inhambane: "Inhambane",
  Manica: "Manica",
  Tete: "Tete",
  Sofala: "Sofala",
  Zambézia: "Zambézia",
  Nampula: "Nampula",
  Niassa: "Niassa",
  "Cabo Delgado": "Cabo Delgado",
};

export default function Quadro1_2Form() {
  const currentYear = new Date().getFullYear();
  const yearN_1 = currentYear - 1;

  const [rows, setRows] = useState([
    {
      id: 1,
      curso: cursosData[0],
      duracao: cursosData[0].duracao,
      regime: "Laboral",
      nacionalidade: "Moçambicano",
      provincia: "Maputo Província",
      distrito: PROVINCIAS["Maputo Província"][0],
      grau: "Licenciatura",
      preenchidas: 0,
      naoPreenchidas: 0,
      total: 0,
    },
  ]);

  const addRow = () => {
    setRows([
      ...rows,
      {
        id: Date.now(),
        curso: cursosData[0],
        duracao: cursosData[0].duracao,
        regime: "Laboral",
        nacionalidade: "Moçambicano",
        provincia: "Maputo Província",
        distrito: PROVINCIAS["Maputo Província"][0],
        grau: "Licenciatura",
        preenchidas: 0,
        naoPreenchidas: 0,
        total: 0,
      },
    ]);
  };

  return (
    <FormContainer
      title={`Quadro 1.2 Número de vagas preenchidas - ${yearN_1}`}
      description="Preenchimento de dados estatísticos"
      onEnviar={() =>
        alert("Quadro 1.2 enviado para a Repartição de Estatística!")
      }
    >
      <div className="w-full overflow-x-auto">
        <table className="w-full border-collapse min-w-max border border-gray-200">
          <thead>
            <tr className="bg-gray-50 text-gray-600 text-[10px] font-black tracking-widest border-b border-gray-100">
              <th
                className="p-4 border border-gray-200 text-center"
                rowSpan={2}
              >
                Nome do curso
              </th>
              <th
                className="p-4 border border-gray-200 text-center"
                rowSpan={2}
              >
                ***Duração (anos)
              </th>
              <th
                className="p-4 border border-gray-200 text-center"
                colSpan={2}
              >
                ISCED 2013
              </th>
              <th
                className="p-4 border border-gray-200 text-center"
                rowSpan={2}
              >
                Regime-Curso
              </th>
              <th
                className="p-4 border border-gray-200 text-center"
                rowSpan={2}
              >
                Grau
              </th>
              <th
                className="p-4 border border-gray-200 text-center"
                colSpan={2}
              >
                Nº de vagas
              </th>
              <th
                className="p-4 border border-gray-200 text-center"
                rowSpan={2}
              >
                Total
              </th>
              <th
                className="p-4 border border-gray-200 text-center"
                rowSpan={2}
              >
                Nacionalidade
              </th>
              <th
                className="p-4 border border-gray-200 text-center"
                rowSpan={2}
              >
                Província**
              </th>
              <th
                className="p-4 border border-gray-200 text-center"
                rowSpan={2}
              >
                Distrito**
              </th>
            </tr>
            <tr className="bg-gray-50 text-gray-600 text-[10px] font-black tracking-widest border-b border-gray-100">
              <th className="p-2 border border-gray-200 text-center">Áreas</th>
              <th className="p-2 border border-gray-200 text-center">
                Sub-áreas
              </th>
              <th className="p-2 border border-gray-200 text-center">
                Preenchidas
              </th>
              <th className="p-2 border border-gray-200 text-center">
                *Não Preenchidas
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                <td className="p-2 border border-gray-200">
                  <select
                    className="w-full p-2 border border-gray-200 rounded-lg text-xs"
                    value={row.curso.nome}
                    onChange={(e) => {
                      const newRows = [...rows];
                      const selectedCurso = cursosData.find(
                        (c) => c.nome === e.target.value,
                      )!;
                      newRows[index].curso = selectedCurso;
                      newRows[index].duracao = selectedCurso.duracao;
                      setRows(newRows);
                    }}
                  >
                    {cursosData.map((c) => (
                      <option key={c.nome} value={c.nome}>
                        {c.nome}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="p-2 border border-gray-200">
                  <select
                    className="w-full p-2 border border-gray-200 rounded-lg text-xs"
                    value={row.duracao}
                    onChange={(e) => {
                      const newRows = [...rows];
                      newRows[index].duracao = e.target.value;
                      setRows(newRows);
                    }}
                  >
                    <option value="4 anos">4 anos</option>
                    <option value="5 anos">5 anos</option>
                  </select>
                </td>
                <td className="p-2 border border-gray-200 text-xs text-center">
                  {row.curso.areas[0]}
                </td>
                <td className="p-2 border border-gray-200 text-xs text-center">
                  {row.curso.subareas[0]}
                </td>
                <td className="p-2 border border-gray-200">
                  <select
                    className="w-full p-2 border border-gray-200 rounded-lg text-xs"
                    value={row.regime}
                    onChange={(e) => {
                      const newRows = [...rows];
                      newRows[index].regime = e.target.value;
                      setRows(newRows);
                    }}
                  >
                    <option>Laboral</option>
                    <option>Pós-Laboral</option>
                  </select>
                </td>
                <td className="p-2 border border-gray-200 text-xs text-center">
                  {row.grau}
                </td>
                <td className="p-2 border border-gray-200">
                  <input
                    type="number"
                    className="w-16 p-2 border border-gray-200 rounded-lg text-xs text-center mx-auto block"
                    value={row.preenchidas}
                    onChange={(e) => {
                      const newRows = [...rows];
                      newRows[index].preenchidas =
                        parseInt(e.target.value) || 0;
                      newRows[index].total =
                        newRows[index].preenchidas +
                        newRows[index].naoPreenchidas;
                      setRows(newRows);
                    }}
                  />
                </td>
                <td className="p-2 border border-gray-200">
                  <input
                    type="number"
                    className="w-16 p-2 border border-gray-200 rounded-lg text-xs text-center mx-auto block"
                    value={row.naoPreenchidas}
                    onChange={(e) => {
                      const newRows = [...rows];
                      newRows[index].naoPreenchidas =
                        parseInt(e.target.value) || 0;
                      newRows[index].total =
                        newRows[index].preenchidas +
                        newRows[index].naoPreenchidas;
                      setRows(newRows);
                    }}
                  />
                </td>
                <td className="p-2 border border-gray-200 text-xs text-center font-bold bg-gray-50">
                  {row.total}
                </td>
                <td className="p-2 border border-gray-200">
                  <select
                    className="w-full p-2 border border-gray-200 rounded-lg text-xs"
                    value={row.nacionalidade}
                    onChange={(e) => {
                      const newRows = [...rows];
                      newRows[index].nacionalidade = e.target.value;
                      setRows(newRows);
                    }}
                  >
                    <option value="Moçambicano">Moçambicano</option>
                    <option value="Estrangeiro">Estrangeiro</option>
                  </select>
                </td>
                <td className="p-2 border border-gray-200">
                  <select
                    className="w-full p-2 border border-gray-200 rounded-lg text-xs"
                    value={row.provincia}
                    onChange={(e) => {
                      const newRows = [...rows];
                      const selectedProv = e.target
                        .value as keyof typeof PROVINCIAS;
                      newRows[index].provincia = selectedProv;
                      newRows[index].distrito = PROVINCIAS[selectedProv][0];
                      setRows(newRows);
                    }}
                  >
                    {Object.keys(PROVINCIAS).map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="p-2 border border-gray-200">
                  <select
                    className="w-full p-2 border border-gray-200 rounded-lg text-xs"
                    value={row.distrito}
                    onChange={(e) => {
                      const newRows = [...rows];
                      newRows[index].distrito = e.target.value;
                      setRows(newRows);
                    }}
                  >
                    {PROVINCIAS[row.provincia as keyof typeof PROVINCIAS].map(
                      (d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ),
                    )}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button
          onClick={addRow}
          className="mt-6 flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 rounded-xl text-xs font-black tracking-widest text-gray-600 hover:bg-gray-50 transition-all shadow-sm"
        >
          <Plus size={16} /> Adicionar Linha
        </button>
      </div>
    </FormContainer>
  );
}
