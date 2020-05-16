import { ArtPiece } from "./ArtPiece";
import { ArtCanvas } from "./App";
import { Point } from "./UtilPoint";
import { Gradient, Color } from "./UtilColor";
import { UtilCommon } from "./UtilCommon";

// idea: add a floodfill
export class Spirograph extends ArtPiece {
  private animation_id: number | undefined;
  private inner_gear_angle: number;
  private previous_frame_time: number | undefined;
  private ctx: CanvasRenderingContext2D;
  private center: Point;
  private outer_radius: number;
  private outer_circumference: number;
  private inner_radius: number;
  private inner_circumference: number;
  private pen: Point;
  private random_i: number;
  private rotations_around_large_gear: number;
  private drawing_scale: number;

  constructor(
    name: string,
    uses_random_pool: boolean,
    uses_parameter_a: boolean,
    uses_parameter_b: boolean,
    canvas: ArtCanvas
  ) {
    super(name, uses_random_pool, uses_parameter_a, uses_parameter_b, canvas);
    this.inner_gear_angle = 0;
    this.ctx = this.canvas.getContext2d();
    this.outer_radius = 0;
    this.outer_circumference = 0;
    this.center = new Point(
      this.canvas.draw_width / 2,
      this.canvas.draw_height / 2
    );
    this.random_i = 0;
    this.inner_radius = 0;
    this.inner_circumference = 0;
    this.rotations_around_large_gear = 0;
    this.drawing_scale = 0;
    this.pen = new Point();
    // this.gradient.addColorStop(0, new Color(97, 43, 152));
    // this.gradient.addColorStop(0.33, new Color(169, 47, 52));
    // this.gradient.addColorStop(0.66, new Color(117, 185, 57));
    // this.gradient.addColorStop(1, new Color(69, 192, 190));
  }

  private circumferenceCircle(radius: number) {
    return 2 * Math.PI * radius;
  }

  private radiusCircle(circumference: number) {
    return circumference / (2 * Math.PI);
  }

  private setupGears() {
    this.rotations_around_large_gear = 0;
    while (this.rotations_around_large_gear <= 4) {
      console.log("finding gears");
      this.inner_circumference =
        Math.floor(this.canvas.random_pool.get(this.random_i++) * 15) + 1;
      this.inner_radius = this.radiusCircle(this.inner_circumference);

      this.outer_circumference =
        Math.floor(this.canvas.random_pool.get(this.random_i++) * 31) + 1;
      this.outer_radius = this.radiusCircle(this.outer_circumference);

      if (this.outer_circumference <= this.inner_circumference) {
        continue;
      }

      this.rotations_around_large_gear =
        UtilCommon.lcm(this.inner_circumference, this.outer_circumference) /
        this.outer_circumference;
    }

    this.drawing_scale = this.canvas.draw_width / (2 * this.outer_radius);
    console.log(
      `Picked a small gear with circumference ${this.inner_circumference} (radius: ${this.inner_radius}), ` +
        `a large gear with circumference ${this.outer_circumference} (radius: ${this.outer_radius}) ` +
        `and ${this.rotations_around_large_gear} rotations around large gear.`
    );

    const random_angle =
      this.canvas.random_pool.get(this.random_i++) * 2 * Math.PI;
    const random_radius =
      this.canvas.random_pool.get(this.random_i++) *
      this.inner_radius *
      this.drawing_scale;

    this.pen = new Point(
      Math.cos(random_angle) * random_radius,
      Math.sin(random_angle) * random_radius
    );
  }

  draw() {
    this.stopAnimation();
    this.previous_frame_time = undefined;
    this.inner_gear_angle = 0;

    this.setupGears();
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

  private stopAnimation() {
    if (this.animation_id) {
      cancelAnimationFrame(this.animation_id);
      this.animation_id = undefined;
    }
  }

  private drawLine(curr_frame_time: number) {
    if (this.previous_frame_time !== undefined) {
      const speed = 0.005;
      const new_inner_gear_angle =
        this.inner_gear_angle +
        (curr_frame_time - this.previous_frame_time) * speed;

      const scaled_outer_radius = this.outer_radius * this.drawing_scale;
      const scaled_outer_circumference =
        this.outer_circumference * this.drawing_scale;
      const scaled_inner_radius = this.inner_radius * this.drawing_scale;
      const scaled_inner_circumference =
        this.inner_circumference * this.drawing_scale;

      for (
        ;
        this.inner_gear_angle <= new_inner_gear_angle;
        this.inner_gear_angle += 0.005
      ) {
        this.ctx.save();
        this.canvas.center();
        this.ctx.translate(this.center.x, this.center.y);

        // rotate the small gear in the large gear
        this.ctx.rotate(this.inner_gear_angle);

        // put the small gear against the large gear
        this.ctx.translate(scaled_outer_radius - scaled_inner_radius, 0);
        // this.ctx.beginPath();
        // this.ctx.arc(0, 0, this.inner_radius, 0, 2 * Math.PI);
        // this.ctx.closePath();
        // this.ctx.strokeStyle = "red";
        // this.ctx.stroke();

        // rotate the pen in the small gear
        const outer_circumference_traveled_ratio =
          this.inner_gear_angle / (2 * Math.PI);
        const outer_circumference_length =
          scaled_outer_circumference * outer_circumference_traveled_ratio;

        const inner_gear_ratio =
          outer_circumference_length / scaled_inner_circumference;
        const inner_gear_rotation_angle = 2 * Math.PI * inner_gear_ratio;
        this.ctx.rotate(inner_gear_rotation_angle);

        this.ctx.fillRect(this.pen.x, this.pen.y, 1, 1);

        // window.setTimeout(() => this.stopAnimation(), 1500);
        this.ctx.restore();

        if (
          this.inner_gear_angle >=
          this.rotations_around_large_gear * 2 * Math.PI
        ) {
          console.log(`stopped after ${this.inner_gear_angle}`);
          this.stopAnimation();
          return;
        }
      }
    }

    this.previous_frame_time = curr_frame_time;
    this.stopAnimation();
    this.animation_id = requestAnimationFrame(this.drawLine.bind(this));
  }
}
