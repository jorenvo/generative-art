import { ArtCanvas } from "./App";
import { ArtPiece } from "./ArtPiece";
import { Color } from "./UtilColor";
import { Point } from "./UtilPoint";

/**
 * +-------------------+
 * |                   |
 * |    moving block   |
 * |            +------|
 * |            | atom |
 * +------------+------+
 *
 * Move one atom at a time. Atoms can be mixed. When doing
 * diagonal lines the moving block concept won't work.
 */

class Atom {
  pos: Point;
  color: Color;

  constructor(row: number, col: number, r: number, g: number, b: number) {
    this.pos = new Point(col, row);
    this.color = new Color(r, g, b);
  }
}

class DisarrangementAnimation {
  private canvas: ArtCanvas;
  private prev_render_ms: number;
  private animation_id: number | undefined;
  private atoms_side: number;
  private atoms: Atom[];
  private ms_per_frame: number;
  private first_x: boolean;

  constructor(canvas: ArtCanvas) {
    this.canvas = canvas;
    this.prev_render_ms = 0;
    this.atoms_side = 40;
    this.atoms = this.createAtoms();
    this.ms_per_frame = 300;
    this.first_x = true;
  }

  private createAtoms(): Atom[] {
    const atoms = [];

    for (let row = 0; row < this.atoms_side; row++) {
      for (let col = 0; col < this.atoms_side; col++) {
        let color =
          150 + this.canvas.random_pool.get(row * this.atoms_side + col) * 105;

        if (row === 10) {
          color = 10;
        }

        if (col === 10) {
          color = 240;
        }

        atoms.push(new Atom(row, col, color, color, color));
      }
    }

    return atoms;
  }

  private getAtomSize(): number {
    return this.canvas.draw_width / this.atoms_side;
  }

  private renderFrame(time_ms: number) {
    if (time_ms - this.prev_render_ms >= this.ms_per_frame) {
      this.prev_render_ms = time_ms;

      const ctx = this.canvas.getContext2d();
      const size = this.getAtomSize();

      ctx.save();
      this.canvas.clear();
      this.canvas.center();

      this.atoms.forEach((atom: Atom) => {
        if (this.first_x) {
          if (atom.pos.x === 10) {
            atom.pos.y = (atom.pos.y + 1) % this.atoms_side;
          }

          if (atom.pos.y === 10) {
            atom.pos.x = (atom.pos.x + 1) % this.atoms_side;
          }
        } else {
          if (atom.pos.y === 10) {
            atom.pos.x = (atom.pos.x + 1) % this.atoms_side;
          }

          if (atom.pos.x === 10) {
            atom.pos.y = (atom.pos.y + 1) % this.atoms_side;
          }
        }

        ctx.fillStyle = atom.color.toString();

        const x = atom.pos.x * size + size / 2;
        const y = atom.pos.y * size + size / 2;
        ctx.fillRect(x, y, size, size);
      });

      this.first_x = !this.first_x;

      ctx.restore();
    }
    this.animation_id = requestAnimationFrame(this.renderFrame.bind(this));
  }

  cleanUp() {
    this.canvas.setHoverText("");
    if (this.animation_id) {
      cancelAnimationFrame(this.animation_id);
      this.animation_id = undefined;
    }
  }

  start() {
    if (this.animation_id) {
      cancelAnimationFrame(this.animation_id);
    }

    this.atoms = this.createAtoms();

    this.canvas.setHoverText(
      "Inspired by Sabotage by Kim Asendorf (https://sabotage.kim)"
    );
    this.animation_id = requestAnimationFrame(this.renderFrame.bind(this));
  }
}

export class Disarrangement extends ArtPiece {
  private animation: DisarrangementAnimation | undefined;

  cleanUp() {
    super.cleanUp();
    this.animation!.cleanUp();
  }

  draw() {
    this.animation = new DisarrangementAnimation(this.canvas);
    this.animation.start();
  }
}
