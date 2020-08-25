function updateClipboard(newClip) {
	console.log('updating Clipboard');
	navigator.clipboard.writeText(newClip).then(function () {
		console.log("wrote to clipboard");
	}, function () {
		console.log("failed to write to clipboard");
	});
}



(function () {
	const regex = /.+?(?=<)/

	chrome.storage.sync.get("classes", function (result) {
		var plannerBoxes = document.getElementsByClassName('planneritembox');
		result.classes.forEach(myclass => {
			for (let item of plannerBoxes) {

				// don't overwrite if already has link
				if (item.childNodes[0].tagName == 'A') {
					continue;
				}
				if (item.childNodes[0].wholeText.toUpperCase() == myclass.name.toUpperCase()) {
					if (!item.childNodes[3] || item.childNodes[3].wholeText.toUpperCase() == myclass.type.toUpperCase()) {

						var text = item.childNodes[0].wholeText;

						var link = document.createElement('a');
						item.parentNode.insertBefore(link, item)

						//item.style.border = "3px solid rgb(252, 48, 4)";
						item.style.outline = "thick solid #0000FF;"
						item.style.outlineOffset = "-5px";
						link.href = myclass.url;
						link.target = "_blank"
						if (myclass.password) {
							// link.className = "tooltip"
							link.onclick = function () {
								updateClipboard(myclass.password)
							};
							// var tooltiptext = document.createTextNode(text);
						}
						//link.appendChild(document.createTextNode(text));

						link.appendChild(item);
					}
				}
			}
		});

		// check items in planner we missed
		for (let item of plannerBoxes) {
			console.log(item.parentElement);
			if (!(item.parentElement.tagName == 'A')) {
				var warning = document.createElement('a')

				warning.style = 'float: right; cursor: pointer;';
				warning.href = '#';
				warning.className = 'uit-clickover-bottom';
				warning.setAttribute("data-content", "<div id=&quot;popover_header&quot; class=&quot;warning light&quot;><div class=&quot;icon-warning-sign&quot;></div><span>Warning: Time Conflict</span></div><ul class=&quot;bulleted_list&quot;><li>PHILOS  31</li></ul>");
				warning.setAttribute("data-original-title", "")
				warning.setAttribute("title", "")
				warning.setAttribute("data-clickover-open", "1")

				var warningSpan = document.createElement('span');
				warningSpan.className = "icon-warning-sign"
				item.appendChild(document.createTextNode("Missed one!"));
				warning.appendChild(warningSpan)

				item.appendChild(warning)
			}
		}

	});
})();