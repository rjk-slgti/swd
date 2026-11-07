import { useState, useEffect, useRef } from 'react';
import { ProjectProvider, useProject } from '@/context/ProjectContext';
import { StepPipeDesign } from '@/components/PipeDesign';
import {
  StepProjectDetails,
  StepOccupancy,
  StepDomesticWater,
  StepSpecialWater,
  StepWaterBalance,
  StepPeakDemand,
  StepStorage,
  StepPumpDesign,
  StepWastewater,
  StepRainwater,
  StepGreywater,
  StepFireWater,
  StepSustainability,
  StepDesignReview,
  StepReport,
  Dashboard,
  StepStandards,
  StepHotWater,
  StepSubMetering,
} from '@/components/steps';
import {
  AppHeader,
  WorkflowPhaseStepper,
  WorkflowSidebar,
  GuidedWorkflowFooter,
} from '@/components/WorkflowNavigation';
import { LiveTelemetryPane } from '@/components/LiveTelemetryPane';
import { SmartAutoPilotModal } from '@/components/SmartAutoPilotModal';
import { GuidedIntake } from '@/components/GuidedIntake';
import { Activity } from 'lucide-react';
import { SystemSchematic } from '@/components/SystemSchematic';
import { getStepById } from '@/data/workflowPhases';
import { MobileResultsSheet } from '@/components/MobileResultsSheet';
import { I18nProvider, useI18n } from '@/i18n/I18nContext';

function AppContent() {
  const { language, setLanguage } = useI18n();
  const {
    project,
    results,
    storageBackend,
    lastSavedAt,
    lastBackupAt,
    savedProjects,
    storageError,
    saveProject,
    deleteProject,
    loadProject,
    loadSampleProject,
    resetProject,
    duplicateProject,
    exportJSON,
    importJSON,
    studentMode,
    toggleStudentMode,
  } = useProject();

  const [feedback, setFeedback] = useState('');
  const [activeView, setActiveView] = useState(() => {
    try {
      const requestedView = window.location.hash.slice(1);
      if (requestedView && getStepById(requestedView)) return requestedView;
      const hasActive = Boolean(localStorage.getItem('water-services-active'));
      const hasDraft = Boolean(localStorage.getItem('swd-intake-draft-v1'));
      return hasActive && !hasDraft ? 'dashboard' : 'intake';
    }
    catch { return 'intake'; }
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [telemetryOpen, setTelemetryOpen] = useState(true);
  const [mobileTelemetryOpen, setMobileTelemetryOpen] = useState(false);
  const [showAutoPilotModal, setShowAutoPilotModal] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [saveName, setSaveName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const trainingPeakExample = project.peakDesign.source.startsWith('TRAINING-EXAMPLE:');
  const fireCriteriaUnconfirmed = project.fireWater.enabled && (
    project.fireWater.classification !== 'USER OVERRIDE' ||
    !project.fireWater.source.trim() ||
    /required|verify/i.test(project.fireWater.source)
  );

  useEffect(() => {
    if (activeView !== 'intake' && getStepById(activeView)) {
      window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}#${activeView}`);
    }
  }, [activeView]);

  const handleToggleTelemetry = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 1280) {
      setMobileTelemetryOpen((prev) => !prev);
    } else {
      setTelemetryOpen((prev) => !prev);
    }
  };

  // Export & modal event listeners
  useEffect(() => {
    const runExport = async (format: 'PDF' | 'Excel' | 'Word') => {
      if (trainingPeakExample) {
        setFeedback('Final report export is blocked while the training peak-flow example is active. Replace it with a documented project calculation first.');
        return;
      }
      if (fireCriteriaUnconfirmed) {
        setFeedback('Final report export is blocked while enabled fire-water criteria remain unconfirmed. Add a project source and confirm the flow and duration first.');
        return;
      }
      setFeedback(`Preparing ${format} export…`);
      try {
        const exports = await import('@/exports/exportModules');
        await exports[`export${format}`](project, results);
        setFeedback(`${format} export generated.`);
      } catch (error) {
        setFeedback(`Export failed: ${error instanceof Error ? error.message : 'Please try again.'}`);
      }
    };
    const handlePDF = () => { void runExport('PDF'); };
    const handleXLSX = () => { void runExport('Excel'); };
    const handleDOCX = () => { void runExport('Word'); };
    const handlePrint = () => {
      if (trainingPeakExample) {
        setFeedback('Printing a final report is blocked while the training peak-flow example is active. Replace it with a documented project calculation first.');
        return;
      }
      if (fireCriteriaUnconfirmed) {
        setFeedback('Printing a final report is blocked while enabled fire-water criteria remain unconfirmed. Add a project source and confirm the flow and duration first.');
        return;
      }
      window.print();
    };
    const handleOpenAutoPilot = () => setShowAutoPilotModal(true);

    window.addEventListener('export-pdf', handlePDF);
    window.addEventListener('export-xlsx', handleXLSX);
    window.addEventListener('export-docx', handleDOCX);
    window.addEventListener('print-report', handlePrint);
    window.addEventListener('open-autopilot', handleOpenAutoPilot);

    return () => {
      window.removeEventListener('export-pdf', handlePDF);
      window.removeEventListener('export-xlsx', handleXLSX);
      window.removeEventListener('export-docx', handleDOCX);
      window.removeEventListener('print-report', handlePrint);
      window.removeEventListener('open-autopilot', handleOpenAutoPilot);
    };
  }, [project, results, trainingPeakExample, fireCriteriaUnconfirmed]);

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      void importJSON(file)
        .then(() => setFeedback('Project imported.'))
        .catch((error) => setFeedback(`Import failed: ${error.message}`));
      e.target.value = '';
    }
  };

  const handleSave = () => {
    const name = saveName || project.projectInfo.projectName || 'Untitled';
    try {
      saveProject(name);
    } catch {
      return;
    }
    setShowSaveDialog(false);
    setSaveName('');
  };

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard onSelectStep={setActiveView} />;
      case 'standards':
        return <StepStandards />;
      case 'step1':
        return <StepProjectDetails />;
      case 'step2':
        return <StepOccupancy />;
      case 'step3':
        return <StepDomesticWater />;
      case 'step4':
        return <StepSpecialWater />;
      case 'step5':
        return <StepWaterBalance />;
      case 'step6':
        return <StepPeakDemand />;
      case 'step7':
        return <StepStorage />;
      case 'step8':
        return <StepPumpDesign />;
      case 'pipes':
        return <StepPipeDesign />;
      case 'step9':
        return <StepWastewater />;
      case 'step10':
        return <StepRainwater />;
      case 'step11':
        return <StepGreywater />;
      case 'hotwater':
        return <StepHotWater />;
      case 'step12':
        return <StepFireWater />;
      case 'submetering':
        return <StepSubMetering />;
      case 'step13':
        return <StepSustainability />;
      case 'step14':
        return <StepDesignReview onSelectStep={setActiveView} />;
      case 'step15':
        return <StepReport />;
      default:
        return <Dashboard onSelectStep={setActiveView} />;
    }
  };

  const criticalWarnings = results.warnings.filter((w) => w.level === 'critical').length;

  if (activeView === 'intake') {
    return <><a className="skip-link" href="#intake-main">Skip to project setup</a><GuidedIntake onComplete={() => setActiveView('dashboard')} onEngineer={() => setActiveView('dashboard')} onSample={() => { loadSampleProject(); setActiveView('dashboard'); }} /></>;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      <a className="skip-link" href="#main-content">Skip to main content</a>
      {/* Modern Application Header */}
      <AppHeader
        projectName={project.projectInfo.projectName}
        designStage={project.projectInfo.designStage}
        location={project.projectInfo.location}
        studentMode={studentMode}
        language={language}
        onLanguageChange={setLanguage}
        onToggleStudentMode={toggleStudentMode}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        sidebarOpen={sidebarOpen}
        telemetryOpen={telemetryOpen}
        onToggleTelemetry={handleToggleTelemetry}
        onOpenAutoPilot={() => setShowAutoPilotModal(true)}
        onSave={() => setShowSaveDialog(true)}
        onLoad={() => setShowLoadDialog(true)}
        onImport={() => fileInputRef.current?.click()}
        onExport={exportJSON}
        onReset={resetProject}
        onSample={loadSampleProject}
        fileInputRef={fileInputRef}
        handleImportFile={handleImport}
      />

      <div className="flex flex-1 overflow-hidden relative">
        {/* Accordion Categorized 5-Phase Sidebar */}
        <aside
          className={`
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-30
            w-72 bg-white border-r border-slate-200 overflow-hidden
            transition-transform duration-200 print:hidden
            pt-14 lg:pt-0 shadow-lg lg:shadow-none flex flex-col flex-shrink-0
          `}
        >
          <WorkflowSidebar
            activeStepId={activeView}
            onSelectStep={(stepId) => {
              setActiveView(stepId);
              setSidebarOpen(false);
            }}
            completionPct={results.completionPct}
            criticalWarningsCount={criticalWarnings}
            totalWarningsCount={results.warnings.length}
            moduleCompleteness={results.moduleCompleteness}
            warnings={results.warnings}
          />
        </aside>

        {/* Overlay Backdrop for Mobile Drawer */}
        {sidebarOpen && (
          <button
            type="button"
            aria-label="Close navigation menu"
            className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Calculation Canvas */}
        <main id="main-content" tabIndex={-1} className="flex-1 min-w-0 overflow-y-auto bg-slate-50/70 pb-16 xl:pb-0 print:bg-white">
          <div className="max-w-5xl mx-auto p-4 md:p-6 lg:p-8 print:p-0 print:max-w-none">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 print:hidden">
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-[11px] text-slate-500" role="status">{lastSavedAt ? `Saved ${new Date(lastSavedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · ${storageBackend === 'IndexedDB' ? 'on this device' : 'browser fallback'}` : 'Saving project…'}</p>
                {(!lastBackupAt || Date.now() - new Date(lastBackupAt).getTime() > 30 * 24 * 60 * 60 * 1000) && <button type="button" onClick={exportJSON} className="text-[11px] font-semibold text-amber-800 underline">Download a JSON backup</button>}
              </div>
              <button onClick={() => setActiveView('intake')} className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs font-semibold text-blue-800 hover:bg-blue-50">Easy mode: project intake</button>
            </div>
            {storageError && (
              <div role="alert" className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3.5 text-sm text-red-800 shadow-2xs">
                {storageError}
              </div>
            )}
            {trainingPeakExample && <div role="alert" className="mb-4 border-2 border-dashed border-red-400 bg-red-50 p-3 text-sm font-bold uppercase tracking-wide text-red-800">Training example active — all final report exports and print are blocked until this value is replaced.</div>}
            {fireCriteriaUnconfirmed && <div role="alert" className="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">Fire-water criteria need a cited project source and your confirmation. Final report exports and print are blocked until confirmed.</div>}
            {feedback && (
              <div
                role="status"
                className="mb-4 rounded-lg bg-blue-50 border border-blue-200 p-3.5 text-xs text-blue-800 shadow-2xs flex items-center justify-between print:hidden"
              >
                <span>{feedback}</span>
                <button
                  className="font-semibold underline ml-3 text-blue-900"
                  onClick={() => setFeedback('')}
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Horizontal Phase Stepper & Sub-Module Ribbon */}
            <WorkflowPhaseStepper
              activeStepId={activeView}
              onSelectStep={setActiveView}
              moduleCompleteness={results.moduleCompleteness}
              warnings={results.warnings}
            />

            {/* Active Step Content */}
            <div className="min-h-[500px]">
              {activeView === 'dashboard' && <SystemSchematic onSelectStep={setActiveView} />}
              {renderView()}
            </div>

            {/* Contextual Previous / Next Module Navigation */}
            <GuidedWorkflowFooter
              activeStepId={activeView}
              onSelectStep={setActiveView}
            />
          </div>
        </main>

        {/* Right: Persistent Live Telemetry & Executive Dashboard HUD */}
        {telemetryOpen && (
          <aside className="hidden xl:flex flex-col w-96 flex-shrink-0 border-l border-slate-800 bg-slate-900 overflow-hidden shadow-2xl z-20 print:hidden transition-all duration-200">
            <LiveTelemetryPane
              activeStepId={activeView}
              onSelectStep={(stepId) => setActiveView(stepId)}
              onClose={() => setTelemetryOpen(false)}
            />
          </aside>
        )}

        {/* Collapsed Docked Tab (Desktop) */}
        {!telemetryOpen && (
          <button
            onClick={() => setTelemetryOpen(true)}
            className="hidden xl:flex fixed right-0 top-1/2 -translate-y-1/2 z-20 bg-slate-900 border-l-2 border-t border-b border-blue-500 text-blue-400 py-3.5 px-2 rounded-l-xl shadow-2xl flex-col items-center gap-2 hover:bg-slate-800 hover:text-white transition-all group"
            title="Open Live Telemetry HUD"
          >
            <Activity className="w-4 h-4 animate-pulse text-emerald-400" />
            <span className="[writing-mode:vertical-lr] rotate-180 text-[10px] font-bold tracking-widest uppercase text-slate-300 group-hover:text-white">
              Live HUD
            </span>
          </button>
        )}

        {/* Mobile / Tablet Drawer for Telemetry */}
        {mobileTelemetryOpen && (
          <div className="xl:hidden fixed inset-0 z-50 flex justify-end">
            <button
              type="button"
              aria-label="Close live results panel"
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
              onClick={() => setMobileTelemetryOpen(false)}
            />
            <div className="relative w-full max-w-sm sm:max-w-md bg-slate-900 h-full shadow-2xl z-10 overflow-hidden">
              <LiveTelemetryPane
                activeStepId={activeView}
                onSelectStep={(stepId) => {
                  setActiveView(stepId);
                  setMobileTelemetryOpen(false);
                }}
                onClose={() => setMobileTelemetryOpen(false)}
                isMobileDrawer={true}
              />
            </div>
          </div>
        )}
      </div>

      <MobileResultsSheet />

      {/* Engineering Footer */}
      <footer className="bg-white border-t border-slate-200 px-4 py-2.5 text-center print:hidden">
        <p className="text-xs text-slate-400 italic">
          This application supports preliminary engineering design, teaching, checking and documentation. Final detailed design shall be verified by a suitably qualified professional against the latest applicable regulations, authority requirements, site conditions, manufacturer data and project specifications.
        </p>
      </footer>

      {/* SAVE DIALOG */}
      {showSaveDialog && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="save-dialog-title"
          tabIndex={-1}
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onKeyDown={(e) => { if (e.key === 'Escape') setShowSaveDialog(false); }}
          onClick={() => setShowSaveDialog(false)}
        >
          <div
            className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="save-dialog-title" className="text-base font-bold text-slate-800 mb-3">Save Project</h3>
            <p className="text-xs text-slate-500 mb-3">
              Enter a name to save this design state locally in your browser storage.
            </p>
            <input
              type="text"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder={project.projectInfo.projectName || 'Project name'}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm mb-4 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowSaveDialog(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-xs"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LOAD DIALOG */}
      {showLoadDialog && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="load-dialog-title"
          tabIndex={-1}
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onKeyDown={(e) => { if (e.key === 'Escape') setShowLoadDialog(false); }}
          onClick={() => setShowLoadDialog(false)}
        >
          <div
            className="bg-white rounded-xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="load-dialog-title" className="text-base font-bold text-slate-800 mb-3">Saved Projects</h3>
            {savedProjects.length === 0 ? (
              <p className="text-sm text-slate-500 py-6 text-center">
                No saved projects found. Use &quot;Save&quot; to store your current project.
              </p>
            ) : (
              <div className="space-y-2">
                {savedProjects.map((sp) => (
                  <div
                    key={sp.name}
                    className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200/80 rounded-lg"
                  >
                    <div>
                      <div className="text-sm font-semibold text-slate-800">{sp.name}</div>
                      <div className="text-xs text-slate-500">
                        {sp.data.projectInfo.location} — {sp.data.projectInfo.date}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          loadProject(sp.data);
                          setShowLoadDialog(false);
                        }}
                        className="px-3 py-1 text-xs font-semibold text-blue-600 border border-blue-200 bg-white rounded-md hover:bg-blue-50"
                      >
                        Load
                      </button>
                      <button
                        onClick={() => duplicateProject(sp.name)}
                        className="px-3 py-1 text-xs font-semibold text-slate-600 border border-slate-200 bg-white rounded-md hover:bg-slate-100"
                      >
                        Duplicate
                      </button>
                      <button
                        onClick={() => deleteProject(sp.name)}
                        className="px-3 py-1 text-xs font-semibold text-red-600 border border-red-200 bg-white rounded-md hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4 flex gap-2 justify-end">
              <button
                onClick={() => setShowLoadDialog(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SMART AUTO-PILOT ORDINARY WIZARD MODAL */}
      <SmartAutoPilotModal
        isOpen={showAutoPilotModal}
        onClose={() => setShowAutoPilotModal(false)}
        onSuccess={(msg) => setFeedback(msg)}
      />
    </div>
  );
}

function App() {
  return (
    <I18nProvider>
      <ProjectProvider><AppContent /></ProjectProvider>
    </I18nProvider>
  );
}

export default App;

