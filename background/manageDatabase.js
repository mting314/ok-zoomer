function activateListeners() {
  console.log("activating listeners");
  chrome.runtime.onConnect.addListener(function (port) {
    // console.assert(port.name == "knockknock");
    port.onMessage.addListener(function (msg) {
      console.log(msg);
      // listen for addition requests
      if (msg.type === "addClass") {
        chrome.storage.sync.get({
            classes: []
          },
          function (data) {
            console.log(data.classes);
            addClass(data.classes, msg.toAdd); //storing the storage value in a variable and passing to update function
            createClassAlarm(msg.toAdd);
            port.postMessage({
              type: "reload"
            });
          }
        );
      } else if (msg.type === "addPersonal") {
        chrome.storage.sync.get({
            personal: []
          },
          function (data) {
            console.log(data.personal);
            addPersonal(data.personal, msg.toAdd);
            createPersonalAlarm(msg.toAdd);
            port.postMessage({
              type: "reload"
            });
          }
        );
        // listen for deletion requests
      } else if (msg.type === "deleteClass") {
        chrome.storage.sync.get({
            classes: []
          },
          function (data) {
            try {
              console.log(data.classes);
              var oldClass = deleteClass(data.classes, msg.zoomerID); //storing the storage value in a variable and passing to update function
              deleteAlarm(msg.zoomerID)
              port.postMessage({
                oldClass: oldClass,
                type: "successDeleteClass"
              });
            } catch (err) {
              port.postMessage({
                type: "failureDeleteClass",
                error: err.toString()
              });
            }
          }
        );

      } else if (msg.type === "deletePersonal") {
        chrome.storage.sync.get({
            personal: []
          },
          function (data) {
            try {
              console.log(data.personal);
              // nothing personnel, kiddo
              var oldPersonal = deletePersonal(data.personal, msg.zoomerID);
              deleteAlarm(msg.zoomerID)
              port.postMessage({
                oldPersonal: oldPersonal,
                type: "successDeletePersonal"
              });
            } catch (err) {
              port.postMessage({
                type: "failureDeletePersonal",
                error: err.toString()
              });
            }
          }
        );

        // listen for edit requests
      } else if (msg.type === "editClass") {
        chrome.storage.sync.get({
            classes: []
          },
          function (data) {
            try {
              console.log(data.classes);
              editClass(data.classes, msg.index, msg.newObject);
              port.postMessage({
                type: "successEditClass"
              });
            } catch (err) {
              port.postMessage({
                type: "failureEditClass",
                error: err.toString()
              });
            }
          }
        );

      } else if (msg.type === "editPersonal") {
        chrome.storage.sync.get({
            personal: []
          },
          function (data) {
            try {

              console.log(data.personal);
              editPersonal(data.personal, msg.index, msg.newObject);
              port.postMessage({
                type: "successEditPersonal"
              });
            } catch (err) {
              port.postMessage({
                type: "failureEditPersonal",
                error: err.toString()
              });
            }
          }
        );
      }
    });
  });
}



// --------------------------------------------------
// -- helper functions for adding or editing items in the class or personal entry arrays
// --------------------------------------------------

function addClass(array, toAdd) {
  array.push(toAdd);
  //then call the set to update with modified value
  chrome.storage.sync.set({
    classes: array
  }, function () {
    console.log("added to class list with new values");
  });
}

function editClass(array, index, newObject) {
  var oldClass = array[index];
  array[index] = newObject;
  //then call the set to update with modified value
  chrome.storage.sync.set({
    classes: array
  }, function () {
    console.log(`changed ${oldClass} to ${newObject}`);
  });
}

function deleteClass(array, zoomerID) {
  var oldClass = findElement(array, "zoomerID", zoomerID);
  if (oldClass) {
    array.splice(array.indexOf(oldClass), 1);
    //then call the set to update with modified value
    chrome.storage.sync.set({
      classes: array
    }, function () {
      console.log(`removed ${JSON.stringify(oldClass)} from classes list`);
    });
    return oldClass;
  } else {
    throw "could not find class with id: " + zoomerID;
  }
}

function addPersonal(array, toAdd) {
  array.push(toAdd);
  //then call the set to update with modified value
  chrome.storage.sync.set({
    personal: array
  }, function () {
    console.log("added to personal list with new values");
  });
}

function editPersonal(array, index, newObject) {
  var oldPersonal = array[index];
  array[index] = newObject;
  //then call the set to update with modified value
  chrome.storage.sync.set({
    personal: array
  }, function () {
    console.log(`changed ${oldPersonal} to ${newObject}`);
  });
}

function deletePersonal(array, zoomerID) {
  var oldPersonal = findElement(array, "zoomerID", zoomerID);
  if (oldPersonal) {
    array.splice(array.indexOf(oldPersonal), 1);
    //then call the set to update with modified value
    chrome.storage.sync.set({
      personal: array
    }, function () {
      console.log(`removed ${JSON.stringify(oldPersonal)} from personal entries list`);
    });
    return oldPersonal;
  } else {
    throw "could not find personal entry with id: " + zoomerID;
  }
}