import { ArtPiece } from "./ArtPiece";
import { RandomPool } from "./RandomPool";

// Ni,k(t) = Ni,k-1(t) (t - ti )/(ti+k-1 - ti ) + Ni+1,k-1(t) (ti+k - t)/(ti+k - ti+1 ) ,
// Ni,1 = {1   if   ti ≤ t ≤ ti+1 ,    0   otherwise }

class BSplineCalc {
  // assume knot vector is:
  // [0, 1, ..., n]
  // this turns t_i into i

  private k: number; // order
  private p: number[]; // control points
  private n: number; // max control point index

  constructor(random_pool: RandomPool) {
    this.k = 3;

    // this.p = [];
    // for (let i = 0; i <= 2; i++) {
    //   for (let dup = 0; dup < 10; dup++) {
    //     this.p.push(0);
    //   }
    //   this.p.push(i);
    // }
    this.p = [];
    for (let i = 0; i < 30; i++) {
      let x = i * 8;
      if (i % 2) {
        x *= -1;
      }
      this.p.push(x);
    }
    console.log(this.p);
    // this.p = [0, 10, 15, 30, -40, 50, -60];
    // this.p = this.p.map((v) => v * 10);
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

  getPoint(t: number): number {
    let res = 0;

    for (let i = 0; i <= this.n; i++) {
      res += this.N(i, this.k, t) * this.p[i];
    }

    return res;
  }

  getWidth(): number {
    return this.n;
  }
}

export class BSpline extends ArtPiece {
  draw() {
    const ctx = this.canvas.getContext2d();
    ctx.lineWidth = 0.25;
    ctx.strokeStyle = "rgba(0, 0, 0, 0.3)";

    const middle = this.canvas.draw_height / 2;
    ctx.moveTo(0, middle);

    const nr_points = 1_000;
    const calculator = new BSplineCalc(this.canvas.random_pool);
    for (let i = 0; i < nr_points; i++) {
      const p = calculator.getPoint((i / nr_points) * calculator.getWidth());
      ctx.fillRect((i / nr_points) * this.canvas.draw_width, middle + p, 1, 1);
      // ctx.lineTo(i, middle + p);
      // ctx.stroke();
    }
  }
}
