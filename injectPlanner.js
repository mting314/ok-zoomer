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
		console.log(result.classes)
		// var benis = document.getElementsByClassName('planneritembox')
		// var classNames = [];
		// for (var i = 0; i < result.classes.length; i++) {
		// 	console.log(result.classes[i].name);
		// 	classNames.push(result.classes[i].name);
		// }
		// console.log(benis);
		// for (var i = 0; i < benis.length; i++) {
		// 	console.log(benis[i]);
		// 	if (classNames.includes(benis[i].innerHTML.match(regex)[0].toUpperCase())) {
		// 		var matchedClass = benis[i].innerHTML.match(regex)[0].toUpperCase()
		// 		console.log("Found a match: " + benis[i].innerHTML.match(regex)[0]);
		// 		// TODO: Don't use innerHTML!
		// 		var link = document.createElement("a")
		// 		link.href = benis[i];
		// 		var newtext = document.createTextNode("click here!");
		// 		link.appendChild(newtext);
		// 		benis[i].appendChild(link); 
		// 		console.log(benis[i].innerHTML);
		// 		//benis[i].innerHTML = benis[i].innerHTML.replace(regex, findElement(result.classes, 'name', matchedClass)['time'])
		// 	}
		// }
		var benis = document.getElementsByClassName('planneritembox');
		console.log(benis);
		result.classes.forEach(myclass => {
			for (let item of benis) {
				console.log(myclass.name.toUpperCase());

				if (item.childNodes[0].tagName == 'A') {
					break;
				}
				if (item.childNodes[0].wholeText.toUpperCase() == myclass.name.toUpperCase()) {


					var text = item.childNodes[0].wholeText;

					var link = document.createElement('a');
					link.href = myclass.url;
					if (myclass.password) {
						link.className = "tooltip"
						link.onclick = function () {
							updateClipboard(myclass.password)
						};
						// var tooltiptext = document.createTextNode(text);
					} else {
						link.appendChild(document.createTextNode(text));
					}

					item.insertBefore(link, item.childNodes[0])
				}
			}
		});

	});
})();


// just place a div at top right
// var div = document.createElement('div');
// div.style.position = 'fixed';
// div.style.top = 0;
// div.style.right = 0;
// div.textContent = 'Injected!';
// document.body.appendChild(div);