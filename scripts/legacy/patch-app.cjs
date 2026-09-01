const fs = require("fs");
let code = fs.readFileSync("src/App.tsx", "utf8");
code = code.replace(
  "const [user, setUser] = useState<User | null>(() => {",
  `const [user, setUser] = useState<User | null>(() => { return { id: "test", name: "Admin", email: "slaitertripas@gmail.com", role: "Administrador" }; `,
);
fs.writeFileSync("src/App.tsx", code);
