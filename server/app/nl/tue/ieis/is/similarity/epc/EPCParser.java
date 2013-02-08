package nl.tue.ieis.is.similarity.epc;

import java.util.HashMap;
import java.util.Map;

import org.xml.sax.Attributes;
import org.xml.sax.SAXException;
import org.xml.sax.helpers.DefaultHandler;

public class EPCParser extends DefaultHandler{

	private static final int STATE_NONE = 0;
	private static final int STATE_FUNCTION = 1;
	private static final int STATE_FUNCTION_NAME = 2;
	private static final int STATE_EVENT = 4;
	private static final int STATE_EVENT_NAME = 5;
	private static final int STATE_CONNECTOR = 7;
	private static final int STATE_ARC = 10;
	
	private Node currNode;
	private Arc currArc;
	private Map<Arc,String> arcToSource; //Store the nodes that arcs connect. Add those last.
	private Map<Arc,String> arcToTarget; //Store the nodes that arcs connect. Add those last.
	private int currState;

	private EPC result;

	public EPCParser(EPC result) {
		super();
		arcToSource = new HashMap<Arc,String>();
		arcToTarget = new HashMap<Arc,String>();
		this.result = result;
	}
	
	public void characters(char[] arr, int start, int len) throws SAXException {
		switch (currState){
		case STATE_FUNCTION_NAME:
		case STATE_EVENT_NAME:
			currNode.setName(currNode.getName().concat(new String(arr, start, len)));
		default:
			break;
		}
	}

	public void endElement(String namespace, String lname, String qname) throws SAXException {
		//At the end, connect all arcs
		if (qname.toLowerCase().equals("epml")){
			for (Map.Entry<Arc, String> as: arcToSource.entrySet()){
				as.getKey().setSource(result.findNode(as.getValue()));
				as.getKey().setTarget(result.findNode(arcToTarget.get(as.getKey())));
				result.addArc(as.getKey());
			}
		}
		switch (currState){
		case STATE_NONE:
			break;
		case STATE_FUNCTION:
			if (qname.toLowerCase().equals("function")){
				currState = STATE_NONE;				
			}
			break;
		case STATE_FUNCTION_NAME:
			if (qname.toLowerCase().equals("name")){
				currState = STATE_FUNCTION;				
			}
			break;
		case STATE_EVENT:
			if (qname.toLowerCase().equals("event")){
				currState = STATE_NONE;				
			}
			break;
		case STATE_EVENT_NAME:
			if (qname.toLowerCase().equals("name")){
				currState = STATE_EVENT;				
			}
			break;
		case STATE_CONNECTOR:
			if (qname.toLowerCase().equals("connector")){
				currState = STATE_NONE;				
			}
			break;
		case STATE_ARC:
			if (qname.toLowerCase().equals("arc")){
				currState = STATE_NONE;				
			}
			break;
		default:
			break;
		}
	}

	public void startElement(String namespace, String lname, String qname, Attributes attrs) throws SAXException {
		if (qname.toLowerCase().equals("function")){
			currNode = new Function();
			for (int i = 0; i < attrs.getLength(); i++){
				if (attrs.getQName(i).toLowerCase().equals("id")){
					currNode.setId(attrs.getValue(i));
				}
			}
			result.addFunction((Function)currNode);
			currState = STATE_FUNCTION;
		}else if (qname.toLowerCase().equals("event")){
			currNode = new Event();
			for (int i = 0; i < attrs.getLength(); i++){
				if (attrs.getQName(i).toLowerCase().equals("id")){
					currNode.setId(attrs.getValue(i));
				}
			}
			result.addEvent((Event)currNode);
			currState = STATE_EVENT;
		}else if (qname.toLowerCase().equals("or") || qname.toLowerCase().equals("xor") || qname.toLowerCase().equals("and")){
			currNode = new Connector();
			if (qname.toLowerCase().equals("or")){
				currNode.setName(Connector.ORLabel);
			}else if (qname.toLowerCase().equals("xor")){
				currNode.setName(Connector.XORLabel);				
			}else if (qname.toLowerCase().equals("and")){
				currNode.setName(Connector.ANDLabel);
				
			}
			for (int i = 0; i < attrs.getLength(); i++){
				if (attrs.getQName(i).toLowerCase().equals("id")){
					currNode.setId(attrs.getValue(i));
				}
			}
			result.addConnector((Connector)currNode);
			currState = STATE_CONNECTOR;
		}else if (qname.toLowerCase().equals("arc")){
			currArc = new Arc();
			for (int i = 0; i < attrs.getLength(); i++){
				if (attrs.getQName(i).toLowerCase().equals("id")){
					currArc.setId(attrs.getValue(i));
				}
			}
			currState = STATE_ARC;
		}else if (qname.toLowerCase().equals("name")){
			if (currState == STATE_FUNCTION){
				currState = STATE_FUNCTION_NAME;
			}else if (currState == STATE_EVENT){
				currState = STATE_EVENT_NAME;
			}
		}else if (qname.toLowerCase().equals("flow")){
			String src = "";
			String tgt = "";
			for (int i = 0; i < attrs.getLength(); i++){
				if (attrs.getQName(i).toLowerCase().equals("source")){
					src = attrs.getValue(i);
				}else if (attrs.getQName(i).toLowerCase().equals("target")){
					tgt = attrs.getValue(i);
				} 
			}
			arcToSource.put(currArc, src);
			arcToTarget.put(currArc, tgt);
		}
	}
	
}
