package models;

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

        // FakeSearch
        SearchAlgorithm fakeSearch = new FakeSearch();
        this.algorithms.put(fakeSearch.getIdentifier(), fakeSearch);

        // Initialize the algorithms: loading modules, building indexes, ...
        for (SearchAlgorithm algorithm : algorithms.values()) {
            algorithm.initialize();
        }
    }

    public Set<String> getAlgorithmIdentifiers() {
        return this.algorithms.keySet();
    }

    public SearchAlgorithm getAlgorithm(String algorithm) {
        return this.algorithms.get(algorithm);
    }
}
