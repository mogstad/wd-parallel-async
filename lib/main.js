var wd = require('wd')
  , events = require('events')
  , util = require('util');

var pool = 5;

var parallelizer = function (wd_args, options) {
  this.wd_args = wd_args;
  this.options = options || {};
  events.EventEmitter.call(this);
};

util.inherits(parallelizer, events.EventEmitter);

parallelizer.prototype.run = function (desired, test) {
  var _this = this
    , max = (desired.length < pool ? desired.length : pool)
    , running = max;

  var runNextJob = function() {
    var remote = _this.options.usePromises ? "promiseRemote" : "remote";
    remote = _this.options.useChaining ? "promiseChainRemote" : remote;

    var driver = wd[remote](_this.wd_args);
    driver.on('status', function(info) {
      if (info.indexOf("Ending") != -1) {
        runNextJob();
      }
    });
    
    var caps = desired.pop();
    if (caps != null) {
      test(driver, caps);
    } else if (--running <= 0) {
        _this.emit('end');
    }
  };
  
  for (var i = 0; i < max; i++) {
    runNextJob();
  }
};

exports.parallelizer = function (wd_args) {
  return new parallelizer(wd_args);
};
