package models;

import models.algorithms.querying.QueryingByExample;
import models.algorithms.similarity.BpSimilaritySearch;
import models.algorithms.similarity.SeqBpSimilaritySearch;

import java.util.HashMap;
import java.util.Set;

/**
 * Created with IntelliJ IDEA.
 * User: bart
 * Date: 06.01.13
 * Time: 21:19
 * To change this template use File | Settings | File Templates.
 */
public class SearchEngine {
    public HashMap<String, SearchAlgorithm> algorithms;

    public SearchEngine() {
        this.algorithms = new HashMap<>();

        // Querying by Example
        SearchAlgorithm querying = new QueryingByExample();
        this.algorithms.put(querying.getIdentifier(), querying);

//        // FakeSearch
//        SearchAlgorithm fakeSearch = new FakeSearch();
//        this.algorithms.put(fakeSearch.getIdentifier(), fakeSearch);
//
//        // Similarity Search
//        SearchAlgorithm similaritySearch = new GEDSimilaritySearch();
//        this.algorithms.put(similaritySearch.getIdentifier(), similaritySearch);
//
//        // Similarity Search
//        SearchAlgorithm seqSimilaritySearch = new SeqGEDSimilaritySearch();
//        this.algorithms.put(seqSimilaritySearch.getIdentifier(), seqSimilaritySearch);

        // Similarity Search (Behavior Profile based, sequential search)
        this.addSearchAlgorithm(new SeqBpSimilaritySearch());

        // Similarity Search (Behavior Profile based, indexed)
        this.addSearchAlgorithm(new BpSimilaritySearch());

        // Initialize the algorithms: loading modules, building indexes, ...
        for (SearchAlgorithm algorithm : algorithms.values()) {
            algorithm.initialize();
        }
    }

    private void addSearchAlgorithm(SearchAlgorithm algorithm) {
        this.algorithms.put(algorithm.getIdentifier(), algorithm);
    }

    public Set<String> getAlgorithmIdentifiers() {
        return this.algorithms.keySet();
    }

    public SearchAlgorithm getAlgorithm(String algorithm) {
        return this.algorithms.get(algorithm);
    }
}
