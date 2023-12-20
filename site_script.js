document.addEventListener('DOMContentLoaded', function() {
	var compareBtn = document.getElementById('compare-btn');
	var svgPlaceholder = document.getElementById('svg-placeholder');
	var closeSvgViewBtn = document.getElementById('close-svg-view');

	// Show the SVG placeholder when the Compare button is clicked
	compareBtn.addEventListener('click', function() {
		svgPlaceholder.style.display = 'flex';
	});

	// Hide the SVG placeholder when the close button is clicked
	closeSvgViewBtn.addEventListener('click', function() {
		svgPlaceholder.style.display = 'none';
	});
});
