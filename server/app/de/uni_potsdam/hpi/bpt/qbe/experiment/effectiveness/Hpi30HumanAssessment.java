package de.uni_potsdam.hpi.bpt.qbe.experiment.effectiveness;

import java.io.File;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.logging.Logger;

import de.uni_potsdam.hpi.bpt.qbe.evaluation.RetrievalDatapoint;

public class Hpi30HumanAssessment implements RetrievalDatapoint {

	
	protected String query;
	protected String document;
	protected double closeness;
	
	public Hpi30HumanAssessment(String query, String document, double closeness) {
		this.query = query;
		this.document = document;
		this.closeness = closeness;
	}
	
	protected static double getRanking(String query, String document) {
		int q = queries.indexOf(query);
		int d = documents.indexOf(document);
		
		if (q < 0 || d < 0) {
			throw new RuntimeException("query or document not found: q="+query+" d="+document);
		}
		
		return ranking[q][d];
	}

	public static Comparator<Hpi30HumanAssessment> getComparator(){
		return new Comparator<Hpi30HumanAssessment>() {
			
			@Override
			public int compare(Hpi30HumanAssessment o1, Hpi30HumanAssessment o2) {
				return Double.compare(o1.closeness, o2.closeness);
			}
		};
	}
	
	@Override
	public boolean isRelevant() {
		return getRanking(this.query, this.document) > 0;
	}
	
	@Override
	public double getRanking() {
		return getRanking(this.query, this.document);
	}

	/* *****************************************************************************************************************************************
	 * evaluation data 
	 */
	
	public static final String QUERY_PATH = "/Users/matthiaskunze/Documents/paperwork/submissions/2012_TSE_rejected/implementation/comin2011/models" + File.separator + "tpn_bpm12_queries" + File.separator;
	public static final String DOCUMENT_PATH = "/Users/matthiaskunze/Documents/paperwork/submissions/2012_TSE_rejected/implementation/comin2011/models" + File.separator + "tpn_models_no_events" + File.separator;
	protected static final List<String> queries = new ArrayList<String>(Arrays.asList(new String[]{ "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"}));
	protected static final List<String> documents = new ArrayList<String>(Arrays.asList(new String[]{"204A", "22V7", "2AZE", "2FT2", "2ORK", "2RXU", "2TNC", "30T8", "322N", "32FE", "34IS", "38QS", "3A62", "3J4L", "4GW1", "4Q66", "5KZJ", "5X4O", "5YCW", "6294", "6BMS", "6DLT", "6U91", "6WDF", "710U", "77Z0", "7N23", "84AM", "85IL", "A6AF", "CH10", "RCH5", "RCH6", "RCH9"}));
	
	/*
	 * Human rankings of models
	 *  1  ... best match
	 *  n+ ... worst match
	 *  0  ... no match
	 *  -1 ... not tested
	 * 
	 */
	protected static final double[][] ranking = new double[][]{
		{-1, -1, -1, 5, 0, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 2.14, -1, -1, -1, 3.4, 0, -1, -1, -1, 2.4, 0, 0, -1, -1, 6, -1, 1.6, -1, -1},
		{-1, 0, 1, 0, 0, 0, -1, 0, -1, -1, 1, -1, -1, 1, -1, 0, -1, -1, -1, -1, -1, -1, -1, 1.2, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1},
		{-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 0, -1, -1, 0, 0, 3.8, -1, 0, -1, 2.71, -1, -1, -1, -1, 2.43, -1, -1, -1, 0, 4.8, -1, 1, -1, -1},
		{3.43, -1, -1, -1, -1, 5, 1.29, -1, 5, -1, -1, -1, 1.29, -1, -1, -1, -1, -1, -1, -1, -1, 0, 2.29, -1, -1, -1, -1, -1, -1, -1, 3, -1, 0, 0},
		{-1, -1, 0, 1.57, -1, -1, -1, 2.29, -1, -1, -1, 2.57, -1, 0, -1, -1, 0, -1, 0, -1, 0, -1, -1, 0, -1, -1, -1, 0, -1, -1, -1, -1, -1, -1},
		{-1, 1, -1, -1, 0, -1, 0, -1, -1, 1, 0, -1, -1, -1, 0, -1, -1, 2.14, -1, -1, 2.86, -1, 0, -1, -1, -1, -1, 2.14, -1, -1, -1, -1, -1, -1},
		{-1, -1, -1, -1, -1, -1, -1, -1, -1, 0, -1, -1, -1, -1, -1, -1, 1.86, -1, 1.43, -1, -1, 3.17, -1, -1, 0, 4.43, 6.14, -1, 6.14, -1, -1, -1, 3.71, 5.43},
		{0, -1, -1, -1, -1, -1, -1, -1, 0, -1, -1, -1, -1, -1, -1, -1, 1.43, -1, 2.14, -1, -1, 4.8, -1, -1, -1, 3.43, 4.86, -1, 5, -1, -1, -1, 2.14, 7},
		{1.86, -1, -1, -1, -1, 5, 4, 0, 5, -1, -1, 0, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 1.14, 0, -1, -1, -1, -1, -1, -1, 3, -1, -1, -1},
		{-1, 1.71, 0, -1, -1, -1, -1, -1, -1, 1.71, -1, 0, -1, -1, 0, -1, -1, 1.29, -1, 0, -1, -1, -1, -1, -1, -1, -1, 1.29, -1, 0, -1, 0, -1, -1},
		};
	
	public final static String getModelpath() {
		return DOCUMENT_PATH;
	}
	
	/**
	 * Returns the list of queries
	 * 
	 * @return
	 */
	public final static Collection<String> getQueries() {
		return queries;
	}

	/**
	 * Returns the set of tested models for given query
	 * 
	 * @param query
	 * @return
	 */
	public static Collection<String> getModelsForQuery(String query, boolean relevantOnly) {
		int i = queries.indexOf(query);
		if (-1 == i) {
			
			Logger.getGlobal().warning("query not found " + query);
			
			return null;
		}
		
		Set<String> result = new HashSet<String>();
		for (int j=0; j<ranking[i].length;j++) {
			if ((relevantOnly && ranking[i][j] > 0) || (!relevantOnly && ranking[i][j] >= 0)) {
				result.add(documents.get(j));
			}
		}
		return result;
	}
	
}
