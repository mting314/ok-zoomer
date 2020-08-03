// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

let page = document.getElementById('buttonDiv');
const kButtonColors = ['#3aa757', '#e8453c', '#f9bb2d', '#4688f1'];
function constructOptions(kButtonColors) {
  for (const [index, element] of kButtonColors.entries()) {
    let button = document.createElement('button');
    button.style.backgroundColor = element;
    button.textContent = (index*5).toString();
    button.addEventListener('click', function() {
      chrome.storage.sync.set({leeway: index*5}, function() {
        console.log('minutes is ' + index*5);
      })
    });
    page.appendChild(button);
  }
}
constructOptions(kButtonColors);
