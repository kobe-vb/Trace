import { Container, Stack, Title, Badge, Text, Paper } from "@mantine/core";
import { useEffect, useState, createContext, useContext } from "react";
import { useNavigate, useSearchParams, Outlet } from "react-router-dom";
import { api } from "../api/api";
import ResetTipsButton from "../components/Resettipsbutton";

interface CodeContextType {
  submitCode: (code: string) => Promise<void>;
  loading: boolean;
}

export const CodeContext = createContext<CodeContextType | null>(null);

export function useCodeSubmit() {
  const ctx = useContext(CodeContext);
  if (!ctx) throw new Error("useCodeSubmit must be used inside CodeLayout");
  return ctx;
}

export default function CodeLayout() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const player = searchParams.get("player");
  const station = searchParams.get("station");

  const [nextStation, setNextStation] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!player || !station) {
      navigate("/");
      return;
    }

    async function fetchData() {
      try {
        setLoading(true);
        const nextRes: string = await api.get("/game/next_station/" + player);
        setNextStation(nextRes);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [player, station, navigate]);

  async function submitCode(code: string) {
    if (!code.trim() || !player) return;

    setLoading(true);
    try {
      const result: boolean = await api.post(
        `/game/submit_code/${encodeURIComponent(player)}`,
        code.trim()
      );

      if (result) {
        navigate(`/next_round?station=${encodeURIComponent(station ?? "")}`);
      } else {
        navigate(`/wrong_code?station=${encodeURIComponent(station ?? "")}`);
      }
    } catch (err) {
      console.error("submit_code fout:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Container size="xs" py="xl">
      <Paper withBorder shadow="md" radius="lg" p="xl">
        <Stack gap="lg">
          <Stack gap="xs" align="center">
            <Title order={2}>Vul de code in</Title>
            {nextStation && (
              <Badge size="lg" variant="light" color="blue">
                Volgend station: {nextStation}
              </Badge>
            )}
            {station && !nextStation && (
              <Text c="dimmed" size="sm">
                Station: <b>{station}</b>
              </Text>
            )}
          </Stack>

          <CodeContext.Provider value={{ submitCode, loading }}>
            <Outlet />
          </CodeContext.Provider>
          <ResetTipsButton />
        </Stack>
      </Paper>
    </Container>
  );
}