'use client';

import React from 'react';
import { useNestStore } from '@/nest/state/useNestStore';
import { Toolbar } from '@/nest/components/Toolbar/Toolbar';
import { DashboardView } from '@/nest/components/Dashboard/DashboardView';
import { NestWorkspaceView } from '@/nest/components/NestWorkspace/NestWorkspaceView';
import { ProjectManagerModal } from '@/nest/components/Modals/ProjectManagerModal';
import { SheetExportModal } from '@/nest/components/Modals/SheetExportModal';
import { ScoreBreakdownModal } from '@/nest/components/Modals/ScoreBreakdownModal';
import { MaterialsModal } from '@/nest/components/Modals/MaterialsModal';
import { KeyboardShortcutsModal } from '@/nest/components/Modals/KeyboardShortcutsModal';
import { OnboardingModal } from '@/nest/components/Modals/OnboardingModal';

export default function HomePage() {
  const { activeTab } = useNestStore();

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#07090e] text-slate-100 font-sans select-none">
      {/* Top Application Navigation Toolbar */}
      <Toolbar />

      {/* View Switcher: Game Dashboard vs Professional Nest Workspace */}
      <main className="flex-1 flex overflow-hidden relative">
        {activeTab === 'dashboard' ? <DashboardView /> : <NestWorkspaceView />}
      </main>

      {/* Global Part 3 Modals */}
      <ProjectManagerModal />
      <SheetExportModal />
      <ScoreBreakdownModal />
      <MaterialsModal />
      <KeyboardShortcutsModal />
      <OnboardingModal />
    </div>
  );
}
