package nl.tue.ieis.is.similarity.epc;

public class Event extends Node {

	public Event() {
	}
	public Event(String id){
		this.id = id;
	}
	public Event(String id, String label){
		this.id = id;
		this.name = label;
	}

}
