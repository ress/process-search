package controllers;

import de.uni_potsdam.hpi.bpt.qbe.index.RelationCacheRecord;
import models.BusinessProcess;
import models.SearchEngine;
import org.codehaus.jackson.JsonNode;
import org.jbpt.petri.NetSystem;
import org.jbpt.petri.Place;
import org.jbpt.pm.ProcessModel;
import play.Logger;
import play.mvc.BodyParser;
import play.mvc.Controller;
import play.mvc.Http.RequestBody;
import play.mvc.Result;

import java.util.Set;

public class Search extends Controller {
    static SearchEngine engine;
    @BodyParser.Of(BodyParser.Json.class)
    public static Result search() {
        String resultMessage = "";
        RequestBody body = request().body();
        if (engine == null) {
            engine = new SearchEngine();
        }
        JsonNode json = body.asJson();
        if (json == null) {
            return ok("fail");
        } else {
            String jsonModel = json.path("json").getTextValue();
            Logger.info("search model, JSON representation: " + jsonModel);

            ProcessModel processModel = BusinessProcess.fromJsonString(jsonModel);
            try {
                NetSystem net = new NetSystem(processModel.toPetriNet());

                // Add initial marking to PetriNet
                for (Place p : net.getSourcePlaces()) {
                    net.getMarking().put(p, 1);
                }

                Set<RelationCacheRecord> results = engine.index.search(net);
                resultMessage = "{ \"message\" : \"" + results.size() + " model(s) found.\" }";
                for (RelationCacheRecord result : results) {
                    resultMessage += " " + result.getFile() + ",";
                    Logger.info("Result file=" + result.getFile() + " visualization= " + result.getNet().toString());
                    Logger.error("Petri-net visualization: https://chart.googleapis.com/chart?cht=gv&chl=" + java.net.URLEncoder.encode(result.getNet().toDOT()));
                }
            } catch (Exception e) {
                Logger.error("Error while searching", e);
            }

            return ok(resultMessage);
        }

    }
}