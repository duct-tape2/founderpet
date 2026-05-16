import { PetStage, PetMood } from "@/lib/pet-engine";

export interface LeaderboardEntry {
  rank: number;
  handle: string;
  avatar: string;
  level: number;
  stage: PetStage;
  mood: PetMood;
  exp: number;
  monthlyRevenue: number;
  totalRevenue: number;
  commits: number;
  agentRuns: number;
  weeklyDelta: number; // % up/down this week
  projectName: string;
  online: boolean;
}

// Mock leaderboard — will be replaced by Supabase realtime query later
export const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  {
    rank: 1,
    handle: "@swyx",
    avatar: "🦄",
    level: 28,
    stage: PetStage.DRAGON_OR_PHOENIX,
    mood: PetMood.CELEBRATING,
    exp: 2891,
    monthlyRevenue: 18500,
    totalRevenue: 124000,
    commits: 312,
    agentRuns: 1488,
    weeklyDelta: 12.4,
    projectName: "Latent.Space + smol-podcaster",
    online: true,
  },
  {
    rank: 2,
    handle: "@levelsio",
    avatar: "🌴",
    level: 24,
    stage: PetStage.DRAGON_OR_PHOENIX,
    mood: PetMood.CELEBRATING,
    exp: 2410,
    monthlyRevenue: 14200,
    totalRevenue: 89200,
    commits: 198,
    agentRuns: 920,
    weeklyDelta: 8.1,
    projectName: "Photo AI + nomadlist",
    online: true,
  },
  {
    rank: 3,
    handle: "@dvassallo",
    avatar: "🏖️",
    level: 22,
    stage: PetStage.DRAGON_OR_PHOENIX,
    mood: PetMood.FOCUSED,
    exp: 2240,
    monthlyRevenue: 11800,
    totalRevenue: 76500,
    commits: 156,
    agentRuns: 612,
    weeklyDelta: 5.3,
    projectName: "Small Bets + courses",
    online: false,
  },
  {
    rank: 4,
    handle: "@marcrlovesyou",
    avatar: "✨",
    level: 18,
    stage: PetStage.FOUNDER_BIRD,
    mood: PetMood.CELEBRATING,
    exp: 1820,
    monthlyRevenue: 8400,
    totalRevenue: 42000,
    commits: 124,
    agentRuns: 510,
    weeklyDelta: 22.7,
    projectName: "ShipFast SaaS boilerplate",
    online: true,
  },
  {
    rank: 5,
    handle: "@dagorenouf",
    avatar: "🎨",
    level: 16,
    stage: PetStage.FOUNDER_BIRD,
    mood: PetMood.FOCUSED,
    exp: 1640,
    monthlyRevenue: 6900,
    totalRevenue: 35200,
    commits: 98,
    agentRuns: 412,
    weeklyDelta: 3.2,
    projectName: "Logoshape + dailyme",
    online: true,
  },
  {
    rank: 6,
    handle: "@duct-tape2",
    avatar: "🤖",
    level: 12,
    stage: PetStage.WORKER_BIRD,
    mood: PetMood.FOCUSED,
    exp: 1240,
    monthlyRevenue: 3400,
    totalRevenue: 12500,
    commits: 71,
    agentRuns: 284,
    weeklyDelta: 41.2,
    projectName: "FounderPet (this thing) + 4 micro SaaS",
    online: true,
  },
  {
    rank: 7,
    handle: "@anthilemoon",
    avatar: "🌙",
    level: 11,
    stage: PetStage.WORKER_BIRD,
    mood: PetMood.HAPPY,
    exp: 1110,
    monthlyRevenue: 2800,
    totalRevenue: 11200,
    commits: 64,
    agentRuns: 198,
    weeklyDelta: -2.4,
    projectName: "Lemon Squeezy templates",
    online: false,
  },
  {
    rank: 8,
    handle: "@yongfook",
    avatar: "🎯",
    level: 10,
    stage: PetStage.WORKER_BIRD,
    mood: PetMood.FOCUSED,
    exp: 990,
    monthlyRevenue: 2100,
    totalRevenue: 9400,
    commits: 52,
    agentRuns: 174,
    weeklyDelta: 7.8,
    projectName: "Bannerbear API",
    online: true,
  },
  {
    rank: 9,
    handle: "@tonyennis",
    avatar: "🌊",
    level: 7,
    stage: PetStage.BIRD,
    mood: PetMood.HAPPY,
    exp: 720,
    monthlyRevenue: 1100,
    totalRevenue: 4200,
    commits: 41,
    agentRuns: 92,
    weeklyDelta: 18.2,
    projectName: "Mochi flashcards alternative",
    online: true,
  },
  {
    rank: 10,
    handle: "@hyunseop_kim",
    avatar: "⚡",
    level: 5,
    stage: PetStage.BIRD,
    mood: PetMood.HAPPY,
    exp: 480,
    monthlyRevenue: 420,
    totalRevenue: 1240,
    commits: 28,
    agentRuns: 64,
    weeklyDelta: 35.0,
    projectName: "Korean SMB AI consulting",
    online: true,
  },
];

export function formatRevenue(amount: number): string {
  if (amount >= 1000) return `$${(amount / 1000).toFixed(1)}K`;
  return `$${amount}`;
}

export function stageEmoji(stage: PetStage): string {
  return {
    [PetStage.EGG]: "🥚",
    [PetStage.CHICK]: "🐣",
    [PetStage.BIRD]: "🐤",
    [PetStage.WORKER_BIRD]: "👷",
    [PetStage.FOUNDER_BIRD]: "👑",
    [PetStage.DRAGON_OR_PHOENIX]: "🐉",
  }[stage];
}
