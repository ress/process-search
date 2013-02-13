package models;

import models.simsearch.ExperimentMetric;
import models.simsearch.IDatapoint;
import models.simsearch.RelSetDatapoint;
import models.simsearch.SimpleGraphDatapoint;
import models.simsearch.metrics.RSD;
import org.jbpt.bp.construct.RelSetCreatorUnfolding;
import org.jbpt.petri.NetSystem;
import org.jbpt.petri.io.WoflanSerializer;

import java.io.File;
import java.util.*;

/**
 * Created with IntelliJ IDEA.
 * User: bart
 * Date: 07.02.13
 * Time: 23:51
 * To change this template use File | Settings | File Templates.
 */
public class RSDSimilaritySearch extends SimilaritySearch {
    protected final String MODEL_PATH = "/Users/bart/Projekte/MA/EfficientSimilaritySearch/comin2011/tpn";
    private class ResultData implements Comparable {

        public Double distance = -1.0;
        public IDatapoint p = null;

        public ResultData(double distance, IDatapoint p) {
            this.distance = distance;
            this.p = p;
        }

        @Override
        public int compareTo(Object arg0) {

            if (!(arg0 instanceof ResultData)) {
                throw new IllegalArgumentException("compared to object of different type");
            }

            return (this.distance).compareTo(((ResultData)arg0).distance);
        }
    }

    @Override
    public String getIdentifier() {
        return "RSDSimilaritySearch";
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

        SortedSet<ResultData> intermediateResults = new TreeSet<>();

        for (IDatapoint dp : this.loadedModels) {
            intermediateResults.add(new ResultData(this.metric.distance(query, dp), dp));
            System.out.println("distance(query, " + dp.getId() + ") = " + this.metric.distance(query, dp));
        }

        // simulate retrieval of k nearest neighbor access
        int i = 0;
        Iterator<ResultData> res = intermediateResults.iterator();
        while(res.hasNext() && i < 10) {
            i++;
            ResultData d = res.next();
            System.out.println("distance(query, " + d.p.getId() + ") = " + d.distance);
        }


        return results;
    }

    @Override
    public IDatapoint getDataPoint(String modelFileName) {
        RelSetDatapoint relsetdp = null;

        try {
            NetSystem net = WoflanSerializer.parse(new File(this.MODEL_PATH + "/" + modelFileName));
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
