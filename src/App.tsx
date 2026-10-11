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

function AppContent() {
  const {
    project,
    results,
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
  const [activeView, setActiveView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [saveName, setSaveName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Export event listeners
  useEffect(() => {
    const runExport = async (format: 'PDF' | 'Excel' | 'Word') => {
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
    const handlePrint = () => window.print();

    window.addEventListener('export-pdf', handlePDF);
    window.addEventListener('export-xlsx', handleXLSX);
    window.addEventListener('export-docx', handleDOCX);
    window.addEventListener('print-report', handlePrint);

    return () => {
      window.removeEventListener('export-pdf', handlePDF);
      window.removeEventListener('export-xlsx', handleXLSX);
      window.removeEventListener('export-docx', handleDOCX);
      window.removeEventListener('print-report', handlePrint);
    };
  }, [project, results]);

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
        return <Dashboard />;
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
        return <StepDesignReview />;
      case 'step15':
        return <StepReport />;
      default:
        return <Dashboard />;
    }
  };

  const criticalWarnings = results.warnings.filter((w) => w.level === 'critical').length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      {/* Modern Application Header */}
      <AppHeader
        projectName={project.projectInfo.projectName}
        designStage={project.projectInfo.designStage}
        location={project.projectInfo.location}
        studentMode={studentMode}
        onToggleStudentMode={toggleStudentMode}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        sidebarOpen={sidebarOpen}
        onSave={() => setShowSaveDialog(true)}
        onLoad={() => setShowLoadDialog(true)}
        onImport={() => fileInputRef.current?.click()}
        onExport={exportJSON}
        onReset={resetProject}
        onSample={loadSampleProject}
        fileInputRef={fileInputRef}
        handleImportFile={handleImport}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Accordion Categorized 5-Phase Sidebar */}
        <aside
          className={`
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-30
            w-72 bg-white border-r border-slate-200 overflow-hidden
            transition-transform duration-200 print:hidden
            pt-14 lg:pt-0 shadow-lg lg:shadow-none flex flex-col
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
          />
        </aside>

        {/* Overlay Backdrop for Mobile Drawer */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Calculation Canvas */}
        <main className="flex-1 min-w-0 overflow-y-auto bg-slate-50/70 print:bg-white">
          <div className="max-w-6xl mx-auto p-4 md:p-6 lg:p-8 print:p-0 print:max-w-none">
            {storageError && (
              <div role="alert" className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3.5 text-sm text-red-800 shadow-2xs">
                {storageError}
              </div>
            )}
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
            />

            {/* Active Step Content */}
            <div className="min-h-[500px]">
              {renderView()}
            </div>

            {/* Contextual Previous / Next Module Navigation */}
            <GuidedWorkflowFooter
              activeStepId={activeView}
              onSelectStep={setActiveView}
            />
          </div>
        </main>
      </div>

      {/* Engineering Footer */}
      <footer className="bg-white border-t border-slate-200 px-4 py-2.5 text-center print:hidden">
        <p className="text-xs text-slate-400 italic">
          This application supports preliminary engineering design, teaching, checking and documentation. Final detailed design shall be verified by a suitably qualified professional against the latest applicable regulations, authority requirements, site conditions, manufacturer data and project specifications.
        </p>
      </footer>

      {/* SAVE DIALOG */}
      {showSaveDialog && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={() => setShowSaveDialog(false)}
        >
          <div
            className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-bold text-slate-800 mb-3">Save Project</h3>
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
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={() => setShowLoadDialog(false)}
        >
          <div
            className="bg-white rounded-xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-bold text-slate-800 mb-3">Saved Projects</h3>
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
    </div>
  );
}

function App() {
  return (
    <ProjectProvider>
      <AppContent />
    </ProjectProvider>
  );
}

export default App;
