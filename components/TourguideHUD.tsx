import React, { useState } from 'react';
import { Bot, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';

interface TourguideHUDProps {
  onAgentCommand: (command: string) => void;
}

export const TourguideHUD: React.FC<TourguideHUDProps> = ({ onAgentCommand }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [prompt, setPrompt] = useState('');
  const [output, setOutput] = useState('Agentic system ready.');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!prompt) return;
    setIsLoading(true);
    try {
      const response = await fetch('/api/agent/interact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const data = await response.json();
      setOutput(data.output || 'No response.');
      onAgentCommand(data.output);
    } catch (e) {
      setOutput('Error interacting with agent.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`fixed right-4 top-20 w-80 bg-slate-900/90 border border-slate-700 rounded-lg p-4 text-white shadow-xl backdrop-blur-md transition-all ${isOpen ? 'h-96' : 'h-14'}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 font-semibold">
          <Bot size={20} />
          Tourguide Agent
        </div>
        <button onClick={() => setIsOpen(!isOpen)} className="text-slate-400 hover:text-white">
          {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
      </div>

      {isOpen && (
        <div className="flex flex-col h-[calc(100%-2rem)]">
          <div className="flex-1 bg-slate-950 rounded p-2 text-xs overflow-y-auto mb-4 border border-slate-800">
            {isLoading ? <Loader2 className="animate-spin" /> : output}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Guide me..."
              className="flex-1 bg-slate-800 border border-slate-700 rounded p-2 text-sm text-white"
            />
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="bg-sky-600 hover:bg-sky-500 rounded px-3 py-1 text-sm text-white transition-colors"
            >
              Ask
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
