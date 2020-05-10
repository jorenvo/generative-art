import "mocha";
import * as assert from "assert";
import { AverageQueue } from "./UtilQueue";
import { UtilTest } from "./UtilTest";

function avg(l: number[]): number {
  if (l.length === 0) {
    return 0;
  }
  return l.reduce((acc, curr) => acc + curr, 0) / l.length;
}

describe("Queue", function () {
  it("should be empty right after initialization", function () {
    const q = new AverageQueue(100);
    assert.equal(q.length, 0);
  });

  it("should correctly handle one element", function () {
    const q = new AverageQueue(100);
    q.enqueue(99);
    assert.equal(q.length, 1);
    assert.ok(q.tail);
    assert.equal(q.tail!.value, 99);
    assert.ok(q.head);
    assert.equal(q.head!.value, 99);

    assert.equal(q.dequeue(), 99);
    assert.equal(q.length, 0);
    assert.equal(q.tail, null);
    assert.equal(q.head, null);
  });

  it("should correctly handle >1 element", function () {
    const q = new AverageQueue(100);
    q.enqueue(98);
    q.enqueue(99);
    assert.equal(q.length, 2);
    assert.ok(q.tail);
    assert.equal(q.tail!.value, 98);
    assert.ok(q.head);
    assert.equal(q.head!.value, 99);

    assert.equal(q.dequeue(), 98);
    assert.equal(q.length, 1);
    assert.equal(q.tail!.value, 99);
    assert.equal(q.head!.value, 99);

    assert.equal(q.dequeue(), 99);
    assert.equal(q.length, 0);
    assert.equal(q.tail, null);
    assert.equal(q.head, null);
  });

  it("should correctly calculate the average in an empty queue", function () {
    const q = new AverageQueue(0);
    assert.equal(q.getAverage(), 0);
  });

  it("should correctly calculate the average in queue with 1 element", function () {
    const q = new AverageQueue(1);
    q.enqueue(99);
    assert.equal(q.getAverage(), 99);
    q.dequeue();
    assert.equal(q.getAverage(), 0);
  });

  it("should correctly calculate the average in queue with >1 element", function () {
    const q = new AverageQueue(100);
    const numbers = [20, 5, 8, 2];

    numbers.forEach((n, i) => {
      const added_numbers = numbers.slice(0, i);
      UtilTest.assertAlmostEqual(q.getAverage(), avg(added_numbers));
      q.enqueue(n);
    });

    // <= so we also test the queue being empty again
    for (let i = 0; i <= numbers.length; i++) {
      const remaining_numbers = numbers.slice(i);
      let remaining_avg = 0;
      if (remaining_numbers.length > 0) {
        remaining_avg = avg(remaining_numbers);
      }

      UtilTest.assertAlmostEqual(q.getAverage(), remaining_avg);
      q.dequeue();
    }
  });

  it("should correctly calculate the average with the right capacity", function () {
    const capacity = 7;
    const q = new AverageQueue(capacity);
    const numbers = [
      271,
      828,
      182,
      845,
      904,
      523,
      536,
      28,
      747,
      135,
      266,
      249,
      775,
      724,
      709,
      369,
      995,
      957,
      496,
      696,
      762,
      772,
      407,
      663,
      35,
      354,
      759,
      457,
      138,
      217,
      852,
      516,
      642,
    ];
    const window: number[] = [];

    numbers.forEach((n) => {
      if (window.length >= capacity) {
        window.shift();
      }
      window.push(n);
      q.enqueue(n);
      UtilTest.assertAlmostEqual(q.getAverage(), avg(window));
    });

    // <= so we also test the queue being empty again
    for (let i = window.length; i > 0; i--) {
      UtilTest.assertAlmostEqual(q.getAverage(), avg(window));
    }
  });
});
