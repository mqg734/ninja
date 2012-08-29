/* <copyright>
Copyright (c) 2012, Motorola Mobility LLC.
All Rights Reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice,
  this list of conditions and the following disclaimer.

* Redistributions in binary form must reproduce the above copyright notice,
  this list of conditions and the following disclaimer in the documentation
  and/or other materials provided with the distribution.

* Neither the name of Motorola Mobility LLC nor the names of its
  contributors may be used to endorse or promote products derived from this
  software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
POSSIBILITY OF SUCH DAMAGE.
</copyright> */

var Montage =           require("montage/core/core").Montage,
    CanvasController = require("js/controllers/elements/canvas-controller").CanvasController,
    njModule = require("js/lib/NJUtils"),
    World = require("js/lib/drawing/world").World,
    MaterialsModel = require("js/models/materials-model").MaterialsModel;

exports.ShapesController = Montage.create(CanvasController, {

    setProperty: {
        value: function(el, p, value, eventType, source) {
            var val = parseInt(value),
                canvas,
                m,
                color;
            switch(p) {
                case "strokeSize":
                    var strokeInfo = njModule.NJUtils.getValueAndUnits(value);
                    val = this.GetValueInPixels(strokeInfo[0], strokeInfo[1]);

                    var geomType = el.elementModel.shapeModel.GLGeomObj.geomType();
                    // Changing stroke size should grow/shrink the shape from the center.

                    var delta = ~~(val - el.elementModel.shapeModel.GLGeomObj.strokeSize),
                        ol = this.application.ninja.elementMediator.getProperty(el, "left", parseInt),
                        ot = this.application.ninja.elementMediator.getProperty(el, "top", parseInt),
                        ow = this.application.ninja.elementMediator.getProperty(el, "width", parseInt),
                        oh = this.application.ninja.elementMediator.getProperty(el, "height", parseInt),
                        l, t, w, h;

                    if(geomType === 3) {
                        var slope = el.elementModel.shapeModel.GLGeomObj.slope;
                        // set the dimensions
                        if(slope === "horizontal") {
                            h = Math.max(val, 1);
                            t = ot - ~~(delta/2);
                        } else if(slope === "vertical") {
                            w = Math.max(val, 1);
                            l = ol - ~~(delta/2);
                        } else {
                            var oldXAdj = el.elementModel.shapeModel.GLGeomObj.getXAdj();
                            var oldYAdj = el.elementModel.shapeModel.GLGeomObj.getYAdj();
                            var theta = Math.atan(slope);
                            var xAdj = Math.abs((val/2)*Math.sin(theta));
                            var yAdj = Math.abs((val/2)*Math.cos(theta));
                            var dX = ~~(xAdj*2 - oldXAdj*2);
                            var dY = ~~(yAdj*2 - oldYAdj*2);

                            l = ol - dX;
                            t = ot - dY;
                            w = ow + dX*2;
                            h = oh + dY*2;

                            el.elementModel.shapeModel.GLGeomObj.setXAdj(xAdj);
                            el.elementModel.shapeModel.GLGeomObj.setYAdj(yAdj);
                        }
                    } else {
                        l = ol - ~~(delta/2);
                        t = ot - ~~(delta/2);
                        w = ow + delta;
                        h = oh + delta;
                    }

                    this.application.ninja.elementMediator.setProperties([{element:el,
                                    properties:{left: l + "px", top: t + "px", width: w + "px", height: h + "px"},
                                    previousProperties:{left: ol + "px", top: ot + "px", width: ow + "px", height: oh + "px"}}],
                                    eventType, source);

                    el.elementModel.shapeModel.GLGeomObj.strokeSize = val;
                    break;
                case "innerRadius":
                case "tlRadius":
                case "trRadius":
                case "blRadius":
                case "brRadius":
                    el.elementModel.shapeModel.GLGeomObj[p] = val;
                    break;
                case "width":
                    if(el.elementModel.shapeModel.selection && !el.elementModel.reportAsShape) {
                        this.setShapeProperty(el, "width", val);
                    } else {
                        CanvasController.setProperty(el, p, value);
                        el.elementModel.shapeModel.GLWorld.setViewportFromCanvas(el);
                        this.setShapeProperty(el, "width", val);
                    }
                    break;
                case "height":
                    if(el.elementModel.shapeModel.selection && !el.elementModel.reportAsShape) {
                        this.setShapeProperty(el, "height", val);
                    } else {
                        el.elementModel.shapeModel.GLGeomObj.setHeight(val);
                        CanvasController.setProperty(el, p, value);
                        el.elementModel.shapeModel.GLWorld.setViewportFromCanvas(el);
                        el.elementModel.shapeModel.GLGeomObj.buildBuffers();
                        el.elementModel.shapeModel.GLWorld.render();
                    }
                    break;
                case "useWebGl":
                    canvas = njModule.NJUtils.make("canvas", el.className, this.application.ninja.currentDocument);
                    canvas.setAttribute("data-RDGE-id", njModule.NJUtils.generateRandom());
                    canvas.width = el.width;
                    canvas.height = el.height;
                    canvas._model = el.elementModel;
                    this.toggleWebGlMode(canvas, value);
                    this.application.ninja.elementMediator.replaceElement(canvas, el);
                    break;
                case "strokeMaterial":
                    // skip shape types that don't support WebGL
                    if(!el.elementModel.shapeModel.useWebGl) {
                        return;
                    }
                    m = Object.create(MaterialsModel.getMaterial(value));
                    if(m)
                    {
                        el.elementModel.shapeModel.GLGeomObj.setStrokeMaterial(m);
                        color = this.getMaterialColor(value);
                        if(color)
                        {
                            el.elementModel.shapeModel.GLGeomObj.setStrokeColor(color);
                        }
                        el.elementModel.shapeModel.GLGeomObj.buildBuffers();
                        el.elementModel.shapeModel.GLWorld.render();
                    }
                    break;
                case "fillMaterial":
                    // skip shape types that don't support WebGL or fill color
                    if(!el.elementModel.shapeModel.GLGeomObj.canFill || !el.elementModel.shapeModel.useWebGl) {
                        return;
                    }
                    m = Object.create(MaterialsModel.getMaterial(value));
                    if(m)
                    {
                        el.elementModel.shapeModel.GLGeomObj.setFillMaterial(m);
                        color = this.getMaterialColor(value);
                        if(color)
                        {
                            el.elementModel.shapeModel.GLGeomObj.setFillColor(color);
                        }
                        el.elementModel.shapeModel.GLGeomObj.buildBuffers();
                        el.elementModel.shapeModel.GLWorld.render();
                    }
                    break;
                case "editStrokeMaterial":
                    NJevent("showMaterialPopup",{materialId : this.getProperty(el, "strokeMaterial"),  useSelection: true,  whichMaterial: 'stroke'});
                    break;
                case "editFillMaterial":
                    NJevent("showMaterialPopup",{materialId : this.getProperty(el, "fillMaterial"),  useSelection: true,  whichMaterial: 'fill'});
                    break;
                case "animate":
                    if(value)
                    {
//                        el.elementModel.shapeModel.animate = true;
                        el.elementModel.shapeModel.GLWorld._previewAnimation = true;
                        el.elementModel.shapeModel.GLWorld.restartRenderLoop();
                    }
                    else
                    {
//                        el.elementModel.shapeModel.animate = false;
                        el.elementModel.shapeModel.GLWorld._previewAnimation = false;
                        el.elementModel.shapeModel.GLWorld._canvas.task.stop();
                    }
                    break;
                case "strokeHardness":
                    this.setShapeProperty(el, "strokeHardness", value);
                    el.elementModel.shapeModel.GLGeomObj.setStrokeHardness(val);
                    el.elementModel.shapeModel.GLWorld.render();
                    break;
                case "strokeSmoothing":
                    this.setShapeProperty(el, "strokeSmoothing", value);
                    el.elementModel.shapeModel.GLGeomObj.setSmoothingAmount(val);
                    el.elementModel.shapeModel.GLWorld.render();
                    break;
                case "doSmoothing":
                    this.setShapeProperty(el, "doSmoothing", value);
                    el.elementModel.shapeModel.GLGeomObj.setDoSmoothing(value);
                    el.elementModel.shapeModel.GLWorld.render();
                    break;
                case "isCalligraphic":
                    this.setShapeProperty(el, "isCalligraphic", value);
                    el.elementModel.shapeModel.GLGeomObj.setStrokeUseCalligraphic(value);
                    el.elementModel.shapeModel.GLWorld.render();
                    break;
                case "strokeAngle":
                    this.setShapeProperty(el, "strokeAngle", value);
                    el.elementModel.shapeModel.GLGeomObj.setStrokeAngle(Math.PI * val/180);
                    el.elementModel.shapeModel.GLWorld.render();
                    break;
                case "left":
                    if(el.elementModel.shapeModel.selection && !el.elementModel.reportAsShape) {
                        this.setShapeProperty(el, "left", val + parseInt(CanvasController.getProperty(el, p)));
                    } else {
                        CanvasController.setProperty(el, p, value);
                    }
                    break;
                case "top":
                    if(el.elementModel.shapeModel.selection && !el.elementModel.reportAsShape) {
                        this.setShapeProperty(el, "top", val + parseInt(CanvasController.getProperty(el, p)));
                    } else {
                        CanvasController.setProperty(el, p, value);
                    }
                    break;
                default:
                    CanvasController.setProperty(el, p, value);
            }
            this.application.ninja.currentDocument.model.needsSave = true;
        }
    },

    getProperty: {
        value: function(el, p) {
            switch(p) {
                case "strokeSize":
                case "innerRadius":
                case "tlRadius":
                case "trRadius":
                case "blRadius":
                case "brRadius":
                case "useWebGl":
                case "animate":
                    return this.getShapeProperty(el, p);
                case "border":
                    return this.getColor(el, false);
                case "background":
                    return this.getColor(el, true);
                case "strokeHardness":
                    if (el.elementModel && el.elementModel.shapeModel){
                        return el.elementModel.shapeModel.GLGeomObj.getStrokeHardness();
                    } else {
                        return null;
                    }
                    break;
                case "doSmoothing":
                    if (el.elementModel && el.elementModel.shapeModel){
                        return el.elementModel.shapeModel.GLGeomObj.getDoSmoothing();
                    } else {
                        return null;
                    }
                    break;
                case "strokeSmoothing":
                    if (el.elementModel && el.elementModel.shapeModel){
                        return el.elementModel.shapeModel.GLGeomObj.getSmoothingAmount();
                    } else {
                        return null;
                    }
                    break;
                case "isCalligraphic":
                    if (el.elementModel && el.elementModel.shapeModel){
                        return el.elementModel.shapeModel.GLGeomObj.getStrokeUseCalligraphic();
                    } else {
                        return null;
                    }
                    break;
                case "strokeAngle":
                    if (el.elementModel && el.elementModel.shapeModel){
                        return 180*el.elementModel.shapeModel.GLGeomObj.getStrokeAngle()/Math.PI;
                    } else {
                        return null;
                    }
                    break;


                case "strokeMaterial":
                    var sm = el.elementModel.shapeModel.GLGeomObj.getStrokeMaterial();
                    if(sm)
                    {
                        return sm.getName();
                    }
                    else
                    {
                        return "Flat";
                    }
                case "fillMaterial":
                    var fm = el.elementModel.shapeModel.GLGeomObj.getFillMaterial();
                    if(fm)
                    {
                        return fm.getName();
                    }
                    else
                    {
                        return "Flat";
                    }
                case "left":
                    if(el.elementModel.shapeModel.selection && !el.elementModel.reportAsShape) {
                        return (this.getShapeProperty(el, "left") - parseInt(CanvasController.getProperty(el, p)) + "px");
                    } else {
                        return CanvasController.getProperty(el, p);
                    }
                    break;
                case "top":
                    if(el.elementModel.shapeModel.selection && !el.elementModel.reportAsShape) {
                        return (this.getShapeProperty(el, "top") - parseInt(CanvasController.getProperty(el, p)) + "px");
                    } else {
                        return CanvasController.getProperty(el, p);
                    }
                    break;
                case "width":
                    if(el.elementModel.shapeModel.selection && !el.elementModel.reportAsShape) {
                        return this.getShapeProperty(el, "width") + "px";
                    } else {
                        return CanvasController.getProperty(el, p);
                    }
                    break;
                case "height":
                    if(el.elementModel.shapeModel.selection && !el.elementModel.reportAsShape) {
                        return this.getShapeProperty(el, "height") + "px";
                    } else {
                        return CanvasController.getProperty(el, p);
                    }
                    break;
                default:
                    return CanvasController.getProperty(el, p);
            }
        }
    },

    getShapeProperty: {
        value: function(el, prop) {
            if(el.elementModel && el.elementModel.shapeModel && el.elementModel.shapeModel.GLGeomObj)
            {
                return el.elementModel.shapeModel.GLGeomObj[prop];
            }
            else
            {
                console.log("No shapeModel, one should have been created already");
                return null;
            }
        }
    },

    setShapeProperty: {
        value: function(el, prop, value) {
            if(el.elementModel && el.elementModel.shapeModel && el.elementModel.shapeModel.GLGeomObj)
            {
                el.elementModel.shapeModel.GLGeomObj[prop] = value;
            }
            else
            {
                console.log("No shapeModel, one should have been created already");
            }
        }
    },

    GetValueInPixels: {
        value: function(value, units, h)
        {
            switch(units)
            {
                case "px":
                {
                    return value;
                }
                case "pt":
                {
                    return ~~(value*4/3);
                }
                case "%":
                {
                    if(h)
                    {
                        return ~~(value/100*h);
                    }
                    else
                    {
                        console.warn("Can't use % for a line's stroke size, using 10 for the value.");
                        return 10;
                    }
                }
            }
        }
    },

    CapWorldPercentFromValue: {
        value: function(value, units, h)
        {
            return Math.min(this.GetWorldPercentFromValue(value, units, h), 2);
        }
    },

    GetWorldPercentFromValue: {
        value: function(value, units, h)
        {
            switch(units)
            {
                case "pt":
                {
                    value = Math.round(value*4/3);
                    return 4*value/h;
                }
                case "px":
                {
                    return 4*value/h;
                }
                case "%":
                {
                    // Our calculations in GLWorld use 2 = 100%, so our calculations would usually be value/50,
                    // but in order to get values other than 0, 1, and 2, we need to multiply by 10, round that value,
                    // and then divide by 50*10 again.
                    // 100*10 = 1000/500 = 2
                    // 20*10 = 200/500 = 0.4
                    // 50*10 = 500/500 = 1
                    return Math.round(value*10)/500;
                }
                default:
                {
                    console.warn("Unhandled units " + units);
                }
            }
        }
    },

    //--------------------------------------------------------------------------------------------------------
    // Routines to get/set color properties
    getColor: {
        value: function(el, isFill) {
            if(isFill)
            {
                // Properties Panel asks for fill color even for shapes that only have strokes
                // Check that shape object supports fills
                if(el.elementModel.shapeModel.GLGeomObj.canFill)
                {
                    return this.application.ninja.colorController.colorModel.webGlToColor(el.elementModel.shapeModel.GLGeomObj.getFillColor());
                }
                else
                {
                    return null;
                }
            }
            else
            {
                return this.application.ninja.colorController.colorModel.webGlToColor(el.elementModel.shapeModel.GLGeomObj.getStrokeColor());
            }
        }
    },

    _setGradientMaterial: {
        value: function(el, gradientMode, isFill) {
            var m,
                gradientM;
            if(isFill)
            {
                m = el.elementModel.shapeModel.GLGeomObj.getFillMaterial();
            }
            else
            {
                m = el.elementModel.shapeModel.GLGeomObj.getStrokeMaterial();
            }

            if(gradientMode === "radial")
            {
                if( !m || (m.getName() !== "Radial Gradient") )
                {
                    gradientM = Object.create(MaterialsModel.getMaterial("Radial Gradient"));
            }
            }
            else
            {
                if( !m || (m.getName() !== "Linear Gradient") )
                {
                    gradientM = Object.create(MaterialsModel.getMaterial("Linear Gradient"));
                }
            }

            if(gradientM)
            {
                if(isFill)
                {
                    el.elementModel.shapeModel.GLGeomObj.setFillMaterial(gradientM);
                }
                else
                {
                    el.elementModel.shapeModel.GLGeomObj.setStrokeMaterial(gradientM);
                }
                el.elementModel.shapeModel.GLGeomObj.buildBuffers();
            }
        }
    },

    _setFlatMaterial: {
        value: function(el, isFill) {
            var m,
                flatM;
            if(isFill)
            {
                m = el.elementModel.shapeModel.GLGeomObj.getFillMaterial();
            }
            else
            {
                m = el.elementModel.shapeModel.GLGeomObj.getStrokeMaterial();
            }

            if(!m || ((m.getName() === "Linear Gradient") || m.getName() === "Radial Gradient") )
            {
                // Uber Material also supports solid colors, so don't change from Uber to Flat Material
                if(m && (m.getName() === "Uber")) { return; }

                flatM = Object.create(MaterialsModel.getMaterial("Flat"));
                if(flatM)
                {
                    if(isFill)
                    {
                        el.elementModel.shapeModel.GLGeomObj.setFillMaterial(flatM);
                    }
                    else
                    {
                        el.elementModel.shapeModel.GLGeomObj.setStrokeMaterial(flatM);
                    }
                    el.elementModel.shapeModel.GLGeomObj.buildBuffers();
                }
            }
        }
    },

    setColor: {
        value: function(el, color, isFill) {
            var mode = color.mode,
                webGl;
            if(isFill)
            {
                // skip shape types that don't have fill color
                if(el.elementModel.shapeModel.GLGeomObj.canFill)
                {
                    if(mode)
                    {
                        switch (mode) {
                            case 'nocolor':
                                el.elementModel.shapeModel.GLGeomObj.setFillColor(null);
                                break;
                            case 'gradient':
                                if(el.elementModel.shapeModel.useWebGl)
                                {
                                    this._setGradientMaterial(el, color.color.gradientMode, isFill);
                                }
                                el.elementModel.shapeModel.GLGeomObj.setFillColor({gradientMode:color.color.gradientMode, color:color.color.stops});
                                break;
                            default:
                                if(el.elementModel.shapeModel.useWebGl)
                                {
                                    this._setFlatMaterial(el, isFill);
                                }
                                webGl = this.application.ninja.colorController.colorModel.colorToWebGl(color.color);
                                el.elementModel.shapeModel.GLGeomObj.setFillColor(webGl);
                        }
                    }
                }
                else
                {
                    return;
                }
            }
            else
            {
                if(mode)
                {
                    switch (mode) {
                        case 'nocolor':
                            el.elementModel.shapeModel.GLGeomObj.setStrokeColor(null);
                            break;
                        case 'gradient':
                            if(el.elementModel.shapeModel.useWebGl)
                            {
                                this._setGradientMaterial(el, color.color.gradientMode, isFill);
                            }
                            el.elementModel.shapeModel.GLGeomObj.setStrokeColor({gradientMode:color.color.gradientMode, color:color.color.stops});
                            break;
                        default:
                            if(el.elementModel.shapeModel.useWebGl)
                            {
                                this._setFlatMaterial(el, isFill);
                            }
                            webGl = this.application.ninja.colorController.colorModel.colorToWebGl(color.color);
                            el.elementModel.shapeModel.GLGeomObj.setStrokeColor(webGl);
                    }
                }
            }
            el.elementModel.shapeModel.GLWorld.render();
            this.application.ninja.currentDocument.model.needsSave = true;
        }
    },

    getStroke: {
        value: function(el, stroke) {
            var strokeInfo = {},
                color,
                strokeWidth,
                strokeSize;
            if(stroke.colorInfo) {
                strokeInfo.colorInfo = {};
                color = this.getColor(el, false);
                if(color && color.color) {
                    strokeInfo.colorInfo.mode = color.mode;
                    strokeInfo.colorInfo.color = color.color;
                } else {
                    strokeInfo.colorInfo.mode = "nocolor";
                    strokeInfo.colorInfo.color = null;
                }
            }
            if(stroke.shapeInfo) {
                strokeInfo.shapeInfo = {};
                strokeWidth = this.getProperty(el, "strokeSize");
                if(strokeWidth) {
                    strokeSize = njModule.NJUtils.getValueAndUnits(strokeWidth);
                    strokeInfo.shapeInfo.strokeSize = strokeSize[0];
                    strokeInfo.shapeInfo.strokeUnits = strokeSize[1];
                }
            }
            if(stroke.webGLInfo) {
                strokeInfo.webGLInfo = {};
                if(this.getShapeProperty(el, "useWebGl")) {
                    strokeInfo.webGLInfo.material = this.getProperty(el, "strokeMaterial");
                } else {
                    strokeInfo.webGLInfo.material = null;
                }
            }
            return strokeInfo;
        }
    },

    setStroke: {
        value: function(el, stroke, eventType, source) {
            if(stroke.shapeInfo) {
                this.setProperty(el, "strokeSize", stroke.shapeInfo.strokeSize + " " + stroke.shapeInfo.strokeUnits, eventType, source);
            }
            var m;
            if(stroke.webGLInfo) {
                m = stroke.webGLInfo.material;
                this.setProperty(el, "strokeMaterial", m);
                if((m === "Linear Gradient") || (m === "Radial Gradient")) {
                    // Just use the default gradient material values
                    return;
                }
            }
            if(stroke.colorInfo) {
                if(el.elementModel.shapeModel.useWebGl) {
                    m = el.elementModel.shapeModel.GLGeomObj.getStrokeMaterial().getName();
                    if( ((stroke.colorInfo.mode === "gradient") && (m !== "Linear Gradient") && (m !== "Radial Gradient")) ||
                        ((stroke.colorInfo.mode !== "gradient") && ((m === "Linear Gradient") || (m === "Radial Gradient"))))
                    {
                        return;
                    } else {
                        this.setColor(el, stroke.colorInfo, false);
                    }
                } else {
                    this.setColor(el, stroke.colorInfo, false);
                }
            }
        }
    },

    getFill: {
        value: function(el, fill) {
            var fillInfo = {},
                color;
            if(fill.colorInfo) {
                fillInfo.colorInfo = {};
                color = this.getColor(el, true);
                if(color && color.color) {
                    fillInfo.colorInfo.mode = color.mode;
                    fillInfo.colorInfo.color = color.color;
                } else {
                    fillInfo.colorInfo.mode = "nocolor";
                    fillInfo.colorInfo.color = null;
                }
            }
            if(fill.webGLInfo) {
                fillInfo.webGLInfo = {};
                if(this.getShapeProperty(el, "useWebGl")) {
                    fillInfo.webGLInfo.material = this.getProperty(el, "fillMaterial");
                } else {
                    fillInfo.webGLInfo.material = null;
                }
            }
            return fillInfo;
        }
    },

    setFill: {
        value: function(el, fill) {
            var m;
            if(fill.webGLInfo) {
                m = fill.webGLInfo.material;
                this.setProperty(el, "fillMaterial", m);
                if((m === "Linear Gradient") || (m === "Radial Gradient")) {
                    // Just use the default gradient material values
                    return;
                }
            }
            if(fill.colorInfo) {
                if(el.elementModel.shapeModel.useWebGl) {
                    m = el.elementModel.shapeModel.GLGeomObj.getFillMaterial().getName();
                    if( ((fill.colorInfo.mode === "gradient") && (m !== "Linear Gradient") && (m !== "Radial Gradient")) ||
                        ((fill.colorInfo.mode !== "gradient") && ((m === "Linear Gradient") || (m === "Radial Gradient"))))
                    {
                        return;
                    } else {
                        this.setColor(el, fill.colorInfo, true);
                    }
                } else {
                    this.setColor(el, fill.colorInfo, true);
                }
            }
        }
    },

    DisplayMaterials: {
        value: function (cb)
        {

            var optionItem = document.createElement("option");
            optionItem.value = 0;
            optionItem.innerText = "Default";
            cb.appendChild(optionItem);

            var materials = this.application.ninja.appModel.materials;
            var len = materials.length;

            var i;
            for (i = 0; i < len; i++)
            {
                var current = materials[i];
                optionItem = document.createElement("option");
                optionItem.value = i+1;
                optionItem.innerText = current.getName();
                cb.appendChild(optionItem);
            }
        }
    },

    isElementAShape: {
        value: function(el)
        {
            return (el.elementModel && el.elementModel.reportAsShape);
        }
    },

    toggleWebGlMode: {
        value: function(el, useWebGl)
        {
            if(useWebGl)
            {
                this.convertToWebGlWorld(el);
            }
            else
            {
                this.convertTo2DWorld(el);
            }
        }
    },

    convertToWebGlWorld: {
        value: function(el)
        {
            if(el.elementModel.shapeModel.useWebGl)
            {
                return;
            }
            var world,
                worldData = el.elementModel.shapeModel.GLWorld.exportJSON();
            if(worldData)
            {
                worldData = this.flip3DSense (worldData );
                world = new World(el, true);
                el.elementModel.shapeModel.GLWorld = world;
                el.elementModel.shapeModel.useWebGl = true;
                world.importJSON(worldData);
                el.elementModel.shapeModel.GLGeomObj = world.getGeomRoot();
                }

        }
    },

    convertTo2DWorld: {
        value: function(el)
        {
            if(!el.elementModel.shapeModel.useWebGl)
            {
                return;
            }
            var world,
                worldData = el.elementModel.shapeModel.GLWorld.exportJSON();
            if(worldData)
            {
                worldData = this.flip3DSense (worldData );
                world = new World(el, false);
                el.elementModel.shapeModel.GLWorld = world;
                el.elementModel.shapeModel.useWebGl = false;
                world.importJSON(worldData);
                el.elementModel.shapeModel.GLGeomObj = world.getGeomRoot();
                }
            }
    },

    flip3DSense: {
        value: function( importStr )
        {
            var jObj;
            var index = importStr.indexOf( ';' );
            if ((importStr[0] === 'v') && (index < 24))
            {
                // JSON format.  separate the version info from the JSON info
                //var vStr = importStr.substr( 0, index+1 );
                var jStr = importStr.substr( index+1 );
                jObj = JSON.parse( jStr );
                jObj.webGL = !jObj.webGL;

                if(jObj.children)
                {
                    var nKids = jObj.children.length;
                    for (var i=0;  i<nKids;  i++)
                    {
                        var child = jObj.children[i];

                        if(jObj.webGL)
                        {
                            if(child.strokeColor)
                            {
                                if(child.strokeColor.gradientMode)
                                {
                                    // Set Linear/Radial Gradient Material for children geometry if color in canvas 2d has gradient
                                    if(child.strokeColor.gradientMode === "radial")
                                    {
                                        child.strokeMat = "Radial Gradient";
                                    }
                                    else
                                    {
                                        child.strokeMat = "Linear Gradient";
                                    }
                                }
                                else if( !child.strokeMat || (child.strokeMat === "Radial Gradient") ||
                                         (child.strokeMat === "Linear Gradient") )
                                {
                                    // Set Flat Material for children geometry if no material defined or color has been changed to solid
                                    child.strokeMat = "Flat";
                                }
                            }

                            if(child.fillColor)
                            {
                                if(child.fillColor.gradientMode)
                                {
                                    // Set Linear/Radial Gradient Material for children geometry if color in canvas 2d has gradient
                                    if(child.fillColor.gradientMode === "radial")
                                    {
                                        child.fillMat = "Radial Gradient";
                                    }
                                    else
                                    {
                                        child.fillMat = "Linear Gradient";
                                    }
                                }
                                else if( !child.fillMat || (child.fillMat === "Radial Gradient") ||
                                         (child.fillMat === "Linear Gradient") )
                                {
                                    // Set Flat Material for children geometry if no material defined or color has been changed to solid
                                    child.fillMat = "Flat";
                                }
                            }
                        }
                    }
                }
            }

            return jObj;
        }
    },

    getMaterialColor: {
        value: function(m)
        {
            var css,
                colorObj;

            css = m.getGradientData();

            if(css)
            {
                colorObj = this.application.ninja.colorController.getColorObjFromCss(css);
                if(colorObj)
                {
                    return {gradientMode:colorObj.color.gradientMode, color:colorObj.color.stops};
                }
            }

            return null;
        }
    }

});
