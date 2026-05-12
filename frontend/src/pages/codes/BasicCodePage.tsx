import { TextInput, Button, Stack } from "@mantine/core";
import { useState } from "react";
import { useCodeSubmit } from "../../layouts/CodeLayout";

export default function BasicCodePage() {
  const { submitCode, loading } = useCodeSubmit();
  const [code, setCode] = useState("");

  return (
    <Stack gap="md">
      <TextInput
        label="Code"
        placeholder="Voer de code in..."
        value={code}
        size="md"
        onChange={(e) => setCode(e.currentTarget.value)}
        onKeyDown={(e) => e.key === "Enter" && submitCode(code)}
        autoFocus
      />
      <Button
        fullWidth
        size="md"
        loading={loading}
        disabled={!code.trim()}
        onClick={() => submitCode(code)}
      >
        Bevestig
      </Button>
    </Stack>
  );
}