import React, { useState, useEffect } from 'react';
import {
  X,
  Search,
  Sparkles,
  Plus,
  BookOpen,
  AlertTriangle,
  CheckCircle2,
  GitBranch,
  Flame,
  RefreshCw,
  FolderTree
} from 'lucide-react';
import { Node, NodeType, GraphData, NodeInspectionResult, Cluster } from '../types';
import { inspectNodeDeepDive } from '../services/gemini';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  nodes: Node[];
  graphData: GraphData;
  selectedNode?: Node;
  onSelectNode: (node: Node) => void;
  onUpdateNode: (node: Node) => void;
  onGraftChildNodes: (
    parentNode: Node,
    children: {
      label: string;
      type: NodeType;
      description: string;
      confidence: number;
      source: string;
      val: number;
    }[]
  ) => void;
  onEvolveNodeSubtree: (node: Node) => void;
  onDrillDownCluster: (cluster: Cluster) => void;
  isEvolving: boolean;
  isDrillDownLoading?: boolean;
  onOpenBioscienceLab?: (node: Node) => void;
}

const TYPE_COLOR: Record<NodeType, string> = {
  [NodeType.CLAIM]: 'text-sky-400',
  [NodeType.EVIDENCE]: 'text-emerald-400',
  [NodeType.CONTRADICTION]: 'text-rose-400',
  [NodeType.QUESTION]: 'text-amber-400',
  [NodeType.IDEA]: 'text-violet-400',
  [NodeType.SOURCE]: 'text-blue-300',
  [NodeType.DEFINITION]: 'text-slate-200'
};

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  nodes,
  graphData,
  selectedNode,
  onSelectNode,
  onUpdateNode,
  onGraftChildNodes,
  onEvolveNodeSubtree,
  onDrillDownCluster,
  isEvolving,
  isDrillDownLoading,
  onOpenBioscienceLab
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [inspection, setInspection] = useState<NodeInspectionResult | null>(null);
  const [isInspecting, setIsInspecting] = useState(false);

  useEffect(() => {
    setInspection(null);
  }, [selectedNode?.id]);

  if (!isOpen) return null;

  const filteredNodes = nodes.filter(n => {
    const matchesSearch =
      n.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (n.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'ALL' || n.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const handleRunDeepDive = async () => {
    if (!selectedNode) return;
    setIsInspecting(true);
    try {
      const res = await inspectNodeDeepDive(selectedNode, graphData);
      setInspection(res);
      onUpdateNode({
        ...selectedNode,
        aiAnalysis: res.deepAnalysis,
        citations: res.citations
      });
    } catch (error) {
      console.warn('Deep dive failed:', error);
    } finally {
      setIsInspecting(false);
    }
  };

  const currentCluster = selectedNode
    ? graphData.clusters.find(c => c.id === selectedNode.clusterId)
    : undefined;

  const connectedLinks = selectedNode
    ? graphData.links.filter(
        l => l.source === selectedNode.id || l.target === selectedNode.id
      )
    : [];

  return (
    <aside className="fixed top-16 right-3.5 bottom-16 w-96 max-w-[calc(100vw-1.75rem)] z-40 hud-panel rounded-lg flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#0A0E17]">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-sky-400" />
          <h2 className="font-display font-semibold text-sm text-slate-100">
            Node Telemetry Inspector
          </h2>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-white transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {selectedNode ? (
          <div className="space-y-4">
            {/* Primary Node Telemetry Card */}
            <div className="p-3.5 rounded-md bg-slate-900/75 border border-white/10 space-y-2.5">
              {/* Unboxed Metadata Line */}
              <div className="flex items-center justify-between text-[11px] font-mono tabular-nums">
                <div className="flex items-center gap-1.5">
                  <span className={TYPE_COLOR[selectedNode.type] || 'text-sky-400'}>
                    {selectedNode.type}
                  </span>
                  {(selectedNode.generation || 0) > 0 && (
                    <>
                      <span className="text-slate-600">·</span>
                      <span className="text-amber-400">Gen-{selectedNode.generation}</span>
                    </>
                  )}
                </div>
                <span className="text-emerald-400">
                  {Math.round(selectedNode.confidence * 100)}% Confidence
                </span>
              </div>

              <h3 className="text-base font-semibold text-slate-100 leading-snug">
                {selectedNode.label}
              </h3>

              {/* Astrometric & Astrobiological Readouts */}
              {(selectedNode.distanceLabel ||
                selectedNode.coordinatesRaDec ||
                selectedNode.pubchemCid ||
                selectedNode.uniprotId) && (
                <div className="p-2.5 rounded bg-[#07090E] border border-white/10 space-y-1 font-mono text-[11px] tabular-nums text-slate-300">
                  {selectedNode.distanceLabel && (
                    <div>
                      <span className="text-slate-500">Distance: </span>
                      <span className="text-sky-300">{selectedNode.distanceLabel}</span>
                    </div>
                  )}
                  {selectedNode.coordinatesRaDec && (
                    <div>
                      <span className="text-slate-500">Ephemeris: </span>
                      <span>{selectedNode.coordinatesRaDec}</span>
                    </div>
                  )}
                  {selectedNode.pubchemCid && (
                    <div>
                      <span className="text-slate-500">Biosignature: </span>
                      <span className="text-emerald-400">
                        {selectedNode.compoundName || 'Volatile'} (CID {selectedNode.pubchemCid})
                      </span>
                    </div>
                  )}
                  {selectedNode.uniprotId && (
                    <div>
                      <span className="text-slate-500">Proteome: </span>
                      <span className="text-amber-400">
                        UniProt {selectedNode.uniprotId}
                        {selectedNode.pdbId ? ` · PDB ${selectedNode.pdbId}` : ''}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {selectedNode.description && (
                <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                  {selectedNode.description}
                </p>
              )}

              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span className="truncate">{selectedNode.source || 'Primary Telemetry'}</span>
                <span className="shrink-0 ml-2">{connectedLinks.length} Links</span>
              </div>
            </div>

            {/* Action Hierarchy */}
            <div className="space-y-2">
              <button
                onClick={handleRunDeepDive}
                disabled={isInspecting}
                className="w-full py-2 px-3.5 rounded bg-sky-500 text-slate-950 text-xs font-semibold flex items-center justify-center gap-2 hover:bg-sky-400 disabled:opacity-50 transition cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>
                  {isInspecting ? 'Synthesizing Deep-Dive...' : 'Run Epistemic Deep-Dive'}
                </span>
              </button>

              {(selectedNode.pubchemCid || selectedNode.uniprotId) && onOpenBioscienceLab && (
                <button
                  onClick={() => onOpenBioscienceLab(selectedNode)}
                  className="w-full py-2 px-3.5 rounded bg-slate-900 border border-emerald-500/40 text-emerald-300 text-xs font-medium flex items-center justify-center gap-2 hover:bg-emerald-500/10 transition cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Open in Astrobiology & Molecular Lab</span>
                </button>
              )}

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onEvolveNodeSubtree(selectedNode)}
                  disabled={isEvolving}
                  className="py-1.5 px-2.5 rounded bg-slate-900 border border-white/10 text-slate-200 text-xs font-medium flex items-center justify-center gap-1.5 hover:border-amber-400/50 disabled:opacity-50 transition cursor-pointer"
                >
                  {isEvolving ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                  ) : (
                    <Flame className="w-3.5 h-3.5 text-amber-400" />
                  )}
                  <span>Evolve Subtree</span>
                </button>

                {currentCluster && (
                  <button
                    onClick={() => onDrillDownCluster(currentCluster)}
                    disabled={isDrillDownLoading}
                    className="py-1.5 px-2.5 rounded bg-slate-900 border border-white/10 text-slate-200 text-xs font-medium flex items-center justify-center gap-1.5 hover:border-sky-400/50 disabled:opacity-50 transition cursor-pointer truncate"
                    title={`Drill Down Sector: ${currentCluster.name}`}
                  >
                    <FolderTree className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    <span className="truncate">
                      {isDrillDownLoading ? 'Drilling...' : 'Drill Sector'}
                    </span>
                  </button>
                )}
              </div>
            </div>

            {/* Deep-Dive Output & Citations */}
            {(inspection || selectedNode.aiAnalysis) && (
              <div className="p-3.5 rounded-md bg-slate-900/80 border border-white/10 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-medium text-sky-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Epistemic Analysis</span>
                </div>
                <div className="text-xs text-slate-200 leading-relaxed whitespace-pre-line">
                  {inspection?.deepAnalysis || selectedNode.aiAnalysis}
                </div>

                {inspection?.methodologyCritique && (
                  <div className="p-2.5 rounded bg-amber-500/10 border border-amber-500/25 space-y-1">
                    <div className="flex items-center gap-1 text-[11px] font-medium text-amber-400">
                      <AlertTriangle className="w-3 h-3" />
                      <span>Methodological Risk</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {inspection.methodologyCritique}
                    </p>
                  </div>
                )}

                {(inspection?.citations || selectedNode.citations) && (
                  <div className="space-y-1">
                    <div className="text-[11px] font-mono text-slate-400">
                      Literature & Telemetry Citations
                    </div>
                    <ul className="space-y-1 text-[11px] font-mono text-sky-300">
                      {(inspection?.citations || selectedNode.citations || []).map((cite, i) => (
                        <li key={i} className="leading-snug">
                          · {cite}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {inspection?.newChildNodes && inspection.newChildNodes.length > 0 && (
                  <div className="pt-2 border-t border-white/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono text-emerald-400">
                        Synthesized Sub-Nodes ({inspection.newChildNodes.length})
                      </span>
                      <button
                        onClick={() => {
                          onGraftChildNodes(selectedNode, inspection.newChildNodes);
                          setInspection({ ...inspection, newChildNodes: [] });
                        }}
                        className="flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-500 text-slate-950 text-[11px] font-semibold cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Graft All</span>
                      </button>
                    </div>
                    {inspection.newChildNodes.map((child, idx) => (
                      <div
                        key={idx}
                        className="p-2 rounded bg-[#07090E] border border-white/10 text-xs"
                      >
                        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                          <span className="text-sky-400">{child.type}</span>
                          <span>{Math.round(child.confidence * 100)}%</span>
                        </div>
                        <div className="font-medium text-slate-100">{child.label}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="p-3 rounded bg-slate-900/60 border border-white/10 text-xs text-slate-400">
            Select any 3D node in the viewport or choose from the registry below to inspect
            astrometric telemetry and run deep-dive synthesis.
          </div>
        )}

        {/* Node Registry */}
        <div className="space-y-2.5 pt-2 border-t border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-200 flex items-center gap-1.5">
              <GitBranch className="w-3.5 h-3.5 text-sky-400" />
              <span>Node Registry ({filteredNodes.length})</span>
            </span>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search nodes..."
              className="w-full bg-[#07090E] border border-white/15 focus:border-sky-400 rounded pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none"
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar">
            {['ALL', ...Object.values(NodeType)].map(t => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-2 py-0.5 rounded text-[10px] font-mono border transition cursor-pointer ${
                  typeFilter === t
                    ? 'bg-sky-500 text-slate-950 border-sky-400 font-semibold'
                    : 'bg-slate-900 text-slate-400 border-white/10 hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
            {filteredNodes.map(node => {
              const isSel = selectedNode?.id === node.id;
              return (
                <button
                  key={node.id}
                  onClick={() => onSelectNode(node)}
                  className={`w-full text-left p-2 rounded border transition cursor-pointer ${
                    isSel
                      ? 'bg-sky-500/15 border-sky-400/60 text-white'
                      : 'bg-slate-900/60 border-white/10 text-slate-300 hover:border-white/25'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-0.5 tabular-nums">
                    <span className={TYPE_COLOR[node.type] || 'text-sky-400'}>{node.type}</span>
                    <span>
                      {(node.generation || 0) > 0 ? `Gen-${node.generation} · ` : ''}
                      {Math.round(node.confidence * 100)}%
                    </span>
                  </div>
                  <div className="text-xs font-medium text-slate-100 truncate">
                    {node.label}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
