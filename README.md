# Visual business process model search

Based on process search techniques by Dr. Matthias Kunze<sup>[[thesis]](http://opus.kobv.de/ubp/volltexte/2013/6884/)</sup>.

## Overview

The idea behind this project is to provide a business model search platform that can act as a playground for testing, developing and understanding process model search techniques that use a visual query language.

# Development environment

## Install JDK 7

You can download it at http://www.oracle.com/technetwork/java/javase/downloads/jdk7-downloads-1880260.html

## Setup Play Framework's *activator*

Get it from http://typesafe.com/platform/getstarted, or use your favorite package management tool.

OS X: ```brew install typesafe-activator```

## Clone this repository

```git clone git@github.com:ress/process-search.git```

# Starting and using the search engine

To use the search engine you need business process models in TPN format. *We're seeing if we can provide some sample modules.* The model search path is defined in ```server/app/conf/application.conf``` in the ```search.modelpath``` variable.

To start the server:
```
/ $ cd server
server/ $ activator run
```

Access the search interface at [http://localhost:9000/](http://localhost:9000/) and the evaluation interface at [http://localhost:9000/evaluation/index.html](http://localhost:9000/evaluation/index.html).
