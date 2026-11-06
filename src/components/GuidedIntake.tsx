import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, ClipboardList, Wrench } from 'lucide-react';
import { useProject } from '@/context/ProjectContext';

type Answers = {
  projectName: string; location: string; country: string; preparedBy: string;
  buildingType: string; floors: number; basements: number; roomsPerFloor: number; floorHeight: number;
  people: number; peopleUnknown: boolean; wc: number; basins: number; showers: number; kitchens: number; laundry: number; garden: number;
  hotWater: string; waterSource: string; pressure: string; goal: string; units: string; standard: string;
};
const KEY = 'swd-intake-draft-v1';
const initial: Answers = { projectName:'', location:'', country:'Sri Lanka', preparedBy:'', buildingType:'School', floors:1, basements:0, roomsPerFloor:0, floorHeight:3.2, people:0, peopleUnknown:true, wc:0, basins:0, showers:0, kitchens:0, laundry:0, garden:0, hotWater:'None', waterSource:'Mains water', pressure:'Unknown', goal:'Reliability', units:'Metric', standard:'Use project standard after engineer review' };
const screens = ['Project basics', 'Building & people', 'Water points', 'Water systems', 'Review'];
const styles = { field:'w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500', label:'mb-1 block text-sm font-medium text-slate-700' };

export function GuidedIntake({ onComplete, onEngineer }: { onComplete: () => void; onEngineer: () => void }) {
  const { project, setProject } = useProject();
  const [a, setA] = useState<Answers>(() => {
    try { return { ...initial, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch { return initial; }
  });
  const [step, setStep] = useState(0);
  const [engineerView, setEngineerView] = useState(false);
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(a)); } catch { /* autosave is best effort */ } }, [a]);
  const set = <K extends keyof Answers>(key: K, value: Answers[K]) => setA((v) => ({ ...v, [key]: value }));
  const field = (label: string, key: keyof Answers, type: 'text'|'number'='text', hint?: string) => <label className="block"><span className={styles.label}>{label}</span><input className={styles.field} type={type} min={type==='number'?0:undefined} value={a[key] as string|number} onChange={(e) => set(key, (type==='number'?Number(e.target.value):e.target.value) as never)} />{hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}</label>;
  const select = (label: string, key: keyof Answers, options: string[]) => <label className="block"><span className={styles.label}>{label}</span><select className={styles.field} value={a[key] as string} onChange={(e) => set(key, e.target.value as never)}>{options.map(o=><option key={o}>{o}</option>)}</select></label>;
  const apply = () => {
    const typeMap: Record<string, string> = { House:'Custom', Apartment:'Commercial', Hotel:'Commercial', Office:'Office', Hospital:'Hospital', School:'School', Mall:'Commercial', Factory:'Industrial', 'Mixed use':'Mixed Development' };
    const fixtureMap: Record<string, number> = { 'WC cistern':a.wc, 'Wash basin':a.basins, Shower:a.showers, 'Kitchen sink':a.kitchens, 'Washing machine':a.laundry, 'Hose tap':a.garden };
    const category = ['House','Apartment','Hotel'].includes(a.buildingType) ? ('Residential Users' as const) : ('Day Users' as const);
    const occupancy = project.occupancy.map((g, i) => i===0 ? { ...g, name:category==='Residential Users'?'Residents / guests':'People using the building', category, count:a.people, daysPerWeek:category==='Residential Users'?7:5, source:a.peopleUnknown?'Recommended value: occupancy unconfirmed':'Entered in guided intake' } : g);
    const sourceType = a.waterSource==='Well'?'Tube Well':a.waterSource==='Rainwater harvesting'?'Rainwater Harvesting':a.waterSource==='Other'?'Other':'NWSDB';
    const name = a.projectName.trim() || `${a.buildingType} project`;
    const siteSource = `Intake: ${a.waterSource}; pressure ${a.pressure}; goal ${a.goal}; ${a.floors} floors, ${a.basements} basement levels; ${a.roomsPerFloor} rooms/units per floor; ${a.floorHeight} ${a.units==='Imperial'?'ft':'m'} floor height; ${a.units} preference; standard: ${a.standard}`;
    setProject(p=>({
      ...p,
      projectInfo:{...p.projectInfo, projectName:name, location:a.location || p.projectInfo.location, country:a.country || p.projectInfo.country, preparedBy:a.preparedBy || p.projectInfo.preparedBy, buildingType:a.buildingType, projectType:(typeMap[a.buildingType]||'Custom') as typeof p.projectInfo.projectType},
      occupancy,
      fixtures:p.fixtures.map(f=>({ ...f, quantity:fixtureMap[f.type] ?? f.quantity })),
      hotWater:{...p.hotWater, enabled:a.hotWater!=='None'},
      waterSources:a.waterSource==='Unknown'?p.waterSources:[...p.waterSources.filter(s=>s.id!=='INTAKE-SOURCE'), {id:'INTAKE-SOURCE', name:`${a.waterSource} (confirm capacity)`, type:sourceType as typeof p.waterSources[number]['type'], location:a.location||'Project site', status:'Existing', capacityM3Day:0, verified:false}],
      demandBasis:{...p.demandBasis, source:siteSource},
    }));
    try { localStorage.setItem(`swd-intake-profile:${name}`, JSON.stringify(a)); } catch { /* profile backup is best effort */ }
    try { localStorage.removeItem(KEY); } catch { /* no-op */ }
    onComplete();
  };
  const grid='grid gap-4 sm:grid-cols-2';
  return <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-8 sm:py-10">
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-widest text-blue-700">Smart Water Services</p><h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">Let’s set up your project</h1><p className="mt-2 max-w-2xl text-sm text-slate-600">Answer what you can. Recommended values are marked for review; nothing here certifies a design.</p></div><button onClick={onEngineer} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700"><Wrench size={16}/> Engineer mode</button></div>
      <div className="mb-5" aria-label={`Step ${step+1} of ${screens.length}`}><div className="mb-2 flex justify-between text-xs text-slate-600"><span>Step {step+1} of {screens.length}: {screens[step]}</span><span>{Math.round((step+1)/screens.length*100)}%</span></div><div className="h-2 rounded-full bg-slate-200"><div className="h-2 rounded-full bg-blue-600 transition-all" style={{width:`${(step+1)/screens.length*100}%`}}/></div></div>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        {step===0 && <div className={grid}>{field('Project name','projectName','text','If you leave this blank, we’ll use the building type.')} {field('Town or site location','location')} {field('Country','country')} {field('Who is filling this in?','preparedBy')}</div>}
        {step===1 && <><div className={grid}>{select('What kind of building?','buildingType',['House','Apartment','Hotel','Office','Hospital','School','Mall','Factory','Mixed use'])}{field('Number of floors','floors','number','Recommended starting value: 1.')} {field('Basement levels','basements','number','Use 0 if there is no basement.')} {field('Rooms or units per floor','roomsPerFloor','number','Use 0 if you do not know yet.')} {field(`Typical floor-to-floor height (${a.units==='Imperial'?'ft':'m'})`,'floorHeight','number',`Starting value: ${a.units==='Imperial'?'10.5 ft':'3.2 m'}; verify with drawings.`)}</div><div className="mt-5 rounded-xl bg-blue-50 p-4"><label className="flex items-center gap-2 text-sm font-medium text-slate-800"><input type="checkbox" checked={a.peopleUnknown} onChange={e=>set('peopleUnknown',e.target.checked)}/> I don’t know the occupancy yet</label><p className="mt-1 text-xs text-slate-600">Recommended value: 0 people until confirmed. This prevents an invented population from driving demand calculations.</p>{!a.peopleUnknown&&<div className="mt-3 max-w-sm">{field('People using or living in the building','people','number')}</div>}</div></>}
        {step===2 && <><p className="mb-4 text-sm text-slate-600">Enter counts you know. These are copied into the existing fixture schedule; peak flow still needs an independently verified design calculation.</p><div className={grid}>{field('Toilets (WC cisterns)','wc','number','Recommended value: 0 until counted.')} {field('Wash basins','basins','number')} {field('Showers','showers','number')} {field('Kitchens / kitchen sinks','kitchens','number')} {field('Laundry machines','laundry','number')} {field('Outdoor taps / garden points','garden','number')}</div></>}
        {step===3 && <div className={grid}>{select('Hot-water arrangement','hotWater',['None','Central','Per unit','Solar','Heat pump'])}{select('Main water source','waterSource',['Mains water','Well','Rainwater harvesting','Other','Unknown'])}{select('How is the incoming pressure?','pressure',['Good','Weak','Unknown'])}{select('What matters most?','goal',['Reliability','Lowest cost','Water saving','Green rating'])}{select('Preferred units','units',['Metric','Imperial'])}{select('Design standard','standard',['Use project standard after engineer review','BS EN 806 / BS 8558 / CIBSE (verify applicability)','IPC / ASPE (verify applicability)'])}<div className="sm:col-span-2 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">No legal standard is selected automatically. The design basis and pressure must be confirmed by a qualified engineer. Current calculations use metric units.</div></div>}
        {step===4 && <div className="space-y-4"><div className="flex items-start gap-3 rounded-xl bg-emerald-50 p-4"><CheckCircle2 className="mt-0.5 text-emerald-700"/><div><h2 className="font-semibold text-slate-900">Review before calculations</h2><p className="text-sm text-slate-700">Your answers will populate existing project details, occupancy, fixtures, hot-water setting, and an unverified source placeholder. You can review and edit technical values afterward.</p></div></div><dl className="grid gap-3 sm:grid-cols-2 text-sm">{Object.entries({Project:a.projectName||`${a.buildingType} project`,Site:`${a.location||'Not entered'}, ${a.country}`,Building:`${a.buildingType}, ${a.floors} floors`,Occupancy:a.peopleUnknown?'Not known — left at 0 for review':`${a.people} people`,Waterpoints:`${a.wc} toilets, ${a.basins} basins, ${a.showers} showers`,Source:`${a.waterSource} — capacity not verified`,Pressure:a.pressure,Hotwater:a.hotWater,Goal:a.goal,Units:a.units,Standard:a.standard}).map(([k,v])=><div key={k} className="rounded-lg bg-slate-50 p-3"><dt className="text-xs font-medium uppercase text-slate-500">{k}</dt><dd className="mt-1 text-slate-800">{v}</dd></div>)}</dl>{engineerView&&<div className="rounded-xl border border-slate-200 p-4 text-sm"><h3 className="mb-2 font-semibold">Engineer view — derived or assumed values</h3><ul className="list-disc space-y-1 pl-5 text-slate-700"><li>Occupancy count: {a.peopleUnknown?'0 pending confirmation':a.people}</li><li>Fixture schedule: counts entered above; no automatic fixture-unit peak-flow conversion.</li><li>Source yield: 0 m³/day until verified and entered.</li><li>Design basis: {a.standard}; calculations are stored in metric units.</li><li>Floor height, basement, rooms per floor and pressure are retained in the intake profile; they do not override unverified pump/network inputs.</li></ul></div>}<button onClick={()=>setEngineerView(v=>!v)} className="text-sm font-semibold text-blue-700 underline">{engineerView?'Hide':'Show'} Engineer view</button></div>}
        <div className="mt-7 flex items-center justify-between border-t border-slate-100 pt-5"><button disabled={step===0} onClick={()=>setStep(s=>s-1)} className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 disabled:invisible"><ArrowLeft size={16}/> Back</button>{step<4?<button onClick={()=>setStep(s=>s+1)} className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800">Next <ArrowRight size={16}/></button>:<button onClick={apply} className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800"><ClipboardList size={16}/> Create project & view results</button>}</div>
      </section><p className="mt-4 text-center text-xs text-slate-500">Preliminary design support only. Verify assumptions, authority requirements, site conditions, and manufacturer data before construction.</p>
    </div>
  </main>;
}

