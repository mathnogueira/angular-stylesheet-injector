(function() {

	angular
		.module('demo', ['ui.router', 'ng-stylesheet-injector'])
		.config(RouterConfig);

	RouterConfig.$inject = ['$stateProvider', '$urlRouterProvider'];

	function RouterConfig($stateProvider, $urlRouterProvider) {
		$urlRouterProvider.otherwise('/');

		$stateProvider
			.state('state1', {
				url: '/',
				templateUrl: './page1.html',
				lazyLoading: {
					synchronous : ['css/base.css'],
					assynchronous: ['css/color.css'],
				}
			})

			.state('state2', {
				url: '/page2',
				templateUrl: './page2.html',
				lazyLoading: {
					synchronous: ['css/base_pag2.css', 'css/colors2.css']
				}
			})

			.state('state3', {
				url: '/page3',
				templateUrl: './page3.html',
				lazyLoading: {
					synchronous: ['css/base_pag3.css', 'css/colors2.css']
				}
			});
	}

})();
