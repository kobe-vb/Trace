import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../../api/api";
import { useCodeSubmit } from "../../layouts/CodeLayout";

/**
 * GlazenBrugPage
 *
 * API verwacht:
 *   GET /game/glazen_brug/{player}  →  string bijv. "LRLLRR" (6 chars, L of R)
 *
 * Flow:
 *   1. Ophalen van de oplossing bij laden
 *   2. Speler klikt L of R per rij → instant check vs lokale oplossing
 *   3. Juist  → volgende rij, bij laatste rij: submitCode(correcteCode)
 *   4. Fout   → brekanimatie tonen, daarna navigate /wrong_code (geen submit)
 */

const ROWS = 6;
type Side = "L" | "R";
type TileState = "idle" | "correct" | "wrong" | "safe";

interface Tile {
    side: Side;
    state: TileState;
}

const BREAK_DURATION = 900;

export default function GlazenBrugPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { submitCode } = useCodeSubmit();

    const player = searchParams.get("player") ?? "";
    const station = searchParams.get("station") ?? "";

    const [solution, setSolution] = useState<Side[] | null>(null);
    const [tiles, setTiles] = useState<Tile[][]>([]);
    const [currentRow, setCurrentRow] = useState(0);
    const [phase, setPhase] = useState<"loading" | "playing" | "breaking" | "dead" | "done">("loading");
    const correctCodeRef = useRef<string>("");

    function buildTiles(): Tile[][] {
        return Array.from({ length: ROWS }, () => [
            { side: "L", state: "idle" },
            { side: "R", state: "idle" },
        ]);
    }

    useEffect(() => {
        if (!player) { navigate("/"); return; }

        async function load() {
            try {
                const sol: string = await api.get(`/game/code/${player}`);
                const parsed = sol.toUpperCase().split("") as Side[];
                setSolution(parsed);
                correctCodeRef.current = sol;
                setTiles(buildTiles());
                setPhase("playing");
            } catch (err) {
                console.error("Ophalen oplossing mislukt:", err);
                navigate("/error");
            }
        }
        load();
    }, [player]);

    function getTileIndex(side: Side) {
        return side === "L" ? 0 : 1;
    }

    function handleChoice(side: Side) {
        if (phase !== "playing" || !solution) return;
        if (currentRow >= ROWS) return;

        const isCorrect = side === solution[currentRow];

        // Mark gekozen tegel
        setTiles((prev) => {
            const next = prev.map((row) => [...row]);
            next[currentRow][getTileIndex(side)] = { side, state: isCorrect ? "correct" : "wrong" };
            return next;
        });

        if (isCorrect) {
            // Andere kant vervaagt na korte pauze
            setTimeout(() => {
                setTiles((prev) => {
                    const next = prev.map((row) => [...row]);
                    const other: Side = side === "L" ? "R" : "L";
                    next[currentRow][getTileIndex(other)] = { side: other, state: "safe" };
                    return next;
                });
            }, 300);

            if (currentRow + 1 >= ROWS) {
                // Klaar! Stuur de correcte code in
                setPhase("done");
                setTimeout(() => submitCode(correctCodeRef.current), 800);
            } else {
                setTimeout(() => {
                    setCurrentRow((r) => r + 1);
                }, 500);
            }
        } else {
            // Fout — animatie, daarna wrong_code zonder submit
            setPhase("breaking");
            setTimeout(() => {
                setPhase("dead");
                setTimeout(() => {
                    navigate(`/wrong_code?station=${encodeURIComponent(station)}`);
                }, 1000);
            }, BREAK_DURATION);
        }
    }

    if (phase === "loading") {
        return (
            <div style={{ textAlign: "center", padding: "2rem", color: "var(--mantine-color-dimmed)", fontSize: 13 }}>
                Brug laden…
            </div>
        );
    }

    return (
        <div style={styles.root}>
            <style>{css}</style>

            <div style={styles.bridge}>
                <Platform label="START" />

                {tiles.map((row, rowIdx) => {
                    const isCurrentRow = rowIdx === currentRow && phase === "playing";
                    const isPast = rowIdx < currentRow;
                    const isFuture = rowIdx > currentRow;

                    return (
                        <div key={rowIdx} style={styles.row}>
                            {row.map((tile, tileIdx) => {
                                const isBreaking = phase === "breaking" && tile.state === "wrong";
                                const clickable = isCurrentRow;

                                let tileStyle = { ...styles.tile };
                                if (tile.state === "correct") tileStyle = { ...tileStyle, ...styles.tileCorrect };
                                else if (tile.state === "wrong") tileStyle = { ...tileStyle, ...styles.tileWrong };
                                else if (tile.state === "safe") tileStyle = { ...tileStyle, ...styles.tileSafe };
                                else if (isFuture) tileStyle = { ...tileStyle, ...styles.tileFuture };
                                else if (isPast) tileStyle = { ...tileStyle, ...styles.tileSafe };
                                else if (isCurrentRow) tileStyle = { ...tileStyle, ...styles.tileClickable };

                                return (
                                    <button
                                        key={tileIdx}
                                        disabled={!clickable}
                                        onClick={() => clickable && handleChoice(tile.side)}
                                        style={tileStyle}
                                        className={
                                            isBreaking ? "tile-break"
                                            : isCurrentRow && tile.state === "idle" ? "tile-glow"
                                            : ""
                                        }
                                    >
                                        <span style={styles.tileLabel}>{tile.side}</span>
                                        {tile.state === "wrong" && <span style={styles.crack}>✕</span>}
                                        {tile.state === "correct" && <span style={styles.checkmark}>✓</span>}
                                    </button>
                                );
                            })}

                            <div style={{
                                ...styles.rowNum,
                                color: isPast ? "#1d9e75" : isCurrentRow ? "#f0c040" : "var(--mantine-color-dimmed)",
                            }}>
                                {ROWS - rowIdx}
                            </div>
                        </div>
                    );
                })}

                <Platform label="FINISH" />
            </div>

            <div style={styles.statusBar}>
                {phase === "playing" && (
                    <span style={{ color: "#f0c040" }}>
                        STAP {currentRow + 1} / {ROWS} — kies links of rechts
                    </span>
                )}
                {phase === "breaking" && (
                    <span style={{ color: "#e24b4a" }} className="pulse-red">
                        HET GLAS BREEKT...
                    </span>
                )}
                {phase === "dead" && (
                    <span style={{ color: "#e24b4a" }}>GEVALLEN ↓</span>
                )}
                {phase === "done" && (
                    <span style={{ color: "#1d9e75" }}>DE OVERKANT BEREIKT ✓</span>
                )}
            </div>
        </div>
    );
}

function Platform({ label }: { label: string }) {
    return (
        <div style={{
            width: "100%",
            height: 28,
            background: "rgba(29, 80, 50, 0.4)",
            border: "1px solid #2d5a3d",
            borderRadius: 4,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
        }}>
            <span style={{ fontSize: 10, color: "#4a9a6a", letterSpacing: 3, fontWeight: 600 }}>
                {label}
            </span>
        </div>
    );
}

const styles: Record<string, React.CSSProperties> = {
    root: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "1rem",
        paddingBottom: "0.5rem",
    },
    bridge: {
        display: "flex",
        flexDirection: "column",
        gap: 6,
        width: "100%",
        maxWidth: 280,
    },
    row: {
        display: "flex",
        gap: 8,
        alignItems: "center",
        position: "relative",
    },
    rowNum: {
        position: "absolute",
        right: -22,
        fontSize: 11,
        fontWeight: 600,
        fontFamily: "monospace",
        transition: "color 0.3s",
    },
    tile: {
        flex: 1,
        height: 52,
        border: "1.5px solid #1e3328",
        borderRadius: 6,
        cursor: "not-allowed",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        transition: "all 0.2s",
        outline: "none",
        background: "rgba(20, 30, 25, 0.55)",
    },
    tileClickable: {
        background: "rgba(55, 138, 221, 0.1)",
        borderColor: "#378add",
        cursor: "pointer",
    },
    tileFuture: {
        background: "rgba(15, 22, 18, 0.7)",
        borderColor: "#141e14",
    },
    tileCorrect: {
        background: "rgba(29, 158, 117, 0.18)",
        borderColor: "#1d9e75",
        cursor: "default",
    },
    tileWrong: {
        background: "rgba(226, 75, 74, 0.22)",
        borderColor: "#e24b4a",
        cursor: "default",
    },
    tileSafe: {
        background: "rgba(15, 22, 18, 0.4)",
        borderColor: "#1a2a1a",
        cursor: "default",
        opacity: 0.45,
    },
    tileLabel: {
        fontSize: 20,
        fontWeight: 700,
        fontFamily: "monospace",
        color: "var(--mantine-color-text)",
        lineHeight: 1,
    },
    crack: {
        fontSize: 14,
        color: "#e24b4a",
        position: "absolute",
        top: 4,
        right: 6,
    },
    checkmark: {
        fontSize: 12,
        color: "#1d9e75",
        position: "absolute",
        top: 4,
        right: 6,
    },
    statusBar: {
        minHeight: 24,
        textAlign: "center",
        fontSize: 13,
        letterSpacing: 1,
    },
};

const css = `
@keyframes tile-break {
    0%   { transform: scale(1) rotate(0deg); opacity: 1; }
    25%  { transform: scale(1.06) rotate(-3deg); }
    60%  { transform: scale(0.93) rotate(4deg); opacity: 0.65; }
    100% { transform: scale(0.82) rotate(-6deg) translateY(8px); opacity: 0.2; }
}
@keyframes tile-glow-pulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(55,138,221,0.3); }
    50%       { box-shadow: 0 0 0 6px rgba(55,138,221,0.12); }
}
@keyframes pulse-red {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.35; }
}
.tile-break { animation: tile-break ${BREAK_DURATION}ms ease-in forwards; }
.tile-glow  { animation: tile-glow-pulse 1.5s ease-in-out infinite; }
.pulse-red  { animation: pulse-red 0.55s ease-in-out infinite; }
`;