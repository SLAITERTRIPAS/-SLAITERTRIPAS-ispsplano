import React, { useState } from "react";
import { ArrowLeft, Building, Network, ChevronRight } from "lucide-react";

export const EstruturaExplorer = () => {
  const [selectedUnit, setSelectedUnit] = useState<any>(null);
  const estrutura = [
    {
      title: "Órgão de Direção e Gestão",
      type: "Unidade Estrutural Principal",
      direcoes: [
        {
          title: "Conselho de Representantes",
          departamentos: [],
        },
        {
          title: "Gabinete do Diretor-Geral",
          departamentos: [
            {
              title: "Diretor-Geral",
              reparticoes: ["Chefe do GDG", "Secretaria Executiva"],
            },
            {
              title: "Departamento de Planificação Estudos e Projetos",
              reparticoes: [
                "Chefe do Departamento de Planificação Estudos e Projetos",
                "Repartição de Planificação",
                "Repartição de Estatística",
                "Setor de Relatório",
                "Setor de Monitoria",
              ],
            },
            {
              title: "Unidade Gestora e Executora de Aquisições",
              reparticoes: ["Chefe da UGEA"],
            },
            {
              title: "Departamento de Cooperação e Relações Exteriores",
              reparticoes: [
                "Chefe do DCRE",
                "Setor de Imagem Institucional",
              ],
            },
            {
              title: "Departamento de Controlo Técnico e de Qualidade",
              reparticoes: [
                "Chefe do DCTQ",
                "Setor de Controlo Técnico",
              ],
            },
            {
              title: "Departamento Jurídico",
              reparticoes: [
                "Chefe do DJ",
                "Setor de Pareceres",
              ],
            },
          ],
        },
        {
          title: "Conselho Administrativo e de Gestão",
          departamentos: [],
        },
        {
          title: "Conselho Técnico e de Qualidade",
          departamentos: [],
        },
      ],
    },
    {
      title: "Unidade Orgânica",
      type: "Unidade Estrutural",
      direcoes: [
        {
          title: "Divisão de Engenharia",
          departamentos: [
            {
              title: "Direção da Divisão de Engenharia",
              reparticoes: [
                "Diretor da Divisão de Engenharia",
                "Diretor Adjunto Pedagógico",
              ],
            },
            {
              title: "Departamento de Pesquisa e Extensão",
              reparticoes: ["Repartição de Pesquisa", "Repartição de Extensão"],
            },
            {
              title: "Departamento de Engenharia Eletrotécnica",
              reparticoes: [
                "Chefe do DEE",
                "Diretor do Curso de Engenharia Elétrica",
                "Diretor do Curso de Engenharia Eletrónica e de Telecomunicações",
                "Diretor do Curso de Engenharia de Energias Renováveis",
              ],
            },
            {
              title: "Departamento de Engenharia de Construção Civil",
              reparticoes: [
                "Chefe do DECC",
                "Diretor do Curso de Engenharia de Construção Civil",
                "Diretor do Curso de Engenharia Hidráulica",
              ],
            },
            {
              title: "Departamento de Engenharia de Construção Mecânica",
              reparticoes: [
                "Chefe do DECM",
                "Diretor do Curso de Engenharia de Construção Mecânica",
                "Diretor do Curso de Engenharia Termotécnica",
              ],
            },
            {
              title: "Departamento de Disciplinas Gerais",
              reparticoes: ["Chefe do DDG"],
            },
            {
              title: "Departamento Técnico e de Apoio",
              reparticoes: ["Chefe do DTA"],
            },
          ],
        },
        {
          title: "Centro de Incubação de Empresas",
          departamentos: [
            {
              title: "Departamento de práticas de geração de negócio e desenvolvimento empresarial (DPGNDE)",
              reparticoes: [],
            },
            {
              title: "Departamento de consultoria, estudos, projetos e angariação de fundos (DCPAF)",
              reparticoes: [],
            },
            {
              title: "Departamento de prospecção de oportunidade de negócio (DPONE)",
              reparticoes: [],
            },
          ],
        },
      ],
    },
    {
      title: "Serviços Centrais",
      type: "Unidade Estrutural",
      direcoes: [
        {
          title: "DICOSAFA",
          departamentos: [
            {
              title: "Direção da DICOSAFA",
              reparticoes: ["Diretor da DICOSAFA"],
            },
            {
              title: "Departamento de Recursos Humanos",
              reparticoes: ["Chefe do RH", "Repartição de Pessoal", "Repartição de Formação", "Repartição de Apoio Social"],
            },
            {
              title: "Departamento de Finanças",
              reparticoes: ["Chefe de Finanças", "Repartição de Plano e Orçamento", "Repartição de Tesouraria", "Setor de Estatística"],
            },
            {
              title: "Departamento de Património",
              reparticoes: ["Chefe de DP", "Repartição de E-Património", "Repartição de Infraestrutura e Manutenção", "Repartição de Transporte"],
            },
            {
              title: "Secretaria Geral",
              reparticoes: ["Chefe da SG", "Secretaria", "SIC"],
            },
            {
              title: "Departamento TIC",
              reparticoes: ["Chefe de DTIC", "Setor de Rede de Computadores", "Setor de Manutenção", "Reprografia", "Oficina de TIC"],
            },
            {
              title: "Departamento Lar de Estudantes",
              reparticoes: ["Chefe de DLE", "Repartição de Alojamento", "Repartição de Eventos", "Economato"],
            },
            {
              title: "Departamento de Produção Alimentar",
              reparticoes: ["Chefe de DPA", "Repartição de Produção Animal", "Repartição de Produção Vegetal", "Armazém de Thaka"],
            },
          ],
        },
        {
          title: "DICOSSER",
          departamentos: [
            {
              title: "Direção da DICOSSER",
              reparticoes: ["Diretor da DICOSSER"],
            },
            {
              title: "Departamento de Registo Académico",
              reparticoes: ["Chefe do DRA", "Atendimento Estudantil", "Repartição de Certificação", "Repartição de Exames de Admissão", "Repartição de Matrículas"],
            },
            {
              title: "Departamento de Assuntos Estudantis",
              reparticoes: ["Chefe do DAE", "Repartição de Bolsa de Estudos", "Repartição de Desporto e Recreação"],
            },
            {
              title: "Departamento de Biblioteca",
              reparticoes: ["Chefe de DBA", "Biblioteca", "Repartição de Documentos", "Repartição de Arquivo"],
            },
          ],
        },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {!selectedUnit ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {estrutura.map((dir, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedUnit(dir)}
              className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 text-center transition-all flex flex-col items-center"
            >
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mb-4">
                <Building size={24} />
              </div>
              <h3 className="font-bold text-blue-900 text-lg leading-tight">
                {dir.title}
              </h3>
              <p className="text-xs text-gray-400 font-medium tracking-widest mt-2">
                {dir.type}
              </p>
            </button>
          ))}
        </div>
      ) : (
        <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm space-y-6">
          <button
            onClick={() => setSelectedUnit(null)}
            className="text-blue-600 font-bold flex items-center gap-2 mb-4 hover:text-blue-800 transition-colors"
          >
            <ArrowLeft size={16} /> Voltar à Estrutura
          </button>
          <div>
            <h3 className="text-3xl font-black text-blue-900">
              {selectedUnit.title}
            </h3>
            <p className="text-sm font-bold text-blue-400 tracking-widest mt-1">
              {selectedUnit.type}
            </p>
          </div>

          <div className="space-y-6 mt-8">
            <h4 className="font-black text-gray-800 text-lg border-b border-gray-100 pb-2">
              Estrutura Interna (Direções / Comissões)
            </h4>
            {selectedUnit.direcoes.length === 0 && (
              <p className="text-gray-400 italic">
                Nenhuma direcção cadastrada.
              </p>
            )}

            {selectedUnit.direcoes.map((dir: any, idx: number) => (
              <div
                key={idx}
                className="bg-gray-50/50 border border-gray-100 p-6 rounded-[1.5rem]"
              >
                <h5 className="font-black text-blue-900 text-xl mb-6 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center text-sm shadow-md">
                    {idx + 1}
                  </div>
                  {dir.title}
                </h5>

                <div className="space-y-4 md:pl-14">
                  <h6 className="font-bold text-gray-500 text-xs tracking-widest flex items-center gap-2">
                    <Network size={14} />
                    Departamentos / Órgãos Subordinados ({dir.departamentos.length})
                  </h6>
                  {dir.departamentos.length === 0 && (
                    <p className="text-gray-400 italic text-sm">
                      Nenhum departamento cadastrado neste órgão.
                    </p>
                  )}

                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    {dir.departamentos.map((dept: any, deptIdx: number) => (
                      <div
                        key={deptIdx}
                        className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <p className="font-bold text-gray-800 mb-4 text-base border-b border-gray-50 pb-2">
                          {dept.title}
                        </p>
                        <div className="space-y-3">
                          <p className="text-[10px] text-blue-400 font-bold tracking-widest flex items-center gap-1.5">
                            <ChevronRight size={12} />
                            Repartições / Setores ({dept.reparticoes?.length || 0})
                          </p>
                          {dept.reparticoes && dept.reparticoes.length > 0 ? (
                            <ul className="space-y-2">
                              {dept.reparticoes.map(
                                (rep: string, repIdx: number) => (
                                  <li
                                    key={repIdx}
                                    className="text-sm text-gray-600 flex items-start gap-2.5"
                                  >
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-300 mt-1.5 shrink-0"></div>
                                    <span className="leading-tight">{rep}</span>
                                  </li>
                                ),
                              )}
                            </ul>
                          ) : (
                            <p className="text-xs text-gray-400 italic">Sem repartições específicas.</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
