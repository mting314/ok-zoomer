var classTable = new BSTable("table1");

chrome.storage.sync.get('classes', function (result) {
  if (result.classes != undefined && result.classes.length != 0) {

    for (const [index, classObject] of result.classes.entries()) {
      console.log(classObject.classinfo);
      var row = document.createElement('tr');

      var rowIndex = document.createElement('th');
      rowIndex.appendChild(document.createTextNode(index.toString()));
      row.appendChild(rowIndex);

      var className = row.insertCell();
      className.appendChild(document.createTextNode(extractClassName(classObject)));

      var section = row.insertCell();
      section.appendChild(document.createTextNode(classObject.classinfo.class_section));

      var days = row.insertCell();
      days.appendChild(document.createTextNode(classObject.classinfo.meet_days));

      var time = row.insertCell();
      time.appendChild(document.createTextNode(removeTags(classObject.classinfo.meet_times)));

      var zoomLink = row.insertCell();
      zoomLink.appendChild(document.createTextNode(classObject.url));

      var password = row.insertCell();
      var passwordText;
      if (classObject.password) {
        passwordText = document.createTextNode(classObject.password)
      } else {
        // TODO: is there a better way of doing this? Causes problems right now with editing table
        // idea: instead, with a later script come in and replace all empty cells with red "N/A"?
        passwordText = document.createElement("span")
        passwordText.className = "no-password";
        passwordText.appendChild(document.createTextNode("No Password"))
      }
      password.appendChild(passwordText);

      classTable.table.append(row);
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

var personalTable = new BSTable("table4");

chrome.storage.sync.get('personal', function (result) {
  if (result.personal != undefined && result.personal.length != 0) {

    for (const [index, personalObject] of result.personal.entries()) {
      console.log(personalObject.classinfo);
      var row = document.createElement('tr');

      var rowIndex = document.createElement('th');
      rowIndex.appendChild(document.createTextNode(index.toString()));
      row.appendChild(rowIndex);

      var personalName = row.insertCell();
      personalName.appendChild(document.createTextNode(personalObject.entryInfo.name));


      var days = row.insertCell();
      days.appendChild(document.createTextNode(personalObject.entryInfo.days));

      var time = row.insertCell();
      time.appendChild(document.createTextNode(removeTags(personalObject.entryInfo.time)));

      var zoomLink = row.insertCell();
      zoomLink.appendChild(document.createTextNode(personalObject.url));

      var password = row.insertCell();
      var passwordText;
      if (personalObject.password) {
        passwordText = document.createTextNode(personalObject.password)
      } else {
        passwordText = document.createElement("span")
        passwordText.className = "no-password";
        passwordText.appendChild(document.createTextNode("No Password"))
      }
      // password.appendChild(document.createTextNode(classObject.password ? classObject.password : "No Password"));
      password.appendChild(passwordText);

      personalTable.table.append(row);
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