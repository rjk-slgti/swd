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
import { normalizeProjectHistory, readProjectRecord, writeProjectRecord } from '@/utils/projectStorage';

const STORAGE_KEY = 'water-services-projects';
const ACTIVE_KEY = 'water-services-active';
const HISTORY_KEY = 'water-services-history-v1';
const LEGACY_HISTORY_KEY = 'swd-project-history-v1';
const createVersionId = () => typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;

export interface ProjectVersion { id: string; savedAt: string; label: string; data: ProjectData }

function persistHistory(versions: ProjectVersion[], onFallback: () => void) {
  void writeProjectRecord(HISTORY_KEY, versions).catch(() => {
    try { localStorage.setItem(LEGACY_HISTORY_KEY, JSON.stringify(versions.slice(0, 3))); } catch { /* best-effort fallback */ }
    onFallback();
  });
}

interface ProjectContextValue {
  storageError: string;
  storageBackend: 'Loading' | 'IndexedDB' | 'Browser storage';
  lastSavedAt: string | null;
  lastBackupAt: string | null;
  versionHistory: ProjectVersion[];
  project: ProjectData;
  results: AllResults;
  savedProjects: { name: string; data: ProjectData }[];
  setProject: (updater: ProjectData | ((prev: ProjectData) => ProjectData)) => void;
  loadProject: (data: ProjectData) => void;
  saveProject: (name: string) => void;
  restoreVersion: (id: string) => void;
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
  const [versionHistory, setVersionHistory] = useState<ProjectVersion[]>([]);
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
      let indexedDbAvailable = true;
      let storedActive: unknown;
      let storedProjects: unknown;
      let storedHistory: unknown;
      try { storedActive = await readProjectRecord<unknown>(ACTIVE_KEY); } catch { indexedDbAvailable = false; }
      let legacyActive: unknown;
      let legacyProjects: unknown;
      try { const value = localStorage.getItem(ACTIVE_KEY); legacyActive = value ? JSON.parse(value) : undefined; } catch { /* corrupted browser copy is ignored */ }
      if (cancelled) return;
      const active = storedActive ?? legacyActive;
      if (active) {
        try {
          const parsed = parseProject(active);
          setProjectState(parsed);
          if (storedActive === undefined && indexedDbAvailable) {
            try { await writeProjectRecord(ACTIVE_KEY, parsed); } catch { indexedDbAvailable = false; }
          }
        } catch { /* keep the initialized empty project if both stored copies are invalid */ }
      }
      try { storedProjects = await readProjectRecord<unknown>(STORAGE_KEY); } catch { indexedDbAvailable = false; }
      try { const value = localStorage.getItem(STORAGE_KEY); legacyProjects = value ? JSON.parse(value) : []; } catch { legacyProjects = []; }
      const rawProjects = storedProjects ?? legacyProjects;
      if (Array.isArray(rawProjects)) {
        const parsedProjects = rawProjects.flatMap((entry) => {
          try { return typeof entry.name === 'string' ? [{ name: entry.name, data: parseProject(entry.data) }] : []; }
          catch { return []; }
        });
        setSavedProjects(parsedProjects);
        if (storedProjects === undefined && indexedDbAvailable) {
          try { await writeProjectRecord(STORAGE_KEY, parsedProjects); } catch { indexedDbAvailable = false; }
        }
      }
      if (indexedDbAvailable) {
        try { storedHistory = await readProjectRecord<unknown>(HISTORY_KEY); } catch { indexedDbAvailable = false; }
      }
      if (storedHistory === undefined) {
        try { const localHistory = localStorage.getItem(LEGACY_HISTORY_KEY); storedHistory = localHistory ? JSON.parse(localHistory) : undefined; } catch { /* corrupted history copy is ignored */ }
      }
      if (Array.isArray(storedHistory)) {
        const parsedHistory = normalizeProjectHistory(storedHistory, parseProject);
        setVersionHistory(parsedHistory);
        if (indexedDbAvailable) {
          try { await writeProjectRecord(HISTORY_KEY, parsedHistory); }
          catch { indexedDbAvailable = false; try { localStorage.setItem(LEGACY_HISTORY_KEY, JSON.stringify(parsedHistory.slice(0, 3))); } catch { /* best-effort fallback */ } }
        }
      }
      if (!cancelled) {
        setStorageBackend(indexedDbAvailable ? 'IndexedDB' : 'Browser storage');
        if (!indexedDbAvailable) setStorageError('Using browser storage fallback. Export a JSON backup regularly.');
        setStorageReady(true);
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
    const timer = window.setTimeout(() => {
      void writeProjectRecord(ACTIVE_KEY, project).then(async () => {
        setStorageBackend('IndexedDB');
        setStorageError('');
        setLastSavedAt(savedAt);
        const latest = versionHistory[0];
        const age = latest ? Date.now() - new Date(latest.savedAt).getTime() : Infinity;
        if (age >= 15 * 60 * 1000) {
          const version: ProjectVersion = { id: createVersionId(), savedAt, label: 'Automatic recovery point', data: structuredClone(project) };
          const updated = [version, ...versionHistory].slice(0, 20);
          setVersionHistory(updated);
          await writeProjectRecord(HISTORY_KEY, updated).catch(() => {
            try { localStorage.setItem(LEGACY_HISTORY_KEY, JSON.stringify(updated.slice(0, 3))); } catch { /* best-effort fallback */ }
          });
        }
      }).catch(() => {
        setStorageBackend('Browser storage');
        setStorageError(fallbackSaved ? 'IndexedDB is unavailable; changes are saved in this browser. Export a JSON backup regularly.' : 'Automatic save failed. Export a JSON backup before closing this page.');
        if (fallbackSaved) setLastSavedAt(savedAt);
      });
    }, 450);
    return () => window.clearTimeout(timer);
  }, [project, storageReady, versionHistory]);

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
        setStorageError('');
      } catch {
        setStorageError('Browser storage is full; the named save will be stored in IndexedDB.');
      }
      setSavedProjects(updated);
      const version: ProjectVersion = { id: createVersionId(), savedAt: new Date().toISOString(), label: `Saved project: ${name}`, data: structuredClone(project) };
      const updatedHistory = [version, ...versionHistory].slice(0, 20);
      setVersionHistory(updatedHistory);
      persistHistory(updatedHistory, () => setStorageError('IndexedDB is unavailable; a smaller recovery history is kept in browser storage.'));
    },
    [project, savedProjects, versionHistory]
  );

  const restoreVersion = useCallback((id: string) => {
    const version = versionHistory.find(entry => entry.id === id);
    if (!version) return;
    const beforeRestore: ProjectVersion = { id: createVersionId(), savedAt: new Date().toISOString(), label: 'Before version restore', data: structuredClone(project) };
    const updatedHistory = [beforeRestore, ...versionHistory].slice(0, 20);
    setVersionHistory(updatedHistory);
    persistHistory(updatedHistory, () => setStorageError('IndexedDB is unavailable; a smaller recovery history is kept in browser storage.'));
    setProjectState(parseProject(structuredClone(version.data)));
  }, [versionHistory, project]);

  const deleteProject = useCallback(
    (name: string) => {
      const updated = savedProjects.filter((p) => p.name !== name);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch { setStorageError('Browser storage could not be updated; the project list is saving to IndexedDB.'); }
      setSavedProjects(updated);
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
        } catch { setStorageError('Browser storage is full; the duplicate is saving to IndexedDB.'); }
        setSavedProjects(updated);
        setProjectState(data);
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
        versionHistory,
        project,
        results,
        savedProjects,
        setProject,
        loadProject,
        saveProject,
        restoreVersion,
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
