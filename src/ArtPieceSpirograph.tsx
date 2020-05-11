import { ArtPiece } from "./ArtPiece";
import { ArtCanvas } from "./App";
import { Point } from "./UtilPoint";
import { Gradient, Color } from "./UtilColor";
import { UtilCommon } from "./UtilCommon";

export class Spirograph extends ArtPiece {
  private animation_id: number | undefined;
  private inner_circle_angle: number;
  private previous_frame_time: number | undefined;
  private ctx: CanvasRenderingContext2D;
  private center: Point;
  private outer_radius: number;
  private outer_circumference: number;
  private inner_radius: number;
  private inner_circumference: number;
  private pen: Point;
  private random_i: number;
  private first_transform: DOMMatrix | undefined;

  constructor(
    name: string,
    uses_random_pool: boolean,
    uses_parameter_b: boolean,
    canvas: ArtCanvas
  ) {
    super(name, uses_random_pool, uses_parameter_b, canvas);
    this.inner_circle_angle = 0;
    this.ctx = this.canvas.getContext2d();
    this.outer_radius = this.canvas.draw_width / 2;
    this.outer_circumference = this.circumferenceCircle(this.outer_radius);
    this.center = new Point(
      this.canvas.draw_width / 2,
      this.canvas.draw_height / 2
    );
    this.random_i = 0;
    this.inner_radius = 0;
    this.inner_circumference = 0;
    this.pen = new Point();
    // this.gradient.addColorStop(0, new Color(97, 43, 152));
    // this.gradient.addColorStop(0.33, new Color(169, 47, 52));
    // this.gradient.addColorStop(0.66, new Color(117, 185, 57));
    // this.gradient.addColorStop(1, new Color(69, 192, 190));
  }

  private circumferenceCircle(r: number) {
    return 2 * Math.PI * r;
  }

  private gcd(a: number, b: number): number {
    if (UtilCommon.almostEqual(b, 0)) {
      return a;
    }

    return this.gcd(b, a % b);
  }

  setupInnerCircle() {
    this.inner_radius =
      this.outer_radius * (0.11 + (this.canvas.state.parameter_a / 10) * 0.79);
    this.inner_circumference = this.circumferenceCircle(this.inner_radius);

    const random_angle =
      this.canvas.random_pool.get(this.random_i++) * 2 * Math.PI;
    const random_radius =
      this.canvas.random_pool.get(this.random_i++) * this.inner_radius;
    this.pen = new Point(
      Math.cos(random_angle) * random_radius,
      Math.sin(random_angle) * random_radius
    );
    this.first_transform = undefined;

    const a = this.outer_circumference;
    const b = this.inner_circumference;
    console.log((a * this.gcd(a, b)) / b);
  }

  draw() {
    this.stopAnimation();
    this.inner_circle_angle = 0;
    this.setupInnerCircle();
    // this.ctx.beginPath();
    // this.ctx.arc(
    //   this.center.x,
    //   this.center.y,
    //   this.outer_radius,
    //   0,
    //   2 * Math.PI
    // );
    // this.ctx.closePath();
    // this.ctx.stroke();

    this.animation_id = requestAnimationFrame(this.drawLine.bind(this));
  }

  cleanUp() {
    super.cleanUp();
    this.stopAnimation();
  }

  stopAnimation() {
    if (this.animation_id) {
      cancelAnimationFrame(this.animation_id);
      this.animation_id = undefined;
    }
  }

  private transforms_are_equal(a: DOMMatrix, b: DOMMatrix) {
    const epsilon = 0.02;
    return (
      UtilCommon.almostEqual(a.a, b.a, epsilon) &&
      UtilCommon.almostEqual(a.b, b.b, epsilon) &&
      UtilCommon.almostEqual(a.c, b.c, epsilon) &&
      UtilCommon.almostEqual(a.d, b.d, epsilon) &&
      UtilCommon.almostEqual(a.e, b.e, epsilon)
    );
  }

  drawLine(curr_frame_time: number) {
    if (this.previous_frame_time !== undefined) {
      const speed = 0.005;
      const new_inner_circle_angle =
        this.inner_circle_angle +
        (curr_frame_time - this.previous_frame_time) * speed;

      for (
        ;
        this.inner_circle_angle <= new_inner_circle_angle;
        this.inner_circle_angle += 0.01
      ) {
        this.ctx.save();
        this.canvas.center();
        this.ctx.translate(this.center.x, this.center.y);

        // rotate the small gear in the large gear
        this.ctx.rotate(this.inner_circle_angle);

        // put the small gear against the large gear
        this.ctx.translate(this.outer_radius - this.inner_radius, 0);
        // this.ctx.beginPath();
        // this.ctx.arc(0, 0, this.inner_radius, 0, 2 * Math.PI);
        // this.ctx.closePath();
        // this.ctx.strokeStyle = "red";
        // this.ctx.stroke();

        // rotate the pen in the small gear
        const outer_circumference_traveled_ratio =
          this.inner_circle_angle / (2 * Math.PI);
        const outer_circumference_length =
          this.outer_circumference * outer_circumference_traveled_ratio;

        const inner_circle_ratio =
          outer_circumference_length / this.inner_circumference;
        const inner_circle_rotation_angle = 2 * Math.PI * inner_circle_ratio;
        this.ctx.rotate(inner_circle_rotation_angle);
        this.ctx.fillRect(this.pen.x, this.pen.y, 1, 1);

        const current_transform = this.ctx.getTransform();
        if (!this.first_transform) {
          this.first_transform = current_transform;
        } else if (
          this.transforms_are_equal(this.first_transform, current_transform)
        ) {
          console.log("stopped");
          this.ctx.restore();
          this.stopAnimation();
          return;
        }
        // window.setTimeout(() => this.stopAnimation(), 1500);
        this.ctx.restore();
      }
    }

    this.previous_frame_time = curr_frame_time;
    this.stopAnimation();
    this.animation_id = requestAnimationFrame(this.drawLine.bind(this));
  }
}
