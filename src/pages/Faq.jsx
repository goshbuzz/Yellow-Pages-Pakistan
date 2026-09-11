// FAQ — in-app answers (mirrors the crawlable FAQPage schema in index.html).

import { Link } from 'react-router-dom';
import { ChevronRight, MessageCircle } from 'lucide-react';

const FAQS = [
  ['What is Yellow Pages Pakistan?', 'A free business directory of Pakistan with 200,000+ listings across 420 cities and 130 categories. Search any business to get its phone number, WhatsApp, website and Google Maps location — instantly.'],
  ['How many businesses are listed?', 'Over 200,000, covering every Pakistani city and district headquarters — Karachi, Lahore, Islamabad, Faisalabad, Peshawar, Quetta and 415 more towns across all provinces, Azad Kashmir and Gilgit-Baltistan.'],
  ['Is it free to search?', 'Completely free — no signup, no ads on profiles, no limits. Install the app and it even works offline.'],
  ['How do I find a business phone number?', 'Type the business name, category or city into search, then tap Call on any listing. Mobile (03xx) and landline numbers are listed, plus WhatsApp where available.'],
  ['How do I list my business for free?', `Open "List your business", submit your name, category, city and phone number — it takes about 2 minutes. Our team verifies within 48 hours, then your profile goes live with a verified badge, call/WhatsApp buttons and a map pin. Free forever.`],
  ['What is the Lead Workspace?', 'A built-in outreach tool for freelancers and marketing agencies: save businesses into lead lists, track New → Contacted → Replied → Won, export contacts to CSV for your CRM, and auto-draft personalized pitch emails or WhatsApp messages for each business.'],
  ['Does the app work offline?', 'Yes. After your first visit, all 200,000 listings are cached on your device — search, calls and lead lists keep working with no internet.'],
  ['Is there an Android or iPhone app?', 'Yes — tap "Install app" and add it to your home screen in about 5 seconds. No app store needed, and updates are automatic.'],
  ['Which cities are covered?', 'All 420 cities and towns: Karachi, Lahore, Faisalabad, Rawalpindi, Gujranwala, Multan, Hyderabad, Peshawar, Quetta, Sargodha, Sialkot, Bahawalpur, Sukkur — plus every district HQ from Gwadar and Ziarat to Skardu and Mirpur.'],
  ['How accurate are the listings?', 'Flagship companies (banks, hospitals, universities, major brands) are manually verified with real contact details. For other listings we show the freshest data available, and business owners can correct their own profiles any time via a free listing.'],
  ['Can I export business contacts?', 'Leads you save to your lists can be exported to CSV — that\'s the point of the Lead Workspace. Bulk scraping of the directory is not permitted.'],
  ['How is this different from other Pakistani directories?', 'More listings than anyone (200,000+ vs 155k at the largest competitor), a real installable offline app, free listings forever — and the only directory with built-in outreach tools for freelancers and agencies.'],
];

export default function Faq() {
  return (
    <div className="animate-slide-up pb-4">
      <h1 className="font-black text-2xl text-ink">FAQ — help centre 💬</h1>
      <p className="text-[13px] font-semibold text-stone-500 mt-0.5 mb-4">Everything about finding & listing Pakistani businesses.</p>

      <div className="space-y-2.5">
        {FAQS.map(([q, a], i) => (
          <details key={q} open={i === 0} className="group bg-white/90 rounded-2xl border border-stone-200/80 shadow-card overflow-hidden">
            <summary className="tap flex items-center justify-between gap-2 px-4 py-3.5 cursor-pointer list-none">
              <span className="font-extrabold text-ink text-[14px] leading-snug">{q}</span>
              <ChevronRight size={16} className="text-brand-deeper shrink-0 transition-transform group-open:rotate-90" />
            </summary>
            <p className="px-4 pb-4 text-[13px] font-semibold text-stone-600 leading-relaxed">{a}</p>
          </details>
        ))}
      </div>

      <div className="mt-5 rounded-[24px] bg-ink text-cream p-5 flex items-center gap-4 shadow-pop">
        <MessageCircle size={26} className="text-brand shrink-0" />
        <div className="flex-1">
          <p className="font-black text-[15px]">Own a business?</p>
          <p className="text-[12px] font-semibold text-stone-300 mt-0.5">Get listed free — verified in 48 hours.</p>
        </div>
        <Link to="/add" className="tap bg-brand text-ink font-black text-[12.5px] rounded-2xl px-4 py-2.5">List now</Link>
      </div>
    </div>
  );
}
