'use strict';

export class Vector2D {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
  
  toString() {
    return `Vector2D(${this.x}, ${this.y})`;
  }

  copy() {
    return new Vector2D(this.x, this.y);
  }
  
  sum(other) {
    return new Vector2D(this.x + other.x, this.y + other.y);
  }
  
  sub(other) {
    return new Vector2D(this.x - other.x, this.y - other.y);
  }
  
  mul(other) {
    return new Vector2D(this.x * other.x, this.y * other.y);
  }
  
  dot(other) {
    return this.x * other.x + this.y * other.y;
  }

  div(other) {
    return new Vector2D(this.x / other.x, this.y / other.y);
  }
  
  scale(factor) {
    return new Vector2D(this.x * factor, this.y * factor);
  }
  
  square() { // simple product is usually faster than pow
    return new Vector2D(this.x * this.x, this.y * this.y);
  }

  pow(exponent) {
    return new Vector2D(Math.pow(this.x, exponent), Math.pow(this.y, exponent));
  }
  
  map(f) {
    return new Vector2D(f(this.x), f(this.y));
  }
  
  norm() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  sqNorm() {
    return this.x * this.x + this.y * this.y;
  }
  
  dist(other) {
    return Math.sqrt(this.sqDist(other));
  }

  sqDist(other) {
    let dx = this.x - other.x;
    let dy = this.y - other.y;
    return dx * dx + dy * dy;
  }
  
  reduce(f) {
    return f(this.x, this.y);
  }
  
  sumxy(other) {
    return this.x + this.y;
  }
  
  mulxy(other) {
    return this.x * this.y;
  }

  versor() {
    let norm = this.norm();
    return new Vector2D(this.x / norm, this.y / norm);
  }
  
  /* In-place operations (notation inspired by PyTorch) */
  set_(x, y) {
    this.x = x;
    this.y = y;
  }

  sum_(other) {
    this.x += other.x;
    this.y += other.y;
  }
  
  sub_(other) {
    this.x -= other.x;
    this.y -= other.y;
  }
  
  mul_(other) {
    this.x *= other.x;
    this.y *= other.y;
  }
  
  div_(other) {
    this.x /= other.x;
    this.y /= other.y;
  }
  
  scale_(factor) {
    this.x *= factor;
    this.y *= factor;
  }
  
  square_() {
    this.x *= this.x;
    this.y *= this.y;
  }

  pow_(exponent) {
    this.x = Math.pow(this.x, exponent);
    this.y = Math.pow(this.y, exponent);
  }
  
  map_(f) {
    this.x = f(this.x);
    this.y = f(this.y);
  }

  versor_() {
    let norm = this.norm();
    this.x /= norm;
    this.y /= norm;
  }

  assign_(other) {
    this.x = other.x;
    this.y = other.y;
  }
}


/* Functional aliases for binary operations */
export function sum(a, b) {
  return a.sum(b);
}

export function sub(a, b) {
  return a.sub(b);
}

export function mul(a, b) {
  return a.mul(b);
}

export function scale(vector, factor) {
  return vector.scale(factor);
}

export function pow(vector, exponent) {
  return vector.pow(exponent);
}

export function dot(a, b) {
  return a.dot(b);
}

export function dist(a, b) {
  return a.dist(b);
}

export function norm(a) {
  return a.norm();
}

export function sqNorm(a) {
  return a.sqNorm();
}

export function weightedSum(k1, v1, k2, v2) {
  return new Vector2D(
    k1 * v1.x + k2 * v2.x,
    k1 * v1.y + k2 * v2.y,
  );
}