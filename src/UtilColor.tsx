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

  private clamp(min: number, x: number, max: number): number {
    return Math.min(max, Math.max(min, Math.floor(x)));
  }

  randomize(random: number) {
    const intensity = 32;
    this.r += random * intensity - intensity / 2;
    this.g += random * intensity - intensity / 2;
    this.b += random * intensity - intensity / 2;

    this.r = this.clamp(0, this.r, 255);
    this.g = this.clamp(0, this.g, 255);
    this.b = this.clamp(0, this.b, 255);
  }

  equals(other: Color) {
    const EPSILON = 0.000001;
    return (
      Math.abs(this.r - other.r) < EPSILON &&
      Math.abs(this.g - other.g) < EPSILON &&
      Math.abs(this.b - other.b) < EPSILON &&
      Math.abs(this.a - other.a) < EPSILON
    );
  }

  multiplied_by(x: number) {
    return new Color(this.r * x, this.g * x, this.b * x, this.a * x);
  }
}

interface ColorStop {
  color: Color;
  offset: number;
}

// Can't use CanvasRenderingContext2D's gradients because they
// are affected by the current transformation matrix.
export class Gradient {
  private size: number;
  private color_stops: ColorStop[];

  constructor() {
    this.size = 0;
    this.color_stops = [];
  }

  addColorStop(offset: number, color: Color) {
    this.size = offset;
    this.color_stops.push({
      offset: offset,
      color: color,
    });
  }

  get(offset: number) {
    if (this.color_stops.length === 0) {
      return new Color(0, 0, 0);
    } else if (this.color_stops.length === 1) {
      return this.color_stops[0].color;
    } else {
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
      return new Color(
        (1 - ratio) * start.color.r + ratio * stop.color.r,
        (1 - ratio) * start.color.g + ratio * stop.color.g,
        (1 - ratio) * start.color.b + ratio * stop.color.b
      );
    }
  }
}
