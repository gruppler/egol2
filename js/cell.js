'use strict';

define(function(){

  return function(grid, x, y, on){
    var that = this;

    // Properties

    this.grid = grid;

    this.x = x;
    this.y = y;

    this.is_on = !!on || false;
    this.history = [this.is_on];

    this.neighbors_on = 0;
    this.neighbor_coords = [
      [x-1, y-1],
      [x  , y-1],
      [x+1, y-1],
      [x-1, y  ],
      [x+1, y  ],
      [x-1, y+1],
      [x  , y+1],
      [x+1, y+1]
    ];


    // Methods

    this.set_on = function(is_on){
      that.is_on = that.history[that.history.length - 1] = !!is_on || false;
      that.update_neighbors(that.neighbor_coords, that.is_on);

      if(!that.grid.config.is_playing){
        that.grid.view.update();
      }
    };

    this.update_neighbor = function(is_on){
      if(is_on){
        that.neighbors_on++;
      }else{
        that.neighbors_on--;
      }
    };

    this.update_neighbors = function(){
      _.each(that.neighbor_coords, function(coord){
        var cell = that.grid.cell(coord[0], coord[1], that.is_on);
        if(cell){
          cell.update_neighbor(that.is_on);
        }
      });
    };

    this.advance = function(){
      that.is_on = that.history[that.history.length] = (
        this.neighbors_on == 3
        || this.is_on && this.neighbors_on == 2
      );
    };

    this.draw = function(){
      that.view.fill = 'rgba(0, 200, 255, 0.75)';

      if(that.is_on){
        that.view.addTo(that.grid.view.scene);
      }else{
        that.grid.view.remove(that.view);
      }

      if(!that.grid.config.is_playing){
        that.grid.view.update();
      }
    };


    // Initialization

    this.view = this.grid.view.makeCircle(x, y, this.grid.config.cell_size);
    this.view.noStroke();
    this.draw();

    if(this.is_on){
      this.set_on(true);
    }
  };

});
