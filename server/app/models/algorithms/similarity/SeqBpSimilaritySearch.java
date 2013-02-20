package models.algorithms.similarity;

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
        return "BP Similarity Search (sequential)";
    }

    @Override
    public ArrayList<SearchResult> search(NetSystem processModel) {
        ArrayList<SearchResult> results = new ArrayList<>();

        IDatapoint query = new RelSetDatapoint(RelSetCreatorUnfolding.getInstance().deriveRelationSet(processModel));
        query.setId("Query-" + UUID.randomUUID().toString());

        SortedSet<ResultData> intermediateResults = new TreeSet<>();

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
