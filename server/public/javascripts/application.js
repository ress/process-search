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

angular.module('searchModule', []);

function SearchCtrl($scope, $window, $http) {
    $scope.data = {
        time: 0,
        results: [],
        algorithms: [],
        algorithm: null,
        parameters: null
    };

    $http({ method: 'GET', url: '/search/algorithms'})
        .success(function(data) {
            $scope.data.algorithms = data['algorithms'];
            $scope.data.algorithm = $scope.data.algorithms[0].name;
        });

    $scope.$watch('data.algorithm', function(value) {
        var algorithm = _.find($scope.data.algorithms, function(algorithm) { return algorithm.name == value; });
        if (algorithm) {
            $scope.data.parameters = algorithm.parameters;
            _.each($scope.data.parameters, function(parameter) {
                parameter['value'] = parameter['default'];
            });

        }
    });

    $scope.search = function() {
        var model = $window.ORYXEditor.getSerializedJSON();
        var params = {
            algorithm: $scope.data.algorithm,
            json: model,
            parameters: _.object(_.map($scope.data.parameters, function(parameter) { return [parameter.name, parameter.value]; }))
        };

        localStorage.setItem("lastModel", model);

        $http({ method: 'POST', url: '/search', data: params})
            .success(function(data) {

                $scope.data.results = data.models;
                $scope.data.time = data.time;

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

SearchCtrl.$inject = ['$scope', '$window', '$http'];