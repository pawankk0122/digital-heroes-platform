"use client";
import React, { useState } from "react";
import { Award, Calendar, Heart, UploadCloud, CheckCircle, AlertTriangle } from "lucide-react";

interface ScoreEntry {
  id: string;
  date: string;
  score: number;
}

export default function UserDashboardPage() {
  const [subscription] = useState({
    status: "active",
    plan: "Yearly Member (Discounted)",
    renewalDate: "April 15, 2026",
  });

  const [scores, setScores] = useState<ScoreEntry[]>([
    { id: "s1", date: "2026-03-10", score: 39 },
    { id: "s2", date: "2026-03-02", score: 42 },
    { id: "s3", date: "2026-02-22", score: 36 },
    { id: "s4", date: "2026-02-15", score: 40 },
    { id: "s5", date: "2026-02-01", score: 34 },
  ]);

  const [newScore, setNewScore] = useState<string>("");
  const [newDate, setNewDate] = useState<string>("");
  const [charityPercent, setCharityPercent] = useState<number>(15);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);

  const handleAddScore = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const val = parseInt(newScore, 10);
    if (isNaN(val) || val < 1 || val > 45) {
      setErrorMsg("Stableford scores must be between 1 and 45.");
      return;
    }

    if (scores.some((s) => s.date === newDate)) {
      setErrorMsg("Duplicate date detected. Only one score per date is permitted.");
      return;
    }

    const updated = [
      { id: Date.now().toString(), date: newDate, score: val },
      ...scores,
    ]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5); // Retain strictly latest 5

    setScores(updated);
    setNewScore("");
    setNewDate("");
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 p-6 md:p-12">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Subscription Banner */}
        <section className="bg-slate-900/80 backdrop-blur border border-slate-800 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs uppercase tracking-widest text-emerald-400 font-semibold">
                {subscription.status}
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white mt-1">Player Mission Control</h1>
            <p className="text-sm text-slate-400">{subscription.plan} • Renews {subscription.renewalDate}</p>
          </div>
          <div className="bg-emerald-950/50 border border-emerald-800/60 rounded-2xl px-5 py-3 text-right">
            <span className="text-xs text-slate-400">Total Winnings</span>
            <p className="text-2xl font-extrabold text-emerald-400">$325.00</p>
            <span className="text-[11px] text-amber-400 font-medium">Payout Status: Pending Proof</span>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Stableford Score Management */}
          <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-3xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-400" />
                Latest 5 Stableford Scores
              </h2>
              <span className="text-xs text-slate-500">Auto-Rolling FIFO</span>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 bg-red-950/40 border border-red-800 rounded-xl flex items-center gap-2 text-xs text-red-300">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleAddScore} className="grid grid-cols-1 sm:grid-cols-5 gap-3 mb-6">
              <input
                type="number"
                min="1"
                max="45"
                placeholder="Score (1-45)"
                value={newScore}
                onChange={(e) => setNewScore(e.target.value)}
                required
                className="sm:col-span-2 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500"
              />
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                required
                className="sm:col-span-2 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 text-slate-300"
              />
              <button
                type="submit"
                className="sm:col-span-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-sm transition"
              >
                Log
              </button>
            </form>

            <div className="divide-y divide-slate-800/60">
              {scores.map((item, index) => (
                <div key={item.id} className="py-3 flex justify-between items-center text-sm">
                  <div>
                    <span className="text-xs text-slate-500 block">Entry #{index + 1}</span>
                    <span className="font-medium text-slate-300">{item.date}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-lg font-mono font-bold text-emerald-400">{item.score} pts</span>
                    <button
                      onClick={() => setScores(scores.filter((s) => s.id !== item.id))}
                      className="text-xs text-slate-600 hover:text-red-400 transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Charity Subsystem Interface */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-rose-400 mb-2">
                <Heart className="w-5 h-5" />
                <h2 className="text-lg font-bold text-white">Charity Allocation</h2>
              </div>
              <p className="text-xs text-slate-400 mb-6">
                Your subscription actively funds vetted causes. You can increase your contribution share at any time.
              </p>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl mb-6">
                <span className="text-[11px] font-semibold uppercase text-emerald-400">Chosen Cause</span>
                <p className="text-sm font-bold text-white mt-0.5">Youth Golf Access Project</p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold text-slate-300">
                  <span>Subscription Share:</span>
                  <span className="text-emerald-400 font-bold">{charityPercent}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="60"
                  step="5"
                  value={charityPercent}
                  onChange={(e) => setCharityPercent(Number(e.target.value))}
                  className="w-full accent-emerald-400 cursor-pointer"
                />
                <span className="text-[10px] text-slate-500 block">Minimum enforced rate: 10%</span>
              </div>
            </div>

            <button className="w-full mt-6 py-2.5 border border-slate-800 hover:border-slate-600 rounded-xl text-xs font-semibold text-slate-300 transition">
              Change Charity Partner
            </button>
          </div>
        </div>

        {/* Verification Screenshot Upload */}
        <section className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 md:p-8">
          <h2 className="text-base font-bold text-white flex items-center gap-2 mb-2">
            <UploadCloud className="w-5 h-5 text-emerald-400" />
            Winner Verification Subsystem
          </h2>
          <p className="text-xs text-slate-400 mb-6">
            If your 5 rolling scores matched 3, 4, or 5 numbers in the monthly draw, upload a verified handicap/club screenshot to claim payouts.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setProofFile(e.target.files?.[0] || null)}
              className="text-xs text-slate-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700 cursor-pointer"
            />
            <button
              disabled={!proofFile}
              className="w-full sm:w-auto bg-emerald-500 disabled:opacity-40 hover:bg-emerald-400 text-slate-950 font-bold px-6 py-2.5 rounded-xl text-xs transition"
            >
              Upload Proof
            </button>
          </div>
        </section>

      </div>
    </div>
  );
}
