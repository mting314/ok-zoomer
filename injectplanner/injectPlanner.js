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

(function () {
	var plannerBoxes = document.getElementsByClassName('planneritembox');
	fillClasses(plannerBoxes, function () {
		// catchMissed(plannerBoxes);



	})
})();