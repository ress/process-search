package de.uni_potsdam.hpi.bpt.qbe.evaluation;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Calculates certain aggregates over a set of collected values for experimental
 * evaluation of any kind.  
 * 
 * @author Matthias Kunze <mtkunze@gmail.com>
 *
 * @param <T> the type of aggregated values, must be a java.lang.Number
 */
public class Aggregate<T extends Number> extends ArrayList<T> implements List<T>, Serializable {

	private static final long serialVersionUID = -9128724712173041680L;
	protected final static Comparator<Number> Comp = new Comparator<Number>() {

		@Override
		public int compare(Number o1, Number o2) {
			return Double.compare(o1.doubleValue(), o2.doubleValue());
		}
	};

	/**
	 * Constructs an empty aggregate list.
	 */
	public Aggregate() {
		super();
	}
	
	/**
	 * Constructs an aggregate list containing the elements of the specified collection, 
	 * in the order they are returned by the collection's iterator.
	 * 
	 * @param c - the collection whose elements are to be placed into this list
	 */
	public Aggregate(Collection<T> c) {
		this.addAll(c);
	}
	
	/**
	 * Get the minimum of all collected values
	 * @return
	 */
	public T min() {
		Collections.sort(this, Comp);
		return this.get(0);
	}
	
	/**
	 * Get the maximum of all collected values
	 * @return
	 */
	public T max() {
		Collections.sort(this, Comp);
		return this.get(this.size()-1);
	}
	
	/**
	 * Get the average value of all collected values
	 * @return
	 */
	public double avg() {
		return this.sum() / (double)this.size();
	}
	
	/**
	 * Get the sum over all elements.
	 * 
	 * @return
	 */
	public  double sum() {
		
		double sum = 0;
		for (T value : this) {
			sum += value.doubleValue();
		}
		return sum;
	}
	
	/**
	 * Get the median value of all collected values, i.e., the value of which 
	 * there exist equally many elements that are lesser as such that are 
	 * greater.
	 * If no such value exists, the average of the adjacent values will be
	 * calculated.
	 *  
	 * @return
	 */
	public double median() {
		return this.quantile(0.5);
	}
	
	/**
	 * get the p-quantile of all collected values, i.e., the value of which 
	 * there exist (p*100)% elements that are lesser and ((1-p*100))% elements
	 * that are greater.
	 * If no such value exists, the p-quantile average of the adjacent values 
	 * will be calculated.
	 *  
	 * @param p the quantile fraction, must be 0 ≤ p ≤ 1
	 * @return
	 */
	public double quantile(double p) {
		
		if (this.size() == 0) {
			throw new IllegalStateException("Quantiles cannot be calculated for empty aggregations.");
		}
		
		if (this.size() == 1) {
			return this.get(0).doubleValue();
		}
		
		if (0 >= p) {
			return this.min().doubleValue();
		}
		
		if (1 <= p) {
			return this.max().doubleValue();
		}
		
		// 0.3-quantile contains 30% of all values
		
		Collections.sort(this, Comp);
		int size = this.size();
		double pos = size * p; 
		Number[] sd = this.toArray(new Number[size]);
		
		if ((int)p == p) {
			return sd[(int)pos].doubleValue();
		}
		else {
			return p*sd[(int)pos].doubleValue() + (1-p)*sd[Math.min((int)pos + 1, size-1)].doubleValue();
		}
	}
	
	/**
	 * Puts data in a map, where the key is each unique value in this collection
	 * and the value is the number of occurrences of this value.
	 * 
	 * @return
	 */
	public Map<T, Integer> cluster() {
		Map<T, Integer> cluster = new HashMap<T, Integer>();
		for (T i : this) {
			if (!cluster.containsKey(i)) {
				cluster.put(i, 1);
			}
			else {
				cluster.put(i, cluster.get(i) + 1);
			}
		}
		return cluster;
	}
	
	/**
	 * Calculate the sample variance of collected values.
	 * @see http://en.wikipedia.org/wiki/Variance#Population_variance_and_sample_variance
	 * 
	 * @return
	 */
	public double variance() {
		
		double avg = this.avg();
		double var = 0;
		
		for (T e : this) {
			var += Math.pow(avg - e.doubleValue(), 2);
		}
		
		return 1.0/(double)(this.size()-1) * var;
	}
	
	/**
	 * Returns the character position of box plot for a certain value
	 * 
	 * @param min minimum of the logical boxplot scale (same domain as value)
	 * @param max maximum of the logical boxplot scale (same domain as value) 
	 * @param value current value to be plotted
	 * @return
	 */
	private double getBoxPlotPrintPos(double min, double max, double value) {
		int width = 100; // width of the visual scale (console line)
		
		if (min < max) {
			if (value <= min) {
				return 0;
			}
			if (value >= max) {
				return width;
			}			
			return (value-min)/(max-min) * width;
		}
		return -1;
	}
	
	/**
	 * Print BoxPlot of current values on standard out.
	 * @see
	 * 
	 * @param scale_min minimum to be plotted
	 * @param scale_max maximum to be plotted
	 */
	public Object[] printBoxPlot(double scale_min, double scale_max) {
		return this.printBoxPlot(scale_min, scale_max, 1.5);
	}
	
	/**
	 * Print BoxPlot of current values on standard out.
	 * @see http://en.wikipedia.org/wiki/Box_plot
	 * 
	 * @param scale_min minimum to be plotted
	 * @param scale_max maximum to be plotted
	 * @param iqrFactor factor to determine lower and upper whiskers.
	 */
	public Object[] printBoxPlot(double scale_min, double scale_max, double iqrFactor) {
		double lq = this.quantile(0.25);
		double med = this.median(); 
		double uq = this.quantile(0.75);
		double min = this.min().doubleValue();
		double max = this.max().doubleValue();
		double lwisk = min;
		double uwisk = max;
		double iqr = Math.abs(uq-lq);
		
		// correct lower wisker
		if (lwisk < lq - iqrFactor*iqr) {
			Collections.sort(this, Comp);
			for (int i=0; i<this.size(); i++) {
				if (Comp.compare(this.get(i),lq - iqrFactor*iqr) >= 0) {
					lwisk = this.get(i).doubleValue();
					break;
				}
			}
		}
		
		// correct upper wisker
		if (uwisk > uq + iqrFactor*iqr) {
			Collections.sort(this, Comp);
			for (int i=this.size()-1; i<=0; i--) {
				if (Comp.compare(this.get(i),uq + iqrFactor*iqr) <= 0) {
					uwisk = this.get(i).doubleValue();
					break;
				}
			}
		}
		
		int i=0;
	
		// print left space
		for (; i < this.getBoxPlotPrintPos(scale_min, scale_max, min);i++) {
			System.out.print(" ");
		}
		
		// print min
		if (min < lwisk && this.getBoxPlotPrintPos(scale_min, scale_max, min) > 0) {
			System.out.print(".");
			i++;
		}
				
		// print space
		for (;i<this.getBoxPlotPrintPos(scale_min, scale_max, lwisk);i++) {
			System.out.print(" ");
		}
		
		// print lower wisker
		if (this.getBoxPlotPrintPos(scale_min, scale_max, lwisk) > 0) {
			System.out.print("+");
			i++;
		}
		
		// print antenna
		for (;i<this.getBoxPlotPrintPos(scale_min, scale_max, lq);i++) {
			System.out.print("-");
		}
		
		
		// print lower quantile box
		for (;i<this.getBoxPlotPrintPos(scale_min, scale_max, med);i++) {
			System.out.print("[");
		}
		
		// print median
		if (this.getBoxPlotPrintPos(scale_min, scale_max, med) > 0) {
			System.out.print("|");
			i++;
		}
		
		// print upper quantile box
		for (;i<this.getBoxPlotPrintPos(scale_min, scale_max, uq);i++) {
			System.out.print("]");
		}
		
		// print antenna
		for (;i<this.getBoxPlotPrintPos(scale_min, scale_max, uwisk);i++) {
			System.out.print("-");
		}

		// print upper wisker
		if (i <= this.getBoxPlotPrintPos(scale_min, scale_max, uwisk)) {
			System.out.print("+");
			i++;
		}
		
		// print space
		if (max > uwisk && i < this.getBoxPlotPrintPos(scale_min, scale_max, max)) {
			for (;i<this.getBoxPlotPrintPos(scale_min, scale_max, max);i++) {
				System.out.print(" ");
			}
			// print max
			System.out.print(".");
		}
		System.out.println();
		
		return new Object[]{
				"min", min,
				"lwisk", lwisk,
				"lq",lq,
				"med",med,
				"uq",uq,
				"uwisk",uwisk,
				"max",max
		};
	}
	
	
	/**
	 * Rounds a double with precision 0.000.
	 * 
	 * @param d the number to round
	 * @return
	 */
	public static double r(double d) {
		return r(d,3);
	}
	
	/**
	 * Rounds a double with precision 1/(10^prec), i.e., prec positions behind the decimal mark.
	 * 
	 * @param d the number to round
	 * @param prec the precision
	 * @return
	 */
	public static double r(double d, int prec) {
		double pow = Math.pow(10, prec);
		return Math.round(d*pow)/pow;
	}
		
	/**
	 * A simple example.
	 * 
	 * @param margs
	 */
	public static void main(String[] margs) {

		Aggregate<Integer> a = new Aggregate<Integer>();
		
		for (int i=0; i<=99;i++) {
			//a.add((int)(Math.random()*max)+1);
			a.add(i);
		}
		
		System.out.println("size: " + a.size());
		System.out.println("min: " + a.min());
		System.out.println("max: " + a.max());
		System.out.println("avg: " + Aggregate.r(a.avg(),4));
		System.out.println("median: " + Aggregate.r(a.median(),4));
		System.out.println("quartile: " + Aggregate.r(a.quantile(0.25),4));
		System.out.println("quantile(0.9): " + Aggregate.r(a.quantile(0.9),4));
		System.out.println("variance: " + Aggregate.r(a.variance(),4));
		System.out.println("std deviation: " + Aggregate.r(Math.sqrt(a.variance()),4));
		
		a.printBoxPlot(0,100);
		
	}
	
}
