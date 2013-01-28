package de.uni_potsdam.hpi.bpt.qbe.evaluation;

import java.util.List;

public class RankingCorrelation {
	
	/**
	 * Computes Kendall's Tau for two ordered lists of data points
	 * @see https://de.wikipedia.org/wiki/Rangkorrelationskoeffizient#Kendalls_Tau
	 * 
	 * @param a ordered list of first similarities, smallest value first
	 * @param b aligned list of second similarities, ordered by the same order of a, i.e., if a values in in 4th position in a, it must be in 4th position in b, no matter of the ranking)
	 */
	public static double KendallsTau(List<? extends Number> a, List<? extends Number> b) {
		assert a.size() == b.size() : "Cannot compare ranking of two lists of different size";
		
		if (a.size() < 2) {
			return 0;
		}
		
		int C = 0;
		int D = 0;
		int Tx = 0;
		int Ty = 0;
		@SuppressWarnings("unused")
		int Txy = 0;
		
		for (int i=0; i < a.size();i++) {
			for (int j = i+1; j < a.size(); j++) {
				double xi = a.get(i).doubleValue();
				double xj = a.get(j).doubleValue();
				double yi = b.get(i).doubleValue();
				double yj = b.get(j).doubleValue();
				
				assert xi <= xj : "First list has invalid order";
				
				if (xi < xj) {
					if (yi < yj)      { C++; }   // concordant
					else if (yi > yj) { D++; }   // disconcordant
					else              { Ty++; }  // tied in y
				} else { // xi == xj
					if (yi != yj)     { Tx++; }  // tied in x
					else              { Txy++; } // tied in x and y
				}
			}
		}

		double norm = Math.sqrt((C+D+Tx)*(C+D+Ty));
		return 0 == norm ? 0 : (C-D) / norm;
	}
	
	/**
	 * Computes Kendall's Tau for two ordered lists of data points
	 * @see https://de.wikipedia.org/wiki/Rangkorrelationskoeffizient#Kendalls_Tau
	 * 
	 * @param a ordered list of first similarities, smallest value first
	 * @param b aligned list of second similarities, ordered by the same order of a, i.e., if a values in in 4th position in a, it must be in 4th position in b, no matter of the ranking)
	 */
	public static double KendallsTauWithBinding(List<? extends Number> a, List<? extends Number> b) {
		assert a.size() == b.size() : "Cannot compare ranking of two lists of different size";
		
		if (a.size() < 2) {
			return 0;
		}
		
		int C = 0;
		int D = 0;
		int Tx = 0;
		int Ty = 0;
		int Txy = 0;
		
		for (int i=0; i < a.size();i++) {
			for (int j = i+1; j < a.size(); j++) {
				double xi = a.get(i).doubleValue();
				double xj = a.get(j).doubleValue();
				double yi = b.get(i).doubleValue();
				double yj = b.get(j).doubleValue();
				
				assert xi <= xj : "First list has invalid order";
				
				if (xi < xj) {
					if (yi < yj)      { C++; }   // concordant
					else if (yi > yj) { D++; }   // disconcordant
					else              { Ty++; }  // tied in y
				} else { // xi == xj
					if (yi != yj)     { Tx++; }  // tied in x
					else              { Txy++; } // tied in x and y
				}
			}
		}

		double norm = Math.sqrt((C+D+Tx)*(C+D+Ty));
		return 0 == norm ? 0 : (C-D+Tx+Ty+Txy) / norm;
	}
	
}
