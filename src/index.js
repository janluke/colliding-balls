"use strict";

import * as plugins from "./plugins.js";
import configurations from "./configurations.js";
import {Engine} from "./engine.js";
import {
    checkboxControlledPlugin,
    createCheckbox,
    dropdownControlled_DrawLabelPlugin,
    EngineController,
    setupOpenCloseMenu
} from "./ui";
import {$} from "./shorthands";


document.addEventListener('DOMContentLoaded', () => {
    // Setup the canvas element
    let canvas = $('#canvas');
    let canvasParent = canvas.parentElement;
    let canvasColor = getComputedStyle(canvasParent).getPropertyValue("background-color");
    canvas.height = canvas.parentElement.clientHeight;
    canvas.width = canvas.parentElement.clientWidth;

    let speedController = new plugins.SpeedController({
        step: 0.01,
        minSpeed: 0.004,
        maxSpeed: 0.6
    });

    let engine = new Engine(canvas, [], {
        canvasColor: canvasColor,
        plugins: [
            // Stopwatch should be the first plugin
            checkboxControlledPlugin(
                new plugins.Stopwatch(),
                createCheckbox($('#show-times-checkbox'), true)
            ),
            speedController,
            checkboxControlledPlugin(
                new plugins.TotalKineticEnergyLogger(),
                createCheckbox($('#log-energy-checkbox'), false)
            ),
            checkboxControlledPlugin(
                new plugins.LightUpOnCollision({decayTime: 1000}),
                createCheckbox($('#light-up-checkbox'), true)
            ),
            checkboxControlledPlugin(
                new plugins.DrawVelocityVector(),
                createCheckbox($('#velocity-vector-checkbox'), false)
            ),
            dropdownControlled_DrawLabelPlugin($('#ball-label-dropdown')),
            checkboxControlledPlugin(
                new plugins.FpsIndicator(),
                createCheckbox($('#show-fps-checkbox'), true)
            ),
        ]
    });

    setupOpenCloseMenu();
    let engineController = new EngineController(engine, configurations);

    // Handle keyboard events
    document.addEventListener('keydown', (event) => {
        switch (event.key) {
            case 'r':
                engineController.reinitialize();
                break;

            case 'p':
                engine.togglePause();
                break;

            case 'ArrowRight':
                if (engine.paused)
                    engine.nextFrame();
                break;

            case 'ArrowUp':
                speedController.speedUp();
                break;

            case 'ArrowDown':
                speedController.speedDown();
                break;
        }
    });

    engineController.start();
});
