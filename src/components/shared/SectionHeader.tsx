import React from "react";
import { LucideIcon } from "lucide-react";

interface SectionHeaderProps {
  title: string;
  description: string;
  icon: LucideIcon;
  iconBgColor?: string;
  iconColor?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  description,
  icon: Icon,
  iconBgColor = "bg-blue-100",
  iconColor = "text-blue-700",
}) => {
  return (
    <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
      <div className={`${iconBgColor} ${iconColor} p-2 rounded-lg`}>
        <Icon size={20} />
      </div>
      <div>
        <h3 className="text-xl font-black text-slate-900 tracking-tight">
          {title}
        </h3>
        <p className="text-sm text-slate-500">{description}</p>
      </div>
    </div>
  );
};
