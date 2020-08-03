var alarmClock = {

  onHandler : function(e) {
    chrome.storage.sync.set({"isOn" : true}, function() {
      console.log("Alarm has been turned on")
    });
  },

  offHandler : function(e) {
    chrome.storage.sync.set({"isOn" : false}, function() {
      console.log("Alarm has been turned off")
    });
  },

  setup: function() {
      var a = document.getElementById('alarmOn');
      a.addEventListener('click',  alarmClock.onHandler );
      var a = document.getElementById('alarmOff');
      a.addEventListener('click',  alarmClock.offHandler );
  }
};

document.addEventListener('DOMContentLoaded', function () {
alarmClock.setup();
});