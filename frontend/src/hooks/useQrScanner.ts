import { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";

export type ScanState = "idle" | "scanning" | "loading" | "success" | "error";

export function useQrScanner(onScan: (data: string) => Promise<void>) {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    const [state, setState] = useState<ScanState>("idle");
    const [error, setError] = useState<string | null>(null);

    const scanEnabled = useRef(false);

    useEffect(() => {
        startCamera().then(() => {
            startScanning();
        });
    }, []);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: "environment",
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                },
            });

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
            }
        } catch {
            setError("Camera niet beschikbaar");
        }
    };

    const startScanning = () => {
        if (state === "scanning") return;
        setState("scanning");
        scanEnabled.current = true;
        scanLoop();
    };

    const stopScanning = () => {
        scanEnabled.current = false;
        setState("idle");
    };

    const normalizeQr = (input: string): string | null => {
        if (!input) return null;

        // 1. harde cleanup
        let cleaned = input
            .replace(/\x00/g, "")     // null bytes weg
            .trim();

        if (!cleaned) return null;

        // 2. detecteer URL
        const isUrl = cleaned.startsWith("http://") || cleaned.startsWith("https://");

        if (!isUrl) {
            // plain code → basic validatie
            return cleaned;
        }

        // 3. parse URL veilig
        try {
            const url = new URL(cleaned);

            const surv = url.searchParams.get("surv_cd");

            if (!surv) {
                // geen bruikbare code → expliciet falen
                return null;
            }

            // 4. extra cleanup op extracted waarde
            const normalized = surv.replace(/\x00/g, "").trim();

            // 5. optionele validatie (aan te raden)
            const isValid = /^[A-Z0-9-]+$/.test(normalized);

            return isValid ? normalized : null;

        } catch {
            // kapotte URL → niet bruikbaar
            return null;
        }
    }

    const scanLoop = async () => {

        setState("scanning");

        if (!scanEnabled.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas) return;

        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // center crop (performance boost)
        const size = Math.min(canvas.width, canvas.height) * 0.6;
        const x = (canvas.width - size) / 2;
        const y = (canvas.height - size) / 2;

        const imageData = ctx.getImageData(x, y, size, size);

        const code = jsQR(imageData.data, size, size);

        if (code) {
            scanEnabled.current = false;
            setState("loading");
            const normalized = normalizeQr(code.data);

            if (!normalized) {
                setError("Scan fout");
                setState("error");
                return;
            }

            try {
                await onScan(normalized);
                setState("success");
                setTimeout(startScanning, 1000);
            } catch (err: any) {
                setError(err?.message || "Scan fout");
                setState("error");
            }
            return;
        }

        // throttle (battery safe)
        setTimeout(scanLoop, 300);
    };

    return {
        videoRef,
        canvasRef,
        state,
        error,
        startScanning,
        stopScanning,
        setState,
    };
}