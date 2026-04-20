import { useState, useCallback } from "react";
import {
    Container,
    Stack,
    Button,
    Card,
    Text,
    Group,
} from "@mantine/core";
import { useNavigate } from "react-router-dom";
import { QrScanner } from "../components/QrScanner/QrScanner";
import { api } from "../api/api";

export default function LoadPage() {
    const navigate = useNavigate();

    const [participants, setParticipants] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    const handleScan = useCallback((qr: string) => {
        if (!qr) return;

        setParticipants((prev) => {
            if (prev.includes(qr)) return prev;
            return [qr, ...prev];
        });
    }, []);

    async function handleStartGame() {
        if (participants.length === 0) return;

        try {
            setLoading(true);

            await api.post("/game/set_players", 
                participants,
            );

            navigate("/init");
        } catch (err) {
            console.error("Failed to start game", err);
        } finally {
            setLoading(false);
        }
    }

    return (
        <Container size="xs" p="md">
            <Stack gap="lg" pt="md">
                {/* Scanner */}
                <QrScanner
                    onScan={handleScan}
                    title="Scan deelnemers"
                    subtitle="Scan meerdere QR codes"
                    showManualInput
                />

                {/* List */}
                <Card withBorder radius="md" p="md">
                    <Stack gap="xs">
                        <Text fw={600}>
                            Deelnemers ({participants.length})
                        </Text>

                        {participants.length === 0 && (
                            <Text c="dimmed" size="sm">
                                Nog niets gescand
                            </Text>
                        )}

                        {participants.map((p, index) => (
                            <Group key={p} justify="space-between">
                                <Text size="sm">{p}</Text>
                                <Text size="xs" c="dimmed">
                                    #{index + 1}
                                </Text>
                            </Group>
                        ))}
                    </Stack>
                </Card>

                {/* Start button */}
                <Button
                    fullWidth
                    disabled={participants.length === 0}
                    loading={loading}
                    onClick={handleStartGame}
                >
                    Start spel
                </Button>
            </Stack>
        </Container>
    );
}