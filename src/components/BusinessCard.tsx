import React from "react";
import { 
  Building2, GraduationCap, HeartPulse, Utensils, Landmark, 
  Cpu, Phone, MapPin, Mail, Globe, CheckCircle, Sparkles, Star, Award, ShieldCheck 
} from "lucide-react";
import { Business } from "../types";

interface BusinessCardProps {
  business: Business;
  onDraftEmail: (business: Business) => void;
  onViewMap: (business: Business) => void;
  onDial: (business: Business) => void;
}

export const BusinessCard: React.FC<BusinessCardProps> = ({ 
  business, 
  onDraftEmail, 
  onViewMap, 
  onDial 
}) => {
  // Get Category Icon Helper
  const getCategoryIcon = (category: string) => {
    const sizeCls = "w-5 h-5 shrink-0";
    const catLower = category.toLowerCase();
    
    if (catLower.includes("school") || catLower.includes("universit") || catLower.includes("education")) {
      return <GraduationCap className={`${sizeCls} text-amber-500`} />;
    }
    if (catLower.includes("hospital") || catLower.includes("clinic") || catLower.includes("medical")) {
      return <HeartPulse className={`${sizeCls} text-red-500`} />;
    }
    if (catLower.includes("food") || catLower.includes("restaurant") || catLower.includes("bakery")) {
      return <Utensils className={`${sizeCls} text-orange-500`} />;
    }
    if (catLower.includes("banking") || catLower.includes("takaful") || catLower.includes("insurance") || catLower.includes("fintech")) {
      return <Landmark className={`${sizeCls} text-emerald-500`} />;
    }
    if (catLower.includes("it & tech") || catLower.includes("technology")) {
      return <Cpu className={`${sizeCls} text-blue-500`} />;
    }
    return <Building2 className={`${sizeCls} text-gray-500`} />;
  };

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-gray-200 hover:shadow-xl hover:border-amber-400/50 transition-all duration-300 overflow-hidden flex flex-col h-full group relative">
      
      {/* Premier Listed Banner */}
      {business.symbol && (
        <div className="bg-gradient-to-r from-amber-500 to-amber-400 text-amber-950 text-[9px] font-black uppercase tracking-widest px-4 py-1.5 flex items-center justify-between">
          <span className="font-mono">PSX listed stock: {business.symbol}</span>
          <span className="flex items-center gap-0.5">
            <ShieldCheck className="w-3.5 h-3.5" /> Premier Index
          </span>
        </div>
      )}

      {/* Main details body */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4 font-sans">
        <div>
          {/* Header area */}
          <div className="flex justify-between items-start gap-2 mb-2">
            <div className="flex items-start gap-2.5 min-w-0">
              <div className="mt-0.5 p-1 bg-gray-50 rounded-lg group-hover:bg-amber-50 transition-colors shrink-0">
                {getCategoryIcon(business.category)}
              </div>
              <h3 className="text-sm sm:text-base font-bold text-gray-950 line-clamp-2 group-hover:text-amber-600 transition-colors pr-1 leading-snug">
                {business.name}
              </h3>
            </div>

            {/* SECP Tag */}
            <div className="flex flex-col items-end shrink-0 gap-1 text-right">
              <span className="flex items-center text-[9px] font-black tracking-wide text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                <CheckCircle className="w-2.5 h-2.5 mr-0.5" /> SECP Reg
              </span>
              <span className="text-[8px] font-bold text-gray-400 font-mono">
                ID: {business.secp}
              </span>
            </div>
          </div>

          <span className="inline-block px-2.5 py-1 text-[10px] font-bold text-amber-950 bg-amber-100/60 rounded-md whitespace-nowrap mb-1">
            {business.category}
          </span>
        </div>

        {/* Directory Metrics */}
        <div className="space-y-2.5 text-xs text-gray-600 font-medium pt-1">
          <div className="flex items-start gap-2.5">
            <MapPin className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
            <span className="line-clamp-2 leading-relaxed text-xs">
              {business.address}, <span className="font-bold text-gray-800">{business.city}</span>, {business.province}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <Phone className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="font-bold tracking-wide text-gray-800 text-xs">{business.phone}</span>
          </div>

          <div className="flex items-center gap-2 justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <Mail className="w-4 h-4 text-amber-500 shrink-0" />
              <a 
                href={`mailto:${business.email}`} 
                className="text-gray-600 hover:text-amber-600 hover:underline truncate transition-colors font-mono text-[11px]"
              >
                {business.email}
              </a>
            </div>

            <button
              onClick={() => onDraftEmail(business)}
              className="text-[10px] bg-amber-50 hover:bg-amber-400 text-amber-950 px-2 py-1 rounded border border-amber-200/50 font-bold shrink-0 shadow-xs flex items-center gap-0.5 transition-colors cursor-pointer"
              title="Create a template email using AI"
            >
              <Sparkles className="w-2.5 h-2.5 text-amber-600" />
              <span>AI Draft</span>
            </button>
          </div>

          {business.website && (
            <div className="flex items-center gap-2.5">
              <Globe className="w-4 h-4 text-amber-500 shrink-0" />
              <a 
                href={`https://${business.website}`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-blue-600 hover:underline truncate transition-colors text-[11px]"
              >
                {business.website}
              </a>
            </div>
          )}
        </div>

        {/* Dynamic Engagement Indexes */}
        <div className="pt-2.5 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-400 font-bold">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-sky-700 bg-sky-50 border border-sky-200 px-1.5 py-0.5 rounded-sm font-black text-[8px] uppercase tracking-wide shrink-0">
              LinkedIn
            </span>
            <span className="truncate">{business.employeeCount}+ Employees</span>
          </div>

          <div className="flex items-center gap-1 text-gray-600 shrink-0">
            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
            <span className="font-extrabold text-gray-900">{business.rating}</span>
            <span className="text-gray-400 font-normal">({business.reviewsCount})</span>
          </div>
        </div>
      </div>

      {/* Quick Interactive Actions footer panel */}
      <div className="bg-gray-50 px-5 py-3 border-t border-gray-100 flex justify-between items-center group-hover:bg-amber-100/10 transition-colors">
        <button
          onClick={() => onViewMap(business)}
          className="text-xs font-bold text-gray-700 hover:text-amber-700 flex items-center gap-1 bg-white border border-gray-200 px-3 py-1.5 rounded-lg shadow-2xs hover:border-amber-300 transition-all cursor-pointer font-sans"
        >
          <MapPin className="w-3.5 h-3.5 text-amber-500" />
          <span>Map View</span>
        </button>

        <button
          onClick={() => onDial(business)}
          className="text-xs font-bold text-gray-900 hover:bg-amber-400 bg-white border border-gray-200 px-3 py-1.5 rounded-lg transition-all shadow-2xs flex items-center gap-1 hover:border-amber-400 cursor-pointer font-sans"
        >
          <Phone className="w-3.5 h-3.5 text-amber-500" />
          <span>Dial Direct</span>
        </button>
      </div>
    </div>
  );
};
