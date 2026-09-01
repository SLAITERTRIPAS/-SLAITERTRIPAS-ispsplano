import React from "react";
import { LucideIcon } from "lucide-react";

interface SubMenuItemButtonProps {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
}

export const SubMenuItemButton: React.FC<SubMenuItemButtonProps> = ({
  label,
  icon: Icon,
  onClick,
}) => {
  return (
    <button
      onClick={onClick}
      className="bg-white p-6 rounded-3xl shadow-sm hover:shadow-xl transition-all flex flex-col items-center text-center gap-4 group cursor-pointer"
    >
      <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
        <Icon size={24} />
      </div>
      <span className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors leading-[1.5]">
        {label}
      </span>
    </button>
  );
};
