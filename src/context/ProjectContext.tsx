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
import { readProjectRecord, writeProjectRecord } from '@/utils/projectStorage';

const STORAGE_KEY = 'water-services-projects';
const ACTIVE_KEY = 'water-services-active';

interface ProjectContextValue {
  storageError: string;
  storageBackend: 'Loading' | 'IndexedDB' | 'Browser storage';
  lastSavedAt: string | null;
  lastBackupAt: string | null;
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
  studentMode: boolean;
  setStudentMode: (enabled: boolean) => void;
  toggleStudentMode: () => void;
}

const ProjectContext = createContext<ProjectContextValue | null>(null);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [storageError, setStorageError] = useState('');
  const [storageBackend, setStorageBackend] = useState<'Loading' | 'IndexedDB' | 'Browser storage'>('Loading');
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [lastBackupAt, setLastBackupAt] = useState<string | null>(() => {
    try { return localStorage.getItem('swd-last-json-backup'); } catch { return null; }
  });
  const [storageReady, setStorageReady] = useState(false);
  const [studentMode, setStudentModeState] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('swd-student-mode');
      return stored !== 'false';
    } catch {
      return true;
    }
  });

  const setStudentMode = useCallback((enabled: boolean) => {
    setStudentModeState(enabled);
    try {
      localStorage.setItem('swd-student-mode', String(enabled));
    } catch {
      // ignore
    }
  }, []);

  const toggleStudentMode = useCallback(() => {
    setStudentModeState((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('swd-student-mode', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);
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

  // Prefer IndexedDB and migrate existing browser-local records on first load.
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const storedActive = await readProjectRecord<unknown>(ACTIVE_KEY);
        const legacyActive = localStorage.getItem(ACTIVE_KEY);
        const active = storedActive ?? (legacyActive ? JSON.parse(legacyActive) : undefined);
        if (active) {
          const parsed = parseProject(active);
          setProjectState(parsed);
          if (storedActive === undefined) await writeProjectRecord(ACTIVE_KEY, parsed);
        }

        const storedProjects = await readProjectRecord<unknown>(STORAGE_KEY);
        const legacyProjects = localStorage.getItem(STORAGE_KEY);
        const rawProjects = storedProjects ?? (legacyProjects ? JSON.parse(legacyProjects) : []);
        if (Array.isArray(rawProjects)) {
          const parsedProjects = rawProjects.flatMap((entry) => {
            try {
              return typeof entry.name === 'string' ? [{ name: entry.name, data: parseProject(entry.data) }] : [];
            } catch {
              return [];
            }
          });
          setSavedProjects(parsedProjects);
          if (storedProjects === undefined) await writeProjectRecord(STORAGE_KEY, parsedProjects);
        }
        if (!cancelled) setStorageBackend('IndexedDB');
      } catch {
        if (!cancelled) {
          setStorageBackend('Browser storage');
          setStorageError('Using browser storage fallback. Export a JSON backup regularly.');
        }
      } finally {
        if (!cancelled) setStorageReady(true);
      }
    };
    void load();
    return () => { cancelled = true; };
  }, []);

  // Keep a localStorage safety copy while using IndexedDB as the primary store.
  useEffect(() => {
    if (!storageReady) return;
    const savedAt = new Date().toISOString();
    let fallbackSaved = false;
    try {
      localStorage.setItem(ACTIVE_KEY, JSON.stringify(project));
      fallbackSaved = true;
    } catch {
      // IndexedDB remains the primary storage if the browser copy is full.
    }
    void writeProjectRecord(ACTIVE_KEY, project).then(() => {
      setStorageBackend('IndexedDB');
      setStorageError('');
      setLastSavedAt(savedAt);
    }).catch(() => {
      setStorageBackend('Browser storage');
      setStorageError(fallbackSaved ? 'IndexedDB is unavailable; changes are saved in this browser. Export a JSON backup regularly.' : 'Automatic save failed. Export a JSON backup before closing this page.');
      if (fallbackSaved) setLastSavedAt(savedAt);
    });
  }, [project, storageReady]);

  useEffect(() => {
    if (!storageReady) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(savedProjects)); } catch { /* IndexedDB remains primary */ }
    void writeProjectRecord(STORAGE_KEY, savedProjects).catch(() => {
      setStorageBackend('Browser storage');
      setStorageError('Saved project list is using browser storage fallback. Export JSON backups regularly.');
    });
  }, [savedProjects, storageReady]);

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
    const exportedAt = new Date().toISOString();
    setLastBackupAt(exportedAt);
    try { localStorage.setItem('swd-last-json-backup', exportedAt); } catch { /* backup itself has already been downloaded */ }
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
        storageBackend,
        lastSavedAt,
        lastBackupAt,
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
        studentMode,
        setStudentMode,
        toggleStudentMode,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useProject(): ProjectContextValue {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error('useProject must be used within ProjectProvider');
  return ctx;
}
