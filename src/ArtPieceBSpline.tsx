import { ArtPiece } from "./ArtPiece";
import { RandomPool } from "./RandomPool";
import { Point } from "./UtilPoint";

// Ni,k(t) = Ni,k-1(t) (t - ti )/(ti+k-1 - ti ) + Ni+1,k-1(t) (ti+k - t)/(ti+k - ti+1 ) ,
// Ni,1 = {1   if   ti ≤ t ≤ ti+1 ,    0   otherwise }

class BSplineCalc {
  // assume knot vector is:
  // [0, 1, ..., n]
  // this turns t_i into i

  private k: number; // order
  private p: Point[]; // control points
  private n: number; // max control point index

  constructor(control_points: Point[]) {
    this.k = 3;
    this.p = control_points;
    this.n = this.p.length - 1;
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
  private controlPoints(): Point[][] {
    const nr_nodes = 10;
    const nr_points_per_node = 3;
    const nr_point_derivatives = 10;
    const node_distance = this.canvas.draw_width / nr_nodes;

    const lines: Point[][] = [];
    for (let i = 0; i < nr_points_per_node * nr_point_derivatives; i++) {
      lines.push([]);
    }

    for (let node = 0; node < nr_nodes; node++) {
      const diverging_points = this.canvas.random_pool.get(node) > 0.7;
      const x = node_distance * node;

      for (let point = 0; point < nr_points_per_node; point++) {
        let y = this.canvas.draw_height / 2;
        if (diverging_points) {
          const multiplier = 10;
          y +=
            this.canvas.random_pool.get(node * nr_points_per_node + point) *
            multiplier;
        }

        const derivative_strength = this.canvas.random_pool.get(
          node * nr_points_per_node + point + 8011
        );
        for (
          let derivative = 0;
          derivative < nr_point_derivatives;
          derivative++
        ) {
          // TODO wrong random
          const diverge_offset = this.canvas.random_pool.get(
            node * nr_points_per_node * point * nr_points_per_node + derivative
          );
          lines[point * nr_point_derivatives + derivative].push(
            new Point(
              x / this.canvas.draw_width,
              y + diverge_offset * derivative_strength
            )
          );
        }
      }
    }

    return lines;
  }

  private drawLine(control_points: Point[]) {
    const ctx = this.canvas.getContext2d();
    ctx.lineWidth = 0.25;
    // ctx.strokeStyle = "rgba(100, 255, 255, 0.01)";
    // ctx.fillStyle = ctx.strokeStyle;

    const nr_points = 1000;
    const calculator = new BSplineCalc(control_points);
    for (let i = 0; i < nr_points; i++) {
      const t = (i / nr_points) * calculator.getWidth();
      const p = calculator.getPoint(t);
      p.x = (p.x / calculator.getWidth()) * this.canvas.draw_width;
      p.x *= 10;
      console.log(t, "=>", p.x, p.y);
      // if (p.x >= 1) throw new Error("ueao");
      ctx.fillRect(p.x, p.y, 1, 1);
    }
  }

  draw() {
    let control_points = this.controlPoints();

    control_points = [control_points[0]]; // TODO temp
    console.log(control_points[0]);

    control_points.forEach((line) => {
      this.drawLine(line);
    });
  }
}
