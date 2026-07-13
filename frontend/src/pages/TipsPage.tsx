import {
    Container,
    Stack,
    Text,
    Button,
    Paper,
    Title,
    Loader,
    Progress
} from "@mantine/core";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { api } from "../api/api";
import LeaveGameButton from "../components/LeaveGameButton";

const TOTAL_SECONDS = 45;

export default function TipsPage() {
    const navigate = useNavigate();

    const [searchParams] = useSearchParams();
    const player = searchParams.get("player");
    const station = searchParams.get("station");

    const [tip, setTip] = useState("");
    const [nextStation, setNextStation] = useState("");
    const [round, setRound] = useState(0);
    const [loading, setLoading] = useState(true);

    const [seconds, setSeconds] = useState(TOTAL_SECONDS);

    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const interval = setInterval(() => {
            setNow(new Date());
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    function formatTime(date: Date) {
        return date.toLocaleTimeString("nl-BE", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        });
    }

    useEffect(() => {
        if (!player || !station) {
            navigate("/");
            return;
        }

        async function fetchData() {
            try {
                setLoading(true);

                const tipRes: string = await api.get("/game/tip/" + player);
                const nextRes: string = await api.get("/game/next_station/" + player);
                const roundRes: number = await api.get("/game/round/" + player);

                setRound(roundRes);
                setTip(tipRes);
                setNextStation(nextRes);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [player, station, navigate]);

    useEffect(() => {
        if (loading) return;
        if (!player || !station) return;

        const interval = setInterval(() => {
            setSeconds((s) => Math.max(s - 1, 0));
        }, 1000);

        const timeout = setTimeout(() => {
            console.log("/scan?station=" + encodeURIComponent(station));
            navigate("/scan?station=" + encodeURIComponent(station));
        }, TOTAL_SECONDS * 1000);

        return () => {
            clearInterval(interval);
            clearTimeout(timeout);
        };
    }, [loading, navigate, station]);

    if (!player || !station) return null;

    const progress = (seconds / TOTAL_SECONDS) * 100;

    return (
        <Container size="xs" py="xl">
            <Paper withBorder shadow="md" radius="lg" p="xl">
                <Stack gap="lg" align="center">

                    <Title order={1}>Ronde {round}</Title>

                    {loading ? (
                        <Stack align="center">
                            <Loader />
                            <Text c="dimmed">Gegevens laden...</Text>
                        </Stack>
                    ) : (
                        <>
                            <Text ta="center">
                                Volgende station: <b>{nextStation}</b>
                            </Text>

                            <Text fw={600} size="lg">
                                {formatTime(now)}
                            </Text>

                            <Paper withBorder radius="md" p="md" w="100%">
                                <Text fw={600} mb="xs">
                                    Tip
                                </Text>
                                <Text>
                                    {tip}
                                </Text>
                            </Paper>

                            <Stack w="100%" gap="xs">
                                <Progress value={progress} animated />
                                <Text size="sm" ta="center" c="dimmed">
                                    Terug naar scan over {seconds}s
                                </Text>
                            </Stack>

                            <Button
                                fullWidth
                                onClick={() =>
                                    navigate(
                                        "/scan?station=" +
                                        encodeURIComponent(station)
                                    )
                                }
                            >
                                Ga nu terug
                            </Button>

                            <LeaveGameButton />
                        </>
                    )}
                </Stack>
            </Paper>
        </Container>
    );
}