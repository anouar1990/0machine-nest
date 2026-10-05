'use client';

import React from 'react';
import { HeroScore } from './HeroScore';
import { GameStatsCards } from './GameStatsCards';
import { DailyMissionCard } from './DailyMissionCard';
import { XPLevelCard } from './XPLevelCard';
import { AchievementCard } from './AchievementCard';
import { PersonalRecordsCard } from './PersonalRecordsCard';
import { RecentMissionsCard } from './RecentMissionsCard';

export const DashboardView: React.FC = () => {
  return (
    <div className="flex-1 overflow-y-auto bg-[#07090e] p-6 md:p-8 space-y-6">
      {/* Top Hero Score Banner */}
      <HeroScore />

      {/* 4 Core Game Stats Cards */}
      <GameStatsCards />

      {/* Grid Layout: Missions & XP System */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DailyMissionCard />
        <XPLevelCard />
      </div>

      {/* Personal Bests & Recent Projects */}
      <PersonalRecordsCard />
      <RecentMissionsCard />

      {/* Achievements Grid */}
      <AchievementCard />
    </div>
  );
};
