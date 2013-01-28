package matching;

import java.util.ArrayList;
import java.util.LinkedList;
import java.util.List;

public class BetterMatches {
	/**
	 * File names of the document models.
	 */
	public static String dm[] = {"1Be_1y63","1Be_1yk5","1Be_204a","1Be_22v7","1Be_25fz","1Be_25my","1Be_2aze","1Be_2ft2","1Be_2fyv","1Be_2gm6","1Be_2k7e","1Be_2kiu","1Be_2n6s","1Be_2n9n","1Be_2ork","1Be_2rd6","1Be_2rh8","1Be_2rxu","1Be_2sc7","1Be_2skz","1Be_2tnc","1Be_2vbl","1Be_2wup","1Be_2xk1","1Be_30t8","1Be_310v","1Be_322n","1Be_32fe","1Be_343s","1Be_34is","1Be_38qs","1Be_394s","1Be_3a62","1Be_3bub","1Be_3e7i","1Be_3era","1Be_3j4l","1Pr_1bt1","1Pr_1c2v","1Pr_1gm8","1Pr_1j5k","1Pr_1kwn","1Pr_1mso","1Pr_1n9b","1Pr_1nf9","1Pr_1nhz","1Pr_1nor","1Pr_1o9q","1Pr_1p3a","1Pr_1p5s","1Pr_1qq7","1Pr_1sct","1Pr_1sgy","1Pr_1vyc","1Ve_5otm","1Ve_5p60","1Ve_5tcy","1Ve_5vna","1Ve_5x4o","1Ve_5ycw","1Ve_6294","1Ve_62rl","1Ve_68lb","1Ve_6a59","1Ve_6bms","1Ve_6dlt","1Ve_6lp9","1Ve_6m1w","1Ve_6mnb","1Ve_6mxu","1Ve_6n9a","1Ve_6s89","1Ve_6u91","1Ve_6vyf","1Ve_6wdf","1Ve_701w","1Ve_70sp","1Ve_7c1w","1Ve_7coq","1Ve_7if9","1Ve_7kcl","1Ve_7lu4","1Ve_7n23","1Ve_7rr4","1Ve_7s3r","1Ve_7sma","1Ve_7suf","1Ve_7uuo","1Ve_7vev","1Ve_80w9","1Ve_82t3","1Ve_84am","1Ve_85il","1Ve_8a7d","1Ve_8ak0","1Ve_8b2j","1Ve_8bao"};
	List<String> dmlist;
	/**
	 * File names of the search models.
	 */
	public static String sm[] = {"A1 d.epml","A1 dI.epml","A1 FI.epml","A4.epml","A6 a.epml","A6 c.epml","A7 b IV.epml","L3 OM.epml","L3 p.epml","L4.epml"}; 
	List<String> smlist;
	/**
	 * Directory prefix to identify the search model filenames.
	 */
	public static String prefix = "models/bettermodelpairs/";
	
	public static String sapPrefix = "models/allEPCs/";
	/**
	 * File that contains the SAP reference model.
	 */
	public static String saprm = "models/AllEPCs.epml";
	
	/**
	 * Human judgement of relevance of a document model to a search model.
	 * If (relevance [i,j] == 1), then sm[i] has dm[j] as relevant result.  
	 */
	public static int relevance[][] =	{{1,1,1,1,0,1,1,1,0,0,0,1,0,1,1,1,1,0,1,1,1,1,1,0,1,0,1,1,0,1,1,0,1,0,1,0,0,0,0,1,1,1,0,0,0,0,0,0,0,1,1,0,1,0,1,1,0,0,1,1,1,0,0,1,1,1,0,1,0,1,1,0,0,0,1,0,0,1,0,1,1,1,1,1,1,0,1,1,0,1,0,1,1,1,0,1,1},
										 {0,0,0,1,0,1,0,1,0,1,0,0,0,1,0,0,0,1,1,0,0,0,0,1,0,0,0,1,0,1,0,0,1,0,0,0,1,0,1,1,1,0,0,1,0,0,0,0,1,0,0,0,1,1,0,0,1,1,1,0,0,0,0,0,0,1,0,1,0,0,1,0,1,0,0,0,1,0,0,0,1,0,0,0,0,0,1,1,0,1,0,0,0,0,1,1,1},
										 {0,1,1,0,0,1,0,1,0,1,0,1,0,1,0,1,1,0,1,1,1,1,0,0,1,0,0,0,0,0,1,1,1,1,1,0,0,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,1,0,0,0,1,0,0,1,1,1,0,1,1,0,1,0,1,1,0,1,0,0,0,1,0,0,0,1,0,0,0,1,1,0,1,1,1,0},
										 {1,1,1,1,1,0,1,1,1,0,0,1,1,1,1,1,1,1,1,1,1,1,0,1,1,0,1,1,0,1,1,0,1,1,1,0,1,0,0,0,0,1,0,1,1,0,0,1,1,0,0,1,0,0,1,1,1,1,1,0,1,0,1,1,0,1,0,0,0,1,0,1,1,0,1,0,0,1,0,1,1,0,1,0,0,1,0,1,0,1,1,0,1,0,1,1,0},
										 {0,1,0,0,0,1,1,0,0,0,0,0,0,1,1,1,1,1,0,1,0,1,1,1,0,0,0,0,0,1,1,0,1,0,0,1,0,1,0,1,0,0,1,1,0,0,1,1,0,1,1,0,1,1,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,1,1,0,1,1,1,0,1,0,0,1,1,1,0,0,0,0,1,0,1,1,1,0,0,1,1,0,0},
										 {1,1,0,1,0,1,1,1,0,1,0,1,0,1,1,1,0,1,1,1,1,0,1,1,0,1,1,0,1,1,1,1,1,0,1,0,1,1,1,0,1,1,1,1,0,0,1,0,1,0,1,1,0,1,1,1,1,1,0,0,1,1,1,1,1,1,0,0,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,0,1,0,1,1,0,0,1,1,1,0,1,0,1},
										 {1,1,1,1,0,0,1,1,1,0,1,0,1,1,1,0,1,1,1,0,0,1,1,1,0,1,1,0,1,1,0,1,0,1,1,1,1,0,1,1,0,0,1,1,1,0,1,1,1,1,1,1,1,0,1,0,1,1,0,1,1,0,1,1,0,1,1,0,1,0,1,1,0,1,1,0,0,1,1,1,1,0,1,1,0,0,0,1,0,1,1,0,1,1,1,0,1},
										 {1,1,1,0,0,0,0,1,0,1,1,1,1,0,1,0,1,0,1,0,1,0,0,1,0,0,0,1,0,1,1,0,1,1,0,0,1,1,0,0,0,1,0,1,1,0,0,1,0,0,0,1,0,0,1,0,0,1,0,0,1,0,0,1,0,1,0,0,1,0,0,0,0,0,1,0,0,1,0,0,1,0,1,0,0,0,0,1,0,0,1,1,1,0,0,0,0},
										 {1,1,1,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,1,1,0,0,1,1,1,1,0,0,0,1,1,1,1,0,0,1,1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,0,0,0,0,0,0,0,1,1,0,0,0,0,0,1,0,1,1,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1},
										 {0,0,0,1,1,0,1,0,1,0,1,0,1,1,1,1,1,1,0,1,0,1,0,0,0,0,1,0,1,1,0,1,1,0,1,0,1,0,0,0,0,0,0,1,0,1,0,1,1,1,0,1,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,1,1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1,0,0,1,1,0,0},
										};
	
	public BetterMatches(){
		smlist = new ArrayList<String>();
		for (String s: sm){
			smlist.add(s);
		}
		dmlist = new ArrayList<String>();
		for (String d: dm){
			dmlist.add(d);
		}		
	}
	
	/**
	 * Returns true iff the given docmodel is relevant to the given searchmodel.
	 * I.e. let i be the index, such that sm[i] == searchmodel
	 * 		let j be the index, such that dm[j] == docmodel
	 * 		return true iff relevance[i][j] == 1
	 *    
	 * @param searchmodel the name of a searchmodel (pre: searchmodel \in sm)
	 * @param docmodel the name of a docmodel (pre: docmodel \in dm)
	 * @return true iff the given docmodel is relevant to the given searchmodel.
	 */
	public boolean isRelevant(String searchmodel, String docmodel){
		return relevance[smlist.indexOf(searchmodel)][dmlist.indexOf(docmodel)] == 1;
	}
	
	/**
	 * Returns the number of document models that is relevant to the given search model.
	 * 
	 * @param searchmodel the name of a searchmodel (pre: searchmodel \in sm)
	 * @return the number of document models that is relevant to the given search model.
	 */
	public int nrRelevant(String searchmodel){
		int nrRelevant = 0;
		for (int r: relevance[smlist.indexOf(searchmodel)]){
			nrRelevant += r;
		}
		return nrRelevant;
	}

	/**
	 * Computes the average precision for a search model and an array of document models.
	 * 
	 * @param searchmodel the name of a search model (pre: searchmodel \in Matches.sm)
	 * @param docmodels an array of document models, the 'most relevant' document model
	 * 					first, the 'second most relevant' second and so on. I.e.: the
	 * 					document models are in the order in which they would be returned
	 * 					by a search engine. (pre: \forall d \in docmodels: d \in dm) 
	 * @return average precision.
	 */
	public double avgprec(String searchmodel, List<String> docmodels){
		int nrUpToIncluding = 1;
		int nrRelevantUpToIncluding = 0;
		double precisionUpToIncluding = 0;
		double avgPrecisionUpToIncluding = 0;
		if(docmodels.isEmpty()){
			return 0.0;
		}
				
		for (String searchresult: docmodels){
			nrRelevantUpToIncluding += isRelevant(searchmodel,searchresult)?1:0;
			double precision = (1.0*nrRelevantUpToIncluding) / (1.0*nrUpToIncluding);
			precisionUpToIncluding = isRelevant(searchmodel,searchresult)?precision:0;
			
			avgPrecisionUpToIncluding += precisionUpToIncluding/(1.0*nrRelevant(searchmodel)); 
			nrUpToIncluding++;			
		}

		return avgPrecisionUpToIncluding;
		
	}
	
	public void recPrecForModel(String searchmodel, List<String> docmodels, double[] precs) {
		
		List<String> results = new LinkedList<String>();
		double start = 0.1;
		int i = 0;
		for (String model : docmodels) {
			results.add(model);
			double[] pr = precForModel(searchmodel, results);
			if (pr[1] >= start) {
//				System.out.println(pr[0]+"\t"+pr[1]);
				precs[i] += pr[0];
				start += 0.1;
				i++;
			}
		}
	}
	
	public double[] precForModel(String searchmodel, List<String> docmodels) {
		double nrOfRelevant = 0;
		if(docmodels.isEmpty()) {
			return new double[]{0.0, 0.0};
		}
				
		for (String searchresult: docmodels) {
			nrOfRelevant += isRelevant(searchmodel,searchresult)? 1 : 0;
		}

//		System.out.println(nrOfRelevant + " " +(1.0*docmodelss.size())+ " "+ (1.0*nrRelevant(searchmodel)));
		return  new double[]{(1.0*nrOfRelevant) / (1.0*docmodels.size()), 
						(1.0*nrOfRelevant) / (1.0*nrRelevant(searchmodel))};
		
	}
	
	public double fScore(String searchmodel, List<String> docmodels) {
		double nrOfRelevant = 0;
		if(docmodels.isEmpty()) {
			return 0;
		}
				
		for (String searchresult: docmodels) {
			nrOfRelevant += isRelevant(searchmodel,searchresult)? 1 : 0;
		}

		double precision = (1.0*nrOfRelevant) / (1.0*docmodels.size());
		double recall = (1.0*nrOfRelevant) / (1.0*nrRelevant(searchmodel));
		
		return  precision == 0 && recall == 0 ? 0 : 2 * (precision  * recall / (precision + recall));
		
	}
	
	public double precision(String searchmodel, List<String> docmodels){
		if(docmodels.isEmpty()){
			return 0.0;
		}
		int result = 0;
		for (String searchresult: docmodels){
			if(isRelevant(searchmodel,searchresult)){
				result+=1;
			}
			
		}
		double precision = (double)result/(double)docmodels.size();
		return precision;
		
	}
	
	public double precision(String searchmodel, List<String> docmodels, int i){
		if(docmodels.isEmpty()){
			return 0.0;
		}
		int result = 0;
		for (String searchresult: docmodels){
			if(docmodels.indexOf(searchresult)<i&&isRelevant(searchmodel,searchresult)){
				result+=1;
			}
			
		}
		double precision = (double)result/(double)i;
		return precision;
		
	}

	public double recall(String searchmodel, List<String> docmodels){
		
		int result = 0;
		for (String searchresult: docmodels){
			if(isRelevant(searchmodel,searchresult)){
				result+=1;
			}
		}
		
		double recall = (double)result/(double)nrRelevant(searchmodel);
		return recall;
		
	}
}
