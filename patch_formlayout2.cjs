const fs = require("fs");
let content = fs.readFileSync("src/components/shared/FormLayout.tsx", "utf8");

content = content.replace(
  /maxWidth\?: string;/,
  "maxWidth?: string;\nhidePrintHeader?: boolean;",
);
content = content.replace(
  /maxWidth = "max-w-4xl"/,
  'maxWidth = "max-w-4xl", hidePrintHeader = false',
);
content = content.replace(
  /<div className="hidden print:flex justify-between items-start mb-10 border-b-2 border-slate-900 pb-6 font-sans">/,
  `{!hidePrintHeader && (<div className="hidden print:flex justify-between items-start mb-10 border-b-2 border-slate-900 pb-6 font-sans">`,
);
content = content.replace(
  /<\/p>\s*<\/div>\s*<\/div>/,
  "</p>\n          </div>\n        </div>)}",
);

fs.writeFileSync("src/components/shared/FormLayout.tsx", content);
