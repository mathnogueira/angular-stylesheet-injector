/**
 * Angular Stylesheet Injector - Css injection on-demand
 * @version 1.0.0
 * @author Matheus Nogueira
 */

(function(angular) {

	angular
		.module('ng-stylesheet-injector', [])
		.run(Startup)
		.service('$css', CssInjector);

	CssInjector.$inject = ['$rootScope', '$injector', '$http'];

	function CssInjector($rootScope, $injector, $http) {

		// Define if it's gonna run on debug mode
		var _debug = true;
		// List of stylesheets that must be loaded before rendering the view
		var synchronousLoading = [];
		// List of stylesheets that can be loaded after the view has be rendered.
		var assynchronousLoading = [];
		// List of all stylesheets loaded at the time
		var loaded = [];
		// List of all injected css files
		var injected = [];
		// Temporary list of all <style> tags that will be added to <head>
		var tmp = [];
		// Object that store the properties of the current state, so it can
		// be resumed after loading all synchronous stylesheets.
		var _properties;
		// UI.Router $state
		var $state;

		// Initialize the service
		initialize();

		/**
		 * Initialize the injector.
		 *
		 * It add all listeners needed to trigger the injection.
		 */
		function initialize() {
			// If project is using ui-router, listen for its events.
			if ($injector.has('$state')) {
				$state = $injector.get('$state');
				$rootScope.$on('$stateChangeStart', uiRouter_changeStart);
				$rootScope.$on('$css_SyncronousInjectionFinished', uiRouter_resumeState);
			}
			$rootScope.$on('$css_InjectionStarted', startLoading);
			$rootScope.$on('$css_SyncronousLoadingFinished', injectStylesheets);
		}

		// Function that get the state that will be rendered next and check
		// if it needs to have any css loaded.
		function uiRouter_changeStart(event, toState, toParams, fromState, fromParams) {
			// Verify if next state has css to be loaded before rendering
			// the template (synchronous loading)
			if (toState.lazyLoading && toState.lazyLoading.synchronous) {
				// Verify if stylesheet has already be loaded
				var synchronous = toState.lazyLoading.synchronous;
				var stateProperties = {
					event: event,
					from: fromState,
					to: toState,
				};
				// Doesnt continue if all stylesheet have being loaded already
				// This prevents infinite recursion
				console.log('injected:', injected, 'synchronous:', synchronous);
				if (angular.equals(injected, synchronous)) {
					return;
				}
				if (_debug) console.log('ui.Router change state detected:', fromState.name, 'to', toState.name);
				if (_debug) console.log(toState.name, 'contains stylesheets to be loaded synchronously: ', synchronous);
				// Add the stylesheet names to load it.
				synchronous_addStylesheet(synchronous, stateProperties, uiRouter_resumeState);
				// Stop state transition to prevent style glitches between the view rendering and
				// stylesheet loading.
				// The transition will resume after all synchronous loading finish.
				event.preventDefault();
			}
			// Verify if there is any assynchronous loading stylesheet
			if (toState.lazyLoading && toState.lazyLoading.assynchronous) {
				var assynchronous = toState.lazyLoading.assynchronous;
				if (_debug) console.log(toState.name, 'contains stylesheets to be loaded assynchronously:', assynchronous);
				// Add stylesheets to be loaded.
				assynchronous_addStylesheet(assynchronous);
			}

			$rootScope.$broadcast('$css_BeforeInjection');
			$rootScope.$broadcast('$css_InjectionStarted');
		}

		function uiRouter_resumeState() {
			$state.go(_properties.to.name);
		}

		/**
		 * Start loading all stylesheets.
		 */
		function startLoading() {
			tmp.length = 0;
			startLoadingSynchronous();
			startLoadingAssynchronous();
		}

		/**
		 * Iterate through list of stylesheets that must be loaded synchronously and
		 * load it using $http.
		 */
		function startLoadingSynchronous() {
			for (var i in synchronousLoading) {
				// Load file
				loadStylesheet(synchronousLoading[i], SynchronousHandler);
			}
		}

		/**
		 * Load a stylesheet file using the $http provider. It uses the handler
		 * to verify what to do after loading the file.
		 *
		 * @param (string) stylesheet path to the stylesheet that will be loaded.
		 * @param (function) callback function that will handle the loaded file.
		 */
		function loadStylesheet(stylesheet, callback) {
			// Verify if stylesheet has being already loaded on previous state
			// If it is already loaded, ignore this step
			if (loaded.indexOf(stylesheet) >= 0) {
				callback(stylesheet, null);
				return;
			}
			// otherwise, load it.
			$http.get(stylesheet).then(function(response) {
				// If stylesheet was found, call the callback passing its content
				if (response.status == 200) {
					callback(stylesheet, response.data);
				}
			});
		}

		/**
		 * Add one or more stylesheets to be loaded synchronously.
		 *
		 * @param (array or string) stylesheet to be loaded.
		 * @param (object) properties of the state that is being executed now.
		 * @param (function) callback function that will be called after all stylesheet files are loaded.
		 */
		function synchronous_addStylesheet(stylesheet, properties, callback) {
			// Empty synchronous loading list
			synchronousLoading.length = 0;
			if (angular.isArray(stylesheet)) {
				// Iterate list to insert one by one into list of files to load
				for (var i in stylesheet) {
					synchronousLoading.push(stylesheet[i]);
				}
			} else {
				synchronousLoading.push(stylesheet);
			}

			_properties = properties;
		}

		/**
		 * Add one or more stylesheets to be loaded assynchronously.
		 *
		 * @param (array or string) stylesheet to be loaded.
		 */
		function assynchronous_addStylesheet(stylesheet) {
			// Empty synchronous loading list
			assynchronousLoading.length = 0;
			if (angular.isArray(stylesheet)) {
				// Iterate list to insert one by one into list of files to load
				for (var i in stylesheet) {
					assynchronousLoading.push(stylesheet[i]);
				}
			} else {
				assynchronousLoading.push(stylesheet);
			}
		}

		/**
		 * Receive the name and content of a stylesheet, append it to the
		 * document head and then update the list of loaded stylesheets.
		 *
		 * @param (string) name name of the file loaded.
		 * @param (string) content content of the file.
		 */
		function SynchronousHandler(name, content) {
			if (_debug) console.log(name, 'loaded');
			// Append content to head
			appendStylesheet(name, content);
			// Update loaded files
			loaded.push(name);
			// Verify if all files were loaded
			if (angular.equals(loaded, synchronousLoading)) {
				$rootScope.$broadcast('$css_SyncronousLoadingFinished');
			}
		}

		/**
		 * Add a stylesheet to the list of stylesheets that must be
		 * appended in <head> after all synchronous stylesheets are loaded.
		 *
		 * @param (string) name name of the stylesheet.
		 * @param (string) content content of the css file.
		 */
		function appendStylesheet(name, content) {
			var stylesheet = {
				name: name,
				content: content,
			};
			tmp.push(stylesheet);
		}

		/**
		 * Append all synchronous stylesheets to the <head> tag.
		 *
		 */
		function injectStylesheets() {
			var head = angular.element(document.querySelector('head'));
			var template;
			var style;
			// List all stylesheets that must be removed from <head>
			var remove = [];
			console.log('loaded', injected);
			for (var i in injected) {
				if (tmp.indexOf(injected[i]) < 0) {
					remove.push(injected[i]);
				}
			}
			if (_debug) console.log('Stylesheets that will be removed:', remove);

			// Remove css files not in use
			for (i in remove) {
				style = angular.element(document.querySelector('style[data-name="'+ remove[i] +'"]'));
				if (_debug) console.log('Removing stylesheet:', remove[i]);
				style.remove();
				var index = injected.indexOf(remove[i]);
				console.log(index);
				if (_debug) console.log('Injected before removing:', injected);
				injected.splice(index, 1);
				if (_debug) console.log('Injected after removing:', injected);
			}

			// Append all loaded stylesheets
			for (i in tmp) {
				// Ignore stylesheet already injected
				if (remove.indexOf(tmp[i]) < 0 && injected.indexOf(tmp[i]) < 0) {
					template = "<style data-name='" + tmp[i].name + "'>"+ tmp[i].content +"</style>";
					head.append(template);
					injected.push(tmp[i].name);
				}
			}

			// Clear loaded list
			loaded.length = 0;
			// Emit injected event
			$rootScope.$broadcast('$css_SyncronousInjectionFinished');
		}

		function startLoadingAssynchronous() {}

	}

	// Make the service load at startup, so the user do not have to
	// add the service as a dependency.
	Startup.$inject = ['$css'];
	function Startup($css) {}
})(angular);
