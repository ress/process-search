package models.simsearch.metrics;

import models.simsearch.ExperimentMetric;
import models.simsearch.IDatapoint;
import nl.tue.ieis.is.similarity.algos.DistanceAlgo;
import nl.tue.ieis.is.similarity.algos.GraphEditDistance;
import nl.tue.ieis.is.similarity.graph.SimpleGraph;

/**
 * Created with IntelliJ IDEA.
 * User: bart
 * Date: 07.02.13
 * Time: 21:22
 * To change this template use File | Settings | File Templates.
 */
public class GED extends ExperimentMetric {

    DistanceAlgo ged = new GraphEditDistance(); //Greedy
//
//		public GED() {
//			if (this.ged instanceof GraphEditDistanceGreedy) {
//				System.out.println("GedExperiment uses GraphEditDistanceGreedy with Remco's alignment");
//
//				Object[] weights = {
//						"vweight", 0.1, // wskin
//						"sweight", 0.9, // wsubn
//						"eweight", 0.4,  // wskipe
//						"ledcutoff", 1.0 // min string edit similarity
//				};
//				ged.setWeight(weights);
//			} else {
//				System.out.println("GedExperiment uses GraphEditDistance with Matthias' alignment");
//			}
//		}

    public double innerDistance(IDatapoint sg1, IDatapoint sg2) {
        return ged.compute((SimpleGraph) sg1, (SimpleGraph) sg2);
    }
}