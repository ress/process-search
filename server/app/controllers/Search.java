package controllers;

import play.*;
import play.mvc.*;

import views.html.*;

public class Search extends Controller {
  
  public static Result search() {
    return ok(index.render("Your new application is ready."));
  }
  
}