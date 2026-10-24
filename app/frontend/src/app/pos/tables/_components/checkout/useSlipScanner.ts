"use client";

import { useEffect, useRef, useState } from "react";
import { slipWasmUrl } from "./slip-wasm";

export type CameraState = "starting" | "live" | "denied";

export function useSlipScanner(active: boolean, onPayload: (payload: string) => void) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const onPayloadRef = useRef(onPayload);
  const [camera, setCamera] = useState<CameraState>("starting");

  useEffect(() => {
    onPayloadRef.current = onPayload;
  }, [onPayload]);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    let timer = 0;
    const tracks: MediaStreamTrack[] = [];

    function stop() {
      window.clearInterval(timer);
      for (const track of tracks) track.stop();
      tracks.length = 0;
    }

    async function start() {
      const devices = navigator.mediaDevices;
      if (!devices?.getUserMedia) {
        setCamera("denied");
        return;
      }
      try {
        const stream = await devices.getUserMedia({ video: { facingMode: "environment" } });
        if (cancelled) {
          for (const track of stream.getTracks()) track.stop();
          return;
        }
        tracks.push(...stream.getTracks());
        const video = videoRef.current;
        if (!video) {
          stop();
          setCamera("denied");
          return;
        }
        video.srcObject = stream;
        await video.play();
        if (cancelled) {
          stop();
          return;
        }
        setCamera("live");
        const { BarcodeDetector, prepareZXingModule } = await import("barcode-detector/ponyfill");
        await prepareZXingModule({
          overrides: {
            locateFile: (path: string, prefix: string) => (path.endsWith(".wasm") ? slipWasmUrl(path) : `${prefix}${path}`),
          },
        });
        if (cancelled) {
          stop();
          return;
        }
        const detector = new BarcodeDetector({ formats: ["qr_code"] });
        let sent = false;
        timer = window.setInterval(() => {
          if (sent) return;
          void detector
            .detect(video)
            .then((codes) => {
              const text = codes[0]?.rawValue;
              if (!text || sent) return;
              sent = true;
              stop();
              onPayloadRef.current(text);
            })
            .catch(() => undefined);
        }, 250);
      } catch {
        if (!cancelled) setCamera("denied");
      }
    }

    void start();
    return () => {
      cancelled = true;
      stop();
    };
  }, [active]);

  return { videoRef, camera };
}
