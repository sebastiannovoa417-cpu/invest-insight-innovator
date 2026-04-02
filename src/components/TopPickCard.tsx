import { Stock, RegimeData } from "@/lib/types";

interface TopPickCardProps {
  stock: Stock;
  regime: RegimeData;
}

export function TopPickCard({ stock, regime }: TopPickCardProps) {
  const isShort = stock.tradeType === "SHORT";
  const score = isShort ? stock.bearScore : stock.bullScore;
  const isRegimeAligned = (isShort && regime.status === "BEARISH") || (!isShort && regime.status === "BULLISH");

  const scoreColor = isShort ? "#cc0000" : "#008000";
  const scoreBarWidth = `${(score / 8) * 100}%`;

  return (
    <div
      className="win-panel"
      style={{
        marginBottom: "4px",
        fontFamily: "Tahoma, MS Sans Serif, sans-serif",
        overflow: "hidden",
      }}
    >
      {/* Window title bar */}
      <div className="win-titlebar" style={{ padding: "2px 4px", fontSize: "11px" }}>
        <span>📊 Top Pick — #{1} Best Setup</span>
      </div>

      {/* Content */}
      <div style={{ padding: "8px", display: "flex", alignItems: "flex-start", gap: "12px", backgroundColor: "#d4d0c8" }}>
        {/* Score ring — replaced with classic progress-bar style */}
        <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", width: "72px" }}>
          {/* Score value box */}
          <div
            className="win-sunken"
            style={{
              width: "64px",
              height: "64px",
              backgroundColor: "#ffffff",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{ fontSize: "28px", fontWeight: "bold", fontFamily: "Courier New", color: scoreColor, lineHeight: 1 }}>
              {score}
            </span>
            <span style={{ fontSize: "10px", color: "#666" }}>/8</span>
          </div>
          {/* Score bar */}
          <div className="win-progress-track" style={{ width: "64px" }}>
            <div
              className={isShort ? "win-progress-fill-short" : "win-progress-fill-long"}
              style={{ width: scoreBarWidth }}
            />
          </div>
          <span style={{ fontSize: "10px", color: "#444", fontWeight: "bold" }}>SCORE</span>
        </div>

        {/* Details */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
            <span
              style={{
                backgroundColor: isShort ? "#cc0000" : "#008000",
                color: "#ffffff",
                border: "1px solid #000",
                padding: "1px 6px",
                fontSize: "10px",
                fontWeight: "bold",
              }}
            >
              {stock.tradeType}
            </span>
            <span style={{ fontSize: "18px", fontWeight: "bold", color: "#000" }}>{stock.ticker}</span>
            {isRegimeAligned && (
              <span
                className="win-badge"
                style={{ backgroundColor: "#e8ffe8", border: "1px solid #008000", color: "#006000" }}
              >
                ✓ Regime Aligned
              </span>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "11px", marginBottom: "6px", fontFamily: "Courier New" }}>
            <span style={{ fontWeight: "bold" }}>${stock.price.toFixed(2)}</span>
            <span style={{ color: "#666" }}>·</span>
            <span>RSI {stock.rsi}</span>
            <span style={{ color: "#666" }}>·</span>
            <span>Vol {stock.volumeRatio}x avg</span>
          </div>

          {/* Tags */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "3px", marginBottom: "6px" }}>
            <span className="win-badge">52W {stock.distance52w >= 0 ? "+" : ""}{stock.distance52w.toFixed(1)}%</span>
            <span className="win-badge">Entry ${stock.bestEntry.toFixed(2)}</span>
            {stock.earningsWarning && (
              <span className="win-badge" style={{ backgroundColor: "#fffbcc", border: "1px solid #cc8800", color: "#885500" }}>
                ⚠ Earnings Risk
              </span>
            )}
          </div>

          {/* Signals */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 10px", fontSize: "10px", color: "#333" }}>
            {stock.signals.sma200 && <span>• Price {isShort ? "<" : ">"} SMA_200</span>}
            {stock.signals.sma50 && <span>• Price {isShort ? "<" : ">"} SMA_50</span>}
            {stock.signals.rsiMomentum && <span>• RSI {isShort ? "bearish" : "bullish"}: {stock.rsi}</span>}
            {stock.signals.volume && <span>• {isShort ? "Distribution" : "Accumulation"} vol: {stock.volumeRatio}x</span>}
            {stock.signals.macd && <span>• MACD {isShort ? "bearish" : "bullish"}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
