package models.simsearch;

import org.jbpt.bp.RelSet;
import org.jbpt.petri.NetSystem;
import org.jbpt.petri.Node;
import org.jbpt.petri.PetriNet;

/**
 * Created with IntelliJ IDEA.
 * User: bart
 * Date: 07.02.13
 * Time: 23:46
 * To change this template use File | Settings | File Templates.
 */
public class RelSetDatapoint extends RelSet<NetSystem, Node> implements IDatapoint {

    public RelSetDatapoint(RelSet<NetSystem, Node> relset) {
        super(relset.getMatrix().length);
        this.model = relset.getModel();
        this.entities = relset.getEntities();
        this.matrix = relset.getMatrix();
    }

    private String dp_id = null;

    //@Override
    public boolean equals(IDatapoint other) {
        throw new RuntimeException("not expected");
        // TODO Auto-generated method stub
        // return this.getId().equals(other.getId());
    }

    @Override
    public String getId() {
        return this.dp_id;
    }

    @Override
    public void setId(String id) {
        this.dp_id = id;
    }

}

