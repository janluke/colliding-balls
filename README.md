# colliding-balls
Implementation in JavaScript (ES6) of an engine for elastic collisions' resolution between balls.

Additional behavior can be injected by passing `EnginePlugin's` to the `Engine`.
Several plugins are implemented in [plugins.js](src/plugins.js). In general, they can be used for drawing additional elements, performing simple animations, sanity checking, 
measuring performances...

## Try it
Try it at https://janluke.github.io/colliding-balls/index.html

| Command                   | Key(s)                               |
|---------------------------|--------------------------------------|
| Restart/refresh           | <kbd>r</kbd>                         |
| Pause/resume              | <kbd>p</kbd>                         |
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
Collision detection follows the _Periodic Interference Test_ (PIT) approach: 
when a new frame must be drawn (e.g. each 16ms), balls are checked for interlaps; if two balls
interlap _and_ are approaching, a collision is detected. Thus, the collisions
are detected with delay, meaning that the simulation is not totally accurate and,
in some circumstances, a collision may not be detected at all; 
see [this document](https://www.cc.gatech.edu/~jarek/graphics/material/collisionWarkariJamsandekar.pdf)
for a comparison between PIT and the more precise (but more computationally expensive) PIC methods.

The algorithm intends to handle (decently) complex cases where the effect of a collision must 
be propagated to obtain the right result. This is done through a kind of "sequential collision resolution" 
procedure. It doesn't work perfectly in all circumstances (e.g. try the "Two hit one (45°)" initialization)
but it works well most of the times.
I didn't take the algorithm from a book so it's probably not the best way to do it. 
Here it is (the actual implementation is slightly different):

* For each ball, find the list of balls and walls interlapping to it.
* Initialize a set `pairsToCheck` with all pairs of interlapping objects `(ball, obj)`
  where `obj` can be a ball or a wall.
* While `pairsToCheck` is not empty (and for a max of `T` iterations):
    - Pop a pair `(x, y)` from `pairsToCheck`.
    - **Detect** a collision if `x` and `y` are getting nearer according to their velocity vector.
    - If a collision is detected:
        * **Resolve** the collision:
            - update `x.velocity`
            - update `y.velocity` if `y` is not a wall
        * (**Propagation**) (Re)add the following pairs to `pairsToCheck` (if not present):
            - all pairs `(i_x, h)` where `i_x` is a ball interlapping with `x` and `h != x`
            - if `y` is not a wall, all pairs `(i_y, k)` where `i_y` is a ball interlapping with `y` and `k != y`
