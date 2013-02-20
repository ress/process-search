package models.algorithms.querying;

import de.uni_potsdam.hpi.bpt.qbe.index.RelationCacheRecord;
import de.uni_potsdam.hpi.bpt.qbe.index.RelationInvertedIndex;
import models.SearchAlgorithm;
import models.SearchResult;
import org.jbpt.petri.NetSystem;
import org.jbpt.petri.io.WoflanSerializer;
import play.Logger;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Set;

/**
 * Querying by Example implementation
 */
public class QueryingByExample implements SearchAlgorithm {
    private String MODEL_PATH = "/Users/bart/Projekte/MA/EfficientSimilaritySearch/comin2011/tpn";
    private RelationInvertedIndex index;

    @Override
    public String getIdentifier() {
        return "Querying by Example";
    }

    @Override
    public void initialize() {
        try {
            index = new RelationInvertedIndex();

            File dir = new File(MODEL_PATH);
            if (!dir.exists() || !dir.isDirectory()) {
                throw new IOException("Model path is not a valid directory: " + MODEL_PATH);
            }
            Logger.info("Starting to load process models");
            for (String filename : dir.list()) {
                if (filename.matches(".*tpn")) {
                    NetSystem model = this.loadModel(filename);
                    if (model != null) {
                        index.addNet(model);
                        this.index.setNetId(model, filename);
                        Logger.info("Loaded one");
                    }
                }
            }
            Logger.info("Finished loading process models");
        } catch (Exception e) {
            Logger.error("Could not load models", e);
        }
    }

    @Override
    public ArrayList<SearchResult> search(NetSystem processModel) {
        ArrayList<SearchResult> results = new ArrayList<>();

        try {
            Set<RelationCacheRecord> foundModels = index.search(processModel);
            for (RelationCacheRecord model : foundModels) {
                results.add(new SearchResult(model.getFile(), model.getNet()));
            }

            return results;
        } catch (IOException e) {
            return new ArrayList<>();
        }
    }

    private NetSystem loadModel(String name) {
        // remove possibly trailing / (\)
        MODEL_PATH = MODEL_PATH.replaceAll(File.separator + "$", "");

        File file = new File(MODEL_PATH + File.separator + name);

        if (!file.exists()) {
            return null;
        }

        NetSystem net = WoflanSerializer.parse(file);
        net.setName(name);
        Logger.info("Petri-net visualization: https://chart.googleapis.com/chart?cht=gv&chl=" + java.net.URLEncoder.encode(net.toDOT()));

        return net;
    }
}
