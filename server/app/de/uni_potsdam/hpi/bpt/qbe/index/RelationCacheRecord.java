package de.uni_potsdam.hpi.bpt.qbe.index;

import java.io.File;
import java.io.Serializable;

import org.jbpt.bp.KSuccessorRelation;
import org.jbpt.bp.MinimalKSuccessorRelation;
import org.jbpt.petri.NetSystem;
import org.jbpt.petri.Node;
import org.jbpt.petri.io.WoflanSerializer;

public class RelationCacheRecord  implements Serializable{
	
	private static final long serialVersionUID = 1L;
	protected String id;
	protected String file;
	protected transient NetSystem net;
	protected transient MinimalKSuccessorRelation<NetSystem, Node> rel;
	
	public RelationCacheRecord(String id, String file, NetSystem net, MinimalKSuccessorRelation<NetSystem, Node> rel) {
		this.id = id;
		this.file = file;
		this.net = net;
		this.rel = rel;
	}
	
	public String getId() {
		return id;
	}
	
	public String getFile() {
		return file;
	}
	
	public NetSystem getNet() {
		if (null == this.net) {
			this.net = WoflanSerializer.parse(new File(this.getFile()));
		}
		
		return this.net;
	}
	
	public MinimalKSuccessorRelation<NetSystem, Node> getRel() {
		if (null == this.rel) {
			this.rel = new MinimalKSuccessorRelation<NetSystem, Node>(this.getNet());
		}
		
		return this.rel;
	}
	
}
