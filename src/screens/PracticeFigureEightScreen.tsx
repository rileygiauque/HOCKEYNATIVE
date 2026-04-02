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

type Point = {
  x: number;
  y: number;
};

type Props = {
  onBack: () => void;
};

const PX = (xPercent: number) => width * xPercent;
const PY = (yPercent: number) => height * yPercent;

// Two pylons, perfectly vertically aligned
const pylons: Point[] = [
  { x: PX(0.5), y: PY(0.34) }, // top
  { x: PX(0.5), y: PY(0.70) }, // bottom
];

function cubicBezierPoint(
  p0: Point,
  p1: Point,
  p2: Point,
  p3: Point,
  t: number
): Point {
  const mt = 1 - t;
  const mt2 = mt * mt;
  const mt3 = mt2 * mt;
  const t2 = t * t;
  const t3 = t2 * t;

  return {
    x: mt3 * p0.x + 3 * mt2 * t * p1.x + 3 * mt * t2 * p2.x + t3 * p3.x,
    y: mt3 * p0.y + 3 * mt2 * t * p1.y + 3 * mt * t2 * p2.y + t3 * p3.y,
  };
}

function buildCheckpoints(samplesPerCurve = 4): Point[] {
  const curves = [
    // M 0.16,0.50
    [
      { x: PX(0.16), y: PY(0.50) },
      { x: PX(0.26), y: PY(0.50) },
      { x: PX(0.36), y: PY(0.49) },
      { x: PX(0.46), y: PY(0.47) },
    ],

    [
      { x: PX(0.46), y: PY(0.47) },
      { x: PX(0.58), y: PY(0.44) },
      { x: PX(0.66), y: PY(0.36) },
      { x: PX(0.66), y: PY(0.28) },
    ],
    [
      { x: PX(0.66), y: PY(0.28) },
      { x: PX(0.66), y: PY(0.20) },
      { x: PX(0.58), y: PY(0.16) },
      { x: PX(0.50), y: PY(0.16) },
    ],
    [
      { x: PX(0.50), y: PY(0.16) },
      { x: PX(0.42), y: PY(0.16) },
      { x: PX(0.34), y: PY(0.20) },
      { x: PX(0.34), y: PY(0.28) },
    ],
    [
      { x: PX(0.34), y: PY(0.28) },
      { x: PX(0.34), y: PY(0.38) },
      { x: PX(0.40), y: PY(0.50) },
      { x: PX(0.46), y: PY(0.56) },
    ],

    [
      { x: PX(0.46), y: PY(0.56) },
      { x: PX(0.49), y: PY(0.60) },
      { x: PX(0.51), y: PY(0.64) },
      { x: PX(0.58), y: PY(0.66) },
    ],

    [
      { x: PX(0.58), y: PY(0.66) },
      { x: PX(0.66), y: PY(0.69) },
      { x: PX(0.70), y: PY(0.77) },
      { x: PX(0.64), y: PY(0.82) },
    ],
    [
      { x: PX(0.64), y: PY(0.82) },
      { x: PX(0.58), y: PY(0.85) },
      { x: PX(0.42), y: PY(0.85) },
      { x: PX(0.36), y: PY(0.82) },
    ],
    [
      { x: PX(0.36), y: PY(0.82) },
      { x: PX(0.30), y: PY(0.77) },
      { x: PX(0.32), y: PY(0.69) },
      { x: PX(0.42), y: PY(0.66) },
    ],
    [
      { x: PX(0.42), y: PY(0.66) },
      { x: PX(0.46), y: PY(0.64) },
      { x: PX(0.50), y: PY(0.61) },
      { x: PX(0.54), y: PY(0.58) },
    ],

    [
      { x: PX(0.54), y: PY(0.58) },
      { x: PX(0.62), y: PY(0.58) },
      { x: PX(0.72), y: PY(0.54) },
      { x: PX(0.86), y: PY(0.50) },
    ],
  ] as const;

  const points: Point[] = [];

  curves.forEach(([p0, p1, p2, p3], curveIndex) => {
    const start = curveIndex === 0 ? 0 : 1;
    for (let i = start; i <= samplesPerCurve; i++) {
      points.push(cubicBezierPoint(p0, p1, p2, p3, i / samplesPerCurve));
    }
  });

  return points;
}

const checkpoints: Point[] = buildCheckpoints(4);
const CHECKPOINT_RADIUS = 36;
const OFF_PATH_DISTANCE = 92;

function distance(a: Point, b: Point) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function distanceToSegment(p: Point, a: Point, b: Point) {
  const l2 = (b.x - a.x) * (b.x - a.x) + (b.y - a.y) * (b.y - a.y);
  if (l2 === 0) return distance(p, a);

  let t = ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / l2;
  t = Math.max(0, Math.min(1, t));

  const projection = {
    x: a.x + t * (b.x - a.x),
    y: a.y + t * (b.y - a.y),
  };

  return distance(p, projection);
}

function formatMs(ms: number) {
  return (ms / 1000).toFixed(2);
}

export default function PracticeFigureEightScreen({ onBack }: Props) {
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
  return `
    M ${PX(0.16)} ${PY(0.50)}

    C ${PX(0.26)} ${PY(0.50)}, ${PX(0.36)} ${PY(0.49)}, ${PX(0.46)} ${PY(0.47)}

    C ${PX(0.58)} ${PY(0.44)}, ${PX(0.66)} ${PY(0.36)}, ${PX(0.66)} ${PY(0.28)}
    C ${PX(0.66)} ${PY(0.20)}, ${PX(0.58)} ${PY(0.16)}, ${PX(0.50)} ${PY(0.16)}
    C ${PX(0.42)} ${PY(0.16)}, ${PX(0.34)} ${PY(0.20)}, ${PX(0.34)} ${PY(0.28)}
    C ${PX(0.34)} ${PY(0.38)}, ${PX(0.40)} ${PY(0.50)}, ${PX(0.46)} ${PY(0.56)}

    C ${PX(0.49)} ${PY(0.60)}, ${PX(0.51)} ${PY(0.64)}, ${PX(0.58)} ${PY(0.66)}

    C ${PX(0.66)} ${PY(0.69)}, ${PX(0.70)} ${PY(0.77)}, ${PX(0.64)} ${PY(0.82)}
    C ${PX(0.58)} ${PY(0.85)}, ${PX(0.42)} ${PY(0.85)}, ${PX(0.36)} ${PY(0.82)}
    C ${PX(0.30)} ${PY(0.77)}, ${PX(0.32)} ${PY(0.69)}, ${PX(0.42)} ${PY(0.66)}
    C ${PX(0.46)} ${PY(0.64)}, ${PX(0.50)} ${PY(0.61)}, ${PX(0.54)} ${PY(0.58)}

    C ${PX(0.62)} ${PY(0.58)}, ${PX(0.72)} ${PY(0.54)}, ${PX(0.86)} ${PY(0.50)}
  `;
}, []);

  const segments = useMemo(() => {
    const arr: { a: Point; b: Point }[] = [];
    for (let i = 0; i < checkpoints.length - 1; i += 1) {
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
      count += 1;

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

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    timerRef.current = setInterval(() => {
      if (startTimeRef.current) {
        setElapsedMs(Date.now() - startTimeRef.current);
      }
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

    if (bestTimeMs === null || total < bestTimeMs) {
      setBestTimeMs(total);
    }
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

    const currentSegment =
      segments[Math.min(currentCheckpointIndex, segments.length - 1)];

    const offPath = distanceToSegment(point, currentSegment.a, currentSegment.b);

    const isNearCenterCross =
      point.x > PX(0.43) &&
      point.x < PX(0.60) &&
      point.y > PY(0.54) &&
      point.y < PY(0.68);

    const allowedDistance = isNearCenterCross ? 120 : OFF_PATH_DISTANCE;
    
    if (offPath > allowedDistance) {
      blinkFailurePoint(point);
      failRun();
      return;
    }

    if (distToNext <= CHECKPOINT_RADIUS) {
      const newIndex = currentCheckpointIndex + 1;
      setCurrentCheckpointIndex(newIndex);

      if (newIndex === checkpoints.length - 1) {
        finishRun();
      }
    }
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) => {
          handleTouchPoint(evt.nativeEvent.locationX, evt.nativeEvent.locationY);
        },
        onPanResponderMove: (evt) => {
          handleTouchPoint(evt.nativeEvent.locationX, evt.nativeEvent.locationY);
        },
        onPanResponderRelease: (evt) => {
          const point = {
            x: evt.nativeEvent.locationX,
            y: evt.nativeEvent.locationY,
          };
          setFinger(null);
          if (isRunning) {
            blinkFailurePoint(point);
            failRun();
          }
        },
        onPanResponderTerminate: (evt) => {
          const point = {
            x: evt.nativeEvent.locationX,
            y: evt.nativeEvent.locationY,
          };
          setFinger(null);
          if (isRunning) {
            blinkFailurePoint(point);
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
            const isNext = !isRunning
              ? index === 0
              : index > currentCheckpointIndex &&
                index <= currentCheckpointIndex + 3;

            const isEndpoint =
              index === 0 || index === checkpoints.length - 1;

            return (
              <Circle
                key={`checkpoint-${index}`}
                cx={point.x}
                cy={point.y}
                r={
                  isEndpoint
                    ? 20
                    : index === currentCheckpointIndex + 1
                    ? 12
                    : index === currentCheckpointIndex + 2
                    ? 10
                    : index === currentCheckpointIndex + 3
                    ? 8
                    : 10
                }
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
              stroke="#ffffff"
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
            style={[
              styles.pylon,
              {
                left: pylon.x - 34,
                top: pylon.y - 34,
              },
            ]}
          >
            <View style={styles.pylonInner}>
              <Text style={styles.pylonText}></Text>
            </View>
          </View>
        ))}

        <Pressable
          style={[
            styles.startBadge,
            {
              left: PX(0.05),
              top: PY(0.46),
            },
          ]}
          onPress={() => {
            resetRun();
            startRun();
          }}
        >
          <Text style={styles.startBadgeText}>START</Text>
        </Pressable>

        <View
          style={[
            styles.finishBadge,
            {
              left: PX(0.79),
              top: PY(0.46),
            },
          ]}
        >
          <Text style={styles.finishBadgeText}>FINISH</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#050816",
  },
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
    textAlign: "center",
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
  status: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  resetButton: {
    backgroundColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
  },
  resetButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  playArea: {
    flex: 1,
    position: "relative",
  },
  svg: {
    position: "absolute",
    left: 0,
    top: 0,
  },
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
  pylonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "900",
  },
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