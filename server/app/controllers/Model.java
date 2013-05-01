package controllers;

import models.simsearch.IDatapoint;
import org.codehaus.jackson.JsonNode;
import org.codehaus.jackson.JsonParser;
import org.codehaus.jackson.JsonToken;
import org.codehaus.jackson.node.ArrayNode;
import org.codehaus.jackson.node.ObjectNode;
import org.json.JSONObject;
import play.Logger;
import play.Play;
import play.libs.Json;
import play.mvc.Result;
import play.mvc.Controller;

import java.io.File;
import java.io.IOException;
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
}
