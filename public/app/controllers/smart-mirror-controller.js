(function(){
	'use strict';

	angular.module('SmartMirror').controller('MirrorController', [
		'$scope',
		'$interval',
		'$window',
        '$filter',
		'GeolocationService',
		'WeatherService',
		'GoogleApiService',
		function($scope, $interval, $window, $filter, GeolocationService, WeatherService, GoogleApiService){
            $scope.currentWeek = [];
			$scope.events = [];
            $scope.color = 'white';
			
			var updateTime = function() {
                var today = new Date();

                if($scope.currentWeek.length == 0 || today.getFullYear() != $scope.currentDate.getFullYear() 
                    || today.getMonth() != $scope.currentDate.getMonth()
                    || today.getDate() != $scope.currentDate.getDate()) {

                    $scope.currentWeek = [];
                    for(var i = 0; i < 7; i++){
                        var date = new Date();
                        date.setDate(date.getDate() + i);

                        $scope.currentWeek.push(date);
                    }
                }

				$scope.currentDate = today;
			};

			var updateWeather = function() {
				$scope.currentForecast = WeatherService.currentForecast();
                $scope.weeklyForecast = WeatherService.weeklyForecast();
			};

        	$window.initGapi = function() {
        		GoogleApiService.initialize(function(){
                    GoogleApiService.getCalendarEvents(function(resp){
                        $scope.events = resp.items;
                    });
                });
        	};

        	$scope.deleteEvent = function(event){
        		$scope.events = $filter('filter')($scope.events, {id: '!' + event.id});
        	};

        	$scope.addUpdateEvent = function(event){
        		$scope.deleteEvent(event);
        		$scope.events.push(event);
        	};

            $scope.sortEventDate = function(event){
                return moment(event.start.dateTime || event.start.date);
            };

            $scope.compareDate = function(start, date){
                var eventDate = start.dateTime || start.date;
                eventDate = moment(eventDate);


                if (!(date instanceof Date)) {
                    return false;
                };

                return eventDate._d.getFullYear() == date.getFullYear()
                        && eventDate._d.getDate() == date.getDate()
                        && eventDate._d.getMonth() == date.getMonth();
            };

            $scope.isToday = function (date){
                return date.getDate() == $scope.currentDate.getDate();
            };

            $scope.isTomorrow = function (date){
                return date.getDate() == $scope.currentDate.getDate() + 1;
            };

            $scope.notTodayOrTomorrow = function(date){
                return date.getDate() != $scope.currentDate.getDate()
                    && date.getDate() != $scope.currentDate.getDate() + 1;
            };

			updateTime();
			$interval(updateTime, 1000);
			$interval(function(){
                GoogleApiService.syncCalendarEvents(function(resp){
                    if(resp.items.length > 0) {
                        angular.forEach(resp.items, function(event){
                            if (event.status == 'cancelled') {
                                $scope.deleteEvent(event);
                            } else if (event.status == 'confirmed') {
                                $scope.addUpdateEvent(event);
                            }
                        });
                    }
                });
            }, 5000);



			GeolocationService.getLocation().then(function(geoposition){
                WeatherService.initialize(geoposition).then(updateWeather);
                $interval(function(){
                    var weatherPromise = WeatherService.refreshWeather();
                    weatherPromise.then(updateWeather());
                }, 30000);
            });
		}
	]);
}());