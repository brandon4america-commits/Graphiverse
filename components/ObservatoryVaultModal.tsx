import React, { useState } from 'react';
import { User } from 'firebase/auth';
import {
  Database,
  LogIn,
  LogOut,
  Plus,
  Trash2,
  Star,
  Globe,
  Compass,
  Music,
  MessageSquare,
  X
} from 'lucide-react';
import {
  signInWithGoogle,
  signOutObservatory,
  saveCelestialDiscovery,
  deleteCelestialDiscovery,
  deleteCosmicExpedition,
  deleteChatSession,
  publishSharedUniverseMap,
  starSharedUniverseMap,
  deleteSharedUniverseMap,
  StoredDiscovery,
  StoredExpedition,
  StoredChatSession,
  StoredSharedMap
} from '../services/firebase';
import { GraphData, Node, NodeType } from '../types';

interface ObservatoryVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  graphData: GraphData;
  discoveries: StoredDiscovery[];
  expeditions: StoredExpedition[];
  chatSessions: StoredChatSession[];
  sharedMaps: StoredSharedMap[];
  onLoadSharedGraph: (newGraph: GraphData) => void;
  onAddDiscoveryNodeToAtlas: (node: Node) => void;
}

type VaultTab = 'DISCOVERIES' | 'EXPEDITIONS' | 'CHATS' | 'COMMUNITY_MAPS';

const ObservatoryVaultModal: React.FC<ObservatoryVaultModalProps> = ({
  isOpen,
  onClose,
  user,
  graphData,
  discoveries,
  expeditions,
  chatSessions,
  sharedMaps,
  onLoadSharedGraph,
  onAddDiscoveryNodeToAtlas
}) => {
  const [activeTab, setActiveTab] = useState<VaultTab>('DISCOVERIES');
  const [label, setLabel] = useState('');
  const [clusterId, setClusterId] = useState(graphData.clusters[0]?.id || 'c-solar-system');
  const [coords, setCoords] = useState('RA 11h 30m 14s | Dec +07° 35′');
  const [distance, setDistance] = useState('124 ly (38.0 pc)');
  const [notes, setNotes] = useState('');
  const [pubchemCid, setPubchemCid] = useState('1068');

  const [mapTitle, setMapTitle] = useState('');
  const [mapSummary, setMapSummary] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSignIn = async () => {
    setAuthError(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setAuthError(err?.message || 'Google Sign-In failed');
    }
  };

  const handleCreateDiscovery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !label.trim()) return;
    const cidNum = Number(pubchemCid) || undefined;
    await saveCelestialDiscovery({
      label: label.trim(),
      scaleRegime: 'EXOPLANETARY',
      clusterId,
      coordinatesRaDec: coords,
      distanceLabel: distance,
      biosignatureNotes: notes || 'Custom observatory star chart annotation.',
      pubchemCid: cidNum,
      confidence: 0.91,
      isPublic: true
    });

    onAddDiscoveryNodeToAtlas({
      id: `disc-node-${Date.now()}`,
      label: label.trim(),
      type: NodeType.CLAIM,
      clusterId,
      val: 22,
      confidence: 0.91,
      source: `Observatory Vault (${user.displayName || user.email})`,
      description: notes || 'Custom discovered celestial system.',
      coordinatesRaDec: coords,
      distanceLabel: distance,
      pubchemCid: cidNum
    });

    setLabel('');
    setNotes('');
  };

  const handlePublishMap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !mapTitle.trim()) return;
    await publishSharedUniverseMap({
      title: mapTitle.trim(),
      summary:
        mapSummary.trim() ||
        `Multi-scale universe atlas with ${graphData.nodes.length} nodes across ${graphData.clusters.length} cosmic sectors.`,
      nodeCount: graphData.nodes.length,
      clusterCount: graphData.clusters.length,
      graphSnapshotJson: JSON.stringify(graphData),
      isPublic: true
    });
    setMapTitle('');
    setMapSummary('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-3 sm:p-6">
      <div className="hud-panel w-full max-w-5xl h-[86vh] rounded-lg flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-[#0A0E17]">
          <div className="flex items-center gap-3">
            <Database className="w-4 h-4 text-sky-400" />
            <div>
              <div className="text-xs font-mono text-sky-400">
                Firebase Firestore Observatory Vault & Community Hub
              </div>
              <h2 className="text-sm sm:text-base font-display font-semibold text-slate-100">
                Discoveries · Saved Expeditions & Lyria Tracks · Chat Logs · Shared Maps
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {user ? (
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-emerald-400 hidden sm:inline">
                  {user.displayName || user.email}
                </span>
                <button
                  onClick={() => signOutObservatory()}
                  className="flex items-center gap-1 px-3 py-1.5 rounded bg-rose-500/15 text-rose-300 border border-rose-500/30 text-xs font-medium cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <button
                onClick={handleSignIn}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-sky-500 text-slate-950 text-xs font-semibold cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In with Google</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded text-slate-400 hover:text-white border border-white/10 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1.5 px-5 py-2 border-b border-white/10 bg-[#0B0F19]">
          {(
            [
              { id: 'DISCOVERIES', label: `Celestial Discoveries (${discoveries.length})`, icon: Compass },
              { id: 'EXPEDITIONS', label: `Expeditions & Lyria (${expeditions.length})`, icon: Music },
              { id: 'CHATS', label: `Chat Logs (${chatSessions.length})`, icon: MessageSquare },
              { id: 'COMMUNITY_MAPS', label: `Shared Maps (${sharedMaps.length})`, icon: Globe }
            ] as { id: VaultTab; label: string; icon: any }[]
          ).map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium cursor-pointer ${
                  active
                    ? 'bg-sky-500/15 text-sky-400 border border-sky-500/35'
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
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {authError && (
            <div className="p-3 rounded bg-[#FF2A5F]/15 border border-[#FF2A5F]/40 text-xs font-mono text-[#FF2A5F]">
              {authError}
            </div>
          )}

          {!user && (
            <div className="p-6 rounded bg-[#070E1B] border border-[#00F0FF]/30 text-center space-y-3">
              <div className="text-sm font-display font-bold text-white">
                Authenticate with Google to Persist Your Observatory Discoveries to Firestore
              </div>
              <p className="text-xs text-[#94A3B8] max-w-xl mx-auto">
                Sign in with your Google account to record custom celestial discoveries, save Lyria soundtracks, archive multi-turn Gemini research logs, and publish shared universe maps.
              </p>
              <button
                onClick={handleSignIn}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded bg-[#00F0FF] text-[#030508] font-mono text-xs font-bold uppercase cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In with Google</span>
              </button>
            </div>
          )}

          {/* TAB 1: DISCOVERIES */}
          {activeTab === 'DISCOVERIES' && user && (
            <div className="space-y-4">
              <form
                onSubmit={handleCreateDiscovery}
                className="p-4 rounded bg-[#070E1B] border border-white/15 grid grid-cols-1 md:grid-cols-3 gap-3"
              >
                <input
                  type="text"
                  value={label}
                  onChange={e => setLabel(e.target.value)}
                  placeholder="Celestial System / Biosignature Label..."
                  className="bg-[#03060C] border border-white/20 rounded px-3 py-2 text-xs font-mono text-white"
                  required
                />
                <select
                  value={clusterId}
                  onChange={e => setClusterId(e.target.value)}
                  className="bg-[#03060C] border border-white/20 rounded px-3 py-2 text-xs font-mono text-white"
                >
                  {graphData.clusters.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  value={pubchemCid}
                  onChange={e => setPubchemCid(e.target.value)}
                  placeholder="PubChem CID (e.g. 1068)"
                  className="bg-[#03060C] border border-white/20 rounded px-3 py-2 text-xs font-mono text-white"
                />
                <input
                  type="text"
                  value={coords}
                  onChange={e => setCoords(e.target.value)}
                  placeholder="RA / Dec Coordinates"
                  className="bg-[#03060C] border border-white/20 rounded px-3 py-2 text-xs font-mono text-white"
                />
                <input
                  type="text"
                  value={distance}
                  onChange={e => setDistance(e.target.value)}
                  placeholder="Distance from Sol"
                  className="bg-[#03060C] border border-white/20 rounded px-3 py-2 text-xs font-mono text-white"
                />
                <button
                  type="submit"
                  className="flex items-center justify-center gap-1.5 px-4 py-2 rounded bg-[#00FF9D] text-[#030508] font-mono text-xs font-bold uppercase cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Log Discovery & Graft to 3D Atlas</span>
                </button>
              </form>

              <div className="space-y-2">
                {discoveries.map(d => (
                  <div
                    key={d.id}
                    className="p-3.5 rounded bg-[#070E1B] border border-white/10 flex items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="text-xs font-bold text-white">{d.label}</div>
                      <div className="text-[11px] font-mono text-[#00F0FF] tabular-nums">
                        {d.coordinatesRaDec} • {d.distanceLabel} • CID: {d.pubchemCid || 'N/A'}
                      </div>
                      <p className="text-xs text-[#94A3B8]">{d.biosignatureNotes}</p>
                    </div>
                    <button
                      onClick={() => deleteCelestialDiscovery(d.id)}
                      className="p-1.5 rounded text-[#FF2A5F] hover:bg-[#FF2A5F]/15 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: EXPEDITIONS */}
          {activeTab === 'EXPEDITIONS' && user && (
            <div className="space-y-2">
              {expeditions.length === 0 ? (
                <div className="p-6 text-center text-xs font-mono text-[#94A3B8]">
                  No saved expeditions yet. Open the Lyria Music Studio to generate and save a cosmic expedition score.
                </div>
              ) : (
                expeditions.map(exp => (
                  <div
                    key={exp.id}
                    className="p-3.5 rounded bg-[#070E1B] border border-white/10 flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-bold text-white">{exp.title}</div>
                      <div className="text-[11px] font-mono text-[#FFB800] tabular-nums">
                        Model: {exp.lyriaModel} • C_AV = {exp.coherenceScore}
                      </div>
                      <div className="text-xs text-[#94A3B8]">{exp.notes}</div>
                    </div>
                    <button
                      onClick={() => deleteCosmicExpedition(exp.id)}
                      className="p-1.5 rounded text-[#FF2A5F] hover:bg-[#FF2A5F]/15 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 3: CHATS */}
          {activeTab === 'CHATS' && user && (
            <div className="space-y-2">
              {chatSessions.length === 0 ? (
                <div className="p-6 text-center text-xs font-mono text-[#94A3B8]">
                  No saved research chat logs yet. Use the Multi-Turn Gemini Research Console to save a thread.
                </div>
              ) : (
                chatSessions.map(chat => (
                  <div
                    key={chat.id}
                    className="p-3.5 rounded bg-[#070E1B] border border-white/10 flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-bold text-white">{chat.title}</div>
                      <div className="text-[11px] font-mono text-[#00F0FF]">
                        Model: {chat.model} • Persona: {chat.persona} • {chat.messageCount} messages
                      </div>
                    </div>
                    <button
                      onClick={() => deleteChatSession(chat.id)}
                      className="p-1.5 rounded text-[#FF2A5F] hover:bg-[#FF2A5F]/15 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 4: COMMUNITY SHARED MAPS */}
          {activeTab === 'COMMUNITY_MAPS' && user && (
            <div className="space-y-4">
              <form
                onSubmit={handlePublishMap}
                className="p-4 rounded bg-[#070E1B] border border-white/15 flex flex-col sm:flex-row gap-2"
              >
                <input
                  type="text"
                  value={mapTitle}
                  onChange={e => setMapTitle(e.target.value)}
                  placeholder="Universe Map Title..."
                  className="flex-1 bg-[#03060C] border border-white/20 rounded px-3 py-2 text-xs font-mono text-white"
                  required
                />
                <input
                  type="text"
                  value={mapSummary}
                  onChange={e => setMapSummary(e.target.value)}
                  placeholder="Observational Notes..."
                  className="flex-1 bg-[#03060C] border border-white/20 rounded px-3 py-2 text-xs font-mono text-white"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-[#00F0FF] text-[#030508] font-mono text-xs font-bold uppercase cursor-pointer"
                >
                  Publish Current 3D Atlas
                </button>
              </form>

              <div className="space-y-2">
                {sharedMaps.map(m => (
                  <div
                    key={m.id}
                    className="p-3.5 rounded bg-[#070E1B] border border-white/10 flex flex-wrap items-center justify-between gap-3"
                  >
                    <div>
                      <div className="text-xs font-bold text-white">
                        {m.title}{' '}
                        <span className="text-[10px] font-mono text-[#94A3B8]">
                          by {m.ownerName}
                        </span>
                      </div>
                      <div className="text-[11px] font-mono text-[#00F0FF] tabular-nums">
                        {m.clusterCount} Sectors • {m.nodeCount} Nodes
                      </div>
                      <p className="text-xs text-[#94A3B8]">{m.summary}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => starSharedUniverseMap(m.id, m.starCount)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#FFB800]/20 text-[#FFB800] border border-[#FFB800]/40 text-xs font-mono tabular-nums cursor-pointer"
                      >
                        <Star className="w-3.5 h-3.5" />
                        <span>{m.starCount}</span>
                      </button>
                      <button
                        onClick={() => {
                          try {
                            const parsed = JSON.parse(m.graphSnapshotJson) as GraphData;
                            if (parsed.nodes && parsed.clusters) {
                              onLoadSharedGraph(parsed);
                              onClose();
                            }
                          } catch {
                            // ignore
                          }
                        }}
                        className="px-3 py-1 rounded bg-[#00FF9D] text-[#030508] font-mono text-xs font-bold uppercase cursor-pointer"
                      >
                        Load into 3D Viewport
                      </button>
                      {m.ownerId === user.uid && (
                        <button
                          onClick={() => deleteSharedUniverseMap(m.id)}
                          className="p-1.5 rounded text-[#FF2A5F] hover:bg-[#FF2A5F]/15 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
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

export default ObservatoryVaultModal;
