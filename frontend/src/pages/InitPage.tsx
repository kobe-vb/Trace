import { Container, Stack, Title, TextInput, Button, Card } from "@mantine/core";
import { useState } from "react";
import { api } from "../api/api";
import { useNavigate } from "react-router-dom";

export default function InitPage() {
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();


    async function start() {
        if (!name.trim()) return;

        setLoading(true);

        try {
            await api.post("/register", {
                station_name: name,
            });

            navigate(`/scan?station=${encodeURIComponent(name)}`);
        } catch (err) {
            console.error(err);
            navigate(`/scan?station=${encodeURIComponent(name)}`);
        }
        finally {
            setLoading(false);
        }
    }

    return (
        <Container size="xs" p="md">
            <Stack gap="md">
                <Title order={2} ta="center">
                    Station instellen
                </Title>

                <Card shadow="md" radius="xl" p="lg">
                    <Stack>
                        <TextInput
                            label="Station naam"
                            placeholder="bv. bij de boom"
                            value={name}
                            onChange={(e) => setName(e.currentTarget.value)}
                        />

                        <Button loading={loading} onClick={start}>
                            Start spel
                        </Button>
                    </Stack>
                </Card>
            </Stack>
        </Container>
    );
}