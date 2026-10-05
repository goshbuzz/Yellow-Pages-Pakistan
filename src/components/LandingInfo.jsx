import { Link } from 'react-router-dom';
import PageFaq from './PageFaq';

// Crawlable content block shown under the results on category / city pages.
export default function LandingInfo({ data }) {
  return (
    <section className="space-y-5 mt-8" aria-label={data.h1}>
      <nav aria-label="Breadcrumb" className="text-[12px] font-bold text-stone-500">
        {data.crumbs.map((c, i) => (
          <span key={c.path}>
            {i > 0 && ' › '}
            {i < data.crumbs.length - 1 ? <Link to={c.path} className="hover:text-amber-700">{c.name}</Link> : <span>{c.name}</span>}
          </span>
        ))}
      </nav>
      {data.intro.map((p, i) => <p key={i} className="text-[14px] font-medium text-stone-600 leading-relaxed">{p}</p>)}
      {data.linkGroups.map((g) => (
        <div key={g.heading}>
          <h2 className="font-black text-ink text-[16px] mb-2">{g.heading}</h2>
          <ul className="flex flex-wrap gap-2">
            {g.links.map((l) => (
              <li key={l.href}>
                <Link to={l.href} className="inline-block bg-white border border-stone-200 rounded-full px-3 py-1.5 text-[12.5px] font-bold text-ink hover:border-amber-400">{l.text}</Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
      <PageFaq title={`${data.h1} — FAQ`} faqs={data.faqs} />
    </section>
  );
}
