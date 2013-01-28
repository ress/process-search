package de.uni_potsdam.hpi.bpt.qbe.experiment.effectiveness;

import java.io.PrintStream;
import java.util.Collection;
import java.util.Comparator;
import java.util.HashMap;
import java.util.Map;
import java.util.Map.Entry;
import java.util.logging.Logger;

import org.jbpt.alignment.NodeAlignment;
import org.jbpt.petri.NetSystem;
import org.jbpt.sim.Closeness;

import de.uni_potsdam.hpi.bpt.qbe.evaluation.Aggregate;
import de.uni_potsdam.hpi.bpt.qbe.evaluation.RetrievalDatapoint;
import de.uni_potsdam.hpi.bpt.qbe.evaluation.RetrievalEffectiveness;
import de.uni_potsdam.hpi.bpt.qbe.experiment.Experiment;

public abstract class EffectivenessExperiment<T extends RetrievalDatapoint> extends Experiment {
	
	protected abstract Collection<String> getQueries();
	protected abstract Collection<String> getDocumentsForQuery(String query);
	protected abstract Collection<String> getRelevantDocumentsForQuery(String query);
	protected abstract Comparator<T>      getComparator();
	protected abstract T getDatapoint(String query, String document, double sim);
	
	protected PrintStream out = System.out;
	
	protected void run() {
		this.run(new Aggregate<Double>(), new Aggregate<Double>(), new Aggregate<Double>(), new Aggregate<Double>());
	}

	
	protected void run(Aggregate<Double> precAgg, Aggregate<Double> recAgg, Aggregate<Double> avgPrecAgg, Aggregate<Double> fMeasure) {
		
		Logger.getGlobal().info("Start Effectiveness Experiment with SED threshold for correspondences SED=" + NodeAlignment.getSED_THRESHOLD());
		
		Map<String, Double[]> rankingData = new HashMap<String, Double[]>(); 
		
		for (String q : this.getQueries()) {
			
			RetrievalEffectiveness<T> effectiveness = new RetrievalEffectiveness<T>(
					this.getRelevantDocumentsForQuery(q).size(), 
					this.getComparator());
			
			NetSystem qNet = this.loadModel(q);
			if (null == qNet) {
				Logger.getGlobal().warning("Query "+q+" cannot be loaded. Skipped! " );
				continue;
			}
			
			for (String d : this.getDocumentsForQuery(q)) {
				NetSystem dNet = this.loadModel(d);
				if (null == dNet) {
					Logger.getGlobal().warning("Document "+d+" cannot be loaded. Skipped! " );
					continue;
				}
				
				double c = Closeness.compute(qNet,dNet);
				T dp = getDatapoint(q, d, c);
				
				rankingData.put(q+"?>"+d, new Double[]{c, dp.getRanking()});
				
				if (c > 0) {
					effectiveness.add(dp);
				}
				
				this.out.println("  " + q + "?>" + d + " c=" + (float) Math.round(c*100)/100 + " | is relevant: " + (dp.isRelevant() ? "yes":"no"));
			}
			
			this.out.println("\t precision     = " + effectiveness.precision());
			this.out.println("\t recall        = " + effectiveness.recall());
			this.out.println("\t avg precision = " + effectiveness.avgPrecision());
			this.out.println("\t f-measure     = " + effectiveness.fMeasure());
			
			
			precAgg.add(effectiveness.precision());
			recAgg.add(effectiveness.recall());
			avgPrecAgg.add(effectiveness.avgPrecision());
			fMeasure.add(effectiveness.fMeasure());
		}
		
		this.out.println("Aggregate Statistics");
		this.out.println("\t mean precision     = " + precAgg.avg());
		this.out.println("\t mean recall        = " + recAgg.avg());
		this.out.println("\t mean avg precision = " + avgPrecAgg.avg());
		this.out.println("\t mean f-measure = " + fMeasure.avg());
		this.out.println();
		
		this.out.println("Ranking Data");
		this.out.println("pair ; closeness ; human ranking (1 is best)");
		for (Entry<String, Double[]> point : rankingData.entrySet()) {
			this.out.println(point.getKey()+";"+point.getValue()[0]+";"+point.getValue()[1]);
		}
	}
}
