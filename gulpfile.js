const gulp = require('gulp');
const cleanCSS = require('gulp-clean-css');

gulp.task('minify-css', () => {
    return gulp.src('app/assets/css/main.css')
        .pipe(cleanCSS())
        .pipe(gulp.dest('app/assets/css/dist'));
});