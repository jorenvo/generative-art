export class LinkedList<T> {
  value: T;
  next: LinkedList<T> | null;

  constructor(value: T) {
    this.value = value;
    this.next = null;
  }
}