import "mocha";
import * as assert from "assert";
import { Point } from "./UtilPoint";
import { UtilTest } from "./UtilTest";

describe("Point", function () {
  it("should have 3 zeroed components after initialization", function () {
    const p = new Point();
    assert.equal(p.x, 0);
    assert.equal(p.y, 0);
    assert.equal(p.z, 0);
  });

  it("should correctly add", function () {
    const a = new Point(1, 2, 3);
    const b = new Point(7, 8, 9);

    a.add(b);
    assert.equal(a.x, 8);
    assert.equal(a.y, 10);
    assert.equal(a.z, 12);
  });

  it("should correctly rotate", function () {
    const a = new Point(1, 2, 9);

    a.rotate_xy(Math.PI);
    UtilTest.assertAlmostEqual(a.x, -1);
    UtilTest.assertAlmostEqual(a.y, -2);
    UtilTest.assertAlmostEqual(a.z, 9);
  });
});
