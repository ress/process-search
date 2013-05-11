/**
 * Created with IntelliJ IDEA.
 * User: bart
 * Date: 06.01.13
 * Time: 21:10
 * To change this template use File | Settings | File Templates.
 */
import models.SearchEngine;
import play.*;

public class Global extends GlobalSettings {
    @Override
    public void onStart(Application app) {
        Logger.info("Application has started");
    }

    @Override
    public void onStop(Application app) {
        Logger.info("Application shutdown...");
    }
}