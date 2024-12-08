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
  sequences: DrawSequence[] | undefined;
  command: penFunction | undefined;

  constructor(
    command: penFunction | undefined,
    sequences: DrawSequence[] = []
  ) {
    this.sequences = sequences;
    this.command = command;
  }

  execute(pen: Pen, start: number, times: number) {
    if (this.command) {
      this.command(pen);
    } else if (this.sequences) {
      for (let i = 0; i < this.sequences.length * times; i++) {
        this.sequences[(start + i) % this.sequences.length].execute(
          pen,
          start,
          times
        );
      }
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

    const zigZag = new DrawSequence(undefined, [
      new DrawSequence((pen: Pen) => pen.turn(-90)),
      new DrawSequence((pen: Pen) => pen.move(smallHorizontal)),

      new DrawSequence((pen: Pen) => pen.turn(-90)),
      new DrawSequence((pen: Pen) => pen.move(largeVertical)),

      new DrawSequence((pen: Pen) => pen.turn(90)),
      new DrawSequence((pen: Pen) => pen.move(smallHorizontal)),

      new DrawSequence((pen: Pen) => pen.turn(90)),
      new DrawSequence((pen: Pen) => pen.move(largeVertical)),
    ]);

    const sequence = new DrawSequence(undefined, [
      new DrawSequence((pen: Pen) => pen.move(largeHorizontal)),
      new DrawSequence((pen: Pen) => pen.turn(-90)),

      new DrawSequence((pen: Pen) => pen.move(40)),

      new DrawSequence((pen: Pen) =>
        zigZag.execute(pen, 0, largeHorizontal / smallHorizontal / 2)
      ),

      new DrawSequence((pen: Pen) => pen.move(largeVertical)),
      new DrawSequence((pen: Pen) => pen.turn(90)),
      new DrawSequence((pen: Pen) =>
        pen.move(largeHorizontal + smallHorizontal + largeHorizontal)
      ),

      new DrawSequence((pen: Pen) => pen.turn(90)),
      new DrawSequence((pen: Pen) => pen.move(largeVertical)),

      new DrawSequence((pen: Pen) =>
        zigZag.execute(pen, 3, largeHorizontal / smallHorizontal / 2)
      ),

      new DrawSequence((pen: Pen) => pen.move(largeVertical * 2)),
      new DrawSequence((pen: Pen) => pen.turn(-90)),
      new DrawSequence((pen: Pen) =>
        pen.move(largeHorizontal + smallHorizontal)
      ),
    ]);

    sequence.execute(pen, 0, 3);

    ctx.stroke();
  }
}
