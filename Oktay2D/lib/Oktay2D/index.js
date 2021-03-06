/**
 *  =========================== Oktay2D ===========================
 *  
 *  A graphics library for the web made by Babah Gee.
 * 
 *  Version 1.2.0 - Last edited: 05-03-2022
 */

import { log } from "./essentials/debugger.js";
import { generateUniqueID } from "./essentials/generateUniqueId.js";
import { RandomBetween } from "./essentials/math.js";
import { RenderObject, RenderObjects } from "./essentials/renderobject.js";
import { Camera } from "./rendering/camera.js";

export const _LIB_OPTIONS = {
    _USABLE_FLAGS: [],
    _USER_AGENT: navigator.userAgent,
    _PLATFORM: typeof navigator.platform === "string" ? navigator.platform : null,
    _POST_PROCESSING_SHADERS: ["SHADER_AMBIENT_OCCLUSION", "SHADER_BLOOM"],
    _MODULE_LOADER: typeof require !== "undefined" ? {
        __ELECTRON: require("electron"),
        __JS_EASINGS: require("js-easing-functions"),
        __SAT_PHYSICS: require("sat")
    } : null,
    _FILTER_USAGE: true,
    _CHECK_FLAG_STATE: function (FLAGNAME) {

        const __FEATURES = {
            __NEW_CANVAS_API: ["roundRect", "createConicGradient", "reset"]
        }

        switch (FLAGNAME) {

            case "new-canvas-2d-api":

                let _IS_READY = true;

                __FEATURES.__NEW_CANVAS_API.forEach(a => {
                    if (typeof CanvasRenderingContext2D.prototype[a] === "undefined") _IS_READY = false;
                });

                return _IS_READY;

                break;

        }

    }
}

// ================ Type definitions ================
/**
* @typedef CanvasSceneMouseButtons
* @property {boolean} right
* @property {boolean} middle
* @property {boolean} left
*/
/**
* @typedef CanvasSceneMouseProperties
* @property {number} x
* @property {number} y
* @property {number} velocityX
* @property {number} velocityY
* @property {number} lastTimeStamp
* @property {number} wheelDirection
* @property {boolean} isInWindow
* @property {CanvasSceneMouseButtons} buttons
*/
/**
 * @typedef LinearGradientColorStopDefinitions
 * @property {number} offset
 * @property {string} color
 */

// ================ Public classes ================

export class CanvasScene {

    #_events = {};

    /**
     * Creates a new Canvas Scene
     * @param {number} width
     * @param {number} height
     * @param {HTMLElement} domElement
     * @example
     * new CanvasScene(520, 840, document.body);
     */
    constructor(width, height, domElement) {

        if (typeof width !== "number") throw new Error("The given argument (as width) is not a number.");
        if (typeof height !== "number") throw new Error("The given argument (as height) is not a number.");
        if (!(domElement instanceof HTMLElement)) throw new Error("The given argument (as domElement) is not a HTMLElement instance.");

        this.width = width;
        this.height = height;
        this.domElement = domElement;
        this.attributes = [];

        this.mouse = {
            x: 0,
            y: 0,
            velocityY: 0,
            velocityX: 0,
            lastTimestamp: 0,
            wheelDirection: null,
            buttons: {
                left: false,
                middle: false,
                right: false,
            },
            isInWindow: false,
            checkSquareCollision(x, y, range) {

                if (x >= this.x - range && x <= this.x + range && y >= this.y - range && y <= this.y + range) {

                    return true;

                }

                return false;

            }
        }

        log("CanvasScene", "Initializing canvas scene...", "color: yellow");

        // Create the element.
        const canvas = document.createElement("canvas");
        canvas.className = "oktay2d-scene";

        canvas.width = this.width;
        canvas.height = this.height;


        canvas.setAttribute("crossOrigin", "anonymous");

        domElement.appendChild(canvas);

        this.canvas = canvas;

        window.addEventListener("resize", () => {
            this.HandleResizeEvent();
        });

        this.HandleEvents();

        log("CanvasScene", "Succesfully initialized canvas scene.", "color: lime;")
    }
    HandleEvents() {

        // Mouse move event
        this.canvas.addEventListener("mousemove", event => {

            const now = performance.now(),
                deltaTime = now - this.mouse.lastTimestamp,
                distanceX = Math.abs(event.offsetX - this.mouse.x),
                speedX = Math.round(distanceX / deltaTime * 1000),
                distanceY = Math.abs(event.offsetY - this.mouse.y),
                speedY = Math.round(distanceY / deltaTime * 1000);

            this.mouse.velocityX = speedX;
            this.mouse.velocityY = speedY;
            
            this.mouse.x = event.offsetX;
            this.mouse.y = event.offsetY;

            this.mouse.lastTimestamp = now;

            if (typeof this.#_events["mouseMove"] === "function") this.#_events["mouseMove"](this.mouse, this);
        });

        // Mouse down event.
        this.canvas.addEventListener("mousedown", event => {

            switch (event.button) {

                case 0: this.mouse.buttons.left = true; break;
                case 1: this.mouse.buttons.middle = true; break;
                case 2: this.mouse.buttons.right = true; break;
            }

            if (typeof this.#_events["mouseDown"] === "function") this.#_events["mouseDown"](this.mouse, this);

        });

        // Mouse up event.
        this.canvas.addEventListener("mouseup", event => {

            switch (event.button) {

                case 0: this.mouse.buttons.left = false; break;
                case 1: this.mouse.buttons.middle = false; break;
                case 2: this.mouse.buttons.right = false; break;
            }

            if (typeof this.#_events["mouseUp"] === "function") this.#_events["mouseUp"](this.mouse, this);
        });

        // Mouse out event.
        this.canvas.addEventListener("mouseout", event => {

            this.mouse.x = 0;
            this.mouse.y = 0;

            this.mouse.isInWindow = false;

            if (typeof this.#_events["mouseOut"] === "function") this.#_events["mouseOut"](this.mouse, this);
        });

        // Mouse enter event.
        this.canvas.addEventListener("mouseenter", event => {

            this.mouse.isInWindow = true;

            if (typeof this.#_events["mouseEnter"] === "function") this.#_events["mouseEnter"](this.mouse, this);
        });

        // Mouse wheel event.
        this.canvas.addEventListener("wheel", event => {

            if (event.deltaY < 0) this.mouse.wheelDirection = "up";
            if (event.deltaY > 0) this.mouse.wheelDirection = "down";
            if (event.deltaX < 0) this.mouse.wheelDirection = "left";
            if (event.deltaX > 0) this.mouse.wheelDirection = "right";

            if (typeof this.#_events["mouseWheel"] === "function") this.#_events["mouseWheel"](this.mouse, this);
        });
    }
    HandleResizeEvent() {

        if (typeof this.#_events["sceneResize"] === "function") this.#_events["sceneResize"](this);

        if (this.attributes.includes("fitToScreen")) {

            this.canvas.width = window.innerWidth; 
            this.canvas.height = window.innerHeight;

            this.width = window.innerWidth;
            this.height = window.innerHeight;

        }

        if (this.attributes.includes("redrawOnResize")) {

            let i = 0;

            while (i < RenderObjects.length) {

                const object = RenderObjects[i];

                if (typeof object.Draw === "function") {

                    object.Draw(this.appliedRenderer.ctx);
                }

                i += 1;
            }
        }

    }
    /**
     * Sets the size of the canvas element.
     * @param {number | null} width
     * @param {number | null} height
     * @returns {this}
     */
    SetSize(width, height) {

        if (typeof width === "number") {
            this.width = width;
            this.canvas.width = width;
        }

        if (typeof height === "number") {
            this.height = height;
            this.canvas.height = height;
        }

        return this;
    }
    /**
     * Sets an attribute on the canvas element.
     * @param {"fitToScreen" | "disableContextMenu" | "redrawOnResize"} attribute
     */
    SetAttribute(attribute) {

        if (typeof attribute !== "string") throw new Error("The given argument (as attribute) is not a string.");

        if (this.attributes.includes(attribute)) throw new Error(`Cannot set attribute '${attribute}' because it as already been set on this instance.`);

        const that = this;

        switch (attribute) {
            case "fitToScreen":

                this.attributes.push(attribute);

                break;
            case "redrawOnResize":

                this.attributes.push(attribute);

                break;
            case "disableContextMenu":

                this.canvas.addEventListener("contextmenu", function (event) {

                    event.preventDefault();

                });

                this.attributes.push(attribute);

                break;
            default:

                throw new Error(`The given attribute '${attribute}' is not a recognized attribute for this instance.`);

                break;
        }

    }
    /**
     * Will export the canvas data to an image.
     * @param {("png" | "webp" | "jpeg" | "jpg")} format Image format
     * @returns {string | null}
     */
    ExportToImage(format) {

        if (typeof format === "undefined") return this.canvas.toDataURL();

        return this.canvas.toDataURL("image/" + format);

    }
    /**
     * @callback eventCallback
     * @param {CanvasSceneMouseProperties} mouse
     * @param {CanvasScene} self
     */

    /**
     * Event listener.
     * @param {"sceneResize" | "mouseDown" | "mouseUp" | "mouseMove" | "mouseOut" | "mouseEnter" | "mouseWheel"} event
     * @param {eventCallback} callback
    */
    On(event, callback) {

        let possibleEvents = ["sceneResize", "mouseDown", "mouseUp", "mouseMove", "mouseOut", "mouseEnter", "mouseWheel"],
            isValidEvent = false;


        for (let key in possibleEvents) {
            if (possibleEvents[key] === event) isValidEvent = true;
        }

        if (!isValidEvent) throw new Error(`The given event name '${event}' is not a valid event for this instance.`);

        if (typeof callback !== "function") throw new Error("The given argument (as callback) is not a function.");

        this.#_events[event] = callback;
    }
}

export class Renderer {

    /**@type {CanvasScene} */
    scene;

    /**@type {Array} */
    attributes;

    /**@type {Array} */
    renderObjects;

    /**@type {CanvasRenderingContext2D} */
    ctx;

    /**@type {Camera} */
    camera;

    /**@type {Array<RenderObject>} */
    visibleObjects;

    /**
     * @typedef {Object} RendererAttributes
     */

    /**
     * Creates a new canvas2d renderings context.
     * @param {CanvasScene} scene CanvasScene instance to draw the graphics on.
     * 
     * @param {object} attributes Rendering attributes to specify different settings.
     * @param attributes.alpha {boolean}
     * @param attributes.willReadFrequently {boolean}
     * @param attributes.desynchronized {boolean}
     */
    constructor(scene, attributes) {

        if (!(scene instanceof CanvasScene)) throw new Error("The given argument (as scene) is not a CanvasScene instance.");

        this.scene = scene;
        this.attributes = attributes;

        /**@type {Array.<RenderObject>} */
        this.renderObjects = [];

        this.ctx = scene.canvas.getContext("2d", attributes);

        this.ctx.com

        this.globalTransformation = null;


        this.camera = null;

        scene.appliedRenderer = this;
    }
    UpdateCamera(x, y) {

        this.ctx.beginPath();

        this.ctx.translate(x, y);
    }
    /** Saving the current canvas rendering state. */
    SaveState() {

        this.ctx.save();

        return this;

    }
    /**Restores the last saved canvas rendering state. */
    RestoreState() {

        this.ctx.restore();

        return this;
    }
    /**
     * Sets a background color.
     * @param {string} color
     */
    SetBackgroundColor(color) {

        const ctx = this.ctx,
            scene = this.scene;

        ctx.save();
        ctx.beginPath();

        ctx.rect(0, 0, scene.width, scene.height);

        ctx.fillStyle = color;
        ctx.fill();

        ctx.closePath();
        ctx.restore();

        return this;
    }
    /**Renders all objects added to this renderer. */
    RenderAllObjects(deltaTime) {

        const ctx = this.ctx;

        if (this.camera instanceof Camera) {

            // Handle camera events.

            ctx.save();

            // Global tranformation
            if (this.globalTransformation !== null) {
                ctx.transform(
                    this.globalTransformation.horizontalScaling,
                    this.globalTransformation.verticalSkewing,
                    this.globalTransformation.horizontalSkewing,
                    this.globalTransformation.verticalScaling,
                    this.globalTransformation.horizontalTranslation,
                    this.globalTransformation.verticalTranslation,
                );
            }

            ctx.translate(this.camera.x, this.camera.y);
            ctx.scale(this.camera.scaleX, this.camera.scaleY);

            let i = 0,
                visibleObjects = [];

            while (i < this.renderObjects.length) {

                /**@type {RenderObject} */
                const object = this.renderObjects[i];

                if (!this.camera.offscreenRendering) {

                    if (typeof object.width === "number" && typeof object.height === "number") {

                        if (!object.forceRendering) {
                            if (object.x > -(((this.camera.x + 30) / this.camera.scaleX) + object.width) && object.x < -((this.camera.x - this.camera.width) / this.camera.scaleX) &&
                                object.y > -((this.camera.y + 30) / this.camera.scaleY) && object.y < -((this.camera.y - (this.camera.height))) / this.camera.scaleY) {

                                visibleObjects.push(object);

                                object.visible = true;

                                if (typeof object.Draw === "function") object.Draw(this.ctx);
                                if (typeof object.Update === "function") object.Update(this.ctx, deltaTime);

                            } else {
                                object.visible = false;
                            }
                        } else {

                            if (typeof object.Draw === "function") object.Draw(this.ctx);
                            if (typeof object.Update === "function") object.Update(this.ctx, deltaTime);

                            visibleObjects.push(object);

                            object.visible = false;
                        }

                    }

                } else {

                    if (typeof object.Draw === "function") object.Draw(this.ctx);
                    if (typeof object.Update === "function") object.Update(this.ctx, deltaTime);

                }


                i += 1;
            }

            this.visibleObjects = visibleObjects;


            ctx.restore();

            // this.RenderFilter();

            return this;
        } else {
            ctx.save();

            // Global tranformation
            if (this.globalTransformation !== null) {
                ctx.transform(
                    this.globalTransformation.horizontalScaling,
                    this.globalTransformation.verticalSkewing,
                    this.globalTransformation.horizontalSkewing,
                    this.globalTransformation.verticalScaling,
                    this.globalTransformation.horizontalTranslation,
                    this.globalTransformation.verticalTranslation,
                );
            }

            let i = 0;

            while (i < this.renderObjects.length) {

                /**@type {RenderObject} */
                const object = this.renderObjects[i];

                if (typeof object.Draw === "function") object.Draw(this.ctx);
                if (typeof object.Update === "function") object.Update(this.ctx, deltaTime);

                i += 1;
            }

            ctx.restore();

            return this;
        }
    }
    /**
     * Renders an object in this renderer instance.
     * @param {RenderObject} renderObject
     */
    Render(renderObject, deltaTime) {

        if (!(renderObject instanceof RenderObject)) {

            this.RenderAllObjects(deltaTime);

            return;
        }

        const ctx = this.ctx;

        ctx.save();

        ctx.translate(this.camera.x, this.camera.y);

        if (typeof renderObject.Draw === "function") renderObject.Draw(this.ctx);

        ctx.restore();
    }
    /**Clears the entire screen */
    ClearScene() {

        this.ctx.clearRect(0, 0, this.scene.width, this.scene.height);

        return this;
    }
    /**
     * Adds a renderobject to this instance. Can be useful when having multiple renderers and wants to render a specific one instead of all render objects.
     * @param {RenderObject | Array<RenderObject>} renderObject
     */
    Add(renderObject) {

        if (!(renderObject instanceof RenderObject) && !(renderObject instanceof Array)) throw new Error("Cannot add instance since it's not a RenderObject.")

        if (renderObject instanceof RenderObject) {

            this.renderObjects.push(renderObject);

            renderObject.appliedRenderContext = this.ctx;

            return this;
            
        }

        if (renderObject instanceof Array) {

            for (let i = 0; i < renderObject.length; i++) {

                const x = renderObject[i];

                if (x instanceof RenderObject) {

                    x.appliedRenderContext = this.ctx;

                    this.renderObjects.push(x);
                } else {
                    throw new Error(`The item in given array with index number '${i}' is not a RenderObject instance.`);
                }

            }

            return this;
        }

    }
    /**
     * Removes a RenderObject instance from this renderer.
     * @param {RenderObject} renderObject
     */
    Remove(renderObject) {

        if (!(renderObject instanceof RenderObject)) throw new Error("The given argument is not a RenderObject instance.");

        let i = 0;

        while (i < this.renderObjects.length) {

            const obj = this.renderObjects[i];

            if (obj.id === renderObject.id) {

                this.renderObjects.splice(i, 1);

                i = this.renderObjects.length - 1;

                break;

                return;
            }

            i += 1;
        }

    }
    /**
    * Sets a global transformation matrix.
    * @param {number} horizontalScaling Horizontal scaling. A value of '1' results in no scaling.
    * @param {number} verticalSkewing Vertical skewing.
    * @param {number} horizontalSkewing Horizontal skewing.
    * @param {number} verticalScaling Vertical scaling. A value of '1' results in no scaling.
    * @param {number} horizontalTranslation Horizontal translation.
    * @param {number} verticalTranslation Vetical translation.
    */
    SetGlobalTranformation(horizontalScaling, verticalSkewing, horizontalSkewing, verticalScaling, horizontalTranslation, verticalTranslation) {

        if (horizontalScaling === null) {

            this.globalTransformation = null;

            return this;
        }


        this.globalTransformation = {
            horizontalScaling: horizontalScaling,
            verticalSkewing: verticalSkewing,
            horizontalSkewing: horizontalSkewing,
            verticalScaling: verticalScaling,
            horizontalTranslation: horizontalTranslation,
            verticalTranslation: verticalTranslation
        }

        return this.globalTransformation;
    }
    RenderFilter() {

        const ctx = this.ctx;

        ctx.beginPath();

        const imageData = ctx.getImageData(0, 0, this.scene.width, this.scene.height);

        for (let i = 0; i < imageData.data.length; i += 4) {

            const pixelData = imageData.data;

            let r = pixelData[i],
                g = pixelData[i + 1],
                b = pixelData[i + 2],
                a = pixelData[i + 3];

            r = RandomBetween(r - 10, r + 10);

            imageData.data[i] = r;
            imageData.data[i + 1] = g;
            imageData.data[i + 2] = b;
            imageData.data[i + 3] = a;
        }

        ctx.putImageData(imageData, 0, 0);
    }
    /**
     * Creates a linear gradient object.
     * @param {number} x0 The x-axis coordinate of the start point.
     * @param {number} y0 The y-axis coordinate of the start point.
     * @param {number} x1 The x-axis coordinate of the end point.
     * @param {number} y1 The y-axis coordinate of the end point.
     * @param {Array<LinearGradientColorStopDefinitions>} colorStops Color stops.
     */
    CreateLinearGradient(x0, y0, x1, y1, colorStops) {

        if (typeof x0 !== "number") throw new Error("The x-axis coordinate of the start point has not been specified as a number.");
        if (typeof y0 !== "number") throw new Error("The y-axis coordinate of the start point has not been specified as a number.");
        if (typeof x1 !== "number") throw new Error("The x-axis coordinate of the end point has not been specified as a number.");
        if (typeof y1 !== "number") throw new Error("The y-axis coordinate of the end point has not been specified as a number.");

        if (!(this.ctx instanceof CanvasRenderingContext2D)) throw new Error("Failed to generate a linear gradient object since no CanvasRenderingContext2D has been defined.");

        const ctx = this.ctx;

        const gradient = ctx.createLinearGradient(x0, y0, x1, y1);

        for (var i = 0; i < colorStops.length; i++) {
            const stop = colorStops[i];

            if (typeof stop.offset === "number" && typeof stop.color === "string") {
                gradient.addColorStop(stop.offset, stop.color);
            }
        }


        return gradient;
    }
    /**
     * Creates a radial gradient using the size and coordinates of two circles.
     * For example:
     * 
     * Renderer.CreateRadialGradient(50, 50, 0, 100, 100, 50);
     * 
     * @param {number} x0 The x-axis coordinate of the start circle.
     * @param {number} y0 The y-axis coordinate of the start circle.
     * @param {number} r0 The radius of the start circle. Must be non-negative and finite.
     * @param {number} x1 The x-axis coordinate of the end circle.
     * @param {number} y1 The y-axis coordinate of the end circle.
     * @param {number} r1 The radius of the end circle. Must be non-negative and finite.
     * @param {Array<LinearGradientColorStopDefinitions>} colorStops Color stops.
     */
    CreateRadialGradient(x0, y0, r0, x1, y1, r1, colorStops) {

        if (typeof x0 !== "number") throw new Error("The x-axis coordinate of the start circle has not been specified as a number.");
        if (typeof y0 !== "number") throw new Error("The y-axis coordinate of the start circle has not been specified as a number.");
        if (typeof r0 !== "number") throw new Error("The radius of the start circle has not been specified as a number.");
        if (typeof x1 !== "number") throw new Error("The x-axis coordinate of the end circle has not been specified as a number.");
        if (typeof y1 !== "number") throw new Error("The y-axis coordinate of the end circle has not been specified as a number.");
        if (typeof r1 !== "number") throw new Error("The radius of the end circle has not been specified as a number.");
        
        if (!(this.ctx instanceof CanvasRenderingContext2D)) throw new Error("Failed to generate a linear gradient object since no CanvasRenderingContext2D has been defined.");

        const ctx = this.ctx;

        const gradient = ctx.createRadialGradient(x0, y0, r0, x1, y1, r1);

        for (var i = 0; i < colorStops.length; i++) {
            const stop = colorStops[i];

            if (typeof stop.offset === "number" && typeof stop.color === "string") {
                gradient.addColorStop(stop.offset, stop.color);
            }
        }


        return gradient;
    }
    CreateConicGradient() {


    }
}

export class SceneUpdater {

    /**@type {string} */
    id;

    /**@type {Renderer} */
    renderer;

    /**@type {AnimationFrameProvider} */
    animationFrame;

    /**@type {number} */
    fps;

    /**@type {Array} */
    times;

    /**@type {number} */
    deltaTime;

    /**@type {Object} */
    events;

    /**@type {number} */
    lastTimestamp;

    /**@type {number} */
    perfrectFrameRate;

    /**
     * Creates a new scene updater. This instance creates a animation loop which will call itself each possible frame.
     * @param {Renderer} renderer
     */
    constructor(renderer) {

        if (!(renderer instanceof Renderer)) throw new Error("The given argument (as renderer) is not a Renderer instance.");

        this.id = generateUniqueID(18);

        this.renderer = renderer;

        this.animationFrame = null;

        this.fps = 0;
        this.times = [];
        this.deltaTime = 0;
        this.lastTimestamp = performance.now();
        this.perfrectFrameRate = 60;

        this.events = {
            onUpdate: []
        };
    }
    Update(timeStamp) {

        this.animationFrame = window.requestAnimationFrame((d) => this.Update(d));

        const now = performance.now();

        this.deltaTime = (now - this.lastTimestamp) / (1000 / this.perfrectFrameRate);

        this.lastTimestamp = now;


        if (typeof this.renderer !== "undefined") {

            this.renderer.ClearScene();

            this.renderer.Render(null, this.deltaTime);

        }


        for (let i = 0; i < this.events.onUpdate.length; i++) {

            let updateEvent = this.events.onUpdate[i];

            if (typeof updateEvent === "function") updateEvent(this.deltaTime);

        }


        while (this.times.length > 0 && this.times[0] <= now - 1000) this.times.shift();

        this.times.push(now);
        this.fps = this.times.length;
    }
    /**
     * Creates an event for this instance. Callback function will be called when a specific event got fired.
     * @param {"update"} event
     * @param {Function} callback
     */
    On(event, callback) {

        if (typeof event !== "string") throw new Error("The given argument (as event) is not a string.");
        if (!(callback instanceof Function)) throw new Error("The given argument (as callback) is not a function.");

        switch (event) {
            case "update":

                this.events.onUpdate.push(callback);

                break;
            default:
                throw new Error(`The given event name '${event}' is not a recognized event for this instance.`);
                break;
        }
    }
}


// ================ Public methods ================

/**
 * Waits for a specific time to continue executing code in a codeblock.
 * @param {number} milliseconds
 */
export async function WaitFor(milliseconds) {

    if (typeof milliseconds !== "number") throw new Error("The given argument (as milliseconds) is not a number.");

    return new Promise(function (resolve, reject) {

        setTimeout(resolve, milliseconds);

    });
}

/**
 * Allows Oktay2D to use features from different flags.
 * @param {"new-canvas-2d-api"} flagName
 */
export function SetFlag(flagName) {

    switch (flagName) {
        case "new-canvas-2d-api":

            if (_LIB_OPTIONS._USABLE_FLAGS.includes(flagName)) return null;

            if (_LIB_OPTIONS._CHECK_FLAG_STATE(flagName)) {

                _LIB_OPTIONS._USABLE_FLAGS.push(flagName);

                console.warn(`Flag '${flagName}' succesfully has been set for Oktay2D. More features will be available, but be careful when using it in production.\n\nSome features may not be available: \n- 4x4 matrices.\n- CanvasFilter class.`);

                return flagName;
            } else {
                console.warn(`Failed to set flag '${flagName}'.`);
            }

            break;
        default:

            return null;

            break;
    }
}


// ================ Extensions ================

// Array extension
Array.prototype.getRandomElement = function () { return this[Math.floor(Math.random() * this.length)] };


// ================ Exports ================

// Exporting rendering things.
export { Camera } from "./rendering/camera.js";
export { FrameCapturer } from "./rendering/canvasEncoder.js";
export { PostProcessor } from "./rendering/postProcessor.js";

// Export audio things.
export { AudioNode } from "./audio/audioNode.js";
export { DynamicAudioController } from "./audio/dynamicAudio.js";

// Exporting essentials.
export { Color, ColorNode, LinearGradientColorNode } from "./essentials/color.js";
export * as Math from "./essentials/math.js";
export { GetInputDown, GetInputUp, keyCodes, activeKeys } from "./essentials/keyboard.js";
export { GamePad, ConnectedGamePads } from "./essentials/gamepad.js";
export { AnimateSingleInteger } from "./essentials/animator.js";
export { CutImageToSprites, SpritesheetAnimator, CutEntireImageToSprites, SpritesheetAnimationController } from "./essentials/spritesheet.js";
export { LoadImageSync } from "./essentials/loader.js";

// Exporting graphical elements.
export { Rectangle } from "./graphics/rectangle.js";
export { Circle } from "./graphics/circle.js";
export { TextNode } from "./graphics/text.js";
export { ParticleSystem } from "./graphics/particleSystem.js";
export { Line, QuadraticCurve } from "./graphics/line.js";
export { IsoscelesTriangle } from "./graphics/traingle.js";
export { PointLight } from "./graphics/lightning.js";

// Exporting controllers.
export { PhysicsController } from "./controllers/physicsController.js";

// Export... uhh... idfk what type of things these are.
export { RenderObject, generateUniqueID };
export * as Filters from "./rendering/filter.js";