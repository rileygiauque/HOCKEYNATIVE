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
  { x: PX(0.38), y: PY(0.30) }, // top-left
  { x: PX(0.72), y: PY(0.35) }, // top-right
  { x: PX(0.28), y: PY(0.58) }, // bottom-left
  { x: PX(0.62), y: PY(0.63) }, // bottom-right
];

const checkpoints = [
  // START
  { x: 0.24, y: 0.82 },

  // Up into bottom-left loop (entry on right side)
  { x: 0.25, y: 0.72 },
  { x: 0.26, y: 0.64 },

  // === Bottom-left loop (CCW) ===
  { x: 0.24, y: 0.56 },
  { x: 0.20, y: 0.52 },
  { x: 0.16, y: 0.58 },
  { x: 0.17, y: 0.68 },
  { x: 0.22, y: 0.74 },
  { x: 0.26, y: 0.68 },

  // Exit toward center crossing
  { x: 0.30, y: 0.60 },
  { x: 0.36, y: 0.50 },

  // Cross upward to top-left loop
  { x: 0.44, y: 0.36 },
  { x: 0.50, y: 0.24 },

  // === Top-left loop (CCW) ===
  { x: 0.48, y: 0.16 },
  { x: 0.42, y: 0.12 },
  { x: 0.36, y: 0.16 },
  { x: 0.34, y: 0.26 },
  { x: 0.38, y: 0.36 },
  { x: 0.46, y: 0.34 },

  // Exit toward top-right
  { x: 0.54, y: 0.30 },
  { x: 0.64, y: 0.26 },
  { x: 0.74, y: 0.24 },

  // === Top-right loop (CW) ===
  { x: 0.82, y: 0.24 },
  { x: 0.88, y: 0.30 },
  { x: 0.86, y: 0.40 },
  { x: 0.78, y: 0.46 },
  { x: 0.70, y: 0.42 },
  { x: 0.70, y: 0.30 },

  // Cross down-left (big X)
  { x: 0.64, y: 0.40 },
  { x: 0.56, y: 0.54 },

  // === Bottom-right loop (CW) ===
  { x: 0.60, y: 0.66 },
  { x: 0.70, y: 0.74 },
  { x: 0.82, y: 0.72 },
  { x: 0.86, y: 0.60 },
  { x: 0.78, y: 0.48 },
  { x: 0.68, y: 0.52 },

  // Exit toward finish (up to gap between top pylons)
  { x: 0.60, y: 0.48 },
  { x: 0.50, y: 0.36 },
  { x: 0.48, y: 0.26 },
  { x: 0.54, y: 0.20 },

  // FINISH
  { x: 0.55, y: 0.16 },
];

const CHECKPOINT_RADIUS = 36;
const OFF_PATH_DISTANCE = 28;

function distance(a: Point, b: Point) {
  return Math.hypot(a.x - b.x, a.y - b.y);
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
  if (!checkpoints.length) return "";

  const d = [`M ${PX(checkpoints[0].x)} ${PY(checkpoints[0].y)}`];

  for (let i = 1; i < checkpoints.length; i++) {
    d.push(`L ${PX(checkpoints[i].x)} ${PY(checkpoints[i].y)}`);
  }

  return d.join(" ");
}, [checkpoints]);
  
  const segments = useMemo(() => {
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
    setStatus("Finished");
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

    const seg = segments[Math.min(currentCheckpointIndex, segments.length - 1)];
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
    [currentCheckpointIndex, isArmed, isRunning, isFinished, segments]
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
            const isNext = index === currentCheckpointIndex + 1;
            const isEndpoint =
              index === 0 || index === checkpoints.length - 1;
            return (
              <Circle
                key={`cp-${index}`}
                cx={point.x}
                cy={point.y}
                r={isEndpoint ? 20 : 10}
                fill={
                  isHit
                    ? "#22c55e"
                    : isNext
                    ? "#facc15"
                    : "rgba(255,255,255,0.25)"
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
              <Text style={styles.pylonText}>SN</Text>
            </View>
          </View>
        ))}

        <Pressable
          style={[styles.startBadge, { left: PX(0.18), top: PY(0.80) }]}
          onPress={() => {
            resetRun();
            startRun();
          }}
        >
          <Text style={styles.startBadgeText}>START</Text>
        </Pressable>

        <View style={[styles.finishBadge, { left: PX(0.04), top: PY(0.15) }]}>
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
    borderColor: "#ff3b30",
    shadowColor: "#ff3b30",
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