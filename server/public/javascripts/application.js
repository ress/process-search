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
    $scope.time = 0;
    $scope.results = [];
    $scope.algorithms = [];
    $scope.algorithm = null;

    $http({ method: 'GET', url: '/search/algorithms'})
        .success(function(data) {
            $scope.algorithms = data['algorithms'];
            $scope.algorithm = $scope.algorithms[0].name;
        });

    $scope.$watch('algorithm', function(value) {
        var algorithm = _.find($scope.algorithms, function(algorithm) { return algorithm.name == value; });
        if (algorithm) {
            $scope.parameters = algorithm.parameters;
            _.each($scope.parameters, function(parameter) {
                parameter['value'] = parameter['default'];
            });

        }
    });

    $scope.search = function() {
        var model = $window.ORYXEditor.getSerializedJSON();
        var params = {
            algorithm: $scope.algorithm,
            json: model,
            parameters: _.object(_.map($scope.parameters, function(parameter) { return [parameter.name, parameter.value]; }))
        };

        localStorage.setItem("lastModel", model);

        $http({ method: 'POST', url: '/search', data: params})
            .success(function(data) {

                $scope.results = data.models;
                $scope.time = data.time;

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