(function(){
	'use strict';

	angular.module('SmartMirror').controller('MirrorController', [
		'$scope',
		'$interval',
		'$timeout',
		'$window',
        '$filter',
		'GeolocationService',
		'WeatherService',
		'VoiceService',
		'GoogleApiService',
		function($scope, $interval, $timeout, $window, $filter, GeolocationService, WeatherService, VoiceService, GoogleApiService){
			var DEFAULT_COMMAND_TEXT = 'Say "What can I say?" to see a list of commands...';
			$scope.showWeather = true;
			$scope.showTime = true;
			$scope.showEvents = true;
            $scope.currentWeek = [];
			$scope.events = [];

			
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

			var defaultView = function(){
				$scope.focus = 'default';
			};

			var restCommand = function() {
          		$scope.voiceResult = DEFAULT_COMMAND_TEXT;
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
                eventDate = new Date(eventDate);


                if (!(date instanceof Date)) {
                    return false;
                };

                return eventDate.getFullYear() == date.getFullYear()
                        && eventDate.getDate() == date.getDate()
                        && eventDate.getMonth() == date.getMonth();
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

			$scope.focus = 'default';
			restCommand();

			GeolocationService.getLocation().then(function(geoposition){
                WeatherService.initialize(geoposition).then(updateWeather);
                $interval(function(){
                    var weatherPromise = WeatherService.refreshWeather();
                    weatherPromise.then(updateWeather());
                }, 300000);
            });

            VoiceService.addCommand('What can I say', function() {
                $scope.focus = "commands";
            });

            VoiceService.addCommand('Go home', defaultView);

            VoiceService.addCommand('Wake up', defaultView);

            VoiceService.addCommand('Go to sleep', function() {
                $scope.focus = "sleep";
            });

            VoiceService.addCommand('Hide (the) weather', function() {
                $scope.showWeather = false;
            });

            VoiceService.addCommand('Show (the) weather', function() {
                $scope.showWeather = true;
            });

            VoiceService.addCommand('Hide (the) time', function() {
                $scope.showTime = false;
            });

            VoiceService.addCommand('Show (the) time', function() {
                $scope.showTime = true;
            });

            VoiceService.addCommand('Hide (my) events', function() {
                $scope.showEvents = false;
            });

            VoiceService.addCommand('Show (my) events', function() {
                $scope.showEvents = true;
            });

            var resetCommandTimeout;

            VoiceService.start(function(listening){
                $scope.listening = listening;
            }, function(voiceResult){
                $scope.voiceResult = voiceResult;
                $timeout.cancel(resetCommandTimeout);
            }, function(result){
                $scope.voiceResult = result[0];
                resetCommandTimeout = $timeout(restCommand, 5000);
            });
		}
	]);
}());