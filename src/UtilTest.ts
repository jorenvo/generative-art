import * as assert from "assert";
import { UtilCommon } from "./UtilCommon";

export class UtilTest {
  static assertAlmostEqual(a: number, b: number) {
    assert.ok(UtilCommon.almostEqual(a, b), `${a} does not almost equal ${b}`);
  }
}
