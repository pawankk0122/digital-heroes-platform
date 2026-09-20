// src/lib/drawEngine.ts

export interface GolferEntry {
  userId: string;
  scores: number[]; // Guaranteed 5 Stableford scores
}

export interface PrizePoolAllocation {
  totalPool: number;
  tier5Share: number; // 40% + previous rollover
  tier4Share: number; // 35%
  tier3Share: number; // 25%
}

export interface DrawExecutionResult {
  winningNumbers: number[];
  tier5: {
    winners: string[];
    totalPayout: number;
    perWinner: number;
    rolloverNextMonth: number;
  };
  tier4: {
    winners: string[];
    totalPayout: number;
    perWinner: number;
  };
  tier3: {
    winners: string[];
    totalPayout: number;
    perWinner: number;
  };
}

export class DrawEngine {
  /**
   * Calculates tier buckets according to PRD section §07:
   * 40% Tier 5 (Jackpot) + Rollover, 35% Tier 4, 25% Tier 3
   */
  static calculatePool(
    activeSubscribers: number,
    feePerUser: number,
    rolloverAmount: number = 0
  ): PrizePoolAllocation {
    const rawRevenue = activeSubscribers * feePerUser;
    return {
      totalPool: rawRevenue + rolloverAmount,
      tier5Share: rawRevenue * 0.4 + rolloverAmount,
      tier4Share: rawRevenue * 0.35,
      tier3Share: rawRevenue * 0.25,
    };
  }

  /**
   * Generates 5 unique numbers between 1-45 (Random or Algorithmic Frequency)
   */
  static generateNumbers(
    mode: "random" | "algorithmic",
    allEntries: GolferEntry[]
  ): number[] {
    if (mode === "random") {
      const nums = new Set<number>();
      while (nums.size < 5) {
        nums.add(Math.floor(Math.random() * 45) + 1);
      }
      return Array.from(nums).sort((a, b) => a - b);
    }

    // Algorithmic: Weighted by most frequent Stableford scores across entries
    const frequencyMap: Record<number, number> = {};
    allEntries
      .flatMap((e) => e.scores)
      .forEach((score) => {
        frequencyMap[score] = (frequencyMap[score] ?? 0) + 1;
      });

    const sortedScores = Object.keys(frequencyMap)
      .map(Number)
      .sort((a, b) => (frequencyMap[b] ?? 0) - (frequencyMap[a] ?? 0));

    const result = new Set<number>(sortedScores.slice(0, 5));
    while (result.size < 5) {
      result.add(Math.floor(Math.random() * 45) + 1);
    }
    return Array.from(result).sort((a, b) => a - b);
  }

  /**
   * Evaluates matches and splits prizes equally per tier
   */
  static executeDraw(
    winningNumbers: number[],
    entries: GolferEntry[],
    pool: PrizePoolAllocation
  ): DrawExecutionResult {
    const winSet = new Set(winningNumbers);
    const tier5Winners: string[] = [];
    const tier4Winners: string[] = [];
    const tier3Winners: string[] = [];

    for (const entry of entries) {
      const matchCount = entry.scores.filter((score) => winSet.has(score)).length;
      if (matchCount === 5) {
        tier5Winners.push(entry.userId);
      } else if (matchCount === 4) {
        tier4Winners.push(entry.userId);
      } else if (matchCount === 3) {
        tier3Winners.push(entry.userId);
      }
    }

    // 5-match jackpot rollover carries forward if unclaimed
    const rolloverNextMonth = tier5Winners.length === 0 ? pool.tier5Share : 0;

    return {
      winningNumbers,
      tier5: {
        winners: tier5Winners,
        totalPayout: tier5Winners.length > 0 ? pool.tier5Share : 0,
        perWinner:
          tier5Winners.length > 0 ? pool.tier5Share / tier5Winners.length : 0,
        rolloverNextMonth,
      },
      tier4: {
        winners: tier4Winners,
        totalPayout: tier4Winners.length > 0 ? pool.tier4Share : 0,
        perWinner:
          tier4Winners.length > 0 ? pool.tier4Share / tier4Winners.length : 0,
      },
      tier3: {
        winners: tier3Winners,
        totalPayout: tier3Winners.length > 0 ? pool.tier3Share : 0,
        perWinner:
          tier3Winners.length > 0 ? pool.tier3Share / tier3Winners.length : 0,
      },
    };
  }
}
