function classInProgress(classDiv, targetHeight) {
  let divTop = parseInt(classDiv.style.top, 10)
  let divBottom = divTop + parseInt(classDiv.style.height, 10)
  return (divTop < targetHeight && targetHeight < divBottom)
}

(function () {
  // TODO: I think I might be able to switch this to moment, but is there a need?
  let grids = $(".daybox");
  // Do this timeline injection on each grid. There's only one grid most of the time, but summer displays
  // both sessions A and C
  grids.each(function (index) {
    let hourCount = $(this).find(".hourbox").length + 1;
    let timecols = $(this).find(".timebox");

    let now = new Date();
    let usaTime = new Date(now.toLocaleString('en-US', {
      timeZone: "America/Los_Angeles"
    }))
    // usaTime.setHours(11);
    // usaTime.setDate(now.getDate() - 2);
    let currentDay = (((usaTime.getDay() - 1) % 7) + 7) % 7;
    // If the current (US) time is within the boundaries of the grid, draw in the line at the appropriate height
    // and highlight current class if the line crosses it (on the right day)
    if (8 <= usaTime.getHours() && usaTime.getHours() < 8 + hourCount) {

      let minutesFrom8 = (usaTime.getHours() - 8) * 60 + usaTime.getMinutes();
      let hourboxHeight = $(".hourbox:eq(0)").height();
      let targetHeight = hourboxHeight / 60 * minutesFrom8;


      if (timecols.length > currentDay) {
        timecols.each(function (dayIndex, timecol) {
          let containingDiv = $(`<div class="${(dayIndex < currentDay) ? "otherday" : "thisday"}" style="top: ${targetHeight}px"></div>`)
          $(timecol).append(containingDiv);
          if (dayIndex == currentDay) {
            // stop looping (by returning) when we get to the current weekday
            return false;
          }
        })
      }
      
      // loop through all planner boxes in the current day (column)
      // and highlight class if it's the right time and day
      $(timecols[currentDay]).find(".planneritembox").each(function (i, classDiv) {
        if (classInProgress(classDiv, targetHeight)) {
          classDiv.classList.add("currentClass");
        }
      })
    }



  })
})();