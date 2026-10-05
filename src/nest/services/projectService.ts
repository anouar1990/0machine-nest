import { NestProject, Sheet, Part } from '../core/types';

const LOCAL_STORAGE_KEY = 'zeromachine_nest_projects';

let inMemoryProjects: NestProject[] = [];

/**
 * Project Persistence Service (Supabase Ready + LocalStorage Local-First Storage)
 */
export const projectService = {
  /**
   * Saves or updates a nesting project.
   */
  async saveProject(
    id: string | undefined,
    name: string,
    sheet: Sheet,
    sheets: Sheet[],
    parts: Part[],
    score: number,
    materialPresetId?: string
  ): Promise<NestProject> {
    const existingProjects = this.getProjects();
    const existing = id ? existingProjects.find((p) => p.id === id) : null;

    const projectId = id || `proj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const project: NestProject = {
      id: projectId,
      name: name || 'Untitled Nest',
      sheetWidth: sheet.width,
      sheetHeight: sheet.height,
      sheetMargin: sheet.margin,
      partSpacing: sheet.spacing,
      sheets: sheets && sheets.length > 0 ? sheets : [sheet],
      parts,
      score,
      materialPresetId,
      createdAt: existing ? existing.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = [project, ...existingProjects.filter((p) => p.id !== project.id)];
    inMemoryProjects = updated;
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    }

    return project;
  },

  /**
   * Retrieves all saved projects ordered by latest updated date.
   */
  getProjects(): NestProject[] {
    if (typeof window !== 'undefined') {
      try {
        const data = localStorage.getItem(LOCAL_STORAGE_KEY);
        const parsed: NestProject[] = data ? JSON.parse(data) : [];
        return parsed.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      } catch {
        return inMemoryProjects;
      }
    }
    return [...inMemoryProjects].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  },

  /**
   * Loads a specific project by ID.
   */
  getProjectById(id: string): NestProject | null {
    const projects = this.getProjects();
    return projects.find((p) => p.id === id) || null;
  },

  /**
   * Duplicates a project by ID.
   */
  duplicateProject(id: string): NestProject | null {
    const existing = this.getProjectById(id);
    if (!existing) return null;

    const dupId = `proj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const duplicate: NestProject = {
      ...JSON.parse(JSON.stringify(existing)),
      id: dupId,
      name: `${existing.name} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const all = [duplicate, ...this.getProjects()];
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(all));
    }

    return duplicate;
  },

  /**
   * Renames a project by ID.
   */
  renameProject(id: string, newName: string): NestProject | null {
    const projects = this.getProjects();
    const target = projects.find((p) => p.id === id);
    if (!target) return null;

    target.name = newName;
    target.updatedAt = new Date().toISOString();

    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(projects));
    }

    return target;
  },

  /**
   * Deletes a project by ID.
   */
  deleteProject(id: string): void {
    const existing = this.getProjects();
    const filtered = existing.filter((p) => p.id !== id);
    inMemoryProjects = filtered;
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered));
    }
  },
};
