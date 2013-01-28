package org.jbpt.sim;

import java.io.File;

import org.jbpt.bp.MinimalKSuccessorRelation;
import org.jbpt.petri.NetSystem;
import org.jbpt.petri.Node;

import de.uni_potsdam.hpi.bpt.qbe.experiment.Experiment;

public class SingleActivityClosenessTest extends Experiment {

	public SingleActivityClosenessTest() {
		MODEL_PATH = "/Users/matthiaskunze/Documents/paperwork/submissions/2012_TSE_rejected/implementation/comin2011/models/tpn_bpm12_queries";
	}
	
	public static void main(String[] args) {
		
		SingleActivityClosenessTest test = new SingleActivityClosenessTest();
		
		String[] queries = new String[]{"6.tpn"};
		String[] documents = new String[]{"10.tpn","11.tpn"};
		
		for (String query : queries) {
			NetSystem q = test.loadModel(query);
			
			for (String document : documents) {
				NetSystem d = test.loadModel(document);
				
				double c = SingleActivityCloseness.compute(q,d);
				
				MinimalKSuccessorRelation<NetSystem, Node> mk = new MinimalKSuccessorRelation<NetSystem, Node>(d);
				mk.printMatrix();
				
				System.out.println(query + " ?> " + document + "=> c="+c);
			}
		}
	}
}
