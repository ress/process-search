package models;

import com.google.common.collect.ArrayListMultimap;
import com.google.common.collect.HashMultimap;
import models.algorithms.querying.QueryingByExample;
import models.algorithms.similarity.BpSimilaritySearch;
import models.algorithms.similarity.SeqBpSimilaritySearch;

import java.util.HashMap;
import java.util.List;
import java.util.Set;

/**
 * Created with IntelliJ IDEA.
 * User: bart
 * Date: 06.01.13
 * Time: 21:19
 * To change this template use File | Settings | File Templates.
 */
public class SearchEngine {
    public ArrayListMultimap<String, SearchAlgorithm> algorithms;
    protected static SearchEngine instance;

    public static SearchEngine getInstance() {
        if (instance == null) {
            instance = new SearchEngine();
        }

        return instance;
    }

    protected SearchEngine() {
        this.algorithms = ArrayListMultimap.create();

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
        //this.addSearchAlgorithm(new SeqBpSimilaritySearch());

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

    public SearchAlgorithm buildSearchAlgorithm(String algorithm, HashMap<String, Object> parameters) {
        SearchAlgorithm searchAlgorithm;
        if (algorithm.equals("Querying by Example")) {
            searchAlgorithm = new QueryingByExample();
        } else if (algorithm.equals("Similarity Search")) {
            searchAlgorithm = new BpSimilaritySearch();
        } else {
            return null;
        }

        searchAlgorithm.initialize(parameters);
        addSearchAlgorithm(searchAlgorithm);

        return searchAlgorithm;
    }

    public SearchAlgorithm getAlgorithm(String algorithm) {
        return this.algorithms.get(algorithm).get(0);
    }

    public SearchAlgorithm getAlgorithm(String algorithm, HashMap<String, Object> parameters) {
        List<SearchAlgorithm> searchAlgorithms = this.algorithms.get(algorithm);
        for (SearchAlgorithm searchAlgorithm : searchAlgorithms) {
            if (searchAlgorithm.getParameters().equals(parameters)) {
                return searchAlgorithm;
            }
        }

        // Didn't find one, so create a new one
        return buildSearchAlgorithm(algorithm, parameters);
    }

    public void resetAlgorithms() {
        this.algorithms.clear();
    }
}
