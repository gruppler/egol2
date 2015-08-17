'use strict';

define(['cell'], function(Cell){

  return function(view){
    var that = this;

    // Properties

    this.generation = 0;
    this.cells = {};
    this.view = view;
    this.config = {
      is_playing: false,
      speed: 1,
      zoom: 10,
      cell_size: 0.5
    };


    // Methods

    this.cell = function(x, y, add_if_null, is_on){
      if(!(x in this.cells)){
        if(add_if_null){
          this.cells[x] = {};
        }else{
          return null;
        }
      }
      if(y in this.cells[x]){
        if(!_.isUndefined(is_on)){
          this.cells[x][y].set_on(is_on);
        }
        return this.cells[x][y];
      }else if(add_if_null){
        this.cells[x][y] = new Cell(this, x, y, is_on);
        return this.cells[x][y];
      }
      return null;
    };

    this.test_cell = function(x, y){
      var cell = this.cell(x, y);

      return cell && cell.is_on;
    };

    function _advance_row(row){
      _.invoke(row, 'advance');
    }

    this.advance = function(){
      this.generation++;

      _.each(this.cells, _advance_row);

      if(!this.config.is_playing){
        this.view.update();
      }
    };

    this.import = function(cells, offset_x, offset_y){
      offset_x = offset_x || 0;
      offset_y = offset_y || 0;

      _.each(cells.split(';'), function(cell){
        cell = cell.split(',');
        that.cell(
          1*cell[0] + offset_x,
          1*cell[1] + offset_y,
          true,
          true
        );
      });
    };

    this.export = function(){
      var cells = [];
      for(var x in this.cells){
        for(var y in this.cells[x]){
          if(this.cells[x][y].is_on){
            cells[cells.length] = x+','+y;
          }
        }
      }
      return cells.join(';');
    };

    this.draw = function(){
      this.view.update();
    };


    // Initialization

    this.view.scene.translation.set(this.view.width/2, this.view.height/2);
    this.view.scene.scale = this.config.zoom;
  };

});
