/*global -$ */
'use strict';
// generated on 2015-04-26 using generator-gulp-webapp 0.3.0
var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var through = require('through2');
var browserSync = require('browser-sync');
var fs = require('fs');
var reload = browserSync.reload;

var rmOrig = function() {
  return through.obj(function(file, enc, cb) {

    if (file.revOrigPath) {
      //log(colors.red('DELETING'), file.revOrigPath);
      fs.unlink(file.revOrigPath, function(err) {
        // TODO: emit an error if err
      });
    }

    this.push(file); // Pass file when you're done
    return cb() // notify through2 you're done
  });
};

gulp.task('styles', function () {
  return gulp.src('app/styles/main.css')
    .pipe($.sourcemaps.init())
    .pipe($.postcss([
      require('autoprefixer-core')({browsers: ['last 1 version']})
    ]))
    .pipe($.sourcemaps.write())
    .pipe(gulp.dest('.tmp/styles'))
    .pipe(reload({stream: true}));
});

gulp.task('jshint', function () {
  return gulp.src('app/scripts/**/*.js')
    .pipe(reload({stream: true, once: true}))
    .pipe($.jshint())
    .pipe($.jshint.reporter('jshint-stylish'))
    .pipe($.if(!browserSync.active, $.jshint.reporter('fail')));
});

gulp.task('html', ['styles'], function () {
  var assets = $.useref.assets({searchPath: ['.tmp', 'app', '.']});

  return gulp.src('app/*.html')
    .pipe(assets)
    .pipe($.if('*.js', $.uglify()))
    .pipe($.if('*.css', $.csso()))
    //.pipe($.rev())
    // for html
    .pipe(assets.restore())
    .pipe($.useref())
    .pipe($.if('*.html', $.minifyHtml({conditionals: true, loose: true})))
    //.pipe($.revReplace())
    .pipe(gulp.dest('dist'));
});

gulp.task('images', function () {
  return gulp.src('app/images/**/*')
    .pipe($.cache($.imagemin({
      progressive: true,
      interlaced: true,
      // don't remove IDs from SVGs, they are often used
      // as hooks for embedding and styling
      svgoPlugins: [{cleanupIDs: false}]
    })))
    //.pipe($.rev())
    .pipe(gulp.dest('dist/images'));
});

gulp.task('fonts', function () {
  return gulp.src(require('main-bower-files')({
    filter: '**/*.{eot,svg,ttf,woff,woff2}'
  }).concat('app/fonts/**/*'))
    .pipe(gulp.dest('.tmp/fonts'))
    .pipe(gulp.dest('dist/fonts'));
});

gulp.task('extras', function () {
  return gulp.src([
    'app/*.*',
    '!app/*.html'
  ], {
    dot: true
  }).pipe(gulp.dest('dist'));
});

gulp.task('revision', ['html', 'images'], function(){
  return gulp.src(['dist/**/*.css', 'dist/**/*.js', 'dist/**/*.{jpg,jpeg,png}'])
    .pipe($.rev())
    //.pipe($.if('*.js'), gulp.dest('dist/scripts'))
    //.pipe($.if('*.css'), gulp.dest('dist/styles'))
    //.pipe($.if('*.{jpg,jpeg,png}'), gulp.dest('dist/images'))
    .pipe(gulp.dest('dist'))
    .pipe(rmOrig())
    .pipe($.rev.manifest())
    .pipe(gulp.dest('dist'))
});

gulp.task("revreplace", ["revision"], function(){
  var manifest = gulp.src("dist/rev-manifest.json");

  return gulp.src(['dist/index.html', 'dist/**/*.css'])
    .pipe($.revReplace({manifest: manifest}))
    .pipe(gulp.dest('dist'));
});

gulp.task('clean', require('del').bind(null, ['.tmp', 'dist']));

gulp.task('serve', ['styles', 'fonts'], function () {
  browserSync({
    notify: false,
    port: 9000,
    server: {
      baseDir: ['.tmp', 'app'],
      routes: {
        '/bower_components': 'bower_components'
      }
    }
  });

  // watch for changes
  gulp.watch([
    'app/*.html',
    'app/scripts/**/*.js',
    'app/images/**/*',
    '.tmp/fonts/**/*'
  ]).on('change', reload);

  gulp.watch('app/styles/**/*.css', ['styles']);
  gulp.watch('app/fonts/**/*', ['fonts']);
  gulp.watch('bower.json', ['wiredep', 'fonts']);
});

// inject bower components
gulp.task('wiredep', function () {
  var wiredep = require('wiredep').stream;

  gulp.src('app/*.html')
    .pipe(wiredep({
      ignorePath: /^(\.\.\/)*\.\./
    }))
    .pipe(gulp.dest('app'));
});

gulp.task('build', ['jshint', 'html', 'images', 'fonts', 'extras', 'revreplace'], function () {
  return gulp.src('dist/**/*').pipe($.size({title: 'build', gzip: true}));
});

gulp.task('default', ['clean'], function () {
  gulp.start('build');
});
