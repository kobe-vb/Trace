import {
    Container,
    Stack,
    Title,
    Button,
    Card,
    Text,
    FileButton,
    Badge,
    Alert,
    Divider,
    Group,
} from "@mantine/core";
import { IconUpload, IconCheck, IconAlertCircle } from "@tabler/icons-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

type Mode = "classic" | "groupQuiz";

interface UploadResult {
    count: number;
    names: string[];
}

export default function SetupPage() {
    const navigate = useNavigate();
    const [mode, setMode] = useState<Mode | null>(null);
    const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);

    async function handleFileUpload(file: File | null) {
        if (!file) return;
        setUploadError(null);
        setUploadResult(null);
        setUploading(true);

        console.log("Uploading file:", file);

        try {
            const formData = new FormData();
            formData.append("file", file);

            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/game/upload_participants`,
                {
                    method: "POST",
                    body: formData,
                    credentials: "include",
                }
            );

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail ?? "Upload mislukt");
            }

            const data: UploadResult = await res.json();
            setUploadResult(data);
        } catch (err: any) {
            setUploadError(err.message ?? "Onbekende fout");
        } finally {
            setUploading(false);
        }
    }

    function canContinue() {
        if (!mode) return false;
        if (mode === "groupQuiz" && !uploadResult) return false;
        return true;
    }

    function handleContinue() {
        // Mode opslaan in sessionStorage zodat LoadPage het kan meegeven
        sessionStorage.setItem("game_mode", mode!);
        navigate("/load");
    }

    return (
        <Container size="xs" p="md">
            <Stack gap="lg" pt="md">
                <Title order={2} ta="center">
                    Spel instellen
                </Title>

                {/* Modus keuze */}
                <Card withBorder radius="xl" p="lg">
                    <Stack gap="md">
                        <Text fw={600}>Kies een speelmodus</Text>

                        <Stack gap="sm">
                            <ModeCard
                                active={mode === "classic"}
                                onClick={() => setMode("classic")}
                                title="Classic"
                                description="Mastermind, Morse, Glazen Brug, Weegschaal, ..."
                            />
                            <ModeCard
                                active={mode === "groupQuiz"}
                                onClick={() => setMode("groupQuiz")}
                                title="Group Quiz"
                                description="Raad wie het antwoord gaf — kortere rondes, leer je medespelers kennen"
                            />
                        </Stack>
                    </Stack>
                </Card>

                {/* Excel upload — alleen tonen bij groupQuiz */}
                {mode === "groupQuiz" && (
                    <Card withBorder radius="xl" p="lg">
                        <Stack gap="md">
                            <Text fw={600}>Laad deelnemersbestand</Text>
                            <Text size="sm" c="dimmed">
                                .csv bestand met kolommen:{" "}
                                <b>Naam | Geslacht | Vraag1 | Vraag2 | ...</b>
                            </Text>

                            <FileButton
                                onChange={handleFileUpload}
                            >
                                {(props) => (
                                    <Button
                                        {...props}
                                        leftSection={<IconUpload size={16} />}
                                        loading={uploading}
                                        variant={uploadResult ? "light" : "filled"}
                                        color={uploadResult ? "green" : "blue"}
                                    >
                                        {uploadResult
                                            ? `${uploadResult.count} deelnemers geladen`
                                            : "Kies Excel bestand"}
                                    </Button>
                                )}
                            </FileButton>

                            {uploadResult && (
                                <Alert
                                    color="green"
                                    icon={<IconCheck size={16} />}
                                    radius="md"
                                >
                                    <Stack gap={4}>
                                        <Text size="sm" fw={600}>
                                            {uploadResult.count} deelnemers geladen
                                        </Text>
                                        <Group gap={4} wrap="wrap">
                                            {uploadResult.names.map((n) => (
                                                <Badge key={n} size="sm" variant="light" color="green">
                                                    {n}
                                                </Badge>
                                            ))}
                                        </Group>
                                    </Stack>
                                </Alert>
                            )}

                            {uploadError && (
                                <Alert
                                    color="red"
                                    icon={<IconAlertCircle size={16} />}
                                    radius="md"
                                >
                                    {uploadError}
                                </Alert>
                            )}
                        </Stack>
                    </Card>
                )}

                <Divider />

                <Button
                    fullWidth
                    size="lg"
                    disabled={!canContinue()}
                    onClick={handleContinue}
                >
                    Verder → spelers scannen
                </Button>
            </Stack>
        </Container>
    );
}

function ModeCard({
    active,
    onClick,
    title,
    description,
}: {
    active: boolean;
    onClick: () => void;
    title: string;
    description: string;
}) {
    return (
        <Card
            withBorder
            radius="md"
            p="md"
            style={{
                cursor: "pointer",
                borderColor: active ? "var(--mantine-color-blue-5)" : undefined,
                borderWidth: active ? 2 : 1,
                background: active ? "var(--mantine-color-blue-0)" : undefined,
            }}
            onClick={onClick}
        >
            <Group justify="space-between" align="flex-start">
                <Stack gap={2}>
                    <Text fw={600}>{title}</Text>
                    <Text size="sm" c="dimmed">
                        {description}
                    </Text>
                </Stack>
                {active && (
                    <IconCheck
                        size={18}
                        color="var(--mantine-color-blue-5)"
                    />
                )}
            </Group>
        </Card>
    );
}