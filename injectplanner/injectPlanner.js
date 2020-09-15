function updateClipboard(newClip) {
	console.log('updating Clipboard');
	navigator.clipboard.writeText(newClip).then(function () {
		console.log("wrote to clipboard");
	}, function () {
		console.log("failed to write to clipboard");
	});
}

function fillClasses(plannerBoxes) {
	getAllClasses(function (classList) {
		for (var i = 0, myclass; myclass = classList[i]; i++) {
			for (let item of plannerBoxes) {

				// don't overwrite if already has link
				if (item.querySelector(".classlink") != null) {
					console.log(item, "already has a tag");
					continue;
				}
				//if (item.childNodes[0].wholeText.toUpperCase() == [myclass.classInfo.subj_area_cd, myclass.classInfo.disp_catlg_no].join(' ').replace(/\s+/g, ' ').trim()) {
				if (item.childNodes[0].wholeText.toUpperCase() == extractClassName(myclass)) {

					if (!item.childNodes[3] || item.childNodes[3].wholeText.toUpperCase() == myclass.classInfo.class_section.toUpperCase()) {
						var link = document.createElement('a');

						item.style.outline = "5px groove " + item.style.borderColor
						// item.style.outlineOffset = "-3px";
						link.href = myclass.url;
						link.target = "_blank"
						if (myclass.password != undefined) {
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
		};
	});
}


function fillPersonal(plannerBoxes) {
	chrome.storage.sync.get("personal", function (result) {
		result.personal.forEach(personalEntry => {
			for (let item of plannerBoxes) {
				// only check planner boxes that have a single text node, which is the title of the personal entry
				if (item.childNodes.length === 1) {

					// don't overwrite if already has link
					if (item.querySelector(".classlink") != null) {
						console.log("skipping", item);
						continue;
					}
					// TODO: What if two personal entries share name? TBH might not be a way around it, but yeah.
					// Maybe if there's a way to extract date/time info from planner position?
					// I'll just have to hope that 
					if (item.childNodes[0].wholeText.toUpperCase() == personalEntry.entryInfo.name.toUpperCase()) {

						var link = document.createElement('a');

						item.style.outline = "5px groove " + item.style.borderColor
						// item.style.outlineOffset = "-3px";
						link.href = personalEntry.url;
						link.target = "_blank"
						if (personalEntry.password) {
							// link.className = "tooltip"
							link.onclick = function () {
								updateClipboard(personalEntry.password)
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

	});
}

(function () {
	var plannerBoxes = document.getElementsByClassName('planneritembox');
	fillClasses(plannerBoxes);
	fillPersonal(plannerBoxes);



})();