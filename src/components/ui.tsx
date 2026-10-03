import { useProject } from '@/context/ProjectContext';
import { useState, type ReactNode } from 'react';
import {
  ChevronDown,
  Info,
  BookOpen,
  AlertTriangle,
  Lightbulb,
  ShieldAlert,
  Flame,
  CheckCircle2,
  HelpCircle,
  Activity,
  Droplets,
} from 'lucide-react';
import type { EngineeringWarning, FactorClassification } from '@/types';

// ============================================================
// ENGINEERING NOTICE BANNER (Section 87)
// ============================================================

export function EngineeringNoticeBanner() {
  return (
    <div className="bg-amber-50/80 border-l-4 border-amber-500 p-3.5 rounded-r-md text-xs text-amber-900 shadow-xs mb-4">
      <div className="flex items-start gap-2.5">
        <ShieldAlert className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
        <div className="space-y-1">
          <p className="font-bold uppercase tracking-wider text-[11px] text-amber-800">
            Prototype Engineering Notice (WPSF v1.0)
          </p>
          <p className="leading-relaxed text-slate-700">
            This application uses <strong>Water Services Prototype Standard Factors (WPSF)</strong> to support preliminary water-services design, engineering education, feasibility studies, and prototype calculations. WPSF values are controlled internal design defaults and shall not be interpreted as statutory requirements, British Standards, Sri Lankan regulations, or manufacturer-certified requirements unless specifically referenced and verified. Final project design shall be checked against current applicable standards, authority requirements, project specifications, manufacturer data, and actual site conditions by suitably qualified professionals.
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// PRIMARY ENGINEERING PRINCIPLE BANNER (Section 4)
// ============================================================

export function PrinciplesBanner() {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-900 mb-4 flex items-start gap-3">
      <Droplets className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
      <div>
        <p className="font-bold text-blue-800 mb-0.5">
          PRIMARY ENGINEERING PRINCIPLE: DAILY CONSUMPTION vs PEAK DESIGN FLOW
        </p>
        <p className="text-slate-600 leading-normal">
          <strong>Daily consumption (L/day, m³/day)</strong> governs storage volumes, source intake sizing, utility water balance, and wastewater generation.
          <strong> Peak simultaneous demand (L/s, m³/h)</strong> governs pipe sizing, booster pump delivery flow, and residual pressure adequacy.
          <em> Never use average daily consumption directly as the pipe design flow!</em>
        </p>
      </div>
    </div>
  );
}

// ============================================================
// PROTOTYPE DEFAULT APPLIED BADGE (Section 11)
// ============================================================

export function PrototypeDefaultBadge({
  classification = 'PROTOTYPE STANDARD FACTOR',
  verificationText = 'Confirm against applicable project criteria and authority requirements.',
}: {
  classification?: string;
  verificationText?: string;
}) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="relative inline-flex items-center">
      <span
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-300 cursor-help"
      >
        <AlertTriangle className="w-3 h-3 text-amber-600" />
        PROTOTYPE DEFAULT APPLIED
      </span>
      {showTooltip && (
        <div className="absolute z-50 bottom-full left-0 mb-1 w-64 p-2 bg-slate-900 text-white text-[11px] rounded shadow-lg pointer-events-none">
          <p className="font-bold text-amber-300 mb-0.5">Classification: {classification}</p>
          <p className="text-slate-300">{verificationText}</p>
        </div>
      )}
    </div>
  );
}

// ============================================================
// EDUCATIONAL EXPANDABLE CARD (Section 66)
// ============================================================

interface EduCardProps {
  title: string;
  icon?: 'why' | 'how' | 'what' | 'tip' | 'warning';
  children: ReactNode;
  defaultOpen?: boolean;
}

export function EduCard({ title, icon = 'why', children, defaultOpen = false }: EduCardProps) {
  const [open, setOpen] = useState(defaultOpen);
  const { project } = useProject();
  if (project.designMode === 'professional' && icon !== 'warning') return null;

  const icons = {
    why: <BookOpen className="w-4 h-4 text-blue-600" />,
    how: <Info className="w-4 h-4 text-cyan-600" />,
    what: <HelpCircle className="w-4 h-4 text-blue-600" />,
    tip: <Lightbulb className="w-4 h-4 text-amber-600" />,
    warning: <AlertTriangle className="w-4 h-4 text-red-600" />,
  };

  return (
    <div className="border border-slate-200 rounded-lg bg-slate-50 overflow-hidden my-2">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2">
          {icons[icon]}
          {title}
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-4 py-3 text-sm text-slate-600 leading-relaxed border-t border-slate-200 bg-white">
          {children}
        </div>
      )}
    </div>
  );
}

// ============================================================
// FORM INPUTS
// ============================================================

interface NumberInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  tooltip?: string;
  source?: string;
  status?: string;
  isPrototypeDefault?: boolean;
}

export function NumberInput({
  label,
  value,
  onChange,
  unit,
  min = 0,
  max,
  step = 1,
  tooltip,
  source,
  status,
  isPrototypeDefault,
}: NumberInputProps) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-slate-700 truncate" title={tooltip}>
          {label}
        </label>
        {isPrototypeDefault && <PrototypeDefaultBadge />}
      </div>
      <div className="flex items-center gap-2">
        <input
          aria-label={label}
          type="number"
          value={value}
          onChange={(e) => {
            const v = parseFloat(e.target.value);
            onChange(Number.isFinite(v) ? Math.max(min, Math.min(max ?? (unit === '%' ? 100 : 1e9), v)) : 0);
          }}
          min={min}
          max={max}
          step={step}
          className="min-w-0 w-full flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        />
        {unit && <span className="text-xs text-slate-500 whitespace-nowrap min-w-[70px]">{unit}</span>}
      </div>
      {(source || status) && (
        <div className="flex flex-wrap items-center gap-2 text-xs pt-0.5">
          {source && <span className="text-slate-400 truncate max-w-xs" title={source}>Src: {source}</span>}
          {status && <StatusBadge status={status} />}
        </div>
      )}
    </div>
  );
}

interface TextInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  tooltip?: string;
}

export function TextInput({ label, value, onChange, placeholder, tooltip }: TextInputProps) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-slate-700" title={tooltip}>
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
      />
    </div>
  );
}

interface SelectInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[] | { value: string; label: string }[];
  tooltip?: string;
}

export function SelectInput({ label, value, onChange, options, tooltip }: SelectInputProps) {
  const opts = options.map((o) => (typeof o === 'string' ? { value: o, label: o } : o));
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-slate-700" title={tooltip}>
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
      >
        {opts.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

interface ToggleInputProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function ToggleInput({ label, checked, onChange }: ToggleInputProps) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? 'bg-blue-600' : 'bg-slate-300'}`}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
      <span className="text-sm font-medium text-slate-700">{label}</span>
    </label>
  );
}

// ============================================================
// STATUS BADGE (11 Official Factor Classifications + Overrides)
// ============================================================

export function StatusBadge({ status }: { status: FactorClassification | string }) {
  const colors: Record<string, string> = {
    'STATUTORY REQUIREMENT': 'bg-emerald-100 text-emerald-800 border-emerald-300',
    'AUTHORITY REQUIREMENT': 'bg-blue-100 text-blue-800 border-blue-300',
    'STANDARD REQUIREMENT': 'bg-indigo-100 text-indigo-800 border-indigo-300',
    'PROJECT SPECIFICATION': 'bg-cyan-100 text-cyan-800 border-cyan-300',
    'MANUFACTURER REQUIREMENT': 'bg-purple-100 text-purple-800 border-purple-300',
    'ENGINEERING CALCULATION': 'bg-slate-100 text-slate-800 border-slate-300',
    'PUBLISHED GUIDANCE': 'bg-sky-100 text-sky-800 border-sky-300',
    'PROTOTYPE STANDARD FACTOR': 'bg-amber-100 text-amber-800 border-amber-300',
    'ENGINEERING ASSUMPTION': 'bg-yellow-100 text-yellow-800 border-yellow-300',
    'USER DEFINED': 'bg-zinc-100 text-zinc-800 border-zinc-300',
    'VERIFICATION REQUIRED': 'bg-red-100 text-red-800 border-red-300',
    'USER OVERRIDE': 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-300 font-bold',
    // Legacy support
    'Standard Requirement': 'bg-indigo-100 text-indigo-800 border-indigo-300',
    'Guidance Value': 'bg-sky-100 text-sky-800 border-sky-300',
    'Manufacturer Requirement': 'bg-purple-100 text-purple-800 border-purple-300',
    'Client Requirement': 'bg-cyan-100 text-cyan-800 border-cyan-300',
    'Engineering Assumption': 'bg-amber-100 text-amber-800 border-amber-300',
    'User Defined': 'bg-zinc-100 text-zinc-800 border-zinc-300',
    'Verification Required': 'bg-red-100 text-red-800 border-red-300',
  };

  const cls = colors[status] || 'bg-slate-100 text-slate-700 border-slate-200';

  return (
    <span className={`px-2 py-0.5 text-[11px] rounded border font-medium whitespace-nowrap ${cls}`}>
      {status}
    </span>
  );
}

// ============================================================
// ENGINEERING WARNING CARD (Section 58 format)
// ============================================================

export function WarningCard({ warning }: { warning: EngineeringWarning }) {
  const configs = {
    critical: {
      border: 'border-red-400 bg-red-50/70',
      badge: 'bg-red-600 text-white',
      title: 'text-red-900',
      icon: <Flame className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />,
      label: 'CRITICAL',
    },
    warning: {
      border: 'border-amber-400 bg-amber-50/70',
      badge: 'bg-amber-600 text-white',
      title: 'text-amber-900',
      icon: <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />,
      label: 'WARNING',
    },
    advisory: {
      border: 'border-blue-400 bg-blue-50/70',
      badge: 'bg-blue-600 text-white',
      title: 'text-blue-900',
      icon: <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />,
      label: 'ADVISORY',
    },
    info: {
      border: 'border-slate-300 bg-slate-50',
      badge: 'bg-slate-600 text-white',
      title: 'text-slate-800',
      icon: <Activity className="w-5 h-5 text-slate-600 mt-0.5 flex-shrink-0" />,
      label: 'INFORMATION',
    },
  };

  const c = configs[warning.level] || configs.info;

  return (
    <div className={`p-4 rounded-lg border ${c.border} text-xs shadow-2xs space-y-2`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2">
          {c.icon}
          <div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${c.badge}`}>
                {c.label}
              </span>
              <span className="text-slate-500 font-semibold">{warning.section}</span>
            </div>
            <h4 className={`text-sm font-bold mt-1 ${c.title}`}>{warning.message}</h4>
          </div>
        </div>
      </div>

      {(warning.currentValue || warning.referenceValue) && (
        <div className="grid grid-cols-2 gap-2 bg-white/80 p-2 rounded border border-slate-200 font-mono text-[11px]">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-sans">Current Value</span>
            <span className="font-bold text-slate-800">{warning.currentValue || '—'}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-sans">Reference / Criterion</span>
            <span className="font-bold text-slate-800">{warning.referenceValue || '—'}</span>
          </div>
        </div>
      )}

      {warning.whyItMatters && (
        <p className="text-slate-700 leading-relaxed">
          <strong>Why It Matters:</strong> {warning.whyItMatters}
        </p>
      )}

      {warning.recommendedAction && (
        <div className="bg-white/90 p-2 rounded text-blue-900 border border-blue-200">
          <strong>Recommended Action:</strong> {warning.recommendedAction}
        </div>
      )}

      {(warning.source || warning.classification) && (
        <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60 text-slate-500">
          {warning.source && <span>Basis: {warning.source}</span>}
          {warning.classification && <StatusBadge status={warning.classification} />}
        </div>
      )}
    </div>
  );
}

// ============================================================
// RESULT CARD
// ============================================================

interface ResultCardProps {
  label: string;
  value: string | number;
  unit: string;
  formula?: string;
  substitution?: string;
  interpretation?: string;
  icon?: ReactNode;
  color?: 'blue' | 'green' | 'amber' | 'red' | 'slate' | 'cyan';
}

export function ResultCard({
  label,
  value,
  unit,
  formula,
  substitution,
  interpretation,
  icon,
  color = 'blue',
}: ResultCardProps) {
  const colorClasses = {
    blue: 'from-blue-50 to-blue-100/50 border-blue-200 text-blue-900',
    green: 'from-green-50 to-green-100/50 border-green-200 text-green-900',
    amber: 'from-amber-50 to-amber-100/50 border-amber-200 text-amber-900',
    red: 'from-red-50 to-red-100/50 border-red-200 text-red-900',
    slate: 'from-slate-50 to-slate-100/50 border-slate-200 text-slate-900',
    cyan: 'from-cyan-50 to-cyan-100/50 border-cyan-200 text-cyan-900',
  };

  return (
    <div className={`rounded-lg border bg-gradient-to-br ${colorClasses[color]} p-4`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-slate-600">{label}</span>
        {icon}
      </div>
      <div className="text-2xl font-bold">
        {value}
        <span className="text-sm font-normal text-slate-500 ml-1">{unit}</span>
      </div>
      {formula && (
        <div className="mt-2 pt-2 border-t border-slate-200/50 text-xs text-slate-600">
          <div className="font-mono">{formula}</div>
          {substitution && <div className="font-mono mt-0.5 text-slate-500">{substitution}</div>}
        </div>
      )}
      {interpretation && (
        <div className="mt-1.5 text-xs text-slate-500 italic">{interpretation}</div>
      )}
    </div>
  );
}

// ============================================================
// CALCULATION DISPLAY
// ============================================================

interface CalcDisplayProps {
  title: string;
  result: string;
  unit: string;
  formula: string;
  substitution: string;
  status?: string;
}

export function CalcDisplay({ title, result, unit, formula, substitution, status }: CalcDisplayProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-slate-800">{title}</h4>
        {status && <StatusBadge status={status} />}
      </div>
      <div className="bg-slate-50 rounded-md p-3 text-sm font-mono space-y-1">
        <div className="text-slate-600">Formula: {formula}</div>
        <div className="text-slate-500">= {substitution}</div>
        <div className="text-blue-700 font-bold pt-1 border-t border-slate-200">
          = {result} {unit}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// DATA TABLE
// ============================================================

interface DataTableProps {
  headers: string[];
  rows: (string | number)[][];
  caption?: string;
  statusColumn?: number;
}

export function DataTable({ headers, rows, caption, statusColumn }: DataTableProps) {
  return (
    <div className="overflow-x-auto">
      {caption && <p className="text-sm text-slate-600 mb-2">{caption}</p>}
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-slate-100 border-b-2 border-slate-200">
            {headers.map((h, i) => (
              <th key={i} className="text-left px-3 py-2 font-semibold text-slate-700 whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} className="border-b border-slate-100 hover:bg-slate-50">
              {row.map((cell, ci) => (
                <td key={ci} className="px-3 py-2 text-slate-600 whitespace-nowrap">
                  {statusColumn === ci && typeof cell === 'string' ? <StatusBadge status={cell} /> : cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ============================================================
// STATUS INDICATOR
// ============================================================

export function StatusIndicator({ status }: { status: 'green' | 'amber' | 'red' }) {
  const config = {
    green: { color: 'bg-green-500', text: 'ADEQUATE', textCls: 'text-green-700' },
    amber: { color: 'bg-amber-500', text: 'MARGINAL', textCls: 'text-amber-700' },
    red: { color: 'bg-red-500', text: 'INADEQUATE', textCls: 'text-red-700' },
  };
  const c = config[status] || config.amber;
  return (
    <span className="inline-flex items-center gap-2">
      <span className={`w-3 h-3 rounded-full ${c.color}`} />
      <span className={`text-xs font-bold ${c.textCls}`}>{c.text}</span>
    </span>
  );
}

// ============================================================
// SECTION HEADER
// ============================================================

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  step?: number | string;
}

export function SectionHeader({ title, subtitle, icon, step }: SectionHeaderProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-3">
        {step !== undefined && (
          <span className="flex items-center justify-center min-w-[32px] h-8 px-2 rounded-full bg-blue-600 text-white text-sm font-bold">
            {step}
          </span>
        )}
        {icon}
        <div>
          <h2 className="text-xl font-bold text-slate-800">{title}</h2>
          {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// CARD CONTAINER
// ============================================================

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-lg border border-slate-200 shadow-xs p-5 ${className}`}>
      {children}
    </div>
  );
}

// ============================================================
// TABS
// ============================================================

interface TabsProps {
  tabs: { id: string; label: string }[];
  active: string;
  onChange: (id: string) => void;
}

export function Tabs({ tabs, active, onChange }: TabsProps) {
  return (
    <div className="flex gap-1 border-b border-slate-200 overflow-x-auto">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
            active === tab.id
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

// ============================================================
// BAR CHART
// ============================================================

interface BarChartProps {
  data: { label: string; value: number; color?: string }[];
  unit?: string;
  height?: number;
}

export function BarChart({ data, unit = '', height = 200 }: BarChartProps) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="space-y-2" style={{ minHeight: height }}>
      {data.map((d, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="text-xs text-slate-600 w-36 truncate text-right">{d.label}</span>
          <div className="flex-1 bg-slate-100 rounded-full h-6 relative overflow-hidden">
            <div
              className={`h-full rounded-full ${d.color || 'bg-blue-500'} transition-all duration-500`}
              style={{ width: `${(d.value / max) * 100}%` }}
            />
            <span className="absolute right-2 top-0 text-xs font-medium text-slate-700 leading-6">
              {d.value.toLocaleString()} {unit}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// PROGRESS RING
// ============================================================

export function ProgressRing({ pct, size = 80, label }: { pct: number; size?: number; label?: string }) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;
  const color = pct >= 90 ? '#16a34a' : pct >= 50 ? '#d97706' : '#dc2626';

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e2e8f0" strokeWidth="4" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-lg font-bold" style={{ color }}>{pct}%</span>
        {label && <span className="text-xs text-slate-500">{label}</span>}
      </div>
    </div>
  );
}

// ============================================================
// KPI CARD
// ============================================================

interface KPICardProps {
  label: string;
  value: string | number;
  unit?: string;
  icon?: ReactNode;
  color?: 'blue' | 'green' | 'amber' | 'red' | 'cyan' | 'slate';
}

export function KPICard({ label, value, unit, icon, color = 'blue' }: KPICardProps) {
  const colors = {
    blue: 'border-blue-200 bg-blue-50 text-blue-700',
    green: 'border-green-200 bg-green-50 text-green-700',
    amber: 'border-amber-200 bg-amber-50 text-amber-700',
    red: 'border-red-200 bg-red-50 text-red-700',
    cyan: 'border-cyan-200 bg-cyan-50 text-cyan-700',
    slate: 'border-slate-200 bg-slate-50 text-slate-700',
  };

  return (
    <div className={`rounded-lg border p-4 ${colors[color]}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium opacity-80">{label}</span>
        {icon}
      </div>
      <div className="text-xl font-bold">
        {value}
        {unit && <span className="text-sm font-normal ml-1 opacity-70">{unit}</span>}
      </div>
    </div>
  );
}
