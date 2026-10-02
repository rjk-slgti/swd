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

} from '@/components/ui';
import {
  Users, Droplets, FlaskConical, Warehouse, Fuel,
  Trash2, CloudRain, Recycle, Flame, Leaf,
  Calculator, ClipboardCheck, FileText, Settings, LayoutDashboard,
} from 'lucide-react';
import type { OccupancyGroup, WorkshopProcess, Fixture, TankDimension } from '@/types';

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

  const updateFixture = (id: string, qty: number) => {
    setProject((p) => ({
      ...p,
      fixtures: p.fixtures.map((f) => (f.id === id ? { ...f, quantity: qty } : f)),
      peakDesign: { ...p.peakDesign, verified: false },
    }));
  };

  const addFixture = () => {
    const newFx: Fixture = {
      id: `FX-${Date.now()}`,
      type: 'Custom Fixture',
      quantity: 0,
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <ResultCard label="Total Loading Units" value={results.peakFlow.totalFixtureUnits} unit="LU" color="slate" />
          <ResultCard label="Peak Flow" value={results.peakFlow.probablePeakFlow} unit="L/s" color="blue" formula={results.peakFlow.formula} substitution={results.peakFlow.substitution} />
          <ResultCard label="Peak Flow" value={results.peakFlow.peakFlowLpm} unit="L/min" color="cyan" />
          <ResultCard label="Peak Flow" value={results.peakFlow.peakFlowM3h} unit="m³/h" color="green" />
        </div>
      )}

      <Card>
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Fixture Schedule</h3>
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
        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
          {project.fixtures.map((f) => (
            <div key={f.id} className="flex items-center gap-2">
              <NumberInput label={f.type} value={f.quantity} onChange={(v) => updateFixture(f.id, v)} unit="qty" />
            </div>
          ))}
        </div>
        <button onClick={addFixture} className="mt-3 px-4 py-2 text-sm font-medium text-blue-600 border border-blue-300 rounded-md hover:bg-blue-50">+ Add Custom Fixture</button>
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

          {/* TANK DIMENSIONS */}
          <Card>
            <h3 className="text-sm font-semibold text-slate-700 mb-4">Tank Dimensions</h3>
            {results.tankDimensions.map((td, i) => (
              <div key={i} className="grid grid-cols-1 md:grid-cols-8 gap-3 items-end p-3 bg-slate-50 rounded-lg mb-3">
                <TextInput label="Label" value={td.tank.label} onChange={(v) => setProject((p) => ({ ...p, tankDimensions: p.tankDimensions.map((t, j) => j === i ? { ...t, label: v } : t) }))} />
                <SelectInput label="Shape" value={td.tank.shape} onChange={(v) => setProject((p) => ({ ...p, tankDimensions: p.tankDimensions.map((t, j) => j === i ? { ...t, shape: v as 'Rectangular' | 'Cylindrical' } : t) }))} options={['Rectangular', 'Cylindrical']} />
                <NumberInput label="Length / Dia" value={td.tank.length} onChange={(v) => setProject((p) => ({ ...p, tankDimensions: p.tankDimensions.map((t, j) => j === i ? { ...t, length: v } : t) }))} unit="m" />
                <NumberInput label="Width" value={td.tank.width} onChange={(v) => setProject((p) => ({ ...p, tankDimensions: p.tankDimensions.map((t, j) => j === i ? { ...t, width: v } : t) }))} unit="m" />
                <NumberInput label="Eff. Depth" value={td.tank.effectiveDepth} onChange={(v) => setProject((p) => ({ ...p, tankDimensions: p.tankDimensions.map((t, j) => j === i ? { ...t, effectiveDepth: v } : t) }))} unit="m" />
                <NumberInput label="Freeboard" value={td.tank.freeboard} onChange={(v) => setProject((p) => ({ ...p, tankDimensions: p.tankDimensions.map((t, j) => j === i ? { ...t, freeboard: v } : t) }))} unit="m" />
                <div>
                  <div className="text-xs text-slate-500">Eff. Volume</div>
                  <div className="text-lg font-bold text-slate-700">{td.effectiveVolume} m³</div>
                </div>
                <div><div className="text-xs text-slate-500">Status</div><StatusIndicator status={td.status} /></div>
              </div>
            ))}
            <button onClick={() => setProject((p) => ({ ...p, tankDimensions: [...p.tankDimensions, { id: `TD-${Date.now()}`, label: 'New Tank', tankType: 'Underground', shape: 'Rectangular', length: 5, width: 3, effectiveDepth: 2, freeboard: 0.3, requiredCapacity: 0 } as TankDimension] }))} className="px-4 py-2 text-sm font-medium text-blue-600 border border-blue-300 rounded-md hover:bg-blue-50">+ Add Tank</button>
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
        </>
      )}
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
      <SectionHeader step={14} title="Design Review" subtitle="Review warnings, assumptions, and overall design status" icon={<ClipboardCheck className="w-6 h-6 text-blue-600" />} />

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

      {results.warnings.length > 0 && (
        <Card>
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Warnings & Alerts</h3>
          <div className="space-y-2">
            {results.warnings.map((w) => (
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

export function Dashboard() {
  const { project, results, setProject } = useProject();

  return (
    <div className="space-y-6">
      <SectionHeader title="Dashboard" subtitle={`${project.projectInfo.projectName} — ${project.projectInfo.location}`} icon={<LayoutDashboard className="w-6 h-6 text-blue-600" />} />

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
  const { project } = useProject();

  return (
    <div className="space-y-6">
      <SectionHeader title="Standards & Design Basis" subtitle="Review and manage applicable design standards" icon={<Settings className="w-6 h-6 text-blue-600" />} />

      <EduCard title="Engineering Principle" icon="warning">
        Never claim that a particular numerical consumption rate comes directly from a British Standard unless verified. Values shown here as "Engineering Assumption" are preliminary design allowances, not mandatory standard requirements.
      </EduCard>

      <Card>
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Standards & References Register</h3>
        <DataTable
          headers={['ID', 'Standard', 'Title', 'Application', 'Section Used', 'Notes']}
          rows={project.standards.map((s) => [s.id, s.reference, s.title, s.application, s.sectionUsed, s.notes])}
        />
      </Card>

      <Card>
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Design Factor Database</h3>
        <DataTable
          headers={['Factor', 'Value', 'Unit', 'Source', 'Classification']}
          rows={project.occupancy.filter((g) => g.count > 0).map((g) => [
            `${g.name} rate`, g.consumptionFactor, g.unit, g.source, g.classification,
          ])}
          statusColumn={4}
        />
      </Card>
    </div>
  );
}
