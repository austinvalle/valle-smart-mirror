(function(){
	angular.module('SmartMirror').factory('WeatherService', [
		'$http',
		function($http){
			var service = {};
			service.forecast = null;
			var geolocation = null;

			service.initialize = function(geoposition){
				geolocation = geoposition;
				return $http.jsonp('https://api.forecast.io/forecast/' + CONFIG.FORECAST_API_KEY 
									+ '/' + geoposition.coords.latitude + ',' + geoposition.coords.longitude 
									+ '?callback=JSON_CALLBACK').then(function(resp){
										return service.forecast = resp;
									});
			};

			service.currentForecast = function(){
				if(service.forecast === null){
					return null;
				}

				service.forecast.data.currently.day = moment.unix(service.forecast.data.currently.time).format('ddd');
				return service.forecast.data.currently;
			};

			service.weeklyForecast = function(){
				if(service.forecast === null){
					return null;
				}

				for (var i = 0; i < service.forecast.data.daily.data.length; i++) {
                	service.forecast.data.daily.data[i].day = moment.unix(service.forecast.data.daily.data[i].time).format('ddd');
            	};
            	return service.forecast.data.daily;
			};

			service.refreshWeather = function(){
            	return service.initialize(geolocation);
        	};

        	return service;
		}
	]);
}());