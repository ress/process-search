package de.uni_potsdam.hpi.bpt.qbe.experiment;

import java.io.File;
import java.io.IOException;
import java.util.Arrays;
import java.util.Collection;
import java.util.HashSet;
import java.util.Set;
import java.util.logging.Logger;

import org.apache.lucene.analysis.WhitespaceAnalyzer;
import org.apache.lucene.index.CorruptIndexException;
import org.apache.lucene.util.Version;
import org.jbpt.bp.KSuccessorRelation;
import org.jbpt.petri.NetSystem;
import org.jbpt.petri.Node;

import de.uni_potsdam.hpi.bpt.qbe.evaluation.Aggregate;
import de.uni_potsdam.hpi.bpt.qbe.evaluation.StopWatch;
import de.uni_potsdam.hpi.bpt.qbe.index.RelationAnalyzer;
import de.uni_potsdam.hpi.bpt.qbe.index.RelationCacheRecord;
import de.uni_potsdam.hpi.bpt.qbe.index.RelationInvertedIndex;

import matching.Matches;

public class Remcos100IndexExperiment extends Experiment {

	
	protected static String NO_EVENTS = "_no_events";
	
	Collection<NetSystem> documents = new HashSet<NetSystem>();
	Collection<NetSystem> queries = new HashSet<NetSystem>();
	RelationInvertedIndex index = new RelationInvertedIndex();
	
	public Remcos100IndexExperiment() throws IOException {
		
		MODEL_PATH = "/Users/matthiaskunze/Documents/paperwork/submissions/2012_TSE_rejected/implementation/comin2011/models/tpn_models_no_events";
		
		File dir = new File(MODEL_PATH);
		if (!dir.exists() || !dir.isDirectory()) {
			throw new IOException("Model path is not a valid directory: " + MODEL_PATH);
		}
				
		Collection<String> d = Matches.dmlist;
		Collection<String> q = Matches.smlist;
		
		//d = q = Arrays.asList(new String[]{"search10.epml"});
		
		d = q = Arrays.asList(dir.list());
		
		Collection<String> all = new HashSet<String>();
		all.addAll(d);
		all.addAll(q);
		
		StopWatch watch = new StopWatch();
		watch.start();
		
		for (String name : all) {
			NetSystem model = loadModel(name); 
			
			// exclude models if they cannot be loaded
			if (null != model) {
				// add to query list
				if (q.contains(name)) {
					this.queries.add(model);
				}
				
				// add to document list
				if (d.contains(name)) {
					this.documents.add(model);
					this.index.addNet(model);
				}
			}
		}
		
		watch.stop();
		Logger.getAnonymousLogger().info("Loading " + this.documents.size() + " models and adding them to index took " + StopWatch.formatMs(watch.last()));
	}
	
	public void run() throws CorruptIndexException, IOException {
		
		StopWatch watch = new StopWatch();
		
		int emptyQueries = 0;
		
		for (NetSystem query : this.queries) {
			watch.start();
			Set<RelationCacheRecord> result = index.search(query);
			
			int querysize = RelationAnalyzer.parseKeywords(new WhitespaceAnalyzer(Version.LUCENE_36), RelationAnalyzer.extractTokens(new KSuccessorRelation<NetSystem, Node>(query, 1))).size();
			
			if (0 == querysize) {
				emptyQueries ++;
			}
			
			// puts an error out if unexpectedly the result size is empty
			// this is expected for queries that have an empty relation set due to helper transitions 
			if (result.size() < 1 && querysize > 0) {
				Logger.getAnonymousLogger().warning("Invalid result for " + query.getName());
			}
			watch.stop();
		}
		
		Aggregate<Long> stats = watch.statistics();
		
		System.out.println("Querying performance statistics for " + stats.size() + " queries, of which " + emptyQueries + " were empty");
		System.out.println(
				"\tmin: " + StopWatch.formatMs(stats.min())    + "\n" +
				"\tavg: " + StopWatch.formatMs(stats.avg())    + "\n" +
				"\tmed: " + StopWatch.formatMs(stats.median()) + "\n" +
				"\tmax: " + StopWatch.formatMs(stats.max())    + "\n");
		
	}
	
	public static void main(String[] args) throws IOException {
		Remcos100IndexExperiment exp = new Remcos100IndexExperiment();
		exp.run();
	}
}
