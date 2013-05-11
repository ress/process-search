package models;

import de.uni_potsdam.hpi.bpt.qbe.evaluation.Aggregate;
import de.uni_potsdam.hpi.bpt.qbe.evaluation.StopWatch;
import play.Logger;

import java.util.HashMap;
import java.util.Map;

/**
 * Created with IntelliJ IDEA.
 * User: bart
 * Date: 17.04.13
 * Time: 13:03
 * To change this template use File | Settings | File Templates.
 */
public class Measurement {
    private static Measurement instance = null;
    protected HashMap<String, StopWatch> stopWatches = null;
    protected HashMap<String, StopWatch> persistentStopWatches = null;
    protected HashMap<String, Integer> steppers = null;
    protected boolean persist = false;

    /* Measurement is a singleton */
    protected Measurement() {
        this.stopWatches = new HashMap<>();
        this.persistentStopWatches = new HashMap<>();
        this.steppers = new HashMap<>();
    }

    public static Measurement getInstance() {
        if(instance == null) {
            instance = new Measurement();
        }
        return instance;
    }

    /* Convenience access methods */

    public static StopWatch get(String name, boolean persistent) {
        return Measurement.getInstance().getStopWatch(name, persistent);
    }

    public static void start(String name) {
        Measurement.start(name, false);
    }

    public static void start(String name, boolean persistent) {
        Logger.info("StopWatch " + name + ": start");
        Measurement.getInstance().getStopWatch(name, persistent).start();
    }

    public static void stop(String name) {
        Measurement.stop(name, false);
    }

    public static void stop(String name, boolean persistent) {
        Logger.info("StopWatch " + name + ": stop");
        Measurement.getInstance().getStopWatch(name, persistent).stop();
    }

    public static void step(String name) {
        step(name, 1);
    }

    public static void step(String name, Integer amount) {
        Logger.info("Stepper" + name + ": step by " + amount.toString());
        Measurement.getInstance().addStep(name, amount);
    }

    public static void statistics() {
        Measurement.getInstance().printAllStatistics();
    }

    public static void clear() {
        Measurement.getInstance().clearStopWatches(false);
    }

    public static void clearPersistent() {
        Measurement.getInstance().clearStopWatches(true);
    }

    public static HashMap<String, StopWatch> getAllStopWatches() {
        return Measurement.getInstance()._getAllStopWatches();
    }

    public static HashMap<String, Integer> getAllSteppers() {
        return Measurement.getInstance()._getAllSteppers();
    }

    public static void setPersist(boolean persist) {
        Measurement.getInstance().persist = persist;
    }

    /* Actual implementations of stopwatch management */

    protected void addStep(String name, Integer amount) {
        if (this.steppers.containsKey(name)) {
            this.steppers.put(name, this.steppers.get(name) + amount);
        } else {
            this.steppers.put(name, amount);
        }
    }

    protected StopWatch getStopWatch(String name, boolean persistent) {
        if (persistent) {
            if (this.persistentStopWatches.containsKey(name)) {
                return this.persistentStopWatches.get(name);
            } else {
                this.persistentStopWatches.put(name, new StopWatch());
                return this.persistentStopWatches.get(name);
            }
        } else {
            if (this.stopWatches.containsKey(name)) {
                return this.stopWatches.get(name);
            } else {
                this.stopWatches.put(name, new StopWatch());
                return this.stopWatches.get(name);
            }
        }
    }

    protected void clearStopWatches(boolean persistent) {
        if (this.persist && persistent) {
            this.persistentStopWatches.clear();
            this.stopWatches.clear();
            return;
        } else if (this.persist) {
            return;
        }

        if (persistent) {
            this.persistentStopWatches.clear();
        } else {
            this.stopWatches.clear();
        }
    }

    protected HashMap<String, StopWatch> _getAllStopWatches() {
        HashMap<String, StopWatch> stopWatches = new HashMap<>();

        if (this.stopWatches.size() > 0)
            stopWatches.putAll(this.stopWatches);

        if (this.persistentStopWatches.size() > 0)
            stopWatches.putAll(this.persistentStopWatches);

        return stopWatches;
    }

    protected HashMap<String, Integer> _getAllSteppers() {
        return (HashMap<String, Integer>) this.steppers.clone();
    }

    protected void printAllStatistics() {
        for (Map.Entry<String, StopWatch> entry : this.stopWatches.entrySet()) {
            Aggregate<Long> statistics = entry.getValue().statistics();
            System.out.println("==/ " + entry.getKey() + " \\==");
            if (entry.getValue().numLaps() > 0) {
                System.out.println("size: " + statistics.size());
                System.out.println("min: " + entry.getValue().formatMs(statistics.min()));
                System.out.println("max: " + entry.getValue().formatMs(statistics.max()));
                System.out.println("avg: " + entry.getValue().formatMs(Aggregate.r(statistics.avg(), 4)));
                System.out.println("median: " + entry.getValue().formatMs(Aggregate.r(statistics.median(), 4)));
                System.out.println("quartile: " + entry.getValue().formatMs(Aggregate.r(statistics.quantile(0.25), 4)));
                System.out.println("quantile(0.9): " + entry.getValue().formatMs(Aggregate.r(statistics.quantile(0.9), 4)));
                System.out.println("variance: " + entry.getValue().formatMs(Aggregate.r(statistics.variance(), 4)));
                System.out.println("std deviation: " + entry.getValue().formatMs(Aggregate.r(Math.sqrt(statistics.variance()), 4)));
            } else {
                System.out.println("No measurements.");
            }
        }
    }
}