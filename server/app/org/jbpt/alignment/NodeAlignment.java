package org.jbpt.alignment;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.Map.Entry;

import org.jbpt.bp.KSuccessorRelation;
import org.jbpt.petri.NetSystem;
import org.jbpt.petri.Node;
import org.jbpt.petri.Transition;

import uk.ac.shef.wit.simmetrics.similaritymetrics.Levenshtein;

public class NodeAlignment<N extends Node> {

	protected static double SED_THRESHOLD = 0.65;
	public static double getSED_THRESHOLD() {
		return SED_THRESHOLD;
	}

	public static void setSED_THRESHOLD(double sed) {
		SED_THRESHOLD = sed;
	}

	protected Collection<N> nodes1;
	protected Collection<N> nodes2;
	
	protected Map<N,N> alignment = new HashMap<N,N>();
	
	@SuppressWarnings("unchecked")
	public <M extends NetSystem> NodeAlignment(M net1, M net2) {
		this((Collection<N>) net1.getTransitions(), (Collection<N>) net2.getTransitions());
	}
	
	public <M extends NetSystem> NodeAlignment(KSuccessorRelation<M, N> k1, KSuccessorRelation<M, N> k2) {
		this(k1.getEntities(), k2.getEntities());
	}
	
	public NodeAlignment(Collection<N> n1, Collection<N> n2) {
		this.nodes1 = filter(n1);
		this.nodes2 = filter(n2);
		
		this.computeAlignment();
	}
	
	/**
	 * very simple implementation of an alignment
	 * - iterates over nodes
	 * - if the best remaining match for one node is found, it's take, and the node cannot be reused
	 */
	public void computeAlignment() {
		Collection<N> ns1 = this.nodes1;
		Collection<N> ns2 = this.nodes2;
		
		for (N n1 : ns1) {
			N bestMatch = null;
			float bestSim = 0;
			for (N n2 : ns2) {
				double sim = LabelSimilarity.compute(n1.getLabel(), n2.getLabel());
				
				if (sim >= SED_THRESHOLD && sim > bestSim) {
					bestMatch = n2;
				}
			}
			
			if (null != bestMatch) {
				this.alignment.put(n1, bestMatch);
				ns2.remove(bestMatch);
			}
		}
	}
	
	/**
	 * get a map of the aligned pairs
	 * @return
	 */
	public final Map<N,N> getAlignedPairs() {
		return this.alignment;
	}
	
	public final N getAlignedNodeForNodeOfFirstModel(N n) {
		if (this.alignment.containsKey(n)) {
			return this.alignment.get(n);
		}
		return null;
	}
	
	public final N getAlignedNodeForNodeOfSecondModel(N n) {
		for (Entry<N,N> pair : this.getAlignedPairs().entrySet()) {
			if (pair.getValue() == n) {
				return pair.getKey();
			}
		}
		return null;
	}
	
	/**
	 * filters nodes that should not be considered
	 * @see isValidLabel
	 * 
	 * @param collection
	 * @return
	 */
	public static <N extends Node> Collection<N> filter(Collection<N> collection) {
		Collection<N> output = new ArrayList<N>();
		
		for (N i : collection) {
			if (isValidLabel((i).getLabel())) {
				output.add(i);
			}
		}
		return output;
	}
	
	
	/**
	 * checks, whether a transition has an invalid label, i.e., should not be considered for analysis, e.g. silent and helper transitions
	 * 
	 * @param label
	 * @return
	 */
	public static boolean isValidLabel(String label) {
		if (label == null) return false;

		label = label.trim();
		if (label.isEmpty()) return false;
		if (label.toLowerCase().contains("start event")) return false;
		if (label.toLowerCase().contains("start function")) return false;
		if (label.toLowerCase().contains("stop event")) return false;
		if (label.toLowerCase().contains("stop function")) return false;
		if (label.contains("_transition")) return false;
		if (label.contains("_helper_")) return false;
		if (label.trim().matches("^\\d*$")) return false;
		
		return true;
	}
	
	public static void main(String[] args) {
		String[] ls1 = new String[]{"Matthias","Andreas","Luise","Peter","21 articles", "  42"};
		String[] ls2 = new String[]{"Mathias","Andrea","Luis","Nico","Evelling","Rami","21 articles", "42 "};
		
		Node[] ns1 = new Node[ls1.length];
		for (int i=0; i<ls1.length;i++) {
			ns1[i] = new Transition();
			ns1[i].setLabel(ls1[i]);
		}
		
		Node[] ns2 = new Node[ls2.length];
		for (int i=0; i<ls2.length;i++) {
			ns2[i] = new Transition();
			ns2[i].setLabel(ls2[i]);
		}
		
		NodeAlignment<Node> na = new NodeAlignment<Node>(Arrays.asList(ns1), Arrays.asList(ns2));
		
		for (Entry<Node, Node> pair : na.getAlignedPairs().entrySet()) {
			System.out.println(pair.getKey().getLabel() + " <-> " + pair.getValue().getLabel());
		}
	}

}
