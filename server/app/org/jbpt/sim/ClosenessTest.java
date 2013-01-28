package org.jbpt.sim;

import java.io.File;
import java.util.logging.Level;
import java.util.logging.Logger;

import org.jbpt.bp.MinimalKSuccessorRelation;
import org.jbpt.petri.NetSystem;
import org.jbpt.petri.Node;

import de.uni_potsdam.hpi.bpt.qbe.experiment.Experiment;

public class ClosenessTest extends Experiment {

	public ClosenessTest() {
		Logger.getGlobal().setLevel(Level.FINE);
		MODEL_PATH = "/Users/matthiaskunze/Documents/paperwork/submissions/2012_TSE_rejected/implementation/comin2011/models/tpn_models_no_events";
	}
	
	public static void main(String[] args) {
		
		ClosenessTest test = new ClosenessTest();
		
		String[] queries = new String[]{"1Ve_5jtb_no_events.tpn","1Ku_9yyx_no_events.tpn"};
		String[] documents = new String[]{"1Ve_5jtb_no_events.tpn","1Ku_9yyx_no_events.tpn"};
		
		for (String query : queries) {
			NetSystem q = test.loadModel(query);
			
			for (String document : documents) {
				NetSystem d = test.loadModel(document);
				
				double c = Closeness.compute(q,d);
				
				MinimalKSuccessorRelation<NetSystem, Node> mk = new MinimalKSuccessorRelation<NetSystem, Node>(d);
				System.out.println("DOCUMENT");
				mk.printMatrix();
				
				System.out.println("QUERY");
				MinimalKSuccessorRelation<NetSystem, Node> mq = new MinimalKSuccessorRelation<NetSystem, Node>(q);
				mq.printMatrix();
				
				System.out.println(query + " ?> " + document + "=> c="+c+"\n");
			}
		}
	}
}
