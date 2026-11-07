import { useProject } from '@/context/ProjectContext';
import {
  Card,
  SectionHeader,
  NumberInput,
  TextInput,
  SelectInput,
  DataTable,
  EduCard,
  StudentCalculationCard,
  VisualHydraulicGradient,
} from './ui';
import type { PipeDesign } from '@/types';
import { exportEpanetInp, findLowestLossPaths, solveTreeBranchFlows } from '@/calculations/advancedEngineering';

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
  const networkEdges = results.pipes.filter(r => r.pipe.fromNode?.trim() && r.pipe.toNode?.trim()).map(r => ({ id: r.pipe.id, label: r.pipe.label, from: r.pipe.fromNode!, to: r.pipe.toNode!, lossM: r.totalPressureLoss }));
  const criticalPaths = networkEdges.length ? findLowestLossPaths(networkEdges, networkEdges[0].from) : [];
  const networkConfig = project.advancedDesign;
  let branchFlow: ReturnType<typeof solveTreeBranchFlows> | null = null;
  let branchFlowError = '';
  try { if (networkConfig?.networkTerminalDemands.length && networkEdges.length) branchFlow = solveTreeBranchFlows(networkEdges.map(e => ({ id: e.id, from: e.from, to: e.to })), networkConfig.networkTerminalDemands, networkConfig.networkSourceNode); }
  catch (error) { branchFlowError = error instanceof Error ? error.message : 'Could not solve this branch tree.'; }
  const updateNetwork = (patch: Partial<NonNullable<typeof networkConfig>>) => setProject(current => ({ ...current, advancedDesign: { ...current.advancedDesign!, ...patch } }));

  const downloadEpanet = () => {
    const file = new Blob([exportEpanetInp(project.pipes, project.advancedDesign?.networkTerminalDemands)], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(file);
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = `${project.projectInfo.projectName || 'water-network'}-preliminary.inp`; anchor.click(); URL.revokeObjectURL(url);
  };

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
                fittingLossM={r.totalPressureLoss - r.frictionLoss}
                elevationDifferenceM={r.pipe.elevationDifference}
                residualPressureM={r.residualPressure}
                minRequiredResidualM={10}
              />
            ))}
          </div>
        </div>
      )}

      {/* Student Step-by-Step Mathematical Walkthrough */}
      {primaryPipe && primaryPipe.pipe.lossMethod !== 'Darcy-Weisbach' && (
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
        <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Pipe Reach Sizing Parameters</h3><button type="button" onClick={downloadEpanet} disabled={!project.pipes.length} className="min-h-10 rounded-lg border border-indigo-200 bg-indigo-50 px-3 text-xs font-semibold text-indigo-800 disabled:opacity-50">Export EPANET .inp skeleton</button></div>
        <p className="text-xs text-amber-800">The EPANET file is a preliminary skeleton with entered tree demands. Elevations and boundary conditions are placeholders. Mixed pipe methods export as Hazen–Williams for the file; verify the method, connectivity and all inputs before independent analysis.</p>
        {project.pipes.map((pipe, index) => (
          <Card key={pipe.id}>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              <TextInput label="Pipe / Reach Identifier" value={pipe.label} onChange={(label) => update(pipe.id, { label })} />
              <TextInput label="Pipe material (for identification)" value={pipe.material} onChange={(material) => update(pipe.id, { material })} />
              <SelectInput label="Friction method" value={pipe.lossMethod ?? 'Hazen-Williams'} onChange={(lossMethod: string) => update(pipe.id, { lossMethod: lossMethod as PipeDesign['lossMethod'] })} options={['Hazen-Williams', 'Darcy-Weisbach']} />
              <NumberInput id={`pipe-${index}-diameter`} label="Inside diameter" unit="mm" tooltip="The clear opening inside the pipe. Use the product data for the selected pipe." value={pipe.internalDiameter} onChange={(internalDiameter) => update(pipe.id, { internalDiameter })} />
              <NumberInput label="Pipe length" unit="m" tooltip="Measured length along this pipe reach." value={pipe.length} onChange={(length) => update(pipe.id, { length })} />
              <NumberInput label="Water flow (0 uses accepted peak flow)" unit="L/s" step={0.01} value={pipe.flow} onChange={(flow) => update(pipe.id, { flow })} />
              <NumberInput label="Pipe roughness coefficient (Hazen–Williams C)" unit="—" min={1} tooltip="Engineering coefficient used to estimate friction loss. Confirm it from an applicable project source; changing the material name does not change this value." value={pipe.hazenWilliamsC} onChange={(hazenWilliamsC) => update(pipe.id, { hazenWilliamsC })} status="Engineering Assumption" />
              {pipe.lossMethod === 'Darcy-Weisbach' && <><NumberInput label="Absolute roughness" unit="mm" min={0} step={0.001} value={pipe.roughnessMm ?? 0.15} onChange={(roughnessMm) => update(pipe.id, { roughnessMm })} tooltip="Enter the pipe manufacturer's or project source roughness. The default is an editable assumption." /><NumberInput label="Minor-loss coefficient K" unit="—" min={0} step={0.1} value={pipe.minorLossK ?? 0} onChange={(minorLossK) => update(pipe.id, { minorLossK })} tooltip="Sum the K values for fittings on this reach from a verified source." /></>}
              <TextInput label="From node (network path)" value={pipe.fromNode ?? ''} onChange={(fromNode) => update(pipe.id, { fromNode })} />
              <TextInput label="To node (network path)" value={pipe.toNode ?? ''} onChange={(toNode) => update(pipe.id, { toNode })} />
              <NumberInput label="Pressure head available at inlet" unit="m" tooltip="Available water pressure expressed as metres of water head." value={pipe.inletHead} onChange={(inletHead) => update(pipe.id, { inletHead })} />
              <NumberInput label="Height change (uphill is positive)" unit="m" min={-10000} tooltip="Elevation difference from the inlet to the end of this reach. Enter a negative value for a lower outlet." value={pipe.elevationDifference} onChange={(elevationDifference) => update(pipe.id, { elevationDifference })} />
              <NumberInput label="Extra head loss through fittings" unit="m" tooltip="Combined allowance for bends, valves, and other local restrictions." value={pipe.fittingLoss} onChange={(fittingLoss) => update(pipe.id, { fittingLoss })} />
              <NumberInput label="Maximum flow speed (velocity)" unit="m/s" step={0.1} tooltip="Project-selected upper limit for the calculated water speed in this reach." value={pipe.maxVelocity} onChange={(maxVelocity) => update(pipe.id, { maxVelocity })} status="User Defined" />
              <NumberInput label="Optional minimum review velocity" unit="m/s" min={0} step={0.1} tooltip="Optional project-specific low-velocity review threshold. Zero disables this screening check; set it only with an approved project basis." value={pipe.minimumVelocity ?? 0} onChange={(minimumVelocity) => update(pipe.id, { minimumVelocity })} status="User Defined" />
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
                lossMethod: 'Hazen-Williams', roughnessMm: 0.15, minorLossK: 0, fromNode: '', toNode: '',
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
          headers={['Reach Label', 'Material', 'Velocity (m/s)', 'Friction Loss (m)', 'Fitting & local loss (m)', 'Residual Head (m)', 'Hydraulic Check']}
          rows={results.pipes.map((r) => [
            r.pipe.label,
            r.pipe.material,
            r.velocity.toFixed(2),
            r.frictionLoss.toFixed(2),
            (r.totalPressureLoss - r.frictionLoss).toFixed(2),
            r.residualPressure.toFixed(2),
            r.warnings.join(' ') || 'Passes Velocity & Residual Head Criteria',
          ])}
        />
      </Card>

      {primaryPipe?.pipe.lossMethod === 'Darcy-Weisbach' && <Card><h3 className="text-sm font-semibold text-slate-800">Darcy–Weisbach method selected</h3><p className="mt-1 text-xs text-slate-700">Friction head loss is calculated as <code>f × (L/D) × v²/(2g)</code>, with a Swamee–Jain turbulent friction-factor estimate and laminar 64/Re relation. Entered K values add local losses. The Hazen–Williams walkthrough is hidden for this reach so its equations are not mistaken for the selected method.</p><p className="mt-2 text-xs">Primary reach friction loss: <strong>{primaryPipe.frictionLoss.toFixed(3)} m</strong>; local and specified fitting losses: <strong>{(primaryPipe.totalPressureLoss-primaryPipe.frictionLoss).toFixed(3)} m</strong>.</p></Card>}

      <Card>
        <h3 className="text-sm font-semibold text-slate-800 mb-2">Network path check</h3>
        <p className="text-xs text-slate-600">Enter From and To node names on each reach. The path check finds minimum head-loss paths. The optional tree flow screen sums entered terminal demands upstream; it does not solve pressure-dependent or looped networks.</p>
        {criticalPaths.length ? <DataTable headers={['Terminal node', 'Reach path', 'Accumulated head loss (m)']} rows={criticalPaths.map(path => [path.node, path.edgeIds.map(id => networkEdges.find(edge => edge.id === id)?.label ?? id).join(' → '), path.headLossM.toFixed(2)])} /> : <p className="mt-2 text-xs text-slate-500">Add connected node names to at least one reach to view paths.</p>}
        {networkConfig && <div className="mt-3 grid gap-3 md:grid-cols-2"><TextInput label="Network source node" value={networkConfig.networkSourceNode} onChange={networkSourceNode => updateNetwork({ networkSourceNode })} /><div><label htmlFor="network-terminal-demands" className="mb-1 block text-xs font-medium text-slate-700">Terminal demands (node, L/s; one per line)</label><textarea id="network-terminal-demands" rows={3} value={networkConfig.networkTerminalDemands.map(item => `${item.node}, ${item.flowLps}`).join('\n')} onChange={event => { const lines = event.target.value.split(/\r?\n/).filter(line => line.trim()); const demands = lines.map(line => { const [node, flow] = line.split(/[;,]/); return { node: node.trim(), flowLps: Number(flow) }; }); if (demands.every(item => item.node && Number.isFinite(item.flowLps) && item.flowLps >= 0)) updateNetwork({ networkTerminalDemands: demands }); }} className="w-full rounded-lg border border-slate-300 p-2 font-mono text-xs" /></div></div>}
        {branchFlow && <p className="mt-2 text-xs text-blue-800">Tree demand total: <strong>{branchFlow.totalDemandLps.toFixed(2)} L/s</strong> · {branchFlow.edgeFlows.map(item => `${networkEdges.find(edge => edge.id === item.edgeId)?.label ?? item.edgeId}: ${item.flowLps.toFixed(2)} L/s`).join(' · ')}</p>}
        {branchFlowError && <p role="alert" className="mt-2 text-xs text-amber-800">{branchFlowError}</p>}
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
