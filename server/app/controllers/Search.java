package controllers;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map.Entry;

import org.codehaus.jackson.JsonNode;
import org.codehaus.jackson.map.ObjectMapper;

import play.*;
import play.mvc.*;
import play.mvc.Http.RequestBody;

import views.html.*;

import org.jbpt.pm.ProcessModel;
import org.jbpt.pm.bpmn.Task;
import org.jbpt.petri.NetSystem;
import org.jbpt.petri.Node;
import org.jbpt.petri.PetriNet;
import org.jbpt.petri.Transition;

public class Search extends Controller {
  
  @BodyParser.Of(BodyParser.Json.class)
  public static Result search() {
    RequestBody body = request().body();
    JsonNode json = body.asJson();
    if (json == null) {
      return ok("fail");
    } else {
      String json_model = json.path("json").getTextValue();
      Logger.info("search model, JSON representation: " + json_model);
      JsonNode query;
      try {
        query = (new ObjectMapper()).readTree(json_model);
      } catch (Exception e) {
    	  return ok("Failed to load JSON Model");
      }
      
      createProcessModel(query);
      
      return ok(query.path("resourceId").getTextValue());
    }
  }
  
  public static Object createProcessModel(JsonNode json_model) {
	JsonNode elements = json_model.path("childShapes");
	if (elements.isArray() && elements.size() <= 0) {
	  Logger.info("Process model has no elements");
	  return null;
	}
	
	ProcessModel pm = new ProcessModel();
	HashMap<String, Task> nodes = new HashMap<String, Task>();
	HashMap<String, ArrayList<String>> connections = new HashMap<String, ArrayList<String>>(); 
	
	for (JsonNode element : elements) {
		String id = element.get("resourceId").getTextValue();
		String name = element.get("properties").get("name").getTextValue();
		String type = element.get("stencil").get("id").getTextValue();
		ArrayList<String> connected_to = new ArrayList<String>();
		
		// TODO don't skip over gateways
		
		// Ignoring everything but tasks (activities), as they
		// also contain the information connecting them to other tasks
		if (!type.equals("Task"))
			continue;
		
		Logger.info("Found a new Task");
		Logger.info(id + " / " + name + " / " + type);
		nodes.put(id,  new Task(name, id));
		
		for (JsonNode outgoing : element.get("outgoing")) {
			String outgoing_id = outgoing.get("resourceId").getTextValue();
			
			// Store list of nodes this task is connected to
			if (outgoing_id.lastIndexOf("_edge") > 0) {
				outgoing_id = outgoing_id.substring(0, outgoing_id.lastIndexOf("_edge"));
				connected_to.add(outgoing_id);				
			}
			Logger.info("connected to " + outgoing_id);
		}
		
		// temporarily store list of nodes that this Task is connected to
		// as we might not have parsed all Tasks and thus might not be able
		// to reference a still unknown Task
		connections.put(id, connected_to);
		
		Logger.info("------");
	}
	
	// add control-flow relations
	for (Entry<String, ArrayList<String>> entry : connections.entrySet()) {
		Task t_from = nodes.get(entry.getKey());
		
		if (t_from == null) {
			Logger.error("Task " + entry.getKey() + " has relations to other nodes, but a lookup in the nodes HashMap returned null");
			return null;
		}
		
		// add control-flow relations from t_from to all nodes
		// found in the JSON model scan earlier
		for (String target_node : entry.getValue()) {
			Task t_to = nodes.get(target_node);
			
			if (t_to == null) {
				Logger.error("Task " + entry.getKey() + " has relation to " + target_node + ", but that node doesn't exist in the transmitted JSON process model.");
				return null;
			}
			
			pm.addControlFlow(t_from, t_to);
		}
	}
	
	Logger.info("Petri-net visualization: https://chart.googleapis.com/chart?cht=gv&chl=" + java.net.URLEncoder.encode(pm.toPetriNet().toDOT()));
	
	return null;
  }
}