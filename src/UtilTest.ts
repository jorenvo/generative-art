import * as assert from "assert";

export class UtilTest {
  static assertAlmostEqual(a: number, b: number) {
    const EPSILON = 0.000000001;
    assert.ok(Math.abs(a - b) < EPSILON, `${a} does not almost equal ${b}`);
  }
}
