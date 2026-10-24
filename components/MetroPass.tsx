import React, { useMemo, useRef, useState } from "react";
import { Pressable, Share, Text, View, type ViewInstance } from "react-native";
import Svg, { Circle, Line, Text as SvgText } from "react-native-svg";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { captureRef } from "react-native-view-shot";
import { Asset, requestPermissionsAsync } from "expo-media-library";

import Mascot from "./Mascot";
import { mono } from "./receipt";
import { showErrorToast, showSuccessToast } from "./Toast";
import { getLineColor, UNSORTED_LINE_COLOR } from "../utils/lineColors";
import type { Hub } from "../types/hub";
import type { Place } from "../types/place";
import type { WrappedPeriod, WrappedStats } from "../lib/wrappedStats";

const AMBER = "#fbbf24";
const EDGE = "rgba(251,191,36,0.55)";
const HAIR = "rgba(251,191,36,0.15)";
const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

/** "19 – 25 OCT" for the current Mon-Sun week, "OCT 2026" for the month. */
function periodLabel(period: WrappedPeriod) {
  const now = new Date();
  if (period === "monthly") return `${MONTHS[now.getMonth()]} ${now.getFullYear()}`;
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7));
  const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6);
  const sameMonth = start.getMonth() === end.getMonth();
  return `${start.getDate()}${sameMonth ? "" : " " + MONTHS[start.getMonth()]} – ${end.getDate()} ${MONTHS[end.getMonth()]}`;
}

/** Decorative serial, stable for a given period and spot count. */
function passCode(period: WrappedPeriod, total: number) {
  const now = new Date();
  const tag =
    period === "monthly"
      ? `${String(now.getFullYear()).slice(-2)}${String(now.getMonth() + 1).padStart(2, "0")}`
      : `W${Math.ceil((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / 6048e5)}`;
  return `ORT-${tag}-${String(total).padStart(4, "0")}`;
}

const stars = (n: number) => "★".repeat(n) + "☆".repeat(Math.max(0, 5 - n));

function Cell({
  label,
  value,
  sub,
  right,
  last,
}: {
  label: string;
  value: string;
  sub?: string;
  right?: boolean;
  last?: boolean;
}) {
  return (
    <View
      style={{
        width: "50%",
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRightWidth: right ? 0 : 1,
        borderBottomWidth: last ? 0 : 1,
        borderColor: HAIR,
      }}
    >
      <Text
        style={[mono, { color: "#8d8372" }]}
        className="text-[8.5px] font-bold uppercase tracking-[.2em]"
      >
        {label}
      </Text>
      <Text
        numberOfLines={2}
        adjustsFontSizeToFit
        className="mt-1.5 text-[17px] font-black uppercase leading-5 text-zinc-100"
      >
        {value}
      </Text>
      {sub ? (
        <Text style={[mono, { color: AMBER }]} className="mt-1 text-[9.5px]" numberOfLines={1}>
          {sub}
        </Text>
      ) : null}
    </View>
  );
}

/**
 * One shareable card summarising the period: spot count with May, a mini route
 * of the stations you ate at, then the headline stats. The "new" Wrapped look;
 * the old art cards live on behind the OLD toggle.
 */
export default function MetroPass({
  period,
  stats,
  places,
  hubs,
}: {
  period: WrappedPeriod;
  stats: WrappedStats;
  /** Places already filtered to this period. */
  places: Place[];
  hubs: Hub[];
}) {
  const label = periodLabel(period);

  // Stations on the line, with how many of this period's spots each holds.
  const stops = useMemo(() => {
    const count = (id: number | null) => places.filter((p) => (p.hub_id ?? null) === id).length;
    const list = hubs.map((h, i) => ({
      key: String(h.id),
      name: h.name,
      color: getLineColor(i).bg,
      n: count(h.id),
    }));
    const unsorted = count(null);
    if (unsorted > 0) list.push({ key: "unsorted", name: "Unsorted", color: UNSORTED_LINE_COLOR.bg, n: unsorted });
    return list;
  }, [places, hubs]);

  const mostRevisited = useMemo(() => {
    const top = [...places].sort((a, b) => (b.revisit_count ?? 0) - (a.revisit_count ?? 0))[0];
    return top && (top.revisit_count ?? 0) > 0 ? top : null;
  }, [places]);

  const neverBack = useMemo(() => places.filter((p) => (p.revisit_count ?? 0) === 0), [places]);

  const stationCount = stops.filter((s) => s.n > 0).length;
  const avg = stats.averageRating;

  // The picture is taken of this frame, not the card itself: the frame has a
  // solid background, so the card's rounded corners and punched notches save
  // as the app's dark colour instead of transparent.
  const shotRef = useRef<ViewInstance>(null);
  const [saving, setSaving] = useState(false);

  const savePicture = async () => {
    if (saving) return;
    setSaving(true);
    try {
      // writeOnly: we only add a photo, never read the user's library.
      const perm = await requestPermissionsAsync(true, ["photo"]);
      if (!perm.granted) {
        showErrorToast("Can't save", "Allow photo access to save your pass.");
        return;
      }
      const uri = await captureRef(shotRef, { format: "png", quality: 1, result: "tmpfile" });
      await Asset.create(uri);
      showSuccessToast("Saved", "Your pass is in your photos.");
    } catch {
      showErrorToast("Couldn't save", "Something went wrong saving the picture.");
    } finally {
      setSaving(false);
    }
  };

  const share = () =>
    Share.share({
      message:
        `My Ortibites ${period === "weekly" ? "week" : "month"} (${label}): ` +
        `${stats.totalSpots} new spot${stats.totalSpots === 1 ? "" : "s"}` +
        (stationCount ? ` across ${stationCount} station${stationCount === 1 ? "" : "s"}` : "") +
        (stats.highestRated ? `. Top spot: ${stats.highestRated.name}` : "") +
        (stats.topDish ? `. Top dish: ${stats.topDish}` : "") +
        (avg !== null ? `. Average rating ${avg.toFixed(1)}/5` : "") +
        ".",
    });

  // Route geometry in viewBox units; the Svg scales to the card's width.
  const W = 278;
  const step = stops.length > 1 ? W / (stops.length - 1) : 0;
  const crowded = stops.length > 6;

  return (
    <View>
      <View
        ref={shotRef}
        collapsable={false}
        style={{ backgroundColor: "#0c0907", padding: 14, borderRadius: 4 }}
      >
      <LinearGradient
        colors={["#1b1510", "#0d0a07"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderRadius: 20, borderWidth: 1.5, borderColor: EDGE, overflow: "hidden" }}
      >
        {/* header strip */}
        <View
          className="flex-row items-center justify-between px-4 py-2.5"
          style={{ backgroundColor: "rgba(251,191,36,0.12)", borderBottomWidth: 1, borderColor: "rgba(251,191,36,0.25)" }}
        >
          <Text style={[mono, { color: AMBER }]} className="text-[9px] font-bold tracking-[.22em]">
            ORTIBITES · {period === "weekly" ? "WEEKLY" : "MONTHLY"} PASS
          </Text>
          <Text style={[mono, { color: AMBER }]} className="text-[9px] font-bold tracking-[.22em]">
            {label}
          </Text>
        </View>

        {/* hero: the count, with May beside it */}
        <View className="flex-row items-end justify-between pl-4 pr-1 pt-3">
          <View className="pb-2">
            <Text
              style={{ color: AMBER, fontSize: 84, lineHeight: 84, fontWeight: "900", letterSpacing: -2 }}
            >
              {stats.totalSpots}
            </Text>
            <Text
              style={[mono, { color: "#8d8372" }]}
              className="mt-1.5 text-[10px] font-bold tracking-[.22em]"
            >
              SPOT{stats.totalSpots === 1 ? "" : "S"} LOGGED
            </Text>
          </View>
          <Mascot pose="happy" size={104} />
        </View>

        {/* mini route: every station, lit if you ate there this period */}
        <View className="px-4 pb-3.5 pt-1">
          <Svg width="100%" height={64} viewBox={`-10 0 ${W + 20} 64`}>
            {stops.length > 1 && (
              <Line x1={0} y1={26} x2={W} y2={26} stroke="#3a2e20" strokeWidth={4} strokeLinecap="round" />
            )}
            {stops.map((s, i) => {
              const x = stops.length > 1 ? i * step : W / 2;
              const showLabel = !crowded || s.n > 0;
              return (
                <React.Fragment key={s.key}>
                  {s.n > 0 ? (
                    <>
                      <Circle cx={x} cy={26} r={9 + Math.min(s.n, 4)} fill="#0b0907" stroke={s.color} strokeWidth={4} />
                      <SvgText x={x} y={30} textAnchor="middle" fontSize={10} fontWeight="bold" fill="#f4ede3">
                        {s.n}
                      </SvgText>
                    </>
                  ) : (
                    <Circle cx={x} cy={26} r={6} fill="#0b0907" stroke="#4a3d2b" strokeWidth={2} />
                  )}
                  {showLabel && (
                    <SvgText
                      x={x}
                      y={58}
                      textAnchor="middle"
                      fontSize={7.5}
                      fontWeight="bold"
                      fill={s.n > 0 ? "#d9cfbd" : "#5b5346"}
                    >
                      {s.name.toUpperCase().slice(0, 9)}
                    </SvgText>
                  )}
                </React.Fragment>
              );
            })}
          </Svg>
        </View>

        {/* perforation, notched at both edges */}
        <View style={{ borderTopWidth: 1.5, borderStyle: "dashed", borderColor: "rgba(251,191,36,0.4)" }}>
          <View
            style={{
              position: "absolute",
              left: -9,
              top: -9,
              width: 16,
              height: 16,
              borderRadius: 8,
              backgroundColor: "#0c0907",
              borderWidth: 1.5,
              borderColor: EDGE,
            }}
          />
          <View
            style={{
              position: "absolute",
              right: -9,
              top: -9,
              width: 16,
              height: 16,
              borderRadius: 8,
              backgroundColor: "#0c0907",
              borderWidth: 1.5,
              borderColor: EDGE,
            }}
          />
        </View>

        <View className="flex-row flex-wrap">
          <Cell
            label="Top spot"
            value={stats.highestRated?.name ?? "-"}
            sub={stats.highestRated ? stars(Math.round(stats.highestRated.rating)) : undefined}
          />
          <Cell
            right
            label="Top dish"
            value={stats.topDish ?? "-"}
            sub={stats.topDish ? (stats.topDishCount > 1 ? `at ${stats.topDishCount} spots` : "once") : undefined}
          />
          <Cell
            last
            label="Average rating"
            value={avg !== null ? `${avg.toFixed(1)}/5` : "-"}
            sub={`${stats.ratedCount} rated`}
          />
          <Cell
            last
            right
            label="Most revisited"
            value={mostRevisited?.name ?? "none yet"}
            sub={mostRevisited ? `×${mostRevisited.revisit_count} visits` : undefined}
          />
        </View>

        <View className="flex-row items-center justify-between px-4 py-2.5">
          <Text style={[mono, { color: "#5b5346" }]} className="text-[8.5px] tracking-[.2em]">
            {passCode(period, stats.totalSpots)}
          </Text>
          <View className="flex-row" style={{ height: 20, gap: 2 }}>
            {Array.from({ length: 22 }).map((_, i) => (
              <View
                key={i}
                style={{ width: i % 3 === 0 ? 3 : 1.5, height: 20, backgroundColor: "#6b5a3c" }}
              />
            ))}
          </View>
        </View>
      </LinearGradient>
      </View>

      {/* Save is the main action; the text share stays as the quick option. */}
      <View className="mt-3 flex-row gap-2">
        <Pressable
          onPress={savePicture}
          disabled={saving}
          className="h-12 flex-[1.4] flex-row items-center justify-center gap-2 rounded-xl bg-amber-400"
          style={{ opacity: saving ? 0.6 : 1 }}
        >
          <Ionicons name="download-outline" size={17} color="#1a1205" />
          <Text style={mono} className="text-xs font-bold uppercase tracking-widest text-black">
            {saving ? "Saving…" : "Save picture"}
          </Text>
        </Pressable>
        <Pressable
          onPress={share}
          className="h-12 flex-1 flex-row items-center justify-center gap-2 rounded-xl border border-amber-400 bg-amber-400/10"
        >
          <Ionicons name="share-social-outline" size={17} color={AMBER} />
          <Text style={mono} className="text-xs font-bold uppercase tracking-widest text-amber-400">
            Text
          </Text>
        </Pressable>
      </View>

      {neverBack.length > 0 && (
        <View className="mt-5">
          <Text style={mono} className="text-[9px] uppercase tracking-[.22em] text-zinc-500">
            Never been back · {neverBack.length}
          </Text>
          <View className="mt-2 flex-row flex-wrap gap-2">
            {neverBack.slice(0, 10).map((p) => {
              const i = hubs.findIndex((h) => h.id === p.hub_id);
              const line = i >= 0 ? getLineColor(i) : UNSORTED_LINE_COLOR;
              return (
                <View key={p.id} className="rounded-lg px-2.5 py-1.5" style={{ backgroundColor: line.bg }}>
                  <Text style={[mono, { color: line.ink }]} className="text-[10.5px] font-bold">
                    {p.name}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
}
