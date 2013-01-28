package org.jbpt.sim;

import java.util.Collection;
import java.util.logging.Logger;

import org.jbpt.alignment.Alignment;
import org.jbpt.alignment.NodeAlignment;
import org.jbpt.bp.KSuccessorRelation;
import org.jbpt.bp.MinimalKSuccessorRelation;
import org.jbpt.petri.NetSystem;
import org.jbpt.petri.Node;


/**
 * Closeness Implementation for Sounde Free Choice Process Models
 * @author matthiaskunze
 */
public class SuccessorCloseness {

	public static float compute(NetSystem query, NetSystem document) {
		KSuccessorRelation<NetSystem, Node> q = new KSuccessorRelation<NetSystem, Node>(query, 1);
		MinimalKSuccessorRelation<NetSystem, Node> d = new MinimalKSuccessorRelation<NetSystem, Node>(document);
		
		return compute(q,d);
	}
	
	public static float compute(KSuccessorRelation<NetSystem, Node> query, MinimalKSuccessorRelation<NetSystem, Node> document) {
		
		
		NodeAlignment<Node> alignment = new NodeAlignment<Node>(query, document);
		
		double sumDPair = 0;
				
		for (Node[] qPair : query.getSuccessorPairs()) {
			Node d1 = alignment.getAlignedNodeForNodeOfFirstModel(qPair[0]);
			Node d2 = alignment.getAlignedNodeForNodeOfFirstModel(qPair[1]);
			
			if (null != d1 && null != d2) {
				int k = document.getKforNodes(d1,d2);
				
				// stop, if at least one relation cannot be resolved
				if (0 == k) {
//System.out.println("  order not matched: " +  qPair[0].getLabel()+"|>"+qPair[1].getLabel() + " --> " + d1.getLabel() + ">" + d2.getLabel());					
					return 0;
				}
				
				//System.out.println(d1.getLabel()+">"+d2.getLabel()+" k=" + k);
				sumDPair += 1/Math.sqrt(k);
			}
			else {
//System.out.println("  nodes not matched: " +  qPair[0].getLabel()+"|>"+qPair[1].getLabel() + " --> " + (null == d1 ? "null" : d1.getLabel()) + ">" + (null == d2 ? "null" : d2.getLabel()));
				// stop, if at least one relation cannot be resolved
				return 0;
			}
		}
		
		Collection<Node[]> pairs = query.getSuccessorPairs();
		
		return (float) sumDPair / pairs.size();
	}
	
	public static void main(String[] args) {
		
	}
}
