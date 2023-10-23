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
import { AverageQueue } from "./UtilQueue";
import {
  IsoCube,
  IsoCubeColor,
  IsoCubeRotate,
  IsoCarouselRotate,
} from "./ArtPieceIso";
import "./App.css";
import { Spirograph } from "./ArtPieceSpirograph";
import { UtilCommon } from "./UtilCommon";
import { Waves } from "./ArtPieceWaves";
import { Sun } from "./ArtPieceSun";
import { BSpline } from "./ArtPieceBSpline";

interface ArtCanvasState {
  active_art_name: string | undefined;
  parameter_a: number;
  parameter_b: number;
  seed: string;
  g_sensor_activated: boolean;
}

export class ArtCanvas extends React.Component<{}, ArtCanvasState> {
  private canvas2D: React.RefObject<HTMLCanvasElement>;
  private canvas3D: React.RefObject<HTMLCanvasElement>;
  private touch_rect: React.RefObject<HTMLDivElement>;
  private margin: number;
  private art_pieces: Array<ArtPiece>;
  private motion_average_x: AverageQueue;
  private motion_average_y: AverageQueue;
  private throttledDrawArt: (...args: any[]) => void;
  private throttledSetURLFromArt: (...args: any[]) => void;
  private throttledHandleMotionEvent: (...args: any[]) => void;

  random_pool: RandomPool;
  width_to_height_ratio: number;
  draw_width: number;
  width: number;
  draw_height: number;
  height: number;
  dark_mode: boolean;

  constructor(props: any) {
    super(props);
    this.canvas2D = React.createRef();
    this.canvas3D = React.createRef();
    this.touch_rect = React.createRef();
    this.margin = 100;

    this.width_to_height_ratio = 1.25;
    this.draw_width = 400;
    this.width = this.draw_width + this.margin;
    this.draw_height = Math.floor(this.draw_width * this.width_to_height_ratio);
    this.height = this.draw_height + this.margin;
    this.art_pieces = [];

    const motion_queue_capacity = 10;
    this.motion_average_x = new AverageQueue(motion_queue_capacity);
    this.motion_average_y = new AverageQueue(motion_queue_capacity);
    this.random_pool = new RandomPool(String(Math.random()));
    this.dark_mode = false;

    this.throttledDrawArt = this.throttle(() => this.drawArt(), 1000 / 30);
    this.throttledSetURLFromArt = this.throttle(
      () => this.setURLFromArt(),
      1000
    );
    this.throttledHandleMotionEvent = this.throttle(
      (e: DeviceMotionEvent) => this.handleMotionEvent(e),
      1000 / 60
    );

    this.state = {
      active_art_name: undefined,
      parameter_a: 5,
      parameter_b: 5,
      seed: "",
      g_sensor_activated: false,
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

    window.matchMedia("(prefers-color-scheme: dark)").addListener((e) => {
      this.dark_mode = !!e.matches;
    });
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

    this.throttledDrawArt();
    this.throttledSetURLFromArt();
  }

  get htmlElement(): HTMLCanvasElement {
    return this.canvas3D.current!;
  }

  private initDeviceMotion() {
    // feature detect
    if (typeof (DeviceMotionEvent as any).requestPermission === "function") {
      (DeviceMotionEvent as any)
        .requestPermission()
        .then((permissionState: any) => {
          if (permissionState === "granted") {
            window.addEventListener(
              "devicemotion",
              this.throttledHandleMotionEvent
            );
            this.setState({ g_sensor_activated: true });
          }
        })
        .catch(console.error);
    } else {
      // handle regular non iOS 13+ devices
      console.log(
        "Permission not required, immediately setting up the listener."
      );
      window.addEventListener("devicemotion", this.throttledHandleMotionEvent);
      this.setState({ g_sensor_activated: true });
    }
  }

  private handleMotionEvent(e: DeviceMotionEvent) {
    const acceleration = e.accelerationIncludingGravity;
    if (!acceleration || !acceleration.x || !acceleration.y) {
      console.error("event didn't have accelerationIncludingGravity");
      return;
    }

    this.motion_average_x.enqueue(acceleration.x);
    this.motion_average_y.enqueue(acceleration.y);

    const limit = 4; // 4G
    this.setState({
      parameter_a:
        UtilCommon.clamp(-limit, this.motion_average_x.getAverage(), limit) *
          (5 / limit) +
        5,
      parameter_b:
        -UtilCommon.clamp(-limit, this.motion_average_y.getAverage(), limit) *
          (5 / limit) +
        5,
    });
  }

  private setupArt() {
    const random_pool = true;
    const no_random_pool = false;
    const parameter_a = true;
    const no_parameter_a = false;
    const parameter_b = true;
    const no_parameter_b = false;
    this.art_pieces = [
      new Schotter("Schotter", random_pool, parameter_a, no_parameter_b, this),
      new Linien("Linien", random_pool, parameter_a, parameter_b, this),
      new Diamond("Diamond", no_random_pool, parameter_a, no_parameter_b, this),
      new Moiré1("Moiré 1", no_random_pool, parameter_a, no_parameter_b, this),
      new Moiré2("Moiré 2", no_random_pool, parameter_a, no_parameter_b, this),
      new Maze("Maze", random_pool, parameter_a, no_parameter_b, this),
      new Fredkin1(
        "Fredkin 1",
        no_random_pool,
        parameter_a,
        no_parameter_b,
        this
      ),
      new Fredkin2(
        "Fredkin 2",
        no_random_pool,
        parameter_a,
        no_parameter_b,
        this
      ),
      new IsoCube("Iso", random_pool, parameter_a, no_parameter_b, this),
      new IsoCubeColor(
        "Isocolor",
        random_pool,
        parameter_a,
        no_parameter_b,
        this
      ),
      new IsoCubeRotate(
        "Rotate",
        no_random_pool,
        parameter_a,
        no_parameter_b,
        this
      ),
      new IsoCarouselRotate(
        "Carousel",
        no_random_pool,
        parameter_a,
        no_parameter_b,
        this
      ),
      new Spirograph(
        "Spirograph",
        random_pool,
        no_parameter_a,
        no_parameter_b,
        this
      ),
      new IsoShapeRotateGL(
        "Perlin",
        random_pool,
        parameter_a,
        no_parameter_b,
        this
      ),
      new Waves("Waves", random_pool, no_parameter_a, no_parameter_b, this),
      new Sun("Sun", random_pool, parameter_a, no_parameter_b, this),
      new BSpline(
        "B-spline",
        random_pool,
        no_parameter_a,
        no_parameter_b,
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
    params.split("&").forEach((p) => {
      const [name, value] = p.split("=");
      switch (name) {
        case "art":
          this.setState({ active_art_name: decodeURI(value) });
          break;
        case "param_a":
          this.setState({ parameter_a: parseFloat(value) });
          break;
        case "param_b":
          this.setState({ parameter_b: parseFloat(value) });
          break;
        case "seed":
          this.setState({ seed: value });
          break;
        default:
          console.warn(`unknown URL parameter: ${p}`);
      }
    });
  }

  private setURLFromArt() {
    window.location.hash = `#art=${this.state.active_art_name}&\
param_a=${this.state.parameter_a}&\
param_b=${this.state.parameter_b}&\
seed=${this.state.seed}`;
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
      ctx.imageSmoothingEnabled = false;
      return ctx;
    }
  }

  getContextGl() {
    const element = this.canvas3D.current!;
    const ctx = element.getContext("webgl", { alpha: false });
    if (!ctx) {
      throw new Error("Could not get gl context for canvas.");
    } else {
      return ctx;
    }
  }

  setHoverText(text: string) {
    const active_art = this.getActiveArt();
    if (active_art) {
      if (active_art.is2d()) {
        this.canvas2D.current!.title = text;
      } else {
        this.canvas3D.current!.title = text;
      }
    }
  }

  private getActiveArt(): ArtPiece | undefined {
    return this.art_pieces.find(
      (art) => art.name === this.state.active_art_name
    )!;
  }

  renderSelect(): React.ReactNode {
    if (this.art_pieces.length === 0) {
      return;
    }

    const active_art = this.getActiveArt();
    const default_art: string =
      (active_art && active_art.name) || this.art_pieces[0].name;
    const options = this.art_pieces.map((art) => (
      <option key={art.name} value={art.name}>
        {art.name}
      </option>
    ));

    return (
      <select
        name="artpiece_selector"
        defaultValue={default_art}
        onChange={(event) => {
          const active_art = this.getActiveArt();
          if (active_art) {
            active_art.cleanUp();
          }
          this.setState({
            parameter_a: 5,
            active_art_name: event.target.value,
          });
        }}
      >
        {options}
      </select>
    );
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

  private getTouchIndicatorProperties(): React.CSSProperties {
    const art = this.getActiveArt();
    const touch_indicator_width_pct = 8;
    const ratio_a = this.state.parameter_a / 10;
    const left_pct = -touch_indicator_width_pct / 2 + ratio_a * 100;
    let top_pct = 0;
    let height_pct = 100;
    let border_radius = 0;
    let padding_top_pct = 0;

    if (art && art.uses_parameter_b) {
      let rect_width_over_height_ratio = 1 / 0.28;
      let ratio_b = this.state.parameter_b / 10;

      top_pct =
        (-touch_indicator_width_pct / 2) * rect_width_over_height_ratio +
        ratio_b * 100;
      border_radius = 50;
      height_pct = 0;
      padding_top_pct = 8;
    }

    return {
      left: `${left_pct}%`,
      top: `${top_pct}%`,
      height: `${height_pct}%`,
      borderRadius: `${border_radius}%`,
      paddingBottom: `${padding_top_pct}%`,
    };
  }

  private handleMouseMoveState(e: MouseEvent) {
    const art = this.getActiveArt();
    const touch_rect = document.getElementById("touch_rect")!; // todo do this better
    const x = e.offsetX / touch_rect.clientWidth;
    const y = e.offsetY / touch_rect.clientHeight;

    if (art) {
      if (art.uses_parameter_a) {
        this.setState({ parameter_a: UtilCommon.clamp(0, x * 10, 10) });
      }
      if (art.uses_parameter_b) {
        this.setState({ parameter_b: UtilCommon.clamp(0, y * 10, 10) });
      }
    }
  }

  private handleTouchMoveState(e: TouchEvent) {
    // todo rewrite this to use client{X,Y}
    const art = this.getActiveArt();
    const touch_rect = document.getElementById("touch_rect")!; // todo do this better
    const touch_event = e.touches[0];
    const rect = (e.target as HTMLDivElement).getBoundingClientRect();
    const offsetX = touch_event.pageX - rect.left - window.scrollX;
    const offsetY = touch_event.pageY - rect.top - window.scrollY;
    const x = offsetX / touch_rect.clientWidth;
    const y = offsetY / touch_rect.clientHeight;
    if (art) {
      if (art.uses_parameter_a) {
        this.setState({ parameter_a: UtilCommon.clamp(0, x * 10, 10) });
      }
      if (art.uses_parameter_b) {
        this.setState({ parameter_b: UtilCommon.clamp(0, y * 10, 10) });
      }
    }
    e.preventDefault(); // prevent MouseMove events from being fired
  }

  renderParameter(): React.ReactNode {
    const active_art = this.getActiveArt();
    if (
      active_art &&
      (active_art.uses_parameter_a || active_art.uses_parameter_b)
    ) {
      return (
        <>
          <input
            type="range"
            name="parameter_a"
            min="0"
            max="10"
            step="0.2"
            value={String(this.state.parameter_a)}
            onChange={(event) =>
              this.setState({
                parameter_a: Number(event.target.value),
              })
            }
          />
          <div id="mobile_controls">
            <div
              id="touch_rect"
              ref={this.touch_rect}
              onMouseMove={(e) => this.handleMouseMoveState(e.nativeEvent)}
              onTouchMove={(e) => this.handleTouchMoveState(e.nativeEvent)}
            >
              <div id="touch" style={this.getTouchIndicatorProperties()} />
            </div>
          </div>
        </>
      );
    }
  }

  renderReInit(): React.ReactNode {
    const active_art = this.getActiveArt();
    if (active_art && active_art.uses_random_pool) {
      return (
        <button
          name="reinit"
          onClick={(_) => this.setState({ seed: this.getNewSeed() })}
        >
          ~
        </button>
      );
    }
  }

  renderGSensor(): React.ReactNode {
    if (this.state.g_sensor_activated) {
      return (
        <button
          className="g_sensor"
          onClick={(_) => {
            window.removeEventListener(
              "devicemotion",
              this.throttledHandleMotionEvent
            );
            this.setState({ g_sensor_activated: false });
          }}
        >
          Disable G-sensor
        </button>
      );
    } else {
      return (
        <button className="g_sensor" onClick={(_) => this.initDeviceMotion()}>
          Enable G-sensor
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
        <canvas className="ArtCanvas" id="canvas2D" ref={this.canvas2D} />
        <canvas className="ArtCanvas" id="canvas3D" ref={this.canvas3D} />
        {this.renderSelect()}
        {this.renderParameter()}
        {this.renderReInit()}
        {this.renderGSensor()}
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
