(function(){
	angular.module('SmartMirror').factory('GoogleApiService', [
		'$rootScope', 
		function($rootScope){
			var service = {};
			service.sync_token = '';

			service.initialize = function(next){
				gapi.auth.authorize({
					'client_id': CONFIG.GAPI_CLIENT_ID,
					'scope': 'https://www.googleapis.com/auth/calendar.readonly',
					'immediate': true
				}, function(authResult){
					if(authResult && !authResult.error){
						gapi.client.load('calendar', 'v3', function(){
							$rootScope.gapiLoaded = true;
							next();
						});
					}
				});
			};

			service.getCalendarEvents = function(callback){
				if ($rootScope.gapiLoaded) {
					var calendarStart = moment().startOf('month').startOf('week');
					var calendarEnd = moment().startOf('month').startOf('week').add('41', 'days');

					var request = gapi.client.calendar.events.list({
						'calendarId': CONFIG.CALENDAR_ID,
						'fields': 'items(creator/email,description,end,id,location,sequence,start,summary, status),nextSyncToken',
						'timeMin': calendarStart.toISOString(),
						'timeMax': calendarEnd.toISOString(),
						'singleEvents': true
					});

					request.execute(function(resp){
						service.sync_token = resp.nextSyncToken;
						callback(resp);
					});
				}
			};

			service.syncCalendarEvents = function(callback){
				if ($rootScope.gapiLoaded) {
					var request = gapi.client.calendar.events.list({
						'calendarId': CONFIG.CALENDAR_ID,
						'fields': 'items(creator/email,description,end,id,location,sequence,start,summary, status),nextSyncToken',
						'singleEvents': true,
						'syncToken': service.sync_token
					});

					request.execute(function(resp){
						service.sync_token = resp.nextSyncToken;
						callback(resp);
					});
				}
			};

			return service;
		}
	]);
}());