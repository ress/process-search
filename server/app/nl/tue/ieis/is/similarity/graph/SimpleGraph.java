package nl.tue.ieis.is.similarity.graph;

import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.LinkedList;
import java.util.Map;
import java.util.Set;

import nl.tue.ieis.is.similarity.epc.EPC;
import org.jbpt.petri.NetSystem;
import org.jbpt.petri.Node;
import org.jbpt.petri.Transition;

/**
 * Efficient implementation of a simple graph: (Vertices, Edges, labels)
 * Only for reading, cannot be modified
 */
public class SimpleGraph {
	public Set<Integer> vertices;
	public Set<Integer> connectors;
	public Set<Integer> events;
	public Set<Integer> functions;


	private Map<Integer,Set<Integer>> outgoingEdges;
	private Map<Integer,Set<Integer>> incomingEdges;
	public Map<Integer,String> labels;
	private Set<String> functionLabels;
	private Set<String> eventLabels;
	
	private SimpleGraph(Set<Integer> vertices, Map<Integer,Set<Integer>> outgoingEdges, Map<Integer,Set<Integer>> incomingEdges, Map<Integer,String> labels){
		this.vertices = vertices;
		this.outgoingEdges = outgoingEdges;
		this.incomingEdges = incomingEdges;
		this.labels = labels;
	}
	
	/**
	 *  Initializes a simple graph from an EPC.
	 *  
	 */
	public SimpleGraph(EPC epc){
		Map<String,Integer> nodeId2vertex = new HashMap<String,Integer>();
		Map<Integer,String> vertex2nodeId = new HashMap<Integer,String>();

		vertices = new HashSet<Integer>();
		connectors = new HashSet<Integer>();
		events = new HashSet<Integer>();;
		functions = new HashSet<Integer>();
		
		outgoingEdges = new HashMap<Integer,Set<Integer>>();
		incomingEdges = new HashMap<Integer,Set<Integer>>();		
		labels = new HashMap<Integer,String>();	
		functionLabels = new HashSet<String> ();
		eventLabels = new HashSet<String> ();

		
		
		int vertexId = 0;
		for (nl.tue.ieis.is.similarity.epc.Node n: epc.getNodes()){
			vertices.add(vertexId);
//			System.out.println("adding "+ vertexId+ " "+n.getName()+" "+n.getName().replace('\n', ' ').replace("\\n", " "));
			labels.put(vertexId,n.getName().replace('\n', ' ').replace("\\n", " "));

			nodeId2vertex.put(n.getId(), vertexId);
			vertex2nodeId.put(vertexId, n.getId());
			
			if (n instanceof nl.tue.ieis.is.similarity.epc.Function && n.getName() != null) {
				functionLabels.add(n.getName().replace('\n', ' '));
				functions.add(vertexId);
			}
			else if (n instanceof nl.tue.ieis.is.similarity.epc.Event && n.getName() != null) {
				eventLabels.add(n.getName().replace('\n', ' '));
				events.add(vertexId);
			}
			else if (n instanceof nl.tue.ieis.is.similarity.epc.Connector) {
				connectors.add(vertexId);
			}
			
			vertexId++;
		}
		
		for (Integer v = 0; v < vertexId; v++){
			nl.tue.ieis.is.similarity.epc.Node n = epc.findNode(vertex2nodeId.get(v));
			
			Set<Integer> incomingCurrent = new HashSet<Integer>();
			for (nl.tue.ieis.is.similarity.epc.Node s: epc.getPre(n)){
				incomingCurrent.add(nodeId2vertex.get(s.getId()));
			}
			incomingEdges.put(v, incomingCurrent);
			
			Set<Integer> outgoingCurrent = new HashSet<Integer>();
			for (nl.tue.ieis.is.similarity.epc.Node t: epc.getPost(n)){
				outgoingCurrent.add(nodeId2vertex.get(t.getId()));
			}
			outgoingEdges.put(v, outgoingCurrent);
		}		
//		System.out.println(functionLabels.size() + " "+ eventLabels.size());
	}
	
	/**
	 *  Initializes a simple graph from an EPC.
	 *  
	 */
	public SimpleGraph(NetSystem net){
		Map<String,Integer> nodeId2vertex = new HashMap<String,Integer>();
		Map<Integer,String> vertex2nodeId = new HashMap<Integer,String>();

		vertices = new HashSet<Integer>();
		
		outgoingEdges = new HashMap<Integer,Set<Integer>>();
		incomingEdges = new HashMap<Integer,Set<Integer>>();		
		labels = new HashMap<Integer,String>();	

		int vertexId = 0;
		for (Transition t: net.getTransitions()){
			vertices.add(vertexId);
//			System.out.println("adding "+ vertexId+ " "+n.getName()+" "+n.getName().replace('\n', ' ').replace("\\n", " "));
			labels.put(vertexId,t.getName().replace('\n', ' ').replace("\\n", " "));

			nodeId2vertex.put(t.getId(), vertexId);
			vertex2nodeId.put(vertexId, t.getId());
			
			vertexId++;
		}
		
		for (Integer v = 0; v < vertexId; v++){
			
			// Node t = net.findNode(vertex2nodeId.get(v));
			Node t = null;
			
			Collection<Node> nodes = net.getNodes();
			for (Node n : nodes) {
				if (n.getId().equals(vertex2nodeId.get(v))) {
					t = n;
					break;
				}
			}
			
			
			Set<Integer> incomingCurrent = new HashSet<Integer>();
			for (Node p: net.getDirectPredecessors(t)){
				for (Node t2: net.getDirectPredecessors(p)){
					incomingCurrent.add(nodeId2vertex.get(t2.getId()));
				}
			}
			incomingEdges.put(v, incomingCurrent);
			
			Set<Integer> outgoingCurrent = new HashSet<Integer>();
			for (Node p: net.getDirectSuccessors(t)){
				for (Node t2: net.getDirectSuccessors(p)){
					outgoingCurrent.add(nodeId2vertex.get(t2.getId()));
				}
			}
			outgoingEdges.put(v, outgoingCurrent);
		}		
//		System.out.println(functionLabels.size() + " "+ eventLabels.size());
	}

	public Set<Integer> getVertices() {
		return vertices;
	}
	public Set<TwoVertices> getEdges(){
		Set<TwoVertices> result = new HashSet<TwoVertices>();
		for (Integer src: vertices){
			for (Integer tgt: outgoingEdges.get(src)){
				result.add(new TwoVertices(src,tgt));
			}
		}
		return result;
	}

	public Set<String> getFunctionLabels() {
		return functionLabels;
	}

	public Set<String> getEventLabels() {
		return eventLabels;
	}
	
	public Set<Integer> postSet(int vertex) {
		return outgoingEdges.get(vertex);
	}

	public Set<Integer> preSet(int vertex) {
		return incomingEdges.get(vertex);
	}

	public LinkedList<String> getLabels(){
		return new LinkedList<String>(labels.values());
	}
	
	public String getLabel(int vertex) {
		return labels.get(vertex);
	}
	public Set<String> getLabels(Set<Integer> nodes){
		Set<String> result = new HashSet<String>();
		
		for (Integer node: nodes){
			result.add(getLabel(node));
		}
		
		return result;
	}
	public Integer getVertex(String label){
		for (Integer v: vertices){
			if (labels.get(v).equals(label)){
				return v;
			}
		}
		return Integer.MAX_VALUE;
	}
	
	/**
	 * @return vertices that do not have an incoming edge.
	 */
	public Set<Integer> sourceVertices(){
		Set<Integer> result = new HashSet<Integer>();
		for (Integer i: vertices){
			if (incomingEdges.get(i).isEmpty()){
				result.add(i);
			}
		}
		return result;
	}
	
	/**
	 * @return vertices that do not have an outgoing edge.
	 */	
	public Set<Integer> sinkVertices(){
		Set<Integer> result = new HashSet<Integer>();
		for (Integer i: vertices){
			if (outgoingEdges.get(i).isEmpty()){
				result.add(i);
			}
		}
		return result;
	}
	
	public String toString(){
		String result = "";
		for (Integer i: vertices){
			result += i + "(" + labels.get(i) + ") {";
			for (Iterator<Integer> j = incomingEdges.get(i).iterator(); j.hasNext();){
				int vertex = j.next();
				result += vertex;// + "(" + labels.get(vertex) + ")";
				result += j.hasNext()?",":"";
			}
			result += "} {";
			for (Iterator<Integer> j = outgoingEdges.get(i).iterator(); j.hasNext();){
				int vertex = j.next();
				result += vertex;// + "(" + labels.get(vertex) + ")";
				result += j.hasNext()?",":"";
			}
			result += "}\n";
		}
		return result;
	}
	
	/**
	 * @param vertex Vertex to determine the postSet for
	 * @param silent Set of vertices that should not be considered
	 * @return the postSet(vertex), in which all v \in silent are (recursively) replaced by their postSet(v)
	 */
	public Set<Integer> nonSilentPostSet(Integer vertex, Set<Integer> silent){
		return nonSilentPostSetHelper(vertex, silent, new HashSet<Integer>()); 
	}
	private Set<Integer> nonSilentPostSetHelper(Integer vertex, Set<Integer> silent, Set<Integer> visited){
		Set<Integer> result = new HashSet<Integer>();
		Set<Integer> visitedP = new HashSet<Integer>(visited);
		visitedP.add(vertex);
		
		for (Integer post: postSet(vertex)){
			if (!visited.contains(post)){
				if (silent.contains(post)){
					result.addAll(nonSilentPostSetHelper(post,silent,visitedP));
				}else{
					result.add(post);
				}
			}
		}
		return result;
	}
	
	/**
	 * @param vertex Vertex to determine the preSet for
	 * @param silent Set of vertices that should not be considered
	 * @return the preSet(vertex), in which all v \in silent are (recursively) replaced by their preSet(v)
	 */
	public Set<Integer> nonSilentPreSet(Integer vertex, Set<Integer> silent){
		return nonSilentPreSetHelper(vertex, silent, new HashSet<Integer>()); 
	}
	private Set<Integer> nonSilentPreSetHelper(Integer vertex, Set<Integer> silent, Set<Integer> visited){
		Set<Integer> result = new HashSet<Integer>();
		Set<Integer> visitedP = new HashSet<Integer>(visited);
		visitedP.add(vertex);
		
		for (Integer pre: preSet(vertex)){
			if (!visited.contains(pre)){
				if (silent.contains(pre)){
					result.addAll(nonSilentPreSetHelper(pre,silent,visitedP));
				}else{
					result.add(pre);
				}
			}
		}
		return result;
	}
	
	/**
	 * Returns A COPY OF the graph, such that all vertices from the given set are removed.
	 * All paths (v1,v),(v,v2) via a vertex v from that set are replaced by direct arcs (v1,v2). 
	 * 
	 * Formally: for G = (V, E, l)
	 * return (V-vertices, E', l-(vertices x labels)), where
	 * E' = E - ((V x vertices) U (vertices X V))
	 *    U {(v1, v2)|v \in vertices, (v1,v) \in E \land (v,v2) \in E}    
	 */
	public SimpleGraph removeVertices(Set<Integer> toRemove){
		Set<Integer> newVertices = new HashSet<Integer>(vertices);
		newVertices.removeAll(toRemove);

		Map<Integer,Set<Integer>> newOutgoingEdges = new HashMap<Integer,Set<Integer>>();
		Map<Integer,Set<Integer>> newIncomingEdges = new HashMap<Integer,Set<Integer>>();;
		Map<Integer,String> newLabels = new HashMap<Integer,String>();
		
		for (Integer newVertex: newVertices){
			newOutgoingEdges.put(newVertex, nonSilentPostSet(newVertex,toRemove));
			newIncomingEdges.put(newVertex, nonSilentPreSet(newVertex,toRemove));
			newLabels.put(newVertex, labels.get(newVertex));
		}
		
		return new SimpleGraph(newVertices, newOutgoingEdges, newIncomingEdges, newLabels);
	}
	
	/**
	 * Given subset of vertices of this graph, the method builds the corresponding subgraph.
	 * 
	 * @param _vertices Set of vertices in the subgraph
	 * @return The subgraph
	 */
	public SimpleGraph subgraph(Set<Integer> _vertices) {
		Set<Integer> newVertices = new HashSet<Integer>(vertices);
		newVertices.removeAll(_vertices);

		Map<Integer,Set<Integer>> newOutgoingEdges = new HashMap<Integer,Set<Integer>>();
		Map<Integer,Set<Integer>> newIncomingEdges = new HashMap<Integer,Set<Integer>>();;
		Map<Integer,String> newLabels = new HashMap<Integer,String>();
		
		for (Integer newVertex: newVertices) {
			HashSet<Integer> vertexSet = new HashSet<Integer>();
			for (Integer source: preSet(newVertex))
				if (newVertices.contains(source))
					vertexSet.add(source);
			newIncomingEdges.put(newVertex, vertexSet);
			
			vertexSet = new HashSet<Integer>();
			for (Integer target: postSet(newVertex))
				if (newVertices.contains(target))
					vertexSet.add(target);
			newOutgoingEdges.put(newVertex, vertexSet);
			
			newLabels.put(newVertex, labels.get(newVertex));
		}
		
		return new SimpleGraph(newVertices, newOutgoingEdges, newIncomingEdges, newLabels);
	}
	
	public void cutOutVertix(Integer toCutOut){
		
		if (incomingEdges.get(toCutOut).isEmpty()) {
			for (Integer post: new HashSet<Integer>(outgoingEdges.get(toCutOut))){
				incomingEdges.get(post).remove(toCutOut);
			}
		}
		else if (incomingEdges.get(toCutOut).isEmpty()) {
			for (Integer pre: new HashSet<Integer>(incomingEdges.get(toCutOut))){
				outgoingEdges.get(pre).remove(toCutOut);
			}
		}
		else {
			for (Integer pre: new HashSet<Integer>(incomingEdges.get(toCutOut))){
				outgoingEdges.get(pre).remove(toCutOut);
//				incomingEdges.get(toCutOut).remove(pre);
				
				for (Integer post: new HashSet<Integer>(outgoingEdges.get(toCutOut))){
					incomingEdges.get(post).remove(toCutOut);
//					outgoingEdges.get(toCutOut).remove(post);
								
					outgoingEdges.get(pre).add(post);
					incomingEdges.get(post).add(pre);
				}
			}
		}

				
		labels.remove(toCutOut);
		vertices.remove(toCutOut);
		outgoingEdges.remove(toCutOut);
		incomingEdges.remove(toCutOut);
	}

}
