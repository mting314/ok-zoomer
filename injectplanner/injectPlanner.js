function updateClipboard(newClip) {
	console.log('updating Clipboard');
	navigator.clipboard.writeText(newClip).then(function () {
		console.log("wrote to clipboard");
	}, function () {
		console.log("failed to write to clipboard");
	});
}

function fillClasses(plannerBoxes, callback) {
	chrome.storage.sync.get("classes", function (result) {
		result.classes.forEach(myclass => {
			for (let item of plannerBoxes) {

				// don't overwrite if already has link
				if (item.childNodes[0].tagName == 'A') {
					continue;
				}
				if (item.childNodes[0].wholeText.toUpperCase() == [myclass.classinfo.subj_area_cd, myclass.classinfo.disp_catlg_no].join(' ').replace(/\s+/g, ' ').trim()) {
					
					if (!item.childNodes[3] || item.childNodes[3].wholeText.toUpperCase() == myclass.classinfo.class_section.toUpperCase()) {
						var link = document.createElement('a');

						item.style.outline = "5px groove " + item.style.borderColor
						// item.style.outlineOffset = "-3px";
						link.href = myclass.url;
						link.target = "_blank"
						if (myclass.password) {
							// link.className = "tooltip"
							link.onclick = function () {
								updateClipboard(myclass.password)
							};
							// var tooltiptext = document.createTextNode(text);
						}

						link.className = "classlink";
						item.classList.add("linkedbox");
						item.appendChild(link);
					}
				}
			}
		});

		callback();
	});
}

// function catchMissed(plannerBoxes) {
// 	// check items in planner we missed
// 	for (let item of plannerBoxes) {
// 		var hasATag = false;
// 		item.childNodes.forEach(
// 			function (currentValue) {
// 				if (currentValue.tagName == "A") {
// 					hasATag = true;
// 					return;
// 				}
// 			}
// 		)
// 		if (!hasATag) {
// 			var warning = document.createElement('a')

// 			warning.style = 'float: right; cursor: pointer;';
// 			warning.href = '#';
// 			warning.className = 'uit-clickover-bottom';
// 			warning.setAttribute("data-content", "<div id=&quot;popover_header&quot; class=&quot;warning light&quot;><div class=&quot;icon-warning-sign&quot;></div><span>Warning: Time Conflict</span></div><ul class=&quot;bulleted_list&quot;><li>PHILOS  31</li></ul>");
// 			warning.setAttribute("data-original-title", "")
// 			warning.setAttribute("title", "")
// 			warning.setAttribute("data-clickover-open", "1")

// 			var warningSpan = document.createElement('span');
// 			warningSpan.className = "icon-warning-sign"
// 			item.appendChild(document.createTextNode("Missed one!"));
// 			warning.appendChild(warningSpan)

// 			item.appendChild(warning);
// 		}
// 	}
// }

(function () {
	var plannerBoxes = document.getElementsByClassName('planneritembox');
	fillClasses(plannerBoxes, function () {
		// catchMissed(plannerBoxes);



	})
})();