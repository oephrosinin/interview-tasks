// Libs for gulp tasks
const browserify =   require('browserify');
const source =       require('vinyl-source-stream');
const gulp =         require('gulp');
const uglify =       require('gulp-uglify');
const sass =         require('gulp-sass');
const size =         require('gulp-size');
const environments = require('gulp-environments');
const buffer =       require('vinyl-buffer');
const babelify =     require('babelify');
const path =         require('path');
const cleanCSS =     require('gulp-clean-css');
const concat =       require("gulp-concat");

// Public dir
const PATH_CLIENT = './client/public';

// Src dirs
const CSS_DIR = './client/src/styles/css/*.css';
const SCSS_DIR = './client/src/styles/scss/app.scss';
const JS_DIR = './client/src/js/app.js';
const JS_LIB_DIR = './client/src/js/lib/*.js';
const JS_LIB_RESOURCES = './client/src/js/lib/resources/*.js';
const RESOURCES_DIR = './client/src/resources/**/*';

var production = environments.make('production');
var tinylr;


/**
 * Minify css files
 */
gulp.task('css', () => {
    return gulp.src(CSS_DIR)
        .pipe(cleanCSS({compatibility: 'ie8'}))
        .pipe(size())
        .pipe(concat('lib.css'))
        .pipe(gulp.dest(PATH_CLIENT + '/css'));
});


/**
 * Scss to css
 */
gulp.task('sass', () => {
    gulp.src(SCSS_DIR)
        .pipe(sass({includePaths: ['./node_modules/sass-list-maps'], errLogToConsole: true}))
        .pipe(sass({outputStyle: 'compressed'}))
        .pipe(size())
        .pipe(gulp.dest(PATH_CLIENT + '/css'));
});


/**
 * babel task. Minify and convert js
 */
gulp.task('babel', () => {
    return browserify(JS_DIR)
        .transform(babelify.configure({presets: ["es2015"]}))
        .bundle()
        .on('error', (err) => { console.error(err); })
        .pipe(source('app.js'))
        .pipe(buffer())
        .pipe(production(uglify({output: {ascii_only: true}})))
        .pipe(size())
        .pipe(gulp.dest(PATH_CLIENT + '/js'));
});


/**
 * Concat and minify all js libs
 */
gulp.task('js-lib', () => {
    gulp.src(JS_LIB_RESOURCES)
        .pipe(concat('lib.js'))
        .pipe(buffer())
        .pipe(production(uglify({output: {ascii_only: true}})))
        .pipe(size())
        .pipe(gulp.dest(PATH_CLIENT + '/js'));
});


/**
 * Livereload page in browser on changes
 */
gulp.task('livereload', () => {
    tinylr = require('tiny-lr')();
    tinylr.listen(35729);
});


/**
 * Reload browser is files changed
 * @param event
 */
function notifyLiveReload(event) {
    var fileName = path.relative(__dirname, event.path);
    tinylr.changed({body: {files: [fileName]}});
}


/**
 * Watch all tasks
 */
gulp.task('watch', () => {   
    gulp.watch(CSS_DIR, ['css']);
    gulp.watch(SCSS_DIR, ['sass']);
    gulp.watch([JS_DIR, JS_LIB_DIR], ['babel']);
    gulp.watch(JS_LIB_RESOURCES, ['js-lib']);

    gulp.watch(`${PATH_CLIENT}/css/app.css`, notifyLiveReload);
    gulp.watch(`${PATH_CLIENT}/js/app.js`, notifyLiveReload);
});



gulp.task('web', ['babel', 'js-lib', 'sass', 'css']); // task for building production "NODE_ENV=production gulp web"

gulp.task('default', ['babel', 'js-lib', 'sass', 'css', 'livereload', 'watch']);
