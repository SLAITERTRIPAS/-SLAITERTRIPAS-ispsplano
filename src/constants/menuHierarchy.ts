import {
  Building2,
  Briefcase,
  Settings,
  LayoutGrid,
} from "lucide-react";

export const baseMenuItems = [
  {
    title: "Órgão de Direção e Gestão",
    icon: LayoutGrid,
    color: "bg-blue-900",
    items: [
      { title: "Conselho de Representantes" },
      {
        title: "Gabinete do Diretor-Geral",
        subItems: [
          { title: "Diretor-Geral" },
          {
            title: "Chefe do GDG",
            subItems: [
              { title: "Plano do Gabinete" },
              { title: "Plano Individual" },
            ],
          },
          { title: "Secretaria Executiva" },
          {
            title: "Departamento de Planificação Estudos e Projetos",
            subItems: [
              {
                title:
                  "Chefe do Departamento de Planificação Estudos e Projetos",
              },
              { title: "Repartição de Planificação" },
              { title: "Repartição de Estatística" },
              { title: "Setor de Relatório" },
              { title: "Setor de Monitoria" },
            ],
          },
          {
            title: "Unidade Gestora e Executora de Aquisições",
            subItems: [
              { title: "Chefe da UGEA" },
              { title: "Gestão de Fornecedores" },
              { title: "Plano de Aquisição" },
              { title: "Plano de Contratação" },
              { title: "Plano de Atividade da UGEA" },
            ],
          },
          {
            title: "Departamento de Cooperação e Relações Exteriores",
            subItems: [{ title: "Chefe do DCRE" }],
          },
          {
            title: "Departamento de Controlo Técnico e de Qualidade",
            subItems: [{ title: "Chefe do DCTQ" }],
          },
          {
            title: "Departamento Jurídico",
            subItems: [{ title: "Chefe do DJ" }],
          },
        ],
      },
      { title: "Conselho Administrativo e de Gestão" },
      { title: "Conselho Técnico e de Qualidade" },
    ],
  },
  {
    title: "Unidade orgânica",
    icon: Building2,
    color: "bg-red-800",
    items: [
      {
        title: "Divisão de Engenharia",
        subItems: [
          { title: "Diretor da Divisão de Engenharia" },
          { title: "Diretor Adjunto Pedagógico" },
          {
            title: "Departamento de Pesquisa e Extensão",
            subItems: [{ title: "Chefe do DPE" }],
          },
          {
            title: "Departamento de Engenharia Eletrotécnica",
            subItems: [
              { title: "Chefe do DEE" },
              { title: "Diretor do Curso de Engenharia Elétrica" },
              {
                title:
                  "Diretor do Curso de Engenharia Eletrónica e de Telecomunicações",
              },
              {
                title:
                  "Diretor do Curso de Engenharia de Energias Renováveis",
              },
            ],
          },
          {
            title: "Departamento de Engenharia de Construção Civil",
            subItems: [
              { title: "Chefe do DECC" },
              { title: "Diretor do Curso de Engenharia de Construção Civil" },
              { title: "Diretor do Curso de Engenharia Hidráulica" },
            ],
          },
          {
            title: "Departamento de Engenharia de Construção Mecânica",
            subItems: [
              { title: "Chefe do DECM" },
              {
                title:
                  "Diretor do Curso de Engenharia de Construção Mecânica",
              },
              { title: "Diretor do Curso de Engenharia Termotécnica" },
            ],
          },
          {
            title: "Departamento de Disciplinas Gerais",
            subItems: [{ title: "Chefe do DDG" }],
          },
          {
            title: "Departamento Técnico e de Apoio",
            subItems: [{ title: "Chefe do DTA" }],
          },
        ],
      },
      {
        title: "Centro de Incubação de Empresas",
        subItems: [
          { title: "Diretor do CIE" },
          {
            title:
              "Departamento de práticas de geração de negócio e desenvolvimento empresarial (DPGNDE)",
          },
          {
            title:
              "Departamento de consultoria, estudos, projetos e angariação de fundos (DCPAF)",
          },
          {
            title:
              "Departamento de prospecção de oportunidade de negócio (DPONE)",
          },
        ],
      },
      { title: "Centros" },
    ],
  },
  {
    title: "Serviços Centrais",
    icon: Briefcase,
    color: "bg-gray-600",
    items: [
      {
        title:
          "Direção de Coordenação de Serviços de Administração, Finanças e de Apoio (DICOSAFA)",
        subItems: [
          { title: "Diretor da DICOSAFA" },
          {
            title: "Departamento de Recursos Humanos",
            subItems: [
              { title: "Chefe do RH" },
              { title: "Repartição de Pessoal" },
              { title: "Repartição de Formação" },
              { title: "Repartição de Apoio Social" },
            ],
          },
          {
            title: "Departamento de Finanças",
            subItems: [
              { title: "Chefe de Finanças" },
              { title: "Repartição de Plano e Orçamento" },
              { title: "Repartição de Tesouraria" },
              { title: "Setor de Estatística" },
            ],
          },
          {
            title: "Departamento de Património",
            subItems: [
              { title: "Chefe de DP" },
              {
                title: "Repartição de E-Património",
                subItems: [
                  { title: "Economato" },
                  { title: "Gestão Patrimonial" },
                ],
              },
              { title: "Repartição de Infraestrutura e Manutenção" },
              {
                title: "Repartição de Transporte",
                subItems: [
                  { title: "Gestão de Frota" },
                  { title: "Gestão de Viatura" },
                ],
              },
            ],
          },
          {
            title: "Secretaria Geral",
            subItems: [
              { title: "Chefe da SG" },
              { title: "Secretaria" },
              { title: "SIC" },
            ],
          },
          {
            title: "Departamento TIC",
            subItems: [
              { title: "Chefe de DTIC" },
              { title: "Setor de Rede de Computadores" },
              { title: "Setor de Manutenção" },
              { title: "Reprografia" },
              { title: "Oficina de TIC" },
            ],
          },
          {
            title: "Departamento Lar de Estudantes",
            subItems: [
              { title: "Chefe de DLE" },
              { title: "Repartição de Alojamento" },
              { title: "Repartição de Eventos" },
              { title: "Economato" },
            ],
          },
          {
            title: "Departamento de Produção Alimentar",
            subItems: [
              { title: "Chefe de DPA" },
              { title: "Repartição de Produção Animal" },
              { title: "Repartição de Produção Vegetal" },
              { title: "Armazém de Thaka" },
            ],
          },
        ],
      },
      {
        title:
          "Direção de Coordenação de Serviços Académicos, Sociais, Extensão e Relações Públicas (DICOSSER)",
        subItems: [
          { title: "Diretor da DICOSSER" },
          {
            title: "Departamento de Registo Académico",
            subItems: [
              { title: "Chefe do DRA" },
              { title: "Atendimento Estudantil" },
              { title: "Repartição de Certificação" },
              { title: "Repartição de Exames de Admissão" },
              { title: "Repartição de Matrículas" },
            ],
          },
          {
            title: "Departamento de Assuntos Estudantis",
            subItems: [
              { title: "Chefe do DAE" },
              {
                title: "Repartição de Bolsa de Estudos",
              },
              { title: "Repartição de Desporto e Recreação" },
            ],
          },
          {
            title: "Departamento de Biblioteca",
            subItems: [
              { title: "Chefe de DBA" },
              {
                title: "Biblioteca",
                subItems: [
                  {
                    title: "Atendimento da Biblioteca",
                    subItems: [
                      { title: "Registos de Visitantes" },
                      { title: "Registo de Obras e Livros" },
                    ],
                  },
                  { title: "Gestão de Biblioteca" },
                ],
              },
              { title: "Repartição de Documentos" },
              { title: "Repartição de Arquivo" },
            ],
          },
        ],
      },
    ],
  },
  { title: "Sistema", icon: Settings, color: "bg-black", items: [] },
];
