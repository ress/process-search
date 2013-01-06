import sbt._
import Keys._
import play.Project._

object ApplicationBuild extends Build {

    val appName         = "server"
    val appVersion      = "1.0-SNAPSHOT"

    val appDependencies = Seq(
      javaCore
      // Add your project dependencies here,
      //"org.jbpt" % "jbpt" % "0.2.348"
    )

    val main = play.Project(appName, appVersion, appDependencies).settings(
      // Add your own project settings here      
      // Asset path
      //playAssetsDirectories <+= baseDirectory / "../editor/"
    )

}
