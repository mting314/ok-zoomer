// helper functions for adding or editing items in the class or personal entry arrays

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

function deleteClass(array, index) {
  var oldClass = array[index];
  array.splice(index, 1);
  //then call the set to update with modified value
  chrome.storage.sync.set({
    classes: array
  }, function () {
    console.log(`removed ${JSON.stringify(oldClass)} from classes list`);
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

function deletePersonal(array, index) {
  var oldPersonal = array[index];
  array.splice(index, 1)
  //then call the set to update with modified value
  chrome.storage.sync.set({
    personal: array
  }, function () {
    console.log(`removed ${oldPersonal} from personal entries list`);
  });
}