import { Paper, Stack, ScrollArea, Text, Badge } from "@mantine/core";
import { useEffect, useRef, useState } from "react";

const MAX_LOGS = 200;

export function useLogSocket() {
  const [logs, setLogs] = useState<string[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    let isMounted = true;

    function connect() {
      const ws = new WebSocket("ws://localhost:8000/ws/admin");
      wsRef.current = ws;

      ws.onmessage = (event) => {
        if (!isMounted) return;

        setLogs((prev) => {
          const next = [...prev, event.data];
          return next.slice(-MAX_LOGS); // cap logs
        });
      };

      ws.onclose = () => {
        // simpele reconnect (kan beter met backoff)
        setTimeout(connect, 1000);
      };
    }

    connect();

    return () => {
      isMounted = false;
      wsRef.current?.close();
    };
  }, []);

  return logs;
}

function formatLog(log: string) {
  if (log.toLowerCase().includes("error")) {
    return { color: "red", label: "ERROR" };
  }
  if (log.toLowerCase().includes("warn")) {
    return { color: "yellow", label: "WARN" };
  }
  return { color: "gray", label: "INFO" };
}

export default function AdminLogsPage() {
  const logs = useLogSocket();

  return (
    <Paper p="md" shadow="sm" radius="md">
      <ScrollArea h={500} offsetScrollbars>
        <Stack gap="xs">
          {logs.map((log, i) => {
            const meta = formatLog(log);

            return (
              <Paper
                key={i}
                p="xs"
                radius="sm"
                withBorder
                style={{ fontFamily: "monospace" }}
              >
                <Stack gap={4}>
                  <Badge color={meta.color} size="xs" variant="light">
                    {meta.label}
                  </Badge>
                  <Text size="sm">{log}</Text>
                </Stack>
              </Paper>
            );
          })}
        </Stack>
      </ScrollArea>
    </Paper>
  );
}