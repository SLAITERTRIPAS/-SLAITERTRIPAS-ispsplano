const fs = require('fs');
let code = fs.readFileSync('src/components/ViewRenderer.tsx', 'utf8');

const target = `    case "sector_selection":
      return (
        <SectorSelectionView
          user={extendedUser}
          sectors={extendedUser?.setoresAtribuidos || []}
          onSelectSector={(sector) => {
            if (onSelectSector) {
              onSelectSector(sector);
            } else if (onSetView) {
              if (setDashboardTitle) setDashboardTitle(sector);
              onSetView("dashboard");
            }
          }}
          onBack={goBack}
        />
      );`;

code = code.replace(target, '');
fs.writeFileSync('src/components/ViewRenderer.tsx', code);
console.log("Fixed ViewRenderer duplicate case");
