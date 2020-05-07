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
}
