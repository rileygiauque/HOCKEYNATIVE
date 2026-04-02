import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Dimensions,
  PanResponder,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Svg, { Circle, Path } from "react-native-svg";

const { width, height } = Dimensions.get("window");

type Point = { x: number; y: number };
type Props = { onBack: () => void };

const PX = (x: number) => width * x;
const PY = (y: number) => height * y;

const pylons: Point[] = [
  { x: PX(0.48), y: PY(0.30) }, // top-left
  { x: PX(0.78), y: PY(0.36) }, // top-right
  { x: PX(0.32), y: PY(0.58) }, // bottom-left
  { x: PX(0.62), y: PY(0.68) }, // bottom-right
];

const checkpoints = [
  { x: PX(0.27), y: PY(0.84) },

  // to bottom-left
  { x: PX(0.28), y: PY(0.75) },
  { x: PX(0.34), y: PY(0.67) },
  { x: PX(0.40), y: PY(0.63) },

  { x: PX(0.40), y: PY(0.64) },
  { x: PX(0.46), y: PY(0.58) },
  { x: PX(0.44), y: PY(0.49) },
  { x: PX(0.35), y: PY(0.45) },
  { x: PX(0.24), y: PY(0.47) },
  { x: PX(0.16), y: PY(0.56) },
  { x: PX(0.16), y: PY(0.69) },
  { x: PX(0.24), y: PY(0.76) },
  { x: PX(0.36), y: PY(0.73) },
  { x: PX(0.44), y: PY(0.62) },

  // to top-left
  { x: PX(0.52), y: PY(0.46) },
  { x: PX(0.57), y: PY(0.38) },
  { x: PX(0.60), y: PY(0.29) },

  // around top-left (slight adjustment only)
  { x: PX(0.58), y: PY(0.18) },
  { x: PX(0.50), y: PY(0.14) },
  { x: PX(0.42), y: PY(0.14) },
  { x: PX(0.36), y: PY(0.20) },
  { x: PX(0.36), y: PY(0.29) },
  { x: PX(0.41), y: PY(0.36) },
  { x: PX(0.48), y: PY(0.36) },

  // to top-right
  { x: PX(0.54), y: PY(0.42) },
  { x: PX(0.67), y: PY(0.50) },
  { x: PX(0.82), y: PY(0.50) },

  // around top-right
  { x: PX(0.92), y: PY(0.46) },
  { x: PX(0.96), y: PY(0.37) },
  { x: PX(0.93), y: PY(0.27) },
  { x: PX(0.85), y: PY(0.22) },
  { x: PX(0.75), y: PY(0.23) },
  { x: PX(0.70), y: PY(0.30) },

  // down to bottom-right
  { x: PX(0.64), y: PY(0.43) },
  { x: PX(0.56), y: PY(0.59) },
  { x: PX(0.50), y: PY(0.71) },

  // around bottom-right
  { x: PX(0.52), y: PY(0.82) },
  { x: PX(0.61), y: PY(0.85) },
  { x: PX(0.74), y: PY(0.83) },
  { x: PX(0.80), y: PY(0.75) },
  { x: PX(0.77), y: PY(0.64) },
  { x: PX(0.70), y: PY(0.58) },

  // finish between the top two pylons
  { x: PX(0.59), y: PY(0.51) },
  { x: PX(0.57), y: PY(0.41) },
  { x: PX(0.61), y: PY(0.31) },
  { x: PX(0.65), y: PY(0.23) },
  { x: PX(0.66), y: PY(0.17) },
  { x: PX(0.66), y: PY(0.12) },
];

const CHECKPOINT_RADIUS = 36;
const OFF_PATH_DISTANCE = 120;

function distance(a: Point, b: Point) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function densify(points: Point[], stepsPerSegment = 6): Point[] {
  const result: Point[] = [];

  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];

    for (let j = 0; j < stepsPerSegment; j++) {
      const t = j / stepsPerSegment;
      result.push({
        x: lerp(a.x, b.x, t),
        y: lerp(a.y, b.y, t),
      });
    }
  }

  result.push(points[points.length - 1]);
  return result;
}

function filterBySpacing(points: Point[], minSpacing = 34): Point[] {
  const result: Point[] = [];

  for (const p of points) {
    const tooClose = result.some((q) => distance(p, q) < minSpacing);
    if (!tooClose) result.push(p);
  }

  return result;
}

function pointNearAnyNonAdjacentSegment(
  point: Point,
  segments: { a: Point; b: Point }[],
  pointIndex: number,
  pointsPerOriginalSegment: number,
  threshold = 26
) {
  const approxSegmentIndex = Math.floor(pointIndex / pointsPerOriginalSegment);

  for (let i = 0; i < segments.length; i++) {
    // skip same segment and immediate neighbors
    if (Math.abs(i - approxSegmentIndex) <= 1) continue;

    const d = distanceToSegment(point, segments[i].a, segments[i].b);
    if (d < threshold) return true;
  }

  return false;
}

function removeIntersectionDots(
  densePoints: Point[],
  baseSegments: { a: Point; b: Point }[],
  pointsPerOriginalSegment: number,
  threshold = 26
) {
  return densePoints.filter(
    (p, i) =>
      !pointNearAnyNonAdjacentSegment(
        p,
        baseSegments,
        i,
        pointsPerOriginalSegment,
        threshold
      )
  );
}

function distanceToSegment(p: Point, a: Point, b: Point) {
  const l2 = (b.x - a.x) ** 2 + (b.y - a.y) ** 2;
  if (l2 === 0) return distance(p, a);
  let t = ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  return distance(p, { x: a.x + t * (b.x - a.x), y: a.y + t * (b.y - a.y) });
}

function formatMs(ms: number) {
  return (ms / 1000).toFixed(2);
}

export default function PracticeParallelogramScreen({ onBack }: Props) {
  const [isArmed, setIsArmed] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [currentCheckpointIndex, setCurrentCheckpointIndex] = useState(-1);
  const [finger, setFinger] = useState<Point | null>(null);
  const [status, setStatus] = useState("Touch START to begin");
  const [bestTimeMs, setBestTimeMs] = useState<number | null>(null);
  const [blinkPoint, setBlinkPoint] = useState<Point | null>(null);
  const [blinkVisible, setBlinkVisible] = useState(false);

  const startTimeRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const pathD = useMemo(() => {
  return [
    // START
    `M ${PX(0.27)} ${PY(0.84)}`,

    // smooth rise into first loop
    `C ${PX(0.28)} ${PY(0.77)}, ${PX(0.33)} ${PY(0.69)}, ${PX(0.39)} ${PY(0.63)}`,

    // bottom-left loop — smoother entry and rounder body
    `C ${PX(0.45)} ${PY(0.60)}, ${PX(0.48)} ${PY(0.55)}, ${PX(0.45)} ${PY(0.49)}`,
    `C ${PX(0.40)} ${PY(0.43)}, ${PX(0.30)} ${PY(0.43)}, ${PX(0.21)} ${PY(0.50)}`,
    `C ${PX(0.13)} ${PY(0.56)}, ${PX(0.13)} ${PY(0.68)}, ${PX(0.21)} ${PY(0.74)}`,
    `C ${PX(0.30)} ${PY(0.80)}, ${PX(0.40)} ${PY(0.73)}, ${PX(0.45)} ${PY(0.63)}`,

    // smoother climb to top-left
    `C ${PX(0.51)} ${PY(0.54)}, ${PX(0.58)} ${PY(0.43)}, ${PX(0.61)} ${PY(0.33)}`,

    // top-left loop — slight outward adjustment (no overlap, not exaggerated)
    `C ${PX(0.63)} ${PY(0.24)}, ${PX(0.58)} ${PY(0.16)}, ${PX(0.50)} ${PY(0.14)}`,
    `C ${PX(0.42)} ${PY(0.13)}, ${PX(0.36)} ${PY(0.18)}, ${PX(0.36)} ${PY(0.27)}`,
    `C ${PX(0.36)} ${PY(0.34)}, ${PX(0.42)} ${PY(0.38)}, ${PX(0.49)} ${PY(0.40)}`,
    `C ${PX(0.55)} ${PY(0.43)}, ${PX(0.67)} ${PY(0.50)}, ${PX(0.79)} ${PY(0.50)}`,

    // top-right loop — softer outer arc
    `C ${PX(0.89)} ${PY(0.51)}, ${PX(0.96)} ${PY(0.45)}, ${PX(0.98)} ${PY(0.36)}`,
    `C ${PX(0.99)} ${PY(0.29)}, ${PX(0.95)} ${PY(0.23)}, ${PX(0.87)} ${PY(0.21)}`,
    `C ${PX(0.79)} ${PY(0.20)}, ${PX(0.72)} ${PY(0.24)}, ${PX(0.70)} ${PY(0.30)}`,

    // smoother drop toward bottom-right
    `C ${PX(0.67)} ${PY(0.40)}, ${PX(0.57)} ${PY(0.58)}, ${PX(0.50)} ${PY(0.70)}`,

    // bottom-right loop — rounder and less angular
    `C ${PX(0.48)} ${PY(0.79)}, ${PX(0.53)} ${PY(0.85)}, ${PX(0.62)} ${PY(0.86)}`,
    `C ${PX(0.72)} ${PY(0.87)}, ${PX(0.79)} ${PY(0.82)}, ${PX(0.81)} ${PY(0.75)}`,
    `C ${PX(0.83)} ${PY(0.67)}, ${PX(0.79)} ${PY(0.60)}, ${PX(0.71)} ${PY(0.58)}`,

    // finish — adjusted to swing farther left like the red line
    `C ${PX(0.60)} ${PY(0.53)}, ${PX(0.58)} ${PY(0.43)}, ${PX(0.61)} ${PY(0.33)}`,
    `C ${PX(0.64)} ${PY(0.25)}, ${PX(0.66)} ${PY(0.18)}, ${PX(0.66)} ${PY(0.12)}`,  
    ].join(" ");
  }, []);

  const baseSegments = useMemo(() => {
    const arr: { a: Point; b: Point }[] = [];
    for (let i = 0; i < checkpoints.length - 1; i++) {
      arr.push({ a: checkpoints[i], b: checkpoints[i + 1] });
    }
    return arr;
  }, []);


  const blinkFailurePoint = (point: Point) => {
    setBlinkPoint(point);
    setBlinkVisible(true);
    let count = 0;
    const interval = setInterval(() => {
      setBlinkVisible((prev) => !prev);
      count++;
      if (count >= 6) {
        clearInterval(interval);
        setBlinkPoint(null);
        setBlinkVisible(false);
      }
    }, 180);
  };

  const resetRun = () => {
    setIsArmed(false);
    setIsRunning(false);
    setIsFinished(false);
    setElapsedMs(0);
    setCurrentCheckpointIndex(-1);
    setFinger(null);
    setStatus("Touch START to begin");
    startTimeRef.current = null;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const failRun = () => {
    setIsArmed(false);
    setIsRunning(false);
    setIsFinished(false);
    setFinger(null);
    setElapsedMs(0);
    setCurrentCheckpointIndex(-1);
    setStatus("Off path. Try again.");
    startTimeRef.current = null;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startRun = () => {
    if (isRunning || isFinished) return;
    setIsArmed(true);
    setIsRunning(false);
    setIsFinished(false);
    setElapsedMs(0);
    setCurrentCheckpointIndex(-1);
    setFinger(null);
    setStatus("Touch the first dot to start");
    startTimeRef.current = null;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const beginTimedRun = () => {
    const now = Date.now();
    startTimeRef.current = now;
    setIsRunning(true);
    setStatus("Go!");
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      if (startTimeRef.current) setElapsedMs(Date.now() - startTimeRef.current);
    }, 16);
  };

  const finishRun = () => {
    if (!startTimeRef.current) return;
    const total = Date.now() - startTimeRef.current;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setElapsedMs(total);
    setIsRunning(false);
    setIsFinished(true);
    setStatus("Finished! 🎉");
    if (bestTimeMs === null || total < bestTimeMs) setBestTimeMs(total);
  };

  const handleTouchPoint = (x: number, y: number) => {
    const point = { x, y };
    setFinger(point);

    if (!isArmed && !isRunning && !isFinished) return;
    if (isFinished) return;

    const nextCheckpoint = checkpoints[currentCheckpointIndex + 1];
    if (!nextCheckpoint) return;

    const distToNext = distance(point, nextCheckpoint);

    if (isArmed && !isRunning && currentCheckpointIndex === -1) {
      if (distToNext <= CHECKPOINT_RADIUS) {
        setCurrentCheckpointIndex(0);
        beginTimedRun();
      }
      return;
    }

    if (!isRunning) return;

    const seg = baseSegments[Math.min(currentCheckpointIndex, baseSegments.length - 1)];
    const offPath = distanceToSegment(point, seg.a, seg.b);

    // Extra grace near crossing zones
    const isNearCrossing =
      point.x > PX(0.35) &&
      point.x < PX(0.65) &&
      point.y > PY(0.35) &&
      point.y < PY(0.65);
    const allowedDistance = isNearCrossing ? 160 : OFF_PATH_DISTANCE;

    if (offPath > allowedDistance) {
      blinkFailurePoint(point);
      failRun();
      return;
    }

    if (distToNext <= CHECKPOINT_RADIUS) {
      const newIndex = currentCheckpointIndex + 1;
      setCurrentCheckpointIndex(newIndex);
      if (newIndex === checkpoints.length - 1) finishRun();
    }
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) =>
          handleTouchPoint(evt.nativeEvent.locationX, evt.nativeEvent.locationY),
        onPanResponderMove: (evt) =>
          handleTouchPoint(evt.nativeEvent.locationX, evt.nativeEvent.locationY),
        onPanResponderRelease: (evt) => {
          setFinger(null);
          if (isRunning) {
            blinkFailurePoint({
              x: evt.nativeEvent.locationX,
              y: evt.nativeEvent.locationY,
            });
            failRun();
          }
        },
        onPanResponderTerminate: (evt) => {
          setFinger(null);
          if (isRunning) {
            blinkFailurePoint({
              x: evt.nativeEvent.locationX,
              y: evt.nativeEvent.locationY,
            });
            failRun();
          }
        },
      }),
    [currentCheckpointIndex, isArmed, isRunning, isFinished, baseSegments]
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.timerContainer}>
        <Text style={styles.timerMain}>{formatMs(elapsedMs)}</Text>
        <Text style={styles.timerSub}>
          Best: {bestTimeMs !== null ? formatMs(bestTimeMs) : "--"}
        </Text>
      </View>

      <View style={styles.overlayBottom} pointerEvents="box-none">
        <Text style={styles.status}>{status}</Text>
        <Pressable style={styles.resetButton} onPress={onBack}>
          <Text style={styles.resetButtonText}>Back</Text>
        </Pressable>
      </View>

      <View style={styles.playArea} {...panResponder.panHandlers}>
        <Svg width={width} height={height} style={styles.svg}>
          <Path
            d={pathD}
            stroke="rgba(255,255,255,0.16)"
            strokeWidth={22}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <Path
            d={pathD}
            stroke="#ffffff"
            strokeWidth={6}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            opacity={0.9}
          />

          {checkpoints.map((point, index) => {
            const isHit = index <= currentCheckpointIndex;
            const isNext = !isRunning
              ? index === 0 // only first dot before start
              : index > currentCheckpointIndex &&
                index <= currentCheckpointIndex + 3;
            const isEndpoint =
              index === 0 || index === checkpoints.length - 1;

            return (
              <Circle
                key={`checkpoint-${index}`}
                cx={point.x}
                cy={point.y}
                r={isEndpoint ? 20 : 10}
                fill={
                  isHit
                    ? "#22c55e"
                    : isNext
                    ? "#facc15"
                    : "rgba(255,255,255,0.35)"
                }
              />
            );
          })}

          {blinkPoint && blinkVisible && (
            <Circle
              cx={blinkPoint.x}
              cy={blinkPoint.y}
              r={24}
              fill="#facc15"
              stroke="#fff"
              strokeWidth={3}
            />
          )}

          {finger && (
            <Circle
              cx={finger.x}
              cy={finger.y}
              r={16}
              fill="#38bdf8"
              opacity={0.85}
            />
          )}
        </Svg>

        {pylons.map((pylon, index) => (
          <View
            key={`pylon-${index}`}
            style={[styles.pylon, { left: pylon.x - 34, top: pylon.y - 34 }]}
          >
            <View style={styles.pylonInner}>
              <Text style={styles.pylonText}></Text>
            </View>
          </View>
        ))}

        <Pressable
          style={[styles.startBadge, { left: PX(0.04), top: PY(0.82) }]}
          onPress={() => {
            resetRun();
            startRun();
          }}
        >
          <Text style={styles.startBadgeText}>START</Text>
        </Pressable>

        <View style={[styles.finishBadge, { left: PX(0.7), top: PY(0.10) }]}>
          <Text style={styles.finishBadgeText}>FINISH</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#050816" },
  timerContainer: {
    position: "absolute",
    top: 50,
    left: 0,
    right: 0,
    zIndex: 20,
    alignItems: "center",
  },
  timerMain: {
    color: "#fff",
    fontSize: 36,
    fontWeight: "900",
    textAlign: "center",
  },
  timerSub: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 2,
  },
  overlayBottom: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 8,
    zIndex: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  status: { color: "#fff", fontSize: 16, fontWeight: "700" },
  resetButton: {
    backgroundColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
  },
  resetButtonText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  playArea: { flex: 1, position: "relative" },
  svg: { position: "absolute", left: 0, top: 0 },
  pylon: {
    position: "absolute",
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#eab308",
    shadowColor: "#eab308",
    shadowOpacity: 0.9,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
  },
  pylonInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#05070c",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  pylonText: { color: "#fff", fontSize: 16, fontWeight: "900" },
  startBadge: {
    position: "absolute",
    backgroundColor: "#ef4444",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  startBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  finishBadge: {
    position: "absolute",
    backgroundColor: "#22c55e", // green
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  finishBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
});