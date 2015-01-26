console.log("query");
sogouExplorer.tabs.query({
	highlighted: true,
}, function (tabs) {
	console.log(tabs);
	if (tabs.length) {
		$('#excludeUrl').val(tabs[0].url);
	}
});

$('#confirmExlude').on("click", function (e) {
	console.log($('#excludeUrl').val());
});