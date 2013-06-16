package models.algorithms.similarity;

import models.Measurement;
import models.Repository;
import models.SearchResult;
import models.simsearch.*;
import models.simsearch.metrics.RSD;
import org.jbpt.bp.RelSet;
import org.jbpt.bp.construct.RelSetCreatorUnfolding;
import org.jbpt.petri.NetSystem;
import org.jbpt.petri.Node;
import org.jbpt.petri.io.WoflanSerializer;
import play.Logger;
import xxl.core.collections.queues.DynamicHeap;
import xxl.core.cursors.filters.Taker;
import xxl.core.indexStructures.Sphere;
import xxl.core.indexStructures.Tree;

import java.io.File;
import java.util.*;

/**
 * Created with IntelliJ IDEA.
 * User: bart
 * Date: 07.02.13
 * Time: 23:51
 * To change this template use File | Settings | File Templates.
 */
public class BpSimilaritySearch extends GEDSimilaritySearch {
    protected Repository<RelSet<NetSystem, Node>> repository;
    protected HashMap<String, Object> parameters;

    @Override
    public void initialize() {
        HashMap<String, Object> parameters = getDefaultParameters();
        initialize(parameters);
    }

    @Override
    public void initialize(HashMap<String, Object> parameters) {
        this.parameters = parameters;
        repository = new Repository<>("/tmp/bpsimsearch" + QUERY_LOOKAHEAD + ".repo");
        super.initialize();
        repository.save();
    }

    @Override
    public String getIdentifier() {
        return "Similarity Search";
    }

    @Override
    public ArrayList<Object> getAvailableParameters() {
        ArrayList<Object> parameters = new ArrayList<>();

        HashMap<String, Object> k_value = new HashMap<>();
        k_value.put("name", "k-value");
        k_value.put("type", "number");
        k_value.put("default", "10");

        parameters.add(k_value);

        return parameters;
    }

    public HashMap<String, Object> getParameters() {
        return parameters;
    }

    public HashMap<String, Object> getDefaultParameters() {
        HashMap<String, Object> parameters = new HashMap<>();
        parameters.put("k-value", "10");
        return parameters;
    }

    @Override
    public ExperimentMetric getMetric() {
        RSD rsd = new RSD();

//		// TODO SAP model collection
        rsd.bpsim.setWeights(
                0.7, //weightExSim,
                0.07, //weightSoSim,
                0.23, //weightInSim,
                0, //weightESSim,
                0 //weightEISim
        );

        return rsd;
    }

    @Override
    public ArrayList<SearchResult> search(NetSystem processModel) {
        ArrayList<SearchResult> results = new ArrayList<>();
        Integer k_value = Integer.valueOf((String)this.parameters.get("k-value"));

        IDatapoint query = new RelSetDatapoint(RelSetCreatorUnfolding.getInstance().deriveRelationSet(processModel));
        query.setId("Query-" + UUID.randomUUID().toString());

        // knn query ---------------------------------------------------------------------------
        final Sphere queryPoint = new Sphere(query, 0.0f, null, -1, this.metric);
        // internal NN Query Cursor deals with a candidate objects
        Comparator distanceComparator = new Comparator () {
            public int compare (Object candidate1, Object candidate2) {
                Measurement.start("BPSimilaritySearch.distanceComparator");
                double sphereDist1 = queryPoint.sphereDistance((Sphere)((Tree.Query.Candidate)candidate1).descriptor());
                double sphereDist2 = queryPoint.sphereDistance((Sphere)((Tree.Query.Candidate)candidate2).descriptor());
                Measurement.stop("BPSimilaritySearch.distanceComparator");
                Measurement.step("BPSimilaritySearch.comparisons");
                return sphereDist1 < sphereDist2 ? -1 : sphereDist1 == sphereDist2 ? 0 : 1;
            }
        };

        //this.metric.resetCounter();

        // run k-NN use taker get 5-NN points
        // Note: mtree.query(queue) method deals with object of Type candidate
        // MTree queries don't support the k-value for kNN queries right now
        Measurement.start("BPSimilaritySearch.knnSearch");
        //Iterator kNNresult = this.tree.query(queryPoint, 0);
        Iterator kNNresult = new Taker(this.tree.query(new DynamicHeap(distanceComparator)), k_value);
        Measurement.stop("BPSimilaritySearch.knnSearch");

        this.metric.resetCounter();
        while (kNNresult.hasNext()) {
            //*  <-- Toggle the first / to switch between Sequential and MTree queries
            Sphere obj = (Sphere)((Tree.Query.Candidate)kNNresult.next()).descriptor();
            IDatapoint current = (IDatapoint) obj.center();
            System.out.println(obj.center() + "; distance to query point:  " + queryPoint.centerDistance(obj) );

            // Skip obviously bad results
            //if (queryPoint.centerDistance(obj) < 1) {
                results.add(new SearchResult(((RelSetDatapoint)obj.center()).getId(), current.getModel(), queryPoint.centerDistance(obj)));
            //}
            /*/
            RelSetDatapoint p = (RelSetDatapoint)kNNresult.next();
            //results.add(new SearchResult(p.getId(), p.getModel(), this.metric.distance(query, p)));
            //*/
        }

        Measurement.step("BPSimilaritySearch.MetricComparisons", this.metric.getNumberOfComparisons());
        this.metric.resetCounter();

        return results;
    }

    @Override
    public IDatapoint getDataPoint(String modelFileName) {
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

                // deriveRelationSet(net, 1) derives relation sets with a lookahead of 1, i.e., alpha relations
                Measurement.start("BPSimiliaritySearch.load");
                relset = RelSetCreatorUnfolding.getInstance().deriveRelationSet(net, QUERY_LOOKAHEAD);
                Measurement.stop("BPSimiliaritySearch.load");
                repository.put(modelFileName, relset);
            }

            relsetdp = new RelSetDatapoint(relset);
            relsetdp.setLookAhead(QUERY_LOOKAHEAD);
            relsetdp.setId(modelFileName);
        } catch (Exception e) {
            e.printStackTrace();
        }

        return relsetdp;
    }
}
