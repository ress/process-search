package models;

import org.jbpt.bp.MinimalKSuccessorRelation;
import org.jbpt.petri.NetSystem;
import org.jbpt.petri.Node;
import org.jbpt.petri.io.WoflanSerializer;
import play.Logger;
import play.Play;

import java.io.*;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;

/**
 * Created with IntelliJ IDEA.
 * User: bart
 * Date: 21.02.13
 * Time: 00:26
 * To change this template use File | Settings | File Templates.
 */
public class Repository<M> {
    protected String path;
    protected HashMap<String, M> models;

    // can be set through the Model controller to define a list of models that should be loaded
    // by the search implementation
    public static List<String> selectedModels = new ArrayList<String>();

    public Repository(String path) {
        this.path = path;

        try {
            FileInputStream inputStream = new FileInputStream(path);
            ObjectInputStream objStream = new ObjectInputStream(inputStream);
            models = (HashMap<String, M>) objStream.readObject();
        } catch (IOException e) {
            // Create empty repository
            models = new HashMap<String, M>();
        } catch (ClassNotFoundException e) {
            Logger.error("Could not load repository from " + path + ", creating new empty repository.", e);
            models = new HashMap<String, M>();
        }
    }

    public boolean contains(String key) {
        return models.containsKey(key);
    }

    public M get(String key) {
        Logger.info("Loading " + key + " from repository.");
        return models.get(key);
    }

    public M put(String key, M obj) {
        return models.put(key, obj);
    }

    public boolean save() {
        try {
            FileOutputStream outputStream = new FileOutputStream(this.path);
            ObjectOutputStream objStream = new ObjectOutputStream(outputStream);
            objStream.writeObject(models);
            objStream.close();
            outputStream.close();
            Logger.info("Saved repository to " + path);

            return true;
        } catch (IOException e) {
            Logger.info("Could not save repository to " + path, e);

            return false;
        }
    }

    public static boolean shouldLoad(String filename) {
        return Repository.selectedModels.size() == 0 || Repository.selectedModels.contains(filename);
    }

    public static NetSystem loadModel(String filename) {
        String modelPath = Play.application().configuration().getString("search.modelpath");
        File file = new File(modelPath + File.separator + filename);

        if (!file.exists()) {
            return null;
        }

        Measurement.start("Repository.parseTpn", true);
        NetSystem net = WoflanSerializer.parse(file);
        Measurement.stop("Repository.parseTpn", true);
        net.setName(filename);
        net.setId(filename);

        return net;
    }
}
