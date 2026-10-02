import { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard, Settings, Users, Droplets, FlaskConical,
  Warehouse, Fuel, Trash2, CloudRain, Recycle, Flame, Leaf,
  ClipboardCheck, FileText, Calculator, BookOpen, Download,
  Upload, Save, FolderOpen, RefreshCw, Menu, X,
  ChevronLeft, ChevronRight, AlertTriangle, CheckCircle2,
} from 'lucide-react';
import { ProjectProvider, useProject } from '@/context/ProjectContext';
import { StepPipeDesign } from '@/components/PipeDesign';
import {
  StepProjectDetails, StepOccupancy, StepDomesticWater, StepSpecialWater,
  StepWaterBalance, StepPeakDemand, StepStorage, StepPumpDesign,
  StepWastewater, StepRainwater, StepGreywater, StepFireWater,
  StepSustainability, StepDesignReview, StepReport, Dashboard,
  StepStandards,
} from '@/components/steps';
import { ProgressRing } from '@/components/ui';

interface NavItem {
  id: string;
  label: string;
  icon: typeof LayoutDashboard;
  step?: number;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'standards', label: 'Standards & Design Basis', icon: BookOpen },
  { id: 'step1', label: 'Project Details', icon: Settings, step: 1 },
  { id: 'step2', label: 'Occupancy', icon: Users, step: 2 },
  { id: 'step3', label: 'Domestic Water', icon: Droplets, step: 3 },
  { id: 'step4', label: 'Special Water Uses', icon: FlaskConical, step: 4 },
  { id: 'step5', label: 'Water Balance', icon: Droplets, step: 5 },
  { id: 'step6', label: 'Peak Fixture Demand', icon: Calculator, step: 6 },
  { id: 'step7', label: 'Storage Design', icon: Warehouse, step: 7 },
  { id: 'step8', label: 'Pump Design', icon: Fuel, step: 8 },
  { id: 'pipes', label: 'Pipework Design', icon: Calculator },
  { id: 'step9', label: 'Wastewater', icon: Trash2, step: 9 },
  { id: 'step10', label: 'Rainwater Harvesting', icon: CloudRain, step: 10 },
  { id: 'step11', label: 'Greywater Reuse', icon: Recycle, step: 11 },
  { id: 'step12', label: 'Fire Water', icon: Flame, step: 12 },
  { id: 'step13', label: 'Sustainability', icon: Leaf, step: 13 },
  { id: 'step14', label: 'Design Review', icon: ClipboardCheck, step: 14 },
  { id: 'step15', label: 'Report & Export', icon: FileText, step: 15 },
];

function AppContent() {
  const {
    project, results, savedProjects, storageError,
    saveProject, deleteProject, loadProject,
    loadSampleProject, resetProject, duplicateProject,
    exportJSON, importJSON,
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
      } catch (error) { setFeedback(`Export failed: ${error instanceof Error ? error.message : 'Please try again.'}`); }
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
      void importJSON(file).then(() => setFeedback('Project imported.')).catch(error => setFeedback(`Import failed: ${error.message}`));
      e.target.value = '';
    }
  };

  const handleSave = () => {
    const name = saveName || project.projectInfo.projectName || 'Untitled';
    try { saveProject(name); } catch { return; }
    setShowSaveDialog(false);
    setSaveName('');
  };

  const renderView = () => {
    switch (activeView) {
      case 'dashboard': return <Dashboard />;
      case 'standards': return <StepStandards />;
      case 'step1': return <StepProjectDetails />;
      case 'step2': return <StepOccupancy />;
      case 'step3': return <StepDomesticWater />;
      case 'step4': return <StepSpecialWater />;
      case 'step5': return <StepWaterBalance />;
      case 'step6': return <StepPeakDemand />;
      case 'step7': return <StepStorage />;
      case 'step8': return <StepPumpDesign />;
      case 'pipes': return <StepPipeDesign />;
      case 'step9': return <StepWastewater />;
      case 'step10': return <StepRainwater />;
      case 'step11': return <StepGreywater />;
      case 'step12': return <StepFireWater />;
      case 'step13': return <StepSustainability />;
      case 'step14': return <StepDesignReview />;
      case 'step15': return <StepReport />;
      default: return <Dashboard />;
    }
  };

  const navigateStep = (direction: 'prev' | 'next') => {
    const stepOrder = ['dashboard', 'standards', 'step1', 'step2', 'step3', 'step4', 'step5', 'step6', 'step7', 'step8', 'pipes', 'step9', 'step10', 'step11', 'step12', 'step13', 'step14', 'step15'];
    const idx = stepOrder.indexOf(activeView);
    if (direction === 'prev' && idx > 0) setActiveView(stepOrder[idx - 1]);
    if (direction === 'next' && idx < stepOrder.length - 1) setActiveView(stepOrder[idx + 1]);
  };

  const criticalWarnings = results.warnings.filter(w => w.level === 'critical').length;
  const hasWarnings = results.warnings.length > 0;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* TOP BAR */}
      <header className="bg-white border-b border-slate-200 px-4 py-2.5 flex flex-wrap gap-2 items-center justify-between sticky top-0 z-40 print:hidden">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-1.5 rounded hover:bg-slate-100"
            aria-label="Toggle navigation"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-2">
            <Droplets className="w-6 h-6 text-blue-600" />
            <div>
              <h1 className="text-sm font-bold text-slate-800 hidden sm:block">Smart Water Services Design System</h1>
              <h1 className="text-sm font-bold text-slate-800 sm:hidden">Water Services</h1>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button onClick={loadSampleProject} className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 border border-blue-300 rounded-md hover:bg-blue-50 transition-colors">
            <BookOpen className="w-3.5 h-3.5" /> Sample
          </button>
          <button onClick={() => setShowSaveDialog(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-600 border border-green-300 rounded-md hover:bg-green-50 transition-colors">
            <Save className="w-3.5 h-3.5" /> Save
          </button>
          <button onClick={() => setShowLoadDialog(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 border border-slate-300 rounded-md hover:bg-slate-50 transition-colors">
            <FolderOpen className="w-3.5 h-3.5" /> Load
          </button>
          <label className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-600 border border-amber-300 rounded-md hover:bg-amber-50 transition-colors cursor-pointer">
            <Upload className="w-3.5 h-3.5" /> Import
            <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>
          <button onClick={exportJSON} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 border border-slate-300 rounded-md hover:bg-slate-50 transition-colors">
            <Download className="w-3.5 h-3.5" /> Export
          </button>
          <button onClick={resetProject} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 border border-red-300 rounded-md hover:bg-red-50 transition-colors">
            <RefreshCw className="w-3.5 h-3.5" /> Reset
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* SIDEBAR */}
        <aside className={`
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-30
          w-64 bg-white border-r border-slate-200 overflow-y-auto
          transition-transform duration-200 print:hidden
          pt-14 lg:pt-0
        `}>
          <nav className="p-3 space-y-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveView(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors
                    ${isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}
                  `}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {item.step && (
                    <span className={`flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold ${
                      isActive ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'
                    }`}>
                      {item.step}
                    </span>
                  )}
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Status summary in sidebar */}
          <div className="p-3 border-t border-slate-200 mt-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-500">Completion</span>
              <ProgressRing pct={results.completionPct} size={36} />
            </div>
            <div className="flex items-center gap-2 text-xs">
              {criticalWarnings > 0 ? (
                <span className="flex items-center gap-1 text-red-600">
                  <AlertTriangle className="w-3 h-3" /> {criticalWarnings} critical
                </span>
              ) : hasWarnings ? (
                <span className="flex items-center gap-1 text-amber-600">
                  <AlertTriangle className="w-3 h-3" /> {results.warnings.length} warnings
                </span>
              ) : (
                <span className="flex items-center gap-1 text-green-600">
                  <CheckCircle2 className="w-3 h-3" /> No warnings
                </span>
              )}
            </div>
          </div>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/20 z-20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* MAIN CONTENT */}
        <main className="flex-1 min-w-0 overflow-y-auto bg-slate-50 print:bg-white">
          <div className="max-w-6xl mx-auto p-4 md:p-6 lg:p-8 print:p-0 print:max-w-none">
            {storageError && <div role="alert" className="mb-4 rounded bg-red-50 p-3 text-red-800">{storageError}</div>}
            {feedback && <div role="status" className="mb-4 rounded-md bg-blue-50 border border-blue-200 p-3 text-sm print:hidden">{feedback}<button className="ml-3 underline" onClick={() => setFeedback('')}>Dismiss</button></div>}
            {renderView()}

            {/* Navigation buttons */}
            <div className="flex items-center justify-between mt-8 pt-4 border-t border-slate-200 print:hidden">
              <button
                disabled={activeView === 'dashboard'}
                onClick={() => navigateStep('prev')}
                className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-slate-600 border border-slate-300 rounded-md hover:bg-white transition-colors"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>
              <button
                disabled={activeView === 'step15'}
                onClick={() => navigateStep('next')}
                className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </main>
      </div>

      {/* FOOTER */}
      <footer className="bg-white border-t border-slate-200 px-4 py-2 text-center print:hidden">
        <p className="text-xs text-slate-400 italic">
          This application supports preliminary engineering design, teaching, checking and documentation. Final detailed design shall be verified by a suitably qualified professional against the latest applicable regulations, authority requirements, site conditions, manufacturer data and project specifications.
        </p>
      </footer>

      {/* SAVE DIALOG */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowSaveDialog(false)}>
          <div className="bg-white rounded-lg p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-800 mb-4">Save Project</h3>
            <input
              type="text"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder={project.projectInfo.projectName || 'Project name'}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm mb-4 focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowSaveDialog(false)} className="px-4 py-2 text-sm text-slate-600 border border-slate-300 rounded-md hover:bg-slate-50">Cancel</button>
              <button onClick={handleSave} className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* LOAD DIALOG */}
      {showLoadDialog && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowLoadDialog(false)}>
          <div className="bg-white rounded-lg p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-800 mb-4">Saved Projects</h3>
            {savedProjects.length === 0 ? (
              <p className="text-sm text-slate-500 py-4 text-center">No saved projects yet. Use "Save" to store the current project.</p>
            ) : (
              <div className="space-y-2">
                {savedProjects.map((sp) => (
                  <div key={sp.name} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div>
                      <div className="text-sm font-medium text-slate-700">{sp.name}</div>
                      <div className="text-xs text-slate-400">{sp.data.projectInfo.location} — {sp.data.projectInfo.date}</div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { loadProject(sp.data); setShowLoadDialog(false); }} className="px-3 py-1 text-xs text-blue-600 border border-blue-300 rounded hover:bg-blue-50">Load</button>
                      <button onClick={() => duplicateProject(sp.name)} className="px-3 py-1 text-xs text-slate-600 border border-slate-300 rounded hover:bg-slate-100">Duplicate</button>
                      <button onClick={() => deleteProject(sp.name)} className="px-3 py-1 text-xs text-red-600 border border-red-300 rounded hover:bg-red-50">Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4 flex gap-2 justify-end">
              <button onClick={() => setShowLoadDialog(false)} className="px-4 py-2 text-sm text-slate-600 border border-slate-300 rounded-md hover:bg-slate-50">Close</button>
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
