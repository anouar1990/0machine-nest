import React, { useState } from 'react';
import { useNestStore } from '../../state/useNestStore';
import { projectService } from '../../services/projectService';
import { NestProject } from '../../core/types';
import { Folder, Plus, Trash2, Copy, Play, Edit3, Check, X, Calendar, Layers, Activity } from 'lucide-react';

export function ProjectManagerModal() {
  const { projectsModalOpen, setProjectsModalOpen, loadProject, createNewProject, currentProjectId } = useNestStore();
  const [projects, setProjects] = useState<NestProject[]>(() => projectService.getProjects());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  if (!projectsModalOpen) return null;

  const refreshProjects = () => {
    setProjects(projectService.getProjects());
  };

  const handleCreateNew = () => {
    createNewProject();
    setProjectsModalOpen(false);
  };

  const handleLoad = (id: string) => {
    loadProject(id);
    setProjectsModalOpen(false);
  };

  const handleDuplicate = (id: string) => {
    projectService.duplicateProject(id);
    refreshProjects();
  };

  const handleDelete = (id: string) => {
    projectService.deleteProject(id);
    refreshProjects();
  };

  const startRename = (p: NestProject) => {
    setEditingId(p.id);
    setEditingName(p.name);
  };

  const saveRename = (id: string) => {
    if (editingName.trim()) {
      projectService.renameProject(id, editingName.trim());
      refreshProjects();
    }
    setEditingId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-[#0b0f19] border border-cyan-500/30 rounded-2xl shadow-2xl shadow-cyan-950/40 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cyan-900/40 bg-[#0d1322]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Folder className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide">Project Manager</h2>
              <p className="text-xs text-slate-400">Open, duplicate, rename or manage your nesting projects</p>
            </div>
          </div>
          <button
            onClick={() => setProjectsModalOpen(false)}
            className="w-8 h-8 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Bar */}
        <div className="px-6 py-3 border-b border-slate-800/60 bg-[#090d16] flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">
            {projects.length} {projects.length === 1 ? 'Saved Project' : 'Saved Projects'}
          </span>
          <button
            onClick={handleCreateNew}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-cyan-950/50 transition-all hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" />
            New Nest Project
          </button>
        </div>

        {/* Projects Grid / List */}
        <div className="p-6 overflow-y-auto flex-1 space-y-3">
          {projects.length === 0 ? (
            <div className="py-16 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-cyan-950/30 border border-cyan-500/20 flex items-center justify-center text-cyan-500 mx-auto">
                <Folder className="w-8 h-8 opacity-60" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-200">NO PROJECTS YET</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Create your first nesting project to optimize material usage and save cut stock.
                </p>
              </div>
              <button
                onClick={handleCreateNew}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium rounded-xl transition-colors inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Create New Project
              </button>
            </div>
          ) : (
            projects.map((p) => {
              const isCurrent = p.id === currentProjectId;
              const isEditing = editingId === p.id;

              return (
                <div
                  key={p.id}
                  className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    isCurrent
                      ? 'bg-cyan-950/20 border-cyan-500/50 shadow-md shadow-cyan-950/30'
                      : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && saveRename(p.id)}
                            className="bg-slate-800 border border-cyan-500/50 rounded-md px-2 py-1 text-xs text-white focus:outline-none"
                            autoFocus
                          />
                          <button
                            onClick={() => saveRename(p.id)}
                            className="text-cyan-400 hover:text-cyan-300 p-1"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <h4 className="text-sm font-bold text-white truncate flex items-center gap-2">
                          {p.name}
                          {isCurrent && (
                            <span className="px-2 py-0.5 text-[10px] bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-full font-medium">
                              Active
                            </span>
                          )}
                        </h4>
                      )}
                      {!isEditing && (
                        <button
                          onClick={() => startRename(p)}
                          className="text-slate-500 hover:text-slate-300 p-1"
                          title="Rename project"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5 text-slate-500" />
                        {p.sheetWidth}×{p.sheetHeight}mm
                      </span>
                      <span className="flex items-center gap-1">
                        <Activity className="w-3.5 h-3.5 text-cyan-400" />
                        Score: <span className="font-semibold text-cyan-400">{p.score || 0}</span>
                      </span>
                      <span className="flex items-center gap-1 text-slate-500">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(p.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleLoad(p.id)}
                      className="px-3 py-1.5 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
                    >
                      <Play className="w-3.5 h-3.5" />
                      Open
                    </button>
                    <button
                      onClick={() => handleDuplicate(p.id)}
                      className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition-colors"
                      title="Duplicate project"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="p-2 bg-slate-800 hover:bg-rose-900/60 text-slate-400 hover:text-rose-400 rounded-lg text-xs transition-colors"
                      title="Delete project"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
