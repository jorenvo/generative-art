import React from "react";
import "./App.css";
import { types } from "@babel/core";

enum ArtType {
  Schotter,
  Linien
}

interface ArtCanvasState {
  type: ArtType;
}

class ArtCanvas extends React.Component<{}, ArtCanvasState> {
  element: React.RefObject<HTMLCanvasElement>;
  ctx: CanvasRenderingContext2D | null;
  width: number;
  height: number;
  margin: number;

  constructor(props: any) {
    super(props);
    this.element = React.createRef();
    this.ctx = null;
    this.margin = 100;
    this.width = 400 + this.margin;
    this.height = 500 + this.margin;
    this.state = {
      type: ArtType.Schotter
    };
  }

  componentDidMount() {
    this.drawArt();
  }

  componentDidUpdate() {
    this.drawArt();
  }

  drawArt() {
    if (this.state.type == ArtType.Schotter) {
      this.drawArtSchotter();
    } else {
      //this.drawArtLines();
    }
  }

  drawArtSchotter() {
    console.log("render");
    let dom_element = this.element.current!;
    dom_element.width = this.width;
    dom_element.height = this.height;

    this.ctx = dom_element.getContext("2d")!;

    let rect_per_row = 20;
    let rect_per_col = 20 * (this.height / this.width);
    let draw_height = (this.height - this.margin) / rect_per_col;
    let draw_width = (this.width - this.margin) / rect_per_row;

    /* add margin */
    this.ctx.translate(this.margin / 2, this.margin / 2);

    for (let row = 0; row < rect_per_col; row++) {
      let random_scale = row / 1.5;

      for (let col = 0; col < rect_per_row; col++) {
        this.ctx.save();

        let offset_col = col * draw_width;
        let offset_row = row * draw_height;

        /* translate to origin */
        this.ctx.translate(
          offset_col + draw_width / 2,
          offset_row + draw_height / 2
        );

        let random_angle = 0.01 * random_scale;
        if (Math.random() > 0.5) this.ctx.rotate(random_angle);
        else this.ctx.rotate(-random_angle);

        /* translate back */
        this.ctx.translate(
          -offset_col - draw_width / 2,
          -offset_row - draw_height / 2
        );

        this.ctx.translate(
          Math.random() * random_scale,
          Math.random() * random_scale
        );
        this.ctx.strokeRect(offset_col, offset_row, draw_width, draw_height);
        this.ctx.restore();
      }
    }
  }

  stringToArtType(s: string): ArtType {
    return ArtType[ArtType[Number(s)] as keyof typeof ArtType];
  }

  render(): React.ReactNode {
    return (
      <div>
        <canvas className="ArtCanvas" ref={this.element} />
        <select
          onChange={event =>
            this.setState({
              type: this.stringToArtType(event.target.value)
            })
          }
        >
          <option value={ArtType.Schotter}>Schotter</option>
          <option value={ArtType.Linien}>Lines</option>
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
