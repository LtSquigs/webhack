hterm.defaultStorage = new lib.Storage.Memory();

// HTERM Preferences
[["alt-sends-what", "browser-key"],
 ["background-color", "#000000"],
 ["cursor-color", "rgba(170, 170, 170, 0.5)"],
 ["color-palette-overrides", ["#000000", "#aa0000", "#00aa00", "#aa5500",
                              "#0000ff", "#aa00aa", "#00aaaa", "#aaaaaa",
                              "#555555", "#ff5555", "#55ff55", "#ffff55",
                              "#5555ff", "#ff55ff", "#55ffff", "#ffffff"]],
 ["enable-bold", false],
 ["font-smoothing", ""],
 ["foreground-color", "#aaaaaa"],
 ["font-family", '"DejaVu Sans Mono", monospace'],
 ["scrollbar-visible", false]
].forEach(function(v) {
  hterm.PreferenceManager.defaultPreferences[v[0]] = v[1];
});

/*
* Handles parsing the messages recieved from the NAO server. Mainly used to turn on
* the tiles if vt_tiledata is detected, and turning them off if exiting the game is detected.
*
* @param msg The data from the NAO server
*/
var parseMessage = function(msg) {
  if (!msg || !msg.data)
      return;
  if (typeof msg.data === "string")
      return;

  var serverString = String.fromCharCode.apply(String, new Uint8Array(msg.data));
  
  // This header is on ever menu in NAO, so its a good way to detect if you've
  // exited the game. On exit clear the tiles and hide the window.
  if(serverString.indexOf('nethack.alt.org - http://nethack.alt.org/') !== -1) {
    window.removeTiles();
  }

  if(serverString.match(/(\x1b\[2;\dz)/) !== 1) {
    window.initializeTiles();
  }

  // Send the data to the terminal
  this.io.writeUTF8(serverString);
}


var webhack = function(argv) {
    this.argv_ = argv;
    this.io = null;
    this.ws = null;
    this.address = argv.argString;
    window.cmd_ = this;
};

// Sends string to websocket (hooked into hterm)
webhack.prototype.sendString = function(s) {
    if (this.ws && this.ws.readyState <= 1) {
        this.ws.send(new Blob([s]));
    } else if (s == "c") {
        this.connect(this.address);
    }
};

// Connect to the websocket, force 80x24
webhack.prototype.connect = function(addr) {
    this.ws = new WebSocket(addr +
                            "?c=80" +
                            "&l=24" );
    this.ws.binaryType = "arraybuffer";

    this.io.writeUTF8('\x1b[2J\x1b[0;0HConnecting....');
    this.ws.onmessage = parseMessage.bind(this)
};

// Instructions
webhack.prototype.run = function(term) {
  this.io = this.argv_.io.push();
  this.io.sendString = this.io.onVTKeystroke = this.sendString.bind(this);
  this.io.writeUTF8('Enable the vt_tiledata option on your NAO account.');
  this.io.writeUTF8('\x1b[EZoom in with Ctrl +/- until you\'re close to 80x24 (without going under).');
  this.io.writeUTF8('\x1b[EThen connect with c');
};

// Initialize the terminal, connect to websocket
$(document).ready(function() {

  var term = new hterm.Terminal();
  window.term_ = term;

  term.onTerminalReady = function () {
      term.setFontSize(0);
      term.runCommandClass(webhack, "ws://96.126.102.202/");
  };

  term.decorate(document.getElementById("terminal"));

  // Override the global keypress and send to the terminal.
  // The tile window steals focus from the terminal window, so this fixs that
  $(window).on('keypress', function(e) {
    term.keyboard.onKeyPress_(e);
  });
});