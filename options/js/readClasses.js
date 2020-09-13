function editClass(editedRow) {
  chrome.storage.sync.get('classes', function (result) {
    var classIndex = parseInt(editedRow.find("td#classTableIndex").text()) - 1;

    var classObject = result.classes[classIndex]
    classObject.url = editedRow.find("td#classURL").text()
    classObject.password = editedRow.find("td#classPassword").text()

    // chrome.runtime.sendMessage({
    //   newObject: classObject,
    //   index: classIndex,
    //   type: "editClass",
    // }, function (response) {
    //   console.log(response.farewell);
    //   location.reload()
    // });

    var msg = {
      newObject: classObject,
      index: classIndex,
      type: "editClass",
    }
    console.log("sending message:", msg);

    port.postMessage(msg);

  });
}

function editPersonal(editedRow) {
  chrome.storage.sync.get('personal', function (result) {
    var personalIndex = parseInt(editedRow.find("td#personalTableIndex").text()) - 1;

    var personalObject = result.personal[personalIndex]
    personalObject.url = editedRow.find("td#personalURL").text()
    personalObject.password = editedRow.find("td#personalPassword").text()

    // chrome.runtime.sendMessage({
    //   newObject: personalObject,
    //   index: personalIndex,
    //   type: "editPersonal",
    // }, function (response) {
    //   console.log(response.farewell);
    //   location.reload()
    // });

    var msg = {
      newObject: personalObject,
      index: personalIndex,
      type: "editPersonal",
    }
    console.log("sending message:", msg);

    port.postMessage(msg);
  });
}

function deleteClass(deletedRow) {
  var classIndex = parseInt(deletedRow.find("td#classTableIndex").text()) - 1;

  // chrome.runtime.sendMessage({
  //   index: classIndex,
  //   type: "deleteClass",
  // }, function (response) {
  //   console.log(response.farewell);
  //   location.reload()
  // });

  var msg = {
    index: classIndex,
    type: "deleteClass"
  }
  console.log("sending message:", msg);

  port.postMessage(msg);
}

function deletePersonal(deletedRow) {
  var personalIndex = parseInt(deletedRow.find("td#personalTableIndex").text()) - 1;
  // chrome.runtime.sendMessage({
  //   index: personalIndex,
  //   type: "deletePersonal",
  // }, function (response) {
  //   console.log(response.farewell);
  //   location.reload()
  // });

  var msg = {
    index: personalIndex,
    type: "deletePersonal",
  }
  console.log("sending message:", msg);

  port.postMessage(msg);
}

var port = chrome.runtime.connect({
  name: "knockknock"
});
port.onMessage.addListener(function (msg) {
  var $alertBox = $("#change-alert")
  // successful deletion
  if (msg.type == "successDeleteClass") {
    $alertBox.addClass("alert-success");
    $alertBox.text(`${extractClassName(msg.oldClass)} was successfully removed from Ok, Zoomer.`)
  } else if (msg.type == "successDeletePersonal") {
    $alertBox.addClass("alert-success");
    $alertBox.text(`${msg.oldPersonal.entryInfo.name} was successfully removed from Ok, Zoomer.`)

    // failed deletion
  } else if (msg.type == "failureDeleteClass") {
    $alertBox.addClass("alert-danger");
    $alertBox.text(`Error deleting class: ${msg.error}`)
  } else if (msg.type == "failureDeletePersonal") {
    $alertBox.addClass("alert-danger");
    $alertBox.text(`Error deleting personal entry: ${msg.error}`)

    // failed edit
  } else if (msg.type == "failureEditClass") {
    $alertBox.addClass("alert-danger");
    $alertBox.text(`Error editing class: ${msg.error}`)
  } else if (msg.type == "failureEditPersonal") {
    $alertBox.addClass("alert-danger");
    $alertBox.text(`Error editing personal entry: ${msg.error}`)
  }
  $alertBox.fadeTo(5000, 500).slideUp(500, function () {
    $alertBox.slideUp(500);
  });

  readToTables();
});

var classTable = new BSTable("Class Zooms", "table1", {
  editableColumns: "5,6",
  onEdit: function (editedRow) {
    editClass($(editedRow[0]));
  },
  onBeforeDelete: function (deletedRow) {
    console.log(deletedRow);
    deleteClass(deletedRow);
  },
  emptyText: "No Classes have been added to Ok, Zoomer yet."
});

var personalTable = new BSTable("Personal Entries", "table4", {
  editableColumns: "4,5",
  onEdit: function (editedRow) {
    editPersonal($(editedRow[0]));
  },
  onBeforeDelete: function (deletedRow) {
    console.log($(deletedRow[0]));
    deletePersonal(deletedRow);
  },
  emptyText: "No Personal Entries have been added to Ok, Zoomer yet."
});

readToTables();

function readToTables() {
  // restart both tables to flush out
  classTable.restart();
  personalTable.restart();
  chrome.storage.sync.get('classes', function (result) {
    if (result.classes != undefined) {

      for (const [index, classObject] of result.classes.entries()) {
        console.log(classObject.classInfo);
        var row = $('<tr>').append(`<td id="classTableIndex">${(index+1).toString()}</td>
      <td id="className">${extractClassName(classObject)}</td>
      <td id="classSection">${classObject.classInfo.class_section}</td>
      <td id="classMeetDays">${classObject.classInfo.meet_days}</td>
      <td id="classMeetTime">${removeTags(classObject.classInfo.meet_times)}</td>
      <td id="classURL">${classObject.url}</td>
      <td id="classPassword">${classObject.password}</td>`);
        classTable.table.append(row);
      }
    }
    classTable.init();
    classTable.emptyTables();

  });

  chrome.storage.sync.get('personal', function (result) {
    if (result.personal != undefined) {

      for (const [index, personalObject] of result.personal.entries()) {
        console.log(personalObject)
        var row = $('<tr>').append(`<td id="personalTableIndex">${(index+1).toString()}</td>
      <td id="personalName">${personalObject.entryInfo.name}</td>
      <td id="personalMeetDays">${personalObject.entryInfo.days}</td>
      <td id="personalMeetTime">${removeTags(personalObject.entryInfo.time)}</td>
      <td id="personalURL">${personalObject.url}</td>
      <td id="personalPassword">${personalObject.password}</td>`);
        personalTable.table.append(row);

      }
    }
    personalTable.init();
    personalTable.emptyTables();


  });
}

$(document).ready(function () {
  $("#change-alert").hide();

});