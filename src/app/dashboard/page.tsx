"use client";

import React, { useState } from "react";

export default function UserDashboard() {
  const [scores, setScores] = useState([
    { id: "1", date: "2026-03-12", score: 38 },
    { id: "2", date: "2026-03-05", score: 41 },
    { id: "3", date: "2026-02-28", score: 35 },
    { id: "4", date: "2026-02-14", score: 39 },
    { id: "5", date: "2026-02-02", score: 33 },
  ]);

  const [inputScore, setInputScore] = useState("");
  const [inputDate, setInputDate] = useState("");
  const [charityShare, setCharityShare] = useState(15);
  const [proofFile, setProofFile] = useState<File | null>(null);

  const handleScoreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const scoreVal = parseInt(inputScore, 10);
    if (scoreVal < 1 || scoreVal > 45) {
      alert("Stableford score must be between 1 and 45.");
      return;
    }
    if (scores.some((s) => s.date === inputDate)) {
      alert("A score for this date already exists. You can edit the existing entry instead.");
      return;
    }

    const updated = [{ id: Date.now().toString(), date: inputDate, score: scoreVal }, ...scores]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);

    setScores(updated);
    setInputScore("");
    setInputDate("");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-emerald-400">Player Impact Hub</h1>
            <p className="text-slate-400 text-sm mt-1">Driving change with every round you play.</p>
          </div>
          <div className="mt-4 md:mt-0 flex items-center gap-4">
            <span className="px-3 py-1 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded-full text-xs font-semibold uppercase tracking-wider">
              Active Subscription
            </span>
            <span className="text-xs text-slate-400">Renews: April 1, 2026</span>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Your Rolling 5 Stableford Scores</h2>
            
            <form onSubmit={handleScoreSubmit} className="flex flex-col sm:flex-row gap-4 mb-6">
              <input
                type="number"
                min="1"
                max="45"
                placeholder="Score (1-45)"
                value={inputScore}
                onChange={(e) => setInputScore(e.target.value)}
                required
                className="bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 w-full sm:w-1/3"
              />
              <input
                type="date"
                value={inputDate}
                onChange={(e) => setInputDate(e.target.value)}
                required
                className="bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 w-full sm:w-1/2"
              />
              <button
                type="submit"
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-6 py-2.5 rounded-xl text-sm transition-all"
              >
                Log Round
              </button>
            </form>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-xs font-semibold uppercase text-slate-400">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Stableford Score</th>
                    <th className="py-3 px-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 text-sm">
                  {scores.map((s, idx) => (
                    <tr key={s.id} className="hover:bg-slate-800/30 transition">
                      <td className="py-3 px-4 text-slate-300">{s.date}</td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-400">{s.score}</td>
                      <td className="py-3 px-4 text-right text-xs text-slate-500">
                        {idx === 0 ? "Most Recent" : "Locked for Draw"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white mb-2">Charitable Impact</h2>
              <p className="text-xs text-slate-400 mb-6">Select the cause that benefits from your monthly membership.</p>
              
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 mb-6">
                <span className="text-xs text-emerald-400 font-semibold uppercase">Selected Charity</span>
                <p className="text-sm font-bold text-white mt-1">Junior Sports Outreach Foundation</p>
              </div>

              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Contribution: {charityShare}% (Min 10%)
              </label>
              <input
                type="range"
                min="10"
                max="50"
                step="5"
                value={charityShare}
                onChange={(e) => setCharityShare(Number(e.target.value))}
                className="w-full accent-emerald-400 cursor-pointer"
              />
            </div>
            <button className="mt-6 w-full py-2.5 border border-slate-700 hover:border-slate-500 text-xs font-semibold rounded-xl transition">
              Explore Charity Directory
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-base font-semibold text-white mb-4">Draws & Winnings Overview</h3>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400">Total Winnings</span>
                <p className="text-xl font-bold text-emerald-400 mt-1">$450.00</p>
                <span className="text-[10px] text-amber-400 mt-1 block">Status: Pending Verification</span>
              </div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400">Upcoming Draw</span>
                <p className="text-xl font-bold text-white mt-1">March 31, 2026</p>
                <span className="text-[10px] text-slate-500 mt-1 block">5-Match Rollover: $1,200</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-base font-semibold text-white mb-2">Winner Verification Upload</h3>
            <p className="text-xs text-slate-400 mb-4">
              Won a tier? Upload a screenshot of your official golf club score record to unlock payout.
            </p>
            <div className="flex gap-4 items-center">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                className="text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700 cursor-pointer"
              />
              <button
                disabled={!proofFile}
                className="bg-emerald-500 disabled:opacity-30 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs transition"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
