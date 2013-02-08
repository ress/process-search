package nl.tue.ieis.is.similarity.epc;

import java.io.StringReader;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.Map;
import java.util.Set;

import javax.xml.parsers.SAXParser;
import javax.xml.parsers.SAXParserFactory;

import org.xml.sax.InputSource;
import org.xml.sax.helpers.DefaultHandler;

public class EPC {

	Map<String,Function> functions;
	Map<String,Event> events;
	Map<String,Connector> connectors;
	Set<Arc> arcs;
	Map<Node,Set<Arc>> arcsBySource;
	Map<Node,Set<Arc>> arcsByTarget;
	
	public EPC(){
		functions = new HashMap<String,Function>();
		events = new HashMap<String,Event>();;
		connectors = new HashMap<String,Connector>();;
		arcs = new HashSet<Arc>();
		arcsBySource = new HashMap<Node,Set<Arc>>();
		arcsByTarget = new HashMap<Node,Set<Arc>>();;		
	}
	
	public static EPC getFromEPML(String epml){
		EPC result = new EPC();
		
        DefaultHandler handler = new EPCParser(result);
        SAXParserFactory factory = SAXParserFactory.newInstance();
        
        try {
            SAXParser saxParser = factory.newSAXParser();
            saxParser.parse(new InputSource(new StringReader(epml)), handler);

        } catch (Exception e) {
            e.printStackTrace();
        }
		
		return result;
	}
	
	public void addFunction(Function f){
		functions.put(f.getId(), f);
	}
	public void addEvent(Event e){
		events.put(e.getId(), e);
	}
	public void addConnector(Connector c){
		connectors.put(c.getId(), c);
	}	
	public void addArc(Arc a){
		arcs.add(a);
		Set<Arc> arcsFromSource = arcsBySource.get(a.getSource());
		if (arcsFromSource == null){
			arcsFromSource = new HashSet<Arc>();
			arcsFromSource.add(a);
			arcsBySource.put(a.getSource(),arcsFromSource);
		}else{
			arcsFromSource.add(a);
		}
		Set<Arc> arcsToTarget = arcsByTarget.get(a.getTarget());
		if (arcsToTarget == null){
			arcsToTarget = new HashSet<Arc>();
			arcsToTarget.add(a);
			arcsByTarget.put(a.getTarget(),arcsToTarget);
		}else{
			arcsToTarget.add(a);
		}		
	}
	
	public Function findFunction(String id){
		return functions.get(id);
	}
	public Event findEvent(String id){
		return events.get(id);
	}
	public Connector findConnector(String id){
		return connectors.get(id);
	}
	public Node findNode(String id){
		Node result = events.get(id);
		if (result != null){
			return result;
		}
		result = functions.get(id);
		if (result != null){
			return result;
		}
		result = connectors.get(id);
		return result;
	}

	public Set<Node> getPre(Node n){
		Set<Node> result = new HashSet<Node>();
		Set<Arc> incoming = arcsByTarget.get(n);
		if (incoming != null){
			for (Iterator<Arc> i = incoming.iterator(); i.hasNext();){
				Arc a = i.next();
				result.add(a.getSource());
			}
		}
		return result;
	}
	
	public Set<Node> getPost(Node n){
		Set<Node> result = new HashSet<Node>();
		Set<Arc> outgoing = arcsBySource.get(n);
		if (outgoing != null){
			for (Iterator<Arc> i = outgoing.iterator(); i.hasNext();){
				Arc a = i.next();
				result.add(a.getTarget());
			}
		}
		return result;
	}
	
	public Set<Function> getFunctions(){
		return new HashSet<Function>(functions.values());
	}
	public Set<Event> getEvents(){
		return new HashSet<Event>(events.values());		
	}
	public Set<Connector> getConnectors(){
		return new HashSet<Connector>(connectors.values());
	}
	public Set<Arc> getArcs(){
		return new HashSet<Arc>(arcs);
	}
	public Set<Node> getNodes(){
		Set<Node> result = new HashSet<Node>();
		result.addAll(functions.values());
		result.addAll(events.values());
		result.addAll(connectors.values());
		return result;
	}
	
	public String toString(){
		String result = "";
		
		for (Function f: functions.values()){
			result += f.getName() + "\n";
		}
		for (Event e: events.values()){
			result += e.getName() + "\n";
		}
		for (Connector c: connectors.values()){
			result += c.getName() + "\n";
		}
		for (Arc a: arcs){
			result += "(" + a.getSource().getName() + ", " + a.getTarget().getName() + ")\n";
		}
		
		return result;
	}
}
