import { ArtPiece } from "./ArtPiece";

export class Diamond extends ArtPiece {
    draw() {
        const ctx = this.canvas.getContext();
        const x = 2 * this.canvas.state.parameterA + 2;
        const scale = 200;
    
        ctx.beginPath();
        for (let i = 0; i < x; i++) {
          for (let j = 0; j < x; j++) {
            ctx.save();
            ctx.translate(this.canvas.draw_width / 2, this.canvas.draw_height / 2);
            ctx.moveTo(Math.sin(i) * scale, 0); // [-1, 1] * scale => [-scale, scale]
            ctx.lineTo(0, Math.sin(j) * scale);
            ctx.restore();
          }
        }
        ctx.stroke();
    }
}