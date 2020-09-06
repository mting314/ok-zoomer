function findElement(arr, propName, propValue) {
  for (var i = 0; i < arr.length; i++) {
    if (arr[i][propName] == propValue)
      return arr[i];
  }
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