import React, { useState, useEffect } from "react";
import { X, Sparkles, Copy, Check, Loader2 } from "lucide-react";
import { Business } from "../types";

interface EmailDraftModalProps {
  business: Business | null;
  isOpen: boolean;
  onClose: () => void;
}

export const EmailDraftModal: React.FC<EmailDraftModalProps> = ({ business, isOpen, onClose }) => {
  const [topic, setTopic] = useState("");
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTopic("");
      setDraft("");
      setErrorMsg("");
      setCopied(false);
    }
  }, [isOpen]);

  const handleGenerate = async () => {
    if (!topic.trim() || !business) return;
    setLoading(true);
    setErrorMsg("");
    setDraft("");

    try {
      const res = await fetch("/api/draft-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          businessName: business.name,
          category: business.category,
          city: business.city,
          secp: business.secp,
          topic: topic,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to generate draft.");
      }

      setDraft(data.draft);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Unable to draft email. Please verify configuration or try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(draft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen || !business) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border border-gray-100 animate-slide-up">
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-950 to-gray-800 p-5 flex justify-between items-center text-white">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
            <span className="font-bold text-lg font-sans">AI Smart Email Drafter</span>
          </div>
          <button 
            onClick={onClose} 
            className="hover:bg-white/10 p-1.5 rounded-full transition-colors"
            aria-label="Close Email Drafter"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto space-y-4">
          <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100/60">
            <label className="block text-[10px] font-black uppercase text-gray-400 mb-1 tracking-wider">
              Send Draft Request to:
            </label>
            <div className="font-bold text-base sm:text-lg text-gray-950 flex flex-wrap items-center gap-2">
              <span>{business.name}</span>
              <span className="text-xs font-bold text-amber-800 bg-amber-100/50 px-2.5 py-0.5 rounded-full border border-amber-200/50">
                {business.email}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Describe your inquiry or message purpose:
            </label>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., Inquiring about university admission cycles, requesting emergency OPD timings, submitting cotton trading quotes..."
              className="w-full border border-gray-300 rounded-xl p-4 focus:ring-2 focus:ring-amber-400 focus:border-amber-400 text-sm min-h-[100px] outline-none transition-all font-sans"
            />
            
            {errorMsg && (
              <p className="text-xs text-red-500 font-semibold">{errorMsg}</p>
            )}

            <div className="flex justify-end">
              <button
                onClick={handleGenerate}
                disabled={loading || !topic.trim()}
                className="bg-amber-400 text-gray-950 px-5 py-2.5 rounded-xl font-bold hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all shadow-xs text-sm cursor-pointer"
              >
                {loading ? <Loader2 className="w-4.5 h-4.5 animate-spin" /> : <Sparkles className="w-4.5 h-4.5" />}
                <span>{loading ? "AI Drafting..." : "Generate Professional Draft ✨"}</span>
              </button>
            </div>
          </div>

          {draft && (
            <div className="animate-fade-in border-t border-gray-100 pt-4 space-y-2">
              <div className="flex justify-between items-center">
                <label className="block text-sm font-semibold text-gray-700">AI Generated Draft:</label>
                <button
                  onClick={handleCopy}
                  className="text-xs flex items-center gap-1.5 text-gray-700 hover:text-amber-800 font-bold transition-all bg-gray-50 px-3 py-2 rounded-lg border border-gray-200 shadow-xs"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "Copied!" : "Copy Email"}</span>
                </button>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-xs font-mono whitespace-pre-wrap text-gray-800 max-h-[250px] overflow-y-auto shadow-inner leading-relaxed">
                {draft}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
