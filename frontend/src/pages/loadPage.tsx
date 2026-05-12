import { useState, useCallback } from "react";
import {
    Container,
    Stack,
    Button,
    Card,
    Text,
    Group,
    TextInput,
    ActionIcon,
    Tooltip,
} from "@mantine/core";
import { IconX } from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import { QrScanner } from "../components/QrScanner/QrScanner";
import { api } from "../api/api";

interface Participant {
    id: string;
    name: string;
}

export default function LoadPage() {
    const navigate = useNavigate();

    const [participants, setParticipants] = useState<Participant[]>([]);
    const [loading, setLoading] = useState(false);

    const handleScan = useCallback((qr: string) => {
        if (!qr) return;

        setParticipants((prev) => {
            if (prev.some((p) => p.id === qr)) return prev;
            return [{ id: qr, name: "" }, ...prev];
        });
    }, []);

    const handleNameChange = useCallback((id: string, name: string) => {
        setParticipants((prev) =>
            prev.map((p) => (p.id === id ? { ...p, name } : p))
        );
    }, []);

    const handleRemove = useCallback((id: string) => {
        setParticipants((prev) => prev.filter((p) => p.id !== id));
    }, []);

    async function handleStartGame() {
        if (participants.length === 0) return;

        try {
            setLoading(true);

            await api.post("/game/set_players", participants);

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
                            <Group key={p.id} align="center" gap="xs">
                                {/* Volgnummer */}
                                <Text size="xs" c="dimmed" w={24} ta="right">
                                    #{index + 1}
                                </Text>

                                {/* Naam input */}
                                <TextInput
                                    flex={1}
                                    size="xs"
                                    placeholder={p.id}
                                    value={p.name}
                                    onChange={(e) =>
                                        handleNameChange(p.id, e.currentTarget.value)
                                    }
                                />

                                {/* Verwijder knop */}
                                <Tooltip label="Verwijder" withArrow>
                                    <ActionIcon
                                        variant="subtle"
                                        color="red"
                                        size="sm"
                                        onClick={() => handleRemove(p.id)}
                                    >
                                        <IconX size={14} />
                                    </ActionIcon>
                                </Tooltip>
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