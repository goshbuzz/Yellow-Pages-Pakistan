// ~120 directory categories — merged taxonomy covering the breadth of Pakistani
// directories (businesslist.pk's 1,131 subcategories consolidated) with icons,
// emoji, colours and listing weights. Weight = relative share of listings.

export const CATEGORY_GROUPS = [
  { id: 'mfg',    label: 'Industry & Manufacturing',  emoji: '🏭' },
  { id: 'retail', label: 'Shops & Retail',            emoji: '🛍️' },
  { id: 'prof',   label: 'Professional & Financial',  emoji: '💼' },
  { id: 'tech',   label: 'Technology & Media',        emoji: '💻' },
  { id: 'prop',   label: 'Property & Construction',   emoji: '🏗️' },
  { id: 'auto',   label: 'Transport & Automotive',    emoji: '🚚' },
  { id: 'food',   label: 'Food & Hospitality',        emoji: '🍽️' },
  { id: 'health', label: 'Health & Wellness',         emoji: '🏥' },
  { id: 'edu',    label: 'Education & Community',     emoji: '🎓' },
  { id: 'home',   label: 'Home & Personal Services',  emoji: '🧑‍🔧' },
  { id: 'agri',   label: 'Agriculture & Outdoors',    emoji: '🚜' },
];

export const CATEGORIES = [
  // ── Industry & Manufacturing ──
  { id: 1,   name: 'Textile Mills & Fabrics',         group: 'mfg',    icon: 'Shirt',            emoji: '🧵', color: '#7C3AED', weight: 30 },
  { id: 2,   name: 'Garment Manufacturing',           group: 'mfg',    icon: 'Shirt',            emoji: '👕', color: '#6D28D9', weight: 14 },
  { id: 3,   name: 'Cement & Building Materials',     group: 'mfg',    icon: 'Landmark',         emoji: '🧱', color: '#78716C', weight: 6 },
  { id: 4,   name: 'Steel & Metal Works',             group: 'mfg',    icon: 'Hammer',           emoji: '⚙️', color: '#57534E', weight: 9 },
  { id: 5,   name: 'Chemicals & Plastics',            group: 'mfg',    icon: 'FlaskConical',     emoji: '🧪', color: '#0EA5E9', weight: 10 },
  { id: 6,   name: 'Fertilizer & Agri Inputs',        group: 'mfg',    icon: 'Sprout',           emoji: '🌱', color: '#16A34A', weight: 6 },
  { id: 7,   name: 'Food & Beverage Manufacturing',   group: 'mfg',    icon: 'Wheat',            emoji: '🏭', color: '#D97706', weight: 12 },
  { id: 8,   name: 'Pharmaceuticals & Medicine',      group: 'mfg',    icon: 'Pill',             emoji: '💊', color: '#DC2626', weight: 7 },
  { id: 9,   name: 'Oil, Gas & Energy',               group: 'mfg',    icon: 'Fuel',             emoji: '⛽', color: '#0F766E', weight: 5 },
  { id: 10,  name: 'Engineering & Machinery',         group: 'mfg',    icon: 'Cog',              emoji: '🔧', color: '#475569', weight: 13 },
  { id: 11,  name: 'Industrial Equipment & Supplies', group: 'mfg',    icon: 'Boxes',            emoji: '🏗️', color: '#475569', weight: 9 },
  { id: 12,  name: 'Industrial Automation',           group: 'mfg',    icon: 'Cpu',              emoji: '🤖', color: '#1E40AF', weight: 4 },
  { id: 13,  name: 'Paper & Packaging',               group: 'mfg',    icon: 'Package',          emoji: '📦', color: '#B45309', weight: 7 },
  { id: 14,  name: 'Furniture Manufacturing',         group: 'mfg',    icon: 'Armchair',         emoji: '🪑', color: '#92400E', weight: 9 },
  { id: 15,  name: 'Leather & Footwear Mfg.',         group: 'mfg',    icon: 'Footprints',       emoji: '👟', color: '#9F1239', weight: 6 },
  { id: 16,  name: 'Sports Goods Manufacturing',      group: 'mfg',    icon: 'Dumbbell',         emoji: '⚽', color: '#059669', weight: 4 },
  { id: 17,  name: 'Surgical Instruments Mfg.',       group: 'mfg',    icon: 'Stethoscope',      emoji: '🔪', color: '#0891B2', weight: 3 },
  { id: 18,  name: 'Marble, Granite & Minerals',      group: 'mfg',    icon: 'Mountain',         emoji: '⛰️', color: '#64748B', weight: 4 },
  { id: 19,  name: 'Glass & Ceramics',                group: 'mfg',    icon: 'Wine',             emoji: '🏺', color: '#0891B2', weight: 3 },
  { id: 20,  name: 'Electrical Equipment & Cables',   group: 'mfg',    icon: 'Zap',              emoji: '⚡', color: '#CA8A04', weight: 6 },
  { id: 21,  name: 'Generators & Power Solutions',    group: 'mfg',    icon: 'BatteryCharging',  emoji: '🔋', color: '#B45309', weight: 4 },
  { id: 22,  name: 'Solar & Renewable Energy',        group: 'mfg',    icon: 'Sun',              emoji: '☀️', color: '#D97706', weight: 5 },
  { id: 23,  name: 'Welding & Fabrication',           group: 'mfg',    icon: 'Flame',            emoji: '🔥', color: '#7F1D1D', weight: 5 },
  { id: 24,  name: 'Paint & Coatings',                group: 'mfg',    icon: 'Palette',          emoji: '🎨', color: '#9333EA', weight: 4 },
  { id: 25,  name: 'Printing & Publishing',           group: 'mfg',    icon: 'Printer',          emoji: '🖨️', color: '#6D28D9', weight: 7 },

  // ── Shops & Retail ──
  { id: 26,  name: 'Clothing & Fashion Stores',       group: 'retail', icon: 'Shirt',            emoji: '👗', color: '#DB2777', weight: 34 },
  { id: 27,  name: 'Footwear Retail',                 group: 'retail', icon: 'Footprints',       emoji: '👠', color: '#BE185D', weight: 12 },
  { id: 28,  name: 'Jewellery & Watches',             group: 'retail', icon: 'Gem',              emoji: '💍', color: '#CA8A04', weight: 16 },
  { id: 29,  name: 'Cosmetics & Beauty Supply',       group: 'retail', icon: 'Sparkles',         emoji: '💄', color: '#E11D48', weight: 11 },
  { id: 30,  name: 'Electronics & Appliances',        group: 'retail', icon: 'Tv',               emoji: '📺', color: '#2563EB', weight: 26 },
  { id: 31,  name: 'Mobile Phones & Accessories',     group: 'retail', icon: 'Smartphone',       emoji: '📱', color: '#4F46E5', weight: 28 },
  { id: 32,  name: 'Computers & IT Retail',           group: 'retail', icon: 'Monitor',          emoji: '🖥️', color: '#1D4ED8', weight: 12 },
  { id: 33,  name: 'Grocery & Supermarkets',          group: 'retail', icon: 'ShoppingCart',     emoji: '🛒', color: '#16A34A', weight: 26 },
  { id: 34,  name: 'Fresh Food Retailers',            group: 'retail', icon: 'Apple',            emoji: '🥬', color: '#65A30D', weight: 14 },
  { id: 35,  name: 'Books & Stationery',              group: 'retail', icon: 'BookOpen',         emoji: '📚', color: '#7C2D12', weight: 14 },
  { id: 36,  name: 'Toys & Baby Shops',               group: 'retail', icon: 'Baby',             emoji: '🧸', color: '#F59E0B', weight: 7 },
  { id: 37,  name: 'Home Décor & Furnishings',        group: 'retail', icon: 'Lamp',             emoji: '🕯️', color: '#A16207', weight: 11 },
  { id: 38,  name: 'Kitchen & Crockery',              group: 'retail', icon: 'CookingPot',       emoji: '🍳', color: '#C2410C', weight: 7 },
  { id: 39,  name: 'Opticians & Eyewear',             group: 'retail', icon: 'Glasses',          emoji: '👓', color: '#0E7490', weight: 8 },
  { id: 40,  name: 'Gifts & Party Supplies',          group: 'retail', icon: 'Gift',             emoji: '🎁', color: '#C026D3', weight: 7 },
  { id: 41,  name: 'Hardware & Sanitary',             group: 'retail', icon: 'Hammer',           emoji: '🛠️', color: '#57534E', weight: 14 },
  { id: 42,  name: 'Mobile & Gadget Repair',          group: 'retail', icon: 'Wrench',           emoji: '🔧', color: '#4F46E5', weight: 10 },
  { id: 43,  name: 'Money Changers',                  group: 'retail', icon: 'Banknote',         emoji: '💱', color: '#15803D', weight: 6 },
  { id: 44,  name: 'Wholesale Traders',               group: 'retail', icon: 'Boxes',            emoji: '📦', color: '#57534E', weight: 16 },

  // ── Professional & Financial ──
  { id: 45,  name: 'Banks & Islamic Banking',         group: 'prof',   icon: 'Landmark',         emoji: '🏦', color: '#1D4ED8', weight: 7 },
  { id: 46,  name: 'Insurance & Takaful',             group: 'prof',   icon: 'ShieldCheck',      emoji: '🛡️', color: '#047857', weight: 9 },
  { id: 47,  name: 'Financial & Investment Services', group: 'prof',   icon: 'BadgeDollarSign',  emoji: '💱', color: '#15803D', weight: 8 },
  { id: 48,  name: 'Stock Brokers & Securities',      group: 'prof',   icon: 'TrendingUp',       emoji: '📈', color: '#0F766E', weight: 3 },
  { id: 49,  name: 'Law Firms & Legal Services',      group: 'prof',   icon: 'Scale',            emoji: '⚖️', color: '#374151', weight: 11 },
  { id: 50,  name: 'Tax Consultants & Auditors',      group: 'prof',   icon: 'Calculator',       emoji: '🧮', color: '#065F46', weight: 11 },
  { id: 51,  name: 'Management Consultants',          group: 'prof',   icon: 'Briefcase',        emoji: '💼', color: '#334155', weight: 8 },
  { id: 52,  name: 'Accounting & Bookkeeping',        group: 'prof',   icon: 'BookMarked',       emoji: '📊', color: '#115E59', weight: 7 },
  { id: 53,  name: 'HR & Recruitment Agencies',       group: 'prof',   icon: 'Users',            emoji: '🧑‍💼', color: '#0F766E', weight: 6 },
  { id: 54,  name: 'Company Registration (SECP)',     group: 'prof',   icon: 'FileText',         emoji: '📋', color: '#44403C', weight: 4 },
  { id: 55,  name: 'Security Services',               group: 'prof',   icon: 'Shield',           emoji: '🛡️', color: '#1E293B', weight: 7 },
  { id: 56,  name: 'NGOs & Community Organizations',  group: 'prof',   icon: 'HeartHandshake',   emoji: '🤝', color: '#E11D48', weight: 6 },

  // ── Technology & Media ──
  { id: 57,  name: 'Software Houses & IT Services',   group: 'tech',   icon: 'Code2',            emoji: '💻', color: '#3B82F6', weight: 18 },
  { id: 58,  name: 'Web & App Development',           group: 'tech',   icon: 'Globe',            emoji: '🌐', color: '#2563EB', weight: 14 },
  { id: 59,  name: 'Digital Marketing & SEO',         group: 'tech',   icon: 'Megaphone',        emoji: '📣', color: '#F43F5E', weight: 13 },
  { id: 60,  name: 'Graphic Design & Branding',       group: 'tech',   icon: 'Palette',          emoji: '🎨', color: '#9333EA', weight: 10 },
  { id: 61,  name: 'Advertising & Media Agencies',    group: 'tech',   icon: 'Clapperboard',     emoji: '🎬', color: '#9333EA', weight: 8 },
  { id: 62,  name: 'Photography & Video Production',  group: 'tech',   icon: 'Camera',           emoji: '📸', color: '#0369A1', weight: 10 },
  { id: 63,  name: 'Call Centers & BPO',              group: 'tech',   icon: 'Headphones',       emoji: '☎️', color: '#0284C7', weight: 4 },
  { id: 64,  name: 'Printing, Signage & Vinyl',       group: 'tech',   icon: 'Printer',          emoji: '🖨️', color: '#6D28D9', weight: 14 },
  { id: 65,  name: 'IT Hardware & Networking',        group: 'tech',   icon: 'Server',           emoji: '🖧', color: '#1E40AF', weight: 8 },
  { id: 66,  name: 'CCTV & Security Systems',         group: 'tech',   icon: 'Video',            emoji: '📹', color: '#0F172A', weight: 9 },
  { id: 67,  name: 'Game Development & Esports',      group: 'tech',   icon: 'Gamepad2',         emoji: '🎮', color: '#7C3AED', weight: 2 },

  // ── Property & Construction ──
  { id: 68,  name: 'Real Estate Agents & Dealers',    group: 'prop',   icon: 'Building2',        emoji: '🏠', color: '#EA580C', weight: 24 },
  { id: 69,  name: 'Property Builders & Developers',  group: 'prop',   icon: 'Building',         emoji: '🏗️', color: '#C2410C', weight: 10 },
  { id: 70,  name: 'Construction Companies',          group: 'prop',   icon: 'HardHat',          emoji: '👷', color: '#78716C', weight: 12 },
  { id: 71,  name: 'Architecture & Town Planning',    group: 'prop',   icon: 'DraftingCompass',  emoji: '📐', color: '#7C3AED', weight: 6 },
  { id: 72,  name: 'Interior Design & Decoration',    group: 'prop',   icon: 'Sofa',             emoji: '🛋️', color: '#DB2777', weight: 8 },
  { id: 73,  name: 'Civil Engineering Contractors',   group: 'prop',   icon: 'Ruler',            emoji: '🧱', color: '#57534E', weight: 8 },
  { id: 74,  name: 'Building Maintenance & Facility', group: 'prop',   icon: 'Wrench',           emoji: '🔨', color: '#475569', weight: 6 },
  { id: 75,  name: 'Renovation & Remodeling',         group: 'prop',   icon: 'Paintbrush',       emoji: '🪚', color: '#A16207', weight: 7 },
  { id: 76,  name: 'Property Management',             group: 'prop',   icon: 'KeyRound',         emoji: '🗝️', color: '#B45309', weight: 4 },
  { id: 77,  name: 'Fire Safety & Equipment',         group: 'prop',   icon: 'Flame',            emoji: '🚒', color: '#DC2626', weight: 3 },
  { id: 78,  name: 'Movers & Packers',                group: 'prop',   icon: 'Package',          emoji: '📦', color: '#92400E', weight: 6 },

  // ── Transport & Automotive ──
  { id: 79,  name: 'Courier & Cargo Services',        group: 'auto',   icon: 'Truck',            emoji: '🚚', color: '#B45309', weight: 12 },
  { id: 80,  name: 'Logistics & Freight Forwarding',  group: 'auto',   icon: 'Ship',             emoji: '🚢', color: '#0E7490', weight: 9 },
  { id: 81,  name: 'Transporters & Trucking',         group: 'auto',   icon: 'Truck',            emoji: '🚛', color: '#78716C', weight: 8 },
  { id: 82,  name: 'Car Dealers & Showrooms',         group: 'auto',   icon: 'Car',              emoji: '🚗', color: '#DC2626', weight: 10 },
  { id: 83,  name: 'Auto Parts & Accessories',        group: 'auto',   icon: 'Cog',              emoji: '🔩', color: '#334155', weight: 12 },
  { id: 84,  name: 'Auto Workshops & Mechanics',      group: 'auto',   icon: 'Wrench',           emoji: '🚘', color: '#475569', weight: 14 },
  { id: 85,  name: 'Car Rentals & Care',              group: 'auto',   icon: 'Car',              emoji: '🚕', color: '#0F766E', weight: 6 },
  { id: 86,  name: 'Marine & Shipping Services',      group: 'auto',   icon: 'Anchor',           emoji: '⚓', color: '#1E3A8A', weight: 4 },
  { id: 87,  name: 'Driving Schools',                 group: 'auto',   icon: 'Car',              emoji: '🚦', color: '#65A30D', weight: 4 },
  { id: 88,  name: 'Airlines & Air Cargo',            group: 'auto',   icon: 'Plane',            emoji: '✈️', color: '#0284C7', weight: 2 },

  // ── Food & Hospitality ──
  { id: 89,  name: 'Restaurants & Fast Food',         group: 'food',   icon: 'UtensilsCrossed',  emoji: '🍽️', color: '#DC2626', weight: 44 },
  { id: 90,  name: 'Cafés & Coffee Shops',            group: 'food',   icon: 'Coffee',           emoji: '☕', color: '#92400E', weight: 12 },
  { id: 91,  name: 'Bakeries & Confectionery',        group: 'food',   icon: 'Cake',             emoji: '🍰', color: '#D97706', weight: 18 },
  { id: 92,  name: 'Catering Services',               group: 'food',   icon: 'ChefHat',          emoji: '👨‍🍳', color: '#B45309', weight: 8 },
  { id: 93,  name: 'Food Processing & Distribution',  group: 'food',   icon: 'Wheat',            emoji: '🥫', color: '#A16207', weight: 8 },
  { id: 94,  name: 'Hotels, Guest Houses & Resorts',  group: 'food',   icon: 'Building',         emoji: '🏨', color: '#1D4ED8', weight: 8 },
  { id: 95,  name: 'Wedding Halls & Marquees',        group: 'food',   icon: 'Heart',            emoji: '💐', color: '#BE123C', weight: 7 },
  { id: 96,  name: 'Cloud Kitchens & Delivery',       group: 'food',   icon: 'Bike',             emoji: '🛵', color: '#EA580C', weight: 5 },

  // ── Health & Wellness ──
  { id: 97,  name: 'Hospitals & Medical Centers',     group: 'health', icon: 'HeartPulse',      emoji: '🏥', color: '#DC2626', weight: 20 },
  { id: 98,  name: 'Clinics & Specialists',           group: 'health', icon: 'Stethoscope',      emoji: '🩺', color: '#0891B2', weight: 18 },
  { id: 99,  name: 'Dentists & Dental Clinics',       group: 'health', icon: 'Smile',            emoji: '🦷', color: '#0EA5E9', weight: 9 },
  { id: 100, name: 'Medical Labs & Diagnostics',      group: 'health', icon: 'Microscope',       emoji: '🔬', color: '#0891B2', weight: 10 },
  { id: 101, name: 'Pharmacies & Medical Stores',     group: 'health', icon: 'Pill',             emoji: '💊', color: '#16A34A', weight: 18 },
  { id: 102, name: 'Physiotherapy & Rehab',           group: 'health', icon: 'Activity',         emoji: '🏃', color: '#0D9488', weight: 5 },
  { id: 103, name: 'Gyms & Fitness Centers',          group: 'health', icon: 'Dumbbell',         emoji: '🏋️', color: '#0F766E', weight: 10 },
  { id: 104, name: 'Salons, Spas & Barbers',          group: 'health', icon: 'Scissors',         emoji: '💈', color: '#DB2777', weight: 20 },
  { id: 105, name: 'Cosmetic & Aesthetic Clinics',    group: 'health', icon: 'Sparkles',         emoji: '💉', color: '#E11D48', weight: 5 },
  { id: 106, name: 'Veterinary Clinics',              group: 'health', icon: 'PawPrint',         emoji: '🐾', color: '#65A30D', weight: 4 },
  { id: 107, name: 'Homeopathic & Herbal Care',       group: 'health', icon: 'Leaf',             emoji: '🌿', color: '#4D7C0F', weight: 5 },
  { id: 108, name: 'Medical Equipment & Supplies',    group: 'health', icon: 'BriefcaseMedical', emoji: '🩹', color: '#B91C1C', weight: 6 },

  // ── Education & Community ──
  { id: 109, name: 'Schools & Academies',             group: 'edu',    icon: 'GraduationCap',    emoji: '🎒', color: '#1D4ED8', weight: 26 },
  { id: 110, name: 'Colleges & Higher Education',     group: 'edu',    icon: 'BookOpen',         emoji: '🎓', color: '#1E40AF', weight: 10 },
  { id: 111, name: 'Universities & Research',         group: 'edu',    icon: 'Landmark',         emoji: '🏛️', color: '#312E81', weight: 3 },
  { id: 112, name: 'Coaching & Test Prep Centers',    group: 'edu',    icon: 'PenTool',          emoji: '📝', color: '#4338CA', weight: 12 },
  { id: 113, name: 'IT & Professional Training',      group: 'edu',    icon: 'Monitor',          emoji: '🧑‍💻', color: '#2563EB', weight: 10 },
  { id: 114, name: 'Daycare & Montessori',            group: 'edu',    icon: 'Baby',             emoji: '🧒', color: '#F59E0B', weight: 7 },
  { id: 115, name: 'Vocational & Skill Training',     group: 'edu',    icon: 'Wrench',           emoji: '🛠️', color: '#57534E', weight: 5 },

  // ── Home & Personal Services ──
  { id: 116, name: 'Electricians',                    group: 'home',   icon: 'Zap',              emoji: '⚡', color: '#CA8A04', weight: 10 },
  { id: 117, name: 'Plumbers',                        group: 'home',   icon: 'Droplets',         emoji: '🚰', color: '#0284C7', weight: 9 },
  { id: 118, name: 'AC & Refrigeration Services',     group: 'home',   icon: 'Snowflake',        emoji: '❄️', color: '#0EA5E9', weight: 9 },
  { id: 119, name: 'Pest Control Services',           group: 'home',   icon: 'Bug',              emoji: '🐜', color: '#4D7C0F', weight: 5 },
  { id: 120, name: 'Cleaning & Facility Services',    group: 'home',   icon: 'Brush',            emoji: '🧹', color: '#0891B2', weight: 7 },
  { id: 121, name: 'Laundry & Dry Cleaning',          group: 'home',   icon: 'Shirt',            emoji: '🧺', color: '#0284C7', weight: 8 },
  { id: 122, name: 'Tailors & Clothing Alterations',  group: 'home',   icon: 'Scissors',         emoji: '🧵', color: '#BE185D', weight: 12 },
  { id: 123, name: 'Home Tutors',                     group: 'home',   icon: 'BookOpen',         emoji: '📚', color: '#7C2D12', weight: 7 },
  { id: 124, name: 'Carpentry & Woodwork Services',   group: 'home',   icon: 'Hammer',           emoji: '🪚', color: '#92400E', weight: 6 },

  // ── Agriculture & Outdoors ──
  { id: 125, name: 'Agriculture & Farms',             group: 'agri',   icon: 'Tractor',          emoji: '🚜', color: '#65A30D', weight: 8 },
  { id: 126, name: 'Dairy & Livestock',               group: 'agri',   icon: 'Milk',             emoji: '🐄', color: '#4D7C0F', weight: 5 },
  { id: 127, name: 'Poultry & Hatcheries',            group: 'agri',   icon: 'Egg',              emoji: '🐔', color: '#D97706', weight: 5 },
  { id: 128, name: 'Seeds & Agri Services',           group: 'agri',   icon: 'Sprout',           emoji: '🌾', color: '#16A34A', weight: 5 },
  { id: 129, name: 'Florists & Nurseries',            group: 'agri',   icon: 'Flower2',          emoji: '🌷', color: '#DB2777', weight: 5 },
  { id: 130, name: 'Gardening & Landscaping',         group: 'agri',   icon: 'TreePine',         emoji: '🌳', color: '#15803D', weight: 4 },
];

export const CATEGORY_BY_ID = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]));
export const CATEGORY_BY_SLUG = Object.fromEntries(CATEGORIES.map((c) => [slug(c.name), c]));

export function slug(s) {
  return s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}
