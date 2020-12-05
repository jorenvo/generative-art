import { ArtPiece } from "./ArtPiece";
import Rune from "rune.js";

export class Bezier extends ArtPiece {
  draw() {
    const r = new Rune({
      container: "#runeContainer",
      width: 500,
      height: 400
    });

    const total = 20;
    for (let i = 0; i < total; i++) {
      r.path(0, 100)
        .fill("none")
        .curveTo(200 + i * 8, 200 - ((400 / total) * i), 400, 0);
    }

    r.draw();
  }
}
