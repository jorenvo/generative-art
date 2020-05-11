export class UtilCommon {
  static clamp(min: number, x: number, max: number): number {
    return Math.min(max, Math.max(min, x));
  }

  static almostEqual(a: number, b: number, epsilon=0.0000001) {
    return Math.abs(a - b) < epsilon;
  }
}
