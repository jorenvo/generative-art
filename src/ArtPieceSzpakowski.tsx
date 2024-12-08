import { ArtPiece } from "./ArtPiece";

// https://www.contemporaryartlibrary.org/project/marian-szpakowski-waclaw-szpakowski-at-galeria-dawid-radziszewski-warsaw-32934/13
// https://www.contemporaryartlibrary.org/project/circulation-at-galerie-meyer-kainer-vienna-11931/12
// https://www.contemporaryartlibrary.org/project/circulation-at-galerie-meyer-kainer-vienna-11931/29
// https://www.contemporaryartlibrary.org/artist/waclaw-szpakowski-16958

class Pen {
  private ctx: CanvasRenderingContext2D;
  private orientation: number;
  private col: number;
  private row: number;

  constructor(ctx: CanvasRenderingContext2D, col: number, row: number) {
    this.ctx = ctx;
    this.orientation = 0;
    this.col = col;
    this.row = row;
    this.ctx.moveTo(this.col, this.row);
  }

  private degreesToRadians(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }

  public turn(degrees: number) {
    this.orientation += this.degreesToRadians(degrees);
  }

  public move(distance: number) {
    this.col += Math.cos(this.orientation) * distance;
    this.row += Math.sin(this.orientation) * distance;
    this.ctx.lineTo(this.col, this.row);
  }
}

export class Szpakowski extends ArtPiece {
  draw() {
    const ctx = this.canvas.getContext2d();
    ctx.beginPath();

    const pen = new Pen(ctx, 10, this.canvas.draw_width * 0.8);

    for (let i2 = 0; i2 < 3; ++i2) {
      const largeHorizontal = 50;
      pen.move(largeHorizontal);

      pen.turn(-90);
      pen.move(40);

      const smallHorizontal = 5;
      const largeVertical = 20;

      for (let i = 0; i < largeHorizontal / smallHorizontal / 2; i++) {
        pen.turn(-90);
        pen.move(smallHorizontal);

        pen.turn(-90);
        pen.move(largeVertical);

        pen.turn(90);
        pen.move(smallHorizontal);

        pen.turn(90);
        pen.move(largeVertical);
      }

      pen.move(largeVertical);
      pen.turn(90);
      pen.move(largeHorizontal + smallHorizontal + largeHorizontal);

      pen.turn(90);
      pen.move(largeVertical);

      for (let i = 0; i < largeHorizontal / smallHorizontal / 2; i++) {
        pen.move(largeVertical);

        pen.turn(90);
        pen.move(smallHorizontal);

        pen.turn(90);
        pen.move(largeVertical);

        pen.turn(-90);
        pen.move(smallHorizontal);

        pen.turn(-90);
      }

      pen.move(largeVertical * 2);
      pen.turn(-90);
      pen.move(largeHorizontal + smallHorizontal);
    }

    ctx.stroke();
  }
}
