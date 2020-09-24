function classInProgress(classDiv, targetHeight) {
  var divTop = parseInt(classDiv.style.top, 10)
  var divBottom = divTop + parseInt(classDiv.style.height, 10)
  return (divTop < targetHeight && targetHeight < divBottom)
}

(function () {
    // TODO: I think I might be able to switch this to moment, but is there a need?
  var grids = $(".daybox");
  grids.each(function (index) {
    var hourCount = $(this).find(".hourbox").length + 1;
    var timecols = $(this).find(".timebox");

    var now = new Date();
    var usaTime = new Date(now.toLocaleString('en-US', {
      timeZone: "America/Los_Angeles"
    }))
    // usaTime.setHours(11);
    // usaTime.setDate(now.getDate() + 2);
    if (8 <= usaTime.getHours() && usaTime.getHours() < 8 + hourCount) {
      var currentDay = (((usaTime.getDay() - 1) % 7) + 7) % 7;

      var minutesFrom8 = (usaTime.getHours() - 8)*60 + usaTime.getMinutes();
      var hourboxHeight = $(".hourbox:eq(0)").height();
      var targetHeight = hourboxHeight / 60 * minutesFrom8;

      if (timecols.length > currentDay) {
        timecols.each(function (dayIndex, timecol) {
          var containingDiv = $(`<div class="${(dayIndex < currentDay) ? "otherday" : "thisday"}" style="top: ${targetHeight}px"></div>`)
          $(timecol).append(containingDiv);
          if (dayIndex == currentDay) {
            return false;
          }
        })
      }
    }

    $(timecols[currentDay]).find(".planneritembox").each(function (i, classDiv) {
      if (classInProgress(classDiv, targetHeight)) {
        classDiv.classList.add("currentClass");
      }
    })

  })
})();