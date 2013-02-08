package models.simsearch;

import java.util.HashMap;
import java.util.Map;

import xxl.core.util.Distance;

public abstract class ExperimentMetric implements Distance<IDatapoint> {

    Map<String, Map<String, Double>> comparisons = new HashMap<String, Map<String, Double>>();

    /**
     * reset comparison counter
     * clears internal cache of previous comparisons
     */
    public void resetCounter() {
        this.comparisons = new HashMap<String, Map<String, Double>>();
    }

    /**
     * get the number of comparisons since the last time, #resetCouner has been called
     * @return
     */
    public int getNumberOfComparisons() {
        int result = 0;
        for (String ssub: this.comparisons.keySet()) {
            result += comparisons.get(ssub).size();
        }
        return result;
    }

    /**
     * Stores previous comparison results to avoid multiple comparisons of the same objects
     * requires Object#clone() safe identifier, i.e., IDatapoint
     *
     * @param dp1
     * @param dp2
     * @return
     */
    @Override
    public double distance(IDatapoint dp1, IDatapoint dp2) {

        double result = -1;

        // switch datapoints in order to avoid duplicate comparisons (distance(dp1, dp2) == distance(dp2,dp1))
        if (dp1.getId().compareTo(dp2.getId()) > 0) {
            IDatapoint tmp = dp2;
            dp2 = dp1;
            dp1 = tmp;
        }

        if (comparisons.containsKey(dp1.getId())) {
            Map<String, Double> match = comparisons.get(dp1.getId());
            if (match.containsKey(dp2.getId())) {
                result = match.get(dp2.getId());
            }
            else {
                result = this.innerDistance(dp1, dp2);
                match.put(dp2.getId(), result);
            }
        }
        else {
            result = this.innerDistance(dp1, dp2);
            Map<String, Double> sub = new HashMap<String, Double>();
            sub.put(dp2.getId(), result);
            comparisons.put(dp1.getId(), sub);
        }

        if (result < 0) {
            throw new RuntimeException("ExperimentMetric -- Distance Exception");
        }

        return result;
    }

    public abstract double innerDistance(IDatapoint dp1, IDatapoint dp2);
}
