import configurations from "./configurations";
import {$, byId} from "./shorthands";
import * as plugins from "./plugins";

import tippy from 'tippy.js';
import 'tippy.js/dist/tippy.css';


// For noUiSlider
let intFormatter = (postfix = "") => {
    return {
        to: (value) => value.toFixed(0) + postfix,
        from: (value) => parseInt(value)
    }
}

/**
 * Returns a radius such that numBalls balls with that radius
 * can fit the given area without overlapping. Instead of using
 * the actual area of a ball, we use that of a square of edge 2*radius.
 */
function getBallRadiusFor(area, numBalls) {
    let squareArea = area / numBalls;
    return Math.sqrt(squareArea) / 2;
}

/**
 * Code handling user interaction with the "Controls" section of the menu.
 */
export class EngineController {
    constructor(engine, initializations) {
        const MIN_NUM_BALLS = 1;
        const MAX_NUM_BALLS = 300;
        const DEFAULT_NUM_BALLS = 50;

        this.engine = engine;

        // Field: Number of balls
        let numBallsField = byId('num-balls-slider');
        noUiSlider.create(numBallsField, {
            start: [DEFAULT_NUM_BALLS],
            format: intFormatter(),
            tooltips: true,
            step: 1,
            range: {
                'min': MIN_NUM_BALLS,
                'max': MAX_NUM_BALLS
            },
        });
        this.numBallsSlider = numBallsField.noUiSlider;
        const numBallsSpan = byId('num-balls-label');
        this.numBallsSlider.on('update', (event) => {
            numBallsSpan.textContent = this.numBallsSlider.get();
        });

        // Field: Ball radius range
        let minRadius = 10;
        let canvasArea = this.canvasArea();
        let ballRadiusField = byId('ball-size-slider');
        noUiSlider.create(ballRadiusField, {
            start: [
                Math.max(minRadius, getBallRadiusFor(0.20 * canvasArea, DEFAULT_NUM_BALLS)),
                Math.round(getBallRadiusFor(0.30 * canvasArea, DEFAULT_NUM_BALLS)),
            ],
            format: intFormatter(),
            tooltips: [true, true],
            connect: true,
            step: 1,
            range: {'min': minRadius, 'max': this._getMaxBallRadius()},
        })
        this.radiusRangeSlider = ballRadiusField.noUiSlider;

        // Update value labels on slider change
        this.radiusRangeSlider.on('update', () => {
            let [min, max] = this.radiusRangeSlider.get();
            byId('radius-min-label').textContent = min;
            byId('radius-max-label').textContent = max;
        });

        // Update max ball radius when the number of balls changes
        this.numBallsSlider.on('update', () => {
            this.radiusRangeSlider.updateOptions(
                {range: {'min': minRadius, 'max': this._getMaxBallRadius()}},
                true
            );
        });

        // Buttons restart | play/pause | step-forward
        let restartButton = byId('btn-restart');
        let playPauseButton = byId('btn-play-pause');
        let stepForwardButton = byId('btn-step-forward');

        restartButton.onclick = () => {
            restartButton.firstElementChild.classList.remove('animated');
            restartButton.offsetWidth;   // DON'T REMOVE: this is necessary to cause reflow
            restartButton.firstElementChild.classList.add('animated');
            this.reinitialize();
        }
        playPauseButton.onclick = () => this.engine.togglePause();
        stepForwardButton.onclick = () => this.engine.nextFrame();

        // Make the Engine the unique source of truth about its state
        // TODO: consider adding onPause/onResume to Engine itself
        this.engine.addPlugin(new plugins.EngineStateListener((engine) => {
            if (engine.paused) {
                playPauseButton.classList.remove('playing');
                playPauseButton['data-tippy-content'] = 'Play';
                stepForwardButton.disabled = false;
            } else {
                playPauseButton.classList.add('playing');
                playPauseButton['data-tippy-content'] = 'Pause';
                stepForwardButton.disabled = true;
            }
        }));

        // Field: Initialization
        this.initDropdown = byId('initialization-dropdown');
        for (let key in initializations) {
            let optionElem = document.createElement('option');
            optionElem.value = key;
            optionElem.text = initializations[key].title;
            this.initDropdown.appendChild(optionElem);
        }
        this.initDropdown.onchange = (event) => this.onInitDropdownChange(event);

        // Field: Auto-play new simulations
        this.autoplay_checkbox = createCheckbox(byId('auto-play-checkbox'), true);
    }

    onInitDropdownChange(event) {
        // Show/hide random initialization options
        if (event.target.value === 'random')
            byId('random-init-options').classList.remove('hidden');
        else
            byId('random-init-options').classList.add('hidden');

        this.reinitialize();
    }

    canvasArea() {
        let canvas = this.engine.canvas;
        return canvas.width * canvas.height;
    }

    numBalls() {
        return parseInt(this.numBallsSlider.get());
    }

    _getMaxBallRadius(maxAreaCoverage = 0.8) {
        let canvas = this.engine.canvas;
        let canvasArea = canvas.width * canvas.height;
        let canvasMinEdge = Math.min(canvas.width, canvas.height);
        let ballsTotalArea = maxAreaCoverage * canvasArea;
        let idealRadius = Math.floor(getBallRadiusFor(ballsTotalArea, this.numBalls()));
        return Math.min(canvasMinEdge / 2, idealRadius);
    }

    _generateBalls() {
        let initKey = this.initDropdown.value;
        if (initKey === 'random') {
            let [minRadius, maxRadius] = this.radiusRangeSlider.get().map(x => parseInt(x));
            return configurations.random.generate(this.engine.canvas, {
                numBalls: parseInt(this.numBallsSlider.get()),
                minRadius: minRadius,
                maxRadius: maxRadius,
            });
        } else {
            return configurations[initKey].generate(this.engine.canvas);
        }
    }

    bootstrapSimulation(engine, steps = 128, startDeltaTime = 20, finalDeltaTime = 0) {
        let delta = startDeltaTime - finalDeltaTime;
        for (let t = 0; t < steps; t++) {
            // decrease deltaTime over time to simulate a slow-down:
            // slow balls are less likely to overlap
            let deltaTime = startDeltaTime - Math.sqrt(t / steps) * delta;
            engine.updateState(0, deltaTime);
        }
    }

    reinitialize({start = null} = {}) {
        this.engine.pause();
        this.engine.balls = this._generateBalls();
        // If balls were randomly generated, some balls may be located visibly
        // on top of others; so it's better to "bootstrap" the engine so that
        // balls moves apart of each other before the user can see.
        if (this.initDropdown.value === 'random')
            this.bootstrapSimulation(this.engine);

        if (start == null)
            start = this.autoplay_checkbox.checked;
        if (start)
            this.engine.start();
        else {
            this.engine.onStart();
            this.engine.nextFrame();
        }
    }

    start() {
        this.reinitialize({start: true});
    }
}

export function createCheckbox(elem, checked = false) {
    elem.classList.add('pretty', 'p-svg', 'p-curve');
    const label = elem.textContent;
    elem.textContent = '';
    elem.innerHTML = `
        <div class="pretty p-svg p-curve">
            <input type="checkbox" />
            <div class="state p-primary">
                <!-- svg path -->
                <svg class="svg svg-icon" viewBox="0 0 20 20">
                    <path d="M7.629,14.566c0.125,0.125,0.291,0.188,0.456,0.188c0.164,0,0.329-0.062,0.456-0.188l8.219-8.221c0.252-0.252,0.252-0.659,0-0.911c-0.252-0.252-0.659-0.252-0.911,0l-7.764,7.763L4.152,9.267c-0.252-0.251-0.66-0.251-0.911,0c-0.252,0.252-0.252,0.66,0,0.911L7.629,14.566z" style="stroke: white;fill:white;"></path>
                </svg>
                <label>${label}</label>
            </div>
        </div>`;
    let inputElem = elem.getElementsByTagName('input')[0];
    inputElem.checked = checked;
    return inputElem;
}

/**
 * Creates a one-way binding from a checkbox value to plugin.enabled
 * and returns the plugin itself.
 */
export function checkboxControlledPlugin(plugin, checkbox) {
    plugin.enabled = checkbox.checked;
    checkbox.addEventListener('change', () => {
        plugin.enabled = checkbox.checked;
        if (plugin.engine.paused) {
            plugin.engine.redraw();
        }
    });
    return plugin;
}

/**
 * Returns a DrawLabelPlugin whose ball2label function changes
 * according to the value of a <select> element.
 *
 * @param selectElem
 * @param value: initial value of the select element;
 *               either "id", "speed" or "none"
 * @returns {DrawBallLabels}
 */
export function dropdownControlled_DrawLabelPlugin(selectElem, value) {
    let plugin = new plugins.DrawBallLabels();

    function setLabelType(labelType) {
        if (labelType === 'none') {
            plugin.enabled = false;
            return;
        }
        plugin.enabled = true;
        switch (labelType) {
            case 'id':
                plugin.ball2label = (ball) => ball.id;
                break;
            case 'speed':
                plugin.ball2label = (ball) => Math.round(100 * ball.velocity.norm());
                break;
            default:
                throw new Error('unknown ball label type: ' + labelType);
        }
    }

    selectElem.onchange = () => {
        setLabelType(selectElem.value);
        if (plugin.engine.paused)
            plugin.engine.redraw();
    }
    if (value !== undefined)
        selectElem.value = value;
    setLabelType(selectElem.value);
    return plugin;
}

export function setupOpenCloseMenu() {
    let menuPanel = $('#menu');
    let openMenuBtn = $('#btn-open-menu');
    let closeMenuBtn = $('#btn-close-menu');
    openMenuBtn.onclick = () => {
        if (menuPanel.classList.contains('hidden')) {
            menuPanel.classList.remove('hidden');
            openMenuBtn.classList.add('hidden');
        }
    };
    closeMenuBtn.onclick = () => {
        if (!menuPanel.classList.contains('hidden')) {
            menuPanel.classList.add('hidden');
            openMenuBtn.classList.remove('hidden');
        }
    };
}

tippy('[data-tippy-content]');
tippy('.show-keyboard-controls', {
    interactive: true,
    hideOnClick: false,
    theme: 'keyboard-controls',
    content: `
        <div class="keyboard-controls">
            <table>
                <thead>
                <tr>
                    <th>Command</th>
                    <th>Key</th>
                </tr>
                </thead>
                <tbody>
                <tr>
                    <td>Restart/refresh</td>
                    <td><kbd>r</kbd>
                </tr>
                <tr>
                    <td>Pause/resume</td>
                    <td><kbd>p</kbd>
                </tr>
                <tr>
                    <td>Step forward</td>
                    <td><kbd><i class="fas fa-long-arrow-alt-right"></i></kbd></td>
                </tr>
                <tr>
                    <td>Increase speed</td>
                    <td><kbd><i class="fas fa-long-arrow-alt-up"></i></kbd></td>
                </tr>
                <tr>
                    <td>Decrease speed</td>
                    <td><kbd><i class="fas fa-long-arrow-alt-down"></i></kbd></td>
                </tr>
                </tbody>
            </table>
        </div>`
});