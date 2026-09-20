"use client";

import React, { useState } from "react";
import { DrawEngine, GolferEntry, DrawExecutionResult } from "@/lib/drawEngine";
import { ShieldCheck, PlayCircle, Award, Check, X } from "lucide-react";

export default function AdminPage() {
  const [mode, setMode] = useState<"random" | "algorithmic">("random");
  const [simulation, setSimulation] = useState<DrawExecutionResult | null>(null);

  // Mock player entry pool for verification and testing
  const mockEntries: GolferEntry[] = [
    { userId: "usr_101", scores: [12, 23, 34, 40, 42] },
    { userId: "usr_102", scores: [18, 22, 23, 34, 45] },
    { userId: "usr_103", scores: [10, 15, 20, 25, 30] },
    { userId: "usr_104", scores: [12, 23, 34, 40, 11] },
  ];

  const handleSimulate = () => {
    // 250 Active Subscribers, $25 pool allocation, $850 previous rollover
    const pool = DrawEngine.calculatePool(250, 25, 850);
    const winningNumbers = DrawEngine.generateNumbers(mode, mockEntries);
    const result = DrawEngine.executeDraw(winningNumbers, mockEntries, pool);
    setSimulation(result);
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <header className="border-b border-slate-800 pb-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-black tracking-wide text-white uppercase">Platform Administrator Control</h1>
            <p className="text-xs text-slate-400">PRD 2026 Engine & Simulation Interface</p>
          </div>
          <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono rounded-lg">
            Role: SuperAdmin
          </span>
        </header>

        {/* Draw Config & Simulator */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <PlayCircle className="w-5 h-5 text-emerald-400" />
              Monthly Prize Pool Engine
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <label className="text-xs font-semibold text-slate-300">Mode:</label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as "random" | "algorithmic")}
              className="bg-slate-950 border border-slate-800 text-xs rounded-xl px-4 py-2 text-slate-200 focus:outline-none"
            >
              <option value="random">Standard Random Style</option>
              <option value="algorithmic">Algorithmic (Score-Frequency Weighted)</option>
            </select>
            <button
              onClick={handleSimulate}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs transition"
            >
              Simulate Draw
            </button>
          </div>

          {simulation && (
            <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-6 space-y-6">
              <div>
                <span className="text-xs text-slate-400 block mb-2">Simulated Winning Stableford Numbers:</span>
                <div className="flex gap-3">
                  {simulation.winningNumbers.map((num: number) => (
                    <div
                      key={num}
                      className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-500/50 flex items-center justify-center font-mono font-bold text-emerald-400"
                    >
                      {num}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
                  <span className="text-slate-400 block font-semibold">Tier 5 (40% + Rollover)</span>
                  <p className="text-lg font-bold text-white mt-1">{simulation.tier5.winners.length} Winners</p>
                  <p className="text-emerald-400 font-mono">${simulation.tier5.perWinner.toFixed(2)} each</p>
                  {simulation.tier5.rolloverNextMonth > 0 && (
                    <span className="text-[10px] text-amber-400 block mt-1">
                      Unclaimed: ${simulation.tier5.rolloverNextMonth.toFixed(2)} rolls over
                    </span>
                  )}
                </div>

                <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
                  <span className="text-slate-400 block font-semibold">Tier 4 (35%)</span>
                  <p className="text-lg font-bold text-white mt-1">{simulation.tier4.winners.length} Winners</p>
                  <p className="text-emerald-400 font-mono">${simulation.tier4.perWinner.toFixed(2)} each</p>
                </div>

                <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
                  <span className="text-slate-400 block font-semibold">Tier 3 (25%)</span>
                  <p className="text-lg font-bold text-white mt-1">{simulation.tier3.winners.length} Winners</p>
                  <p className="text-emerald-400 font-mono">${simulation.tier3.perWinner.toFixed(2)} each</p>
                </div>
              </div>

              <button
                onClick={() => alert("Results committed to public draw directory.")}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-6 py-2.5 rounded-xl text-xs transition"
              >
                Publish Official Results
              </button>
            </div>
          )}
        </div>

        {/* Winner Verification Queue */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6">
          <h2 className="text-base font-bold text-white flex items-center gap-2 mb-4">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            Winner Verification Queue
          </h2>
          <div className="divide-y divide-slate-800 text-xs">
            <div className="py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <p className="font-bold text-slate-200">Golfer ID: usr_104 (Tier 4 Winner — 4 Matches)</p>
                <span className="text-emerald-400 underline cursor-pointer">View Club Handicap Screenshot.png</span>
              </div>
              <div className="flex gap-2">
                <button className="flex items-center gap-1 bg-emerald-500 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs">
                  <Check className="w-3.5 h-3.5" /> Approve Payout
                </button>
                <button className="flex items-center gap-1 border border-red-500/40 text-red-400 hover:bg-red-500/10 px-3 py-1.5 rounded-lg text-xs">
                  <X className="w-3.5 h-3.5" /> Reject
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
