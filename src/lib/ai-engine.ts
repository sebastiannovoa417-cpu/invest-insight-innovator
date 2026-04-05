/**
 * Built-in AI engine — zero external API calls.
 * All analysis is derived from the app's in-memory Stock and RegimeData objects.
 */

import type { Stock, RegimeData } from "@/lib/types";

// ── Trade Brief ────────────────────────────────────────────────────────────────

/**
 * Generates a detailed trade commentary for a single stock.
 *
 * Args:
 *   stock: The stock to analyse.
 *   regime: Optional market regime context.
 *
 * Returns:
 *   Multi-sentence prose trade brief.
 */
export function generateTradeBrief(stock: Stock, regime?: RegimeData): string {
    const direction = stock.tradeType;
    const signalCount = Object.values(stock.signals).filter(Boolean).length;
    const totalSignals = Object.values(stock.signals).length;

    const strengthLabel =
        signalCount >= 6 ? "high-conviction" :
            signalCount >= 4 ? "moderate" :
                "low-confidence";

    const setupLine =
        `${stock.ticker} (${stock.name}) is rated a ${strengthLabel} ${direction} setup with ${signalCount}/${totalSignals} signals aligned.`;

    const priceLine =
        `Price is ${stock.price.toFixed(2)}, best entry at ${stock.bestEntry.toFixed(2)} with stop ${stock.stopLoss.toFixed(2)} ` +
        `and target ${stock.target.toFixed(2)} — R:R of ${stock.riskReward.toFixed(2)}:1.`;

    const contextLine =
        `ATR is ${stock.atr.toFixed(2)}; distance from 52-week extreme: ${stock.distance52w.toFixed(1)}%.`;

    const rsiNote =
        direction === "LONG"
            ? stock.rsi < 40
                ? "RSI is in oversold territory, supporting a mean-reversion bounce."
                : stock.rsi > 70
                    ? "RSI is extended — consider waiting for a pullback before entry."
                    : "RSI momentum is constructive for the LONG thesis."
            : stock.rsi > 60
                ? "RSI is overbought, supporting the SHORT fade."
                : stock.rsi < 30
                    ? "RSI is oversold — short entry carries elevated snap-back risk."
                    : "RSI is neutral; confirm with price structure before entry.";

    const volNote =
        stock.volumeSpike
            ? "Volume spike confirms institutional participation."
            : stock.volumeRatio > 1.5
                ? `Volume is ${stock.volumeRatio.toFixed(1)}× average — above normal, watch for follow-through.`
                : "Volume is average; the setup lacks strong institutional confirmation today.";

    const regimeLine =
        regime
            ? `Current regime is ${regime.status} (SPY ${regime.spyPrice.toFixed(2)} / SMA200 ${regime.sma200.toFixed(2)}, VIX ${regime.vix.toFixed(1)}).`
            : "";

    const conflictNote =
        stock.conflictTrend
            ? "Note: conflicting trend detected — shorter-term momentum diverges from longer-term structure."
            : "";

    const earningsNote =
        stock.earningsWarning
            ? "WARNING: earnings event within 2 weeks — elevated gap risk; reduce size or avoid new entries."
            : "";

    return [setupLine, priceLine, contextLine, rsiNote, volNote, regimeLine, conflictNote, earningsNote]
        .filter(Boolean)
        .join(" ")
        .trim();
}

// ── Market Briefing ────────────────────────────────────────────────────────────

/**
 * Generates a 4-paragraph market briefing covering regime, top LONG setups,
 * top SHORT setups, and risk events.
 *
 * Args:
 *   regime: Current market regime data.
 *   stocks: Full universe of scored stocks.
 *
 * Returns:
 *   Multi-paragraph briefing string (paragraphs separated by double newline).
 */
export function generateMarketBriefing(regime: RegimeData, stocks: Stock[]): string {
    const longStocks = stocks
        .filter((s) => s.tradeType === "LONG")
        .sort((a, b) => b.bullScore - a.bullScore);
    const shortStocks = stocks
        .filter((s) => s.tradeType === "SHORT")
        .sort((a, b) => b.bearScore - a.bearScore);

    const topLong = longStocks.slice(0, 3);
    const topShort = shortStocks.slice(0, 3);
    const earningsWarnings = stocks.filter((s) => s.earningsWarning);
    const conflicts = stocks.filter((s) => s.conflictTrend);

    const avgBull = longStocks.reduce((sum, s) => sum + s.bullScore, 0) / (longStocks.length || 1);
    const avgBear = shortStocks.reduce((sum, s) => sum + s.bearScore, 0) / (shortStocks.length || 1);

    const volLabel =
        regime.vix > 25 ? "elevated" : regime.vix > 18 ? "moderate" : "low";
    const rsiLabel =
        regime.spyRsi > 70 ? "overbought" : regime.spyRsi < 30 ? "oversold" : "neutral";
    const spyVsSma = regime.spyPrice > regime.sma200 ? "above" : "below";

    const regimePara =
        `The market regime is currently ${regime.status}. SPY is trading at ${regime.spyPrice.toFixed(2)}, ` +
        `${spyVsSma} its 200-day SMA of ${regime.sma200.toFixed(2)} (ratio ${regime.ratio.toFixed(3)}). ` +
        `VIX stands at ${regime.vix.toFixed(1)}, indicating ${volLabel} volatility. ` +
        `SPY RSI is ${regime.spyRsi.toFixed(1)}, signaling ${rsiLabel} broad-market conditions.`;

    const longPara =
        topLong.length > 0
            ? `Top LONG setups: ${topLong
                .map((s) => `${s.ticker} (bull ${s.bullScore}/8, R:R ${s.riskReward.toFixed(1)}:1)`)
                .join(", ")}. ` +
            `The universe contains ${longStocks.length} long-rated ticker${longStocks.length !== 1 ? "s" : ""} ` +
            `with an average bull score of ${avgBull.toFixed(1)}.`
            : "No LONG setups meet minimum score criteria in the current regime.";

    const shortPara =
        topShort.length > 0
            ? `Top SHORT setups: ${topShort
                .map((s) => `${s.ticker} (bear ${s.bearScore}/8, R:R ${s.riskReward.toFixed(1)}:1)`)
                .join(", ")}. ` +
            `${shortStocks.length} ticker${shortStocks.length !== 1 ? "s are" : " is"} short-rated ` +
            `with an average bear score of ${avgBear.toFixed(1)}.`
            : "No SHORT setups are flagged in the current scan.";

    const riskParts: string[] = [];
    if (earningsWarnings.length > 0) {
        riskParts.push(
            `${earningsWarnings.length} ticker${earningsWarnings.length !== 1 ? "s" : ""} ` +
            `${earningsWarnings.length !== 1 ? "have" : "has"} earnings events this week — ` +
            `${earningsWarnings.map((s) => s.ticker).join(", ")} — avoid new entries or reduce size.`,
        );
    }
    if (conflicts.length > 0) {
        riskParts.push(
            `${conflicts.length} ticker${conflicts.length !== 1 ? "s" : ""} show conflicting trend signals: ` +
            `${conflicts.map((s) => s.ticker).join(", ")}. Wait for resolution before committing capital.`,
        );
    }
    if (riskParts.length === 0) {
        riskParts.push(
            "No material earnings risks or trend conflicts flagged across the universe.",
        );
    }
    const riskPara = riskParts.join(" ");

    return [regimePara, longPara, shortPara, riskPara].join("\n\n");
}

type QuestionIntent =
    | "regime"
    | "news"
    | "why"
    | "best_rr"
    | "top_setups"
    | "short_candidates"
    | "long_candidates"
    | "earnings"
    | "conflicts"
    | "volume"
    | "rsi"
    | "compare"
    | "position_size"
    | "short_interest"
    | "ticker_lookup"
    | "default";

function normalizeQuestion(question: string): string {
    return question.toLowerCase().replace(/\s+/g, " ").trim();
}

function extractQuestionTickers(question: string, stocks: Stock[]): string[] {
    const tokenSet = new Set(question.toUpperCase().split(/\W+/).filter(Boolean));
    return stocks.map((s) => s.ticker).filter((ticker) => tokenSet.has(ticker));
}

function hasAnyPhrase(input: string, phrases: string[]): boolean {
    return phrases.some((phrase) => input.includes(phrase));
}

function detectIntent(question: string, stocks: Stock[]): QuestionIntent {
    const q = normalizeQuestion(question);
    const tickers = extractQuestionTickers(question, stocks);

    // Highest-priority specific intents first.
    if (hasAnyPhrase(q, ["short interest", "float", "squeeze"])) return "short_interest";
    if (hasAnyPhrase(q, ["position size", "position sizing", "how much should i buy", "how many shares", "share count", "risk per trade", "lot size"])) return "position_size";
    if (hasAnyPhrase(q, ["compare", " versus ", " vs "]) || tickers.length >= 2) return "compare";
    if (hasAnyPhrase(q, ["news", "headline", "latest on"])) return "news";
    if (hasAnyPhrase(q, ["why", "explain", "signals for", "what signals"])) return "why";

    if (hasAnyPhrase(q, ["regime", "market condition", "overall market", "broad market", "market update", "market today", "market this week", "how is the market", "how's the market", "spy", "vix"])) return "regime";
    if (hasAnyPhrase(q, ["best r:r", "best rr", "risk reward", "reward risk"])) return "best_rr";
    if (hasAnyPhrase(q, ["strongest", "top setup", "top pick", "best setup", "best trade"])) return "top_setups";
    if (hasAnyPhrase(q, ["earnings", "report", "catalyst"])) return "earnings";
    if (hasAnyPhrase(q, ["conflict", "mixed signal", "diverge"])) return "conflicts";
    if (hasAnyPhrase(q, ["volume", "vol spike", "high volume"])) return "volume";
    if (hasAnyPhrase(q, ["rsi", "oversold", "overbought"])) return "rsi";

    // Broad direction intents should not steal sizing/short-interest questions.
    if (hasAnyPhrase(q, [" short ", "short setups", "bearish candidate", "sell candidate"])) return "short_candidates";
    if (hasAnyPhrase(q, [" long ", "long setups", "bullish candidate", "buy candidate"])) return "long_candidates";

    if (tickers.length >= 1) return "ticker_lookup";
    return "default";
}

// ── Chat Q&A ──────────────────────────────────────────────────────────────────

/**
 * Answers a natural-language trading question using only app data.
 *
 * Args:
 *   question: The user's question string.
 *   stocks: Full universe of scored stocks.
 *   regime: Current market regime data.
 *
 * Returns:
 *   Plain-text answer string.
 */
export function answerQuestion(
    question: string,
    stocks: Stock[],
    regime: RegimeData,
): string {
    const intent = detectIntent(question, stocks);
    const questionTickers = extractQuestionTickers(question, stocks);

    // ── Regime / market conditions ────────────────────────────────────────────
    if (intent === "regime") {
        const bias =
            regime.status === "BULLISH"
                ? "Conditions favour a LONG bias; short setups face structural headwinds."
                : regime.status === "BEARISH"
                    ? "Conditions favour a SHORT bias; long positions carry higher reversal risk."
                    : "Mixed regime — size down and require higher conviction before entry.";
        const volLabel = regime.vix > 25 ? "elevated" : regime.vix > 18 ? "moderate" : "low";
        const rsiLabel = regime.spyRsi > 70 ? "overbought" : regime.spyRsi < 30 ? "oversold" : "neutral";
        const vs200 = regime.spyPrice > regime.sma200 ? "above" : "below";
        const vs50 = regime.spyPrice > regime.sma50 ? "above" : "below";
        return (
            `Regime: ${regime.status} (${regime.regimeScore}/6 conditions met).\n` +
            `SPY $${regime.spyPrice.toFixed(2)} — ${vs200} SMA200 $${regime.sma200.toFixed(2)}, ${vs50} SMA50 $${regime.sma50.toFixed(2)}.\n` +
            `VIX ${regime.vix.toFixed(1)} (${volLabel} volatility). SPY RSI ${regime.spyRsi.toFixed(1)} (${rsiLabel}).\n` +
            bias
        );
    }

    // ── News for a specific ticker ────────────────────────────────────────────
    if (intent === "news") {
        const newsT = questionTickers[0];
        const newsStock = newsT ? stocks.find((s) => s.ticker === newsT) : undefined;
        if (newsStock && newsStock.news.length > 0) {
            return (
                `Recent news for ${newsStock.ticker} (${newsStock.name}):\n\n` +
                newsStock.news.slice(0, 5).map((item, i) =>
                    `${i + 1}. [${item.sentiment?.toUpperCase() ?? "NEUTRAL"}] ${item.title}\n` +
                    `   ${item.source ?? "Unknown"} · ${item.date}` +
                    (item.summary ? `\n   ${item.summary}` : "")
                ).join("\n\n")
            );
        }
    }

    // ── Why is a ticker rated LONG/SHORT? ─────────────────────────────────────
    if (intent === "why") {
        const whyT = questionTickers[0];
        const whyStock = whyT ? stocks.find((s) => s.ticker === whyT) : undefined;
        if (whyStock) {
            const passing = Object.entries(whyStock.signals).filter(([, v]) => v).map(([k]) => k);
            const failing = Object.entries(whyStock.signals).filter(([, v]) => !v).map(([k]) => k);
            const score = whyStock.tradeType === "LONG" ? whyStock.bullScore : whyStock.bearScore;
            return (
                `${whyStock.ticker} (${whyStock.name}) is rated ${whyStock.tradeType} — ${score}/8 signals passing.\n\n` +
                `✅ Passing (${passing.length}): ${passing.join(", ") || "none"}\n` +
                `❌ Failing (${failing.length}): ${failing.join(", ") || "none"}\n\n` +
                `Setup: entry $${whyStock.bestEntry.toFixed(2)} | stop $${whyStock.stopLoss.toFixed(2)} | target $${whyStock.target.toFixed(2)} | R:R ${whyStock.riskReward.toFixed(2)}:1\n` +
                (whyStock.shortInterest != null ? `Short interest: ${whyStock.shortInterest.toFixed(1)}%\n` : "") +
                (whyStock.conflictTrend ? "⚠ Conflicting trend — wait for resolution before entry.\n" : "") +
                (whyStock.earningsWarning ? "⚠ Earnings event upcoming — size down or avoid.\n" : "")
            );
        }
    }

    // ── Best R:R ─────────────────────────────────────────────────────────────
    if (intent === "best_rr") {
        const sorted = [...stocks].sort((a, b) => b.riskReward - a.riskReward).slice(0, 5);
        return (
            `Top 5 setups by R:R ratio:\n` +
            sorted
                .map(
                    (s, i) =>
                        `${i + 1}. ${s.ticker} — ${s.riskReward.toFixed(2)}:1 ` +
                        `(${s.tradeType}, entry ${s.bestEntry.toFixed(2)}, stop ${s.stopLoss.toFixed(2)}, target ${s.target.toFixed(2)})`,
                )
                .join("\n")
        );
    }

    // ── Strongest / top setups ────────────────────────────────────────────────
    if (intent === "top_setups") {
        const getScore = (s: Stock) =>
            s.tradeType === "LONG" ? s.bullScore : s.bearScore;
        const top5 = [...stocks].sort((a, b) => getScore(b) - getScore(a)).slice(0, 5);
        return (
            `Top 5 setups by signal score:\n` +
            top5
                .map((s, i) => {
                    const score = getScore(s);
                    const sig = Object.values(s.signals).filter(Boolean).length;
                    return (
                        `${i + 1}. ${s.ticker} (${s.tradeType}) — score ${score}/8, ${sig}/8 signals, ` +
                        `R:R ${s.riskReward.toFixed(2)}:1` +
                        (s.earningsWarning ? " ⚠ earnings" : "") +
                        (s.conflictTrend ? " ⚠ conflict" : "")
                    );
                })
                .join("\n")
        );
    }

    // ── SHORT candidates ─────────────────────────────────────────────────────
    if (intent === "short_candidates") {
        const shorts = [...stocks]
            .filter((s) => s.tradeType === "SHORT")
            .sort((a, b) => b.bearScore - a.bearScore);
        if (shorts.length === 0)
            return "No tickers are currently rated SHORT in the scan.";
        return (
            `${shorts.length} SHORT setups in the universe:\n` +
            shorts
                .slice(0, 6)
                .map(
                    (s, i) =>
                        `${i + 1}. ${s.ticker} — bear score ${s.bearScore}/8, entry ${s.bestEntry.toFixed(2)}, ` +
                        `stop ${s.stopLoss.toFixed(2)}, target ${s.target.toFixed(2)}, R:R ${s.riskReward.toFixed(2)}:1` +
                        (s.conflictTrend ? " ⚠ conflict" : ""),
                )
                .join("\n")
        );
    }

    // ── LONG candidates ──────────────────────────────────────────────────────
    if (intent === "long_candidates") {
        const longs = [...stocks]
            .filter((s) => s.tradeType === "LONG")
            .sort((a, b) => b.bullScore - a.bullScore);
        if (longs.length === 0)
            return "No tickers are currently rated LONG in the scan.";
        return (
            `${longs.length} LONG setups in the universe:\n` +
            longs
                .slice(0, 6)
                .map(
                    (s, i) =>
                        `${i + 1}. ${s.ticker} — bull score ${s.bullScore}/8, entry ${s.bestEntry.toFixed(2)}, ` +
                        `stop ${s.stopLoss.toFixed(2)}, target ${s.target.toFixed(2)}, R:R ${s.riskReward.toFixed(2)}:1` +
                        (s.earningsWarning ? " ⚠ earnings" : ""),
                )
                .join("\n")
        );
    }

    // ── Earnings risks ────────────────────────────────────────────────────────
    if (intent === "earnings") {
        const warned = stocks.filter((s) => s.earningsWarning);
        if (warned.length === 0)
            return "No earnings events flagged this week across the 25-ticker universe. All clear to trade normal size.";
        return (
            `${warned.length} ticker${warned.length !== 1 ? "s" : ""} with upcoming earnings:\n` +
            warned
                .map(
                    (s) =>
                        `• ${s.ticker} (${s.tradeType}) — entry ${s.bestEntry.toFixed(2)}, avoid new positions until after the report.`,
                )
                .join("\n") +
            "\nRecommendation: reduce size to 50% or wait for the post-earnings reaction."
        );
    }

    // ── Conflicting signals ───────────────────────────────────────────────────
    if (intent === "conflicts") {
        const conflicted = stocks.filter((s) => s.conflictTrend);
        if (conflicted.length === 0)
            return "No trend conflicts detected. All rated setups have aligned signals.";
        return (
            `${conflicted.length} ticker${conflicted.length !== 1 ? "s" : ""} show conflicting trend signals:\n` +
            conflicted
                .map(
                    (s) =>
                        `• ${s.ticker} (${s.tradeType}) — shorter-term momentum diverges from structure. Best to wait for resolution.`,
                )
                .join("\n")
        );
    }

    // ── Volume spikes ─────────────────────────────────────────────────────────
    if (intent === "volume") {
        const spiked = stocks
            .filter((s) => s.volumeSpike)
            .sort((a, b) => b.volumeRatio - a.volumeRatio);
        if (spiked.length === 0)
            return "No volume spikes detected in the current scan.";
        return (
            `${spiked.length} ticker${spiked.length !== 1 ? "s" : ""} with volume spikes:\n` +
            spiked
                .map(
                    (s) =>
                        `• ${s.ticker} — ${s.volumeRatio.toFixed(1)}× average volume ` +
                        `(${s.tradeType}, price ${s.price.toFixed(2)})`,
                )
                .join("\n")
        );
    }

    // ── RSI extremes ─────────────────────────────────────────────────────────
    if (intent === "rsi") {
        const oversold = stocks
            .filter((s) => s.rsi < 35)
            .sort((a, b) => a.rsi - b.rsi);
        const overbought = stocks
            .filter((s) => s.rsi > 65)
            .sort((a, b) => b.rsi - a.rsi);
        const parts: string[] = [];
        if (oversold.length > 0)
            parts.push(
                `Oversold (RSI < 35): ${oversold.map((s) => `${s.ticker} (${s.rsi.toFixed(1)})`).join(", ")}`,
            );
        if (overbought.length > 0)
            parts.push(
                `Overbought (RSI > 65): ${overbought.map((s) => `${s.ticker} (${s.rsi.toFixed(1)})`).join(", ")}`,
            );
        if (parts.length === 0)
            return "All tickers are trading in neutral RSI territory (35–65).";
        return parts.join("\n");
    }

    // ── Compare two tickers side by side ──────────────────────────────────────
    if (intent === "compare") {
        const twoTickers = questionTickers.slice(0, 2);
        if (twoTickers.length >= 2) {
            const a = stocks.find((s) => s.ticker === twoTickers[0])!;
            const b = stocks.find((s) => s.ticker === twoTickers[1])!;
            const scoreA = a.tradeType === "LONG" ? a.bullScore : a.bearScore;
            const scoreB = b.tradeType === "LONG" ? b.bullScore : b.bearScore;
            const betterScore = scoreA > scoreB ? a.ticker : scoreB > scoreA ? b.ticker : "Tied";
            const betterRR = a.riskReward >= b.riskReward ? a.ticker : b.ticker;
            return (
                `${a.ticker} vs ${b.ticker} — side-by-side:\n\n` +
                `${a.ticker} (${a.tradeType}): score ${scoreA}/8, entry $${a.bestEntry.toFixed(2)}, stop $${a.stopLoss.toFixed(2)}, target $${a.target.toFixed(2)}, R:R ${a.riskReward.toFixed(2)}:1, RSI ${a.rsi.toFixed(0)}` +
                (a.earningsWarning ? " ⚠earnings" : "") + (a.conflictTrend ? " ⚠conflict" : "") + "\n" +
                `${b.ticker} (${b.tradeType}): score ${scoreB}/8, entry $${b.bestEntry.toFixed(2)}, stop $${b.stopLoss.toFixed(2)}, target $${b.target.toFixed(2)}, R:R ${b.riskReward.toFixed(2)}:1, RSI ${b.rsi.toFixed(0)}` +
                (b.earningsWarning ? " ⚠earnings" : "") + (b.conflictTrend ? " ⚠conflict" : "") + "\n\n" +
                `Higher signal score: ${betterScore}\nBetter R:R: ${betterRR}`
            );
        }
    }

    // ── Position sizing for a ticker ─────────────────────────────────────────
    if (intent === "position_size") {
        const sizeT = questionTickers[0];
        const sizeStock = sizeT ? stocks.find((s) => s.ticker === sizeT) : undefined;
        if (sizeStock) {
            const riskDollars = 100; // 1% of $10,000 default
            const stopDistance = Math.abs(sizeStock.bestEntry - sizeStock.stopLoss);
            const shares = stopDistance > 0 ? Math.floor(riskDollars / stopDistance) : 0;
            const maxLoss = shares * stopDistance;
            const posValue = shares * sizeStock.bestEntry;
            return (
                `Position sizing for ${sizeStock.ticker} (1% risk on a $10,000 example account):\n\n` +
                `Entry $${sizeStock.bestEntry.toFixed(2)} | Stop $${sizeStock.stopLoss.toFixed(2)}\n` +
                `Stop distance: $${stopDistance.toFixed(2)} (${((stopDistance / sizeStock.bestEntry) * 100).toFixed(1)}% of entry)\n` +
                `Suggested shares: ${shares}\n` +
                `Position value: ~$${posValue.toFixed(0)}\n` +
                `Max loss: $${maxLoss.toFixed(0)}\n\n` +
                `Formula: shares = (account × risk%) ÷ stop-distance\n` +
                `Adjust risk% and account size to your own parameters.`
            );
        }
    }

    // ── Short interest ────────────────────────────────────────────────────────
    if (intent === "short_interest") {
        const siStocks = stocks
            .filter((s) => s.shortInterest != null && s.shortInterest > 0)
            .sort((a, b) => (b.shortInterest ?? 0) - (a.shortInterest ?? 0));
        if (siStocks.length === 0)
            return "No short interest data available in the current scan.";
        return (
            `Short interest data (${siStocks.length} tickers):\n\n` +
            siStocks.slice(0, 8).map((s) =>
                `• ${s.ticker} — ${s.shortInterest!.toFixed(1)}% SI ` +
                `(${s.tradeType}, price $${s.price.toFixed(2)}, RSI ${s.rsi.toFixed(0)})`
            ).join("\n") +
            "\n\nHigh short interest (>15%) can fuel squeezes on LONGs or confirm bearish thesis on SHORTs."
        );
    }

    // ── Specific ticker lookup (e.g. "Tell me about NVDA") ───────────────────
    if (intent === "ticker_lookup") {
        const ticker = questionTickers[0];
        const stock = stocks.find((s) => s.ticker === ticker);
        if (stock) return generateTradeBrief(stock, regime);
    }

    // ── Default — universe summary ────────────────────────────────────────────
    const longCount = stocks.filter((s) => s.tradeType === "LONG").length;
    const shortCount = stocks.filter((s) => s.tradeType === "SHORT").length;
    const avgRR =
        stocks.reduce((sum, s) => sum + s.riskReward, 0) / (stocks.length || 1);
    return (
        `Universe summary: ${stocks.length} tickers scanned — ${longCount} LONG, ${shortCount} SHORT. ` +
        `Average R:R: ${avgRR.toFixed(2)}:1. Regime: ${regime.status}.\n\n` +
        `Try asking:\n` +
        `• "top setups" or "best R:R" — universe ranking\n` +
        `• "NVDA" or "SOFI" — full analysis for any ticker\n` +
        `• "why is SOFI rated LONG?" — signal breakdown\n` +
        `• "news for MARA" — recent headlines\n` +
        `• "compare NVDA vs TSLA" — side-by-side\n` +
        `• "position size for NIO" — share count calculator\n` +
        `• "short interest" — float & squeeze data\n` +
        `• "earnings risks" — upcoming catalyst warnings\n` +
        `• "how is the market today?" — regime context`
    );
}
