import { AlertTriangle, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import type { EngineeringWarning } from '@/types';
import { getIssueStepId } from '@/utils/designIssueRouting';
import { getStepById } from '@/data/workflowPhases';

interface DesignIssuesPanelProps {
  warnings: EngineeringWarning[];
  onSelectStep: (stepId: string) => void;
  variant?: 'light' | 'dark';
  limit?: number;
}

const getIssueLevel = (level: EngineeringWarning['level']) => {
  if (level === 'critical') return 'Blocking';
  if (level === 'warning') return 'Warning';
  return 'Info';
};

export function DesignIssuesPanel({ warnings, onSelectStep, variant = 'light', limit }: DesignIssuesPanelProps) {
  const isDark = variant === 'dark';
  const blockingCount = warnings.filter((warning) => warning.level === 'critical').length;
  const warningCount = warnings.filter((warning) => warning.level === 'warning').length;
  const infoCount = warnings.length - blockingCount - warningCount;
  const visibleWarnings = limit ? warnings.slice(0, limit) : warnings;

  return (
    <section
      aria-labelledby={`design-issues-title-${variant}`}
      className={isDark ? 'space-y-3' : 'rounded-xl border border-slate-200 bg-white p-4 shadow-sm'}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 id={`design-issues-title-${variant}`} className={`flex items-center gap-2 text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-800'}`}>
            <AlertTriangle className={`h-4 w-4 ${blockingCount > 0 ? 'text-red-500' : 'text-amber-500'}`} aria-hidden="true" />
            Design issues
          </h3>
          <p className={`mt-1 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Open an issue to review the related inputs. These flags do not certify a design.
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5" aria-label="Issue totals">
          <span className={`rounded border px-2 py-1 text-[10px] font-semibold ${isDark ? 'border-red-800 bg-red-950 text-red-200' : 'border-red-200 bg-red-50 text-red-800'}`}>{blockingCount} Blocking</span>
          <span className={`rounded border px-2 py-1 text-[10px] font-semibold ${isDark ? 'border-amber-800 bg-amber-950 text-amber-200' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>{warningCount} Warning</span>
          <span className={`rounded border px-2 py-1 text-[10px] font-semibold ${isDark ? 'border-slate-700 bg-slate-800 text-slate-200' : 'border-slate-200 bg-slate-50 text-slate-700'}`}>{infoCount} Info</span>
        </div>
      </div>

      {warnings.length === 0 ? (
        <div className={`flex items-start gap-2 rounded-lg border p-3 ${isDark ? 'border-emerald-800 bg-emerald-950/40 text-emerald-100' : 'border-emerald-200 bg-emerald-50 text-emerald-900'}`}>
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" aria-hidden="true" />
          <p className="text-xs">No automated issues are flagged. A qualified engineer must still review the preliminary design.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {visibleWarnings.map((warning) => {
            const stepId = getIssueStepId(warning.section);
            const step = getStepById(stepId);
            const level = getIssueLevel(warning.level);
            const nextStep = warning.recommendedAction || `Review ${warning.section} inputs and verify the entered value and its source.`;
            const tone = warning.level === 'critical'
              ? isDark ? 'border-red-500/40 bg-red-950/30 hover:bg-red-950/50' : 'border-red-200 bg-red-50 hover:bg-red-100'
              : warning.level === 'warning'
                ? isDark ? 'border-amber-500/30 bg-amber-950/20 hover:bg-amber-950/40' : 'border-amber-200 bg-amber-50 hover:bg-amber-100'
                : isDark ? 'border-slate-700 bg-slate-800/70 hover:bg-slate-800' : 'border-slate-200 bg-slate-50 hover:bg-slate-100';
            const textTone = isDark ? 'text-slate-100' : 'text-slate-800';

            return (
              <li key={warning.id}>
                <button
                  type="button"
                  onClick={() => onSelectStep(stepId)}
                  className={`w-full rounded-lg border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${tone}`}
                  aria-label={`Open ${step?.label ?? 'overview'} to review ${warning.section}: ${warning.recommendedAction || warning.message}`}
                >
                  <span className="flex flex-wrap items-center justify-between gap-2">
                    <span className={`text-[10px] font-bold uppercase tracking-wide ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                      {level} · {warning.section}
                    </span>
                    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold ${isDark ? 'text-cyan-300' : 'text-blue-700'}`}>
                      Review {step?.shortLabel ?? 'Overview'} <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
                    </span>
                  </span>
                  <span className={`mt-1 block text-sm font-semibold leading-snug ${textTone}`}>{warning.message}</span>
                  {(warning.currentValue || warning.referenceValue) && (
                    <span className={`mt-1 block text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                      {warning.currentValue && <>{warning.currentValue}</>}
                      {warning.currentValue && warning.referenceValue && ' · '}
                      {warning.referenceValue && <>Review basis: {warning.referenceValue}</>}
                    </span>
                  )}
                  <span className={`mt-2 block text-xs leading-relaxed ${isDark ? 'text-emerald-200' : 'text-emerald-900'}`}>
                    <strong>Next step:</strong> {nextStep}
                  </span>
                  {warning.whyItMatters && <span className={`mt-1 block text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{warning.whyItMatters}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {limit && warnings.length > limit && (
        <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Showing {limit} of {warnings.length} issues. Open Design Review for the full list.</p>
      )}
    </section>
  );
}
