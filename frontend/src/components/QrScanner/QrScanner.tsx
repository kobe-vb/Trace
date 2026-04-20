// frontend/src/components/QrScanner/QrScanner.tsx
import { Box, Text, Badge, TextInput, ActionIcon } from "@mantine/core";
import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { useQrScanner } from "../../hooks/useQrScanner";
import type { ScanState } from "../../hooks/useQrScanner";
import classes from "./QrScanner.module.css";

interface QrScannerProps {
  onScan: (data: string) => Promise<void>;
  title?: string;
  subtitle?: string;
  showManualInput?: boolean;
}

export function QrScanner({
  onScan,
  title = "Scan QR",
  subtitle = "Hou de QR code binnen het kader",
  showManualInput = true,
}: QrScannerProps) {
  const scanner = useQrScanner(onScan);
  const [manualCode, setManualCode] = useState("");

  return (
    <Box className={classes.wrapper}>
      {/* Header */}
      <Box ta="center">
        <Text className={classes.title}>{title}</Text>
        <Text className={classes.subtitle}>{subtitle}</Text>
      </Box>

      {/* Status badge */}
      <Box ta="center">
        <StatusBadge state={scanner.state} error={scanner.error} />
      </Box>

      {/* Camera card */}
      <Box className={classes.cameraCard}>
        <video
          ref={scanner.videoRef}
          className={classes.video}
          playsInline
          muted
        />
        <canvas ref={scanner.canvasRef} style={{ display: "none" }} />

        {/* Overlay */}
        <Box className={classes.overlay} />

        {/* Scan frame with animated corners */}
        <Box className={classes.scanFrame}>
          <span className={`${classes.corner} ${classes.tl}`} />
          <span className={`${classes.corner} ${classes.tr}`} />
          <span className={`${classes.corner} ${classes.bl}`} />
          <span className={`${classes.corner} ${classes.br}`} />
        </Box>

        {/* Scan line */}
        {scanner.state === "scanning" && (
          <Box className={classes.scanLine} />
        )}

        {/* Success / Error overlay */}
        {scanner.state === "success" && (
          <Box className={`${classes.feedbackOverlay} ${classes.success}`}>
            <Text className={classes.feedbackText}>✓</Text>
          </Box>
        )}
        {scanner.state === "error" && (
          <Box
            className={`${classes.feedbackOverlay} ${classes.error}`}
            onClick={() => {
              scanner.setState("scanning");
              scanner.startScanning();
            }}
          >
            <Text className={classes.feedbackText}>✕ Opnieuw proberen</Text>
          </Box>
        )}

        <Text className={classes.hint}>Hou de QR code binnen het kader</Text>
      </Box>

      {/* Manual input */}
      {showManualInput && (
        <>
          <Box className={classes.divider}>
            <Box className={classes.dividerLine} />
            <Text className={classes.dividerText}>of voer code in</Text>
            <Box className={classes.dividerLine} />
          </Box>

          <TextInput
            placeholder="Voer code in..."
            value={manualCode}
            onChange={(e) => setManualCode(e.currentTarget.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && manualCode) onScan(manualCode);
            }}
            rightSection={
              <ActionIcon
                variant="filled"
                className={classes.submitBtn}
                onClick={() => manualCode && onScan(manualCode)}
              >
                <ArrowRight size={16} />
              </ActionIcon>
            }
            classNames={{ input: classes.manualInput }}
          />
        </>
      )}
    </Box>
  );
}

function StatusBadge({ state, error }: { state: ScanState; error: string | null }) {
  if (state === "scanning") return (
    <Badge leftSection={<span className="pulse-dot" />} className="badge-scanning">
      Scannen...
    </Badge>
  );
  if (state === "loading") return <Badge color="yellow">Verwerken...</Badge>;
  if (state === "success") return <Badge color="green">Succes!</Badge>;
  if (state === "error") return <Badge color="red">{error ?? "Fout"}</Badge>;
  return <Badge variant="outline">Gereed</Badge>;
}