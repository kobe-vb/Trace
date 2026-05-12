import { useState, useCallback } from "react";
import {
    Container,
    Stack,
    Group,
    Text,
    Card,
    Badge,
    ActionIcon,
    Tooltip,
    Skeleton,
    Alert,
    Title,
} from "@mantine/core";
import { IconRefresh, IconAlertCircle, IconTrophy, IconClock, IconUser, IconSword } from "@tabler/icons-react";
import { api } from "../api/api";

interface Ranking {
    player_name: string;
    partner_name: string | null;
    player_character: string;
    rounds_completed: number;
    round_started_at: string;
}

const MEDAL: Record<number, string> = { 0: "🥇", 1: "🥈", 2: "🥉" };

function formatElapsedTime(startedAt: string): string {
    const started = new Date(startedAt);
    const seconds = (Date.now() - started.getTime()) / 1000;

    if (seconds < 60) return `${seconds.toFixed(0)}s`;

    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);

    return `${m}m ${s}s`;
}

export default function RankingPage() {
    const [ranking, setRanking] = useState<Ranking[] | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    const fetchRanking = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await api.get<Ranking[]>("/game/ranking");
            setRanking(res);
            setLastUpdated(new Date());
        } catch (err) {
            setError("Kon ranking niet ophalen. Probeer opnieuw.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    return (
        <Container size="md" p="xl">
            <Stack gap="xl">
                {/* Header */}
                <Group justify="space-between" align="center">
                    <Group gap="sm" align="center">
                        <IconTrophy size={28} color="var(--mantine-color-yellow-5)" />
                        <Title order={2} fw={700}>
                            Ranking
                        </Title>
                    </Group>

                    <Group gap="sm" align="center">
                        {lastUpdated && (
                            <Text size="xs" c="dimmed">
                                Bijgewerkt om {lastUpdated.toLocaleTimeString("nl-BE")}
                            </Text>
                        )}
                        <Tooltip label="Vernieuwen" withArrow>
                            <ActionIcon
                                variant="light"
                                size="lg"
                                loading={loading}
                                onClick={fetchRanking}
                            >
                                <IconRefresh size={18} />
                            </ActionIcon>
                        </Tooltip>
                    </Group>
                </Group>

                {/* Error */}
                {error && (
                    <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light">
                        {error}
                    </Alert>
                )}

                {/* Empty state */}
                {!ranking && !loading && !error && (
                    <Card withBorder radius="md" p="xl">
                        <Stack align="center" gap="sm">
                            <IconTrophy size={40} opacity={0.3} />
                            <Text c="dimmed" ta="center">
                                Druk op vernieuwen om de ranking te laden.
                            </Text>
                        </Stack>
                    </Card>
                )}

                {/* Skeleton while loading */}
                {loading && !ranking &&
                    Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} height={88} radius="md" />
                    ))
                }

                {/* Ranking cards */}
                {ranking && (
                    <Stack gap="sm">
                        {ranking.length === 0 && (
                            <Card withBorder radius="md" p="xl">
                                <Text c="dimmed" ta="center">
                                    Geen deelnemers gevonden.
                                </Text>
                            </Card>
                        )}

                        {ranking.map((entry, index) => (
                            <Card
                                key={entry.player_name}
                                withBorder
                                radius="md"
                                p="md"
                                style={{
                                    opacity: loading ? 0.6 : 1,
                                    transition: "opacity 0.2s",
                                    borderLeft: index < 3
                                        ? `4px solid var(--mantine-color-yellow-${5 - index})`
                                        : undefined,
                                }}
                            >
                                <Group justify="space-between" align="center">
                                    {/* Positie + naam */}
                                    <Group gap="md" align="center">
                                        <Text fz="xl" w={36} ta="center">
                                            {MEDAL[index] ?? (
                                                <Text fw={600} c="dimmed" size="sm">
                                                    #{index + 1}
                                                </Text>
                                            )}
                                        </Text>

                                        <Stack gap={4}>
                                            <Text fw={600} size="md" lh={1.2}>
                                                {entry.player_name}
                                            </Text>
                                            <Group gap="xs">
                                                <Badge
                                                    variant="light"
                                                    color="blue"
                                                    size="sm"
                                                >
                                                    Ronde {entry.rounds_completed}
                                                </Badge>
                                                <Badge
                                                    variant="light"
                                                    color="grape"
                                                    size="sm"
                                                    leftSection={<IconSword size={10} />}
                                                >
                                                    {entry.player_character}
                                                </Badge>
                                                {entry.partner_name && (
                                                    <Badge
                                                        variant="light"
                                                        color="teal"
                                                        size="sm"
                                                        leftSection={<IconUser size={10} />}
                                                    >
                                                        {entry.partner_name}
                                                    </Badge>
                                                )}
                                            </Group>
                                        </Stack>
                                    </Group>

                                    {/* Tijd */}
                                    <Group gap="xs" align="center">
                                        <IconClock size={14} opacity={0.5} />
                                        <Text size="sm" c="dimmed" ff="monospace">
                                            {formatElapsedTime(entry.round_started_at)}
                                        </Text>
                                    </Group>
                                </Group>
                            </Card>
                        ))}
                    </Stack>
                )}
            </Stack>
        </Container>
    );
}