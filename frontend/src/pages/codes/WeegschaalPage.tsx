import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../../api/api";
import { useCodeSubmit } from "../../layouts/CodeLayout";

/**
 * WeegschaalPage
 *
 * API verwacht:
 *   GET /game/code/{player}  →  string bijv. "anker,steen = veer,munt,munt"
 *
 * Flow:
 *   1. Ophalen van de oplossing bij laden
 *   2. Speler sleept objecten naar links of rechts (of omhoog/omlaag op mobile)
 *   3. Bevestig → submitCode(code) als "links = rechts" formaat
 */

const OBJECTS: Record<string, string> = {
    anker: "⚓",
    veer: "🪶",
    steen: "🪨",
    munt: "🪙",
    emmer: "🪣",
    sleutel: "🔑",
};

type Zone = "left" | "right" | "pool";

interface ObjectInstance {
    id: string;    // e.g. "munt_0", "munt_1"
    name: string;  // e.g. "munt"
    zone: Zone;
}

function parseCode(code: string): ObjectInstance[] {
    // "anker,steen = veer,munt,munt"
    const [leftStr, rightStr] = code.split("=").map((s) => s.trim());
    const leftNames = leftStr ? leftStr.split(",").map((s) => s.trim()) : [];
    const rightNames = rightStr ? rightStr.split(",").map((s) => s.trim()) : [];

    const counts: Record<string, number> = {};
    const allNames = [...leftNames, ...rightNames];
    const instances: ObjectInstance[] = [];

    for (const name of allNames) {
        counts[name] = (counts[name] ?? 0) + 1;
        instances.push({
            id: `${name}_${counts[name] - 1}`,
            name,
            zone: "pool",
        });
    }

    return instances;
}

function buildCode(instances: ObjectInstance[]): string {
    const left = instances.filter((o) => o.zone === "left").map((o) => o.name);
    const right = instances.filter((o) => o.zone === "right").map((o) => o.name);
    return `${left.join(",")} = ${right.join(",")}`;
}

export default function WeegschaalPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { submitCode, loading } = useCodeSubmit();

    const player = searchParams.get("player") ?? "";
    const station = searchParams.get("station") ?? "";

    const [phase, setPhase] = useState<"loading" | "playing" | "done">("loading");
    const [instances, setInstances] = useState<ObjectInstance[]>([]);
    const [dragging, setDragging] = useState<string | null>(null);
    const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
    const [hoverZone, setHoverZone] = useState<Zone | null>(null);

    const leftRef = useRef<HTMLDivElement>(null);
    const rightRef = useRef<HTMLDivElement>(null);
    const poolRef = useRef<HTMLDivElement>(null);
    const dragRef = useRef<string | null>(null);

    useEffect(() => {
        if (!player) { navigate("/"); return; }

        async function load() {
            try {
                const code: string = await api.get(`/game/code/${player}`);
                setInstances(parseCode(code));
                setPhase("playing");
            } catch {
                navigate("/error");
            }
        }
        load();
    }, [player]);

    // ── Drag helpers ──────────────────────────────────────────────

    function getZoneFromPoint(x: number, y: number): Zone | null {
        for (const [ref, zone] of [
            [leftRef, "left"],
            [rightRef, "right"],
            [poolRef, "pool"],
        ] as [React.RefObject<HTMLDivElement>, Zone][]) {
            const el = ref.current;
            if (!el) continue;
            const r = el.getBoundingClientRect();
            if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return zone;
        }
        return null;
    }

    function startDrag(id: string, clientX: number, clientY: number) {
        if (phase !== "playing") return;
        dragRef.current = id;
        setDragging(id);
        setDragPos({ x: clientX, y: clientY });
    }

    function moveDrag(clientX: number, clientY: number) {
        if (!dragRef.current) return;
        setDragPos({ x: clientX, y: clientY });
        const zone = getZoneFromPoint(clientX, clientY);
        setHoverZone(zone);
    }

    function endDrag(clientX: number, clientY: number) {
        const id = dragRef.current;
        if (!id) return;
        dragRef.current = null;

        const zone = getZoneFromPoint(clientX, clientY);
        if (zone) {
            setInstances((prev) =>
                prev.map((o) => (o.id === id ? { ...o, zone } : o))
            );
        }
        setDragging(null);
        setDragPos(null);
        setHoverZone(null);
    }

    useEffect(() => {
        const onMove = (e: MouseEvent) => moveDrag(e.clientX, e.clientY);
        const onUp = (e: MouseEvent) => endDrag(e.clientX, e.clientY);
        const onTouchMove = (e: TouchEvent) => {
            e.preventDefault();
            moveDrag(e.touches[0].clientX, e.touches[0].clientY);
        };
        const onTouchEnd = (e: TouchEvent) => {
            const t = e.changedTouches[0];
            endDrag(t.clientX, t.clientY);
        };

        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onUp);
        window.addEventListener("touchmove", onTouchMove, { passive: false });
        window.addEventListener("touchend", onTouchEnd);

        return () => {
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mouseup", onUp);
            window.removeEventListener("touchmove", onTouchMove);
            window.removeEventListener("touchend", onTouchEnd);
        };
    }, [phase]);

    // ── Derived state ─────────────────────────────────────────────

    const leftItems = instances.filter((o) => o.zone === "left");
    const rightItems = instances.filter((o) => o.zone === "right");
    const poolItems = instances.filter((o) => o.zone === "pool");

    const balanced = leftItems.length + rightItems.length === instances.length && leftItems.length > 0 && rightItems.length > 0;

    function handleConfirm() {
        if (!balanced) return;
        setPhase("done");
        submitCode(buildCode(instances));
    }

    // ── Render ────────────────────────────────────────────────────

    if (phase === "loading") {
        return (
            <div style={{ textAlign: "center", padding: "2rem", color: "var(--mantine-color-dimmed)", fontSize: 13 }}>
                Weegschaal laden…
            </div>
        );
    }

    const draggedInstance = instances.find((o) => o.id === dragging);

    return (
        <div style={S.root} onMouseDown={(e) => e.preventDefault()}>
            <style>{css}</style>

            {/* ── Scale visual ── */}
            <div style={S.scaleWrap}>
                {/* beam */}
                <div style={S.beam}>
                    <div style={S.pivot} />
                    <div style={S.post} />
                </div>

                {/* pans row */}
                <div style={S.pansRow}>
                    {/* LEFT pan */}
                    <div style={S.panCol}>
                        <div
                            ref={leftRef}
                            style={{
                                ...S.pan,
                                ...(hoverZone === "left" ? S.panHover : {}),
                            }}
                        >
                            <span style={S.panLabel}>LINKS</span>
                            <div style={S.panItems}>
                                {leftItems.map((o) => (
                                    <ObjectChip
                                        key={o.id}
                                        instance={o}
                                        isDragging={dragging === o.id}
                                        onStartDrag={startDrag}
                                    />
                                ))}
                            </div>
                        </div>
                        <div style={S.rope} />
                    </div>

                    {/* RIGHT pan */}
                    <div style={S.panCol}>
                        <div style={S.rope} />
                        <div
                            ref={rightRef}
                            style={{
                                ...S.pan,
                                ...(hoverZone === "right" ? S.panHover : {}),
                            }}
                        >
                            <span style={S.panLabel}>RECHTS</span>
                            <div style={S.panItems}>
                                {rightItems.map((o) => (
                                    <ObjectChip
                                        key={o.id}
                                        instance={o}
                                        isDragging={dragging === o.id}
                                        onStartDrag={startDrag}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Pool ── */}
            <div style={S.poolSection}>
                <div style={S.poolLabel}>Beschikbare objecten</div>
                <div
                    ref={poolRef}
                    style={{
                        ...S.pool,
                        ...(hoverZone === "pool" ? S.panHover : {}),
                    }}
                >
                    {poolItems.length === 0 ? (
                        <span style={{ fontSize: 12, color: "var(--mantine-color-dimmed)", opacity: 0.5 }}>
                            — alle objecten zijn geplaatst —
                        </span>
                    ) : (
                        poolItems.map((o) => (
                            <ObjectChip
                                key={o.id}
                                instance={o}
                                isDragging={dragging === o.id}
                                onStartDrag={startDrag}
                            />
                        ))
                    )}
                </div>
            </div>

            {/* ── Confirm ── */}
            <button
                style={{
                    ...S.confirmBtn,
                    ...(balanced && !loading ? {} : S.confirmDisabled),
                }}
                disabled={!balanced || !!loading}
                onClick={handleConfirm}
            >
                {loading ? "Bezig…" : "Bevestig"}
            </button>

            {/* ── Floating drag ghost ── */}
            {dragging && dragPos && draggedInstance && (
                <div
                    style={{
                        ...S.ghost,
                        left: dragPos.x - 26,
                        top: dragPos.y - 26,
                    }}
                >
                    {OBJECTS[draggedInstance.name] ?? "?"}
                </div>
            )}
        </div>
    );
}

// ── ObjectChip ────────────────────────────────────────────────────

interface ChipProps {
    instance: ObjectInstance;
    isDragging: boolean;
    onStartDrag: (id: string, x: number, y: number) => void;
}

function ObjectChip({ instance, isDragging, onStartDrag }: ChipProps) {
    return (
        <div
            style={{
                ...S.chip,
                ...(isDragging ? S.chipDragging : {}),
            }}
            onMouseDown={(e) => {
                e.stopPropagation();
                onStartDrag(instance.id, e.clientX, e.clientY);
            }}
            onTouchStart={(e) => {
                e.stopPropagation();
                onStartDrag(instance.id, e.touches[0].clientX, e.touches[0].clientY);
            }}
        >
            <span style={{ fontSize: 22, lineHeight: 1 }}>{OBJECTS[instance.name] ?? "?"}</span>
            <span style={S.chipName}>{instance.name}</span>
        </div>
    );
}

// ── Styles ────────────────────────────────────────────────────────

const S: Record<string, React.CSSProperties> = {
    root: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "1.2rem",
        paddingBottom: "1rem",
        userSelect: "none",
        WebkitUserSelect: "none",
        position: "relative",
    },
    scaleWrap: {
        width: "100%",
        maxWidth: 340,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 0,
    },
    beam: {
        width: "85%",
        height: 8,
        background: "linear-gradient(90deg, #5a3a1a, #c8873c, #5a3a1a)",
        borderRadius: 4,
        position: "relative",
        display: "flex",
        justifyContent: "center",
    },
    pivot: {
        width: 14,
        height: 14,
        borderRadius: "50%",
        background: "#c8873c",
        border: "2px solid #8b5a1a",
        position: "absolute",
        top: -3,
        zIndex: 2,
    },
    post: {
        width: 6,
        height: 22,
        background: "linear-gradient(180deg, #c8873c, #5a3a1a)",
        borderRadius: 3,
        position: "absolute",
        top: 8,
        left: "calc(50% - 3px)",
    },
    pansRow: {
        width: "100%",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        paddingTop: 2,
    },
    panCol: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: "46%",
    },
    rope: {
        width: 2,
        height: 18,
        background: "rgba(200,135,60,0.5)",
    },
    pan: {
        width: "100%",
        minHeight: 90,
        border: "1.5px solid rgba(200,135,60,0.3)",
        borderRadius: 8,
        background: "rgba(200,135,60,0.06)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "6px 4px 8px",
        gap: 4,
        transition: "border-color 0.2s, background 0.2s",
    },
    panHover: {
        borderColor: "rgba(200,135,60,0.8)",
        background: "rgba(200,135,60,0.14)",
    },
    panLabel: {
        fontSize: 9,
        letterSpacing: 2,
        color: "rgba(200,135,60,0.6)",
        fontWeight: 700,
        marginBottom: 2,
    },
    panItems: {
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: 4,
        width: "100%",
    },
    poolSection: {
        width: "100%",
        maxWidth: 340,
        display: "flex",
        flexDirection: "column",
        gap: 6,
    },
    poolLabel: {
        fontSize: 10,
        letterSpacing: 2,
        color: "var(--mantine-color-dimmed)",
        fontWeight: 700,
        textAlign: "center",
    },
    pool: {
        width: "100%",
        minHeight: 70,
        border: "1.5px dashed rgba(100,120,110,0.3)",
        borderRadius: 10,
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        alignItems: "center",
        gap: 6,
        padding: "10px 8px",
        transition: "border-color 0.2s, background 0.2s",
    },
    chip: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 2,
        padding: "6px 10px",
        borderRadius: 8,
        border: "1.5px solid rgba(100,120,110,0.35)",
        background: "rgba(30,40,35,0.6)",
        cursor: "grab",
        transition: "opacity 0.15s, transform 0.15s",
        minWidth: 52,
    },
    chipDragging: {
        opacity: 0.2,
        transform: "scale(0.92)",
    },
    chipName: {
        fontSize: 9,
        color: "var(--mantine-color-dimmed)",
        fontWeight: 600,
        letterSpacing: 0.5,
        whiteSpace: "nowrap",
    },
    confirmBtn: {
        width: "100%",
        maxWidth: 340,
        padding: "12px 0",
        fontSize: 14,
        fontWeight: 700,
        letterSpacing: 2,
        border: "none",
        borderRadius: 10,
        background: "linear-gradient(135deg, #c8873c, #8b5a1a)",
        color: "#fff",
        cursor: "pointer",
        transition: "opacity 0.2s",
    },
    confirmDisabled: {
        opacity: 0.35,
        cursor: "not-allowed",
    },
    ghost: {
        position: "fixed",
        zIndex: 9999,
        pointerEvents: "none",
        fontSize: 36,
        lineHeight: 1,
        filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.5))",
        transform: "scale(1.15)",
    },
};

const css = `
`;