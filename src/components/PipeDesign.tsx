import { useProject } from '@/context/ProjectContext';
import {
  Card,
  SectionHeader,
  NumberInput,
  TextInput,
  DataTable,
  EduCard,
  StudentCalculationCard,
  VisualHydraulicGradient,
} from './ui';
import type { PipeDesign } from '@/types';

export function StepPipeDesign() {
  const { project, setProject, results } = useProject();

  const update = (id: string, patch: Partial<PipeDesign>) =>
    setProject((p) => ({
      ...p,
      pipes: p.pipes.map((pipe) => (pipe.id === id ? { ...pipe, ...patch } : pipe)),
    }));

  const getPipeFlow = (pipe: PipeDesign) =>
    pipe.flow > 0 ? pipe.flow : (results.peakFlow?.probablePeakFlow || 0);

  const primaryPipe = results.pipes[0];
  const primaryFlow = primaryPipe ? getPipeFlow(primaryPipe.pipe) : 0;

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Pipework Design & Hydraulic Gradient"
        subtitle="Hazen-Williams friction loss • Velocity safety limits • Energy & Hydraulic Grade Line (HGL)"
      />

      <EduCard title="Hydraulic Principles & Energy Conservation" icon="how" defaultOpen>
        <p>
          <strong>Hazen–Williams Equation:</strong>{' '}
          <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-xs">
            h_f = 10.67 × L × Q^1.852 / (C^1.852 × D^4.87)
          </code>
          , where flow <em>Q</em> is in m³/s, pipe length <em>L</em> is in metres, internal diameter <em>D</em> is in metres, and <em>C</em> is the roughness coefficient.
        </p>
        <p className="mt-1">
          <strong>Residual Head Equation:</strong>{' '}
          <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-xs">
            H_residual = H_inlet - Δz - h_f - h_fitting
          </code>
          . A positive elevation rise represents uphill pumping/flow; enter a negative value for gravity descent.
        </p>
        <p className="mt-1 text-slate-500">
          This single-reach model simulates the primary critical distribution branch. Recommended velocities: 0.8 m/s (self-cleansing) to 1.5 m/s (noise/water hammer prevention).
        </p>
      </EduCard>

      {/* Graphical HGL Simulation for Reaches */}
      {results.pipes.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <span>Hydraulic Grade Line (HGL) Visual Simulations</span>
          </h3>
          <div className="grid grid-cols-1 gap-4">
            {results.pipes.map((r) => (
              <VisualHydraulicGradient
                key={r.pipe.id}
                pipeLabel={r.pipe.label}
                material={r.pipe.material}
                diameterMm={r.pipe.internalDiameter}
                lengthM={r.pipe.length}
                flowLps={getPipeFlow(r.pipe)}
                velocity={r.velocity}
                inletHeadM={r.pipe.inletHead}
                frictionLossM={r.frictionLoss}
                fittingLossM={r.pipe.fittingLoss}
                elevationDifferenceM={r.pipe.elevationDifference}
                residualPressureM={r.residualPressure}
                minRequiredResidualM={10}
              />
            ))}
          </div>
        </div>
      )}

      {/* Student Step-by-Step Mathematical Walkthrough */}
      {primaryPipe && (
        <StudentCalculationCard
          title="Student Pedagogical Walkthrough: Hazen-Williams Hydraulic Sizing"
          standardRef="BS EN 806-3 / CIBSE Guide G / EPA EPANET"
          governingFormula="h_f = 10.67 × [L × Q^1.852] / [C^1.852 × D^4.87]   |   v = 4Q / (π × D²)"
          formulaVariables={[
            { symbol: 'Q', meaning: 'Design Flow Rate', unit: 'L/s', value: primaryFlow.toFixed(2) },
            { symbol: 'D', meaning: 'Internal Pipe Diameter', unit: 'mm', value: primaryPipe.pipe.internalDiameter },
            { symbol: 'L', meaning: 'Pipe Reach Length', unit: 'm', value: primaryPipe.pipe.length },
            { symbol: 'C', meaning: 'Roughness Coefficient', unit: '—', value: primaryPipe.pipe.hazenWilliamsC },
            { symbol: 'v', meaning: 'Flow Velocity', unit: 'm/s', value: primaryPipe.velocity.toFixed(2) },
            { symbol: 'h_f', meaning: 'Friction Head Loss', unit: 'm', value: primaryPipe.frictionLoss.toFixed(2) },
            { symbol: 'H_res', meaning: 'Final Residual Head', unit: 'm', value: primaryPipe.residualPressure.toFixed(2) },
          ]}
          finalResult={{
            label: 'Terminal Residual Head',
            value: primaryPipe.residualPressure.toFixed(2),
            unit: 'm head',
            status: primaryPipe.residualPressure >= 10 ? 'ADEQUATE' : 'MARGINAL',
          }}
          steps={[
            {
              stepNumber: 1,
              title: 'Flow & Diameter SI Unit Normalization',
              description: 'Convert engineering project inputs into coherent SI base units (m³/s and m) for empirical formula stability.',
              formula: 'Q (m³/s) = Q (L/s) / 1000   |   D (m) = D (mm) / 1000',
              mathSubstitution: `Q = ${primaryFlow.toFixed(2)} / 1000 = ${(primaryFlow / 1000).toFixed(5)} m³/s  |  D = ${primaryPipe.pipe.internalDiameter} / 1000 = ${(primaryPipe.pipe.internalDiameter / 1000).toFixed(4)} m`,
              intermediateResult: (primaryFlow / 1000).toFixed(5),
              unit: 'm³/s',
            },
            {
              stepNumber: 2,
              title: 'Continuity Flow Velocity Verification',
              description: 'Evaluate cross-sectional velocity v = Q / A. Velocity should remain between 0.8 m/s (prevents sediment deposition) and 1.5–2.0 m/s (prevents pipe scour, cavitation noise, and acoustic disturbance).',
              formula: 'v = (4 × Q) / (π × D²)',
              mathSubstitution: `v = (4 × ${(primaryFlow / 1000).toFixed(5)}) / (π × ${(primaryPipe.pipe.internalDiameter / 1000).toFixed(4)}²)`,
              intermediateResult: primaryPipe.velocity.toFixed(2),
              unit: 'm/s',
              notes: primaryPipe.velocity > 2.0 ? 'Velocity exceeds 2.0 m/s: risk of water hammer and noise' : 'Velocity within comfortable hydraulic limits',
            },
            {
              stepNumber: 3,
              title: 'Hazen-Williams Pipe Friction Loss Calculation',
              description: 'Apply the empirical Hazen-Williams equation to compute continuous skin friction along the pipe wall.',
              formula: 'h_f = 10.67 × L × Q^1.852 / (C^1.852 × D^4.87)',
              mathSubstitution: `h_f = 10.67 × ${primaryPipe.pipe.length} × (${(primaryFlow / 1000).toFixed(5)})^1.852 / (${primaryPipe.pipe.hazenWilliamsC}^1.852 × ${(primaryPipe.pipe.internalDiameter / 1000).toFixed(4)}^4.87)`,
              intermediateResult: primaryPipe.frictionLoss.toFixed(2),
              unit: 'm head',
            },
            {
              stepNumber: 4,
              title: 'Energy Conservation & Terminal Residual Head Balance',
              description: 'Calculate available dynamic pressure at terminal delivery fixture by subtracting static elevation change, skin friction, and local fitting losses.',
              formula: 'H_residual = H_inlet - Δz - h_f - h_fitting',
              mathSubstitution: `H_res = ${primaryPipe.pipe.inletHead.toFixed(1)}m - (${primaryPipe.pipe.elevationDifference.toFixed(1)}m) - ${primaryPipe.frictionLoss.toFixed(2)}m - ${primaryPipe.pipe.fittingLoss.toFixed(2)}m`,
              intermediateResult: primaryPipe.residualPressure.toFixed(2),
              unit: 'm head',
              notes: primaryPipe.residualPressure >= 10 ? 'Residual head ≥ 10.0 m (1.0 bar): satisfies standard plumbing fixture delivery' : 'Residual head < 10.0 m: terminal booster pump or larger pipe required',
            },
          ]}
          engineeringRuleOfThumb="Diameter exponent is D^4.87! A slight increase in internal diameter from DN25 to DN32 (+28% diameter) reduces friction head loss by over 70%. Never undersize distribution mains; the minor initial pipe cost saves decades of pumping energy!"
        />
      )}

      {/* Configuration Cards */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
          Pipe Reach Sizing Parameters
        </h3>
        {project.pipes.map((pipe) => (
          <Card key={pipe.id}>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              <TextInput label="Pipe / Reach Identifier" value={pipe.label} onChange={(label) => update(pipe.id, { label })} />
              <TextInput label="Material Specification" value={pipe.material} onChange={(material) => update(pipe.id, { material })} />
              <NumberInput label="Internal Diameter (ID)" unit="mm" value={pipe.internalDiameter} onChange={(internalDiameter) => update(pipe.id, { internalDiameter })} />
              <NumberInput label="Reach Length" unit="m" value={pipe.length} onChange={(length) => update(pipe.id, { length })} />
              <NumberInput label="Flow (0 uses confirmed peak)" unit="L/s" step={0.01} value={pipe.flow} onChange={(flow) => update(pipe.id, { flow })} />
              <NumberInput label="Hazen–Williams C Factor" unit="—" min={1} value={pipe.hazenWilliamsC} onChange={(hazenWilliamsC) => update(pipe.id, { hazenWilliamsC })} status="Engineering Assumption" />
              <NumberInput label="Inlet Available Head" unit="m" value={pipe.inletHead} onChange={(inletHead) => update(pipe.id, { inletHead })} />
              <NumberInput label="Elevation Rise (Δz)" unit="m" min={-10000} value={pipe.elevationDifference} onChange={(elevationDifference) => update(pipe.id, { elevationDifference })} />
              <NumberInput label="Fitting Equivalent Loss" unit="m" value={pipe.fittingLoss} onChange={(fittingLoss) => update(pipe.id, { fittingLoss })} />
              <NumberInput label="Max Velocity Criterion" unit="m/s" step={0.1} value={pipe.maxVelocity} onChange={(maxVelocity) => update(pipe.id, { maxVelocity })} status="User Defined" />
              <div className="lg:col-span-2">
                <TextInput label="Design Basis / Standard Source" value={pipe.source} onChange={(source) => update(pipe.id, { source })} />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
              <button
                className="text-xs font-semibold text-red-600 hover:text-red-800 transition-colors"
                onClick={() => setProject((p) => ({ ...p, pipes: p.pipes.filter((item) => item.id !== pipe.id) }))}
              >
                Remove Reach
              </button>
            </div>
          </Card>
        ))}
      </div>

      <button
        className="rounded-lg bg-blue-600 text-white font-medium text-sm px-4 py-2 hover:bg-blue-700 transition-colors shadow-xs"
        onClick={() =>
          setProject((p) => ({
            ...p,
            pipes: [
              ...p.pipes,
              {
                id: crypto.randomUUID(),
                label: `Reach ${p.pipes.length + 1}`,
                material: 'uPVC Class E',
                internalDiameter: 50,
                length: 15,
                flow: 0,
                elevationDifference: 0,
                fittingLoss: 0.5,
                inletHead: 25,
                hazenWilliamsC: 140,
                maxVelocity: 2,
                source: 'Preliminary engineering allowance; verify material and pressure data',
              },
            ],
          }))
        }
      >
        + Add Pipe Reach
      </button>

      {/* Hydraulic Summary Table */}
      <Card>
        <h3 className="text-sm font-semibold text-slate-800 mb-3">Hydraulic Reach Summary Table</h3>
        <DataTable
          headers={['Reach Label', 'Material', 'Velocity (m/s)', 'Friction Loss (m)', 'Fitting Loss (m)', 'Residual Head (m)', 'Hydraulic Check']}
          rows={results.pipes.map((r) => [
            r.pipe.label,
            r.pipe.material,
            r.velocity.toFixed(2),
            r.frictionLoss.toFixed(2),
            r.pipe.fittingLoss.toFixed(2),
            r.residualPressure.toFixed(2),
            r.warnings.join(' ') || 'Passes Velocity & Residual Head Criteria',
          ])}
        />
      </Card>

      {/* Critical Index Fixture Assessment */}
      {results.criticalFixture && (
        <Card>
          <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Index Fixture Hydraulic Assessment
              </span>
              <h3 className="text-sm font-bold text-slate-800">
                Most Hydraulically Remote Fixture: {results.criticalFixture.fixtureLabel}
              </h3>
            </div>
            <span
              className={`px-2.5 py-0.5 rounded text-xs font-bold ${
                results.criticalFixture.status === 'ADEQUATE'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {results.criticalFixture.status}
            </span>
          </div>
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
              <span
                className={`font-bold ${
                  results.criticalFixture.calculatedResidualPressureM >= results.criticalFixture.requiredPressureM
                    ? 'text-emerald-700'
                    : 'text-red-700'
                }`}
              >
                {results.criticalFixture.calculatedResidualPressureM.toFixed(2)} m
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Compliance Status</span>
              <span className="font-bold text-slate-800">{results.criticalFixture.status}</span>
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-600 bg-blue-50/60 p-2.5 rounded border border-blue-100">
            <strong>Recommended Engineering Action:</strong> {results.criticalFixture.recommendedAction}
          </p>
        </Card>
      )}
    </div>
  );
}
