package de.uni_potsdam.hpi.bpt.qbe.evaluation;

import java.util.Collections;
import java.util.Comparator;
import java.util.LinkedList;
import java.util.List;
import java.util.logging.Logger;

public class RetrievalEffectiveness<T extends RetrievalDatapoint> extends LinkedList<T> implements List<T> {

	private static final long serialVersionUID = 5322382330632546886L;
	
	protected int numberOfRelevant = -1;
	protected Comparator<T> comparator = null;

	/**
	 * Constructor for search result that is already ordered.
	 * Effectiveness measures that require ordering, avgPrecision, rPreciscion, will use the insertion order  
	 * 
	 * @param numberOfRelevant
	 */
	public RetrievalEffectiveness(int numberOfRelevant) {
		this.numberOfRelevant = numberOfRelevant;
	}
	
	/**
	 * Constructor for search results that is not ordered yet. 
	 * Effectiveness measures that require ordering, avgPRecision, rPrescision, will sort the list before calculation.
	 * 
	 * @param numberOfRelevant
	 * @param comparator A comparator to order the search result. 
	 */
	public RetrievalEffectiveness(int numberOfRelevant, Comparator<T> comparator) {
		this(numberOfRelevant);
		
		if (null == comparator) {
			throw new IllegalArgumentException("Comparator must not be null");
		}
		this.comparator = Collections.reverseOrder(comparator);
	}
	
	/**
	 * Sorts the collection, iff comparator is given.
	 */
	protected void sort() {
		if (null != this.comparator) {
			Collections.sort(this, this.comparator);
		}
	}
	
	
	/**
	 * Computes, the number of data points found that are relevant.
	 * @return
	 */
	public int foundRelevant() {
		int number = 0;
		for (T c : this) {
			if (c.isRelevant()) {
				number++;
			}
		}
		return number;
	}
		
	/**
	 * Computes the precision, i.e., the ratio found data points that are relevant. 
	 * p = |relevant data points found|/|size of the result set| (How many hits were targets?)
	 *  
	 * @return
	 */
	public double precision() {
		if (0 == this.numberOfRelevant || 0 == this.size()) {
			return 1;
		}
				
		return this.foundRelevant()/(double)this.size();
	}
	
	/**
	 * Computes the precision for the first k data points.
	 * 
	 * @param k
	 * @return
	 */
	public double precision(int k) {
		assert k <= this.size() : "Cannot calculate precision for subset larger than search result";
		
		if (k == this.size()) {
			return this.precision();
		}
		
		RetrievalEffectiveness<T> list = new RetrievalEffectiveness<T>(this.numberOfRelevant);
		this.sort();
		
		for (T c : this) {
			list.add(c);
			if (--k == 0) {
				break;
			}
		}
		
		return list.precision();
	}
	
	/**
	 * Computes the precision after r documents have been found, where r is the number of relevant documents.
	 * @return
	 */
	public double rPrecision() {
		return this.precision(this.numberOfRelevant);
	}
	
	/**
	 * Computes the average precision, i.e., the average of each precision, calculated every time a relevant data point was found.
	 * 
	 * @return
	 */
	public double avgPrecision() {
		if (0 == this.size()) {
			return 1;
		}
		
		this.sort();
		
		int relevant = 0;
		int count = 0;
		double aggPrec = 0;
		
		for (T c : this) {
			relevant += c.isRelevant() ? 1 : 0;
			count ++;
			
			double prec = relevant / (double) count;
			aggPrec += c.isRelevant() ? prec : 0;
		}
		
		return aggPrec / (double) this.numberOfRelevant;
	}
	
	/**
	 * Computes the precision for a given recall value.
	 * @param recall recall level to base the precision upon, must be within [0,1]
	 * @return
	 */
	public double precisionAtRecall(double recall) {
		assert 0 <= recall && recall <= 1 : "Recall must be within [0,1], is " + recall;
		
		if (0 == recall || 0 == this.size()) {
			return 1;
		}
		
		this.sort();
		
		int relevant = 0;
		int count = 0;
		
		for (T c : this) {
			relevant += c.isRelevant() ? 1 : 0;
			count ++;
			
			if (relevant/(double)this.numberOfRelevant >= recall) {
				return relevant/(double)count; 
			}
		}
		
		// if recall level cannot be reached, it would have a precision of 0
		return 0;
	}
	
	/**
	 * Computes the recall, i.e., the ratio of relevant data points that were found.
	 * r = |relevant data points found|/|relevant data points expected| (How many targets were hits?)
	 * 
	 * @return
	 */
	public double recall() {
		if (0 == this.size()) {
			return 0;
		}
		
		return this.foundRelevant()/(double)this.numberOfRelevant;
	}
	
	/**
	 * Measures the accuracy (or effectiveness) of retrieval, which is the harmonic mean of precision and recall.
	 * @return
	 */
	public double fMeasure() {
		return this.fMeasure(1);
	}
	
	/**
	 * F_β measures the effectiveness of retrieval with respect to a user who attaches β times as much importance to recall as precision 
	 * @param beta
	 * @return
	 */
	public double fMeasure(double beta) {
		double precision = this.precision();
		double recall = this.recall();
		
		return (1+beta)*(precision*recall)/(beta*precision + recall);
	}
}
