package de.uni_potsdam.hpi.bpt.qbe.evaluation;

import java.text.DecimalFormat;
import java.util.ArrayList;
import java.util.List;

/**
 * A simple stop watch that allows to capture as many laps as desired.
 * Uses nanoseconds for precision, but based on the system it may have an 
 * accuracy of coarser granularity.
 * 
 * @author Matthias Kunze
 *
 */
public class StopWatch {

	protected List<Long> laps = new ArrayList<Long>();
	protected Long current = null;
	protected Aggregate<Long> _statistics = null;
	
	/**
	 * Start a new watch.
	 * @throws RuntimeException if this stop watch already runs.
	 */
	public synchronized void start() {
		if (null != this.current) {
			throw new RuntimeException("Cannot start a running stopwatch");
		}
		this._statistics = null;
		
		this.current = System.nanoTime();
	}
	
	/**
	 * Stop a running watch.
	 * 
	 * @return time the current watch was measuring
	 * @throws RuntimeException if no stop watch was running
	 */
	public synchronized Long stop() {
		long stop = System.nanoTime();
		
		if (null == this.current) {
			throw new RuntimeException("Cannot stop. No watch was running.");
		}
		this._statistics = null;
		
		laps.add(stop - this.current);
		this.current = null;
		
		return last();
	}
	
	/**
	 * Returns a stopped time.
	 * 
	 * @param index zero based index to obtain a measured time, negative counts
	 *  from the end of measurement, i.e., get(-2) will return the second last time measured
	 * @return
	 */
	public synchronized Long get(int index) {
		if (Math.abs(index) > this.laps.size()) {
			return null;
		}
		
		if (index >= 0) {
			return this.laps.get(index);
		}
		else {
			return this.laps.get(this.laps.size() + index);
		}
	}
	
	/**
	 * Get the last measured time.
	 * 
	 * @return
	 */
	public Long last() {
		return get(-1);
	}
	
	/**
	 * Create an Aggregate from the measured times to obtain min, max, median, etc.
	 * Stores statistics until a new lap is started or stopped. 
	 * (Can be called multiple times in sequence without additional computation effort)
	 *
	 * @return
	 */
	public synchronized Aggregate<Long> statistics() {
		if (null == this._statistics) {
			this._statistics = new Aggregate<Long>();
			this._statistics.addAll(this.laps); 
		}
 
		return this._statistics;
	}
	
	/**
	 * Formats nanoseconds into readable milliseconds
	 * 
	 * @param timeNs
	 * @return
	 */
	public static String formatMs(double timeNs) {
		return df.format((timeNs)/(1000*1000))+"ms";
	}
	protected final static DecimalFormat df = new DecimalFormat(",###.##");
	
	
	/**
	 * @param args
	 * @throws InterruptedException 
	 */
	public static void main(String[] args) throws InterruptedException {
		System.out.println("== Stopwatch Example ==");
		StopWatch w = new StopWatch();
		for (int i=0; i<10; i++) {
			w.start();
			Thread.sleep((int)(1000*Math.random()));
			System.out.println(i+": "+formatMs(w.stop()));
		}
		
		System.out.println("\nmedian time: " + formatMs(w.statistics().median()));

	}

}
