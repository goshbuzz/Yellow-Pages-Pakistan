// Pure Website Home Page — Modern, high-converting portal with direct CTAs to the attached Web App.
// Fully crawlable for Google Search Console, fast first paint, zero worker blocking.

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  ArrowRight,
  Building2,
  MapPin,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  Download,
  Users,
  PhoneCall,
  MessageCircle,
  FileSpreadsheet,
  Wand2,
  Compass,
  Star,
  TrendingUp,
  Layers,
  Check,
  ChevronRight,
  Briefcase,
  Zap,
} from 'lucide-react';
import { CATEGORIES, slug as catSlug } from '../data/categories';
import { CITIES, slugify as citySlug } from '../data/geo';
import { STATS } from '../data/stats.generated';
import { CURATED } from '../data/curated';
import { CountUp } from '../components/ui';
import SeoHead from '../components/SeoHead';
import PageFaq, { makeFaqSchema } from '../components/PageFaq';

const HOME_FAQS = [
  {
    q: 'What is Yellow Pages Pakistan?',
    a: 'Yellow Pages Pakistan is the modern digital business directory and B2B growth engine of Pakistan, listing over 200,000 verified businesses across 420 cities and 130 categories with direct phone numbers, WhatsApp links, and Google Maps pins.',
  },
  {
    q: 'How do I access the interactive Directory Web App?',
    a: 'Click any "Launch Web App" button on this website or navigate to /app. The web app features instant real-time search, offline directory caching, GPS nearby business locator, and an agency lead workspace.',
  },
  {
    q: 'How can business owners list their company for free?',
    a: 'Click "List Your Business Free" or go to /add. Fill in your business name, category, city, phone number, and address. Our verification team reviews submissions within 48 hours to grant your profile a verified badge at zero cost.',
  },
  {
    q: 'What is the Lead Workspace for freelancers and marketing agencies?',
    a: 'The Lead Workspace (/leads) lets sales reps, freelancers, and B2B agencies bookmark prospective companies into organized lists, track outreach pipeline stages (New, Contacted, Replied, Won), draft customized WhatsApp/email pitches, and export full contact lists to CSV.',
  },
  {
    q: 'Which Pakistani cities and industries are covered in the directory?',
    a: 'All 420 cities and towns across Punjab, Sindh, Khyber Pakhtunkhwa, Balochistan, Islamabad Capital Territory, Azad Kashmir, and Gilgit-Baltistan are covered, spanning 130 categories including textiles, software, healthcare, manufacturing, food, and wholesale.',
  },
  {
    q: 'Does Yellow Pages Pakistan charge commission or subscription fees?',
    a: 'No. Yellow Pages Pakistan is 100% free for consumers searching for businesses and 100% free for companies listing their profiles. There are no paywalls, hidden lead fees, or pay-per-call charges.',
  },
];

const POPULAR_CATEGORY_IDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

const TOP_CITIES_PREVIEW = [
  { name: 'Karachi', count: STATS.byCity['Karachi'] || 19028, province: 'Sindh' },
  { name: 'Lahore', count: STATS.byCity['Lahore'] || 14004, province: 'Punjab' },
  { name: 'Faisalabad', count: STATS.byCity['Faisalabad'] || 5509, province: 'Punjab' },
  { name: 'Rawalpindi', count: STATS.byCity['Rawalpindi'] || 4848, province: 'Punjab' },
  { name: 'Islamabad', count: STATS.byCity['Islamabad'] || 4520, province: 'Federal' },
  { name: 'Gujranwala', count: STATS.byCity['Gujranwala'] || 3990, province: 'Punjab' },
  { name: 'Multan', count: STATS.byCity['Multan'] || 3640, province: 'Punjab' },
  { name: 'Peshawar', count: STATS.byCity['Peshawar'] || 3210, province: 'KPK' },
  { name: 'Quetta', count: STATS.byCity['Quetta'] || 2850, province: 'Balochistan' },
  { name: 'Sialkot', count: STATS.byCity['Sialkot'] || 2540, province: 'Punjab' },
  { name: 'Hyderabad', count: STATS.byCity['Hyderabad'] || 2420, province: 'Sindh' },
  { name: 'Sargodha', count: STATS.byCity['Sargodha'] || 1950, province: 'Punjab' },
];

export default function WebsiteHome() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchTerm.trim()) params.set('q', searchTerm.trim());
    if (selectedCity) params.set('city', selectedCity);
    if (selectedCategory) params.set('cat', selectedCategory);
    navigate(`/browse?${params.toString()}`);
  };

  const schema = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Yellow Pages Pakistan',
      url: 'https://yellowpagespakistan.goshbuzz.com/',
      potentialAction: {
        '@type': 'SearchAction',
        target: 'https://yellowpagespakistan.goshbuzz.com/browse?q={search_term_string}',
        'query-input': 'required name=search_term_string',
      },
    },
    makeFaqSchema(HOME_FAQS),
  ];

  return (
    <div className="min-h-screen bg-[#FFFBEF] text-ink antialiased">
      <SeoHead
        title="Yellow Pages Pakistan — Business Directory & B2B Leads"
        description="Search Pakistani businesses across 420 cities and 130 categories. Phone numbers, WhatsApp and map pins, plus a lead workspace for agencies."
        canonicalPath="/"
        schema={schema}
      />

      {/* Website Header */}
      <header className="sticky top-0 z-40 bg-[#FFFBEF]/90 backdrop-blur-md border-b border-stone-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-2xl bg-brand text-ink flex items-center justify-center font-black shadow-card group-hover:scale-105 transition-transform">
              <span className="text-2xl">📖</span>
            </div>
            <div>
              <span className="font-black text-xl tracking-tight text-ink block leading-none">
                Yellow Pages <span className="text-amber-600">PK</span>
              </span>
              <span className="text-[11px] font-bold text-stone-500 uppercase tracking-widest block mt-0.5">
                Pakistan Business Directory
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-[14.5px] font-bold text-stone-700">
            <Link to="/browse" className="hover:text-amber-600 transition-colors">Directory</Link>
            <Link to="/categories" className="hover:text-amber-600 transition-colors">Categories</Link>
            <Link to="/leads" className="hover:text-amber-600 transition-colors flex items-center gap-1.5">
              <span>Lead Workspace</span>
              <span className="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full">B2B</span>
            </Link>
            <Link to="/add" className="hover:text-amber-600 transition-colors">List Your Business</Link>
            <Link to="/faq" className="hover:text-amber-600 transition-colors">Help & FAQ</Link>
          </nav>

          {/* Header Action Button: CTA to Webapp */}
          <div className="flex items-center gap-3">
            <Link
              to="/add"
              className="hidden lg:inline-flex items-center gap-1.5 text-[13px] font-extrabold text-stone-700 hover:text-ink px-3 py-2"
            >
              + Free Listing
            </Link>
            <Link
              to="/app"
              className="inline-flex items-center gap-2 bg-ink hover:bg-stone-800 text-brand font-black text-[14px] rounded-2xl px-5 py-2.5 shadow-pop hover:translate-y-[-1px] transition-all"
            >
              <Zap size={16} className="text-brand animate-pulse" />
              <span>Launch Web App</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28">
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-r from-amber-300/20 via-brand/30 to-amber-200/20 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            {/* Trust Pill */}
            <div className="inline-flex items-center gap-2 bg-amber-100/90 border border-amber-300/70 rounded-full px-4 py-1.5 mb-6 shadow-sm">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-[12.5px] font-extrabold text-amber-900 tracking-wide uppercase">
                Pakistan’s Largest Business Book · 200,000+ Listings
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-ink tracking-tight leading-[1.08]">
              Find, Connect & Pitch to <br />
              <span className="bg-gradient-to-r from-amber-600 via-brand to-amber-700 bg-clip-text text-transparent">
                200,000+ Pakistani Businesses
              </span>
            </h1>

            {/* Subheading */}
            <p className="mt-6 text-lg sm:text-xl text-stone-600 font-medium max-w-3xl mx-auto leading-relaxed">
              Direct phone numbers, WhatsApp, and Google Map locations across 420 cities.
              Whether you are sourcing suppliers, finding local services, or acquiring B2B clients,
              explore Pakistan’s definitive business directory.
            </p>

            {/* Interactive Search Bar Component */}
            <div className="mt-10 max-w-3xl mx-auto">
              <form
                onSubmit={handleSearchSubmit}
                className="bg-white rounded-3xl p-3 md:p-3.5 shadow-pop border border-stone-200/90 flex flex-col md:flex-row items-center gap-2.5 text-left"
              >
                <div className="flex-1 w-full flex items-center gap-2 px-3 py-1.5">
                  <Search size={20} className="text-amber-600 shrink-0" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search textile mills, software houses, restaurants..."
                    className="w-full bg-transparent outline-none font-bold text-[15px] text-ink placeholder:text-stone-400 placeholder:font-medium"
                  />
                </div>

                <div className="hidden sm:flex items-center gap-2 border-t md:border-t-0 md:border-l border-stone-200 w-full md:w-auto px-3 py-1.5">
                  <MapPin size={18} className="text-stone-400 shrink-0" />
                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="bg-transparent outline-none text-[14px] font-bold text-stone-700 cursor-pointer pr-4"
                  >
                    <option value="">All 420 Cities</option>
                    {TOP_CITIES_PREVIEW.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.name} ({c.count.toLocaleString()})
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full md:w-auto bg-ink hover:bg-stone-800 text-brand font-black text-[15px] px-7 py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-card hover:translate-y-[-1px] transition-all"
                >
                  <Search size={16} />
                  <span>Search</span>
                </button>
              </form>

              {/* Trending Searches */}
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-[12.5px]">
                <span className="font-extrabold text-stone-500 flex items-center gap-1">
                  <TrendingUp size={13} /> Trending:
                </span>
                {['Textile Mills Faisalabad', 'Software Houses Lahore', 'Hospitals Karachi', 'Exporters Sialkot', 'Rawalpindi Wholesale'].map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => navigate(`/browse?q=${encodeURIComponent(term)}`)}
                    className="bg-stone-200/60 hover:bg-amber-100 hover:text-amber-900 text-stone-700 font-bold px-3 py-1 rounded-full transition-colors"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>

            {/* Core Action CTAs to Attached Web App */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link
                to="/app"
                className="inline-flex items-center gap-2.5 bg-brand hover:bg-amber-400 text-ink font-black text-[16px] px-8 py-4 rounded-2xl shadow-pop hover:scale-[1.02] transition-transform"
              >
                <Building2 size={20} />
                <span>Launch Directory Web App</span>
                <ArrowRight size={18} />
              </Link>
              <Link
                to="/leads"
                className="inline-flex items-center gap-2 bg-white hover:bg-stone-50 text-ink border border-stone-200/90 font-extrabold text-[15.5px] px-7 py-4 rounded-2xl shadow-card transition-all"
              >
                <Wand2 size={18} className="text-amber-600" />
                <span>Open Lead Workspace</span>
              </Link>
              <Link
                to="/add"
                className="inline-flex items-center gap-2 text-stone-700 hover:text-ink font-bold text-[14.5px] px-4 py-2"
              >
                <span>Free Business Listing</span>
                <ChevronRight size={16} />
              </Link>
            </div>
          </div>

          {/* KPI Strip */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
            <div className="bg-white/95 rounded-2xl p-5 border border-stone-200/80 shadow-card text-center">
              <p className="text-3xl md:text-4xl font-black text-ink">
                <CountUp to={STATS.total} suffix="+" />
              </p>
              <p className="text-xs font-black tracking-wider text-stone-400 mt-1 uppercase">Active Listings</p>
            </div>
            <div className="bg-white/95 rounded-2xl p-5 border border-stone-200/80 shadow-card text-center">
              <p className="text-3xl md:text-4xl font-black text-ink">
                <CountUp to={CITIES.length} />
              </p>
              <p className="text-xs font-black tracking-wider text-stone-400 mt-1 uppercase">Cities Covered</p>
            </div>
            <div className="bg-white/95 rounded-2xl p-5 border border-stone-200/80 shadow-card text-center">
              <p className="text-3xl md:text-4xl font-black text-ink">
                <CountUp to={CATEGORIES.length} />
              </p>
              <p className="text-xs font-black tracking-wider text-stone-400 mt-1 uppercase">Industry Sectors</p>
            </div>
            <div className="bg-white/95 rounded-2xl p-5 border border-stone-200/80 shadow-card text-center">
              <p className="text-3xl md:text-4xl font-black text-emerald-600">100%</p>
              <p className="text-xs font-black tracking-wider text-stone-400 mt-1 uppercase">Free & Verified</p>
            </div>
          </div>
        </div>
      </section>

      {/* Dual Value Proposition Section (Marketplace Pillars) */}
      <section className="py-20 bg-stone-100/70 border-y border-stone-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-ink tracking-tight">
              Engineered for Both Sides of Pakistan&apos;s Economy
            </h2>
            <p className="mt-4 text-stone-600 text-lg font-medium">
              A high-utility platform connecting local businesses with ready buyers, and powering B2B client acquisition for agencies.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1: For Business Owners */}
            <div className="bg-white rounded-3xl p-8 border border-stone-200 shadow-card flex flex-col justify-between relative overflow-hidden group hover:border-amber-400 transition-colors">
              <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-black text-2xl mb-6">
                🏪
              </div>
              <div>
                <h3 className="text-xl font-black text-ink mb-3">For Business Owners</h3>
                <p className="text-stone-600 text-[14.5px] leading-relaxed mb-6 font-medium">
                  Claim your presence on Pakistan’s fastest-growing directory. Receive inbound calls and WhatsApp chats without paying a rupee in commission.
                </p>
                <ul className="space-y-3 text-[14px] font-bold text-stone-700">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                    <span>Free listing forever with 48h verified badge</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                    <span>Direct Call & WhatsApp buttons on your profile</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                    <span>Precise Google Maps pin for foot traffic</span>
                  </li>
                </ul>
              </div>
              <div className="mt-8 pt-6 border-t border-stone-100">
                <Link
                  to="/add"
                  className="w-full inline-flex items-center justify-center gap-2 bg-ink hover:bg-stone-800 text-brand font-black text-[14px] py-3 rounded-xl transition-colors"
                >
                  <span>List Your Business Free</span>
                  <ArrowRight size={15} />
                </Link>
              </div>
            </div>

            {/* Card 2: For Freelancers & Agencies */}
            <div className="bg-ink text-cream rounded-3xl p-8 shadow-pop flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand/10 rounded-full blur-2xl" />
              <div className="w-14 h-14 rounded-2xl bg-brand text-ink flex items-center justify-center font-black text-2xl mb-6">
                🎯
              </div>
              <div>
                <div className="inline-block bg-brand/20 text-brand text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full mb-2">
                  Agency Superpower
                </div>
                <h3 className="text-xl font-black text-cream mb-3">For Freelancers & Agencies</h3>
                <p className="text-stone-300 text-[14.5px] leading-relaxed mb-6 font-medium">
                  Eliminate cold-call chaos. Build client prospect lists, draft tailored outreach messages, and export structured CRM spreadsheets.
                </p>
                <ul className="space-y-3 text-[14px] font-bold text-stone-200">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 size={18} className="text-brand shrink-0" />
                    <span>Lead Workspace with outreach pipeline tracking</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 size={18} className="text-brand shrink-0" />
                    <span>Instant CSV Export for HubSpot & Google Sheets</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 size={18} className="text-brand shrink-0" />
                    <span>AI auto-pitch generator for WhatsApp & Email</span>
                  </li>
                </ul>
              </div>
              <div className="mt-8 pt-6 border-t border-stone-800">
                <Link
                  to="/leads"
                  className="w-full inline-flex items-center justify-center gap-2 bg-brand hover:bg-amber-400 text-ink font-black text-[14px] py-3 rounded-xl transition-colors"
                >
                  <span>Open Lead Workspace</span>
                  <ArrowRight size={15} />
                </Link>
              </div>
            </div>

            {/* Card 3: For Consumers & Sourcing Buyers */}
            <div className="bg-white rounded-3xl p-8 border border-stone-200 shadow-card flex flex-col justify-between relative overflow-hidden group hover:border-amber-400 transition-colors">
              <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-black text-2xl mb-6">
                🔍
              </div>
              <div>
                <h3 className="text-xl font-black text-ink mb-3">For Buyers & Consumers</h3>
                <p className="text-stone-600 text-[14.5px] leading-relaxed mb-6 font-medium">
                  Find trusted suppliers, manufacturers, medical specialists, and artisans anywhere in Pakistan with verified contact details.
                </p>
                <ul className="space-y-3 text-[14px] font-bold text-stone-700">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                    <span>200,000+ verified listings across 420 cities</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                    <span>Zero spam, zero middleman markups</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                    <span>Nearby GPS locator & instant map navigation</span>
                  </li>
                </ul>
              </div>
              <div className="mt-8 pt-6 border-t border-stone-100">
                <Link
                  to="/browse"
                  className="w-full inline-flex items-center justify-center gap-2 bg-stone-100 hover:bg-stone-200 text-ink font-black text-[14px] py-3 rounded-xl transition-colors"
                >
                  <span>Explore All Listings</span>
                  <ArrowRight size={15} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Category Explorer Preview Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div>
              <span className="text-xs font-black uppercase tracking-widest text-amber-600 block mb-1">
                Explore Industry Sectors
              </span>
              <h2 className="text-3xl md:text-4xl font-black text-ink tracking-tight">
                Popular Business Categories 🗂️
              </h2>
            </div>
            <Link
              to="/categories"
              className="mt-4 md:mt-0 inline-flex items-center gap-2 font-black text-amber-700 hover:text-amber-800 text-[15px]"
            >
              <span>View All 130 Categories</span>
              <ChevronRight size={18} />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {POPULAR_CATEGORY_IDS.map((catId) => {
              const cat = CATEGORIES.find((c) => c.id === catId);
              if (!cat) return null;
              const count = STATS.byCat[cat.id] || 0;
              return (
                <Link
                  key={cat.id}
                  to={`/category/${catSlug(cat.name)}`}
                  className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200/80 shadow-card hover:border-amber-400 hover:translate-y-[-2px] transition-all flex items-center gap-3.5 group"
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 group-hover:scale-110 transition-transform"
                    style={{ background: cat.color + '1A' }}
                  >
                    {cat.emoji}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-black text-ink text-[14px] sm:text-[15px] truncate group-hover:text-amber-700 transition-colors">
                      {cat.name}
                    </h3>
                    <p className="text-[12px] font-bold text-stone-400 mt-0.5">
                      {count.toLocaleString()} listings
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="mt-10 text-center">
            <Link
              to="/categories"
              className="inline-flex items-center gap-2 bg-ink hover:bg-stone-800 text-brand font-black text-[14.5px] px-6 py-3.5 rounded-2xl shadow-card"
            >
              <Layers size={17} />
              <span>Browse All 130 Categories in Web App</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Major Cities Directory Showcase */}
      <section className="py-20 bg-stone-100/70 border-y border-stone-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-black uppercase tracking-widest text-amber-600 block mb-1">
              Nationwide Coverage
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-ink tracking-tight">
              Business Directory by City 🗺️
            </h2>
            <p className="mt-3 text-stone-600 text-base font-medium">
              From major industrial metropolises to regional trade hubs, find registered businesses anywhere in Pakistan.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {TOP_CITIES_PREVIEW.map((city) => (
              <Link
                key={city.name}
                to={`/city/${citySlug(city.name)}`}
                className="bg-white p-5 rounded-2xl border border-stone-200 shadow-card hover:border-amber-400 hover:shadow-pop transition-all group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                    <MapPin size={16} />
                  </span>
                  <span className="text-[11px] font-extrabold uppercase px-2 py-0.5 rounded bg-stone-100 text-stone-600">
                    {city.province}
                  </span>
                </div>
                <h3 className="text-lg font-black text-ink group-hover:text-amber-700 transition-colors">
                  {city.name}
                </h3>
                <p className="text-xs font-bold text-stone-400 mt-1">
                  {city.count.toLocaleString()} registered businesses
                </p>
              </Link>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link
              to="/nearby"
              className="inline-flex items-center gap-2 bg-white hover:bg-stone-50 border border-stone-300 text-ink font-black text-[14.5px] px-6 py-3.5 rounded-2xl shadow-card"
            >
              <Compass size={17} className="text-amber-600" />
              <span>Use GPS to Find Businesses Near Me</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Agency & Freelancer Lead Generation Showcase */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-amber-500 via-brand to-amber-600 rounded-[32px] p-8 md:p-14 shadow-pop text-ink relative overflow-hidden">
            <div className="max-w-2xl">
              <span className="inline-block bg-ink text-brand text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full mb-4">
                Freelancer & Agency Growth Engine
              </span>
              <h2 className="text-3xl md:text-5xl font-black text-ink tracking-tight leading-tight">
                Turn Directory Searches into High-Paying Clients 💼
              </h2>
              <p className="mt-5 text-ink/90 text-base md:text-lg font-semibold leading-relaxed">
                Finding company phone numbers is only half the battle. Our built-in Lead Workspace lets you shortlist businesses, generate tailored cold pitch messages, and export clean CSVs directly into your CRM.
              </p>

              <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white/90 rounded-2xl p-4 border border-ink/10 shadow-sm">
                  <div className="flex items-center gap-2.5 font-black text-ink text-[15px]">
                    <FileSpreadsheet size={18} className="text-amber-800" />
                    <span>1-Click CSV Export</span>
                  </div>
                  <p className="text-xs font-bold text-stone-600 mt-1">
                    Download company name, phone, city, and category formatted for HubSpot or Excel.
                  </p>
                </div>

                <div className="bg-white/90 rounded-2xl p-4 border border-ink/10 shadow-sm">
                  <div className="flex items-center gap-2.5 font-black text-ink text-[15px]">
                    <Wand2 size={18} className="text-amber-800" />
                    <span>AI Pitch Generator</span>
                  </div>
                  <p className="text-xs font-bold text-stone-600 mt-1">
                    Auto-compose personalized WhatsApp and email outreach tailored to each listing.
                  </p>
                </div>
              </div>

              <div className="mt-10 flex flex-wrap gap-4">
                <Link
                  to="/leads"
                  className="inline-flex items-center gap-2 bg-ink text-brand font-black text-[15px] px-8 py-4 rounded-2xl shadow-pop hover:bg-stone-800 transition-colors"
                >
                  <Wand2 size={17} />
                  <span>Open Lead Workspace</span>
                  <ArrowRight size={16} />
                </Link>
                <Link
                  to="/browse"
                  className="inline-flex items-center gap-2 bg-white/90 hover:bg-white text-ink font-extrabold text-[15px] px-7 py-4 rounded-2xl shadow-card transition-colors"
                >
                  <Search size={16} />
                  <span>Search Prospective Clients</span>
                </Link>
              </div>
            </div>

            {/* Visual Decorative Element */}
            <div className="hidden lg:block absolute right-12 top-1/2 -translate-y-1/2 w-96 bg-white/95 rounded-3xl p-6 shadow-pop border border-stone-300">
              <div className="flex items-center justify-between pb-3 border-b border-stone-200">
                <span className="font-black text-xs text-stone-500 uppercase tracking-wider">Active Outreach Pipeline</span>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full">Live Demo</span>
              </div>
              <div className="mt-4 space-y-3">
                <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between">
                  <div>
                    <p className="font-extrabold text-[13.5px] text-ink">Al-Karam Textile Mills</p>
                    <p className="text-[11px] font-bold text-stone-400">Karachi · Textiles</p>
                  </div>
                  <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2 py-0.5 rounded-full">Contacted</span>
                </div>
                <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between">
                  <div>
                    <p className="font-extrabold text-[13.5px] text-ink">Systems Logistics PK</p>
                    <p className="text-[11px] font-bold text-stone-400">Lahore · Freight</p>
                  </div>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full">Won Deal</span>
                </div>
                <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between">
                  <div>
                    <p className="font-extrabold text-[13.5px] text-ink">Prime Surgical Co.</p>
                    <p className="text-[11px] font-bold text-stone-400">Sialkot · Exporter</p>
                  </div>
                  <span className="bg-blue-100 text-blue-800 text-[10px] font-black px-2 py-0.5 rounded-full">Replied</span>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-stone-200 flex items-center justify-between text-xs font-bold text-stone-500">
                <span>3 Leads Selected</span>
                <span className="text-amber-700 font-extrabold">Ready to Export CSV</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Matrix: Yellow Pages PK vs Legacy Options */}
      <section className="py-20 bg-stone-100/70 border-y border-stone-200/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <h2 className="text-3xl md:text-4xl font-black text-ink tracking-tight">
              Why Yellow Pages Pakistan Wins ⭐
            </h2>
            <p className="mt-3 text-stone-600 text-base font-medium">
              See how we compare against legacy phone books and ad-stuffed directory sites.
            </p>
          </div>

          <div className="bg-white rounded-3xl border border-stone-200 shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200 text-xs font-black uppercase text-stone-500">
                    <th className="p-4 sm:p-5">Feature</th>
                    <th className="p-4 sm:p-5 text-amber-700 bg-amber-50/70">Yellow Pages PK</th>
                    <th className="p-4 sm:p-5">Legacy PDF / Books</th>
                    <th className="p-4 sm:p-5">Outdated Web Directories</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-[13.5px] font-bold text-stone-700">
                  <tr>
                    <td className="p-4 sm:p-5 font-black text-ink">Listings Database</td>
                    <td className="p-4 sm:p-5 bg-amber-50/40 text-emerald-700 font-black">200,000+ Active</td>
                    <td className="p-4 sm:p-5 text-stone-400">Fixed & Static</td>
                    <td className="p-4 sm:p-5 text-stone-400">~150k (Many Dead)</td>
                  </tr>
                  <tr>
                    <td className="p-4 sm:p-5 font-black text-ink">Direct WhatsApp & Calling</td>
                    <td className="p-4 sm:p-5 bg-amber-50/40 text-emerald-700 font-black">1-Tap Instant</td>
                    <td className="p-4 sm:p-5 text-rose-500 font-bold">Manual dial only</td>
                    <td className="p-4 sm:p-5 text-rose-500 font-bold">Hidden behind forms</td>
                  </tr>
                  <tr>
                    <td className="p-4 sm:p-5 font-black text-ink">Lead Workspace & CSV Export</td>
                    <td className="p-4 sm:p-5 bg-amber-50/40 text-emerald-700 font-black">Built-in Free</td>
                    <td className="p-4 sm:p-5 text-stone-400">None</td>
                    <td className="p-4 sm:p-5 text-stone-400">None</td>
                  </tr>
                  <tr>
                    <td className="p-4 sm:p-5 font-black text-ink">Free Business Listings</td>
                    <td className="p-4 sm:p-5 bg-amber-50/40 text-emerald-700 font-black">Free Forever</td>
                    <td className="p-4 sm:p-5 text-rose-500 font-bold">Expensive ad prints</td>
                    <td className="p-4 sm:p-5 text-rose-500 font-bold">Pay-to-list fees</td>
                  </tr>
                  <tr>
                    <td className="p-4 sm:p-5 font-black text-ink">Offline Access / Installable PWA</td>
                    <td className="p-4 sm:p-5 bg-amber-50/40 text-emerald-700 font-black">Yes (Works Offline)</td>
                    <td className="p-4 sm:p-5 text-stone-400">Heavy paper only</td>
                    <td className="p-4 sm:p-5 text-stone-400">Slow mobile web</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Verified Businesses Showcase */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div>
              <span className="text-xs font-black uppercase tracking-widest text-amber-600 block mb-1">
                Verified Flagship Listings
              </span>
              <h2 className="text-3xl md:text-4xl font-black text-ink tracking-tight">
                Featured Pakistani Brands ⭐
              </h2>
            </div>
            <Link
              to="/browse?verified=1"
              className="mt-4 md:mt-0 inline-flex items-center gap-2 font-black text-amber-700 hover:text-amber-800 text-[15px]"
            >
              <span>Explore All Verified Profiles</span>
              <ChevronRight size={18} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {CURATED.slice(0, 3).map((item, idx) => (
              <div
                key={item.name}
                className="bg-white rounded-3xl p-6 border border-stone-200/90 shadow-card flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <span className="text-3xl">{item.emoji || '🏢'}</span>
                    <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[11px] font-black px-2.5 py-0.5 rounded-full">
                      <ShieldCheck size={13} /> Verified
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-ink">{item.name}</h3>
                  <p className="text-xs font-bold text-stone-500 mt-0.5 flex items-center gap-1">
                    <MapPin size={12} className="text-amber-600" /> {item.city} · {item.area || 'Main Office'}
                  </p>
                  <p className="text-stone-600 text-xs font-medium mt-3 line-clamp-2">
                    {item.desc || 'Premier verified Pakistani establishment with dedicated direct contact lines.'}
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-stone-100 flex items-center justify-between">
                  <span className="text-xs font-black text-amber-700">{item.phone}</span>
                  <Link
                    to={`/b/c${idx}`}
                    className="inline-flex items-center gap-1 text-xs font-black text-ink hover:text-amber-700"
                  >
                    <span>View Profile</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Website FAQ Section */}
      <section className="py-20 bg-stone-100/70 border-t border-stone-200/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <PageFaq
            title="Frequently Asked Questions"
            subtitle="Everything you need to know about browsing, listing, and acquiring clients on Yellow Pages Pakistan."
            faqs={HOME_FAQS}
          />
        </div>
      </section>

      {/* Final Launch CTA Section */}
      <section className="py-20 bg-ink text-cream relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-brand/20 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight">
            Ready to Explore Pakistan&apos;s Business Book?
          </h2>
          <p className="mt-4 text-stone-300 text-base md:text-lg max-w-2xl mx-auto font-medium">
            Jump straight into the web application to search 200,000+ businesses, save B2B leads, or list your company in under 2 minutes.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/app"
              className="inline-flex items-center gap-2.5 bg-brand hover:bg-amber-400 text-ink font-black text-[16px] px-8 py-4 rounded-2xl shadow-pop hover:scale-[1.02] transition-transform"
            >
              <Zap size={20} className="text-ink" />
              <span>Launch Directory Web App</span>
              <ArrowRight size={18} />
            </Link>
            <Link
              to="/add"
              className="inline-flex items-center gap-2 bg-stone-800 hover:bg-stone-700 text-cream font-extrabold text-[15px] px-7 py-4 rounded-2xl border border-stone-700 transition-colors"
            >
              <span>List Your Business for Free</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Comprehensive Website Footer */}
      <footer className="bg-stone-900 text-stone-400 pt-16 pb-12 border-t border-stone-800 text-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
            {/* Col 1: Brand Info */}
            <div className="lg:col-span-2">
              <Link to="/" className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-brand text-ink flex items-center justify-center font-black">
                  <span className="text-xl">📖</span>
                </div>
                <span className="font-black text-xl text-cream tracking-tight">
                  Yellow Pages <span className="text-brand">PK</span>
                </span>
              </Link>
              <p className="mt-4 text-stone-400 text-xs leading-relaxed max-w-sm font-medium">
                The premier digital business directory of Pakistan. 200,000+ verified listings across 420 cities and 130 categories. Built for businesses, shoppers, freelancers, and marketing agencies.
              </p>
              <div className="mt-5 flex items-center gap-2 text-xs font-bold text-stone-400">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
                <span>200,000+ Listings Active Nationwide</span>
              </div>
            </div>

            {/* Col 2: Directory Hubs */}
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-stone-200 mb-4">
                Directory Hubs
              </h3>
              <ul className="space-y-2.5 text-xs font-bold">
                <li><Link to="/app" className="hover:text-brand transition-colors">Directory Web App</Link></li>
                <li><Link to="/browse" className="hover:text-brand transition-colors">Search All Businesses</Link></li>
                <li><Link to="/categories" className="hover:text-brand transition-colors">130 Categories</Link></li>
                <li><Link to="/nearby" className="hover:text-brand transition-colors">Nearby Businesses (GPS)</Link></li>
                <li><Link to="/browse?verified=1" className="hover:text-brand transition-colors">Verified Companies</Link></li>
              </ul>
            </div>

            {/* Col 3: For Growth & B2B */}
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-stone-200 mb-4">
                Tools & Growth
              </h3>
              <ul className="space-y-2.5 text-xs font-bold">
                <li><Link to="/leads" className="hover:text-brand transition-colors">Lead Workspace</Link></li>
                <li><Link to="/add" className="hover:text-brand transition-colors">Free Business Listing</Link></li>
                <li><Link to="/faq" className="hover:text-brand transition-colors">Help Centre & FAQ</Link></li>
                <li><a href="/llms.txt" className="hover:text-brand transition-colors">llms.txt (AI Overviews)</a></li>
                <li><a href="/sitemap.xml" className="hover:text-brand transition-colors">XML Sitemap</a></li>
              </ul>
            </div>

            {/* Col 4: Top Economic Cities */}
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-stone-200 mb-4">
                Top Cities
              </h3>
              <ul className="space-y-2.5 text-xs font-bold">
                <li><Link to="/city/karachi" className="hover:text-brand transition-colors">Karachi Directory</Link></li>
                <li><Link to="/city/lahore" className="hover:text-brand transition-colors">Lahore Directory</Link></li>
                <li><Link to="/city/islamabad" className="hover:text-brand transition-colors">Islamabad Directory</Link></li>
                <li><Link to="/city/faisalabad" className="hover:text-brand transition-colors">Faisalabad Directory</Link></li>
                <li><Link to="/city/rawalpindi" className="hover:text-brand transition-colors">Rawalpindi Directory</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold text-stone-500">
            <p>© {new Date().getFullYear()} Yellow Pages Pakistan (Goshbuzz). All rights reserved.</p>
            <div className="flex items-center gap-6">
              <Link to="/faq" className="hover:text-stone-300">Privacy & Terms</Link>
              <Link to="/add" className="hover:text-stone-300">Submit Company</Link>
              <a href="/sitemap.xml" className="hover:text-stone-300">Sitemap</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
