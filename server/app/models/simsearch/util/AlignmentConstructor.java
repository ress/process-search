package models.simsearch.util;

/**
 * Created with IntelliJ IDEA.
 * User: bart
 * Date: 07.02.13
 * Time: 21:36
 * To change this template use File | Settings | File Templates.
 */
import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

import nl.tue.ieis.is.similarity.graph.SimpleGraph;
import nl.tue.ieis.is.similarity.graph.TwoVertices;

import org.jbpt.alignment.Alignment;
import org.jbpt.bp.RelSet;
import org.jbpt.petri.NetSystem;
import org.jbpt.petri.Node;
import org.jbpt.petri.PetriNet;
import org.jbpt.petri.Transition;
/*import org.jbpt.petri.Transition;
import org.processmining.analysis.causality.CausalFootprintSimilarityResult;
import org.processmining.framework.log.LogEvent;
import org.processmining.framework.models.LogEventProvider;
import org.processmining.framework.models.ModelGraphVertex;
import org.processmining.framework.models.causality.CausalFootprint;

import de.hpi.bpt.alignment.Alignment;
import de.hpi.bpt.process.petri.Node;
import de.hpi.bpt.process.petri.PetriNet;
import de.hpi.bpt.process.petri.Transition;
import de.hpi.bpt.process.petri.bp.RelSet;*/

public class AlignmentConstructor {

    public static final double SED_THRESHOLD = 0.7;

    public static Alignment<RelSet<NetSystem, Node>, Node> getAlignment(RelSet<NetSystem,Node> bp1, RelSet<NetSystem,Node> bp2) {
        Alignment<RelSet<NetSystem, Node>, Node> al = new Alignment<RelSet<NetSystem,Node>, Node>(bp1, bp2);

        outer:
        for (Node t1 : bp1.getModel().getEntities()) {
            if (!isValidLabel(t1.getLabel()))
                continue;
            if (!(t1 instanceof Transition))
                continue;

            for (Node t2 : bp2.getModel().getEntities()) {
                if (!isValidLabel(t2.getLabel()))
                    continue;
                if (!(t2 instanceof Transition))
                    continue;
                if (StringEditDistance.similarity(t1.getLabel(), t2.getLabel())>= SED_THRESHOLD) {
                    al.addElementaryCorrespondence(t1, t2);
                    continue outer;
                }
            }
        }

        return al;
    }

    public static Map<Node, Node> getAlignment(PetriNet net1, PetriNet net2) {

        Map<Node, Node> matches = new HashMap<Node, Node>();

        outer:
        for (Node t1 : net1.getTransitions()) {
            if (!isValidLabel(t1.getLabel()))
                continue;

            for (Node t2 : net2.getTransitions()) {
                if (!isValidLabel(t2.getLabel()))
                    continue;

                double sed = StringEditDistance.similarity(t1.getLabel(), t2.getLabel());

                @SuppressWarnings("unused")
                int _ =0;

                if (sed >= SED_THRESHOLD) {
                    matches.put(t1,t2);
                    continue outer;
                }
            }
        }

        return matches;
    }


    public static boolean isValidLabel(String label) {
//		if (label == null) return false;
        if (label.toLowerCase().contains("start event")) return false;
        if (label.toLowerCase().contains("start function")) return false;
        if (label.toLowerCase().contains("stop event")) return false;
        if (label.toLowerCase().contains("stop function")) return false;
        if (label.contains("_transition")) return false;
        if (label.contains("_helper_")) return false;

        return true;
    }

    public static Set<TwoVertices> getAlignmentForSimpleGraphs(SimpleGraph sg1, SimpleGraph sg2) {
        return getAlignmentForSimpleGraphs(sg1, sg2, false);
//		Set<TwoVertices> mapping = new HashSet<TwoVertices>();
//
//		outer:
//		for (Integer n1 : sg1.getVertices()) {
//			if (!isValidLabel(sg1.getLabel(n1)))
//				continue;
//
//			for (Integer n2 : sg2.getVertices()) {
//				if (!isValidLabel(sg2.getLabel(n2)))
//					continue;
//
//				if (StringEditDistance.similarity(sg1.getLabel(n1), sg2.getLabel(n2)) >= SED_THRESHOLD) {
//					mapping.add(new TwoVertices(n1, n2));
//					continue outer;
//				}
//			}
//		}
//		return mapping;
    }

    public static Set<TwoVertices> getAlignmentForSimpleGraphs(SimpleGraph sg1, SimpleGraph sg2, boolean allVertices) {
        Set<TwoVertices> _mapping = new HashSet<TwoVertices>();

        Map<Integer, Map<Integer, Double>> mapping = new HashMap<Integer, Map<Integer,Double>>();

        outer:
        for (Integer n1 : sg1.getVertices()) {
            if (!allVertices && !isValidLabel(sg1.getLabel(n1))) {
                continue;
            }

            for (Integer n2 : sg2.getVertices()) {
                if (!allVertices && !isValidLabel(sg2.getLabel(n2))) {
                    continue outer;
                }

                double sim = StringEditDistance.similarity(sg1.getLabel(n1), sg2.getLabel(n2));

                if (sim >= SED_THRESHOLD) {
                    if (!mapping.containsKey(n1)) {
                        mapping.put(n1, new HashMap<Integer, Double>());
                    }

                    Map<Integer, Double> m1 = mapping.get(n1);
                    if (!m1.containsKey(n2)) {
                        m1.put(n2, sim);
                    }

                    if (m1.get(n2) < sim) {
                        m1.put(n2, sim);
                    }
                }
            }
        }

        for (int n1 : mapping.keySet()) {
            for (int n2 : mapping.get(n1).keySet()) {
                _mapping.add(new TwoVertices(n1, n2));
            }
        }

        return _mapping;
    }

    /*public static HashMap<LogEventProvider, LogEventProvider> getAlignmentForFootprints(CausalFootprint c1, CausalFootprint c2) {
        HashMap<LogEventProvider, LogEventProvider> mapping = new HashMap<LogEventProvider, LogEventProvider>();

        for (ModelGraphVertex t1 : c1.getBaseModel().getVerticeList()) {
            if (!(t1 instanceof org.processmining.framework.models.petrinet.Transition))
                continue;

            if (((org.processmining.framework.models.petrinet.Transition)t1).getLogEvent() == null)
                continue;

            LogEvent ev1 = ((org.processmining.framework.models.petrinet.Transition)t1).getLogEvent();

            for (ModelGraphVertex t2 : c2.getBaseModel().getVerticeList()) {
                if (!(t2 instanceof org.processmining.framework.models.petrinet.Transition))
                    continue;

                if (((org.processmining.framework.models.petrinet.Transition)t2).getLogEvent() == null)
                    continue;

                LogEvent ev2 = ((org.processmining.framework.models.petrinet.Transition)t2).getLogEvent();

                if (StringEditDistance.similarity(ev1.getModelElementName(), ev2.getModelElementName())>= SED_THRESHOLD) {
                    mapping.put((org.processmining.framework.models.petrinet.Transition)t1, (org.processmining.framework.models.petrinet.Transition)t2);
                    break;
                }
            }
            if (!mapping.containsKey((org.processmining.framework.models.petrinet.Transition)t1))
                mapping.put((org.processmining.framework.models.petrinet.Transition)t1,CausalFootprintSimilarityResult.NOMAP);
        }

        return mapping;
    }*/
}
