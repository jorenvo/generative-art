import { LinkedList } from "./UtilLinkedList";

export class AverageQueue {
  private capacity: number;
  private average: number;
  length: number;
  head: LinkedList<number> | null;
  tail: LinkedList<number> | null;

  constructor(capacity: number) {
    this.capacity = capacity;
    this.average = 0;
    this.length = 0;
    this.head = null;
    this.tail = null;
  }

  // tail <-> a <-> head
  dequeue(): number | null {
    if (this.length === 0 || !this.tail) {
      return null;
    }

    if (this.tail === this.head) {
      this.head = null;
    }

    const removed = this.tail;
    if (this.length === 1) {
      this.average = 0;
    } else {
      this.average -= removed.value / this.length;
      this.average *= this.length / (this.length - 1);
    }

    this.tail = removed.next;
    this.length--;

    return removed.value;
  }

  enqueue(n: number) {
    if (this.length >= this.capacity) {
      this.dequeue();
    }
    this.length++;

    const new_element = new LinkedList(n);
    if (!this.tail) {
      this.tail = new_element;
    }

    if (this.head) {
      this.head.next = new_element;
    }

    this.head = new_element;

    this.average =
      this.average * ((this.length - 1) / this.length) + n / this.length;
  }

  getAverage(): number {
    return this.average;
  }
}
