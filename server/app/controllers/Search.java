package controllers;

import de.uni_potsdam.hpi.bpt.qbe.evaluation.Aggregate;
import de.uni_potsdam.hpi.bpt.qbe.evaluation.StopWatch;
import de.uni_potsdam.hpi.bpt.qbe.index.RelationCacheRecord;
import models.*;
import org.codehaus.jackson.JsonNode;
import org.codehaus.jackson.map.ObjectMapper;
import org.codehaus.jackson.node.ArrayNode;
import org.codehaus.jackson.node.ObjectNode;
import org.codehaus.jackson.node.TextNode;
import org.jbpt.petri.NetSystem;
import org.jbpt.petri.Place;
import org.jbpt.pm.ProcessModel;
import play.Logger;
import play.Play;
import play.libs.Json;
import play.mvc.BodyParser;
import play.mvc.Content;
import play.mvc.Controller;
import play.mvc.Http.RequestBody;
import play.mvc.Result;
import scala.util.parsing.json.JSON;

import java.util.*;

public class Search extends Controller {
    static SearchEngine engine;

    public static Result index() {
        if (engine == null) {
            engine = SearchEngine.getInstance();
        }

        Content html = views.html.Search.index.render(engine.getAlgorithmIdentifiers());
        return ok(html);
    }

    public static Result clearMeasurements() {
        Measurement.clearPersistent();

        return ok();
    }

    public static Result persistMeasurements() {
        Measurement.setPersist(true);
        return ok();
    }

    public static Result algorithms() {
        response().setHeader("Access-Control-Allow-Origin", "*");
        ObjectNode response = Json.newObject();
        ArrayNode algorithms = response.putArray("algorithms");
        ObjectMapper om = new ObjectMapper();

        for (String identifier : SearchEngine.getInstance().getAlgorithmIdentifiers()) {
            ObjectNode algorithm = algorithms.addObject();
            algorithm.put("name", identifier);
            algorithm.put("parameters", om.valueToTree(SearchEngine.getInstance().getAlgorithm(identifier).getAvailableParameters()));
        }

        return ok(response);
    }

    @BodyParser.Of(BodyParser.Json.class)
    public static Result search() {
        response().setHeader("Access-Control-Allow-Origin", "*");

        ObjectNode response = Json.newObject();
        RequestBody body = request().body();
        if (engine == null) {
            engine = SearchEngine.getInstance();
        }

        JsonNode json = body.asJson();
        if (json == null) {
            return ok("fail");
        } else {
            String jsonModel = json.path("json").getTextValue();
            String tpnModel = json.path("tpn").getTextValue();
            String algorithm = json.path("algorithm").getTextValue();
            HashMap<String, Object> parameters = jsonParametersToHash(json.path("parameters"));
            Logger.info("search model, algorithm " + algorithm + ", JSON representation: " + jsonModel + ", tpn Representation: " + tpnModel);

            SearchAlgorithm searchAlgorithm = engine.getAlgorithm(algorithm, parameters);

            // Support multiple input formats for process models
            ProcessModel processModel;
            NetSystem net;
            if (jsonModel != null) {
               processModel = BusinessProcess.fromJsonString(jsonModel);
               net = new NetSystem(processModel.toPetriNet());
            } else if (tpnModel != null) {
                net = BusinessProcess.fromTpn(tpnModel);
            } else {
                return ok("fail");
            }

            try {
                // Add initial marking to PetriNet
                for (Place p : net.getSourcePlaces()) {
                    net.getMarking().put(p, 1);
                }

                long startTime = System.nanoTime();
                ArrayList<SearchResult> results = searchAlgorithm.search(net);
                long estimatedTime = System.nanoTime() - startTime;

                response.put("time", estimatedTime);
                response.put("message", results.size() + " model(s) found.");

                ArrayNode models = response.putArray("models");
                for (SearchResult result : results) {
                    ObjectNode model = Json.newObject();
                    model.put("filename", result.fileName);
                    model.put("dot", result.model.toDOT());
                    model.put("score", result.score);
                    models.add(model);
                    //Logger.info("Result file=" + result.fileName + " visualization= " + result.model.toString());
                    //Logger.error("Petri-net visualization: https://chart.googleapis.com/chart?cht=gv&chl=" + java.net.URLEncoder.encode(result.model.toDOT()));
                }
            } catch (Exception e) {
                Logger.error("Error while searching", e);
            }

            ObjectNode measurements = response.putObject("measurements");
            HashMap<String, StopWatch> stopWatches = Measurement.getAllStopWatches();
            for (Map.Entry<String, StopWatch> s : stopWatches.entrySet()) {
                if (s.getValue().numLaps() == 0) {
                    continue;
                }

                ObjectNode measurement = measurements.putObject(s.getKey());

                ArrayNode values = measurement.putArray("values");
                for (Long value : s.getValue().statistics().toArray(new Long[1])) {
                    values.add(value);
                }

                measurement.put("min", s.getValue().statistics().min());
                measurement.put("max", s.getValue().statistics().max());
                measurement.put("avg", s.getValue().statistics().avg());
                measurement.put("median", s.getValue().statistics().median());
                measurement.put("quartile", s.getValue().statistics().quantile(0.25));
                measurement.put("quantile-0.9", s.getValue().statistics().quantile(0.9));
                measurement.put("variance", s.getValue().statistics().variance());
                measurement.put("stddev", Math.sqrt(s.getValue().statistics().variance()));
            }

            Measurement.step("basicStepper");
            Measurement.step("basicStepper", 2);
            ObjectNode steppers = response.putObject("steppers");
            for (Map.Entry<String, Integer> s : Measurement.getAllSteppers().entrySet()) {
                steppers.put(s.getKey(), s.getValue());
            }

            Measurement.clear();

            return ok(response);
        }
    }

    private static HashMap<String, Object> jsonParametersToHash(JsonNode jsonParameters) {
        HashMap<String, Object> parameters = new HashMap<>();

        Iterator<Map.Entry<String, JsonNode>> fields = jsonParameters.getFields();
        while (fields.hasNext()) {
           Map.Entry field = fields.next();
           parameters.put(field.getKey().toString(), ((TextNode)field.getValue()).getTextValue());
        }

        return parameters;
    }
}