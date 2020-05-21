import { UtilCommon } from "./UtilCommon";

export class Point {
  [key: string]: any; // allow dynamic props
  x: number;
  y: number;
  z: number;

  constructor(x = 0, y = 0, z = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  copy(): Point {
    return new Point(this.x, this.y, this.z);
  }

  private componentOperation(
    other: Point,
    fn: (a: number, b: number) => number
  ) {
    this.x = fn(this.x, other.x);
    this.y = fn(this.y, other.y);
    this.z = fn(this.z, other.z);
  }

  add(other: Point) {
    this.componentOperation(other, (a, b) => a + b);
  }

  subtract(other: Point) {
    this.componentOperation(other, (a, b) => a - b);
  }

  multiply(other: Point) {
    this.componentOperation(other, (a, b) => a * b);
  }

  divide(other: Point) {
    this.componentOperation(other, (a, b) => a / b);
  }

  min(other: Point) {
    this.componentOperation(other, (a, b) => Math.min(a, b));
  }

  max(other: Point) {
    this.componentOperation(other, (a, b) => Math.max(a, b));
  }

  private rotate(axis1: string, axis2: string, radians: number) {
    const sin = Math.sin(radians);
    const cos = Math.cos(radians);
    const tmp = this[axis1] * cos - this[axis2] * sin;
    this[axis2] = this[axis1] * sin + this[axis2] * cos;
    this[axis1] = tmp;
  }

  rotate_xz(radians: number) {
    this.rotate("x", "z", radians);
  }

  rotate_xy(radians: number) {
    this.rotate("x", "y", radians);
  }

  rotate_yz(radians: number) {
    this.rotate("y", "z", radians);
  }

  for_each_dimension(fn: (a: number) => number) {
    this.x = fn(this.x);
    this.y = fn(this.y);
    this.z = fn(this.z);
  }

  xy() {
    return [this.x, this.y];
  }

  xyz() {
    return [this.x, this.y, this.z];
  }

  equals(other: Point) {
    return (
      UtilCommon.almostEqual(this.x, other.x) &&
      UtilCommon.almostEqual(this.y, other.y) &&
      UtilCommon.almostEqual(this.z, other.z)
    );
  }
}
