package org.jbpt.bp;

import java.util.HashSet;
import java.util.Set;

import org.jbpt.petri.NetSystem;
import org.jbpt.petri.Node;
import org.jbpt.petri.Transition;

public class MinimalKSuccessorRelation<M extends NetSystem,N extends Node> extends KSuccessorRelation<M,N> {

	private static final long serialVersionUID = 2550173656803890550L;

	// TODO This implementation of Minimal K-Successor Relations is highly inefficient!
	
	public MinimalKSuccessorRelation(M net, int k) {
		super(net, k);
	}
	
	public MinimalKSuccessorRelation(M net) {
		super(net, Integer.MAX_VALUE);
	}
	
	/**
	 * Computes the k-successor relation matrix for a given net
	 * @param net
	 */
	// TODO this computation considers NOP transitions required for certain constructs, e.g., AND-splits. 
	//      Hence, A --> <+> --> B will be in a 2-successor-relation  
	protected void computeMatrix() {
		this.initializeMatrix(entities.size());
		
		for (int i=1; i <= k; i++) {
			
			// use matrix calculation of KSuccessorRelation
			KSuccessorRelation<NetSystem, Node> krel = new KSuccessorRelation<NetSystem, Node>(net, i);
			int[][] kmatrix = krel.getMatrix();

			for (int col = 0; col < matrix.length; col++) {
				for (int row = 0; row < matrix[col].length; row++) {
					
					// set new value if local value is not set (==0) and there is a value in the krel matrix
					// we choose minimal values. by increasing i, we start with the smallest and 
					// hence only set a value in the matrix at its first occurents
					if (this.matrix[col][row] == 0 && kmatrix[col][row] > 0) {
						this.matrix[col][row] = kmatrix[col][row];
					}
				}
			}
		}
	}
	
	@SuppressWarnings("unchecked")
	public Set<N[]> getMinKSuccessorPairs(int k) {
		Set<N[]> pairs = new HashSet<N[]>();
		for (int i1=0; i1 < this.matrix.length; i1++) {
			for (int i2 = 0; i2 < this.matrix.length; i2++) {
				if (k <= this.matrix[i1][i2]) {
					pairs.add((N[]) new Transition[]{
							(Transition) this.entities.get(i1), 
							(Transition) this.entities.get(i2)}); 
				}
			}
		}
		
		return pairs;
	}

	public int getKforNodes(Node n1, Node n2) {
		int i1 = this.entities.indexOf(n1);
		int i2 = this.entities.indexOf(n2);
		
		if (-1 == i1 || -1 == i2) {
			return 0;
		}
		else {
			return this.matrix[i1][i2];
		}
	}
}
