package models.algorithms.similarity;

import models.SearchResult;
import models.algorithms.similarity.GEDSimilaritySearch;
import models.simsearch.*;
import models.simsearch.metrics.RSD;
import org.jbpt.bp.construct.RelSetCreatorUnfolding;
import org.jbpt.petri.NetSystem;
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
    protected final String MODEL_PATH = "/Users/bart/Projekte/MA/EfficientSimilaritySearch/comin2011/tpn";

    @Override
    public String getIdentifier() {
        return "BP Similarity Search (indexed)";
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

        IDatapoint query = new RelSetDatapoint(RelSetCreatorUnfolding.getInstance().deriveRelationSet(processModel));
        query.setId("Query-" + UUID.randomUUID().toString());

        // knn query ---------------------------------------------------------------------------
        final Sphere queryPoint = new Sphere(query, 0.5, null, -1, this.metric);
        // internal NN Query Cursor deals with a candidate objects
        Comparator distanceComparator = new Comparator () {
            public int compare (Object candidate1, Object candidate2) {
                double sphereDist1 = queryPoint.sphereDistance((Sphere)((Tree.Query.Candidate)candidate1).descriptor());
                double sphereDist2 = queryPoint.sphereDistance((Sphere)((Tree.Query.Candidate)candidate2).descriptor());
                return sphereDist1 < sphereDist2 ? -1 : sphereDist1 == sphereDist2 ? 0 : 1;
            }
        };


        // run k-NN use taker get 5-NN points
        // Note: mtree.query(queue) method deals with object of Type candidate
        // to extract actual data we should call candidate.descriptor() or entry() method
        Iterator kNNresult = new Taker(this.tree.query(new DynamicHeap(distanceComparator)), QUERY_K);
        while(kNNresult.hasNext()){
            Sphere obj = (Sphere)((Tree.Query.Candidate)kNNresult.next()).descriptor();
            IDatapoint current = (IDatapoint) obj.center();
            System.out.println(obj.center() + "; distance to query point:  " + queryPoint.centerDistance(obj) );
            results.add(new SearchResult(((RelSetDatapoint)obj.center()).getId(), current.getModel(), queryPoint.centerDistance(obj)));
        }

        return results;
    }

    @Override
    public IDatapoint getDataPoint(String modelFileName) {
        RelSetDatapoint relsetdp = null;

        try {
            NetSystem net = WoflanSerializer.parse(new File(this.MODEL_PATH + "/" + modelFileName));
            Logger.info("Petri-net visualization: https://chart.googleapis.com/chart?cht=gv&chl=" + java.net.URLEncoder.encode(net.toDOT()));
            if (net == null) {
                throw new RuntimeException("Unable to load model: " + modelFileName);
            }

            // deriveRelationSet(net, 1) derives relation sets with a lookahead of 1, i.e., alpha relations
            relsetdp = new RelSetDatapoint(RelSetCreatorUnfolding.getInstance().deriveRelationSet(net));
            relsetdp.setId(modelFileName);

        } catch (Exception e) {
            e.printStackTrace();
        }

        return relsetdp;
    }
}
