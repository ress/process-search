package models.simsearch;

import org.jbpt.petri.NetSystem;

/**
 * Created with IntelliJ IDEA.
 * User: bart
 * Date: 07.02.13
 * Time: 13:10
 * To change this template use File | Settings | File Templates.
 */
public interface IDatapoint {
    public void setId(String Id);
    public String getId();
    public NetSystem getModel();
//	public boolean equals(IDatapoint other);
}
