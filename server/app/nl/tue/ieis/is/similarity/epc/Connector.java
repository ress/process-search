package nl.tue.ieis.is.similarity.epc;

public class Connector extends Node {

	public static final String ANDLabel = "AND";
	public static final String ORLabel = "OR";
	public static final String XORLabel = "XOR";
	
	public Connector() {
	}
	public Connector(String id){
		this.id = id;
	}
	public Connector(String id, String label){
		this.id = id;
		this.name = label;
	}

}
