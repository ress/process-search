package org.jbpt.bp;

import org.jbpt.petri.NetSystem;
import org.jbpt.petri.Node;

import de.uni_potsdam.hpi.bpt.qbe.experiment.Experiment;

public class KSuccTest extends Experiment {

	public KSuccTest() {
		MODEL_PATH = "/Users/matthiaskunze/Documents/paperwork/submissions/2012_TSE_rejected/implementation/comin2011/models/tpn_bpm12_queries";
	}
	
	public static void main(String[] args) {
		
		KSuccTest test = new KSuccTest();
		NetSystem net = test.loadModel("2.tpn");
		
		KSuccessorRelation<NetSystem, Node> orel = new KSuccessorRelation<NetSystem, Node>(net, 1);
		System.out.println(" ==== 1-Successor Matrix ==== ");
		orel.printMatrix();
		
		for (Node n1 : net.getTransitions()) {
			for (Node n2 : net.getTransitions()) {
				System.out.println(n1.getLabel()+"-"+n2.getLabel()+": k="+orel.getSuccessorDistance(n1, n2));
			}
		}
		
		KSuccessorRelation<NetSystem, Node> krel = new KSuccessorRelation<NetSystem, Node>(net);
		System.out.println("\n ==== K-Successor Matrix ==== ");
		krel.printMatrix();
		
		for (Node n1 : net.getTransitions()) {
			for (Node n2 : net.getTransitions()) {
				System.out.println(n1.getLabel()+"-"+n2.getLabel()+": k="+krel.getSuccessorDistance(n1, n2));
			}
		}
		
		MinimalKSuccessorRelation<NetSystem, Node> mkrel = new MinimalKSuccessorRelation<NetSystem, Node>(net);
		System.out.println("\n ==== Minimal-K-Successor Matrix ==== ");
		mkrel.printMatrix();
		
		for (Node n1 : net.getTransitions()) {
			for (Node n2 : net.getTransitions()) {
				System.out.println(n1.getLabel()+"-"+n2.getLabel()+": k="+mkrel.getSuccessorDistance(n1, n2));
			}
		}
		
	}
}
