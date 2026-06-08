import React, { useState } from "react";
import { X, Phone, Copy, Check } from "lucide-react";
import { Business } from "../types";

interface DialerModalProps {
  business: Business | null;
  isOpen: boolean;
  onClose: () => void;
}

export const DialerModal: React.FC<DialerModalProps> = ({ business, isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !business) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(business.phone);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col border border-gray-100 animate-slide-up">
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-950 to-gray-800 p-5 flex justify-between items-center text-white">
          <div className="flex items-center gap-2">
            <Phone className="w-5 h-5 text-amber-400" />
            <span className="font-bold text-lg font-sans">Contact Dialer</span>
          </div>
          <button 
            onClick={onClose} 
            className="hover:bg-white/10 p-1.5 rounded-full transition-colors"
            aria-label="Close Dialer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 text-center">
          <div className="mx-auto w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mb-4 border border-amber-100">
            <Phone className="w-8 h-8 text-amber-600" />
          </div>
          <h4 className="font-extrabold text-gray-950 text-base mb-1">{business.name}</h4>
          <p className="text-xs text-gray-500 mb-6 font-medium">
            {business.category} • {business.city}
          </p>

          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6 flex items-center justify-between font-mono text-gray-800 text-lg font-bold">
            <span>{business.phone}</span>
            <button
              onClick={handleCopy}
              className="text-xs flex items-center gap-1.5 text-amber-700 hover:text-amber-800 bg-white border border-gray-200 px-3 py-1.5 rounded-lg shadow-2xs hover:shadow-xs transition-all"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied" : "Copy"}</span>
            </button>
          </div>

          <div className="space-y-3">
            <a
              href={`tel:${business.phone}`}
              className="w-full bg-amber-400 hover:bg-amber-500 text-gray-900 font-extrabold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-2xs text-sm cursor-pointer"
            >
              <Phone className="w-4 h-4" />
              <span>Trigger Call Now</span>
            </a>
            <button
              onClick={onClose}
              className="w-full bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 font-bold py-2.5 px-4 rounded-xl transition-colors text-xs"
            >
              Cancel
            </button>
          </div>
        </div>

        {/* Note tag */}
        <div className="bg-gray-100 px-6 py-3.5 border-t border-gray-200 text-center text-[10px] text-gray-400 font-bold uppercase tracking-wider">
          Note: Direct dial triggers standard local telecom networks on your device.
        </div>
      </div>
    </div>
  );
};
