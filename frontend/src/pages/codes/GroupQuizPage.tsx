import { Stack, Text, Paper, Loader, Alert, Button } from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useCodeSubmit } from "../../layouts/CodeLayout";
import { api } from "../../api/api";
import { QrScanner } from "../../components/QrScanner/QrScanner";

type Step = "scan_partner" | "kies_naam";

export default function GroupQuizPage() {
    const { submitCode, loading } = useCodeSubmit();
    const [searchParams] = useSearchParams();
    const player = searchParams.get("player");

    const [step, setStep] = useState<Step>("scan_partner");
    const [namen, setNamen] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [selected, setSelected] = useState<string | null>(null);

    // Haal de namen op zodra we naar step kies_naam gaan
    useEffect(() => {
        if (step !== "kies_naam" || !player) return;

        async function fetchNamen() {
            const code: string = await api.get(`/game/code/${player}`);
            setNamen(code.split("|"));
        }

        fetchNamen();
    }, [step, player]);

    async function handlePartnerScan(scannedId: string) {
        if (!player) return;
        setError(null);

        const isPartner: boolean = await api.get(
            `/game/verify_partner/${player}/${scannedId}`
        );

        if (isPartner) {
            setStep("kies_naam");
        } else {
            setError("Dit is niet jouw partner. Scan de QR code van jouw partner. redirecting to scan page...");
            setTimeout(() => {
                goBackToScan();
            }, 3000);
        }
    }

    function goBackToScan() {
        window.location.href = "/scan?station=" + encodeURIComponent(searchParams.get("station") ?? "");
    }

    async function handleKiesNaam(naam: string) {
        setSelected(naam);
        await submitCode(naam);
    }

    if (step === "scan_partner") {
        return (
            <Stack gap="lg">

                <QrScanner
                    onScan={handlePartnerScan}
                    title="Scan partner"
                    subtitle="Scan de QR code van jouw partner om verder te gaan"
                    showManualInput
                />

                {error && (
                    <Alert color="red" icon={<IconAlertCircle size={16} />} radius="md">
                        {error}
                    </Alert>
                )}

                <Button
                    fullWidth
                    size="lg"
                    variant="light"
                    onClick={goBackToScan}
                >
                    terug naar scan pagina
                </Button>
            </Stack>
        );
    }

    // step === "kies_naam"
    if (namen.length === 0) {
        return (
            <Stack align="center" gap="md">
                <Loader />
                <Text c="dimmed">Namen laden...</Text>
            </Stack>
        );
    }

    return (
        <Stack gap="lg">
            <Text size="sm" c="dimmed" ta="center">
                Van wie is dit antwoord?
            </Text>

            <Stack gap="sm">
                {namen.map((naam) => (
                    <Paper
                        key={naam}
                        withBorder
                        radius="md"
                        p="md"
                        style={{
                            cursor: loading ? "default" : "pointer",
                            borderColor:
                                selected === naam
                                    ? "var(--mantine-color-blue-5)"
                                    : undefined,
                            borderWidth: selected === naam ? 2 : 1,
                            background:
                                selected === naam
                                    ? "var(--mantine-color-blue-0)"
                                    : undefined,
                        }}
                        onClick={() => !loading && handleKiesNaam(naam)}
                    >
                        <Text fw={600} ta="center" size="lg">
                            {naam}
                        </Text>
                    </Paper>
                ))}
            </Stack>
        </Stack>
    );
}