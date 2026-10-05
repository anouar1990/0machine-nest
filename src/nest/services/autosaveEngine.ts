import { projectService } from './projectService';
import { Sheet, Part, NestProject, AutosaveStatus } from '../core/types';

type SaveCallback = (status: AutosaveStatus, project?: NestProject) => void;

class AutosaveEngine {
  private timer: NodeJS.Timeout | null = null;
  private debounceMs = 1500; // 1.5 second debounce

  public scheduleAutosave(
    projectId: string | undefined,
    projectName: string,
    sheet: Sheet,
    sheets: Sheet[],
    parts: Part[],
    score: number,
    materialPresetId: string | undefined,
    onStatusChange: SaveCallback
  ): void {
    if (typeof window === 'undefined') return;

    onStatusChange('unsaved');

    if (this.timer) {
      clearTimeout(this.timer);
    }

    this.timer = setTimeout(async () => {
      onStatusChange('saving');
      try {
        const savedProject = await projectService.saveProject(
          projectId,
          projectName,
          sheet,
          sheets,
          parts,
          score,
          materialPresetId
        );
        onStatusChange('saved', savedProject);
      } catch (err) {
        console.error('Autosave error:', err);
        onStatusChange('error');
      }
    }, this.debounceMs);
  }

  public cancel(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}

export const autosaveEngine = new AutosaveEngine();
