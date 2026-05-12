import { Button, Stack, Text, Group, ActionIcon } from "@mantine/core";
import { useState } from "react";
import { useCodeSubmit } from "../../layouts/CodeLayout";

const COLORS = ["red", "blue", "yellow", "green", "white"];

export default function MasterMindPage() {
  const { submitCode, loading } = useCodeSubmit();
  const [guess, setGuess] = useState<string[]>(["red", "red", "red", "red", "red", "red"]);

  function submit() {
    submitCode(guess.map(color => color[0]).join("")); 
  }

  return (
    <Stack gap="md">
      <Text size="sm" c="dimmed">Kies 6 kleuren in volgorde</Text>
      <Group justify="center">
        {guess.map((color, i) => (
          <ActionIcon
            key={i}
            size="30px"
            radius="xl"
            style={{ backgroundColor: color }}
            onClick={() => {
              const next = [...guess];
              next[i] = COLORS[(COLORS.indexOf(color) + 1) % COLORS.length];
              setGuess(next);
            }}
          />
        ))}
      </Group>
      <Button fullWidth size="md" loading={loading} onClick={submit}>
        Bevestig
      </Button>
    </Stack>
  );
}