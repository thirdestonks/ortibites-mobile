import React from "react";
import { View } from "react-native";
import Svg, { Circle, G, Line, Text as SvgText } from "react-native-svg";
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import type { Hub } from "../types/hub";

type Props = {
  hubs: Hub[];
  onSelectHub: (hubId: number) => void;
};

const WIDTH = 340;
const ROW_H = 64;
const NODE_R = 7;
const COL_X = [40, 130, 210, 300]; // 4 columns
const HOME_X = WIDTH / 2;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type StationNodeProps = {
  hub: Hub;
  x: number;
  y: number;
  onSelectHub: (hubId: number) => void;
};

function StationNode({ hub, x, y, onSelectHub }: StationNodeProps) {
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

  return (
    <G onPress={handlePress}>
      {/* ripple ring, behind the solid node */}
      <AnimatedCircle
        cx={x}
        cy={y}
        fill="none"
        stroke="#f59e0b"
        strokeWidth={2}
        animatedProps={ringAnimatedProps}
      />
      {/* solid node */}
      <AnimatedCircle
        cx={x}
        cy={y}
        fill="#0a0a0a"
        stroke="#f59e0b"
        strokeWidth={2}
        animatedProps={nodeAnimatedProps}
      />
      <SvgText x={x} y={y - 12} fill="#e4e4e7" fontSize={10} fontWeight="bold" textAnchor="middle">
        {hub.name.toUpperCase()}
      </SvgText>
    </G>
  );
}

export default function MetroNetworkMap({ hubs, onSelectHub }: Props) {
  // Deterministic grid: fill rows of up to 4, top to bottom.
  const perRow = COL_X.length;
  const rows = Math.max(1, Math.ceil(hubs.length / perRow));
  const height = (rows + 1) * ROW_H;
  const homeY = height / 2;

  const nodes = hubs.map((hub, i) => {
    const row = Math.floor(i / perRow);
    const col = i % perRow;
    return { hub, x: COL_X[col], y: (row + 0.5) * ROW_H };
  });

  return (
    <View className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-2">
      <Svg width="100%" height={height} viewBox={`0 0 ${WIDTH} ${height}`}>
        {/* connectors: each hub node elbows to HOME */}
        {nodes.map(({ hub, x, y }) => (
          <G key={`c-${hub.id}`}>
            <Line x1={x} y1={y} x2={x} y2={homeY} stroke="#f59e0b" strokeWidth={2} opacity={0.5} />
            <Line x1={x} y1={homeY} x2={HOME_X} y2={homeY} stroke="#f59e0b" strokeWidth={2} opacity={0.5} />
          </G>
        ))}

        {/* HOME node (non-interactive) */}
        <Circle cx={HOME_X} cy={homeY} r={12} fill="#fb923c" />
        <SvgText x={HOME_X} y={homeY + 26} fill="#fdba74" fontSize={11} fontWeight="bold" textAnchor="middle">
          HOME
        </SvgText>

        {/* hub nodes (tappable) */}
        {nodes.map(({ hub, x, y }) => (
          <StationNode key={hub.id} hub={hub} x={x} y={y} onSelectHub={onSelectHub} />
        ))}
      </Svg>
    </View>
  );
}
