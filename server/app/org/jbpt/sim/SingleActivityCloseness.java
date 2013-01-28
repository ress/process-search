package org.jbpt.sim;

import java.util.Collection;
import java.util.HashSet;
import java.util.Set;

import org.jbpt.alignment.NodeAlignment;
import org.jbpt.bp.KSuccessorRelation;
import org.jbpt.bp.MinimalKSuccessorRelation;
import org.jbpt.petri.NetSystem;
import org.jbpt.petri.Node;

/**
 * Rough similarity estimation for queries that consist of unconnected nodes.
 * Is not particularly precise or well tested and won't work, if compared net has a global loop* 
 * 
 * @author matthiaskunze
 *
 */

public class SingleActivityCloseness {

	public static float compute(NetSystem query, NetSystem document) {
		
		Collection<Node> qNodes = new HashSet<Node>(NodeAlignment.filter(query.getTransitions()));
		MinimalKSuccessorRelation<NetSystem, Node> d = new MinimalKSuccessorRelation<NetSystem, Node>(document);
		
		
		return compute(qNodes,d);
	}
	
	
	private static float compute(Collection<Node> queryNodes, KSuccessorRelation<NetSystem, Node> document) {
		
		float sum = 0;
		@SuppressWarnings({ "unchecked", "rawtypes" })
		NodeAlignment<Node> alignment = new NodeAlignment(queryNodes, (Collection<Node>) document.getEntities());
		
		for (Node q : queryNodes) {
			
			Node d = alignment.getAlignedNodeForNodeOfFirstModel(q);
			
			if (null == d) {
 //System.out.println("Not matched: " + q.getLabel() + " --> null " );				
				return 0;
			}
			
			int shortestPath = Integer.MAX_VALUE;
			for (Node f : getStartNodes(document)) {
				if (d.equals(f)) {
					shortestPath = 0;
					break;
				}
				
				int k = document.getSuccessorDistance(f,d);
				shortestPath = Math.min(shortestPath, k);
			}

			for (Node f : getFinalNodes(document)) {
				if (d.equals(f)) {
					shortestPath = 0;
					break;
				}
				
				int k = document.getSuccessorDistance(d,f);
				shortestPath = Math.min(shortestPath, k);
			}

			if (0 == shortestPath) { // aligned node is start or end node
				sum += 1;
			}
			else if (Integer.MAX_VALUE == shortestPath) { // document has no start/end nodes
				sum += 1;
			}
			else { // there is a start or an end nod
				sum += 1.0/Math.sqrt(shortestPath + 1); 
			}
		}
		
		return (float) sum / queryNodes.size();
	}
	
	protected static Collection<Node> getStartNodes(KSuccessorRelation<NetSystem, Node> krel) {
		
		// TODO find real start activity (activities that can occur first in a trace)
		// use NetSystem#getSourcePlace(), find transitions in postset and compute path distance 
		
		Set<Node> pred = new HashSet<Node>();
		Set<Node> succ = new HashSet<Node>();
		
		for (Node[] pair : krel.getSuccessorPairs()) {
			pred.add(pair[0]);
			succ.add(pair[1]);
		}
		
		pred.removeAll(succ);

		return pred;
	}
	
	protected static Collection<Node> getFinalNodes(KSuccessorRelation<NetSystem, Node> krel) {

		// TODO find real end activity (activities that can occur last in a trace)
		// use NetSystem#getSinkPlace(), find transitions in preset and compute path distance
		
		Set<Node> pred = new HashSet<Node>();
		Set<Node> succ = new HashSet<Node>();
		
		for (Node[] pair : krel.getSuccessorPairs()) {
			pred.add(pair[0]);
			succ.add(pair[1]);
		}
		
		succ.removeAll(pred);

		return succ;
	}
	
}
