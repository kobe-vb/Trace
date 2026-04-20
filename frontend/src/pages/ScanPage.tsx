import {
    Container,
    Stack,
    Title,
    Text,
    Card,
    Overlay,
    Loader,
    Box,
    TextInput,
} from "@mantine/core";
import { useQrScanner } from "../hooks/useQrScanner";
import { api } from "../api/api";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

export default function ScanPage() {
    const scanner = useQrScanner(handleScan);
    const [code, setCode] = useState("");

    const navigate = useNavigate();

    async function handleScan(qr: string) {
        try {
            console.log("Scanned QR code:", qr);
            const response: any = await api.post("/scan", { qr_code: qr });

            navigate(response.redirect);

        } catch (error) {
            console.error(error);
        }

    }

    return (
        <Container size="xs" p="md">
            <Stack gap="md">
                {/* TITLE */}
                <Title order={2} ta="center">
                    Station X
                </Title>

                <Text c="dimmed" size="sm" ta="center">
                    Scan de QR code om verder te gaan
                </Text>

                {/* CARD */}
                <Card radius="xl" shadow="md" p="xs">
                    <Box style={{ position: "relative" }}>

                        {/* VIDEO */}
                        <video
                            ref={scanner.videoRef}
                            style={{
                                width: "100%",
                                height: "320px",
                                objectFit: "cover",
                                borderRadius: "12px",
                            }}
                            playsInline
                            muted
                        />

                        {/* CANVAS */}
                        <canvas
                            ref={scanner.canvasRef}
                            style={{ display: "none" }}
                        />

                        {/* DARK OVERLAY */}
                        <Box
                            style={{
                                position: "absolute",
                                inset: 0,
                                background: "rgba(0,0,0,0.4)",
                            }}
                        />

                        {/* SCAN FRAME */}
                        <Box
                            style={{
                                position: "absolute",
                                top: "50%",
                                left: "50%",
                                width: "65%",
                                height: "65%",
                                transform: "translate(-50%, -50%)",
                                border: "2px solid white",
                                borderRadius: "16px",
                            }}
                        />

                        {/* SCAN LINE */}
                        {scanner.state === "scanning" && (
                            <div className="scan-line" />
                        )}

                        {/* LOADING */}
                        {scanner.state === "loading" && (
                            <Overlay>
                                <Loader />
                            </Overlay>
                        )}

                        {/* SUCCESS */}
                        {scanner.state === "success" && (
                            <Overlay color="green" opacity={0.6}>
                                <Text c="white">Succes</Text>
                            </Overlay>
                        )}

                        {/* ERROR */}
                        {scanner.state === "error" && (
                            <Overlay color="red" opacity={0.6}>
                                <Text c="white">{scanner.error}</Text>
                            </Overlay>
                        )}

                    </Box>
                </Card>
            </Stack>
            <TextInput
                label="code"
                placeholder="code"
                value={code}
                onChange={(e) => setCode(e.currentTarget.value)}
                onKeyDown={(e) => {
                    if (e.key === "Enter") {
                        handleScan(code);
                    }
                }}
            />
        </Container>
    );
}