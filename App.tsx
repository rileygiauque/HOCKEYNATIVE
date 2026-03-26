import React, { useEffect, useMemo, useState } from "react";
import Video from "react-native-video";
import LinearGradient from "react-native-linear-gradient";

import {
  Alert,
  Animated,
  Easing,
  Image,
  NativeModules,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
} from "react-native-vision-camera";

const defaultProfile = {
  name: "Alex Carter",
  birthday: "",
  position: "Forward",
  handedness: "Left",
  gender: "Male",
  country: "Canada",
  team: "North Blades U16",
};

const DRILLS = [
  {
    id: 1,
    title: "Wide Sweep",
    difficulty: "Beginner",
    placementZones: [
      { x: 22.0, y: 68.5, rx: 3.6, ry: 3.0 },
      { x: 11.8, y: 83.2, rx: 4.0, ry: 3.3 },
      { x: 49.7, y: 57.0, rx: 3.4, ry: 2.8 },
      { x: 76.0, y: 67.0, rx: 3.5, ry: 2.9 },
      { x: 82.8, y: 79.8, rx: 3.8, ry: 3.1 },
      { x: 49.8, y: 93.6, rx: 4.2, ry: 3.6 },
    ],
    description: "6-Puck Drill",
  },
  {
    id: 2,
    title: "Straight Line",
    difficulty: "Beginner",
    placementZones: [
      { x: 53, y: 52, rx: 5.5, ry: 4.5 },
      { x: 53, y: 56, rx: 5.5, ry: 4.5 },
      { x: 54, y: 62, rx: 5.5, ry: 4.5 },
      { x: 54, y: 69, rx: 5.5, ry: 4.5 },
      { x: 54, y: 81, rx: 6.5, ry: 5 },
    ],
    description: "5-Puck Drill",
  },
  {
    id: 3,
    title: "Zipper",
    difficulty: "Intermediate",
    placementZones: [
      { x: 12, y: 57, rx: 5.5, ry: 4.5 },
      { x: 31, y: 60, rx: 5.5, ry: 4.5 },
      { x: 61, y: 59, rx: 5.5, ry: 4.5 },
      { x: 25, y: 72, rx: 6, ry: 4.8 },
      { x: 68, y: 70, rx: 6, ry: 4.8 },
    ],
    description: "4-Puck Drill",
  },
  {
    id: 4,
    title: "Parallelogram",
    difficulty: "Intermediate",
    placementZones: [
      { x: 9, y: 57, rx: 5.5, ry: 4.5 },
      { x: 21, y: 65, rx: 5.5, ry: 4.5 },
      { x: 34, y: 58, rx: 5.5, ry: 4.5 },
      { x: 79, y: 63, rx: 5.5, ry: 4.5 },
      { x: 60, y: 71, rx: 6, ry: 4.8 },
    ],
    description: "4-Puck Drill",
  },
  {
    id: 5,
    title: "Tight Sweep",
    difficulty: "Intermediate",
    placementZones: [
      { x: 48, y: 51, rx: 5.5, ry: 4.5 },
      { x: 60, y: 52, rx: 5.5, ry: 4.5 },
      { x: 44, y: 57, rx: 5.5, ry: 4.5 },
      { x: 54, y: 60, rx: 5.5, ry: 4.5 },
      { x: 40, y: 68, rx: 6.5, ry: 5 },
    ],
    description: "6-Puck Drill",
  },
  {
    id: 6,
    title: "Figure Eight",
    difficulty: "Advanced",
    placementZones: [
      { x: 50, y: 52, rx: 6, ry: 4.8 },
      { x: 49, y: 81, rx: 6.5, ry: 5 },
    ],
    description: "2-Puck Drill",
  },
  {
    id: 7,
    title: "Triple Zero",
    difficulty: "Advanced",
    placementZones: [
      { x: 25, y: 50, rx: 5.5, ry: 4.5 },
      { x: 43, y: 55, rx: 5.5, ry: 4.5 },
      { x: 57, y: 55, rx: 5.5, ry: 4.5 },
      { x: 43, y: 65, rx: 5.5, ry: 4.5 },
      { x: 35, y: 78, rx: 6.5, ry: 5 },
      { x: 63, y: 78, rx: 6.5, ry: 5 },
    ],
    description: "6-Puck Drill",
  },
];

const RANKINGS = [
  {
    name: "Liam Thompson",
    province: "Ontario",
    gender: "Male",
    age: 16,
    overallScore: 98,
    overallRank: 1,
    drills: {
      "Wide Sweep": 16.24,
      "Straight Line": 14.37,
      Zipper: 15.12,
      Parallelogram: 16.48,
      "Tight Sweep": 15.89,
      "Figure Eight": 18.42,
      "Triple Zero": 21.31,
    },
  },
  {
    name: "Noah Gagnon",
    province: "Quebec",
    gender: "Male",
    age: 15,
    overallScore: 96,
    overallRank: 2,
    drills: {
      "Wide Sweep": 16.58,
      "Straight Line": 14.65,
      Zipper: 15.39,
      Parallelogram: 16.84,
      "Tight Sweep": 16.11,
      "Figure Eight": 18.88,
      "Triple Zero": 21.76,
    },
  },
  {
    name: "Ethan Clarke",
    province: "Alberta",
    gender: "Male",
    age: 16,
    overallScore: 95,
    overallRank: 3,
    drills: {
      "Wide Sweep": 16.74,
      "Straight Line": 14.81,
      Zipper: 15.52,
      Parallelogram: 17.02,
      "Tight Sweep": 16.29,
      "Figure Eight": 19.05,
      "Triple Zero": 22.04,
    },
  },
  {
    name: "Oliver Reid",
    province: "British Columbia",
    gender: "Male",
    age: 14,
    overallScore: 93,
    overallRank: 4,
    drills: {
      "Wide Sweep": 17.06,
      "Straight Line": 15.14,
      Zipper: 15.91,
      Parallelogram: 17.46,
      "Tight Sweep": 16.62,
      "Figure Eight": 19.42,
      "Triple Zero": 22.41,
    },
  },
  {
    name: "Alex Carter",
    province: "Canada",
    gender: "Male",
    age: 15,
    overallScore: 91,
    overallRank: 5,
    drills: {
      "Wide Sweep": 17.33,
      "Straight Line": 15.47,
      Zipper: 16.18,
      Parallelogram: 17.84,
      "Tight Sweep": 16.95,
      "Figure Eight": 19.86,
      "Triple Zero": 22.88,
    },
  },
  {
    name: "Lucas Martin",
    province: "Manitoba",
    gender: "Male",
    age: 16,
    overallScore: 89,
    overallRank: 6,
    drills: {
      "Wide Sweep": 17.69,
      "Straight Line": 15.82,
      Zipper: 16.44,
      Parallelogram: 18.21,
      "Tight Sweep": 17.29,
      "Figure Eight": 20.11,
      "Triple Zero": 23.26,
    },
  },
  {
    name: "Samuel Lin",
    province: "Nova Scotia",
    gender: "Male",
    age: 15,
    overallScore: 88,
    overallRank: 7,
    drills: {
      "Wide Sweep": 17.94,
      "Straight Line": 16.04,
      Zipper: 16.77,
      Parallelogram: 18.58,
      "Tight Sweep": 17.52,
      "Figure Eight": 20.34,
      "Triple Zero": 23.61,
    },
  },
];

const CAMERA_OVERLAY_ZONES: Record<number, Array<{ x: number; y: number; rx: number; ry: number }>> = {
  1: DRILLS[0].placementZones,
  2: [
    { x: 50.6, y: 44.0, rx: 3.4, ry: 2.9 },
    { x: 50.5, y: 50.2, rx: 3.4, ry: 2.9 },
    { x: 50.4, y: 58.2, rx: 3.5, ry: 3.0 },
    { x: 50.3, y: 68.3, rx: 3.7, ry: 3.1 },
    { x: 50.2, y: 82.1, rx: 4.2, ry: 3.5 },
  ],

  3: [
    { x: 33.5, y: 58.0, rx: 4.2, ry: 3.5 },
    { x: 63.5, y: 58.5, rx: 4.2, ry: 3.5 },
    { x: 30.5, y: 72.0, rx: 4.6, ry: 3.8 },
    { x: 66.5, y: 72.0, rx: 4.6, ry: 3.8 },
  ],
  4: [
    { x: 38.5, y: 55.5, rx: 4.5, ry: 3.8 }, // top-left
    { x: 74.0, y: 60.5, rx: 4.5, ry: 3.8 }, // top-right
    { x: 16.5, y: 74.0, rx: 5.0, ry: 4.2 }, // bottom-left
    { x: 63.0, y: 80.5, rx: 5.2, ry: 4.4 }, // bottom-right
  ],
  5: [
    { x: 61.5, y: 45.5, rx: 3.8, ry: 3.2 }, // right top
    { x: 39.0, y: 54.5, rx: 4.0, ry: 3.3 }, // left top
    { x: 61.5, y: 56.5, rx: 4.0, ry: 3.3 }, // right middle
    { x: 39.0, y: 67.5, rx: 4.2, ry: 3.5 }, // left middle
    { x: 61.5, y: 78.5, rx: 4.8, ry: 4.0 }, // right bottom
    { x: 39.0, y: 90.0, rx: 5.2, ry: 4.4 }, // left bottom
  ],
  6: [
    { x: 50.0, y: 60.0, rx: 4.0, ry: 3.3 }, // top pylon
    { x: 50.0, y: 88.0, rx: 5.2, ry: 4.4 }, // bottom pylon
  ],
  7: [
    { x: 43.0, y: 56.5, rx: 3.8, ry: 3.2 }, // top-left
    { x: 56.0, y: 56.5, rx: 3.8, ry: 3.2 }, // top-right

    { x: 40.0, y: 69.5, rx: 4.2, ry: 3.5 }, // middle-left
    { x: 60.0, y: 69.5, rx: 4.2, ry: 3.5 }, // middle-right

    { x: 35.0, y: 86.0, rx: 5.0, ry: 4.2 }, // bottom-left
    { x: 65.0, y: 86.0, rx: 5.0, ry: 4.2 }, // bottom-right
  ],
};

function calculateAgeFromBirthday(birthday: string) {
  if (!birthday) return "";
  const birthDate = new Date(birthday);
  if (Number.isNaN(birthDate.getTime())) return "";

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const hasHadBirthdayThisYear =
    today.getMonth() > birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() &&
      today.getDate() >= birthDate.getDate());

  if (!hasHadBirthdayThisYear) age -= 1;
  return age > 0 ? String(age) : "";
}

const { ARHeightCheck } = NativeModules;

async function presentARHeightCheck(): Promise<{
  confirmed: boolean;
  heightMeters: number;
}> {
  if (!ARHeightCheck?.present) {
    throw new Error("ARHeightCheck native module not installed");
  }
  return ARHeightCheck.present();
}

function Header({
  currentPage,
  setCurrentPage,
  isHome = false,
}: {
  currentPage: string;
  setCurrentPage: (value: string) => void;
  isHome?: boolean;
}) {
  const items = [
    { key: "profile", label: "Profile", icon: "" },
    { key: "drills", label: "Drills", icon: "" },
    { key: "rankings", label: "Rankings", icon: "" },
  ];

  return (
    <View style={[styles.headerWrap, isHome && styles.headerWrapHome]}>
      <View style={[styles.headerTop, isHome && styles.headerTopHome]}>
        <View style={isHome && styles.headerTitleGroupHome}>

         {isHome && (
           <Image
             source={require("./assets/logo.png")}
             style={styles.logo}
             resizeMode="contain"
           />
         )}

         <Text style={[styles.appTitle, isHome && styles.appTitleHome]}>
           Stickhandling Native
         </Text>

         <Text style={[styles.appSubtitle, isHome && styles.appSubtitleHome]}>
           The standard for elite stickhandling skills
         </Text>

       </View>
      </View>

      <View style={[styles.tabsRow, isHome && styles.tabsColumn]}>
        {items.map((item) => {
          const active = currentPage === item.key;
          return (
            <Pressable
              key={item.key}
              onPress={() => setCurrentPage(item.key)}
              style={[
                styles.tabButton,
                isHome && styles.homeTabButton,
                active && styles.tabButtonActive,
                isHome && active && styles.homeTabButtonActive,
              ]}
            >

              <Text
                style={[
                  styles.tabButtonText,
                  isHome && styles.homeTabButtonText,
                  active && styles.tabButtonTextActive,
                ]}
              >
                {item.icon} {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function FieldCard({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.fieldCard}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={{ marginTop: 8 }}>{children}</View>
    </View>
  );
}

function SelectRow({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <View style={styles.choiceWrap}>
      {options.map((option) => {
        const active = option === value;
        return (
          <Pressable
            key={option}
            onPress={() => onChange(option)}
            style={[styles.choiceButton, active && styles.choiceButtonActive]}
          >
            <Text style={[styles.choiceButtonText, active && styles.choiceButtonTextActive]}>
              {option}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function ProfilePage({
  profile,
  setProfile,
}: {
  profile: typeof defaultProfile;
  setProfile: React.Dispatch<React.SetStateAction<typeof defaultProfile>>;
}) {
  const age = calculateAgeFromBirthday(profile.birthday);

  const initials = profile.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2);

  return (
    <ScrollView contentContainerStyle={styles.pageContent}>
      <View style={styles.card}>
        <View style={styles.profileTopRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials || "AC"}</Text>
          </View>

          <View style={{ flex: 1 }}>
            <TextInput
              value={profile.name}
              onChangeText={(value) =>
                setProfile((prev) => ({ ...prev, name: value }))
              }
              placeholder="Athlete name"
              placeholderTextColor="#94a3b8"
              style={styles.nameInput}
            />

            <TextInput
              value={profile.team}
              onChangeText={(value) =>
                setProfile((prev) => ({ ...prev, team: value }))
              }
              placeholder="Team name"
              placeholderTextColor="#94a3b8"
              style={styles.teamInput}
            />
          </View>
        </View>

        <View style={styles.twoColGrid}>
          <FieldCard label="Position">
            <SelectRow
              value={profile.position}
              onChange={(value) =>
                setProfile((prev) => ({ ...prev, position: value }))
              }
              options={["Forward", "Defenseman"]}
            />
          </FieldCard>

          <FieldCard label="Shot">
            <SelectRow
              value={profile.handedness}
              onChange={(value) =>
                setProfile((prev) => ({ ...prev, handedness: value }))
              }
              options={["Left", "Right"]}
            />
          </FieldCard>

          <FieldCard label="Birthday">
            <TextInput
              value={profile.birthday}
              onChangeText={(value) =>
                setProfile((prev) => ({ ...prev, birthday: value }))
              }
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#94a3b8"
              style={styles.input}
            />
          </FieldCard>

          <FieldCard label="Age">
            <Text style={styles.staticValue}>{age || "—"}</Text>
          </FieldCard>

          <FieldCard label="Gender">
            <SelectRow
               value={profile.gender}
               onChange={(value) =>
                 setProfile((prev) => ({ ...prev, gender: value }))
               }
               options={["Male", "Female"]}
             />
           </FieldCard>

           <FieldCard label="Country">
             <SelectRow
               value={profile.country}
               onChange={(value) =>
                 setProfile((prev) => ({ ...prev, country: value }))
               }
               options={["Canada", "USA", "Other"]}
             />
           </FieldCard>

        </View>

        
      </View>
    </ScrollView>
  );
}

function DrillMap({
  layout,
}: {
  layout: Array<{ x: number; y: number; rx: number; ry: number }>;
}) {
  return (
    <View style={styles.mapBox}>
      {layout.map((point, index) => (
        <View
          key={index}
          style={[
            styles.mapZone,
            {
              left: `${point.x - point.rx}%`,
              top: `${point.y - point.ry}%`,
              width: `${point.rx * 2}%`,
              height: `${point.ry * 2}%`,
            },
          ]}
        />
      ))}
    </View>
  );
}

function DrillCameraScreen({
  drill,
  onBack,
}: {
  drill: { id: number; title: string };
  onBack: () => void;
}) {

  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice("front");
  const activeZones = CAMERA_OVERLAY_ZONES[drill.id] ?? CAMERA_OVERLAY_ZONES[1];
  const [heightConfirmed, setHeightConfirmed] = useState(false);
  const [setupConfirmed, setSetupConfirmed] = useState(false);
  const [fadedZones, setFadedZones] = useState(false);
  
  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission, requestPermission]);

  if (!hasPermission) {
    return (
      <SafeAreaView style={styles.centerScreen}>
        <Text style={styles.infoText}>Requesting camera permission...</Text>
      </SafeAreaView>
    );
  }

  if (device == null) {
    return (
      <SafeAreaView style={styles.centerScreen}>
        <Text style={styles.infoText}>Loading front camera...</Text>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.cameraContainer}>
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        photo={true}
        video={false}
        audio={false}
      />

      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {heightConfirmed && activeZones.map((zone, index) => (
          <View
            key={index}
            style={[
              styles.cameraZone,
              {
                left: `${zone.x - zone.rx}%`,
                top: `${zone.y - zone.ry}%`,
                width: `${zone.rx * 2}%`,
                height: `${zone.ry * 2}%`,
                borderColor: setupConfirmed ? "#22c55e" : "#ef4444",
                opacity: fadedZones ? 0.5 : 1,
              },
            ]}
          />
        ))}

        <View style={styles.cameraTopLabelWrap}>
          <Text style={styles.cameraTopLabel}>{drill.title} Setup</Text>
        </View>
      </View>

      <SafeAreaView style={styles.cameraSafeOverlay} pointerEvents="box-none">
        <View style={styles.cameraTopButtons}>
          <Pressable style={styles.ghostButtonSubtle} onPress={onBack}>
            <Text style={styles.ghostButtonTextSubtle}>Back</Text>
          </Pressable>
        </View>

          {!heightConfirmed ? (
            <View style={styles.cameraTopPanel}>
              <Text style={styles.cameraTitle}>Set phone height to 4' off the ground</Text>
              <Text style={styles.cameraSubtitle}>
                Mount your phone and adjust it until it is at the ideal camera height.
              </Text>

              <Pressable
                style={styles.confirmButton}
                onPress={() => setHeightConfirmed(true)}
              >
                <Text style={styles.confirmButtonText}>Confirm 4' Height</Text>
              </Pressable>
            </View>
          ) : !setupConfirmed ? (
            <View style={styles.cameraTopPanel}>
              <Text style={styles.cameraTitle}>
                Line up the red targets with your pylons
              </Text>
              <Text style={styles.cameraSubtitle}>
                This is the native VisionCamera front-camera preview for {drill.title}.
              </Text>

              <Pressable
                style={styles.confirmButton}
                onPress={() => {
                  setSetupConfirmed(true);
                  setTimeout(() => {
                    setFadedZones(true);
                  }, 2000);
                }}
              >
                <Text style={styles.confirmButtonText}>Confirm setup</Text>
              </Pressable>
            </View>
          ) : null}
      </SafeAreaView>
    </View>
  );
}

function DrillsPage({
  onOpenCamera,
}: {
  onOpenCamera: (drill: { id: number; title: string }) => void;
}) {
  const [expandedPreviewId, setExpandedPreviewId] = useState<number | null>(null);

  return (
    <ScrollView contentContainerStyle={styles.pageContent}>
      <View style={styles.pageHeaderRow}>
        <View>
          <Text style={styles.sectionTitle}>Select a Drill</Text>
          <Text style={styles.sectionSubtitle}>
            Claim your national rank by choosing a drill below.
          </Text>
        </View>

        <View style={styles.badge}>
          <Text style={styles.badgeText}>▶ Camera-verified training</Text>
        </View>
      </View>

      <View style={{ gap: 14 }}>
        {DRILLS.map((drill) => {
          const isExpanded = expandedPreviewId === drill.id;

          return (
            <View key={drill.id} style={styles.card}>
              <View style={styles.drillRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.drillTitle}>{drill.title}</Text>
                  <Text style={styles.drillDescription}>{drill.description}</Text>
                </View>

                <View style={styles.drillButtonsCol}>
                  <Pressable
                    style={styles.outlineButton}
                    onPress={() =>
                      setExpandedPreviewId((prev) =>
                        prev === drill.id ? null : drill.id
                      )
                    }
                  >
                    <Text style={styles.outlineButtonText}>
                      {isExpanded ? "Hide" : "Preview"}
                    </Text>
                  </Pressable>

                   <Pressable
                     style={styles.primaryButton}
                     onPress={async () => {
                       try {
                         const result = await presentARHeightCheck();

                         if (result?.confirmed) {
                           onOpenCamera({ id: drill.id, title: drill.title });
                         }
                       } catch (error) {
                         Alert.alert(
                           "Height check unavailable",
                           "Could not start the iPhone height check."
                         );
                       }
                     }}
                    >
                    <Text style={styles.primaryButtonText}>Go</Text>
                  </Pressable>
                </View>
              </View>

              {isExpanded && (
                <View style={styles.previewWrap}>
                  <Text style={styles.previewTitle}>Target Layout</Text>
                  <Text style={styles.previewSubtitle}>
                    Preview the puck placement for this drill.
                  </Text>
                  <DrillMap layout={drill.placementZones} />
                </View>
              )}
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

function RankingsPage({ profile }: { profile: typeof defaultProfile }) {
  const [ageFilter, setAgeFilter] = useState("All");
  const [genderFilter, setGenderFilter] = useState("All");
  const [drillFilter, setDrillFilter] = useState("Overall");
  const [showFilters, setShowFilters] = useState(false);
  const [showPlayerDrillTimes, setShowPlayerDrillTimes] = useState(false);

  const drillOptions = [
    "Overall",
    "Wide Sweep",
    "Straight Line",
    "Zipper",
    "Parallelogram",
    "Tight Sweep",
    "Figure Eight",
    "Triple Zero",
  ];

  const ages = [...new Set(RANKINGS.map((player) => String(player.age)))].sort(
    (a, b) => Number(a) - Number(b)
  );

  const filteredPlayers = RANKINGS.filter((player) => {
    const matchesAge = ageFilter === "All" || String(player.age) === ageFilter;
    const matchesGender =
      genderFilter === "All" || player.gender === genderFilter;
    return matchesAge && matchesGender;
  });

  const leaderboard =
    drillFilter === "Overall"
      ? [...filteredPlayers]
          .sort((a, b) => a.overallRank - b.overallRank)
          .map((player) => ({
            ...player,
            displayRank: player.overallRank,
            displayValue: String(player.overallScore),
            displayLabel: "Score",
          }))
      : [...filteredPlayers]
          .filter((player) => typeof player.drills?.[drillFilter] === "number")
          .sort((a, b) => a.drills[drillFilter] - b.drills[drillFilter])
          .map((player, index) => ({
            ...player,
            displayRank: index + 1,
            displayValue: `${player.drills[drillFilter].toFixed(2)}s`,
            displayLabel: "Time",
          }));

  const currentPlayer =
    leaderboard.find(
      (player) => player.name.toLowerCase() === profile.name.toLowerCase()
    ) ??
    (() => {
      const basePlayer =
        RANKINGS.find(
          (player) => player.name.toLowerCase() === profile.name.toLowerCase()
        ) ?? null;

      if (basePlayer) {
        return drillFilter === "Overall"
          ? {
              ...basePlayer,
              displayRank: basePlayer.overallRank,
              displayValue: String(basePlayer.overallScore),
              displayLabel: "Score",
            }
          : {
              ...basePlayer,
              displayRank: "—",
              displayValue:
                typeof basePlayer.drills?.[drillFilter] === "number"
                  ? `${basePlayer.drills[drillFilter].toFixed(2)}s`
                  : "—",
              displayLabel: "Time",
            };
      }

      return {
        name: profile.name || "Unnamed Player",
        province: profile.country || "—",
        age: calculateAgeFromBirthday(profile.birthday) || "—",
        gender: profile.gender || "—",
        displayRank: "—",
        displayValue: "—",
        displayLabel: drillFilter === "Overall" ? "Score" : "Time",
      };
    })();

  const hasActiveFilters =
    drillFilter !== "Overall" || ageFilter !== "All" || genderFilter !== "All";

  return (
    <ScrollView contentContainerStyle={styles.pageContent}>
      <View style={[styles.card, styles.playerCardHighlight]}>
        <Text style={styles.miniHeader}>Your Player Card</Text>

        <View style={styles.leaderRow}>
          <Text style={styles.rankNumber}>
            {currentPlayer.displayRank === "—"
              ? "—"
              : `#${currentPlayer.displayRank}`}
          </Text>

          <View style={{ flex: 1 }}>
            <Text style={styles.playerName}>{currentPlayer.name}</Text>
            <Text style={styles.playerMeta}>
              {currentPlayer.province} • {currentPlayer.age} • {currentPlayer.gender}
            </Text>
          </View>

          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.smallMuted}>{currentPlayer.displayLabel}</Text>
            <Text style={styles.playerValue}>{currentPlayer.displayValue}</Text>
          </View>
        </View>

        <Pressable
          onPress={() => setShowPlayerDrillTimes((prev) => !prev)}
          style={styles.linkRow}
        >
          <Text style={styles.linkRowText}>View drill times</Text>
          <Text style={styles.linkRowText}>{showPlayerDrillTimes ? "▴" : "▾"}</Text>
        </Pressable>

        {showPlayerDrillTimes && (
          <View style={{ gap: 8, marginTop: 12 }}>
            {[
              "Wide Sweep",
              "Straight Line",
              "Zipper",
              "Parallelogram",
              "Tight Sweep",
              "Figure Eight",
              "Triple Zero",
            ].map((drillName) => (
              <View key={drillName} style={styles.drillTimeRow}>
                <Text style={styles.smallMuted}>{drillName}</Text>
                <Text style={styles.drillTimeValue}>
                  {typeof currentPlayer.drills?.[drillName] === "number"
                    ? `${currentPlayer.drills[drillName].toFixed(2)}s`
                    : "—"}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={styles.card}>
        <View style={styles.rankingsHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>
              {drillFilter === "Overall"
                ? "National Rankings"
                : `${drillFilter} Rankings`}
            </Text>
            <Text style={styles.sectionSubtitle}>
              {drillFilter === "Overall"
                ? "Overall national ranking based on all core drills combined."
                : `Fastest verified times for ${drillFilter}.`}
            </Text>
          </View>

          <Pressable
            style={styles.iconButton}
            onPress={() => setShowFilters((prev) => !prev)}
          >
            <Text style={styles.iconButtonText}>☰</Text>
          </Pressable>
        </View>

        {showFilters && (
          <View style={styles.filtersBox}>
            <Text style={styles.filterLabel}>Drill</Text>
            <View style={styles.choiceWrap}>
              {drillOptions.map((option) => {
                const active = option === drillFilter;
                return (
                  <Pressable
                    key={option}
                    onPress={() => setDrillFilter(option)}
                    style={[styles.choiceButtonSmall, active && styles.choiceButtonActive]}
                  >
                    <Text
                      style={[
                        styles.choiceButtonTextSmall,
                        active && styles.choiceButtonTextActive,
                      ]}
                    >
                      {option}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={[styles.filterLabel, { marginTop: 12 }]}>Age</Text>
            <View style={styles.choiceWrap}>
              {["All", ...ages].map((option) => {
                const active = option === ageFilter;
                return (
                  <Pressable
                    key={option}
                    onPress={() => setAgeFilter(option)}
                    style={[styles.choiceButtonSmall, active && styles.choiceButtonActive]}
                  >
                    <Text
                      style={[
                        styles.choiceButtonTextSmall,
                        active && styles.choiceButtonTextActive,
                      ]}
                    >
                      {option === "All" ? "All ages" : `Age ${option}`}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={[styles.filterLabel, { marginTop: 12 }]}>Gender</Text>
            <View style={styles.choiceWrap}>
              {["All", "Male", "Female"].map((option) => {
                const active = option === genderFilter;
                return (
                  <Pressable
                    key={option}
                    onPress={() => setGenderFilter(option)}
                    style={[styles.choiceButtonSmall, active && styles.choiceButtonActive]}
                  >
                    <Text
                      style={[
                        styles.choiceButtonTextSmall,
                        active && styles.choiceButtonTextActive,
                      ]}
                    >
                      {option === "All" ? "All genders" : option}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {hasActiveFilters && (
              <Pressable
                onPress={() => {
                  setDrillFilter("Overall");
                  setAgeFilter("All");
                  setGenderFilter("All");
                }}
                style={[styles.outlineButton, { marginTop: 12, alignSelf: "flex-end" }]}
              >
                <Text style={styles.outlineButtonText}>Reset filters</Text>
              </Pressable>
            )}
          </View>
        )}

        {hasActiveFilters && (
          <View style={styles.badgesWrap}>
            <View style={styles.smallBadge}>
              <Text style={styles.smallBadgeText}>{drillFilter}</Text>
            </View>
            <View style={styles.smallBadge}>
              <Text style={styles.smallBadgeText}>
                {ageFilter === "All" ? "All ages" : `Age ${ageFilter}`}
              </Text>
            </View>
            <View style={styles.smallBadge}>
              <Text style={styles.smallBadgeText}>
                {genderFilter === "All" ? "All genders" : genderFilter}
              </Text>
            </View>
          </View>
        )}

        <View style={{ gap: 12, marginTop: 14 }}>
          {leaderboard.length > 0 ? (
            leaderboard.map((player) => {
              const isYou =
                player.name.toLowerCase() === profile.name.toLowerCase();

              return (
                <View
                  key={`${drillFilter}-${player.name}`}
                  style={[styles.leaderCard, isYou && styles.playerCardHighlight]}
                >
                  <Text style={styles.rankNumber}>#{player.displayRank}</Text>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.playerName}>{player.name}</Text>
                    <Text style={styles.playerMeta}>
                      {player.province} • {player.age} • {player.gender}
                    </Text>
                  </View>

                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={styles.smallMuted}>{player.displayLabel}</Text>
                    <Text style={styles.playerValue}>{player.displayValue}</Text>
                  </View>
                </View>
              );
            })
          ) : (
            <View style={styles.emptyBox}>
              <Text style={styles.sectionSubtitle}>
                No players match the selected filters.
              </Text>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

function OpeningAnimation({ onFinish }: { onFinish: () => void }) {
  const logoOpacity = React.useRef(new Animated.Value(0)).current;
  const logoScale = React.useRef(new Animated.Value(0.82)).current;
  const titleOpacity = React.useRef(new Animated.Value(0)).current;
  const titleTranslate = React.useRef(new Animated.Value(18)).current;
  const overlayOpacity = React.useRef(new Animated.Value(1)).current;
  const overlayTranslateY = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(logoScale, {
          toValue: 1,
          duration: 650,
          easing: Easing.out(Easing.exp),
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(titleTranslate, {
          toValue: 0,
          duration: 350,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(2200),
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 450,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(overlayTranslateY, {
          toValue: -18,
          duration: 450,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      onFinish();
    });
  }, [
    logoOpacity,
    logoScale,
    titleOpacity,
    titleTranslate,
    overlayOpacity,
    overlayTranslateY,
    onFinish,
  ]);

  return (
    <Animated.View
      style={[
        styles.openingWrap,
        {
          opacity: overlayOpacity,
          transform: [{ translateY: overlayTranslateY }],
        },
      ]}
    >
      <Animated.Image
        source={require("./assets/sn-logo.png")}
        style={[
          styles.openingLogo,
          {
            opacity: logoOpacity,
            transform: [{ scale: logoScale }],
          },
        ]}
        resizeMode="contain"
      />

      <Animated.View
        style={{
          opacity: titleOpacity,
          transform: [{ translateY: titleTranslate }],
          alignItems: "center",
        }}
      >
        <Text style={styles.openingTitle}>Stickhandling Native</Text>
        <Text style={styles.openingSubtitle}>
          The standard for elite stickhandling skills
        </Text>
      </Animated.View>

    </Animated.View>
  );
}


export default function App() {
  const [currentPage, setCurrentPage] = useState<"home" | "profile" | "drills" | "rankings">("home");
  const [showOpeningAnimation, setShowOpeningAnimation] = useState(true);
  const [profile, setProfile] = useState(defaultProfile);
  const [activeCameraDrill, setActiveCameraDrill] = useState<null | { id: number; title: string }>(null);

  return (
    <View style={{ flex: 1 }}>
      {activeCameraDrill ? (
        <DrillCameraScreen
          drill={activeCameraDrill}
          onBack={() => setActiveCameraDrill(null)}
        />
      ) : currentPage === "home" ? (
          <View style={{ flex: 1 }}>

            <Video
              source={require("./assets/your-video.mp4")}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
              repeat
              muted
            />

            <LinearGradient
              colors={[
                "rgba(0,0,0,0.55)",
                "rgba(0,0,0,0.45)",
                "rgba(0,0,0,0.55)",
              ]}
              style={StyleSheet.absoluteFill}
            />

            <SafeAreaView style={{ flex: 1 }}>
              <View style={styles.centeredHome}>
                <Header
                  currentPage={currentPage}
                  setCurrentPage={setCurrentPage}
                  isHome={true}
                />
              </View>
            </SafeAreaView>

          </View>
        ) : (
            <>
              <Header currentPage={currentPage} setCurrentPage={setCurrentPage} />

              {currentPage === "profile" && (
                <ProfilePage profile={profile} setProfile={setProfile} />
              )}

              {currentPage === "drills" && (
                <DrillsPage
                  onOpenCamera={(drill) =>
                    setActiveCameraDrill({ id: drill.id, title: drill.title })
                  }
                />
              )}

              {currentPage === "rankings" && <RankingsPage profile={profile} />}
            </>
          )}
        
      )}

      {showOpeningAnimation && (
        <OpeningAnimation onFinish={() => setShowOpeningAnimation(false)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#030712",
  },

  logo: {
    width: 90,
    height: 90,
    marginBottom: 16,
  },

  centeredHome: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },

  openingWrap: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    zIndex: 999,
  }, 

  openingLogo: {
    width: 130,
    height: 130,
    marginBottom: 26,
  },

  openingTitle: {
    color: "white",
    fontSize: 28,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: -0.8,
    textAlign: "center",
  },

  openingSubtitle: {
    color: "#94a3b8",
    fontSize: 15,
    marginTop: 8,
    textAlign: "center",
  },

  headerWrap: {
    width: "100%",
    paddingTop: 8,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
    backgroundColor: "#030712",
  },

  headerWrapHome: {
    backgroundColor: "transparent",
    borderBottomWidth: 0,
    paddingTop: 0,
    paddingBottom: 0,
    alignItems: "center",
  },
  headerTop: {
    marginBottom: 12,
  },
  headerTopHome: {
    marginBottom: 28,
    alignItems: "center",
  },
  headerTitleGroupHome: {
    alignItems: "center",
  },
  appTitle: {
    color: "white",
    fontSize: 28,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: -0.8,
  },
  appTitleHome: {
    textAlign: "center",
    fontSize: 34,
  },
  appSubtitleHome: {
    textAlign: "center",
    fontSize: 17,
    marginTop: 10,
    maxWidth: 320,
    lineHeight: 24,
    color: "#cbd5e1",
  },
  appSubtitle: {
    color: "#94a3b8",
    fontSize: 13,
    marginTop: 4,
  },
  tabsRow: {
    flexDirection: "row",
    gap: 8,
  },
  tabsColumn: {
    width: "100%",
    flexDirection: "column",
    gap: 16,
  },
  tabButton: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
  },
  homeTabButton: {
    width: "100%",
    flex: 0,
    paddingVertical: 22,
    paddingHorizontal: 20,
    borderRadius: 22,
    backgroundColor: "#0b0b0b",
    borderWidth: 1.25,
    borderColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  homeTabButtonShine: {
    position: "absolute",
    top: 10,
    left: 18,
    right: 18,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.22)",
    borderRadius: 999,
  },
  homeTabButtonActive: {
    backgroundColor: "rgba(255,255,255,0.92)",
    borderColor: "rgba(255,255,255,0.95)",
  },
  tabButtonActive: {
    backgroundColor: "#e2e8f0",
  },
  tabButtonText: {
    color: "#e2e8f0",
    fontWeight: "700",
    fontSize: 14,
  },
  homeTabButtonText: {
    fontSize: 22,
    fontWeight: "500",
    letterSpacing: -0.4,
    textTransform: "uppercase",
  },
  tabButtonTextActive: {
    color: "#111827",
  },

  pageContent: {
    padding: 16,
    paddingBottom: 28,
    gap: 16,
  },
  card: {
    backgroundColor: "#0b1220",
    borderRadius: 24,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },
  pageHeaderRow: {
    gap: 12,
  },
  sectionTitle: {
    color: "white",
    fontSize: 24,
    fontWeight: "700",
  },
  sectionSubtitle: {
    color: "#94a3b8",
    fontSize: 14,
    marginTop: 4,
  },

  badge: {
    alignSelf: "flex-start",
    backgroundColor: "#1e293b",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  badgeText: {
    color: "#e2e8f0",
    fontWeight: "700",
    fontSize: 13,
  },

  profileTopRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    marginBottom: 8,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#1e293b",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.08)",
    flexShrink: 0,
  },
  avatarText: {
    color: "white",
    fontSize: 22,
    fontWeight: "700",
  },
  nameInput: {
    color: "white",
    fontSize: 22,
    fontWeight: "700",
    paddingVertical: 0,
  },
  teamInput: {
    color: "#94a3b8",
    fontSize: 14,
    marginTop: 2,
    paddingVertical: 0,
  },
  twoColGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 14,
  },
  fieldCard: {
    width: "47%",
    backgroundColor: "#030712",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  fieldLabel: {
    color: "#94a3b8",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  staticValue: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
    paddingVertical: 6,
  },
  input: {
    color: "white",
    backgroundColor: "#111827",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    fontSize: 13,
  },
  choiceWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  choiceButton: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  choiceButtonSmall: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  choiceButtonActive: {
    backgroundColor: "#e2e8f0",
  },
  choiceButtonText: {
    color: "#e2e8f0",
    fontWeight: "700",
    fontSize: 12,
  },
  choiceButtonTextSmall: {
    color: "#e2e8f0",
    fontWeight: "700",
    fontSize: 12,
  },
  choiceButtonTextActive: {
    color: "#111827",
  },

  drillRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  drillTitle: {
    color: "white",
    fontSize: 20,
    fontWeight: "700",
  },
  drillDescription: {
    color: "#94a3b8",
    fontSize: 14,
    marginTop: 6,
  },
  drillButtonsCol: {
    flexDirection: "row",
    gap: 10,
    marginTop: 0,
    marginLeft: 12,
    alignSelf: "flex-start",
  },
  primaryButton: {
    backgroundColor: "#e2e8f0",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    color: "#111827",
    fontWeight: "800",
    fontSize: 14,
  },
  outlineButton: {
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  outlineButtonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 14,
  },
  previewWrap: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
  },
  previewTitle: {
    color: "white",
    fontWeight: "700",
    fontSize: 14,
  },
  previewSubtitle: {
    color: "#94a3b8",
    fontSize: 13,
    marginTop: 4,
    marginBottom: 12,
  },

  mapBox: {
    height: 250,
    borderRadius: 20,
    backgroundColor: "#030712",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
    position: "relative",
  },
  mapZone: {
    position: "absolute",
    borderRadius: 999,
    borderWidth: 2,
    borderColor: "rgba(239,68,68,1)",
    backgroundColor: "rgba(239,68,68,0.14)",
  },

  miniHeader: {
    color: "#94a3b8",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  playerCardHighlight: {
    borderColor: "rgba(96,165,250,0.6)",
    backgroundColor: "#111c31",
  },
  leaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  rankNumber: {
    color: "white",
    fontWeight: "800",
    fontSize: 28,
    width: 64,
  },
  playerName: {
    color: "white",
    fontWeight: "700",
    fontSize: 16,
  },
  playerMeta: {
    color: "#94a3b8",
    fontSize: 13,
    marginTop: 4,
  },
  playerValue: {
    color: "white",
    fontWeight: "700",
    fontSize: 16,
  },
  smallMuted: {
    color: "#94a3b8",
    fontSize: 12,
  },
  linkRow: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  linkRowText: {
    color: "#cbd5e1",
    fontSize: 14,
  },
  drillTimeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#0b1220",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  drillTimeValue: {
    color: "white",
    fontWeight: "700",
    fontSize: 13,
  },

  rankingsHeader: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
  iconButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
  filtersBox: {
    marginTop: 14,
    borderRadius: 18,
    backgroundColor: "#0b1220",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    padding: 12,
  },
  filterLabel: {
    color: "#cbd5e1",
    fontWeight: "700",
    marginBottom: 8,
  },
  badgesWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 14,
  },
  smallBadge: {
    backgroundColor: "#1e293b",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  smallBadgeText: {
    color: "#e2e8f0",
    fontWeight: "700",
    fontSize: 12,
  },
  leaderCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "#0b1220",
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  emptyBox: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "#0f172a",
    padding: 20,
    alignItems: "center",
  },

  centerScreen: {
    flex: 1,
    backgroundColor: "black",
    alignItems: "center",
    justifyContent: "center",
  },
  infoText: {
    color: "white",
    fontSize: 16,
  },

  cameraContainer: {
    flex: 1,
    backgroundColor: "black",
  },
  cameraZone: {
    position: "absolute",
    borderWidth: 2,
    borderColor: "rgba(255,59,48,1)",
    backgroundColor: "rgba(255,59,48,0.18)",
    borderRadius: 999,
  },
  cameraSafeOverlay: {
    flex: 1,
  },
  cameraTopLabelWrap: {
    position: "absolute",
    top: "6%",
    left: 0,
    right: 0,
    alignItems: "center",
  },
  cameraTopLabel: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
    backgroundColor: "rgba(0,0,0,0.35)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
    cameraTopButtons: {
    position: "absolute",
    top: 46,
    left: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "flex-start",
  },
  ghostButtonSubtle: {
    backgroundColor: "rgba(0,0,0,0.28)",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  ghostButtonTextSubtle: {
    color: "rgba(255,255,255,0.88)",
    fontWeight: "600",
    fontSize: 14,
  },
  cameraTopPanel: {
    position: "absolute",
    left: 16,
    right: 16,
    top: 104,
    backgroundColor: "rgba(0,0,0,0.62)",
    borderRadius: 18,
    padding: 16,
  },
  cameraTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
  },
  cameraSubtitle: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    marginTop: 6,
    marginBottom: 14,
  },
  confirmButton: {
    backgroundColor: "white",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "black",
  },
});
