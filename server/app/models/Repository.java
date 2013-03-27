package models;

import org.jbpt.bp.MinimalKSuccessorRelation;
import org.jbpt.petri.NetSystem;
import org.jbpt.petri.Node;
import play.Logger;

import java.io.*;
import java.util.HashMap;

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

    public Repository(String path) {
        this.path = path;

        try {
            FileInputStream inputStream = new FileInputStream(path);
            ObjectInputStream objStream = new ObjectInputStream(inputStream);
            models = (HashMap<String, M>) objStream.readObject();
        } catch (IOException e) {
            // Create empty repository
            models = new HashMap<>();
        } catch (ClassNotFoundException e) {
            Logger.error("Could not load repository from " + path + ", creating new empty repository.", e);
            models = new HashMap<>();
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
}
