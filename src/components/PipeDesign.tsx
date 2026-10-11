import { useProject } from '@/context/ProjectContext';
import { Card, SectionHeader, NumberInput, TextInput, DataTable, EduCard } from './ui';
import type { PipeDesign } from '@/types';

export function StepPipeDesign() {
  const { project, setProject, results } = useProject();
  const update = (id: string, patch: Partial<PipeDesign>) => setProject(p => ({ ...p, pipes: p.pipes.map(pipe => pipe.id === id ? { ...pipe, ...patch } : pipe) }));
  return <div className="space-y-6">
    <SectionHeader title="Pipework Design" subtitle="Single pipe reach • SI units • preliminary hydraulic check" />
    <EduCard title="How is this calculated?" icon="how" defaultOpen>
      <p>Velocity = Q / area. Hazen–Williams head loss = 10.67 × L × Q¹·⁸⁵² / (C¹·⁸⁵² × D⁴·⁸⁷), using Q in m³/s and D in metres. Inputs are converted from L/s and mm.</p>
      <p>Residual head = inlet head − elevation rise − friction − fitting losses. Enter a negative elevation rise for a descent. C and the velocity limit are editable project assumptions, not standard requirements. This single-reach model does not solve a branched network.</p>
      <a className="underline" href="https://www.epa.gov/water-research/epanet" target="_blank" rel="noreferrer">Method context: EPA EPANET</a>
    </EduCard>
    {project.pipes.map(pipe => <Card key={pipe.id}>
      <div className="grid md:grid-cols-2 gap-4">
        <TextInput label="Pipe / reach" value={pipe.label} onChange={label => update(pipe.id, { label })} />
        <TextInput label="Material" value={pipe.material} onChange={material => update(pipe.id, { material })} />
        <NumberInput label="Internal diameter" unit="mm" value={pipe.internalDiameter} onChange={internalDiameter => update(pipe.id, { internalDiameter })} />
        <NumberInput label="Length" unit="m" value={pipe.length} onChange={length => update(pipe.id, { length })} />
        <NumberInput label="Flow (0 uses confirmed peak)" unit="L/s" step={0.01} value={pipe.flow} onChange={flow => update(pipe.id, { flow })} />
        <NumberInput label="Hazen–Williams C" unit="—" min={1} value={pipe.hazenWilliamsC} onChange={hazenWilliamsC => update(pipe.id, { hazenWilliamsC })} status="Engineering Assumption" />
        <NumberInput label="Inlet pressure head" unit="m" value={pipe.inletHead} onChange={inletHead => update(pipe.id, { inletHead })} />
        <NumberInput label="Elevation rise" unit="m" min={-10000} value={pipe.elevationDifference} onChange={elevationDifference => update(pipe.id, { elevationDifference })} />
        <NumberInput label="Fitting losses" unit="m" value={pipe.fittingLoss} onChange={fittingLoss => update(pipe.id, { fittingLoss })} />
        <NumberInput label="Maximum velocity criterion" unit="m/s" step={0.1} value={pipe.maxVelocity} onChange={maxVelocity => update(pipe.id, { maxVelocity })} status="User Defined" />
        <TextInput label="Design basis / source" value={pipe.source} onChange={source => update(pipe.id, { source })} />
      </div>
      <button className="mt-4 text-red-700 underline" onClick={() => setProject(p => ({ ...p, pipes: p.pipes.filter(item => item.id !== pipe.id) }))}>Remove pipe</button>
    </Card>)}
    <button className="rounded bg-blue-600 text-white px-4 py-2 hover:bg-blue-700 transition-colors" onClick={() => setProject(p => ({ ...p, pipes: [...p.pipes, { id: crypto.randomUUID(), label: 'New reach', material: 'uPVC', internalDiameter: 50, length: 10, flow: 0, elevationDifference: 0, fittingLoss: 0, inletHead: 0, hazenWilliamsC: 140, maxVelocity: 2, source: 'Preliminary engineering allowance; verify material and pressure data' }] }))}>+ Add pipe reach</button>
    <Card><DataTable headers={['Reach', 'Velocity m/s', 'Friction m', 'Residual head m', 'Review']} rows={results.pipes.map(r => [r.pipe.label, r.velocity.toFixed(2), r.frictionLoss.toFixed(2), r.residualPressure.toFixed(2), r.warnings.join(' ') || 'Meets entered criteria'])} /></Card>

    {results.criticalFixture && (
      <Card>
        <h3 className="text-sm font-semibold text-slate-800 mb-2">Critical Index Fixture Hydraulic Quality Assurance</h3>
        <div className="grid md:grid-cols-4 gap-4 p-3 bg-slate-50 rounded-lg text-xs">
          <div>
            <span className="text-slate-500 block">Critical Reach Node</span>
            <span className="font-bold text-slate-800">{results.criticalFixture.fixtureLabel}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Required Fixture Head</span>
            <span className="font-bold text-slate-800">{results.criticalFixture.requiredPressureM.toFixed(1)} m (1.0 bar)</span>
          </div>
          <div>
            <span className="text-slate-500 block">Calculated Residual Head</span>
            <span className={`font-bold ${results.criticalFixture.calculatedResidualPressureM >= results.criticalFixture.requiredPressureM ? 'text-green-700' : 'text-red-700'}`}>
              {results.criticalFixture.calculatedResidualPressureM.toFixed(2)} m
            </span>
          </div>
          <div>
            <span className="text-slate-500 block">Compliance Status</span>
            <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${results.criticalFixture.status === 'ADEQUATE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {results.criticalFixture.status}
            </span>
          </div>
        </div>
        <p className="mt-2 text-xs text-slate-600">
          <strong>Recommended Action:</strong> {results.criticalFixture.recommendedAction}
        </p>
      </Card>
    )}
  </div>;
}
