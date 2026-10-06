import QR from "qrcode";
import { useMemo } from "react";
import Svg, { Path, Rect } from "react-native-svg";

// Dark modules drawn as one path; always dark-on-white so every scanner reads it.
export function QRCode({ value, size }: { value: string; size: number }) {
  const { path, count } = useMemo(() => {
    const { modules } = QR.create(value, { errorCorrectionLevel: "M" });
    let d = "";
    for (let y = 0; y < modules.size; y++) {
      for (let x = 0; x < modules.size; x++) {
        if (modules.get(y, x)) d += `M${x + 2} ${y + 2}h1v1h-1z`;
      }
    }
    return { path: d, count: modules.size + 4 };
  }, [value]);

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${count} ${count}`} accessibilityLabel="QR code">
      <Rect width={count} height={count} fill="#FFFFFF" />
      <Path d={path} fill="#0B0B0D" />
    </Svg>
  );
}
