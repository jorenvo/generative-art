import React from "react";
import { ArtPiece } from "./ArtPiece";
import { Schotter } from "./ArtPieceSchotter";
import { Linien } from "./ArtPieceLinien";
import { Diamond } from "./ArtPieceDiamond";
import { Moiré1, Moiré2 } from "./ArtPieceMoire";
import { Maze } from "./ArtPieceMaze";
import { Fredkin1, Fredkin2 } from "./ArtPieceFredkin";
import { IsoShapeRotateGL } from "./ArtPieceIsoGL";
import { RandomPool } from "./RandomPool";
import {
  IsoCube,
  IsoCubeColor,
  IsoCubeRotate,
  IsoCarouselRotate,
} from "./ArtPieceIso";
import "./App.css";

interface ArtCanvasState {
  active_art_name: string | undefined;
  previous_art: ArtPiece | undefined;
  parameter_a: number;
  parameter_b: number;
  seed: string;
}

export class ArtCanvas extends React.Component<{}, ArtCanvasState> {
  private canvas2D: React.RefObject<HTMLCanvasElement>;
  private canvas3D: React.RefObject<HTMLCanvasElement>;
  private margin: number;
  private art_pieces: Array<ArtPiece>;
  private throttledTouchMoveHandler: (...args: any[]) => void;
  private throttledMouseMoveHandler: (...args: any[]) => void;

  random_pool: RandomPool;
  width_to_height_ratio: number;
  draw_width: number;
  width: number;
  draw_height: number;
  height: number;

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
    this.art_pieces = [];
    this.random_pool = new RandomPool("");
    this.throttledTouchMoveHandler = this.throttle(
      (e: TouchEvent) => this.handleTouchMoveState(e),
      1000 / 30,
      (e: TouchEvent) => this.handleTouchMoveUI(e)
    );
    this.throttledMouseMoveHandler = this.throttle(
      (e: MouseEvent) => this.handleMouseMoveState(e),
      1000 / 30,
      (e: MouseEvent) => this.handleMouseMoveUI(e)
    );

    this.state = {
      active_art_name: undefined,
      previous_art: undefined,
      parameter_a: 5,
      parameter_b: 5,
      seed: "",
    };
  }

  componentDidMount() {
    this.canvas2D.current!.width = this.width;
    this.canvas2D.current!.height = this.height;
    this.canvas3D.current!.width = this.width + 265; // todo remove magic
    this.canvas3D.current!.height = this.height;
    this.setupArt();
    this.drawArt();
    this.setArtFromURL();
  }

  componentDidUpdate() {
    const active_art = this.getActiveArt();
    if (active_art) {
      if (active_art.is2d()) {
        this.canvas2D.current!.style.display = "block";
        this.canvas3D.current!.style.display = "none";
      } else {
        this.canvas3D.current!.style.display = "block";
        this.canvas2D.current!.style.display = "none";
      }
    }

    if (this.random_pool.seed !== this.state.seed) {
      this.random_pool = new RandomPool(this.state.seed);
    }

    this.drawArt();
    this.setURLFromArt();
  }

  get html_element(): HTMLCanvasElement {
    return this.canvas3D.current!;
  }

  private setupArt() {
    this.art_pieces = [
      new Schotter(
        "Schotter",
        !!"uses random pool",
        !"doesn't use parameterB",
        this
      ),
      new Linien("Linien", !!"uses random pool", !!"uses parameterB", this),
      new Diamond(
        "Diamond",
        !"doesn't use random pool",
        !"doesn't use parameterB",
        this
      ),
      new Moiré1(
        "Moiré 1",
        !"doesn't use random pool",
        !"doesn't use parameterB",
        this
      ),
      new Moiré2(
        "Moiré 2",
        !"doesn't use random pool",
        !"doesn't use parameterB",
        this
      ),
      new Maze("Maze", !!"uses random pool", !"doesn't use parameterB", this),
      new Fredkin1(
        "Fredkin 1",
        !"doesn't use random pool",
        !"doesn't use parameterB",
        this
      ),
      new Fredkin2(
        "Fredkin 2",
        !"doesn't use random pool",
        !"doesn't use parameterB",
        this
      ),
      new IsoCube("Iso", !!"uses random pool", !"doesn't use parameterB", this),
      new IsoCubeColor(
        "Isocolor",
        !!"uses random pool",
        !"doesn't use parameterB",
        this
      ),
      new IsoCubeRotate(
        "Rotate",
        !"doesn't use random pool",
        !"doesn't use parameterB",
        this
      ),
      new IsoCarouselRotate(
        "Carousel",
        !"doesn't use random pool",
        !"doesn't use parameterB",
        this
      ),
      new IsoShapeRotateGL(
        "Perlin",
        !!"uses random pool",
        !"doesn't use parameterB",
        this
      ),
    ];

    this.setState({
      active_art_name: this.art_pieces[0].name,
      parameter_a: 5,
      parameter_b: 5,
      seed: this.getNewSeed(),
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
          this.setState({ parameter_a: parseFloat(value) });
          break;
        default:
          console.warn(`unknown URL parameter: ${p}`);
      }
    });
  }

  private setURLFromArt() {
    // todo
    // window.location.hash = `#art=${this.state.active_art_name}&param_a=${this.state.parameterA}`;
  }

  private getNewSeed() {
    return String(Math.random());
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
        name="artpiece_selector"
        defaultValue={default_art}
        onChange={event =>
          this.setState({
            parameter_a: 5,
            previous_art: this.getActiveArt(),
            active_art_name: event.target.value,
          })
        }
      >
        {options}
      </select>
    );
  }

  private clamp(min: number, x: number, max: number): number {
    return Math.min(max, Math.max(min, x));
  }

  private throttle(
    throttled_fn: (...args: any[]) => void,
    wait_ms: number,
    always_fn?: (...args: any[]) => void
  ): (...args: any[]) => void {
    let last_call = 0;
    let pending_call = 0;
    return (...args: any[]) => {
      clearTimeout(pending_call);
      let current = performance.now();
      if (current - last_call >= wait_ms) {
        last_call = current;
        throttled_fn(...args);
      } else {
        pending_call = window.setTimeout(() => throttled_fn(...args), wait_ms);
      }
      if (always_fn) {
        always_fn(...args);
      }
    };
  }

  private updateParamUI(clientX: number, clientY: number) {
    const slider = document.getElementById("slider")!; // todo do this better
    const touch_indicator = document.getElementById("touch")!; // todo do this better
    const rect = slider.getBoundingClientRect(); // relative to viewport
    const radius_indicator = touch_indicator.clientHeight / 2;

    let top = rect.height / 2 - radius_indicator;
    const art = this.getActiveArt();
    if (art && art.uses_parameter_b) {
      top = this.clamp(
        0,
        clientY - rect.top - radius_indicator,
        slider.clientHeight - touch_indicator.clientHeight
      );
    }
    touch_indicator.style.top = `${top}px`;

    const left = this.clamp(
      0,
      clientX - rect.left - radius_indicator,
      slider.clientWidth - touch_indicator.clientWidth
    );
    touch_indicator.style.left = `${left}px`;
  }

  private handleMouseMoveState(e: MouseEvent) {
    const slider = document.getElementById("slider")!; // todo do this better
    const x = e.offsetX / slider.clientWidth;
    const y = e.offsetY / slider.clientHeight;

    this.setState({
      parameter_a: this.clamp(0, x * 10, 10),
      parameter_b: this.clamp(0, y * 10, 10),
      previous_art: this.getActiveArt(),
    });
  }

  private handleMouseMoveUI(e: MouseEvent) {
    this.updateParamUI(e.clientX, e.clientY);
  }

  private handleTouchMoveState(e: TouchEvent) {
    // todo rewrite this to use client{X,Y}
    const slider = document.getElementById("slider")!; // todo do this better
    const touch_event = e.touches[0];
    const rect = (e.target as HTMLDivElement).getBoundingClientRect();
    const offsetX = touch_event.pageX - rect.left - window.scrollX;
    const offsetY = touch_event.pageY - rect.top - window.scrollY;
    const x = offsetX / slider.clientWidth;
    const y = offsetY / slider.clientHeight;
    this.setState({
      parameter_a: this.clamp(0, x * 10, 10),
      parameter_b: this.clamp(0, y * 10, 10),
      previous_art: this.getActiveArt(),
    });
    e.preventDefault(); // prevent MouseMove events from being fired
  }

  private handleTouchMoveUI(e: TouchEvent) {
    const touch = e.touches[0];
    this.updateParamUI(touch.clientX, touch.clientY);
    e.preventDefault(); // prevent MouseMove events from being fired
  }

  renderParameter(): React.ReactNode {
    return (
      <>
        <input
          type="range"
          name="parameter_a"
          min="0"
          max="10"
          step="0.2"
          value={String(this.state.parameter_a)}
          onChange={event =>
            this.setState({
              parameter_a: Number(event.target.value),
              previous_art: this.getActiveArt(),
            })
          }
        />
        <div id="mobile_controls">
          <div
            id="slider"
            onMouseMove={e => this.throttledMouseMoveHandler(e.nativeEvent)}
            onTouchMove={e => this.throttledTouchMoveHandler(e.nativeEvent)}
          >
            <div id="touch" />
          </div>
        </div>
      </>
    );
  }

  renderReInit(): React.ReactNode {
    const active_art = this.getActiveArt();
    if (active_art && active_art.uses_random_pool) {
      return (
        <button
          name="reinit"
          onClick={_ => this.setState({ seed: this.getNewSeed() })}
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

    if (this.state.previous_art) {
      this.state.previous_art.cleanUp();
    }

    if (active_art && active_art.is2d()) {
      this.clear();
      this.getContext2d().save();
      this.center();
    }
    if (active_art) {
      active_art.draw();
    }
    if (active_art && active_art.is2d()) {
      this.getContext2d().restore();
    }
  }

  render(): React.ReactNode {
    return (
      <div>
        <canvas className="ArtCanvas" ref={this.canvas2D} />
        <canvas className="ArtCanvas" ref={this.canvas3D} />
        {this.renderSelect()}
        {this.renderParameter()}
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
