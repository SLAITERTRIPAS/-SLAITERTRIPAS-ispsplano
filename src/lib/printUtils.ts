/**
 * Utilitário de Impressão de Documentos do SIGEP
 * Permite abrir qualquer documento (Plano de Atividades, Relatório, Balancete, Ficha)
 * ajustando e escolhendo o formato ideal (A4 / A3 em Orientação Vertical ou Horizontal)
 * conforme a ocupação da área com informações.
 */

export interface PrintDocumentOptions {
  title: string;
  subtitle?: string;
  orgao?: string;
  direcao?: string;
  divisao?: string;
  departamento?: string;
  reparticao?: string;
  setor?: string;
  headerHtml?: string;
  contentHtml: string;
  styles?: string;
  orientation?: "portrait" | "landscape" | "auto";
  pageSize?: "A3" | "A4" | "A5" | "letter" | "legal" | "auto";
  printType?: string;
  autoDetectFormat?: boolean;
}

export interface PrintFormatResult {
  pageSize: "A3" | "A4";
  orientation: "portrait" | "landscape";
  reason: string;
  maxCols: number;
}

/**
 * Análise inteligente da ocupação de área e densidade do documento
 * para determinar automaticamente se o formato ideal é A4/A3 e Retrato/Paisagem.
 */
export function detectIdealPrintFormat(options: {
  title?: string;
  subtitle?: string;
  contentHtml: string;
  pageSize?: "A3" | "A4" | "A5" | "letter" | "legal" | "auto";
  orientation?: "portrait" | "landscape" | "auto";
}): PrintFormatResult {
  const {
    title = "",
    subtitle = "",
    contentHtml,
    pageSize = "auto",
    orientation = "auto",
  } = options;

  let maxTableCols = 0;
  const colMatch = contentHtml.match(/<tr[\s\S]*?<\/tr>/gi);
  if (colMatch) {
    colMatch.forEach((rowStr) => {
      const cols = (rowStr.match(/<(td|th)[\s>]/gi) || []).length;
      if (cols > maxTableCols) maxTableCols = cols;
    });
  }

  const hasWideClasses =
    contentHtml.includes("min-w-[1900px]") ||
    contentHtml.includes("min-w-[1500px]") ||
    contentHtml.includes("min-w-[1200px]") ||
    contentHtml.includes("w-[1200px]") ||
    contentHtml.includes("w-[1500px]");

  const titleLower = (title + " " + (subtitle || "")).toLowerCase();
  const contentLength = contentHtml.length;

  let finalPageSize: "A3" | "A4" = "A4";
  let finalOrientation: "portrait" | "landscape" = "portrait";
  let reason = "Análise automática por área de ocupação de informação.";

  // 1. Matrizes muito largas ou tabelas com > 8 colunas -> A3 Paisagem (Horizontal)
  if (
    maxTableCols > 8 ||
    hasWideClasses ||
    (titleLower.includes("plano") && (maxTableCols >= 6 || contentLength > 4000)) ||
    titleLower.includes("matriz") ||
    titleLower.includes("quadro orçamental") ||
    titleLower.includes("mapa geral")
  ) {
    finalPageSize = "A3";
    finalOrientation = "landscape";
    reason = `Documento com matriz extensa (${maxTableCols} colunas). Formato A3 Horizontal selecionado para máxima legibilidade.`;
  }
  // 2. Relatórios de média largura (5 a 8 colunas) ou Balanços/Horários -> A4 Paisagem (Horizontal)
  else if (
    maxTableCols >= 5 ||
    titleLower.includes("balanço") ||
    titleLower.includes("balanco") ||
    titleLower.includes("balancete") ||
    titleLower.includes("horário") ||
    titleLower.includes("horario") ||
    titleLower.includes("exames") ||
    titleLower.includes("mapa de execução")
  ) {
    if (contentLength > 12000) {
      finalPageSize = "A3";
      finalOrientation = "portrait";
      reason = "Extenso volume vertical de dados. Formato A3 Vertical selecionado.";
    } else {
      finalPageSize = "A4";
      finalOrientation = "landscape";
      reason = `Documento com ${maxTableCols || 5} colunas. Formato A4 Horizontal otimiza a área de impressão.`;
    }
  }
  // 3. Documentos muito extensos em texto vertical -> A3 Retrato (Vertical)
  else if (contentLength > 15000 && maxTableCols <= 4) {
    finalPageSize = "A3";
    finalOrientation = "portrait";
    reason = "Documento muito extenso verticalmente. Formato A3 Vertical reduz o número de páginas.";
  }
  // 4. Formulários, Fichas, Despachos, Guias e Documentos Curtos -> A4 Retrato (Vertical)
  else {
    finalPageSize = "A4";
    finalOrientation = "portrait";
    reason = "Documento padrão de 1-4 colunas. Formato A4 Vertical é a opção ideal.";
  }

  // Respeita preferências do utilizador caso não sejam "auto"
  if (pageSize && pageSize !== "auto" && (pageSize === "A3" || pageSize === "A4")) {
    finalPageSize = pageSize;
  }
  if (orientation && orientation !== "auto") {
    finalOrientation = orientation;
  }

  return {
    pageSize: finalPageSize,
    orientation: finalOrientation,
    reason,
    maxCols: maxTableCols,
  };
}

export function openPrintDocumentWindow(options: PrintDocumentOptions) {
  const {
    title,
    subtitle,
    orgao,
    direcao,
    divisao,
    departamento,
    reparticao,
    setor,
    headerHtml,
    contentHtml,
    styles = "",
    orientation = "auto",
    pageSize = "auto",
    printType,
  } = options;

  // Análise de ocupação de área
  const detected = detectIdealPrintFormat({
    title,
    subtitle,
    contentHtml,
    pageSize,
    orientation,
  });

  const resolvedPageSize = detected.pageSize;
  const resolvedOrientation = detected.orientation;

  const printWindow = window.open(
    "",
    "_blank",
    "width=1280,height=920,scrollbars=yes,resizable=yes",
  );

  const hasEmbeddedHeader =
    contentHtml.includes("REPÚBLICA DE MOÇAMBIQUE") ||
    contentHtml.includes("República de Moçambique") ||
    contentHtml.includes("INSTITUTO SUPERIOR POLITÉCNICO") ||
    contentHtml.includes("Instituto Superior Politécnico") ||
    contentHtml.includes("lh3.googleusercontent.com/d/11zvvpOpZARM1yk_irEDpjJ-qBKlTlhad");

  const resolvedOrgao = (() => {
    if (orgao && orgao.trim() && orgao.toUpperCase() !== "UNIDADE ORGÂNICA") {
      const u = orgao;
      if (u.toUpperCase().includes("SERVIÇO") || u.toUpperCase().includes("SERVICO")) return "Serviços Centrais";
      if (u.toUpperCase().includes("DIREÇÃO E GESTÃO") || u.toUpperCase().includes("DIRECAO E GESTAO")) return "Órgão de Direção e Gestão";
      return u;
    }
    if (direcao) {
      const d = direcao.toUpperCase();
      if (d.includes("DICOSAFA") || d.includes("DICOSSER") || d.includes("SERVIÇO")) return "Serviços Centrais";
      if (d.includes("GABINETE") || d.includes("DIRETOR-GERAL") || d.includes("CONSELHO") || d.includes("GDG")) return "Órgão de Direção e Gestão";
      if (d.includes("ENGENHARIA") || d.includes("CIE") || d.includes("CENTRO") || d.includes("INCUBACAO")) return "Unidade Orgânica";
    }
    return orgao || "Unidade Orgânica";
  })();

  const lowestLevelName = [setor, reparticao, departamento, divisao, direcao].filter(Boolean)[0] || resolvedOrgao;
  let resolvedTitle = (title || "Plano de Atividade").trim();
  if (resolvedTitle.toUpperCase() === "PLANO DE ATIVIDADE" || resolvedTitle.toUpperCase() === "PLANO DE ATIVIDADES") {
    resolvedTitle = `Plano de Atividade de ${lowestLevelName}`;
  }

  const defaultHeader =
    headerHtml !== undefined
      ? headerHtml
      : hasEmbeddedHeader
        ? ""
        : `
    <div style="text-align: center; border-bottom: 4px solid #0f172a; padding-bottom: 20px; margin-bottom: 30px; font-family: 'Bookman Old Style', 'Bookman', Georgia, serif; width: 100%;">
      <div style="margin-bottom: 15px; text-align: center; display: flex; justify-content: center; align-items: center; width: 100%;">
        <img src="https://lh3.googleusercontent.com/d/11zvvpOpZARM1yk_irEDpjJ-qBKlTlhad" alt="Logo Songo" style="height: 100px; object-fit: contain; margin: 0 auto; display: block;" />
      </div>
      <h2 style="font-size: 20px; font-weight: 900; margin: 4px 0; color: #0f172a; letter-spacing: -0.5px;">
        Instituto Superior Politécnico de Songo
      </h2>
      <h3 style="font-size: 13px; font-weight: bold; margin: 2px 0; color: #334155; letter-spacing: 1px;">
        Província de Tete
      </h3>
      <h3 style="font-size: 13px; font-weight: bold; margin: 2px 0; color: #334155; letter-spacing: 1px;">
        Distrito de Cahora-Bassa
      </h3>
      
      <div style="margin-top: 12px; border-top: 1px solid #e2e8f0; padding-top: 8px;">
        ${resolvedOrgao ? `<h4 style="font-size: 14px; font-weight: 900; margin: 2px 0; color: #0f172a;">${resolvedOrgao}</h4>` : ""}
        ${direcao ? `<h4 style="font-size: 14px; font-weight: bold; margin: 2px 0; color: #1e3a8a;">${direcao}</h4>` : ""}
        ${divisao ? `<h4 style="font-size: 13px; font-weight: bold; margin: 2px 0; color: #1e3a8a;">${divisao}</h4>` : ""}
        ${departamento ? `<h4 style="font-size: 13px; font-weight: bold; margin: 2px 0; color: #1e3a8a;">${departamento}</h4>` : ""}
        ${reparticao || setor ? `<h4 style="font-size: 13px; font-weight: bold; margin: 2px 0; color: #1e3a8a;">${[reparticao, setor].filter(Boolean).join(" - ")}</h4>` : ""}
      </div>

      <h5 style="font-size: 18px; font-weight: 900; margin: 20px auto 0; color: #0f172a; border-top: 3px solid #0f172a; border-bottom: 3px solid #0f172a; padding: 10px 0; width: 90%;">
        ${resolvedTitle}
      </h5>
      ${subtitle ? `<p style="font-size: 12px; margin: 8px 0 0 0; color: #64748b; font-style: italic;">${subtitle}</p>` : ""}
    </div>
  `;

  const defaultFooter = `
    <div style="margin-top: 32px; padding-top: 6px; border-top: 3px solid #800000; display: flex; justify-content: space-between; align-items: center; font-family: 'Bookman Old Style', 'Bookman', Georgia, serif; font-size: 11px; color: #000;">
      <div style="line-height: 1.3;">
        <div>Songo | Bairro Catondo, Campus Principal de Catondo. Caixa Postal nº 146</div>
        <div>
          Tel: +258 252-82336, Fax: +258 252-82338, email: <a href="mailto:secretariado@ispsongo.ac.mz" style="color: #2563eb; text-decoration: underline;">secretariado@ispsongo.ac.mz</a>. Página oficial: <a href="https://www.ispsongo.ac.mz" target="_blank" style="color: #2563eb; text-decoration: underline;">www.ispsongo.ac.mz</a>
        </div>
      </div>
      <div style="border: 1px solid #800000; padding: 1px; background: #fff; display: flex; align-items: center; justify-content: center; margin-left: 16px; flex-shrink: 0;">
        <img src="https://lh3.googleusercontent.com/d/11zvvpOpZARM1yk_irEDpjJ-qBKlTlhad" alt="Logo Songo" style="height: 28px; width: auto; object-fit: contain;" />
      </div>
    </div>
  `;

  const initialMargin = resolvedOrientation === "landscape" ? "5mm" : "10mm";

  const docHtml = `
    <!DOCTYPE html>
    <html lang="pt">
    <head>
      <meta charset="UTF-8">
      <title>${title} - Songo SIGEP</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <style>
        @import url('https://fonts.cdnfonts.com/css/bookman-old-style');
      </style>
      <style id="dynamic-page-style">
        @page {
          size: ${resolvedPageSize} ${resolvedOrientation};
          margin: ${initialMargin};
        }
      </style>
      <style id="dynamic-zoom-style">
        @media print {
          .a4-container, #print-container {
            zoom: 1.0 !important;
            transform: none !important;
          }
        }
      </style>
      <style>
        @media print {
          html, body {
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
            font-family: 'Bookman Old Style', 'Bookman', Georgia, serif !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print, 
          button, 
          input[type="checkbox"], 
          input[type="radio"], 
          .btn-action, 
          [title*="Editar"], 
          [title*="Eliminar"], 
          [title*="Visualizar"],
          .th-checkbox, 
          .td-checkbox, 
          .th-actions, 
          .td-actions {
            display: none !important;
          }
          .a4-container, #print-container {
            box-shadow: none !important;
            border: none !important;
            width: 100% !important;
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            overflow: visible !important;
            zoom: 1.0 !important;
          }
          div, section, article, table, tbody, thead, tr, td, th, p, span, h1, h2, h3, h4, h5, h6 {
            overflow: visible !important;
            max-height: none !important;
            font-family: 'Bookman Old Style', 'Bookman', Georgia, serif !important;
          }
          thead {
            display: table-header-group !important;
          }
          table {
            page-break-inside: auto;
            width: 100% !important;
            max-width: 100% !important;
            table-layout: auto !important;
            border-collapse: collapse !important;
            margin: 8px 0 !important;
          }
          tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            page-break-after: auto;
          }
          th, td {
            word-break: normal !important;
            overflow-wrap: break-word !important;
            white-space: normal !important;
            font-size: 12px !important;
            padding: 6px 8px !important;
            line-height: 1.35 !important;
            border: 1.5px solid #000000 !important;
            color: #000000 !important;
            vertical-align: middle !important;
          }
          th {
            background-color: #e2e8f0 !important;
            color: #000000 !important;
            font-weight: 900 !important;
            font-size: 12px !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .whitespace-nowrap {
            white-space: normal !important;
          }
          [class*="min-w-"], .min-w-\[1900px\], .min-w-\[1200px\], .min-w-\[1500px\] {
            min-width: 0 !important;
            width: 100% !important;
          }
          .print-page-break {
            page-break-after: always;
            break-after: page;
          }
        }
        body {
          font-family: 'Bookman Old Style', 'Bookman', Georgia, serif;
          background-color: #0f172a;
          margin: 0;
          padding: 16px;
          color: #0f172a;
        }
        .a4-container, #print-container {
          background: white;
          width: 100%;
          max-width: ${resolvedPageSize === "A3" ? (resolvedOrientation === "landscape" ? "420mm" : "297mm") : (resolvedOrientation === "landscape" ? "297mm" : "210mm")};
          min-height: ${resolvedPageSize === "A3" ? (resolvedOrientation === "landscape" ? "297mm" : "420mm") : (resolvedOrientation === "landscape" ? "210mm" : "297mm")};
          margin: 0 auto;
          padding: 10mm;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
          box-sizing: border-box;
          border-radius: 8px;
          transition: all 0.2s ease;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
          margin-top: 10px;
          table-layout: auto;
        }
        th, td {
          border: 1.5px solid #111111;
          padding: 6px 8px;
          text-align: left;
          word-break: normal;
          overflow-wrap: break-word;
          white-space: normal;
          font-size: 12px;
          line-height: 1.35;
          color: #000000;
        }
        th {
          background-color: #e2e8f0;
          font-weight: 800;
          color: #0f172a;
          font-size: 12px;
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .font-bold { font-weight: bold; }
          background-color: #e2e8f0;
          font-weight: 800;
          color: #0f172a;
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .font-bold { font-weight: bold; }

        /* Barra de controlo de formato interativa */
        .btn-format {
          background: #1e293b;
          color: #cbd5e1;
          border: 1px solid #334155;
          padding: 5px 12px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .btn-format:hover {
          background: #334155;
          color: white;
        }
        .btn-format.active {
          background: #2563eb;
          color: white;
          border-color: #3b82f6;
          box-shadow: 0 2px 8px rgba(37,99,235,0.4);
        }
        ${styles}
      </style>
    </head>
    <body>
      <!-- Painel de Controlo da Área de Impressão -->
      <div class="no-print" style="position: sticky; top: 0; background: #090d16; color: white; padding: 14px 20px; border-radius: 14px; z-index: 1000; box-shadow: 0 8px 24px rgba(0,0,0,0.4); margin-bottom: 24px; border: 1px solid #1e293b;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; border-bottom: 1px solid #1e293b; padding-bottom: 10px; margin-bottom: 10px;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <span style="font-size: 22px;">🖨️</span>
            <div>
              <h3 style="margin: 0; font-size: 14px; font-weight: bold; color: white;">${title}</h3>
              <p style="margin: 2px 0 0 0; font-size: 11px; color: #94a3b8;" id="status-text">
                Ajuste Recomendado: <strong style="color: #60a5fa;" id="current-format-label">${resolvedPageSize} ${resolvedOrientation.toUpperCase()}</strong> — ${detected.reason}
              </p>
            </div>
          </div>
          <div style="display: flex; gap: 10px; align-items: center;">
            <button onclick="window.print()" style="background: #2563eb; color: white; border: none; padding: 9px 22px; border-radius: 8px; font-weight: bold; cursor: pointer; display: flex; align-items: center; gap: 8px; font-size: 13px; box-shadow: 0 4px 12px rgba(37,99,235,0.4);">
              🖨️ Imprimir / Salvar PDF
            </button>
            <button onclick="window.close()" style="background: #334155; color: white; border: none; padding: 9px 18px; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 13px;">
              Fechar
            </button>
          </div>
        </div>

        <!-- Opções de Seleção de Formato A4/A3 e Orientação -->
        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px; font-size: 11px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="color: #94a3b8; font-weight: 600;">Formato do Papel:</span>
            <button id="btn-size-a4" onclick="applyFormat('A4', currentOrientation)" class="btn-format ${resolvedPageSize === "A4" ? "active" : ""}">A4 (210 × 297mm)</button>
            <button id="btn-size-a3" onclick="applyFormat('A3', currentOrientation)" class="btn-format ${resolvedPageSize === "A3" ? "active" : ""}">A3 (297 × 420mm)</button>
          </div>

          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="color: #94a3b8; font-weight: 600;">Orientação da Folha:</span>
            <button id="btn-ori-portrait" onclick="applyFormat(currentPageSize, 'portrait')" class="btn-format ${resolvedOrientation === "portrait" ? "active" : ""}"> Vertical / Retrato</button>
            <button id="btn-ori-landscape" onclick="applyFormat(currentPageSize, 'landscape')" class="btn-format ${resolvedOrientation === "landscape" ? "active" : ""}"> Horizontal / Paisagem</button>
          </div>

          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="color: #94a3b8; font-weight: 600;">Escala / Zoom:</span>
            <button id="btn-zoom-auto" onclick="applyZoom('auto')" class="btn-format active">Auto Fit</button>
            <button id="btn-zoom-100" onclick="applyZoom('1.0')" class="btn-format">100%</button>
            <button id="btn-zoom-85" onclick="applyZoom('0.85')" class="btn-format">85%</button>
            <button id="btn-zoom-70" onclick="applyZoom('0.70')" class="btn-format">70%</button>
          </div>
        </div>
      </div>

      <div class="a4-container" id="print-container" ${printType ? `data-print-type="${printType}"` : ""}>
        ${defaultHeader}
        ${contentHtml}
        ${contentHtml.includes("border-t-[3px]") || contentHtml.includes("border-[#800000]") || contentHtml.includes("secretariado@ispsongo.ac.mz") ? "" : defaultFooter}
      </div>

      <script>
        var currentPageSize = '${resolvedPageSize}';
        var currentOrientation = '${resolvedOrientation}';
        var currentZoom = 'auto';

        function applyFormat(size, orientation) {
          currentPageSize = size;
          currentOrientation = orientation;

          var pageMargin = orientation === 'landscape' ? '5mm' : '10mm';
          
          // Atualiza CSS da Impressora
          document.getElementById('dynamic-page-style').innerHTML =
            '@page { size: ' + size + ' ' + orientation + '; margin: ' + pageMargin + '; }';

          // Atualiza Dimensões da Folha na Pré-visualização
          var container = document.getElementById('print-container');
          var maxWidths = {
            'A4-portrait': '210mm',
            'A4-landscape': '297mm',
            'A3-portrait': '297mm',
            'A3-landscape': '420mm'
          };
          var minHeights = {
            'A4-portrait': '297mm',
            'A4-landscape': '210mm',
            'A3-portrait': '420mm',
            'A3-landscape': '297mm'
          };

          var key = size + '-' + orientation;
          if (container) {
            container.style.maxWidth = maxWidths[key] || '210mm';
            container.style.minHeight = minHeights[key] || '297mm';
          }

          // Atualiza botões ativos
          document.querySelectorAll('[id^="btn-size-"]').forEach(function(b) { b.classList.remove('active'); });
          document.querySelectorAll('[id^="btn-ori-"]').forEach(function(b) { b.classList.remove('active'); });
          
          var sizeBtn = document.getElementById('btn-size-' + size.toLowerCase());
          var oriBtn = document.getElementById('btn-ori-' + orientation);
          if (sizeBtn) sizeBtn.classList.add('active');
          if (oriBtn) oriBtn.classList.add('active');

          document.getElementById('current-format-label').innerText = size + ' ' + orientation.toUpperCase();
          applyZoom(currentZoom);
        }

        function applyZoom(zoomVal) {
          currentZoom = zoomVal;
          var zoomScale = zoomVal === 'auto' ? '1.0' : zoomVal;
          
          document.getElementById('dynamic-zoom-style').innerHTML =
            '@media print { .a4-container, #print-container { zoom: ' + zoomScale + ' !important; transform: none !important; } }';

          document.querySelectorAll('[id^="btn-zoom-"]').forEach(function(b) { b.classList.remove('active'); });
          var zBtn = document.getElementById('btn-zoom-' + (zoomVal === '1.0' ? '100' : zoomVal === '0.85' ? '85' : zoomVal === '0.70' ? '70' : '100'));
          if (zBtn) zBtn.classList.add('active');
        }

        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 450);
        };
      </script>
    </body>
    </html>
  `;

  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(docHtml);
    printWindow.document.close();
    printWindow.focus();
  } else {
    window.print();
  }
}

export function sanitizeHtmlForPrinting(rawHtml: string): string {
  if (!rawHtml) return "";
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(`<div>${rawHtml}</div>`, "text/html");

    // Remove elementos de controle de interface, botões, checkboxes e menus
    
    // Limpar estilos de dark mode que atrapalham a impressão de documentos
    const allElements = doc.querySelectorAll('*');
    allElements.forEach(el => {
      let cls = el.getAttribute('class');
      if (cls) {
        // Remover classes de background dark, text-slate-100, etc.
        cls = cls.replace(/bg-slate-[89]00\/?\d*/g, 'bg-white');
        cls = cls.replace(/bg-[#\w]+\/?\d*/g, 'bg-white');
        cls = cls.replace(/text-slate-[123]00/g, 'text-slate-900');
        cls = cls.replace(/text-white/g, 'text-slate-900');
        cls = cls.replace(/border-slate-[789]00\/?\d*/g, 'border-slate-300');
        cls = cls.replace(/bg-transparent/g, 'bg-white');
        el.setAttribute('class', cls);
      }
    });

    const toRemove = doc.querySelectorAll(
      "button, input[type='checkbox'], input[type='radio'], select, .no-print, .print\\:hidden, [title*='Editar'], [title*='Eliminar'], [title*='Visualizar'], [title*='Clique para selecionar']"
    );
    toRemove.forEach((el) => el.remove());

    // Remove colunas e células de checkbox ou de ações
    const thCheckboxes = doc.querySelectorAll("th.w-8, th:first-child input");
    thCheckboxes.forEach((th) => th.closest("th")?.remove());

    const tdCheckboxes = doc.querySelectorAll("td.w-8, td:first-child input");
    tdCheckboxes.forEach((td) => td.closest("td")?.remove());

    // Remove classes fixas de largura excessiva
    const remainingElements = doc.querySelectorAll("*");
    remainingElements.forEach((el) => {
      if (el.className && typeof el.className === "string") {
        el.className = el.className
          .replace(/min-w-\[\d+px\]/g, "w-full")
          .replace(/w-\[\d+px\]/g, "")
          .replace(/whitespace-nowrap/g, "")
          .trim();
      }
    });

    return doc.body.firstElementChild ? doc.body.firstElementChild.innerHTML : rawHtml;
  } catch {
    return rawHtml;
  }
}

export function printElementById(
  elementId: string,
  title: string = "Documento Songo",
  orientation: "portrait" | "landscape" | "auto" = "auto",
  pageSize?: "A3" | "A4" | "A5" | "auto",
) {
  const el = document.getElementById(elementId);
  if (!el) {
    window.print();
    return;
  }

  const cleanContent = sanitizeHtmlForPrinting(el.innerHTML);

  openPrintDocumentWindow({
    title,
    contentHtml: cleanContent,
    orientation,
    pageSize,
    printType: el.getAttribute("data-print-type") || undefined,
  });
}

export interface PrintPlanOptions {
  activities: any[];
  user?: any;
  year: number;
  title?: string;
  subtitle?: string;
  isDPEP?: boolean;
}

export function printActivitiesPlanDocument(options: PrintPlanOptions) {
  const { activities = [], user, year, title, subtitle, isDPEP = false } = options;

  // Formatar números monetários
  const formatMZN = (val: any) =>
    Number(val || 0).toLocaleString("pt-MZ", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  // Agrupar por Direção e Departamento
  const grouped: Record<string, Record<string, any[]>> = {};

  activities.forEach((act) => {
    const dir = act.direcao || act.unidadeOrganica || "DIREÇÃO GERAL";
    const dept = act.departamento || act.setor || act.reparticao || "DEPARTAMENTO GERAL";
    if (!grouped[dir]) grouped[dir] = {};
    if (!grouped[dir][dept]) grouped[dir][dept] = [];
    grouped[dir][dept].push(act);
  });

  let grandTotal = 0;

  // Montar as linhas da tabela
  let tableRowsHtml = "";
  let globalIndex = 1;

  Object.entries(grouped).forEach(([dirName, depts]) => {
    let dirTotal = 0;

    Object.entries(depts).forEach(([deptName, actList]) => {
      actList.forEach((act) => {
        const rubricas =
          Array.isArray(act.rubricas) && act.rubricas.length > 0
            ? act.rubricas
            : [
                {
                  rubrica: act.rubrica || "-",
                  necessidade: act.necessidade || act.especificacoes || act.detalhes || "-",
                  quantidade: act.quantidade || act.numeroPessoas || "-",
                  precoUnitario: act.unitario || act.precoUnitario || 0,
                  valorTotal: act.ajudaCusto || act.valorTotal || 0,
                },
              ];

        const actTotal = rubricas.reduce(
          (sum: number, r: any) =>
            sum + (Number(r.valorTotal) || Number(r.quantidade || 0) * Number(r.precoUnitario || 0) || 0),
          0
        );
        dirTotal += actTotal;
        grandTotal += actTotal;

        const codAct = act.codigoAtividade || act.referencia || act.codigo || "-";
        const nomeAct = act.nomeAtividade || act.designacao || act.title || act.atividade || "-";
        const objAct = act.objetivo || act.objetivoAtividade || "-";
        const orgao = act.orgao || act.unidadeOrganica || (user?.unidadeOrganica) || "Songo";
        const noDir = act.noDirecao || act.no || globalIndex;

        // Meses / Trimestre
        const meses = Array.isArray(act.mesesRealizacao) && act.mesesRealizacao.length > 0
          ? act.mesesRealizacao.join(", ")
          : (act.trimestre || act.mesRealizacao || act.periodo || "-");

        const transporte = act.necessitaTransporte === "Sim" || act.transporte === "Sim" ? "Sim" : "Não";
        const observacoes = act.observacoes || "-";
        const meta = act.meta || act.metas || act.indicador || "-";

        rubricas.forEach((rItem: any, rIdx: number) => {
          const rTotal = Number(rItem.valorTotal) || Number(rItem.quantidade || 0) * Number(rItem.precoUnitario || 0) || 0;
          const isFirstRow = rIdx === 0;
          const rowSpan = rubricas.length;

          tableRowsHtml += `
            <tr style="page-break-inside: avoid; border-bottom: 1px solid #000000; font-size: 12px;">
              ${isFirstRow ? `
                <td rowspan="${rowSpan}" style="text-align: center; font-weight: bold; border: 1.5px solid #000000; padding: 6px 4px; width: 35px;">${globalIndex}</td>
                <td rowspan="${rowSpan}" style="text-align: center; border: 1.5px solid #000000; padding: 6px 4px; width: 45px; font-weight: bold;">${noDir}</td>
                <td rowspan="${rowSpan}" style="border: 1.5px solid #000000; padding: 6px 8px; width: 80px;">${orgao}</td>
                <td rowspan="${rowSpan}" style="border: 1.5px solid #000000; padding: 6px 8px; width: 100px;">${dirName}</td>
                <td rowspan="${rowSpan}" style="border: 1.5px solid #000000; padding: 6px 8px; width: 100px;">${deptName}</td>
                <td rowspan="${rowSpan}" style="text-align: center; font-weight: bold; border: 1.5px solid #000000; padding: 6px 6px; width: 75px;">${codAct}</td>
                <td rowspan="${rowSpan}" style="font-weight: bold; border: 1.5px solid #000000; padding: 6px 8px;">${nomeAct}</td>
                <td rowspan="${rowSpan}" style="border: 1.5px solid #000000; padding: 6px 8px;">${objAct}</td>
                <td rowspan="${rowSpan}" style="text-align: center; border: 1.5px solid #000000; padding: 6px 6px; width: 85px;">${meses}</td>
                <td rowspan="${rowSpan}" style="text-align: center; border: 1.5px solid #000000; padding: 6px 6px; width: 50px;">${meta}</td>
                <td rowspan="${rowSpan}" style="text-align: center; border: 1.5px solid #000000; padding: 6px 4px; width: 45px;">${transporte}</td>
              ` : ""}
              <td style="border: 1.5px solid #000000; padding: 6px 8px; font-weight: 600; width: 130px;">${rItem.rubrica || "-"}</td>
              <td style="border: 1.5px solid #000000; padding: 6px 8px; font-style: italic; width: 140px;">${rItem.necessidade || rItem.especificacao || "-"}</td>
              <td style="text-align: center; border: 1.5px solid #000000; padding: 6px 4px; width: 45px; font-weight: bold;">${rItem.quantidade || "-"}</td>
              <td style="text-align: right; border: 1.5px solid #000000; padding: 6px 8px; width: 85px;">${rItem.precoUnitario ? formatMZN(rItem.precoUnitario) : "-"}</td>
              <td style="text-align: right; font-weight: bold; border: 1.5px solid #000000; padding: 6px 8px; width: 95px; background-color: #f8fafc;">${formatMZN(rTotal)}</td>
              ${isFirstRow ? `
                <td rowspan="${rowSpan}" style="border: 1.5px solid #000000; padding: 6px 8px; width: 90px; color: #334155;">${observacoes}</td>
              ` : ""}
            </tr>
          `;
        });

        globalIndex++;
      });
    });

    // Subtotal da Direção
    tableRowsHtml += `
      <tr style="background-color: #f1f5f9; font-weight: bold; border-top: 2px solid #000000; border-bottom: 2px solid #000000; font-size: 12px;">
        <td colspan="15" style="border: 1.5px solid #000000; padding: 8px 12px;">
          Subtotal Direção: ${dirName}
        </td>
        <td style="text-align: right; border: 1.5px solid #000000; padding: 8px 12px; font-size: 13px; font-weight: 900; background-color: #e2e8f0;">
          ${formatMZN(dirTotal)} MT
        </td>
        <td style="border: 1.5px solid #000000; padding: 8px;"></td>
      </tr>
    `;
  });

  // Linha de TOTAL GERAL
  tableRowsHtml += `
    <tr style="background-color: #0f172a; color: #ffffff; font-weight: 900; border: 2px solid #000000; font-size: 13px;">
      <td colspan="15" style="border: 1.5px solid #000000; padding: 10px 14px; color: #ffffff; letter-spacing: 0.5px;">
        Valor Global Total do Plano de Atividades (${year})
      </td>
      <td style="text-align: right; border: 1.5px solid #000000; padding: 10px 14px; font-size: 14px; font-weight: 900; color: #ffffff; background-color: #1e293b;">
        ${formatMZN(grandTotal)} MT
      </td>
      <td style="border: 1.5px solid #000000; padding: 10px; background-color: #0f172a;"></td>
    </tr>
  `;

  // Construir a tabela completa
  const tableHtml = `
    <div style="width: 100%; margin-top: 15px;">
      <table style="width: 100%; border-collapse: collapse; table-layout: auto; font-family: 'Latin Modern Roman', 'Times New Roman', serif; font-size: 12px; border: 2px solid #000000;">
        <thead>
          <tr style="background-color: #3b82f6; color: #ffffff; font-size: 12px; font-weight: 900; border: 1.5px solid #000000;">
            <th rowspan="2" style="border: 1.5px solid #000000; padding: 6px 4px; text-align: center; width: 35px; color: #000000; background-color: #cbd5e1;">N/O</th>
            <th rowspan="2" style="border: 1.5px solid #000000; padding: 6px 4px; text-align: center; width: 45px; color: #000000; background-color: #cbd5e1;">Nº Dir.</th>
            <th colspan="3" style="border: 1.5px solid #000000; padding: 6px 8px; text-align: center; color: #000000; background-color: #e2e8f0;">I. Identificação</th>
            <th colspan="3" style="border: 1.5px solid #000000; padding: 6px 8px; text-align: center; color: #000000; background-color: #e2e8f0;">II. Atividade</th>
            <th colspan="2" style="border: 1.5px solid #000000; padding: 6px 6px; text-align: center; color: #000000; background-color: #e2e8f0;">V. Tempo</th>
            <th rowspan="2" style="border: 1.5px solid #000000; padding: 6px 4px; text-align: center; width: 45px; color: #000000; background-color: #cbd5e1;">VI. Trans</th>
            <th colspan="5" style="border: 1.5px solid #000000; padding: 6px 8px; text-align: center; color: #000000; background-color: #e2e8f0;">VII. Rubricas e Necessidades</th>
            <th rowspan="2" style="border: 1.5px solid #000000; padding: 6px 8px; text-align: center; width: 90px; color: #000000; background-color: #cbd5e1;">IX. Obs</th>
          </tr>
          <tr style="background-color: #f1f5f9; color: #000000; font-size: 11px; font-weight: 800; border: 1.5px solid #000000;">
            <th style="border: 1.5px solid #000000; padding: 5px 6px; text-align: center; color: #000000; width: 80px;">Órgão</th>
            <th style="border: 1.5px solid #000000; padding: 5px 6px; text-align: center; color: #000000; width: 100px;">Direção</th>
            <th style="border: 1.5px solid #000000; padding: 5px 6px; text-align: center; color: #000000; width: 100px;">Departamento</th>
            <th style="border: 1.5px solid #000000; padding: 5px 6px; text-align: center; color: #000000; width: 75px;">Cód.</th>
            <th style="border: 1.5px solid #000000; padding: 5px 8px; text-align: left; color: #000000;">Designação</th>
            <th style="border: 1.5px solid #000000; padding: 5px 8px; text-align: left; color: #000000;">Objetivo</th>
            <th style="border: 1.5px solid #000000; padding: 5px 6px; text-align: center; color: #000000; width: 85px;">Período</th>
            <th style="border: 1.5px solid #000000; padding: 5px 4px; text-align: center; color: #000000; width: 50px;">Met/Real.</th>
            <th style="border: 1.5px solid #000000; padding: 5px 6px; text-align: left; color: #000000; width: 130px;">Rubrica</th>
            <th style="border: 1.5px solid #000000; padding: 5px 6px; text-align: left; color: #000000; width: 140px;">Necessidade</th>
            <th style="border: 1.5px solid #000000; padding: 5px 4px; text-align: center; color: #000000; width: 45px;">Qtd</th>
            <th style="border: 1.5px solid #000000; padding: 5px 6px; text-align: right; color: #000000; width: 85px;">Preço Unit.</th>
            <th style="border: 1.5px solid #000000; padding: 5px 6px; text-align: right; color: #000000; width: 95px;">Total (MT)</th>
          </tr>
        </thead>
        <tbody>
          ${tableRowsHtml}
        </tbody>
      </table>
    </div>
  `;

  // Resolver título do plano
  const lowestArea = [
    user?.setor,
    user?.reparticao,
    user?.departamento,
    user?.direcao,
    user?.unidadeOrganica,
  ].filter(Boolean)[0] || "INSTITUCIONAL";

  const resolvedTitle = title || `Plano de Atividade de ${lowestArea} - ${year}`;

  openPrintDocumentWindow({
    title: resolvedTitle,
    subtitle: subtitle || `Documento Oficial do Plano Económico e Social e Orçamento da Entidade (PESOE) - ${year}`,
    orgao: user?.unidadeOrganica,
    direcao: user?.direcao,
    departamento: user?.departamento,
    reparticao: user?.reparticao,
    setor: user?.setor,
    contentHtml: tableHtml,
    pageSize: "A3",
    orientation: "landscape",
  });
}

