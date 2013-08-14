/**
 * Copyright (c) 2009-2010
 * processWave.org (Michael Goderbauer, Markus Goetz, Marvin Killing, Martin
 * Kreichgauer, Martin Krueger, Christian Ress, Thomas Zimmermann)
 *
 * based on oryx-project.org (Martin Czuchra, Nicolas Peters, Daniel Polak,
 * Willi Tscheschner, Oliver Kopp, Philipp Giese, Sven Wagner-Boysen, Philipp Berger, Jan-Felix Schwarz)
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 **/

if(!ORYX.Plugins) 
    ORYX.Plugins = new Object();
    
ORYX.Core.Commands["DragDropResize.DockCommand"] = ORYX.Core.AbstractCommand.extend({
    construct: function construct(docker, relativePosition, newDockedShape, facade) {
        arguments.callee.$.construct.call(this, facade);
    
        this.docker         = docker;
        this.newPosition    = relativePosition;
        this.newDockedShape = newDockedShape;
        this.newParent         = newDockedShape.parent || facade.getCanvas();
        this.newParent 		= newDockedShape.parent || facade.getCanvas();
        this.oldDockedShape    = docker.getDockedShape();
        if (typeof this.oldDockedShape === "undefined") {
            this.oldPosition	= docker.parent.bounds.center()
        } else {
            // if oldDockedShape was not the canvas, i.e. results in undefined, calculate relative position
            this.oldPosition = this.facade.getCanvas().node.ownerSVGElement.createSVGPoint();
            this.oldPosition.x = Math.abs((this.oldDockedShape.absoluteBounds().lowerRight().x - docker.parent.absoluteBounds().center().x) / this.oldDockedShape.bounds.width());
            this.oldPosition.y = Math.abs((this.oldDockedShape.absoluteBounds().lowerRight().y - docker.parent.absoluteBounds().center().y) / this.oldDockedShape.bounds.height());
        }
        this.oldParent 		= docker.parent.parent || facade.getCanvas();
        this.facade         = facade;
    },
    
    execute: function execute() {
        this.dock(this.newDockedShape, this.newParent,  this.newPosition);
        
        // Raise Event for having the docked shape on top of the other shape
        this.facade.raiseEvent(
            {
                "type": ORYX.CONFIG.EVENT_ARRANGEMENTLIGHT_TOP, 
                "shape": this.docker.parent
            }
        )									
    },
    
    rollback: function rollback() {
        this.dock( this.oldDockedShape, this.oldParent, this.oldPosition );
    },
    
    getCommandName: function getCommandName() {
        return "DragDropResize.DockCommand";
    },
    
    getDisplayName: function getDisplayName() {
        return "Event docked";
    },
        
    dock: function(toDockShape, parent, relativePosition) {
        var relativePos = relativePosition;

        /* if shape should be attached to a shape, calculate absolute position, otherwise relativePosition is relative to canvas, i.e. absolute
         values are expected to be between 0 and 1, if faulty values are found, they are set manually - with x = 0 and y = 0, shape will be docked at lower right corner*/
        if (typeof toDockShape !== "undefined") {
            var absolutePosition = this.facade.getCanvas().node.ownerSVGElement.createSVGPoint();
            if ((0 > relativePos.x) || (relativePos.x > 1) || (0 > relativePos.y) || (relativePos.y > 1)) {
                relativePos.x = 0;
                relativePos.y = 0;
            } 
            absolutePosition.x = Math.abs(toDockShape.absoluteBounds().lowerRight().x - relativePos.x * toDockShape.bounds.width());
            absolutePosition.y = Math.abs(toDockShape.absoluteBounds().lowerRight().y - relativePos.y * toDockShape.bounds.height());
        } else {
            var absolutePosition = relativePosition;
        }        

        // Add to the same parent Shape
        parent.add(this.docker.parent)
                
        //it seems that for docker to be moved, the dockedShape need to be cleared first
        this.docker.setDockedShape(undefined);
        this.docker.bounds.centerMoveTo(absolutePosition);
        this.docker.setDockedShape(toDockShape);
        //this.docker.update();
        if (this.isLocal()) {
            this.facade.setSelection([this.docker.parent]);
        }
        this.facade.getCanvas().update();
        this.facade.updateSelection(this.isLocal());            
    },
    
    getCommandData: function getCommandData() {
        var getDockerId = function(docker) {
            var dockerId; 
            if (typeof docker !== "undefined") {
                dockerId = docker.id;
            }
            return dockerId;
        };
    
        var cmd = {
            "dockerParentId": this.docker.parent.resourceId,
            "newPosition": this.newPosition,
            "newDockedShapeId": this.newDockedShape.resourceId          
        };
        return cmd;
    },
    
    createFromCommandData: function jsonDeserialize(facade, commandData) {        
        var docker, parent, newShape, newPosition;
        var canvas = facade.getCanvas();
        
        newShape = canvas.getChildShapeByResourceId(commandData.newDockedShapeId);
        
        // Don't instantiate a new command when the shape to be resized doesn't exist anymore.
        if (typeof newShape === 'undefined') {
            return undefined;
        }        
        parent = canvas.getChildShapeByResourceId(commandData.dockerParentId);
        newPosition = canvas.node.ownerSVGElement.createSVGPoint();
        newPosition.x = commandData.newPosition.x;
        newPosition.y = commandData.newPosition.y;
        
        for (var i = 0; i < newShape.dockers.length; i++) {
            if (newShape.dockers[i].id == commandData.dockerId) {
                docker = newShape.dockers[i];
            }
        }
    
        var newCommand = new ORYX.Core.Commands["DragDropResize.DockCommand"](parent.dockers[0], newPosition, newShape, facade);
        return newCommand;
    },
    
    getAffectedShapes: function getAffectedShapes() {
        return [this.docker.parent];
    }
});

ORYX.Plugins.DragDropResize = ORYX.Plugins.AbstractPlugin.extend({

    /**
     *    Constructor
     *    @param {Object} Facade: The Facade of the Editor
     */
    construct: function(facade) {
        this.facade = facade;

        // Initialize variables
        this.currentShapes         = [];            // Current selected Shapes
        //this.pluginsData         = [];            // Available Plugins
        this.toMoveShapes         = [];            // Shapes there will be moved
        this.distPoints         = [];            // Distance Points for Snap on Grid
        this.isResizing         = false;        // Flag: If there was currently resized
        this.dragEnable         = false;        // Flag: If Dragging is enabled
        this.dragIntialized     = false;        // Flag: If the Dragging is initialized
        this.edgesMovable        = true;            // Flag: If an edge is docked it is not movable
        this.offSetPosition     = {x: 0, y: 0};    // Offset of the Dragging
        this.faktorXY             = {x: 1, y: 1};    // The Current Zoom-Faktor
        this.containmentParentNode;                // the current future parent node for the dragged shapes
        this.isAddingAllowed     = false;        // flag, if adding current selected shapes to containmentParentNode is allowed
        this.isAttachingAllowed = false;        // flag, if attaching to the current shape is allowed
        
        this.callbackMouseMove    = this.handleMouseMove.bind(this);
        this.callbackMouseUp    = this.handleMouseUp.bind(this);
        
        // Get the SVG-Containernode 
        var containerNode = this.facade.getCanvas().getSvgContainer();
        
        // Create the Selected Rectangle in the SVG
        this.selectedRect = new ORYX.Plugins.SelectedRect(containerNode);
        
        // Show grid line if enabled
        if (ORYX.CONFIG.SHOW_GRIDLINE) {
            this.vLine = new ORYX.Plugins.GridLine(containerNode, ORYX.Plugins.GridLine.DIR_VERTICAL);
            this.hLine = new ORYX.Plugins.GridLine(containerNode, ORYX.Plugins.GridLine.DIR_HORIZONTAL);
        }

        // Get a HTML-ContainerNode
        containerNode = this.facade.getCanvas().getHTMLContainer();
        
        this.scrollNode = this.facade.getCanvas().rootNode.parentNode.parentNode;
        
        // Create the southeastern button for resizing
        this.resizerSE = new ORYX.Plugins.Resizer(containerNode, "southeast", this.facade);
        this.resizerSE.registerOnResize(this.onResize.bind(this)); // register the resize callback
        this.resizerSE.registerOnResizeEnd(this.onResizeEnd.bind(this, "southeast")); // register the resize end callback
        this.resizerSE.registerOnResizeStart(this.onResizeStart.bind(this)); // register the resize start callback
        
        // Create the northwestern button for resizing
        this.resizerNW = new ORYX.Plugins.Resizer(containerNode, "northwest", this.facade);
        this.resizerNW.registerOnResize(this.onResize.bind(this)); // register the resize callback
        this.resizerNW.registerOnResizeEnd(this.onResizeEnd.bind(this, "northwest")); // register the resize end callback
        this.resizerNW.registerOnResizeStart(this.onResizeStart.bind(this)); // register the resize start callback
        
        // For the Drag and Drop
        // Register on MouseDown-Event on a Shape
        this.facade.registerOnEvent(ORYX.CONFIG.EVENT_MOUSEDOWN, this.handleMouseDown.bind(this));

        // register for layouting event
        // this.facade.registerOnEvent(ORYX.CONFIG.EVENT_LAYOUT_EDGES, this.handleLayoutEdges.bind(this));

        // listen for canvas resizes causing moving of shapes
        this.facade.registerOnEvent(ORYX.CONFIG.EVENT_CANVAS_RESIZE_SHAPES_MOVED, this.onCanvasResizeShapesMoved.bind(this));
    },

    handleLayoutEdges: function(event) {
        this.layoutEdges(event.node, event.edges, event.offset);
    },

    /**
     * On Mouse Down
     *
     */
    handleMouseDown: function(event, uiObj) {
        // If the selection Bounds not intialized and the uiObj is not member of current selectio
        // then return
        if(!this.dragBounds || !this.currentShapes.member(uiObj) || !this.toMoveShapes.length) {return};
        
        // Start Dragging
        this.dragEnable = true;
        this.dragIntialized = true;
        this.edgesMovable = true;

        // Calculate the current zoom factor
        var a = this.facade.getCanvas().node.getScreenCTM();
        this.faktorXY.x = a.a;
        this.faktorXY.y = a.d;

        // Set the offset position of dragging
        var upL = this.dragBounds.upperLeft();
        this.offSetPosition =  {
            x: Event.pointerX(event) - (upL.x * this.faktorXY.x),
            y: Event.pointerY(event) - (upL.y * this.faktorXY.y)};
        
        this.offsetScroll    = {x:this.scrollNode.scrollLeft,y:this.scrollNode.scrollTop};
            
        // Register on Global Mouse-MOVE Event
        document.documentElement.addEventListener(ORYX.CONFIG.EVENT_MOUSEMOVE, this.callbackMouseMove, false);    
        // Register on Global Mouse-UP Event
        document.documentElement.addEventListener(ORYX.CONFIG.EVENT_MOUSEUP, this.callbackMouseUp, true);            
    },

    /**
     * On Key Mouse Up
     *
     */
    handleMouseUp: function(event) {
        
        //disable containment highlighting
        this.facade.raiseEvent({ type:ORYX.CONFIG.EVENT_HIGHLIGHT_HIDE,
                                 highlightId:"dragdropresize.contain" });
                                
        this.facade.raiseEvent({ type:ORYX.CONFIG.EVENT_HIGHLIGHT_HIDE,
                                 highlightId:"dragdropresize.attached" });

        // If Dragging is finished
        if (this.dragEnable) {
            var position = this.calculateDragPosition(event);        
            this.dragBounds.moveTo(position);

            // and update the current selection
            if (!this.dragIntialized) {
                this.afterDrag();
                
                // Check if the Shape is allowed to dock to the other Shape                        
                if (this.isAttachingAllowed &&
                    this.toMoveShapes.length == 1 && this.toMoveShapes[0] instanceof ORYX.Core.Node  &&
                    this.toMoveShapes[0].dockers.length > 0) {
                    
                    // Get the position and the docker                    
                    var position     = this.facade.eventCoordinates( event );    
            
                    // calculate the relative position of the docker within the newDockedShape
                    var newDockedShape = this.containmentParentNode;
		            var relativePosition = this.facade.getCanvas().node.ownerSVGElement.createSVGPoint();
		            relativePosition.x = (newDockedShape.absoluteBounds().lowerRight().x - position.x) / newDockedShape.bounds.width();
		            relativePosition.y = (newDockedShape.absoluteBounds().lowerRight().y - position.y) / newDockedShape.bounds.height();
	
					var docker 		= this.toMoveShapes[0].dockers[0];
                    // Instantiate the dockCommand
                    var command = new ORYX.Core.Commands["DragDropResize.DockCommand"](docker, relativePosition, this.containmentParentNode, this.facade);
                    this.facade.executeCommands([command]);    
                    
                // Check if adding is allowed to the other Shape    
                } else if( this.isAddingAllowed ) {
                    // Refresh all Shapes --> Set the new Bounds
                    this.refreshSelectedShapes();
                }
                
				this.facade.updateSelection(true);
                            
                this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_DRAGDROP_END});
            }    

            if (this.vLine)
                this.vLine.hide();
            if (this.hLine)
                this.hLine.hide();
                
            this.facade.updateSelection(true);
        }

        // Disable 
        this.dragEnable = false;    

        // UnRegister on Global Mouse-UP/-Move Event
        document.documentElement.removeEventListener(ORYX.CONFIG.EVENT_MOUSEUP, this.callbackMouseUp, true);    
        document.documentElement.removeEventListener(ORYX.CONFIG.EVENT_MOUSEMOVE, this.callbackMouseMove, false);                
    },

    /**
    * On Key Mouse Move
    *
    */
    handleMouseMove: function(event) {
        if (!this.dragEnable) { 
            return;
        };

        if (this.dragIntialized) {
            // Raise Event: Drag will be started
            this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_DRAGDROP_START});
            this.dragIntialized = false;
            
            // And hide the resizers and the highlighting
            this.resizerSE.hide();
            this.resizerNW.hide();
            
            // if only edges are selected, containmentParentNode must be the canvas
            this._onlyEdges = this.currentShapes.all(function(currentShape) {
                return (currentShape instanceof ORYX.Core.Edge);
            });
            
            // Do method before Drag
            this.beforeDrag();
            
            this._currentUnderlyingNodes = [];
        }
    
        var position = this.calculateDragPosition(event);        
        this.dragBounds.moveTo(position);

        // Update the selection rectangle
        this.resizeRectangle(this.dragBounds);

        this.isAttachingAllowed = false;

        //check, if a node can be added to the underlying node
        var underlyingNodes = $A(this.facade.getCanvas().getAbstractShapesAtPosition(this.facade.eventCoordinates(event)));
        
        var checkIfAttachable = this.toMoveShapes.length == 1 && this.toMoveShapes[0] instanceof ORYX.Core.Node && this.toMoveShapes[0].dockers.length > 0
        checkIfAttachable    = checkIfAttachable && underlyingNodes.length != 1

        if (!checkIfAttachable &&
            underlyingNodes.length === this._currentUnderlyingNodes.length  &&
            underlyingNodes.all(function(node, index){return this._currentUnderlyingNodes[index] === node}.bind(this))) {
            return;
        } else if(this._onlyEdges) {
            this.isAddingAllowed = true;
            this.containmentParentNode = this.facade.getCanvas();
        } else {
            /* Check the containment and connection rules */
            var options = { event : event,
                            underlyingNodes : underlyingNodes,
                            checkIfAttachable : checkIfAttachable };
            this.checkRules(options);
        }
        
        this._currentUnderlyingNodes = underlyingNodes.reverse();
        
        //visualize the containment result
        if (this.isAttachingAllowed) {
            this.facade.raiseEvent({ type: ORYX.CONFIG.EVENT_HIGHLIGHT_SHOW,
                                     highlightId: "dragdropresize.attached",
                                     elements: [this.containmentParentNode],
                                     style: ORYX.CONFIG.SELECTION_HIGHLIGHT_STYLE_RECTANGLE,
                                     color:    ORYX.CONFIG.SELECTION_VALID_COLOR });
        } else {
            this.facade.raiseEvent({ type: ORYX.CONFIG.EVENT_HIGHLIGHT_HIDE,
                                     highlightId: "dragdropresize.attached" });
        }
        
        if( !this.isAttachingAllowed ){
            if( this.isAddingAllowed ) {
                this.facade.raiseEvent({ type: ORYX.CONFIG.EVENT_HIGHLIGHT_SHOW,
                                         highlightId: "dragdropresize.contain",
                                         elements: [this.containmentParentNode],
                                         color: ORYX.CONFIG.SELECTION_VALID_COLOR });
            } else {
                this.facade.raiseEvent({ type: ORYX.CONFIG.EVENT_HIGHLIGHT_SHOW,
                                         highlightId: "dragdropresize.contain",
                                         elements: [this.containmentParentNode],
                                         color: ORYX.CONFIG.SELECTION_INVALID_COLOR });
            }
        } else {
            this.facade.raiseEvent({ type: ORYX.CONFIG.EVENT_HIGHLIGHT_HIDE,
                                     highlightId: "dragdropresize.contain" });            
        }
    },
    
    calculateDragPosition : function(event) {
        var position = { x: Event.pointerX(event) - this.offSetPosition.x,
                         y: Event.pointerY(event) - this.offSetPosition.y };

        position.x -= this.offsetScroll.x - this.scrollNode.scrollLeft; 
        position.y -= this.offsetScroll.y - this.scrollNode.scrollTop;
        
        // If not the Control-Key are pressed
        var modifierKeyPressed = event.shiftKey || event.ctrlKey;
        if(ORYX.CONFIG.GRID_ENABLED && !modifierKeyPressed) {
            // Snap the current position to the nearest Snap-Point
            position = this.snapToGrid(position);
        } else {
            if (this.vLine) {
                this.vLine.hide();
            }
            if (this.hLine) {
                this.hLine.hide();
            }
        }

        // Adjust the point by the zoom faktor 
        position.x /= this.faktorXY.x;
        position.y /= this.faktorXY.y;

        // Set that the position is not lower than zero
        position.x = Math.max(0, position.x)
        position.y = Math.max(0, position.y)

        // Set that the position is not bigger than the canvas
        var c = this.facade.getCanvas();
        position.x = Math.min(c.bounds.width() - this.dragBounds.width(), position.x);
        position.y = Math.min(c.bounds.height() - this.dragBounds.height(), position.y);
        
        return position;
    },
    
//    /**
//     * Rollbacks the docked shape of an edge, if the edge is not movable.
//     */
//    redockEdges: function() {
//        this._undockedEdgesCommand.dockers.each(function(el){
//            el.docker.setDockedShape(el.dockedShape);
//            el.docker.setReferencePoint(el.refPoint);
//        })
//    },
    
    /**
     *  Checks the containment and connection rules for the selected shapes.
     */
    checkRules : function(options) {
        var event = options.event;
        var underlyingNodes = options.underlyingNodes;
        var checkIfAttachable = options.checkIfAttachable;
        var noEdges = options.noEdges;
        
        //get underlying node that is not the same than one of the currently selected shapes or
        // a child of one of the selected shapes with the highest z Order.
        // The result is a shape or the canvas
        this.containmentParentNode = underlyingNodes.reverse().find((function(node) {
            return (node instanceof ORYX.Core.Canvas) || 
                    (((node instanceof ORYX.Core.Node) || ((node instanceof ORYX.Core.Edge) && !noEdges)) 
                    && (!(this.currentShapes.member(node) || 
                            this.currentShapes.any(function(shape) {
                                return (shape.children.length > 0 && shape.getChildNodes(true).member(node));
                            }))));
        }).bind(this));
                                
        if (checkIfAttachable && typeof this.containmentParentNode !== "undefined") {
                
            this.isAttachingAllowed = this.facade.getRules().canConnect({
                                                sourceShape:    this.containmentParentNode, 
                                                edgeShape:        this.toMoveShapes[0], 
                                                targetShape:    this.toMoveShapes[0]
                                                });                        
            
            if (this.isAttachingAllowed) {
                var point = this.facade.eventCoordinates(event);
                this.isAttachingAllowed = this.containmentParentNode.isPointOverOffset(point.x, point.y);
            }                        
        }
        
        if( !this.isAttachingAllowed ){
            //check all selected shapes, if they can be added to containmentParentNode
            this.isAddingAllowed = this.toMoveShapes.all((function(currentShape) {
                if(currentShape instanceof ORYX.Core.Edge ||
                    currentShape instanceof ORYX.Core.Controls.Docker ||
                    this.containmentParentNode === currentShape.parent) {
                    return true;
                } else if(this.containmentParentNode !== currentShape) {
                    
                    if(!(this.containmentParentNode instanceof ORYX.Core.Edge) || !noEdges) {
                    
                        if(this.facade.getRules().canContain({containingShape:this.containmentParentNode,
                                                              containedShape:currentShape})) {          
                            return true;
                        }
                    }
                }
                return false;
            }).bind(this));                
        }
        
        if(!this.isAttachingAllowed && !this.isAddingAllowed && 
                (this.containmentParentNode instanceof ORYX.Core.Edge)) {
            options.noEdges = true;
            options.underlyingNodes.reverse();
            this.checkRules(options);            
        }
    },

    onCanvasResizeShapesMoved: function(event) {
        var oldShapePositionsWithOffset = {};
        var oldPos;
        var shapeId;

        // add offsets to drag origin
        if (typeof this.oldDragBounds !== "undefined") {
            this.oldDragBounds.moveBy(event.offsetX, event.offsetY);
        }

        // add offsets to original shape positions
        if (typeof this.oldShapePositions !== "undefined") {
            for (shapeId in this.oldShapePositions) {
                if (this.oldShapePositions.hasOwnProperty(shapeId)) {
                    oldPos = this.oldShapePositions[shapeId];
                    oldShapePositionsWithOffset[shapeId] = { x: oldPos.x + event.offsetX,
                                                             y: oldPos.y + event.offsetY };
                }
            }
            this.oldShapePositions = oldShapePositionsWithOffset;
        }
       
        // update selection rectangle visuals
        if (this.dragEnable && (typeof this.dragBounds !== "undefined")) { 
            // update bounds
            this.dragBounds.moveBy(event.offsetX, event.offsetY);
            this.resizeRectangle(this.dragBounds);
    
            // update highlighting
            this.facade.raiseEvent({ type: ORYX.CONFIG.EVENT_CANVAS_RESIZE_UPDATE_HIGHLIGHTS,
                                     elements: this.toMoveShapes });
        }
    },
    
    /**
     * Redraw the selected Shapes.
     *
     */
    refreshSelectedShapes: function() {
        // If the selection bounds not initialized, return
        if(!this.dragBounds) {return}

        // Calculate the offset between the selection's new drag bounds and old drag bounds:
        var newDragBoundsCenter = this.dragBounds.center();
        var oldDragBoundsCenter = this.oldDragBounds.center();
        var offset = {
            x: newDragBoundsCenter.x - oldDragBoundsCenter.x,
            y: newDragBoundsCenter.y - oldDragBoundsCenter.y 
        };
        var getTargetPosition = function getTargetPosition(shape, offset) {
            // Add the calculated drag bounds offset to the shape bounds to get the target position for the shape:
            var oldShapeCenter = this.oldShapePositions[shape.id];
            return { x: oldShapeCenter.x + offset.x, y: oldShapeCenter.y + offset.y };
        }.bind(this);

        var aliveMoveShapes = this.removeDeadShapes(this.toMoveShapes);
        if (aliveMoveShapes.length > 0) {
            // Instantiate the Move Command
            var moveShapes = aliveMoveShapes.map(function addTargetPositionToShapes(shape) {
                return { shape: shape, 
                         origin: this.oldShapePositions[shape.id], 
                         target: getTargetPosition(shape, offset) };
            }.bind(this));

            var commands = [new ORYX.Core.Commands["DragDropResize.MoveCommand"](moveShapes, this.containmentParentNode, this.currentShapes, this.facade)];
            // If the undocked edges command is setted, add this command
            if( this._undockedEdgesCommand instanceof ORYX.Core.Command ){
                commands.unshift( this._undockedEdgesCommand );
            }
            // Execute the commands            
            this.facade.executeCommands( commands );    

            // copy the bounds to the old bounds
            if( this.dragBounds )
                this.oldDragBounds = this.dragBounds.clone();
        }
    },
    

    removeDeadShapes: function removeDeadShapes(moveShapes) {
        var canvas = this.facade.getCanvas();
        var getShape = function getShape(resourceId) {
            var shape = canvas.getChildShapeByResourceId(resourceId);
            return shape;
        };
        var getDocker = function getDocker(shape, dockerId) {
            var docker = undefined;
            for (var i = 0; i < shape.dockers.length; i++) {
                if (shape.dockers[i].id == dockerId) {
                    docker = shape.dockers[i];                
                }
            }
            return docker;
        };
        var aliveMoveShapes = [];
        for (var i = 0; i < moveShapes.length; i++) {
            var currentShape = moveShapes[i];
            if (currentShape instanceof ORYX.Core.Node || currentShape instanceof ORYX.Core.Edge) {
                var currentShapeOnCanvas = getShape(currentShape.resourceId);
                if (typeof currentShapeOnCanvas !== "undefined") {
                    aliveMoveShapes.push(moveShapes[i]);
                }
            } else if (currentShape instanceof ORYX.Core.Controls.Docker) {
                var parentShapeOnCanvas = getShape(currentShape.parent.resourceId);
                if (typeof parentShapeOnCanvas === "undefined") {
                    continue;
                } else {
                    var dockerOnCanvas = getDocker(parentShapeOnCanvas, currentShape.id);
                    if (typeof dockerOnCanvas !== "undefined") {
                        aliveMoveShapes.push(moveShapes[i]);
                    }
                }
            }
        }
        return aliveMoveShapes; 
    },

    /**
     * Callback for Resize
     *
     */
    onResize: function(bounds) {
        // If the selection bounds not initialized, return
        if(!this.dragBounds) {return}
        
        this.dragBounds = bounds;
        this.isResizing = true;

        // Update the rectangle 
        this.resizeRectangle(this.dragBounds);
    },
    
    onResizeStart: function() {
        this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_RESIZE_START});
    },

    onResizeEnd: function(orientation) {
        if (!(this.currentShapes instanceof Array)||this.currentShapes.length<=0) {
            return;
        }
        // If Resizing finished, the Shapes will be resize
        if (this.isResizing) {

                if (((orientation === "southeast") && (this.dragBounds.b.x === this.oldDragBounds.b.x) && (this.dragBounds.b.y === this.oldDragBounds.b.y)) || ((orientation === "northwest") && (this.dragBounds.a.x == this.oldDragBounds.a.x) && (this.dragBounds.a.y == this.oldDragBounds.a.y))) {
                var bounds = this.dragBounds.clone();
                var shape = this.currentShapes[0];
                if (shape.parent) {
                    var parentPosition = shape.parent.absoluteXY();
                    bounds.moveBy(-parentPosition.x, -parentPosition.y);
                }
                var aliveShapeArray = this.removeDeadShapes([shape]);
                if (aliveShapeArray.length > 0) {
                    var oldBounds = shape.bounds.clone();
                    var command = new ORYX.Core.Commands["DragDropResize.ResizeCommand"](shape, bounds, oldBounds, this.facade, orientation);
                    this.facade.executeCommands([command]);            
                    this.isResizing = false;            
                    this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_RESIZE_END});
                }
            }
        }
    },
    

    /**
     * Prepare the Dragging
     *
     */
    beforeDrag: function(){
        
        this._undockedEdgesCommand = new ORYX.Core.Commands["DragDropResize.UndockEdgeCommand"](this.toMoveShapes, this.facade);
        this._undockedEdgesCommand.execute();    
        
    },

    hideAllLabels: function(shape) {
            
            // Hide all labels from the shape
            shape.getLabels().each(function(label) {
                label.hide();
            });
            // Hide all labels from docked shapes
            shape.getAllDockedShapes().each(function(dockedShape) {
                var labels = dockedShape.getLabels();
                if(labels.length > 0) {
                    labels.each(function(label) {
                        label.hide();
                    });
                }
            });

            // Do this recursive for all child shapes
            // EXP-NICO use getShapes
            shape.getChildren().each((function(value) {
                if(value instanceof ORYX.Core.Shape)
                    this.hideAllLabels(value);
            }).bind(this));
    },

    /**
     * Finished the Dragging
     *
     */
    afterDrag: function(){
                
    },

    /**
     * Show all Labels at these shape
     * 
     */
    showAllLabels: function(shape) {

            // Show the label of these shape
            //shape.getLabels().each(function(label) {
            for(var i=0; i<shape.length ;i++){
                var label = shape[i];
                label.show();
            }//);
            // Show all labels at docked shapes
            //shape.getAllDockedShapes().each(function(dockedShape) {
            var allDockedShapes = shape.getAllDockedShapes()
            for(var i=0; i<allDockedShapes.length ;i++){
                var dockedShape = allDockedShapes[i];                
                var labels = dockedShape.getLabels();
                if(labels.length > 0) {
                    labels.each(function(label) {
                        label.show();
                    });
                }
            }//);

            // Do this recursive
            //shape.children.each((function(value) {
            for(var i=0; i<shape.children.length ;i++){
                var value = shape.children[i];    
                if(value instanceof ORYX.Core.Shape)
                    this.showAllLabels(value);
            }//).bind(this));
    },

    /**
     * Intialize Method, if there are new Plugins
     *
     */
    /*registryChanged: function(pluginsData) {
        // Save all new Plugin, sorted by group and index
        this.pluginsData = pluginsData.sortBy( function(value) {
            return (value.group + "" + value.index);
        });
    },*/

    /**
     * On the Selection-Changed
     *
     */
    onSelectionChanged: function(event) {
        var elements = event.elements;
        
        // Reset the drag-variables
        this.dragEnable = false;
        this.dragIntialized = false;
        this.resizerSE.hide();
        this.resizerNW.hide();

        // If there is no elements
        if(!elements || elements.length == 0) {
            // Hide all things and reset all variables
            this.selectedRect.hide();
            this.currentShapes = [];
            this.toMoveShapes = [];
            this.dragBounds = undefined;
            this.oldDragBounds = undefined;
            this.oldShapePositions = {};
        } else {

            // Set the current Shapes
            this.currentShapes = elements;

            // Get all shapes with the highest parent in object hierarchy (canvas is the top most parent)
            var topLevelElements = this.facade.getCanvas().getShapesWithSharedParent(elements);
            this.toMoveShapes = topLevelElements;
            
            this.toMoveShapes = this.toMoveShapes.findAll( function(shape) { return shape instanceof ORYX.Core.Node && 
                                                                            (shape.dockers.length === 0 || !elements.member(shape.dockers.first().getDockedShape()))});        
                
            elements.each((function(shape){
                if(!(shape instanceof ORYX.Core.Edge)) {return}
                
                var dks = shape.getDockers() 
                                
                var hasF = elements.member(dks.first().getDockedShape());
                var hasL = elements.member(dks.last().getDockedShape());    
                        
//                if(!hasL) {
//                    this.toMoveShapes.push(dks.last());
//                }
//                if(!hasF){
//                    this.toMoveShapes.push(dks.first())
//                } 
                /* Enable movement of undocked edges */
                if(!hasF && !hasL) {
                    var isUndocked = !dks.first().getDockedShape() && !dks.last().getDockedShape()
                    if(isUndocked) {
                        this.toMoveShapes = this.toMoveShapes.concat(dks);
                    }
                }
                
                if( shape.dockers.length > 2 && hasF && hasL){
                    this.toMoveShapes = this.toMoveShapes.concat(dks.findAll(function(el,index){ return index > 0 && index < dks.length-1}))
                }
                
            }).bind(this));

            // store old shape positions to cope with the problem that remote collaborators
            // could remove these shapes while they are being dragged around
            this.oldShapePositions = {};
            this.toMoveShapes.each(function storeShapePosition(shape) {
                this.oldShapePositions[shape.id] = shape.absoluteBounds().center(); 
            }.bind(this));
            
            // Calculate the new area-bounds of the selection
            var newBounds = undefined;
            this.toMoveShapes.each(function(value) {
                var shape = value;
                if(value instanceof ORYX.Core.Controls.Docker) {
                    /* Get the Shape */
                    shape = value.parent;
                }
                
                if(!newBounds){
                    newBounds = shape.absoluteBounds();
                }
                else {
                    newBounds.include(shape.absoluteBounds());
                }
            }.bind(this));
            
            if(!newBounds){
                elements.each(function(value){
                    if(!newBounds) {
                        newBounds = value.absoluteBounds();
                    } else {
                        newBounds.include(value.absoluteBounds());
                    }
                });
            }
            
            // Set the new bounds
            this.dragBounds = newBounds;
            this.oldDragBounds = newBounds.clone();

            // Update and show the rectangle
            this.resizeRectangle(newBounds);
            this.selectedRect.show();
            
            // Show the resize button, if there is only one element and this is resizeable
            if(elements.length == 1 && elements[0].isResizable) {
                var aspectRatio = elements[0].getStencil().fixedAspectRatio() ? elements[0].bounds.width() / elements[0].bounds.height() : undefined;
                this.resizerSE.setBounds(this.dragBounds, elements[0].minimumSize, elements[0].maximumSize, aspectRatio);
                this.resizerSE.show();
                this.resizerNW.setBounds(this.dragBounds, elements[0].minimumSize, elements[0].maximumSize, aspectRatio);
                this.resizerNW.show();
            } else {
                this.resizerSE.setBounds(undefined);
                this.resizerNW.setBounds(undefined);
            }

            // If Snap-To-Grid is enabled, the Snap-Point will be calculate
            if(ORYX.CONFIG.GRID_ENABLED) {

                // Reset all points
                this.distPoints = [];

                if (this.distPointTimeout)
                    window.clearTimeout(this.distPointTimeout)
                
                this.distPointTimeout = window.setTimeout(function(){
                    // Get all the shapes, there will consider at snapping
                    // Consider only those elements who shares the same parent element
                    var distShapes = this.facade.getCanvas().getChildShapes(true).findAll(function(value){
                        var parentShape = value.parent;
                        while(parentShape){
                            if(elements.member(parentShape)) return false;
                            parentShape = parentShape.parent
                        }
                        return true;
                    })
                    
                    // The current selection will delete from this array
                    //elements.each(function(shape) {
                    //    distShapes = distShapes.without(shape);
                    //});

                    // For all these shapes
                    distShapes.each((function(value) {
                        if(!(value instanceof ORYX.Core.Edge)) {
                            var ul = value.absoluteXY();
                            var width = value.bounds.width();
                            var height = value.bounds.height();

                            // Add the upperLeft, center and lowerRight - Point to the distancePoints
                            this.distPoints.push({
                                ul: {
                                    x: ul.x,
                                    y: ul.y
                                },
                                c: {
                                    x: ul.x + (width / 2),
                                    y: ul.y + (height / 2)
                                },
                                lr: {
                                    x: ul.x + width,
                                    y: ul.y + height
                                }
                            });
                        }
                    }).bind(this));
                    
                }.bind(this), 10)


            }
        }
    },

    /**
     * Adjust an Point to the Snap Points
     *
     */
    snapToGrid: function(position) {

        // Get the current Bounds
        var bounds = this.dragBounds;
        
        var point = {};

        var ulThres = 6;
        var cThres = 10;
        var lrThres = 6;

        var scale = this.vLine ? this.vLine.getScale() : 1;
        
        var ul = { x: (position.x/scale), y: (position.y/scale)};
        var c = { x: (position.x/scale) + (bounds.width()/2), y: (position.y/scale) + (bounds.height()/2)};
        var lr = { x: (position.x/scale) + (bounds.width()), y: (position.y/scale) + (bounds.height())};

        var offsetX, offsetY;
        var gridX, gridY;
        
        // For each distant point
        this.distPoints.each(function(value) {

            var x, y, gx, gy;
            if (Math.abs(value.c.x-c.x) < cThres){
                x = value.c.x-c.x;
                gx = value.c.x;
            }/* else if (Math.abs(value.ul.x-ul.x) < ulThres){
                x = value.ul.x-ul.x;
                gx = value.ul.x;
            } else if (Math.abs(value.lr.x-lr.x) < lrThres){
                x = value.lr.x-lr.x;
                gx = value.lr.x;
            } */
            

            if (Math.abs(value.c.y-c.y) < cThres){
                y = value.c.y-c.y;
                gy = value.c.y;
            }/* else if (Math.abs(value.ul.y-ul.y) < ulThres){
                y = value.ul.y-ul.y;
                gy = value.ul.y;
            } else if (Math.abs(value.lr.y-lr.y) < lrThres){
                y = value.lr.y-lr.y;
                gy = value.lr.y;
            } */

            if (x !== undefined) {
                offsetX = offsetX === undefined ? x : (Math.abs(x) < Math.abs(offsetX) ? x : offsetX);
                if (offsetX === x)
                    gridX = gx;
            }

            if (y !== undefined) {
                offsetY = offsetY === undefined ? y : (Math.abs(y) < Math.abs(offsetY) ? y : offsetY);
                if (offsetY === y)
                    gridY = gy;
            }
        });
        
        
        if (offsetX !== undefined) {
            ul.x += offsetX;    
            ul.x *= scale;
            if (this.vLine&&gridX)
                this.vLine.update(gridX);
        } else {
            ul.x = (position.x - (position.x % (ORYX.CONFIG.GRID_DISTANCE/2)));
            if (this.vLine)
                this.vLine.hide()
        }
        
        if (offsetY !== undefined) {    
            ul.y += offsetY;
            ul.y *= scale;
            if (this.hLine&&gridY)
                this.hLine.update(gridY);
        } else {
            ul.y = (position.y - (position.y % (ORYX.CONFIG.GRID_DISTANCE/2)));
            if (this.hLine)
                this.hLine.hide();
        }
        
        return ul;
    },
    
    showGridLine: function(){
        
    },


    /**
     * Redraw of the Rectangle of the SelectedArea
     * @param {Object} bounds
     */
    resizeRectangle: function(bounds) {
        // Resize the Rectangle
        this.selectedRect.resize(bounds);
    }

});


ORYX.Plugins.SelectedRect = Clazz.extend({

    construct: function(parentId) {

        this.parentId = parentId;

        this.node = ORYX.Editor.graft("http://www.w3.org/2000/svg", $(parentId),
                    ['g']);

        this.dashedArea = ORYX.Editor.graft("http://www.w3.org/2000/svg", this.node,
            ['rect', {x: 0, y: 0,
                'stroke-width': 1, stroke: '#777777', fill: 'none',
                'stroke-dasharray': '2,2',
                'pointer-events': 'none'}]);

        this.hide();

    },

    hide: function() {
        this.node.setAttributeNS(null, 'display', 'none');
    },

    show: function() {
        this.node.setAttributeNS(null, 'display', '');
    },

    resize: function(bounds) {
        var upL = bounds.upperLeft();

        var padding = ORYX.CONFIG.SELECTED_AREA_PADDING;

        this.dashedArea.setAttributeNS(null, 'width', bounds.width() + 2*padding);
        this.dashedArea.setAttributeNS(null, 'height', bounds.height() + 2*padding);
        this.node.setAttributeNS(null, 'transform', "translate("+ (upL.x - padding) +", "+ (upL.y - padding) +")");
    }


});



ORYX.Plugins.GridLine = Clazz.extend({
    
    construct: function(parentId, direction) {

        if (ORYX.Plugins.GridLine.DIR_HORIZONTAL !== direction && ORYX.Plugins.GridLine.DIR_VERTICAL !== direction) {
            direction = ORYX.Plugins.GridLine.DIR_HORIZONTAL
        }
        
    
        this.parent = $(parentId);
        this.direction = direction;
        this.node = ORYX.Editor.graft("http://www.w3.org/2000/svg", this.parent,
                    ['g']);

        this.line = ORYX.Editor.graft("http://www.w3.org/2000/svg", this.node,
            ['path', {
                'stroke-width': 1, stroke: 'silver', fill: 'none',
                'stroke-dasharray': '5,5',
                'pointer-events': 'none'}]);

        this.hide();

    },

    hide: function() {
        this.node.setAttributeNS(null, 'display', 'none');
    },

    show: function() {
        this.node.setAttributeNS(null, 'display', '');
    },

    getScale: function(){
        try {
            return this.parent.parentNode.transform.baseVal.getItem(0).matrix.a;
        } catch(e) {
            return 1;
        }
    },
    
    update: function(pos) {
        
        if (this.direction === ORYX.Plugins.GridLine.DIR_HORIZONTAL) {
            var y = pos instanceof Object ? pos.y : pos; 
            var cWidth = this.parent.parentNode.parentNode.width.baseVal.value/this.getScale();
            this.line.setAttributeNS(null, 'd', 'M 0 '+y+ ' L '+cWidth+' '+y);
        } else {
            var x = pos instanceof Object ? pos.x : pos; 
            var cHeight = this.parent.parentNode.parentNode.height.baseVal.value/this.getScale();
            this.line.setAttributeNS(null, 'd', 'M'+x+ ' 0 L '+x+' '+cHeight);
        }
        
        this.show();
    }


});

ORYX.Plugins.GridLine.DIR_HORIZONTAL = "hor";
ORYX.Plugins.GridLine.DIR_VERTICAL = "ver";

ORYX.Plugins.Resizer = Clazz.extend({

    construct: function(parentId, orientation, facade) {

        this.parentId         = parentId;
        this.orientation    = orientation;
        this.facade            = facade;
        this.node = ORYX.Editor.graft("http://www.w3.org/1999/xhtml", $(this.parentId),
            ['div', {'class': 'resizer_'+ this.orientation, style:'left:0px; top:0px;'}]);

        this.node.addEventListener(ORYX.CONFIG.EVENT_MOUSEDOWN, this.handleMouseDown.bind(this), true);
        document.documentElement.addEventListener(ORYX.CONFIG.EVENT_MOUSEUP,     this.handleMouseUp.bind(this),         true);
        document.documentElement.addEventListener(ORYX.CONFIG.EVENT_MOUSEMOVE,     this.handleMouseMove.bind(this),     false);

        this.dragEnable = false;
        this.offSetPosition = {x: 0, y: 0};
        this.bounds = undefined;

        this.canvasNode = this.facade.getCanvas().node;

        this.minSize = undefined;
        this.maxSize = undefined;
        
        this.aspectRatio = undefined;

        this.resizeCallbacks         = [];
        this.resizeStartCallbacks     = [];
        this.resizeEndCallbacks     = [];
        this.hide();
        
        // Calculate the Offset
        this.scrollNode = this.node.parentNode.parentNode.parentNode;


    },

    handleMouseDown: function(event) {
        this.dragEnable = true;

        this.offsetScroll    = {x:this.scrollNode.scrollLeft,y:this.scrollNode.scrollTop};
            
        this.offSetPosition =  {
            x: Event.pointerX(event) - this.position.x,
            y: Event.pointerY(event) - this.position.y};
        
        this.resizeStartCallbacks.each((function(value) {
            value(this.bounds);
        }).bind(this));

    },

    handleMouseUp: function(event) {
        this.dragEnable = false;
        this.containmentParentNode = null;
        this.resizeEndCallbacks.each((function(value) {
            value(this.bounds);
        }).bind(this));
                
    },

    handleMouseMove: function(event) {
        if(!this.dragEnable) { return }
        
        if(event.shiftKey || event.ctrlKey) {
            this.aspectRatio = this.bounds.width() / this.bounds.height();
        } else {
            this.aspectRatio = undefined;
        }

        var position = {
            x: Event.pointerX(event) - this.offSetPosition.x,
            y: Event.pointerY(event) - this.offSetPosition.y}


        position.x     -= this.offsetScroll.x - this.scrollNode.scrollLeft; 
        position.y     -= this.offsetScroll.y - this.scrollNode.scrollTop;
        
        position.x  = Math.min( position.x, this.facade.getCanvas().bounds.width())
        position.y  = Math.min( position.y, this.facade.getCanvas().bounds.height())
        
        var offset = {
            x: position.x - this.position.x,
            y: position.y - this.position.y
        }
        
        if(this.aspectRatio) {
            // fixed aspect ratio
            newAspectRatio = (this.bounds.width()+offset.x) / (this.bounds.height()+offset.y);
            if(newAspectRatio>this.aspectRatio) {
                offset.x = this.aspectRatio * (this.bounds.height()+offset.y) - this.bounds.width();
            } else if(newAspectRatio<this.aspectRatio) {
                offset.y = (this.bounds.width()+offset.x) / this.aspectRatio - this.bounds.height();
            }
        }
        
        // respect minimum and maximum sizes of stencil
        if(this.orientation==="northwest") {
            if(this.bounds.width()-offset.x > this.maxSize.width) {
                offset.x = -(this.maxSize.width - this.bounds.width());
                if(this.aspectRatio)
                    offset.y = this.aspectRatio * offset.x;
            }
            if(this.bounds.width()-offset.x < this.minSize.width) {
                offset.x = -(this.minSize.width - this.bounds.width());
                if(this.aspectRatio)
                    offset.y = this.aspectRatio * offset.x;
            }
            if(this.bounds.height()-offset.y > this.maxSize.height) {
                offset.y = -(this.maxSize.height - this.bounds.height());
                if(this.aspectRatio)
                    offset.x = offset.y / this.aspectRatio;
            }
            if(this.bounds.height()-offset.y < this.minSize.height) {
                offset.y = -(this.minSize.height - this.bounds.height());
                if(this.aspectRatio)
                    offset.x = offset.y / this.aspectRatio;
            }
        } else { // defaults to southeast
            if(this.bounds.width()+offset.x > this.maxSize.width) {
                offset.x = this.maxSize.width - this.bounds.width();
                if(this.aspectRatio)
                    offset.y = this.aspectRatio * offset.x;
            }
            if(this.bounds.width()+offset.x < this.minSize.width) {
                offset.x = this.minSize.width - this.bounds.width();
                if(this.aspectRatio)
                    offset.y = this.aspectRatio * offset.x;
            }
            if(this.bounds.height()+offset.y > this.maxSize.height) {
                offset.y = this.maxSize.height - this.bounds.height();
                if(this.aspectRatio)
                    offset.x = offset.y / this.aspectRatio;
            }
            if(this.bounds.height()+offset.y < this.minSize.height) {
                offset.y = this.minSize.height - this.bounds.height();
                if(this.aspectRatio)
                    offset.x = offset.y / this.aspectRatio;
            }
        }

        if(this.orientation==="northwest") {
            var oldLR = {x: this.bounds.lowerRight().x, y: this.bounds.lowerRight().y};
            this.bounds.extend({x:-offset.x, y:-offset.y});
            this.bounds.moveBy(offset);
        } else { // defaults to southeast
            this.bounds.extend(offset);
        }

        this.update();

        this.resizeCallbacks.each((function(value) {
            value(this.bounds);
        }).bind(this));

        Event.stop(event);

    },
    
    registerOnResizeStart: function(callback) {
        if(!this.resizeStartCallbacks.member(callback)) {
            this.resizeStartCallbacks.push(callback);
        }
    },
    
    unregisterOnResizeStart: function(callback) {
        if(this.resizeStartCallbacks.member(callback)) {
            this.resizeStartCallbacks = this.resizeStartCallbacks.without(callback);
        }
    },

    registerOnResizeEnd: function(callback) {
        if(!this.resizeEndCallbacks.member(callback)) {
            this.resizeEndCallbacks.push(callback);
        }
    },
    
    unregisterOnResizeEnd: function(callback) {
        if(this.resizeEndCallbacks.member(callback)) {
            this.resizeEndCallbacks = this.resizeEndCallbacks.without(callback);
        }
    },
        
    registerOnResize: function(callback) {
        if(!this.resizeCallbacks.member(callback)) {
            this.resizeCallbacks.push(callback);
        }
    },

    unregisterOnResize: function(callback) {
        if(this.resizeCallbacks.member(callback)) {
            this.resizeCallbacks = this.resizeCallbacks.without(callback);
        }
    },

    hide: function() {
        this.node.style.display = "none";
    },

    show: function() {
        if(this.bounds)
            this.node.style.display = "";
    },

    setBounds: function(bounds, min, max, aspectRatio) {
        this.bounds = bounds;

        if(!min)
            min = {width: ORYX.CONFIG.MINIMUM_SIZE, height: ORYX.CONFIG.MINIMUM_SIZE};

        if(!max)
            max = {width: ORYX.CONFIG.MAXIMUM_SIZE, height: ORYX.CONFIG.MAXIMUM_SIZE};

        this.minSize = min;
        this.maxSize = max;
        
        this.aspectRatio = aspectRatio;

        this.update();
    },

    update: function() {
        if(!this.bounds) { return; }

        var upL = this.bounds.upperLeft();

        if(this.bounds.width() < this.minSize.width)    { this.bounds.set(upL.x, upL.y, upL.x + this.minSize.width, upL.y + this.bounds.height())};
        if(this.bounds.height() < this.minSize.height)    { this.bounds.set(upL.x, upL.y, upL.x + this.bounds.width(), upL.y + this.minSize.height)};
        if(this.bounds.width() > this.maxSize.width)    { this.bounds.set(upL.x, upL.y, upL.x + this.maxSize.width, upL.y + this.bounds.height())};
        if(this.bounds.height() > this.maxSize.height)    { this.bounds.set(upL.x, upL.y, upL.x + this.bounds.width(), upL.y + this.maxSize.height)};

        var a = this.canvasNode.getScreenCTM();
        // a is undefined when canvas is not displayed (happens during loading). In this case we pray and hope that a.a and a.d equal 1 (zoom level 100%).
        if (!a) {
            a = {
                'a': 1,
                'd': 1
            };
        }
        
        upL.x *= a.a;
        upL.y *= a.d;
        
        if(this.orientation==="northwest") {
            upL.x -= 13;
            upL.y -= 26;
        } else { // defaults to southeast
            upL.x +=  (a.a * this.bounds.width()) + 3 ;
            upL.y +=  (a.d * this.bounds.height())  + 3;
        }
        
        this.position = upL;

        this.node.style.left = this.position.x + "px";
        this.node.style.top = this.position.y + "px";
    }
});



/**
 * Implements a Command to move shapes
 * 
 */ 
ORYX.Core.Commands["DragDropResize.MoveCommand"] = ORYX.Core.AbstractCommand.extend({
    /**
     *  @param {Array} moveShapes An array of { shape: <shape object>, origin: <origin position>, target: <target position> } objects
     */
    construct: function(moveShapes, parent, selectedShapes, facade){
        // super constructor call
        arguments.callee.$.construct.call(this, facade);
        
        this.moveShapes = moveShapes;
        this.selectedShapes = selectedShapes;
        this.parent     = parent;
        // Defines the old/new parents for the particular shape
        this.newParents    = moveShapes.collect(function(t){ return parent || t.shape.parent });
        this.oldParents    = moveShapes.collect(function(shape){ return shape.shape.parent });
        this.dockedNodes= moveShapes.findAll(function(shape) {
            return shape.shape instanceof ORYX.Core.Node && shape.shape.dockers.length == 1
        }).collect(function(shape) {
            return {
                docker: shape.shape.dockers[0],
                dockedShape: shape.shape.dockers[0].getDockedShape(),
                refPoint: shape.shape.dockers[0].referencePoint
            }
        });
    },
    
    
    getAffectedShapes: function getAffectedShapes() {
        // return only the shapes from the objects inside the moveShapes Array
        var getShapes = function getShapes(obj) {
            if (obj.shape instanceof ORYX.Core.Controls.Docker) {
                return obj.shape.parent;
            } 
            return obj.shape;
        }
        var allShapes = this.moveShapes.collect(getShapes);
        var flows = [];
        for (var i = 0; i < allShapes.length; i++) {
            var shape = allShapes[i];
            if (shape instanceof ORYX.Core.Node) {
                flows = flows.concat(shape.outgoing).concat(shape.incoming);
            }
        }
        return allShapes.concat(flows);
    },
    
    getCommandName: function getCommandName() {
        return "DragDropResize.MoveCommand";
    },
    
    getDisplayName: function getDisplayName() {
        return "Shape moved";
    },
    
    getCommandData: function getCommandData() {
        var mapShapeToId = function convertShapeToId(obj) {
            var shapeData = {
                origin: obj.origin, 
                target: obj.target
            };
            if (obj.shape instanceof ORYX.Core.Controls.Docker) {
                /* A docker does not have a resourceId and therefore cannot be found via getChildShapeOrCanvasByResourceId.
                 Thus, we have to additonally store a reference to the Edge, i.e. the parent of the docker. */
                shapeData.shapeId = obj.shape.parent.resourceId;
                shapeData.dockerId = obj.shape.id;
            } else {
                shapeData.shapeId = obj.shape.resourceId;
            }
            return shapeData;
        };
        var parentId = null;
        if (this.parent) {
            parentId = this.parent.resourceId;
        }        
        var cmdData = {
            parentId : parentId,
            shapeTargetPositions : this.moveShapes.map(mapShapeToId)
        };
        
        return cmdData;
    },
    
    createFromCommandData: function createFromCommandData(facade, cmdData) {
        var i;
        var canvas = facade.getCanvas();
        var getShape = canvas.getChildShapeByResourceId.bind(canvas);
        var mapIdToShape = function mapIdToShape(obj) {
            return { shape: getShape(obj.shapeId), origin: obj.origin, target: obj.target } 
        };

        var getDocker = function getDocker(shape, dockerId) {
            var docker;
            for (var i = 0; i < shape.dockers.length; i++) {
                if (shape.dockers[i].id == dockerId) {
                    docker = shape.dockers[i];                
                }
            }
            return docker;
        };
        var parent = facade.getCanvas().getChildShapeOrCanvasByResourceId(cmdData.parentId);
        
        // There seems to be no map for the parsed array, so we'll just iterate over it.
        var moveShapes = [];
        for (i = 0; i < cmdData.shapeTargetPositions.length; i++) {
            var shape = mapIdToShape(cmdData.shapeTargetPositions[i]);
            if (shape.shape instanceof ORYX.Core.Edge) {
                var docker = getDocker(shape.shape, cmdData.shapeTargetPositions[i].dockerId);
                if (typeof docker!== "undefined") {
                    var newShape = {
                        shape: docker,
                        origin: shape.origin,
                        target: shape.target
                    };
                    moveShapes.push(newShape);
                }
            } else {
                if (typeof shape.shape !== "undefined") {
                    moveShapes.push(shape);
                } else {
                    ORYX.Log.warn("Trying to move deleted shape");
                }
            }
        }
        
        // Checking if any of the shapes to be moved still exists.
        // If not, we don't want to instantiate a command and return undefined instead.
        var shapesExist = false;
        for (var i = 0; i < moveShapes.length; i++) {
            var movingShape = moveShapes[i].shape;
            if (movingShape instanceof ORYX.Core.Controls.Docker) {
                var resourceId = movingShape.parent.resourceId;
                var parentShape = facade.getCanvas().getChildShapeByResourceId(resourceId);
                if (typeof parentShape !== 'undefined') {
                    var docker = getDocker(parentShape, movingShape.id);
                    if (typeof docker !== "undefined") {
                        shapesExist = true;
                        break;
                    }
                }
            } else {
                var resourceId = movingShape.resourceId;
                if (typeof facade.getCanvas().getChildShapeByResourceId(resourceId) !== 'undefined') {
                    shapesExist = true;
                    break;
                }
            }
        }
        if (!shapesExist) {
            return undefined;
        }
        
        var selectedShapes = []; // We don't want a remote move to change the current selection.
        return new ORYX.Core.Commands["DragDropResize.MoveCommand"](moveShapes, parent, selectedShapes, facade);
    },
    execute: function(){
        var aliveMoveShapesWithParents = this.removeDeadShapes(this.moveShapes, this.newParents);
        var aliveMoveShapes = aliveMoveShapesWithParents.moveShapes;
        var newParents = aliveMoveShapesWithParents.parents;
        this.dockAllShapes();
        // Moves all shapes in moveShapes to their targets
		this.move(aliveMoveShapes);
        // Addes to the new parents
		this.addShapeToParent(aliveMoveShapes, newParents); 
        // Set the selection to the current selection
        this.selectCurrentShapes();
        this.facade.getCanvas().update();
        this.facade.updateSelection(this.isLocal());
    },
    rollback: function(){
        // Moves by the inverted offset
        var invertedMoveShapes = this.moveShapes.map(function setTargetToOrigin(obj) {
            return { shape: obj.shape, target: obj.origin }
        });
        var aliveInvertedMoveShapesWithParents = this.removeDeadShapes(invertedMoveShapes, this.oldParents);
        var aliveInvertedMoveShapes = aliveInvertedMoveShapesWithParents.moveShapes;
        var oldParents = aliveInvertedMoveShapesWithParents.parents;
        this.move(invertedMoveShapes);
        // Addes to the old parents
		this.addShapeToParent(aliveInvertedMoveShapes, oldParents);
        this.dockAllShapes(true);
        // Set the selection to the current selection   
		this.selectCurrentShapes();
        this.facade.getCanvas().update();
        this.facade.updateSelection(this.isLocal());
        
    },
    removeDeadShapes: function removeDeadShapes(moveShapes, parents) {
        var canvas = this.facade.getCanvas();
        var getShape = function getShape(resourceId) {
            var shape = canvas.getChildShapeByResourceId(resourceId);
            return shape;
        };
        var getDocker = function getDocker(shape, dockerId) {
            var docker = undefined;
            for (var i = 0; i < shape.dockers.length; i++) {
                if (shape.dockers[i].id == dockerId) {
                    docker = shape.dockers[i];                
                }
            }
            return docker;
        };
        var aliveMoveShapes = [];
        var newParents = [];
        for (var i = 0; i < moveShapes.length; i++) {
            var currentShape = moveShapes[i].shape;
            if (currentShape instanceof ORYX.Core.Node || currentShape instanceof ORYX.Core.Edge) {
                var currentShapeOnCanvas = getShape(currentShape.resourceId);
                if (typeof currentShapeOnCanvas !== "undefined") {
                    aliveMoveShapes.push(moveShapes[i]);
                    newParents.push(parents[i]);
                }
            } else if (currentShape instanceof ORYX.Core.Controls.Docker) {
                var parentShapeOnCanvas = getShape(currentShape.parent.resourceId);
                if (typeof parentShapeOnCanvas === "undefined") {
                    continue;
                } else {
                    var dockerOnCanvas = getDocker(parentShapeOnCanvas, currentShape.id);
                    if (typeof dockerOnCanvas !== "undefined") {
                        aliveMoveShapes.push(moveShapes[i]);
                        newParents.push(parents[i]);
                    }
                }
            }
        }
        return {"moveShapes": aliveMoveShapes, "parents": newParents}; 
    },

    /**
     * @param {Array} moveShapes An array of { shape: <shape instance to move>, target: <target point> } objects
     */
    move: function(moveShapes) {
        for(var i = 0; i < moveShapes.length ; i++){
            var movingShape = moveShapes[i].shape;
            var oldCenter = movingShape.absoluteBounds().center();
            var targetCenter = moveShapes[i].target;
                        
            // Calculate the offset between the target bounds and the current bounds
            var offset = {
                x: (targetCenter.x - oldCenter.x),
                y: (targetCenter.y - oldCenter.y) 
            };
            movingShape.bounds.moveBy(offset);

            if (movingShape instanceof ORYX.Core.Node) {
                (movingShape.dockers||[]).each(function(d){
                    d.bounds.moveBy(offset);
                });

                // handleLayoutEdges results in inconsistent results between local and remote version - remote version moves undocked (added) docker twice the intended offset 
                // when it is in line with a start or enddocker

				/*var allEdges = [].concat(movingShape.getIncomingShapes())
                    .concat(movingShape.getOutgoingShapes())
                    // Remove all edges which are included in the selection from the list
                    .findAll(function(r){ return    r instanceof ORYX.Core.Edge && !moveShapes.any(function(d){ return d == r || (d instanceof ORYX.Core.Controls.Docker && d.parent == r)}) }.bind(this))
                    // Remove all edges which are between the node and a node contained in the selection from the list
                    .findAll(function(r){ return     (r.dockers.first().getDockedShape() == movingShape || !moveShapes.include(r.dockers.first().getDockedShape())) &&  
                                                    (r.dockers.last().getDockedShape() == movingShape || !moveShapes.include(r.dockers.last().getDockedShape()))}.bind(this))
                                                    
                // Layout all outgoing/incoming edges
                // this.plugin.layoutEdges(node, allEdges, offset);
                
                this.facade.raiseEvent({
                    type : ORYX.CONFIG.EVENT_LAYOUT_EDGES,
                    node : movingShape,
                    edges : allEdges,
                    offset : offset
                });*/	
            }
        }
                                        
    },
    dockAllShapes: function(shouldDocked){
        // Undock all Nodes
        for (var i = 0; i < this.dockedNodes.length; i++) {
            var docker = this.dockedNodes[i].docker;
            
            docker.setDockedShape( shouldDocked ? this.dockedNodes[i].dockedShape : undefined )
            if (docker.getDockedShape()) {
                docker.setReferencePoint(this.dockedNodes[i].refPoint);
                //docker.update();
            }
        }
    },
    
	addShapeToParent:function addShapeToParent(moveShapes, parents) {
        // For every Shape, add this and reset the position        
		for(var i=0; i < moveShapes.length ;i++){
			var currentShape = moveShapes[i].shape;
            var currentParent = parents[i];
			if((currentShape instanceof ORYX.Core.Node) && (currentShape.parent !== parents[i])) {
			    // Calc the new position
			    var unul = parents[i].absoluteXY();
			    var csul = currentShape.absoluteXY();
			    var x = csul.x - unul.x;
			    var y = csul.y - unul.y;

			    // Add the shape to the new contained shape
			    parents[i].add(currentShape);
			    // Add all attached shapes as well
			    currentShape.getOutgoingShapes((function(shape) {
				    if(shape instanceof ORYX.Core.Node && !moveShapes.member(shape)) {
					    parents[i].add(shape);
				    }
			    }).bind(this));

			    // Set the new position
			    if(currentShape.dockers.length == 1){
				    var b = currentShape.bounds;
				    x += b.width()/2;y += b.height()/2
				    currentShape.dockers.first().bounds.centerMoveTo(x, y);
			    } else {
				    currentShape.bounds.moveTo(x, y);
			    }		
                
            } 
        }
    },
    selectCurrentShapes: function selectCurrentShapes() {
        var canvas = this.facade.getCanvas();
        var getShape = function getShape(resourceId) {
            var shape = canvas.getChildShapeByResourceId(resourceId);
            return shape;
        };
        var getDocker = function getDocker(shape, dockerId) {
            for (var i = 0; i < shape.dockers.length; i++) {
                if (shape.dockers[i].id == dockerId) {
                    docker = shape.dockers[i];                
                }
            }
        };
        if (this.isLocal()) {
            //remove dead shapes from selection
            var newSelection = [];
            for (var i = 0; i < this.selectedShapes.length; i++) {
                var currentShape = this.selectedShapes[i];
                if (currentShape instanceof ORYX.Core.Node || currentShape instanceof ORYX.Core.Edge) {
                    var currentShapeOnCanvas = getShape(currentShape.resourceId);
                    if (typeof currentShapeOnCanvas !== "undefined") {
                        newSelection.push(this.selectedShapes[i]);
                    }
                } else if (currentShape instanceof ORYX.Core.Controls.Docker) {
                    var parentShapeOnCanvas = getShape(currentShape.parent.resourceId);
                    if (typeof parentShapeOnCanvas === "undefined") {
                        continue;
                    } else {
                        var dockerOnCanvas = getDocker(parentShapeOnCanvas, currentShape.id);
                        if (typeof dockerOnCanvas !== "undefined") {
                            newSelection.push(this.selectedShapes[i]);
                        }
                    }
                }
            }
            this.facade.setSelection(newSelection);  
        }
	}    
});

ORYX.Core.Commands["DragDropResize.UndockEdgeCommand"] = ORYX.Core.AbstractCommand.extend({
    construct: function construct(moveShapes, facade) {
        arguments.callee.$.construct.call(this, facade);
        this.dockers = moveShapes.collect(function(shape){ return shape instanceof ORYX.Core.Controls.Docker ? {docker:shape, dockedShape:shape.getDockedShape(), refPoint:shape.referencePoint} : undefined }).compact();
    },

    getCommandData: function getCommandData() {
        var dockerParents = this.dockers.map(function (docker) {
            return docker.parent;
        }.bind(this));
        var getId = function getId(docker) {
            return docker.id;
        };
        var getResourceId = function getResourceId(shape) {
            return shape.resourceId;
        };  
        var cmd = {
            "dockerIds": this.dockers.map(getId),
            "dockerParentsResourceIds": dockerParents.map(getResourceId)
        };
        return cmd;
    },
    
    createFromCommandData: function createFromCommandData(facade, commandObject) {
        var getShape = function getShape(resourceId) {
            var shape = facade.getCanvas().getChildShapeByResourceId(resourceId);
            return shape;
        };
        var getDocker = function getDocker(shape, dockerId) {
            for (var i = 0; i < shape.dockers.length; i++) {
                if (shape.dockers[i].id == dockerId) {
                    docker = shape.dockers[i];                
                }
            }
        };

        var moveShapes = [];
        for (var i = 0; i < commandObject.dockerIds; i++) {
            var shape = getShape(dockerParentsResourceIds[i]);
            moveShapes.push(getDocker(shape, dockerIds[i]));
        }        
        return new ORYX.Core.Commands["DragDropResize.UndockEdgeCommand"](moveShapes, facade);
    },
    
    getCommandName: function getCommandName() {
        return "DragDropResize.UndockEdgeCommand";
    },
    
    getAffectedShapes: function getAffectedShapes() {
        //only DockerObjects should be affected
        return [];
    },            
    execute: function execute() {
        this.dockers.each(function(el){
            el.docker.setDockedShape(undefined);
        })
    },
    rollback: function execute() {
        this.dockers.each(function(el){
        el.docker.setDockedShape(el.dockedShape);
        el.docker.setReferencePoint(el.refPoint);
        //el.docker.update();
        })
    }
});




/**
  * Implements a command class for the Resize Command.
  */
ORYX.Core.Commands["DragDropResize.ResizeCommand"] = ORYX.Core.AbstractCommand.extend({
    construct: function construct(shape, newBounds, oldBounds, facade, orientation) {
        arguments.callee.$.construct.call(this, facade);
        this.orientation = orientation;
        this.shape = shape;
        this.newBounds = newBounds;
        this.oldBounds = oldBounds;
    },
    
    getCommandData: function getCommandData() {
        var cmd = {
            "shapeId": this.shape.resourceId,
            "newBounds": {
                "width": this.newBounds.b.x - this.newBounds.a.x,
                "height": this.newBounds.b.y - this.newBounds.a.y
            },
            "oldBounds": {
                "a": this.oldBounds.upperLeft(),
                "b": this.oldBounds.lowerRight()
            },
            "orientation": this.orientation
        };
        return cmd;
    },
    
    createFromCommandData: function createFromCommandData(facade, commandObject) {
        var shape = facade.getCanvas().getChildShapeByResourceId(commandObject.shapeId);
        // if shape is undefined (i.e. has been deleted) we cannot instantiate the command
        if (typeof shape === 'undefined') {
            return undefined;
        }
        var newBoundsObj = shape.bounds.clone();
        newBoundsObj.resize(commandObject.orientation, commandObject.newBounds);
        var oldBoundsObj = shape.absoluteBounds().clone();
        oldBoundsObj.set(commandObject.oldBounds);
        return new ORYX.Core.Commands["DragDropResize.ResizeCommand"](shape, newBoundsObj, oldBoundsObj, facade);
    },
    
    getCommandName: function getCommandName() {
        return "DragDropResize.ResizeCommand";
    },
    
    getDisplayName: function getDisplayName() {
        return "Shape resized";
    },
    
    getAffectedShapes: function getAffectedShapes() {
        return [this.shape];
    },
    
    execute: function execute() {
        this.shape.bounds.set(this.newBounds.a, this.newBounds.b);
        this.update(this.getOffset(this.oldBounds, this.newBounds));
    },
    
    rollback: function rollback(){
        this.shape.bounds.set(this.oldBounds.a, this.oldBounds.b);
        this.update(this.getOffset(this.newBounds, this.oldBounds))
    },
    
    getOffset: function getOffset(b1, b2){
        return {
            x: b2.a.x - b1.a.x,
            y: b2.a.y - b1.a.y,
            xs: b2.width() / b1.width(),
            ys: b2.height() / b1.height()
        }
    },
    
    update: function update(offset) {
        this.shape.getLabels().each(function(label) {
            label.changed();
        });
        var allEdges = [];
        allEdges.concat(this.shape.getIncomingShapes());
        allEdges.concat(this.shape.getOutgoingShapes());
        // Remove all edges which are included in the selection from the list
        allEdges.findAll(function(r){ return r instanceof ORYX.Core.Edge }.bind(this));
        // Layout all outgoing/incoming edges
        /*this.facade.raiseEvent({
            type: ORYX.CONFIG.EVENT_LAYOUT_EDGES,
            node: this.shape,
            edges: allEdges,
            offset: offset
        });*/

        this.facade.getCanvas().update();
        if (this.isLocal()) {
            this.facade.setSelection([this.shape]);
        }
        this.facade.updateSelection(this.isLocal());
    }
});
/**
 * Copyright (c) 2009-2010
 * processWave.org (Michael Goderbauer, Markus Goetz, Marvin Killing, Martin
 * Kreichgauer, Martin Krueger, Christian Ress, Thomas Zimmermann)
 *
 * based on oryx-project.org (Martin Czuchra, Nicolas Peters, Daniel Polak,
 * Willi Tscheschner, Oliver Kopp, Philipp Giese, Sven Wagner-Boysen, Philipp Berger, Jan-Felix Schwarz)
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 **/

/**
 * @namespace Oryx name space for plugins
 * @name ORYX.Plugins
*/
if(!ORYX.Plugins)
	ORYX.Plugins = new Object();

ORYX.Plugins.JSONExport = ORYX.Plugins.AbstractPlugin.extend({
	construct: function construct(facade) {
		arguments.callee.$.construct.apply(this, arguments);

        this.facade.registerOnEvent(ORYX.CONFIG.EVENT_EXPORT_JSON, this.JSONExport.bind(this));

		this.facade.offer({
			'name': ORYX.I18N.JSONExport.name,
			'functionality': this.JSONExport.bind(this),
			'group': ORYX.I18N.JSONExport.group,
			'iconCls': 'pw-toolbar-button pw-toolbar-export',
			'description': ORYX.I18N.JSONExport.desc,
			'index': 1,
			'minShape': 0,
			'maxShape': 0,
			'isEnabled': function(){return true},
            'visibleInViewMode': true
        });
    },
    
    /*
    * Exporting a model from the processWave editor into the ORYX editor.
    * We get the JSON-serialized model, the stencilset and the stencilset-extensions
    * and POST them to an ORYX-URL. 
    */    
    JSONExport: function JSONExport() {
    
        // Getting the JSON represantation of the model:
        
        var serializedCanvas = this.facade.getSerializedJSON();
        
        // Getting the stencilSet: 
        
        var ssetObj = this.facade.getStencilSets();
        // ssetObj contains a KV mapping of StencilSetNamespace -> StencilSetURL.
        // as we don't know what the first key is, an in-loop helps us.        
        for (i in ssetObj) {
            var ssetURL = ssetObj[i].source();
            break;
            // we break after the first StencilSet because there should be just one StencilSet normally.
        }
        ssetURL = ssetURL.slice(ssetURL.indexOf("stencilsets/"));        
        ssetURL = ssetURL.replace("petrinets.json", "petrinet.json");
        // the guys from oryx-project use /petrinets/petrinet.json instead of petrinets.json        
        ssetURL = ssetURL.replace(/simpleBPMN2.0/g, "bpmn2.0")
        // simpleBPMN2.0 is not yet supported in the oryx-project... 
        // bpmn2.0 does the job until it is supported.
        
        // Getting the StencilSetExtensions:
        var canvasObj = this.facade.getJSON();
        var exts = Object.toJSON(canvasObj.ssextensions);

        var url = "/search";
        var params = {
            json: serializedCanvas,
            stencilset: ssetURL,
            exts: exts
        };

        jQuery.ajax({
            url: url,
            type: "POST",
            dataType: "json",
            contentType: "application/json",
            data: JSON.stringify(params)
        });
    }
});/**
 * Copyright (c) 2009-2010
 * processWave.org (Michael Goderbauer, Markus Goetz, Marvin Killing, Martin
 * Kreichgauer, Martin Krueger, Christian Ress, Thomas Zimmermann)
 *
 * based on oryx-project.org (Martin Czuchra, Nicolas Peters, Daniel Polak,
 * Willi Tscheschner, Oliver Kopp, Philipp Giese, Sven Wagner-Boysen, Philipp Berger, Jan-Felix Schwarz)
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 **/

if(!ORYX.Plugins) {
	ORYX.Plugins = new Object();
}

ORYX.Plugins.ShapeMenuPlugin = {

	construct: function(facade) {
		this.facade = facade;
		
		this.alignGroups = new Hash();

		var containerNode = this.facade.getCanvas().getHTMLContainer();

		this.shapeMenu = new ORYX.Plugins.ShapeMenu(containerNode);
		this.currentShapes = [];

		// Register on dragging and resizing events for show/hide of ShapeMenu
		this.facade.registerOnEvent(ORYX.CONFIG.EVENT_DRAGDROP_START, this.hideShapeMenu.bind(this));
		this.facade.registerOnEvent(ORYX.CONFIG.EVENT_DRAGDROP_END,  this.showShapeMenu.bind(this));
		this.facade.registerOnEvent(ORYX.CONFIG.EVENT_RESIZE_START,  (function(){
			this.hideShapeMenu();
			this.hideMorphMenu();
		}).bind(this));
		this.facade.registerOnEvent(ORYX.CONFIG.EVENT_RESIZE_END,  this.showShapeMenu.bind(this));
		
		// Enable DragZone
		var DragZone = new Ext.dd.DragZone(containerNode.parentNode, {shadow: !Ext.isMac});
		DragZone.afterDragDrop = this.afterDragging.bind(this, DragZone);
		DragZone.beforeDragOver = this.beforeDragOver.bind(this, DragZone);
		
		// Memory of created Buttons
		this.createdButtons = {};
		
		this.facade.registerOnEvent(ORYX.CONFIG.EVENT_STENCIL_SET_LOADED, (function(){ this.registryChanged() }).bind(this));
        this.facade.registerOnEvent(ORYX.CONFIG.EVENT_SHAPEDELETED, this.clearShapeMenu.bind(this));
        this.facade.registerOnEvent(ORYX.CONFIG.EVENT_SHAPEBOUNDS_CHANGED, this.onBoundsChanged.bind(this));

		this.timer = null;
		
		this.resetElements = true;

	},

    onBoundsChanged: function onBoundsChanged(event) {
        if (this.currentShapes.include(event.shape)) {
            this.hideShapeMenu();
            this.showShapeMenu();
        }
    },

    clearShapeMenu: function clearShapeMenu(event) {
        if (this.currentShapes.include(event.shape)) {
            this.hideShapeMenu();
        }
    },

	hideShapeMenu: function(event) {
		window.clearTimeout(this.timer);
		this.timer = null;
		this.shapeMenu.hide();
	},

	showShapeMenu: function( dontGenerateNew ) {
	
		if( !dontGenerateNew || this.resetElements ){
			
			window.clearTimeout(this.timer);
			this.timer = window.setTimeout(function(){
				
					// Close all Buttons
				this.shapeMenu.closeAllButtons();
		
				// Show the Morph Button
				this.showMorphButton(this.currentShapes);
				
				// Show the Stencil Buttons
				this.showStencilButtons(this.currentShapes);	
				
				// Show the ShapeMenu
				this.shapeMenu.show(this.currentShapes);
				
				this.resetElements = false;
			}.bind(this), 300)
			
		} else {
			
			window.clearTimeout(this.timer);
			this.timer = null;
			
			// Show the ShapeMenu
			this.shapeMenu.show(this.currentShapes);
			
		}
	},

	registryChanged: function(pluginsData) {
		
		if(pluginsData) {
			pluginsData = pluginsData.each(function(value) {value.group = value.group ? value.group : 'unknown'});
			this.pluginsData = pluginsData.sortBy( function(value) {
				return (value.group + "" + value.index);
			});			
		}		
		
		this.shapeMenu.removeAllButtons();
		this.shapeMenu.setNumberOfButtonsPerLevel(ORYX.CONFIG.SHAPEMENU_RIGHT, 2);
		this.createdButtons = {};
		
		this.createMorphMenu();
		
		if( !this.pluginsData ){
			this.pluginsData = [];
		}

		this.baseMorphStencils = this.facade.getRules().baseMorphs();
		
		// Checks if the stencil set has morphing attributes
		var isMorphing = this.facade.getRules().containsMorphingRules();
		
		// Create Buttons for all Stencils of all loaded stencilsets
		var stencilsets = this.facade.getStencilSets();
		stencilsets.values().each((function(stencilSet){
			
			var nodes = stencilSet.nodes();
			nodes.each((function(stencil) {
								
				// Create a button for each node
				var option = {type: stencil.id(), namespace: stencil.namespace(), connectingType: true};
				var button = new ORYX.Plugins.ShapeMenuButton({
					callback: 	this.newShape.bind(this, option),
					icon: 		stencil.icon(),
					align: 		ORYX.CONFIG.SHAPEMENU_RIGHT,
					group:		0,
					//dragcallback: this.hideShapeMenu.bind(this),
					msg:		stencil.title() + " - " + ORYX.I18N.ShapeMenuPlugin.clickDrag
					});
				
				// Add button to shape menu
				this.shapeMenu.addButton(button); 
				
				// Add to the created Button Array
				this.createdButtons[stencil.namespace() + stencil.type() + stencil.id()] = button;
				
				// Drag'n'Drop will enable
				Ext.dd.Registry.register(button.node.lastChild, option);				
			}).bind(this));
		

			var edges = stencilSet.edges();
			edges.each((function(stencil) {

				// Create a button for each edge
				var option = {type: stencil.id(), namespace: stencil.namespace()};
				var button = new ORYX.Plugins.ShapeMenuButton({
					callback: 	this.newShape.bind(this, option),
					icon: 		stencil.icon(), // /* uml has morphing rules for all shapes, this makes them indistinguishable. */ isMorphing ? ORYX.PATH + "images/edges.png" : stencil.icon(),
					align: 		ORYX.CONFIG.SHAPEMENU_RIGHT,
					group:		1,
					//dragcallback: this.hideShapeMenu.bind(this),
					msg:		(isMorphing ? ORYX.I18N.Edge : stencil.title()) + " - " + ORYX.I18N.ShapeMenuPlugin.drag
				});
				
				// Add button to shape menu
				this.shapeMenu.addButton(button); 
				
				// Add to the created Button Array
				this.createdButtons[stencil.namespace() + stencil.type() + stencil.id()] = button;
				
				// Drag'n'Drop will enable
				Ext.dd.Registry.register(button.node.lastChild, option);
				
			}).bind(this));
		
		}).bind(this));				
					
	},
	
	createMorphMenu: function() {
		
		this.morphMenu = new Ext.menu.Menu({
			id: 'Oryx_morph_menu',
			items: []
		});
		
		this.morphMenu.on("mouseover", function() {
			this.morphMenuHovered = true;
		}, this);
		this.morphMenu.on("mouseout", function() {
			this.morphMenuHovered = false;
		}, this);
		
		
		// Create the button to show the morph menu
		var button = new ORYX.Plugins.ShapeMenuButton({
			hovercallback: 	(ORYX.CONFIG.ENABLE_MORPHMENU_BY_HOVER ? this.showMorphMenu.bind(this) : undefined), 
			resetcallback: 	(ORYX.CONFIG.ENABLE_MORPHMENU_BY_HOVER ? this.hideMorphMenu.bind(this) : undefined), 
			callback:		(ORYX.CONFIG.ENABLE_MORPHMENU_BY_HOVER ? undefined : this.toggleMorphMenu.bind(this)), 
			icon: 			ORYX.PATH + 'editor/images/wrench_orange.png',
			align: 			ORYX.CONFIG.SHAPEMENU_BOTTOM,
			group:			0,
			msg:			ORYX.I18N.ShapeMenuPlugin.morphMsg
		});				
		
		this.shapeMenu.setNumberOfButtonsPerLevel(ORYX.CONFIG.SHAPEMENU_BOTTOM, 1)
		this.shapeMenu.addButton(button);
		this.morphMenu.getEl().appendTo(button.node);
		this.morphButton = button;
	},
	
	showMorphMenu: function() {
		this.morphMenu.show(this.morphButton.node);
		this._morphMenuShown = true;
	},
	
	hideMorphMenu: function() {
		this.morphMenu.hide();
		this._morphMenuShown = false;
	},
	
	toggleMorphMenu: function() {
		if(this._morphMenuShown)
			this.hideMorphMenu();
		else
			this.showMorphMenu();
	},
	
	onSelectionChanged: function(event) {
        // don't do this for remote commands
        if (!event.isLocal)
            return;

		//var elements = event.elements;
        var selection = this.facade.getSelection();

		this.hideShapeMenu();
		this.hideMorphMenu();

        if (!selection.length > 0) {
            return;
        }
        
        if (selection[0] instanceof ORYX.Core.Edge) {
            return;
        }

		if (this.currentShapes.inspect() !== selection.inspect()) {
			this.currentShapes = selection;
			this.resetElements = true;
			this.showShapeMenu();
		} else {
			this.showShapeMenu(true)

		}
        this.facade.updateSelection(false);
	},
	
	/**
	 * Show button for morphing the selected shape into another stencil
	 */
	showMorphButton: function(elements) {
		
		if(elements.length != 1) return;
		
		var possibleMorphs = this.facade.getRules().morphStencils({ stencil: elements[0].getStencil() });
		possibleMorphs = possibleMorphs.select(function(morph) {
			if(elements[0].getStencil().type() === "node") {
				//check containment rules
				return this.facade.getRules().canContain({containingShape:elements[0].parent, containedStencil:morph});
			} else { 
				//check connect rules
				return this.facade.getRules().canConnect({
											sourceShape:	elements[0].dockers.first().getDockedShape(), 
											edgeStencil:	morph, 
											targetShape:	elements[0].dockers.last().getDockedShape()
											});	
			}
		}.bind(this));
		if(possibleMorphs.size()<=1) return; // if morphing to other stencils is not possible, don't show button
		
		this.morphMenu.removeAll();
		
		// populate morph menu with the possible morph stencils ordered by their position
		possibleMorphs = possibleMorphs.sortBy(function(stencil) { return stencil.position(); });
		possibleMorphs.each((function(morph) {
			var menuItem = new Ext.menu.Item({ 
				text: morph.title(), 
				icon: morph.icon(), 
				disabled: morph.id()==elements[0].getStencil().id(),
				disabledClass: ORYX.CONFIG.MORPHITEM_DISABLED,
				handler: (function() { this.morphShape(elements[0], morph); }).bind(this) 
			});
			this.morphMenu.add(menuItem);
		}).bind(this));
		
		this.morphButton.prepareToShow();
		
	},

	/**
	 * Show buttons for creating following shapes
	 */
	showStencilButtons: function(elements) {

		if(elements.length != 1) return;

		//TODO temporaere nutzung des stencilsets
		var sset = this.facade.getStencilSets()[elements[0].getStencil().namespace()];

		// Get all available edges
		var edges = this.facade.getRules().outgoingEdgeStencils({canvas:this.facade.getCanvas(), sourceShape:elements[0]});
		
		// And find all targets for each Edge
		var targets = new Array();
		var addedEdges = new Array();
		
		var isMorphing = this.facade.getRules().containsMorphingRules();
		
		edges.each((function(edge) {
			
			if (isMorphing){
				if(this.baseMorphStencils.include(edge)) {
					var shallAppear = true;
				} else {
					
					// if edge is member of a morph groups where none of the base morphs is in the outgoing edges
					// we want to display the button (but only for the first one)
					
					var possibleMorphs = this.facade.getRules().morphStencils({ stencil: edge });
					
					var shallAppear = !possibleMorphs.any((function(morphStencil) {
						if(this.baseMorphStencils.include(morphStencil) && edges.include(morphStencil)) return true;
						return addedEdges.include(morphStencil);
					}).bind(this));
					
				}
			}
			if(shallAppear || !isMorphing) {
				if(this.createdButtons[edge.namespace() + edge.type() + edge.id()]) 
					this.createdButtons[edge.namespace() + edge.type() + edge.id()].prepareToShow();
				addedEdges.push(edge);
			}
			
			// get all targets for this edge
			targets = targets.concat(this.facade.getRules().targetStencils(
					{canvas:this.facade.getCanvas(), sourceShape:elements[0], edgeStencil:edge}));

		}).bind(this));
		
		targets.uniq();
		
		var addedTargets = new Array();
		// Iterate all possible target 
		targets.each((function(target) {
			
			if (isMorphing){
				
				// continue with next target stencil
				if (target.type()==="edge") return; 
				
				// continue when stencil should not shown in the shape menu
				if (!this.facade.getRules().showInShapeMenu(target)) return 
				
				// if target is not a base morph 
				if(!this.baseMorphStencils.include(target)) {
					
					// if target is member of a morph groups where none of the base morphs is in the targets
					// we want to display the button (but only for the first one)
					
					var possibleMorphs = this.facade.getRules().morphStencils({ stencil: target });
					if(possibleMorphs.size()==0) return; // continue with next target
	
					var baseMorphInTargets = possibleMorphs.any((function(morphStencil) {
						if(this.baseMorphStencils.include(morphStencil) && targets.include(morphStencil)) return true;
						return addedTargets.include(morphStencil);
					}).bind(this));
					
					if(baseMorphInTargets) return; // continue with next target
				}
			}
			
			// if this is reached the button shall appear in the shape menu:
			if(this.createdButtons[target.namespace() + target.type() + target.id()]) 
				this.createdButtons[target.namespace() + target.type() + target.id()].prepareToShow();
			addedTargets.push(target);
			
		}).bind(this));
		
	},

	
	beforeDragOver: function(dragZone, target, event){

		if (this.shapeMenu.isVisible){
			this.hideShapeMenu();
		}

		var coord = this.facade.eventCoordinates(event.browserEvent);
		var aShapes = this.facade.getCanvas().getAbstractShapesAtPosition(coord);

		if(aShapes.length <= 0) {return false;}	
		
		var el = aShapes.last();
		
		if(this._lastOverElement == el) {
			
			return false;
			
		} else {
			// check containment rules
			var option = Ext.dd.Registry.getHandle(target.DDM.currentTarget);
			
			// revert to original options if these were modified
			if(option.backupOptions) {
				for(key in option.backupOptions) {
					option[key] = option.backupOptions[key];
				}
				delete option.backupOptions;
			}

			var stencilSet = this.facade.getStencilSets()[option.namespace];

			var stencil = stencilSet.stencil(option.type);

			var candidate = aShapes.last();

			if(stencil.type() === "node") {
				//check containment rules
				var canContain = this.facade.getRules().canContain({containingShape:candidate, containedStencil:stencil});
									
				// if not canContain, try to find a morph which can be contained
				if(!canContain) {
					var possibleMorphs = this.facade.getRules().morphStencils({stencil: stencil});
					for(var i=0; i<possibleMorphs.size(); i++) {
						canContain = this.facade.getRules().canContain({
							containingShape:candidate, 
							containedStencil:possibleMorphs[i]
						});
						if(canContain) {
							option.backupOptions = Object.clone(option);
							option.type = possibleMorphs[i].id();
							option.namespace = possibleMorphs[i].namespace();
							break;
						}
					}
				}
					
				this._currentReference = canContain ? candidate : undefined;
					
	
			} else { //Edge
			
				var curCan = candidate, orgCan = candidate;
				var canConnect = false;
				while(!canConnect && curCan && !(curCan instanceof ORYX.Core.Canvas)){
					candidate = curCan;
					//check connection rules
					canConnect = this.facade.getRules().canConnect({
											sourceShape: this.currentShapes.first(), 
											edgeStencil: stencil, 
											targetShape: curCan
											});	
					curCan = curCan.parent;
				}

			 	// if not canConnect, try to find a morph which can be connected
				if(!canConnect) {
					
					candidate = orgCan;
					var possibleMorphs = this.facade.getRules().morphStencils({stencil: stencil});
					for(var i=0; i<possibleMorphs.size(); i++) {
						var curCan = candidate;
						var canConnect = false;
						while(!canConnect && curCan && !(curCan instanceof ORYX.Core.Canvas)){
							candidate = curCan;
							//check connection rules
							canConnect = this.facade.getRules().canConnect({
														sourceShape:	this.currentShapes.first(), 
														edgeStencil:	possibleMorphs[i], 
														targetShape:	curCan
													});	
							curCan = curCan.parent;
						}
						if(canConnect) {
							option.backupOptions = Object.clone(option);
							option.type = possibleMorphs[i].id();
							option.namespace = possibleMorphs[i].namespace();
							break;
						} else {
							candidate = orgCan;
						}
					}
				}
										
				this._currentReference = canConnect ? candidate : undefined;		
				
			}	

			this.facade.raiseEvent({
											type:		ORYX.CONFIG.EVENT_HIGHLIGHT_SHOW, 
											highlightId:'shapeMenu',
											elements:	[candidate],
											color:		this._currentReference ? ORYX.CONFIG.SELECTION_VALID_COLOR : ORYX.CONFIG.SELECTION_INVALID_COLOR
										});
												
			var pr = dragZone.getProxy();
			pr.setStatus(this._currentReference ? pr.dropAllowed : pr.dropNotAllowed );
			pr.sync();
										
		}
		
		this._lastOverElement = el;
		
		return false;
	},	

	afterDragging: function(dragZone, target, event) {
		
		if (!(this.currentShapes instanceof Array)||this.currentShapes.length<=0) {
			return;
		}
		var sourceShape = this.currentShapes;
		
		this._lastOverElement = undefined;
		
		// Hide the highlighting
		this.facade.raiseEvent({type: ORYX.CONFIG.EVENT_HIGHLIGHT_HIDE, highlightId:'shapeMenu'});
		
		// Check if drop is allowed
		var proxy = dragZone.getProxy()
		if(proxy.dropStatus == proxy.dropNotAllowed) { return this.facade.updateSelection(true);}
				
		// Check if there is a current Parent
		if(!this._currentReference) { return }
				
		var option = Ext.dd.Registry.getHandle(target.DDM.currentTarget);
		option['parent'] = this._currentReference;

		var xy = event.getXY();
		var pos = {x: xy[0], y: xy[1]};

		var a = this.facade.getCanvas().node.getScreenCTM();
		// Correcting the UpperLeft-Offset
		pos.x -= a.e; pos.y -= a.f;
		// Correcting the Zoom-Faktor
		pos.x /= a.a; pos.y /= a.d;
		// Correcting the ScrollOffset
		pos.x -= document.documentElement.scrollLeft;
		pos.y -= document.documentElement.scrollTop;

		var parentAbs = this._currentReference.absoluteXY();
		pos.x -= parentAbs.x;
		pos.y -= parentAbs.y;
		
		// If the ctrl key is not pressed, 
		// snapp the new shape to the center 
		// if it is near to the center of the other shape
		if (!event.ctrlKey){
			// Get the center of the shape
			var cShape = this.currentShapes[0].bounds.center();
			// Snapp +-20 Pixel horizontal to the center 
			if (20 > Math.abs(cShape.x - pos.x)){
				pos.x = cShape.x;
			}
			// Snapp +-20 Pixel vertical to the center 
			if (20 > Math.abs(cShape.y - pos.y)){
				pos.y = cShape.y;
			}
		}
				
		option['position'] = pos;
		option['connectedShape'] = this.currentShapes[0];
		if(option['connectingType']) {
			var stencilset = this.facade.getStencilSets()[option.namespace];
			var containedStencil = stencilset.stencil(option.type);
			var args = { sourceShape: this.currentShapes[0], targetStencil: containedStencil };
			option['connectingType'] = this.facade.getRules().connectMorph(args).id();
		}
		
		if (ORYX.CONFIG.SHAPEMENU_DISABLE_CONNECTED_EDGE===true) {
			delete option['connectingType'];
		}
			
		var command = new ORYX.Core.Commands["ShapeMenu.CreateCommand"](Object.clone(option), this._currentReference, pos, this.facade);
		
		this.facade.executeCommands([command]);
		
		// Inform about completed Drag 
		this.facade.raiseEvent({type: ORYX.CONFIG.EVENT_SHAPE_MENU_CLOSE, source:sourceShape, destination:this.currentShapes});
		
		// revert to original options if these were modified
		if(option.backupOptions) {
			for(key in option.backupOptions) {
				option[key] = option.backupOptions[key];
			}
			delete option.backupOptions;
		}	
		
		this._currentReference = undefined;		
	},

	newShape: function(option, event) {
		var stencilset = this.facade.getStencilSets()[option.namespace];
		var containedStencil = stencilset.stencil(option.type);

		if(this.facade.getRules().canContain({
			containingShape:this.currentShapes.first().parent,
			"containedStencil":containedStencil
		})) {

			option['connectedShape'] = this.currentShapes[0];
			option['parent'] = this.currentShapes.first().parent;
			option['containedStencil'] = containedStencil;
		
			var args = { sourceShape: this.currentShapes[0], targetStencil: containedStencil };
			var targetStencil = this.facade.getRules().connectMorph(args);
			if (!targetStencil){ return }// Check if there can be a target shape
			option['connectingType'] = targetStencil.id();

			if (ORYX.CONFIG.SHAPEMENU_DISABLE_CONNECTED_EDGE===true) {
				delete option['connectingType'];
			}
			
			var command = new ORYX.Core.Commands["ShapeMenu.CreateCommand"](option, undefined, undefined, this.facade);
		
			this.facade.executeCommands([command]);
		}
	},
	

	/**
	 * Morph a shape to a new stencil
	 * @param {Shape} shape
	 * @param {Stencil} stencil
	 */
	morphShape: function(shape, stencil) {		
		var command = new ORYX.Core.Commands["ShapeMenu.MorphCommand"](shape, stencil, this.facade);
		this.facade.executeCommands([command]);
	}
}
ORYX.Plugins.ShapeMenuPlugin = ORYX.Plugins.AbstractPlugin.extend(ORYX.Plugins.ShapeMenuPlugin);

ORYX.Plugins.ShapeMenu = {

	/***
	 * Constructor.
	 */
	construct: function(parentNode) {

		this.bounds = undefined;
		this.shapes = undefined;
		this.buttons = [];
		this.isVisible = false;

		this.node = ORYX.Editor.graft("http://www.w3.org/1999/xhtml", $(parentNode),
			['div', {id: ORYX.Editor.provideId(), 'class':'Oryx_ShapeMenu'}]);
		
		this.alignContainers = new Hash();
		this.numberOfButtonsPerLevel = new Hash();
	},

	addButton: function(button) {
		this.buttons.push(button);
		// lazy grafting of the align containers
		if(!this.alignContainers[button.align]) {
			this.alignContainers[button.align] = ORYX.Editor.graft("http://www.w3.org/1999/xhtml", this.node,
					['div', {'class':button.align}]);
			this.node.appendChild(this.alignContainers[button.align]);
			
			// add event listeners for hover effect
			var onBubble = false;
			this.alignContainers[button.align].addEventListener(ORYX.CONFIG.EVENT_MOUSEOVER, this.hoverAlignContainer.bind(this, button.align), onBubble);
			this.alignContainers[button.align].addEventListener(ORYX.CONFIG.EVENT_MOUSEOUT, this.resetAlignContainer.bind(this, button.align), onBubble);
			this.alignContainers[button.align].addEventListener(ORYX.CONFIG.EVENT_MOUSEUP, this.hoverAlignContainer.bind(this, button.align), onBubble);
		}
		this.alignContainers[button.align].appendChild(button.node);
	},

	deleteButton: function(button) {
		this.buttons = this.buttons.without(button);
		this.node.removeChild(button.node);
	},

	removeAllButtons: function() {
		var me = this;
		this.buttons.each(function(value){
			if (value.node&&value.node.parentNode)
				value.node.parentNode.removeChild(value.node);
		});
		this.buttons = [];
	},

	closeAllButtons: function() {
		this.buttons.each(function(value){ value.prepareToHide() });
		this.isVisible = false;
	},

	
	/**
	 * Show the shape menu
	 */
	show: function(shapes) {

		//shapes = (shapes||[]).findAll(function(r){ return r && r.node && r.node.parent });

		if(shapes.length <= 0 )
			return

		this.shapes = shapes;

		var newBounds = undefined;
		var tmpBounds = undefined;

		this.shapes.each(function(value) {
			var a = value.node.getScreenCTM();
			var upL = value.absoluteXY();
			a.e = a.a*upL.x;
			a.f = a.d*upL.y;
			tmpBounds = new ORYX.Core.Bounds(a.e, a.f, a.e+a.a*value.bounds.width(), a.f+a.d*value.bounds.height());

			/*if(value instanceof ORYX.Core.Edge) {
				tmpBounds.moveBy(value.bounds.upperLeft())
			}*/

			if(!newBounds)
				newBounds = tmpBounds
			else
				newBounds.include(tmpBounds);

		});

		this.bounds = newBounds;
		//this.bounds.moveBy({x:document.documentElement.scrollLeft, y:document.documentElement.scrollTop});

		var bounds = this.bounds;

		var a = this.bounds.upperLeft();

		var left = 0,
			leftButtonGroup = 0;
		var top = 0,
			topButtonGroup = 0;
		var bottom = 0,
			bottomButtonGroup;
		var right = 0
			rightButtonGroup = 0;
		var size = 22;
		
		this.getWillShowButtons().sortBy(function(button) {
			return button.group;
		});
		
		this.getWillShowButtons().each(function(button){
			
			var numOfButtonsPerLevel = this.getNumberOfButtonsPerLevel(button.align);

			if (button.align == ORYX.CONFIG.SHAPEMENU_LEFT) {
				// vertical levels
				if(button.group!=leftButtonGroup) {
					left = 0;
					leftButtonGroup = button.group;
				}
				var x = Math.floor(left / numOfButtonsPerLevel);
				var y = left % numOfButtonsPerLevel;
				
				button.setLevel(x);
				
				button.setPosition(a.x-5 - (x+1)*size, 
						a.y+numOfButtonsPerLevel*button.group*size + button.group*0.3*size + y*size);
				
				//button.setPosition(a.x-22, a.y+left*size);
				left++;
 			} else if (button.align == ORYX.CONFIG.SHAPEMENU_TOP) {
 				// horizontal levels
 				if(button.group!=topButtonGroup) {
					top = 0;
					topButtonGroup = button.group;
				}
 				var x = top % numOfButtonsPerLevel;
 				var y = Math.floor(top / numOfButtonsPerLevel);
 				
 				button.setLevel(y);
 				
 				button.setPosition(a.x+numOfButtonsPerLevel*button.group*size + button.group*0.3*size + x*size,
 						a.y-5 - (y+1)*size);
				top++;
 			} else if (button.align == ORYX.CONFIG.SHAPEMENU_BOTTOM) {
 				// horizontal levels
 				if(button.group!=bottomButtonGroup) {
					bottom = 0;
					bottomButtonGroup = button.group;
				}
 				var x = bottom % numOfButtonsPerLevel;
 				var y = Math.floor(bottom / numOfButtonsPerLevel);
 				
 				button.setLevel(y);
 				
 				button.setPosition(a.x+numOfButtonsPerLevel*button.group*size + button.group*0.3*size + x*size,
 						a.y+bounds.height() + 5 + y*size);
				bottom++;
			} else {
				// vertical levels
				if(button.group!=rightButtonGroup) {
					right = 0;
					rightButtonGroup = button.group;
				}
				var x = Math.floor(right / numOfButtonsPerLevel)
				var y = right % numOfButtonsPerLevel;
				
				button.setLevel(x);
				
				button.setPosition(a.x+bounds.width() + 5 + x*size, 
						a.y+numOfButtonsPerLevel*button.group*size + button.group*0.3*size + y*size - 5);
				right++;
			}

			button.show();
		}.bind(this));
		this.isVisible = true;

	},

	/**
	 * Hide the shape menu
	 */
	hide: function() {

		this.buttons.each(function(button){
			button.hide();
		});

		this.isVisible = false;
		//this.bounds = undefined;
		//this.shape = undefined;
	},

	hoverAlignContainer: function(align, evt) {
		this.buttons.each(function(button){
			if(button.align == align) button.showOpaque();
		});
	},
	
	resetAlignContainer: function(align, evt) {
		this.buttons.each(function(button){
			if(button.align == align) button.showTransparent();
		});
	},
	
	isHover: function() {
		return 	this.buttons.any(function(value){
					return value.isHover();
				});
	},
	
	getWillShowButtons: function() {
		return this.buttons.findAll(function(value){return value.willShow});
	},
	
	/**
	 * Returns a set on buttons for that align value
	 * @params {String} align
	 * @params {String} group
	 */
	getButtons: function(align, group){
		return this.getWillShowButtons().findAll(function(b){ return b.align == align && (group === undefined || b.group == group)})
	},
	
	/**
	 * Set the number of buttons to display on each level of the shape menu in the specified align group.
	 * Example: setNumberOfButtonsPerLevel(ORYX.CONFIG.SHAPEMENU_RIGHT, 2) causes that the buttons of the right align group 
	 * will be rendered in 2 rows.
	 */
	setNumberOfButtonsPerLevel: function(align, number) {
		this.numberOfButtonsPerLevel[align] = number;
	},
	
	/**
	 * Returns the number of buttons to display on each level of the shape menu in the specified align group.
	 * Default value is 1
	 */
	getNumberOfButtonsPerLevel: function(align) {
		if(this.numberOfButtonsPerLevel[align])
			return Math.min(this.getButtons(align,0).length, this.numberOfButtonsPerLevel[align]);
		else
			return 1;
	}

}
ORYX.Plugins.ShapeMenu = Clazz.extend(ORYX.Plugins.ShapeMenu);

ORYX.Plugins.ShapeMenuButton = {
	
	/**
	 * Constructor
	 * @param option A key map specifying the configuration options:
	 * 					id: 	(String) The id of the parent DOM element for the new button
	 * 					icon: 	(String) The url to the icon of the button
	 * 					msg:	(String) A tooltip message
	 * 					caption:(String) The caption of the button (attention: button width > 22, only set for single column button layouts)
	 * 					align:	(String) The direction in which the button is aligned
	 * 					group: 	(Integer) The button group in the specified alignment 
	 * 							(buttons in the same group will be aligned side by side)
	 * 					callback:		(Function) A callback that is executed when the button is clicked
	 * 					dragcallback:	(Function) A callback that is executed when the button is dragged
	 * 					hovercallback:	(Function) A callback that is executed when the button is hovered
	 * 					resetcallback:	(Function) A callback that is executed when the button is reset
	 * 					arguments:		(Array) An argument array to pass to the callback functions
	 */
	construct: function(option) {

		if(option) {
			this.option = option;
			if(!this.option.arguments)
				this.option.arguments = [];
		} else {
			//TODO error
		}

		this.parentId = this.option.id ? this.option.id : null;

		// graft the button.
		var buttonClassName = this.option.caption ? "Oryx_button_with_caption" : "Oryx_button";
		this.node = ORYX.Editor.graft("http://www.w3.org/1999/xhtml", $(this.parentId),
			['div', {'class':buttonClassName}]);

		var imgOptions = {src:this.option.icon};
		if(this.option.msg){
			imgOptions.title = this.option.msg;
		}
		
		// graft and update icon (not in grafting for ns reasons).
		//TODO Enrich graft()-function to do this in one of the above steps.
		if(this.option.icon)
			ORYX.Editor.graft("http://www.w3.org/1999/xhtml", this.node,
				['img', imgOptions]);
		
		if(this.option.caption) {
			var captionNode = ORYX.Editor.graft("http://www.w3.org/1999/xhtml", this.node, ['span']);
			ORYX.Editor.graft("http://www.w3.org/1999/xhtml", captionNode, this.option.caption);
		}

		var onBubble = false;

		this.node.addEventListener(ORYX.CONFIG.EVENT_MOUSEOVER, this.hover.bind(this), onBubble);
		this.node.addEventListener(ORYX.CONFIG.EVENT_MOUSEOUT, this.reset.bind(this), onBubble);
		this.node.addEventListener(ORYX.CONFIG.EVENT_MOUSEDOWN, this.activate.bind(this), onBubble);
		this.node.addEventListener(ORYX.CONFIG.EVENT_MOUSEUP, this.hover.bind(this), onBubble);
		this.node.addEventListener('click', this.trigger.bind(this), onBubble);
		this.node.addEventListener(ORYX.CONFIG.EVENT_MOUSEMOVE, this.move.bind(this), onBubble);

		this.align = this.option.align ? this.option.align : ORYX.CONFIG.SHAPEMENU_RIGHT;
		this.group = this.option.group ? this.option.group : 0;

		this.hide();

		this.dragStart 	= false;
		this.isVisible 	= false;
		this.willShow 	= false;
		this.resetTimer;
	},
	
	hide: function() {
		this.node.style.display = "none";
		this.isVisible = false;
	},

	show: function() {
		this.node.style.display = "";
		this.node.style.opacity = this.opacity;
		this.isVisible = true;
	},
	
	showOpaque: function() {
		this.node.style.opacity = 1.0;
	},
	
	showTransparent: function() {
		this.node.style.opacity = this.opacity;
	},
	
	prepareToShow: function() {
		this.willShow = true;
	},

	prepareToHide: function() {
		this.willShow = false;
		this.hide();
	},

	setPosition: function(x, y) {
		this.node.style.left = x + "px";
		this.node.style.top = y + "px";
	},
	
	setLevel: function(level) {
		if(level==0) this.opacity = 0.5;
		else if(level==1) this.opacity = 0.2;
		//else if(level==2) this.opacity = 0.1;
		else this.opacity = 0.0;
	},
	
	setChildWidth: function(width) {
		this.childNode.style.width = width + "px";
	},

	reset: function(evt) {
		// Delete the timeout for hiding
		window.clearTimeout( this.resetTimer )
		this.resetTimer = window.setTimeout( this.doReset.bind(this), 100)
		
		if(this.option.resetcallback) {
			this.option.arguments.push(evt);
			var state = this.option.resetcallback.apply(this, this.option.arguments);
			this.option.arguments.remove(evt);
		}
	},
	
	doReset: function() {
		
		if(this.node.hasClassName('Oryx_down'))
			this.node.removeClassName('Oryx_down');

		if(this.node.hasClassName('Oryx_hover'))
			this.node.removeClassName('Oryx_hover');

	},

	activate: function(evt) {
		this.node.addClassName('Oryx_down');
		//Event.stop(evt);
		this.dragStart = true;
	},

	isHover: function() {
		return this.node.hasClassName('Oryx_hover') ? true: false;
	},

	hover: function(evt) {
		// Delete the timeout for hiding
		window.clearTimeout( this.resetTimer )
		this.resetTimer = null;
		
		this.node.addClassName('Oryx_hover');
		this.dragStart = false;
		
		if(this.option.hovercallback) {
			this.option.arguments.push(evt);
			var state = this.option.hovercallback.apply(this, this.option.arguments);
			this.option.arguments.remove(evt);
		}
	},

	move: function(evt) {
		if(this.dragStart && this.option.dragcallback) {
			this.option.arguments.push(evt);
			var state = this.option.dragcallback.apply(this, this.option.arguments);
			this.option.arguments.remove(evt);
		}
	},

	trigger: function(evt) {
		if(this.option.callback) {
			//Event.stop(evt);
			this.option.arguments.push(evt);
			var state = this.option.callback.apply(this, this.option.arguments);
			this.option.arguments.remove(evt);
		}
		this.dragStart = false;
	},

	toString: function() {
		return "HTML-Button " + this.id;
	}
}
ORYX.Plugins.ShapeMenuButton = Clazz.extend(ORYX.Plugins.ShapeMenuButton);

//create command for undo/redo
ORYX.Core.Commands["ShapeMenu.CreateCommand"] = ORYX.Core.AbstractCommand.extend({
    construct: function construct(option, currentReference, position, facade) {
        arguments.callee.$.construct.call(this, facade);
        this.connectedShape = option.connectedShape;
        this.connectingType = option.connectingType;
        this.namespace = option.namespace;
        this.type = option.type;
        this.containedStencil = option.containedStencil;
        this.parent = option.parent;
        this.currentReference = currentReference;
        this.position = position;
        this.shape;
        this.edge;
        this.targetRefPos;
        this.sourceRefPos;
        this.shapeOptions = option.shapeOptions;
        this.option = option;
    },
    
    getCommandData: function getCommandData() {
        var cmd = {
            "option": {
                "shapeOptions" : {
                    "id": this.shape["id"],
                    "resourceId": this.shape["resourceId"]
                },
                "type": this.type,
                "namespace": this.namespace,
                // connectingType is a stencil id
                "connectedShape": this.connectedShape.resourceId,
                "connectingType": this.connectingType,
                "parent": this.parent.resourceId
            }
        }

        if (typeof this.currentReference !== "undefined") {
            cmd["currentReference"] = this.currentReference["resourceId"];
        }

        if (typeof this.position !== "undefined") {
            cmd["position"] = this.position;
        }

        return cmd;
    },
    
    createFromCommandData: function createFromCommandData(facade, commandData) {
        var option = commandData["option"];
        var currentReference = undefined;
        var position = undefined;
        var stencilset = facade.getStencilSets()[option["namespace"]];
        
        option["parent"] = facade.getCanvas().getChildShapeOrCanvasByResourceId(option["parent"]);
        option["connectedShape"] = facade.getCanvas().getChildShapeByResourceId(option["connectedShape"]);
        option["containedStencil"] = stencilset.stencil(option["type"]);
        
        if (typeof commandData["currentReference"] !== "undefined") {
            currentReference = facade.getCanvas().getChildShapeOrCanvasByResourceId(commandData["currentReference"]);
        }
        
        if (typeof commandData["position"] !== "undefined") {
            position = commandData["position"];
            option["position"] = position;
        }
        
        return new ORYX.Core.Commands["ShapeMenu.CreateCommand"](option, currentReference, position, facade);
    },
    
    getCommandName: function getCommandName() {
        return "ShapeMenu.CreateCommand";
    },
    
    getDisplayName: function getDisplayName() {
        return "Shape created";
    },
    
    getAffectedShapes: function getAffectedShapes() {
        // this does not work before the shape is executed as it is a CreateCommand
        var shapes = [this.shape];
        if (this.shape instanceof ORYX.Core.Node) {
            if (this.edge instanceof ORYX.Core.Edge) {
                shapes.push(this.edge);
            } else if (this.shape.getIncomingShapes().first()) {
                shapes.push(this.shape.getIncomingShapes().first());
            }
        }
        return shapes;
    },
    
    execute: function execute() {
        var resume = false;
        if (typeof this.shape !== 'undefined') {
            if (this.shape instanceof ORYX.Core.Node) {
                this.parent.add(this.shape);
                if (typeof this.edge !== 'undefined') {
                    this.facade.getCanvas().add(this.edge);
                    this.edge.dockers.first().setDockedShape(this.connectedShape);
                    this.edge.dockers.first().bounds.centerMoveTo(this.connectedShape.absoluteBounds().center());
                    this.edge.dockers.first().setReferencePoint(this.sourceRefPos);
	                this.edge.dockers.first().update();	
		            this.edge.dockers.first().parent._update();
                    this.edge.dockers.last().bounds.centerMoveTo(this.shape.absoluteBounds().center());
                    this.edge.dockers.last().setDockedShape(this.shape);
                    this.edge.dockers.last().setReferencePoint(this.targetRefPos);
	                this.edge.dockers.last().update();	
		            this.edge._update();
                }
                if (this.isLocal()) {
                    this.facade.setSelection([this.shape]);
                }
            } else if (this.shape instanceof ORYX.Core.Edge) {
                this.facade.getCanvas().add(this.shape);
                this.shape.dockers.first().setDockedShape(this.connectedShape);
                this.shape.dockers.first().setReferencePoint(this.sourceRefPos);
	            this.shape.dockers.first().update();	
		        this.shape._update();
            }
            resume = true;
        } else {
            this.shape = this.facade.createShape(this.option);
            this.edge = (!(this.shape instanceof ORYX.Core.Edge)) ? this.shape.getIncomingShapes().first() : undefined;
        }
        
        if ((typeof this.currentReference !== 'undefined') && (typeof this.position !== 'undefined')) {
            if (this.shape instanceof ORYX.Core.Edge) {
                if (!(this.currentReference instanceof ORYX.Core.Canvas)) {
                    this.shape.dockers.last().setDockedShape(this.currentReference);
                    this.shape.dockers.last().setReferencePoint(this.currentReference.absoluteBounds().midPoint());
                }
                else {
                    this.shape.dockers.last().bounds.centerMoveTo(this.position);
                }
                this.sourceRefPos = this.shape.dockers.first().referencePoint;
                this.targetRefPos = this.shape.dockers.last().referencePoint;
                this.shape.dockers.last().update();	
	            this.shape.dockers.last().parent._update();
                
            } else if (typeof this.edge !== 'undefined'){
                this.sourceRefPos = this.edge.dockers.first().referencePoint;
                this.targetRefPos = this.edge.dockers.last().referencePoint;
            }
        } else if (typeof this.position !== 'undefined') {
            if (typeof this.shape.dockers.last() !== 'undefined') {
                this.shape.dockers.last().setDockedShape(this.currentReference);
            }
            this.shape.bounds.centerMoveTo(this.position);
            if (this.shape instanceof ORYX.Core.Node){
                (this.shape.dockers||[]).each(function(docker){
                    docker.bounds.centerMoveTo(this.position);
                }.bind(this));
            }
            if (typeof this.edge !== 'undefined'){
                this.edge.dockers.first().bounds.centerMoveTo(this.connectedShape.absoluteBounds().center());
                this.edge.dockers.first().setDockedShape(this.connectedShape);
	            this.edge.dockers.first().update();	
		        this.edge._update();

                this.edge.dockers.last().bounds.centerMoveTo(this.shape.absoluteBounds().center());
                this.edge.dockers.last().setDockedShape(this.shape);
	            this.edge.dockers.last().update();	
		        this.edge._update();

                if ((typeof this.sourceRefPos !== 'undefined') && (typeof this.targetRefPos !== 'undefined')) { 
                    this.edge.dockers.first().setReferencePoint(this.sourceRefPos);
                    this.edge.dockers.last().setReferencePoint(this.targetRefPos);
                } else {
                    this.sourceRefPos = this.edge.dockers.first().referencePoint;
                    this.targetRefPos = this.edge.dockers.last().referencePoint;
                }
            }
        } else {
            var containedStencil = this.containedStencil;
            var connectedShape = this.connectedShape;
            var bc = connectedShape.bounds;
            var bs = this.shape.bounds;
            
            var pos = bc.center();
            pos.y = this.connectedShape.bounds.center().y;
            // for some reason, uml complex classes fail to be positioned, although the center.y is copied it turns out to be 5 pixels to high
            if (this.containedStencil._jsonStencil.id === "http://b3mn.org/stencilset/UML2.2Class#ComplexClass") {
                pos.y = pos.y + 5;
            }
            if(containedStencil.defaultAlign()==="north") {
                pos.y -= (bc.height() / 2) + ORYX.CONFIG.SHAPEMENU_CREATE_OFFSET + (bs.height()/2);
            } else if(containedStencil.defaultAlign()==="northeast") {
                pos.x += (bc.width() / 2) + ORYX.CONFIG.SHAPEMENU_CREATE_OFFSET_CORNER + (bs.width()/2);
                pos.y -= (bc.height() / 2) + ORYX.CONFIG.SHAPEMENU_CREATE_OFFSET_CORNER + (bs.height()/2);
            } else if(containedStencil.defaultAlign()==="southeast") {
                pos.x += (bc.width() / 2) + ORYX.CONFIG.SHAPEMENU_CREATE_OFFSET_CORNER + (bs.width()/2);
                pos.y += (bc.height() / 2) + ORYX.CONFIG.SHAPEMENU_CREATE_OFFSET_CORNER + (bs.height()/2);
            } else if(containedStencil.defaultAlign()==="south") {
                pos.y += (bc.height() / 2) + ORYX.CONFIG.SHAPEMENU_CREATE_OFFSET + (bs.height()/2);
            } else if(containedStencil.defaultAlign()==="southwest") {
                pos.x -= (bc.width() / 2) + ORYX.CONFIG.SHAPEMENU_CREATE_OFFSET_CORNER + (bs.width()/2);
                pos.y += (bc.height() / 2) + ORYX.CONFIG.SHAPEMENU_CREATE_OFFSET_CORNER + (bs.height()/2);
            } else if(containedStencil.defaultAlign()==="west") {
                pos.x -= (bc.width() / 2) + ORYX.CONFIG.SHAPEMENU_CREATE_OFFSET + (bs.width()/2);
            } else if(containedStencil.defaultAlign()==="northwest") {
                pos.x -= (bc.width() / 2) + ORYX.CONFIG.SHAPEMENU_CREATE_OFFSET_CORNER + (bs.width()/2);
                pos.y -= (bc.height() / 2) + ORYX.CONFIG.SHAPEMENU_CREATE_OFFSET_CORNER + (bs.height()/2);
            } else {
                pos.x += (bc.width() / 2) + ORYX.CONFIG.SHAPEMENU_CREATE_OFFSET + (bs.width()/2);
            }
            
            // Move shape to the new position
            this.shape.bounds.centerMoveTo(pos);
            // Move all dockers of a node to the position
            if (this.shape instanceof ORYX.Core.Node){
                (this.shape.dockers||[]).each(function(docker){
                    docker.bounds.centerMoveTo(pos);
                })
            }
            
            //this.shape.update();
            this.position = pos;
            
            if (typeof this.edge !== 'undefined'){
                this.sourceRefPos = this.edge.dockers.first().referencePoint;
                this.targetRefPos = this.edge.dockers.last().referencePoint;
            }
        }
        
        this.facade.getCanvas().update();
        this.facade.updateSelection(this.isLocal());
        
            // Try to layout the edge that has been created
        /*if (!resume) {
            var event = {
                'type': ORYX.CONFIG.EVENT_LAYOUT
            };
            
            if (typeof this.edge !== 'undefined') {
                event.shapes = [this.edge];
            } else if (this.shape instanceof ORYX.Core.Edge) {
                event.shapes = [this.shape];
            }
            
            this.facade.raiseEvent(event);
        }*/

    },
    rollback: function rollback() {
        // If syncro tells us to revert a command, we have to pick necessary references ourselves.
        if (typeof this.shape === 'undefined') {
            this.shape = this.facade.getCanvas().getChildShapeByResourceId(this.shapeOptions.resourceId);
            // createShape() by convention creates the connecting edge with "<shape>_edge" as its resource id:
            this.edge = this.facade.getCanvas().getChildShapeByResourceId(this.shapeOptions.resourceId + "_edge");
            if (typeof this.shape === 'undefined' || typeof this.shape === 'ORYX.Core.Node' && typeof this.edge === 'undefined' ) {
                throw "Could not revert ShapeMenu.CreateCommand. this.shape or this.edge is undefined.";
            }
        }
        this.facade.deleteShape(this.shape);

        this.facade.raiseEvent(
            {
                "type": ORYX.CONFIG.EVENT_SHAPEDELETED, 
                "shape": this.shape
            }
        );
        var deletedShapes = [this.shape];
        var selectedShapes = this.facade.getSelection();
        var newSelectedShapes = selectedShapes.without(this.shape);

        if (typeof this.edge !== 'undefined') {
            this.facade.deleteShape(this.edge);
            this.facade.raiseEvent(
                {
                    "type": ORYX.CONFIG.EVENT_SHAPEDELETED, 
                    "shape": this.shape
                }
            );
            var newSelectedShapes = newSelectedShapes.without(this.edge);
            deletedShapes.push(this.edge);
        }
        this.facade.getCanvas().update();

        if (this.isLocal()) {
            this.facade.setSelection(newSelectedShapes);
        } else {
            var isDragging = this.facade.isDragging();
            if (!isDragging) {
                this.facade.setSelection(newSelectedShapes);
            } else {
                //raise event, which assures, that selection and canvas will be updated after dragging is finished
                this.facade.raiseEvent(
                    {
                        "type": ORYX.CONFIG.EVENT_SHAPESTODELETE, 
                        "deletedShapes": deletedShapes
                    }
                );
            }
        }

        this.facade.getCanvas().update();

        if (this.isLocal()) {
            this.facade.setSelection(newSelectedShapes);
        } else {
            var isDragging = this.facade.isDragging();
            if (!isDragging) {
                this.facade.setSelection(newSelectedShapes);
            } else {
                //raise event, which assures, that selection and canvas will be updated after dragging is finished
                this.facade.raiseEvent(
                    {
                        "type": ORYX.CONFIG.EVENT_SHAPESTODELETE, 
                        "deletedShapes": deletedShapes
                    }
                );
            }
        }
        this.facade.updateSelection(this.isLocal());
    }
});

ORYX.Core.Commands["ShapeMenu.MorphCommand"] = ORYX.Core.AbstractCommand.extend({
	construct: function(shape, stencil, facade){
        arguments.callee.$.construct.call(this, facade);
		this.shape = shape;
		this.stencil = stencil;
		this.facade = facade;
        this.newShape;
	},

    getCommandData: function getCommandData() {
        var cmd = {
            "option": {
                "shapeOptions" : {
                    "resourceId": this.shape["resourceId"]
                },
                "stencilId": this.stencil.id(),
                "stencilNamespace": this.stencil.namespace()
            }
        };
        return cmd;
    },

    createFromCommandData: function createFromCommandData(facade, commandData) {
        var option = commandData["option"];
        var shapeOptions = option.shapeOptions;
        var shape = facade.getCanvas().getChildShapeByResourceId(shapeOptions.resourceId);
        
        // Checking if the shape doesn't exist anymore (i.e. has been deleted remotely), then don't instantiate a conmmand.
        if (typeof shape === 'undefined') {
            return undefined;
        }

        var stencilSet = facade.getStencilSets()[option.stencilNamespace];
        var stencil = stencilSet.stencil(option.stencilId);
                
        return new ORYX.Core.Commands["ShapeMenu.MorphCommand"](shape, stencil, facade);
    },

    getCommandName: function getCommandName() {
        return "ShapeMenu.MorphCommand";
    },
    
    getDisplayName: function getDisplayName() {
        return "Shape morphed";
    },

    getAffectedShapes: function getAffectedShapes() {
        return [this.newShape];
    },

	execute: function(){
		
		var shape = this.shape;
		var stencil = this.stencil;
		var resourceId = shape.resourceId;
        var id = shape.id;
		
		// Serialize all attributes
		var serialized = shape.serialize();
		stencil.properties().each((function(prop) {
			if(prop.readonly()) {
				serialized = serialized.reject(function(serProp) {
					return serProp.name==prop.id();
				});
			}
		}).bind(this));

		// Get shape if already created, otherwise create a new shape
		if (this.newShape){
			newShape = this.newShape;
			this.facade.getCanvas().add(newShape);
		} else {
			newShape = this.facade.createShape({
							"type": stencil.id(),
							"namespace": stencil.namespace(),
							"resourceId": resourceId,
                            "shapeOptions": {
                                "resourceId": resourceId,
                                "id": id
                            }
						});
		}
		
		// calculate new bounds using old shape's upperLeft and new shape's width/height
		var boundsObj = serialized.find(function(serProp){
			return (serProp.prefix === "oryx" && serProp.name === "bounds");
		});
		
		var changedBounds = null;
		
		if(!this.facade.getRules().preserveBounds(shape.getStencil())) {
			
			var bounds = boundsObj.value.split(",");
			if (parseInt(bounds[0], 10) > parseInt(bounds[2], 10)) { // if lowerRight comes first, swap array items
				var tmp = bounds[0];
				bounds[0] = bounds[2];
				bounds[2] = tmp;
				tmp = bounds[1];
				bounds[1] = bounds[3];
				bounds[3] = tmp;
			}
			bounds[2] = parseInt(bounds[0], 10) + newShape.bounds.width();
			bounds[3] = parseInt(bounds[1], 10) + newShape.bounds.height();
			boundsObj.value = bounds.join(",");
			
		}  else {
			
			var height = shape.bounds.height();
			var width  = shape.bounds.width();
			
			// consider the minimum and maximum size of
			// the new shape
			
			if (newShape.minimumSize) {
				if (shape.bounds.height() < newShape.minimumSize.height) {
					height = newShape.minimumSize.height;
				}
				
				
				if (shape.bounds.width() < newShape.minimumSize.width) {
					width = newShape.minimumSize.width;
				}
			}
			
			if(newShape.maximumSize) {
				if(shape.bounds.height() > newShape.maximumSize.height) {
					height = newShape.maximumSize.height;
				}	
				
				if(shape.bounds.width() > newShape.maximumSize.width) {
					width = newShape.maximumSize.width;
				}
			}
			
			changedBounds = {
				a : {
					x: shape.bounds.a.x,
					y: shape.bounds.a.y
				},
				b : {
					x: shape.bounds.a.x + width,
					y: shape.bounds.a.y + height
				}						
			};
			
		}

		var oPos = shape.bounds.center();
		if(changedBounds !== null) {
			newShape.bounds.set(changedBounds);
		}
		
		// Set all related dockers
		this.setRelatedDockers(shape, newShape);
		
		// store DOM position of old shape
		var parentNode = shape.node.parentNode;
		var nextSibling = shape.node.nextSibling;
		
		// Delete the old shape
		this.facade.deleteShape(shape);
		
		// Deserialize the new shape - Set all attributes
		newShape.deserialize(serialized);		
		if(changedBounds !== null) {
			newShape.bounds.set(changedBounds);
		}
		

        // for some reason, uml complex classes fail to be positioned, although the center.y is copied it turns out to be 5 pixels to high
        if (stencil._jsonStencil.id === "http://b3mn.org/stencilset/UML2.2Class#ComplexClass") {
            oPos.y = oPos.y + 5;
        }

		if(newShape.getStencil().type()==="edge" || (newShape.dockers.length==0 || !newShape.dockers[0].getDockedShape())) {
			newShape.bounds.centerMoveTo(oPos);
		} 
		
		if(newShape.getStencil().type()==="node" && (newShape.dockers.length==0 || !newShape.dockers[0].getDockedShape())) {
			this.setRelatedDockers(newShape, newShape);
			
		}
		
		// place at the DOM position of the old shape
		if(nextSibling) parentNode.insertBefore(newShape.node, nextSibling);
		else parentNode.appendChild(newShape.node);
		
		// Set selection
        if (this.isLocal() ) {
	        this.facade.setSelection([newShape]);
        } else if (this.facade.getSelection().include(this.shape)) {
            this.facade.setSelection(this.facade.getSelection().without(shape).concat(newShape));
        }
		this.facade.getCanvas().update();
		this.facade.updateSelection(this.isLocal());
		this.newShape = newShape;
		
	},
	rollback: function(){
		
		if (!this.shape || !this.newShape || !this.newShape.parent) {return}
		
		// Append shape to the parent
		this.newShape.parent.add(this.shape);
		// Set dockers
		this.setRelatedDockers(this.newShape, this.shape);
		// Delete new shape
		this.facade.deleteShape(this.newShape);
		// Set selection
		if (this.isLocal()) {
            this.facade.setSelection([this.shape]);
        } else if (this.facade.getSelection().include(this.newShape)){
            this.facade.setSelection(this.facade.getSelection().without(this.newShape).concat(this.shape));
        }
		// Update
		this.facade.getCanvas().update();
		this.facade.updateSelection(this.isLocal());
	},
	
	/**
	 * Set all incoming and outgoing edges from the shape to the new shape
	 * @param {Shape} shape
	 * @param {Shape} newShape
	 */
	setRelatedDockers: function(shape, newShape){
		
		if(shape.getStencil().type()==="node") {
			
			(shape.incoming||[]).concat(shape.outgoing||[])
				.each(function(i) { 
					i.dockers.each(function(docker) {
						if (docker.getDockedShape() == shape) {
							var rPoint = Object.clone(docker.referencePoint);
							// Move reference point per percent

							var rPointNew = {
								x: rPoint.x*newShape.bounds.width()/shape.bounds.width(),
								y: rPoint.y*newShape.bounds.height()/shape.bounds.height()
							};

							docker.setDockedShape(newShape);
							// Set reference point and center to new position
							docker.setReferencePoint(rPointNew);
							if(i instanceof ORYX.Core.Edge) {
								docker.bounds.centerMoveTo(rPointNew);
							} else {
								var absXY = shape.absoluteXY();
								docker.bounds.centerMoveTo({x:rPointNew.x+absXY.x, y:rPointNew.y+absXY.y});
								//docker.bounds.moveBy({x:rPointNew.x-rPoint.x, y:rPointNew.y-rPoint.y});
							}
						}
					});	
				});
			
			// for attached events
			if(shape.dockers.length>0&&shape.dockers.first().getDockedShape()) {
				newShape.dockers.first().setDockedShape(shape.dockers.first().getDockedShape());
				newShape.dockers.first().setReferencePoint(Object.clone(shape.dockers.first().referencePoint));
			}
		
		} else { // is edge
			newShape.dockers.first().setDockedShape(shape.dockers.first().getDockedShape());
			newShape.dockers.first().setReferencePoint(shape.dockers.first().referencePoint);
			newShape.dockers.last().setDockedShape(shape.dockers.last().getDockedShape());
			newShape.dockers.last().setReferencePoint(shape.dockers.last().referencePoint);
		}
	}
});
/**
 * Copyright (c) 2009-2010
 * processWave.org (Michael Goderbauer, Markus Goetz, Marvin Killing, Martin
 * Kreichgauer, Martin Krueger, Christian Ress, Thomas Zimmermann)
 *
 * based on oryx-project.org (Martin Czuchra, Nicolas Peters, Daniel Polak,
 * Willi Tscheschner, Oliver Kopp, Philipp Giese, Sven Wagner-Boysen, Philipp Berger, Jan-Felix Schwarz)
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 **/

if(!ORYX.Plugins) {
	ORYX.Plugins = new Object();
}

ORYX.Plugins.AddDocker = Clazz.extend({

	/**
	 *	Constructor
	 *	@param {Object} Facade: The Facade of the Editor
	 */
	construct: function(facade) {
		this.facade = facade;

		this.facade.offer({
			'name':ORYX.I18N.AddDocker.add,
			'functionality': this.enableAddDocker.bind(this),
			'group': ORYX.I18N.AddDocker.group,
			'iconCls': 'pw-toolbar-button pw-toolbar-add-docker',
			'description': ORYX.I18N.AddDocker.addDesc,
			'index': 1,
            'toggle': true,
			'minShape': 0,
			'maxShape': 0,
            'visibleInViewMode': false
        });


		this.facade.offer({
			'name':ORYX.I18N.AddDocker.del,
			'functionality': this.enableDeleteDocker.bind(this),
			'group': ORYX.I18N.AddDocker.group,
			'iconCls': 'pw-toolbar-button pw-toolbar-remove-docker',
			'description': ORYX.I18N.AddDocker.delDesc,
			'index': 2,
            'toggle': true,
			'minShape': 0,
			'maxShape': 0,
            'visibleInViewMode': false
        });
		
		this.facade.registerOnEvent(ORYX.CONFIG.EVENT_MOUSEDOWN, this.handleMouseDown.bind(this));
	},
	
	enableAddDocker: function(button, pressed) {
        //FIXME This should be done while construct, but this isn't possible right now!
        this.addDockerButton = button;
        
        if (pressed) {
            this.facade.raiseEvent({
                'type': ORYX.CONFIG.EVENT_DISPLAY_SCHLAUMEIER,
                'message': "Try Alt+Click on an edge to add docker."
            });
            this.facade.raiseEvent({
                'type': ORYX.CONFIG.EVENT_DISABLE_DOCKER_CREATION
            });
        } else if (!(this.enabledDelete())){
            // AddDocker button was deselected, so allow for docker creation with ALT+click again.
            this.facade.raiseEvent({
                'type': ORYX.CONFIG.EVENT_ENABLE_DOCKER_CREATION
            });
        }
        // Unpress deleteDockerButton
        if(pressed && this.deleteDockerButton)
            this.deleteDockerButton.toggle(false);
	},
    enableDeleteDocker: function(button, pressed) {
        //FIXME This should be done while construct, but this isn't possible right now!
        this.deleteDockerButton = button;
        
        if (pressed) {
            this.facade.raiseEvent({
                'type': ORYX.CONFIG.EVENT_DISPLAY_SCHLAUMEIER,
                'message': "Try Alt+Click on a docker to remove it."
            });
            this.facade.raiseEvent({
                'type': ORYX.CONFIG.EVENT_DISABLE_DOCKER_CREATION
            });
        }
        
        // Unpress addDockerButton
        if(pressed && this.addDockerButton) {        
            this.addDockerButton.toggle(false);
        } else if (!pressed && !(this.enabledAdd())) {
            // if the deletebutton has been unpressed and the addbutton is not enabled, docker creation should be possible
            this.facade.raiseEvent({
                'type': ORYX.CONFIG.EVENT_ENABLE_DOCKER_CREATION
            });
        }
            
    },
    
    enabledAdd: function(){
        return this.addDockerButton ? this.addDockerButton.pressed : false;
    },
    enabledDelete: function(){
        return this.deleteDockerButton ? this.deleteDockerButton.pressed : false;
    },
	
	/**
	 * MouseDown Handler
	 *
	 */	
	handleMouseDown: function(event, uiObj) {
		if (this.enabledAdd() && uiObj instanceof ORYX.Core.Edge) {
            this.newDockerCommand({
                edge: uiObj,
                position: this.facade.eventCoordinates(event)
            });
		} else if (this.enabledDelete() &&	uiObj instanceof ORYX.Core.Controls.Docker && uiObj.parent instanceof ORYX.Core.Edge) {
            //check if uiObj is not the first or last docker of its parent, if not so instanciate deleteCommand
            if ((uiObj.parent.dockers.first() !== uiObj) && (uiObj.parent.dockers.last() !== uiObj)) {
                this.newDockerCommand({
                    edge: uiObj.parent,
                    docker: uiObj
                });
            }
		} else if ( this.enabledAdd() ){
            this.addDockerButton.toggle(false);
        } else if ( this.enabledDelete() ) {
            this.deleteDockerButton.toggle(false);
        }
	},
    
    // Options: edge (required), position (required if add), docker (required if delete)
    newDockerCommand: function newDockerCommand(options){
        if(!options.edge)
            return;        
        var args = {
        "options": options
        }
        var command = new ORYX.Core.Commands["DockerCreation.NewDockerCommand"](this.enabledAdd(), this.enabledDelete(), options.edge, options.docker, options.position, this.facade, args);
        this.facade.executeCommands([command]);
    }
});

/**
 * Copyright (c) 2009-2010
 * processWave.org (Michael Goderbauer, Markus Goetz, Marvin Killing, Martin
 * Kreichgauer, Martin Krueger, Christian Ress, Thomas Zimmermann)
 *
 * based on oryx-project.org (Martin Czuchra, Nicolas Peters, Daniel Polak,
 * Willi Tscheschner, Oliver Kopp, Philipp Giese, Sven Wagner-Boysen, Philipp Berger, Jan-Felix Schwarz)
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 **/

if (!ORYX.Plugins) {
    ORYX.Plugins = new Object();
}

ORYX.Core.Commands["ShapeRepository.DropCommand"] = ORYX.Core.AbstractCommand.extend({
    construct: function construct(option, currentParent, canAttach, position, facade) {
        // call construct method of parent
        arguments.callee.$.construct.call(this, facade);
        
        this.option = option;
        this.currentParent = currentParent;
        this.canAttach = canAttach;
        this.position = position;
        this.selection = this.facade.getSelection();
        this.shape;
        this.parent;
    },
    
    getAffectedShapes: function getAffectedShapes() {
        if (typeof this.shape !== "undefined") {
            return [this.shape];
        }
        return [];
    },
    
    getCommandName: function getCommandName() {
        return "ShapeRepository.DropCommand";
    },
    
    getDisplayName: function getDisplayName() {
        return "Shape created";
    },
    
    getCommandData: function getCommandData() {
        var commandData = {
            id : this.shape.id,
            resourceId : this.shape.resourceId,
            parent : this.parent.resourceId,
            currentParent : this.currentParent.resourceId,
            position: this.position,
            optionsPosition : this.option.position,
            namespace : this.option.namespace,
            type : this.option.type,
            canAttach : this.canAttach
        };
        
        return commandData;
    },
    
    createFromCommandData: function createFromCommandData(facade, commandData) {
        var currentParent = facade.getCanvas().getChildShapeOrCanvasByResourceId(commandData.currentParent);
        var parent = facade.getCanvas().getChildShapeOrCanvasByResourceId(commandData.parent);
        
        // Checking if the shape we drop the new shape into still exists.
        if (typeof parent === 'undefined' || typeof currentParent === 'undefined' ) {
            return undefined;
        }
        
        var options = {
            'shapeOptions': {
                'id': commandData.id,
                'resourceId': commandData.resourceId
            },
            'position': commandData.optionsPosition,
            'namespace': commandData.namespace,
            'type': commandData.type
        };
        options.parent = parent;
        
        return new ORYX.Core.Commands["ShapeRepository.DropCommand"](options, currentParent, commandData.canAttach, commandData.position, facade);
    },
    
    execute: function execute() {
        if (!this.shape) {
            this.shape      = this.facade.createShape(this.option);
            this.parent = this.shape.parent;
        } else {
            this.parent.add(this.shape);
        }
        
        if (this.canAttach && this.currentParent instanceof ORYX.Core.Node && this.shape.dockers.length > 0) {
            var docker = this.shape.dockers[0];

            if (this.currentParent.parent instanceof ORYX.Core.Node) {
                this.currentParent.parent.add( docker.parent );
            }
            var relativePosition = this.facade.getCanvas().node.ownerSVGElement.createSVGPoint();
            relativePosition.x = (this.currentParent.absoluteBounds().lowerRight().x - this.position.x) / this.currentParent.bounds.width();
            relativePosition.y = (this.currentParent.absoluteBounds().lowerRight().y - this.position.y) / this.currentParent.bounds.height();

            var absolutePosition;
            if (typeof this.currentParent !== "undefined") {
                absolutePosition = this.facade.getCanvas().node.ownerSVGElement.createSVGPoint();
                if ((0 > relativePosition.x) || (relativePosition.x > 1) || (0 > relativePosition.y) || (relativePosition.y > 1)) {
                    relativePosition.x = 0;
                    relativePosition.y = 0;
                } 
                absolutePosition.x = Math.abs(this.currentParent.absoluteBounds().lowerRight().x - relativePosition.x * this.currentParent.bounds.width());
                absolutePosition.y = Math.abs(this.currentParent.absoluteBounds().lowerRight().y - relativePosition.y * this.currentParent.bounds.height());
            } else {
                absolutePosition = relativePosition;
            }

            docker.bounds.centerMoveTo(absolutePosition);
            docker.setDockedShape( this.currentParent );
        }

        this.facade.getCanvas().update();
        this.facade.updateSelection(this.isLocal());
    },

    rollback: function rollback() {
        // If syncro tells us to revert a command, we have to pick necessary references ourselves.
        if (typeof this.shape === 'undefined') {
            this.shape = this.facade.getCanvas().getChildShapeByResourceId(this.option.shapeOptions.resourceId);
            if (typeof this.shape === 'undefined') {
                throw "Could not revert Shaperepository.DropCommand. this.shape is undefined.";
            }
        }
        this.facade.deleteShape(this.shape);
        this.facade.raiseEvent(
            {
                "type": ORYX.CONFIG.EVENT_SHAPEDELETED, 
                "shape": this.shape
            }
        );
        var selectedShapes = this.facade.getSelection();
        var newSelectedShapes = selectedShapes.without(this.shape);
        this.facade.getCanvas().update();
        if (this.isLocal()) {
            this.facade.setSelection(newSelectedShapes);
        } else {
            var isDragging = this.facade.isDragging();
            if (!isDragging) {
                this.facade.setSelection(newSelectedShapes);
            } else {
                //raise event, which assures, that selection and canvas will be updated after dragging is finished
                this.facade.raiseEvent(
                    {
                        "type": ORYX.CONFIG.EVENT_SHAPESTODELETE, 
                        "deletedShapes": [this.shape]
                    }
                );
            }
        }
        this.facade.updateSelection(this.isLocal());
    }
});

ORYX.Plugins.NewShapeRepository = {
    construct: function(facade) {
        arguments.callee.$.construct.call(this, facade); // super()
    
        this.facade = facade;
        this._currentParent;
        this._canContain = undefined;
        this._canAttach  = undefined;

        this.canvasContainer = $$(".ORYX_Editor")[0].parentNode;
        this.shapeList = document.createElement('div');
        this.shapeList.id = 'pwave-repository';
        this.canvasContainer.appendChild(this.shapeList);
        this.groupStencils = [];
        
        // Create a Drag-Zone for Drag'n'Drop
        var dragZone = new Ext.dd.DragZone(this.shapeList, {shadow: !Ext.isMac, hasOuterHandles: true});
        dragZone.onDrag = function() { this.groupStencils.each(this._hideGroupStencil); }.bind(this);
        dragZone.afterDragDrop = this.drop.bind(this, dragZone);
        dragZone.beforeDragOver = this.beforeDragOver.bind(this, dragZone);
        dragZone.beforeDragEnter = function() { this._lastOverElement = false; return true; }.bind(this);
        
        // Load all Stencilssets
        this.setStencilSets();
        
        this.hoverTimeout = undefined;

        this.timesHidden = 0;
        
        this.facade.registerOnEvent(ORYX.CONFIG.EVENT_STENCIL_SET_LOADED, this.setStencilSets.bind(this));
        this.facade.registerOnEvent(ORYX.CONFIG.EVENT_MODE_CHANGED, this._handleModeChanged.bind(this));
    },
    
    _handleModeChanged: function _handleModeChanged(event) {
        this._setVisibility(event.mode.isEditMode()  && !event.mode.isPaintMode());
    },
    
    getVisibleCanvasHeight: function getVisibleCanvasHeight() {
        var canvasContainer = $$(".ORYX_Editor")[0].parentNode;
        return canvasContainer.offsetHeight;
    },
    
    /**
     * Load all stencilsets in the shaperepository
     */
    setStencilSets: function() {
        // Remove all childs
        var child = this.shapeList.firstChild;
        while(child) {
            this.shapeList.removeChild(child);
            child = this.shapeList.firstChild;
        }

        // Go thru all Stencilsets and stencils
        this.facade.getStencilSets().values().each((function(sset) {
            
            var typeTitle = sset.title();
            var extensions = sset.extensions();
            if (extensions && extensions.size() > 0) {
                typeTitle += " / " + ORYX.Core.StencilSet.getTranslation(extensions.values()[0], "title");
            } 
            
            // For each Stencilset create and add a new Tree-Node
            var stencilSetNode = document.createElement('div');
            this.shapeList.appendChild(stencilSetNode);
            
            // Get Stencils from Stencilset
            var stencils = sset.stencils(this.facade.getCanvas().getStencil(),
                                         this.facade.getRules());   
            var treeGroups = new Hash();
            
            // Sort the stencils according to their position and add them to the repository
            stencils = stencils.sortBy(function(value) { return value.position(); } );
            stencils.each((function(stencil) {
                var groups = stencil.groups();
                groups.each((function(group) {                  
                    var firstInGroup = !treeGroups[group];
                    var groupStencil = undefined;
                    if(firstInGroup) {
                        // add large shape icon to shape repository
                        groupStencil = this.createGroupStencilNode(stencilSetNode, stencil, group);
                        // Create a new group
                        var groupElement = this.createGroupElement(groupStencil, group);
                        treeGroups[group] = groupElement;
                        this.addGroupStencilHoverListener(groupStencil);
                        this.groupStencils.push(groupStencil);
                    }
                    
                    // Create the Stencil-Tree-Node
                    var stencilTreeNode = this.createStencilTreeNode(treeGroups[group], stencil);
                    var handles = [];
                    for (var i = 0; i < stencilTreeNode.childNodes.length; i++) {
                        handles.push(stencilTreeNode.childNodes[i]);
                    }
                    if (firstInGroup) {
                        handles.push(groupStencil.firstChild);
                    }
                    // Register the Stencil on Drag and Drop
                    Ext.dd.Registry.register(stencilTreeNode, {
                        'handles': handles, // Set the Handles
                        'isHandle': true,
                        'type': stencil.id(),           // Set Type of stencil 
                        namespace: stencil.namespace()      // Set Namespace of stencil
                    });
                    
                }).bind(this));
            }).bind(this));
        }).bind(this));
    },
    
    addGroupStencilHoverListener: function addGroupStencilHoverListener(groupStencil) {
        var timer = {};
        
        var hideGroupElement = function hideGroupElement(event) {
            // Hide the extended groupElement if the mouse is not moving to the groupElement
            clearTimeout(timer);
            this._hideGroupStencil(groupStencil);
        }.bind(this);
        
        var handleMouseOver = function handleMouseOver(event) {
            var showGroupElement = function showGroupElement() {
                var groupElement = jQuery(groupStencil).children(".new-repository-group");
                var groupLeftBar = jQuery(groupElement).children(".new-repository-group-left-bar");
                var groupHeader = jQuery(groupElement).children(".new-repository-group-header");
                var stencilBoundingRect = groupStencil.getBoundingClientRect();
                groupElement.css('top', stencilBoundingRect.top + 'px');
                groupElement.css('left', stencilBoundingRect.right - 1 + 'px');
                groupElement.addClass('new-repository-group-visible');
                // Position the groupElement so its lower bound is not lower than 460px
                var groupBoundingRect = groupHeader[0].getBoundingClientRect();
                var lowestPosition = 530;
                if (groupBoundingRect.bottom > lowestPosition) {
                    var invisibleOffset = groupBoundingRect.bottom - lowestPosition;
                    groupElement.css('top', groupBoundingRect.top - invisibleOffset + 'px');
                    groupLeftBar.css('height', stencilBoundingRect.bottom + 1 - groupElement.position().top + 'px'); // +1 for border
                }
            };
            timer = setTimeout(showGroupElement, 500);
        };
        
        jQuery(groupStencil).bind('mouseenter', handleMouseOver);
        jQuery(groupStencil).bind('mouseleave', hideGroupElement);
    },

    createGroupStencilNode: function createGroupStencilNode(parentTreeNode, stencil, groupname) {
        // Create and add the Stencil to the Group
        var newElement = document.createElement('div');
        newElement.className = 'new-repository-group-stencil';
        var stencilImage = document.createElement('div');
        stencilImage.className = 'new-repository-group-stencil-bg';
        stencilImage.style.backgroundImage = 'url(' + stencil.bigIcon() + ')';
        newElement.appendChild(stencilImage);
        parentTreeNode.appendChild(newElement);
        return newElement;
    },

    createStencilTreeNode: function createStencilTreeNode(parentTreeNode, stencil) {
        // Create and add the Stencil to the Group
        var newRow = jQuery('<div class="new-repository-group-row"></div>');
        newRow.append('<div class="new-repository-group-row-lefthighlight"></div>');
        var entry = jQuery('<div class="new-repository-group-row-entry"></div>');
        // entry.attr("title", stencil.description()); no tooltips
        var icon = jQuery('<img></img>');
        icon.attr('src', stencil.icon());
        entry.append(icon);
        entry.append(stencil.title());
        newRow.append(entry);
        newRow.append('<div class="new-repository-group-row-righthighlight"></div>');
        jQuery(parentTreeNode).find(".new-repository-group-entries:first").append(newRow);
        return entry[0];
    },
    
    createGroupElement: function createGroupElement(groupStencilNode, group) {
        // Create the div that appears on the right side of the shape repository containing additional shapes of the group.
        var groupElement = jQuery("<div class='new-repository-group'>" +
                // left bar
                "<div class='new-repository-group-left-bar'>" +
                    "<div class='new-repository-group-left-bar-bottom-gradient'></div>" +
                    "<div class='new-repository-group-left-bar-bottom-highlight'></div>" +
                "</div>" +
                // header
                "<div class='new-repository-group-header'>" +
                    "<div style='position: relative; width: 100%'>" +
                        "<div class='new-repository-group-header-left-highlight'></div>" +
                        "<div class='new-repository-group-header-label'></div>" +
                        "<div class='new-repository-group-header-right-highlight'></div>" +
                        "<div class='new-repository-group-content'>" +
                            "<div class='new-repository-group-entries'></div>" +
                        "</div>" +
                    "</div>" +
                "</div>" +
            "</div>"
        );
        groupElement.find(".new-repository-group-header-label").text(group);
        // Add the Group to the ShapeRepository
        jQuery(groupStencilNode).append(groupElement);
        return groupElement[0];
    },
    
    _hideGroupStencil: function _hideGroupStencil(groupStencil) {
        var groupElement = jQuery(groupStencil).children(".new-repository-group:first");
        groupElement.removeClass('new-repository-group-visible');
    },
    
    drop: function(dragZone, target, event) {
        this._lastOverElement = undefined;
        
        // Hide the highlighting
        this.facade.raiseEvent({type: ORYX.CONFIG.EVENT_HIGHLIGHT_HIDE, highlightId:'shapeRepo.added'});
        this.facade.raiseEvent({type: ORYX.CONFIG.EVENT_HIGHLIGHT_HIDE, highlightId:'shapeRepo.attached'});
        
        // Check if drop is allowed
        var proxy = dragZone.getProxy();
        if(proxy.dropStatus == proxy.dropNotAllowed) { return; }
        
        // Check if there is a current Parent
        if(!this._currentParent) { return; }
        
        var option = Ext.dd.Registry.getHandle(target.DDM.currentTarget);
        
        // Make sure, that the shapeOptions of the last DropCommand are not reused.
        option.shapeOptions = undefined;
        
        var xy = event.getXY();
        var pos = {x: xy[0], y: xy[1]};

        var a = this.facade.getCanvas().node.getScreenCTM();

        // Correcting the UpperLeft-Offset
        pos.x -= a.e; pos.y -= a.f;
        // Correcting the Zoom-Faktor
        pos.x /= a.a; pos.y /= a.d;
        // Correting the ScrollOffset
        pos.x -= document.documentElement.scrollLeft;
        pos.y -= document.documentElement.scrollTop;
        // Correct position of parent
        var parentAbs = this._currentParent.absoluteXY();
        pos.x -= parentAbs.x;
        pos.y -= parentAbs.y;

        // Set position
        option['position'] = pos;
        
        // Set parent
        if( this._canAttach &&  this._currentParent instanceof ORYX.Core.Node ){
            option['parent'] = undefined;   
        } else {
            option['parent'] = this._currentParent;
        }
        
        var position = this.facade.eventCoordinates( event.browserEvent );
        var command = new ORYX.Core.Commands["ShapeRepository.DropCommand"](option, this._currentParent, this._canAttach, position, this.facade);
        this.facade.executeCommands([command]);
        this._currentParent = undefined;
    },

    beforeDragOver: function(dragZone, target, event){
        var pr;
        var coord = this.facade.eventCoordinates(event.browserEvent);
        var aShapes = this.facade.getCanvas().getAbstractShapesAtPosition( coord );

        if(aShapes.length <= 0) {
            pr = dragZone.getProxy();
            pr.setStatus(pr.dropNotAllowed);
            pr.sync();
            return false;
        }
        
        var el = aShapes.last();
        
        if(aShapes.lenght == 1 && aShapes[0] instanceof ORYX.Core.Canvas) {            
            return false;
        } else {
            // check containment rules
            var option = Ext.dd.Registry.getHandle(target.DDM.currentTarget);
            var stencilSet = this.facade.getStencilSets()[option.namespace];
            var stencil = stencilSet.stencil(option.type);

            if(stencil.type() === "node") {                
                var parentCandidate = aShapes.reverse().find(function(candidate) {
                    return (candidate instanceof ORYX.Core.Canvas 
                            || candidate instanceof ORYX.Core.Node
                            || candidate instanceof ORYX.Core.Edge);
                });
                
                if (parentCandidate !== this._lastOverElement) {
                    this._canAttach  = undefined;
                    this._canContain = undefined;
                }
                
                if( parentCandidate ) {
                    //check containment rule
                    if (!(parentCandidate instanceof ORYX.Core.Canvas) && parentCandidate.isPointOverOffset(coord.x, coord.y) && this._canAttach == undefined) {
                    
                        this._canAttach = this.facade.getRules().canConnect({
                                                sourceShape: parentCandidate,
                                                edgeStencil: stencil,
                                                targetStencil: stencil
                                            });
                        
                        if( this._canAttach ){
                            // Show Highlight
                            this.facade.raiseEvent({
                                type: ORYX.CONFIG.EVENT_HIGHLIGHT_SHOW,
                                highlightId: "shapeRepo.attached",
                                elements: [parentCandidate],
                                style: ORYX.CONFIG.SELECTION_HIGHLIGHT_STYLE_RECTANGLE,
                                color: ORYX.CONFIG.SELECTION_VALID_COLOR
                            });
                            
                            this.facade.raiseEvent({
                                type: ORYX.CONFIG.EVENT_HIGHLIGHT_HIDE,
                                highlightId: "shapeRepo.added"
                            });
                            
                            this._canContain    = undefined;
                        }                   
                        
                    }
                    
                    if(!(parentCandidate instanceof ORYX.Core.Canvas) && !parentCandidate.isPointOverOffset(coord.x, coord.y)){
                        this._canAttach     = this._canAttach == false ? this._canAttach : undefined;                       
                    }
                    
                    if( this._canContain == undefined && !this._canAttach) {                                            
                        this._canContain = this.facade.getRules().canContain({
                                                            containingShape:parentCandidate, 
                                                            containedStencil:stencil
                                                            });
                        
                        // Show Highlight
                        this.facade.raiseEvent({
                                                type:       ORYX.CONFIG.EVENT_HIGHLIGHT_SHOW, 
                                                highlightId:'shapeRepo.added',
                                                elements:   [parentCandidate],
                                                color:      this._canContain ? ORYX.CONFIG.SELECTION_VALID_COLOR : ORYX.CONFIG.SELECTION_INVALID_COLOR
                                              });
                        this.facade.raiseEvent({
                                                type:       ORYX.CONFIG.EVENT_HIGHLIGHT_HIDE,
                                                highlightId:"shapeRepo.attached"
                                              });
                    }
                    
                    this._currentParent = this._canContain || this._canAttach ? parentCandidate : undefined;
                    this._lastOverElement = parentCandidate;
                    pr = dragZone.getProxy();
                    pr.setStatus(this._currentParent ? pr.dropAllowed : pr.dropNotAllowed );
                    pr.sync();
                }
            } else { //Edge
                this._currentParent = this.facade.getCanvas();
                pr = dragZone.getProxy();
                pr.setStatus(pr.dropAllowed);
                pr.sync();
            }
        }
        
        return false;
    },
    
    _setVisibility: function _setVisibility(show) {
        if (show) {
            this.shapeList.show();
        } else {
            this.shapeList.hide();
        }
    }
};

ORYX.Plugins.NewShapeRepository = Clazz.extend(ORYX.Plugins.NewShapeRepository);
/**
 * Copyright (c) 2009-2010
 * processWave.org (Michael Goderbauer, Markus Goetz, Marvin Killing, Martin
 * Kreichgauer, Martin Krueger, Christian Ress, Thomas Zimmermann)
 *
 * based on oryx-project.org (Martin Czuchra, Nicolas Peters, Daniel Polak,
 * Willi Tscheschner, Oliver Kopp, Philipp Giese, Sven Wagner-Boysen, Philipp Berger, Jan-Felix Schwarz)
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 **/

if(!ORYX.Plugins)
	ORYX.Plugins = new Object(); 

ORYX.Plugins.ShapeHighlighting = Clazz.extend({

	construct: function(facade) {
		
		this.parentNode = facade.getCanvas().getSvgContainer();
		
		// The parent Node
		this.node = ORYX.Editor.graft("http://www.w3.org/2000/svg", this.parentNode,
					['g']);

		this.highlightNodes = {};
		
		facade.registerOnEvent(ORYX.CONFIG.EVENT_HIGHLIGHT_SHOW, this.setHighlight.bind(this));
		facade.registerOnEvent(ORYX.CONFIG.EVENT_HIGHLIGHT_HIDE, this.hideHighlight.bind(this));		

	},

	setHighlight: function(options) {
		if(options && options.highlightId){
			var node = this.highlightNodes[options.highlightId];
			
			if(!node){
				node= ORYX.Editor.graft("http://www.w3.org/2000/svg", this.node,
					['path', {
						"stroke-width": 2.0, "fill":"none"
						}]);	
			
				this.highlightNodes[options.highlightId] = node;
			}

			if(options.elements && options.elements.length > 0) {
				
				this.setAttributesByStyle( node, options );
				this.show(node);
			
			} else {
			
				this.hide(node);			
			
			}
			
		}
	},
	
	hideHighlight: function(options) {
		if(options && options.highlightId && this.highlightNodes[options.highlightId]){
			this.hide(this.highlightNodes[options.highlightId]);
		}		
	},
	
	hide: function(node) {
		node.setAttributeNS(null, 'display', 'none');
	},

	show: function(node) {
		node.setAttributeNS(null, 'display', '');
	},
	
	setAttributesByStyle: function( node, options ){
		
		// If the style say, that it should look like a rectangle
		if( options.style && options.style == ORYX.CONFIG.SELECTION_HIGHLIGHT_STYLE_RECTANGLE ){
			
			// Set like this
			var bo = options.elements[0].absoluteBounds();
			
			var strWidth = options.strokewidth ? options.strokewidth 	: ORYX.CONFIG.BORDER_OFFSET
			
			node.setAttributeNS(null, "d", this.getPathRectangle( bo.a, bo.b , strWidth ) );
			node.setAttributeNS(null, "stroke", 		options.color 		? options.color 		: ORYX.CONFIG.SELECTION_HIGHLIGHT_COLOR);
			node.setAttributeNS(null, "stroke-opacity", options.opacity 	? options.opacity 		: 0.2);
			node.setAttributeNS(null, "stroke-width", 	strWidth);
						
		} else if(options.elements.length == 1 
					&& options.elements[0] instanceof ORYX.Core.Edge &&
					options.highlightId != "selection") {
			
			/* Highlight containment of edge's childs */
			node.setAttributeNS(null, "d", this.getPathEdge(options.elements[0].dockers));
			node.setAttributeNS(null, "stroke", options.color ? options.color : ORYX.CONFIG.SELECTION_HIGHLIGHT_COLOR);
			node.setAttributeNS(null, "stroke-opacity", options.opacity ? options.opacity : 0.2);
			node.setAttributeNS(null, "stroke-width", 	ORYX.CONFIG.OFFSET_EDGE_BOUNDS);
			
		}else {
			// If not, set just the corners
			node.setAttributeNS(null, "d", this.getPathByElements(options.elements));
			node.setAttributeNS(null, "stroke", options.color ? options.color : ORYX.CONFIG.SELECTION_HIGHLIGHT_COLOR);
			node.setAttributeNS(null, "stroke-opacity", options.opacity ? options.opacity : 1.0);
			node.setAttributeNS(null, "stroke-width", 	options.strokewidth ? options.strokewidth 	: 2.0);
						
		}
	},
	
	getPathByElements: function(elements){
		if(!elements || elements.length <= 0) {return undefined}
		
		// Get the padding and the size
		var padding = ORYX.CONFIG.SELECTED_AREA_PADDING;
		
		var path = ""
		
		// Get thru all Elements
		elements.each((function(element) {
			if(!element) {return}
			// Get the absolute Bounds and the two Points
			var bounds = element.absoluteBounds();
			bounds.widen(padding)
			var a = bounds.upperLeft();
			var b = bounds.lowerRight();
			
			path = path + this.getPath(a ,b);
												
		}).bind(this));

		return path;
		
	},

	getPath: function(a, b){
				
		return this.getPathCorners(a, b);
	
	},
			
	getPathCorners: function(a, b){

		var size = ORYX.CONFIG.SELECTION_HIGHLIGHT_SIZE;
				
		var path = ""

		// Set: Upper left 
		path = path + "M" + a.x + " " + (a.y + size) + " l0 -" + size + " l" + size + " 0 ";
		// Set: Lower left
		path = path + "M" + a.x + " " + (b.y - size) + " l0 " + size + " l" + size + " 0 ";
		// Set: Lower right
		path = path + "M" + b.x + " " + (b.y - size) + " l0 " + size + " l-" + size + " 0 ";
		// Set: Upper right
		path = path + "M" + b.x + " " + (a.y + size) + " l0 -" + size + " l-" + size + " 0 ";
		
		return path;
	},
	
	getPathRectangle: function(a, b, strokeWidth){

		var size = ORYX.CONFIG.SELECTION_HIGHLIGHT_SIZE;

		var path 	= ""
		var offset 	= strokeWidth / 2.0;
		 
		// Set: Upper left 
		path = path + "M" + (a.x + offset) + " " + (a.y);
		path = path + " L" + (a.x + offset) + " " + (b.y - offset);
		path = path + " L" + (b.x - offset) + " " + (b.y - offset);
		path = path + " L" + (b.x - offset) + " " + (a.y + offset);
		path = path + " L" + (a.x + offset) + " " + (a.y + offset);

		return path;
	},
	
	getPathEdge: function(edgeDockers) {
		var length = edgeDockers.length;
		var path = "M" + edgeDockers[0].bounds.center().x + " " 
					+  edgeDockers[0].bounds.center().y;
		
		for(i=1; i<length; i++) {
			var dockerPoint = edgeDockers[i].bounds.center();
			path = path + " L" + dockerPoint.x + " " +  dockerPoint.y;
		}
		
		return path;
	}
	
});

 
ORYX.Plugins.HighlightingSelectedShapes = Clazz.extend({

	construct: function(facade) {
		this.facade = facade;
		this.opacityFull = 0.9;
		this.opacityLow = 0.4;

		// Register on Dragging-Events for show/hide of ShapeMenu
		//this.facade.registerOnEvent(ORYX.CONFIG.EVENT_DRAGDROP_START, this.hide.bind(this));
		//this.facade.registerOnEvent(ORYX.CONFIG.EVENT_DRAGDROP_END,  this.show.bind(this));		
        this.facade.registerOnEvent(ORYX.CONFIG.EVENT_CANVAS_RESIZE_UPDATE_HIGHLIGHTS, this.onSelectionChanged.bind(this));
	},

	/**
	 * On the Selection-Changed
	 *
	 */
	onSelectionChanged: function(event) {
		if(event.elements && event.elements.length > 1) {
			this.facade.raiseEvent({
										type:		ORYX.CONFIG.EVENT_HIGHLIGHT_SHOW, 
										highlightId:'selection',
										elements:	event.elements.without(event.subSelection),
										color:		ORYX.CONFIG.SELECTION_HIGHLIGHT_COLOR,
										opacity: 	!event.subSelection ? this.opacityFull : this.opacityLow
									});

			if(event.subSelection){
				this.facade.raiseEvent({
											type:		ORYX.CONFIG.EVENT_HIGHLIGHT_SHOW, 
											highlightId:'subselection',
											elements:	[event.subSelection],
											color:		ORYX.CONFIG.SELECTION_HIGHLIGHT_COLOR,
											opacity: 	this.opacityFull
										});	
			} else {
				this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_HIGHLIGHT_HIDE, highlightId:'subselection'});				
			}						
			
		} else {
			this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_HIGHLIGHT_HIDE, highlightId:'selection'});
			this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_HIGHLIGHT_HIDE, highlightId:'subselection'});
		}		
	}
});
/**
 * Copyright (c) 2009-2010
 * processWave.org (Michael Goderbauer, Markus Goetz, Marvin Killing, Martin
 * Kreichgauer, Martin Krueger, Christian Ress, Thomas Zimmermann)
 *
 * based on oryx-project.org (Martin Czuchra, Nicolas Peters, Daniel Polak,
 * Willi Tscheschner, Oliver Kopp, Philipp Giese, Sven Wagner-Boysen, Philipp Berger, Jan-Felix Schwarz)
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 **/

if(!ORYX.Plugins)
	ORYX.Plugins = new Object(); 

ORYX.Plugins.ShapeHighlighting = Clazz.extend({

	construct: function(facade) {
		
		this.parentNode = facade.getCanvas().getSvgContainer();
		
		// The parent Node
		this.node = ORYX.Editor.graft("http://www.w3.org/2000/svg", this.parentNode,
					['g']);

		this.highlightNodes = {};
		
		facade.registerOnEvent(ORYX.CONFIG.EVENT_HIGHLIGHT_SHOW, this.setHighlight.bind(this));
		facade.registerOnEvent(ORYX.CONFIG.EVENT_HIGHLIGHT_HIDE, this.hideHighlight.bind(this));		

	},

	setHighlight: function(options) {
		if(options && options.highlightId){
			var node = this.highlightNodes[options.highlightId];
			
			if(!node){
				node= ORYX.Editor.graft("http://www.w3.org/2000/svg", this.node,
					['path', {
						"stroke-width": 2.0, "fill":"none"
						}]);	
			
				this.highlightNodes[options.highlightId] = node;
			}

			if(options.elements && options.elements.length > 0) {
				
				this.setAttributesByStyle( node, options );
				this.show(node);
			
			} else {
			
				this.hide(node);			
			
			}
			
		}
	},
	
	hideHighlight: function(options) {
		if(options && options.highlightId && this.highlightNodes[options.highlightId]){
			this.hide(this.highlightNodes[options.highlightId]);
		}		
	},
	
	hide: function(node) {
		node.setAttributeNS(null, 'display', 'none');
	},

	show: function(node) {
		node.setAttributeNS(null, 'display', '');
	},
	
	setAttributesByStyle: function( node, options ){
		
		// If the style say, that it should look like a rectangle
		if( options.style && options.style == ORYX.CONFIG.SELECTION_HIGHLIGHT_STYLE_RECTANGLE ){
			
			// Set like this
			var bo = options.elements[0].absoluteBounds();
			
			var strWidth = options.strokewidth ? options.strokewidth 	: ORYX.CONFIG.BORDER_OFFSET
			
			node.setAttributeNS(null, "d", this.getPathRectangle( bo.a, bo.b , strWidth ) );
			node.setAttributeNS(null, "stroke", 		options.color 		? options.color 		: ORYX.CONFIG.SELECTION_HIGHLIGHT_COLOR);
			node.setAttributeNS(null, "stroke-opacity", options.opacity 	? options.opacity 		: 0.2);
			node.setAttributeNS(null, "stroke-width", 	strWidth);
						
		} else if(options.elements.length == 1 
					&& options.elements[0] instanceof ORYX.Core.Edge &&
					options.highlightId != "selection") {
			
			/* Highlight containment of edge's childs */
			node.setAttributeNS(null, "d", this.getPathEdge(options.elements[0].dockers));
			node.setAttributeNS(null, "stroke", options.color ? options.color : ORYX.CONFIG.SELECTION_HIGHLIGHT_COLOR);
			node.setAttributeNS(null, "stroke-opacity", options.opacity ? options.opacity : 0.2);
			node.setAttributeNS(null, "stroke-width", 	ORYX.CONFIG.OFFSET_EDGE_BOUNDS);
			
		}else {
			// If not, set just the corners
			node.setAttributeNS(null, "d", this.getPathByElements(options.elements));
			node.setAttributeNS(null, "stroke", options.color ? options.color : ORYX.CONFIG.SELECTION_HIGHLIGHT_COLOR);
			node.setAttributeNS(null, "stroke-opacity", options.opacity ? options.opacity : 1.0);
			node.setAttributeNS(null, "stroke-width", 	options.strokewidth ? options.strokewidth 	: 2.0);
						
		}
	},
	
	getPathByElements: function(elements){
		if(!elements || elements.length <= 0) {return undefined}
		
		// Get the padding and the size
		var padding = ORYX.CONFIG.SELECTED_AREA_PADDING;
		
		var path = ""
		
		// Get thru all Elements
		elements.each((function(element) {
			if(!element) {return}
			// Get the absolute Bounds and the two Points
			var bounds = element.absoluteBounds();
			bounds.widen(padding)
			var a = bounds.upperLeft();
			var b = bounds.lowerRight();
			
			path = path + this.getPath(a ,b);
												
		}).bind(this));

		return path;
		
	},

	getPath: function(a, b){
				
		return this.getPathCorners(a, b);
	
	},
			
	getPathCorners: function(a, b){

		var size = ORYX.CONFIG.SELECTION_HIGHLIGHT_SIZE;
				
		var path = ""

		// Set: Upper left 
		path = path + "M" + a.x + " " + (a.y + size) + " l0 -" + size + " l" + size + " 0 ";
		// Set: Lower left
		path = path + "M" + a.x + " " + (b.y - size) + " l0 " + size + " l" + size + " 0 ";
		// Set: Lower right
		path = path + "M" + b.x + " " + (b.y - size) + " l0 " + size + " l-" + size + " 0 ";
		// Set: Upper right
		path = path + "M" + b.x + " " + (a.y + size) + " l0 -" + size + " l-" + size + " 0 ";
		
		return path;
	},
	
	getPathRectangle: function(a, b, strokeWidth){

		var size = ORYX.CONFIG.SELECTION_HIGHLIGHT_SIZE;

		var path 	= ""
		var offset 	= strokeWidth / 2.0;
		 
		// Set: Upper left 
		path = path + "M" + (a.x + offset) + " " + (a.y);
		path = path + " L" + (a.x + offset) + " " + (b.y - offset);
		path = path + " L" + (b.x - offset) + " " + (b.y - offset);
		path = path + " L" + (b.x - offset) + " " + (a.y + offset);
		path = path + " L" + (a.x + offset) + " " + (a.y + offset);

		return path;
	},
	
	getPathEdge: function(edgeDockers) {
		var length = edgeDockers.length;
		var path = "M" + edgeDockers[0].bounds.center().x + " " 
					+  edgeDockers[0].bounds.center().y;
		
		for(i=1; i<length; i++) {
			var dockerPoint = edgeDockers[i].bounds.center();
			path = path + " L" + dockerPoint.x + " " +  dockerPoint.y;
		}
		
		return path;
	}
	
});

 
ORYX.Plugins.HighlightingSelectedShapes = Clazz.extend({

	construct: function(facade) {
		this.facade = facade;
		this.opacityFull = 0.9;
		this.opacityLow = 0.4;

		// Register on Dragging-Events for show/hide of ShapeMenu
		//this.facade.registerOnEvent(ORYX.CONFIG.EVENT_DRAGDROP_START, this.hide.bind(this));
		//this.facade.registerOnEvent(ORYX.CONFIG.EVENT_DRAGDROP_END,  this.show.bind(this));		
        this.facade.registerOnEvent(ORYX.CONFIG.EVENT_CANVAS_RESIZE_UPDATE_HIGHLIGHTS, this.onSelectionChanged.bind(this));
	},

	/**
	 * On the Selection-Changed
	 *
	 */
	onSelectionChanged: function(event) {
		if(event.elements && event.elements.length > 1) {
			this.facade.raiseEvent({
										type:		ORYX.CONFIG.EVENT_HIGHLIGHT_SHOW, 
										highlightId:'selection',
										elements:	event.elements.without(event.subSelection),
										color:		ORYX.CONFIG.SELECTION_HIGHLIGHT_COLOR,
										opacity: 	!event.subSelection ? this.opacityFull : this.opacityLow
									});

			if(event.subSelection){
				this.facade.raiseEvent({
											type:		ORYX.CONFIG.EVENT_HIGHLIGHT_SHOW, 
											highlightId:'subselection',
											elements:	[event.subSelection],
											color:		ORYX.CONFIG.SELECTION_HIGHLIGHT_COLOR,
											opacity: 	this.opacityFull
										});	
			} else {
				this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_HIGHLIGHT_HIDE, highlightId:'subselection'});				
			}						
			
		} else {
			this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_HIGHLIGHT_HIDE, highlightId:'selection'});
			this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_HIGHLIGHT_HIDE, highlightId:'subselection'});
		}		
	}
});
/**
 * Copyright (c) 2009-2010
 * processWave.org (Michael Goderbauer, Markus Goetz, Marvin Killing, Martin
 * Kreichgauer, Martin Krueger, Christian Ress, Thomas Zimmermann)
 *
 * based on oryx-project.org (Martin Czuchra, Nicolas Peters, Daniel Polak,
 * Willi Tscheschner, Oliver Kopp, Philipp Giese, Sven Wagner-Boysen, Philipp Berger, Jan-Felix Schwarz)
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 **/

Array.prototype.insertFrom = function(from, to){
	to 			= Math.max(0, to);
	from 		= Math.min( Math.max(0, from), this.length-1 );
		
	var el 		= this[from];
	var old 	= this.without(el);
	var newA 	= old.slice(0, to);
	newA.push(el);
	if(old.length > to ){
		newA 	= newA.concat(old.slice(to))
	};
	return newA;
}

if(!ORYX.Plugins)
	ORYX.Plugins = new Object();

ORYX.Plugins.ArrangementLight = Clazz.extend({

	facade: undefined,

	construct: function(facade) {
		this.facade = facade;
		this.facade.registerOnEvent(ORYX.CONFIG.EVENT_ARRANGEMENTLIGHT_TOP, this.setZLevel.bind(this, this.setToTop)	);
		this.facade.registerOnEvent(ORYX.CONFIG.EVENT_ARRANGEMENTLIGHT_BACK, this.setZLevel.bind(this, this.setToBack)	);
		this.facade.registerOnEvent(ORYX.CONFIG.EVENT_ARRANGEMENTLIGHT_FORWARD, this.setZLevel.bind(this, this.setForward)	);
		this.facade.registerOnEvent(ORYX.CONFIG.EVENT_ARRANGEMENTLIGHT_BACKWARD, this.setZLevel.bind(this, this.setBackward)	);	
	},
	
	setZLevel:function(callback, event){
			
		//Command-Pattern for dragging one docker
		var zLevelCommand = ORYX.Core.Command.extend({
			construct: function(callback, elements, facade){
				this.callback 	= callback;
				this.elements 	= elements;
				// For redo, the previous elements get stored
				this.elAndIndex	= elements.map(function(el){ return {el:el, previous:el.parent.children[el.parent.children.indexOf(el)-1]} })
				this.facade		= facade;
			},			
			execute: function(){
				
				// Call the defined z-order callback with the elements
				this.callback( this.elements )			
			},
			rollback: function(){
				
				// Sort all elements on the index of there containment
				var sortedEl =	this.elAndIndex.sortBy( function( el ) {
									var value 	= el.el;
									var t 		= $A(value.node.parentNode.childNodes);
									return t.indexOf(value.node);
								}); 
				
				// Every element get setted back bevor the old previous element
				for(var i=0; i<sortedEl.length; i++){
					var el			= sortedEl[i].el;
					var p 			= el.parent;			
					var oldIndex 	= p.children.indexOf(el);
					var newIndex 	= p.children.indexOf(sortedEl[i].previous);
					newIndex		= newIndex || 0
					p.children 	= p.children.insertFrom(oldIndex, newIndex)			
					el.node.parentNode.insertBefore(el.node, el.node.parentNode.childNodes[newIndex+1]);
				}
			}
		});
	
		// Instanziate the dockCommand
		var command = new zLevelCommand(callback, [event.shape], this.facade);
		command.execute();
	},

	setToTop: function(elements) {

		// Sortieren des Arrays nach dem Index des SVGKnotens im Bezug auf dem Elternknoten.
		var tmpElem =  elements.sortBy( function(value, index) {
			var t = $A(value.node.parentNode.childNodes);
			return t.indexOf(value.node);
		});
		// Sortiertes Array wird nach oben verschoben.
		tmpElem.each( function(value) {
			var p = value.parent

			p.children = p.children.without( value )
			p.children.push( value );
			value.node.parentNode.appendChild(value.node);			
		});
	},

	setToBack: function(elements) {
		// Sortieren des Arrays nach dem Index des SVGKnotens im Bezug auf dem Elternknoten.
		var tmpElem =  elements.sortBy( function(value, index) {
			var t = $A(value.node.parentNode.childNodes);
			return t.indexOf(value.node);
		});

		tmpElem = tmpElem.reverse();

		// Sortiertes Array wird nach unten verschoben.
		tmpElem.each( function(value) {
			var p = value.parent
			p.children = p.children.without( value )
			p.children.unshift( value );
			value.node.parentNode.insertBefore(value.node, value.node.parentNode.firstChild);
		});
		
		
	},

	setBackward: function(elements) {
		// Sortieren des Arrays nach dem Index des SVGKnotens im Bezug auf dem Elternknoten.
		var tmpElem =  elements.sortBy( function(value, index) {
			var t = $A(value.node.parentNode.childNodes);
			return t.indexOf(value.node);
		});

		// Reverse the elements
		tmpElem = tmpElem.reverse();
		
		// Delete all Nodes who are the next Node in the nodes-Array
		var compactElem = tmpElem.findAll(function(el) {return !tmpElem.some(function(checkedEl){ return checkedEl.node == el.node.previousSibling})});
		
		// Sortiertes Array wird nach eine Ebene nach oben verschoben.
		compactElem.each( function(el) {
			if(el.node.previousSibling === null) { return; }
			var p 		= el.parent;			
			var index 	= p.children.indexOf(el);
			p.children 	= p.children.insertFrom(index, index-1)			
			el.node.parentNode.insertBefore(el.node, el.node.previousSibling);
		});
		
		
	},

	setForward: function(elements) {
		// Sortieren des Arrays nach dem Index des SVGKnotens im Bezug auf dem Elternknoten.
		var tmpElem =  elements.sortBy( function(value, index) {
			var t = $A(value.node.parentNode.childNodes);
			return t.indexOf(value.node);
		});


		// Delete all Nodes who are the next Node in the nodes-Array
		var compactElem = tmpElem.findAll(function(el) {return !tmpElem.some(function(checkedEl){ return checkedEl.node == el.node.nextSibling})});
	
			
		// Sortiertes Array wird eine Ebene nach unten verschoben.
		compactElem.each( function(el) {
			var nextNode = el.node.nextSibling		
			if(nextNode === null) { return; }
			var index 	= el.parent.children.indexOf(el);
			var p 		= el.parent;
			p.children 	= p.children.insertFrom(index, index+1)			
			el.node.parentNode.insertBefore(nextNode, el.node);
		});
	}
});
/**
 * Copyright (c) 2009-2010
 * processWave.org (Michael Goderbauer, Markus Goetz, Marvin Killing, Martin
 * Kreichgauer, Martin Krueger, Christian Ress, Thomas Zimmermann)
 *
 * based on oryx-project.org (Martin Czuchra, Nicolas Peters, Daniel Polak,
 * Willi Tscheschner, Oliver Kopp, Philipp Giese, Sven Wagner-Boysen, Philipp Berger, Jan-Felix Schwarz)
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 **/

if(!ORYX.Plugins)
	ORYX.Plugins = new Object();
    
ORYX.Core.Commands["DockerCreation.NewDockerCommand"] = ORYX.Core.AbstractCommand.extend({
    construct: function construct(addEnabled, deleteEnabled, edge, docker, pos, facade, args){            
        // call construct method of parent
        arguments.callee.$.construct.call(this, facade);
        
        this.addEnabled = addEnabled;
        this.deleteEnabled = deleteEnabled;
        this.edge = edge;
        this.docker = docker;
        this.pos = pos;
        this.facade = facade;
        this.id = args.dockerId;
        this.index = args.index;
        this.options = args.options;
    },
    execute: function(){
        if (this.addEnabled) {
            this.docker = this.edge.addDocker(this.pos, this.docker, this.id);
            if (typeof this.docker === "undefined") {
                this.docker = this.edge.createDocker(this.index, this.pos, this.id);
            } else {
                this.index = this.edge.dockers.indexOf(this.docker);
            }
        } else if (this.deleteEnabled) {
            if (typeof this.docker !== "undefined") {
			    this.index = this.edge.dockers.indexOf(this.docker);
                this.pos = this.docker.bounds.center();
                this.edge.removeDocker(this.docker);
            }
        }
        this.facade.getCanvas().update();
        this.facade.updateSelection();
        this.options.docker = this.docker;
    },
    rollback: function(){  
        if (this.addEnabled) {
            if (this.docker instanceof ORYX.Core.Controls.Docker) {
                    this.edge.removeDocker(this.docker);
            }         
        } else if (this.deleteEnabled) {
            if (typeof this.docker !== "undefined") {
                this.edge.add(this.docker, this.index);
            }
        }
        this.facade.getCanvas().update();
        this.facade.updateSelection(); 
    },
    getCommandData: function getCommandData() {
        var getId = function(shape) { return shape.resourceId; };
        var getDockerId = function(docker) {
            var dockerId; 
            if (typeof docker !== "undefined") {
                dockerId = docker.id;
            }
            return dockerId;
        };

        var cmd = {
            "index": this.index,
            "name": "DockerCreation.NewDockerCommand",
            "addEnabled": this.addEnabled,
            "deleteEnabled": this.deleteEnabled,
            "edgeId": getId(this.edge),
            "dockerPositionArray": this.pos,
            "dockerId": getDockerId(this.docker)
        };
        return cmd;      
    } ,
    createFromCommandData: function createFromCommandData(facade, cmdData){
        var addEnabled = cmdData.addEnabled;
        var deleteEnabled = cmdData.deleteEnabled;
        
        var canvas = facade.getCanvas();
        var getShape = canvas.getChildShapeByResourceId.bind(canvas);

        var edge = getShape(cmdData.edgeId);
        var docker;

        if (typeof edge === 'undefined') {
            // Trying to add a docker to a already deleted edge.
            return undefined;
        }      
        if (deleteEnabled) {
            for (var i = 0; i < edge.dockers.length; i++) {
                if (edge.dockers[i].id == cmdData.dockerId) {
                    docker = edge.dockers[i];                
                }
            }
        } 
        if (addEnabled) {
            var dockerPositionArray = cmdData.dockerPositionArray;
		    var position = canvas.node.ownerSVGElement.createSVGPoint();
		    position.x = dockerPositionArray.x;
		    position.y = dockerPositionArray.y;
        }
        var args = {
            "dockerId": cmdData.dockerId,
            "index": cmdData.index,
            "options": {}
        };
        return new ORYX.Core.Commands["DockerCreation.NewDockerCommand"](addEnabled, deleteEnabled, edge, docker, position, facade, args);
    },        
    getCommandName: function getCommandName() {
        return "DockerCreation.NewDockerCommand";
    },    
    getDisplayName: function getDisplayName() {
        if (this.addEnabled) {
            return "Docker added";
        }
        return "Docker deleted";
    },        
    getAffectedShapes: function getAffectedShapes() {
        return [this.edge];
    }
});

ORYX.Plugins.DockerCreation = Clazz.extend({
	
	construct: function( facade ){
		this.facade = facade;		
		this.active = false; //true-> a ghostdocker is shown; false->ghostdocker is hidden
		this.point = {x:0, y:0}; //Ghostdocker
        this.ctrlPressed = false;
        this.creationAllowed = true; // should be false if the addDocker button is pressed, otherwise there are always two dockers added when ALT+Clicking in docker-mode!
		
		//visual representation of the Ghostdocker
		this.circle = ORYX.Editor.graft("http://www.w3.org/2000/svg", null ,
				['g', {"pointer-events":"none"},
					['circle', {cx: "8", cy: "8", r: "3", fill:"yellow"}]]); 	
        this.facade.offer({
            keyCodes: [{
                keyCode: 18,
                keyAction: ORYX.CONFIG.KEY_ACTION_UP 
             }],
             functionality: this.keyUp.bind(this)
         });
        this.facade.offer({
            keyCodes: [{
                metaKeys: [ORYX.CONFIG.META_KEY_ALT],
                keyCode: 18,
                keyAction: ORYX.CONFIG.KEY_ACTION_DOWN 
             }],
             functionality: this.keyDown.bind(this)
         });
        this.facade.registerOnEvent(ORYX.CONFIG.EVENT_MOUSEDOWN, this.handleMouseDown.bind(this));
		this.facade.registerOnEvent(ORYX.CONFIG.EVENT_MOUSEOVER, this.handleMouseOver.bind(this));
		this.facade.registerOnEvent(ORYX.CONFIG.EVENT_MOUSEOUT, this.handleMouseOut.bind(this));
		this.facade.registerOnEvent(ORYX.CONFIG.EVENT_MOUSEMOVE, this.handleMouseMove.bind(this));
        this.facade.registerOnEvent(ORYX.CONFIG.EVENT_DISABLE_DOCKER_CREATION, this.handleDisableDockerCreation.bind(this));
        this.facade.registerOnEvent(ORYX.CONFIG.EVENT_ENABLE_DOCKER_CREATION, this.handleEnableDockerCreation.bind(this));
		/*
		 * Double click is reserved for label access, so abort action
		 */
		this.facade.registerOnEvent(ORYX.CONFIG.EVENT_DBLCLICK, function() { window.clearTimeout(this.timer); }.bind(this));
		/*
		 * click is reserved for selecting, so abort action when mouse goes up
		 */
		this.facade.registerOnEvent(ORYX.CONFIG.EVENT_MOUSEUP, function() { window.clearTimeout(this.timer); }.bind(this));
    },

    keyDown: function keyDown(event) {
        this.ctrlPressed = true;
    },

    keyUp: function keyUp(event) {
        this.ctrlPressed = false;
    	this.hideOverlay();
    	this.active = false;
    },
    
    handleDisableDockerCreation: function handleDisableDockerCreation(event) {
        this.creationAllowed = false;
    },
    
    handleEnableDockerCreation: function handleEnableDockerCreation(event) {
        this.creationAllowed = true;
    },

    /**
     * MouseOut Handler
     * 
     *hide the Ghostpoint when Leaving the mouse from an edge
     */
    handleMouseOut: function handleMouseOut(event, uiObj) {
    	if (this.active) {		
    		this.hideOverlay();
    		this.active = false;
    	}	
    },

    /**
     * MouseOver Handler
     * 
     *show the Ghostpoint if the edge is selected
     */
    handleMouseOver: function handleMouseOver(event, uiObj) {
        this.point.x = this.facade.eventCoordinates(event).x;
        this.point.y = this.facade.eventCoordinates(event).y;

        // show the Ghostdocker on the edge
        if (uiObj instanceof ORYX.Core.Edge && this.ctrlPressed && this.creationAllowed) {
            this.showOverlay(uiObj, this.point);
            //ghostdocker is active
            this.active = true;
        }
    },

    /**
     * MouseDown Handler
     * 
     *create a Docker when clicking on a selected edge
     */
    handleMouseDown: function handleMouseDown(event, uiObj) {
        if (this.ctrlPressed && this.creationAllowed && event.which==1) {
            if (uiObj instanceof ORYX.Core.Edge){
                this.addDockerCommand({
                    edge: uiObj,
                    event: event,
                    position: this.facade.eventCoordinates(event)
                });
                this.hideOverlay();
            } else if (uiObj instanceof ORYX.Core.Controls.Docker && uiObj.parent instanceof ORYX.Core.Edge) {
             //check if uiObj is not the first or last docker of its parent, if not so instanciate deleteCommand
            if ((uiObj.parent.dockers.first() !== uiObj) && (uiObj.parent.dockers.last() !== uiObj)) {
                this.deleteDockerCommand({
                    edge: uiObj.parent,
                    docker: uiObj
                });
            }
            }
        }
    },

    //
    /**
     * MouseMove Handler
     * 
     *refresh the ghostpoint when moving the mouse over an edge
     */
    handleMouseMove: function handleMouseMove(event, uiObj) {
        if (uiObj instanceof ORYX.Core.Edge && this.ctrlPressed && this.creationAllowed) {
            this.point.x = this.facade.eventCoordinates(event).x;
            this.point.y = this.facade.eventCoordinates(event).y;

            if (this.active) {
                //refresh Ghostpoint
                this.hideOverlay();
                this.showOverlay(uiObj, this.point);
            } else {
                this.showOverlay(uiObj, this.point);
            }
        }
    },

    /**
     * Command for creating a new Docker
     * 
     * @param {Object} options
     */
    addDockerCommand: function addDockerCommand(options){
        if(!options.edge)
            return;
        var args = {
            "options": options
        };
        var command = new ORYX.Core.Commands["DockerCreation.NewDockerCommand"](true, false, options.edge, options.docker, options.position, this.facade, args);    
        this.facade.executeCommands([command]);
    
        this.facade.raiseEvent({
                uiEvent: options.event,
                type: ORYX.CONFIG.EVENT_DOCKERDRAG
            }, options.docker );    
    },

    deleteDockerCommand: function deleteDockerCommand(options){
        if(!options.edge) {
            return;
        }
        
        var args = { "options": options };
        var command = new ORYX.Core.Commands["DockerCreation.NewDockerCommand"](false, true, options.edge, options.docker, options.position, this.facade, args);    
        this.facade.executeCommands([command]);
    },

    /**
     *show the ghostpoint overlay
     *
     *@param {Shape} edge
     *@param {Point} point
     */
    showOverlay: function showOverlay(edge, point) {
        if (this.facade.isReadOnlyMode()) {
            return;
        }
        
        this.facade.raiseEvent({
                type: ORYX.CONFIG.EVENT_OVERLAY_SHOW,
                id: "ghostpoint",
                shapes: [edge],
                node: this.circle,
                ghostPoint: point,
                dontCloneNode: true
        });
    },

    /**
     *hide the ghostpoint overlay
     */
    hideOverlay: function hideOverlay() {
        this.facade.raiseEvent({
            type: ORYX.CONFIG.EVENT_OVERLAY_HIDE,
            id: "ghostpoint"
        });
    }

});

/**
 * Copyright (c) 2009-2010
 * processWave.org (Michael Goderbauer, Markus Goetz, Marvin Killing, Martin
 * Kreichgauer, Martin Krueger, Christian Ress, Thomas Zimmermann)
 *
 * based on oryx-project.org (Martin Czuchra, Nicolas Peters, Daniel Polak,
 * Willi Tscheschner, Oliver Kopp, Philipp Giese, Sven Wagner-Boysen, Philipp Berger, Jan-Felix Schwarz)
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 *
 * 
 * HOW to USE the OVERLAY PLUGIN:
 * 	You can use it via the event mechanism from the editor
 * 	by using facade.raiseEvent( <option> )
 * 
 * 	As an example please have a look in the overlayexample.js
 * 
 * 	The option object should/have to have following attributes:
 * 
 * 	Key				Value-Type							Description
 * 	================================================================
 * 
 *	type 			ORYX.CONFIG.EVENT_OVERLAY_SHOW | ORYX.CONFIG.EVENT_OVERLAY_HIDE		This is the type of the event	
 *	id				<String>							You have to use an unified id for later on hiding this overlay
 *	shapes 			<ORYX.Core.Shape[]>					The Shapes where the attributes should be changed
 *	attributes 		<Object>							An object with svg-style attributes as key-value pair
 *	node			<SVGElement>						An SVG-Element could be specified for adding this to the Shape
 *	nodePosition	"N"|"NE"|"E"|"SE"|"S"|"SW"|"W"|"NW"|"START"|"END"	The position for the SVG-Element relative to the 
 *														specified Shape. "START" and "END" are just using for a Edges, then
 *														the relation is the start or ending Docker of this edge.
 *	
 * 
 **/
if (!ORYX.Plugins) 
    ORYX.Plugins = new Object();

ORYX.Plugins.Overlay = Clazz.extend({

    facade: undefined,
	
	styleNode: undefined,
    
    construct: function(facade){
		
        this.facade = facade;

		this.changes = [];

		this.facade.registerOnEvent(ORYX.CONFIG.EVENT_OVERLAY_SHOW, this.show.bind(this));
		this.facade.registerOnEvent(ORYX.CONFIG.EVENT_OVERLAY_HIDE, this.hide.bind(this));	

		this.styleNode = document.createElement('style')
		this.styleNode.setAttributeNS(null, 'type', 'text/css')
		
		document.getElementsByTagName('head')[0].appendChild( this.styleNode )

    },
	
	/**
	 * Show the overlay for specific nodes
	 * @param {Object} options
	 * 
	 * 	String				options.id		- MUST - Define the id of the overlay (is needed for the hiding of this overlay)		
	 *	ORYX.Core.Shape[] 	options.shapes 	- MUST - Define the Shapes for the changes
	 * 	attr-name:value		options.changes	- Defines all the changes which should be shown
	 * 
	 * 
	 */
	show: function( options ){
		
		// Checks if all arguments are available
		if(!options || 
		   !options.shapes || !options.shapes instanceof Array ||
		   !options.id || !options.id instanceof String || options.id.length == 0) { 
		    return;
		}
		
		//if( this.changes[options.id]){
		//	this.hide( options )
		//}
			

		// Checked if attributes are set
		if( options.attributes ){
			
			// FOR EACH - Shape
			options.shapes.each(function(el){
				
				// Checks if the node is a Shape
				if( !el instanceof ORYX.Core.Shape){ return }
				
				this.setAttributes( el.node , options.attributes )
				
			}.bind(this));

		}	
		
		var isSVG = true
		try {
			isSVG = options.node && options.node instanceof SVGElement;
		} catch(e){}
		
		// Checks if node is set and if this is a SVGElement		
		if ( options.node && isSVG) {
			
			options["_temps"] = [];
						
			// FOR EACH - Node
			options.shapes.each(function(el, index){
				
				// Checks if the node is a Shape
				if( !el instanceof ORYX.Core.Shape){ return }
				
				var _temp = {};
				_temp.svg = options.dontCloneNode ? options.node : options.node.cloneNode( true );
				
				// Append the svg node to the ORYX-Shape
				this.facade.getCanvas().getSvgContainer().appendChild(_temp.svg);
				
				if (el instanceof ORYX.Core.Edge && !options.nodePosition) {
					options['nodePosition'] = "START";
				}
						
				// If the node position is set, it has to be transformed
				if (options.nodePosition && !options.nodePositionAbsolute) {
					var b = el.absoluteBounds();
					var p = options.nodePosition.toUpperCase();
					
					// Check the values of START and END
					if( el instanceof ORYX.Core.Node && p == "START"){
						p = "NW";
					} else if(el instanceof ORYX.Core.Node && p == "END"){
						p = "SE";
					} else if(el instanceof ORYX.Core.Edge && p == "START"){
						b = el.getDockers().first().bounds;
					} else if(el instanceof ORYX.Core.Edge && p == "END"){
						b = el.getDockers().last().bounds;
					}

					// Create a callback for changing the position 
					// depending on the position string
					_temp.callback = function() { this.positionCallback(el, p, b, options.keepInsideVisibleArea, _temp); }.bind(this);
					_temp.element = el;
					_temp.callback();
					
					b.registerCallback( _temp.callback );
				}
				
                // Show the ghostpoint
                if(options.ghostPoint){
                    var point={x:0, y:0};
                    point=options.ghostPoint;
                    _temp.callback = function(){
                     
                        var x = 0; var y = 0;
                        x = point.x -7;
                        y = point.y -7;
                        _temp.svg.setAttributeNS(null, "transform", "translate(" + x + ", " + y + ")")
                      
                    }.bind(this)
                 
                     _temp.element = el;
                     _temp.callback();
                     
                     b.registerCallback( _temp.callback );
                }
                
				options._temps.push( _temp )	
				
			}.bind(this))
			
		}

		// Store the changes
		if( !this.changes[options.id] ){
			this.changes[options.id] = [];
		}
		
		this.changes[options.id].push( options );
				
	},
	
	/**
	 * Hide the overlay with the spefic id
	 * @param {Object} options
	 */
	hide: function( options ){
		
		// Checks if all arguments are available
		if(!options || 
		   !options.id || !options.id instanceof String || options.id.length == 0 ||
		   !this.changes[options.id]) { 
			return;
		}		
		
		
		// Delete all added attributes
		// FOR EACH - Shape
		this.changes[options.id].each(function(option){
			
			option.shapes.each(function(el, index){
				
				// Checks if the node is a Shape
				if( !el instanceof ORYX.Core.Shape){ return }
				
				this.deleteAttributes( el.node )
							
			}.bind(this));

	
			if( option._temps ){
				
				option._temps.each(function(tmp){
					// Delete the added Node, if there is one
					if( tmp.svg && tmp.svg.parentNode ){
						tmp.svg.parentNode.removeChild( tmp.svg )
					}
		
					// If 
					if( tmp.callback && tmp.element){
						// It has to be unregistered from the edge
						tmp.element.bounds.unregisterCallback( tmp.callback )
					}
							
				}.bind(this));
				
			}
			
		}.bind(this));
		
		this.changes[options.id] = null;
	},
	
	
	/**
	 * Set the given css attributes to that node
	 * @param {HTMLElement} node
	 * @param {Object} attributes
	 */
	setAttributes: function( node, attributes ) {
		
		
		// Get all the childs from ME
		var childs = this.getAllChilds( node.firstChild.firstChild )
		
		var ids = []
		
		// Add all Attributes which have relation to another node in this document and concate the pure id out of it
		// This is for example important for the markers of a edge
		childs.each(function(e){ ids.push( $A(e.attributes).findAll(function(attr){ return attr.nodeValue.startsWith('url(#')}) )})
		ids = ids.flatten().compact();
		ids = ids.collect(function(s){return s.nodeValue}).uniq();
		ids = ids.collect(function(s){return s.slice(5, s.length-1)})
		
		// Add the node ID to the id
		ids.unshift( node.id + ' .me')
		
		var attr				= $H(attributes);
        var attrValue			= attr.toJSON().gsub(',', ';').gsub('"', '');
        var attrMarkerValue		= attributes.stroke ? attrValue.slice(0, attrValue.length-1) + "; fill:" + attributes.stroke + ";}" : attrValue;
        var attrTextValue;
        if( attributes.fill ){
            var copyAttr        = Object.clone(attributes);
        	copyAttr.fill		= "black";
        	attrTextValue		= $H(copyAttr).toJSON().gsub(',', ';').gsub('"', '');
        }
                	
        // Create the CSS-Tags Style out of the ids and the attributes
        csstags = ids.collect(function(s, i){return "#" + s + " * " + (!i? attrValue : attrMarkerValue) + "" + (attrTextValue ? " #" + s + " text * " + attrTextValue : "") })
		
		// Join all the tags
		var s = csstags.join(" ") + "\n" 
		
		// And add to the end of the style tag
		this.styleNode.appendChild(document.createTextNode(s));
		
		
	},
	
	/**
	 * Deletes all attributes which are
	 * added in a special style sheet for that node
	 * @param {HTMLElement} node 
	 */
	deleteAttributes: function( node ) {
				
		// Get all children which contains the node id		
		var delEl = $A(this.styleNode.childNodes)
					 .findAll(function(e){ return e.textContent.include( '#' + node.id ) });
		
		// Remove all of them
		delEl.each(function(el){
			el.parentNode.removeChild(el);
		});		
	},
	
	getAllChilds: function( node ){
		
		var childs = $A(node.childNodes)
		
		$A(node.childNodes).each(function( e ){ 
		        childs.push( this.getAllChilds( e ) )
		}.bind(this))

    	return childs.flatten();
	},

    isInsideVisibleArea: function(x, y, width, height) {
        // get the div that is responsible for scrolling
        var centerDiv = document.getElementById("oryx_center_region").children[0].children[0];
       
        var viewportLeft = centerDiv.scrollLeft / this.facade.getCanvas().zoomLevel;  
        var viewportTop = centerDiv.scrollTop / this.facade.getCanvas().zoomLevel;  
        // yeah I'm fully aware of how much I suck: 20px is the width of the scrollbars
        var viewportWidth = (centerDiv.offsetWidth - 20) / this.facade.getCanvas().zoomLevel;
        var viewportHeight = (centerDiv.offsetHeight - 20) / this.facade.getCanvas().zoomLevel;

        var insideX = (x > viewportLeft && x + width < viewportLeft + viewportWidth);
        var insideY = (y > viewportTop && y + height < viewportTop + viewportHeight);
        return insideX && insideY;
    },
    
    positionCallback: function(element, position, bounds, keepVisible, temp) {
        var x, y;
        try {
        var overlayWidth = temp.svg.getBBox().width;
        var overlayHeight = temp.svg.getBBox().height;
        } catch(e) {
            //workaround for SVG bug in Firefox
            var xdadsd = 42;
        }
        var curPos, curPosIndex;
        var positionPreference = ["N", "NW", "W", "NE", "SW", "SE", "INSIDE_NW", "INSIDE_W"];
        var startAndEnd = { x: bounds.width() / 2, y: bounds.height() / 2 };
        var positions = {
            "NW":           { x: -overlayWidth,                         y: -overlayHeight * 1.5 },
            "N":            { x: bounds.width() / 2 - overlayWidth / 2, y: -overlayHeight * 1.5 },
            "NE":           { x: bounds.width(),                        y: -overlayHeight * 1.5 },
            "E":            { x: bounds.width(),                        y: bounds.height() / 2 - overlayHeight / 2 },
            "SE":           { x: bounds.width(),                        y: bounds.height() },
            "S":            { x: bounds.width() / 2 - overlayWidth / 2, y: bounds.height() },
            "SW":           { x: -overlayWidth - 20,                    y: bounds.height() },
            "W":            { x: -overlayWidth - 20,                    y: bounds.height() / 2 - overlayHeight / 2 },
            "INSIDE_NW":    { x: bounds.width() - overlayWidth - 20,    y: 0 },
            "INSIDE_W":     { x: 20,                                    y: bounds.height() / 2 - overlayHeight / 2 },
            "START": startAndEnd,
            "END": startAndEnd
        }
        
        // get position and (if necessary) make sure the overlay is inside the visible part of the screen
        curPos = position;
        curPosIndex = 0;
        do {
	        x = positions[curPos].x + bounds.upperLeft().x; 
            y = positions[curPos].y + bounds.upperLeft().y;

            curPos = positionPreference[curPosIndex++];
        
            if (typeof curPos === "undefined") {
                break;
            }
        } while (keepVisible && !this.isInsideVisibleArea(x, y, overlayWidth, overlayHeight));
        
        temp.svg.setAttributeNS(null, "transform", "translate(" + x + ", " + y + ")");
    }
    
});
/**
 * Copyright (c) 2009-2010
 * processWave.org (Michael Goderbauer, Markus Goetz, Marvin Killing, Martin
 * Kreichgauer, Martin Krueger, Christian Ress, Thomas Zimmermann)
 *
 * based on oryx-project.org (Martin Czuchra, Nicolas Peters, Daniel Polak,
 * Willi Tscheschner, Oliver Kopp, Philipp Giese, Sven Wagner-Boysen, Philipp Berger, Jan-Felix Schwarz)
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 **/
 
if (!ORYX.Plugins) 
    ORYX.Plugins = new Object();

ORYX.Plugins.KeysMove = ORYX.Plugins.AbstractPlugin.extend({

    facade: undefined,
    
    construct: function(facade){
    
        this.facade = facade;
        this.copyElements = [];
        
        //this.facade.registerOnEvent(ORYX.CONFIG.EVENT_KEYDOWN, this.keyHandler.bind(this));

		// SELECT ALL
		this.facade.offer({
		keyCodes: [{
		 		metaKeys: [ORYX.CONFIG.META_KEY_META_CTRL],
				keyCode: 65,
				keyAction: ORYX.CONFIG.KEY_ACTION_DOWN 
			}
		 ],
         functionality: this.selectAll.bind(this)
         });
		 
		// MOVE LEFT SMALL		
		this.facade.offer({
		keyCodes: [{
		 		metaKeys: [ORYX.CONFIG.META_KEY_META_CTRL],
				keyCode: ORYX.CONFIG.KEY_CODE_LEFT,
				keyAction: ORYX.CONFIG.KEY_ACTION_DOWN 
			}
		 ],
         functionality: this.move.bind(this, ORYX.CONFIG.KEY_CODE_LEFT, false)
         });
		 
		 // MOVE LEFT
		 this.facade.offer({
		 keyCodes: [{
				keyCode: ORYX.CONFIG.KEY_CODE_LEFT,
				keyAction: ORYX.CONFIG.KEY_ACTION_DOWN 
			}
		 ],
         functionality: this.move.bind(this, ORYX.CONFIG.KEY_CODE_LEFT, true)
         });
		 
		// MOVE RIGHT SMALL	
		 this.facade.offer({
		 keyCodes: [{
		 		metaKeys: [ORYX.CONFIG.META_KEY_META_CTRL],
				keyCode: ORYX.CONFIG.KEY_CODE_RIGHT,
				keyAction: ORYX.CONFIG.KEY_ACTION_DOWN 
			}
		 ],
         functionality: this.move.bind(this, ORYX.CONFIG.KEY_CODE_RIGHT, false)
         });
		 
		// MOVE RIGHT	
		 this.facade.offer({
		 keyCodes: [{
				keyCode: ORYX.CONFIG.KEY_CODE_RIGHT,
				keyAction: ORYX.CONFIG.KEY_ACTION_DOWN 
			}
		 ],
         functionality: this.move.bind(this, ORYX.CONFIG.KEY_CODE_RIGHT, true)
         });
		 
		// MOVE UP SMALL	
		 this.facade.offer({
		 keyCodes: [{
		 		metaKeys: [ORYX.CONFIG.META_KEY_META_CTRL],
				keyCode: ORYX.CONFIG.KEY_CODE_UP,
				keyAction: ORYX.CONFIG.KEY_ACTION_DOWN 
			}
		 ],
         functionality: this.move.bind(this, ORYX.CONFIG.KEY_CODE_UP, false)
         });
		 
		// MOVE UP	
		 this.facade.offer({
		 keyCodes: [{
				keyCode: ORYX.CONFIG.KEY_CODE_UP,
				keyAction: ORYX.CONFIG.KEY_ACTION_DOWN 
			}
		 ],
         functionality: this.move.bind(this, ORYX.CONFIG.KEY_CODE_UP, true)
         });
		 
		// MOVE DOWN SMALL	
		 this.facade.offer({
		 keyCodes: [{
		 		metaKeys: [ORYX.CONFIG.META_KEY_META_CTRL],
				keyCode: ORYX.CONFIG.KEY_CODE_DOWN,
				keyAction: ORYX.CONFIG.KEY_ACTION_DOWN 
			}
		 ],
         functionality: this.move.bind(this, ORYX.CONFIG.KEY_CODE_DOWN, false)
         });
		 
		// MOVE DOWN	
		 this.facade.offer({
		 keyCodes: [{
				keyCode: ORYX.CONFIG.KEY_CODE_DOWN,
				keyAction: ORYX.CONFIG.KEY_ACTION_DOWN 
			}
		 ],
         functionality: this.move.bind(this, ORYX.CONFIG.KEY_CODE_DOWN, true)
         });
		 
         
    },
    
	/**
	 * Select all shapes in the editor
	 *
	 */
	selectAll: function(e){
    	Event.stop(e.event);
		this.facade.setSelection(this.facade.getCanvas().getChildShapes(true))
	},
	
	move: function(key, far, e) {
		
    	Event.stop(e.event);

		// calculate the distance to move the objects and get the selection.
		var distance = far? 20 : 5;
		var selection = this.facade.getSelection();
		var currentSelection = this.facade.getSelection();
		var p = {x: 0, y: 0};
		
		// switch on the key pressed and populate the point to move by.
		switch(key) {

			case ORYX.CONFIG.KEY_CODE_LEFT:
				p.x = -1*distance;
				break;
			case ORYX.CONFIG.KEY_CODE_RIGHT:
				p.x = distance;
				break;
			case ORYX.CONFIG.KEY_CODE_UP:
				p.y = -1*distance;
				break;
			case ORYX.CONFIG.KEY_CODE_DOWN:
				p.y = distance;
				break;
		}
		
		// move each shape in the selection by the point calculated and update it.
		selection = selection.findAll(function(shape){ 
			// Check if this shape is docked to an shape in the selection			
			if(shape instanceof ORYX.Core.Node && shape.dockers.length == 1 && selection.include( shape.dockers.first().getDockedShape() )){ 
				return false 
			} 
			
			// Check if any of the parent shape is included in the selection
			var s = shape.parent; 
			do{ 
				if(selection.include(s)){ 
					return false
				}
			}while(s = s.parent); 
			
			// Otherwise, return true
			return true;
			
		});
		
		/* Edges must not be movable, if only edges are selected and at least 
		 * one of them is docked.
		 */
		var edgesMovable = true;
		var onlyEdgesSelected = selection.all(function(shape) {
			if(shape instanceof ORYX.Core.Edge) {
				if(shape.isDocked()) {
					edgesMovable = false;
				}
				return true;	
			}
			return false;
		});
		
		if(onlyEdgesSelected && !edgesMovable) {
			/* Abort moving shapes */
			return;
		}
		
		selection = selection.map(function(shape){ 
			if( shape instanceof ORYX.Core.Node ){
				/*if( shape.dockers.length == 1 ){
					return shape.dockers.first()
				} else {*/
					return shape
				//}
			} else if( shape instanceof ORYX.Core.Edge ) {
				
				var dockers = shape.dockers;
				
				if( selection.include( shape.dockers.first().getDockedShape() ) ){
					dockers = dockers.without( shape.dockers.first() )
				}

				if( selection.include( shape.dockers.last().getDockedShape() ) ){
					dockers = dockers.without( shape.dockers.last() )
				}
				
				return dockers	
							
			} else {
				return null
			}
		
		}).flatten().compact();
		
		if (selection.size() > 0) {
			
			//Stop moving at canvas borders
			var selectionBounds = [ this.facade.getCanvas().bounds.lowerRight().x,
			                        this.facade.getCanvas().bounds.lowerRight().y,
			                        0,
			                        0 ];
			selection.each(function(s) {
				selectionBounds[0] = Math.min(selectionBounds[0], s.bounds.upperLeft().x);
				selectionBounds[1] = Math.min(selectionBounds[1], s.bounds.upperLeft().y);
				selectionBounds[2] = Math.max(selectionBounds[2], s.bounds.lowerRight().x);
				selectionBounds[3] = Math.max(selectionBounds[3], s.bounds.lowerRight().y);
			});
			if (selectionBounds[0]+p.x < 0)
				p.x = -selectionBounds[0];
			if (selectionBounds[1]+p.y < 0)
				p.y = -selectionBounds[1];
            
            var shapeDistancesToParentLowerY = selection.map(function(shape) {
                var parent = shape.parent || this.facade.getCanvas();
                return Math.abs(parent.absoluteBounds().lowerRight().y - shape.absoluteBounds().lowerRight().y);
            });
            var minShapeDistanceY = shapeDistancesToParentLowerY.min();
            var shapeDistancesToParentLowerX = selection.map(function(shape) {
                var parent = shape.parent || this.facade.getCanvas();
                return Math.abs(parent.absoluteBounds().lowerRight().x - shape.absoluteBounds().lowerRight().x);
            });
            var minShapeDistanceX = shapeDistancesToParentLowerX.min();
            
			if (p.x > minShapeDistanceX)
				p.x = minShapeDistanceX;
			if (p.y > minShapeDistanceY)
				p.y = minShapeDistanceY;
			
			if (p.x!=0 || p.y!=0) {
				// Instantiate the moveCommand
                var moveShapes = selection.map(function addTargetPositionToShapes(shape) {
                    return { 
                        shape: shape, 
                        origin: shape.absoluteBounds().center(), 
                        target: {'x': shape.absoluteBounds().center().x + p.x, 'y': shape.absoluteBounds().center().y + p.y} 
                    };
                }.bind(this));
				var commands = [new ORYX.Core.Commands["DragDropResize.MoveCommand"](moveShapes, null, currentSelection, this.facade)];
				// Execute the commands			
				this.facade.executeCommands(commands);
			}
			
		}
	}
	
//    /**
//     * The key handler for this plugin. Every action from the set of cut, copy,
//     * paste and delete should be accessible trough simple keyboard shortcuts.
//     * This method checks whether any event triggers one of those actions.
//     *
//     * @param {Object} event The keyboard event that should be analysed for
//     *     triggering of this plugin.
//     */
//    keyHandler: function(event){
//        //TODO document what event.which is.
//        
//        ORYX.Log.debug("keysMove.js handles a keyEvent.");
//        
//        // assure we have the current event.
//        if (!event) 
//            event = window.event;
//        
//        // get the currently pressed key and state of control key.
//        var pressedKey = event.which || event.keyCode;
//        var ctrlPressed = event.ctrlKey;
//
//		// if the key is one of the arrow keys, forward to move and return.
//		if ([ORYX.CONFIG.KEY_CODE_LEFT, ORYX.CONFIG.KEY_CODE_RIGHT,
//			ORYX.CONFIG.KEY_CODE_UP, ORYX.CONFIG.KEY_CODE_DOWN].include(pressedKey)) {
//			
//			this.move(pressedKey, !ctrlPressed);
//			return;
//		}
//		
//    }
	
});
/**
 * Copyright (c) 2009-2010
 * processWave.org (Michael Goderbauer, Markus Goetz, Marvin Killing, Martin
 * Kreichgauer, Martin Krueger, Christian Ress, Thomas Zimmermann)
 *
 * based on oryx-project.org (Martin Czuchra, Nicolas Peters, Daniel Polak,
 * Willi Tscheschner, Oliver Kopp, Philipp Giese, Sven Wagner-Boysen, Philipp Berger, Jan-Felix Schwarz)
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 **/
 
if (!ORYX.Plugins) 
    ORYX.Plugins = new Object();

// Implements the command class for a Shape Rename upon a double click on that shape
ORYX.Core.Commands["RenameShape"] = ORYX.Core.AbstractCommand.extend({
    construct: function construct(shape, propId, oldValue, newValue, facade) {
        arguments.callee.$.construct.call(this, facade);
    
        this.el = shape;
        this.propId = propId;
        this.oldValue = oldValue;
        this.newValue = newValue;
    },
    
    getCommandData: function getCommandData() {
        var commandData = {
           shapeId: this.el.resourceId,
           propId: this.propId,
           oldValue: this.oldValue,
           newValue: this.newValue 
        };
        
        return commandData;
    },
    
    createFromCommandData: function createFromCommandData(facade, commandData) {
        var shape = facade.getCanvas().getChildShapeByResourceId(commandData.shapeId);
        if (typeof shape === 'undefined') {
            return undefined;
        }
        return new ORYX.Core.Commands["RenameShape"](shape, commandData.propId, commandData.oldValue, commandData.newValue, facade);
    },
    
    getAffectedShapes: function getAffectedShapes() {
        return [this.el];
    },
    
    getCommandName: function getCommandName() {
        return "RenameShape";
    },
    
    getDisplayName: function getDisplayName() {
        return "Shape renamed";
    },
    
    execute: function execute() {
        this.el.setProperty(this.propId, this.newValue);
        //this.el.update();
        if (this.isLocal()) {
            this.facade.setSelection([this.el]);
        }
        this.facade.getCanvas().update();
        this.facade.updateSelection(this.isLocal());
    },
    
    rollback: function rollback() {
        this.el.setProperty(this.propId, this.oldValue);
        //this.el.update();
        if (this.isLocal()) {
            this.facade.setSelection([this.el]);
        }
        this.facade.getCanvas().update();
        this.facade.updateSelection(this.isLocal());
    }
});

ORYX.Plugins.RenameShapes = Clazz.extend({

    facade: undefined,
    
    construct: function(facade){
    
        this.facade = facade;
      	
		this.facade.registerOnEvent(ORYX.CONFIG.EVENT_DBLCLICK, this.actOnDBLClick.bind(this));
		this.facade.registerOnEvent(ORYX.CONFIG.EVENT_LABEL_DBLCLICK, this.actOnLabelDblClick.bind(this));
		/* leads to errors on multilableshapes
        this.facade.offer({
		 keyCodes: [{
				keyCode: 113, // F2-Key
				keyAction: ORYX.CONFIG.KEY_ACTION_DOWN 
			}
		 ],
         functionality: this.renamePerF2.bind(this)
         });*/
		
		
		document.documentElement.addEventListener(ORYX.CONFIG.EVENT_MOUSEDOWN, this.hide.bind(this), true ) 
    },
	
	actOnLabelDblClick: function actOnLabelDblClick(event, shape) {
        var label = event.label;
        
        if (!label.editable) {
            return;
        }
        
        // find property the label corresponds to
        if (typeof shape == 'undefined') {
            return;
        }
        // id of label is not autogenerated by oryx, probably not a property label
        if (label.id.indexOf(shape.id) === -1) {
            return;
        }
        var normalizedLabelId = label.id.substr(41).toLowerCase();
        if (typeof shape.properties["oryx-" + normalizedLabelId] === undefined) {
            return;
        }
        
		var properties = this.getEditableProperties(shape);
		var property = this.getPropertyForLabel(properties, shape, label);
		
		if (typeof property === "undefined") {
		    return;
		}
        
        this.showTextField(shape, property, label);
	},
	
	/**
	 * This method handles the "F2" key down event. The selected shape are looked
	 * up and the editing of title/name of it gets started.
	 */
	renamePerF2 : function renamePerF2() {
		var selectedShapes = this.facade.getSelection();
		this.actOnDBLClick(undefined, selectedShapes.first());
	},
	
	getEditableProperties: function getEditableProperties(shape) {
	    // Get all properties which where at least one ref to view is set
		var props = shape.getStencil().properties().findAll(function(item){ 
			return (item.refToView() 
					&&  item.refToView().length > 0
					&&	item.directlyEditable()); 
		});
		
		// from these, get all properties where write access are and the type is String
	    return props.findAll(function(item){ return !item.readonly() &&  item.type() == ORYX.CONFIG.TYPE_STRING });
	},
	
	getPropertyForLabel: function getPropertyForLabel(properties, shape, label) {
	    return properties.find(function(item){ return item.refToView().any(function(toView){ return label.id == shape.id + toView })});
	},
	
	actOnDBLClick: function actOnDBLClick(evt, shape){
		if( !(shape instanceof ORYX.Core.Shape) ){ return }
		
		// Destroys the old input, if there is one
		this.destroy();

		var props = this.getEditableProperties(shape);
		
		// Get all ref ids
		var allRefToViews	= props.collect(function(prop){ return prop.refToView() }).flatten().compact();
		// Get all labels from the shape with the ref ids
		var labels			= shape.getLabels().findAll(function(label){ return allRefToViews.any(function(toView){ return label.id.endsWith(toView) }); })
		
		// If there are no referenced labels --> return
		if( labels.length == 0 ){ return } 
		
		// Define the nearest label
		var nearestLabel 	= labels.length == 1 ? labels[0] : null;	
		if( !nearestLabel ){
		    nearestLabel = labels.find(function(label){ return label.node == evt.target || label.node == evt.target.parentNode })
	        if( !nearestLabel ){
		        var evtCoord 	= this.facade.eventCoordinates(evt);

		        var trans		= this.facade.getCanvas().rootNode.lastChild.getScreenCTM();
		        evtCoord.x		*= trans.a;
		        evtCoord.y		*= trans.d;
			    if (!shape instanceof ORYX.Core.Node) {

			        var diff = labels.collect(function(label){

						        var center 	= this.getCenterPosition( label.node ); 
						        var len 	= Math.sqrt( Math.pow(center.x - evtCoord.x, 2) + Math.pow(center.y - evtCoord.y, 2));
						        return {diff: len, label: label} 
					        }.bind(this));
			
			        diff.sort(function(a, b){ return a.diff > b.diff })	
			
			        nearestLabel = 	diff[0].label;
                } else {

			        var diff = labels.collect(function(label){

						        var center 	= this.getDifferenceCenterForNode( label.node ); 
						        var len 	= Math.sqrt( Math.pow(center.x - evtCoord.x, 2) + Math.pow(center.y - evtCoord.y, 2));
						        return {diff: len, label: label} 
					        }.bind(this));
			
			        diff.sort(function(a, b){ return a.diff > b.diff })	
			
			        nearestLabel = 	diff[0].label;
                }
            }
		}

		// Get the particular property for the label
		var prop = this.getPropertyForLabel(props, shape, nearestLabel);

        this.showTextField(shape, prop, nearestLabel);
	},
	
	showTextField: function showTextField(shape, prop, label) {
		// Set all particular config values
		var htmlCont 	= this.facade.getCanvas().getHTMLContainer().id;
	    
	    // Get the center position from the nearest label
		var width;
		if(!(shape instanceof ORYX.Core.Node)) {
		    var bounds = label.node.getBoundingClientRect();
			width = Math.max(150, bounds.width);
		} else {
			width = shape.bounds.width();
		}
		if (!shape instanceof ORYX.Core.Node) {
		    var center 		= this.getCenterPosition( label.node );
		    center.x		-= (width/2);
        } else {
            var center = shape.absoluteBounds().center();
		    center.x		-= (width/2);
        }
		var propId		= prop.prefix() + "-" + prop.id();

		// Set the config values for the TextField/Area
		var config 		= 	{
								renderTo	: htmlCont,
								value		: shape.properties[propId],
								x			: (center.x < 10) ? 10 : center.x,
								y			: center.y,
								width		: Math.max(100, width),
								style		: 'position:absolute', 
								allowBlank	: prop.optional(), 
								maxLength	: prop.length(),
								emptyText	: prop.title(),
								cls			: 'x_form_text_set_absolute',
                                listeners   : {specialkey: this._specialKeyPressed.bind(this)}
							};
		
		// Depending on the property, generate 
		// ether an TextArea or TextField
		if(prop.wrapLines()) {
			config.y 		-= 30;
			config['grow']	= true;
			this.shownTextField = new Ext.form.TextArea(config);
            this.facade.raiseEvent({
                'type': ORYX.CONFIG.EVENT_DISPLAY_SCHLAUMEIER,
                'message': "Press Shift+Enter to finish text entry."
            });
		} else {
			config.y -= 16;
			
			this.shownTextField = new Ext.form.TextField(config);
		}
		
		//focus
		this.shownTextField.focus();
		
		// Define event handler
		//	Blur 	-> Destroy
		//	Change 	-> Set new values					
		this.shownTextField.on( 'blur', 	this.destroy.bind(this) )
		this.shownTextField.on( 'change', 	function(node, value){
			var currentEl 	= shape;
			var oldValue	= currentEl.properties[propId]; 
			var newValue	= value;
			var facade		= this.facade;
			
			if (oldValue != newValue) {
				var command = new ORYX.Core.Commands["RenameShape"](currentEl, propId, oldValue, newValue, facade);
				this.facade.executeCommands([command]);
			}
		}.bind(this) )

		// Diable the keydown in the editor (that when hitting the delete button, the shapes not get deleted)
		this.facade.disableEvent(ORYX.CONFIG.EVENT_KEYDOWN);
	},
    
    _specialKeyPressed: function _specialKeyPressed(field, e) {
        // Enter or Ctrl+Enter pressed
        var keyCode = e.getKey();
        if (keyCode == 13  && (e.shiftKey || !field.initialConfig.grow)) {
            field.fireEvent("change", null, field.getValue());
            field.fireEvent("blur");
        } else if (keyCode == e.ESC) {
            field.fireEvent("blur");
        }
    },
	
	getCenterPosition: function(svgNode){
		
		var center 		= {x: 0, y:0 };
		// transformation to the coordinate origin of the canvas
		var trans 		= svgNode.getTransformToElement(this.facade.getCanvas().rootNode.lastChild);
		var scale 		= this.facade.getCanvas().rootNode.lastChild.getScreenCTM();
		var transLocal 	= svgNode.getTransformToElement(svgNode.parentNode);
		var bounds = undefined;
		
		center.x 	= trans.e - transLocal.e;
		center.y 	= trans.f - transLocal.f;
		
		
		try {
			bounds = svgNode.getBBox();
		} catch (e) {}

		// Firefox often fails to calculate the correct bounding box
		// in this case we fall back to the upper left corner of the shape
		if (bounds === null || typeof bounds === "undefined" || bounds.width == 0 || bounds.height == 0) {
			bounds = {
				x: Number(svgNode.getAttribute('x')),
				y: Number(svgNode.getAttribute('y')),
				width: 0,
				height: 0
			};
		}
		
		center.x += bounds.x;
		center.y += bounds.y;
		
		center.x += bounds.width/2;
		center.y += bounds.height/2;
		
		center.x *= scale.a;
		center.y *= scale.d;		
		return center;
		
	},

	getDifferenceCenterForNode: function getDifferenceCenterForNode(svgNode){
        //for shapes that do not have multiple lables on the x-line, only the vertical difference matters
        var center  = this.getCenterPosition(svgNode);
        center.x = 0;
        center.y = center.y + 10;
        return center;
    },
	
	hide: function(e){
		if (this.shownTextField && (!e || !this.shownTextField.el || e.target !== this.shownTextField.el.dom)) {
			this.shownTextField.onBlur();
		}
	},
	
	destroy: function(e){
		if( this.shownTextField ){
			this.shownTextField.destroy(); 
			delete this.shownTextField; 
			
			this.facade.enableEvent(ORYX.CONFIG.EVENT_KEYDOWN);
		}
	}
});
/**
 * Copyright (c) 2009-2010
 * processWave.org (Michael Goderbauer, Markus Goetz, Marvin Killing, Martin
 * Kreichgauer, Martin Krueger, Christian Ress, Thomas Zimmermann)
 *
 * based on oryx-project.org (Martin Czuchra, Nicolas Peters, Daniel Polak,
 * Willi Tscheschner, Oliver Kopp, Philipp Giese, Sven Wagner-Boysen, Philipp Berger, Jan-Felix Schwarz)
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 **/

if(!ORYX.Plugins)
	ORYX.Plugins = new Object();

ORYX.Core.Commands["DragDocker.DragDockerCommand"] = ORYX.Core.AbstractCommand.extend({
	construct: function construct(docker, newPos, oldPos, newDockedShape, oldDockedShape, facade){
		// call construct method of parent
        arguments.callee.$.construct.call(this, facade);
        
        this.docker 		= docker;
		this.index			= docker.parent.dockers.indexOf(docker);
		this.newPosition	= newPos;
        this.oldPosition    = oldPos;
		this.newDockedShape = newDockedShape;
        this.oldDockedShape	= oldDockedShape;
		this.facade			= facade;
		this.index			= docker.parent.dockers.indexOf(docker);
		this.shape			= docker.parent;
		
	},		
    
    getAffectedShapes: function getAffectedShapes() {
        return [this.shape];
    },
    
    getCommandName: function getCommandName() {
        return "DragDocker.DragDockerCommand";
    },
    
    getDisplayName: function getDisplayName() {
        return "Docker moved";
    },
    
	getCommandData: function getCommandData() {
		var getId = function(shape) { 
			if (typeof shape !== "undefined") {
				return shape.resourceId
			}				
		};
		var commandData = {
			"dockerId": this.docker.id,
			"index": this.index,
			"newPosition": this.newPosition,
            "oldPosition": this.oldPosition,			
			"newDockedShapeId": getId(this.newDockedShape),
            "oldDockedShapeId": getId(this.oldDockedShape),
			"shapeId": getId(this.shape)
		};
		return commandData;
	},
    
	createFromCommandData: function createFromCommandData(facade, commandData) {
		var canvas = facade.getCanvas();
		var getShape = canvas.getChildShapeByResourceId.bind(canvas);
		var newDockedShape = getShape(commandData.newDockedShapeId);
        if (typeof commandData.newDockedShapeId !== 'undefined' && typeof newDockedShape === 'undefined') {
            // Trying to dock to a shape that doesn't exist anymore.
            return undefined;
        }        
		var oldDockedShape = getShape(commandData.oldDockedShapeId);
		var shape = getShape(commandData.shapeId);
        if (typeof shape === 'undefined') {
            // Trying to move a docker of a shape that doesn't exist anymore.
            return undefined;
        }        
		var docker;
		for (var i = 0; i < shape.dockers.length; i++) {
			if (shape.dockers[i].id == commandData.dockerId) {
				docker = shape.dockers[i];                
			}
		}
		return new ORYX.Core.Commands["DragDocker.DragDockerCommand"](docker, commandData.newPosition, commandData.oldPosition, newDockedShape, oldDockedShape, facade);
	},
    
	execute: function execute(){
        if (typeof this.docker !== "undefined") {
		    if (!this.docker.parent){
			    this.docker = this.shape.dockers[this.index];
		    }
		    this.dock( this.newDockedShape, this.newPosition );
		    // TODO locally deleting dockers might create inconsistent states across clients
		    //this.removedDockers = this.shape.removeUnusedDockers();
		    this.facade.updateSelection(this.isLocal());
        }
	},
    
	rollback: function rollback(){
        if (typeof this.docker !== "undefined") {
		    this.dock( this.oldDockedShape, this.oldPosition );
		    (this.removedDockers||$H({})).each(function(d){
			    this.shape.add(d.value, Number(d.key));
			    this.shape._update(true);
		    }.bind(this))
		    this.facade.updateSelection(this.isLocal());
        }
	},
    
	dock: function dock(toDockShape, relativePosition){
        var relativePos = relativePosition;
        if (typeof toDockShape !== "undefined") {
            /* if docker should be attached to a shape, calculate absolute position, otherwise relativePosition is relative to canvas, i.e. absolute
             values are expected to be between 0 and 1, if faulty values are found, they are set manually - with x = 0.5 and y = 0.5, shape will be docked at center*/
            var absolutePosition = this.facade.getCanvas().node.ownerSVGElement.createSVGPoint();
            if ((0 > relativePos.x) || (relativePos.x > 1) || (0 > relativePos.y) || (relativePos.y > 1)) {
                relativePos.x = 0.5;
                relativePos.y = 0.5;
            } 
            absolutePosition.x = Math.abs(toDockShape.absoluteBounds().lowerRight().x - relativePos.x * toDockShape.bounds.width());
            absolutePosition.y = Math.abs(toDockShape.absoluteBounds().lowerRight().y - relativePos.y * toDockShape.bounds.height());
        } else {
            var absolutePosition = relativePosition;
        }
        //it seems that for docker to be moved, the dockedShape need to be cleared first
        this.docker.setDockedShape(undefined);	
	    //this.docker.setReferencePoint(absolutePosition);			
        this.docker.bounds.centerMoveTo(absolutePosition);
	    this.docker.setDockedShape(toDockShape);	   
	    this.docker.update();	
		this.docker.parent._update();
		this.facade.getCanvas().update();					
	}
});
	
ORYX.Plugins.DragDocker = Clazz.extend({

	/**
	 *	Constructor
	 *	@param {Object} Facade: The Facade of the Editor
	 */
	construct: function(facade) {
		this.facade = facade;
		
		// Set the valid and invalid color
		this.VALIDCOLOR 	= ORYX.CONFIG.SELECTION_VALID_COLOR;
		this.INVALIDCOLOR 	= ORYX.CONFIG.SELECTION_INVALID_COLOR;
		
		// Define Variables 
		this.shapeSelection = undefined;
		this.docker 		= undefined;
		this.dockerParent   = undefined;
		this.dockerSource 	= undefined;
		this.dockerTarget 	= undefined;
		this.lastUIObj 		= undefined;
		this.isStartDocker 	= undefined;
		this.isEndDocker 	= undefined;
		this.undockTreshold	= 10;
		this.initialDockerPosition = undefined;
		this.outerDockerNotMoved = undefined;
		this.isValid 		= false;
		
		// For the Drag and Drop
		// Register on MouseDown-Event on a Docker
		this.facade.registerOnEvent(ORYX.CONFIG.EVENT_MOUSEDOWN, this.handleMouseDown.bind(this));
        this.facade.registerOnEvent(ORYX.CONFIG.EVENT_DOCKERDRAG, this.handleDockerDrag.bind(this));
		
		// Register on over/out to show / hide a docker
		this.facade.registerOnEvent(ORYX.CONFIG.EVENT_MOUSEOVER, this.handleMouseOver.bind(this));
		this.facade.registerOnEvent(ORYX.CONFIG.EVENT_MOUSEOUT, this.handleMouseOut.bind(this));		
		
		
	},
	
    /**
     * DockerDrag Handler
     * delegates the uiEvent of the drag event to the mouseDown function
     */
    handleDockerDrag: function handleDockerDrag(event, uiObj) {
        this.handleMouseDown(event.uiEvent, uiObj);
    },
    
	/**
	 * MouseOut Handler
	 *
	 */
	handleMouseOut: function(event, uiObj) {
		// If there is a Docker, hide this
		if(!this.docker && uiObj instanceof ORYX.Core.Controls.Docker) {
			uiObj.hide()	
		} else if(!this.docker && uiObj instanceof ORYX.Core.Edge) {
			uiObj.dockers.each(function(docker){
				docker.hide();
			})
		}
	},

	/**
	 * MouseOver Handler
	 *
	 */
	handleMouseOver: function(event, uiObj) {
		// If there is a Docker, show this		
		if(!this.docker && uiObj instanceof ORYX.Core.Controls.Docker) {
			uiObj.show()	
		} else if(!this.docker && uiObj instanceof ORYX.Core.Edge) {
			uiObj.dockers.each(function(docker){
				docker.show();
			})
		}
	},
	
	/**
	 * MouseDown Handler
	 *
	 */	
	handleMouseDown: function(event, uiObj) {
		// If there is a Docker
		if(uiObj instanceof ORYX.Core.Controls.Docker && uiObj.isMovable) {
			
			/* Buffering shape selection and clear selection*/
			this.shapeSelection = this.facade.getSelection();
			this.facade.setSelection();
			
			this.docker = uiObj;
			this.initialDockerPosition = this.docker.bounds.center();
			this.outerDockerNotMoved = false;			
			this.dockerParent = uiObj.parent;
			
			// Define command arguments
			this._commandArg = {docker:uiObj, dockedShape:uiObj.getDockedShape(), refPoint:uiObj.referencePoint || uiObj.bounds.center()};

			// Show the Docker
			this.docker.show();
			
			// If the Dockers Parent is an Edge, 
			//  and the Docker is either the first or last Docker of the Edge
			if(uiObj.parent instanceof ORYX.Core.Edge && 
			   	(uiObj.parent.dockers.first() == uiObj || uiObj.parent.dockers.last() == uiObj)) {
				
				// Get the Edge Source or Target
				if(uiObj.parent.dockers.first() == uiObj && uiObj.parent.dockers.last().getDockedShape()) {
					this.dockerTarget = uiObj.parent.dockers.last().getDockedShape()
				} else if(uiObj.parent.dockers.last() == uiObj && uiObj.parent.dockers.first().getDockedShape()) {
					this.dockerSource = uiObj.parent.dockers.first().getDockedShape()
				}
				
			} else {
				// If there parent is not an Edge, undefined the Source and Target
				this.dockerSource = undefined;
				this.dockerTarget = undefined;				
			}
		
			this.isStartDocker = this.docker.parent.dockers.first() === this.docker
			this.isEndDocker = this.docker.parent.dockers.last() === this.docker
					
			// add to canvas while dragging
			this.facade.getCanvas().add(this.docker.parent);
			
			// Hide all Labels from Docker
			this.docker.parent.getLabels().each(function(label) {
				label.hide();
			});
			
			// Undocked the Docker from current Shape
			if ((!this.isStartDocker && !this.isEndDocker) || !this.docker.isDocked()) {
				
				this.docker.setDockedShape(undefined)
				// Set the Docker to the center of the mouse pointer
				var evPos = this.facade.eventCoordinates(event);
				this.docker.bounds.centerMoveTo(evPos);
				//this.docker.update()
				//this.facade.getCanvas().update();
				this.dockerParent._update();
			} else {
				this.outerDockerNotMoved = true;
			}
			
			var option = {movedCallback: this.dockerMoved.bind(this), upCallback: this.dockerMovedFinished.bind(this)}
				
			// Enable the Docker for Drag'n'Drop, give the mouseMove and mouseUp-Callback with
			ORYX.Core.UIEnableDrag(event, uiObj, option);
		}
	},
	
	/**
	 * Docker MouseMove Handler
	 *
	 */
	dockerMoved: function(event) {
		this.outerDockerNotMoved = false;
		var snapToMagnet = undefined;
		
		if (this.docker.parent) {
			if (this.isStartDocker || this.isEndDocker) {
			
				// Get the EventPosition and all Shapes on these point
				var evPos = this.facade.eventCoordinates(event);
				
				if(this.docker.isDocked()) {
					/* Only consider start/end dockers if they are moved over a treshold */
					var distanceDockerPointer = 
						ORYX.Core.Math.getDistancePointToPoint(evPos, this.initialDockerPosition);
					if(distanceDockerPointer < this.undockTreshold) {
						this.outerDockerNotMoved = true;
						return;
					}
					
					/* Undock the docker */
					this.docker.setDockedShape(undefined)
					// Set the Docker to the center of the mouse pointer
					//this.docker.bounds.centerMoveTo(evPos);
					this.dockerParent._update();
				}
				
				var shapes = this.facade.getCanvas().getAbstractShapesAtPosition(evPos);
				
				// Get the top level Shape on these, but not the same as Dockers parent
				var uiObj = shapes.pop();
				if (this.docker.parent === uiObj) {
					uiObj = shapes.pop();
				}
				
				
				
				// If the top level Shape the same as the last Shape, then return
				if (this.lastUIObj == uiObj) {
				//return;
				
				// If the top level uiObj instance of Shape and this isn't the parent of the docker 
				}
				else 
					if (uiObj instanceof ORYX.Core.Shape) {
					
						// Get the StencilSet of the Edge
						var sset = this.docker.parent.getStencil().stencilSet();
						
						// Ask by the StencilSet if the source, the edge and the target valid connections.
						if (this.docker.parent instanceof ORYX.Core.Edge) {
							
							var highestParent = this.getHighestParentBeforeCanvas(uiObj);
							/* Ensure that the shape to dock is not a child shape 
							 * of the same edge.
							 */
							if(highestParent instanceof ORYX.Core.Edge 
									&& this.docker.parent === highestParent) {
								this.isValid = false;
								this.dockerParent._update();
								return;
							}
							this.isValid = false;
							var curObj = uiObj, orgObj = uiObj;
							while(!this.isValid && curObj && !(curObj instanceof ORYX.Core.Canvas)){
								uiObj = curObj;
								this.isValid = this.facade.getRules().canConnect({
											sourceShape: this.dockerSource ? // Is there a docked source 
															this.dockerSource : // than set this
															(this.isStartDocker ? // if not and if the Docker is the start docker
																uiObj : // take the last uiObj
																undefined), // if not set it to undefined;
											edgeShape: this.docker.parent,
											targetShape: this.dockerTarget ? // Is there a docked target 
											this.dockerTarget : // than set this
														(this.isEndDocker ? // if not and if the Docker is not the start docker
															uiObj : // take the last uiObj
															undefined) // if not set it to undefined;
										});
								curObj = curObj.parent;
							}
							
							// Reset uiObj if no 
							// valid parent is found
							if (!this.isValid){
								uiObj = orgObj;
							}

						}
						else {
							this.isValid = this.facade.getRules().canConnect({
								sourceShape: uiObj,
								edgeShape: this.docker.parent,
								targetShape: this.docker.parent
							});
						}
						
						// If there is a lastUIObj, hide the magnets
						if (this.lastUIObj) {
							this.hideMagnets(this.lastUIObj)
						}
						
						// If there is a valid connection, show the magnets
						if (this.isValid) {
							this.showMagnets(uiObj)
						}
						
						// Set the Highlight Rectangle by these value
						this.showHighlight(uiObj, this.isValid ? this.VALIDCOLOR : this.INVALIDCOLOR);
						
						// Buffer the current Shape
						this.lastUIObj = uiObj;
					}
					else {
						// If there is no top level Shape, then hide the highligting of the last Shape
						this.hideHighlight();
						this.lastUIObj ? this.hideMagnets(this.lastUIObj) : null;
						this.lastUIObj = undefined;
						this.isValid = false;
					}
				
				// Snap to the nearest Magnet
				if (this.lastUIObj && this.isValid && !(event.shiftKey || event.ctrlKey)) {
					snapToMagnet = this.lastUIObj.magnets.find(function(magnet){
						return magnet.absoluteBounds().isIncluded(evPos)
					});
					
					if (snapToMagnet) {
						this.docker.bounds.centerMoveTo(snapToMagnet.absoluteCenterXY());
					//this.docker.update()
					}
				}
			}
		}
		// Snap to on the nearest Docker of the same parent
		if(!(event.shiftKey || event.ctrlKey) && !snapToMagnet) {
			var minOffset = ORYX.CONFIG.DOCKER_SNAP_OFFSET;
			var nearestX = minOffset + 1
			var nearestY = minOffset + 1
			
			var dockerCenter = this.docker.bounds.center();
			
			if (this.docker.parent) {
				
				this.docker.parent.dockers.each((function(docker){
					if (this.docker == docker) {
						return
					};
					
					var center = docker.referencePoint ? docker.getAbsoluteReferencePoint() : docker.bounds.center();
					
					nearestX = Math.abs(nearestX) > Math.abs(center.x - dockerCenter.x) ? center.x - dockerCenter.x : nearestX;
					nearestY = Math.abs(nearestY) > Math.abs(center.y - dockerCenter.y) ? center.y - dockerCenter.y : nearestY;
					
					
				}).bind(this));
				
				if (Math.abs(nearestX) < minOffset || Math.abs(nearestY) < minOffset) {
					nearestX = Math.abs(nearestX) < minOffset ? nearestX : 0;
					nearestY = Math.abs(nearestY) < minOffset ? nearestY : 0;
					
					this.docker.bounds.centerMoveTo(dockerCenter.x + nearestX, dockerCenter.y + nearestY);
					//this.docker.update()
				} else {
					
					
					
					var previous = this.docker.parent.dockers[Math.max(this.docker.parent.dockers.indexOf(this.docker)-1, 0)]
					var next = this.docker.parent.dockers[Math.min(this.docker.parent.dockers.indexOf(this.docker)+1, this.docker.parent.dockers.length-1)]
					
					if (previous && next && previous !== this.docker && next !== this.docker){
						var cp = previous.bounds.center();
						var cn = next.bounds.center();
						var cd = this.docker.bounds.center();
						
						// Checks if the point is on the line between previous and next
						if (ORYX.Core.Math.isPointInLine(cd.x, cd.y, cp.x, cp.y, cn.x, cn.y, 10)) {
							// Get the rise
							var raise = (Number(cn.y)-Number(cp.y))/(Number(cn.x)-Number(cp.x));
							// Calculate the intersection point
							var intersecX = ((cp.y-(cp.x*raise))-(cd.y-(cd.x*(-Math.pow(raise,-1)))))/((-Math.pow(raise,-1))-raise);
							var intersecY = (cp.y-(cp.x*raise))+(raise*intersecX);
							
							if(isNaN(intersecX) || isNaN(intersecY)) {return;}
							
							this.docker.bounds.centerMoveTo(intersecX, intersecY);
						}
					}
					
				}
			}
		}
		//this.facade.getCanvas().update();
		this.dockerParent._update();
	},

	/**
	 * Docker MouseUp Handler
	 *
	 */
	dockerMovedFinished: function(event) {
        // check if parent edge still exists on canvas, skip if not 
        var currentShape = this.facade.getCanvas().getChildShapeByResourceId(this.dockerParent.resourceId);
        if (typeof currentShape !== "undefined") {     
		    /* Reset to buffered shape selection */
		    this.facade.setSelection(this.shapeSelection);
		
		    // Hide the border
		    this.hideHighlight();
		
		    // Show all Labels from Docker
		    this.dockerParent.getLabels().each(function(label){
			    label.show();
			    //label.update();
		    });
	
		    // If there is a last top level Shape
		    if(this.lastUIObj && (this.isStartDocker || this.isEndDocker)){				
			    // If there is a valid connection, the set as a docked Shape to them
			    if(this.isValid) {

				    this.docker.setDockedShape(this.lastUIObj);	
				    this.facade.raiseEvent({
					    type 	:ORYX.CONFIG.EVENT_DRAGDOCKER_DOCKED, 
					    docker	: this.docker,
					    parent	: this.docker.parent,
					    target	: this.lastUIObj
				    });
			    }
			
			    this.hideMagnets(this.lastUIObj)
		    }
		
		    // Hide the Docker
		    this.docker.hide();
		
		    if(this.outerDockerNotMoved) {
			    // Get the EventPosition and all Shapes on these point
			    var evPos = this.facade.eventCoordinates(event);
			    var shapes = this.facade.getCanvas().getAbstractShapesAtPosition(evPos);
			
			    /* Remove edges from selection */
			    var shapeWithoutEdges = shapes.findAll(function(node) {
				    return node instanceof ORYX.Core.Node;
			    });
			    shapes = shapeWithoutEdges.length ? shapeWithoutEdges : shapes;
			    this.facade.setSelection(shapes);
		    } else {
			    if (this.docker.parent){
                    var oldDockedShape = this._commandArg.dockedShape;
                    var newPositionAbsolute = this.docker.bounds.center();
                    var oldPositionAbsolute = this._commandArg.refPoint;
                    var newDockedShape = this.docker.getDockedShape();               
                    if (typeof newDockedShape !== "undefined") {
	                    var newPositionRelative = this.facade.getCanvas().node.ownerSVGElement.createSVGPoint();
	                    newPositionRelative.x = Math.abs((newDockedShape.bounds.lowerRight().x - newPositionAbsolute.x) / newDockedShape.bounds.width());
	                    newPositionRelative.y = Math.abs((newDockedShape.bounds.lowerRight().y - newPositionAbsolute.y) / newDockedShape.bounds.height());
                    } else {
                        // if newDockedShape is not defined, i.e. it is the canvas, use absolutePositions, because positions relative to the canvas are absolute
                        newPositionRelative = newPositionAbsolute;
                    }

                    if (typeof oldDockedShape !== "undefined") {
                        var oldPositionRelative = this.facade.getCanvas().node.ownerSVGElement.createSVGPoint();
                        oldPositionRelative.x = Math.abs((oldDockedShape.bounds.lowerRight().x - oldPositionAbsolute.x) / oldDockedShape.bounds.width());
                        oldPositionRelative.y = Math.abs((oldDockedShape.bounds.lowerRight().y - oldPositionAbsolute.y) / oldDockedShape.bounds.height());
                    } else {
                        // if oldDockedShape is not defined, i.e. it is the canvas, use absolutePositions, because positions relative to the canvas are absolute
                        oldPositionRelative = oldPositionAbsolute;
                    }

			        // instanciate the dockCommand
			        var command = new ORYX.Core.Commands["DragDocker.DragDockerCommand"](this.docker, newPositionRelative, oldPositionRelative, newDockedShape, oldDockedShape, this.facade);
			        this.facade.executeCommands([command]);    
	    		}
            }
		}	

		// Update all Shapes
		//this.facade.updateSelection();
			
		// Undefined all variables
		this.docker 		= undefined;
		this.dockerParent   = undefined;
		this.dockerSource 	= undefined;
		this.dockerTarget 	= undefined;	
		this.lastUIObj 		= undefined;		
	},
	
	/**
	 * Hide the highlighting
	 */
	hideHighlight: function() {
		this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_HIGHLIGHT_HIDE, highlightId:'validDockedShape'});
	},

	/**
	 * Show the highlighting
	 *
	 */
	showHighlight: function(uiObj, color) {
		
		this.facade.raiseEvent({
										type:		ORYX.CONFIG.EVENT_HIGHLIGHT_SHOW, 
										highlightId:'validDockedShape',
										elements:	[uiObj],
										color:		color
									});
	},
	
	showMagnets: function(uiObj){
		uiObj.magnets.each(function(magnet) {
			magnet.show();
		});
	},
	
	hideMagnets: function(uiObj){
		uiObj.magnets.each(function(magnet) {
			magnet.hide();
		});
	},
	
	getHighestParentBeforeCanvas: function(shape) {
		if(!(shape instanceof ORYX.Core.Shape)) {return undefined;}
		
		var parent = shape.parent;
		while(parent && !(parent.parent instanceof ORYX.Core.Canvas)) {
			parent = parent.parent;
		}	
		
		return parent;		
	}	

});

/**
 * Copyright (c) 2009-2010
 * processWave.org (Michael Goderbauer, Markus Goetz, Marvin Killing, Martin
 * Kreichgauer, Martin Krueger, Christian Ress, Thomas Zimmermann)
 *
 * based on oryx-project.org (Martin Czuchra, Nicolas Peters, Daniel Polak,
 * Willi Tscheschner, Oliver Kopp, Philipp Giese, Sven Wagner-Boysen, Philipp Berger, Jan-Felix Schwarz)
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 **/
 
if (!ORYX.Plugins) 
    ORYX.Plugins = new Object();

ORYX.Plugins.Edit = Clazz.extend({
    
    construct: function(facade){
    
        this.facade = facade;
        this.clipboard = new ORYX.Plugins.Edit.ClipBoard(facade);
        this.shapesToDelete = [];

        this.facade.registerOnEvent(ORYX.CONFIG.EVENT_DRAGDROP_END, this.handleDragEnd.bind(this));
        this.facade.registerOnEvent(ORYX.CONFIG.EVENT_SHAPESTODELETE, this.handleShapesToDelete.bind(this));       

        
        this.facade.offer({
         name: ORYX.I18N.Edit.cut,
         description: ORYX.I18N.Edit.cutDesc,
         iconCls: 'pw-toolbar-button pw-toolbar-cut',
		 keyCodes: [{
				metaKeys: [ORYX.CONFIG.META_KEY_META_CTRL],
				keyCode: 88,
				keyAction: ORYX.CONFIG.KEY_ACTION_DOWN
			}
		 ],
         functionality: this.callEdit.bind(this, this.editCut),
         isEnabled: function() { return !this.facade.isReadOnlyMode(); }.bind(this),
         group: ORYX.I18N.Edit.group,
         index: 1,
         minShape: 1,
         visibleInViewMode: false
         });
         
        this.facade.offer({
         name: ORYX.I18N.Edit.copy,
         description: ORYX.I18N.Edit.copyDesc,
         iconCls: 'pw-toolbar-button pw-toolbar-copy',
		 keyCodes: [{
				metaKeys: [ORYX.CONFIG.META_KEY_META_CTRL],
				keyCode: 67,
				keyAction: ORYX.CONFIG.KEY_ACTION_DOWN
			}
		 ],
         functionality: this.callEdit.bind(this, this.editCopy, [true, false]),
         isEnabled: function() { return !this.facade.isReadOnlyMode(); }.bind(this),
         group: ORYX.I18N.Edit.group,
         index: 2,
         minShape: 1,
         visibleInViewMode: false
         });
         
        this.facade.offer({
         name: ORYX.I18N.Edit.paste,
         description: ORYX.I18N.Edit.pasteDesc,
         iconCls: 'pw-toolbar-button pw-toolbar-paste',
		 keyCodes: [{
				metaKeys: [ORYX.CONFIG.META_KEY_META_CTRL],
				keyCode: 86,
				keyAction: ORYX.CONFIG.KEY_ACTION_DOWN
			}
		 ],
         functionality: this.callEdit.bind(this, this.editPaste),
         isEnabled: function() { return !this.facade.isReadOnlyMode() && this.clipboard.isOccupied; }.bind(this),
         group: ORYX.I18N.Edit.group,
         index: 3,
         minShape: 0,
         maxShape: 0,
         visibleInViewMode: false
        });
         
        this.facade.offer({
            name: ORYX.I18N.Edit.del,
            description: ORYX.I18N.Edit.delDesc,
            iconCls: 'pw-toolbar-button pw-toolbar-delete',
			keyCodes: [{
					metaKeys: [ORYX.CONFIG.META_KEY_META_CTRL],
					keyCode: 8,
					keyAction: ORYX.CONFIG.KEY_ACTION_DOWN
				},
				{	
					keyCode: 46,
					keyAction: ORYX.CONFIG.KEY_ACTION_DOWN
				}
			],
            functionality: this.callEdit.bind(this, this.editDelete),
            group: ORYX.I18N.Edit.group,
            index: 4,
            minShape: 1,
            visibleInViewMode: false
        });
    },
	
	callEdit: function(fn, args){
		window.setTimeout(function(){
			fn.apply(this, (args instanceof Array ? args : []));
		}.bind(this), 1);
	},

    handleShapesToDelete: function handleShapesToDelete(event) {
        this.shapesToDelete = this.shapesToDelete.concat(event.deletedShapes);
    },

    handleDragEnd: function handleDragEnd(event) {
        //shapes whose selection were not updated because they were dragged are stored in shapesToDelete
        //delete shapes from shapesToDelete from selection/canvas after dragging is finished
        var selectedShapes = this.facade.getSelection();
        for (var i = 0; i < this.shapesToDelete.length; i++) {
            this.facade.deleteShape(this.shapesToDelete[i]);
            selectedShapes = selectedShapes.without(this.shapesToDelete[i]);
        }
        this.shapesToDelete = [];
        this.facade.setSelection(selectedShapes);
        this.facade.getCanvas().update();
        this.facade.updateSelection();
    },
	
	/**
	 * Handles the mouse down event and starts the copy-move-paste action, if
	 * control or meta key is pressed.
	 */
	handleMouseDown: function(event) {
		if(this._controlPressed) {
			this._controlPressed = false;
			this.editCopy();
			this.editPaste();
			event.forceExecution = true;
			this.facade.raiseEvent(event, this.clipboard.shapesAsJson);
			
		}
	},

    /**
     * Returns a list of shapes which should be considered while copying.
     * Besides the shapes of given ones, edges and attached nodes are added to the result set.
     * If one of the given shape is a child of another given shape, it is not put into the result. 
     */
    getAllShapesToConsider: function(shapes){
        var shapesToConsider = []; // only top-level shapes
        var childShapesToConsider = []; // all child shapes of top-level shapes
        
        shapes.each(function(shape){
            //Throw away these shapes which have a parent in given shapes
            isChildShapeOfAnother = shapes.any(function(s2){
                return s2.hasChildShape(shape);
            });
            if(isChildShapeOfAnother) return;
            
            // This shape should be considered
            shapesToConsider.push(shape);
            // Consider attached nodes (e.g. intermediate events)
            if (shape instanceof ORYX.Core.Node) {
				var attached = shape.getOutgoingNodes();
				attached = attached.findAll(function(a){ return !shapes.include(a) });
                shapesToConsider = shapesToConsider.concat(attached);
            }
            
            childShapesToConsider = childShapesToConsider.concat(shape.getChildShapes(true));
        }.bind(this));
        
        // All edges between considered child shapes should be considered
        // Look for these edges having incoming and outgoing in childShapesToConsider
        var edgesToConsider = this.facade.getCanvas().getChildEdges().select(function(edge){
            // Ignore if already added
            if(shapesToConsider.include(edge)) return false;
            // Ignore if there are no docked shapes
            if(edge.getAllDockedShapes().size() === 0) return false; 
            // True if all docked shapes are in considered child shapes
            return edge.getAllDockedShapes().all(function(shape){
                // Remember: Edges can have other edges on outgoing, that is why edges must not be included in childShapesToConsider
                return shape instanceof ORYX.Core.Edge || childShapesToConsider.include(shape);
            });
        });
        shapesToConsider = shapesToConsider.concat(edgesToConsider);
        
        return shapesToConsider;
    },
    
    /**
     * Performs the cut operation by first copy-ing and then deleting the
     * current selection.
     */
    editCut: function(){
        //TODO document why this returns false.
        //TODO document what the magic boolean parameters are supposed to do.
        
        this.editCopy(false, true);
        this.editDelete(true);
        return false;
    },
    
    /**
     * Performs the copy operation.
     * @param {Object} will_not_update ??
     */
    editCopy: function( will_update, useNoOffset ){
        var selection = this.facade.getSelection();
        
        //if the selection is empty, do not remove the previously copied elements
        if(selection.length == 0) return;
        
        this.clipboard.refresh(selection, this.getAllShapesToConsider(selection), this.facade.getCanvas().getStencil().stencilSet().namespace(), useNoOffset);

        if( will_update ) this.facade.updateSelection(true);
    },
    
    /**
     * Performs the paste operation.
     */
    editPaste: function(){
        // Create a new canvas with childShapes 
		//and stencilset namespace to be JSON Import conform
		var canvas = {
            childShapes: this.clipboard.shapesAsJson,
			stencilset:{
				namespace:this.clipboard.SSnamespace
			}
        }
        // Apply json helper to iterate over json object
        Ext.apply(canvas, ORYX.Core.AbstractShape.JSONHelper);
        
        var childShapeResourceIds =  canvas.getChildShapes(true).pluck("resourceId");
        var outgoings = {};
        // Iterate over all shapes
        canvas.eachChild(function(shape, parent){
            // Throw away these references where referenced shape isn't copied
            shape.outgoing = shape.outgoing.select(function(out){
                return childShapeResourceIds.include(out.resourceId);
            });
			shape.outgoing.each(function(out){
				if (!outgoings[out.resourceId]){ outgoings[out.resourceId] = [] }
				outgoings[out.resourceId].push(shape)
			});
			
            return shape;
        }.bind(this), true, true);
        

        // Iterate over all shapes
        canvas.eachChild(function(shape, parent){
            
        	// Check if there has a valid target
            if(shape.target && !(childShapeResourceIds.include(shape.target.resourceId))){
                shape.target = undefined;
                shape.targetRemoved = true;
            }
    		
    		// Check if the first docker is removed
    		if(	shape.dockers && 
    			shape.dockers.length >= 1 && 
    			shape.dockers[0].getDocker &&
    			((shape.dockers[0].getDocker().getDockedShape() &&
    			!childShapeResourceIds.include(shape.dockers[0].getDocker().getDockedShape().resourceId)) || 
    			!shape.getShape().dockers[0].getDockedShape()&&!outgoings[shape.resourceId])) {
    				
    			shape.sourceRemoved = true;
    		}
			
            return shape;
        }.bind(this), true, true);

		
        // Iterate over top-level shapes
        canvas.eachChild(function(shape, parent){
            // All top-level shapes should get an offset in their bounds
            // Move the shape occording to COPY_MOVE_OFFSET
        	if (this.clipboard.useOffset) {
	            shape.bounds = {
	                lowerRight: {
	                    x: shape.bounds.lowerRight.x + ORYX.CONFIG.COPY_MOVE_OFFSET,
	                    y: shape.bounds.lowerRight.y + ORYX.CONFIG.COPY_MOVE_OFFSET
	                },
	                upperLeft: {
	                    x: shape.bounds.upperLeft.x + ORYX.CONFIG.COPY_MOVE_OFFSET,
	                    y: shape.bounds.upperLeft.y + ORYX.CONFIG.COPY_MOVE_OFFSET
	                }
	            };
        	}
            // Only apply offset to shapes with a target
            if (shape.dockers){
                shape.dockers = shape.dockers.map(function(docker, i){
                    // If shape had a target but the copied does not have anyone anymore,
                    // migrate the relative dockers to absolute ones.
                    if( (shape.targetRemoved === true && i == shape.dockers.length - 1&&docker.getDocker) ||
						(shape.sourceRemoved === true && i == 0&&docker.getDocker)){
                        var id = docker.id;
                        docker = docker.getDocker().bounds.center();
                        docker.id = id;
                    }

					// If it is the first docker and it has a docked shape, 
					// just return the coordinates
				   	if ((i == 0 && docker.getDocker instanceof Function && 
				   		shape.sourceRemoved !== true && (docker.getDocker().getDockedShape() || ((outgoings[shape.resourceId]||[]).length > 0 && (!(shape.getShape() instanceof ORYX.Core.Node) || outgoings[shape.resourceId][0].getShape() instanceof ORYX.Core.Node)))) || 
						(i == shape.dockers.length - 1 && docker.getDocker instanceof Function && 
						shape.targetRemoved !== true && (docker.getDocker().getDockedShape() || shape.target))){
							
						return {
                        	'x': docker.x, 
                        	'y': docker.y,
                        	'getDocker': docker.getDocker,
                            'id': docker.id
						}
					} else if (this.clipboard.useOffset) {
	                    return {
		                        'x': docker.x + ORYX.CONFIG.COPY_MOVE_OFFSET, 
		                        'y': docker.y + ORYX.CONFIG.COPY_MOVE_OFFSET,
	                        	'getDocker': docker.getDocker,
                                'id': docker.id
		                    };
				   	} else {
				   		return {
                        	'x': docker.x, 
                        	'y': docker.y,
                        	'getDocker': docker.getDocker,
                            'id': docker.id
						};
				   	}
                }.bind(this));

            } else if (shape.getShape() instanceof ORYX.Core.Node && shape.dockers && shape.dockers.length > 0 && (!shape.dockers.first().getDocker || shape.sourceRemoved === true || !(shape.dockers.first().getDocker().getDockedShape() || outgoings[shape.resourceId]))){
            	
            	shape.dockers = shape.dockers.map(function(docker, i){
            		
                    if((shape.sourceRemoved === true && i == 0&&docker.getDocker)){
                        var id = docker.id;
                    	docker = docker.getDocker().bounds.center();
                        docker.id = id;
                    }
                    
                    if (this.clipboard.useOffset) {
	            		return {
	                        'x': docker.x + ORYX.CONFIG.COPY_MOVE_OFFSET, 
	                        'y': docker.y + ORYX.CONFIG.COPY_MOVE_OFFSET,
	                    	'getDocker': docker.getDocker,
                            'id': docker.id
	                    };
                    } else {
	            		return {
	                        'x': docker.x, 
	                        'y': docker.y,
	                    	'getDocker': docker.getDocker,
                            'id': docker.id
	                    };
                    }
            	}.bind(this));
            }
            
            return shape;
        }.bind(this), false, true);

        this.clipboard.useOffset = true;
        this.facade.importJSON(canvas);
    },
    
    /**
     * Performs the delete operation. No more asking.
     */
    editDelete: function(){
        var selection = this.facade.getSelection();
        
        var clipboard = new ORYX.Plugins.Edit.ClipBoard();
        clipboard.refresh(selection, this.getAllShapesToConsider(selection));
        
        if (clipboard.shapesAsJson.length > 0) {       
            var command = new ORYX.Core.Commands["Edit.DeleteCommand"](clipboard , this.facade);                                       
            this.facade.executeCommands([command]);
        }
    }
}); 

ORYX.Plugins.Edit.ClipBoard = Clazz.extend({
    construct: function(facade){
        this.shapesAsJson = [];
        this.selection = [];
		this.SSnamespace="";
		this.useOffset=true;
    },
    
    isOccupied: function(){
        return this.shapesAsJson.length > 0;
    },

    refresh: function(selection, shapes, namespace, useNoOffset){
        this.selection = selection;
        this.SSnamespace=namespace;
        // Store outgoings, targets and parents to restore them later on
        this.outgoings = {};
        this.parents = {};
        this.targets = {};
        this.useOffset = useNoOffset !== true;
        
        this.shapesAsJson = shapes.map(function(shape){
            var s = shape.toJSON();
            s.parent = {resourceId : shape.getParentShape().resourceId};
            s.parentIndex = shape.getParentShape().getChildShapes().indexOf(shape)
            return s;
        });
    }
});

ORYX.Core.Commands["Edit.DeleteCommand"] = ORYX.Core.AbstractCommand.extend({
    construct: function construct(clipboard, facade) {
        arguments.callee.$.construct.call(this, facade);
        
        this.clipboard          = clipboard;
        this.shapesAsJson       = clipboard.shapesAsJson;

        var newShapesAsJson = [];
        //add type and namespace to shapesAsJsonEntries
        for (var i = 0; i < this.shapesAsJson.length; i++) {
            var shapeAsJson = this.shapesAsJson[i];
            var shape = this.facade.getCanvas().getChildShapeByResourceId(shapeAsJson.resourceId);
            if (typeof shape !== "undefined") {
                var stencil = shape.getStencil();
                shapeAsJson.type = stencil.type();
                shapeAsJson.namespace = stencil.namespace();
                newShapesAsJson.push(shapeAsJson);
            }
        }

        this.shapesAsJson = newShapesAsJson;

        // Store dockers of deleted shapes to restore connections
        this.dockers            = this.shapesAsJson.map(function(shapeAsJson){
            var shape = facade.getCanvas().getChildShapeByResourceId(shapeAsJson.resourceId);
            if (typeof shape !== "undefined") {

                var incomingDockers = shape.getIncomingShapes().map(function(s){return s.getDockers().last()})
                var outgoingDockers = shape.getOutgoingShapes().map(function(s){return s.getDockers().first()})
                var dockers = shape.getDockers().concat(incomingDockers, outgoingDockers).compact().map(function(docker) {
                    return {
                        object: docker,
                        referencePoint: docker.referencePoint,
                        dockedShape: docker.getDockedShape()
                    };
                });
                return dockers;
            } else {
                return [];
            }
        }).flatten();
    },          
    execute: function execute() {
        var deletedShapes = [];
        var selectedShapes = this.facade.getSelection();
        for (var i = 0; i < this.shapesAsJson.length; i++) {
            var shapeAsJson = this.shapesAsJson[i];
            // Delete shape
            var shape = this.facade.getCanvas().getChildShapeByResourceId(shapeAsJson.resourceId);
            if (typeof shape !== "undefined") {
                deletedShapes.push(shape);

                this.facade.raiseEvent(
                    {
                        "type": ORYX.CONFIG.EVENT_SHAPEDELETED, 
                        "shape": shape
                    }
                );
                this.facade.deleteShape(shape);
            } else {
                ORYX.Log.warn("Trying to delete deleted shape.");
            }
        }
        if (this.isLocal()) {
            this.facade.getCanvas().update();
            this.facade.setSelection([]);
        } else {
            var newSelectedShapes = selectedShapes;
            for (var i = 0; i < deletedShapes.length; i++) {
                newSelectedShapes = newSelectedShapes.without(deletedShapes[i]);
            }
            var isDragging = this.facade.isDragging();
            if (!isDragging) {
                this.facade.setSelection(newSelectedShapes);
            } else {
                //raise event, which assures, that selection and canvas will be updated after dragging is finished
                this.facade.raiseEvent(
                    {
                        "type": ORYX.CONFIG.EVENT_SHAPESTODELETE, 
                        "deletedShapes": deletedShapes
                    }
                );  	
            }
            this.facade.getCanvas().update();
            this.facade.updateSelection(this.isLocal());
        }        
    },
    rollback: function rollback(){
        var selectedShapes = [];
        for (var i = 0; i < this.shapesAsJson.length; i++) {
            var shapeAsJson = this.shapesAsJson[i];
            var shape = shapeAsJson.getShape();
            selectedShapes.push(shape);
            var parent = this.facade.getCanvas().getChildShapeByResourceId(shapeAsJson.parent.resourceId) || this.facade.getCanvas();
            parent.add(shape, shape.parentIndex);
        }
        
        //reconnect shapes
        this.dockers.each(function(d) {
            d.object.setDockedShape(d.dockedShape);
            d.object.setReferencePoint(d.referencePoint);
        }.bind(this));
        this.facade.getCanvas().update();	
        this.facade.updateSelection(this.isLocal());
    },
    
    getCommandData: function getCommandData() {

        var options = {
            shapes: this.shapesAsJson
        };
        
        return options;
    },
    
    createFromCommandData: function createFromCommandData(facade, commandData) {
        var clipboard = new ORYX.Plugins.Edit.ClipBoard(facade);
        var getShape = function getShape(resourceId) {
            var shape = facade.getCanvas().getChildShapeByResourceId(resourceId);
            return shape;
        } 
        
        clipboard.shapesAsJson = commandData.shapes;        
        // Checking if at least one shape that has to be deleted still exists
        var shapesExist = false;
        for (var i = 0; i < clipboard.shapesAsJson.length; i++) {
            var resourceId = clipboard.shapesAsJson[i].resourceId;
            if (typeof facade.getCanvas().getChildShapeByResourceId(resourceId) !== 'undefined') {
                shapesExist = true;
                break;
            }
        }
        if (!shapesExist) {
            return undefined;
        }
        
        clipboard.shapesAsJson.each(function injectGetShape(shapeAsJson) {
           shapeAsJson.template = shapeAsJson.properties;
           shapeAsJson.shapeOptions = { resourceId: shapeAsJson.resourceId };
           var shape = getShape(shapeAsJson.resourceId);
           shapeAsJson.getShape = function() { 
               return shape;
           };
        });
        return new ORYX.Core.Commands["Edit.DeleteCommand"](clipboard, facade);
    },
    
    getCommandName: function getCommandName() {
        return "Edit.DeleteCommand";
    },
    
    getDisplayName: function getDisplayName() {
        return "Shape deleted";
    },
    
    getAffectedShapes: function getAffectedShapes() {
        return this.shapesAsJson.map(function (shapeAsJson) {
            return shapeAsJson.getShape();
//            return this.facade.getCanvas().getChildShapeByResourceId(shapeAsJson.resourceId);
        }.bind(this));
    }
});

ORYX.Core.Commands["Main.JsonImport"] = ORYX.Core.AbstractCommand.extend({
    construct: function(jsonObject, loadSerializedCB, noSelectionAfterImport, facade){
        arguments.callee.$.construct.call(this, facade);
    
        this.jsonObject = jsonObject;
        this.noSelection = noSelectionAfterImport;
        this.shapes;
        this.connections = [];
        this.parents = new Hash();
        this.selection = this.facade.getSelection();
        this.loadSerialized = loadSerializedCB;
    },
    
    getAffectedShapes: function getAffectedShapes() {
        if (this.shapes) {
            return this.shapes;
        }
        return [];
    },
    
    getCommandData: function getCommandData() {
        return {"jsonObject": this.jsonObject};
    },
    
    createFromCommandData: function createFromCommandData(facade, data) {
        return new ORYX.Core.Commands["Main.JsonImport"](data.jsonObject, facade.loadSerialized, true, facade);
    },
    
    getCommandName: function getCommandName() {
        return "Main.JsonImport";
    },
    
    getDisplayName: function getDisplayName() {
        return "Shape pasted";
    },
    
    execute: function(){        
        if (!this.shapes) {
            // Import the shapes out of the serialization		
            this.shapes	= this.loadSerialized( this.jsonObject );		
            
            //store all connections
            this.shapes.each(function(shape) {
                
                if (shape.getDockers) {
                    var dockers = shape.getDockers();
                    if (dockers) {
                        if (dockers.length > 0) {
                            this.connections.push([dockers.first(), dockers.first().getDockedShape(), dockers.first().referencePoint]);
                        }
                        if (dockers.length > 1) {
                            this.connections.push([dockers.last(), dockers.last().getDockedShape(), dockers.last().referencePoint]);
                        }
                    }
                }
                
                //store parents
                this.parents[shape.id] = shape.parent;
            }.bind(this));
        } else {
            this.shapes.each(function(shape) {
                this.parents[shape.id].add(shape);
            }.bind(this));
            
            this.connections.each(function(con) {
                con[0].setDockedShape(con[1]);
                con[0].setReferencePoint(con[2]);
                //con[0].update();
            });
        }
        
        //this.parents.values().uniq().invoke("update");
        this.facade.getCanvas().update();
            
        if(!this.noSelection)
            this.facade.setSelection(this.shapes);
        else
            this.facade.updateSelection(true);
    },
        
    rollback: function(){
        var selection = this.facade.getSelection();
        
        this.shapes.each(function(shape) {
            selection = selection.without(shape);
            this.facade.deleteShape(shape);
        }.bind(this));
        
        this.facade.getCanvas().update();
        
        this.facade.setSelection(selection);
    }
});
/**
 * Copyright (c) 2009-2010
 * processWave.org (Michael Goderbauer, Markus Goetz, Marvin Killing, Martin
 * Kreichgauer, Martin Krueger, Christian Ress, Thomas Zimmermann)
 *
 * based on oryx-project.org (Martin Czuchra, Nicolas Peters, Daniel Polak,
 * Willi Tscheschner, Oliver Kopp, Philipp Giese, Sven Wagner-Boysen, Philipp Berger, Jan-Felix Schwarz)
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 **/

 if(!ORYX.Plugins)
	ORYX.Plugins = new Object();

ORYX.Plugins.BPMN2_0 = {

	/**
	 *	Constructor
	 *	@param {Object} Facade: The Facade of the Editor
	 */
	construct: function(facade){
		this.facade = facade;
		
		this.facade.registerOnEvent(ORYX.CONFIG.EVENT_DRAGDOCKER_DOCKED, this.handleDockerDocked.bind(this));
		this.facade.registerOnEvent(ORYX.CONFIG.EVENT_PROPWINDOW_PROP_CHANGED, this.handlePropertyChanged.bind(this));
		this.facade.registerOnEvent('layout.bpmn2_0.pool', this.handleLayoutPool.bind(this));
		this.facade.registerOnEvent('layout.bpmn2_0.subprocess', this.handleSubProcess.bind(this));
		this.facade.registerOnEvent(ORYX.CONFIG.EVENT_AFTER_COMMANDS_EXECUTED, this.onCommandExecuted.bind(this));
		
		this.facade.registerOnEvent(ORYX.CONFIG.EVENT_LOADED, this.afterLoad.bind(this));
		
		//this.facade.registerOnEvent('layout.bpmn11.lane', this.handleLayoutLane.bind(this));
	},
	
	/**
	 * Force to update every pool
	 */
	afterLoad: function(){
		this.facade.getCanvas().getChildNodes().each(function(shape){
			if (shape.getStencil().id().endsWith("Pool")) {
				this.handleLayoutPool({
					shape: shape
				});
			}
		}.bind(this))
	},

	onCommandExecuted: function(event) {
        if (event.commands.length < 1) {
            return;
        }
        var command = event.commands[0];
        if ((typeof command.metadata !== "undefined") && (command.metadata.name === "ShapeRepository.DropCommand")) {
            var shape = command.shape;
            if ((typeof shape !== "undefined") && (shape.getStencil().idWithoutNs() === "Pool")) {
				if(shape.getChildNodes().length === 0) {
					// create a lane inside the selected pool
					var option = {
							type: "http://b3mn.org/stencilset/bpmn2.0#Lane",
							position: {x:0,y:0},
							namespace: shape.getStencil().namespace(),
							parent: shape,
                            shapeOptions: {
                                id: shape.id + "_lane",
                                resourceId: shape.resourceId + "_lane"
                            } 
					};
					var newLane = this.facade.createShape(option);
                    newLane.metadata.changedBy.push(command.getCreatorId());
                    newLane.metadata.changedAt.push(command.getCreatedAt());
                    newLane.metadata.commands.push(command.getDisplayName());
                    this.facade.raiseEvent({
                        'type': ORYX.CONFIG.EVENT_SHAPE_METADATA_CHANGED,
                        'shape': newLane
                    });
					this.facade.getCanvas().update();
				}
            }
        }
	},
	
	/**
	 * If a pool is selected and contains no lane,
	 * a lane is created automagically
	 */
	/*onSelectionChanged: function(event) {
		if(event.elements && event.elements.length === 1) {
			var shape = event.elements[0];
			if(shape.getStencil().idWithoutNs() === "Pool") {
				if(shape.getChildNodes().length === 0) {
					// create a lane inside the selected pool
					var option = {
							type: "http://b3mn.org/stencilset/bpmn2.0#Lane",
							position: {x:0,y:0},
							namespace: shape.getStencil().namespace(),
							parent: shape,
                            shapeOptions: {
                                id: shape.id + "_lane",
                                resourceId: shape.resourceId + "_lane"
                            } 
					};
					this.facade.createShape(option);
					this.facade.getCanvas().update();
				}
			}
		}
	},*/
	
	hashedSubProcesses: {},
	
	handleSubProcess : function(option) {
		
		var sh = option.shape;
		
		if (!this.hashedSubProcesses[sh.resourceId]) {
			this.hashedSubProcesses[sh.resourceId] = sh.bounds.clone();
			return;
		}
		
		var offset = sh.bounds.upperLeft();
		offset.x -= this.hashedSubProcesses[sh.resourceId].upperLeft().x;
		offset.y -= this.hashedSubProcesses[sh.resourceId].upperLeft().y;
		
		this.hashedSubProcesses[sh.resourceId] = sh.bounds.clone();
		
		this.moveChildDockers(sh, offset);
		
	},
	
	moveChildDockers: function(shape, offset){
		
		if (!offset.x && !offset.y) {
			return;
		} 
		
		// Get all nodes
		shape.getChildNodes(true)
			// Get all incoming and outgoing edges
			.map(function(node){
				return [].concat(node.getIncomingShapes())
						.concat(node.getOutgoingShapes())
			})
			// Flatten all including arrays into one
			.flatten()
			// Get every edge only once
			.uniq()
			// Get all dockers
			.map(function(edge){
				return edge.dockers.length > 2 ? 
						edge.dockers.slice(1, edge.dockers.length-1) : 
						[];
			})
			// Flatten the dockers lists
			.flatten()
			.each(function(docker){
				if (docker.isChanged){ return }
				docker.bounds.moveBy(offset);
			})
	},
	
	/**
	 * DragDocker.Docked Handler
	 *
	 */	
	handleDockerDocked: function(options) {
		var edge = options.parent;
		var edgeSource = options.target;
		
		if(edge.getStencil().id() === "http://b3mn.org/stencilset/bpmn2.0#SequenceFlow") {
			var isGateway = edgeSource.getStencil().groups().find(function(group) {
					if(group == "Gateways") 
						return group;
				});
			if(!isGateway && (edge.properties["oryx-conditiontype"] == "Expression"))
				// show diamond on edge source
				edge.setProperty("oryx-showdiamondmarker", true);
			else 
				// do not show diamond on edge source
				edge.setProperty("oryx-showdiamondmarker", false);
			
			// update edge rendering
			//edge.update();
			
			this.facade.getCanvas().update();
		}
	},
	
	/**
	 * PropertyWindow.PropertyChanged Handler
	 */
	handlePropertyChanged: function(option) {
		
		var shapes = option.elements;
		var propertyKey = option.key;
		var propertyValue = option.value;
		
		var changed = false;
		shapes.each(function(shape){
			if((shape.getStencil().id() === "http://b3mn.org/stencilset/bpmn2.0#SequenceFlow") &&
				(propertyKey === "oryx-conditiontype")) {
				
				if(propertyValue != "Expression")
					// Do not show the Diamond
					shape.setProperty("oryx-showdiamondmarker", false);
				else {
					var incomingShapes = shape.getIncomingShapes();
					
					if(!incomingShapes) {
						shape.setProperty("oryx-showdiamondmarker", true);
					}
					
					var incomingGateway = incomingShapes.find(function(aShape) {
						var foundGateway = aShape.getStencil().groups().find(function(group) {
							if(group == "Gateways") 
								return group;
						});
						if(foundGateway)
							return foundGateway;
					});
					
					if(!incomingGateway) 
						// show diamond on edge source
						shape.setProperty("oryx-showdiamondmarker", true);
					else
						// do not show diamond
						shape.setProperty("oryx-showdiamondmarker", false);
				}
				
				changed = true;
			}
		});
		
		if(changed) {this.facade.getCanvas().update();}
		
	},
	
	hashedPoolPositions : {},
	hashedLaneDepth : {},
	hashedBounds : {},
	
	/**
	 * Handler for layouting event 'layout.bpmn2_0.pool'
	 * @param {Object} event
	 */
	handleLayoutPool: function(event){
		
		var pool = event.shape;
		var selection = this.facade.getSelection(); 
		var currentShape = selection.first();
		
		currentShape = currentShape || pool;
		
		this.currentPool = pool;
		
		// Check if it is a pool or a lane
		if (!(currentShape.getStencil().id().endsWith("Pool") || currentShape.getStencil().id().endsWith("Lane"))) {
			return;
		}
		
		if (!this.hashedBounds[pool.resourceId]) {
			this.hashedBounds[pool.resourceId] = {};
		}
		
		// Find all child lanes
		var lanes = this.getLanes(pool);
		
		if (lanes.length <= 0) {
			return
		}
		
		// Show/hide caption regarding the number of lanes
		if (lanes.length === 1 && this.getLanes(lanes.first()).length <= 0) {
			// TRUE if there is a caption
			lanes.first().setProperty("oryx-showcaption", lanes.first().properties["oryx-name"].trim().length > 0);
			var rect = lanes.first().node.getElementsByTagName("rect");
			rect[0].setAttributeNS(null, "display", "none");
		} else {
			lanes.invoke("setProperty", "oryx-showcaption", true);
			lanes.each(function(lane){
				var rect = lane.node.getElementsByTagName("rect");
				rect[0].removeAttributeNS(null, "display");
			})
		}
		
		
		
		var allLanes = this.getLanes(pool, true);
		
		var deletedLanes = [];
		var addedLanes = [];
		
		// Get all new lanes
		var i=-1;
		while (++i<allLanes.length) {
			if (!this.hashedBounds[pool.resourceId][allLanes[i].resourceId]){
				addedLanes.push(allLanes[i])
			}
		}
		
		if (addedLanes.length > 0){
			currentShape = addedLanes.first();
		}
		
		
		// Get all deleted lanes
		var resourceIds = $H(this.hashedBounds[pool.resourceId]).keys();
		var i=-1;
		while (++i<resourceIds.length) {
			if (!allLanes.any(function(lane){ return lane.resourceId == resourceIds[i]})){
				deletedLanes.push(this.hashedBounds[pool.resourceId][resourceIds[i]]);
				selection = selection.without(function(r){ return r.resourceId == resourceIds[i] });
			}
		}		
				
		var height, width;
		
		if (deletedLanes.length > 0 || addedLanes.length > 0) {
			
			// Set height from the pool
			height = this.updateHeight(pool);
			// Set width from the pool
			width = this.adjustWidth(lanes, pool.bounds.width());	
			
			pool.update();
		}
		
		/**
		 * Set width/height depending on the pool
		 */
		else if (pool == currentShape) {
			
			// Set height from the pool
			height = this.adjustHeight(lanes, undefined, pool.bounds.height());
			// Set width from the pool
			width = this.adjustWidth(lanes, pool.bounds.width());		
		}
		
		/**‚
		 * Set width/height depending on containing lanes
		 */		
		else {
			// Get height and adjust child heights
			height = this.adjustHeight(lanes, currentShape);
			// Set width from the current shape
			width = this.adjustWidth(lanes, currentShape.bounds.width()+(this.getDepth(currentShape,pool)*30));
		}
		

		this.setDimensions(pool, width, height);
		
		
		
		// Update all dockers
		this.updateDockers(allLanes, pool);
		
		this.hashedBounds[pool.resourceId] = {};
		
		var i=-1;
		while (++i < allLanes.length) {
			// Cache positions
			this.hashedBounds[pool.resourceId][allLanes[i].resourceId] = allLanes[i].absoluteBounds();
			
			this.hashedLaneDepth[allLanes[i].resourceId] = this.getDepth(allLanes[i], pool);
			
			this.forceToUpdateLane(allLanes[i]);
		}
		
		this.hashedPoolPositions[pool.resourceId] = pool.bounds.clone();
		
		
		// Update selection
		//this.facade.setSelection(selection);		
	},
	forceToUpdateLane: function(lane){
		
		if (lane.bounds.height() !== lane._svgShapes[0].height) {	
			lane.isChanged = true;
			lane.isResized = true;
			lane._update();
		}
	},
	
	getDepth: function(child, parent){
		
		var i=0;
		while(child && child.parent && child !== parent){
			child = child.parent;
			++i
		}
		return i;
	},
	
	updateDepth: function(lane, fromDepth, toDepth){
		
		var xOffset = (fromDepth - toDepth) * 30;
		
		lane.getChildNodes().each(function(shape){
			shape.bounds.moveBy(xOffset, 0);
			
			[].concat(children[j].getIncomingShapes())
					.concat(children[j].getOutgoingShapes())
					
		})
		
	},
	
	setDimensions: function(shape, width, height){
		var isLane = shape.getStencil().id().endsWith("Lane");
		// Set the bounds
		shape.bounds.set(
				isLane ? 30 : shape.bounds.a.x, 
				shape.bounds.a.y, 
				width	? shape.bounds.a.x + width - (isLane?30:0) : shape.bounds.b.x, 
				height 	? shape.bounds.a.y + height : shape.bounds.b.y
			);
	},

	setLanePosition: function(shape, y){
		shape.bounds.moveTo(30, y);
	},
		
	adjustWidth: function(lanes, width) {
		
		// Set width to each lane
		(lanes||[]).each(function(lane){
			this.setDimensions(lane, width);
			this.adjustWidth(this.getLanes(lane), width-30);
		}.bind(this));
		
		return width;
	},
	
	
	adjustHeight: function(lanes, changedLane, propagateHeight){
		
		var oldHeight = 0;
		if (!changedLane && propagateHeight){
			var i=-1;
			while (++i<lanes.length){	
				oldHeight += lanes[i].bounds.height();		
			}
		}
		
		var i=-1;
		var height = 0;
		
		// Iterate trough every lane
		while (++i<lanes.length){
			
			if (lanes[i] === changedLane) {
				// Propagate new height down to the children
				this.adjustHeight(this.getLanes(lanes[i]), undefined, lanes[i].bounds.height());
				
				lanes[i].bounds.set({x:30, y:height}, {x:lanes[i].bounds.width()+30, y:lanes[i].bounds.height()+height})
								
			} else if (!changedLane && propagateHeight) {
				
				var tempHeight = (lanes[i].bounds.height() * propagateHeight) / oldHeight;
				// Propagate height
				this.adjustHeight(this.getLanes(lanes[i]), undefined, tempHeight);
				// Set height propotional to the propagated and old height
				this.setDimensions(lanes[i], null, tempHeight);
				this.setLanePosition(lanes[i], height);
			} else {
				// Get height from children
				var tempHeight = this.adjustHeight(this.getLanes(lanes[i]), changedLane, propagateHeight);
				if (!tempHeight) {
					tempHeight = lanes[i].bounds.height();
				}
				this.setDimensions(lanes[i], null, tempHeight);
				this.setLanePosition(lanes[i], height);
			}
			
			height += lanes[i].bounds.height();
		}
		
		return height;
		
	},
	
	
	updateHeight: function(root){
		
		var lanes = this.getLanes(root);
		
		if (lanes.length == 0){
			return root.bounds.height();
		}
		
		var height = 0;
		var i=-1;
		while (++i < lanes.length) {
			this.setLanePosition(lanes[i], height);
			height += this.updateHeight(lanes[i]);
		}
		
		this.setDimensions(root, null, height);
		
		return height;
	},
	
	getOffset: function(lane, includePool, pool){
		
		var offset = {x:0,y:0};
		
		
		/*var parent = lane; 
		 while(parent) {
		 				
			
			var offParent = this.hashedBounds[pool.resourceId][parent.resourceId] ||(includePool === true ? this.hashedPoolPositions[parent.resourceId] : undefined);
			if (offParent){
				var ul = parent.bounds.upperLeft();
				var ulo = offParent.upperLeft();
				offset.x += ul.x-ulo.x;
				offset.y += ul.y-ulo.y;
			}
			
			if (parent.getStencil().id().endsWith("Pool")) {
				break;
			}
			
			parent = parent.parent;
		}	*/
		
		var offset = lane.absoluteXY();
		
		var hashed = this.hashedBounds[pool.resourceId][lane.resourceId] ||(includePool === true ? this.hashedPoolPositions[lane.resourceId] : undefined);
		if (hashed) {
			offset.x -= hashed.upperLeft().x; 	
			offset.y -= hashed.upperLeft().y;		
		} else {
			return {x:0,y:0}
		}		
		return offset;
	},
	
	getNextLane: function(shape){
		while(shape && !shape.getStencil().id().endsWith("Lane")){
			if (shape instanceof ORYX.Core.Canvas) {
				return null;
			}
			shape = shape.parent;
		}
		return shape;
	},
	
	getParentPool: function(shape){
		while(shape && !shape.getStencil().id().endsWith("Pool")){
			if (shape instanceof ORYX.Core.Canvas) {
				return null;
			}
			shape = shape.parent;
		}
		return shape;
	},
	updateDockers: function(lanes, pool){
		
		var absPool = pool.absoluteBounds();
		var oldPool = (this.hashedPoolPositions[pool.resourceId]||absPool).clone();
		
		var i=-1, j=-1, k=-1, l=-1, docker;
		var dockers = {};
		
		while (++i < lanes.length) {
			
			if (!this.hashedBounds[pool.resourceId][lanes[i].resourceId]) {
				continue;
			}
			
			var children = lanes[i].getChildNodes();
			var absBounds = lanes[i].absoluteBounds();
			var oldBounds = (this.hashedBounds[pool.resourceId][lanes[i].resourceId]||absBounds);
			//oldBounds.moveBy((absBounds.upperLeft().x-lanes[i].bounds.upperLeft().x), (absBounds.upperLeft().y-lanes[i].bounds.upperLeft().y));
			var offset = this.getOffset(lanes[i], true, pool);
			var xOffsetDepth = 0;

			var depth = this.getDepth(lanes[i], pool);
			if ( this.hashedLaneDepth[lanes[i].resourceId] !== undefined &&  this.hashedLaneDepth[lanes[i].resourceId] !== depth) {
				xOffsetDepth = (this.hashedLaneDepth[lanes[i].resourceId] - depth) * 30;
				offset.x += xOffsetDepth;
			}
			
			j=-1;
			
			while (++j < children.length) {
				
				if (xOffsetDepth) {
					children[j].bounds.moveBy(xOffsetDepth, 0);
				}
				
				if (children[j].getStencil().id().endsWith("Subprocess")) {
					this.moveChildDockers(children[j], offset);
				}
				
				var edges = [].concat(children[j].getIncomingShapes())
					.concat(children[j].getOutgoingShapes())
					// Remove all edges which are included in the selection from the list
					.findAll(function(r){ return r instanceof ORYX.Core.Edge })

				k=-1;
				while (++k < edges.length) {			
					
					if (edges[k].getStencil().id().endsWith("MessageFlow")) {
						this.layoutEdges(children[j], [edges[k]], offset);
						continue;
					}
					
					l=-1;
					while (++l < edges[k].dockers.length) {
						
						docker = edges[k].dockers[l];
						
						if (docker.getDockedShape()||docker.isChanged){
							continue;
						}
					
					
						pos = docker.bounds.center();
						
						// Check if the modified center included the new position
						var isOverLane = oldBounds.isIncluded(pos);
						// Check if the original center is over the pool
						var isOutSidePool = !oldPool.isIncluded(pos);
						var previousIsOverLane = l == 0 ? isOverLane : oldBounds.isIncluded(edges[k].dockers[l-1].bounds.center());
						var nextIsOverLane = l == edges[k].dockers.length-1 ? isOverLane : oldBounds.isIncluded(edges[k].dockers[l+1].bounds.center());
						
						
						// Check if the previous dockers docked shape is from this lane
						// Otherwise, check if the docker is over the lane OR is outside the lane 
						// but the previous/next was over this lane
						if (isOverLane){
							dockers[docker.id] = {docker: docker, offset:offset};
						} 
						/*else if (l == 1 && edges[k].dockers.length>2 && edges[k].dockers[l-1].isDocked()){
							var dockedLane = this.getNextLane(edges[k].dockers[l-1].getDockedShape());
							if (dockedLane != lanes[i])
								continue;
							dockers[docker.id] = {docker: docker, offset:offset};
						}
						// Check if the next dockers docked shape is from this lane
						else if (l == edges[k].dockers.length-2 && edges[k].dockers.length>2 && edges[k].dockers[l+1].isDocked()){
							var dockedLane = this.getNextLane(edges[k].dockers[l+1].getDockedShape());
							if (dockedLane != lanes[i])
								continue;
							dockers[docker.id] = {docker: docker, offset:offset};
						}
												
						else if (isOutSidePool) {
							dockers[docker.id] = {docker: docker, offset:this.getOffset(lanes[i], true, pool)};
						}*/
						
					
					}
				}
						
			}
		}
		
		// Set dockers
		i=-1;
		var keys = $H(dockers).keys();
		while (++i < keys.length) {
			dockers[keys[i]].docker.bounds.moveBy(dockers[keys[i]].offset);
		}
	},
	
	moveBy: function(pos, offset){
		pos.x += offset.x;
		pos.y += offset.y;
		return pos;
	},
	
	getHashedBounds: function(shape){
		return this.currentPool && this.hashedBounds[this.currentPool.resourceId][shape.resourceId] ? this.hashedBounds[this.currentPool.resourceId][shape.resourceId] : shape.bounds.clone();
	},
	
	/**
	 * Returns a set on all child lanes for the given Shape. If recursive is TRUE, also indirect children will be returned (default is FALSE)
	 * The set is sorted with first child the lowest y-coordinate and the last one the highest.
	 * @param {ORYX.Core.Shape} shape
	 * @param {boolean} recursive
	 */
	getLanes: function(shape, recursive){
		var lanes = shape.getChildNodes(recursive||false).findAll(function(node) { return (node.getStencil().id() === "http://b3mn.org/stencilset/bpmn2.0#Lane"); });
		lanes = lanes.sort(function(a, b){
					// Get y coordinate
					var ay = Math.round(a.bounds.upperLeft().y);
					var by = Math.round(b.bounds.upperLeft().y);
					
					// If equal, than use the old one
					if (ay == by) {
						ay = Math.round(this.getHashedBounds(a).upperLeft().y);
						by = Math.round(this.getHashedBounds(b).upperLeft().y);
					}
					return  ay < by ? -1 : (ay > by ? 1 : 0)
				}.bind(this))
		return lanes;
	}
	
};
	
ORYX.Plugins.BPMN2_0 = ORYX.Plugins.AbstractPlugin.extend(ORYX.Plugins.BPMN2_0);
/**
 * Copyright (c) 2009-2010
 * processWave.org (Michael Goderbauer, Markus Goetz, Marvin Killing, Martin
 * Kreichgauer, Martin Krueger, Christian Ress, Thomas Zimmermann)
 *
 * based on oryx-project.org (Martin Czuchra, Nicolas Peters, Daniel Polak,
 * Willi Tscheschner, Oliver Kopp, Philipp Giese, Sven Wagner-Boysen, Philipp Berger, Jan-Felix Schwarz)
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 **/

if(!ORYX.Plugins)
	ORYX.Plugins = new Object();

 ORYX.Plugins.SelectionFrame = Clazz.extend({

	construct: function(facade) {
		this.facade = facade;

		// Register on MouseEvents
		this.facade.registerOnEvent(ORYX.CONFIG.EVENT_MOUSEDOWN, this.handleMouseDown.bind(this));
		document.documentElement.addEventListener(ORYX.CONFIG.EVENT_MOUSEUP, this.handleMouseUp.bind(this), true);

		// Some initiale variables
		this.position 		= {x:0, y:0};
		this.size 			= {width:0, height:0};
		this.offsetPosition = {x: 0, y: 0}

		// (Un)Register Mouse-Move Event
		this.moveCallback 	= undefined;
		this.offsetScroll	= {x:0,y:0}
		// HTML-Node of Selection-Frame
		this.node = ORYX.Editor.graft("http://www.w3.org/1999/xhtml", this.facade.getCanvas().getHTMLContainer(),
			['div', {'class':'Oryx_SelectionFrame'}]);

		this.hide();
	},

	handleMouseDown: function(event, uiObj) {
		// If there is the Canvas
		if( uiObj instanceof ORYX.Core.Canvas ) {
			// Calculate the Offset
			var scrollNode = uiObj.rootNode.parentNode.parentNode;
						
			var a = this.facade.getCanvas().node.getScreenCTM();
			this.offsetPosition = {
				x: a.e,
				y: a.f
			}

			// Set the new Position
			this.setPos({x: Event.pointerX(event)-this.offsetPosition.x, y:Event.pointerY(event)-this.offsetPosition.y});
			// Reset the size
			this.resize({width:0, height:0});
			this.moveCallback = this.handleMouseMove.bind(this);
		
			// Register Mouse-Move Event
			document.documentElement.addEventListener(ORYX.CONFIG.EVENT_MOUSEMOVE, this.moveCallback, false);

			this.offsetScroll		= {x:scrollNode.scrollLeft,y:scrollNode.scrollTop};
			
			// Show the Frame
			this.show();
		}

		Event.stop(event);
	},

	handleMouseUp: function(event) {
		// If there was an MouseMoving
		if(this.moveCallback) {
			// Hide the Frame
			this.hide();

			// Unregister Mouse-Move
			document.documentElement.removeEventListener(ORYX.CONFIG.EVENT_MOUSEMOVE, this.moveCallback, false);			
		
			this.moveCallback = undefined;

			var corrSVG = this.facade.getCanvas().node.getScreenCTM();

			// Calculate the positions of the Frame
			var a = {
				x: this.size.width > 0 ? this.position.x : this.position.x + this.size.width,
				y: this.size.height > 0 ? this.position.y : this.position.y + this.size.height
			}

			var b = {
				x: a.x + Math.abs(this.size.width),
				y: a.y + Math.abs(this.size.height)
			}

			// Fit to SVG-Coordinates
			a.x /= corrSVG.a; a.y /= corrSVG.d;
			b.x /= corrSVG.a; b.y /= corrSVG.d;


			// Calculate the elements from the childs of the canvas
			var elements = this.facade.getCanvas().getChildShapes(true).findAll(function(value) {
				var absBounds = value.absoluteBounds();
				var bA = absBounds.upperLeft();
				var bB = absBounds.lowerRight();
				return (bA.x > a.x && bA.y > a.y && bB.x < b.x && bB.y < b.y);
			});
			this.facade.setSelection(elements, undefined, undefined, true);
		}
	},

	handleMouseMove: function(event) {
		// Calculate the size
		var size = {
			width	: Event.pointerX(event) - this.position.x - this.offsetPosition.x,
			height	: Event.pointerY(event) - this.position.y - this.offsetPosition.y
		}

		var scrollNode 	= this.facade.getCanvas().rootNode.parentNode.parentNode;
		size.width 		-= this.offsetScroll.x - scrollNode.scrollLeft; 
		size.height 	-= this.offsetScroll.y - scrollNode.scrollTop;
						
		// Set the size
		this.resize(size);

		Event.stop(event);
	},

	hide: function() {
		this.node.style.display = "none";
	},

	show: function() {
		this.node.style.display = "";
	},

	setPos: function(pos) {
		// Set the Position
		this.node.style.top = pos.y + "px";
		this.node.style.left = pos.x + "px";
		this.position = pos;
	},

	resize: function(size) {

		// Calculate the negative offset
		this.setPos(this.position);
		this.size = Object.clone(size);
		
		if(size.width < 0) {
			this.node.style.left = (this.position.x + size.width) + "px";
			size.width = - size.width;
		}
		if(size.height < 0) {
			this.node.style.top = (this.position.y + size.height) + "px";
			size.height = - size.height;
		}

		// Set the size
		this.node.style.width = size.width + "px";
		this.node.style.height = size.height + "px";
	}

});
