import { StyleSheet, View } from "react-native";

const sizes = {
  lg: { fill: { size: 300, right: -96, top: -128 }, ring: { size: 360, right: -150, top: -170 } },
  sm: { fill: { size: 240, right: -100, top: -150 }, ring: { size: 300, right: -140, top: -200 } },
};

// It has to stay above the card's divider, so shorter cards use the small size.
export function CardRings({ color, size = "lg" }: { color: string; size?: keyof typeof sizes }) {
  const { fill, ring } = sizes[size];
  return (
    <View pointerEvents="none" style={styles.layer}>
      <View
        style={{
          position: "absolute",
          right: fill.right,
          top: fill.top,
          width: fill.size,
          height: fill.size,
          borderRadius: fill.size / 2,
          backgroundColor: color,
          opacity: 0.03,
        }}
      />
      <View
        style={{
          position: "absolute",
          right: ring.right,
          top: ring.top,
          width: ring.size,
          height: ring.size,
          borderRadius: ring.size / 2,
          borderWidth: 1,
          borderColor: color,
          opacity: 0.06,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  layer: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, overflow: "hidden" },
});
