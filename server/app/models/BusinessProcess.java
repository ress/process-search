package models;

import org.codehaus.jackson.JsonNode;
import org.codehaus.jackson.map.ObjectMapper;
import org.jbpt.pm.Activity;
import org.jbpt.pm.FlowNode;
import org.jbpt.pm.ProcessModel;
import play.Logger;

import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;

public class BusinessProcess {
    protected static class SequenceFlow {
        protected ArrayList<String> outgoing;
        protected String resourceId;

        public SequenceFlow(String resourceId, ArrayList<String> outgoing) {
            this.resourceId = resourceId;
            this.outgoing = outgoing;
        }
    }

    public static ProcessModel fromJson(JsonNode bpModel) {
        ProcessModel processModel = new ProcessModel();
        // Holds the objects for every node in the diagram that are found in the first pass
        HashMap<String, Object> processNodes = new HashMap<String, Object>();

        // Sanity checks for the model
        JsonNode shapes = bpModel.path("childShapes");
        if (shapes.isArray() && shapes.size() <= 0) {
            Logger.error("Process model has no elements");
            return null;
        }

        // First pass: Create object for every node in the diagram
        Logger.error("First parsing pass: creating objects for every node in the diagram");
        for (JsonNode shape : shapes) {
            String resourceId = shape.get("resourceId").getTextValue();
            String label = shape.get("properties").get("name").getTextValue();
            String type = shape.get("stencil").get("id").getTextValue();

            // Currently there is support for: Task, SequenceFlow
            switch (type) {
                case "Task":
                    Logger.error("Found Activity label='" + label + "' resourceId='" + resourceId + "'");
                    processNodes.put(resourceId, new Activity(label, resourceId));
                    break;
                case "SequenceFlow":
                    ArrayList<String> targetShapes = new ArrayList<String>();
                    for (JsonNode targetShape : shape.get("outgoing")) {
                        targetShapes.add(targetShape.get("resourceId").getTextValue());
                    }

                    Logger.error("Found SequenceFlow resourceId='" + resourceId + "' targets=" + targetShapes.toString());
                    processNodes.put(resourceId, new SequenceFlow(resourceId, targetShapes));
                    // Not represented with an explicit node in the jbpt model
                    break;
                default:
                    Logger.error("JSON Model parsing: Ignoring element with type " + type + "");
                    break;
            }
        }

        // Second pass: Registering control flows between diagram nodes
        for (JsonNode shape : shapes) {
            String sourceResourceId = shape.get("resourceId").getTextValue();
            String type = shape.get("stencil").get("id").getTextValue();

            switch (type) {
                case "Task":
                    FlowNode source = (FlowNode) processNodes.get(sourceResourceId);

                    for (JsonNode targetShape : shape.get("outgoing")) {
                        String targetId = targetShape.get("resourceId").getTextValue();
                        if (processNodes.containsKey(targetId)) {
                            Object target = processNodes.get(targetId);

                            // Currently only control flows using a SequenceFlow are supported
                            if (target.getClass() == SequenceFlow.class) {
                                for (String actualTargetId : ((SequenceFlow) target).outgoing) {
                                    if (processNodes.containsKey(actualTargetId)) {
                                        FlowNode actualTargetNode = (FlowNode) processNodes.get(actualTargetId);
                                        Logger.error("Adding control flow from source='" + source.getDescription() + "' to target='" + actualTargetNode.getDescription() + "'");
                                        processModel.addControlFlow(source, actualTargetNode);
                                    }
                                }
                            }
                        }
                    }
            }
        }


        return processModel;
    }

    public static ProcessModel fromJsonString(String jsonModel) {
        JsonNode bpModel;
        
        try {
            bpModel = (new ObjectMapper()).readTree(jsonModel);
            return fromJson(bpModel);
        } catch (Exception e) {
            Logger.error("Could not parse JSON of a processWave Business Process Model.", e);
            return null;
        }
    }
}
