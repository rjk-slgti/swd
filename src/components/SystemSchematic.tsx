import { ArrowRight, CloudRain, Droplets, Fuel, Home, Recycle, Warehouse } from 'lucide-react';

interface SystemSchematicProps {
  onSelectStep: (stepId: string) => void;
}

const mainFlow = [
  { label: 'Water source', step: 'step5', icon: Droplets },
  { label: 'Ground tank', step: 'step7', icon: Warehouse },
  { label: 'Pump', step: 'step8', icon: Fuel },
  { label: 'Roof tank', step: 'step7', icon: Warehouse },
  { label: 'Fixtures', step: 'pipes', icon: Home },
];

const recoveryFlow = [
  { label: 'Rainwater', step: 'step10', icon: CloudRain },
  { label: 'Greywater reuse', step: 'step11', icon: Recycle },
];

export function SystemSchematic({ onSelectStep }: SystemSchematicProps) {
  return (
    <section className="mb-5 rounded-xl border border-blue-100 bg-white p-4 shadow-sm sm:p-5" aria-labelledby="system-schematic-heading">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 id="system-schematic-heading" className="text-sm font-bold text-slate-900">Water system at a glance</h2>
          <p className="mt-1 text-xs text-slate-500">Choose a part of the system to open its design inputs.</p>
        </div>
        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-semibold text-blue-700">Preliminary design</span>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-2" aria-label="Source to fixtures system flow">
        {mainFlow.map(({ label, step, icon: Icon }, index) => (
          <div key={`${label}-${index}`} className="flex min-w-max items-center gap-2">
            <button type="button" onClick={() => onSelectStep(step)} className="group flex min-w-[112px] flex-col items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-center text-xs font-semibold text-slate-700 transition hover:border-blue-400 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-blue-700 shadow-sm group-hover:bg-blue-100"><Icon className="h-5 w-5" aria-hidden="true" /></span>
              {label}
            </button>
            {index < mainFlow.length - 1 && <ArrowRight className="h-4 w-4 shrink-0 text-slate-300" aria-hidden="true" />}
          </div>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
        <span className="mr-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Optional supplies and reuse</span>
        {recoveryFlow.map(({ label, step, icon: Icon }) => (
          <button key={step} type="button" onClick={() => onSelectStep(step)} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2">
            <Icon className="h-4 w-4" aria-hidden="true" />{label}
          </button>
        ))}
        <button type="button" onClick={() => onSelectStep('step5')} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2">
          <Droplets className="h-4 w-4" aria-hidden="true" />Water balance
        </button>
      </div>
    </section>
  );
}
