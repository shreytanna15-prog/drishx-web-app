export type ProgressiveEyeOption = "LEFT" | "RIGHT" | "BOTH";

export const PROGRESSIVE_EYE_OPTIONS: {
  id: ProgressiveEyeOption;
  label: string;
}[] = [
  { id: "LEFT", label: "Left eye" },
  { id: "RIGHT", label: "Right eye" },
  { id: "BOTH", label: "Both eyes" },
];

export function progressiveCartEyes(
  selected: ProgressiveEyeOption
): Array<"LEFT" | "RIGHT"> {
  if (selected === "BOTH") {
    return ["LEFT", "RIGHT"];
  }
  return [selected];
}
