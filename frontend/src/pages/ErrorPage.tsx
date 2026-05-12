import {
    Container,
    Stack,
    Text,
    Button,
    Paper,
    Title,
    Progress
} from "@mantine/core";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

const TOTAL_SECONDS = 10;

export default function ErrorPage() {
    const navigate = useNavigate();
    const [seconds, setSeconds] = useState(TOTAL_SECONDS);

    const params = new URLSearchParams(window.location.search);
    const station = params.get("station");

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
                <Stack align="center" gap="lg">

                    <Title order={2} c="red">
                        Verkeerde station
                    </Title>

                    <Text ta="center" c="dimmed">
                        Ge staat op de verkeerde plek. Zoek verder en scan het juiste punt.
                    </Text>

                    <Stack w="100%" gap="xs">
                        <Progress value={progress} animated />
                        <Text size="sm" ta="center" c="dimmed">
                            Terug over {seconds}s...
                        </Text>
                    </Stack>

                    <Button
                        fullWidth
                        size="md"
                        onClick={() =>
                            navigate("/scan?station=" + encodeURIComponent(station))
                        }
                    >
                        Ga terug naar scan
                    </Button>

                </Stack>
            </Paper>
        </Container>
    );
}