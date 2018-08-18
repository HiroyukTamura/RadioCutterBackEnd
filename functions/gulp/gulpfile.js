"use strict";

const gulp = require('gulp');
const babel = require("gulp-babel");

gulp.task('babel', function() {
    return gulp.src('.././index.es6')
        .pipe(babel())
        .pipe(gulp.dest('.././'));
});