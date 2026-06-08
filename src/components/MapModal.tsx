import React from "react";
import { X, MapPin, ExternalLink } from "lucide-react";
import { Business } from "../types";

interface MapModalProps {
  business: Business | null;
  isOpen: boolean;
  onClose: () => void;
}

export const MapModal: React.FC<MapModalProps> = ({ business, isOpen, onClose }) => {
  if (!isOpen || !business) return null;

  const searchQuery = encodeURIComponent(`${business.name}, ${business.address}, ${business.city}, Pakistan`);
  const iframeSrc = `https://maps.google.com/maps?q=${searchQuery}&t=&z=14&ie=UTF8&iwloc=&output=embed`;

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col border border-gray-100 animate-slide-up">
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-950 to-gray-800 p-5 flex justify-between items-center text-white">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-amber-400" />
            <span className="font-bold text-lg font-sans">Business Location Map</span>
          </div>
          <button 
            onClick={onClose} 
            className="hover:bg-white/10 p-1.5 rounded-full transition-colors"
            aria-label="Close Map"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 flex flex-col gap-4">
          <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100/60">
            <h4 className="font-extrabold text-gray-950 text-base">{business.name}</h4>
            <p className="text-xs text-gray-600 mt-1 flex items-start gap-1">
              <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
              <span>
                {business.address}, <span className="font-semibold text-gray-800">{business.city}</span>, {business.province}
              </span>
            </p>
          </div>

          <div className="w-full h-[360px] bg-gray-150 rounded-xl overflow-hidden border border-gray-200 shadow-inner relative">
            <iframe
              title={`Maps overview location for ${business.name}`}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              allowFullScreen
              src={iframeSrc}
            />
          </div>
        </div>

        {/* Footer actions */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex justify-between items-center">
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${searchQuery}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-amber-600 hover:text-amber-700 font-bold flex items-center gap-1 hover:underline transition-colors"
          >
            <span>Open in Google Maps App</span>
            <ExternalLink className="w-3 h-3" />
          </a>
          <button
            onClick={onClose}
            className="bg-gray-950 hover:bg-gray-800 text-white text-xs font-bold px-5 py-2.5 rounded-lg transition-colors shadow-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
