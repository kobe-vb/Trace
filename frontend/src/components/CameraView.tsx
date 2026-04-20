import { Card } from "@mantine/core";

export function CameraView({ videoRef }: { videoRef: any }) {
  return (
    <Card radius="lg" p={0} style={{ overflow: "hidden" }}>
      <video
        ref={videoRef}
        style={{
          width: "100%",
          height: "auto",
          objectFit: "cover",
        }}
        playsInline
        muted
      />
    </Card>
  );
}