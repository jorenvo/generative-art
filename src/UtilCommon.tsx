export class UtilCommon {
  static clamp(min: number, x: number, max: number): number {
    return Math.min(max, Math.max(min, x));
  }

  static almostEqual(a: number, b: number, epsilon = 0.0000001) {
    return Math.abs(a - b) < epsilon;
  }

  static lcm(a: number, b: number) {
    if (a < 0 || b < 0) {
      throw new Error(`Neither a (${a}) or b (${b}) can be negative.`);
    }

    if ((a > 0 || b > 0) && (a === 0 || b === 0)) {
      throw new Error(`${a} and ${b} have no common multiple.`);
    }

    let small = a;
    let big = b;
    if (small > big) {
      [small, big] = [big, small];
    }

    let small_multiple = small;
    let big_multiple = big;
    while (small_multiple !== big_multiple) {
      small_multiple += small;

      if (small_multiple > big_multiple) {
        big_multiple += big;
      }
    }

    return small_multiple;
  }
}
