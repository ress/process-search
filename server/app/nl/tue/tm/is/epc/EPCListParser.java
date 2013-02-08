package nl.tue.tm.is.epc;

import java.util.HashSet;
import java.util.Set;

import org.xml.sax.Attributes;
import org.xml.sax.SAXException;
import org.xml.sax.helpers.DefaultHandler;

public class EPCListParser extends DefaultHandler {

	Set<String> epcNames = new HashSet<String>();
	Set<String> epcIds = new HashSet<String>();
	
	@Override
	public void startElement(String namespace, String lname, String qname, Attributes attrs) throws SAXException {
		for (int i = 0; i < attrs.getLength(); i++){
			if (attrs.getQName(i).toLowerCase().equals("name")){
				epcNames.add(attrs.getValue(i));
			}else if (attrs.getQName(i).toLowerCase().equals("epcid")){
				epcIds.add(attrs.getValue(i));
			}

		}		
	}
	
	public Set<String> getEPCNames(){
		return epcNames;
	}
	
	public Set<String> getEPCIds(){
		return epcIds;
	}

}
