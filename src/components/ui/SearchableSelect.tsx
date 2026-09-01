import React, { useState, useRef, useEffect } from "react";
import { Search, ChevronDown, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface SearchableSelectProps {
  options: (string | { value: string; label: string })[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Selecionar...",
  className = "",
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const normalizedOptions = options.map((opt) => {
    if (typeof opt === "string") return { value: opt, label: opt };
    return opt;
  });

  const filteredOptions = normalizedOptions.filter(
    (option) =>
      String(option.label || "").toLowerCase().includes(String(searchTerm || "").toLowerCase()) ||
      String(option.value || "").toLowerCase().includes(String(searchTerm || "").toLowerCase()) ||
      String((option as any).detail || "").toLowerCase().includes(String(searchTerm || "").toLowerCase()),
  );

  const selectedOption = normalizedOptions.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between border-b border-black py-1 cursor-pointer group"
      >
        <span className={`truncate ${!value ? "text-gray-400" : "text-black"}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <div className="flex items-center gap-1">
          {value && (
            <X
              size={14}
              className="text-gray-400 hover:text-red-500 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
              }}
            />
          )}
          <ChevronDown
            size={14}
            className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          />
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 left-0 right-0 mt-1 bg-white border border-black shadow-xl max-h-60 overflow-hidden flex flex-col"
          >
            <div className="p-2 border-b border-gray-100 flex items-center gap-2 bg-gray-50">
              <Search size={14} className="text-gray-400" />
              <input
                autoFocus
                type="text"
                className="w-full bg-transparent outline-none text-xs"
                placeholder="Pesquisar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <div className="overflow-y-auto flex-grow">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                      setSearchTerm("");
                    }}
                    className={`px-3 py-2 text-xs hover:bg-blue-50 cursor-pointer transition-colors ${value === option.value ? "bg-blue-100 font-bold" : ""}`}
                  >
                    <div className="flex flex-col">
                      <span>{option.label}</span>
                      {(option as any).detail && (
                        <span className="text-[10px] text-gray-500 font-normal">
                          {(option as any).detail}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-3 py-4 text-xs text-gray-400 text-center">
                  Nenhum resultado encontrado
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
