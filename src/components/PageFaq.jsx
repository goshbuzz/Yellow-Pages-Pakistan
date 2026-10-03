import { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';
export { makeFaqSchema } from '../lib/seo.js';

export default function PageFaq({ title = 'Frequently Asked Questions', subtitle, faqs = [], className = '' }) {
  const [openIndex, setOpenIndex] = useState(0);

  if (!faqs || faqs.length === 0) return null;

  return (
    <section className={`rounded-3xl bg-white border border-stone-200/90 p-5 md:p-8 shadow-card ${className}`} aria-label={title}>
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-2xl bg-brand/20 text-brand-deeper flex items-center justify-center shrink-0">
          <HelpCircle size={22} className="text-amber-700" />
        </div>
        <div>
          <h2 className="text-xl md:text-2xl font-black text-ink">{title}</h2>
          {subtitle && <p className="text-stone-500 text-sm font-semibold mt-0.5">{subtitle}</p>}
        </div>
      </div>

      <div className="divide-y divide-stone-100">
        {faqs.map((item, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div key={idx} className="py-3.5">
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? -1 : idx)}
                className="w-full text-left flex items-center justify-between gap-4 font-bold text-[15px] md:text-[16px] text-ink hover:text-amber-700 transition-colors focus:outline-none"
                aria-expanded={isOpen}
              >
                <span>{item.q}</span>
                <ChevronDown
                  size={18}
                  className={`text-stone-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-amber-600' : ''}`}
                />
              </button>
              {isOpen && (
                <div className="mt-2 text-stone-600 text-[13.5px] md:text-[14.5px] leading-relaxed pr-6 font-medium animate-slide-up">
                  {item.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
