# colliding-balls
Implementation in JavaScript (ES6) of an engine for elastic collisions' resolution between balls.

Additional behavior can be injected by passing `EnginePlugin's` to the `Engine`.
Several _plugins are implemented in [_plugins.js](https://github.com/janLuke/colliding-balls/blob/master/src/plugins.js). In general, they can be used for drawing additional elements, performing simple animations, sanity checking, 
measuring performances...

## Try it
Try it at https://janluke.github.io/colliding-balls/index.html. 
Note: the number inside each ball is proportional to the ball's (truncated) speed.

| Command                   | Key(s)                               |
|---------------------------|--------------------------------------|
| Restart/refresh           | <kbd>r</kbd>                    |
| Pause/resume              | <kbd>p</kbd>                    |
| Next frame (while paused) | <kbd>→</kbd>                         |
| Increase/decrease speed   | <kbd>↑</kbd>  / <kbd>↓</kbd>         |

## Try it on your machine
You need `npm`. To install all dependencies:
```
npm install
``` 
To start webpack-dev-server:
```
npm start
```
To build a production release in the `dist` folder:
```
npm run build
```

## Implementation notes
- Collision detection follows the _Periodic Interference Test_ (PIT) approach: 
when a new frame must be drawn (e.g. each 16ms), balls are checked for interlaps; if two balls
interlap _and_ are approaching, a collision is detected. Thus, the collisions
are detected with delay, meaning that the simulation is not totally accurate and,
in some circumstances, a collision may not be detected at all; 
see [this document](https://www.cc.gatech.edu/~jarek/graphics/material/collisionWarkariJamsandekar.pdf)
for a comparison between PIT and the more precise (but more computationally expensive) PIC methods.

- The algorithm aims to decently handle complex cases where the effect of a collision must 
be propagated to obtain the right result. This is done through a kind of "sequential collision resolution" 
procedure.

- I didn't take the algorithm from a book so it's probably not the best way to do it but here it is:

  * For each ball, all the interlapping objects (balls and walls) are found.
  * At each step, a pair of interlapping object [x, y] is checked for collision:
  * if the objects are getting nearer a collision is detected and:
    - the velocities of the colliding balls are updated
    - All the following pairs are scheduled to be (re)checked:
      - [x, k] where k != y is an object interlapping with x
      - [y, h] where k != x is an object interlapping with y
