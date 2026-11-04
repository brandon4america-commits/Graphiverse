import React, { useEffect, useRef, useState } from 'react';
import {
  MessageSquare,
  Send,
  Globe,
  Save,
  ExternalLink,
  Plus,
  Sparkles,
  X
} from 'lucide-react';
import {
  AcademicCitation,
  ChatMessage,
  GeminiChatModel,
  GraphData,
  ResearchPersona
} from '../types';
import { saveChatSession } from '../services/firebase';

interface CosmicChatbotProps {
  isOpen: boolean;
  onClose: () => void;
  graphData: GraphData;
  isAuthenticated: boolean;
  onCiteInWhitepaper: (citation: AcademicCitation) => void;
}

const CosmicChatbot: React.FC<CosmicChatbotProps> = ({
  isOpen,
  onClose,
  graphData,
  isAuthenticated,
  onCiteInWhitepaper
}) => {
  const [model, setModel] = useState<GeminiChatModel>('gemini-3.8-flash');
  const [persona, setPersona] = useState<ResearchPersona>('ASTROBIOLOGIST');
  const [useSearchGrounding, setUseSearchGrounding] = useState(true);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-init',
      role: 'model',
      text: 'Known Universe Multi-Turn Research Console online. Select Gemini 4 Argon for deep theoretical/whitepaper synthesis, Gemini 3.8 Flash with Google Search Grounding for live observational verification, or Gemini 3.1 Flash-Lite for rapid telemetry.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      model: 'gemini-3.8-flash'
    }
  ]);

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!isOpen) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      text: input.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput('');
    setIsLoading(true);

    try {
      const graphSummary = graphData.nodes
        .map(
          n =>
            `- [${n.type}] ${n.label} (Sector: ${n.clusterId}, Dist: ${
              n.distanceLabel || 'N/A'
            }, CID: ${n.pubchemCid || 'N/A'}, UniProt: ${n.uniprotId || 'N/A'})`
        )
        .join('\n');

      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextMessages.map(m => ({ role: m.role, text: m.text })),
          model,
          persona,
          useSearchGrounding: model === 'gemini-3.8-flash' && useSearchGrounding,
          graphSummary
        })
      });

      const data = await res.json();
      const modelMsg: ChatMessage = {
        id: `m-${Date.now()}`,
        role: 'model',
        text: data.text || data.error || 'Response synthesized.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        model,
        citations: data.citations || []
      };
      setMessages(prev => [...prev, modelMsg]);
    } catch {
      setMessages(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'model',
          text: 'Transient link interruption while communicating with Gemini research backend.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveThread = async () => {
    if (!isAuthenticated) {
      setSaveStatus('Sign in via Observatory Vault first');
      return;
    }
    try {
      setSaveStatus('Saving...');
      await saveChatSession({
        title: `${persona} Session (${messages.length} turns)`,
        model,
        persona,
        messagesJson: JSON.stringify(messages),
        messageCount: messages.length
      });
      setSaveStatus('Saved to Firestore Vault');
      setTimeout(() => setSaveStatus(null), 2500);
    } catch {
      setSaveStatus('Failed to save');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-3 sm:p-6">
      <div className="hud-panel w-full max-w-4xl h-[85vh] rounded-lg flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-[#0A0E17]">
          <div className="flex items-center gap-3">
            <MessageSquare className="w-4 h-4 text-sky-400" />
            <div>
              <div className="text-xs font-mono text-sky-400">
                Multi-Turn Gemini Research Console · Search Grounding
              </div>
              <h2 className="text-sm sm:text-base font-display font-semibold text-slate-100">
                Gemini 4 Argon · Gemini 3.8 Flash · Gemini 3.1 Flash-Lite
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveThread}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-xs font-medium cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saveStatus || 'Save Thread'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded text-slate-400 hover:text-white border border-white/10 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Control Toolbar */}
        <div className="px-5 py-2.5 bg-[#0B0F19] border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-mono text-slate-400 mr-1">Model:</span>
            {(
              [
                { id: 'gemini-4-argon', label: 'Gemini 4 Argon' },
                { id: 'gemini-3.8-flash', label: 'Gemini 3.8 Flash (+Search)' },
                { id: 'gemini-3.1-flash-lite', label: 'Gemini 3.1 Flash-Lite' }
              ] as { id: GeminiChatModel; label: string }[]
            ).map(m => (
              <button
                key={m.id}
                onClick={() => setModel(m.id)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition cursor-pointer ${
                  model === m.id
                    ? 'bg-sky-500 text-slate-950 font-semibold'
                    : 'bg-slate-900 text-slate-400 border border-white/10 hover:text-white'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <select
              value={persona}
              onChange={e => setPersona(e.target.value as ResearchPersona)}
              className="bg-slate-900 border border-white/15 rounded px-2.5 py-1 text-xs text-slate-200"
            >
              <option value="COSMOLOGIST">Persona: Observational Cosmologist</option>
              <option value="ASTROBIOLOGIST">Persona: Molecular Astrobiologist</option>
              <option value="EPISTEMIC_AUDITOR">Persona: Epistemic Auditor</option>
              <option value="WHITEPAPER_COAUTHOR">Persona: Whitepaper Co-Author</option>
            </select>

            {model === 'gemini-3.8-flash' && (
              <button
                onClick={() => setUseSearchGrounding(prev => !prev)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium border cursor-pointer ${
                  useSearchGrounding
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                    : 'bg-slate-900 text-slate-400 border-white/10'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Search: {useSearchGrounding ? 'On' : 'Off'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Message Thread */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex flex-col ${
                msg.role === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              <div
                className={`max-w-3xl p-4 rounded space-y-2 ${
                  msg.role === 'user'
                    ? 'bg-[#00F0FF]/15 border border-[#00F0FF]/40 text-white'
                    : 'bg-[#070E1B] border border-white/15 text-slate-100'
                }`}
              >
                <div className="flex items-center justify-between gap-4 text-[10px] font-mono text-[#94A3B8]">
                  <span className="text-[#00F0FF] font-bold">
                    {msg.role === 'user' ? 'RESEARCHER' : `${persona} (${msg.model || model})`}
                  </span>
                  <span>{msg.timestamp}</span>
                </div>

                <div className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">
                  {msg.text}
                </div>

                {/* Web Search Grounding Citations */}
                {msg.citations && msg.citations.length > 0 && (
                  <div className="pt-2 border-t border-white/10 space-y-1.5">
                    <div className="text-[10px] font-mono uppercase text-[#00FF9D] flex items-center gap-1">
                      <Globe className="w-3 h-3" />
                      <span>GOOGLE SEARCH GROUNDED CITATIONS:</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.citations.map((cit, idx) => (
                        <div
                          key={idx}
                          className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-[#040811] border border-[#00FF9D]/30 text-[10px] font-mono"
                        >
                          <a
                            href={cit.uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#00F0FF] hover:underline flex items-center gap-1 max-w-[220px] truncate"
                          >
                            <span className="truncate">{cit.title}</span>
                            <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                          </a>
                          <button
                            onClick={() =>
                              onCiteInWhitepaper({
                                id: `web-${Date.now()}-${idx}`,
                                authors: 'Google Search Grounded Telemetry',
                                year: new Date().getFullYear(),
                                title: cit.title,
                                venue: 'Web Grounded Scientific Source',
                                doiOrUrl: cit.uri,
                                bibtexKey: `grounding_${Date.now().toString().slice(-4)}`,
                                sourceDatabase: 'WEB_GROUNDING'
                              })
                            }
                            className="text-[#00FF9D] hover:text-white cursor-pointer"
                            title="Add citation to Whitepaper Bibliography"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input Form */}
        <form
          onSubmit={handleSend}
          className="p-4 border-t border-white/10 bg-[#050A14] flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask about K2-18b DMS spectra, Tardigrade Dsup pLDDT, Laniakea peculiar velocities, or LaTeX derivations..."
            className="flex-1 bg-[#03060C] border border-white/20 rounded px-3.5 py-2.5 text-xs sm:text-sm font-mono text-white outline-none focus:border-[#00F0FF]"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded bg-[#00F0FF] text-[#030508] font-mono text-xs font-bold uppercase cursor-pointer disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isLoading ? 'Synthesizing...' : 'Send'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default CosmicChatbot;
