package org.jbpt.alignment;

import uk.ac.shef.wit.simmetrics.similaritymetrics.Levenshtein;

public class LabelSimilarity {
	public static double compute(String left, String right) {
		return Math.max(
				computeUnprocessed(removeParenths(left), removeParenths(right)),
				computeUnprocessed(process(left), process(right)));
	}
	
	public static double computeUnprocessed(String left, String right) {
		return new Levenshtein().getSimilarity(left, right);
	}
	
	protected static String process(String label) {
		return label
			.toLowerCase()
			.replaceAll("\\W", " ") // normalize all non word characters
			.replaceAll("\\s+"," ") // remove additional whitespaces
			.trim();  
	}
	
	protected static String removeParenths(String label) {
		return process(label.replaceAll("\\(.*\\)", ""));
	}
	
	
	public static void main(String[] args) {
		//System.out.println(LabelSimilarity.compute("stock removal processing", "Stock Placement Processing"));
		System.out.println(LabelSimilarity.compute("stock", "Stock (Placement Processing)"));
		System.out.println(LabelSimilarity.compute("Preference Processing","Difference Processing"));
	}
}
