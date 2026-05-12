// frontend/src/pages/ScanPage.tsx
import { Container, Stack } from "@mantine/core";
import { useNavigate } from "react-router-dom";
import { QrScanner } from "../components/QrScanner/QrScanner";
import { api } from "../api/api";

export default function ScanPage() {
    const navigate = useNavigate();

    const params = new URLSearchParams(window.location.search);
    const name = params.get("station") ?? "unknown";

    async function handleScan(qr: string) {
        const redirect: any = await api.get("/game/get_redirect_url/" + qr + "/" + name);
        console.log(redirect);
        navigate(redirect);
    }

    return (
        <Container size="xs" p="md">
            <Stack gap="xl" pt="md">
                <QrScanner
                    onScan={handleScan}
                    title={`Station ${name}`}
                    subtitle="Scan de QR code om verder te gaan"
                    showManualInput
                />
            </Stack>
        </Container>
    );
}