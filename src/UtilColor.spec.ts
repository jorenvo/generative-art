import "mocha";
import * as assert from "assert";
import { Gradient, Color } from "./UtilColor";

describe("Gradient", function () {
  it("should start at the correct value", function () {
    const gradient = new Gradient();
    gradient.addColorStop(0, new Color(0, 0, 0));

    const first_color = gradient.get(0);
    assert.ok(first_color.equals(new Color(0, 0, 0)));
  });

  it("should throw when requesting an offset not in the gradient", function () {
    const gradient = new Gradient();
    const start_color = new Color(0, 0, 0);
    gradient.addColorStop(0, start_color);
    const end_color = new Color(5, 10, 15);
    gradient.addColorStop(10, end_color);

    assert.throws(() => gradient.get(-1));
    assert.throws(() => gradient.get(11));
  });

  it("should correctly interpolate between two colors", function () {
    const gradient = new Gradient();
    const start_color = new Color(0, 0, 0);
    gradient.addColorStop(0, start_color);
    const end_color = new Color(5, 10, 15);
    gradient.addColorStop(10, end_color);

    let color = gradient.get(0);
    assert.ok(color.equals(start_color));

    color = gradient.get(10);
    assert.ok(color.equals(end_color));

    color = gradient.get(5);
    assert.ok(
      color.equals(new Color(end_color.r / 2, end_color.g / 2, end_color.b / 2))
    );
  });

  it("should correctly interpolate between three colors", function () {
    const gradient = new Gradient();
    const start_color = new Color(0, 0, 0);
    gradient.addColorStop(0, start_color);
    const middle_color = new Color(25, 50, 75);
    gradient.addColorStop(3, middle_color);
    const end_color = new Color(100, 150, 200);
    gradient.addColorStop(10, end_color);

    let color = gradient.get(0);
    assert.ok(color.equals(start_color));

    color = gradient.get(3);
    assert.ok(color.equals(middle_color));

    color = gradient.get(10);
    assert.ok(color.equals(end_color));

    color = gradient.get(1);
    assert.ok(
      color.equals(
        new Color(middle_color.r / 3, middle_color.g / 3, middle_color.b / 3)
      )
    );

    color = gradient.get(9);
    let target = new Color(
      middle_color.r * (1 / 7) + end_color.r * (6 / 7),
      middle_color.g * (1 / 7) + end_color.g * (6 / 7),
      middle_color.b * (1 / 7) + end_color.b * (6 / 7)
    );
    assert.ok(color.equals(target));
  });
});
