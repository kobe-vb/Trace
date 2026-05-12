import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button, Stack, Text } from "@mantine/core";
import { api } from "../api/api";

export default function ResetTipsButton() {
    const [searchParams] = useSearchParams();

    const station = searchParams.get("station");
    const player = searchParams.get("player");
    const navigate = useNavigate();

    const [confirm, setConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);

    async function handleReset() {
        if (!player || !station) return;

        setLoading(true);
        try {
            await api.post(`/game/reset/tips/${encodeURIComponent(player)}`, null);
            setDone(true);
            setTimeout(() => navigate("/scan?station=" + encodeURIComponent(station)), 3000);
        } catch (err) {
            console.error("Reset tips mislukt:", err);
        } finally {
            setLoading(false);
            setConfirm(false);
        }
    }

    if (done) {
        return (
            <Button variant="subtle" color="red" size="l" disabled>
                ✓ Tips gereset, je word doorgestuurd ...
            </Button>
        );
    }

    if (!confirm) {
        return (
            <Button variant="subtle" color="red" size="l" onClick={() => setConfirm(true)}>
                ↺ Reset tips
            </Button>
        );
    }

    return (
        <Stack gap="xs">
            <Text size="xs" c="dimmed" ta="center">
                Zeker? Alle tips voor deze ronde worden gewist, voor u en uw partner.
            </Text>
            <Button.Group>
                <Button flex={1} variant="default" size="xs" disabled={loading} onClick={() => setConfirm(false)}>
                    Annuleer
                </Button>
                <Button flex={1} color="red" size="xs" loading={loading} onClick={handleReset}>
                    Ja, reset
                </Button>
            </Button.Group>
        </Stack>
    );
}