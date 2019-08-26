import React from "react";
import "./App.css";

enum ArtType {
  Schotter,
  Linien
}

interface ArtCanvasState {
  type: ArtType;
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

  constructor(props: any) {
    super(props);
    this.element = React.createRef();
    this.margin = 100;

    this.draw_width = 400;
    this.width = this.draw_width + this.margin;
    this.draw_height = 500;
    this.height = this.draw_height + this.margin;

    this.state = {
      type: ArtType.Linien
    };
  }

  componentDidMount() {
    this.dom_element = this.element.current!;
    this.dom_element.width = this.width;
    this.dom_element.height = this.height;

    let ctx = this.dom_element.getContext("2d");
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
    let ctx = this.ctx!;
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
    }
    ctx.restore();
  }

  drawArtSchotter() {
    let ctx = this.ctx!;
    let rect_per_row = 20;
    let rect_per_col = rect_per_row * (this.height / this.width);

    let rect_width = this.draw_width / rect_per_row;
    let rect_height = this.draw_height / rect_per_col;

    for (let row = 0; row < rect_per_col; row++) {
      let random_scale = row / 1.5;

      for (let col = 0; col < rect_per_row; col++) {
        ctx.save();

        let offset_col = col * rect_width;
        let offset_row = row * rect_height;

        // translate to origin
        ctx.translate(
          offset_col + rect_width / 2,
          offset_row + rect_height / 2
        );

        let random_angle = 0.01 * random_scale;
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
    let ctx = this.ctx!;
    ctx.beginPath();

    let rect_per_row = 20;
    let rect_per_col = Math.floor(rect_per_row * (this.height / this.width));

    let rect_width = this.draw_width / rect_per_row;
    let rect_height = this.draw_height / rect_per_col;

    let coordinates: [number, number][] = [];
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

        let random_scale = (random_scale_row * random_scale_col) / 2;
        if (row === rect_per_col - 1) {
          random_scale = 1;
        }

        ctx.moveTo(...coordinates[col]);
        ctx.lineTo(...coordinates[col + 1]);
        ctx.stroke();

        // vertical to next row, don't draw next line if on last row
        if (row < rect_per_col) {
          let new_row_x =
            col * rect_width + (Math.random() - 0.5) * random_scale;
          let new_row_y =
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
        </select>
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
