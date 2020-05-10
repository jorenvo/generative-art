import { ArtPiece } from "./ArtPiece";
import { ArtCanvas } from "./App";

export class Spirograph extends ArtPiece {
  private animation_id: number | undefined;
  private inner_circle_angle: number;
  private previous_frame_time: number | undefined;

  constructor(
    name: string,
    uses_random_pool: boolean,
    uses_parameter_b: boolean,
    canvas: ArtCanvas
  ) {
    super(name, uses_random_pool, uses_parameter_b, canvas);
    this.inner_circle_angle = 0;
  }

  draw() {
    const ctx = this.canvas.getContext2d();

    ctx.arc(
      this.canvas.draw_width / 2,
      this.canvas.draw_height / 2,
      this.canvas.draw_width / 2,
      0,
      2 * Math.PI
    );
    ctx.stroke();

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
      const speed = 5;
      this.inner_circle_angle +=
        (curr_frame_time - this.previous_frame_time) * speed;
    }

    this.previous_frame_time = curr_frame_time;
    this.stopAnimation();
    this.animation_id = requestAnimationFrame(this.drawLine.bind(this));
  }
}
