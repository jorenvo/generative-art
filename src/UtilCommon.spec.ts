import "mocha";
import * as assert from "assert";
import { UtilCommon } from "./UtilCommon";

describe("UtilCommon", function () {
  it("should correctly calculate least common multiples", function () {
    assert.throws(() => UtilCommon.lcm(1, 0));
    assert.throws(() => UtilCommon.lcm(0, 1));
    assert.throws(() => UtilCommon.lcm(-1, 1));
    assert.equal(UtilCommon.lcm(0, 0), 0);

    assert.equal(UtilCommon.lcm(40, 5), 40);
    assert.equal(UtilCommon.lcm(12, 18), 36);
    assert.equal(UtilCommon.lcm(18, 12), 36);
    assert.equal(UtilCommon.lcm(9, 10), 90);
    assert.equal(UtilCommon.lcm(99, 2), 198);
    assert.equal(UtilCommon.lcm(99, 100), 9_900);
  });
});
