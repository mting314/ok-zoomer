function classInProgress(classDiv, targetHeight) {
  var divTop = parseInt(classDiv.style.top, 10)
  var divBottom = divTop + parseInt(classDiv.style.height, 10)
  return (divTop < targetHeight && targetHeight < divBottom)
}

(function () {
  var grids = $(".daybox");
  grids.each(function (index) {
    var hourCount = $(this).find(".hourbox").length + 1;

    var now = new Date();
    // now.setHours(11);
    // now.setDate(now.getDate() + 2);
    if (8 <= now.getHours() && now.getHours() < 8 + hourCount) {
      var currentDay = (((now.getDay() - 1) % 7) + 7) % 7;
      var eightAM = new Date(now.getTime());
      eightAM.setHours(8, 0, 0, 0);

      var minutesFrom8 = (now - eightAM) / 60000;
      var hourboxHeight = $(".hourbox:eq(0)").height();
      var targetHeight = hourboxHeight / 60 * minutesFrom8;

      var timecols = $(this).find(".timebox");
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