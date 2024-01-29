
document.addEventListener('DOMContentLoaded', function() {
    var compareCheckbox = document.getElementById('fabToggle'); 
    var svgPlaceholder = document.getElementById('svg-placeholder');
    var closeSvgViewCheckbox = document.getElementById('close-svg-view');

    document.getElementById('dropdownRoleOne').addEventListener('click', function() {
        var dropdown = document.getElementById('dropdownRoleOneDelay');
        dropdown.classList.toggle('hidden');
    });

    document.getElementById('dropdownTwoOne').addEventListener('click', function() {
        var dropdown = document.getElementById('dropdownRoleTwoDelay');
        dropdown.classList.toggle('hidden');
    });
      

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

    import('./mini_histogram_plot.js').then(d => {
        d.drawHistogramPlot('./data/avg_monthly_net_salary_after_tax.csv', '#avgNetSalaryHistogram', 300, 70)
        d.drawHistogramPlot('./data/avg_monthly_rent_in_city.csv', '#rentInCityHistogram', 300, 70)
        d.drawHistogramPlot('./data/avg_monthly_rent_outside_centre.csv', '#rentOutsideCityHistogram', 300, 70)
    });

    // Select all elements with the 'data-scroll' attribute
    var scrollTriggers = document.querySelectorAll('[data-scroll]');

    var tabButtons = document.querySelectorAll('.tab-button');
    var tabContents = document.querySelectorAll('.tab-content');

    // Add click event listener to each scroll trigger
    scrollTriggers.forEach(function(trigger) {
        trigger.addEventListener('click', function() {
            // Get the selector from the 'data-scroll' attribute
            var targetSelector = this.getAttribute('data-scroll');
            var targetElement = document.querySelector(targetSelector);

            if (targetElement) {
                // Scroll to the target element smoothly
                targetElement.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
    

    // Close button functionality
    var closeBtn = document.getElementById('fabToggle');
    var svgPlaceholder = document.getElementById('svg-placeholder');
    closeBtn.addEventListener('click', function() {

        svgPlaceholder.style.display = 'none';
        // Clear existing chart
        d3.select("#stacked-bar-chart").selectAll("*").remove();
        d3.select("#grouped-bar-chart").selectAll("*").remove();

        var expensesDiv = document.getElementById("expenses-checkboxes");
        if (expensesDiv) {
            expensesDiv.innerHTML = ""; // This will remove the content inside the div
}
    });

    // Initial tab active state
    if (tabButtons.length > 0) {
        tabButtons[0].click();
    }

    import('./jobs_compare/script.js').then(d => {
        d.createTheMultiBarChart()
    });
});
