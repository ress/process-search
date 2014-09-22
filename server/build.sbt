name := """server"""

version := "1.0"

lazy val root = (project in file(".")).enablePlugins(PlayJava, SbtWeb)

scalaVersion := "2.11.1"

libraryDependencies ++= Seq(
  "org.apache.lucene" % "lucene-core" % "3.6.1",
  "org.apache.lucene" % "lucene-analyzers" % "3.6.1",
  "com.google.guava" % "guava" % "14.0.1"
)
