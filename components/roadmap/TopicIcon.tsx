// TopicIcon — one icon language for the learning path.
//
// The track/topic/hub screens used to render the content files' emoji (🎲 ➕ ✖️)
// as tile icons. Emoji rasterize differently on every OS, clash with the lucide
// icons the rest of the chrome uses, and some read wrong as UI (✖️ looked like a
// "close" button on the sequences chooser). The DATA keeps its emoji — content
// files are not touched — this module just maps ids to lucide icons at render
// time, so every surface draws from the same set.
//
// Keys cover both the English 571 track slugs (content/tracks/paper-571.ts) and
// the Hebrew curriculum topic keys that the derived 572 track uses as ids
// (content/tracks/index.ts → mt.topic). Unknown ids fall back to BookOpen.

import type { LucideIcon } from 'lucide-react';
import {
  AreaChart,
  Axis3d,
  BarChart3,
  BookOpen,
  Brain,
  ChartNoAxesColumnIncreasing,
  CircleDot,
  Compass,
  Dices,
  Divide,
  FunctionSquare,
  GraduationCap,
  Grid3x3,
  MoveUpRight,
  Percent,
  Radical,
  Spline,
  Sprout,
  Target,
  TrendingUp,
  Triangle,
  Waves,
  Zap,
  Flame,
} from 'lucide-react';
import type { RoadmapLevelKind } from '@/lib/roadmap-levels';

const TOPIC_ICONS: Record<string, LucideIcon> = {
  // 571 track slugs
  sequences: BarChart3,
  probability: Dices,
  geometry: Compass,
  trigonometry: Triangle,
  'functions-rational-root': Divide,
  'trig-functions': Waves,
  'extremum-problems': Target,
  'short-questions': Zap,
  // Hebrew curriculum keys (the 572 track derives its ids from these; they are
  // also the lesson-topic names carried on every track node and passed to the
  // ladder screen, so any surface can key an icon off its lesson topic)
  'אלגברה': Radical,
  'סדרות': BarChart3,
  'הסתברות': Dices,
  'גיאומטריה אוקלידית': Compass,
  'פונקציות (יסודות)': FunctionSquare,
  'טריגונומטריה': Triangle,
  'חשבון דיפרנציאלי': TrendingUp,
  'חשבון אינטגרלי': AreaChart,
  'פונקציה מעריכית': MoveUpRight,
  'גדילה ודעיכה': Sprout,
  'פונקציית ln': Spline,
  'גאומטריה אנליטית': Grid3x3,
  'וקטורים במרחב': Axis3d,
  'מספרים מרוכבים': CircleDot,
  'סטטיסטיקה': Percent,
  'בעיות קיצון': Target,
  'בעיות תנועה': MoveUpRight,
  'בעיות גדילה ודעיכה': Sprout,
};

// Sub-track chooser (סדרות: חשבוניות/הנדסיות). Linear steps vs. multiplicative
// growth — the shapes the two sequences actually make.
const GROUP_ICONS: Record<string, LucideIcon> = {
  arithmetic: ChartNoAxesColumnIncreasing,
  geometric: TrendingUp,
};

// The ladder's level language (📖🌱⚡🔥🧠🎓) mapped to icons for the chrome
// surfaces (resume banners); the ladder screens keep their emoji for now.
const LEVEL_ICONS: Record<RoadmapLevelKind, LucideIcon> = {
  learn: BookOpen,
  easy: Sprout,
  mid: Zap,
  hard: Flame,
  ghost: Brain,
  bagrut: GraduationCap,
};

export function topicIconFor(id: string): LucideIcon {
  return TOPIC_ICONS[id] ?? BookOpen;
}

export function groupIconFor(id: string): LucideIcon {
  return GROUP_ICONS[id] ?? BookOpen;
}

export function levelIconFor(kind: RoadmapLevelKind): LucideIcon {
  return LEVEL_ICONS[kind] ?? BookOpen;
}

export function TopicIcon({
  id,
  className,
  strokeWidth = 1.75,
}: {
  id: string;
  className?: string;
  strokeWidth?: number;
}) {
  const Icon = topicIconFor(id);
  return <Icon aria-hidden="true" className={className} strokeWidth={strokeWidth} />;
}
