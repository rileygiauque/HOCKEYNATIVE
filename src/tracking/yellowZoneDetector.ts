import { VisionCameraProxy, type Frame } from "react-native-vision-camera";

const plugin = VisionCameraProxy.initFrameProcessorPlugin("detectYellowZones");

export type YellowZoneDetectorInput = {
  startZone: { x: number; y: number; rx: number; ry: number };
  finishZone: { x: number; y: number; rx: number; ry: number };
  hsv: {
    hMin: number;
    hMax: number;
    sMin: number;
    sMax: number;
    vMin: number;
    vMax: number;
  };
};

export type YellowZoneDetectorResult = {
  startPresent: boolean;
  finishPresent: boolean;
  moving: boolean;
  confidence: number;
  pixelFormat?: number;
};

export function detectYellowZones(
  frame: Frame,
  input: YellowZoneDetectorInput
): YellowZoneDetectorResult {
  "worklet";

  if (plugin == null) {
    return {
      startPresent: false,
      finishPresent: false,
      moving: false,
      confidence: 0,
    };
  }

  return plugin.call(frame, {
    startX: input.startZone.x,
    startY: input.startZone.y,
    startRx: input.startZone.rx,
    startRy: input.startZone.ry,

    finishX: input.finishZone.x,
    finishY: input.finishZone.y,
    finishRx: input.finishZone.rx,
    finishRy: input.finishZone.ry,

    hMin: input.hsv.hMin,
    hMax: input.hsv.hMax,
    sMin: input.hsv.sMin,
    sMax: input.hsv.sMax,
    vMin: input.hsv.vMin,
    vMax: input.hsv.vMax,
  }) as YellowZoneDetectorResult;
}