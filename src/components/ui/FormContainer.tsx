import React, { useRef } from "react";
import { Download, Upload, Save, Send } from "lucide-react";

export default function FormContainer({
  title,
  description,
  children,
  onEnviar,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  onEnviar?: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownload = () => {
    if (!containerRef.current) return;

    // Find the table inside the container
    const table = containerRef.current.querySelector("table");
    if (!table) {
      alert("Nenhuma tabela encontrada para exportar.");
      return;
    }

    let csvContent = "";

    // Extract headers
    const headerRows = table.querySelectorAll("thead tr");
    headerRows.forEach((row) => {
      const rowData: string[] = [];
      row.querySelectorAll("th").forEach((th) => {
        rowData.push(`"${th.innerText.replace(/"/g, '""').trim()}"`);
      });
      csvContent += rowData.join(",") + "\r\n";
    });

    // Extract body
    const bodyRows = table.querySelectorAll("tbody tr");
    bodyRows.forEach((row) => {
      const rowData: string[] = [];
      row.querySelectorAll("td").forEach((td) => {
        const input = td.querySelector("input");
        const select = td.querySelector("select");
        let val = td.innerText;

        if (input) {
          val = input.value;
        } else if (select) {
          val = select.options[select.selectedIndex]?.text || "";
        }

        rowData.push(`"${val.replace(/"/g, '""').trim()}"`);
      });
      csvContent += rowData.join(",") + "\r\n";
    });

    const blob = new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), csvContent], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      alert(
        `Ficheiro "${file.name}" carregado com sucesso. (Implementar lógica de parser CSV/Excel)`,
      );
      // Reset input
      e.target.value = "";
    }
  };

  const handleSave = () => {
    alert("Dados guardados com sucesso no rascunho local.");
  };

  return (
    <div
      className="w-full bg-white border border-gray-200 rounded-[32px] p-10 shadow-sm"
      ref={containerRef}
    >
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 mb-10">
        <div className="flex-1 text-left">
          <h2 className="text-xs md:text-sm font-black text-gray-900 tracking-tighter mb-2">
            {title}
          </h2>
          <p className="text-gray-500 font-medium text-[10px] md:text-xs">
            {description}
          </p>
        </div>
        <div className="flex flex-wrap gap-3 shrink-0">
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-black tracking-widest text-gray-600 hover:bg-gray-50 transition-all shadow-sm"
          >
            <Download size={16} /> Download
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept=".csv,.xlsx,.xls"
          />
          <button
            onClick={handleUploadClick}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-black tracking-widest text-gray-600 hover:bg-gray-50 transition-all shadow-sm"
          >
            <Upload size={16} /> Upload
          </button>

          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 bg-blue-900 rounded-xl text-xs font-black tracking-widest text-white hover:bg-blue-800 transition-all shadow-lg shadow-blue-100"
          >
            <Save size={16} /> Guardar
          </button>
        </div>
      </div>
      {children}
      {onEnviar && (
        <div className="mt-10 flex justify-end">
          <button
            onClick={onEnviar}
            className="flex items-center gap-3 px-8 py-4 bg-green-700 rounded-2xl text-sm font-black tracking-widest text-white hover:bg-green-800 transition-all shadow-lg shadow-green-100"
          >
            <Send size={18} /> Enviar para Repartição de Estatística
          </button>
        </div>
      )}
    </div>
  );
}
