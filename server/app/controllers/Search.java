package controllers;

import org.codehaus.jackson.JsonNode;
import org.codehaus.jackson.map.ObjectMapper;

import play.*;
import play.mvc.*;
import play.mvc.Http.RequestBody;

import views.html.*;

public class Search extends Controller {
  
  @BodyParser.Of(BodyParser.Json.class)
  public static Result search() {
    RequestBody body = request().body();
    JsonNode json = body.asJson();
    if (json == null) {
      return ok("fail");
    } else {
      String json_model = json.path("json").getTextValue();
      JsonNode query;
      try {
        query = (new ObjectMapper()).readTree(json_model);
        return ok(query.path("resourceId").getTextValue());
      } catch (Exception e) {}
      return ok("foo");
    }
  }
}