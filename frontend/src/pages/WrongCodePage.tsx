import {
    Container,
    Stack,
    Title,
    Text,
    Button,
    Paper,
    Progress,
} from "@mantine/core";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const TOTAL_SECONDS = 8;

export default function WrongCodePage() {
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
        <Container size="xs" py="xl">
            <Paper withBorder shadow="md" radius="lg" p="xl">
                <Stack align="center" gap="lg">

                    <Title order={2} c="red">
                        Jammer, dat is fout!
                    </Title>

                    <Text ta="center" c="dimmed">
                        De code klopt niet. Probeer het opnieuw!
                    </Text>

                    <Stack w="100%" gap="xs">
                        <Progress value={progress} color="red" animated />
                        <Text size="sm" ta="center" c="dimmed">
                            Terug over {seconds}s...
                        </Text>
                    </Stack>

                    <Button
                        fullWidth
                        size="md"
                        color="red"
                        variant="light"
                        onClick={() =>
                            navigate(
                                `/scan?station=${encodeURIComponent(station)}`
                            )
                        }
                    >
                        Terug naar scanner
                    </Button>
                </Stack>
            </Paper>
        </Container>
    );
}