import { useState } from 'react';
import { Activity, ChevronUp, ChevronDown } from 'lucide-react';
import { useProject } from '@/context/ProjectContext';

function display(value: number | undefined, digits = 2) {
  return value === undefined || !Number.isFinite(value) ? '—' : value.toFixed(digits);
}

export function MobileResultsSheet() {
  const { results } = useProject();
  const [open, setOpen] = useState(false);
  const dailyDemand = results.add?.finalADDm3;
  const groundTank = results.storage?.undergroundTank;
  const roofTank = results.storage?.roofTank;
  const pumpFlow = results.pump?.designFlowM3h;
  const pumpHead = results.pump?.tdh;
  const annualSaving = results.sustainability?.annualSaving;

  return (
    <section className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-700 bg-slate-950 text-white shadow-[0_-8px_30px_rgba(15,23,42,0.18)] xl:hidden print:hidden" aria-label="Live design results">
      <button type="button" aria-expanded={open} onClick={() => setOpen((value) => !value)} className="flex min-h-14 w-full items-center justify-between gap-3 px-4 py-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-400">
        <span className="flex items-center gap-2"><Activity className="h-4 w-4 text-cyan-300" aria-hidden="true"/><span className="text-sm font-semibold">Live results</span><span className="text-xs text-slate-300">Daily demand {display(dailyDemand)} m³/day</span></span>
        <span className="flex items-center gap-1 text-xs text-cyan-200">{open ? 'Hide' : 'View'}{open ? <ChevronDown className="h-4 w-4"/> : <ChevronUp className="h-4 w-4"/>}</span>
      </button>
      {open && <div className="max-h-[48vh] overflow-y-auto border-t border-slate-800 px-4 pb-4 pt-3">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" aria-live="polite">
          <Metric label="Daily demand" value={`${display(dailyDemand)} m³/day`} />
          <Metric label="Ground tank" value={`${display(groundTank)} m³`} />
          <Metric label="Roof tank" value={`${display(roofTank)} m³`} />
          <Metric label="Pump duty" value={`${display(pumpFlow, 1)} m³/h · ${display(pumpHead, 1)} m`} />
          <Metric label="Annual reuse saving" value={annualSaving === undefined ? '—' : `${display(annualSaving)} m³/year`} />
          <Metric label="Potable water reduction" value={results.sustainability ? `${display(results.sustainability.potableReductionPct, 1)}%` : '—'} />
        </div>
        <p className="mt-3 text-[11px] text-slate-400">Preliminary estimates only. Confirm inputs and review issues before design decisions.</p>
      </div>}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2"><div className="text-[10px] text-slate-400">{label}</div><div className="mt-1 text-xs font-semibold text-slate-100">{value}</div></div>;
}
