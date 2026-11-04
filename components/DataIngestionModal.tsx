import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  GitBranch,
  FileSpreadsheet,
  FileJson,
  Sparkles,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

interface DataIngestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
  onIngestZip: (file: File) => Promise<void>;
  onIngestGitHub: (repoUrl: string) => Promise<void>;
  onIngestCsv: (csvText: string) => Promise<void>;
  onIngestJson: (jsonText: string) => Promise<void>;
}

type IngestTab = 'GITHUB' | 'ZIP' | 'CSV' | 'JSON';

const SAMPLE_CSV = `id,type,cluster,label,description,source,confidence
c1,CLAIM,Quantum Core,Topological Qubit Error Suppression,Braided non-Abelian anyons suppress phase-flip errors by 94%,Nature Physics 2026,0.93
e1,EVIDENCE,Quantum Core,400ns Syndrome Extraction Benchmark,Sub-microsecond decoder verified across 64 logical qubits,IBM Quantum Roadmap,0.91
x1,CONTRADICTION,Cryo Control,Quasiparticle Poisoning Bursts,Cosmic-ray muons trigger correlated decoherence spikes at 15mK,IEEE Cryogenics,0.86
q1,QUESTION,Cryo Control,Lead-Shielded Dilution Mitigation,Can underground shielding eliminate correlated muon bursts?,Fermilab QIS Study,0.79`;

const SAMPLE_GITHUB_REPOS = [
  'https://github.com/mrdoob/three.js',
  'https://github.com/expressjs/express',
  'https://github.com/pmndrs/zustand'
];

const DataIngestionModal: React.FC<DataIngestionModalProps> = ({
  isOpen,
  onClose,
  isLoading,
  onIngestZip,
  onIngestGitHub,
  onIngestCsv,
  onIngestJson
}) => {
  const [activeTab, setActiveTab] = useState<IngestTab>('GITHUB');
  const [githubUrl, setGithubUrl] = useState('https://github.com/expressjs/express');
  const [csvText, setCsvText] = useState(SAMPLE_CSV);
  const [jsonText, setJsonText] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const zipInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleGitHubSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!githubUrl.trim()) return;
    setErrorMessage(null);
    try {
      await onIngestGitHub(githubUrl.trim());
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to ingest GitHub repository.');
    }
  };

  const handleZipFile = async (file: File) => {
    setErrorMessage(null);
    try {
      await onIngestZip(file);
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to parse ZIP archive.');
    }
  };

  const handleCsvSubmit = async () => {
    if (!csvText.trim()) return;
    setErrorMessage(null);
    try {
      await onIngestCsv(csvText);
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to synthesize CSV dataset.');
    }
  };

  const handleJsonSubmit = async () => {
    if (!jsonText.trim()) return;
    setErrorMessage(null);
    try {
      await onIngestJson(jsonText);
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to parse JSON payload.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl rounded-lg hud-panel overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0A0E17]">
          <div>
            <div className="text-xs font-mono text-sky-400">
              Multi-Source Topology Ingestion
            </div>
            <h2 className="font-display text-lg font-semibold text-slate-100 tracking-tight mt-0.5">
              Map External Data Into 3D Knowledge Atlas
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Segmented Control Tabs */}
        <div className="flex items-center gap-1 px-6 pt-2.5 border-b border-white/10 bg-[#0B0F19]">
          {[
            { id: 'GITHUB' as IngestTab, label: 'GitHub Repo URL', icon: GitBranch },
            { id: 'ZIP' as IngestTab, label: 'ZIP Archive', icon: Upload },
            { id: 'CSV' as IngestTab, label: 'CSV Table', icon: FileSpreadsheet },
            { id: 'JSON' as IngestTab, label: 'JSON Schema', icon: FileJson }
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setErrorMessage(null);
                }}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium border-b-2 transition cursor-pointer whitespace-nowrap ${
                  active
                    ? 'border-sky-400 text-sky-400 bg-sky-500/10'
                    : 'border-transparent text-slate-400 hover:text-slate-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 bg-[#0B0F19]">
          {errorMessage && (
            <div className="flex items-start gap-3 p-3.5 rounded bg-rose-500/15 border border-rose-500/40 text-xs text-slate-100">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {activeTab === 'GITHUB' && (
            <form onSubmit={handleGitHubSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase text-[#94A3B8] mb-2">
                  Public GitHub Repository URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={githubUrl}
                    onChange={e => setGithubUrl(e.target.value)}
                    placeholder="https://github.com/owner/repository"
                    className="flex-1 px-3.5 py-2.5 rounded bg-[#030508] border border-white/20 text-sm text-white font-mono focus:outline-none focus:border-[#00F0FF]"
                    required
                  />
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-5 py-2.5 rounded bg-[#00F0FF] text-[#030508] font-mono font-bold text-xs uppercase disabled:opacity-50 transition flex items-center gap-2 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>{isLoading ? 'Mapping...' : 'Map Repository'}</span>
                  </button>
                </div>
              </div>

              <div>
                <div className="text-xs font-mono text-[#94A3B8] mb-2">
                  QUICK-LOAD VERIFIED REPOSITORIES:
                </div>
                <div className="flex flex-wrap gap-2">
                  {SAMPLE_GITHUB_REPOS.map(repo => (
                    <button
                      key={repo}
                      type="button"
                      onClick={() => setGithubUrl(repo)}
                      className="px-3 py-1.5 rounded bg-[#09111E] hover:border-[#00F0FF] border border-white/15 text-xs font-mono text-white transition cursor-pointer"
                    >
                      {repo.replace('https://github.com/', '')}
                    </button>
                  ))}
                </div>
              </div>
            </form>
          )}

          {activeTab === 'ZIP' && (
            <div className="space-y-4">
              <input
                ref={zipInputRef}
                type="file"
                accept=".zip"
                className="hidden"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) handleZipFile(file);
                }}
              />
              <div
                onClick={() => !isLoading && zipInputRef.current?.click()}
                className="border-2 border-dashed border-[#00F0FF]/40 hover:border-[#00F0FF] rounded p-10 text-center cursor-pointer transition bg-[#040811]"
              >
                <Upload className="w-8 h-8 text-[#00F0FF] mx-auto mb-3" />
                <div className="text-sm font-bold text-white">
                  {isLoading
                    ? 'Extracting Archive & Synthesizing 3D Graph...'
                    : 'Select a .ZIP Codebase or Research Dossier'}
                </div>
                <p className="text-xs text-[#94A3B8] mt-1">
                  Client-side JSZip extraction inspects source files, markdown notes, and JSON
                  manifests.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'CSV' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono uppercase text-[#94A3B8]">
                  CSV Node / Edge Dataset
                </label>
                <input
                  ref={csvInputRef}
                  type="file"
                  accept=".csv,.txt"
                  className="hidden"
                  onChange={async e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const text = await file.text();
                      setCsvText(text);
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => csvInputRef.current?.click()}
                  className="px-3 py-1 rounded bg-[#0A1322] border border-white/20 text-xs font-mono text-white hover:border-[#00F0FF] cursor-pointer"
                >
                  Load .CSV File
                </button>
              </div>
              <textarea
                rows={7}
                value={csvText}
                onChange={e => setCsvText(e.target.value)}
                className="w-full p-3.5 rounded bg-[#030508] border border-white/20 text-xs font-mono text-white focus:outline-none focus:border-[#00F0FF]"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  disabled={isLoading || !csvText.trim()}
                  onClick={handleCsvSubmit}
                  className="px-5 py-2.5 rounded bg-[#00F0FF] text-[#030508] font-mono font-bold text-xs uppercase disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isLoading ? 'Synthesizing...' : 'Synthesize CSV Graph'}</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'JSON' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono uppercase text-[#94A3B8]">
                  JSON Graph Schema or Structured Payload
                </label>
                <input
                  ref={jsonInputRef}
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={async e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const text = await file.text();
                      setJsonText(text);
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => jsonInputRef.current?.click()}
                  className="px-3 py-1 rounded bg-[#0A1322] border border-white/20 text-xs font-mono text-white hover:border-[#00F0FF] cursor-pointer"
                >
                  Upload .JSON File
                </button>
              </div>
              <textarea
                rows={7}
                value={jsonText}
                onChange={e => setJsonText(e.target.value)}
                className="w-full p-3.5 rounded bg-[#030508] border border-white/20 text-xs font-mono text-white focus:outline-none focus:border-[#00F0FF]"
                placeholder='Paste GraphData JSON ({ "nodes": [...], "clusters": [...] }) or any JSON document...'
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  disabled={isLoading || !jsonText.trim()}
                  onClick={handleJsonSubmit}
                  className="px-5 py-2.5 rounded bg-[#00F0FF] text-[#030508] font-mono font-bold text-xs uppercase disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isLoading ? 'Mapping...' : 'Load JSON Topology'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DataIngestionModal;
