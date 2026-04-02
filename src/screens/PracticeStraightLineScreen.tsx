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

// 5 pylons in a straight vertical line
const pylons: Point[] = [
  { x: PX(0.46), y: PY(0.18) },
  { x: PX(0.46), y: PY(0.31) },
  { x: PX(0.46), y: PY(0.45) },
  { x: PX(0.46), y: PY(0.59) },
  { x: PX(0.46), y: PY(0.73) },
];

// Start near bottom-left, finish near top-left like your sketch
const startPoint: Point = { x: PX(0.32), y: PY(0.86) };

const checkpoints: Point[] = [
  startPoint,

  { x: PX(0.4531), y: PY(0.8537) },
  { x: PX(0.5534), y: PY(0.8348) },
  { x: PX(0.6207), y: PY(0.8034) },
  { x: PX(0.6551), y: PY(0.7593) },

  { x: PX(0.6503), y: PY(0.7060) },
  { x: PX(0.6213), y: PY(0.6869) },
  { x: PX(0.5729), y: PY(0.6726) },
  { x: PX(0.5051), y: PY(0.6631) },

  { x: PX(0.3738), y: PY(0.6493) },
  { x: PX(0.3090), y: PY(0.6347) },
  { x: PX(0.2654), y: PY(0.6162) },
  { x: PX(0.2432), y: PY(0.5938) },

  { x: PX(0.2506), y: PY(0.5560) },
  { x: PX(0.2826), y: PY(0.5369) },
  { x: PX(0.3358), y: PY(0.5226) },
  { x: PX(0.4104), y: PY(0.5131) },

  { x: PX(0.5383), y: PY(0.4997) },
  { x: PX(0.5973), y: PY(0.4866) },
  { x: PX(0.6369), y: PY(0.4705) },
  { x: PX(0.6571), y: PY(0.4516) },

  { x: PX(0.6503), y: PY(0.4160) },
  { x: PX(0.6213), y: PY(0.3969) },
  { x: PX(0.5729), y: PY(0.3826) },
  { x: PX(0.5051), y: PY(0.3731) },

  { x: PX(0.3738), y: PY(0.3597) },
  { x: PX(0.3090), y: PY(0.3466) },
  { x: PX(0.2654), y: PY(0.3305) },
  { x: PX(0.2432), y: PY(0.3116) },

  { x: PX(0.2506), y: PY(0.2760) },
  { x: PX(0.2826), y: PY(0.2569) },
  { x: PX(0.3358), y: PY(0.2426) },
  { x: PX(0.4104), y: PY(0.2331) },

  { x: PX(0.5383), y: PY(0.2197) },
  { x: PX(0.5973), y: PY(0.2066) },
  { x: PX(0.6369), y: PY(0.1905) },
  { x: PX(0.6571), y: PY(0.1716) },

  { x: PX(0.6416), y: PY(0.1477) },
  { x: PX(0.5864), y: PY(0.1312) },
  { x: PX(0.4945), y: PY(0.1205) },
  { x: PX(0.3657), y: PY(0.1170) },

  { x: PX(0.28), y: PY(0.12) },
];

const CHECKPOINT_RADIUS = 34;
const OFF_PATH_DISTANCE = 95;

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

export default function PracticeStraightLineScreen({ onBack }: Props) {
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
      M ${PX(0.32)} ${PY(0.86)}

      Q ${PX(0.66)} ${PY(0.86)} ${PX(0.66)} ${PY(0.73)}
      Q ${PX(0.66)} ${PY(0.67)} ${PX(0.46)} ${PY(0.66)}

      Q ${PX(0.24)} ${PY(0.64)} ${PX(0.24)} ${PY(0.58)}
      Q ${PX(0.24)} ${PY(0.52)} ${PX(0.46)} ${PY(0.51)}

      Q ${PX(0.66)} ${PY(0.49)} ${PX(0.66)} ${PY(0.44)}
      Q ${PX(0.66)} ${PY(0.38)} ${PX(0.46)} ${PY(0.37)}

      Q ${PX(0.24)} ${PY(0.35)} ${PX(0.24)} ${PY(0.30)}
      Q ${PX(0.24)} ${PY(0.24)} ${PX(0.46)} ${PY(0.23)}

      Q ${PX(0.66)} ${PY(0.21)} ${PX(0.66)} ${PY(0.18)}
      Q ${PX(0.66)} ${PY(0.12)} ${PX(0.28)} ${PY(0.12)}
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

    if (!isArmed && !isRunning && !isFinished) {
      return;
    }

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

    if (offPath > OFF_PATH_DISTANCE) {
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
      <View style={styles.overlayTop}>
        <Pressable style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>Back</Text>
        </Pressable>

        <View style={styles.timerContainer}>
          <Text style={styles.timerMain}>{formatMs(elapsedMs)}</Text>
          <Text style={styles.timerSub}>
            Best: {bestTimeMs !== null ? formatMs(bestTimeMs) : "--"}
          </Text>
        </View>
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

            return (
              <Circle
                key={`checkpoint-${index}`}
                cx={point.x}
                cy={point.y}
                r={index === 0 || index === checkpoints.length - 1 ? 18 : 11}
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

          {finger && <Circle cx={finger.x} cy={finger.y} r={16} fill="#38bdf8" />}
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
              left: PX(0.14),
              top: PY(0.80),
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
              left: PX(0.12),
              top: PY(0.11),
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
  overlayTop: {
    position: "absolute",
    top: 12,
    left: 0,
    right: 0,
    zIndex: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  timerContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 40,
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
  backButton: {
    position: "absolute",
    left: 16,
    top: 0,
    zIndex: 21,
  },
  backButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
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