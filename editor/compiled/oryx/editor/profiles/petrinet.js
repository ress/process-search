if(!ORYX.Plugins){ORYX.Plugins=new Object()
}ORYX.Core.Commands["DragDropResize.DockCommand"]=ORYX.Core.AbstractCommand.extend({construct:function construct(d,a,c,b){arguments.callee.$.construct.call(this,b);
this.docker=d;
this.newPosition=a;
this.newDockedShape=c;
this.newParent=c.parent||b.getCanvas();
this.newParent=c.parent||b.getCanvas();
this.oldDockedShape=d.getDockedShape();
if(typeof this.oldDockedShape==="undefined"){this.oldPosition=d.parent.bounds.center()
}else{this.oldPosition=this.facade.getCanvas().node.ownerSVGElement.createSVGPoint();
this.oldPosition.x=Math.abs((this.oldDockedShape.absoluteBounds().lowerRight().x-d.parent.absoluteBounds().center().x)/this.oldDockedShape.bounds.width());
this.oldPosition.y=Math.abs((this.oldDockedShape.absoluteBounds().lowerRight().y-d.parent.absoluteBounds().center().y)/this.oldDockedShape.bounds.height())
}this.oldParent=d.parent.parent||b.getCanvas();
this.facade=b
},execute:function execute(){this.dock(this.newDockedShape,this.newParent,this.newPosition);
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_ARRANGEMENTLIGHT_TOP,shape:this.docker.parent})
},rollback:function rollback(){this.dock(this.oldDockedShape,this.oldParent,this.oldPosition)
},getCommandName:function getCommandName(){return"DragDropResize.DockCommand"
},getDisplayName:function getDisplayName(){return"Event docked"
},dock:function(a,d,c){var e=c;
if(typeof a!=="undefined"){var b=this.facade.getCanvas().node.ownerSVGElement.createSVGPoint();
if((0>e.x)||(e.x>1)||(0>e.y)||(e.y>1)){e.x=0;
e.y=0
}b.x=Math.abs(a.absoluteBounds().lowerRight().x-e.x*a.bounds.width());
b.y=Math.abs(a.absoluteBounds().lowerRight().y-e.y*a.bounds.height())
}else{var b=c
}d.add(this.docker.parent);
this.docker.setDockedShape(undefined);
this.docker.bounds.centerMoveTo(b);
this.docker.setDockedShape(a);
if(this.isLocal()){this.facade.setSelection([this.docker.parent])
}this.facade.getCanvas().update();
this.facade.updateSelection(this.isLocal())
},getCommandData:function getCommandData(){var a=function(c){var d;
if(typeof c!=="undefined"){d=c.id
}return d
};
var b={dockerParentId:this.docker.parent.resourceId,newPosition:this.newPosition,newDockedShapeId:this.newDockedShape.resourceId};
return b
},createFromCommandData:function jsonDeserialize(j,f){var c,g,h,b;
var a=j.getCanvas();
h=a.getChildShapeByResourceId(f.newDockedShapeId);
if(typeof h==="undefined"){return undefined
}g=a.getChildShapeByResourceId(f.dockerParentId);
b=a.node.ownerSVGElement.createSVGPoint();
b.x=f.newPosition.x;
b.y=f.newPosition.y;
for(var e=0;
e<h.dockers.length;
e++){if(h.dockers[e].id==f.dockerId){c=h.dockers[e]
}}var d=new ORYX.Core.Commands["DragDropResize.DockCommand"](g.dockers[0],b,h,j);
return d
},getAffectedShapes:function getAffectedShapes(){return[this.docker.parent]
}});
ORYX.Plugins.DragDropResize=ORYX.Plugins.AbstractPlugin.extend({construct:function(b){this.facade=b;
this.currentShapes=[];
this.toMoveShapes=[];
this.distPoints=[];
this.isResizing=false;
this.dragEnable=false;
this.dragIntialized=false;
this.edgesMovable=true;
this.offSetPosition={x:0,y:0};
this.faktorXY={x:1,y:1};
this.containmentParentNode;
this.isAddingAllowed=false;
this.isAttachingAllowed=false;
this.callbackMouseMove=this.handleMouseMove.bind(this);
this.callbackMouseUp=this.handleMouseUp.bind(this);
var a=this.facade.getCanvas().getSvgContainer();
this.selectedRect=new ORYX.Plugins.SelectedRect(a);
if(ORYX.CONFIG.SHOW_GRIDLINE){this.vLine=new ORYX.Plugins.GridLine(a,ORYX.Plugins.GridLine.DIR_VERTICAL);
this.hLine=new ORYX.Plugins.GridLine(a,ORYX.Plugins.GridLine.DIR_HORIZONTAL)
}a=this.facade.getCanvas().getHTMLContainer();
this.scrollNode=this.facade.getCanvas().rootNode.parentNode.parentNode;
this.resizerSE=new ORYX.Plugins.Resizer(a,"southeast",this.facade);
this.resizerSE.registerOnResize(this.onResize.bind(this));
this.resizerSE.registerOnResizeEnd(this.onResizeEnd.bind(this,"southeast"));
this.resizerSE.registerOnResizeStart(this.onResizeStart.bind(this));
this.resizerNW=new ORYX.Plugins.Resizer(a,"northwest",this.facade);
this.resizerNW.registerOnResize(this.onResize.bind(this));
this.resizerNW.registerOnResizeEnd(this.onResizeEnd.bind(this,"northwest"));
this.resizerNW.registerOnResizeStart(this.onResizeStart.bind(this));
this.facade.registerOnEvent(ORYX.CONFIG.EVENT_MOUSEDOWN,this.handleMouseDown.bind(this));
this.facade.registerOnEvent(ORYX.CONFIG.EVENT_CANVAS_RESIZE_SHAPES_MOVED,this.onCanvasResizeShapesMoved.bind(this))
},handleLayoutEdges:function(a){this.layoutEdges(a.node,a.edges,a.offset)
},handleMouseDown:function(d,c){if(!this.dragBounds||!this.currentShapes.member(c)||!this.toMoveShapes.length){return
}this.dragEnable=true;
this.dragIntialized=true;
this.edgesMovable=true;
var b=this.facade.getCanvas().node.getScreenCTM();
this.faktorXY.x=b.a;
this.faktorXY.y=b.d;
var e=this.dragBounds.upperLeft();
this.offSetPosition={x:Event.pointerX(d)-(e.x*this.faktorXY.x),y:Event.pointerY(d)-(e.y*this.faktorXY.y)};
this.offsetScroll={x:this.scrollNode.scrollLeft,y:this.scrollNode.scrollTop};
document.documentElement.addEventListener(ORYX.CONFIG.EVENT_MOUSEMOVE,this.callbackMouseMove,false);
document.documentElement.addEventListener(ORYX.CONFIG.EVENT_MOUSEUP,this.callbackMouseUp,true)
},handleMouseUp:function(d){this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_HIGHLIGHT_HIDE,highlightId:"dragdropresize.contain"});
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_HIGHLIGHT_HIDE,highlightId:"dragdropresize.attached"});
if(this.dragEnable){var a=this.calculateDragPosition(d);
this.dragBounds.moveTo(a);
if(!this.dragIntialized){this.afterDrag();
if(this.isAttachingAllowed&&this.toMoveShapes.length==1&&this.toMoveShapes[0] instanceof ORYX.Core.Node&&this.toMoveShapes[0].dockers.length>0){var a=this.facade.eventCoordinates(d);
var c=this.containmentParentNode;
var b=this.facade.getCanvas().node.ownerSVGElement.createSVGPoint();
b.x=(c.absoluteBounds().lowerRight().x-a.x)/c.bounds.width();
b.y=(c.absoluteBounds().lowerRight().y-a.y)/c.bounds.height();
var e=this.toMoveShapes[0].dockers[0];
var f=new ORYX.Core.Commands["DragDropResize.DockCommand"](e,b,this.containmentParentNode,this.facade);
this.facade.executeCommands([f])
}else{if(this.isAddingAllowed){this.refreshSelectedShapes()
}}this.facade.updateSelection(true);
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_DRAGDROP_END})
}if(this.vLine){this.vLine.hide()
}if(this.hLine){this.hLine.hide()
}this.facade.updateSelection(true)
}this.dragEnable=false;
document.documentElement.removeEventListener(ORYX.CONFIG.EVENT_MOUSEUP,this.callbackMouseUp,true);
document.documentElement.removeEventListener(ORYX.CONFIG.EVENT_MOUSEMOVE,this.callbackMouseMove,false)
},handleMouseMove:function(e){if(!this.dragEnable){return
}if(this.dragIntialized){this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_DRAGDROP_START});
this.dragIntialized=false;
this.resizerSE.hide();
this.resizerNW.hide();
this._onlyEdges=this.currentShapes.all(function(f){return(f instanceof ORYX.Core.Edge)
});
this.beforeDrag();
this._currentUnderlyingNodes=[]
}var a=this.calculateDragPosition(e);
this.dragBounds.moveTo(a);
this.resizeRectangle(this.dragBounds);
this.isAttachingAllowed=false;
var b=$A(this.facade.getCanvas().getAbstractShapesAtPosition(this.facade.eventCoordinates(e)));
var d=this.toMoveShapes.length==1&&this.toMoveShapes[0] instanceof ORYX.Core.Node&&this.toMoveShapes[0].dockers.length>0;
d=d&&b.length!=1;
if(!d&&b.length===this._currentUnderlyingNodes.length&&b.all(function(g,f){return this._currentUnderlyingNodes[f]===g
}.bind(this))){return
}else{if(this._onlyEdges){this.isAddingAllowed=true;
this.containmentParentNode=this.facade.getCanvas()
}else{var c={event:e,underlyingNodes:b,checkIfAttachable:d};
this.checkRules(c)
}}this._currentUnderlyingNodes=b.reverse();
if(this.isAttachingAllowed){this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_HIGHLIGHT_SHOW,highlightId:"dragdropresize.attached",elements:[this.containmentParentNode],style:ORYX.CONFIG.SELECTION_HIGHLIGHT_STYLE_RECTANGLE,color:ORYX.CONFIG.SELECTION_VALID_COLOR})
}else{this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_HIGHLIGHT_HIDE,highlightId:"dragdropresize.attached"})
}if(!this.isAttachingAllowed){if(this.isAddingAllowed){this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_HIGHLIGHT_SHOW,highlightId:"dragdropresize.contain",elements:[this.containmentParentNode],color:ORYX.CONFIG.SELECTION_VALID_COLOR})
}else{this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_HIGHLIGHT_SHOW,highlightId:"dragdropresize.contain",elements:[this.containmentParentNode],color:ORYX.CONFIG.SELECTION_INVALID_COLOR})
}}else{this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_HIGHLIGHT_HIDE,highlightId:"dragdropresize.contain"})
}},calculateDragPosition:function(d){var a={x:Event.pointerX(d)-this.offSetPosition.x,y:Event.pointerY(d)-this.offSetPosition.y};
a.x-=this.offsetScroll.x-this.scrollNode.scrollLeft;
a.y-=this.offsetScroll.y-this.scrollNode.scrollTop;
var b=d.shiftKey||d.ctrlKey;
if(ORYX.CONFIG.GRID_ENABLED&&!b){a=this.snapToGrid(a)
}else{if(this.vLine){this.vLine.hide()
}if(this.hLine){this.hLine.hide()
}}a.x/=this.faktorXY.x;
a.y/=this.faktorXY.y;
a.x=Math.max(0,a.x);
a.y=Math.max(0,a.y);
var e=this.facade.getCanvas();
a.x=Math.min(e.bounds.width()-this.dragBounds.width(),a.x);
a.y=Math.min(e.bounds.height()-this.dragBounds.height(),a.y);
return a
},checkRules:function(d){var f=d.event;
var c=d.underlyingNodes;
var e=d.checkIfAttachable;
var b=d.noEdges;
this.containmentParentNode=c.reverse().find((function(g){return(g instanceof ORYX.Core.Canvas)||(((g instanceof ORYX.Core.Node)||((g instanceof ORYX.Core.Edge)&&!b))&&(!(this.currentShapes.member(g)||this.currentShapes.any(function(h){return(h.children.length>0&&h.getChildNodes(true).member(g))
}))))
}).bind(this));
if(e&&typeof this.containmentParentNode!=="undefined"){this.isAttachingAllowed=this.facade.getRules().canConnect({sourceShape:this.containmentParentNode,edgeShape:this.toMoveShapes[0],targetShape:this.toMoveShapes[0]});
if(this.isAttachingAllowed){var a=this.facade.eventCoordinates(f);
this.isAttachingAllowed=this.containmentParentNode.isPointOverOffset(a.x,a.y)
}}if(!this.isAttachingAllowed){this.isAddingAllowed=this.toMoveShapes.all((function(g){if(g instanceof ORYX.Core.Edge||g instanceof ORYX.Core.Controls.Docker||this.containmentParentNode===g.parent){return true
}else{if(this.containmentParentNode!==g){if(!(this.containmentParentNode instanceof ORYX.Core.Edge)||!b){if(this.facade.getRules().canContain({containingShape:this.containmentParentNode,containedShape:g})){return true
}}}}return false
}).bind(this))
}if(!this.isAttachingAllowed&&!this.isAddingAllowed&&(this.containmentParentNode instanceof ORYX.Core.Edge)){d.noEdges=true;
d.underlyingNodes.reverse();
this.checkRules(d)
}},onCanvasResizeShapesMoved:function(c){var b={};
var a;
var d;
if(typeof this.oldDragBounds!=="undefined"){this.oldDragBounds.moveBy(c.offsetX,c.offsetY)
}if(typeof this.oldShapePositions!=="undefined"){for(d in this.oldShapePositions){if(this.oldShapePositions.hasOwnProperty(d)){a=this.oldShapePositions[d];
b[d]={x:a.x+c.offsetX,y:a.y+c.offsetY}
}}this.oldShapePositions=b
}if(this.dragEnable&&(typeof this.dragBounds!=="undefined")){this.dragBounds.moveBy(c.offsetX,c.offsetY);
this.resizeRectangle(this.dragBounds);
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_CANVAS_RESIZE_UPDATE_HIGHLIGHTS,elements:this.toMoveShapes})
}},refreshSelectedShapes:function(){if(!this.dragBounds){return
}var g=this.dragBounds.center();
var f=this.oldDragBounds.center();
var h={x:g.x-f.x,y:g.y-f.y};
var d=function d(j,l){var k=this.oldShapePositions[j.id];
return{x:k.x+l.x,y:k.y+l.y}
}.bind(this);
var e=this.removeDeadShapes(this.toMoveShapes);
if(e.length>0){var b=e.map(function c(j){return{shape:j,origin:this.oldShapePositions[j.id],target:d(j,h)}
}.bind(this));
var a=[new ORYX.Core.Commands["DragDropResize.MoveCommand"](b,this.containmentParentNode,this.currentShapes,this.facade)];
if(this._undockedEdgesCommand instanceof ORYX.Core.Command){a.unshift(this._undockedEdgesCommand)
}this.facade.executeCommands(a);
if(this.dragBounds){this.oldDragBounds=this.dragBounds.clone()
}}},removeDeadShapes:function removeDeadShapes(j){var b=this.facade.getCanvas();
var a=function a(m){var l=b.getChildShapeByResourceId(m);
return l
};
var k=function k(l,o){var n=undefined;
for(var m=0;
m<l.dockers.length;
m++){if(l.dockers[m].id==o){n=l.dockers[m]
}}return n
};
var h=[];
for(var c=0;
c<j.length;
c++){var f=j[c];
if(f instanceof ORYX.Core.Node||f instanceof ORYX.Core.Edge){var d=a(f.resourceId);
if(typeof d!=="undefined"){h.push(j[c])
}}else{if(f instanceof ORYX.Core.Controls.Docker){var g=a(f.parent.resourceId);
if(typeof g==="undefined"){continue
}else{var e=k(g,f.id);
if(typeof e!=="undefined"){h.push(j[c])
}}}}}return h
},onResize:function(a){if(!this.dragBounds){return
}this.dragBounds=a;
this.isResizing=true;
this.resizeRectangle(this.dragBounds)
},onResizeStart:function(){this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_RESIZE_START})
},onResizeEnd:function(b){if(!(this.currentShapes instanceof Array)||this.currentShapes.length<=0){return
}if(this.isResizing){if(((b==="southeast")&&(this.dragBounds.b.x===this.oldDragBounds.b.x)&&(this.dragBounds.b.y===this.oldDragBounds.b.y))||((b==="northwest")&&(this.dragBounds.a.x==this.oldDragBounds.a.x)&&(this.dragBounds.a.y==this.oldDragBounds.a.y))){var e=this.dragBounds.clone();
var a=this.currentShapes[0];
if(a.parent){var g=a.parent.absoluteXY();
e.moveBy(-g.x,-g.y)
}var c=this.removeDeadShapes([a]);
if(c.length>0){var d=a.bounds.clone();
var f=new ORYX.Core.Commands["DragDropResize.ResizeCommand"](a,e,d,this.facade,b);
this.facade.executeCommands([f]);
this.isResizing=false;
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_RESIZE_END})
}}}},beforeDrag:function(){this._undockedEdgesCommand=new ORYX.Core.Commands["DragDropResize.UndockEdgeCommand"](this.toMoveShapes,this.facade);
this._undockedEdgesCommand.execute()
},hideAllLabels:function(a){a.getLabels().each(function(b){b.hide()
});
a.getAllDockedShapes().each(function(b){var c=b.getLabels();
if(c.length>0){c.each(function(d){d.hide()
})
}});
a.getChildren().each((function(b){if(b instanceof ORYX.Core.Shape){this.hideAllLabels(b)
}}).bind(this))
},afterDrag:function(){},showAllLabels:function(a){for(var d=0;
d<a.length;
d++){var b=a[d];
b.show()
}var f=a.getAllDockedShapes();
for(var d=0;
d<f.length;
d++){var c=f[d];
var g=c.getLabels();
if(g.length>0){g.each(function(h){h.show()
})
}}for(var d=0;
d<a.children.length;
d++){var e=a.children[d];
if(e instanceof ORYX.Core.Shape){this.showAllLabels(e)
}}},onSelectionChanged:function(c){var e=c.elements;
this.dragEnable=false;
this.dragIntialized=false;
this.resizerSE.hide();
this.resizerNW.hide();
if(!e||e.length==0){this.selectedRect.hide();
this.currentShapes=[];
this.toMoveShapes=[];
this.dragBounds=undefined;
this.oldDragBounds=undefined;
this.oldShapePositions={}
}else{this.currentShapes=e;
var f=this.facade.getCanvas().getShapesWithSharedParent(e);
this.toMoveShapes=f;
this.toMoveShapes=this.toMoveShapes.findAll(function(g){return g instanceof ORYX.Core.Node&&(g.dockers.length===0||!e.member(g.dockers.first().getDockedShape()))
});
e.each((function(g){if(!(g instanceof ORYX.Core.Edge)){return
}var j=g.getDockers();
var k=e.member(j.first().getDockedShape());
var h=e.member(j.last().getDockedShape());
if(!k&&!h){var l=!j.first().getDockedShape()&&!j.last().getDockedShape();
if(l){this.toMoveShapes=this.toMoveShapes.concat(j)
}}if(g.dockers.length>2&&k&&h){this.toMoveShapes=this.toMoveShapes.concat(j.findAll(function(n,m){return m>0&&m<j.length-1
}))
}}).bind(this));
this.oldShapePositions={};
this.toMoveShapes.each(function b(g){this.oldShapePositions[g.id]=g.absoluteBounds().center()
}.bind(this));
var d=undefined;
this.toMoveShapes.each(function(h){var g=h;
if(h instanceof ORYX.Core.Controls.Docker){g=h.parent
}if(!d){d=g.absoluteBounds()
}else{d.include(g.absoluteBounds())
}}.bind(this));
if(!d){e.each(function(g){if(!d){d=g.absoluteBounds()
}else{d.include(g.absoluteBounds())
}})
}this.dragBounds=d;
this.oldDragBounds=d.clone();
this.resizeRectangle(d);
this.selectedRect.show();
if(e.length==1&&e[0].isResizable){var a=e[0].getStencil().fixedAspectRatio()?e[0].bounds.width()/e[0].bounds.height():undefined;
this.resizerSE.setBounds(this.dragBounds,e[0].minimumSize,e[0].maximumSize,a);
this.resizerSE.show();
this.resizerNW.setBounds(this.dragBounds,e[0].minimumSize,e[0].maximumSize,a);
this.resizerNW.show()
}else{this.resizerSE.setBounds(undefined);
this.resizerNW.setBounds(undefined)
}if(ORYX.CONFIG.GRID_ENABLED){this.distPoints=[];
if(this.distPointTimeout){window.clearTimeout(this.distPointTimeout)
}this.distPointTimeout=window.setTimeout(function(){var g=this.facade.getCanvas().getChildShapes(true).findAll(function(j){var h=j.parent;
while(h){if(e.member(h)){return false
}h=h.parent
}return true
});
g.each((function(l){if(!(l instanceof ORYX.Core.Edge)){var j=l.absoluteXY();
var k=l.bounds.width();
var h=l.bounds.height();
this.distPoints.push({ul:{x:j.x,y:j.y},c:{x:j.x+(k/2),y:j.y+(h/2)},lr:{x:j.x+k,y:j.y+h}})
}}).bind(this))
}.bind(this),10)
}}},snapToGrid:function(h){var a=this.dragBounds;
var o={};
var n=6;
var l=10;
var p=6;
var b=this.vLine?this.vLine.getScale():1;
var k={x:(h.x/b),y:(h.y/b)};
var m={x:(h.x/b)+(a.width()/2),y:(h.y/b)+(a.height()/2)};
var g={x:(h.x/b)+(a.width()),y:(h.y/b)+(a.height())};
var f,d;
var j,e;
this.distPoints.each(function(r){var c,t,s,q;
if(Math.abs(r.c.x-m.x)<l){c=r.c.x-m.x;
s=r.c.x
}if(Math.abs(r.c.y-m.y)<l){t=r.c.y-m.y;
q=r.c.y
}if(c!==undefined){f=f===undefined?c:(Math.abs(c)<Math.abs(f)?c:f);
if(f===c){j=s
}}if(t!==undefined){d=d===undefined?t:(Math.abs(t)<Math.abs(d)?t:d);
if(d===t){e=q
}}});
if(f!==undefined){k.x+=f;
k.x*=b;
if(this.vLine&&j){this.vLine.update(j)
}}else{k.x=(h.x-(h.x%(ORYX.CONFIG.GRID_DISTANCE/2)));
if(this.vLine){this.vLine.hide()
}}if(d!==undefined){k.y+=d;
k.y*=b;
if(this.hLine&&e){this.hLine.update(e)
}}else{k.y=(h.y-(h.y%(ORYX.CONFIG.GRID_DISTANCE/2)));
if(this.hLine){this.hLine.hide()
}}return k
},showGridLine:function(){},resizeRectangle:function(a){this.selectedRect.resize(a)
}});
ORYX.Plugins.SelectedRect=Clazz.extend({construct:function(a){this.parentId=a;
this.node=ORYX.Editor.graft("http://www.w3.org/2000/svg",$(a),["g"]);
this.dashedArea=ORYX.Editor.graft("http://www.w3.org/2000/svg",this.node,["rect",{x:0,y:0,"stroke-width":1,stroke:"#777777",fill:"none","stroke-dasharray":"2,2","pointer-events":"none"}]);
this.hide()
},hide:function(){this.node.setAttributeNS(null,"display","none")
},show:function(){this.node.setAttributeNS(null,"display","")
},resize:function(a){var c=a.upperLeft();
var b=ORYX.CONFIG.SELECTED_AREA_PADDING;
this.dashedArea.setAttributeNS(null,"width",a.width()+2*b);
this.dashedArea.setAttributeNS(null,"height",a.height()+2*b);
this.node.setAttributeNS(null,"transform","translate("+(c.x-b)+", "+(c.y-b)+")")
}});
ORYX.Plugins.GridLine=Clazz.extend({construct:function(b,a){if(ORYX.Plugins.GridLine.DIR_HORIZONTAL!==a&&ORYX.Plugins.GridLine.DIR_VERTICAL!==a){a=ORYX.Plugins.GridLine.DIR_HORIZONTAL
}this.parent=$(b);
this.direction=a;
this.node=ORYX.Editor.graft("http://www.w3.org/2000/svg",this.parent,["g"]);
this.line=ORYX.Editor.graft("http://www.w3.org/2000/svg",this.node,["path",{"stroke-width":1,stroke:"silver",fill:"none","stroke-dasharray":"5,5","pointer-events":"none"}]);
this.hide()
},hide:function(){this.node.setAttributeNS(null,"display","none")
},show:function(){this.node.setAttributeNS(null,"display","")
},getScale:function(){try{return this.parent.parentNode.transform.baseVal.getItem(0).matrix.a
}catch(a){return 1
}},update:function(e){if(this.direction===ORYX.Plugins.GridLine.DIR_HORIZONTAL){var d=e instanceof Object?e.y:e;
var c=this.parent.parentNode.parentNode.width.baseVal.value/this.getScale();
this.line.setAttributeNS(null,"d","M 0 "+d+" L "+c+" "+d)
}else{var a=e instanceof Object?e.x:e;
var b=this.parent.parentNode.parentNode.height.baseVal.value/this.getScale();
this.line.setAttributeNS(null,"d","M"+a+" 0 L "+a+" "+b)
}this.show()
}});
ORYX.Plugins.GridLine.DIR_HORIZONTAL="hor";
ORYX.Plugins.GridLine.DIR_VERTICAL="ver";
ORYX.Plugins.Resizer=Clazz.extend({construct:function(c,a,b){this.parentId=c;
this.orientation=a;
this.facade=b;
this.node=ORYX.Editor.graft("http://www.w3.org/1999/xhtml",$(this.parentId),["div",{"class":"resizer_"+this.orientation,style:"left:0px; top:0px;"}]);
this.node.addEventListener(ORYX.CONFIG.EVENT_MOUSEDOWN,this.handleMouseDown.bind(this),true);
document.documentElement.addEventListener(ORYX.CONFIG.EVENT_MOUSEUP,this.handleMouseUp.bind(this),true);
document.documentElement.addEventListener(ORYX.CONFIG.EVENT_MOUSEMOVE,this.handleMouseMove.bind(this),false);
this.dragEnable=false;
this.offSetPosition={x:0,y:0};
this.bounds=undefined;
this.canvasNode=this.facade.getCanvas().node;
this.minSize=undefined;
this.maxSize=undefined;
this.aspectRatio=undefined;
this.resizeCallbacks=[];
this.resizeStartCallbacks=[];
this.resizeEndCallbacks=[];
this.hide();
this.scrollNode=this.node.parentNode.parentNode.parentNode
},handleMouseDown:function(a){this.dragEnable=true;
this.offsetScroll={x:this.scrollNode.scrollLeft,y:this.scrollNode.scrollTop};
this.offSetPosition={x:Event.pointerX(a)-this.position.x,y:Event.pointerY(a)-this.position.y};
this.resizeStartCallbacks.each((function(b){b(this.bounds)
}).bind(this))
},handleMouseUp:function(a){this.dragEnable=false;
this.containmentParentNode=null;
this.resizeEndCallbacks.each((function(b){b(this.bounds)
}).bind(this))
},handleMouseMove:function(c){if(!this.dragEnable){return
}if(c.shiftKey||c.ctrlKey){this.aspectRatio=this.bounds.width()/this.bounds.height()
}else{this.aspectRatio=undefined
}var b={x:Event.pointerX(c)-this.offSetPosition.x,y:Event.pointerY(c)-this.offSetPosition.y};
b.x-=this.offsetScroll.x-this.scrollNode.scrollLeft;
b.y-=this.offsetScroll.y-this.scrollNode.scrollTop;
b.x=Math.min(b.x,this.facade.getCanvas().bounds.width());
b.y=Math.min(b.y,this.facade.getCanvas().bounds.height());
var d={x:b.x-this.position.x,y:b.y-this.position.y};
if(this.aspectRatio){newAspectRatio=(this.bounds.width()+d.x)/(this.bounds.height()+d.y);
if(newAspectRatio>this.aspectRatio){d.x=this.aspectRatio*(this.bounds.height()+d.y)-this.bounds.width()
}else{if(newAspectRatio<this.aspectRatio){d.y=(this.bounds.width()+d.x)/this.aspectRatio-this.bounds.height()
}}}if(this.orientation==="northwest"){if(this.bounds.width()-d.x>this.maxSize.width){d.x=-(this.maxSize.width-this.bounds.width());
if(this.aspectRatio){d.y=this.aspectRatio*d.x
}}if(this.bounds.width()-d.x<this.minSize.width){d.x=-(this.minSize.width-this.bounds.width());
if(this.aspectRatio){d.y=this.aspectRatio*d.x
}}if(this.bounds.height()-d.y>this.maxSize.height){d.y=-(this.maxSize.height-this.bounds.height());
if(this.aspectRatio){d.x=d.y/this.aspectRatio
}}if(this.bounds.height()-d.y<this.minSize.height){d.y=-(this.minSize.height-this.bounds.height());
if(this.aspectRatio){d.x=d.y/this.aspectRatio
}}}else{if(this.bounds.width()+d.x>this.maxSize.width){d.x=this.maxSize.width-this.bounds.width();
if(this.aspectRatio){d.y=this.aspectRatio*d.x
}}if(this.bounds.width()+d.x<this.minSize.width){d.x=this.minSize.width-this.bounds.width();
if(this.aspectRatio){d.y=this.aspectRatio*d.x
}}if(this.bounds.height()+d.y>this.maxSize.height){d.y=this.maxSize.height-this.bounds.height();
if(this.aspectRatio){d.x=d.y/this.aspectRatio
}}if(this.bounds.height()+d.y<this.minSize.height){d.y=this.minSize.height-this.bounds.height();
if(this.aspectRatio){d.x=d.y/this.aspectRatio
}}}if(this.orientation==="northwest"){var a={x:this.bounds.lowerRight().x,y:this.bounds.lowerRight().y};
this.bounds.extend({x:-d.x,y:-d.y});
this.bounds.moveBy(d)
}else{this.bounds.extend(d)
}this.update();
this.resizeCallbacks.each((function(e){e(this.bounds)
}).bind(this));
Event.stop(c)
},registerOnResizeStart:function(a){if(!this.resizeStartCallbacks.member(a)){this.resizeStartCallbacks.push(a)
}},unregisterOnResizeStart:function(a){if(this.resizeStartCallbacks.member(a)){this.resizeStartCallbacks=this.resizeStartCallbacks.without(a)
}},registerOnResizeEnd:function(a){if(!this.resizeEndCallbacks.member(a)){this.resizeEndCallbacks.push(a)
}},unregisterOnResizeEnd:function(a){if(this.resizeEndCallbacks.member(a)){this.resizeEndCallbacks=this.resizeEndCallbacks.without(a)
}},registerOnResize:function(a){if(!this.resizeCallbacks.member(a)){this.resizeCallbacks.push(a)
}},unregisterOnResize:function(a){if(this.resizeCallbacks.member(a)){this.resizeCallbacks=this.resizeCallbacks.without(a)
}},hide:function(){this.node.style.display="none"
},show:function(){if(this.bounds){this.node.style.display=""
}},setBounds:function(d,b,a,c){this.bounds=d;
if(!b){b={width:ORYX.CONFIG.MINIMUM_SIZE,height:ORYX.CONFIG.MINIMUM_SIZE}
}if(!a){a={width:ORYX.CONFIG.MAXIMUM_SIZE,height:ORYX.CONFIG.MAXIMUM_SIZE}
}this.minSize=b;
this.maxSize=a;
this.aspectRatio=c;
this.update()
},update:function(){if(!this.bounds){return
}var c=this.bounds.upperLeft();
if(this.bounds.width()<this.minSize.width){this.bounds.set(c.x,c.y,c.x+this.minSize.width,c.y+this.bounds.height())
}if(this.bounds.height()<this.minSize.height){this.bounds.set(c.x,c.y,c.x+this.bounds.width(),c.y+this.minSize.height)
}if(this.bounds.width()>this.maxSize.width){this.bounds.set(c.x,c.y,c.x+this.maxSize.width,c.y+this.bounds.height())
}if(this.bounds.height()>this.maxSize.height){this.bounds.set(c.x,c.y,c.x+this.bounds.width(),c.y+this.maxSize.height)
}var b=this.canvasNode.getScreenCTM();
if(!b){b={a:1,d:1}
}c.x*=b.a;
c.y*=b.d;
if(this.orientation==="northwest"){c.x-=13;
c.y-=26
}else{c.x+=(b.a*this.bounds.width())+3;
c.y+=(b.d*this.bounds.height())+3
}this.position=c;
this.node.style.left=this.position.x+"px";
this.node.style.top=this.position.y+"px"
}});
ORYX.Core.Commands["DragDropResize.MoveCommand"]=ORYX.Core.AbstractCommand.extend({construct:function(b,d,a,c){arguments.callee.$.construct.call(this,c);
this.moveShapes=b;
this.selectedShapes=a;
this.parent=d;
this.newParents=b.collect(function(e){return d||e.shape.parent
});
this.oldParents=b.collect(function(e){return e.shape.parent
});
this.dockedNodes=b.findAll(function(e){return e.shape instanceof ORYX.Core.Node&&e.shape.dockers.length==1
}).collect(function(e){return{docker:e.shape.dockers[0],dockedShape:e.shape.dockers[0].getDockedShape(),refPoint:e.shape.dockers[0].referencePoint}
})
},getAffectedShapes:function getAffectedShapes(){var e=function e(f){if(f.shape instanceof ORYX.Core.Controls.Docker){return f.shape.parent
}return f.shape
};
var d=this.moveShapes.collect(e);
var c=[];
for(var b=0;
b<d.length;
b++){var a=d[b];
if(a instanceof ORYX.Core.Node){c=c.concat(a.outgoing).concat(a.incoming)
}}return d.concat(c)
},getCommandName:function getCommandName(){return"DragDropResize.MoveCommand"
},getDisplayName:function getDisplayName(){return"Shape moved"
},getCommandData:function getCommandData(){var b=function d(f){var e={origin:f.origin,target:f.target};
if(f.shape instanceof ORYX.Core.Controls.Docker){e.shapeId=f.shape.parent.resourceId;
e.dockerId=f.shape.id
}else{e.shapeId=f.shape.resourceId
}return e
};
var c=null;
if(this.parent){c=this.parent.resourceId
}var a={parentId:c,shapeTargetPositions:this.moveShapes.map(b)};
return a
},createFromCommandData:function createFromCommandData(p,c){var f;
var b=p.getCanvas();
var a=b.getChildShapeByResourceId.bind(b);
var l=function l(s){return{shape:a(s.shapeId),origin:s.origin,target:s.target}
};
var q=function q(s,v){var u;
for(var t=0;
t<s.dockers.length;
t++){if(s.dockers[t].id==v){u=s.dockers[t]
}}return u
};
var k=p.getCanvas().getChildShapeOrCanvasByResourceId(c.parentId);
var j=[];
for(f=0;
f<c.shapeTargetPositions.length;
f++){var h=l(c.shapeTargetPositions[f]);
if(h.shape instanceof ORYX.Core.Edge){var e=q(h.shape,c.shapeTargetPositions[f].dockerId);
if(typeof e!=="undefined"){var m={shape:e,origin:h.origin,target:h.target};
j.push(m)
}}else{if(typeof h.shape!=="undefined"){j.push(h)
}else{ORYX.Log.warn("Trying to move deleted shape")
}}}var o=false;
for(var f=0;
f<j.length;
f++){var n=j[f].shape;
if(n instanceof ORYX.Core.Controls.Docker){var g=n.parent.resourceId;
var d=p.getCanvas().getChildShapeByResourceId(g);
if(typeof d!=="undefined"){var e=q(d,n.id);
if(typeof e!=="undefined"){o=true;
break
}}}else{var g=n.resourceId;
if(typeof p.getCanvas().getChildShapeByResourceId(g)!=="undefined"){o=true;
break
}}}if(!o){return undefined
}var r=[];
return new ORYX.Core.Commands["DragDropResize.MoveCommand"](j,k,r,p)
},execute:function(){var b=this.removeDeadShapes(this.moveShapes,this.newParents);
var a=b.moveShapes;
var c=b.parents;
this.dockAllShapes();
this.move(a);
this.addShapeToParent(a,c);
this.selectCurrentShapes();
this.facade.getCanvas().update();
this.facade.updateSelection(this.isLocal())
},rollback:function(){var d=this.moveShapes.map(function c(f){return{shape:f.shape,target:f.origin}
});
var e=this.removeDeadShapes(d,this.oldParents);
var b=e.moveShapes;
var a=e.parents;
this.move(d);
this.addShapeToParent(b,a);
this.dockAllShapes(true);
this.selectCurrentShapes();
this.facade.getCanvas().update();
this.facade.updateSelection(this.isLocal())
},removeDeadShapes:function removeDeadShapes(k,j){var b=this.facade.getCanvas();
var a=function a(o){var n=b.getChildShapeByResourceId(o);
return n
};
var m=function m(n,q){var p=undefined;
for(var o=0;
o<n.dockers.length;
o++){if(n.dockers[o].id==q){p=n.dockers[o]
}}return p
};
var h=[];
var l=[];
for(var c=0;
c<k.length;
c++){var f=k[c].shape;
if(f instanceof ORYX.Core.Node||f instanceof ORYX.Core.Edge){var d=a(f.resourceId);
if(typeof d!=="undefined"){h.push(k[c]);
l.push(j[c])
}}else{if(f instanceof ORYX.Core.Controls.Docker){var g=a(f.parent.resourceId);
if(typeof g==="undefined"){continue
}else{var e=m(g,f.id);
if(typeof e!=="undefined"){h.push(k[c]);
l.push(j[c])
}}}}}return{moveShapes:h,parents:l}
},move:function(c){for(var d=0;
d<c.length;
d++){var b=c[d].shape;
var f=b.absoluteBounds().center();
var a=c[d].target;
var e={x:(a.x-f.x),y:(a.y-f.y)};
b.bounds.moveBy(e);
if(b instanceof ORYX.Core.Node){(b.dockers||[]).each(function(g){g.bounds.moveBy(e)
})
}}},dockAllShapes:function(a){for(var b=0;
b<this.dockedNodes.length;
b++){var c=this.dockedNodes[b].docker;
c.setDockedShape(a?this.dockedNodes[b].dockedShape:undefined);
if(c.getDockedShape()){c.setReferencePoint(this.dockedNodes[b].refPoint)
}}},addShapeToParent:function addShapeToParent(j,h){for(var c=0;
c<j.length;
c++){var d=j[c].shape;
var a=h[c];
if((d instanceof ORYX.Core.Node)&&(d.parent!==h[c])){var l=h[c].absoluteXY();
var g=d.absoluteXY();
var k=g.x-l.x;
var f=g.y-l.y;
h[c].add(d);
d.getOutgoingShapes((function(b){if(b instanceof ORYX.Core.Node&&!j.member(b)){h[c].add(b)
}}).bind(this));
if(d.dockers.length==1){var e=d.bounds;
k+=e.width()/2;
f+=e.height()/2;
d.dockers.first().bounds.centerMoveTo(k,f)
}else{d.bounds.moveTo(k,f)
}}}},selectCurrentShapes:function selectCurrentShapes(){var b=this.facade.getCanvas();
var a=function a(l){var k=b.getChildShapeByResourceId(l);
return k
};
var j=function j(k,m){for(var l=0;
l<k.dockers.length;
l++){if(k.dockers[l].id==m){docker=k.dockers[l]
}}};
if(this.isLocal()){var h=[];
for(var c=0;
c<this.selectedShapes.length;
c++){var f=this.selectedShapes[c];
if(f instanceof ORYX.Core.Node||f instanceof ORYX.Core.Edge){var d=a(f.resourceId);
if(typeof d!=="undefined"){h.push(this.selectedShapes[c])
}}else{if(f instanceof ORYX.Core.Controls.Docker){var g=a(f.parent.resourceId);
if(typeof g==="undefined"){continue
}else{var e=j(g,f.id);
if(typeof e!=="undefined"){h.push(this.selectedShapes[c])
}}}}}this.facade.setSelection(h)
}}});
ORYX.Core.Commands["DragDropResize.UndockEdgeCommand"]=ORYX.Core.AbstractCommand.extend({construct:function construct(a,b){arguments.callee.$.construct.call(this,b);
this.dockers=a.collect(function(c){return c instanceof ORYX.Core.Controls.Docker?{docker:c,dockedShape:c.getDockedShape(),refPoint:c.referencePoint}:undefined
}).compact()
},getCommandData:function getCommandData(){var c=this.dockers.map(function(e){return e.parent
}.bind(this));
var b=function b(e){return e.id
};
var a=function a(e){return e.resourceId
};
var d={dockerIds:this.dockers.map(b),dockerParentsResourceIds:c.map(a)};
return d
},createFromCommandData:function createFromCommandData(f,c){var g=function g(j){var h=f.getCanvas().getChildShapeByResourceId(j);
return h
};
var e=function e(h,k){for(var j=0;
j<h.dockers.length;
j++){if(h.dockers[j].id==k){docker=h.dockers[j]
}}};
var a=[];
for(var d=0;
d<c.dockerIds;
d++){var b=g(dockerParentsResourceIds[d]);
a.push(e(b,dockerIds[d]))
}return new ORYX.Core.Commands["DragDropResize.UndockEdgeCommand"](a,f)
},getCommandName:function getCommandName(){return"DragDropResize.UndockEdgeCommand"
},getAffectedShapes:function getAffectedShapes(){return[]
},execute:function execute(){this.dockers.each(function(a){a.docker.setDockedShape(undefined)
})
},rollback:function execute(){this.dockers.each(function(a){a.docker.setDockedShape(a.dockedShape);
a.docker.setReferencePoint(a.refPoint)
})
}});
ORYX.Core.Commands["DragDropResize.ResizeCommand"]=ORYX.Core.AbstractCommand.extend({construct:function construct(b,e,d,c,a){arguments.callee.$.construct.call(this,c);
this.orientation=a;
this.shape=b;
this.newBounds=e;
this.oldBounds=d
},getCommandData:function getCommandData(){var a={shapeId:this.shape.resourceId,newBounds:{width:this.newBounds.b.x-this.newBounds.a.x,height:this.newBounds.b.y-this.newBounds.a.y},oldBounds:{a:this.oldBounds.upperLeft(),b:this.oldBounds.lowerRight()},orientation:this.orientation};
return a
},createFromCommandData:function createFromCommandData(d,b){var a=d.getCanvas().getChildShapeByResourceId(b.shapeId);
if(typeof a==="undefined"){return undefined
}var c=a.bounds.clone();
c.resize(b.orientation,b.newBounds);
var e=a.absoluteBounds().clone();
e.set(b.oldBounds);
return new ORYX.Core.Commands["DragDropResize.ResizeCommand"](a,c,e,d)
},getCommandName:function getCommandName(){return"DragDropResize.ResizeCommand"
},getDisplayName:function getDisplayName(){return"Shape resized"
},getAffectedShapes:function getAffectedShapes(){return[this.shape]
},execute:function execute(){this.shape.bounds.set(this.newBounds.a,this.newBounds.b);
this.update(this.getOffset(this.oldBounds,this.newBounds))
},rollback:function rollback(){this.shape.bounds.set(this.oldBounds.a,this.oldBounds.b);
this.update(this.getOffset(this.newBounds,this.oldBounds))
},getOffset:function getOffset(b,a){return{x:a.a.x-b.a.x,y:a.a.y-b.a.y,xs:a.width()/b.width(),ys:a.height()/b.height()}
},update:function update(b){this.shape.getLabels().each(function(c){c.changed()
});
var a=[];
a.concat(this.shape.getIncomingShapes());
a.concat(this.shape.getOutgoingShapes());
a.findAll(function(c){return c instanceof ORYX.Core.Edge
}.bind(this));
this.facade.getCanvas().update();
if(this.isLocal()){this.facade.setSelection([this.shape])
}this.facade.updateSelection(this.isLocal())
}});
if(!ORYX.Plugins){ORYX.Plugins=new Object()
}ORYX.Plugins.JSONExport=ORYX.Plugins.AbstractPlugin.extend({construct:function construct(a){arguments.callee.$.construct.apply(this,arguments);
this.facade.registerOnEvent(ORYX.CONFIG.EVENT_EXPORT_JSON,this.JSONExport.bind(this));
this.facade.offer({name:ORYX.I18N.JSONExport.name,functionality:this.JSONExport.bind(this),group:ORYX.I18N.JSONExport.group,iconCls:"pw-toolbar-button pw-toolbar-export",description:ORYX.I18N.JSONExport.desc,index:1,minShape:0,maxShape:0,isEnabled:function(){return true
},visibleInViewMode:true})
},JSONExport:function JSONExport(){var e=this.facade.getSerializedJSON();
var b=this.facade.getStencilSets();
for(i in b){var g=b[i].source();
break
}g=g.slice(g.indexOf("stencilsets/"));
g=g.replace("petrinets.json","petrinet.json");
g=g.replace(/simpleBPMN2.0/g,"bpmn2.0");
var a=this.facade.getJSON();
var d=Object.toJSON(a.ssextensions);
var c="/search";
var f={json:e,stencilset:g,exts:d};
jQuery.ajax({url:c,type:"POST",dataType:"json",contentType:"application/json",data:JSON.stringify(f)})
}});
if(!ORYX.Plugins){ORYX.Plugins=new Object()
}ORYX.Plugins.ShapeMenuPlugin={construct:function(c){this.facade=c;
this.alignGroups=new Hash();
var a=this.facade.getCanvas().getHTMLContainer();
this.shapeMenu=new ORYX.Plugins.ShapeMenu(a);
this.currentShapes=[];
this.facade.registerOnEvent(ORYX.CONFIG.EVENT_DRAGDROP_START,this.hideShapeMenu.bind(this));
this.facade.registerOnEvent(ORYX.CONFIG.EVENT_DRAGDROP_END,this.showShapeMenu.bind(this));
this.facade.registerOnEvent(ORYX.CONFIG.EVENT_RESIZE_START,(function(){this.hideShapeMenu();
this.hideMorphMenu()
}).bind(this));
this.facade.registerOnEvent(ORYX.CONFIG.EVENT_RESIZE_END,this.showShapeMenu.bind(this));
var b=new Ext.dd.DragZone(a.parentNode,{shadow:!Ext.isMac});
b.afterDragDrop=this.afterDragging.bind(this,b);
b.beforeDragOver=this.beforeDragOver.bind(this,b);
this.createdButtons={};
this.facade.registerOnEvent(ORYX.CONFIG.EVENT_STENCIL_SET_LOADED,(function(){this.registryChanged()
}).bind(this));
this.facade.registerOnEvent(ORYX.CONFIG.EVENT_SHAPEDELETED,this.clearShapeMenu.bind(this));
this.facade.registerOnEvent(ORYX.CONFIG.EVENT_SHAPEBOUNDS_CHANGED,this.onBoundsChanged.bind(this));
this.timer=null;
this.resetElements=true
},onBoundsChanged:function onBoundsChanged(a){if(this.currentShapes.include(a.shape)){this.hideShapeMenu();
this.showShapeMenu()
}},clearShapeMenu:function clearShapeMenu(a){if(this.currentShapes.include(a.shape)){this.hideShapeMenu()
}},hideShapeMenu:function(a){window.clearTimeout(this.timer);
this.timer=null;
this.shapeMenu.hide()
},showShapeMenu:function(a){if(!a||this.resetElements){window.clearTimeout(this.timer);
this.timer=window.setTimeout(function(){this.shapeMenu.closeAllButtons();
this.showMorphButton(this.currentShapes);
this.showStencilButtons(this.currentShapes);
this.shapeMenu.show(this.currentShapes);
this.resetElements=false
}.bind(this),300)
}else{window.clearTimeout(this.timer);
this.timer=null;
this.shapeMenu.show(this.currentShapes)
}},registryChanged:function(a){if(a){a=a.each(function(d){d.group=d.group?d.group:"unknown"
});
this.pluginsData=a.sortBy(function(d){return(d.group+""+d.index)
})
}this.shapeMenu.removeAllButtons();
this.shapeMenu.setNumberOfButtonsPerLevel(ORYX.CONFIG.SHAPEMENU_RIGHT,2);
this.createdButtons={};
this.createMorphMenu();
if(!this.pluginsData){this.pluginsData=[]
}this.baseMorphStencils=this.facade.getRules().baseMorphs();
var b=this.facade.getRules().containsMorphingRules();
var c=this.facade.getStencilSets();
c.values().each((function(f){var e=f.nodes();
e.each((function(j){var h={type:j.id(),namespace:j.namespace(),connectingType:true};
var g=new ORYX.Plugins.ShapeMenuButton({callback:this.newShape.bind(this,h),icon:j.icon(),align:ORYX.CONFIG.SHAPEMENU_RIGHT,group:0,msg:j.title()+" - "+ORYX.I18N.ShapeMenuPlugin.clickDrag});
this.shapeMenu.addButton(g);
this.createdButtons[j.namespace()+j.type()+j.id()]=g;
Ext.dd.Registry.register(g.node.lastChild,h)
}).bind(this));
var d=f.edges();
d.each((function(j){var h={type:j.id(),namespace:j.namespace()};
var g=new ORYX.Plugins.ShapeMenuButton({callback:this.newShape.bind(this,h),icon:j.icon(),align:ORYX.CONFIG.SHAPEMENU_RIGHT,group:1,msg:(b?ORYX.I18N.Edge:j.title())+" - "+ORYX.I18N.ShapeMenuPlugin.drag});
this.shapeMenu.addButton(g);
this.createdButtons[j.namespace()+j.type()+j.id()]=g;
Ext.dd.Registry.register(g.node.lastChild,h)
}).bind(this))
}).bind(this))
},createMorphMenu:function(){this.morphMenu=new Ext.menu.Menu({id:"Oryx_morph_menu",items:[]});
this.morphMenu.on("mouseover",function(){this.morphMenuHovered=true
},this);
this.morphMenu.on("mouseout",function(){this.morphMenuHovered=false
},this);
var a=new ORYX.Plugins.ShapeMenuButton({hovercallback:(ORYX.CONFIG.ENABLE_MORPHMENU_BY_HOVER?this.showMorphMenu.bind(this):undefined),resetcallback:(ORYX.CONFIG.ENABLE_MORPHMENU_BY_HOVER?this.hideMorphMenu.bind(this):undefined),callback:(ORYX.CONFIG.ENABLE_MORPHMENU_BY_HOVER?undefined:this.toggleMorphMenu.bind(this)),icon:ORYX.PATH+"editor/images/wrench_orange.png",align:ORYX.CONFIG.SHAPEMENU_BOTTOM,group:0,msg:ORYX.I18N.ShapeMenuPlugin.morphMsg});
this.shapeMenu.setNumberOfButtonsPerLevel(ORYX.CONFIG.SHAPEMENU_BOTTOM,1);
this.shapeMenu.addButton(a);
this.morphMenu.getEl().appendTo(a.node);
this.morphButton=a
},showMorphMenu:function(){this.morphMenu.show(this.morphButton.node);
this._morphMenuShown=true
},hideMorphMenu:function(){this.morphMenu.hide();
this._morphMenuShown=false
},toggleMorphMenu:function(){if(this._morphMenuShown){this.hideMorphMenu()
}else{this.showMorphMenu()
}},onSelectionChanged:function(b){if(!b.isLocal){return
}var a=this.facade.getSelection();
this.hideShapeMenu();
this.hideMorphMenu();
if(!a.length>0){return
}if(a[0] instanceof ORYX.Core.Edge){return
}if(this.currentShapes.inspect()!==a.inspect()){this.currentShapes=a;
this.resetElements=true;
this.showShapeMenu()
}else{this.showShapeMenu(true)
}this.facade.updateSelection(false)
},showMorphButton:function(b){if(b.length!=1){return
}var a=this.facade.getRules().morphStencils({stencil:b[0].getStencil()});
a=a.select(function(c){if(b[0].getStencil().type()==="node"){return this.facade.getRules().canContain({containingShape:b[0].parent,containedStencil:c})
}else{return this.facade.getRules().canConnect({sourceShape:b[0].dockers.first().getDockedShape(),edgeStencil:c,targetShape:b[0].dockers.last().getDockedShape()})
}}.bind(this));
if(a.size()<=1){return
}this.morphMenu.removeAll();
a=a.sortBy(function(c){return c.position()
});
a.each((function(d){var c=new Ext.menu.Item({text:d.title(),icon:d.icon(),disabled:d.id()==b[0].getStencil().id(),disabledClass:ORYX.CONFIG.MORPHITEM_DISABLED,handler:(function(){this.morphShape(b[0],d)
}).bind(this)});
this.morphMenu.add(c)
}).bind(this));
this.morphButton.prepareToShow()
},showStencilButtons:function(g){if(g.length!=1){return
}var f=this.facade.getStencilSets()[g[0].getStencil().namespace()];
var c=this.facade.getRules().outgoingEdgeStencils({canvas:this.facade.getCanvas(),sourceShape:g[0]});
var a=new Array();
var d=new Array();
var e=this.facade.getRules().containsMorphingRules();
c.each((function(j){if(e){if(this.baseMorphStencils.include(j)){var k=true
}else{var h=this.facade.getRules().morphStencils({stencil:j});
var k=!h.any((function(l){if(this.baseMorphStencils.include(l)&&c.include(l)){return true
}return d.include(l)
}).bind(this))
}}if(k||!e){if(this.createdButtons[j.namespace()+j.type()+j.id()]){this.createdButtons[j.namespace()+j.type()+j.id()].prepareToShow()
}d.push(j)
}a=a.concat(this.facade.getRules().targetStencils({canvas:this.facade.getCanvas(),sourceShape:g[0],edgeStencil:j}))
}).bind(this));
a.uniq();
var b=new Array();
a.each((function(k){if(e){if(k.type()==="edge"){return
}if(!this.facade.getRules().showInShapeMenu(k)){return
}if(!this.baseMorphStencils.include(k)){var h=this.facade.getRules().morphStencils({stencil:k});
if(h.size()==0){return
}var j=h.any((function(l){if(this.baseMorphStencils.include(l)&&a.include(l)){return true
}return b.include(l)
}).bind(this));
if(j){return
}}}if(this.createdButtons[k.namespace()+k.type()+k.id()]){this.createdButtons[k.namespace()+k.type()+k.id()].prepareToShow()
}b.push(k)
}).bind(this))
},beforeDragOver:function(m,l,b){if(this.shapeMenu.isVisible){this.hideShapeMenu()
}var k=this.facade.eventCoordinates(b.browserEvent);
var r=this.facade.getCanvas().getAbstractShapesAtPosition(k);
if(r.length<=0){return false
}var d=r.last();
if(this._lastOverElement==d){return false
}else{var h=Ext.dd.Registry.getHandle(l.DDM.currentTarget);
if(h.backupOptions){for(key in h.backupOptions){h[key]=h.backupOptions[key]
}delete h.backupOptions
}var n=this.facade.getStencilSets()[h.namespace];
var p=n.stencil(h.type);
var q=r.last();
if(p.type()==="node"){var c=this.facade.getRules().canContain({containingShape:q,containedStencil:p});
if(!c){var o=this.facade.getRules().morphStencils({stencil:p});
for(var g=0;
g<o.size();
g++){c=this.facade.getRules().canContain({containingShape:q,containedStencil:o[g]});
if(c){h.backupOptions=Object.clone(h);
h.type=o[g].id();
h.namespace=o[g].namespace();
break
}}}this._currentReference=c?q:undefined
}else{var j=q,e=q;
var f=false;
while(!f&&j&&!(j instanceof ORYX.Core.Canvas)){q=j;
f=this.facade.getRules().canConnect({sourceShape:this.currentShapes.first(),edgeStencil:p,targetShape:j});
j=j.parent
}if(!f){q=e;
var o=this.facade.getRules().morphStencils({stencil:p});
for(var g=0;
g<o.size();
g++){var j=q;
var f=false;
while(!f&&j&&!(j instanceof ORYX.Core.Canvas)){q=j;
f=this.facade.getRules().canConnect({sourceShape:this.currentShapes.first(),edgeStencil:o[g],targetShape:j});
j=j.parent
}if(f){h.backupOptions=Object.clone(h);
h.type=o[g].id();
h.namespace=o[g].namespace();
break
}else{q=e
}}}this._currentReference=f?q:undefined
}this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_HIGHLIGHT_SHOW,highlightId:"shapeMenu",elements:[q],color:this._currentReference?ORYX.CONFIG.SELECTION_VALID_COLOR:ORYX.CONFIG.SELECTION_INVALID_COLOR});
var a=m.getProxy();
a.setStatus(this._currentReference?a.dropAllowed:a.dropNotAllowed);
a.sync()
}this._lastOverElement=d;
return false
},afterDragging:function(j,f,b){if(!(this.currentShapes instanceof Array)||this.currentShapes.length<=0){return
}var e=this.currentShapes;
this._lastOverElement=undefined;
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_HIGHLIGHT_HIDE,highlightId:"shapeMenu"});
var h=j.getProxy();
if(h.dropStatus==h.dropNotAllowed){return this.facade.updateSelection(true)
}if(!this._currentReference){return
}var d=Ext.dd.Registry.getHandle(f.DDM.currentTarget);
d.parent=this._currentReference;
var q=b.getXY();
var k={x:q[0],y:q[1]};
var m=this.facade.getCanvas().node.getScreenCTM();
k.x-=m.e;
k.y-=m.f;
k.x/=m.a;
k.y/=m.d;
k.x-=document.documentElement.scrollLeft;
k.y-=document.documentElement.scrollTop;
var p=this._currentReference.absoluteXY();
k.x-=p.x;
k.y-=p.y;
if(!b.ctrlKey){var l=this.currentShapes[0].bounds.center();
if(20>Math.abs(l.x-k.x)){k.x=l.x
}if(20>Math.abs(l.y-k.y)){k.y=l.y
}}d.position=k;
d.connectedShape=this.currentShapes[0];
if(d.connectingType){var o=this.facade.getStencilSets()[d.namespace];
var n=o.stencil(d.type);
var g={sourceShape:this.currentShapes[0],targetStencil:n};
d.connectingType=this.facade.getRules().connectMorph(g).id()
}if(ORYX.CONFIG.SHAPEMENU_DISABLE_CONNECTED_EDGE===true){delete d.connectingType
}var c=new ORYX.Core.Commands["ShapeMenu.CreateCommand"](Object.clone(d),this._currentReference,k,this.facade);
this.facade.executeCommands([c]);
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_SHAPE_MENU_CLOSE,source:e,destination:this.currentShapes});
if(d.backupOptions){for(key in d.backupOptions){d[key]=d.backupOptions[key]
}delete d.backupOptions
}this._currentReference=undefined
},newShape:function(e,f){var a=this.facade.getStencilSets()[e.namespace];
var d=a.stencil(e.type);
if(this.facade.getRules().canContain({containingShape:this.currentShapes.first().parent,containedStencil:d})){e.connectedShape=this.currentShapes[0];
e.parent=this.currentShapes.first().parent;
e.containedStencil=d;
var b={sourceShape:this.currentShapes[0],targetStencil:d};
var c=this.facade.getRules().connectMorph(b);
if(!c){return
}e.connectingType=c.id();
if(ORYX.CONFIG.SHAPEMENU_DISABLE_CONNECTED_EDGE===true){delete e.connectingType
}var g=new ORYX.Core.Commands["ShapeMenu.CreateCommand"](e,undefined,undefined,this.facade);
this.facade.executeCommands([g])
}},morphShape:function(a,b){var c=new ORYX.Core.Commands["ShapeMenu.MorphCommand"](a,b,this.facade);
this.facade.executeCommands([c])
}};
ORYX.Plugins.ShapeMenuPlugin=ORYX.Plugins.AbstractPlugin.extend(ORYX.Plugins.ShapeMenuPlugin);
ORYX.Plugins.ShapeMenu={construct:function(a){this.bounds=undefined;
this.shapes=undefined;
this.buttons=[];
this.isVisible=false;
this.node=ORYX.Editor.graft("http://www.w3.org/1999/xhtml",$(a),["div",{id:ORYX.Editor.provideId(),"class":"Oryx_ShapeMenu"}]);
this.alignContainers=new Hash();
this.numberOfButtonsPerLevel=new Hash()
},addButton:function(b){this.buttons.push(b);
if(!this.alignContainers[b.align]){this.alignContainers[b.align]=ORYX.Editor.graft("http://www.w3.org/1999/xhtml",this.node,["div",{"class":b.align}]);
this.node.appendChild(this.alignContainers[b.align]);
var a=false;
this.alignContainers[b.align].addEventListener(ORYX.CONFIG.EVENT_MOUSEOVER,this.hoverAlignContainer.bind(this,b.align),a);
this.alignContainers[b.align].addEventListener(ORYX.CONFIG.EVENT_MOUSEOUT,this.resetAlignContainer.bind(this,b.align),a);
this.alignContainers[b.align].addEventListener(ORYX.CONFIG.EVENT_MOUSEUP,this.hoverAlignContainer.bind(this,b.align),a)
}this.alignContainers[b.align].appendChild(b.node)
},deleteButton:function(a){this.buttons=this.buttons.without(a);
this.node.removeChild(a.node)
},removeAllButtons:function(){var a=this;
this.buttons.each(function(b){if(b.node&&b.node.parentNode){b.node.parentNode.removeChild(b.node)
}});
this.buttons=[]
},closeAllButtons:function(){this.buttons.each(function(a){a.prepareToHide()
});
this.isVisible=false
},show:function(e){if(e.length<=0){return
}this.shapes=e;
var f=undefined;
var h=undefined;
this.shapes.each(function(q){var p=q.node.getScreenCTM();
var r=q.absoluteXY();
p.e=p.a*r.x;
p.f=p.d*r.y;
h=new ORYX.Core.Bounds(p.e,p.f,p.e+p.a*q.bounds.width(),p.f+p.d*q.bounds.height());
if(!f){f=h
}else{f.include(h)
}});
this.bounds=f;
var c=this.bounds;
var l=this.bounds.upperLeft();
var g=0,d=0;
var j=0,k=0;
var b=0,m;
var n=0;
rightButtonGroup=0;
var o=22;
this.getWillShowButtons().sortBy(function(a){return a.group
});
this.getWillShowButtons().each(function(p){var q=this.getNumberOfButtonsPerLevel(p.align);
if(p.align==ORYX.CONFIG.SHAPEMENU_LEFT){if(p.group!=d){g=0;
d=p.group
}var a=Math.floor(g/q);
var r=g%q;
p.setLevel(a);
p.setPosition(l.x-5-(a+1)*o,l.y+q*p.group*o+p.group*0.3*o+r*o);
g++
}else{if(p.align==ORYX.CONFIG.SHAPEMENU_TOP){if(p.group!=k){j=0;
k=p.group
}var a=j%q;
var r=Math.floor(j/q);
p.setLevel(r);
p.setPosition(l.x+q*p.group*o+p.group*0.3*o+a*o,l.y-5-(r+1)*o);
j++
}else{if(p.align==ORYX.CONFIG.SHAPEMENU_BOTTOM){if(p.group!=m){b=0;
m=p.group
}var a=b%q;
var r=Math.floor(b/q);
p.setLevel(r);
p.setPosition(l.x+q*p.group*o+p.group*0.3*o+a*o,l.y+c.height()+5+r*o);
b++
}else{if(p.group!=rightButtonGroup){n=0;
rightButtonGroup=p.group
}var a=Math.floor(n/q);
var r=n%q;
p.setLevel(a);
p.setPosition(l.x+c.width()+5+a*o,l.y+q*p.group*o+p.group*0.3*o+r*o-5);
n++
}}}p.show()
}.bind(this));
this.isVisible=true
},hide:function(){this.buttons.each(function(a){a.hide()
});
this.isVisible=false
},hoverAlignContainer:function(b,a){this.buttons.each(function(c){if(c.align==b){c.showOpaque()
}})
},resetAlignContainer:function(b,a){this.buttons.each(function(c){if(c.align==b){c.showTransparent()
}})
},isHover:function(){return this.buttons.any(function(a){return a.isHover()
})
},getWillShowButtons:function(){return this.buttons.findAll(function(a){return a.willShow
})
},getButtons:function(b,a){return this.getWillShowButtons().findAll(function(c){return c.align==b&&(a===undefined||c.group==a)
})
},setNumberOfButtonsPerLevel:function(b,a){this.numberOfButtonsPerLevel[b]=a
},getNumberOfButtonsPerLevel:function(a){if(this.numberOfButtonsPerLevel[a]){return Math.min(this.getButtons(a,0).length,this.numberOfButtonsPerLevel[a])
}else{return 1
}}};
ORYX.Plugins.ShapeMenu=Clazz.extend(ORYX.Plugins.ShapeMenu);
ORYX.Plugins.ShapeMenuButton={construct:function(b){if(b){this.option=b;
if(!this.option.arguments){this.option.arguments=[]
}}else{}this.parentId=this.option.id?this.option.id:null;
var e=this.option.caption?"Oryx_button_with_caption":"Oryx_button";
this.node=ORYX.Editor.graft("http://www.w3.org/1999/xhtml",$(this.parentId),["div",{"class":e}]);
var c={src:this.option.icon};
if(this.option.msg){c.title=this.option.msg
}if(this.option.icon){ORYX.Editor.graft("http://www.w3.org/1999/xhtml",this.node,["img",c])
}if(this.option.caption){var d=ORYX.Editor.graft("http://www.w3.org/1999/xhtml",this.node,["span"]);
ORYX.Editor.graft("http://www.w3.org/1999/xhtml",d,this.option.caption)
}var a=false;
this.node.addEventListener(ORYX.CONFIG.EVENT_MOUSEOVER,this.hover.bind(this),a);
this.node.addEventListener(ORYX.CONFIG.EVENT_MOUSEOUT,this.reset.bind(this),a);
this.node.addEventListener(ORYX.CONFIG.EVENT_MOUSEDOWN,this.activate.bind(this),a);
this.node.addEventListener(ORYX.CONFIG.EVENT_MOUSEUP,this.hover.bind(this),a);
this.node.addEventListener("click",this.trigger.bind(this),a);
this.node.addEventListener(ORYX.CONFIG.EVENT_MOUSEMOVE,this.move.bind(this),a);
this.align=this.option.align?this.option.align:ORYX.CONFIG.SHAPEMENU_RIGHT;
this.group=this.option.group?this.option.group:0;
this.hide();
this.dragStart=false;
this.isVisible=false;
this.willShow=false;
this.resetTimer
},hide:function(){this.node.style.display="none";
this.isVisible=false
},show:function(){this.node.style.display="";
this.node.style.opacity=this.opacity;
this.isVisible=true
},showOpaque:function(){this.node.style.opacity=1
},showTransparent:function(){this.node.style.opacity=this.opacity
},prepareToShow:function(){this.willShow=true
},prepareToHide:function(){this.willShow=false;
this.hide()
},setPosition:function(a,b){this.node.style.left=a+"px";
this.node.style.top=b+"px"
},setLevel:function(a){if(a==0){this.opacity=0.5
}else{if(a==1){this.opacity=0.2
}else{this.opacity=0
}}},setChildWidth:function(a){this.childNode.style.width=a+"px"
},reset:function(a){window.clearTimeout(this.resetTimer);
this.resetTimer=window.setTimeout(this.doReset.bind(this),100);
if(this.option.resetcallback){this.option.arguments.push(a);
var b=this.option.resetcallback.apply(this,this.option.arguments);
this.option.arguments.remove(a)
}},doReset:function(){if(this.node.hasClassName("Oryx_down")){this.node.removeClassName("Oryx_down")
}if(this.node.hasClassName("Oryx_hover")){this.node.removeClassName("Oryx_hover")
}},activate:function(a){this.node.addClassName("Oryx_down");
this.dragStart=true
},isHover:function(){return this.node.hasClassName("Oryx_hover")?true:false
},hover:function(a){window.clearTimeout(this.resetTimer);
this.resetTimer=null;
this.node.addClassName("Oryx_hover");
this.dragStart=false;
if(this.option.hovercallback){this.option.arguments.push(a);
var b=this.option.hovercallback.apply(this,this.option.arguments);
this.option.arguments.remove(a)
}},move:function(a){if(this.dragStart&&this.option.dragcallback){this.option.arguments.push(a);
var b=this.option.dragcallback.apply(this,this.option.arguments);
this.option.arguments.remove(a)
}},trigger:function(a){if(this.option.callback){this.option.arguments.push(a);
var b=this.option.callback.apply(this,this.option.arguments);
this.option.arguments.remove(a)
}this.dragStart=false
},toString:function(){return"HTML-Button "+this.id
}};
ORYX.Plugins.ShapeMenuButton=Clazz.extend(ORYX.Plugins.ShapeMenuButton);
ORYX.Core.Commands["ShapeMenu.CreateCommand"]=ORYX.Core.AbstractCommand.extend({construct:function construct(d,b,a,c){arguments.callee.$.construct.call(this,c);
this.connectedShape=d.connectedShape;
this.connectingType=d.connectingType;
this.namespace=d.namespace;
this.type=d.type;
this.containedStencil=d.containedStencil;
this.parent=d.parent;
this.currentReference=b;
this.position=a;
this.shape;
this.edge;
this.targetRefPos;
this.sourceRefPos;
this.shapeOptions=d.shapeOptions;
this.option=d
},getCommandData:function getCommandData(){var a={option:{shapeOptions:{id:this.shape.id,resourceId:this.shape.resourceId},type:this.type,namespace:this.namespace,connectedShape:this.connectedShape.resourceId,connectingType:this.connectingType,parent:this.parent.resourceId}};
if(typeof this.currentReference!=="undefined"){a.currentReference=this.currentReference.resourceId
}if(typeof this.position!=="undefined"){a.position=this.position
}return a
},createFromCommandData:function createFromCommandData(e,f){var d=f.option;
var c=undefined;
var b=undefined;
var a=e.getStencilSets()[d.namespace];
d.parent=e.getCanvas().getChildShapeOrCanvasByResourceId(d.parent);
d.connectedShape=e.getCanvas().getChildShapeByResourceId(d.connectedShape);
d.containedStencil=a.stencil(d.type);
if(typeof f.currentReference!=="undefined"){c=e.getCanvas().getChildShapeOrCanvasByResourceId(f.currentReference)
}if(typeof f.position!=="undefined"){b=f.position;
d.position=b
}return new ORYX.Core.Commands["ShapeMenu.CreateCommand"](d,c,b,e)
},getCommandName:function getCommandName(){return"ShapeMenu.CreateCommand"
},getDisplayName:function getDisplayName(){return"Shape created"
},getAffectedShapes:function getAffectedShapes(){var a=[this.shape];
if(this.shape instanceof ORYX.Core.Node){if(this.edge instanceof ORYX.Core.Edge){a.push(this.edge)
}else{if(this.shape.getIncomingShapes().first()){a.push(this.shape.getIncomingShapes().first())
}}}return a
},execute:function execute(){var d=false;
if(typeof this.shape!=="undefined"){if(this.shape instanceof ORYX.Core.Node){this.parent.add(this.shape);
if(typeof this.edge!=="undefined"){this.facade.getCanvas().add(this.edge);
this.edge.dockers.first().setDockedShape(this.connectedShape);
this.edge.dockers.first().bounds.centerMoveTo(this.connectedShape.absoluteBounds().center());
this.edge.dockers.first().setReferencePoint(this.sourceRefPos);
this.edge.dockers.first().update();
this.edge.dockers.first().parent._update();
this.edge.dockers.last().bounds.centerMoveTo(this.shape.absoluteBounds().center());
this.edge.dockers.last().setDockedShape(this.shape);
this.edge.dockers.last().setReferencePoint(this.targetRefPos);
this.edge.dockers.last().update();
this.edge._update()
}if(this.isLocal()){this.facade.setSelection([this.shape])
}}else{if(this.shape instanceof ORYX.Core.Edge){this.facade.getCanvas().add(this.shape);
this.shape.dockers.first().setDockedShape(this.connectedShape);
this.shape.dockers.first().setReferencePoint(this.sourceRefPos);
this.shape.dockers.first().update();
this.shape._update()
}}d=true
}else{this.shape=this.facade.createShape(this.option);
this.edge=(!(this.shape instanceof ORYX.Core.Edge))?this.shape.getIncomingShapes().first():undefined
}if((typeof this.currentReference!=="undefined")&&(typeof this.position!=="undefined")){if(this.shape instanceof ORYX.Core.Edge){if(!(this.currentReference instanceof ORYX.Core.Canvas)){this.shape.dockers.last().setDockedShape(this.currentReference);
this.shape.dockers.last().setReferencePoint(this.currentReference.absoluteBounds().midPoint())
}else{this.shape.dockers.last().bounds.centerMoveTo(this.position)
}this.sourceRefPos=this.shape.dockers.first().referencePoint;
this.targetRefPos=this.shape.dockers.last().referencePoint;
this.shape.dockers.last().update();
this.shape.dockers.last().parent._update()
}else{if(typeof this.edge!=="undefined"){this.sourceRefPos=this.edge.dockers.first().referencePoint;
this.targetRefPos=this.edge.dockers.last().referencePoint
}}}else{if(typeof this.position!=="undefined"){if(typeof this.shape.dockers.last()!=="undefined"){this.shape.dockers.last().setDockedShape(this.currentReference)
}this.shape.bounds.centerMoveTo(this.position);
if(this.shape instanceof ORYX.Core.Node){(this.shape.dockers||[]).each(function(g){g.bounds.centerMoveTo(this.position)
}.bind(this))
}if(typeof this.edge!=="undefined"){this.edge.dockers.first().bounds.centerMoveTo(this.connectedShape.absoluteBounds().center());
this.edge.dockers.first().setDockedShape(this.connectedShape);
this.edge.dockers.first().update();
this.edge._update();
this.edge.dockers.last().bounds.centerMoveTo(this.shape.absoluteBounds().center());
this.edge.dockers.last().setDockedShape(this.shape);
this.edge.dockers.last().update();
this.edge._update();
if((typeof this.sourceRefPos!=="undefined")&&(typeof this.targetRefPos!=="undefined")){this.edge.dockers.first().setReferencePoint(this.sourceRefPos);
this.edge.dockers.last().setReferencePoint(this.targetRefPos)
}else{this.sourceRefPos=this.edge.dockers.first().referencePoint;
this.targetRefPos=this.edge.dockers.last().referencePoint
}}}else{var c=this.containedStencil;
var a=this.connectedShape;
var e=a.bounds;
var b=this.shape.bounds;
var f=e.center();
f.y=this.connectedShape.bounds.center().y;
if(this.containedStencil._jsonStencil.id==="http://b3mn.org/stencilset/UML2.2Class#ComplexClass"){f.y=f.y+5
}if(c.defaultAlign()==="north"){f.y-=(e.height()/2)+ORYX.CONFIG.SHAPEMENU_CREATE_OFFSET+(b.height()/2)
}else{if(c.defaultAlign()==="northeast"){f.x+=(e.width()/2)+ORYX.CONFIG.SHAPEMENU_CREATE_OFFSET_CORNER+(b.width()/2);
f.y-=(e.height()/2)+ORYX.CONFIG.SHAPEMENU_CREATE_OFFSET_CORNER+(b.height()/2)
}else{if(c.defaultAlign()==="southeast"){f.x+=(e.width()/2)+ORYX.CONFIG.SHAPEMENU_CREATE_OFFSET_CORNER+(b.width()/2);
f.y+=(e.height()/2)+ORYX.CONFIG.SHAPEMENU_CREATE_OFFSET_CORNER+(b.height()/2)
}else{if(c.defaultAlign()==="south"){f.y+=(e.height()/2)+ORYX.CONFIG.SHAPEMENU_CREATE_OFFSET+(b.height()/2)
}else{if(c.defaultAlign()==="southwest"){f.x-=(e.width()/2)+ORYX.CONFIG.SHAPEMENU_CREATE_OFFSET_CORNER+(b.width()/2);
f.y+=(e.height()/2)+ORYX.CONFIG.SHAPEMENU_CREATE_OFFSET_CORNER+(b.height()/2)
}else{if(c.defaultAlign()==="west"){f.x-=(e.width()/2)+ORYX.CONFIG.SHAPEMENU_CREATE_OFFSET+(b.width()/2)
}else{if(c.defaultAlign()==="northwest"){f.x-=(e.width()/2)+ORYX.CONFIG.SHAPEMENU_CREATE_OFFSET_CORNER+(b.width()/2);
f.y-=(e.height()/2)+ORYX.CONFIG.SHAPEMENU_CREATE_OFFSET_CORNER+(b.height()/2)
}else{f.x+=(e.width()/2)+ORYX.CONFIG.SHAPEMENU_CREATE_OFFSET+(b.width()/2)
}}}}}}}this.shape.bounds.centerMoveTo(f);
if(this.shape instanceof ORYX.Core.Node){(this.shape.dockers||[]).each(function(g){g.bounds.centerMoveTo(f)
})
}this.position=f;
if(typeof this.edge!=="undefined"){this.sourceRefPos=this.edge.dockers.first().referencePoint;
this.targetRefPos=this.edge.dockers.last().referencePoint
}}}this.facade.getCanvas().update();
this.facade.updateSelection(this.isLocal())
},rollback:function rollback(){if(typeof this.shape==="undefined"){this.shape=this.facade.getCanvas().getChildShapeByResourceId(this.shapeOptions.resourceId);
this.edge=this.facade.getCanvas().getChildShapeByResourceId(this.shapeOptions.resourceId+"_edge");
if(typeof this.shape==="undefined"||typeof this.shape==="ORYX.Core.Node"&&typeof this.edge==="undefined"){throw"Could not revert ShapeMenu.CreateCommand. this.shape or this.edge is undefined."
}}this.facade.deleteShape(this.shape);
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_SHAPEDELETED,shape:this.shape});
var b=[this.shape];
var a=this.facade.getSelection();
var d=a.without(this.shape);
if(typeof this.edge!=="undefined"){this.facade.deleteShape(this.edge);
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_SHAPEDELETED,shape:this.shape});
var d=d.without(this.edge);
b.push(this.edge)
}this.facade.getCanvas().update();
if(this.isLocal()){this.facade.setSelection(d)
}else{var c=this.facade.isDragging();
if(!c){this.facade.setSelection(d)
}else{this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_SHAPESTODELETE,deletedShapes:b})
}}this.facade.getCanvas().update();
if(this.isLocal()){this.facade.setSelection(d)
}else{var c=this.facade.isDragging();
if(!c){this.facade.setSelection(d)
}else{this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_SHAPESTODELETE,deletedShapes:b})
}}this.facade.updateSelection(this.isLocal())
}});
ORYX.Core.Commands["ShapeMenu.MorphCommand"]=ORYX.Core.AbstractCommand.extend({construct:function(a,c,b){arguments.callee.$.construct.call(this,b);
this.shape=a;
this.stencil=c;
this.facade=b;
this.newShape
},getCommandData:function getCommandData(){var a={option:{shapeOptions:{resourceId:this.shape.resourceId},stencilId:this.stencil.id(),stencilNamespace:this.stencil.namespace()}};
return a
},createFromCommandData:function createFromCommandData(d,g){var c=g.option;
var b=c.shapeOptions;
var a=d.getCanvas().getChildShapeByResourceId(b.resourceId);
if(typeof a==="undefined"){return undefined
}var f=d.getStencilSets()[c.stencilNamespace];
var e=f.stencil(c.stencilId);
return new ORYX.Core.Commands["ShapeMenu.MorphCommand"](a,e,d)
},getCommandName:function getCommandName(){return"ShapeMenu.MorphCommand"
},getDisplayName:function getDisplayName(){return"Shape morphed"
},getAffectedShapes:function getAffectedShapes(){return[this.newShape]
},execute:function(){var k=this.shape;
var o=this.stencil;
var j=k.resourceId;
var c=k.id;
var e=k.serialize();
o.properties().each((function(p){if(p.readonly()){e=e.reject(function(q){return q.name==p.id()
})
}}).bind(this));
if(this.newShape){newShape=this.newShape;
this.facade.getCanvas().add(newShape)
}else{newShape=this.facade.createShape({type:o.id(),namespace:o.namespace(),resourceId:j,shapeOptions:{resourceId:j,id:c}})
}var h=e.find(function(p){return(p.prefix==="oryx"&&p.name==="bounds")
});
var l=null;
if(!this.facade.getRules().preserveBounds(k.getStencil())){var a=h.value.split(",");
if(parseInt(a[0],10)>parseInt(a[2],10)){var f=a[0];
a[0]=a[2];
a[2]=f;
f=a[1];
a[1]=a[3];
a[3]=f
}a[2]=parseInt(a[0],10)+newShape.bounds.width();
a[3]=parseInt(a[1],10)+newShape.bounds.height();
h.value=a.join(",")
}else{var n=k.bounds.height();
var b=k.bounds.width();
if(newShape.minimumSize){if(k.bounds.height()<newShape.minimumSize.height){n=newShape.minimumSize.height
}if(k.bounds.width()<newShape.minimumSize.width){b=newShape.minimumSize.width
}}if(newShape.maximumSize){if(k.bounds.height()>newShape.maximumSize.height){n=newShape.maximumSize.height
}if(k.bounds.width()>newShape.maximumSize.width){b=newShape.maximumSize.width
}}l={a:{x:k.bounds.a.x,y:k.bounds.a.y},b:{x:k.bounds.a.x+b,y:k.bounds.a.y+n}}
}var m=k.bounds.center();
if(l!==null){newShape.bounds.set(l)
}this.setRelatedDockers(k,newShape);
var g=k.node.parentNode;
var d=k.node.nextSibling;
this.facade.deleteShape(k);
newShape.deserialize(e);
if(l!==null){newShape.bounds.set(l)
}if(o._jsonStencil.id==="http://b3mn.org/stencilset/UML2.2Class#ComplexClass"){m.y=m.y+5
}if(newShape.getStencil().type()==="edge"||(newShape.dockers.length==0||!newShape.dockers[0].getDockedShape())){newShape.bounds.centerMoveTo(m)
}if(newShape.getStencil().type()==="node"&&(newShape.dockers.length==0||!newShape.dockers[0].getDockedShape())){this.setRelatedDockers(newShape,newShape)
}if(d){g.insertBefore(newShape.node,d)
}else{g.appendChild(newShape.node)
}if(this.isLocal()){this.facade.setSelection([newShape])
}else{if(this.facade.getSelection().include(this.shape)){this.facade.setSelection(this.facade.getSelection().without(k).concat(newShape))
}}this.facade.getCanvas().update();
this.facade.updateSelection(this.isLocal());
this.newShape=newShape
},rollback:function(){if(!this.shape||!this.newShape||!this.newShape.parent){return
}this.newShape.parent.add(this.shape);
this.setRelatedDockers(this.newShape,this.shape);
this.facade.deleteShape(this.newShape);
if(this.isLocal()){this.facade.setSelection([this.shape])
}else{if(this.facade.getSelection().include(this.newShape)){this.facade.setSelection(this.facade.getSelection().without(this.newShape).concat(this.shape))
}}this.facade.getCanvas().update();
this.facade.updateSelection(this.isLocal())
},setRelatedDockers:function(a,b){if(a.getStencil().type()==="node"){(a.incoming||[]).concat(a.outgoing||[]).each(function(c){c.dockers.each(function(f){if(f.getDockedShape()==a){var e=Object.clone(f.referencePoint);
var g={x:e.x*b.bounds.width()/a.bounds.width(),y:e.y*b.bounds.height()/a.bounds.height()};
f.setDockedShape(b);
f.setReferencePoint(g);
if(c instanceof ORYX.Core.Edge){f.bounds.centerMoveTo(g)
}else{var d=a.absoluteXY();
f.bounds.centerMoveTo({x:g.x+d.x,y:g.y+d.y})
}}})
});
if(a.dockers.length>0&&a.dockers.first().getDockedShape()){b.dockers.first().setDockedShape(a.dockers.first().getDockedShape());
b.dockers.first().setReferencePoint(Object.clone(a.dockers.first().referencePoint))
}}else{b.dockers.first().setDockedShape(a.dockers.first().getDockedShape());
b.dockers.first().setReferencePoint(a.dockers.first().referencePoint);
b.dockers.last().setDockedShape(a.dockers.last().getDockedShape());
b.dockers.last().setReferencePoint(a.dockers.last().referencePoint)
}}});
if(!ORYX.Plugins){ORYX.Plugins=new Object()
}ORYX.Plugins.AddDocker=Clazz.extend({construct:function(a){this.facade=a;
this.facade.offer({name:ORYX.I18N.AddDocker.add,functionality:this.enableAddDocker.bind(this),group:ORYX.I18N.AddDocker.group,iconCls:"pw-toolbar-button pw-toolbar-add-docker",description:ORYX.I18N.AddDocker.addDesc,index:1,toggle:true,minShape:0,maxShape:0,visibleInViewMode:false});
this.facade.offer({name:ORYX.I18N.AddDocker.del,functionality:this.enableDeleteDocker.bind(this),group:ORYX.I18N.AddDocker.group,iconCls:"pw-toolbar-button pw-toolbar-remove-docker",description:ORYX.I18N.AddDocker.delDesc,index:2,toggle:true,minShape:0,maxShape:0,visibleInViewMode:false});
this.facade.registerOnEvent(ORYX.CONFIG.EVENT_MOUSEDOWN,this.handleMouseDown.bind(this))
},enableAddDocker:function(a,b){this.addDockerButton=a;
if(b){this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_DISPLAY_SCHLAUMEIER,message:"Try Alt+Click on an edge to add docker."});
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_DISABLE_DOCKER_CREATION})
}else{if(!(this.enabledDelete())){this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_ENABLE_DOCKER_CREATION})
}}if(b&&this.deleteDockerButton){this.deleteDockerButton.toggle(false)
}},enableDeleteDocker:function(a,b){this.deleteDockerButton=a;
if(b){this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_DISPLAY_SCHLAUMEIER,message:"Try Alt+Click on a docker to remove it."});
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_DISABLE_DOCKER_CREATION})
}if(b&&this.addDockerButton){this.addDockerButton.toggle(false)
}else{if(!b&&!(this.enabledAdd())){this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_ENABLE_DOCKER_CREATION})
}}},enabledAdd:function(){return this.addDockerButton?this.addDockerButton.pressed:false
},enabledDelete:function(){return this.deleteDockerButton?this.deleteDockerButton.pressed:false
},handleMouseDown:function(b,a){if(this.enabledAdd()&&a instanceof ORYX.Core.Edge){this.newDockerCommand({edge:a,position:this.facade.eventCoordinates(b)})
}else{if(this.enabledDelete()&&a instanceof ORYX.Core.Controls.Docker&&a.parent instanceof ORYX.Core.Edge){if((a.parent.dockers.first()!==a)&&(a.parent.dockers.last()!==a)){this.newDockerCommand({edge:a.parent,docker:a})
}}else{if(this.enabledAdd()){this.addDockerButton.toggle(false)
}else{if(this.enabledDelete()){this.deleteDockerButton.toggle(false)
}}}}},newDockerCommand:function newDockerCommand(b){if(!b.edge){return
}var a={options:b};
var c=new ORYX.Core.Commands["DockerCreation.NewDockerCommand"](this.enabledAdd(),this.enabledDelete(),b.edge,b.docker,b.position,this.facade,a);
this.facade.executeCommands([c])
}});
if(!ORYX.Plugins){ORYX.Plugins=new Object()
}ORYX.Core.Commands["ShapeRepository.DropCommand"]=ORYX.Core.AbstractCommand.extend({construct:function construct(d,b,e,a,c){arguments.callee.$.construct.call(this,c);
this.option=d;
this.currentParent=b;
this.canAttach=e;
this.position=a;
this.selection=this.facade.getSelection();
this.shape;
this.parent
},getAffectedShapes:function getAffectedShapes(){if(typeof this.shape!=="undefined"){return[this.shape]
}return[]
},getCommandName:function getCommandName(){return"ShapeRepository.DropCommand"
},getDisplayName:function getDisplayName(){return"Shape created"
},getCommandData:function getCommandData(){var a={id:this.shape.id,resourceId:this.shape.resourceId,parent:this.parent.resourceId,currentParent:this.currentParent.resourceId,position:this.position,optionsPosition:this.option.position,namespace:this.option.namespace,type:this.option.type,canAttach:this.canAttach};
return a
},createFromCommandData:function createFromCommandData(d,e){var b=d.getCanvas().getChildShapeOrCanvasByResourceId(e.currentParent);
var c=d.getCanvas().getChildShapeOrCanvasByResourceId(e.parent);
if(typeof c==="undefined"||typeof b==="undefined"){return undefined
}var a={shapeOptions:{id:e.id,resourceId:e.resourceId},position:e.optionsPosition,namespace:e.namespace,type:e.type};
a.parent=c;
return new ORYX.Core.Commands["ShapeRepository.DropCommand"](a,b,e.canAttach,e.position,d)
},execute:function execute(){if(!this.shape){this.shape=this.facade.createShape(this.option);
this.parent=this.shape.parent
}else{this.parent.add(this.shape)
}if(this.canAttach&&this.currentParent instanceof ORYX.Core.Node&&this.shape.dockers.length>0){var c=this.shape.dockers[0];
if(this.currentParent.parent instanceof ORYX.Core.Node){this.currentParent.parent.add(c.parent)
}var b=this.facade.getCanvas().node.ownerSVGElement.createSVGPoint();
b.x=(this.currentParent.absoluteBounds().lowerRight().x-this.position.x)/this.currentParent.bounds.width();
b.y=(this.currentParent.absoluteBounds().lowerRight().y-this.position.y)/this.currentParent.bounds.height();
var a;
if(typeof this.currentParent!=="undefined"){a=this.facade.getCanvas().node.ownerSVGElement.createSVGPoint();
if((0>b.x)||(b.x>1)||(0>b.y)||(b.y>1)){b.x=0;
b.y=0
}a.x=Math.abs(this.currentParent.absoluteBounds().lowerRight().x-b.x*this.currentParent.bounds.width());
a.y=Math.abs(this.currentParent.absoluteBounds().lowerRight().y-b.y*this.currentParent.bounds.height())
}else{a=b
}c.bounds.centerMoveTo(a);
c.setDockedShape(this.currentParent)
}this.facade.getCanvas().update();
this.facade.updateSelection(this.isLocal())
},rollback:function rollback(){if(typeof this.shape==="undefined"){this.shape=this.facade.getCanvas().getChildShapeByResourceId(this.option.shapeOptions.resourceId);
if(typeof this.shape==="undefined"){throw"Could not revert Shaperepository.DropCommand. this.shape is undefined."
}}this.facade.deleteShape(this.shape);
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_SHAPEDELETED,shape:this.shape});
var a=this.facade.getSelection();
var c=a.without(this.shape);
this.facade.getCanvas().update();
if(this.isLocal()){this.facade.setSelection(c)
}else{var b=this.facade.isDragging();
if(!b){this.facade.setSelection(c)
}else{this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_SHAPESTODELETE,deletedShapes:[this.shape]})
}}this.facade.updateSelection(this.isLocal())
}});
ORYX.Plugins.NewShapeRepository={construct:function(b){arguments.callee.$.construct.call(this,b);
this.facade=b;
this._currentParent;
this._canContain=undefined;
this._canAttach=undefined;
this.canvasContainer=$$(".ORYX_Editor")[0].parentNode;
this.shapeList=document.createElement("div");
this.shapeList.id="pwave-repository";
this.canvasContainer.appendChild(this.shapeList);
this.groupStencils=[];
var a=new Ext.dd.DragZone(this.shapeList,{shadow:!Ext.isMac,hasOuterHandles:true});
a.onDrag=function(){this.groupStencils.each(this._hideGroupStencil)
}.bind(this);
a.afterDragDrop=this.drop.bind(this,a);
a.beforeDragOver=this.beforeDragOver.bind(this,a);
a.beforeDragEnter=function(){this._lastOverElement=false;
return true
}.bind(this);
this.setStencilSets();
this.hoverTimeout=undefined;
this.timesHidden=0;
this.facade.registerOnEvent(ORYX.CONFIG.EVENT_STENCIL_SET_LOADED,this.setStencilSets.bind(this));
this.facade.registerOnEvent(ORYX.CONFIG.EVENT_MODE_CHANGED,this._handleModeChanged.bind(this))
},_handleModeChanged:function _handleModeChanged(a){this._setVisibility(a.mode.isEditMode()&&!a.mode.isPaintMode())
},getVisibleCanvasHeight:function getVisibleCanvasHeight(){var a=$$(".ORYX_Editor")[0].parentNode;
return a.offsetHeight
},setStencilSets:function(){var a=this.shapeList.firstChild;
while(a){this.shapeList.removeChild(a);
a=this.shapeList.firstChild
}this.facade.getStencilSets().values().each((function(d){var f=d.title();
var c=d.extensions();
if(c&&c.size()>0){f+=" / "+ORYX.Core.StencilSet.getTranslation(c.values()[0],"title")
}var b=document.createElement("div");
this.shapeList.appendChild(b);
var e=d.stencils(this.facade.getCanvas().getStencil(),this.facade.getRules());
var g=new Hash();
e=e.sortBy(function(h){return h.position()
});
e.each((function(j){var h=j.groups();
h.each((function(q){var p=!g[q];
var o=undefined;
if(p){o=this.createGroupStencilNode(b,j,q);
var n=this.createGroupElement(o,q);
g[q]=n;
this.addGroupStencilHoverListener(o);
this.groupStencils.push(o)
}var k=this.createStencilTreeNode(g[q],j);
var m=[];
for(var l=0;
l<k.childNodes.length;
l++){m.push(k.childNodes[l])
}if(p){m.push(o.firstChild)
}Ext.dd.Registry.register(k,{handles:m,isHandle:true,type:j.id(),namespace:j.namespace()})
}).bind(this))
}).bind(this))
}).bind(this))
},addGroupStencilHoverListener:function addGroupStencilHoverListener(a){var d={};
var c=function c(e){clearTimeout(d);
this._hideGroupStencil(a)
}.bind(this);
var b=function b(e){var f=function f(){var j=jQuery(a).children(".new-repository-group");
var l=jQuery(j).children(".new-repository-group-left-bar");
var g=jQuery(j).children(".new-repository-group-header");
var h=a.getBoundingClientRect();
j.css("top",h.top+"px");
j.css("left",h.right-1+"px");
j.addClass("new-repository-group-visible");
var n=g[0].getBoundingClientRect();
var k=530;
if(n.bottom>k){var m=n.bottom-k;
j.css("top",n.top-m+"px");
l.css("height",h.bottom+1-j.position().top+"px")
}};
d=setTimeout(f,500)
};
jQuery(a).bind("mouseenter",b);
jQuery(a).bind("mouseleave",c)
},createGroupStencilNode:function createGroupStencilNode(c,d,b){var e=document.createElement("div");
e.className="new-repository-group-stencil";
var a=document.createElement("div");
a.className="new-repository-group-stencil-bg";
a.style.backgroundImage="url("+d.bigIcon()+")";
e.appendChild(a);
c.appendChild(e);
return e
},createStencilTreeNode:function createStencilTreeNode(c,e){var a=jQuery('<div class="new-repository-group-row"></div>');
a.append('<div class="new-repository-group-row-lefthighlight"></div>');
var d=jQuery('<div class="new-repository-group-row-entry"></div>');
var b=jQuery("<img></img>");
b.attr("src",e.icon());
d.append(b);
d.append(e.title());
a.append(d);
a.append('<div class="new-repository-group-row-righthighlight"></div>');
jQuery(c).find(".new-repository-group-entries:first").append(a);
return d[0]
},createGroupElement:function createGroupElement(b,c){var a=jQuery("<div class='new-repository-group'><div class='new-repository-group-left-bar'><div class='new-repository-group-left-bar-bottom-gradient'></div><div class='new-repository-group-left-bar-bottom-highlight'></div></div><div class='new-repository-group-header'><div style='position: relative; width: 100%'><div class='new-repository-group-header-left-highlight'></div><div class='new-repository-group-header-label'></div><div class='new-repository-group-header-right-highlight'></div><div class='new-repository-group-content'><div class='new-repository-group-entries'></div></div></div></div></div>");
a.find(".new-repository-group-header-label").text(c);
jQuery(b).append(a);
return a[0]
},_hideGroupStencil:function _hideGroupStencil(b){var a=jQuery(b).children(".new-repository-group:first");
a.removeClass("new-repository-group-visible")
},drop:function(h,f,b){this._lastOverElement=undefined;
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_HIGHLIGHT_HIDE,highlightId:"shapeRepo.added"});
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_HIGHLIGHT_HIDE,highlightId:"shapeRepo.attached"});
var g=h.getProxy();
if(g.dropStatus==g.dropNotAllowed){return
}if(!this._currentParent){return
}var e=Ext.dd.Registry.getHandle(f.DDM.currentTarget);
e.shapeOptions=undefined;
var m=b.getXY();
var j={x:m[0],y:m[1]};
var k=this.facade.getCanvas().node.getScreenCTM();
j.x-=k.e;
j.y-=k.f;
j.x/=k.a;
j.y/=k.d;
j.x-=document.documentElement.scrollLeft;
j.y-=document.documentElement.scrollTop;
var l=this._currentParent.absoluteXY();
j.x-=l.x;
j.y-=l.y;
e.position=j;
if(this._canAttach&&this._currentParent instanceof ORYX.Core.Node){e.parent=undefined
}else{e.parent=this._currentParent
}var d=this.facade.eventCoordinates(b.browserEvent);
var c=new ORYX.Core.Commands["ShapeRepository.DropCommand"](e,this._currentParent,this._canAttach,d,this.facade);
this.facade.executeCommands([c]);
this._currentParent=undefined
},beforeDragOver:function(h,f,b){var a;
var e=this.facade.eventCoordinates(b.browserEvent);
var l=this.facade.getCanvas().getAbstractShapesAtPosition(e);
if(l.length<=0){a=h.getProxy();
a.setStatus(a.dropNotAllowed);
a.sync();
return false
}var c=l.last();
if(l.lenght==1&&l[0] instanceof ORYX.Core.Canvas){return false
}else{var d=Ext.dd.Registry.getHandle(f.DDM.currentTarget);
var j=this.facade.getStencilSets()[d.namespace];
var k=j.stencil(d.type);
if(k.type()==="node"){var g=l.reverse().find(function(m){return(m instanceof ORYX.Core.Canvas||m instanceof ORYX.Core.Node||m instanceof ORYX.Core.Edge)
});
if(g!==this._lastOverElement){this._canAttach=undefined;
this._canContain=undefined
}if(g){if(!(g instanceof ORYX.Core.Canvas)&&g.isPointOverOffset(e.x,e.y)&&this._canAttach==undefined){this._canAttach=this.facade.getRules().canConnect({sourceShape:g,edgeStencil:k,targetStencil:k});
if(this._canAttach){this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_HIGHLIGHT_SHOW,highlightId:"shapeRepo.attached",elements:[g],style:ORYX.CONFIG.SELECTION_HIGHLIGHT_STYLE_RECTANGLE,color:ORYX.CONFIG.SELECTION_VALID_COLOR});
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_HIGHLIGHT_HIDE,highlightId:"shapeRepo.added"});
this._canContain=undefined
}}if(!(g instanceof ORYX.Core.Canvas)&&!g.isPointOverOffset(e.x,e.y)){this._canAttach=this._canAttach==false?this._canAttach:undefined
}if(this._canContain==undefined&&!this._canAttach){this._canContain=this.facade.getRules().canContain({containingShape:g,containedStencil:k});
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_HIGHLIGHT_SHOW,highlightId:"shapeRepo.added",elements:[g],color:this._canContain?ORYX.CONFIG.SELECTION_VALID_COLOR:ORYX.CONFIG.SELECTION_INVALID_COLOR});
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_HIGHLIGHT_HIDE,highlightId:"shapeRepo.attached"})
}this._currentParent=this._canContain||this._canAttach?g:undefined;
this._lastOverElement=g;
a=h.getProxy();
a.setStatus(this._currentParent?a.dropAllowed:a.dropNotAllowed);
a.sync()
}}else{this._currentParent=this.facade.getCanvas();
a=h.getProxy();
a.setStatus(a.dropAllowed);
a.sync()
}}return false
},_setVisibility:function _setVisibility(a){if(a){this.shapeList.show()
}else{this.shapeList.hide()
}}};
ORYX.Plugins.NewShapeRepository=Clazz.extend(ORYX.Plugins.NewShapeRepository);
if(!ORYX.Plugins){ORYX.Plugins=new Object()
}ORYX.Plugins.ShapeHighlighting=Clazz.extend({construct:function(a){this.parentNode=a.getCanvas().getSvgContainer();
this.node=ORYX.Editor.graft("http://www.w3.org/2000/svg",this.parentNode,["g"]);
this.highlightNodes={};
a.registerOnEvent(ORYX.CONFIG.EVENT_HIGHLIGHT_SHOW,this.setHighlight.bind(this));
a.registerOnEvent(ORYX.CONFIG.EVENT_HIGHLIGHT_HIDE,this.hideHighlight.bind(this))
},setHighlight:function(a){if(a&&a.highlightId){var b=this.highlightNodes[a.highlightId];
if(!b){b=ORYX.Editor.graft("http://www.w3.org/2000/svg",this.node,["path",{"stroke-width":2,fill:"none"}]);
this.highlightNodes[a.highlightId]=b
}if(a.elements&&a.elements.length>0){this.setAttributesByStyle(b,a);
this.show(b)
}else{this.hide(b)
}}},hideHighlight:function(a){if(a&&a.highlightId&&this.highlightNodes[a.highlightId]){this.hide(this.highlightNodes[a.highlightId])
}},hide:function(a){a.setAttributeNS(null,"display","none")
},show:function(a){a.setAttributeNS(null,"display","")
},setAttributesByStyle:function(b,a){if(a.style&&a.style==ORYX.CONFIG.SELECTION_HIGHLIGHT_STYLE_RECTANGLE){var d=a.elements[0].absoluteBounds();
var c=a.strokewidth?a.strokewidth:ORYX.CONFIG.BORDER_OFFSET;
b.setAttributeNS(null,"d",this.getPathRectangle(d.a,d.b,c));
b.setAttributeNS(null,"stroke",a.color?a.color:ORYX.CONFIG.SELECTION_HIGHLIGHT_COLOR);
b.setAttributeNS(null,"stroke-opacity",a.opacity?a.opacity:0.2);
b.setAttributeNS(null,"stroke-width",c)
}else{if(a.elements.length==1&&a.elements[0] instanceof ORYX.Core.Edge&&a.highlightId!="selection"){b.setAttributeNS(null,"d",this.getPathEdge(a.elements[0].dockers));
b.setAttributeNS(null,"stroke",a.color?a.color:ORYX.CONFIG.SELECTION_HIGHLIGHT_COLOR);
b.setAttributeNS(null,"stroke-opacity",a.opacity?a.opacity:0.2);
b.setAttributeNS(null,"stroke-width",ORYX.CONFIG.OFFSET_EDGE_BOUNDS)
}else{b.setAttributeNS(null,"d",this.getPathByElements(a.elements));
b.setAttributeNS(null,"stroke",a.color?a.color:ORYX.CONFIG.SELECTION_HIGHLIGHT_COLOR);
b.setAttributeNS(null,"stroke-opacity",a.opacity?a.opacity:1);
b.setAttributeNS(null,"stroke-width",a.strokewidth?a.strokewidth:2)
}}},getPathByElements:function(a){if(!a||a.length<=0){return undefined
}var c=ORYX.CONFIG.SELECTED_AREA_PADDING;
var b="";
a.each((function(f){if(!f){return
}var g=f.absoluteBounds();
g.widen(c);
var e=g.upperLeft();
var d=g.lowerRight();
b=b+this.getPath(e,d)
}).bind(this));
return b
},getPath:function(d,c){return this.getPathCorners(d,c)
},getPathCorners:function(d,c){var e=ORYX.CONFIG.SELECTION_HIGHLIGHT_SIZE;
var f="";
f=f+"M"+d.x+" "+(d.y+e)+" l0 -"+e+" l"+e+" 0 ";
f=f+"M"+d.x+" "+(c.y-e)+" l0 "+e+" l"+e+" 0 ";
f=f+"M"+c.x+" "+(c.y-e)+" l0 "+e+" l-"+e+" 0 ";
f=f+"M"+c.x+" "+(d.y+e)+" l0 -"+e+" l-"+e+" 0 ";
return f
},getPathRectangle:function(d,c,h){var e=ORYX.CONFIG.SELECTION_HIGHLIGHT_SIZE;
var f="";
var g=h/2;
f=f+"M"+(d.x+g)+" "+(d.y);
f=f+" L"+(d.x+g)+" "+(c.y-g);
f=f+" L"+(c.x-g)+" "+(c.y-g);
f=f+" L"+(c.x-g)+" "+(d.y+g);
f=f+" L"+(d.x+g)+" "+(d.y+g);
return f
},getPathEdge:function(a){var b=a.length;
var c="M"+a[0].bounds.center().x+" "+a[0].bounds.center().y;
for(i=1;
i<b;
i++){var d=a[i].bounds.center();
c=c+" L"+d.x+" "+d.y
}return c
}});
ORYX.Plugins.HighlightingSelectedShapes=Clazz.extend({construct:function(a){this.facade=a;
this.opacityFull=0.9;
this.opacityLow=0.4;
this.facade.registerOnEvent(ORYX.CONFIG.EVENT_CANVAS_RESIZE_UPDATE_HIGHLIGHTS,this.onSelectionChanged.bind(this))
},onSelectionChanged:function(a){if(a.elements&&a.elements.length>1){this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_HIGHLIGHT_SHOW,highlightId:"selection",elements:a.elements.without(a.subSelection),color:ORYX.CONFIG.SELECTION_HIGHLIGHT_COLOR,opacity:!a.subSelection?this.opacityFull:this.opacityLow});
if(a.subSelection){this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_HIGHLIGHT_SHOW,highlightId:"subselection",elements:[a.subSelection],color:ORYX.CONFIG.SELECTION_HIGHLIGHT_COLOR,opacity:this.opacityFull})
}else{this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_HIGHLIGHT_HIDE,highlightId:"subselection"})
}}else{this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_HIGHLIGHT_HIDE,highlightId:"selection"});
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_HIGHLIGHT_HIDE,highlightId:"subselection"})
}}});
if(!ORYX.Plugins){ORYX.Plugins=new Object()
}ORYX.Plugins.ShapeHighlighting=Clazz.extend({construct:function(a){this.parentNode=a.getCanvas().getSvgContainer();
this.node=ORYX.Editor.graft("http://www.w3.org/2000/svg",this.parentNode,["g"]);
this.highlightNodes={};
a.registerOnEvent(ORYX.CONFIG.EVENT_HIGHLIGHT_SHOW,this.setHighlight.bind(this));
a.registerOnEvent(ORYX.CONFIG.EVENT_HIGHLIGHT_HIDE,this.hideHighlight.bind(this))
},setHighlight:function(a){if(a&&a.highlightId){var b=this.highlightNodes[a.highlightId];
if(!b){b=ORYX.Editor.graft("http://www.w3.org/2000/svg",this.node,["path",{"stroke-width":2,fill:"none"}]);
this.highlightNodes[a.highlightId]=b
}if(a.elements&&a.elements.length>0){this.setAttributesByStyle(b,a);
this.show(b)
}else{this.hide(b)
}}},hideHighlight:function(a){if(a&&a.highlightId&&this.highlightNodes[a.highlightId]){this.hide(this.highlightNodes[a.highlightId])
}},hide:function(a){a.setAttributeNS(null,"display","none")
},show:function(a){a.setAttributeNS(null,"display","")
},setAttributesByStyle:function(b,a){if(a.style&&a.style==ORYX.CONFIG.SELECTION_HIGHLIGHT_STYLE_RECTANGLE){var d=a.elements[0].absoluteBounds();
var c=a.strokewidth?a.strokewidth:ORYX.CONFIG.BORDER_OFFSET;
b.setAttributeNS(null,"d",this.getPathRectangle(d.a,d.b,c));
b.setAttributeNS(null,"stroke",a.color?a.color:ORYX.CONFIG.SELECTION_HIGHLIGHT_COLOR);
b.setAttributeNS(null,"stroke-opacity",a.opacity?a.opacity:0.2);
b.setAttributeNS(null,"stroke-width",c)
}else{if(a.elements.length==1&&a.elements[0] instanceof ORYX.Core.Edge&&a.highlightId!="selection"){b.setAttributeNS(null,"d",this.getPathEdge(a.elements[0].dockers));
b.setAttributeNS(null,"stroke",a.color?a.color:ORYX.CONFIG.SELECTION_HIGHLIGHT_COLOR);
b.setAttributeNS(null,"stroke-opacity",a.opacity?a.opacity:0.2);
b.setAttributeNS(null,"stroke-width",ORYX.CONFIG.OFFSET_EDGE_BOUNDS)
}else{b.setAttributeNS(null,"d",this.getPathByElements(a.elements));
b.setAttributeNS(null,"stroke",a.color?a.color:ORYX.CONFIG.SELECTION_HIGHLIGHT_COLOR);
b.setAttributeNS(null,"stroke-opacity",a.opacity?a.opacity:1);
b.setAttributeNS(null,"stroke-width",a.strokewidth?a.strokewidth:2)
}}},getPathByElements:function(a){if(!a||a.length<=0){return undefined
}var c=ORYX.CONFIG.SELECTED_AREA_PADDING;
var b="";
a.each((function(f){if(!f){return
}var g=f.absoluteBounds();
g.widen(c);
var e=g.upperLeft();
var d=g.lowerRight();
b=b+this.getPath(e,d)
}).bind(this));
return b
},getPath:function(d,c){return this.getPathCorners(d,c)
},getPathCorners:function(d,c){var e=ORYX.CONFIG.SELECTION_HIGHLIGHT_SIZE;
var f="";
f=f+"M"+d.x+" "+(d.y+e)+" l0 -"+e+" l"+e+" 0 ";
f=f+"M"+d.x+" "+(c.y-e)+" l0 "+e+" l"+e+" 0 ";
f=f+"M"+c.x+" "+(c.y-e)+" l0 "+e+" l-"+e+" 0 ";
f=f+"M"+c.x+" "+(d.y+e)+" l0 -"+e+" l-"+e+" 0 ";
return f
},getPathRectangle:function(d,c,h){var e=ORYX.CONFIG.SELECTION_HIGHLIGHT_SIZE;
var f="";
var g=h/2;
f=f+"M"+(d.x+g)+" "+(d.y);
f=f+" L"+(d.x+g)+" "+(c.y-g);
f=f+" L"+(c.x-g)+" "+(c.y-g);
f=f+" L"+(c.x-g)+" "+(d.y+g);
f=f+" L"+(d.x+g)+" "+(d.y+g);
return f
},getPathEdge:function(a){var b=a.length;
var c="M"+a[0].bounds.center().x+" "+a[0].bounds.center().y;
for(i=1;
i<b;
i++){var d=a[i].bounds.center();
c=c+" L"+d.x+" "+d.y
}return c
}});
ORYX.Plugins.HighlightingSelectedShapes=Clazz.extend({construct:function(a){this.facade=a;
this.opacityFull=0.9;
this.opacityLow=0.4;
this.facade.registerOnEvent(ORYX.CONFIG.EVENT_CANVAS_RESIZE_UPDATE_HIGHLIGHTS,this.onSelectionChanged.bind(this))
},onSelectionChanged:function(a){if(a.elements&&a.elements.length>1){this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_HIGHLIGHT_SHOW,highlightId:"selection",elements:a.elements.without(a.subSelection),color:ORYX.CONFIG.SELECTION_HIGHLIGHT_COLOR,opacity:!a.subSelection?this.opacityFull:this.opacityLow});
if(a.subSelection){this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_HIGHLIGHT_SHOW,highlightId:"subselection",elements:[a.subSelection],color:ORYX.CONFIG.SELECTION_HIGHLIGHT_COLOR,opacity:this.opacityFull})
}else{this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_HIGHLIGHT_HIDE,highlightId:"subselection"})
}}else{this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_HIGHLIGHT_HIDE,highlightId:"selection"});
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_HIGHLIGHT_HIDE,highlightId:"subselection"})
}}});
Array.prototype.insertFrom=function(e,d){d=Math.max(0,d);
e=Math.min(Math.max(0,e),this.length-1);
var b=this[e];
var a=this.without(b);
var c=a.slice(0,d);
c.push(b);
if(a.length>d){c=c.concat(a.slice(d))
}return c
};
if(!ORYX.Plugins){ORYX.Plugins=new Object()
}ORYX.Plugins.ArrangementLight=Clazz.extend({facade:undefined,construct:function(a){this.facade=a;
this.facade.registerOnEvent(ORYX.CONFIG.EVENT_ARRANGEMENTLIGHT_TOP,this.setZLevel.bind(this,this.setToTop));
this.facade.registerOnEvent(ORYX.CONFIG.EVENT_ARRANGEMENTLIGHT_BACK,this.setZLevel.bind(this,this.setToBack));
this.facade.registerOnEvent(ORYX.CONFIG.EVENT_ARRANGEMENTLIGHT_FORWARD,this.setZLevel.bind(this,this.setForward));
this.facade.registerOnEvent(ORYX.CONFIG.EVENT_ARRANGEMENTLIGHT_BACKWARD,this.setZLevel.bind(this,this.setBackward))
},setZLevel:function(d,b){var a=ORYX.Core.Command.extend({construct:function(g,f,e){this.callback=g;
this.elements=f;
this.elAndIndex=f.map(function(h){return{el:h,previous:h.parent.children[h.parent.children.indexOf(h)-1]}
});
this.facade=e
},execute:function(){this.callback(this.elements)
},rollback:function(){var g=this.elAndIndex.sortBy(function(m){var n=m.el;
var l=$A(n.node.parentNode.childNodes);
return l.indexOf(n.node)
});
for(var f=0;
f<g.length;
f++){var h=g[f].el;
var j=h.parent;
var k=j.children.indexOf(h);
var e=j.children.indexOf(g[f].previous);
e=e||0;
j.children=j.children.insertFrom(k,e);
h.node.parentNode.insertBefore(h.node,h.node.parentNode.childNodes[e+1])
}}});
var c=new a(d,[b.shape],this.facade);
c.execute()
},setToTop:function(b){var a=b.sortBy(function(e,c){var d=$A(e.node.parentNode.childNodes);
return d.indexOf(e.node)
});
a.each(function(c){var d=c.parent;
d.children=d.children.without(c);
d.children.push(c);
c.node.parentNode.appendChild(c.node)
})
},setToBack:function(b){var a=b.sortBy(function(e,c){var d=$A(e.node.parentNode.childNodes);
return d.indexOf(e.node)
});
a=a.reverse();
a.each(function(c){var d=c.parent;
d.children=d.children.without(c);
d.children.unshift(c);
c.node.parentNode.insertBefore(c.node,c.node.parentNode.firstChild)
})
},setBackward:function(c){var b=c.sortBy(function(f,d){var e=$A(f.node.parentNode.childNodes);
return e.indexOf(f.node)
});
b=b.reverse();
var a=b.findAll(function(d){return !b.some(function(e){return e.node==d.node.previousSibling
})
});
a.each(function(e){if(e.node.previousSibling===null){return
}var f=e.parent;
var d=f.children.indexOf(e);
f.children=f.children.insertFrom(d,d-1);
e.node.parentNode.insertBefore(e.node,e.node.previousSibling)
})
},setForward:function(c){var b=c.sortBy(function(f,d){var e=$A(f.node.parentNode.childNodes);
return e.indexOf(f.node)
});
var a=b.findAll(function(d){return !b.some(function(e){return e.node==d.node.nextSibling
})
});
a.each(function(f){var d=f.node.nextSibling;
if(d===null){return
}var e=f.parent.children.indexOf(f);
var g=f.parent;
g.children=g.children.insertFrom(e,e+1);
f.node.parentNode.insertBefore(d,f.node)
})
}});
if(!ORYX.Plugins){ORYX.Plugins=new Object()
}ORYX.Core.Commands["DockerCreation.NewDockerCommand"]=ORYX.Core.AbstractCommand.extend({construct:function construct(f,d,c,e,g,b,a){arguments.callee.$.construct.call(this,b);
this.addEnabled=f;
this.deleteEnabled=d;
this.edge=c;
this.docker=e;
this.pos=g;
this.facade=b;
this.id=a.dockerId;
this.index=a.index;
this.options=a.options
},execute:function(){if(this.addEnabled){this.docker=this.edge.addDocker(this.pos,this.docker,this.id);
if(typeof this.docker==="undefined"){this.docker=this.edge.createDocker(this.index,this.pos,this.id)
}else{this.index=this.edge.dockers.indexOf(this.docker)
}}else{if(this.deleteEnabled){if(typeof this.docker!=="undefined"){this.index=this.edge.dockers.indexOf(this.docker);
this.pos=this.docker.bounds.center();
this.edge.removeDocker(this.docker)
}}}this.facade.getCanvas().update();
this.facade.updateSelection();
this.options.docker=this.docker
},rollback:function(){if(this.addEnabled){if(this.docker instanceof ORYX.Core.Controls.Docker){this.edge.removeDocker(this.docker)
}}else{if(this.deleteEnabled){if(typeof this.docker!=="undefined"){this.edge.add(this.docker,this.index)
}}}this.facade.getCanvas().update();
this.facade.updateSelection()
},getCommandData:function getCommandData(){var b=function(d){return d.resourceId
};
var a=function(d){var e;
if(typeof d!=="undefined"){e=d.id
}return e
};
var c={index:this.index,name:"DockerCreation.NewDockerCommand",addEnabled:this.addEnabled,deleteEnabled:this.deleteEnabled,edgeId:b(this.edge),dockerPositionArray:this.pos,dockerId:a(this.docker)};
return c
},createFromCommandData:function createFromCommandData(m,e){var j=e.addEnabled;
var d=e.deleteEnabled;
var c=m.getCanvas();
var a=c.getChildShapeByResourceId.bind(c);
var b=a(e.edgeId);
var g;
if(typeof b==="undefined"){return undefined
}if(d){for(var h=0;
h<b.dockers.length;
h++){if(b.dockers[h].id==e.dockerId){g=b.dockers[h]
}}}if(j){var f=e.dockerPositionArray;
var k=c.node.ownerSVGElement.createSVGPoint();
k.x=f.x;
k.y=f.y
}var l={dockerId:e.dockerId,index:e.index,options:{}};
return new ORYX.Core.Commands["DockerCreation.NewDockerCommand"](j,d,b,g,k,m,l)
},getCommandName:function getCommandName(){return"DockerCreation.NewDockerCommand"
},getDisplayName:function getDisplayName(){if(this.addEnabled){return"Docker added"
}return"Docker deleted"
},getAffectedShapes:function getAffectedShapes(){return[this.edge]
}});
ORYX.Plugins.DockerCreation=Clazz.extend({construct:function(a){this.facade=a;
this.active=false;
this.point={x:0,y:0};
this.ctrlPressed=false;
this.creationAllowed=true;
this.circle=ORYX.Editor.graft("http://www.w3.org/2000/svg",null,["g",{"pointer-events":"none"},["circle",{cx:"8",cy:"8",r:"3",fill:"yellow"}]]);
this.facade.offer({keyCodes:[{keyCode:18,keyAction:ORYX.CONFIG.KEY_ACTION_UP}],functionality:this.keyUp.bind(this)});
this.facade.offer({keyCodes:[{metaKeys:[ORYX.CONFIG.META_KEY_ALT],keyCode:18,keyAction:ORYX.CONFIG.KEY_ACTION_DOWN}],functionality:this.keyDown.bind(this)});
this.facade.registerOnEvent(ORYX.CONFIG.EVENT_MOUSEDOWN,this.handleMouseDown.bind(this));
this.facade.registerOnEvent(ORYX.CONFIG.EVENT_MOUSEOVER,this.handleMouseOver.bind(this));
this.facade.registerOnEvent(ORYX.CONFIG.EVENT_MOUSEOUT,this.handleMouseOut.bind(this));
this.facade.registerOnEvent(ORYX.CONFIG.EVENT_MOUSEMOVE,this.handleMouseMove.bind(this));
this.facade.registerOnEvent(ORYX.CONFIG.EVENT_DISABLE_DOCKER_CREATION,this.handleDisableDockerCreation.bind(this));
this.facade.registerOnEvent(ORYX.CONFIG.EVENT_ENABLE_DOCKER_CREATION,this.handleEnableDockerCreation.bind(this));
this.facade.registerOnEvent(ORYX.CONFIG.EVENT_DBLCLICK,function(){window.clearTimeout(this.timer)
}.bind(this));
this.facade.registerOnEvent(ORYX.CONFIG.EVENT_MOUSEUP,function(){window.clearTimeout(this.timer)
}.bind(this))
},keyDown:function keyDown(a){this.ctrlPressed=true
},keyUp:function keyUp(a){this.ctrlPressed=false;
this.hideOverlay();
this.active=false
},handleDisableDockerCreation:function handleDisableDockerCreation(a){this.creationAllowed=false
},handleEnableDockerCreation:function handleEnableDockerCreation(a){this.creationAllowed=true
},handleMouseOut:function handleMouseOut(b,a){if(this.active){this.hideOverlay();
this.active=false
}},handleMouseOver:function handleMouseOver(b,a){this.point.x=this.facade.eventCoordinates(b).x;
this.point.y=this.facade.eventCoordinates(b).y;
if(a instanceof ORYX.Core.Edge&&this.ctrlPressed&&this.creationAllowed){this.showOverlay(a,this.point);
this.active=true
}},handleMouseDown:function handleMouseDown(b,a){if(this.ctrlPressed&&this.creationAllowed&&b.which==1){if(a instanceof ORYX.Core.Edge){this.addDockerCommand({edge:a,event:b,position:this.facade.eventCoordinates(b)});
this.hideOverlay()
}else{if(a instanceof ORYX.Core.Controls.Docker&&a.parent instanceof ORYX.Core.Edge){if((a.parent.dockers.first()!==a)&&(a.parent.dockers.last()!==a)){this.deleteDockerCommand({edge:a.parent,docker:a})
}}}}},handleMouseMove:function handleMouseMove(b,a){if(a instanceof ORYX.Core.Edge&&this.ctrlPressed&&this.creationAllowed){this.point.x=this.facade.eventCoordinates(b).x;
this.point.y=this.facade.eventCoordinates(b).y;
if(this.active){this.hideOverlay();
this.showOverlay(a,this.point)
}else{this.showOverlay(a,this.point)
}}},addDockerCommand:function addDockerCommand(b){if(!b.edge){return
}var a={options:b};
var c=new ORYX.Core.Commands["DockerCreation.NewDockerCommand"](true,false,b.edge,b.docker,b.position,this.facade,a);
this.facade.executeCommands([c]);
this.facade.raiseEvent({uiEvent:b.event,type:ORYX.CONFIG.EVENT_DOCKERDRAG},b.docker)
},deleteDockerCommand:function deleteDockerCommand(b){if(!b.edge){return
}var a={options:b};
var c=new ORYX.Core.Commands["DockerCreation.NewDockerCommand"](false,true,b.edge,b.docker,b.position,this.facade,a);
this.facade.executeCommands([c])
},showOverlay:function showOverlay(b,a){if(this.facade.isReadOnlyMode()){return
}this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_OVERLAY_SHOW,id:"ghostpoint",shapes:[b],node:this.circle,ghostPoint:a,dontCloneNode:true})
},hideOverlay:function hideOverlay(){this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_OVERLAY_HIDE,id:"ghostpoint"})
}});
if(!ORYX.Plugins){ORYX.Plugins=new Object()
}ORYX.Plugins.Overlay=Clazz.extend({facade:undefined,styleNode:undefined,construct:function(a){this.facade=a;
this.changes=[];
this.facade.registerOnEvent(ORYX.CONFIG.EVENT_OVERLAY_SHOW,this.show.bind(this));
this.facade.registerOnEvent(ORYX.CONFIG.EVENT_OVERLAY_HIDE,this.hide.bind(this));
this.styleNode=document.createElement("style");
this.styleNode.setAttributeNS(null,"type","text/css");
document.getElementsByTagName("head")[0].appendChild(this.styleNode)
},show:function(a){if(!a||!a.shapes||!a.shapes instanceof Array||!a.id||!a.id instanceof String||a.id.length==0){return
}if(a.attributes){a.shapes.each(function(d){if(!d instanceof ORYX.Core.Shape){return
}this.setAttributes(d.node,a.attributes)
}.bind(this))
}var c=true;
try{c=a.node&&a.node instanceof SVGElement
}catch(b){}if(a.node&&c){a._temps=[];
a.shapes.each(function(h,g){if(!h instanceof ORYX.Core.Shape){return
}var f={};
f.svg=a.dontCloneNode?a.node:a.node.cloneNode(true);
this.facade.getCanvas().getSvgContainer().appendChild(f.svg);
if(h instanceof ORYX.Core.Edge&&!a.nodePosition){a.nodePosition="START"
}if(a.nodePosition&&!a.nodePositionAbsolute){var e=h.absoluteBounds();
var j=a.nodePosition.toUpperCase();
if(h instanceof ORYX.Core.Node&&j=="START"){j="NW"
}else{if(h instanceof ORYX.Core.Node&&j=="END"){j="SE"
}else{if(h instanceof ORYX.Core.Edge&&j=="START"){e=h.getDockers().first().bounds
}else{if(h instanceof ORYX.Core.Edge&&j=="END"){e=h.getDockers().last().bounds
}}}}f.callback=function(){this.positionCallback(h,j,e,a.keepInsideVisibleArea,f)
}.bind(this);
f.element=h;
f.callback();
e.registerCallback(f.callback)
}if(a.ghostPoint){var d={x:0,y:0};
d=a.ghostPoint;
f.callback=function(){var k=0;
var l=0;
k=d.x-7;
l=d.y-7;
f.svg.setAttributeNS(null,"transform","translate("+k+", "+l+")")
}.bind(this);
f.element=h;
f.callback();
e.registerCallback(f.callback)
}a._temps.push(f)
}.bind(this))
}if(!this.changes[a.id]){this.changes[a.id]=[]
}this.changes[a.id].push(a)
},hide:function(a){if(!a||!a.id||!a.id instanceof String||a.id.length==0||!this.changes[a.id]){return
}this.changes[a.id].each(function(b){b.shapes.each(function(d,c){if(!d instanceof ORYX.Core.Shape){return
}this.deleteAttributes(d.node)
}.bind(this));
if(b._temps){b._temps.each(function(c){if(c.svg&&c.svg.parentNode){c.svg.parentNode.removeChild(c.svg)
}if(c.callback&&c.element){c.element.bounds.unregisterCallback(c.callback)
}}.bind(this))
}}.bind(this));
this.changes[a.id]=null
},setAttributes:function(c,d){var h=this.getAllChilds(c.firstChild.firstChild);
var a=[];
h.each(function(l){a.push($A(l.attributes).findAll(function(m){return m.nodeValue.startsWith("url(#")
}))
});
a=a.flatten().compact();
a=a.collect(function(l){return l.nodeValue
}).uniq();
a=a.collect(function(l){return l.slice(5,l.length-1)
});
a.unshift(c.id+" .me");
var g=$H(d);
var e=g.toJSON().gsub(",",";").gsub('"',"");
var j=d.stroke?e.slice(0,e.length-1)+"; fill:"+d.stroke+";}":e;
var f;
if(d.fill){var b=Object.clone(d);
b.fill="black";
f=$H(b).toJSON().gsub(",",";").gsub('"',"")
}csstags=a.collect(function(m,l){return"#"+m+" * "+(!l?e:j)+""+(f?" #"+m+" text * "+f:"")
});
var k=csstags.join(" ")+"\n";
this.styleNode.appendChild(document.createTextNode(k))
},deleteAttributes:function(b){var a=$A(this.styleNode.childNodes).findAll(function(c){return c.textContent.include("#"+b.id)
});
a.each(function(c){c.parentNode.removeChild(c)
})
},getAllChilds:function(a){var b=$A(a.childNodes);
$A(a.childNodes).each(function(c){b.push(this.getAllChilds(c))
}.bind(this));
return b.flatten()
},isInsideVisibleArea:function(h,g,a,j){var d=document.getElementById("oryx_center_region").children[0].children[0];
var f=d.scrollLeft/this.facade.getCanvas().zoomLevel;
var b=d.scrollTop/this.facade.getCanvas().zoomLevel;
var e=(d.offsetWidth-20)/this.facade.getCanvas().zoomLevel;
var c=(d.offsetHeight-20)/this.facade.getCanvas().zoomLevel;
var l=(h>f&&h+a<f+e);
var k=(g>b&&g+j<b+c);
return l&&k
},positionCallback:function(g,h,a,r,q){var n,m;
try{var k=q.svg.getBBox().width;
var p=q.svg.getBBox().height
}catch(l){var b=42
}var c,o;
var d=["N","NW","W","NE","SW","SE","INSIDE_NW","INSIDE_W"];
var j={x:a.width()/2,y:a.height()/2};
var f={NW:{x:-k,y:-p*1.5},N:{x:a.width()/2-k/2,y:-p*1.5},NE:{x:a.width(),y:-p*1.5},E:{x:a.width(),y:a.height()/2-p/2},SE:{x:a.width(),y:a.height()},S:{x:a.width()/2-k/2,y:a.height()},SW:{x:-k-20,y:a.height()},W:{x:-k-20,y:a.height()/2-p/2},INSIDE_NW:{x:a.width()-k-20,y:0},INSIDE_W:{x:20,y:a.height()/2-p/2},START:j,END:j};
c=h;
o=0;
do{n=f[c].x+a.upperLeft().x;
m=f[c].y+a.upperLeft().y;
c=d[o++];
if(typeof c==="undefined"){break
}}while(r&&!this.isInsideVisibleArea(n,m,k,p));
q.svg.setAttributeNS(null,"transform","translate("+n+", "+m+")")
}});
if(!ORYX.Plugins){ORYX.Plugins=new Object()
}ORYX.Core.Commands.RenameShape=ORYX.Core.AbstractCommand.extend({construct:function construct(a,c,b,e,d){arguments.callee.$.construct.call(this,d);
this.el=a;
this.propId=c;
this.oldValue=b;
this.newValue=e
},getCommandData:function getCommandData(){var a={shapeId:this.el.resourceId,propId:this.propId,oldValue:this.oldValue,newValue:this.newValue};
return a
},createFromCommandData:function createFromCommandData(b,c){var a=b.getCanvas().getChildShapeByResourceId(c.shapeId);
if(typeof a==="undefined"){return undefined
}return new ORYX.Core.Commands.RenameShape(a,c.propId,c.oldValue,c.newValue,b)
},getAffectedShapes:function getAffectedShapes(){return[this.el]
},getCommandName:function getCommandName(){return"RenameShape"
},getDisplayName:function getDisplayName(){return"Shape renamed"
},execute:function execute(){this.el.setProperty(this.propId,this.newValue);
if(this.isLocal()){this.facade.setSelection([this.el])
}this.facade.getCanvas().update();
this.facade.updateSelection(this.isLocal())
},rollback:function rollback(){this.el.setProperty(this.propId,this.oldValue);
if(this.isLocal()){this.facade.setSelection([this.el])
}this.facade.getCanvas().update();
this.facade.updateSelection(this.isLocal())
}});
ORYX.Plugins.RenameShapes=Clazz.extend({facade:undefined,construct:function(a){this.facade=a;
this.facade.registerOnEvent(ORYX.CONFIG.EVENT_DBLCLICK,this.actOnDBLClick.bind(this));
this.facade.registerOnEvent(ORYX.CONFIG.EVENT_LABEL_DBLCLICK,this.actOnLabelDblClick.bind(this));
document.documentElement.addEventListener(ORYX.CONFIG.EVENT_MOUSEDOWN,this.hide.bind(this),true)
},actOnLabelDblClick:function actOnLabelDblClick(e,a){var c=e.label;
if(!c.editable){return
}if(typeof a=="undefined"){return
}if(c.id.indexOf(a.id)===-1){return
}var b=c.id.substr(41).toLowerCase();
if(typeof a.properties["oryx-"+b]===undefined){return
}var d=this.getEditableProperties(a);
var f=this.getPropertyForLabel(d,a,c);
if(typeof f==="undefined"){return
}this.showTextField(a,f,c)
},renamePerF2:function renamePerF2(){var a=this.facade.getSelection();
this.actOnDBLClick(undefined,a.first())
},getEditableProperties:function getEditableProperties(a){var b=a.getStencil().properties().findAll(function(c){return(c.refToView()&&c.refToView().length>0&&c.directlyEditable())
});
return b.findAll(function(c){return !c.readonly()&&c.type()==ORYX.CONFIG.TYPE_STRING
})
},getPropertyForLabel:function getPropertyForLabel(c,a,b){return c.find(function(d){return d.refToView().any(function(e){return b.id==a.id+e
})
})
},actOnDBLClick:function actOnDBLClick(h,d){if(!(d instanceof ORYX.Core.Shape)){return
}this.destroy();
var e=this.getEditableProperties(d);
var f=e.collect(function(l){return l.refToView()
}).flatten().compact();
var b=d.getLabels().findAll(function(l){return f.any(function(m){return l.id.endsWith(m)
})
});
if(b.length==0){return
}var c=b.length==1?b[0]:null;
if(!c){c=b.find(function(l){return l.node==h.target||l.node==h.target.parentNode
});
if(!c){var j=this.facade.eventCoordinates(h);
var k=this.facade.getCanvas().rootNode.lastChild.getScreenCTM();
j.x*=k.a;
j.y*=k.d;
if(!d instanceof ORYX.Core.Node){var g=b.collect(function(n){var m=this.getCenterPosition(n.node);
var l=Math.sqrt(Math.pow(m.x-j.x,2)+Math.pow(m.y-j.y,2));
return{diff:l,label:n}
}.bind(this));
g.sort(function(m,l){return m.diff>l.diff
});
c=g[0].label
}else{var g=b.collect(function(n){var m=this.getDifferenceCenterForNode(n.node);
var l=Math.sqrt(Math.pow(m.x-j.x,2)+Math.pow(m.y-j.y,2));
return{diff:l,label:n}
}.bind(this));
g.sort(function(m,l){return m.diff>l.diff
});
c=g[0].label
}}}var a=this.getPropertyForLabel(e,d,c);
this.showTextField(d,a,c)
},showTextField:function showTextField(h,c,j){var g=this.facade.getCanvas().getHTMLContainer().id;
var e;
if(!(h instanceof ORYX.Core.Node)){var a=j.node.getBoundingClientRect();
e=Math.max(150,a.width)
}else{e=h.bounds.width()
}if(!h instanceof ORYX.Core.Node){var b=this.getCenterPosition(j.node);
b.x-=(e/2)
}else{var b=h.absoluteBounds().center();
b.x-=(e/2)
}var d=c.prefix()+"-"+c.id();
var f={renderTo:g,value:h.properties[d],x:(b.x<10)?10:b.x,y:b.y,width:Math.max(100,e),style:"position:absolute",allowBlank:c.optional(),maxLength:c.length(),emptyText:c.title(),cls:"x_form_text_set_absolute",listeners:{specialkey:this._specialKeyPressed.bind(this)}};
if(c.wrapLines()){f.y-=30;
f.grow=true;
this.shownTextField=new Ext.form.TextArea(f);
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_DISPLAY_SCHLAUMEIER,message:"Press Shift+Enter to finish text entry."})
}else{f.y-=16;
this.shownTextField=new Ext.form.TextField(f)
}this.shownTextField.focus();
this.shownTextField.on("blur",this.destroy.bind(this));
this.shownTextField.on("change",function(n,o){var m=h;
var k=m.properties[d];
var p=o;
var l=this.facade;
if(k!=p){var q=new ORYX.Core.Commands.RenameShape(m,d,k,p,l);
this.facade.executeCommands([q])
}}.bind(this));
this.facade.disableEvent(ORYX.CONFIG.EVENT_KEYDOWN)
},_specialKeyPressed:function _specialKeyPressed(c,b){var a=b.getKey();
if(a==13&&(b.shiftKey||!c.initialConfig.grow)){c.fireEvent("change",null,c.getValue());
c.fireEvent("blur")
}else{if(a==b.ESC){c.fireEvent("blur")
}}},getCenterPosition:function(f){var a={x:0,y:0};
var c=f.getTransformToElement(this.facade.getCanvas().rootNode.lastChild);
var h=this.facade.getCanvas().rootNode.lastChild.getScreenCTM();
var b=f.getTransformToElement(f.parentNode);
var d=undefined;
a.x=c.e-b.e;
a.y=c.f-b.f;
try{d=f.getBBox()
}catch(g){}if(d===null||typeof d==="undefined"||d.width==0||d.height==0){d={x:Number(f.getAttribute("x")),y:Number(f.getAttribute("y")),width:0,height:0}
}a.x+=d.x;
a.y+=d.y;
a.x+=d.width/2;
a.y+=d.height/2;
a.x*=h.a;
a.y*=h.d;
return a
},getDifferenceCenterForNode:function getDifferenceCenterForNode(b){var a=this.getCenterPosition(b);
a.x=0;
a.y=a.y+10;
return a
},hide:function(a){if(this.shownTextField&&(!a||!this.shownTextField.el||a.target!==this.shownTextField.el.dom)){this.shownTextField.onBlur()
}},destroy:function(a){if(this.shownTextField){this.shownTextField.destroy();
delete this.shownTextField;
this.facade.enableEvent(ORYX.CONFIG.EVENT_KEYDOWN)
}}});
if(!ORYX.Plugins){ORYX.Plugins=new Object()
}ORYX.Plugins.KeysMove=ORYX.Plugins.AbstractPlugin.extend({facade:undefined,construct:function(a){this.facade=a;
this.copyElements=[];
this.facade.offer({keyCodes:[{metaKeys:[ORYX.CONFIG.META_KEY_META_CTRL],keyCode:65,keyAction:ORYX.CONFIG.KEY_ACTION_DOWN}],functionality:this.selectAll.bind(this)});
this.facade.offer({keyCodes:[{metaKeys:[ORYX.CONFIG.META_KEY_META_CTRL],keyCode:ORYX.CONFIG.KEY_CODE_LEFT,keyAction:ORYX.CONFIG.KEY_ACTION_DOWN}],functionality:this.move.bind(this,ORYX.CONFIG.KEY_CODE_LEFT,false)});
this.facade.offer({keyCodes:[{keyCode:ORYX.CONFIG.KEY_CODE_LEFT,keyAction:ORYX.CONFIG.KEY_ACTION_DOWN}],functionality:this.move.bind(this,ORYX.CONFIG.KEY_CODE_LEFT,true)});
this.facade.offer({keyCodes:[{metaKeys:[ORYX.CONFIG.META_KEY_META_CTRL],keyCode:ORYX.CONFIG.KEY_CODE_RIGHT,keyAction:ORYX.CONFIG.KEY_ACTION_DOWN}],functionality:this.move.bind(this,ORYX.CONFIG.KEY_CODE_RIGHT,false)});
this.facade.offer({keyCodes:[{keyCode:ORYX.CONFIG.KEY_CODE_RIGHT,keyAction:ORYX.CONFIG.KEY_ACTION_DOWN}],functionality:this.move.bind(this,ORYX.CONFIG.KEY_CODE_RIGHT,true)});
this.facade.offer({keyCodes:[{metaKeys:[ORYX.CONFIG.META_KEY_META_CTRL],keyCode:ORYX.CONFIG.KEY_CODE_UP,keyAction:ORYX.CONFIG.KEY_ACTION_DOWN}],functionality:this.move.bind(this,ORYX.CONFIG.KEY_CODE_UP,false)});
this.facade.offer({keyCodes:[{keyCode:ORYX.CONFIG.KEY_CODE_UP,keyAction:ORYX.CONFIG.KEY_ACTION_DOWN}],functionality:this.move.bind(this,ORYX.CONFIG.KEY_CODE_UP,true)});
this.facade.offer({keyCodes:[{metaKeys:[ORYX.CONFIG.META_KEY_META_CTRL],keyCode:ORYX.CONFIG.KEY_CODE_DOWN,keyAction:ORYX.CONFIG.KEY_ACTION_DOWN}],functionality:this.move.bind(this,ORYX.CONFIG.KEY_CODE_DOWN,false)});
this.facade.offer({keyCodes:[{keyCode:ORYX.CONFIG.KEY_CODE_DOWN,keyAction:ORYX.CONFIG.KEY_ACTION_DOWN}],functionality:this.move.bind(this,ORYX.CONFIG.KEY_CODE_DOWN,true)})
},selectAll:function(a){Event.stop(a.event);
this.facade.setSelection(this.facade.getCanvas().getChildShapes(true))
},move:function(t,k,n){Event.stop(n.event);
var b=k?20:5;
var s=this.facade.getSelection();
var h=this.facade.getSelection();
var d={x:0,y:0};
switch(t){case ORYX.CONFIG.KEY_CODE_LEFT:d.x=-1*b;
break;
case ORYX.CONFIG.KEY_CODE_RIGHT:d.x=b;
break;
case ORYX.CONFIG.KEY_CODE_UP:d.y=-1*b;
break;
case ORYX.CONFIG.KEY_CODE_DOWN:d.y=b;
break
}s=s.findAll(function(e){if(e instanceof ORYX.Core.Node&&e.dockers.length==1&&s.include(e.dockers.first().getDockedShape())){return false
}var p=e.parent;
do{if(s.include(p)){return false
}}while(p=p.parent);
return true
});
var g=true;
var j=s.all(function(e){if(e instanceof ORYX.Core.Edge){if(e.isDocked()){g=false
}return true
}return false
});
if(j&&!g){return
}s=s.map(function(p){if(p instanceof ORYX.Core.Node){return p
}else{if(p instanceof ORYX.Core.Edge){var e=p.dockers;
if(s.include(p.dockers.first().getDockedShape())){e=e.without(p.dockers.first())
}if(s.include(p.dockers.last().getDockedShape())){e=e.without(p.dockers.last())
}return e
}else{return null
}}}).flatten().compact();
if(s.size()>0){var a=[this.facade.getCanvas().bounds.lowerRight().x,this.facade.getCanvas().bounds.lowerRight().y,0,0];
s.each(function(e){a[0]=Math.min(a[0],e.bounds.upperLeft().x);
a[1]=Math.min(a[1],e.bounds.upperLeft().y);
a[2]=Math.max(a[2],e.bounds.lowerRight().x);
a[3]=Math.max(a[3],e.bounds.lowerRight().y)
});
if(a[0]+d.x<0){d.x=-a[0]
}if(a[1]+d.y<0){d.y=-a[1]
}var m=s.map(function(e){var p=e.parent||this.facade.getCanvas();
return Math.abs(p.absoluteBounds().lowerRight().y-e.absoluteBounds().lowerRight().y)
});
var l=m.min();
var q=s.map(function(e){var p=e.parent||this.facade.getCanvas();
return Math.abs(p.absoluteBounds().lowerRight().x-e.absoluteBounds().lowerRight().x)
});
var o=q.min();
if(d.x>o){d.x=o
}if(d.y>l){d.y=l
}if(d.x!=0||d.y!=0){var r=s.map(function c(e){return{shape:e,origin:e.absoluteBounds().center(),target:{x:e.absoluteBounds().center().x+d.x,y:e.absoluteBounds().center().y+d.y}}
}.bind(this));
var f=[new ORYX.Core.Commands["DragDropResize.MoveCommand"](r,null,h,this.facade)];
this.facade.executeCommands(f)
}}}});
if(!ORYX.Plugins){ORYX.Plugins=new Object()
}ORYX.Core.Commands["DragDocker.DragDockerCommand"]=ORYX.Core.AbstractCommand.extend({construct:function construct(f,b,a,e,d,c){arguments.callee.$.construct.call(this,c);
this.docker=f;
this.index=f.parent.dockers.indexOf(f);
this.newPosition=b;
this.oldPosition=a;
this.newDockedShape=e;
this.oldDockedShape=d;
this.facade=c;
this.index=f.parent.dockers.indexOf(f);
this.shape=f.parent
},getAffectedShapes:function getAffectedShapes(){return[this.shape]
},getCommandName:function getCommandName(){return"DragDocker.DragDockerCommand"
},getDisplayName:function getDisplayName(){return"Docker moved"
},getCommandData:function getCommandData(){var a=function(c){if(typeof c!=="undefined"){return c.resourceId
}};
var b={dockerId:this.docker.id,index:this.index,newPosition:this.newPosition,oldPosition:this.oldPosition,newDockedShapeId:a(this.newDockedShape),oldDockedShapeId:a(this.oldDockedShape),shapeId:a(this.shape)};
return b
},createFromCommandData:function createFromCommandData(j,g){var b=j.getCanvas();
var a=b.getChildShapeByResourceId.bind(b);
var h=a(g.newDockedShapeId);
if(typeof g.newDockedShapeId!=="undefined"&&typeof h==="undefined"){return undefined
}var e=a(g.oldDockedShapeId);
var f=a(g.shapeId);
if(typeof f==="undefined"){return undefined
}var c;
for(var d=0;
d<f.dockers.length;
d++){if(f.dockers[d].id==g.dockerId){c=f.dockers[d]
}}return new ORYX.Core.Commands["DragDocker.DragDockerCommand"](c,g.newPosition,g.oldPosition,h,e,j)
},execute:function execute(){if(typeof this.docker!=="undefined"){if(!this.docker.parent){this.docker=this.shape.dockers[this.index]
}this.dock(this.newDockedShape,this.newPosition);
this.facade.updateSelection(this.isLocal())
}},rollback:function rollback(){if(typeof this.docker!=="undefined"){this.dock(this.oldDockedShape,this.oldPosition);
(this.removedDockers||$H({})).each(function(a){this.shape.add(a.value,Number(a.key));
this.shape._update(true)
}.bind(this));
this.facade.updateSelection(this.isLocal())
}},dock:function dock(a,c){var d=c;
if(typeof a!=="undefined"){var b=this.facade.getCanvas().node.ownerSVGElement.createSVGPoint();
if((0>d.x)||(d.x>1)||(0>d.y)||(d.y>1)){d.x=0.5;
d.y=0.5
}b.x=Math.abs(a.absoluteBounds().lowerRight().x-d.x*a.bounds.width());
b.y=Math.abs(a.absoluteBounds().lowerRight().y-d.y*a.bounds.height())
}else{var b=c
}this.docker.setDockedShape(undefined);
this.docker.bounds.centerMoveTo(b);
this.docker.setDockedShape(a);
this.docker.update();
this.docker.parent._update();
this.facade.getCanvas().update()
}});
ORYX.Plugins.DragDocker=Clazz.extend({construct:function(a){this.facade=a;
this.VALIDCOLOR=ORYX.CONFIG.SELECTION_VALID_COLOR;
this.INVALIDCOLOR=ORYX.CONFIG.SELECTION_INVALID_COLOR;
this.shapeSelection=undefined;
this.docker=undefined;
this.dockerParent=undefined;
this.dockerSource=undefined;
this.dockerTarget=undefined;
this.lastUIObj=undefined;
this.isStartDocker=undefined;
this.isEndDocker=undefined;
this.undockTreshold=10;
this.initialDockerPosition=undefined;
this.outerDockerNotMoved=undefined;
this.isValid=false;
this.facade.registerOnEvent(ORYX.CONFIG.EVENT_MOUSEDOWN,this.handleMouseDown.bind(this));
this.facade.registerOnEvent(ORYX.CONFIG.EVENT_DOCKERDRAG,this.handleDockerDrag.bind(this));
this.facade.registerOnEvent(ORYX.CONFIG.EVENT_MOUSEOVER,this.handleMouseOver.bind(this));
this.facade.registerOnEvent(ORYX.CONFIG.EVENT_MOUSEOUT,this.handleMouseOut.bind(this))
},handleDockerDrag:function handleDockerDrag(b,a){this.handleMouseDown(b.uiEvent,a)
},handleMouseOut:function(b,a){if(!this.docker&&a instanceof ORYX.Core.Controls.Docker){a.hide()
}else{if(!this.docker&&a instanceof ORYX.Core.Edge){a.dockers.each(function(c){c.hide()
})
}}},handleMouseOver:function(b,a){if(!this.docker&&a instanceof ORYX.Core.Controls.Docker){a.show()
}else{if(!this.docker&&a instanceof ORYX.Core.Edge){a.dockers.each(function(c){c.show()
})
}}},handleMouseDown:function(d,c){if(c instanceof ORYX.Core.Controls.Docker&&c.isMovable){this.shapeSelection=this.facade.getSelection();
this.facade.setSelection();
this.docker=c;
this.initialDockerPosition=this.docker.bounds.center();
this.outerDockerNotMoved=false;
this.dockerParent=c.parent;
this._commandArg={docker:c,dockedShape:c.getDockedShape(),refPoint:c.referencePoint||c.bounds.center()};
this.docker.show();
if(c.parent instanceof ORYX.Core.Edge&&(c.parent.dockers.first()==c||c.parent.dockers.last()==c)){if(c.parent.dockers.first()==c&&c.parent.dockers.last().getDockedShape()){this.dockerTarget=c.parent.dockers.last().getDockedShape()
}else{if(c.parent.dockers.last()==c&&c.parent.dockers.first().getDockedShape()){this.dockerSource=c.parent.dockers.first().getDockedShape()
}}}else{this.dockerSource=undefined;
this.dockerTarget=undefined
}this.isStartDocker=this.docker.parent.dockers.first()===this.docker;
this.isEndDocker=this.docker.parent.dockers.last()===this.docker;
this.facade.getCanvas().add(this.docker.parent);
this.docker.parent.getLabels().each(function(e){e.hide()
});
if((!this.isStartDocker&&!this.isEndDocker)||!this.docker.isDocked()){this.docker.setDockedShape(undefined);
var b=this.facade.eventCoordinates(d);
this.docker.bounds.centerMoveTo(b);
this.dockerParent._update()
}else{this.outerDockerNotMoved=true
}var a={movedCallback:this.dockerMoved.bind(this),upCallback:this.dockerMovedFinished.bind(this)};
ORYX.Core.UIEnableDrag(d,c,a)
}},dockerMoved:function(t){this.outerDockerNotMoved=false;
var k=undefined;
if(this.docker.parent){if(this.isStartDocker||this.isEndDocker){var n=this.facade.eventCoordinates(t);
if(this.docker.isDocked()){var b=ORYX.Core.Math.getDistancePointToPoint(n,this.initialDockerPosition);
if(b<this.undockTreshold){this.outerDockerNotMoved=true;
return
}this.docker.setDockedShape(undefined);
this.dockerParent._update()
}var r=this.facade.getCanvas().getAbstractShapesAtPosition(n);
var p=r.pop();
if(this.docker.parent===p){p=r.pop()
}if(this.lastUIObj==p){}else{if(p instanceof ORYX.Core.Shape){var s=this.docker.parent.getStencil().stencilSet();
if(this.docker.parent instanceof ORYX.Core.Edge){var u=this.getHighestParentBeforeCanvas(p);
if(u instanceof ORYX.Core.Edge&&this.docker.parent===u){this.isValid=false;
this.dockerParent._update();
return
}this.isValid=false;
var a=p,c=p;
while(!this.isValid&&a&&!(a instanceof ORYX.Core.Canvas)){p=a;
this.isValid=this.facade.getRules().canConnect({sourceShape:this.dockerSource?this.dockerSource:(this.isStartDocker?p:undefined),edgeShape:this.docker.parent,targetShape:this.dockerTarget?this.dockerTarget:(this.isEndDocker?p:undefined)});
a=a.parent
}if(!this.isValid){p=c
}}else{this.isValid=this.facade.getRules().canConnect({sourceShape:p,edgeShape:this.docker.parent,targetShape:this.docker.parent})
}if(this.lastUIObj){this.hideMagnets(this.lastUIObj)
}if(this.isValid){this.showMagnets(p)
}this.showHighlight(p,this.isValid?this.VALIDCOLOR:this.INVALIDCOLOR);
this.lastUIObj=p
}else{this.hideHighlight();
this.lastUIObj?this.hideMagnets(this.lastUIObj):null;
this.lastUIObj=undefined;
this.isValid=false
}}if(this.lastUIObj&&this.isValid&&!(t.shiftKey||t.ctrlKey)){k=this.lastUIObj.magnets.find(function(x){return x.absoluteBounds().isIncluded(n)
});
if(k){this.docker.bounds.centerMoveTo(k.absoluteCenterXY())
}}}}if(!(t.shiftKey||t.ctrlKey)&&!k){var m=ORYX.CONFIG.DOCKER_SNAP_OFFSET;
var h=m+1;
var f=m+1;
var w=this.docker.bounds.center();
if(this.docker.parent){this.docker.parent.dockers.each((function(y){if(this.docker==y){return
}var x=y.referencePoint?y.getAbsoluteReferencePoint():y.bounds.center();
h=Math.abs(h)>Math.abs(x.x-w.x)?x.x-w.x:h;
f=Math.abs(f)>Math.abs(x.y-w.y)?x.y-w.y:f
}).bind(this));
if(Math.abs(h)<m||Math.abs(f)<m){h=Math.abs(h)<m?h:0;
f=Math.abs(f)<m?f:0;
this.docker.bounds.centerMoveTo(w.x+h,w.y+f)
}else{var d=this.docker.parent.dockers[Math.max(this.docker.parent.dockers.indexOf(this.docker)-1,0)];
var q=this.docker.parent.dockers[Math.min(this.docker.parent.dockers.indexOf(this.docker)+1,this.docker.parent.dockers.length-1)];
if(d&&q&&d!==this.docker&&q!==this.docker){var e=d.bounds.center();
var g=q.bounds.center();
var o=this.docker.bounds.center();
if(ORYX.Core.Math.isPointInLine(o.x,o.y,e.x,e.y,g.x,g.y,10)){var v=(Number(g.y)-Number(e.y))/(Number(g.x)-Number(e.x));
var l=((e.y-(e.x*v))-(o.y-(o.x*(-Math.pow(v,-1)))))/((-Math.pow(v,-1))-v);
var j=(e.y-(e.x*v))+(v*l);
if(isNaN(l)||isNaN(j)){return
}this.docker.bounds.centerMoveTo(l,j)
}}}}}this.dockerParent._update()
},dockerMovedFinished:function(b){var h=this.facade.getCanvas().getChildShapeByResourceId(this.dockerParent.resourceId);
if(typeof h!=="undefined"){this.facade.setSelection(this.shapeSelection);
this.hideHighlight();
this.dockerParent.getLabels().each(function(n){n.show()
});
if(this.lastUIObj&&(this.isStartDocker||this.isEndDocker)){if(this.isValid){this.docker.setDockedShape(this.lastUIObj);
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_DRAGDOCKER_DOCKED,docker:this.docker,parent:this.docker.parent,target:this.lastUIObj})
}this.hideMagnets(this.lastUIObj)
}this.docker.hide();
if(this.outerDockerNotMoved){var d=this.facade.eventCoordinates(b);
var c=this.facade.getCanvas().getAbstractShapesAtPosition(d);
var f=c.findAll(function(n){return n instanceof ORYX.Core.Node
});
c=f.length?f:c;
this.facade.setSelection(c)
}else{if(this.docker.parent){var g=this._commandArg.dockedShape;
var j=this.docker.bounds.center();
var l=this._commandArg.refPoint;
var k=this.docker.getDockedShape();
if(typeof k!=="undefined"){var m=this.facade.getCanvas().node.ownerSVGElement.createSVGPoint();
m.x=Math.abs((k.bounds.lowerRight().x-j.x)/k.bounds.width());
m.y=Math.abs((k.bounds.lowerRight().y-j.y)/k.bounds.height())
}else{m=j
}if(typeof g!=="undefined"){var a=this.facade.getCanvas().node.ownerSVGElement.createSVGPoint();
a.x=Math.abs((g.bounds.lowerRight().x-l.x)/g.bounds.width());
a.y=Math.abs((g.bounds.lowerRight().y-l.y)/g.bounds.height())
}else{a=l
}var e=new ORYX.Core.Commands["DragDocker.DragDockerCommand"](this.docker,m,a,k,g,this.facade);
this.facade.executeCommands([e])
}}}this.docker=undefined;
this.dockerParent=undefined;
this.dockerSource=undefined;
this.dockerTarget=undefined;
this.lastUIObj=undefined
},hideHighlight:function(){this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_HIGHLIGHT_HIDE,highlightId:"validDockedShape"})
},showHighlight:function(b,a){this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_HIGHLIGHT_SHOW,highlightId:"validDockedShape",elements:[b],color:a})
},showMagnets:function(a){a.magnets.each(function(b){b.show()
})
},hideMagnets:function(a){a.magnets.each(function(b){b.hide()
})
},getHighestParentBeforeCanvas:function(a){if(!(a instanceof ORYX.Core.Shape)){return undefined
}var b=a.parent;
while(b&&!(b.parent instanceof ORYX.Core.Canvas)){b=b.parent
}return b
}});
if(!ORYX.Plugins){ORYX.Plugins=new Object()
}ORYX.Plugins.Edit=Clazz.extend({construct:function(a){this.facade=a;
this.clipboard=new ORYX.Plugins.Edit.ClipBoard(a);
this.shapesToDelete=[];
this.facade.registerOnEvent(ORYX.CONFIG.EVENT_DRAGDROP_END,this.handleDragEnd.bind(this));
this.facade.registerOnEvent(ORYX.CONFIG.EVENT_SHAPESTODELETE,this.handleShapesToDelete.bind(this));
this.facade.offer({name:ORYX.I18N.Edit.cut,description:ORYX.I18N.Edit.cutDesc,iconCls:"pw-toolbar-button pw-toolbar-cut",keyCodes:[{metaKeys:[ORYX.CONFIG.META_KEY_META_CTRL],keyCode:88,keyAction:ORYX.CONFIG.KEY_ACTION_DOWN}],functionality:this.callEdit.bind(this,this.editCut),isEnabled:function(){return !this.facade.isReadOnlyMode()
}.bind(this),group:ORYX.I18N.Edit.group,index:1,minShape:1,visibleInViewMode:false});
this.facade.offer({name:ORYX.I18N.Edit.copy,description:ORYX.I18N.Edit.copyDesc,iconCls:"pw-toolbar-button pw-toolbar-copy",keyCodes:[{metaKeys:[ORYX.CONFIG.META_KEY_META_CTRL],keyCode:67,keyAction:ORYX.CONFIG.KEY_ACTION_DOWN}],functionality:this.callEdit.bind(this,this.editCopy,[true,false]),isEnabled:function(){return !this.facade.isReadOnlyMode()
}.bind(this),group:ORYX.I18N.Edit.group,index:2,minShape:1,visibleInViewMode:false});
this.facade.offer({name:ORYX.I18N.Edit.paste,description:ORYX.I18N.Edit.pasteDesc,iconCls:"pw-toolbar-button pw-toolbar-paste",keyCodes:[{metaKeys:[ORYX.CONFIG.META_KEY_META_CTRL],keyCode:86,keyAction:ORYX.CONFIG.KEY_ACTION_DOWN}],functionality:this.callEdit.bind(this,this.editPaste),isEnabled:function(){return !this.facade.isReadOnlyMode()&&this.clipboard.isOccupied
}.bind(this),group:ORYX.I18N.Edit.group,index:3,minShape:0,maxShape:0,visibleInViewMode:false});
this.facade.offer({name:ORYX.I18N.Edit.del,description:ORYX.I18N.Edit.delDesc,iconCls:"pw-toolbar-button pw-toolbar-delete",keyCodes:[{metaKeys:[ORYX.CONFIG.META_KEY_META_CTRL],keyCode:8,keyAction:ORYX.CONFIG.KEY_ACTION_DOWN},{keyCode:46,keyAction:ORYX.CONFIG.KEY_ACTION_DOWN}],functionality:this.callEdit.bind(this,this.editDelete),group:ORYX.I18N.Edit.group,index:4,minShape:1,visibleInViewMode:false})
},callEdit:function(b,a){window.setTimeout(function(){b.apply(this,(a instanceof Array?a:[]))
}.bind(this),1)
},handleShapesToDelete:function handleShapesToDelete(a){this.shapesToDelete=this.shapesToDelete.concat(a.deletedShapes)
},handleDragEnd:function handleDragEnd(c){var a=this.facade.getSelection();
for(var b=0;
b<this.shapesToDelete.length;
b++){this.facade.deleteShape(this.shapesToDelete[b]);
a=a.without(this.shapesToDelete[b])
}this.shapesToDelete=[];
this.facade.setSelection(a);
this.facade.getCanvas().update();
this.facade.updateSelection()
},handleMouseDown:function(a){if(this._controlPressed){this._controlPressed=false;
this.editCopy();
this.editPaste();
a.forceExecution=true;
this.facade.raiseEvent(a,this.clipboard.shapesAsJson)
}},getAllShapesToConsider:function(b){var a=[];
var c=[];
b.each(function(e){isChildShapeOfAnother=b.any(function(g){return g.hasChildShape(e)
});
if(isChildShapeOfAnother){return
}a.push(e);
if(e instanceof ORYX.Core.Node){var f=e.getOutgoingNodes();
f=f.findAll(function(g){return !b.include(g)
});
a=a.concat(f)
}c=c.concat(e.getChildShapes(true))
}.bind(this));
var d=this.facade.getCanvas().getChildEdges().select(function(e){if(a.include(e)){return false
}if(e.getAllDockedShapes().size()===0){return false
}return e.getAllDockedShapes().all(function(f){return f instanceof ORYX.Core.Edge||c.include(f)
})
});
a=a.concat(d);
return a
},editCut:function(){this.editCopy(false,true);
this.editDelete(true);
return false
},editCopy:function(c,a){var b=this.facade.getSelection();
if(b.length==0){return
}this.clipboard.refresh(b,this.getAllShapesToConsider(b),this.facade.getCanvas().getStencil().stencilSet().namespace(),a);
if(c){this.facade.updateSelection(true)
}},editPaste:function(){var b={childShapes:this.clipboard.shapesAsJson,stencilset:{namespace:this.clipboard.SSnamespace}};
Ext.apply(b,ORYX.Core.AbstractShape.JSONHelper);
var a=b.getChildShapes(true).pluck("resourceId");
var c={};
b.eachChild(function(d,e){d.outgoing=d.outgoing.select(function(f){return a.include(f.resourceId)
});
d.outgoing.each(function(f){if(!c[f.resourceId]){c[f.resourceId]=[]
}c[f.resourceId].push(d)
});
return d
}.bind(this),true,true);
b.eachChild(function(d,e){if(d.target&&!(a.include(d.target.resourceId))){d.target=undefined;
d.targetRemoved=true
}if(d.dockers&&d.dockers.length>=1&&d.dockers[0].getDocker&&((d.dockers[0].getDocker().getDockedShape()&&!a.include(d.dockers[0].getDocker().getDockedShape().resourceId))||!d.getShape().dockers[0].getDockedShape()&&!c[d.resourceId])){d.sourceRemoved=true
}return d
}.bind(this),true,true);
b.eachChild(function(d,e){if(this.clipboard.useOffset){d.bounds={lowerRight:{x:d.bounds.lowerRight.x+ORYX.CONFIG.COPY_MOVE_OFFSET,y:d.bounds.lowerRight.y+ORYX.CONFIG.COPY_MOVE_OFFSET},upperLeft:{x:d.bounds.upperLeft.x+ORYX.CONFIG.COPY_MOVE_OFFSET,y:d.bounds.upperLeft.y+ORYX.CONFIG.COPY_MOVE_OFFSET}}
}if(d.dockers){d.dockers=d.dockers.map(function(g,f){if((d.targetRemoved===true&&f==d.dockers.length-1&&g.getDocker)||(d.sourceRemoved===true&&f==0&&g.getDocker)){var h=g.id;
g=g.getDocker().bounds.center();
g.id=h
}if((f==0&&g.getDocker instanceof Function&&d.sourceRemoved!==true&&(g.getDocker().getDockedShape()||((c[d.resourceId]||[]).length>0&&(!(d.getShape() instanceof ORYX.Core.Node)||c[d.resourceId][0].getShape() instanceof ORYX.Core.Node))))||(f==d.dockers.length-1&&g.getDocker instanceof Function&&d.targetRemoved!==true&&(g.getDocker().getDockedShape()||d.target))){return{x:g.x,y:g.y,getDocker:g.getDocker,id:g.id}
}else{if(this.clipboard.useOffset){return{x:g.x+ORYX.CONFIG.COPY_MOVE_OFFSET,y:g.y+ORYX.CONFIG.COPY_MOVE_OFFSET,getDocker:g.getDocker,id:g.id}
}else{return{x:g.x,y:g.y,getDocker:g.getDocker,id:g.id}
}}}.bind(this))
}else{if(d.getShape() instanceof ORYX.Core.Node&&d.dockers&&d.dockers.length>0&&(!d.dockers.first().getDocker||d.sourceRemoved===true||!(d.dockers.first().getDocker().getDockedShape()||c[d.resourceId]))){d.dockers=d.dockers.map(function(g,f){if((d.sourceRemoved===true&&f==0&&g.getDocker)){var h=g.id;
g=g.getDocker().bounds.center();
g.id=h
}if(this.clipboard.useOffset){return{x:g.x+ORYX.CONFIG.COPY_MOVE_OFFSET,y:g.y+ORYX.CONFIG.COPY_MOVE_OFFSET,getDocker:g.getDocker,id:g.id}
}else{return{x:g.x,y:g.y,getDocker:g.getDocker,id:g.id}
}}.bind(this))
}}return d
}.bind(this),false,true);
this.clipboard.useOffset=true;
this.facade.importJSON(b)
},editDelete:function(){var a=this.facade.getSelection();
var b=new ORYX.Plugins.Edit.ClipBoard();
b.refresh(a,this.getAllShapesToConsider(a));
if(b.shapesAsJson.length>0){var c=new ORYX.Core.Commands["Edit.DeleteCommand"](b,this.facade);
this.facade.executeCommands([c])
}}});
ORYX.Plugins.Edit.ClipBoard=Clazz.extend({construct:function(a){this.shapesAsJson=[];
this.selection=[];
this.SSnamespace="";
this.useOffset=true
},isOccupied:function(){return this.shapesAsJson.length>0
},refresh:function(d,b,c,a){this.selection=d;
this.SSnamespace=c;
this.outgoings={};
this.parents={};
this.targets={};
this.useOffset=a!==true;
this.shapesAsJson=b.map(function(e){var f=e.toJSON();
f.parent={resourceId:e.getParentShape().resourceId};
f.parentIndex=e.getParentShape().getChildShapes().indexOf(e);
return f
})
}});
ORYX.Core.Commands["Edit.DeleteCommand"]=ORYX.Core.AbstractCommand.extend({construct:function construct(g,d){arguments.callee.$.construct.call(this,d);
this.clipboard=g;
this.shapesAsJson=g.shapesAsJson;
var c=[];
for(var b=0;
b<this.shapesAsJson.length;
b++){var f=this.shapesAsJson[b];
var a=this.facade.getCanvas().getChildShapeByResourceId(f.resourceId);
if(typeof a!=="undefined"){var e=a.getStencil();
f.type=e.type();
f.namespace=e.namespace();
c.push(f)
}}this.shapesAsJson=c;
this.dockers=this.shapesAsJson.map(function(m){var k=d.getCanvas().getChildShapeByResourceId(m.resourceId);
if(typeof k!=="undefined"){var l=k.getIncomingShapes().map(function(n){return n.getDockers().last()
});
var j=k.getOutgoingShapes().map(function(n){return n.getDockers().first()
});
var h=k.getDockers().concat(l,j).compact().map(function(n){return{object:n,referencePoint:n.referencePoint,dockedShape:n.getDockedShape()}
});
return h
}else{return[]
}}).flatten()
},execute:function execute(){var b=[];
var a=this.facade.getSelection();
for(var d=0;
d<this.shapesAsJson.length;
d++){var f=this.shapesAsJson[d];
var c=this.facade.getCanvas().getChildShapeByResourceId(f.resourceId);
if(typeof c!=="undefined"){b.push(c);
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_SHAPEDELETED,shape:c});
this.facade.deleteShape(c)
}else{ORYX.Log.warn("Trying to delete deleted shape.")
}}if(this.isLocal()){this.facade.getCanvas().update();
this.facade.setSelection([])
}else{var g=a;
for(var d=0;
d<b.length;
d++){g=g.without(b[d])
}var e=this.facade.isDragging();
if(!e){this.facade.setSelection(g)
}else{this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_SHAPESTODELETE,deletedShapes:b})
}this.facade.getCanvas().update();
this.facade.updateSelection(this.isLocal())
}},rollback:function rollback(){var a=[];
for(var c=0;
c<this.shapesAsJson.length;
c++){var e=this.shapesAsJson[c];
var b=e.getShape();
a.push(b);
var d=this.facade.getCanvas().getChildShapeByResourceId(e.parent.resourceId)||this.facade.getCanvas();
d.add(b,b.parentIndex)
}this.dockers.each(function(f){f.object.setDockedShape(f.dockedShape);
f.object.setReferencePoint(f.referencePoint)
}.bind(this));
this.facade.getCanvas().update();
this.facade.updateSelection(this.isLocal())
},getCommandData:function getCommandData(){var a={shapes:this.shapesAsJson};
return a
},createFromCommandData:function createFromCommandData(d,g){var e=new ORYX.Plugins.Edit.ClipBoard(d);
var f=function f(k){var j=d.getCanvas().getChildShapeByResourceId(k);
return j
};
e.shapesAsJson=g.shapes;
var b=false;
for(var c=0;
c<e.shapesAsJson.length;
c++){var h=e.shapesAsJson[c].resourceId;
if(typeof d.getCanvas().getChildShapeByResourceId(h)!=="undefined"){b=true;
break
}}if(!b){return undefined
}e.shapesAsJson.each(function a(k){k.template=k.properties;
k.shapeOptions={resourceId:k.resourceId};
var j=f(k.resourceId);
k.getShape=function(){return j
}});
return new ORYX.Core.Commands["Edit.DeleteCommand"](e,d)
},getCommandName:function getCommandName(){return"Edit.DeleteCommand"
},getDisplayName:function getDisplayName(){return"Shape deleted"
},getAffectedShapes:function getAffectedShapes(){return this.shapesAsJson.map(function(a){return a.getShape()
}.bind(this))
}});
ORYX.Core.Commands["Main.JsonImport"]=ORYX.Core.AbstractCommand.extend({construct:function(b,d,a,c){arguments.callee.$.construct.call(this,c);
this.jsonObject=b;
this.noSelection=a;
this.shapes;
this.connections=[];
this.parents=new Hash();
this.selection=this.facade.getSelection();
this.loadSerialized=d
},getAffectedShapes:function getAffectedShapes(){if(this.shapes){return this.shapes
}return[]
},getCommandData:function getCommandData(){return{jsonObject:this.jsonObject}
},createFromCommandData:function createFromCommandData(a,b){return new ORYX.Core.Commands["Main.JsonImport"](b.jsonObject,a.loadSerialized,true,a)
},getCommandName:function getCommandName(){return"Main.JsonImport"
},getDisplayName:function getDisplayName(){return"Shape pasted"
},execute:function(){if(!this.shapes){this.shapes=this.loadSerialized(this.jsonObject);
this.shapes.each(function(b){if(b.getDockers){var a=b.getDockers();
if(a){if(a.length>0){this.connections.push([a.first(),a.first().getDockedShape(),a.first().referencePoint])
}if(a.length>1){this.connections.push([a.last(),a.last().getDockedShape(),a.last().referencePoint])
}}}this.parents[b.id]=b.parent
}.bind(this))
}else{this.shapes.each(function(a){this.parents[a.id].add(a)
}.bind(this));
this.connections.each(function(a){a[0].setDockedShape(a[1]);
a[0].setReferencePoint(a[2])
})
}this.facade.getCanvas().update();
if(!this.noSelection){this.facade.setSelection(this.shapes)
}else{this.facade.updateSelection(true)
}},rollback:function(){var a=this.facade.getSelection();
this.shapes.each(function(b){a=a.without(b);
this.facade.deleteShape(b)
}.bind(this));
this.facade.getCanvas().update();
this.facade.setSelection(a)
}});
if(!ORYX.Plugins){ORYX.Plugins=new Object()
}ORYX.Plugins.SelectionFrame=Clazz.extend({construct:function(a){this.facade=a;
this.facade.registerOnEvent(ORYX.CONFIG.EVENT_MOUSEDOWN,this.handleMouseDown.bind(this));
document.documentElement.addEventListener(ORYX.CONFIG.EVENT_MOUSEUP,this.handleMouseUp.bind(this),true);
this.position={x:0,y:0};
this.size={width:0,height:0};
this.offsetPosition={x:0,y:0};
this.moveCallback=undefined;
this.offsetScroll={x:0,y:0};
this.node=ORYX.Editor.graft("http://www.w3.org/1999/xhtml",this.facade.getCanvas().getHTMLContainer(),["div",{"class":"Oryx_SelectionFrame"}]);
this.hide()
},handleMouseDown:function(d,c){if(c instanceof ORYX.Core.Canvas){var e=c.rootNode.parentNode.parentNode;
var b=this.facade.getCanvas().node.getScreenCTM();
this.offsetPosition={x:b.e,y:b.f};
this.setPos({x:Event.pointerX(d)-this.offsetPosition.x,y:Event.pointerY(d)-this.offsetPosition.y});
this.resize({width:0,height:0});
this.moveCallback=this.handleMouseMove.bind(this);
document.documentElement.addEventListener(ORYX.CONFIG.EVENT_MOUSEMOVE,this.moveCallback,false);
this.offsetScroll={x:e.scrollLeft,y:e.scrollTop};
this.show()
}Event.stop(d)
},handleMouseUp:function(f){if(this.moveCallback){this.hide();
document.documentElement.removeEventListener(ORYX.CONFIG.EVENT_MOUSEMOVE,this.moveCallback,false);
this.moveCallback=undefined;
var e=this.facade.getCanvas().node.getScreenCTM();
var d={x:this.size.width>0?this.position.x:this.position.x+this.size.width,y:this.size.height>0?this.position.y:this.position.y+this.size.height};
var c={x:d.x+Math.abs(this.size.width),y:d.y+Math.abs(this.size.height)};
d.x/=e.a;
d.y/=e.d;
c.x/=e.a;
c.y/=e.d;
var g=this.facade.getCanvas().getChildShapes(true).findAll(function(b){var a=b.absoluteBounds();
var j=a.upperLeft();
var h=a.lowerRight();
return(j.x>d.x&&j.y>d.y&&h.x<c.x&&h.y<c.y)
});
this.facade.setSelection(g,undefined,undefined,true)
}},handleMouseMove:function(b){var a={width:Event.pointerX(b)-this.position.x-this.offsetPosition.x,height:Event.pointerY(b)-this.position.y-this.offsetPosition.y};
var c=this.facade.getCanvas().rootNode.parentNode.parentNode;
a.width-=this.offsetScroll.x-c.scrollLeft;
a.height-=this.offsetScroll.y-c.scrollTop;
this.resize(a);
Event.stop(b)
},hide:function(){this.node.style.display="none"
},show:function(){this.node.style.display=""
},setPos:function(a){this.node.style.top=a.y+"px";
this.node.style.left=a.x+"px";
this.position=a
},resize:function(a){this.setPos(this.position);
this.size=Object.clone(a);
if(a.width<0){this.node.style.left=(this.position.x+a.width)+"px";
a.width=-a.width
}if(a.height<0){this.node.style.top=(this.position.y+a.height)+"px";
a.height=-a.height
}this.node.style.width=a.width+"px";
this.node.style.height=a.height+"px"
}});