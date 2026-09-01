const getStatusLevel = (status) => {
  if (status === "setorial") return 1;
  if (status === "reparticao") return 2;
  if (status === "departamento") return 3;
  if (status === "direcao") return 4;
  if (status === "planificacao") return 5;
  if (status === "institucional") return 6;
  return 1; // default
};
