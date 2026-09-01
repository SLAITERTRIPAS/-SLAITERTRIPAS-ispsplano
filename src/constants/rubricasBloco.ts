export interface BemRubrica {
  nome: string;
  precoUnitario: number;
  descricao: string;
  detalhes: string;
}

export interface NecessidadeRubrica {
  necessidade: string;
  bens: BemRubrica[];
}

export interface RubricaBlocoItem {
  rubrica: string;
  necessidades: NecessidadeRubrica[];
}

export const rubricas: RubricaBlocoItem[] = [
  {
    rubrica: "Demais despesas com o pessoal - 112",
    necessidades: [
      {
        necessidade: "112101 - Ajuda de custo dentro do país para pessoal civil (DG)",
        bens: [
          {
            nome: "Ajuda de custo diária (DG)",
            precoUnitario: 9000,
            descricao: "Subsídio diário para deslocações de Direção Geral no país",
            detalhes: "Por dia / pessoa"
          }
        ]
      },
      {
        necessidade: "112101 - Ajuda de custo dentro do país para pessoal civil (TECNICOS)",
        bens: [
          {
            nome: "Ajuda de custo diária (Técnico)",
            precoUnitario: 6000,
            descricao: "Subsídio diário para deslocações de técnicos no país",
            detalhes: "Por dia / pessoa"
          }
        ]
      },
      {
        necessidade: "112101 - Ajuda de custo dentro do país para pessoal civil (MOTORISTA)",
        bens: [
          {
            nome: "Ajuda de custo diária (Motorista)",
            precoUnitario: 1800,
            descricao: "Subsídio diário para motoristas em missões de serviço",
            detalhes: "Por dia / pessoa"
          }
        ]
      },
      {
        necessidade: "112106 - Subsídio de combustível e manutenção de viaturas",
        bens: [
          {
            nome: "Subsídio mensal de combustível",
            precoUnitario: 15000,
            descricao: "Apoio mensal para combustível de cargos de chefia",
            detalhes: "Por mês"
          }
        ]
      }
    ]
  },
  {
    rubrica: "Bens - 121",
    necessidades: [
      {
        necessidade: "121001 - Combustíveis e lubrificantes",
        bens: [
          {
            nome: "Gasóleo / Diesel",
            precoUnitario: 89.15,
            descricao: "Combustível para viaturas institucionais e geradores",
            detalhes: "Litro"
          },
          {
            nome: "Gasolina",
            precoUnitario: 86.97,
            descricao: "Combustível para viaturas a gasolina",
            detalhes: "Litro"
          },
          {
            nome: "Óleo de motor 15W-40",
            precoUnitario: 450,
            descricao: "Lubrificante para motores a diesel",
            detalhes: "Litro"
          }
        ]
      },
      {
        necessidade: "121005 - Material de consumo para escritório",
        bens: [
          {
            nome: "Papel A4 (Resma)",
            precoUnitario: 350,
            descricao: "Resma de papel A4 80g para impressões e fotocópias",
            detalhes: "Resma (500 folhas)"
          },
          {
            nome: "Esferográfica azul / preta",
            precoUnitario: 15,
            descricao: "Caneta esferográfica de uso corrente",
            detalhes: "Unidade"
          },
          {
            nome: "Bloco de notas",
            precoUnitario: 75,
            descricao: "Bloco de apontamentos pautado A5",
            detalhes: "Unidade"
          },
          {
            nome: "Agrafos (caixa)",
            precoUnitario: 50,
            descricao: "Caixa de agrafos 24/6 para agrafador",
            detalhes: "Caixa"
          },
          {
            nome: "Marcador para quadro branco",
            precoUnitario: 45,
            descricao: "Marcador recarregável para aulas e reuniões",
            detalhes: "Unidade"
          }
        ]
      },
      {
        necessidade: "121010 - Géneros alimentícios",
        bens: [
          {
            nome: "Arroz (Saco 25kg)",
            precoUnitario: 1450,
            descricao: "Arroz branco de boa qualidade",
            detalhes: "Saco 25 Kg"
          },
          {
            nome: "Fuba de milho",
            precoUnitario: 850,
            descricao: "Fuba de milho selecionada",
            detalhes: "Saco 25 Kg"
          },
          {
            nome: "Óleo alimentar",
            precoUnitario: 120,
            descricao: "Óleo vegetal refinado",
            detalhes: "Litro"
          }
        ]
      },
      {
        necessidade: "121011 - Material de limpeza e higiene",
        bens: [
          {
            nome: "Lixívia / Cloro",
            precoUnitario: 95,
            descricao: "Desinfetante líquido multiuso",
            detalhes: "Litro"
          },
          {
            nome: "Detergente em pó",
            precoUnitario: 150,
            descricao: "Detergente para limpeza geral",
            detalhes: "Kg"
          },
          {
            nome: "Papel higiénico",
            precoUnitario: 220,
            descricao: "Papel higiénico folha dupla",
            detalhes: "Pacote 10 rolos"
          }
        ]
      },
      {
        necessidade: "121022 - Material de consumo para informática",
        bens: [
          {
            nome: "Toner HP LaserJet",
            precoUnitario: 4500,
            descricao: "Toner original para impressora",
            detalhes: "Unidade"
          },
          {
            nome: "Tinta para impressora Epson (Kit)",
            precoUnitario: 2800,
            descricao: "Kit 4 cores garrafa de tinta",
            detalhes: "Kit 4 cores"
          },
          {
            nome: "Pen Drive 32GB",
            precoUnitario: 650,
            descricao: "Dispositivo de armazenamento USB 3.0",
            detalhes: "Unidade"
          }
        ]
      }
    ]
  },
  {
    rubrica: "Serviços - 122",
    necessidades: [
      {
        necessidade: "122001 - Comunicações em geral",
        bens: [
          {
            nome: "Internet Banda Larga",
            precoUnitario: 12000,
            descricao: "Serviço mensal de internet dedicada",
            detalhes: "Mensal"
          },
          {
            nome: "Recarga telefónica",
            precoUnitario: 1500,
            descricao: "Crédito para comunicações móveis",
            detalhes: "Por mês"
          }
        ]
      },
      {
        necessidade: "122012 - Água",
        bens: [
          {
            nome: "Fornecimento de Água FIPAG",
            precoUnitario: 25000,
            descricao: "Consumo mensal de água canalizada",
            detalhes: "Mensal"
          }
        ]
      },
      {
        necessidade: "122013 - Energia eléctrica",
        bens: [
          {
            nome: "Fornecimento de Energia EDM",
            precoUnitario: 45000,
            descricao: "Consumo mensal de energia elétrica",
            detalhes: "Mensal"
          }
        ]
      }
    ]
  },
  {
    rubrica: "Demais transferências a famílias - 1434",
    necessidades: [
      {
        necessidade: "143401 - Bolsa de estudos no país",
        bens: [
          {
            nome: "Subsídio de bolsa de estudos",
            precoUnitario: 5000,
            descricao: "Apoio a estudantes",
            detalhes: "Por aluno / mês"
          }
        ]
      }
    ]
  },
  {
    rubrica: "Exercícios findos - 12",
    necessidades: [
      {
        necessidade: "161001 - Retractivos salariais de exercícios anteriores para pessoal civil",
        bens: [
          {
            nome: "Retractivos salariais",
            precoUnitario: 10000,
            descricao: "Acerto de remunerações",
            detalhes: "Global"
          }
        ]
      }
    ]
  }
];
