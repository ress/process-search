package models.algorithms.similarity;

import de.uni_potsdam.hpi.bpt.qbe.index.RelationInvertedIndex;
import models.Repository;
import models.SearchAlgorithm;
import models.SearchResult;
import models.simsearch.ExperimentMetric;
import models.simsearch.IDatapoint;
import models.simsearch.SimpleGraphDatapoint;
import models.simsearch.metrics.GED;
import org.jbpt.petri.NetSystem;
import java.io.File;

import org.jbpt.petri.PetriNet;
import org.jbpt.petri.io.WoflanSerializer;
import nl.tue.ieis.is.similarity.algos.DistanceAlgo;
import nl.tue.ieis.is.similarity.algos.GraphEditDistance;
import nl.tue.ieis.is.similarity.algos.GraphEditDistanceGreedy;
import nl.tue.ieis.is.similarity.graph.SimpleGraph;
import play.Logger;
import play.Play;
import xxl.core.collections.containers.Container;
import xxl.core.collections.containers.MapContainer;
import xxl.core.collections.queues.DynamicHeap;
import xxl.core.cursors.filters.Taker;
import xxl.core.functions.AbstractFunction;
import xxl.core.indexStructures.MTree;
import xxl.core.indexStructures.Sphere;
import xxl.core.indexStructures.Tree;


import java.io.IOException;
import java.util.*;

/**
 * Created with IntelliJ IDEA.
 * User: bart
 * Date: 07.02.13
 * Time: 13:00
 * To change this template use File | Settings | File Templates.
 */
public class GEDSimilaritySearch implements SearchAlgorithm
{
    public MTree tree;
    public ExperimentMetric metric;
    private AbstractFunction<IDatapoint, Sphere> getDescriptor;
    protected static final float QUERY_RADIUS = 0.5f;
    protected static final int QUERY_K = 10;
    protected static final int QUERY_LOOKAHEAD = 10000;
    public Set<IDatapoint> loadedModels = new HashSet<IDatapoint>();

    // Hardcoded to 50 in Matthias' code
    public int nodesize = 10;

    @Override
    public String getIdentifier() {
        return "GEDSimilaritySearch";
    }

    public ExperimentMetric getMetric() {
        return new GED();
    }

    @Override
    public ArrayList<Object> getAvailableParameters() {
        return new ArrayList<Object>();
    }

    @Override
    public HashMap<String, Object> getParameters() {
        return null;  //To change body of implemented methods use File | Settings | File Templates.
    }

    @Override
    public void initialize() {
        this.metric = this.getMetric();

        final ExperimentMetric m = this.metric;
        this.getDescriptor = new AbstractFunction<IDatapoint, Sphere>() {
            public Sphere invoke(IDatapoint pointToStore) {
                return new Sphere(pointToStore, 0.0, null, -1, m);
            }
        };

        this.initializeTree();

        try {
            String modelPath = Play.application().configuration().getString("search.modelpath");
            File dir = new File(modelPath);
            if (!dir.exists() || !dir.isDirectory()) {
                throw new IOException("Model path is not a valid directory: " + modelPath);
            }
            Logger.info("Starting to load process models");
            for (String filename : dir.list()) {
                if (filename.matches(".*tpn") && Repository.shouldLoad(filename)) {
                    IDatapoint datapoint = this.getDataPoint(filename);

                    if (datapoint != null) {
                        loadedModels.add(datapoint);
                        tree.insert(datapoint);
                        Logger.info("Loaded one");
                    }
                }
            }
            Logger.info("Finished loading process models");
        } catch (Exception e) {
            Logger.error("Could not load models", e);
        }


    }

    @Override
    public void initialize(HashMap<String, Object> parameters) {
        initialize();
    }

    @Override
    public ArrayList<SearchResult> search(NetSystem processModel) {
        ArrayList<SearchResult> results = new ArrayList<SearchResult>();
        IDatapoint query = new SimpleGraphDatapoint(processModel);
        query.setId("SearchQuery");

        // knn query ---------------------------------------------------------------------------
        final Sphere queryPoint = new Sphere(query, 0.5, null, -1, this.metric);
        // internal NN Query Cursor deals with a candidate objects
        Comparator distanceComparator = new Comparator () {
           public int compare (Object candidate1, Object candidate2) {
                double sphereDist1 = queryPoint.sphereDistance((Sphere)((Tree.Query.Candidate)candidate1).descriptor());
                double sphereDist2 = queryPoint.sphereDistance((Sphere)((Tree.Query.Candidate)candidate2).descriptor());
                return sphereDist1 < sphereDist2 ? -1 : sphereDist1 == sphereDist2 ? 0 : 1;
            }
        };

        //Sphere queryPoint = new Sphere(query, QUERY_RADIUS, null, -1, this.metric);
        //Iterator<IDatapoint> result = this.tree.query(queryPoint);
        //while(result.hasNext()) {
        //    IDatapoint current = result.next();

            //Sphere obj = (Sphere)((Tree.Query.Candidate)current).descriptor();
            //System.out.println(obj.center() + "; distance to query point:  " + queryPoint.centerDistance(obj) );
        //    results.add(new SearchResult(current.getId(), null));
        //}

        // run k-NN use taker get 5-NN points
        // Note: mtree.query(queue) method deals with object of Type candidate
        // to extract actual data we should call candidate.descriptor() or entry() method
        Iterator kNNresult = new Taker(this.tree.query(new DynamicHeap(distanceComparator)), QUERY_K);
        while(kNNresult.hasNext()){
            Sphere obj = (Sphere)((Tree.Query.Candidate)kNNresult.next()).descriptor();
            IDatapoint current = (IDatapoint) ((Sphere) ((Tree.Query.Candidate)kNNresult.next()).descriptor()).center();
        //    // no_results ++;
            System.out.println(obj.center() + "; distance to query point:  " + queryPoint.centerDistance(obj) );
        //
            results.add(new SearchResult(((SimpleGraphDatapoint)obj.center()).getId(), null));
        }


        return results;  //To change body of implemented methods use File | Settings | File Templates.
    }

    public IDatapoint getDataPoint(String modelFileName) {
        SimpleGraphDatapoint sg = null;

        try {
            NetSystem net = Repository.loadModel(modelFileName);
            if (net == null) {
                throw new RuntimeException("Unable to load model: " + modelFileName);
            }

            sg = new SimpleGraphDatapoint(net);
            sg.setId(modelFileName);

        } catch (Exception e) {
            e.printStackTrace();
        }

        return sg;
    }

    protected void initializeTree() {
        this.tree = new MTree(this.metric);

        Container treeContainer = new MapContainer();
        int maxCapacity = this.nodesize;
        int minCapacity = (int)(maxCapacity * 0.33);

        this.tree.initialize(this.getDescriptor, treeContainer, minCapacity, maxCapacity);
    }
}
