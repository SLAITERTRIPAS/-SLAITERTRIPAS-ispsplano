const fs = require("fs");
let code = fs.readFileSync(
  "src/blocos/bloco4_servicos_centrais/GestaoPessoalView.tsx",
  "utf8",
);

// Add emFormacao to statsMetrics
code = code.replace(
  "    adminConta: colaboradores.filter(c => c.cargoChefia === 'Proprietário do sistema' || c.cargoChefia === 'Administrador de sistema' || c.categoria?.toLowerCase().includes('proprietario')).length",
  "    adminConta: colaboradores.filter(c => c.cargoChefia === 'Proprietário do sistema' || c.cargoChefia === 'Administrador de sistema' || c.categoria?.toLowerCase().includes('proprietario')).length,\n    emFormacao: colaboradores.filter((c) => c.estado === 'Em Formação').length",
);

// Add the MenuCard for "Em Formação"
const newCard = `
            <MenuCard
              title="Em Formação"
              icon={BookOpen}
              onClick={() => {
                setFiltro({ estadoForaISPS: "Em Formação" } as any);
                pushView("lista");
              }}
              description="Colaboradores atualmente em formação"
              color="bg-purple-50 text-purple-600 group-hover:bg-purple-600 shadow-purple-100"
              count={statsMetrics.emFormacao}
            />
`;
code = code.replace(
  "count={statsMetrics.chefia}\n            />\n          </div>",
  "count={statsMetrics.chefia}\n            />\n" +
    newCard +
    "          </div>",
);

fs.writeFileSync(
  "src/blocos/bloco4_servicos_centrais/GestaoPessoalView.tsx",
  code,
);
