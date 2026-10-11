import { useState } from 'react';
import { useProject } from '@/context/ProjectContext';
import {
  Activity,
  Gauge,
  Droplets,
  Fuel,
  Warehouse,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  X,
  Download,
  FileText,
  FileSpreadsheet,
  Leaf,
  Sparkles,
  Cpu,
  RefreshCw,
} from 'lucide-react';
import { ALL_STEPS, getPhaseForStep } from '@/data/workflowPhases';

interface LiveTelemetryPaneProps {
  activeStepId: string;
  onSelectStep: (stepId: string) => void;
  onClose?: () => void;
  isMobileDrawer?: boolean;
}

function mapSectionToStepId(section: string): string {
  const s = section.toLowerCase();
  if (s.includes('occupan')) return 'step2';
  if (s.includes('special') || s.includes('canteen') || s.includes('irrigation')) return 'step4';
  if (s.includes('domestic') || s.includes('average daily') || s.includes('maximum daily') || s.includes('demand basis')) return 'step3';
  if (s.includes('water balance') || s.includes('continuity')) return 'step5';
  if (s.includes('peak') || s.includes('fixture') || s.includes('loading')) return 'step6';
  if (s.includes('storage') || s.includes('tank')) return 'step7';
  if (s.includes('pump')) return 'step8';
  if (s.includes('pipe') || s.includes('hydraulic') || s.includes('velocity') || s.includes('headloss')) return 'pipes';
  if (s.includes('hot water') || s.includes('legionella')) return 'hotwater';
  if (s.includes('waste') || s.includes('sewage') || s.includes('drainage')) return 'step9';
  if (s.includes('rain')) return 'step10';
  if (s.includes('grey') || s.includes('gray')) return 'step11';
  if (s.includes('fire')) return 'step12';
  if (s.includes('submeter') || s.includes('meter')) return 'submetering';
  if (s.includes('sustainab') || s.includes('green') || s.includes('efficiency')) return 'step13';
  if (s.includes('review') || s.includes('checklist') || s.includes('qa')) return 'step14';
  if (s.includes('report')) return 'step15';
  if (s.includes('standard') || s.includes('wpsf')) return 'standards';
  return 'dashboard';
}

export function LiveTelemetryPane({
  activeStepId,
  onSelectStep,
  onClose,
}: LiveTelemetryPaneProps) {
  const { project, results } = useProject();
  const [activeTab, setActiveTab] = useState<'hud' | 'warnings' | 'balance' | 'export'>('hud');
  const [exportStatus, setExportStatus] = useState<string | null>(null);

  const currentStep = ALL_STEPS.find((s) => s.id === activeStepId);
  const currentPhase = getPhaseForStep(activeStepId);

  // Warnings statistics
  const criticalWarnings = results.warnings.filter((w) => w.level === 'critical');
  const advisoryWarnings = results.warnings.filter((w) => w.level !== 'critical');
  const totalWarnings = results.warnings.length;

  // Real-time calculation derivations
  const addVal = results.add?.finalADDm3 ?? 0;
  const mddVal = results.mdd?.mddm3 ?? 0;
  const peakFlowLps = results.peakFlow?.probablePeakFlow ?? 0;
  const peakFlowM3h = (peakFlowLps * 3.6).toFixed(1);
  const storageCap = results.storage?.requiredCapacity ?? 0;
  const pumpFlow = results.pump?.designFlowM3h ?? 0;
  const pumpHead = results.pump?.tdh ?? 0;
  const pumpPower = results.pump?.motorPower ?? 0;
  const peakRatio = addVal > 0 ? (mddVal / addVal).toFixed(2) : '1.25';
  const potableReduction = results.sustainability?.potableReductionPct ?? 0;
  const greenScore = results.sustainability?.efficiencyScore ?? 0;

  // Handle fast exports
  const triggerExport = (format: 'PDF' | 'Excel' | 'Word') => {
    setExportStatus(`Exporting ${format}...`);
    const eventName = format === 'PDF' ? 'export-pdf' : format === 'Excel' ? 'export-xlsx' : 'export-docx';
    window.dispatchEvent(new CustomEvent(eventName));
    setTimeout(() => {
      setExportStatus(null);
    }, 2500);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 select-none">
      {/* Pane Top Header with Live Indicator */}
      <div className="p-3.5 border-b border-slate-800 bg-slate-950/80 backdrop-blur-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative flex items-center justify-center w-7 h-7 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-400">
            <Activity className="w-4 h-4 animate-pulse" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-slate-900 animate-ping" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-slate-900" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-xs font-bold text-white tracking-wide uppercase">
                Real-Time Telemetry
              </h2>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800/60">
                SYNCED
              </span>
            </div>
            <p className="text-[10px] text-slate-400 truncate max-w-[190px]">
              {project.projectInfo.projectName || 'Active Engineering State'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {onClose && (
            <button
              onClick={onClose}
              title="Collapse Telemetry Panel"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Pane Secondary Sub-Tabs */}
      <div className="flex border-b border-slate-800 bg-slate-950/40 px-2 pt-1 gap-1">
        <button
          onClick={() => setActiveTab('hud')}
          className={`flex-1 py-2 text-[11px] font-semibold text-center border-b-2 transition-all flex items-center justify-center gap-1 ${
            activeTab === 'hud'
              ? 'border-blue-500 text-blue-400 bg-slate-900/60'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/20'
          }`}
        >
          <Gauge className="w-3.5 h-3.5" />
          <span>Live HUD</span>
        </button>

        <button
          onClick={() => setActiveTab('warnings')}
          className={`flex-1 py-2 text-[11px] font-semibold text-center border-b-2 transition-all flex items-center justify-center gap-1 relative ${
            activeTab === 'warnings'
              ? 'border-amber-500 text-amber-400 bg-slate-900/60'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/20'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>QA Audit</span>
          {totalWarnings > 0 && (
            <span
              className={`ml-0.5 px-1.5 py-0.2 text-[9px] font-bold rounded-full ${
                criticalWarnings.length > 0
                  ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
              }`}
            >
              {totalWarnings}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('balance')}
          className={`flex-1 py-2 text-[11px] font-semibold text-center border-b-2 transition-all flex items-center justify-center gap-1 ${
            activeTab === 'balance'
              ? 'border-cyan-500 text-cyan-400 bg-slate-900/60'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/20'
          }`}
        >
          <Droplets className="w-3.5 h-3.5" />
          <span>Balance</span>
        </button>

        <button
          onClick={() => setActiveTab('export')}
          className={`flex-1 py-2 text-[11px] font-semibold text-center border-b-2 transition-all flex items-center justify-center gap-1 ${
            activeTab === 'export'
              ? 'border-indigo-500 text-indigo-400 bg-slate-900/60'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/20'
          }`}
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export</span>
        </button>
      </div>

      {/* Pane Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4 text-xs font-sans">
        {/* ============================================================ */}
        {/* TAB 1: LIVE HUD METERS */}
        {/* ============================================================ */}
        {activeTab === 'hud' && (
          <>
            {/* CONTEXT-ADAPTIVE FOCUS CARD (HERO ELEMENT) */}
            <div className="rounded-xl border border-blue-500/30 bg-gradient-to-b from-blue-950/40 via-slate-900 to-slate-900 p-3.5 shadow-inner relative overflow-hidden">
              <div className="absolute top-0 right-0 transform translate-x-3 -translate-y-3 w-16 h-16 bg-blue-500/10 rounded-full blur-xl pointer-events-none" />

              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-blue-600/20 border border-blue-400/30 flex items-center justify-center text-blue-400">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-blue-400 tracking-wider">
                      Active Calculation Focus
                    </span>
                    <h3 className="text-xs font-bold text-white truncate max-w-[200px]">
                      {currentStep?.label || 'General System Overview'}
                    </h3>
                  </div>
                </div>
                {currentPhase && (
                  <span className="text-[9px] font-mono font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    Phase {currentPhase.number}
                  </span>
                )}
              </div>

              {/* Contextual Metric Details based on Active Step */}
              <div className="mt-2.5 pt-2 border-t border-slate-800/80">
                {activeStepId === 'step1' && (
                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex justify-between text-slate-300">
                      <span className="text-slate-400">Project Type:</span>
                      <span className="font-semibold text-white">{project.projectInfo.projectType || 'General'}</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span className="text-slate-400">Design Stage:</span>
                      <span className="font-semibold text-blue-300">{project.projectInfo.designStage || 'Concept'}</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span className="text-slate-400">Location:</span>
                      <span className="font-semibold text-white truncate max-w-[140px]">{project.projectInfo.location || 'Not set'}</span>
                    </div>
                  </div>
                )}

                {activeStepId === 'step2' && (
                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex justify-between text-slate-300">
                      <span className="text-slate-400">Total Population:</span>
                      <span className="font-bold text-amber-300 font-mono text-xs">{results.totalPopulation} persons</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span className="text-slate-400">Occupancy Groups:</span>
                      <span className="font-semibold text-white">{project.occupancy.length} groups</span>
                    </div>
                    <div className="text-[10px] text-slate-400 italic mt-1">
                      Editing occupant counts updates domestic demand and storage sizing instantly.
                    </div>
                  </div>
                )}

                {activeStepId === 'step3' && (
                  <div className="space-y-2 text-[11px]">
                    <div className="flex justify-between items-baseline text-slate-300">
                      <span className="text-slate-400">Average Daily Demand (ADD):</span>
                      <span className="font-bold text-cyan-300 font-mono text-sm">{addVal.toFixed(2)} m³/d</span>
                    </div>
                    <div className="flex justify-between items-baseline text-slate-300">
                      <span className="text-slate-400">Maximum Daily Demand (MDD):</span>
                      <span className="font-bold text-amber-300 font-mono text-sm">{mddVal.toFixed(2)} m³/d</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span className="text-slate-400">Peak Day Factor (K_day):</span>
                      <span className="font-semibold text-white font-mono">{peakRatio}×</span>
                    </div>
                  </div>
                )}

                {activeStepId === 'step4' && (
                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex justify-between text-slate-300">
                      <span className="text-slate-400">Canteen Demand:</span>
                      <span className="font-semibold text-white font-mono">{((results.specialDemand?.canteenDemand ?? 0) / 1000).toFixed(2)} m³/d</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span className="text-slate-400">Irrigation Demand:</span>
                      <span className="font-semibold text-white font-mono">{((results.specialDemand?.irrigationDemand ?? 0) / 1000).toFixed(2)} m³/d</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span className="text-slate-400">Total Special Water:</span>
                      <span className="font-bold text-blue-300 font-mono">{((results.specialDemand?.total ?? 0) / 1000).toFixed(2)} m³/d</span>
                    </div>
                  </div>
                )}

                {activeStepId === 'step5' && (
                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex justify-between text-slate-300">
                      <span className="text-slate-400">Municipal Baseline:</span>
                      <span className="font-semibold text-cyan-300 font-mono">{addVal.toFixed(1)} m³/d</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span className="text-slate-400">Sewage Discharged:</span>
                      <span className="font-semibold text-red-300 font-mono">{results.wastewater?.wastewaterM3Day?.toFixed(1) || '0.0'} m³/d</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span className="text-slate-400">Circularity Offset:</span>
                      <span className="font-bold text-emerald-400 font-mono">{potableReduction}%</span>
                    </div>
                  </div>
                )}

                {activeStepId === 'step6' && (
                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex justify-between items-baseline text-slate-300">
                      <span className="text-slate-400">Probable Peak Flow (Q_peak):</span>
                      <span className="font-bold text-blue-300 font-mono text-sm">{peakFlowLps} L/s</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span className="text-slate-400">Hourly Equivalent:</span>
                      <span className="font-semibold text-slate-200 font-mono">{peakFlowM3h} m³/h</span>
                    </div>
                    <div className="text-[10px] text-slate-400 italic mt-1">
                      Governs internal distribution risers and booster pump sizing.
                    </div>
                  </div>
                )}

                {activeStepId === 'step7' && (
                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex justify-between items-baseline text-slate-300">
                      <span className="text-slate-400">Total Net Storage:</span>
                      <span className="font-bold text-amber-300 font-mono text-sm">{storageCap.toFixed(1)} m³</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span className="text-slate-400">Underground Tank:</span>
                      <span className="font-semibold text-white font-mono">{results.storage?.undergroundTank?.toFixed(1) || '0.0'} m³</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span className="text-slate-400">Roof Storage Tank:</span>
                      <span className="font-semibold text-cyan-300 font-mono">{results.storage?.roofTank?.toFixed(1) || '0.0'} m³</span>
                    </div>
                  </div>
                )}

                {activeStepId === 'step8' && (
                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex justify-between items-baseline text-slate-300">
                      <span className="text-slate-400">Pump Duty Flow:</span>
                      <span className="font-bold text-emerald-300 font-mono text-sm">{pumpFlow.toFixed(1)} m³/h</span>
                    </div>
                    <div className="flex justify-between items-baseline text-slate-300">
                      <span className="text-slate-400">Total Dynamic Head (TDH):</span>
                      <span className="font-bold text-blue-300 font-mono text-sm">{pumpHead.toFixed(1)} m</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span className="text-slate-400">Motor Power:</span>
                      <span className="font-bold text-amber-300 font-mono">{pumpPower.toFixed(2)} kW</span>
                    </div>
                  </div>
                )}

                {activeStepId === 'pipes' && (
                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex justify-between text-slate-300">
                      <span className="text-slate-400">Design Flow:</span>
                      <span className="font-semibold text-blue-300 font-mono">{peakFlowLps} L/s</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span className="text-slate-400">Permissible Velocity:</span>
                      <span className="font-semibold text-emerald-400 font-mono">0.8 – 2.0 m/s</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span className="text-slate-400">Min Residual Head:</span>
                      <span className="font-semibold text-white font-mono">1.5 bar (15 m)</span>
                    </div>
                  </div>
                )}

                {activeStepId === 'hotwater' && (
                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex justify-between text-slate-300">
                      <span className="text-slate-400">Storage Temp:</span>
                      <span className="font-bold text-rose-400 font-mono">60°C (Legionella Safe)</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span className="text-slate-400">Return Temp:</span>
                      <span className="font-semibold text-amber-300 font-mono">≥ 55°C</span>
                    </div>
                  </div>
                )}

                {activeStepId === 'step9' && (
                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex justify-between text-slate-300">
                      <span className="text-slate-400">Total Wastewater:</span>
                      <span className="font-bold text-red-400 font-mono text-sm">
                        {results.wastewater?.wastewaterM3Day?.toFixed(2) || '0.00'} m³/d
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span className="text-slate-400">Sewer Return:</span>
                      <span className="font-semibold text-slate-300 font-mono">
                        {((results.wastewater?.sewerReturn ?? 0) / 1000).toFixed(2)} m³/d
                      </span>
                    </div>
                  </div>
                )}

                {activeStepId === 'step10' && (
                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex justify-between text-slate-300">
                      <span className="text-slate-400">Annual Harvest:</span>
                      <span className="font-bold text-cyan-300 font-mono text-sm">
                        {results.rainwater?.annualHarvested?.toFixed(0) || '0'} m³/yr
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span className="text-slate-400">Roof Catchment:</span>
                      <span className="font-semibold text-white font-mono">
                        {project.rainwater?.roofArea || 0} m²
                      </span>
                    </div>
                  </div>
                )}

                {activeStepId === 'step11' && (
                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex justify-between text-slate-300">
                      <span className="text-slate-400">Greywater Yield:</span>
                      <span className="font-bold text-emerald-300 font-mono text-sm">
                        {((results.greywater?.reusableGreywater ?? 0) / 1000).toFixed(2)} m³/d
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span className="text-slate-400">Flushing Demand:</span>
                      <span className="font-semibold text-slate-300 font-mono">
                        {((results.greywater?.reuseDemand ?? 0) / 1000).toFixed(2)} m³/d
                      </span>
                    </div>
                  </div>
                )}

                {activeStepId === 'step12' && (
                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex justify-between text-slate-300">
                      <span className="text-slate-400">Dedicated Fire Storage:</span>
                      <span className="font-bold text-rose-400 font-mono text-sm">
                        {results.fireWater?.fireWaterStorage?.toFixed(1) || '0.0'} m³
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span className="text-slate-400">Fire Flow Delivery:</span>
                      <span className="font-semibold text-white font-mono">
                        {results.fireWater?.fireFlow ? (results.fireWater.fireFlow / 60).toFixed(1) : 0} L/s
                      </span>
                    </div>
                  </div>
                )}

                {activeStepId === 'step13' && (
                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex justify-between text-slate-300">
                      <span className="text-slate-400">Potable Water Saved:</span>
                      <span className="font-bold text-emerald-400 font-mono text-sm">
                        {potableReduction}%
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span className="text-slate-400">Green Building Score:</span>
                      <span className="font-bold text-cyan-300 font-mono">
                        {greenScore} / 100
                      </span>
                    </div>
                  </div>
                )}

                {activeStepId === 'step14' && (
                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex justify-between text-slate-300">
                      <span className="text-slate-400">Workflow Completion:</span>
                      <span className="font-bold text-emerald-400 font-mono">
                        {results.completionPct}%
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span className="text-slate-400">Critical Warnings:</span>
                      <span className="font-bold text-red-400 font-mono">
                        {criticalWarnings.length} unresolved
                      </span>
                    </div>
                  </div>
                )}

                {/* Fallback default */}
                {!['step1', 'step2', 'step3', 'step4', 'step5', 'step6', 'step7', 'step8', 'pipes', 'hotwater', 'step9', 'step10', 'step11', 'step12', 'step13', 'step14'].includes(activeStepId) && (
                  <div className="space-y-1 text-[11px]">
                    <div className="flex justify-between text-slate-300">
                      <span className="text-slate-400">Overall Progress:</span>
                      <span className="font-bold text-emerald-400 font-mono">{results.completionPct}%</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span className="text-slate-400">QA Warnings:</span>
                      <span className="font-semibold text-amber-300 font-mono">{totalWarnings} active</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* MASTER TELEMETRY GAUGES GRID */}
            <div className="space-y-3">
              {/* 1. DEMAND METERS: ADD & MDD */}
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-colors">
                <div className="flex items-center justify-between text-slate-400 mb-1.5">
                  <span className="font-semibold flex items-center gap-1.5 text-slate-300">
                    <Droplets className="w-3.5 h-3.5 text-cyan-400" /> Daily Water Demand
                  </span>
                  <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/80 px-1.5 py-0.2 rounded border border-cyan-800/60">
                    Ratio {peakRatio}×
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800/80">
                    <div className="text-[10px] text-slate-400">Average Daily (ADD)</div>
                    <div className="text-base font-bold text-cyan-300 font-mono mt-0.5">
                      {addVal.toFixed(2)}{' '}
                      <span className="text-[10px] text-slate-400 font-normal">m³/d</span>
                    </div>
                    <div className="text-[9px] text-slate-500 font-mono mt-0.5">
                      {(addVal * 1000).toLocaleString(undefined, { maximumFractionDigits: 0 })} L/d
                    </div>
                  </div>

                  <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800/80">
                    <div className="text-[10px] text-slate-400">Max Daily (MDD)</div>
                    <div className="text-base font-bold text-amber-300 font-mono mt-0.5">
                      {mddVal.toFixed(2)}{' '}
                      <span className="text-[10px] text-slate-400 font-normal">m³/d</span>
                    </div>
                    <div className="text-[9px] text-slate-500 font-mono mt-0.5">
                      {(mddVal * 1000).toLocaleString(undefined, { maximumFractionDigits: 0 })} L/d
                    </div>
                  </div>
                </div>

                {/* Demand Comparison Bar */}
                <div className="mt-2.5">
                  <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                    <span>ADD vs MDD Peak Headroom</span>
                    <span className="font-mono text-slate-300">
                      {mddVal > 0 ? `${((addVal / mddVal) * 100).toFixed(0)}% base load` : '0%'}
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden flex">
                    <div
                      className="bg-cyan-500 h-full transition-all duration-300"
                      style={{ width: `${Math.min(100, mddVal > 0 ? (addVal / mddVal) * 100 : 0)}%` }}
                    />
                    <div className="bg-amber-500 h-full flex-1" />
                  </div>
                </div>
              </div>

              {/* 2. PEAK SIMULTANEOUS FLOW */}
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-colors">
                <div className="flex items-center justify-between text-slate-400 mb-1.5">
                  <span className="font-semibold flex items-center gap-1.5 text-slate-300">
                    <Gauge className="w-3.5 h-3.5 text-blue-400" /> Peak Flow (Pipe & Booster)
                  </span>
                  <span className="text-[10px] font-mono text-blue-400 bg-blue-950/80 px-1.5 py-0.2 rounded border border-blue-800/60">
                    HUNTER'S LU
                  </span>
                </div>

                <div className="flex items-baseline justify-between mt-2 bg-slate-900/90 p-2.5 rounded-lg border border-slate-800/80">
                  <div>
                    <div className="text-[10px] text-slate-400">Design Flow (Q_peak)</div>
                    <div className="text-xl font-bold text-blue-300 font-mono mt-0.5">
                      {peakFlowLps} <span className="text-xs text-slate-400 font-normal">L/s</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400">Hourly Equivalent</div>
                    <div className="text-sm font-bold text-slate-200 font-mono mt-0.5">
                      {peakFlowM3h} <span className="text-[10px] text-slate-400 font-normal">m³/h</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. STORAGE CAPACITY & RESERVES */}
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-colors">
                <div className="flex items-center justify-between text-slate-400 mb-1.5">
                  <span className="font-semibold flex items-center gap-1.5 text-slate-300">
                    <Warehouse className="w-3.5 h-3.5 text-amber-400" /> Storage Sizing
                  </span>
                  <span className="text-[10px] font-mono text-amber-400 bg-amber-950/80 px-1.5 py-0.2 rounded border border-amber-800/60">
                    {((project.storage?.storageDuration ?? 1) * 24).toFixed(0)}h RESERVE
                  </span>
                </div>

                <div className="flex items-baseline justify-between mt-2 bg-slate-900/90 p-2.5 rounded-lg border border-slate-800/80">
                  <div>
                    <div className="text-[10px] text-slate-400">Total Reservoir Required</div>
                    <div className="text-xl font-bold text-amber-300 font-mono mt-0.5">
                      {storageCap.toFixed(1)} <span className="text-xs text-slate-400 font-normal">m³</span>
                    </div>
                  </div>
                  <div className="text-right text-[10px] text-slate-400 space-y-0.5">
                    <div>UG Tank: <span className="text-slate-200 font-mono font-semibold">{results.storage?.undergroundTank?.toFixed(1) || '0.0'} m³</span></div>
                    <div>Roof Tank: <span className="text-cyan-300 font-mono font-semibold">{results.storage?.roofTank?.toFixed(1) || '0.0'} m³</span></div>
                  </div>
                </div>

                {/* Storage Segmented Bar */}
                <div className="mt-2.5">
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden flex">
                    <div
                      className="bg-blue-500 h-full transition-all"
                      title="Underground Tank"
                      style={{
                        width: `${Math.min(100, storageCap > 0 ? ((results.storage?.undergroundTank || 0) / storageCap) * 100 : 0)}%`,
                      }}
                    />
                    <div
                      className="bg-cyan-500 h-full transition-all"
                      title="Roof Tank"
                      style={{
                        width: `${Math.min(100, storageCap > 0 ? ((results.storage?.roofTank || 0) / storageCap) * 100 : 0)}%`,
                      }}
                    />
                    <div
                      className="bg-amber-500 h-full transition-all"
                      title="Ground / Elevated"
                      style={{
                        width: `${Math.min(100, storageCap > 0 ? (((results.storage?.groundTank || 0) + (results.storage?.elevatedTank || 0)) / storageCap) * 100 : 0)}%`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-[9px] text-slate-400 mt-1">
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> UG Tank</span>
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-cyan-500" /> Roof Tank</span>
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Ground/Elev</span>
                  </div>
                </div>
              </div>

              {/* 4. PUMPING STATION DUTY */}
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-colors">
                <div className="flex items-center justify-between text-slate-400 mb-1.5">
                  <span className="font-semibold flex items-center gap-1.5 text-slate-300">
                    <Fuel className="w-3.5 h-3.5 text-emerald-400" /> Booster Pump Duty Point
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-1.5 py-0.2 rounded border border-emerald-800/60">
                    DUTY + STANDBY
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-2">
                  <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800/80 text-center">
                    <div className="text-[10px] text-slate-400">Flow (Q)</div>
                    <div className="text-sm font-bold text-emerald-300 font-mono mt-0.5">
                      {pumpFlow > 0 ? pumpFlow.toFixed(1) : '—'}
                    </div>
                    <div className="text-[9px] text-slate-500 font-mono">m³/h</div>
                  </div>

                  <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800/80 text-center">
                    <div className="text-[10px] text-slate-400">Head (TDH)</div>
                    <div className="text-sm font-bold text-blue-300 font-mono mt-0.5">
                      {pumpHead > 0 ? pumpHead.toFixed(1) : '—'}
                    </div>
                    <div className="text-[9px] text-slate-500 font-mono">m</div>
                  </div>

                  <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800/80 text-center">
                    <div className="text-[10px] text-slate-400">Motor</div>
                    <div className="text-sm font-bold text-amber-300 font-mono mt-0.5">
                      {pumpPower > 0 ? pumpPower.toFixed(2) : '—'}
                    </div>
                    <div className="text-[9px] text-slate-500 font-mono">kW</div>
                  </div>
                </div>
              </div>

              {/* 5. SMART SCADA & IOT TELEMETRY SIMULATOR */}
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-colors">
                <div className="flex items-center justify-between text-slate-400 mb-1.5">
                  <span className="font-semibold flex items-center gap-1.5 text-slate-300">
                    <Cpu className="w-3.5 h-3.5 text-cyan-400" /> SCADA Network Telemetry
                  </span>
                  {results.smartMonitoring?.leakageAlert ? (
                    <span className="text-[9px] font-bold text-red-400 bg-red-950/80 px-1.5 py-0.2 rounded border border-red-800/60 animate-pulse">
                      LEAK ALERT
                    </span>
                  ) : (
                    <span className="text-[9px] font-bold text-emerald-400 bg-emerald-950/80 px-1.5 py-0.2 rounded border border-emerald-800/60 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> NORMAL
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800/80">
                    <div className="text-[10px] text-slate-400">Inflow Rate</div>
                    <div className="text-sm font-bold text-white font-mono mt-0.5">
                      {results.smartMonitoring?.flowMeterCurrentLps || 0}{' '}
                      <span className="text-[10px] text-slate-400 font-normal">L/s</span>
                    </div>
                    <div className="text-[9px] text-slate-500 font-mono">
                      {((results.smartMonitoring?.flowMeterCurrentLps || 0) * 3.6).toFixed(1)} m³/h
                    </div>
                  </div>

                  <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800/80">
                    <div className="text-[10px] text-slate-400">Header Pressure</div>
                    <div className="text-sm font-bold text-white font-mono mt-0.5">
                      {results.smartMonitoring?.distributionPressureBar || 0}{' '}
                      <span className="text-[10px] text-slate-400 font-normal">bar</span>
                    </div>
                    <div className="text-[9px] text-slate-500 font-mono">
                      {((results.smartMonitoring?.distributionPressureBar || 0) * 10).toFixed(0)} m head
                    </div>
                  </div>
                </div>
              </div>

              {/* 6. SUSTAINABILITY & WATER CIRCULARITY */}
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-colors">
                <div className="flex items-center justify-between text-slate-400 mb-1.5">
                  <span className="font-semibold flex items-center gap-1.5 text-slate-300">
                    <Leaf className="w-3.5 h-3.5 text-emerald-400" /> Green Building Circularity
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-1.5 py-0.2 rounded border border-emerald-800/60">
                    LEED / GREEN
                  </span>
                </div>

                <div className="flex items-center justify-between mt-2 bg-slate-900/90 p-2.5 rounded-lg border border-slate-800/80">
                  <div>
                    <div className="text-[10px] text-slate-400">Potable Water Reduction</div>
                    <div className="text-lg font-bold text-emerald-400 font-mono mt-0.5">
                      {potableReduction}%
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400">Efficiency Score</div>
                    <div className="text-lg font-bold text-cyan-300 font-mono mt-0.5">
                      {greenScore}{' '}
                      <span className="text-[10px] text-slate-400 font-normal">/ 100</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ============================================================ */}
        {/* TAB 2: QA WARNINGS AUDIT */}
        {/* ============================================================ */}
        {activeTab === 'warnings' && (
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> QA Compliance Audit
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Click any issue to jump straight to that calculation step
                </p>
              </div>
              <div className="flex gap-1">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-950 text-red-300 border border-red-800/60">
                  {criticalWarnings.length} Critical
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800/60">
                  {advisoryWarnings.length} Advisory
                </span>
              </div>
            </div>

            {results.warnings.length === 0 ? (
              <div className="p-6 text-center bg-slate-950/40 rounded-xl border border-slate-800">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <h4 className="text-xs font-bold text-white">All Engineering Rules Verified</h4>
                <p className="text-[11px] text-slate-400 mt-1">
                  No critical violations or sizing discrepancies detected.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {results.warnings.map((w) => {
                  const targetStep = mapSectionToStepId(w.section);
                  const isCritical = w.level === 'critical';

                  return (
                    <div
                      key={w.id}
                      onClick={() => onSelectStep(targetStep)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer group ${
                        isCritical
                          ? 'bg-red-950/30 border-red-500/40 hover:border-red-400 hover:bg-red-950/50'
                          : 'bg-amber-950/20 border-amber-500/30 hover:border-amber-400 hover:bg-amber-950/40'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isCritical ? 'bg-red-500 animate-ping' : 'bg-amber-400'
                            }`}
                          />
                          <span
                            className={`text-[10px] font-mono font-bold uppercase px-1.5 py-0.2 rounded ${
                              isCritical
                                ? 'bg-red-900/60 text-red-300'
                                : 'bg-amber-900/60 text-amber-300'
                            }`}
                          >
                            {w.section}
                          </span>
                        </div>
                        <span className="text-[10px] text-blue-400 flex items-center gap-0.5 font-medium group-hover:translate-x-0.5 transition-transform">
                          Fix in {targetStep} <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-white mt-1 group-hover:text-blue-300 transition-colors">
                        {w.message}
                      </h4>

                      {w.whyItMatters && (
                        <p className="text-[10px] text-slate-300 mt-1 leading-relaxed">
                          {w.whyItMatters}
                        </p>
                      )}

                      {w.recommendedAction && (
                        <div className="mt-2 text-[10px] text-emerald-300/90 bg-emerald-950/40 p-1.5 rounded border border-emerald-800/40 flex items-start gap-1">
                          <span className="font-semibold text-emerald-400">Action:</span>
                          <span className="flex-1">{w.recommendedAction}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 3: WATER BALANCE & SANKEY CONTINUITY */}
        {/* ============================================================ */}
        {activeTab === 'balance' && (
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                <Droplets className="w-3.5 h-3.5 text-cyan-400" /> Mass Balance Continuity
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Daily facility inflow sources vs consumption & drainage
              </p>
            </div>

            {results.waterBalance ? (
              <div className="space-y-3">
                {/* Source Inflows */}
                <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800 space-y-2">
                  <div className="text-[11px] font-bold text-cyan-300 uppercase tracking-wider">
                    Water Inflow Sources
                  </div>
                  {results.waterBalance.sources.map((src) => (
                    <div key={src.name} className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-300">{src.name}</span>
                        <span className="font-mono text-cyan-300 font-bold">{src.value.toLocaleString()} L/d</span>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-cyan-500 h-full"
                          style={{
                            width: `${Math.min(100, (src.value / Math.max(1, results.waterBalance?.totalSupply || 1)) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Demand Consumption */}
                <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800 space-y-2">
                  <div className="text-[11px] font-bold text-blue-300 uppercase tracking-wider">
                    Demand Outflows
                  </div>
                  {results.waterBalance.consumption.map((con) => (
                    <div key={con.name} className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-300">{con.name}</span>
                        <span className="font-mono text-blue-300 font-bold">{con.value.toLocaleString()} L/d</span>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-blue-500 h-full"
                          style={{
                            width: `${Math.min(100, (con.value / Math.max(1, results.waterBalance?.totalDemand || 1)) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Net Balance Status */}
                <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-slate-400">Total Supply vs Demand Delta</div>
                    <div className="text-sm font-bold font-mono text-white mt-0.5">
                      {((results.waterBalance.totalSupply - results.waterBalance.totalDemand) / 1000).toFixed(2)} m³/d
                    </div>
                  </div>
                  <span className="px-2 py-1 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800/60">
                    CONSERVED
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-slate-400">
                Water balance calculations pending input completion.
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 4: QUICK EXPORTS */}
        {/* ============================================================ */}
        {activeTab === 'export' && (
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                <Download className="w-3.5 h-3.5 text-indigo-400" /> Instant Export Center
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Download verified engineering reports, schedules & spec sheets
              </p>
            </div>

            {exportStatus && (
              <div className="p-2.5 rounded-lg bg-blue-950/80 border border-blue-700 text-blue-200 text-xs flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-400" />
                <span>{exportStatus}</span>
              </div>
            )}

            <div className="space-y-2">
              <button
                onClick={() => triggerExport('PDF')}
                className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-blue-500 hover:bg-slate-850 flex items-center justify-between text-left transition-all group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 flex items-center justify-center">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-blue-300">
                      PDF Calculation Dossier
                    </div>
                    <div className="text-[10px] text-slate-400">Formal A4 engineering sheets</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                onClick={() => triggerExport('Excel')}
                className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500 hover:bg-slate-850 flex items-center justify-between text-left transition-all group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-emerald-300">
                      Excel Calculation Workbook (.xlsx)
                    </div>
                    <div className="text-[10px] text-slate-400">Complete multi-tab sizing schedules</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                onClick={() => triggerExport('Word')}
                className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500 hover:bg-slate-850 flex items-center justify-between text-left transition-all group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-indigo-300">
                      Word Technical Report (.docx)
                    </div>
                    <div className="text-[10px] text-slate-400">Editable design narrative & specs</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800 text-[10px] text-slate-400 leading-relaxed">
              <span className="font-semibold text-slate-300">Engineering Note:</span> Exports contain full mathematical derivations, formula citations, and design safety margins adhering to BS EN 806 and WPSF v1.0 standards.
            </div>
          </div>
        )}
      </div>

      {/* Pane Footer Status Bar */}
      <div className="p-2.5 border-t border-slate-800 bg-slate-950/90 text-[10px] text-slate-400 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Active State: <strong className="text-slate-200">{results.completionPct}% Complete</strong></span>
        </div>
        <button
          onClick={() => onSelectStep('step14')}
          className="text-blue-400 hover:text-blue-300 underline font-medium"
        >
          Review QA →
        </button>
      </div>
    </div>
  );
}
