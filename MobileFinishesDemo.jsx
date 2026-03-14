import React, { useState, useRef, useEffect, useCallback } from "react";

// 模拟数据
const FINISHES = [
  {
    id: "matte-black",
    label: "Matte Black",
    color: "#1a1a1a",
    textMode: "dark",
    desc: "A bold, light-absorbing finish. Fingerprint resistant and unapologetically modern.",
    img: "https://images.unsplash.com/photo-1585412727339-54e4bae3bbf9?w=400&q=80",
  },
  {
    id: "brushed-nickel",
    label: "Brushed Nickel",
    color: "#E8E4DF",
    textMode: "light",
    desc: "Warm silver with micro-brushed texture. Timeless, versatile, and scratch-concealing.",
    img: "https://images.unsplash.com/photo-1585412727339-54e4bae3bbf9?w=400&q=80",
  },
  {
    id: "brushed-bronze",
    label: "Brushed Bronze",
    color: "#967350",
    textMode: "dark",
    desc: "Rich earth tones with a living patina that evolves over time. Warm and organic.",
    img: "https://images.unsplash.com/photo-1585412727339-54e4bae3bbf9?w=400&q=80",
  },
  {
    id: "brushed-brass",
    label: "Brushed Brass",
    color: "#C5A647",
    textMode: "light",
    desc: "Golden warmth, hand-brushed to a soft sheen. Statement luxury for the bold kitchen.",
    img: "https://images.unsplash.com/photo-1585412727339-54e4bae3bbf9?w=400&q=80",
  },
];

/* ── Faucet SVG ── */
const FaucetSVG = ({ color = "#333", accent = "#555" }) => (
  <svg viewBox="0 0 200 340" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%", filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.25))" }}>
    {/* Base plate */}
    <ellipse cx="100" cy="310" rx="44" ry="10" fill={accent} opacity="0.5" />
    <ellipse cx="100" cy="305" rx="38" ry="14" fill={color} />
    <rect x="62" y="290" width="76" height="16" rx="4" fill={color} />
    {/* Stem */}
    <rect x="88" y="120" width="24" height="172" rx="12" fill={color} />
    {/* Curved spout */}
    <path d="M100 120 C100 50, 100 30, 55 30 C30 30, 20 40, 20 55 L20 80" stroke={color} strokeWidth="22" strokeLinecap="round" fill="none" />
    {/* Spout tip */}
    <rect x="12" y="76" width="18" height="6" rx="3" fill={accent} />
    {/* Digital display */}
    <rect x="78" y="240" width="44" height="28" rx="6" fill={accent} opacity="0.8" />
    <circle cx="100" cy="254" r="6" fill={color} opacity="0.6" />
    {/* Highlight streak */}
    <path d="M105 130 L105 280" stroke="white" strokeWidth="2" opacity="0.15" strokeLinecap="round" />
    <path d="M94 32 C94 32, 60 32, 36 45" stroke="white" strokeWidth="2" opacity="0.12" strokeLinecap="round" />
  </svg>
);

const faucetColors = {
  "matte-black": { color: "#2a2a2a", accent: "#3a3a3a" },
  "brushed-nickel": { color: "#b8b0a8", accent: "#ccc5bd" },
  "brushed-bronze": { color: "#7a5c3e", accent: "#8d6e4e" },
  "brushed-brass": { color: "#a08530", accent: "#b89940" },
};

/* ── Main Component ── */
export default function MobileFinishesDemo() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [currentTranslate, setCurrentTranslate] = useState(0);
  const [prevTranslate, setPrevTranslate] = useState(0);

  const trackRef = useRef(null);
  const animRef = useRef(null);

  const cardWidth = 260;
  const cardGap = 16;
  const totalCardWidth = cardWidth + cardGap;

  const getTranslateForIndex = useCallback(
    (idx) => {
      const containerCenter = 195;
      return containerCenter - idx * totalCardWidth - cardWidth / 2;
    },
    [totalCardWidth, cardWidth]
  );

  useEffect(() => {
    setCurrentTranslate(getTranslateForIndex(activeIndex));
    setPrevTranslate(getTranslateForIndex(activeIndex));
  }, [activeIndex, getTranslateForIndex]);

  const handleTouchStart = (e) => {
    setIsDragging(true);
    setStartX(e.touches ? e.touches[0].clientX : e.clientX);
    if (animRef.current) cancelAnimationFrame(animRef.current);
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    const currentX = e.touches ? e.touches[0].clientX : e.clientX;
    const diff = currentX - startX;
    setCurrentTranslate(prevTranslate + diff);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    const moved = currentTranslate - prevTranslate;
    let newIndex = activeIndex;
    if (moved < -50 && activeIndex < FINISHES.length - 1) newIndex = activeIndex + 1;
    else if (moved > 50 && activeIndex > 0) newIndex = activeIndex - 1;
    setActiveIndex(newIndex);
    const newTranslate = getTranslateForIndex(newIndex);
    setCurrentTranslate(newTranslate);
    setPrevTranslate(newTranslate);
  };

  const activeFinish = FINISHES[activeIndex];

  return (
    <div style={{ width: "100%", minHeight: "100vh", background: "#f5f3ef", display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 20, fontFamily: "'SF Pro Display', -apple-system, sans-serif" }}>
      {/* Phone frame */}
      <div style={{ width: 390, height: 844, background: "#FCFBF9", borderRadius: 44, overflow: "hidden", position: "relative", boxShadow: "0 30px 80px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.08)", display: "flex", flexDirection: "column" }}>

        {/* Status bar */}
        <div style={{ height: 54, flexShrink: 0, display: "flex", alignItems: "flex-end", justifyContent: "center", paddingBottom: 6 }}>
          <div style={{ width: 120, height: 5, background: "#1a1a1a", borderRadius: 100 }} />
        </div>

        {/* Section Header */}
        <div style={{ textAlign: "center", padding: "12px 24px 16px", flexShrink: 0 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.25em", textTransform: "uppercase", color: "#f2663b", marginBottom: 6 }}>
            Hardware Finishes
          </div>
          <h2 style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.03em", color: "#2A2422", margin: 0, lineHeight: 1.1 }}>
            Select your finish.
          </h2>
        </div>

        {/* Swiper Area */}
        <div
          style={{
            flex: 1,
            position: "relative",
            overflow: "hidden",
            touchAction: "pan-y",
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleTouchStart}
          onMouseMove={isDragging ? handleTouchMove : undefined}
          onMouseUp={handleTouchEnd}
          onMouseLeave={isDragging ? handleTouchEnd : undefined}
        >
          {/* Cards Track */}
          <div
            ref={trackRef}
            style={{
              display: "flex",
              gap: cardGap,
              position: "absolute",
              top: 0,
              bottom: sheetOpen ? 240 : 80,
              transform: `translateX(${currentTranslate}px)`,
              transition: isDragging ? "none" : "transform 0.5s cubic-bezier(0.32, 0.72, 0, 1)",
              alignItems: "stretch",
              userSelect: "none",
            }}
          >
            {FINISHES.map((f, i) => {
              const isActive = i === activeIndex;
              const fColor = faucetColors[f.id];
              return (
                <div
                  key={f.id}
                  onClick={() => { setActiveIndex(i); }}
                  style={{
                    width: cardWidth,
                    flexShrink: 0,
                    borderRadius: 28,
                    background: f.color,
                    position: "relative",
                    overflow: "hidden",
                    cursor: "pointer",
                    transform: isActive ? "scale(1)" : "scale(0.92)",
                    opacity: isActive ? 1 : 0.6,
                    transition: "transform 0.5s cubic-bezier(0.32, 0.72, 0, 1), opacity 0.5s ease",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {/* Ambient glow */}
                  <div style={{
                    position: "absolute",
                    top: "-30%",
                    left: "-30%",
                    width: "160%",
                    height: "160%",
                    background: `radial-gradient(ellipse at 40% 30%, ${f.textMode === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.03)"} 0%, transparent 70%)`,
                    pointerEvents: "none",
                  }} />

                  {/* Finish Label */}
                  <div style={{
                    position: "absolute",
                    top: 28,
                    left: 0,
                    right: 0,
                    textAlign: "center",
                    zIndex: 2,
                  }}>
                    <span style={{
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: "0.2em",
                      textTransform: "uppercase",
                      color: f.textMode === "dark" ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.45)",
                    }}>
                      {f.label}
                    </span>
                  </div>

                  {/* Faucet */}
                  <div style={{
                    width: "70%",
                    maxWidth: 180,
                    marginTop: 20,
                    transition: "transform 0.6s cubic-bezier(0.32, 0.72, 0, 1)",
                    transform: isActive ? "translateY(0) scale(1)" : "translateY(10px) scale(0.95)",
                  }}>
                    <FaucetSVG color={fColor.color} accent={fColor.accent} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination dots */}
          <div style={{
            position: "absolute",
            bottom: sheetOpen ? 256 : 30,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            gap: 8,
            transition: "bottom 0.5s cubic-bezier(0.32, 0.72, 0, 1)",
            zIndex: 20,
          }}>
            {FINISHES.map((f, i) => (
              <button
                key={f.id}
                onClick={() => setActiveIndex(i)}
                style={{
                  width: i === activeIndex ? 24 : 8,
                  height: 8,
                  borderRadius: 100,
                  border: "none",
                  background: i === activeIndex ? "#f2663b" : "rgba(0,0,0,0.15)",
                  cursor: "pointer",
                  transition: "all 0.4s cubic-bezier(0.32, 0.72, 0, 1)",
                  padding: 0,
                }}
              />
            ))}
          </div>

          {/* "View Details" tap hint */}
          <button
            onClick={() => setSheetOpen(!sheetOpen)}
            style={{
              position: "absolute",
              bottom: sheetOpen ? 256 + 36 : 56,
              left: "50%",
              transform: "translateX(-50%)",
              background: "rgba(0,0,0,0.06)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(0,0,0,0.08)",
              borderRadius: 100,
              padding: "8px 20px",
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.05em",
              color: "#2A2422",
              cursor: "pointer",
              transition: "all 0.5s cubic-bezier(0.32, 0.72, 0, 1)",
              zIndex: 20,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            {sheetOpen ? "Close" : "View Details"}
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ transform: sheetOpen ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.3s ease" }}>
              <path d="M3 5L6 8L9 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {/* Bottom Sheet */}
          <div style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 240,
            transform: sheetOpen ? "translateY(0)" : "translateY(100%)",
            transition: "transform 0.55s cubic-bezier(0.32, 0.72, 0, 1)",
            zIndex: 30,
            display: "flex",
            flexDirection: "column",
          }}>
            {/* Sheet glass */}
            <div style={{
              flex: 1,
              background: activeFinish.textMode === "dark"
                ? "rgba(22, 24, 29, 0.92)"
                : "rgba(255, 255, 255, 0.92)",
              backdropFilter: "blur(40px) saturate(1.6)",
              WebkitBackdropFilter: "blur(40px) saturate(1.6)",
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              padding: "20px 28px 24px",
              display: "flex",
              flexDirection: "column",
              transition: "background 0.5s ease",
              boxShadow: "0 -10px 40px rgba(0,0,0,0.12)",
            }}>
              {/* Drag indicator */}
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
                <div style={{
                  width: 36,
                  height: 4,
                  borderRadius: 100,
                  background: activeFinish.textMode === "dark" ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.12)",
                }} />
              </div>

              {/* Content */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
                <div>
                  <span style={{
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: "0.25em",
                    textTransform: "uppercase",
                    color: "#f2663b",
                  }}>
                    {activeFinish.id.replace("-", " ")}
                  </span>
                  <h3 style={{
                    fontSize: 28,
                    fontWeight: 700,
                    letterSpacing: "-0.03em",
                    margin: "4px 0 0",
                    color: activeFinish.textMode === "dark" ? "#fff" : "#2A2422",
                    lineHeight: 1.1,
                  }}>
                    {activeFinish.label}
                  </h3>
                </div>

                <p style={{
                  fontSize: 13,
                  lineHeight: 1.55,
                  color: activeFinish.textMode === "dark" ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.5)",
                  margin: 0,
                }}>
                  {activeFinish.desc}
                </p>

                {/* Color picker row */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: "auto" }}>
                  {FINISHES.map((f, i) => (
                    <button
                      key={f.id}
                      onClick={(e) => { e.stopPropagation(); setActiveIndex(i); }}
                      style={{
                        width: i === activeIndex ? 40 : 34,
                        height: i === activeIndex ? 40 : 34,
                        borderRadius: "50%",
                        background: f.color,
                        border: i === activeIndex
                          ? "3px solid #f2663b"
                          : `2px solid ${activeFinish.textMode === "dark" ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.1)"}`,
                        cursor: "pointer",
                        transition: "all 0.35s cubic-bezier(0.32, 0.72, 0, 1)",
                        boxShadow: i === activeIndex ? "0 0 16px rgba(242,102,59,0.4)" : "none",
                        padding: 0,
                        flexShrink: 0,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Home indicator */}
        <div style={{ height: 34, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: sheetOpen ? (activeFinish.textMode === "dark" ? "rgba(22,24,29,0.92)" : "rgba(255,255,255,0.92)") : "transparent", transition: "background 0.5s ease" }}>
          <div style={{ width: 134, height: 5, background: sheetOpen ? (activeFinish.textMode === "dark" ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.15)") : "rgba(0,0,0,0.15)", borderRadius: 100, transition: "background 0.5s ease" }} />
        </div>
      </div>

      {/* Hint text */}
      <div style={{ marginTop: 24, textAlign: "center", padding: "0 20px" }}>
        <p style={{ fontSize: 13, color: "rgba(0,0,0,0.4)", margin: 0, lineHeight: 1.5 }}>
          ← Swipe cards to browse &nbsp;·&nbsp; Tap "View Details" for bottom sheet
        </p>
      </div>
    </div>
  );
}
