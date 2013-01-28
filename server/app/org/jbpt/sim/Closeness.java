package org.jbpt.sim;

import java.util.logging.Logger;

import org.jbpt.alignment.NodeAlignment;
import org.jbpt.bp.KSuccessorRelation;
import org.jbpt.bp.MinimalKSuccessorRelation;
import org.jbpt.petri.Flow;
import org.jbpt.petri.NetSystem;
import org.jbpt.petri.Node;
import org.jbpt.petri.Place;
import org.jbpt.petri.Transition;
import org.jbpt.petri.structure.PetriNetStructuralChecks;

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
		
		
		
		/*
		if (NodeAlignment.filter(query.getTransitions()).size() == 0) {
			System.out.println("empty query");
			return 0;
		}
		
		if (NodeAlignment.filter(query.getTransitions()).size() == 1) {
			System.out.println("SingleActivityCloseness");
			return SingleActivityCloseness.compute(query, document);
		}
		
		System.out.println("SuccessorCloseness");
		return SuccessorCloseness.compute(query, document);
		
		/*
		
		PetriNetStructuralChecks<Flow, Node, Place, Transition> pncheck = new PetriNetStructuralChecks<>();
		boolean qfc = pncheck.isExtendedFreeChoice(query);
		boolean dfc = pncheck.isExtendedFreeChoice(document);
		
		
		
		if (qfc && dfc) {
			System.out.println("SuccessorCloseness");
			return SuccessorCloseness.compute(query, document);
		}
		
		System.out.println("Not computed");
		Logger.getGlobal().warning("NetSystem cannot be used for closeness computation currently: " +
				(!qfc ? "query: "+query.getId() : "") + (!dfc ? " document: "+document.getId() : "") + "\n returned 0 for closeness");
		
		return 0;
		*/
	}
	
}
