package models.algorithms.similarity;

import models.Measurement;
import models.SearchResult;
import models.simsearch.IDatapoint;
import models.simsearch.RelSetDatapoint;
import models.simsearch.ResultData;
import org.jbpt.bp.construct.RelSetCreatorUnfolding;
import org.jbpt.petri.NetSystem;

import java.util.*;

public class SeqBpSimilaritySearch extends BpSimilaritySearch {
    @Override
    public String getIdentifier() {
        return "Similarity Search (sequential)";
    }

    @Override
    public ArrayList<SearchResult> search(NetSystem processModel) {
        ArrayList<SearchResult> results = new ArrayList<SearchResult>();

        IDatapoint query = new RelSetDatapoint(RelSetCreatorUnfolding.getInstance().deriveRelationSet(processModel));
        query.setId("Query-" + UUID.randomUUID().toString());

        SortedSet<ResultData> intermediateResults = new TreeSet<ResultData>();

        this.metric.resetCounter();
        for (IDatapoint dp : this.loadedModels) {
            intermediateResults.add(new ResultData(this.metric.distance(query, dp), dp));
            System.out.println("distance(query, " + dp.getId() + ") = " + this.metric.distance(query, dp));
        }

        // simulate retrieval of k nearest neighbor access
        int i = 0;
        Iterator<ResultData> res = intermediateResults.iterator();
        while(res.hasNext() && i < Integer.valueOf((String)this.parameters.get("k-value"))) {
            i++;
            ResultData d = res.next();
            System.out.println("distance(query, " + d.p.getId() + ") = " + d.distance);

            // Skip obviously bad results
            if (d.distance < 1) {
                results.add(new SearchResult(d.p.getId(), d.p.getModel(), 1 - d.distance));
            }
        }

        Measurement.step("SeqBPSimilaritySearch.MetricComparisons", this.metric.getNumberOfComparisons());
        this.metric.resetCounter();

        Collections.sort(results, Comp);

        return results;
    }
}
