package models;

import com.google.common.collect.ArrayListMultimap;
import com.google.common.collect.HashMultimap;
import models.algorithms.querying.QueryingByExample;
import models.algorithms.similarity.BpSimilaritySearch;
import models.algorithms.similarity.MtreeSimilaritySearch;
import models.algorithms.similarity.SeqBpSimilaritySearch;
import models.algorithms.simple.SimpleSearch;

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
        init();
    }

    private void init() {
        // Querying by Example
        this.addSearchAlgorithm(new QueryingByExample());

        // Similarity Search (Behavior Profile based, sequential search)
        this.addSearchAlgorithm(new SeqBpSimilaritySearch());

        // Similarity Search (Behavior Profile based, indexed)
        this.addSearchAlgorithm(new BpSimilaritySearch());

        // Simple Search
        this.addSearchAlgorithm(new SimpleSearch());

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
        } else if (algorithm.equals("Similarity Search (sequential)")) {
            searchAlgorithm = new SeqBpSimilaritySearch();
        } else if (algorithm.equals("Simple Search")) {
            searchAlgorithm = new SimpleSearch();
        } else {
            return null;
        }

        searchAlgorithm.initialize(parameters);
        this.addSearchAlgorithm(searchAlgorithm);

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
        init();
    }
}
