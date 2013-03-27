package models.algorithms.querying.closeness;

import java.util.logging.Logger;

import org.jbpt.alignment.NodeAlignment;
import org.jbpt.bp.KSuccessorRelation;
import org.jbpt.bp.MinimalKSuccessorRelation;
import org.jbpt.petri.NetSystem;
import org.jbpt.petri.Node;
import org.jbpt.sim.SingleActivityCloseness;
import org.jbpt.sim.SuccessorCloseness;

/**
 * Closeness Implementation
 *
 * @author matthiaskunze
 */
public class Closeness {

    public static float compute(KSuccessorRelation<NetSystem, Node>query, MinimalKSuccessorRelation<NetSystem, Node> document) {
        if (NodeAlignment.filter(query.getEntities()).size() == 0) {
            //System.out.println("empty query");
            return 0;
        }

        if (query.getSuccessorPairs().size() == 0) {
            //System.out.println("SingleActivityCloseness");
            return SingleActivityCloseness.compute(query.getNet(), document.getNet());
        }

        //System.out.println("SuccessorCloseness w/ "+NodeAlignment.filter(query.getEntities()));
        return SuccessorCloseness.compute(query, document);
    }

    public static float compute(NetSystem query, NetSystem document) {
        // TODO plug in trace based closeness computation

        return compute(new KSuccessorRelation<NetSystem, Node>(query, 1), new MinimalKSuccessorRelation<NetSystem, Node>(document));
    }

}
