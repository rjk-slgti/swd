import { useState, useMemo } from 'react';
import { useProject } from '@/context/ProjectContext';
import {
  Wand2,
  Building2,
  Briefcase,
  Hotel,
  GraduationCap,
  Hospital,
  Utensils,
  Home,
  Sparkles,
  CheckCircle2,
  X,
  Leaf,
  Check,
} from 'lucide-react';
import { BUILDING_ARCHETYPES, type BuildingArchetypeConfig } from '@/data/buildingArchetypes';
import { inferProjectFromBuildingDetails } from '@/calculations/smartInferenceEngine';

interface SmartAutoPilotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (message: string) => void;
}

export function SmartAutoPilotModal({ isOpen, onClose, onSuccess }: SmartAutoPilotModalProps) {
  const { setProject } = useProject();

  const [selectedArchetypeId, setSelectedArchetypeId] = useState<string>('commercial_office');
  const [quantity, setQuantity] = useState<number>(150);
  const [floors, setFloors] = useState<number>(5);
  const [grade, setGrade] = useState<'standard' | 'eco' | 'luxury'>('standard');
  const [enableSustainability, setEnableSustainability] = useState<boolean>(true);
  const [projectName, setProjectName] = useState<string>('');
  const [location, setLocation] = useState<string>('Kilinochchi');

  const selectedArchetype = useMemo(() => {
    return BUILDING_ARCHETYPES.find((a) => a.id === selectedArchetypeId) || BUILDING_ARCHETYPES[0];
  }, [selectedArchetypeId]);

  // Handle archetype selection and reset sensible defaults
  const handleSelectArchetype = (arch: BuildingArchetypeConfig) => {
    setSelectedArchetypeId(arch.id);
    setQuantity(arch.defaultQuantity);
    setFloors(arch.typicalFloors);
  };

  // Live quick estimation for preview
  const previewEstimates = useMemo(() => {
    const gradeMult = grade === 'eco' ? 0.85 : grade === 'luxury' ? 1.25 : 1.0;
    const estOccupants = Math.round(quantity * selectedArchetype.occupantsPerUnit);
    const estDailyDemandM3 = (estOccupants * selectedArchetype.perCapitaWaterDemandLpd * gradeMult) / 1000;
    const estStorageM3 = estDailyDemandM3 * selectedArchetype.storageDurationDays;
    const estStaticHeadM = floors * 3.5;
    const estTdhM = estStaticHeadM + 15 + Math.round(floors * 1.5);

    return {
      occupants: estOccupants,
      dailyM3: estDailyDemandM3.toFixed(1),
      storageM3: estStorageM3.toFixed(1),
      tdhM: estTdhM.toFixed(0),
    };
  }, [selectedArchetype, quantity, floors, grade]);

  const handleGenerate = () => {
    const newProject = inferProjectFromBuildingDetails({
      archetypeId: selectedArchetypeId,
      quantity,
      floors,
      standardGrade: grade,
      enableSustainability,
      projectName: projectName.trim() || undefined,
      location: location.trim() || undefined,
    });

    setProject(newProject);
    onClose();

    if (onSuccess) {
      onSuccess(
        `✨ Complete MEP design auto-generated for ${newProject.projectInfo.projectName}! All 19 modules & real-time telemetry have been calibrated.`
      );
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Hero Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 p-5 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-400 to-indigo-400 flex items-center justify-center text-slate-950 shadow-md">
              <Wand2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Smart Auto-Pilot
                </span>
                <span className="text-xs text-indigo-200 font-medium hidden sm:inline">
                  Non-Technical Ordinary Mode
                </span>
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight mt-0.5">
                Auto-Calculate Complete Water Services Design
              </h2>
            </div>
          </div>
          <p className="text-xs text-slate-300 mt-2 leading-relaxed max-w-2xl">
            No complex MEP formulas required. Provide 3 ordinary building details below, and our engineering rule-engine will automatically populate all 19 calculation modules, tanks, pump duties, and pipe sizes adhering to BS EN 806 & CIBSE standards.
          </p>
        </div>

        {/* Modal Form Body */}
        <div className="p-5 space-y-5 max-h-[75vh] overflow-y-auto text-slate-800">
          {/* QUESTION 1: SELECT BUILDING ARCHETYPE */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
              1. What type of building is this?
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
              {BUILDING_ARCHETYPES.map((arch) => {
                const isSelected = arch.id === selectedArchetypeId;
                const IconComponent =
                  arch.iconName === 'Briefcase'
                    ? Briefcase
                    : arch.iconName === 'Building2'
                    ? Building2
                    : arch.iconName === 'Hotel'
                    ? Hotel
                    : arch.iconName === 'GraduationCap'
                    ? GraduationCap
                    : arch.iconName === 'Hospital'
                    ? Hospital
                    : arch.iconName === 'Utensils'
                    ? Utensils
                    : Home;

                return (
                  <button
                    key={arch.id}
                    type="button"
                    onClick={() => handleSelectArchetype(arch)}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between h-24 relative ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/70 text-blue-900 ring-2 ring-blue-500/20 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <IconComponent
                        className={`w-5 h-5 ${isSelected ? 'text-blue-600' : 'text-slate-500'}`}
                      />
                      {isSelected && (
                        <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center">
                          <Check className="w-2.5 h-2.5" />
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-bold leading-tight line-clamp-1">{arch.name}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">
                        {arch.shortDescription}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* QUESTION 2: SCALE & NUMBER OF FLOORS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/80 p-4 rounded-xl border border-slate-200">
            {/* Building Scale Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700">
                  2. Approximate Scale ({selectedArchetype.unitLabel}):
                </label>
                <span className="text-sm font-bold font-mono text-blue-600 bg-blue-100/60 px-2 py-0.5 rounded">
                  {quantity.toLocaleString()}
                </span>
              </div>
              <input
                type="range"
                min={selectedArchetype.minQuantity}
                max={selectedArchetype.maxQuantity}
                step={selectedArchetype.maxQuantity > 500 ? 25 : 5}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full accent-blue-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>Min: {selectedArchetype.minQuantity}</span>
                <span>Type directly:</span>
                <span>Max: {selectedArchetype.maxQuantity}</span>
              </div>
              <input
                type="number"
                min={selectedArchetype.minQuantity}
                max={selectedArchetype.maxQuantity}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full mt-1.5 px-3 py-1.5 text-xs font-mono bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Building Height / Floors Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700">
                  3. Total Number of Floors:
                </label>
                <span className="text-sm font-bold font-mono text-indigo-600 bg-indigo-100/60 px-2 py-0.5 rounded">
                  {floors} {floors === 1 ? 'Floor' : 'Floors'} (~{(floors * 3.5).toFixed(0)}m)
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={25}
                step={1}
                value={floors}
                onChange={(e) => setFloors(Number(e.target.value))}
                className="w-full accent-indigo-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>1 Floor (Ground)</span>
                <span>Governs pump pressure & head</span>
                <span>25 Floors (Tower)</span>
              </div>
              <div className="flex gap-1.5 mt-2">
                {[1, 2, 4, 6, 10, 15].map((fl) => (
                  <button
                    key={fl}
                    type="button"
                    onClick={() => setFloors(fl)}
                    className={`flex-1 py-1 text-[11px] font-semibold rounded border transition-colors ${
                      floors === fl
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {fl}F
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* QUESTION 4: STANDARD / SPECIFICATION GRADE */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
              4. Specification & Water-Saving Standard:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setGrade('eco')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  grade === 'eco'
                    ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 mb-1">
                  <Leaf className="w-4 h-4" /> Eco / Water-Efficient
                </div>
                <p className="text-[11px] text-slate-500 leading-normal">
                  Low-flow fixtures (4.5L WC, aerators), -15% demand reduction, green credits.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setGrade('standard')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  grade === 'standard'
                    ? 'border-blue-600 bg-blue-50/70 text-blue-950 ring-2 ring-blue-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-blue-700 mb-1">
                  <CheckCircle2 className="w-4 h-4" /> Standard (Recommended)
                </div>
                <p className="text-[11px] text-slate-500 leading-normal">
                  Standard CIBSE Guide G & BS EN 806 code baseline. Best for most projects.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setGrade('luxury')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  grade === 'luxury'
                    ? 'border-amber-600 bg-amber-50/70 text-amber-950 ring-2 ring-amber-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 mb-1">
                  <Sparkles className="w-4 h-4" /> Premium / Luxury
                </div>
                <p className="text-[11px] text-slate-500 leading-normal">
                  Higher flow allowances, rain showers, baths, +25% expanded reserve buffers.
                </p>
              </button>
            </div>
          </div>

          {/* PROJECT IDENTITY & SUSTAINABILITY TOGGLE */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Project Name (Optional):
              </label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder={`${selectedArchetype.name}`}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Location (Optional):
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Kilinochchi"
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center sm:pt-4">
              <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-700 font-medium">
                <input
                  type="checkbox"
                  checked={enableSustainability}
                  onChange={(e) => setEnableSustainability(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <span>Auto-size Rainwater & Greywater Reuse</span>
              </label>
            </div>
          </div>

          {/* LIVE INSTANT ENGINEERING PREVIEW HUD */}
          <div className="bg-slate-900 text-white p-3.5 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Auto-Inferred Engineering Preview
              </span>
              <span className="text-[9px] font-mono bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded border border-emerald-800/60">
                100% CODE COMPLIANT
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              <div className="bg-slate-800/80 p-2 rounded-lg">
                <div className="text-[10px] text-slate-400">Total Population</div>
                <div className="text-sm font-bold text-amber-300 font-mono mt-0.5">
                  {previewEstimates.occupants} <span className="text-[10px] font-normal text-slate-400">people</span>
                </div>
              </div>

              <div className="bg-slate-800/80 p-2 rounded-lg">
                <div className="text-[10px] text-slate-400">Daily Demand (ADD)</div>
                <div className="text-sm font-bold text-cyan-300 font-mono mt-0.5">
                  {previewEstimates.dailyM3} <span className="text-[10px] font-normal text-slate-400">m³/day</span>
                </div>
              </div>

              <div className="bg-slate-800/80 p-2 rounded-lg">
                <div className="text-[10px] text-slate-400">Storage Reservoir</div>
                <div className="text-sm font-bold text-blue-300 font-mono mt-0.5">
                  {previewEstimates.storageM3} <span className="text-[10px] font-normal text-slate-400">m³</span>
                </div>
              </div>

              <div className="bg-slate-800/80 p-2 rounded-lg">
                <div className="text-[10px] text-slate-400">Booster Head (TDH)</div>
                <div className="text-sm font-bold text-emerald-300 font-mono mt-0.5">
                  {previewEstimates.tdhM} <span className="text-[10px] font-normal text-slate-400">meters</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Action Buttons Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <p className="text-[11px] text-slate-500 italic hidden sm:block">
            You can still fine-tune or edit any calculation step later if desired.
          </p>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 border border-slate-300 rounded-xl hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleGenerate}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 rounded-xl shadow-md hover:shadow-lg transition-all"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>✨ Auto-Configure Entire Project</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
