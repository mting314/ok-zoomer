function classInProgress(classDiv, targetHeight) {
  var divTop = parseInt(classDiv.style.top, 10)
  var divBottom = divTop + parseInt(classDiv.style.height, 10)
  return (divTop < targetHeight && targetHeight < divBottom)
}

(function () {
  var currentGrid = document.getElementsByClassName("daybox")[1];
  var hourCount = 0;
  for (let item of currentGrid.childNodes) {
    if (item.className == "hourbox") {
      hourCount++;
    }
  }



  var now = new Date();
  // now.setHours(11);
  if (8 <= now.getHours() && now.getHours() < 8 + hourCount) {
    var currentDay = now.getDay();
    if (currentDay != 6 && currentDay != 0) {
      var eightAM = new Date();
      eightAM.setHours(8, 0, 0, 0);
      var minutesFrom8 = (now - eightAM) / 60000;

      var targetHeight = 48 / 60 * minutesFrom8;
      var start = hourCount;
      
      while (start < hourCount + currentDay - 1) {
        var containingDiv = document.createElement("div");

        var injectingCol = currentGrid.childNodes[start];
        var injectingHR = document.createElement("hr");

        containingDiv.style.top = `${targetHeight}px`;


        injectingHR.className = "oof";

        if (start < hourCount + currentDay - 2) {
          containingDiv.className = "otherday";
        } else {
          containingDiv.className = "thisday";
        }
        // containingDiv.appendChild(injectingHR)
        injectingCol.appendChild(containingDiv)

        start++;
      }
      currentGrid.childNodes[hourCount + currentDay - 2].childNodes.forEach(
        function (currentValue) {
          if (currentValue.className == "planneritembox" && classInProgress(currentValue, targetHeight)) {
            currentValue.classList.add("currentClass");
          }
        }
      )
      //     console.log(item.className);
      //     if (item.className == "planneritembox" && classInProgress(item)){
      //       item.classList.add("currentClass");
      //     }
      //   }

    }
  }
})();