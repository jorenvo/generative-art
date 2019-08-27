import React from "react";
import "./App.css";

enum ArtType {
  Schotter,
  Linien,
  Diamond,
  Moiré1,
  Moiré2
}

interface ArtCanvasState {
  type: ArtType;
  parameterA: number;
}

class ArtCanvas extends React.Component<{}, ArtCanvasState> {
  element: React.RefObject<HTMLCanvasElement>;
  ctx: CanvasRenderingContext2D | undefined;
  draw_width: number;
  width: number;
  draw_height: number;
  height: number;
  margin: number;
  dom_element: HTMLCanvasElement | undefined;
  random_rects: [number, number, number, number][];

  constructor(props: any) {
    super(props);
    this.element = React.createRef();
    this.margin = 100;

    this.draw_width = 400;
    this.width = this.draw_width + this.margin;
    this.draw_height = 500;
    this.height = this.draw_height + this.margin;
    this.random_rects = [];

    this.state = {
      type: ArtType.Moiré2,
      parameterA: 5
    };
  }

  componentDidMount() {
    this.dom_element = this.element.current!;
    this.dom_element.width = this.width;
    this.dom_element.height = this.height;

    const ctx = this.dom_element.getContext("2d");
    if (!ctx) {
      console.error("Could not get context for canvas.");
    } else {
      this.ctx = ctx;
    }

    this.drawArt();
  }

  componentDidUpdate() {
    this.drawArt();
  }

  drawArt() {
    const ctx = this.ctx!;
    ctx.clearRect(0, 0, this.width, this.height);

    ctx.save();
    // add margin
    ctx.translate(this.margin / 2, this.margin / 2);

    switch (this.state.type) {
      case ArtType.Schotter: {
        this.drawArtSchotter();
        break;
      }
      case ArtType.Linien: {
        this.drawArtLinien();
        break;
      }
      case ArtType.Diamond: {
        this.drawArtDiamond();
        break;
      }
      case ArtType.Moiré1: {
        this.drawArtMoiré1();
        break;
      }
      case ArtType.Moiré2: {
        this.drawArtMoiré2();
        break;
      }
    }
    ctx.restore();
  }

  drawArtSchotter() {
    const ctx = this.ctx!;
    const rect_per_row = 20;
    const rect_per_col = rect_per_row * (this.height / this.width);

    const rect_width = this.draw_width / rect_per_row;
    const rect_height = this.draw_height / rect_per_col;

    for (let row = 0; row < rect_per_col; row++) {
      const random_scale = row / (7.5 / this.state.parameterA);

      for (let col = 0; col < rect_per_row; col++) {
        ctx.save();

        const offset_col = col * rect_width;
        const offset_row = row * rect_height;

        // translate to origin
        ctx.translate(
          offset_col + rect_width / 2,
          offset_row + rect_height / 2
        );

        const random_angle = 0.01 * random_scale;
        if (Math.random() > 0.5) ctx.rotate(random_angle);
        else ctx.rotate(-random_angle);

        // translate back
        ctx.translate(
          -offset_col - rect_width / 2,
          -offset_row - rect_height / 2
        );

        ctx.translate(
          Math.random() * random_scale,
          Math.random() * random_scale
        );
        ctx.strokeRect(offset_col, offset_row, rect_width, rect_height);
        ctx.restore();
      }
    }
  }

  drawArtLinien() {
    const ctx = this.ctx!;
    ctx.beginPath();

    const rect_per_row = 20;
    const rect_per_col = Math.floor(rect_per_row * (this.height / this.width));

    const rect_width = this.draw_width / rect_per_row;
    const rect_height = this.draw_height / rect_per_col;

    const coordinates: [number, number][] = [];
    for (let col = 0; col < rect_per_row + 1; col++) {
      const straight_next_x = col * rect_width;
      coordinates.push([straight_next_x, 0]);
    }

    for (let row = 0; row < rect_per_col; row++) {
      const peak = rect_per_col / 2;
      let random_scale_row = row;
      if (row > peak) {
        random_scale_row = rect_per_col - row - 2;
      }

      coordinates[rect_per_row] = [
        rect_width * rect_per_row,
        row * rect_height
      ];

      for (let col = 0; col < rect_per_row; col++) {
        const peak = rect_per_row / 2;
        let random_scale_col = col;
        if (col > peak) {
          random_scale_col = rect_per_row - col - 0.5;
        }

        let random_scale =
          (random_scale_row * random_scale_col) / (10 / this.state.parameterA);
        if (row === rect_per_col - 1) {
          random_scale = 1;
        }

        ctx.moveTo(...coordinates[col]);
        ctx.lineTo(...coordinates[col + 1]);
        ctx.stroke();

        // vertical to next row, don't draw next line if on last row
        if (row < rect_per_col) {
          const new_row_x =
            col * rect_width + (Math.random() - 0.5) * random_scale;
          const new_row_y =
            row * rect_height +
            rect_height +
            (Math.random() - 0.5) * random_scale;

          ctx.moveTo(...coordinates[col]);
          ctx.lineTo(new_row_x, new_row_y);
          ctx.stroke();

          coordinates[col] = [new_row_x, new_row_y];
        }
      }

      // draw last vertical lines
      if (row < rect_per_col) {
        ctx.moveTo(rect_per_row * rect_width, row * rect_height);
        ctx.lineTo(rect_per_row * rect_width, row * rect_height + rect_height);
        ctx.stroke();
      }
    }

    coordinates[rect_per_row] = [
      rect_width * rect_per_row,
      rect_height * rect_per_col
    ];
    // draw last horizontal lines
    for (let col = 0; col < rect_per_row; col++) {
      ctx.moveTo(...coordinates[col]);
      ctx.lineTo(...coordinates[col + 1]);
      ctx.stroke();
    }

    ctx.closePath();
  }

  drawArtDiamond() {
    const ctx = this.ctx!;
    const x = 2 * this.state.parameterA + 2;
    const scale = 200;

    ctx.beginPath();
    for (let i = 0; i < x; i++) {
      for (let j = 0; j < x; j++) {
        ctx.save();
        ctx.translate(this.draw_width / 2, this.draw_height / 2);
        ctx.moveTo(Math.sin(i) * scale, 0); // [-1, 1] * scale => [-scale, scale]
        ctx.lineTo(0, Math.sin(j) * scale);
        ctx.stroke();
        ctx.restore();
      }
    }
  }

  drawArtMoiré1() {
    const ctx = this.ctx!;
    if (this.random_rects.length === 0) {
      for (let i = 0; i < 6000; i++) {
        this.random_rects.push([
          Math.random() * this.draw_width,
          Math.random() * this.draw_height,
          3,
          3
        ]);
      }
    }

    for (let rect of this.random_rects) {
      ctx.fillRect(...rect);
    }

    ctx.translate(this.draw_width / 2, this.draw_height / 2);
    ctx.rotate(this.state.parameterA * 0.006);
    ctx.translate(-this.draw_width / 2, -this.draw_height / 2);

    for (let rect of this.random_rects) {
      ctx.fillRect(...rect);
    }
  }

  drawArtMoiré2() {
    const ctx = this.ctx!;
    if (this.random_rects.length === 0) {
      for (let i = 0; i < 6000; i++) {
        this.random_rects.push([
          Math.random() * this.draw_width,
          Math.random() * this.draw_height,
          3,
          3
        ]);
      }
    }

    for (let rect of this.random_rects) {
      ctx.fillRect(...rect);
    }

    ctx.translate(this.draw_width / 2, this.draw_height / 2);
    ctx.rotate(0.03);
    ctx.translate(-this.draw_width / 2, -this.draw_height / 2);

    const x_translation = (this.state.parameterA - 5) * 2;
    ctx.translate(x_translation, 0);
    for (let rect of this.random_rects) {
      ctx.fillRect(...rect);
    }
    ctx.translate(-x_translation, 0);
  }

  stringToArtType(s: string): ArtType {
    return ArtType[ArtType[Number(s)] as keyof typeof ArtType];
  }

  render(): React.ReactNode {
    return (
      <div>
        <canvas className="ArtCanvas" ref={this.element} />
        <select
          defaultValue={String(this.state.type)}
          onChange={event =>
            this.setState({
              type: this.stringToArtType(event.target.value)
            })
          }
        >
          <option value={ArtType.Schotter}>Schotter</option>
          <option value={ArtType.Linien}>Linien</option>
          <option value={ArtType.Diamond}>Diamond</option>
          <option value={ArtType.Moiré1}>Moiré 1.</option>
          <option value={ArtType.Moiré2}>Moiré 2.</option>
        </select>
        <input
          type="range"
          name="parameter_a"
          min="0"
          max="10"
          step="0.2"
          defaultValue={String(this.state.parameterA)}
          onChange={event =>
            this.setState({
              parameterA: Number(event.target.value)
            })
          }
        />
      </div>
    );
  }
}

const App: React.FC = () => {
  return (
    <div className="App">
      <h1>Generative Art</h1>
      <div>
        <ArtCanvas />
      </div>
    </div>
  );
};

export default App;
