import React from "react";

export default function Footer({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-col items-center py-1.5 ${className}`}>
      <div
        className="w-full text-center text-[11px] text-white font-bold tracking-wider"
        style={{
          textShadow:
            "1px 1px 0 #000, 2px 2px 0 #000, 3px 3px 0 #000, 4px 4px 4px rgba(0,0,0,0.5)",
        }}
      >
        Desenvolvido por fttripas - 2025-2026 | @todos os direitos reservados
      </div>
    </div>
  );
}
