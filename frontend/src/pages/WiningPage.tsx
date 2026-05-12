import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";

export default function WinPage() {
    const [searchParams] = useSearchParams();
    const name = searchParams.get("player_name") ?? "speler";
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // ── Confetti ──────────────────────────────────────────────────
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d")!;

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resize();
        window.addEventListener("resize", resize);

        const COLORS = ["#f7c948", "#e8534a", "#4ab8e8", "#6dd67a", "#c77dff", "#ff9f43"];
        const pieces = Array.from({ length: 110 }, () => ({
            x: Math.random() * window.innerWidth,
            y: Math.random() * -window.innerHeight,
            r: 4 + Math.random() * 6,
            color: COLORS[Math.floor(Math.random() * COLORS.length)],
            speed: 2 + Math.random() * 3.5,
            wobble: Math.random() * Math.PI * 2,
            wobbleSpeed: 0.04 + Math.random() * 0.04,
            angle: Math.random() * Math.PI * 2,
            spin: (Math.random() - 0.5) * 0.15,
        }));

        let raf: number;
        function draw() {
            ctx.clearRect(0, 0, canvas!.width, canvas!.height);
            for (const p of pieces) {
                p.y += p.speed;
                p.wobble += p.wobbleSpeed;
                p.angle += p.spin;
                const x = p.x + Math.sin(p.wobble) * 18;
                ctx.save();
                ctx.translate(x, p.y);
                ctx.rotate(p.angle);
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r * 1.6);
                ctx.restore();
                if (p.y > canvas!.height + 20) {
                    p.y = -20;
                    p.x = Math.random() * canvas!.width;
                }
            }
            raf = requestAnimationFrame(draw);
        }
        draw();

        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener("resize", resize);
        };
    }, []);

    return (
        <div style={S.root}>
            <style>{css}</style>
            <canvas ref={canvasRef} style={S.canvas} />

            <div style={S.card}>
                <div style={S.emoji}>🏆</div>
                <h1 style={S.title}>
                    Proficiat <span style={S.name}>{name}</span>!
                </h1>
                <p style={S.sub}>ge zijt gewonnen</p>
                <div style={S.divider} />
                <p style={S.instruction}>
                    Ga iets zeggen tegen de leiding
                </p>
            </div>
        </div>
    );
}

const S: Record<string, React.CSSProperties> = {
    root: {
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(160deg, #0f1b2d 0%, #1a2e1a 100%)",
        overflow: "hidden",
        position: "relative",
    },
    canvas: {
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 0,
    },
    card: {
        position: "relative",
        zIndex: 1,
        textAlign: "center",
        padding: "2.5rem 2rem",
        borderRadius: 20,
        background: "rgba(255,255,255,0.06)",
        border: "1.5px solid rgba(255,255,255,0.12)",
        backdropFilter: "blur(12px)",
        maxWidth: 360,
        width: "90vw",
        animation: "popIn 0.6s cubic-bezier(0.34,1.56,0.64,1) both",
    },
    emoji: {
        fontSize: 56,
        lineHeight: 1,
        marginBottom: "0.5rem",
        animation: "bounce 1.4s ease-in-out infinite",
    },
    title: {
        margin: "0.4rem 0 0.2rem",
        fontSize: "clamp(1.6rem, 7vw, 2.2rem)",
        fontWeight: 800,
        color: "#fff",
        letterSpacing: -0.5,
        lineHeight: 1.2,
    },
    name: {
        color: "#f7c948",
        display: "inline-block",
        animation: "shimmer 2s ease-in-out infinite alternate",
    },
    sub: {
        margin: "0.2rem 0 0",
        fontSize: 15,
        color: "rgba(255,255,255,0.55)",
        letterSpacing: 1,
    },
    divider: {
        margin: "1.4rem auto",
        width: 48,
        height: 2,
        borderRadius: 2,
        background: "linear-gradient(90deg, #f7c948, #e8534a)",
        opacity: 0.7,
    },
    instruction: {
        margin: 0,
        fontSize: 16,
        color: "rgba(255,255,255,0.85)",
        lineHeight: 1.5,
    },
};

const css = `
@keyframes popIn {
    from { opacity: 0; transform: scale(0.7); }
    to   { opacity: 1; transform: scale(1); }
}
@keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50%       { transform: translateY(-10px); }
}
@keyframes shimmer {
    from { text-shadow: 0 0 8px rgba(247,201,72,0.4); }
    to   { text-shadow: 0 0 22px rgba(247,201,72,0.9), 0 0 40px rgba(247,201,72,0.4); }
}
`;