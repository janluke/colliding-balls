'use strict';

import {HSLColorSampler, rand, randint} from "./utils.js";
import {Vector2D} from "./vector2d.js";
import {Ball} from "./ball.js";


export default {

    random: {
        title: "Random",
        generate: (canvas, {
            numBalls = 50,
            minRadius = 15,
            maxRadius = 25,
            maxSpeedAlongAxis = .25,  // px / ms
            minSaturation = 40,
            maxSaturation = 60,
            minLightness = 40,
            maxLightness = 60
        }) => {
            let balls = []
            let colorSampler = new HSLColorSampler({
                minS: minSaturation, maxS: maxSaturation,
                minL: minLightness, maxL: maxLightness
            });

            for (let i = 0; i < numBalls; i++) {
                let radius = randint(minRadius, maxRadius);
                let position = new Vector2D(
                    randint(radius, canvas.width - radius),
                    randint(radius, canvas.height - radius));

                let velocity = new Vector2D(
                    rand(-maxSpeedAlongAxis, maxSpeedAlongAxis),
                    rand(-maxSpeedAlongAxis, maxSpeedAlongAxis));

                let color = colorSampler.sample();

                balls.push(new Ball({
                    canvas: canvas, id: i,
                    position: position, velocity: velocity,
                    radius: radius, color: color
                }));
            }
            return balls;
        }
    },

    oneHitsTwo: {
        title: 'One hits two touching balls',
        generate: (canvas) => {
            let halfWidth = canvas.width / 2;
            let halfHeight = canvas.height / 2;
            return [
                new Ball({
                    canvas: canvas,
                    id: 0,
                    position: new Vector2D(halfWidth - 300, halfHeight),
                    velocity: new Vector2D(.4, 0),
                }),
                new Ball({
                    canvas: canvas,
                    id: 1,
                    position: new Vector2D(halfWidth, halfHeight),
                    velocity: new Vector2D(0, 0),
                }),
                new Ball({
                    canvas: canvas,
                    id: 2,
                    position: new Vector2D(halfWidth + 80, halfHeight),
                    velocity: new Vector2D(0, 0),
                }),
            ];
        }
    },

    oneHitsThree: {
        title: 'One hits three touching balls',
        generate: (canvas) => {
            let halfWidth = canvas.width / 2;
            let halfHeight = canvas.height / 2;
            let radius = 40;
            let diameter = radius * 2;
            return [
                new Ball({
                    canvas: canvas, id: 0, radius: radius,
                    position: new Vector2D(halfWidth - 300, halfHeight),
                    velocity: new Vector2D(.4, 0),
                }),
                new Ball({
                    canvas: canvas, id: 1, radius: radius,
                    position: new Vector2D(halfWidth, halfHeight),
                    velocity: new Vector2D(0, 0),
                }),
                new Ball({
                    canvas: canvas, id: 2, radius: radius,
                    position: new Vector2D(halfWidth + diameter, halfHeight),
                    velocity: new Vector2D(0, 0),
                }),
                new Ball({
                    canvas: canvas, id: 3, radius: radius,
                    position: new Vector2D(halfWidth + 2 * diameter, halfHeight),
                    velocity: new Vector2D(0, 0),
                }),
            ];
        }
    },

    twoHitOne: {
        title: 'Two hit one symmetrically',
        generate: (canvas) => {
            let halfWidth = canvas.width / 2;
            let halfHeight = canvas.height / 2;
            return [
                new Ball({
                    canvas: canvas,
                    id: 0,
                    position: new Vector2D(halfWidth - 300, halfHeight),
                    velocity: new Vector2D(.4, 0),
                }),
                new Ball({
                    canvas: canvas,
                    id: 1,
                    position: new Vector2D(halfWidth, halfHeight),
                    velocity: new Vector2D(0, 0),
                }),
                new Ball({
                    canvas: canvas,
                    id: 2,
                    position: new Vector2D(halfWidth + 300, halfHeight),
                    velocity: new Vector2D(-.4, 0),
                }),
            ];
        }
    },

    twoHitOne45: {
        title: 'Two hit one (45°)',
        generate: (canvas) => {
            let halfWidth = canvas.width / 2;
            let halfHeight = canvas.height / 2;
            let v = 0.2;
            return [
                new Ball({
                    canvas: canvas,
                    id: 0,
                    position: new Vector2D(halfWidth - 300, halfHeight - 300),
                    velocity: new Vector2D(v, v),
                }),
                new Ball({
                    canvas: canvas,
                    id: 1,
                    position: new Vector2D(halfWidth, halfHeight),
                    velocity: new Vector2D(0, 0),
                }),
                new Ball({
                    canvas: canvas,
                    id: 2,
                    position: new Vector2D(halfWidth + 300, halfHeight - 300),
                    velocity: new Vector2D(-v, v),
                }),
            ];
        }
    },

    oneHitsOneInWall: {
        title: 'One hits another touching wall',
        generate: (canvas) => {
            let [H, W] = [canvas.height, canvas.width];
            return [
                new Ball({
                    canvas: canvas, id: 0,
                    position: new Vector2D(W / 2, H / 4),
                    velocity: new Vector2D(0, 0.5),
                }),
                new Ball({
                    canvas: canvas, id: 1,
                    position: new Vector2D(W / 2, H - 40),
                    velocity: new Vector2D(0, 0),
                }),
            ];
        }
    },

    fourHitAtCenter: {
        title: 'Four hit each other at center',
        generate: (canvas) => {
            let cx = canvas.width / 2;
            let cy = canvas.height / 2;
            let d = 150;
            let left = cx - d;
            let right = cx + d;
            let top = cy - d;
            let bottom = cy + d;
            let v = 0.2;
            return [
                new Ball({
                    id: 0, canvas: canvas,
                    position: new Vector2D(left, top),
                    velocity: new Vector2D(v, v),
                }),
                new Ball({
                    id: 1, canvas: canvas,
                    position: new Vector2D(right, top),
                    velocity: new Vector2D(-v, v),
                }),
                new Ball({
                    id: 2, canvas: canvas,
                    position: new Vector2D(left, bottom),
                    velocity: new Vector2D(v, -v),
                }),
                new Ball({
                    id: 3, canvas: canvas,
                    position: new Vector2D(right, bottom),
                    velocity: new Vector2D(-v, -v),
                }),
            ];
        }
    },
}


