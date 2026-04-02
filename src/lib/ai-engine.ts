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
                .map((s) => `${s.ticker} (bull ${s.bullScore}/7, R:R ${s.riskReward.toFixed(1)}:1)`)
                .join(", ")}. ` +
            `The universe contains ${longStocks.length} long-rated ticker${longStocks.length !== 1 ? "s" : ""} ` +
            `with an average bull score of ${avgBull.toFixed(1)}.`
            : "No LONG setups meet minimum score criteria in the current regime.";

    const shortPara =
        topShort.length > 0
            ? `Top SHORT setups: ${topShort
                .map((s) => `${s.ticker} (bear ${s.bearScore}/7, R:R ${s.riskReward.toFixed(1)}:1)`)
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
    const q = question.toLowerCase();

    // ── Regime / market conditions ────────────────────────────────────────────
    if (/regime|market condition|spy|vix|overall market|broad market/.test(q)) {
        const bias =
            regime.status === "BULLISH"
                ? "Conditions favour a LONG bias; short setups face structural headwinds."
                : regime.status === "BEARISH"
                    ? "Conditions favour a SHORT bias; long positions carry higher reversal risk."
                    : "Mixed regime — size down and require higher conviction before entry.";
        return (
            `Regime: ${regime.status}. SPY at ${regime.spyPrice.toFixed(2)} vs SMA200 ${regime.sma200.toFixed(2)} ` +
            `(ratio ${regime.ratio.toFixed(3)}). VIX: ${regime.vix.toFixed(1)}. ` +
            `SPY RSI: ${regime.spyRsi.toFixed(1)}. ${bias}`
        );
    }

    // ── Best R:R ─────────────────────────────────────────────────────────────
    if (/best r.?r|risk.?reward|reward.?risk/.test(q)) {
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
    if (/strongest|top.*(setup|pick|trade)|best.*(setup|pick|trade)/.test(q)) {
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
                        `${i + 1}. ${s.ticker} (${s.tradeType}) — score ${score}/7, ${sig}/8 signals, ` +
                        `R:R ${s.riskReward.toFixed(2)}:1` +
                        (s.earningsWarning ? " ⚠ earnings" : "") +
                        (s.conflictTrend ? " ⚠ conflict" : "")
                    );
                })
                .join("\n")
        );
    }

    // ── SHORT candidates ─────────────────────────────────────────────────────
    if (/\bshort\b|bearish candidate|sell candidate/.test(q)) {
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
                        `${i + 1}. ${s.ticker} — bear score ${s.bearScore}/7, entry ${s.bestEntry.toFixed(2)}, ` +
                        `stop ${s.stopLoss.toFixed(2)}, target ${s.target.toFixed(2)}, R:R ${s.riskReward.toFixed(2)}:1` +
                        (s.conflictTrend ? " ⚠ conflict" : ""),
                )
                .join("\n")
        );
    }

    // ── LONG candidates ──────────────────────────────────────────────────────
    if (/\blong\b|bullish candidate|buy candidate/.test(q)) {
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
                        `${i + 1}. ${s.ticker} — bull score ${s.bullScore}/7, entry ${s.bestEntry.toFixed(2)}, ` +
                        `stop ${s.stopLoss.toFixed(2)}, target ${s.target.toFixed(2)}, R:R ${s.riskReward.toFixed(2)}:1` +
                        (s.earningsWarning ? " ⚠ earnings" : ""),
                )
                .join("\n")
        );
    }

    // ── Earnings risks ────────────────────────────────────────────────────────
    if (/earnings|report|\ber\b|catalyst/.test(q)) {
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
    if (/conflict|mixed signal|diverge/.test(q)) {
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
    if (/volume|vol spike|high volume/.test(q)) {
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
    if (/\brsi\b|oversold|overbought/.test(q)) {
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

    // ── Specific ticker lookup (e.g. "Tell me about NVDA") ───────────────────
    const tickerMatch = question.match(/\b([A-Z]{1,5})\b/);
    if (tickerMatch) {
        const ticker = tickerMatch[1].toUpperCase();
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
        `Average R:R: ${avgRR.toFixed(2)}:1. Regime: ${regime.status}. ` +
        `Ask about "top picks", "short setups", "best R:R", "earnings risks", "conflicts", ` +
        `"volume spikes", or a specific ticker like "NVDA" or "TSLA".`
    );
}
