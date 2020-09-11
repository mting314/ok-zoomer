function editClass(editedRow) {
  chrome.storage.sync.get('classes', function (result) {
    var classIndex = parseInt(editedRow.find("td#classTableIndex").text()) - 1;

    var classObject = result.classes[classIndex]
    classObject.url = editedRow.find("td#classURL").text()
    classObject.password = editedRow.find("td#classPassword").text()

    chrome.runtime.sendMessage({
      newObject: classObject,
      index: classIndex,
      type: "editClass",
    }, function (response) {
      console.log(response.farewell);
      location.reload()
    });

  });
}

function editPersonal(editedRow) {
  chrome.storage.sync.get('personal', function (result) {
    var personalIndex = parseInt(editedRow.find("td#personalTableIndex").text()) - 1;

    var personalObject = result.personal[personalIndex]
    personalObject.url = editedRow.find("td#personalURL").text()
    personalObject.password = editedRow.find("td#personalPassword").text()

    chrome.runtime.sendMessage({
      newObject: personalObject,
      index: personalIndex,
      type: "editPersonal",
    }, function (response) {
      console.log(response.farewell);
      location.reload()
    });

  });
}

function deleteClass(deletedRow) {
  var classIndex = parseInt(deletedRow.find("td#classTableIndex").text()) - 1;

  chrome.runtime.sendMessage({
    index: classIndex,
    type: "deleteClass",
  }, function (response) {
    console.log(response.farewell);
    location.reload()
  });

}

function deletePersonal(deletedRow) {
  var personalIndex = parseInt(deletedRow.find("td#personalTableIndex").text()) - 1;
  chrome.runtime.sendMessage({
    index: personalIndex,
    type: "deletePersonal",
  }, function (response) {
    console.log(response.farewell);
    location.reload()
  });
}

var classTable = new BSTable("Class Zooms", "table1", {
  editableColumns: "5,6",
  onEdit: function (editedRow) {
    editClass($(editedRow[0]));
  },
  onBeforeDelete: function (deletedRow) {
    console.log(deletedRow);
    deleteClass(deletedRow);
  }
});

chrome.storage.sync.get('classes', function (result) {
  if (result.classes != undefined && result.classes.length != 0) {

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


      // var row = document.createElement('tr');

      // var rowIndex = document.createElement('th');
      // rowIndex.appendChild(document.createTextNode(index.toString()));
      // row.appendChild(rowIndex);

      // var className = row.insertCell();
      // className.appendChild(document.createTextNode(extractClassName(classObject)));

      // var section = row.insertCell();
      // section.appendChild(document.createTextNode(classObject.classInfo.class_section));

      // var days = row.insertCell();
      // days.appendChild(document.createTextNode(classObject.classInfo.meet_days));

      // var time = row.insertCell();
      // time.appendChild(document.createTextNode(removeTags(classObject.classInfo.meet_times)));

      // var zoomLink = row.insertCell();
      // zoomLink.appendChild(document.createTextNode(classObject.url));

      // var password = row.insertCell();
      // var passwordText;
      // if (classObject.password) {
      //   passwordText = document.createTextNode(classObject.password)
      // } else {
      //   // TODO: is there a better way of doing this? Causes problems right now with editing table
      //   // idea: instead, with a later script come in and replace all empty cells with red "N/A"?
      //   passwordText = document.createElement("span")
      //   passwordText.className = "no-password";
      //   passwordText.appendChild(document.createTextNode("No Password"))
      // }
      // password.appendChild(passwordText);

      // classTable.table.append(row);
    }
    classTable.init();
  } else {
    var colCount = classTable.table[0].rows[0].cells.length

    var row = document.createElement('tr');
    var cell = row.insertCell();
    cell.appendChild(document.createTextNode("No classes have been added to Ok, Zoomer yet."));
    cell.colSpan = colCount.toString();
    classTable.table.append(row);
  }
});

var personalTable = new BSTable("Personal Entries", "table4", {
  editableColumns: "4,5",
  onEdit: function (editedRow) {
    editPersonal($(editedRow[0]));
  },
  // TODO: Add confirm delete? Scary how fast you're able to delete a row
  onBeforeDelete: function (deletedRow) {
    console.log($(deletedRow[0]));
    deletePersonal(deletedRow);
  }
});
chrome.storage.sync.get('personal', function (result) {
  if (result.personal != undefined && result.personal.length != 0) {

    for (const [index, personalObject] of result.personal.entries()) {
      console.log(personalObject)
      var row = $('<tr>').append(`<td id="personalTableIndex">${(index+1).toString()}</td>
      <td id="personalName">${personalObject.entryInfo.name}</td>
      <td id="personalMeetDays">${personalObject.entryInfo.days}</td>
      <td id="personalMeetTime">${removeTags(personalObject.entryInfo.time)}</td>
      <td id="personalURL">${personalObject.url}</td>
      <td id="personalPassword">${personalObject.password}</td>`);
      personalTable.table.append(row);

      // var row = document.createElement('tr');

      // var rowIndex = document.createElement('th');
      // rowIndex.appendChild(document.createTextNode(index.toString()));
      // row.appendChild(rowIndex);

      // var personalName = row.insertCell();
      // personalName.appendChild(document.createTextNode(personalObject.entryInfo.name));


      // var days = row.insertCell();
      // days.appendChild(document.createTextNode(personalObject.entryInfo.days));

      // var time = row.insertCell();
      // time.appendChild(document.createTextNode(removeTags(personalObject.entryInfo.time)));

      // var zoomLink = row.insertCell();
      // zoomLink.appendChild(document.createTextNode(personalObject.url));

      // var password = row.insertCell();
      // var passwordText;
      // if (personalObject.password) {
      //   passwordText = document.createTextNode(personalObject.password)
      // } else {
      //   passwordText = document.createElement("span")
      //   passwordText.className = "no-password";
      //   passwordText.appendChild(document.createTextNode("No Password"))
      // }
      // // password.appendChild(document.createTextNode(classObject.password ? classObject.password : "No Password"));
      // password.appendChild(passwordText);

      // personalTable.table.append(row);
    }
    personalTable.init();
  } else {
    var colCount = personalTable.table[0].rows[0].cells.length

    var row = document.createElement('tr');
    var cell = row.insertCell();
    cell.appendChild(document.createTextNode("No Personal Entries have been added to Ok, Zoomer yet."));
    cell.colSpan = colCount.toString();
    personalTable.table.append(row);
  }
});