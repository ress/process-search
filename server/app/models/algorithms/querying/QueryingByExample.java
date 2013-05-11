package models.algorithms.querying;

import de.uni_potsdam.hpi.bpt.qbe.index.RelationCacheRecord;
import de.uni_potsdam.hpi.bpt.qbe.index.RelationInvertedIndex;
import models.Measurement;
import models.Repository;
import models.SearchAlgorithm;
import models.SearchResult;
import models.algorithms.querying.closeness.Closeness;
import org.jbpt.bp.MinimalKSuccessorRelation;
import org.jbpt.petri.NetSystem;
import org.jbpt.petri.Node;
import org.jbpt.petri.io.WoflanSerializer;
import play.Logger;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Set;

/**
 * Querying by Example implementation
 */
public class QueryingByExample implements SearchAlgorithm {
    private String MODEL_PATH = "/Users/bart/Projekte/MA/EfficientSimilaritySearch/comin2011/tpn";
    private RelationInvertedIndex index;
    protected Repository<MinimalKSuccessorRelation<NetSystem, Node>> repository;

    @Override
    public String getIdentifier() {
        return "Querying by Example";
    }

    @Override
    public ArrayList<Object> getAvailableParameters() {
        return new ArrayList<>();
    }

    @Override
    public HashMap<String, Object> getParameters() {
        return new HashMap<>();
    }

    @Override
    public void initialize() {
        repository = new Repository<>("/tmp/qbe.repo");

        try {
            index = new RelationInvertedIndex();

            File dir = new File(MODEL_PATH);
            if (!dir.exists() || !dir.isDirectory()) {
                throw new IOException("Model path is not a valid directory: " + MODEL_PATH);
            }
            Logger.info("Starting to load process models");
            for (String filename : dir.list()) {
                if (filename.matches(".*tpn") && Repository.shouldLoad(filename)) {
                    MinimalKSuccessorRelation<NetSystem, Node> minK = null;

                    // If possible, load MinKSuccessorRelation from disk, otherwise
                    // parse it and cache it for the future.
                    if (repository.contains(filename)) {
                        minK = repository.get(filename);
                    } else {
                        NetSystem model = Repository.loadModel(filename + "");
                        if (model != null) {
                             minK = new MinimalKSuccessorRelation<NetSystem, Node>(model);
                            repository.put(filename, minK);
                        }
                    }

                    if (minK != null) {
                        this.index.addRelation(minK);
                    }
                    Logger.info("Loaded one: " + filename);
                }
            }
            Logger.info("Finished loading process models");

            repository.save();
        } catch (Exception e) {
            Logger.error("Could not load models", e);
        }
    }

    @Override
    public void initialize(HashMap<String, Object> parameters) {
        initialize();
    }

    @Override
    public ArrayList<SearchResult> search(NetSystem processModel) {
        ArrayList<SearchResult> results = new ArrayList<>();

        try {
            Measurement.start("QueryingByExample.search");
            Set<RelationCacheRecord> foundModels = index.search(processModel);
            for (RelationCacheRecord model : foundModels) {
                Measurement.start("QueryingByExample.search.computeCloseness");
                double closeness = Closeness.compute(processModel, model.getNet());
                Measurement.stop("QueryingByExample.search.computeCloseness");
                results.add(new SearchResult(model.getFile(), model.getNet(), closeness));
            }
            Measurement.stop("QueryingByExample.search");

            return results;
        } catch (IOException e) {
            return new ArrayList<>();
        }
    }
}
