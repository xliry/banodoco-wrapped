
export interface Milestone {
  count: number;
  date: string;
  daysFromStart: number;
  label?: string;
}

export interface Contributor {
  rank: number;
  username: string;
  messages: number;
  avatar: string;
}

export interface Award {
  username: string;
  count?: number;
  metric?: string;
  avgTime?: string;
  timezone?: string;
}

export interface ModelTrend {
  month: string;
  sd: number;
  flux: number;
  wan: number;
  comfy: number;
  animatediff: number;
}

export interface HeatmapData {
  hour: number;
  data: number[];
}

export interface ChannelStat {
  name: string;
  messages: number;
  percentage: number;
}

export interface MillionthMessage {
  author: string;
  channel: string;
  content: string;
  timestamp: string;
}

export interface SpriteCoords {
  x: number;
  y: number;
}

export interface GridItemData {
  id: number;
  coords: SpriteCoords;
}

export interface AppData {
  totalMessages: number;
  totalMembers: number;
  totalChannels: number;
  dateRange: { start: string; end: string };
  milestones: Milestone[];
  topContributors: Contributor[];
  awards: {
    mostHelpful: Award;
    mostThankful: Award;
    nightOwl: Award;
    earlyBird: Award;
  };
  modelTrends: ModelTrend[];
  activityHeatmap: HeatmapData[];
  channelStats: ChannelStat[];
  funStats: {
    longestMessage: { chars: number; username: string };
    mostRepliedThread: { replies: number; topic: string };
    busiestDay: { date: string; messages: number; reason: string };
    mostUsedEmoji: { emoji: string; count: number };
    mostUsedWord: { word: string; count: number };
  };
  millionthMessage: MillionthMessage;
}
