function activateListeners() {
  console.log("activating listeners");
  chrome.runtime.onConnect.addListener(function (port) {
    // console.assert(port.name == "knockknock");
    port.onMessage.addListener(function (msg) {
      console.log(msg);
      // listen for addition requests
      if (msg.type === "addClass") {
        chrome.storage.sync.get({
            classIDs: []
          },
          function (data) {
            console.log(data.classIDs);

            // this weird setup allows me to add each class as an individual object to the storage
            // importantly, with the zoomerID as the key
            var obj = {};
            obj[msg.toAdd.zoomerID] = msg.toAdd;

            chrome.storage.sync.set(obj, function () {
              console.log(`added ${JSON.stringify(obj)} to class list`);
            });
            addClassID(data.classIDs, msg.toAdd.zoomerID); //storing the storage value in a variable and passing to update function
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
            classIDs: []
          },
          function (data) {
            try {
              console.log(data.classIDs);
              deleteClass(data.classIDs, msg.zoomerID, function (oldClass) { //storing the storage value in a variable and passing to update function
                deleteAlarm(msg.zoomerID)
                port.postMessage({
                  oldClass: oldClass,
                  type: "successDeleteClass"
                });
              });
            } catch (err) {
              port.postMessage({
                type: "failureDeleteClass",
                error: err.toString()
              });
            }
          });
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
        try {
          editClass(msg.zoomerID, msg.newObject);
          port.postMessage({
            type: "successEditClass"
          });
        } catch (err) {
          port.postMessage({
            type: "failureEditClass",
            error: err.toString()
          });
        }

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


// TODO: create class array with IDs, rather than an array of the class objects themselves
function addClassID(array, toAdd) {
  array.push(toAdd);
  //then call the set to update with modified value
  chrome.storage.sync.set({
    classIDs: array
  }, function () {
    console.log(`added ${toAdd} to class IDs`);
  });
}

// zoomerID is a number
function editClass(zoomerID, newObject) {
  var obj = {};
  obj[zoomerID] = newObject;
  //then call the set to update with modified value
  chrome.storage.sync.set(obj, function () {
    console.log(`updating to ${newObject}`);
  });
}

// takes zoomerID as a int
function deleteClass(array, zoomerID, callback) {
  chrome.storage.sync.get(zoomerID.toString(), function (foundClass) {
    var oldClass = foundClass[zoomerID];
    if (oldClass) {
      // if we found a class with that ID, first remove it from classIDs list

      // then remove the class object itself from storage
      chrome.storage.sync.remove(zoomerID.toString(), function (Items) {
        console.log(`removed class from storage`);
      });
      // this should always happen, but just to check: if that id is in the list of classIDs,
      // remove it
      if (array.includes(zoomerID)) {
        array.splice(array.indexOf(zoomerID), 1);
        chrome.storage.sync.set({
          classIDs: array
        }, function () {
          console.log(`removed ${zoomerID} from classIDs list`);
        });
      }
      callback(oldClass);
    } else {
      throw "could not find class with id: " + zoomerID;
    }
  });
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