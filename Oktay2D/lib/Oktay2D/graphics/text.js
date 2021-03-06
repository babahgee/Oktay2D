import { Color } from "../essentials/color.js";
import { RenderObject } from "../essentials/renderobject.js";

export class TextNode extends RenderObject {
    /**
     * Creates a text node that will appear on a renderer scene.
     * @param {string} text Text to show.
     * @param {number} x Text x position.
     * @param {number} y Text y position.
     * @param {object} style Possible styles and options for this text node instance. Allowing text look very sexy and fancy.
     * 
     * @param style.textColor {string | Color}
     * @param style.borderColor {string | Color}
     * @param style.font {string}
     * @param style.textAlign {"start" | "end" | "left" | "right" | "center"}
     * @param style.textBaseline {"top" | "hanging" | "middle" | "alphabetic" | "ideographic" | "bottom"}
     * @param style.direction {"ltr" | "rtl" | "inherit"}
     * @param style.opacity {number}
     * @param style.shadowColor {string | Color}
     * @param style.shadowBlur {number}
     * @param style.shadowOffsetX {number}
     * @param style.shadowOffsetY {number}
     * @param style.strokeColor {string}
     * @param style.strokeWidth {number}
     * @param style.filter {string}
     * @param style.globalCompositeOperation {"source-over" | "source-in" | "source-out" | "source-atop" | "destination-over" | "destination-in" | "destination-out" | "destination-atop" | "lighter"| "copy" | "xor" | "multiply" | "screen" | "overlay" | "darken" | "lighten" | "color-dodge" | "color-burn" | "hard-light" | "soft-light" | "difference" | "exclusion" | "hue" | "saturation" | "color" | "luminosity"}
     */
    constructor(text, x, y, style) {
        super();

        if (typeof x !== "number") throw new Error("The given argument (as x) is not a number.");
        if (typeof y !== "number") throw new Error("The given argument (as y) is not a number.");

        this.text = text;
        this.x = x;
        this.y = y;
        this.style = {...style};

        this.width = 1;
        this.height = 1;

        this.rotation = null;
        this.transformation = null;

        this.outlineTextBoundary = false;
    }
    CalculateDimension() {

        if (typeof this.style.font !== "string") return null;

        const font = this.style.font,
            parsedFontSize = parseInt(font.substring(0, font.indexOf(" "))),
            characterLength = this.text.length,
            calculatedWidth = characterLength * parsedFontSize,
            calculatedHeight = parsedFontSize;

        return {
            width: calculatedWidth,
            height: calculatedHeight
        };
    }
    /**
     * Draws content.
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} deltaTime
     * @return {this}
     */
    Draw(ctx, deltaTime) {

        ctx.save();
        ctx.beginPath();

        ctx.translate(this.x, this.y);

        if (typeof this.rotation === "number") ctx.rotate(this.rotation);

        if (this.transformation !== null) ctx.transform(this.transformation.horizontalScaling, this.transformation.verticalSkewing, this.transformation.horizontalSkewing, this.transformation.verticalScaling, this.transformation.horizontalTranslation, this.transformation.verticalTranslation);

        ctx.globalAlpha = typeof this.style.opacity === "number" ? this.style.opacity : 1;
        ctx.globalCompositeOperation = typeof this.style.globalCompositeOperation === "string" ? this.style.globalCompositeOperation : null;
        if (typeof this.style.filter === "string") ctx.filter = this.style.filter

        if (this.style.shadowColor instanceof Color) ctx.shadowColor = typeof this.style.shadowColor.hex !== null ? this.style.shadowColor.hex : "transparent";
        else ctx.shadowColor = typeof this.style.shadowColor === "string" ? this.style.shadowColor : false;

        ctx.shadowBlur = typeof this.style.shadowBlur === "number" ? this.style.shadowBlur : 0;
        ctx.shadowOffsetX = typeof this.style.shadowOffsetX === "number" ? this.style.shadowOffsetX : 0;
        ctx.shadowOffsetY = typeof this.style.shadowOffsetY === "number" ? this.style.shadowOffsetY : 0;

        ctx.font = typeof this.style.font === "string" ? this.style.font : "10px sans-serif";
        ctx.textAlign = typeof this.style.textAlign === "string" ? this.style.textAlign : "start";
        ctx.textBaseline = typeof this.style.textBaseline === "string" ? this.style.textBaseline : "alphabetic";

        ctx.lineWidth = typeof this.style.strokeWidth === "number" ? this.style.strokeWidth : 1;

        if (this.style.textColor instanceof Color) ctx.fillStyle = typeof this.style.textColor.hex !== null ? this.style.textColor.hex : "transparent";
        else ctx.fillStyle = typeof this.style.textColor === "string" ? this.style.textColor : "black";
        
        if (this.style.strokeColor instanceof Color) ctx.strokeStyle = typeof this.style.strokeColor.hex !== null ? this.style.strokeColor.hex : "transparent";
        else ctx.strokeStyle = typeof this.style.strokeColor === "string" ? this.style.strokeColor : "black";

        if (typeof this.style.strokeColor !== "undefined") ctx.strokeText(this.text, this.width / this.text.length, this.height);
        if (typeof this.style.textColor !== "undefined") ctx.fillText(this.text, this.width / this.text.length, this.height);

        ctx.closePath();

        if (typeof this.outlineTextBoundary) {

            ctx.beginPath();

            ctx.strokeStyle = "red";
            ctx.strokeRect(0, 0, this.width, this.height);

            ctx.closePath();
        }

        ctx.restore();

    }
    /**
    * Sets matrix transform on shape.
    * @param {number} horizontalScaling Horizontal scaling. A value of '1' results in no scaling.
    * @param {number} verticalSkewing Vertical skewing.
    * @param {number} horizontalSkewing Horizontal skewing.
    * @param {number} verticalScaling Vertical scaling. A value of '1' results in no scaling.
    * @param {number} horizontalTranslation Horizontal translation.
    * @param {number} verticalTranslation Vetical translation.
    */
    SetTransform(horizontalScaling, verticalSkewing, horizontalSkewing, verticalScaling, horizontalTranslation, verticalTranslation) {

        if (horizontalScaling === null) {

            this.transformation = null;

            return this;
        }


        this.transformation = {
            horizontalScaling: horizontalScaling,
            verticalSkewing: verticalSkewing,
            horizontalSkewing: horizontalSkewing,
            verticalScaling: verticalScaling,
            horizontalTranslation: horizontalTranslation,
            verticalTranslation: verticalTranslation
        }

        return this.transformation;

    }

    /**
     * Sets rotation on shape.
     * @param {number | null} angle The rotation angle, clockwise in radians. You can use degree * Math.PI / 180 to calculate a radian from a degree.
     */
    SetRotation(angle) {

        if (angle === null) {

            this.rotation = null;

            return this;
        }

        if (typeof angle !== "number") throw new Error("The given argument (as angle) is not a number.");

        this.rotation = angle;

        return this;
    }

}
