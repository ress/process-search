package models.simsearch.metrics;

import models.simsearch.ExperimentMetric;
import models.simsearch.IDatapoint;
import models.simsearch.util.AlignmentConstructor;
import org.jbpt.alignment.Alignment;
import org.jbpt.bp.RelSet;
import org.jbpt.bp.sim.AggregatedSimilarity;
import org.jbpt.petri.NetSystem;
import org.jbpt.petri.Node;
import org.jbpt.petri.PetriNet;

/**
 * Created with IntelliJ IDEA.
 * User: bart
 * Date: 07.02.13
 * Time: 23:47
 * To change this template use File | Settings | File Templates.
 */
public class RSD extends ExperimentMetric {

    public AggregatedSimilarity<RelSet<NetSystem, Node>, NetSystem, Node> bpsim = new AggregatedSimilarity<>();

    public double innerDistance(IDatapoint profile1, IDatapoint profile2) {

        @SuppressWarnings("unchecked")
        Alignment<RelSet<NetSystem, Node>, Node> al = AlignmentConstructor.getAlignment((RelSet<NetSystem, Node>) profile1, (RelSet<NetSystem, Node>) profile2);
        double score = bpsim.score(al);
        //bpsim.invalidateCache(); // clear cache

        return 1 - score;
    }

    public void setWeight(){};

}