const fs = require("fs");
let content = fs.readFileSync(
  "src/blocos/bloco5_sistema/PlanoWorkflowView.tsx",
  "utf8",
);

const oldTrans = `    try {
      setIsLoading(true);
      await Promise.all([
        ...toUpdate.map((act) => {
          const duplicate = {
            ...act,
            id: Math.random().toString(36).substr(2, 9),
            status: toStatus,
            submetido: false,
            createdAt: new Date().toISOString(),
          };
          return firestoreService.matrixActivities.add(duplicate);
        }),
        ...toUpdate.map((act) =>
          firestoreService.matrixActivities.update(act.id, { submetido: true }),
        ),
        firestoreService.archive_documents.add({
          title: \`Cópia: Plano de \${originLabel} (\${user?.setor || user?.reparticao || user?.departamento || 'Geral'}) - \${new Date().toLocaleDateString('pt-PT')}\`,
          year: selectedYear,
          type: 'Planos de Actividades e Orçamentos',
          date: new Date().toISOString().split('T')[0],
          actividades: toUpdate,
          author: user?.nome || user?.email,
          origin: originLabel
        })
      ]);`;

const newTrans = `    try {
      setIsLoading(true);
      await Promise.all([
        ...toUpdate.map((act) =>
          firestoreService.matrixActivities.update(act.id, { status: toStatus, submetido: false })
        ),
        firestoreService.archive_documents.add({
          title: \`Cópia: Plano de \${originLabel} (\${user?.setor || user?.reparticao || user?.departamento || 'Geral'}) - \${new Date().toLocaleDateString('pt-PT')}\`,
          year: selectedYear,
          type: 'Planos de Actividades e Orçamentos',
          date: new Date().toISOString().split('T')[0],
          actividades: toUpdate,
          author: user?.nome || user?.email,
          origin: originLabel
        })
      ]);`;

content = content.replace(oldTrans, newTrans);
fs.writeFileSync("src/blocos/bloco5_sistema/PlanoWorkflowView.tsx", content);
