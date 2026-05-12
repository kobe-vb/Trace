import {
    Container,
    Stack,
    Title,
    Text,
    Button,
    Paper,
    Progress,
} from "@mantine/core";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const TOTAL_SECONDS = 12;

function ConfettiCanvas() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const colors = ["#f59e0b", "#10b981", "#3b82f6", "#f43f5e", "#a855f7", "#ec4899"];

        const pieces = Array.from({ length: 120 }, () => ({
            x: Math.random() * canvas.width,
            y: Math.random() * -canvas.height,
            w: Math.random() * 12 + 6,
            h: Math.random() * 6 + 4,
            color: colors[Math.floor(Math.random() * colors.length)],
            rotation: Math.random() * 360,
            rotSpeed: (Math.random() - 0.5) * 6,
            speedX: (Math.random() - 0.5) * 3,
            speedY: Math.random() * 3 + 2,
        }));

        let animId: number;

        function draw() {
            if (!ctx || !canvas) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            for (const p of pieces) {
                ctx.save();
                ctx.translate(p.x + p.w / 2, p.y + p.h / 2);
                ctx.rotate((p.rotation * Math.PI) / 180);
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
                ctx.restore();

                p.x += p.speedX;
                p.y += p.speedY;
                p.rotation += p.rotSpeed;

                if (p.y > canvas.height) {
                    p.y = -20;
                    p.x = Math.random() * canvas.width;
                }
            }

            animId = requestAnimationFrame(draw);
        }

        draw();

        return () => cancelAnimationFrame(animId);
    }, []);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100vw",
                height: "100vh",
                pointerEvents: "none",
                zIndex: 0,
            }}
        />
    );
}

export default function NextRoundPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const station = searchParams.get("station");

    const [seconds, setSeconds] = useState(TOTAL_SECONDS);

    useEffect(() => {
        if (!station) {
            navigate("/");
            return;
        }

        const interval = setInterval(() => {
            setSeconds((s) => Math.max(s - 1, 0));
        }, 1000);

        const timeout = setTimeout(() => {
            navigate(
                `/scan?station=${encodeURIComponent(station)}`
            );
        }, TOTAL_SECONDS * 1000);

        return () => {
            clearInterval(interval);
            clearTimeout(timeout);
        };
    }, [station, navigate]);

    if (!station) return null;

    const progress = (seconds / TOTAL_SECONDS) * 100;

    return (
        <>
            <ConfettiCanvas />

            <Container size="xs" py="xl" style={{ position: "relative", zIndex: 1 }}>
                <Paper withBorder shadow="xl" radius="lg" p="xl">
                    <Stack align="center" gap="lg">

                        <Stack gap="xs" align="center">
                            <Title order={1} ta="center" c="green">
                                Woep woep! 🎉
                            </Title>
                            <Title order={3} ta="center">
                                Dat is juist!
                            </Title>
                        </Stack>

                        <Text ta="center" c="dimmed" size="md">
                            Ge hebt de code gekraakt. Bereid u voor op de volgende ronde!
                        </Text>

                        <Stack w="100%" gap="xs">
                            <Progress value={progress} color="green" animated />
                            <Text size="sm" ta="center" c="dimmed">
                                Terug naar scan over {seconds}s...
                            </Text>
                        </Stack>

                        <Button
                            fullWidth
                            size="md"
                            color="green"
                            onClick={() =>
                                navigate(`/scan?station=${encodeURIComponent(station)}`)
                            }
                        >
                            Ga nu verder
                        </Button>
                    </Stack>
                </Paper>
            </Container>
        </>
    );
}