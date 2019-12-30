"use strict";

import {clip, HSLColor} from './utils.js';


const DOUBLE_PI = 2 * Math.PI;


export class Ball {
  constructor({
    canvas, id, 
    position, 
    velocity, 
    radius = 40, 
    color = new HSLColor(223, 76, 55)}) 
  {
    this.canvas = canvas;
    this.id = id;
    this.position = position;
    this.velocity = velocity;
    this.radius = radius;
    this.mass = Math.PI * radius**2;
    this.color = color;
    this.colorString = color.toString();
    this.lastCollisionTime = 0;  // (to another ball)
  }

  toString() {
    return `Ball({
      id: ${this.id},
      radius: ${this.radius}
      mass: ${this.mass},
      color: ${this.color},
      position: ${this.position}, 
      velocity: ${this.velocity}, 
    })`;
  }
  
  draw(ctx) {
    let p = this.position;
    ctx.beginPath();
    ctx.fillStyle = this.colorString;
    ctx.arc(p.x, p.y, this.radius, 0, DOUBLE_PI);
    ctx.fill();
  }

  move(deltaTime) {
    let radius = this.radius;
    let canvas = this.canvas;
    let pos = this.position;
    let vel = this.velocity;
    pos.x = clip(pos.x + deltaTime * vel.x, radius, canvas.width - radius);
    pos.y = clip(pos.y + deltaTime * vel.y, radius, canvas.height - radius);
  }

  overlaps(other) {
    let squaredDistance = this.position.sqDist(other.position);
    let sumOfRadius = this.radius + other.radius;
    return squaredDistance <= (sumOfRadius * sumOfRadius);
  }

  isGettingNearerTo(other) {
    let deltaPos = this.position.sub(other.position);
    let deltaVel = this.velocity.sub(other.velocity);
    return deltaPos.sqNorm() > deltaPos.sum(deltaVel.scale(0.0001)).sqNorm();
  }

}