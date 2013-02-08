package nl.tue.ieis.is.similarity.graph;

import java.util.HashSet;
import java.util.Set;



public class GraphSimplifier {
	
	public static boolean isValidLabel(String label) {
		if (label.toLowerCase().contains("start event")) return false;
		if (label.toLowerCase().contains("start function")) return false;
		if (label.toLowerCase().contains("stop event")) return false;
		if (label.toLowerCase().contains("stop function")) return false;
		if (label.contains("_transition")) return false;
		if (label.contains("_helper")) return false;
		
		return true;
	}

	public static SimpleGraph simplify(SimpleGraph sg) {
		
		Set<Integer> toCutOut = new HashSet<Integer>();
		
		for (Integer v : sg.getVertices())
			if (!isValidLabel(sg.getLabel(v)))
				toCutOut.add(v);
		
		for (Integer v : toCutOut)
			sg.cutOutVertix(v);
		
		return sg;
	}
	
	

}
