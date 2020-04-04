import React from "react";
import { ArtPiece } from "./ArtPiece";
import { Schotter } from "./ArtPieceSchotter";
import { Linien } from "./ArtPieceLinien";
import { Diamond } from "./ArtPieceDiamond";
import { Moiré1, Moiré2 } from "./ArtPieceMoire";
import { Maze } from "./ArtPieceMaze";
import { Fredkin1, Fredkin2 } from "./ArtPieceFredkin";
import { Perlin } from "./ArtPieceIsoGL";
import {
  IsoCube,
  IsoCubeColor,
  IsoCubeRotate,
  IsoCarouselRotate,
} from "./ArtPieceIso";
import "./App.css";

interface ArtCanvasState {
  active_art_name: string | undefined;
  parameterA: number;
  random_pool: Array<number>;
}

export class ArtCanvas extends React.Component<{}, ArtCanvasState> {
  private canvas2D: React.RefObject<HTMLCanvasElement>;
  private canvas3D: React.RefObject<HTMLCanvasElement>;
  private margin: number;
  private art_pieces: Array<ArtPiece>;

  width_to_height_ratio: number;
  draw_width: number;
  width: number;
  draw_height: number;
  height: number;
  animation_id: number | undefined;

  constructor(props: any) {
    super(props);
    this.canvas2D = React.createRef();
    this.canvas3D = React.createRef();
    this.margin = 100;

    this.width_to_height_ratio = 1.25;
    this.draw_width = 400;
    this.width = this.draw_width + this.margin;
    this.draw_height = Math.floor(this.draw_width * this.width_to_height_ratio);
    this.height = this.draw_height + this.margin;
    this.animation_id = undefined;
    this.art_pieces = [];

    this.state = {
      active_art_name: undefined,
      parameterA: 5,
      random_pool: this.initRandomPool(),
    };
  }

  componentDidMount() {
    this.canvas2D.current!.width = this.width;
    this.canvas2D.current!.height = this.height;


    const realToCSSPixels = window.devicePixelRatio;

    // Lookup the size the browser is displaying the canvas in CSS pixels
    // and compute a size needed to make our drawingbuffer match it in
    // device pixels.
    const displayWidth  = Math.floor(this.canvas3D.current!.clientWidth  * realToCSSPixels);
    const displayHeight = Math.floor(this.canvas3D.current!.clientHeight * realToCSSPixels);
    console.log(this.canvas3D.current!.clientWidth, realToCSSPixels, displayWidth);
    console.log(this.canvas3D.current!.clientHeight, realToCSSPixels, displayHeight);

    // this.canvas3D.current!.width = this.width; // 304
    // this.canvas3D.current!.height = this.height; // 365
    // this.canvas3D.current!.style.width = `${this.width}px`;
    // this.canvas3D.current!.style.height = `${this.height}px`;
    this.canvas3D.current!.width = displayWidth;
    this.canvas3D.current!.height = displayHeight;
    this.setupArt();
    this.drawArt();
    this.setArtFromURL();
  }

  componentDidUpdate() {
    const active_art = this.getActiveArt();
    if (active_art) {
      if (active_art.is_2d()) {
        this.canvas2D.current!.style.display = "block";
        this.canvas3D.current!.style.display = "none";
      } else {
        this.canvas3D.current!.style.display = "block";
        this.canvas2D.current!.style.display = "none";
      }
    }
    this.drawArt();
    this.setURLFromArt();
  }

  get html_element(): HTMLCanvasElement {
    return this.canvas3D.current!;
  }

  private setupArt() {
    this.art_pieces = [
      new Schotter("Schotter", !!"uses random pool", this),
      new Linien("Linien", !!"uses random pool", this),
      new Diamond("Diamond", !"doesn't use random pool", this),
      new Moiré1("Moiré 1", !"doesn't use random pool", this),
      new Moiré2("Moiré 2", !"doesn't use random pool", this),
      new Maze("Maze", !!"uses random pool", this),
      new Fredkin1("Fredkin 1", !"doesn't use random pool", this),
      new Fredkin2("Fredkin 2", !"doesn't use random pool", this),
      new IsoCube("Iso", !!"uses random pool", this),
      new IsoCubeColor("Isocolor", !!"uses random pool", this),
      new IsoCubeRotate("Rotate", !"doesn't use random pool", this),
      new IsoCarouselRotate("Carousel", !"doesn't use random pool", this),
      new Perlin("Perlin", !!"uses random pool", this),
    ];

    this.setState({
      active_art_name: this.art_pieces[0].name,
      parameterA: 5,
      random_pool: this.state.random_pool,
    });
  }

  private setArtFromURL() {
    const params = window.location.hash.substr(1);
    params.split("&").forEach(p => {
      const [name, value] = p.split("=");
      switch (name) {
        case "art":
          this.setState({ active_art_name: decodeURI(value) });
          break;
        case "param_a":
          this.setState({ parameterA: parseFloat(value) });
          break;
        default:
          console.warn(`unknown URL parameter: ${p}`);
      }
    });
  }

  private setURLFromArt() {
    window.location.hash = `#art=${this.state.active_art_name}&param_a=${this.state.parameterA}`;
  }

  private initRandomPool() {
    const random_pool = [];
    for (let i = 0; i < 100_000; i++) {
      random_pool.push(Math.random());
    }
    return random_pool;
  }

  getContext2d() {
    const element = this.canvas2D.current!;
    const ctx = element.getContext("2d");
    if (!ctx) {
      throw new Error("Could not get 2d context for canvas.");
    } else {
      return ctx;
    }
  }

  getContextGl() {
    const element = this.canvas3D.current!;
    const ctx = element.getContext("webgl");
    if (!ctx) {
      throw new Error("Could not get gl context for canvas.");
    } else {
      return ctx;
    }
  }

  private getActiveArt(): ArtPiece | undefined {
    return this.art_pieces.find(
      art => art.name === this.state.active_art_name
    )!;
  }

  renderSelect(): React.ReactNode {
    if (this.art_pieces.length === 0) {
      return;
    }

    const active_art = this.getActiveArt();
    const default_art: string =
      (active_art && active_art.name) || this.art_pieces[0].name;
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
    const active_art = this.getActiveArt();
    if (active_art && active_art.uses_random_pool) {
      return (
        <button
          name="reinit"
          onClick={e => this.setState({ random_pool: this.initRandomPool() })}
        >
          ~
        </button>
      );
    }
  }

  center() {
    const ctx = this.getContext2d();
    ctx.translate(this.margin / 2, this.margin / 2);
  }

  clear() {
    const ctx = this.getContext2d();
    ctx.clearRect(0, 0, this.width, this.height);
  }

  private drawArt() {
    const active_art = this.getActiveArt();

    if (this.animation_id !== undefined) {
      cancelAnimationFrame(this.animation_id);
      this.animation_id = undefined;
    }

    if (active_art && active_art.is_2d()) {
      this.clear();
      this.getContext2d().save();
      this.center();
    }
    if (active_art) {
      active_art.draw();
    }
    if (active_art && active_art.is_2d()) {
      this.getContext2d().restore();
    }
  }

  render(): React.ReactNode {
    return (
      <div>
        <canvas className="ArtCanvas" ref={this.canvas2D} />
        <canvas className="ArtCanvas" ref={this.canvas3D} />
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
