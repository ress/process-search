package controllers;

import de.uni_potsdam.hpi.bpt.qbe.index.RelationCacheRecord;
import models.BusinessProcess;
import models.SearchAlgorithm;
import models.SearchEngine;
import models.SearchResult;
import org.codehaus.jackson.JsonNode;
import org.codehaus.jackson.node.ArrayNode;
import org.codehaus.jackson.node.ObjectNode;
import org.jbpt.petri.NetSystem;
import org.jbpt.petri.Place;
import org.jbpt.pm.ProcessModel;
import play.Logger;
import play.libs.Json;
import play.mvc.BodyParser;
import play.mvc.Content;
import play.mvc.Controller;
import play.mvc.Http.RequestBody;
import play.mvc.Result;
import scala.util.parsing.json.JSON;

import java.util.ArrayList;
import java.util.Set;

public class Search extends Controller {
    static SearchEngine engine;

    public static Result index() {
        if (engine == null) {
            engine = new SearchEngine();
        }

        Content html = views.html.Search.index.render(engine.getAlgorithmIdentifiers());
        return ok(html);
    }

    @BodyParser.Of(BodyParser.Json.class)
    public static Result search() {
        ObjectNode response = Json.newObject();
        RequestBody body = request().body();
        if (engine == null) {
            engine = new SearchEngine();
        }

        JsonNode json = body.asJson();
        if (json == null) {
            return ok("fail");
        } else {
            String jsonModel = json.path("json").getTextValue();
            String algorithm = json.path("algorithm").getTextValue();
            Logger.info("search model, algorithm " + algorithm + ", JSON representation: " + jsonModel);

            SearchAlgorithm searchAlgorithm = engine.getAlgorithm(algorithm);
            ProcessModel processModel = BusinessProcess.fromJsonString(jsonModel);
            try {
                NetSystem net = new NetSystem(processModel.toPetriNet());

                // Add initial marking to PetriNet
                for (Place p : net.getSourcePlaces()) {
                    net.getMarking().put(p, 1);
                }

                ArrayList<SearchResult> results = searchAlgorithm.search(net);
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

            return ok(response);
        }
    }
}