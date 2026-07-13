import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button, Stack, Text } from "@mantine/core";
import { api } from "../api/api";

export default function LeaveGameButton() {
    const [searchParams] = useSearchParams();
    const player = searchParams.get("player");

    const [confirm, setConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);

    async function handleLeave() {
        if (!player) return;

        setLoading(true);
        try {
            await api.post(`/game/leave/${encodeURIComponent(player)}`, null);
            setDone(true);
        } catch (err) {
            console.error("Verlaten mislukt:", err);
        } finally {
            setLoading(false);
            setConfirm(false);
        }
    }

    if (done) {
        return (
            <Button variant="subtle" color="gray" size="l" disabled>
                ✓ Je stopt na deze ronde
            </Button>
        );
    }

    if (!confirm) {
        return (
            <Button variant="subtle" color="gray" size="l" onClick={() => setConfirm(true)}>
                Spel verlaten
            </Button>
        );
    }

    return (
        <Stack gap="xs">
            <Text size="xs" c="dimmed" ta="center">
                Zeker dat ge wilt stoppen? Na deze ronde wordt ge niet meer gepaird
                en kunt ge niet meer verder spelen.
            </Text>
            <Button.Group>
                <Button flex={1} variant="default" size="xs" disabled={loading} onClick={() => setConfirm(false)}>
                    Annuleer
                </Button>
                <Button flex={1} color="red" size="xs" loading={loading} onClick={handleLeave}>
                    Ja, stop ermee
                </Button>
            </Button.Group>
        </Stack>
    );
}