function classInProgress(classDiv, targetHeight) {
  let divTop = parseInt(classDiv.style.top, 10)
  let divBottom = divTop + parseInt(classDiv.style.height, 10)
  return (divTop < targetHeight && targetHeight < divBottom)
}

(function () {
    // TODO: I think I might be able to switch this to moment, but is there a need?
  let grids = $(".daybox");
  grids.each(function (index) {
    let hourCount = $(this).find(".hourbox").length + 1;
    let timecols = $(this).find(".timebox");

    let now = new Date();
    let usaTime = new Date(now.toLocaleString('en-US', {
      timeZone: "America/Los_Angeles"
    }))
    // usaTime.setHours(11);
    // usaTime.setDate(now.getDate() - 2);
    if (8 <= usaTime.getHours() && usaTime.getHours() < 8 + hourCount) {
      let currentDay = (((usaTime.getDay() - 1) % 7) + 7) % 7;

      let minutesFrom8 = (usaTime.getHours() - 8)*60 + usaTime.getMinutes();
      let hourboxHeight = $(".hourbox:eq(0)").height();
      let targetHeight = hourboxHeight / 60 * minutesFrom8;

      if (timecols.length > currentDay) {
        timecols.each(function (dayIndex, timecol) {
          let containingDiv = $(`<div class="${(dayIndex < currentDay) ? "otherday" : "thisday"}" style="top: ${targetHeight}px"></div>`)
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