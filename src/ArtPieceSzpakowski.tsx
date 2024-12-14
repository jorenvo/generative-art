import { ArtPiece } from "./ArtPiece";
import { ArtCanvas } from "./App";

// https://www.contemporaryartlibrary.org/project/marian-szpakowski-waclaw-szpakowski-at-galeria-dawid-radziszewski-warsaw-32934/13
// https://www.contemporaryartlibrary.org/project/circulation-at-galerie-meyer-kainer-vienna-11931/12
// https://www.contemporaryartlibrary.org/project/circulation-at-galerie-meyer-kainer-vienna-11931/29
// https://www.contemporaryartlibrary.org/artist/waclaw-szpakowski-16958

class Pen {
  private ctx: CanvasRenderingContext2D | undefined;
  private orientation: number;
  private col: number;
  private row: number;
  public minCol: number;
  public minRow: number;
  public maxCol: number;
  public maxRow: number;

  constructor(
    col: number = 0,
    row: number = 0,
    ctx: CanvasRenderingContext2D | undefined = undefined
  ) {
    this.orientation = 0;
    this.col = col;
    this.row = row;
    this.minCol = Infinity;
    this.minRow = Infinity;
    this.maxCol = -Infinity;
    this.maxRow = -Infinity;

    this.ctx = ctx;
    if (this.ctx) {
      this.ctx.moveTo(this.col, this.row);
    }
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

    this.minCol = Math.min(this.minCol, this.col);
    this.minRow = Math.min(this.minRow, this.row);
    this.maxCol = Math.max(this.maxCol, this.col);
    this.maxRow = Math.max(this.maxRow, this.row);

    if (this.ctx) {
      this.ctx.lineTo(this.col, this.row);
    }
  }
}

type PenFunction = (pen: Pen) => void;

class DrawSequence {
  private readonly commands: PenFunction[];

  constructor(commands: PenFunction[]) {
    this.commands = commands;
  }

  execute(
    pen: Pen,
    start: number,
    times: number,
    spacer: PenFunction = (_: Pen) => {}
  ) {
    for (let i = 0; i < this.commands.length * times; i++) {
      const commandIndex = (start + i) % this.commands.length;
      this.commands[commandIndex](pen);
      if (i > 0 && i % this.commands.length === 0) {
        spacer(pen);
      }
    }
  }
}

class Drawing {
  private readonly ctx: CanvasRenderingContext2D;
  private readonly canvas: ArtCanvas;
  private readonly sequence: DrawSequence;

  constructor(
    ctx: CanvasRenderingContext2D,
    canvas: ArtCanvas,
    sequence: DrawSequence
  ) {
    this.ctx = ctx;
    this.canvas = canvas;
    this.sequence = sequence;
  }

  draw(times: number, spacer: PenFunction = (_: Pen) => {}) {
    const ghostPen = new Pen();
    this.sequence.execute(ghostPen, 0, times, spacer);
    console.log(
      ghostPen.minCol,
      ghostPen.maxCol,
      ghostPen.minRow,
      ghostPen.maxRow
    );

    const halfWidth = (ghostPen.maxCol - ghostPen.minCol) / 2;
    const halfHeight = (ghostPen.maxRow - ghostPen.minRow) / 2;

    const pen = new Pen(
      this.canvas.draw_width / 2 - halfWidth,
      this.canvas.draw_height / 2 - halfHeight,
      this.ctx
    );
    this.sequence.execute(pen, 0, times, spacer);
    this.ctx.stroke();
  }
}

export class Szpakowski extends ArtPiece {
  draw() {
    const ctx = this.canvas.getContext2d();
    ctx.beginPath();

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
      (pen: Pen) => pen.move(largeHorizontal),
    ]);

    const drawing = new Drawing(ctx, this.canvas, sequence);
    drawing.draw(3, (pen: Pen) => pen.move(smallHorizontal));
  }
}
