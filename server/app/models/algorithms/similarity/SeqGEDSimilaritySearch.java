package models.algorithms.similarity;

import models.SearchResult;
import models.simsearch.IDatapoint;
import models.simsearch.SimpleGraphDatapoint;
import org.jbpt.petri.NetSystem;

import java.util.ArrayList;
import java.util.Iterator;
import java.util.SortedSet;
import java.util.TreeSet;

public class SeqGEDSimilaritySearch extends GEDSimilaritySearch {
    private class ResultData implements Comparable {

        public Double distance = -1.0;
        public IDatapoint p = null;

        public ResultData(double distance, IDatapoint p) {
            this.distance = distance;
            this.p = p;
        }

        @Override
        public int compareTo(Object arg0) {

            if (!(arg0 instanceof ResultData)) {
                throw new IllegalArgumentException("compared to object of different type");
            }

            return (this.distance).compareTo(((ResultData)arg0).distance);
        }
    }

    @Override
    public String getIdentifier() {
        return "SeqGEDSimilaritySearch";
    }

    @Override
    public ArrayList<SearchResult> search(NetSystem processModel) {
        ArrayList<SearchResult> results = new ArrayList<SearchResult>();

        IDatapoint query = new SimpleGraphDatapoint(processModel);
        query.setId("Query");

        SortedSet<ResultData> intermediateResults = new TreeSet<ResultData>();

        for (IDatapoint dp : this.loadedModels) {
            intermediateResults.add(new ResultData(this.metric.distance(query, dp), dp));
            System.out.println("distance(query, " + dp.getId() + ") = " + this.metric.distance(query, dp));
        }

        // simulate retrieval of k nearest neighbor access
        int i = 0;
        Iterator<ResultData> res = intermediateResults.iterator();
        while(res.hasNext() && i < 10) {
            i++;
            ResultData d = res.next();
            System.out.println("distance(query, " + d.p.getId() + ") = " + d.distance);
        }

        return results;
    }
}
