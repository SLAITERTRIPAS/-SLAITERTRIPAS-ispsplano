const fs = require("fs");
let content = fs.readFileSync("src/components/shared/FormLayout.tsx", "utf8");

const oldBannerRegex =
  /<div className=\{\`\$\{bannerColor\} p-8 text-white flex justify-between items-center relative overflow-hidden\`\}>/;

const newBanner = `<div className="hidden print:flex justify-between items-start mb-10 border-b-2 border-slate-900 pb-6 font-sans">
          <div className="flex items-center gap-4">
            <img 
              src="https://lh3.googleusercontent.com/d/11zvvpOpZARM1yk_irEDpjJ-qBKlTlhad" 
              alt="ISPS Logo" 
              className="h-14 grayscale opacity-90" 
              referrerPolicy="no-referrer" 
            />
            <div className="leading-tight text-left">
              <span className="block text-[10px] uppercase tracking-widest text-slate-500 font-bold">República de Moçambique</span>
              <h1 className="text-lg font-black tracking-tight text-slate-900 uppercase">Instituto Superior Politécnico de Songo</h1>
            </div>
          </div>
          <div className="text-right mt-2">
            <p className="text-sm font-black uppercase border-y-2 border-slate-900 py-2 inline-block px-4 text-[#121c60]">
              {title}
            </p>
          </div>
        </div>

        <div className={\`\${bannerColor} p-8 text-white flex justify-between items-center relative overflow-hidden print:hidden\`}>`;

if (oldBannerRegex.test(content)) {
  content = content.replace(oldBannerRegex, newBanner);
  fs.writeFileSync("src/components/shared/FormLayout.tsx", content);
  console.log("Patched successfully!");
} else {
  console.log("Regex did not match.");
}
