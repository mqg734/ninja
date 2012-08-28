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

var Montage =   require("montage/core/core").Montage,
    ShapeTool = require("js/tools/ShapeTool").ShapeTool,
    ShapesController =  require("js/controllers/elements/shapes-controller").ShapesController,
    Circle = require("js/lib/geom/circle").Circle;

exports.OvalTool = Montage.create(ShapeTool, {

    _toolID: { value: "ovalTool" },
    _imageID: { value: "ovalToolImg" },
    _toolImageClass: { value: "ovalToolUp" },
    _selectedToolImageClass: { value: "ovalToolDown" },
    _toolTipText: { value: "Oval Tool (O)" },
    _selectedToolClass:{value:"ovalToolSpecificProperties"},
    _ovalView : { value: null, writable: true},

    RenderShape: {
        value: function (w, h, planeMat, midPt, canvas) {
            if( (Math.floor(w) === 0) || (Math.floor(h) === 0) ) {
                return;
            }

            var left = Math.round(midPt[0] - 0.5*w);
            var top = Math.round(midPt[1] - 0.5*h);

            var strokeOptions = {};
            var fillOptions = {};

            strokeOptions.strokeStyleIndex = this.options.strokeStyleIndex;
            strokeOptions.strokeStyle = this.options.strokeStyle;

            strokeOptions.strokeSize = ShapesController.GetValueInPixels(this.options.strokeSize.value, this.options.strokeSize.units, h);

            var innerRadius = this.options.innerRadius.value;

            strokeOptions.stroke = this.options.stroke;
            fillOptions.fill = this.options.fill;
            strokeOptions.strokeMaterial = null;
            fillOptions.fillMaterial = null;

            if(this.options.use3D) {
                strokeOptions.strokeMaterial = this.options.strokeMaterial;
                fillOptions.fillMaterial = this.options.fillMaterial;
            }

            var world = this.getGLWorld(canvas, this.options.use3D);

            var xOffset = left - canvas.offsetLeft + w/2 - canvas.width/2;
            var yOffset = top - canvas.offsetTop + h/2 - canvas.height/2;

            var oval = Object.create(Circle, {});
            oval.init(world, xOffset, yOffset, w, h, innerRadius, strokeOptions, fillOptions);

            world.addObject(oval);
            world.render();

            canvas.elementModel.shapeModel.updateSelection(canvas.elementModel, oval);
            this.application.ninja.selectionController.selectElement(canvas);
        }
    }
});
