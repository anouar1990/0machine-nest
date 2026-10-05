'use client';

import React, { useState } from 'react';
import { useNestStore } from '../../state/useNestStore';
import { projectService } from '../../services/projectService';
import { NestProject } from '../../core/types';
import { FolderOpen, Layers, ArrowRight, Plus, Copy, Trash2, Calendar } from 'lucide-react';

export const RecentMissionsCard: React.FC = () => {
  const { loadProject, createNewProject, setProjectsModalOpen } = useNestStore();
  const [projects, setProjects] = useState<NestProject[]>(() => projectService.getProjects());

  const handleOpen = (id: string) => {
    loadProject(id);
  };

  const handleDuplicate = (id: string) => {
    projectService.duplicateProject(id);
    setProjects(projectService.getProjects());
  };

  const handleDelete = (id: string) => {
    projectService.deleteProject(id);
    setProjects(projectService.getProjects());
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 shadow-xl backdrop-blur-md space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FolderOpen className="w-5 h-5 text-cyan-400" />
          <h3 className="text-sm font-bold text-white tracking-wider font-mono">
            YOUR WORKSHOP PROJECTS
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => createNewProject()}
            className="px-3 py-1 bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-bold rounded-lg flex items-center gap-1 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            NEW PROJECT
          </button>
          <button
            onClick={() => setProjectsModalOpen(true)}
            className="text-xs font-mono text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            VIEW ALL ({projects.length})
          </button>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="p-8 text-center bg-slate-950/40 rounded-xl border border-slate-800 space-y-2">
          <p className="text-xs text-slate-400">No saved projects yet. Start a new nesting project!</p>
          <button
            onClick={() => createNewProject()}
            className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg transition-colors inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Create First Project
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {projects.slice(0, 4).map((proj) => (
            <div
              key={proj.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-950/60 border border-slate-800 rounded-lg hover:border-slate-700 transition-all"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-white font-mono">
                    {proj.name}
                  </h4>
                  <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                    SCORE: {proj.score || 0}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
                  <span className="flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-slate-500" />
                    {proj.sheetWidth}x{proj.sheetHeight}mm
                  </span>
                  <span>•</span>
                  <span>{proj.parts?.length || 0} parts</span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-slate-500">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(proj.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpen(proj.id)}
                  className="px-3.5 py-1.5 bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-semibold rounded-md transition-colors flex items-center gap-1"
                >
                  OPEN
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDuplicate(proj.id)}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md text-xs transition-colors"
                  title="Duplicate project"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(proj.id)}
                  className="p-1.5 bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 rounded-md text-xs transition-colors"
                  title="Delete project"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
