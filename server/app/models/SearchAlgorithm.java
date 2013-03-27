package models;

import org.jbpt.petri.NetSystem;
import org.jbpt.pm.ProcessModel;

import java.util.ArrayList;
import java.util.HashMap;

/**
 * Created with IntelliJ IDEA.
 * User: bart
 * Date: 30.01.13
 * Time: 19:34
 * To change this template use File | Settings | File Templates.
 */
public interface SearchAlgorithm {
    public String getIdentifier();
    public ArrayList<Object> getAvailableParameters();
    public void initialize();
    public ArrayList<SearchResult> search(NetSystem processModel);
}
