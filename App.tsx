import React, { useEffect, useMemo, useState } from "react";
import Video from "react-native-video";
import AsyncStorage from "@react-native-async-storage/async-storage";
import PracticeWideSweepScreen from "./src/screens/PracticeWideSweepScreen";
import PracticeStraightLineScreen from "./src/screens/PracticeStraightLineScreen";
import PracticeZipperScreen from "./src/screens/PracticeZipperScreen";
import PracticeParallelogramScreen from "./src/screens/PracticeParallelogramScreen";
import PracticeFigureEightScreen from "./src/screens/PracticeFigureEightScreen";
import { BlurView } from "@react-native-community/blur";
import { accelerometer, setUpdateIntervalForType, SensorTypes } from "react-native-sensors";
import { map } from "rxjs/operators";
import { Picker } from "@react-native-picker/picker";
import { Swipeable } from "react-native-gesture-handler";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import {
  Alert,
  Animated,
  Easing,
  Image,
  Modal,
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
  useFrameProcessor,
} from "react-native-vision-camera";
import { Worklets } from "react-native-worklets-core";
import {
  detectYellowZones,
  type YellowZoneDetectorResult,
} from "./src/tracking/yellowZoneDetector";

const defaultProfile = {
  name: "",
  birthday: "",
  position: "",
  handedness: "",
  gender: "",
  country: "",
  team: "",
};

const DRILLS = [
  {
    id: 1,
    title: "Wide Sweep",
    difficulty: "Beginner",
    placementZones: [
      { x: 44.0, y: 48.0, rx: 3.8, ry: 3.1 }, // top
      { x: 69.0, y: 55.5, rx: 3.8, ry: 3.1 }, // upper-right
      { x: 39.0, y: 62.0, rx: 4.0, ry: 3.3 }, // mid-left
      { x: 69.0, y: 73.5, rx: 4.0, ry: 3.3 }, // lower-right
      { x: 39.0, y: 84.0, rx: 4.3, ry: 3.5 }, // bottom-left
    ],
    description: "5-Puck Drill",

    startZone:  { x: 46.0, y: 38.5, rx: 13.5, ry: 5.5 },
    finishZone: { x: 55.0, y: 93.5, rx: 13.5, ry: 5.5 },
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

    // 🔥 ADD THESE
    startZone: { x: 50, y: 34, rx: 14, ry: 5 },
    finishZone: { x: 50, y: 90, rx: 14, ry: 5 },
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

    startZone: { x: 25, y: 42, rx: 13, ry: 5 },
    finishZone: { x: 25, y: 88, rx: 13, ry: 5 },
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

    startZone: { x: 79, y: 43, rx: 13, ry: 5 },
    finishZone: { x: 37, y: 91, rx: 13, ry: 5 },
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
    
    startZone:  { x: 27, y: 63.5, rx: 13, ry: 5 },
    finishZone: { x: 80, y: 63.5, rx: 13, ry: 5 },
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
      "Figure Eight": 18.42,
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
      "Figure Eight": 18.88,
  
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
      "Figure Eight": 19.05,
 
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
      "Figure Eight": 19.42,
   
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
      "Figure Eight": 19.86,
    
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
      "Figure Eight": 20.11,
    
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
      "Figure Eight": 20.34,
  
    },
  },
];

const CAMERA_OVERLAY_ZONES: Record<number, Array<{ x: number; y: number; rx: number; ry: number }>> = {
  1: [
    { x: 44.0, y: 48.0, rx: 3.8, ry: 3.1 },
    { x: 69.0, y: 55.5, rx: 3.8, ry: 3.1 },
    { x: 29.0, y: 62.0, rx: 4.0, ry: 3.3 },
    { x: 69.0, y: 73.5, rx: 4.0, ry: 3.3 },
    { x: 29.0, y: 84.0, rx: 4.3, ry: 3.5 },
  ],
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
    { x: 38.5, y: 52.5, rx: 4.5, ry: 3.8 }, // top-left
    { x: 74.0, y: 57.5, rx: 4.5, ry: 3.8 }, // top-right
    { x: 16.5, y: 71.0, rx: 5.0, ry: 4.2 }, // bottom-left
    { x: 63.0, y: 77.5, rx: 5.2, ry: 4.4 }, // bottom-right
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
    { x: 50.0, y: 50.0, rx: 4.0, ry: 3.3 }, // top pylon
    { x: 50.0, y: 78.0, rx: 5.2, ry: 4.4 }, // bottom pylon
  ],

};

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function parseBirthdayParts(birthday: string) {
  const parts = birthday.split("-");
  if (parts.length !== 3) {
    return { year: 2000, month: 1, day: 1 };
  }

  const [yearStr, monthStr, dayStr] = parts;
  const year = Number(yearStr) || 2000;
  const month = Number(monthStr) || 1;
  const day = Number(dayStr) || 1;

  return { year, month, day };
}

function toBirthdayString(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function calculateAgeFromBirthday(birthday: string) {
  if (!birthday) return "";

  const parts = birthday.split("-");
  if (parts.length !== 3) return "";

  const [yearStr, monthStr, dayStr] = parts;
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);

  if (!year || !month || !day) return "";

  const today = new Date();
  let age = today.getFullYear() - year;

  const hasHadBirthdayThisYear =
    today.getMonth() + 1 > month ||
    (today.getMonth() + 1 === month && today.getDate() >= day);

  if (!hasHadBirthdayThisYear) age -= 1;

  return age >= 0 ? String(age) : "";
}

function formatBirthdayDisplay(birthday: string) {
  if (!birthday) return "";

  const parts = birthday.split("-");
  if (parts.length !== 3) return birthday;

  const [yyyy, mm, dd] = parts;

  if (!yyyy || !mm || !dd) return birthday;

  return `${mm}/${dd}/${yyyy}`;
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
    { key: "drills", label: "Play", icon: "" },
    { key: "rankings", label: "Rankings", icon: "" },
  ];

  return (
    <View style={[styles.headerWrap, isHome && styles.headerWrapHome]}>
      {!isHome && (
        <BlurView
          style={StyleSheet.absoluteFill}
          blurType="dark"
          blurAmount={0}
        />
      )}

      <View style={[styles.headerTop, isHome && styles.headerTopHome]}>
        <View style={isHome && styles.headerTitleGroupHome}>
          

          <View style={{ width: "100%", alignItems: "center" }}>
            <Image
              source={
                isHome
                  ? require("./assets/hockeynativelogo.png")
                  : require("./assets/logo2.png")
              }
              style={isHome ? { width: 320, height: 80 } : { width: 275, height: 63 }}
              resizeMode="contain"
            />
          </View>

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
      <View style={{ marginTop: 4 }}>{children}</View>
    </View>
  );
}

function SelectRow({
  options,
  value,
  onChange,
  disabled = false,
}: {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  // VIEW MODE
  if (disabled) {
    return <Text style={styles.staticValue}>{value || "—"}</Text>;
  }

  // EDIT MODE
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
            <Text
              style={[
                styles.choiceButtonText,
                active && styles.choiceButtonTextActive,
              ]}
            >
              {option}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function BirthdayPickerModal({
  visible,
  initialBirthday,
  onClose,
  onSave,
}: {
  visible: boolean;
  initialBirthday: string;
  onClose: () => void;
  onSave: (birthday: string) => void;
}) {
  const initial = parseBirthdayParts(initialBirthday);
  const currentYear = new Date().getFullYear();

  const [month, setMonth] = useState(initial.month);
  const [day, setDay] = useState(initial.day);
  const [year, setYear] = useState(initial.year);

  useEffect(() => {
    if (visible) {
      const next = parseBirthdayParts(initialBirthday);
      setMonth(next.month);
      setDay(next.day);
      setYear(next.year);
    }
  }, [visible, initialBirthday]);

  useEffect(() => {
    const maxDay = getDaysInMonth(year, month);
    if (day > maxDay) {
      setDay(maxDay);
    }
  }, [year, month, day]);

  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];

  const days = Array.from(
    { length: getDaysInMonth(year, month) },
    (_, i) => i + 1
  );

  const years = Array.from(
    { length: currentYear - 1900 + 1 },
    (_, i) => currentYear - i
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.birthdayModalOverlay}>
        <View style={styles.birthdayModalCard}>
          <Text style={styles.birthdayModalTitle}>Select Birthday</Text>

          <View style={styles.birthdayWheelsRow}>
            <View style={styles.birthdayWheelCol}>
              <Text style={styles.birthdayWheelLabel}>Month</Text>
              <Picker
                selectedValue={month}
                onValueChange={(value) => setMonth(Number(value))}
                style={styles.birthdayPicker}
                itemStyle={styles.birthdayPickerItem}
              >
                {months.map((label, index) => (
                  <Picker.Item key={label} label={label} value={index + 1} />
                ))}
              </Picker>
            </View>

            <View style={styles.birthdayWheelCol}>
              <Text style={styles.birthdayWheelLabel}>Day</Text>
              <Picker
                selectedValue={day}
                onValueChange={(value) => setDay(Number(value))}
                style={styles.birthdayPicker}
                itemStyle={styles.birthdayPickerItem}
              >
                {days.map((value) => (
                  <Picker.Item key={value} label={String(value)} value={value} />
                ))}
              </Picker>
            </View>

            <View style={styles.birthdayWheelCol}>
              <Text style={styles.birthdayWheelLabel}>Year</Text>
              <Picker
                selectedValue={year}
                onValueChange={(value) => setYear(Number(value))}
                style={styles.birthdayPicker}
                itemStyle={styles.birthdayPickerItem}
              >
                {years.map((value) => (
                  <Picker.Item key={value} label={String(value)} value={value} />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.birthdayModalButtons}>
            <Pressable style={styles.birthdayModalCancel} onPress={onClose}>
              <Text style={styles.birthdayModalCancelText}>Cancel</Text>
            </Pressable>

            <Pressable
              style={styles.birthdayModalSave}
              onPress={() => onSave(toBirthdayString(year, month, day))}
            >
              <Text style={styles.birthdayModalSaveText}>Done</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function ProfilePage({
  profile,
  setProfile,
  onOpenUsage,
}: {
  profile: typeof defaultProfile;
  setProfile: React.Dispatch<React.SetStateAction<typeof defaultProfile>>;
  onOpenUsage: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const age = calculateAgeFromBirthday(profile.birthday);
  const [showBirthdayModal, setShowBirthdayModal] = useState(false);

  const initials = profile.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2);

  return (
    <ScrollView contentContainerStyle={styles.pageContent}>
      <View style={styles.card}>
        <Pressable
          onPress={() => setIsEditing((prev) => !prev)}
          style={styles.editIconButton}
        >
          <Text style={styles.editIconText}>
            {isEditing ? "Save" : "Edit"}
          </Text>
        </Pressable>
        
        <View style={styles.profileTopRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials || ""}</Text>
          </View>

          <View style={{ flex: 1 }}>
            <TextInput
              value={profile.name}
              onChangeText={(value) =>
                setProfile((prev) => ({ ...prev, name: value }))
              }
              editable={isEditing}
              placeholder="Athlete name"
              placeholderTextColor="#94a3b8"
              style={styles.nameInput}
            />

            <TextInput
              value={profile.team}
              onChangeText={(value) =>
                setProfile((prev) => ({ ...prev, team: value }))
              }
              editable={isEditing}
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
              disabled={!isEditing}
            />
          </FieldCard>

          <FieldCard label="Shot">
            <SelectRow
              value={profile.handedness}
              onChange={(value) =>
                setProfile((prev) => ({ ...prev, handedness: value }))
              }
              options={["Left", "Right"]}
              disabled={!isEditing}
            />
          </FieldCard>

          <FieldCard label="Birthday">
            {isEditing ? (
              <>
                <Pressable
                  onPress={() => setShowBirthdayModal(true)}
                  style={styles.birthdayTrigger}
                >
                  <Text style={styles.birthdayTriggerText}>
                    {profile.birthday ? formatBirthdayDisplay(profile.birthday) : "Select birthday"}
                  </Text>
                </Pressable>

                <BirthdayPickerModal
                  visible={showBirthdayModal}
                  initialBirthday={profile.birthday}
                  onClose={() => setShowBirthdayModal(false)}
                  onSave={(birthday) => {
                    setProfile((prev) => ({ ...prev, birthday }));
                    setShowBirthdayModal(false);
                  }}
                />
              </>
            ) : (
              <Text style={styles.staticValue}>
                {profile.birthday ? formatBirthdayDisplay(profile.birthday) : "—"}
              </Text>
            )}
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
               disabled={!isEditing}
             />
           </FieldCard>

           <FieldCard label="Country">
             <SelectRow
               value={profile.country}
               onChange={(value) =>
                 setProfile((prev) => ({ ...prev, country: value }))
               }
               options={["Canada", "USA", "Other"]}
               disabled={!isEditing}
             />
           </FieldCard>

        </View>
        <Pressable
          style={[styles.outlineButton, { marginTop: 16 }]}
          onPress={onOpenUsage}
        >
          <Text style={styles.outlineButtonText}>View Practice History</Text>
        </Pressable>
        
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
  savedBestTimeMs,
  onSaveBestTime,
  onCompleteRun,
}: {
  drill: { id: number; title: DrillName };
  onBack: () => void;
  savedBestTimeMs: number | null;
  onSaveBestTime: (timeMs: number) => void;
  onCompleteRun: (entry: UsageEntry) => void;
}) {
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice("front");
  const cameraRef = React.useRef<Camera>(null);

  const drillConfig = DRILLS.find((d) => d.id === drill.id);
  const startZone = drillConfig?.startZone ?? null;
  const finishZone = drillConfig?.finishZone ?? null;

  const TARGET_ANGLE = 37;
  const ANGLE_TOLERANCE = 2;
  const [phoneAngle, setPhoneAngle] = useState(0);

  const isAngleGood =
    phoneAngle >= TARGET_ANGLE - ANGLE_TOLERANCE &&
    phoneAngle <= TARGET_ANGLE + ANGLE_TOLERANCE;

  const setupZones = CAMERA_OVERLAY_ZONES[drill.id] ?? [];

  const [pendingRun, setPendingRun] = useState<{
    timeMs: number;
    videoUri: string | null;
  } | null>(null);

  const yellowHsv = React.useMemo(
    () => ({
      hMin: 22,
      hMax: 45,
      sMin: 160,
      sMax: 255,
      vMin: 120,
      vMax: 255,
    }),
    []
  );


  // =========================
  // STATE MACHINE
  // =========================
  type Phase =
    | "height"
    | "angle"
    | "setup"
    | "waiting_for_start"
    | "countdown"
    | "ready_in_start"
    | "running"
    | "finished";

  const [phase, setPhase] = useState<Phase>("height");
  const [statusText, setStatusText] = useState("Confirm camera height to begin");

  const startZonePulseScale = React.useRef(new Animated.Value(1)).current;
  const startZonePulseOpacity = React.useRef(new Animated.Value(1)).current;

  const shouldPulseStartZone =
    phase === "waiting_for_start" || phase === "ready_in_start";

  useEffect(() => {
    let animation: Animated.CompositeAnimation | null = null;

    if (shouldPulseStartZone) {
      animation = Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(startZonePulseScale, {
              toValue: 1.16,
              duration: 260,
              useNativeDriver: true,
            }),
            Animated.timing(startZonePulseScale, {
              toValue: 1,
              duration: 260,
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(startZonePulseOpacity, {
              toValue: 0.55,
              duration: 260,
              useNativeDriver: true,
            }),
            Animated.timing(startZonePulseOpacity, {
              toValue: 1,
              duration: 260,
              useNativeDriver: true,
            }),
          ]),
        ])
      );

      animation.start();
    } else {
      startZonePulseScale.stopAnimation();
      startZonePulseOpacity.stopAnimation();
      startZonePulseScale.setValue(1);
      startZonePulseOpacity.setValue(1);
    }

    return () => {
      if (animation) animation.stop();
    };
  }, [shouldPulseStartZone, startZonePulseScale, startZonePulseOpacity]);

  const [countdown, setCountdown] = useState<number | null>(null);
  const countdownIntervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);


  // =========================
  // TIMER
  // =========================
  const [elapsedMs, setElapsedMs] = useState(0);
  const [bestTimeMs, setBestTimeMs] = useState<number | null>(savedBestTimeMs);
  useEffect(() => {
    setBestTimeMs(savedBestTimeMs);
  }, [savedBestTimeMs, drill.id]);
  
  const [bestVideoUri, setBestVideoUri] = useState<string | null>(null);

  const startTimeRef = React.useRef<number | null>(null);
  const timerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const stopTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // =========================
  // RECORDING
  // =========================
  const [recording, setRecording] = useState(false);
  const [lastVideoUri, setLastVideoUri] = useState<string | null>(null);
  const recordingResultResolverRef = React.useRef<((path: string | null) => void) | null>(null);
  const lastVideoUriRef = React.useRef<string | null>(null);

  // =========================
// CAMERA ZONE SIGNAL
// =========================
const [zoneSignal, setZoneSignal] = useState<YellowZoneDetectorResult>({
  startPresent: false,
  finishPresent: false,
  moving: false,
  confidence: 0,
  pixelFormat: 0,
});

const prevStartRef = React.useRef(false);
const prevFinishRef = React.useRef(false);

const inStart = zoneSignal.startPresent;
const inFinish = zoneSignal.finishPresent;

const moving = zoneSignal.moving;

const wasInStart = prevStartRef.current;
const wasInFinish = prevFinishRef.current;

const enteredStart = !wasInStart && inStart;
const leftStart = wasInStart && !inStart;

const enteredFinish = !wasInFinish && inFinish;
const leftFinish = wasInFinish && !inFinish;

const startDwellTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
const finishDwellTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
const returnToStartTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

const startExitTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

const updateZoneSignal = React.useCallback((result: YellowZoneDetectorResult) => {
  setZoneSignal(result);
}, []);

const onZoneSignalWorklet = Worklets.createRunOnJS(updateZoneSignal);

const frameProcessor = useFrameProcessor(
  (frame) => {
    "worklet";

    if (startZone == null || finishZone == null) return;

    const result = detectYellowZones(frame, {
      startZone,
      finishZone,
      hsv: yellowHsv,
    });

    onZoneSignalWorklet(result);
  },
  [startZone, finishZone]
);

useEffect(() => {
  let subscription: { unsubscribe: () => void } | null = null;

  if (phase === "angle") {
    setUpdateIntervalForType(SensorTypes.accelerometer, 150);

    subscription = accelerometer
      .pipe(
        map(({ y, z }) => {
          const radians = Math.atan2(z, Math.abs(y));
          return Math.round((radians * 180) / Math.PI);
        })
      )
      .subscribe((angle) => {
        setPhoneAngle((prev) => Math.round(prev * 0.7 + angle * 0.3));
      });
  }

  return () => {
    subscription?.unsubscribe();
  };
}, [phase]);

  const startTimer = () => {
    startTimeRef.current = Date.now();
    setElapsedMs(0);

    timerRef.current = setInterval(() => {
      if (startTimeRef.current) {
        setElapsedMs(Date.now() - startTimeRef.current);
      }
    }, 16);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startRecording = () => {
    if (!cameraRef.current || recording) return;

    setRecording(true);

    cameraRef.current.startRecording({
      onRecordingFinished: (video) => {
        const path = video.path ? `file://${video.path}` : null;
        lastVideoUriRef.current = path;
        setLastVideoUri(path);
        setRecording(false);

        if (recordingResultResolverRef.current) {
          recordingResultResolverRef.current(path);
          recordingResultResolverRef.current = null;
        }
      },
      onRecordingError: () => {
        setRecording(false);

        if (recordingResultResolverRef.current) {
          recordingResultResolverRef.current(null);
          recordingResultResolverRef.current = null;
        }
      },
    });
  };

  const stopRecording = async () => {
    if (!recording) return lastVideoUriRef.current;

    return await new Promise<string | null>(async (resolve) => {
      recordingResultResolverRef.current = resolve;

      try {
        await cameraRef.current?.stopRecording();
      } catch {
        recordingResultResolverRef.current = null;
        setRecording(false);
        resolve(null);
      }
    });
  };

  const clearAllTimeouts = () => {
    if (startDwellTimeoutRef.current) {
      clearTimeout(startDwellTimeoutRef.current);
      startDwellTimeoutRef.current = null;
    }
    if (startExitTimeoutRef.current) {
      clearTimeout(startExitTimeoutRef.current);
      startExitTimeoutRef.current = null;
    }
    if (finishDwellTimeoutRef.current) {
      clearTimeout(finishDwellTimeoutRef.current);
      finishDwellTimeoutRef.current = null;
    }
    if (stopTimeoutRef.current) {
      clearTimeout(stopTimeoutRef.current);
      stopTimeoutRef.current = null;
    }
    if (returnToStartTimeoutRef.current) {
      clearTimeout(returnToStartTimeoutRef.current);
      returnToStartTimeoutRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  };

  const startCountdown = () => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }

    let value = 3;
    setCountdown(3);

    countdownIntervalRef.current = setInterval(() => {
      value -= 1;

      if (value >= 0) {
        setCountdown(value);
      }

      if (value < 0) {
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
        }

        setCountdown(null);
        setPhase("ready_in_start");
        setStatusText("Leave start zone to begin");
      }
    }, 1000);
  };



  const resetRun = async () => {
    clearAllTimeouts();

    if (recording) {
      await stopRecording();
    }

    stopTimer();
    setLastVideoUri(null);
    lastVideoUriRef.current = null;
    startTimeRef.current = null;
    prevStartRef.current = false;
    prevFinishRef.current = false;
    setCountdown(null);
    setElapsedMs(0);
    setPhase("waiting_for_start");
    setStatusText("Place yellow puck in start zone");
  };

  const discardRun = async () => {
    clearAllTimeouts();

    if (recording) {
      await stopRecording();
    }

    stopTimer();

    setPendingRun(null);
    setLastVideoUri(null);
    lastVideoUriRef.current = null;
    startTimeRef.current = null;

    setElapsedMs(0);
    setPhase("waiting_for_start");
    setStatusText("Place yellow puck in start zone");
  };

  const saveAndResetRun = async () => {
    if (pendingRun) {
      const { timeMs, videoUri } = pendingRun;

      if (bestTimeMs === null || timeMs < bestTimeMs) {
        setBestTimeMs(timeMs);
        onSaveBestTime(timeMs);
        if (videoUri) setBestVideoUri(videoUri);
      }

      onCompleteRun({
        id: `${drill.title}-${Date.now()}`,
        drill: drill.title,
        timeMs,
        completedAt: new Date().toISOString(),
        videoUri,
      });
    }

    setPendingRun(null);
    await resetRun();
  };

  const finishRun = async () => {
    stopTimer();
    const total = elapsedMs;

    const uri = await stopRecording();

    setElapsedMs(total);
    setPendingRun({
      timeMs: total,
      videoUri: uri,
    });
    setPhase("finished");
    setStatusText(`Finished ${(total / 1000).toFixed(2)}s`);
  };

  // =========================
  // MAIN RUN LOGIC
  // =========================
  useEffect(() => {
    if (phase === "waiting_for_start") {
      if (inStart) {
        if (!startDwellTimeoutRef.current) {
          startDwellTimeoutRef.current = setTimeout(() => {
            startDwellTimeoutRef.current = null;
            setPhase("countdown");
            setStatusText("Get Ready...");
            startCountdown();
          }, 350);
        }
      } else {
        if (startDwellTimeoutRef.current) {
          clearTimeout(startDwellTimeoutRef.current);
          startDwellTimeoutRef.current = null;
        }
      }
    }

    if (phase === "countdown") {
      if (!inStart) {
        clearAllTimeouts();
        setCountdown(null);
        setPhase("waiting_for_start");
        setStatusText("Place yellow puck in start zone");
      }

      // 🎯 Start recording at "1"
      if (countdown === 1 && !recording) {
        startRecording();
      }
    }

    if (phase === "ready_in_start") {
      if (leftStart) {
        console.log("START TRIGGERED");

        clearAllTimeouts();
        setLastVideoUri(null);

        startTimer();
        lastVideoUriRef.current = null;
        setPhase("running");
        setStatusText("Running...");
      }
    }

    if (phase === "running") {
      if (inStart) {
        if (!returnToStartTimeoutRef.current) {
          returnToStartTimeoutRef.current = setTimeout(() => {
            resetRun();
            returnToStartTimeoutRef.current = null;
          }, 500);
        }
      } else if (returnToStartTimeoutRef.current) {
        clearTimeout(returnToStartTimeoutRef.current);
        returnToStartTimeoutRef.current = null;
      }

      if (enteredFinish) {
        if (!finishDwellTimeoutRef.current) {
          const finalTime = Date.now() - (startTimeRef.current ?? Date.now());

          stopTimer();
          setElapsedMs(finalTime);

          finishDwellTimeoutRef.current = setTimeout(() => {
            finishDwellTimeoutRef.current = null;
            finishRun();
          }, 500);
        }
      }
    }

    prevStartRef.current = inStart;
    prevFinishRef.current = inFinish;
 } , [phase, inStart, inFinish, recording, countdown]);

  // =========================
  // PERMISSION
  // =========================
  useEffect(() => {
    if (!hasPermission) requestPermission();

    return () => {
      clearAllTimeouts();
    };
  }, [hasPermission, requestPermission]);

  if (!hasPermission || !device) {
    return (
      <SafeAreaView style={styles.centerScreen}>
        <Text style={styles.infoText}>Loading camera...</Text>
      </SafeAreaView>
    );
  }

  // =========================
  // UI
  // =========================
  const showDebug = false;
  
  return (
    <View style={styles.cameraContainer}>
      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive
        video={true}
        photo={false}
        audio={false}
        frameProcessor={frameProcessor}
        frameProcessorFps={5}
      />

      {(phase === "setup" || phase === "finished") &&
        setupZones.map((zone, index) => (
          <View
            key={`setup-${index}`}
            style={[
              styles.cameraZone,
              {
                left: `${zone.x - zone.rx}%`,
                top: `${zone.y - zone.ry}%`,
                width: `${zone.rx * 2}%`,
                height: `${zone.ry * 2}%`,
                borderColor: "#eab308",
                borderWidth: 6,
                backgroundColor: "rgba(234,179,8,0.22)",
              },
            ]}
          />
        ))}

      {/* START ZONE */}
      {startZone && phase !== "height" && phase !== "angle" && phase !== "setup" && (
        <Animated.View
          style={[
           styles.cameraZone,
            {
              left: `${startZone.x - startZone.rx}%`,
              top: `${startZone.y - startZone.ry}%`,
              width: `${startZone.rx * 2}%`,
              height: `${startZone.ry * 2}%`,
              borderColor: "#ef4444",
              borderWidth: shouldPulseStartZone ? 6 : 4,
              backgroundColor: shouldPulseStartZone
                ? "rgba(239,68,68,0.22)"
                : "rgba(239,68,68,0.10)",
              opacity: shouldPulseStartZone ? startZonePulseOpacity : 1,
              transform: [
                {
                  scale: shouldPulseStartZone ? startZonePulseScale : 1,
                },
              ],
           },
          ]}
        />
      )}

      {/* FINISH ZONE */}
      {finishZone && phase !== "height" && phase !== "angle" && phase !== "setup" && (
        <View
          style={[
            styles.cameraZone,
            {
              left: `${finishZone.x - finishZone.rx}%`,
              top: `${finishZone.y - finishZone.ry}%`,
              width: `${finishZone.rx * 2}%`,
              height: `${finishZone.ry * 2}%`,
              borderColor: "#22c55e",
              borderWidth: 6,
              backgroundColor: "rgba(34,197,94,0.22)",
            },
          ]}
        />
      )}

      <SafeAreaView style={styles.cameraSafeOverlay} pointerEvents="box-none">

        {countdown !== null && (
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              style={{
                color: "#ffffff",
                fontSize: 110,
                fontWeight: "900",
                textAlign: "center",
              }}
            >
              {countdown === 0 ? "GO!" : countdown}
            </Text>
          </View>
        )}

        {/* BACK BUTTON */}
        <View style={styles.cameraTopButtons}>
          <Pressable style={styles.ghostButtonSubtle} onPress={onBack}>
            <Text style={styles.ghostButtonTextSubtle}>Back</Text>
          </Pressable>
        </View>

        {/* MAIN PANEL */}
        <View style={styles.cameraTopPanel}>
          <Text
            style={[
              styles.cameraTitle,
              phase === "finished" && { textAlign: "center" },
            ]}
          >
            {phase === "height"
              ? "Set Tripod Height to 4 Feet"
              : phase === "angle"
              ? "Confirm Camera Angle"
              : phase === "setup"
              ? "Place Pucks for Drill Setup"
              : phase === "countdown"
              ? "Countdown"
              : phase === "finished"
              ? "Run Complete"
              : "Place Puck in Start Zone"}
          </Text>

          <Text
            style={[
              styles.cameraSubtitle,
              phase === "finished" && { textAlign: "center" },
            ]}
          >
            {phase === "finished"
              ? bestTimeMs !== null
                ? `Best Time: ${(bestTimeMs / 1000).toFixed(2)}s`
                : "No best time yet"
              : phase === "height"
              ? "Position your phone on a tripod set to 4 feet high with the front (selfie) camera facing you to begin."
              : phase === "angle"
              ? "Tilt the phone downward until the live angle turns green at around 37°."
              : phase === "setup"
              ? "Use pucks as drill markers. Place each puck inside each yellow marker to begin. Press confirm when all pucks are placed inside each yellow outline."
              : statusText}
          </Text>
          {phase === "height" && (
            <Image
              source={require("./assets/tripodheightguide.png")}
              style={styles.heightGuideImage}
              resizeMode="contain"
            />
          )}
          {phase === "angle" && (
            <View style={{ alignItems: "center", marginTop: 30, marginBottom: 30 }}>
              <Text
                style={{
                  fontSize: 64,
                  fontWeight: "900",
                  color: isAngleGood ? "#22c55e" : "#ffffff",
                }}
              >
                {phoneAngle}°
              </Text>

              <Text
                style={{
                  marginTop: 8,
                  fontSize: 18,
                  color: isAngleGood ? "#22c55e" : "#cbd5e1",
                }}
              >
                Target: {TARGET_ANGLE}°
              </Text>
            </View>
          )}
        {showDebug && (
          <View style={styles.cameraDebugReadout}>
            <Text style={styles.cameraDebugLine}>
              Start: {inStart ? "YES" : "NO"}
            </Text>
            <Text style={styles.cameraDebugLine}>
              Finish: {inFinish ? "YES" : "NO"}
            </Text>
            <Text style={styles.cameraDebugLine}>
              Moving: {moving ? "YES" : "NO"}
            </Text>
            <Text style={styles.cameraDebugLine}>
              Confidence: {zoneSignal.confidence.toFixed(3)}
            </Text>
            <Text style={styles.cameraDebugLine}>
              PixelFormat: {zoneSignal.pixelFormat ?? 0}
            </Text>
          </View>
         )}
          {(phase === "countdown" || phase === "ready_in_start" || phase === "running" || phase === "finished") && (
            <Text style={styles.cameraRunTimer}>
              {(elapsedMs / 1000).toFixed(2)}s
            </Text>
          )}

          {bestTimeMs !== null &&
            phase !== "height" &&
            phase !== "angle" &&
            phase !== "setup" &&
            phase !== "finished" && (
              <Text style={styles.cameraBestText}>
                Best: {(bestTimeMs / 1000).toFixed(2)}s
              </Text>
          )}

          {/* BUTTONS */}
          {phase === "height" && (
            <Pressable
              style={styles.confirmButton}
              onPress={() => setPhase("angle")}
            >
              <Text style={styles.confirmButtonText}>Confirm Camera Height</Text>
            </Pressable>
          )}

          {phase === "angle" && (
            <Pressable
              style={[styles.confirmButton, !isAngleGood && { opacity: 0.5 }]}
              disabled={!isAngleGood}
              onPress={() => setPhase("setup")}
            >
              <Text style={styles.confirmButtonText}>Confirm Camera Angle</Text>
            </Pressable>
          )}

          {phase === "setup" && (
            <Pressable
              style={styles.confirmButton}
              onPress={() => {
                setPhase("waiting_for_start");
                setStatusText("Place puck in red zone to begin timer. Drill clock will end upon reaching green finish zone.");
              }}
            >
              <Text style={styles.confirmButtonText}>Confirm Setup</Text>
            </Pressable>
          )}

          {phase === "finished" && (
            <View style={styles.finishedRow}>
    
              {/* LEFT SIDE */}
              <View style={styles.finishedLeft}>
                <Text style={styles.cameraTitleCentered}>
                  Run Complete
                </Text>

                <Text style={styles.cameraSubtitleCentered}>
                  {bestTimeMs !== null
                    ? `Best Time: ${(bestTimeMs / 1000).toFixed(2)}s`
                    : "No best time yet"}
                </Text>

                <Text style={styles.finishedTime}>
                  {(elapsedMs / 1000).toFixed(2)}s
                </Text>
              </View>

              {/* RIGHT SIDE */}
              <View style={styles.finishedRight}>
               <Pressable style={styles.confirmButton} onPress={saveAndResetRun}>
                  <Text style={styles.confirmButtonText}>Run Again</Text>
               </Pressable>

               <Pressable style={styles.secondaryButton} onPress={discardRun}>
                 <Text style={styles.secondaryButtonText}>
                    Run Again (no save)
                 </Text>
                </Pressable>
              </View>

            </View>
          )}
        </View>
            </SafeAreaView>
          </View>
  );
}

function DrillsPage({
  onOpenCamera,
  onOpenPractice,
}: {
  onOpenCamera: (drill: { id: number; title: string }) => void;
  onOpenPractice: (drill: { id: number; title: string }) => void;
}) {
  const [expandedPreviewId, setExpandedPreviewId] = useState<number | null>(null);

  return (
    <ScrollView contentContainerStyle={styles.pageContent}>
      <View style={{ height: -4 }} />

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

                  {(drill.id === 1 || drill.id === 2 || drill.id === 3 || drill.id === 4 || drill.id === 6) && (
                    <Pressable
                      style={styles.outlineButton}
                      onPress={() => onOpenPractice({ id: drill.id, title: drill.title })}
                    >
                       <Text style={styles.outlineButtonText}>Practice</Text>
                    </Pressable>
                  )}

                  <Pressable
                    style={styles.primaryButton}
                    onPress={() => {
                      onOpenCamera({ id: drill.id, title: drill.title });
                    }}
                  >
                    <Text style={styles.primaryButtonText}>Play</Text>
                  </Pressable>
                </View>
              </View>

              {isExpanded && (
                <View style={styles.previewWrap}>
                  <View style={{ paddingVertical: 40, alignItems: "center" }}>
                    <Text style={{ color: "#94a3b8", fontSize: 14 }}>
                      No preview available
                    </Text>
                 </View>
                </View>
              )}
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

function RankingsPage({
  profile,
  playerBestTimes,
}: {
  profile: typeof defaultProfile;
  playerBestTimes: PlayerBestTimes;
}) {
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
    "Figure Eight",
  ];

  const ages = [...new Set(RANKINGS.map((player) => String(player.age)))].sort(
    (a, b) => Number(a) - Number(b)
  );

  const currentPlayerAge = Number(calculateAgeFromBirthday(profile.birthday)) || "—";
  const currentPlayerCombinedScoreMs = getCombinedScoreMs(playerBestTimes);

  const currentPlayerEntry = {
    name: profile.name || "Unnamed Player",
    province: profile.country || "—",
    age: currentPlayerAge,
    gender: profile.gender || "—",
    drills: playerBestTimes,
  };

  const filteredPlayers = [
    ...RANKINGS.filter(
      (player) => player.name.toLowerCase() !== profile.name.toLowerCase()
    ),
    currentPlayerEntry,
  ].filter((player) => {
    const matchesAge = ageFilter === "All" || String(player.age) === ageFilter;
    const matchesGender =
      genderFilter === "All" || player.gender === genderFilter;
    return matchesAge && matchesGender;
  });

  const leaderboard =
    drillFilter === "Overall"
      ? filteredPlayers
          .map((player) => {
            const combined = getCombinedScoreMs(player.drills ?? {});
            return combined === null
              ? null
              : {
                  ...player,
                  combinedScoreMs: combined,
                };
          })
          .filter(Boolean)
          .sort((a: any, b: any) => a.combinedScoreMs - b.combinedScoreMs)
          .map((player: any, index) => ({
            ...player,
            displayRank: index + 1,
            displayValue: `${(player.combinedScoreMs / 1000).toFixed(2)}s`,
            displayLabel: "Score",
          }))
      : filteredPlayers
          .filter((player) => typeof player.drills?.[drillFilter as DrillName] === "number")
          .sort(
            (a, b) =>
              (a.drills?.[drillFilter as DrillName] ?? Infinity) -
              (b.drills?.[drillFilter as DrillName] ?? Infinity)
          )
          .map((player, index) => ({
            ...player,
            displayRank: index + 1,
            displayValue: `${((player.drills?.[drillFilter as DrillName] ?? 0) / 1000).toFixed(2)}s`,
            displayLabel: "Time",
          }));

  const currentPlayer =
    leaderboard.find(
      (player) => player.name.toLowerCase() === profile.name.toLowerCase()
    ) ?? {
      ...currentPlayerEntry,
      displayRank: "—",
      displayValue:
        drillFilter === "Overall"
          ? currentPlayerCombinedScoreMs !== null
            ? `${(currentPlayerCombinedScoreMs / 1000).toFixed(2)}s`
            : "—"
          : formatTime(playerBestTimes[drillFilter as DrillName]),
      displayLabel: drillFilter === "Overall" ? "Score" : "Time",
    };

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
              "Figure Eight",
        
            ].map((drillName) => (
              <View key={drillName} style={styles.drillTimeRow}>
                <Text style={styles.smallMuted}>{drillName}</Text>
                <Text style={styles.drillTimeValue}>
                  {typeof currentPlayer.drills?.[drillName] === "number"
                    ? `${((currentPlayer.drills[drillName] as number) / 1000).toFixed(2)}s`
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

function UsagePage({
  usageHistory,
  onBack,
  onDeleteEntry,
}: {
  usageHistory: UsageEntry[];
  onBack: () => void;
  onDeleteEntry: (id: string) => void;
}) {
  const groupedUsage = groupUsageByDate(usageHistory);
  const [selectedVideoUri, setSelectedVideoUri] = useState<string | null>(null);
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});

  return (
    <>
      <ScrollView contentContainerStyle={styles.pageContent}>
        <View style={[styles.card, { paddingTop: 20 }]}>
          <Text style={[styles.sectionTitle, { marginTop: 4 }]}>Usage</Text>
          <Text style={[styles.sectionSubtitle, { marginBottom: 12 }]}>
            Completed drill times grouped by date.
          </Text>

          {groupedUsage.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.sectionSubtitle}>
                No completed drills yet.
              </Text>
            </View>
          ) : (
            <View style={{ gap: 16, marginTop: 14 }}>
              {groupedUsage.map((group) => {
                const isExpanded = expandedDates[group.date] ?? false;

                return (
                  <View key={group.date} style={styles.usageGroup}>
                    <View style={styles.usageDateHeaderRow}>
                      <Pressable
                        onPress={() =>
                          setExpandedDates((prev) => ({
                            ...prev,
                            [group.date]: !isExpanded,
                          }))
                        }
                        style={styles.usageDateTitlePressable}
                      >
                        <Text style={styles.usageDateHeader}>
                          {formatUsageDate(group.date)}
                        </Text>
                      </Pressable>

                      <Pressable
                        onPress={() =>
                          setExpandedDates((prev) => ({
                            ...prev,
                            [group.date]: !isExpanded,
                          }))
                        }
                        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                        style={styles.usageDateChevronButton}
                      >
                        <Text style={styles.usageDateChevron}>
                          {isExpanded ? "▾" : "▸"}
                        </Text>
                      </Pressable>
                    </View>

                    {isExpanded ? (
                      <View style={{ gap: 10, marginTop: 10 }}>
                        {group.items.map((entry) => (
                          <Swipeable
                            key={entry.id}
                            renderRightActions={() => (
                              <Pressable
                                style={styles.deleteSwipeAction}
                                onPress={() => onDeleteEntry(entry.id)}
                              >
                                <Text style={styles.deleteSwipeActionText}>Delete</Text>
                              </Pressable>
                            )}
                          >
                            <View style={styles.usageRow}>
                             <View style={{ flex: 1 }}>
                               <Text style={styles.playerName}>{entry.drill}</Text>
                               <Text style={styles.smallMuted}>
                                 {new Date(entry.completedAt).toLocaleTimeString([], {
                                   hour: "numeric",
                                   minute: "2-digit",
                                 })}
                               </Text>
                             </View>

                             <View style={styles.usageRightSide}>
                              <Text style={styles.drillTimeValue}>
                                {formatTime(entry.timeMs)}
                              </Text>

                              {entry.videoUri ? (
                                <Pressable onPress={() => setSelectedVideoUri(entry.videoUri)}>
                                  <Text style={styles.viewLinkText}>View</Text>
                                </Pressable>
                              ) : null}
                             </View>
                           </View>
                         </Swipeable>
                        ))}
                      </View>
                    ) : null}
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={!!selectedVideoUri}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setSelectedVideoUri(null)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: "#000" }}>
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            {selectedVideoUri ? (
              <Video
                source={{ uri: selectedVideoUri }}
                style={{ width: "100%", height: "70%" }}
                controls
                resizeMode="contain"
                paused={false}
              />
            ) : null}
          </View>

          <View style={{ padding: 20 }}>
            <Pressable
              style={styles.outlineButton}
              onPress={() => setSelectedVideoUri(null)}
            >
              <Text style={styles.outlineButtonText}>Close Recording</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </Modal>
    </>
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
        
          <Image
            source={require("./assets/logo2.png")}
            style={{ width: 320, height: 80 }}
            resizeMode="contain"
      />
        
        <Text style={styles.openingSubtitle}>
          The standard for elite stickhandling skills
        </Text>
      </Animated.View>

    </Animated.View>
  );
}

type DrillName =
  | "Wide Sweep"
  | "Straight Line"
  | "Zipper"
  | "Parallelogram"
  | "Figure Eight";

type PlayerBestTimes = Partial<Record<DrillName, number>>;

type UsageEntry = {
  id: string;
  drill: DrillName;
  timeMs: number;
  completedAt: string;
  videoUri: string | null;
};

const CORE_DRILL_NAMES: DrillName[] = [
  "Wide Sweep",
  "Straight Line",
  "Zipper",
  "Parallelogram",
  "Figure Eight",
];

function formatTime(ms?: number | null) {
  return typeof ms === "number" ? `${(ms / 1000).toFixed(2)}s` : "—";
}

function formatUsageDate(dateString: string) {
  const date = new Date(dateString);

  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function groupUsageByDate(entries: UsageEntry[]) {
  const grouped: Record<string, UsageEntry[]> = {};

  [...entries]
    .sort(
      (a, b) =>
        new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
    )
    .forEach((entry) => {
      const key = entry.completedAt.slice(0, 10); // YYYY-MM-DD
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(entry);
    });

  return Object.entries(grouped).map(([date, items]) => ({
    date,
    items,
  }));
}

function getCombinedScoreMs(times: PlayerBestTimes) {
  const values = CORE_DRILL_NAMES.map((name) => times[name]);
  const hasAllFive = values.every((value) => typeof value === "number");

  if (!hasAllFive) return null;

  return values.reduce((sum, value) => sum + (value ?? 0), 0);
}

const STORAGE_KEYS = {
  profile: "sn_profile",
  bestTimes: "sn_best_times",
  usageHistory: "sn_usage_history",
};

export default function App() {
  const [playerBestTimes, setPlayerBestTimes] = useState<PlayerBestTimes>({});
  const [usageHistory, setUsageHistory] = useState<UsageEntry[]>([]);
  const [currentPage, setCurrentPage] = useState<"home" | "profile" | "drills" | "rankings" | "usage">("home");
  const [showOpeningAnimation, setShowOpeningAnimation] = useState(true);
  const [profile, setProfile] = useState(defaultProfile);
  const [activeCameraDrill, setActiveCameraDrill] = useState<null | { id: number; title: string }>(null);
  const [activePracticeDrill, setActivePracticeDrill] = useState<null | { id: number; title: string }>(null);
  const [hasLoadedStorage, setHasLoadedStorage] = useState(false);

  useEffect(() => {
    const loadSavedData = async () => {
      try {
        const [savedProfile, savedBestTimes, savedUsageHistory] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.profile),
          AsyncStorage.getItem(STORAGE_KEYS.bestTimes),
          AsyncStorage.getItem(STORAGE_KEYS.usageHistory),
        ]);

        if (savedProfile) {
          console.log("LOADED PROFILE:", savedProfile);
          setProfile(JSON.parse(savedProfile));
        }
        if (savedBestTimes) setPlayerBestTimes(JSON.parse(savedBestTimes));
        if (savedUsageHistory) setUsageHistory(JSON.parse(savedUsageHistory));
      } catch (error) {
        console.log("Failed to load saved app data", error);
      }
    };

    loadSavedData().finally(() => {
      setHasLoadedStorage(true);
    });
  }, []);

  useEffect(() => {
    if (!hasLoadedStorage) return;
    console.log("SAVING PROFILE:", profile);

    AsyncStorage.setItem(STORAGE_KEYS.profile, JSON.stringify(profile)).catch((error) => {
      console.log("Failed to save profile", error);
    });
  }, [profile, hasLoadedStorage]);

  useEffect(() => {
    if (!hasLoadedStorage) return;

    AsyncStorage.setItem(STORAGE_KEYS.bestTimes, JSON.stringify(playerBestTimes)).catch((error) => {
      console.log("Failed to save best times", error);
    });
  }, [playerBestTimes, hasLoadedStorage]);

  useEffect(() => {
    if (!hasLoadedStorage) return;

    AsyncStorage.setItem(STORAGE_KEYS.usageHistory, JSON.stringify(usageHistory)).catch((error) => {
      console.log("Failed to save usage history", error);
    });
  }, [usageHistory, hasLoadedStorage]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Video
        source={require("./assets/background.mp4")} // ← put your video here
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
        repeat
        muted
        ignoreSilentSwitch="obey"
      />
      <View
        style={{
          ...StyleSheet.absoluteFillObject,
          backgroundColor: "rgba(0,0,0,0.4)", // dark overlay
        }}
      />
      {activePracticeDrill ? (
        activePracticeDrill.id === 1 ? (
          <PracticeWideSweepScreen
            onBack={() => setActivePracticeDrill(null)}
          />
        ) : activePracticeDrill.id === 2 ? (
          <PracticeStraightLineScreen
            onBack={() => setActivePracticeDrill(null)}
          />
        ) : activePracticeDrill.id === 3 ? (
          <PracticeZipperScreen
            onBack={() => setActivePracticeDrill(null)}
          />
        ) : activePracticeDrill.id === 4 ? (
          <PracticeParallelogramScreen
            onBack={() => setActivePracticeDrill(null)}
          />
        ) : activePracticeDrill.id === 6 ? (
          <PracticeFigureEightScreen
            onBack={() => setActivePracticeDrill(null)}
          />
        ) : null
      ) : activeCameraDrill ? (
       <DrillCameraScreen
         drill={activeCameraDrill as { id: number; title: DrillName }}
         onBack={() => setActiveCameraDrill(null)}
         savedBestTimeMs={playerBestTimes[activeCameraDrill.title as DrillName] ?? null}
         onSaveBestTime={(timeMs) => {
           const drillName = activeCameraDrill.title as DrillName;

           setPlayerBestTimes((prev) => {
             const existing = prev[drillName];
             if (typeof existing === "number" && existing <= timeMs) {
               return prev;
             }

             return {
               ...prev,
               [drillName]: timeMs,
             };
           });
         }}
         onCompleteRun={(entry) => {
           setUsageHistory((prev) => [entry, ...prev]);
         }}
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

            <View
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: "rgba(0,0,0,0.4)" },
              ]}
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
                <ProfilePage
                  profile={profile}
                  setProfile={setProfile}
                  onOpenUsage={() => setCurrentPage("usage")}
                />
             )}

              {currentPage === "drills" && (
                <DrillsPage
                  onOpenCamera={(drill) =>
                   setActiveCameraDrill({ id: drill.id, title: drill.title })
                  }
                  onOpenPractice={(drill) =>
                    setActivePracticeDrill({ id: drill.id, title: drill.title })
                  }
                />
              )}

              {currentPage === "rankings" && (
                 <RankingsPage profile={profile} playerBestTimes={playerBestTimes} />
              )}
              {currentPage === "usage" && (
                <UsagePage
                  usageHistory={usageHistory}
                  onBack={() => setCurrentPage("profile")}
                  onDeleteEntry={(id) => {
                    setUsageHistory((prev) => prev.filter((entry) => entry.id !== id));
                  }}
               />
              )}
            </>
          )}
        
      )}

      {showOpeningAnimation && (
        <OpeningAnimation onFinish={() => setShowOpeningAnimation(false)} />
      )}
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#030712",
  },

  deleteSwipeAction: {
    justifyContent: "center",
    alignItems: "center",
    width: 96,
    borderRadius: 16,
    backgroundColor: "#dc2626",
    marginTop: 2,
    marginBottom: 2,
  },

  deleteSwipeActionText: {
    color: "white",
    fontSize: 14,
    fontWeight: "700",
  },

  finishedRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },

  finishedLeft: {
    flex: 1,
  },

  finishedRight: {
    width: 140,
    gap: 10,
  },

  cameraTitleCentered: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
  },

  cameraSubtitleCentered: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    marginTop: 4,
  },

  finishedTime: {
    color: "#fff",
    fontSize: 42,
    fontWeight: "900",
    marginTop: 8,
  },

  secondaryButton: {
    marginTop: 10,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.15)", // 👈 less attractive
    alignItems: "center",
  },

  secondaryButtonText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
    fontWeight: "600",
  },

  usageDateTitlePressable: {
    flex: 1,
    justifyContent: "center",
  },  

  usageDateChevronButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginRight: -6,
  },

  birthdayTrigger: {
    backgroundColor: "#111827",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  birthdayTriggerText: {
    color: "white",
    fontSize: 13,
    fontWeight: "600",
  },

  birthdayModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },

  birthdayModalCard: {
    width: "100%",
    borderRadius: 22,
    backgroundColor: "#0b1220",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 16,
  },

  birthdayModalTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 12,
  },

  birthdayWheelsRow: {
    flexDirection: "row",
    gap: 8,
  },

  birthdayWheelCol: {
    flex: 1,
  },

  birthdayWheelLabel: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 4,
  },

  birthdayPicker: {
    height: 180,
    color: "white",
    backgroundColor: "#030712",
  },

  birthdayPickerItem: {
    color: "white",
    fontSize: 18,
  },

  birthdayModalButtons: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },

  birthdayModalCancel: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
  },

  birthdayModalCancelText: {
    color: "white",
    fontWeight: "700",
    fontSize: 14,
  },

  birthdayModalSave: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: "#e2e8f0",
  },

  birthdayModalSaveText: {
    color: "#111827",
    fontWeight: "800",
    fontSize: 14,
  },

  usageDateHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  usageDateChevron: {
    color: "#94a3b8",
    fontSize: 28,
    fontWeight: "700",
    lineHeight: 28,
  },

  usageRightSide: {
    alignItems: "flex-end",
    gap: 6,
  },

  viewLinkText: {
    color: "#60a5fa",
    fontSize: 14,
    fontWeight: "700",
  },

  heightGuideImage: {
    height: "100%",
    width: "100%",
    height: 320,
    marginTop: 20,
    marginBottom: 20,
    alignSelf: "center",
  },

  editIconButton: {
    position: "absolute",
    top: 12,
    right: 12,
    zIndex: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  editIconText: {
    fontSize: 12,
    color: "#9CA3AF", // subtle grey
    fontWeight: "500",
  },



  recordingButton: {
    marginTop: 6,
    alignSelf: "flex-start",
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
  },

  recordingButtonText: {
    color: "#e2e8f0",
    fontSize: 13,
    fontWeight: "700",
  },

  videoModalContainer: {
    flex: 1,
    backgroundColor: "#0F1C2E",
    justifyContent: "center",
  },

  videoModalCloseButton: {
    position: "absolute",
    top: 60,
    right: 20,
    zIndex: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.12)",
  },

  videoModalCloseText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },

  videoModalPlayer: {
    width: "100%",
    height: "100%",
  },

  usageGroup: {
    paddingTop: 4,
  },

  usageDateHeader: {
    color: "#e2e8f0",
    fontSize: 16,
    fontWeight: "800",
  },

  usageRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  cameraDebugReadout: {
    marginTop: 4,
    marginBottom: 12,
    padding: 10,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.08)",
    gap: 4,
  },

  cameraDebugLine: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },

  cameraRunTimer: {
  color: "#fff",
  fontSize: 34,
  fontWeight: "900",
  textAlign: "center",
  marginTop: 2,
},

cameraBestText: {
  color: "rgba(255,255,255,0.8)",
  fontSize: 14,
  textAlign: "center",
  marginTop: 6,
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
    marginBottom: 0,
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
    backgroundColor: "transparent",
  },

  headerWrapHome: {
    backgroundColor: "transparent",
    borderBottomWidth: 0,
    paddingTop: 0,
    paddingBottom: 0,
    alignItems: "center",
  },
  headerTop: {
    marginBottom: 16,
    marginTop: 60,
  },
  headerTopHome: {
    marginBottom: 4,
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
    paddingTop: 25,
    textAlign: "center",
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
    fontSize: 16,
    marginTop: 0,
    marginBottom: 4,
    textAlign: "center",
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
    backgroundColor: "#0F1C2E",
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
    fontWeight: "900",
    letterSpacing: -0.4,
    
  },
  tabButtonTextActive: {
    color: "#111827",
  },

  pageContent: {
    padding: 16,
  
    paddingBottom: 28,
    gap: 10,
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
    flexDirection: "column",
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
