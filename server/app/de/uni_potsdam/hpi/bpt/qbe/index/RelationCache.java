package de.uni_potsdam.hpi.bpt.qbe.index;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.ObjectInputStream;
import java.io.ObjectOutputStream;
import java.io.Serializable;
import java.util.HashMap;

public class RelationCache extends HashMap<String, RelationCacheRecord> implements Serializable {

	private static final long serialVersionUID = -1655641471640572650L;
	private static final String filename = "relationcache.bin";
	
	public static RelationCache load(File dir) throws ClassNotFoundException, IOException {
		// Read from disk using FileInputStream
		FileInputStream f_in = new 
			FileInputStream(dir.getAbsolutePath() + File.separator + filename);

		// Read object using ObjectInputStream
		ObjectInputStream obj_in = 
			new ObjectInputStream (f_in);

		// Read an object
		Object obj = obj_in.readObject();

		if (obj instanceof RelationCache) {
			// Cast object to a Vector
			return (RelationCache) obj;
		}
		else {
			throw new IOException("Unable to load relation cache. File not instance of RelationCache: " + dir.getAbsolutePath());
		}
	}
	
	public static void save(File dir, RelationCache cache) throws IOException {
		// Write to disk with FileOutputStream
		FileOutputStream f_out = new 
			FileOutputStream(dir.getAbsolutePath() + File.separator + filename);

		// Write object with ObjectOutputStream
		ObjectOutputStream obj_out = new
			ObjectOutputStream (f_out);

		// Write object out to disk
		obj_out.writeObject (cache);	
	}
	
}
