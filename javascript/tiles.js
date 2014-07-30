
// Let's us know if any tiles have been drawn, don't bother showing the cursor until we've had some drawn
var noTilesDrawn = true;

// Current tile size, keep track of this because eventually want to support window resize
var curTileSize = 16;

// Updated by hterm as it hits ANSI codes indicated a window change
window.currentWindow = -1;

/*
* Handles updating the windows based off of the vt_tiledata codes. Is called by hterm when a window is switched
* (Goes from drawing one window to another), or when the input code is reached. Is passed the window before switch.
*
* @param windowNum        The window number to update
* @param parseState The parser state at the time of the window update
*/
window.updateWindowFunction = function(windowNum, parseState) {
 switch(windowNum) {
    case 0: // Window 0 is a non-window (used for the --More-- and (End) parts of message/menus), ignore
    case 1: // Window 1 represents Message window, shouldn't hide the tiles on mesage (TODO: Hide if message is > 1 line)
    case 2: // Window 2 is status window, never need to hide the tile window on this
        break;
    case 3: // Window 3 is the tile window, if being written to show it
        $('#tiles').show();
        break;
    case 4: // Window 4 is the menu window (inventory, options), hide tiles so we can show
    case 5: // Window 5 is the 'text' window, think its used the opening text when starting a new game
    case 6: // Window 6 seems to be sub menu (to see one Ctrl+O for options, edit num_pad, that menu is a sub menu)
    default: // Handle any windows we dont know by hiding the tiles, theoretically windows can be created on the fly
        $('#tiles').hide(); 
        break;
  }
}

/*
* Draw a tile into the tile window, is called from hterm when the appropraite ANSI code is reached
* @param row The row of the tile to draw
* @param col The column of the tile to draw
* @param id  The id of the tile to draw
*/
window.drawTile = function(row, col, id) {

  // Tiles have been drawn at least once, flip this to false
  noTilesDrawn = false;

  // If tiles are being drawn, let's make sure we show the window
  $('#tiles').show();

  // Tile are just img tags, width/height are the tile width/height
  // Image name for now is always 16-<id>.png
  var imgHtml = $('<img style="position: absolute;"/>');

  imgHtml.css('width', curTileSize + 'px');
  imgHtml.css('height', curTileSize + 'px');

  // Adjust row-1 because the first row is the status line and is not part of the #tiles window
  // Otherwise we position the image absolutely based off row/col size
  imgHtml.css('top', ((row - 1) * curTileSize) + 'px');
  imgHtml.css('left', (col * curTileSize) + 'px');
  imgHtml.attr('src', 'images/16px/16-' + id + '.png');

  // Add this class here so we can track later
  imgHtml.addClass('tile-' + row + '-' + col);

  // Remove old tile at that coordinate
  $('#realTiles').find('tile-' + row + '-' + col).remove();

  // Add tile
  $('#realTiles').append(imgHtml);
};

/*
* Clear the tile screen, is called by hterm when a 2J ansi code is performed while
* the tile window is active.
*/
window.clearTiles = function() {
  $('#realTiles').children().remove();
  $('#tiles').hide(); // Hide the screen, a clear usually means a menu is being shown or a level changed
};

/*
* Updates the 'cursor' div that shows what tile is selected. Is called by hterm on cursor move.
* 
* @param row The row the cursor needs to be updated to
* @param col The column the cursor needs to be updated to
*/
window.updateTileCursor = function(row, col) {

  // If no tiles have been drawn yet, or the cursor is outside the tile area
  // Don't bother drawing it
  if(row === 0 || row > 22 || noTilesDrawn) {
    return;
  }

  // The cursor is effectively just a div of TileSize x TileSize dimension
  // The class is styled in webhack.css and can be changed to change the look of the cursor
  var cursor = $('<div class="activeCursor" style="position: absolute;"></div>');

  cursor.css('width', curTileSize + 'px');
  cursor.css('height', curTileSize + 'px');

  cursor.css('top', ((row - 1) * curTileSize) + 'px');
  cursor.css('left', (col * curTileSize) + 'px');

  // Remove old one, add new one
  $('#tiles').find('.activeCursor').remove();
  $('#tiles').append(cursor);
};

var isInitialized = false;

/*
* Initialize the tile window, called when it's detected that tile data is being sent
*
*/
window.initializeTiles = function() {
  if(isInitialized) {
    return;
  }

  // Grab the first row of the terminal to determine the row heights
  var firstRow = $('#terminal').find('iframe').first().contents().find('x-row')[0];
  var rowHeight = $(firstRow).height();

  // Move the tile container just past the first row, and through the 21 other rows
  // That way we block the parts of the terminal we need to
  $('#tiles').css('top', rowHeight * 1);
  $('#tiles').css('height', rowHeight * 21);

  // Calculate the largest tile size based off the height of the window 
  // Find the closest divisible size by the 21 rows.
  var overHeight = rowHeight * 21;
  var realHeight = Math.floor(overHeight / 21) * 21;
  curTileSize = realHeight / 21;

  // If this is too wide for the window (80 rows is larger than the window width)
  // Then use window width to determin the tile size
  if(curTileSize * 80 > $(window).width()) {
    var realWidth = Math.floor($(window).width() / 80) * 80;
    curTileSize = realWidth/80;
  }

  // Adjust the actual tile container to the real height
  $('#realTiles').css('height', realHeight);
  isInitialized = true;
}

/*
* Remove the tiles, hide the window, uninitalize the system
*/
window.removeTiles = function() {
  window.clearTiles();
  $('#tiles').hide();
  $('.activeCursor').remove();

  isInitialized = false;
}
