// Utilities //
window.config = {
  gps: 1,
  gpsFactor: 1.5,
  cellSize: 25,
  gradSize: 32.5,
  gradSizeFactor: 1.2,
  gradFloor: 0.675,
  preview: true,
  transitionOn: true,
  smooth: true,
  blob: true,
  fillOpacity: 1,
  colors: {
    birth: {
      r: 221,
      g: 255,
      b: 204,
      a: 0.45
    },
    life: {
      r: 204,
      g: 221,
      b: 255,
      a: 1,
    },
    death: {
      r: 187,
      g: 204,
      b: 221,
      a: 1
    }
  },
  randomPercent: 0.15,
  zoomStep: 0.15,
  zoomMin: 0.15,
  zoomMax: 7,
  cookieExpiration: 365
};

function loadConfig(){
  if(!localStorage.egolConfig) return;
  try{
    var c = JSON.parse(localStorage.egolConfig);
  }catch(e){}
  if(c) config = _.extend(config, c);
  updateWindow();
  setGPS(config.gps);
  config.blob = !config.blob;
  toggleBlob(config.blob);
}

function saveConfig(){
  var c = _.extend({}, config);
  delete c._default;
  for(var key in c){
    if(!(key in config._default) || _.isEqual(config._default[key], c[key])){
      delete c[key];
    }
  }
  if(_.isEmpty(c)){
    delete localStorage.egolConfig;
  }else{
    localStorage.egolConfig = JSON.stringify(c);
  }
}

function loadDefaults(){
  delete localStorage.egolConfig;
  config = _.extend(config, config._default);
  updateWindow();
  setGPS(config.gps);
  config.blob = !config.blob;
  toggleBlob(config.blob);
}

function rgba(color, alpha){
  alpha = isFinite(alpha) ? alpha : (isFinite(color.a) ? color.a : 1);
  return 'rgba('+color.r+','+color.g+','+color.b+','+alpha+')';
}

function mixColors(color1, color2, percent){
  if(!color1 && !color2){
    return null;
  }else if(!color1){
    return {
      r: Math.round(color2.r),
      g: Math.round(color2.g),
      b: Math.round(color2.b),
      a: Math.round(100*(color2.a*percent))/100
    };
  }else if(!color2){
    return {
      r: Math.round(color1.r),
      g: Math.round(color1.g),
      b: Math.round(color1.b),
      a: Math.round(100*(color1.a*(1-percent)))/100
    };
  }else{
    return {
      r: Math.round(color1.r*(1-percent)+color2.r*percent),
      g: Math.round(color1.g*(1-percent)+color2.g*percent),
      b: Math.round(color1.b*(1-percent)+color2.b*percent),
      a: Math.round(100*(color1.a*(1-percent)+color2.a*percent))/100
    };
  }
}

function updateWindow(){
  var cellSize = config.cellSize*config.zoom,
    origin = {
      x: config.origin.x,
      y: config.origin.y
    };
  config.minRow = Math.floor(origin.y/cellSize)-1;
  config.minCol = Math.floor(origin.x/cellSize)-1;
  config.maxRow = Math.ceil((canvas.height+origin.y)/cellSize)+1;
  config.maxCol = Math.ceil((canvas.width+origin.x)/cellSize)+1;
  config.rows = config.maxRow - config.minRow;
  config.cols = config.maxCol - config.minCol;
  config.cellCount = config.rows * config.cols;
}

function clear(){
  prevGrid.cells = {};
  currGrid.cells = {};
  nextGrid.cells = {};
  nextGrid.isGenerated = false;
}

function randomize(percent){
  var percent = percent || config.randomPercent,
    grid = config.isPlaying ? nextGrid : currGrid;

  for(var row = config.minRow; row < config.maxRow; row++){
    for(var col = config.minCol; col < config.maxCol; col++){
      if(Math.random() - percent < 0) grid.cell(row, col).toggle();
    }
  }

  if(!config.isPlaying) currGrid.generate();
}

function setGPS(gps){
  config.gps = Math.max(config.gpsMin, gps);
  config.gInterval = 1000/config.gps;
  if(config.gps < 60){
    config.transition = config.transitionOn;
  }else{
    config.transition = false;
  }
  saveConfig();
  console.log(config.gps+' gps, ' + config.gInterval+' ms');
}

function setGradSize(gradSize){
  config.gradSize = Math.min(config.gradSizeMax, Math.max(config.gradSizeMin, gradSize));
  saveConfig();
  console.log(config.gradSize+'px');
}

function setGradFloor(gradFloor){
  config.gradFloor = Math.min(0.975, Math.max(0.075, gradFloor));
  saveConfig();
  console.log(100*config.gradFloor+'%');
}

function togglePreview(){
  config.preview = !config.preview;
  saveConfig();
}

function toggleTransitions(){
  config.transitionOn = !config.transitionOn;
  config.transition = config.transitionOn && config.gps < 60;
  saveConfig();
}

function toggleSmooth(){
  config.smooth = !config.smooth;
  saveConfig();
}

function toggleBlob(){
  config.blob = !config.blob;
  if(config.blob){
    canvas.style.display = 'block';
    buffer.style.display = 'none';
  }else{
    canvas.style.display = 'none';
    buffer.style.display = 'block';
  }
  saveConfig();
}


// Event Handlers //
function hotkey(event){
  switch(event.which){

    // Play/Pause
    case 32:  // Space
      if(config.isPlaying){
        pause();
      }else{
        play();
      }
      return false;
    break;

    // Clear
    case 8:   // Backspace
    case 46:  // Delete
    case 88:  // X
      clear();
      return false;
    break;

    // Randomize
    // Shift: Restore Default Config
    case 82:  // R
      if(event.shiftKey){
        loadDefaults();
      }else{
        randomize();
      }
      return false;
    break;

    // Gradient Radius Up
    // Shift: Gradient Floor Down
    case 38:  // Up
      if(event.shiftKey){
        setGradFloor(config.gradFloor-0.1);
      }else{
        setGradSize(config.gradSize*config.gradSizeFactor);
      }
      return false;
    break;

    // Gradient Radius Down
    // Shift: Gradient Floor Up
    case 40:  // Down
      if(event.shiftKey){
        setGradFloor(config.gradFloor+0.1);
      }else{
        setGradSize(config.gradSize/config.gradSizeFactor);
      }
      return false;
    break;

    // GPS Up
    case 39:  // Right
      setGPS(config.gps*config.gpsFactor);
      return false;
    break;

    // GPS Down
    case 37:  // Left
      setGPS(config.gps/config.gpsFactor);
      return false;
    break;

    // Toggle Transitions
    case 84:  // T
      toggleTransitions();
      return false;
    break;

    // Toggle Blob style
    case 89:  // Y
      toggleBlob();
      return false;
    break;

    // Toggle Smooth style
    case 85:  // U
      toggleSmooth();
      return false;
    break;

    // Toggle Preview
    case 80:  // P
      togglePreview();
      return false;
    break;

    // Home
    case 72:  // H
    case 36:  // Home
      config.zoom = 1;
      config.origin.x = -canvas.width/2;
      config.origin.y = -canvas.height/2;
      updateWindow();
      return false;
    break;

    // Center
    case 67:  // C
      config.origin.x = -canvas.width/2;
      config.origin.y = -canvas.height/2;
      updateWindow();
      return false;
    break;

    // Next Generation
    case 75:  // K
      pause();
      nextGeneration();
    break;

    // Previous Generation
    case 74:  // J
      pause();
      prevGeneration();
    break;

    // Help
    case 191: // /?
      // help
      return false;
    break;

    default:
      // console.log('keydown:', event.which);
  }
}

function mousewheel(event){
  zoom(Math.min(1, Math.max(-1, event.wheelDelta)), -event.pageX, -event.pageY);
}

function mousedown(event){
  config.mouseMoved = false;
  config.dragOrigin = {
    x: event.pageX,
    y: event.pageY
  };
  if(event.which == 1 && event.shiftKey && (event.ctrlKey || event.metaKey)){
    // Zoom
    config.zoom_initial = config.zoom;
    config.zoomCoords_initial = {
      x: event.pageX,
      y: event.pageY
    };
    config.zoomPan_initial = {
      x: config.origin.x,
      y: config.origin.y
    };
    document.body.style.cursor = 'n-resize';
  }else if(event.which == 2 || event.which == 1 && (event.ctrlKey || event.metaKey)){
    // Pan
    config.panCoords_initial = {
      x: config.origin.x,
      y: config.origin.y
    };
    document.body.style.cursor = 'move';
  }else if(event.which == 1){
    draw(event, true);
    config.isDrawing = true;
    document.body.style.cursor = 'crosshair';
  }

  window.addEventListener('mousemove', mousemove, false);
  event.preventDefault();
  return false;
}

function mousemove(event){
  var xMoved = event.pageX - config.dragOrigin.x,
    yMoved = event.pageY - config.dragOrigin.y;

  if(xMoved || yMoved){
    config.mouseMoved = true;
  }

  if(config.panCoords_initial){
    pan(-xMoved, -yMoved, config.panCoords_initial);
  }else if(config.zoomCoords_initial){
    zoom(-yMoved/50, -config.zoomCoords_initial.x, -config.zoomCoords_initial.y, config.zoom_initial, config.zoomPan_initial);
  }else if(config.isDrawing){
    draw(event);
  }
}

function mouseup(event){
  document.removeEventListener('mousemove', mousemove);
  config.isDrawing = false;
  delete config.panCoords_initial;
  delete config.zoom_initial;
  delete config.zoomCoords_initial;
  delete config.zoomPan_initial;
  document.body.style.cursor = '';
}

function resize(){
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  config.origin.x += (buffer.width - canvas.width)/2;
  config.origin.y += (buffer.height - canvas.height)/2;
  buffer.width = canvas.width;
  buffer.height = canvas.height;
  updateWindow();
}


// Grid Functions //
var Grid = function(){
  this.cells = {};
  this.time = 0;
  this.cellCount = 0;
  return this;
};

Grid.prototype.cellProperty = function(row, col, property){
  var id = cellID(row, col);
  return this.cells[id] ? this.cells[id][property] : null;
};

Grid.prototype.cell = function(row, col){
  var id = cellID(row, col);
  if(!this.cells[id]){
    this.cells[id] = new Cell(row, col);
    this.cells[id].grid = this;
    this.cellCount++;
  }
  return this.cells[id];
};

Grid.prototype.deleteCell = function(row, col){
  delete this.cells[cellID(row, col)];
  this.cellCount--;
};

Grid.prototype.testCell = function(row, col){
  var id = cellID(row, col);
  return this.cells[id] && this.cells[id].isOn;
};

Grid.prototype.addNeighbor = function(row, col, record){
  var cell = this.cell(row, col);
  if(record){
    var time = (new Date()).getTime();
    if(time > cell.time){
      cell.time = time;
      cell.prevOn = cell.isOn;
      cell.prevNeighbors = cell.neighbors;
    }
    cell.neighbors++;
    if(this == currGrid){
      this.generate(cell);
    }
  }else{
    cell.neighbors++;
  }
};

Grid.prototype.removeNeighbor = function(row, col, record){
  var id = cellID(row, col),
    cell = this.cells[id];
  if(!cell){
    return;
  }else{
    if(record){
      var time = (new Date()).getTime();
      if(time > cell.time){
        cell.time = (new Date()).getTime();
        cell.prevOn = cell.isOn;
        cell.prevNeighbors = cell.neighbors;
      }
      cell.neighbors--;
      if(this == currGrid){
        this.generate(cell);
      }
    }else{
      cell.neighbors--;
    }
    if(cell.neighbors < 1 && !config.transition){
      delete this.cells[id];
    }
  }
};


// Cell Functions //
function cellID(row, col){
  return row+'_'+col;
}

var Cell = function(row, col){
  this.time = 0;
  this.grid = null;
  this.row = row;
  this.col = col;
  this.isOn = false;
  this.neighbors = 0;
  return this;
};

Cell.prototype.countNeighbors = function(){
  return this.grid.testCell(this.row-1, this.col-1)
    + this.grid.testCell(this.row-1, this.col)
    + this.grid.testCell(this.row-1, this.col+1)
    + this.grid.testCell(this.row, this.col-1)
    + this.grid.testCell(this.row, this.col+1)
    + this.grid.testCell(this.row+1, this.col-1)
    + this.grid.testCell(this.row+1, this.col)
    + this.grid.testCell(this.row+1, this.col+1);
};

Cell.prototype.on = function(record){
  if(record){
    var time = (new Date()).getTime();
    if(time > this.time){
      this.time = time;
      this.prevOn = this.isOn;
      this.prevNeighbors = this.neighbors;
    }
  }
  if(this.isOn) return true;

  this.isOn = true;
  this.grid.addNeighbor(this.row-1, this.col-1, record);
  this.grid.addNeighbor(this.row-1, this.col, record);
  this.grid.addNeighbor(this.row-1, this.col+1, record);
  this.grid.addNeighbor(this.row, this.col-1, record);
  this.grid.addNeighbor(this.row, this.col+1, record);
  this.grid.addNeighbor(this.row+1, this.col-1, record);
  this.grid.addNeighbor(this.row+1, this.col, record);
  this.grid.addNeighbor(this.row+1, this.col+1, record);
};

Cell.prototype.off = function(record){
  if(record){
    var time = (new Date()).getTime();
    if(time > this.time){
      this.time = time;
      this.prevOn = this.isOn;
      this.prevNeighbors = this.neighbors;
    }
  }
  if(!this.isOn) return true;

  this.isOn = false;
  this.grid.removeNeighbor(this.row-1, this.col-1, record);
  this.grid.removeNeighbor(this.row-1, this.col, record);
  this.grid.removeNeighbor(this.row-1, this.col+1, record);
  this.grid.removeNeighbor(this.row, this.col-1, record);
  this.grid.removeNeighbor(this.row, this.col+1, record);
  this.grid.removeNeighbor(this.row+1, this.col-1, record);
  this.grid.removeNeighbor(this.row+1, this.col, record);
  this.grid.removeNeighbor(this.row+1, this.col+1, record);
  if(!config.transition && this.neighbors < 1){
    this.grid.deleteCell(this.row, this.col);
  }
};

Cell.prototype.toggle = function(){
  return this.isOn ? this.off(true) : this.on(true);
};

Cell.prototype.getColor = function(){
  if(config.preview){
    if(nextGrid.testCell(this.row, this.col)){
      return this.isOn ? config.colors.life : config.colors.birth;
    }else{
      return this.isOn ? config.colors.death : null;
    }
  }else{
    return this.isOn ? config.colors.life : null;
  }
};

Cell.prototype.getPrevColor = function(){
  if(this.time && this.time > currGrid.time){
    var wasOn = this.prevOn,
      prevNeighbors = this.prevNeighbors;
  }else{
    var wasOn = prevGrid.testCell(this.row, this.col),
      prevNeighbors = prevGrid.cellProperty(this.row, this.col, 'neighbors');
  }
  if(config.preview){
    if(wasOn){
      return prevNeighbors == 2 || prevNeighbors == 3 ? config.colors.life : config.colors.death;
    }else{
      return prevNeighbors == 3 ? config.colors.birth : null;
    }
  }else{
    return wasOn ? config.colors.life : null;
  }
};


function play(){
  config.isPlaying = true;
  if(!nextGrid.isGenerated) currGrid.generate(nextGrid, prevGrid);
}

function pause(){
  config.isPlaying = false;
}

function nextGeneration(){
  prevGrid.cells = currGrid.cells;
  prevGrid.cellCount = currGrid.cellCount;
  currGrid.cells = nextGrid.cells;
  currGrid.cellCount = nextGrid.cellCount;
  nextGrid.cells = {};
  nextGrid.cellCount = 0;
  currGrid.generate();
  delete config.isPrevious;
}

function prevGeneration(){
  if(config.isPrevious) return;
  var currentCells = currGrid.cells,
    currentCount = currGrid.cellCount;
  currGrid.cells = prevGrid.cells;
  currGrid.cellCount = prevGrid.cellCount;
  prevGrid.cells = currentCells;
  prevGrid.cellCount = currentCount;
  nextGrid.cells = {};
  nextGrid.cellCount = 0;
  currGrid.generate();
  config.isPrevious = true;
}

function getCoords(event){
  var cellSize = config.cellSize*config.zoom,
    origin = {
      x: config.origin.x,
      y: config.origin.y
    };
  if(event.touches){
    var coords = [];
    for(var i = 0; i < event.touches.length; i++){
      coords.push([
        Math.floor((event.touches[i].pageY + origin.y)/cellSize),
        Math.floor((event.touches[i].pageX + origin.x)/cellSize)
      ]);
    }
    return coords;
  }else{
    return [[
      Math.floor((event.pageY + config.origin.y)/cellSize),
      Math.floor((event.pageX + config.origin.x)/cellSize)
    ]];
  }
}

function draw(event, force){
  var coords = getCoords(event),
    grid = config.isPlaying ? nextGrid : currGrid;
  if(coords){
    targets = coords.map(function(coord){return coord[0]+','+coord[1]});
    coords.map(function(coord, i){
      if(force || !window.lastTargets || window.lastTargets.indexOf(targets[i]) < 0){
        grid.cell(coord[0], coord[1]).toggle();
      }
    });
    window.lastTargets = targets;
  }
}


// Navigation Functions //
function zoom(delta, x, y, initialZoom, initialPan){
  var newZoom = config.zoom,
    initialZoom = initialZoom || config.zoom,
    initialPan = initialPan || config.origin,
    newX = initialPan.x,
    newY = initialPan.y;

  var factor = delta*config.zoomStep;
  newZoom = initialZoom*(1 + factor);
  if(newZoom > config.zoomMax || newZoom < config.zoomMin){
    newZoom = Math.min(config.zoomMax, Math.max(config.zoomMin, newZoom));
    factor = newZoom/initialZoom - 1;
  }
  newX -= factor*(x - initialPan.x);
  newY -= factor*(y - initialPan.y);

  config.zoom = newZoom;
  config.origin.x = newX;
  config.origin.y = newY;
  updateWindow();
};

function pan(x, y, relativeTo){
  if(!relativeTo){
    relativeTo = config.origin;
  }
  config.origin.x = x + relativeTo.x;
  config.origin.y = y + relativeTo.y;
  updateWindow();
}


// Go! //
window.addEventListener('load', function(){
  window.canvas = document.getElementById('canvas');
  window.canvas.ctx = canvas.getContext('2d');
  window.canvas.ctx.canvas = canvas;
  window.buffer = document.getElementById('buffer');
  window.buffer.ctx = buffer.getContext('2d');
  window.buffer.ctx.canvas = buffer;

  window.prevGrid = new Grid();
  window.currGrid = new Grid();
  window.nextGrid = new Grid();

  currGrid.generate = function(cell){
    function _generate(cell){
      if(cell.neighbors == 3 || cell.isOn && cell.neighbors == 2){
        nextGrid.cell(cell.row, cell.col).on();
      }else if(config.transition && cell.isOn){
        nextGrid.cell(cell.row, cell.col);
      }
    }

    if(cell){
      _generate(cell);
    }else{
      var cell;
      for(var i in this.cells){
        _generate(this.cells[i]);
      }
      currGrid.time = (new Date()).getTime();
      nextGrid.isGenerated = true;
    }
  };

  // Initial settings
  config.halfCellSize = config.cellSize/2;
  config.transition = config.transitionOn && config.gps < 60;
  config.gpsMin = config.gps/Math.pow(config.gpsFactor, 6);
  config.gradSizeMax = config.gradSize*Math.pow(config.gradSizeFactor, 5);
  config.gradSizeMin = config.gradSize/Math.pow(config.gradSizeFactor, 5);
  config._default = _.extend({}, config);

  canvas.width = document.width;
  canvas.height = document.height;
  buffer.width = canvas.width || 2;
  buffer.height = canvas.height || 2;
  config.zoom = 1;
  config.origin = {x: -canvas.width/2, y: -canvas.height/2};
  loadConfig();
  config.isPrevious = true;

  if(config.blob){
    buffer.style.display = 'none';
  }else{
    canvas.style.display = 'none';
  }

  // requestAnimationFrame polyfill
  var lastTime = 0;
  var vendors = ['ms', 'moz', 'webkit', 'o'];
  for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x){
    window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
    window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
  }
  if(!window.requestAnimationFrame){
    window.requestAnimationFrame = function(callback, element){
      var currTime = new Date().getTime();
      var timeToCall = Math.max(0, 16 - (currTime - lastTime));
      var id = window.setTimeout(function(){
        callback(currTime + timeToCall);
      }, timeToCall);
      lastTime = currTime + timeToCall;
      return id;
    };
  }
  if(!window.cancelAnimationFrame){
    window.cancelAnimationFrame = function(id){
      clearTimeout(id);
    };
  }

  // Test for premultiplication
  var testData = buffer.ctx.getImageData(0,0,1,1);
  testData.data[0] = testData.data[3] = 64; // 25% red & alpha
  testData.data[1] = testData.data[2] = 0; // 0% blue & green
  buffer.ctx.putImageData(testData, 0, 0);
  testData = buffer.ctx.getImageData(0,0,1,1);
  config.premultiplyAlpha = (testData.data[0] < 60 || testData.data[0] > 70);


  // Canvas Functions
  CanvasRenderingContext2D.prototype.clear = function(color){
    this.save();
    this.setTransform(1,0,0,1,0,0);
    var width = this.canvas.width;
    var height = this.canvas.height;
    if(color){
      this.beginPath();
      this.globalAlpha = 1;
      this.globalCompositeOperation = 'source-over';
      this.rect(0, 0, width, height);
      this.fillStyle = color;
      this.fill();
    }else{
      this.clearRect(0, 0, width, height);
    }
    this.restore();
    this.beginPath();
    return this;
  };

  CanvasRenderingContext2D.prototype.circle = function(x, y, radius){
    this.arc(x, y, radius, 0, 2*Math.PI, false);
  };

  buffer.ctx.drawCell = function(cell){
    this.beginPath();

     if(config.transition){
       var startTime = Math.max(cell.time, currGrid.time),
         endTime = startTime + config.gInterval,
         percent = Math.min(1, Math.max(0, 1 - (endTime-config.time)/config.gInterval)),
         currColor = cell.getColor(),
         prevColor = cell.getPrevColor(),
         color = mixColors(prevColor, currColor, percent);
      if(!startTime){
        if(!cell.isOn && !config.preview) return;
      }else if(config.time >= endTime){
        if(!cell.isOn && cell.neighbors < 1){
          currGrid.deleteCell(cell.row, cell.col);
          return;
        }
      }
     }else{
       var color = cell.getColor();
     }

     if(!color) return;

    if(config.blob){
      var x = cell.col*config.cellSize+config.halfCellSize,
        y = cell.row*config.cellSize+config.halfCellSize,
        grd = this.createRadialGradient(x, y, 0, x, y, config.gradSize);
       grd.addColorStop(0, rgba(color));
       grd.addColorStop(1, rgba(color, 0));
      this.fillStyle = grd;
      this.circle(x, y, config.gradSize);
    }else{
      this.fillStyle = rgba(color);
      this.rect(cell.col*config.cellSize+0.5, cell.row*config.cellSize+0.5, config.cellSize-1, config.cellSize-1);
    }

    this.fill();
  };
  buffer.ctx.redraw = function(){
    var ctx = this;
    ctx.clear();
    ctx.save();
    ctx.translate(-config.origin.x, -config.origin.y);
    ctx.scale(config.zoom, config.zoom);

    config.time = (new Date()).getTime();

    if(config.preview || config.transition){
      if(config.cellCount > currGrid.cellCount){
        for(var id in currGrid.cells){
          ctx.drawCell(currGrid.cells[id]);
        }
      }else{
        for(var row = config.minRow; row < config.maxRow; row++){
          for(var col = config.minCol; col < config.maxCol; col++){
            var cell = currGrid.cells[cellID(row, col)];
            if(cell){
              ctx.drawCell(cell);
            }
          }
        }
      }
    }else{
      if(config.cellCount > currGrid.cellCount){
        for(var id in currGrid.cells){
          if(currGrid.cells[id].isOn) ctx.drawCell(currGrid.cells[id]);
        }
      }else{
        for(var row = config.minRow; row < config.maxRow; row++){
          for(var col = config.minCol; col < config.maxCol; col++){
            var cell = currGrid.cells[cellID(row, col)];
            if(cell && cell.isOn){
              ctx.drawCell(cell);
            }
          }
        }
      }
    }
    ctx.restore();
  };

  var a = 0.25, b = 1;
  canvas.ctx.falloff = function(x){
    if(!config.smooth) return 0;
    var xc = x/config.gradFloor;
    return (2-Math.sqrt(4-4*xc)-xc)*255;
    // return (2-Math.sqrt(4-4*xc)-xc)*(config.gradFloor*(b-a)+a)*255;
  };
  canvas.ctx.redraw = function(){
    buffer.ctx.redraw();

    if(config.blob){
      this.clear();
      var x, alpha,
        image = buffer.ctx.getImageData(0, 0, buffer.width, buffer.height),
        imageData = image.data,
        length = imageData.length;
      for(var i = 3; i < length; i += 4){
        alpha = imageData[i];
        x = alpha/255;
        if(alpha <= 0) continue;
        alpha = x < config.gradFloor ? this.falloff(x) : 255*config.fillOpacity; //Math.round((x*(b-a) + a)*255);

        // imageData[i - 3] = config.colors.life.r;
        // imageData[i - 2] = config.colors.life.g;
        // imageData[i - 1] = config.colors.life.b;
        if(config.premultiplyAlpha){
          imageData[i - 3] /= 255/alpha;
          imageData[i - 2] /= 255/alpha;
          imageData[i - 1] /= 255/alpha;
        }
        imageData[i] = alpha;
      }
      image.data = imageData;
      this.putImageData(image, 0, 0);
    }
  };

  animate = function(){
    requestAnimationFrame(animate);
    if(config.isPlaying && currGrid.time && currGrid.time+config.gInterval <= config.time){
      nextGeneration();
    }
    canvas.ctx.redraw();
  };

  // Input Functions
  document.addEventListener('keydown', hotkey, false);
  window.addEventListener('mousedown', mousedown, false);
  window.addEventListener('mousewheel', mousewheel, false);
  window.addEventListener('mouseup', mouseup, false);
  window.addEventListener('resize', resize, false);
  resize();

  document.scrollTop = 0;

  setGPS(config.gps);
  randomize();
  animate();
  play();
}, false);
