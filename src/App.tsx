import React from "react";
import { ArtPiece } from "./ArtPiece";
import { Schotter } from "./ArtPieceSchotter";
import { Linien } from "./ArtPieceLinien";
import { Diamond } from "./ArtPieceDiamond";
import { Moiré1, Moiré2 } from "./ArtPieceMoire";
import { Maze } from "./ArtPieceMaze";
import { Fredkin1, Fredkin2 } from "./ArtPieceFredkin";
import { IsoCube, IsoCubeColor, IsoCubeRotate } from "./ArtPieceIso";
import "./App.css";

interface ArtCanvasState {
  active_art_name: string;
  parameterA: number;
  random_pool: Array<number>;
}

export class ArtCanvas extends React.Component<{}, ArtCanvasState> {
  private element: React.RefObject<HTMLCanvasElement>;
  private margin: number;
  private dom_element: HTMLCanvasElement | undefined;
  private art_pieces: Array<ArtPiece>;

  width_to_height_ratio: number;
  draw_width: number;
  width: number;
  draw_height: number;
  height: number;
  animation_id: number | undefined;

  constructor(props: any) {
    super(props);
    this.element = React.createRef();
    this.margin = 100;

    this.width_to_height_ratio = 1.25;
    this.draw_width = 400;
    this.width = this.draw_width + this.margin;
    this.draw_height = Math.floor(this.draw_width * this.width_to_height_ratio);
    this.height = this.draw_height + this.margin;
    this.animation_id = undefined;

    this.art_pieces = [
      new Schotter("Schotter", !!"uses_random_pool", this),
      new Linien("Linien", !!"uses_random_pool", this),
      new Diamond("Diamond", !"doesn't use random pool", this),
      new Moiré1("Moiré 1", !"doesn't use random pool", this),
      new Moiré2("Moiré 2", !"doesn't use random pool", this),
      new Maze("Maze", !!"uses_random_pool", this),
      new Fredkin1("Fredkin 1", !"doesn't use random pool", this),
      new Fredkin2("Fredkin 2", !"doesn't use random pool", this),
      new IsoCube("Iso", !!"uses_random_pool", this),
      new IsoCubeColor("Isocolor", !!"uses_random_pool", this),
      new IsoCubeRotate("Rotate", !"doesn't use random pool", this),
    ];

    this.state = {
      active_art_name: this.art_pieces[0].name,
      parameterA: 5,
      random_pool: [],
    };
  }

  componentDidMount() {
    this.dom_element = this.element.current!;
    this.dom_element.width = this.width;
    this.dom_element.height = this.height;
    this.initRandomPool();
  }

  componentDidUpdate() {
    this.drawArt();
  }

  initRandomPool() {
    const random_pool = [];
    for (let i = 0; i < 100_000; i++) {
      random_pool.push(Math.random());
    }

    this.setState({ random_pool: random_pool });
  }

  getContext() {
    const element = this.dom_element;
    if (!element) {
      throw new Error("Could not get canvas DOM element.");
    } else {
      const ctx = element.getContext("2d");
      if (!ctx) {
        throw new Error("Could not get context for canvas.");
      } else {
        return ctx;
      }
    }
  }

  getActiveArt(): ArtPiece {
    return this.art_pieces.find(
      art => art.name === this.state.active_art_name
    )!;
  }

  renderSelect(): React.ReactNode {
    const default_art = this.art_pieces[0].name;
    const options = this.art_pieces.map(art => (
      <option key={art.name} value={art.name}>
        {art.name}
      </option>
    ));

    return (
      <select
        defaultValue={default_art}
        onChange={event =>
          this.setState({
            parameterA: 5,
            active_art_name: event.target.value,
          })
        }
      >
        {options}
      </select>
    );
  }

  renderReInit(): React.ReactNode {
    if (this.getActiveArt().uses_random_pool) {
      return (
        <button name="reinit" onClick={this.initRandomPool.bind(this)}>
          ~
        </button>
      );
    }
  }

  center() {
    const ctx = this.getContext();
    ctx.translate(this.margin / 2, this.margin / 2);
  }

  clear() {
    const ctx = this.getContext();
    ctx.clearRect(0, 0, this.width, this.height);
  }

  private drawArt() {
    const ctx = this.getContext();
    this.clear();

    if (this.animation_id !== undefined) {
      cancelAnimationFrame(this.animation_id);
      this.animation_id = undefined;
    }

    ctx.save();
    this.center();
    this.getActiveArt().draw();
    ctx.restore();
  }

  render(): React.ReactNode {
    return (
      <div>
        <canvas className="ArtCanvas" ref={this.element} />
        {this.renderSelect()}
        <input
          type="range"
          name="parameter_a"
          min="0"
          max="10"
          step="0.2"
          value={String(this.state.parameterA)}
          onChange={event =>
            this.setState({
              parameterA: Number(event.target.value),
            })
          }
        />
        {this.renderReInit()}
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
