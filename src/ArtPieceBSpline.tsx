import { ArtPiece } from "./ArtPiece";
import { RandomPool } from "./RandomPool";
import { Point } from "./UtilPoint";

// Ni,k(t) = Ni,k-1(t) (t - ti )/(ti+k-1 - ti ) + Ni+1,k-1(t) (ti+k - t)/(ti+k - ti+1 ) ,
// Ni,1 = {1   if   ti ≤ t ≤ ti+1 ,    0   otherwise }

class BSplineCalc {
  // assume knot vector is:
  // [0, 1, ..., n]
  // this turns t_i into i

  private id: number;
  private random_pool: RandomPool;

  private k: number; // order
  private p: Point[]; // control points
  private n: number; // max control point index

  constructor(random_pool: RandomPool, id: number) {
    this.id = id;
    this.random_pool = random_pool;
    this.k = 3;
    this.p = [];
    this.n = 0;
    this.setControlPoints();
  }

  private getRandomOffset(): number {
    const seed = 8011;
    return seed * this.id;
  }

  private setControlPoints(): void {
    const nr_points = 10;
    for (let i = 0; i < nr_points; i++) {
      let x = i;
      let y = i * 2;
      if (i % 2) {
        y *= -1;
      }

      const multiplier = i * 4;
      // const x_random = this.random_pool.get(this.getRandomOffset() + i) - 0.5;
      // x += x_random * multiplier;
      const y_random =
        this.random_pool.get(this.getRandomOffset() + nr_points + i) - 0.5;
      y += y_random * multiplier;
      this.p.push(new Point(x, y));
    }

    this.n = this.p.length - 1;
    console.log(this.p);
  }

  private N(i: number, k: number, t: number): number {
    const t_i = i;
    const t_i_1 = t_i + 1;

    if (k === 1) {
      // assuming knot vector t is [0, 1, ..., n]
      if (t >= t_i && t <= t_i_1) {
        return 1;
      } else {
        return 0;
      }
    }

    const Ni = this.N(i, k - 1, t);
    const Ni_next = this.N(i + 1, k - 1, t);
    const t_i_k_1 = t_i + k - 1;
    const t_i_k = t_i + k;
    return (
      (Ni * (t - t_i)) / (t_i_k_1 - t_i) +
      (Ni_next * (t_i_k - t)) / (t_i_k - t_i_1)
    );
  }

  getPoint(t: number): Point {
    let res = new Point();

    for (let i = 0; i <= this.n; i++) {
      const coefficient = this.N(i, this.k, t);
      const control_point = this.p[i].copy();
      control_point.multiply_scalar(coefficient);
      res.add(control_point);
    }

    return res;
  }

  getWidth(): number {
    return this.n;
  }
}

export class BSpline extends ArtPiece {
  private drawLine(id: number) {
    const ctx = this.canvas.getContext2d();
    ctx.lineWidth = 0.25;
    ctx.strokeStyle = "rgba(100, 255, 255, 0.01)";
    ctx.fillStyle = ctx.strokeStyle;

    const middle = this.canvas.draw_height / 2;
    ctx.moveTo(0, middle);

    const nr_points = 16_000;
    const calculator = new BSplineCalc(this.canvas.random_pool, id);
    for (let i = 0; i < nr_points; i++) {
      const p = calculator.getPoint((i / nr_points) * calculator.getWidth());
      ctx.fillRect(
        (p.x / calculator.getWidth()) * this.canvas.draw_width,
        middle + p.y,
        1,
        1
      );
    }
  }

  draw() {
    const nr_lines = 10;
    for (let i = 0; i < nr_lines; i++) {
      this.drawLine(i);
    }
  }
}
