package de.uni_potsdam.hpi.bpt.qbe.experiment.effectiveness;

import java.io.File;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;

import org.jbpt.alignment.NodeAlignment;
import org.jbpt.petri.NetSystem;
import org.jbpt.petri.io.WoflanSerializer;

import de.uni_potsdam.hpi.bpt.qbe.evaluation.Aggregate;

/**
 * Experiment to measure matching quality of behavior inclusion
 * @author matthiaskunze
 *
 */
public class Hpi30Experiment extends EffectivenessExperiment<Hpi30HumanAssessment> {

	public Hpi30Experiment() {
		Logger.getGlobal().setLevel(Level.FINE);
	}

	@Override
	protected Collection<String> getQueries() {
		return Hpi30HumanAssessment.getQueries();
	}

	@Override
	protected Collection<String> getDocumentsForQuery(String query) {
		return Hpi30HumanAssessment.getModelsForQuery(query, false);
	}

	@Override
	protected Collection<String> getRelevantDocumentsForQuery(String query) {
		return Hpi30HumanAssessment.getModelsForQuery(query, true);
	}

	@Override
	protected Comparator<Hpi30HumanAssessment> getComparator() {
		return Hpi30HumanAssessment.getComparator();
	}

	@Override
	protected Hpi30HumanAssessment getDatapoint(String query, String document, double closeness) {
		return new Hpi30HumanAssessment(query, document, closeness);
	}

	@Override 
	public NetSystem loadModel(String name) {
		
		String filename = null;
		
		// Search for a file that matches the filename
		if (4 == name.length()) {
			// this is a document model
			File dir = new File(Hpi30HumanAssessment.DOCUMENT_PATH);
			for (String f : dir.list()) {
				if (f.toLowerCase().contains(name.toLowerCase())) {
					filename = dir.getAbsolutePath() + File.separator + f;
				}
			}
		}
		else {
			// then it must be a query model
			File dir = new File(Hpi30HumanAssessment.QUERY_PATH);
			filename = dir.getAbsolutePath() + File.separator + name + ".tpn";
		}
		
		File file = new File(filename);
		
		if (!file.exists()) {
			Logger.getGlobal().warning("File not found :" + filename);
			
			return null;
		}
		
		NetSystem net = WoflanSerializer.parse(file);
		net.setName(filename);
		
		return net;
	}

	public static void main(String[] args) {
		
		int numPoints = 20;
		
		double[] seda = new double[numPoints + 1];
		for (int i=0; i<=numPoints; i++) {
			seda[i] = i * 1/(float)numPoints;
		}
		
		List<Double[]> data = new ArrayList<Double[]>();
		
		for (double sed : seda) {
			NodeAlignment.setSED_THRESHOLD(sed);
			
			Aggregate<Double> prec = new Aggregate<Double>();
			Aggregate<Double> rec = new Aggregate<Double>();
			Aggregate<Double> avgPrec = new Aggregate<Double>();
			Aggregate<Double> fMeasure = new Aggregate<Double>();
			
			Hpi30Experiment exp = new Hpi30Experiment();
			exp.run(prec, rec, avgPrec, fMeasure);
			
			data.add(new Double[]{NodeAlignment.getSED_THRESHOLD(), prec.avg(), rec.avg(), avgPrec.avg(), fMeasure.avg()});
		}
		
		Logger.getGlobal().info("Results over varying SED threshold");
		
		System.out.println("SED;mean precision; mean recall; mean avg precision; mean f-measure");
		for (Double[] row : data) {
			for (Double v : row) {
				System.out.print(v+";");
			}
			System.out.println();
		}
	}

}
