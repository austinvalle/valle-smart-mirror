(function(){
	angular.module('SmartMirror').factory('VoiceService', [
		'$rootScope',
		function($rootScope){
			var service = {};
			service.commands = {};

			service.addCommand = function(phrase, callback){
				var command = {};

				command[phrase] = function(arg1, arg2){
					$rootScope.$apply(callback(arg1, arg2));
				};

				angular.extend(service.commands, command);

				annyang.addCommands(service.commands);
			};

			service.start = function(listening, voiceResult, result){
				annyang.addCommands(service.commands);
				annyang.start();

				if (typeof(listening) == "function") {
                	annyang.addCallback('start', function(){$rootScope.$apply(listening(true));});
                	annyang.addCallback('end', function(data){});
            	};
            	if (typeof(voiceResult) == "function") {
            	    annyang.addCallback('interimResult', function(data){$rootScope.$apply(voiceResult(data));});
            	};
            	if (typeof(result) == "function") {
                	annyang.addCallback('result', function(data){$rootScope.$apply(result(data));});
            	};
			};

			return service;
		}
	]);
}());