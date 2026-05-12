import { useEffect, useRef, useState } from "react";
import { useCodeSubmit } from "../../layouts/CodeLayout";

const GRID = 4;
const DOT_RADIUS = 18;
const CELL = 80;
const PADDING = 48;
const SVG_SIZE = PADDING * 2 + CELL * (GRID - 1);

interface Point {
    x: number;
    y: number;
    index: number;
}

function getCenter(index: number): Point {
    const col = index % GRID;
    const row = Math.floor(index / GRID);
    return {
        x: PADDING + col * CELL,
        y: PADDING + row * CELL,
        index,
    };
}

function getPointFromPos(
    svgRect: DOMRect,
    clientX: number,
    clientY: number,
    svgSize: number
): number | null {
    const scaleX = svgSize / svgRect.width;
    const scaleY = svgSize / svgRect.height;
    const localX = (clientX - svgRect.left) * scaleX;
    const localY = (clientY - svgRect.top) * scaleY;

    for (let i = 0; i < GRID * GRID; i++) {
        const { x, y } = getCenter(i);
        const dist = Math.hypot(localX - x, localY - y);
        if (dist < DOT_RADIUS + 10) return i;
    }
    return null;
}

export default function PatroonCodePage() {
    const { submitCode } = useCodeSubmit();

    const svgRef = useRef<SVGSVGElement>(null);
    const [path, setPath] = useState<number[]>([]);
    const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);
    const [dragging, setDragging] = useState(false);
    const [status, setStatus] = useState<"idle" | "wrong" | "done">("idle");
    const pathRef = useRef<number[]>([]);

    const points = Array.from({ length: GRID * GRID }, (_, i) => getCenter(i));

    function updateCursor(clientX: number, clientY: number) {
        if (!svgRef.current) return;
        const rect = svgRef.current.getBoundingClientRect();
        const scaleX = SVG_SIZE / rect.width;
        const scaleY = SVG_SIZE / rect.height;
        setCursor({
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY,
        });
    }

    function handleStart(clientX: number, clientY: number) {
        if (!svgRef.current || status === "done") return;
        const rect = svgRef.current.getBoundingClientRect();
        const hit = getPointFromPos(rect, clientX, clientY, SVG_SIZE);
        if (hit === null) return;

        setStatus("idle");
        setDragging(true);
        pathRef.current = [hit];
        setPath([hit]);
        updateCursor(clientX, clientY);
    }

    function handleMove(clientX: number, clientY: number) {
        if (!dragging || !svgRef.current) return;
        updateCursor(clientX, clientY);
        const rect = svgRef.current.getBoundingClientRect();
        const hit = getPointFromPos(rect, clientX, clientY, SVG_SIZE);
        if (hit !== null && !pathRef.current.includes(hit)) {
            pathRef.current = [...pathRef.current, hit];
            setPath([...pathRef.current]);
        }
    }

    function handleEnd() {
        if (!dragging) return;
        setDragging(false);
        setCursor(null);
        const finalPath = pathRef.current;

        if (finalPath.length < 3) {
            setStatus("wrong");
            setTimeout(() => {
                setStatus("idle");
                setPath([]);
                pathRef.current = [];
            }, 600);
            return;
        }

        setStatus("done");
        const code = finalPath
            .map((i) => {
                const col = String.fromCharCode(65 + (i % GRID));
                const row = Math.floor(i / GRID) + 1;
                return `${col}${row}`;
            })
            .join("-");

        setTimeout(() => submitCode(code), 300);
    }

    useEffect(() => {
        const onMouseMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY);
        const onMouseUp = () => handleEnd();
        const onTouchMove = (e: TouchEvent) => {
            e.preventDefault();
            handleMove(e.touches[0].clientX, e.touches[0].clientY);
        };
        const onTouchEnd = () => handleEnd();

        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mouseup", onMouseUp);
        window.addEventListener("touchmove", onTouchMove, { passive: false });
        window.addEventListener("touchend", onTouchEnd);

        return () => {
            window.removeEventListener("mousemove", onMouseMove);
            window.removeEventListener("mouseup", onMouseUp);
            window.removeEventListener("touchmove", onTouchMove);
            window.removeEventListener("touchend", onTouchEnd);
        };
    }, [dragging]);

    const lineColor =
        status === "wrong"
            ? "#e24b4a"
            : status === "done"
            ? "#1d9e75"
            : "#378add";

    const pathSegments: { x1: number; y1: number; x2: number; y2: number }[] =
        [];
    for (let i = 0; i < path.length - 1; i++) {
        const from = points[path[i]];
        const to = points[path[i + 1]];
        pathSegments.push({ x1: from.x, y1: from.y, x2: to.x, y2: to.y });
    }

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "1.5rem",
                paddingBottom: "0.5rem",
                userSelect: "none",
                WebkitUserSelect: "none",
            }}
        >
            <p
                style={{
                    margin: 0,
                    fontSize: 13,
                    color:
                        status === "wrong"
                            ? "var(--mantine-color-red-6)"
                            : status === "done"
                            ? "var(--mantine-color-teal-6)"
                            : "var(--mantine-color-dimmed)",
                    minHeight: 20,
                    transition: "color 0.2s",
                }}
            >
                {status === "wrong"
                    ? "Te kort — teken minstens 3 punten"
                    : status === "done"
                    ? "Versturen…"
                    : dragging
                    ? `${path.length} punt${path.length !== 1 ? "en" : ""} geselecteerd`
                    : "Swipe over de punten in volgorde"}
            </p>

            <svg
                ref={svgRef}
                width={SVG_SIZE}
                height={SVG_SIZE}
                viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
                style={{
                    maxWidth: "100%",
                    touchAction: "none",
                    cursor: dragging ? "none" : "default",
                    filter:
                        status === "wrong"
                            ? "drop-shadow(0 0 8px rgba(226,75,74,0.3))"
                            : status === "done"
                            ? "drop-shadow(0 0 8px rgba(29,158,117,0.3))"
                            : "none",
                    transition: "filter 0.3s",
                }}
                onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
                onTouchStart={(e) => {
                    e.preventDefault();
                    handleStart(e.touches[0].clientX, e.touches[0].clientY);
                }}
            >
                {/* Drawn path lines */}
                {pathSegments.map((seg, i) => (
                    <line
                        key={i}
                        x1={seg.x1}
                        y1={seg.y1}
                        x2={seg.x2}
                        y2={seg.y2}
                        stroke={lineColor}
                        strokeWidth={3}
                        strokeLinecap="round"
                        opacity={0.85}
                    />
                ))}

                {/* Live line to cursor */}
                {dragging && cursor && path.length > 0 && (
                    <line
                        x1={points[path[path.length - 1]].x}
                        y1={points[path[path.length - 1]].y}
                        x2={cursor.x}
                        y2={cursor.y}
                        stroke={lineColor}
                        strokeWidth={2}
                        strokeDasharray="5 4"
                        strokeLinecap="round"
                        opacity={0.5}
                    />
                )}

                {/* Dots */}
                {points.map((pt, i) => {
                    const isSelected = path.includes(i);
                    const orderIdx = path.indexOf(i);

                    return (
                        <g key={i}>
                            {/* Outer ring for selected */}
                            {isSelected && (
                                <circle
                                    cx={pt.x}
                                    cy={pt.y}
                                    r={DOT_RADIUS + 6}
                                    fill="none"
                                    stroke={lineColor}
                                    strokeWidth={1.5}
                                    opacity={0.3}
                                />
                            )}

                            {/* Main dot */}
                            <circle
                                cx={pt.x}
                                cy={pt.y}
                                r={DOT_RADIUS}
                                fill={
                                    isSelected
                                        ? lineColor
                                        : "var(--mantine-color-body)"
                                }
                                stroke={
                                    isSelected
                                        ? lineColor
                                        : "var(--mantine-color-default-border)"
                                }
                                strokeWidth={isSelected ? 0 : 1.5}
                                style={{ transition: "fill 0.15s, r 0.1s" }}
                            />

                            {/* Order number inside dot */}
                            {isSelected && (
                                <text
                                    x={pt.x}
                                    y={pt.y + 5}
                                    textAnchor="middle"
                                    fontSize={13}
                                    fontWeight={600}
                                    fill="white"
                                    style={{ pointerEvents: "none" }}
                                >
                                    {orderIdx + 1}
                                </text>
                            )}

                            {/* Small center dot for unselected */}
                            {!isSelected && (
                                <circle
                                    cx={pt.x}
                                    cy={pt.y}
                                    r={5}
                                    fill="var(--mantine-color-default-border)"
                                />
                            )}
                        </g>
                    );
                })}
            </svg>

            {/* Reset button — only shown after drawing */}
            {path.length > 0 && status !== "done" && !dragging && (
                <button
                    onClick={() => {
                        setPath([]);
                        pathRef.current = [];
                        setStatus("idle");
                    }}
                    style={{
                        background: "transparent",
                        border: "0.5px solid var(--mantine-color-default-border)",
                        borderRadius: 8,
                        padding: "6px 20px",
                        fontSize: 13,
                        color: "var(--mantine-color-dimmed)",
                        cursor: "pointer",
                    }}
                >
                    Opnieuw
                </button>
            )}
        </div>
    );
}