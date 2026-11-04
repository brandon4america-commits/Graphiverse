import React, { useEffect, useState, useRef } from 'react';
import {
  Bot,
  Play,
  Pause,
  FastForward,
  RotateCcw,
  Sparkles,
  MousePointer2,
  CheckCircle2,
  Activity,
  X
} from 'lucide-react';
import { AINavigatorState } from '../types';

interface AINavigatorOverlayProps {
  state: AINavigatorState;
  onTogglePause: () => void;
  onCycleSpeed: () => void;
  onStopNavigator: () => void;
  onResumeNavigator: () => void;
}

export const AINavigatorOverlay: React.FC<AINavigatorOverlayProps> = ({
  state,
  onTogglePause,
  onCycleSpeed,
  onStopNavigator,
  onResumeNavigator
}) => {
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  const [trail, setTrail] = useState<{ x: number; y: number; age: number }[]>([]);
  const rippleCounter = useRef(0);

  // Trigger ripple on click
  useEffect(() => {
    if (state.isClicking) {
      const id = ++rippleCounter.current;
      setRipples(prev => [...prev.slice(-4), { id, x: state.cursorPos.x, y: state.cursorPos.y }]);
      const timer = setTimeout(() => {
        setRipples(prev => prev.filter(r => r.id !== id));
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [state.isClicking, state.cursorPos.x, state.cursorPos.y]);

  // Maintain short motion trail
  useEffect(() => {
    if (!state.isActive || state.isPaused) return;
    setTrail(prev => {
      const newPoint = { x: state.cursorPos.x, y: state.cursorPos.y, age: 0 };
      const updated = prev
        .map(p => ({ ...p, age: p.age + 1 }))
        .filter(p => p.age < 12);
      return [newPoint, ...updated];
    });
  }, [state.cursorPos.x, state.cursorPos.y, state.isActive, state.isPaused]);

  if (!state.isActive && !state.isHumanInterrupted) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 select-none overflow-hidden">
      {/* 1. TOP OPERATOR CONTROL & TELEMETRY BAR */}
      {state.isActive && (
        <div className="pointer-events-auto absolute top-14 left-1/2 -translate-x-1/2 flex items-center gap-3 px-4 py-2 rounded-lg bg-[#040813]/95 border border-[#00F0FF]/40 shadow-[0_0_30px_rgba(0,240,255,0.22)] backdrop-blur-md max-w-4xl w-[94vw] md:w-auto transition-all">
          <div className="flex items-center gap-2.5">
            <div className="relative flex items-center justify-center w-7 h-7 rounded bg-[#00F0FF]/20 border border-[#00F0FF]/60 text-[#00F0FF]">
              <Bot className="w-4 h-4 animate-pulse" />
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#00FF9D] shadow-[0_0_8px_#00FF9D]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono font-bold tracking-wider text-white uppercase">
                  AI-POINTER INTELLIGENCE
                </span>
                <span className="text-[10px] font-mono text-[#00F0FF] bg-[#00F0FF]/15 px-1.5 py-0.2 rounded border border-[#00F0FF]/30">
                  SANDBOX #{state.cycleCount}
                </span>
                {state.isPaused && (
                  <span className="text-[9px] font-mono text-[#FFB800] bg-[#FFB800]/15 px-1.5 py-0.2 rounded border border-[#FFB800]/40">
                    PAUSED
                  </span>
                )}
              </div>
              <div className="text-[10px] font-mono text-[#94A3B8]">
                {state.currentStep.phaseTitle} ({state.currentStep.stepNumber}/{state.currentStep.totalSteps})
              </div>
            </div>
          </div>

          {/* Stepper Dots */}
          <div className="hidden sm:flex items-center gap-1.5 mx-2">
            {Array.from({ length: state.currentStep.totalSteps }).map((_, i) => {
              const active = i + 1 === state.currentStep.stepNumber;
              const completed = i + 1 < state.currentStep.stepNumber;
              return (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    active
                      ? 'w-6 bg-[#00F0FF] shadow-[0_0_10px_#00F0FF]'
                      : completed
                      ? 'w-2 bg-[#00FF9D]'
                      : 'w-2 bg-white/20'
                  }`}
                />
              );
            })}
          </div>

          {/* Control Buttons */}
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={onCycleSpeed}
              className="px-2 py-1 rounded bg-[#091322] border border-white/20 text-[10px] font-mono text-white hover:border-[#00F0FF] transition cursor-pointer flex items-center gap-1"
              title="Toggle Demonstration Speed"
            >
              <FastForward className="w-3 h-3 text-[#00F0FF]" />
              <span>{state.speedMultiplier}x</span>
            </button>

            <button
              onClick={onTogglePause}
              className={`p-1.5 rounded border text-xs transition cursor-pointer ${
                state.isPaused
                  ? 'bg-[#00FF9D]/20 text-[#00FF9D] border-[#00FF9D]/60 hover:bg-[#00FF9D]/30'
                  : 'bg-[#091322] text-white border-white/20 hover:border-[#00F0FF]'
              }`}
              title={state.isPaused ? 'Resume AI Pilot' : 'Pause AI Pilot'}
            >
              {state.isPaused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={onStopNavigator}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#FF2A5F]/20 text-[#FF2A5F] border border-[#FF2A5F]/50 hover:bg-[#FF2A5F]/30 text-[10px] font-mono transition cursor-pointer"
              title="Stop Demonstration (or press ESC / move mouse)"
            >
              <X className="w-3 h-3" />
              <span className="hidden md:inline">Take Control [ESC]</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. HUMAN INTERRUPT STANDBY BANNER */}
      {state.isHumanInterrupted && !state.isActive && (
        <div className="pointer-events-auto absolute top-14 left-1/2 -translate-x-1/2 flex items-center gap-3 px-4 py-2 rounded-lg bg-[#080D1A]/95 border border-[#FFB800]/50 shadow-[0_0_24px_rgba(255,184,0,0.25)] backdrop-blur-md animate-in fade-in slide-in-from-top-2">
          <div className="w-2 h-2 rounded-full bg-[#FFB800] animate-ping" />
          <span className="text-xs font-mono text-white">
            Human input detected · AI Navigator on Standby
          </span>
          <button
            onClick={onResumeNavigator}
            className="flex items-center gap-1.5 px-3 py-1 rounded bg-[#00F0FF] text-[#030508] font-mono font-bold text-xs uppercase tracking-wider hover:bg-[#7CE8FF] transition cursor-pointer shadow-[0_0_12px_rgba(0,240,255,0.4)]"
          >
            <Play className="w-3 h-3 fill-current" />
            Resume Autonomous Demo
          </button>
          <button
            onClick={onStopNavigator}
            className="p-1 text-[#94A3B8] hover:text-white transition cursor-pointer"
            title="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 3. CLICK SHOCKWAVE RIPPLES */}
      {ripples.map(r => (
        <div
          key={r.id}
          className="absolute rounded-full pointer-events-none -translate-x-1/2 -translate-y-1/2 animate-ping"
          style={{
            left: `${r.x}px`,
            top: `${r.y}px`,
            width: '48px',
            height: '48px',
            border: '2px solid #00F0FF',
            backgroundColor: 'rgba(0, 240, 255, 0.25)',
            boxShadow: '0 0 20px #00F0FF'
          }}
        />
      ))}

      {/* 4. MOTION TRAIL SVG */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        {trail.length > 1 && (
          <path
            d={`M ${trail.map(p => `${p.x} ${p.y}`).join(' L ')}`}
            fill="none"
            stroke="url(#trail-gradient)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray="4 3"
            className="opacity-70"
          />
        )}
        <defs>
          <linearGradient id="trail-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00F0FF" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#00F0FF" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>

      {/* 5. VIRTUAL POINTER RETICLE & ACTION BADGE */}
      {state.isActive && (
        <div
          className="absolute pointer-events-none -translate-x-1/2 -translate-y-1/2 transition-transform duration-75 ease-out"
          style={{
            left: `${state.cursorPos.x}px`,
            top: `${state.cursorPos.y}px`,
            transform: `translate(-50%, -50%) scale(${state.isClicking ? 0.88 : 1})`
          }}
        >
          {/* Main Reticle SVG */}
          <div className="relative w-12 h-12 flex items-center justify-center">
            {/* Outer rotating ring */}
            <div
              className={`absolute inset-0 rounded-full border border-dashed border-[#00F0FF] ${
                state.isClicking ? 'scale-125 border-[#00FF9D]' : 'animate-spin'
              }`}
              style={{ animationDuration: '6s' }}
            />

            {/* Inner target circle */}
            <div
              className={`w-6 h-6 rounded-full border ${
                state.isClicking
                  ? 'border-[#00FF9D] bg-[#00FF9D]/30 shadow-[0_0_18px_#00FF9D]'
                  : 'border-[#00F0FF] bg-[#00F0FF]/15 shadow-[0_0_14px_#00F0FF]'
              } flex items-center justify-center transition-colors`}
            >
              {/* Center crosshair dot */}
              <div
                className={`w-1.5 h-1.5 rounded-full ${
                  state.isClicking ? 'bg-[#00FF9D]' : 'bg-[#00F0FF]'
                }`}
              />
            </div>

            {/* Crosshairs */}
            <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-0.5 bg-[#00F0FF]/40 pointer-events-none" />
            <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-[#00F0FF]/40 pointer-events-none" />
          </div>

          {/* Action Badge attached to cursor */}
          <div className="absolute left-9 top-1 pointer-events-none whitespace-nowrap">
            {/* Diagonal leader line */}
            <div className="w-6 h-4 border-b border-l border-[#00F0FF]/60 -mt-2 -ml-2" />

            <div className="px-2.5 py-1 rounded bg-[#030814]/90 border border-[#00F0FF]/60 text-white shadow-[0_0_16px_rgba(0,240,255,0.3)] backdrop-blur-sm -mt-2 ml-4">
              <div className="flex items-center gap-1.5 text-[9px] font-mono text-[#00F0FF] font-semibold uppercase tracking-wider">
                <Activity className="w-2.5 h-2.5 animate-pulse" />
                <span>{state.currentStep.actionBadge}</span>
              </div>
              <div className="text-[10px] font-mono text-[#E2E8F0] font-medium">
                {state.currentStep.targetDescription}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. HOLOGRAPHIC OPERATIONAL SUBTITLE CARD */}
      {state.isActive && (
        <div className="pointer-events-auto absolute bottom-24 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 animate-in fade-in slide-in-from-bottom-3 duration-300">
          <div className="p-3.5 sm:p-4 rounded-lg bg-[#030712]/92 border border-[#00F0FF]/45 shadow-[0_0_30px_rgba(0,240,255,0.25)] backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-[#00F0FF]/20 pb-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00F0FF] shadow-[0_0_6px_#00F0FF]" />
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#00F0FF]">
                  AI OPERATOR TELEMETRY // {state.currentStep.phaseTitle}
                </span>
              </div>
              <span className="text-[10px] font-mono text-[#94A3B8]">
                TARGET: {state.currentStep.targetDescription}
              </span>
            </div>

            <p className="text-xs sm:text-sm font-mono text-white leading-relaxed font-medium">
              “{state.currentStep.rationaleSubtitle}”
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AINavigatorOverlay;
