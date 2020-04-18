import seedrandom from "seedrandom";

export class RandomPool {
  private rng: seedrandom.prng;
  public seed: string;
  private pool: number[];

  constructor(seed: string) {
    this.rng = seedrandom(seed);
    this.seed = seed;
    this.pool = [];
  }

  get(i: number) {
    if (i < 0) {
      console.error("Can't get negative numbers:", i);
      return 0;
    }

    while (i >= this.pool.length) {
      this.pool.push(this.rng());
    }

    return this.pool[i];
  }
}
