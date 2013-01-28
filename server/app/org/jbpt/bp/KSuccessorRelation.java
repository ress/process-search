package org.jbpt.bp;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.jbpt.alignment.NodeAlignment;
import org.jbpt.bp.construct.RelSetCreatorUnfolding;
import org.jbpt.petri.NetSystem;
import org.jbpt.petri.Node;
import org.jbpt.petri.PetriNet;
import org.jbpt.petri.Transition;

import de.uni_potsdam.hpi.bpt.qbe.index.RelationAnalyzer;

public class KSuccessorRelation<M extends NetSystem,N extends Node> implements Serializable {

	private static final long serialVersionUID = 6845557966294374955L;
	protected M net;
	protected int k;
	protected List<N> entities;
	protected int[][] matrix;
	
	public KSuccessorRelation(M net, int k) {
		this.entities = new ArrayList<N>((Collection<N>) NodeAlignment.filter(net.getTransitions()));
		this.net = net;
		this.k = Math.min(k, this.entities.size()*this.entities.size());
		
		this.computeMatrix();
	}
	
	public KSuccessorRelation(M net) {
		this(net, Integer.MAX_VALUE);
	}
	
	@SuppressWarnings("unchecked")
	protected void initializeMatrix(int size) {
		
		this.matrix = new int[size][size];
		
		// initialize matrix
		for (int i = size - 1; i > 0; i--) {
			for (int j = size - 1; j > 0; j--) {
				this.matrix[i][j] = 0;
			}
		}
	}

	/**
	 * Computes the k-successor relation matrix for a given net
	 * @param net
	 */
	// TODO this computation considers NOP transitions required for certain constructs, e.g., AND-splits. 
	//      Hence, A --> <+> --> B will be in a 2-successor-relation  
	protected void computeMatrix() {
		
		this.initializeMatrix(this.entities.size());
		
		// compute the k relation set, i.e., behavioral profile, consisting of -->, +, ||
 		RelSet<NetSystem, Node> krelset = RelSetCreatorUnfolding.getInstance().deriveRelationSet(net, this.k);

		// parse the profile into successor relationships
		for (Node n1 : this.entities) {
			int i1 = this.entities.indexOf(n1);
			
			Set<Node> related = new HashSet<Node>();
			
			related.addAll(krelset.getEntitiesInRelation(n1, RelSetType.Order));
			related.addAll(krelset.getEntitiesInRelation(n1, RelSetType.Interleaving));
			
			for (Node n2: related) {
				int i2 = this.entities.indexOf(n2);
				
				// this.entities may not contain a related node of the unfiltered (!) relationset krel
                // Chr: 'unfiltered' might refer to the petri-net helper nodes that are created during the
                //      conversion from EPC/BPMN
				if (i2 > -1) {
					this.matrix[i1][i2] = this.k;
				}
			}
		}
	}
	
	public final List<N> getEntities() {
		return this.entities;
	}
	
	public final int[][] getMatrix() {
		return this.matrix;
	}
	
	public final M getNet() {
		return this.net;
	}
	
	@SuppressWarnings("unchecked")
	public Set<N[]> getSuccessorPairs() {
		Set<N[]> pairs = new HashSet<N[]>();
		for (int i1=0; i1 < this.matrix.length; i1++) {
			for (int i2 = 0; i2 < this.matrix.length; i2++) {
				if (0 < this.matrix[i1][i2]) {
					pairs.add((N[]) new Transition[]{
							(Transition) this.entities.get(i1), 
							(Transition) this.entities.get(i2)}); 
				}
			}
		}
		
		return pairs;
	}
	
	public int getSuccessorDistance(N n1, N n2) {
		int i1 = this.entities.indexOf(n1);
		int i2 = this.entities.indexOf(n2);
		
		if (i1 < 0 || i2 < 0) {
			return 0;
		}
		
		return this.matrix[i1][i2];
	}
	
	public void printMatrix() {
		for (int i=0; i< this.entities.size(); i++) {
			System.out.println(i+" -- "+this.entities.get(i));
		}
		
		System.out.print("   |");
		for (int i=0; i< this.entities.size(); i++) {
			System.out.printf("%3d|", i);
		}
		System.out.println();
		
		System.out.print("---+");
		for (int i=0; i< this.entities.size(); i++) {
			System.out.print("---+");
		}
		System.out.println();
		
		for (int i=0; i< this.entities.size(); i++) {
			System.out.printf("%3d|", i);
			for (int j=0; j< this.entities.size(); j++) {
				System.out.printf("%3d|", this.matrix[i][j]);
			}
			System.out.println();
		}
	}
}
