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

type penFunction = (pen: Pen) => void;

class DrawSequence {
  private readonly commands: penFunction[];

  constructor(commands: penFunction[]) {
    this.commands = commands;
  }

  execute(pen: Pen, start: number, times: number) {
    for (let i = 0; i < this.commands.length * times; i++) {
      this.commands[(start + i) % this.commands.length](pen);
    }
  }
}

export class Szpakowski extends ArtPiece {
  draw() {
    const ctx = this.canvas.getContext2d();
    ctx.beginPath();

    const pen = new Pen(ctx, 10, this.canvas.draw_width * 0.8);
    const largeHorizontal = 50;
    const smallHorizontal = 5;
    const largeVertical = 20;

    const zigZag = new DrawSequence([
      (pen: Pen) => pen.turn(-90),
      (pen: Pen) => pen.move(smallHorizontal),

      (pen: Pen) => pen.turn(-90),
      (pen: Pen) => pen.move(largeVertical),

      (pen: Pen) => pen.turn(90),
      (pen: Pen) => pen.move(smallHorizontal),

      (pen: Pen) => pen.turn(90),
      (pen: Pen) => pen.move(largeVertical),
    ]);

    const sequence = new DrawSequence([
      (pen: Pen) => pen.move(largeHorizontal),
      (pen: Pen) => pen.turn(-90),

      (pen: Pen) => pen.move(40),

      (pen: Pen) =>
        zigZag.execute(pen, 0, largeHorizontal / smallHorizontal / 2),

      (pen: Pen) => pen.move(largeVertical),
      (pen: Pen) => pen.turn(90),
      (pen: Pen) =>
        pen.move(largeHorizontal + smallHorizontal + largeHorizontal),

      (pen: Pen) => pen.turn(90),
      (pen: Pen) => pen.move(largeVertical),

      (pen: Pen) =>
        zigZag.execute(pen, 3, largeHorizontal / smallHorizontal / 2),

      (pen: Pen) => pen.move(largeVertical * 2),
      (pen: Pen) => pen.turn(-90),
      (pen: Pen) => pen.move(largeHorizontal + smallHorizontal),
    ]);

    sequence.execute(pen, 0, 3);

    ctx.stroke();
  }
}
