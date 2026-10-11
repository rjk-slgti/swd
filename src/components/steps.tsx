import { useState } from 'react';
import { useProject } from '@/context/ProjectContext';
import {
  SectionHeader,
  Card,
  NumberInput,
  TextInput,
  SelectInput,
  ToggleInput,
  EduCard,
  ResultCard,
  CalcDisplay,
  DataTable,
  StatusBadge,
  StatusIndicator,
  Tabs,
  BarChart,
  KPICard,
  WarningCard,
  EngineeringNoticeBanner,
  PrinciplesBanner,
  StudentCalculationCard,
  VisualTankCrossSection,
  VisualPumpSystemCurve,
  VisualWaterBalanceFlow,
  VisualThermalSpectrum,
} from '@/components/ui';
import {
  Users, Droplets, FlaskConical, Warehouse, Fuel,
  Trash2, CloudRain, Recycle, Flame, Leaf,
  Calculator, ClipboardCheck, FileText, Settings, LayoutDashboard,
  Activity, Gauge, RotateCcw, Sparkles,
} from 'lucide-react';
import type { OccupancyGroup, WorkshopProcess, Fixture, TankDimension, WPSFFactor, SubMeterZone } from '@/types';

// ============================================================
// STEP 1 — PROJECT DETAILS
// ============================================================

export function StepProjectDetails() {
  const { project, setProject } = useProject();
  const info = project.projectInfo;

  const update = (field: keyof typeof info, value: string) => {
    setProject((p) => ({ ...p, projectInfo: { ...p.projectInfo, [field]: value } }));
  };

  return (
    <div className="space-y-6">
      <SectionHeader step={1} title="Project Details" subtitle="Enter project information before calculations begin" icon={<Settings className="w-6 h-6 text-blue-600" />} />

      {/* Non-Technical Smart Auto-Pilot Callout */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-xl p-4 sm:p-5 shadow-xs border border-indigo-700/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-300 flex-shrink-0 mt-0.5">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30">
                Non-Technical Fast Track
              </span>
              <span className="text-xs text-indigo-200 font-medium">Zero-Irritation Mode</span>
            </div>
            <h4 className="text-sm sm:text-base font-bold text-white mt-1">
              Want the system to Auto-Calculate everything from basic building details?
            </h4>
            <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
              Don&apos;t want to fill out dozens of technical fields? Tell us your building type, occupant count, and number of floors. Our Building Services Engine will instantly configure all 19 calculation pages for you.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent('open-autopilot'))}
          className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 shadow-md hover:shadow-lg transition-all"
        >
          <Sparkles className="w-4 h-4 text-slate-950" />
          <span>Launch Smart Auto-Pilot</span>
        </button>
      </div>

      <EduCard title="Why does this matter?" icon="why">
        Project information establishes the design basis, identifies the responsible parties, and appears on every exported report.
        A clear design basis is fundamental to engineering accountability and quality control.
      </EduCard>

      <Card>
        <h3 className="text-sm font-semibold text-slate-700 mb-4">Project Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <TextInput label="Project Name" value={info.projectName} onChange={(v) => update('projectName', v)} />
          <TextInput label="Client" value={info.client} onChange={(v) => update('client', v)} />
          <TextInput label="Consultant" value={info.consultant} onChange={(v) => update('consultant', v)} />
          <TextInput label="Designer" value={info.designer} onChange={(v) => update('designer', v)} />
          <TextInput label="Checked By" value={info.checkedBy} onChange={(v) => update('checkedBy', v)} />
          <TextInput label="Approved By" value={info.approvedBy} onChange={(v) => update('approvedBy', v)} />
          <TextInput label="Project Location" value={info.location} onChange={(v) => update('location', v)} />
          <TextInput label="District" value={info.district} onChange={(v) => update('district', v)} />
          <TextInput label="Province" value={info.province} onChange={(v) => update('province', v)} />
          <TextInput label="Country" value={info.country} onChange={(v) => update('country', v)} />
          <SelectInput
            label="Project Type"
            value={info.projectType}
            onChange={(v) => update('projectType', v)}
            options={['Vocational Training Centre', 'School', 'University', 'Office', 'Hostel', 'Workshop', 'Commercial', 'Industrial', 'Hospital', 'Mixed Development', 'Custom']}
          />
          <TextInput label="Building Type" value={info.buildingType} onChange={(v) => update('buildingType', v)} />
          <SelectInput
            label="Design Stage"
            value={info.designStage}
            onChange={(v) => update('designStage', v)}
            options={['Concept Design', 'Preliminary Design', 'Detailed Design', 'Tender Design', 'As-Built']}
          />
          <TextInput label="Report Number" value={info.reportNumber} onChange={(v) => update('reportNumber', v)} />
          <TextInput label="Revision" value={info.revision} onChange={(v) => update('revision', v)} />
          <TextInput label="Date" value={info.date} onChange={(v) => update('date', v)} />
          <TextInput label="Prepared By" value={info.preparedBy} onChange={(v) => update('preparedBy', v)} />
        </div>
      </Card>
    </div>
  );
}

// ============================================================
// STEP 2 — OCCUPANCY
// ============================================================

export function StepOccupancy() {
  const { project, setProject, results } = useProject();

  const updateGroup = (id: string, field: keyof OccupancyGroup, value: number | string) => {
    setProject((p) => ({
      ...p,
      occupancy: p.occupancy.map((g) => (g.id === id ? { ...g, [field]: value } : g)),
    }));
  };

  const addGroup = () => {
    const newGroup: OccupancyGroup = {
      id: `OCC-${Date.now()}`,
      name: 'Custom Group',
      category: 'Other Users',
      count: 0,
      occupancyPeriod: 8,
      daysPerWeek: 5,
      consumptionFactor: 30,
      unit: 'L/person/day',
      source: 'User Defined',
      classification: 'User Defined',
    };
    setProject((p) => ({ ...p, occupancy: [...p.occupancy, newGroup] }));
  };

  const removeGroup = (id: string) => {
    setProject((p) => ({ ...p, occupancy: p.occupancy.filter((g) => g.id !== id) }));
  };

  const categories = ['Day Users', 'Residential Users', 'Other Users'] as const;

  return (
    <div className="space-y-6">
      <SectionHeader step={2} title="Occupancy" subtitle="Enter population groups and their water consumption factors" icon={<Users className="w-6 h-6 text-blue-600" />} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ResultCard label="Total Population" value={results.totalPopulation} unit="persons" color="blue" />
        <ResultCard label="Total Daily Demand" value={(results.occupancy.reduce((s, r) => s + r.dailyDemand, 0) / 1000).toFixed(2)} unit="m³/day" color="cyan" />
        <ResultCard label="Occupancy Groups" value={project.occupancy.length} unit="groups" color="slate" />
      </div>

      <EduCard title="How is this calculated?" icon="how">
        <p><strong>Formula:</strong> Daily Demand = Population × Unit Consumption</p>
        <p className="mt-1">Each group's daily demand is calculated by multiplying the number of people by their per-person daily water consumption rate. The rates are engineering allowances unless confirmed by a specific standard or client requirement.</p>
      </EduCard>

      <EduCard title="What should I enter?" icon="what">
        <p>Enter the number of people in each group (students, staff, hostel residents, visitors, etc.). Adjust the consumption factor if you have project-specific data. The default values are preliminary engineering allowances for tropical climate institutional buildings.</p>
      </EduCard>

      <StudentCalculationCard
        title="Student Derivation: Occupancy Water Demand Accumulation"
        standardRef="BS 6465-1 / CIBSE Guide G / SLS 1373"
        governingFormula="Q_group = N_i × q_i × (d_i / 7)   |   Q_total = Σ Q_group"
        formulaVariables={[
          { symbol: 'N_total', meaning: 'Total Facility Population', unit: 'persons', value: results.totalPopulation },
          { symbol: 'Q_total', meaning: 'Combined Occupancy Demand', unit: 'm³/day', value: (results.occupancy.reduce((s, r) => s + r.dailyDemand, 0) / 1000).toFixed(2) },
          { symbol: 'q_weighted', meaning: 'Effective Weighted Per-Capita Demand', unit: 'L/p/d', value: results.totalPopulation > 0 ? (results.occupancy.reduce((s, r) => s + r.dailyDemand, 0) / results.totalPopulation).toFixed(1) : 0 },
          { symbol: 'Groups', meaning: 'Configured Population Subgroups', unit: 'count', value: project.occupancy.length },
        ]}
        steps={[
          {
            stepNumber: 1,
            title: 'Subgroup Population & Per-Capita Disaggregation',
            description: 'Disaggregate site population into specific activity cohorts (Day Students, Staff, Hostel Residents). Water use varies by an order of magnitude between day users and residential users.',
            formula: 'N_total = N_day + N_residential + N_other',
            mathSubstitution: `Total = ${project.occupancy.map(g => `${g.name} (${g.count})`).join(' + ')}`,
            intermediateResult: `${results.totalPopulation}`,
            unit: 'persons',
          },
          {
            stepNumber: 2,
            title: 'Weekly Attendance Duty Cycle Normalization',
            description: 'Apply operational days per week (d/7) to account for institutions operating 5 days/week vs 7 days/week residential hostels.',
            formula: 'Q_daily = Σ [N_i × q_i × (d_i / 7)]',
            mathSubstitution: `${project.occupancy.slice(0, 3).map(g => `${g.count} × ${g.consumptionFactor} × (${g.daysPerWeek}/7)`).join(' + ')}${project.occupancy.length > 3 ? ' + ...' : ''}`,
            intermediateResult: `${(results.occupancy.reduce((s, r) => s + r.dailyDemand, 0)).toFixed(0)}`,
            unit: 'L/day',
          },
          {
            stepNumber: 3,
            title: 'SI Unit Volume Conversion to Cubic Metres',
            description: 'Convert daily litres to engineering volumetric design units (m³/day) for water storage and civil works sizing.',
            formula: 'V (m³/day) = Q (L/day) / 1000',
            mathSubstitution: `${(results.occupancy.reduce((s, r) => s + r.dailyDemand, 0)).toFixed(0)} L/day / 1000`,
            intermediateResult: `${(results.occupancy.reduce((s, r) => s + r.dailyDemand, 0) / 1000).toFixed(2)}`,
            unit: 'm³/day',
          },
        ]}
        engineeringRuleOfThumb="Day users (schools/offices) require 25–45 L/person/day for ablution, WC flushing, and drinking. Residential hostel occupants require 120–150 L/person/day because of personal showers, meal cooking, and laundry. Misclassifying residential occupants as day users leads to severe water tank starvation!"
      />

      {categories.map((cat) => {
        const groups = project.occupancy.filter((g) => g.category === cat);
        if (groups.length === 0) return null;
        return (
          <Card key={cat}>
            <h3 className="text-sm font-semibold text-slate-700 mb-3">{cat}</h3>
            <div className="space-y-3">
              {groups.map((g) => {
                const result = results.occupancy.find((r) => r.group.id === g.id);
                return (
                  <div key={g.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end p-3 bg-slate-50 rounded-lg">
                    <div className="md:col-span-3">
                      <TextInput label="Group Name" value={g.name} onChange={(v) => updateGroup(g.id, 'name', v)} />
                    </div>
                    <div className="md:col-span-2">
                      <NumberInput label="Count" value={g.count} onChange={(v) => updateGroup(g.id, 'count', v)} unit="persons" />
                    </div>
                    <div className="md:col-span-2">
                      <NumberInput label="Consumption" value={g.consumptionFactor} onChange={(v) => updateGroup(g.id, 'consumptionFactor', v)} unit="L/p/day" />
                    </div>
                    <div className="md:col-span-2">
                      <NumberInput label="Days/Week" value={g.daysPerWeek} onChange={(v) => updateGroup(g.id, 'daysPerWeek', v)} unit="days" />
                    </div>
                    <div className="md:col-span-2">
                      <div className="text-xs text-slate-500">Daily Demand</div>
                      <div className="text-lg font-bold text-blue-700">
                        {result ? (result.dailyDemand / 1000).toFixed(2) : '0.00'} m³
                      </div>
                      <StatusBadge status={g.classification} />
                    </div>
                    <div className="md:col-span-1">
                      {g.id.startsWith('OCC-') && !g.id.match(/^OCC-0[1-9]$/) && (
                        <button onClick={() => removeGroup(g.id)} className="text-red-500 text-xs hover:text-red-700">Remove</button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        );
      })}

      <button onClick={addGroup} className="px-4 py-2 text-sm font-medium text-blue-600 border border-blue-300 rounded-md hover:bg-blue-50 transition-colors">
        + Add Custom Group
      </button>
    </div>
  );
}

// ============================================================
// STEP 3 — DOMESTIC WATER
// ============================================================

export function StepDomesticWater() {
  const { project, setProject, results } = useProject();
  const dw = project.domesticWater;

  return (
    <div className="space-y-6">
      <SectionHeader step={3} title="Domestic Water Consumption" subtitle="Calculate domestic potable water demand" icon={<Droplets className="w-6 h-6 text-blue-600" />} />

      <Card>
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setProject((p) => ({ ...p, domesticWater: { ...p.domesticWater, method: 'A' } }))}
            className={`px-4 py-2 text-sm font-medium rounded-md ${dw.method === 'A' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}
          >
            Method A — Per Person
          </button>
          <button
            onClick={() => setProject((p) => ({ ...p, domesticWater: { ...p.domesticWater, method: 'B' } }))}
            className={`px-4 py-2 text-sm font-medium rounded-md ${dw.method === 'B' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}
          >
            Method B — End-Use Breakdown
          </button>
        </div>

        {dw.method === 'A' ? (
          <div className="space-y-4">
            <label className="flex gap-2 text-sm"><input type="checkbox" checked={dw.useOccupancyRates} onChange={e => setProject(p => ({ ...p, domesticWater: { ...p.domesticWater, useOccupancyRates: e.target.checked } }))} />Use each occupancy group’s allowance (recommended for mixed residential/day users)</label>
            <p className="text-sm text-slate-600">The selected domestic method is counted once. Group demand and end-use demand are alternative estimates. Special uses must be additional to these allowances.</p>
            <NumberInput
              label="Uniform rate (used only when group rates are off)"
              value={dw.perPersonRate}
              onChange={(v) => setProject((p) => ({ ...p, domesticWater: { ...p.domesticWater, perPersonRate: v } }))}
              unit="L/person/day"
              source={dw.perPersonSource}
              status={dw.perPersonClassification}
              tooltip="Average daily water consumption per person for all domestic uses (drinking, washing, WC flushing, etc.)"
            />
            <EduCard title="Typical Range" icon="what">
              <p>Day students: 25–45 L/person/day | Residential students: 90–150 L/person/day | Staff: 30–50 L/person/day</p>
            </EduCard>
          </div>
        ) : (
          <div className="space-y-3">
            {dw.endUses.map((eu) => (
              <div key={eu.id} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end p-3 bg-slate-50 rounded-lg">
                <div className="md:col-span-2"><TextInput label="End Use" value={eu.name} onChange={v => setProject(p => ({ ...p, domesticWater: { ...p.domesticWater, endUses: p.domesticWater.endUses.map(e => e.id === eu.id ? { ...e, name: v } : e) } }))} /></div>
                <NumberInput label="Rate" value={eu.perPersonPerDay} onChange={(v) => setProject((p) => ({ ...p, domesticWater: { ...p.domesticWater, endUses: p.domesticWater.endUses.map((e) => e.id === eu.id ? { ...e, perPersonPerDay: v } : e) } }))} unit="L/p/day" />
                <div><StatusBadge status={eu.classification} /></div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card><h3 className="font-semibold mb-4">Daily demand design basis</h3><div className="grid md:grid-cols-3 gap-4">
        <NumberInput label="Loss allowance" unit="%" max={100} value={project.demandBasis.lossAllowancePct} onChange={v => setProject(p => ({ ...p, demandBasis: { ...p.demandBasis, lossAllowancePct: v } }))} status="Engineering Assumption" />
        <NumberInput label="Maximum day factor" unit="× ADD" min={1} step={0.05} value={project.demandBasis.maxDayFactor} onChange={v => setProject(p => ({ ...p, demandBasis: { ...p.demandBasis, maxDayFactor: v } }))} status="Engineering Assumption" />
        <NumberInput label="Future expansion" unit="%" value={project.futureExpansion.enabled ? project.futureExpansion.percentageGrowth : 0} onChange={v => setProject(p => ({ ...p, futureExpansion: { ...p.futureExpansion, percentageGrowth: v, enabled: v > 0 } }))} status="Engineering Assumption" />
      </div><TextInput label="Design basis source" value={project.demandBasis.source} onChange={v => setProject(p => ({ ...p, demandBasis: { ...p.demandBasis, source: v } }))} /></Card>
      {results.domestic && (
        <>
          <CalcDisplay
            title="Domestic Water Demand"
            result={(results.domestic.totalDemand / 1000).toFixed(2)}
            unit="m³/day"
            formula={results.domestic.formula}
            substitution={results.domestic.substitution}
          />

          <StudentCalculationCard
            title="Student Derivation: Average Daily Demand (ADD) to Maximum Day Demand (MDD)"
            standardRef="CIBSE Guide G / AWWA M32 Water Distribution Sizing"
            governingFormula="MDD = ADD × [1 + Loss%] × K_day × [1 + Exp%]"
            formulaVariables={[
              { symbol: 'ADD', meaning: 'Average Daily Base Demand', unit: 'm³/day', value: (results.domestic.totalDemand / 1000).toFixed(2) },
              { symbol: 'Loss%', meaning: 'Internal Plumbing Loss Allowance', unit: '%', value: project.demandBasis.lossAllowancePct },
              { symbol: 'K_day', meaning: 'Maximum Day Peaking Factor', unit: 'ratio', value: project.demandBasis.maxDayFactor },
              { symbol: 'Exp%', meaning: 'Future Expansion Allowance', unit: '%', value: project.futureExpansion.enabled ? project.futureExpansion.percentageGrowth : 0 },
              { symbol: 'MDD', meaning: 'Maximum Day Design Flow', unit: 'm³/day', value: ((results.domestic.totalDemand / 1000) * (1 + project.demandBasis.lossAllowancePct / 100) * project.demandBasis.maxDayFactor * (1 + (project.futureExpansion.enabled ? project.futureExpansion.percentageGrowth : 0) / 100)).toFixed(2) },
            ]}
            steps={[
              {
                stepNumber: 1,
                title: 'Domestic Base Consumption Accumulation',
                description: 'Aggregate base domestic consumption from selected engineering method (Method A per-capita or Method B fixture end-use schedule).',
                formula: 'ADD = Σ (N_i × q_i) / 1000',
                mathSubstitution: `ADD = ${(results.domestic.totalDemand).toFixed(0)} L/day / 1000`,
                intermediateResult: (results.domestic.totalDemand / 1000).toFixed(2),
                unit: 'm³/day',
              },
              {
                stepNumber: 2,
                title: 'Plumbing Distribution Leakage & Unaccounted-For Water Allowance',
                description: 'Factor in internal pipe network losses, minor valve weeping, and cleaning waste (typically 5% to 10%).',
                formula: 'Q_net = ADD × (1 + Loss% / 100)',
                mathSubstitution: `${(results.domestic.totalDemand / 1000).toFixed(2)} × (1 + ${project.demandBasis.lossAllowancePct} / 100)`,
                intermediateResult: ((results.domestic.totalDemand / 1000) * (1 + project.demandBasis.lossAllowancePct / 100)).toFixed(2),
                unit: 'm³/day',
              },
              {
                stepNumber: 3,
                title: 'Peak Day Demand (MDD) Transformation',
                description: 'Apply maximum day factor K_day to ensure water infrastructure does not suffer shortage during peak summer days or high-occupancy events.',
                formula: 'MDD = Q_net × K_day × (1 + Exp% / 100)',
                mathSubstitution: `${((results.domestic.totalDemand / 1000) * (1 + project.demandBasis.lossAllowancePct / 100)).toFixed(2)} × ${project.demandBasis.maxDayFactor} × (1 + ${(project.futureExpansion.enabled ? project.futureExpansion.percentageGrowth : 0)} / 100)`,
                intermediateResult: ((results.domestic.totalDemand / 1000) * (1 + project.demandBasis.lossAllowancePct / 100) * project.demandBasis.maxDayFactor * (1 + (project.futureExpansion.enabled ? project.futureExpansion.percentageGrowth : 0) / 100)).toFixed(2),
                unit: 'm³/day',
              },
            ]}
            engineeringRuleOfThumb="Average Daily Demand (ADD) is used for annual municipal water billing and rainwater feasibility. Maximum Day Demand (MDD) must be used for sizing water storage tanks, water meter connections, and bulk transfer pumps to guarantee supply during summer peak demand periods."
          />

          {dw.method === 'B' && (
            <Card>
              <h4 className="text-sm font-semibold mb-3">End-Use Breakdown</h4>
              <BarChart data={results.domestic.breakdown.map((b) => ({ label: b.name, value: b.value }))} unit="L/day" />
            </Card>
          )}
        </>
      )}

      <EduCard title="Engineering Note" icon="tip">
        DAILY WATER CONSUMPTION IS NOT THE SAME AS PEAK DESIGN FLOW. Daily demand supports storage and source capacity sizing. Peak simultaneous demand (Step 6) supports pipe and pump sizing. Never combine these two calculations.
      </EduCard>
    </div>
  );
}

// ============================================================
// STEP 4 — SPECIAL WATER USES
// ============================================================

export function StepSpecialWater() {
  const { project, setProject, results } = useProject();
  const [tab, setTab] = useState('canteen');

  return (
    <div className="space-y-6">
      <SectionHeader step={4} title="Special Water Uses" subtitle="Canteen, workshop, cleaning, irrigation, and vehicle washing demand" icon={<FlaskConical className="w-6 h-6 text-blue-600" />} />

      {results.specialDemand && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <ResultCard label="Canteen" value={(results.specialDemand.canteenDemand / 1000).toFixed(2)} unit="m³/d" color="amber" />
          <ResultCard label="Workshop" value={(results.specialDemand.workshopDemand / 1000).toFixed(2)} unit="m³/d" color="slate" />
          <ResultCard label="Cleaning" value={(results.specialDemand.cleaningDemand / 1000).toFixed(2)} unit="m³/d" color="cyan" />
          <ResultCard label="Irrigation" value={(results.specialDemand.irrigationDemand / 1000).toFixed(2)} unit="m³/d" color="green" />
          <ResultCard label="Vehicles" value={(results.specialDemand.vehicleWashingDemand / 1000).toFixed(2)} unit="m³/d" color="blue" />
        </div>
      )}

      <Tabs
        tabs={[
          { id: 'canteen', label: 'Canteen / Kitchen' },
          { id: 'workshop', label: 'Workshop / Process' },
          { id: 'cleaning', label: 'Cleaning' },
          { id: 'irrigation', label: 'Irrigation' },
          { id: 'vehicle', label: 'Vehicle Washing' },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'canteen' && (
        <Card>
          <ToggleInput label="Enable Canteen / Kitchen" checked={project.canteen.enabled} onChange={(v) => setProject((p) => ({ ...p, canteen: { ...p.canteen, enabled: v } }))} />
          {project.canteen.enabled && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <NumberInput label="Meals per Day" value={project.canteen.mealsPerDay} onChange={(v) => setProject((p) => ({ ...p, canteen: { ...p.canteen, mealsPerDay: v } }))} unit="meals" />
              <NumberInput label="Water per Meal" value={project.canteen.waterPerMeal} onChange={(v) => setProject((p) => ({ ...p, canteen: { ...p.canteen, waterPerMeal: v } }))} unit="L/meal" source={project.canteen.source} status={project.canteen.classification} />
              <NumberInput label="Kitchen Staff" value={project.canteen.kitchenStaff} onChange={(v) => setProject((p) => ({ ...p, canteen: { ...p.canteen, kitchenStaff: v } }))} unit="persons" />
              <NumberInput label="Drinking Water" value={project.canteen.drinkingWaterL} onChange={(v) => setProject((p) => ({ ...p, canteen: { ...p.canteen, drinkingWaterL: v } }))} unit="L/day" />
              <NumberInput label="Food Preparation" value={project.canteen.foodPrepL} onChange={(v) => setProject((p) => ({ ...p, canteen: { ...p.canteen, foodPrepL: v } }))} unit="L/day" />
              <NumberInput label="Cleaning" value={project.canteen.cleaningL} onChange={(v) => setProject((p) => ({ ...p, canteen: { ...p.canteen, cleaningL: v } }))} unit="L/day" />
            </div>
          )}
        </Card>
      )}

      {tab === 'workshop' && (
        <Card>
          <div className="space-y-3">
            {project.workshops.map((w) => (
              <div key={w.id} className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end p-3 bg-slate-50 rounded-lg">
                <TextInput label="Category" value={w.category} onChange={(v) => setProject((p) => ({ ...p, workshops: p.workshops.map((x) => x.id === w.id ? { ...x, category: v } : x) }))} />
                <TextInput label="Equipment" value={w.equipment} onChange={(v) => setProject((p) => ({ ...p, workshops: p.workshops.map((x) => x.id === w.id ? { ...x, equipment: v } : x) }))} />
                <NumberInput label="Water/Event" value={w.waterPerEvent} onChange={(v) => setProject((p) => ({ ...p, workshops: p.workshops.map((x) => x.id === w.id ? { ...x, waterPerEvent: v } : x) }))} unit="L" />
                <NumberInput label="Events/Day" value={w.eventsPerDay} onChange={(v) => setProject((p) => ({ ...p, workshops: p.workshops.map((x) => x.id === w.id ? { ...x, eventsPerDay: v } : x) }))} unit="events" />
                <div><div className="text-xs text-slate-500">Daily Demand</div><div className="text-lg font-bold text-slate-700">{(w.waterPerEvent * w.eventsPerDay / 1000).toFixed(2)} m³</div></div>
                <button onClick={() => setProject((p) => ({ ...p, workshops: p.workshops.filter((x) => x.id !== w.id) }))} className="text-red-500 text-xs hover:text-red-700">Remove</button>
              </div>
            ))}
            <button onClick={() => setProject((p) => ({ ...p, workshops: [...p.workshops, { id: `WS-${Date.now()}`, category: 'Custom', equipment: '', process: '', waterPerEvent: 100, eventsPerDay: 1, operatingDays: 5, flowRequirement: 0.2, duration: 1, source: 'User Defined', classification: 'User Defined' } as WorkshopProcess] }))} className="px-4 py-2 text-sm font-medium text-blue-600 border border-blue-300 rounded-md hover:bg-blue-50">+ Add Workshop</button>
          </div>
        </Card>
      )}

      {tab === 'cleaning' && (
        <Card>
          <ToggleInput label="Enable Cleaning Water" checked={project.cleaning.enabled} onChange={(v) => setProject((p) => ({ ...p, cleaning: { ...p.cleaning, enabled: v } }))} />
          {project.cleaning.enabled && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <NumberInput label="Academic Floor Area" value={project.cleaning.academicFloorArea} onChange={(v) => setProject((p) => ({ ...p, cleaning: { ...p.cleaning, academicFloorArea: v } }))} unit="m²" />
              <NumberInput label="Workshop Floor Area" value={project.cleaning.workshopFloorArea} onChange={(v) => setProject((p) => ({ ...p, cleaning: { ...p.cleaning, workshopFloorArea: v } }))} unit="m²" />
              <NumberInput label="Toilet Floor Area" value={project.cleaning.toiletFloorArea} onChange={(v) => setProject((p) => ({ ...p, cleaning: { ...p.cleaning, toiletFloorArea: v } }))} unit="m²" />
              <NumberInput label="Hostel Floor Area" value={project.cleaning.hostelFloorArea} onChange={(v) => setProject((p) => ({ ...p, cleaning: { ...p.cleaning, hostelFloorArea: v } }))} unit="m²" />
              <NumberInput label="External Paved Area" value={project.cleaning.externalPavedArea} onChange={(v) => setProject((p) => ({ ...p, cleaning: { ...p.cleaning, externalPavedArea: v } }))} unit="m²" />
              <NumberInput label="Cleaning Rate" value={project.cleaning.cleaningRate} onChange={(v) => setProject((p) => ({ ...p, cleaning: { ...p.cleaning, cleaningRate: v } }))} unit="L/m²" />
              <NumberInput label="Frequency" value={project.cleaning.cleaningFrequency} onChange={(v) => setProject((p) => ({ ...p, cleaning: { ...p.cleaning, cleaningFrequency: v } }))} unit="times/wk" />
            </div>
          )}
        </Card>
      )}

      {tab === 'irrigation' && (
        <Card>
          <ToggleInput label="Enable Irrigation" checked={project.irrigation.enabled} onChange={(v) => setProject((p) => ({ ...p, irrigation: { ...p.irrigation, enabled: v } }))} />
          {project.irrigation.enabled && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <NumberInput label="Landscape Area" value={project.irrigation.landscapeArea} onChange={(v) => setProject((p) => ({ ...p, irrigation: { ...p.irrigation, landscapeArea: v } }))} unit="m²" />
              <TextInput label="Plant Category" value={project.irrigation.plantCategory} onChange={(v) => setProject((p) => ({ ...p, irrigation: { ...p.irrigation, plantCategory: v } }))} />
              <TextInput label="Irrigation System" value={project.irrigation.irrigationSystem} onChange={(v) => setProject((p) => ({ ...p, irrigation: { ...p.irrigation, irrigationSystem: v } }))} />
              <NumberInput label="Irrigation Rate" value={project.irrigation.irrigationRate} onChange={(v) => setProject((p) => ({ ...p, irrigation: { ...p.irrigation, irrigationRate: v } }))} unit="L/m²/d" />
              <NumberInput label="Days/Week" value={project.irrigation.irrigationDays} onChange={(v) => setProject((p) => ({ ...p, irrigation: { ...p.irrigation, irrigationDays: v } }))} unit="days" />
              <NumberInput label="Seasonal Adjustment" value={project.irrigation.seasonalAdjustment} onChange={(v) => setProject((p) => ({ ...p, irrigation: { ...p.irrigation, seasonalAdjustment: v } }))} unit="%" />
            </div>
          )}
        </Card>
      )}

      {tab === 'vehicle' && (
        <Card>
          <ToggleInput label="Enable Vehicle Washing" checked={project.vehicleWashing.enabled} onChange={(v) => setProject((p) => ({ ...p, vehicleWashing: { ...p.vehicleWashing, enabled: v } }))} />
          {project.vehicleWashing.enabled && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <NumberInput label="Motorcycles/day" value={project.vehicleWashing.motorcycles} onChange={(v) => setProject((p) => ({ ...p, vehicleWashing: { ...p.vehicleWashing, motorcycles: v } }))} unit="vehicles" />
              <NumberInput label="Cars/day" value={project.vehicleWashing.cars} onChange={(v) => setProject((p) => ({ ...p, vehicleWashing: { ...p.vehicleWashing, cars: v } }))} unit="vehicles" />
              <NumberInput label="Vans/day" value={project.vehicleWashing.vans} onChange={(v) => setProject((p) => ({ ...p, vehicleWashing: { ...p.vehicleWashing, vans: v } }))} unit="vehicles" />
              <NumberInput label="Buses/day" value={project.vehicleWashing.buses} onChange={(v) => setProject((p) => ({ ...p, vehicleWashing: { ...p.vehicleWashing, buses: v } }))} unit="vehicles" />
              <NumberInput label="Heavy Vehicles/day" value={project.vehicleWashing.heavyVehicles} onChange={(v) => setProject((p) => ({ ...p, vehicleWashing: { ...p.vehicleWashing, heavyVehicles: v } }))} unit="vehicles" />
              <NumberInput label="Recycling %" value={project.vehicleWashing.recyclingPct} onChange={(v) => setProject((p) => ({ ...p, vehicleWashing: { ...p.vehicleWashing, recyclingPct: v } }))} unit="%" />
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

// ============================================================
// STEP 5 — WATER BALANCE
// ============================================================

export function StepWaterBalance() {
  const { results } = useProject();

  return (
    <div className="space-y-6">
      <SectionHeader step={5} title="Water Balance" subtitle="Source, storage, consumption, and outflow visualization" icon={<Droplets className="w-6 h-6 text-blue-600" />} />

      <EduCard title="Why does this matter?" icon="why">
        The water balance shows where water comes from, where it goes, and how much is consumed or lost. It helps identify opportunities for rainwater harvesting, greywater reuse, and demand reduction.
      </EduCard>

      {results.waterBalance ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ResultCard label="Total Supply" value={(results.waterBalance.totalSupply / 1000).toFixed(2)} unit="m³/day" color="blue" />
            <ResultCard label="Total Demand" value={(results.waterBalance.totalDemand / 1000).toFixed(2)} unit="m³/day" color="amber" />
            <ResultCard label="Wastewater" value={(results.waterBalance.totalWastewater / 1000).toFixed(2)} unit="m³/day" color="red" />
          </div>

          <VisualWaterBalanceFlow
            sources={results.waterBalance.sources}
            consumption={results.waterBalance.consumption}
            outflows={results.waterBalance.outflows}
            totalDemand={results.waterBalance.totalDemand}
          />

          <StudentCalculationCard
            title="Student Principle: Law of Conservation of Mass (Site Water Balance)"
            standardRef="ISO 14046 Water Balance / CIBSE Guide G / LEED WE"
            governingFormula="Σ Q_in (Sources) = Σ Q_consumed + Σ Q_evaporated + Σ Q_wastewater (Outflows)"
            formulaVariables={[
              { symbol: 'Q_in', meaning: 'Total Water Inflow Sources', unit: 'm³/day', value: (results.waterBalance.totalSupply / 1000).toFixed(2) },
              { symbol: 'Q_demand', meaning: 'Combined Facility Demand', unit: 'm³/day', value: (results.waterBalance.totalDemand / 1000).toFixed(2) },
              { symbol: 'Q_out', meaning: 'Sanitary Wastewater Outflow', unit: 'm³/day', value: (results.waterBalance.totalWastewater / 1000).toFixed(2) },
              { symbol: 'Losses', meaning: 'Consumptive & Evaporative Losses', unit: 'm³/day', value: Math.max(0, (results.waterBalance.totalDemand - results.waterBalance.totalWastewater) / 1000).toFixed(2) },
            ]}
            steps={[
              {
                stepNumber: 1,
                title: 'Water Source Inflow Inventory',
                description: 'Sum all incoming water streams supplying the facility boundary (Potable utility mains, on-site rainwater harvesting, and recycled greywater).',
                formula: 'Q_supply = Q_mains + Q_rainwater + Q_greywater',
                mathSubstitution: `${results.waterBalance.sources.map(s => `${s.name}: ${s.value} L/d`).join(' | ')}`,
                intermediateResult: (results.waterBalance.totalSupply / 1000).toFixed(2),
                unit: 'm³/day',
              },
              {
                stepNumber: 2,
                title: 'Internal Building & External Site Consumption Breakdown',
                description: 'Aggregate domestic occupant demands, special workshop processes, vehicle wash bays, and landscape irrigation zones.',
                formula: 'Q_demand = Q_domestic + Q_special + Q_irrigation',
                mathSubstitution: `${results.waterBalance.consumption.map(c => `${c.name}: ${c.value} L/d`).join(' | ')}`,
                intermediateResult: (results.waterBalance.totalDemand / 1000).toFixed(2),
                unit: 'm³/day',
              },
              {
                stepNumber: 3,
                title: 'Discharge Conservation & Evaporative Loss Separation',
                description: 'Identify water that returns to sewer networks versus water consumed by human ingestion, plant evapotranspiration, and surface evaporation.',
                formula: 'Q_outflow = Q_wastewater = Σ (Q_indoor × SewerReturn%)',
                mathSubstitution: `${results.waterBalance.outflows.map(o => `${o.name}: ${o.value} L/d`).join(' | ')}`,
                intermediateResult: (results.waterBalance.totalWastewater / 1000).toFixed(2),
                unit: 'm³/day',
                notes: 'Irrigation water transpires into the atmosphere and never enters the sewer; domestic ablution returns at 80% to 90%',
              },
            ]}
            engineeringRuleOfThumb="Mass conservation is fundamental: inputs must balance consumption plus outflows. Rainwater harvesting and greywater reuse directly substitute for potable municipal water, cutting utility bills and reducing environmental water extraction."
          />

          <Card>
            <h3 className="text-sm font-semibold mb-3">Water Sources</h3>
            <BarChart data={results.waterBalance.sources.map((s) => ({ label: s.name, value: s.value }))} unit="L/day" />
          </Card>

          <Card>
            <h3 className="text-sm font-semibold mb-3">Consumption by Category</h3>
            <BarChart data={results.waterBalance.consumption.map((c) => ({ label: c.name, value: c.value }))} unit="L/day" />
          </Card>

          <Card>
            <h3 className="text-sm font-semibold mb-3">Outflows</h3>
            <BarChart data={results.waterBalance.outflows.map((o) => ({ label: o.name, value: o.value }))} unit="L/day" />
          </Card>

          <Card>
            <h3 className="text-sm font-semibold mb-3">Units Summary</h3>
            <DataTable
              headers={['Metric', 'L/day', 'm³/day', 'm³/month', 'm³/year']}
              rows={[
                ['Total Demand', results.waterBalance.totalDemand, (results.waterBalance.totalDemand / 1000).toFixed(2), (results.waterBalance.totalDemand / 1000 * 30).toFixed(2), (results.waterBalance.totalDemand / 1000 * 365).toFixed(2)],
                ['Wastewater', results.waterBalance.totalWastewater, (results.waterBalance.totalWastewater / 1000).toFixed(2), (results.waterBalance.totalWastewater / 1000 * 30).toFixed(2), (results.waterBalance.totalWastewater / 1000 * 365).toFixed(2)],
              ]}
            />
          </Card>
        </>
      ) : (
        <Card><p className="text-slate-500 text-sm">Complete previous steps to view the water balance.</p></Card>
      )}
    </div>
  );
}

// ============================================================
// STEP 6 — PEAK FIXTURE DEMAND
// ============================================================

export function StepPeakDemand() {
  const { project, setProject, results } = useProject();

  const updateFixtureField = (id: string, field: keyof Fixture, value: string | number) => {
    setProject((p) => ({
      ...p,
      fixtures: p.fixtures.map((f) => (f.id === id ? { ...f, [field]: value } : f)),
      peakDesign: { ...p.peakDesign, verified: false },
    }));
  };

  const removeFixture = (id: string) => {
    setProject((p) => ({
      ...p,
      fixtures: p.fixtures.filter((f) => f.id !== id),
      peakDesign: { ...p.peakDesign, verified: false },
    }));
  };

  const addFixture = () => {
    const newFx: Fixture = {
      id: `FX-${Date.now()}`,
      type: 'Custom Fixture',
      quantity: 1,
      loadingUnit: 2,
      fixtureUnit: 2,
      designFlow: 0.15,
      source: 'User Defined',
    };
    setProject((p) => ({ ...p, fixtures: [...p.fixtures, newFx] }));
  };

  return (
    <div className="space-y-6">
      <SectionHeader step={6} title="Peak Fixture Demand" subtitle="Calculate probable simultaneous flow from fixture loading units" icon={<Calculator className="w-6 h-6 text-blue-600" />} />

      <EduCard title="Why does this matter?" icon="why">
        <p><strong>DAILY DEMAND IS NOT PEAK FLOW.</strong> Daily demand sizes storage. Peak simultaneous flow sizes pipes and pumps.</p>
        <p className="mt-1">Peak flow is estimated from fixture loading units using a probability-based conversion. Not all fixtures operate simultaneously — the conversion accounts for diversity.</p>
      </EduCard>

      <EduCard title="How is this calculated?" icon="how">
        <p>Use a verified calculation from the selected standard, including its applicability, curve/table and revision.</p>
        <p className="mt-1">No universal loading-unit conversion is applied. The fixture schedule is a review input. Additional design information required until a documented peak flow is entered and confirmed.</p>
      </EduCard>

      <Card>
        <div className="grid md:grid-cols-2 gap-4">
          <NumberInput label="Externally calculated peak flow" unit="L/s" step={0.01} value={project.peakDesign.flow} onChange={v => setProject(p => ({ ...p, peakDesign: { ...p.peakDesign, flow: v, verified: false } }))} />
          <TextInput label="Standard / table / calculation reference" value={project.peakDesign.source} onChange={v => setProject(p => ({ ...p, peakDesign: { ...p.peakDesign, source: v, verified: false } }))} />
        </div>
        <label className="flex gap-2 text-sm mt-4"><input type="checkbox" checked={project.peakDesign.verified} onChange={e => setProject(p => ({ ...p, peakDesign: { ...p.peakDesign, verified: e.target.checked } }))} />I have checked this flow against the selected design method and fixture schedule.</label>
        {!results.peakFlow && <p role="status" className="mt-3 text-amber-700">Additional design information required. No probable peak flow has been confirmed.</p>}
      </Card>
      {results.peakFlow && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <ResultCard label="Total Loading Units" value={results.peakFlow.totalFixtureUnits} unit="LU" color="slate" />
            <ResultCard label="Peak Flow" value={results.peakFlow.probablePeakFlow} unit="L/s" color="blue" formula={results.peakFlow.formula} substitution={results.peakFlow.substitution} />
            <ResultCard label="Peak Flow" value={results.peakFlow.peakFlowLpm} unit="L/min" color="cyan" />
            <ResultCard label="Peak Flow" value={results.peakFlow.peakFlowM3h} unit="m³/h" color="green" />
          </div>

          <StudentCalculationCard
            title="Student Statistical Principle: Hunter's Curve Loading Unit Diversity"
            standardRef="BS EN 806-3 / CIBSE Guide G / SLS 1373"
            governingFormula="Q_peak = f(Σ LU) << Σ (n_i × q_nominal)   |   Q (m³/h) = Q (L/s) × 3.6"
            formulaVariables={[
              { symbol: 'Σ LU', meaning: 'Total Fixture Loading Units', unit: 'LU', value: results.peakFlow.totalFixtureUnits },
              { symbol: 'Q_peak', meaning: 'Probable Simultaneous Peak Flow', unit: 'L/s', value: results.peakFlow.probablePeakFlow },
              { symbol: 'Q_lpm', meaning: 'Peak Flow in Litres per Minute', unit: 'L/min', value: results.peakFlow.peakFlowLpm },
              { symbol: 'Q_m3h', meaning: 'Peak Flow in Cubic Metres per Hour', unit: 'm³/h', value: results.peakFlow.peakFlowM3h },
            ]}
            steps={[
              {
                stepNumber: 1,
                title: 'Fixture Unit Loading Schedule Accumulation',
                description: 'Aggregate loading units across all plumbing appliances according to their frequency of operation and hydraulic draw.',
                formula: 'Σ LU = Σ (Quantity_i × LoadingUnit_i)',
                mathSubstitution: `Total = ${project.fixtures.slice(0, 3).map(f => `${f.quantity} × ${f.loadingUnit} (${f.type})`).join(' + ')}${project.fixtures.length > 3 ? ' + ...' : ''}`,
                intermediateResult: `${results.peakFlow.totalFixtureUnits}`,
                unit: 'LU',
              },
              {
                stepNumber: 2,
                title: 'Binomial Probability & Simultaneity Diversity Curve',
                description: 'Apply diversity reduction factor based on Dr. Roy B. Hunter’s binomial distribution principle: appliances are open for only a fraction of any given hour.',
                formula: 'Q_peak = Hunter_Curve(Σ LU)',
                mathSubstitution: `Derived curve output for ${results.peakFlow.totalFixtureUnits} LU from ${project.peakDesign.source}`,
                intermediateResult: `${results.peakFlow.probablePeakFlow}`,
                unit: 'L/s',
                notes: 'Drastically smaller than arithmetic sum of maximum fixture capacities',
              },
              {
                stepNumber: 3,
                title: 'Hydraulic Pumping Unit Interconversions',
                description: 'Convert instantaneous L/s into standard plumbing pump schedule ratings (m³/h and L/min).',
                formula: 'Q (L/min) = Q (L/s) × 60   |   Q (m³/h) = Q (L/s) × 3.6',
                mathSubstitution: `${results.peakFlow.probablePeakFlow} × 60 = ${results.peakFlow.peakFlowLpm} L/min  |  ${results.peakFlow.probablePeakFlow} × 3.6 = ${results.peakFlow.peakFlowM3h} m³/h`,
                intermediateResult: `${results.peakFlow.peakFlowM3h}`,
                unit: 'm³/h',
              },
            ]}
            engineeringRuleOfThumb="Never size pumps or pipes by summing the full flow rate of every fixture! That arithmetic fallacy oversizes systems by 500% to 800%, causing water stagnation, acoustic hammering, and rapid pump burnouts due to severe cycling."
          />
        </>
      )}

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-700">Fixture Schedule & Loading Units</h3>
          <button onClick={addFixture} className="px-3 py-1.5 text-xs font-medium text-blue-600 border border-blue-300 rounded-md hover:bg-blue-50 transition-colors">+ Add Custom Fixture</button>
        </div>
        <DataTable
          headers={['Fixture', 'Quantity', 'Loading Unit', 'Total LU', 'Design Flow (L/s)', 'Source']}
          rows={project.fixtures.map((f) => [
            f.type,
            f.quantity,
            f.loadingUnit,
            f.quantity * f.loadingUnit,
            f.designFlow,
            f.source,
          ])}
        />
        <div className="mt-4 space-y-3">
          <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Configure Fixtures & Diversity</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {project.fixtures.map((f) => (
              <div key={f.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <input
                    type="text"
                    value={f.type}
                    onChange={(e) => updateFixtureField(f.id, 'type', e.target.value)}
                    className="font-medium text-xs text-slate-800 bg-transparent border-b border-dashed border-slate-300 focus:outline-none focus:border-blue-500 w-full"
                  />
                  <button
                    onClick={() => removeFixture(f.id)}
                    className="text-slate-400 hover:text-red-500 transition-colors p-1"
                    title="Remove fixture"
                    aria-label={`Remove ${f.type}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <NumberInput label="Quantity" value={f.quantity} onChange={(v) => updateFixtureField(f.id, 'quantity', v)} unit="qty" />
                  <NumberInput label="Loading Unit" value={f.loadingUnit} onChange={(v) => updateFixtureField(f.id, 'loadingUnit', v)} unit="LU" />
                  <NumberInput label="Design Flow" value={f.designFlow} onChange={(v) => updateFixtureField(f.id, 'designFlow', v)} unit="L/s" step={0.01} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {results.peakFlow && results.peakFlow.fixtureBreakdown.length > 0 && (
        <Card>
          <h3 className="text-sm font-semibold mb-3">Fixture Unit Breakdown</h3>
          <BarChart data={results.peakFlow.fixtureBreakdown.map((f) => ({ label: f.type, value: f.totalFU }))} unit="LU" />
        </Card>
      )}
    </div>
  );
}

// ============================================================
// STEP 7 — STORAGE DESIGN
// ============================================================

export function StepStorage() {
  const { project, setProject, results } = useProject();

  return (
    <div className="space-y-6">
      <SectionHeader step={7} title="Storage Design" subtitle="Calculate required water storage capacity and tank split" icon={<Warehouse className="w-6 h-6 text-blue-600" />} />

      <EduCard title="How is this calculated?" icon="how">
        <p><strong>Formula:</strong> Storage = Daily Demand × Storage Duration × (1 + Reserve % + Operational %)</p>
        <p className="mt-1">Storage provides resilience against supply interruptions. The reserve allowance covers emergencies; the operational reserve covers pump cycling and balancing.</p>
      </EduCard>

      <Card>
        <h3 className="text-sm font-semibold text-slate-700 mb-4">Storage Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <NumberInput label="Storage Duration" value={project.storage.storageDuration} onChange={(v) => setProject((p) => ({ ...p, storage: { ...p.storage, storageDuration: v } }))} unit="days" tooltip="Typical: 0.5–2 days" />
          <NumberInput label="Reserve Allowance" value={project.storage.reserveAllowance} onChange={(v) => setProject((p) => ({ ...p, storage: { ...p.storage, reserveAllowance: v } }))} unit="%" />
          <NumberInput label="Operational Reserve" value={project.storage.operationalReserve} onChange={(v) => setProject((p) => ({ ...p, storage: { ...p.storage, operationalReserve: v } }))} unit="%" />
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700">Status</label>
            <StatusBadge status={project.storage.classification} />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
          <NumberInput label="Underground Tank %" value={project.storage.undergroundTankPct} onChange={(v) => setProject((p) => ({ ...p, storage: { ...p.storage, undergroundTankPct: v } }))} unit="%" />
          <NumberInput label="Roof Tank %" value={project.storage.roofTankPct} onChange={(v) => setProject((p) => ({ ...p, storage: { ...p.storage, roofTankPct: v } }))} unit="%" />
          <NumberInput label="Ground Level Tank %" value={project.storage.groundTankPct} onChange={(v) => setProject((p) => ({ ...p, storage: { ...p.storage, groundTankPct: v } }))} unit="%" />
          <NumberInput label="Elevated Tank %" value={project.storage.elevatedTankPct} onChange={(v) => setProject((p) => ({ ...p, storage: { ...p.storage, elevatedTankPct: v } }))} unit="%" />
        </div>
      </Card>

      {results.storage && (
        <>
          <CalcDisplay
            title="Required Storage Capacity"
            result={results.storage.requiredCapacity.toFixed(2)}
            unit="m³"
            formula={results.storage.formula}
            substitution={results.storage.substitution}
            status={project.storage.classification}
          />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <ResultCard label="Underground Tank" value={results.storage.undergroundTank.toFixed(2)} unit="m³" color="slate" />
            <ResultCard label="Roof Tank" value={results.storage.roofTank.toFixed(2)} unit="m³" color="blue" />
            <ResultCard label="Ground Tank" value={results.storage.groundTank.toFixed(2)} unit="m³" color="cyan" />
            <ResultCard label="Elevated Tank" value={results.storage.elevatedTank.toFixed(2)} unit="m³" color="green" />
          </div>

          <StudentCalculationCard
            title="Student Derivation: Required Storage Capacity & Geometric Compartment Sizing"
            standardRef="BS 8551 / SLS 1373 / CIBSE Guide G Section 2"
            governingFormula="V_req = Q_day × T_duration × [1 + R_res% + R_op%]   |   V_eff = L × W × D_eff"
            formulaVariables={[
              { symbol: 'Q_day', meaning: 'Daily Potable Water Demand', unit: 'm³/day', value: (results.storage.dailyDemand / 1000).toFixed(2) },
              { symbol: 'T_dur', meaning: 'Storage Retention Duration', unit: 'days', value: project.storage.storageDuration },
              { symbol: 'R_res%', meaning: 'Emergency Supply Interruption Reserve', unit: '%', value: project.storage.reserveAllowance },
              { symbol: 'R_op%', meaning: 'Pump Balancing Operational Reserve', unit: '%', value: project.storage.operationalReserve },
              { symbol: 'V_req', meaning: 'Total Required Site Storage', unit: 'm³', value: results.storage.requiredCapacity.toFixed(2) },
            ]}
            steps={[
              {
                stepNumber: 1,
                title: 'Base Daily Storage Requirement',
                description: 'Multiply daily domestic water demand by project design retention duration (typically 24 hours to 48 hours for tropical educational & institutional campuses).',
                formula: 'V_base = Q_daily × T_duration',
                mathSubstitution: `${(results.storage.dailyDemand / 1000).toFixed(2)} m³/day × ${project.storage.storageDuration} days`,
                intermediateResult: ((results.storage.dailyDemand / 1000) * project.storage.storageDuration).toFixed(2),
                unit: 'm³',
              },
              {
                stepNumber: 2,
                title: 'Operational & Emergency Contingency Cushion',
                description: 'Incorporate emergency reserve margin (safeguard against municipal pipe breaks) and operational reserve (cushion for transfer pump cycling).',
                formula: 'V_req = V_base × [1 + (R_res + R_op) / 100]',
                mathSubstitution: `${((results.storage.dailyDemand / 1000) * project.storage.storageDuration).toFixed(2)} × [1 + (${project.storage.reserveAllowance} + ${project.storage.operationalReserve}) / 100]`,
                intermediateResult: results.storage.requiredCapacity.toFixed(2),
                unit: 'm³',
              },
              {
                stepNumber: 3,
                title: 'Underground Sump & Overhead Tank Splitting',
                description: 'Distribute total volume into a low-level bulk suction break tank (Underground / Ground) and a top-level distribution cistern (Roof Tank / Elevated).',
                formula: 'V_UG = V_req × UG%   |   V_Roof = V_req × Roof%',
                mathSubstitution: `UG: ${results.storage.requiredCapacity.toFixed(2)} × ${project.storage.undergroundTankPct}% = ${results.storage.undergroundTank.toFixed(2)} m³  |  Roof: ${results.storage.requiredCapacity.toFixed(2)} × ${project.storage.roofTankPct}% = ${results.storage.roofTank.toFixed(2)} m³`,
                intermediateResult: `${results.storage.undergroundTank.toFixed(1)} / ${results.storage.roofTank.toFixed(1)}`,
                unit: 'm³ (UG/Roof)',
              },
              {
                stepNumber: 4,
                title: 'Structural Water Depth & Air Gap Freeboard Verification',
                description: 'Effective usable capacity must account only for water between suction bottom clearance and top overflow level. Minimum 300 mm freeboard air gap is mandatory to prevent backflow contamination.',
                formula: 'V_eff = L × W × D_eff   |   V_gross = L × W × (D_eff + Freeboard)',
                mathSubstitution: 'Refer to individual compartment verification cards below',
                intermediateResult: `${results.tankDimensions.reduce((s, td) => s + td.effectiveVolume, 0).toFixed(2)}`,
                unit: 'm³ (Total Built)',
              },
            ]}
            engineeringRuleOfThumb="Always provide twin compartments (50/50 split) for both underground and overhead tanks! This permits routine de-sludging, chemical disinfection, and valve maintenance without interrupting potable water to building occupants."
          />

          {/* Visual Physical Cross-Sections */}
          {results.tankDimensions.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Visual Cross-Section & Compartment Sizing Simulations
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.tankDimensions.map((td, i) => (
                  <VisualTankCrossSection
                    key={td.tank.id || i}
                    label={`${td.tank.label} (${td.tank.tankType})`}
                    shape={td.tank.shape}
                    length={td.tank.length}
                    width={td.tank.width}
                    effectiveDepth={td.tank.effectiveDepth}
                    freeboard={td.tank.freeboard}
                    effectiveVolume={td.effectiveVolume}
                    grossVolume={td.grossVolume}
                    requiredCapacity={td.tank.requiredCapacity}
                    status={td.status}
                  />
                ))}
              </div>
            </div>
          )}

          {/* TANK DIMENSIONS */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-700">Tank Dimensions & Sizing Verification</h3>
                <p className="text-xs text-slate-500">Assign compartments to tank types (Underground, Roof Tank, Ground Tank, Elevated) and verify gross vs effective volume</p>
              </div>
              <button
                onClick={() => setProject((p) => ({
                  ...p,
                  tankDimensions: [
                    ...p.tankDimensions,
                    {
                      id: `TD-${Date.now()}`,
                      label: `New Tank ${p.tankDimensions.length + 1}`,
                      tankType: 'Underground',
                      shape: 'Rectangular',
                      length: 5,
                      width: 3,
                      effectiveDepth: 2,
                      freeboard: 0.3,
                      requiredCapacity: 0,
                    } as TankDimension,
                  ],
                }))}
                className="px-3 py-1.5 text-xs font-medium text-blue-600 border border-blue-300 rounded-md hover:bg-blue-50 transition-colors"
              >
                + Add Tank
              </button>
            </div>

            {results.tankDimensions.map((td, i) => (
              <div key={td.tank.id || i} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-9 gap-3 items-end p-3 bg-slate-50 border border-slate-200 rounded-lg mb-3">
                <TextInput label="Label" value={td.tank.label} onChange={(v) => setProject((p) => ({ ...p, tankDimensions: p.tankDimensions.map((t, j) => j === i ? { ...t, label: v } : t) }))} />
                <SelectInput label="Tank Type" value={td.tank.tankType} onChange={(v) => setProject((p) => ({ ...p, tankDimensions: p.tankDimensions.map((t, j) => j === i ? { ...t, tankType: v as TankDimension['tankType'] } : t) }))} options={['Underground', 'Roof Tank', 'Ground Tank', 'Elevated']} />
                <SelectInput label="Shape" value={td.tank.shape} onChange={(v) => setProject((p) => ({ ...p, tankDimensions: p.tankDimensions.map((t, j) => j === i ? { ...t, shape: v as 'Rectangular' | 'Cylindrical' } : t) }))} options={['Rectangular', 'Cylindrical']} />
                <NumberInput label="Length / Dia" value={td.tank.length} onChange={(v) => setProject((p) => ({ ...p, tankDimensions: p.tankDimensions.map((t, j) => j === i ? { ...t, length: v } : t) }))} unit="m" />
                <NumberInput label="Width" value={td.tank.width} onChange={(v) => setProject((p) => ({ ...p, tankDimensions: p.tankDimensions.map((t, j) => j === i ? { ...t, width: v } : t) }))} unit="m" />
                <NumberInput label="Eff. Depth" value={td.tank.effectiveDepth} onChange={(v) => setProject((p) => ({ ...p, tankDimensions: p.tankDimensions.map((t, j) => j === i ? { ...t, effectiveDepth: v } : t) }))} unit="m" />
                <NumberInput label="Freeboard" value={td.tank.freeboard} onChange={(v) => setProject((p) => ({ ...p, tankDimensions: p.tankDimensions.map((t, j) => j === i ? { ...t, freeboard: v } : t) }))} unit="m" />
                <div className="bg-white p-2 rounded border border-slate-200">
                  <div className="text-[11px] text-slate-500 font-medium">Eff. Volume</div>
                  <div className="text-base font-bold text-slate-700">{td.effectiveVolume} m³</div>
                  <div className="flex items-center gap-1 mt-0.5"><StatusIndicator status={td.status} /><span className="text-[10px] text-slate-500">{td.statusText}</span></div>
                </div>
                <div className="flex items-center justify-end pb-1">
                  <button
                    onClick={() => setProject((p) => ({ ...p, tankDimensions: p.tankDimensions.filter((_, j) => j !== i) }))}
                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                    title="Remove Tank"
                    aria-label="Remove Tank"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </Card>
        </>
      )}
    </div>
  );
}

// ============================================================
// STEP 8 — PUMP DESIGN
// ============================================================

export function StepPumpDesign() {
  const { project, setProject, results } = useProject();
  const p = project.pump;

  const update = (field: keyof typeof p, value: number | string) => {
    setProject((proj) => ({ ...proj, pump: { ...proj.pump, [field]: value } }));
  };

  return (
    <div className="space-y-6">
      <SectionHeader step={8} title="Pump Design" subtitle="Calculate pump duty point and motor power" icon={<Fuel className="w-6 h-6 text-blue-600" />} />

      <EduCard title="How is this calculated?" icon="how">
        <p><strong>Total Dynamic Head (TDH)</strong> = Static Head + Pipe Friction + Fitting Losses + Equipment Losses + Required Residual Pressure</p>
        <p className="mt-1"><strong>Hydraulic Power</strong> = Q × H × ρ × g / 3600 (kW, with Q in m³/h)</p>
        <p><strong>Motor Power</strong> = Hydraulic Power / (Pump Efficiency × Motor Efficiency)</p>
      </EduCard>

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <NumberInput label="Required Flow" value={p.requiredFlow} onChange={(v) => update('requiredFlow', v)} unit="L/s" tooltip="Leave 0 to auto-use peak flow" />
          <NumberInput label="Static Head" value={p.staticHead} onChange={(v) => update('staticHead', v)} unit="m" />
          <NumberInput label="Pipe Friction" value={p.pipeFriction} onChange={(v) => update('pipeFriction', v)} unit="m" />
          <NumberInput label="Fitting Losses" value={p.fittingLosses} onChange={(v) => update('fittingLosses', v)} unit="m" />
          <NumberInput label="Equipment Losses" value={p.equipmentLosses} onChange={(v) => update('equipmentLosses', v)} unit="m" />
          <NumberInput label="Residual Pressure" value={p.requiredResidualPressure} onChange={(v) => update('requiredResidualPressure', v)} unit="m" />
          <NumberInput label="Safety Margin" value={p.safetyMargin} onChange={(v) => update('safetyMargin', v)} unit="%" />
          <NumberInput label="Pump Efficiency" value={p.pumpEfficiency} onChange={(v) => update('pumpEfficiency', v)} unit="%" />
          <NumberInput label="Motor Efficiency" value={p.motorEfficiency} onChange={(v) => update('motorEfficiency', v)} unit="%" />
          <SelectInput label="Arrangement" value={p.arrangement} onChange={(v) => update('arrangement', v)} options={['Duty', 'Duty/Standby', 'Duty/Assist/Standby']} />
        </div>
      </Card>

      {!results.pump && <p role="status" className="text-amber-700">Additional design information required: provide a positive flow and pump/motor efficiencies, or confirm peak flow in Step 6.</p>}
      {results.pump && (
        <>
          <CalcDisplay
            title="Pump Duty Point"
            result={`${results.pump.designFlowM3h} m³/h @ ${results.pump.tdh} m`}
            unit="TDH"
            formula={results.pump.formula}
            substitution={results.pump.substitution}
            status={p.classification}
          />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <ResultCard label="Design Flow" value={results.pump.designFlow} unit="L/s" color="blue" />
            <ResultCard label="TDH" value={results.pump.tdh} unit="m" color="cyan" />
            <ResultCard label="Hydraulic Power" value={results.pump.hydraulicPower} unit="kW" color="amber" />
            <ResultCard label="Motor Power" value={results.pump.motorPower} unit="kW" color="green" />
          </div>

          <VisualPumpSystemCurve
            designFlowLps={results.pump.designFlow}
            designFlowM3h={results.pump.designFlowM3h}
            tdhM={results.pump.tdh}
            staticHeadM={p.staticHead}
            frictionHeadM={p.pipeFriction}
            residualHeadM={p.requiredResidualPressure}
            hydraulicPowerKw={results.pump.hydraulicPower}
            motorPowerKw={results.pump.motorPower}
            pumpEfficiencyPct={p.pumpEfficiency}
            motorEfficiencyPct={p.motorEfficiency}
          />

          <StudentCalculationCard
            title="Student Derivation: Total Dynamic Head (TDH) & Pump Motor Power Sizing"
            standardRef="ISO 9906 / BS EN 806-4 / Hydraulic Institute Standards"
            governingFormula="TDH = [H_static + h_f + h_fit + H_res] × [1 + Margin%]   |   P_motor = [ρ × g × Q × TDH] / [1000 × η_pump × η_motor]"
            formulaVariables={[
              { symbol: 'Q_des', meaning: 'Operating Duty Flow', unit: 'm³/h', value: results.pump.designFlowM3h },
              { symbol: 'TDH', meaning: 'Total Dynamic Head', unit: 'm', value: results.pump.tdh },
              { symbol: 'H_static', meaning: 'Physical Static Elevation Lift', unit: 'm', value: p.staticHead },
              { symbol: 'P_hyd', meaning: 'Hydraulic Water Power Output', unit: 'kW', value: results.pump.hydraulicPower },
              { symbol: 'P_motor', meaning: 'Shaft Motor Brake Power', unit: 'kW', value: results.pump.motorPower },
              { symbol: 'η_pump', meaning: 'Pump Impeller Hydraulic Efficiency', unit: '%', value: p.pumpEfficiency },
              { symbol: 'η_motor', meaning: 'Electric Motor Wire-to-Shaft Efficiency', unit: '%', value: p.motorEfficiency },
            ]}
            steps={[
              {
                stepNumber: 1,
                title: 'Total Dynamic Head (TDH) Summation',
                description: 'Calculate pump required lift by summing static elevation rise, pipe friction, localized fitting resistance, and terminal delivery pressure.',
                formula: 'TDH = (H_static + h_friction + h_fittings + H_residual) × (1 + Margin% / 100)',
                mathSubstitution: `(${p.staticHead}m + ${p.pipeFriction}m + ${p.fittingLosses}m + ${p.requiredResidualPressure}m) × (1 + ${p.safetyMargin}/100)`,
                intermediateResult: results.pump.tdh.toFixed(2),
                unit: 'm head',
              },
              {
                stepNumber: 2,
                title: 'Hydraulic Water Power Output (P_hyd)',
                description: 'Calculate theoretical mechanical work performed on fluid mass per second.',
                formula: 'P_hyd (kW) = (ρ × g × Q × TDH) / 1000 = (9.81 × Q_Lps × TDH) / 1000',
                mathSubstitution: `(1000 kg/m³ × 9.81 m/s² × (${results.pump.designFlow} / 1000 m³/s) × ${results.pump.tdh} m) / 1000`,
                intermediateResult: results.pump.hydraulicPower.toFixed(2),
                unit: 'kW',
              },
              {
                stepNumber: 3,
                title: 'Motor Shaft Power Factoring Wire-to-Water Inefficiencies',
                description: 'Divide hydraulic power by centrifugal impeller efficiency and electric induction motor stator/rotor losses.',
                formula: 'P_motor = P_hyd / ((η_pump / 100) × (η_motor / 100))',
                mathSubstitution: `${results.pump.hydraulicPower.toFixed(2)} kW / ((${p.pumpEfficiency} / 100) × (${p.motorEfficiency} / 100))`,
                intermediateResult: results.pump.motorPower.toFixed(2),
                unit: 'kW',
              },
            ]}
            engineeringRuleOfThumb="Always specify Duty/Standby pumps (1 Duty + 1 Standby, each 100% capacity) for critical infrastructure so pump failure does not cut campus water supply. Furthermore, select standard commercial motor frame (e.g. 1.5 kW or 2.2 kW) to prevent motor overload during high-flow runout condition."
          />
        </>
      )}

      <EduCard title="Engineering Note" icon="tip">
        Pump recommendations are preliminary. Final pump selection must be verified against manufacturer's pump curves, NPSH requirements, and system head curves.
      </EduCard>
    </div>
  );
}

// ============================================================
// STEP 9 — WASTEWATER
// ============================================================

export function StepWastewater() {
  const { project, setProject, results } = useProject();

  return (
    <div className="space-y-6">
      <SectionHeader step={9} title="Wastewater" subtitle="Calculate wastewater generation from water consumption" icon={<Trash2 className="w-6 h-6 text-blue-600" />} />

      <EduCard title="How is this calculated?" icon="how">
        <p><strong>Formula:</strong> Wastewater = Indoor Demand × Sewer Return Factor + Process/Kitchen/Hostel/Other Wastewater</p>
        <p className="mt-1">Additional wastewater fields must represent sources outside the modeled domestic/canteen/workshop baseline; otherwise leave them at zero to avoid double counting. The sewer return factor represents the proportion of supplied water that returns as wastewater. Irrigation losses are NOT included as wastewater.</p>
      </EduCard>

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <NumberInput max={100} label="Sewer Return Factor" value={project.wastewater.sewerReturnFactor} onChange={(v) => setProject((p) => ({ ...p, wastewater: { ...p.wastewater, sewerReturnFactor: v } }))} unit="%" source={project.wastewater.source} status={project.wastewater.classification} />
          <NumberInput label="Process Wastewater" value={project.wastewater.processWastewater} onChange={(v) => setProject((p) => ({ ...p, wastewater: { ...p.wastewater, processWastewater: v } }))} unit="L/day" />
          <NumberInput label="Kitchen Wastewater" value={project.wastewater.kitchenWastewater} onChange={(v) => setProject((p) => ({ ...p, wastewater: { ...p.wastewater, kitchenWastewater: v } }))} unit="L/day" />
          <NumberInput label="Hostel Wastewater" value={project.wastewater.hostelWastewater} onChange={(v) => setProject((p) => ({ ...p, wastewater: { ...p.wastewater, hostelWastewater: v } }))} unit="L/day" />
        </div>
      </Card>

      {results.wastewater && (
        <>
          <CalcDisplay
            title="Wastewater Generation"
            result={(results.wastewater.totalWastewater / 1000).toFixed(2)}
            unit="m³/day"
            formula={results.wastewater.formula}
            substitution={results.wastewater.substitution}
            status={project.wastewater.classification}
          />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <ResultCard label="Indoor Demand" value={(results.wastewater.indoorDemand / 1000).toFixed(2)} unit="m³/d" color="blue" />
            <ResultCard label="Wastewater" value={results.wastewater.wastewaterM3Day} unit="m³/d" color="red" />
            <ResultCard label="Monthly" value={results.wastewater.wastewaterM3Month} unit="m³/mo" color="amber" />
            <ResultCard label="Annual" value={results.wastewater.wastewaterM3Year} unit="m³/yr" color="slate" />
          </div>

          <StudentCalculationCard
            title="Student Derivation: Sanitary Wastewater Discharge & Return Rate"
            standardRef="SLS 745 / BS EN 12056 / CIBSE Guide G Table 3"
            governingFormula="Q_ww = Q_indoor × [SewerReturn% / 100] + Q_process + Q_kitchen"
            formulaVariables={[
              { symbol: 'Q_indoor', meaning: 'Net Indoor Potable Water Feed', unit: 'm³/day', value: (results.wastewater.indoorDemand / 1000).toFixed(2) },
              { symbol: 'Return%', meaning: 'Sanitary Sewer Return Factor', unit: '%', value: project.wastewater.sewerReturnFactor },
              { symbol: 'Q_process', meaning: 'Segregated Industrial/Lab Waste', unit: 'L/day', value: project.wastewater.processWastewater },
              { symbol: 'Q_kitchen', meaning: 'Canteen Kitchen Grease Waste', unit: 'L/day', value: project.wastewater.kitchenWastewater },
              { symbol: 'Q_ww', meaning: 'Total Daily Sanitary Discharge', unit: 'm³/day', value: results.wastewater.wastewaterM3Day },
            ]}
            steps={[
              {
                stepNumber: 1,
                title: 'Indoor Sanitary Feed Extraction',
                description: 'Extract indoor domestic consumption from previous steps (ablution, showering, toilet flushing, and staff drinking).',
                formula: 'Q_indoor = Q_domestic + Q_hostel',
                mathSubstitution: `Indoor Demand = ${(results.wastewater.indoorDemand).toFixed(0)} L/day = ${(results.wastewater.indoorDemand / 1000).toFixed(2)} m³/day`,
                intermediateResult: (results.wastewater.indoorDemand / 1000).toFixed(2),
                unit: 'm³/day',
              },
              {
                stepNumber: 2,
                title: 'Sewer Return Factor (Consumptive Loss Deduction)',
                description: 'Multiply indoor consumption by the sewer return factor (typically 80% to 90%). The remaining 10% to 20% represents metabolic consumption, food absorption, and cleaning evaporation.',
                formula: 'Q_domestic_ww = Q_indoor × (SewerReturn% / 100)',
                mathSubstitution: `${(results.wastewater.indoorDemand / 1000).toFixed(2)} m³/day × (${project.wastewater.sewerReturnFactor} / 100)`,
                intermediateResult: ((results.wastewater.indoorDemand / 1000) * (project.wastewater.sewerReturnFactor / 100)).toFixed(2),
                unit: 'm³/day',
              },
              {
                stepNumber: 3,
                title: 'Auxiliary Wastewater & STP Daily Hydraulic Inflow',
                description: 'Sum domestic sewer flow with dedicated kitchen grease interceptor lines and workshop process effluent.',
                formula: 'Q_total_ww = Q_domestic_ww + (Q_process + Q_kitchen + Q_hostel) / 1000',
                mathSubstitution: `${((results.wastewater.indoorDemand / 1000) * (project.wastewater.sewerReturnFactor / 100)).toFixed(2)} + (${project.wastewater.processWastewater} + ${project.wastewater.kitchenWastewater} + ${project.wastewater.hostelWastewater}) / 1000`,
                intermediateResult: results.wastewater.wastewaterM3Day,
                unit: 'm³/day',
              },
            ]}
            engineeringRuleOfThumb="Never add outdoor irrigation or rainwater to the sanitary sewer! Irrigation water transpires naturally into the atmosphere. Including irrigation causes extreme oversizing of Sewage Treatment Plants (STP), washing away biological biomass and causing wastewater treatment failure."
          />
        </>
      )}
    </div>
  );
}

// ============================================================
// STEP 10 — RAINWATER HARVESTING
// ============================================================

export function StepRainwater() {
  const { project, setProject, results } = useProject();
  const rw = project.rainwater;

  const update = (field: keyof typeof rw, value: number | boolean) => {
    setProject((p) => ({ ...p, rainwater: { ...p.rainwater, [field]: value } }));
  };

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return (
    <div className="space-y-6">
      <SectionHeader step={10} title="Rainwater Harvesting" subtitle="Calculate rainwater harvesting potential from roof catchment" icon={<CloudRain className="w-6 h-6 text-blue-600" />} />

      <EduCard title="How is this calculated?" icon="how">
        <p><strong>Formula:</strong> Harvested = Rainfall × Catchment Area × Runoff Coefficient × Filter Efficiency × Collection Efficiency</p>
        <p className="mt-1">The runoff coefficient accounts for roof surface losses. Filter and collection efficiency account for system losses. First-flush diversion removes initial contaminated runoff.</p>
      </EduCard>

      <Card>
        <ToggleInput label="Enable Rainwater Harvesting" checked={rw.enabled} onChange={(v) => update('enabled', v)} />
        {rw.enabled && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <NumberInput label="Roof Area" value={rw.roofArea} onChange={(v) => update('roofArea', v)} unit="m²" />
            <NumberInput label="Annual Rainfall" value={rw.annualRainfall} onChange={(v) => update('annualRainfall', v)} unit="mm" source={rw.source} status={rw.classification} />
            <NumberInput label="Runoff Coefficient" value={rw.runoffCoefficient} onChange={(v) => update('runoffCoefficient', v)} unit="—" step={0.05} />
            <NumberInput label="First-Flush Loss" value={rw.firstFlushLoss} onChange={(v) => update('firstFlushLoss', v)} unit="mm" step={0.1} />
            <NumberInput label="Filter Efficiency" value={rw.filterEfficiency} onChange={(v) => update('filterEfficiency', v)} unit="%" />
            <NumberInput label="Collection Efficiency" value={rw.collectionEfficiency} onChange={(v) => update('collectionEfficiency', v)} unit="%" />
          </div>
        )}
      </Card>

      {rw.enabled && results.rainwater && (
        <>
          <CalcDisplay
            title="Annual Rainwater Harvesting Potential"
            result={results.rainwater.annualHarvested.toFixed(2)}
            unit="m³/year"
            formula={results.rainwater.formula}
            substitution={results.rainwater.substitution}
            status={rw.classification}
          />

          <Card>
            <h3 className="text-sm font-semibold mb-3">Monthly Harvesting Potential</h3>
            <BarChart
              data={months.map((m, i) => ({ label: m, value: results.rainwater!.monthlyHarvested[i] || 0, color: 'bg-cyan-500' }))}
              unit="m³"
            />
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ResultCard label="Annual Harvested" value={results.rainwater.annualHarvested} unit="m³/yr" color="cyan" />
            <ResultCard label="Daily Average" value={(results.rainwater.nonPotableOffset / 1000).toFixed(2)} unit="m³/d" color="blue" />
            <ResultCard label="Non-Potable Offset" value={results.rainwater.nonPotableOffset} unit="L/d" color="green" />
          </div>

          <StudentCalculationCard
            title="Student Derivation: Rational Rainwater Yield & First-Flush Diversion"
            standardRef="BS 8515 / SLS 1553 / CIBSE Guide G Section 5"
            governingFormula="V_annual = A_roof × [P_annual - FF_loss] × C_runoff × η_filter × η_collection / 1000"
            formulaVariables={[
              { symbol: 'A_roof', meaning: 'Horizontally Projected Roof Footprint', unit: 'm²', value: rw.roofArea },
              { symbol: 'P_annual', meaning: 'Mean Annual Rainfall Depth', unit: 'mm/yr', value: rw.annualRainfall },
              { symbol: 'C_r', meaning: 'Impervious Roof Runoff Factor', unit: '—', value: rw.runoffCoefficient },
              { symbol: 'FF_loss', meaning: 'First-Flush Sanitary Diversion', unit: 'mm', value: rw.firstFlushLoss },
              { symbol: 'η_filter', meaning: 'Self-Cleaning Vortex Filter Yield', unit: '%', value: rw.filterEfficiency },
              { symbol: 'η_coll', meaning: 'Gutter & Tank Overflow Hydraulics', unit: '%', value: rw.collectionEfficiency },
              { symbol: 'V_harvest', meaning: 'Net Usable Non-Potable Water', unit: 'm³/yr', value: results.rainwater.annualHarvested.toFixed(2) },
            ]}
            steps={[
              {
                stepNumber: 1,
                title: 'Theoretical Gross Catchment Precipitation',
                description: 'Compute theoretical volume falling on the projected horizontal roof catchment area.',
                formula: 'V_gross = (A_roof × P_annual) / 1000',
                mathSubstitution: `(${rw.roofArea} m² × ${rw.annualRainfall} mm) / 1000`,
                intermediateResult: ((rw.roofArea * rw.annualRainfall) / 1000).toFixed(1),
                unit: 'm³/yr',
              },
              {
                stepNumber: 2,
                title: 'First-Flush Sanitary Contaminant Diversion',
                description: 'Deduct initial rainfall depth (typically 1.0–2.0 mm) to wash roof surfaces and flush away bird droppings, dust, and organic debris before storage.',
                formula: 'P_effective = max(0, P_annual - FirstFlush_Loss)',
                mathSubstitution: `${rw.annualRainfall} mm - ${rw.firstFlushLoss} mm`,
                intermediateResult: (Math.max(0, rw.annualRainfall - rw.firstFlushLoss)).toFixed(1),
                unit: 'mm',
              },
              {
                stepNumber: 3,
                title: 'Surface Impermeability & Mechanical Filter Efficiencies',
                description: 'Apply roof material runoff factor Cr (0.85 for tile/metal) and dual mechanical efficiency factors for fine basket screens and leaf separators.',
                formula: 'V_harvest = A_roof × P_effective × C_r × (η_filter / 100) × (η_coll / 100) / 1000',
                mathSubstitution: `${rw.roofArea} × ${(Math.max(0, rw.annualRainfall - rw.firstFlushLoss)).toFixed(1)} × ${rw.runoffCoefficient} × (${rw.filterEfficiency}/100) × (${rw.collectionEfficiency}/100) / 1000`,
                intermediateResult: results.rainwater.annualHarvested.toFixed(2),
                unit: 'm³/yr',
              },
            ]}
            engineeringRuleOfThumb="Rainwater harvesting yields fluctuate with seasonal monsoons! Sizing a storage tank to capture an entire year of rain is uneconomical. Civil engineers size rainwater cisterns for 14 to 21 days of dry-period non-potable demand (toilet flushing and landscape irrigation)."
          />

          <Card>
            <h3 className="text-sm font-semibold mb-3">Monthly Rainfall Data (mm)</h3>
            <div className="grid grid-cols-6 gap-2">
              {months.map((m, i) => (
                <div key={i}>
                  <label className="text-xs text-slate-500">{m}</label>
                  <input type="number" value={rw.monthlyRainfall[i] || 0} onChange={(e) => {
                    const v = parseFloat(e.target.value) || 0;
                    setProject((p) => ({ ...p, rainwater: { ...p.rainwater, monthlyRainfall: p.rainwater.monthlyRainfall.map((rf, j) => j === i ? v : rf) } }));
                  }} className="w-full px-2 py-1 border border-slate-300 rounded text-sm" />
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

// ============================================================
// STEP 11 — GREYWATER REUSE
// ============================================================

export function StepGreywater() {
  const { project, setProject, results } = useProject();
  const gw = project.greywater;

  const update = (field: keyof typeof gw, value: number | boolean) => {
    setProject((p) => ({ ...p, greywater: { ...p.greywater, [field]: value } }));
  };

  return (
    <div className="space-y-6">
      <SectionHeader step={11} title="Greywater Reuse" subtitle="Assess greywater generation and reuse potential" icon={<Recycle className="w-6 h-6 text-blue-600" />} />

      <EduCard title="What is greywater?" icon="what">
        <p>Greywater is wastewater from wash basins, showers, baths, and laundry — excluding toilet (black) water and kitchen waste. It can be treated and reused for WC flushing, irrigation, and cleaning.</p>
      </EduCard>

      <Card>
        <ToggleInput label="Enable Greywater Reuse" checked={gw.enabled} onChange={(v) => update('enabled', v)} />
        {gw.enabled && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
              <NumberInput label="Wash Basin Flow" value={gw.washBasinFlow} onChange={(v) => update('washBasinFlow', v)} unit="L/day" />
              <NumberInput label="Shower Flow" value={gw.showerFlow} onChange={(v) => update('showerFlow', v)} unit="L/day" />
              <NumberInput label="Laundry Flow" value={gw.laundryFlow} onChange={(v) => update('laundryFlow', v)} unit="L/day" />
              <NumberInput label="Other Sink Flow" value={gw.otherSinkFlow} onChange={(v) => update('otherSinkFlow', v)} unit="L/day" />
              <NumberInput max={100} label="Treatment Efficiency" value={gw.treatmentEfficiency} onChange={(v) => update('treatmentEfficiency', v)} unit="%" source={gw.source} status={gw.classification} />
            </div>
            <div className="mt-4 space-y-2">
              <h4 className="text-sm font-medium text-slate-700">Reuse Options</h4>
              <ToggleInput label="Reuse for WC Flushing" checked={gw.reuseForWCFlushing} onChange={(v) => update('reuseForWCFlushing', v)} />
              <ToggleInput label="Reuse for Irrigation" checked={gw.reuseForIrrigation} onChange={(v) => update('reuseForIrrigation', v)} />
              <ToggleInput label="Reuse for Cleaning" checked={gw.reuseForCleaning} onChange={(v) => update('reuseForCleaning', v)} />
            </div>
          </>
        )}
      </Card>

      <Card><NumberInput label="Confirmed eligible WC flushing demand" unit="L/day" value={project.greywater.wcFlushingDemand} onChange={v => setProject(p => ({ ...p, greywater: { ...p.greywater, wcFlushingDemand: v } }))} status="User Defined" /><p className="mt-2 text-sm text-slate-600">Reuse is capped by available water and selected eligible demand. Rainwater uses the remaining demand after greywater; annual-average potential does not establish seasonal reliability.</p></Card>
      {results.greywater && (
        <>
          <CalcDisplay
            title="Reusable Greywater"
            result={results.greywater.reusableGreywater.toFixed(2)}
            unit="L/day"
            formula={results.greywater.formula}
            substitution={results.greywater.substitution}
            status={gw.classification}
          />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <ResultCard label="Generated" value={results.greywater.greywaterGenerated} unit="L/d" color="amber" />
            <ResultCard label="Reusable" value={results.greywater.reusableGreywater} unit="L/d" color="green" />
            <ResultCard label="Potable Reduction" value={results.greywater.potableWaterReduction} unit="L/d" color="blue" />
            <ResultCard label="Reduction %" value={results.greywater.potableReductionPct} unit="%" color="cyan" />
          </div>

          <StudentCalculationCard
            title="Student Derivation: Greywater Mass Balance & Potable Water Offset"
            standardRef="BS 8525 / SLS 1553 / CIBSE Guide G Section 6"
            governingFormula="Q_reusable = Σ (Q_source,i) × [η_treatment / 100]   |   Offset = min(Q_reusable, Q_eligible_demand)"
            formulaVariables={[
              { symbol: 'Q_sources', meaning: 'Segregated Light Greywater Inflow', unit: 'L/day', value: results.greywater.greywaterGenerated },
              { symbol: 'η_treat', meaning: 'Filtration & Disinfection Efficiency', unit: '%', value: gw.treatmentEfficiency },
              { symbol: 'Q_reusable', meaning: 'Net Treated Non-Potable Water', unit: 'L/day', value: results.greywater.reusableGreywater.toFixed(0) },
              { symbol: 'Q_demand', meaning: 'Confirmed Eligible Toilet Demand', unit: 'L/day', value: project.greywater.wcFlushingDemand },
              { symbol: 'Offset%', meaning: 'Potable Water Consumption Reduction', unit: '%', value: results.greywater.potableReductionPct.toFixed(1) },
            ]}
            steps={[
              {
                stepNumber: 1,
                title: 'Light Greywater Source Summation',
                description: 'Collect washbasin, shower, and laundry rinse wastewater while strictly isolating black toilet wastewater and kitchen sink grease.',
                formula: 'Q_raw = Q_basin + Q_shower + Q_laundry + Q_other',
                mathSubstitution: `${gw.washBasinFlow} L + ${gw.showerFlow} L + ${gw.laundryFlow} L + ${gw.otherSinkFlow} L`,
                intermediateResult: `${results.greywater.greywaterGenerated}`,
                unit: 'L/day',
              },
              {
                stepNumber: 2,
                title: 'Treatment Plant Recovery & Filtration Losses',
                description: 'Factor in backwash filter reject, membrane scouring, and sludge purging losses (typically 10% to 15%).',
                formula: 'Q_treated = Q_raw × (η_treatment / 100)',
                mathSubstitution: `${results.greywater.greywaterGenerated} L/day × (${gw.treatmentEfficiency} / 100)`,
                intermediateResult: `${results.greywater.reusableGreywater.toFixed(0)}`,
                unit: 'L/day',
              },
              {
                stepNumber: 3,
                title: 'Demand Matching & Potable Mains Reduction',
                description: 'Cap reuse by verified eligible fixture demand (WC cistern flushing and landscape irrigation) to prevent unused treated storage overflow.',
                formula: 'Q_potable_saved = min(Q_treated, Q_eligible_demand)',
                mathSubstitution: `min(${results.greywater.reusableGreywater.toFixed(0)} L/d, ${project.greywater.wcFlushingDemand} L/d) = ${results.greywater.potableWaterReduction} L/d`,
                intermediateResult: `${results.greywater.potableWaterReduction}`,
                unit: 'L/day',
              },
            ]}
            engineeringRuleOfThumb="Untreated greywater turns septic and anaerobic within 24 hours, generating toxic hydrogen sulfide and explosive pathogen counts! Always size greywater balancing tanks for immediate continuous processing, with an automatic potable mains top-up solenoid valve."
          />
        </>
      )}
    </div>
  );
}

// ============================================================
// HOT WATER SERVICE DESIGN
// ============================================================

export function StepHotWater() {
  const { project, setProject, results } = useProject();
  const hw = project.hotWater;

  const update = (field: keyof typeof hw, value: number | boolean | string) => {
    setProject((p) => ({ ...p, hotWater: { ...p.hotWater, [field]: value } }));
  };

  return (
    <div className="space-y-6">
      <SectionHeader title="Hot Water System Design" subtitle="Thermal sizing, recovery power, storage, and Legionella control" icon={<Flame className="w-6 h-6 text-amber-500" />} />

      <EduCard title="Legionella Control & Thermal Safety Principle" icon="warning">
        <p><strong>BS 8558 / CIBSE Guide G Requirement:</strong> Hot water storage must be maintained at ≥60°C to inhibit the proliferation of <em>Legionella pneumophila</em> bacteria. Water distributed through pipework must arrive at outlets at ≥50°C (≥55°C in healthcare facilities) within 1 minute of running.</p>
        <p className="mt-2"><strong>Scald Prevention:</strong> Point-of-use thermostatic mixing valves (TMVs / TMV3) must be installed at basins, showers, and accessible facilities to blend water down to safe hand-washing/bathing temperatures (38°C–43°C).</p>
      </EduCard>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-700">Hot Water Service Configuration</h3>
          <ToggleInput label="Enabled" checked={hw.enabled} onChange={(v) => update('enabled', v)} />
        </div>

        {hw.enabled && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <NumberInput label="Cold Water Temp" value={hw.coldWaterTempC} onChange={(v) => update('coldWaterTempC', v)} unit="°C" tooltip="Ambient incoming cold mains temperature" />
              <NumberInput label="Storage Temp" value={hw.storageTempC} onChange={(v) => update('storageTempC', v)} unit="°C" tooltip="Must be ≥60°C for Legionella control" />
              <NumberInput label="Delivery Temp" value={hw.deliveryTempC} onChange={(v) => update('deliveryTempC', v)} unit="°C" tooltip="Target distribution temperature at tap (blended)" />
              <NumberInput label="Heating Recovery" value={hw.heatingTimeHours} onChange={(v) => update('heatingTimeHours', v)} unit="hours" tooltip="Heater recovery period to reheat full storage volume" />
            </div>

            <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wider pt-2 border-t border-slate-100">Hot Water Demand Allocations (% of fixture demand)</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <NumberInput label="Showers Hot Water" value={hw.showerHotWaterPct} onChange={(v) => update('showerHotWaterPct', v)} unit="%" tooltip="Percentage of shower flow that is heated" />
              <NumberInput label="Washbasins Hot Water" value={hw.washbasinHotWaterPct} onChange={(v) => update('washbasinHotWaterPct', v)} unit="%" tooltip="Percentage of basin flow that is heated" />
              <NumberInput label="Kitchen / Canteen" value={hw.kitchenHotWaterPct} onChange={(v) => update('kitchenHotWaterPct', v)} unit="%" tooltip="Percentage of kitchen flow that is heated" />
              <NumberInput label="Hostel Residents" value={hw.hostelHotWaterPct} onChange={(v) => update('hostelHotWaterPct', v)} unit="%" tooltip="Percentage of residential occupant demand requiring hot water" />
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-600">Classification Basis</label>
                <StatusBadge status={hw.classification} />
              </div>
              <TextInput label="Reference Standard" value={hw.source} onChange={(v) => update('source', v)} />
            </div>
          </div>
        )}
      </Card>

      {hw.enabled && results.hotWater && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <ResultCard label="Daily Hot Water Demand" value={results.hotWater.dailyHotWaterDemandL.toFixed(0)} unit="L/day" color="amber" />
            <ResultCard label="Daily Demand" value={results.hotWater.dailyHotWaterDemandM3.toFixed(2)} unit="m³/day" color="blue" />
            <ResultCard label="Storage Capacity Required" value={results.hotWater.requiredStorageL.toFixed(0)} unit="L" color="cyan" />
            <ResultCard label="Heating Power Required" value={results.hotWater.heatingLoadKW.toFixed(2)} unit="kW" color="red" />
          </div>

          <VisualThermalSpectrum
            coldWaterTempC={hw.coldWaterTempC}
            deliveryTempC={hw.deliveryTempC}
            storageTempC={hw.storageTempC}
          />

          <StudentCalculationCard
            title="Student Thermal Derivation: Calorifier Power & Legionella Disinfection"
            standardRef="BS 8558 / CIBSE Guide G / HSE ACoP L8 Legionella Code"
            governingFormula="P_heat = [V_storage × ρ × c_p × (T_storage - T_cold)] / [3600 × 1000 × t_recovery]"
            formulaVariables={[
              { symbol: 'V_storage', meaning: 'Hot Water Cylinder Storage', unit: 'L', value: results.hotWater.requiredStorageL.toFixed(0) },
              { symbol: 'T_cold', meaning: 'Mains Incoming Cold Temperature', unit: '°C', value: hw.coldWaterTempC },
              { symbol: 'T_storage', meaning: 'Anti-Legionella Cylinder Temp', unit: '°C', value: hw.storageTempC },
              { symbol: 'T_delivery', meaning: 'Point-of-Use Blended Tap Temp', unit: '°C', value: hw.deliveryTempC },
              { symbol: 'c_p', meaning: 'Specific Heat Capacity of Water', unit: 'kJ/kg·°C', value: 4.186 },
              { symbol: 't_rec', meaning: 'Thermostat Recovery Period', unit: 'hours', value: hw.heatingTimeHours },
              { symbol: 'P_heat', meaning: 'Heater Recovery Rating', unit: 'kW', value: results.hotWater.heatingLoadKW.toFixed(2) },
            ]}
            steps={[
              {
                stepNumber: 1,
                title: 'Fixture & Occupant Hot Water Draw Allocation',
                description: 'Aggregate hot water requirements across showers (typically 40–50% heated), washbasins (30–40% heated), and commercial kitchen wash-up sinks.',
                formula: 'Q_hw_daily = Σ (Q_fixture,i × HW_Allocation%)',
                mathSubstitution: `Total Daily Hot Water Demand = ${results.hotWater.dailyHotWaterDemandL.toFixed(0)} L/day (${results.hotWater.dailyHotWaterDemandM3.toFixed(2)} m³/day)`,
                intermediateResult: results.hotWater.dailyHotWaterDemandL.toFixed(0),
                unit: 'L/day',
              },
              {
                stepNumber: 2,
                title: 'Thermal Elevation Differential (ΔT)',
                description: 'Determine temperature delta required to lift ambient incoming mains water to anti-bacterial storage temperature (≥60°C).',
                formula: 'ΔT = T_storage - T_cold',
                mathSubstitution: `${hw.storageTempC} °C - ${hw.coldWaterTempC} °C`,
                intermediateResult: `${hw.storageTempC - hw.coldWaterTempC}`,
                unit: '°C rise',
              },
              {
                stepNumber: 3,
                title: 'Sensible Heat Energy & Electric Recovery Power Rating',
                description: 'Calculate electrical heating energy required to regenerate the full cylinder volume within the target recovery window t_rec.',
                formula: 'P_heat (kW) = (V × ρ × c_p × ΔT) / (3600 × 1000 × t_rec)',
                mathSubstitution: `(${results.hotWater.requiredStorageL.toFixed(0)} L × 1.0 kg/L × 4.186 kJ/kg°C × ${hw.storageTempC - hw.coldWaterTempC} °C) / (3600 × ${hw.heatingTimeHours} h)`,
                intermediateResult: results.hotWater.heatingLoadKW.toFixed(2),
                unit: 'kW',
              },
            ]}
            engineeringRuleOfThumb="Legionella pneumophila bacteria proliferate rapidly between 20°C and 45°C. Storing hot water at ≥60°C kills 90% of bacteria within 2 minutes! However, 60°C causes third-degree skin scalding in 5 seconds. Therefore, TMVs (Thermostatic Mixing Valves) are legally required at taps to blend water down to 38°C–43°C."
          />

          <CalcDisplay
            title="Heating Load & Recovery Power Calculation"
            result={`${results.hotWater.heatingLoadKW.toFixed(2)}`}
            unit="kW"
            formula={results.hotWater.formula}
            substitution={results.hotWater.substitution}
            status={hw.classification}
          />
        </>
      )}
    </div>
  );
}

// ============================================================
// STEP 12 — FIRE WATER
// ============================================================

export function StepFireWater() {
  const { project, setProject, results } = useProject();
  const fw = project.fireWater;

  const update = (field: keyof typeof fw, value: number | boolean | string) => {
    setProject((p) => ({ ...p, fireWater: { ...p.fireWater, [field]: value } }));
  };

  return (
    <div className="space-y-6">
      <SectionHeader step={12} title="Fire Water" subtitle="Fire-water storage and pump sizing — separate from domestic water" icon={<Flame className="w-6 h-6 text-red-600" />} />

      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-sm font-semibold text-red-800">
          Fire-water storage and fire-pump sizing shall not be derived from normal domestic daily water consumption.
        </p>
        <p className="text-sm text-red-600 mt-1">
          Fire requirements depend on applicable fire regulations and project classification. Verify with the local fire authority.
        </p>
      </div>

      <Card>
        <ToggleInput label="Enable Fire Water Module" checked={fw.enabled} onChange={(v) => update('enabled', v)} />
        {fw.enabled && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <TextInput label="Hazard Classification" value={fw.hazardClassification} onChange={(v) => update('hazardClassification', v)} />
            <NumberInput label="Building Area" value={fw.buildingArea} onChange={(v) => update('buildingArea', v)} unit="m²" />
            <NumberInput label="Building Height" value={fw.buildingHeight} onChange={(v) => update('buildingHeight', v)} unit="m" />
            <NumberInput label="Fire Flow" value={fw.fireFlow} onChange={(v) => update('fireFlow', v)} unit="L/min" tooltip="As required by fire authority" source={fw.source} status={fw.classification} />
            <NumberInput label="Fire Duration" value={fw.fireDuration} onChange={(v) => update('fireDuration', v)} unit="hours" />
            <div className="space-y-2">
              <ToggleInput label="Hydrant Required" checked={fw.hydrantRequired} onChange={(v) => update('hydrantRequired', v)} />
              <ToggleInput label="Hose Reel Required" checked={fw.hoseReelRequired} onChange={(v) => update('hoseReelRequired', v)} />
              <ToggleInput label="Sprinkler Required" checked={fw.sprinklerRequired} onChange={(v) => update('sprinklerRequired', v)} />
            </div>
          </div>
        )}
      </Card>

      {results.fireWater && fw.enabled && (
        <>
          <CalcDisplay
            title="Fire Water Storage"
            result={results.fireWater.fireWaterStorage.toFixed(2)}
            unit="m³"
            formula={results.fireWater.formula}
            substitution={results.fireWater.substitution}
            status="Verification Required"
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ResultCard label="Fire Flow" value={results.fireWater.fireFlow} unit="L/min" color="red" />
            <ResultCard label="Duration" value={results.fireWater.fireDuration} unit="hours" color="amber" />
            <ResultCard label="Storage Required" value={results.fireWater.fireWaterStorage} unit="m³" color="red" />
          </div>

          <StudentCalculationCard
            title="Student Fire Hydraulics Derivation: Dedicated Fire Suppression Storage"
            standardRef="NFPA 13 / NFPA 14 / BS 9990 Fire Protection Code"
            governingFormula="V_fire = (Q_fire × 60 × t_duration) / 1000   |   Dedicated Static Fire Reserve"
            formulaVariables={[
              { symbol: 'Q_fire', meaning: 'Required Fire Fighting Flow Rate', unit: 'L/min', value: results.fireWater.fireFlow },
              { symbol: 't_dur', meaning: 'Fire Service Attack Duration', unit: 'hours', value: results.fireWater.fireDuration },
              { symbol: 'V_fire', meaning: 'Dedicated Emergency Fire Reserve', unit: 'm³', value: results.fireWater.fireWaterStorage },
              { symbol: 'Hazard', meaning: 'Occupancy Fire Risk Category', unit: 'class', value: fw.hazardClassification || 'Ordinary Hazard' },
            ]}
            steps={[
              {
                stepNumber: 1,
                title: 'Fire Protection Stream Demand Allocation',
                description: 'Determine required water stream delivery based on building height, area, and installed suppression systems (hydrants, landing valves, hose reels, automatic wet sprinklers).',
                formula: 'Q_fire = Q_hydrants + Q_sprinklers + Q_hosereels',
                mathSubstitution: `Rated Fire Flow = ${results.fireWater.fireFlow} L/min (${(results.fireWater.fireFlow / 60).toFixed(2)} L/s)`,
                intermediateResult: results.fireWater.fireFlow.toFixed(0),
                unit: 'L/min',
              },
              {
                stepNumber: 2,
                title: 'Emergency Pumping Attack Duration Requirement',
                description: 'Apply statutory fire fighting duration based on fire brigade travel time and building evacuation clearance window (typically 45 to 120 minutes).',
                formula: 'Minutes = t_duration × 60 min/hour',
                mathSubstitution: `${results.fireWater.fireDuration} hours × 60 minutes = ${results.fireWater.fireDuration * 60} minutes`,
                intermediateResult: `${results.fireWater.fireDuration * 60}`,
                unit: 'minutes',
              },
              {
                stepNumber: 3,
                title: 'Dedicated Volumetric Reservoir Sizing',
                description: 'Calculate dedicated static water volume that must remain physically safeguarded 24/7/365 exclusively for fire pumps.',
                formula: 'V_fire (m³) = (Q_fire × 60 × t_duration) / 1000',
                mathSubstitution: `(${results.fireWater.fireFlow} L/min × 60 min/h × ${results.fireWater.fireDuration} h) / 1000`,
                intermediateResult: results.fireWater.fireWaterStorage.toFixed(2),
                unit: 'm³',
              },
            ]}
            engineeringRuleOfThumb="Dedicated fire storage must NEVER be compromised by domestic consumption! In combined storage tanks, the domestic booster suction pipe must be positioned high above the dedicated fire water level to prevent domestic drawdown into the fire reserve."
          />
        </>
      )}
    </div>
  );
}

// ============================================================
// SUB-METERING & MONITORING
// ============================================================

export function StepSubMetering() {
  const { project, setProject, results } = useProject();
  const sm = project.subMetering;

  const updateZone = (id: string, field: keyof SubMeterZone, value: number | boolean | string) => {
    setProject((p) => ({
      ...p,
      subMetering: {
        ...p.subMetering,
        zones: p.subMetering.zones.map((z) => (z.id === id ? { ...z, [field]: value } : z)),
      },
    }));
  };

  return (
    <div className="space-y-6">
      <SectionHeader title="Sub-Metering & Smart Monitoring" subtitle="Zone telemetry breakdown, water balance verification, and automated anomaly audit" icon={<Activity className="w-6 h-6 text-blue-600" />} />

      <EduCard title="Why is Sub-Metering Mandatory in Modern Design?" icon="why">
        <p><strong>BREEAM Wat 02 / LEED WE / ISO 50001:</strong> Dedicated sub-metering of major water circuits (irrigation, workshops, kitchens, hostels, cooling systems) is essential to detect underground leaks, optimize consumption profiles, and pinpoint operational anomalies.</p>
        <p className="mt-1">Continuous reconciliation between the primary fiscal bulk meter and sum of sub-meters prevents unaccounted water loss (NRW).</p>
      </EduCard>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <ResultCard label="Total Metered Flow" value={results.subMetering?.totalMeteredDemandL ? (results.subMetering.totalMeteredDemandL / 1000).toFixed(2) : '—'} unit="m³/day" color="blue" />
        <ResultCard label="Unaccounted Discrepancy" value={results.subMetering?.unaccountedDifferenceL ? (results.subMetering.unaccountedDifferenceL).toFixed(0) : '—'} unit="L/day" color={results.subMetering && results.subMetering.unaccountedPct > 10 ? 'red' : 'green'} />
        <ResultCard label="Unaccounted Percentage" value={results.subMetering?.unaccountedPct ? `${results.subMetering.unaccountedPct.toFixed(1)}%` : '0%'} unit="" color={results.subMetering && results.subMetering.unaccountedPct > 10 ? 'red' : 'green'} />
        <ResultCard label="Active Monitored Zones" value={sm.zones.filter(z => z.installed).length} unit={`/ ${sm.zones.length}`} color="slate" />
      </div>

      <Card>
        <h3 className="text-sm font-semibold text-slate-700 mb-4">Sub-Metered Zones & Simulated Telemetry</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border border-slate-200 rounded-lg">
            <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Zone Code</th>
                <th className="py-2.5 px-3">Zone Name & Purpose</th>
                <th className="py-2.5 px-3">Meter Type</th>
                <th className="py-2.5 px-3">Installed</th>
                <th className="py-2.5 px-3">Baseline (L/d)</th>
                <th className="py-2.5 px-3">Actual / Telemetry (L/d)</th>
                <th className="py-2.5 px-3">Share (%)</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Diagnostic Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sm.zones.map((zone) => {
                const zoneRes = results.subMetering?.zones.find((zr) => zr.id === zone.id);
                return (
                  <tr key={zone.id} className="hover:bg-slate-50">
                    <td className="py-2 px-3 font-mono font-semibold text-slate-600">{zone.id}</td>
                    <td className="py-2 px-3">
                      <div className="font-medium text-slate-800">{zone.name}</div>
                      <div className="text-[11px] text-slate-500">{zone.description}</div>
                    </td>
                    <td className="py-2 px-3 text-slate-600">{zone.meterType}</td>
                    <td className="py-2 px-3">
                      <input
                        type="checkbox"
                        checked={zone.installed}
                        onChange={(e) => updateZone(zone.id, 'installed', e.target.checked)}
                        className="rounded text-blue-600"
                        aria-label={`Install meter for ${zone.name}`}
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        value={zone.baselineDemandL}
                        onChange={(e) => updateZone(zone.id, 'baselineDemandL', Number(e.target.value))}
                        className="w-20 px-1.5 py-0.5 border border-slate-300 rounded text-xs"
                        aria-label={`Baseline for ${zone.name}`}
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        value={zone.actualOrSimulatedDemandL}
                        onChange={(e) => updateZone(zone.id, 'actualOrSimulatedDemandL', Number(e.target.value))}
                        className="w-20 px-1.5 py-0.5 border border-slate-300 rounded text-xs"
                        aria-label={`Actual telemetry for ${zone.name}`}
                      />
                    </td>
                    <td className="py-2 px-3 font-medium text-slate-700">
                      {zoneRes ? `${zoneRes.pct}%` : '—'}
                    </td>
                    <td className="py-2 px-3">
                      {zoneRes ? (
                        <span className={`inline-block px-2 py-0.5 font-bold rounded text-[11px] ${
                          zoneRes.anomalyStatus === 'Normal' ? 'bg-green-100 text-green-700' :
                          zoneRes.anomalyStatus === 'Elevated' ? 'bg-amber-100 text-amber-700' :
                          zoneRes.anomalyStatus === 'Potential Leak' ? 'bg-red-100 text-red-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {zoneRes.anomalyStatus}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="py-2 px-3 text-slate-600 text-[11px]">
                      {zoneRes?.notes || '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ============================================================
// STEP 13 — SUSTAINABILITY
// ============================================================

export function StepSustainability() {
  const { results } = useProject();

  return (
    <div className="space-y-6">
      <SectionHeader step={13} title="Sustainability" subtitle="Water efficiency indicators and environmental metrics" icon={<Leaf className="w-6 h-6 text-green-600" />} />

      <EduCard title="What are these indicators?" icon="what">
        <p>These are project-specific sustainability metrics. They are NOT environmental certifications. They help assess the water efficiency of the design and identify improvement opportunities.</p>
      </EduCard>

      {results.sustainability && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <ResultCard label="Potable per Person" value={results.sustainability.potablePerPerson} unit="L/p/d" color="blue" />
            <ResultCard label="Rainwater Contribution" value={results.sustainability.rainwaterContributionPct} unit="%" color="cyan" />
            <ResultCard label="Recycled Contribution" value={results.sustainability.recycledContributionPct} unit="%" color="green" />
            <ResultCard label="Potable Reduction" value={results.sustainability.potableReductionPct} unit="%" color="green" />
            <ResultCard label="Annual Saving" value={results.sustainability.annualSaving} unit="m³/yr" color="green" />
            <ResultCard label="Wastewater Reuse" value={results.sustainability.wastewaterReusePct} unit="%" color="cyan" />
            <ResultCard label="Annual Utility" value={results.sustainability.annualUtilityConsumption} unit="m³/yr" color="amber" />
            <ResultCard label="Efficiency Score" value={results.sustainability.efficiencyScore} unit="/100" color={results.sustainability.efficiencyScore >= 70 ? 'green' : 'amber'} />
          </div>

          {/* SCENARIO COMPARISON */}
          <Card>
            <h3 className="text-sm font-semibold text-slate-700 mb-4">Scenario Comparison</h3>
            <DataTable
              headers={['Scenario', 'Potable Demand (m³/day)', 'Annual Consumption (m³/yr)', 'Recycled Water (%)', 'Sustainability Score']}
              rows={[
                ['A — Conventional', results.add ? results.add.finalADDm3.toFixed(2) : '0', results.add ? (results.add.finalADDm3 * 365).toFixed(0) : '0', '0%', '50'],
                ['B — Water Efficient', results.add ? (results.add.finalADDm3 * 0.75).toFixed(2) : '0', results.add ? (results.add.finalADDm3 * 365 * 0.75).toFixed(0) : '0', '0%', '70'],
                ['C — Rainwater + Greywater', results.add ? (results.add.finalADDm3 * (1 - results.sustainability.potableReductionPct / 100)).toFixed(2) : '0', results.add ? (results.add.finalADDm3 * 365 * (1 - results.sustainability.potableReductionPct / 100)).toFixed(0) : '0', `${results.sustainability.potableReductionPct}%`, results.sustainability.efficiencyScore],
              ]}
            />
          </Card>
        </>
      )}
    </div>
  );
}

// ============================================================
// STEP 14 — DESIGN REVIEW
// ============================================================

export function StepDesignReview() {
  const { results } = useProject();

  return (
    <div className="space-y-6">
      <SectionHeader step={14} title="Design Review" subtitle="Review warnings, assumptions, system validation matrix, and overall design status" icon={<ClipboardCheck className="w-6 h-6 text-blue-600" />} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="text-center">
          <div className="text-3xl font-bold" style={{ color: results.completionPct >= 90 ? '#16a34a' : results.completionPct >= 50 ? '#d97706' : '#dc2626' }}>
            {results.completionPct}%
          </div>
          <div className="text-sm text-slate-500">Project Completion</div>
        </Card>
        <Card className="text-center">
          <div className={`text-2xl font-bold ${results.overallStatus === 'PASS' ? 'text-green-600' : results.overallStatus === 'REVIEW' ? 'text-amber-600' : 'text-red-600'}`}>
            {results.overallStatus}
          </div>
          <div className="text-sm text-slate-500">Engineering Status</div>
        </Card>
        <Card className="text-center">
          <div className="text-2xl font-bold text-slate-700">{results.warnings.length}</div>
          <div className="text-sm text-slate-500">Warnings</div>
        </Card>
      </div>

      {/* 18-POINT SUBSYSTEM VALIDATION MATRIX */}
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-800">18-Point System Validation Matrix</h3>
            <p className="text-xs text-slate-500">Rigorous independent criteria verification across all hydraulic and storage subsystems</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
              results.systemValidation.overallStatus === 'READY FOR PROFESSIONAL PROTOTYPE USE'
                ? 'bg-green-100 text-green-800'
                : 'bg-amber-100 text-amber-800'
            }`}>
              {results.systemValidation.overallStatus}
            </span>
            <span className="text-xs text-slate-600 font-medium">
              {results.systemValidation.passCount} PASS / {results.systemValidation.reviewCount} REVIEW
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border border-slate-200 rounded-lg">
            <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Item ID</th>
                <th className="py-2.5 px-3">Subsystem</th>
                <th className="py-2.5 px-3">Validation Criteria</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Engineering Finding</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {results.systemValidation.items.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="py-2 px-3 font-mono font-semibold text-slate-600">{item.id}</td>
                  <td className="py-2 px-3 font-medium text-slate-800">{item.subsystem}</td>
                  <td className="py-2 px-3 text-slate-600">{item.criteria}</td>
                  <td className="py-2 px-3">
                    <span className={`inline-block px-2 py-0.5 font-bold rounded text-[11px] ${
                      item.status === 'PASS' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-slate-700">{item.finding}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {results.warnings.length > 0 && (
        <Card>
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Warnings & Alerts ({results.warnings.length})</h3>
          <div className="space-y-3">
            {results.warnings.map((w) => (
              <WarningCard key={w.id} warning={w} />
            ))}
          </div>
        </Card>
      )}

      {results.recommendations.length > 0 && (
        <Card>
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Smart Recommendations</h3>
          <div className="space-y-2">
            {results.recommendations.map((r) => (
              <div key={r.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                <span className={`px-2 py-0.5 text-xs rounded border ${
                  r.priority === 'High' ? 'bg-red-100 text-red-700 border-red-200' :
                  r.priority === 'Medium' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                  'bg-slate-100 text-slate-700 border-slate-200'
                }`}>{r.priority}</span>
                <span className="text-sm text-slate-700">{r.text}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card>
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Design Checklist</h3>
        <div className="space-y-2">
          {results.checklist.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-2 bg-slate-50 rounded">
              <span className="text-sm text-slate-700">{item.text}</span>
              <span className={`px-2 py-0.5 text-xs rounded ${
                item.status === 'Complete' ? 'bg-green-100 text-green-700' :
                item.status === 'Review Required' ? 'bg-amber-100 text-amber-700' :
                'bg-slate-100 text-slate-500'
              }`}>{item.status}</span>
            </div>
          ))}
        </div>
      </Card>

      {results.assumptions.length > 0 && (
        <Card>
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Assumption Register</h3>
          <DataTable
            headers={['No.', 'Parameter', 'Value', 'Unit', 'Basis', 'Verification']}
            rows={results.assumptions.map((a) => [
              a.no, a.parameter, a.adoptedValue, a.unit, a.basis, a.verificationRequired ? 'Required' : 'Not Required',
            ])}
          />
        </Card>
      )}

      {results.calcRegister.length > 0 && (
        <Card>
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Calculation Register</h3>
          <DataTable
            headers={['ID', 'Section', 'Input', 'Result', 'Unit', 'Source']}
            rows={results.calcRegister.map((c) => [
              c.id, c.section, c.input, c.result, c.unit, c.source,
            ])}
          />
        </Card>
      )}
    </div>
  );
}

// ============================================================
// STEP 15 — REPORT & EXPORT
// ============================================================

export function StepReport() {
  const { project, results, exportJSON } = useProject();

  return (
    <div className="space-y-6">
      <SectionHeader step={15} title="Report & Export" subtitle="Generate professional engineering documentation" icon={<FileText className="w-6 h-6 text-blue-600" />} />

      {results.add && (
        <Card>
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Professional Result Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <div className="flex justify-between"><span className="text-slate-500">Project:</span><span className="font-medium text-slate-800">{project.projectInfo.projectName}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Location:</span><span className="font-medium text-slate-800">{project.projectInfo.location}, {project.projectInfo.country}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Total Population:</span><span className="font-medium text-slate-800">{results.totalPopulation} persons</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Average Daily Demand:</span><span className="font-medium text-slate-800">{results.add.finalADDm3.toFixed(2)} m³/day</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Maximum Daily Demand:</span><span className="font-medium text-slate-800">{results.mdd?.mddm3?.toFixed(2) || '—'} m³/day</span></div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between"><span className="text-slate-500">Peak Design Flow:</span><span className="font-medium text-slate-800">{results.peakFlow?.probablePeakFlow || '—'} L/s</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Domestic Storage:</span><span className="font-medium text-slate-800">{results.storage?.requiredCapacity?.toFixed(2) || '—'} m³</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Wastewater:</span><span className="font-medium text-slate-800">{results.wastewater?.wastewaterM3Day?.toFixed(2) || '—'} m³/day</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Rainwater Potential:</span><span className="font-medium text-slate-800">{results.rainwater?.annualHarvested?.toFixed(2) || '—'} m³/year</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Pump Duty:</span><span className="font-medium text-slate-800">{results.pump?.designFlowM3h?.toFixed(2) || '—'} m³/h @ {results.pump?.tdh?.toFixed(2) || '—'} m</span></div>
            </div>
          </div>
        </Card>
      )}

      <Card className="print:hidden">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">Export Options</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button onClick={() => window.dispatchEvent(new CustomEvent('export-pdf'))} className="flex items-center gap-3 p-4 border-2 border-red-200 rounded-lg hover:bg-red-50 transition-colors text-left">
            <FileText className="w-8 h-8 text-red-600" />
            <div>
              <div className="font-medium text-slate-800">PDF Report</div>
              <div className="text-xs text-slate-500">Professional A4 engineering report</div>
            </div>
          </button>
          <button onClick={() => window.dispatchEvent(new CustomEvent('export-xlsx'))} className="flex items-center gap-3 p-4 border-2 border-green-200 rounded-lg hover:bg-green-50 transition-colors text-left">
            <Calculator className="w-8 h-8 text-green-600" />
            <div>
              <div className="font-medium text-slate-800">Excel Workbook</div>
              <div className="text-xs text-slate-500">Multi-sheet engineering workbook (.xlsx)</div>
            </div>
          </button>
          <button onClick={() => window.dispatchEvent(new CustomEvent('export-docx'))} className="flex items-center gap-3 p-4 border-2 border-blue-200 rounded-lg hover:bg-blue-50 transition-colors text-left">
            <FileText className="w-8 h-8 text-blue-600" />
            <div>
              <div className="font-medium text-slate-800">Word Report</div>
              <div className="text-xs text-slate-500">Editable engineering report (.docx)</div>
            </div>
          </button>
          <button onClick={exportJSON} className="flex items-center gap-3 p-4 border-2 border-amber-200 rounded-lg hover:bg-amber-50 transition-colors text-left">
            <FileText className="w-8 h-8 text-amber-600" />
            <div>
              <div className="font-medium text-slate-800">Project Data (JSON)</div>
              <div className="text-xs text-slate-500">Backup and transfer project data</div>
            </div>
          </button>
        </div>
        <div className="mt-4">
          <button onClick={() => window.dispatchEvent(new CustomEvent('print-report'))} className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-md hover:bg-slate-50 transition-colors">
            Print Engineering Summary
          </button>
        </div>
      </Card>

      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
        <p className="text-xs text-slate-500 italic">
          This application supports preliminary engineering design, teaching, checking and documentation. Final detailed design shall be verified by a suitably qualified professional against the latest applicable regulations, authority requirements, site conditions, manufacturer data and project specifications.
        </p>
      </div>
    </div>
  );
}

// ============================================================
// DASHBOARD
// ============================================================

// ============================================================
// DASHBOARD
// ============================================================

export function Dashboard() {
  const { project, results, setProject } = useProject();

  return (
    <div className="space-y-6">
      <SectionHeader title="Dashboard" subtitle={`${project.projectInfo.projectName} — ${project.projectInfo.location}`} icon={<LayoutDashboard className="w-6 h-6 text-blue-600" />} />

      {/* COMPLIANCE & ENGINEERING NOTICE BANNERS */}
      <EngineeringNoticeBanner />
      <PrinciplesBanner />

      {/* SMART AUTO-PILOT QUICK BAR */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-xl p-4 shadow-xs border border-indigo-700/40 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-300">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>Ordinary Input Auto-Pilot</span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-400 text-slate-950">AI WIZARD</span>
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5">
              Instantly recalibrate all 19 calculation pages from basic building type, size, and floors.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent('open-autopilot'))}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 shadow transition-all"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Launch Auto-Pilot</span>
        </button>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <KPICard label="Total Population" value={results.totalPopulation} unit="persons" icon={<Users className="w-5 h-5" />} color="blue" />
        <KPICard label="Avg Daily Demand" value={results.add?.finalADDm3?.toFixed(2) || '—'} unit="m³/day" icon={<Droplets className="w-5 h-5" />} color="cyan" />
        <KPICard label="Max Daily Demand" value={results.mdd?.mddm3?.toFixed(2) || '—'} unit="m³/day" icon={<Droplets className="w-5 h-5" />} color="amber" />
        <KPICard label="Peak Flow" value={results.peakFlow?.probablePeakFlow || '—'} unit="L/s" icon={<Calculator className="w-5 h-5" />} color="blue" />
        <KPICard label="Storage Required" value={results.storage?.requiredCapacity?.toFixed(2) || '—'} unit="m³" icon={<Warehouse className="w-5 h-5" />} color="slate" />
        <KPICard label="Pump Duty" value={results.pump ? `${results.pump.designFlowM3h}` : '—'} unit="m³/h" icon={<Fuel className="w-5 h-5" />} color="green" />
        <KPICard label="Wastewater" value={results.wastewater?.wastewaterM3Day?.toFixed(2) || '—'} unit="m³/d" icon={<Trash2 className="w-5 h-5" />} color="red" />
        <KPICard label="Rainwater" value={results.rainwater?.annualHarvested?.toFixed(0) || '—'} unit="m³/yr" icon={<CloudRain className="w-5 h-5" />} color="cyan" />
        <KPICard label="Potable Reduction" value={results.sustainability?.potableReductionPct || '—'} unit="%" icon={<Recycle className="w-5 h-5" />} color="green" />
        <KPICard label="Efficiency Score" value={results.sustainability?.efficiencyScore || '—'} unit="/100" icon={<Leaf className="w-5 h-5" />} color={(results.sustainability?.efficiencyScore ?? 0) >= 70 ? 'green' : 'amber'} />
        <KPICard label="Pump TDH" value={results.pump?.tdh?.toFixed(2) || '—'} unit="m" icon={<Fuel className="w-5 h-5" />} color="blue" />
        <KPICard label="Completion" value={results.completionPct} unit="%" icon={<ClipboardCheck className="w-5 h-5" />} color={results.completionPct >= 90 ? 'green' : 'amber'} />
      </div>

      {/* REAL-TIME / SIMULATED SMART TELEMETRY */}
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="text-sm font-semibold text-slate-800">Smart Facility Telemetry & SCADA Monitoring</h3>
              <p className="text-xs text-slate-500">Live IoT telemetry simulation & threshold supervisor (Updated {results.smartMonitoring.lastUpdated})</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              Telemetry Simulated
            </span>
            {results.smartMonitoring.leakageAlert ? (
              <span className="px-2 py-0.5 text-xs font-bold rounded bg-red-100 text-red-700">LEAKAGE ALERT</span>
            ) : (
              <span className="px-2 py-0.5 text-xs font-bold rounded bg-green-100 text-green-700">NO LEAKS DETECTED</span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="text-xs text-slate-500 font-medium flex items-center justify-between">
              <span>Main Inflow Rate</span>
              <Gauge className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-2xl font-bold text-slate-800 mt-1">{results.smartMonitoring.flowMeterCurrentLps} <span className="text-sm font-normal text-slate-500">L/s</span></div>
            <div className="text-[11px] text-slate-500 mt-0.5">Approx. {(results.smartMonitoring.flowMeterCurrentLps * 3.6).toFixed(1)} m³/h</div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="text-xs text-slate-500 font-medium flex items-center justify-between">
              <span>Header Pressure</span>
              <Gauge className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-2xl font-bold text-slate-800 mt-1">{results.smartMonitoring.distributionPressureBar} <span className="text-sm font-normal text-slate-500">bar</span></div>
            <div className="text-[11px] text-slate-500 mt-0.5">Distribution network residual head</div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="text-xs text-slate-500 font-medium flex items-center justify-between">
              <span>Booster Pump Array</span>
              <Fuel className="w-4 h-4 text-slate-400" />
            </div>
            <div className="mt-1 space-y-1">
              {results.smartMonitoring.pumpRunningStatus.map((pmp) => (
                <div key={pmp.pumpId} className="flex items-center justify-between text-xs">
                  <span className="text-slate-700 truncate">{pmp.label}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    pmp.status === 'Running' ? 'bg-green-100 text-green-700' :
                    pmp.status === 'Standby' ? 'bg-blue-100 text-blue-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {pmp.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {results.smartMonitoring.tankLevels.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Storage Tanks Real-Time Levels</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {results.smartMonitoring.tankLevels.map((tl) => (
                <div key={tl.tankId} className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="flex items-center justify-between text-xs font-medium mb-1">
                    <span className="text-slate-800">{tl.label}</span>
                    <span className="font-bold text-slate-700">{tl.currentVolumeM3} m³ ({tl.currentLevelPct}%)</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${Math.min(100, tl.currentLevelPct)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* DEMAND BY CATEGORY */}
      {results.waterBalance && (
        <Card>
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Demand by Category</h3>
          <BarChart data={results.waterBalance.consumption.map((c) => ({ label: c.name, value: c.value }))} unit="L/day" />
        </Card>
      )}

      {/* WATER SOURCES */}
      {results.waterBalance && (
        <Card>
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Water Source Contribution</h3>
          <BarChart data={results.waterBalance.sources.map((s) => ({ label: s.name, value: s.value, color: 'bg-cyan-500' }))} unit="L/day" />
        </Card>
      )}

      {/* SUSTAINABILITY CHART */}
      {results.sustainability && (
        <Card>
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Sustainability Savings</h3>
          <BarChart data={[
            { label: 'Rainwater', value: results.sustainability.rainwaterContributionPct, color: 'bg-cyan-500' },
            { label: 'Greywater', value: results.sustainability.recycledContributionPct, color: 'bg-green-500' },
            { label: 'Total Reduction', value: results.sustainability.potableReductionPct, color: 'bg-blue-500' },
            { label: 'Wastewater Reuse', value: results.sustainability.wastewaterReusePct, color: 'bg-amber-500' },
            { label: 'Efficiency Score', value: results.sustainability.efficiencyScore, color: 'bg-green-600' },
          ]} unit="%" />
        </Card>
      )}

      {/* WARNINGS SUMMARY */}
      {results.warnings.length > 0 && (
        <Card>
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Active Warnings ({results.warnings.length})</h3>
          <div className="space-y-2">
            {results.warnings.slice(0, 5).map((w) => (
              <div key={w.id} className={`p-3 rounded-lg border text-sm ${
                w.level === 'critical' ? 'bg-red-50 border-red-200 text-red-800' :
                w.level === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-800' :
                'bg-blue-50 border-blue-200 text-blue-800'
              }`}>
                <span className="font-semibold">[{w.section}]</span> {w.message}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* DESIGN MODE TOGGLE */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-700">Design Mode</h3>
            <p className="text-xs text-slate-500 mt-1">Switch between Learning Mode (with explanations) and Professional Mode (compact)</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setProject((p) => ({ ...p, designMode: 'learning' }))} className={`px-4 py-2 text-sm font-medium rounded-md ${project.designMode === 'learning' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>Learning</button>
            <button onClick={() => setProject((p) => ({ ...p, designMode: 'professional' }))} className={`px-4 py-2 text-sm font-medium rounded-md ${project.designMode === 'professional' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>Professional</button>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ============================================================
// STANDARDS & DESIGN BASIS
// ============================================================

export function StepStandards() {
  const { project, overrideWPSFFactor, resetWPSFFactor, resetAllWPSFFactors } = useProject();
  const [overrideModalFactor, setOverrideModalFactor] = useState<WPSFFactor | null>(null);
  const [overrideValue, setOverrideValue] = useState<number>(0);
  const [overrideReason, setOverrideReason] = useState<string>('');
  const [overrideRef, setOverrideRef] = useState<string>('');

  const overriddenCount = (project.wpsfFactors || []).filter((f) => !!f.overrideDetails).length;

  const handleOpenOverride = (f: WPSFFactor) => {
    setOverrideModalFactor(f);
    setOverrideValue(f.value);
    setOverrideReason(f.overrideDetails?.reason || '');
    setOverrideRef(f.overrideDetails?.reference || f.reference);
  };

  const handleApplyOverride = () => {
    if (!overrideModalFactor) return;
    overrideWPSFFactor(overrideModalFactor.id, overrideValue, overrideReason, overrideRef);
    setOverrideModalFactor(null);
  };

  return (
    <div className="space-y-6">
      <SectionHeader title="Standards & Design Basis" subtitle="Review and manage applicable design standards and controlled prototype factors" icon={<Settings className="w-6 h-6 text-blue-600" />} />

      <EduCard title="Engineering Principle & Controlled Factors" icon="warning">
        Never claim that a particular numerical consumption rate comes directly from a British Standard unless verified. Values shown here as "Engineering Assumption" are preliminary design allowances, not mandatory standard requirements. The Controlled Factor System allows transparent adjustment of baseline values with documented justifications.
      </EduCard>

      {/* 34 WPSF FACTORS REGISTER */}
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Controlled Prototype Factor System (34 Factors)</h3>
            <p className="text-xs text-slate-500">Traceable engineering parameters with revision control, default baselines, and justification logging</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-700">
              34 Total Factors
            </span>
            {overriddenCount > 0 ? (
              <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800">
                {overriddenCount} Overridden
              </span>
            ) : (
              <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                All Defaults
              </span>
            )}
            {overriddenCount > 0 && (
              <button
                onClick={resetAllWPSFFactors}
                className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-red-600 border border-red-300 rounded hover:bg-red-50 transition-colors"
              >
                <RotateCcw className="w-3 h-3" /> Reset All Overrides
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border border-slate-200 rounded-lg">
            <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">ID</th>
                <th className="py-2.5 px-3">Parameter Name</th>
                <th className="py-2.5 px-3">Default</th>
                <th className="py-2.5 px-3">Active Value</th>
                <th className="py-2.5 px-3">Unit</th>
                <th className="py-2.5 px-3">Classification</th>
                <th className="py-2.5 px-3">Standard Reference</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(project.wpsfFactors || []).map((f) => {
                const isOverridden = !!f.overrideDetails;
                return (
                  <tr key={f.id} className={`hover:bg-slate-50 ${isOverridden ? 'bg-amber-50/40' : ''}`}>
                    <td className="py-2 px-3 font-mono font-semibold text-slate-600">{f.id}</td>
                    <td className="py-2 px-3 font-medium text-slate-800">
                      <div>{f.name}</div>
                      {isOverridden && f.overrideDetails?.reason && (
                        <div className="text-[11px] text-amber-700 italic mt-0.5">Reason: {f.overrideDetails.reason}</div>
                      )}
                    </td>
                    <td className="py-2 px-3 text-slate-500">{f.defaultValue}</td>
                    <td className={`py-2 px-3 font-bold ${isOverridden ? 'text-amber-700' : 'text-slate-800'}`}>
                      {f.value}
                    </td>
                    <td className="py-2 px-3 text-slate-600">{f.unit}</td>
                    <td className="py-2 px-3">
                      <StatusBadge status={f.classification} />
                    </td>
                    <td className="py-2 px-3 text-slate-600">
                      {isOverridden && f.overrideDetails?.reference ? f.overrideDetails.reference : f.reference}
                    </td>
                    <td className="py-2 px-3">
                      {isOverridden ? (
                        <span className="inline-block px-2 py-0.5 font-bold rounded text-[11px] bg-amber-100 text-amber-800">
                          OVERRIDDEN
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 font-medium rounded text-[11px] bg-slate-100 text-slate-600">
                          DEFAULT
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenOverride(f)}
                          className="px-2 py-1 text-xs font-medium text-blue-600 border border-blue-300 rounded hover:bg-blue-50 transition-colors"
                        >
                          Override
                        </button>
                        {isOverridden && (
                          <button
                            onClick={() => resetWPSFFactor(f.id)}
                            className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
                            title="Reset to default"
                            aria-label={`Reset ${f.name} to default`}
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* OVERRIDE MODAL DIALOG */}
      {overrideModalFactor && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setOverrideModalFactor(null)}>
          <div className="bg-white rounded-lg p-6 max-w-lg w-full space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-800">Override Parameter: {overrideModalFactor.name}</h3>
                <p className="text-xs text-slate-500 font-mono">Factor ID: {overrideModalFactor.id} | Default: {overrideModalFactor.defaultValue} {overrideModalFactor.unit}</p>
              </div>
              <StatusBadge status={overrideModalFactor.classification} />
            </div>

            <div className="space-y-3">
              <NumberInput
                label={`New Value (${overrideModalFactor.unit})`}
                value={overrideValue}
                onChange={(v) => setOverrideValue(v)}
                unit={overrideModalFactor.unit}
              />
              <TextInput
                label="Engineering Justification / Reason"
                value={overrideReason}
                onChange={(v) => setOverrideReason(v)}
                placeholder="e.g., Client specific brief, local meteorological measurement, metered benchmark"
              />
              <TextInput
                label="Applicable Reference / Standard"
                value={overrideRef}
                onChange={(v) => setOverrideRef(v)}
                placeholder="e.g., BS 8558 Section 4.2 / Project Brief Rev 2"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                onClick={() => setOverrideModalFactor(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 border border-slate-300 rounded hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyOverride}
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors"
              >
                Apply Controlled Override
              </button>
            </div>
          </div>
        </div>
      )}

      <Card>
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Standards & References Register</h3>
        <DataTable
          headers={['ID', 'Standard', 'Title', 'Application', 'Section Used', 'Notes']}
          rows={project.standards.map((s) => [s.id, s.reference, s.title, s.application, s.sectionUsed, s.notes])}
        />
      </Card>
    </div>
  );
}
