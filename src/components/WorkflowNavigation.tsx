import { useState, useMemo } from 'react';
import {
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Search,
  GraduationCap,
  CheckCircle2,
  AlertTriangle,
  Menu,
  X,
  Save,
  FolderOpen,
  Upload,
  Download,
  RefreshCw,
  BookOpen,
  Droplets,
  Layers,
  Sparkles,
  Activity,
} from 'lucide-react';
import {
  WORKFLOW_PHASES,
  ALL_STEPS,
  getPhaseForStep,
  getAdjacentSteps,
} from '@/data/workflowPhases';
import { ProgressRing } from '@/components/ui';

// ============================================================
// TOP APPLICATION HEADER
// ============================================================

interface AppHeaderProps {
  projectName: string;
  designStage: string;
  location: string;
  studentMode: boolean;
  onToggleStudentMode: () => void;
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
  telemetryOpen?: boolean;
  onToggleTelemetry?: () => void;
  onOpenAutoPilot?: () => void;
  onSave: () => void;
  onLoad: () => void;
  onImport: () => void;
  onExport: () => void;
  onReset: () => void;
  onSample: () => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleImportFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function AppHeader({
  projectName,
  designStage,
  location,
  studentMode,
  onToggleStudentMode,
  onToggleSidebar,
  sidebarOpen,
  telemetryOpen = true,
  onToggleTelemetry,
  onOpenAutoPilot,
  onSave,
  onLoad,
  onExport,
  onReset,
  onSample,
  fileInputRef,
  handleImportFile,
}: AppHeaderProps) {
  const [actionsOpen, setActionsOpen] = useState(false);

  return (
    <header className="bg-white border-b border-slate-200/90 px-4 py-2.5 flex items-center justify-between sticky top-0 z-40 shadow-2xs print:hidden">
      {/* Brand & Project Identity */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          aria-label="Toggle navigation"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-xs">
            <Droplets className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-slate-900 tracking-tight">
                Smart Water Services
              </h1>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                WPSF v1.0
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="font-medium text-slate-700 max-w-[140px] sm:max-w-[200px] truncate">
                {projectName || 'Untitled Project'}
              </span>
              {location && (
                <>
                  <span>•</span>
                  <span className="hidden md:inline max-w-[120px] truncate">{location}</span>
                </>
              )}
              {designStage && (
                <span className="hidden lg:inline px-1.5 py-0.2 rounded text-[10px] font-medium bg-slate-100 text-slate-600">
                  {designStage}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Control Actions & Student Mode Toggle */}
      <div className="flex items-center gap-2">
        {/* Student Learning Mode Switch */}
        <button
          type="button"
          onClick={onToggleStudentMode}
          title={studentMode ? 'Student Learning Mode active: Click to toggle' : 'Pro Mode active: Click to enable student derivations'}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
            studentMode
              ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-2xs hover:bg-indigo-100'
              : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-700'
          }`}
        >
          <GraduationCap className={`w-4 h-4 ${studentMode ? 'text-indigo-600' : 'text-slate-400'}`} />
          <span className="hidden sm:inline">Student Mode</span>
          <span
            className={`w-2 h-2 rounded-full ${studentMode ? 'bg-indigo-600 animate-pulse' : 'bg-slate-300'}`}
          />
        </button>

        {/* Live Telemetry HUD Switch */}
        {onToggleTelemetry && (
          <button
            type="button"
            onClick={onToggleTelemetry}
            title={telemetryOpen ? 'Collapse Right Live Telemetry Dashboard' : 'Expand Right Live Telemetry Dashboard'}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
              telemetryOpen
                ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-2xs hover:bg-blue-100'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-800'
            }`}
          >
            <Activity className={`w-4 h-4 ${telemetryOpen ? 'text-blue-600' : 'text-slate-400'}`} />
            <span className="hidden sm:inline">Live HUD</span>
            <span
              className={`w-2 h-2 rounded-full ${telemetryOpen ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}
            />
          </button>
        )}

        {/* Smart Auto-Pilot Wizard Trigger */}
        {onOpenAutoPilot && (
          <button
            type="button"
            onClick={onOpenAutoPilot}
            title="Non-technical Quick Project Auto-Calculate Wizard"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 shadow-xs hover:shadow transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
            <span>Auto-Pilot</span>
          </button>
        )}

        {/* Quick Action Buttons (Desktop) */}
        <div className="hidden md:flex items-center gap-1.5">
          <button
            onClick={onSample}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-blue-700 bg-blue-50/70 border border-blue-200/80 rounded-md hover:bg-blue-100/70 transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5" /> Sample
          </button>
          <button
            onClick={onSave}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50/70 border border-emerald-200/80 rounded-md hover:bg-emerald-100/70 transition-colors"
          >
            <Save className="w-3.5 h-3.5" /> Save
          </button>
          <button
            onClick={onLoad}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-md hover:bg-slate-100 transition-colors"
          >
            <FolderOpen className="w-3.5 h-3.5" /> Load
          </button>
          <label className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-amber-700 bg-amber-50/70 border border-amber-200/80 rounded-md hover:bg-amber-100/70 transition-colors cursor-pointer">
            <Upload className="w-3.5 h-3.5" /> Import
            <input ref={fileInputRef} type="file" accept=".json" onChange={handleImportFile} className="hidden" />
          </label>
          <button
            onClick={onExport}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-md hover:bg-slate-100 transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> Export
          </button>
          <button
            onClick={onReset}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors"
            title="Reset project"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Mobile Action Dropdown */}
        <div className="relative md:hidden">
          <button
            onClick={() => setActionsOpen(!actionsOpen)}
            className="p-1.5 text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50"
            aria-label="Actions Menu"
          >
            <Layers className="w-4 h-4" />
          </button>

          {actionsOpen && (
            <div
              className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-50 text-xs"
              onClick={() => setActionsOpen(false)}
            >
              {onOpenAutoPilot && (
                <button
                  onClick={onOpenAutoPilot}
                  className="w-full text-left px-3 py-2 bg-blue-50/80 text-blue-800 font-bold hover:bg-blue-100 flex items-center gap-2 border-b border-slate-100"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Smart Auto-Pilot
                </button>
              )}
              <button onClick={onSave} className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2">
                <Save className="w-3.5 h-3.5 text-emerald-600" /> Save Project
              </button>
              <button onClick={onLoad} className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2">
                <FolderOpen className="w-3.5 h-3.5 text-slate-600" /> Load Saved
              </button>
              <label className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 cursor-pointer">
                <Upload className="w-3.5 h-3.5 text-amber-600" /> Import JSON
                <input ref={fileInputRef} type="file" accept=".json" onChange={handleImportFile} className="hidden" />
              </label>
              <button onClick={onExport} className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2">
                <Download className="w-3.5 h-3.5 text-blue-600" /> Export JSON
              </button>
              <button onClick={onSample} className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2">
                <BookOpen className="w-3.5 h-3.5 text-indigo-600" /> Load Sample
              </button>
              <button onClick={onReset} className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 flex items-center gap-2 border-t border-slate-100">
                <RefreshCw className="w-3.5 h-3.5" /> Reset All
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

// ============================================================
// HORIZONTAL PHASE & STEP STEPPER
// ============================================================

interface WorkflowPhaseStepperProps {
  activeStepId: string;
  onSelectStep: (stepId: string) => void;
}

export function WorkflowPhaseStepper({ activeStepId, onSelectStep }: WorkflowPhaseStepperProps) {
  const currentPhase = getPhaseForStep(activeStepId) || WORKFLOW_PHASES[0];

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl shadow-2xs mb-6 overflow-hidden">
      {/* 5-Phase Horizontal Milestone Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 border-b border-slate-200/90 overflow-x-auto divide-x divide-slate-100">
        {WORKFLOW_PHASES.map((phase) => {
          const isPhaseActive = currentPhase.id === phase.id;
          const PhaseIcon = phase.icon;
          const stepCount = phase.steps.length;

          return (
            <button
              key={phase.id}
              onClick={() => {
                // If switching to this phase, select its first step
                if (!isPhaseActive) {
                  onSelectStep(phase.steps[0].id);
                }
              }}
              className={`p-3 text-left transition-all relative flex flex-col justify-between ${
                isPhaseActive
                  ? 'bg-blue-50/50'
                  : 'hover:bg-slate-50/80 bg-white text-slate-600'
              }`}
            >
              <div className="flex items-center justify-between gap-1.5 mb-1">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      isPhaseActive
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {phase.number}
                  </span>
                  <PhaseIcon
                    className={`w-3.5 h-3.5 ${
                      isPhaseActive ? 'text-blue-600' : 'text-slate-400'
                    }`}
                  />
                </div>
                <span className="text-[10px] text-slate-400 font-medium">
                  {stepCount} steps
                </span>
              </div>

              <div
                className={`text-xs font-bold truncate ${
                  isPhaseActive ? 'text-blue-900' : 'text-slate-700'
                }`}
              >
                {phase.shortTitle}
              </div>

              {/* Active Bottom Indicator */}
              {isPhaseActive && (
                <div className="absolute bottom-0 left-0 right-0 h-0.75 bg-blue-600" />
              )}
            </button>
          );
        })}
      </div>

      {/* Sub-Step Navigation Pills in Active Phase */}
      <div className="px-4 py-2.5 bg-slate-50/60 flex items-center gap-2 overflow-x-auto">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex-shrink-0 mr-1">
          Phase {currentPhase.number} Modules:
        </span>
        <div className="flex items-center gap-1.5 flex-nowrap">
          {currentPhase.steps.map((st) => {
            const isStepActive = activeStepId === st.id;
            const StepIcon = st.icon;

            return (
              <button
                key={st.id}
                onClick={() => onSelectStep(st.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all border ${
                  isStepActive
                    ? 'bg-white border-blue-400/90 text-blue-700 shadow-2xs font-semibold ring-1 ring-blue-500/20'
                    : 'bg-white/80 border-slate-200/80 text-slate-600 hover:bg-white hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                {st.stepNumber !== undefined && (
                  <span
                    className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold ${
                      isStepActive
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {st.stepNumber}
                  </span>
                )}
                <StepIcon className={`w-3.5 h-3.5 ${isStepActive ? 'text-blue-600' : 'text-slate-400'}`} />
                <span>{st.shortLabel}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// CATEGORIZED WORKFLOW SIDEBAR (ACCORDION & SEARCH)
// ============================================================

interface WorkflowSidebarProps {
  activeStepId: string;
  onSelectStep: (stepId: string) => void;
  completionPct: number;
  criticalWarningsCount: number;
  totalWarningsCount: number;
}

export function WorkflowSidebar({
  activeStepId,
  onSelectStep,
  completionPct,
  criticalWarningsCount,
  totalWarningsCount,
}: WorkflowSidebarProps) {
  const currentPhase = getPhaseForStep(activeStepId);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedPhases, setExpandedPhases] = useState<Record<string, boolean>>(() => {
    // Expand current phase by default
    const initial: Record<string, boolean> = {};
    WORKFLOW_PHASES.forEach((p) => {
      initial[p.id] = p.id === currentPhase?.id;
    });
    return initial;
  });

  const togglePhase = (phaseId: string) => {
    setExpandedPhases((prev) => ({ ...prev, [phaseId]: !prev[phaseId] }));
  };

  // Filtered steps if searching
  const isSearching = searchQuery.trim().length > 0;
  const filteredSteps = useMemo(() => {
    if (!isSearching) return [];
    const q = searchQuery.toLowerCase();
    return ALL_STEPS.filter(
      (s) =>
        s.label.toLowerCase().includes(q) ||
        s.shortLabel.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q)
    );
  }, [searchQuery, isSearching]);

  return (
    <div className="flex flex-col h-full">
      {/* Quick Search Filter */}
      <div className="p-3 border-b border-slate-200/80 sticky top-0 bg-white z-10">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="Search calculations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white transition-all text-slate-800 placeholder-slate-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 text-xs font-bold"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Navigation Body */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {/* Search Results Mode */}
        {isSearching ? (
          <div className="space-y-1">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
              Found {filteredSteps.length} matches
            </div>
            {filteredSteps.map((st) => {
              const StepIcon = st.icon;
              const isActive = activeStepId === st.id;
              return (
                <button
                  key={st.id}
                  onClick={() => onSelectStep(st.id)}
                  className={`w-full text-left p-2 rounded-lg text-xs flex items-center gap-2.5 transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-800 font-bold'
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <StepIcon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                  <div className="truncate flex-1">
                    <div className="truncate">{st.label}</div>
                    <div className="text-[10px] text-slate-400 font-normal truncate">
                      {st.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          /* Accordion Phase Mode */
          WORKFLOW_PHASES.map((phase) => {
            const isPhaseActive = currentPhase?.id === phase.id;
            const isExpanded = expandedPhases[phase.id] ?? isPhaseActive;
            const PhaseIcon = phase.icon;

            return (
              <div
                key={phase.id}
                className={`rounded-xl border transition-colors overflow-hidden ${
                  isPhaseActive
                    ? 'border-blue-200/90 bg-white shadow-2xs'
                    : 'border-slate-200/70 bg-white/70'
                }`}
              >
                {/* Phase Header Accordion Toggle */}
                <button
                  type="button"
                  onClick={() => togglePhase(phase.id)}
                  className={`w-full text-left p-2.5 flex items-center justify-between gap-2 select-none transition-colors ${
                    isPhaseActive ? 'bg-blue-50/40 text-blue-950 font-bold' : 'hover:bg-slate-50 text-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span
                      className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center flex-shrink-0 ${
                        isPhaseActive ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {phase.number}
                    </span>
                    <PhaseIcon className={`w-4 h-4 flex-shrink-0 ${isPhaseActive ? 'text-blue-600' : 'text-slate-400'}`} />
                    <span className="text-xs truncate">{phase.shortTitle}</span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="text-[10px] text-slate-400">
                      {phase.steps.length}
                    </span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                        isExpanded ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                </button>

                {/* Sub-Steps List */}
                {isExpanded && (
                  <div className="p-1.5 space-y-0.5 border-t border-slate-100 bg-slate-50/30">
                    {phase.steps.map((st) => {
                      const isActive = activeStepId === st.id;
                      const StepIcon = st.icon;

                      return (
                        <button
                          key={st.id}
                          onClick={() => onSelectStep(st.id)}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-2 transition-all ${
                            isActive
                              ? 'bg-blue-600 text-white font-semibold shadow-2xs'
                              : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                          }`}
                        >
                          {st.stepNumber !== undefined && (
                            <span
                              className={`text-[10px] w-4 text-center font-mono font-bold ${
                                isActive ? 'text-blue-200' : 'text-slate-400'
                              }`}
                            >
                              {st.stepNumber}
                            </span>
                          )}
                          <StepIcon className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                          <span className="truncate flex-1">{st.shortLabel}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Sidebar Progress & Status Footer */}
      <div className="p-3 border-t border-slate-200 bg-white space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-700 block">Project Maturity</span>
            <span className="text-[11px] text-slate-400">Design completeness</span>
          </div>
          <ProgressRing pct={completionPct} size={38} />
        </div>

        <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
          {criticalWarningsCount > 0 ? (
            <span className="flex items-center gap-1 font-bold text-red-600 text-[11px]">
              <AlertTriangle className="w-3.5 h-3.5" /> {criticalWarningsCount} critical issues
            </span>
          ) : totalWarningsCount > 0 ? (
            <span className="flex items-center gap-1 font-medium text-amber-600 text-[11px]">
              <AlertTriangle className="w-3.5 h-3.5" /> {totalWarningsCount} review warnings
            </span>
          ) : (
            <span className="flex items-center gap-1 font-medium text-emerald-600 text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5" /> All standards satisfied
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// GUIDED WORKFLOW PREV / NEXT FOOTER
// ============================================================

interface GuidedWorkflowFooterProps {
  activeStepId: string;
  onSelectStep: (stepId: string) => void;
}

export function GuidedWorkflowFooter({
  activeStepId,
  onSelectStep,
}: GuidedWorkflowFooterProps) {
  const { prevStep, nextStep } = getAdjacentSteps(activeStepId);
  const currentStep = ALL_STEPS.find((s) => s.id === activeStepId);

  return (
    <div className="mt-8 pt-5 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 print:hidden">
      {/* Previous Step Button */}
      {prevStep ? (
        <button
          onClick={() => onSelectStep(prevStep.id)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all shadow-2xs hover:border-slate-300"
        >
          <ChevronLeft className="w-4 h-4 text-slate-400" />
          <div className="text-left">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-normal">
              Previous Module
            </span>
            <span>{prevStep.label}</span>
          </div>
        </button>
      ) : (
        <div />
      )}

      {/* Current Step Tracker Center Badge */}
      {currentStep && (
        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 bg-slate-100/80 px-3 py-1.5 rounded-full border border-slate-200">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>
            {currentStep.stepNumber !== undefined ? `Step ${currentStep.stepNumber} of 18` : 'Overview'} •{' '}
            <strong className="text-slate-700">{currentStep.shortLabel}</strong>
          </span>
        </div>
      )}

      {/* Next Step Button */}
      {nextStep ? (
        <button
          onClick={() => onSelectStep(nextStep.id)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-all shadow-xs hover:shadow-sm"
        >
          <div className="text-right">
            <span className="text-[10px] text-blue-200 uppercase tracking-wider block font-normal">
              Continue to Next
            </span>
            <span>{nextStep.label}</span>
          </div>
          <ChevronRight className="w-4 h-4 text-blue-200" />
        </button>
      ) : (
        <div />
      )}
    </div>
  );
}
