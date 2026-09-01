const fs = require("fs");
const path = require("path");

function walk(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const stat = fs.statSync(path.join(dir, file));
    if (stat.isDirectory()) {
      if (file !== "node_modules" && file !== "dist" && file !== ".git") {
        walk(path.join(dir, file), fileList);
      }
    } else {
      if (file.endsWith(".tsx") || file.endsWith(".ts")) {
        fileList.push(path.join(dir, file));
      }
    }
  }
  return fileList;
}

const allFiles = walk("src");
let fileSizes = [];

for (const f of allFiles) {
  const c = fs.readFileSync(f, "utf8");
  fileSizes.push({ name: f, size: c.length, lines: c.split("\n").length });
}

// Group by similar line count (+- 2 lines)
fileSizes.sort((a, b) => a.lines - b.lines);

for (let i = 0; i < fileSizes.length - 1; i++) {
  if (
    Math.abs(fileSizes[i].lines - fileSizes[i + 1].lines) < 5 &&
    fileSizes[i].lines > 20
  ) {
    console.log(
      `Similar size: ${fileSizes[i].name} (${fileSizes[i].lines}) and ${fileSizes[i + 1].name} (${fileSizes[i + 1].lines})`,
    );
  }
}
