import org.jbpt.bp.MinimalKSuccessorRelation;
import org.jbpt.petri.NetSystem;
import org.jbpt.petri.Node;
import org.jbpt.petri.io.WoflanSerializer;
import org.junit.Test;

import java.io.*;

import static org.fest.assertions.Assertions.*;

public class MinimalKSuccessorRelationTest {
    @Test
    public void minKsuccessorExport() {
        File file = new File("/Users/bart/Projekte/MA/EfficientSimilaritySearch/comin2011/tpn/1Be_2ft2_no_events.tpn");
        NetSystem net = WoflanSerializer.parse(file);
        net.setName("1Be_2ft2_no_events.tpn");
        MinimalKSuccessorRelation<NetSystem, Node> mink = new MinimalKSuccessorRelation<NetSystem, Node>(net);

        try {
            FileOutputStream fileOut =
                    new FileOutputStream("/tmp/mink.ser");
            ObjectOutputStream out =
                    new ObjectOutputStream(fileOut);
            out.writeObject(mink);
            out.close();
            fileOut.close();

            FileInputStream fileIn = new FileInputStream("/tmp/mink.ser");
            ObjectInputStream in = new ObjectInputStream(fileIn);
            try {
                MinimalKSuccessorRelation<NetSystem, Node> mink2 = (MinimalKSuccessorRelation<NetSystem, Node>) in.readObject();
                System.out.println(mink2.getNet().toString());
                mink2.printMatrix();
            } catch (ClassNotFoundException e) {
                e.printStackTrace();
            }
        } catch(IOException i)
        {
            i.printStackTrace();
        }


    }
}
