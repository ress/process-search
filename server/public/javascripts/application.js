var stencilSetName = _getStencilSetName();

function onOryxResourcesLoaded(){
    window.ORYXEditor = new ORYX.Editor({
        'id': 'oryx-canvas',
        'stencilset': {
            'url': ORYX.CONFIG.ROOT_PATH + 'editor/data/stencilsets/' + stencilSetName + '/' + stencilSetName + '.json'
        },
        'fullscreen': false,
        'height': 350
    });

    window.ORYXEditor.importJSON(localStorage.getItem("lastModel"));
}

function _getStencilSetName() {
    if (stencilSetName) {
        return stencilSetName;
    }

    stencilSetName = "bpmn-search";
    var urlquery = location.href.split("?");
    if (urlquery[1]) {
        var urlterms = urlquery[1].split(",");
        for (var i = 0; i < urlterms.length; i++) {
            if (urlterms[i].indexOf("stencilSetName=") == 0) {
                stencilSetName = urlterms[i].slice("stencilSetName=".length);
                break;
            }
        }
    }
    return stencilSetName;
}


angular.module('searchModule', [], function($provide) {
    $provide.factory('processSearch', function() {
       var selectedAlgorithm;
       var search = {};

       search.algorithms = [
           { name: 'Querying by Example', short: 'qbe' },
           { name: 'Similarity Search', short: 'simsearch' }
       ];

       search.setAlgorithm = function(algorithm) {
           selectedAlgorithm = algorithm;
       };

       selectedAlgorithm = search.algorithms[1].name;
       search.time = 0;
       search.results = [];
       return search;
    });
});

function SearchCtrl($scope, $window, $http, processSearch) {
    $scope.search = function() {
        var model = $window.ORYXEditor.getSerializedJSON();
        var params = {
            algorithm: processSearch.algorithm,
            json: model
        };

        localStorage.setItem("lastModel", model);

        $http({ method: 'POST', url: '/search', data: params})
            .success(function(data) {

                processSearch.results = data.models;
                processSearch.time = data.time;

                setTimeout(function() {
                    window.scrollTo(0,jQuery(".searchbar-container").height() + 20);

                    setTimeout(function() {
                        for (var i = 0; i < data.models.length; i++) {
                            new PetriNetGraph(data.models[i].dot, "#graph-" + i);
                        }
                    }, 1);
                }, 1);
            });
    };
}

function ResultsCtrl($scope, processSearch) {
    $scope.$watch(function() { return processSearch.time; }, function(time) {
        $scope.time = time;
    });

    $scope.$watch(function() { return processSearch.results; }, function(results) {
        $scope.results = results;
    });
};

function AlgorithmCtrl($scope, processSearch) {
    //$scope.algorithms = processSearch.algorithms;
    $scope.$watch(function() { return processSearch.algorithms; }, function(algorithms) {
        $scope.algorithms = algorithms;
    });

    $scope.$watch(function() { return processSearch.algorithm; }, function(algorithm) {
        $scope.algorithmSelected = algorithm;
    });

    $scope.$watch('algorithmSelected', function(algorithmSelected) {
        processSearch.algorithm = algorithmSelected;
    });
};

AlgorithmCtrl.$inject = ['$scope', 'processSearch'];