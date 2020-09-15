function findElement(arr, propName, propValue) {
  for (var i = 0; i < arr.length; i++) {
    if (arr[i][propName] == propValue)
      return arr[i];
  }
}


// https://stackoverflow.com/a/40995732 - how to callback after filling an array
function getAllClasses(callback) {
  var classList = [];
  chrome.storage.sync.get("classIDs", function (result) {
    // if there are IDs, start filling list
    if (result.classIDs != undefined && result.classIDs.length != 0) {
      let c = result.classIDs.length; // initialize a counter
      result.classIDs.forEach(element => {
        chrome.storage.sync.get(element.toString(), function (foundClass) {
          classList.push(foundClass[element.toString()]);
          if (!--c) { // all async calls are finished
            callback(classList);
          }
        });
      })
    }
    // else return an empty array
    else {
      callback([]);
    }
  });
}


function extractClassName(classObject) {
  if (classObject.classInfo) {
    return [classObject.classInfo.subj_area_cd, classObject.classInfo.disp_catlg_no].join(' ').replace(/\s+/g, ' ').trim()
  } else {
    return [classObject.subj_area_cd, classObject.disp_catlg_no].join(' ').replace(/\s+/g, ' ').trim()
  }
}

function removeTags(str) {
  if ((str === null) || (str === ''))
    return false;
  else
    str = str.toString();

  // Regular expression to identify HTML tags in  
  // the input string. Replacing the identified  
  // HTML tag with a null string. 
  return str.replace(/(<([^>]+)>)/ig, '');
}

function randomID() {
  return Math.round(Date.now() * Math.random());
}