import { useProject } from '@/context/ProjectContext';
import { useState, useEffect, type ReactNode } from 'react';
import {
  ChevronDown,
  Info,
  BookOpen,
  AlertTriangle,
  Lightbulb,
  ShieldAlert,
  Flame,
  HelpCircle,
  Activity,
  Droplets,
  GraduationCap,
  Sparkles,
  CheckCircle2,
  Layers,
  Gauge,
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
  const [text, setText] = useState<string>(String(value ?? 0));

  useEffect(() => {
    setText(String(value ?? 0));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setText(raw);
    if (raw === '' || raw === '-') {
      return;
    }
    const v = parseFloat(raw);
    if (Number.isFinite(v)) {
      const clamped = Math.max(min, Math.min(max ?? (unit === '%' ? 100 : 1e9), v));
      onChange(clamped);
    }
  };

  const handleBlur = () => {
    if (text === '' || text === '-') {
      setText(String(min));
      onChange(min);
    } else {
      const v = parseFloat(text);
      if (Number.isFinite(v)) {
        const clamped = Math.max(min, Math.min(max ?? (unit === '%' ? 100 : 1e9), v));
        setText(String(clamped));
        onChange(clamped);
      } else {
        setText(String(value ?? 0));
      }
    }
  };

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
          value={text}
          onChange={handleChange}
          onBlur={handleBlur}
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
        {typeof value === 'number'
          ? (Number.isInteger(value) ? value : value.toFixed(2))
          : value}
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

// ============================================================
// STUDENT STEP-BY-STEP CALCULATION BREAKDOWN
// ============================================================

export interface CalculationStepItem {
  stepNumber: number;
  title: string;
  description?: string;
  formula?: string;
  mathSubstitution?: string;
  intermediateResult?: string | number;
  unit?: string;
  notes?: string;
}

export interface StudentCalculationCardProps {
  title: string;
  standardRef?: string;
  governingFormula: string;
  formulaVariables: { symbol: string; meaning: string; unit: string; value?: string | number }[];
  steps: CalculationStepItem[];
  finalResult?: { label: string; value: string | number; unit: string; status?: string };
  engineeringRuleOfThumb?: string;
  defaultOpen?: boolean;
}

export function StudentCalculationCard({
  title,
  standardRef,
  governingFormula,
  formulaVariables,
  steps,
  finalResult,
  engineeringRuleOfThumb,
  defaultOpen = true,
}: StudentCalculationCardProps) {
  const { studentMode } = useProject();
  const [open, setOpen] = useState(studentMode ? defaultOpen : false);
  const [viewMode, setViewMode] = useState<'stepwise' | 'compact'>('stepwise');

  useEffect(() => {
    setOpen(studentMode ? defaultOpen : false);
  }, [studentMode, defaultOpen]);

  return (
    <div className="border border-indigo-200/90 rounded-xl bg-white shadow-xs overflow-hidden my-4 transition-all">
      {/* Header */}
      <div
        onClick={() => setOpen(!open)}
        className="cursor-pointer bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 select-none hover:brightness-105 transition-all"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-amber-300">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-indigo-300 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" /> Educational Calculation Walkthrough
              </span>
              {standardRef && (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-800/80 text-indigo-200 border border-indigo-600/40">
                  {standardRef}
                </span>
              )}
            </div>
            <h4 className="text-base font-bold text-white tracking-tight">{title}</h4>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {finalResult && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-white/10 backdrop-blur-xs text-xs font-semibold text-indigo-100">
              <span>{finalResult.label}:</span>
              <span className="text-amber-300 font-mono font-bold">
                {finalResult.value} {finalResult.unit}
              </span>
            </div>
          )}
          <ChevronDown className={`w-5 h-5 text-indigo-300 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {/* Collapsible Content */}
      {open && (
        <div className="p-5 space-y-5 bg-gradient-to-b from-indigo-50/20 via-white to-white">
          {/* Top Bar: Mode switcher & Educational Notice */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-indigo-100 pb-3">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
              <BookOpen className="w-4 h-4 text-indigo-600" />
              <span>Step-by-step breakdown tailored for university/polytechnic students and reviewing engineers</span>
            </div>
            <div className="flex items-center rounded-lg bg-slate-100 p-0.5 text-xs font-semibold">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setViewMode('stepwise'); }}
                className={`px-3 py-1 rounded-md transition-colors ${viewMode === 'stepwise' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Detailed Steps
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setViewMode('compact'); }}
                className={`px-3 py-1 rounded-md transition-colors ${viewMode === 'compact' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Formula & Variables
              </button>
            </div>
          </div>

          {/* Governing Formula Banner */}
          <div className="bg-slate-900 rounded-lg p-4 text-white shadow-inner space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="uppercase tracking-wider font-semibold text-indigo-400 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" /> Governing Engineering Formula
              </span>
              {standardRef && <span>Standard: {standardRef}</span>}
            </div>
            <div className="font-mono text-base sm:text-lg font-bold text-amber-300 tracking-wide overflow-x-auto py-1">
              {governingFormula}
            </div>
          </div>

          {/* Variables Legend */}
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Extracted Project Parameters & Variables
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
              {formulaVariables.map((v, i) => (
                <div key={i} className="bg-white border border-slate-200 rounded-lg p-2.5 shadow-2xs flex flex-col justify-between">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-mono font-bold text-indigo-700 text-sm bg-indigo-50 px-1.5 py-0.5 rounded">
                      {v.symbol}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">[{v.unit}]</span>
                  </div>
                  <div className="text-xs text-slate-600 font-medium mt-1 leading-snug">{v.meaning}</div>
                  {v.value !== undefined && (
                    <div className="text-xs font-mono font-bold text-slate-900 mt-1.5 pt-1 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 uppercase font-sans">Active</span>
                      <span>{v.value} {v.unit}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Step-by-Step Chain */}
          {viewMode === 'stepwise' && (
            <div className="space-y-3 pt-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Mathematical Execution & Derivation Sequence
              </span>
              <div className="space-y-3 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-indigo-200">
                {steps.map((st) => (
                  <div key={st.stepNumber} className="relative flex items-start gap-3.5 pl-1">
                    <div className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 z-10 shadow-xs ring-4 ring-white">
                      {st.stepNumber}
                    </div>
                    <div className="flex-1 bg-white border border-slate-200/90 rounded-lg p-3.5 shadow-2xs space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <h5 className="text-xs font-bold text-slate-800">{st.title}</h5>
                        {st.intermediateResult && (
                          <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                            = {st.intermediateResult} {st.unit || ''}
                          </span>
                        )}
                      </div>
                      {st.description && (
                        <p className="text-xs text-slate-600 leading-relaxed">{st.description}</p>
                      )}
                      {st.formula && (
                        <div className="font-mono text-xs text-slate-700 bg-slate-50 p-2 rounded border border-slate-200/80">
                          <span className="text-slate-400 mr-2 font-sans text-[10px] uppercase">Form:</span>
                          {st.formula}
                        </div>
                      )}
                      {st.mathSubstitution && (
                        <div className="font-mono text-xs text-indigo-950 bg-indigo-50/50 p-2 rounded border border-indigo-100">
                          <span className="text-indigo-500 mr-2 font-sans text-[10px] uppercase font-bold">Subst:</span>
                          {st.mathSubstitution}
                        </div>
                      )}
                      {st.notes && (
                        <div className="text-[11px] text-amber-800 bg-amber-50/60 rounded px-2 py-1 border border-amber-200/50 flex items-center gap-1.5 mt-1">
                          <Lightbulb className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                          <span>{st.notes}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rule of Thumb / Viva Insight */}
          {engineeringRuleOfThumb && (
            <div className="bg-amber-50/70 border border-amber-200/80 rounded-lg p-3 text-xs text-amber-900 flex items-start gap-2.5">
              <Lightbulb className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold text-amber-950 block mb-0.5">
                  Engineering Insight & Examination Note:
                </strong>
                <p className="leading-relaxed text-amber-900/90">{engineeringRuleOfThumb}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================
// VISUAL TANK CROSS-SECTION DIAGRAM
// ============================================================

export interface VisualTankCrossSectionProps {
  label: string;
  shape: 'Rectangular' | 'Cylindrical';
  length: number;
  width: number;
  effectiveDepth: number;
  freeboard: number;
  effectiveVolume: number;
  grossVolume: number;
  requiredCapacity?: number;
  status: 'green' | 'amber' | 'red';
}

export function VisualTankCrossSection({
  label,
  shape,
  length,
  width,
  effectiveDepth,
  freeboard,
  effectiveVolume,
  grossVolume,
  requiredCapacity = 0,
  status,
}: VisualTankCrossSectionProps) {
  const totalDepth = Math.max(effectiveDepth + freeboard, 0.1);
  const waterPct = Math.min(100, Math.max(10, (effectiveDepth / totalDepth) * 100));

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
        <div>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Schematic Tank Section ({shape})
          </span>
          <h4 className="text-sm font-bold text-slate-800">{label}</h4>
        </div>
        <StatusIndicator status={status} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        {/* SVG Cross-Section Graphic */}
        <div className="md:col-span-7 bg-slate-900 rounded-lg p-3 flex flex-col items-center justify-center text-white relative overflow-hidden">
          <svg viewBox="0 0 340 180" className="w-full h-44 max-w-[340px]">
            {/* Tank Shell Wall */}
            <rect x="30" y="20" width="280" height="135" rx="4" fill="#1e293b" stroke="#64748b" strokeWidth="2.5" />

            {/* Freeboard Air Space (Top) */}
            <rect x="33" y="23" width="274" height={30} fill="#0f172a" />
            <text x="170" y="42" fill="#94a3b8" fontSize="10" textAnchor="middle" fontFamily="sans-serif">
              Air Gap Freeboard: {freeboard.toFixed(2)} m
            </text>

            {/* Water Reservoir Zone */}
            <rect x="33" y="55" width="274" height="97" fill="url(#tankWaterGrad)" opacity="0.85" />
            <path d="M 33 55 Q 100 52 170 55 T 307 55" fill="none" stroke="#38bdf8" strokeWidth="1.5" />

            {/* Water label */}
            <text x="170" y="95" fill="#ffffff" fontSize="12" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">
              Active Storage: {effectiveVolume.toFixed(2)} m³
            </text>
            <text x="170" y="112" fill="#bae6fd" fontSize="9.5" textAnchor="middle" fontFamily="sans-serif">
              Effective Depth: {effectiveDepth.toFixed(2)} m ({waterPct.toFixed(0)}% fill)
            </text>

            {/* Inflow Pipe Top Right */}
            <rect x="260" y="8" width="12" height="25" fill="#3b82f6" />
            <path d="M 260 33 L 272 33" stroke="#93c5fd" strokeWidth="2" />
            <text x="266" y="6" fill="#93c5fd" fontSize="8" textAnchor="middle">Inlet (Air Gap)</text>

            {/* Overflow Pipe Top Left */}
            <rect x="18" y="45" width="15" height="8" fill="#f59e0b" />
            <text x="12" y="40" fill="#fcd34d" fontSize="8">Overflow</text>

            {/* Suction Pipe Bottom Left */}
            <rect x="18" y="130" width="15" height="12" fill="#10b981" />
            <text x="12" y="152" fill="#6ee7b7" fontSize="8">To Pumps</text>

            {/* Bottom Sump Drain */}
            <rect x="160" y="155" width="20" height="8" fill="#64748b" />

            {/* Dimension Lines (Length & Width) */}
            <line x1="30" y1="168" x2="310" y2="168" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3 3" />
            <text x="170" y="177" fill="#cbd5e1" fontSize="9" textAnchor="middle">
              {shape === 'Cylindrical' ? `Diameter: ${length} m` : `Length: ${length} m × Width: ${width} m`}
            </text>

            <defs>
              <linearGradient id="tankWaterGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#0284c7" />
                <stop offset="100%" stopColor="#0369a1" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Technical Data & Ratios */}
        <div className="md:col-span-5 space-y-2.5 text-xs">
          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-1">
            <div className="flex justify-between text-slate-500 font-medium">
              <span>Required Compartment Capacity:</span>
              <span className="font-bold text-slate-800">{requiredCapacity.toFixed(2)} m³</span>
            </div>
            <div className="flex justify-between text-slate-500 font-medium">
              <span>Effective Water Volume (V_eff):</span>
              <span className="font-bold text-blue-700">{effectiveVolume.toFixed(2)} m³</span>
            </div>
            <div className="flex justify-between text-slate-500 font-medium">
              <span>Gross Internal Volume (V_gross):</span>
              <span className="font-bold text-slate-800">{grossVolume.toFixed(2)} m³</span>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[11px] font-semibold text-slate-600">
              <span>Storage Adequacy Fill Ratio</span>
              <span>{requiredCapacity > 0 ? ((effectiveVolume / requiredCapacity) * 100).toFixed(0) : 100}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  status === 'green' ? 'bg-emerald-500' : status === 'amber' ? 'bg-amber-500' : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(100, requiredCapacity > 0 ? (effectiveVolume / requiredCapacity) * 100 : 100)}%` }}
              />
            </div>
          </div>

          <div className="text-[11px] text-slate-500 leading-relaxed bg-blue-50/50 p-2 rounded border border-blue-100">
            <strong>Student Note:</strong> Effective capacity excludes freeboard depth ({freeboard} m) and bottom silt allowance to ensure sediment is never pulled into booster pumps.
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// VISUAL HYDRAULIC GRADIENT DIAGRAM
// ============================================================

export interface VisualHydraulicGradientProps {
  pipeLabel: string;
  material: string;
  diameterMm: number;
  lengthM: number;
  flowLps: number;
  velocity: number;
  inletHeadM: number;
  frictionLossM: number;
  fittingLossM: number;
  elevationDifferenceM: number;
  residualPressureM: number;
  minRequiredResidualM?: number;
}

export function VisualHydraulicGradient({
  pipeLabel,
  material,
  diameterMm,
  lengthM,
  flowLps,
  velocity,
  inletHeadM,
  frictionLossM,
  fittingLossM,
  elevationDifferenceM,
  residualPressureM,
  minRequiredResidualM = 10,
}: VisualHydraulicGradientProps) {
  const totalLoss = frictionLossM + fittingLossM;
  const isVelocityOk = velocity >= 0.8 && velocity <= 1.5;
  const isPressureOk = residualPressureM >= minRequiredResidualM;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
        <div>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Hydraulic Grade Line (HGL) Simulation
          </span>
          <h4 className="text-sm font-bold text-slate-800">{pipeLabel} — {material} (DN {diameterMm} mm)</h4>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
            isPressureOk ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
          }`}>
            {isPressureOk ? 'RESIDUAL HEAD ADEQUATE' : 'PRESSURE DEFICIENT'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        {/* SVG HGL Schematic */}
        <div className="md:col-span-7 bg-slate-900 rounded-lg p-3 flex flex-col items-center justify-center text-white relative">
          <svg viewBox="0 0 350 160" className="w-full h-40 max-w-[350px]">
            {/* Ground Baseline */}
            <line x1="30" y1="130" x2="320" y2="130" stroke="#475569" strokeWidth="1.5" />
            <text x="35" y="145" fill="#64748b" fontSize="8.5">Datum: 0.0 m</text>

            {/* Upstream Station (Inlet Node) */}
            <circle cx="50" cy="130" r="4" fill="#3b82f6" />
            <line x1="50" y1="130" x2="50" y2="40" stroke="#3b82f6" strokeWidth="2" strokeDasharray="2 2" />
            <circle cx="50" cy="40" r="4" fill="#60a5fa" />
            <text x="50" y="30" fill="#93c5fd" fontSize="9" fontWeight="bold" textAnchor="middle">
              Inlet Head: {inletHeadM.toFixed(1)} m
            </text>

            {/* Hydraulic Grade Line (HGL Sloping line) */}
            <path d="M 50 40 L 300 85" stroke="#f59e0b" strokeWidth="2.5" />
            <text x="175" y="55" fill="#fcd34d" fontSize="9" fontWeight="bold" textAnchor="middle">
              HGL (Friction Loss h_f: {frictionLossM.toFixed(2)} m)
            </text>

            {/* Downstream Station (Discharge Node) */}
            <circle cx="300" cy="130" r="4" fill="#10b981" />
            <line x1="300" y1="130" x2="300" y2="85" stroke="#10b981" strokeWidth="2" strokeDasharray="2 2" />
            <circle cx="300" cy="85" r="4" fill="#34d399" />
            <text x="300" y="75" fill="#6ee7b7" fontSize="9" fontWeight="bold" textAnchor="middle">
              Residual: {residualPressureM.toFixed(1)} m
            </text>

            {/* Minimum Residual Line */}
            <line x1="280" y1="95" x2="320" y2="95" stroke="#ef4444" strokeWidth="1" strokeDasharray="2 2" />
            <text x="325" y="98" fill="#fca5a5" fontSize="7.5">Min 10m</text>

            {/* Pipe Span & Flow */}
            <line x1="50" y1="130" x2="300" y2="130" stroke="#38bdf8" strokeWidth="3" />
            <text x="175" y="122" fill="#bae6fd" fontSize="8.5" textAnchor="middle">
              Length: {lengthM} m | Flow: {flowLps.toFixed(2)} L/s →
            </text>
          </svg>
        </div>

        {/* Velocity Gauge & Student Metrics */}
        <div className="md:col-span-5 space-y-2.5 text-xs">
          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-600 font-medium flex items-center gap-1">
                <Gauge className="w-3.5 h-3.5 text-blue-600" /> Pipe Velocity:
              </span>
              <span className={`font-mono font-bold ${isVelocityOk ? 'text-emerald-700' : 'text-amber-700'}`}>
                {velocity.toFixed(2)} m/s
              </span>
            </div>
            {/* Velocity Scale bar */}
            <div className="w-full bg-slate-200 rounded-full h-2 relative overflow-hidden">
              <div
                className={`h-full rounded-full ${velocity > 2.0 ? 'bg-red-500' : velocity < 0.8 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                style={{ width: `${Math.min(100, (velocity / 2.5) * 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>0 m/s</span>
              <span className="text-emerald-600 font-bold">0.8 - 1.5 m/s (Ideal)</span>
              <span>2.5 m/s</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="p-2 bg-slate-50 rounded border border-slate-200">
              <span className="text-slate-400 block text-[10px] uppercase">Friction Head Loss</span>
              <span className="font-bold font-mono text-slate-800">{frictionLossM.toFixed(2)} m</span>
            </div>
            <div className="p-2 bg-slate-50 rounded border border-slate-200">
              <span className="text-slate-400 block text-[10px] uppercase">Fitting Losses</span>
              <span className="font-bold font-mono text-slate-800">{fittingLossM.toFixed(2)} m</span>
            </div>
            <div className="p-2 bg-slate-50 rounded border border-slate-200">
              <span className="text-slate-400 block text-[10px] uppercase">Static Elevation</span>
              <span className="font-bold font-mono text-slate-800">{elevationDifferenceM.toFixed(2)} m</span>
            </div>
            <div className="p-2 bg-indigo-50/70 rounded border border-indigo-200">
              <span className="text-indigo-600 block text-[10px] uppercase font-semibold">Total Head Loss</span>
              <span className="font-bold font-mono text-indigo-900">{totalLoss.toFixed(2)} m</span>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 leading-relaxed bg-indigo-50/50 p-2 rounded border border-indigo-100">
            <strong>Student Note:</strong> Hazen-Williams friction loss h_f is proportional to Q^1.852 and inversely proportional to D^4.87. A small increase in pipe diameter significantly cuts friction head loss!
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// VISUAL THERMAL SPECTRUM (HOT WATER & LEGIONELLA CONTROL)
// ============================================================

export interface VisualThermalSpectrumProps {
  coldWaterTempC: number;
  deliveryTempC: number;
  storageTempC: number;
}

export function VisualThermalSpectrum({
  coldWaterTempC,
  deliveryTempC,
  storageTempC,
}: VisualThermalSpectrumProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <div>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Thermal Spectrum & Legionella Inactivation Control
          </span>
          <h4 className="text-sm font-bold text-slate-800">Temperature Safety Gradient (BS 8558 / CIBSE Guide G)</h4>
        </div>
        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800">
          60°C Storage Standard
        </span>
      </div>

      {/* Temperature Bar */}
      <div className="relative pt-6 pb-2">
        <div className="h-6 w-full rounded-full flex overflow-hidden shadow-inner border border-slate-300">
          <div className="w-[25%] bg-blue-500 flex items-center justify-center text-[10px] font-bold text-white" title="Cold Mains Supply">
            &lt; 20°C
          </div>
          <div className="w-[35%] bg-amber-500 flex items-center justify-center text-[10px] font-bold text-white relative overflow-hidden" title="Legionella Risk Zone">
            <span className="relative z-10">20°C – 45°C (Legionella Growth Risk)</span>
          </div>
          <div className="w-[15%] bg-emerald-500 flex items-center justify-center text-[10px] font-bold text-white" title="Safe TMV Blended Tap">
            38–43°C
          </div>
          <div className="w-[25%] bg-red-600 flex items-center justify-center text-[10px] font-bold text-white" title="Hot Storage Cylinder">
            ≥ 60°C (Sterile)
          </div>
        </div>

        {/* Project Markers */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-4 text-xs">
          <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200 flex items-center gap-2">
            <Droplets className="w-4 h-4 text-blue-600" />
            <div>
              <span className="text-slate-500 block text-[10px]">Ambient Cold Water</span>
              <strong className="text-blue-900 font-bold text-sm">{coldWaterTempC} °C</strong>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <div>
              <span className="text-slate-500 block text-[10px]">Point-of-Use Delivery</span>
              <strong className="text-emerald-900 font-bold text-sm">{deliveryTempC} °C (TMV Safe)</strong>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 flex items-center gap-2">
            <Flame className="w-4 h-4 text-red-600" />
            <div>
              <span className="text-slate-500 block text-[10px]">Hot Storage Cylinder</span>
              <strong className="text-red-900 font-bold text-sm">{storageTempC} °C (≥60°C Req)</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// VISUAL PUMP SYSTEM & DUTY CURVE
// ============================================================

export interface VisualPumpSystemCurveProps {
  designFlowLps: number;
  designFlowM3h: number;
  tdhM: number;
  staticHeadM: number;
  frictionHeadM: number;
  residualHeadM: number;
  hydraulicPowerKw: number;
  motorPowerKw: number;
  pumpEfficiencyPct: number;
  motorEfficiencyPct: number;
}

export function VisualPumpSystemCurve({
  designFlowLps,
  designFlowM3h,
  tdhM,
  staticHeadM,
  frictionHeadM,
  residualHeadM,
  hydraulicPowerKw,
  motorPowerKw,
  pumpEfficiencyPct,
  motorEfficiencyPct,
}: VisualPumpSystemCurveProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
        <div>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Hydraulic Pump System Curve
          </span>
          <h4 className="text-sm font-bold text-slate-800">
            Duty Point: {designFlowM3h.toFixed(1)} m³/h ({designFlowLps.toFixed(2)} L/s) @ {tdhM.toFixed(1)} m TDH
          </h4>
        </div>
        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-green-100 text-green-800">
          Motor Duty: {motorPowerKw.toFixed(2)} kW
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        {/* SVG Curve Graphic */}
        <div className="md:col-span-7 bg-slate-900 rounded-lg p-3 flex flex-col items-center justify-center text-white relative">
          <svg viewBox="0 0 350 180" className="w-full h-44 max-w-[350px]">
            {/* Grid Axes */}
            <line x1="40" y1="150" x2="320" y2="150" stroke="#64748b" strokeWidth="1.5" />
            <line x1="40" y1="20" x2="40" y2="150" stroke="#64748b" strokeWidth="1.5" />
            <text x="320" y="165" fill="#94a3b8" fontSize="8.5" textAnchor="end">Flow Q (m³/h) →</text>
            <text x="25" y="25" fill="#94a3b8" fontSize="8.5" transform="rotate(-90 25,25)">Head H (m) →</text>

            {/* Static Head Baseline */}
            <line x1="40" y1="110" x2="320" y2="110" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3 3" />
            <text x="45" y="105" fill="#94a3b8" fontSize="8">Static Head: {staticHeadM} m</text>

            {/* Parabolic System Resistance Curve: H = H_static + k*Q^2 */}
            <path d="M 40 110 Q 180 100 300 40" stroke="#38bdf8" strokeWidth="2.5" fill="none" />
            <text x="290" y="32" fill="#38bdf8" fontSize="9" fontWeight="bold">System Curve</text>

            {/* Pump Head-Flow Curve (declining) */}
            <path d="M 40 45 Q 160 55 300 130" stroke="#a855f7" strokeWidth="2" strokeDasharray="4 2" fill="none" />
            <text x="70" y="42" fill="#c084fc" fontSize="8.5">Pump H-Q Curve</text>

            {/* Duty Point Intersection (Q_d, TDH) */}
            <circle cx="190" cy="80" r="5" fill="#f59e0b" />
            <circle cx="190" cy="80" r="9" fill="none" stroke="#f59e0b" strokeWidth="1" strokeDasharray="2 2" className="animate-ping" />
            <line x1="190" y1="80" x2="190" y2="150" stroke="#f59e0b" strokeWidth="1" strokeDasharray="2 2" />
            <line x1="40" y1="80" x2="190" y2="80" stroke="#f59e0b" strokeWidth="1" strokeDasharray="2 2" />
            <text x="195" y="75" fill="#fbbf24" fontSize="9.5" fontWeight="bold">
              Duty Point ({designFlowM3h.toFixed(1)} m³/h, {tdhM.toFixed(1)} m)
            </text>
          </svg>
        </div>

        {/* Efficiencies & Power Conversion */}
        <div className="md:col-span-5 space-y-2.5 text-xs">
          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-2">
            <div>
              <div className="flex justify-between font-medium text-slate-600 mb-0.5">
                <span>Hydraulic Power (P_hyd):</span>
                <span className="font-bold text-blue-700">{hydraulicPowerKw.toFixed(2)} kW</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono">P = (ρ × g × Q × TDH) / 1000</div>
            </div>

            <div className="border-t border-slate-200 pt-1.5">
              <div className="flex justify-between font-medium text-slate-600 mb-0.5">
                <span>Motor Shaft Power (P_motor):</span>
                <span className="font-bold text-emerald-700">{motorPowerKw.toFixed(2)} kW</span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-500">
                <span>Pump Eff: {pumpEfficiencyPct}%</span>
                <span>Motor Eff: {motorEfficiencyPct}%</span>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-1.5 text-[10.5px] text-slate-500 font-mono flex flex-col gap-0.5">
              <div className="font-sans font-semibold text-slate-600">TDH Composition:</div>
              <div className="flex justify-between">
                <span>Static + Friction + Residual:</span>
                <span className="font-bold text-slate-700">{staticHeadM}m + {frictionHeadM.toFixed(1)}m + {residualHeadM.toFixed(1)}m = {tdhM.toFixed(1)}m</span>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 leading-relaxed bg-amber-50/50 p-2 rounded border border-amber-200/60">
            <strong>Student Note:</strong> Always select the next standard commercial motor rating (e.g. {Math.ceil(motorPowerKw * 1.15)} kW) to avoid motor burnout during open-pipe runout conditions.
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// VISUAL WATER BALANCE FLOW CARD
// ============================================================

export interface VisualWaterBalanceFlowProps {
  sources: { name: string; value: number; pct: number }[];
  consumption: { name: string; value: number; pct: number }[];
  outflows: { name: string; value: number; pct: number }[];
  totalDemand: number;
}

export function VisualWaterBalanceFlow({
  sources,
  consumption,
  outflows,
  totalDemand,
}: VisualWaterBalanceFlowProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <div>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Site Water Balance Flow Diagram
          </span>
          <h4 className="text-sm font-bold text-slate-800">Conservation of Mass: &Sigma; Q_in = &Sigma; Q_out</h4>
        </div>
        <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded">
          Total Base: {(totalDemand / 1000).toFixed(2)} m³/day
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        {/* Inflows */}
        <div className="p-3 bg-cyan-50/60 border border-cyan-200/80 rounded-lg space-y-2">
          <div className="flex items-center justify-between font-bold text-cyan-900 border-b border-cyan-200/60 pb-1">
            <span>Water Sources (Inflows)</span>
            <span className="text-[11px]">L/day</span>
          </div>
          <div className="space-y-1.5">
            {sources.map((s, i) => (
              <div key={i} className="flex justify-between items-center text-slate-700">
                <span className="truncate">{s.name}</span>
                <span className="font-mono font-bold text-cyan-800">{s.value.toLocaleString()} <span className="text-[10px] text-slate-400">({s.pct}%)</span></span>
              </div>
            ))}
          </div>
        </div>

        {/* Hub / Consumption */}
        <div className="p-3 bg-blue-50/60 border border-blue-200/80 rounded-lg space-y-2">
          <div className="flex items-center justify-between font-bold text-blue-900 border-b border-blue-200/60 pb-1">
            <span>Facility End-Uses</span>
            <span className="text-[11px]">L/day</span>
          </div>
          <div className="space-y-1.5">
            {consumption.map((c, i) => (
              <div key={i} className="flex justify-between items-center text-slate-700">
                <span className="truncate">{c.name}</span>
                <span className="font-mono font-bold text-blue-800">{c.value.toLocaleString()} <span className="text-[10px] text-slate-400">({c.pct}%)</span></span>
              </div>
            ))}
          </div>
        </div>

        {/* Outflows / Wastewater */}
        <div className="p-3 bg-amber-50/60 border border-amber-200/80 rounded-lg space-y-2">
          <div className="flex items-center justify-between font-bold text-amber-900 border-b border-amber-200/60 pb-1">
            <span>Discharges & Outflows</span>
            <span className="text-[11px]">L/day</span>
          </div>
          <div className="space-y-1.5">
            {outflows.map((o, i) => (
              <div key={i} className="flex justify-between items-center text-slate-700">
                <span className="truncate">{o.name}</span>
                <span className="font-mono font-bold text-amber-800">{o.value.toLocaleString()} <span className="text-[10px] text-slate-400">({o.pct}%)</span></span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

