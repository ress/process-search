package models;

import org.jbpt.petri.NetSystem;

import java.util.ArrayList;

/**
 * Created with IntelliJ IDEA.
 * User: bart
 * Date: 30.01.13
 * Time: 22:37
 * To change this template use File | Settings | File Templates.
 */
public class FakeSearch implements SearchAlgorithm {
    @Override
    public String getIdentifier() {
        return this.getClass().getSimpleName();
    }

    @Override
    public void initialize() {
    }

    @Override
    public ArrayList<SearchResult> search(NetSystem processModel) {
        return new ArrayList<>();
    }
}
