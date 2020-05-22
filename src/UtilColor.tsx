import { UtilCommon } from "./UtilCommon";

export class Color {
  r: number;
  g: number;
  b: number;
  a: number;

  constructor(r = 0, g = 0, b = 0, a = 255) {
    this.r = r;
    this.g = g;
    this.b = b;
    this.a = a;
  }

  randomize(random: number) {
    const intensity = 32;
    this.r += random * intensity - intensity / 2;
    this.g += random * intensity - intensity / 2;
    this.b += random * intensity - intensity / 2;

    this.r = UtilCommon.clamp(0, this.r, 255);
    this.g = UtilCommon.clamp(0, this.g, 255);
    this.b = UtilCommon.clamp(0, this.b, 255);
  }

  equals(other: Color) {
    return (
      UtilCommon.almostEqual(this.r, other.r) &&
      UtilCommon.almostEqual(this.g, other.g) &&
      UtilCommon.almostEqual(this.b, other.b) &&
      UtilCommon.almostEqual(this.a, other.a)
    );
  }

  copy() {
    return this.multiplied_by(1);
  }

  multiplied_by(x: number) {
    return new Color(this.r * x, this.g * x, this.b * x, this.a * x);
  }

  rgb() {
    return [this.r, this.g, this.b];
  }

  toString() {
    return `rgba(${this.r}, ${this.g}, ${this.b}, ${this.a})`;
  }
}

interface ColorStop {
  color: Color;
  offset: number;
}

// Can't use CanvasRenderingContext2D's gradients because they
// are affected by the current transformation matrix.
export class Gradient {
  private color_stops: ColorStop[];

  constructor() {
    this.color_stops = [];
  }

  addColorStop(offset: number, color: Color) {
    this.color_stops.push({
      offset: offset,
      color: color,
    });
  }

  get(offset: number) {
    let start: ColorStop | undefined;
    let stop: ColorStop | undefined;

    this.color_stops.find((color_stop) => {
      if (color_stop.offset > offset) {
        stop = color_stop;
        return true;
      }
      start = color_stop;
    });

    if (start && start.offset === offset) {
      return start.color;
    }

    if (stop && stop.offset === offset) {
      return stop.color;
    }

    if (!start || !stop) {
      throw Error(
        `${offset} is out of gradient range (${start && start.offset}, ${
          stop && stop.offset
        })`
      );
    }

    const ratio = (offset - start.offset) / (stop.offset - start.offset);
    const color = new Color(
      (1 - ratio) * start.color.r + ratio * stop.color.r,
      (1 - ratio) * start.color.g + ratio * stop.color.g,
      (1 - ratio) * start.color.b + ratio * stop.color.b
    );
    return color;
  }
}
