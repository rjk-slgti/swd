import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import type { ProjectData, AllResults, FactorOverride } from '@/types';
import { createEmptyProject, createSampleProject, defaultWPSFFactors } from '@/data/defaults';
import { calculateAll } from '@/calculations/engine';
import { parseProject } from '@/utils/projectValidation';

const STORAGE_KEY = 'water-services-projects';
const ACTIVE_KEY = 'water-services-active';

interface ProjectContextValue {
  storageError: string;
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
  overrideWPSFFactor: (factorId: string, newValue: number, reason: string, reference?: string) => void;
  resetWPSFFactor: (factorId: string) => void;
  resetAllWPSFFactors: () => void;
}

const ProjectContext = createContext<ProjectContextValue | null>(null);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [storageError, setStorageError] = useState('');
  const [project, setProjectState] = useState<ProjectData>(() => {
    try {
      const active = localStorage.getItem(ACTIVE_KEY);
      if (active) {
        return parseProject(JSON.parse(active));
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
        const list: unknown = JSON.parse(saved);
        if (Array.isArray(list)) {
          setSavedProjects(
            list.flatMap((entry) => {
              try {
                return typeof entry.name === 'string'
                  ? [{ name: entry.name, data: parseProject(entry.data) }]
                  : [];
              } catch {
                return [];
              }
            })
          );
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // Persist active project to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(ACTIVE_KEY, JSON.stringify(project));
      setStorageError('');
    } catch {
      setStorageError('Automatic save failed. Export a JSON backup before closing this page.');
    }
  }, [project]);

  // Recalculate results whenever project changes
  const results = useMemo(() => calculateAll(project), [project]);

  const setProject = useCallback(
    (updater: ProjectData | ((prev: ProjectData) => ProjectData)) => {
      setProjectState((prev) =>
        typeof updater === 'function' ? (updater as (p: ProjectData) => ProjectData)(prev) : updater
      );
    },
    []
  );

  const loadProject = useCallback((data: ProjectData) => {
    setProjectState(parseProject(data));
  }, []);

  const saveProject = useCallback(
    (name: string) => {
      const updated = [
        ...savedProjects.filter((p) => p.name !== name),
        { name, data: structuredClone(project) },
      ];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        setSavedProjects(updated);
        setStorageError('');
      } catch {
        setStorageError('Project could not be saved. Storage may be full; export a JSON backup.');
        throw new Error('Project could not be saved.');
      }
    },
    [project, savedProjects]
  );

  const deleteProject = useCallback(
    (name: string) => {
      const updated = savedProjects.filter((p) => p.name !== name);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        setSavedProjects(updated);
      } catch {
        setStorageError('Saved project could not be deleted.');
      }
    },
    [savedProjects]
  );

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
        let copyName = `${name} (Copy)`;
        let suffix = 2;
        while (savedProjects.some((p) => p.name === copyName)) copyName = `${name} (Copy ${suffix++})`;
        const data = structuredClone(found.data);
        data.projectInfo.projectName = copyName;
        const updated = [...savedProjects, { name: copyName, data }];
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
          setSavedProjects(updated);
          setProjectState(data);
        } catch {
          setStorageError('Project could not be duplicated. Export a JSON backup.');
        }
      }
    },
    [savedProjects]
  );

  const exportJSON = useCallback(() => {
    const filename = `Water_Services_Project_${project.projectInfo.projectName.replace(/[^a-zA-Z0-9]/g, '_')}.json`;
    const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, [project]);

  const importJSON = useCallback(async (file: File) => {
    if (file.size > 5_000_000) throw new Error('Project files must be under 5 MB.');
    const text = await file.text();
    const data = parseProject(JSON.parse(text));
    setProjectState(parseProject(data));
  }, []);

  // Override WPSF factor with user audit trail
  const overrideWPSFFactor = useCallback(
    (factorId: string, newValue: number, reason: string, reference?: string) => {
      setProjectState((prev) => {
        const factor = (prev.wpsfFactors ?? defaultWPSFFactors).find((f) => f.id === factorId);
        if (!factor) return prev;

        const override: FactorOverride = {
          factorId,
          originalValue: factor.defaultValue,
          newValue,
          reason,
          source: 'User Override',
          reference: reference || 'Project-specific specification',
          changedBy: prev.projectInfo.designer || 'User',
          date: new Date().toISOString().split('T')[0],
          revision: prev.projectInfo.revision || 'P01',
        };

        const updatedFactors = (prev.wpsfFactors ?? defaultWPSFFactors).map((f) =>
          f.id === factorId
            ? { ...f, value: newValue, classification: 'USER OVERRIDE' as const, overrideDetails: override }
            : f
        );

        const updatedOverrides = [
          ...(prev.factorOverrides ?? []).filter((o) => o.factorId !== factorId),
          override,
        ];

        // Also update corresponding active project parameters if applicable
        const updated = {
          ...prev,
          wpsfFactors: updatedFactors,
          factorOverrides: updatedOverrides,
        };

        if (factorId === 'WPSF-OCC-01') {
          updated.occupancy = updated.occupancy.map((g) =>
            g.id === 'OCC-01' ? { ...g, consumptionFactor: newValue, classification: 'USER OVERRIDE' } : g
          );
        } else if (factorId === 'WPSF-DIV-01') {
          updated.demandBasis = { ...updated.demandBasis, lossAllowancePct: newValue };
        } else if (factorId === 'WPSF-DIV-02') {
          updated.demandBasis = { ...updated.demandBasis, maxDayFactor: newValue };
        } else if (factorId === 'WPSF-WW-01') {
          updated.wastewater = { ...updated.wastewater, sewerReturnFactor: newValue };
        } else if (factorId === 'WPSF-STR-01') {
          updated.storage = { ...updated.storage, storageDuration: newValue };
        }

        return updated;
      });
    },
    []
  );

  // Reset WPSF factor to default
  const resetWPSFFactor = useCallback((factorId: string) => {
    setProjectState((prev) => {
      const defaultFactor = defaultWPSFFactors.find((f) => f.id === factorId);
      if (!defaultFactor) return prev;

      const updatedFactors = (prev.wpsfFactors ?? defaultWPSFFactors).map((f) =>
        f.id === factorId
          ? {
              ...f,
              value: defaultFactor.defaultValue,
              classification: defaultFactor.classification,
              overrideDetails: undefined,
            }
          : f
      );

      const updatedOverrides = (prev.factorOverrides ?? []).filter((o) => o.factorId !== factorId);

      const updated = {
        ...prev,
        wpsfFactors: updatedFactors,
        factorOverrides: updatedOverrides,
      };

      if (factorId === 'WPSF-OCC-01') {
        updated.occupancy = updated.occupancy.map((g) =>
          g.id === 'OCC-01' ? { ...g, consumptionFactor: defaultFactor.defaultValue, classification: 'PROTOTYPE STANDARD FACTOR' } : g
        );
      } else if (factorId === 'WPSF-DIV-01') {
        updated.demandBasis = { ...updated.demandBasis, lossAllowancePct: defaultFactor.defaultValue };
      } else if (factorId === 'WPSF-DIV-02') {
        updated.demandBasis = { ...updated.demandBasis, maxDayFactor: defaultFactor.defaultValue };
      } else if (factorId === 'WPSF-WW-01') {
        updated.wastewater = { ...updated.wastewater, sewerReturnFactor: defaultFactor.defaultValue };
      } else if (factorId === 'WPSF-STR-01') {
        updated.storage = { ...updated.storage, storageDuration: defaultFactor.defaultValue };
      }

      return updated;
    });
  }, []);

  // Reset all WPSF factors
  const resetAllWPSFFactors = useCallback(() => {
    setProjectState((prev) => ({
      ...prev,
      wpsfFactors: defaultWPSFFactors.map((f) => ({ ...f })),
      factorOverrides: [],
    }));
  }, []);

  return (
    <ProjectContext.Provider
      value={{
        storageError,
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
        overrideWPSFFactor,
        resetWPSFFactor,
        resetAllWPSFFactors,
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
