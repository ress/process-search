package de.uni_potsdam.hpi.bpt.qbe.experiment.efficiency;

import java.io.IOException;
import java.io.PrintStream;
import java.util.Collection;
import java.util.Date;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.logging.Logger;

import org.apache.lucene.index.CorruptIndexException;
import org.jbpt.bp.KSuccessorRelation;
import org.jbpt.bp.MinimalKSuccessorRelation;
import org.jbpt.bp.OneSuccessorRelation;
import org.jbpt.petri.NetSystem;
import org.jbpt.petri.Node;
import org.jbpt.sim.Closeness;
import org.jbpt.sim.SuccessorCloseness;

import de.uni_potsdam.hpi.bpt.qbe.evaluation.Aggregate;
import de.uni_potsdam.hpi.bpt.qbe.evaluation.StopWatch;
import de.uni_potsdam.hpi.bpt.qbe.experiment.Experiment;
import de.uni_potsdam.hpi.bpt.qbe.index.RelationCache;
import de.uni_potsdam.hpi.bpt.qbe.index.RelationCacheRecord;
import de.uni_potsdam.hpi.bpt.qbe.index.RelationInvertedIndex;

public abstract class EfficiencyExperiment extends Experiment {
	
	protected PrintStream out = System.out;
	protected int minNumberOfDatapoints = 50;
	protected int PAUSE = 5;// time in seconds to rest after inserting stuff into the index
	protected final String SEP = ";";
	
	protected List<String> documents;
	protected List<String> queries;
	protected RelationInvertedIndex index = null;
	
	protected abstract Collection<String> getQueries();
	protected abstract Collection<String> getDocuments();

    public void initialize() throws IOException, InterruptedException {
        this.documents = new LinkedList<String>(this.getDocuments());
        //this.queries = new LinkedList<String>(this.getQueries());

        int interval = this.getDocuments().size() / this.minNumberOfDatapoints;
        if (0 == interval) {interval = 1;}

        if (null == this.index) {this.index = new RelationInvertedIndex();}

        Map<String, MinimalKSuccessorRelation<NetSystem, Node>> documentCache = new HashMap<String, MinimalKSuccessorRelation<NetSystem,Node>>();
        Map<String, OneSuccessorRelation<NetSystem, Node>> queryCache = new HashMap<String, OneSuccessorRelation<NetSystem,Node>>();

        // Step 1 -- load all models, compute relations and add them to the cache
        System.out.print(this.getClass().getName() + "Start Efficiency Experiment");


        // \nLoading models ");

        for (String d : new LinkedList<String>(this.documents)) {

            try {
                NetSystem net = this.loadModel(d);
                if (null == net) {

                    // if a model cannot be loaded, nevermind, but remove it from the collection
                    Logger.getGlobal().warning("Unable to load model: " + d +". Skipped.");
                    this.documents.remove(d);
                    continue;
                }
                System.out.print(".");

                this.index.addNet(net);
            } catch (Exception e) {
                Logger.getGlobal().warning("Unable to load model and parse model: " + d + ". Skipped");
            }
        }
        System.out.println("Loaded " + documentCache.size() + " models.");
    }

	public void run() throws IOException, InterruptedException {
		
		this.documents = new LinkedList<String>(this.getDocuments());
		this.queries = new LinkedList<String>(this.getQueries());
		
		int interval = this.getDocuments().size() / this.minNumberOfDatapoints;
		if (0 == interval) {interval = 1;}

		if (null == this.index) {this.index = new RelationInvertedIndex();}
		
		Aggregate<Long> seqSearchTime = new Aggregate<>();
		Aggregate<Long> effSearchTime = new Aggregate<>();
		
		
		  
		Map<String, MinimalKSuccessorRelation<NetSystem, Node>> documentCache = new HashMap<String, MinimalKSuccessorRelation<NetSystem,Node>>();
		Map<String, OneSuccessorRelation<NetSystem, Node>> queryCache = new HashMap<String, OneSuccessorRelation<NetSystem,Node>>();
		
		// Step 1 -- load all models, compute relations and add them to the cache
		System.out.print(this.getClass().getName() + "Start Efficiency Experiment"); 
		
		
		// \nLoading models ");
		
		for (String d : new LinkedList<String>(this.documents)) {
			
			try {
				NetSystem net = this.loadModel(d);
				if (null == net) {
					
					// if a model cannot be loaded, nevermind, but remove it from the collection 
					Logger.getGlobal().warning("Unable to load model: " + d +". Skipped.");
					this.documents.remove(d);
					continue;
				}
				System.out.print(".");
				
				this.index.setNetId(net, d);
				documentCache.put(d, new MinimalKSuccessorRelation<NetSystem, Node>(net));
			} catch (Exception e) {
				Logger.getGlobal().warning("Unable to load model and parse model: " + d + ". Skipped");
			}
		}
		System.out.println("Loaded " + documentCache.size() + " models.");
		
		// step 2 -- search for models, by different collection sizes
		Set<String> currentCollection = new HashSet<String>(); // stores all models under consideration for sequential search
		
		// print data header
		this.printData(0,null,null,null,0,0,0);
		
		while (this.documents.size() > 0) {
			
			/* **************************************************************************/
			// collect models for the current run
			// this will iteratively remove models from this.documents and add the to currentCollection
			Set<MinimalKSuccessorRelation<NetSystem, Node>> chunk = new HashSet<MinimalKSuccessorRelation<NetSystem, Node>>(); // stores models of current iteration for bulk loading index
			
			for (int i=0; i<interval; i++) {
				if (0 == this.documents.size()) {
					break;
				}
				
				// choose the next model
				String current = this.extractRandomDocument();
				
				if (!documentCache.containsKey(current)) {
					// load models
					try {
						NetSystem net = this.loadModel(current);
						if (null == net) {
							
							// if a model cannot be loaded, nevermind, but remove it from the collection 
							Logger.getGlobal().warning("Unable to load model: " + current +". Skipped.");
							this.documents.remove(current);
							i--;
							continue;
						}
						System.out.print(".");
						
						this.index.setNetId(net, current);
						documentCache.put(current, new MinimalKSuccessorRelation<NetSystem, Node>(net));
					} catch (Exception e) {
						Logger.getGlobal().warning("Unable to load model and parse model: " + current + ". Skipped");
						this.documents.remove(current);
						i--;
						continue;
					}
				}
					
				currentCollection.add(current);
				chunk.add(documentCache.get(current));
			}
			
			this.index.addRelations(chunk);			
			
			/* **************************************************************************/
			// choose queries
			Collection<OneSuccessorRelation<NetSystem, Node>> queries = new HashSet<OneSuccessorRelation<NetSystem, Node>>();
			for (String q : this.chooseQueries(currentCollection)) {
				if (!queryCache.containsKey(q)) {
					NetSystem net = this.loadModel(q);
					if (null == net) {
						
						// if a model cannot be loaded, nevermind, but remove it from the collection 
						Logger.getGlobal().warning("Unable to load query: " + q +". Skipped.");
						this.queries.remove(q);
						continue;
					}
					
					queryCache.put(q, new OneSuccessorRelation<NetSystem, Node>(net));
				}
				
				queries.add(queryCache.get(q));
			}
			
			System.out.println("Search with " + queries.size() + " queries in " + currentCollection.size() + " models. \n\tPausing briefly.");
			// let the index rest and give some time to organize
			Thread.sleep(PAUSE*1000);
			
			/* **************************************************************************/
			// Search sequentially
			StopWatch sWatch = new StopWatch(); // sequential watch
			StopWatch iWatch = new StopWatch(); // index watch
			StopWatch cWatch = new StopWatch(); // verification (closeness computation) watch
			
			int missedCandidates  = 0;
			int invalidCandidates = 0; 
			Aggregate<Integer> prunedCandidates = new Aggregate<>();
			
			//System.out.print("\t>");
			for (OneSuccessorRelation<NetSystem, Node> qrel : queries) {
				
				Set<String> sequentialSearchResults = new HashSet<String>();
				
				//System.out.print("s");
				// search sequentially
				sWatch.start();
				for (String d : currentCollection) {
					
					double c = Closeness.compute(qrel, documentCache.get(d));
					if (c > 0) {
						sequentialSearchResults.add(d);
					}
				}
				sWatch.stop();
				
				seqSearchTime.add(sWatch.last());
				
				//System.out.print("i");
				// search with index
				iWatch.start();
				Collection<RelationCacheRecord> indexSearchResults = this.index.search(qrel);
				iWatch.stop();
				
				prunedCandidates.add(currentCollection.size() - indexSearchResults.size());
				
				if (sequentialSearchResults.size() > indexSearchResults.size()) {
					Logger.getGlobal().warning("Index missed results \n\t"+qrel.getNet().getId()+"("+sequentialSearchResults.size()+","+indexSearchResults.size()+") ");
					missedCandidates += Math.max(0, sequentialSearchResults.size() - indexSearchResults.size());
				}
				
System.out.println("("+sequentialSearchResults.size()+","+indexSearchResults.size()+")");
				
				cWatch.start();
				for (RelationCacheRecord r : indexSearchResults) {
					double c = Closeness.compute(qrel, r.getRel());
					if (0 == c) {
						invalidCandidates ++;
					}
				}
				cWatch.stop();
				
				effSearchTime.add(iWatch.last() + cWatch.last());
				
				invalidCandidates += sequentialSearchResults.size();
			}
			
			System.out.println();
			this.printData(currentCollection.size(), sWatch.statistics(), iWatch.statistics(), cWatch.statistics(), 
							prunedCandidates.avg(), missedCandidates, invalidCandidates);
			
		}
		
		System.out.println("Global Search Time Statistics");
		
		System.out.println(" sequential number of comps: " + seqSearchTime.size());
		System.out.println(" sequential min: " + r(seqSearchTime.min()));
		System.out.println(" sequential max: " + r(seqSearchTime.max()));
		System.out.println(" sequential avg: " + r(seqSearchTime.avg()));
		System.out.println(" sequential median: " + r(seqSearchTime.median()));
		System.out.println(" sequential quartile: " + r(seqSearchTime.quantile(0.25)));
		System.out.println(" sequential quantile(0.9): " + r(seqSearchTime.quantile(0.9)));
		System.out.println(" sequential variance: " + r(seqSearchTime.variance()));
		System.out.println(" sequential std deviation: " + Math.sqrt(r(seqSearchTime.variance())));
		
		System.out.println(" efficient number of comps: " + effSearchTime.size());
		System.out.println(" efficient min: " + r(effSearchTime.min()));
		System.out.println(" efficient max: " + r(effSearchTime.max()));
		System.out.println(" efficient avg: " + r(effSearchTime.avg()));
		System.out.println(" efficient median: " + r(effSearchTime.median()));
		System.out.println(" efficient quartile: " + r(effSearchTime.quantile(0.25)));
		System.out.println(" efficient quantile(0.9): " + r(effSearchTime.quantile(0.9)));
		System.out.println(" efficient variance: " + r(effSearchTime.variance()));
		System.out.println(" efficient std deviation: " + Math.sqrt(r(effSearchTime.variance())));
		
	}
		
	public void printData(
			int size,
			Aggregate<Long> sStats,
			Aggregate<Long> iStats, 
			Aggregate<Long> cStats,
			double prunedCandidates, int missedCandidates, int invalidCandidates) {
		
		if (null == sStats) {
			this.out.println(
				"size" + SEP +
				"seqMin"+SEP+"seqQ(.25)"+SEP+"seqMedian"+SEP+"seqQ(0.75)"+SEP+"seqMax"+SEP+"seqAvg"+SEP+
				"indexMin"+SEP+"indexQ(.25)"+SEP+"indexMedian"+SEP+"indexQ(0.75)"+SEP+"indexMax"+SEP+"indexAvg"+SEP+
				"verifyMin"+SEP+"verifyQ(.25)"+SEP+"verifyMedian"+SEP+"verifyQ(0.75)"+SEP+"verifyMax"+SEP+"verifyAvg"+SEP+
				"pruned" + SEP + "missed" + SEP + "excluded"
				);
			return;
		}
		
		this.out.println(
				size + SEP +
				joinTimeStats(sStats) + 
				joinTimeStats(iStats) + 
				joinTimeStats(cStats) + 
				prunedCandidates + SEP + missedCandidates + SEP + invalidCandidates + SEP);
		
	}
	
	protected String joinTimeStats(Aggregate<Long> stats) {
		return  r(stats.min()) + SEP +
				r(stats.quantile(0.25)) + SEP +
				r(stats.median()) + SEP +
				r(stats.quantile(0.75)) + SEP +
				r(stats.max()) + SEP +
				r(stats.avg()) + SEP;
		
	}
	/**
	 * returns milliseconds of nanoseconds
	 * 
	 * @param in
	 * @return
	 */
	protected static float r(double in) {
		return Math.round(in/(1000*1000));
	}
	
	protected String extractRandomDocument() {
		return this.documents.remove((int) (Math.random()*this.documents.size())); 
	}
	
	protected Collection<String> chooseQueries(Collection<String> documents) {
		return this.getQueries();
	}
	
	
}
