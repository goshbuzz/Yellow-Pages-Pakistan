import React, { useState, useMemo } from "react";
import { 
  Building2, MapPin, Search, Compass, Award, X, Tags, 
  Building, ArrowLeft, ArrowRight, Phone, Laptop, Sparkles, Filter
} from "lucide-react";

import { 
  MASTER_DIRECTORY, CATEGORIES, PROVINCIAL_DATA 
} from "./data";
import { Business } from "./types";

// Component imports
import { BusinessCard } from "./components/BusinessCard";
import { EmailDraftModal } from "./components/EmailDraftModal";
import { MapModal } from "./components/MapModal";
import { DialerModal } from "./components/DialerModal";
import { AiChatWidget } from "./components/AiChatWidget";

export default function App() {
  // Navigation & Filtering States
  const [selectedProvince, setSelectedProvince] = useState<string>("All");
  const [selectedCity, setSelectedCity] = useState<string>("All");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  
  // Pagination States
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 12;

  // Active Modals States
  const [activeBusinessForEmail, setActiveBusinessForEmail] = useState<Business | null>(null);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState<boolean>(false);

  const [activeBusinessForMap, setActiveBusinessForMap] = useState<Business | null>(null);
  const [isMapModalOpen, setIsMapModalOpen] = useState<boolean>(false);

  const [activeBusinessForDial, setActiveBusinessForDial] = useState<Business | null>(null);
  const [isDialModalOpen, setIsDialModalOpen] = useState<boolean>(false);

  // Trigger modals
  const handleDraftEmail = (business: Business) => {
    setActiveBusinessForEmail(business);
    setIsEmailModalOpen(true);
  };

  const handleViewMap = (business: Business) => {
    setActiveBusinessForMap(business);
    setIsMapModalOpen(true);
  };

  const handleDial = (business: Business) => {
    setActiveBusinessForDial(business);
    setIsDialModalOpen(true);
  };

  // State filtering logic (memoized)
  const filteredBusinesses = useMemo(() => {
    return MASTER_DIRECTORY.filter((business) => {
      const matchProvince = selectedProvince === "All" || business.province === selectedProvince;
      const matchCity = selectedCity === "All" || business.city === selectedCity;
      const matchCategory = selectedCategory === "All" || business.category === selectedCategory;
      
      const searchLower = searchQuery.toLowerCase().trim();
      const matchSearch =
        !searchLower ||
        business.name.toLowerCase().includes(searchLower) ||
        business.category.toLowerCase().includes(searchLower) ||
        business.city.toLowerCase().includes(searchLower) ||
        business.address.toLowerCase().includes(searchLower) ||
        business.phone.includes(searchLower) ||
        (business.symbol && business.symbol.toLowerCase().includes(searchLower));

      return matchProvince && matchCity && matchCategory && matchSearch;
    });
  }, [selectedProvince, selectedCity, selectedCategory, searchQuery]);

  // Compute live category statistics based on the total directory
  const categoryStats = useMemo(() => {
    const stats: Record<string, number> = {};
    MASTER_DIRECTORY.forEach((b) => {
      stats[b.category] = (stats[b.category] || 0) + 1;
    });
    return stats;
  }, []);

  // Compute pagination parameters
  const totalPages = Math.ceil(filteredBusinesses.length / itemsPerPage);
  const paginatedBusinesses = useMemo(() => {
    return filteredBusinesses.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
  }, [filteredBusinesses, currentPage]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      const targetElement = document.getElementById("directory-results");
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  const handleProvinceChange = (province: string) => {
    setSelectedProvince(province);
    setSelectedCity("All");
    setIsMobileMenuOpen(false);
    setCurrentPage(1);
  };

  const handleCityChange = (city: string) => {
    setSelectedCity(city);
    setIsMobileMenuOpen(false);
    setCurrentPage(1);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setCurrentPage(1);
  };

  const clearAllFilters = () => {
    setSelectedProvince("All");
    setSelectedCity("All");
    setSelectedCategory("All");
    setSearchQuery("");
    setCurrentPage(1);
    setIsMobileMenuOpen(false);
  };

  const provinces = Object.keys(PROVINCIAL_DATA);
  const cities = selectedProvince !== "All" ? PROVINCIAL_DATA[selectedProvince] : [];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 relative">
      
      {/* --- TOP HEADER BAR --- */}
      <header className="bg-amber-400 border-b border-amber-500 px-4 sm:px-8 py-4 sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          
          {/* Brand Logo */}
          <div 
            className="flex items-center gap-3 cursor-pointer group"
            onClick={clearAllFilters}
          >
            <div className="bg-slate-900 p-2 rounded shadow-md transform group-hover:rotate-6 transition-transform duration-300">
              <Building2 className="w-8 h-8 text-amber-400" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              YELLOWPAGES<span className="font-light">PAKISTAN</span>
            </h1>
          </div>

          {/* Desktop Navigation Link buttons */}
          <div className="hidden md:flex items-center gap-4 text-sm font-semibold text-slate-900 uppercase tracking-wider">
            <button 
              onClick={() => { setSelectedCity("Khanpur"); setSelectedProvince("Punjab"); }}
              className="hover:underline text-xs font-bold font-sans cursor-pointer"
            >
              Khanpur Hub
            </button>
            <button 
              onClick={() => { setSelectedCity("Sahiwal"); setSelectedProvince("Punjab"); }}
              className="hover:underline text-xs font-bold font-sans cursor-pointer"
            >
              Sahiwal Hub
            </button>
            <button 
              onClick={clearAllFilters}
              className="hover:underline text-xs font-bold font-sans cursor-pointer"
            >
              Reset Directories
            </button>
            <button 
              onClick={() => {
                const chatBtn = document.querySelector('[aria-label="Toggle AI Assistant"]') as HTMLButtonElement | null;
                chatBtn?.click();
              }}
              className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-md text-xs font-bold font-sans cursor-pointer shadow-xs"
            >
              AI Assistant ⚡
            </button>
          </div>

          {/* Mobile menu toggle */}
          <div className="md:hidden">
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
              className="p-2 text-slate-900 hover:bg-amber-500 rounded-lg transition-colors cursor-pointer"
              aria-label="Toggle Filters"
            >
              <Filter className="w-6 h-6" />
            </button>
          </div>

        </div>
      </header>

      {/* --- HERO / SEARCH CONSOLE --- */}
      <div className="bg-slate-900 py-12 px-4 sm:px-8 text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-amber-400/5 rounded-full filter blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-amber-500/5 rounded-full filter blur-3xl"></div>

        <div className="max-w-4xl mx-auto relative z-10 space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight font-sans">
            Connecting People with Pakistan's Top Verified Businesses
          </h2>
          
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-0 shadow-2xl rounded-lg overflow-hidden border border-slate-700 bg-white">
            {/* Search Input Part */}
            <div className="flex-1 bg-white flex items-center px-4 border-b md:border-b-0 md:border-r border-slate-205">
              <Search className="w-5 h-5 text-slate-400 mr-2 shrink-0" />
              <input
                type="text"
                className="w-full py-4 focus:outline-none text-slate-800 font-medium placeholder-slate-400 text-sm bg-transparent border-none"
                placeholder="Search business name, category, or service..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="p-1.5 text-slate-400 hover:text-slate-600 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Quick Location Helper Field */}
            <div className="w-full md:w-64 bg-white flex items-center px-4 border-b md:border-b-0 md:border-r border-slate-205 py-2 md:py-0">
              <MapPin className="w-5 h-5 text-slate-400 mr-2 shrink-0" />
              <select
                className="w-full py-4 focus:outline-none text-slate-700 font-bold text-xs bg-transparent border-none select-none cursor-pointer"
                value={selectedCity}
                onChange={(e) => handleCityChange(e.target.value)}
              >
                <option value="All">All Cities</option>
                <option value="Sahiwal">Sahiwal</option>
                <option value="Karachi">Karachi</option>
                <option value="Lahore">Lahore</option>
                <option value="Peshawar">Peshawar</option>
                <option value="Quetta">Quetta</option>
                <option value="Islamabad">Islamabad</option>
                <option value="Bahawalpur">Bahawalpur</option>
                <option value="Rahim Yar Khan">Rahim Yar Khan</option>
                <option value="Khanpur">Khanpur</option>
              </select>
            </div>

            {/* Action Trigger Button */}
            <button 
              onClick={() => {
                const resultsEl = document.getElementById("directory-results");
                resultsEl?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className="bg-amber-400 hover:bg-amber-500 text-slate-900 px-8 py-4 font-extrabold uppercase transition-colors text-xs tracking-wider shrink-0 cursor-pointer"
            >
              Search Index
            </button>
          </div>

          <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs">
            <span className="text-slate-400 font-medium">Popular Searches:</span>
            <button onClick={() => handleCategoryChange("Textiles & Corporate")} className="text-amber-400 hover:underline cursor-pointer bg-transparent border-none">
              Textile Mills
            </button>
            <button onClick={() => handleCategoryChange("IT & Tech")} className="text-amber-400 hover:underline cursor-pointer bg-transparent border-none">
              Software Houses
            </button>
            <button onClick={() => handleCategoryChange("Transport & Logistics")} className="text-amber-400 hover:underline cursor-pointer bg-transparent border-none">
              Courier Services
            </button>
            <button onClick={() => handleCategoryChange("Hospitals & Medical Centers")} className="text-amber-400 hover:underline cursor-pointer bg-transparent border-none">
              Private Hospitals
            </button>
          </div>
        </div>
      </div>

      {/* --- ACTIVE STATUS BANNER --- */}
      <div className="bg-amber-400 py-3 px-4 text-center text-slate-950 font-black text-xs tracking-wider uppercase shadow-inner border-b border-amber-500">
        ⚡ DIRECTORY INDEX IN SYNC WITH SECURITIES AND EXCHANGE COMMISSION OF PAKISTAN (SECP)
      </div>

      {/* --- DIRECTORY SHELF PORT --- */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10" id="directory-results">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Filters Sidebar */}
          <aside className={`lg:w-80 flex-shrink-0 ${isMobileMenuOpen ? "block" : "hidden lg:block"}`}>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sticky top-24 space-y-6">
              
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 text-slate-900">
                  <Filter className="w-5 h-5 text-amber-500" />
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest font-sans">Directory Filters</h3>
                </div>
                <button onClick={clearAllFilters} className="text-[10px] text-red-600 hover:text-red-700 hover:underline font-black cursor-pointer uppercase tracking-wider">
                  Reset
                </button>
              </div>

              {/* Categorization list */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-slate-450 uppercase tracking-widest flex items-center gap-1.5">
                  <Tags className="w-3.5 h-3.5 text-slate-400" /> Sector Categories
                </h4>
                <div className="space-y-1 max-h-60 overflow-y-auto pr-1">
                  <button 
                    onClick={() => handleCategoryChange("All")}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-xs flex justify-between items-center transition-all cursor-pointer ${
                      selectedCategory === "All" ? "bg-amber-400 text-slate-950 font-black shadow-xs" : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <span>All Sectors</span>
                    <span className="text-[10px] font-bold font-mono opacity-80">{MASTER_DIRECTORY.length}</span>
                  </button>

                  {CATEGORIES.map((cat) => (
                    <button 
                      key={cat}
                      onClick={() => handleCategoryChange(cat)}
                      className={`w-full text-left px-3 py-1.5 rounded-lg text-xs flex justify-between items-center transition-all cursor-pointer ${
                        selectedCategory === cat ? "bg-amber-400 text-slate-950 font-black shadow-xs" : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <span className="truncate mr-2 font-medium">{cat}</span>
                      <span className="text-[10.5px] font-mono opacity-70 shrink-0 font-bold bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">
                        {categoryStats[cat] || 0}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Provincial lists */}
              <div className="space-y-3 pt-2">
                <h4 className="text-[10px] font-black text-slate-450 uppercase tracking-widest flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-slate-400" /> Province/State
                </h4>
                <div className="space-y-1.5">
                  <label className="flex items-center cursor-pointer group text-xs text-slate-700 hover:text-amber-600 font-medium">
                    <input 
                      type="radio" 
                      name="province"
                      checked={selectedProvince === "All"}
                      onChange={() => handleProvinceChange("All")}
                      className="text-amber-500 focus:ring-amber-400 h-4 w-4 mr-3"
                    />
                    <span className={selectedProvince === "All" ? "font-extrabold text-slate-950" : "text-slate-600"}>
                      All Pakistan Indices
                    </span>
                  </label>

                  {provinces.map((prov) => (
                    <label key={prov} className="flex items-center cursor-pointer group text-xs text-slate-700 hover:text-amber-600 font-medium">
                      <input 
                        type="radio" 
                        name="province"
                        checked={selectedProvince === prov}
                        onChange={() => handleProvinceChange(prov)}
                        className="text-amber-500 focus:ring-amber-400 h-4 w-4 mr-3"
                      />
                      <span className={selectedProvince === prov ? "font-extrabold text-slate-950" : "text-slate-600"}>
                        {prov} Province
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Localized Cities */}
              {selectedProvince !== "All" && (
                <div className="animate-fade-in border-t border-slate-100 pt-5 space-y-3">
                  <h4 className="text-[10px] font-black text-slate-450 uppercase tracking-widest flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" /> Cities
                  </h4>
                  <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                    <label className="flex items-center cursor-pointer group p-1.5 rounded-lg hover:bg-slate-50 transition-colors text-xs">
                      <input 
                        type="radio" 
                        name="city"
                        checked={selectedCity === "All"}
                        onChange={() => handleCityChange("All")}
                        className="mr-3 text-amber-500 focus:ring-amber-400 h-3.5 w-3.5"
                      />
                      <span className={selectedCity === "All" ? "font-bold text-slate-950" : "text-slate-600"}>
                        All Cities
                      </span>
                    </label>

                    {cities.map((ct) => (
                      <label key={ct} className="flex items-center cursor-pointer group p-1.5 rounded-lg hover:bg-slate-50 transition-colors text-xs">
                        <input 
                          type="radio" 
                          name="city"
                          checked={selectedCity === ct}
                          onChange={() => handleCityChange(ct)}
                          className="mr-3 text-amber-500 focus:ring-amber-400 h-3.5 w-3.5"
                        />
                        <span className={selectedCity === ct ? "font-bold text-slate-950" : "text-slate-650"}>
                          {ct} {["Sahiwal", "Khanpur", "Bahawalpur", "Rahim Yar Khan"].includes(ct) && "🌟"}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Featured Promotion Callout */}
              <div className="mt-8 p-4 bg-amber-50 rounded-xl border border-amber-100 ">
                <p className="text-xs font-bold text-amber-800 uppercase mb-2">Featured Listing</p>
                <p className="text-xs text-amber-900 leading-tight">Get your business or clinic listed on the front page of the Pakistan national directory index.</p>
                <button 
                  onClick={() => {
                    const chatBtn = document.querySelector('[aria-label="Toggle AI Assistant"]') as HTMLButtonElement | null;
                    chatBtn?.click();
                  }}
                  className="mt-3.5 w-full text-center text-[10px] font-black text-white bg-amber-600 hover:bg-amber-700 px-3 py-2 rounded-lg cursor-pointer transition-colors tracking-wider uppercase"
                >
                  Register My Listing
                </button>
              </div>

            </div>
          </aside>

          {/* Directory Listings results flow */}
          <main className="flex-1 space-y-6">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div>
                <h2 className="text-lg font-bold text-slate-900 leading-none">Verified National Listings</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Active directory index representing <span className="font-bold text-amber-600">{filteredBusinesses.length.toLocaleString()}</span> audited corporate records.
                </p>
              </div>

              {(selectedProvince !== "All" || selectedCategory !== "All" || selectedCity !== "All" || searchQuery) && (
                <button
                  onClick={clearAllFilters}
                  className="text-xs bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2 rounded-xl font-bold transition-all flex items-center shadow-xs cursor-pointer font-sans"
                >
                  <X className="w-3.5 h-3.5 mr-1" /> Reset Directory Selection
                </button>
              )}
            </div>

            {paginatedBusinesses.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-fade-in">
                  {paginatedBusinesses.map((b) => (
                    <BusinessCard
                      key={b.id}
                      business={b}
                      onDraftEmail={handleDraftEmail}
                      onViewMap={handleViewMap}
                      onDial={handleDial}
                    />
                  ))}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-2xl border border-slate-205 shadow-xs font-sans">
                    <span className="text-xs text-slate-500 font-bold uppercase tracking-wide">
                      Page <span className="font-extrabold text-slate-950">{currentPage}</span> of <span className="font-extrabold text-slate-950">{totalPages}</span>
                    </span>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="p-2 rounded-xl border border-slate-300 bg-white text-slate-650 disabled:opacity-40 hover:bg-slate-50 flex items-center gap-1 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Prev</span>
                      </button>

                      <div className="hidden sm:flex gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, idx) => {
                          let num = currentPage;
                          if (currentPage <= 3) {
                            num = idx + 1;
                          } else if (currentPage >= totalPages - 2) {
                            num = totalPages - 4 + idx;
                          } else {
                            num = currentPage - 2 + idx;
                          }
                          
                          if (num < 1 || num > totalPages) return null;

                          return (
                            <button
                              key={num}
                              onClick={() => handlePageChange(num)}
                              className={`w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                currentPage === num
                                  ? "bg-amber-400 text-slate-950 font-black shadow-xs border border-amber-500"
                                  : "hover:bg-slate-50 text-slate-600"
                              }`}
                            >
                              {num}
                            </button>
                          );
                        })}
                      </div>

                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="p-2 rounded-xl border border-slate-300 bg-white text-slate-650 disabled:opacity-40 hover:bg-slate-50 flex items-center gap-1 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        <span>Next</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 shadow-xs max-w-xl mx-auto mt-10">
                <Search className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                <h3 className="text-slate-950 font-extrabold text-lg mb-1">No Matching Listings Found</h3>
                <p className="text-sm text-slate-500 max-w-xs mx-auto">
                  Try refining your search terms or choosing a different city or category in the sidebar filters.
                </p>
                <button 
                  onClick={clearAllFilters}
                  className="mt-6 bg-slate-950 text-white font-bold py-2.5 px-5 rounded-xl text-xs hover:bg-slate-800 transition-colors shadow-xs cursor-pointer"
                >
                  Reset Search Criteria
                </button>
              </div>
            )}

          </main>
        </div>
      </div>

      {/* --- FOOTER / NATIONAL STATS COUNTERS --- */}
      <footer className="bg-white border-t border-slate-200 px-4 sm:px-8 py-6 flex flex-col md:flex-row justify-between items-center gap-6 mt-auto">
        <div className="flex gap-8 flex-wrap justify-center sm:justify-start">
          <div className="flex flex-col">
            <span className="text-lg font-black text-slate-900">10,250+</span>
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest font-sans">Verified Businesses</span>
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-black text-slate-900">25+</span>
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest font-sans">Cities Mapped</span>
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-black text-slate-900">24/7 Active</span>
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest font-sans">Live Directory Status</span>
          </div>
        </div>
        <p className="text-xs text-slate-400 font-sans font-medium text-center">
          © {new Date().getFullYear()} Yellow Pages Pakistan National Directory. All SECP records sync active.
        </p>
      </footer>

      {/* Chat Agent and Action Overlays */}
      <AiChatWidget />

      <EmailDraftModal
        business={activeBusinessForEmail}
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
      />

      <MapModal
        business={activeBusinessForMap}
        isOpen={isMapModalOpen}
        onClose={() => setIsMapModalOpen(false)}
      />

      <DialerModal
        business={activeBusinessForDial}
        isOpen={isDialModalOpen}
        onClose={() => setIsDialModalOpen(false)}
      />

    </div>
  );
}
