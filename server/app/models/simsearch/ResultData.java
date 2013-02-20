package models.simsearch;

/**
* Created with IntelliJ IDEA.
* User: bart
* Date: 13.02.13
* Time: 16:54
* To change this template use File | Settings | File Templates.
*/
public class ResultData implements Comparable {

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
