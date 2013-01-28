package org.jbpt.bp;

import org.jbpt.petri.NetSystem;
import org.jbpt.petri.Node;

public class OneSuccessorRelation<M extends NetSystem,N extends Node> extends KSuccessorRelation<M,N> {

	public OneSuccessorRelation(M net) {
		super(net, 1);
	}
	
	// must not be called
	private OneSuccessorRelation(M net, int k) {
		super(net, 1);
	}

}
