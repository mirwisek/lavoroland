
document.addEventListener('DOMContentLoaded', function() {
	var compareCheckbox = document.getElementById('fabToggle'); // Assuming this is now the ID of your checkbox
var svgPlaceholder = document.getElementById('svg-placeholder');
var closeSvgViewCheckbox = document.getElementById('close-svg-view'); // Assuming this is now a checkbox too

// Toggle the SVG placeholder based on the checkbox state
compareCheckbox.addEventListener('change', function() {
	if(compareCheckbox.checked) {
		svgPlaceholder.style.display = 'flex';
        document.body.classList.add('no-scroll');
	} else {
		svgPlaceholder.style.display = 'none';
        document.body.classList.remove('no-scroll');
	}
});

// Optionally, if closeSvgViewCheckbox is a separate control to hide the SVG,
// it should uncheck the compareCheckbox.
closeSvgViewCheckbox.addEventListener('change', function() {
	if(!closeSvgViewCheckbox.checked) {
		compareCheckbox.checked = false; // Uncheck the compare checkbox
		svgPlaceholder.style.display = 'none';
        document.body.classList.remove('no-scroll');
	}
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
        // Clear existing chart
        d3.select("#stacked-bar-chart").selectAll("*").remove();
        d3.select("#grouped-bar-chart").selectAll("*").remove();
    });

    // Initial tab active state
    if (tabButtons.length > 0) {
        tabButtons[0].click();
    }

    import('./jobs_compare/script.js').then(d => {
        d.createTheMultiBarChart()
    });
});
