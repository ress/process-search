package nl.tue.ieis.is.similarity.algos;

import nl.tue.ieis.is.similarity.graph.SimpleGraph;

public interface DistanceAlgo {
	
	/**
	 * Given two graphs, returns a value by which graphs can be sorted for relevance,
	 * lowest value first. E.g. the value can be:
	 * - an edit distance (lower edit distance means better match between graphs)
	 * - 1.0 - similarity score (lower value means higher similarity score, means better match between graphs) 
	 * 
	 * @param sg1 A graph.
	 * @param sg2 A graph.
	 * @return A value, where a lower value represents a more relevant match between graphs.
	 */
	public double compute(SimpleGraph sg1, SimpleGraph sg2);

	/**
	 * Sets the weights for:
	 * - skipping vertices (vweight)
	 * - substituting vertices (sweight)
	 * - skipping edges (eweight)
	 * - string edit similarity cutoff (ledcutoff)
	 * - use pure edit distance/ use weighted average distance (usepuredistance) 
	 *     Ad usepuredistance: weight is a boolean. If 1.0: uses the pure edit distance, if 0.0: uses weighted average of the fractions of skipped vertices, skipped edges and substitution score.
	 * - prune when recursion reaches this depth, 0.0 means no pruning (prunewhen)
	 * - prune to recursion of this depth (pruneto)
	 *
	 * The argument is an array of objects, interchangably a String ("vweight", "sweight", or "eweight")
	 * and a 0.0 <= Double <= 1.0 that is the value that should be set for the given weight.
	 * All other weights are set to 0.0. 
	 * 
	 * @param weights 
	 * Pre: for i mod 2 = 0: weights[i] instanceof String /\ weights[i] \in {"vweight", "sweight", or "eweight"}
	 * 		for i mod 2 = 1: weights[i] instanceof Double /\ 0.0 <= weights[i] <= 1.0
	 * 		for i: if i < weights.length(), then i+1 < weights.length() 
	 * Post: weight identified by weights[i] is set to weights[i+1]
	 * 		 all other weights are set to 0.0 
	 */
	public void setWeight(Object weights[]);
}
