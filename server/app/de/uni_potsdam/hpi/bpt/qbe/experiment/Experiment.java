package de.uni_potsdam.hpi.bpt.qbe.experiment;

import java.io.File;

import org.jbpt.petri.NetSystem;
import org.jbpt.petri.Node;
import org.jbpt.petri.PetriNet;
import org.jbpt.petri.io.WoflanSerializer;


public abstract class Experiment {

	protected static String MODEL_PATH = null; 
	protected static String NO_EVENTS = "_no_events";
	
	public NetSystem loadModel(String name) {
		String filename = name;
		// fix filenames
		if (null != NO_EVENTS && !NO_EVENTS.isEmpty()) {
			name = name.replace(".epml", NO_EVENTS+".tpn");
		} else {
			name = name.replace(".epml", ".tpn");
		}
		
		// remove possibly trailing / (\)
		MODEL_PATH = MODEL_PATH.replaceAll(File.separator + "$", "");
		
		File file = new File(MODEL_PATH + File.separator + name);
		
		if (!file.exists()) {
			return null;
		}
		
		NetSystem net = WoflanSerializer.parse(file);
		net.setName(filename);
		
		return net;
	}
}
