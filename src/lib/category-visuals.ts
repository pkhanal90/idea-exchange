import {
  Sparkles,
  Landmark,
  HeartPulse,
  ShoppingBag,
  LayoutGrid,
  Users,
  Store,
  Leaf,
  GraduationCap,
  Terminal,
  Cpu,
  Dna,
  Gamepad2,
  CircleDot,
  type LucideIcon,
} from "lucide-react";
import type { IndustryCategory } from "@prisma/client";

interface CategoryVisual {
  icon: LucideIcon;
  gradient: string; // header band on cards
  chip: string; // small pill background + text
}

export const CATEGORY_VISUALS: Record<IndustryCategory, CategoryVisual> = {
  AI_ML: { icon: Sparkles, gradient: "from-indigo-500 to-indigo-700", chip: "bg-indigo-50 text-indigo-700" },
  FINTECH: { icon: Landmark, gradient: "from-emerald-500 to-emerald-700", chip: "bg-emerald-50 text-emerald-700" },
  HEALTHTECH: { icon: HeartPulse, gradient: "from-rose-500 to-rose-700", chip: "bg-rose-50 text-rose-700" },
  ECOMMERCE: { icon: ShoppingBag, gradient: "from-amber-500 to-amber-700", chip: "bg-amber-50 text-amber-700" },
  SAAS_B2B: { icon: LayoutGrid, gradient: "from-blue-500 to-blue-700", chip: "bg-blue-50 text-blue-700" },
  CONSUMER_SOCIAL: { icon: Users, gradient: "from-pink-500 to-pink-700", chip: "bg-pink-50 text-pink-700" },
  MARKETPLACE: { icon: Store, gradient: "from-orange-500 to-orange-700", chip: "bg-orange-50 text-orange-700" },
  CLIMATE_ENERGY: { icon: Leaf, gradient: "from-green-500 to-green-700", chip: "bg-green-50 text-green-700" },
  EDTECH: { icon: GraduationCap, gradient: "from-cyan-500 to-cyan-700", chip: "bg-cyan-50 text-cyan-700" },
  DEVTOOLS: { icon: Terminal, gradient: "from-violet-500 to-violet-700", chip: "bg-violet-50 text-violet-700" },
  HARDWARE_IOT: { icon: Cpu, gradient: "from-slate-500 to-slate-700", chip: "bg-slate-100 text-slate-700" },
  BIOTECH: { icon: Dna, gradient: "from-teal-500 to-teal-700", chip: "bg-teal-50 text-teal-700" },
  GAMING: { icon: Gamepad2, gradient: "from-fuchsia-500 to-fuchsia-700", chip: "bg-fuchsia-50 text-fuchsia-700" },
  OTHER: { icon: CircleDot, gradient: "from-zinc-500 to-zinc-700", chip: "bg-zinc-100 text-zinc-700" },
};
