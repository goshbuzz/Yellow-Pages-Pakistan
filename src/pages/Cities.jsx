import { Link } from 'react-router-dom';
import SeoHead from '../components/SeoHead';
import { buildCitiesHub } from '../lib/landing.js';

const data = buildCitiesHub();

export default function Cities() {
  return (
    <div className="animate-slide-up pb-8 space-y-5">
      <SeoHead title={data.title} description={data.description} canonicalPath={data.path} schema={data.schema} />
      <div>
        <h1 className="font-black text-2xl text-ink">{data.h1}</h1>
        <p className="text-[13px] font-semibold text-stone-500 mt-0.5">{data.intro[0]}</p>
      </div>
      {data.linkGroups.map((g) => (
        <section key={g.heading}>
          <h2 className="font-black text-ink text-[16px] mb-2">{g.heading}</h2>
          <ul className="flex flex-wrap gap-2">
            {g.links.map((l) => (
              <li key={l.href}>
                <Link to={l.href} className="inline-block bg-white border border-stone-200 rounded-full px-3 py-1.5 text-[12.5px] font-bold text-ink hover:border-amber-400">{l.text}</Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
