
document.addEventListener('DOMContentLoaded', function() {
	var compareBtn = document.getElementById('compare-btn');
	var svgPlaceholder = document.getElementById('svg-placeholder');
	var closeSvgViewBtn = document.getElementById('close-svg-view');

	// Show the SVG placeholder when the Compare button is clicked
	compareBtn.addEventListener('click', function() {
		svgPlaceholder.style.display = 'flex';
        document.body.classList.add('no-scroll');
	});

	// Hide the SVG placeholder when the close button is clicked
	closeSvgViewBtn.addEventListener('click', function() {
		svgPlaceholder.style.display = 'none';
        document.body.classList.remove('no-scroll');
	});
});


// Tabs functionality

document.addEventListener('DOMContentLoaded', function() {
    var tabButtons = document.querySelectorAll('.tab-button');
    var tabContents = document.querySelectorAll('.tab-content');

    // Add click event to each tab button
    tabButtons.forEach(function(btn, index) {
        btn.addEventListener('click', function() {
            // Remove active class from all tab buttons and contents
            tabButtons.forEach(function(button) { button.classList.remove('active'); });
            tabContents.forEach(function(content) { content.classList.remove('active'); });

            // Add active class to the clicked tab and its content
            btn.classList.add('active');
            var target = btn.getAttribute('data-target');
            document.querySelector(target).classList.add('active');
        });
    });


    // Close button functionality
    var closeBtn = document.getElementById('close-svg-view');
    var svgPlaceholder = document.getElementById('svg-placeholder');
    closeBtn.addEventListener('click', function() {
        svgPlaceholder.style.display = 'none';
    });

    // Initial tab active state
    if (tabButtons.length > 0) {
        tabButtons[0].click();
    }

    import('./jobs_compare/script.js').then(d => {
        d.createTheMultiBarChart()
    });
});
