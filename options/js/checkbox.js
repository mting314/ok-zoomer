function logAlarms() {
  chrome.storage.sync.get({
      alarms: []
    },
    function (data) {
      if (data.alarms) {
        console.log("Alarms are now on");
      } else {
        console.log("Alarms are now off");
      }
    }
  );
}

$('input[name=alarms]').change(function () {
  if ($(this).is(':checked')) {
    chrome.storage.sync.set({
      alarms: true
    }, function () {
      logAlarms()
    });
  } else {
    chrome.storage.sync.set({
      alarms: false
    }, function () {
      logAlarms()
    });
  }
});

// $('input[name=alerts]').change(function () {
//   if ($(this).is(':checked')) {
//     console.log("checked!")
//     // Checkbox is checked..
//   } else {
//     console.log("not checked :(")
//     // Checkbox is not checked..
//   }
// });

// $('input[name=alerts]').change(function () {
//   if ($(this).is(':checked')) {
//     console.log("checked!")
//     // Checkbox is checked..
//   } else {
//     console.log("not checked :(")
//     // Checkbox is not checked..
//   }
// });