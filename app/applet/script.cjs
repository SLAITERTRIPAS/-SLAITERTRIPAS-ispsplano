const fs = require("fs");
const path = require("path");
function walk(dir) {
  const files = fs.readdirSync(dir);
  for (let f of files) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) {
      walk(p);
    } else if (p.endsWith(".tsx") || p.endsWith(".ts")) {
      let c = fs.readFileSync(p, "utf8");
      let modified = false;

      // Fix types imports
      const typeReg = /from\s+['"]\.\.\/types['"]/g;
      if (typeReg.test(c)) {
        c = c.replace(typeReg, "from '../../types'");
        modified = true;
      }

      // Fix FileText missing in MainMenu.tsx
      if (p.endsWith("MainMenu.tsx") && !c.includes("FileText")) {
        c = c.replace("Settings,", "Settings, FileText,");
        modified = true;
      }

      if (modified) {
        fs.writeFileSync(p, c, "utf8");
      }
    }
  }
}
walk("src/blocos");
