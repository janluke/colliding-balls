"use strict";

import {Vector2D} from "./vector2d.js";
import {ObjectSet} from "./collections/set.js";


const TOP_WALL = -1;
const BOTTOM_WALL = -2;
const LEFT_WALL = -3;
const RIGHT_WALL = -4;

// Time between frames when drawing at 60 FPS in milliseconds
const TIME_STEP_60FPS = 1000 / 60;


export class Engine {

    constructor(canvas, balls, {plugins = [], canvasColor = "rgba(10, 10, 10, 1.0)"} = {}) {

        this.balls = balls;

        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.canvasColor = canvasColor;

        this.paused = true;
        this.lastFrameTime = null;
        this.collisionsOf = balls.map(b => null);

        this._launch_animation = this._launch_animation.bind(this);
        this._animate = this._animate.bind(this);

        this._plugins = plugins;
        for (let plugin of plugins)
            plugin.onMount(this);
    }

    addPlugin(plugin) {
        this._plugins.push(plugin);
        plugin.onMount(this);
    }

    start() {
        let time = performance.now();
        this.paused = false;
        this.onStart(time);
        this.rafRequest = requestAnimationFrame(this._launch_animation);
    }

    resume() {
        if (!this.paused)
            throw new Error('called resume() but the engine is already running');
        let time = performance.now();
        this.paused = false;
        this.onResume(this, time);
        this.rafRequest = requestAnimationFrame(this._launch_animation);
    }

    pause() {
        if (!this.paused) {
            cancelAnimationFrame(this.rafRequest);
            this.paused = true;
            let time = performance.now();
            for (let plugin of this._plugins)
                if (plugin.enabled) plugin.onPause(this, time);
        }
    }

    togglePause() {
        if (this.paused)
            this.resume();
        else
            this.pause();
    }

    _launch_animation(time) {
        this.lastFrameTime = time;   // this will make deltaTime = 0
        this.rafRequest = requestAnimationFrame(this._animate);
    }

    _animate(time) {
        this._updateAndDrawFrame(time)
        this.rafRequest = requestAnimationFrame(this._animate);
    }

    handleWindowResize() {
        let canvas = this.canvas;
        let parent = canvas.parentNode;
        canvas.height = parent.clientHeight;
        canvas.width = parent.clientWidth;
    }

    nextFrame(deltaTime=TIME_STEP_60FPS) {
        if (!this.paused)
            throw new Error("You can't call nextFrame() if the engine is not paused")
        let time = performance.now();
        this.lastFrameTime = time - deltaTime;
        this._updateAndDrawFrame(time);
    }

    redraw() {
        if (!this.paused)
            throw new Error("You can't call redraw() if the engine is not paused")
        this.beforeUpdatingCanvas(this.lastFrameTime, 0);
        this.draw();
        this.onCanvasUpdated(this.lastFrameTime, 0);
    }

    _updateAndDrawFrame(time) {
        let deltaTime = time - this.lastFrameTime;

        this.handleWindowResize();

        this.beforeUpdatingState(time, deltaTime);
        this.updateState(time, deltaTime);
        this.onStateUpdated(time, deltaTime);

        this.beforeUpdatingCanvas(time, deltaTime);
        this.draw();
        this.onCanvasUpdated(time, deltaTime);

        this.onFrameCompleted(time, deltaTime);
        this.lastFrameTime = time;
    }

    draw() {
        let ctx = this.ctx;

        // Clear the canvas
        ctx.beginPath();
        ctx.fillStyle = this.canvasColor;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        for (let ball of this.balls)
            ball.draw(ctx);
    }

    resolveCollision(b1, b2) {
        // Find the normal and tangent versors (unit vectors).
        // The normal direction is that of the segment connecting the ball centers.
        // The tangent is orthogonal to the normal.
        let normalVersor = (b1.position.sub(b2.position)).versor();
        let tangentVersor = new Vector2D(-normalVersor.y, normalVersor.x);

        // Find the coordinates of the velocity vectors with respect to the
        // normal and tangent vectors. This is technically a change of basis.
        let v1 = b1.velocity;
        let v2 = b2.velocity;
        let normal1 = v1.dot(normalVersor);
        let tangent1 = v1.dot(tangentVersor);
        let normal2 = v2.dot(normalVersor);
        let tangent2 = v2.dot(tangentVersor);

        // Tangential components of velocities remain the same after the collision.
        // What change are the normal components; we can find them solving a 1D collision
        // problem along the normal direction.
        let m1 = b1.mass;
        let m2 = b2.mass;
        let M = m1 + m2;
        let newNormal1 = (normal1 * (m1 - m2) + 2 * m2 * normal2) / M;
        let newNormal2 = (normal2 * (m2 - m1) + 2 * m1 * normal1) / M;

        // Now, we can finally compute the new velocities as a linear combination
        // of normalVersor and tangentVersor (we are converting back to the canonical basis).
        // We use in-place operations for efficiency.
        v1.x = newNormal1 * normalVersor.x + tangent1 * tangentVersor.x;
        v1.y = newNormal1 * normalVersor.y + tangent1 * tangentVersor.y;

        v2.x = newNormal2 * normalVersor.x + tangent2 * tangentVersor.x;
        v2.y = newNormal2 * normalVersor.y + tangent2 * tangentVersor.y;
    }

    /**
     * Find pairs of potential colliding objects (balls/walls), i.e.
     * overlapping objects.
     *
     * Note that an overlap is not necessarily a collision: suppose
     * that when 2 fast balls collide, the overlap is very big;
     * after the collision, their speed may be small and when the
     * next frame must be drawn, they may still be overlapping.
     * Heuristic: detect a collision if the objects overlaps AND
     * their mutual distance is NOT increasing.
     *
     * Return values:
     *   pairs:
     *      list of pairs [i, j] with i < j, representing a collision
     *      candidate, i.e. a pair of overlapping objects (ball or wall).
     *      When negative, the first index i represents a wall.
     *      When positive, i and j are indexes identifying balls.
     *
     *   overlappingTo:
     *      mapping from a ball to the list of overlapping objects
     *      represented as integers, as explained in [pairs].
     */
    getCollisionCandidates(balls, height, width) {
        let overlappingTo = balls.map(_ => []);

        // Ball-to-wall
        for (let i = 0; i < balls.length; i++) {
            let ball = balls[i];

            // Detect collisions to vertical walls
            if (ball.position.x >= (width - ball.radius))
                overlappingTo[i].push(RIGHT_WALL);
            else if (ball.position.x <= ball.radius)
                overlappingTo[i].push(LEFT_WALL);

            // Detect collisions to horizontal walls
            if (ball.position.y >= (height - ball.radius))
                overlappingTo[i].push(BOTTOM_WALL);
            else if (ball.position.y <= ball.radius)
                overlappingTo[i].push(TOP_WALL);
        }

        let pairs = overlappingTo.flatMap(
            (list, i) => list.map(wall => [wall, i])
        );

        // Ball-to-ball
        for (let i = 0; i < balls.length; i++) {
            let b1 = balls[i];
            for (let j = i + 1; j < balls.length; j++) {
                let b2 = balls[j];
                if (b1.overlaps(b2)) {
                    overlappingTo[i].push(j);
                    overlappingTo[j].push(i);
                    pairs.push([i, j]);
                }
            }
        }

        return [pairs, overlappingTo];
    }

    updateState(time, deltaTime) {
        let balls = this.balls;
        let [pairs, overlappingTo] =
            this.getCollisionCandidates(balls, this.canvas.height, this.canvas.width);
        let collisionsOf = this.collisionsOf = balls.map(_ => new Set());

        let numOverlapsOf = balls.map((_, i) => overlappingTo[i].length);

        // Resolve collisions sequentially until there are no more
        pairs = new ObjectSet(pairs);

        function addPairsToReCheck(set, i, toIgnore) {
            if (numOverlapsOf[i] > 1) {
                for (let k of overlappingTo[i])
                    if (k !== toIgnore)
                        set.add((k > i) ? [i, k] : [k, i]);
            }
        }

        // We'll set [maxIterations] to prevent infinite cycles in degenerate situations
        // (e.g. when the window resizes the window so small that every ball is surrounded
        // by overlapping balls in all directions). This will prevent the app to crash.
        const maxIterations = 20;
        let iteration = 0;
        while (!pairs.isEmpty() && iteration < maxIterations) {
            let nextPairs = new ObjectSet();

            for (let [i, j] of pairs) {
                if (i < 0) { // Negative ints from -1 to -4 are walls
                    let v = balls[j].velocity;
                    if (i === TOP_WALL && v.y < 0 || i === BOTTOM_WALL && v.y > 0) {
                        v.y = -v.y;
                        addPairsToReCheck(nextPairs, j, i);
                    } else if (i === LEFT_WALL && v.x < 0 || i === RIGHT_WALL && v.x > 0) {
                        v.x = -v.x;
                        addPairsToReCheck(nextPairs, j, i);
                    }
                } else { // Both elements of the pairs are balls
                    let b1 = balls[i];
                    let b2 = balls[j];
                    if (b1.isGettingNearerTo(b2)) {
                        // b1 and b2 are overlapping and are getting nearer
                        this.resolveCollision(b1, b2);
                        collisionsOf[i].add(j);
                        collisionsOf[j].add(i);
                        addPairsToReCheck(nextPairs, i, j);
                        addPairsToReCheck(nextPairs, j, i);
                    }
                }
            }
            pairs = nextPairs;
            iteration++;
        }

        // Update the ball state
        for (let i = 0; i < balls.length; i++) {
            if (collisionsOf[i].size > 0)
                balls[i].lastCollisionTime = time;
            balls[i].move(deltaTime);
        }
    }

    onStart(time) {
        for (let plugin of this._plugins)
            if (plugin.enabled) plugin.onStart(this, time);
    }

    onResume(time) {
        for (let plugin of this._plugins)
            if (plugin.enabled) plugin.onResume(this, time);
    }

    beforeUpdatingState(time, deltaTime) {
        for (let plugin of this._plugins)
            if (plugin.enabled) plugin.beforeUpdatingState(this, time, deltaTime);
    }

    onStateUpdated(time, deltaTime) {
        for (let plugin of this._plugins)
            if (plugin.enabled) plugin.onStateUpdated(this, time, deltaTime);
    }

    beforeUpdatingCanvas(time, deltaTime) {
        for (let plugin of this._plugins)
            if (plugin.enabled) plugin.beforeUpdatingCanvas(this, time, deltaTime);
    }

    onCanvasUpdated(time, deltaTime) {
        for (let plugin of this._plugins)
            if (plugin.enabled) plugin.onCanvasUpdated(this, time, deltaTime);
    }

    onFrameCompleted(time, deltaTime) {
        for (let plugin of this._plugins)
            if (plugin.enabled) plugin.onFrameCompleted(this, time, deltaTime);
    }
}