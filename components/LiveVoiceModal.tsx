import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Radio, Send, Volume2, X } from 'lucide-react';

interface LiveVoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TranscriptEntry {
  id: string;
  speaker: 'USER' | 'GEMINI_LIVE';
  text: string;
}

const LiveVoiceModal: React.FC<LiveVoiceModalProps> = ({ isOpen, onClose }) => {
  const [status, setStatus] = useState<'IDLE' | 'CONNECTING' | 'LIVE' | 'ERROR'>('IDLE');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [transcripts, setTranscripts] = useState<TranscriptEntry[]>([]);
  const [textPrompt, setTextPrompt] = useState('');

  const wsRef = useRef<WebSocket | null>(null);
  const captureCtxRef = useRef<AudioContext | null>(null);
  const playbackCtxRef = useRef<AudioContext | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const nextStartTimeRef = useRef<number>(0);

  const stopSession = () => {
    try {
      wsRef.current?.close();
    } catch {
      // ignore
    }
    wsRef.current = null;

    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(t => t.stop());
      micStreamRef.current = null;
    }

    captureCtxRef.current?.close().catch(() => {});
    captureCtxRef.current = null;

    playbackCtxRef.current?.close().catch(() => {});
    playbackCtxRef.current = null;

    setStatus('IDLE');
  };

  useEffect(() => {
    if (!isOpen) {
      stopSession();
    }
    return () => {
      stopSession();
    };
  }, [isOpen]);

  const schedulePcm24kPlayback = (base64Pcm: string) => {
    const playCtx = playbackCtxRef.current;
    if (!playCtx) return;

    const binary = atob(base64Pcm);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    const int16 = new Int16Array(bytes.buffer);
    const float32 = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) {
      float32[i] = int16[i] / 32768;
    }

    const audioBuffer = playCtx.createBuffer(1, float32.length, 24000);
    audioBuffer.getChannelData(0).set(float32);

    const source = playCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(playCtx.destination);

    const startTime = Math.max(playCtx.currentTime, nextStartTimeRef.current);
    source.start(startTime);
    nextStartTimeRef.current = startTime + audioBuffer.duration;
  };

  const startLiveSession = async () => {
    setErrorMsg(null);
    setStatus('CONNECTING');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        }
      });
      micStreamRef.current = stream;

      const captureCtx = new AudioContext({ sampleRate: 16000 });
      captureCtxRef.current = captureCtx;

      const playCtx = new AudioContext({ sampleRate: 24000 });
      playbackCtxRef.current = playCtx;
      nextStartTimeRef.current = playCtx.currentTime;

      const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${proto}//${window.location.host}/ws/live`);
      wsRef.current = ws;

      ws.onopen = () => {
        setStatus('LIVE');

        const source = captureCtx.createMediaStreamSource(stream);
        const processor = captureCtx.createScriptProcessor(4096, 1, 1);

        processor.onaudioprocess = e => {
          if (ws.readyState !== WebSocket.OPEN) return;
          const inputData = e.inputBuffer.getChannelData(0);
          const pcm16 = new Int16Array(inputData.length);
          for (let i = 0; i < inputData.length; i++) {
            const s = Math.max(-1, Math.min(1, inputData[i]));
            pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
          }
          const uint8 = new Uint8Array(pcm16.buffer);
          let binary = '';
          for (let i = 0; i < uint8.length; i++) {
            binary += String.fromCharCode(uint8[i]);
          }
          ws.send(
            JSON.stringify({
              type: 'audio',
              data: btoa(binary)
            })
          );
        };

        source.connect(processor);
        processor.connect(captureCtx.destination);
      };

      ws.onmessage = evt => {
        try {
          const msg = JSON.parse(evt.data);
          if (msg.type === 'audio' && msg.data) {
            schedulePcm24kPlayback(msg.data);
          } else if (msg.type === 'inputTranscription' && msg.text) {
            setTranscripts(prev => [
              ...prev,
              { id: `in-${Date.now()}-${Math.random()}`, speaker: 'USER', text: msg.text }
            ]);
          } else if (msg.type === 'outputTranscription' && msg.text) {
            setTranscripts(prev => [
              ...prev,
              { id: `out-${Date.now()}-${Math.random()}`, speaker: 'GEMINI_LIVE', text: msg.text }
            ]);
          } else if (msg.type === 'interrupted') {
            if (playbackCtxRef.current) {
              nextStartTimeRef.current = playbackCtxRef.current.currentTime;
            }
          } else if (msg.type === 'error') {
            setErrorMsg(msg.message || 'Live voice link anomaly');
            setStatus('ERROR');
          }
        } catch {
          // ignore
        }
      };

      ws.onerror = () => {
        setErrorMsg('WebSocket voice bridge connection error.');
        setStatus('ERROR');
      };

      ws.onclose = () => {
        setStatus('IDLE');
      };
    } catch (err: any) {
      setErrorMsg(err?.message || 'Microphone access or Live session initialization failed.');
      setStatus('ERROR');
    }
  };

  const handleSendTextTurn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textPrompt.trim() || wsRef.current?.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ type: 'text', text: textPrompt.trim() }));
    setTranscripts(prev => [
      ...prev,
      { id: `u-${Date.now()}`, speaker: 'USER', text: textPrompt.trim() }
    ]);
    setTextPrompt('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="hud-panel w-full max-w-2xl rounded-lg flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-[#0A0E17]">
          <div className="flex items-center gap-3">
            <Radio className="w-4 h-4 text-sky-400" />
            <div>
              <div className="text-xs font-mono text-sky-400">
                Gemini 3.8 Live · Real-Time Full-Duplex Voice Link
              </div>
              <h2 className="text-sm sm:text-base font-display font-semibold text-slate-100">
                16kHz PCM Uplink · 24kHz Gapless Audio Downlink
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
        <div className="p-5 space-y-4 bg-[#0B0F19]">
          <div className="flex items-center justify-between p-4 rounded-md bg-slate-900/80 border border-white/10">
            <div className="flex items-center gap-3">
              <div
                className={`w-2.5 h-2.5 rounded-full ${
                  status === 'LIVE'
                    ? 'bg-emerald-400'
                    : status === 'CONNECTING'
                    ? 'bg-amber-400'
                    : 'bg-slate-600'
                }`}
              />
              <div>
                <div className="text-xs font-mono font-semibold text-slate-100">
                  Status: {status}
                </div>
                <div className="text-[11px] font-mono text-slate-400">
                  gemini-3.8-live · Voice: Kore · Low-Latency WebSocket
                </div>
              </div>
            </div>

            {status === 'LIVE' ? (
              <button
                onClick={stopSession}
                className="flex items-center gap-2 px-4 py-2 rounded bg-rose-500 text-white text-xs font-semibold cursor-pointer"
              >
                <MicOff className="w-4 h-4" />
                <span>End Voice Link</span>
              </button>
            ) : (
              <button
                onClick={startLiveSession}
                disabled={status === 'CONNECTING'}
                className="flex items-center gap-2 px-4 py-2 rounded bg-sky-500 text-slate-950 text-xs font-semibold hover:bg-sky-400 cursor-pointer disabled:opacity-50"
              >
                <Mic className="w-4 h-4" />
                <span>{status === 'CONNECTING' ? 'Connecting...' : 'Start Live Voice'}</span>
              </button>
            )}
          </div>

          {errorMsg && (
            <div className="p-3 rounded bg-[#FF2A5F]/15 border border-[#FF2A5F]/40 text-xs font-mono text-[#FF2A5F]">
              {errorMsg}
            </div>
          )}

          {/* Transcript Log */}
          <div className="h-64 overflow-y-auto p-3.5 rounded bg-[#03060C] border border-white/10 space-y-2 font-mono text-xs">
            {transcripts.length === 0 ? (
              <div className="h-full flex items-center justify-center text-center text-[#94A3B8]">
                Click “Start Live Voice Comms” and speak into your microphone, or send a live text prompt below to converse with the Observatory Voice Director in real time.
              </div>
            ) : (
              transcripts.map(t => (
                <div
                  key={t.id}
                  className={`p-2 rounded ${
                    t.speaker === 'USER'
                      ? 'bg-[#00F0FF]/15 text-[#00F0FF]'
                      : 'bg-[#081222] text-white border border-white/10'
                  }`}
                >
                  <span className="font-bold mr-2">[{t.speaker}]:</span>
                  <span>{t.text}</span>
                </div>
              ))
            )}
          </div>

          {/* Text Turn Input over Live Session */}
          <form onSubmit={handleSendTextTurn} className="flex gap-2">
            <input
              type="text"
              value={textPrompt}
              onChange={e => setTextPrompt(e.target.value)}
              disabled={status !== 'LIVE'}
              placeholder={
                status === 'LIVE'
                  ? 'Send a live text cue to the active voice session...'
                  : 'Start Live Voice Comms first to enable real-time turns'
              }
              className="flex-1 bg-[#03060C] border border-white/20 rounded px-3 py-2 text-xs font-mono text-white disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={status !== 'LIVE'}
              className="px-4 py-2 rounded bg-[#00F0FF] text-[#030508] font-mono text-xs font-bold uppercase disabled:opacity-40 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5 inline mr-1" />
              Speak Prompt
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LiveVoiceModal;
