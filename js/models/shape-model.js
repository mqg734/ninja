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

var Montage = require("montage/core/core").Montage,
    Component = require("montage/ui/component").Component;

exports.ShapeModel = Montage.create(Component, {

    // This model is for the world only.
    // If a geom obj is selected within this world, the containing canvas's
    // elementModel's type, selection, controller and pi will be updated to use the geom obj's values.
    // Else, the elementModel will report the GLWorld's values.

    shapeCount:             { value: 0 },
    useWebGl:               { value: false },
    GLWorld:                { value: null },
    selection:              { value: null },

    // update element model's selection to match selected geomObj's values
    updateSelection: {
        value: function(elementModel, geomObj) {
            if(geomObj) {
                this.selection = geomObj;
                this.GLGeomObj = geomObj;
                elementModel.selection = geomObj.getGeomName();
                elementModel.pi = geomObj.getGeomName() + "Pi";
            } else {
                this.selection = null;
                this.GLGeomObj = this.GLWorld.getGeomRoot();
                elementModel.selection = "ShapeWorld";
                elementModel.pi = "ShapeWorldPi";
            }
        }
    },

    animate:                { value: true },
    GLGeomObj:              { value: null }
});
