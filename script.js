let currentStep = 0; // Current step is 0
const steps = document.getElementsByClassName("form-step");
const stepIndicators = document.getElementsByClassName("step-indicator");

document.addEventListener("DOMContentLoaded", function() {
    showStep(currentStep);
});

function showStep(n) {
    // Hide all steps
    for (let i = 0; i < steps.length; i++) {
        steps[i].style.display = "none";
    }

    // Display the current step
    if (steps[n]) {
        steps[n].style.display = "block";
    }

    // Update button visibility and labels
    if (document.getElementById("prevBtn")) {
        document.getElementById("prevBtn").style.display = n === 0 ? "none" : "inline";
    }
    if (document.getElementById("nextBtn")) {
        document.getElementById("nextBtn").innerHTML = n === (steps.length - 1) ? "Submit" : "Next";
        // For the very last step, the "Next" button might actually be the submit button functionality
        // or we might show a separate submit button. For now, it changes text.
        // If it's the last step, we might want to hide "Next" and show "Submit"
        if (n === (steps.length - 1)) {
             if(document.getElementById("nextBtn")) document.getElementById("nextBtn").style.display = "none";
             if(document.getElementById("submitBtn")) document.getElementById("submitBtn").style.display = "inline";
        } else {
            if(document.getElementById("nextBtn")) document.getElementById("nextBtn").style.display = "inline";
            if(document.getElementById("submitBtn")) document.getElementById("submitBtn").style.display = "none";
        }
    }
    updateStepIndicator(n);
}

function nextPrev(n) {
    // Basic validation for the current step before proceeding
    if (n > 0 && !validateForm()) {
        return false;
    }

    // Hide current step
    if (steps[currentStep]) {
        steps[currentStep].style.display = "none";
    }

    // Increment or decrement current step
    currentStep = currentStep + n;

    if (currentStep >= steps.length) {
        // If we've gone past the last step, submit the form
        // This check might be redundant if "Next" button becomes "Submit"
        submitForm();
        return false;
    }
    showStep(currentStep);
}

function validateForm() {
    let valid = true;
    const currentInputs = steps[currentStep].querySelectorAll("input[required], textarea[required], select[required]");
    
    // Clear all previous general error messages within the current step first
    const allErrorMessages = steps[currentStep].querySelectorAll(".error-message");
    allErrorMessages.forEach(msg => msg.remove());

    // Clear all previous invalid classes
    const allInvalidFields = steps[currentStep].querySelectorAll(".invalid, .invalid-group");
    allInvalidFields.forEach(field => {
        field.classList.remove("invalid");
        field.classList.remove("invalid-group");
    });

    currentInputs.forEach(input => {
        // Note: displayErrorMessage is now called within each validation block if invalid.
        // No need to remove individual error messages here as they are cleared globally at the start of validation.

        if (input.type === "radio") { // Specific handling for required radio groups
            const groupName = input.name;
            // Only process each radio group once
            if (steps[currentStep].querySelector(`input[name="${groupName}"].validation-processed`)) {
                return; // Skip if already processed
            }
            
            const groupRadios = steps[currentStep].querySelectorAll(`input[name="${groupName}"][required]`);
            if (groupRadios.length > 0) { // If any radio in the group is marked required, the group is required
                let groupChecked = false;
                const actualRadiosInGroup = steps[currentStep].querySelectorAll(`input[name="${groupName}"]`);
                actualRadiosInGroup.forEach(radio => {
                    if (radio.checked) {
                        groupChecked = true;
                    }
                    radio.classList.add("validation-processed"); // Mark as processed
                });

                if (!groupChecked) {
                    valid = false;
                    // Add invalid class to the first radio for visual feedback, or better, its container/label
                    groupRadios[0].classList.add("invalid"); 
                    displayErrorMessage(groupRadios[0].closest('.form-group') || groupRadios[0].parentNode, "Please select an option.");
                }
                
                actualRadiosInGroup.forEach(radio => radio.classList.remove("validation-processed")); // Clean up marker
            }
        } else if (input.value.trim() === "") {
            input.classList.add("invalid");
            displayErrorMessage(input, "This field is required.");
            valid = false;
        } else if (input.type === "email" && !/\S+@\S+\.\S+/.test(input.value)) {
            input.classList.add("invalid");
            displayErrorMessage(input, "Please enter a valid email address.");
            valid = false;
        }
        // Add more specific validations as needed (e.g., phone number format)
    });

    // Specific check for required checkbox groups (marked with class "required" on the group div)
    const requiredCheckboxGroups = steps[currentStep].querySelectorAll(".checkbox-group.required");
    requiredCheckboxGroups.forEach(group => {
        const checkboxes = group.querySelectorAll("input[type='checkbox']");
        let isChecked = false;
        checkboxes.forEach(checkbox => {
            if (checkbox.checked) {
                isChecked = true;
            }
        });
        if (!isChecked) {
            valid = false;
            group.classList.add("invalid-group"); // Add class to group for potential styling
            // Display error message for the group. Find a good place, e.g., after the group's label or the group itself.
            // Assuming the label is the first child of form-group, and checkbox-group is inside form-group.
            const formGroup = group.closest('.form-group');
            if (formGroup) {
                displayErrorMessage(formGroup, "Please select at least one option from this group.");
            } else { // Fallback if structure is different
                displayErrorMessage(group, "Please select at least one option from this group.");
            }
        } else {
            group.classList.remove("invalid-group"); // Ensure to remove if valid
        }
    });

    return valid;
}

function displayErrorMessage(elementToAttachMessageAfter, message) {
    const errorDiv = document.createElement("div");
    errorDiv.className = "error-message";
    errorDiv.textContent = message;
    
    // Insert the message after the element or its parent if it's an input inside a simple div.
    // If elementToAttachMessageAfter is a form-group or a specific group div, append to it.
    if (elementToAttachMessageAfter.classList.contains('form-group') || 
        elementToAttachMessageAfter.classList.contains('checkbox-group') || 
        elementToAttachMessageAfter.classList.contains('radio-group')) {
        elementToAttachMessageAfter.appendChild(errorDiv);
    } else if (elementToAttachMessageAfter.parentNode.classList.contains('form-group')) {
         // If it's an input/select/textarea directly within a form-group
        elementToAttachMessageAfter.parentNode.appendChild(errorDiv);
    }
     else {
        // Fallback: insert after the element itself
        elementToAttachMessageAfter.parentNode.insertBefore(errorDiv, elementToAttachMessageAfter.nextSibling);
    }
}


function updateStepIndicator(n) {
    for (let i = 0; i < stepIndicators.length; i++) {
        stepIndicators[i].classList.remove("active");
        stepIndicators[i].classList.remove("finish"); // Remove finish if we go back
    }
    // Mark all previous steps as finished
    for (let i = 0; i < n; i++) {
        if(stepIndicators[i]) stepIndicators[i].classList.add("finish");
    }
    // Mark current step as active
    if(stepIndicators[n]) stepIndicators[n].classList.add("active");
}

function submitForm() {
    // Final validation of all fields (optional, as we validate step-by-step)
    // For now, assume step-by-step validation is sufficient.
    
    // Collect form data
    const formData = new FormData(document.getElementById("inquiryForm"));
    console.log("Form Data Submitted:");
    for (let [key, value] of formData.entries()) {
        console.log(key + ": " + value);
    }
    
    // Display a confirmation message (or send data to a server)
    document.getElementById("inquiryForm").innerHTML = "<h2>Thank You!</h2><p>Your inquiry has been submitted successfully. We will be in touch with you shortly.</p>";
    
    // Hide step indicators and navigation buttons if form is replaced
    if (document.querySelector(".form-navigation")) {
        document.querySelector(".form-navigation").style.display = "none";
    }
    if (document.querySelector("div[style*='text-align:center;margin-top:40px;']")) {
        document.querySelector("div[style*='text-align:center;margin-top:40px;']").style.display = "none";
    }
}

// Attach submitForm to the actual submit button if it's separate
const submitButton = document.getElementById("submitBtn");
if (submitButton) {
    submitButton.addEventListener("click", function(event) {
        event.preventDefault(); // Prevent default form submission
        if (!validateForm()) { // Validate the last step before submitting
            return false;
        }
        submitForm();
    });
}

// Ensure form doesn't submit via default HTML submit action
document.getElementById("inquiryForm").addEventListener("submit", function(event) {
    event.preventDefault(); 
    // This is another place to call submitForm if enter is pressed on the last field,
    // but our button logic should mostly handle it.
    // However, if the "Next" button becomes type="submit" on the last step, this would trigger.
    // For now, our nextBtn changes to "Submit" text but doesn't change type.
    // The separate submitBtn is shown instead.
});

