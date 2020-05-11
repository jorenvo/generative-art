import { ArtPiece } from "./ArtPiece";
import { ArtCanvas } from "./App";
import { Point } from "./UtilPoint";

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
  private last_point: Point;
  private gradient: CanvasGradient;

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
    this.inner_radius = this.outer_radius * 0.51;
    this.inner_circumference = this.circumferenceCircle(this.inner_radius);

    const random_angle =
      this.canvas.random_pool.get(this.random_i++) * 2 * Math.PI;
    const random_radius =
      this.canvas.random_pool.get(this.random_i++) * this.inner_radius;
    this.pen = new Point(
      Math.cos(random_angle) * random_radius,
      Math.sin(random_angle) * random_radius
    );
    this.last_point = new Point();
    this.gradient = this.ctx.createRadialGradient(
      0,
      0,
      0,
      0,
      0,
      this.outer_radius
    );
    this.gradient.addColorStop(0, "#A59640");
    this.gradient.addColorStop(0.25, "#41B46A");
    this.gradient.addColorStop(0.5, "#4456C1");
    this.gradient.addColorStop(0.75, "#C84D9C");
  }

  private circumferenceCircle(r: number) {
    return 2 * Math.PI * r;
  }

  draw() {
    this.ctx.beginPath();
    this.ctx.arc(
      this.center.x,
      this.center.y,
      this.outer_radius,
      0,
      2 * Math.PI
    );
    this.ctx.closePath();
    this.ctx.stroke();

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

  drawLine(curr_frame_time: number) {
    if (this.previous_frame_time !== undefined) {
      const speed = 0.001;
      this.inner_circle_angle +=
        (curr_frame_time - this.previous_frame_time) * speed;

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
      this.ctx.fillStyle = this.gradient;

      this.ctx.fillRect(this.pen.x, this.pen.y, 1, 1);
      this.ctx.restore();
      return;
      // window.setTimeout(() => this.stopAnimation(), 3000);
    }

    this.previous_frame_time = curr_frame_time;
    this.stopAnimation();
    this.animation_id = requestAnimationFrame(this.drawLine.bind(this));
  }
}
