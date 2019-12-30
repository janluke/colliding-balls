import {clip} from "./utils.js";
import {$} from "./shorthands";
import {MovingAverage} from "./utils";

/**
 * Base class for a Engine plugin (does nothing).
 * When a plugin is added to an Engine, onMount() is called.
 * All the other methods are called only if the plugin is enabled.
 */
export class EnginePlugin {
    constructor() {
        this._enabled = true;
    }

    get enabled() {
        return this._enabled
    };

    set enabled(value) {
        this._enabled = value;
        if (value) this.onEnable();
        else this.onDisable();
    }

    /**
     * Called when a plugin is added to an Engine. This method
     * is called either the plugin is enabled or not.
     */
    onMount(engine) {
        this.engine = engine;
    }

    onEnable() {
    }

    onDisable() {
    }

    onStart(engine, time) {
    }

    onPause(engine, time) {
    }

    onResume(engine, time) {
    }

    beforeUpdatingState(engine, time, deltaTime) {
    }

    onStateUpdated(engine, time, deltaTime) {
    }

    beforeUpdatingCanvas(engine, time, deltaTime) {
    }

    onCanvasUpdated(engine, time, deltaTime) {
    }

    /**
     * This hook should be rarely used and it was introduced mainly for
     * the Stopwatch plugin.
     */
    onFrameCompleted(engine, time, deltaTime) {
    }
}

export class FpsIndicator extends EnginePlugin {
    constructor({
                    elem,
                    averageObject = new MovingAverage(20),
                    updateTime: refreshTime = 250
                } = {}) {
        super();
        this.elem = elem || this._createDefaultElement();
        this.averageDeltaTime = averageObject;
        this.refreshTime = refreshTime;
        this.lastRefreshTime = 0;

        this._updateIndicator = this._updateIndicator.bind(this);
    }

    _createDefaultElement() {
        let elem = document.createElement('div');
        elem.className = 'fps-indicator';
        $('body').appendChild(elem);
        return elem;
    }

    _reset() {
        this.elem.textContent = '-- fps';
        this.averageDeltaTime.reset();
        this.lastRefreshTime = 0;
    }

    _updateIndicator() {
        let fps = Math.round(1000 / this.averageDeltaTime.value);
        this.elem.textContent = `${fps} fps`;
    }

    onPause(engine, time) {
        this._reset();
    }

    beforeUpdatingState(engine, time, deltaTime) {
        if (engine.paused)
            return;
        this.averageDeltaTime.update(deltaTime);
        if (time - this.lastRefreshTime >= this.refreshTime) {
            this._updateIndicator();
            this.lastRefreshTime = time;
        }
    }

    onEnable() {
        this.elem.style.display = "initial";
    }

    onDisable() {
        this.elem.style.display = "none";
        this._reset();
    }
}


/**
 * Logs each [logTime] milliseconds (approximately) the amount of kinetic energy
 * in the system. Useful for sanity checking: the total kinetic energy should be
 * conserved.
 */
export class TotalKineticEnergyLogger extends EnginePlugin {
    constructor(logTime = 1000) {
        super();
        this.logTime = logTime;
        this.lastLog = 0;
    }

    onStateUpdated(engine, time, deltaTime) {
        if ((time - this.lastLog) > this.logTime) {
            let energy = 0;
            for (let ball of engine.balls)
                energy += ball.mass * ball.velocity.sqNorm();
            console.log('Total kinetic energy: ' + energy);
            this.lastLog = time;
        }
    }
}


/**
 * Increase the lightness of colliding balls, proportionally to the
 * change in velocity due to collision.
 */
export class LightUpOnCollision extends EnginePlugin {
    constructor({decayTime = 1000} = {}) {
        super();
        this.impulseForMaxLightness = 1;
        this.decayTime = decayTime;
        this.maxLightnessIncrement = null;
        this.lastVelocities = null;
        this.engine = null;
    }

    _init(engine) {
        this.lastVelocities = engine.balls.map(b => b.velocity.copy());
        this.maxLightnessIncrement = engine.balls.map(_ => 0);
    }

    onStart(engine, time) {
        this._init(engine);
    }

    onEnable() {
        if (this.engine != null)
            this._init(this.engine);
    }

    onCanvasUpdated(engine, time, deltaTime) {
        let ctx = engine.ctx;
        let maxLightnessIncrement = this.maxLightnessIncrement;
        let balls = engine.balls;

        for (let i = 0; i < balls.length; ++i) {
            let ball = balls[i];
            let baseLightness = ball.color.lightness;
            let timeSinceCollision = time - ball.lastCollisionTime;

            if (timeSinceCollision === 0) {
                // Measure 
                let changeInVelocity = this.lastVelocities[i].dist(ball.velocity);
                let factor = Math.min(1.0, changeInVelocity / this.impulseForMaxLightness);

                let increment = maxLightnessIncrement[i] =
                    factor * (100 - baseLightness);
                let collisionLightness = baseLightness + increment;
                this.drawOverlay(ctx, ball, collisionLightness);
            } else if (timeSinceCollision < this.decayTime) {
                let progress = timeSinceCollision / this.decayTime;
                let increment = (1 - progress) ** 3 * maxLightnessIncrement[i];
                this.drawOverlay(ctx, ball, baseLightness + increment);
            }
            this.lastVelocities[i].assign_(ball.velocity);
        }
    }

    drawOverlay(ctx, ball, lightness) {
        ctx.beginPath();
        ctx.fillStyle = ball.color.withLightness(lightness).toString();
        ctx.arc(ball.position.x, ball.position.y, ball.radius, 0, 2 * Math.PI);
        ctx.fill();
    }
}


/**
 * Draws some text (function of a [Ball]) in the middle of the each ball.
 * @param ball2label: Ball => String
 */
export class DrawBallLabels extends EnginePlugin {
    constructor(ball2label) {
        super();
        this.ball2label = ball2label;
    }

    onCanvasUpdated(engine, time, deltaTime) {
        let balls = engine.balls;
        let ctx = engine.ctx;
        ctx.beginPath();
        ctx.fillStyle = "white";
        ctx.textBaseline = "middle";
        ctx.textAlign = "center";
        let ball2label = this.ball2label;
        for (let ball of balls) {
            ctx.font = `bold ${Math.round(ball.radius * 0.70)}px Orbitron`;
            ctx.fillText(ball2label(ball), ball.position.x, ball.position.y);
        }
    }
}

/**
 * Draws the velocity vector (as a segment without arrow) of each ball.
 */
export class DrawVelocityVector extends EnginePlugin {

    constructor({color = "rgb(255, 255, 255)", lineWidth = 2} = {}) {
        super();
        this.color = color;
        this.lineWidth = lineWidth;
    }

    onCanvasUpdated(engine, time, deltaTime) {
        let balls = engine.balls;
        let ctx = engine.ctx;
        ctx.strokeStyle = this.color;
        ctx.fillStyle = this.color;
        ctx.lineWidth = this.lineWidth;
        for (let ball of balls) {
            let p = ball.position;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 3, 0, 2 * Math.PI);
            ctx.fill();

            ctx.beginPath();
            let x = p.x + 100 * ball.velocity.x;
            let y = p.y + 100 * ball.velocity.y;
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(x, y);
            ctx.stroke();
        }
    }
}

export class Stopwatch extends EnginePlugin {
    constructor({elem, refreshTime = 500} = {}) {
        super();
        this.NUM_SAMPLES = 30;
        this.TIMES_PRECISION = 1;

        this._createElement(elem);
        this.refreshTime = refreshTime;
        this.stateUpdateAverage = new MovingAverage(this.NUM_SAMPLES);
        this.stateUpdatePluginsAverage = new MovingAverage(this.NUM_SAMPLES);
        this.canvasUpdateAverage = new MovingAverage(this.NUM_SAMPLES);
        this.canvasUpdatePluginsAverage = new MovingAverage(this.NUM_SAMPLES);
        this.lastRefresh = 0;
    }

    _createElement(elem) {
        if (elem == null) {
            elem = document.createElement('div');
            $('body').appendChild(elem);
        }
        elem.classList.add('time-breakdown');
        elem.innerHTML = `
            <table>
                <caption>Average times over the last ${this.NUM_SAMPLES} frames (in ms)</caption>
                <thead>
                    <tr>
                        <th></th>
                        <th>Engine</th>
                        <th>Plugins</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    <tr class="state-update-row">
                        <td>State update</td><td>-</td><td>-</td><td>-</td>
                    </tr>
                    <tr class="canvas-update-row">
                        <td>Canvas update</td><td>-</td><td>-</td><td>-</td>
                    </tr>
                    <tr class="total-row">
                        <td>Total</td><td>-</td><td>-</td><td>-</td>
                    </tr>
                </tbody>
            </table>`;
        this.elem = elem;
        this._stateUpdateRow = elem.querySelectorAll('tr.state-update-row td');
        this._canvasUpdateRow = elem.querySelectorAll('tr.canvas-update-row td');
        this._totalRow = elem.querySelectorAll('tr.total-row td');
    }

    beforeUpdatingState(engine, time, deltaTime) {
        // We can't rely on the time provided by requestAnimationFrame
        // because on Chrome it doesn't play well with performance.now()
        // https://stackoverflow.com/questions/50895206/exact-time-of-display-requestanimationframe-usage-and-timeline
        this._frameStartTime = performance.now();
    }

    onStateUpdated(engine, time, deltaTime) {
        this._stateUpdatedTime = performance.now();
        this.stateUpdateAverage.update(this._stateUpdatedTime - this._frameStartTime);
    };

    beforeUpdatingCanvas(engine, time, deltaTime) {
        this._canvasUpdateStart = performance.now();
        this.stateUpdatePluginsAverage.update(this._canvasUpdateStart - this._stateUpdatedTime);
    }

    onCanvasUpdated(engine, time, deltaTime) {
        this._canvasUpdatedTime = performance.now();
        this.canvasUpdateAverage.update(this._canvasUpdatedTime - this._canvasUpdateStart);
    };

    onFrameCompleted(engine, time, deltaTime) {
        let now = performance.now();
        this.canvasUpdatePluginsAverage.update(now - this._canvasUpdatedTime);
        if (time - this.lastRefresh > this.refreshTime) {
            const precision = this.TIMES_PRECISION;
            let stateUpdateTime = this.stateUpdateAverage.value;
            let statePluginsTime = this.stateUpdatePluginsAverage.value;
            let stateTotalTime = stateUpdateTime + statePluginsTime;
            this._stateUpdateRow[1].textContent = stateUpdateTime.toFixed(precision);
            this._stateUpdateRow[2].textContent = statePluginsTime.toFixed(precision);
            this._stateUpdateRow[3].textContent = stateTotalTime.toFixed(precision);

            let canvasUpdateTime = this.canvasUpdateAverage.value;
            let canvasPluginsTime = this.canvasUpdatePluginsAverage.value;
            let canvasTotalTime = canvasUpdateTime + canvasPluginsTime;
            this._canvasUpdateRow[1].textContent = canvasUpdateTime.toFixed(precision);
            this._canvasUpdateRow[2].textContent = canvasPluginsTime.toFixed(precision);
            this._canvasUpdateRow[3].textContent = canvasTotalTime.toFixed(precision);

            let totalEngineTime = stateUpdateTime + canvasUpdateTime;
            let totalPluginsTime = statePluginsTime + canvasPluginsTime;
            let totalTime = totalEngineTime + totalPluginsTime;
            this._totalRow[1].textContent = totalEngineTime.toFixed(precision);
            this._totalRow[2].textContent = totalPluginsTime.toFixed(precision);
            this._totalRow[3].textContent = totalTime.toFixed(precision);
            this.lastRefresh = time;
        }
    }

    onEnable() {
        this.elem.classList.remove("hidden");
    }

    onDisable() {
        this.elem.classList.add("hidden");
    }
}

/**
 * Increase or reduce the ball velocities additively.
 */
export class SpeedController extends EnginePlugin {
    constructor({step = 0.01, minSpeed = 0.01, maxSpeed = 0.8}) {
        super();
        this.step = step;
        this.minSpeed = minSpeed;
        this.maxSpeed = maxSpeed;
        this.deltaSpeed = 0;
    }

    speedUp() {
        this.deltaSpeed += this.step;
    }

    speedDown() {
        this.deltaSpeed -= this.step;
    }

    beforeUpdatingState(engine, time, deltaTime) {
        if (this.deltaSpeed === 0)
            return;
        // copy this.deltaSpeed so that eventual asynchronous speedUp/speedDown
        // don't interfere.
        let deltaSpeed = this.deltaSpeed;
        this.deltaSpeed = 0;

        for (let ball of engine.balls) {
            let vel = ball.velocity;
            let speed = vel.norm();
            if (speed >= this.maxSpeed && deltaSpeed > 0)
                continue;
            if (speed === 0 || speed <= this.minSpeed && deltaSpeed < 0)
                continue;
            let newSpeed = clip(speed + deltaSpeed, this.minSpeed, this.maxSpeed);
            vel.scale_(newSpeed / speed);   // in-place scaling
        }
    }
}

export class StateLogger extends EnginePlugin {
    onStateUpdated(engine, time, deltaTime) {
        for (let ball of engine.balls) {
            console.log(ball.toString());
            console.log('');
        }
        console.log('===========');
    };
}

export class EngineStateListener extends EnginePlugin {
    constructor(callback) {
        super();
        this.onStart = callback;
        this.onPause = callback;
        this.onResume = callback;
    }
}