package test;

import models.BusinessProcess;
import org.jbpt.pm.Activity;
import org.jbpt.pm.ProcessModel;
import org.junit.*;

import play.Logger;
import play.mvc.*;
import play.test.*;
import play.libs.F.*;

import static play.test.Helpers.*;
import static org.fest.assertions.Assertions.*;

public class JsonBpmnImportTest {

    @Test
    public void simpleCheck() {
        int a = 1 + 1;
        assertThat(a).isEqualTo(2);
    }

    @Test
    public void importFailsOnBrokenJsonModels() {
        assertThat(BusinessProcess.fromJsonString("foobar")).isNull();
    }

    @Test
    public void importSimpleJsonModel() {
        String simpleJsonModel = "{\"resourceId\":\"oryx-canvas\",\"properties\":{\"id\":\"\",\"name\":\"\",\"documentation\":\"\",\"auditing\":\"\",\"monitoring\":\"\",\"version\":\"\",\"author\":\"\",\"language\":\"English\",\"targetnamespace\":\"http://www.omg.org/bpmn20\",\"expressionlanguage\":\"\",\"querylanguage\":\"\",\"creationdate\":\"\",\"modificationdate\":\"\",\"pools\":\"\"},\"stencil\":{\"id\":\"BPMNDiagram\"},\"childShapes\":[{\"resourceId\":\"oryx_2D1BB8E7-36DB-46B2-A707-F053B683C5A9\",\"properties\":{\"id\":\"\",\"name\":\"Task 1\",\"documentation\":\"\",\"auditing\":\"\",\"monitoring\":\"\",\"categories\":\"\",\"startquantity\":1,\"completionquantity\":1,\"status\":\"None\",\"performers\":\"\",\"properties\":\"\",\"inputsets\":\"\",\"inputs\":\"\",\"outputsets\":\"\",\"outputs\":\"\",\"iorules\":\"\",\"testtime\":\"After\",\"mi_condition\":\"\",\"mi_flowcondition\":\"All\",\"isforcompensation\":\"\",\"assignments\":\"\",\"pool\":\"\",\"lanes\":\"\",\"looptype\":\"None\",\"loopcondition\":\"\",\"loopcounter\":1,\"loopmaximum\":1,\"callacitivity\":\"\",\"activitytype\":\"Task\",\"tasktype\":\"None\",\"inmessage\":\"\",\"outmessage\":\"\",\"implementation\":\"Webservice\",\"complexmi_condition\":\"\",\"messageref\":\"\",\"operationref\":\"\",\"taskref\":\"\",\"instantiate\":\"\",\"script\":\"\",\"bgcolor\":\"#ffffcc\"},\"stencil\":{\"id\":\"Task\"},\"childShapes\":[],\"outgoing\":[{\"resourceId\":\"oryx_DDBCA427-0D2F-41E3-B933-59CAE4E2C7C8\"}],\"bounds\":{\"lowerRight\":{\"x\":303,\"y\":274},\"upperLeft\":{\"x\":203,\"y\":194}},\"dockers\":[]},{\"resourceId\":\"oryx_B96832AE-AF3A-43D3-BB3C-C4E1C3C36B89\",\"properties\":{\"id\":\"\",\"name\":\"Task 2\",\"documentation\":\"\",\"auditing\":\"\",\"monitoring\":\"\",\"categories\":\"\",\"startquantity\":1,\"completionquantity\":1,\"status\":\"None\",\"performers\":\"\",\"properties\":\"\",\"inputsets\":\"\",\"inputs\":\"\",\"outputsets\":\"\",\"outputs\":\"\",\"iorules\":\"\",\"testtime\":\"After\",\"mi_condition\":\"\",\"mi_flowcondition\":\"All\",\"isforcompensation\":\"\",\"assignments\":\"\",\"pool\":\"\",\"lanes\":\"\",\"looptype\":\"None\",\"loopcondition\":\"\",\"loopcounter\":1,\"loopmaximum\":1,\"callacitivity\":\"\",\"activitytype\":\"Task\",\"tasktype\":\"None\",\"inmessage\":\"\",\"outmessage\":\"\",\"implementation\":\"Webservice\",\"complexmi_condition\":\"\",\"messageref\":\"\",\"operationref\":\"\",\"taskref\":\"\",\"instantiate\":\"\",\"script\":\"\",\"bgcolor\":\"#ffffcc\"},\"stencil\":{\"id\":\"Task\"},\"childShapes\":[],\"outgoing\":[],\"bounds\":{\"lowerRight\":{\"x\":505,\"y\":274},\"upperLeft\":{\"x\":405,\"y\":194}},\"dockers\":[]},{\"resourceId\":\"oryx_DDBCA427-0D2F-41E3-B933-59CAE4E2C7C8\",\"properties\":{\"id\":\"\",\"name\":\"\",\"documentation\":\"\",\"auditing\":\"\",\"monitoring\":\"\",\"conditiontype\":\"None\",\"conditionexpression\":\"\",\"showdiamondmarker\":\"\"},\"stencil\":{\"id\":\"SequenceFlow\"},\"childShapes\":[],\"outgoing\":[{\"resourceId\":\"oryx_B96832AE-AF3A-43D3-BB3C-C4E1C3C36B89\"}],\"bounds\":{\"lowerRight\":{\"x\":404.2890625,\"y\":235},\"upperLeft\":{\"x\":303.7109375,\"y\":233}},\"dockers\":[{\"x\":50,\"y\":40,\"id\":\"oryx_DDBCA427-0D2F-41E3-B933-59CAE4E2C7C8_0\"},{\"x\":50,\"y\":40,\"id\":\"oryx_DDBCA427-0D2F-41E3-B933-59CAE4E2C7C8_2\"}],\"target\":{\"resourceId\":\"oryx_B96832AE-AF3A-43D3-BB3C-C4E1C3C36B89\"}}],\"bounds\":{\"lowerRight\":{\"x\":1920,\"y\":1080},\"upperLeft\":{\"x\":0,\"y\":0}},\"stencilset\":{\"url\":\"http://localhost:9000/editor/gadget/../oryx/editor/data/stencilsets/bpmn2.0/bpmn2.0.json\",\"namespace\":\"http://b3mn.org/stencilset/bpmn2.0#\"},\"ssextensions\":[]}";

        ProcessModel bp = BusinessProcess.fromJsonString(simpleJsonModel);
        assertThat(bp).isNotNull();
        assertThat(bp.getActivities().size()).isEqualTo(2);
        assertThat(bp.getEdges().size()).isEqualTo(1);

        for (Activity a : bp.getActivities()) {
            Logger.info(a.getLabel());
        }
    }

}