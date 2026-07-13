import { Container, Stack, Title, Text, Paper, Progress } from "@mantine/core";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

const TOTAL_SECONDS = 10;

export default function LeftGamePage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const name = searchParams.get("player_name") ?? "speler";
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
            navigate("/scan?station=" + encodeURIComponent(station));
        }, TOTAL_SECONDS * 1000);

        return () => {
            clearInterval(interval);
            clearTimeout(timeout);
        };
    }, [station, navigate]);

    if (!station) return null;

    const progress = (seconds / TOTAL_SECONDS) * 100;

    return (
        <Container size="xs" py="xl">
            <Paper withBorder shadow="md" radius="lg" p="xl">
                <Stack gap="lg" align="center">
                    <Title order={2} ta="center">
                        Tot ziens, {name}!
                    </Title>

                    <Text ta="center" c="dimmed">
                        Ge hebt aangegeven te stoppen met het spel. Ge doet niet
                        meer mee, maar bedankt om mee te spelen!
                    </Text>

                    <Stack w="100%" gap="xs">
                        <Progress value={progress} animated />
                        <Text size="sm" ta="center" c="dimmed">
                            Terug naar scan over {seconds}s...
                        </Text>
                    </Stack>
                </Stack>
            </Paper>
        </Container>
    );
}