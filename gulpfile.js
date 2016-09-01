// Arquivo de configuração de build usando o GULP
//
(function() {

	'use strict';

	// -----------------------
	// Importação das bibliotecas
	// -----------------------
	var changed 		= require('gulp-changed');
	var concat 			= require('gulp-concat');
	var gulp 			= require('gulp');
	var uglify 			= require('gulp-uglify');
	var watch 			= require('gulp-watch');

	// Fim da importação das bibliotecas

	// ------------------------
	// Configuração do projeto
	// ------------------------
	var project = {
		source: {
			application: 'src/**/*.js',
		},
		dest: {
			application: 'dist/',
		},
	};

	// Fim da configuração do projeto

	// -------------------------
	// Declaração das tasks do projeto
	// -------------------------
	gulp.task('application', buildApplication);
	gulp.task('minApplication', buildMinApplication);
	gulp.task('watch_application', watchApplication);

	gulp.task('watch', ['watch_application']);
	gulp.task('default', ['application', 'minApplication', 'watch']);

	// Fim da declaração das tasks do projeto

	// --------------------------
	// Implementação das tasks
	// --------------------------

	function buildApplication() {
		return gulp
			.src(project.source.application)
			.pipe(concat('angular-stylesheet-injector.js'))
			.pipe(gulp.dest(project.dest.application));
	}

	function buildMinApplication() {
		return gulp
			.src(project.source.application)
			.pipe(concat('angular-stylesheet-injector.min.js'))
			.pipe(uglify())
			.pipe(gulp.dest(project.dest.application));
	}

	function watchApplication() {
		return watch(project.source.application, buildApplication);
	}

})();
