package models;

import org.jbpt.petri.NetSystem;

/**
 * Created with IntelliJ IDEA.
 * User: bart
 * Date: 30.01.13
 * Time: 20:56
 * To change this template use File | Settings | File Templates.
 */
public class SearchResult {
    public String fileName;
    public NetSystem model;

    public SearchResult(String fileName, NetSystem model) {
        this.fileName = fileName;
        this.model = model;
    }
}
