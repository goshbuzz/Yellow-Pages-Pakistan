// Lucide icon registry for categories + brand logo.

import {
  Shirt, Landmark, Hammer, FlaskConical, Sprout, Wheat, Pill, Fuel, Cog, Boxes, Cpu, Package,
  Armchair, Footprints, Dumbbell, Stethoscope, Mountain, Wine, Zap, BatteryCharging, Sun, Flame,
  Palette, Printer, Tv, Smartphone, Monitor, ShoppingCart, Apple, BookOpen, Baby, Lamp, CookingPot,
  Glasses, Gift, Wrench, Banknote, Gem, Sparkles, ShieldCheck, BadgeDollarSign, TrendingUp, Scale,
  Calculator, Briefcase, BookMarked, Users, FileText, Shield, HeartHandshake, Code2, Globe, Megaphone,
  Clapperboard, Camera, Headphones, Server, Video, Gamepad2, Building2, Building, HardHat,
  DraftingCompass, Sofa, Ruler, Paintbrush, KeyRound, Truck, Ship, Car, Anchor, Plane,
  UtensilsCrossed, Coffee, Cake, ChefHat, Bike, HeartPulse, Smile, Microscope, Activity, Scissors,
  PawPrint, Leaf, BriefcaseMedical, GraduationCap, PenTool, Droplets, Snowflake, Bug, Brush, Milk,
  Egg, Flower2, TreePine, Tractor, MapPin, Star, Search, Home, LayoutGrid, Bookmark, Phone,
  Navigation, ExternalLink, Mail, X, Download, Share2, Plus, Check, Copy, ChevronRight, ArrowLeft,
  Filter, SlidersHorizontal, MapPinned, FileSpreadsheet, Send, Trash2, Pencil, WifiOff, Sparkle,
} from 'lucide-react';

export const ICONS = {
  Shirt, Landmark, Hammer, FlaskConical, Sprout, Wheat, Pill, Fuel, Cog, Boxes, Cpu, Package,
  Armchair, Footprints, Dumbbell, Stethoscope, Mountain, Wine, Zap, BatteryCharging, Sun, Flame,
  Palette, Printer, Tv, Smartphone, Monitor, ShoppingCart, Apple, BookOpen, Baby, Lamp, CookingPot,
  Glasses, Gift, Wrench, Banknote, Gem, Sparkles, ShieldCheck, BadgeDollarSign, TrendingUp, Scale,
  Calculator, Briefcase, BookMarked, Users, FileText, Shield, HeartHandshake, Code2, Globe, Megaphone,
  Clapperboard, Camera, Headphones, Server, Video, Gamepad2, Building2, Building, HardHat,
  DraftingCompass, Sofa, Ruler, Paintbrush, KeyRound, Truck, Ship, Car, Anchor, Plane,
  UtensilsCrossed, Coffee, Cake, ChefHat, Bike, HeartPulse, Smile, Microscope, Activity, Scissors,
  PawPrint, Leaf, BriefcaseMedical, GraduationCap, PenTool, Droplets, Snowflake, Bug, Brush, Milk,
  Egg, Flower2, TreePine, Tractor, MapPin, Star, Search, Home, LayoutGrid, Bookmark, Phone,
  Navigation, ExternalLink, Mail, X, Download, Share2, Plus, Check, Copy, ChevronRight, ArrowLeft,
  Filter, SlidersHorizontal, MapPinned, FileSpreadsheet, Send, Trash2, Pencil, WifiOff, Sparkle,
};

export function CatIcon({ icon, size = 18, className = '' }) {
  const C = ICONS[icon] || Sparkle;
  return <C size={size} className={className} />;
}

// Brand logo — book + magnifying glass, synced with favicon & app icon.
export function Logo({ size = 34, withWord = true }) {
  return (
    <span className="inline-flex items-center gap-2 select-none">
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none" aria-hidden="true" className="drop-shadow-sm">
        <rect width="100" height="100" rx="24" fill="#F5B301" />
        <rect x="22" y="18" width="46" height="64" rx="7" fill="#1C1917" />
        <path d="M30 18h10v64H30z" fill="#FFFBEF" opacity="0.25" />
        <circle cx="62" cy="62" r="17" fill="#FFFBEF" stroke="#F5B301" strokeWidth="5" />
        <path d="M74 74l14 14" stroke="#F5B301" strokeWidth="8" strokeLinecap="round" />
      </svg>
      {withWord && (
        <span className="leading-none">
          <span className="block font-black tracking-tight text-ink text-[15px]">Yellow Pages</span>
          <span className="block text-[10px] font-bold tracking-[0.18em] text-brand-deeper -mt-0.5">PAKISTAN</span>
        </span>
      )}
    </span>
  );
}
