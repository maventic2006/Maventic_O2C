let sourcemaps = require("gulp-sourcemaps");
let ts = require("gulp-typescript");
let watch = require("gulp-watch");
let gulp = require("gulp");

let tsProject = ts.createProject("./tsconfig.json", {
	typescript: require("typescript"),
	allowJs: false,
});
let debugBuildDir = "cdn_app";

gulp.task("jsAndOthers", function (done) {
	gulp.src([
		"./src/**/*.js",
		"./src/**/*.css",
		"./src/**/*.json",
		"./src/**/*.html",
		"./src/**/*.properties",
		"./src/**/*.png",
		"./src/**/*.jpg",
		"./src/**/*.gif",
		"./src/**/*.woff2",
		"./src/**/*.svg",
		"./src/**/*.xml",
		"./src/**/*.map",
		"./src/**/*.wasm",
	]).pipe(gulp.dest(debugBuildDir));
	done();
});

gulp.task("typescript", function (done) {
	if (!tsProject) {
		tsProject = ts.createProject("tsconfig.json", {
			typescript: require("typescript"),
			allowJs: false,
		});
	}
	tsProject
		.src()
		.pipe(sourcemaps.init({ loadMaps: true, largeFile: true }))
		.pipe(tsProject(), ts.reporter.nullReporter())
		.pipe(
			sourcemaps.mapSources(function (sourcePath, file) {
				return "../../../" + sourcePath;
			})
		)
		.pipe(sourcemaps.write(".", { addComment: true, includeContent: true }))
		.pipe(gulp.dest(debugBuildDir));
	done();
});

gulp.task("tscw", gulp.parallel("jsAndOthers"));
//use below code for watcher and remove done() in typescript task
// gulp.task('tscw', function () { gulp.watch('src/**/*', { ignoreInitial: false }, gulp.series('jsAndOthers')); gulp.watch('src/**/*', { ignoreInitial: false }, gulp.parallel('typescript')); });
