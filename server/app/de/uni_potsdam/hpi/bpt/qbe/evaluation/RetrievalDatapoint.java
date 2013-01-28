package de.uni_potsdam.hpi.bpt.qbe.evaluation;

public interface RetrievalDatapoint {
	
	// shall be instantiated with a query and a document model
	
	/**
	 * returns whether the given document is relevant for the given query
	 * @return
	 */
	public boolean isRelevant();
	public double getRanking();
}
