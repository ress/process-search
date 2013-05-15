package controllers;

import models.Repository;
import models.SearchEngine;
import models.simsearch.IDatapoint;
import org.codehaus.jackson.JsonNode;
import org.codehaus.jackson.JsonParser;
import org.codehaus.jackson.JsonToken;
import org.codehaus.jackson.node.ArrayNode;
import org.codehaus.jackson.node.ObjectNode;
import org.codehaus.jackson.node.TextNode;
import org.json.JSONObject;
import play.Logger;
import play.Play;
import play.libs.Json;
import play.mvc.BodyParser;
import play.mvc.Http;
import play.mvc.Result;
import play.mvc.Controller;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.concurrent.Callable;

/**
 * Created with IntelliJ IDEA.
 * User: bart
 * Date: 01.05.13
 * Time: 15:53
 * To change this template use File | Settings | File Templates.
 */
public class Model extends Controller {
    public static Result list() {
        response().setHeader("Access-Control-Allow-Origin", "*");
        final String modelPath = Play.application().configuration().getString("search.modelpath");

        return async(play.libs.Akka.future(new Callable<Result>() {
            public Result call() {
                ObjectNode response = Json.newObject();

                try {
                    ArrayNode modelList = response.putArray("models");

                    File dir = new File(modelPath);
                    if (!dir.exists() || !dir.isDirectory()) {
                        throw new IOException("Model path is not a valid directory: " + modelPath);
                    }
                    for (String filename : dir.list()) {
                        if (filename.matches(".*tpn")) {
                            modelList.add(filename);
                        }
                    }
                } catch (Exception e) {
                    Logger.error("Could not load models", e);
                }
                return ok(response);
            }
        }));
    }

    @BodyParser.Of(BodyParser.Json.class)
    public static Result load() {
        response().setHeader("Access-Control-Allow-Origin", "*");
        Http.RequestBody body = request().body();
        JsonNode req = body.asJson();

        if (req == null) {
            return ok("Request not in JSON format.");
        }

        List<String> modelsToLoad = new ArrayList<String>();
        Iterator<JsonNode> models = req.get("models").getElements();
        while (models.hasNext()) {
            JsonNode t = models.next();
            modelsToLoad.add(t.asText());
        }
        Logger.info(modelsToLoad.toString());

        final String modelPath = Play.application().configuration().getString("search.modelpath");
        for (String model : modelsToLoad) {
            File modelFile = new File(modelPath + "/" + model);
            if (!modelFile.exists()) {
                Logger.error("Model " + model + " does not exist in " + modelPath);
                return ok("Model " + model + " does not exist in " + modelPath);
            }
        }

        Logger.info("Setting Repository.selectedModels to " + modelsToLoad.toString());

        // Reset all indexes
        if (!Repository.selectedModels.equals(modelsToLoad)) {
            Repository.selectedModels = modelsToLoad;
            SearchEngine.getInstance().resetAlgorithms();

            Logger.info("Reloading models");
        } else {
            Logger.info("Reloading models not necessary, no changes.");
        }

        response().setHeader("Access-Control-Allow-Origin", "*");
        return ok();
    }

    public static Result selected() {
        response().setHeader("Access-Control-Allow-Origin", "*");
        ObjectNode response = Json.newObject();
        ArrayNode models = response.putArray("models");

        for (String model : Repository.selectedModels) {
            models.add(model);
        }

        return ok(response);
    }

    public static Result checkPreFlight() {
        response().setHeader("Access-Control-Allow-Origin", "*");       // Need to add the correct domain in here!!
        response().setHeader("Access-Control-Allow-Methods", "GET");   // Only allow POST
        response().setHeader("Access-Control-Max-Age", "300");          // Cache response for 5 minutes
        response().setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");         // Ensure this header is also allowed!
        return ok();
    }
}
