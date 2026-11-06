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

      <Card>
        <div className="flex items-start justify-between gap-4">
          <div><h3 className="text-sm font-semibold text-slate-700">Department demand schedule</h3><p className="mt-1 text-xs text-slate-500">Use this schedule for department-level headcounts. Enabling it replaces the general occupancy schedule in demand calculations.</p></div>
          <ToggleInput label="Calculate by department" checked={project.departmentDemand.enabled} onChange={(enabled) => setProject(p => ({ ...p, departmentDemand: { ...p.departmentDemand, enabled } }))} />
        </div>
        {project.departmentDemand.enabled && <div className="mt-4 space-y-2">{project.departmentDemand.departments.map((d, i) => <div key={d.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end rounded-lg bg-slate-50 p-3">
          <div className="md:col-span-5"><TextInput label="Department" value={d.name} onChange={name => setProject(p => ({ ...p, departmentDemand: { ...p.departmentDemand, departments: p.departmentDemand.departments.map((item, j) => j === i ? { ...item, name } : item) } }))} /></div>
          <div className="md:col-span-2"><NumberInput label="People" value={d.population} onChange={population => setProject(p => ({ ...p, departmentDemand: { ...p.departmentDemand, departments: p.departmentDemand.departments.map((item, j) => j === i ? { ...item, population } : item) } }))} unit="persons" /></div>
          <div className="md:col-span-2"><NumberInput label="Use per person" value={d.rateLPerPersonDay} onChange={rateLPerPersonDay => setProject(p => ({ ...p, departmentDemand: { ...p.departmentDemand, departments: p.departmentDemand.departments.map((item, j) => j === i ? { ...item, rateLPerPersonDay } : item) } }))} unit="L/person/operating day" /></div>
          <div className="md:col-span-2"><NumberInput label="Operating days" value={d.operatingDaysPerWeek} max={7} onChange={operatingDaysPerWeek => setProject(p => ({ ...p, departmentDemand: { ...p.departmentDemand, departments: p.departmentDemand.departments.map((item, j) => j === i ? { ...item, operatingDaysPerWeek } : item) } }))} unit="days/week" /></div>
          <div className="md:col-span-1 text-right text-sm font-semibold text-blue-700">{(d.population * d.rateLPerPersonDay * d.operatingDaysPerWeek / 7 / 1000).toFixed(2)} m³/day</div>
        </div>)}<p className="text-xs text-slate-500">Rates are project inputs, not statutory defaults. Department average demand = people × litres/person/operating day × operating days/week ÷ 7.</p></div>}
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ResultCard label="Total Population" value={results.totalPopulation} unit="persons" color="blue" />
        <ResultCard label="Average Daily Demand" value={(results.occupancy.reduce((s, r) => s + r.dailyDemand, 0) / 1000).toFixed(2)} unit="m³/day" color="cyan" />
        <ResultCard label={project.departmentDemand.enabled ? 'Departments' : 'Occupancy Groups'} value={project.departmentDemand.enabled ? project.departmentDemand.departments.length : project.occupancy.length} unit={project.departmentDemand.enabled ? 'departments' : 'groups'} color="slate" />
      </div>

      <EduCard title="How is this calculated?" icon="how">
        <p><strong>Formula:</strong> Average calendar-day demand = people × operating-day rate × operating days/week ÷ 7.</p>
        <p className="mt-1">This converts weekday attendance into a weekly average for source and storage estimates. Check that the entered rate reflects a day when the group is present; weekend residents should use 7 operating days.</p>
      </EduCard>

      <EduCard title="What should I enter?" icon="what">
        <p>{project.departmentDemand.enabled ? 'Enter the headcount, per-person operating-day rate and working days for each department. Rates are project inputs and should be supported by measured usage or the applicable project design basis.' : 'Enter the number of people in each group (students, staff, hostel residents, visitors, etc.). Adjust the consumption factor if you have project-specific data. The default values are preliminary engineering allowances for tropical climate institutional buildings.'}</p>
      </EduCard>

      {!project.departmentDemand.enabled && <>
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
      </>}

      {!project.departmentDemand.enabled && categories.map((cat) => {
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
                      <NumberInput label="Consumption" value={g.consumptionFactor} onChange={(v) => updateGroup(g.id, 'consumptionFactor', v)} unit="L/person/operating day" />
                    </div>
                    <div className="md:col-span-2">
                      <NumberInput label="Days/Week" value={g.daysPerWeek} max={7} onChange={(v) => updateGroup(g.id, 'daysPerWeek', v)} unit="days" />
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

      {!project.departmentDemand.enabled && <button onClick={addGroup} className="px-4 py-2 text-sm font-medium text-blue-600 border border-blue-300 rounded-md hover:bg-blue-50 transition-colors">
        + Add Custom Group
      </button>}
    </div>
  );
}

// ============================================================
// STEP 3 — DOMESTIC…33395 tokens truncated…t-slate-500">Live IoT telemetry simulation & threshold supervisor (Updated {results.smartMonitoring.lastUpdated})</p>
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




















