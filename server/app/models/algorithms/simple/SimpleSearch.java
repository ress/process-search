package models.algorithms.simple;

import models.Repository;
import models.SearchAlgorithm;
import models.SearchResult;
import org.jbpt.bp.MinimalKSuccessorRelation;
import org.jbpt.petri.NetSystem;
import org.jbpt.petri.Node;
import org.jbpt.petri.Transition;
import play.Logger;
import play.Play;

import java.io.File;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Set;

/**
 * Created with IntelliJ IDEA.
 * User: bart
 * Date: 13.08.13
 * Time: 20:46
 * To change this template use File | Settings | File Templates.
 */
public class SimpleSearch implements SearchAlgorithm {
    protected ArrayList<NetSystem> models = new ArrayList<>();

    @Override
    public String getIdentifier() {
        return "Simple Search";
    }

    @Override
    public ArrayList<Object> getAvailableParameters() {
        return new ArrayList<>();
    }

    @Override
    public HashMap<String, Object> getParameters() {
        return new HashMap<String, Object>();
    }

    @Override
    public void initialize() {
        String modelPath = Play.application().configuration().getString("search.modelpath");

        // Load models from central model storage directory
        File dir = new File(modelPath);
        for (String filename : dir.list()) {
            if (filename.matches(".*tpn") && Repository.shouldLoad(filename)) {
                NetSystem model = Repository.loadModel(filename);
                if (model != null) {
                    models.add(model);
                }
            }
        }
    }

    @Override
    public void initialize(HashMap<String, Object> parameters) {
        this.initialize();
    }

    @Override
    public ArrayList<SearchResult> search(NetSystem processModel) {
        ArrayList<SearchResult> results = new ArrayList<>();

        Set<Transition> query_transitions = processModel.getTransitions();
        for (NetSystem model : this.models) {
            boolean match = true;
			
			for (Transition query_transition : query_transitions) {
				boolean found = false;
				
				for (Transition t : model.getTransitions()) {
					if (t.getName().equals(query_transition.getName())) {
						found = true;
					}
				}
				match = match && found;
			}

            if (match)
                results.add(new SearchResult(model.getName(), processModel, 1));
        }

        return results;
    }
}
