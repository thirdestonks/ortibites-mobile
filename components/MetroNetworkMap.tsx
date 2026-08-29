import React from "react";
import { ImageBackground, Pressable, ScrollView, Text, View } from "react-native";
import Svg, { Circle, G, Line, Text as SvgText } from "react-native-svg";
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import type { Hub } from "../types/hub";
import { mono } from "./receipt";
import { getLineColor, type LineColor } from "../utils/lineColors";

type Props = {
  hubs: Hub[];
  onSelectHub: (hubId: number) => void;
  onOpenStationList: () => void;
};

const HEIGHT = 120;
const LINE_Y = 55;
const NODE_R = 7;
const HOME_R = 13;
const HOME_X = 30;
const STATION_SPACING = 85;
const TRAIL_PADDING = 30;
const INK = "#f3ead4"; // light cream ink, legible against the dark mapcardOne texture

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type StationNodeProps = {
  hub: Hub;
  x: number;
  labelAbove: boolean;
  color: LineColor;
  onSelectHub: (hubId: number) => void;
};

function StationNode({ hub, x, labelAbove, color, onSelectHub }: StationNodeProps) {
  const nodeScale = useSharedValue(1);
  const ringScale = useSharedValue(0);
  const ringOpacity = useSharedValue(0);

  const handlePress = () => {
    onSelectHub(hub.id);
    // tactile scale-bounce on the node itself
    nodeScale.value = withSequence(
      withTiming(1.35, { duration: 100 }),
      withTiming(1, { duration: 150 })
    );
    // ripple ring expanding outward and fading
    ringScale.value = 0;
    ringOpacity.value = 0.6;
    ringScale.value = withTiming(2.4, { duration: 450 });
    ringOpacity.value = withTiming(0, { duration: 450 });
  };

  const nodeAnimatedProps = useAnimatedProps(() => ({
    r: NODE_R * nodeScale.value,
  }));

  const ringAnimatedProps = useAnimatedProps(() => ({
    r: NODE_R * (1 + ringScale.value),
    opacity: ringOpacity.value,
  }));

  const labelY = labelAbove ? LINE_Y - NODE_R - 10 : LINE_Y + NODE_R + 20;

  return (
    <G onPress={handlePress}>
      {/* ripple ring, behind the solid node — stays amber as the shared tap-feedback accent */}
      <AnimatedCircle
        cx={x}
        cy={LINE_Y}
        fill="none"
        stroke="#f59e0b"
        strokeWidth={2}
        animatedProps={ringAnimatedProps}
      />
      {/* solid node, tinted to this station's line color */}
      <AnimatedCircle
        cx={x}
        cy={LINE_Y}
        fill={color.bg}
        stroke={INK}
        strokeWidth={1.5}
        animatedProps={nodeAnimatedProps}
      />
      <SvgText x={x} y={labelY} fill={INK} fontSize={10} fontWeight="bold" textAnchor="middle">
        {hub.name.toUpperCase()}
      </SvgText>
    </G>
  );
}

export default function MetroNetworkMap({ hubs, onSelectHub, onOpenStationList }: Props) {
  // One straight line from HOME rightward — a fixed height regardless of
  // station count, since overflow is handled by horizontal scroll instead
  // of adding rows.
  const nodes = hubs.map((hub, i) => ({
    hub,
    x: HOME_X + STATION_SPACING * (i + 1),
    color: getLineColor(i),
    labelAbove: i % 2 === 0,
  }));

  const railWidth = HOME_X + STATION_SPACING * (hubs.length + 1) + TRAIL_PADDING;

  return (
    <View className="overflow-hidden rounded-2xl border border-amber-400/20">
      {/* No Pressable wrapper here: a parent Pressable wins the touch against
          the ScrollView's pan, which is what stopped the map from scrolling.
          Opening the station list is an explicit button below instead. */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        bounces={false}
        contentContainerStyle={{ width: railWidth }}
      >
        <ImageBackground
          source={require("../assets/images/mapcardOne.jpg")}
          resizeMode="repeat"
          style={{ width: railWidth, height: HEIGHT }}
        >
          <Svg width={railWidth} height={HEIGHT}>
            {/* the line: one continuous ink rail from HOME through every station */}
            <Line
              x1={HOME_X}
              y1={LINE_Y}
              x2={railWidth - TRAIL_PADDING / 2}
              y2={LINE_Y}
              stroke={INK}
              strokeWidth={1.6}
              opacity={0.55}
            />

            {/* HOME node (non-interactive) — stays amber, the one constant across every line */}
            <Circle cx={HOME_X} cy={LINE_Y} r={HOME_R} fill="#fb923c" stroke={INK} strokeWidth={1.2} />
            <SvgText
              x={HOME_X}
              y={LINE_Y + HOME_R + 20}
              fill={INK}
              fontSize={11}
              fontWeight="bold"
              textAnchor="middle"
            >
              HOME
            </SvgText>

            {/* hub nodes (tappable), each tinted to its own duplicate-copy color */}
            {nodes.map(({ hub, x, color, labelAbove }) => (
              <StationNode
                key={hub.id}
                hub={hub}
                x={x}
                labelAbove={labelAbove}
                color={color}
                onSelectHub={onSelectHub}
              />
            ))}
          </Svg>
        </ImageBackground>
      </ScrollView>

      <View className="flex-row items-center justify-between px-2.5 py-1.5">
        <Text
          style={mono}
          className="text-[9px] uppercase tracking-widest text-zinc-500"
        >
          swipe the line
        </Text>
        <Pressable
          onPress={onOpenStationList}
          hitSlop={8}
          className="rounded-full border border-amber-400/40 bg-zinc-950/60 px-3 py-1"
        >
          <Text
            style={mono}
            className="text-[9px] font-bold uppercase tracking-widest text-amber-400"
          >
            Edit stations
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
