package models.simsearch;

/**
 * Created with IntelliJ IDEA.
 * User: bart
 * Date: 07.02.13
 * Time: 13:13
 * To change this template use File | Settings | File Templates.
 */
import nl.tue.ieis.is.similarity.graph.SimpleGraph;
import org.jbpt.petri.NetSystem;

public class SimpleGraphDatapoint extends SimpleGraph implements IDatapoint{

    public SimpleGraphDatapoint(NetSystem net) {
        super(net);
    }

    private String dp_id = null;

    @Override
    public String getId() {
        return this.dp_id;
    }

    @Override
    public void setId(String id) {
        this.dp_id = id;
    }

    public NetSystem getModel() {
        return null;
    }
}
