var app = angular.module('vidiq',[]);
app.controller('RegisterCtrl',function($scope,$http){
    $scope.email = "";
    $scope.password = "";
    $scope.name = "";
    $scope.register = function(){
        $http.post("http://localhost:8080/api/register",{username:$scope.email,password:$scope.password,fullName:$scope.name}).then(function(response){
        console.log("success");
    },function(response){
        console.log("failure");
    });
    }
});
