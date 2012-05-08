/* <copyright>
This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
(c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
</copyright> */

////////////////////////////////////////////////////////////////////////
//
var Montage = 		require("montage/core/core").Montage,
    Component = 	require("montage/ui/component").Component;

var ClipboardController = exports.ClipboardController = Montage.create(Component, {
    hasTemplate: {
        value: false
    },

    deserializedFromTemplate: {
        value: function() {
            document.body.addEventListener("copy", this, false);
            document.body.addEventListener("cut", this, false);
            document.body.addEventListener("paste", this, false);

            //ninja menu events
            this.eventManager.addEventListener("executeCut", this, false);
            this.eventManager.addEventListener("executeCopy", this, false);
            this.eventManager.addEventListener("executePaste", this, false);
        }
    },

    _copyFlag:{
        value:false
    },

    copyFlag:{
        get:function(){return this._copyFlag;},
        set:function(value){this._copyFlag = value;}
    },

    _newCopyFlag:{
        value:true
    },

    newCopyFlag:{
        get:function(){return this._newCopyFlag;},
        set:function(value){this._newCopyFlag = value;}
    },

    handleExecuteCopy:{
        value: function(){document.execCommand('copy',false,null);}
    },

    handleExecuteCut:{
        value: function(){document.execCommand('cut',false,null);}
    },

    handleExecutePaste:{
        value: function(){document.execCommand('paste',false,null);}
    },

    handleCopy:{
        value:function(clipboardEvent){
            //depends on the clipboard event
            if(this.application.ninja.selectedElements.length > 0){
                clipboardEvent.clipboardData.setData('text/html', ''+this.application.ninja.selectedElements[0].outerHTML);//copying first selected element for POC

                clipboardEvent.preventDefault();
            }
        }
    },

    handleCut:{
        value:function(clipboardEvent){
            var clipboardData = clipboardEvent.clipboardData,
                htmlData = clipboardData.getData("text/html"),
                textData = clipboardData.getData("text/plain");

            console.log("$$$ handleCut ", textData);


            clipboardEvent.preventDefault();
        }
    },

    handlePaste:{
        value:function(clipboardEvent){
            var clipboardData = clipboardEvent.clipboardData,
                htmlData = clipboardData.getData("text/html"),
                textData = clipboardData.getData("text/plain"),
                data = null;

            data = htmlData || textData;

            if(data){
                //hack - to avoid parsing html code now

                this.application.ninja.documentController.activeDocument.documentRoot.innerHTML = data + this.application.ninja.documentController.activeDocument.documentRoot.innerHTML;

            }

            clipboardEvent.preventDefault();
        }
    }
});