package de.uni_potsdam.hpi.bpt.qbe.index;

import java.io.File;
import java.io.IOException;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.logging.Logger;

import org.apache.lucene.analysis.Analyzer;
import org.apache.lucene.analysis.WhitespaceAnalyzer;
import org.apache.lucene.document.Document;
import org.apache.lucene.document.Field;
import org.apache.lucene.index.CorruptIndexException;
import org.apache.lucene.index.IndexReader;
import org.apache.lucene.index.IndexWriter;
import org.apache.lucene.index.IndexWriterConfig;
import org.apache.lucene.index.Term;
import org.apache.lucene.search.BooleanClause;
import org.apache.lucene.search.BooleanQuery;
import org.apache.lucene.search.FuzzyQuery;
import org.apache.lucene.search.IndexSearcher;
import org.apache.lucene.search.Query;
import org.apache.lucene.search.ScoreDoc;
import org.apache.lucene.search.TopScoreDocCollector;
import org.apache.lucene.store.Directory;
import org.apache.lucene.store.RAMDirectory;
import org.apache.lucene.store.SimpleFSDirectory;
import org.apache.lucene.util.Version;
import org.jbpt.bp.KSuccessorRelation;
import org.jbpt.bp.MinimalKSuccessorRelation;
import org.jbpt.petri.NetSystem;
import org.jbpt.petri.Node;

public class RelationInvertedIndex {

	protected File base = null;
	protected Directory index = null;
	protected RelationCache cache = null;
	protected Analyzer analyzer = new WhitespaceAnalyzer(Version.LUCENE_36);
	protected boolean autoPersist;
	
	/**
	 * Create a new Index with file based persistence and automatically stores the relationCache.
	 * This makes adding documents very slow, but does not require to store the cache before terminating the index.
	 * 
	 * @param basedir
	 * @param autoPersist
	 * @throws IOException 
	 */
	public RelationInvertedIndex(String basedir, boolean autoPersist) throws IOException {
		this(basedir);
		this.autoPersist = autoPersist;
	}
	
	/**
	 * Create a new Index with file based persistence. 
	 * 
	 * @param basedir
	 * @throws IOException
	 */
	public RelationInvertedIndex(String basedir) throws IOException {
		
		// create base directory for index
		File dir = new File(basedir);
		if (dir.exists()) {
			// load directory and cache
			this.base = dir;
			try {
				this.cache = RelationCache.load(this.base);
			} catch (ClassNotFoundException e) {
				throw new IOException("Unable to load relation cache", e);
			}
		}
		else {
			// create empty directory
			if (dir.mkdir()) {
				this.base = dir;
				this.cache = new RelationCache();
				Logger.getAnonymousLogger().fine("Create file based lucene index: " + this.base.getAbsolutePath());
			}
			else {
				throw new IOException("Unable to create index directory " + basedir);
			}
		}
		
		// initialize index
		this.index = new SimpleFSDirectory(this.base);
	}
	
	/**
	 * Create a new Index in main memory. Will be destroyed, when program terminates.
	 */
	public RelationInvertedIndex() {
		this.index = new RAMDirectory();
		this.base = null;
		this.cache = new RelationCache();
	}
	
	/**
	 * returns a reference to the relation cache in order to read from it
	 * @return
	 */
	public final RelationCache getCache() {
		return this.cache;
	}
	
	/**
	 * Persists the relation cache, unless index is created in main memory only
	 */
	public void persistCache() throws IOException {
		if (null != this.base) {
			RelationCache.save(this.base, this.cache);
		}
	}

	/**
	 * Add a new net to the inverted index.
	 * 
	 * @param net
	 * @throws IOException 
	 * @throws CorruptIndexException 
	 */
	public void addNet(NetSystem net) throws CorruptIndexException, IOException {
		Set<NetSystem> set = new HashSet<NetSystem>();
		set.add(net);
		this.addNets(set);
	}
	
	/**
	 * Add a SuccessorRelation to the inverted index.
	 * 
	 * @param net
	 * @throws IOException 
	 * @throws CorruptIndexException 
	 */
	public void addRelation(MinimalKSuccessorRelation<NetSystem, Node> relations) throws CorruptIndexException, IOException {
		Set<MinimalKSuccessorRelation<NetSystem, Node>> set = new HashSet<MinimalKSuccessorRelation<NetSystem, Node>>();
		set.add(relations);
		this.addRelations(set);
	}
	
	/**
	 * Add a set of nets to the inverted index
	 * @param nets
	 * @throws IOException 
	 * @throws CorruptIndexException 
	 */
	public void addNets(Set<NetSystem> nets) throws CorruptIndexException, IOException {
		
		Set<MinimalKSuccessorRelation<NetSystem, Node>> relations = new HashSet<MinimalKSuccessorRelation<NetSystem, Node>>();
		for (NetSystem net : nets) {
			// avoid adding duplicates
			if (this.cache.containsKey(this.getNetId(net))) {
				continue;
			}
			
			// derive the relation and add them to the collection
			relations.add(new MinimalKSuccessorRelation<NetSystem, Node>(net));
		}
		this.addRelations(relations);			
	}
	
	/**
	 * Add a set of nets to the inverted index
	 * @param nets
	 * @throws IOException 
	 * @throws CorruptIndexException 
	 */
	public void addRelations(Set<MinimalKSuccessorRelation<NetSystem, Node>> relations) throws CorruptIndexException, IOException {
		
		// create a new index writer
		IndexWriterConfig config = new IndexWriterConfig(Version.LUCENE_35, analyzer);
		IndexWriter w = new IndexWriter(index, config);
		
		
		
		for (MinimalKSuccessorRelation<NetSystem, Node> rel : relations) {
			
			String id = this.getNetId(rel.getNet());
			
			// avoid adding duplicates
			if (this.cache.containsKey(id)) {
				continue;
			}
			
			// add net to cache
			this.cache.put(id, 
					new RelationCacheRecord(
							id, 
							this.getNetFilename(rel.getNet()), 
							rel.getNet(), 
							rel));
			
			// extract tokens
			String content = RelationAnalyzer.extractTokens(rel);
			
//Logger.getGlobal().info("DOCUMENT " + net.getId() + " : " + content);
			
			// create and document
			Document doc = new Document();
			doc.add(new Field("content", content, Field.Store.YES, Field.Index.ANALYZED));
			doc.add(new Field("id", id, Field.Store.YES, Field.Index.NOT_ANALYZED));
			w.addDocument(doc);
			
			//Logger.getAnonymousLogger().info("Added model to index and cache " + id + "\n" + content);
		}
		
	    w.close();
	    
	    if (this.autoPersist) {
	    	this.persistCache();
	    }
	}
	
	public Set<RelationCacheRecord> search(NetSystem query) throws /*CorruptIndexException, */IOException {
		KSuccessorRelation<NetSystem, Node> rel = new KSuccessorRelation<NetSystem, Node>(query, 1);
		return this.search(rel);
	}
	
	public Set<RelationCacheRecord> search(KSuccessorRelation<NetSystem, Node> rel) throws /* CorruptIndexException, */ IOException {
		
		
		
		List<String> keywords = RelationAnalyzer.parseKeywords(this.analyzer, RelationAnalyzer.extractTokens(rel));

//Logger.getGlobal().info("QUERY    " + rel.getNet().getId() + " : " + keywords);		
		
		// build query
		BooleanQuery q = new BooleanQuery();
		for (String key : keywords) {
			Query qs = new FuzzyQuery(new Term("content", key), 0.6f);
			q.add(qs, BooleanClause.Occur.MUST);
		}
		
		// search
	    int hitsPerPage = 1000;
	    IndexReader reader = IndexReader.open(this.index);
	    IndexSearcher searcher = new IndexSearcher(reader);
	    
	    TopScoreDocCollector collector = TopScoreDocCollector.create(hitsPerPage, true);
	    searcher.search(q, collector);
	    ScoreDoc[] hits = collector.topDocs().scoreDocs;
	   
	    // return results
	    Set<RelationCacheRecord> result = new HashSet<RelationCacheRecord>();
	    Logger.getAnonymousLogger().fine("Search returned " + hits.length + " hits");
	    
	    for (ScoreDoc i : hits) {
		    result.add(this.cache.get(searcher.doc(i.doc).get("id")));
	    }
	    
	    // searcher can only be closed when there
	    // is no need to access the documents any more.
	    searcher.close();
	    
	    return result;
	}
	
	public String getNetId(NetSystem net) {
		return net.getId();
	}
	
	public String getNetFilename(NetSystem net) {
		return net.getName();
	}
	
	public void setNetId(NetSystem net, String id) {
		net.setId(id);
	}
	
	public void setNetFilename(NetSystem net, String filename) {
		net.setName(filename);
	}
	
}
