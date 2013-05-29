package models.algorithms.similarity;

import models.Measurement;
import models.Repository;
import models.SearchAlgorithm;
import models.SearchResult;
import models.simsearch.IDatapoint;
import models.simsearch.RelSetDatapoint;
import models.simsearch.metrics.RSD;
import mtree.*;
import org.jbpt.bp.RelSet;
import org.jbpt.bp.construct.RelSetCreatorUnfolding;
import org.jbpt.petri.NetSystem;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.UUID;

import org.jbpt.petri.Node;
import play.Logger;
import play.Play;

/**
 * Created with IntelliJ IDEA.
 * User: bart
 * Date: 28.05.13
 * Time: 16:04
 * To change this template use File | Settings | File Templates.
 */
public class MtreeSimilaritySearch implements SearchAlgorithm {
    protected Repository<RelSet<NetSystem, Node>> repository;
    protected MTreeDistanceMetric distanceMetric;
    protected MTree<RelSetDatapoint> tree;


    protected class MTreeDistanceMetric implements DistanceFunction<RelSetDatapoint> {
        protected RSD rsd;

        public MTreeDistanceMetric() {
            rsd = new RSD();
            rsd.bpsim.setWeights(
                    0.7, //weightExSim,
                    0.07, //weightSoSim,
                    0.23, //weightInSim,
                    0, //weightESSim,
                    0 //weightEISim
            );
        }

        public void resetCounter() {
            rsd.resetCounter();
        }

        public int getNumberOfComparisons() {
            return rsd.getNumberOfComparisons();
        }

        @Override
        public double calculate(RelSetDatapoint a, RelSetDatapoint b) {
            return rsd.distance(a, b);
        }
    }

    @Override
    public String getIdentifier() {
        return "Similarity Search (new Mtree)";
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
        repository = new Repository<>("/tmp/mtree.repo");
        distanceMetric = new MTreeDistanceMetric();
        SplitFunction<RelSetDatapoint> splitFunction = new ComposedSplitFunction<RelSetDatapoint>(
                new PromotionFunctions.mLbDistPromotion<RelSetDatapoint>(),
                new PartitionFunctions.BalancedPartition<RelSetDatapoint>());
        tree = new MTree<>(4, distanceMetric, splitFunction);

        final String modelPath = Play.application().configuration().getString("search.modelpath");
        try {
            File dir = new File(modelPath);
            if (!dir.exists() || !dir.isDirectory()) {
                throw new IOException("Model path is not a valid directory: " + modelPath);
            }
            Logger.info("Starting to load process models");
            for (String filename : dir.list()) {
                if (filename.matches(".*tpn") && Repository.shouldLoad(filename)) {
                    RelSetDatapoint datapoint = this.getDataPoint(filename);

                    if (datapoint != null) {
                        tree.add(datapoint);
                        Logger.info("Loaded one");
                    }
                }
            }
            Logger.info("Finished loading process models");
        } catch (Exception e) {
            Logger.error("Could not load models", e);
        }

        repository.save();
    }

    @Override
    public void initialize(HashMap<String, Object> parameters) {
        initialize();
    }

    @Override
    public ArrayList<SearchResult> search(NetSystem processModel) {
        ArrayList<SearchResult> searchResults = new ArrayList<>();
        RelSetDatapoint query = new RelSetDatapoint(RelSetCreatorUnfolding.getInstance().deriveRelationSet(processModel));
        query.setId("Query-" + UUID.randomUUID().toString());

        distanceMetric.resetCounter();
        //this.tree.dump();
        for (MTree<RelSetDatapoint>.ResultItem resultItem : this.tree.getNearestByRange(query, 0.8)) {
            searchResults.add(new SearchResult(resultItem.data.getId(), resultItem.data.getModel(), resultItem.distance));
        }
        Measurement.step("MTreeSimilaritySearch.MetricComparisons", distanceMetric.getNumberOfComparisons());

        return searchResults;
    }

    public RelSetDatapoint getDataPoint(String modelFileName) {
        RelSetDatapoint relsetdp = null;

        try {
            RelSet<NetSystem, Node> relset = null;
            if (repository.contains(modelFileName)) {
                relset = repository.get(modelFileName);
            } else {
                NetSystem net = Repository.loadModel(modelFileName);

                if (net == null) {
                    throw new RuntimeException("Unable to load model: " + modelFileName);
                }

                Measurement.start("BPSimiliaritySearch.load");
                relset = RelSetCreatorUnfolding.getInstance().deriveRelationSet(net, 10000);
                Measurement.stop("BPSimiliaritySearch.load");
                repository.put(modelFileName, relset);
            }

            relsetdp = new RelSetDatapoint(relset);
            relsetdp.setLookAhead(10000);
            relsetdp.setId(modelFileName);
        } catch (Exception e) {
            e.printStackTrace();
        }

        return relsetdp;
    }
}
