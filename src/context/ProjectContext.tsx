import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import type { ProjectData, AllResults } from '@/types';
import { createEmptyProject, createSampleProject } from '@/data/defaults';
import { calculateAll } from '@/calculations/engine';

const STORAGE_KEY = 'water-services-projects';
const ACTIVE_KEY = 'water-services-active';

interface ProjectContextValue {
  project: ProjectData;
  results: AllResults;
  savedProjects: { name: string; data: ProjectData }[];
  setProject: (updater: ProjectData | ((prev: ProjectData) => ProjectData)) => void;
  loadProject: (data: ProjectData) => void;
  saveProject: (name: string) => void;
  deleteProject: (name: string) => void;
  loadSampleProject: () => void;
  resetProject: () => void;
  duplicateProject: (name: string) => void;
  exportJSON: () => void;
  importJSON: (file: File) => Promise<void>;
}

const ProjectContext = createContext<ProjectContextValue | null>(null);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [project, setProjectState] = useState<ProjectData>(() => {
    try {
      const active = localStorage.getItem(ACTIVE_KEY);
      if (active) {
        return JSON.parse(active) as ProjectData;
      }
    } catch {
      // ignore
    }
    return createEmptyProject();
  });

  const [savedProjects, setSavedProjects] = useState<{ name: string; data: ProjectData }[]>([]);

  // Load saved projects list on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setSavedProjects(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
  }, []);

  // Persist active project to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(ACTIVE_KEY, JSON.stringify(project));
    } catch {
      // ignore
    }
  }, [project]);

  // Recalculate results whenever project changes
  const results = calculateAll(project);

  const setProject = useCallback(
    (updater: ProjectData | ((prev: ProjectData) => ProjectData)) => {
      setProjectState((prev) =>
        typeof updater === 'function' ? (updater as (p: ProjectData) => ProjectData)(prev) : updater
      );
    },
    []
  );

  const loadProject = useCallback((data: ProjectData) => {
    setProjectState(data);
  }, []);

  const saveProject = useCallback(
    (name: string) => {
      setSavedProjects((prev) => {
        const filtered = prev.filter((p) => p.name !== name);
        const updated = [...filtered, { name, data: project }];
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch {
          // ignore
        }
        return updated;
      });
    },
    [project]
  );

  const deleteProject = useCallback((name: string) => {
    setSavedProjects((prev) => {
      const updated = prev.filter((p) => p.name !== name);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  }, []);

  const loadSampleProject = useCallback(() => {
    setProjectState(createSampleProject());
  }, []);

  const resetProject = useCallback(() => {
    setProjectState(createEmptyProject());
  }, []);

  const duplicateProject = useCallback(
    (name: string) => {
      const found = savedProjects.find((p) => p.name === name);
      if (found) {
        setProjectState({
          ...found.data,
          projectInfo: { ...found.data.projectInfo, projectName: `${found.data.projectInfo.projectName} (Copy)` },
        });
      }
    },
    [savedProjects]
  );

  const exportJSON = useCallback(() => {
    const filename = `Project_Data_${project.projectInfo.projectName.replace(/[^a-zA-Z0-9]/g, '_')}.json`;
    const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, [project]);

  const importJSON = useCallback(async (file: File) => {
    const text = await file.text();
    const data = JSON.parse(text) as ProjectData;
    setProjectState(data);
  }, []);

  return (
    <ProjectContext.Provider
      value={{
        project,
        results,
        savedProjects,
        setProject,
        loadProject,
        saveProject,
        deleteProject,
        loadSampleProject,
        resetProject,
        duplicateProject,
        exportJSON,
        importJSON,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject(): ProjectContextValue {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error('useProject must be used within ProjectProvider');
  return ctx;
}
