'use strict';

var grid = null;

requirejs.config({
  baseUrl: 'js'
});

require([
  'presets',
  'cell',
  'grid',
  'lib/RequestAnimationFrame',
  'lib/tween.min',
  'lib/jquery.min',
  'lib/dat.gui.min',
  'lib/underscore-min',
  'lib/two.min',
], function(presets, Cell, Grid, RequestAnimationFrame, TWEEN){
  var $canvas = $('#canvas')
    , two
    , gui = new dat.GUI({
        load: presets
      });


  // DRAWING

  function draw(){}


  // INITIALIZATION

  $(function(){
    two = new Two({
      width: $canvas.width(),
      height: $canvas.height(),
      type: Two.Types.webgl
    }).appendTo($canvas[0]);

    grid = new Grid(two);

    grid.import('0,-1;-1,0;1,0;0,1');

    $(window).resize(function(){
      var width = $canvas.width()
        , height = $canvas.height()
        , translation = grid.view.scene.translation;

      translation.set(
        translation.x - (grid.view.width - width)/2,
        translation.y - (grid.view.height - height)/2
      );

      grid.view.width = width;
      grid.view.height = height;

      if(!grid.config.is_playing){
        grid.view.update();
      }
    });
  });


  // CONFIG

  //  gui.add(grid.config, );

});
