/**
 * Copyright Avaya Inc., All Rights Reserved. THIS IS UNPUBLISHED PROPRIETARY SOURCE CODE OF Avaya Inc.
 * The copyright notice above does not evidence any actual or intended publication of such source code.
 * Some third-party source code components may have been modified from their original versions by Avaya.
 * The modifications are Copyright Avaya Inc., All Rights Reserved. Avaya - Confidential & Restricted.
 * May not be distributed further without written permission of the Avaya owner.
 */

module.exports = function(grunt) {

  require('jit-grunt')(grunt);

  var config = {
    library_folder: 'library',
    widget_id: grunt.option('build') || '',
    library_id: grunt.option('library') || 'Other',
    widget_folder: '<%= library_folder %>/<%= widget_id %>',
    build_folder: 'public',
    bundle_folder: 'bundle/widgets',
    compile_folder: '<%= bundle_folder %>/<%= widget_id %>',
    widget_files: {
      css: ['<%= widget_folder %>/**/*.css'],
      html: ['<%= widget_folder %>/**/*.html'],
      js: ['<%= widget_folder %>/**/*.js', '!<%= widget_folder %>/**/libs/*.js'],
      libs: ['<%= widget_folder %>/**/libs/*.js'],
      json: ['<%= widget_folder %>/**/*.json'],
      locale: ['<%= widget_folder %>/**/*.locale']
    }
  };

  var tasks = {

    clean: {
      build: {
        src: ['<%= build_folder %>'],
        options: { force: true }
      },
      bundle: {
        src: ['<%= bundle_folder %>'],
        options: { force: true }
      }
    },

    copy: {
      all: {
        files: [
          {
            src: ['<%= widget_files.js %>', '<%= widget_files.html %>', '<%= widget_files.libs %>', '<%= widget_files.css %>', '<%= widget_files.json %>', '<%= widget_files.locale %>'],
            dest: '<%= build_folder %>/',
            cwd: '.',
            expand: true
          }
        ]
      },
      json: {
        files: [
          {
            expand: true,
            cwd: '<%= widget_folder %>/',
            src: ['**/*.json'],
            dest: '<%= compile_folder %>/'
          }
        ]
      },
      libs: {
        files: [
          {
            expand: true,
            cwd: '<%= widget_folder %>/',
            src: ['**/libs/*.js'],
            dest: '<%= compile_folder %>/'
          }
        ]
      },
      assets: {
        files: [
          {
            expand: true,
            cwd: '<%= widget_folder %>/',
            src: ['assets/**'],
            dest: '<%= compile_folder %>/'
          }
        ]
      }

    },

    concat: {
      css: {
        src: ['<%= widget_files.css %>'],
        dest: '<%= compile_folder %>/<%= widget_id %>.css'
      },
      compile_js: {
        src: [
          '<%= build_folder %>/<%= widget_folder %>/**/*.tpl.js',
          '<%= build_folder %>/<%= widget_folder %>/**/*.js',
          '!<%= build_folder %>/<%= widget_folder %>/**/libs/*.js'
        ],
        dest: '<%= compile_folder %>/<%= widget_id %>.js',
        options: {
          banner: '(function ( window, angular, undefined ) {\n\n',
          footer: '})( window, window.angular );'
        }
      }
    },

    ngAnnotate: {
      compile: {
        files: [
          {
            src: ['<%= widget_files.js %>'],
            cwd: '<%= build_folder %>',
            dest: '<%= build_folder %>',
            expand: true
          }
        ]
      }
    },

    uglify: {
      compile: {
        options: {
          sourceMap: {
            includeSources: true
          }
        },
        files: {
          '<%= concat.compile_js.dest %>': '<%= concat.compile_js.dest %>'
        }
      }
    },

    sass: {
      all: {
        options: {
          sourceMap: false,
          outputStyle: 'compressed'
        },
        files: {
          '<%= concat.css.dest %>': '<%= concat.css.dest %>'
        }
      }
    },

    html2js: {
      all: {
        src: ['<%= widget_files.html %>']
      }
    },

    tree: {
      all: {
        options: {
          prettify: true
        },
        files: [
          {
            src: ['<%= library_folder %>/'],
            dest: 'manifest.json'
          }
        ]
      }
    },

    manifest: {
      create: {
        src: ['<%= bundle_folder %>/**/*.json', '!<%= bundle_folder %>/library.json']
      }
    },

    build_params: {
      all: {}
    },

    create_widget: {
      widget: {}
    }
  };

  grunt.initConfig(grunt.util._.extend(tasks, config));

  grunt.registerTask('default', [
    'build_params',
    'build_library',
    'tree:all'
  ]);

  grunt.registerTask('build_library', [
    'clean:build',
    'copy:all',
    'copy:libs',
    'copy:assets',
    'html2js',
    'ngAnnotate',
    'concat:compile_js',
    'copy:json',
    'concat:css',
    'sass:all',
    'uglify',
    'clean:build',
    'manifest:create'
  ]);

  function filterForHTML(files) {
    return files.filter(function(file) {
      return file.match(/\.html$/);
    });
  }

  grunt.registerMultiTask('html2js', 'Convert HTML templates to JavaScript', function() {
    var dirRE = new RegExp('^(' + grunt.config('build_folder') + '|' + grunt.config('compile_folder') + ')\/', 'g');
    var htmlFiles = filterForHTML(this.filesSrc).map(function(file) {
      return file.replace(dirRE, '');
    });
    htmlFiles.forEach(function(filepath) {
      var content = grunt.file.read(filepath);
      content = 'var template= "' + content.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/[\n\r]/g, '\\n') + '";\n';
      filepath = filepath.replace(/.html/i, '.tpl.js');
      grunt.file.write(grunt.config('build_folder') + '/' + filepath, content);
    });
  });

  grunt.registerMultiTask('manifest', 'Create library manifest', function() {
    var config = [];
    this.filesSrc.forEach(function(filepath) {
      config.push(grunt.file.readJSON(filepath));
    });
    grunt.file.write(grunt.config('bundle_folder') + '/' + 'library.json', JSON.stringify(config, null, 2));
  });

  grunt.registerMultiTask('build_params', 'Grunt build parameters', function() {
    if (!grunt.option('build')) {
      grunt.fail.fatal('Widget name not passed to Grunt build task.');
    }
  });

  grunt.registerMultiTask('create_widget', 'Grunt task to create widgets', function() {
    var changeCase = require('change-case');
    var uuid = require('uuid/v4');
    var tpl_js = 'angular.module(\'<%= id %>\', [\n  \'core.services.WidgetAPI\'\n]).directive(\'<%= name %>\', widgetComponent);\n\nfunction widgetComponent(WidgetAPI) {\n\n  function widgetContainer(scope, element, params) {\n    // Create a new instance of the Widget API\n    var api = new WidgetAPI(params);\n\n    // Insert your widget code here\n\n    // Called automatically when the widget is destroyed\n    element.on(\'$destroy\', function() {\n      api.unregister();\n    });\n  }\n\n  return {\n    scope: {},\n    replace: true,\n    template: template,\n    link: widgetContainer\n  };\n}';
    var tpl_html = '<div class="neo-widget widget--<%= element %>">\n\n  <div class="neo-widget__header aoc-home"><%= name %></div>\n\n  <div class="neo-widget__content neo-widget__content--indented">\n    <div class="row">\n      <div class="col-medium-12 col-large-12">\n        <p>Add widget content here</p>\n        <span class="specific-style-text">\n          This is an example of specific widget only styling.\n          This ensures that the style is only applied to this widget and does not impact any other widget within Workspaces.\n        </span>\n      </div>\n    </div>\n  </div>\n\n</div>';
    var tpl_css = '/* Best Practice:\n   This is an example of the \'descendant selector\' css rule.\n   This ensures that the style is only applied to this widget and does not impact any other widget.\n*/\n.widget--<%= element %> .specific-style-text {\n  font-style: italic;\n}\n\n/* Another example which will impact all <span> elements within this widget only */\n.widget--<%= element %> span {\n  margin-top: 20px;\n}';
    var tpl_json = '{\n  "metadata": {\n    "name": "<%= name %>",\n    "description": "Please add widget description here",\n    "tags": "demo, widget, example, other",\n    "library": "<%= library %>",\n    "version": "1.0.0",\n    "date": "<%= date %>",\n    "id": "<%= id %>"\n  },\n  "configuration": {\n    "external": true,\n    "timeout": 5000,\n    "serie": true,\n    "name": "<%= id %>",\n    "element": "<<%= element %>></<%= element %>>",\n    "icon": "aoc-home",\n    "files": ["<%= element %>/<%= element %>.css", "<%= element %>/<%= element %>.js"]\n  }\n}';
    var tpl_service_ts = 'class <%= className %> { \n http: ng.IHttpService; \n constructor($http: ng.IHttpService) { \n this.http = $http; \n } \n } \n angular.module(\'<%= id %>\').service(\'<%= serviceName %>Service\', <%= className %>);' 
    
    var id = uuid();
    var name = grunt.option('name');
    var library_id = grunt.option('library') || 'Other';
    var isBoolean = typeof grunt.option('service') === 'boolean';
    let service;
    isBoolean ? service = grunt.option('service') : (grunt.option('service') === 'true' ? service = true: service = false);
    if (!name) grunt.fail.fatal('Widget name is missing, please use: grunt create_widget --name="my-widget" --library="My library"');
    if (!name.includes('-')) grunt.fail.fatal('Dash "-" character missing from widget name, please use "param-case" for widget names, e.g, grunt create_widget --name="my-widget" --library="My library"');

    var js_content = grunt.template.process(tpl_js, { data: { id: id, name: changeCase.camelCase(name) } });
    var json_content = grunt.template.process(tpl_json, { data: { id: id, name: changeCase.titleCase(name), element: name, library: library_id, date: new Date().toISOString() } });
    var html_content = grunt.template.process(tpl_html, { data: { name: changeCase.titleCase(name), element: name } });
    var css_content = grunt.template.process(tpl_css, { data: { element: name } });
    const className = changeCase.camelCase(name)[0].toUpperCase() + changeCase.camelCase(name).slice(1)
    var ts_service_content = grunt.template.process(tpl_service_ts, { data: { id:id, className: className, serviceName: className } });

    grunt.file.mkdir(grunt.config('library_folder'));
    grunt.file.write(grunt.config('library_folder') + '/' + name + '/' + name + '.js', js_content);
    grunt.file.write(grunt.config('library_folder') + '/' + name + '/' + name + '.json', json_content);
    grunt.file.write(grunt.config('library_folder') + '/' + name + '/' + name + '.html', html_content);
    grunt.file.write(grunt.config('library_folder') + '/' + name + '/' + name + '.css', css_content);

    if (service) {
      grunt.file.write(grunt.config('library_folder') + '/' + name + '/libs/' + name + '.service.ts', ts_service_content);
    }
    
    grunt.log.ok('The "' + name + '" widget has been created');
    grunt.log.subhead('To compile and bundle the widget: grunt --build="' + name + '"');
  });

  grunt.registerTask('set_widget_id', 'Setting widget id to config', function(widget_id) {
    grunt.config.set('widget_id', widget_id);
  });

  grunt.registerTask('build_all_widgets', 'Grunt task to build all widgets', function() {
    var library = grunt.file.readJSON('manifest.json');
    var widgets = Object.keys(library);

    // NOTE: Find a way to run grunt.task.run() synchronous
    var taskList = [];
    for (var i = 0; i < widgets.length; i++) {
      taskList.push('set_widget_id:' + widgets[i], 'build_library');
    }
    grunt.task.run(taskList);
  });

  grunt.registerTask('build_all', [
    'tree:all',
    'build_all_widgets'
  ]);
};
