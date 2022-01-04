import { generateUniqueID } from "./essentials/generateUniqueId.js";
import { RenderObject, RenderObjects } from "./essentials/renderobject.js";
import { Camera } from "./rendering/camera.js";

export class CanvasScene {
    /**
     * Creates a new Canvas Scene
     * @param {number} width
     * @param {number} height
     * @param {HTMLElement} domElement
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
            y: 0
        }

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
    }
    HandleEvents() {

        this.canvas.addEventListener("mousemove", event => {
            this.mouse.x = event.offsetX;
            this.mouse.y = event.offsetY;
        });


    }
    HandleResizeEvent() {

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
    RenderAllObjects() {

        const ctx = this.ctx;

        if (this.camera instanceof Camera) {

            ctx.save();

            ctx.translate(this.camera.x, this.camera.y);
            ctx.scale(this.camera.scaleX, this.camera.scaleY);

            let i = 0;

            while (i < this.renderObjects.length) {

                /**@type {RenderObject} */
                const object = this.renderObjects[i];

                if (this.camera.offscreenRendering) {

                    if (typeof object.width === "number" && typeof object.height === "number") {

                        if (object.x > -((this.camera.x + 30) / this.camera.scaleX) && object.x < -((this.camera.x - this.camera.width) / this.camera.scaleX) &&
                            object.y > -((this.camera.y + 30) / this.camera.scaleY) && object.y < -((this.camera.y - (this.camera.height))) / this.camera.scaleY) {


                            if (typeof object.Draw === "function") object.Draw(this.ctx);

                        }

                    }

                }

                i += 1;
            }


            ctx.restore();

            return this;
        }

        let i = 0;

        while (i < this.renderObjects.length) {

            /**@type {RenderObject} */
            const object = this.renderObjects[i];

            if (typeof object.Draw === "function") object.Draw(this.ctx);

            i += 1;
        }

        return this;
    }
    /**
     * Renders an object in this renderer instance.
     * @param {RenderObject} renderObject
     */
    Render(renderObject) {

        if (!(renderObject instanceof RenderObject)) {

            this.RenderAllObjects();

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

                return;
            }

            i += 1;
        }

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

        this.events = {
            onUpdate: []
        };
    }
    Update(timeStamp) {

        this.animationFrame = window.requestAnimationFrame((d) => this.Update(d));

        for (let i = 0; i < this.events.onUpdate.length; i++) {

            let updateEvent = this.events.onUpdate[i];

            if (typeof updateEvent === "function") updateEvent(timeStamp);

        }

        if (typeof this.renderer !== "undefined") this.renderer.Render();

        const now = performance.now();

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

// Export from other files.
export { Rectangle } from "./shapes/rectangle.js";
export { Circle } from "./shapes/circle.js";
export { Color, ColorNode, LinearGradientColorNode } from "./essentials/color.js";
export { AudioNode } from "./audio/audioNode.js";
export { TextNode } from "./rendering/text.js";
export { FrameCapturer } from "./rendering/canvasEncoder.js";
export { RenderObject };

export { generateUniqueID };
export * as Math from "./essentials/math.js";
export { Camera } from "./rendering/camera.js";