import { ArtPiece } from "./ArtPiece";
import { ArtCanvas } from "./App";

class MoiréUtils {
  fillCanvas(canvas: ArtCanvas): number {
    const ctx = canvas.getContext();
    const nr_rectangles = 6000;
    let random_index = 0;
    for (let i = 0; i < nr_rectangles; i++) {
      ctx.fillRect(
        canvas.state.random_pool[random_index++] * canvas.draw_width,
        canvas.state.random_pool[random_index++] * canvas.draw_height,
        3,
        3
      );
    }

    return nr_rectangles;
  }
}

export class Moiré1 extends ArtPiece {
  draw() {
    const ctx = this.canvas.getContext();
    const nr_rectangles = new MoiréUtils().fillCanvas(this.canvas);

    ctx.translate(this.canvas.draw_width / 2, this.canvas.draw_height / 2);
    ctx.rotate(this.canvas.state.parameterA * 0.006);
    ctx.translate(-this.canvas.draw_width / 2, -this.canvas.draw_height / 2);

    let random_index = 0;
    for (let i = 0; i < nr_rectangles; i++) {
      ctx.fillRect(
        this.canvas.state.random_pool[random_index++] * this.canvas.draw_width,
        this.canvas.state.random_pool[random_index++] * this.canvas.draw_height,
        3,
        3
      );
    }
  }
}

export class Moiré2 extends ArtPiece {
  draw() {
    const ctx = this.canvas.getContext();
    const nr_rectangles = new MoiréUtils().fillCanvas(this.canvas);

    ctx.translate(this.canvas.draw_width / 2, this.canvas.draw_height / 2);
    ctx.rotate(0.03);
    ctx.translate(-this.canvas.draw_width / 2, -this.canvas.draw_height / 2);

    let random_index = 0;
    const x_translation = (this.canvas.state.parameterA - 5) * 2;
    ctx.translate(x_translation, 0);
    for (let i = 0; i < nr_rectangles; i++) {
      ctx.fillRect(
        this.canvas.state.random_pool[random_index++] * this.canvas.draw_width,
        this.canvas.state.random_pool[random_index++] * this.canvas.draw_height,
        3,
        3
      );
    }
    ctx.translate(-x_translation, 0);
  }
}
