import { PositionType } from "@beatsync/shared";

function calculateEuclideanDistance(
  p1: PositionType,
  p2: PositionType
): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function gainFromDistanceExp(
  client: PositionType,
  source: PositionType,
  falloff = 0.05,
  minGain = 0.15,
  maxGain = 1.0
): number {
  const distance = calculateEuclideanDistance(client, source);
  const gain = maxGain * Math.exp(-falloff * distance);
  return Math.max(minGain, gain);
}
