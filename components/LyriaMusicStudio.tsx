import React, { useState } from 'react';
import { Music, Sparkles, Save, Volume2, X } from 'lucide-react';
import { Cluster, LyriaModelId, LyriaTrackRecord, ViewLens } from '../types';
import { saveCosmicExpedition } from '../services/firebase';

interface LyriaMusicStudioProps {
  isOpen: boolean;
  onClose: () => void;
  activeCluster?: Cluster;
  currentLens: ViewLens;
  isAuthenticated: boolean;
}

const LyriaMusicStudio: React.FC<LyriaMusicStudioProps> = ({
  isOpen,
  onClose,
  activeCluster,
  currentLens,
  isAuthenticated
}) => {
  const [model, setModel] = useState<LyriaModelId>('lyria-3-clip-preview');
  const [instrumental, setInstrumental] = useState(true);
  const [prompt, setPrompt] = useState(
    'Deep-space astrophysical sonification, crystalline modular arpeggios, sub-bass gravitational waves, warm analog pads, 84 BPM'
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [tracks, setTracks] = useState<LyriaTrackRecord[]>([]);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerateTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isGenerating) return;
    setIsGenerating(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/gemini/lyria', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          prompt,
          clusterName: activeCluster?.name || 'Known Universe Sector',
          instrumental
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Lyria generation failed');
      }

      const newTrack: LyriaTrackRecord = {
        id: `lyria-${Date.now()}`,
        title: `${activeCluster?.name || 'Cosmic'} Sonification (${
          model === 'lyria-3-pro-preview' ? 'Full Track' : '30s Clip'
        })`,
        clusterId: activeCluster?.id || 'c-solar-system',
        clusterName: activeCluster?.name || 'I. Solar System & Ocean Worlds',
        model,
        prompt,
        audioDataUri: data.audioDataUri || '',
        lyrics: data.lyrics || '',
        coherenceScore: data.coherenceScore || 0.91,
        spectralCentroidHz: data.spectralCentroidHz || 640,
        tempoBpm: data.tempoBpm || 84,
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setTracks(prev => [newTrack, ...prev]);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to generate Lyria soundtrack.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveExpedition = async (track: LyriaTrackRecord) => {
    if (!isAuthenticated) {
      setSaveMessage('Sign in via Observatory Vault first');
      return;
    }
    try {
      setSaveMessage('Saving to Firestore...');
      await saveCosmicExpedition({
        title: track.title,
        clusterId: track.clusterId,
        lens: currentLens,
        notes: `Audio-Visual Coherence C_AV = ${track.coherenceScore} • Centroid ${track.spectralCentroidHz} Hz`,
        lyriaModel: track.model,
        lyriaPrompt: track.prompt,
        lyriaLyrics: track.lyrics,
        coherenceScore: track.coherenceScore
      });
      setSaveMessage('Saved to Firestore Expeditions');
      setTimeout(() => setSaveMessage(null), 2500);
    } catch {
      setSaveMessage('Failed to save');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="hud-panel w-full max-w-4xl max-h-[88vh] rounded-lg flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-[#0A0E17]">
          <div className="flex items-center gap-3">
            <Music className="w-4 h-4 text-amber-400" />
            <div>
              <div className="text-xs font-mono text-amber-400">
                Lyria 3 Cosmic Sonification & Audio-Visual Coherence Studio
              </div>
              <h2 className="text-sm sm:text-base font-display font-semibold text-slate-100">
                lyria-3-clip-preview (30s Probe) · lyria-3-pro-preview (Full Movement)
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

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-[#0B0F19]">
          <form
            onSubmit={handleGenerateTrack}
            className="p-4 rounded-md bg-slate-900/75 border border-white/10 space-y-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setModel('lyria-3-clip-preview')}
                  className={`px-3 py-1.5 rounded text-xs font-medium cursor-pointer ${
                    model === 'lyria-3-clip-preview'
                      ? 'bg-amber-500 text-slate-950 font-semibold'
                      : 'bg-slate-900 text-slate-400 border border-white/10 hover:text-white'
                  }`}
                >
                  lyria-3-clip-preview (30s Clip)
                </button>
                <button
                  type="button"
                  onClick={() => setModel('lyria-3-pro-preview')}
                  className={`px-3 py-1.5 rounded text-xs font-medium cursor-pointer ${
                    model === 'lyria-3-pro-preview'
                      ? 'bg-sky-500 text-slate-950 font-semibold'
                      : 'bg-slate-900 text-slate-400 border border-white/10 hover:text-white'
                  }`}
                >
                  lyria-3-pro-preview (Full Track)
                </button>
              </div>

              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={instrumental}
                  onChange={e => setInstrumental(e.target.checked)}
                  className="accent-amber-400"
                />
                <span>Instrumental Observatory Score</span>
              </label>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[#94A3B8]">
                  ACTIVE SECTOR: <strong className="text-white">{activeCluster?.name}</strong>
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setPrompt(
                      `Astronomical sonification of ${
                        activeCluster?.name || 'Known Universe'
                      }: ${
                        activeCluster?.description || ''
                      }. Modular analog synth, glass harmonica, deep gravitational sub-bass.`
                    )
                  }
                  className="text-[#00F0FF] hover:underline cursor-pointer"
                >
                  Auto-Populate from Active Cosmic Sector
                </button>
              </div>
              <textarea
                rows={2}
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                className="w-full bg-[#03060C] border border-white/20 rounded p-2.5 text-xs font-mono text-white outline-none focus:border-[#FFB800]"
              />
            </div>

            <div className="flex items-center justify-between">
              {saveMessage && (
                <span className="text-xs font-mono text-[#00FF9D]">{saveMessage}</span>
              )}
              <button
                type="submit"
                disabled={isGenerating}
                className="ml-auto flex items-center gap-2 px-5 py-2 rounded bg-[#FFB800] text-[#030508] font-mono text-xs font-bold uppercase cursor-pointer disabled:opacity-50 shadow-[0_0_16px_rgba(255,184,0,0.35)]"
              >
                <Sparkles className="w-4 h-4" />
                <span>
                  {isGenerating
                    ? `Synthesizing via ${model}...`
                    : `Generate ${model} Soundtrack`}
                </span>
              </button>
            </div>
          </form>

          {errorMsg && (
            <div className="p-3 rounded bg-[#FF2A5F]/15 border border-[#FF2A5F]/40 text-xs font-mono text-[#FF2A5F]">
              {errorMsg}
            </div>
          )}

          {/* Generated Tracks List */}
          <div className="space-y-3">
            {tracks.map(track => (
              <div
                key={track.id}
                className="p-4 rounded bg-[#070E1B] border border-white/15 space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-xs font-mono text-[#FFB800] font-bold">
                      {track.title} • {track.createdAt}
                    </div>
                    <div className="text-[11px] font-mono text-[#94A3B8] tabular-nums">
                      Audio-Visual Coherence C_AV ={' '}
                      <strong className="text-[#00FF9D]">{track.coherenceScore}</strong> • Spectral
                      Centroid: {track.spectralCentroidHz} Hz • {track.tempoBpm} BPM
                    </div>
                  </div>

                  <button
                    onClick={() => handleSaveExpedition(track)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#00FF9D]/20 text-[#00FF9D] border border-[#00FF9D]/40 font-mono text-xs font-bold uppercase cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save to Firestore Expedition</span>
                  </button>
                </div>

                {track.audioDataUri && (
                  <audio controls src={track.audioDataUri} className="w-full h-9" />
                )}

                {track.lyrics && (
                  <pre className="p-3 rounded bg-[#03060C] border border-white/10 text-xs font-mono text-slate-300 whitespace-pre-wrap">
                    {track.lyrics}
                  </pre>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LyriaMusicStudio;
