import { Container, Stack, Button, Title } from "@mantine/core";
import { useNavigate } from "react-router-dom";

export default function HomePage() {
    const navigate = useNavigate();

    return (
        <Container size="xs" p="md">
            <Stack gap="lg" pt="xl">
                <Title ta="center">Welkom</Title>

                <Button
                    fullWidth
                    size="lg"
                    onClick={() => navigate("/setup")}
                >
                    Spel starten
                </Button>

                <Button
                    fullWidth
                    size="lg"
                    variant="light"
                    onClick={() => navigate("/init")}
                >
                    ik ben ne node
                </Button>
            </Stack>
        </Container>
    );
}