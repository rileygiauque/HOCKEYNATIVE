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

// Two pylons on left, two on right — bottom oval and top oval
const pylons: Point[] = [
  { x: PX(0.32), y: PY(0.36) }, // top-left
  { x: PX(0.68), y: PY(0.36) }, // top-right
  { x: PX(0.32), y: PY(0.66) }, // bottom-left
  { x: PX(0.68), y: PY(0.66) }, // bottom-right
];

const startPoint: Point = { x: PX(0.72), y: PY(0.87) };
const finishPoint: Point = { x: PX(0.72), y: PY(0.18) };

const checkpoints: Point[] = [
  // ── ENTER ──
  { x: PX(0.72), y: PY(0.86) },
  { x: PX(0.61), y: PY(0.88) },
  { x: PX(0.50), y: PY(0.90) },
  { x: PX(0.39), y: PY(0.88) },
  { x: PX(0.29), y: PY(0.85) },
  { x: PX(0.21), y: PY(0.79) },
  { x: PX(0.16), y: PY(0.73) },
  { x: PX(0.16), y: PY(0.66) },

  // ── Top of bottom oval → right ──
  { x: PX(0.21), y: PY(0.59) },
  { x: PX(0.30), y: PY(0.57) },
  { x: PX(0.40), y: PY(0.57) },
  { x: PX(0.50), y: PY(0.57) },
  { x: PX(0.60), y: PY(0.57) },
  { x: PX(0.70), y: PY(0.57) },
  { x: PX(0.79), y: PY(0.59) },

  // ── Right cap of bottom oval ──
  { x: PX(0.84), y: PY(0.63) },
  { x: PX(0.84), y: PY(0.66) },
  { x: PX(0.84), y: PY(0.69) },
  { x: PX(0.79), y: PY(0.73) },

  // ── Bottom of bottom oval ← left ──
  { x: PX(0.70), y: PY(0.75) },
  { x: PX(0.60), y: PY(0.75) },
  { x: PX(0.50), y: PY(0.75) },
  { x: PX(0.40), y: PY(0.75) },
  { x: PX(0.30), y: PY(0.75) },
  { x: PX(0.21), y: PY(0.73) },
  { x: PX(0.16), y: PY(0.69) },

  // ── CROSSOVER left side going UP ──
  { x: PX(0.16), y: PY(0.63) },
  { x: PX(0.16), y: PY(0.57) },
  { x: PX(0.16), y: PY(0.51) },
  { x: PX(0.16), y: PY(0.45) },
  { x: PX(0.16), y: PY(0.39) },

  // ── Left cap of top oval ──
  { x: PX(0.16), y: PY(0.36) },

  // ── Top of top oval → right ──
  { x: PX(0.21), y: PY(0.29) },
  { x: PX(0.30), y: PY(0.27) },
  { x: PX(0.40), y: PY(0.27) },
  { x: PX(0.50), y: PY(0.27) },
  { x: PX(0.60), y: PY(0.27) },
  { x: PX(0.70), y: PY(0.27) },
  { x: PX(0.79), y: PY(0.29) },

  // ── Right cap of top oval ──
  { x: PX(0.84), y: PY(0.33) },
  { x: PX(0.84), y: PY(0.36) },
  { x: PX(0.84), y: PY(0.39) },
  { x: PX(0.79), y: PY(0.43) },

  // ── Bottom of top oval ← left ──
  { x: PX(0.70), y: PY(0.45) },
  { x: PX(0.60), y: PY(0.45) },
  { x: PX(0.50), y: PY(0.45) },
  { x: PX(0.40), y: PY(0.45) },
  { x: PX(0.30), y: PY(0.45) },
  { x: PX(0.21), y: PY(0.43) },
  { x: PX(0.16), y: PY(0.39) },
  { x: PX(0.16), y: PY(0.36) },

  // ── EXIT to FINISH ──
  { x: PX(0.19), y: PY(0.27) },
  { x: PX(0.26), y: PY(0.21) },
  { x: PX(0.36), y: PY(0.18) },
  { x: PX(0.50), y: PY(0.17) },
  { x: PX(0.62), y: PY(0.17) },
  { x: PX(0.72), y: PY(0.18) },
  { x: PX(0.78), y: PY(0.19) },
];

const CHECKPOINT_RADIUS = 36;
const OFF_PATH_DISTANCE = 130;

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

// Build SVG path from checkpoints using smooth curves
function buildPath(pts: Point[]): string {
  if (pts.length < 2) return "";
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1];
    const curr = pts[i];
    const mx = (prev.x + curr.x) / 2;
    const my = (prev.y + curr.y) / 2;
    if (i === 1) {
      d += ` Q ${prev.x} ${prev.y} ${mx} ${my}`;
    } else {
      d += ` T ${curr.x} ${curr.y}`;
    }
  }
  return d;
}

export default function PracticeZipperScreen({ onBack }: Props) {
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

  // Draw a clean S-shaped path using explicit SVG curves
  const pathD = useMemo(() => {
    // True ellipse approximation using cubic beziers (k=0.5523)
    const k = 0.5523;

    const bCx = PX(0.50); const bCy = PY(0.66);
    const bRx = PX(0.34); const bRy = PY(0.09);

    const tCx = PX(0.50); const tCy = PY(0.36);
    const tRx = PX(0.34); const tRy = PY(0.09);

    // Bottom oval points
    const bR = bCx + bRx; const bL = bCx - bRx;
    const bT = bCy - bRy; const bB = bCy + bRy;

    // Top oval points
    const tR = tCx + tRx; const tL = tCx - tRx;
    const tT = tCy - tRy; const tB = tCy + tRy;

    return [
      // Enter from bottom-right, below bottom oval
      `M ${PX(0.72)} ${PY(0.86)}`,

      // Curve down and left to reach bottom of bottom oval
      `C ${PX(0.50)} ${PY(0.90)}, ${PX(0.28)} ${PY(0.88)}, ${bL} ${bCy}`,

      // Bottom-left cap of bottom oval (going up)
      `C ${bL} ${bCy - k * bRy}, ${bCx - k * bRx} ${bT}, ${bCx} ${bT}`,

      // Top straight of bottom oval going right
      `C ${bCx + k * bRx} ${bT}, ${bR} ${bCy - k * bRy}, ${bR} ${bCy}`,

      // Bottom-right cap of bottom oval (going down)
      `C ${bR} ${bCy + k * bRy}, ${bCx + k * bRx} ${bB}, ${bCx} ${bB}`,

      // Bottom straight going left back to left cap
      `C ${bCx - k * bRx} ${bB}, ${bL} ${bCy + k * bRy}, ${bL} ${bCy}`,

      // S-CROSSOVER: left side sweeps up to top oval
      `C ${bL} ${bT}, ${tL} ${tB}, ${tL} ${tCy}`,

      // Top-left cap of top oval (going up)
      `C ${tL} ${tCy - k * tRy}, ${tCx - k * tRx} ${tT}, ${tCx} ${tT}`,

      // Top straight of top oval going right
      `C ${tCx + k * tRx} ${tT}, ${tR} ${tCy - k * tRy}, ${tR} ${tCy}`,

      // Bottom-right cap of top oval (going down)
      `C ${tR} ${tCy + k * tRy}, ${tCx + k * tRx} ${tB}, ${tCx} ${tB}`,

      // Bottom straight going left back to left cap
      `C ${tCx - k * tRx} ${tB}, ${tL} ${tCy + k * tRy}, ${tL} ${tCy}`,

      // Exit: left side sweeps up and right to FINISH
      `C ${tL} ${tT}, ${PX(0.20)} ${PY(0.20)}, ${PX(0.50)} ${PY(0.17)}`,
      `C ${PX(0.65)} ${PY(0.15)}, ${PX(0.76)} ${PY(0.16)}, ${PX(0.78)} ${PY(0.19)}`,
    ].join(" ");
  }, []);
  
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
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
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
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
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
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
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
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
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

    const isNearCrossover =
      point.x < PX(0.25) && point.y > PY(0.27) && point.y < PY(0.66);
    const allowedDistance = isNearCrossover ? 180 : OFF_PATH_DISTANCE;

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
            blinkFailurePoint({ x: evt.nativeEvent.locationX, y: evt.nativeEvent.locationY });
            failRun();
          }
        },
        onPanResponderTerminate: (evt) => {
          setFinger(null);
          if (isRunning) {
            blinkFailurePoint({ x: evt.nativeEvent.locationX, y: evt.nativeEvent.locationY });
            failRun();
          }
        },
      }),
    [currentCheckpointIndex, isArmed, isRunning, isFinished, segments]
  );

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  return (
    <SafeAreaView style={styles.root}>
      {/* Timer */}
      <View style={styles.timerContainer}>
        <Text style={styles.timerMain}>{formatMs(elapsedMs)}</Text>
        <Text style={styles.timerSub}>
          Best: {bestTimeMs !== null ? formatMs(bestTimeMs) : "--"}
        </Text>
      </View>

      {/* Bottom bar */}
      <View style={styles.overlayBottom} pointerEvents="box-none">
        <Text style={styles.status}>{status}</Text>
        <Pressable style={styles.resetButton} onPress={onBack}>
          <Text style={styles.resetButtonText}>Back</Text>
        </Pressable>
      </View>

      <View style={styles.playArea} {...panResponder.panHandlers}>
        <Svg width={width} height={height} style={styles.svg}>
          {/* Trail glow */}
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

          {/* Checkpoints */}
          {checkpoints.map((point, index) => {
            const isHit = index <= currentCheckpointIndex;
            const isNext = index === currentCheckpointIndex + 1;
            const isEndpoint = index === 0 || index === checkpoints.length - 1;
            return (
              <Circle
                key={`cp-${index}`}
                cx={point.x}
                cy={point.y}
                r={isEndpoint ? 20 : 10}
                fill={isHit ? "#22c55e" : isNext ? "#facc15" : "rgba(255,255,255,0.25)"}
              />
            );
          })}

          {/* Blink on failure */}
          {blinkPoint && blinkVisible && (
            <Circle cx={blinkPoint.x} cy={blinkPoint.y} r={24}
              fill="#facc15" stroke="#fff" strokeWidth={3} />
          )}

          {/* Finger indicator */}
          {finger && <Circle cx={finger.x} cy={finger.y} r={16} fill="#38bdf8" opacity={0.85} />}
        </Svg>

        {/* Pylons */}
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

        {/* START badge */}
        <Pressable
          style={[styles.startBadge, { left: PX(0.78), top: PY(0.84) }]}
          onPress={() => { resetRun(); startRun(); }}
        >
          <Text style={styles.startBadgeText}>START</Text>
        </Pressable>

        {/* FINISH badge */}
        <View style={[styles.finishBadge, { left: PX(0.78), top: PY(0.17) }]}>
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
  timerMain: { color: "#fff", fontSize: 36, fontWeight: "900", textAlign: "center" },
  timerSub: { color: "rgba(255,255,255,0.7)", fontSize: 16, fontWeight: "600", marginTop: 2 },
  overlayBottom: {
    position: "absolute",
    left: 16, right: 16, bottom: 8,
    zIndex: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  status: { color: "#fff", fontSize: 16, fontWeight: "700" },
  resetButton: {
    backgroundColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14,
  },
  resetButtonText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  playArea: { flex: 1, position: "relative" },
  svg: { position: "absolute", left: 0, top: 0 },
  pylon: {
    position: "absolute",
    width: 68, height: 68, borderRadius: 34,
    backgroundColor: "#000",
    alignItems: "center", justifyContent: "center",
    borderWidth: 2,
    borderColor: "#eab308",
    shadowColor: "#eab308", shadowOpacity: 0.9,
    shadowRadius: 10, shadowOffset: { width: 0, height: 0 },
    elevation: 10,
  },
  pylonInner: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: "#05070c",
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.08)",
  },
  pylonText: { color: "#fff", fontSize: 16, fontWeight: "900" },
  startBadge: {
    position: "absolute",
    backgroundColor: "#ef4444",
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999,
  },
  startBadgeText: { color: "#fff", fontSize: 12, fontWeight: "900", letterSpacing: 0.8 },
  finishBadge: {
    position: "absolute",
    backgroundColor: "#22c55e", // green
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999,
  },
  finishBadgeText: { color: "#fff", fontSize: 12, fontWeight: "900", letterSpacing: 0.8 },
});