function findElement(arr, propName, propValue) {
    for (var i=0; i < arr.length; i++) {
      if (arr[i][propName] == propValue)
        return arr[i];
    }
  }

function extractClassName(classObject) {
  if(classObject.classinfo){
  return [classObject.classinfo.subj_area_cd, classObject.classinfo.disp_catlg_no].join(' ').replace(/\s+/g, ' ').trim()
  }
  else {
    return [classObject.subj_area_cd, classObject.disp_catlg_no].join(' ').replace(/\s+/g, ' ').trim()
  }
}