import React, { useEffect, useRef, useState } from 'react';
import {
  Atom,
  Dna,
  FlaskConical,
  BookOpen,
  Search,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Plus,
  X
} from 'lucide-react';
import {
  fetchPubChemCompound,
  fetchProteinProfile,
  searchAstrobiologyLiterature,
  PubChemCompoundProfile,
  ProteinStructureProfile,
  LiteratureWorkItem,
  PREBIOTIC_PATHWAYS,
  QUICK_ASTROBIOLOGY_TARGETS
} from '../services/scienceService';
import { AcademicCitation, Node } from '../types';

interface BioscienceWorkbenchProps {
  isOpen: boolean;
  onClose: () => void;
  selectedNode?: Node;
  onCiteInWhitepaper: (citation: AcademicCitation) => void;
}

type BioTab = 'COMPOUNDS' | 'PROTEINS' | 'PATHWAYS' | 'LITERATURE';

const BioscienceWorkbench: React.FC<BioscienceWorkbenchProps> = ({
  isOpen,
  onClose,
  selectedNode,
  onCiteInWhitepaper
}) => {
  const [activeTab, setActiveTab] = useState<BioTab>('COMPOUNDS');
  const [cidInput, setCidInput] = useState<string>('1068');
  const [compound, setCompound] = useState<PubChemCompoundProfile | null>(null);
  const [isLoadingCompound, setIsLoadingCompound] = useState(false);

  const [uniprotInput, setUniprotInput] = useState<string>('P0DOW4');
  const [pdbInput, setPdbInput] = useState<string>('1KX5');
  const [protein, setProtein] = useState<ProteinStructureProfile | null>(null);
  const [isLoadingProtein, setIsLoadingProtein] = useState(false);

  const [litQuery, setLitQuery] = useState('astrobiology extremophile tardigrade Dsup K2-18b');
  const [litItems, setLitItems] = useState<LiteratureWorkItem[]>([]);
  const [isLoadingLit, setIsLoadingLit] = useState(false);

  const conformerCanvasRef = useRef<HTMLCanvasElement>(null);
  const proteinCanvasRef = useRef<HTMLCanvasElement>(null);

  // Sync with selected 3D node if it carries astrobiological pointers
  useEffect(() => {
    if (!isOpen) return;
    if (selectedNode?.pubchemCid) {
      setCidInput(String(selectedNode.pubchemCid));
      loadCompound(selectedNode.pubchemCid);
    } else if (!compound) {
      loadCompound(1068);
    }

    if (selectedNode?.uniprotId) {
      setUniprotInput(selectedNode.uniprotId);
      setPdbInput(selectedNode.pdbId || '');
      loadProtein(selectedNode.uniprotId, selectedNode.pdbId);
    } else if (!protein) {
      loadProtein('P0DOW4', '1KX5');
    }
  }, [isOpen, selectedNode]);

  const loadCompound = async (cid: number) => {
    setIsLoadingCompound(true);
    try {
      const data = await fetchPubChemCompound(cid);
      setCompound(data);
    } catch (e) {
      console.warn('Compound fetch warning:', e);
    } finally {
      setIsLoadingCompound(false);
    }
  };

  const loadProtein = async (uniprotId: string, pdbId?: string) => {
    setIsLoadingProtein(true);
    try {
      const data = await fetchProteinProfile(uniprotId, pdbId);
      setProtein(data);
    } catch (e) {
      console.warn('Protein fetch warning:', e);
    } finally {
      setIsLoadingProtein(false);
    }
  };

  // Interactive 3D Conformer Ball-and-Stick Canvas Renderer
  useEffect(() => {
    if (!isOpen || activeTab !== 'COMPOUNDS' || !compound) return;
    let rafId = 0;
    let angle = 0;

    const renderConformer = () => {
      const canvas = conformerCanvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const w = canvas.width;
          const h = canvas.height;
          ctx.clearRect(0, 0, w, h);

          angle += 0.015;
          const cosA = Math.cos(angle);
          const sinA = Math.sin(angle);

          const projected = compound.atoms3d.map(atom => {
            const rx = atom.x * cosA - atom.z * sinA;
            const rz = atom.x * sinA + atom.z * cosA;
            const scale = 36 / (1 + rz * 0.08);
            return {
              element: atom.element,
              px: w / 2 + rx * scale,
              py: h / 2 - atom.y * scale,
              rz
            };
          });

          // Draw bonds
          ctx.strokeStyle = 'rgba(148, 163, 184, 0.75)';
          for (const bond of compound.bonds3d) {
            const a = projected[bond.a];
            const b = projected[bond.b];
            if (a && b) {
              ctx.lineWidth = bond.order === 2 ? 3.5 : 2;
              ctx.beginPath();
              ctx.moveTo(a.px, a.py);
              ctx.lineTo(b.px, b.py);
              ctx.stroke();
            }
          }

          // Draw atoms sorted by depth
          const elementColors: Record<string, string> = {
            C: '#00F0FF',
            N: '#3B82F6',
            O: '#FF2A5F',
            S: '#FFB800',
            P: '#B877FF',
            H: '#E2E8F0'
          };

          projected
            .slice()
            .sort((p1, p2) => p1.rz - p2.rz)
            .forEach(p => {
              const radius = p.element === 'H' ? 6 : 11;
              ctx.beginPath();
              ctx.fillStyle = elementColors[p.element] || '#00FF9D';
              ctx.arc(p.px, p.py, radius, 0, Math.PI * 2);
              ctx.fill();

              ctx.fillStyle = '#030508';
              ctx.font = 'bold 9px "JetBrains Mono", monospace';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(p.element, p.px, p.py);
            });
        }
      }
      rafId = requestAnimationFrame(renderConformer);
    };

    rafId = requestAnimationFrame(renderConformer);
    return () => cancelAnimationFrame(rafId);
  }, [isOpen, activeTab, compound]);

  // Interactive 3D AlphaFold pLDDT Backbone Canvas Renderer
  useEffect(() => {
    if (!isOpen || activeTab !== 'PROTEINS' || !protein) return;
    let rafId = 0;
    let angle = 0;

    const renderBackbone = () => {
      const canvas = proteinCanvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const w = canvas.width;
          const h = canvas.height;
          ctx.clearRect(0, 0, w, h);

          angle += 0.012;
          const cosA = Math.cos(angle);
          const sinA = Math.sin(angle);

          const pts = protein.backboneCoords.map(c => {
            const rx = c.x * cosA - c.z * sinA;
            const rz = c.x * sinA + c.z * cosA;
            const scale = 14;
            return {
              px: w / 2 + rx * scale,
              py: h / 2 - c.y * scale,
              plddt: c.plddt
            };
          });

          for (let i = 1; i < pts.length; i++) {
            const p0 = pts[i - 1];
            const p1 = pts[i];
            ctx.beginPath();
            ctx.lineWidth = 3;
            ctx.strokeStyle =
              p1.plddt >= 90
                ? '#00F0FF'
                : p1.plddt >= 70
                ? '#00FF9D'
                : p1.plddt >= 50
                ? '#FFB800'
                : '#FF2A5F';
            ctx.moveTo(p0.px, p0.py);
            ctx.lineTo(p1.px, p1.py);
            ctx.stroke();
          }
        }
      }
      rafId = requestAnimationFrame(renderBackbone);
    };

    rafId = requestAnimationFrame(renderBackbone);
    return () => cancelAnimationFrame(rafId);
  }, [isOpen, activeTab, protein]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-3 sm:p-6">
      <div className="hud-panel w-full max-w-6xl h-[88vh] rounded-lg flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-[#0A0E17]">
          <div className="flex items-center gap-3">
            <Atom className="w-4 h-4 text-emerald-400" />
            <div>
              <div className="text-xs font-mono text-emerald-400">
                Federated Astrobiology & Structural Bioinformatics Workbench
              </div>
              <h2 className="text-sm sm:text-base font-display font-semibold text-slate-100">
                PubChem · UniProtKB · AlphaFold DB (pLDDT) · RCSB PDB · Europe PMC & OpenAlex
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded text-slate-400 hover:text-white border border-white/10 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick-Try Curated Astrobiology Bar */}
        <div className="px-5 py-2 bg-[#0B0F19] border-b border-white/10 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-[11px] font-mono text-slate-400 shrink-0">
            Reference Targets:
          </span>
          {QUICK_ASTROBIOLOGY_TARGETS.map(item => (
            <button
              key={item.id}
              onClick={() => {
                if (item.type === 'COMPOUND' && item.cid) {
                  setActiveTab('COMPOUNDS');
                  setCidInput(String(item.cid));
                  loadCompound(item.cid);
                } else if (item.type === 'PROTEIN' && item.uniprotId) {
                  setActiveTab('PROTEINS');
                  setUniprotInput(item.uniprotId);
                  setPdbInput(item.pdbId || '');
                  loadProtein(item.uniprotId, item.pdbId);
                }
              }}
              className="px-2.5 py-1 rounded bg-slate-900 hover:border-sky-400/50 border border-white/10 text-left shrink-0 transition cursor-pointer"
            >
              <div className="text-xs font-medium text-slate-100">{item.label}</div>
              <div className="text-[10px] font-mono text-sky-400">{item.subtitle}</div>
            </button>
          ))}
        </div>

        {/* Sub-Tabs */}
        <div className="flex items-center gap-1.5 px-5 py-2 border-b border-white/10 bg-[#0A0E17]">
          {(
            [
              { id: 'COMPOUNDS', label: '1. Exoplanet Biosignatures & PubChem 3D', icon: FlaskConical },
              { id: 'PROTEINS', label: '2. Extremophile Genomics & AlphaFold pLDDT', icon: Dna },
              { id: 'PATHWAYS', label: '3. Prebiotic Interstellar Pathways', icon: Atom },
              { id: 'LITERATURE', label: '4. Astrobiology Literature Search', icon: BookOpen }
            ] as { id: BioTab; label: string; icon: any }[]
          ).map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition cursor-pointer ${
                  active
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/35'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* TAB 1: PUBCHEM COMPOUNDS */}
          {activeTab === 'COMPOUNDS' && (
            <div className="space-y-5">
              <form
                onSubmit={e => {
                  e.preventDefault();
                  loadCompound(Number(cidInput) || 1068);
                }}
                className="flex items-center gap-2 max-w-lg"
              >
                <input
                  type="number"
                  value={cidInput}
                  onChange={e => setCidInput(e.target.value)}
                  placeholder="Enter PubChem CID (e.g., 1068, 750, 190)"
                  className="flex-1 bg-[#03060C] border border-white/20 rounded px-3 py-1.5 text-xs font-mono text-white"
                />
                <button
                  type="submit"
                  disabled={isLoadingCompound}
                  className="px-4 py-1.5 rounded bg-[#00F0FF] text-[#030508] font-mono text-xs font-bold uppercase cursor-pointer"
                >
                  {isLoadingCompound ? 'Loading...' : 'Fetch PubChem CID'}
                </button>
              </form>

              {compound && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  <div className="lg:col-span-5 p-4 rounded bg-[#070E1B] border border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded bg-[#00F0FF]/15 text-[#00F0FF] font-mono text-xs font-bold">
                        PUBCHEM CID {compound.cid}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-[#00FF9D]/15 text-[#00FF9D] font-mono text-[10px]">
                        {compound.volatilityClass}
                      </span>
                    </div>
                    <h3 className="text-lg font-display font-bold text-white">{compound.name}</h3>
                    <div className="font-mono text-xs text-[#94A3B8] break-all">
                      SMILES: <span className="text-white">{compound.smiles}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 font-mono text-xs tabular-nums">
                      <div className="p-2.5 rounded bg-[#040811] border border-white/10">
                        <div className="text-[10px] text-[#94A3B8]">MOLECULAR FORMULA</div>
                        <div className="text-sm font-bold text-[#00F0FF]">{compound.formula}</div>
                      </div>
                      <div className="p-2.5 rounded bg-[#040811] border border-white/10">
                        <div className="text-[10px] text-[#94A3B8]">MOLECULAR WEIGHT</div>
                        <div className="text-sm font-bold text-white">{compound.molecularWeight} g/mol</div>
                      </div>
                      <div className="p-2.5 rounded bg-[#040811] border border-white/10">
                        <div className="text-[10px] text-[#94A3B8]">PARTITION XLogP</div>
                        <div className="text-sm font-bold text-[#00FF9D]">{compound.xlogp}</div>
                      </div>
                      <div className="p-2.5 rounded bg-[#040811] border border-white/10">
                        <div className="text-[10px] text-[#94A3B8]">POLAR AREA (TPSA)</div>
                        <div className="text-sm font-bold text-[#FFB800]">{compound.tpsa} Å²</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1 font-mono text-[11px]">
                      <span
                        className={`flex items-center gap-1 px-2 py-1 rounded border ${
                          compound.lipinskiCompliant
                            ? 'bg-[#00FF9D]/15 border-[#00FF9D]/40 text-[#00FF9D]'
                            : 'bg-[#FFB800]/15 border-[#FFB800]/40 text-[#FFB800]'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Lipinski Ro5: {compound.lipinskiCompliant ? 'PASS' : 'EXTREME'}</span>
                      </span>
                      <span
                        className={`flex items-center gap-1 px-2 py-1 rounded border ${
                          compound.veberCompliant
                            ? 'bg-[#00F0FF]/15 border-[#00F0FF]/40 text-[#00F0FF]'
                            : 'bg-[#FF2A5F]/15 border-[#FF2A5F]/40 text-[#FF2A5F]'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Veber Polar Rule: {compound.veberCompliant ? 'PASS' : 'HIGH TPSA'}</span>
                      </span>
                    </div>
                  </div>

                  <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded bg-[#070E1B] border border-white/10 flex flex-col items-center justify-between">
                      <div className="text-[11px] font-mono uppercase text-[#00F0FF] self-start">
                        2D CHEMICAL TOPOLOGY (PUBCHEM REST)
                      </div>
                      <img
                        src={compound.image2dUrl}
                        alt={compound.name}
                        className="w-48 h-48 object-contain rounded bg-white p-2 my-2"
                      />
                      <a
                        href={`https://pubchem.ncbi.nlm.nih.gov/compound/${compound.cid}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-mono text-[#00F0FF] hover:underline flex items-center gap-1"
                      >
                        <span>Open PubChem Record</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>

                    <div className="p-4 rounded bg-[#070E1B] border border-white/10 flex flex-col items-center justify-between">
                      <div className="text-[11px] font-mono uppercase text-[#00FF9D] self-start">
                        3D CONFORMER BALL-AND-STICK VIEW
                      </div>
                      <canvas
                        ref={conformerCanvasRef}
                        width={260}
                        height={210}
                        className="w-full rounded bg-[#03060C] border border-white/10 my-2"
                      />
                      <div className="text-[10px] font-mono text-[#94A3B8] tabular-nums">
                        {compound.atoms3d.length} Atoms • {compound.bonds3d.length} Covalent Bonds
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PROTEINS & ALPHAFOLD pLDDT */}
          {activeTab === 'PROTEINS' && (
            <div className="space-y-5">
              <form
                onSubmit={e => {
                  e.preventDefault();
                  loadProtein(uniprotInput.trim() || 'P0DOW4', pdbInput.trim() || undefined);
                }}
                className="flex flex-wrap items-center gap-2"
              >
                <input
                  type="text"
                  value={uniprotInput}
                  onChange={e => setUniprotInput(e.target.value)}
                  placeholder="UniProt Accession (e.g., P0DOW4, P42442)"
                  className="bg-[#03060C] border border-white/20 rounded px-3 py-1.5 text-xs font-mono text-white"
                />
                <input
                  type="text"
                  value={pdbInput}
                  onChange={e => setPdbInput(e.target.value)}
                  placeholder="Optional PDB ID (e.g., 1KX5)"
                  className="bg-[#03060C] border border-white/20 rounded px-3 py-1.5 text-xs font-mono text-white"
                />
                <button
                  type="submit"
                  disabled={isLoadingProtein}
                  className="px-4 py-1.5 rounded bg-[#00FF9D] text-[#030508] font-mono text-xs font-bold uppercase cursor-pointer"
                >
                  {isLoadingProtein ? 'Querying UniProt & AlphaFold...' : 'Inspect Protein'}
                </button>
              </form>

              {protein && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  <div className="lg:col-span-6 p-4 rounded bg-[#070E1B] border border-white/10 space-y-3">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="px-2 py-0.5 rounded bg-[#00FF9D]/15 text-[#00FF9D] font-bold">
                        UNIPROT {protein.uniprotId} ({protein.entryName})
                      </span>
                      {protein.pdbId && (
                        <span className="px-2 py-0.5 rounded bg-[#00F0FF]/15 text-[#00F0FF]">
                          RCSB PDB: {protein.pdbId}
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-display font-bold text-white">
                      {protein.proteinName}
                    </h3>
                    <div className="text-xs font-mono text-[#FFB800]">
                      Organism: {protein.organism} • Length: {protein.sequenceLength} aa
                    </div>
                    <p className="text-xs text-slate-200 leading-relaxed">
                      {protein.functionSummary}
                    </p>

                    {/* AlphaFold 4-Band pLDDT Distribution */}
                    <div className="p-3 rounded bg-[#040811] border border-white/10 space-y-2">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-[#00F0FF] font-bold">
                          ALPHAFOLD pLDDT CONFIDENCE DISTRIBUTION
                        </span>
                        <span className="text-[#00FF9D] tabular-nums">
                          Mean pLDDT: {protein.alphafoldMeanPlddt}
                        </span>
                      </div>

                      <div className="w-full h-3 rounded overflow-hidden flex bg-[#091220]">
                        <div
                          style={{ width: `${protein.plddtBands.veryHigh}%` }}
                          className="bg-[#00F0FF]"
                          title="Very High (>90)"
                        />
                        <div
                          style={{ width: `${protein.plddtBands.confident}%` }}
                          className="bg-[#00FF9D]"
                          title="Confident (70-90)"
                        />
                        <div
                          style={{ width: `${protein.plddtBands.low}%` }}
                          className="bg-[#FFB800]"
                          title="Low (50-70)"
                        />
                        <div
                          style={{ width: `${protein.plddtBands.veryLow}%` }}
                          className="bg-[#FF2A5F]"
                          title="Very Low (<50)"
                        />
                      </div>

                      <div className="grid grid-cols-4 gap-1 text-[10px] font-mono tabular-nums">
                        <span className="text-[#00F0FF]">VH (&gt;90): {protein.plddtBands.veryHigh}%</span>
                        <span className="text-[#00FF9D]">Conf: {protein.plddtBands.confident}%</span>
                        <span className="text-[#FFB800]">Low: {protein.plddtBands.low}%</span>
                        <span className="text-[#FF2A5F]">VLow: {protein.plddtBands.veryLow}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-6 p-4 rounded bg-[#070E1B] border border-white/10 flex flex-col justify-between space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono uppercase text-[#00F0FF] font-bold">
                        3D Cα BACKBONE FOLD (COLORED BY ALPHAFOLD pLDDT)
                      </span>
                      {protein.pdbResolutionAngstrom && (
                        <span className="text-xs font-mono text-[#00FF9D] tabular-nums">
                          Resolution: {protein.pdbResolutionAngstrom} Å
                        </span>
                      )}
                    </div>

                    <canvas
                      ref={proteinCanvasRef}
                      width={460}
                      height={220}
                      className="w-full rounded bg-[#03060C] border border-white/10"
                    />

                    <div className="space-y-1">
                      <div className="text-[10px] font-mono uppercase text-[#94A3B8]">
                        ANNOTATED UNIPROT DOMAINS & REGIONS
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {protein.domains.map((d, idx) => (
                          <div
                            key={idx}
                            className="p-2 rounded bg-[#040811] border border-white/10 text-xs font-mono"
                          >
                            <div className="text-white font-bold truncate">{d.name}</div>
                            <div className="text-[10px] text-[#00F0FF] tabular-nums">
                              Residues {d.start} – {d.end} ({d.type})
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PREBIOTIC INTERSTELLAR PATHWAYS */}
          {activeTab === 'PATHWAYS' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {PREBIOTIC_PATHWAYS.map(step => (
                <div
                  key={step.id}
                  className="p-4 rounded bg-[#070E1B] border border-[#00F0FF]/30 space-y-2.5 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-[#00F0FF] font-bold">
                        PATHWAY 0{step.stepNumber} // {step.astroEnvironment}
                      </span>
                      <span className="text-[#00FF9D] tabular-nums">{step.quantumYieldOrRate}</span>
                    </div>
                    <h4 className="text-base font-display font-bold text-white">
                      {step.product}
                    </h4>
                    <div className="p-2.5 rounded bg-[#03060C] border border-white/10 font-mono text-xs text-[#FFB800]">
                      {step.reactionEquation}
                    </div>
                    <div className="text-xs text-[#94A3B8]">
                      <strong className="text-slate-200">Energy Driver:</strong> {step.energySource}
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => {
                        setActiveTab('COMPOUNDS');
                        setCidInput(String(step.productCid));
                        loadCompound(step.productCid);
                      }}
                      className="px-3 py-1.5 rounded bg-[#00F0FF]/20 border border-[#00F0FF]/50 text-[#00F0FF] font-mono text-xs font-bold uppercase cursor-pointer"
                    >
                      Inspect Product (CID {step.productCid})
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 4: ASTROBIOLOGY LITERATURE SEARCH */}
          {activeTab === 'LITERATURE' && (
            <div className="space-y-4">
              <form
                onSubmit={async e => {
                  e.preventDefault();
                  setIsLoadingLit(true);
                  try {
                    const res = await searchAstrobiologyLiterature(litQuery);
                    setLitItems(res);
                  } finally {
                    setIsLoadingLit(false);
                  }
                }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  value={litQuery}
                  onChange={e => setLitQuery(e.target.value)}
                  className="flex-1 bg-[#03060C] border border-white/20 rounded px-3 py-2 text-xs font-mono text-white"
                  placeholder="Query Europe PMC & OpenAlex..."
                />
                <button
                  type="submit"
                  disabled={isLoadingLit}
                  className="px-4 py-2 rounded bg-[#00FF9D] text-[#030508] font-mono text-xs font-bold uppercase cursor-pointer"
                >
                  <Search className="w-3.5 h-3.5 inline mr-1" />
                  {isLoadingLit ? 'Searching...' : 'Search'}
                </button>
              </form>

              <div className="space-y-3">
                {litItems.map(item => (
                  <div
                    key={item.id}
                    className="p-4 rounded bg-[#070E1B] border border-white/10 space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-[#00F0FF]">
                        [{item.source}] {item.venue} ({item.year})
                      </span>
                      <span className="text-[#00FF9D] tabular-nums">
                        Cited by {item.citationCount}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-white">{item.title}</h4>
                    <div className="text-xs text-[#94A3B8]">{item.authors}</div>
                    <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
                      {item.abstract}
                    </p>
                    <div className="flex items-center justify-between pt-2">
                      <a
                        href={item.doiOrUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-mono text-[#00F0FF] hover:underline flex items-center gap-1"
                      >
                        <span>Open Publication</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      <button
                        onClick={() =>
                          onCiteInWhitepaper({
                            id: `cit-${Date.now()}`,
                            authors: item.authors,
                            year: item.year,
                            title: item.title,
                            venue: item.venue,
                            doiOrUrl: item.doiOrUrl,
                            bibtexKey: `astro_${item.year}_${Math.floor(Math.random() * 99)}`,
                            sourceDatabase: item.source
                          })
                        }
                        className="flex items-center gap-1 px-3 py-1 rounded bg-[#00FF9D]/20 text-[#00FF9D] border border-[#00FF9D]/40 text-xs font-mono font-bold cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add to Whitepaper Bibliography</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BioscienceWorkbench;
