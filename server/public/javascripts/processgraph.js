;window.PetriNetGraph = (function() {
    "use strict";
    function PetriNetGraph(dotString, svgSelector) {
        this.dot = dotString; //d3.select(dotSelector).text();
        this.svg = d3.select(svgSelector);
        this.svgGroup = this.svg.append("g").attr("transform", "translate(5, 5)");

        this.nodes = null;
        this.edges = null;

        this.graph = this.parseDot(this.dot);
        this.draw();

    }

    PetriNetGraph.prototype.parseDot = function(dot) {
        var graph;

        try {
            graph = dagre.dot.toObjects(dot);
            graph.edges.forEach(function(e) { if (!e.label) { e.label = ""; } });
        } catch (e) {
            console.log(e);
            return null;
        }

        graph.nodes.forEach(function(node) {
            node.inEdges = [];
            node.outEdges = [];
        });


        graph.edges.forEach(function(edge) {
            edge.source.outEdges.push(edge);
            edge.target.inEdges.push(edge);
        });

        graph.nodes.forEach(function(node) {
            if (node.shape == "circle") {
                if (node.inEdges.length == 0) {
                    node.label = "       •   ";
                } else {
                    node.label = '<div style="font-family: AdobeBlank; height: 32px">blank0</div>';
                }
            }
            if (node.label.match(/\d+_transition/)) {
                node.label = '-';
                node.style = "font-family: AdobeBlank";
            }
        })

        return graph;
    };

    PetriNetGraph.prototype.draw = function() {
        // D3 doesn't appear to like rebinding with the same id but a new object,
        // so for now we remove everything.
        this.svgGroup.selectAll("*").remove();

        this.nodes = this.svgGroup
            .selectAll("g .node")
            .data(this.graph.nodes, function(d) { return d.id; });

        var nodeEnter = this.nodes
            .enter()
            .append("g")
            .attr("class", "node")
            .attr("id", function(d) { return "node-" + d.id; })
            .each(function(d) { d.nodePadding = 10; });
        var boxes = nodeEnter.filter(function(d) { return d.shape != "circle"; });
        var circles = nodeEnter.filter(function(d) { return d.shape == "circle"; });
        boxes.append("rect");
        circles.append("circle").attr("r", "20");
        circles.filter(function(d) { return d.outEdges == 0 }).attr("stroke-width", "4");

        this.addLabels(nodeEnter);
        this.nodes.exit().remove();

        this.edges = this.svgGroup
            .selectAll("g .edge")
            .data(this.graph.edges, function(d) { return d.id; });

        var edgeEnter = this.edges
            .enter()
            .append("g")
            .attr("class", "edge")
            .attr("id", function(d) { return "edge-" + d.id; })
            .each(function(d) { d.nodePadding = 0; })
        edgeEnter
            .append("path")
            .attr("marker-end", "url(#arrowhead)");
        this.addLabels(edgeEnter);
        this.edges.exit().remove();

        this.recalcLabels();

        // Add zoom behavior to the SVG canvas
        var self = this;
        this.svg.call(d3.behavior.zoom().on("zoom", function redraw() {
            self.svgGroup.attr("transform",
                "translate(" + d3.event.translate + ")"
                    + " scale(" + d3.event.scale + ")");
        }));

        // Run the actual layout
        var layout = dagre.layout()
            .nodes(this.graph.nodes)
            .edges(this.graph.edges)
            .debugLevel(2)
            .run();

        // Ensure that we have at least two points between source and target
        var self = this;
        this.graph.edges.each(function(d) { self.ensureTwoControlPoints(d); });

        edgeEnter
            .selectAll("circle.cp")
            .data(function(d) {
                d.dagre.points.forEach(function(p) { p.parent = d; });
                return d.dagre.points.slice(0).reverse();
            })
            .enter()
            .append("circle")
            .attr("class", "cp");

        // Re-render
        this.update();
    };

    PetriNetGraph.prototype.addLabels = function(selection) {
        var labelGroup = selection
            //.filter(function(d) { return d.shape != "circle"; })
            .append("g")
            .attr("class", "label");
        labelGroup.append("rect");

        var foLabel = labelGroup
            .filter(function(d) { return d.label[0] === "<"; })
            .append("foreignObject")
            .attr("class", "htmllabel");

        foLabel
            .append("xhtml:div")
            .style("float", "left");

        labelGroup
            .filter(function(d) { return d.label[0] !== "<"; })
            .append("text")
            .attr("style", function(d) { if (typeof d.style != undefined) return d.style; else return ""; });


    };

    PetriNetGraph.prototype.recalcLabels = function() {
        var labelGroup = this.svgGroup.selectAll("g.label");

        var foLabel = labelGroup
            .selectAll(".htmllabel")
            // TODO find a better way to get the dimensions for foriegnObjects
            .attr("width", "100000");

        foLabel
            .select("div")
            .html(function(d) { return d.label; })
            .each(function(d) {
                d.width = this.clientWidth;
                d.height = this.clientHeight;
                d.nodePadding = 0;
            });

        foLabel
            .attr("width", function(d) { return d.width; })
            .attr("height", function(d) { return d.height; });

        var textLabel = labelGroup
            .filter(function(d) { return d.label[0] !== "<"; });

        textLabel
            .select("text")
            .attr("text-anchor", "left")
            .append("tspan")
            .attr("dy", "1em")
            .text(function(d) { return d.label || " "; });

        labelGroup
            .each(function(d) {
                var bbox = this.getBBox();
                d.bbox = bbox;
                d.width = bbox.width + 2 * d.nodePadding;
                d.height = bbox.height + 2 * d.nodePadding;
            });
    }

    PetriNetGraph.prototype.ensureTwoControlPoints = function(d) {
        var points = d.dagre.points;
        if (!points.length) {
            var s = d.source.dagre;
            var t = d.target.dagre;
            points.push({ x: (s.x + t.x) / 2, y: (s.y + t.y) / 2 });
        }

        if (points.length === 1) {
            points.push({ x: points[0].x, y: points[0].y });
        }
    };

    // Translates all points in the edge using `dx` and `dy`.
    PetriNetGraph.prototype.translateEdge = function(e, dx, dy) {
        e.dagre.points.forEach(function(p) {
            p.x += dx;
            p.y += dy;
        });
    };

    PetriNetGraph.prototype.update = function() {
        this.nodes
            .attr("transform", function(d) {
                return "translate(" + d.dagre.x + "," + d.dagre.y +")"; })
            .selectAll("g.node rect")
            .attr("x", function(d) { return -(d.bbox.width / 2 + d.nodePadding); })
            .attr("y", function(d) { return -(d.bbox.height / 2 + d.nodePadding); })
            .attr("width", function(d) { return d.width; })
            .attr("height", function(d) { return d.height; });

        this.edges
            .selectAll("path")
            .attr("d", function(d) {
                var points = d.dagre.points.slice(0);
                var source = dagre.util.intersectRect(d.source.dagre, points[0]);
                var target = dagre.util.intersectRect(d.target.dagre, points[points.length - 1]);
                points.unshift(source);
                points.push(target);
                return d3.svg.line()
                    .x(function(e) { return e.x; })
                    .y(function(e) { return e.y; })
                    .interpolate("linear")
                    (points);
            });

        this.edges
            .selectAll("circle")
            .attr("r", 5)
            .attr("cx", function(d) { return d.x; })
            .attr("cy", function(d) { return d.y; });

        this.svgGroup
            .selectAll("g.label rect")
            .attr("x", function(d) { return -d.nodePadding; })
            .attr("y", function(d) { return -d.nodePadding; })
            .attr("width", function(d) { return d.width; })
            .attr("height", function(d) { return d.height; });

        this.nodes
            .selectAll("g.label")
            .attr("transform", function(d) { return "translate(" + (-d.bbox.width / 2) + "," + (-d.bbox.height / 2) + ")"; })

        this.edges
            .selectAll("g.label")
            .attr("transform", function(d) {
                var points = d.dagre.points;
                var x = (points[0].x + points[1].x) / 2;
                var y = (points[0].y + points[1].y) / 2;
                return "translate(" + (-d.bbox.width / 2 + x) + "," + (-d.bbox.height / 2 + y) + ")";
            });
    }

    return PetriNetGraph;
})();