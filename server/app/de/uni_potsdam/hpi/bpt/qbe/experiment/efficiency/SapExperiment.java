package de.uni_potsdam.hpi.bpt.qbe.experiment.efficiency;

import java.util.List;
import java.io.File;
import java.io.FileNotFoundException;
import java.io.FilenameFilter;
import java.io.IOException;
import java.io.PrintStream;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.Date;
import java.util.HashSet;
import java.util.logging.Level;
import java.util.logging.Logger;

import org.apache.lucene.index.CorruptIndexException;
import org.jbpt.bp.OneSuccessorRelation;
import org.jbpt.petri.NetSystem;
import org.jbpt.petri.Node;
import org.jbpt.petri.io.WoflanSerializer;

import de.uni_potsdam.hpi.bpt.qbe.index.RelationInvertedIndex;

public class SapExperiment extends EfficiencyExperiment {
	
	public SapExperiment() throws IOException {
		Logger.getGlobal().setLevel(Level.FINEST);
		//MODEL_PATH = "/Users/matthiaskunze/Documents/paperwork/material/models/sap_rm_or_replaced_by_and_noevents_reduced_singlestart_singleend/";
        MODEL_PATH = "/Users/bart/Projekte/MA/EfficientSimilaritySearch/comin2011/models/sap_rm_tpn";
		//MODEL_PATH = "/Users/matthiaskunze/Documents/paperwork/material/models/test10/";
		//MODEL_PATH = "/Users/matthiaskunze/Documents/paperwork/submissions/2012_TSE_rejected/implementation/comin2011/models/tpn_models5/";
		this.out = new PrintStream(new File("evaluation/efficiency_"+this.getDocuments().size()+"_"+new Date().getTime()+".csv"));
		this.index = new RelationInvertedIndex();//"_index/efficiency_"+this.getDocuments().size()+"_"+new Date().getTime()+".idx");		
	}
	
	@Override
	public NetSystem loadModel(String name) {
		
		String filename = name;
		// fix filenames
		if (null != NO_EVENTS && !NO_EVENTS.isEmpty()) {
			name = name.replace(".epml", NO_EVENTS+".tpn");
		} else {
			name = name.replace(".epml", ".tpn");
		}
		
		// remove possibly trailing / (\)
		MODEL_PATH = MODEL_PATH.replaceAll(File.separator + "$", "");
		
		File file = new File(MODEL_PATH + File.separator + name);
		if (!file.exists()) {
			return null;
		}
		
		NetSystem net = WoflanSerializer.parse(file);
		net.setName(file.getAbsolutePath());
		net.setId(filename);
		
		return net;
	}
	
	protected Collection<String> models = new HashSet<String>();
	@Override
	protected Collection<String> getQueries() {
		return this.getDocuments();
	}

	@Override
	protected final Collection<String> getDocuments() {
		if (this.models.isEmpty()) {
			File dir = new File(MODEL_PATH);
			if (!dir.exists()) {
				Logger.getGlobal().severe("MODEL_PATH is invalid: " + MODEL_PATH + " Stopping.");
				// return empty collection of models
			}
			else {
				this.models.addAll(Arrays.asList(dir.list(new FilenameFilter() {
					
					@Override
					public boolean accept(File dir, String name) {
						return name.endsWith(".tpn");
					}
				})));
			}
		}
		
		return this.models;
	}
	
	@Override
	protected Collection<String> chooseQueries(Collection<String> currentDocuments) {
		// query choice strategy: choose randomly 100 queries from documents that are in the index and that are not (if possible)
		// this.documents ... remaining documents that are not indexed yet
		// currentDocuments ... documents that are indexed already
		
		int num = Math.min(this.documents.size() + currentDocuments.size(), 50);
		
		Collection<String> queries = new HashSet<String>();
		
		if (currentDocuments.size() < num) {
			queries.addAll(chooseRandomSamples(currentDocuments, currentDocuments.size()));
			queries.addAll(chooseRandomSamples(this.documents, num - currentDocuments.size()));
		}
		else {
			queries.addAll(chooseRandomSamples(currentDocuments, num));
		}
		
		/*
		
		if (currentDocuments.size() < num/2) {
			// currently are less then num/2 documents stored in the index, fill with non-indexed documents
			queries.addAll(chooseRandomSamples(currentDocuments, currentDocuments.size()));
			queries.addAll(chooseRandomSamples(this.documents, num - currentDocuments.size()));
			
		} else if (this.documents.size() < num/2) {
			// currently are less then num/2 documents left, i.e., not stored in the index, fil with index documents
			queries.addAll(chooseRandomSamples(this.documents, this.documents.size()));
			queries.addAll(chooseRandomSamples(currentDocuments, num - this.documents.size()));
		}
		else {
			queries.addAll(chooseRandomSamples(this.documents, num/2));
			queries.addAll(chooseRandomSamples(currentDocuments, num - num/2));
		}
		
		if (queries.size() != num) 
			Logger.getGlobal().severe("Query choice strategy failed: should be" + num + ", but are " + queries.size()+ " queries");
			*/		
		return queries;
	}
	
	protected Collection<String> chooseRandomSamples(Collection<String> collection, int num) {
		List<String> src = new ArrayList<String>(collection);
		List<String> dest = new ArrayList<String>();
		num = Math.min(num,  src.size());
		
		while (num-- > 0) {
			dest.add(src.remove((int) (Math.random() * src.size())));
		}
		
		return dest;
	}
	
	
	public static void main(String[] args) throws CorruptIndexException, IOException, InterruptedException {
		SapExperiment exp = new SapExperiment();
		exp.run();
	}
}
