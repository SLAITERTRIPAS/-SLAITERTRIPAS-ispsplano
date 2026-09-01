const fs = require("fs");
const file = "src/blocos/bloco1_apresentacao/MainHeader.tsx";
let content = fs.readFileSync(file, "utf8");

content = content.replace(
  "return (\n    <>\n      {showPasswordModal && <ChangePasswordModal user={user} onClose={() => setShowPasswordModal(false)} />}) => clearInterval(timer);",
  "return () => clearInterval(timer);",
);

content = content.replace(
  "return (\n    <header",
  "return (\n    <>\n      {showPasswordModal && <ChangePasswordModal user={user} onClose={() => setShowPasswordModal(false)} />}\n    <header",
);

fs.writeFileSync(file, content);
console.log("Fixed MainHeader.tsx");
