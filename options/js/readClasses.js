function editClass(editedRow) {
  var classZoomerID = parseInt(editedRow.attr('id'));
  chrome.storage.sync.get(classZoomerID.toString(), function (foundClass) {

    // var classObject = foundClass[classZoomerID]
    // classObject.url = editedRow.find("td#classURL").text()
    // classObject.password = editedRow.find("td#classPassword").text()

    // console.log(classObject)
    // var msg = {
    //   newObject: classObject,
    //   zoomerID: classZoomerID,
    //   type: "editClass",
    // }
    var msg = {
      zoomerID: classZoomerID,
      editingObj: {
        url: editedRow.find("td#classURL").text(),
        password: editedRow.find("td#classPassword").text(),
      },
      type: "editItem",
    }
    console.log("sending message:", msg);

    port.postMessage(msg);
  });


  // chrome.runtime.sendMessage({
  //   newObject: classObject,
  //   index: classIndex,
  //   type: "editClass",
  // }, function (response) {
  //   console.log(response.farewell);
  //   location.reload()
  // });


}

function editPersonal(editedRow) {
  chrome.storage.sync.get('personal', function (result) {
    var personalIndex = parseInt(editedRow.find("td#personalTableIndex").text()) - 1;

    // var personalObject = result.personal[personalIndex]
    // personalObject.url = editedRow.find("td#personalURL").text()
    // personalObject.password = editedRow.find("td#personalPassword").text()

    // var msg = {
    //   newObject: personalObject,
    //   index: personalIndex,
    //   type: "editPersonal",
    // }
    console.log("sending message:", msg);
    var msg = {
      zoomerID: classZoomerID,
      editingObj: {
        url: editedRow.find("td#personalURL").text(),
        password: editedRow.find("td#personalPassword").text(),
      },
      type: "editItem",
    }

    port.postMessage(msg);
  });
}

function deleteClass(deletedRow) {
  var classZoomerID = parseInt(deletedRow.attr('id'));

  // chrome.runtime.sendMessage({
  //   index: classIndex,
  //   type: "deleteClass",
  // }, function (response) {
  //   console.log(response.farewell);
  //   location.reload()
  // });

  var msg = {
    zoomerID: classZoomerID,
    type: "deleteClass"
  }
  console.log("sending message:", msg);

  port.postMessage(msg);
}

function deletePersonal(deletedRow) {
  var personalZoomerID = parseInt(deletedRow.attr('id'));
  // chrome.runtime.sendMessage({
  //   index: personalIndex,
  //   type: "deletePersonal",
  // }, function (response) {
  //   console.log(response.farewell);
  //   location.reload()
  // });

  var msg = {
    zoomerID: personalZoomerID,
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
  if (msg.type == "successDeleteClass" || msg.type == "successDeletePersonal") {
    console.log(msg);
    $alertBox.addClass("alert-success");
    $alertBox.text(`${extractClassName(msg.oldItem, true)} was successfully removed from Ok, Zoomer.`)

    // failed deletion
  } else if (msg.type == "successEditClass" || msg.type == "successEditPersonal") {
    $alertBox.addClass("alert-success");
    $alertBox.text(`${extractClassName(msg.oldItem, true)} was successfully edited`)

    // failed edit
  } else if (msg.type == "failureDeleteClass" || msg.type == "failureDeletePersonal") {
    $alertBox.addClass("alert-danger");
    $alertBox.text(`Error deleting class: ${msg.error}`)

    // failed edit
  } else if (msg.type == "failureEditClass" || msg.type == "failureEditPersonal") {
    $alertBox.addClass("alert-danger");
    $alertBox.text(`Error editing class: ${msg.error}`)
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
  getAllClasses(function (classList) {
    console.log("asdfsd")
    if (classList.length != 0) {

      for (var index = 0, classObject; classObject = classList[index]; index++) {
        console.log(classObject.classInfo);
        var row = $(`<tr id="${(classObject.zoomerID).toString()}">`).append(`<td id="classTableIndex">${(index+1).toString()}</td>
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
    if (result.personal !== undefined) {

      for (const [index, personalObject] of result.personal.entries()) {
        var row = $(`<tr id="${(personalObject.zoomerID).toString()}">`).append(`<td id="personalTableIndex">${(index+1).toString()}</td>
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