import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../../api/api";
import { useCodeSubmit } from "../../layouts/CodeLayout";

/**
 * MorseCodePage
 *
 * API verwacht:
 *   GET /game/code/{player}
 *   → string bijv. "h:.._,m:_..,l:._.|hmml"
 *
 * Formaat:
 *   - Vóór "|": komma-gescheiden letter:morse paren
 *     De lettercode bepaalt de frequentie (toonhoogte) van de piep:
 *       a=220Hz, b=247Hz, c=262Hz, d=294Hz, e=330Hz, f=349Hz, g=392Hz, h=440Hz, ...
 *     De morse geeft de volgorde van punten en strepen.
 *   - Na "|": de te decoderen code, bijv. "hmml"
 *
 * Elke letter heeft zijn eigen frequentie zodat speler kan onderscheiden
 * welke letter gespeeld wordt.
 */

// ── Morse timing (ms) ──────────────────────────────────────────────
const DOT_MS = 200;
const DASH_MS = DOT_MS * 3;
const SYMBOL_GAP = DOT_MS;       // tussen . en - binnen zelfde letter
const LETTER_GAP = DOT_MS * 3;   // tussen letters

// ── Letter → frequentie mapping ────────────────────────────────────
const LETTER_FREQ: Record<string, number> = {
    a: 220, b: 247, c: 262, d: 294, e: 330,
    f: 349, g: 392, h: 440, i: 494, j: 523,
    k: 587, l: 659, m: 698, n: 784, o: 880,
    p: 988, q: 1047, r: 1175, s: 1319, t: 1397,
    u: 1568, v: 1760, w: 1976, x: 2093, y: 2349, z: 2637,
};

interface LetterDef {
    letter: string;
    morse: string;
    freq: number;
}

function parsePayload(raw: string): { defs: LetterDef[]; code: string } {
    const [defsPart, code] = raw.split("|");
    const defs: LetterDef[] = defsPart.split(",").map((chunk) => {
        const [letter, morse] = chunk.split(":");
        return {
            letter: letter.toLowerCase(),
            morse,
            freq: LETTER_FREQ[letter.toLowerCase()] ?? 440,
        };
    });
    return { defs, code: code.toLowerCase() };
}

// ── Build a flat timeline of beep events ──────────────────────────
interface BeepEvent {
    startMs: number;
    durationMs: number;
    freq: number;
    letter: string;
}

function buildTimeline(defs: LetterDef[], code: string): BeepEvent[] {
    const defMap = Object.fromEntries(defs.map((d) => [d.letter, d]));
    const events: BeepEvent[] = [];
    let t = 0;

    for (let i = 0; i < code.length; i++) {
        const letter = code[i];
        const def = defMap[letter];
        if (!def) { t += LETTER_GAP; continue; }

        for (let j = 0; j < def.morse.length; j++) {
            const sym = def.morse[j];
            const dur = sym === "." ? DOT_MS : DASH_MS;
            events.push({ startMs: t, durationMs: dur, freq: def.freq, letter });
            t += dur + SYMBOL_GAP;
        }
        t += LETTER_GAP;
    }

    return events;
}

// ── Component ─────────────────────────────────────────────────────

type Phase = "loading" | "ready" | "playing" | "played" | "done";

export default function MorseCodePage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { submitCode, loading } = useCodeSubmit();

    const player = searchParams.get("player") ?? "";
    const station = searchParams.get("station") ?? "";

    const [phase, setPhase] = useState<Phase>("loading");
    const [defs, setDefs] = useState<LetterDef[]>([]);
    const [code, setCode] = useState("");
    const [answer, setAnswer] = useState("");
    const [flash, setFlash] = useState(false);

    const audioCtxRef = useRef<AudioContext | null>(null);
    const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

    useEffect(() => {
        if (!player) { navigate("/"); return; }

        async function load() {
            try {
                const raw: string = await api.get(`/game/code/${player}`);
                const { defs: d, code: c } = parsePayload(raw);
                setDefs(d);
                setCode(c);
                setPhase("ready");
            } catch {
                navigate("/error?station=" + station);
                console.error("Failed to load Morse code for player", player);
            }
        }
        load();
    }, [player]);

    function clearAll() {
        timeoutsRef.current.forEach(clearTimeout);
        timeoutsRef.current = [];
        setFlash(false);
    }

    function playMorse() {
        if (phase === "playing") return;
        clearAll();
        setPhase("playing");

        if (!audioCtxRef.current) {
            audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        const ctx = audioCtxRef.current;
        const timeline = buildTimeline(defs, code);
        const totalMs = timeline.length
            ? timeline[timeline.length - 1].startMs + timeline[timeline.length - 1].durationMs + LETTER_GAP
            : 500;

        // Schedule Web Audio beeps
        const now = ctx.currentTime;
        for (const ev of timeline) {
            const startSec = now + ev.startMs / 1000;
            const durSec = ev.durationMs / 1000;

            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = "sine";
            osc.frequency.value = ev.freq;
            gain.gain.setValueAtTime(0, startSec);
            gain.gain.linearRampToValueAtTime(0.4, startSec + 0.005);
            gain.gain.linearRampToValueAtTime(0.4, startSec + durSec - 0.005);
            gain.gain.linearRampToValueAtTime(0, startSec + durSec);
            osc.start(startSec);
            osc.stop(startSec + durSec);
        }

        // Schedule visual flashes
        for (const ev of timeline) {
            const t1 = setTimeout(() => setFlash(true), ev.startMs);
            const t2 = setTimeout(() => setFlash(false), ev.startMs + ev.durationMs);
            timeoutsRef.current.push(t1, t2);
        }

        // Done
        const tEnd = setTimeout(() => {
            setFlash(false);
            setPhase("played");
        }, totalMs);
        timeoutsRef.current.push(tEnd);
    }

    function handleConfirm() {
        if (!answer.trim()) return;
        setPhase("done");
        submitCode(answer.trim().toLowerCase());
    }

    // ── Render ────────────────────────────────────────────────────

    if (phase === "loading") {
        return (
            <div style={{ textAlign: "center", padding: "2rem", color: "var(--mantine-color-dimmed)", fontSize: 13 }}>
                Morse laden…
            </div>
        );
    }

    const isPlaying = phase === "playing";

    return (
        <div style={S.root}>
            <style>{css}</style>

            {/* ── Flash lamp ── */}
            <div style={{ ...S.lamp, ...(flash ? S.lampOn : {}) }} className={flash ? "lamp-pulse" : ""}>
                <div style={S.lampInner}>
                    {flash
                        ? <span style={{ fontSize: 28 }}>💡</span>
                        : <span style={{ fontSize: 22, opacity: 0.35 }}>💡</span>
                    }
                </div>
                {flash && <div style={S.lampGlow} />}
            </div>

            {/* ── Play button ── */}
            {(phase === "ready" || phase === "playing") && (
            <button
                style={{ ...S.playBtn, ...(isPlaying ? S.playBtnActive : {}) }}
                onClick={playMorse}
                disabled={isPlaying}
            >
                {isPlaying
                    ? <><span className="blink-dot">●</span> Speelt af…</>
                    : "▶ Start morse"
                }
            </button>
            )}

            {/* ── Answer input ── */}
            {(phase === "played" || phase === "done") && (
                <div style={S.answerWrap}>
                    <div style={S.answerLabel}>Wat hoorde je?</div>
                    <input
                        style={S.input}
                        type="text"
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
                        placeholder="typ de letters..."
                        autoCapitalize="none"
                        autoCorrect="off"
                        spellCheck={false}
                        disabled={phase === "done"}
                    />
                    <button
                        style={{
                            ...S.confirmBtn,
                            ...(!answer.trim() || loading || phase === "done" ? S.confirmDisabled : {}),
                        }}
                        disabled={!answer.trim() || !!loading || phase === "done"}
                        onClick={handleConfirm}
                    >
                        {loading ? "Bezig…" : "Bevestig"}
                    </button>
                </div>
            )}
        </div>
    );
}

// ── Styles ────────────────────────────────────────────────────────
const S: Record<string, React.CSSProperties> = {
    root: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "1rem",
        paddingBottom: "1rem",
        userSelect: "none",
        WebkitUserSelect: "none",
    },
    lamp: {
        width: 90,
        height: 90,
        borderRadius: "50%",
        border: "2.5px solid rgba(200,180,60,0.2)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        background: "rgba(30,28,20,0.8)",
        transition: "border-color 0.05s, background 0.05s",
    },
    lampOn: {
        background: "rgba(255,240,100,0.12)",
        borderColor: "rgba(240,200,60,0.8)",
    },
    lampInner: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1,
    },
    lampGlow: {
        position: "absolute",
        inset: -12,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(255,240,80,0.25) 0%, transparent 70%)",
        pointerEvents: "none",
    },
    playBtn: {
        width: "100%",
        maxWidth: 340,
        padding: "13px 0",
        fontSize: 15,
        fontWeight: 700,
        letterSpacing: 2,
        border: "none",
        borderRadius: 10,
        background: "linear-gradient(135deg, #378add, #1a4a8a)",
        color: "#fff",
        cursor: "pointer",
        transition: "opacity 0.2s",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
    },
    playBtnActive: {
        opacity: 0.55,
        cursor: "not-allowed",
    },
    answerWrap: {
        width: "100%",
        maxWidth: 340,
        display: "flex",
        flexDirection: "column",
        gap: 8,
    },
    answerLabel: {
        fontSize: 11,
        letterSpacing: 2,
        color: "var(--mantine-color-dimmed)",
        fontWeight: 700,
        textAlign: "center",
    },
    input: {
        width: "100%",
        padding: "11px 14px",
        fontSize: 18,
        fontFamily: "monospace",
        letterSpacing: 4,
        textAlign: "center",
        borderRadius: 8,
        border: "1.5px solid rgba(100,120,110,0.35)",
        background: "rgba(20,30,25,0.7)",
        color: "var(--mantine-color-text)",
        outline: "none",
        boxSizing: "border-box",
    },
    confirmBtn: {
        width: "100%",
        padding: "12px 0",
        fontSize: 14,
        fontWeight: 700,
        letterSpacing: 2,
        border: "none",
        borderRadius: 10,
        background: "linear-gradient(135deg, #1d9e75, #0d5a42)",
        color: "#fff",
        cursor: "pointer",
        transition: "opacity 0.2s",
    },
    confirmDisabled: {
        opacity: 0.35,
        cursor: "not-allowed",
    },
};

const css = `
@keyframes blink {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.1; }
}
.blink-dot { animation: blink 0.5s ease-in-out infinite; }
`;