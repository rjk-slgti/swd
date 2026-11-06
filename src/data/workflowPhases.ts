import type { ComponentType } from 'react';
import {
  LayoutDashboard,
  BookOpen,
  Settings,
  Users,
  Droplets,
  FlaskConical,
  Calculator,
  Warehouse,
  Fuel,
  Flame,
  Trash2,
  CloudRain,
  Recycle,
  Activity,
  Leaf,
  ClipboardCheck,
  FileText,
  Layers,
} from 'lucide-react';

export interface WorkflowStep {
  id: string;
  stepNumber?: number | string;
  label: string;
  shortLabel: string;
  phaseId: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  badge?: string;
}

export interface WorkflowPhase {
  id: string;
  number: number;
  title: string;
  shortTitle: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  accentColor: string;
  bgGradient: string;
  steps: WorkflowStep[];
}

export const WORKFLOW_PHASES: WorkflowPhase[] = [
  {
    id: 'phase1',
    number: 1,
    title: 'Project',
    shortTitle: 'Project',
    description: 'Project details, design basis, and baseline parameters',
    icon: Layers,
    accentColor: 'blue',
    bgGradient: 'from-blue-600 to-indigo-700',
    steps: [
      {
        id: 'dashboard',
        label: 'Dashboard & Metrics',
        shortLabel: 'Overview',
        phaseId: 'phase1',
        description: 'Executive project summary, completion %, and key performance indicators',
        icon: LayoutDashboard,
      },
      {
        id: 'step1',
        stepNumber: 1,
        label: 'Project Details & Credentials',
        shortLabel: 'Details',
        phaseId: 'phase1',
        description: 'Building classification, project location, client, and engineering authorities',
        icon: Settings,
      },
      {
        id: 'standards',
        label: 'Design Basis & Standards',
        shortLabel: 'Standards',
        phaseId: 'phase1',
        description: 'BS EN 806, CIBSE Guide G, SLS 1373, and WPSF prototype factors',
        icon: BookOpen,
      },
    ],
  },
  {
    id: 'phase2',
    number: 2,
    title: 'People & Use',
    shortTitle: 'People & Use',
    description: 'People, daily water use, and peak fixture demand',
    icon: Droplets,
    accentColor: 'cyan',
    bgGradient: 'from-cyan-600 to-blue-700',
    steps: [
      {
        id: 'step2',
        stepNumber: 2,
        label: 'Occupancy & Population Groups',
        shortLabel: 'Occupancy',
        phaseId: 'phase2',
        description: 'Day students, residential hostel boarders, and duty-cycle normalization',
        icon: Users,
      },
      {
        id: 'step3',
        stepNumber: 3,
        label: 'Domestic Water Consumption',
        shortLabel: 'Domestic',
        phaseId: 'phase2',
        description: 'Per-capita allowances, ADD to MDD peaking factor, and loss margin',
        icon: Droplets,
      },
      {
        id: 'step4',
        stepNumber: 4,
        label: 'Special Water Uses',
        shortLabel: 'Special Uses',
        phaseId: 'phase2',
        description: 'Workshops, science labs, canteens, vehicle wash, and landscape irrigation',
        icon: FlaskConical,
      },
      {
        id: 'step6',
        stepNumber: 6,
        label: 'Peak Simultaneous Fixture Demand',
        shortLabel: 'Peak Demand',
        phaseId: 'phase2',
        description: 'Loading unit schedules, Hunter diversity curve, and design peak flow (L/s)',
        icon: Calculator,
      },
    ],
  },
  {
    id: 'phase3',
    number: 3,
    title: 'Water Sources & Reuse',
    shortTitle: 'Sources & Reuse',
    description: 'Water supply, balance, rainwater, wastewater, and reuse',
    icon: Warehouse,
    accentColor: 'indigo',
    bgGradient: 'from-indigo-600 to-violet-700',
    steps: [
      {
        id: 'step5',
        stepNumber: 5,
        label: 'Integrated Water Balance',
        shortLabel: 'Water Balance',
        phaseId: 'phase3',
        description: 'Water sources, facility end-uses, and outflows',
        icon: Droplets,
      },
      {
        id: 'step9',
        stepNumber: 9,
        label: 'Wastewater & Sewer Discharge',
        shortLabel: 'Wastewater',
        phaseId: 'phase3',
        description: 'Sanitary wastewater generation, sewer return, and treatment sizing',
        icon: Trash2,
      },
      {
        id: 'step10',
        stepNumber: 10,
        label: 'Rainwater Harvesting Potential',
        shortLabel: 'Rainwater',
        phaseId: 'phase3',
        description: 'Roof catchment, first-flush allowance, and monthly yield',
        icon: CloudRain,
      },
      {
        id: 'step11',
        stepNumber: 11,
        label: 'Greywater Recycling & Reuse',
        shortLabel: 'Greywater',
        phaseId: 'phase3',
        description: 'Greywater availability and non-potable reuse balance',
        icon: Recycle,
      },
    ],
  },
  {
    id: 'phase4',
    number: 4,
    title: 'Storage, Pumping & Pipework',
    shortTitle: 'Storage & Pipework',
    description: 'Storage tanks, pumps, pipe sizing, and fire reserve inputs',
    icon: Warehouse,
    accentColor: 'emerald',
    bgGradient: 'from-emerald-600 to-teal-700',
    steps: [
      {
        id: 'step7',
        stepNumber: 7,
        label: 'Water Storage Reservoir Design',
        shortLabel: 'Storage Tanks',
        phaseId: 'phase4',
        description: 'Existing and proposed storage tanks, volumes, and allocation',
        icon: Warehouse,
      },
      {
        id: 'step8',
        stepNumber: 8,
        label: 'Pumping Stations & System Curve',
        shortLabel: 'Pump Design',
        phaseId: 'phase4',
        description: 'Total dynamic head, pump duty, and motor power estimate',
        icon: Fuel,
      },
      {
        id: 'pipes',
        label: 'Pipework Sizing & Hydraulic Grade Line',
        shortLabel: 'Pipework & HGL',
        phaseId: 'phase4',
        description: 'Pipe sizing, friction losses, velocity, and hydraulic grade line',
        icon: Calculator,
      },
      {
        id: 'step12',
        stepNumber: 12,
        label: 'Dedicated Fire Water Reserve',
        shortLabel: 'Fire Water',
        phaseId: 'phase4',
        description: 'Fire-water flow, duration, and dedicated storage inputs',
        icon: Flame,
      },
    ],
  },
  {
    id: 'phase5',
    number: 5,
    title: 'Review & Report',
    shortTitle: 'Review & Report',
    description: 'Special services, sustainability review, quality checks, and reports',
    icon: ClipboardCheck,
    accentColor: 'purple',
    bgGradient: 'from-purple-600 to-indigo-800',
    steps: [
      {
        id: 'submetering',
        label: 'Sub-Metering & IoT Network',
        shortLabel: 'Sub-Metering',
        phaseId: 'phase5',
        description: 'Zone pulse meters, smart pulse loggers, and leakage detection architecture',
        icon: Activity,
      },
      {
        id: 'hotwater',
        label: 'Hot Water & Legionella Control',
        shortLabel: 'Hot Water',
        phaseId: 'phase5',
        description: 'Hot-water demand, storage, and temperature control inputs',
        icon: Flame,
      },
      {
        id: 'step13',
        stepNumber: 13,
        label: 'Sustainability & Green Building Rating',
        shortLabel: 'Sustainability',
        phaseId: 'phase5',
        description: 'Water efficiency indicators and sustainability assumptions',
        icon: Leaf,
      },
      {
        id: 'step14',
        stepNumber: 14,
        label: 'Design Review & Quality Assurance',
        shortLabel: 'Quality Review',
        phaseId: 'phase5',
        description: 'Automated engineering rule verification, assumption auditing, and checks',
        icon: ClipboardCheck,
      },
      {
        id: 'step15',
        stepNumber: 15,
        label: 'Dossier Generation & Document Export',
        shortLabel: 'Reports & Export',
        phaseId: 'phase5',
        description: 'Engineering calculation report, professional PDF, Excel workbook, and Word',
        icon: FileText,
      },
    ],
  },
];

export const ALL_STEPS: WorkflowStep[] = WORKFLOW_PHASES.flatMap((p) => p.steps);

export function getStepById(id: string): WorkflowStep | undefined {
  return ALL_STEPS.find((s) => s.id === id);
}

export function getPhaseForStep(stepId: string): WorkflowPhase | undefined {
  return WORKFLOW_PHASES.find((p) => p.steps.some((s) => s.id === stepId));
}

export function getAdjacentSteps(currentStepId: string): {
  prevStep?: WorkflowStep;
  nextStep?: WorkflowStep;
} {
  const currentIndex = ALL_STEPS.findIndex((s) => s.id === currentStepId);
  return {
    prevStep: currentIndex > 0 ? ALL_STEPS[currentIndex - 1] : undefined,
    nextStep: currentIndex < ALL_STEPS.length - 1 ? ALL_STEPS[currentIndex + 1] : undefined,
  };
}
