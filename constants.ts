
import { AppData } from './types';

export const demoData: AppData = {
  totalMessages: 1000000,
  totalMembers: 12847,
  totalChannels: 45,
  dateRange: { start: "2022-03-15", end: "2025-01-28" },
  
  milestones: [
    { count: 100000, date: "2023-03-20", daysFromStart: 370, label: "The First 100K" },
    { count: 250000, date: "2023-08-15", daysFromStart: 518, label: "Scaling Up" },
    { count: 500000, date: "2024-01-10", daysFromStart: 666, label: "Halfway There!" },
    { count: 750000, date: "2024-07-22", daysFromStart: 860, label: "Exponential Growth" },
    { count: 1000000, date: "2025-01-15", daysFromStart: 1037, label: "THE MILLION!" },
  ],
  
  topContributors: [
    { rank: 1, username: "Kijai", messages: 45200, avatar: "#7C3AED" },
    { rank: 2, username: "ComfyMaster", messages: 32100, avatar: "#10B981" },
    { rank: 3, username: "FluxFan", messages: 28500, avatar: "#F59E0B" },
    { rank: 4, username: "WanExplorer", messages: 24300, avatar: "#EF4444" },
    { rank: 5, username: "AIArtist42", messages: 21800, avatar: "#3B82F6" },
  ],
  
  awards: {
    mostHelpful: { username: "Kijai", count: 2341, metric: "helpful replies" },
    mostThankful: { username: "GratefulUser", count: 1823, metric: "thank yous" },
    nightOwl: { username: "NightCoder", avgTime: "3:24 AM", timezone: "UTC" },
    earlyBird: { username: "MorningPerson", avgTime: "6:15 AM", timezone: "UTC" },
  },
  
  modelTrends: [
    { month: "2023-01", sd: 4500, flux: 0, wan: 0, comfy: 2100, animatediff: 800 },
    { month: "2023-06", sd: 5200, flux: 0, wan: 0, comfy: 3400, animatediff: 1200 },
    { month: "2024-01", sd: 4800, flux: 1200, wan: 500, comfy: 4100, animatediff: 900 },
    { month: "2024-06", sd: 3200, flux: 4500, wan: 1800, comfy: 4800, animatediff: 600 },
    { month: "2024-09", sd: 2100, flux: 6200, wan: 3500, comfy: 5200, animatediff: 400 },
    { month: "2025-01", sd: 1800, flux: 5800, wan: 5200, comfy: 5500, animatediff: 300 },
  ],
  
  activityHeatmap: [
    { hour: 0, data: [120, 115, 118, 122, 130, 180, 175] },
    { hour: 3, data: [60, 55, 65, 58, 70, 90, 85] },
    { hour: 6, data: [45, 48, 42, 50, 55, 40, 35] },
    { hour: 9, data: [110, 120, 115, 130, 125, 80, 75] },
    { hour: 12, data: [220, 235, 228, 240, 210, 150, 140] },
    { hour: 15, data: [310, 320, 315, 330, 300, 240, 230] },
    { hour: 18, data: [380, 395, 385, 400, 360, 320, 310] },
    { hour: 21, data: [350, 340, 360, 355, 380, 390, 370] },
  ],
  
  channelStats: [
    { name: "#general", messages: 230000, percentage: 23 },
    { name: "#comfy-help", messages: 180000, percentage: 18 },
    { name: "#showcase", messages: 150000, percentage: 15 },
    { name: "#wan-discussion", messages: 120000, percentage: 12 },
    { name: "#flux", messages: 90000, percentage: 9 },
    { name: "Other", messages: 230000, percentage: 23 },
  ],
  
  funStats: {
    longestMessage: { chars: 4892, username: "DetailedExplainer" },
    mostRepliedThread: { replies: 156, topic: "Flux vs SD debate" },
    busiestDay: { date: "2024-08-01", messages: 847, reason: "Flux release day" },
    mostUsedEmoji: { emoji: "🔥", count: 45230 },
    mostUsedWord: { word: "workflow", count: 89450 },
  },
  
  millionthMessage: {
    author: "LuckyUser",
    channel: "#general",
    content: "Has anyone tried the new Wan 2.2 update? The quality is insane!",
    timestamp: "2025-01-15T14:32:18Z",
  }
};
