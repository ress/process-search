package matching;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

public class Matches {
	/**
	 * File names of the document models.
	 */
	public static String dm[] = {"1Be_1y63.epml","1Be_204a.epml","1Be_22v7.epml","1Be_25fz.epml","1Be_25my.epml","1Be_2aze.epml","1Be_2ft2.epml","1Be_2gm6.epml","1Be_2ork.epml","1Be_2rxu.epml","1Be_2tnc.epml","1Be_2vbl.epml","1Be_30t8.epml","1Be_322n.epml","1Be_32fe.epml","1Be_34is.epml","1Be_38qs.epml","1Be_3a62.epml","1Be_3e7i.epml","1Be_3era.epml","1Be_3j4l.epml","1Be_8ri3.epml","1Be_8uyu.epml","1Ku_8w3g.epml","1Ku_903f.epml","1Ku_91bx.epml","1Ku_93jr.epml","1Ku_96oz.epml","1Ku_97uj.epml","1Ku_9bjf.epml","1Ku_9do6.epml","1Ku_9e6t.epml","1Ku_9mgu.epml","1Ku_9nk6.epml","1Ku_9ojw.epml","1Ku_9rnu.epml","1Ku_9vyx.epml","1Ku_9yyx.epml","1Ku_9zhk.epml","1Ku_a0t4.epml","1Ku_a6af.epml","1Ku_aa4c.epml","1Ku_acul.epml","1Ku_add8.epml","1Ku_afas.epml","1Ku_agg3.epml","1Ve_4fin.epml","1Ve_4gw1.epml","1Ve_4hbk.epml","1Ve_4k75.epml","1Ve_4mai.epml","1Ve_4mua.epml","1Ve_4mxc.epml","1Ve_4ose.epml","1Ve_4q66.epml","1Ve_4ymf.epml","1Ve_512s.epml","1Ve_52tx.epml","1Ve_57p5.epml","1Ve_58l9.epml","1Ve_5a31.epml","1Ve_5dvr.epml","1Ve_5jtb.epml","1Ve_5kzj.epml","1Ve_5otm.epml","1Ve_5tcy.epml","1Ve_5x4o.epml","1Ve_5ycw.epml","1Ve_6294.epml","1Ve_62rl.epml","1Ve_6a59.epml","1Ve_6bms.epml","1Ve_6dlt.epml","1Ve_6lp9.epml","1Ve_6mnb.epml","1Ve_6u91.epml","1Ve_6wdf.epml","1Ve_70sp.epml","1Ve_710u.epml","1Ve_77z0.epml","1Ve_7btr.epml","1Ve_7c1w.epml","1Ve_7coq.epml","1Ve_7kcl.epml","1Ve_7n23.epml","1Ve_7rr4.epml","1Ve_7s3r.epml","1Ve_7sma.epml","1Ve_7suf.epml","1Ve_7uuo.epml","1Ve_7vev.epml","1Ve_82t3.epml","1Ve_84am.epml","1Ve_85il.epml","1Ve_8a7d.epml","1Ve_8b2j.epml","1Ve_8bao.epml","1Ve_m47b.epml","1Ve_m4y2.epml","1Ve_mzcb.epml"};
	public static List<String> dmlist;

//	public static String dmProblem[] = {
//		"1Be_1y63.epml"
//	};
	public static Set<String> problemModelsSet = new HashSet<String>();

	/**
	 * File names of the search models.
	 */
	public static String sm[] = {"search1.epml","search2.epml","search3.epml","search4.epml","search5.epml","search6.epml","search7.epml","search8.epml","search9.epml","search10.epml"};
	public static List<String> smlist;

	/**
	 * Directory prefix to identify the filenames.
	 */
	public static String prefix = "models/modelpairs/";
	/**
	 * Human judgement of relevance of a document model to a search model.
	 * If (relevance [i,j] == 1), then sm[i] has dm[j] as relevant result.  
	 */
	public static int relevance[][] =	{{0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,1,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,1,0,1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0},
										{0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,1,0,0,0,1,0,0,0,0,1,0,0,0,0,0,0,1,0,0,0,0,1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0},
										{0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0},
										{1,1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0},
										{0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,1,1,0,0,1,0,0,1,0,0,0,1,0,0,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,1,0,0,0},
										{0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,1,0,0,0,0,0,0,1,0,0,0,0,1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0},
										{0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,1,0,0,0,1,0,0,1,0,0,0,1,0,0,0,0,1,0,0,0,0,1,0,0,1,0,0,0,1,0,0,1,1,0,0,0,0,1,0,1,0,0,0},
										{0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,1,0,0,1,0,1,0,0,0,0,0,0,0,0,1,0,0,0,0,1,0,0,0,1,0,0,1,1,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0,1,0,0,0,1,1,0,0,1,0,0,0,1,0,1,0,0,0,0,0,0},
										{0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,1,0,0,0,0,0,0,1,0,0,0,0,1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0},
										{0,1,0,0,0,0,0,0,0,1,1,0,0,1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0}};

	 static {
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
	public static boolean isRelevant(String searchmodel, String docmodel){
		if (problemModelsSet.contains(docmodel))
			return false;
		return relevance[smlist.indexOf(searchmodel)][dmlist.indexOf(docmodel)] == 1;
	}
	
	/**
	 * Returns the number of document models that is relevant to the given search model.
	 * 
	 * @param searchmodel the name of a searchmodel (pre: searchmodel \in sm)
	 * @return the number of document models that is relevant to the given search model.
	 */
	public static int nrRelevant(String searchmodel){
		int nrRelevant = 0;
//		for (int r: relevance[smlist.indexOf(searchmodel)]){
//			nrRelevant += r;
//		}
		for (String dm : dmlist)
			if (isRelevant(searchmodel, dm))
				nrRelevant++;
		
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
	public static double avgprec(String searchmodel, List<String> docmodels){
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
			
			avgPrecisionUpToIncluding += precisionUpToIncluding; 
			nrUpToIncluding++;			
		}

		avgPrecisionUpToIncluding = avgPrecisionUpToIncluding/(1.0*nrRelevant(searchmodel)); 
		
		return avgPrecisionUpToIncluding;
		
	}
	
	public static double precision(String searchmodel, List<String> docmodels){
		
		if (docmodels.isEmpty())
			return 1;
		
		int foundRelevant = 0;
		for (String searchresult: docmodels){
			if(isRelevant(searchmodel,searchresult)){
				foundRelevant+=1;
			}
		}
		
		double precision = (double)foundRelevant/(double)docmodels.size();
		return precision;
	}
	
	public static double recall(String searchmodel, List<String> docmodels){
		
		if (docmodels.isEmpty())
			return 0;
		
		int foundRelevant = 0;
		for (String searchresult: docmodels){
			if(isRelevant(searchmodel,searchresult)){
				foundRelevant+=1;
			}
		}
		
		double recall = (double)foundRelevant/(double)nrRelevant(searchmodel);
		return recall;
		
	}
	
}
