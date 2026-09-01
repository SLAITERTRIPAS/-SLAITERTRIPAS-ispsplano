const fs = require("fs");
let content = fs.readFileSync(
  "src/blocos/bloco5_sistema/PlanoWorkflowView.tsx",
  "utf8",
);

const oldTransRegex =
  /try \{\s*setIsLoading\(true\);\s*await Promise\.all\(\[\s*\.\.\.toUpdate\.map\(\(act\) => \{\s*const duplicate = \{[\s\S]*?firestoreService\.matrixActivities\.add\(duplicate\);\s*\}\),\s*\.\.\.toUpdate\.map\(\(act\) =>\s*firestoreService\.matrixActivities\.update\(act\.id, \{ submetido: true \}\),\s*\),/;

const newTrans = `try {
      setIsLoading(true);
      await Promise.all([
        ...toUpdate.map((act) =>
          firestoreService.matrixActivities.update(act.id, { status: toStatus, submetido: false })
        ),`;

if (oldTransRegex.test(content)) {
  content = content.replace(oldTransRegex, newTrans);
  fs.writeFileSync("src/blocos/bloco5_sistema/PlanoWorkflowView.tsx", content);
  console.log("Patched successfully!");
} else {
  console.log("Regex did not match.");
}
