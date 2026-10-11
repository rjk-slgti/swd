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
    title: 'Project Foundation & Baseline',
    shortTitle: 'Foundation',
    description: 'Project metadata, regulatory standards, and baseline parameters',
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
    title: 'Water Demand & Site Balance',
    shortTitle: 'Demand & Balance',
    description: 'Occupancy populations, domestic water consumption, and peak fixture flows',
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
        id: 'step5',
        stepNumber: 5,
        label: 'Integrated Water Balance',
        shortLabel: 'Water Balance',
        phaseId: 'phase2',
        description: 'Three-pillar mass conservation: Sources → Facility End-Uses → Outflows',
        icon: Droplets,
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
    title: 'Storage & Hydraulic Systems',
    shortTitle: 'Storage & Hydraulics',
    description: 'Water storage reservoirs, pumping stations, and pipework hydraulics',
    icon: Warehouse,
    accentColor: 'indigo',
    bgGradient: 'from-indigo-600 to-violet-700',
    steps: [
      {
        id: 'step7',
        stepNumber: 7,
        label: 'Water Storage Reservoir Design',
        shortLabel: 'Storage Tanks',
        phaseId: 'phase3',
        description: 'Underground sump & roof tank split, emergency reserve, and cross-section',
        icon: Warehouse,
      },
      {
        id: 'step8',
        stepNumber: 8,
        label: 'Pumping Stations & System Curve',
        shortLabel: 'Pump Design',
        phaseId: 'phase3',
        description: 'Total Dynamic Head (TDH), operating duty point, and motor power rating (kW)',
        icon: Fuel,
      },
      {
        id: 'pipes',
        label: 'Pipework Sizing & Hydraulic Grade Line',
        shortLabel: 'Pipework & HGL',
        phaseId: 'phase3',
        description: 'Hazen-Williams friction losses, velocity safety limits, and HGL simulation',
        icon: Calculator,
      },
    ],
  },
  {
    id: 'phase4',
    number: 4,
    title: 'Sustainable & Special Services',
    shortTitle: 'Special Services',
    description: 'Thermal services, drainage, rainwater harvesting, greywater, and fire protection',
    icon: Leaf,
    accentColor: 'emerald',
    bgGradient: 'from-emerald-600 to-teal-700',
    steps: [
      {
        id: 'hotwater',
        label: 'Hot Water & Legionella Control',
        shortLabel: 'Hot Water',
        phaseId: 'phase4',
        description: 'Calorifier recovery power, 60°C anti-Legionella disinfection, and TMV blending',
        icon: Flame,
      },
      {
        id: 'step9',
        stepNumber: 9,
        label: 'Wastewater & Sewer Discharge',
        shortLabel: 'Wastewater',
        phaseId: 'phase4',
        description: 'Sanitary sewage generation, 80-90% sewer return factor, and STP sizing',
        icon: Trash2,
      },
      {
        id: 'step10',
        stepNumber: 10,
        label: 'Rainwater Harvesting Potential',
        shortLabel: 'Rainwater',
        phaseId: 'phase4',
        description: 'Roof catchment footprint, first-flush sanitary diversion, and monthly yield',
        icon: CloudRain,
      },
      {
        id: 'step11',
        stepNumber: 11,
        label: 'Greywater Recycling & Reuse',
        shortLabel: 'Greywater',
        phaseId: 'phase4',
        description: 'Light greywater filtration, non-potable toilet flush offset, and mass balance',
        icon: Recycle,
      },
      {
        id: 'step12',
        stepNumber: 12,
        label: 'Dedicated Fire Water Reserve',
        shortLabel: 'Fire Water',
        phaseId: 'phase4',
        description: 'NFPA/BS fire attack stream duration, dedicated storage, and pump separation',
        icon: Flame,
      },
    ],
  },
  {
    id: 'phase5',
    number: 5,
    title: 'Assurance & Engineering Deliverables',
    shortTitle: 'Assurance & Reports',
    description: 'Smart sub-metering, green building ratings, design QA, and dossier exports',
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
        id: 'step13',
        stepNumber: 13,
        label: 'Sustainability & Green Building Rating',
        shortLabel: 'Sustainability',
        phaseId: 'phase5',
        description: 'GreenSLS / LEED water credits, potable water reduction %, and eco-ratings',
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
