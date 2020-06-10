var gulp = require("gulp");
var less = require("gulp-less");
var sourcemaps = require("gulp-sourcemaps");
var exec = require("child_process").exec;

/**
 * Development tasks
 */
gulp.task("less", function() {
  return gulp
    .src("./library/**/*.less") // only compile the entry file
    .pipe(sourcemaps.init())
    .pipe(
      less({
        javascriptEnabled: true
      })
    )
    .pipe(sourcemaps.write())
    .pipe(gulp.dest("./library"));
});
gulp.task("watch", function() {
  gulp.watch("./library/**/*.less", gulp.series("less")); // Watch all the .less files, then run the less task
});

/**
 * Build tasks
 */
gulp.task("build-compile-less", function() {
  return gulp
    .src("./library/**/*.less") // only compile the entry file
    .pipe(sourcemaps.init())
    .pipe(
      less({
        javascriptEnabled: true
      })
    )
    .pipe(sourcemaps.write())
    .pipe(gulp.dest("./library"));
});
gulp.task("tsc", function(cb) {
  exec("npx tsc", function(err, stdout, stderr) {
    console.log(stdout);
    console.log(stderr);
    cb(err);
  });
});
gulp.task("build", gulp.series(["build-compile-less", "tsc"]));

/**
 * Default will run the 'entry' watch task
 */
gulp.task("default", gulp.series("less", "watch"));
