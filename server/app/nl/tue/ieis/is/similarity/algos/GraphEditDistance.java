package nl.tue.ieis.is.similarity.algos;

import java.util.Set;

import models.simsearch.util.AlignmentConstructor;
import nl.tue.ieis.is.similarity.graph.SimpleGraph;
import nl.tue.ieis.is.similarity.graph.TwoVertices;

public class GraphEditDistance extends DistanceAlgoAbstr implements DistanceAlgo {

	public double compute(SimpleGraph sg1, SimpleGraph sg2){
		// set private members
		init(sg1,sg2);
		
		// derive mapping
		//Set<TwoVertices> mapping = AlignmentConstructor.getAlignmentForSimpleGraphs(sg1,sg2);
		Set<TwoVertices> mapping = AlignmentConstructor.getAlignmentForSimpleGraphs(sg1, sg2, true);
		
		// set weights
		Object[] weights = {"vweight", 0.1, "eweight", 0.2, "sweight", 0.8, "usepuredistance", 0.0};
		setWeight(weights);
		
		// compute GED
		return this.editDistance(mapping); 
	}

}
